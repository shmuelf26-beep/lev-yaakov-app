// מסד נתונים: SQLite מובנה בנוד (node:sqlite). כל מסמך נשמר מוצפן (AES-256-GCM).
import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE IF NOT EXISTS docs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  rev INTEGER NOT NULL,
  seq INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  blob BLOB NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS docs_seq ON docs(seq);
CREATE INDEX IF NOT EXISTS docs_type ON docs(type);
CREATE TABLE IF NOT EXISTS applied_ops (
  op_id TEXT PRIMARY KEY,
  user_id TEXT,
  result TEXT,
  at TEXT
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  pw_hash TEXT NOT NULL,
  totp_secret TEXT,
  failed INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  ua TEXT
);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT
);
CREATE INDEX IF NOT EXISTS audit_user ON audit(user_id);
CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  to_masked TEXT,
  text TEXT,
  provider TEXT,
  status TEXT,
  ref TEXT
);
`;

export function loadKey(dataDir, env = process.env) {
  if (env.DATA_KEY) {
    const k = Buffer.from(env.DATA_KEY, 'base64');
    if (k.length !== 32) throw new Error('DATA_KEY חייב להיות 32 בתים בקידוד base64');
    return k;
  }
  if (env.NODE_ENV === 'production') {
    throw new Error('בייצור חובה להגדיר DATA_KEY (ראו .env.example)');
  }
  // פיתוח בלבד: מפתח מקומי שנוצר אוטומטית
  fs.mkdirSync(dataDir, { recursive: true });
  const f = path.join(dataDir, 'dev-data.key');
  if (fs.existsSync(f)) return Buffer.from(fs.readFileSync(f, 'utf8').trim(), 'base64');
  const k = crypto.randomBytes(32);
  fs.writeFileSync(f, k.toString('base64'), { mode: 0o600 });
  return k;
}

export function encrypt(key, obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]);
}

export function decrypt(key, blob) {
  const b = Buffer.from(blob);
  const iv = b.subarray(0, 12);
  const tag = b.subarray(12, 28);
  const ct = b.subarray(28);
  const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(tag);
  return JSON.parse(Buffer.concat([d.update(ct), d.final()]).toString('utf8'));
}

export function openDb(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  return db;
}

export function tx(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const r = fn();
    db.exec('COMMIT');
    return r;
  } catch (e) {
    try { db.exec('ROLLBACK'); } catch { /* already rolled back */ }
    throw e;
  }
}

export function nextSeq(db) {
  const row = db.prepare("SELECT v FROM meta WHERE k='seq'").get();
  const n = (row ? Number(row.v) : 0) + 1;
  db.prepare("INSERT INTO meta(k,v) VALUES('seq',?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").run(String(n));
  return n;
}

export function currentSeq(db) {
  const row = db.prepare("SELECT v FROM meta WHERE k='seq'").get();
  return row ? Number(row.v) : 0;
}

export function nowIso() { return new Date().toISOString(); }
