require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Innertube, Platform } = require('youtubei.js');

Platform.shim.eval = (data, env) => {
  const code = data.output + '\nreturn { ...env }';
  return new Function('env', code)(env);
};
const NodeCache = require('node-cache');
const { Readable } = require('stream');

const app = express();
app.use(cors());
app.use(express.json());
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).send({ error: 'Invalid JSON payload' });
  }
  next();
});
const cache = new NodeCache({ stdTTL: 600 });
let ytClient = null;

// Initialize YouTube Client
async function initYT() {
  if (!ytClient) {
    console.log('Initializing YouTube client...');
    ytClient = await Innertube.create({ generate_session_locally: true });
    console.log('YouTube client ready!');
  }
  return ytClient;
}

// Ensure YT initializes on startup
initYT().catch(console.error);

// Utility to format YouTube Music responses
function formatYtSong(item) {
  // Extract high-res thumbnail
  let coverArt = item.thumbnails?.[0]?.url || null;
  if (coverArt) {
    coverArt = coverArt.replace(/w\d+-h\d+/, 'w500-h500');
  }

  return {
    id: item.id || item.video_id,
    title: item.title || 'Unknown Title',
    artist: item.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
    duration: item.duration?.seconds || 0,
    colors: ['#8B5CF6', '#2DD9C8'], // Fallback gradient
    coverArt: coverArt,
    audioStream: `/api/stream/${item.id || item.video_id}`
  };
}

// 1. Search Endpoint
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || !query.trim()) return res.json([]);

    const cacheKey = `search:${query}`;
    if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

    const yt = await initYT();
    const search = await yt.music.search(query, { type: 'song' });
    
    const list = search.contents?.[0]?.contents || search.results || [];
    if (!list.length) return res.json([]);

    const songs = list
      .filter(item => item.type === 'MusicResponsiveListItem' && (item.id || item.video_id))
      .map(formatYtSong);

    cache.set(cacheKey, songs);
    // Cache individual song metadata for JioSaavn fallback in stream endpoint
    songs.forEach(s => cache.set(`songmeta:${s.id}`, { title: s.title, artist: s.artist }, 86400));
    res.json(songs);
  } catch (error) {
    console.error('Search Error:', error.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// 2. Browse/Categories Endpoint
app.get('/api/browse/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const query = `${category} top hits songs`;

    const cacheKey = `browse:${category}`;
    if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

    const yt = await initYT();
    const search = await yt.music.search(query, { type: 'song' });
    
    const list = search.contents?.[0]?.contents || search.results || [];
    if (!list.length) return res.json([]);

    const songs = list
      .filter(item => item.type === 'MusicResponsiveListItem' && (item.id || item.video_id))
      .map(formatYtSong);

    cache.set(cacheKey, songs);
    songs.forEach(s => cache.set(`songmeta:${s.id}`, { title: s.title, artist: s.artist }, 86400));
    res.json(songs);
  } catch (error) {
    console.error('Browse Error:', error.message);
    res.status(500).json({ error: 'Browse failed' });
  }
});

const youtubedl = require('youtube-dl-exec');
const CryptoJS = require('crypto-js');

// ── JioSaavn Fallback Helper ──────────────────────────────────────────────
// When YouTube blocks datacenter IPs, we search the same song on JioSaavn
// and stream the MP4 from their CDN instead.

const SAAVN_KEY = CryptoJS.enc.Utf8.parse('38346591'); // DES-ECB key for decrypting media URLs

function decryptSaavnUrl(encryptedUrl) {
  try {
    const decrypted = CryptoJS.DES.decrypt({
      ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl)
    }, SAAVN_KEY, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });
    
    let url = decrypted.toString(CryptoJS.enc.Utf8);
    // Upgrade to 320kbps if available
    return url.replace('_96.mp4', '_320.mp4');
  } catch (e) {
    throw new Error('crypto-js DES decryption failed: ' + e.message);
  }
}

async function getSaavnStreamUrl(title, artist) {
  // Step 1: Search JioSaavn for the song
  const searchQuery = `${title} ${artist}`.trim();
  const searchUrl = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&query=${encodeURIComponent(searchQuery)}&_format=json&_marker=0&ctx=wap6dot0`;
  
  const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
  const searchData = await searchRes.json();
  
  const firstSong = searchData?.songs?.data?.[0];
  if (!firstSong) throw new Error('Song not found on JioSaavn');
  
  // Step 2: Get full song details (contains encrypted media URL)
  const detailsUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&cc=in&_marker=0%3F_marker%3D0&_format=json&pids=${firstSong.id}`;
  
  const detailsRes = await fetch(detailsUrl, { signal: AbortSignal.timeout(5000) });
  const detailsData = await detailsRes.json();
  
  const songDetails = detailsData.songs?.[0] || Object.values(detailsData)[0];
  if (!songDetails?.encrypted_media_url && !songDetails?.media_preview_url) {
    throw new Error('No media URL from JioSaavn');
  }
  
  // Step 3: Decrypt the media URL
  const streamUrl = decryptSaavnUrl(songDetails.encrypted_media_url);
  return streamUrl;
}

// ── Audio Stream Proxy ────────────────────────────────────────────────────
// Tries YouTube (yt-dlp) first. If that fails, falls back to JioSaavn.
// This ensures local runs use YouTube and cloud deploys use JioSaavn.

