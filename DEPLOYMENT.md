# 🚀 הוראות פריסה לשרת אמיתי

**מטרה:** להעלות את האפליקציה לשרת אמיתי עם URL ואפליקציה לטלפון

---

## 1️⃣ בחר פלטפורמה פריסה

### אפשרות א: Railway.app (המלצה - קל ביותר)
Railway היא הדרך הקלה ביותר להעלות את Node.js.

**שלבים:**
1. עבור אל https://railway.app
2. התחבר עם GitHub
3. בחר "New Project" → "Deploy from GitHub"
4. בחר את הrepo שלך (`lev-yaakov-app`)
5. Railway מוכן!

**עלות:** Free tier מספיק, או $5/חודש

---

### אפשרות ב: Fly.io (מפוכח)
**שלבים:**
1. התקן fly CLI: `curl -L https://fly.io/install.sh | sh`
2. התחבר: `flyctl auth login`
3. בproj root:
```bash
flyctl launch
# בחר region (אירופה או קרוב לישראל)
# בחר database (PostgreSQL או SQLite)
# Railway ירכיב את ה-Docker
```
4. פרסום: `flyctl deploy`

**עלות:** Free tier קטן, $10+/חודש לייצור

---

### אפשרות ג: DigitalOcean App Platform (גמיש)
**שלבים:**
1. עבור אל https://cloud.digitalocean.com
2. בחר "Apps" → "Create App"
3. בחר "GitHub" כsource
4. בחר את ה-repo
5. קבע environment variables
6. Deploy

**עלות:** $5-12/חודש

---

## 2️⃣ הכנה קודם הפריסה

### א. דומיין (שם אתר)
צריך להירשם לשם דומיין:
- https://www.namecheap.com
- https://www.godaddy.com
- https://domains.google

**דוגמה:**
```
your-domain.com
api.your-domain.com (אופציונלי)
```

**עלות:** $10-20/שנה

### ב. Certificate SSL (HTTPS)
רוב הפלטפורמות נותנות SSL חינם (Let's Encrypt).
אם לא, השתמש ב-Let's Encrypt בחינם.

### ג. Environment Variables
יצור קובץ `.env.production`:
```bash
NODE_ENV=production
PORT=3000
DATA_DIR=/app/data
CORS_ORIGIN=https://your-domain.com
ANTHROPIC_API_KEY=sk-ant-xxxxx (אם משתמש ב-AI)
```

---

## 3️⃣ פריסה ל-Railway (השלבים המדויקים)

אם בחרת ב-Railway:

### שלב 1: התקן Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### שלב 2: בproj root
```bash
railway init
```

### שלב 3: הגדר environment
```bash
railway variables set NODE_ENV=production
railway variables set DATA_DIR=/app/data
railway variables set CORS_ORIGIN=https://your-domain.com
```

### שלב 4: Deploy
```bash
railway up
```

### שלב 5: קבל URL
```bash
railway open
```

Railway יתן לך URL כמו:
```
https://lev-yaakov-app-production.up.railway.app
```

---

## 4️⃣ הגדרת דומיין מותאם

אחרי שקיבלת URL מRailway:

### Namecheap דוגמה:
1. עבור לDash של Namecheap
2. בחר את הדומיין
3. עבור ל-DNS
4. הוסף CNAME record:
   ```
   Host: your-domain.com
   Type: CNAME
   Value: [Railway URL מעלה]
   TTL: 30 min (ממתין עד 24 שעות)
   ```

אחרי 1-24 שעות, הדומיין יעבוד!

---

## 5️⃣ התקנה על טלפון (PWA)

### אנדרואיד:
1. פתח את Chrome
2. עבור אל `https://your-domain.com`
3. לחץ על ⋮ (תפריט)
4. בחר "Install app" או "Add to Home screen"
5. האפליקציה תהיה בעמוד הבית!

### iOS (iPhone):
1. פתח Safari
2. עבור אל `https://your-domain.com`
3. לחץ על ⬆️ (שיתוף)
4. בחר "Add to Home Screen"
5. שם את שם (מומלץ: "לב יעקב")
6. לחץ "Add"
7. האפליקציה תהיה בעמוד הבית!

---

## 6️⃣ בדיקה שהכל עובד

```bash
# בדוק שהסרבר חי
curl https://your-domain.com/health
# יחזור: {"ok":true,"version":"0.1.0"}

# בדוק CORS
curl -H "Origin: https://your-domain.com" https://your-domain.com/api/patients
# צריך לראות חולים (או מערך ריק)
```

---

## 7️⃣ בעיות נפוצות

### "CORS Error"
בדוק ש-CORS_ORIGIN תואם את הדומיין שלך:
```bash
railway variables set CORS_ORIGIN=https://your-domain.com
railway deploy
```

### "Database lock"
SQLite עלול להיות נעול בייצור. התוכנית תטפל בזה, אבל אם יש בעיה:
```bash
railway ssh
rm -f /app/data/lev-yaakov.db-shm
exit
```

### "API not responding"
בדוק ב-Railway dashboard:
1. בחר Project
2. בחר Deployment
3. בדוק ה-Logs
4. חפש errors

---

## 8️⃣ בדיקות תמיד

אחרי פריסה, בדוק:
- [ ] https://your-domain.com עובד
- [ ] https://your-domain.com/health מחזיר JSON
- [ ] אתה יכול להתקין על טלפון
- [ ] הודעות שמורות בטלפון
- [ ] Offline עובד (כבה אינטרנט ובדוק)
- [ ] דברים מסתנכרנים כשחוזר אינטרנט

---

## 📊 סיכום - 5 דקות לייצור

| שלב | זמן | מה לעשות |
|-----|-----|---------|
| 1. Railway | 2 דקות | התחבר, בחר project |
| 2. Environment | 1 דקה | סט CORS_ORIGIN |
| 3. Deploy | 1 דקה | `railway up` |
| 4. דומיין | 5 דקות (או יותר) | CNAME ב-DNS |
| 5. טלפון | 1 דקה | Install app מ-Chrome/Safari |

**סה"כ:** ~5-10 דקות עבודה + 24 שעות DNS

---

## 🔗 Links שימושיים

- Railway: https://railway.app
- Fly.io: https://fly.io
- DigitalOcean: https://www.digitalocean.com
- Let's Encrypt: https://letsencrypt.org
- Namecheap: https://www.namecheap.com

---

**זהו! האפליקציה שלך חיה בעולם! 🎉**
