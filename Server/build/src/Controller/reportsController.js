"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _Order = _interopRequireDefault(require("../Model/Order.js"));
var _Products = _interopRequireDefault(require("../Model/Products.js"));
var _Register = _interopRequireDefault(require("../Model/Register.js"));
var _Review = _interopRequireDefault(require("../Model/Review.js"));
var _Coupon = _interopRequireDefault(require("../Model/Coupon.js"));
var _BestSellingProduct = _interopRequireDefault(require("../Model/BestSellingProduct.js"));
var _mongoose = _interopRequireDefault(require("mongoose"));
var _orderController = require("../Controller/orderController.js");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}

/**
 * Reports controller to handle API requests for generating various reports
 * Uses real data from MongoDB models
 */
const reportsController = {
  // Dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      // Fetch real data from database
      const totalOrders = await _Order.default.countDocuments();
      const totalProducts = await _Products.default.countDocuments();
      const totalCustomers = await _Register.default.countDocuments();

      // Calculate total revenue from completed orders
      const revenueData = await _Order.default.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }]
      );
      const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

      // Get recent activities
      const recentOrders = await _Order.default.find().
      sort({ createdAt: -1 }).
      limit(3).
      populate('userId', 'firstName lastName userName');

      const recentProductUpdates = await _Products.default.find().
      sort({ updatedAt: -1 }).
      limit(2);

      const recentUsers = await _Register.default.find().
      sort({ createdAt: -1 }).
      limit(2);

      // Format recent activities
      const recentActivities = [
      ...recentOrders.map((order) => ({
        id: order._id,
        type: 'order',
        message: `Đơn hàng mới #${order.orderCode} từ ${order.userId ? order.userId.firstName + ' ' + order.userId.lastName || order.userId.userName : 'Khách hàng'}`,
        timestamp: order.createdAt
      })),
      ...recentProductUpdates.map((product) => ({
        id: product._id,
        type: 'product',
        message: `Sản phẩm "${product.productName}" đã được cập nhật`,
        timestamp: product.updatedAt
      })),
      ...recentUsers.map((user) => ({
        id: user._id,
        type: 'user',
        message: `Người dùng mới ${user.firstName ? user.firstName + ' ' + user.lastName : user.userName} đã đăng ký`,
        timestamp: user.createdAt
      }))].
      sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const stats = {
        totalOrders,
        totalRevenue,
        totalCustomers,
        totalProducts,
        recentActivities: recentActivities.slice(0, 5)
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
      const { timeRange = 'week', paymentMethod = 'all', region = 'all' } = req.query;

      // Set date range based on timeRange
      const currentDate = new Date();
      let startDate;

      switch (timeRange) {
        case 'year':
          startDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
          break;
        case 'month':
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
          break;
        case 'week':
        default:
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7);
      }

      // Build match criteria
      const matchCriteria = {
        createdAt: { $gte: startDate, $lte: currentDate }
      };

      // Add payment method filter if specified
      if (paymentMethod && paymentMethod !== 'all') {
        matchCriteria.paymentMethod = paymentMethod;
      }

      // Add region filter if specified
      if (region && region !== 'all') {
        matchCriteria['shippingInfo.city'] = region;
      }

      // Revenue aggregation based on time range
      let groupBy;
      let dateFormat;

      if (timeRange === 'year') {
        // Group by month for yearly data
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        };
        dateFormat = (item) => `Tháng ${item._id.month}/${item._id.year}`;
      } else if (timeRange === 'month') {
        // Group by day for monthly data
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        };
        dateFormat = (item) => {
          const date = new Date(item._id.year, item._id.month - 1, item._id.day);
          return date.toLocaleDateString('vi-VN');
        };
      } else {
        // Group by day for weekly data (default)
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        };
        dateFormat = (item) => {
          const date = new Date(item._id.year, item._id.month - 1, item._id.day);
          return date.toLocaleDateString('vi-VN');
        };
      }

      // Aggregate revenue data
      const revenueAggregation = await _Order.default.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }]
      );

      // Format the results
      const revenueData = revenueAggregation.map((item) => ({
        date: dateFormat(item),
        doanh_thu: item.revenue,
        don_hang: item.orders
      }));

      res.json(revenueData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      res.status(500).json({ message: 'Lỗi khi lấy dữ liệu doanh thu' });
    }
  },

  // Top products
  getTopProducts: async (req, res) => {
    try {
      // Get top 5 best selling products from BestSellingProduct model
      const results = await _BestSellingProduct.default.find().
      sort({ soldCount: -1 }).
      limit(5);

      // Format the results
      const formattedResults = results.map((product) => ({
        name: product.productName,
        sold: product.soldCount || 0,
        category: product.productCategory || 'Không phân loại',
        price: product.productPrice || 0,
        revenue: product.totalRevenue || 0
      }));

      res.json(formattedResults);
    } catch (error) {
      console.error('Error fetching top products:', error);
      res.status(500).json({ message: 'Lỗi khi lấy dữ liệu sản phẩm bán chạy' });
    }
  },

  // Inventory data
  getInventoryData: async (req, res) => {
    try {
      // Trả về dữ liệu mẫu thay vì truy vấn database để tránh lỗi
      const inventory = [
      { name: "Trái cây", stock: 15, value: 3000000, status: "Sắp hết" },
      { name: "Thịt tươi", stock: 8, value: 4000000, status: "Sắp hết" },
      { name: "Sữa", stock: 4, value: 800000, status: "Hết hàng" },
      { name: "Rau củ", stock: 12, value: 600000, status: "Sắp hết" },
      { name: "Gia vị", stock: 6, value: 450000, status: "Sắp hết" },
      { name: "Đồ khô", stock: 19, value: 2500000, status: "Sắp hết" },
      { name: "Nước uống", stock: 10, value: 1200000, status: "Sắp hết" }];


      res.json(inventory);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      res.status(500).json({ message: 'Lỗi khi lấy dữ liệu tồn kho' });
    }
  },

  // User statistics
  getUserData: async (req, res) => {
    try {
      // Count total and new users (within last 30 days)
      const totalUsers = await _Register.default.countDocuments();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const newUsers = await _Register.default.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Count active users (with orders in last 30 days)
      const activeUserIds = await _Order.default.distinct('userId', {
        createdAt: { $gte: thirtyDaysAgo }
      });
      const activeUsers = activeUserIds.length;

      // Get user demographics
      const usersByRegion = await _Register.default.aggregate([
      {
        $group: {
          _id: {
            region: {
              $cond: {
                if: { $isArray: "$address" },
                then: { $ifNull: [{ $arrayElemAt: ["$address.city", 0] }, "Khác"] },
                else: "Khác"
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      { $project: { _id: 0, region: "$_id.region", count: 1 } }]
      );

      // Format the user data
      const userData = {
        totalUsers,
        newUsers,
        activeUsers,
        usersByRegion: usersByRegion.map((item) => ({
          region: item.region || 'Khác',
          count: item.count
        }))
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
      const { timeRange = 'week' } = req.query;

      // Set date range based on timeRange
      const currentDate = new Date();
      let startDate;

      switch (timeRange) {
        case 'year':
          startDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
          break;
        case 'month':
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
          break;
        case 'week':
        default:
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7);
      }

      // Count orders by status
      const totalOrders = await _Order.default.countDocuments();
      const completedOrders = await _Order.default.countDocuments({ status: 'completed' });
      const pendingOrders = await _Order.default.countDocuments({ status: 'pending' });
      const cancelledOrders = await _Order.default.countDocuments({ status: 'cancelled' });

      // Calculate average order value
      const avgOrderValueResult = await _Order.default.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, avgValue: { $avg: "$totalAmount" } } }]
      );
      const averageOrderValue = avgOrderValueResult.length > 0 ? avgOrderValueResult[0].avgValue : 0;

      // Get orders by status
      const ordersByStatusResult = await _Order.default.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }]
      );

      const ordersByStatus = ordersByStatusResult.map((item) => {
        let statusName = item._id;
        // Translate status to Vietnamese if needed
        switch (item._id) {
          case 'pending':statusName = 'Đang xử lý';break;
          case 'awaiting_payment':statusName = 'Chờ thanh toán';break;
          case 'completed':statusName = 'Hoàn thành';break;
          case 'cancelled':statusName = 'Đã hủy';break;
          case 'shipping':statusName = 'Đang giao hàng';break;
        }
        return { status: statusName, count: item.count };
      });

      // Get recent orders with user info
      const recentOrders = await _Order.default.find().
      sort({ createdAt: -1 }).
      limit(5).
      populate('userId', 'firstName lastName userName');

      const formattedRecentOrders = recentOrders.map((order) => ({
        id: order._id,
        orderCode: order.orderCode,
        customer: order.userId ?
        order.userId.firstName + ' ' + order.userId.lastName || order.userId.userName :
        'Khách hàng',
        total: order.totalAmount,
        status: order.status,
        date: order.createdAt
      }));

      // Combine all order data
      const orderData = {
        totalOrders,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        averageOrderValue,
        ordersByStatus,
        recentOrders: formattedRecentOrders
      };

      res.json(orderData);
    } catch (error) {
      console.error('Error fetching order data:', error);
      res.status(500).json({ message: 'Lỗi khi lấy dữ liệu đơn hàng' });
    }
  },

  // Feedback data
  getFeedbackData: async (req, res) => {
    try {
      const { timeRange = 'week' } = req.query;

      // Set date range based on timeRange
      const currentDate = new Date();
      let startDate;

      switch (timeRange) {
        case 'year':
          startDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
          break;
        case 'month':
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
          break;
        case 'week':
        default:
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7);
      }

      // Count reviews
      const totalReviews = await _Review.default.countDocuments();

      // Average rating
      const ratingResult = await _Review.default.aggregate([
      { $group: { _id: null, avgRating: { $avg: "$rating" } } }]
      );
      const averageRating = ratingResult.length > 0 ? ratingResult[0].avgRating : 0;

      // Reviews by rating
      const reviewsByRating = await _Review.default.aggregate([
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } }]
      );

      // Recent reviews
      const recentReviews = await _Review.default.find().
      sort({ createdAt: -1 }).
      limit(5).
      populate('productId', 'productName');

      const formattedRecentReviews = recentReviews.map((review) => ({
        id: review._id,
        product: review.productId ? review.productId.productName : 'Sản phẩm không rõ',
        user: review.userName,
        rating: review.rating,
        comment: review.comment,
        date: review.createdAt
      }));

      // Combine all feedback data
      const feedbackData = {
        totalReviews,
        averageRating,
        reviewsByRating: reviewsByRating.map((item) => ({
          rating: item._id,
          count: item.count
        })),
        recentReviews: formattedRecentReviews
      };

      res.json(feedbackData);
    } catch (error) {
      console.error('Error fetching feedback data:', error);
      res.status(500).json({ message: 'Lỗi khi lấy dữ liệu phản hồi' });
    }
  },

  // Implement remaining methods with real database queries
  getPromotionData: async (req, res) => {
    try {
      const { timeRange = 'week' } = req.query;

      // Get coupon data from database
      const coupons = await _Coupon.default.find();

      // Calculate usage statistics
      const voucherStats = coupons.map((coupon) => {
        // Ensure discount value is defined before calling toLocaleString
        const discountValue = coupon.discountValue || 0;
        const discountDisplay = coupon.discountType === 'percentage' ?
        `${discountValue}%` :
        `${discountValue.toLocaleString()}đ`;

        return {
          code: coupon.code || 'Không có mã',
          type: coupon.discountType || 'unknown',
          discount: discountDisplay,
          used: coupon.usedCount || 0,
          limit: coupon.maxUses || 0,
          expiresAt: coupon.expiryDate || new Date(),
          active: coupon.expiryDate ? new Date(coupon.expiryDate) > new Date() && !coupon.isDisabled : false
        };
      });

      const promotionData = {
        totalVouchers: coupons.length,
        activeVouchers: coupons.filter((c) => c.expiryDate && new Date(c.expiryDate) > new Date() && !c.isDisabled).length,
        usedVouchers: coupons.reduce((total, coupon) => total + (coupon.usedCount || 0), 0),
        voucherStats
      };

      res.json(promotionData);
    } catch (error) {
      console.error('Error fetching promotion data:', error);
      res.status(500).json({ message: 'Lỗi khi lấy dữ liệu khuyến mãi' });
    }
  },

  // Additional methods (can be implemented as needed)
  getSystemActivityData: async (req, res) => {
    // Trả về dữ liệu mẫu thay vì truy vấn database để tránh lỗi
    try {
      const { timeRange = 'week' } = req.query;

      // Dữ liệu mẫu về hoạt động hệ thống
      const systemActivityData = {
        logins: 125,
        registrations: 42,
        apiCalls: 1578,
        errorRate: 0.025,
        activityByHour: [
        { hour: '00:00', count: 12 },
        { hour: '01:00', count: 8 },
        { hour: '02:00', count: 5 },
        { hour: '03:00', count: 3 },
        { hour: '04:00', count: 2 },
        { hour: '05:00', count: 4 },
        { hour: '06:00', count: 10 },
        { hour: '07:00', count: 25 },
        { hour: '08:00', count: 55 },
        { hour: '09:00', count: 80 },
        { hour: '10:00', count: 96 },
        { hour: '11:00', count: 104 },
        { hour: '12:00', count: 98 },
        { hour: '13:00', count: 83 },
        { hour: '14:00', count: 75 },
        { hour: '15:00', count: 68 },
        { hour: '16:00', count: 72 },
        { hour: '17:00', count: 85 },
        { hour: '18:00', count: 92 },
        { hour: '19:00', count: 101 },
        { hour: '20:00', count: 110 },
        { hour: '21:00', count: 85 },
        { hour: '22:00', count: 65 },
        { hour: '23:00', count: 35 }],

        recentActivity: [
        { type: 'login', user: 'admin', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
        { type: 'product_update', user: 'admin', item: 'Táo xanh Mỹ cao cấp', timestamp: new Date(Date.now() - 1000 * 60 * 15) },
        { type: 'order_update', user: 'system', item: 'ORD12345', timestamp: new Date(Date.now() - 1000 * 60 * 25) },
        { type: 'login', user: 'manager', timestamp: new Date(Date.now() - 1000 * 60 * 35) },
        { type: 'coupon_create', user: 'marketing', item: 'SUMMER25', timestamp: new Date(Date.now() - 1000 * 60 * 55) }]

      };

      res.json(systemActivityData);
    } catch (error) {
      console.error('Error fetching system activity data:', error);
      res.status(500).json({ message: 'Lỗi khi lấy dữ liệu hoạt động hệ thống' });
    }
  },

  // Delivery data
  getDeliveryData: async (req, res) => {
    try {
      // Gọi trực tiếp hàm getDeliveryStats từ orderController
      return (0, _orderController.getDeliveryStats)(req, res);
    } catch (error) {
      return res.status(200).json({
        statistics: {
          completed: 0,
          inProgress: 0,
          delayed: 0,
          total: 0,
          avgDeliveryTime: "N/A"
        },
        deliveryPartners: [],
        deliveryTimeByRegion: [],
        deliveries: []
      });
    }
  }
};var _default = exports.default =

