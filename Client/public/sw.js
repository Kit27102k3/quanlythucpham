// Service Worker for Web Push Notifications

// Listen for the 'push' event
self.addEventListener('push', (event) => {
  const data = event.data.json();
  console.log('Push received:', data);

  const title = data.title || 'Thông báo mới';
  const options = {
    body: data.body || 'Nội dung thông báo.',
    icon: data.icon || '/icons/icon-192x192.png', // Thêm icon phù hợp
    badge: data.badge || '/icons/badge-96x96.png', // Thêm badge phù hợp
    data: data.data, // Dữ liệu tùy chỉnh
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listen for the 'notificationclick' event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  // Mở cửa sổ/tab khi click vào thông báo
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/') // Chuyển hướng đến URL trong data hoặc trang chủ
  );
});

// Optional: Cache static assets (basic example)
// self.addEventListener('install', (event) => {
//   event.waitUntil(
//     caches.open('static-cache-v1').then((cache) => {
//       return cache.addAll([
//         '/',
//         '/index.html',
//         '/styles.css',
//         '/script.js'
//         // Add other static assets here
//       ]);
//     })
//   );
// });

// Optional: Clean up old caches
// self.addEventListener('activate', (event) => {
//   const cacheWhitelist = ['static-cache-v1'];
//   event.waitUntil(
//     caches.keys().then((cacheNames) => {
//       return Promise.all(
//         cacheNames.map((cacheName) => {
//           if (cacheWhitelist.indexOf(cacheName) === -1) {
//             return caches.delete(cacheName);
//           }
//         })
//       );
//     })
//   );
// }); 