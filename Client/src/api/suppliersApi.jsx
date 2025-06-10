import axios from "axios";
import { API_BASE_URL } from '../config/apiConfig';

const API_URL = `${API_BASE_URL}/api/suppliers`;

// Hàm lấy token xác thực
const getAuthToken = () => {
  const token = localStorage.getItem("accessToken");
  return token;
};

// Hàm thiết lập headers chuẩn cho các request
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const suppliersApi = {
  getAllSuppliers: async (params = {}) => {
    try {
      const headers = getAuthHeaders();
      
      // Xây dựng query parameters
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.branchId) queryParams.append('branchId', params.branchId);
      
      const queryString = queryParams.toString();
      const url = queryString ? `${API_URL}?${queryString}` : API_URL;
      
      const response = await axios.get(url, { headers });
      
      // Trả về dữ liệu đã được format từ server
      if (response.data && response.data.success) {
        return {
          data: response.data.data || [],
          pagination: response.data.pagination || {}
        };
      } else {
        console.warn("Suppliers API returned invalid data:", response.data);
        return { data: [], pagination: {} };
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách nhà cung cấp:", error);
      throw error;
    }
  },

  createSupplier: async (data) => {
    try {
      // Đảm bảo branchId được gửi đúng cách
      const supplierData = { ...data };
      
      // Log dữ liệu trước khi gửi
      console.log("createSupplier API - sending data:", supplierData);
      
      const headers = {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      };
      
      const response = await axios.post(API_URL, supplierData, { headers });
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
      // Đảm bảo branchId được gửi đúng cách
      const supplierData = { ...data };
      
      // Log dữ liệu trước khi gửi
      console.log("updateSupplier API - sending data:", supplierData);
      
      const headers = {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      };
      
      const response = await axios.put(`${API_URL}/${id}`, supplierData, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật nhà cung cấp:", error);
      throw error;
    }
  },

  deleteSupplier: async (id) => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.delete(`${API_URL}/${id}`, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi xóa nhà cung cấp:", error);
      throw error;
    }
  },

  getSupplierById: async (id) => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/${id}`, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin nhà cung cấp theo ID:", error);
      throw error;
    }
  },

  searchSuppliers: async (query, branchId) => {
    try {
      const headers = getAuthHeaders();
      
      // Xây dựng query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('query', query || '');
      if (branchId) queryParams.append('branchId', branchId);
      
      const url = `${API_URL}/search?${queryParams.toString()}`;
      
      const response = await axios.get(url, { headers });
      
      if (response.data && response.data.success) {
        return response.data.data || [];
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn("Suppliers search API returned invalid data:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Lỗi khi tìm kiếm nhà cung cấp:", error);
      throw error;
    }
  },
  
  resetIndexes: async () => {
    try {
      const response = await axios.post(`${API_URL}/reset-indexes-now`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi reset indexes:", error);
      throw error;
    }
  }
};

export default suppliersApi; 