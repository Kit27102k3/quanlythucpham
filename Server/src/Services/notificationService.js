/* eslint-disable no-undef */
import webpush from 'web-push';
import dotenv from 'dotenv';
import User from '../Model/Register.js'; // Import User model
// import Admin from '../Model/adminModel.js'; // Import Admin model - commented out as not used yet

// Cấu hình dotenv
dotenv.config();

// Lấy VAPID keys từ biến môi trường
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

console.log('Kiểm tra VAPID keys:');
console.log('- Public key exists:', !!vapidPublicKey);
console.log('- Private key exists:', !!vapidPrivateKey);

// Configure web-push with VAPID keys
try {
webpush.setVapidDetails(
    'mailto:kit10012003@gmail.com', // Đảm bảo có tiền tố mailto:
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('✅ VAPID details set successfully');
} catch (error) {
  console.error('❌ Error setting VAPID details:', error);
}

// Function to send a push notification to a single subscription
export const sendPushNotification = async (userId, subscription, payload) => {
  try {
    console.log('[sendPushNotification] Bắt đầu gửi notification cho user:', userId);
    console.log('[sendPushNotification] Subscription endpoint:', subscription.endpoint.substring(0, 30) + '...');
    
    // Kiểm tra subscription hợp lệ
    if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      console.error('[sendPushNotification] Invalid subscription object for user:', userId);
      return false;
    }
    
    // Chuyển payload thành chuỗi JSON
    const payloadString = JSON.stringify(payload);
    console.log('[sendPushNotification] Payload size:', payloadString.length, 'bytes');
    
    // Gửi notification
    await webpush.sendNotification(subscription, payloadString);
    console.log('[sendPushNotification] Push notification sent successfully for user:', userId);
    return true;
  } catch (error) {
    console.error('[sendPushNotification] Error sending push notification for user:', userId, ':', error.message);
    console.error('[sendPushNotification] Error status code:', error.statusCode);
    console.error('[sendPushNotification] Error stack:', error.stack);

    // Handle cases where the subscription is no longer valid
    if (error.statusCode === 404 || error.statusCode === 410) {
      console.log('[sendPushNotification] Subscription expired or no longer valid for user:', userId, '. Removing...');
      // Implement logic to remove the expired/invalid subscription from the database
      try {
        const result = await User.findByIdAndUpdate(
          userId,
          { $pull: { pushSubscriptions: { endpoint: subscription.endpoint } } },
          { new: true }
        );
        console.log('[sendPushNotification] Removed invalid subscription for user:', userId, ':', subscription.endpoint);
        console.log('[sendPushNotification] User now has', result.pushSubscriptions.length, 'subscriptions');
      } catch (dbError) {
        console.error('[sendPushNotification] Error removing invalid subscription from database for user:', userId, ':', dbError);
      }
    } else if (error.statusCode === 400) {
      console.error('[sendPushNotification] Bad request error. Payload may be too large or subscription is invalid.');
    } else if (error.statusCode === 401 || error.statusCode === 403) {
      console.error('[sendPushNotification] Authentication error. VAPID details may be incorrect.');
    } else {
      // Handle other errors
      console.error('[sendPushNotification] Unknown error sending push notification for user:', userId, ':', error);
    }
    
    return false;
  }
};

// Gửi thông báo cho một người dùng cụ thể (tất cả các thiết bị đã đăng ký)
export const sendNotificationToUser = async (userId, title, body, data = {}) => {
  try {
    console.log(`[sendNotificationToUser] Bắt đầu gửi thông báo cho user: ${userId}`);
    console.log(`[sendNotificationToUser] Tham số:`, { title, body, data });

    // Tìm user theo ID
    const user = await User.findById(userId);
    
    if (!user) {
      console.log(`[sendNotificationToUser] Không tìm thấy user: ${userId}`);
      return false;
    }
    
    if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      console.log(`[sendNotificationToUser] User ${userId} không có đăng ký push subscriptions nào`);
      return false;
    }
    
    console.log(`[sendNotificationToUser] Tìm thấy user ${userId} với ${user.pushSubscriptions.length} subscription`);

    const payload = {
      notification: {
        title: title,
        body: body,
        icon: '../../../Client/public/Logo.png', // Đường dẫn đến icon hiển thị trong thông báo
        badge: '../../../Client/public/Logo.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1,
          ...data
        },
        actions: [
          {
            action: 'explore',
            title: 'Xem ngay'
          }
        ]
      }
    };

    console.log(`[sendNotificationToUser] Payload được tạo:`, JSON.stringify(payload, null, 2));

    // Gửi thông báo đến tất cả các subscription của user
    console.log(`[sendNotificationToUser] Bắt đầu gửi đến ${user.pushSubscriptions.length} subscription`);
    
    const sendPromises = user.pushSubscriptions.map(subscription => {
      console.log(`[sendNotificationToUser] Gửi đến endpoint: ${subscription.endpoint.substring(0, 30)}...`);
      return sendPushNotification(userId, subscription, payload);
    });

    const results = await Promise.allSettled(sendPromises);
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;
    
    console.log(`[sendNotificationToUser] Kết quả gửi: ${successCount} thành công, ${failCount} thất bại`);
    
    return successCount > 0;
  } catch (error) {
    console.error('[sendNotificationToUser] Error sending notification to user:', userId, error);
    return false;
  }
};

