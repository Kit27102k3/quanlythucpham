/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// Service Worker for Web Push Notifications

// Listen for the 'install' event
self.addEventListener('install', (event) => {
  // console.log('[Service Worker] Installing Service Worker...', event);
  self.skipWaiting(); // Force activation
});

// Listen for the 'activate' event
self.addEventListener('activate', (event) => {
  // console.log('[Service Worker] Activating Service Worker...', event);
  return self.clients.claim(); // Take control immediately
});

// Listen for the 'push' event
self.addEventListener('push', (event) => {
  // console.log('[Service Worker] Push Received:', event);
  
  let data;
  try {
    data = event.data.json();
  } catch (error) {
    console.error('[Service Worker] Error parsing push data:', error);
    data = {
      title: 'Thông báo',
      body: 'Không thể đọc nội dung thông báo',
      icon: '/Logo.png'
    };
  }

  // Ưu tiên lấy thông tin từ data.notification nếu có
  const notification = data.notification || data;

  const title = notification.title || 'Thông báo mới';
  const options = {
    body: notification.body || '',
    icon: notification.icon || '/android-chrome-192x192.png',
    badge: notification.badge || '/android-chrome-192x192.png',
    vibrate: notification.vibrate || [100, 50, 100],
    data: notification.data || {},
    actions: notification.actions || [
      {
        action: 'explore',
        title: 'Xem ngay'
      }
    ]
  };

  // console.log('[Service Worker] Showing notification with title:', title);
  // console.log('[Service Worker] Notification options:', options);

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listen for the 'notificationclick' event
self.addEventListener('notificationclick', (event) => {
  // console.log('[Service Worker] Notification clicked:', event);

  event.notification.close();

  // Get the notification data
  const url = event.notification.data?.url || '/';
  // console.log('[Service Worker] Opening URL:', url);

  // Mở cửa sổ/tab khi click vào thông báo
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      return clients.openWindow(url);
    })
  );
});

