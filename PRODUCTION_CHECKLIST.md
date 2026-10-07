# ✅ Checklist ל-Production

**כל מה שצריך לעשות כדי שהאפליקציה תהיה חיה בעולם**

---

## 📋 Phase 1: הכנה (עובד locally)

- [x] קוד כתוב ותוקן
- [x] בדיקות עברו
- [x] Database עם הצפנה
- [x] API endpoints עובדים
- [x] PWA Service Worker רשום
- [x] Documentation כתוב

---

## 🌐 Phase 2: בחירה של פלטפורמה

**בחר אחד:**

### ✅ Railway.app (המלצה)
- [ ] התחבר אל https://railway.app
- [ ] בחר GitHub auth
- [ ] בחר את ה-project
- [ ] Railway automatically build + deploy

### ✅ Fly.io
- [ ] התקן Fly CLI
- [ ] `flyctl auth login`
- [ ] `flyctl launch`
- [ ] `flyctl deploy`

### ✅ DigitalOcean
- [ ] התחבר אל DigitalOcean
- [ ] בחר Apps
- [ ] Connect GitHub repo
- [ ] Configure environment
- [ ] Deploy

### ✅ AWS / GCP / Azure
- [ ] צור account
- [ ] בחר Container/App service
- [ ] Push Docker image
- [ ] Configure DNS

### ✅ VPS (Linode, Hetzner, etc)
- [ ] קנה VPS
- [ ] התקן Node.js + PM2
- [ ] Clone repository
- [ ] Setup environment
- [ ] Start server

---

## 🔑 Phase 3: Environment + Secrets

- [ ] צור `.env.production` (מתבסס על `.env.production.example`)
- [ ] הגדר `CORS_ORIGIN` = דומיין שלך
- [ ] הגדר `NODE_ENV=production`
- [ ] הגדר `ANTHROPIC_API_KEY` (אם משתמש ב-AI)
- [ ] שמור secrets בplatform secured (לא ב-GitHub!)

**Check:**
```bash
# אל תקמיט את .env.production ל-GitHub!
echo ".env.production" >> .gitignore
```

---

## 🔐 Phase 4: HTTPS + SSL

**כל פלטפורמה נותנת checklists אחר:**

- [ ] Railway: Automatic SSL ✓
- [ ] Fly.io: Automatic SSL ✓
- [ ] DigitalOcean: Automatic SSL ✓
- [ ] AWS: Create certificate (ACM) or Let's Encrypt
- [ ] VPS: Install Let's Encrypt certbot

**Verify:**
```bash
curl https://your-domain.com/health
# צריך HTTP 200 + JSON response
```

---

## 🌍 Phase 5: Domain + DNS

1. **קנה דומיין:**
   - [ ] Namecheap, GoDaddy, Google Domains, וכו
   - [ ] ~$10-20 לשנה

2. **הגדר DNS:**
   - [ ] עבור אל Dashboard של registrar
   - [ ] בחר את הדומיין
   - [ ] בחר DNS settings
   - [ ] הוסף CNAME record:
     ```
     Host: your-domain.com (או @)
     Type: CNAME
     Value: [Railway/Fly/DO URL]
     TTL: 30 min או 3600
     ```
   - [ ] **Wait 1-24 hours** ל-DNS propagation

3. **Verify:**
   ```bash
   # בטרמינל
   nslookup your-domain.com
   # צריך לראות IP address של server
   ```

---

## 📱 Phase 6: PWA + Mobile

### A. Generate Icons:
```bash
npm run generate-icons
```

### B. Verify manifest.json:
- [ ] `client/public/manifest.json` קיים
- [ ] `icons` הם valid PNG files (או SVG)
- [ ] `start_url: "/"` 
- [ ] `display: "standalone"`

### C. Verify Service Worker:
- [ ] `client/public/sw.js` קיים
- [ ] רשום ב-`index.html`
- [ ] Cache strategy configured

### D. Test Mobile Install:
- [ ] פתח את https://your-domain.com בChrome
- [ ] לחץ על ⋮ → "Install app"
- [ ] האפליקציה מתוקנת בHome Screen ✓
- [ ] לחץ וודא שעובדת

---

## 🗄️ Phase 7: Database + Backups

- [ ] ודא שDatabase קיים ב-server (`/app/data/lev-yaakov.db`)
- [ ] Test encryption key loaded correctly
- [ ] **Backup strategy:**
  - [ ] Daily backups to cloud storage (S3, GCS, etc)
  - [ ] Test restore from backup
  - [ ] Document backup process

**Script (example for Railway):**
```bash
# Automated backup to S3 (configure in cron)
0 2 * * * /app/scripts/backup-to-s3.sh
```

---

## 🧪 Phase 8: Testing

