const CACHE = 'frenkyfit-v2';
const urls = ['/', '/login', '/card', '/staff', '/styles.css', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(urls)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.startsWith('http')) {
    e.respondWith(
      caches.match(e.request).then((r) => r || fetch(e.request).catch(() => new Response('Offline', { status: 503 })))
    );
  }
});
