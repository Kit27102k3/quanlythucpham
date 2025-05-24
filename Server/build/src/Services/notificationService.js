"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.sendReviewReplyNotification = exports.sendPushNotification = exports.sendOrderStatusNotification = exports.sendNotificationToUser = exports.sendNewProductNotification = exports.sendNewCouponNotification = exports.sendMessageNotification = void 0;
var _webPush = _interopRequireDefault(require("web-push"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _Register = _interopRequireDefault(require("../Model/Register.js"));

var _notificationModel = _interopRequireDefault(require("../Model/notificationModel.js"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };} /* eslint-disable no-undef */ // Import User model
// import Admin from '../Model/adminModel.js'; // Import Admin model - commented out as not used yet
// Import Notification model
// Cấu hình dotenv
_dotenv.default.config();
// Lấy VAPID keys từ biến môi trường
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

console.log('Kiểm tra VAPID keys:');
console.log('- Public key exists:', !!vapidPublicKey);
console.log('- Private key exists:', !!vapidPrivateKey);

// Configure web-push with VAPID keys
try {
  _webPush.default.setVapidDetails(
    'mailto:kit10012003@gmail.com', // Đảm bảo có tiền tố mailto:
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('✅ VAPID details set successfully');
} catch (error) {
  console.error('❌ Error setting VAPID details:', error);
}

// Function to send a push notification to a single subscription
const sendPushNotification = async (userId, subscription, payload) => {
  try {
    if (!subscription || !subscription.endpoint) {
      console.log(`Subscription không hợp lệ cho user ${userId}`);
      return { success: false, message: 'Subscription không hợp lệ' };
    }

    // Lưu thông báo vào DB trước khi gửi
    const notification = new _notificationModel.default({
      userId,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      status: 'pending'
    });
    await notification.save();

    // Tạo payload với định dạng chi tiết hơn cho Web Push
    const webPushPayload = {
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.data && payload.data.icon ? payload.data.icon : '/logo192.png',
        badge: '/badge-icon.png',
        vibrate: [100, 50, 100],
        tag: payload.data && payload.data.type ? payload.data.type : 'general',
        actions: payload.data && payload.data.actions ? payload.data.actions : [
        {
          action: 'view',
          title: 'Xem ngay'
        }],

        data: {
          ...payload.data,
          dateOfArrival: Date.now(),
          requireInteraction: true,
          renotify: true
        }
      }
    };

    // Gửi thông báo với payload đã tăng cường
    const result = await _webPush.default.sendNotification(
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
      await _notificationModel.default.findOneAndUpdate(
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
exports.sendPushNotification = sendPushNotification;const sendNotificationToUser = async (userId, payload) => {
  try {
    console.log(`[sendNotificationToUser] Bắt đầu gửi thông báo cho user: ${userId}`);
    console.log(`[sendNotificationToUser] Tham số:`, payload);

    const user = await _Register.default.findById(userId);
    if (!user) {
      console.log(`[sendNotificationToUser] Không tìm thấy user với ID: ${userId}`);
      return { success: false, message: 'User không tồn tại' };
    }

    if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      console.log(`[sendNotificationToUser] User ${userId} không có đăng ký push subscriptions nào`);

      // Vẫn lưu thông báo vào DB để hiển thị trong ứng dụng
      try {
        const notification = new _notificationModel.default({
          userId,
          title: payload.title,
          body: payload.body,
          data: payload.data,
          status: 'pending_view' // Trạng thái chờ xem trong ứng dụng
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

    const successCount = results.filter((r) => r.success).length;
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
exports.sendNotificationToUser = sendNotificationToUser;const sendNewProductNotification = async (product) => {
  try {
    // Tìm tất cả user có đăng ký nhận thông báo
    const users = await _Register.default.find({
      pushSubscriptions: { $exists: true, $not: { $size: 0 } }
    });

    if (!users || users.length === 0) {
      console.log('No users with push subscriptions found');
      return;
    }

    const title = 'Sản phẩm mới!';
    const body = `${product.productName} đã được thêm vào cửa hàng. Giá: ${product.productPrice}đ`;

    const notificationPromises = users.map((user) =>
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
exports.sendNewProductNotification = sendNewProductNotification;const sendNewCouponNotification = async (coupon) => {
  try {
    // Tìm tất cả user có đăng ký nhận thông báo
    const users = await _Register.default.find({
      pushSubscriptions: { $exists: true, $not: { $size: 0 } }
    });

    if (!users || users.length === 0) {
      console.log('No users with push subscriptions found');
      return;
    }

    const title = 'Mã giảm giá mới!';
    const body = `Sử dụng mã ${coupon.code} để được giảm ${coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value}đ`}`;

    const notificationPromises = users.map((user) =>
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
exports.sendNewCouponNotification = sendNewCouponNotification;const sendReviewReplyNotification = async (userId, review, replyText) => {
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
exports.sendReviewReplyNotification = sendReviewReplyNotification;const sendOrderStatusNotification = async (userId, order, statusText) => {
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
        orderItems: order.items && order.items.length > 0 ? order.items.map((item) => ({
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
exports.sendOrderStatusNotification = sendOrderStatusNotification;const sendMessageNotification = async (userId, senderName, messageText) => {
  try {
    console.log(`[sendMessageNotification] Gửi thông báo tin nhắn từ ${senderName} đến user ${userId}`);
    const title = `Tin nhắn mới từ ${senderName}`;
    const body = messageText.length > 100 ?
    `${messageText.substring(0, 100)}...` :
    messageText;

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
        }]

      }
    });
  } catch (error) {
    console.error('[sendMessageNotification] Lỗi:', error);
    return { success: false, error: error.message };
  }
};exports.sendMessageNotification = sendMessageNotification;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfd2ViUHVzaCIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwiX2RvdGVudiIsIl9SZWdpc3RlciIsIl9ub3RpZmljYXRpb25Nb2RlbCIsImUiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImRvdGVudiIsImNvbmZpZyIsInZhcGlkUHVibGljS2V5IiwicHJvY2VzcyIsImVudiIsIlZBUElEX1BVQkxJQ19LRVkiLCJ2YXBpZFByaXZhdGVLZXkiLCJWQVBJRF9QUklWQVRFX0tFWSIsImNvbnNvbGUiLCJsb2ciLCJ3ZWJwdXNoIiwic2V0VmFwaWREZXRhaWxzIiwiZXJyb3IiLCJzZW5kUHVzaE5vdGlmaWNhdGlvbiIsInVzZXJJZCIsInN1YnNjcmlwdGlvbiIsInBheWxvYWQiLCJlbmRwb2ludCIsInN1Y2Nlc3MiLCJtZXNzYWdlIiwibm90aWZpY2F0aW9uIiwiTm90aWZpY2F0aW9uIiwidGl0bGUiLCJib2R5IiwiZGF0YSIsInN0YXR1cyIsInNhdmUiLCJ3ZWJQdXNoUGF5bG9hZCIsImljb24iLCJiYWRnZSIsInZpYnJhdGUiLCJ0YWciLCJ0eXBlIiwiYWN0aW9ucyIsImFjdGlvbiIsImRhdGVPZkFycml2YWwiLCJEYXRlIiwibm93IiwicmVxdWlyZUludGVyYWN0aW9uIiwicmVub3RpZnkiLCJyZXN1bHQiLCJzZW5kTm90aWZpY2F0aW9uIiwiSlNPTiIsInN0cmluZ2lmeSIsImZpbmRPbmVBbmRVcGRhdGUiLCJkYkVycm9yIiwiZXhwb3J0cyIsInNlbmROb3RpZmljYXRpb25Ub1VzZXIiLCJ1c2VyIiwiVXNlciIsImZpbmRCeUlkIiwicHVzaFN1YnNjcmlwdGlvbnMiLCJsZW5ndGgiLCJub3RpZkVycm9yIiwicmVzdWx0cyIsIlByb21pc2UiLCJhbGwiLCJtYXAiLCJzdWJFcnJvciIsInN1Y2Nlc3NDb3VudCIsImZpbHRlciIsInIiLCJzZW5kTmV3UHJvZHVjdE5vdGlmaWNhdGlvbiIsInByb2R1Y3QiLCJ1c2VycyIsImZpbmQiLCIkZXhpc3RzIiwiJG5vdCIsIiRzaXplIiwicHJvZHVjdE5hbWUiLCJwcm9kdWN0UHJpY2UiLCJub3RpZmljYXRpb25Qcm9taXNlcyIsIl9pZCIsInVybCIsInByb2R1Y3RJZCIsImFsbFNldHRsZWQiLCJzZW5kTmV3Q291cG9uTm90aWZpY2F0aW9uIiwiY291cG9uIiwiY29kZSIsInZhbHVlIiwiY291cG9uQ29kZSIsInNlbmRSZXZpZXdSZXBseU5vdGlmaWNhdGlvbiIsInJldmlldyIsInJlcGx5VGV4dCIsInN1YnN0cmluZyIsInJldmlld0lkIiwicmVwbHlDb250ZW50Iiwic2VuZE9yZGVyU3RhdHVzTm90aWZpY2F0aW9uIiwib3JkZXIiLCJzdGF0dXNUZXh0Iiwib3JkZXJOdW1iZXIiLCJ0b1N0cmluZyIsInRvdGFsQW1vdW50IiwiSW50bCIsIk51bWJlckZvcm1hdCIsInN0eWxlIiwiY3VycmVuY3kiLCJmb3JtYXQiLCJvcmRlcklkIiwib3JkZXJJdGVtcyIsIml0ZW1zIiwiaXRlbSIsIm5hbWUiLCJxdWFudGl0eSIsInNlbmRNZXNzYWdlTm90aWZpY2F0aW9uIiwic2VuZGVyTmFtZSIsIm1lc3NhZ2VUZXh0Iiwic2VuZGVySWQiLCJtZXNzYWdlQ29udGVudCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9TZXJ2aWNlcy9ub3RpZmljYXRpb25TZXJ2aWNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIG5vLXVuZGVmICovXG5pbXBvcnQgd2VicHVzaCBmcm9tICd3ZWItcHVzaCc7XG5pbXBvcnQgZG90ZW52IGZyb20gJ2RvdGVudic7XG5pbXBvcnQgVXNlciBmcm9tICcuLi9Nb2RlbC9SZWdpc3Rlci5qcyc7IC8vIEltcG9ydCBVc2VyIG1vZGVsXG4vLyBpbXBvcnQgQWRtaW4gZnJvbSAnLi4vTW9kZWwvYWRtaW5Nb2RlbC5qcyc7IC8vIEltcG9ydCBBZG1pbiBtb2RlbCAtIGNvbW1lbnRlZCBvdXQgYXMgbm90IHVzZWQgeWV0XG5pbXBvcnQgTm90aWZpY2F0aW9uIGZyb20gJy4uL01vZGVsL25vdGlmaWNhdGlvbk1vZGVsLmpzJzsgLy8gSW1wb3J0IE5vdGlmaWNhdGlvbiBtb2RlbFxuXG4vLyBD4bqldSBow6xuaCBkb3RlbnZcbmRvdGVudi5jb25maWcoKTtcblxuLy8gTOG6pXkgVkFQSUQga2V5cyB04burIGJp4bq/biBtw7RpIHRyxrDhu51uZ1xuY29uc3QgdmFwaWRQdWJsaWNLZXkgPSBwcm9jZXNzLmVudi5WQVBJRF9QVUJMSUNfS0VZO1xuY29uc3QgdmFwaWRQcml2YXRlS2V5ID0gcHJvY2Vzcy5lbnYuVkFQSURfUFJJVkFURV9LRVk7XG5cbmNvbnNvbGUubG9nKCdLaeG7g20gdHJhIFZBUElEIGtleXM6Jyk7XG5jb25zb2xlLmxvZygnLSBQdWJsaWMga2V5IGV4aXN0czonLCAhIXZhcGlkUHVibGljS2V5KTtcbmNvbnNvbGUubG9nKCctIFByaXZhdGUga2V5IGV4aXN0czonLCAhIXZhcGlkUHJpdmF0ZUtleSk7XG5cbi8vIENvbmZpZ3VyZSB3ZWItcHVzaCB3aXRoIFZBUElEIGtleXNcbnRyeSB7XG53ZWJwdXNoLnNldFZhcGlkRGV0YWlscyhcbiAgICAnbWFpbHRvOmtpdDEwMDEyMDAzQGdtYWlsLmNvbScsIC8vIMSQ4bqjbSBi4bqjbyBjw7MgdGnhu4FuIHThu5EgbWFpbHRvOlxuICAgIHZhcGlkUHVibGljS2V5LFxuICAgIHZhcGlkUHJpdmF0ZUtleVxuICApO1xuICBjb25zb2xlLmxvZygn4pyFIFZBUElEIGRldGFpbHMgc2V0IHN1Y2Nlc3NmdWxseScpO1xufSBjYXRjaCAoZXJyb3IpIHtcbiAgY29uc29sZS5lcnJvcign4p2MIEVycm9yIHNldHRpbmcgVkFQSUQgZGV0YWlsczonLCBlcnJvcik7XG59XG5cbi8vIEZ1bmN0aW9uIHRvIHNlbmQgYSBwdXNoIG5vdGlmaWNhdGlvbiB0byBhIHNpbmdsZSBzdWJzY3JpcHRpb25cbmV4cG9ydCBjb25zdCBzZW5kUHVzaE5vdGlmaWNhdGlvbiA9IGFzeW5jICh1c2VySWQsIHN1YnNjcmlwdGlvbiwgcGF5bG9hZCkgPT4ge1xuICB0cnkge1xuICAgIGlmICghc3Vic2NyaXB0aW9uIHx8ICFzdWJzY3JpcHRpb24uZW5kcG9pbnQpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBTdWJzY3JpcHRpb24ga2jDtG5nIGjhu6NwIGzhu4cgY2hvIHVzZXIgJHt1c2VySWR9YCk7XG4gICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogJ1N1YnNjcmlwdGlvbiBraMO0bmcgaOG7o3AgbOG7hycgfTtcbiAgICB9XG5cbiAgICAvLyBMxrB1IHRow7RuZyBiw6FvIHbDoG8gREIgdHLGsOG7m2Mga2hpIGfhu61pXG4gICAgY29uc3Qgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbih7XG4gICAgICB1c2VySWQsXG4gICAgICB0aXRsZTogcGF5bG9hZC50aXRsZSxcbiAgICAgIGJvZHk6IHBheWxvYWQuYm9keSxcbiAgICAgIGRhdGE6IHBheWxvYWQuZGF0YSxcbiAgICAgIHN0YXR1czogJ3BlbmRpbmcnLFxuICAgIH0pO1xuICAgIGF3YWl0IG5vdGlmaWNhdGlvbi5zYXZlKCk7XG5cbiAgICAvLyBU4bqhbyBwYXlsb2FkIHbhu5tpIMSR4buLbmggZOG6oW5nIGNoaSB0aeG6v3QgaMahbiBjaG8gV2ViIFB1c2hcbiAgICBjb25zdCB3ZWJQdXNoUGF5bG9hZCA9IHtcbiAgICAgIG5vdGlmaWNhdGlvbjoge1xuICAgICAgICB0aXRsZTogcGF5bG9hZC50aXRsZSxcbiAgICAgICAgYm9keTogcGF5bG9hZC5ib2R5LFxuICAgICAgICBpY29uOiBwYXlsb2FkLmRhdGEgJiYgcGF5bG9hZC5kYXRhLmljb24gPyBwYXlsb2FkLmRhdGEuaWNvbiA6ICcvbG9nbzE5Mi5wbmcnLFxuICAgICAgICBiYWRnZTogJy9iYWRnZS1pY29uLnBuZycsXG4gICAgICAgIHZpYnJhdGU6IFsxMDAsIDUwLCAxMDBdLFxuICAgICAgICB0YWc6IHBheWxvYWQuZGF0YSAmJiBwYXlsb2FkLmRhdGEudHlwZSA/IHBheWxvYWQuZGF0YS50eXBlIDogJ2dlbmVyYWwnLFxuICAgICAgICBhY3Rpb25zOiBwYXlsb2FkLmRhdGEgJiYgcGF5bG9hZC5kYXRhLmFjdGlvbnMgPyBwYXlsb2FkLmRhdGEuYWN0aW9ucyA6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBhY3Rpb246ICd2aWV3JyxcbiAgICAgICAgICAgIHRpdGxlOiAnWGVtIG5nYXknXG4gICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgLi4ucGF5bG9hZC5kYXRhLFxuICAgICAgICAgIGRhdGVPZkFycml2YWw6IERhdGUubm93KCksXG4gICAgICAgICAgcmVxdWlyZUludGVyYWN0aW9uOiB0cnVlLFxuICAgICAgICAgIHJlbm90aWZ5OiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gR+G7rWkgdGjDtG5nIGLDoW8gduG7m2kgcGF5bG9hZCDEkcOjIHTEg25nIGPGsOG7nW5nXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgd2VicHVzaC5zZW5kTm90aWZpY2F0aW9uKFxuICAgICAgc3Vic2NyaXB0aW9uLCBcbiAgICAgIEpTT04uc3RyaW5naWZ5KHdlYlB1c2hQYXlsb2FkKVxuICAgICk7XG4gICAgXG4gICAgLy8gQ+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgc2F1IGtoaSBn4butaVxuICAgIG5vdGlmaWNhdGlvbi5zdGF0dXMgPSAnc2VudCc7XG4gICAgYXdhaXQgbm90aWZpY2F0aW9uLnNhdmUoKTtcbiAgICBcbiAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCByZXN1bHQgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBM4buXaSBraGkgZ+G7rWkgcHVzaCBub3RpZmljYXRpb24gY2hvIHVzZXIgJHt1c2VySWR9OmAsIGVycm9yLm1lc3NhZ2UpO1xuICAgIFxuICAgIC8vIEPhuq1wIG5o4bqtdCB0aMO0bmcgYsOhbyBsw6AgdGjhuqV0IGLhuqFpIG5oxrBuZyBraMO0bmcgZOG7q25nIGx14buTbmcgeOG7rSBsw71cbiAgICB0cnkge1xuICAgICAgYXdhaXQgTm90aWZpY2F0aW9uLmZpbmRPbmVBbmRVcGRhdGUoXG4gICAgICAgIHsgdXNlcklkLCB0aXRsZTogcGF5bG9hZC50aXRsZSwgYm9keTogcGF5bG9hZC5ib2R5LCBzdGF0dXM6ICdwZW5kaW5nJyB9LFxuICAgICAgICB7IHN0YXR1czogJ2ZhaWxlZCcsIGVycm9yOiBlcnJvci5tZXNzYWdlIH1cbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZGJFcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignTOG7l2kga2hpIGPhuq1wIG5o4bqtdCB0cuG6oW5nIHRow6FpIHRow7RuZyBiw6FvOicsIGRiRXJyb3IpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgfVxufTtcblxuLy8gR+G7rWkgdGjDtG5nIGLDoW8gY2hvIG3hu5l0IG5nxrDhu51pIGTDuW5nIGPhu6UgdGjhu4MgKHThuqV0IGPhuqMgY8OhYyB0aGnhur90IGLhu4sgxJHDoyDEkcSDbmcga8O9KVxuZXhwb3J0IGNvbnN0IHNlbmROb3RpZmljYXRpb25Ub1VzZXIgPSBhc3luYyAodXNlcklkLCBwYXlsb2FkKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2coYFtzZW5kTm90aWZpY2F0aW9uVG9Vc2VyXSBC4bqvdCDEkeG6p3UgZ+G7rWkgdGjDtG5nIGLDoW8gY2hvIHVzZXI6ICR7dXNlcklkfWApO1xuICAgIGNvbnNvbGUubG9nKGBbc2VuZE5vdGlmaWNhdGlvblRvVXNlcl0gVGhhbSBz4buROmAsIHBheWxvYWQpO1xuXG4gICAgY29uc3QgdXNlciA9IGF3YWl0IFVzZXIuZmluZEJ5SWQodXNlcklkKTtcbiAgICBpZiAoIXVzZXIpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbc2VuZE5vdGlmaWNhdGlvblRvVXNlcl0gS2jDtG5nIHTDrG0gdGjhuqV5IHVzZXIgduG7m2kgSUQ6ICR7dXNlcklkfWApO1xuICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdVc2VyIGtow7RuZyB04buTbiB04bqhaScgfTtcbiAgICB9XG5cbiAgICBpZiAoIXVzZXIucHVzaFN1YnNjcmlwdGlvbnMgfHwgdXNlci5wdXNoU3Vic2NyaXB0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbc2VuZE5vdGlmaWNhdGlvblRvVXNlcl0gVXNlciAke3VzZXJJZH0ga2jDtG5nIGPDsyDEkcSDbmcga8O9IHB1c2ggc3Vic2NyaXB0aW9ucyBuw6BvYCk7XG4gICAgICBcbiAgICAgIC8vIFbhuqtuIGzGsHUgdGjDtG5nIGLDoW8gdsOgbyBEQiDEkeG7gyBoaeG7g24gdGjhu4sgdHJvbmcg4bupbmcgZOG7pW5nXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKHtcbiAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAgdGl0bGU6IHBheWxvYWQudGl0bGUsXG4gICAgICAgICAgYm9keTogcGF5bG9hZC5ib2R5LFxuICAgICAgICAgIGRhdGE6IHBheWxvYWQuZGF0YSxcbiAgICAgICAgICBzdGF0dXM6ICdwZW5kaW5nX3ZpZXcnLCAvLyBUcuG6oW5nIHRow6FpIGNo4budIHhlbSB0cm9uZyDhu6luZyBk4bulbmdcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IG5vdGlmaWNhdGlvbi5zYXZlKCk7XG4gICAgICB9IGNhdGNoIChub3RpZkVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0zhu5dpIGtoaSBsxrB1IHRow7RuZyBiw6FvOicsIG5vdGlmRXJyb3IpO1xuICAgICAgfVxuICAgICAgXG4gICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAnxJDDoyBsxrB1IHRow7RuZyBiw6FvIMSR4buDIGhp4buDbiB0aOG7iyB0cm9uZyDhu6luZyBk4bulbmcnIH07XG4gICAgfVxuXG4gICAgLy8gR+G7rWkgxJHhur9uIHThuqV0IGPhuqMgc3Vic2NyaXB0aW9ucyBj4bunYSB1c2VyXG4gICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgdXNlci5wdXNoU3Vic2NyaXB0aW9ucy5tYXAoYXN5bmMgKHN1YnNjcmlwdGlvbikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBhd2FpdCBzZW5kUHVzaE5vdGlmaWNhdGlvbih1c2VySWQsIHN1YnNjcmlwdGlvbiwgcGF5bG9hZCk7XG4gICAgICAgIH0gY2F0Y2ggKHN1YkVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgTOG7l2kga2hpIGfhu61pIMSR4bq/biBzdWJzY3JpcHRpb24gY+G7pSB0aOG7gzpgLCBzdWJFcnJvcik7XG4gICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBzdWJFcnJvci5tZXNzYWdlIH07XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcblxuICAgIGNvbnN0IHN1Y2Nlc3NDb3VudCA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5zdWNjZXNzKS5sZW5ndGg7XG4gICAgcmV0dXJuIHsgXG4gICAgICBzdWNjZXNzOiBzdWNjZXNzQ291bnQgPiAwLFxuICAgICAgbWVzc2FnZTogYMSQw6MgZ+G7rWkgdGjDoG5oIGPDtG5nIMSR4bq/biAke3N1Y2Nlc3NDb3VudH0vJHt1c2VyLnB1c2hTdWJzY3JpcHRpb25zLmxlbmd0aH0gdGhp4bq/dCBi4buLYFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgW3NlbmROb3RpZmljYXRpb25Ub1VzZXJdIEzhu5dpIHThu5VuZyB0aOG7gzpgLCBlcnJvcik7XG4gICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH07XG4gIH1cbn07XG5cbi8vIEfhu61pIHRow7RuZyBiw6FvIGtoaSBjw7Mgc+G6o24gcGjhuqltIG3hu5tpXG5leHBvcnQgY29uc3Qgc2VuZE5ld1Byb2R1Y3ROb3RpZmljYXRpb24gPSBhc3luYyAocHJvZHVjdCkgPT4ge1xuICB0cnkge1xuICAgIC8vIFTDrG0gdOG6pXQgY+G6oyB1c2VyIGPDsyDEkcSDbmcga8O9IG5o4bqtbiB0aMO0bmcgYsOhb1xuICAgIGNvbnN0IHVzZXJzID0gYXdhaXQgVXNlci5maW5kKHsgXG4gICAgICBwdXNoU3Vic2NyaXB0aW9uczogeyAkZXhpc3RzOiB0cnVlLCAkbm90OiB7ICRzaXplOiAwIH0gfVxuICAgIH0pO1xuXG4gICAgaWYgKCF1c2VycyB8fCB1c2Vycy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKCdObyB1c2VycyB3aXRoIHB1c2ggc3Vic2NyaXB0aW9ucyBmb3VuZCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRpdGxlID0gJ1PhuqNuIHBo4bqpbSBt4bubaSEnO1xuICAgIGNvbnN0IGJvZHkgPSBgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfSDEkcOjIMSRxrDhu6NjIHRow6ptIHbDoG8gY+G7rWEgaMOgbmcuIEdpw6E6ICR7cHJvZHVjdC5wcm9kdWN0UHJpY2V9xJFgO1xuICAgIFxuICAgIGNvbnN0IG5vdGlmaWNhdGlvblByb21pc2VzID0gdXNlcnMubWFwKHVzZXIgPT4gXG4gICAgICBzZW5kTm90aWZpY2F0aW9uVG9Vc2VyKHVzZXIuX2lkLCB7XG4gICAgICAgIHRpdGxlOiB0aXRsZSxcbiAgICAgICAgYm9keTogYm9keSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIHVybDogYC9zYW4tcGhhbS8ke3Byb2R1Y3QuX2lkfWAsXG4gICAgICAgICAgcHJvZHVjdElkOiBwcm9kdWN0Ll9pZCxcbiAgICAgICAgICB0eXBlOiAnbmV3X3Byb2R1Y3QnXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcblxuICAgIGF3YWl0IFByb21pc2UuYWxsU2V0dGxlZChub3RpZmljYXRpb25Qcm9taXNlcyk7XG4gICAgY29uc29sZS5sb2coYFNlbnQgbmV3IHByb2R1Y3Qgbm90aWZpY2F0aW9ucyB0byAke3VzZXJzLmxlbmd0aH0gdXNlcnNgKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzZW5kaW5nIG5ldyBwcm9kdWN0IG5vdGlmaWNhdGlvbnM6JywgZXJyb3IpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxuLy8gR+G7rWkgdGjDtG5nIGLDoW8ga2hpIGPDsyBjb3Vwb24gbeG7m2lcbmV4cG9ydCBjb25zdCBzZW5kTmV3Q291cG9uTm90aWZpY2F0aW9uID0gYXN5bmMgKGNvdXBvbikgPT4ge1xuICB0cnkge1xuICAgIC8vIFTDrG0gdOG6pXQgY+G6oyB1c2VyIGPDsyDEkcSDbmcga8O9IG5o4bqtbiB0aMO0bmcgYsOhb1xuICAgIGNvbnN0IHVzZXJzID0gYXdhaXQgVXNlci5maW5kKHsgXG4gICAgICBwdXNoU3Vic2NyaXB0aW9uczogeyAkZXhpc3RzOiB0cnVlLCAkbm90OiB7ICRzaXplOiAwIH0gfVxuICAgIH0pO1xuXG4gICAgaWYgKCF1c2VycyB8fCB1c2Vycy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKCdObyB1c2VycyB3aXRoIHB1c2ggc3Vic2NyaXB0aW9ucyBmb3VuZCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRpdGxlID0gJ03DoyBnaeG6o20gZ2nDoSBt4bubaSEnO1xuICAgIGNvbnN0IGJvZHkgPSBgU+G7rSBk4bulbmcgbcOjICR7Y291cG9uLmNvZGV9IMSR4buDIMSRxrDhu6NjIGdp4bqjbSAke2NvdXBvbi50eXBlID09PSAncGVyY2VudGFnZScgPyBgJHtjb3Vwb24udmFsdWV9JWAgOiBgJHtjb3Vwb24udmFsdWV9xJFgfWA7XG4gICAgXG4gICAgY29uc3Qgbm90aWZpY2F0aW9uUHJvbWlzZXMgPSB1c2Vycy5tYXAodXNlciA9PiBcbiAgICAgIHNlbmROb3RpZmljYXRpb25Ub1VzZXIodXNlci5faWQsIHtcbiAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICBib2R5OiBib2R5LFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgdXJsOiBgL3ZvdWNoZXJgLFxuICAgICAgICAgIGNvdXBvbkNvZGU6IGNvdXBvbi5jb2RlLFxuICAgICAgICAgIHR5cGU6ICduZXdfY291cG9uJ1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICk7XG5cbiAgICBhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQobm90aWZpY2F0aW9uUHJvbWlzZXMpO1xuICAgIGNvbnNvbGUubG9nKGBTZW50IG5ldyBjb3Vwb24gbm90aWZpY2F0aW9ucyB0byAke3VzZXJzLmxlbmd0aH0gdXNlcnNgKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzZW5kaW5nIG5ldyBjb3Vwb24gbm90aWZpY2F0aW9uczonLCBlcnJvcik7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG4vLyBH4butaSB0aMO0bmcgYsOhbyBraGkgY8OzIHBo4bqjbiBo4buTaSDEkcOhbmggZ2nDoVxuZXhwb3J0IGNvbnN0IHNlbmRSZXZpZXdSZXBseU5vdGlmaWNhdGlvbiA9IGFzeW5jICh1c2VySWQsIHJldmlldywgcmVwbHlUZXh0KSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2coYFtzZW5kUmV2aWV3UmVwbHlOb3RpZmljYXRpb25dIEfhu61pIHRow7RuZyBiw6FvIHBo4bqjbiBo4buTaSDEkcOhbmggZ2nDoSBjaG8gdXNlciAke3VzZXJJZH1gKTtcbiAgICBjb25zdCB0aXRsZSA9IGBQaOG6o24gaOG7k2kgxJHDoW5oIGdpw6Egc+G6o24gcGjhuqltYDtcbiAgICBjb25zdCBib2R5ID0gYEFkbWluOiBcIiR7cmVwbHlUZXh0LnN1YnN0cmluZygwLCAxMjApfSR7cmVwbHlUZXh0Lmxlbmd0aCA+IDEyMCA/ICcuLi4nIDogJyd9XCJgO1xuICAgIFxuICAgIC8vIFRow6ptIGNoaSB0aeG6v3QgdHJvbmcgcGF5bG9hZFxuICAgIHJldHVybiBhd2FpdCBzZW5kTm90aWZpY2F0aW9uVG9Vc2VyKHVzZXJJZCwge1xuICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgYm9keTogYm9keSxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgdXJsOiBgL3Byb2R1Y3QvJHtyZXZpZXcucHJvZHVjdElkfWAsXG4gICAgICAgIHJldmlld0lkOiByZXZpZXcuX2lkLFxuICAgICAgICB0eXBlOiAncmV2aWV3X3JlcGx5JyxcbiAgICAgICAgcHJvZHVjdE5hbWU6IHJldmlldy5wcm9kdWN0TmFtZSxcbiAgICAgICAgcmVwbHlDb250ZW50OiByZXBseVRleHQsXG4gICAgICAgIGljb246ICcvcmV2aWV3LWljb24ucG5nJ1xuICAgICAgfVxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1tzZW5kUmV2aWV3UmVwbHlOb3RpZmljYXRpb25dIEzhu5dpOicsIGVycm9yKTtcbiAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgfVxufTtcblxuLy8gR+G7rWkgdGjDtG5nIGLDoW8gY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgxJHGoW4gaMOgbmdcbmV4cG9ydCBjb25zdCBzZW5kT3JkZXJTdGF0dXNOb3RpZmljYXRpb24gPSBhc3luYyAodXNlcklkLCBvcmRlciwgc3RhdHVzVGV4dCkgPT4ge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKGBbc2VuZE9yZGVyU3RhdHVzTm90aWZpY2F0aW9uXSBH4butaSB0aMO0bmcgYsOhbyDEkcahbiBow6BuZyAke29yZGVyLl9pZH0gY2hvIHVzZXIgJHt1c2VySWR9YCk7XG4gICAgY29uc3QgdGl0bGUgPSBgQ+G6rXAgbmjhuq10IMSRxqFuIGjDoG5nICMke29yZGVyLm9yZGVyTnVtYmVyIHx8IG9yZGVyLl9pZC50b1N0cmluZygpLnN1YnN0cmluZygwLCA4KX1gO1xuICAgIGxldCBib2R5ID0gYMSQxqFuIGjDoG5nIGPhu6dhIGLhuqFuICR7c3RhdHVzVGV4dH1gO1xuICAgIFxuICAgIGlmIChvcmRlci50b3RhbEFtb3VudCkge1xuICAgICAgYm9keSArPSBgIC0gR2nDoSB0cuG7izogJHtuZXcgSW50bC5OdW1iZXJGb3JtYXQoJ3ZpLVZOJywgeyBzdHlsZTogJ2N1cnJlbmN5JywgY3VycmVuY3k6ICdWTkQnIH0pLmZvcm1hdChvcmRlci50b3RhbEFtb3VudCl9YDtcbiAgICB9XG4gICAgXG4gICAgLy8gVGjDqm0gY2hpIHRp4bq/dCB0cm9uZyBwYXlsb2FkXG4gICAgcmV0dXJuIGF3YWl0IHNlbmROb3RpZmljYXRpb25Ub1VzZXIodXNlcklkLCB7XG4gICAgICB0aXRsZTogdGl0bGUsXG4gICAgICBib2R5OiBib2R5LFxuICAgICAgZGF0YToge1xuICAgICAgICB1cmw6IGAvdGFpLWtob2FuL2Rvbi1oYW5nLyR7b3JkZXIuX2lkfWAsXG4gICAgICAgIG9yZGVySWQ6IG9yZGVyLl9pZCxcbiAgICAgICAgdHlwZTogJ29yZGVyX3VwZGF0ZScsXG4gICAgICAgIHN0YXR1czogb3JkZXIuc3RhdHVzLFxuICAgICAgICBvcmRlckl0ZW1zOiBvcmRlci5pdGVtcyAmJiBvcmRlci5pdGVtcy5sZW5ndGggPiAwID8gb3JkZXIuaXRlbXMubWFwKGl0ZW0gPT4gKHtcbiAgICAgICAgICBuYW1lOiBpdGVtLnByb2R1Y3ROYW1lLFxuICAgICAgICAgIHF1YW50aXR5OiBpdGVtLnF1YW50aXR5XG4gICAgICAgIH0pKSA6IFtdLFxuICAgICAgICBpY29uOiAnL29yZGVyLWljb24ucG5nJ1xuICAgICAgfVxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1tzZW5kT3JkZXJTdGF0dXNOb3RpZmljYXRpb25dIEzhu5dpOicsIGVycm9yKTtcbiAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgfVxufTtcblxuLy8gR+G7rWkgdGjDtG5nIGLDoW8ga2hpIGPDsyB0aW4gbmjhuq9uIG3hu5tpXG5leHBvcnQgY29uc3Qgc2VuZE1lc3NhZ2VOb3RpZmljYXRpb24gPSBhc3luYyAodXNlcklkLCBzZW5kZXJOYW1lLCBtZXNzYWdlVGV4dCkgPT4ge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKGBbc2VuZE1lc3NhZ2VOb3RpZmljYXRpb25dIEfhu61pIHRow7RuZyBiw6FvIHRpbiBuaOG6r24gdOG7qyAke3NlbmRlck5hbWV9IMSR4bq/biB1c2VyICR7dXNlcklkfWApO1xuICAgIGNvbnN0IHRpdGxlID0gYFRpbiBuaOG6r24gbeG7m2kgdOG7qyAke3NlbmRlck5hbWV9YDtcbiAgICBjb25zdCBib2R5ID0gbWVzc2FnZVRleHQubGVuZ3RoID4gMTAwIFxuICAgICAgPyBgJHttZXNzYWdlVGV4dC5zdWJzdHJpbmcoMCwgMTAwKX0uLi5gIFxuICAgICAgOiBtZXNzYWdlVGV4dDtcbiAgICBcbiAgICAvLyBUaMOqbSBjaGkgdGnhur90IHRyb25nIHBheWxvYWRcbiAgICByZXR1cm4gYXdhaXQgc2VuZE5vdGlmaWNhdGlvblRvVXNlcih1c2VySWQsIHtcbiAgICAgIHRpdGxlOiB0aXRsZSxcbiAgICAgIGJvZHk6IGJvZHksXG4gICAgICBkYXRhOiB7XG4gICAgICAgIHVybDogJy90YWkta2hvYW4vdGluLW5oYW4nLFxuICAgICAgICB0eXBlOiAnbmV3X21lc3NhZ2UnLFxuICAgICAgICBzZW5kZXJJZDogc2VuZGVyTmFtZSxcbiAgICAgICAgbWVzc2FnZUNvbnRlbnQ6IG1lc3NhZ2VUZXh0LFxuICAgICAgICBpY29uOiAnL2NoYXQtaWNvbi5wbmcnLFxuICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgYWN0aW9uOiAncmVwbHknLFxuICAgICAgICAgICAgdGl0bGU6ICdUcuG6oyBs4budaSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGFjdGlvbjogJ3ZpZXcnLFxuICAgICAgICAgICAgdGl0bGU6ICdYZW0gdOG6pXQgY+G6oydcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH1cbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdbc2VuZE1lc3NhZ2VOb3RpZmljYXRpb25dIEzhu5dpOicsIGVycm9yKTtcbiAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgfVxufTsiXSwibWFwcGluZ3MiOiI7QUFDQSxJQUFBQSxRQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxPQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxTQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7O0FBRUEsSUFBQUcsa0JBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQSxtQ0FBeUQsU0FBQUQsdUJBQUFLLENBQUEsVUFBQUEsQ0FBQSxJQUFBQSxDQUFBLENBQUFDLFVBQUEsR0FBQUQsQ0FBQSxLQUFBRSxPQUFBLEVBQUFGLENBQUEsS0FMekQsOEJBR3lDO0FBQ3pDO0FBQzBEO0FBRTFEO0FBQ0FHLGVBQU0sQ0FBQ0MsTUFBTSxDQUFDLENBQUM7QUFFZjtBQUNBLE1BQU1DLGNBQWMsR0FBR0MsT0FBTyxDQUFDQyxHQUFHLENBQUNDLGdCQUFnQjtBQUNuRCxNQUFNQyxlQUFlLEdBQUdILE9BQU8sQ0FBQ0MsR0FBRyxDQUFDRyxpQkFBaUI7O0FBRXJEQyxPQUFPLENBQUNDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQztBQUNuQ0QsT0FBTyxDQUFDQyxHQUFHLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDUCxjQUFjLENBQUM7QUFDckRNLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDLHVCQUF1QixFQUFFLENBQUMsQ0FBQ0gsZUFBZSxDQUFDOztBQUV2RDtBQUNBLElBQUk7RUFDSkksZ0JBQU8sQ0FBQ0MsZUFBZTtJQUNuQiw4QkFBOEIsRUFBRTtJQUNo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