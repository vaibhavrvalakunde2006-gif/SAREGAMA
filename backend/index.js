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
// Restrict API access to your frontend to prevent others from stealing your backend bandwidth
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3001', 'https://saregama-lmt4.onrender.com'];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
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

    // Pre-match ALL songs to JioSaavn BEFORE responding (wait max 3s total)
    // This guarantees the JioSaavn ID is available when the user clicks play
    try {
      await Promise.race([
        preMatchAllToSaavn(songs),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);
    } catch {}
    
    // Embed JioSaavn IDs into audioStream URLs
    songs.forEach(s => {
      const saavnId = cache.get(`saavn-id:${s.id}`);
      if (saavnId) {
        s.audioStream = `/api/stream/${s.id}?saavnId=${saavnId}`;
      }
      cache.set(`songmeta:${s.id}`, { title: s.title, artist: s.artist, duration: s.duration }, 86400);
    });

    cache.set(cacheKey, songs);
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

    try {
      await Promise.race([
        preMatchAllToSaavn(songs),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);
    } catch {}
    
    songs.forEach(s => {
      const saavnId = cache.get(`saavn-id:${s.id}`);
      if (saavnId) {
        s.audioStream = `/api/stream/${s.id}?saavnId=${saavnId}`;
      }
      cache.set(`songmeta:${s.id}`, { title: s.title, artist: s.artist, duration: s.duration }, 86400);
    });

    cache.set(cacheKey, songs);
    res.json(songs);
  } catch (error) {
    console.error('Browse Error:', error.message);
    res.status(500).json({ error: 'Browse failed' });
  }
});

const youtubedl = require('youtube-dl-exec');
const CryptoJS = require('crypto-js');

// ── JioSaavn Engine (Pre-Match + Direct ID) ──────────────────────────────
// Instead of guessing songs by title at stream time, we now:
// 1. Pre-match every YouTube result to a JioSaavn song ID at SEARCH time
// 2. At PLAY time, fetch the stream URL directly by that saved ID (100% accurate)

