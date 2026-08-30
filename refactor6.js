const fs = require('fs');
const path = require('path');

const appJsxPath = path.join(__dirname, 'frontend', 'src', 'App.jsx');
let content = fs.readFileSync(appJsxPath, 'utf8');

const toggleLikeRegex = /  function toggleLike\(songObj\) \{\n    setLiked\(\(prev\) => \{\n      const next = new Set\(prev\);\n      if \(next\.has\(songObj\.id\)\) \{\n        next\.delete\(songObj\.id\);\n      \} else \{\n        next\.add\(songObj\.id\);\n      \}\n      return next;\n    \}\);\n  \}/;

const newToggleLike = `  function toggleLike(songObj) {
    setLiked((prev) => {
      const next = { ...prev };
      if (next[songObj.id]) {
        delete next[songObj.id];
        apiFetch(\`/api/me/liked-songs/\${songObj.id}\`, { method: 'DELETE' }).catch(console.error);
      } else {
        next[songObj.id] = true;
        apiFetch('/api/me/liked-songs', { method: 'POST', body: JSON.stringify({ song: songObj }) }).catch(console.error);
      }
      return next;
    });
  }`;

content = content.replace(toggleLikeRegex, newToggleLike);

fs.writeFileSync(appJsxPath, content);
console.log('Fixed toggleLike to persist to backend.');
