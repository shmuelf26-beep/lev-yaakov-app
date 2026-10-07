# 🎯 Getting Started - בואו נתחיל!

**בחרת לבנות מערכת ליווי חולים. כאן נתחיל את המסע.**

---

## 📖 תמצית הפרויקט

```
מה בנינו:
✓ אתר (PWA) - עובד בדפדפן וכאפליקציה בטלפון
✓ שרת (Express + SQLite) - עם הצפנה מלאה
✓ Sync offline-first - עובד בלי אינטרנט
✓ Business logic - דגלים, משימות, הודעות
✓ Security - encrypted database + audit log

איפה אתה עומד:
→ קוד כל מוכן וjava locally
→ בדיקות הצליחו
→ הכל עובד ב-localhost:3000
```

---

## 🚀 מה עכשיו?

### א. אם רוצה להפעיל locally:
```bash
cd lev-yaakov-app
npm install
npm run scenario      # יצור נתוני בדיקה
npm run dev          # הפעל את שרת ב-localhost:3000
# פתח http://localhost:3000
```

---

### ב. אם רוצה ללכת ל-production (אתר חי):

**לבחור נתיב:**

#### 🟢 Nir fast (Railway - 5 דקות)
```bash
1. עבור אל https://railway.app
2. בחר GitHub auth
3. בחר את ה-repo
4. Railway עוזר אתך (auto-deploy)
5. קבל URL חי
```
👉 ראה: `PRODUCTION_QUICK_START.md`

#### 🟡 Intermediate (Fly.io - 10 דקות)
```bash
npm install -g @railway/cli
railway login
railway launch
railway deploy
```
👉 ראה: `DEPLOYMENT.md`

#### 🔴 Full control (Docker + VPS)
```bash
docker build -t lev-yaakov .
# upload to your server
docker run -p 3000:3000 lev-yaakov
```
👉 ראה: `DEPLOYMENT.md`

---

## 📋 Checklist לפריסה

אם בחרת לפרוס ל-production:

```
Phase 1: בחר פלטפורמה
☐ Railway (easy)
☐ Fly.io (reliable)
☐ DigitalOcean (flexible)
☐ Your own server

Phase 2: קנה דומיין
☐ Namecheap / GoDaddy
☐ Cost: ~$10-20/year

Phase 3: Deploy
☐ Connect GitHub
☐ Set environment vars
☐ Wait for build (2-5 min)

Phase 4: DNS + Domain
☐ Point domain to server
☐ Wait for propagation (1-24h)

Phase 5: Test
☐ https://your-domain.com loads
☐ Install on phone
☐ Offline mode works
☐ Messages sync

Phase 6: Use!
☐ Coordinator starts using
☐ Monitor logs
☐ Fix any issues
```

👉 ראה: `PRODUCTION_CHECKLIST.md`

---

## 📱 Mobile Install

### After deployment:
```
Android:
1. Open Chrome
2. Go to https://your-domain.com
3. ⋮ → "Install app"
4. Done!

iPhone:
1. Open Safari
2. Go to https://your-domain.com
3. ⬆️ → "Add to Home Screen"
4. Done!
```

👉 ראה: `MOBILE_INSTALL.md`

---

## 📚 Documentation

```
For Setup:
→ QUICK_START.md (development)
→ PRODUCTION_QUICK_START.md (5-min deploy)
→ DEPLOYMENT.md (full details)
→ PRODUCTION_CHECKLIST.md (step-by-step)

For Usage:
→ COORDINATOR_GUIDE.md (Hebrew user guide)
→ TESTING_CHECKLIST.md (test cases)

For Technical:
→ README.md (technical overview)
→ PROJECT_STRUCTURE.md (architecture)
→ TEST_REPORT.md (test results)
```

---

## 🎯 Next Steps

### Option 1: Continue Development
```bash
npm run dev
# Modify code
# Test locally
# When ready, deploy to production
```

### Option 2: Deploy Now
```bash
# Read PRODUCTION_QUICK_START.md
# Follow 5 steps to Railway
# Share URL with coordinator
```

### Option 3: Full Setup
```bash
# Read PRODUCTION_CHECKLIST.md
# Follow all 12 phases
# Production-ready app!
```

---

## ⚙️ Key Features

✅ **Queue sorting** - דגלים בעדיפות 1, משימות בעדיפות 2
✅ **Message validation** - בדיקה שלא נזכרים מחלה/טיפול
✅ **Quiet hours** - לא שולח בלילה/שבת
✅ **Offline first** - עובד בלי אינטרנט
✅ **Sync engine** - דברים מסתנכרנים כשחוזר אינטרנט
✅ **Encrypted DB** - כל הנתונים מוצפנים
✅ **PWA** - אפליקציה בטלפון בלי app store
✅ **Audit log** - כל פעולה רשומה

---

## 🤔 FAQ

**Q: צריך database נפרד?**
A: לא, SQLite בתוך ה-app עם הצפנה

**Q: צריך להגדיר מערכת login?**
A: לא, זו אפליקציית coordinator בלבד (no auth yet)

**Q: נתונים אבודים אם טלפון כבה?**
A: לא, הכל מסתנכרן לשרת בטוח

**Q: איך מחזירים גיבוי?**
A: Platform אוטומטי עושה backups (Railway, etc)

**Q: עלות להפעלה?**
A: Railway free tier מספיק, או $5-12/month

---

## 🎓 Learn More

```
HTTP / APIs
→ https://developer.mozilla.org/en-US/docs/Web/HTTP

PWA / Service Workers
→ https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps

Express.js
→ https://expressjs.com

SQLite + Encryption
→ https://www.sqlite.org

Deployment
→ https://railway.app/docs
→ https://fly.io/docs
```

---

## 🚀 Ready?

Choose your path:

### Path A: Development
```
npm run dev
→ Modify as needed
→ When ready: PRODUCTION_QUICK_START.md
```

### Path B: Immediate Production
```
PRODUCTION_QUICK_START.md
→ Follow 5 steps
→ Online in 30 minutes!
```

### Path C: Enterprise Setup
```
PRODUCTION_CHECKLIST.md
→ Full security + monitoring
→ Backups + scaling
→ Production-ready!
```

---

## 💬 Questions?

תראה את הקבצים:
- COORDINATOR_GUIDE.md - השימוש
- README.md - טכניקה
- DEPLOYMENT.md - פריסה

---

**אתה מוכן! בואו נתחיל! 🚀**

בחר נתיב ותחל עם הטפול בחולי הסרטן שלך.
