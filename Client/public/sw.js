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

  // Extract notification details properly - deeply parse the data structure
  let notificationData;
  
  // First try to get the full notification object
  if (data.notification) {
    notificationData = data.notification;
  } else {
    notificationData = data;
  }
  
  // Extract title, body and other properties
  let title = notificationData.title;
  let body = notificationData.body;
  let icon = notificationData.icon || '/Logo.png';
  
  // Get all data from either location
  const dataPayload = notificationData.data || data.data || {};
  
  // Variables needed for different notification types
  let orderCode, orderStatus, sender, couponCode;
  
  // If still no title, determine based on notification type
  if (!title) {
    // Determine notification type from any possible location
    const type = dataPayload.type || data.type;
    
    switch (type) {
      case 'order_update':
        orderCode = dataPayload.orderCode || 'mới';
        orderStatus = dataPayload.orderStatus || '';
        
        if (orderStatus === 'confirmed') {
          title = `Đơn hàng #${orderCode} đã xác nhận`;
        } else if (orderStatus === 'preparing') {
          title = `Đơn hàng #${orderCode} đang chuẩn bị`;
        } else if (orderStatus === 'shipping' || orderStatus === 'delivering') {
          title = `Đơn hàng #${orderCode} đang giao`;
        } else if (orderStatus === 'completed') {
          title = `Đơn hàng #${orderCode} hoàn thành`;
        } else if (orderStatus === 'cancelled') {
          title = `Đơn hàng #${orderCode} đã hủy`;
        } else {
          title = `Cập nhật đơn hàng #${orderCode}`;
        }
        break;
      case 'new_message':
        sender = dataPayload.sender || 'hệ thống';
        title = `Tin nhắn mới từ ${sender}`;
        break;
      case 'review_reply':
        title = 'Phản hồi đánh giá sản phẩm';
        break;
      case 'new_product':
        title = 'Sản phẩm mới đã được thêm';
        break;
      case 'new_coupon':
        couponCode = dataPayload.couponCode || '';
        title = couponCode ? `Mã giảm giá mới: ${couponCode}` : 'Mã giảm giá mới';
        break;
      default:
        title = 'DNC Food - Thông báo mới';
    }
  }

  // Ensure we have a body
  if (!body) {
    // Create a default body based on type
    const type = dataPayload.type || data.type;
    
    switch (type) {
      case 'order_update':
        body = 'Trạng thái đơn hàng của bạn đã được cập nhật';
        break;
      case 'new_message':
        body = 'Bạn có tin nhắn mới. Nhấn để xem chi tiết.';
        break;
      case 'review_reply':
        body = 'Admin đã phản hồi đánh giá của bạn';
        break;
      case 'new_product':
        body = 'Một sản phẩm mới đã được thêm vào cửa hàng';
        break;
      case 'new_coupon':
        body = 'Sử dụng mã giảm giá mới để nhận ưu đãi';
        break;
      default:
        body = 'Nhấn để xem chi tiết';
    }
  }

  // Create full notification options
  const options = {
    body: body,
    icon: icon,
    badge: notificationData.badge || '/Logo.png',
    vibrate: notificationData.vibrate || [100, 50, 100],
    data: dataPayload,
    image: notificationData.image || dataPayload.image || null,
    actions: notificationData.actions || [
      {
        action: 'explore',
        title: 'Xem ngay'
      }
    ],
    tag: dataPayload.type || 'notification',  // Group notifications by type
    renotify: true  // Notify every time, even if same tag
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
    self.clients.matchAll({type: 'window'}).then(windowClients => {
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
      return self.clients.openWindow(url);
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