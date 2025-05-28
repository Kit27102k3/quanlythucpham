import axios from "axios";
import { API_BASE_URL } from '../config/apiConfig';

const API_URL = `${API_BASE_URL}/api/branches`;

const branchesApi = {
  getAllBranches: async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await axios.get(API_URL, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách chi nhánh:", error);
      throw error;
    }
  },

  createBranch: async (data) => {
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
      console.error("Lỗi khi thêm chi nhánh:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      }
      throw error;
    }
  },

  updateBranch: async (id, data) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await axios.put(`${API_URL}/${id}`, data, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật chi nhánh:", error);
      throw error;
    }
  },

  deleteBranch: async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await axios.delete(`${API_URL}/${id}`, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi xóa chi nhánh:", error);
      throw error;
    }
  },

  getBranchById: async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await axios.get(`${API_URL}/${id}`, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin chi nhánh theo ID:", error);
      throw error;
    }
  },

  searchBranches: async (query) => {
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
      console.error("Lỗi khi tìm kiếm chi nhánh:", error);
      throw error;
    }
  },
};

export default branchesApi; 