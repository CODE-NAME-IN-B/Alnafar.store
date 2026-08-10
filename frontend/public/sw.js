// Service Worker for Alnafar Store PWA
const CACHE_NAME = 'alnafar-store-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Service Worker: Cache failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and development files
  if (
    !event.request.url.startsWith(self.location.origin) ||
    event.request.url.includes('/src/') ||
    event.request.url.includes('/@vite/') ||
    event.request.url.includes('/@react-refresh')
  ) {
    return;
  }

  // Always fetch uploads directly from network to avoid stale cache
  if (event.request.url.includes('/uploads/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      // Fallback to cache only if network fails
      return caches.match(event.request);
    })
  );
});

// Handle print requests
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRINT_INVOICE') {
    console.log('Service Worker: Print request received', event.data);
    
    // Send message back to client
    event.ports[0].postMessage({
      type: 'PRINT_RESPONSE',
      success: true,
      message: 'Print request processed'
    });
  }
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync');
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  return new Promise((resolve) => {
    console.log('Service Worker: Performing background sync');
    resolve();
  });
}
