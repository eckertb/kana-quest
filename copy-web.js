// Assembles the web assets into ./www for Capacitor (no build tools needed).
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const WWW = path.join(ROOT, 'www');

const FILES = ['index.html', 'styles.css', 'app.js', 'manifest.json', 'sw.js', 'icons'];

fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(WWW, { recursive: true });

for (const f of FILES) {
  fs.cpSync(path.join(ROOT, f), path.join(WWW, f), { recursive: true });
}

console.log(`Web assets copied to ${WWW}`);
