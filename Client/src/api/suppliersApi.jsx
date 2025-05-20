import axios from "axios";
import { API_BASE_URL } from '../config/apiConfig';

const API_URL = `${API_BASE_URL}/api/suppliers`;

const suppliersApi = {
  getAllSuppliers: async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await axios.get(API_URL, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách nhà cung cấp:", error);
      throw error;
    }
  },

  createSupplier: async (data) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await axios.post(API_URL, data, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi thêm nhà cung cấp:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      }
      throw error;
    }
  },

  updateSupplier: async (id, data) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await axios.put(`${API_URL}/${id}`, data, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật nhà cung cấp:", error);
      throw error;
    }
  },

  deleteSupplier: async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await axios.delete(`${API_URL}/${id}`, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi xóa nhà cung cấp:", error);
      throw error;
    }
  },

  getSupplierById: async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await axios.get(`${API_URL}/${id}`, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin nhà cung cấp theo ID:", error);
      throw error;
    }
  },

  searchSuppliers: async (query) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await axios.get(
        `${API_URL}/search?query=${encodeURIComponent(query)}`,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tìm kiếm nhà cung cấp:", error);
      throw error;
    }
  },
};

export default suppliersApi; 