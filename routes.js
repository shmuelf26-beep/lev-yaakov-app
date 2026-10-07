// יקצועות ה-API
import { tx, nowIso, currentSeq, nextSeq, encrypt, decrypt } from './db.js';
import { computeQueue, quietReason, nextAllowed, lintText } from './rules.js';
import { callSkill, updateMessageWithAI } from './skillIntegration.js';

export function setupRoutes(app, { db, key }) {

  // ----- חיפוש חולים -----
  app.get('/api/patients', (req, res) => {
    const q = (req.query.q || '').toLowerCase();
    try {
      const rows = db.prepare(`
        SELECT id, type, rev, blob FROM docs
        WHERE type = 'patient' AND deleted = 0
      `).all();

      let patients = rows.map(r => {
        const data = decrypt(key, r.blob);
        return { id: r.id, rev: r.rev, ...data };
      });

      if (q) {
        patients = patients.filter(p =>
          (p.alias || '').toLowerCase().includes(q) ||
          (p.phone || '').includes(q) ||
          (p.id).includes(q)
        );
      }

      res.json({
        patients: patients.map(p => ({
          id: p.id, rev: p.rev, alias: p.alias, phone: p.phone,
          status: p.status, nextCallAt: p.nextCallAt,
        })),
        total: patients.length,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ----- קבל מטופל + היסטוריה -----
  app.get('/api/patients/:id', (req, res) => {
    try {
      const row = db.prepare(`
        SELECT id, type, rev, blob FROM docs WHERE id = ? AND type = 'patient'
      `).get(req.params.id);

      if (!row) return res.status(404).json({ error: 'לא נמצא' });

      const patient = decrypt(key, row.blob);
      const messages = db.prepare(`
        SELECT id, type, rev, blob FROM docs
        WHERE type = 'message' AND deleted = 0
        ORDER BY updated_at DESC LIMIT 50
      `).all().map(r => {
        const m = decrypt(key, r.blob);
        return { id: r.id, rev: r.rev, ...m };
      });

      res.json({
        patient: { id: row.id, rev: row.rev, ...patient },
        messages,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ----- תור הרכזת -----
  app.get('/api/queue', (req, res) => {
    try {
      const docs = {
        patients: db.prepare(`
          SELECT id, type, blob FROM docs WHERE type = 'patient' AND deleted = 0
        `).all().map(r => decrypt(key, r.blob)),
        tasks: db.prepare(`
          SELECT id, type, blob FROM docs WHERE type = 'task' AND deleted = 0
        `).all().map(r => decrypt(key, r.blob)),
        messages: db.prepare(`
          SELECT id, type, blob FROM docs WHERE type = 'message' AND deleted = 0
        `).all().map(r => decrypt(key, r.blob)),
        flags: db.prepare(`
          SELECT id, type, blob FROM docs WHERE type = 'flag' AND deleted = 0
        `).all().map(r => decrypt(key, r.blob)),
        offers: db.prepare(`
          SELECT id, type, blob FROM docs WHERE type = 'offer' AND deleted = 0
        `).all().map(r => decrypt(key, r.blob)),
      };

      const items = computeQueue(docs);
      const now = new Date();

      res.json({
        items: items.map(item => ({
          ...item,
          nextAllowed: item.kind === 'approve' ? nextAllowed(now, {}, docs.patients.find(p => p.id === item.patientId)) : null,
        })),
        now: now.toISOString(),
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ----- צור/עדכן הודעה -----
  app.post('/api/messages', (req, res) => {
    const { patientId, body, kind = 'text' } = req.body;
    if (!patientId || !body) return res.status(400).json({ error: 'צריך patientId ו-body' });

    try {
      return tx(db, () => {
        const lint = lintText(body, kind === 'page' ? 'page' : 'sms');
        if (!lint.ok) {
          return res.status(400).json({ error: 'הודעה עברה בדיקת ניטרליות', blocked: lint.blocked });
        }

        const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const seq = nextSeq(db);
        const now = nowIso();

        const msg = {
          patientId, body, kind,
          status: 'draft', readyForApproval: false,
          warnings: lint.warnings,
          createdAt: now, updatedAt: now,
        };

        const blob = encrypt(key, msg);
        db.prepare(`
          INSERT INTO docs (id, type, rev, seq, deleted, blob, created_at, updated_at)
          VALUES (?, ?, 1, ?, 0, ?, ?, ?)
        `).run(id, 'message', seq, blob, now, now);

        res.status(201).json({ id, rev: 1, ...msg });
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ----- אישור הודעה לשליחה -----
  app.put('/api/messages/:id/approve', (req, res) => {
    try {
      return tx(db, () => {
        const row = db.prepare(`
          SELECT id, type, rev, blob FROM docs WHERE id = ? AND type = 'message'
        `).get(req.params.id);

        if (!row) return res.status(404).json({ error: 'הודעה לא נמצאת' });

        const msg = decrypt(key, row.blob);
        const patient = db.prepare(`
          SELECT blob FROM docs WHERE id = ? AND type = 'patient'
        `).get(msg.patientId);

        if (!patient) return res.status(404).json({ error: 'מטופל לא נמצא' });

        const pat = decrypt(key, patient.blob);
        const now = new Date();
        const quiet = quietReason(now, {}, pat);

        const updated = {
          ...msg,
          status: quiet ? 'blocked' : 'pending',
          blockReason: quiet || null,
          scheduledFor: quiet ? nextAllowed(now, {}, pat).toISOString() : now.toISOString(),
          updatedAt: nowIso(),
        };

        const blob = encrypt(key, updated);
        db.prepare(`
          UPDATE docs SET blob = ?, rev = rev + 1, updated_at = ?
          WHERE id = ?
        `).run(blob, nowIso(), req.params.id);

        res.json({ id: req.params.id, rev: row.rev + 1, ...updated });
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ----- צור משימה -----
  app.post('/api/tasks', (req, res) => {
    const { title, patientId, dueAt } = req.body;
    if (!title) return res.status(400).json({ error: 'צריך title' });

    try {
      return tx(db, () => {
        const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const seq = nextSeq(db);
        const now = nowIso();

        const task = {
          title, patientId: patientId || null, dueAt: dueAt || null,
          status: 'open', createdAt: now, updatedAt: now,
        };

        const blob = encrypt(key, task);
        db.prepare(`
          INSERT INTO docs (id, type, rev, seq, deleted, blob, created_at, updated_at)
          VALUES (?, ?, 1, ?, 0, ?, ?, ?)
        `).run(id, 'task', seq, blob, now, now);

        res.status(201).json({ id, rev: 1, ...task });
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ----- סנכרון: מה השתנה מ-seq X ואילך -----
  app.get('/api/sync', (req, res) => {
    const since = Number(req.query.since || 0);
    try {
      const rows = db.prepare(`
        SELECT id, type, rev, deleted, blob, seq, updated_at FROM docs
        WHERE seq > ? ORDER BY seq
        LIMIT 100
      `).all(since);

      const changes = rows.map(r => ({
        id: r.id, type: r.type, rev: r.rev, seq: r.seq,
        deleted: r.deleted === 1,
        data: r.deleted ? null : decrypt(key, r.blob),
        updatedAt: r.updated_at,
      }));

      const maxSeq = currentSeq(db);

      res.json({ changes, since, maxSeq });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ----- זימון Skill לעזרה בהודעה -----
  app.post('/api/messages/:id/get-ai-suggestion', async (req, res) => {
    try {
      const msgRow = db.prepare(`
        SELECT blob FROM docs WHERE id = ? AND type = 'message'
      `).get(req.params.id);

      if (!msgRow) return res.status(404).json({ error: 'הודעה לא נמצאת' });

      const msg = decrypt(key, msgRow.blob);
      const patientRow = db.prepare(`
        SELECT blob FROM docs WHERE id = ? AND type = 'patient'
      `).get(msg.patientId);

      const patient = patientRow ? decrypt(key, patientRow.blob) : null;

      // קרא ל-Skill (de-identified)
      const aiResult = await callSkill(db, key, msg, patient);

      // עדכן הודעה עם AI suggestion
      const updated = await updateMessageWithAI(db, key, req.params.id, aiResult);

      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

}
