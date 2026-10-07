// אפליקציית הרכזת — logic ממשק משתמש
import { SyncEngine } from './sync.js';

const API = process.env.API_URL || 'http://localhost:3000';
const USERNAME = 'רכזת-demo'; // TODO: שלופה מ-auth

class App {
  constructor() {
    this.queue = [];
    this.patients = [];
    this.selectedPatient = null;
    this.sync = new SyncEngine(API);
    this.init();
  }

  async init() {
    this.setupTabs();
    this.setupEventHandlers();
    this.setupOfflineIndicator();

    document.getElementById('username').textContent = USERNAME;

    // טען נתונים
    await this.refreshQueue();
    await this.refreshPatients();
  }

  // ----- ניהול טבים -----
  setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;

        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(tabName).classList.add('active');
      });
    });
  }

  // ----- טעינת התור -----
  async refreshQueue() {
    const el = document.getElementById('queue-list');
    try {
      const res = await fetch(`${API}/api/queue`);
      if (!res.ok) throw new Error(res.statusText);

      const data = await res.json();
      this.queue = data.items;

      if (this.queue.length === 0) {
        el.innerHTML = '<p style="color: #27ae60;">✓ אין משימות כרגע</p>';
        return;
      }

      el.innerHTML = this.queue.map(item => `
        <div class="queue-item severity-${item.severity}" data-ref="${item.ref}">
          <div class="queue-item-title">${this.getSeverityIcon(item.severity)} ${item.title}</div>
          <div class="queue-item-detail">
            ${item.patientAlias ? `${item.patientAlias} | ` : ''}${item.detail || ''}
          </div>
        </div>
      `).join('');

      el.querySelectorAll('.queue-item').forEach(el => {
        el.addEventListener('click', () => this.handleQueueItemClick(el.dataset.ref));
      });
    } catch (e) {
      el.innerHTML = `<div class="alert error">שגיאה: ${e.message}</div>`;
    }
  }

  getSeverityIcon(sev) {
    const icons = ['🔴', '🟠', '🟡', '🔵', '🟢', '⚪'];
    return icons[sev] || '⚪';
  }

  async handleQueueItemClick(ref) {
    console.log('Clicked queue item:', ref);
    // TODO: פתח פנל פרטים
  }

  // ----- חיפוש חולים -----
  async refreshPatients() {
    const el = document.getElementById('patient-list');
    try {
      const res = await fetch(`${API}/api/patients`);
      if (!res.ok) throw new Error(res.statusText);

      const data = await res.json();
      this.patients = data.patients;
      this.renderPatientList(data.patients);
    } catch (e) {
      el.innerHTML = `<div class="alert error">שגיאה: ${e.message}</div>`;
    }
  }

  renderPatientList(patients) {
    const el = document.getElementById('patient-list');
    if (patients.length === 0) {
      el.innerHTML = '<p style="color: #999;">אין חולים</p>';
      return;
    }

    el.innerHTML = patients.map(p => `
      <div class="card" style="cursor: pointer;" data-id="${p.id}">
        <div style="font-weight: bold;">${p.alias}</div>
        <div style="font-size: 0.9rem; color: #666;">
          📱 ${p.phone || '-'} | 🔄 ${p.status}
        </div>
        ${p.nextCallAt ? `<div style="font-size: 0.85rem; color: #2c3e50;">שיחה בתאריך: ${p.nextCallAt.slice(0, 16)}</div>` : ''}
      </div>
    `).join('');

    el.querySelectorAll('[data-id]').forEach(el => {
      el.addEventListener('click', () => this.selectPatient(el.dataset.id));
    });
  }

  selectPatient(id) {
    this.selectedPatient = id;
    console.log('Selected patient:', id);
  }

  // ----- חיפוש חולים בטפסים -----
  setupEventHandlers() {
    // חיפוש בהודעות
    const msgSearch = document.getElementById('msg-patient-search');
    msgSearch.addEventListener('input', (e) => this.handlePatientSearch(e.target.value, 'msg-patient-list'));

    // חיפוש בחוקי חיפוש
    const patientSearch = document.getElementById('patient-search');
    patientSearch.addEventListener('input', (e) => this.handlePatientSearch(e.target.value, 'patient-list'));

    // בדיקת ניטרליות בהודעה
    const msgBody = document.getElementById('msg-body');
    msgBody.addEventListener('input', () => this.checkMessageNeutrality());

    // טיפול בטפסים
    document.getElementById('message-form').addEventListener('submit', (e) => this.submitMessage(e));
    document.getElementById('task-form').addEventListener('submit', (e) => this.submitTask(e));
  }

  async handlePatientSearch(q, targetId) {
    const el = document.getElementById(targetId);
    if (!q) {
      el.innerHTML = '';
      return;
    }

    try {
      const res = await fetch(`${API}/api/patients?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(res.statusText);

      const data = await res.json();
      el.innerHTML = data.patients.map(p => `
        <div style="padding: 0.5rem; cursor: pointer; background: #f0f0f0; border-radius: 4px; margin-bottom: 0.25rem;" data-id="${p.id}">
          ${p.alias} (${p.phone || 'N/A'})
        </div>
      `).join('');

      el.querySelectorAll('[data-id]').forEach(item => {
        item.addEventListener('click', () => {
          if (targetId === 'msg-patient-list') {
            this.selectedPatient = item.dataset.id;
            msgSearch.value = this.patients.find(p => p.id === item.dataset.id)?.alias || item.dataset.id;
            el.innerHTML = '';
          }
        });
      });
    } catch (e) {
      el.innerHTML = `<div class="alert error">${e.message}</div>`;
    }
  }

  checkMessageNeutrality() {
    const body = document.getElementById('msg-body').value;
    const kind = document.getElementById('msg-kind').value;
    const lintEl = document.getElementById('msg-lint');

    // בדיקה פשוטה בלבד (בשרת יש בדיקה מלאה)
    const blocked = [
      /סרטן/, /כימו/, /גידול/,
      /לב\s*יעקב/, /עמותה/,
      /בית\s*חולים/
    ];

    let issues = [];
    for (const re of blocked) {
      if (re.test(body)) issues.push(`⚠️ ${re}`);
    }

    if (body.length > 160) {
      issues.push(`⚠️ ההודעה ארוכה (${body.length} תווים)`);
    }

    lintEl.innerHTML = issues.length > 0
      ? `<div class="alert warning">${issues.join('<br>')}</div>`
      : '<div style="color: #27ae60;">✓ עברה בדיקה</div>';
  }

  async submitMessage(e) {
    e.preventDefault();

    const patientId = this.selectedPatient;
    const body = document.getElementById('msg-body').value;
    const kind = document.getElementById('msg-kind').value;
    const alertsEl = document.getElementById('msg-alerts');

    if (!patientId || !body) {
      alertsEl.innerHTML = '<div class="alert error">בחרו מטופל ותוכן הודעה</div>';
      return;
    }

    try {
      const res = await fetch(`${API}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, body, kind }),
      });

      if (!res.ok) {
        const data = await res.json();
        alertsEl.innerHTML = `<div class="alert error">
          ${data.error}<br>
          ${data.blocked ? data.blocked.map(b => `- ${b.why}`).join('<br>') : ''}
        </div>`;
        return;
      }

      const msg = await res.json();
      alertsEl.innerHTML = `<div class="alert success">✓ טיוטה נוצרה! ID: ${msg.id}</div>`;
      document.getElementById('message-form').reset();
      this.selectedPatient = null;
    } catch (e) {
      alertsEl.innerHTML = `<div class="alert error">שגיאה: ${e.message}</div>`;
    }
  }

  async submitTask(e) {
    e.preventDefault();

    const title = document.getElementById('task-title').value;
    const patientId = this.selectedPatient || null;
    const dueAt = document.getElementById('task-due').value || null;

    if (!title) return;

    try {
      const res = await fetch(`${API}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, patientId, dueAt }),
      });

      if (!res.ok) throw new Error(res.statusText);

      const task = await res.json();
      alert(`✓ משימה נוצרה! ID: ${task.id}`);
      document.getElementById('task-form').reset();
      this.selectedPatient = null;
      await this.refreshQueue();
    } catch (e) {
      alert(`שגיאה: ${e.message}`);
    }
  }

  // ----- מצביע offline -----
  setupOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');

    window.addEventListener('offline', () => {
      indicator.classList.add('active');
      document.getElementById('sync-status').textContent = '📡 offline';
    });

    window.addEventListener('online', () => {
      indicator.classList.remove('active');
      document.getElementById('sync-status').textContent = '✓ online';
      this.refreshQueue();
    });
  }
}

// התחל
new App();
