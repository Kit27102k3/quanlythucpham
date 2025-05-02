import Conversation from "../Model/Message.js";
import User from "../Model/Register.js";
import { getAdminId } from "../config/admin.js";
import mongoose from "mongoose";

// Hàm lấy tất cả người dùng đã nhắn tin với admin
export const getAllContacts = async (req, res) => {
  try {
    // Lấy danh sách các cuộc hội thoại
    const conversations = await Conversation.find().sort({ lastUpdated: -1 });
    
    // Lấy thông tin chi tiết về người dùng
    const userIds = conversations.map(conv => conv.userId);
    const users = await User.find({ _id: { $in: userIds } });
    
    // Map thông tin người dùng vào kết quả
    const contacts = conversations.map(conv => {
      const user = users.find(u => u._id.toString() === conv.userId.toString());
      const lastMessage = conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;
      
      return {
        id: user?._id.toString() || conv.userId.toString(),
        name: user?.userName || user?.firstName + " " + user?.lastName || 'Người dùng',
        avatar: user?.userImage || null,
        online: false, // Có thể triển khai sau với Socket.io
        lastSeen: lastMessage ? formatTimeAgo(lastMessage.timestamp) : null,
        lastMessage: lastMessage ? lastMessage.text : '',
        unread: conv.messages.filter(msg => msg.sender === 'user' && !msg.read).length
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
    
    // Lấy thông tin người dùng hiện tại từ token
    const currentUserId = req.user ? req.user.id : null;
    
    // Kiểm tra xem người dùng có phải là admin không
    const isAdmin = req.headers['admin-token'] === process.env.ADMIN_SECRET_TOKEN 
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
      conversation = await Conversation.findOne({ userId: currentUserId });
    }
    
    if (!conversation) {
      // Nếu là người dùng đang xem tin nhắn với admin và conversation không tồn tại
      // Tạo conversation trống
      if (!isAdmin && currentUserId) {
        const adminId = await getAdminId();
        
        conversation = new Conversation({
          userId: new mongoose.Types.ObjectId(currentUserId),
          adminId,
          messages: [],
          unreadCount: 0
        });
        
        // Thêm tin nhắn chào mừng
        conversation.messages.push({
          text: "Chào mừng bạn đến với hỗ trợ trực tuyến! Tôi có thể giúp gì cho bạn?",
          sender: "admin",
          read: false,
          timestamp: new Date()
        });
        
        await conversation.save();
      }
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
    
    // Xác định userId (người dùng gửi hoặc nhận tin nhắn)
    let userId = requestUserId;
    if (!userId && req.user) {
      userId = req.user.id;
    }
    
    if (!userId) {
      return res.status(400).json({ message: "Không xác định được userId" });
    }
    
    // Xử lý đặc biệt khi admin gửi tin nhắn cho user
    let userObjectId;
    
    if (sender === 'admin' && receiverId !== 'admin') {
      // Admin gửi tin nhắn cho user
      if (typeof receiverId === 'string' && mongoose.Types.ObjectId.isValid(receiverId)) {
        userObjectId = new mongoose.Types.ObjectId(receiverId);
      } else {
        return res.status(400).json({ message: "receiverId không hợp lệ" });
      }
    } else {
      // User gửi tin nhắn cho admin hoặc khác
      // Kiểm tra và chuyển đổi userId thành ObjectId
      try {
        if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
          userObjectId = new mongoose.Types.ObjectId(userId);
        } else {
          return res.status(400).json({ message: "userId không hợp lệ" });
        }
      } catch (error) {
        console.error("Lỗi khi chuyển đổi userId:", error);
        return res.status(400).json({ message: "Lỗi khi xử lý userId" });
      }
    }
    
    // Xác định adminId
    const adminId = await getAdminId();
    
    // Tìm hoặc tạo cuộc hội thoại
    let conversation = await Conversation.findOne({ userId: userObjectId });
    
    if (!conversation) {
      // Tạo mới cuộc hội thoại nếu chưa tồn tại
      conversation = new Conversation({
        userId: userObjectId,
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
    const savedConversation = await conversation.save();
    
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
    console.error("Chi tiết lỗi:", error.stack);
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
    
    // Cập nhật trạng thái đã đọc cho tất cả tin nhắn từ user
    let updated = false;
    conversation.messages = conversation.messages.map(msg => {
      if (msg.sender === 'user' && !msg.read) {
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
    const isAdmin = req.headers['admin-token'] === process.env.ADMIN_SECRET_TOKEN;
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