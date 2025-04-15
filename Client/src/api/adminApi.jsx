import axios from "axios";
import { API_BASE_URL } from '../config/apiConfig';

const API_URL = `${API_BASE_URL}/api`;

const adminApi = {
  createAdmin: async (adminData) => {
    try {
      const response = await axios.post(`${API_URL}/admin/create`, adminData);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tạo admin:", error);
      throw error;
    }
  },

  getAllAdmins: async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/list`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách admin:", error);
      throw error;
    }
  },

  updateAdmin: async (id, adminData) => {
    try {
      const response = await axios.put(`${API_URL}/admin/${id}`, adminData);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật admin:", error);
      throw error;
    }
  },

  deleteAdmin: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/admin/${id}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi xóa admin:", error);
      throw error;
    }
  }
};

export default adminApi;
