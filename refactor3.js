const fs = require('fs');
const path = require('path');

const appJsxPath = path.join(__dirname, 'frontend', 'src', 'App.jsx');
let content = fs.readFileSync(appJsxPath, 'utf8');

content = content.replace(
  /setShuffle=\{setShuffle\}/g,
  `setShuffle={setShuffle}\n        onExpand={() => setIsExpanded(true)}`
);

fs.writeFileSync(appJsxPath, content);
console.log('Added onExpand prop to PlayerBar.');
