/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import path from "path";
import { deleteExpiredVouchers } from "./Controller/savedVoucherController.js";
import {
  handleSepayCallback,
  handleBankWebhook,
} from "./Controller/paymentController.js";
import reportsController from "./Controller/reportsController.js";
import NodeCache from 'node-cache';

// ES modules compatibility
// // Sử dụng process.cwd() thay vì import.meta.url
// const __dirname = process.cwd();

// Import models before routes
import "./Model/Review.js";
import "./Model/ReviewStats.js";

import authRoutes from "./routes/authRoutes.js";
import scraperRoutes from "./routes/scraperRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productsRoutes from "./routes/productsRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import { chatbotRoutes } from "./routes/chatbotRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import tipsRoutes from "./routes/tipsRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import savedVoucherRoutes from "./routes/savedVoucherRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";

// Import specific controller for direct endpoint handling
import { getBestSellingProducts } from "./Controller/productsController.js";
import { updateProductExpirations } from "./Controller/productsController.js";

dotenv.config({ path: ".env" });
const app = express();

// Xóa model cache để tránh lỗi OverwriteModelError
Object.keys(mongoose.models).forEach((modelName) => {
  if (modelName === "Messages" || modelName === "Conversation") {
    delete mongoose.models[modelName];
  }
});

// Tạo cache với thời gian sống 5 phút
const cache = new NodeCache({ stdTTL: 300 });

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://quanlythucpham.vercel.app",
      "https://quanlythucpham-vercel.app",
      "https://quanlythucpham-git-main-kits-projects.vercel.app",
      process.env.NODE_ENV !== "production" ? "*" : null,
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    maxAge: 3600,
  })
);

// Add a CORS preflight handler for OPTIONS requests
app.options("*", cors());

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// Middleware kiểm tra token và trích xuất thông tin người dùng
app.use((req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const jwt = require("jsonwebtoken");
      const secretKey = process.env.JWT_SECRET || "your-secret-key";

      try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded;
      } catch (error) {
        // Xử lý token không hợp lệ
      }
    }
    next();
  } catch (error) {
    next();
  }
});

// Thêm middleware kiểm tra kết nối MongoDB trước khi xử lý request
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    console.log("MongoDB not connected, returning cached or fallback data");
    
    // Nếu là request API products, trả về dữ liệu mẫu
    if (req.path === '/api/products') {
      return res.json({
        success: false,
        message: "Không thể kết nối đến cơ sở dữ liệu",
        isOffline: true,
        data: [] // Hoặc dữ liệu mẫu/cache nếu có
      });
    }
    
    // Các API khác
    return next();
  }
  next();
});

const URI = process.env.MONGOOSE_URI;

const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(URI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        maxPoolSize: 10,
        minPoolSize: 1,
        retryWrites: true,
        retryReads: true
      });
      console.log("MongoDB connected successfully");
      return;
    } catch (err) {
      console.error(`Connection attempt ${i + 1} failed:`, err);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error("Failed to connect to MongoDB after multiple retries");
};

connectWithRetry();

// Thêm xử lý các sự kiện kết nối
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected, attempting to reconnect...');
  // Có thể thêm logic reconnect ở đây nếu cần
});

