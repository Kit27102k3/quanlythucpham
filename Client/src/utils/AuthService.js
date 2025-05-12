import axios from "axios";
import { API_URLS } from "../config/apiConfig";

// Utility service for handling authentication, including social logins
const AuthService = {
  /**
   * Xử lý đăng nhập bằng Facebook
   * @param {Object} facebookResponse - Dữ liệu trả về từ Facebook Login
   * @returns {Promise} Kết quả xử lý đăng nhập
   */
  loginWithFacebook: async (facebookResponse) => {
    try {
      // Gọi API endpoint để xác thực thông tin từ Facebook
      const response = await axios.post(`${API_URLS.AUTH}/facebook-login`, {
        accessToken: facebookResponse.accessToken,
        userID: facebookResponse.userID
      });

      // Nếu đăng nhập thành công, lưu thông tin vào localStorage
      if (response.data && response.data.token) {
        localStorage.setItem("accessToken", response.data.token);
        
        // Lưu thông tin người dùng
        if (response.data.user) {
          localStorage.setItem("userId", response.data.user.id);
          localStorage.setItem("userName", response.data.user.name || response.data.user.username);
          if (response.data.user.role) {
            localStorage.setItem("userRole", response.data.user.role);
          }
        }
        
        // Lưu refresh token nếu có
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error("Lỗi đăng nhập Facebook:", error);
      throw error;
    }
  },
  
  /**
   * Xử lý đăng nhập bằng Google
   * @param {Object} googleResponse - Dữ liệu trả về từ Google Login
   * @returns {Promise} Kết quả xử lý đăng nhập
   */
  loginWithGoogle: async (googleResponse) => {
    try {
      console.log("Sending Google credential to API for verification");
      
      // Gọi API endpoint để xác thực thông tin từ Google
      const response = await axios.post(`${API_URLS.AUTH}/google-login`, {
        credential: googleResponse.credential
      });

      console.log("Google API response:", response.data);

      // Nếu đăng nhập thành công, lưu thông tin vào localStorage
      if (response.data && (response.data.token || response.data.accessToken)) {
        // Support different response structures
        const token = response.data.token || response.data.accessToken;
        localStorage.setItem("accessToken", token);
        
        // Lưu thông tin người dùng
        const userData = response.data.user || response.data.data || {};
        const userId = userData.id || userData._id;
        const userName = userData.name || userData.userName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
        
        if (userId) {
          localStorage.setItem("userId", userId);
          localStorage.setItem("userName", userName);
          
          if (userData.role) {
            localStorage.setItem("userRole", userData.role);
          }
        }
        
        // Lưu refresh token nếu có
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }
      } else {
        console.error("Invalid API response structure:", response.data);
        throw new Error("Dữ liệu không hợp lệ từ máy chủ");
      }
      
      return response.data;
    } catch (error) {
      console.error("Lỗi API đăng nhập Google:", error);
      console.error("Response data:", error.response?.data);
      throw error;
    }
  },
  
  /**
   * Kiểm tra xem người dùng đã đăng nhập chưa
   * @returns {Boolean} Trạng thái đăng nhập
   */
  isAuthenticated: () => {
    return !!localStorage.getItem("accessToken");
  },
  
  /**
   * Lấy thông tin người dùng hiện tại
   * @returns {Object} Thông tin người dùng
   */
  getCurrentUser: () => {
    return {
      id: localStorage.getItem("userId"),
      name: localStorage.getItem("userName"),
      role: localStorage.getItem("userRole")
    };
  }
};

export default AuthService; 