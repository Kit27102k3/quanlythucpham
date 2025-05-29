import axios from "axios";
import { API_URLS } from '../config/apiConfig';

// Add branches endpoint to API_URLS if it doesn't exist
const API_URL = API_URLS.BRANCHES;

const branchesApi = {
  getAllBranches: async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await axios.get(API_URL, { headers });
      
      // If the response doesn't have data property or it's not an array, return an empty array
      if (!response.data || !Array.isArray(response.data)) {
        console.warn("Branches API returned invalid data:", response.data);
        return { data: [] };
      }
      
      return response;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách chi nhánh:", error);
      // Return a structured response with empty data array instead of throwing
      return { data: [] };
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
      if (!id) {
        console.error("getBranchById called with undefined or null id:", id);
        throw new Error("Branch ID is required");
      }
      
      console.log("getBranchById - Fetching branch with ID:", id);
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        console.warn("getBranchById - No access token found in localStorage");
      }
      
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      console.log("getBranchById - Making API request to:", `${API_URL}/${id}`);
      const response = await axios.get(`${API_URL}/${id}`, { headers });
      console.log("getBranchById - Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin chi nhánh theo ID:", id, error);
      console.error("Error response:", error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      } : 'No response data');
      console.error("Error request:", error.request ? 'Request was made but no response' : 'Request not sent');
      console.error("Error config:", error.config);
      
      // Return a structured error object instead of throwing
      return { error: true, message: error.message, branch: null };
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

  // Tìm chi nhánh gần nhất với tọa độ
  findNearestBranch: async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `${API_URL}/nearest?latitude=${latitude}&longitude=${longitude}`
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tìm chi nhánh gần nhất:", error);
      throw error;
    }
  },

  // Phân công chi nhánh cho địa chỉ
  assignBranchToAddress: async (addressData) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await axios.post(
        `${API_URL}/assign`, 
        addressData, 
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi phân công chi nhánh cho địa chỉ:", error);
      throw error;
    }
  },
};

export default branchesApi; 