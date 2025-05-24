/* eslint-disable no-undef */
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import dns from "dns";

import { deleteExpiredVouchers } from "./Controller/savedVoucherController.js";
import {
  handleSepayCallback,
  handleBankWebhook,
} from "./Controller/paymentController.js";
import reportsController from "./Controller/reportsController.js";
import {
  getBestSellingProducts,
  updateProductExpirations,
} from "./Controller/productsController.js";

// Load env variables
dotenv.config({ path: ".env" });

// Import models to avoid OverwriteModelError
import "./Model/Review.js";
import "./Model/ReviewStats.js";

// Clear model cache for specific models to avoid overwrite errors on hot reloads
["Messages", "Conversation"].forEach((model) => {
  if (mongoose.models[model]) {
    delete mongoose.models[model];
  }
});

// Import routes
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
import apiRoutes from './routes/apiRoutes.js';

// Import database config mới
import { initializeDatabase, getConnectionStatus, isMongoConnected } from './config/database.js';

const app = express();

// CORS configuration
app.use(
  cors({
    origin: "*", // Cho phép tất cả các origin 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Access-Token", "Accept", "Origin"]
  })
);

// Middleware for JSON and URL encoded bodies (50mb limit)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// JWT Authentication middleware
app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
    const secretKey = process.env.JWT_SECRET_ACCESS;

    if (!secretKey) {
      console.error("JWT_SECRET is not defined in environment variables");
      return next();
    }
      
      try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded;
      } catch (error) {
      // Chỉ log lỗi nếu không phải lỗi token hết hạn
      if (error.name !== 'TokenExpiredError') {
        console.warn("Invalid JWT token:", error.message);
      }
      }
    }
    next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - User Agent: ${req.headers['user-agent']}`);
  next();
});

// Middleware kiểm tra kết nối DB trước khi xử lý request cần DB
const checkDbConnection = (req, res, next) => {
  // Danh sách các endpoint không cần kết nối DB
  const noDbEndpoints = ['/health', '/debug', '/favicon.ico', '/', '/maintenance.html', '/api/status'];
  
  if (isMongoConnected || noDbEndpoints.includes(req.path)) {
    return next();
  }
  
  // Kiểm tra xem request có phải là API hay không
  if (req.path.startsWith('/api/')) {
    return res.status(503).json({
      success: false,
      message: "Dịch vụ database tạm thời không khả dụng. Vui lòng thử lại sau.",
      code: "DB_UNAVAILABLE"
    });
  }
  
  // Nếu là request trang web thì redirect về trang thông báo bảo trì
  res.redirect('/maintenance.html');
};

// Tạo trang bảo trì đơn giản
app.get('/maintenance.html', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bảo trì hệ thống</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px 20px; }
        h1 { color: #e53935; }
        p { color: #333; max-width: 600px; margin: 20px auto; }
        button { background: #4caf50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>Hệ thống đang được bảo trì</h1>
      <p>Chúng tôi đang gặp vấn đề kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau hoặc liên hệ với chúng tôi nếu vấn đề kéo dài.</p>
      <p>Hotline: 0326 743391</p>
      <button onclick="window.location.reload()">Thử lại</button>
    </body>
    </html>
  `);
});

