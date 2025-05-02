import axios from "axios";
import { API_URLS } from "../config/apiConfig";

// Lấy token từ localStorage với nhiều trường hợp
const getAuthHeader = () => {
  // Thử lấy token từ nhiều chỗ khác nhau
  const token = 
    localStorage.getItem("accessToken") || 
    localStorage.getItem("token") || 
    localStorage.getItem("access_token") ||
    localStorage.getItem("admin-token-for-TKhiem") ||
    "admin-token-for-TKhiem"; // Fallback đến token admin đặc biệt

  
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`
  };
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
      const response = await axios.get(`${API_URLS.MESSAGES}/user/${userId}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy tin nhắn:", error);
      throw error;
    }
  },

  // Gửi tin nhắn
  sendMessage: async (messageData) => {
    try {
      console.log("Sending message data:", messageData);
      
      const response = await axios.post(`${API_URLS.MESSAGES}/send`, messageData, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        }
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