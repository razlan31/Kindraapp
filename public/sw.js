// Override service worker to prevent caching routing logic
self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clear all caches on activation
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Intercept all fetch requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Never cache navigation requests (routing)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
    );
    return;
  }
  
  // Let other requests pass through normally
  event.respondWith(fetch(event.request));
});