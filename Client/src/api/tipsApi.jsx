import axios from "axios";
import { API_BASE_URL } from '../config/apiConfig';

const API_URL = `${API_BASE_URL}/api/tips`;

const tipsApi = {
  getAllTips: async () => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách mẹo hay:", error);
      throw error;
    }
  },

  getTipById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết mẹo hay:", error);
      throw error;
    }
  },

  getTipsByCategory: async (category) => {
    try {
      const response = await axios.get(`${API_URL}/category/${encodeURIComponent(category)}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy mẹo hay theo danh mục:", error);
      throw error;
    }
  },

  getFeaturedTips: async () => {
    try {
      const response = await axios.get(`${API_URL}/featured`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy mẹo hay nổi bật:", error);
      throw error;
    }
  },

  createTip: async (formData) => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "multipart/form-data",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await axios.post(API_URL, formData, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tạo mẹo hay mới:", error);
      throw error;
    }
  },

  updateTip: async (id, formData) => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "multipart/form-data",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await axios.put(`${API_URL}/${id}`, formData, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật mẹo hay:", error);
      throw error;
    }
  },

  deleteTip: async (id) => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const headers = {};
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await axios.delete(`${API_URL}/${id}`, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi xóa mẹo hay:", error);
      throw error;
    }
  },

  likeTip: async (id) => {
    try {
      const response = await axios.post(`${API_URL}/${id}/like`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tăng like cho mẹo hay:", error);
      throw error;
    }
  }
};

export default tipsApi; 