app.get('/api/stream/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // 1. Check if we already have a JioSaavn redirect URL cached
    const saavnCacheKey = `saavn-url:${identifier}`;
    if (cache.has(saavnCacheKey)) {
      return res.redirect(cache.get(saavnCacheKey));
    }
    
    // 2. Check cache for a working YouTube URL (to make seeking and re-fetching instant)
    const cacheKey = `stream-url:${identifier}`;
    let cached = cache.get(cacheKey);
    let url, contentType;

    if (cached) {
      url = cached.url;
      contentType = cached.contentType;
    }

    if (!url) {
      // ── Attempt 1: YouTube via yt-dlp ──
      try {
        const fetchPromise = youtubedl(`https://www.youtube.com/watch?v=${identifier}`, {
          dumpSingleJson: true,
          noCheckCertificates: true,
          noWarnings: true,
          preferFreeFormats: true,
          forceIpv4: true,
          geoBypass: true,
          addHeader: [
            'referer:youtube.com',
            'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          ]
        });

        // Enforce a strict 5-second timeout, if YouTube tarpits the connection we want to fallback quickly
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('YouTube fetch timed out')), 5000));
        
        const output = await Promise.race([fetchPromise, timeoutPromise]);
        
        const audioFormats = output.formats.filter(f => f.acodec !== 'none' && f.vcodec === 'none');
        audioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0));
        const bestAudio = audioFormats[0];
        
        if (bestAudio) {
          url = bestAudio.url;
          contentType = bestAudio.ext === 'webm' ? 'audio/webm' : 'audio/mp4';
          cache.set(cacheKey, { url, contentType }, 14400);
          console.log(`[Stream] YouTube success for ${identifier}`);
        }
      } catch (ytError) {
        console.log(`[Stream] YouTube failed for ${identifier}: ${ytError.message}`);
      }

      // ── Attempt 2: JioSaavn fallback ──
      if (!url) {
        console.log(`[Stream] Trying JioSaavn fallback for ${identifier}...`);
        
        try {
          // Look up song title/artist from cache (set during search/browse)
          let meta = cache.get(`songmeta:${identifier}`);
          
          // If not in cache, use query parameters if provided
          if (!meta && req.query.title) {
            meta = {
              title: req.query.title,
              artist: req.query.artist || ''
            };
          }
          
          // If still no meta, try to fetch title from YouTube metadata (with timeout)
          if (!meta) {
            const yt = await initYT();
            const infoPromise = yt.getBasicInfo(identifier);
            const infoTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('YT info timed out')), 4000));
            const info = await Promise.race([infoPromise, infoTimeout]);
            meta = {
              title: info.basic_info?.title || '',
              artist: info.basic_info?.author || ''
            };
          }
          
          const saavnPromise = getSaavnStreamUrl(meta.title, meta.artist);
          const saavnTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Saavn timed out')), 5000));
          const saavnUrl = await Promise.race([saavnPromise, saavnTimeout]);
          
          cache.set(saavnCacheKey, saavnUrl, 14400); // Cache for 4 hours
          console.log(`[Stream] JioSaavn success for "${meta.title}" → Redirecting client directly to CDN`);
          // Redirect the client to the CDN instead of proxying through the server.
          // This prevents JioSaavn from blocking the Render datacenter IP (451 Forbidden)
          // because the client's home IP will be fetching the audio directly.
          return res.redirect(saavnUrl);
        } catch (fbError) {
          console.log(`[Stream] Fallback failed: ${fbError.message}`);
        }
      }
    }

    if (!url) {
      return res.status(404).json({ error: 'No stream available from any source' });
    }
    
    // Set proper headers for audio streaming
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');

    // Handle range requests for seeking support
    const rangeHeader = req.headers.range;
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const response = await fetch(url, { headers: fetchHeaders });
    
    if (!response.ok) {
      throw new Error(`Upstream fetch failed: ${response.status} ${response.statusText}`);
    }
    
    if (rangeHeader && response.status === 206) {
      res.status(206);
      const contentRange = response.headers.get('content-range');
      const contentLength = response.headers.get('content-length');
      if (contentRange) res.setHeader('Content-Range', contentRange);
      if (contentLength) res.setHeader('Content-Length', contentLength);
    } else {
      const contentLength = response.headers.get('content-length');
      if (contentLength) res.setHeader('Content-Length', contentLength);
    }

    // Pipe the audio stream to the client
    const nodeStream = Readable.fromWeb(response.body);
    nodeStream.pipe(res);
    
    // Clean up if client disconnects
    req.on('close', () => {
      nodeStream.destroy();
    });

  } catch (error) {
    console.error(`Audio Stream Error for ${req.params.identifier}:`, error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Stream failed', message: error.message });
    }
  }
});

// 4. Lyrics Endpoint
app.get('/api/lyrics/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `lyrics:${id}`;
    if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

    const yt = await initYT();
    const lyrics = await yt.music.getLyrics(id);
    const lyricsText = lyrics?.description?.text || null;
    
    cache.set(cacheKey, { text: lyricsText }, 86400); // cache for a day
    res.json({ text: lyricsText });
  } catch (error) {
    console.error(`Lyrics Error for ${req.params.id}:`, error.message);
    res.json({ text: null }); // Don't crash, just say no lyrics
  }
});

// Import and mount routers
const authRouter = require('./routes/auth').router;
const userRouter = require('./routes/user');

app.use('/api/auth', authRouter);
app.use('/api/me', userRouter);

// Serve frontend statically in production
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SAREGAMA YouTube Engine running on http://localhost:${PORT}`);
});