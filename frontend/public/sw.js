// Service Worker for offline QR code functionality (dev/fallback; production uses VitePWA workbox sw.js)
const CACHE_NAME = 'roots-of-impact-v4';
const RUNTIME_CACHE = 'runtime-cache-v4';

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        // Add other essential assets
      ]);
    })
  );
  self.skipWaiting();
});

function isApiRequest(request) {
  try {
    return new URL(request.url).pathname.startsWith('/api/');
  } catch (_) {
    return false;
  }
}

// Activate event - clean up old caches (incl. legacy API caches on stuck clients)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // API responses are auth-sensitive and must never be cached by the SW.
  if (isApiRequest(event.request)) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if available
      if (response) {
        return response;
      }

      // Otherwise fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the response for future offline use
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Return offline fallback if fetch fails
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
