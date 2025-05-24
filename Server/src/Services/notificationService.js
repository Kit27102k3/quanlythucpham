/* eslint-disable no-undef */
import webpush from 'web-push';
import dotenv from 'dotenv';
import User from '../Model/Register.js'; // Import User model
// import Admin from '../Model/adminModel.js'; // Import Admin model - commented out as not used yet
import Notification from '../Model/notificationModel.js'; // Import Notification model

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
    if (!subscription || !subscription.endpoint) {
      console.log(`Subscription không hợp lệ cho user ${userId}`);
      return { success: false, message: 'Subscription không hợp lệ' };
    }

    // Lưu thông báo vào DB trước khi gửi
    const notification = new Notification({
      userId,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      status: 'pending',
    });
    await notification.save();

    // Tạo payload với định dạng chi tiết hơn cho Web Push
    const webPushPayload = {
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.data?.icon || '/logo192.png',
        badge: '/badge-icon.png',
        vibrate: [100, 50, 100],
        tag: payload.data?.type || 'general',
        actions: payload.data?.actions || [
          {
            action: 'view',
            title: 'Xem ngay'
          }
        ],
        data: {
          ...payload.data,
          dateOfArrival: Date.now(),
          requireInteraction: true,
          renotify: true
        }
      }
    };

    // Gửi thông báo với payload đã tăng cường
    const result = await webpush.sendNotification(
      subscription, 
      JSON.stringify(webPushPayload)
    );
    
    // Cập nhật trạng thái sau khi gửi
    notification.status = 'sent';
    await notification.save();
    
    return { success: true, result };
  } catch (error) {
    console.error(`Lỗi khi gửi push notification cho user ${userId}:`, error.message);
    
    // Cập nhật thông báo là thất bại nhưng không dừng luồng xử lý
    try {
      await Notification.findOneAndUpdate(
        { userId, title: payload.title, body: payload.body, status: 'pending' },
        { status: 'failed', error: error.message }
      );
    } catch (dbError) {
      console.error('Lỗi khi cập nhật trạng thái thông báo:', dbError);
    }
    
    return { success: false, error: error.message };
  }
};

// Gửi thông báo cho một người dùng cụ thể (tất cả các thiết bị đã đăng ký)
export const sendNotificationToUser = async (userId, payload) => {
  try {
    console.log(`[sendNotificationToUser] Bắt đầu gửi thông báo cho user: ${userId}`);
    console.log(`[sendNotificationToUser] Tham số:`, payload);

    const user = await User.findById(userId);
    if (!user) {
      console.log(`[sendNotificationToUser] Không tìm thấy user với ID: ${userId}`);
      return { success: false, message: 'User không tồn tại' };
    }

    if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      console.log(`[sendNotificationToUser] User ${userId} không có đăng ký push subscriptions nào`);
      
      // Vẫn lưu thông báo vào DB để hiển thị trong ứng dụng
      try {
        const notification = new Notification({
          userId,
          title: payload.title,
          body: payload.body,
          data: payload.data,
          status: 'pending_view', // Trạng thái chờ xem trong ứng dụng
        });
        await notification.save();
      } catch (notifError) {
        console.error('Lỗi khi lưu thông báo:', notifError);
      }
      
      return { success: true, message: 'Đã lưu thông báo để hiển thị trong ứng dụng' };
    }

    // Gửi đến tất cả subscriptions của user
    const results = await Promise.all(
      user.pushSubscriptions.map(async (subscription) => {
        try {
          return await sendPushNotification(userId, subscription, payload);
        } catch (subError) {
          console.error(`Lỗi khi gửi đến subscription cụ thể:`, subError);
          return { success: false, error: subError.message };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    return { 
      success: successCount > 0,
      message: `Đã gửi thành công đến ${successCount}/${user.pushSubscriptions.length} thiết bị`
    };
  } catch (error) {
    console.error(`[sendNotificationToUser] Lỗi tổng thể:`, error);
    return { success: false, error: error.message };
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
      sendNotificationToUser(user._id, {
        title: title,
        body: body,
        data: {
          url: `/san-pham/${product._id}`,
          productId: product._id,
          type: 'new_product'
        }
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
      sendNotificationToUser(user._id, {
        title: title,
        body: body,
        data: {
          url: `/voucher`,
          couponCode: coupon.code,
          type: 'new_coupon'
        }
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
export const sendReviewReplyNotification = async (userId, review, replyText) => {
  try {
    console.log(`[sendReviewReplyNotification] Gửi thông báo phản hồi đánh giá cho user ${userId}`);
    const title = `Phản hồi đánh giá sản phẩm`;
    const body = `Admin: "${replyText.substring(0, 120)}${replyText.length > 120 ? '...' : ''}"`;
    
    // Thêm chi tiết trong payload
    return await sendNotificationToUser(userId, {
      title: title,
      body: body,
      data: {
        url: `/product/${review.productId}`,
        reviewId: review._id,
        type: 'review_reply',
        productName: review.productName,
        replyContent: replyText,
        icon: '/review-icon.png'
      }
    });
  } catch (error) {
    console.error('[sendReviewReplyNotification] Lỗi:', error);
    return { success: false, error: error.message };
  }
};

// Gửi thông báo cập nhật trạng thái đơn hàng
export const sendOrderStatusNotification = async (userId, order, statusText) => {
  try {
    console.log(`[sendOrderStatusNotification] Gửi thông báo đơn hàng ${order._id} cho user ${userId}`);
    const title = `Cập nhật đơn hàng #${order.orderNumber || order._id.toString().substring(0, 8)}`;
    let body = `Đơn hàng của bạn ${statusText}`;
    
    if (order.totalAmount) {
      body += ` - Giá trị: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}`;
    }
    
    // Thêm chi tiết trong payload
    return await sendNotificationToUser(userId, {
      title: title,
      body: body,
      data: {
        url: `/tai-khoan/don-hang/${order._id}`,
        orderId: order._id,
        type: 'order_update',
        status: order.status,
        orderItems: order.items && order.items.length > 0 ? order.items.map(item => ({
          name: item.productName,
          quantity: item.quantity
        })) : [],
        icon: '/order-icon.png'
      }
    });
  } catch (error) {
    console.error('[sendOrderStatusNotification] Lỗi:', error);
    return { success: false, error: error.message };
  }
};

// Gửi thông báo khi có tin nhắn mới
export const sendMessageNotification = async (userId, senderName, messageText) => {
  try {
    console.log(`[sendMessageNotification] Gửi thông báo tin nhắn từ ${senderName} đến user ${userId}`);
    const title = `Tin nhắn mới từ ${senderName}`;
    const body = messageText.length > 100 
      ? `${messageText.substring(0, 100)}...` 
      : messageText;
    
    // Thêm chi tiết trong payload
    return await sendNotificationToUser(userId, {
      title: title,
      body: body,
      data: {
        url: '/tai-khoan/tin-nhan',
        type: 'new_message',
        senderId: senderName,
        messageContent: messageText,
        icon: '/chat-icon.png',
        actions: [
          {
            action: 'reply',
            title: 'Trả lời'
          },
          {
            action: 'view',
            title: 'Xem tất cả'
          }
        ]
      }
    });
  } catch (error) {
    console.error('[sendMessageNotification] Lỗi:', error);
    return { success: false, error: error.message };
  }
};