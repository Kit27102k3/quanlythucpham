import BestSellingProduct from "../Model/BestSellingProduct.js";
import User from "../Model/User.js";
import Order from "../Model/Order.js";
import Product from "../Model/Product.js";
import Review from "../Model/Review.js";
import SystemLog from "../Model/SystemLog.js";
import Coupon from "../Model/Coupon.js";

/**
 * Reports controller to handle API requests for generating various reports
 */
const reportsController = {
  // Dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      const [
        totalOrders,
        totalRevenue,
        totalCustomers,
        totalProducts,
        recentActivities,
      ] = await Promise.all([
        Order.countDocuments(),
        Order.aggregate([
          { $match: { status: "completed" } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
        User.countDocuments({ role: "customer" }),
        Product.countDocuments(),
        SystemLog.find().sort({ createdAt: -1 }).limit(5),
      ]);

      res.json({
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalCustomers,
        totalProducts,
        recentActivities: recentActivities.map((log) => ({
          id: log._id,
          type: log.type || "system",
          message: log.message,
          timestamp: log.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error in getDashboardStats:", error);
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu thống kê" });
    }
  },

  // Revenue data
  getRevenueData: async (req, res) => {
    try {
      const { timeRange } = req.query;
      const startDate = new Date();

      switch (timeRange) {
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const revenueData = await Order.aggregate([
        { $match: { status: "completed", createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.json(
        revenueData.map((item) => ({
          date: item._id,
          revenue: item.revenue,
          orders: item.orders,
        }))
      );
    } catch (error) {
      console.error("Error in getRevenueData:", error);
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu doanh thu" });
    }
  },

  // Top products
  getTopProducts: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const bestSellingProducts = await BestSellingProduct.getBestSellers(
        limit,
        "month"
      );

      res.json(
        bestSellingProducts.map((product) => ({
          name: product.productName,
          category: product.productCategory,
          sold: product.soldCount,
          revenue: product.totalRevenue,
        }))
      );
    } catch (error) {
      console.error("Error in getTopProducts:", error);
      res
        .status(500)
        .json({ message: "Lỗi khi lấy dữ liệu sản phẩm bán chạy" });
    }
  },

  // Inventory data
  getInventoryData: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const products = await Product.find()
        .select("productName productCategory stock productStock")
        .lean();

      const inventoryData = products
        .filter((product) => {
          const stockValue = product.productStock ?? product.stock;
          return (
            typeof stockValue === "number" && stockValue < 20 && stockValue >= 0
          );
        })
        .map((product) => ({
          id: product._id,
          name: product.productName,
          category: product.productCategory || "Không phân loại",
          stock: product.productStock ?? product.stock,
          status:
            (product.productStock ?? product.stock) <= 5
              ? "Sắp hết"
              : "Còn hàng",
        }))
        .sort((a, b) => a.stock - b.stock)
        .slice(0, limit);

      res.json(inventoryData);
    } catch (error) {
      console.error("Error in getInventoryData:", error);
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu tồn kho" });
    }
  },

  // User statistics
  getUserData: async (req, res) => {
    try {
      const dateThreshold = new Date();
      dateThreshold.setMonth(dateThreshold.getMonth() - 1);

      const [totalUsers, newUsers, activeUsers, usersByRegion, usersByAge] =
        await Promise.all([
          User.countDocuments({ role: "customer" }),
          User.countDocuments({
            role: "customer",
            createdAt: { $gte: dateThreshold },
          }),
          User.countDocuments({
            role: "customer",
            lastLogin: { $gte: dateThreshold },
          }),
          User.aggregate([
            { $match: { role: "customer" } },
            { $group: { _id: "$region", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ]),
          User.aggregate([
            { $match: { role: "customer" } },
            {
              $project: {
                ageRange: {
                  $switch: {
                    branches: [
                      { case: { $lt: ["$age", 25] }, then: "18-24" },
                      { case: { $lt: ["$age", 35] }, then: "25-34" },
                      { case: { $lt: ["$age", 45] }, then: "35-44" },
                    ],
                    default: "45+",
                  },
                },
              },
            },
            { $group: { _id: "$ageRange", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ]),
        ]);

      res.json({
        totalUsers,
        newUsers,
        activeUsers,
        usersByRegion: usersByRegion.map((item) => ({
          region: item._id,
          count: item.count,
        })),
        usersByAge: usersByAge.map((item) => ({
          range: item._id,
          count: item.count,
        })),
      });
    } catch (error) {
      console.error("Error in getUserData:", error);
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu người dùng" });
    }
  },

  // Order statistics
  getOrderData: async (req, res) => {
    try {
      const [
        totalOrders,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        avgResult,
        ordersByStatus,
        ordersByTimeOfDay,
        recentOrders,
      ] = await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: "completed" }),
        Order.countDocuments({ status: "pending" }),
        Order.countDocuments({ status: "cancelled" }),
        Order.aggregate([
          { $match: { status: "completed" } },
          { $group: { _id: null, avg: { $avg: "$totalAmount" } } },
        ]),
        Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Order.aggregate([
          {
            $project: {
              timeOfDay: {
                $switch: {
                  branches: [
                    {
                      case: { $lt: [{ $hour: "$createdAt" }, 12] },
                      then: "Sáng",
                    },
                    {
                      case: { $lt: [{ $hour: "$createdAt" }, 15] },
                      then: "Trưa",
                    },
                    {
                      case: { $lt: [{ $hour: "$createdAt" }, 18] },
                      then: "Chiều",
                    },
                  ],
                  default: "Tối",
                },
              },
            },
          },
          { $group: { _id: "$timeOfDay", count: { $sum: 1 } } },
        ]),
        Order.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("userId", "firstName lastName"),
      ]);

      res.json({
        totalOrders,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        averageOrderValue: avgResult[0]?.avg || 0,
        ordersByStatus: ordersByStatus.map((item) => ({
          status: item._id,
          count: item.count,
        })),
        ordersByTimeOfDay: ordersByTimeOfDay.map((item) => ({
          time: item._id,
          count: item.count,
        })),
        recentOrders: recentOrders.map((order) => ({
          id: order._id,
          customer: order.userId
            ? `${order.userId.firstName} ${order.userId.lastName}`
            : "Khách vãng lai",
          total: order.totalAmount,
          status: order.status,
          date: order.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error in getOrderData:", error);
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu đơn hàng" });
    }
  },

  // Promotion statistics
  getPromotionData: async (req, res) => {
    try {
      const [totalVouchers, activeVouchers, usageStats, voucherDetails] =
        await Promise.all([
          Coupon.countDocuments(),
          Coupon.countDocuments({ isActive: true }),
          Coupon.aggregate([
            {
              $group: {
                _id: null,
                usedCount: { $sum: "$usedCount" },
                totalDiscount: {
                  $sum: { $multiply: ["$discountAmount", "$usedCount"] },
                },
              },
            },
          ]),
          Coupon.find(),
        ]);

      res.json({
        totalVouchers,
        activeVouchers,
        usedVouchers: usageStats[0]?.usedCount || 0,
        totalDiscount: usageStats[0]?.totalDiscount || 0,
        voucherStats: voucherDetails.map((voucher) => ({
          code: voucher.code,
          type: voucher.discountType,
          discount:
            voucher.discountType === "percentage"
              ? `${voucher.discountAmount}%`
              : `${voucher.discountAmount.toLocaleString()}đ`,
          used: voucher.usedCount,
          limit: voucher.maxUses,
          revenue: voucher.generatedRevenue || 0,
          usageRate:
            voucher.maxUses > 0
              ? Math.round((voucher.usedCount / voucher.maxUses) * 100)
              : 0,
        })),
        promotionEffectiveness: voucherDetails.map((voucher) => ({
          name: voucher.code,
          conversion: voucher.conversionRate || 0,
        })),
      });
    } catch (error) {
      console.error("Error in getPromotionData:", error);
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu khuyến mãi" });
    }
  },

  // System activity logs
  getSystemActivityData: async (req, res) => {
    try {
      const { timeRange } = req.query;
      const startDate = new Date();

      switch (timeRange) {
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const [
        totalActivities,
        userActivities,
        adminActivities,
        activityByType,
        activityTimeline,
        recentActivities,
      ] = await Promise.all([
        SystemLog.countDocuments({ createdAt: { $gte: startDate } }),
        SystemLog.countDocuments({
          createdAt: { $gte: startDate },
          userType: "user",
        }),
        SystemLog.countDocuments({
          createdAt: { $gte: startDate },
          userType: "admin",
        }),
        SystemLog.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          { $group: { _id: "$actionType", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        SystemLog.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              activities: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        SystemLog.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .populate("userId", "firstName lastName userName"),
      ]);

      res.json({
        totalActivities,
        userActivities,
        adminActivities,
        activityByType: activityByType.map((item) => ({
          type: item._id,
          count: item.count,
        })),
        activityTimeline: activityTimeline.map((item) => ({
          date: item._id,
          activities: item.activities,
        })),
        recentActivities: recentActivities.map((activity) => ({
          id: activity._id,
          user: activity.userId
            ? `${activity.userId.firstName || ""} ${
                activity.userId.lastName || ""
              }`.trim() || activity.userId.userName
            : "System",
          action: activity.actionType,
          timestamp: activity.createdAt,
          ip: activity.ipAddress,
        })),
      });
    } catch (error) {
      console.error("Error in getSystemActivityData:", error);
      res
        .status(500)
        .json({ message: "Lỗi khi lấy dữ liệu hoạt động hệ thống" });
    }
  },

  // Delivery statistics
  getDeliveryData: async (req, res) => {
    try {
      const { timeRange } = req.query;
      const startDate = new Date();

      switch (timeRange) {
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const [
        totalDeliveries,
        successfulDeliveries,
        pendingDeliveries,
        failedDeliveries,
        deliveryTimeAvg,
        deliveryByRegion,
        deliveryTimeline,
        deliveryMethods,
      ] = await Promise.all([
        Order.countDocuments({
          createdAt: { $gte: startDate },
          deliveryStatus: { $exists: true },
        }),
        Order.countDocuments({
          createdAt: { $gte: startDate },
          deliveryStatus: "delivered",
        }),
        Order.countDocuments({
          createdAt: { $gte: startDate },
          deliveryStatus: "in_transit",
        }),
        Order.countDocuments({
          createdAt: { $gte: startDate },
          deliveryStatus: "failed",
        }),
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
              deliveryStatus: "delivered",
              deliveryDate: { $exists: true },
            },
          },
          {
            $project: {
              deliveryTime: {
                $divide: [
                  { $subtract: ["$deliveryDate", "$createdAt"] },
                  1000 * 60 * 60 * 24,
                ],
              },
            },
          },
          { $group: { _id: null, avgTime: { $avg: "$deliveryTime" } } },
        ]),
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
              deliveryStatus: { $exists: true },
            },
          },
          {
            $group: {
              _id: "$deliveryAddress.city",
              count: { $sum: 1 },
              totalTime: {
                $sum: {
                  $cond: [
                    { $eq: ["$deliveryStatus", "delivered"] },
                    {
                      $divide: [
                        { $subtract: ["$deliveryDate", "$createdAt"] },
                        1000 * 60 * 60 * 24,
                      ],
                    },
                    0,
                  ],
                },
              },
              delivered: {
                $sum: {
                  $cond: [{ $eq: ["$deliveryStatus", "delivered"] }, 1, 0],
                },
              },
            },
          },
          {
            $project: {
              count: 1,
              avgTime: {
                $cond: [
                  { $gt: ["$delivered", 0] },
                  { $divide: ["$totalTime", "$delivered"] },
                  0,
                ],
              },
            },
          },
          { $sort: { count: -1 } },
        ]),
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
              deliveryStatus: { $exists: true },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              deliveries: { $sum: 1 },
              totalTime: {
                $sum: {
                  $cond: [
                    { $eq: ["$deliveryStatus", "delivered"] },
                    {
                      $divide: [
                        { $subtract: ["$deliveryDate", "$createdAt"] },
                        1000 * 60 * 60 * 24,
                      ],
                    },
                    0,
                  ],
                },
              },
              delivered: {
                $sum: {
                  $cond: [{ $eq: ["$deliveryStatus", "delivered"] }, 1, 0],
                },
              },
            },
          },
          {
            $project: {
              deliveries: 1,
              avgTime: {
                $cond: [
                  { $gt: ["$delivered", 0] },
                  { $divide: ["$totalTime", "$delivered"] },
                  0,
                ],
              },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
              deliveryMethod: { $exists: true },
            },
          },
          { $group: { _id: "$deliveryMethod", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
      ]);

      res.json({
        totalDeliveries,
        successfulDeliveries,
        pendingDeliveries,
        failedDeliveries,
        averageDeliveryTime: deliveryTimeAvg[0]?.avgTime
          ? parseFloat(deliveryTimeAvg[0].avgTime.toFixed(1))
          : 0,
        deliveryByRegion: deliveryByRegion.map((item) => ({
          region: item._id || "Không xác định",
          count: item.count,
          avgTime: parseFloat(item.avgTime.toFixed(1)),
        })),
        deliveryTimeline: deliveryTimeline.map((item) => ({
          date: item._id,
          deliveries: item.deliveries,
          avgTime: parseFloat(item.avgTime.toFixed(1)),
        })),
        deliveryMethods: deliveryMethods.map((item) => ({
          method: item._id,
          count: item.count,
        })),
      });
    } catch (error) {
      console.error("Error in getDeliveryData:", error);
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu giao hàng" });
    }
  },

  // Feedback statistics
  getFeedbackData: async (req, res) => {
    try {
      const [
        totalReviews,
        ratingResult,
        ratingDistribution,
        categoryRatings,
        recentFeedback,
      ] = await Promise.all([
        Review.countDocuments(),
        Review.aggregate([
          { $group: { _id: null, avgRating: { $avg: "$rating" } } },
        ]),
        Review.aggregate([
          { $group: { _id: "$rating", count: { $sum: 1 } } },
          { $sort: { _id: -1 } },
        ]),
        Review.aggregate([
          {
            $lookup: {
              from: "products",
              localField: "productId",
              foreignField: "_id",
              as: "product",
            },
          },
          { $unwind: "$product" },
          {
            $group: {
              _id: "$product.productCategory",
              totalRating: { $sum: "$rating" },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              category: "$_id",
              rating: { $divide: ["$totalRating", "$count"] },
            },
          },
          { $sort: { rating: -1 } },
        ]),
        Review.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("userId", "firstName lastName")
          .populate("productId", "productName"),
      ]);

      res.json({
        totalReviews,
        averageRating: ratingResult[0]?.avgRating
          ? parseFloat(ratingResult[0].avgRating.toFixed(1))
          : 0,
        ratingDistribution: Array.from({ length: 5 }, (_, i) => {
          const rating = 5 - i;
          const found = ratingDistribution.find((r) => r._id === rating);
          return { rating, count: found ? found.count : 0 };
        }),
        categoryRatings: categoryRatings.map((cat) => ({
          category: cat.category,
          rating: parseFloat(cat.rating.toFixed(1)),
        })),
        recentFeedback: recentFeedback.map((review) => ({
          id: review._id,
          customer: review.userId
            ? `${review.userId.firstName} ${review.userId.lastName}`
            : "Khách vãng lai",
          rating: review.rating,
          comment: review.comment,
          product: review.productId
            ? review.productId.productName
            : "Sản phẩm không xác định",
          date: review.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error in getFeedbackData:", error);
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu phản hồi" });
    }
  },
};

export default reportsController;
