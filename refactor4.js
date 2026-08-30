const fs = require('fs');
const path = require('path');

const appJsxPath = path.join(__dirname, 'frontend', 'src', 'App.jsx');
let content = fs.readFileSync(appJsxPath, 'utf8');

// Update `playSong`
const playSongRegex = /  function playSong\(s, context = \[\]\) \{\n    setSong\(s\);\n    setQueueList\(context\);\n    setIsPlaying\(true\);\n    setPlayHistory\(\(h\) => \[s, \.\.\.h\.filter\(\(x\) => x\.id !== s\.id\)\].slice\(0, 40\)\);\n  \}/;
const newPlaySong = `  function playSong(s, context = []) {
    setSong(s);
    setQueueList(context);
    setIsPlaying(true);
    setPlayHistory((h) => [s, ...h.filter((x) => x.id !== s.id)].slice(0, 40));
    apiFetch('/api/me/history', { method: 'POST', body: JSON.stringify({ song: s }) }).catch(console.error);
    apiFetch('/api/me/playback', { method: 'PATCH', body: JSON.stringify({ currentSong: s, queue: context }) }).catch(console.error);
  }`;
content = content.replace(playSongRegex, newPlaySong);

// Update `createPlaylist`
const createPlaylistRegex = /  function createPlaylist\(name\) \{\n    const cols = \[\];\n    setPlaylists\(\(p\) => \[\.\.\.p, \{ id: `p\$\{Date\.now\(\)\}`, name, desc: "Your new playlist\.", songs: \[\], cover: cols \}\]\);\n    setShowCreate\(false\);\n    setView\("library"\);\n  \}/;
const newCreatePlaylist = `  async function createPlaylist(name) {
    try {
      const res = await apiFetch('/api/me/playlists', { method: 'POST', body: JSON.stringify({ name, description: "Your new playlist." }) });
      setPlaylists((p) => [...p, res]);
    } catch(e) { console.error(e); }
    setShowCreate(false);
    setView("library");
  }`;
content = content.replace(createPlaylistRegex, newCreatePlaylist);

// Update `addSongToPlaylist`
const addSongToPlaylistRegex = /  function addSongToPlaylist\(playlistId, songObj\) \{\n    setPlaylists\(\(prev\) =>\n      prev\.map\(\(pl\) => \{\n        if \(pl\.id !== playlistId\) return pl;\n        if \(pl\.songs\.some\(\(s\) => s\.id === songObj\.id\)\) return pl; \/\/ already in playlist\n        return \{ \.\.\.pl, songs: \[\.\.\.pl\.songs, songObj\] \};\n      \}\)\n    \);\n    setAddToPlaylistSong\(null\);\n  \}/;
const newAddSongToPlaylist = `  function addSongToPlaylist(playlistId, songObj) {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        if (pl.songs.some((s) => s.id === songObj.id)) return pl;
        return { ...pl, songs: [...pl.songs, songObj] };
      })
    );
    setAddToPlaylistSong(null);
    apiFetch(\`/api/me/playlists/\${playlistId}/songs\`, { method: 'POST', body: JSON.stringify({ song: songObj }) }).catch(console.error);
  }`;
content = content.replace(addSongToPlaylistRegex, newAddSongToPlaylist);

fs.writeFileSync(appJsxPath, content);
console.log('API sync added to playSong, createPlaylist, and addSongToPlaylist.');
