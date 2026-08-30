const fs = require('fs');
const path = require('path');

const appJsxPath = path.join(__dirname, 'frontend', 'src', 'App.jsx');
let content = fs.readFileSync(appJsxPath, 'utf8');

content = content.replace(/onSeek=\{handleSeek\}/, `onSeek={(t) => { if (window.__bablooAudioRef) window.__bablooAudioRef.currentTime = t; }}`);
content = content.replace(/onToggleLike=\{handleLike\}/, `onToggleLike={toggleLike}`);

fs.writeFileSync(appJsxPath, content);
console.log('Fixed undefined functions in ExpandedPlayer injection.');
