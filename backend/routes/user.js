const express = require('express');
const db = require('../db');
const { authMiddleware } = require('./auth');
const crypto = require('crypto');

const router = express.Router();
router.use(authMiddleware);

// --- LIKED SONGS ---
router.get('/liked-songs', (req, res) => {
  const songs = db.prepare('SELECT song_data, liked_at FROM liked_songs WHERE user_id = ? ORDER BY liked_at DESC').all(req.user.id);
  res.json(songs.map(s => JSON.parse(s.song_data)));
});

router.post('/liked-songs', (req, res) => {
  const { song } = req.body;
  if (!song || !song.id) return res.status(400).json({ error: 'Song required' });
  
  try {
    db.prepare('INSERT OR IGNORE INTO liked_songs (user_id, song_id, song_data) VALUES (?, ?, ?)')
      .run(req.user.id, song.id, JSON.stringify(song));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to like song' });
  }
});

router.delete('/liked-songs/:id', (req, res) => {
  db.prepare('DELETE FROM liked_songs WHERE user_id = ? AND song_id = ?').run(req.user.id, req.params.id);
  res.json({ success: true });
});

// --- HISTORY ---
router.get('/history', (req, res) => {
  const history = db.prepare('SELECT song_data, played_at FROM history WHERE user_id = ? ORDER BY played_at DESC LIMIT 50').all(req.user.id);
  res.json(history.map(h => ({ ...JSON.parse(h.song_data), playedAt: h.played_at })));
});

router.post('/history', (req, res) => {
  const { song } = req.body;
  if (!song || !song.id) return res.status(400).json({ error: 'Song required' });
  
  db.prepare('INSERT INTO history (user_id, song_id, song_data) VALUES (?, ?, ?)')
    .run(req.user.id, song.id, JSON.stringify(song));
  res.json({ success: true });
});

router.delete('/history/:id', (req, res) => {
  db.prepare('DELETE FROM history WHERE user_id = ? AND song_id = ?').run(req.user.id, req.params.id);
  res.json({ success: true });
});

router.delete('/history', (req, res) => {
  db.prepare('DELETE FROM history WHERE user_id = ?').run(req.user.id);
  res.json({ success: true });
});

// --- PLAYLISTS ---
router.get('/playlists', (req, res) => {
  const playlists = db.prepare('SELECT * FROM playlists WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  
  const result = playlists.map(p => {
    const songs = db.prepare('SELECT song_data FROM playlist_songs WHERE playlist_id = ? ORDER BY added_at ASC').all(p.id);
    return {
      ...p,
      songs: songs.map(s => JSON.parse(s.song_data))
    };
  });
  res.json(result);
});

router.post('/playlists', (req, res) => {
  const { name, description, coverImage } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  
  const id = 'p_' + crypto.randomBytes(8).toString('hex');
  db.prepare('INSERT INTO playlists (id, user_id, name, description, cover_image) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.user.id, name, description || '', coverImage || null);
  
  res.json({ id, name, description, coverImage, songs: [] });
});

router.patch('/playlists/:id', (req, res) => {
  const { name, description } = req.body;
  // Verify ownership
  const p = db.prepare('SELECT id FROM playlists WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!p) return res.status(404).json({ error: 'Not found' });

  db.prepare('UPDATE playlists SET name = ?, description = ? WHERE id = ?')
    .run(name, description, req.params.id);
  res.json({ success: true });
});

router.delete('/playlists/:id', (req, res) => {
  db.prepare('DELETE FROM playlists WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

router.post('/playlists/:id/songs', (req, res) => {
  const { song } = req.body;
  if (!song || !song.id) return res.status(400).json({ error: 'Song required' });
  
  // Verify ownership
  const p = db.prepare('SELECT id FROM playlists WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!p) return res.status(404).json({ error: 'Not found' });

  db.prepare('INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id, song_data) VALUES (?, ?, ?)')
    .run(req.params.id, song.id, JSON.stringify(song));
  res.json({ success: true });
});

router.delete('/playlists/:id/songs/:songId', (req, res) => {
  // Verify ownership
  const p = db.prepare('SELECT id FROM playlists WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!p) return res.status(404).json({ error: 'Not found' });

  db.prepare('DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?')
    .run(req.params.id, req.params.songId);
  res.json({ success: true });
});

// --- PODCASTS & AUDIOBOOKS PROGRESS ---
router.get('/podcasts/progress', (req, res) => {
  const data = db.prepare('SELECT * FROM podcasts_progress WHERE user_id = ?').all(req.user.id);
  res.json(data);
});

router.post('/podcasts/progress', (req, res) => {
  const { podcastId, episodeId, progress } = req.body;
  db.prepare('INSERT INTO podcasts_progress (user_id, podcast_id, episode_id, progress) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, podcast_id, episode_id) DO UPDATE SET progress=excluded.progress, updated_at=CURRENT_TIMESTAMP')
    .run(req.user.id, podcastId, episodeId, progress);
  res.json({ success: true });
});

router.get('/audiobooks/progress', (req, res) => {
  const data = db.prepare('SELECT * FROM audiobooks_progress WHERE user_id = ?').all(req.user.id);
  res.json(data);
});

router.post('/audiobooks/progress', (req, res) => {
  const { bookId, chapterId, progress } = req.body;
  db.prepare('INSERT INTO audiobooks_progress (user_id, book_id, chapter_id, progress) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, book_id, chapter_id) DO UPDATE SET progress=excluded.progress, updated_at=CURRENT_TIMESTAMP')
    .run(req.user.id, bookId, chapterId, progress);
  res.json({ success: true });
});

// --- DOWNLOADS ---
router.get('/downloads', (req, res) => {
  const songs = db.prepare('SELECT song_data FROM downloads WHERE user_id = ?').all(req.user.id);
  res.json(songs.map(s => JSON.parse(s.song_data)));
});

router.post('/downloads', (req, res) => {
  const { song } = req.body;
  db.prepare('INSERT OR IGNORE INTO downloads (user_id, song_id, song_data) VALUES (?, ?, ?)')
    .run(req.user.id, song.id, JSON.stringify(song));
  res.json({ success: true });
});

router.delete('/downloads/:id', (req, res) => {
  db.prepare('DELETE FROM downloads WHERE user_id = ? AND song_id = ?').run(req.user.id, req.params.id);
  res.json({ success: true });
});

// --- PREFERENCES & STATE ---
router.get('/preferences', (req, res) => {
  const row = db.prepare('SELECT preferences_data FROM preferences WHERE user_id = ?').get(req.user.id);
  res.json(row ? JSON.parse(row.preferences_data) : {});
});

router.patch('/preferences', (req, res) => {
  db.prepare('INSERT INTO preferences (user_id, preferences_data) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET preferences_data=excluded.preferences_data')
    .run(req.user.id, JSON.stringify(req.body));
  res.json({ success: true });
});

router.get('/playback', (req, res) => {
  const row = db.prepare('SELECT state_data FROM playback_state WHERE user_id = ?').get(req.user.id);
  res.json(row ? JSON.parse(row.state_data) : {});
});

router.patch('/playback', (req, res) => {
  db.prepare('INSERT INTO playback_state (user_id, state_data) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET state_data=excluded.state_data')
    .run(req.user.id, JSON.stringify(req.body));
  res.json({ success: true });
});

module.exports = router;
