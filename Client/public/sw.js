// Service Worker for Web Push Notifications

// Caches
const CACHE_NAME = 'food-app-cache-v1';

// Listen for the 'install' event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  self.skipWaiting(); // Đảm bảo SW mới được kích hoạt ngay lập tức
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/favicon.ico',
        // Thêm các assets quan trọng khác cần cache
      ]);
    })
  );
});

// Listen for the 'activate' event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  // Xóa caches cũ
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim(); // Tiếp quản tất cả clients
});

// Listen for the 'push' event
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received:', event);
  console.log('[Service Worker] Push Data:', event.data ? event.data.text() : 'no data');

  try {
    let notificationData;
    
    // Parse notification data from push event
    if (event.data) {
      const dataText = event.data.text();
      console.log('Raw notification data:', dataText);
      
      try {
        notificationData = JSON.parse(dataText);
        console.log('Parsed notification data:', notificationData);
      } catch (e) {
        console.error('Error parsing notification JSON:', e);
        notificationData = {
          title: 'Thông báo mới',
          body: dataText,
          data: { url: '/' }
        };
      }
    } else {
      notificationData = {
        title: 'Thông báo mới',
        body: 'Bạn có thông báo mới từ DNC Food',
        data: { url: '/' }
      };
    }
    
    // Validate and provide defaults for notification properties
    const title = notificationData.title || 'Thông báo mới';
    const options = {
      body: notificationData.body || 'Bạn có thông báo mới từ DNC Food',
      icon: notificationData.icon || '/icon-192x192.png',
      badge: notificationData.badge || '/badge-72x72.png',
      data: notificationData.data || { url: '/' },
      tag: notificationData.tag || 'default-tag', // Group similar notifications
      requireInteraction: notificationData.requireInteraction !== false, // Default to true
      silent: notificationData.silent === true // Default to false
    };
    
    // Add actions if provided
    if (notificationData.actions && Array.isArray(notificationData.actions)) {
      options.actions = notificationData.actions;
    }
    
    // Log the actual notification we're about to show
    console.log('[Service Worker] Showing notification with:', { title, options });
    
    // Show the notification
    event.waitUntil(
      self.registration.showNotification(title, options)
        .then(() => {
          console.log('[Service Worker] Notification shown successfully');
        })
        .catch(err => {
          console.error('[Service Worker] Error showing notification:', err);
        })
    );
  } catch (error) {
    console.error('[Service Worker] Error processing push event:', error);
    
    // Fallback notification in case of error
    event.waitUntil(
      self.registration.showNotification('Thông báo mới', {
        body: 'Có thông báo mới từ DNC Food',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: { url: '/' }
      })
    );
  }
});

// Listen for the 'notificationclick' event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click:', event);
  event.notification.close();

  let targetUrl = '/';
  
  // Get target URL from notification data if available
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
    console.log('[Service Worker] Using URL from notification data:', targetUrl);
  }
  
  // Handle actions if clicked
  if (event.action) {
    console.log('[Service Worker] Action clicked:', event.action);
    if (event.notification.data && event.notification.data.actions) {
      const actionData = event.notification.data.actions.find(a => a.action === event.action);
      if (actionData && actionData.url) {
        targetUrl = actionData.url;
        console.log('[Service Worker] Using URL from action data:', targetUrl);
      }
    }
  }

  // Mở URL được chỉ định hoặc trang chủ khi click vào notification
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Kiểm tra xem có cửa sổ nào đang mở không
      for (const client of clientList) {
        // Nếu có client đang mở và không bị ẩn, focus đến client đó
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Nếu không tìm thấy client, mở URL mới
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Listen for the 'notificationclose' event
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed', event.notification);
  // Có thể theo dõi hành vi đóng thông báo ở đây
});

// Listen for the 'fetch' event
self.addEventListener('fetch', (event) => {
  // Xử lý fetch basic - network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
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