# ✅ Final Checklist — לפני Deploy

**בדוק את כל זה ואז בצע את DEPLOY_NOW.md**

---

## 1. GitHub מוכן?
- [ ] Repository בGitHub
- [ ] Code pushed to main

## 2. Railway מוכן?
- [ ] Account ברייל (free)
- [ ] Secrets added לGitHub (RAILWAY_TOKEN, RAILWAY_PROJECT_ID)

## 3. קובץ Deployment?
- [ ] `.github/workflows/deploy-railway.yml` קיים
- [ ] `Dockerfile` קיים
- [ ] `railway.json` קיים

## 4. Environment מוכן?
- [ ] `.gitignore` בGitHub (בלי node_modules)
- [ ] `package.json` עם start script

## 5. כל קובץ?
- [ ] `server/src/index.js` - main server
- [ ] `client/index.html` - frontend
- [ ] `client/public/manifest.json` - PWA
- [ ] `client/public/sw.js` - Service Worker

---

## 🎯 Go!

```bash
cd /home/claude/lev-yaakov-app

# 1. Init git (אם עדיין לא)
git init
git add .
git commit -m "Initial commit: Lev Yaakov app"
git branch -M main

# 2. Add remote (החלף USERNAME ו-REPO)
git remote add origin https://github.com/USERNAME/lev-yaakov-app.git
git push -u origin main

# 3. Follow DEPLOY_NOW.md
```

---

**אתה מוכן! בהצלחה! 🚀**
