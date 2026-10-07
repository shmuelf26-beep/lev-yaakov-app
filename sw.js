// Service Worker: offline support + caching
const CACHE = 'lev-yaakov-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/src/app.js',
  '/src/sync.js',
  '/icon-192.png',
  '/manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(ASSETS).catch(() => {
        // אם כמה קבצים נכשלו, זה בסדר — אנחנו עדיין יוצרים את ה-cache
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.map((name) => {
          if (name !== CACHE) return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // בקשות API: קודם ברשת, אחר כך cache
  if (e.request.url.includes('/api/')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) {
            caches.open(CACHE).then((cache) => cache.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() => {
          return caches.match(e.request).then((cached) => {
            return cached || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // סטטיים: cache קודם
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});
