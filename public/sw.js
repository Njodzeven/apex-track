const CACHE_NAME = 'apex-track-cache-v2';
// Compute base URL from the service worker location so the worker works when
// the app is served from a subpath (GitHub Pages). This yields a trailing '/'.
const BASE = new URL('.', self.location).href; // e.g. https://user.github.io/apex-track/
const OFFLINE_URL = 'offline.html';
const OFFLINE_FULL = BASE + OFFLINE_URL;
// Cache the app shell relative to the base. Don't cache source files (like
// /src/main.tsx) which don't exist in production. Use index.html and
// offline.html under the same base.
const CORE_ASSETS = [
  BASE,
  BASE + 'index.html',
  OFFLINE_FULL
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k)))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // navigation requests -> try network first, fallback to offline page from cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_FULL))
    );
    return;
  }

  // for other requests try cache first, then network
  event.respondWith(
    caches.match(event.request).then((resp) => resp || fetch(event.request).catch(() => null))
  );
});
