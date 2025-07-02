const CACHE_NAME = 'kindra-v1.0.0';
const urlsToCache = [
  '/',
  '/activities',
  '/calendar',
  '/insights',
  '/connections',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker caching resources');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker cache failed:', error);
      })
  );
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API requests - always go to network for fresh data
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response because it's a stream
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        }).catch(() => {
          // Return offline fallback for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', event => {
  console.log('Service Worker background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle offline data sync when back online
      syncOfflineData()
    );
  }
});

// Push notifications for relationship reminders
self.addEventListener('push', event => {
  console.log('Service Worker received push:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New relationship insight available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Insight',
        icon: '/icons/action-view.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/action-close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Kindra Relationship Insight', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('Service Worker notification click:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the app to insights page
    event.waitUntil(
      clients.openWindow('/insights')
    );
  } else if (event.action === 'close') {
    // Just close, no action needed
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function for syncing offline data
async function syncOfflineData() {
  try {
    // Check if we have pending offline moments to sync
    const cache = await caches.open('kindra-offline-data');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('offline-moment')) {
        const response = await cache.match(request);
        const data = await response.json();
        
        // Try to sync the offline moment
        try {
          await fetch('/api/moments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });
          
          // Remove from offline cache after successful sync
          await cache.delete(request);
          console.log('Synced offline moment successfully');
        } catch (syncError) {
          console.log('Failed to sync offline moment, will retry later');
        }
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}