// סרבר Express — השרת הראשי של האפליקציה
import express from 'express';
import cors from 'cors';
import { openDb, loadKey, tx } from './db.js';
import { setupRoutes } from './routes.js';
import { setupStatic } from './static.js';

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || './data';

// middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

// תחזוקה בסיסית
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// בדיקה בריאותית
app.get('/health', (req, res) => {
  res.json({ ok: true, version: '0.1.0' });
});

// טעינת DB ומפתח הצפנה
const key = loadKey(DATA_DIR);
const db = openDb(`${DATA_DIR}/lev-yaakov.db`);

// setup routes
setupRoutes(app, { db, key });

// setup static files (must be after API routes)
setupStatic(app);

// middleware שגיאות
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const code = err.statusCode || 500;
  const msg = process.env.NODE_ENV === 'production' ? 'שגיאה פנימית' : err.message;
  res.status(code).json({ error: msg });
});

// התחלה
app.listen(PORT, () => {
  console.log(`✓ סרבר בפעולה על ${PORT}`);
  console.log(`  http://localhost:${PORT}/health`);
});

export { app, db, key };
