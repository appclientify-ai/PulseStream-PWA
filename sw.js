
const CACHE_NAME = 'clientify-v3-prod';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-only for Auth to prevent stale tokens
  if (url.pathname.includes('/auth/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for API
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for large static scripts and images
  if (url.hostname.includes('esm.sh') || event.request.destination === 'image') {
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

  // Default: Stale-while-revalidate for everything else
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networked = fetch(event.request).then((response) => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        return response;
      }).catch(() => null);
      return cached || networked;
    })
  );
});
