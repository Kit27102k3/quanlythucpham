/* eslint-disable no-unused-vars */
import express from "express";
import Order from "../Model/Order.js";
import Product from "../Model/Products.js";
import User from "../Model/Register.js";
import Category from "../Model/Category.js"; // Added missing import
import { verifyToken as authMiddleware } from "../Middleware/authMiddleware.js";
import { getLowStockProducts } from "../Controller/ProductController.js";

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
      revenueData = Array.from({ length: 7 }, (_, i) => ({
        name: daysOfWeek[i],
        revenue: revenueData.find((item) => item.day === i + 1)?.revenue || 0,
      }));
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
      revenueData = Array.from({ length: daysInMonth }, (_, i) => ({
        name: `${i + 1}`,
        revenue:
          revenueData.find((item) => parseInt(item.name) === i + 1)?.revenue ||
          0,
      }));
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
      revenueData = Array.from({ length: 12 }, (_, i) => ({
        name: months[i],
        revenue: revenueData.find((item) => item.month === i + 1)?.revenue || 0,
      }));
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

// Get low-stock products (delegated to ProductController)
router.get("/low-stock", authMiddleware, getLowStockProducts);

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

export default router;
