/* eslint-disable no-undef */
// Service Worker version
const CACHE_VERSION = 'v1';
const CACHE_NAME = `dnc-food-cache-${CACHE_VERSION}`;

// Tài nguyên cần caching trước
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.css',
  '/src/index.css',
  '/Logo.png'
];

// Cài đặt Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(PRECACHE_URLS);
      })
      .catch((error) => {
        console.error('Cache addAll error:', error);
      })
      .then(() => self.skipWaiting())
  );
});

// Xóa cache cũ khi kích hoạt service worker mới
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Chiến lược cache: Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  // Bỏ qua các yêu cầu không phải HTTP/HTTPS
  if (!event.request.url.startsWith('http')) return;
  
  // Bỏ qua API calls
  if (event.request.url.includes('/api/')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Trả về cache nếu có
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Cập nhật cache với phản hồi mới
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const clonedResponse = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, clonedResponse);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // Nếu request là về hình ảnh và không có kết nối, trả về hình ảnh placeholder
            if (event.request.destination === 'image') {
              return new Response();
            }
          });
          
        return response || fetchPromise;
      })
  );
});

// Xử lý thông báo push
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/Logo.png',
    badge: '/Logo.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Xử lý khi người dùng click vào thông báo
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
}); 