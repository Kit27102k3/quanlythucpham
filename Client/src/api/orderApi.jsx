import axios from "axios";
import { API_BASE_URL } from '../config/apiConfig';

const API_URL = API_BASE_URL;
// Không sử dụng biến này nên comment hoặc xóa để tránh lỗi linter
// const GHN_API_URL = "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order";

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
  try {
    const userId = localStorage.getItem("userId");
    const response = await axios.get(`${API_URL}/orders/${orderId}`);
    const orderData = response.data;
    
    // Kiểm tra nếu đơn hàng không thuộc về người dùng hiện tại
    const orderUserId = orderData.userId && typeof orderData.userId === 'object' 
      ? orderData.userId._id 
      : orderData.userId;
      
    if (userId && orderUserId !== userId) {
      console.warn("Đơn hàng không thuộc về người dùng hiện tại!");
    }
    
    return orderData;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đơn hàng:", error);
    throw error;
  }
};

// Hàm kiểm tra trạng thái đơn hàng (để theo dõi cập nhật real-time)
export const checkOrderStatus = async (orderId) => {
  try {
    // Thêm timestamp để tránh cache
    const timestamp = new Date().getTime();
    const response = await axios.get(`${API_URL}/orders/${orderId}?_t=${timestamp}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi kiểm tra trạng thái đơn hàng:", error);
    throw error;
  }
};

const orderApi = {
  createOrder: async (orderData) => {
    const response = await axios.post(`${API_URL}/orders`, orderData);
    return response.data;
  },
  getUserOrders: async () => {
    try {
      // Lấy userId từ localStorage - sử dụng userId trực tiếp nếu có
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        console.error("Không tìm thấy userId trong localStorage");
        return [];
      }
      
      // Thêm timestamp để tránh cache
      const timestamp = new Date().getTime();
      
      // Sử dụng userId để lấy đơn hàng của người dùng hiện tại
      const url = `${API_URL}/orders/user?userId=${userId}&_t=${timestamp}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy đơn hàng của người dùng:", error);
      // Trả về mảng rỗng thay vì throw error
      return [];
    }
  },
  getOrderById,
  checkOrderStatus,
  
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
  },
  
  // Thêm hàm lấy top đơn hàng có giá trị cao nhất
  getTopOrders: async (limit = 10) => {
    try {
      const response = await axios.get(`${API_URL}/orders/top`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đơn hàng giá trị cao nhất:", error);
      throw error;
    }
  },
  
  // Thêm hàm lấy thống kê giao hàng
  getDeliveryStats: async (period = 'week') => {
    try {
      const response = await axios.get(`${API_URL}/orders/delivery-stats`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thống kê giao hàng:", error);
      throw error;
    }
  },

  // Lấy đơn hàng theo chi nhánh
  getOrdersByBranch: async (branchId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await axios.get(`${API_URL}/branch/${branchId}`, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy đơn hàng theo chi nhánh:", error);
      throw error;
    }
  },

  // Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (orderId, updateData) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await axios.put(`${API_URL}/${orderId}/status`, updateData, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
      throw error;
    }
  },
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
