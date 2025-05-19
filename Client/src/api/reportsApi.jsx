import axios from "axios";
import { API_BASE_URL } from '../config/apiConfig';

const API_URL = `${API_BASE_URL}/api`;
const EDGE_API_URL = `${API_BASE_URL}/api/reports`;

// Create a non-authenticated axios instance for reports
const reportAxios = axios.create({
  baseURL: API_BASE_URL
});

const reportsApi = {
  // Dashboard related reports
  getDashboardData: async () => {
    try {
      // Try the Edge API first
      try {
        const response = await reportAxios.get(`${EDGE_API_URL}/dashboard`);
        return response.data;
      } catch (edgeError) {
        console.log('Edge API failed, falling back to traditional endpoint');
        const response = await reportAxios.get(`${API_URL}/dashboard/stats`);
        return response.data;
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu dashboard:", error);
      return null; // Return null instead of throwing error
    }
  },

  // Revenue reports
  getRevenueData: async (timeRange = 'week', paymentMethod = 'all', region = 'all') => {
    try {
      // Try the Edge API first
      try {
        const response = await reportAxios.get(`${EDGE_API_URL}/revenue`, {
          params: { timeRange, paymentMethod, region }
        });
        return response.data;
      } catch (edgeError) {
        console.log('Edge API failed, falling back to traditional endpoint');
        const response = await reportAxios.get(`${API_URL}/analytics/revenue`, {
          params: { timeRange, paymentMethod, region }
        });
        return response.data;
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu doanh thu:", error);
      return null; // Return null instead of throwing error
    }
  },

  // Top products
  getTopProducts: async () => {
    try {
      // Try the Edge API first
      try {
        const response = await reportAxios.get(`${EDGE_API_URL}/top-products`);
        return response.data;
      } catch (edgeError) {
        console.log('Edge API failed, falling back to traditional endpoint');
        const response = await reportAxios.get(`${API_URL}/analytics/top-products`);
        return response.data;
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu sản phẩm bán chạy:", error);
      return null; // Return null instead of throwing error
    }
  },

  // Inventory reports
  getInventoryData: async () => {
    try {
      // Try the Edge API first
      try {
        const response = await reportAxios.get(`${EDGE_API_URL}/inventory`);
        return response.data;
      } catch (edgeError) {
        console.log('Edge API failed, falling back to traditional endpoint');
        const response = await reportAxios.get(`${API_URL}/products/inventory`);
        return response.data;
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu tồn kho:", error);
      return null; // Return null instead of throwing error
    }
  },

  // User statistics
  getUserData: async () => {
    try {
      // Try the Edge API first
      try {
        const response = await reportAxios.get(`${EDGE_API_URL}/users`);
        return response.data;
      } catch (edgeError) {
        console.log('Edge API failed, falling back to traditional endpoint');
        const response = await reportAxios.get(`${API_URL}/users/stats`);
        return response.data;
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu người dùng:", error);
      return null; // Return null instead of throwing error
    }
  },

  // Order reports
  getOrderData: async (timeRange = 'week') => {
    try {
      // Try the Edge API first
      try {
        const response = await reportAxios.get(`${EDGE_API_URL}/orders`, {
          params: { timeRange }
        });
        return response.data;
      } catch (edgeError) {
        console.log('Edge API failed, falling back to traditional endpoint');
        const response = await reportAxios.get(`${API_URL}/orders/stats`, {
          params: { timeRange }
        });
        return response.data;
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu đơn hàng:", error);
      return null; // Return null instead of throwing error
    }
  },

  // Promotion reports
  getPromotionData: async (timeRange = 'week') => {
    try {
      // Try the Edge API first
      try {
        const response = await reportAxios.get(`${EDGE_API_URL}/promotions`, {
          params: { timeRange }
        });
        return response.data;
      } catch (edgeError) {
        console.log('Edge API failed, falling back to traditional endpoint');
        const response = await reportAxios.get(`${API_URL}/coupons/stats`, {
          params: { timeRange }
        });
        return response.data;
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu khuyến mãi:", error);
      return null; // Return null instead of throwing error
    }
  },

  // System activity reports
  getSystemActivityData: async (timeRange = 'week') => {
    try {
      // Try the Edge API first
      try {
        const response = await reportAxios.get(`${EDGE_API_URL}/system-activity`, {
          params: { timeRange }
        });
        return response.data;
      } catch (edgeError) {
        console.log('Edge API failed, falling back to traditional endpoint');
        const response = await reportAxios.get(`${API_URL}/admin/activity-logs`, {
          params: { timeRange }
        });
        return response.data;
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu hoạt động hệ thống:", error);
      return null; // Return null instead of throwing error
    }
  },

  // Delivery statistics
  getDeliveryData: async (timeRange = 'week') => {
    try {
      // Try the Edge API first
      try {
        const response = await reportAxios.get(`${EDGE_API_URL}/delivery`, {
          params: { timeRange }
        });
        return response.data;
      } catch (edgeError) {
        console.log('Edge API failed, falling back to traditional endpoint');
        const response = await reportAxios.get(`${API_URL}/orders/delivery-stats`, {
          params: { timeRange }
        });
        return response.data;
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu giao hàng:", error);
      return null; // Return null instead of throwing error
    }
  },

  // Feedback statistics
  getFeedbackData: async (timeRange = 'week') => {
    try {
      // Try the Edge API first
      try {
        const response = await reportAxios.get(`${EDGE_API_URL}/feedback`, {
          params: { timeRange }
        });
        return response.data;
      } catch (edgeError) {
        console.log('Edge API failed, falling back to traditional endpoint');
        const response = await reportAxios.get(`${API_URL}/reviews/stats`, {
          params: { timeRange }
        });
        return response.data;
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu phản hồi:", error);
      return null; // Return null instead of throwing error
    }
  }
};

export default reportsApi; 