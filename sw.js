
const CACHE_NAME = 'pulse-stream-v2';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  '/App.tsx',
  '/constants.ts',
  '/types.ts',
  '/auth/AuthContext.tsx',
  '/services/api.ts'
];

const STATIC_ASSETS_REGEX = /\.(png|jpg|jpeg|svg|gif|woff2|css)$/;
const API_REGEX = /\/api\/|\/auth\//;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching App Shell');
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. API Strategy: Network-first, fallback to cache
  if (API_REGEX.test(url.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 2. Static Assets: Cache-first
  if (STATIC_ASSETS_REGEX.test(url.pathname) || url.origin.includes('esm.sh')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          return response;
        });
      })
    );
    return;
  }

  // 3. Navigation / Default Strategy: Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networked = fetch(event.request)
        .then((response) => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          return response;
        })
        .catch(() => null);
      return cached || networked;
    })
  );
});
