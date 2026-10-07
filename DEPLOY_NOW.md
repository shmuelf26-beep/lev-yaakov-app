# 🚀 Deploy עכשיו לחינם — 5 דקות

**הכל חינם. הכל אוטומטי. פעם אחת בלבד.**

---

## 5 שלבים בלבד

### 1️⃣ כנס אל Railway (חינם)
```
https://railway.app
→ Sign up with GitHub (חינם)
```

### 2️⃣ צור Project
```
בדאשבורד Railway
→ New Project
→ Deploy from GitHub repo
→ בחר את lev-yaakov-app
```

### 3️⃣ קבל Railway Token
```
Account → API Tokens
→ Create new token
→ Copy ל-clipboard
```

### 4️⃣ הוסף Secrets ל-GitHub
```
בrepo שלך: Settings → Secrets and variables → Actions
→ New secret:
   Name: RAILWAY_TOKEN
   Value: (הpaste את ה-token מ-Railway)

→ New secret:
   Name: RAILWAY_PROJECT_ID
   Value: (בRailway Dashboard → Project ID, בפינה העליונה)
```

### 5️⃣ Push to GitHub
```bash
git add .
git commit -m "Add Railway deployment"
git push origin main
```

---

## ✅ סיים!

GitHub Actions יעשה deploy אוטומטי.
בעוד 2-5 דקות ה-app שלך חי ב-Railway.

---

## איפה המחשב שלי?

בRailway Dashboard → Deployments → ראה את ה-URL החי.
```
https://[your-app]-production.up.railway.app
```

---

## צריך domain משלך?

רשום ל-Namecheap.com ($10/שנה):
```
1. קנה domain (לדוגמה: lev-yaakov.com)
2. בDNS settings, הוסף CNAME:
   Host: @
   Value: [Railway URL]
3. Wait 1-24 hours
```

---

**זהו! אתה בחיים! 🎉**

כל פעם שתכתוב קוד חדש ותעשה push, Railway יupdate אוטומטי.
