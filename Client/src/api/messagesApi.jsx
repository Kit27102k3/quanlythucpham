import axios from "axios";
import { API_URLS } from "../config/apiConfig";

const getAuthHeader = () => {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token");

  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "admin" || userRole === "manager";

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
  getAllContacts: async () => {
    try {
      const response = await axios.get(`${API_URLS.MESSAGES}/contacts`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách liên hệ:", error);
      throw error;
    }
  },

  getMessagesByUserId: async (userId) => {
    try {
      const currentUserId = localStorage.getItem("userId");
      const targetUserId =
        userId === "admin" ? "admin" : userId || currentUserId;

      const response = await axios.get(
        `${API_URLS.MESSAGES}/user/${targetUserId}`,
        {
          headers: getAuthHeader(),
        }
      );

      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy tin nhắn:", error);
      throw error;
    }
  },

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

  getUnreadCount: async () => {
    try {
      const response = await axios.get(`${API_URLS.MESSAGES}/unread-count`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy số lượng tin nhắn chưa đọc:", error);
      throw error;
    }
  },
};

export default messagesApi;
