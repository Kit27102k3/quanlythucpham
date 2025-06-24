/* eslint-disable no-undef */
/* eslint-disable no-useless-escape */
import webpush from "web-push";
import dotenv from "dotenv";
import User from "../Model/Register.js";
import Notification from "../Model/notificationModel.js";

dotenv.config();

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  "mailto:kit10012003@gmail.com",
  vapidPublicKey,
  vapidPrivateKey
);

export const sendPushNotification = async (userId, subscription, payload) => {
  try {
    if (!subscription || !subscription.endpoint)
      return { success: false, message: "Invalid subscription" };

    const notification = new Notification({
      userId,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      status: "pending",
    });
    await notification.save();

    const webPushPayload = {
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.data && payload.data.icon || "/logo192.png",
        badge: "/badge-icon.png",
        vibrate: [100, 50, 100],
        tag: payload.data && payload.data.type || "general",
        actions: payload.data && payload.data.actions || [
          { action: "view", title: "Xem ngay" },
        ],
        data: {
          ...payload.data,
          dateOfArrival: Date.now(),
          requireInteraction: true,
          renotify: true,
        },
      },
    };

    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(webPushPayload)
    );

    notification.status = "sent";
    await notification.save();

    return { success: true, result };
  } catch (error) {
    await Notification.findOneAndUpdate(
      { userId, title: payload.title, body: payload.body, status: "pending" },
      { status: "failed", error: error.message }
    );
    return { success: false, error: error.message };
  }
};

export const sendNotificationToUser = async (userId, payload) => {
  try {
    const user = await User.findById(userId);
    if (!user) return { success: false, message: "User not found" };

    if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      const notification = new Notification({
        userId,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        status: "pending_view",
      });
      await notification.save();
      return {
        success: true,
        message: "Notification saved for in-app display",
      };
    }

    const results = await Promise.all(
      user.pushSubscriptions.map((subscription) =>
        sendPushNotification(userId, subscription, payload)
      )
    );

    const successCount = results.filter((r) => r.success).length;
    return {
      success: successCount > 0,
      message: `Sent to ${successCount}/${user.pushSubscriptions.length} devices`,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const sendNewProductNotification = async (product) => {
  try {
    const users = await User.find({
      pushSubscriptions: { $exists: true, $not: { $size: 0 } },
    });
    if (!users.length) return;

    const payload = {
      title: "Sản phẩm mới!",
      body: `${product.productName} đã được thêm. Giá: ${product.productPrice}đ`,
      data: {
        url: `/san-pham/${product._id}`,
        productId: product._id,
        type: "new_product",
      },
    };

    await Promise.allSettled(
      users.map((user) => sendNotificationToUser(user._id, payload))
    );
    return true;
  } catch (error) {
    console.error("Lỗi khi gửi thông báo sản phẩm mới:", error);
    return false;
  }
};

export const sendNewCouponNotification = async (coupon) => {
  try {
    const users = await User.find({
      pushSubscriptions: { $exists: true, $not: { $size: 0 } },
    });
    if (!users.length) return;

    const payload = {
      title: "Mã giảm giá mới!",
      body: `Sử dụng mã ${coupon.code} để được giảm ${
        coupon.type === "percentage" ? `${coupon.value}%` : `${coupon.value}đ`
      }`,
      data: {
        url: "/voucher",
        couponCode: coupon.code,
        type: "new_coupon",
      },
    };

    await Promise.allSettled(
      users.map((user) => sendNotificationToUser(user._id, payload))
    );
    return true;
  } catch (error) {
    console.error("Lỗi khi gửi thông báo mã giảm giá:", error);
    return false;
  }
};

export const sendReviewReplyNotification = async (
  userId,
  review,
  replyText
) => {
  try {
    return await sendNotificationToUser(userId, {
      title: "Phản hồi đánh giá sản phẩm",
      body: `Admin: \"${replyText.slice(0, 120)}${
        replyText.length > 120 ? "..." : ""
      }\"`,
      data: {
        url: `/product/${review.productId}`,
        reviewId: review._id,
        type: "review_reply",
        productName: review.productName,
        replyContent: replyText,
        icon: "/review-icon.png",
      },
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const sendOrderStatusNotification = async (
  userId,
  order,
  statusText
) => {
  try {
    const statusMap = {
      pending: "đang chờ xử lý",
      confirmed: "đã được xác nhận",
      processing: "đang được xử lý",
      preparing: "đang chuẩn bị hàng",
      packaging: "đang đóng gói",
      shipping: "đang vận chuyển",
      shipped: "đã giao cho đơn vị vận chuyển",
      delivering: "đang giao hàng",
      delivered: "đã giao hàng thành công",
      completed: "đã hoàn thành",
      cancelled: "đã bị hủy",
      awaiting_payment: "đang chờ thanh toán",
      refunded: "đã hoàn tiền",
      failed: "giao hàng thất bại",
      delivery_failed: "giao hàng thất bại",
      sorting_facility: "đã đến trung tâm phân loại",
      // Thêm các trạng thái khác nếu cần
    };

    // Dịch trạng thái sang tiếng Việt, nếu không có thì giữ nguyên
    const translatedStatus = statusMap[statusText.toLowerCase()] || statusText;

    const title = `Cập nhật đơn hàng #${
      order.orderNumber || order._id.toString().slice(0, 8)
    }`;
    let body = `Đơn hàng của bạn ${translatedStatus}`;

    if (order.totalAmount) {
      body += ` - Giá trị: ${new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(order.totalAmount)}`;
    }

    return await sendNotificationToUser(userId, {
      title,
      body,
      data: {
        url: `/tai-khoan/don-hang/${order._id}`,
        orderId: order._id,
        type: "order_update",
        status: order.status,
        orderItems:
          (order.items && order.items.map((item) => ({
            name: item.productName,
            quantity: item.quantity,
          }))) || [],
        icon: "/android-chrome-192x192.png", // Đảm bảo logo chuẩn
      },
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const sendMessageNotification = async (
  userId,
  senderName,
  messageText
) => {
  try {
    return await sendNotificationToUser(userId, {
      title: `Tin nhắn mới từ ${senderName}`,
      body:
        messageText.length > 100
          ? `${messageText.slice(0, 100)}...`
          : messageText,
      data: {
        url: "/tai-khoan/tin-nhan",
        type: "new_message",
        senderId: senderName,
        messageContent: messageText,
        icon: "/chat-icon.png",
        actions: [
          { action: "reply", title: "Trả lời" },
          { action: "view", title: "Xem tất cả" },
        ],
      },
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};
