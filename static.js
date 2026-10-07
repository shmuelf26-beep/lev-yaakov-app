// הגשת קבצי static (HTML, CSS, JS) מה-client בנוד.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = path.resolve(__dirname, '../../client');

export function setupStatic(app) {
  // service worker תמיד בעל cache-control קצר
  app.get('/sw.js', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, max-age=3600');
    res.sendFile(path.join(STATIC_DIR, 'public', 'sw.js'));
  });

  // manifest ו-static
  app.use('/public', express.static(path.join(STATIC_DIR, 'public'), {
    maxAge: '1d',
  }));

  app.use('/src', express.static(path.join(STATIC_DIR, 'src'), {
    maxAge: '24h',
  }));

  // index.html עם SPA fallback
  app.get('/', (req, res) => {
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
  });

  // manifest.json ו-icons
  app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(STATIC_DIR, 'public', 'manifest.json'));
  });

  app.get('/icon-:size.png', (req, res) => {
    // TODO: צרו תמונות בגדלים אלה
    res.status(404).send('צריך קובץ PNG');
  });
}
