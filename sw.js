const CACHE_NAME = 'ambr3-calendar-v14';
const BASE = self.location.pathname.replace(/\/[^/]*$/, '/');
const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'css/theme.css',
  BASE + 'js/app.js',
  BASE + 'manifest.json',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png'
];
const ALLOWED_CACHE = new Set(ASSETS);

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const offlineFallback = caches.match(req, { ignoreSearch: true }).then(cached => {
    if (cached) return cached;
    if (req.mode === 'navigate') return caches.match(BASE + 'index.html');
    return Response.error();
  });

  e.respondWith(
    new Promise((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        settled = true;
        resolve(offlineFallback);
      }, 4000);
      fetch(req)
        .then(resp => {
          if (settled) return;
          clearTimeout(timer);
          if (resp && resp.ok) {
            const clone = resp.clone();
            let p = '';
            try { p = new URL(req.url).pathname; } catch (e) {}
            if (ALLOWED_CACHE.has(p)) {
              caches.open(CACHE_NAME).then(cache => cache.put(req, clone)).catch(() => {});
            }
          }
          resolve(resp);
        })
        .catch(() => {
          if (settled) return;
          clearTimeout(timer);
          resolve(offlineFallback);
        });
    })
  );
});
