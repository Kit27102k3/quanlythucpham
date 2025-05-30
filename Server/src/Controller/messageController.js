import Conversation from "../Model/Message.js";
import User from "../Model/Register.js";
import Admin from "../Model/adminModel.js";
import { getAdminId } from "../config/admin.js";
import dotenv from "dotenv";
import { sendMessageNotification } from "../Services/notificationService.js";

dotenv.config();

const ADMIN_SECRET_TOKEN = "admin-token-for-TKhiem";

export const getAllContacts = async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({ lastUpdated: -1 });
    const userIds = conversations.map((conv) => conv.userId);
    const users = await User.find({ _id: { $in: userIds } });
    const adminIds = conversations
      .map((conv) => conv.adminId)
      .filter((id) => id !== null);
    const admins = await Admin.find({ _id: { $in: adminIds } });

    const contacts = conversations.map((conv) => {
      const user = users.find(
        (u) => u._id.toString() === conv.userId.toString()
      );
      const admin = admins.find(
        (a) => a && conv.adminId && a._id.toString() === conv.adminId.toString()
      );
      const lastMessage =
        conv.messages.length > 0
          ? conv.messages[conv.messages.length - 1]
          : null;

      return {
        id: user && user._id ? user._id.toString() : conv.userId.toString(),
        name:
          user && user.firstName
            ? `${user.firstName} ${user.lastName}`
            : "Người dùng",
        avatar: user?.userImage || null,
        online: false,
        lastSeen: lastMessage ? formatTimeAgo(lastMessage.timestamp) : null,
        lastMessage: lastMessage?.text || "",
        unread: conv.messages.filter(
          (msg) => msg.sender === "user" && !msg.read
        ).length,
        adminName: admin?.fullName || "Admin",
        adminId: conv.adminId?.toString(),
      };
    });

    return res.status(200).json(contacts);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const isAdmin =
      req.headers["admin-token"] === ADMIN_SECRET_TOKEN ||
      (req.user && (req.user.role === "admin" || req.user.role === "manager"));

    let actualUserId = userId;
    if (userId === "admin") {
      actualUserId = await getAdminId();
    }

    let conversation;
    if (isAdmin) {
      conversation = await Conversation.findOne({ userId: actualUserId });
    } else {
      const currentUserId = req.user ? req.user.id : actualUserId;
      conversation = await Conversation.findOne({ userId: currentUserId });
    }

    if (!conversation) {
      return res.status(200).json([]);
    }

    const formattedMessages = conversation.messages.map((msg) => ({
      id: msg._id.toString(),
      text: msg.text,
      sender: msg.sender,
      read: msg.read,
      createdAt: msg.timestamp,
    }));

    return res.status(200).json(formattedMessages);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, sender, receiverId, userId: requestUserId } = req.body;

    if (!text || !sender) {
      return res.status(400).json({ message: "Thiếu thông tin tin nhắn" });
    }

    const isAdmin =
      req.headers["admin-token"] === ADMIN_SECRET_TOKEN ||
      (req.user && (req.user.role === "admin" || req.user.role === "manager"));

    if (sender === "admin" && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Không có quyền gửi tin nhắn với tư cách admin" });
    }

    let userId =
      sender === "admin" ? receiverId : requestUserId || req.user?.id;
    if (!userId) {
      return res
        .status(400)
        .json({ message: "Không xác định được người nhận tin nhắn" });
    }

    const adminId = await getAdminId();
    let conversation = await Conversation.findOne({ userId });

    if (!conversation) {
      conversation = new Conversation({
        userId,
        adminId,
        messages: [],
        unreadCount: 0,
      });
    }

    const newMessage = {
      text,
      sender,
      read: false,
      timestamp: new Date(),
    };

    conversation.messages.push(newMessage);

    if (sender === "user") {
      conversation.unreadCount = (conversation.unreadCount || 0) + 1;
    }

    await conversation.save();

    const addedMessage =
      conversation.messages[conversation.messages.length - 1];

    const formattedMessage = {
      id: addedMessage._id.toString(),
      text: addedMessage.text,
      sender: addedMessage.sender,
      read: addedMessage.read,
      createdAt: addedMessage.timestamp,
    };

    if (sender === "admin") {
      try {
        const user = await User.findById(userId);
        if (user) {
          sendMessageNotification(userId, "Admin", text).catch(() => {});
        }
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    }

    return res.status(201).json(formattedMessage);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const conversation = await Conversation.findOne({ userId });

    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc hội thoại" });
    }

    let updated = false;
    conversation.messages = conversation.messages.map((msg) => {
      if (msg.sender === "admin" && !msg.read) {
        updated = true;
        return { ...msg.toObject(), read: true };
      }
      return msg;
    });

    if (updated) {
      conversation.unreadCount = 0;
      await conversation.save();
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const isAdmin = req.headers["admin-token"] === ADMIN_SECRET_TOKEN;
    if (!isAdmin) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const conversations = await Conversation.find();
    const totalUnread = conversations.reduce(
      (sum, conv) => sum + (conv.unreadCount || 0),
      0
    );

    return res.status(200).json({ count: totalUnread });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

function formatTimeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;

  return new Date(date).toLocaleDateString("vi-VN");
}
