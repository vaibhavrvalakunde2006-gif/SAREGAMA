/**
 * youtube.js
 * Replacement for play-dl (unmaintained) using youtubei.js (actively maintained).
 *
 * Install:
 *   npm uninstall play-dl
 *   npm install youtubei.js
 *
 * Reuses the SAME cookies you already exported with Cookie-Editor — no need
 * to redo authentication.
 */

const { Innertube } = require('youtubei.js');

let client = null;

/**
 * Call this once at startup, passing the raw cookie string you exported
 * with Cookie-Editor (the same one you were feeding into play-dl).
 *
 * Accepts either:
 *   - a raw "name=value; name2=value2; ..." cookie header string, or
 *   - the JSON array Cookie-Editor exports (we'll convert it for you).
 */
async function initYouTube(cookieInput) {
  const cookieString = normalizeCookies(cookieInput);

  client = await Innertube.create({
    cookie: cookieString,
    generate_session_locally: true, // avoids extra network round trip on init
  });

  console.log('YouTube client authenticated via youtubei.js');
  return client;
}

/**
 * Cookie-Editor can export either a plain header string or a JSON array of
 * { name, value, ... } objects. Normalize both into "a=b; c=d" form.
 */
function normalizeCookies(cookieInput) {
  if (typeof cookieInput === 'string') {
    const trimmed = cookieInput.trim();
    if (trimmed.startsWith('[')) {
      try {
        const arr = JSON.parse(trimmed);
        return arr.map(c => `${c.name}=${c.value}`).join('; ');
      } catch {
        return trimmed; // wasn't actually JSON, assume it's already a header string
      }
    }
    return trimmed;
  }
  if (Array.isArray(cookieInput)) {
    return cookieInput.map(c => `${c.name}=${c.value}`).join('; ');
  }
  throw new Error('Unsupported cookie format passed to initYouTube()');
}

function ensureClient() {
  if (!client) {
    throw new Error('YouTube client not initialized — call initYouTube(cookies) first.');
  }
  return client;
}

/**
 * Search YouTube for videos.
 * Returns a simplified array: [{ id, title, channel, durationText, thumbnail }]
 */
async function searchYouTube(query, limit = 10) {
  const yt = ensureClient();

  const search = await yt.search(query, { type: 'video' });

  const videos = (search.videos || [])
    .filter(v => v && v.id) // guard against non-video shelf items
    .slice(0, limit)
    .map(v => ({
      id: v.id,
      title: v.title?.text ?? v.title ?? 'Unknown title',
      channel: v.author?.name ?? 'Unknown channel',
      durationText: v.duration?.text ?? null,
      thumbnail: v.thumbnails?.[0]?.url ?? null,
    }));

  if (videos.length === 0) {
    throw new Error(`No results found for "${query}"`);
  }

  return videos;
}

/**
 * Get a streamable audio Node.js Readable for a given video ID.
 * Use this in place of play-dl's stream()/play.stream().
 *
 * Usage:
 *   const audio = await streamAudio(videoId);
 *   audio.pipe(someAudioPlayerOrResponse);
 */
async function streamAudio(videoId) {
  const yt = ensureClient();
  const { Readable } = require('stream');

  const webStream = await yt.download(videoId, {
    type: 'audio',
    quality: 'best',
    format: 'mp4', // audio-only mp4 container; change if your player needs another format
  });

  // youtubei.js returns a WHATWG ReadableStream — convert to a Node stream
  // so it works with .pipe() the same way play-dl's stream did.
  return Readable.fromWeb(webStream);
}

module.exports = {
  initYouTube,
  searchYouTube,
  streamAudio,
};