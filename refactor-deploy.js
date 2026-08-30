const fs = require('fs');
const path = require('path');

const indexJsPath = path.join(__dirname, 'backend', 'index.js');
let code = fs.readFileSync(indexJsPath, 'utf8');

if (!code.includes('express.static')) {
  code = code.replace(
    /const PORT = process\.env\.PORT \|\| 3001;/,
    `// Serve frontend statically in production
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3001;`
  );
  fs.writeFileSync(indexJsPath, code);
  console.log('Backend updated to serve frontend.');
}
