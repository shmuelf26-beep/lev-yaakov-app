# 📋 לב יעקב — מערכת ליווי רכזת

PWA (Progressive Web App) לניהול חולי סרטן בישראל — עם Backend (Node.js) ו-Frontend (Vanilla JS + Offline Sync).

## 🚀 התחלה מהירה

### דרישות
- **Node.js** 22.13+
- **npm** או **yarn**

### התקנה

```bash
# 1. התקן תלויות
npm install

# 2. טעינה של הקובץ הסביבתי (עותק מה-.env.example)
cp .env.example .env

# 3. (ייצור בלבד) יצור מפתח הצפנה:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# ואז הכנס אותו ל-DATA_KEY ב-.env

# 4. פתח שני טרמינלים:
# טרמינל 1 - סרבר
npm run dev

# טרמינל 2 - frontend (מקרה לא הגשת static)
npx http-server client --cors --open
```

הסרבר יפתח על: **http://localhost:3000**

## 📁 מבנה הפרויקט

```
lev-yaakov-app/
├── server/              # Backend (Node.js + Express)
│   ├── src/
│   │   ├── index.js     # יקצוע Express הראשי
│   │   ├── db.js        # SQLite + הצפנה
│   │   ├── rules.js     # עסקי (quiet hours, Shabbat, queue)
│   │   ├── routes.js    # יקצועות API
│   │   ├── sync.js      # סנכרון offline-first
│   │   └── static.js    # הגשת קבצים static
│   └── test/
├── client/              # Frontend (Vanilla JS + PWA)
│   ├── index.html       # דף ראשי
│   ├── src/
│   │   ├── app.js       # ממשק משתמש
│   │   └── sync.js      # IndexedDB + סנכרון
│   └── public/
│       ├── manifest.json # PWA manifest
│       ├── sw.js        # Service Worker
│       └── icon-*.png   # אייקונים
└── package.json
```

## 🔌 יקצועות API

### חיפוש ודגישה

```bash
# חיפוש חולים
GET /api/patients?q=דוד

# קבל מטופל מלא (עם היסטוריה)
GET /api/patients/:id
```

### התור

```bash
# תור הרכזת (דגלים, משימות, חלונות זמן)
GET /api/queue
```

### הודעות

```bash
# צור הודעה חדשה (טיוטה)
POST /api/messages
{
  "patientId": "...",
  "body": "...",
  "kind": "sms" | "voice" | "page"
}

# אישור הודעה לשליחה (ניטרליות בדוקה, quiet hours)
PUT /api/messages/:id/approve
```

### משימות

```bash
# צור משימה חדשה
POST /api/tasks
{
  "title": "...",
  "patientId": "..." | null,
  "dueAt": "2026-10-15" | null
}
```

### סנכרון

```bash
# קבל שינויים מ-seq X ואילך (ל-offline sync)
GET /api/sync?since=0
```

## 💾 מסד נתונים

- **SQLite** עם הצפנה AES-256-GCM
- **WAL mode** (Write-Ahead Logging) לביצועים טובים
- **מפתח הצפנה** מטען מ-`DATA_KEY` ב-.env
- **Schema**: docs, meta, users, sessions, audit, outbox

## 🌐 PWA (Progressive Web App)

### Offline Support
- **Service Worker** כותב cache לכל בקשה
- **IndexedDB** מאחסן כל הנתונים באופן מקומי
- **Sync Engine** שולח שינויים כשחוזר ה-connection

### Installation
- ניתן להתקין על Home Screen (iOS/Android)
- עובד בדיוק כמו יישומון מקומי
- No network? ✓ עדיין עובד (offline mode)

## 🔒 אבטחה

- **הצפנה בעיצומה** (AES-256-GCM) — לא יכולה לקרוא DB ללא מפתח
- **Audit Log** — כל פעולה רשומה (מי, מה, מתי)
- **Sessions** — HTTPS + secure cookies בייצור
- **CORS** — הגבל origin לתחומים מאובטחים

## 🇮🇱 כללי ישראל

### שעות שקטות
```javascript
// Default:
quietFrom: '20:30'   // סוף יום
quietTo: '08:30'     // התחלת יום
```

### שבת וחגים
- **שבת**: יום שישי 15:00 עד שבת 20:30
- **חגים**: ראש השנה, יום כיפור, סוכות, פסח, שבועות

### ניטרליות SMS
מילים חסומות בהודעות (לא להזכיר מחלה או עמותה):
- ❌ סרטן, כימו, גידול, לב יעקב
- ✓ בקשה אחרת למטופל: `neutral: true`

## 📱 בדיקה

```bash
# הפעל בדיקות (קודם)
npm test

# בדוק health check
curl http://localhost:3000/health
# -> {"ok":true,"version":"0.1.0"}
```

## 📝 הערות

- בשרת הצפנה תמיד בפעולה. אפילו הקורא המשתמש אינו יכול לראות את הנתונים ללא מפתח.
- באופן מקומי (dev), מפתח קריאה נוצר אוטומטית ונשמר ב-`data/dev-data.key`.
- בייצור, חובה להעביר DATA_KEY דרך משתנה סביבה וליצור גיבוי.

## 🚢 Development vs Production

### Development
```
npm run dev
```
- מפתח הצפנה: אוטומטי מ-`data/dev-data.key`
- CORS: http://localhost:3000 + http://localhost:5173
- SMS: mock (לא שולח בפועל)
- AI: mock

### Production (דוגמה)
```bash
# הגדר משתנים סביבה
export DATA_KEY="..." # base64
export NODE_ENV="production"
export PUBLIC_URL="https://app.example.org"
export SMS_PROVIDER="http"
export SMS_HTTP_URL="https://provider.example.com/send"
export ANTHROPIC_API_KEY="..."

npm start
```

## 📞 תמיכה

שאלות? בדוק את `/home/claude/lev-yaakov-coordinator/SKILL.md` לפרטים על Skill.

---

**כל הנתונים מוצפנים. ללא מפתח הצפנה, אי אפשר לקרוא דבר.**
