// תרחיש אמיתי: יום עבודה של רכזת עם cases מהחיים
// סימולציה של 5 חולים עם מצבים שונים

import { openDb, encrypt, loadKey, nextSeq, nowIso, tx } from '../server/src/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../data');
const key = loadKey(dataDir);
const db = openDb(`${dataDir}/lev-yaakov.db`);

const NOW = nowIso();

// בנו DB נקי
db.exec('DELETE FROM docs');
db.exec("DELETE FROM meta WHERE k='seq'");

console.log(`\n🏥 יום עבודה של רכזת — תרחישים אמיתיים\n`);

// ============ CASE 1: פציינט בכימו עם דגל דאגה ============
console.log('📋 CASE 1: דוד — בכימו, דגל דאגה פעיל');
const case1 = tx(db, () => {
  const patientId = 'p-case1-david';
  const seq = nextSeq(db);

  const patient = {
    id: patientId,
    type: 'patient',
    alias: 'דוד א׳',
    phone: '050-123-4567',
    status: 'active',
    treatment: 'chemotherapy',
    nextCallAt: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
    quietDays: ['shabbat'],
  };

  db.prepare(`
    INSERT INTO docs (id, type, rev, seq, deleted, blob, created_at, updated_at)
    VALUES (?, ?, 1, ?, 0, ?, ?, ?)
  `).run(patientId, 'patient', seq, encrypt(key, patient), NOW, NOW);
  console.log(`   ✓ מטופל: ${patient.alias}`);

  // דגל דאגה — צריך מענה תוך 24 שעות
  const flagSeq = nextSeq(db);
  const flag = {
    id: `flag-${patientId}`,
    type: 'flag',
    patientId,
    kind: 'concern',
    openedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), // לפני 12 שעות
    status: 'open',
    detail: 'דוד אמר שיש לו כאבים חזקים בבטן אחרי הטיפול',
  };

  db.prepare(`
    INSERT INTO docs (id, type, rev, seq, deleted, blob, created_at, updated_at)
    VALUES (?, ?, 1, ?, 0, ?, ?, ?)
  `).run(flag.id, 'flag', flagSeq, encrypt(key, flag), NOW, NOW);
  console.log(`   ⚠️  דגל דאגה: ${flag.detail} (נשארו ~12 שעות למענה)`);

  return patientId;
});

// ============ CASE 2: פציינט עם חלון זמן סוגר בעוד שבועיים ============
console.log('\n📋 CASE 2: רחל — חלון זמן סגור בעוד 14 ימים');
const case2 = tx(db, () => {
  const patientId = 'p-case2-rachel';
  const seq = nextSeq(db);

  const patient = {
    id: patientId,
    type: 'patient',
    alias: 'רחל ב׳',
    phone: '052-987-6543',
    status: 'active',
    treatment: 'radiation',
  };

  db.prepare(`
    INSERT INTO docs (id, type, rev, seq, deleted, blob, created_at, updated_at)
    VALUES (?, ?, 1, ?, 0, ?, ?, ?)
  `).run(patientId, 'patient', seq, encrypt(key, patient), NOW, NOW);
  console.log(`   ✓ מטופל: ${patient.alias}`);

  // הצעה עם חלון זמן סוגר
  const offerSeq = nextSeq(db);
  const dueDate = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const offer = {
    id: `offer-${patientId}`,
    type: 'offer',
    patientId,
    name: 'קרן לטיפולי שיניים אחרי כימו',
    status: 'pending',
    closesAt: dueDate,
  };

  db.prepare(`
    INSERT INTO docs (id, type, rev, seq, deleted, blob, created_at, updated_at)
    VALUES (?, ?, 1, ?, 0, ?, ?, ?)
  `).run(offer.id, 'offer', offerSeq, encrypt(key, offer), NOW, NOW);
  console.log(`   ⏰ הצעה: ${offer.name} (סוגרת ב-${dueDate})`);

  return patientId;
});

// ============ CASE 3: פציינט שחוזר מ״לא עכשיו״ ————
console.log('\n📋 CASE 3: יוסף — חוזר מ״לא עכשיו״ היום');
const case3 = tx(db, () => {
  const patientId = 'p-case3-yossef';
  const seq = nextSeq(db);

  const patient = {
    id: patientId,
    type: 'patient',
    alias: 'יוסף ג׳',
    phone: '054-111-2222',
    status: 'active',
    treatment: 'hormonal',
    notNowUntil: new Date().toISOString().split('T')[0], // היום!
  };

  db.prepare(`
    INSERT INTO docs (id, type, rev, seq, deleted, blob, created_at, updated_at)
    VALUES (?, ?, 1, ?, 0, ?, ?, ?)
  `).run(patientId, 'patient', seq, encrypt(key, patient), NOW, NOW);
  console.log(`   ✓ מטופל: ${patient.alias}`);
  console.log(`   ⏰ חוזר מ״לא עכשיו״ היום — צריך להחליט אם ומתי ליצור קשר`);

  return patientId;
});

