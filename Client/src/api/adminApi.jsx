import axios from "axios";
import { API_BASE_URL } from '../config/apiConfig';
import { instance as axiosInstance } from "./authApi";

const API_URL = `${API_BASE_URL}/api`;

const adminApi = {
  createAdmin: async (adminData) => {
    try {
      const response = await axiosInstance.post(`${API_URL}/admin/create`, adminData);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tạo admin:", error);
      throw error;
    }
  },

  getAllAdmins: async () => {
    try {
      const response = await axiosInstance.get(`${API_URL}/admin/list`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách admin:", error);
      throw error;
    }
  },

  updateAdmin: async (id, adminData) => {
    try {
      const response = await axiosInstance.put(`${API_URL}/admin/${id}`, adminData);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật admin:", error);
      throw error;
    }
  },

  deleteAdmin: async (id) => {
    try {
      const response = await axiosInstance.delete(`${API_URL}/admin/${id}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi xóa admin:", error);
      throw error;
    }
  },

  getProfile: async (id) => {
    try {
      const response = await axiosInstance.get(`${API_URL}/admin/${id}`);
      return response;
    } catch (error) {
      console.error("Lỗi khi lấy profile admin:", error);
      throw error;
    }
  },

  updateRolePermissions: async (roleKey, permissions) => {
    try {
      const response = await axiosInstance.put(`${API_URL}/roles/${roleKey}/permissions`, { permissions });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật quyền vai trò:", error);
      throw error;
    }
  }
};

export default adminApi;
