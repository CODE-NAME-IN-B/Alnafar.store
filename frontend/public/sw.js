// Service Worker for Alnafar Store PWA
const CACHE_NAME = 'alnafar-store-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache resources (per-item so one failure doesn't abort the SW)
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of urlsToCache) {
        try {
          await cache.addAll([new Request(url, { cache: 'reload' })]);
        } catch (error) {
          console.warn('Service Worker: failed to cache', url, error);
        }
      }
    })
  );
  self.skipWaiting();
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
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ignore cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Never intercept dev server assets
  if (
    url.pathname.includes('/src/') ||
    url.pathname.includes('/@vite/') ||
    url.pathname.includes('/@react-refresh')
  ) {
    return;
  }

  // Always fetch uploads directly from network to avoid stale cache
  if (url.pathname.includes('/uploads/')) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Navigation requests: network-first, cache fallback, offline fallback to shell ('/')
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put('/', copy))
            .catch(() => {});
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  // Static build assets & icons: stale-while-revalidate
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons')) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(request, copy))
                .catch(() => {});
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })()
    );
    return;
  }

  // Other same-origin requests: network-first with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
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

// ── Push notifications (merged from service-worker.js) ──
self.addEventListener('push', function (event) {
  let data = { title: 'تحديث جديد', body: 'يوجد تحديث بخصوص طلبك', url: '/' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    tag: 'order-status-' + (data.url ? data.url.split('/').pop() : 'update'),
    renotify: true,
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const urlToOpen = event.notification.data.url;

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(
    clients.matchAll({
      type: "window"
    }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        try {
          // Hash routes: compare only the hash part (e.g. #/track/5)
          const targetHash = String(urlToOpen || '').includes('#')
            ? urlToOpen.slice(urlToOpen.indexOf('#'))
            : urlToOpen;
          const clientHash = String(client.url || '').includes('#')
            ? client.url.slice(client.url.indexOf('#'))
            : client.url;
          if ((targetHash && clientHash === targetHash) || client.url === urlToOpen) {
            if ('focus' in client) return client.focus();
          }
        } catch (_) {
          if (client.url === urlToOpen && 'focus' in client)
            return client.focus();
        }
      }
      if (clients.openWindow)
        return clients.openWindow(urlToOpen);
    })
  );
});
