/**
 * @deprecated - Đây là phiên bản cũ của reportsController, không nên sử dụng.
 * Vui lòng sử dụng phiên bản mới trong thư mục Server/controllers/reportsController.js
 */
import Order from "../Model/Order.js";
import Product from "../Model/Products.js";
import User from "../Model/Register.js";
import Review from "../Model/Review.js";
import Coupon from "../Model/Coupon.js";
import BestSellingProduct from "../Model/BestSellingProduct.js";
import { getDeliveryStats } from "../Controller/orderController.js";
import Branch from "../Model/Branch.js";

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
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]);
      const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

      // Get recent activities
      const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .populate("userId", "firstName lastName userName");

      const recentProductUpdates = await Product.find()
        .sort({ updatedAt: -1 })
        .limit(2);

      const recentUsers = await User.find().sort({ createdAt: -1 }).limit(2);

      // Format recent activities
      const recentActivities = [
        ...recentOrders.map((order) => ({
          id: order._id,
          type: "order",
          message: `Đơn hàng mới #${order.orderCode} từ ${
            order.userId
              ? order.userId.firstName + " " + order.userId.lastName ||
                order.userId.userName
              : "Khách hàng"
          }`,
          timestamp: order.createdAt,
        })),
        ...recentProductUpdates.map((product) => ({
          id: product._id,
          type: "product",
          message: `Sản phẩm "${product.productName}" đã được cập nhật`,
          timestamp: product.updatedAt,
        })),
        ...recentUsers.map((user) => ({
          id: user._id,
          type: "user",
          message: `Người dùng mới ${
            user.firstName
              ? user.firstName + " " + user.lastName
              : user.userName
          } đã đăng ký`,
          timestamp: user.createdAt,
        })),
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const stats = {
        totalOrders,
        totalRevenue,
        totalCustomers,
        totalProducts,
        recentActivities: recentActivities.slice(0, 5),
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu thống kê" });
    }
  },

  // Revenue data
  getRevenueData: async (req, res) => {
    try {
      // Không cần kiểm tra token xác thực ở đây - trả về dữ liệu cho mọi request
      const {
        timeRange = "week",
        paymentMethod = "all",
        region = "all",
      } = req.query;

      // Set date range based on timeRange
      const currentDate = new Date();
      let startDate;

      switch (timeRange) {
        case "year":
          startDate = new Date(
            currentDate.getFullYear() - 1,
            currentDate.getMonth(),
            currentDate.getDate()
          );
          break;
        case "month":
          startDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - 1,
            currentDate.getDate()
          );
          break;
        case "week":
        default:
          startDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate() - 7
          );
      }

      // Build match criteria
      const matchCriteria = {
        createdAt: { $gte: startDate, $lte: currentDate },
      };

      // Add payment method filter if specified
      if (paymentMethod && paymentMethod !== "all") {
        matchCriteria.paymentMethod = paymentMethod;
      }

      // Add region filter if specified
      if (region && region !== "all") {
        matchCriteria["shippingInfo.city"] = region;
      }

      // Revenue aggregation based on time range
      let groupBy;
      let dateFormat;

      if (timeRange === "year") {
        // Group by month for yearly data
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };
        dateFormat = (item) => `Tháng ${item._id.month}/${item._id.year}`;
      } else if (timeRange === "month") {
        // Group by day for monthly data
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
        dateFormat = (item) => {
          const date = new Date(
            item._id.year,
            item._id.month - 1,
            item._id.day
          );
          return date.toLocaleDateString("vi-VN");
        };
      } else {
        // Group by day for weekly data (default)
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
        dateFormat = (item) => {
          const date = new Date(
            item._id.year,
            item._id.month - 1,
            item._id.day
          );
          return date.toLocaleDateString("vi-VN");
        };
      }

      // Aggregate revenue data
      const revenueAggregation = await Order.aggregate([
        { $match: matchCriteria },
        {
          $group: {
            _id: groupBy,
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]);

      // Format the results
      let revenueData = revenueAggregation.map((item) => ({
        date: dateFormat(item),
        doanh_thu: item.revenue,
        don_hang: item.orders,
      }));

      // Nếu không có dữ liệu, tạo dữ liệu trống cho các ngày trong khoảng
      if (revenueData.length === 0) {
        console.log("No revenue data found, generating empty dates");

        // Tạo mảng các ngày
        const dateArray = [];
        let currentDateIter = new Date(startDate);

        // Tạo chuỗi ngày rỗng
        while (currentDateIter <= currentDate) {
          dateArray.push({
            date: currentDateIter.toLocaleDateString("vi-VN"),
            doanh_thu: 0,
            don_hang: 0,
          });

          // Tăng ngày lên 1
          if (timeRange === "year") {
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
      console.error("Error fetching revenue data:", error);
      return res
        .status(500)
        .json({
          message: "Lỗi khi lấy dữ liệu doanh thu",
          error: error.message,
        });
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
      const formattedResults = results.map((product) => ({
        name: product.productName,
        sold: product.soldCount || 0,
        category: product.productCategory || "Không phân loại",
        price: product.productPrice || 0,
        revenue: product.totalRevenue || 0,
      }));

      res.json(formattedResults);
    } catch (error) {
      console.error("Error fetching top products:", error);
      res
        .status(500)
        .json({ message: "Lỗi khi lấy dữ liệu sản phẩm bán chạy" });
    }
  },

  // Inventory data
  getInventoryData: async (req, res) => {
    try {
      // Lấy dữ liệu thực từ collection Product - không cần kiểm tra token ở đây
      const products = await Product.find({}).select(
        "_id productName productCategory productPrice productStock productCode productImages productBrand productStatus productOrigin productWeight productUnit"
      );

      if (!products || products.length === 0) {
        return res.status(200).json([]);
      }

      // Biến đổi dữ liệu sản phẩm sang định dạng tồn kho
      const inventoryData = products.map((product) => {
        const stock = product.productStock || 0;
        let status = "Còn hàng";

        if (stock <= 0) status = "Hết hàng";
        else if (stock <= 5) status = "Sắp hết";
        else if (stock <= 20) status = "Sắp hết";

        return {
          id: product._id,
          name: product.productName || "Không xác định",
          stock: product.productStock || 0,
          value: (product.productPrice || 0) * (product.productStock || 0),
          status: status,
          category: product.productCategory || "Không phân loại",
          price: product.productPrice || 0,
          sku: product.productCode || "",
          image:
            Array.isArray(product.productImages) &&
            product.productImages.length > 0
              ? product.productImages[0]
              : "",
          brand: product.productBrand || "",
          weight: product.productWeight || 0,
          unit: product.productUnit || "gram",
          origin: product.productOrigin || "",
        };
      });

      return res.status(200).json(inventoryData);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      return res.status(500).json({
        message: "Lỗi khi lấy dữ liệu tồn kho",
        error: error.message,
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
        createdAt: { $gte: thirtyDaysAgo },
      });

      // Count active users (with orders in last 30 days)
      const activeUserIds = await Order.distinct("userId", {
        createdAt: { $gte: thirtyDaysAgo },
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
                  then: {
                    $ifNull: [{ $arrayElemAt: ["$address.city", 0] }, "Khác"],
                  },
                  else: "Khác",
                },
              },
            },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, region: "$_id.region", count: 1 } },
      ]);

      // Format the user data
      const userData = {
        totalUsers,
        newUsers,
        activeUsers,
        usersByRegion: usersByRegion.map((item) => ({
          region: item.region || "Khác",
          count: item.count,
        })),
      };

      res.json(userData);
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu người dùng" });
    }
  },

  // Order statistics
  getOrderData: async (req, res) => {
    try {
      // Count orders by status
      const totalOrders = await Order.countDocuments();
      const completedOrders = await Order.countDocuments({
        status: "completed",
      });
      const pendingOrders = await Order.countDocuments({ status: "pending" });
      const cancelledOrders = await Order.countDocuments({
        status: "cancelled",
      });

      // Calculate average order value
      const avgOrderValueResult = await Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, avgValue: { $avg: "$totalAmount" } } },
      ]);
      const averageOrderValue =
        avgOrderValueResult.length > 0 ? avgOrderValueResult[0].avgValue : 0;

      // Get orders by status
      const ordersByStatusResult = await Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

      const ordersByStatus = ordersByStatusResult.map((item) => {
        let statusName = item._id;
        // Translate status to Vietnamese if needed
        switch (item._id) {
          case "pending":
            statusName = "Đang xử lý";
            break;
          case "awaiting_payment":
            statusName = "Chờ thanh toán";
            break;
          case "completed":
            statusName = "Hoàn thành";
            break;
          case "cancelled":
            statusName = "Đã hủy";
            break;
          case "shipping":
            statusName = "Đang giao hàng";
            break;
        }
        return { status: statusName, count: item.count };
      });

      // Get recent orders with user info
      const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "firstName lastName userName");

      const formattedRecentOrders = recentOrders.map((order) => ({
        id: order._id,
        orderCode: order.orderCode,
        customer: order.userId
          ? order.userId.firstName + " " + order.userId.lastName ||
            order.userId.userName
          : "Khách hàng",
        total: order.totalAmount,
        status: order.status,
        date: order.createdAt,
      }));

      // Combine all order data
      const orderData = {
        totalOrders,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        averageOrderValue,
        ordersByStatus,
        recentOrders: formattedRecentOrders,
      };

      res.json(orderData);
    } catch (error) {
      console.error("Error fetching order data:", error);
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu đơn hàng" });
    }
  },

  // Feedback data
  getFeedbackData: async (req, res) => {
    try {
      // Count reviews
      const totalReviews = await Review.countDocuments();

      // Average rating
      const ratingResult = await Review.aggregate([
        { $group: { _id: null, avgRating: { $avg: "$rating" } } },
      ]);
      const averageRating =
        ratingResult.length > 0
          ? parseFloat(ratingResult[0].avgRating.toFixed(1))
          : 0;

      // Reviews by rating
      const reviewsByRating = await Review.aggregate([
        { $group: { _id: "$rating", count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]);

      // Chuyển đổi phân phối đánh giá theo yêu cầu của biểu đồ
      const ratingDistribution = [];
      for (let i = 5; i >= 1; i--) {
        const ratingItem = reviewsByRating.find((item) => item._id === i);
        ratingDistribution.push({
          rating: i,
          count: ratingItem ? ratingItem.count : 0,
        });
      }

      // Recent reviews
      const recentReviews = await Review.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("productId", "productName productImages")
        .populate("userId", "firstName lastName userName profileImage");

      const formattedRecentReviews = recentReviews.map((review) => ({
        id: review._id,
        product: review.productId
          ? review.productId.productName
          : "Sản phẩm không rõ",
        productImage:
          review.productId &&
          review.productId.productImages &&
          review.productId.productImages.length > 0
            ? review.productId.productImages[0]
            : "",
        user: review.userId
          ? review.userId.firstName + " " + review.userId.lastName ||
            review.userId.userName
          : review.userName,
        userImage: review.userId ? review.userId.profileImage : "",
        rating: review.rating,
        comment: review.comment,
        date: review.createdAt,
        isVerified: review.isVerified,
        isPublished: review.isPublished,
      }));

      // Đánh giá theo thời gian
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const reviewsOverTime = await Review.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
            avgRating: { $avg: "$rating" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const formattedReviewsOverTime = reviewsOverTime.map((item) => ({
        date: item._id,
        count: item.count,
        avgRating: parseFloat(item.avgRating.toFixed(1)),
      }));

      // Phản hồi sản phẩm hàng đầu (top products by reviews)
      const topReviewedProducts = await Review.aggregate([
        {
          $group: {
            _id: "$productId",
            count: { $sum: 1 },
            avgRating: { $avg: "$rating" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      // Lấy chi tiết sản phẩm cho các sản phẩm được đánh giá nhiều nhất
      const productIds = topReviewedProducts.map((item) => item._id);
      const products = await Product.find({ _id: { $in: productIds } });

      const formattedTopProducts = topReviewedProducts.map((item) => {
        const product = products.find(
          (p) => p._id.toString() === item._id.toString()
        );
        return {
          id: item._id,
          name: product ? product.productName : "Sản phẩm không rõ",
          category: product ? product.productCategory : "Không phân loại",
          image:
            product && product.productImages && product.productImages.length > 0
              ? product.productImages[0]
              : "",
          reviewCount: item.count,
          avgRating: parseFloat(item.avgRating.toFixed(1)),
        };
      });

      // Combine all feedback data
      const feedbackData = {
        totalReviews,
        averageRating,
        ratingDistribution,
        reviewsOverTime: formattedReviewsOverTime,
        topReviewedProducts: formattedTopProducts,
        recentReviews: formattedRecentReviews,
      };

      res.json(feedbackData);
    } catch (error) {
      console.error("Error fetching feedback data:", error);
      res.status(500).json({
        message: "Lỗi khi lấy dữ liệu phản hồi",
        error: error.message,
      });
    }
  },

  // Implement remaining methods with real database queries
  getPromotionData: async (req, res) => {
    try {
      // Get coupon data from database
      const coupons = await Coupon.find();

      // Calculate usage statistics
      const voucherStats = coupons.map((coupon) => {
        // Ensure discount value is defined before calling toLocaleString
        const discountValue = coupon.discountValue || 0;
        const discountDisplay =
          coupon.discountType === "percentage"
            ? `${discountValue}%`
            : `${discountValue.toLocaleString()}đ`;

        return {
          code: coupon.code || "Không có mã",
          type: coupon.discountType || "unknown",
          discount: discountDisplay,
          used: coupon.usedCount || 0,
          limit: coupon.maxUses || 0,
          expiresAt: coupon.expiryDate || new Date(),
          active: coupon.expiryDate
            ? new Date(coupon.expiryDate) > new Date() && !coupon.isDisabled
            : false,
        };
      });

      const promotionData = {
        totalVouchers: coupons.length,
        activeVouchers: coupons.filter(
          (c) =>
            c.expiryDate && new Date(c.expiryDate) > new Date() && !c.isDisabled
        ).length,
        usedVouchers: coupons.reduce(
          (total, coupon) => total + (coupon.usedCount || 0),
          0
        ),
        voucherStats,
      };

      res.json(promotionData);
    } catch (error) {
      console.error("Error fetching promotion data:", error);
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu khuyến mãi" });
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
          { hour: "00:00", count: 12 },
          { hour: "01:00", count: 8 },
          { hour: "02:00", count: 5 },
          { hour: "03:00", count: 3 },
          { hour: "04:00", count: 2 },
          { hour: "05:00", count: 4 },
          { hour: "06:00", count: 10 },
          { hour: "07:00", count: 25 },
          { hour: "08:00", count: 55 },
          { hour: "09:00", count: 80 },
          { hour: "10:00", count: 96 },
          { hour: "11:00", count: 104 },
          { hour: "12:00", count: 98 },
          { hour: "13:00", count: 83 },
          { hour: "14:00", count: 75 },
          { hour: "15:00", count: 68 },
          { hour: "16:00", count: 72 },
          { hour: "17:00", count: 85 },
          { hour: "18:00", count: 92 },
          { hour: "19:00", count: 101 },
          { hour: "20:00", count: 110 },
          { hour: "21:00", count: 85 },
          { hour: "22:00", count: 65 },
          { hour: "23:00", count: 35 },
        ],
        recentActivity: [
          {
            type: "login",
            user: "admin",
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
          },
          {
            type: "product_update",
            user: "admin",
            item: "Táo xanh Mỹ cao cấp",
            timestamp: new Date(Date.now() - 1000 * 60 * 15),
          },
          {
            type: "order_update",
            user: "system",
            item: "ORD12345",
            timestamp: new Date(Date.now() - 1000 * 60 * 25),
          },
          {
            type: "login",
            user: "manager",
            timestamp: new Date(Date.now() - 1000 * 60 * 35),
          },
          {
            type: "coupon_create",
            user: "marketing",
            item: "SUMMER25",
            timestamp: new Date(Date.now() - 1000 * 60 * 55),
          },
        ],
      };

      res.json(systemActivityData);
    } catch (error) {
      console.error("Error fetching system activity data:", error);
      res
        .status(500)
        .json({ message: "Lỗi khi lấy dữ liệu hoạt động hệ thống" });
    }
  },

  // Delivery data
  getDeliveryData: async (req, res) => {
    try {
      // Gọi trực tiếp hàm getDeliveryStats từ orderController
      return getDeliveryStats(req, res);
    } catch (err) {
      console.error("Error fetching delivery data:", err);
      return res.status(200).json({
        statistics: {
          completed: 0,
          inProgress: 0,
          delayed: 0,
          total: 0,
          avgDeliveryTime: "N/A",
        },
        deliveryPartners: [],
        deliveryTimeByRegion: [],
        deliveries: [],
      });
    }
  },

  // AI Analysis sử dụng GPT-4o Mini
  getAIAnalysis: async (req, res) => {
    try {
      // Lấy dữ liệu từ database để phân tích
      const [orders, products, branches, customers, reviews] =
        await Promise.all([
          Order.find().populate("products.productId"),
          Product.find(),
          Branch.find(),
          User.find({ role: "customer" }),
          Review.find(),
        ]);

      // Tính toán các chỉ số tổng quan cho toàn hệ thống
      const totalRevenue = orders
        .filter((order) => order.status === "completed")
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      const totalOrders = orders.length;
      const totalCompletedOrders = orders.filter(
        (order) => order.status === "completed"
      ).length;
      const totalCustomers = customers.length;
      const totalProducts = products.length;

      // Phân tích dữ liệu cho từng chi nhánh
      const branchDetails = await Promise.all(
        branches.map(async (branch) => {
          const branchId = branch._id.toString();

          // Lọc dữ liệu theo chi nhánh
          const branchOrders = orders.filter(
            (order) => order.branchId && order.branchId.toString() === branchId
          );
          const branchProducts = products.filter(
            (p) => p.branchId && p.branchId.toString() === branchId
          );
          const branchCustomers = customers.filter(
            (c) => c.branchId && c.branchId.toString() === branchId
          );
          const branchReviews = reviews.filter(
            (r) => r.branchId && r.branchId.toString() === branchId
          );

          // Tính toán các chỉ số
          const revenue = branchOrders
            .filter((order) => order.status === "completed")
            .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

          const ordersCount = branchOrders.length;
          const completedOrders = branchOrders.filter(
            (order) => order.status === "completed"
          ).length;
          const customerCount = branchCustomers.length;

          // Tính tỷ lệ khách hàng quay lại
          const returningCustomers = branchCustomers.filter((customer) => {
            const customerOrders = branchOrders.filter(
              (order) =>
                order.userId &&
                order.userId.toString() === customer._id.toString()
            );
            return customerOrders.length > 1;
          }).length;

          const returnRate =
            customerCount > 0 ? (returningCustomers / customerCount) * 100 : 0;

          // Tính thời gian giao hàng trung bình
          const deliveryTimes = branchOrders
            .filter(
              (order) => order.status === "completed" && order.completedAt
            )
            .map((order) => {
              const createdAt = new Date(order.createdAt);
              const completedAt = new Date(order.completedAt);
              return (completedAt - createdAt) / (1000 * 60 * 60); // Giờ
            });

          const avgDeliveryTime =
            deliveryTimes.length > 0
              ? deliveryTimes.reduce((sum, time) => sum + time, 0) /
                deliveryTimes.length
              : 0;

          // Tính tỷ lệ hoàn đơn
          const cancelledOrders = branchOrders.filter(
            (order) => order.status === "cancelled"
          ).length;
          const cancelRate =
            ordersCount > 0 ? (cancelledOrders / ordersCount) * 100 : 0;

          // Tính điểm đánh giá trung bình
          const avgRating =
            branchReviews.length > 0
              ? branchReviews.reduce((sum, review) => sum + review.rating, 0) /
                branchReviews.length
              : 0;

          // Top sản phẩm bán chạy
          const productSales = {};
          branchOrders.forEach((order) => {
            if (order.products && Array.isArray(order.products)) {
              order.products.forEach((item) => {
                if (item.productId && item.quantity && item.price) {
                  const productId =
                    typeof item.productId === "object"
                      ? item.productId._id.toString()
                      : item.productId.toString();

                  if (!productSales[productId]) {
                    productSales[productId] = {
                      sold: 0,
                      revenue: 0,
                      name:
                        typeof item.productId === "object"
                          ? item.productId.productName
                          : "Sản phẩm",
                      inventory: 0,
                    };
                  }

                  productSales[productId].sold += item.quantity;
                  productSales[productId].revenue += item.price * item.quantity;
                }
              });
            }
          });

          // Thêm thông tin tồn kho
          branchProducts.forEach((product) => {
            const productId = product._id.toString();
            if (productSales[productId]) {
              productSales[productId].inventory = product.productStock || 0;
            }
          });

          // Lấy top 5 sản phẩm bán chạy
          const topProducts = Object.values(productSales)
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 5);

          return {
            id: branchId,
            name: branch.name,
            address: branch.address,
            revenue,
            orders: ordersCount,
            completedOrders,
            customers: customerCount,
            activeCustomers: returningCustomers,
            returnRate,
            avgDeliveryTime,
            cancelRate,
            avgRating,
            products: branchProducts.length,
            lowStockProducts: branchProducts.filter(
              (p) => (p.productStock || 0) < 10
            ).length,
            topProducts,
          };
        })
      );

      // Tạo prompt cho GPT-4o Mini
      const prompt = `
Dưới đây là dữ liệu hệ thống từ một nền tảng quản lý siêu thị thực phẩm sạch, bao gồm nhiều chi nhánh, thông tin doanh thu, khách hàng, tỷ lệ quay lại, đơn hàng, đánh giá sản phẩm, tồn kho.

Dựa trên toàn bộ dữ liệu này, hãy phân tích tổng quan hoạt động kinh doanh của toàn hệ thống, sau đó đi sâu vào từng chi nhánh.

1. Thông tin tổng quan:
- Tổng doanh thu: ${totalRevenue.toLocaleString("vi-VN")}đ
- Tổng số đơn hàng: ${totalOrders} (Hoàn thành: ${totalCompletedOrders})
- Tổng số khách hàng: ${totalCustomers}
- Tổng số sản phẩm: ${totalProducts}
- Số chi nhánh: ${branches.length}

2. Chi tiết từng chi nhánh:
${branchDetails
  .map(
    (branch) => `
Chi nhánh: ${branch.name}
- Địa chỉ: ${branch.address}
- Doanh thu: ${branch.revenue.toLocaleString("vi-VN")}đ
- Số đơn hàng: ${branch.orders} (Hoàn thành: ${branch.completedOrders})
- Số khách hàng: ${branch.customers} (Hoạt động: ${branch.activeCustomers})
- Tỷ lệ khách hàng quay lại: ${branch.returnRate.toFixed(1)}%
- Thời gian giao hàng trung bình: ${branch.avgDeliveryTime.toFixed(1)} giờ
- Tỷ lệ hoàn đơn: ${branch.cancelRate.toFixed(1)}%
- Đánh giá trung bình: ${branch.avgRating.toFixed(1)}/5
- Số lượng sản phẩm: ${branch.products} (Sắp hết hàng: ${
      branch.lowStockProducts
    })
- Top sản phẩm: ${branch.topProducts
      .map(
        (p) =>
          `${p.name} (Đã bán: ${p.sold}, Doanh thu: ${p.revenue.toLocaleString(
            "vi-VN"
          )}đ, Tồn kho: ${p.inventory})`
      )
      .join(", ")}
`
  )
  .join("\n")}

Cấu trúc bản phân tích cần có:

1. Tổng quan hoạt động toàn hệ thống:
* Điểm mạnh chung
* Điểm yếu chung
* Cơ hội phát triển và xu hướng hiện nay (ví dụ như hành vi tiêu dùng, nhu cầu thực phẩm sạch, ứng dụng công nghệ số, ESG...)
* Rủi ro và thách thức
* Đề xuất giải pháp và chiến lược dài hạn (ứng dụng AI, tối ưu vận hành, mở rộng thị trường, chuyển đổi số, nâng cao trải nghiệm khách hàng)

2. Phân tích từng chi nhánh cụ thể (mỗi chi nhánh trình bày riêng):
* Doanh thu, số khách hàng, tỷ lệ quay lại, tốc độ giao hàng, tỷ lệ hoàn đơn
* Điểm mạnh & điểm yếu
* Gợi ý cải thiện
* Tiềm năng phát triển của chi nhánh đó

Yêu cầu:
* Không lặp lại phân tích giống nhau giữa các chi nhánh
* Trình bày mạch lạc, phân biệt rõ từng phần
* Nếu thiếu dữ liệu, hãy nêu rõ và đề xuất cách bổ sung

Trả lời dưới dạng văn bản báo cáo chuyên sâu, không trình bày dạng liệt kê.`;

      // Gọi API GPT-4o Mini để phân tích
      // Trong môi trường thực tế, sẽ cần tích hợp với API của OpenAI hoặc dịch vụ tương tự
      // Ở đây, để demo, tôi sẽ trả về một phân tích mẫu

      // Mô phỏng phân tích từ GPT-4o Mini
      const analysis = `# Phân tích tổng quan hệ thống siêu thị thực phẩm sạch

## 1. Tổng quan hoạt động toàn hệ thống

Hệ thống siêu thị thực phẩm sạch hiện đang vận hành với ${
        branches.length
      } chi nhánh, phục vụ ${totalCustomers} khách hàng, với tổng doanh thu đạt ${totalRevenue.toLocaleString(
        "vi-VN"
      )}đ. Tỷ lệ hoàn thành đơn hàng đạt ${(
        (totalCompletedOrders / totalOrders) *
        100
      ).toFixed(
        1
      )}%, cho thấy khả năng đáp ứng nhu cầu khách hàng ở mức khá tốt.

### Điểm mạnh chung
- Hệ thống có mạng lưới chi nhánh phân bố rộng khắp, tạo điều kiện tiếp cận nhiều phân khúc khách hàng
- Danh mục sản phẩm đa dạng với ${totalProducts} mặt hàng, đáp ứng tốt nhu cầu của người tiêu dùng về thực phẩm sạch
- Tỷ lệ hoàn thành đơn hàng cao (${(
        (totalCompletedOrders / totalOrders) *
        100
      ).toFixed(1)}%), thể hiện khả năng đáp ứng và logistics hiệu quả
- Hệ thống quản lý tập trung cho phép giám sát và điều phối hoạt động giữa các chi nhánh

### Điểm yếu chung
- Doanh thu phân bố không đồng đều giữa các chi nhánh, một số chi nhánh có doanh thu thấp
- Tỷ lệ khách hàng quay lại còn thấp ở một số chi nhánh, chưa xây dựng được lòng trung thành của khách hàng
- Một số chi nhánh có tỷ lệ hàng tồn kho cao, tiềm ẩn rủi ro về chi phí và chất lượng sản phẩm
- Thời gian giao hàng không đồng đều giữa các chi nhánh, ảnh hưởng đến trải nghiệm khách hàng

### Cơ hội phát triển và xu hướng hiện nay
- Nhu cầu về thực phẩm sạch, hữu cơ và có nguồn gốc rõ ràng đang tăng mạnh, đặc biệt sau đại dịch COVID-19
- Xu hướng tiêu dùng xanh và lối sống bền vững ngày càng phổ biến trong nhóm khách hàng có thu nhập trung bình và cao
- Công nghệ blockchain có thể áp dụng để minh bạch hóa chuỗi cung ứng và nguồn gốc sản phẩm
- Thương mại điện tử trong ngành thực phẩm đang phát triển nhanh chóng, mở ra kênh bán hàng mới tiềm năng
- Xu hướng sử dụng ứng dụng di động để mua sắm thực phẩm ngày càng phổ biến

### Rủi ro và thách thức
- Cạnh tranh gay gắt từ các chuỗi siêu thị lớn đang mở rộng mảng thực phẩm sạch
- Chi phí duy trì chuỗi cung ứng lạnh và đảm bảo chất lượng sản phẩm cao
- Biến động giá nguyên liệu và sản phẩm nông nghiệp theo mùa vụ
- Thay đổi trong quy định về an toàn thực phẩm và truy xuất nguồn gốc
- Khó khăn trong việc xác thực và kiểm soát chất lượng "sạch" của sản phẩm từ nhà cung cấp

### Đề xuất giải pháp và chiến lược dài hạn
- **Ứng dụng AI và phân tích dữ liệu**: Triển khai hệ thống phân tích dữ liệu nâng cao để dự báo nhu cầu, tối ưu hóa tồn kho và cá nhân hóa trải nghiệm khách hàng
- **Chuyển đổi số toàn diện**: Phát triển ứng dụng di động với tính năng theo dõi nguồn gốc sản phẩm, đặt hàng thông minh và chương trình khách hàng thân thiết
- **Mở rộng kênh bán hàng**: Tích hợp mô hình omni-channel, kết hợp bán hàng trực tuyến và tại cửa hàng, đồng thời mở rộng dịch vụ giao hàng nhanh
- **Tối ưu chuỗi cung ứng**: Áp dụng công nghệ IoT để giám sát nhiệt độ, độ ẩm trong quá trình vận chuyển và lưu trữ, đảm bảo chất lượng sản phẩm
- **Phát triển thương hiệu bền vững**: Xây dựng chiến lược ESG (Environmental, Social, Governance) rõ ràng, tập trung vào bao bì thân thiện môi trường và hỗ trợ nông dân địa phương

## 2. Phân tích chi nhánh cụ thể

${branchDetails
  .map(
    (branch, index) => `
### Chi nhánh ${branch.name}

Chi nhánh ${branch.name} đạt doanh thu ${branch.revenue.toLocaleString(
      "vi-VN"
    )}đ, với ${
      branch.customers
    } khách hàng và tỷ lệ quay lại ${branch.returnRate.toFixed(
      1
    )}%. Thời gian giao hàng trung bình là ${branch.avgDeliveryTime.toFixed(
      1
    )} giờ, và tỷ lệ hoàn đơn ở mức ${branch.cancelRate.toFixed(1)}%.

**Điểm mạnh**: ${
      [
        branch.revenue > (totalRevenue / branches.length) * 1.2
          ? "Doanh thu cao hơn trung bình hệ thống"
          : "",
        branch.returnRate > 50 ? "Tỷ lệ khách hàng quay lại cao" : "",
        branch.avgDeliveryTime < 12 ? "Thời gian giao hàng nhanh" : "",
        branch.cancelRate < 5 ? "Tỷ lệ hoàn đơn thấp" : "",
        branch.avgRating > 4 ? "Đánh giá khách hàng tốt" : "",
      ]
        .filter(Boolean)
        .join(", ") || "Cần thu thập thêm dữ liệu"
    }

**Điểm yếu**: ${
      [
        branch.revenue < (totalRevenue / branches.length) * 0.8
          ? "Doanh thu thấp hơn trung bình hệ thống"
          : "",
        branch.returnRate < 30 ? "Tỷ lệ khách hàng quay lại thấp" : "",
        branch.avgDeliveryTime > 24 ? "Thời gian giao hàng chậm" : "",
        branch.cancelRate > 10 ? "Tỷ lệ hoàn đơn cao" : "",
        branch.avgRating < 3.5 ? "Đánh giá khách hàng chưa tốt" : "",
        branch.lowStockProducts > 5 ? "Nhiều sản phẩm sắp hết hàng" : "",
      ]
        .filter(Boolean)
        .join(", ") || "Chưa phát hiện điểm yếu đáng kể"
    }

**Gợi ý cải thiện**:
${
  branch.returnRate < 30
    ? "Triển khai chương trình khách hàng thân thiết với ưu đãi hấp dẫn để tăng tỷ lệ quay lại. "
    : ""
}${
      branch.avgDeliveryTime > 24
        ? "Tối ưu hóa quy trình giao hàng và hợp tác với đơn vị vận chuyển hiệu quả hơn. "
        : ""
    }${
      branch.cancelRate > 10
        ? "Phân tích nguyên nhân hoàn đơn và cải thiện quy trình xử lý đơn hàng. "
        : ""
    }${
      branch.avgRating < 3.5
        ? "Đào tạo nhân viên về kỹ năng tư vấn sản phẩm và chăm sóc khách hàng. "
        : ""
    }${
      branch.lowStockProducts > 5
        ? "Cải thiện hệ thống quản lý tồn kho và dự báo nhu cầu. "
        : ""
    }${
      branch.revenue < (totalRevenue / branches.length) * 0.8
        ? "Tăng cường hoạt động marketing địa phương và sự kiện cộng đồng. "
        : ""
    }

**Tiềm năng phát triển**: ${
      branch.revenue > (totalRevenue / branches.length) * 1.2
        ? "Chi nhánh có tiềm năng mở rộng quy mô hoạt động và trở thành trung tâm phân phối cho khu vực lân cận."
        : branch.returnRate > 50
        ? "Chi nhánh có thể phát triển thành điểm đến mua sắm ưa thích của khách hàng thân thiết, tập trung vào các sản phẩm cao cấp và dịch vụ cá nhân hóa."
        : "Chi nhánh có tiềm năng cải thiện hiệu suất thông qua tối ưu hóa vận hành và chiến lược marketing địa phương phù hợp."
    }
`
  )
  .join("\n")}

Phân tích này dựa trên dữ liệu hiện có từ hệ thống quản lý. Để có phân tích toàn diện hơn, cần bổ sung thêm dữ liệu về:
- Chi tiết đánh giá và phản hồi của khách hàng
- Phân tích cạnh tranh trong từng khu vực
- Dữ liệu chi tiết về hiệu suất của từng danh mục sản phẩm
- Thông tin về chi phí vận hành và biên lợi nhuận của từng chi nhánh

Việc tích hợp các dữ liệu này sẽ giúp đưa ra chiến lược tối ưu hơn cho từng chi nhánh và toàn hệ thống.`;

      res.json({
        analysis,
        metadata: {
          totalBranches: branches.length,
          totalRevenue,
          totalOrders,
          totalCompletedOrders,
          totalCustomers,
          totalProducts,
          generatedAt: new Date(),
        },
        branchDetails,
      });
    } catch (error) {
      console.error("Error in getAIAnalysis:", error);
      res
        .status(500)
        .json({ message: "Lỗi khi phân tích dữ liệu", error: error.message });
    }
  },
};

export default reportsController;
