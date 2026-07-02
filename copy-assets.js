import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');

function copyFile(src, dest) {
  const srcPath = path.join(publicDir, src);
  const destPath = path.join(publicDir, dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Successfully copied ${src} to ${dest}`);
  } else {
    console.warn(`Source file ${src} does not exist, cannot copy to ${dest}`);
  }
}

// Copy the requested icons
copyFile('icon-512.png', 'icon-maskable-512.png');
copyFile('icon-192.png', 'apple-touch-icon.png');
copyFile('icon-192.png', 'favicon.ico');

console.log('PWA asset copy task completed successfully!');
