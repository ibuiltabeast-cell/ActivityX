import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const filesToSync = [
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'sw.js'
];

filesToSync.forEach((file) => {
  const src = path.join(rootDir, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Synced ${file} -> public/${file}`);
  }
});

console.log('Build completed successfully. Ready for Cloudflare deployment.');
