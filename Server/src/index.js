/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { deleteExpiredVouchers } from "./Controller/savedVoucherController.js";
import {
  handleSepayCallback,
  handleBankWebhook,
} from "./Controller/paymentController.js";
import reportsController from "../controllers/reportsController.js";
import NodeCache from 'node-cache';

import "./Model/Review.js";
import "./Model/ReviewStats.js";
import "./Model/CustomerLog.js";

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
import customerLogRoutes from "./routes/customerLogRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import supabaseRoutes from './routes/supabaseRoutes.js';
import supabase from './config/supabase.js';

// Import customer log middleware
import { customerActivityLogger } from "./Middleware/customerLogMiddleware.js";

import { getBestSellingProducts } from "./Controller/Products/ProductRankingController.js";
import { updateProductExpirations } from "./Controller/Products/ProductUtilsController.js";

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
      "https://quanlythucpham-kit27102k3s-projects.vercel.app",
      process.env.NODE_ENV !== "production" ? "*" : null,
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    maxAge: 3600,
  })
);

// Add a CORS preflight handler for OPTIONS requests
app.options("*", cors());

// Custom middleware to ensure CORS headers are set on all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// Thêm middleware kiểm tra kết nối MongoDB trước khi xử lý request
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    console.log("MongoDB not connected, using Supabase fallback");
    
    // Nếu là request API products và không phải là request đến Supabase API
    if (req.path.includes('/api/') && !req.path.includes('/supabase/')) {
      // Chuyển hướng đến Supabase API tương ứng
      const supabasePath = req.path.replace('/api/', '/api/supabase/');
      console.log(`Redirecting ${req.path} to ${supabasePath}`);
      req.url = supabasePath;
    }
  }
  next();
});

// Add customer activity logging middleware
app.use(customerActivityLogger);

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
      
      // Debug: Kiểm tra các đơn hàng trong database
      try {
        const OrderModule = await import('./Model/Order.js');
        const Order = OrderModule.default;
        
        const orders = await Order.find();
       
        
        // Kiểm tra tổng doanh thu
        const revenueResult = await Order.aggregate([
          { $match: { status: { $in: ["completed", "delivered"] } } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]);
       
      } catch (err) {
        console.error("Error processing orders:", err);
      }
      
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
app.use("/api", uploadRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderRoutes);
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
app.use("/api/customer-logs", customerLogRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/supabase", supabaseRoutes);
app.get("/api/products/best-sellers", getBestSellingProducts);
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
app.get("/api/reports/dashboard", reportsController.getDashboardStats);
app.get("/api/reports/revenue", reportsController.getRevenueData);
app.get("/api/reports/top-products", reportsController.getTopProducts);
app.get("/api/reports/inventory", reportsController.getInventoryData);
app.get("/api/reports/users", reportsController.getUserData);
app.get("/api/reports/users/detail", reportsController.getUserDetailData);
app.get("/api/reports/orders", reportsController.getOrderData);
app.get("/api/reports/promotions", reportsController.getPromotionData);
app.get("/api/reports/system-activity", reportsController.getSystemActivityData);
app.get("/api/reports/delivery", reportsController.getDeliveryData);
app.get("/api/reports/feedback", reportsController.getFeedbackData);
app.get("/admin/dashboard", reportsController.getDashboardStats);
const webhookPaths = [
  "/webhook",
  "/api/webhook",
  "/api/webhook/bank",
  "/api/payments/webhook",
  "/api/payments/webhook/bank",
  "/api/payments/sepay/webhook",
];

webhookPaths.forEach((path) => {
  app.post(path, async (req, res) => {
    try {
      if (req.body.gateway === "MBBank" || req.body.transferAmount) {
        await handleBankWebhook(req, res);
      } else {
        await handleSepayCallback(req, res);
      }

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

app.use((req, res, next) => {
  try {
    next();
  } catch (error) {
    console.error("Uncaught error in request:", error);
    if (req.path.includes("webhook") || req.path.includes("/api/payments/")) {
      return res.status(200).json({
        success: true,
        code: "00",
        message: "Request received with uncaught error",
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

app.get("/health", (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const mongoStatusText = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  }[mongoStatus] || "unknown";

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
    mongodb: {
      status: mongoStatus,
      statusText: mongoStatusText
    },
    supabase: {
      status: !!supabase,
      url: process.env.SUPABASE_URL ? "configured" : "not configured"
    }
  });
});

app.get("/webhook", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SePay webhook endpoint is active",
    environment: process.env.NODE_ENV || "development",
  });
});

app.post("/webhook", (req, res) => {
  console.log("Received direct webhook POST:", req.body);
  res.status(200).json({
    success: true,
    code: "00",
    message: "Webhook received successfully",
  });
});

const scheduleExpiredVoucherCleanup = () => {
  try {
    deleteExpiredVouchers().then(() => {
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

// API health check
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Thêm API giả để trả về dữ liệu doanh thu và khách hàng
app.get("/api/users/count", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ count: 0, message: "Database not connected" });
    }
    
    import('./Model/Register.js').then(({ default: User }) => {
      User.countDocuments().then(count => {
        console.log("API users/count - Tổng số người dùng:", count);
        res.json({ count });
      }).catch(err => {
        console.error("Error counting users:", err);
        res.json({ count: 0, error: err.message });
      });
    }).catch(err => {
      console.error("Error importing User model:", err);
      res.json({ count: 0, error: err.message });
    });
  } catch (error) {
    console.error("Error in /api/users/count:", error);
    res.json({ count: 0, error: error.message });
  }
});

app.get("/admin/users/count", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ count: 0, message: "Database not connected" });
    }
    
    import('./Model/Register.js').then(({ default: User }) => {
      User.countDocuments().then(count => {
        console.log("API admin/users/count - Tổng số người dùng:", count);
        res.json({ count });
      }).catch(err => {
        console.error("Error counting users:", err);
        res.json({ count: 0, error: err.message });
      });
    }).catch(err => {
      console.error("Error importing User model:", err);
      res.json({ count: 0, error: err.message });
    });
  } catch (error) {
    console.error("Error in /admin/users/count:", error);
    res.json({ count: 0, error: error.message });
  }
});

// Thay thế các endpoint mẫu bằng endpoint thực tế sử dụng controller
app.get("/api/top-products", reportsController.getTopProducts);
app.get("/api/best-selling-products", reportsController.getTopProducts);
app.get("/api/reports/top-products", reportsController.getTopProducts);

// API endpoint cho dữ liệu tổng doanh thu
app.get("/api/reports/dashboard", reportsController.getDashboardStats);

// Sử dụng controller thay vì dữ liệu mẫu
app.get("/api/dashboard", reportsController.getDashboardStats);
app.get("/admin/dashboard", reportsController.getDashboardStats);

// API endpoint cho sản phẩm tồn kho thấp
app.get("/api/products/low-stock", reportsController.getInventoryData);
app.get("/api/products/inventory", reportsController.getInventoryData);
app.get("/api/reports/inventory", reportsController.getInventoryData);

// API endpoint for recent activities
app.get("/api/recent-activities", reportsController.getRecentActivities);
app.get("/api/activities/recent", reportsController.getRecentActivities);
