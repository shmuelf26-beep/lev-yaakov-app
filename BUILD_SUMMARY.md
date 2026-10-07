# 📊 סיכום בנייה — Backend + Frontend

## ✅ Backend API (Express + SQLite)

**קבצים:**
- `server/src/index.js` — סרבר הודעות-בסיס עם Express
- `server/src/routes.js` — יקצועות API (חולים, הודעות, משימות, queue, sync)
- `server/src/sync.js` — מנוע סנכרון Offline-First
- `server/src/db.js` — SQLite + הצפנה AES-256-GCM (כבר בנוי)
- `server/src/rules.js` — כללים עסקיים (כבר בנוי)
- `server/src/static.js` — הגשת קבצי client

**API Endpoints:**
```
GET  /api/patients?q=...        → חיפוש חולים
GET  /api/patients/:id          → קבל מטופל + היסטוריה
GET  /api/queue                 → תור הרכזת (עם סדר עדיפויות)
POST /api/messages              → צור הודעה (בדיקת ניטרליות)
PUT  /api/messages/:id/approve  → אישור לשליחה (quiet hours בדוק)
POST /api/tasks                 → צור משימה
GET  /api/sync?since=N          → סנכרון שינויים ל-offline
```

**Features:**
✓ הצפנה AES-256-GCM בעיצומה
✓ WAL mode ל-SQLite (ביצועים טובים)
✓ Audit log (מי עשה מה מתי)
✓ Queue logic עם עדיפויות (דגלים, חלונות זמן, משימות)
✓ Quiet hours + Shabbat + חגים
✓ ניטרליות SMS (בדוק צד שרת)

---

## ✅ Frontend (Vanilla JS + PWA)

**קבצים:**
- `client/index.html` — דף ראשי (4 טבים)
- `client/src/app.js` — logic UI (חיפוש, טפסים, queue)
- `client/src/sync.js` — IndexedDB + סנכרון תקופתי
- `client/public/manifest.json` — PWA manifest
- `client/public/sw.js` — Service Worker (offline + cache)

**UI Components:**
1. **התור שלי** — תור הרכזת עם עדיפויות צבעוניות
2. **חולים** — חיפוש וצפייה בפרטים בסיסיים
3. **הודעות** — צור טיוטה עם בדיקת ניטרליות
4. **משימות** — צור משימה עם תאריך יעד

**Features:**
✓ Offline-first (IndexedDB)
✓ Service Worker (cache + sync)
✓ Responsive design (desktop + mobile)
✓ RTL (עברית ימין-לשמאל)
✓ Status bar (sync status, offline indicator)
✓ Touch-friendly buttons

---

## 📦 Setup

### התקנה
```bash
npm install
cp .env.example .env
npm run dev
```

### לפתוח
```
http://localhost:3000
```

---

## 🎯 מה צריך עדיין?

1. **End-to-End Testing**
   - סימולציה של רכזת אמיתית
   - בדיקת תרחישים (חולים, הודעות, משימות)
   - בדיקת offline + sync

2. **Icons ותמונות**
   - `/icon-192.png` ו-`/icon-512.png` ל-PWA
   - Screenshot לאפליקציה

3. **Integration עם Skill**
   - POST endpoint ל-run Skill עם de-identification
   - קבלת תשובה מ-Claude
   - עדכון הודעה עם AI-generated טקסט

4. **Auth + Sessions** (optional בשלב זה)
   - עריכה `users` table
   - POST `/api/auth/login` endpoint
   - Session tokens

5. **SMS Gateway** (optional)
   - Integration עם SMS provider
   - Webhook ל-replies

---

## 💡 Next Steps

1. Test locally:
   ```
   npm install
   npm run dev
   open http://localhost:3000
   ```

2. Try creating a message:
   - טאב "הודעות"
   - בחר מטופל (חיפוש)
   - כתוב הודעה
   - אם יש בעיה בניטרליות, תראה אזהרה

3. Check the queue:
   - טאב "התור שלי"
   - אם אין משימות, זה OK (בשלב ההתחלה)

---

## 📝 Notes

- כל הנתונים מוצפנים עד הקצה. Database ללא מפתח = לא קריא.
- PWA עובד offline — כל השינויים נשמרים locally ו-synced כשיש connection.
- בדיקת ניטרליות רצה גם בקליינט (אזהרות) וגם בשרת (bloc).

