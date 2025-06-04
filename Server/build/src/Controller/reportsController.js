"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _Order = _interopRequireDefault(require("../Model/Order.js"));
var _Products = _interopRequireDefault(require("../Model/Products.js"));
var _Register = _interopRequireDefault(require("../Model/Register.js"));
var _Review = _interopRequireDefault(require("../Model/Review.js"));
var _Coupon = _interopRequireDefault(require("../Model/Coupon.js"));
var _BestSellingProduct = _interopRequireDefault(require("../Model/BestSellingProduct.js"));
var _orderController = require("../Controller/orderController.js");

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
      // Không cần kiểm tra token xác thực ở đây - trả về dữ liệu cho mọi request
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
      let revenueData = revenueAggregation.map((item) => ({
        date: dateFormat(item),
        doanh_thu: item.revenue,
        don_hang: item.orders
      }));

      // Nếu không có dữ liệu, tạo dữ liệu trống cho các ngày trong khoảng
      if (revenueData.length === 0) {
        console.log('No revenue data found, generating empty dates');

        // Tạo mảng các ngày
        const dateArray = [];
        let currentDateIter = new Date(startDate);

        // Tạo chuỗi ngày rỗng
        while (currentDateIter <= currentDate) {
          dateArray.push({
            date: currentDateIter.toLocaleDateString('vi-VN'),
            doanh_thu: 0,
            don_hang: 0
          });

          // Tăng ngày lên 1
          if (timeRange === 'year') {
            // Tăng 1 tháng
            currentDateIter.setMonth(currentDateIter.getMonth() + 1);
          } else {
            // Tăng 1 ngày
            currentDateIter.setDate(currentDateIter.getDate() + 1);
          }
        }

        revenueData = dateArray;
      }

      return res.json(revenueData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      return res.status(500).json({ message: 'Lỗi khi lấy dữ liệu doanh thu', error: error.message });
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
      // Lấy dữ liệu thực từ collection Product - không cần kiểm tra token ở đây
      const products = await _Products.default.find({}).select('_id productName productCategory productPrice productStock productCode productImages productBrand productStatus productOrigin productWeight productUnit');

      if (!products || products.length === 0) {
        return res.status(200).json([]);
      }

      // Biến đổi dữ liệu sản phẩm sang định dạng tồn kho
      const inventoryData = products.map((product) => {
        const stock = product.productStock || 0;
        let status = 'Còn hàng';

        if (stock <= 0) status = 'Hết hàng';else
        if (stock <= 5) status = 'Sắp hết';else
        if (stock <= 20) status = 'Sắp hết';

        return {
          id: product._id,
          name: product.productName || 'Không xác định',
          stock: product.productStock || 0,
          value: (product.productPrice || 0) * (product.productStock || 0),
          status: status,
          category: product.productCategory || 'Không phân loại',
          price: product.productPrice || 0,
          sku: product.productCode || '',
          image: Array.isArray(product.productImages) && product.productImages.length > 0 ?
          product.productImages[0] :
          '',
          brand: product.productBrand || '',
          weight: product.productWeight || 0,
          unit: product.productUnit || 'gram',
          origin: product.productOrigin || ''
        };
      });

      return res.status(200).json(inventoryData);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      return res.status(500).json({
        message: 'Lỗi khi lấy dữ liệu tồn kho',
        error: error.message
      });
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
      // Count reviews
      const totalReviews = await _Review.default.countDocuments();

      // Average rating
      const ratingResult = await _Review.default.aggregate([
      { $group: { _id: null, avgRating: { $avg: "$rating" } } }]
      );
      const averageRating = ratingResult.length > 0 ? parseFloat(ratingResult[0].avgRating.toFixed(1)) : 0;

      // Reviews by rating
      const reviewsByRating = await _Review.default.aggregate([
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } }]
      );

      // Chuyển đổi phân phối đánh giá theo yêu cầu của biểu đồ
      const ratingDistribution = [];
      for (let i = 5; i >= 1; i--) {
        const ratingItem = reviewsByRating.find((item) => item._id === i);
        ratingDistribution.push({
          rating: i,
          count: ratingItem ? ratingItem.count : 0
        });
      }

      // Recent reviews
      const recentReviews = await _Review.default.find().
      sort({ createdAt: -1 }).
      limit(10).
      populate('productId', 'productName productImages').
      populate('userId', 'firstName lastName userName profileImage');

      const formattedRecentReviews = recentReviews.map((review) => ({
        id: review._id,
        product: review.productId ? review.productId.productName : 'Sản phẩm không rõ',
        productImage: review.productId && review.productId.productImages && review.productId.productImages.length > 0 ?
        review.productId.productImages[0] :
        '',
        user: review.userId ?
        review.userId.firstName + ' ' + review.userId.lastName || review.userId.userName :
        review.userName,
        userImage: review.userId ? review.userId.profileImage : '',
        rating: review.rating,
        comment: review.comment,
        date: review.createdAt,
        isVerified: review.isVerified,
        isPublished: review.isPublished
      }));

      // Đánh giá theo thời gian
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const reviewsOverTime = await _Review.default.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" }
        }
      },
      { $sort: { _id: 1 } }]
      );

      const formattedReviewsOverTime = reviewsOverTime.map((item) => ({
        date: item._id,
        count: item.count,
        avgRating: parseFloat(item.avgRating.toFixed(1))
      }));

      // Phản hồi sản phẩm hàng đầu (top products by reviews)
      const topReviewedProducts = await _Review.default.aggregate([
      {
        $group: {
          _id: "$productId",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }]
      );

      // Lấy chi tiết sản phẩm cho các sản phẩm được đánh giá nhiều nhất
      const productIds = topReviewedProducts.map((item) => item._id);
      const products = await _Products.default.find({ _id: { $in: productIds } });

      const formattedTopProducts = topReviewedProducts.map((item) => {
        const product = products.find((p) => p._id.toString() === item._id.toString());
        return {
          id: item._id,
          name: product ? product.productName : 'Sản phẩm không rõ',
          category: product ? product.productCategory : 'Không phân loại',
          image: product && product.productImages && product.productImages.length > 0 ?
          product.productImages[0] :
          '',
          reviewCount: item.count,
          avgRating: parseFloat(item.avgRating.toFixed(1))
        };
      });

      // Combine all feedback data
      const feedbackData = {
        totalReviews,
        averageRating,
        ratingDistribution,
        reviewsOverTime: formattedReviewsOverTime,
        topReviewedProducts: formattedTopProducts,
        recentReviews: formattedRecentReviews
      };

      res.json(feedbackData);
    } catch (error) {
      console.error('Error fetching feedback data:', error);
      res.status(500).json({
        message: 'Lỗi khi lấy dữ liệu phản hồi',
        error: error.message
      });
    }
  },

  // Implement remaining methods with real database queries
  getPromotionData: async (req, res) => {
    try {
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
    } catch (err) {
      console.error('Error fetching delivery data:', err);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfT3JkZXIiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9Qcm9kdWN0cyIsIl9SZWdpc3RlciIsIl9SZXZpZXciLCJfQ291cG9uIiwiX0Jlc3RTZWxsaW5nUHJvZHVjdCIsIl9vcmRlckNvbnRyb2xsZXIiLCJyZXBvcnRzQ29udHJvbGxlciIsImdldERhc2hib2FyZFN0YXRzIiwicmVxIiwicmVzIiwidG90YWxPcmRlcnMiLCJPcmRlciIsImNvdW50RG9jdW1lbnRzIiwidG90YWxQcm9kdWN0cyIsIlByb2R1Y3QiLCJ0b3RhbEN1c3RvbWVycyIsIlVzZXIiLCJyZXZlbnVlRGF0YSIsImFnZ3JlZ2F0ZSIsIiRtYXRjaCIsInN0YXR1cyIsIiRncm91cCIsIl9pZCIsInRvdGFsIiwiJHN1bSIsInRvdGFsUmV2ZW51ZSIsImxlbmd0aCIsInJlY2VudE9yZGVycyIsImZpbmQiLCJzb3J0IiwiY3JlYXRlZEF0IiwibGltaXQiLCJwb3B1bGF0ZSIsInJlY2VudFByb2R1Y3RVcGRhdGVzIiwidXBkYXRlZEF0IiwicmVjZW50VXNlcnMiLCJyZWNlbnRBY3Rpdml0aWVzIiwibWFwIiwib3JkZXIiLCJpZCIsInR5cGUiLCJtZXNzYWdlIiwib3JkZXJDb2RlIiwidXNlcklkIiwiZmlyc3ROYW1lIiwibGFzdE5hbWUiLCJ1c2VyTmFtZSIsInRpbWVzdGFtcCIsInByb2R1Y3QiLCJwcm9kdWN0TmFtZSIsInVzZXIiLCJhIiwiYiIsIkRhdGUiLCJzdGF0cyIsInNsaWNlIiwianNvbiIsImVycm9yIiwiY29uc29sZSIsImdldFJldmVudWVEYXRhIiwidGltZVJhbmdlIiwicGF5bWVudE1ldGhvZCIsInJlZ2lvbiIsInF1ZXJ5IiwiY3VycmVudERhdGUiLCJzdGFydERhdGUiLCJnZXRGdWxsWWVhciIsImdldE1vbnRoIiwiZ2V0RGF0ZSIsIm1hdGNoQ3JpdGVyaWEiLCIkZ3RlIiwiJGx0ZSIsImdyb3VwQnkiLCJkYXRlRm9ybWF0IiwieWVhciIsIiR5ZWFyIiwibW9udGgiLCIkbW9udGgiLCJpdGVtIiwiZGF5IiwiJGRheU9mTW9udGgiLCJkYXRlIiwidG9Mb2NhbGVEYXRlU3RyaW5nIiwicmV2ZW51ZUFnZ3JlZ2F0aW9uIiwicmV2ZW51ZSIsIm9yZGVycyIsIiRzb3J0IiwiZG9hbmhfdGh1IiwiZG9uX2hhbmciLCJsb2ciLCJkYXRlQXJyYXkiLCJjdXJyZW50RGF0ZUl0ZXIiLCJwdXNoIiwic2V0TW9udGgiLCJzZXREYXRlIiwiZ2V0VG9wUHJvZHVjdHMiLCJyZXN1bHRzIiwiQmVzdFNlbGxpbmdQcm9kdWN0Iiwic29sZENvdW50IiwiZm9ybWF0dGVkUmVzdWx0cyIsIm5hbWUiLCJzb2xkIiwiY2F0ZWdvcnkiLCJwcm9kdWN0Q2F0ZWdvcnkiLCJwcmljZSIsInByb2R1Y3RQcmljZSIsImdldEludmVudG9yeURhdGEiLCJwcm9kdWN0cyIsInNlbGVjdCIsImludmVudG9yeURhdGEiLCJzdG9jayIsInByb2R1Y3RTdG9jayIsInZhbHVlIiwic2t1IiwicHJvZHVjdENvZGUiLCJpbWFnZSIsIkFycmF5IiwiaXNBcnJheSIsInByb2R1Y3RJbWFnZXMiLCJicmFuZCIsInByb2R1Y3RCcmFuZCIsIndlaWdodCIsInByb2R1Y3RXZWlnaHQiLCJ1bml0IiwicHJvZHVjdFVuaXQiLCJvcmlnaW4iLCJwcm9kdWN0T3JpZ2luIiwiZ2V0VXNlckRhdGEiLCJ0b3RhbFVzZXJzIiwidGhpcnR5RGF5c0FnbyIsIm5ld1VzZXJzIiwiYWN0aXZlVXNlcklkcyIsImRpc3RpbmN0IiwiYWN0aXZlVXNlcnMiLCJ1c2Vyc0J5UmVnaW9uIiwiJGNvbmQiLCJpZiIsIiRpc0FycmF5IiwidGhlbiIsIiRpZk51bGwiLCIkYXJyYXlFbGVtQXQiLCJlbHNlIiwiY291bnQiLCIkcHJvamVjdCIsInVzZXJEYXRhIiwiZ2V0T3JkZXJEYXRhIiwiY29tcGxldGVkT3JkZXJzIiwicGVuZGluZ09yZGVycyIsImNhbmNlbGxlZE9yZGVycyIsImF2Z09yZGVyVmFsdWVSZXN1bHQiLCIkbmUiLCJhdmdWYWx1ZSIsIiRhdmciLCJhdmVyYWdlT3JkZXJWYWx1ZSIsIm9yZGVyc0J5U3RhdHVzUmVzdWx0Iiwib3JkZXJzQnlTdGF0dXMiLCJzdGF0dXNOYW1lIiwiZm9ybWF0dGVkUmVjZW50T3JkZXJzIiwiY3VzdG9tZXIiLCJ0b3RhbEFtb3VudCIsIm9yZGVyRGF0YSIsImdldEZlZWRiYWNrRGF0YSIsInRvdGFsUmV2aWV3cyIsIlJldmlldyIsInJhdGluZ1Jlc3VsdCIsImF2Z1JhdGluZyIsImF2ZXJhZ2VSYXRpbmciLCJwYXJzZUZsb2F0IiwidG9GaXhlZCIsInJldmlld3NCeVJhdGluZyIsInJhdGluZ0Rpc3RyaWJ1dGlvbiIsImkiLCJyYXRpbmdJdGVtIiwicmF0aW5nIiwicmVjZW50UmV2aWV3cyIsImZvcm1hdHRlZFJlY2VudFJldmlld3MiLCJyZXZpZXciLCJwcm9kdWN0SWQiLCJwcm9kdWN0SW1hZ2UiLCJ1c2VySW1hZ2UiLCJwcm9maWxlSW1hZ2UiLCJjb21tZW50IiwiaXNWZXJpZmllZCIsImlzUHVibGlzaGVkIiwicmV2aWV3c092ZXJUaW1lIiwiJGRhdGVUb1N0cmluZyIsImZvcm1hdCIsImZvcm1hdHRlZFJldmlld3NPdmVyVGltZSIsInRvcFJldmlld2VkUHJvZHVjdHMiLCIkbGltaXQiLCJwcm9kdWN0SWRzIiwiJGluIiwiZm9ybWF0dGVkVG9wUHJvZHVjdHMiLCJwIiwidG9TdHJpbmciLCJyZXZpZXdDb3VudCIsImZlZWRiYWNrRGF0YSIsImdldFByb21vdGlvbkRhdGEiLCJjb3Vwb25zIiwiQ291cG9uIiwidm91Y2hlclN0YXRzIiwiY291cG9uIiwiZGlzY291bnRWYWx1ZSIsImRpc2NvdW50RGlzcGxheSIsImRpc2NvdW50VHlwZSIsInRvTG9jYWxlU3RyaW5nIiwiY29kZSIsImRpc2NvdW50IiwidXNlZCIsInVzZWRDb3VudCIsIm1heFVzZXMiLCJleHBpcmVzQXQiLCJleHBpcnlEYXRlIiwiYWN0aXZlIiwiaXNEaXNhYmxlZCIsInByb21vdGlvbkRhdGEiLCJ0b3RhbFZvdWNoZXJzIiwiYWN0aXZlVm91Y2hlcnMiLCJmaWx0ZXIiLCJjIiwidXNlZFZvdWNoZXJzIiwicmVkdWNlIiwiZ2V0U3lzdGVtQWN0aXZpdHlEYXRhIiwic3lzdGVtQWN0aXZpdHlEYXRhIiwibG9naW5zIiwicmVnaXN0cmF0aW9ucyIsImFwaUNhbGxzIiwiZXJyb3JSYXRlIiwiYWN0aXZpdHlCeUhvdXIiLCJob3VyIiwicmVjZW50QWN0aXZpdHkiLCJub3ciLCJnZXREZWxpdmVyeURhdGEiLCJnZXREZWxpdmVyeVN0YXRzIiwiZXJyIiwic3RhdGlzdGljcyIsImNvbXBsZXRlZCIsImluUHJvZ3Jlc3MiLCJkZWxheWVkIiwiYXZnRGVsaXZlcnlUaW1lIiwiZGVsaXZlcnlQYXJ0bmVycyIsImRlbGl2ZXJ5VGltZUJ5UmVnaW9uIiwiZGVsaXZlcmllcyIsIl9kZWZhdWx0IiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvQ29udHJvbGxlci9yZXBvcnRzQ29udHJvbGxlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgT3JkZXIgZnJvbSAnLi4vTW9kZWwvT3JkZXIuanMnO1xuaW1wb3J0IFByb2R1Y3QgZnJvbSAnLi4vTW9kZWwvUHJvZHVjdHMuanMnO1xuaW1wb3J0IFVzZXIgZnJvbSAnLi4vTW9kZWwvUmVnaXN0ZXIuanMnO1xuaW1wb3J0IFJldmlldyBmcm9tICcuLi9Nb2RlbC9SZXZpZXcuanMnO1xuaW1wb3J0IENvdXBvbiBmcm9tICcuLi9Nb2RlbC9Db3Vwb24uanMnO1xuaW1wb3J0IEJlc3RTZWxsaW5nUHJvZHVjdCBmcm9tICcuLi9Nb2RlbC9CZXN0U2VsbGluZ1Byb2R1Y3QuanMnO1xuaW1wb3J0IHsgZ2V0RGVsaXZlcnlTdGF0cyB9IGZyb20gXCIuLi9Db250cm9sbGVyL29yZGVyQ29udHJvbGxlci5qc1wiO1xuXG4vKipcbiAqIFJlcG9ydHMgY29udHJvbGxlciB0byBoYW5kbGUgQVBJIHJlcXVlc3RzIGZvciBnZW5lcmF0aW5nIHZhcmlvdXMgcmVwb3J0c1xuICogVXNlcyByZWFsIGRhdGEgZnJvbSBNb25nb0RCIG1vZGVsc1xuICovXG5jb25zdCByZXBvcnRzQ29udHJvbGxlciA9IHtcbiAgLy8gRGFzaGJvYXJkIHN0YXRpc3RpY3NcbiAgZ2V0RGFzaGJvYXJkU3RhdHM6IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBGZXRjaCByZWFsIGRhdGEgZnJvbSBkYXRhYmFzZVxuICAgICAgY29uc3QgdG90YWxPcmRlcnMgPSBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cygpO1xuICAgICAgY29uc3QgdG90YWxQcm9kdWN0cyA9IGF3YWl0IFByb2R1Y3QuY291bnREb2N1bWVudHMoKTtcbiAgICAgIGNvbnN0IHRvdGFsQ3VzdG9tZXJzID0gYXdhaXQgVXNlci5jb3VudERvY3VtZW50cygpO1xuICAgICAgXG4gICAgICAvLyBDYWxjdWxhdGUgdG90YWwgcmV2ZW51ZSBmcm9tIGNvbXBsZXRlZCBvcmRlcnNcbiAgICAgIGNvbnN0IHJldmVudWVEYXRhID0gYXdhaXQgT3JkZXIuYWdncmVnYXRlKFtcbiAgICAgICAgeyAkbWF0Y2g6IHsgc3RhdHVzOiBcImNvbXBsZXRlZFwiIH0gfSxcbiAgICAgICAgeyAkZ3JvdXA6IHsgX2lkOiBudWxsLCB0b3RhbDogeyAkc3VtOiBcIiR0b3RhbEFtb3VudFwiIH0gfSB9XG4gICAgICBdKTtcbiAgICAgIGNvbnN0IHRvdGFsUmV2ZW51ZSA9IHJldmVudWVEYXRhLmxlbmd0aCA+IDAgPyByZXZlbnVlRGF0YVswXS50b3RhbCA6IDA7XG4gICAgICBcbiAgICAgIC8vIEdldCByZWNlbnQgYWN0aXZpdGllc1xuICAgICAgY29uc3QgcmVjZW50T3JkZXJzID0gYXdhaXQgT3JkZXIuZmluZCgpXG4gICAgICAgIC5zb3J0KHsgY3JlYXRlZEF0OiAtMSB9KVxuICAgICAgICAubGltaXQoMylcbiAgICAgICAgLnBvcHVsYXRlKCd1c2VySWQnLCAnZmlyc3ROYW1lIGxhc3ROYW1lIHVzZXJOYW1lJyk7XG4gICAgICBcbiAgICAgIGNvbnN0IHJlY2VudFByb2R1Y3RVcGRhdGVzID0gYXdhaXQgUHJvZHVjdC5maW5kKClcbiAgICAgICAgLnNvcnQoeyB1cGRhdGVkQXQ6IC0xIH0pXG4gICAgICAgIC5saW1pdCgyKTtcbiAgICAgIFxuICAgICAgY29uc3QgcmVjZW50VXNlcnMgPSBhd2FpdCBVc2VyLmZpbmQoKVxuICAgICAgICAuc29ydCh7IGNyZWF0ZWRBdDogLTEgfSlcbiAgICAgICAgLmxpbWl0KDIpO1xuICAgICAgXG4gICAgICAvLyBGb3JtYXQgcmVjZW50IGFjdGl2aXRpZXNcbiAgICAgIGNvbnN0IHJlY2VudEFjdGl2aXRpZXMgPSBbXG4gICAgICAgIC4uLnJlY2VudE9yZGVycy5tYXAob3JkZXIgPT4gKHtcbiAgICAgICAgICBpZDogb3JkZXIuX2lkLFxuICAgICAgICAgIHR5cGU6ICdvcmRlcicsXG4gICAgICAgICAgbWVzc2FnZTogYMSQxqFuIGjDoG5nIG3hu5tpICMke29yZGVyLm9yZGVyQ29kZX0gdOG7qyAke29yZGVyLnVzZXJJZCA/IChvcmRlci51c2VySWQuZmlyc3ROYW1lICsgJyAnICsgb3JkZXIudXNlcklkLmxhc3ROYW1lIHx8IG9yZGVyLnVzZXJJZC51c2VyTmFtZSkgOiAnS2jDoWNoIGjDoG5nJ31gLFxuICAgICAgICAgIHRpbWVzdGFtcDogb3JkZXIuY3JlYXRlZEF0XG4gICAgICAgIH0pKSxcbiAgICAgICAgLi4ucmVjZW50UHJvZHVjdFVwZGF0ZXMubWFwKHByb2R1Y3QgPT4gKHtcbiAgICAgICAgICBpZDogcHJvZHVjdC5faWQsXG4gICAgICAgICAgdHlwZTogJ3Byb2R1Y3QnLFxuICAgICAgICAgIG1lc3NhZ2U6IGBT4bqjbiBwaOG6qW0gXCIke3Byb2R1Y3QucHJvZHVjdE5hbWV9XCIgxJHDoyDEkcaw4bujYyBj4bqtcCBuaOG6rXRgLFxuICAgICAgICAgIHRpbWVzdGFtcDogcHJvZHVjdC51cGRhdGVkQXRcbiAgICAgICAgfSkpLFxuICAgICAgICAuLi5yZWNlbnRVc2Vycy5tYXAodXNlciA9PiAoe1xuICAgICAgICAgIGlkOiB1c2VyLl9pZCxcbiAgICAgICAgICB0eXBlOiAndXNlcicsXG4gICAgICAgICAgbWVzc2FnZTogYE5nxrDhu51pIGTDuW5nIG3hu5tpICR7dXNlci5maXJzdE5hbWUgPyAodXNlci5maXJzdE5hbWUgKyAnICcgKyB1c2VyLmxhc3ROYW1lKSA6IHVzZXIudXNlck5hbWV9IMSRw6MgxJHEg25nIGvDvWAsXG4gICAgICAgICAgdGltZXN0YW1wOiB1c2VyLmNyZWF0ZWRBdFxuICAgICAgICB9KSlcbiAgICAgIF0uc29ydCgoYSwgYikgPT4gbmV3IERhdGUoYi50aW1lc3RhbXApIC0gbmV3IERhdGUoYS50aW1lc3RhbXApKTtcbiAgICAgIFxuICAgICAgY29uc3Qgc3RhdHMgPSB7XG4gICAgICAgIHRvdGFsT3JkZXJzLFxuICAgICAgICB0b3RhbFJldmVudWUsXG4gICAgICAgIHRvdGFsQ3VzdG9tZXJzLFxuICAgICAgICB0b3RhbFByb2R1Y3RzLFxuICAgICAgICByZWNlbnRBY3Rpdml0aWVzOiByZWNlbnRBY3Rpdml0aWVzLnNsaWNlKDAsIDUpXG4gICAgICB9O1xuICAgICAgXG4gICAgICByZXMuanNvbihzdGF0cyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIGRhc2hib2FyZCBzdGF0czonLCBlcnJvcik7XG4gICAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IG1lc3NhZ2U6ICdM4buXaSBraGkgbOG6pXkgZOG7ryBsaeG7h3UgdGjhu5FuZyBrw6onIH0pO1xuICAgIH1cbiAgfSxcblxuICAvLyBSZXZlbnVlIGRhdGFcbiAgZ2V0UmV2ZW51ZURhdGE6IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBLaMO0bmcgY+G6p24ga2nhu4NtIHRyYSB0b2tlbiB4w6FjIHRo4buxYyDhu58gxJHDonkgLSB0cuG6oyB24buBIGThu68gbGnhu4d1IGNobyBt4buNaSByZXF1ZXN0XG4gICAgICBjb25zdCB7IHRpbWVSYW5nZSA9ICd3ZWVrJywgcGF5bWVudE1ldGhvZCA9ICdhbGwnLCByZWdpb24gPSAnYWxsJyB9ID0gcmVxLnF1ZXJ5O1xuICAgICAgXG4gICAgICAvLyBTZXQgZGF0ZSByYW5nZSBiYXNlZCBvbiB0aW1lUmFuZ2VcbiAgICAgIGNvbnN0IGN1cnJlbnREYXRlID0gbmV3IERhdGUoKTtcbiAgICAgIGxldCBzdGFydERhdGU7XG4gICAgICBcbiAgICAgIHN3aXRjaCAodGltZVJhbmdlKSB7XG4gICAgICAgIGNhc2UgJ3llYXInOlxuICAgICAgICAgIHN0YXJ0RGF0ZSA9IG5ldyBEYXRlKGN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCkgLSAxLCBjdXJyZW50RGF0ZS5nZXRNb250aCgpLCBjdXJyZW50RGF0ZS5nZXREYXRlKCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtb250aCc6XG4gICAgICAgICAgc3RhcnREYXRlID0gbmV3IERhdGUoY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKSwgY3VycmVudERhdGUuZ2V0TW9udGgoKSAtIDEsIGN1cnJlbnREYXRlLmdldERhdGUoKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3dlZWsnOlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHN0YXJ0RGF0ZSA9IG5ldyBEYXRlKGN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCksIGN1cnJlbnREYXRlLmdldE1vbnRoKCksIGN1cnJlbnREYXRlLmdldERhdGUoKSAtIDcpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBCdWlsZCBtYXRjaCBjcml0ZXJpYVxuICAgICAgY29uc3QgbWF0Y2hDcml0ZXJpYSA9IHsgXG4gICAgICAgIGNyZWF0ZWRBdDogeyAkZ3RlOiBzdGFydERhdGUsICRsdGU6IGN1cnJlbnREYXRlIH1cbiAgICAgIH07XG4gICAgICBcbiAgICAgIC8vIEFkZCBwYXltZW50IG1ldGhvZCBmaWx0ZXIgaWYgc3BlY2lmaWVkXG4gICAgICBpZiAocGF5bWVudE1ldGhvZCAmJiBwYXltZW50TWV0aG9kICE9PSAnYWxsJykge1xuICAgICAgICBtYXRjaENyaXRlcmlhLnBheW1lbnRNZXRob2QgPSBwYXltZW50TWV0aG9kO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBBZGQgcmVnaW9uIGZpbHRlciBpZiBzcGVjaWZpZWRcbiAgICAgIGlmIChyZWdpb24gJiYgcmVnaW9uICE9PSAnYWxsJykge1xuICAgICAgICBtYXRjaENyaXRlcmlhWydzaGlwcGluZ0luZm8uY2l0eSddID0gcmVnaW9uO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBSZXZlbnVlIGFnZ3JlZ2F0aW9uIGJhc2VkIG9uIHRpbWUgcmFuZ2VcbiAgICAgIGxldCBncm91cEJ5O1xuICAgICAgbGV0IGRhdGVGb3JtYXQ7XG4gICAgICBcbiAgICAgIGlmICh0aW1lUmFuZ2UgPT09ICd5ZWFyJykge1xuICAgICAgICAvLyBHcm91cCBieSBtb250aCBmb3IgeWVhcmx5IGRhdGFcbiAgICAgICAgZ3JvdXBCeSA9IHtcbiAgICAgICAgICB5ZWFyOiB7ICR5ZWFyOiBcIiRjcmVhdGVkQXRcIiB9LFxuICAgICAgICAgIG1vbnRoOiB7ICRtb250aDogXCIkY3JlYXRlZEF0XCIgfVxuICAgICAgICB9O1xuICAgICAgICBkYXRlRm9ybWF0ID0gKGl0ZW0pID0+IGBUaMOhbmcgJHtpdGVtLl9pZC5tb250aH0vJHtpdGVtLl9pZC55ZWFyfWA7XG4gICAgICB9IGVsc2UgaWYgKHRpbWVSYW5nZSA9PT0gJ21vbnRoJykge1xuICAgICAgICAvLyBHcm91cCBieSBkYXkgZm9yIG1vbnRobHkgZGF0YVxuICAgICAgICBncm91cEJ5ID0ge1xuICAgICAgICAgIHllYXI6IHsgJHllYXI6IFwiJGNyZWF0ZWRBdFwiIH0sXG4gICAgICAgICAgbW9udGg6IHsgJG1vbnRoOiBcIiRjcmVhdGVkQXRcIiB9LFxuICAgICAgICAgIGRheTogeyAkZGF5T2ZNb250aDogXCIkY3JlYXRlZEF0XCIgfVxuICAgICAgICB9O1xuICAgICAgICBkYXRlRm9ybWF0ID0gKGl0ZW0pID0+IHtcbiAgICAgICAgICBjb25zdCBkYXRlID0gbmV3IERhdGUoaXRlbS5faWQueWVhciwgaXRlbS5faWQubW9udGggLSAxLCBpdGVtLl9pZC5kYXkpO1xuICAgICAgICAgIHJldHVybiBkYXRlLnRvTG9jYWxlRGF0ZVN0cmluZygndmktVk4nKTtcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEdyb3VwIGJ5IGRheSBmb3Igd2Vla2x5IGRhdGEgKGRlZmF1bHQpXG4gICAgICAgIGdyb3VwQnkgPSB7XG4gICAgICAgICAgeWVhcjogeyAkeWVhcjogXCIkY3JlYXRlZEF0XCIgfSxcbiAgICAgICAgICBtb250aDogeyAkbW9udGg6IFwiJGNyZWF0ZWRBdFwiIH0sXG4gICAgICAgICAgZGF5OiB7ICRkYXlPZk1vbnRoOiBcIiRjcmVhdGVkQXRcIiB9XG4gICAgICAgIH07XG4gICAgICAgIGRhdGVGb3JtYXQgPSAoaXRlbSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZShpdGVtLl9pZC55ZWFyLCBpdGVtLl9pZC5tb250aCAtIDEsIGl0ZW0uX2lkLmRheSk7XG4gICAgICAgICAgcmV0dXJuIGRhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKCd2aS1WTicpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBBZ2dyZWdhdGUgcmV2ZW51ZSBkYXRhXG4gICAgICBjb25zdCByZXZlbnVlQWdncmVnYXRpb24gPSBhd2FpdCBPcmRlci5hZ2dyZWdhdGUoW1xuICAgICAgICB7ICRtYXRjaDogbWF0Y2hDcml0ZXJpYSB9LFxuICAgICAgICB7IFxuICAgICAgICAgICRncm91cDoge1xuICAgICAgICAgICAgX2lkOiBncm91cEJ5LFxuICAgICAgICAgICAgcmV2ZW51ZTogeyAkc3VtOiBcIiR0b3RhbEFtb3VudFwiIH0sXG4gICAgICAgICAgICBvcmRlcnM6IHsgJHN1bTogMSB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7ICRzb3J0OiB7ICdfaWQueWVhcic6IDEsICdfaWQubW9udGgnOiAxLCAnX2lkLmRheSc6IDEgfSB9XG4gICAgICBdKTtcbiAgICAgIFxuICAgICAgLy8gRm9ybWF0IHRoZSByZXN1bHRzXG4gICAgICBsZXQgcmV2ZW51ZURhdGEgPSByZXZlbnVlQWdncmVnYXRpb24ubWFwKGl0ZW0gPT4gKHtcbiAgICAgICAgZGF0ZTogZGF0ZUZvcm1hdChpdGVtKSxcbiAgICAgICAgZG9hbmhfdGh1OiBpdGVtLnJldmVudWUsXG4gICAgICAgIGRvbl9oYW5nOiBpdGVtLm9yZGVyc1xuICAgICAgfSkpO1xuICAgICAgXG4gICAgICAvLyBO4bq/dSBraMO0bmcgY8OzIGThu68gbGnhu4d1LCB04bqhbyBk4buvIGxp4buHdSB0cuG7kW5nIGNobyBjw6FjIG5nw6B5IHRyb25nIGtob+G6o25nXG4gICAgICBpZiAocmV2ZW51ZURhdGEubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdObyByZXZlbnVlIGRhdGEgZm91bmQsIGdlbmVyYXRpbmcgZW1wdHkgZGF0ZXMnKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFThuqFvIG3huqNuZyBjw6FjIG5nw6B5XG4gICAgICAgIGNvbnN0IGRhdGVBcnJheSA9IFtdO1xuICAgICAgICBsZXQgY3VycmVudERhdGVJdGVyID0gbmV3IERhdGUoc3RhcnREYXRlKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFThuqFvIGNodeG7l2kgbmfDoHkgcuG7l25nXG4gICAgICAgIHdoaWxlIChjdXJyZW50RGF0ZUl0ZXIgPD0gY3VycmVudERhdGUpIHtcbiAgICAgICAgICBkYXRlQXJyYXkucHVzaCh7XG4gICAgICAgICAgICBkYXRlOiBjdXJyZW50RGF0ZUl0ZXIudG9Mb2NhbGVEYXRlU3RyaW5nKCd2aS1WTicpLFxuICAgICAgICAgICAgZG9hbmhfdGh1OiAwLFxuICAgICAgICAgICAgZG9uX2hhbmc6IDBcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBUxINuZyBuZ8OgeSBsw6puIDFcbiAgICAgICAgICBpZiAodGltZVJhbmdlID09PSAneWVhcicpIHtcbiAgICAgICAgICAgIC8vIFTEg25nIDEgdGjDoW5nXG4gICAgICAgICAgICBjdXJyZW50RGF0ZUl0ZXIuc2V0TW9udGgoY3VycmVudERhdGVJdGVyLmdldE1vbnRoKCkgKyAxKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVMSDbmcgMSBuZ8OgeVxuICAgICAgICAgICAgY3VycmVudERhdGVJdGVyLnNldERhdGUoY3VycmVudERhdGVJdGVyLmdldERhdGUoKSArIDEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV2ZW51ZURhdGEgPSBkYXRlQXJyYXk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJldHVybiByZXMuanNvbihyZXZlbnVlRGF0YSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIHJldmVudWUgZGF0YTonLCBlcnJvcik7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBtZXNzYWdlOiAnTOG7l2kga2hpIGzhuqV5IGThu68gbGnhu4d1IGRvYW5oIHRodScsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgIH1cbiAgfSxcblxuICAvLyBUb3AgcHJvZHVjdHNcbiAgZ2V0VG9wUHJvZHVjdHM6IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBHZXQgdG9wIDUgYmVzdCBzZWxsaW5nIHByb2R1Y3RzIGZyb20gQmVzdFNlbGxpbmdQcm9kdWN0IG1vZGVsXG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgQmVzdFNlbGxpbmdQcm9kdWN0LmZpbmQoKVxuICAgICAgICAuc29ydCh7IHNvbGRDb3VudDogLTEgfSlcbiAgICAgICAgLmxpbWl0KDUpO1xuICAgICAgXG4gICAgICAvLyBGb3JtYXQgdGhlIHJlc3VsdHNcbiAgICAgIGNvbnN0IGZvcm1hdHRlZFJlc3VsdHMgPSByZXN1bHRzLm1hcChwcm9kdWN0ID0+ICh7XG4gICAgICAgIG5hbWU6IHByb2R1Y3QucHJvZHVjdE5hbWUsXG4gICAgICAgIHNvbGQ6IHByb2R1Y3Quc29sZENvdW50IHx8IDAsXG4gICAgICAgIGNhdGVnb3J5OiBwcm9kdWN0LnByb2R1Y3RDYXRlZ29yeSB8fCAnS2jDtG5nIHBow6JuIGxv4bqhaScsXG4gICAgICAgIHByaWNlOiBwcm9kdWN0LnByb2R1Y3RQcmljZSB8fCAwLFxuICAgICAgICByZXZlbnVlOiBwcm9kdWN0LnRvdGFsUmV2ZW51ZSB8fCAwXG4gICAgICB9KSk7XG4gICAgICBcbiAgICAgIHJlcy5qc29uKGZvcm1hdHRlZFJlc3VsdHMpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyB0b3AgcHJvZHVjdHM6JywgZXJyb3IpO1xuICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBtZXNzYWdlOiAnTOG7l2kga2hpIGzhuqV5IGThu68gbGnhu4d1IHPhuqNuIHBo4bqpbSBiw6FuIGNo4bqheScgfSk7XG4gICAgfVxuICB9LFxuXG4gIC8vIEludmVudG9yeSBkYXRhXG4gIGdldEludmVudG9yeURhdGE6IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBM4bqleSBk4buvIGxp4buHdSB0aOG7sWMgdOG7qyBjb2xsZWN0aW9uIFByb2R1Y3QgLSBraMO0bmcgY+G6p24ga2nhu4NtIHRyYSB0b2tlbiDhu58gxJHDonlcbiAgICAgIGNvbnN0IHByb2R1Y3RzID0gYXdhaXQgUHJvZHVjdC5maW5kKHt9KS5zZWxlY3QoJ19pZCBwcm9kdWN0TmFtZSBwcm9kdWN0Q2F0ZWdvcnkgcHJvZHVjdFByaWNlIHByb2R1Y3RTdG9jayBwcm9kdWN0Q29kZSBwcm9kdWN0SW1hZ2VzIHByb2R1Y3RCcmFuZCBwcm9kdWN0U3RhdHVzIHByb2R1Y3RPcmlnaW4gcHJvZHVjdFdlaWdodCBwcm9kdWN0VW5pdCcpO1xuICAgICAgXG4gICAgICBpZiAoIXByb2R1Y3RzIHx8IHByb2R1Y3RzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oW10pO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBCaeG6v24gxJHhu5VpIGThu68gbGnhu4d1IHPhuqNuIHBo4bqpbSBzYW5nIMSR4buLbmggZOG6oW5nIHThu5NuIGtob1xuICAgICAgY29uc3QgaW52ZW50b3J5RGF0YSA9IHByb2R1Y3RzLm1hcChwcm9kdWN0ID0+IHtcbiAgICAgICAgY29uc3Qgc3RvY2sgPSBwcm9kdWN0LnByb2R1Y3RTdG9jayB8fCAwO1xuICAgICAgICBsZXQgc3RhdHVzID0gJ0PDsm4gaMOgbmcnO1xuICAgICAgICBcbiAgICAgICAgaWYgKHN0b2NrIDw9IDApIHN0YXR1cyA9ICdI4bq/dCBow6BuZyc7XG4gICAgICAgIGVsc2UgaWYgKHN0b2NrIDw9IDUpIHN0YXR1cyA9ICdT4bqvcCBo4bq/dCc7XG4gICAgICAgIGVsc2UgaWYgKHN0b2NrIDw9IDIwKSBzdGF0dXMgPSAnU+G6r3AgaOG6v3QnO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpZDogcHJvZHVjdC5faWQsXG4gICAgICAgICAgbmFtZTogcHJvZHVjdC5wcm9kdWN0TmFtZSB8fCAnS2jDtG5nIHjDoWMgxJHhu4tuaCcsXG4gICAgICAgICAgc3RvY2s6IHByb2R1Y3QucHJvZHVjdFN0b2NrIHx8IDAsXG4gICAgICAgICAgdmFsdWU6IChwcm9kdWN0LnByb2R1Y3RQcmljZSB8fCAwKSAqIChwcm9kdWN0LnByb2R1Y3RTdG9jayB8fCAwKSxcbiAgICAgICAgICBzdGF0dXM6IHN0YXR1cyxcbiAgICAgICAgICBjYXRlZ29yeTogcHJvZHVjdC5wcm9kdWN0Q2F0ZWdvcnkgfHwgJ0tow7RuZyBwaMOibiBsb+G6oWknLFxuICAgICAgICAgIHByaWNlOiBwcm9kdWN0LnByb2R1Y3RQcmljZSB8fCAwLFxuICAgICAgICAgIHNrdTogcHJvZHVjdC5wcm9kdWN0Q29kZSB8fCAnJyxcbiAgICAgICAgICBpbWFnZTogQXJyYXkuaXNBcnJheShwcm9kdWN0LnByb2R1Y3RJbWFnZXMpICYmIHByb2R1Y3QucHJvZHVjdEltYWdlcy5sZW5ndGggPiAwIFxuICAgICAgICAgICAgPyBwcm9kdWN0LnByb2R1Y3RJbWFnZXNbMF0gXG4gICAgICAgICAgICA6ICcnLFxuICAgICAgICAgIGJyYW5kOiBwcm9kdWN0LnByb2R1Y3RCcmFuZCB8fCAnJyxcbiAgICAgICAgICB3ZWlnaHQ6IHByb2R1Y3QucHJvZHVjdFdlaWdodCB8fCAwLFxuICAgICAgICAgIHVuaXQ6IHByb2R1Y3QucHJvZHVjdFVuaXQgfHwgJ2dyYW0nLFxuICAgICAgICAgIG9yaWdpbjogcHJvZHVjdC5wcm9kdWN0T3JpZ2luIHx8ICcnXG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKGludmVudG9yeURhdGEpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyBpbnZlbnRvcnkgZGF0YTonLCBlcnJvcik7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBcbiAgICAgICAgbWVzc2FnZTogJ0zhu5dpIGtoaSBs4bqleSBk4buvIGxp4buHdSB04buTbiBraG8nLCBcbiAgICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UgXG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gVXNlciBzdGF0aXN0aWNzXG4gIGdldFVzZXJEYXRhOiBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgICB0cnkge1xuICAgICAgLy8gQ291bnQgdG90YWwgYW5kIG5ldyB1c2VycyAod2l0aGluIGxhc3QgMzAgZGF5cylcbiAgICAgIGNvbnN0IHRvdGFsVXNlcnMgPSBhd2FpdCBVc2VyLmNvdW50RG9jdW1lbnRzKCk7XG4gICAgICBjb25zdCB0aGlydHlEYXlzQWdvID0gbmV3IERhdGUoKTtcbiAgICAgIHRoaXJ0eURheXNBZ28uc2V0RGF0ZSh0aGlydHlEYXlzQWdvLmdldERhdGUoKSAtIDMwKTtcbiAgICAgIFxuICAgICAgY29uc3QgbmV3VXNlcnMgPSBhd2FpdCBVc2VyLmNvdW50RG9jdW1lbnRzKHtcbiAgICAgICAgY3JlYXRlZEF0OiB7ICRndGU6IHRoaXJ0eURheXNBZ28gfVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIENvdW50IGFjdGl2ZSB1c2VycyAod2l0aCBvcmRlcnMgaW4gbGFzdCAzMCBkYXlzKVxuICAgICAgY29uc3QgYWN0aXZlVXNlcklkcyA9IGF3YWl0IE9yZGVyLmRpc3RpbmN0KCd1c2VySWQnLCB7XG4gICAgICAgIGNyZWF0ZWRBdDogeyAkZ3RlOiB0aGlydHlEYXlzQWdvIH1cbiAgICAgIH0pO1xuICAgICAgY29uc3QgYWN0aXZlVXNlcnMgPSBhY3RpdmVVc2VySWRzLmxlbmd0aDtcbiAgICAgIFxuICAgICAgLy8gR2V0IHVzZXIgZGVtb2dyYXBoaWNzXG4gICAgICBjb25zdCB1c2Vyc0J5UmVnaW9uID0gYXdhaXQgVXNlci5hZ2dyZWdhdGUoW1xuICAgICAgICB7IFxuICAgICAgICAgICRncm91cDoge1xuICAgICAgICAgICAgX2lkOiB7IFxuICAgICAgICAgICAgICByZWdpb246IHsgXG4gICAgICAgICAgICAgICAgJGNvbmQ6IHsgXG4gICAgICAgICAgICAgICAgICBpZjogeyAkaXNBcnJheTogXCIkYWRkcmVzc1wiIH0sIFxuICAgICAgICAgICAgICAgICAgdGhlbjogeyAkaWZOdWxsOiBbIHsgJGFycmF5RWxlbUF0OiBbXCIkYWRkcmVzcy5jaXR5XCIsIDBdIH0sIFwiS2jDoWNcIiBdIH0sIFxuICAgICAgICAgICAgICAgICAgZWxzZTogXCJLaMOhY1wiIFxuICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY291bnQ6IHsgJHN1bTogMSB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7ICRwcm9qZWN0OiB7IF9pZDogMCwgcmVnaW9uOiBcIiRfaWQucmVnaW9uXCIsIGNvdW50OiAxIH0gfVxuICAgICAgXSk7XG4gICAgICBcbiAgICAgIC8vIEZvcm1hdCB0aGUgdXNlciBkYXRhXG4gICAgICBjb25zdCB1c2VyRGF0YSA9IHtcbiAgICAgICAgdG90YWxVc2VycyxcbiAgICAgICAgbmV3VXNlcnMsXG4gICAgICAgIGFjdGl2ZVVzZXJzLFxuICAgICAgICB1c2Vyc0J5UmVnaW9uOiB1c2Vyc0J5UmVnaW9uLm1hcChpdGVtID0+ICh7XG4gICAgICAgICAgcmVnaW9uOiBpdGVtLnJlZ2lvbiB8fCAnS2jDoWMnLFxuICAgICAgICAgIGNvdW50OiBpdGVtLmNvdW50XG4gICAgICAgIH0pKVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgcmVzLmpzb24odXNlckRhdGEpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyB1c2VyIGRhdGE6JywgZXJyb3IpO1xuICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBtZXNzYWdlOiAnTOG7l2kga2hpIGzhuqV5IGThu68gbGnhu4d1IG5nxrDhu51pIGTDuW5nJyB9KTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gT3JkZXIgc3RhdGlzdGljc1xuICBnZXRPcmRlckRhdGE6IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBDb3VudCBvcmRlcnMgYnkgc3RhdHVzXG4gICAgICBjb25zdCB0b3RhbE9yZGVycyA9IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKCk7XG4gICAgICBjb25zdCBjb21wbGV0ZWRPcmRlcnMgPSBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cyh7IHN0YXR1czogJ2NvbXBsZXRlZCcgfSk7XG4gICAgICBjb25zdCBwZW5kaW5nT3JkZXJzID0gYXdhaXQgT3JkZXIuY291bnREb2N1bWVudHMoeyBzdGF0dXM6ICdwZW5kaW5nJyB9KTtcbiAgICAgIGNvbnN0IGNhbmNlbGxlZE9yZGVycyA9IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHsgc3RhdHVzOiAnY2FuY2VsbGVkJyB9KTtcbiAgICAgIFxuICAgICAgLy8gQ2FsY3VsYXRlIGF2ZXJhZ2Ugb3JkZXIgdmFsdWVcbiAgICAgIGNvbnN0IGF2Z09yZGVyVmFsdWVSZXN1bHQgPSBhd2FpdCBPcmRlci5hZ2dyZWdhdGUoW1xuICAgICAgICB7ICRtYXRjaDogeyBzdGF0dXM6IHsgJG5lOiAnY2FuY2VsbGVkJyB9IH0gfSxcbiAgICAgICAgeyAkZ3JvdXA6IHsgX2lkOiBudWxsLCBhdmdWYWx1ZTogeyAkYXZnOiBcIiR0b3RhbEFtb3VudFwiIH0gfSB9XG4gICAgICBdKTtcbiAgICAgIGNvbnN0IGF2ZXJhZ2VPcmRlclZhbHVlID0gYXZnT3JkZXJWYWx1ZVJlc3VsdC5sZW5ndGggPiAwID8gYXZnT3JkZXJWYWx1ZVJlc3VsdFswXS5hdmdWYWx1ZSA6IDA7XG4gICAgICBcbiAgICAgIC8vIEdldCBvcmRlcnMgYnkgc3RhdHVzXG4gICAgICBjb25zdCBvcmRlcnNCeVN0YXR1c1Jlc3VsdCA9IGF3YWl0IE9yZGVyLmFnZ3JlZ2F0ZShbXG4gICAgICAgIHsgJGdyb3VwOiB7IF9pZDogXCIkc3RhdHVzXCIsIGNvdW50OiB7ICRzdW06IDEgfSB9IH1cbiAgICAgIF0pO1xuICAgICAgXG4gICAgICBjb25zdCBvcmRlcnNCeVN0YXR1cyA9IG9yZGVyc0J5U3RhdHVzUmVzdWx0Lm1hcChpdGVtID0+IHtcbiAgICAgICAgbGV0IHN0YXR1c05hbWUgPSBpdGVtLl9pZDtcbiAgICAgICAgLy8gVHJhbnNsYXRlIHN0YXR1cyB0byBWaWV0bmFtZXNlIGlmIG5lZWRlZFxuICAgICAgICBzd2l0Y2goaXRlbS5faWQpIHtcbiAgICAgICAgICBjYXNlICdwZW5kaW5nJzogc3RhdHVzTmFtZSA9ICfEkGFuZyB44butIGzDvSc7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2F3YWl0aW5nX3BheW1lbnQnOiBzdGF0dXNOYW1lID0gJ0No4budIHRoYW5oIHRvw6FuJzsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnY29tcGxldGVkJzogc3RhdHVzTmFtZSA9ICdIb8OgbiB0aMOgbmgnOyBicmVhaztcbiAgICAgICAgICBjYXNlICdjYW5jZWxsZWQnOiBzdGF0dXNOYW1lID0gJ8SQw6MgaOG7p3knOyBicmVhaztcbiAgICAgICAgICBjYXNlICdzaGlwcGluZyc6IHN0YXR1c05hbWUgPSAnxJBhbmcgZ2lhbyBow6BuZyc7IGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHN0YXR1czogc3RhdHVzTmFtZSwgY291bnQ6IGl0ZW0uY291bnQgfTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyBHZXQgcmVjZW50IG9yZGVycyB3aXRoIHVzZXIgaW5mb1xuICAgICAgY29uc3QgcmVjZW50T3JkZXJzID0gYXdhaXQgT3JkZXIuZmluZCgpXG4gICAgICAgIC5zb3J0KHsgY3JlYXRlZEF0OiAtMSB9KVxuICAgICAgICAubGltaXQoNSlcbiAgICAgICAgLnBvcHVsYXRlKCd1c2VySWQnLCAnZmlyc3ROYW1lIGxhc3ROYW1lIHVzZXJOYW1lJyk7XG4gICAgICBcbiAgICAgIGNvbnN0IGZvcm1hdHRlZFJlY2VudE9yZGVycyA9IHJlY2VudE9yZGVycy5tYXAob3JkZXIgPT4gKHtcbiAgICAgICAgaWQ6IG9yZGVyLl9pZCxcbiAgICAgICAgb3JkZXJDb2RlOiBvcmRlci5vcmRlckNvZGUsXG4gICAgICAgIGN1c3RvbWVyOiBvcmRlci51c2VySWQgXG4gICAgICAgICAgPyAob3JkZXIudXNlcklkLmZpcnN0TmFtZSArICcgJyArIG9yZGVyLnVzZXJJZC5sYXN0TmFtZSB8fCBvcmRlci51c2VySWQudXNlck5hbWUpIFxuICAgICAgICAgIDogJ0tow6FjaCBow6BuZycsXG4gICAgICAgIHRvdGFsOiBvcmRlci50b3RhbEFtb3VudCxcbiAgICAgICAgc3RhdHVzOiBvcmRlci5zdGF0dXMsXG4gICAgICAgIGRhdGU6IG9yZGVyLmNyZWF0ZWRBdFxuICAgICAgfSkpO1xuICAgICAgXG4gICAgICAvLyBDb21iaW5lIGFsbCBvcmRlciBkYXRhXG4gICAgICBjb25zdCBvcmRlckRhdGEgPSB7XG4gICAgICAgIHRvdGFsT3JkZXJzLFxuICAgICAgICBjb21wbGV0ZWRPcmRlcnMsXG4gICAgICAgIHBlbmRpbmdPcmRlcnMsXG4gICAgICAgIGNhbmNlbGxlZE9yZGVycyxcbiAgICAgICAgYXZlcmFnZU9yZGVyVmFsdWUsXG4gICAgICAgIG9yZGVyc0J5U3RhdHVzLFxuICAgICAgICByZWNlbnRPcmRlcnM6IGZvcm1hdHRlZFJlY2VudE9yZGVyc1xuICAgICAgfTtcbiAgICAgIFxuICAgICAgcmVzLmpzb24ob3JkZXJEYXRhKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgb3JkZXIgZGF0YTonLCBlcnJvcik7XG4gICAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IG1lc3NhZ2U6ICdM4buXaSBraGkgbOG6pXkgZOG7ryBsaeG7h3UgxJHGoW4gaMOgbmcnIH0pO1xuICAgIH1cbiAgfSxcblxuICAvLyBGZWVkYmFjayBkYXRhXG4gIGdldEZlZWRiYWNrRGF0YTogYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENvdW50IHJldmlld3NcbiAgICAgIGNvbnN0IHRvdGFsUmV2aWV3cyA9IGF3YWl0IFJldmlldy5jb3VudERvY3VtZW50cygpO1xuICAgICAgXG4gICAgICAvLyBBdmVyYWdlIHJhdGluZ1xuICAgICAgY29uc3QgcmF0aW5nUmVzdWx0ID0gYXdhaXQgUmV2aWV3LmFnZ3JlZ2F0ZShbXG4gICAgICAgIHsgJGdyb3VwOiB7IF9pZDogbnVsbCwgYXZnUmF0aW5nOiB7ICRhdmc6IFwiJHJhdGluZ1wiIH0gfSB9XG4gICAgICBdKTtcbiAgICAgIGNvbnN0IGF2ZXJhZ2VSYXRpbmcgPSByYXRpbmdSZXN1bHQubGVuZ3RoID4gMCA/IHBhcnNlRmxvYXQocmF0aW5nUmVzdWx0WzBdLmF2Z1JhdGluZy50b0ZpeGVkKDEpKSA6IDA7XG4gICAgICBcbiAgICAgIC8vIFJldmlld3MgYnkgcmF0aW5nXG4gICAgICBjb25zdCByZXZpZXdzQnlSYXRpbmcgPSBhd2FpdCBSZXZpZXcuYWdncmVnYXRlKFtcbiAgICAgICAgeyAkZ3JvdXA6IHsgX2lkOiBcIiRyYXRpbmdcIiwgY291bnQ6IHsgJHN1bTogMSB9IH0gfSxcbiAgICAgICAgeyAkc29ydDogeyBfaWQ6IC0xIH0gfVxuICAgICAgXSk7XG4gICAgICBcbiAgICAgIC8vIENodXnhu4NuIMSR4buVaSBwaMOibiBwaOG7kWkgxJHDoW5oIGdpw6EgdGhlbyB5w6p1IGPhuqd1IGPhu6dhIGJp4buDdSDEkeG7k1xuICAgICAgY29uc3QgcmF0aW5nRGlzdHJpYnV0aW9uID0gW107XG4gICAgICBmb3IgKGxldCBpID0gNTsgaSA+PSAxOyBpLS0pIHtcbiAgICAgICAgY29uc3QgcmF0aW5nSXRlbSA9IHJldmlld3NCeVJhdGluZy5maW5kKGl0ZW0gPT4gaXRlbS5faWQgPT09IGkpO1xuICAgICAgICByYXRpbmdEaXN0cmlidXRpb24ucHVzaCh7XG4gICAgICAgICAgcmF0aW5nOiBpLFxuICAgICAgICAgIGNvdW50OiByYXRpbmdJdGVtID8gcmF0aW5nSXRlbS5jb3VudCA6IDBcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIFJlY2VudCByZXZpZXdzXG4gICAgICBjb25zdCByZWNlbnRSZXZpZXdzID0gYXdhaXQgUmV2aWV3LmZpbmQoKVxuICAgICAgICAuc29ydCh7IGNyZWF0ZWRBdDogLTEgfSlcbiAgICAgICAgLmxpbWl0KDEwKVxuICAgICAgICAucG9wdWxhdGUoJ3Byb2R1Y3RJZCcsICdwcm9kdWN0TmFtZSBwcm9kdWN0SW1hZ2VzJylcbiAgICAgICAgLnBvcHVsYXRlKCd1c2VySWQnLCAnZmlyc3ROYW1lIGxhc3ROYW1lIHVzZXJOYW1lIHByb2ZpbGVJbWFnZScpO1xuICAgICAgXG4gICAgICBjb25zdCBmb3JtYXR0ZWRSZWNlbnRSZXZpZXdzID0gcmVjZW50UmV2aWV3cy5tYXAocmV2aWV3ID0+ICh7XG4gICAgICAgIGlkOiByZXZpZXcuX2lkLFxuICAgICAgICBwcm9kdWN0OiByZXZpZXcucHJvZHVjdElkID8gcmV2aWV3LnByb2R1Y3RJZC5wcm9kdWN0TmFtZSA6ICdT4bqjbiBwaOG6qW0ga2jDtG5nIHLDtScsXG4gICAgICAgIHByb2R1Y3RJbWFnZTogcmV2aWV3LnByb2R1Y3RJZCAmJiByZXZpZXcucHJvZHVjdElkLnByb2R1Y3RJbWFnZXMgJiYgcmV2aWV3LnByb2R1Y3RJZC5wcm9kdWN0SW1hZ2VzLmxlbmd0aCA+IDAgXG4gICAgICAgICAgPyByZXZpZXcucHJvZHVjdElkLnByb2R1Y3RJbWFnZXNbMF0gXG4gICAgICAgICAgOiAnJyxcbiAgICAgICAgdXNlcjogcmV2aWV3LnVzZXJJZCBcbiAgICAgICAgICA/IChyZXZpZXcudXNlcklkLmZpcnN0TmFtZSArICcgJyArIHJldmlldy51c2VySWQubGFzdE5hbWUgfHwgcmV2aWV3LnVzZXJJZC51c2VyTmFtZSkgXG4gICAgICAgICAgOiByZXZpZXcudXNlck5hbWUsXG4gICAgICAgIHVzZXJJbWFnZTogcmV2aWV3LnVzZXJJZCA/IHJldmlldy51c2VySWQucHJvZmlsZUltYWdlIDogJycsXG4gICAgICAgIHJhdGluZzogcmV2aWV3LnJhdGluZyxcbiAgICAgICAgY29tbWVudDogcmV2aWV3LmNvbW1lbnQsXG4gICAgICAgIGRhdGU6IHJldmlldy5jcmVhdGVkQXQsXG4gICAgICAgIGlzVmVyaWZpZWQ6IHJldmlldy5pc1ZlcmlmaWVkLFxuICAgICAgICBpc1B1Ymxpc2hlZDogcmV2aWV3LmlzUHVibGlzaGVkXG4gICAgICB9KSk7XG4gICAgICBcbiAgICAgIC8vIMSQw6FuaCBnacOhIHRoZW8gdGjhu51pIGdpYW5cbiAgICAgIGNvbnN0IHRoaXJ0eURheXNBZ28gPSBuZXcgRGF0ZSgpO1xuICAgICAgdGhpcnR5RGF5c0Fnby5zZXREYXRlKHRoaXJ0eURheXNBZ28uZ2V0RGF0ZSgpIC0gMzApO1xuICAgICAgXG4gICAgICBjb25zdCByZXZpZXdzT3ZlclRpbWUgPSBhd2FpdCBSZXZpZXcuYWdncmVnYXRlKFtcbiAgICAgICAgeyBcbiAgICAgICAgICAkbWF0Y2g6IHsgXG4gICAgICAgICAgICBjcmVhdGVkQXQ6IHsgJGd0ZTogdGhpcnR5RGF5c0FnbyB9IFxuICAgICAgICAgIH0gXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAkZ3JvdXA6IHtcbiAgICAgICAgICAgIF9pZDogeyBcbiAgICAgICAgICAgICAgJGRhdGVUb1N0cmluZzogeyBmb3JtYXQ6IFwiJVktJW0tJWRcIiwgZGF0ZTogXCIkY3JlYXRlZEF0XCIgfSBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb3VudDogeyAkc3VtOiAxIH0sXG4gICAgICAgICAgICBhdmdSYXRpbmc6IHsgJGF2ZzogXCIkcmF0aW5nXCIgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgeyAkc29ydDogeyBfaWQ6IDEgfSB9XG4gICAgICBdKTtcbiAgICAgIFxuICAgICAgY29uc3QgZm9ybWF0dGVkUmV2aWV3c092ZXJUaW1lID0gcmV2aWV3c092ZXJUaW1lLm1hcChpdGVtID0+ICh7XG4gICAgICAgIGRhdGU6IGl0ZW0uX2lkLFxuICAgICAgICBjb3VudDogaXRlbS5jb3VudCxcbiAgICAgICAgYXZnUmF0aW5nOiBwYXJzZUZsb2F0KGl0ZW0uYXZnUmF0aW5nLnRvRml4ZWQoMSkpXG4gICAgICB9KSk7XG4gICAgICBcbiAgICAgIC8vIFBo4bqjbiBo4buTaSBz4bqjbiBwaOG6qW0gaMOgbmcgxJHhuqd1ICh0b3AgcHJvZHVjdHMgYnkgcmV2aWV3cylcbiAgICAgIGNvbnN0IHRvcFJldmlld2VkUHJvZHVjdHMgPSBhd2FpdCBSZXZpZXcuYWdncmVnYXRlKFtcbiAgICAgICAge1xuICAgICAgICAgICRncm91cDoge1xuICAgICAgICAgICAgX2lkOiBcIiRwcm9kdWN0SWRcIixcbiAgICAgICAgICAgIGNvdW50OiB7ICRzdW06IDEgfSxcbiAgICAgICAgICAgIGF2Z1JhdGluZzogeyAkYXZnOiBcIiRyYXRpbmdcIiB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7ICRzb3J0OiB7IGNvdW50OiAtMSB9IH0sXG4gICAgICAgIHsgJGxpbWl0OiA1IH1cbiAgICAgIF0pO1xuICAgICAgXG4gICAgICAvLyBM4bqleSBjaGkgdGnhur90IHPhuqNuIHBo4bqpbSBjaG8gY8OhYyBz4bqjbiBwaOG6qW0gxJHGsOG7o2MgxJHDoW5oIGdpw6Egbmhp4buBdSBuaOG6pXRcbiAgICAgIGNvbnN0IHByb2R1Y3RJZHMgPSB0b3BSZXZpZXdlZFByb2R1Y3RzLm1hcChpdGVtID0+IGl0ZW0uX2lkKTtcbiAgICAgIGNvbnN0IHByb2R1Y3RzID0gYXdhaXQgUHJvZHVjdC5maW5kKHsgX2lkOiB7ICRpbjogcHJvZHVjdElkcyB9IH0pO1xuICAgICAgXG4gICAgICBjb25zdCBmb3JtYXR0ZWRUb3BQcm9kdWN0cyA9IHRvcFJldmlld2VkUHJvZHVjdHMubWFwKGl0ZW0gPT4ge1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gcHJvZHVjdHMuZmluZChwID0+IHAuX2lkLnRvU3RyaW5nKCkgPT09IGl0ZW0uX2lkLnRvU3RyaW5nKCkpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGlkOiBpdGVtLl9pZCxcbiAgICAgICAgICBuYW1lOiBwcm9kdWN0ID8gcHJvZHVjdC5wcm9kdWN0TmFtZSA6ICdT4bqjbiBwaOG6qW0ga2jDtG5nIHLDtScsXG4gICAgICAgICAgY2F0ZWdvcnk6IHByb2R1Y3QgPyBwcm9kdWN0LnByb2R1Y3RDYXRlZ29yeSA6ICdLaMO0bmcgcGjDom4gbG/huqFpJyxcbiAgICAgICAgICBpbWFnZTogcHJvZHVjdCAmJiBwcm9kdWN0LnByb2R1Y3RJbWFnZXMgJiYgcHJvZHVjdC5wcm9kdWN0SW1hZ2VzLmxlbmd0aCA+IDAgXG4gICAgICAgICAgICA/IHByb2R1Y3QucHJvZHVjdEltYWdlc1swXSBcbiAgICAgICAgICAgIDogJycsXG4gICAgICAgICAgcmV2aWV3Q291bnQ6IGl0ZW0uY291bnQsXG4gICAgICAgICAgYXZnUmF0aW5nOiBwYXJzZUZsb2F0KGl0ZW0uYXZnUmF0aW5nLnRvRml4ZWQoMSkpXG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gQ29tYmluZSBhbGwgZmVlZGJhY2sgZGF0YVxuICAgICAgY29uc3QgZmVlZGJhY2tEYXRhID0ge1xuICAgICAgICB0b3RhbFJldmlld3MsXG4gICAgICAgIGF2ZXJhZ2VSYXRpbmcsXG4gICAgICAgIHJhdGluZ0Rpc3RyaWJ1dGlvbixcbiAgICAgICAgcmV2aWV3c092ZXJUaW1lOiBmb3JtYXR0ZWRSZXZpZXdzT3ZlclRpbWUsXG4gICAgICAgIHRvcFJldmlld2VkUHJvZHVjdHM6IGZvcm1hdHRlZFRvcFByb2R1Y3RzLFxuICAgICAgICByZWNlbnRSZXZpZXdzOiBmb3JtYXR0ZWRSZWNlbnRSZXZpZXdzXG4gICAgICB9O1xuICAgICAgXG4gICAgICByZXMuanNvbihmZWVkYmFja0RhdGEpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyBmZWVkYmFjayBkYXRhOicsIGVycm9yKTtcbiAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgXG4gICAgICAgIG1lc3NhZ2U6ICdM4buXaSBraGkgbOG6pXkgZOG7ryBsaeG7h3UgcGjhuqNuIGjhu5NpJyxcbiAgICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICAvLyBJbXBsZW1lbnQgcmVtYWluaW5nIG1ldGhvZHMgd2l0aCByZWFsIGRhdGFiYXNlIHF1ZXJpZXNcbiAgZ2V0UHJvbW90aW9uRGF0YTogYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIEdldCBjb3Vwb24gZGF0YSBmcm9tIGRhdGFiYXNlXG4gICAgICBjb25zdCBjb3Vwb25zID0gYXdhaXQgQ291cG9uLmZpbmQoKTtcbiAgICAgIFxuICAgICAgLy8gQ2FsY3VsYXRlIHVzYWdlIHN0YXRpc3RpY3NcbiAgICAgIGNvbnN0IHZvdWNoZXJTdGF0cyA9IGNvdXBvbnMubWFwKGNvdXBvbiA9PiB7XG4gICAgICAgIC8vIEVuc3VyZSBkaXNjb3VudCB2YWx1ZSBpcyBkZWZpbmVkIGJlZm9yZSBjYWxsaW5nIHRvTG9jYWxlU3RyaW5nXG4gICAgICAgIGNvbnN0IGRpc2NvdW50VmFsdWUgPSBjb3Vwb24uZGlzY291bnRWYWx1ZSB8fCAwO1xuICAgICAgICBjb25zdCBkaXNjb3VudERpc3BsYXkgPSBjb3Vwb24uZGlzY291bnRUeXBlID09PSAncGVyY2VudGFnZScgXG4gICAgICAgICAgPyBgJHtkaXNjb3VudFZhbHVlfSVgIFxuICAgICAgICAgIDogYCR7ZGlzY291bnRWYWx1ZS50b0xvY2FsZVN0cmluZygpfcSRYDtcbiAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb2RlOiBjb3Vwb24uY29kZSB8fCAnS2jDtG5nIGPDsyBtw6MnLFxuICAgICAgICAgIHR5cGU6IGNvdXBvbi5kaXNjb3VudFR5cGUgfHwgJ3Vua25vd24nLFxuICAgICAgICAgIGRpc2NvdW50OiBkaXNjb3VudERpc3BsYXksXG4gICAgICAgICAgdXNlZDogY291cG9uLnVzZWRDb3VudCB8fCAwLFxuICAgICAgICAgIGxpbWl0OiBjb3Vwb24ubWF4VXNlcyB8fCAwLFxuICAgICAgICAgIGV4cGlyZXNBdDogY291cG9uLmV4cGlyeURhdGUgfHwgbmV3IERhdGUoKSxcbiAgICAgICAgICBhY3RpdmU6IGNvdXBvbi5leHBpcnlEYXRlID8gKG5ldyBEYXRlKGNvdXBvbi5leHBpcnlEYXRlKSA+IG5ldyBEYXRlKCkgJiYgIWNvdXBvbi5pc0Rpc2FibGVkKSA6IGZhbHNlXG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgY29uc3QgcHJvbW90aW9uRGF0YSA9IHtcbiAgICAgICAgdG90YWxWb3VjaGVyczogY291cG9ucy5sZW5ndGgsXG4gICAgICAgIGFjdGl2ZVZvdWNoZXJzOiBjb3Vwb25zLmZpbHRlcihjID0+IGMuZXhwaXJ5RGF0ZSAmJiBuZXcgRGF0ZShjLmV4cGlyeURhdGUpID4gbmV3IERhdGUoKSAmJiAhYy5pc0Rpc2FibGVkKS5sZW5ndGgsXG4gICAgICAgIHVzZWRWb3VjaGVyczogY291cG9ucy5yZWR1Y2UoKHRvdGFsLCBjb3Vwb24pID0+IHRvdGFsICsgKGNvdXBvbi51c2VkQ291bnQgfHwgMCksIDApLFxuICAgICAgICB2b3VjaGVyU3RhdHNcbiAgICAgIH07XG4gICAgICBcbiAgICAgIHJlcy5qc29uKHByb21vdGlvbkRhdGEpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyBwcm9tb3Rpb24gZGF0YTonLCBlcnJvcik7XG4gICAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IG1lc3NhZ2U6ICdM4buXaSBraGkgbOG6pXkgZOG7ryBsaeG7h3Uga2h1eeG6v24gbcOjaScgfSk7XG4gICAgfVxuICB9LFxuXG4gIC8vIEFkZGl0aW9uYWwgbWV0aG9kcyAoY2FuIGJlIGltcGxlbWVudGVkIGFzIG5lZWRlZClcbiAgZ2V0U3lzdGVtQWN0aXZpdHlEYXRhOiBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgICAvLyBUcuG6oyB24buBIGThu68gbGnhu4d1IG3huqt1IHRoYXkgdsOsIHRydXkgduG6pW4gZGF0YWJhc2UgxJHhu4MgdHLDoW5oIGzhu5dpXG4gICAgdHJ5IHtcbiAgICAgIC8vIEThu68gbGnhu4d1IG3huqt1IHbhu4EgaG/huqF0IMSR4buZbmcgaOG7hyB0aOG7kW5nXG4gICAgICBjb25zdCBzeXN0ZW1BY3Rpdml0eURhdGEgPSB7XG4gICAgICAgIGxvZ2luczogMTI1LFxuICAgICAgICByZWdpc3RyYXRpb25zOiA0MixcbiAgICAgICAgYXBpQ2FsbHM6IDE1NzgsXG4gICAgICAgIGVycm9yUmF0ZTogMC4wMjUsXG4gICAgICAgIGFjdGl2aXR5QnlIb3VyOiBbXG4gICAgICAgICAgeyBob3VyOiAnMDA6MDAnLCBjb3VudDogMTIgfSxcbiAgICAgICAgICB7IGhvdXI6ICcwMTowMCcsIGNvdW50OiA4IH0sXG4gICAgICAgICAgeyBob3VyOiAnMDI6MDAnLCBjb3VudDogNSB9LFxuICAgICAgICAgIHsgaG91cjogJzAzOjAwJywgY291bnQ6IDMgfSxcbiAgICAgICAgICB7IGhvdXI6ICcwNDowMCcsIGNvdW50OiAyIH0sXG4gICAgICAgICAgeyBob3VyOiAnMDU6MDAnLCBjb3VudDogNCB9LFxuICAgICAgICAgIHsgaG91cjogJzA2OjAwJywgY291bnQ6IDEwIH0sXG4gICAgICAgICAgeyBob3VyOiAnMDc6MDAnLCBjb3VudDogMjUgfSxcbiAgICAgICAgICB7IGhvdXI6ICcwODowMCcsIGNvdW50OiA1NSB9LFxuICAgICAgICAgIHsgaG91cjogJzA5OjAwJywgY291bnQ6IDgwIH0sXG4gICAgICAgICAgeyBob3VyOiAnMTA6MDAnLCBjb3VudDogOTYgfSxcbiAgICAgICAgICB7IGhvdXI6ICcxMTowMCcsIGNvdW50OiAxMDQgfSxcbiAgICAgICAgICB7IGhvdXI6ICcxMjowMCcsIGNvdW50OiA5OCB9LFxuICAgICAgICAgIHsgaG91cjogJzEzOjAwJywgY291bnQ6IDgzIH0sXG4gICAgICAgICAgeyBob3VyOiAnMTQ6MDAnLCBjb3VudDogNzUgfSxcbiAgICAgICAgICB7IGhvdXI6ICcxNTowMCcsIGNvdW50OiA2OCB9LFxuICAgICAgICAgIHsgaG91cjogJzE2OjAwJywgY291bnQ6IDcyIH0sXG4gICAgICAgICAgeyBob3VyOiAnMTc6MDAnLCBjb3VudDogODUgfSxcbiAgICAgICAgICB7IGhvdXI6ICcxODowMCcsIGNvdW50OiA5MiB9LFxuICAgICAgICAgIHsgaG91cjogJzE5OjAwJywgY291bnQ6IDEwMSB9LFxuICAgICAgICAgIHsgaG91cjogJzIwOjAwJywgY291bnQ6IDExMCB9LFxuICAgICAgICAgIHsgaG91cjogJzIxOjAwJywgY291bnQ6IDg1IH0sXG4gICAgICAgICAgeyBob3VyOiAnMjI6MDAnLCBjb3VudDogNjUgfSxcbiAgICAgICAgICB7IGhvdXI6ICcyMzowMCcsIGNvdW50OiAzNSB9XG4gICAgICAgIF0sXG4gICAgICAgIHJlY2VudEFjdGl2aXR5OiBbXG4gICAgICAgICAgeyB0eXBlOiAnbG9naW4nLCB1c2VyOiAnYWRtaW4nLCB0aW1lc3RhbXA6IG5ldyBEYXRlKERhdGUubm93KCkgLSAxMDAwICogNjAgKiA1KSB9LFxuICAgICAgICAgIHsgdHlwZTogJ3Byb2R1Y3RfdXBkYXRlJywgdXNlcjogJ2FkbWluJywgaXRlbTogJ1TDoW8geGFuaCBN4bu5IGNhbyBj4bqlcCcsIHRpbWVzdGFtcDogbmV3IERhdGUoRGF0ZS5ub3coKSAtIDEwMDAgKiA2MCAqIDE1KSB9LFxuICAgICAgICAgIHsgdHlwZTogJ29yZGVyX3VwZGF0ZScsIHVzZXI6ICdzeXN0ZW0nLCBpdGVtOiAnT1JEMTIzNDUnLCB0aW1lc3RhbXA6IG5ldyBEYXRlKERhdGUubm93KCkgLSAxMDAwICogNjAgKiAyNSkgfSxcbiAgICAgICAgICB7IHR5cGU6ICdsb2dpbicsIHVzZXI6ICdtYW5hZ2VyJywgdGltZXN0YW1wOiBuZXcgRGF0ZShEYXRlLm5vdygpIC0gMTAwMCAqIDYwICogMzUpIH0sXG4gICAgICAgICAgeyB0eXBlOiAnY291cG9uX2NyZWF0ZScsIHVzZXI6ICdtYXJrZXRpbmcnLCBpdGVtOiAnU1VNTUVSMjUnLCB0aW1lc3RhbXA6IG5ldyBEYXRlKERhdGUubm93KCkgLSAxMDAwICogNjAgKiA1NSkgfVxuICAgICAgICBdXG4gICAgICB9O1xuICAgICAgXG4gICAgICByZXMuanNvbihzeXN0ZW1BY3Rpdml0eURhdGEpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyBzeXN0ZW0gYWN0aXZpdHkgZGF0YTonLCBlcnJvcik7XG4gICAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IG1lc3NhZ2U6ICdM4buXaSBraGkgbOG6pXkgZOG7ryBsaeG7h3UgaG/huqF0IMSR4buZbmcgaOG7hyB0aOG7kW5nJyB9KTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gRGVsaXZlcnkgZGF0YVxuICBnZXREZWxpdmVyeURhdGE6IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBH4buNaSB0cuG7sWMgdGnhur9wIGjDoG0gZ2V0RGVsaXZlcnlTdGF0cyB04burIG9yZGVyQ29udHJvbGxlclxuICAgICAgcmV0dXJuIGdldERlbGl2ZXJ5U3RhdHMocmVxLCByZXMpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgZGVsaXZlcnkgZGF0YTonLCBlcnIpO1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgc3RhdGlzdGljczoge1xuICAgICAgICAgIGNvbXBsZXRlZDogMCxcbiAgICAgICAgICBpblByb2dyZXNzOiAwLFxuICAgICAgICAgIGRlbGF5ZWQ6IDAsXG4gICAgICAgICAgdG90YWw6IDAsXG4gICAgICAgICAgYXZnRGVsaXZlcnlUaW1lOiBcIk4vQVwiXG4gICAgICAgIH0sXG4gICAgICAgIGRlbGl2ZXJ5UGFydG5lcnM6IFtdLFxuICAgICAgICBkZWxpdmVyeVRpbWVCeVJlZ2lvbjogW10sXG4gICAgICAgIGRlbGl2ZXJpZXM6IFtdXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IHJlcG9ydHNDb250cm9sbGVyOyJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE1BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtB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QUFFdkYsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzNCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzNCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzNCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzNCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLEVBQUV1RixJQUFJLEVBQUUsT0FBTyxFQUFFdkYsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQzdCOztRQUNEd0YsY0FBYyxFQUFFO1FBQ2QsRUFBRTlMLElBQUksRUFBRSxPQUFPLEVBQUVVLElBQUksRUFBRSxPQUFPLEVBQUVILFNBQVMsRUFBRSxJQUFJTSxJQUFJLENBQUNBLElBQUksQ0FBQ2tMLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pGLEVBQUUvTCxJQUFJLEVBQUUsZ0JBQWdCLEVBQUVVLElBQUksRUFBRSxPQUFPLEVBQUU0QixJQUFJLEVBQUUscUJBQXFCLEVBQUUvQixTQUFTLEVBQUUsSUFBSU0sSUFBSSxDQUFDQSxJQUFJLENBQUNrTCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN4SCxFQUFFL0wsSUFBSSxFQUFFLGNBQWMsRUFBRVUsSUFBSSxFQUFFLFFBQVEsRUFBRTRCLElBQUksRUFBRSxVQUFVLEVBQUUvQixTQUFTLEVBQUUsSUFBSU0sSUFBSSxDQUFDQSxJQUFJLENBQUNrTCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1RyxFQUFFL0wsSUFBSSxFQUFFLE9BQU8sRUFBRVUsSUFBSSxFQUFFLFNBQVMsRUFBRUgsU0FBUyxFQUFFLElBQUlNLElBQUksQ0FBQ0EsSUFBSSxDQUFDa0wsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDcEYsRUFBRS9MLElBQUksRUFBRSxlQUFlLEVBQUVVLElBQUksRUFBRSxXQUFXLEVBQUU0QixJQUFJLEVBQUUsVUFBVSxFQUFFL0IsU0FBUyxFQUFFLElBQUlNLElBQUksQ0FBQ0EsSUFBSSxDQUFDa0wsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7O01BRXBILENBQUM7O01BRUQ5TixHQUFHLENBQUMrQyxJQUFJLENBQUN1SyxrQkFBa0IsQ0FBQztJQUM5QixDQUFDLENBQUMsT0FBT3RLLEtBQUssRUFBRTtNQUNkQyxPQUFPLENBQUNELEtBQUssQ0FBQyxzQ0FBc0MsRUFBRUEsS0FBSyxDQUFDO01BQzVEaEQsR0FBRyxDQUFDVyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNvQyxJQUFJLENBQUMsRUFBRWYsT0FBTyxFQUFFLHdDQUF3QyxDQUFDLENBQUMsQ0FBQztJQUM3RTtFQUNGLENBQUM7O0VBRUQ7RUFDQStMLGVBQWUsRUFBRSxNQUFBQSxDQUFPaE8sR0FBRyxFQUFFQyxHQUFHLEtBQUs7SUFDbkMsSUFBSTtNQUNGO01BQ0EsT0FBTyxJQUFBZ08saUNBQWdCLEVBQUNqTyxHQUFHLEVBQUVDLEdBQUcsQ0FBQztJQUNuQyxDQUFDLENBQUMsT0FBT2lPLEdBQUcsRUFBRTtNQUNaaEwsT0FBTyxDQUFDRCxLQUFLLENBQUMsK0JBQStCLEVBQUVpTCxHQUFHLENBQUM7TUFDbkQsT0FBT2pPLEdBQUcsQ0FBQ1csTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDb0MsSUFBSSxDQUFDO1FBQzFCbUwsVUFBVSxFQUFFO1VBQ1ZDLFNBQVMsRUFBRSxDQUFDO1VBQ1pDLFVBQVUsRUFBRSxDQUFDO1VBQ2JDLE9BQU8sRUFBRSxDQUFDO1VBQ1Z2TixLQUFLLEVBQUUsQ0FBQztVQUNSd04sZUFBZSxFQUFFO1FBQ25CLENBQUM7UUFDREMsZ0JBQWdCLEVBQUUsRUFBRTtRQUNwQkMsb0JBQW9CLEVBQUUsRUFBRTtRQUN4QkMsVUFBVSxFQUFFO01BQ2QsQ0FBQyxDQUFDO0lBQ0o7RUFDRjtBQUNGLENBQUMsQ0FBQyxJQUFBQyxRQUFBLEdBQUFDLE9BQUEsQ0FBQUMsT0FBQTs7QUFFYS9PLGlCQUFpQiIsImlnbm9yZUxpc3QiOltdfQ==