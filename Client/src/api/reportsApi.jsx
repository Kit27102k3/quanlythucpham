import { API_BASE_URL } from '../config/apiConfig';
import apiClient from './axios';
import productsApi from './productsApi';
import orderApi from './orderApi';

// Define API_URL and EDGE_API_URL based on API_BASE_URL
const API_URL = `${API_BASE_URL}/api`;
const EDGE_API_URL = `${API_BASE_URL}/api/reports`;

const reportsApi = {
  // Dashboard related reports
  getDashboardData: async () => {
    try {
      // Try Edge API first
      const response = await apiClient.get(`${EDGE_API_URL}/dashboard`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data from Edge API:', error);
      
      try {
        // Fallback to traditional endpoint
        const fallbackResponse = await apiClient.get(`${API_URL}/dashboard`);
        return fallbackResponse.data;
      } catch (error) {
        console.error('Error fetching dashboard data from fallback API:', error);
        // Return fallback structure
        return {
          totalRevenue: 0,
          totalOrders: 0,
          totalProducts: 0,
          totalCustomers: 0,
          recentActivities: []
        };
      }
    }
  },

  // Revenue reports
  getRevenueData: async (selectedTimeRange = 'week') => {
    try {
      // Try Edge API first
      const response = await apiClient.get(
        `${EDGE_API_URL}/revenue`,
        { params: { timeRange: selectedTimeRange } }
      );
      
      // Ensure the data is formatted correctly for the chart
      const formattedData = response.data.map(item => ({
        date: item.date || item.ngay,
        doanh_thu: parseFloat(item.doanh_thu || item.revenue || 0)
      }));
      
      return formattedData;
    } catch (error) {
      console.error('Error fetching revenue data from Edge API:', error);
      
      try {
        // Fallback to traditional endpoint
        const fallbackResponse = await apiClient.get(
          `${API_URL}/revenue`,
          { params: { timeRange: selectedTimeRange } }
        );
        
        // Ensure the data is formatted correctly for the chart
        const formattedData = fallbackResponse.data.map(item => ({
          date: item.date || item.ngay,
          doanh_thu: parseFloat(item.doanh_thu || item.revenue || 0)
        }));
        
        return formattedData;
      } catch (error) {
        console.error('Error fetching revenue data from fallback API:', error);
        
        // Return fallback data based on time range
        if (selectedTimeRange === 'week') {
          return [
            { date: 'T2', doanh_thu: 500000 },
            { date: 'T3', doanh_thu: 700000 },
            { date: 'T4', doanh_thu: 600000 },
            { date: 'T5', doanh_thu: 800000 },
            { date: 'T6', doanh_thu: 900000 },
            { date: 'T7', doanh_thu: 800000 },
            { date: 'CN', doanh_thu: 600000 }
          ];
        } else if (selectedTimeRange === 'month') {
          // Return mock data for month view
          return Array.from({ length: 30 }, (_, i) => ({
            date: `${i + 1}`,
            doanh_thu: Math.floor(Math.random() * 500000) + 300000
          }));
        } else if (selectedTimeRange === 'year') {
          // Return mock data for year view
          return [
            { date: 'T1', doanh_thu: 5000000 },
            { date: 'T2', doanh_thu: 6000000 },
            { date: 'T3', doanh_thu: 7000000 },
            { date: 'T4', doanh_thu: 8000000 },
            { date: 'T5', doanh_thu: 9000000 },
            { date: 'T6', doanh_thu: 10000000 },
            { date: 'T7', doanh_thu: 11000000 },
            { date: 'T8', doanh_thu: 12000000 },
            { date: 'T9', doanh_thu: 13000000 },
            { date: 'T10', doanh_thu: 12000000 },
            { date: 'T11', doanh_thu: 11000000 },
            { date: 'T12', doanh_thu: 14000000 }
          ];
        }
        
        return [];
      }
    }
  },

  // Top products
  getTopProducts: async (limit = 5) => {
    try {
      // Đổi thứ tự ưu tiên API, thử API /api/analytics/top-products đầu tiên
      const response = await apiClient.get(`${API_URL}/analytics/top-products`);
      
      if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log("Dữ liệu top products từ analytics API:", response.data);
        return response.data;
      }
      
      // Thử lấy từ endpoint sản phẩm bán chạy
      const bestSellingResponse = await apiClient.get(`${API_URL}/products/best-selling?limit=${limit}`);
      
      if (bestSellingResponse?.data && Array.isArray(bestSellingResponse.data) && bestSellingResponse.data.length > 0) {
        console.log("Dữ liệu top products từ best-selling API:", bestSellingResponse.data);
        const formattedData = bestSellingResponse.data.map(product => ({
          name: product.name || product.productName,
          category: product.category?.name || product.productCategory || 'Không phân loại',
          sold: product.sold || 0,
          revenue: product.revenue || (product.sold * (product.price || product.productPrice)) || 0,
          image: product.image || product.thumbnail || product.productImage
        }));
        
        return formattedData;
      }
      
      // Nếu không có kết quả, thử API reports
      const reportsResponse = await apiClient.get(`${EDGE_API_URL}/top-products`, { params: { limit } });
      
      if (reportsResponse?.data && Array.isArray(reportsResponse.data) && reportsResponse.data.length > 0) {
        console.log("Dữ liệu top products từ reports API:", reportsResponse.data);
        return reportsResponse.data;
      }
      
      // Thử API khác nếu các API trên thất bại
      const backupResponse = await productsApi.getBestSellingProducts(limit);
      if (backupResponse && Array.isArray(backupResponse) && backupResponse.length > 0) {
        console.log("Dữ liệu top products từ backup API:", backupResponse);
        const formattedData = backupResponse.map(product => ({
          name: product.name || product.productName,
          category: product.category?.name || product.productCategory || 'Không phân loại',
          sold: product.sold || 0,
          revenue: product.revenue || (product.sold * (product.price || product.productPrice)) || 0,
          image: product.image || product.thumbnail || product.productImage
        }));
        
        return formattedData;
      }
      
      console.error('Không nhận được dữ liệu từ bất kỳ API nào - Trả về mẫu');
      // Dữ liệu mẫu cho top products
      return [
        { name: "Táo xanh Mỹ", category: "Trái cây", sold: 420, revenue: 84000000, image: "/images/products/apple.jpg" },
        { name: "Thịt bò Úc", category: "Thịt tươi", sold: 320, revenue: 75000000, image: "/images/products/beef.jpg" },
        { name: "Sữa tươi tiệt trùng", category: "Sữa", sold: 280, revenue: 42000000, image: "/images/products/milk.jpg" },
        { name: "Gạo ST25", category: "Gạo", sold: 250, revenue: 37500000, image: "/images/products/rice.jpg" },
        { name: "Rau cải xanh", category: "Rau củ", sold: 220, revenue: 15400000, image: "/images/products/vegetables.jpg" }
      ];
    } catch (error) {
      console.error('Error fetching top products:', error);
      // Dữ liệu mẫu khi có lỗi
      return [
        { name: "Táo xanh Mỹ", category: "Trái cây", sold: 420, revenue: 84000000, image: "/images/products/apple.jpg" },
        { name: "Thịt bò Úc", category: "Thịt tươi", sold: 320, revenue: 75000000, image: "/images/products/beef.jpg" },
        { name: "Sữa tươi tiệt trùng", category: "Sữa", sold: 280, revenue: 42000000, image: "/images/products/milk.jpg" },
        { name: "Gạo ST25", category: "Gạo", sold: 250, revenue: 37500000, image: "/images/products/rice.jpg" },
        { name: "Rau cải xanh", category: "Rau củ", sold: 220, revenue: 15400000, image: "/images/products/vegetables.jpg" }
      ];
    }
  },

  // Inventory reports
  getInventoryData: async () => {
    try {
      // Gọi API mới từ productsApi
      try {
        console.log("Gọi phương thức getInventoryData từ productsApi");
        const inventoryData = await productsApi.getInventoryData();
        if (inventoryData && Array.isArray(inventoryData) && inventoryData.length > 0) {
          console.log("Nhận được dữ liệu tồn kho từ productsApi:", inventoryData.length, "sản phẩm");
          return inventoryData;
        }
      } catch (apiError) {
        console.error("Lỗi khi gọi productsApi.getInventoryData:", apiError);
      }

      // Hàm hỗ trợ xác định trạng thái tồn kho
      const getStockStatus = (stock) => {
        if (stock <= 0) return 'Hết hàng';
        if (stock <= 5) return 'Sắp hết';
        if (stock <= 20) return 'Sắp hết';
        return 'Còn hàng';
      };

      // Ưu tiên sử dụng endpoint /api/products/inventory để lấy dữ liệu tồn kho
      const inventoryResponse = await apiClient.get(`${API_URL}/products/inventory`);
      
      if (inventoryResponse?.data && Array.isArray(inventoryResponse.data) && inventoryResponse.data.length > 0) {
        console.log("Dữ liệu inventory từ inventory API:", inventoryResponse.data);
        return inventoryResponse.data;
      }
      
      // Thử lấy từ endpoint reports
      const reportsResponse = await apiClient.get(`${EDGE_API_URL}/inventory`);
      
      if (reportsResponse?.data && Array.isArray(reportsResponse.data) && reportsResponse.data.length > 0) {
        console.log("Dữ liệu inventory từ reports API:", reportsResponse.data);
        return reportsResponse.data;
      }
      
      // Lấy từ products API (lấy tất cả sản phẩm) với định dạng MongoDB
      try {
        const allProducts = await productsApi.getAllProducts();
        
        if (allProducts?.products && Array.isArray(allProducts.products) && allProducts.products.length > 0) {
          console.log("Dữ liệu tồn kho từ productsApi.getAllProducts:", allProducts.products.length, "sản phẩm");
          
          // Chuyển đổi thành định dạng tồn kho dựa trên cấu trúc MongoDB
          const inventoryData = allProducts.products.map(product => ({
            id: product._id || product.id || '',
            name: product.productName || product.name || 'Không xác định',
            stock: product.productsStock || product.productQuantity || product.stock || 0,
            value: (product.productPrice || product.price || 0) * (product.productsStock || product.productQuantity || product.stock || 0),
            status: getStockStatus(product.productsStock || product.productQuantity || product.stock || 0),
            category: product.productCategory || (product.category?.name) || 'Không phân loại',
            price: product.productPrice || product.price || 0,
            sku: product.productCode || product.productSKU || product.sku || '',
            image: product.productImages?.[0] || product.productImage || product.image || product.thumbnail || ''
          }));
          
          return inventoryData;
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu từ productsApi.getAllProducts:', error);
      }
      
      // Thử lấy trực tiếp từ API sản phẩm
      const productsResponse = await apiClient.get(`${API_URL}/products`);
      
      if (productsResponse?.data?.products && Array.isArray(productsResponse.data.products)) {
        console.log("Dữ liệu tồn kho từ products API:", productsResponse.data.products.length, "sản phẩm");
        
        // Chuyển đổi tất cả sản phẩm sang định dạng tồn kho dựa trên cấu trúc MongoDB
        const inventoryData = productsResponse.data.products.map(product => ({
          id: product._id || product.id || '',
          name: product.productName || product.name || 'Không xác định',
          stock: product.productsStock || product.productQuantity || product.stock || 0,
          value: (product.productPrice || product.price || 0) * (product.productsStock || product.productQuantity || product.stock || 0),
          status: getStockStatus(product.productsStock || product.productQuantity || product.stock || 0),
          category: product.productCategory || (product.category?.name) || 'Không phân loại',
          price: product.productPrice || product.price || 0,
          sku: product.productCode || product.productSKU || product.sku || '',
          image: product.productImages?.[0] || product.productImage || product.image || product.thumbnail || ''
        }));
        
        return inventoryData;
      }
      
      // Dữ liệu mẫu tương tự như cấu trúc trong MongoDB
      console.error('Không nhận được dữ liệu từ bất kỳ API nào - Trả về mẫu');
      return [
        { name: "Táo xanh Mỹ", category: "Trái cây", stock: 15, value: 3000000, status: "Sắp hết", price: 200000, sku: "CATTB-001" },
        { name: "Thịt bò Úc", category: "Thịt tươi", stock: 8, value: 4000000, status: "Sắp hết", price: 500000, sku: "THTTB-001" },
        { name: "Sữa tươi nguyên kem", category: "Sữa", stock: 4, value: 800000, status: "Hết hàng", price: 200000, sku: "SUATB-001" },
        { name: "Cà chua Đà Lạt", category: "Rau củ", stock: 12, value: 600000, status: "Sắp hết", price: 50000, sku: "RACTB-001" },
        { name: "Nước mắm Nam Ngư", category: "Gia vị", stock: 6, value: 450000, status: "Sắp hết", price: 75000, sku: "GVTB-001" }
      ];
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      return [
        { name: "Táo xanh Mỹ", category: "Trái cây", stock: 15, value: 3000000, status: "Sắp hết", price: 200000, sku: "CATTB-001" },
        { name: "Thịt bò Úc", category: "Thịt tươi", stock: 8, value: 4000000, status: "Sắp hết", price: 500000, sku: "THTTB-001" },
        { name: "Sữa tươi nguyên kem", category: "Sữa", stock: 4, value: 800000, status: "Hết hàng", price: 200000, sku: "SUATB-001" },
        { name: "Cà chua Đà Lạt", category: "Rau củ", stock: 12, value: 600000, status: "Sắp hết", price: 50000, sku: "RACTB-001" },
        { name: "Nước mắm Nam Ngư", category: "Gia vị", stock: 6, value: 450000, status: "Sắp hết", price: 75000, sku: "GVTB-001" }
      ];
    }
  },

  // User statistics
  getUserData: async () => {
    try {
      const response = await apiClient.get(`${API_URL}/users/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return {
        totalUsers: 8,
        newUsers: 6,
        activeUsers: 2,
        usersByRegion: [
          { region: 'Khác', count: 8 }
        ],
        usersByAge: [
          { range: '18-24', count: 35 },
          { range: '25-34', count: 65 },
          { range: '35-44', count: 40 },
          { range: '45-54', count: 20 },
          { range: '55+', count: 10 }
        ]
      };
    }
  },

  // Order reports
  getOrderData: async (period = 'week') => {
    try {
      console.log("Fetching order statistics for period:", period);
      
      // Try order stats API first (now with our new enhanced endpoint)
      const response = await apiClient.get(`${API_URL}/orders/stats`, { 
        params: { period } 
      });
      
      console.log("Order stats API response:", response.data);
      
      // If we get valid data, especially for orderStatus and processingTime
      if (response.data && 
          Array.isArray(response.data.orderStatus) && 
          response.data.orderStatus.length > 0 &&
          Array.isArray(response.data.processingTime) && 
          response.data.processingTime.length > 0) {
        return response.data;
      }
      
      // If charts data is missing but we have top orders, use that and add mock chart data
      if (response.data && Array.isArray(response.data.topOrders) && response.data.topOrders.length > 0) {
        const mockOrderStatus = [
          { name: 'Đang xử lý', value: 18 },
          { name: 'Đang giao', value: 12 },
          { name: 'Đã giao', value: 45 },
          { name: 'Đã hủy', value: 5 }
        ];
        
        const mockProcessingTime = [
          { name: 'Xác nhận', time: 15 },
          { name: 'Đóng gói', time: 30 },
          { name: 'Vận chuyển', time: 45 }
        ];
        
        return {
          ...response.data,
          orderStatus: response.data.orderStatus || mockOrderStatus,
          processingTime: response.data.processingTime || mockProcessingTime
        };
      }
      
      // If we're missing top orders, try to fetch them separately
      if (response.data && (!response.data.topOrders || response.data.topOrders.length === 0)) {
        try {
          console.log("Fetching top orders separately");
          const topOrders = await orderApi.getTopOrders(10);
          
          if (topOrders && Array.isArray(topOrders) && topOrders.length > 0) {
            console.log("Successfully fetched top orders:", topOrders.length);
            return {
              ...response.data,
              topOrders
            };
          }
        } catch (topOrdersError) {
          console.error('Error fetching top orders:', topOrdersError);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching order data:', error);
      
      // Try to get real top orders even if stats API fails
      try {
        console.log("Trying to fetch top orders as fallback");
        const topOrders = await orderApi.getTopOrders(10);
        
        if (topOrders && Array.isArray(topOrders) && topOrders.length > 0) {
          console.log("Successfully fetched top orders as fallback:", topOrders.length);
          
          // Mock data for order status
          const mockOrderStatus = [
            { name: 'Đang xử lý', value: 18 },
            { name: 'Đang giao', value: 12 },
            { name: 'Đã giao', value: 45 },
            { name: 'Đã hủy', value: 5 }
          ];
          
          // Mock data for processing time
          const mockProcessingTime = [
            { name: 'Xác nhận', time: 15 },
            { name: 'Đóng gói', time: 30 },
            { name: 'Vận chuyển', time: 45 }
          ];
          
          return {
            totalOrders: mockOrderStatus.reduce((sum, item) => sum + item.value, 0),
            pendingOrders: mockOrderStatus.find(item => item.name === 'Đang xử lý')?.value || 0,
            completedOrders: mockOrderStatus.find(item => item.name === 'Đã giao')?.value || 0,
            cancelledOrders: mockOrderStatus.find(item => item.name === 'Đã hủy')?.value || 0,
            orderStatus: mockOrderStatus,
            processingTime: mockProcessingTime,
            topOrders
          };
        }
      } catch (topOrdersError) {
        console.error('Error fetching top orders as fallback:', topOrdersError);
      }
      
      // Default mock data if everything fails
      console.log("Using mock data as final fallback");
      
      // Mock data for order status
      const mockOrderStatus = [
        { name: 'Đang xử lý', value: 18 },
        { name: 'Đang giao', value: 12 },
        { name: 'Đã giao', value: 45 },
        { name: 'Đã hủy', value: 5 }
      ];
      
      // Mock data for processing time
      const mockProcessingTime = [
        { name: 'Xác nhận', time: 15 },
        { name: 'Đóng gói', time: 30 },
        { name: 'Vận chuyển', time: 45 }
      ];
      
      // Mock data for top orders
      const mockTopOrders = [
        { id: 'DH-00123', customer: 'Nguyễn Văn A', total: 5800000, status: 'Đã giao', date: '18/05/2023' },
        { id: 'DH-00145', customer: 'Trần Thị B', total: 4200000, status: 'Đang giao', date: '19/05/2023' },
        { id: 'DH-00167', customer: 'Lê Văn C', total: 3900000, status: 'Đã giao', date: '17/05/2023' },
        { id: 'DH-00189', customer: 'Phạm Thị D', total: 3500000, status: 'Đang xử lý', date: '20/05/2023' },
        { id: 'DH-00201', customer: 'Hoàng Văn E', total: 3200000, status: 'Đã giao', date: '16/05/2023' },
        { id: 'DH-00212', customer: 'Vũ Thị F', total: 2800000, status: 'Đã giao', date: '15/05/2023' },
        { id: 'DH-00234', customer: 'Đặng Văn G', total: 2500000, status: 'Đang giao', date: '19/05/2023' },
        { id: 'DH-00256', customer: 'Bùi Thị H', total: 2300000, status: 'Đã giao', date: '14/05/2023' },
        { id: 'DH-00278', customer: 'Ngô Văn I', total: 2100000, status: 'Đã giao', date: '13/05/2023' },
        { id: 'DH-00290', customer: 'Mai Thị K', total: 2000000, status: 'Đã giao', date: '12/05/2023' }
      ];
      
      return {
        totalOrders: mockOrderStatus.reduce((sum, item) => sum + item.value, 0),
        pendingOrders: mockOrderStatus.find(item => item.name === 'Đang xử lý')?.value || 0,
        completedOrders: mockOrderStatus.find(item => item.name === 'Đã giao')?.value || 0,
        cancelledOrders: mockOrderStatus.find(item => item.name === 'Đã hủy')?.value || 0,
        orderStatus: mockOrderStatus,
        processingTime: mockProcessingTime,
        topOrders: mockTopOrders
      };
    }
  },

  // Promotion reports
  getPromotionData: async () => {
    try {
      console.log("Fetching promotion statistics");
      
      // Try the coupon stats API
      const response = await apiClient.get(`${API_URL}/coupons/stats`);
      
      if (response.data && response.data.success) {
        console.log("Coupon stats API response:", response.data);
        return response.data.data;
      } else {
        console.warn("Coupon stats API returned unexpected format:", response.data);
        throw new Error("Unexpected data format");
      }
    } catch (error) {
      console.error('Error fetching promotion data:', error);
      
      // Create mock coupon codes for consistency across charts
      const mockCodes = ["WELCOME10", "SUMMER20", "HOLIDAY15", "FRESH25", "FREESHIP"];
      
      // Fallback mock data
      return {
        totalCoupons: 5,
        activeCoupons: 3,
        totalUsedCount: 152,
        typeStats: {
          percentage: {
            count: 3,
            used: 112,
            totalValue: 2250,
            estimatedRevenue: 8400000
          },
          fixed: {
            count: 2,
            used: 40,
            totalValue: 1000000,
            estimatedRevenue: 2600000
          }
        },
        voucherUsage: [
          { code: mockCodes[0], discount: "10%", used: 45, limit: 100, revenue: 1200000, description: "Chào mừng khách hàng mới" },
          { code: mockCodes[1], discount: "20%", used: 37, limit: 50, revenue: 2500000, description: "Khuyến mãi mùa hè" },
          { code: mockCodes[2], discount: "15%", used: 30, limit: 50, revenue: 1850000, description: "Giảm giá dịp lễ" },
          { code: mockCodes[3], discount: "25%", used: 22, limit: 30, revenue: 1620000, description: "Giảm giá rau củ tươi" },
          { code: mockCodes[4], discount: "25.000 ₫", used: 18, limit: 30, revenue: 450000, description: "Miễn phí vận chuyển" }
        ],
        usageOverTime: [
          { month: "Tháng 12", "Phần trăm": 15, "Cố định": 8 },
          { month: "Tháng 1", "Phần trăm": 22, "Cố định": 12 },
          { month: "Tháng 2", "Phần trăm": 18, "Cố định": 10 },
          { month: "Tháng 3", "Phần trăm": 25, "Cố định": 14 },
          { month: "Tháng 4", "Phần trăm": 30, "Cố định": 16 },
          { month: "Tháng 5", "Phần trăm": 20, "Cố định": 12 }
        ],
        revenueComparison: [
          { month: "Tháng 12", "Doanh thu thực tế": 45000000, "Doanh thu không có khuyến mãi": 50000000, "Tổng giảm giá": 5000000 },
          { month: "Tháng 1", "Doanh thu thực tế": 52000000, "Doanh thu không có khuyến mãi": 60000000, "Tổng giảm giá": 8000000 },
          { month: "Tháng 2", "Doanh thu thực tế": 48000000, "Doanh thu không có khuyến mãi": 55000000, "Tổng giảm giá": 7000000 },
          { month: "Tháng 3", "Doanh thu thực tế": 56000000, "Doanh thu không có khuyến mãi": 65000000, "Tổng giảm giá": 9000000 },
          { month: "Tháng 4", "Doanh thu thực tế": 60000000, "Doanh thu không có khuyến mãi": 70000000, "Tổng giảm giá": 10000000 },
          { month: "Tháng 5", "Doanh thu thực tế": 54000000, "Doanh thu không có khuyến mãi": 62000000, "Tổng giảm giá": 8000000 }
        ],
        promotionEffectiveness: [
          { name: mockCodes[0], 'Rau': 450000, 'Thịt & Hải sản': 850000, 'Trứng & Sữa': 320000 },
          { name: mockCodes[1], 'Rau': 780000, 'Thịt & Hải sản': 1200000, 'Trứng & Sữa': 540000 },
          { name: mockCodes[2], 'Rau': 620000, 'Thịt & Hải sản': 950000, 'Trứng & Sữa': 430000 }
        ],
        conversionRate: [
          { name: mockCodes[0], rate: 68 },
          { name: mockCodes[1], rate: 85 },
          { name: mockCodes[2], rate: 72 },
          { name: mockCodes[3], rate: 59 },
          { name: mockCodes[4], rate: 91 }
        ]
      };
    }
  },

  // System activity reports
  getSystemActivityData: async () => {
    try {
      // Thử endpoint mới đầu tiên
      try {
        console.log("Thử endpoint thống kê hệ thống mới");
        const response = await apiClient.get(`${API_URL}/system/stats`);
        
        if (response.data && response.data.success) {
          console.log("FULL DATA:", JSON.stringify(response.data));
          
          // Chuyển đổi dữ liệu thành định dạng phù hợp với component
          const activityData = response.data.data;
          console.log("Activity Data:", activityData);
          
          // Tạo mảng hoạt động theo thời gian (không có dữ liệu thực, để trống)
          const activityOverTime = [];
          
          // Tạo mảng nhật ký hoạt động (không có dữ liệu thực, để trống)
          const activityLog = [];
          
          const result = {
            successLogins: activityData.successLogin || 0,
            failedLogins: activityData.failedLogin || 0,
            dataUpdates: activityData.dataUpdates || 0,
            errors: activityData.errorCount || 0,
            totalUsers: activityData.userCount || 0,
            totalProducts: activityData.productCount || 0,
            totalOrders: activityData.orderCount || 0,
            activityOverTime,
            activityLog
          };
          
          console.log("Final result of system stats:", result);
          return result;
        }
      } catch (newApiError) {
        console.warn("Lỗi khi gọi API thống kê hệ thống mới:", newApiError);
      }
      
      // Thử endpoint cũ
      try {
        console.log("Thử endpoint thống kê hệ thống cũ");
        const fallbackResponse = await apiClient.get(`${API_URL}/admin/activity-logs`);
        
        if (fallbackResponse.data) {
          console.log("Nhận được dữ liệu từ API cũ:", fallbackResponse.data);
          return fallbackResponse.data;
        }
      } catch (oldApiError) {
        console.warn("Lỗi khi gọi API thống kê hệ thống cũ:", oldApiError);
      }
      
      console.warn("Không có dữ liệu hoạt động hệ thống từ API");
      
      // Trả về object rỗng nếu không có dữ liệu từ API
      return {
        successLogins: 0,
        failedLogins: 0,
        dataUpdates: 0,
        errors: 0,
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        activityOverTime: [],
        activityLog: []
      };
    } catch (error) {
      console.error('Error fetching system activity data:', error);
      
      // Trả về object rỗng nếu có lỗi
      return {
        successLogins: 0,
        failedLogins: 0,
        dataUpdates: 0,
        errors: 0,
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        activityOverTime: [],
        activityLog: []
      };
    }
  },

  // Delivery statistics
  getDeliveryData: async (period = 'week') => {
    try {
      // Thử gọi API từ orderApi trước
      try {
        const orderApiModule = await import('./orderApi');
        const orderApi = orderApiModule.default;
        
        if (orderApi && typeof orderApi.getDeliveryStats === 'function') {
          const deliveryStats = await orderApi.getDeliveryStats(period);
          
          if (deliveryStats && deliveryStats.statistics) {
            return deliveryStats;
          }
        }
      } catch (_) {
        // Silent fail, continue to next approach
      }
      
      // Thử API thống kê giao hàng cũ
      const response = await apiClient.get(`${API_URL}/orders/delivery-stats`, {
        params: { period }
      });
      
      if (response.data) {
        return response.data;
      }
      
      throw new Error("No valid data returned from delivery API");
    } catch (_) {
      // Trả về dữ liệu mẫu
      return {
        statistics: {
          completed: 45,
          inProgress: 12,
          delayed: 3,
          total: 60,
          avgDeliveryTime: "24.5 giờ"
        },
        deliveryPartners: [
          { name: 'Giao Hàng Nhanh', value: 45 },
          { name: 'Viettel Post', value: 9 },
          { name: 'Grab', value: 4 },
          { name: 'Khác', value: 2 }
        ],
        deliveryTimeByRegion: [
          { region: 'Tp.HCM', time: 12 },
          { region: 'Hà Nội', time: 24 },
          { region: 'Đà Nẵng', time: 36 },
          { region: 'Cần Thơ', time: 48 },
          { region: 'Tỉnh khác', time: 72 }
        ],
        deliveries: [
          { orderId: 'DH001', customerName: 'Nguyễn Văn A', address: 'Quận 1, Tp.HCM', partner: 'Giao Hàng Nhanh', deliveryTime: '20/5/2023', status: 'Hoàn thành' },
          { orderId: 'DH002', customerName: 'Trần Thị B', address: 'Quận 7, Tp.HCM', partner: 'Giao Hàng Nhanh', deliveryTime: '20/5/2023', status: 'Đang giao' },
          { orderId: 'DH003', customerName: 'Lê Văn C', address: 'Quận Cầu Giấy, Hà Nội', partner: 'Viettel Post', deliveryTime: '19/5/2023', status: 'Hoàn thành' },
          { orderId: 'DH004', customerName: 'Phạm Thị D', address: 'Quận 2, Tp.HCM', partner: 'Giao Hàng Nhanh', deliveryTime: '19/5/2023', status: 'Đang giao' },
          { orderId: 'DH005', customerName: 'Hoàng Văn E', address: 'Quận Hai Bà Trưng, Hà Nội', partner: 'Viettel Post', deliveryTime: '18/5/2023', status: 'Hoàn thành' }
        ]
      };
    }
  },

  // Feedback statistics
  getFeedbackData: async () => {
    try {
      const response = await apiClient.get(`${API_URL}/reviews/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching feedback data:', error);
      return {
        average: 0,
        total: 0,
        distribution: [0, 0, 0, 0, 0]
      };
    }
  }
};

export default reportsApi; 