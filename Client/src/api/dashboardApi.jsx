import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

const API_URL = API_BASE_URL;

// Try multiple endpoints sequentially until one succeeds
const tryEndpoints = async (endpoints) => {
  // Lấy token xác thực
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint, { headers });

      // Kiểm tra cấu trúc dữ liệu trả về
      const data = response.data.data || response.data;

      if (data) {
        return data;
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${endpoint}:`, error.message);
    }
  }
  throw new Error("All endpoints failed");
};

const dashboardApi = {
  // Fetch dashboard statistics
  getDashboardStats: async () => {
    try {
      // Lấy token xác thực
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      console.log("Đang lấy dữ liệu dashboard từ API...");
      
      const endpoints = [
        `${API_URL}/api/reports/dashboard`,
        `${API_URL}/api/dashboard`,
        `${API_URL}/admin/dashboard`,
      ];

      // Thử lần lượt các endpoint
      for (const endpoint of endpoints) {
        try {
          console.log(`Đang thử endpoint: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          console.log(`Kết quả từ ${endpoint}:`, response.status, response.data);
          
          let data;
          if (response.data && response.data.data) {
            data = response.data.data;
          } else {
            data = response.data;
          }

          if (data && typeof data === "object") {
            console.log("Dữ liệu hợp lệ nhận được:", data);
            return data;
          } else {
            console.warn(`Dữ liệu không hợp lệ từ ${endpoint}:`, data);
          }
        } catch (endpointError) {
          console.warn(
            `Không thể lấy dữ liệu từ ${endpoint}:`,
            endpointError.message
          );
        }
      }

      console.error("Tất cả các endpoint đều thất bại");
      throw new Error("Không thể kết nối đến máy chủ dữ liệu");
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu dashboard:", error);
      throw error;
    }
  },

  // Fetch basic statistics with fallback to dashboard stats
  getBasicStats: async () => {
    try {
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_URL}/api/dashboard/basic-stats`, {
        headers,
      });
      return response.data;
    } catch {
      const dashboardData = await dashboardApi.getDashboardStats();
      return {
        totalRevenue: dashboardData.totalRevenue || dashboardData.revenue || 0,
        totalOrders: dashboardData.totalOrders || dashboardData.orders || 0,
        totalProducts:
          dashboardData.totalProducts || dashboardData.products || 0,
        totalCustomers:
          dashboardData.totalCustomers || dashboardData.customers || 0,
      };
    }
  },

  getCompleteDashboardData: async () => {
    try {
      console.log("Đang lấy dữ liệu dashboard đầy đủ...");
      const dashboardStats = await dashboardApi.getDashboardStats();
      console.log("Dữ liệu nhận được từ getDashboardStats:", dashboardStats);

      if (!dashboardStats || typeof dashboardStats !== 'object') {
        console.error("Dữ liệu không hợp lệ từ getDashboardStats");
        throw new Error("Không thể kết nối đến cơ sở dữ liệu");
      }

      let totalRevenue =
        dashboardStats.totalRevenue ||
        dashboardStats.revenue ||
        dashboardStats.total_revenue ||
        dashboardStats.totalSales ||
        0;
      
      console.log("Doanh thu ban đầu:", totalRevenue);

      let totalCustomers = 
        dashboardStats.totalCustomers ||
        dashboardStats.customers ||
        0;
      
      console.log("Số khách hàng ban đầu:", totalCustomers);

      // Nếu doanh thu vẫn là 0, thử tính tổng từ dữ liệu doanh thu 7 ngày
      if (totalRevenue === 0) {
        try {
          console.log("Doanh thu = 0, đang thử lấy từ dữ liệu biểu đồ...");
          const revenueData = await dashboardApi.getRevenueData("week");
          console.log("Dữ liệu doanh thu nhận được:", revenueData);
          
          if (revenueData && Array.isArray(revenueData) && revenueData.length > 0) {
            // Tính tổng doanh thu từ dữ liệu biểu đồ
            const calculatedRevenue = revenueData.reduce((sum, item) => {
              const revenue = item.doanh_thu || item.revenue || 0;
              return sum + revenue;
            }, 0);

            console.log("Doanh thu tính toán từ biểu đồ:", calculatedRevenue);

            if (calculatedRevenue > 0) {
              totalRevenue = calculatedRevenue;
            }
          }
        } catch (revenueError) {
          console.error(
            "Lỗi khi tính toán doanh thu từ dữ liệu biểu đồ:",
            revenueError
          );
        }
      }

      // If totalCustomers is still 0, try to get it directly
      if (totalCustomers === 0) {
        try {
          console.log("Số khách hàng = 0, đang thử lấy trực tiếp...");
          const customerCount = await dashboardApi.getCustomerCount();
          console.log("Số khách hàng nhận được:", customerCount);
          
          if (customerCount > 0) {
            totalCustomers = customerCount;
          }
        } catch (customerError) {
          console.error("Lỗi khi lấy số lượng khách hàng:", customerError);
        }
      }

      const result = {
        totalRevenue: totalRevenue || 0,
        totalOrders: dashboardStats.totalOrders || dashboardStats.orders || 0,
        totalProducts:
          dashboardStats.totalProducts || dashboardStats.products || 0,
        totalCustomers: totalCustomers || 0,
        recentActivities: dashboardStats.recentActivities || [],
      };
      
      console.log("Kết quả cuối cùng:", result);
      return result;
    } catch (error) {
      console.error("Lỗi trong getCompleteDashboardData:", error);
      throw new Error("Không thể kết nối đến cơ sở dữ liệu. Vui lòng kiểm tra kết nối của bạn và thử lại sau.");
    }
  },

  // Fetch revenue data for a given time range
  getRevenueData: async (timeRange = "week") => {
    try {
      // Lấy token xác thực
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const endpoints = [
        `${API_URL}/api/reports/revenue?timeRange=${timeRange}`,
        `${API_URL}/api/analytics/revenue?timeRange=${timeRange}`,
        `${API_URL}/admin/reports/revenue?timeRange=${timeRange}`,
      ];

      // Thử lần lượt các endpoint
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, { headers });
          const data = response.data.data || response.data;
          if (data && (Array.isArray(data) || typeof data === "object")) {
            return data;
          }
        } catch (endpointError) {
          console.warn(
            `Failed to fetch from ${endpoint}:`,
            endpointError.message
          );
        }
      }

      throw new Error("All endpoints failed");
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      throw error;
    }
  },

  // Fetch top-selling products
  getTopProducts: async (limit = 5) => {
    try {
      // Lấy token xác thực
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const endpoints = [
        `${API_URL}/api/reports/top-products?limit=${limit}`,
        `${API_URL}/api/analytics/top-products?limit=${limit}`,
        `${API_URL}/api/best-selling-products?limit=${limit}`,
        `${API_URL}/api/top-products?limit=${limit}`,
      ];
      
      // Thử lần lượt các endpoint
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, { headers });

          const data = response.data.data || response.data;

          if (Array.isArray(data) && data.length > 0) {
            return data
              .map((product) => ({
                name: product.name || product.productName || "Không xác định",
                category: product.category || "Không phân loại",
                sold:
                  product.sold || product.soldCount || product.quantity || 0,
                revenue: product.revenue || product.totalRevenue || 0,
                image: product.image || product.productImage || "",
              }))
              .slice(0, limit);
          }
        } catch (endpointError) {
          console.warn(
            `Failed to fetch from ${endpoint}:`,
            endpointError.message
          );
        }
      }

      // Nếu không có API nào trả về dữ liệu, thử lấy từ API sản phẩm
      try {
        const response = await axios.get(`${API_URL}/api/products`, {
          headers,
        });

        if (
          response.data &&
          Array.isArray(response.data.products || response.data) &&
          (response.data.products || response.data).length > 0
        ) {
          // Không tạo dữ liệu mẫu nữa, trả về mảng rỗng
          return [];
        }
      } catch (productsError) {
        console.error(`Product API fallback failed: ${productsError.message}`);
      }

      return [];
    } catch (error) {
      console.error("Error in getTopProducts:", error);
      return [];
    }
  },

  // Fetch products with low stock
  getLowStockProducts: async (limit = 5, threshold = 20) => {
    try {
      // Lấy token xác thực
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const endpoints = [
        `${API_URL}/api/reports/inventory?limit=${limit}&threshold=${threshold}`,
        `${API_URL}/api/products/low-stock?limit=${limit}`,
        `${API_URL}/api/products/inventory?limit=${limit}`,
      ];

      // Thử lần lượt các endpoint
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, { headers });

          // Check for different response formats
          let data = null;
          
          if (response.data && response.data.data && Array.isArray(response.data.data)) {
            data = response.data.data;
          } else if (response.data && Array.isArray(response.data)) {
            data = response.data;
          }

          if (data && data.length > 0) {
            return data.map((product) => ({
              id: product.id || product._id || Math.random().toString(36).substring(7),
              name: product.name || product.productName || "Không xác định",
              category: product.category || product.categoryName || "Không phân loại",
              stock: product.stock || product.inventory || product.quantity || 0,
              status: product.status || ((product.stock || product.inventory || product.quantity || 0) <= 5 ? "Sắp hết" : "Còn hàng"),
              image: product.image || product.productImage || "",
              sku: product.sku || product.productSku || product.productCode || "",
              price: product.price || product.productPrice || 0,
            }));
          }
        } catch (endpointError) {
          console.warn(
            `Failed to fetch from ${endpoint}:`,
            endpointError.message
          );
        }
      }

      // Sử dụng API sản phẩm thông thường và lọc các sản phẩm có tồn kho thấp
      try {
        const response = await axios.get(`${API_URL}/api/products`, {
          headers,
        });

        if (
          response.data &&
          Array.isArray(response.data.products || response.data) &&
          (response.data.products || response.data).length > 0
        ) {
          const products = response.data.products || response.data;

          const lowStockProducts = products
            .filter((product) => {
              const stock = product.stock || product.productStock || product.quantity || 0;
              return typeof stock === "number" && stock <= threshold;
            })
            .sort(
              (a, b) =>
                (a.stock || a.productStock || a.quantity || 0) -
                (b.stock || b.productStock || b.quantity || 0)
            );

          if (lowStockProducts.length > 0) {
            return lowStockProducts
              .map((product) => ({
                id: product.id || product._id || Math.random().toString(36).substring(7),
                name: product.name || product.productName || "Sản phẩm",
                category:
                  product.category ||
                  product.productCategory ||
                  "Không phân loại",
                stock:
                  product.stock ||
                  product.productStock ||
                  product.quantity ||
                  0,
                status:
                  (product.stock || product.productStock || product.quantity || 0) <= 5
                    ? "Sắp hết"
                    : "Còn hàng",
                image: product.image || product.productImage || "",
              }))
              .slice(0, limit);
          }
        }
      } catch (productsError) {
        console.error(
          `Product API fallback failed for low stock: ${productsError.message}`
        );
      }
      
      // Trả về mảng rỗng nếu không có dữ liệu
      return [];
    } catch (error) {
      console.error("Error in getLowStockProducts:", error);
      // Trả về mảng rỗng nếu xảy ra lỗi
      return [];
    }
  },

  // Fetch order statistics
  getOrderStats: async () => {
    try {
      const endpoints = [
        `${API_URL}/admin/orders/stats`,
        `${API_URL}/api/orders/stats`,
      ];
      return await tryEndpoints(endpoints);
    } catch (error) {
      console.error("Error fetching order stats:", error);
      return { totalOrders: 0, totalRevenue: 0 };
    }
  },

  // Fetch product count
  getProductCount: async () => {
    try {
      const endpoints = [
        `${API_URL}/admin/products/count`,
        `${API_URL}/api/products/count`,
      ];
      const data = await tryEndpoints(endpoints);
      return data.count || data.totalProducts || 0;
    } catch {
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_URL}/api/products`, { headers });
      return response.data?.products?.length || 0;
    }
  },

  // Fetch customer count
  getCustomerCount: async () => {
    try {
      const endpoints = [
        `${API_URL}/admin/users/count`,
        `${API_URL}/api/users/count`,
      ];
      
      // Thử lần lượt các endpoint
      for (const endpoint of endpoints) {
        try {
          console.log(`Đang thử lấy số lượng khách hàng từ: ${endpoint}`);
          const token =
            localStorage.getItem("accessToken") || localStorage.getItem("token");
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          
          const response = await axios.get(endpoint, { headers });
          console.log(`Kết quả từ ${endpoint}:`, response.data);
          
          const data = response.data;
          if (data && (data.count || data.totalCustomers)) {
            const count = data.count || data.totalCustomers || 0;
            console.log(`Số lượng khách hàng nhận được: ${count}`);
            return count;
          }
        } catch (error) {
          console.warn(`Không thể lấy số lượng khách hàng từ ${endpoint}:`, error.message);
        }
      }
      
      // Nếu không thể lấy từ API, thử lấy từ API users
      try {
        const token =
          localStorage.getItem("accessToken") || localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        console.log("Đang thử lấy danh sách người dùng để đếm...");
        const response = await axios.get(`${API_URL}/api/users`, { headers });
        
        if (response.data && Array.isArray(response.data.users || response.data)) {
          const users = response.data.users || response.data;
          console.log(`Đếm được ${users.length} người dùng từ danh sách`);
          return users.length;
        }
      } catch (usersError) {
        console.error("Không thể lấy danh sách người dùng:", usersError.message);
      }
      
      console.warn("Không thể lấy số lượng khách hàng từ bất kỳ nguồn nào");
      return 0;
    } catch (error) {
      console.error("Lỗi trong getCustomerCount:", error);
      return 0;
    }
  },

  // Fetch recent activities
  getRecentActivities: async () => {
    try {
      const endpoints = [
        `${API_URL}/admin/activities/recent`,
        `${API_URL}/api/activities/recent`,
        `${API_URL}/api/recent-activities`,
        `${API_URL}/api/system/activities`,
      ];
      
      // Lấy token xác thực
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Thử lấy dữ liệu từ các endpoint
      for (const endpoint of endpoints) {
        try {
          console.log(`Đang thử lấy hoạt động gần đây từ: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          // Kiểm tra cấu trúc dữ liệu trả về
          let data = null;
          if (response.data && response.data.data) {
            data = response.data.data;
          } else if (response.data && Array.isArray(response.data)) {
            data = response.data;
          } else if (response.data && response.data.activities) {
            data = response.data.activities;
          }
          
          if (data && Array.isArray(data) && data.length > 0) {
            console.log(`Lấy được ${data.length} hoạt động gần đây từ ${endpoint}`);
            return data;
          }
        } catch (endpointError) {
          console.warn(`Không thể lấy hoạt động gần đây từ ${endpoint}:`, endpointError.message);
        }
      }
      
      // Nếu không có dữ liệu từ API, trả về mảng rỗng
      console.warn("Không thể lấy hoạt động gần đây từ bất kỳ API nào");
      return [];
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      return [];
    }
  },
};

export default dashboardApi;
