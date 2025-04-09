import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081',
  timeout: 10000, // 10 seconds
  headers: {
    "Content-Type": "application/json",
  }
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  // Tự động thêm token nếu có
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Thêm cache buster cho GET requests để tránh cache không mong muốn
  if (config.method === "get") {
    config.params = {
      ...config.params,
      _t: Date.now() // cache buster
    };
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor
apiClient.interceptors.response.use((response) => {
  return response;
}, async (error) => {
  const originalRequest = error.config;

  // Xử lý token hết hạn (401)
  if (error.response && error.response.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    
    try {
      // Lấy refresh token
      const refreshToken = localStorage.getItem("refresh_token");
      
      if (refreshToken) {
        // Gọi API để refresh token
        const res = await axios.post("http://localhost:8081/api/auth/refresh-token", {
          refreshToken
        });
        
        // Lưu token mới
        if (res.data && res.data.accessToken) {
          localStorage.setItem("access_token", res.data.accessToken);
          
          // Cập nhật token trong header
          apiClient.defaults.headers.common["Authorization"] = `Bearer ${res.data.accessToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${res.data.accessToken}`;
          
          // Thử lại request ban đầu
          return apiClient(originalRequest);
        }
      }
    } catch (refreshError) {
      // Xử lý lỗi refresh token
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      
      // Chuyển hướng tới trang đăng nhập nếu cần
      window.location.href = "/dang-nhap";
    }
  }
  
  // Xử lý các lỗi khác
  if (error.response) {
    // Lỗi từ server
    console.error("Server error:", error.response.status, error.response.data);
  } else if (error.request) {
    // Không nhận được phản hồi từ server
    console.error("Network error, no response received");
  } else {
    // Lỗi trong quá trình thiết lập request
    console.error("Error setting up request:", error.message);
  }
  
  return Promise.reject(error);
});

export default apiClient; 