// Gửi thông báo khi có sản phẩm mới
export const sendNewProductNotification = async (product) => {
  try {
    // Tìm tất cả user có đăng ký nhận thông báo
    const users = await User.find({ 
      pushSubscriptions: { $exists: true, $not: { $size: 0 } }
    });

    if (!users || users.length === 0) {
      console.log('No users with push subscriptions found');
      return;
    }

    const title = 'Sản phẩm mới!';
    const body = `${product.productName} đã được thêm vào cửa hàng. Giá: ${product.productPrice}đ`;
    
    const notificationPromises = users.map(user => 
      sendNotificationToUser(user._id, title, body, { 
        url: `/product/${product._id}`,
        productId: product._id,
        type: 'new_product'
      })
    );

    await Promise.allSettled(notificationPromises);
    console.log(`Sent new product notifications to ${users.length} users`);
    return true;
  } catch (error) {
    console.error('Error sending new product notifications:', error);
    return false;
  }
};

// Gửi thông báo khi có coupon mới
export const sendNewCouponNotification = async (coupon) => {
  try {
    // Tìm tất cả user có đăng ký nhận thông báo
    const users = await User.find({ 
      pushSubscriptions: { $exists: true, $not: { $size: 0 } }
    });

    if (!users || users.length === 0) {
      console.log('No users with push subscriptions found');
      return;
    }

    const title = 'Mã giảm giá mới!';
    const body = `Sử dụng mã ${coupon.code} để được giảm ${coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value}đ`}`;
    
    const notificationPromises = users.map(user => 
      sendNotificationToUser(user._id, title, body, { 
        url: `/coupons`,
        couponCode: coupon.code,
        type: 'new_coupon'
      })
    );

    await Promise.allSettled(notificationPromises);
    console.log(`Sent new coupon notifications to ${users.length} users`);
    return true;
  } catch (error) {
    console.error('Error sending new coupon notifications:', error);
    return false;
  }
};

// Gửi thông báo khi có phản hồi đánh giá
export const sendReviewReplyNotification = async (review) => {
  try {
    if (!review.userId || typeof review.userId !== 'string') {
      console.log('Invalid userId in review:', review);
      return false;
    }

    const title = 'Phản hồi đánh giá';
    const body = `Admin đã phản hồi đánh giá của bạn về sản phẩm "${review.productName || 'Sản phẩm'}"`;
    
    return await sendNotificationToUser(review.userId, title, body, {
      url: `/product/${review.productId}`,
      reviewId: review._id,
      type: 'review_reply'
    });
  } catch (error) {
    console.error('Error sending review reply notification:', error);
    return false;
  }
};

// Gửi thông báo cập nhật trạng thái đơn hàng
export const sendOrderStatusNotification = async (order) => {
  try {
    if (!order.userId) {
      console.log('Order has no userId:', order._id);
      return false;
    }

    let title = 'Cập nhật đơn hàng';
    let body = 'Đơn hàng của bạn đã được cập nhật';

    // Tùy chỉnh thông báo dựa trên trạng thái
    switch (order.status) {
      case 'confirmed':
        body = 'Đơn hàng của bạn đã được xác nhận';
        break;
      case 'preparing':
        body = 'Đơn hàng của bạn đang được chuẩn bị';
        break;
      case 'shipping':
      case 'delivering':
        body = 'Đơn hàng của bạn đang được giao đến bạn';
        break;
      case 'completed':
        title = 'Đơn hàng hoàn thành';
        body = 'Đơn hàng của bạn đã được giao thành công';
        break;
      case 'cancelled':
        title = 'Đơn hàng đã hủy';
        body = 'Đơn hàng của bạn đã bị hủy';
        break;
    }

    return await sendNotificationToUser(order.userId, title, body, {
      url: `/account/orders/${order._id}`,
      orderId: order._id,
      type: 'order_update'
    });
  } catch (error) {
    console.error('Error sending order status notification:', error);
    return false;
  }
};

// Gửi thông báo khi có tin nhắn mới
export const sendNewMessageNotification = async (userId, senderName, messageText) => {
  try {
    const title = 'Tin nhắn mới';
    const body = `${senderName}: ${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}`;
    
    return await sendNotificationToUser(userId, title, body, {
      url: '/account/messages',
      type: 'new_message'
    });
  } catch (error) {
    console.error('Error sending new message notification:', error);
    return false;
  }
}; 