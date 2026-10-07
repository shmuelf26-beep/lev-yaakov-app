// יצור נתוני בדיקה בDB
import { openDb, encrypt, loadKey, nextSeq, nowIso, tx } from '../server/src/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../data');
const key = loadKey(dataDir);
const db = openDb(`${dataDir}/lev-yaakov.db`);

const NOW = nowIso();

// נתוני בדיקה
const patients = [
  {
    id: 'p-001',
    type: 'patient',
    alias: 'דוד א׳',
    phone: '050-123-4567',
    status: 'active',
    treatment: 'chemotherapy',
    nextCallAt: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
    quietDays: ['shabbat', 'chag'],
    quietHours: { from: '20:30', to: '08:30' },
  },
  {
    id: 'p-002',
    type: 'patient',
    alias: 'רחל ב׳',
    phone: '052-987-6543',
    status: 'active',
    treatment: 'radiation',
    nextCallAt: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'p-003',
    type: 'patient',
    alias: 'יוסף ג׳',
    phone: '054-111-2222',
    status: 'active',
    notNowUntil: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
];

const messages = [
  {
    id: 'msg-001',
    type: 'message',
    patientId: 'p-001',
    body: 'שלום דוד, איך אתה מרגיש? אנא חזור בשיחה',
    kind: 'sms',
    status: 'pending',
    createdAt: NOW,
  },
  {
    id: 'msg-002',
    type: 'message',
    patientId: 'p-002',
    body: 'רחל, כאן רכזת התמיכה. יש לי כמה דברים לכם',
    kind: 'sms',
    status: 'draft',
    readyForApproval: true,
  },
];

const tasks = [
  {
    id: 'task-001',
    type: 'task',
    title: 'התקשר לדוד — בדיקת בריאות',
    patientId: 'p-001',
    dueAt: new Date().toISOString().split('T')[0],
    status: 'open',
  },
  {
    id: 'task-002',
    type: 'task',
    title: 'בדוק אם קבלה הצעה של קרן לרחל',
    patientId: 'p-002',
    dueAt: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'open',
  },
];

const flags = [
  {
    id: 'flag-001',
    type: 'flag',
    patientId: 'p-001',
    kind: 'concern',
    openedAt: NOW,
    status: 'open',
  },
];

const offers = [
  {
    id: 'offer-001',
    type: 'offer',
    patientId: 'p-002',
    name: 'קרן לטיפולי השיניים',
    status: 'pending',
    closesAt: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
  },
];

const allDocs = [...patients, ...messages, ...tasks, ...flags, ...offers];

console.log(`📝 יוצר ${allDocs.length} מסמכים בנתונים בדיקה...`);

tx(db, () => {
  for (const doc of allDocs) {
    const seq = nextSeq(db);
    const blob = encrypt(key, doc);
    db.prepare(`
      INSERT INTO docs (id, type, rev, seq, deleted, blob, created_at, updated_at)
      VALUES (?, ?, 1, ?, 0, ?, ?, ?)
    `).run(doc.id, doc.type, seq, blob, NOW, NOW);
    console.log(`✓ ${doc.id}`);
  }
});

console.log(`✅ בנוי! ${allDocs.length} מסמכים בDB`);
console.log(`📊 תור צריך לכלול:`);
console.log(`   - דגל דאגה על דוד (severity 0)`);
console.log(`   - משימה היום (severity 4)`);
console.log(`   - משימה בעוד 3 ימים (severity 6)`);
console.log(`   - הודעה מחכה לאישור (severity 5)`);
console.log(`   - יוסף חוזר מ״לא עכשיו״ (severity 6)`);
