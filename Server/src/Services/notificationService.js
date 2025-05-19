import webpush from 'web-push';
import dotenv from 'dotenv';
import User from '../Model/Register.js'; // Import User model
// import Admin from '../Model/adminModel.js'; // Import Admin model - commented out as not used yet

dotenv.config();

// Configure web-push with VAPID keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

webpush.setVapidDetails(
  'kit10012003@gmail.com', // TODO: Replace with a valid email address
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Function to send a push notification to a single subscription
export const sendPushNotification = async (userId, subscription, payload) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log('Push notification sent successfully for user:', userId);
  } catch (error) {
    console.error('Error sending push notification for user:', userId, ':', error);

    // Handle cases where the subscription is no longer valid
    if (error.statusCode === 404 || error.statusCode === 410) {
      console.log('Subscription expired or no longer valid for user:', userId, '. Removing...');
      // Implement logic to remove the expired/invalid subscription from the database
      try {
        await User.findByIdAndUpdate(
          userId,
          { $pull: { pushSubscriptions: { endpoint: subscription.endpoint } } },
          { new: true }
        );
        console.log('Removed invalid subscription for user:', userId, ':', subscription.endpoint);
      } catch (dbError) {
        console.error('Error removing invalid subscription from database for user:', userId, ':', dbError);
      }

    } else {
      // Handle other errors
      console.error('Failed to send push notification for user:', userId, ':', error);
    }
  }
};

// Gửi thông báo cho một người dùng cụ thể (tất cả các thiết bị đã đăng ký)
export const sendNotificationToUser = async (userId, title, body, data = {}) => {
  try {
    // Tìm user theo ID
    const user = await User.findById(userId);
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      console.log('User not found or has no push subscriptions:', userId);
      return;
    }

    const payload = {
      notification: {
        title: title,
        body: body,
        icon: '/logo192.png', // Đường dẫn đến icon hiển thị trong thông báo
        badge: '/logo192.png',
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

    // Gửi thông báo đến tất cả các subscription của user
    const sendPromises = user.pushSubscriptions.map(subscription => 
      sendPushNotification(userId, subscription, payload)
    );

    await Promise.allSettled(sendPromises);
    return true;
  } catch (error) {
    console.error('Error sending notification to user:', userId, error);
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