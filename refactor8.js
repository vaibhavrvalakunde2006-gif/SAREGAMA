const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend', 'src', 'App.jsx');
let code = fs.readFileSync(file, 'utf8');

// Fix PlayerBar onExpand duplication
code = code.replace(
  /onExpand=\{\(\) => setIsExpanded\(true\)\}\s*repeat=\{repeat\}\s*setRepeat=\{setRepeat\}\s*onExpand=\{\(\) => setShowNowPlaying\(true\)\}/g,
  `repeat={repeat}\n        setRepeat={setRepeat}\n        onExpand={() => setIsExpanded(true)}`
);

// Fix NowPlayingScreen duplication if any
code = code.replace(
  /setShuffle=\{setShuffle\}\s*onExpand=\{\(\) => setIsExpanded\(true\)\}\s*repeat=\{repeat\}/g,
  `setShuffle={setShuffle}\n          repeat={repeat}`
);

fs.writeFileSync(file, code);
console.log('Fixed onExpand duplication.');
