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
  try {var _payload$data, _payload$data2, _payload$data3;
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
        icon: ((_payload$data = payload.data) === null || _payload$data === void 0 ? void 0 : _payload$data.icon) || '/logo192.png',
        badge: '/badge-icon.png',
        vibrate: [100, 50, 100],
        tag: ((_payload$data2 = payload.data) === null || _payload$data2 === void 0 ? void 0 : _payload$data2.type) || 'general',
        actions: ((_payload$data3 = payload.data) === null || _payload$data3 === void 0 ? void 0 : _payload$data3.actions) || [
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfd2ViUHVzaCIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwiX2RvdGVudiIsIl9SZWdpc3RlciIsIl9ub3RpZmljYXRpb25Nb2RlbCIsImUiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImRvdGVudiIsImNvbmZpZyIsInZhcGlkUHVibGljS2V5IiwicHJvY2VzcyIsImVudiIsIlZBUElEX1BVQkxJQ19LRVkiLCJ2YXBpZFByaXZhdGVLZXkiLCJWQVBJRF9QUklWQVRFX0tFWSIsImNvbnNvbGUiLCJsb2ciLCJ3ZWJwdXNoIiwic2V0VmFwaWREZXRhaWxzIiwiZXJyb3IiLCJzZW5kUHVzaE5vdGlmaWNhdGlvbiIsInVzZXJJZCIsInN1YnNjcmlwdGlvbiIsInBheWxvYWQiLCJfcGF5bG9hZCRkYXRhIiwiX3BheWxvYWQkZGF0YTIiLCJfcGF5bG9hZCRkYXRhMyIsImVuZHBvaW50Iiwic3VjY2VzcyIsIm1lc3NhZ2UiLCJub3RpZmljYXRpb24iLCJOb3RpZmljYXRpb24iLCJ0aXRsZSIsImJvZHkiLCJkYXRhIiwic3RhdHVzIiwic2F2ZSIsIndlYlB1c2hQYXlsb2FkIiwiaWNvbiIsImJhZGdlIiwidmlicmF0ZSIsInRhZyIsInR5cGUiLCJhY3Rpb25zIiwiYWN0aW9uIiwiZGF0ZU9mQXJyaXZhbCIsIkRhdGUiLCJub3ciLCJyZXF1aXJlSW50ZXJhY3Rpb24iLCJyZW5vdGlmeSIsInJlc3VsdCIsInNlbmROb3RpZmljYXRpb24iLCJKU09OIiwic3RyaW5naWZ5IiwiZmluZE9uZUFuZFVwZGF0ZSIsImRiRXJyb3IiLCJleHBvcnRzIiwic2VuZE5vdGlmaWNhdGlvblRvVXNlciIsInVzZXIiLCJVc2VyIiwiZmluZEJ5SWQiLCJwdXNoU3Vic2NyaXB0aW9ucyIsImxlbmd0aCIsIm5vdGlmRXJyb3IiLCJyZXN1bHRzIiwiUHJvbWlzZSIsImFsbCIsIm1hcCIsInN1YkVycm9yIiwic3VjY2Vzc0NvdW50IiwiZmlsdGVyIiwiciIsInNlbmROZXdQcm9kdWN0Tm90aWZpY2F0aW9uIiwicHJvZHVjdCIsInVzZXJzIiwiZmluZCIsIiRleGlzdHMiLCIkbm90IiwiJHNpemUiLCJwcm9kdWN0TmFtZSIsInByb2R1Y3RQcmljZSIsIm5vdGlmaWNhdGlvblByb21pc2VzIiwiX2lkIiwidXJsIiwicHJvZHVjdElkIiwiYWxsU2V0dGxlZCIsInNlbmROZXdDb3Vwb25Ob3RpZmljYXRpb24iLCJjb3Vwb24iLCJjb2RlIiwidmFsdWUiLCJjb3Vwb25Db2RlIiwic2VuZFJldmlld1JlcGx5Tm90aWZpY2F0aW9uIiwicmV2aWV3IiwicmVwbHlUZXh0Iiwic3Vic3RyaW5nIiwicmV2aWV3SWQiLCJyZXBseUNvbnRlbnQiLCJzZW5kT3JkZXJTdGF0dXNOb3RpZmljYXRpb24iLCJvcmRlciIsInN0YXR1c1RleHQiLCJvcmRlck51bWJlciIsInRvU3RyaW5nIiwidG90YWxBbW91bnQiLCJJbnRsIiwiTnVtYmVyRm9ybWF0Iiwic3R5bGUiLCJjdXJyZW5jeSIsImZvcm1hdCIsIm9yZGVySWQiLCJvcmRlckl0ZW1zIiwiaXRlbXMiLCJpdGVtIiwibmFtZSIsInF1YW50aXR5Iiwic2VuZE1lc3NhZ2VOb3RpZmljYXRpb24iLCJzZW5kZXJOYW1lIiwibWVzc2FnZVRleHQiLCJzZW5kZXJJZCIsIm1lc3NhZ2VDb250ZW50Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL1NlcnZpY2VzL25vdGlmaWNhdGlvblNlcnZpY2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cbmltcG9ydCB3ZWJwdXNoIGZyb20gJ3dlYi1wdXNoJztcbmltcG9ydCBkb3RlbnYgZnJvbSAnZG90ZW52JztcbmltcG9ydCBVc2VyIGZyb20gJy4uL01vZGVsL1JlZ2lzdGVyLmpzJzsgLy8gSW1wb3J0IFVzZXIgbW9kZWxcbi8vIGltcG9ydCBBZG1pbiBmcm9tICcuLi9Nb2RlbC9hZG1pbk1vZGVsLmpzJzsgLy8gSW1wb3J0IEFkbWluIG1vZGVsIC0gY29tbWVudGVkIG91dCBhcyBub3QgdXNlZCB5ZXRcbmltcG9ydCBOb3RpZmljYXRpb24gZnJvbSAnLi4vTW9kZWwvbm90aWZpY2F0aW9uTW9kZWwuanMnOyAvLyBJbXBvcnQgTm90aWZpY2F0aW9uIG1vZGVsXG5cbi8vIEPhuqV1IGjDrG5oIGRvdGVudlxuZG90ZW52LmNvbmZpZygpO1xuXG4vLyBM4bqleSBWQVBJRCBrZXlzIHThu6sgYmnhur9uIG3DtGkgdHLGsOG7nW5nXG5jb25zdCB2YXBpZFB1YmxpY0tleSA9IHByb2Nlc3MuZW52LlZBUElEX1BVQkxJQ19LRVk7XG5jb25zdCB2YXBpZFByaXZhdGVLZXkgPSBwcm9jZXNzLmVudi5WQVBJRF9QUklWQVRFX0tFWTtcblxuY29uc29sZS5sb2coJ0tp4buDbSB0cmEgVkFQSUQga2V5czonKTtcbmNvbnNvbGUubG9nKCctIFB1YmxpYyBrZXkgZXhpc3RzOicsICEhdmFwaWRQdWJsaWNLZXkpO1xuY29uc29sZS5sb2coJy0gUHJpdmF0ZSBrZXkgZXhpc3RzOicsICEhdmFwaWRQcml2YXRlS2V5KTtcblxuLy8gQ29uZmlndXJlIHdlYi1wdXNoIHdpdGggVkFQSUQga2V5c1xudHJ5IHtcbndlYnB1c2guc2V0VmFwaWREZXRhaWxzKFxuICAgICdtYWlsdG86a2l0MTAwMTIwMDNAZ21haWwuY29tJywgLy8gxJDhuqNtIGLhuqNvIGPDsyB0aeG7gW4gdOG7kSBtYWlsdG86XG4gICAgdmFwaWRQdWJsaWNLZXksXG4gICAgdmFwaWRQcml2YXRlS2V5XG4gICk7XG4gIGNvbnNvbGUubG9nKCfinIUgVkFQSUQgZGV0YWlscyBzZXQgc3VjY2Vzc2Z1bGx5Jyk7XG59IGNhdGNoIChlcnJvcikge1xuICBjb25zb2xlLmVycm9yKCfinYwgRXJyb3Igc2V0dGluZyBWQVBJRCBkZXRhaWxzOicsIGVycm9yKTtcbn1cblxuLy8gRnVuY3Rpb24gdG8gc2VuZCBhIHB1c2ggbm90aWZpY2F0aW9uIHRvIGEgc2luZ2xlIHN1YnNjcmlwdGlvblxuZXhwb3J0IGNvbnN0IHNlbmRQdXNoTm90aWZpY2F0aW9uID0gYXN5bmMgKHVzZXJJZCwgc3Vic2NyaXB0aW9uLCBwYXlsb2FkKSA9PiB7XG4gIHRyeSB7XG4gICAgaWYgKCFzdWJzY3JpcHRpb24gfHwgIXN1YnNjcmlwdGlvbi5lbmRwb2ludCkge1xuICAgICAgY29uc29sZS5sb2coYFN1YnNjcmlwdGlvbiBraMO0bmcgaOG7o3AgbOG7hyBjaG8gdXNlciAke3VzZXJJZH1gKTtcbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiAnU3Vic2NyaXB0aW9uIGtow7RuZyBo4bujcCBs4buHJyB9O1xuICAgIH1cblxuICAgIC8vIEzGsHUgdGjDtG5nIGLDoW8gdsOgbyBEQiB0csaw4bubYyBraGkgZ+G7rWlcbiAgICBjb25zdCBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKHtcbiAgICAgIHVzZXJJZCxcbiAgICAgIHRpdGxlOiBwYXlsb2FkLnRpdGxlLFxuICAgICAgYm9keTogcGF5bG9hZC5ib2R5LFxuICAgICAgZGF0YTogcGF5bG9hZC5kYXRhLFxuICAgICAgc3RhdHVzOiAncGVuZGluZycsXG4gICAgfSk7XG4gICAgYXdhaXQgbm90aWZpY2F0aW9uLnNhdmUoKTtcblxuICAgIC8vIFThuqFvIHBheWxvYWQgduG7m2kgxJHhu4tuaCBk4bqhbmcgY2hpIHRp4bq/dCBoxqFuIGNobyBXZWIgUHVzaFxuICAgIGNvbnN0IHdlYlB1c2hQYXlsb2FkID0ge1xuICAgICAgbm90aWZpY2F0aW9uOiB7XG4gICAgICAgIHRpdGxlOiBwYXlsb2FkLnRpdGxlLFxuICAgICAgICBib2R5OiBwYXlsb2FkLmJvZHksXG4gICAgICAgIGljb246IHBheWxvYWQuZGF0YT8uaWNvbiB8fCAnL2xvZ28xOTIucG5nJyxcbiAgICAgICAgYmFkZ2U6ICcvYmFkZ2UtaWNvbi5wbmcnLFxuICAgICAgICB2aWJyYXRlOiBbMTAwLCA1MCwgMTAwXSxcbiAgICAgICAgdGFnOiBwYXlsb2FkLmRhdGE/LnR5cGUgfHwgJ2dlbmVyYWwnLFxuICAgICAgICBhY3Rpb25zOiBwYXlsb2FkLmRhdGE/LmFjdGlvbnMgfHwgW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGFjdGlvbjogJ3ZpZXcnLFxuICAgICAgICAgICAgdGl0bGU6ICdYZW0gbmdheSdcbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAuLi5wYXlsb2FkLmRhdGEsXG4gICAgICAgICAgZGF0ZU9mQXJyaXZhbDogRGF0ZS5ub3coKSxcbiAgICAgICAgICByZXF1aXJlSW50ZXJhY3Rpb246IHRydWUsXG4gICAgICAgICAgcmVub3RpZnk6IHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBH4butaSB0aMO0bmcgYsOhbyB24bubaSBwYXlsb2FkIMSRw6MgdMSDbmcgY8aw4budbmdcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB3ZWJwdXNoLnNlbmROb3RpZmljYXRpb24oXG4gICAgICBzdWJzY3JpcHRpb24sIFxuICAgICAgSlNPTi5zdHJpbmdpZnkod2ViUHVzaFBheWxvYWQpXG4gICAgKTtcbiAgICBcbiAgICAvLyBD4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSBzYXUga2hpIGfhu61pXG4gICAgbm90aWZpY2F0aW9uLnN0YXR1cyA9ICdzZW50JztcbiAgICBhd2FpdCBub3RpZmljYXRpb24uc2F2ZSgpO1xuICAgIFxuICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdCB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYEzhu5dpIGtoaSBn4butaSBwdXNoIG5vdGlmaWNhdGlvbiBjaG8gdXNlciAke3VzZXJJZH06YCwgZXJyb3IubWVzc2FnZSk7XG4gICAgXG4gICAgLy8gQ+G6rXAgbmjhuq10IHRow7RuZyBiw6FvIGzDoCB0aOG6pXQgYuG6oWkgbmjGsG5nIGtow7RuZyBk4burbmcgbHXhu5NuZyB44butIGzDvVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBOb3RpZmljYXRpb24uZmluZE9uZUFuZFVwZGF0ZShcbiAgICAgICAgeyB1c2VySWQsIHRpdGxlOiBwYXlsb2FkLnRpdGxlLCBib2R5OiBwYXlsb2FkLmJvZHksIHN0YXR1czogJ3BlbmRpbmcnIH0sXG4gICAgICAgIHsgc3RhdHVzOiAnZmFpbGVkJywgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfVxuICAgICAgKTtcbiAgICB9IGNhdGNoIChkYkVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdM4buXaSBraGkgY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgdGjDtG5nIGLDoW86JywgZGJFcnJvcik7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICB9XG59O1xuXG4vLyBH4butaSB0aMO0bmcgYsOhbyBjaG8gbeG7mXQgbmfGsOG7nWkgZMO5bmcgY+G7pSB0aOG7gyAodOG6pXQgY+G6oyBjw6FjIHRoaeG6v3QgYuG7iyDEkcOjIMSRxINuZyBrw70pXG5leHBvcnQgY29uc3Qgc2VuZE5vdGlmaWNhdGlvblRvVXNlciA9IGFzeW5jICh1c2VySWQsIHBheWxvYWQpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZyhgW3NlbmROb3RpZmljYXRpb25Ub1VzZXJdIELhuq90IMSR4bqndSBn4butaSB0aMO0bmcgYsOhbyBjaG8gdXNlcjogJHt1c2VySWR9YCk7XG4gICAgY29uc29sZS5sb2coYFtzZW5kTm90aWZpY2F0aW9uVG9Vc2VyXSBUaGFtIHPhu5E6YCwgcGF5bG9hZCk7XG5cbiAgICBjb25zdCB1c2VyID0gYXdhaXQgVXNlci5maW5kQnlJZCh1c2VySWQpO1xuICAgIGlmICghdXNlcikge1xuICAgICAgY29uc29sZS5sb2coYFtzZW5kTm90aWZpY2F0aW9uVG9Vc2VyXSBLaMO0bmcgdMOsbSB0aOG6pXkgdXNlciB24bubaSBJRDogJHt1c2VySWR9YCk7XG4gICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogJ1VzZXIga2jDtG5nIHThu5NuIHThuqFpJyB9O1xuICAgIH1cblxuICAgIGlmICghdXNlci5wdXNoU3Vic2NyaXB0aW9ucyB8fCB1c2VyLnB1c2hTdWJzY3JpcHRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc29sZS5sb2coYFtzZW5kTm90aWZpY2F0aW9uVG9Vc2VyXSBVc2VyICR7dXNlcklkfSBraMO0bmcgY8OzIMSRxINuZyBrw70gcHVzaCBzdWJzY3JpcHRpb25zIG7DoG9gKTtcbiAgICAgIFxuICAgICAgLy8gVuG6q24gbMawdSB0aMO0bmcgYsOhbyB2w6BvIERCIMSR4buDIGhp4buDbiB0aOG7iyB0cm9uZyDhu6luZyBk4bulbmdcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oe1xuICAgICAgICAgIHVzZXJJZCxcbiAgICAgICAgICB0aXRsZTogcGF5bG9hZC50aXRsZSxcbiAgICAgICAgICBib2R5OiBwYXlsb2FkLmJvZHksXG4gICAgICAgICAgZGF0YTogcGF5bG9hZC5kYXRhLFxuICAgICAgICAgIHN0YXR1czogJ3BlbmRpbmdfdmlldycsIC8vIFRy4bqhbmcgdGjDoWkgY2jhu50geGVtIHRyb25nIOG7qW5nIGThu6VuZ1xuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgbm90aWZpY2F0aW9uLnNhdmUoKTtcbiAgICAgIH0gY2F0Y2ggKG5vdGlmRXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignTOG7l2kga2hpIGzGsHUgdGjDtG5nIGLDoW86Jywgbm90aWZFcnJvcik7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICfEkMOjIGzGsHUgdGjDtG5nIGLDoW8gxJHhu4MgaGnhu4NuIHRo4buLIHRyb25nIOG7qW5nIGThu6VuZycgfTtcbiAgICB9XG5cbiAgICAvLyBH4butaSDEkeG6v24gdOG6pXQgY+G6oyBzdWJzY3JpcHRpb25zIGPhu6dhIHVzZXJcbiAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICB1c2VyLnB1c2hTdWJzY3JpcHRpb25zLm1hcChhc3luYyAoc3Vic2NyaXB0aW9uKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IHNlbmRQdXNoTm90aWZpY2F0aW9uKHVzZXJJZCwgc3Vic2NyaXB0aW9uLCBwYXlsb2FkKTtcbiAgICAgICAgfSBjYXRjaCAoc3ViRXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBM4buXaSBraGkgZ+G7rWkgxJHhur9uIHN1YnNjcmlwdGlvbiBj4bulIHRo4buDOmAsIHN1YkVycm9yKTtcbiAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHN1YkVycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICApO1xuXG4gICAgY29uc3Qgc3VjY2Vzc0NvdW50ID0gcmVzdWx0cy5maWx0ZXIociA9PiByLnN1Y2Nlc3MpLmxlbmd0aDtcbiAgICByZXR1cm4geyBcbiAgICAgIHN1Y2Nlc3M6IHN1Y2Nlc3NDb3VudCA+IDAsXG4gICAgICBtZXNzYWdlOiBgxJDDoyBn4butaSB0aMOgbmggY8O0bmcgxJHhur9uICR7c3VjY2Vzc0NvdW50fS8ke3VzZXIucHVzaFN1YnNjcmlwdGlvbnMubGVuZ3RofSB0aGnhur90IGLhu4tgXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbc2VuZE5vdGlmaWNhdGlvblRvVXNlcl0gTOG7l2kgdOG7lW5nIHRo4buDOmAsIGVycm9yKTtcbiAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgfVxufTtcblxuLy8gR+G7rWkgdGjDtG5nIGLDoW8ga2hpIGPDsyBz4bqjbiBwaOG6qW0gbeG7m2lcbmV4cG9ydCBjb25zdCBzZW5kTmV3UHJvZHVjdE5vdGlmaWNhdGlvbiA9IGFzeW5jIChwcm9kdWN0KSA9PiB7XG4gIHRyeSB7XG4gICAgLy8gVMOsbSB04bqldCBj4bqjIHVzZXIgY8OzIMSRxINuZyBrw70gbmjhuq1uIHRow7RuZyBiw6FvXG4gICAgY29uc3QgdXNlcnMgPSBhd2FpdCBVc2VyLmZpbmQoeyBcbiAgICAgIHB1c2hTdWJzY3JpcHRpb25zOiB7ICRleGlzdHM6IHRydWUsICRub3Q6IHsgJHNpemU6IDAgfSB9XG4gICAgfSk7XG5cbiAgICBpZiAoIXVzZXJzIHx8IHVzZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc29sZS5sb2coJ05vIHVzZXJzIHdpdGggcHVzaCBzdWJzY3JpcHRpb25zIGZvdW5kJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGl0bGUgPSAnU+G6o24gcGjhuqltIG3hu5tpISc7XG4gICAgY29uc3QgYm9keSA9IGAke3Byb2R1Y3QucHJvZHVjdE5hbWV9IMSRw6MgxJHGsOG7o2MgdGjDqm0gdsOgbyBj4butYSBow6BuZy4gR2nDoTogJHtwcm9kdWN0LnByb2R1Y3RQcmljZX3EkWA7XG4gICAgXG4gICAgY29uc3Qgbm90aWZpY2F0aW9uUHJvbWlzZXMgPSB1c2Vycy5tYXAodXNlciA9PiBcbiAgICAgIHNlbmROb3RpZmljYXRpb25Ub1VzZXIodXNlci5faWQsIHtcbiAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICBib2R5OiBib2R5LFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgdXJsOiBgL3Nhbi1waGFtLyR7cHJvZHVjdC5faWR9YCxcbiAgICAgICAgICBwcm9kdWN0SWQ6IHByb2R1Y3QuX2lkLFxuICAgICAgICAgIHR5cGU6ICduZXdfcHJvZHVjdCdcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICApO1xuXG4gICAgYXdhaXQgUHJvbWlzZS5hbGxTZXR0bGVkKG5vdGlmaWNhdGlvblByb21pc2VzKTtcbiAgICBjb25zb2xlLmxvZyhgU2VudCBuZXcgcHJvZHVjdCBub3RpZmljYXRpb25zIHRvICR7dXNlcnMubGVuZ3RofSB1c2Vyc2ApO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNlbmRpbmcgbmV3IHByb2R1Y3Qgbm90aWZpY2F0aW9uczonLCBlcnJvcik7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG4vLyBH4butaSB0aMO0bmcgYsOhbyBraGkgY8OzIGNvdXBvbiBt4bubaVxuZXhwb3J0IGNvbnN0IHNlbmROZXdDb3Vwb25Ob3RpZmljYXRpb24gPSBhc3luYyAoY291cG9uKSA9PiB7XG4gIHRyeSB7XG4gICAgLy8gVMOsbSB04bqldCBj4bqjIHVzZXIgY8OzIMSRxINuZyBrw70gbmjhuq1uIHRow7RuZyBiw6FvXG4gICAgY29uc3QgdXNlcnMgPSBhd2FpdCBVc2VyLmZpbmQoeyBcbiAgICAgIHB1c2hTdWJzY3JpcHRpb25zOiB7ICRleGlzdHM6IHRydWUsICRub3Q6IHsgJHNpemU6IDAgfSB9XG4gICAgfSk7XG5cbiAgICBpZiAoIXVzZXJzIHx8IHVzZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc29sZS5sb2coJ05vIHVzZXJzIHdpdGggcHVzaCBzdWJzY3JpcHRpb25zIGZvdW5kJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGl0bGUgPSAnTcOjIGdp4bqjbSBnacOhIG3hu5tpISc7XG4gICAgY29uc3QgYm9keSA9IGBT4butIGThu6VuZyBtw6MgJHtjb3Vwb24uY29kZX0gxJHhu4MgxJHGsOG7o2MgZ2nhuqNtICR7Y291cG9uLnR5cGUgPT09ICdwZXJjZW50YWdlJyA/IGAke2NvdXBvbi52YWx1ZX0lYCA6IGAke2NvdXBvbi52YWx1ZX3EkWB9YDtcbiAgICBcbiAgICBjb25zdCBub3RpZmljYXRpb25Qcm9taXNlcyA9IHVzZXJzLm1hcCh1c2VyID0+IFxuICAgICAgc2VuZE5vdGlmaWNhdGlvblRvVXNlcih1c2VyLl9pZCwge1xuICAgICAgICB0aXRsZTogdGl0bGUsXG4gICAgICAgIGJvZHk6IGJvZHksXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICB1cmw6IGAvdm91Y2hlcmAsXG4gICAgICAgICAgY291cG9uQ29kZTogY291cG9uLmNvZGUsXG4gICAgICAgICAgdHlwZTogJ25ld19jb3Vwb24nXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcblxuICAgIGF3YWl0IFByb21pc2UuYWxsU2V0dGxlZChub3RpZmljYXRpb25Qcm9taXNlcyk7XG4gICAgY29uc29sZS5sb2coYFNlbnQgbmV3IGNvdXBvbiBub3RpZmljYXRpb25zIHRvICR7dXNlcnMubGVuZ3RofSB1c2Vyc2ApO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNlbmRpbmcgbmV3IGNvdXBvbiBub3RpZmljYXRpb25zOicsIGVycm9yKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cbi8vIEfhu61pIHRow7RuZyBiw6FvIGtoaSBjw7MgcGjhuqNuIGjhu5NpIMSRw6FuaCBnacOhXG5leHBvcnQgY29uc3Qgc2VuZFJldmlld1JlcGx5Tm90aWZpY2F0aW9uID0gYXN5bmMgKHVzZXJJZCwgcmV2aWV3LCByZXBseVRleHQpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZyhgW3NlbmRSZXZpZXdSZXBseU5vdGlmaWNhdGlvbl0gR+G7rWkgdGjDtG5nIGLDoW8gcGjhuqNuIGjhu5NpIMSRw6FuaCBnacOhIGNobyB1c2VyICR7dXNlcklkfWApO1xuICAgIGNvbnN0IHRpdGxlID0gYFBo4bqjbiBo4buTaSDEkcOhbmggZ2nDoSBz4bqjbiBwaOG6qW1gO1xuICAgIGNvbnN0IGJvZHkgPSBgQWRtaW46IFwiJHtyZXBseVRleHQuc3Vic3RyaW5nKDAsIDEyMCl9JHtyZXBseVRleHQubGVuZ3RoID4gMTIwID8gJy4uLicgOiAnJ31cImA7XG4gICAgXG4gICAgLy8gVGjDqm0gY2hpIHRp4bq/dCB0cm9uZyBwYXlsb2FkXG4gICAgcmV0dXJuIGF3YWl0IHNlbmROb3RpZmljYXRpb25Ub1VzZXIodXNlcklkLCB7XG4gICAgICB0aXRsZTogdGl0bGUsXG4gICAgICBib2R5OiBib2R5LFxuICAgICAgZGF0YToge1xuICAgICAgICB1cmw6IGAvcHJvZHVjdC8ke3Jldmlldy5wcm9kdWN0SWR9YCxcbiAgICAgICAgcmV2aWV3SWQ6IHJldmlldy5faWQsXG4gICAgICAgIHR5cGU6ICdyZXZpZXdfcmVwbHknLFxuICAgICAgICBwcm9kdWN0TmFtZTogcmV2aWV3LnByb2R1Y3ROYW1lLFxuICAgICAgICByZXBseUNvbnRlbnQ6IHJlcGx5VGV4dCxcbiAgICAgICAgaWNvbjogJy9yZXZpZXctaWNvbi5wbmcnXG4gICAgICB9XG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignW3NlbmRSZXZpZXdSZXBseU5vdGlmaWNhdGlvbl0gTOG7l2k6JywgZXJyb3IpO1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICB9XG59O1xuXG4vLyBH4butaSB0aMO0bmcgYsOhbyBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZ1xuZXhwb3J0IGNvbnN0IHNlbmRPcmRlclN0YXR1c05vdGlmaWNhdGlvbiA9IGFzeW5jICh1c2VySWQsIG9yZGVyLCBzdGF0dXNUZXh0KSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2coYFtzZW5kT3JkZXJTdGF0dXNOb3RpZmljYXRpb25dIEfhu61pIHRow7RuZyBiw6FvIMSRxqFuIGjDoG5nICR7b3JkZXIuX2lkfSBjaG8gdXNlciAke3VzZXJJZH1gKTtcbiAgICBjb25zdCB0aXRsZSA9IGBD4bqtcCBuaOG6rXQgxJHGoW4gaMOgbmcgIyR7b3JkZXIub3JkZXJOdW1iZXIgfHwgb3JkZXIuX2lkLnRvU3RyaW5nKCkuc3Vic3RyaW5nKDAsIDgpfWA7XG4gICAgbGV0IGJvZHkgPSBgxJDGoW4gaMOgbmcgY+G7p2EgYuG6oW4gJHtzdGF0dXNUZXh0fWA7XG4gICAgXG4gICAgaWYgKG9yZGVyLnRvdGFsQW1vdW50KSB7XG4gICAgICBib2R5ICs9IGAgLSBHacOhIHRy4buLOiAke25ldyBJbnRsLk51bWJlckZvcm1hdCgndmktVk4nLCB7IHN0eWxlOiAnY3VycmVuY3knLCBjdXJyZW5jeTogJ1ZORCcgfSkuZm9ybWF0KG9yZGVyLnRvdGFsQW1vdW50KX1gO1xuICAgIH1cbiAgICBcbiAgICAvLyBUaMOqbSBjaGkgdGnhur90IHRyb25nIHBheWxvYWRcbiAgICByZXR1cm4gYXdhaXQgc2VuZE5vdGlmaWNhdGlvblRvVXNlcih1c2VySWQsIHtcbiAgICAgIHRpdGxlOiB0aXRsZSxcbiAgICAgIGJvZHk6IGJvZHksXG4gICAgICBkYXRhOiB7XG4gICAgICAgIHVybDogYC90YWkta2hvYW4vZG9uLWhhbmcvJHtvcmRlci5faWR9YCxcbiAgICAgICAgb3JkZXJJZDogb3JkZXIuX2lkLFxuICAgICAgICB0eXBlOiAnb3JkZXJfdXBkYXRlJyxcbiAgICAgICAgc3RhdHVzOiBvcmRlci5zdGF0dXMsXG4gICAgICAgIG9yZGVySXRlbXM6IG9yZGVyLml0ZW1zICYmIG9yZGVyLml0ZW1zLmxlbmd0aCA+IDAgPyBvcmRlci5pdGVtcy5tYXAoaXRlbSA9PiAoe1xuICAgICAgICAgIG5hbWU6IGl0ZW0ucHJvZHVjdE5hbWUsXG4gICAgICAgICAgcXVhbnRpdHk6IGl0ZW0ucXVhbnRpdHlcbiAgICAgICAgfSkpIDogW10sXG4gICAgICAgIGljb246ICcvb3JkZXItaWNvbi5wbmcnXG4gICAgICB9XG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignW3NlbmRPcmRlclN0YXR1c05vdGlmaWNhdGlvbl0gTOG7l2k6JywgZXJyb3IpO1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICB9XG59O1xuXG4vLyBH4butaSB0aMO0bmcgYsOhbyBraGkgY8OzIHRpbiBuaOG6r24gbeG7m2lcbmV4cG9ydCBjb25zdCBzZW5kTWVzc2FnZU5vdGlmaWNhdGlvbiA9IGFzeW5jICh1c2VySWQsIHNlbmRlck5hbWUsIG1lc3NhZ2VUZXh0KSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2coYFtzZW5kTWVzc2FnZU5vdGlmaWNhdGlvbl0gR+G7rWkgdGjDtG5nIGLDoW8gdGluIG5o4bqvbiB04burICR7c2VuZGVyTmFtZX0gxJHhur9uIHVzZXIgJHt1c2VySWR9YCk7XG4gICAgY29uc3QgdGl0bGUgPSBgVGluIG5o4bqvbiBt4bubaSB04burICR7c2VuZGVyTmFtZX1gO1xuICAgIGNvbnN0IGJvZHkgPSBtZXNzYWdlVGV4dC5sZW5ndGggPiAxMDAgXG4gICAgICA/IGAke21lc3NhZ2VUZXh0LnN1YnN0cmluZygwLCAxMDApfS4uLmAgXG4gICAgICA6IG1lc3NhZ2VUZXh0O1xuICAgIFxuICAgIC8vIFRow6ptIGNoaSB0aeG6v3QgdHJvbmcgcGF5bG9hZFxuICAgIHJldHVybiBhd2FpdCBzZW5kTm90aWZpY2F0aW9uVG9Vc2VyKHVzZXJJZCwge1xuICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgYm9keTogYm9keSxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgdXJsOiAnL3RhaS1raG9hbi90aW4tbmhhbicsXG4gICAgICAgIHR5cGU6ICduZXdfbWVzc2FnZScsXG4gICAgICAgIHNlbmRlcklkOiBzZW5kZXJOYW1lLFxuICAgICAgICBtZXNzYWdlQ29udGVudDogbWVzc2FnZVRleHQsXG4gICAgICAgIGljb246ICcvY2hhdC1pY29uLnBuZycsXG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBhY3Rpb246ICdyZXBseScsXG4gICAgICAgICAgICB0aXRsZTogJ1Ry4bqjIGzhu51pJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgYWN0aW9uOiAndmlldycsXG4gICAgICAgICAgICB0aXRsZTogJ1hlbSB04bqldCBj4bqjJ1xuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfVxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1tzZW5kTWVzc2FnZU5vdGlmaWNhdGlvbl0gTOG7l2k6JywgZXJyb3IpO1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICB9XG59OyJdLCJtYXBwaW5ncyI6IjtBQUNBLElBQUFBLFFBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLE9BQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLFNBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQSxJQUFBRyxrQkFBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBLG1DQUF5RCxTQUFBRCx1QkFBQUssQ0FBQSxVQUFBQSxDQUFBLElBQUFBLENBQUEsQ0FBQUMsVUFBQSxHQUFBRCxDQUFBLEtBQUFFLE9BQUEsRUFBQUYsQ0FBQSxLQUx6RCw4QkFHeUM7QUFDekM7QUFDMEQ7QUFFMUQ7QUFDQUcsZUFBTSxDQUFDQyxNQUFNLENBQUMsQ0FBQztBQUVmO0FBQ0EsTUFBTUMsY0FBYyxHQUFHQyxPQUFPLENBQUNDLEdBQUcsQ0FBQ0MsZ0JBQWdCO0FBQ25ELE1BQU1DLGVBQWUsR0FBR0gsT0FBTyxDQUFDQyxHQUFHLENBQUNHLGlCQUFpQjs7QUFFckRDLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDLHNCQUFzQixDQUFDO0FBQ25DRCxPQUFPLENBQUNDLEdBQUcsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLENBQUNQLGNBQWMsQ0FBQztBQUNyRE0sT0FBTyxDQUFDQyxHQUFHLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxDQUFDSCxlQUFlLENBQUM7O0FBRXZEO0FBQ0EsSUFBSTtFQUNKSSxnQkFBTyxDQUFDQyxlQUFlO0lBQ25CLDhCQUE4QixFQUFFO0lBQ2hDVCxjQUFjO0lBQ2RJO0VBQ0YsQ0FBQztFQUNERSxPQUFPLENBQUNDLEdBQUcsQ0FBQyxrQ0FB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