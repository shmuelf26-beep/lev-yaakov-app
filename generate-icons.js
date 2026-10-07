#!/usr/bin/env node

// ייצור icons ל-PWA
// משתמש ב-canvas כדי ליצור icons בגודלים שונים

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../client/public');

console.log('🎨 יוצר icons ל-PWA...');

// יוצר קובץ SVG שמהווה icon
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="512" height="512" fill="#2c3e50"/>

  <!-- Heart shape (לב) -->
  <g transform="translate(256, 220)">
    <!-- Path עבור לב -->
    <path d="M 0 -80 C -50 -130 -120 -100 -120 -20 C -120 60 0 120 0 120 C 0 120 120 60 120 -20 C 120 -100 50 -130 0 -80 Z"
          fill="#e74c3c" opacity="0.9"/>
  </g>

  <!-- Text -->
  <text x="256" y="420" font-family="Arial, sans-serif" font-size="48" font-weight="bold"
        text-anchor="middle" fill="#ffffff" dir="rtl">לב יעקב</text>
</svg>`;

// שמור SVG
const svgPath = path.join(publicDir, 'icon.svg');
fs.writeFileSync(svgPath, svgIcon);
console.log('✓ icon.svg נשמר');

// אם אתה משתמש בcanvas, אתה יכול ליצור PNG
// אבל ללא canvas lib, נשתמש בplaceholder
const placeholderPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

// שמור placeholder icons
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), placeholderPng);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), placeholderPng);
fs.writeFileSync(path.join(publicDir, 'screenshot-1.png'), placeholderPng);

console.log('✓ Icons placeholder נשמרו');
console.log('💡 עצה: לייצור icons אמיתיים, השתמש ב-https://realfavicongenerator.net');
console.log('   או צור icon בתכנה כמו Figma / Adobe XD\n');
