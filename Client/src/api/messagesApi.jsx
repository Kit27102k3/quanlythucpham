import axios from "axios";
import { API_URLS } from "../config/apiConfig";

// Lấy token từ localStorage với nhiều trường hợp
const getAuthHeader = () => {
  // Thử lấy token từ nhiều chỗ khác nhau
  const token = 
    localStorage.getItem("accessToken") || 
    localStorage.getItem("token") || 
    localStorage.getItem("access_token");
  
  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "admin";
  
  const headers = {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  if (isAdmin) {
    headers["admin-token"] = "admin-token-for-TKhiem";
  }
  
  return headers;
};

const messagesApi = {
  // Lấy tất cả liên hệ (người dùng đã nhắn tin)
  getAllContacts: async () => {
    try {
      const response = await axios.get(`${API_URLS.MESSAGES}/contacts`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách liên hệ:", error);
      throw error;
    }
  },

  // Lấy lịch sử tin nhắn với một người dùng
  getMessagesByUserId: async (userId) => {
    try {
      // Lấy userId từ localStorage
      const currentUserId = localStorage.getItem("userId");
      
      // Sử dụng currentUserId nếu không có userId được truyền vào
      const targetUserId = userId === "admin" ? "admin" : (userId || currentUserId);
      
      const headers = getAuthHeader();
      
      const response = await axios.get(`${API_URLS.MESSAGES}/user/${targetUserId}`, {
        headers: headers
      });
      
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy tin nhắn:", error);
      throw error;
    }
  },

  // Gửi tin nhắn mới
  sendMessage: async (data) => {
    try {
      const response = await axios.post(`${API_URLS.MESSAGES}/send`, data, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      throw error;
    }
  },

  // Đánh dấu tin nhắn đã đọc
  markAsRead: async (messageId) => {
    try {
      const response = await axios.patch(
        `${API_URLS.MESSAGES}/${messageId}/read`,
        {},
        {
          headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi đánh dấu tin nhắn đã đọc:", error);
      throw error;
    }
  },

  // Đánh dấu tất cả tin nhắn của một người dùng là đã đọc
  markAllAsRead: async (userId) => {
    try {
      const response = await axios.patch(
        `${API_URLS.MESSAGES}/user/${userId}/read-all`,
        {},
        {
          headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả tin nhắn đã đọc:", error);
      throw error;
    }
  },

  // Lấy số lượng tin nhắn chưa đọc
  getUnreadCount: async () => {
    try {
      const response = await axios.get(`${API_URLS.MESSAGES}/unread-count`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy số lượng tin nhắn chưa đọc:", error);
      throw error;
    }
  }
};

export default messagesApi; 