// Trang chủ mặc định
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Quản Lý Thực Phẩm API</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2e7d32; margin-bottom: 30px; }
        .status { display: inline-block; padding: 8px 15px; border-radius: 20px; font-weight: bold; margin-bottom: 20px; }
        .status.online { background-color: #e8f5e9; color: #2e7d32; }
        .status.offline { background-color: #ffebee; color: #c62828; }
        .endpoints { text-align: left; background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-top: 20px; }
        .endpoints h3 { margin-top: 0; }
        .endpoint { margin-bottom: 10px; padding: 5px; }
        .endpoint code { background-color: #e0e0e0; padding: 3px 6px; border-radius: 3px; }
        footer { margin-top: 30px; color: #757575; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Quản Lý Thực Phẩm API</h1>
        <div class="status ${isMongoConnected ? 'online' : 'offline'}">
          ${isMongoConnected ? '✅ Hệ thống đang hoạt động' : '❌ Database đang ngắt kết nối'}
        </div>
        
        <p>Đây là API server cho ứng dụng Quản Lý Thực Phẩm. Vui lòng sử dụng client app để truy cập dịch vụ.</p>
        
        <div class="endpoints">
          <h3>Các endpoint chính:</h3>
          <div class="endpoint">
            <code>GET /health</code> - Kiểm tra trạng thái hệ thống
          </div>
          <div class="endpoint">
            <code>GET /api/products</code> - Danh sách sản phẩm
          </div>
          <div class="endpoint">
            <code>GET /api/categories</code> - Danh sách danh mục
          </div>
          <div class="endpoint">
            <code>GET /api/db/status</code> - Trạng thái kết nối database
          </div>
        </div>
        
        <footer>
          <p>© ${new Date().getFullYear()} Quản Lý Thực Phẩm - Phiên bản ${process.env.npm_package_version || '1.0.0'}</p>
        </footer>
      </div>
    </body>
    </html>
  `);
});

// Áp dụng middleware kiểm tra DB cho tất cả các request
app.use(checkDbConnection);

// Khởi tạo kết nối đến database
initializeDatabase().then(() => {
  console.log("Database initialization completed");
}).catch(err => {
  console.error("Failed to initialize database:", err);
  console.log("Server will run in fallback mode");
});

// Register API routes
app.use("/auth", authRoutes);
app.use("/admin/auth", adminAuthRoutes);
app.use("/api", adminRoutes);
app.use("/api/categories", categoryRoutes);
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
app.use('/api/db', apiRoutes);

// Direct product best sellers endpoint
app.get("/api/products/best-sellers", getBestSellingProducts);

// Reports endpoints registration (mapping path -> handler)
const reportEndpoints = {
  "/api/dashboard/stats": reportsController.getDashboardStats,
  "/api/analytics/revenue": reportsController.getRevenueData,
  "/api/analytics/top-products": reportsController.getTopProducts,
  "/api/products/inventory": reportsController.getInventoryData,
  "/api/users/stats": reportsController.getUserData,
  "/api/orders/stats": reportsController.getOrderData,
  "/api/coupons/stats": reportsController.getPromotionData,
  "/api/admin/activity-logs": reportsController.getSystemActivityData,
  "/api/orders/delivery-stats": reportsController.getDeliveryData,
  "/api/reviews/stats": reportsController.getFeedbackData,
};

// Register report endpoints and their aliases under /api/reports
for (const [path, handler] of Object.entries(reportEndpoints)) {
  app.get(path, handler);
  app.get(`/api/reports${path.replace(/^\/api/, "")}`, handler);
}

// Webhook handler function
const webhookHandler = async (req, res) => {
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
    console.error("Webhook error:", error);
      if (!res.headersSent) {
        res.status(200).json({
          success: true,
          code: "00",
          message: "Webhook received with error",
        error: error.message,
      });
    }
  }
};

// Register webhook routes
[
  "/webhook",
  "/api/webhook",
  "/api/webhook/bank",
  "/api/payments/webhook",
  "/api/payments/webhook/bank",
  "/api/payments/sepay/webhook",
].forEach((path) => app.post(path, webhookHandler));

// Enhanced health check endpoint
app.get("/health", (req, res) => {
  const dbStatus = getConnectionStatus();
  
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
    mongoConnection: dbStatus.isConnected ? "connected" : "disconnected",
    mongoReadyState: mongoose.connection.readyState,
    uptime: process.uptime(),
    fallbackMode: !dbStatus.isConnected,
    dbConnectionAttempts: dbStatus.connectionAttempts,
    dbHost: dbStatus.host,
    dbName: dbStatus.dbName
  });
});

// Endpoint để kiểm tra thông tin chi tiết (chỉ dùng trong development)
app.get("/debug", (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      message: "Debug endpoint is disabled in production"
    });
  }
  
  res.json({
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      HOST: process.env.HOST
    },
    headers: req.headers,
    mongo: {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      readyState: mongoose.connection.readyState
    }
  });
});

// Thêm endpoint hiện thị thông tin chi tiết về kết nối MongoDB
app.get('/mongodb-debug', async (req, res) => {
  try {
    // Chỉ cho phép trong môi trường development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Forbidden in production environment' });
    }

    // Thu thập thông tin chi tiết về môi trường và kết nối
    const info = {
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
      mongoose: {
        version: mongoose.version,
        connectionState: mongoose.connection.readyState,
        connectionParams: {
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name,
        },
      },
      request: {
        ip: req.ip,
        ips: req.ips,
        headers: req.headers,
        userAgent: req.get('User-Agent'),
      },
      network: {
        dnsServers: dns.getServers(),
      },
    };

    // Thử resolve địa chỉ MongoDB Atlas
    try {
      const mainHost = 'cluster0.ahfbtwd.mongodb.net';
      const dnsLookupPromise = new Promise((resolve, reject) => {
        dns.lookup(mainHost, (err, address) => {
          if (err) reject(err);
          else resolve(address);
        });
      });
      
      const dnsResolvePromise = new Promise((resolve, reject) => {
        dns.resolve(mainHost, (err, addresses) => {
          if (err) reject(err);
          else resolve(addresses);
        });
      });
      
      // Đặt timeout 5 giây cho các DNS lookup
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('DNS lookup timeout')), 5000)
      );
      
      // Chạy các thao tác DNS với timeout
      try {
        info.network.dnsLookup = await Promise.race([dnsLookupPromise, timeout]);
      } catch (e) {
        info.network.dnsLookupError = e.message;
      }
      
      try {
        info.network.dnsResolve = await Promise.race([dnsResolvePromise, timeout]);
      } catch (e) {
        info.network.dnsResolveError = e.message;
      }
    } catch (dnsErr) {
      info.network.dnsError = dnsErr.message;
    }

    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware to catch unhandled requests (404)
app.use((req, res, next) => {
  // Chỉ xử lý nếu headersSent = false, tránh lỗi khi response đã được gửi
  if (!res.headersSent) {
    res.status(404).json({
      success: false,
      message: `Cannot ${req.method} ${req.url}`,
    });
  } else {
    // Nếu headers đã được gửi, chỉ gọi next với lỗi (nếu có)
    next();
  }
});

// Global error handling middleware
app.use((err, req, res) => {
  console.error("Global error:", err);

  // Kiểm tra req.path tồn tại trước khi sử dụng
  const path = req && req.path ? req.path : '';

  // Kiểm tra res là đối tượng response hợp lệ
  if (!res || typeof res.status !== 'function') {
    console.error("Invalid Express response object in error handler.");
    // Tùy chọn: log thêm thông tin debug về req và err
    // console.log('Request details:', req);
    // console.log('Error details:', err);
    // Kết thúc request một cách an toàn nếu có thể, hoặc re-throw lỗi
    // Để đơn giản, ta sẽ log và có thể để request timeout hoặc trả về lỗi chung tùy cấu hình serverless
    // Trong môi trường serverless, thường không có server.on('error') như server truyền thống
    // Lỗi ở đây có thể do context không đúng
    return; // Thoát khỏi middleware để tránh lỗi thêm
  }

  if (path.includes("webhook") || path.includes("/api/payments/")) {
    return res.status(200).json({
    success: true,
    code: "00",
      message: "Request received with error",
      error: err.message,
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message,
  });
});

// Scheduled tasks
const scheduleIntervalHours = 6;
const scheduleIntervalMs = scheduleIntervalHours * 60 * 60 * 1000;

const runScheduledTasks = async () => {
  try {
    await Promise.all([deleteExpiredVouchers(), updateProductExpirations()]);
  } catch (error) {
    console.error("Scheduled task error:", error);
  }
};

// Google Maps Geocoding API proxy endpoint
app.get("/api/geocode", async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({
        status: "ZERO_RESULTS",
        error_message: "Missing address",
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        status: "REQUEST_DENIED",
        error_message: "Missing Google Maps API key",
      });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&region=vn&language=vi&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Geocoding error:", error);
    res.status(500).json({
      status: "ERROR",
      error_message: error.message,
    });
  }
});

// Start server function
const startServer = (port) => {
  const portNumber = Number(port) || 8080;
  
  app.listen(portNumber, async () => {
    console.log(`Server running on port ${portNumber}`);

    // Run scheduled tasks immediately on start
    await runScheduledTasks();

    // Schedule periodic tasks
    setInterval(runScheduledTasks, scheduleIntervalMs);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${portNumber} is already in use. Trying port ${portNumber + 1}...`);
      startServer(portNumber + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(process.env.PORT);

