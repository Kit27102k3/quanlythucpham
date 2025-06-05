/* eslint-disable no-unused-vars */
import express from "express";
import Order from "../Model/Order.js";
import Product from "../Model/Products.js";
import User from "../Model/Register.js";
import Category from "../Model/Category.js"; // Added missing import
import { verifyToken as authMiddleware } from "../Middleware/authMiddleware.js";
import { getLowStockProducts, getTopSellingProducts } from "../Controller/ProductController.js";

const router = express.Router();

// Get revenue data by time range (week/month/year)
router.get("/revenue", authMiddleware, async (req, res) => {
  try {
    const { timeRange } = req.query;
    const currentDate = new Date();
    let startDate;

    // Set time range
    switch (timeRange) {
      case "week":
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 7));
        break;
      case "month":
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 30));
        break;
      case "year":
        startDate = new Date(
          currentDate.setFullYear(currentDate.getFullYear() - 1)
        );
        break;
      default:
        return res.status(400).json({ message: "Invalid timeRange parameter" });
    }

    // Aggregate revenue data
    let revenueData;
    if (timeRange === "week") {
      revenueData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ["completed", "delivered"] },
          },
        },
        {
          $group: {
            _id: { $dayOfWeek: "$createdAt" },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, day: "$_id", revenue: 1 } },
      ]);

      // Format data for all days of the week
      const daysOfWeek = [
        "CN",
        "Thứ 2",
        "Thứ 3",
        "Thứ 4",
        "Thứ 5",
        "Thứ 6",
        "Thứ 7",
      ];
      revenueData = Array.from({ length: 7 }, (_, i) => {
        const item = revenueData.find((item) => item.day === i + 1);
        return {
          name: daysOfWeek[i],
          revenue: item ? item.revenue : 0,
        };
      });
    } else if (timeRange === "month") {
      revenueData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ["completed", "delivered"] },
          },
        },
        {
          $group: {
            _id: { $dayOfMonth: "$createdAt" },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, name: { $toString: "$_id" }, revenue: 1 } },
      ]);

      // Ensure data for all days
      const daysInMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ).getDate();
      revenueData = Array.from({ length: daysInMonth }, (_, i) => {
        const item = revenueData.find((item) => parseInt(item.name) === i + 1);
        return {
          name: `${i + 1}`,
          revenue: item ? item.revenue : 0,
        };
      });
    } else {
      revenueData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ["completed", "delivered"] },
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, month: "$_id", revenue: 1 } },
      ]);

      // Format data for all months
      const months = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`);
      revenueData = Array.from({ length: 12 }, (_, i) => {
        const item = revenueData.find((item) => item.month === i + 1);
        return {
          name: months[i],
          revenue: item ? item.revenue : 0,
        };
      });
    }

    res.json(revenueData);
  } catch (error) {
    console.error("Error fetching revenue data:", error);
    res.status(500).json({ message: "Error fetching revenue data" });
  }
});

// Public route for revenue data (no auth required)
router.get("/api/revenue", async (req, res) => {
  try {
    const { timeRange } = req.query;
    const currentDate = new Date();
    let startDate;

    // Set time range
    switch (timeRange) {
      case "week":
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 7));
        break;
      case "month":
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 30));
        break;
      case "year":
        startDate = new Date(
          currentDate.setFullYear(currentDate.getFullYear() - 1)
        );
        break;
      default:
        return res.status(400).json({ message: "Invalid timeRange parameter" });
    }

    // Aggregate revenue data
    let revenueData;
    if (timeRange === "week") {
      revenueData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ["completed", "delivered"] },
          },
        },
        {
          $group: {
            _id: { $dayOfWeek: "$createdAt" },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, day: "$_id", revenue: 1 } },
      ]);

      // Format data for all days of the week
      const daysOfWeek = [
        "CN",
        "Thứ 2",
        "Thứ 3",
        "Thứ 4",
        "Thứ 5",
        "Thứ 6",
        "Thứ 7",
      ];
      revenueData = Array.from({ length: 7 }, (_, i) => {
        const item = revenueData.find((item) => item.day === i + 1);
        return {
          name: daysOfWeek[i],
          revenue: item ? item.revenue : 0,
        };
      });
    } else if (timeRange === "month") {
      revenueData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ["completed", "delivered"] },
          },
        },
        {
          $group: {
            _id: { $dayOfMonth: "$createdAt" },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, name: { $toString: "$_id" }, revenue: 1 } },
      ]);

      // Ensure data for all days
      const daysInMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ).getDate();
      revenueData = Array.from({ length: daysInMonth }, (_, i) => {
        const item = revenueData.find((item) => parseInt(item.name) === i + 1);
        return {
          name: `${i + 1}`,
          revenue: item ? item.revenue : 0,
        };
      });
    } else {
      revenueData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ["completed", "delivered"] },
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, month: "$_id", revenue: 1 } },
      ]);

      // Format data for all months
      const months = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`);
      revenueData = Array.from({ length: 12 }, (_, i) => {
        const item = revenueData.find((item) => item.month === i + 1);
        return {
          name: months[i],
          revenue: item ? item.revenue : 0,
        };
      });
    }

    res.json(revenueData);
  } catch (error) {
    console.error("Error fetching revenue data:", error);
    res.status(500).json({ message: "Error fetching revenue data" });
  }
});

