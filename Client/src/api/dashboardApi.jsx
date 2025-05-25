import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

const API_URL = API_BASE_URL;

// Utility to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Try multiple endpoints sequentially until one succeeds
const tryEndpoints = async (endpoints) => {
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint, { headers: getAuthHeaders() });
      return response.data;
    } catch (error) {
      console.warn(`Failed to fetch from ${endpoint}:`, error.message);
    }
  }
  throw new Error('All endpoints failed');
};

const dashboardApi = {
  // Fetch dashboard statistics
  getDashboardStats: async () => {
    try {
      const endpoints = [
        `${API_URL}/admin/dashboard`,
        `${API_URL}/api/dashboard`,
        `${API_URL}/api/reports/dashboard`
      ];
      return await tryEndpoints(endpoints);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Fetch basic statistics with fallback to dashboard stats
  getBasicStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/dashboard/basic-stats`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch {
      const dashboardData = await dashboardApi.getDashboardStats();
      return {
        totalRevenue: dashboardData.totalRevenue || dashboardData.revenue || 0,
        totalOrders: dashboardData.totalOrders || dashboardData.orders || 0,
        totalProducts: dashboardData.totalProducts || dashboardData.products || 0,
        totalCustomers: dashboardData.totalCustomers || dashboardData.customers || 0
      };
    }
  },

  // Fetch complete dashboard data with fallback to individual stats
  getCompleteDashboardData: async () => {
    try {
      const dashboardStats = await dashboardApi.getDashboardStats();
      return {
        totalRevenue: dashboardStats.totalRevenue || dashboardStats.revenue || 0,
        totalOrders: dashboardStats.totalOrders || dashboardStats.orders || 0,
        totalProducts: dashboardStats.totalProducts || dashboardStats.products || 0,
        totalCustomers: dashboardStats.totalCustomers || dashboardStats.customers || 0,
        recentActivities: dashboardStats.recentActivities || []
      };
    } catch {
      const [orderStats, productCount, customerCount, recentActivities] = await Promise.all([
        dashboardApi.getOrderStats(),
        dashboardApi.getProductCount(),
        dashboardApi.getCustomerCount(),
        dashboardApi.getRecentActivities()
      ]);

      return {
        totalRevenue: orderStats.totalRevenue || 0,
        totalOrders: orderStats.totalOrders || 0,
        totalProducts: productCount,
        totalCustomers: customerCount,
        recentActivities
      };
    }
  },

  // Fetch revenue data for a given time range
  getRevenueData: async (timeRange = 'week') => {
    try {
      const endpoints = [
        `${API_URL}/admin/reports/revenue?timeRange=${timeRange}`,
        `${API_URL}/api/reports/revenue?timeRange=${timeRange}`
      ];
      return await tryEndpoints(endpoints);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      throw error;
    }
  },

  // Fetch top-selling products
  getTopProducts: async (limit = 5) => {
    try {
      const endpoints = [
        `${API_URL}/admin/reports/top-products?limit=${limit}`,
        `${API_URL}/api/reports/top-products?limit=${limit}`
      ];
      return await tryEndpoints(endpoints);
    } catch (error) {
      console.error('Error fetching top products:', error);
      throw error;
    }
  },

  // Fetch low stock products
  getLowStockProducts: async (limit = 5, criticalStock = 20) => {
    try {
      const endpoints = [
        `${API_URL}/api/products/inventory?limit=${limit}`,
        `${API_URL}/api/reports/inventory?limit=${limit}`,
        `${API_URL}/api/products/low-stock?limit=${limit}&criticalStock=${criticalStock}`
      ];

      const data = await tryEndpoints(endpoints);
      if (!Array.isArray(data)) throw new Error('Invalid response format');

      return data
        .filter(product => (product.stock ?? 100) <= criticalStock)
        .sort((a, b) => (a.stock ?? 100) - (b.stock ?? 100))
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      throw error;
    }
  },

  // Fetch order statistics
  getOrderStats: async () => {
    try {
      const endpoints = [
        `${API_URL}/admin/orders/stats`,
        `${API_URL}/api/orders/stats`
      ];
      return await tryEndpoints(endpoints);
    } catch (error) {
      console.error('Error fetching order stats:', error);
      return { totalOrders: 0, totalRevenue: 0 };
    }
  },

  // Fetch product count
  getProductCount: async () => {
    try {
      const endpoints = [
        `${API_URL}/admin/products/count`,
        `${API_URL}/api/products/count`
      ];
      const data = await tryEndpoints(endpoints);
      return data.count || data.totalProducts || 0;
    } catch {
      const response = await axios.get(`${API_URL}/api/products`, {
        headers: getAuthHeaders()
      });
      return response.data?.products?.length || 0;
    }
  },

  // Fetch customer count
  getCustomerCount: async () => {
    try {
      const endpoints = [
        `${API_URL}/admin/users/count`,
        `${API_URL}/api/users/count`
      ];
      const data = await tryEndpoints(endpoints);
      return data.count || data.totalCustomers || 0;
    } catch (error) {
      console.error('Error fetching customer count:', error);
      return 0;
    }
  },

  // Fetch recent activities
  getRecentActivities: async () => {
    try {
      const endpoints = [
        `${API_URL}/admin/activities/recent`,
        `${API_URL}/api/activities/recent`
      ];
      return await tryEndpoints(endpoints);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }
};

export default dashboardApi;