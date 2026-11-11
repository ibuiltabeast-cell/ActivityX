const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const filesToSync = ['index.html', 'style.css', 'app.js'];

filesToSync.forEach((file) => {
  const src = path.join(rootDir, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Synced ${file} -> public/${file}`);
  }
});

console.log('Build completed successfully. Ready for Cloudflare deployment.');

