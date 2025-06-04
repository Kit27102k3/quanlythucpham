"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _express = _interopRequireDefault(require("express"));
var _cors = _interopRequireDefault(require("cors"));
var _cookieParser = _interopRequireDefault(require("cookie-parser"));
var _mongoose = _interopRequireDefault(require("mongoose"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _bodyParser = _interopRequireDefault(require("body-parser"));
var _path = _interopRequireDefault(require("path"));
var _savedVoucherController = require("./Controller/savedVoucherController.js");
var _paymentController = require("./Controller/paymentController.js");



var _reportsController = _interopRequireDefault(require("./Controller/reportsController.js"));
var _nodeCache = _interopRequireDefault(require("node-cache"));






require("./Model/Review.js");
require("./Model/ReviewStats.js");
require("./Model/CustomerLog.js");

var _authRoutes = _interopRequireDefault(require("./routes/authRoutes.js"));
var _scraperRoutes = _interopRequireDefault(require("./routes/scraperRoutes.js"));
var _categoryRoutes = _interopRequireDefault(require("./routes/categoryRoutes.js"));
var _productsRoutes = _interopRequireDefault(require("./routes/productsRoutes.js"));
var _cartRoutes = _interopRequireDefault(require("./routes/cartRoutes.js"));
var _chatbotRoutes = require("./routes/chatbotRoutes.js");
var _paymentRoutes = _interopRequireDefault(require("./routes/paymentRoutes.js"));
var _orderRoutes = _interopRequireDefault(require("./routes/orderRoutes.js"));
var _adminRoutes = _interopRequireDefault(require("./routes/adminRoutes.js"));
var _adminAuthRoutes = _interopRequireDefault(require("./routes/adminAuthRoutes.js"));
var _dashboardRoutes = _interopRequireDefault(require("./routes/dashboardRoutes.js"));
var _tipsRoutes = _interopRequireDefault(require("./routes/tipsRoutes.js"));
var _contactRoutes = _interopRequireDefault(require("./routes/contactRoutes.js"));
var _messageRoutes = _interopRequireDefault(require("./routes/messageRoutes.js"));
var _reviewRoutes = _interopRequireDefault(require("./routes/reviewRoutes.js"));
var _couponRoutes = _interopRequireDefault(require("./routes/couponRoutes.js"));
var _savedVoucherRoutes = _interopRequireDefault(require("./routes/savedVoucherRoutes.js"));
var _reportRoutes = _interopRequireDefault(require("./routes/reportRoutes.js"));
var _systemRoutes = _interopRequireDefault(require("./routes/systemRoutes.js"));
var _supplierRoutes = _interopRequireDefault(require("./routes/supplierRoutes.js"));
var _brandRoutes = _interopRequireDefault(require("./routes/brandRoutes.js"));
var _branchRoutes = _interopRequireDefault(require("./routes/branchRoutes.js"));
var _customerLogRoutes = _interopRequireDefault(require("./routes/customerLogRoutes.js"));


var _customerLogMiddleware = require("./Middleware/customerLogMiddleware.js");


var _productsController = require("./Controller/productsController.js"); /* eslint-disable no-unused-vars */ /* eslint-disable no-undef */ // ES modules compatibility
// // Sử dụng process.cwd() thay vì import.meta.url
// const __dirname = process.cwd();
// Import models before routes
// Import customer log middleware
// Import specific controller for direct endpoint handling
_dotenv.default.config({ path: ".env" });const app = (0, _express.default)(); // Xóa model cache để tránh lỗi OverwriteModelError
Object.keys(_mongoose.default.models).forEach((modelName) => {
  if (modelName === "Messages" || modelName === "Conversation") {
    delete _mongoose.default.models[modelName];
  }
});

// Tạo cache với thời gian sống 5 phút
const cache = new _nodeCache.default({ stdTTL: 300 });

app.use(
  (0, _cors.default)({
    origin: [
    "http://localhost:3000",
    "https://quanlythucpham.vercel.app",
    "https://quanlythucpham-vercel.app",
    "https://quanlythucpham-git-main-kits-projects.vercel.app",
    process.env.NODE_ENV !== "production" ? "*" : null].
    filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    maxAge: 3600
  })
);

// Add a CORS preflight handler for OPTIONS requests
app.options("*", (0, _cors.default)());

app.use(_express.default.json({ limit: "50mb" }));
app.use((0, _cookieParser.default)());
app.use(_bodyParser.default.json({ limit: "50mb" }));
app.use(_bodyParser.default.urlencoded({ extended: true, limit: "50mb" }));

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
      }}
    next();
  } catch (error) {
    next();
  }
});