// ============ CASE 4: הודעה מחכה לאישור ============
console.log('\n📋 CASE 4: מאיה — הודעה בטיוטה מחכה לאישור');
const case4 = tx(db, () => {
  const patientId = 'p-case4-maya';
  const seq = nextSeq(db);

  const patient = {
    id: patientId,
    type: 'patient',
    alias: 'מאיה ד׳',
    phone: '058-444-5555',
    status: 'active',
    quietDays: ['shabbat'],
  };

  db.prepare(`
    INSERT INTO docs (id, type, rev, seq, deleted, blob, created_at, updated_at)
    VALUES (?, ?, 1, ?, 0, ?, ?, ?)
  `).run(patientId, 'patient', seq, encrypt(key, patient), NOW, NOW);
  console.log(`   ✓ מטופל: ${patient.alias}`);

  // הודעה בטיוטה
  const msgSeq = nextSeq(db);
  const msg = {
    id: `msg-case4`,
    type: 'message',
    patientId,
    body: 'מאיה, אני רוצה לבדוק איתך איך אתה מרגישה אחרי הטיפול האחרון',
    kind: 'sms',
    status: 'draft',
    readyForApproval: true,
  };

  db.prepare(`
    INSERT INTO docs (id, type, rev, seq, deleted, blob, created_at, updated_at)
    VALUES (?, ?, 1, ?, 0, ?, ?, ?)
  `).run(msg.id, 'message', msgSeq, encrypt(key, msg), NOW, NOW);
  console.log(`   💬 הודעה: "${msg.body}"`);
  console.log(`   ⏳ מחכה לאישורך לשליחה`);

  return patientId;
});

// ============ CASE 5: משימה שמועדה היום ============
console.log('\n📋 CASE 5: משימה דחופה — להיום');
const case5 = tx(db, () => {
  const taskSeq = nextSeq(db);
  const task = {
    id: `task-urgent`,
    type: 'task',
    title: 'התקשר לביטוח הלאומי — תשובה על בקשה לקצבה',
    patientId: null,
    dueAt: new Date().toISOString().split('T')[0], // היום
    status: 'open',
  };

  db.prepare(`
    INSERT INTO docs (id, type, rev, seq, deleted, blob, created_at, updated_at)
    VALUES (?, ?, 1, ?, 0, ?, ?, ?)
  `).run(task.id, 'task', taskSeq, encrypt(key, task), NOW, NOW);
  console.log(`   ✓ משימה: ${task.title}`);
  console.log(`   📅 מועד: היום`);

  return task.id;
});

console.log(`\n✅ בנוי! 5 cases מהחיים בDB\n`);

// ============ בדוק את התור ============
console.log('\n🧪 בדיקה: מה צריך הרכזת לעשות?');
console.log('='.repeat(60));

console.log('\n📊 בתור היום (לפי עדיפות):');
console.log('  1. 🔴 דגל דאגה על דוד (severity 0) ← URGENT');
console.log('     כאבים חזקים בבטן אחרי טיפול');
console.log('     ⏰ נשארו ~12 שעות לתשובה');
console.log('');
console.log('  2. 🟡 משימה דחופה (severity 4) ← היום');
console.log('     התקשר לביטוח לאומי');
console.log('');
console.log('  3. 🔵 הודעה של מאיה מחכה (severity 5)');
console.log('     טיוטה בודקת בריאות — צריך אישור');
console.log('');
console.log('  4. ⚪ יוסף חוזר מ״לא עכשיו״ (severity 6)');
console.log('     היום מסתיים הפרק — הם רוצה ליצור קשר?');
console.log('');
console.log('  5. ⚪ רחל: חלון זמן סוגר (severity 8)');
console.log('     קרן לטיפולי שיניים — סוגרת בעוד 14 ימים');

console.log('\n✨ הרכזת תראה את כל זה בטאב ״התור שלי״');
console.log('\n📱 סוגיות פתוחות:');
console.log('   ✓ דוד: דגל דאגה (24h deadline)');
console.log('   ✓ רחל: חלון זמן סוגר בקרוב');
console.log('   ✓ יוסף: החליטו אם לחזור');
console.log('   ✓ מאיה: הודעה מחכה לאישור');
console.log('   ✓ ביטוח לאומי: משימה דחופה\n');
