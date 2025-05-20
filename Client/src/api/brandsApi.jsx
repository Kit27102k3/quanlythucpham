import axios from "axios";
import { API_BASE_URL } from '../config/apiConfig';

const API_URL = `${API_BASE_URL}/api/brands`;

// Hàm lấy token xác thực
const getAuthToken = () => {
  // Luôn lấy accessToken
  const token = localStorage.getItem("accessToken");
  console.log("Token lấy từ localStorage:", token);
  return token;
};

// Lấy tất cả thương hiệu
export const getAllBrands = async () => {
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await axios.get(API_URL, { headers });
    return response.data;
  } catch (error) {
    console.error("Error fetching brands:", error);
    throw error;
  }
};

// Tìm kiếm thương hiệu
export const searchBrands = async (query) => {
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await axios.get(`${API_URL}/search?query=${encodeURIComponent(query)}`, { headers });
    return response.data;
  } catch (error) {
    console.error("Error searching brands:", error);
    throw error;
  }
};

// Lấy thông tin một thương hiệu theo ID
export const getBrandById = async (id) => {
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await axios.get(`${API_URL}/${id}`, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error fetching brand ${id}:`, error);
    throw error;
  }
};

// Tạo thương hiệu mới
export const createBrand = async (brandData) => {
  try {
    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    console.log("Gửi request tạo brand với token:", token);
    const response = await axios.post(API_URL, brandData, { headers });
    return response.data;
  } catch (error) {
    console.error("Error creating brand:", error);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
};

// Cập nhật thương hiệu
export const updateBrand = async (id, brandData) => {
  try {
    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await axios.put(`${API_URL}/${id}`, brandData, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error updating brand ${id}:`, error);
    throw error;
  }
};

// Xóa thương hiệu
export const deleteBrand = async (id) => {
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await axios.delete(`${API_URL}/${id}`, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error deleting brand ${id}:`, error);
    throw error;
  }
}; 