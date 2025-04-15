import axios from "axios";
import { API_BASE_URL } from '../config/apiConfig';

const API_URL = `${API_BASE_URL}/api/categories`;

const categoriesApi = {
  getAllCategories: async () => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi hiển thị tất cả danh mục:", error);
      throw error;
    }
  },

  createCategory: async (data) => {
    try {
      const response = await axios.post(API_URL, data);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tạo danh mục:", error);
      throw error;
    }
  },

  updateCategory: async (id, data) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật danh mục:", error);
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi xóa danh mục:", error);
      throw error;
    }
  },

  getCategoryById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin danh mục theo ID:", error);
      throw error;
    }
  },

  getCategoryByName: async (name) => {
    try {
      const response = await axios.get(`${API_URL}/name/${encodeURIComponent(name)}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin danh mục theo tên:", error);
      throw error;
    }
  },
};

export default categoriesApi;
