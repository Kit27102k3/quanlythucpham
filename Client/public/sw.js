// Service Worker for Web Push Notifications

// Listen for the 'install' event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...', event);
  self.skipWaiting(); // Force activation
});

// Listen for the 'activate' event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...', event);
  return self.clients.claim(); // Take control immediately
});

// Listen for the 'push' event
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received:', event);
  
  let data;
  try {
    data = event.data.json();
    console.log('[Service Worker] Push data:', data);
  } catch (error) {
    console.error('[Service Worker] Error parsing push data:', error);
    data = {
      title: 'Thông báo',
      body: 'Không thể đọc nội dung thông báo',
      icon: '/Logo.png'
    };
  }

  const title = data.title || 'Thông báo mới';
  const options = {
    body: data.body || '',
    icon: data.icon || '/android-chrome-192x192.png',
    badge: data.badge || '/android-chrome-192x192.png',
    vibrate: data.vibrate || data.notification?.vibrate || [100, 50, 100],
    data: data.data || data.notification?.data || {},
    actions: data.actions || data.notification?.actions || [
      {
        action: 'explore',
        title: 'Xem ngay'
      }
    ]
  };

  console.log('[Service Worker] Showing notification with title:', title);
  console.log('[Service Worker] Notification options:', options);

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listen for the 'notificationclick' event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);

  event.notification.close();

  // Get the notification data
  const url = event.notification.data?.url || '/';
  console.log('[Service Worker] Opening URL:', url);

  // Mở cửa sổ/tab khi click vào thông báo
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        console.log('[Service Worker] Found client:', client.url);
        
        // If so, just focus it.
        if (client.url === url && 'focus' in client) {
          console.log('[Service Worker] Focusing existing client');
          return client.focus();
        }
      }
      
      // If not, open a new window/tab
      console.log('[Service Worker] Opening new client');
      return clients.openWindow(url);
    })
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