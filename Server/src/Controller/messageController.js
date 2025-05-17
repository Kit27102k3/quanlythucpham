import Conversation from "../Model/Message.js";
import User from "../Model/Register.js";
import Admin from "../Model/Admin.js";
import { getAdminId } from "../config/admin.js";
import dotenv from 'dotenv';

// Cấu hình dotenv
dotenv.config();

// Mã token admin cố định
const ADMIN_SECRET_TOKEN = "admin-token-for-TKhiem";

// Hàm lấy tất cả người dùng đã nhắn tin với admin
export const getAllContacts = async (req, res) => {
  try {
    // Lấy danh sách các cuộc hội thoại
    const conversations = await Conversation.find().sort({ lastUpdated: -1 });
    
    // Lấy thông tin chi tiết về người dùng
    const userIds = conversations.map(conv => conv.userId);
    const users = await User.find({ _id: { $in: userIds } });
    
    // Lấy thông tin admin nếu có adminId
    const adminIds = conversations
      .map(conv => conv.adminId)
      .filter(id => id !== null);
    const admins = await Admin.find({ _id: { $in: adminIds } });
    
    // Map thông tin người dùng vào kết quả
    const contacts = conversations.map(conv => {
      const user = users.find(u => u._id.toString() === conv.userId.toString());
      const admin = admins.find(a => a && conv.adminId && a._id.toString() === conv.adminId.toString());
      const lastMessage = conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;
      
      return {
        id: user?._id.toString() || conv.userId.toString(),
        name: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Người dùng',
        avatar: user?.userImage || null,
        online: false, // Có thể triển khai sau với Socket.io
        lastSeen: lastMessage ? formatTimeAgo(lastMessage.timestamp) : null,
        lastMessage: lastMessage ? lastMessage.text : '',
        unread: conv.messages.filter(msg => msg.sender === 'user' && !msg.read).length,
        adminName: admin?.fullName || 'Admin',
        adminId: conv.adminId?.toString()
      };
    });
    
    return res.status(200).json(contacts);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách liên hệ:", error);
    return res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

// Hàm lấy tin nhắn giữa admin và một user cụ thể
export const getMessagesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Kiểm tra xem người dùng có phải là admin không
    const isAdmin = req.headers['admin-token'] === ADMIN_SECRET_TOKEN 
      || (req.user && req.user.role === 'admin');
    
    // Nếu userId là "admin", thay thế bằng ID admin thực
    let actualUserId = userId;
    if (userId === "admin") {
      actualUserId = await getAdminId();
    }
    
    // Tìm cuộc hội thoại với userId
    let conversation;
    if (isAdmin) {
      // Admin đang xem tin nhắn của một user
      conversation = await Conversation.findOne({ userId: actualUserId });
    } else {
      // Người dùng đang xem tin nhắn của họ với admin
      const currentUserId = req.user ? req.user.id : actualUserId;
      conversation = await Conversation.findOne({ userId: currentUserId });
    }
    
    if (!conversation) {
      // Nếu không tìm thấy, trả về mảng rỗng
      return res.status(200).json([]);
    }
    
    // Format lại tin nhắn cho client
    const formattedMessages = conversation.messages.map(msg => ({
      id: msg._id.toString(),
      text: msg.text,
      sender: msg.sender,
      read: msg.read,
      createdAt: msg.timestamp
    }));
    
    return res.status(200).json(formattedMessages);
  } catch (error) {
    console.error("Lỗi khi lấy tin nhắn:", error);
    return res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

// Hàm gửi tin nhắn mới
export const sendMessage = async (req, res) => {
  try {
    const { text, sender, receiverId, userId: requestUserId } = req.body;
    
    if (!text || !sender) {
      return res.status(400).json({ message: "Thiếu thông tin tin nhắn" });
    }
    
    // Xác định userId và adminId
    let userId, adminId;
    
    // Lấy adminId
    adminId = await getAdminId();
    
    // Xác định userId dựa vào sender
    if (sender === 'admin') {
      // Nếu admin gửi tin nhắn, receiverId chính là userId
      userId = receiverId;
    } else {
      // Nếu user gửi tin nhắn, lấy userId từ request hoặc token
      userId = requestUserId || (req.user ? req.user.id : null);
    }
    
    if (!userId) {
      return res.status(400).json({ message: "Không xác định được người nhận tin nhắn" });
    }
    
    // Tìm cuộc hội thoại hiện có
    let conversation = await Conversation.findOne({ 
      userId: userId 
    });
    
    if (!conversation) {
      // Tạo mới cuộc hội thoại nếu chưa tồn tại
      conversation = new Conversation({
        userId,
        adminId,
        messages: [],
        unreadCount: 0
      });
    }
    
    // Thêm tin nhắn mới vào mảng
    const newMessage = {
      text,
      sender,
      read: false,
      timestamp: new Date()
    };
    
    conversation.messages.push(newMessage);
    
    // Cập nhật số lượng tin nhắn chưa đọc
    if (sender === 'user') {
      conversation.unreadCount = (conversation.unreadCount || 0) + 1;
    }
    
    // Lưu cuộc hội thoại
    await conversation.save();
    
    // Lấy tin nhắn vừa thêm vào
    const addedMessage = conversation.messages[conversation.messages.length - 1];
    
    // Trả về thông tin tin nhắn đã gửi
    return res.status(201).json({
      id: addedMessage._id.toString(),
      text: addedMessage.text,
      sender: addedMessage.sender,
      read: addedMessage.read,
      createdAt: addedMessage.timestamp
    });
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn:", error);
    return res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

// Hàm đánh dấu tất cả tin nhắn là đã đọc
export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Tìm cuộc hội thoại
    const conversation = await Conversation.findOne({ userId });
    
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc hội thoại" });
    }
    
    // Cập nhật trạng thái đã đọc cho tất cả tin nhắn từ admin
    let updated = false;
    
    conversation.messages = conversation.messages.map(msg => {
      if (msg.sender === 'admin' && !msg.read) {
        updated = true;
        return { ...msg.toObject(), read: true };
      }
      return msg;
    });
    
    // Reset số lượng tin nhắn chưa đọc
    if (updated) {
      conversation.unreadCount = 0;
      await conversation.save();
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Lỗi khi đánh dấu tin nhắn đã đọc:", error);
    return res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

// Hàm lấy số lượng tin nhắn chưa đọc cho admin
export const getUnreadCount = async (req, res) => {
  try {
    // Kiểm tra admin token
    const isAdmin = req.headers['admin-token'] === ADMIN_SECRET_TOKEN;
    if (!isAdmin) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    
    // Tính tổng số tin nhắn chưa đọc từ tất cả cuộc hội thoại
    const conversations = await Conversation.find();
    const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
    
    return res.status(200).json({ count: totalUnread });
  } catch (error) {
    console.error("Lỗi khi lấy số lượng tin nhắn chưa đọc:", error);
    return res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

// Hàm format thời gian
function formatTimeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // Độ chênh lệch tính bằng giây
  
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  
  return new Date(date).toLocaleDateString('vi-VN');
} 