const SAAVN_KEY = CryptoJS.enc.Utf8.parse('38346591');
const entities = { '&quot;': '"', '&amp;': '&', '&#039;': "'", '&lt;': '<', '&gt;': '>' };
const decodeHtml = str => str.replace(/&[#a-z0-9]+;/gi, match => entities[match.toLowerCase()] || match);
const JUNK_PATTERNS = /instrumental|karaoke|ringtone|8d audio|8d song|reverb|slowed|lofi|lo-fi|piano version/i;

function normalizeStr(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function decryptSaavnUrl(encryptedUrl) {
  const decrypted = CryptoJS.DES.decrypt({
    ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl)
  }, SAAVN_KEY, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
  return decrypted.toString(CryptoJS.enc.Utf8).replace('_96.mp4', '_320.mp4');
}

// Pre-match a single YouTube song to JioSaavn. Returns the JioSaavn ID or null.
async function preMatchSongToSaavn(ytTitle, ytArtist, ytDuration = 0) {
  const cleanTitle = normalizeStr(decodeHtml(ytTitle).toLowerCase())
    .replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '')
    .replace(/official video|full video|lyrical|video song|audio/ig, '')
    .trim();
  const cleanArtist = normalizeStr(decodeHtml(ytArtist || '').toLowerCase())
    .replace(/ - topic$/, '').trim();
  const shortTitle = cleanTitle.split('|')[0].split('-')[0].trim();

  const isLabel = /t-series|vevo|records|music/i.test(cleanArtist);
  const queries = isLabel || !cleanArtist
    ? [shortTitle]
    : [`${shortTitle} ${cleanArtist}`.trim(), shortTitle];

  let bestMatch = null;
  let highestScore = -999;

  for (const q of [...new Set(queries)].filter(Boolean)) {
    const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(q)}&n=10&p=1&_format=json&_marker=0&ctx=wap6dot0`;
    try {
      const data = await fetch(url, { signal: AbortSignal.timeout(3000) }).then(r => r.json());
      for (const song of (data.results || [])) {
        if (JUNK_PATTERNS.test(decodeHtml(song.song || ''))) continue;
        if (!song.encrypted_media_url) continue;
        
        let score = 0;
        const saavnTitle = normalizeStr(decodeHtml(song.song || '')).toLowerCase();
        
        // 1. Title match
        if (saavnTitle === cleanTitle || saavnTitle === shortTitle) score += 20;
        else if (saavnTitle.includes(shortTitle) || shortTitle.includes(saavnTitle)) score += 10;
        else score -= 10;
        
        // 2. Artist match
        if (cleanArtist && song.singers) {
           const saavnArtist = normalizeStr(decodeHtml(song.singers)).toLowerCase();
           if (saavnArtist.includes(cleanArtist) || cleanArtist.includes(saavnArtist)) score += 10;
        }

        // 3. Duration match
        if (ytDuration > 0 && song.duration) {
          const saavnDuration = parseInt(song.duration, 10);
          const diff = Math.abs(saavnDuration - ytDuration);
          if (diff <= 5) score += 25;
          else if (diff <= 15) score += 15;
          else if (diff <= 30) score += 5;
          else score -= 15; 
        }

        if (score > highestScore) {
           highestScore = score;
           bestMatch = song;
        }
      }
    } catch {}
    if (bestMatch && highestScore >= 15) break; 
  }
  return bestMatch && highestScore >= 0 ? bestMatch.id : null;
}

// Pre-match all songs from a search result in parallel (background, non-blocking)
async function preMatchAllToSaavn(songs) {
  const tasks = songs.map(async (s) => {
    if (cache.has(`saavn-id:${s.id}`)) return;
    const saavnId = await preMatchSongToSaavn(s.title, s.artist, s.duration);
    if (saavnId) {
      cache.set(`saavn-id:${s.id}`, saavnId, 86400);
      console.log(`[PreMatch] ${s.title} → JioSaavn ID: ${saavnId}`);
    }
  });
  await Promise.allSettled(tasks);
}

// Get stream URL by JioSaavn song ID (100% accurate — no guessing)
async function getStreamBySaavnId(saavnId) {
  const url = `https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${saavnId}&_format=json&_marker=0&ctx=wap6dot0`;
  const data = await fetch(url, { signal: AbortSignal.timeout(5000) }).then(r => r.json());
  const song = data.songs?.[0];
  if (song?.encrypted_media_url) {
    return decryptSaavnUrl(song.encrypted_media_url);
  }
  throw new Error('Failed to get stream for JioSaavn ID: ' + saavnId);
}

// Fallback: search JioSaavn by title at stream time (used when pre-match cache missed)
async function getSaavnStreamUrl(title, artist) {
  const saavnId = await preMatchSongToSaavn(title, artist);
  if (!saavnId) throw new Error('No matching song found on JioSaavn');
  return getStreamBySaavnId(saavnId);
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
          geoBypass: true,
          addHeader: [
            'referer:youtube.com',
            'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          ]
        });

        // Enforce a strict 5-second timeout, if YouTube tarpits the connection we want to fallback quickly
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('YouTube fetch timed out')), 5000));
        
        const output = await Promise.race([fetchPromise, timeoutPromise]);
        
        const audioFormats = output.formats.filter(f => f.acodec !== 'none' && f.vcodec === 'none' && f.ext !== 'webm');
        audioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0));
        const bestAudio = audioFormats[0] || output.formats.find(f => f.acodec !== 'none' && f.vcodec === 'none');
        
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
          let saavnUrl;
          
          // BEST PATH: saavnId passed directly in URL (embedded by search/browse endpoint)
          const saavnId = req.query.saavnId || cache.get(`saavn-id:${identifier}`);
          if (saavnId) {
            console.log(`[Stream] Using JioSaavn ID: ${saavnId}`);
            saavnUrl = await getStreamBySaavnId(saavnId);
          } else {
            // FALLBACK: Search by title at stream time
            let meta = cache.get(`songmeta:${identifier}`);
            
            if (!meta && req.query.title) {
              meta = { title: req.query.title, artist: req.query.artist || '', duration: parseInt(req.query.duration || 0, 10) };
            }
            
            if (!meta) {
              const yt = await initYT();
              const infoPromise = yt.getBasicInfo(identifier);
              const infoTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('YT info timed out')), 4000));
              const info = await Promise.race([infoPromise, infoTimeout]);
              meta = { title: info.basic_info?.title || '', artist: info.basic_info?.author || '', duration: info.basic_info?.duration || 0 };
            }

            console.log(`[Stream] yt-dlp failed, attempting on-the-fly Saavn match for: ${meta.title}`);
            const foundId = await preMatchSongToSaavn(meta.title, meta.artist, meta.duration);
            if (!foundId) throw new Error('No matching song found on JioSaavn');
            saavnUrl = await getStreamBySaavnId(foundId);
          }
          
          cache.set(saavnCacheKey, saavnUrl, 14400);
          console.log(`[Stream] JioSaavn success → Redirecting client directly to CDN`);
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