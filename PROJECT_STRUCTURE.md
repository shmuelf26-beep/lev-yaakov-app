# 📁 מבנה הפרויקט — לב יעקב Coordinator App

## Backend (Express + SQLite)

```
server/
├── src/
│   ├── index.js              ← סרבר Express (CORS, middleware, routes setup)
│   ├── db.js                 ← SQLite + AES-256-GCM encryption (בנוי קודם)
│   ├── rules.js              ← Business logic (quiet hours, Shabbat, queue) (בנוי קודם)
│   ├── routes.js             ← API endpoints (חולים, הודעות, משימות, queue, sync)
│   ├── sync.js               ← Offline-first sync engine (merging, conflict resolution)
│   ├── static.js             ← Serving frontend files
│   └── skillIntegration.js   ← AI integration (de-identification, Anthropic API call)
├── test/                      ← Test directory (לבנות)
└── package.json              ← Dependencies: express, cors, @anthropic-ai/sdk
```

### API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/patients?q=...` | חיפוש חולים |
| GET | `/api/patients/:id` | קבל מטופל + היסטוריה |
| GET | `/api/queue` | תור הרכזת (עדיפויות) |
| POST | `/api/messages` | צור הודעה (draft) |
| PUT | `/api/messages/:id/approve` | אישור לשליחה (quiet hours בדוק) |
| POST | `/api/tasks` | צור משימה |
| GET | `/api/sync?since=N` | סנכרון שינויים (offline-first) |
| POST | `/api/messages/:id/get-ai-suggestion` | בקש עזרה מ-AI (Skill) |

---

## Frontend (PWA - Vanilla JS)

```
client/
├── index.html               ← דף ראשי (4 טבים, CSS inline)
├── src/
│   ├── app.js               ← UI Logic (tabs, search, forms, API calls)
│   └── sync.js              ← IndexedDB + periodic sync engine
├── public/
│   ├── manifest.json        ← PWA metadata (icons, name, display)
│   ├── sw.js                ← Service Worker (offline + caching)
│   ├── icon-192.png         ← Icon for PWA (לבנות)
│   ├── icon-512.png         ← Icon for PWA (לבנות)
│   └── screenshot-1.png     ← Screenshot (לבנות)
└── (images served by server)
```

### UI Tabs

1. **התור שלי** (Queue)
   - צפייה בעדיפויות (דגלים, חלונות זמן, משימות)
   - צבעים לפי severity (אדום = קריטי)

2. **חולים** (Patients)
   - חיפוש חולים
   - צפייה בפרטים בסיסיים

3. **הודעות** (Messages)
   - טופס ליצירת הודעה חדשה
   - בדיקת ניטרליות (בלייב)
   - בחירת מטופל

4. **משימות** (Tasks)
   - טופס ליצירת משימה
   - תאריך יעד אופציונלי

---

## Database Schema

```
docs (main table)
├── id (string, PK)
├── type (string: patient|message|task|flag|offer|...)
├── rev (int)
├── seq (int, indexed)
├── deleted (bool)
├── blob (BLOB, encrypted)
├── created_at
├── updated_at
└── updated_by

meta
├── k (string, PK: seq, lastSync, ...)
└── v (string)

users (future)
├── id (string, PK)
├── username
├── pw_hash
├── role
└── ...

sessions (future)
├── id (string, PK)
├── user_id
├── expires_at
└── ...

audit
├── id (int, AI)
├── at (timestamp)
├── user_id
├── action (create|update|delete|approve|block)
├── target (doc ID)
└── detail (JSON)

outbox (SMS/notifications)
├── id (int, AI)
├── at (timestamp)
├── to_masked (masked phone)
├── text
├── provider (sms|voice|push)
└── status (pending|sent|failed)
```

---

## Configuration Files

```
.env.example                ← Template (copy to .env)
package.json                ← Scripts: start, dev, test, seed, test-api, test-e2e
README.md                   ← Setup guide
BUILD_SUMMARY.md            ← מה בנוי
TEST_REPORT.md              ← בדיקות + תוצאות
PROJECT_STRUCTURE.md        ← File structure (this file)
```

---

## Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `start` | `npm start` | Production mode |
| `dev` | `npm run dev` | Development with --watch |
| `test` | `npm test` | Unit tests (Node --test) |
| `seed` | `npm run seed` | Create test data |
| `test-api` | `npm run test-api` | Quick API test |
| `test-e2e` | `npm run test-e2e` | Full end-to-end flow |

---

## Key Features Implemented

### ✅ Backend
- Encryption (AES-256-GCM) on all stored data
- WAL mode SQLite for concurrent access
- Transaction support (db.tx)
- Queue sorting (severity 0-6)
- Neutrality checking (regex patterns)
- Quiet hours + Shabbat + חגים (Hebrew calendar)
- Audit log (all changes tracked)
- Offline-first sync (seq-based)

### ✅ Frontend
- Responsive design (mobile + desktop)
- RTL (עברית ימין-לשמאל)
- Service Worker (offline support)
- IndexedDB (local persistence)
- Periodic sync (every 5s when online)
- Offline indicator
- Status bar (sync status)

### ✅ Security
- De-identification (regex for phone, ID, address)
- CORS configured
- No secrets in error messages
- Audit trail enabled

---

## Testing Results

```
✅ Health Check       - Server running
✅ Patient Retrieval  - 3 patients found
✅ Queue Logic        - 4 items, correct sorting
✅ Message Creation   - Draft created
✅ Neutrality Check   - No issues
✅ Quiet Hours        - Logic applied
✅ Sync Engine        - 10 changes recorded
⏳ AI Integration     - Ready (needs ANTHROPIC_API_KEY)
```

---

## Environment Variables

```
PORT=3000                           # Server port
DATA_DIR=./data                     # Database directory
DATA_KEY=<base64 32 bytes>          # Encryption key (required in prod)
NODE_ENV=development|production     # Environment
PUBLIC_URL=https://app.example.org  # For CORS + cookies
TZ=Asia/Jerusalem                   # Timezone

SMS_PROVIDER=mock|http              # SMS provider
SMS_HTTP_URL=...                    # SMS endpoint
ANTHROPIC_API_KEY=sk-ant-...       # For AI
ANTHROPIC_MODEL=claude-opus-4-1    # AI model
```

---

## Deployment Checklist

- [ ] Set NODE_ENV=production
- [ ] Generate DATA_KEY: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- [ ] Set up HTTPS (nginx/Caddy reverse proxy)
- [ ] Back up DATA_KEY in secure location
- [ ] Configure CORS_ORIGIN for production domain
- [ ] Set up ANTHROPIC_API_KEY
- [ ] Create PNG icons (192px, 512px)
- [ ] Test on real mobile device
- [ ] Audit database (verify encryption working)

---

## Future Enhancements

1. **Auth**: User login, role-based access control
2. **SMS Gateway**: Real SMS provider integration
3. **Notifications**: Push notifications to coordinators
4. **Analytics**: Dashboard for management
5. **Mobile App**: React Native / Flutter port
6. **Multi-language**: Support for other languages
7. **Export**: Reports in PDF/Excel

---

**Last Updated**: 2026-10-07
**Status**: ✅ Tested and Ready for Coordinator Testing
