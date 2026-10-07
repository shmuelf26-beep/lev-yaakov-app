// כללי התחום שהשרת אוכף, כדי שיחולו גם אם הלקוח (מחשב או טלפון) טועה.
// המקור: הסקיל והאפיון של העמותה (ניטרליות ב-SMS, שעות שקטות, שבת וחגים, פטירה, דגל דאגה, חלונות זמן).

export const TZ = 'Asia/Jerusalem';

const PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
});
const HEB = new Intl.DateTimeFormat('en-u-ca-hebrew', { timeZone: TZ, day: 'numeric', month: 'long' });
const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** חלקי תאריך בשעון ירושלים */
export function parts(d) {
  const o = {};
  for (const p of PARTS.formatToParts(d)) o[p.type] = p.value;
  const hm = Number(o.hour) * 60 + Number(o.minute);
  const h = {};
  for (const p of HEB.formatToParts(d)) h[p.type] = p.value;
  return {
    y: Number(o.year), m: Number(o.month), d: Number(o.day), hm,
    dow: DOW[o.weekday], ymd: `${o.year}-${o.month}-${o.day}`,
    hebDay: Number(h.day), hebMonth: String(h.month || '').toLowerCase(),
  };
}

export function toMinutes(hhmm, fallback) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
  if (!m) return fallback;
  return Number(m[1]) * 60 + Number(m[2]);
}

// חגי ישראל (יום אחד בגלות נחשב כאן כיום חג מלא): ראש השנה, יום כיפור, סוכות, שמיני עצרת, פסח (ראשון ושביעי), שבועות
const YOM_TOV = {
  tishri: [1, 2, 10, 15, 22],
  nisan: [15, 21],
  sivan: [6],
};
export function isYomTov(p) {
  const days = YOM_TOV[p.hebMonth];
  return !!days && days.includes(p.hebDay);
}

export const DEFAULT_SETTINGS = {
  quietFrom: '20:30',   // סוף יום: אין שליחה
  quietTo: '08:30',     // התחלת יום
  shabbatStart: '15:00', // שישי: התחלת השקט
  shabbatEnd: '20:30',   // שבת: סיום השקט
};

/** האם רגע נתון הוא שקט עבור המטופל. מחזיר סיבה אם כן. */
export function quietReason(date, settings = {}, patient = {}) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const p = parts(date);
  const qd = Array.isArray(patient.quietDays) ? patient.quietDays : ['shabbat', 'chag'];
  const qh = patient.quietHours || {};
  const from = toMinutes(qh.from || s.quietFrom, 20 * 60 + 30);
  const to = toMinutes(qh.to || s.quietTo, 8 * 60 + 30);
  if (from > to ? (p.hm >= from || p.hm < to) : (p.hm >= from && p.hm < to)) return 'quiet_hours';
  const sStart = toMinutes(s.shabbatStart, 15 * 60);
  const sEnd = toMinutes(s.shabbatEnd, 20 * 60 + 30);
  if (qd.includes('shabbat')) {
    if (p.dow === 5 && p.hm >= sStart) return 'shabbat';
    if (p.dow === 6 && p.hm < sEnd) return 'shabbat';
  }
  if (qd.includes('chag')) {
    if (isYomTov(p) && p.hm < sEnd) return 'chag';
    const tomorrow = parts(new Date(date.getTime() + 24 * 3600 * 1000));
    if (isYomTov(tomorrow) && p.hm >= sStart) return 'chag';
  }
  if (Array.isArray(patient.quietWeekdays) && patient.quietWeekdays.includes(p.dow)) return 'patient_day';
  return null;
}

/** הרגע הקרוב ביותר (מהרגע הנתון ואילך) שבו מותר לשלוח */
export function nextAllowed(date, settings = {}, patient = {}) {
  let t = new Date(Math.ceil(date.getTime() / 60000) * 60000);
  for (let i = 0; i < 14 * 24 * 6; i++) {
    if (!quietReason(t, settings, patient)) return t;
    t = new Date(t.getTime() + 10 * 60000);
  }
  return t;
}