### Health Check:
```bash
curl https://your-domain.com/health
# Expected: {"ok":true,"version":"0.1.0"}
```

### API Endpoints:
```bash
# Test patients
curl https://your-domain.com/api/patients

# Test queue
curl https://your-domain.com/api/queue

# Test message creation
curl -X POST https://your-domain.com/api/messages \
  -H "Content-Type: application/json" \
  -d '{"patientId":"test","body":"Hello","kind":"sms"}'
```

### Frontend:
- [ ] Navigate to https://your-domain.com
- [ ] All 4 tabs load (Queue, Patients, Messages, Tasks)
- [ ] Tabs respond to clicks
- [ ] Data loads from API
- [ ] Forms submit successfully

### Offline:
- [ ] Turn off internet (Airplane Mode)
- [ ] Open app in browser
- [ ] Previous data visible (from cache)
- [ ] Try to write message → saved locally
- [ ] Turn internet back on
- [ ] Message syncs ✓

### Mobile:
- [ ] Install on Android phone → opens correctly
- [ ] Install on iPhone → opens correctly
- [ ] Can write and submit messages
- [ ] Can read queue
- [ ] Offline mode works

---

## 📊 Phase 9: Monitoring + Logs

**Setup alerts:**

- [ ] Check server logs regularly (platform dashboard)
- [ ] Setup error tracking (Sentry, LogRocket, etc) - optional
- [ ] Setup uptime monitoring (Uptime Robot, etc) - optional
- [ ] Get alerted if server goes down

**Commands:**

```bash
# Railway
railway logs

# Fly.io
flyctl logs

# Docker/VPS
tail -f /var/log/app.log
```

---

## 🔒 Phase 10: Security

- [ ] ✅ HTTPS/SSL enabled
- [ ] ✅ CORS configured (only your domain)
- [ ] ✅ Environment variables NOT in Git
- [ ] ✅ Database encrypted (AES-256-GCM)
- [ ] ✅ API errors don't leak secrets
- [ ] ✅ Rate limiting (optional, for future)
- [ ] ✅ No console.log with sensitive data in production

**Check:**
```bash
# Make sure .env.production is NOT in git
git status
# Should NOT show .env.production

# Check .gitignore
cat .gitignore | grep env
# Should have .env.production
```

---

## 👤 Phase 11: User Authentication (Future)

Currently: No login needed (coordinator-only app)

When needed:
- [ ] Add JWT tokens
- [ ] Add login endpoint
- [ ] Add password hashing (bcrypt)
- [ ] Add session management
- [ ] Require auth for all /api routes

---

## 📈 Phase 12: Scaling (If Needed)

When app grows:
- [ ] Monitor database performance
- [ ] Implement caching (Redis)
- [ ] Add load balancer if needed
- [ ] Consider PostgreSQL instead of SQLite
- [ ] Setup CDN for static assets

---

## 🎯 Final Verification

Before announcing:
- [ ] https://your-domain.com loads ✓
- [ ] All 4 tabs work ✓
- [ ] Offline mode works ✓
- [ ] Mobile install works ✓
- [ ] Messages are encrypted ✓
- [ ] Database backups working ✓
- [ ] Error monitoring setup ✓
- [ ] Team can access and use ✓

---

## 📝 Documentation Updates

- [ ] README.md: Update with production URL
- [ ] COORDINATOR_GUIDE.md: Add "Access at https://your-domain.com"
- [ ] Share MOBILE_INSTALL.md with coordinator
- [ ] Setup docs for team members

---

## 🚀 Launch!

1. **Announce to coordinator:**
   - "App is ready at https://your-domain.com"
   - "Install on phone via Chrome: Menu → Install app"
   - "Questions? See COORDINATOR_GUIDE.md"

2. **Monitor first week:**
   - [ ] Check logs daily
   - [ ] Fix any reported issues
   - [ ] Ensure data syncing works
   - [ ] Confirm offline mode works

3. **Celebrate! 🎉**

---

## 📚 Reference

| Phase | Time | Notes |
|-------|------|-------|
| 1. Local | Done | ✓ |
| 2. Platform | 5 min | Choose one |
| 3. Env | 2 min | Set vars |
| 4. HTTPS | Auto | Platform handles |
| 5. Domain | 5 min + 24h | Wait for DNS |
| 6. PWA | 5 min | Mobile install |
| 7. DB | 5 min | Verify backup |
| 8. Testing | 15 min | Run tests |
| 9. Monitoring | 5 min | Setup alerts |
| 10. Security | 5 min | Verify checks |
| **Total** | **1 hour + 24h DNS** | **Production ready!** |

---

**סיכום: ~1 שעה עבודה + 24 שעות DNS propagation = Live Production! 🚀**
