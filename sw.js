// Prosty cache dla PWA
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `hamulec-${CACHE_VERSION}`;
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  // Ikony opcjonalne — dodaj, jeśli masz pliki:
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Instalacja — cache podstawowych zasobów
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Aktywacja — czyszczenie starych cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k.startsWith('hamulec-') && k !== CACHE_NAME)
            .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Strategia fetch:
// - HTML: network-first (aktualizacje strony), fallback do cache/offline
// - inne pliki: cache-first
self.addEventListener('fetch', event => {
  const req = event.request;
  const isHTML = req.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      });
    })
  );
});
