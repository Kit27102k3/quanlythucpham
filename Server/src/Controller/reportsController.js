/**
 * Reports controller to handle API requests for generating various reports
 * This is a simplified version that will need to be expanded with actual database queries
 */
const reportsController = {
  // Dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      // Sample dashboard statistics - to be replaced with actual DB queries
      const stats = {
        totalOrders: 152,
        totalRevenue: 75600000,  // In VND
        totalCustomers: 84,
        totalProducts: 126,
        recentActivities: [
          { id: 1, type: 'order', message: 'Đơn hàng mới #1234 đã được tạo', timestamp: new Date() },
          { id: 2, type: 'user', message: 'Người dùng mới Nguyễn Văn A đã đăng ký', timestamp: new Date(Date.now() - 3600000) },
          { id: 3, type: 'product', message: 'Sản phẩm "Thịt bò Úc" đã được cập nhật', timestamp: new Date(Date.now() - 7200000) }
        ]
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Lỗi khi lấy dữ liệu thống kê' });
    }
  },

  // Revenue data
  getRevenueData: async (req, res) => {
    try {
      const { timeRange } = req.query;
      // paymentMethod and region will be used in actual implementation
      const { paymentMethod, region } = req.query;
      
      // Generate sample data based on time range
      // In a real implementation, you would query the database based on these filters
      const revenueData = Array(timeRange === 'year' ? 12 : timeRange === 'month' ? 30 : 7)
        .fill(0)
        .map((_, index) => ({
          date: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          revenue: Math.floor(Math.random() * 10000000) + 5000000,
          orders: Math.floor(Math.random() * 20) + 5
        }))
        .reverse();
      
      res.json(revenueData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      res.status(500).json({ message: 'Lỗi khi lấy dữ liệu doanh thu' });
    }
  },

  // Top products
  getTopProducts: async (req, res) => {
    try {
      const topProducts = [
        { id: 1, name: 'Thịt bò Úc', quantity: 128, revenue: 25600000, category: 'Thịt' },
        { id: 2, name: 'Cá hồi Na Uy', quantity: 95, revenue: 19000000, category: 'Hải sản' },
        { id: 3, name: 'Tôm sú', quantity: 87, revenue: 13050000, category: 'Hải sản' },
        { id: 4, name: 'Rau cải', quantity: 145, revenue: 4350000, category: 'Rau củ' },
        { id: 5, name: 'Thịt gà', quantity: 76, revenue: 9120000, category: 'Thịt' }
      ];
      
      res.json(topProducts);
    } catch (error) {
      console.error('Error fetching top products:', error);
      res.status(500).json({ message: 'Lỗi khi lấy dữ liệu sản phẩm bán chạy' });
    }
  },

  // Inventory data
  getInventoryData: async (req, res) => {
    try {
      const inventory = [
        { id: 1, name: 'Thịt bò Úc', stock: 32, category: 'Thịt', value: 6400000, status: 'Còn hàng' },
        { id: 2, name: 'Cá hồi Na Uy', stock: 15, category: 'Hải sản', value: 3000000, status: 'Còn hàng' },
        { id: 3, name: 'Tôm sú', stock: 8, category: 'Hải sản', value: 1200000, status: 'Sắp hết' },
        { id: 4, name: 'Rau cải', stock: 45, category: 'Rau củ', value: 1350000, status: 'Còn hàng' },
        { id: 5, name: 'Thịt gà', stock: 0, category: 'Thịt', value: 0, status: 'Hết hàng' }
      ];
      
      res.json(inventory);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      res.status(500).json({ message: 'Lỗi khi lấy dữ liệu tồn kho' });
    }
  },

  // User statistics
  getUserData: async (req, res) => {
    try {
      const userData = {
        totalUsers: 84,
        newUsers: 12,
        activeUsers: 65,
        usersByRegion: [
          { region: 'Hà Nội', count: 32 },
          { region: 'TP.HCM', count: 28 },
          { region: 'Đà Nẵng', count: 14 },
          { region: 'Khác', count: 10 }
        ],
        usersByAge: [
          { range: '18-24', count: 15 },
          { range: '25-34', count: 32 },
          { range: '35-44', count: 25 },
          { range: '45+', count: 12 }
        ]
      };
      
      res.json(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ message: 'Lỗi khi lấy dữ liệu người dùng' });
    }
  },

  // Order statistics
  getOrderData: async (req, res) => {
    try {
      // timeRange will be used in actual implementation
      const { timeRange } = req.query;
      
      const orderData = {
        totalOrders: 152,
        completedOrders: 128,
        pendingOrders: 15,
        cancelledOrders: 9,
        averageOrderValue: 500000,
        ordersByStatus: [
          { status: 'Hoàn thành', count: 128 },
          { status: 'Đang xử lý', count: 10 },
          { status: 'Đang giao hàng', count: 5 },
          { status: 'Đã hủy', count: 9 }
        ],
        ordersByTimeOfDay: [
          { time: 'Sáng', count: 45 },
          { time: 'Trưa', count: 38 },
          { time: 'Chiều', count: 41 },
          { time: 'Tối', count: 28 }
        ],
        recentOrders: [
          { id: 1, customer: 'Nguyễn Văn A', total: 580000, status: 'Hoàn thành', date: new Date() },
          { id: 2, customer: 'Trần Thị B', total: 420000, status: 'Đang giao hàng', date: new Date(Date.now() - 3600000) },
          { id: 3, customer: 'Lê Văn C', total: 650000, status: 'Đang xử lý', date: new Date(Date.now() - 7200000) }
        ]
      };
      
      res.json(orderData);
    } catch (error) {
      console.error('Error fetching order data:', error);
      res.status(500).json({ message: 'Lỗi khi lấy dữ liệu đơn hàng' });
    }
  },

  // Promotion statistics
  getPromotionData: async (req, res) => {
    try {
      // timeRange will be used in actual implementation
      const { timeRange } = req.query;
      
      const promotionData = {
        totalVouchers: 10,
        activeVouchers: 6,
        usedVouchers: 125,
        totalDiscount: 15800000,
        voucherStats: [
          { code: 'SUMMER30', type: 'Phần trăm', discount: '30%', used: 45, limit: 100, revenue: 6750000, usageRate: 45 },
          { code: 'FREESHIP', type: 'Cố định', discount: '50.000đ', used: 60, limit: 100, revenue: 7200000, usageRate: 60 },
          { code: 'NEW20', type: 'Phần trăm', discount: '20%', used: 20, limit: 50, revenue: 1850000, usageRate: 40 }
        ],
        promotionEffectiveness: [
          { name: 'SUMMER30', conversion: 45 },
          { name: 'FREESHIP', conversion: 60 },
          { name: 'NEW20', conversion: 40 }
        ]
      };
      
      res.json(promotionData);
    } catch (error) {
      console.error('Error fetching promotion data:', error);
      res.status(500).json({ message: 'Lỗi khi lấy dữ liệu khuyến mãi' });
    }
  },

  // System activity logs
  getSystemActivityData: async (req, res) => {
    try {
      const { timeRange } = req.query;
      
      const systemActivityData = {
        totalActivities: 320,
        userActivities: 185,
        adminActivities: 135,
        activityByType: [
          { type: 'Đăng nhập', count: 95 },
          { type: 'Đặt hàng', count: 152 },
          { type: 'Cập nhật sản phẩm', count: 45 },
          { type: 'Thêm sản phẩm', count: 28 }
        ],
        activityTimeline: Array(timeRange === 'year' ? 12 : timeRange === 'month' ? 30 : 7)
          .fill(0)
          .map((_, index) => ({
            date: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            activities: Math.floor(Math.random() * 20) + 5
          }))
          .reverse(),
        recentActivities: [
          { id: 1, user: 'Nguyễn Văn A', action: 'Đăng nhập', timestamp: new Date(), ip: '192.168.1.1' },
          { id: 2, user: 'Admin', action: 'Cập nhật sản phẩm', timestamp: new Date(Date.now() - 3600000), ip: '192.168.1.2' },
          { id: 3, user: 'Trần Thị B', action: 'Đặt hàng', timestamp: new Date(Date.now() - 7200000), ip: '192.168.1.3' }
        ]
      };
      
      res.json(systemActivityData);
    } catch (error) {
      console.error('Error fetching system activity data:', error);
      res.status(500).json({ message: 'Lỗi khi lấy dữ liệu hoạt động hệ thống' });
    }
  },

  // Delivery statistics
  getDeliveryData: async (req, res) => {
    try {
      const { timeRange } = req.query;
      
      const deliveryData = {
        totalDeliveries: 128,
        successfulDeliveries: 120,
        pendingDeliveries: 5,
        failedDeliveries: 3,
        averageDeliveryTime: 2.3, // in days
        deliveryByRegion: [
          { region: 'Hà Nội', count: 45, avgTime: 1.8 },
          { region: 'TP.HCM', count: 38, avgTime: 2.1 },
          { region: 'Đà Nẵng', count: 25, avgTime: 2.5 },
          { region: 'Khác', count: 20, avgTime: 3.2 }
        ],
        deliveryTimeline: Array(timeRange === 'year' ? 12 : timeRange === 'month' ? 30 : 7)
          .fill(0)
          .map((_, index) => ({
            date: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            deliveries: Math.floor(Math.random() * 10) + 2,
            avgTime: Math.random() * 2 + 1
          }))
          .reverse(),
        deliveryMethods: [
          { method: 'Giao hàng tiêu chuẩn', count: 85 },
          { method: 'Giao hàng nhanh', count: 35 },
          { method: 'Giao trong ngày', count: 8 }
        ]
      };
      
      res.json(deliveryData);
    } catch (error) {
      console.error('Error fetching delivery data:', error);
      res.status(500).json({ message: 'Lỗi khi lấy dữ liệu giao hàng' });
    }
  },

  // Feedback statistics
  getFeedbackData: async (req, res) => {
    try {
      // timeRange will be used in actual implementation
      const { timeRange } = req.query;
      
      const feedbackData = {
        totalReviews: 96,
        averageRating: 4.2,
        ratingDistribution: [
          { rating: 5, count: 45 },
          { rating: 4, count: 32 },
          { rating: 3, count: 12 },
          { rating: 2, count: 5 },
          { rating: 1, count: 2 }
        ],
        categoryRatings: [
          { category: 'Thịt', rating: 4.5 },
          { category: 'Hải sản', rating: 4.3 },
          { category: 'Rau củ', rating: 3.9 },
          { category: 'Trái cây', rating: 4.7 }
        ],
        recentFeedback: [
          { id: 1, customer: 'Nguyễn Văn A', rating: 5, comment: 'Sản phẩm rất tươi, giao hàng nhanh!', date: new Date() },
          { id: 2, customer: 'Trần Thị B', rating: 4, comment: 'Thịt bò rất ngon, sẽ mua lại.', date: new Date(Date.now() - 86400000) },
          { id: 3, customer: 'Lê Văn C', rating: 3, comment: 'Sản phẩm tốt nhưng giao hàng hơi chậm.', date: new Date(Date.now() - 172800000) }
        ]
      };
      
      res.json(feedbackData);
    } catch (error) {
      console.error('Error fetching feedback data:', error);
      res.status(500).json({ message: 'Lỗi khi lấy dữ liệu phản hồi' });
    }
  }
};

export default reportsController; 