import BestSellingProduct from "../src/Model/BestSellingProduct.js";
import User from "../src/Model/Register.js";
import Order from "../src/Model/Order.js";
import Product from "../src/Model/Products.js";
import Review from "../src/Model/Review.js";
import SystemLog from "../src/Model/SystemActivity.js";
import Coupon from "../src/Model/Coupon.js";
import mongoose from "mongoose";
import process from "process";

/**
 * Reports controller to handle API requests for generating various reports
 */
const reportsController = {
  // Dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      // Kiểm tra kết nối MongoDB
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
          message: "Không thể kết nối đến cơ sở dữ liệu",
          connectionStatus: "disconnected"
        });
      }
      
      console.log("Đang lấy dữ liệu thống kê dashboard...");
      
      // Lấy tổng số đơn hàng
      const totalOrders = await Order.countDocuments();
      console.log("Tổng số đơn hàng:", totalOrders);
      
      // Lấy tổng số khách hàng - không giới hạn ở role "customer"
      const totalCustomers = await User.countDocuments();
      console.log("Tổng số khách hàng:", totalCustomers);
      
      // Lấy tổng số sản phẩm
      const totalProducts = await Product.countDocuments();
      console.log("Tổng số sản phẩm:", totalProducts);
      
      // Lấy các hoạt động gần đây
      const recentActivities = await SystemLog.find().sort({ createdAt: -1 }).limit(5);
      
      // Lấy tổng doanh thu từ tất cả các đơn hàng đã hoàn thành (status: "completed" hoặc "delivered")
      const totalRevenueResult = await Order.aggregate([
        { $match: { status: { $in: ["completed", "delivered"] } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]);
      
      console.log("Kết quả tính tổng doanh thu:", totalRevenueResult);
      
      // Debug: Kiểm tra tất cả các đơn hàng
      const allOrders = await Order.find({}, { status: 1, totalAmount: 1 });
      console.log("Tất cả đơn hàng:", JSON.stringify(allOrders));
      
      const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;
      console.log("Tổng doanh thu:", totalRevenue);

      const responseData = {
        totalOrders,
        totalRevenue,
        totalCustomers,
        totalProducts,
        recentActivities: recentActivities.map((log) => ({
          id: log._id,
          type: log.type || "system",
          message: log.message,
          timestamp: log.createdAt,
        })),
      };
      
      console.log("Dữ liệu trả về:", responseData);
      res.json(responseData);
    } catch (error) {
      console.error("Error in getDashboardStats:", error);
      res.status(500).json({ 
        message: "Lỗi khi lấy dữ liệu thống kê", 
        error: error.message,
        connectionStatus: mongoose.connection.readyState
      });
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

      console.log(`Lấy dữ liệu doanh thu từ ${startDate.toISOString()} đến hiện tại`);

      // Lấy doanh thu từ các đơn hàng đã hoàn thành (status: "completed" hoặc "delivered")
      const revenueData = await Order.aggregate([
        { $match: { 
          status: { $in: ["completed", "delivered"] }, 
          createdAt: { $gte: startDate } 
        }},
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      console.log("Kết quả dữ liệu doanh thu:", revenueData);

      // Tạo mảng các ngày từ startDate đến hiện tại
      const allDates = [];
      const currentDate = new Date();
      const tempDate = new Date(startDate);
      
      while (tempDate <= currentDate) {
        allDates.push(new Date(tempDate));
        tempDate.setDate(tempDate.getDate() + 1);
      }
      
      // Tạo dữ liệu đầy đủ cho tất cả các ngày, ngày không có doanh thu sẽ hiển thị 0
      const completeRevenueData = allDates.map(date => {
        const dateString = date.toISOString().split('T')[0];
        const existingData = revenueData.find(item => item._id === dateString);
        
        // Tạo tên ngày trong tuần
        const dayOfWeek = date.getDay();
        const dayNames = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
        const dayName = dayNames[dayOfWeek];
        
        // Format ngày hiển thị
        const displayDate = `${dayName} (${date.getDate()}/${date.getMonth() + 1})`;
        
        return {
          date: dateString,
          displayDate: displayDate,
          dayName: dayName,
          revenue: existingData ? existingData.revenue : 0,
          orders: existingData ? existingData.orders : 0,
        };
      });

      console.log("Dữ liệu doanh thu đầy đủ:", completeRevenueData);
      res.json(completeRevenueData);
    } catch (error) {
      console.error("Error in getRevenueData:", error);
      res.status(500).json({ message: "Lỗi khi lấy dữ liệu doanh thu" });
    }
  },

  // Top selling products
  getTopProducts: async (req, res) => {
    try {
      const { limit = 5, period = 'all' } = req.query;
      
      // Lấy danh sách sản phẩm bán chạy
      const topProducts = await BestSellingProduct.getBestSellers(parseInt(limit, 10), period);
      
      if (!topProducts || topProducts.length === 0) {
        // Nếu không có dữ liệu, trả về dữ liệu trống
        return res.json([]);
      }
      
      // Chuyển đổi dữ liệu thành định dạng cần thiết
      const formattedProducts = topProducts.map(product => {
        return {
          name: product.productName || (product.productId ? product.productId.productName : 'Không xác định'),
          category: product.productCategory || (product.productId ? product.productId.productCategory : 'Không phân loại'),
          sold: product.soldCount || 0,
          revenue: product.totalRevenue || 0,
          image: product.productImage || (product.productId && product.productId.productImages && product.productId.productImages.length > 0 ? product.productId.productImages[0] : ''),
          id: product.productId ? product.productId._id : product._id
        };
      });
      
      res.json(formattedProducts);
    } catch (error) {
      console.error("Error in getTopProducts:", error);
      res.status(500).json({ message: "Lỗi khi lấy danh sách sản phẩm bán chạy" });
    }
  },

  // Get inventory data for products with low stock
  getInventoryData: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const threshold = parseInt(req.query.threshold) || 20;
      
      // Try to get products with stock below threshold
      const lowStockProducts = await Product.find({ 
        $or: [
          { stock: { $lte: threshold, $gt: 0 } },
          { productStock: { $lte: threshold, $gt: 0 } }
        ]
      })
      .sort({ stock: 1, productStock: 1 })
      .limit(limit);
      
      // If we have products, return them
      if (lowStockProducts && lowStockProducts.length > 0) {
        return res.json({
          success: true,
          data: lowStockProducts.map(product => {
            // Lấy đường dẫn hình ảnh
            let imageUrl = product.image || product.productImage;
            
            // Nếu có mảng hình ảnh, lấy hình ảnh đầu tiên
            if (!imageUrl && product.images && product.images.length > 0) {
              imageUrl = product.images[0];
            }
            if (!imageUrl && product.productImages && product.productImages.length > 0) {
              imageUrl = product.productImages[0];
            }
            
            // Nếu vẫn không có hình ảnh, sử dụng placeholder
            if (!imageUrl) {
              imageUrl = "https://via.placeholder.com/100x100/f3f4f6/64748b?text=No+Image";
            }
            
            return {
              id: product._id,
              name: product.name || product.productName,
              category: product.category || product.categoryName || "Không phân loại",
              stock: product.stock || product.productStock || 0,
              status: (product.stock || product.productStock) <= 5 ? "Sắp hết" : "Còn hàng",
              image: imageUrl,
              sku: product.sku || product.productCode
            };
          })
        });
      }
      
      // Nếu không có sản phẩm, trả về mảng rỗng
      return res.json({
        success: true,
        data: [],
        message: "Không tìm thấy sản phẩm tồn kho thấp"
      });
      
    } catch (error) {
      console.error("Error in getInventoryData:", error);
      
      // Trả về lỗi
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy dữ liệu tồn kho",
        error: error.message
      });
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

  // User detail data with province distribution
  getUserDetailData: async (req, res) => {
    try {
      const { period = "month" } = req.query;
      console.log(`Lấy dữ liệu chi tiết người dùng với period=${period}`);
      
      // Xác định ngày bắt đầu dựa trên period
      const startDate = new Date();
      switch (period) {
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case "quarter":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          break;
        default: // month
          startDate.setMonth(startDate.getMonth() - 1);
      }

      // Lấy dữ liệu người dùng
      const [totalUsers, newUsers, activeUsers, usersByRegion, usersByAge, usersByProvince, users] =
        await Promise.all([
          User.countDocuments(),
          User.countDocuments({ createdAt: { $gte: startDate } }),
          User.countDocuments({ lastLogin: { $gte: startDate } }),
          User.aggregate([
            { $group: { _id: "$region", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ]),
          User.aggregate([
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
          User.aggregate([
            {
              $project: {
                province: {
                  $cond: {
                    if: { $ifNull: ["$address.province", false] },
                    then: "$address.province",
                    else: {
                      $cond: {
                        if: { $ifNull: ["$contactInfo.province", false] },
                        then: "$contactInfo.province",
                        else: {
                          $cond: {
                            if: { $ifNull: ["$contactInfo.city", false] },
                            then: "$contactInfo.city",
                            else: "Không xác định"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            { $group: { _id: "$province", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ]),
          User.find({}, {
            firstName: 1,
            lastName: 1,
            email: 1,
            phone: 1,
            address: 1,
            contactInfo: 1,
            createdAt: 1,
            lastLogin: 1,
            role: 1
          }).sort({ createdAt: -1 }).limit(100)
        ]);

      // Tính toán các số liệu thống kê khác
      const maleUsers = await User.countDocuments({ gender: "male" });
      const femaleUsers = await User.countDocuments({ gender: "female" });
      
      // Phân tích hoạt động người dùng
      const userActivity = await User.aggregate([
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "userId",
            as: "orders"
          }
        },
        {
          $project: {
            _id: 1,
            orderCount: { $size: "$orders" },
            totalSpent: { $sum: "$orders.totalAmount" },
            lastOrder: { $max: "$orders.createdAt" }
          }
        },
        {
          $group: {
            _id: null,
            activeUsers: { $sum: { $cond: [{ $gt: ["$orderCount", 0] }, 1, 0] } },
            inactiveUsers: { $sum: { $cond: [{ $eq: ["$orderCount", 0] }, 1, 0] } },
            averageOrderCount: { $avg: "$orderCount" },
            averageSpent: { $avg: "$totalSpent" }
          }
        }
      ]);

      // Định dạng dữ liệu phản hồi
      const responseData = {
        totalUsers,
        newUsers,
        activeUsers: userActivity.length > 0 ? userActivity[0].activeUsers : activeUsers,
        inactiveUsers: userActivity.length > 0 ? userActivity[0].inactiveUsers : (totalUsers - activeUsers),
        maleUsers,
        femaleUsers,
        usersByRegion: usersByRegion.map((item) => ({
          region: item._id || "Không xác định",
          count: item.count,
        })),
        usersByAge: usersByAge.map((item) => ({
          range: item._id || "Không xác định",
          count: item.count,
        })),
        usersByProvince: usersByProvince.map((item) => ({
          province: item._id || "Không xác định",
          count: item.count,
        })),
        userActivity: userActivity.length > 0 ? {
          averageOrderCount: userActivity[0].averageOrderCount || 0,
          averageSpent: userActivity[0].averageSpent || 0,
          activeRatio: totalUsers > 0 ? (userActivity[0].activeUsers / totalUsers) : 0
        } : {
          averageOrderCount: 0,
          averageSpent: 0,
          activeRatio: 0
        },
        users: users.map(user => ({
          id: user._id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Không xác định',
          email: user.email || 'Không xác định',
          phone: user.phone || (user.contactInfo && user.contactInfo.phone) || 'Không xác định',
          address: (user.address && user.address.full) || (user.contactInfo && user.contactInfo.address) || 'Không xác định',
          province: (user.address && user.address.province) || (user.contactInfo && user.contactInfo.province) || (user.contactInfo && user.contactInfo.city) || 'Không xác định',
          createdAt: user.createdAt,
          lastLogin: user.lastLogin || user.createdAt,
          role: user.role || 'customer'
        }))
      };

      console.log(`Trả về dữ liệu chi tiết người dùng với ${users.length} người dùng và ${usersByProvince.length} tỉnh thành`);
      res.json(responseData);
    } catch (error) {
      console.error("Error in getUserDetailData:", error);
      res.status(500).json({ 
        message: "Lỗi khi lấy dữ liệu chi tiết người dùng",
        error: error.message 
      });
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
        averageOrderValue: avgResult[0] && avgResult[0].avg || 0,
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
        usedVouchers: usageStats[0] && usageStats[0].usedCount || 0,
        totalDiscount: usageStats[0] && usageStats[0].totalDiscount || 0,
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
        averageDeliveryTime: deliveryTimeAvg[0] && deliveryTimeAvg[0].avgTime
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
        averageRating: ratingResult[0] && ratingResult[0].avgRating
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

  // Phân tích AI dựa trên dữ liệu thực
  getAnalysisData: async (req, res) => {
    try {
      console.log("API getAnalysisData được gọi với query:", req.query);
      const { userRole, branchId, startDate, endDate } = req.query;
      
      // Tạo điều kiện lọc theo ngày nếu có
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
        console.log("Lọc dữ liệu theo khoảng thời gian:", startDate, "đến", endDate);
      } else if (startDate) {
        dateFilter.createdAt = { $gte: new Date(startDate) };
        console.log("Lọc dữ liệu từ ngày:", startDate);
      } else if (endDate) {
        dateFilter.createdAt = { $lte: new Date(endDate) };
        console.log("Lọc dữ liệu đến ngày:", endDate);
      }
      
      // Lấy dữ liệu cần thiết cho phân tích
      const [
        revenueData,
        orderStats,
        productStats,
        userStats,
        branches
      ] = await Promise.all([
        // Lấy dữ liệu doanh thu
        Order.aggregate([
          { $match: { status: "completed", ...dateFilter } },
          { $group: { _id: "$branchId", revenue: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]),
        // Lấy thống kê đơn hàng
        Order.aggregate([
          { $match: dateFilter },
          { 
            $group: { 
              _id: "$branchId", 
              totalOrders: { $sum: 1 },
              completedOrders: { 
                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } 
              },
              pendingOrders: { 
                $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } 
              }
            } 
          }
        ]),
        // Lấy thống kê sản phẩm
        Product.aggregate([
          {
            $lookup: {
              from: "orders",
              localField: "_id",
              foreignField: "items.productId",
              as: "orders"
            }
          },
          {
            $project: {
              _id: 1,
              productName: 1,
              productCategory: 1,
              branchId: 1,
              stock: { $ifNull: ["$productStock", "$stock"] },
              sold: { 
                $size: {
                  $filter: {
                    input: "$orders",
                    as: "order",
                    cond: Object.keys(dateFilter).length > 0 ? 
                      { $and: [
                        { $eq: ["$$order.status", "completed"] },
                        dateFilter.createdAt && dateFilter.createdAt.$gte ? { $gte: ["$$order.createdAt", dateFilter.createdAt.$gte] } : true,
                        dateFilter.createdAt && dateFilter.createdAt.$lte ? { $lte: ["$$order.createdAt", dateFilter.createdAt.$lte] } : true
                      ]} : 
                      { $eq: ["$$order.status", "completed"] }
                  }
                }
              },
              revenue: {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: "$orders",
                        as: "order",
                        cond: Object.keys(dateFilter).length > 0 ? 
                          { $and: [
                            { $eq: ["$$order.status", "completed"] },
                            dateFilter.createdAt && dateFilter.createdAt.$gte ? { $gte: ["$$order.createdAt", dateFilter.createdAt.$gte] } : true,
                            dateFilter.createdAt && dateFilter.createdAt.$lte ? { $lte: ["$$order.createdAt", dateFilter.createdAt.$lte] } : true
                          ]} : 
                          { $eq: ["$$order.status", "completed"] }
                      }
                    },
                    as: "order",
                    in: {
                      $sum: {
                        $map: {
                          input: {
                            $filter: {
                              input: "$$order.items",
                              as: "item",
                              cond: { $eq: ["$$item.productId", "$_id"] }
                            }
                          },
                          as: "item",
                          in: { $multiply: ["$$item.price", "$$item.quantity"] }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          {
            $group: {
              _id: "$branchId",
              products: { $push: "$$ROOT" },
              totalProducts: { $sum: 1 },
              lowStockProducts: { 
                $sum: { $cond: [{ $lt: ["$stock", 10] }, 1, 0] }
              }
            }
          }
        ]),
        // Lấy thống kê người dùng
        User.aggregate([
          { $match: { role: "customer" } },
          {
            $lookup: {
              from: "orders",
              localField: "_id",
              foreignField: "userId",
              as: "orders"
            }
          },
          {
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              email: 1,
              branchId: 1,
              orderCount: { 
                $size: {
                  $filter: {
                    input: "$orders",
                    as: "order",
                    cond: Object.keys(dateFilter).length > 0 ? 
                      { $and: [
                        { $eq: ["$$order.status", "completed"] },
                        dateFilter.createdAt && dateFilter.createdAt.$gte ? { $gte: ["$$order.createdAt", dateFilter.createdAt.$gte] } : true,
                        dateFilter.createdAt && dateFilter.createdAt.$lte ? { $lte: ["$$order.createdAt", dateFilter.createdAt.$lte] } : true
                      ]} : 
                      true
                  }
                }
              },
              totalSpent: { 
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: "$orders",
                        as: "order",
                        cond: Object.keys(dateFilter).length > 0 ? 
                          { $and: [
                            { $eq: ["$$order.status", "completed"] },
                            dateFilter.createdAt && dateFilter.createdAt.$gte ? { $gte: ["$$order.createdAt", dateFilter.createdAt.$gte] } : true,
                            dateFilter.createdAt && dateFilter.createdAt.$lte ? { $lte: ["$$order.createdAt", dateFilter.createdAt.$lte] } : true
                          ]} : 
                          { $eq: ["$$order.status", "completed"] }
                      }
                    },
                    as: "order",
                    in: "$$order.totalAmount"
                  }
                }
              }
            }
          },
          {
            $group: {
              _id: "$branchId",
              customers: { $push: "$$ROOT" },
              totalCustomers: { $sum: 1 },
              activeCustomers: {
                $sum: { $cond: [{ $gt: ["$orderCount", 0] }, 1, 0] }
              }
            }
          }
        ]),
        // Lấy danh sách chi nhánh
        mongoose.model('Branch').find().lean()
      ]);

      console.log("Dữ liệu đã lấy được:");
      console.log("- revenueData:", revenueData.length, "bản ghi");
      console.log("- orderStats:", orderStats.length, "bản ghi");
      console.log("- productStats:", productStats.length, "bản ghi");
      console.log("- userStats:", userStats.length, "bản ghi");
      console.log("- branches:", branches.length, "bản ghi");
      
      // Xử lý dữ liệu để tạo prompt cho OpenAI
      const totalRevenue = revenueData.reduce((sum, item) => sum + (item.revenue || 0), 0);
      const totalOrders = orderStats.reduce((sum, item) => sum + (item.totalOrders || 0), 0);
      const totalCompletedOrders = orderStats.reduce((sum, item) => sum + (item.completedOrders || 0), 0);
      const totalCustomers = userStats.reduce((sum, item) => sum + (item.totalCustomers || 0), 0);
      const totalActiveCustomers = userStats.reduce((sum, item) => sum + (item.activeCustomers || 0), 0);
      
      // Tạo dữ liệu chi tiết về từng chi nhánh
      const branchDetails = branches.map(branch => {
        const branchId = branch._id.toString();
        const branchRevenue = revenueData.find(item => item._id && item._id.toString() === branchId);
        const branchOrders = orderStats.find(item => item._id && item._id.toString() === branchId);
        const branchProducts = productStats.find(item => item._id && item._id.toString() === branchId);
        const branchUsers = userStats.find(item => item._id && item._id.toString() === branchId);
        
        // Top sản phẩm của chi nhánh
        const topProducts = branchProducts && branchProducts.products
          ? branchProducts.products
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
            .map(product => ({
              name: product.productName,
              revenue: product.revenue || 0,
              sold: product.sold || 0,
              inventory: product.stock || 0
            }))
          : [];
        
        return {
          id: branchId,
          name: branch.name || `Chi nhánh ${branchId.substring(0, 5)}`,
          revenue: branchRevenue && branchRevenue.revenue || 0,
          orders: branchOrders && branchOrders.totalOrders || 0,
          completedOrders: branchOrders && branchOrders.completedOrders || 0,
          customers: branchUsers && branchUsers.totalCustomers || 0,
          activeCustomers: branchUsers && branchUsers.activeCustomers || 0,
          products: branchProducts && branchProducts.totalProducts || 0,
          lowStockProducts: branchProducts && branchProducts.lowStockProducts || 0,
          topProducts: topProducts
        };
      });
      
      // Lấy API key từ biến môi trường
      const apiKey = process.env.OPENAI_API_KEY;
      console.log("API Key OpenAI:", apiKey ? "Có" : "Không có");
      
      if (!apiKey) {
        return res.status(500).json({ 
          error: "Không tìm thấy API key cho dịch vụ AI. Vui lòng kiểm tra cấu hình server.",
          message: "Lỗi cấu hình AI",
          data: { branches: branchDetails }
        });
      }
      
      // Danh sách các model để thử
      const models = ["gpt-4o-mini"];
      let lastError = null;
      
      // Xử lý phân tích dựa trên vai trò người dùng
      if (userRole === 'admin') {
        // Nếu là admin và chọn tất cả chi nhánh
        if (branchId === 'all') {
          // Tạo prompt cho phân tích tổng quan
          let prompt = `
Hãy phân tích dữ liệu kinh doanh của chuỗi siêu thị thực phẩm sạch và đưa ra phân tích chi tiết:

1. Thông tin tổng quan:
- Tổng doanh thu: ${totalRevenue.toLocaleString('vi-VN')}đ
- Tổng số đơn hàng: ${totalOrders} (Hoàn thành: ${totalCompletedOrders})
- Tổng số khách hàng: ${totalCustomers} (Hoạt động: ${totalActiveCustomers})
- Tỷ lệ hoàn thành đơn hàng: ${totalOrders > 0 ? ((totalCompletedOrders / totalOrders) * 100).toFixed(2) : 0}%
- Tỷ lệ khách hàng hoạt động: ${totalCustomers > 0 ? ((totalActiveCustomers / totalCustomers) * 100).toFixed(2) : 0}%

2. Chi tiết từng chi nhánh:
${branchDetails.map(branch => `
Chi nhánh: ${branch.name}
- Doanh thu: ${branch.revenue.toLocaleString('vi-VN')}đ
- Số đơn hàng: ${branch.orders} (Hoàn thành: ${branch.completedOrders})
- Số khách hàng: ${branch.customers} (Hoạt động: ${branch.activeCustomers})
- Số lượng sản phẩm: ${branch.products} (Sắp hết hàng: ${branch.lowStockProducts})
- Top sản phẩm: ${branch.topProducts.map(p => `${p.name} (Đã bán: ${p.sold}, Doanh thu: ${p.revenue.toLocaleString('vi-VN')}đ, Tồn kho: ${p.inventory})`).join(', ')}
`).join('\n')}

Hãy phân tích chi tiết:

1. Tổng quan tình hình kinh doanh:
   - Đánh giá hiệu quả kinh doanh tổng thể
   - Điểm mạnh và điểm yếu chính của chuỗi siêu thị
   - Xu hướng và cơ hội phát triển

2. Phân tích từng chi nhánh:
   - Xếp hạng các chi nhánh theo hiệu suất (dựa trên doanh thu, số đơn hàng, khách hàng)
   - Phân tích chi tiết 3 chi nhánh hoạt động tốt nhất và 3 chi nhánh hoạt động kém nhất
   - Nguyên nhân dẫn đến sự chênh lệch hiệu suất giữa các chi nhánh

3. Đề xuất chiến lược:
   - 5 đề xuất cụ thể để cải thiện hiệu quả kinh doanh tổng thể
   - Chiến lược phát triển cho từng nhóm chi nhánh (hiệu suất cao, trung bình, thấp)
   - Kế hoạch hành động ngắn hạn (3 tháng) và dài hạn (1 năm)

4. Quản lý hàng tồn kho:
   - Đánh giá tình trạng hàng tồn kho hiện tại
   - Đề xuất chiến lược tối ưu hóa hàng tồn kho
   - Giải pháp cho các sản phẩm sắp hết hàng

Hãy trình bày phân tích một cách rõ ràng, dễ đọc và có cấu trúc. Sử dụng ngôn ngữ đơn giản, chính xác và mang tính xây dựng.`;

          // Gọi API OpenAI
          for (const model of models) {
            try {
              console.log(`Bắt đầu gọi API OpenAI với model ${model}`);
              const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                  model: model,
                  messages: [
                    {
                      role: "system",
                      content: "Bạn là một chuyên gia phân tích dữ liệu kinh doanh với nhiều năm kinh nghiệm trong lĩnh vực bán lẻ thực phẩm. Hãy đưa ra các phân tích chuyên sâu, chi tiết và đề xuất cụ thể dựa trên dữ liệu."
                    },
                    {
                      role: "user",
                      content: prompt
                    }
                  ],
                  temperature: 0.7,
                  max_tokens: 3500
                })
              });
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error(`OpenAI API error với model ${model}:`, errorText);
                lastError = new Error(`OpenAI API error với model ${model}: ${response.status} - ${errorText}`);
                continue;
              }
              
              const data = await response.json();
              
              if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error(`Invalid API response structure với model ${model}:`, data);
                lastError = new Error(`Invalid API response structure với model ${model}`);
                continue;
              }
              
              const analysis = data.choices[0].message.content;
              console.log(`Độ dài phân tích từ model ${model}:`, analysis.length);
              
              // Trả về kết quả phân tích từ OpenAI
              const responseData = {
                analysis: analysis,
                data: { branches: branchDetails }
              };
              
              console.log("Trả về phân tích thành công");
              return res.json(responseData);
            } catch (error) {
              console.error(`Error calling OpenAI API với model ${model}:`, error);
              lastError = error;
            }
          }
        } else {
          // Admin chọn một chi nhánh cụ thể
          const branch = branchDetails.find(b => b.id === branchId);
          
          if (!branch) {
            return res.status(404).json({ 
              message: "Không tìm thấy chi nhánh",
              data: { branches: branchDetails }
            });
          }
          
          // Tạo prompt cho chi nhánh cụ thể
          let prompt = `
Hãy phân tích dữ liệu kinh doanh của chi nhánh ${branch.name} và đưa ra phân tích chi tiết:

1. Thông tin chi nhánh:
- Doanh thu: ${branch.revenue.toLocaleString('vi-VN')}đ
- Số đơn hàng: ${branch.orders} (Hoàn thành: ${branch.completedOrders})
- Tỷ lệ hoàn thành đơn hàng: ${branch.orders > 0 ? ((branch.completedOrders / branch.orders) * 100).toFixed(2) : 0}%
- Số khách hàng: ${branch.customers} (Hoạt động: ${branch.activeCustomers})
- Tỷ lệ khách hàng hoạt động: ${branch.customers > 0 ? ((branch.activeCustomers / branch.customers) * 100).toFixed(2) : 0}%
- Số lượng sản phẩm: ${branch.products} (Sắp hết hàng: ${branch.lowStockProducts})
- Top sản phẩm: ${branch.topProducts.map(p => `${p.name} (Đã bán: ${p.sold}, Doanh thu: ${p.revenue.toLocaleString('vi-VN')}đ, Tồn kho: ${p.inventory})`).join(', ')}

Hãy phân tích chi tiết:

1. Tổng quan hiệu suất chi nhánh:
   - Đánh giá hiệu quả kinh doanh của chi nhánh
   - Điểm mạnh và điểm yếu chính
   - Cơ hội phát triển và thách thức

2. Phân tích sản phẩm:
   - Đánh giá top 5 sản phẩm bán chạy
   - Phân tích tỷ lệ tồn kho và đề xuất chiến lược nhập hàng
   - Đề xuất cách thức trưng bày và marketing cho các sản phẩm

3. Phân tích khách hàng:
   - Đánh giá tỷ lệ khách hàng hoạt động
   - Đề xuất chiến lược tăng tỷ lệ quay lại mua hàng
   - Chiến dịch marketing để thu hút khách hàng mới

4. Kế hoạch hành động:
   - 5 đề xuất cụ thể để cải thiện hiệu quả kinh doanh
   - Kế hoạch hành động ngắn hạn (1 tháng) và trung hạn (3 tháng)
   - Các chỉ số KPI cần theo dõi và mục tiêu cần đạt được

Hãy trình bày phân tích một cách rõ ràng, dễ đọc và có cấu trúc. Sử dụng ngôn ngữ đơn giản, chính xác và mang tính xây dựng.`;

          // Gọi API OpenAI
          for (const model of models) {
            try {
              console.log(`Bắt đầu gọi API OpenAI với model ${model} cho chi nhánh ${branch.name}`);
              const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                  model: model,
                  messages: [
                    {
                      role: "system",
                      content: "Bạn là một chuyên gia phân tích dữ liệu kinh doanh với nhiều năm kinh nghiệm trong lĩnh vực bán lẻ thực phẩm. Hãy đưa ra các phân tích chuyên sâu, chi tiết và đề xuất cụ thể dựa trên dữ liệu."
                    },
                    {
                      role: "user",
                      content: prompt
                    }
                  ],
                  temperature: 0.7,
                  max_tokens: 3500
                })
              });
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error(`OpenAI API error với model ${model}:`, errorText);
                lastError = new Error(`OpenAI API error với model ${model}: ${response.status} - ${errorText}`);
                continue;
              }
              
              const data = await response.json();
              
              if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error(`Invalid API response structure với model ${model}:`, data);
                lastError = new Error(`Invalid API response structure với model ${model}`);
                continue;
              }
              
              const analysis = data.choices[0].message.content;
              console.log(`Độ dài phân tích từ model ${model}:`, analysis.length);
              
              // Trả về kết quả phân tích từ OpenAI
              const responseData = {
                analysis: analysis,
                data: branch
              };
              
              console.log("Trả về phân tích thành công");
              return res.json(responseData);
            } catch (error) {
              console.error(`Error calling OpenAI API với model ${model}:`, error);
              lastError = error;
            }
          }
        }
      } else {
        // Nếu là manager - chỉ phân tích chi nhánh của họ
        const branch = branchDetails.find(b => b.id === branchId) || branchDetails[0];
        
        if (!branch) {
          return res.status(404).json({ 
            message: "Không tìm thấy chi nhánh",
            data: { branches: branchDetails }
          });
        }
        
        let prompt = `
Hãy phân tích dữ liệu kinh doanh của chi nhánh ${branch.name} và đưa ra phân tích chi tiết:

1. Thông tin chi nhánh:
- Doanh thu: ${branch.revenue.toLocaleString('vi-VN')}đ
- Số đơn hàng: ${branch.orders} (Hoàn thành: ${branch.completedOrders})
- Tỷ lệ hoàn thành đơn hàng: ${branch.orders > 0 ? ((branch.completedOrders / branch.orders) * 100).toFixed(2) : 0}%
- Số khách hàng: ${branch.customers} (Hoạt động: ${branch.activeCustomers})
- Tỷ lệ khách hàng hoạt động: ${branch.customers > 0 ? ((branch.activeCustomers / branch.customers) * 100).toFixed(2) : 0}%
- Số lượng sản phẩm: ${branch.products} (Sắp hết hàng: ${branch.lowStockProducts})
- Top sản phẩm: ${branch.topProducts.map(p => `${p.name} (Đã bán: ${p.sold}, Doanh thu: ${p.revenue.toLocaleString('vi-VN')}đ, Tồn kho: ${p.inventory})`).join(', ')}

Hãy phân tích chi tiết:

1. Tổng quan hiệu suất chi nhánh:
   - Đánh giá hiệu quả kinh doanh của chi nhánh
   - Điểm mạnh và điểm yếu chính
   - Cơ hội phát triển và thách thức

2. Phân tích sản phẩm:
   - Đánh giá top 5 sản phẩm bán chạy
   - Phân tích tỷ lệ tồn kho và đề xuất chiến lược nhập hàng
   - Đề xuất cách thức trưng bày và marketing cho các sản phẩm

3. Phân tích khách hàng:
   - Đánh giá tỷ lệ khách hàng hoạt động
   - Đề xuất chiến lược tăng tỷ lệ quay lại mua hàng
   - Chiến dịch marketing để thu hút khách hàng mới

4. Kế hoạch hành động:
   - 5 đề xuất cụ thể để cải thiện hiệu quả kinh doanh
   - Kế hoạch hành động ngắn hạn (1 tháng) và trung hạn (3 tháng)
   - Các chỉ số KPI cần theo dõi và mục tiêu cần đạt được

Hãy trình bày phân tích một cách rõ ràng, dễ đọc và có cấu trúc. Sử dụng ngôn ngữ đơn giản, chính xác và mang tính xây dựng.`;

        // Gọi API OpenAI
        for (const model of models) {
          try {
            console.log(`Bắt đầu gọi API OpenAI với model ${model} cho chi nhánh ${branch.name}`);
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: model,
                messages: [
                  {
                    role: "system",
                    content: "Bạn là một chuyên gia phân tích dữ liệu kinh doanh với nhiều năm kinh nghiệm trong lĩnh vực bán lẻ thực phẩm. Hãy đưa ra các phân tích chuyên sâu, chi tiết và đề xuất cụ thể dựa trên dữ liệu."
                  },
                  {
                    role: "user",
                    content: prompt
                  }
                ],
                temperature: 0.7,
                max_tokens: 3500
              })
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`OpenAI API error với model ${model}:`, errorText);
              lastError = new Error(`OpenAI API error với model ${model}: ${response.status} - ${errorText}`);
              continue;
            }
            
            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
              console.error(`Invalid API response structure với model ${model}:`, data);
              lastError = new Error(`Invalid API response structure với model ${model}`);
              continue;
            }
            
            const analysis = data.choices[0].message.content;
            console.log(`Độ dài phân tích từ model ${model}:`, analysis.length);
            
            // Trả về kết quả phân tích từ OpenAI
            const responseData = {
              analysis: analysis,
              data: branch
            };
            
            console.log("Trả về phân tích thành công");
            return res.json(responseData);
          } catch (error) {
            console.error(`Error calling OpenAI API với model ${model}:`, error);
            lastError = error;
          }
        }
      }
      
      // Nếu đã thử tất cả các model mà vẫn lỗi
      console.error("Đã thử tất cả các model nhưng không thành công:", lastError);
      
      // Trả về lỗi và dữ liệu thô để client có thể hiển thị
      return res.status(500).json({ 
        error: `Không thể kết nối đến dịch vụ AI sau nhiều lần thử: ${lastError && lastError.message || 'Lỗi không xác định'}. Vui lòng thử lại sau.`,
        message: "Lỗi khi phân tích dữ liệu",
        data: userRole === 'admin' && branchId === 'all' ? { branches: branchDetails } : branchDetails.find(b => b.id === branchId) || branchDetails[0]
      });
    } catch (error) {
      console.error("Error in getAnalysisData:", error);
      
      // Lấy thông tin từ request vì các biến có thể không được định nghĩa trong scope này
      const { userRole, branchId } = req.query;
      let rawData = null;
      
      try {
        // Thử lấy dữ liệu chi nhánh cơ bản nếu có thể
        const branches = await mongoose.model('Branch').find().lean();
        if (branches && branches.length > 0) {
          const simpleBranchDetails = branches.map(branch => ({
            id: branch._id.toString(),
            name: branch.name || `Chi nhánh ${branch._id.toString().substring(0, 5)}`,
            revenue: 0,
            orders: 0,
            completedOrders: 0,
            customers: 0,
            activeCustomers: 0,
            products: 0,
            lowStockProducts: 0,
            topProducts: []
          }));
          
          rawData = userRole === 'admin' && branchId === 'all' 
            ? { branches: simpleBranchDetails } 
            : simpleBranchDetails.find(b => b.id === branchId) || simpleBranchDetails[0];
        }
      } catch (innerError) {
        console.error("Error getting basic branch data:", innerError);
      }
      
      res.status(500).json({ 
        message: "Lỗi khi phân tích dữ liệu",
        error: error.message,
        data: rawData
      });
    }
  },

  // Get recent activities
  getRecentActivities: async (req, res) => {
    try {
      // Kiểm tra kết nối MongoDB
      if (mongoose.connection.readyState !== 1) {
        console.log("MongoDB connection is not established");
        return res.status(503).json({
          success: false,
          message: "Không thể kết nối đến cơ sở dữ liệu",
          connectionStatus: mongoose.connection.readyState
        });
      }
      
      // Lấy dữ liệu hoạt động gần đây từ SystemLog
      let recentActivities = [];
      
      try {
        // Lấy log hoạt động hệ thống
        const systemLogs = await SystemLog.find()
          .sort({ createdAt: -1 })
          .limit(5);
          
        if (systemLogs && systemLogs.length > 0) {
          recentActivities = systemLogs.map(log => ({
            id: log._id,
            type: log.actionType || "system",
            user: log.userName || "Admin",
            message: log.message || `${log.userName || 'Admin'} đã ${log.actionType || 'thực hiện hành động'} trong hệ thống`,
            timestamp: log.createdAt
          }));
        }
      } catch (logError) {
        console.warn("Không thể lấy dữ liệu từ SystemLog:", logError.message);
      }
      
      // Nếu không có đủ dữ liệu từ SystemLog, lấy thêm từ các bảng khác
      if (recentActivities.length < 5) {
        try {
          // Lấy đơn hàng gần đây
          const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(3)
            .populate("userId", "firstName lastName");
            
          if (recentOrders && recentOrders.length > 0) {
            const orderActivities = recentOrders.map(order => ({
              id: order._id,
              type: "order",
              user: order.userId ? `${order.userId.firstName || ''} ${order.userId.lastName || ''}`.trim() : "Khách hàng",
              message: `${order.userId ? `${order.userId.firstName || ''} ${order.userId.lastName || ''}`.trim() : "Khách hàng"} đã đặt đơn hàng mới`,
              timestamp: order.createdAt
            }));
            
            recentActivities = [...recentActivities, ...orderActivities];
          }
        } catch (orderError) {
          console.warn("Không thể lấy dữ liệu từ Order:", orderError.message);
        }
      }
      
      // Nếu vẫn chưa đủ 5 hoạt động, lấy thêm từ User
      if (recentActivities.length < 5) {
        try {
          // Lấy người dùng mới đăng ký
          const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(3);
            
          if (recentUsers && recentUsers.length > 0) {
            const userActivities = recentUsers.map(user => ({
              id: user._id,
              type: "user",
              user: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || "Người dùng mới",
              message: `${`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || "Người dùng mới"} đã đăng ký tài khoản`,
              timestamp: user.createdAt
            }));
            
            recentActivities = [...recentActivities, ...userActivities];
          }
        } catch (userError) {
          console.warn("Không thể lấy dữ liệu từ User:", userError.message);
        }
      }
      
      // Nếu vẫn chưa đủ 5 hoạt động, lấy thêm từ Product
      if (recentActivities.length < 5) {
        try {
          // Lấy sản phẩm mới thêm vào
          const recentProducts = await Product.find()
            .sort({ createdAt: -1 })
            .limit(3);
            
          if (recentProducts && recentProducts.length > 0) {
            const productActivities = recentProducts.map(product => ({
              id: product._id,
              type: "product",
              user: "Admin",
              message: `Admin đã thêm sản phẩm mới: ${product.name || product.productName || 'Sản phẩm mới'}`,
              timestamp: product.createdAt
            }));
            
            recentActivities = [...recentActivities, ...productActivities];
          }
        } catch (productError) {
          console.warn("Không thể lấy dữ liệu từ Product:", productError.message);
        }
      }
      
      // Sắp xếp theo thời gian và giới hạn 5 hoạt động
      recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      recentActivities = recentActivities.slice(0, 5);
      
      // Nếu vẫn không có dữ liệu, tạo dữ liệu mẫu
      if (recentActivities.length === 0) {
        const currentDate = new Date();
        recentActivities = [
          {
            id: 1,
            type: "order",
            user: "Nguyễn Văn A",
            message: "Nguyễn Văn A đã đặt đơn hàng mới",
            timestamp: new Date(currentDate.getTime() - 30 * 60000).toISOString(),
          },
          {
            id: 2,
            type: "product",
            user: "Admin",
            message: "Admin đã thêm sản phẩm mới: Muối tôm Fadely",
            timestamp: new Date(currentDate.getTime() - 120 * 60000).toISOString(),
          },
          {
            id: 3,
            type: "user",
            user: "Trần Thị B",
            message: "Khách hàng mới Trần Thị B đã đăng ký tài khoản",
            timestamp: new Date(currentDate.getTime() - 180 * 60000).toISOString(),
          },
          {
            id: 4,
            type: "order",
            user: "Lê Văn C",
            message: "Lê Văn C đã hoàn thành đơn hàng #12345",
            timestamp: new Date(currentDate.getTime() - 240 * 60000).toISOString(),
          },
          {
            id: 5,
            type: "product",
            user: "Admin",
            message: "Admin đã cập nhật tồn kho sản phẩm",
            timestamp: new Date(currentDate.getTime() - 300 * 60000).toISOString(),
          },
        ];
      }
      
      res.json(recentActivities);
    } catch (error) {
      console.error("Error in getRecentActivities:", error);
      res.status(500).json({ 
        success: false, 
        message: "Lỗi khi lấy hoạt động gần đây", 
        error: error.message 
      });
    }
  },

  // Phân tích AI với GPT-4o Mini
  getAIAnalysis: async (req, res) => {
    try {
      console.log("API getAIAnalysis được gọi với query:", req.query);
      const { userRole, branchId, startDate, endDate } = req.query;
      
      // Kiểm tra quyền truy cập
      if (!userRole) {
        return res.status(400).json({ 
          message: "Thiếu thông tin vai trò người dùng",
          error: "MISSING_USER_ROLE" 
        });
      }

      // Nếu là manager, phải có branchId và phải là chi nhánh của họ
      if (userRole === 'manager' && (!branchId || branchId === 'all')) {
        return res.status(403).json({ 
          message: "Quản lý chỉ có thể phân tích chi nhánh của mình",
          error: "PERMISSION_DENIED" 
        });
      }

      // Tạo điều kiện lọc theo ngày nếu có
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
        console.log("Lọc dữ liệu theo khoảng thời gian:", startDate, "đến", endDate);
      } else if (startDate) {
        dateFilter.createdAt = { $gte: new Date(startDate) };
        console.log("Lọc dữ liệu từ ngày:", startDate);
      } else if (endDate) {
        dateFilter.createdAt = { $lte: new Date(endDate) };
        console.log("Lọc dữ liệu đến ngày:", endDate);
      }
      
      // Lọc theo chi nhánh nếu có
      const branchFilter = {};
      if (branchId && branchId !== 'all') {
        branchFilter._id = new mongoose.Types.ObjectId(branchId);
      }
      
      // Lấy dữ liệu cần thiết cho phân tích
      const [
        orders,
        products,
        branches,
        customers,
        reviews
      ] = await Promise.all([
        // Lấy dữ liệu đơn hàng
        Order.find({...dateFilter, ...(branchId && branchId !== 'all' ? {branchId: branchId} : {})}).lean(),
        // Lấy dữ liệu sản phẩm
        Product.find(branchId && branchId !== 'all' ? {branchId: branchId} : {}).lean(),
        // Lấy danh sách chi nhánh
        mongoose.model('Branch').find(branchFilter).lean(),
        // Lấy dữ liệu khách hàng
        User.find({role: "customer"}).lean(),
        // Lấy dữ liệu đánh giá
        mongoose.model('Review').find({...dateFilter, ...(branchId && branchId !== 'all' ? {branchId: branchId} : {})}).lean()
      ]);
      
      // Tính toán các chỉ số tổng quan
      const totalRevenue = orders
        .filter(order => order.status === "completed" || order.status === "delivered")
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      const totalOrders = orders.length;
      const completedOrders = orders.filter(order => 
        order.status === "completed" || order.status === "delivered"
      ).length;
      
      const totalCustomers = customers.length;
      const activeCustomers = customers.filter(customer => 
        orders.some(order => 
          order.userId && order.userId.toString() === customer._id.toString()
        )
      ).length;
      
      const totalProducts = products.length;
      
      // Phân tích chi tiết từng chi nhánh
      const branchDetails = branches.map(branch => {
        const branchId = branch._id.toString();
        
        // Lọc dữ liệu theo chi nhánh
        const branchOrders = orders.filter(order => 
          order.branchId && order.branchId.toString() === branchId
        );
        
        const branchCompletedOrders = branchOrders.filter(order => 
          order.status === "completed" || order.status === "delivered"
        );
        
        const branchRevenue = branchCompletedOrders.reduce((sum, order) => 
          sum + (order.totalAmount || 0), 0
        );
        
        const branchProducts = products.filter(product => 
          product.branchId && product.branchId.toString() === branchId
        );
        
        const branchCustomers = customers.filter(customer => 
          branchOrders.some(order => 
            order.userId && order.userId.toString() === customer._id.toString()
          )
        );
        
        const branchReviews = reviews.filter(review => 
          review.branchId && review.branchId.toString() === branchId
        );
        
        // Tính toán các chỉ số
        const returnRate = branchOrders.length > 0 ? 
          branchOrders.filter(order => order.status === "returned").length / branchOrders.length : 0;
        
        const avgDeliveryTime = branchCompletedOrders.length > 0 ?
          branchCompletedOrders.reduce((sum, order) => {
            if (order.deliveredAt && order.createdAt) {
              const deliveryTime = new Date(order.deliveredAt) - new Date(order.createdAt);
              return sum + (deliveryTime / (1000 * 60 * 60)); // Chuyển đổi thành giờ
            }
            return sum;
          }, 0) / branchCompletedOrders.length : 0;
        
        const cancelRate = branchOrders.length > 0 ?
          branchOrders.filter(order => order.status === "cancelled").length / branchOrders.length : 0;
        
        const avgRating = branchReviews.length > 0 ?
          branchReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / branchReviews.length : 0;
        
        // Top sản phẩm bán chạy
        const productSales = {};
        branchCompletedOrders.forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
              const productId = item.productId.toString();
              if (!productSales[productId]) {
                productSales[productId] = {
                  quantity: 0,
                  revenue: 0,
                  name: ''
                };
              }
              productSales[productId].quantity += (item.quantity || 0);
              productSales[productId].revenue += ((item.price || 0) * (item.quantity || 0));
              
              // Tìm tên sản phẩm
              const product = branchProducts.find(p => p._id.toString() === productId);
              if (product) {
                productSales[productId].name = product.productName || product.name || `Sản phẩm ${productId.substring(0, 5)}`;
              }
            });
          }
        });
        
        const topProducts = Object.values(productSales)
          .filter(product => product.name)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
        
        return {
          id: branchId,
          name: branch.name || `Chi nhánh ${branchId.substring(0, 5)}`,
          revenue: branchRevenue,
          orders: branchOrders.length,
          completedOrders: branchCompletedOrders.length,
          customers: branchCustomers.length,
          products: branchProducts.length,
          returnRate: returnRate,
          avgDeliveryTime: avgDeliveryTime,
          cancelRate: cancelRate,
          avgRating: avgRating,
          topProducts: topProducts.map(p => ({
            name: p.name,
            sold: p.quantity,
            revenue: p.revenue
          }))
        };
      });
      
      // Lấy API key từ biến môi trường
      const apiKey = process.env.OPENAI_API_KEY;
      console.log("API Key OpenAI:", apiKey ? "Có" : "Không có");
      
      if (!apiKey) {
        return res.status(500).json({ 
          error: "Không tìm thấy API key cho dịch vụ AI. Vui lòng kiểm tra cấu hình server.",
          message: "Lỗi cấu hình AI",
          data: { 
            overview: {
              totalRevenue,
              totalOrders,
              completedOrders,
              totalCustomers,
              activeCustomers,
              totalProducts
            },
            branches: branchDetails 
          }
        });
      }
      
      // Danh sách các model để thử
      const models = ["gpt-4o-mini"];
      let lastError = null;
      
      // Xử lý phân tích dựa trên vai trò người dùng và chi nhánh được chọn
      if (userRole === 'admin' && (!branchId || branchId === 'all')) {
        // Admin phân tích toàn bộ hệ thống
        let prompt = `
Hãy phân tích dữ liệu kinh doanh của chuỗi siêu thị thực phẩm sạch và đưa ra phân tích chi tiết:

1. Thông tin tổng quan:
- Tổng doanh thu: ${totalRevenue.toLocaleString('vi-VN')}đ
- Tổng số đơn hàng: ${totalOrders} (Hoàn thành: ${completedOrders})
- Tổng số khách hàng: ${totalCustomers} (Hoạt động: ${activeCustomers})
- Tỷ lệ hoàn thành đơn hàng: ${totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(2) : 0}%
- Tỷ lệ khách hàng hoạt động: ${totalCustomers > 0 ? ((activeCustomers / totalCustomers) * 100).toFixed(2) : 0}%

2. Chi tiết từng chi nhánh:
${branchDetails.map(branch => `
Chi nhánh: ${branch.name}
- Doanh thu: ${branch.revenue.toLocaleString('vi-VN')}đ
- Số đơn hàng: ${branch.orders} (Hoàn thành: ${branch.completedOrders})
- Số khách hàng: ${branch.customers}
- Tỷ lệ hoàn thành đơn hàng: ${branch.orders > 0 ? ((branch.completedOrders / branch.orders) * 100).toFixed(2) : 0}%
- Tỷ lệ trả hàng: ${(branch.returnRate * 100).toFixed(2)}%
- Tỷ lệ hủy đơn: ${(branch.cancelRate * 100).toFixed(2)}%
- Thời gian giao hàng trung bình: ${branch.avgDeliveryTime.toFixed(2)} giờ
- Đánh giá trung bình: ${branch.avgRating.toFixed(2)}/5
- Top sản phẩm bán chạy: ${branch.topProducts.map(p => `${p.name} (Đã bán: ${p.sold}, Doanh thu: ${p.revenue.toLocaleString('vi-VN')}đ)`).join(', ')}
`).join('\n')}

Hãy phân tích chi tiết:

1. Tổng quan tình hình kinh doanh:
   - Đánh giá hiệu quả kinh doanh tổng thể
   - Điểm mạnh và điểm yếu chính của chuỗi siêu thị
   - Xu hướng và cơ hội phát triển

2. Phân tích từng chi nhánh:
   - Xếp hạng các chi nhánh theo hiệu suất (dựa trên doanh thu, số đơn hàng, khách hàng)
   - Phân tích chi tiết 3 chi nhánh hoạt động tốt nhất và 3 chi nhánh hoạt động kém nhất
   - Nguyên nhân dẫn đến sự chênh lệch hiệu suất giữa các chi nhánh

3. Đề xuất chiến lược:
   - 5 đề xuất cụ thể để cải thiện hiệu quả kinh doanh tổng thể
   - Chiến lược phát triển cho từng nhóm chi nhánh (hiệu suất cao, trung bình, thấp)
   - Kế hoạch hành động ngắn hạn (3 tháng) và dài hạn (1 năm)

4. Quản lý chất lượng dịch vụ:
   - Đánh giá tình trạng giao hàng và đánh giá của khách hàng
   - Đề xuất giải pháp cải thiện chất lượng dịch vụ
   - Chiến lược giảm tỷ lệ trả hàng và hủy đơn

Hãy trình bày phân tích một cách rõ ràng, dễ đọc và có cấu trúc. Sử dụng ngôn ngữ đơn giản, chính xác và mang tính xây dựng.`;

        // Gọi API OpenAI
        for (const model of models) {
          try {
            console.log(`Bắt đầu gọi API OpenAI với model ${model}`);
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: model,
                messages: [
                  {
                    role: "system",
                    content: "Bạn là một chuyên gia phân tích dữ liệu kinh doanh với nhiều năm kinh nghiệm trong lĩnh vực bán lẻ thực phẩm. Hãy đưa ra các phân tích chuyên sâu, chi tiết và đề xuất cụ thể dựa trên dữ liệu."
                  },
                  {
                    role: "user",
                    content: prompt
                  }
                ],
                temperature: 0.7,
                max_tokens: 3500
              })
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`OpenAI API error với model ${model}:`, errorText);
              lastError = new Error(`OpenAI API error với model ${model}: ${response.status} - ${errorText}`);
              continue;
            }
            
            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
              console.error(`Invalid API response structure với model ${model}:`, data);
              lastError = new Error(`Invalid API response structure với model ${model}`);
              continue;
            }
            
            const analysis = data.choices[0].message.content;
            console.log(`Độ dài phân tích từ model ${model}:`, analysis.length);
            
            // Trả về kết quả phân tích từ OpenAI
            const responseData = {
              analysis: analysis,
              data: { 
                overview: {
                  totalRevenue,
                  totalOrders,
                  completedOrders,
                  totalCustomers,
                  activeCustomers,
                  totalProducts
                },
                branches: branchDetails 
              }
            };
            
            console.log("Trả về phân tích thành công");
            return res.json(responseData);
          } catch (error) {
            console.error(`Error calling OpenAI API với model ${model}:`, error);
            lastError = error;
          }
        }
      } else {
        // Admin chọn một chi nhánh cụ thể hoặc Manager chỉ phân tích chi nhánh của mình
        const branch = branchDetails.find(b => b.id === branchId);
        
        if (!branch) {
          return res.status(404).json({ 
            message: "Không tìm thấy chi nhánh",
            data: { 
              overview: {
                totalRevenue,
                totalOrders,
                completedOrders,
                totalCustomers,
                activeCustomers,
                totalProducts
              },
              branches: branchDetails 
            }
          });
        }
        
        // Tạo prompt cho chi nhánh cụ thể
        let prompt = `
Hãy phân tích dữ liệu kinh doanh của chi nhánh ${branch.name} và đưa ra phân tích chi tiết:

1. Thông tin chi nhánh:
- Doanh thu: ${branch.revenue.toLocaleString('vi-VN')}đ
- Số đơn hàng: ${branch.orders} (Hoàn thành: ${branch.completedOrders})
- Tỷ lệ hoàn thành đơn hàng: ${branch.orders > 0 ? ((branch.completedOrders / branch.orders) * 100).toFixed(2) : 0}%
- Số khách hàng: ${branch.customers}
- Tỷ lệ trả hàng: ${(branch.returnRate * 100).toFixed(2)}%
- Tỷ lệ hủy đơn: ${(branch.cancelRate * 100).toFixed(2)}%
- Thời gian giao hàng trung bình: ${branch.avgDeliveryTime.toFixed(2)} giờ
- Đánh giá trung bình: ${branch.avgRating.toFixed(2)}/5
- Top sản phẩm bán chạy: ${branch.topProducts.map(p => `${p.name} (Đã bán: ${p.sold}, Doanh thu: ${p.revenue.toLocaleString('vi-VN')}đ)`).join(', ')}

Hãy phân tích chi tiết:

1. Tổng quan hiệu suất chi nhánh:
   - Đánh giá hiệu quả kinh doanh tổng thể của chi nhánh
   - Điểm mạnh và điểm yếu chính của chi nhánh
   - So sánh với mức trung bình của ngành bán lẻ thực phẩm

2. Phân tích chi tiết:
   - Phân tích doanh thu và đơn hàng
   - Phân tích chất lượng dịch vụ (thời gian giao hàng, đánh giá khách hàng)
   - Phân tích hiệu suất sản phẩm (top sản phẩm, sản phẩm tiềm năng)

3. Đề xuất cải thiện:
   - 5 đề xuất cụ thể để cải thiện hiệu quả kinh doanh của chi nhánh
   - Chiến lược tăng doanh thu và giảm tỷ lệ trả hàng/hủy đơn
   - Kế hoạch hành động ngắn hạn (1 tháng) và trung hạn (3 tháng)

4. Quản lý chất lượng dịch vụ:
   - Đánh giá tình trạng giao hàng và đánh giá của khách hàng
   - Đề xuất giải pháp cải thiện chất lượng dịch vụ
   - Chiến lược giảm tỷ lệ trả hàng và hủy đơn

Hãy trình bày phân tích một cách rõ ràng, dễ đọc và có cấu trúc. Sử dụng ngôn ngữ đơn giản, chính xác và mang tính xây dựng.`;

        // Gọi API OpenAI
        for (const model of models) {
          try {
            console.log(`Bắt đầu gọi API OpenAI với model ${model}`);
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: model,
                messages: [
                  {
                    role: "system",
                    content: "Bạn là một chuyên gia phân tích dữ liệu kinh doanh với nhiều năm kinh nghiệm trong lĩnh vực bán lẻ thực phẩm. Hãy đưa ra các phân tích chuyên sâu, chi tiết và đề xuất cụ thể dựa trên dữ liệu."
                  },
                  {
                    role: "user",
                    content: prompt
                  }
                ],
                temperature: 0.7,
                max_tokens: 3000
              })
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`OpenAI API error với model ${model}:`, errorText);
              lastError = new Error(`OpenAI API error với model ${model}: ${response.status} - ${errorText}`);
              continue;
            }
            
            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
              console.error(`Invalid API response structure với model ${model}:`, data);
              lastError = new Error(`Invalid API response structure với model ${model}`);
              continue;
            }
            
            const analysis = data.choices[0].message.content;
            console.log(`Độ dài phân tích từ model ${model}:`, analysis.length);
            
            // Trả về kết quả phân tích từ OpenAI
            const responseData = {
              analysis: analysis,
              data: { 
                branch: branch,
                overview: {
                  totalRevenue,
                  totalOrders,
                  completedOrders,
                  totalCustomers,
                  activeCustomers,
                  totalProducts
                }
              }
            };
            
            console.log("Trả về phân tích thành công");
            return res.json(responseData);
          } catch (error) {
            console.error(`Error calling OpenAI API với model ${model}:`, error);
            lastError = error;
          }
        }
      }
      
      // Nếu tất cả các model đều thất bại
      if (lastError) {
        console.error("Tất cả các model đều thất bại:", lastError);
        return res.status(500).json({ 
          message: "Không thể kết nối đến dịch vụ AI. Vui lòng thử lại sau.",
          error: lastError.message,
          data: { 
            overview: {
              totalRevenue,
              totalOrders,
              completedOrders,
              totalCustomers,
              activeCustomers,
              totalProducts
            },
            branches: branchDetails 
          }
        });
      }
      
      // Fallback nếu không có model nào được gọi (không nên xảy ra)
      return res.status(500).json({ 
        message: "Lỗi không xác định khi phân tích dữ liệu",
        data: { 
          overview: {
            totalRevenue,
            totalOrders,
            completedOrders,
            totalCustomers,
            activeCustomers,
            totalProducts
          },
          branches: branchDetails 
        }
      });
    } catch (error) {
      console.error("Error in getAIAnalysis:", error);
      res.status(500).json({ 
        message: "Lỗi khi phân tích dữ liệu",
        error: error.message
      });
    }
  },
};

export default reportsController;
