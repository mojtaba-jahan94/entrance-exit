const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public');

const svg192 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
  <rect width="192" height="192" rx="42" fill="#1F2933"/>
  <circle cx="96" cy="96" r="64" stroke="#F7F7F2" stroke-width="13" stroke-linecap="round" fill="none"/>
  <polyline points="96 56 96 96 120 110" stroke="#A68A64" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="96" cy="96" r="9" fill="#A68A64"/>
</svg>`;

const svg512 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="#1F2933"/>
  <circle cx="256" cy="256" r="170" stroke="#F7F7F2" stroke-width="34" stroke-linecap="round" fill="none"/>
  <polyline points="256 150 256 256 320 292" stroke="#A68A64" stroke-width="34" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="256" cy="256" r="24" fill="#A68A64"/>
</svg>`;

const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#1F2933"/>
  <circle cx="256" cy="256" r="160" stroke="#F7F7F2" stroke-width="32" stroke-linecap="round" fill="none"/>
  <polyline points="256 160 256 256 315 290" stroke="#A68A64" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="256" cy="256" r="22" fill="#A68A64"/>
</svg>`;

const svgApple = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <rect width="180" height="180" fill="#1F2933"/>
  <circle cx="90" cy="90" r="60" stroke="#F7F7F2" stroke-width="12" stroke-linecap="round" fill="none"/>
  <polyline points="90 52 90 90 112 103" stroke="#A68A64" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="90" cy="90" r="8" fill="#A68A64"/>
</svg>`;

async function run() {
  await sharp(Buffer.from(svg192)).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  await sharp(Buffer.from(svg512)).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  await sharp(Buffer.from(svgMaskable)).png().toFile(path.join(publicDir, 'maskable-icon-512x512.png'));
  await sharp(Buffer.from(svgApple)).png().toFile(path.join(publicDir, 'apple-touch-icon-180x180.png'));
  await sharp(Buffer.from(svgApple)).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Icons generated successfully.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
