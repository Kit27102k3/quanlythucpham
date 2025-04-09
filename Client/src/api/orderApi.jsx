import axios from "axios";

const API_URL = "http://localhost:8080";

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
      // Kiểm tra các khóa trong localStorage
      console.log("All localStorage keys:", Object.keys(localStorage));
      
      // Thử lấy từ các khóa phổ biến
      const userString = localStorage.getItem("user");
      const authString = localStorage.getItem("auth");
      const tokenString = localStorage.getItem("token");
      
      console.log("User data from localStorage:", userString);
      console.log("Auth data from localStorage:", authString);
      console.log("Token data from localStorage:", tokenString);
      
      // Phân tích cú pháp dữ liệu người dùng
      let userId = null;
      
      // Thử lấy từ user
      try {
        if (userString) {
          const userData = JSON.parse(userString);
          userId = userData._id;
          console.log("UserId from user object:", userId);
        }
      } catch (parseError) {
        console.error("Error parsing user data:", parseError);
      }
      
      // Thử lấy từ auth nếu chưa có userId
      if (!userId && authString) {
        try {
          const authData = JSON.parse(authString);
          userId = authData.user?._id || authData._id;
          console.log("UserId from auth object:", userId);
        } catch (parseError) {
          console.error("Error parsing auth data:", parseError);
        }
      }
      
      // Nếu có userId, truyền vào query parameter
      const url = userId 
        ? `${API_URL}/orders/user?userId=${userId}`
        : `${API_URL}/orders/user`;
      
      console.log("Calling API with URL:", url);  
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
      console.log("Hủy đơn hàng thành công:", response.data);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
      throw error;
    }
  }
};

export default orderApi;
