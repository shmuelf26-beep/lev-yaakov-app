#!/usr/bin/env node

// Setup יצור לפריסה ל-production

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

async function setup() {
  console.log('\n🚀 Setup ל-Production\n');

  // שאלה 1: בחר פלטפורמה
  console.log('אתה צריך לבחור פלטפורמה לפריסה:');
  console.log('  1. Railway (המלצה - קל ביותר)');
  console.log('  2. Fly.io (מפוכח)');
  console.log('  3. DigitalOcean');
  console.log('  4. מותאם אישית (Docker)');

  const platform = await question('\nבחר (1-4): ');

  // שאלה 2: דומיין
  const domain = await question('\nכתוב את הדומיין שלך (לדוגמה: my-app.com): ');
  if (!domain) {
    console.log('❌ דומיין חסר');
    process.exit(1);
  }

  // שאלה 3: API key (אופציונלי)
  const apiKey = await question('\nהזן Anthropic API Key (Enter לדלג): ');

  // יצור .env.production
  const envContent = `NODE_ENV=production
PORT=3000
DATA_DIR=/app/data
CORS_ORIGIN=https://${domain}
${apiKey ? `ANTHROPIC_API_KEY=${apiKey}` : '# ANTHROPIC_API_KEY=sk-ant-xxxxx'}`;

  fs.writeFileSync(path.join(rootDir, '.env.production'), envContent);
  console.log('\n✓ .env.production נשמר');

  // הדפס הוראות
  console.log('\n' + '='.repeat(60));
  console.log('✅ ההכנה הושלמה!\n');

  if (platform === '1') {
    console.log('📋 שלבים ל-Railway:');
    console.log('1. התחבר אל https://railway.app');
    console.log('2. בחר "New Project" → "Deploy from GitHub"');
    console.log('3. בחר את הrepo');
    console.log('4. צפה בדו"ח של Railway');
    console.log('5. העתק את ה-URL שקיבלת (לדוגמה: https://app-production.up.railway.app)');
    console.log('6. הגדר DNS CNAME ל-' + domain);
  } else if (platform === '2') {
    console.log('📋 שלבים ל-Fly.io:');
    console.log('1. התקן Fly CLI: curl -L https://fly.io/install.sh | sh');
    console.log('2. התחבר: flyctl auth login');
    console.log('3. בproj root: flyctl launch');
    console.log('4. פרסום: flyctl deploy');
  } else if (platform === '3') {
    console.log('📋 שלבים ל-DigitalOcean:');
    console.log('1. עבור אל https://cloud.digitalocean.com/apps');
    console.log('2. בחר "Create App" → "GitHub"');
    console.log('3. בחר את ה-repo');
    console.log('4. הגדר environment variables מ-.env.production');
    console.log('5. Deploy');
  } else {
    console.log('📋 שלבים ל-Docker:');
    console.log('1. בנה image: docker build -t lev-yaakov .');
    console.log('2. הרץ container: docker run -p 3000:3000 lev-yaakov');
    console.log('3. העלה לשרת שלך (AWS, GCP, VPS, וכו)');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 טיפים:');
  console.log('• Backup: שמור העתק של database לפני פריסה');
  console.log('• Test: בדוק ב-localhost לפני שליחה ל-production');
  console.log('• Monitor: עקוב אחרי logs בplatform שלך');
  console.log('\n📖 עוד פרטים: ראה DEPLOYMENT.md\n');

  rl.close();
}

setup().catch(console.error);
