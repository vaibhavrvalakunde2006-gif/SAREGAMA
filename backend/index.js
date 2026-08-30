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
    res.json(songs);
  } catch (error) {
    console.error('Browse Error:', error.message);
    res.status(500).json({ error: 'Browse failed' });
  }
});

const youtubedl = require('youtube-dl-exec');

// 3. Audio Stream Proxy (pipe through our server to avoid CORS issues)
app.get('/api/stream/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Check cache for a working URL (to make seeking and re-fetching instant)
    const cacheKey = `stream-url:${identifier}`;
    let cached = cache.get(cacheKey);
    let url, contentType;

    if (cached) {
      url = cached.url;
      contentType = cached.contentType;
    }

    if (!url) {
      // Use yt-dlp to get a working stream URL (bypasses 403 errors)
      const output = await youtubedl(`https://www.youtube.com/watch?v=${identifier}`, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: [
          'referer:youtube.com',
          'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
      });
      
      const audioFormats = output.formats.filter(f => f.acodec !== 'none' && f.vcodec === 'none');
      audioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0));
      const bestAudio = audioFormats[0];
      
      if (!bestAudio) {
        return res.status(404).json({ error: 'No stream available' });
      }

      url = bestAudio.url;
      contentType = bestAudio.ext === 'webm' ? 'audio/webm' : 'audio/mp4';
      
      // Cache URL and content type together for 4 hours (YouTube URLs usually expire after 6 hours)
      cache.set(cacheKey, { url, contentType }, 14400);
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
      res.status(500).json({ error: 'Stream failed' });
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