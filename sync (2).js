// סנכרון offline-first: הלקוח שולח שינויים, השרת משתלב
import { tx, nowIso, nextSeq, encrypt, decrypt } from './db.js';

/**
 * קבל כל השינויים מהלקוח, בדוק התנגשויות, ומזג לשרת.
 * הלקוח שולח: { mutations: [{ id, type, rev, data }] }
 * השרת משיב: { acks: [{ id, rev, seq }], rejects: [...], merged: [...] }
 */
export function applyMutations(db, key, mutations) {
  const acks = [];
  const rejects = [];
  const merged = [];

  return tx(db, () => {
    for (const mut of mutations) {
      try {
        const existing = db.prepare(`
          SELECT id, type, rev, seq, blob FROM docs WHERE id = ?
        `).get(mut.id);

        if (existing && existing.rev !== mut.rev) {
          // התנגשות: לקוח שלח גרסה ישנה
          // קבלנו את שלנו ודחינו
          rejects.push({
            id: mut.id,
            clientRev: mut.rev,
            serverRev: existing.rev,
            reason: 'revision_conflict',
          });
          continue;
        }

        if (!existing) {
          // מסמך חדש
          const seq = nextSeq(db);
          const now = nowIso();
          const blob = encrypt(key, mut.data);

          db.prepare(`
            INSERT INTO docs (id, type, rev, seq, deleted, blob, created_at, updated_at)
            VALUES (?, ?, 1, ?, 0, ?, ?, ?)
          `).run(mut.id, mut.type, seq, blob, now, now);

          acks.push({ id: mut.id, rev: 1, seq });
          merged.push({ id: mut.id, seq, ...mut.data });
        } else {
          // עדכן מסמך קיים
          const newRev = existing.rev + 1;
          const seq = nextSeq(db);
          const now = nowIso();
          const blob = encrypt(key, mut.data);

          db.prepare(`
            UPDATE docs
            SET rev = ?, blob = ?, seq = ?, updated_at = ?
            WHERE id = ?
          `).run(newRev, blob, seq, now, mut.id);

          acks.push({ id: mut.id, rev: newRev, seq });
          merged.push({ id: mut.id, seq, rev: newRev, ...mut.data });
        }
      } catch (e) {
        rejects.push({
          id: mut.id,
          reason: 'error',
          error: e.message,
        });
      }
    }

    return { acks, rejects, merged };
  });
}

/**
 * לקוח קורא לשרת עם רשימת IDs שקיימות אצלו (ב-rev מסוימת).
 * השרת משיב: אם rev מתאים, שלום. אחרת, שלחנו את ה-rev החדש.
 */
export function checkRevisions(db, key, docs) {
  const stale = [];
  const current = [];

  for (const { id, rev } of docs) {
    const row = db.prepare(`
      SELECT rev, blob FROM docs WHERE id = ?
    `).get(id);

    if (!row) {
      // השרת מחק את זה (או זה לא היה פה)
      stale.push({ id, reason: 'deleted' });
    } else if (row.rev > rev) {
      // לקוח בעיכוב
      const data = decrypt(key, row.blob);
      stale.push({ id, serverRev: row.rev, data });
    } else {
      current.push(id);
    }
  }

  return { current, stale };
}
