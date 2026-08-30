const fs = require('fs');
const path = require('path');

const appJsxPath = path.join(__dirname, 'frontend', 'src', 'App.jsx');
let content = fs.readFileSync(appJsxPath, 'utf8');

// Fix initAuth liked handling
content = content.replace(
  `          if (lk && lk.length) {
            const likedMap = {};
            lk.forEach(s => { likedMap[s.id] = true; });
            setLiked(likedMap);
          }`,
  `          if (lk && lk.length) {
            setLiked(new Set(lk.map(s => s.id)));
          }`
);

// Re-fix toggleLike
const newToggleLike = `  function toggleLike(songObj) {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(songObj.id)) {
        next.delete(songObj.id);
        apiFetch(\`/api/me/liked-songs/\${songObj.id}\`, { method: 'DELETE' }).catch(console.error);
      } else {
        next.add(songObj.id);
        apiFetch('/api/me/liked-songs', { method: 'POST', body: JSON.stringify({ song: songObj }) }).catch(console.error);
      }
      return next;
    });
  }`;
  
// I'll replace the object-based toggleLike with this Set-based one.
content = content.replace(/  function toggleLike\(songObj\) \{\n    setLiked\(\(prev\) => \{\n      const next = \{ \.\.\.prev \};\n      if \(next\[songObj\.id\]\) \{\n        delete next\[songObj\.id\];\n        apiFetch\(`\/api\/me\/liked-songs\/\$\{songObj\.id\}`\, \{ method: 'DELETE' \}\)\.catch\(console\.error\);\n      \} else \{\n        next\[songObj\.id\] = true;\n        apiFetch\('\/api\/me\/liked-songs', \{ method: 'POST', body: JSON\.stringify\(\{ song: songObj \}\) \}\)\.catch\(console\.error\);\n      \}\n      return next;\n    \}\);\n  \}/g, newToggleLike);

fs.writeFileSync(appJsxPath, content);
console.log('Restored liked to a Set to prevent crashes.');
