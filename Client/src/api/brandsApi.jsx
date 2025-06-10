import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

const API_URL = `${API_BASE_URL}/api/brands`;

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

// Lấy tất cả thương hiệu theo branch (nếu role là manager) hoặc tất cả thương hiệu (nếu role là admin)
export const getAllBrands = async () => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(API_URL, { headers });
    return response.data.data || []; // Return the data array from the response
  } catch (error) {
    handleError("fetching all brands", error);
    return [];
  }
};

// Tìm kiếm thương hiệu theo query (tên, mã, quốc gia)
export const searchBrands = async (query) => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(
      `${API_URL}/search?query=${encodeURIComponent(query)}`,
      { headers }
    );
    return response.data.data || [];
  } catch (error) {
    handleError("searching brands", error);
    return [];
  }
};

// Lấy thương hiệu theo ID
export const getBrandById = async (id) => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_URL}/${id}`, { headers });
    return response.data;
  } catch (error) {
    handleError(`fetching brand with ID ${id}`, error);
  }
};

// Tạo mới thương hiệu (backend sẽ tự lấy branchId từ req.user)
export const createBrand = async (brandData) => {
  try {
    // Đảm bảo branchId được gửi đúng cách
    const dataToSend = { ...brandData };
    
    // Log dữ liệu trước khi gửi
    console.log("createBrand API - sending data:", dataToSend);
    
    const headers = {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    };
    const response = await axios.post(API_URL, dataToSend, { headers });
    return response.data;
  } catch (error) {
    handleError("creating brand", error);
  }
};

// Cập nhật thương hiệu
export const updateBrand = async (id, brandData) => {
  try {
    // Đảm bảo branchId được gửi đúng cách
    const dataToSend = { ...brandData };
    
    // Log dữ liệu trước khi gửi
    console.log("updateBrand API - sending data:", dataToSend);
    
    const headers = {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    };
    const response = await axios.put(`${API_URL}/${id}`, dataToSend, {
      headers,
    });
    return response.data;
  } catch (error) {
    handleError(`updating brand ${id}`, error);
  }
};

// Xóa thương hiệu
export const deleteBrand = async (id) => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.delete(`${API_URL}/${id}`, { headers });
    return response.data;
  } catch (error) {
    handleError(`deleting brand ${id}`, error);
  }
};

// Hàm xử lý lỗi chuẩn
const handleError = (action, error) => {
  console.error(`Error ${action}:`, error?.response?.data || error.message);
  throw error;
};