// ----- ניטרליות של SMS והודעות קוליות -----
// בהודעה עצמה (מה שרואים על מסך משותף) אין אזכור של מחלה או של שם העמותה, אלא אם המטופל ביקש אחרת.
const SMS_BLOCK = [
  [/סרטן|סרטנ|גידול|גרורות|גרורתי|ממאיר|כימו|הקרנות|אונקולוג|ביופסי|פרוגנוז|הישרדות/, 'אזכור של מחלה או טיפול רפואי'],
  [/מחלה|מחלת|חולה|חולים|חולי\b|אבחנה|אבחון|פטירה|נפטר/, 'אזכור של מחלה, אבחנה או חולי'],
  [/לב\s*יעקב|עמותה|עמותת/, 'שם העמותה או אזכור של עמותה'],
];
const PAGE_BLOCK = [
  [/אבחנה|אבחון|שלב\s*[1-4IV]|גרורות|גרורתי|ממאיר|כימו\S*\s+שלך|הקרנות\s+שלך/, 'פרט רפואי אישי על המטופל'],
];
const SMS_WARN = [
  [/טיפול|טיפולים/, 'מילה שעלולה לרמוז על מחלה'],
  [/בית\s*חולים|מרפאה/, 'אזכור של מוסד רפואי'],
];

export function lintText(text, kind = 'sms') {
  const blocked = [];
  const warnings = [];
  const t = String(text || '');
  const list = kind === 'page' ? PAGE_BLOCK : SMS_BLOCK;
  for (const [re, why] of list) {
    const m = re.exec(t);
    if (m) blocked.push({ why, match: m[0] });
  }
  if (kind !== 'page') {
    for (const [re, why] of SMS_WARN) {
      const m = re.exec(t);
      if (m) warnings.push({ why, match: m[0] });
    }
    if (t.length > 140) warnings.push({ why: 'ההודעה ארוכה (כמה חלקי SMS)', match: String(t.length) });
  }
  if (/https?:\/\//.test(t) === false && /\[קישור פרטי\]/.test(t) === false && /קישור/.test(t) && kind !== 'page') {
    warnings.push({ why: 'מוזכר קישור, אבל לא נוסף קישור', match: 'קישור' });
  }
  return { ok: blocked.length === 0, blocked, warnings };
}

export const KNOWN_PLACEHOLDERS = ['[שם]', '[שם הרכזת]', '[טלפון הרכזת]', '[קישור פרטי]', '[תאריך]'];

/** מחליף פערים בפרטים אמיתיים. מחזיר גם את הפערים שנותרו בלי ערך. */
export function renderPlaceholders(text, vals) {
  let out = String(text || '');
  for (const [k, v] of Object.entries(vals)) {
    if (v) out = out.split(k).join(v);
  }
  const left = [...out.matchAll(/\[[^\]\n]{1,40}\]/g)].map((m) => m[0]);
  return { text: out, unresolved: left };
}

// ----- התראות והתורים של הרכזת -----
const DAY = 24 * 3600 * 1000;

function dayDiff(ymdA, ymdB) {
  const a = Date.parse(ymdA + 'T00:00:00Z');
  const b = Date.parse(ymdB + 'T00:00:00Z');
  return Math.round((a - b) / DAY);
}

/**
 * מחשבת את תור היום של הרכזת.
 * docs: { patients, tasks, offers, flags, messages } (מערכי נתונים גולמיים, בלי מסמכים שנמחקו)
 */
