# 🚀 Production - Quick Start

**5 דקות לפריסה בפועל עם Railway**

---

## תוכניית הפעולה

```
1. כנס אל Railway (2 דקות)
2. בחר את הrepo (1 דקה)
3. קבל URL (1 דקה)
4. סט דומיין (5 דקות + 24h)
5. בדוק בטלפון (2 דקות)
```

---

## Step 1️⃣: כנס אל Railway

```bash
# בחלופה 1: ב-ブราוזר
כנס אל https://railway.app
בחר "GitHub" login
בחר את ה-repo: lev-yaakov-app

# בחלופה 2: CLI
npm install -g @railway/cli
railway login
railway init
```

---

## Step 2️⃣: הגדר Environment

```bash
# אם בחרת CLI:
railway variables set NODE_ENV=production
railway variables set CORS_ORIGIN=https://YOUR-DOMAIN.com
railway variables set DATA_DIR=/app/data

# אם בחרת browser:
בלוח Railway Dashboard
בחר Project → Settings
הוסף environment variables למעלה
```

---

## Step 3️⃣: Deploy

```bash
# CLI
railway up

# Browser
לחץ "Deploy" button
תן לRailway 2 דקות לבנות ולהפעיל
```

---

## Step 4️⃣: קבל URL

Railway נתן לך:
```
https://lev-yaakov-production.up.railway.app
```

**בדוק שהוא עובד:**
```bash
curl https://lev-yaakov-production.up.railway.app/health
# יחזור: {"ok":true,"version":"0.1.0"}
```

---

## Step 5️⃣: סט דומיין

### בNamecheap:
1. קנה דומיין: lev-yaakov.com (~$10)
2. בDashboard, בחר את הדומיין
3. עבור ל"Advanced DNS"
4. הוסף CNAME record:
   ```
   Host: @
   Type: CNAME
   Value: lev-yaakov-production.up.railway.app
   TTL: 30 min
   ```
5. Save
6. **Wait 1-24 hours** (בדרך כלל שעה)

### בדוק:
```bash
# כשDNS propagated
curl https://your-domain.com/health
# יחזור JSON ✓
```

---

## Step 6️⃣: בטלפון

### אנדרואיד:
1. פתח Chrome
2. עבור אל `https://your-domain.com`
3. לחץ ⋮ → "Install app"
4. **Done!** App בHome Screen

### iPhone:
1. פתח Safari
2. עבור אל `https://your-domain.com`
3. לחץ ⬆️ Share
4. בחר "Add to Home Screen"
5. **Done!** App בHome Screen

---

## ✅ בדוקות

- [ ] https://your-domain.com loads
- [ ] App installs on phone
- [ ] You can write messages
- [ ] Offline mode works (turn off WiFi)
- [ ] Messages sync when WiFi back

---

## 🆘 בעיות?

### "CORS Error"
```bash
railway variables set CORS_ORIGIN=https://your-domain.com
railway deploy
```

### "Domain not working"
בדוק שDNS propagated:
```bash
nslookup your-domain.com
# צריך להראות IP/server name
```

### "App not installing"
- בדוק HTTPS (כתובת תתחיל ב-https://)
- רענן את הדף
- נסה Chrome במקום Safari

---

## 📞 עוד עזרה?

- DEPLOYMENT.md - פרטים מלאים
- COORDINATOR_GUIDE.md - איך להשתמש
- PRODUCTION_CHECKLIST.md - כל הפרטים

---

**זהו! 🎉 האפליקציה שלך חיה בעולם!**
