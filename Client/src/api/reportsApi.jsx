import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

// Define API_URL based on API_BASE_URL
const API_URL = API_BASE_URL;

// Hàm để chuẩn hóa định dạng ngày
const formatDateString = (dateString) => {
  if (!dateString) return "N/A";
  
  try {
    // Xử lý ngày ISO
    if (typeof dateString === 'string' && dateString.includes('T') && dateString.includes('Z')) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('vi-VN');
      }
    }
    
    // Xử lý date object
    if (dateString instanceof Date) {
      return dateString.toLocaleDateString('vi-VN');
    }
    
    // Nếu là chuỗi ngày hợp lệ theo định dạng Việt Nam, giữ nguyên
    if (typeof dateString === 'string' && /^\d{1,2}[/.-]\d{1,2}[/.-]\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    // Thử chuyển đổi nếu là dạng khác
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('vi-VN');
    }
    
    return dateString;
  } catch (err) {
    console.warn(`Error formatting date: ${dateString}`, err);
    return dateString;
  }
};

export const reportsApi = {
  // Dashboard related reports
  getDashboardData: async () => {
    try {
      console.log('Fetching dashboard data...');
      const endpoints = [
        `${API_URL}/api/reports/dashboard`,
        `${API_URL}/reports/dashboard`,
        `${API_URL}/api/dashboard/summary`
      ];
      
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch from: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          if (response.data) {
            console.log('Got dashboard data:', response.data);
            return response.data;
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err.message);
        }
      }
      
      console.error('All dashboard data endpoints failed');
      return null;
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      return null;
    }
  },

  // Revenue reports
  getRevenueData: async (timeRange = "week") => {
    try {
      // Thử tất cả các endpoint có thể có
      const endpoints = [
        `${API_URL}/api/reports/revenue?timeRange=${timeRange}`,
        `${API_URL}/reports/revenue?timeRange=${timeRange}`,
        `${API_URL}/api/analytics/revenue?timeRange=${timeRange}`,
        `${API_URL}/api/dashboard/revenue?timeRange=${timeRange}`
      ];
      
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Thử từng endpoint
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch revenue data from: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            console.log(`Successfully fetched revenue data from: ${endpoint}`);
            
            // Chuẩn hóa dữ liệu và đảm bảo định dạng ngày đúng
            const formattedData = response.data.map(item => ({
              date: formatDateString(item.date),
              doanh_thu: item.doanh_thu || item.revenue || item.amount || item.total || 0,
              don_hang: item.don_hang || item.orders || 0
            }));
            
            return formattedData;
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err.message);
        }
      }
      
      // Nếu không có endpoint nào thành công, thử kết nối trực tiếp với bảng Orders trong MongoDB
      try {
        console.log('Trying direct DB connection via API endpoint...');
        const dbEndpoint = `${API_URL}/api/orders/stats?timeRange=${timeRange}`;
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const response = await axios.get(dbEndpoint, { headers });
        
        if (response.data) {
          // Chuyển đổi dữ liệu thống kê đơn hàng sang định dạng doanh thu
          console.log('Got order stats, converting to revenue format');
          
          // Kiểm tra cấu trúc dữ liệu và xử lý phù hợp
          if (Array.isArray(response.data)) {
            return response.data.map(item => ({
              date: formatDateString(item.date || item.ngay || new Date(item.timestamp)),
              doanh_thu: item.doanh_thu || item.revenue || item.amount || item.total || 0,
              don_hang: item.don_hang || item.orders || 0
            }));
          } else if (response.data.data && Array.isArray(response.data.data)) {
            return response.data.data.map(item => ({
              date: formatDateString(item.date || item.ngay || new Date(item.timestamp)),
              doanh_thu: item.doanh_thu || item.revenue || item.amount || item.total || 0,
              don_hang: item.don_hang || item.orders || 0
            }));
          } else if (response.data.orders && Array.isArray(response.data.orders)) {
            // Nhóm đơn hàng theo ngày và tính tổng doanh thu
            const ordersByDate = {};
            
            response.data.orders.forEach(order => {
              const orderDate = new Date(order.createdAt || order.created_at || order.timestamp);
              const dateStr = orderDate.toLocaleDateString('vi-VN');
              
              if (!ordersByDate[dateStr]) {
                ordersByDate[dateStr] = { 
                  revenue: 0, 
                  count: 0 
                };
              }
              
              ordersByDate[dateStr].revenue += order.totalAmount || order.total || order.amount || 0;
              ordersByDate[dateStr].count += 1;
            });
            
            // Chuyển đổi thành mảng
            return Object.keys(ordersByDate).map(date => ({
              date: formatDateString(date),
              doanh_thu: ordersByDate[date].revenue,
              don_hang: ordersByDate[date].count
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to get data from DB API:', err.message);
      }
      
      console.error('All revenue data endpoints failed');
      return null;
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      return null;
    }
  },

  // Top products
  getTopProducts: async () => {
    try {
      console.log('Fetching top products data...');
      const endpoints = [
        `${API_URL}/api/reports/top-products`,
        `${API_URL}/reports/top-products`, 
        `${API_URL}/api/analytics/top-products`,
        `${API_URL}/api/products/top-selling`
      ];
      
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Thử từng endpoint
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch from: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          if (response.data && 
             (Array.isArray(response.data) || 
              (response.data.products && Array.isArray(response.data.products)) ||
              (response.data.data && Array.isArray(response.data.data)))) {
            
            let productData = Array.isArray(response.data) ? 
                             response.data : 
                             (response.data.products || response.data.data);
            
            // Kiểm tra xem có dữ liệu không
            if (productData && productData.length > 0) {
              console.log('Got top products data:', productData);
              
              // Chuẩn hóa dữ liệu
              return productData.map(product => ({
                name: product.name || product.productName || 'Không xác định',
                category: product.category || product.categoryName || 'Không phân loại',
                sold: product.sold || product.quantity || product.totalSold || 0,
                revenue: product.revenue || product.totalRevenue || product.amount || (product.price * product.sold) || 0,
                sku: product.sku || product.productSku || '',
                price: product.price || 0,
                stock: product.stock || product.currentStock || 0
              }));
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err.message);
        }
      }
      
      console.error('All top products endpoints failed');
      return null;
    } catch (err) {
      console.error('Error fetching top products data:', err);
      return null;
    }
  },

  // Inventory reports
  getInventoryData: async () => {
    try {
      console.log('Fetching inventory data...');
      const endpoints = [
        `${API_URL}/api/products/inventory`,
        `${API_URL}/reports/inventory`,
        `${API_URL}/api/inventory`
      ];
      
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch from: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          if (response.data) {
            console.log('Got inventory data:', response.data);
            return response.data;
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err.message);
        }
      }
      
      // Try to get all products and convert to inventory data
      try {
        console.log('Trying to fetch all products...');
        const response = await axios.get(`${API_URL}/api/products`, { headers });
        
        // Check if response.data and response.data.products exist before using them
        if (response.data && response.data.products && Array.isArray(response.data.products)) {
          console.log('Converting products to inventory data');
          // Convert products to inventory format
          return response.data.products
            .filter((product) => product.quantity < 20)
            .map((product) => ({
              name: product.name,
              category: product.category,
              stock: product.quantity,
              status: product.quantity <= 5 ? "Sắp hết" : "Còn hàng",
            }))
            .sort((a, b) => a.stock - b.stock);
        }
      } catch (err) {
        console.warn('Failed to fetch products:', err.message);
      }
      
      console.error('All inventory endpoints failed');
      return null;
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      return null;
    }
  },

  // User statistics
  getUserData: async () => {
    try {
      console.log('Fetching user data...');
      const endpoints = [
        `${API_URL}/api/reports/users`,
        `${API_URL}/reports/users`,
        `${API_URL}/api/users/stats`
      ];
      
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch from: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          if (response.data) {
            console.log('Got user data:', response.data);
            return response.data;
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err.message);
        }
      }
      
      console.error('All user data endpoints failed');
      return null;
    } catch (err) {
      console.error('Error fetching user data:', err);
      return null;
    }
  },

  // Order reports
  getOrderData: async () => {
    try {
      console.log('Fetching order data...');
      const endpoints = [
        `${API_URL}/api/reports/orders`,
        `${API_URL}/reports/orders`,
        `${API_URL}/api/orders/stats`
      ];
      
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch from: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          if (response.data) {
            console.log('Got order data:', response.data);
            return response.data;
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err.message);
        }
      }
      
      console.error('All order data endpoints failed');
      return null;
    } catch (err) {
      console.error('Error fetching order data:', err);
      return null;
    }
  },

  // Promotion reports
  getPromotionData: async () => {
    try {
      console.log('Fetching promotion data...');
      const endpoints = [
        `${API_URL}/api/reports/promotions`,
        `${API_URL}/reports/promotions`,
        `${API_URL}/api/promotions/stats`
      ];
      
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch from: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          if (response.data) {
            console.log('Got promotion data:', response.data);
            return response.data;
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err.message);
        }
      }
      
      console.error('All promotion data endpoints failed');
      return null;
    } catch (err) {
      console.error('Error fetching promotion data:', err);
      return null;
    }
  },

  // System activity reports
  getSystemActivityData: async (timeRange = "week") => {
    try {
      console.log('Fetching system activity data...');
      const endpoints = [
        `${API_URL}/api/reports/system-activity?timeRange=${timeRange}`,
        `${API_URL}/reports/system-activity?timeRange=${timeRange}`,
        `${API_URL}/api/system/activity?timeRange=${timeRange}`
      ];
      
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch from: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          if (response.data) {
            console.log('Got system activity data:', response.data);
            return response.data;
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err.message);
        }
      }
      
      console.error('All system activity endpoints failed');
      return null;
    } catch (err) {
      console.error('Error fetching system activity data:', err);
      return null;
    }
  },

  // Delivery statistics
  getDeliveryData: async (timeRange = "week") => {
    try {
      console.log('Fetching delivery data...');
      const endpoints = [
        `${API_URL}/api/reports/delivery?timeRange=${timeRange}`,
        `${API_URL}/reports/delivery?timeRange=${timeRange}`,
        `${API_URL}/api/delivery/stats?timeRange=${timeRange}`
      ];
      
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch from: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          if (response.data) {
            console.log('Got delivery data:', response.data);
            return response.data;
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err.message);
        }
      }
      
      console.error('All delivery data endpoints failed');
      return null;
    } catch (err) {
      console.error('Error fetching delivery data:', err);
      return null;
    }
  },

  // Feedback statistics
  getFeedbackData: async () => {
    try {
      console.log('Fetching feedback data...');
      const endpoints = [
        `${API_URL}/api/reports/feedback`,
        `${API_URL}/reports/feedback`,
        `${API_URL}/api/feedback/stats`
      ];
      
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch from: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          if (response.data) {
            console.log('Got feedback data:', response.data);
            return response.data;
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err.message);
        }
      }
      
      console.error('All feedback data endpoints failed');
      return null;
    } catch (err) {
      console.error('Error fetching feedback data:', err);
      return null;
    }
  },
};
