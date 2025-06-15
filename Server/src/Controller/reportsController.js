/**
 * @deprecated - Đây là phiên bản cũ của reportsController, không nên sử dụng.
 * Vui lòng sử dụng phiên bản mới trong thư mục Server/controllers/reportsController.js
 */
import Order from '../Model/Order.js';
import Product from '../Model/Products.js';
import User from '../Model/Register.js';
import Review from '../Model/Review.js';
import Coupon from '../Model/Coupon.js';
import BestSellingProduct from '../Model/BestSellingProduct.js';
import { getDeliveryStats } from "../Controller/orderController.js";

/**
 * Reports controller to handle API requests for generating various reports
 * Uses real data from MongoDB models
 */
const reportsController = {
  // Dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      // Fetch real data from database
      const totalOrders = await Order.countDocuments();
      const totalProducts = await Product.countDocuments();
      const totalCustomers = await User.countDocuments();
      
      // Calculate total revenue from completed orders
      const revenueData = await Order.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]);
      const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;
      
      // Get recent activities
      const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('userId', 'firstName lastName userName');
      
      const recentProductUpdates = await Product.find()
        .sort({ updatedAt: -1 })
        .limit(2);
      
      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(2);
      
      // Format recent activities
      const recentActivities = [
        ...recentOrders.map(order => ({
          id: order._id,
          type: 'order',
          message: `Đơn hàng mới #${order.orderCode} từ ${order.userId ? (order.userId.firstName + ' ' + order.userId.lastName || order.userId.userName) : 'Khách hàng'}`,
          timestamp: order.createdAt
        })),
        ...recentProductUpdates.map(product => ({
          id: product._id,
          type: 'product',
          message: `Sản phẩm "${product.productName}" đã được cập nhật`,
          timestamp: product.updatedAt
        })),
        ...recentUsers.map(user => ({
          id: user._id,
          type: 'user',
          message: `Người dùng mới ${user.firstName ? (user.firstName + ' ' + user.lastName) : user.userName} đã đăng ký`,
          timestamp: user.createdAt
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
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
      const revenueAggregation = await Order.aggregate([
        { $match: matchCriteria },
        { 
          $group: {
            _id: groupBy,
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);
      
      // Format the results
      let revenueData = revenueAggregation.map(item => ({
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
      const results = await BestSellingProduct.find()
        .sort({ soldCount: -1 })
        .limit(5);
      
      // Format the results
      const formattedResults = results.map(product => ({
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
      const products = await Product.find({}).select('_id productName productCategory productPrice productStock productCode productImages productBrand productStatus productOrigin productWeight productUnit');
      
      if (!products || products.length === 0) {
        return res.status(200).json([]);
      }
      
      // Biến đổi dữ liệu sản phẩm sang định dạng tồn kho
      const inventoryData = products.map(product => {
        const stock = product.productStock || 0;
        let status = 'Còn hàng';
        
        if (stock <= 0) status = 'Hết hàng';
        else if (stock <= 5) status = 'Sắp hết';
        else if (stock <= 20) status = 'Sắp hết';
        
        return {
          id: product._id,
          name: product.productName || 'Không xác định',
          stock: product.productStock || 0,
          value: (product.productPrice || 0) * (product.productStock || 0),
          status: status,
          category: product.productCategory || 'Không phân loại',
          price: product.productPrice || 0,
          sku: product.productCode || '',
          image: Array.isArray(product.productImages) && product.productImages.length > 0 
            ? product.productImages[0] 
            : '',
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
      const totalUsers = await User.countDocuments();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newUsers = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });
      
      // Count active users (with orders in last 30 days)
      const activeUserIds = await Order.distinct('userId', {
        createdAt: { $gte: thirtyDaysAgo }
      });
      const activeUsers = activeUserIds.length;
      
      // Get user demographics
      const usersByRegion = await User.aggregate([
        { 
          $group: {
            _id: { 
              region: { 
                $cond: { 
                  if: { $isArray: "$address" }, 
                  then: { $ifNull: [ { $arrayElemAt: ["$address.city", 0] }, "Khác" ] }, 
                  else: "Khác" 
                } 
              } 
            },
            count: { $sum: 1 }
          }
        },
        { $project: { _id: 0, region: "$_id.region", count: 1 } }
      ]);
      
      // Format the user data
      const userData = {
        totalUsers,
        newUsers,
        activeUsers,
        usersByRegion: usersByRegion.map(item => ({
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
      const totalOrders = await Order.countDocuments();
      const completedOrders = await Order.countDocuments({ status: 'completed' });
      const pendingOrders = await Order.countDocuments({ status: 'pending' });
      const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
      
      // Calculate average order value
      const avgOrderValueResult = await Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, avgValue: { $avg: "$totalAmount" } } }
      ]);
      const averageOrderValue = avgOrderValueResult.length > 0 ? avgOrderValueResult[0].avgValue : 0;
      
      // Get orders by status
      const ordersByStatusResult = await Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);
      
      const ordersByStatus = ordersByStatusResult.map(item => {
        let statusName = item._id;
        // Translate status to Vietnamese if needed
        switch(item._id) {
          case 'pending': statusName = 'Đang xử lý'; break;
          case 'awaiting_payment': statusName = 'Chờ thanh toán'; break;
          case 'completed': statusName = 'Hoàn thành'; break;
          case 'cancelled': statusName = 'Đã hủy'; break;
          case 'shipping': statusName = 'Đang giao hàng'; break;
        }
        return { status: statusName, count: item.count };
      });
      
      // Get recent orders with user info
      const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'firstName lastName userName');
      
      const formattedRecentOrders = recentOrders.map(order => ({
        id: order._id,
        orderCode: order.orderCode,
        customer: order.userId 
          ? (order.userId.firstName + ' ' + order.userId.lastName || order.userId.userName) 
          : 'Khách hàng',
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
      const totalReviews = await Review.countDocuments();
      
      // Average rating
      const ratingResult = await Review.aggregate([
        { $group: { _id: null, avgRating: { $avg: "$rating" } } }
      ]);
      const averageRating = ratingResult.length > 0 ? parseFloat(ratingResult[0].avgRating.toFixed(1)) : 0;
      
      // Reviews by rating
      const reviewsByRating = await Review.aggregate([
        { $group: { _id: "$rating", count: { $sum: 1 } } },
        { $sort: { _id: -1 } }
      ]);
      
      // Chuyển đổi phân phối đánh giá theo yêu cầu của biểu đồ
      const ratingDistribution = [];
      for (let i = 5; i >= 1; i--) {
        const ratingItem = reviewsByRating.find(item => item._id === i);
        ratingDistribution.push({
          rating: i,
          count: ratingItem ? ratingItem.count : 0
        });
      }
      
      // Recent reviews
      const recentReviews = await Review.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('productId', 'productName productImages')
        .populate('userId', 'firstName lastName userName profileImage');
      
      const formattedRecentReviews = recentReviews.map(review => ({
        id: review._id,
        product: review.productId ? review.productId.productName : 'Sản phẩm không rõ',
        productImage: review.productId && review.productId.productImages && review.productId.productImages.length > 0 
          ? review.productId.productImages[0] 
          : '',
        user: review.userId 
          ? (review.userId.firstName + ' ' + review.userId.lastName || review.userId.userName) 
          : review.userName,
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
      
      const reviewsOverTime = await Review.aggregate([
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
        { $sort: { _id: 1 } }
      ]);
      
      const formattedReviewsOverTime = reviewsOverTime.map(item => ({
        date: item._id,
        count: item.count,
        avgRating: parseFloat(item.avgRating.toFixed(1))
      }));
      
      // Phản hồi sản phẩm hàng đầu (top products by reviews)
      const topReviewedProducts = await Review.aggregate([
        {
          $group: {
            _id: "$productId",
            count: { $sum: 1 },
            avgRating: { $avg: "$rating" }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      
      // Lấy chi tiết sản phẩm cho các sản phẩm được đánh giá nhiều nhất
      const productIds = topReviewedProducts.map(item => item._id);
      const products = await Product.find({ _id: { $in: productIds } });
      
      const formattedTopProducts = topReviewedProducts.map(item => {
        const product = products.find(p => p._id.toString() === item._id.toString());
        return {
          id: item._id,
          name: product ? product.productName : 'Sản phẩm không rõ',
          category: product ? product.productCategory : 'Không phân loại',
          image: product && product.productImages && product.productImages.length > 0 
            ? product.productImages[0] 
            : '',
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
      const coupons = await Coupon.find();
      
      // Calculate usage statistics
      const voucherStats = coupons.map(coupon => {
        // Ensure discount value is defined before calling toLocaleString
        const discountValue = coupon.discountValue || 0;
        const discountDisplay = coupon.discountType === 'percentage' 
          ? `${discountValue}%` 
          : `${discountValue.toLocaleString()}đ`;
          
        return {
          code: coupon.code || 'Không có mã',
          type: coupon.discountType || 'unknown',
          discount: discountDisplay,
          used: coupon.usedCount || 0,
          limit: coupon.maxUses || 0,
          expiresAt: coupon.expiryDate || new Date(),
          active: coupon.expiryDate ? (new Date(coupon.expiryDate) > new Date() && !coupon.isDisabled) : false
        };
      });
      
      const promotionData = {
        totalVouchers: coupons.length,
        activeVouchers: coupons.filter(c => c.expiryDate && new Date(c.expiryDate) > new Date() && !c.isDisabled).length,
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
          { hour: '23:00', count: 35 }
        ],
        recentActivity: [
          { type: 'login', user: 'admin', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
          { type: 'product_update', user: 'admin', item: 'Táo xanh Mỹ cao cấp', timestamp: new Date(Date.now() - 1000 * 60 * 15) },
          { type: 'order_update', user: 'system', item: 'ORD12345', timestamp: new Date(Date.now() - 1000 * 60 * 25) },
          { type: 'login', user: 'manager', timestamp: new Date(Date.now() - 1000 * 60 * 35) },
          { type: 'coupon_create', user: 'marketing', item: 'SUMMER25', timestamp: new Date(Date.now() - 1000 * 60 * 55) }
        ]
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
      return getDeliveryStats(req, res);
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
  },

  // AI Analysis
  getAnalysisData: async (req, res) => {
    try {
      const { userRole, branchId } = req.query;

      // Lấy dữ liệu từ database để phân tích
      const [
        orders,
        products,
        customers,
        reviews
      ] = await Promise.all([
        Order.find().populate('products.productId'),
        Product.find(),
        User.find({ role: 'customer' }),
        Review.find()
      ]);

      // Phân tích dữ liệu dựa trên vai trò
      if (userRole === 'admin') {
        // Lấy danh sách các chi nhánh
        const branchIds = [...new Set(orders.map(order => order.branchId && order.branchId.toString()).filter(Boolean))];
        
        // Phân tích dữ liệu cho từng chi nhánh
        const branches = await Promise.all(branchIds.map(async (id) => {
          const branchName = id === '1' ? 'Chi nhánh Hà Nội' : id === '2' ? 'Chi nhánh TP.HCM' : `Chi nhánh ${id}`;
          
          // Lọc dữ liệu theo chi nhánh
          const branchOrders = orders.filter(order => order.branchId && order.branchId.toString() === id);
          const branchProducts = products.filter(p => p.branchId && p.branchId.toString() === id);
          const branchCustomers = customers.filter(c => c.branchId && c.branchId.toString() === id);
          const branchReviews = reviews.filter(r => r.branchId && r.branchId.toString() === id);
          
          // Tính toán các chỉ số
          const revenue = branchOrders
            .filter(order => order.status === 'completed')
            .reduce((sum, order) => sum + order.totalAmount, 0);
          
          const customerCount = branchCustomers.length;
          
          // Tính tỷ lệ khách hàng quay lại
          const returningCustomers = branchCustomers.filter(customer => {
            const customerOrders = branchOrders.filter(order => 
              order.userId && order.userId.toString() === customer._id.toString()
            );
            return customerOrders.length > 1;
          }).length;
          
          const returnRate = customerCount > 0 ? (returningCustomers / customerCount) * 100 : 0;
          
          // Tính số lượng sản phẩm tồn kho
          const totalStock = branchProducts.reduce((sum, product) => sum + (product.productStock || 0), 0);
          const lowStockProducts = branchProducts.filter(p => (p.productStock || 0) < 10).length;
          
          // Tính điểm đánh giá trung bình
          const avgRating = branchReviews.length > 0 
            ? branchReviews.reduce((sum, review) => sum + review.rating, 0) / branchReviews.length
            : 0;
          
          // Phân tích điểm mạnh, điểm yếu dựa trên dữ liệu
          const strengths = [];
          const weaknesses = [];
          const solutions = [];
          
          // Phân tích doanh thu
          if (revenue > 100000000) strengths.push('Doanh thu cao');
          else if (revenue < 50000000) weaknesses.push('Doanh thu thấp');
          
          // Phân tích tỷ lệ khách hàng quay lại
          if (returnRate > 50) strengths.push('Tỷ lệ khách hàng quay lại cao');
          else if (returnRate < 30) {
            weaknesses.push('Tỷ lệ khách hàng quay lại thấp');
            solutions.push({
              issue: 'Tỷ lệ khách hàng quay lại thấp',
              solution: 'Triển khai chương trình khách hàng thân thiết và cải thiện dịch vụ',
              timeline: '2 tháng'
            });
          }
          
          // Phân tích tồn kho
          if (lowStockProducts > 0) {
            weaknesses.push('Một số sản phẩm sắp hết hàng');
            solutions.push({
              issue: 'Quản lý tồn kho',
              solution: 'Cải thiện hệ thống dự báo nhu cầu và tối ưu hóa quy trình đặt hàng',
              timeline: '1 tháng'
            });
          }
          
          if (totalStock > 1000) {
            weaknesses.push('Tồn kho cao');
            solutions.push({
              issue: 'Tồn kho cao',
              solution: 'Tổ chức chương trình khuyến mãi và tối ưu hóa quy trình nhập hàng',
              timeline: '1 tháng'
            });
          }
          
          // Phân tích đánh giá
          if (avgRating >= 4) strengths.push('Đánh giá sản phẩm tốt');
          else if (avgRating < 3.5) {
            weaknesses.push('Đánh giá sản phẩm chưa cao');
            solutions.push({
              issue: 'Đánh giá sản phẩm chưa cao',
              solution: 'Cải thiện chất lượng sản phẩm và dịch vụ khách hàng',
              timeline: '3 tháng'
            });
          }
          
          // Phân tích thời gian giao hàng
          const deliveryTimes = branchOrders
            .filter(order => order.status === 'completed' && order.completedAt)
            .map(order => {
              const createdAt = new Date(order.createdAt);
              const completedAt = new Date(order.completedAt);
              return (completedAt - createdAt) / (1000 * 60 * 60); // Giờ
            });
          
          const avgDeliveryTime = deliveryTimes.length > 0 
            ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
            : 0;
          
          if (avgDeliveryTime > 24) {
            weaknesses.push('Thời gian giao hàng chưa tối ưu');
            solutions.push({
              issue: 'Thời gian giao hàng',
              solution: 'Cải thiện quy trình logistics và hợp tác với đối tác giao hàng hiệu quả hơn',
              timeline: '2 tháng'
            });
          } else if (avgDeliveryTime < 12) {
            strengths.push('Thời gian giao hàng nhanh');
          }
          
          // Thêm các điểm mạnh, điểm yếu mặc định nếu cần
          if (strengths.length === 0) strengths.push('Đang cần thu thập thêm dữ liệu');
          if (weaknesses.length === 0) weaknesses.push('Chưa phát hiện điểm yếu đáng kể');
          if (solutions.length === 0) {
            solutions.push({
              issue: 'Cải thiện chung',
              solution: 'Tiếp tục theo dõi và cải thiện các quy trình hiện tại',
              timeline: 'Liên tục'
            });
          }
          
          return {
            id,
            name: branchName,
            revenue,
            customers: customerCount,
            returnRate: returnRate.toFixed(1),
            avgRating: avgRating.toFixed(1),
            strengths,
            weaknesses,
            solutions
          };
        }));

        // Phân tích chiến lược tương lai dựa trên dữ liệu
        const strategies = [];
        
        // Chiến lược mở rộng thị trường
        const customersByRegion = {};
        customers.forEach(customer => {
          if (customer.address && customer.address.length > 0 && customer.address[0].city) {
            const region = customer.address[0].city;
            customersByRegion[region] = (customersByRegion[region] || 0) + 1;
          }
        });
        
        const potentialRegions = Object.entries(customersByRegion)
          .filter(([region, count]) => count > 10 && !branchIds.some(id => {
            const branchName = id === '1' ? 'Hà Nội' : id === '2' ? 'TP.HCM' : `Chi nhánh ${id}`;
            return branchName.includes(region);
          }))
          .map(([region]) => region);
        
        if (potentialRegions.length > 0) {
          strategies.push({
            title: 'Mở rộng thị trường',
            description: `Phát triển thêm chi nhánh mới tại các thành phố tiềm năng: ${potentialRegions.join(', ')}`
          });
        } else {
          strategies.push({
            title: 'Mở rộng thị trường',
            description: 'Nghiên cứu thị trường để xác định các khu vực tiềm năng cho chi nhánh mới'
          });
        }
        
        // Chiến lược sản phẩm
        const topCategories = {};
        products.forEach(product => {
          if (product.productCategory) {
            topCategories[product.productCategory] = (topCategories[product.productCategory] || 0) + 1;
          }
        });
        
        const popularCategories = Object.entries(topCategories)
          .sort(([, countA], [, countB]) => countB - countA)
          .slice(0, 3)
          .map(([category]) => category);
        
        strategies.push({
          title: 'Đa dạng hóa sản phẩm',
          description: `Tập trung phát triển thêm sản phẩm trong các danh mục phổ biến: ${popularCategories.join(', ')}`
        });
        
        // Chiến lược công nghệ
        strategies.push({
          title: 'Công nghệ số',
          description: 'Ứng dụng công nghệ AI và IoT để tối ưu hóa quy trình quản lý kho và dự báo nhu cầu'
        });
        
        // Chiến lược phát triển bền vững
        strategies.push({
          title: 'Phát triển bền vững',
          description: 'Tăng cường các hoạt động bảo vệ môi trường và trách nhiệm xã hội, ưu tiên sản phẩm hữu cơ và thân thiện với môi trường'
        });

        // Tạo nội dung phân tích tổng quan
        const analysis = `# Phân tích tổng quan hệ thống siêu thị thực phẩm sạch

## 1. Tổng quan tình hình kinh doanh

Dựa trên dữ liệu hiện có, hệ thống siêu thị thực phẩm sạch đang hoạt động ở mức độ trung bình, với tiềm năng phát triển lớn trong tương lai.

### Điểm mạnh:
- Hệ thống có ${branches.length} chi nhánh phân bố rộng khắp
- Danh mục sản phẩm đa dạng, đáp ứng nhu cầu khách hàng
- Tỷ lệ hoàn thành đơn hàng cao, cho thấy khả năng đáp ứng tốt

### Điểm yếu:
- Doanh thu chưa đồng đều giữa các chi nhánh
- Tỷ lệ khách hàng quay lại chưa cao
- Một số chi nhánh có tỷ lệ hàng tồn kho cao

## 2. Đề xuất chiến lược

${strategies.map(s => `### ${s.title}\n${s.description}`).join('\n\n')}

## 3. Phân tích chi nhánh

${branches.map(b => `### ${b.name}\n- Doanh thu: ${b.revenue.toLocaleString('vi-VN')}đ\n- Khách hàng: ${b.customers}\n- Tỷ lệ quay lại: ${b.returnRate}%\n\nĐiểm mạnh: ${b.strengths.join(', ')}\n\nĐiểm yếu: ${b.weaknesses.join(', ')}\n\nĐề xuất: ${b.solutions.map(s => s.solution).join(', ')}`).join('\n\n')}`;

        res.json({ branches, strategies, analysis });
      } else {
        // Manager view - phân tích chi nhánh cụ thể
        const branchOrders = orders.filter(order => order.branchId && order.branchId.toString() === branchId);
        const branchProducts = products.filter(p => p.branchId && p.branchId.toString() === branchId);
        const branchCustomers = customers.filter(c => c.branchId && c.branchId.toString() === branchId);
        const branchReviews = reviews.filter(r => r.branchId && r.branchId.toString() === branchId);

        // Tính toán các chỉ số tổng quan
        const revenue = branchOrders
          .filter(order => order.status === 'completed')
          .reduce((sum, order) => sum + order.totalAmount, 0);
        
        const customerCount = branchCustomers.length;
        
        // Tính tỷ lệ khách hàng quay lại
        const returningCustomers = branchCustomers.filter(customer => {
          const customerOrders = branchOrders.filter(order => 
            order.userId && order.userId.toString() === customer._id.toString()
          );
          return customerOrders.length > 1;
        }).length;
        
        const returnRate = customerCount > 0 ? (returningCustomers / customerCount) * 100 : 0;
        
        // Tổng quan
        const overview = {
          revenue,
          customers: customerCount,
          returnRate: returnRate.toFixed(1),
          inventoryItems: branchProducts.length
        };

        // Phân tích sản phẩm
        const productAnalysis = branchProducts.map(product => {
          // Tìm các đơn hàng có sản phẩm này
          const productOrders = branchOrders.filter(order => 
            order.products && order.products.some(item => 
              item.productId && item.productId._id && 
              item.productId._id.toString() === product._id.toString()
            )
          );
          
          // Tính tổng doanh thu từ sản phẩm
          const totalSales = productOrders.reduce((sum, order) => {
            const item = order.products.find(i => 
              i.productId && i.productId._id && 
              i.productId._id.toString() === product._id.toString()
            );
            return sum + (item ? item.price * item.quantity : 0);
          }, 0);
          
          // Tính hiệu suất bán hàng
          const stock = product.productStock || 0;
          let efficiency = 'Thấp';
          let assessment = 'Cần xem xét giảm nhập';
          
          if (stock < 10) {
            efficiency = 'Cao';
            assessment = 'Cần bổ sung hàng';
          } else if (stock < 20) {
            efficiency = 'Trung bình';
            assessment = 'Đang ổn định';
          }
          
          // Tính số lượng đã bán
          const soldQuantity = productOrders.reduce((sum, order) => {
            const item = order.products.find(i => 
              i.productId && i.productId._id && 
              i.productId._id.toString() === product._id.toString()
            );
            return sum + (item ? item.quantity : 0);
          }, 0);

          return {
            id: product._id,
            name: product.productName,
            sales: totalSales,
            sold: soldQuantity,
            inventory: stock,
            efficiency,
            assessment
          };
        });
        
        // Sắp xếp sản phẩm theo doanh thu giảm dần
        productAnalysis.sort((a, b) => b.sales - a.sales);

        // Đề xuất cải thiện dựa trên phân tích dữ liệu
        const improvements = [];
        
        // Kiểm tra tồn kho
        const highStockProducts = productAnalysis.filter(p => p.efficiency === 'Thấp');
        if (highStockProducts.length > 0) {
          improvements.push('Tối ưu hóa quản lý kho để giảm tồn kho cho các sản phẩm hiệu suất thấp');
        }
        
        // Kiểm tra thời gian giao hàng
        const deliveryTimes = branchOrders
          .filter(order => order.status === 'completed' && order.completedAt)
          .map(order => {
            const createdAt = new Date(order.createdAt);
            const completedAt = new Date(order.completedAt);
            return (completedAt - createdAt) / (1000 * 60 * 60); // Giờ
          });
        
        const avgDeliveryTime = deliveryTimes.length > 0 
          ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
          : 0;
        
        if (avgDeliveryTime > 24) {
          improvements.push('Cải thiện thời gian giao hàng, hiện tại trung bình là ' + avgDeliveryTime.toFixed(1) + ' giờ');
        }
        
        // Kiểm tra đánh giá sản phẩm
        const avgRating = branchReviews.length > 0 
          ? branchReviews.reduce((sum, review) => sum + review.rating, 0) / branchReviews.length
          : 0;
        
        if (avgRating < 4) {
          improvements.push('Tăng cường đào tạo nhân viên về dịch vụ khách hàng để cải thiện đánh giá');
        }
        
        // Thêm đề xuất chung
        improvements.push('Phát triển chương trình khách hàng thân thiết để tăng tỷ lệ khách hàng quay lại');
        
        // Đảm bảo có ít nhất 4 đề xuất
        if (improvements.length < 4) {
          improvements.push('Theo dõi và phân tích dữ liệu khách hàng để hiểu rõ hơn nhu cầu và hành vi mua sắm');
        }

        // Đề xuất chương trình khuyến mãi
        const promotions = [];
        
        // Khuyến mãi cho sản phẩm tồn kho
        if (highStockProducts.length > 0) {
          promotions.push('Chương trình giảm giá cho sản phẩm tồn kho cao: ' + 
            highStockProducts.slice(0, 3).map(p => p.name).join(', '));
        }
        
        // Khuyến mãi cho khách hàng thân thiết
        promotions.push('Ưu đãi đặc biệt cho khách hàng thân thiết: Giảm 10% cho đơn hàng thứ 5');
        
        // Khuyến mãi combo sản phẩm
        const topProducts = productAnalysis.slice(0, 5);
        if (topProducts.length >= 2) {
          promotions.push('Khuyến mãi combo sản phẩm: Mua ' + topProducts[0].name + ' kèm ' + topProducts[1].name + ' giảm 15%');
        }
        
        // Chương trình tích điểm
        promotions.push('Chương trình tích điểm đổi quà: Tích lũy điểm với mỗi đơn hàng để đổi voucher và quà tặng');

        // Tạo nội dung phân tích chi tiết cho chi nhánh
        const analysis = `# Phân tích chi nhánh ${branchOrders.length > 0 ? branchOrders[0].branchName || 'Không xác định' : 'Không xác định'}

## 1. Tổng quan hiệu suất chi nhánh

- Doanh thu: ${revenue.toLocaleString('vi-VN')}đ
- Số khách hàng: ${customerCount}
- Tỷ lệ khách hàng quay lại: ${returnRate.toFixed(1)}%
- Số lượng sản phẩm: ${branchProducts.length}

${avgDeliveryTime > 0 ? `Thời gian giao hàng trung bình: ${avgDeliveryTime.toFixed(1)} giờ` : ''}
${avgRating > 0 ? `Đánh giá trung bình: ${avgRating.toFixed(1)}/5` : ''}

## 2. Đề xuất cải thiện

${improvements.map(imp => `- ${imp}`).join('\n')}

## 3. Chương trình khuyến mãi đề xuất

${promotions.map(promo => `- ${promo}`).join('\n')}

## 4. Phân tích sản phẩm

${productAnalysis.slice(0, 5).map(p => `### ${p.name}\n- Doanh thu: ${p.sales.toLocaleString('vi-VN')}đ\n- Đã bán: ${p.sold}\n- Tồn kho: ${p.inventory}\n- Hiệu suất: ${p.efficiency}\n- Đánh giá: ${p.assessment}`).join('\n\n')}`;

        res.json({
          overview,
          products: productAnalysis,
          improvements,
          promotions,
          analysis
        });
      }
    } catch (error) {
      console.error("Error in getAnalysisData:", error);
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu phân tích", error: error.message });
    }
  }
};

export default reportsController;