export function computeQueue(docs, now = new Date(), settings = {}) {
  const todayYmd = parts(now).ymd;
  const items = [];
  const patients = new Map(docs.patients.map((p) => [p.id, p]));
  const alive = (pid) => {
    const p = patients.get(pid);
    return p && p.status !== 'deceased';
  };
  const alias = (pid) => patients.get(pid)?.alias || '';

  // 1. דגלי דאגה ותלונות: ראש התור, ומענה תוך 24 שעות
  for (const f of docs.flags) {
    if (f.status !== 'open') continue;
    const openedAt = Date.parse(f.openedAt || now.toISOString());
    const hoursLeft = Math.round(24 - (now.getTime() - openedAt) / 3600000);
    items.push({
      kind: f.kind === 'complaint' ? 'complaint' : 'concern', severity: 0,
      patientId: f.patientId, patientAlias: alias(f.patientId), ref: f.id,
      title: f.kind === 'complaint' ? 'תלונה: להתייעץ עם איש המקצוע המלווה' : 'דגל דאגה: להתייעץ עם איש המקצוע המלווה',
      detail: hoursLeft >= 0 ? `נותרו כ-${hoursLeft} שעות למענה` : `חריגה של ${-hoursLeft} שעות ממענה תוך 24 שעות`,
      overdue: hoursLeft < 0, due: new Date(openedAt + DAY).toISOString(),
    });
  }

  // 2. חלונות זמן שנסגרים (8 ו-2 שבועות לפני), לרכזת בלבד
  for (const o of docs.offers) {
    if (!o.closesAt || !alive(o.patientId)) continue;
    if (['declined', 'not-suitable'].includes(o.status)) continue;
    const left = dayDiff(o.closesAt, todayYmd);
    if (left < 0) continue;
    let level = null;
    if (left <= 14) level = 2; else if (left <= 56) level = 8;
    if (!level) continue;
    if (Number(o.ackedLevel || 99) <= level) continue;
    items.push({
      kind: 'window', severity: level === 2 ? 1 : 3, patientId: o.patientId, patientAlias: alias(o.patientId), ref: o.id,
      title: `חלון נסגר בעוד ${left} ימים: ${o.name || 'הצעה'}`, detail: `התראה של ${level} שבועות, לרכזת בלבד`,
      due: o.closesAt, level,
    });
  }

  // 3. משימות פתוחות שמועדן הגיע
  for (const t of docs.tasks) {
    if (t.status !== 'open') continue;
    if (t.patientId && !alive(t.patientId)) continue;
    if (!t.dueAt) continue;
    const d = t.dueAt.slice(0, 10);
    const diff = dayDiff(d, todayYmd);
    if (diff > 0) continue;
    items.push({
      kind: 'task', severity: diff < 0 ? 2 : 4, patientId: t.patientId || null, patientAlias: alias(t.patientId),
      ref: t.id, title: t.title, detail: diff < 0 ? `באיחור של ${-diff} ימים` : 'להיום', due: t.dueAt, overdue: diff < 0,
    });
  }

  // 4. הודעות שמחכות לאישור או שנחסמו
  for (const m of docs.messages) {
    if (!alive(m.patientId) && m.kind !== 'condolence') continue;
    if (m.status === 'draft' && m.readyForApproval) {
      items.push({ kind: 'approve', severity: 5, patientId: m.patientId, patientAlias: alias(m.patientId), ref: m.id, title: 'טיוטת הודעה ממתינה לאישורך', detail: (m.body || '').slice(0, 60) });
    } else if (m.status === 'blocked' || m.status === 'failed') {
      items.push({ kind: 'blocked', severity: 3, patientId: m.patientId, patientAlias: alias(m.patientId), ref: m.id, title: m.status === 'failed' ? 'הודעה לא נשלחה' : 'הודעה נחסמה', detail: m.blockReason || m.error || '' });
    }
  }

  // 5. מטופלים שחוזרים מ״לא עכשיו״ או שיחה חוזרת שהגיע מועדה
  for (const p of docs.patients) {
    if (p.status === 'deceased' || p.status === 'closed') continue;
    if (p.notNowUntil && p.notNowUntil.slice(0, 10) === todayYmd) {
      items.push({ kind: 'return', severity: 6, patientId: p.id, patientAlias: p.alias, ref: p.id, title: 'היום מסתיים ״לא עכשיו״: להחליט אם ומתי לחזור', detail: '' });
    }
    if (p.nextCallAt && p.nextCallAt.slice(0, 10) <= todayYmd && p.status === 'active' && !p.openConcern) {
      items.push({ kind: 'call', severity: 6, patientId: p.id, patientAlias: p.alias, ref: p.id, title: 'שיחה חוזרת מתוכננת', detail: p.nextCallAt.slice(0, 16).replace('T', ' ') });
    }
  }

  items.sort((a, b) => a.severity - b.severity || String(a.due || '').localeCompare(String(b.due || '')));
  return items;
}
