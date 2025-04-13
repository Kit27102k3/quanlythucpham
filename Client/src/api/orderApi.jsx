import axios from "axios";

const API_URL = "http://localhost:8080";
const GHN_API_URL = "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order";

// Cấu hình Axios để gửi token trong header
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getOrderById = async (orderId) => {
  const response = await axios.get(`${API_URL}/orders/${orderId}`);
  return response.data;
};

const orderApi = {
  createOrder: async (orderData) => {
    const response = await axios.post(`${API_URL}/orders`, orderData);
    return response.data;
  },
  getUserOrders: async () => {
    try {
      // Get the access token
      // All localStorage keys: ["access_token", "refresh_token", "auth_user", "user"]
      // console.log("All localStorage keys:", Object.keys(localStorage));

      // Try to find user ID from user data
      const userString = localStorage.getItem("user");
      // console.log("User data from localStorage:", userString);
      const authString = localStorage.getItem("auth_user");
      // console.log("Auth data from localStorage:", authString);
      const tokenString = localStorage.getItem("access_token");
      // console.log("Token data from localStorage:", tokenString);

      let userId = null;

      // First, try to get userId from user object
      if (userString) {
        try {
          const userData = JSON.parse(userString);
          userId = userData._id;
          // console.log("UserId from user object:", userId);
        } catch (e) {
          // Invalid JSON, continue to next method
        }
      }

      // If userId is still null, try to get it from auth_user
      if (!userId && authString) {
        try {
          const authData = JSON.parse(authString);
          userId = authData.user?._id;
          // console.log("UserId from auth object:", userId);
        } catch (e) {
          // Invalid JSON, continue to next method
        }
      }

      // If we have a user ID, use it to filter orders
      let url = `${API_URL}/orders`;
      if (userId) {
        url = `${API_URL}/orders/user?userId=${userId}`;
      }

      // console.log("Calling API with URL:", url);
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy đơn hàng của người dùng:", error);
      // Trả về mảng rỗng thay vì throw error
      return [];
    }
  },
  getOrderById,
  
  // Thêm hàm hủy đơn hàng
  cancelOrder: async (orderId) => {
    try {
      // Thêm tham số để tránh cache
      const timestamp = new Date().getTime();
      const response = await axios.post(`${API_URL}/orders/${orderId}/cancel?_t=${timestamp}`);
      // console.log("Hủy đơn hàng thành công:", response.data);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
      throw error;
    }
  },

  // Thêm hàm lấy thông tin vận chuyển từ GHN
  getOrderTracking: async (orderCode) => {
    try {
      // Gọi API server để lấy thông tin tracking từ GHN
      const response = await axios.get(`${API_URL}/orders/tracking/${orderCode}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin vận chuyển:", error);
      throw error;
    }
  },
  
  // Thêm hàm cập nhật mã vận đơn cho đơn hàng
  updateOrderWithTrackingCode: async (orderId, orderCode) => {
    try {
      // Tạo mã vận đơn tự động nếu không được cung cấp
      const generatedOrderCode = orderCode || generateRandomOrderCode();
      
      const response = await axios.patch(`${API_URL}/orders/${orderId}`, {
        orderCode: generatedOrderCode
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật mã vận đơn:", error);
      throw error;
    }
  }
};

// Hàm tạo mã vận đơn ngẫu nhiên (10 ký tự)
function generateRandomOrderCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export default orderApi;
