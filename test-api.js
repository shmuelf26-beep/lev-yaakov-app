// בדיקת API endpoints
const API = process.env.API_URL || 'http://localhost:3000';

async function test(name, fn) {
  try {
    console.log(`\n🧪 ${name}...`);
    await fn();
    console.log(`✅ ${name}`);
  } catch (e) {
    console.error(`❌ ${name}: ${e.message}`);
  }
}

async function get(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`${res.status}: ${error}`);
  }
  return res.json();
}

async function main() {
  console.log(`📡 בדיקת API ב-${API}\n`);

  // 1. בדוק שהשרת עובד
  await test('Health Check', async () => {
    const data = await get('/health');
    if (!data.ok) throw new Error('Health check failed');
    console.log(`   Version: ${data.version}`);
  });

  // 2. קבל חולים
  await test('GET /api/patients', async () => {
    const data = await get('/api/patients');
    console.log(`   Found ${data.total} patients`);
    if (data.patients.length > 0) {
      console.log(`   First: ${data.patients[0].alias} (${data.patients[0].id})`);
    }
  });

  // 3. קבל תור
  await test('GET /api/queue', async () => {
    const data = await get('/api/queue');
    console.log(`   ${data.items.length} items in queue`);
    if (data.items.length > 0) {
      const top = data.items[0];
      console.log(`   Top: ${top.title} (severity ${top.severity})`);
    }
  });

  // 4. צור הודעה חדשה
  await test('POST /api/messages', async () => {
    const data = await post('/api/messages', {
      patientId: 'p-001',
      body: 'בדיקה: שלום דוד, כיצד אתה מרגיש?',
      kind: 'sms',
    });
    console.log(`   Created: ${data.id}`);
    console.log(`   Status: ${data.status}`);
  });

  // 5. בדוק סנכרון
  await test('GET /api/sync?since=0', async () => {
    const data = await get('/api/sync?since=0');
    console.log(`   ${data.changes.length} changes`);
    console.log(`   Max seq: ${data.maxSeq}`);
  });

  console.log(`\n✨ בדיקות הסתיימו!`);
}

main().catch(e => {
  console.error('Test runner error:', e);
  process.exit(1);
});