// Thêm middleware kiểm tra kết nối MongoDB trước khi xử lý request
app.use((req, res, next) => {
  if (_mongoose.default.connection.readyState !== 1) {
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

// Add customer activity logging middleware
app.use(_customerLogMiddleware.customerActivityLogger);

const URI = process.env.MONGOOSE_URI;

const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await _mongoose.default.connect(URI, {
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
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  console.error("Failed to connect to MongoDB after multiple retries");
};

connectWithRetry();

// Thêm xử lý các sự kiện kết nối
_mongoose.default.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

_mongoose.default.connection.on('disconnected', () => {
  console.log('MongoDB disconnected, attempting to reconnect...');
  // Có thể thêm logic reconnect ở đây nếu cần
});

app.use("/auth", _authRoutes.default);
app.use("/admin/auth", _adminAuthRoutes.default);
app.use("/api", _adminRoutes.default);
app.use("/api/categories", _categoryRoutes.default);
app.use("/logout", _authRoutes.default);
app.use("/api", _scraperRoutes.default);
app.use("/api", _productsRoutes.default);
app.use("/api/cart", _cartRoutes.default);
app.use("/api/chatbot", _chatbotRoutes.chatbotRoutes);
app.use("/api/payments", _paymentRoutes.default);
app.use("/api/orders", _orderRoutes.default);
app.use("/api/dashboard", _dashboardRoutes.default);
app.use("/api", _tipsRoutes.default);
app.use("/api/contact", _contactRoutes.default);
app.use("/api/messages", _messageRoutes.default);
app.use("/api/reviews", _reviewRoutes.default);
app.use("/api/coupons", _couponRoutes.default);
app.use("/api/saved-vouchers", _savedVoucherRoutes.default);
app.use("/api/reports", _reportRoutes.default);
app.use("/api/system", _systemRoutes.default);
app.use("/api/suppliers", _supplierRoutes.default);
app.use("/api/brands", _brandRoutes.default);
app.use("/api/branches", _branchRoutes.default);
app.use("/api/logs", _customerLogRoutes.default);
app.get("/api/products/best-sellers", _productsController.getBestSellingProducts);
app.get("/api/dashboard/stats", _reportsController.default.getDashboardStats);
app.get("/api/analytics/revenue", _reportsController.default.getRevenueData);
app.get("/api/analytics/top-products", _reportsController.default.getTopProducts);
app.get("/api/products/inventory", _reportsController.default.getInventoryData);
app.get("/api/users/stats", _reportsController.default.getUserData);
app.get("/api/orders/stats", _reportsController.default.getOrderData);
app.get("/api/coupons/stats", _reportsController.default.getPromotionData);
app.get("/api/admin/activity-logs", _reportsController.default.getSystemActivityData);
app.get("/api/orders/delivery-stats", _reportsController.default.getDeliveryData);
app.get("/api/reviews/stats", _reportsController.default.getFeedbackData);
app.get("/api/reports/dashboard", _reportsController.default.getDashboardStats);
app.get("/api/reports/revenue", _reportsController.default.getRevenueData);
app.get("/api/reports/top-products", _reportsController.default.getTopProducts);
app.get("/api/reports/inventory", _reportsController.default.getInventoryData);
app.get("/api/reports/users", _reportsController.default.getUserData);
app.get("/api/reports/orders", _reportsController.default.getOrderData);
app.get("/api/reports/promotions", _reportsController.default.getPromotionData);
app.get("/api/reports/system-activity", _reportsController.default.getSystemActivityData);
app.get("/api/reports/delivery", _reportsController.default.getDeliveryData);
app.get("/api/reports/feedback", _reportsController.default.getFeedbackData);
const webhookPaths = [
"/webhook",
"/api/webhook",
"/api/webhook/bank",
"/api/payments/webhook",
"/api/payments/webhook/bank",
"/api/payments/sepay/webhook"];


webhookPaths.forEach((path) => {
  app.post(path, async (req, res) => {
    try {
      if (req.body.gateway === "MBBank" || req.body.transferAmount) {
        await (0, _paymentController.handleBankWebhook)(req, res);
      } else {
        await (0, _paymentController.handleSepayCallback)(req, res);
      }

      if (!res.headersSent) {
        res.status(200).json({
          success: true,
          code: "00",
          message: "Webhook processed successfully"
        });
      }
    } catch (error) {
      console.error(`Error handling webhook at ${path}:`, error);
      if (!res.headersSent) {
        res.status(200).json({
          success: true,
          code: "00",
          message: "Webhook received with error",
          error: error.message
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
        error: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development"
  });
});

app.get("/webhook", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SePay webhook endpoint is active",
    environment: process.env.NODE_ENV || "development"
  });
});

app.post("/webhook", (req, res) => {
  console.log("Received direct webhook POST:", req.body);
  res.status(200).json({
    success: true,
    code: "00",
    message: "Webhook received successfully"
  });
});

const scheduleExpiredVoucherCleanup = () => {
  try {
    (0, _savedVoucherController.deleteExpiredVouchers)().then(() => {
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
    (0, _productsController.updateProductExpirations)().then((result) => {

      // Removed console.log for product expiration results
    });} catch (error) {
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
  res.json = function (body) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZXhwcmVzcyIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwiX2NvcnMiLCJfY29va2llUGFyc2VyIiwiX21vbmdvb3NlIiwiX2RvdGVudiIsIl9ib2R5UGFyc2VyIiwiX3BhdGgiLCJfc2F2ZWRWb3VjaGVyQ29udHJvbGxlciIsIl9wYXltZW50Q29udHJvbGxlciIsIl9yZXBvcnRzQ29udHJvbGxlciIsIl9ub2RlQ2FjaGUiLCJfYXV0aFJvdXRlcyIsIl9zY3JhcGVyUm91dGVzIiwiX2NhdGVnb3J5Um91dGVzIiwiX3Byb2R1Y3RzUm91dGVzIiwiX2NhcnRSb3V0ZXMiLCJfY2hhdGJvdFJvdXRlcyIsIl9wYXltZW50Um91dGVzIiwiX29yZGVyUm91dGVzIiwiX2FkbWluUm91dGVzIiwiX2FkbWluQXV0aFJvdXRlcyIsIl9kYXNoYm9hcmRSb3V0ZXMiLCJfdGlwc1JvdXRlcyIsIl9jb250YWN0Um91dGVzIiwiX21lc3NhZ2VSb3V0ZXMiLCJfcmV2aWV3Um91dGVzIiwiX2NvdXBvblJvdXRlcyIsIl9zYXZlZFZvdWNoZXJSb3V0ZXMiLCJfcmVwb3J0Um91dGVzIiwiX3N5c3RlbVJvdXRlcyIsIl9zdXBwbGllclJvdXRlcyIsIl9icmFuZFJvdXRlcyIsIl9icmFuY2hSb3V0ZXMiLCJfY3VzdG9tZXJMb2dSb3V0ZXMiLCJfY3VzdG9tZXJMb2dNaWRkbGV3YXJlIiwiX3Byb2R1Y3RzQ29udHJvbGxlciIsImRvdGVudiIsImNvbmZpZyIsInBhdGgiLCJhcHAiLCJleHByZXNzIiwiT2JqZWN0Iiwia2V5cyIsIm1vbmdvb3NlIiwibW9kZWxzIiwiZm9yRWFjaCIsIm1vZGVsTmFtZSIsImNhY2hlIiwiTm9kZUNhY2hlIiwic3RkVFRMIiwidXNlIiwiY29ycyIsIm9yaWdpbiIsInByb2Nlc3MiLCJlbnYiLCJOT0RFX0VOViIsImZpbHRlciIsIkJvb2xlYW4iLCJjcmVkZW50aWFscyIsIm1ldGhvZHMiLCJtYXhBZ2UiLCJvcHRpb25zIiwianNvbiIsImxpbWl0IiwiY29va2llUGFyc2VyIiwiYm9keVBhcnNlciIsInVybGVuY29kZWQiLCJleHRlbmRlZCIsInJlcSIsInJlcyIsIm5leHQiLCJhdXRoSGVhZGVyIiwiaGVhZGVycyIsImF1dGhvcml6YXRpb24iLCJzdGFydHNXaXRoIiwidG9rZW4iLCJzdWJzdHJpbmciLCJqd3QiLCJzZWNyZXRLZXkiLCJKV1RfU0VDUkVUIiwiZGVjb2RlZCIsInZlcmlmeSIsInVzZXIiLCJlcnJvciIsImNvbm5lY3Rpb24iLCJyZWFkeVN0YXRlIiwiY29uc29sZSIsImxvZyIsInN1Y2Nlc3MiLCJtZXNzYWdlIiwiaXNPZmZsaW5lIiwiZGF0YSIsImN1c3RvbWVyQWN0aXZpdHlMb2dnZXIiLCJVUkkiLCJNT05HT09TRV9VUkkiLCJjb25uZWN0V2l0aFJldHJ5IiwicmV0cmllcyIsImRlbGF5IiwiaSIsImNvbm5lY3QiLCJzZXJ2ZXJTZWxlY3Rpb25UaW1lb3V0TVMiLCJzb2NrZXRUaW1lb3V0TVMiLCJjb25uZWN0VGltZW91dE1TIiwibWF4UG9vbFNpemUiLCJtaW5Qb29sU2l6ZSIsInJldHJ5V3JpdGVzIiwicmV0cnlSZWFkcyIsImVyciIsIlByb21pc2UiLCJyZXNvbHZlIiwic2V0VGltZW91dCIsIm9uIiwiYXV0aFJvdXRlcyIsImFkbWluQXV0aFJvdXRlcyIsImFkbWluUm91dGVzIiwiY2F0ZWdvcnlSb3V0ZXMiLCJzY3JhcGVyUm91dGVzIiwicHJvZHVjdHNSb3V0ZXMiLCJjYXJ0Um91dGVzIiwiY2hhdGJvdFJvdXRlcyIsInBheW1lbnRSb3V0ZXMiLCJvcmRlclJvdXRlcyIsImRhc2hib2FyZFJvdXRlcyIsInRpcHNSb3V0ZXMiLCJjb250YWN0Um91dGVzIiwibWVzc2FnZVJvdXRlcyIsInJldmlld1JvdXRlcyIsImNvdXBvblJvdXRlcyIsInNhdmVkVm91Y2hlclJvdXRlcyIsInJlcG9ydFJvdXRlcyIsInN5c3RlbVJvdXRlcyIsInN1cHBsaWVyUm91dGVzIiwiYnJhbmRSb3V0ZXMiLCJicmFuY2hSb3V0ZXMiLCJjdXN0b21lckxvZ1JvdXRlcyIsImdldCIsImdldEJlc3RTZWxsaW5nUHJvZHVjdHMiLCJyZXBvcnRzQ29udHJvbGxlciIsImdldERhc2hib2FyZFN0YXRzIiwiZ2V0UmV2ZW51ZURhdGEiLCJnZXRUb3BQcm9kdWN0cyIsImdldEludmVudG9yeURhdGEiLCJnZXRVc2VyRGF0YSIsImdldE9yZGVyRGF0YSIsImdldFByb21vdGlvbkRhdGEiLCJnZXRTeXN0ZW1BY3Rpdml0eURhdGEiLCJnZXREZWxpdmVyeURhdGEiLCJnZXRGZWVkYmFja0RhdGEiLCJ3ZWJob29rUGF0aHMiLCJwb3N0IiwiYm9keSIsImdhdGV3YXkiLCJ0cmFuc2ZlckFtb3VudCIsImhhbmRsZUJhbmtXZWJob29rIiwiaGFuZGxlU2VwYXlDYWxsYmFjayIsImhlYWRlcnNTZW50Iiwic3RhdHVzIiwiY29kZSIsImluY2x1ZGVzIiwidGltZXN0YW1wIiwiRGF0ZSIsInRvSVNPU3RyaW5nIiwiZW52aXJvbm1lbnQiLCJzY2hlZHVsZUV4cGlyZWRWb3VjaGVyQ2xlYW51cCIsImRlbGV0ZUV4cGlyZWRWb3VjaGVycyIsInRoZW4iLCJzY2hlZHVsZVByb2R1Y3RFeHBpcmF0aW9uQ2hlY2siLCJ1cGRhdGVQcm9kdWN0RXhwaXJhdGlvbnMiLCJyZXN1bHQiLCJzY2hlZHVsZUludGVydmFsSG91cnMiLCJzY2hlZHVsZUludGVydmFsIiwic3RhcnRTZXJ2ZXIiLCJwb3J0IiwicG9ydE51bWJlciIsInBhcnNlSW50IiwiaXNOYU4iLCJzZXJ2ZXIiLCJsaXN0ZW4iLCJzZXRJbnRlcnZhbCIsImV4aXQiLCJQT1JUIiwibWV0aG9kIiwia2V5Iiwib3JpZ2luYWxVcmwiLCJjYWNoZWRSZXNwb25zZSIsIm9yaWdpbmFsU2VuZCIsInNldCIsImNhbGwiXSwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXVuZGVmICovXG5pbXBvcnQgZXhwcmVzcyBmcm9tIFwiZXhwcmVzc1wiO1xuaW1wb3J0IGNvcnMgZnJvbSBcImNvcnNcIjtcbmltcG9ydCBjb29raWVQYXJzZXIgZnJvbSBcImNvb2tpZS1wYXJzZXJcIjtcbmltcG9ydCBtb25nb29zZSBmcm9tIFwibW9uZ29vc2VcIjtcbmltcG9ydCBkb3RlbnYgZnJvbSBcImRvdGVudlwiO1xuaW1wb3J0IGJvZHlQYXJzZXIgZnJvbSBcImJvZHktcGFyc2VyXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgZGVsZXRlRXhwaXJlZFZvdWNoZXJzIH0gZnJvbSBcIi4vQ29udHJvbGxlci9zYXZlZFZvdWNoZXJDb250cm9sbGVyLmpzXCI7XG5pbXBvcnQge1xuICBoYW5kbGVTZXBheUNhbGxiYWNrLFxuICBoYW5kbGVCYW5rV2ViaG9vayxcbn0gZnJvbSBcIi4vQ29udHJvbGxlci9wYXltZW50Q29udHJvbGxlci5qc1wiO1xuaW1wb3J0IHJlcG9ydHNDb250cm9sbGVyIGZyb20gXCIuL0NvbnRyb2xsZXIvcmVwb3J0c0NvbnRyb2xsZXIuanNcIjtcbmltcG9ydCBOb2RlQ2FjaGUgZnJvbSAnbm9kZS1jYWNoZSc7XG5cbi8vIEVTIG1vZHVsZXMgY29tcGF0aWJpbGl0eVxuLy8gLy8gU+G7rSBk4bulbmcgcHJvY2Vzcy5jd2QoKSB0aGF5IHbDrCBpbXBvcnQubWV0YS51cmxcbi8vIGNvbnN0IF9fZGlybmFtZSA9IHByb2Nlc3MuY3dkKCk7XG5cbi8vIEltcG9ydCBtb2RlbHMgYmVmb3JlIHJvdXRlc1xuaW1wb3J0IFwiLi9Nb2RlbC9SZXZpZXcuanNcIjtcbmltcG9ydCBcIi4vTW9kZWwvUmV2aWV3U3RhdHMuanNcIjtcbmltcG9ydCBcIi4vTW9kZWwvQ3VzdG9tZXJMb2cuanNcIjtcblxuaW1wb3J0IGF1dGhSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL2F1dGhSb3V0ZXMuanNcIjtcbmltcG9ydCBzY3JhcGVyUm91dGVzIGZyb20gXCIuL3JvdXRlcy9zY3JhcGVyUm91dGVzLmpzXCI7XG5pbXBvcnQgY2F0ZWdvcnlSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL2NhdGVnb3J5Um91dGVzLmpzXCI7XG5pbXBvcnQgcHJvZHVjdHNSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL3Byb2R1Y3RzUm91dGVzLmpzXCI7XG5pbXBvcnQgY2FydFJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvY2FydFJvdXRlcy5qc1wiO1xuaW1wb3J0IHsgY2hhdGJvdFJvdXRlcyB9IGZyb20gXCIuL3JvdXRlcy9jaGF0Ym90Um91dGVzLmpzXCI7XG5pbXBvcnQgcGF5bWVudFJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvcGF5bWVudFJvdXRlcy5qc1wiO1xuaW1wb3J0IG9yZGVyUm91dGVzIGZyb20gXCIuL3JvdXRlcy9vcmRlclJvdXRlcy5qc1wiO1xuaW1wb3J0IGFkbWluUm91dGVzIGZyb20gXCIuL3JvdXRlcy9hZG1pblJvdXRlcy5qc1wiO1xuaW1wb3J0IGFkbWluQXV0aFJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvYWRtaW5BdXRoUm91dGVzLmpzXCI7XG5pbXBvcnQgZGFzaGJvYXJkUm91dGVzIGZyb20gXCIuL3JvdXRlcy9kYXNoYm9hcmRSb3V0ZXMuanNcIjtcbmltcG9ydCB0aXBzUm91dGVzIGZyb20gXCIuL3JvdXRlcy90aXBzUm91dGVzLmpzXCI7XG5pbXBvcnQgY29udGFjdFJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvY29udGFjdFJvdXRlcy5qc1wiO1xuaW1wb3J0IG1lc3NhZ2VSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL21lc3NhZ2VSb3V0ZXMuanNcIjtcbmltcG9ydCByZXZpZXdSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL3Jldmlld1JvdXRlcy5qc1wiO1xuaW1wb3J0IGNvdXBvblJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvY291cG9uUm91dGVzLmpzXCI7XG5pbXBvcnQgc2F2ZWRWb3VjaGVyUm91dGVzIGZyb20gXCIuL3JvdXRlcy9zYXZlZFZvdWNoZXJSb3V0ZXMuanNcIjtcbmltcG9ydCByZXBvcnRSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL3JlcG9ydFJvdXRlcy5qc1wiO1xuaW1wb3J0IHN5c3RlbVJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvc3lzdGVtUm91dGVzLmpzXCI7XG5pbXBvcnQgc3VwcGxpZXJSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL3N1cHBsaWVyUm91dGVzLmpzXCI7XG5pbXBvcnQgYnJhbmRSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL2JyYW5kUm91dGVzLmpzXCI7XG5pbXBvcnQgYnJhbmNoUm91dGVzIGZyb20gXCIuL3JvdXRlcy9icmFuY2hSb3V0ZXMuanNcIjtcbmltcG9ydCBjdXN0b21lckxvZ1JvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvY3VzdG9tZXJMb2dSb3V0ZXMuanNcIjtcblxuLy8gSW1wb3J0IGN1c3RvbWVyIGxvZyBtaWRkbGV3YXJlXG5pbXBvcnQgeyBjdXN0b21lckFjdGl2aXR5TG9nZ2VyIH0gZnJvbSBcIi4vTWlkZGxld2FyZS9jdXN0b21lckxvZ01pZGRsZXdhcmUuanNcIjtcblxuLy8gSW1wb3J0IHNwZWNpZmljIGNvbnRyb2xsZXIgZm9yIGRpcmVjdCBlbmRwb2ludCBoYW5kbGluZ1xuaW1wb3J0IHsgZ2V0QmVzdFNlbGxpbmdQcm9kdWN0cyB9IGZyb20gXCIuL0NvbnRyb2xsZXIvcHJvZHVjdHNDb250cm9sbGVyLmpzXCI7XG5pbXBvcnQgeyB1cGRhdGVQcm9kdWN0RXhwaXJhdGlvbnMgfSBmcm9tIFwiLi9Db250cm9sbGVyL3Byb2R1Y3RzQ29udHJvbGxlci5qc1wiO1xuXG5kb3RlbnYuY29uZmlnKHsgcGF0aDogXCIuZW52XCIgfSk7XG5jb25zdCBhcHAgPSBleHByZXNzKCk7XG5cbi8vIFjDs2EgbW9kZWwgY2FjaGUgxJHhu4MgdHLDoW5oIGzhu5dpIE92ZXJ3cml0ZU1vZGVsRXJyb3Jcbk9iamVjdC5rZXlzKG1vbmdvb3NlLm1vZGVscykuZm9yRWFjaCgobW9kZWxOYW1lKSA9PiB7XG4gIGlmIChtb2RlbE5hbWUgPT09IFwiTWVzc2FnZXNcIiB8fCBtb2RlbE5hbWUgPT09IFwiQ29udmVyc2F0aW9uXCIpIHtcbiAgICBkZWxldGUgbW9uZ29vc2UubW9kZWxzW21vZGVsTmFtZV07XG4gIH1cbn0pO1xuXG4vLyBU4bqhbyBjYWNoZSB24bubaSB0aOG7nWkgZ2lhbiBz4buRbmcgNSBwaMO6dFxuY29uc3QgY2FjaGUgPSBuZXcgTm9kZUNhY2hlKHsgc3RkVFRMOiAzMDAgfSk7XG5cbmFwcC51c2UoXG4gIGNvcnMoe1xuICAgIG9yaWdpbjogW1xuICAgICAgXCJodHRwOi8vbG9jYWxob3N0OjMwMDBcIixcbiAgICAgIFwiaHR0cHM6Ly9xdWFubHl0aHVjcGhhbS52ZXJjZWwuYXBwXCIsXG4gICAgICBcImh0dHBzOi8vcXVhbmx5dGh1Y3BoYW0tdmVyY2VsLmFwcFwiLFxuICAgICAgXCJodHRwczovL3F1YW5seXRodWNwaGFtLWdpdC1tYWluLWtpdHMtcHJvamVjdHMudmVyY2VsLmFwcFwiLFxuICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiID8gXCIqXCIgOiBudWxsLFxuICAgIF0uZmlsdGVyKEJvb2xlYW4pLFxuICAgIGNyZWRlbnRpYWxzOiB0cnVlLFxuICAgIG1ldGhvZHM6IFtcIkdFVFwiLCBcIlBPU1RcIiwgXCJQVVRcIiwgXCJERUxFVEVcIiwgXCJQQVRDSFwiLCBcIk9QVElPTlNcIl0sXG4gICAgbWF4QWdlOiAzNjAwLFxuICB9KVxuKTtcblxuLy8gQWRkIGEgQ09SUyBwcmVmbGlnaHQgaGFuZGxlciBmb3IgT1BUSU9OUyByZXF1ZXN0c1xuYXBwLm9wdGlvbnMoXCIqXCIsIGNvcnMoKSk7XG5cbmFwcC51c2UoZXhwcmVzcy5qc29uKHsgbGltaXQ6IFwiNTBtYlwiIH0pKTtcbmFwcC51c2UoY29va2llUGFyc2VyKCkpO1xuYXBwLnVzZShib2R5UGFyc2VyLmpzb24oeyBsaW1pdDogXCI1MG1iXCIgfSkpO1xuYXBwLnVzZShib2R5UGFyc2VyLnVybGVuY29kZWQoeyBleHRlbmRlZDogdHJ1ZSwgbGltaXQ6IFwiNTBtYlwiIH0pKTtcblxuLy8gTWlkZGxld2FyZSBraeG7g20gdHJhIHRva2VuIHbDoCB0csOtY2ggeHXhuqV0IHRow7RuZyB0aW4gbmfGsOG7nWkgZMO5bmdcbmFwcC51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgYXV0aEhlYWRlciA9IHJlcS5oZWFkZXJzLmF1dGhvcml6YXRpb247XG4gICAgaWYgKGF1dGhIZWFkZXIgJiYgYXV0aEhlYWRlci5zdGFydHNXaXRoKFwiQmVhcmVyIFwiKSkge1xuICAgICAgY29uc3QgdG9rZW4gPSBhdXRoSGVhZGVyLnN1YnN0cmluZyg3KTtcbiAgICAgIGNvbnN0IGp3dCA9IHJlcXVpcmUoXCJqc29ud2VidG9rZW5cIik7XG4gICAgICBjb25zdCBzZWNyZXRLZXkgPSBwcm9jZXNzLmVudi5KV1RfU0VDUkVUIHx8IFwieW91ci1zZWNyZXQta2V5XCI7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGRlY29kZWQgPSBqd3QudmVyaWZ5KHRva2VuLCBzZWNyZXRLZXkpO1xuICAgICAgICByZXEudXNlciA9IGRlY29kZWQ7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAvLyBY4butIGzDvSB0b2tlbiBraMO0bmcgaOG7o3AgbOG7h1xuICAgICAgfVxuICAgIH1cbiAgICBuZXh0KCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbmV4dCgpO1xuICB9XG59KTtcblxuLy8gVGjDqm0gbWlkZGxld2FyZSBraeG7g20gdHJhIGvhur90IG7hu5FpIE1vbmdvREIgdHLGsOG7m2Mga2hpIHjhu60gbMO9IHJlcXVlc3RcbmFwcC51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gIGlmIChtb25nb29zZS5jb25uZWN0aW9uLnJlYWR5U3RhdGUgIT09IDEpIHtcbiAgICAvLyAwOiBkaXNjb25uZWN0ZWQsIDE6IGNvbm5lY3RlZCwgMjogY29ubmVjdGluZywgMzogZGlzY29ubmVjdGluZ1xuICAgIGNvbnNvbGUubG9nKFwiTW9uZ29EQiBub3QgY29ubmVjdGVkLCByZXR1cm5pbmcgY2FjaGVkIG9yIGZhbGxiYWNrIGRhdGFcIik7XG4gICAgXG4gICAgLy8gTuG6v3UgbMOgIHJlcXVlc3QgQVBJIHByb2R1Y3RzLCB0cuG6oyB24buBIGThu68gbGnhu4d1IG3huqt1XG4gICAgaWYgKHJlcS5wYXRoID09PSAnL2FwaS9wcm9kdWN0cycpIHtcbiAgICAgIHJldHVybiByZXMuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0aOG7gyBr4bq/dCBu4buRaSDEkeG6v24gY8ahIHPhu58gZOG7ryBsaeG7h3VcIixcbiAgICAgICAgaXNPZmZsaW5lOiB0cnVlLFxuICAgICAgICBkYXRhOiBbXSAvLyBIb+G6t2MgZOG7ryBsaeG7h3UgbeG6q3UvY2FjaGUgbuG6v3UgY8OzXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgLy8gQ8OhYyBBUEkga2jDoWNcbiAgICByZXR1cm4gbmV4dCgpO1xuICB9XG4gIG5leHQoKTtcbn0pO1xuXG4vLyBBZGQgY3VzdG9tZXIgYWN0aXZpdHkgbG9nZ2luZyBtaWRkbGV3YXJlXG5hcHAudXNlKGN1c3RvbWVyQWN0aXZpdHlMb2dnZXIpO1xuXG5jb25zdCBVUkkgPSBwcm9jZXNzLmVudi5NT05HT09TRV9VUkk7XG5cbmNvbnN0IGNvbm5lY3RXaXRoUmV0cnkgPSBhc3luYyAocmV0cmllcyA9IDUsIGRlbGF5ID0gNTAwMCkgPT4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHJldHJpZXM7IGkrKykge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBtb25nb29zZS5jb25uZWN0KFVSSSwge1xuICAgICAgICBzZXJ2ZXJTZWxlY3Rpb25UaW1lb3V0TVM6IDMwMDAwLFxuICAgICAgICBzb2NrZXRUaW1lb3V0TVM6IDQ1MDAwLFxuICAgICAgICBjb25uZWN0VGltZW91dE1TOiAzMDAwMCxcbiAgICAgICAgbWF4UG9vbFNpemU6IDEwLFxuICAgICAgICBtaW5Qb29sU2l6ZTogMSxcbiAgICAgICAgcmV0cnlXcml0ZXM6IHRydWUsXG4gICAgICAgIHJldHJ5UmVhZHM6IHRydWVcbiAgICAgIH0pO1xuICAgICAgY29uc29sZS5sb2coXCJNb25nb0RCIGNvbm5lY3RlZCBzdWNjZXNzZnVsbHlcIik7XG4gICAgICByZXR1cm47XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBDb25uZWN0aW9uIGF0dGVtcHQgJHtpICsgMX0gZmFpbGVkOmAsIGVycik7XG4gICAgICBpZiAoaSA8IHJldHJpZXMgLSAxKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBSZXRyeWluZyBpbiAke2RlbGF5IC8gMTAwMH0gc2Vjb25kcy4uLmApO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgZGVsYXkpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBjb25uZWN0IHRvIE1vbmdvREIgYWZ0ZXIgbXVsdGlwbGUgcmV0cmllc1wiKTtcbn07XG5cbmNvbm5lY3RXaXRoUmV0cnkoKTtcblxuLy8gVGjDqm0geOG7rSBsw70gY8OhYyBz4buxIGtp4buHbiBr4bq/dCBu4buRaVxubW9uZ29vc2UuY29ubmVjdGlvbi5vbignZXJyb3InLCAoZXJyKSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoJ01vbmdvREIgY29ubmVjdGlvbiBlcnJvcjonLCBlcnIpO1xufSk7XG5cbm1vbmdvb3NlLmNvbm5lY3Rpb24ub24oJ2Rpc2Nvbm5lY3RlZCcsICgpID0+IHtcbiAgY29uc29sZS5sb2coJ01vbmdvREIgZGlzY29ubmVjdGVkLCBhdHRlbXB0aW5nIHRvIHJlY29ubmVjdC4uLicpO1xuICAvLyBDw7MgdGjhu4MgdGjDqm0gbG9naWMgcmVjb25uZWN0IOG7nyDEkcOieSBu4bq/dSBj4bqnblxufSk7XG5cbmFwcC51c2UoXCIvYXV0aFwiLCBhdXRoUm91dGVzKTtcbmFwcC51c2UoXCIvYWRtaW4vYXV0aFwiLCBhZG1pbkF1dGhSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGlcIiwgYWRtaW5Sb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvY2F0ZWdvcmllc1wiLCBjYXRlZ29yeVJvdXRlcyk7XG5hcHAudXNlKFwiL2xvZ291dFwiLCBhdXRoUm91dGVzKTtcbmFwcC51c2UoXCIvYXBpXCIsIHNjcmFwZXJSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGlcIiwgcHJvZHVjdHNSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvY2FydFwiLCBjYXJ0Um91dGVzKTtcbmFwcC51c2UoXCIvYXBpL2NoYXRib3RcIiwgY2hhdGJvdFJvdXRlcyk7XG5hcHAudXNlKFwiL2FwaS9wYXltZW50c1wiLCBwYXltZW50Um91dGVzKTtcbmFwcC51c2UoXCIvYXBpL29yZGVyc1wiLCBvcmRlclJvdXRlcyk7XG5hcHAudXNlKFwiL2FwaS9kYXNoYm9hcmRcIiwgZGFzaGJvYXJkUm91dGVzKTtcbmFwcC51c2UoXCIvYXBpXCIsIHRpcHNSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvY29udGFjdFwiLCBjb250YWN0Um91dGVzKTtcbmFwcC51c2UoXCIvYXBpL21lc3NhZ2VzXCIsIG1lc3NhZ2VSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvcmV2aWV3c1wiLCByZXZpZXdSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvY291cG9uc1wiLCBjb3Vwb25Sb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvc2F2ZWQtdm91Y2hlcnNcIiwgc2F2ZWRWb3VjaGVyUm91dGVzKTtcbmFwcC51c2UoXCIvYXBpL3JlcG9ydHNcIiwgcmVwb3J0Um91dGVzKTtcbmFwcC51c2UoXCIvYXBpL3N5c3RlbVwiLCBzeXN0ZW1Sb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvc3VwcGxpZXJzXCIsIHN1cHBsaWVyUm91dGVzKTtcbmFwcC51c2UoXCIvYXBpL2JyYW5kc1wiLCBicmFuZFJvdXRlcyk7XG5hcHAudXNlKFwiL2FwaS9icmFuY2hlc1wiLCBicmFuY2hSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvbG9nc1wiLCBjdXN0b21lckxvZ1JvdXRlcyk7XG5hcHAuZ2V0KFwiL2FwaS9wcm9kdWN0cy9iZXN0LXNlbGxlcnNcIiwgZ2V0QmVzdFNlbGxpbmdQcm9kdWN0cyk7XG5hcHAuZ2V0KFwiL2FwaS9kYXNoYm9hcmQvc3RhdHNcIiwgcmVwb3J0c0NvbnRyb2xsZXIuZ2V0RGFzaGJvYXJkU3RhdHMpO1xuYXBwLmdldChcIi9hcGkvYW5hbHl0aWNzL3JldmVudWVcIiwgcmVwb3J0c0NvbnRyb2xsZXIuZ2V0UmV2ZW51ZURhdGEpO1xuYXBwLmdldChcIi9hcGkvYW5hbHl0aWNzL3RvcC1wcm9kdWN0c1wiLCByZXBvcnRzQ29udHJvbGxlci5nZXRUb3BQcm9kdWN0cyk7XG5hcHAuZ2V0KFwiL2FwaS9wcm9kdWN0cy9pbnZlbnRvcnlcIiwgcmVwb3J0c0NvbnRyb2xsZXIuZ2V0SW52ZW50b3J5RGF0YSk7XG5hcHAuZ2V0KFwiL2FwaS91c2Vycy9zdGF0c1wiLCByZXBvcnRzQ29udHJvbGxlci5nZXRVc2VyRGF0YSk7XG5hcHAuZ2V0KFwiL2FwaS9vcmRlcnMvc3RhdHNcIiwgcmVwb3J0c0NvbnRyb2xsZXIuZ2V0T3JkZXJEYXRhKTtcbmFwcC5nZXQoXCIvYXBpL2NvdXBvbnMvc3RhdHNcIiwgcmVwb3J0c0NvbnRyb2xsZXIuZ2V0UHJvbW90aW9uRGF0YSk7XG5hcHAuZ2V0KFwiL2FwaS9hZG1pbi9hY3Rpdml0eS1sb2dzXCIsIHJlcG9ydHNDb250cm9sbGVyLmdldFN5c3RlbUFjdGl2aXR5RGF0YSk7XG5hcHAuZ2V0KFwiL2FwaS9vcmRlcnMvZGVsaXZlcnktc3RhdHNcIiwgcmVwb3J0c0NvbnRyb2xsZXIuZ2V0RGVsaXZlcnlEYXRhKTtcbmFwcC5nZXQoXCIvYXBpL3Jldmlld3Mvc3RhdHNcIiwgcmVwb3J0c0NvbnRyb2xsZXIuZ2V0RmVlZGJhY2tEYXRhKTtcbmFwcC5nZXQoXCIvYXBpL3JlcG9ydHMvZGFzaGJvYXJkXCIsIHJlcG9ydHNDb250cm9sbGVyLmdldERhc2hib2FyZFN0YXRzKTtcbmFwcC5nZXQoXCIvYXBpL3JlcG9ydHMvcmV2ZW51ZVwiLCByZXBvcnRzQ29udHJvbGxlci5nZXRSZXZlbnVlRGF0YSk7XG5hcHAuZ2V0KFwiL2FwaS9yZXBvcnRzL3RvcC1wcm9kdWN0c1wiLCByZXBvcnRzQ29udHJvbGxlci5nZXRUb3BQcm9kdWN0cyk7XG5hcHAuZ2V0KFwiL2FwaS9yZXBvcnRzL2ludmVudG9yeVwiLCByZXBvcnRzQ29udHJvbGxlci5nZXRJbnZlbnRvcnlEYXRhKTtcbmFwcC5nZXQoXCIvYXBpL3JlcG9ydHMvdXNlcnNcIiwgcmVwb3J0c0NvbnRyb2xsZXIuZ2V0VXNlckRhdGEpO1xuYXBwLmdldChcIi9hcGkvcmVwb3J0cy9vcmRlcnNcIiwgcmVwb3J0c0NvbnRyb2xsZXIuZ2V0T3JkZXJEYXRhKTtcbmFwcC5nZXQoXCIvYXBpL3JlcG9ydHMvcHJvbW90aW9uc1wiLCByZXBvcnRzQ29udHJvbGxlci5nZXRQcm9tb3Rpb25EYXRhKTtcbmFwcC5nZXQoXCIvYXBpL3JlcG9ydHMvc3lzdGVtLWFjdGl2aXR5XCIsIHJlcG9ydHNDb250cm9sbGVyLmdldFN5c3RlbUFjdGl2aXR5RGF0YSk7XG5hcHAuZ2V0KFwiL2FwaS9yZXBvcnRzL2RlbGl2ZXJ5XCIsIHJlcG9ydHNDb250cm9sbGVyLmdldERlbGl2ZXJ5RGF0YSk7XG5hcHAuZ2V0KFwiL2FwaS9yZXBvcnRzL2ZlZWRiYWNrXCIsIHJlcG9ydHNDb250cm9sbGVyLmdldEZlZWRiYWNrRGF0YSk7XG5jb25zdCB3ZWJob29rUGF0aHMgPSBbXG4gIFwiL3dlYmhvb2tcIixcbiAgXCIvYXBpL3dlYmhvb2tcIixcbiAgXCIvYXBpL3dlYmhvb2svYmFua1wiLFxuICBcIi9hcGkvcGF5bWVudHMvd2ViaG9va1wiLFxuICBcIi9hcGkvcGF5bWVudHMvd2ViaG9vay9iYW5rXCIsXG4gIFwiL2FwaS9wYXltZW50cy9zZXBheS93ZWJob29rXCIsXG5dO1xuXG53ZWJob29rUGF0aHMuZm9yRWFjaCgocGF0aCkgPT4ge1xuICBhcHAucG9zdChwYXRoLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgICB0cnkge1xuICAgICAgaWYgKHJlcS5ib2R5LmdhdGV3YXkgPT09IFwiTUJCYW5rXCIgfHwgcmVxLmJvZHkudHJhbnNmZXJBbW91bnQpIHtcbiAgICAgICAgYXdhaXQgaGFuZGxlQmFua1dlYmhvb2socmVxLCByZXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgaGFuZGxlU2VwYXlDYWxsYmFjayhyZXEsIHJlcyk7XG4gICAgICB9XG5cbiAgICAgIGlmICghcmVzLmhlYWRlcnNTZW50KSB7XG4gICAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgIGNvZGU6IFwiMDBcIixcbiAgICAgICAgICBtZXNzYWdlOiBcIldlYmhvb2sgcHJvY2Vzc2VkIHN1Y2Nlc3NmdWxseVwiLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgaGFuZGxpbmcgd2ViaG9vayBhdCAke3BhdGh9OmAsIGVycm9yKTtcbiAgICAgIGlmICghcmVzLmhlYWRlcnNTZW50KSB7XG4gICAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgIGNvZGU6IFwiMDBcIixcbiAgICAgICAgICBtZXNzYWdlOiBcIldlYmhvb2sgcmVjZWl2ZWQgd2l0aCBlcnJvclwiLFxuICAgICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufSk7XG5cbmFwcC51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gIHRyeSB7XG4gICAgbmV4dCgpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJVbmNhdWdodCBlcnJvciBpbiByZXF1ZXN0OlwiLCBlcnJvcik7XG4gICAgaWYgKHJlcS5wYXRoLmluY2x1ZGVzKFwid2ViaG9va1wiKSB8fCByZXEucGF0aC5pbmNsdWRlcyhcIi9hcGkvcGF5bWVudHMvXCIpKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBjb2RlOiBcIjAwXCIsXG4gICAgICAgIG1lc3NhZ2U6IFwiUmVxdWVzdCByZWNlaXZlZCB3aXRoIHVuY2F1Z2h0IGVycm9yXCIsXG4gICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcbiAgICB9KTtcbiAgfVxufSk7XG5cbmFwcC5nZXQoXCIvaGVhbHRoXCIsIChyZXEsIHJlcykgPT4ge1xuICByZXMuanNvbih7XG4gICAgc3RhdHVzOiBcIm9rXCIsXG4gICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgZW52OiBwcm9jZXNzLmVudi5OT0RFX0VOViB8fCBcImRldmVsb3BtZW50XCIsXG4gIH0pO1xufSk7XG5cbmFwcC5nZXQoXCIvd2ViaG9va1wiLCAocmVxLCByZXMpID0+IHtcbiAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgbWVzc2FnZTogXCJTZVBheSB3ZWJob29rIGVuZHBvaW50IGlzIGFjdGl2ZVwiLFxuICAgIGVudmlyb25tZW50OiBwcm9jZXNzLmVudi5OT0RFX0VOViB8fCBcImRldmVsb3BtZW50XCIsXG4gIH0pO1xufSk7XG5cbmFwcC5wb3N0KFwiL3dlYmhvb2tcIiwgKHJlcSwgcmVzKSA9PiB7XG4gIGNvbnNvbGUubG9nKFwiUmVjZWl2ZWQgZGlyZWN0IHdlYmhvb2sgUE9TVDpcIiwgcmVxLmJvZHkpO1xuICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgc3VjY2VzczogdHJ1ZSxcbiAgICBjb2RlOiBcIjAwXCIsXG4gICAgbWVzc2FnZTogXCJXZWJob29rIHJlY2VpdmVkIHN1Y2Nlc3NmdWxseVwiLFxuICB9KTtcbn0pO1xuXG5jb25zdCBzY2hlZHVsZUV4cGlyZWRWb3VjaGVyQ2xlYW51cCA9ICgpID0+IHtcbiAgdHJ5IHtcbiAgICBkZWxldGVFeHBpcmVkVm91Y2hlcnMoKS50aGVuKCgpID0+IHtcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgaW4gc2NoZWR1bGVkIGV4cGlyZWQgdm91Y2hlciBjbGVhbnVwOlwiLCBlcnJvcik7XG4gIH1cbn07XG5cbi8vIELhuq90IMSR4bqndSBs4buLY2ggeMOzYSB2b3VjaGVyIGjhur90IGjhuqFuXG5zY2hlZHVsZUV4cGlyZWRWb3VjaGVyQ2xlYW51cCgpO1xuXG4vLyBIw6BtIGtp4buDbSB0cmEgc+G6o24gcGjhuqltIGjhur90IGjhuqFuXG5jb25zdCBzY2hlZHVsZVByb2R1Y3RFeHBpcmF0aW9uQ2hlY2sgPSAoKSA9PiB7XG4gIHRyeSB7XG4gICAgLy8gUmVtb3ZlZCBjb25zb2xlLmxvZyBmb3IgcHJvZHVjdCBleHBpcmF0aW9uIGNoZWNrXG4gICAgdXBkYXRlUHJvZHVjdEV4cGlyYXRpb25zKCkudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAvLyBSZW1vdmVkIGNvbnNvbGUubG9nIGZvciBwcm9kdWN0IGV4cGlyYXRpb24gcmVzdWx0c1xuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBpbiBzY2hlZHVsZWQgcHJvZHVjdCBleHBpcmF0aW9uIGNoZWNrOlwiLCBlcnJvcik7XG4gIH1cbn07XG5cbi8vIFRow6ptIGPDtG5nIHZp4buHYyDEkeG7i25oIGvhu7MgxJHhu4Mga2nhu4NtIHRyYSB2w6AgY+G6rXAgbmjhuq10IGjhuqFuIHPhuqNuIHBo4bqpbVxuLy8gQ2jhuqF5IG3hu5dpIDYgZ2nhu51cbmNvbnN0IHNjaGVkdWxlSW50ZXJ2YWxIb3VycyA9IDY7XG5jb25zdCBzY2hlZHVsZUludGVydmFsID0gc2NoZWR1bGVJbnRlcnZhbEhvdXJzICogNjAgKiA2MCAqIDEwMDA7IC8vIENvbnZlcnQgaG91cnMgdG8gbWlsbGlzZWNvbmRzXG5cbi8vIEto4bufaSDEkeG7mW5nIHNlcnZlciB24bubaSBjxqEgY2jhur8geOG7rSBsw70gbOG7l2kgY+G7lW5nXG5jb25zdCBzdGFydFNlcnZlciA9IChwb3J0KSA9PiB7XG4gIC8vIMSQ4bqjbSBi4bqjbyBwb3J0IGzDoCBz4buRIHbDoCB0cm9uZyBwaOG6oW0gdmkgaOG7o3AgbOG7h1xuICBjb25zdCBwb3J0TnVtYmVyID0gcGFyc2VJbnQocG9ydCwgMTApO1xuICBpZiAoaXNOYU4ocG9ydE51bWJlcikpIHtcbiAgICBwb3J0ID0gODA4MDtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3Qgc2VydmVyID0gYXBwLmxpc3Rlbihwb3J0LCAoKSA9PiB7XG4gICAgICAvLyBSZW1vdmVkIGNvbnNvbGUubG9nIGZvciBzZXJ2ZXIgcnVubmluZ1xuXG4gICAgICAvLyBTY2hlZHVsZSBjbGVhbnVwIG9mIGV4cGlyZWQgdm91Y2hlcnNcbiAgICAgIHNjaGVkdWxlRXhwaXJlZFZvdWNoZXJDbGVhbnVwKCk7IC8vIFJ1biBvbmNlIGF0IHN0YXJ0dXBcblxuICAgICAgLy8gU2NoZWR1bGUgY2hlY2sgZm9yIHByb2R1Y3QgZXhwaXJhdGlvbnNcbiAgICAgIHNjaGVkdWxlUHJvZHVjdEV4cGlyYXRpb25DaGVjaygpOyAvLyBSdW4gb25jZSBhdCBzdGFydHVwXG5cbiAgICAgIC8vIFNldCB1cCBpbnRlcnZhbCB0byBydW4gY2xlYW51cCBhbmQgY2hlY2tzIHBlcmlvZGljYWxseVxuICAgICAgc2V0SW50ZXJ2YWwoc2NoZWR1bGVFeHBpcmVkVm91Y2hlckNsZWFudXAsIHNjaGVkdWxlSW50ZXJ2YWwpO1xuICAgICAgc2V0SW50ZXJ2YWwoc2NoZWR1bGVQcm9kdWN0RXhwaXJhdGlvbkNoZWNrLCBzY2hlZHVsZUludGVydmFsKTtcblxuICAgICAgLy8gUmVtb3ZlZCBjb25zb2xlLmxvZyBmb3Igc2NoZWR1bGVkIHRhc2tzXG4gICAgfSk7XG5cbiAgICBzZXJ2ZXIub24oXCJlcnJvclwiLCAoZXJyb3IpID0+IHtcbiAgICAgIGlmIChlcnJvci5jb2RlID09PSBcIkVBRERSSU5VU0VcIikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgIGBQb3J0ICR7cG9ydH0gaXMgYWxyZWFkeSBpbiB1c2UuIFBsZWFzZSBjbG9zZSB0aGUgYXBwbGljYXRpb25zIHVzaW5nIHRoaXMgcG9ydCBhbmQgdHJ5IGFnYWluLmBcbiAgICAgICAgKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlNlcnZlciBlcnJvcjpcIiwgZXJyb3IpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIHN0YXJ0aW5nIHNlcnZlcjpcIiwgZXJyb3IpO1xuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfVxufTtcblxuLy8gS2jhu59pIMSR4buZbmcgc2VydmVyXG5jb25zdCBwb3J0ID0gcHJvY2Vzcy5lbnYuUE9SVCB8fCA4MDgwO1xuc3RhcnRTZXJ2ZXIocG9ydCk7XG5cbi8vIE1pZGRsZXdhcmUgc+G7rSBk4bulbmcgY2FjaGUgY2hvIGPDoWMgcmVxdWVzdCBHRVRcbmFwcC51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gIGlmIChyZXEubWV0aG9kICE9PSAnR0VUJykgcmV0dXJuIG5leHQoKTtcbiAgXG4gIGNvbnN0IGtleSA9IHJlcS5vcmlnaW5hbFVybDtcbiAgY29uc3QgY2FjaGVkUmVzcG9uc2UgPSBjYWNoZS5nZXQoa2V5KTtcbiAgXG4gIGlmIChjYWNoZWRSZXNwb25zZSkge1xuICAgIGNvbnNvbGUubG9nKGBTZXJ2aW5nIGZyb20gY2FjaGU6ICR7a2V5fWApO1xuICAgIHJldHVybiByZXMuanNvbihjYWNoZWRSZXNwb25zZSk7XG4gIH1cbiAgXG4gIC8vIEzGsHUgcmVzcG9uc2UgZ+G7kWNcbiAgY29uc3Qgb3JpZ2luYWxTZW5kID0gcmVzLmpzb247XG4gIHJlcy5qc29uID0gZnVuY3Rpb24oYm9keSkge1xuICAgIGNhY2hlLnNldChrZXksIGJvZHkpO1xuICAgIG9yaWdpbmFsU2VuZC5jYWxsKHRoaXMsIGJvZHkpO1xuICB9O1xuICBcbiAgbmV4dCgpO1xufSk7XG5cbi8vIEFQSSBoZWFsdGggY2hlY2tcbmFwcC5nZXQoJy9hcGkvaGVhbHRoJywgKHJlcSwgcmVzKSA9PiB7XG4gIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgc3RhdHVzOiAnb2snLCBcbiAgICBtZXNzYWdlOiAnU2VydmVyIGlzIHJ1bm5pbmcnLFxuICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gIH0pO1xufSk7XG4iXSwibWFwcGluZ3MiOiI7O0FBRUEsSUFBQUEsUUFBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsS0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsYUFBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsU0FBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksT0FBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUssV0FBQSxHQUFBTixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU0sS0FBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU8sdUJBQUEsR0FBQVAsT0FBQTtBQUNBLElBQUFRLGtCQUFBLEdBQUFSLE9BQUE7Ozs7QUFJQSxJQUFBUyxrQkFBQSxHQUFBVixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVUs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