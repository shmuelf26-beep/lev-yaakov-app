// מנוע סנכרון offline-first: IndexedDB + שרת
export class SyncEngine {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.dbPromise = this.initDb();
    this.lastSeq = 0;
    this.startSync();
  }

  async initDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('lev-yaakov', 1);

      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        // store כל הנתונים
        if (!db.objectStoreNames.contains('docs')) {
          const store = db.createObjectStore('docs', { keyPath: 'id' });
          store.createIndex('type', 'type');
          store.createIndex('seq', 'seq');
          store.createIndex('deleted', 'deleted');
        }

        // store לתורי סנכרון לא שלוחו
        if (!db.objectStoreNames.contains('pending')) {
          db.createObjectStore('pending', { keyPath: 'id' });
        }

        // store מטא (seq אחרון וכד')
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'k' });
        }
      };
    });
  }

  async getMeta(key) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const req = db.transaction('meta', 'readonly')
        .objectStore('meta').get(key);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result?.v);
    });
  }

  async setMeta(key, value) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const req = db.transaction('meta', 'readwrite')
        .objectStore('meta').put({ k: key, v: value });
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  }

  async save(doc) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const req = db.transaction('docs', 'readwrite')
        .objectStore('docs').put(doc);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  }

  async savePending(mutation) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const req = db.transaction('pending', 'readwrite')
        .objectStore('pending').put(mutation);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  }

  async getPending() {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const req = db.transaction('pending', 'readonly')
        .objectStore('pending').getAll();
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });
  }

  async clearPending(id) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const req = db.transaction('pending', 'readwrite')
        .objectStore('pending').delete(id);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  }

  // ----- סנכרון תקופתי -----
  startSync() {
    setInterval(() => this.syncOnce(), 5000); // כל 5 שניות
  }

  async syncOnce() {
    if (!navigator.onLine) return; // אנחנו offline

    try {
      // 1. שלח תורים לא שלוחו
      const pending = await this.getPending();
      if (pending.length > 0) {
        await this.syncMutations(pending);
      }

      // 2. קבל שינויים חדשים מהשרת
      this.lastSeq = (await this.getMeta('lastSeq')) || 0;
      await this.pullChanges(this.lastSeq);
    } catch (e) {
      console.warn('Sync error:', e);
    }
  }

  async syncMutations(mutations) {
    const res = await fetch(`${this.apiUrl}/api/sync/mutations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mutations }),
    });

    if (!res.ok) throw new Error(res.statusText);

    const data = await res.json();

    // עדכן כל ה-acks
    for (const ack of data.acks) {
      await this.clearPending(ack.id);
    }

    // החזר rejects ל-user
    if (data.rejects.length > 0) {
      console.warn('Sync rejections:', data.rejects);
    }
  }

  async pullChanges(since) {
    const res = await fetch(`${this.apiUrl}/api/sync?since=${since}`);
    if (!res.ok) throw new Error(res.statusText);

    const data = await res.json();

    for (const change of data.changes) {
      await this.save({
        ...change,
        data: change.deleted ? null : change.data,
      });
    }

    if (data.changes.length > 0) {
      await this.setMeta('lastSeq', data.maxSeq);
      this.lastSeq = data.maxSeq;
    }
  }

  // ----- שליחת שינוי מהקליינט -----
  async update(id, type, data) {
    const doc = await this.getDoc(id);
    const rev = doc?.rev || 0;

    const mutation = { id, type, rev: rev + 1, data };
    await this.savePending(mutation);

    // נסיון מיידי
    if (navigator.onLine) {
      try {
        await this.syncMutations([mutation]);
      } catch (e) {
        console.warn('Immediate sync failed, will retry later');
      }
    }
  }

  async getDoc(id) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const req = db.transaction('docs', 'readonly')
        .objectStore('docs').get(id);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });
  }

  async getAllDocs(type) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const index = db.transaction('docs', 'readonly')
        .objectStore('docs').index('type');
      const req = index.getAll(type);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result.filter(d => !d.deleted));
    });
  }
}