app.use("/auth", authRoutes);
app.use("/admin/auth", adminAuthRoutes);
app.use("/api", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/logout", authRoutes);
app.use("/api", scraperRoutes);
app.use("/api", productsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", tipsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/saved-vouchers", savedVoucherRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/branches", branchRoutes);

// Handle best-sellers endpoint directly to avoid route conflicts
app.get("/api/products/best-sellers", getBestSellingProducts);

// Add reports direct endpoints
// Reports API routes for traditional endpoints (no authentication required)
app.get("/api/dashboard/stats", reportsController.getDashboardStats);
app.get("/api/analytics/revenue", reportsController.getRevenueData);
app.get("/api/analytics/top-products", reportsController.getTopProducts);
app.get("/api/products/inventory", reportsController.getInventoryData);
app.get("/api/users/stats", reportsController.getUserData);
app.get("/api/orders/stats", reportsController.getOrderData);
app.get("/api/coupons/stats", reportsController.getPromotionData);
app.get("/api/admin/activity-logs", reportsController.getSystemActivityData);
app.get("/api/orders/delivery-stats", reportsController.getDeliveryData);
app.get("/api/reviews/stats", reportsController.getFeedbackData);

// Reports API routes for Edge API (no authentication required)
app.get("/api/reports/dashboard", reportsController.getDashboardStats);
app.get("/api/reports/revenue", reportsController.getRevenueData);
app.get("/api/reports/top-products", reportsController.getTopProducts);
app.get("/api/reports/inventory", reportsController.getInventoryData);
app.get("/api/reports/users", reportsController.getUserData);
app.get("/api/reports/orders", reportsController.getOrderData);
app.get("/api/reports/promotions", reportsController.getPromotionData);
app.get("/api/reports/system-activity", reportsController.getSystemActivityData);
app.get("/api/reports/delivery", reportsController.getDeliveryData);
app.get("/api/reports/feedback", reportsController.getFeedbackData);

// Dọn dẹp các webhook handler trùng lặp
// Đây là danh sách các đường dẫn webhook cần hỗ trợ
const webhookPaths = [
  "/webhook",
  "/api/webhook",
  "/api/webhook/bank",
  "/api/payments/webhook",
  "/api/payments/webhook/bank",
  "/api/payments/sepay/webhook",
];

// Đăng ký tất cả các route webhook với một handler duy nhất
webhookPaths.forEach((path) => {
  app.post(path, async (req, res) => {
    try {
      // Removed console.log for webhook received

      // Xử lý webhook đồng bộ trước khi trả về response
      if (req.body.gateway === "MBBank" || req.body.transferAmount) {
        await handleBankWebhook(req, res);
      } else {
        await handleSepayCallback(req, res);
      }

      // Chỉ trả về response nếu chưa được trả về từ các handler
      if (!res.headersSent) {
        res.status(200).json({
          success: true,
          code: "00",
          message: "Webhook processed successfully",
        });
      }
    } catch (error) {
      console.error(`Error handling webhook at ${path}:`, error);
      if (!res.headersSent) {
        res.status(200).json({
          success: true,
          code: "00",
          message: "Webhook received with error",
          error: error.message,
        });
      }
    }
  });
});

// Thêm middleware xử lý lỗi nghiêm trọng
app.use((req, res, next) => {
  try {
    next();
  } catch (error) {
    console.error("Uncaught error in request:", error);
    // Đối với webhook, luôn trả về 200
    if (req.path.includes("webhook") || req.path.includes("/api/payments/")) {
      return res.status(200).json({
        success: true,
        code: "00",
        message: "Request received with uncaught error",
        error: error.message,
      });
    }
    // Đối với các request khác, trả về 500
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// Thêm endpoint trực tiếp cho SePay để debug lỗi 500
app.get("/webhook", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SePay webhook endpoint is active",
    environment: process.env.NODE_ENV || "development",
  });
});

// Thêm handler đơn giản cho webhook test
app.post("/webhook", (req, res) => {
  console.log("Received direct webhook POST:", req.body);
  res.status(200).json({
    success: true,
    code: "00",
    message: "Webhook received successfully",
  });
});

// Hàm dọn dẹp voucher hết hạn
const scheduleExpiredVoucherCleanup = () => {
  try {
    // Gọi function để xóa các voucher hết hạn
    deleteExpiredVouchers().then(() => {
      // Removed console.log for expired voucher cleanup completed
    });
  } catch (error) {
    console.error("Error in scheduled expired voucher cleanup:", error);
  }
};

// Bắt đầu lịch xóa voucher hết hạn
scheduleExpiredVoucherCleanup();

// Hàm kiểm tra sản phẩm hết hạn
const scheduleProductExpirationCheck = () => {
  try {
    // Removed console.log for product expiration check
    updateProductExpirations().then((result) => {
      // Removed console.log for product expiration results
    });
  } catch (error) {
    console.error("Error in scheduled product expiration check:", error);
  }
};

// Thêm công việc định kỳ để kiểm tra và cập nhật hạn sản phẩm
// Chạy mỗi 6 giờ
const scheduleIntervalHours = 6;
const scheduleInterval = scheduleIntervalHours * 60 * 60 * 1000; // Convert hours to milliseconds

// Khởi động server với cơ chế xử lý lỗi cổng
const startServer = (port) => {
  // Đảm bảo port là số và trong phạm vi hợp lệ
  const portNumber = parseInt(port, 10);
  if (isNaN(portNumber)) {
    port = 8080;
  }

  try {
    const server = app.listen(port, () => {
      // Removed console.log for server running

      // Schedule cleanup of expired vouchers
      scheduleExpiredVoucherCleanup(); // Run once at startup

      // Schedule check for product expirations
      scheduleProductExpirationCheck(); // Run once at startup

      // Set up interval to run cleanup and checks periodically
      setInterval(scheduleExpiredVoucherCleanup, scheduleInterval);
      setInterval(scheduleProductExpirationCheck, scheduleInterval);

      // Removed console.log for scheduled tasks
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${port} is already in use. Please close the applications using this port and try again.`
        );
        process.exit(1);
      } else {
        console.error("Server error:", error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

// Khởi động server
const port = process.env.PORT || 8080;
startServer(port);

// Middleware sử dụng cache cho các request GET
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  
  const key = req.originalUrl;
  const cachedResponse = cache.get(key);
  
  if (cachedResponse) {
    console.log(`Serving from cache: ${key}`);
    return res.json(cachedResponse);
  }
  
  // Lưu response gốc
  const originalSend = res.json;
  res.json = function(body) {
    cache.set(key, body);
    originalSend.call(this, body);
  };
  
  next();
});
