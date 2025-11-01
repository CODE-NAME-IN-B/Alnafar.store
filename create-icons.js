#!/usr/bin/env node

// Script to create PWA icons from logo
const fs = require('fs');
const path = require('path');

console.log('📱 Creating PWA icons...');

// Create simple SVG icons if they don't exist
const createSVGIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#14b8a6" rx="${size * 0.1}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" fill="white">
    🎮
  </text>
  <text x="50%" y="75%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial, sans-serif" font-size="${size * 0.12}" fill="white">
    Alnafar
  </text>
</svg>`;
};

// Create icons directory
const iconsDir = path.join(__dirname, 'frontend', 'public');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create 192x192 icon
const icon192 = createSVGIcon(192);
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.svg'), icon192);
console.log('✅ Created icon-192x192.svg');

// Create 512x512 icon
const icon512 = createSVGIcon(512);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.svg'), icon512);
console.log('✅ Created icon-512x512.svg');

// Create favicon
const favicon = createSVGIcon(32);
fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), favicon);
console.log('✅ Created favicon.svg');

// Create apple touch icon
const appleIcon = createSVGIcon(180);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleIcon);
console.log('✅ Created apple-touch-icon.svg');

console.log('🎉 PWA icons created successfully!');
console.log('Note: For production, consider converting SVG to PNG for better compatibility.');