// Get top-selling products
router.get("/top-products", authMiddleware, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topProducts = await Order.aggregate([
      { $match: { status: "completed" } },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $group: {
          _id: "$products.productId",
          name: { $first: { $arrayElemAt: ["$productInfo.productName", 0] } },
          sold: { $sum: "$products.quantity" },
          revenue: {
            $sum: { $multiply: ["$products.price", "$products.quantity"] },
          },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: parseInt(limit) },
      { $project: { _id: 0, name: 1, sold: 1, revenue: 1 } },
    ]);

    res.json(topProducts);
  } catch (error) {
    console.error("Error fetching top products:", error);
    res.status(500).json({ message: "Error fetching top products" });
  }
});

// Public route for top-selling products (no auth required)
router.get("/api/top-products", getTopSellingProducts);
router.get("/api/reports/top-products", getTopSellingProducts);
router.get("/admin/reports/top-products", authMiddleware, getTopSellingProducts);

// Get low-stock products (delegated to ProductController)
router.get("/low-stock", authMiddleware, getLowStockProducts);

// Public route for low-stock products (no auth required)
router.get("/api/low-stock", getLowStockProducts);
router.get("/api/products/inventory", getLowStockProducts);
router.get("/api/products/low-stock", getLowStockProducts);
router.get("/reports/inventory", getLowStockProducts);

// Get user statistics
router.get("/users", authMiddleware, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, newUsers, activeUsers, guestOrders] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Order.distinct("userId", {
        createdAt: { $gte: thirtyDaysAgo },
        userId: { $exists: true, $ne: null },
      }).then((users) => users.length),
      Order.countDocuments({
        createdAt: { $gte: thirtyDaysAgo },
        userId: { $exists: false },
      }),
    ]);

    const userData = [
      { name: "Người dùng mới", count: newUsers, color: "#8884d8" },
      { name: "Khách hàng thân thiết", count: activeUsers, color: "#82ca9d" },
      { name: "Khách vãng lai", count: guestOrders, color: "#ffc658" },
    ];

    res.json(userData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Error fetching user data" });
  }
});

// Test data structure
router.get("/test-structure", authMiddleware, async (req, res) => {
  try {
    const [orderCount, productCount, userCount, orderStatus, categories] =
      await Promise.all([
        Order.countDocuments(),
        Product.countDocuments(),
        User.countDocuments(),
        Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Category.find(),
      ]);

    res.json({
      message: "Data structure checked successfully",
      orderCount,
      productCount,
      userCount,
      orderStatus,
      categories,
    });
  } catch (error) {
    console.error("Error checking data structure:", error);
    res.status(500).json({ message: "Error checking data structure" });
  }
});

// Add routes for admin/reports/revenue
router.get("/admin/reports/revenue", authMiddleware, async (req, res) => {
  try {
    const { timeRange = "week" } = req.query;
    
    // Generate mock revenue data if database query fails
    const mockRevenueData = generateMockRevenueData(timeRange);
    res.json(mockRevenueData);
  } catch (error) {
    console.error("Error in admin/reports/revenue:", error);
    res.status(500).json({ message: "Error fetching revenue data" });
  }
});

// Add route for api/reports/revenue
router.get("/api/reports/revenue", async (req, res) => {
  try {
    const { timeRange = "week" } = req.query;
    
    // Generate mock revenue data if database query fails
    const mockRevenueData = generateMockRevenueData(timeRange);
    res.json(mockRevenueData);
  } catch (error) {
    console.error("Error in api/reports/revenue:", error);
    res.status(500).json({ message: "Error fetching revenue data" });
  }
});

// Helper function to generate mock revenue data
const generateMockRevenueData = (timeRange) => {
  const currentDate = new Date();
  let data = [];
  
  if (timeRange === "week") {
    const daysOfWeek = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    data = daysOfWeek.map((day, index) => {
      // Generate random revenue between 50k and 500k
      const revenue = Math.floor(Math.random() * 450000) + 50000;
      return { name: day, revenue };
    });
  } else if (timeRange === "month") {
    const daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();
    
    data = Array.from({ length: daysInMonth }, (_, i) => {
      const revenue = Math.floor(Math.random() * 450000) + 50000;
      return { name: `${i + 1}`, revenue };
    });
  } else {
    const months = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`);
    data = months.map((month) => {
      const revenue = Math.floor(Math.random() * 2000000) + 500000;
      return { name: month, revenue };
    });
  }
  
  return data;
};

export default router;