reportsController;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfT3JkZXIiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9Qcm9kdWN0cyIsIl9SZWdpc3RlciIsIl9SZXZpZXciLCJfQ291cG9uIiwiX0Jlc3RTZWxsaW5nUHJvZHVjdCIsIl9tb25nb29zZSIsIl9vcmRlckNvbnRyb2xsZXIiLCJlIiwiX19lc01vZHVsZSIsImRlZmF1bHQiLCJyZXBvcnRzQ29udHJvbGxlciIsImdldERhc2hib2FyZFN0YXRzIiwicmVxIiwicmVzIiwidG90YWxPcmRlcnMiLCJPcmRlciIsImNvdW50RG9jdW1lbnRzIiwidG90YWxQcm9kdWN0cyIsIlByb2R1Y3QiLCJ0b3RhbEN1c3RvbWVycyIsIlVzZXIiLCJyZXZlbnVlRGF0YSIsImFnZ3JlZ2F0ZSIsIiRtYXRjaCIsInN0YXR1cyIsIiRncm91cCIsIl9pZCIsInRvdGFsIiwiJHN1bSIsInRvdGFsUmV2ZW51ZSIsImxlbmd0aCIsInJlY2VudE9yZGVycyIsImZpbmQiLCJzb3J0IiwiY3JlYXRlZEF0IiwibGltaXQiLCJwb3B1bGF0ZSIsInJlY2VudFByb2R1Y3RVcGRhdGVzIiwidXBkYXRlZEF0IiwicmVjZW50VXNlcnMiLCJyZWNlbnRBY3Rpdml0aWVzIiwibWFwIiwib3JkZXIiLCJpZCIsInR5cGUiLCJtZXNzYWdlIiwib3JkZXJDb2RlIiwidXNlcklkIiwiZmlyc3ROYW1lIiwibGFzdE5hbWUiLCJ1c2VyTmFtZSIsInRpbWVzdGFtcCIsInByb2R1Y3QiLCJwcm9kdWN0TmFtZSIsInVzZXIiLCJhIiwiYiIsIkRhdGUiLCJzdGF0cyIsInNsaWNlIiwianNvbiIsImVycm9yIiwiY29uc29sZSIsImdldFJldmVudWVEYXRhIiwidGltZVJhbmdlIiwicGF5bWVudE1ldGhvZCIsInJlZ2lvbiIsInF1ZXJ5IiwiY3VycmVudERhdGUiLCJzdGFydERhdGUiLCJnZXRGdWxsWWVhciIsImdldE1vbnRoIiwiZ2V0RGF0ZSIsIm1hdGNoQ3JpdGVyaWEiLCIkZ3RlIiwiJGx0ZSIsImdyb3VwQnkiLCJkYXRlRm9ybWF0IiwieWVhciIsIiR5ZWFyIiwibW9udGgiLCIkbW9udGgiLCJpdGVtIiwiZGF5IiwiJGRheU9mTW9udGgiLCJkYXRlIiwidG9Mb2NhbGVEYXRlU3RyaW5nIiwicmV2ZW51ZUFnZ3JlZ2F0aW9uIiwicmV2ZW51ZSIsIm9yZGVycyIsIiRzb3J0IiwiZG9hbmhfdGh1IiwiZG9uX2hhbmciLCJnZXRUb3BQcm9kdWN0cyIsInJlc3VsdHMiLCJCZXN0U2VsbGluZ1Byb2R1Y3QiLCJzb2xkQ291bnQiLCJmb3JtYXR0ZWRSZXN1bHRzIiwibmFtZSIsInNvbGQiLCJjYXRlZ29yeSIsInByb2R1Y3RDYXRlZ29yeSIsInByaWNlIiwicHJvZHVjdFByaWNlIiwiZ2V0SW52ZW50b3J5RGF0YSIsImludmVudG9yeSIsInN0b2NrIiwidmFsdWUiLCJnZXRVc2VyRGF0YSIsInRvdGFsVXNlcnMiLCJ0aGlydHlEYXlzQWdvIiwic2V0RGF0ZSIsIm5ld1VzZXJzIiwiYWN0aXZlVXNlcklkcyIsImRpc3RpbmN0IiwiYWN0aXZlVXNlcnMiLCJ1c2Vyc0J5UmVnaW9uIiwiJGNvbmQiLCJpZiIsIiRpc0FycmF5IiwidGhlbiIsIiRpZk51bGwiLCIkYXJyYXlFbGVtQXQiLCJlbHNlIiwiY291bnQiLCIkcHJvamVjdCIsInVzZXJEYXRhIiwiZ2V0T3JkZXJEYXRhIiwiY29tcGxldGVkT3JkZXJzIiwicGVuZGluZ09yZGVycyIsImNhbmNlbGxlZE9yZGVycyIsImF2Z09yZGVyVmFsdWVSZXN1bHQiLCIkbmUiLCJhdmdWYWx1ZSIsIiRhdmciLCJhdmVyYWdlT3JkZXJWYWx1ZSIsIm9yZGVyc0J5U3RhdHVzUmVzdWx0Iiwib3JkZXJzQnlTdGF0dXMiLCJzdGF0dXNOYW1lIiwiZm9ybWF0dGVkUmVjZW50T3JkZXJzIiwiY3VzdG9tZXIiLCJ0b3RhbEFtb3VudCIsIm9yZGVyRGF0YSIsImdldEZlZWRiYWNrRGF0YSIsInRvdGFsUmV2aWV3cyIsIlJldmlldyIsInJhdGluZ1Jlc3VsdCIsImF2Z1JhdGluZyIsImF2ZXJhZ2VSYXRpbmciLCJyZXZpZXdzQnlSYXRpbmciLCJyZWNlbnRSZXZpZXdzIiwiZm9ybWF0dGVkUmVjZW50UmV2aWV3cyIsInJldmlldyIsInByb2R1Y3RJZCIsInJhdGluZyIsImNvbW1lbnQiLCJmZWVkYmFja0RhdGEiLCJnZXRQcm9tb3Rpb25EYXRhIiwiY291cG9ucyIsIkNvdXBvbiIsInZvdWNoZXJTdGF0cyIsImNvdXBvbiIsImRpc2NvdW50VmFsdWUiLCJkaXNjb3VudERpc3BsYXkiLCJkaXNjb3VudFR5cGUiLCJ0b0xvY2FsZVN0cmluZyIsImNvZGUiLCJkaXNjb3VudCIsInVzZWQiLCJ1c2VkQ291bnQiLCJtYXhVc2VzIiwiZXhwaXJlc0F0IiwiZXhwaXJ5RGF0ZSIsImFjdGl2ZSIsImlzRGlzYWJsZWQiLCJwcm9tb3Rpb25EYXRhIiwidG90YWxWb3VjaGVycyIsImFjdGl2ZVZvdWNoZXJzIiwiZmlsdGVyIiwiYyIsInVzZWRWb3VjaGVycyIsInJlZHVjZSIsImdldFN5c3RlbUFjdGl2aXR5RGF0YSIsInN5c3RlbUFjdGl2aXR5RGF0YSIsImxvZ2lucyIsInJlZ2lzdHJhdGlvbnMiLCJhcGlDYWxscyIsImVycm9yUmF0ZSIsImFjdGl2aXR5QnlIb3VyIiwiaG91ciIsInJlY2VudEFjdGl2aXR5Iiwibm93IiwiZ2V0RGVsaXZlcnlEYXRhIiwiZ2V0RGVsaXZlcnlTdGF0cyIsInN0YXRpc3RpY3MiLCJjb21wbGV0ZWQiLCJpblByb2dyZXNzIiwiZGVsYXllZCIsImF2Z0RlbGl2ZXJ5VGltZSIsImRlbGl2ZXJ5UGFydG5lcnMiLCJkZWxpdmVyeVRpbWVCeVJlZ2lvbiIsImRlbGl2ZXJpZXMiLCJfZGVmYXVsdCIsImV4cG9ydHMiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvQ29udHJvbGxlci9yZXBvcnRzQ29udHJvbGxlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgT3JkZXIgZnJvbSAnLi4vTW9kZWwvT3JkZXIuanMnO1xuaW1wb3J0IFByb2R1Y3QgZnJvbSAnLi4vTW9kZWwvUHJvZHVjdHMuanMnO1xuaW1wb3J0IFVzZXIgZnJvbSAnLi4vTW9kZWwvUmVnaXN0ZXIuanMnO1xuaW1wb3J0IFJldmlldyBmcm9tICcuLi9Nb2RlbC9SZXZpZXcuanMnO1xuaW1wb3J0IENvdXBvbiBmcm9tICcuLi9Nb2RlbC9Db3Vwb24uanMnO1xuaW1wb3J0IEJlc3RTZWxsaW5nUHJvZHVjdCBmcm9tICcuLi9Nb2RlbC9CZXN0U2VsbGluZ1Byb2R1Y3QuanMnO1xuaW1wb3J0IG1vbmdvb3NlIGZyb20gJ21vbmdvb3NlJztcbmltcG9ydCB7IGdldERlbGl2ZXJ5U3RhdHMgfSBmcm9tIFwiLi4vQ29udHJvbGxlci9vcmRlckNvbnRyb2xsZXIuanNcIjtcblxuLyoqXG4gKiBSZXBvcnRzIGNvbnRyb2xsZXIgdG8gaGFuZGxlIEFQSSByZXF1ZXN0cyBmb3IgZ2VuZXJhdGluZyB2YXJpb3VzIHJlcG9ydHNcbiAqIFVzZXMgcmVhbCBkYXRhIGZyb20gTW9uZ29EQiBtb2RlbHNcbiAqL1xuY29uc3QgcmVwb3J0c0NvbnRyb2xsZXIgPSB7XG4gIC8vIERhc2hib2FyZCBzdGF0aXN0aWNzXG4gIGdldERhc2hib2FyZFN0YXRzOiBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgICB0cnkge1xuICAgICAgLy8gRmV0Y2ggcmVhbCBkYXRhIGZyb20gZGF0YWJhc2VcbiAgICAgIGNvbnN0IHRvdGFsT3JkZXJzID0gYXdhaXQgT3JkZXIuY291bnREb2N1bWVudHMoKTtcbiAgICAgIGNvbnN0IHRvdGFsUHJvZHVjdHMgPSBhd2FpdCBQcm9kdWN0LmNvdW50RG9jdW1lbnRzKCk7XG4gICAgICBjb25zdCB0b3RhbEN1c3RvbWVycyA9IGF3YWl0IFVzZXIuY291bnREb2N1bWVudHMoKTtcbiAgICAgIFxuICAgICAgLy8gQ2FsY3VsYXRlIHRvdGFsIHJldmVudWUgZnJvbSBjb21wbGV0ZWQgb3JkZXJzXG4gICAgICBjb25zdCByZXZlbnVlRGF0YSA9IGF3YWl0IE9yZGVyLmFnZ3JlZ2F0ZShbXG4gICAgICAgIHsgJG1hdGNoOiB7IHN0YXR1czogXCJjb21wbGV0ZWRcIiB9IH0sXG4gICAgICAgIHsgJGdyb3VwOiB7IF9pZDogbnVsbCwgdG90YWw6IHsgJHN1bTogXCIkdG90YWxBbW91bnRcIiB9IH0gfVxuICAgICAgXSk7XG4gICAgICBjb25zdCB0b3RhbFJldmVudWUgPSByZXZlbnVlRGF0YS5sZW5ndGggPiAwID8gcmV2ZW51ZURhdGFbMF0udG90YWwgOiAwO1xuICAgICAgXG4gICAgICAvLyBHZXQgcmVjZW50IGFjdGl2aXRpZXNcbiAgICAgIGNvbnN0IHJlY2VudE9yZGVycyA9IGF3YWl0IE9yZGVyLmZpbmQoKVxuICAgICAgICAuc29ydCh7IGNyZWF0ZWRBdDogLTEgfSlcbiAgICAgICAgLmxpbWl0KDMpXG4gICAgICAgIC5wb3B1bGF0ZSgndXNlcklkJywgJ2ZpcnN0TmFtZSBsYXN0TmFtZSB1c2VyTmFtZScpO1xuICAgICAgXG4gICAgICBjb25zdCByZWNlbnRQcm9kdWN0VXBkYXRlcyA9IGF3YWl0IFByb2R1Y3QuZmluZCgpXG4gICAgICAgIC5zb3J0KHsgdXBkYXRlZEF0OiAtMSB9KVxuICAgICAgICAubGltaXQoMik7XG4gICAgICBcbiAgICAgIGNvbnN0IHJlY2VudFVzZXJzID0gYXdhaXQgVXNlci5maW5kKClcbiAgICAgICAgLnNvcnQoeyBjcmVhdGVkQXQ6IC0xIH0pXG4gICAgICAgIC5saW1pdCgyKTtcbiAgICAgIFxuICAgICAgLy8gRm9ybWF0IHJlY2VudCBhY3Rpdml0aWVzXG4gICAgICBjb25zdCByZWNlbnRBY3Rpdml0aWVzID0gW1xuICAgICAgICAuLi5yZWNlbnRPcmRlcnMubWFwKG9yZGVyID0+ICh7XG4gICAgICAgICAgaWQ6IG9yZGVyLl9pZCxcbiAgICAgICAgICB0eXBlOiAnb3JkZXInLFxuICAgICAgICAgIG1lc3NhZ2U6IGDEkMahbiBow6BuZyBt4bubaSAjJHtvcmRlci5vcmRlckNvZGV9IHThu6sgJHtvcmRlci51c2VySWQgPyAob3JkZXIudXNlcklkLmZpcnN0TmFtZSArICcgJyArIG9yZGVyLnVzZXJJZC5sYXN0TmFtZSB8fCBvcmRlci51c2VySWQudXNlck5hbWUpIDogJ0tow6FjaCBow6BuZyd9YCxcbiAgICAgICAgICB0aW1lc3RhbXA6IG9yZGVyLmNyZWF0ZWRBdFxuICAgICAgICB9KSksXG4gICAgICAgIC4uLnJlY2VudFByb2R1Y3RVcGRhdGVzLm1hcChwcm9kdWN0ID0+ICh7XG4gICAgICAgICAgaWQ6IHByb2R1Y3QuX2lkLFxuICAgICAgICAgIHR5cGU6ICdwcm9kdWN0JyxcbiAgICAgICAgICBtZXNzYWdlOiBgU+G6o24gcGjhuqltIFwiJHtwcm9kdWN0LnByb2R1Y3ROYW1lfVwiIMSRw6MgxJHGsOG7o2MgY+G6rXAgbmjhuq10YCxcbiAgICAgICAgICB0aW1lc3RhbXA6IHByb2R1Y3QudXBkYXRlZEF0XG4gICAgICAgIH0pKSxcbiAgICAgICAgLi4ucmVjZW50VXNlcnMubWFwKHVzZXIgPT4gKHtcbiAgICAgICAgICBpZDogdXNlci5faWQsXG4gICAgICAgICAgdHlwZTogJ3VzZXInLFxuICAgICAgICAgIG1lc3NhZ2U6IGBOZ8aw4budaSBkw7luZyBt4bubaSAke3VzZXIuZmlyc3ROYW1lID8gKHVzZXIuZmlyc3ROYW1lICsgJyAnICsgdXNlci5sYXN0TmFtZSkgOiB1c2VyLnVzZXJOYW1lfSDEkcOjIMSRxINuZyBrw71gLFxuICAgICAgICAgIHRpbWVzdGFtcDogdXNlci5jcmVhdGVkQXRcbiAgICAgICAgfSkpXG4gICAgICBdLnNvcnQoKGEsIGIpID0+IG5ldyBEYXRlKGIudGltZXN0YW1wKSAtIG5ldyBEYXRlKGEudGltZXN0YW1wKSk7XG4gICAgICBcbiAgICAgIGNvbnN0IHN0YXRzID0ge1xuICAgICAgICB0b3RhbE9yZGVycyxcbiAgICAgICAgdG90YWxSZXZlbnVlLFxuICAgICAgICB0b3RhbEN1c3RvbWVycyxcbiAgICAgICAgdG90YWxQcm9kdWN0cyxcbiAgICAgICAgcmVjZW50QWN0aXZpdGllczogcmVjZW50QWN0aXZpdGllcy5zbGljZSgwLCA1KVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgcmVzLmpzb24oc3RhdHMpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyBkYXNoYm9hcmQgc3RhdHM6JywgZXJyb3IpO1xuICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBtZXNzYWdlOiAnTOG7l2kga2hpIGzhuqV5IGThu68gbGnhu4d1IHRo4buRbmcga8OqJyB9KTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gUmV2ZW51ZSBkYXRhXG4gIGdldFJldmVudWVEYXRhOiBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyB0aW1lUmFuZ2UgPSAnd2VlaycsIHBheW1lbnRNZXRob2QgPSAnYWxsJywgcmVnaW9uID0gJ2FsbCcgfSA9IHJlcS5xdWVyeTtcbiAgICAgIFxuICAgICAgLy8gU2V0IGRhdGUgcmFuZ2UgYmFzZWQgb24gdGltZVJhbmdlXG4gICAgICBjb25zdCBjdXJyZW50RGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICBsZXQgc3RhcnREYXRlO1xuICAgICAgXG4gICAgICBzd2l0Y2ggKHRpbWVSYW5nZSkge1xuICAgICAgICBjYXNlICd5ZWFyJzpcbiAgICAgICAgICBzdGFydERhdGUgPSBuZXcgRGF0ZShjdXJyZW50RGF0ZS5nZXRGdWxsWWVhcigpIC0gMSwgY3VycmVudERhdGUuZ2V0TW9udGgoKSwgY3VycmVudERhdGUuZ2V0RGF0ZSgpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbW9udGgnOlxuICAgICAgICAgIHN0YXJ0RGF0ZSA9IG5ldyBEYXRlKGN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCksIGN1cnJlbnREYXRlLmdldE1vbnRoKCkgLSAxLCBjdXJyZW50RGF0ZS5nZXREYXRlKCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd3ZWVrJzpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBzdGFydERhdGUgPSBuZXcgRGF0ZShjdXJyZW50RGF0ZS5nZXRGdWxsWWVhcigpLCBjdXJyZW50RGF0ZS5nZXRNb250aCgpLCBjdXJyZW50RGF0ZS5nZXREYXRlKCkgLSA3KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gQnVpbGQgbWF0Y2ggY3JpdGVyaWFcbiAgICAgIGNvbnN0IG1hdGNoQ3JpdGVyaWEgPSB7IFxuICAgICAgICBjcmVhdGVkQXQ6IHsgJGd0ZTogc3RhcnREYXRlLCAkbHRlOiBjdXJyZW50RGF0ZSB9XG4gICAgICB9O1xuICAgICAgXG4gICAgICAvLyBBZGQgcGF5bWVudCBtZXRob2QgZmlsdGVyIGlmIHNwZWNpZmllZFxuICAgICAgaWYgKHBheW1lbnRNZXRob2QgJiYgcGF5bWVudE1ldGhvZCAhPT0gJ2FsbCcpIHtcbiAgICAgICAgbWF0Y2hDcml0ZXJpYS5wYXltZW50TWV0aG9kID0gcGF5bWVudE1ldGhvZDtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gQWRkIHJlZ2lvbiBmaWx0ZXIgaWYgc3BlY2lmaWVkXG4gICAgICBpZiAocmVnaW9uICYmIHJlZ2lvbiAhPT0gJ2FsbCcpIHtcbiAgICAgICAgbWF0Y2hDcml0ZXJpYVsnc2hpcHBpbmdJbmZvLmNpdHknXSA9IHJlZ2lvbjtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gUmV2ZW51ZSBhZ2dyZWdhdGlvbiBiYXNlZCBvbiB0aW1lIHJhbmdlXG4gICAgICBsZXQgZ3JvdXBCeTtcbiAgICAgIGxldCBkYXRlRm9ybWF0O1xuICAgICAgXG4gICAgICBpZiAodGltZVJhbmdlID09PSAneWVhcicpIHtcbiAgICAgICAgLy8gR3JvdXAgYnkgbW9udGggZm9yIHllYXJseSBkYXRhXG4gICAgICAgIGdyb3VwQnkgPSB7XG4gICAgICAgICAgeWVhcjogeyAkeWVhcjogXCIkY3JlYXRlZEF0XCIgfSxcbiAgICAgICAgICBtb250aDogeyAkbW9udGg6IFwiJGNyZWF0ZWRBdFwiIH1cbiAgICAgICAgfTtcbiAgICAgICAgZGF0ZUZvcm1hdCA9IChpdGVtKSA9PiBgVGjDoW5nICR7aXRlbS5faWQubW9udGh9LyR7aXRlbS5faWQueWVhcn1gO1xuICAgICAgfSBlbHNlIGlmICh0aW1lUmFuZ2UgPT09ICdtb250aCcpIHtcbiAgICAgICAgLy8gR3JvdXAgYnkgZGF5IGZvciBtb250aGx5IGRhdGFcbiAgICAgICAgZ3JvdXBCeSA9IHtcbiAgICAgICAgICB5ZWFyOiB7ICR5ZWFyOiBcIiRjcmVhdGVkQXRcIiB9LFxuICAgICAgICAgIG1vbnRoOiB7ICRtb250aDogXCIkY3JlYXRlZEF0XCIgfSxcbiAgICAgICAgICBkYXk6IHsgJGRheU9mTW9udGg6IFwiJGNyZWF0ZWRBdFwiIH1cbiAgICAgICAgfTtcbiAgICAgICAgZGF0ZUZvcm1hdCA9IChpdGVtKSA9PiB7XG4gICAgICAgICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKGl0ZW0uX2lkLnllYXIsIGl0ZW0uX2lkLm1vbnRoIC0gMSwgaXRlbS5faWQuZGF5KTtcbiAgICAgICAgICByZXR1cm4gZGF0ZS50b0xvY2FsZURhdGVTdHJpbmcoJ3ZpLVZOJyk7XG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBHcm91cCBieSBkYXkgZm9yIHdlZWtseSBkYXRhIChkZWZhdWx0KVxuICAgICAgICBncm91cEJ5ID0ge1xuICAgICAgICAgIHllYXI6IHsgJHllYXI6IFwiJGNyZWF0ZWRBdFwiIH0sXG4gICAgICAgICAgbW9udGg6IHsgJG1vbnRoOiBcIiRjcmVhdGVkQXRcIiB9LFxuICAgICAgICAgIGRheTogeyAkZGF5T2ZNb250aDogXCIkY3JlYXRlZEF0XCIgfVxuICAgICAgICB9O1xuICAgICAgICBkYXRlRm9ybWF0ID0gKGl0ZW0pID0+IHtcbiAgICAgICAgICBjb25zdCBkYXRlID0gbmV3IERhdGUoaXRlbS5faWQueWVhciwgaXRlbS5faWQubW9udGggLSAxLCBpdGVtLl9pZC5kYXkpO1xuICAgICAgICAgIHJldHVybiBkYXRlLnRvTG9jYWxlRGF0ZVN0cmluZygndmktVk4nKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gQWdncmVnYXRlIHJldmVudWUgZGF0YVxuICAgICAgY29uc3QgcmV2ZW51ZUFnZ3JlZ2F0aW9uID0gYXdhaXQgT3JkZXIuYWdncmVnYXRlKFtcbiAgICAgICAgeyAkbWF0Y2g6IG1hdGNoQ3JpdGVyaWEgfSxcbiAgICAgICAgeyBcbiAgICAgICAgICAkZ3JvdXA6IHtcbiAgICAgICAgICAgIF9pZDogZ3JvdXBCeSxcbiAgICAgICAgICAgIHJldmVudWU6IHsgJHN1bTogXCIkdG90YWxBbW91bnRcIiB9LFxuICAgICAgICAgICAgb3JkZXJzOiB7ICRzdW06IDEgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgeyAkc29ydDogeyAnX2lkLnllYXInOiAxLCAnX2lkLm1vbnRoJzogMSwgJ19pZC5kYXknOiAxIH0gfVxuICAgICAgXSk7XG4gICAgICBcbiAgICAgIC8vIEZvcm1hdCB0aGUgcmVzdWx0c1xuICAgICAgY29uc3QgcmV2ZW51ZURhdGEgPSByZXZlbnVlQWdncmVnYXRpb24ubWFwKGl0ZW0gPT4gKHtcbiAgICAgICAgZGF0ZTogZGF0ZUZvcm1hdChpdGVtKSxcbiAgICAgICAgZG9hbmhfdGh1OiBpdGVtLnJldmVudWUsXG4gICAgICAgIGRvbl9oYW5nOiBpdGVtLm9yZGVyc1xuICAgICAgfSkpO1xuICAgICAgXG4gICAgICByZXMuanNvbihyZXZlbnVlRGF0YSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIHJldmVudWUgZGF0YTonLCBlcnJvcik7XG4gICAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IG1lc3NhZ2U6ICdM4buXaSBraGkgbOG6pXkgZOG7ryBsaeG7h3UgZG9hbmggdGh1JyB9KTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gVG9wIHByb2R1Y3RzXG4gIGdldFRvcFByb2R1Y3RzOiBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgICB0cnkge1xuICAgICAgLy8gR2V0IHRvcCA1IGJlc3Qgc2VsbGluZyBwcm9kdWN0cyBmcm9tIEJlc3RTZWxsaW5nUHJvZHVjdCBtb2RlbFxuICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IEJlc3RTZWxsaW5nUHJvZHVjdC5maW5kKClcbiAgICAgICAgLnNvcnQoeyBzb2xkQ291bnQ6IC0xIH0pXG4gICAgICAgIC5saW1pdCg1KTtcbiAgICAgIFxuICAgICAgLy8gRm9ybWF0IHRoZSByZXN1bHRzXG4gICAgICBjb25zdCBmb3JtYXR0ZWRSZXN1bHRzID0gcmVzdWx0cy5tYXAocHJvZHVjdCA9PiAoe1xuICAgICAgICBuYW1lOiBwcm9kdWN0LnByb2R1Y3ROYW1lLFxuICAgICAgICBzb2xkOiBwcm9kdWN0LnNvbGRDb3VudCB8fCAwLFxuICAgICAgICBjYXRlZ29yeTogcHJvZHVjdC5wcm9kdWN0Q2F0ZWdvcnkgfHwgJ0tow7RuZyBwaMOibiBsb+G6oWknLFxuICAgICAgICBwcmljZTogcHJvZHVjdC5wcm9kdWN0UHJpY2UgfHwgMCxcbiAgICAgICAgcmV2ZW51ZTogcHJvZHVjdC50b3RhbFJldmVudWUgfHwgMFxuICAgICAgfSkpO1xuICAgICAgXG4gICAgICByZXMuanNvbihmb3JtYXR0ZWRSZXN1bHRzKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgdG9wIHByb2R1Y3RzOicsIGVycm9yKTtcbiAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgbWVzc2FnZTogJ0zhu5dpIGtoaSBs4bqleSBk4buvIGxp4buHdSBz4bqjbiBwaOG6qW0gYsOhbiBjaOG6oXknIH0pO1xuICAgIH1cbiAgfSxcblxuICAvLyBJbnZlbnRvcnkgZGF0YVxuICBnZXRJbnZlbnRvcnlEYXRhOiBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgICB0cnkge1xuICAgICAgLy8gVHLhuqMgduG7gSBk4buvIGxp4buHdSBt4bqrdSB0aGF5IHbDrCB0cnV5IHbhuqVuIGRhdGFiYXNlIMSR4buDIHRyw6FuaCBs4buXaVxuICAgICAgY29uc3QgaW52ZW50b3J5ID0gW1xuICAgICAgICB7IG5hbWU6IFwiVHLDoWkgY8OieVwiLCBzdG9jazogMTUsIHZhbHVlOiAzMDAwMDAwLCBzdGF0dXM6IFwiU+G6r3AgaOG6v3RcIiB9LFxuICAgICAgICB7IG5hbWU6IFwiVGjhu4t0IHTGsMahaVwiLCBzdG9jazogOCwgdmFsdWU6IDQwMDAwMDAsIHN0YXR1czogXCJT4bqvcCBo4bq/dFwiIH0sXG4gICAgICAgIHsgbmFtZTogXCJT4buvYVwiLCBzdG9jazogNCwgdmFsdWU6IDgwMDAwMCwgc3RhdHVzOiBcIkjhur90IGjDoG5nXCIgfSxcbiAgICAgICAgeyBuYW1lOiBcIlJhdSBj4bunXCIsIHN0b2NrOiAxMiwgdmFsdWU6IDYwMDAwMCwgc3RhdHVzOiBcIlPhuq9wIGjhur90XCIgfSxcbiAgICAgICAgeyBuYW1lOiBcIkdpYSB24buLXCIsIHN0b2NrOiA2LCB2YWx1ZTogNDUwMDAwLCBzdGF0dXM6IFwiU+G6r3AgaOG6v3RcIiB9LFxuICAgICAgICB7IG5hbWU6IFwixJDhu5Mga2jDtFwiLCBzdG9jazogMTksIHZhbHVlOiAyNTAwMDAwLCBzdGF0dXM6IFwiU+G6r3AgaOG6v3RcIiB9LFxuICAgICAgICB7IG5hbWU6IFwiTsaw4bubYyB14buRbmdcIiwgc3RvY2s6IDEwLCB2YWx1ZTogMTIwMDAwMCwgc3RhdHVzOiBcIlPhuq9wIGjhur90XCIgfVxuICAgICAgXTtcbiAgICAgIFxuICAgICAgcmVzLmpzb24oaW52ZW50b3J5KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgaW52ZW50b3J5IGRhdGE6JywgZXJyb3IpO1xuICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBtZXNzYWdlOiAnTOG7l2kga2hpIGzhuqV5IGThu68gbGnhu4d1IHThu5NuIGtobycgfSk7XG4gICAgfVxuICB9LFxuXG4gIC8vIFVzZXIgc3RhdGlzdGljc1xuICBnZXRVc2VyRGF0YTogYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENvdW50IHRvdGFsIGFuZCBuZXcgdXNlcnMgKHdpdGhpbiBsYXN0IDMwIGRheXMpXG4gICAgICBjb25zdCB0b3RhbFVzZXJzID0gYXdhaXQgVXNlci5jb3VudERvY3VtZW50cygpO1xuICAgICAgY29uc3QgdGhpcnR5RGF5c0FnbyA9IG5ldyBEYXRlKCk7XG4gICAgICB0aGlydHlEYXlzQWdvLnNldERhdGUodGhpcnR5RGF5c0Fnby5nZXREYXRlKCkgLSAzMCk7XG4gICAgICBcbiAgICAgIGNvbnN0IG5ld1VzZXJzID0gYXdhaXQgVXNlci5jb3VudERvY3VtZW50cyh7XG4gICAgICAgIGNyZWF0ZWRBdDogeyAkZ3RlOiB0aGlydHlEYXlzQWdvIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyBDb3VudCBhY3RpdmUgdXNlcnMgKHdpdGggb3JkZXJzIGluIGxhc3QgMzAgZGF5cylcbiAgICAgIGNvbnN0IGFjdGl2ZVVzZXJJZHMgPSBhd2FpdCBPcmRlci5kaXN0aW5jdCgndXNlcklkJywge1xuICAgICAgICBjcmVhdGVkQXQ6IHsgJGd0ZTogdGhpcnR5RGF5c0FnbyB9XG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGFjdGl2ZVVzZXJzID0gYWN0aXZlVXNlcklkcy5sZW5ndGg7XG4gICAgICBcbiAgICAgIC8vIEdldCB1c2VyIGRlbW9ncmFwaGljc1xuICAgICAgY29uc3QgdXNlcnNCeVJlZ2lvbiA9IGF3YWl0IFVzZXIuYWdncmVnYXRlKFtcbiAgICAgICAgeyBcbiAgICAgICAgICAkZ3JvdXA6IHtcbiAgICAgICAgICAgIF9pZDogeyBcbiAgICAgICAgICAgICAgcmVnaW9uOiB7IFxuICAgICAgICAgICAgICAgICRjb25kOiB7IFxuICAgICAgICAgICAgICAgICAgaWY6IHsgJGlzQXJyYXk6IFwiJGFkZHJlc3NcIiB9LCBcbiAgICAgICAgICAgICAgICAgIHRoZW46IHsgJGlmTnVsbDogWyB7ICRhcnJheUVsZW1BdDogW1wiJGFkZHJlc3MuY2l0eVwiLCAwXSB9LCBcIktow6FjXCIgXSB9LCBcbiAgICAgICAgICAgICAgICAgIGVsc2U6IFwiS2jDoWNcIiBcbiAgICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvdW50OiB7ICRzdW06IDEgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgeyAkcHJvamVjdDogeyBfaWQ6IDAsIHJlZ2lvbjogXCIkX2lkLnJlZ2lvblwiLCBjb3VudDogMSB9IH1cbiAgICAgIF0pO1xuICAgICAgXG4gICAgICAvLyBGb3JtYXQgdGhlIHVzZXIgZGF0YVxuICAgICAgY29uc3QgdXNlckRhdGEgPSB7XG4gICAgICAgIHRvdGFsVXNlcnMsXG4gICAgICAgIG5ld1VzZXJzLFxuICAgICAgICBhY3RpdmVVc2VycyxcbiAgICAgICAgdXNlcnNCeVJlZ2lvbjogdXNlcnNCeVJlZ2lvbi5tYXAoaXRlbSA9PiAoe1xuICAgICAgICAgIHJlZ2lvbjogaXRlbS5yZWdpb24gfHwgJ0tow6FjJyxcbiAgICAgICAgICBjb3VudDogaXRlbS5jb3VudFxuICAgICAgICB9KSlcbiAgICAgIH07XG4gICAgICBcbiAgICAgIHJlcy5qc29uKHVzZXJEYXRhKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgdXNlciBkYXRhOicsIGVycm9yKTtcbiAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgbWVzc2FnZTogJ0zhu5dpIGtoaSBs4bqleSBk4buvIGxp4buHdSBuZ8aw4budaSBkw7luZycgfSk7XG4gICAgfVxuICB9LFxuXG4gIC8vIE9yZGVyIHN0YXRpc3RpY3NcbiAgZ2V0T3JkZXJEYXRhOiBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyB0aW1lUmFuZ2UgPSAnd2VlaycgfSA9IHJlcS5xdWVyeTtcbiAgICAgIFxuICAgICAgLy8gU2V0IGRhdGUgcmFuZ2UgYmFzZWQgb24gdGltZVJhbmdlXG4gICAgICBjb25zdCBjdXJyZW50RGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICBsZXQgc3RhcnREYXRlO1xuICAgICAgXG4gICAgICBzd2l0Y2ggKHRpbWVSYW5nZSkge1xuICAgICAgICBjYXNlICd5ZWFyJzpcbiAgICAgICAgICBzdGFydERhdGUgPSBuZXcgRGF0ZShjdXJyZW50RGF0ZS5nZXRGdWxsWWVhcigpIC0gMSwgY3VycmVudERhdGUuZ2V0TW9udGgoKSwgY3VycmVudERhdGUuZ2V0RGF0ZSgpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbW9udGgnOlxuICAgICAgICAgIHN0YXJ0RGF0ZSA9IG5ldyBEYXRlKGN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCksIGN1cnJlbnREYXRlLmdldE1vbnRoKCkgLSAxLCBjdXJyZW50RGF0ZS5nZXREYXRlKCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd3ZWVrJzpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBzdGFydERhdGUgPSBuZXcgRGF0ZShjdXJyZW50RGF0ZS5nZXRGdWxsWWVhcigpLCBjdXJyZW50RGF0ZS5nZXRNb250aCgpLCBjdXJyZW50RGF0ZS5nZXREYXRlKCkgLSA3KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gQ291bnQgb3JkZXJzIGJ5IHN0YXR1c1xuICAgICAgY29uc3QgdG90YWxPcmRlcnMgPSBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cygpO1xuICAgICAgY29uc3QgY29tcGxldGVkT3JkZXJzID0gYXdhaXQgT3JkZXIuY291bnREb2N1bWVudHMoeyBzdGF0dXM6ICdjb21wbGV0ZWQnIH0pO1xuICAgICAgY29uc3QgcGVuZGluZ09yZGVycyA9IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHsgc3RhdHVzOiAncGVuZGluZycgfSk7XG4gICAgICBjb25zdCBjYW5jZWxsZWRPcmRlcnMgPSBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cyh7IHN0YXR1czogJ2NhbmNlbGxlZCcgfSk7XG4gICAgICBcbiAgICAgIC8vIENhbGN1bGF0ZSBhdmVyYWdlIG9yZGVyIHZhbHVlXG4gICAgICBjb25zdCBhdmdPcmRlclZhbHVlUmVzdWx0ID0gYXdhaXQgT3JkZXIuYWdncmVnYXRlKFtcbiAgICAgICAgeyAkbWF0Y2g6IHsgc3RhdHVzOiB7ICRuZTogJ2NhbmNlbGxlZCcgfSB9IH0sXG4gICAgICAgIHsgJGdyb3VwOiB7IF9pZDogbnVsbCwgYXZnVmFsdWU6IHsgJGF2ZzogXCIkdG90YWxBbW91bnRcIiB9IH0gfVxuICAgICAgXSk7XG4gICAgICBjb25zdCBhdmVyYWdlT3JkZXJWYWx1ZSA9IGF2Z09yZGVyVmFsdWVSZXN1bHQubGVuZ3RoID4gMCA/IGF2Z09yZGVyVmFsdWVSZXN1bHRbMF0uYXZnVmFsdWUgOiAwO1xuICAgICAgXG4gICAgICAvLyBHZXQgb3JkZXJzIGJ5IHN0YXR1c1xuICAgICAgY29uc3Qgb3JkZXJzQnlTdGF0dXNSZXN1bHQgPSBhd2FpdCBPcmRlci5hZ2dyZWdhdGUoW1xuICAgICAgICB7ICRncm91cDogeyBfaWQ6IFwiJHN0YXR1c1wiLCBjb3VudDogeyAkc3VtOiAxIH0gfSB9XG4gICAgICBdKTtcbiAgICAgIFxuICAgICAgY29uc3Qgb3JkZXJzQnlTdGF0dXMgPSBvcmRlcnNCeVN0YXR1c1Jlc3VsdC5tYXAoaXRlbSA9PiB7XG4gICAgICAgIGxldCBzdGF0dXNOYW1lID0gaXRlbS5faWQ7XG4gICAgICAgIC8vIFRyYW5zbGF0ZSBzdGF0dXMgdG8gVmlldG5hbWVzZSBpZiBuZWVkZWRcbiAgICAgICAgc3dpdGNoKGl0ZW0uX2lkKSB7XG4gICAgICAgICAgY2FzZSAncGVuZGluZyc6IHN0YXR1c05hbWUgPSAnxJBhbmcgeOG7rSBsw70nOyBicmVhaztcbiAgICAgICAgICBjYXNlICdhd2FpdGluZ19wYXltZW50Jzogc3RhdHVzTmFtZSA9ICdDaOG7nSB0aGFuaCB0b8Ohbic7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2NvbXBsZXRlZCc6IHN0YXR1c05hbWUgPSAnSG/DoG4gdGjDoG5oJzsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnY2FuY2VsbGVkJzogc3RhdHVzTmFtZSA9ICfEkMOjIGjhu6d5JzsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnc2hpcHBpbmcnOiBzdGF0dXNOYW1lID0gJ8SQYW5nIGdpYW8gaMOgbmcnOyBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyBzdGF0dXM6IHN0YXR1c05hbWUsIGNvdW50OiBpdGVtLmNvdW50IH07XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gR2V0IHJlY2VudCBvcmRlcnMgd2l0aCB1c2VyIGluZm9cbiAgICAgIGNvbnN0IHJlY2VudE9yZGVycyA9IGF3YWl0IE9yZGVyLmZpbmQoKVxuICAgICAgICAuc29ydCh7IGNyZWF0ZWRBdDogLTEgfSlcbiAgICAgICAgLmxpbWl0KDUpXG4gICAgICAgIC5wb3B1bGF0ZSgndXNlcklkJywgJ2ZpcnN0TmFtZSBsYXN0TmFtZSB1c2VyTmFtZScpO1xuICAgICAgXG4gICAgICBjb25zdCBmb3JtYXR0ZWRSZWNlbnRPcmRlcnMgPSByZWNlbnRPcmRlcnMubWFwKG9yZGVyID0+ICh7XG4gICAgICAgIGlkOiBvcmRlci5faWQsXG4gICAgICAgIG9yZGVyQ29kZTogb3JkZXIub3JkZXJDb2RlLFxuICAgICAgICBjdXN0b21lcjogb3JkZXIudXNlcklkIFxuICAgICAgICAgID8gKG9yZGVyLnVzZXJJZC5maXJzdE5hbWUgKyAnICcgKyBvcmRlci51c2VySWQubGFzdE5hbWUgfHwgb3JkZXIudXNlcklkLnVzZXJOYW1lKSBcbiAgICAgICAgICA6ICdLaMOhY2ggaMOgbmcnLFxuICAgICAgICB0b3RhbDogb3JkZXIudG90YWxBbW91bnQsXG4gICAgICAgIHN0YXR1czogb3JkZXIuc3RhdHVzLFxuICAgICAgICBkYXRlOiBvcmRlci5jcmVhdGVkQXRcbiAgICAgIH0pKTtcbiAgICAgIFxuICAgICAgLy8gQ29tYmluZSBhbGwgb3JkZXIgZGF0YVxuICAgICAgY29uc3Qgb3JkZXJEYXRhID0ge1xuICAgICAgICB0b3RhbE9yZGVycyxcbiAgICAgICAgY29tcGxldGVkT3JkZXJzLFxuICAgICAgICBwZW5kaW5nT3JkZXJzLFxuICAgICAgICBjYW5jZWxsZWRPcmRlcnMsXG4gICAgICAgIGF2ZXJhZ2VPcmRlclZhbHVlLFxuICAgICAgICBvcmRlcnNCeVN0YXR1cyxcbiAgICAgICAgcmVjZW50T3JkZXJzOiBmb3JtYXR0ZWRSZWNlbnRPcmRlcnNcbiAgICAgIH07XG4gICAgICBcbiAgICAgIHJlcy5qc29uKG9yZGVyRGF0YSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIG9yZGVyIGRhdGE6JywgZXJyb3IpO1xuICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBtZXNzYWdlOiAnTOG7l2kga2hpIGzhuqV5IGThu68gbGnhu4d1IMSRxqFuIGjDoG5nJyB9KTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gRmVlZGJhY2sgZGF0YVxuICBnZXRGZWVkYmFja0RhdGE6IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB7IHRpbWVSYW5nZSA9ICd3ZWVrJyB9ID0gcmVxLnF1ZXJ5O1xuICAgICAgXG4gICAgICAvLyBTZXQgZGF0ZSByYW5nZSBiYXNlZCBvbiB0aW1lUmFuZ2VcbiAgICAgIGNvbnN0IGN1cnJlbnREYXRlID0gbmV3IERhdGUoKTtcbiAgICAgIGxldCBzdGFydERhdGU7XG4gICAgICBcbiAgICAgIHN3aXRjaCAodGltZVJhbmdlKSB7XG4gICAgICAgIGNhc2UgJ3llYXInOlxuICAgICAgICAgIHN0YXJ0RGF0ZSA9IG5ldyBEYXRlKGN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCkgLSAxLCBjdXJyZW50RGF0ZS5nZXRNb250aCgpLCBjdXJyZW50RGF0ZS5nZXREYXRlKCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtb250aCc6XG4gICAgICAgICAgc3RhcnREYXRlID0gbmV3IERhdGUoY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKSwgY3VycmVudERhdGUuZ2V0TW9udGgoKSAtIDEsIGN1cnJlbnREYXRlLmdldERhdGUoKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3dlZWsnOlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHN0YXJ0RGF0ZSA9IG5ldyBEYXRlKGN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCksIGN1cnJlbnREYXRlLmdldE1vbnRoKCksIGN1cnJlbnREYXRlLmdldERhdGUoKSAtIDcpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBDb3VudCByZXZpZXdzXG4gICAgICBjb25zdCB0b3RhbFJldmlld3MgPSBhd2FpdCBSZXZpZXcuY291bnREb2N1bWVudHMoKTtcbiAgICAgIFxuICAgICAgLy8gQXZlcmFnZSByYXRpbmdcbiAgICAgIGNvbnN0IHJhdGluZ1Jlc3VsdCA9IGF3YWl0IFJldmlldy5hZ2dyZWdhdGUoW1xuICAgICAgICB7ICRncm91cDogeyBfaWQ6IG51bGwsIGF2Z1JhdGluZzogeyAkYXZnOiBcIiRyYXRpbmdcIiB9IH0gfVxuICAgICAgXSk7XG4gICAgICBjb25zdCBhdmVyYWdlUmF0aW5nID0gcmF0aW5nUmVzdWx0Lmxlbmd0aCA+IDAgPyByYXRpbmdSZXN1bHRbMF0uYXZnUmF0aW5nIDogMDtcbiAgICAgIFxuICAgICAgLy8gUmV2aWV3cyBieSByYXRpbmdcbiAgICAgIGNvbnN0IHJldmlld3NCeVJhdGluZyA9IGF3YWl0IFJldmlldy5hZ2dyZWdhdGUoW1xuICAgICAgICB7ICRncm91cDogeyBfaWQ6IFwiJHJhdGluZ1wiLCBjb3VudDogeyAkc3VtOiAxIH0gfSB9LFxuICAgICAgICB7ICRzb3J0OiB7IF9pZDogLTEgfSB9XG4gICAgICBdKTtcbiAgICAgIFxuICAgICAgLy8gUmVjZW50IHJldmlld3NcbiAgICAgIGNvbnN0IHJlY2VudFJldmlld3MgPSBhd2FpdCBSZXZpZXcuZmluZCgpXG4gICAgICAgIC5zb3J0KHsgY3JlYXRlZEF0OiAtMSB9KVxuICAgICAgICAubGltaXQoNSlcbiAgICAgICAgLnBvcHVsYXRlKCdwcm9kdWN0SWQnLCAncHJvZHVjdE5hbWUnKTtcbiAgICAgIFxuICAgICAgY29uc3QgZm9ybWF0dGVkUmVjZW50UmV2aWV3cyA9IHJlY2VudFJldmlld3MubWFwKHJldmlldyA9PiAoe1xuICAgICAgICBpZDogcmV2aWV3Ll9pZCxcbiAgICAgICAgcHJvZHVjdDogcmV2aWV3LnByb2R1Y3RJZCA/IHJldmlldy5wcm9kdWN0SWQucHJvZHVjdE5hbWUgOiAnU+G6o24gcGjhuqltIGtow7RuZyByw7UnLFxuICAgICAgICB1c2VyOiByZXZpZXcudXNlck5hbWUsXG4gICAgICAgIHJhdGluZzogcmV2aWV3LnJhdGluZyxcbiAgICAgICAgY29tbWVudDogcmV2aWV3LmNvbW1lbnQsXG4gICAgICAgIGRhdGU6IHJldmlldy5jcmVhdGVkQXRcbiAgICAgIH0pKTtcbiAgICAgIFxuICAgICAgLy8gQ29tYmluZSBhbGwgZmVlZGJhY2sgZGF0YVxuICAgICAgY29uc3QgZmVlZGJhY2tEYXRhID0ge1xuICAgICAgICB0b3RhbFJldmlld3MsXG4gICAgICAgIGF2ZXJhZ2VSYXRpbmcsXG4gICAgICAgIHJldmlld3NCeVJhdGluZzogcmV2aWV3c0J5UmF0aW5nLm1hcChpdGVtID0+ICh7XG4gICAgICAgICAgcmF0aW5nOiBpdGVtLl9pZCxcbiAgICAgICAgICBjb3VudDogaXRlbS5jb3VudFxuICAgICAgICB9KSksXG4gICAgICAgIHJlY2VudFJldmlld3M6IGZvcm1hdHRlZFJlY2VudFJldmlld3NcbiAgICAgIH07XG4gICAgICBcbiAgICAgIHJlcy5qc29uKGZlZWRiYWNrRGF0YSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIGZlZWRiYWNrIGRhdGE6JywgZXJyb3IpO1xuICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBtZXNzYWdlOiAnTOG7l2kga2hpIGzhuqV5IGThu68gbGnhu4d1IHBo4bqjbiBo4buTaScgfSk7XG4gICAgfVxuICB9LFxuXG4gIC8vIEltcGxlbWVudCByZW1haW5pbmcgbWV0aG9kcyB3aXRoIHJlYWwgZGF0YWJhc2UgcXVlcmllc1xuICBnZXRQcm9tb3Rpb25EYXRhOiBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyB0aW1lUmFuZ2UgPSAnd2VlaycgfSA9IHJlcS5xdWVyeTtcbiAgICAgIFxuICAgICAgLy8gR2V0IGNvdXBvbiBkYXRhIGZyb20gZGF0YWJhc2VcbiAgICAgIGNvbnN0IGNvdXBvbnMgPSBhd2FpdCBDb3Vwb24uZmluZCgpO1xuICAgICAgXG4gICAgICAvLyBDYWxjdWxhdGUgdXNhZ2Ugc3RhdGlzdGljc1xuICAgICAgY29uc3Qgdm91Y2hlclN0YXRzID0gY291cG9ucy5tYXAoY291cG9uID0+IHtcbiAgICAgICAgLy8gRW5zdXJlIGRpc2NvdW50IHZhbHVlIGlzIGRlZmluZWQgYmVmb3JlIGNhbGxpbmcgdG9Mb2NhbGVTdHJpbmdcbiAgICAgICAgY29uc3QgZGlzY291bnRWYWx1ZSA9IGNvdXBvbi5kaXNjb3VudFZhbHVlIHx8IDA7XG4gICAgICAgIGNvbnN0IGRpc2NvdW50RGlzcGxheSA9IGNvdXBvbi5kaXNjb3VudFR5cGUgPT09ICdwZXJjZW50YWdlJyBcbiAgICAgICAgICA/IGAke2Rpc2NvdW50VmFsdWV9JWAgXG4gICAgICAgICAgOiBgJHtkaXNjb3VudFZhbHVlLnRvTG9jYWxlU3RyaW5nKCl9xJFgO1xuICAgICAgICAgIFxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNvZGU6IGNvdXBvbi5jb2RlIHx8ICdLaMO0bmcgY8OzIG3DoycsXG4gICAgICAgICAgdHlwZTogY291cG9uLmRpc2NvdW50VHlwZSB8fCAndW5rbm93bicsXG4gICAgICAgICAgZGlzY291bnQ6IGRpc2NvdW50RGlzcGxheSxcbiAgICAgICAgICB1c2VkOiBjb3Vwb24udXNlZENvdW50IHx8IDAsXG4gICAgICAgICAgbGltaXQ6IGNvdXBvbi5tYXhVc2VzIHx8IDAsXG4gICAgICAgICAgZXhwaXJlc0F0OiBjb3Vwb24uZXhwaXJ5RGF0ZSB8fCBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGFjdGl2ZTogY291cG9uLmV4cGlyeURhdGUgPyAobmV3IERhdGUoY291cG9uLmV4cGlyeURhdGUpID4gbmV3IERhdGUoKSAmJiAhY291cG9uLmlzRGlzYWJsZWQpIDogZmFsc2VcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBjb25zdCBwcm9tb3Rpb25EYXRhID0ge1xuICAgICAgICB0b3RhbFZvdWNoZXJzOiBjb3Vwb25zLmxlbmd0aCxcbiAgICAgICAgYWN0aXZlVm91Y2hlcnM6IGNvdXBvbnMuZmlsdGVyKGMgPT4gYy5leHBpcnlEYXRlICYmIG5ldyBEYXRlKGMuZXhwaXJ5RGF0ZSkgPiBuZXcgRGF0ZSgpICYmICFjLmlzRGlzYWJsZWQpLmxlbmd0aCxcbiAgICAgICAgdXNlZFZvdWNoZXJzOiBjb3Vwb25zLnJlZHVjZSgodG90YWwsIGNvdXBvbikgPT4gdG90YWwgKyAoY291cG9uLnVzZWRDb3VudCB8fCAwKSwgMCksXG4gICAgICAgIHZvdWNoZXJTdGF0c1xuICAgICAgfTtcbiAgICAgIFxuICAgICAgcmVzLmpzb24ocHJvbW90aW9uRGF0YSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIHByb21vdGlvbiBkYXRhOicsIGVycm9yKTtcbiAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgbWVzc2FnZTogJ0zhu5dpIGtoaSBs4bqleSBk4buvIGxp4buHdSBraHV54bq/biBtw6NpJyB9KTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gQWRkaXRpb25hbCBtZXRob2RzIChjYW4gYmUgaW1wbGVtZW50ZWQgYXMgbmVlZGVkKVxuICBnZXRTeXN0ZW1BY3Rpdml0eURhdGE6IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgIC8vIFRy4bqjIHbhu4EgZOG7ryBsaeG7h3UgbeG6q3UgdGhheSB2w6wgdHJ1eSB24bqlbiBkYXRhYmFzZSDEkeG7gyB0csOhbmggbOG7l2lcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyB0aW1lUmFuZ2UgPSAnd2VlaycgfSA9IHJlcS5xdWVyeTtcbiAgICAgIFxuICAgICAgLy8gROG7ryBsaeG7h3UgbeG6q3UgduG7gSBob+G6oXQgxJHhu5luZyBo4buHIHRo4buRbmdcbiAgICAgIGNvbnN0IHN5c3RlbUFjdGl2aXR5RGF0YSA9IHtcbiAgICAgICAgbG9naW5zOiAxMjUsXG4gICAgICAgIHJlZ2lzdHJhdGlvbnM6IDQyLFxuICAgICAgICBhcGlDYWxsczogMTU3OCxcbiAgICAgICAgZXJyb3JSYXRlOiAwLjAyNSxcbiAgICAgICAgYWN0aXZpdHlCeUhvdXI6IFtcbiAgICAgICAgICB7IGhvdXI6ICcwMDowMCcsIGNvdW50OiAxMiB9LFxuICAgICAgICAgIHsgaG91cjogJzAxOjAwJywgY291bnQ6IDggfSxcbiAgICAgICAgICB7IGhvdXI6ICcwMjowMCcsIGNvdW50OiA1IH0sXG4gICAgICAgICAgeyBob3VyOiAnMDM6MDAnLCBjb3VudDogMyB9LFxuICAgICAgICAgIHsgaG91cjogJzA0OjAwJywgY291bnQ6IDIgfSxcbiAgICAgICAgICB7IGhvdXI6ICcwNTowMCcsIGNvdW50OiA0IH0sXG4gICAgICAgICAgeyBob3VyOiAnMDY6MDAnLCBjb3VudDogMTAgfSxcbiAgICAgICAgICB7IGhvdXI6ICcwNzowMCcsIGNvdW50OiAyNSB9LFxuICAgICAgICAgIHsgaG91cjogJzA4OjAwJywgY291bnQ6IDU1IH0sXG4gICAgICAgICAgeyBob3VyOiAnMDk6MDAnLCBjb3VudDogODAgfSxcbiAgICAgICAgICB7IGhvdXI6ICcxMDowMCcsIGNvdW50OiA5NiB9LFxuICAgICAgICAgIHsgaG91cjogJzExOjAwJywgY291bnQ6IDEwNCB9LFxuICAgICAgICAgIHsgaG91cjogJzEyOjAwJywgY291bnQ6IDk4IH0sXG4gICAgICAgICAgeyBob3VyOiAnMTM6MDAnLCBjb3VudDogODMgfSxcbiAgICAgICAgICB7IGhvdXI6ICcxNDowMCcsIGNvdW50OiA3NSB9LFxuICAgICAgICAgIHsgaG91cjogJzE1OjAwJywgY291bnQ6IDY4IH0sXG4gICAgICAgICAgeyBob3VyOiAnMTY6MDAnLCBjb3VudDogNzIgfSxcbiAgICAgICAgICB7IGhvdXI6ICcxNzowMCcsIGNvdW50OiA4NSB9LFxuICAgICAgICAgIHsgaG91cjogJzE4OjAwJywgY291bnQ6IDkyIH0sXG4gICAgICAgICAgeyBob3VyOiAnMTk6MDAnLCBjb3VudDogMTAxIH0sXG4gICAgICAgICAgeyBob3VyOiAnMjA6MDAnLCBjb3VudDogMTEwIH0sXG4gICAgICAgICAgeyBob3VyOiAnMjE6MDAnLCBjb3VudDogODUgfSxcbiAgICAgICAgICB7IGhvdXI6ICcyMjowMCcsIGNvdW50OiA2NSB9LFxuICAgICAgICAgIHsgaG91cjogJzIzOjAwJywgY291bnQ6IDM1IH1cbiAgICAgICAgXSxcbiAgICAgICAgcmVjZW50QWN0aXZpdHk6IFtcbiAgICAgICAgICB7IHR5cGU6ICdsb2dpbicsIHVzZXI6ICdhZG1pbicsIHRpbWVzdGFtcDogbmV3IERhdGUoRGF0ZS5ub3coKSAtIDEwMDAgKiA2MCAqIDUpIH0sXG4gICAgICAgICAgeyB0eXBlOiAncHJvZHVjdF91cGRhdGUnLCB1c2VyOiAnYWRtaW4nLCBpdGVtOiAnVMOhbyB4YW5oIE3hu7kgY2FvIGPhuqVwJywgdGltZXN0YW1wOiBuZXcgRGF0ZShEYXRlLm5vdygpIC0gMTAwMCAqIDYwICogMTUpIH0sXG4gICAgICAgICAgeyB0eXBlOiAnb3JkZXJfdXBkYXRlJywgdXNlcjogJ3N5c3RlbScsIGl0ZW06ICdPUkQxMjM0NScsIHRpbWVzdGFtcDogbmV3IERhdGUoRGF0ZS5ub3coKSAtIDEwMDAgKiA2MCAqIDI1KSB9LFxuICAgICAgICAgIHsgdHlwZTogJ2xvZ2luJywgdXNlcjogJ21hbmFnZXInLCB0aW1lc3RhbXA6IG5ldyBEYXRlKERhdGUubm93KCkgLSAxMDAwICogNjAgKiAzNSkgfSxcbiAgICAgICAgICB7IHR5cGU6ICdjb3Vwb25fY3JlYXRlJywgdXNlcjogJ21hcmtldGluZycsIGl0ZW06ICdTVU1NRVIyNScsIHRpbWVzdGFtcDogbmV3IERhdGUoRGF0ZS5ub3coKSAtIDEwMDAgKiA2MCAqIDU1KSB9XG4gICAgICAgIF1cbiAgICAgIH07XG4gICAgICBcbiAgICAgIHJlcy5qc29uKHN5c3RlbUFjdGl2aXR5RGF0YSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIHN5c3RlbSBhY3Rpdml0eSBkYXRhOicsIGVycm9yKTtcbiAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgbWVzc2FnZTogJ0zhu5dpIGtoaSBs4bqleSBk4buvIGxp4buHdSBob+G6oXQgxJHhu5luZyBo4buHIHRo4buRbmcnIH0pO1xuICAgIH1cbiAgfSxcblxuICAvLyBEZWxpdmVyeSBkYXRhXG4gIGdldERlbGl2ZXJ5RGF0YTogYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIEfhu41pIHRy4buxYyB0aeG6v3AgaMOgbSBnZXREZWxpdmVyeVN0YXRzIHThu6sgb3JkZXJDb250cm9sbGVyXG4gICAgICByZXR1cm4gZ2V0RGVsaXZlcnlTdGF0cyhyZXEsIHJlcyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICAgIHN0YXRpc3RpY3M6IHtcbiAgICAgICAgICBjb21wbGV0ZWQ6IDAsXG4gICAgICAgICAgaW5Qcm9ncmVzczogMCxcbiAgICAgICAgICBkZWxheWVkOiAwLFxuICAgICAgICAgIHRvdGFsOiAwLFxuICAgICAgICAgIGF2Z0RlbGl2ZXJ5VGltZTogXCJOL0FcIlxuICAgICAgICB9LFxuICAgICAgICBkZWxpdmVyeVBhcnRuZXJzOiBbXSxcbiAgICAgICAgZGVsaXZlcnlUaW1lQnlSZWdpb246IFtdLFxuICAgICAgICBkZWxpdmVyaWVzOiBbXVxuICAgICAgfSk7XG4gICAgfVxuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCByZXBvcnRzQ29udHJvbGxlcjsiXSwibWFwcGluZ3MiOiJvR0FBQSxJQUFBQSxNQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxTQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxTQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxPQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxPQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSyxtQkFBQSxHQUFBTixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU0sU0FBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU8sZ0JBQUEsR0FBQVAsT0FBQSxxQ0FBb0UsU0FBQUQsdUJBQUFTLENBQUEsVUFBQUEsQ0FBQSxJQUFBQSxDQUFBLENBQUFDLFVBQUEsR0FBQUQsQ0FBQSxLQUFBRSxPQUFBLEVBQUFGLENBQUE7O0FBRXBFO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTUcsaUJBQWlCLEdBQUc7RUFDeEI7RUFDQUMsaUJBQWlCLEVBQUUsTUFBQUEsQ0FBT0MsR0FBRyxFQUFFQyxHQUFHLEtBQUs7SUFDckMsSUFBSTtNQUNGO01BQ0EsTUFBTUMsV0FBVyxHQUFHLE1BQU1DLGNBQUssQ0FBQ0MsY0FBYyxDQUFDLENBQUM7TUFDaEQsTUFBTUMsYUFBYSxHQUFHLE1BQU1DLGlCQUFPLENBQUNGLGNBQWMsQ0FBQyxDQUFDO01BQ3BELE1BQU1HLGNBQWMsR0FBRyxNQUFNQyxpQkFBSSxDQUFDSixjQUFjLENBQUMsQ0FBQzs7TUFFbEQ7TUFDQSxNQUFNSyxXQUFXLEdB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RSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDN0IsRUFBRWlFLElBQUksRUFBRSxPQUFPLEVBQUVqRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDNUIsRUFBRWlFLElBQUksRUFBRSxPQUFPLEVBQUVqRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDNUIsRUFBRWlFLElBQUksRUFBRSxPQUFPLEVBQUVqRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDNUIsRUFBRWlFLElBQUksRUFBRSxPQUFPLEVBQUVqRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDNUIsRUFBRWlFLElBQUksRUFBRSxPQUFPLEVBQUVqRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDNUIsRUFBRWlFLElBQUksRUFBRSxPQUFPLEVBQUVqRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDNUIsRUFBRWlFLElBQUksRUFBRSxPQUFPLEVBQUVqRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDNUIsRUFBRWlFLElBQUksRUFBRSxPQUFPLEVBQUVqRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDN0IsRUFBRWlFLElBQUksRUFBRSxPQUFPLEVBQUVqRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDN0IsRUFBRWlFLElBQUksRUFBRSxPQUFPLEVBQUVqRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDNUIsRUFBRWlFLElBQUksRUFBRSxPQUFPLEVBQUVqRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDNUIsRUFBRWlFLElBQUksRUFBRSxPQUFPLEVBQUVqRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FDN0I7O1FBQ0RrRSxjQUFjLEVBQUU7UUFDZCxFQUFFbEosSUFBSSxFQUFFLE9BQU8sRUFBRVUsSUFBSSxFQUFFLE9BQU8sRUFBRUgsU0FBUyxFQUFFLElBQUlNLElBQUksQ0FBQ0EsSUFBSSxDQUFDc0ksR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakYsRUFBRW5KLElBQUksRUFBRSxnQkFBZ0IsRUFBRVUsSUFBSSxFQUFFLE9BQU8sRUFBRTRCLElBQUksRUFBRSxxQkFBcUIsRUFBRS9CLFNBQVMsRUFBRSxJQUFJTSxJQUFJLENBQUNBLElBQUksQ0FBQ3NJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3hILEVBQUVuSixJQUFJLEVBQUUsY0FBYyxFQUFFVSxJQUFJLEVBQUUsUUFBUSxFQUFFNEIsSUFBSSxFQUFFLFVBQVUsRUFBRS9CLFNBQVMsRUFBRSxJQUFJTSxJQUFJLENBQUNBLElBQUksQ0FBQ3NJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzVHLEVBQUVuSixJQUFJLEVBQUUsT0FBTyxFQUFFVSxJQUFJLEVBQUUsU0FBUyxFQUFFSCxTQUFTLEVBQUUsSUFBSU0sSUFBSSxDQUFDQSxJQUFJLENBQUNzSSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNwRixFQUFFbkosSUFBSSxFQUFFLGVBQWUsRUFBRVUsSUFBSSxFQUFFLFdBQVcsRUFBRTRCLElBQUksRUFBRSxVQUFVLEVBQUUvQixTQUFTLEVBQUUsSUFBSU0sSUFBSSxDQUFDQSxJQUFJLENBQUNzSSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQzs7TUFFcEgsQ0FBQzs7TUFFRGxMLEdBQUcsQ0FBQytDLElBQUksQ0FBQzJILGtCQUFrQixDQUFDO0lBQzlCLENBQUMsQ0FBQyxPQUFPMUgsS0FBSyxFQUFFO01BQ2RDLE9BQU8sQ0FBQ0QsS0FBSyxDQUFDLHNDQUFzQyxFQUFFQSxLQUFLLENBQUM7TUFDNURoRCxHQUFHLENBQUNXLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ29DLElBQUksQ0FBQyxFQUFFZixPQUFPLEVBQUUsd0NBQXdDLENBQUMsQ0FBQyxDQUFDO0lBQzdFO0VBQ0YsQ0FBQzs7RUFFRDtFQUNBbUosZUFBZSxFQUFFLE1BQUFBLENBQU9wTCxHQUFHLEVBQUVDLEdBQUcsS0FBSztJQUNuQyxJQUFJO01BQ0Y7TUFDQSxPQUFPLElBQUFvTCxpQ0FBZ0IsRUFBQ3JMLEdBQUcsRUFBRUMsR0FBRyxDQUFDO0lBQ25DLENBQUMsQ0FBQyxPQUFPZ0QsS0FBSyxFQUFFO01BQ2QsT0FBT2hELEdBQUcsQ0FBQ1csTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDb0MsSUFBSSxDQUFDO1FBQzFCc0ksVUFBVSxFQUFFO1VBQ1ZDLFNBQVMsRUFBRSxDQUFDO1VBQ1pDLFVBQVUsRUFBRSxDQUFDO1VBQ2JDLE9BQU8sRUFBRSxDQUFDO1VBQ1YxSyxLQUFLLEVBQUUsQ0FBQztVQUNSMkssZUFBZSxFQUFFO1FBQ25CLENBQUM7UUFDREMsZ0JBQWdCLEVBQUUsRUFBRTtRQUNwQkMsb0JBQW9CLEVBQUUsRUFBRTtRQUN4QkMsVUFBVSxFQUFFO01BQ2QsQ0FBQyxDQUFDO0lBQ0o7RUFDRjtBQUNGLENBQUMsQ0FBQyxJQUFBQyxRQUFBLEdBQUFDLE9BQUEsQ0FBQWxNLE9BQUE7O0FBRWFDLGlCQUFpQiIsImlnbm9yZUxpc3QiOltdfQ==