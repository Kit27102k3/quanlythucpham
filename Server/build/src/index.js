"use strict";
var _express = _interopRequireDefault(require("express"));
var _cors = _interopRequireDefault(require("cors"));
var _cookieParser = _interopRequireDefault(require("cookie-parser"));
var _mongoose = _interopRequireDefault(require("mongoose"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _nodeFetch = _interopRequireDefault(require("node-fetch"));
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));

var _savedVoucherController = require("./Controller/savedVoucherController.js");
var _paymentController = require("./Controller/paymentController.js");



var _reportsController = _interopRequireDefault(require("./Controller/reportsController.js"));
var _productsController = require("./Controller/productsController.js");








require("./Model/Review.js");
require("./Model/ReviewStats.js");









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
var _brandRoutes = _interopRequireDefault(require("./routes/brandRoutes.js"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };} /* eslint-disable no-undef */ // Load env variables
_dotenv.default.config({ path: ".env" }); // Import models to avoid OverwriteModelError
// Clear model cache for specific models to avoid overwrite errors on hot reloads
["Messages", "Conversation"].forEach((model) => {if (_mongoose.default.models[model]) {delete _mongoose.default.models[model];}}); // Import routes
const app = (0, _express.default)(); // CORS configuration
const allowedOrigins = [
"http://localhost:3000",
"https://quanlythucpham.vercel.app",
"https://quanlythucpham-vercel.app",
"https://quanlythucpham-git-main-kits-projects.vercel.app",
"https://quanlythucpham-azf6-cvjbbij6u-kit27102k3s-projects.vercel.app",
"https://*.vercel.app" // Cho phép tất cả subdomain của vercel.app
];

app.use(
  (0, _cors.default)({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (như mobile apps)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        console.log('CORS blocked for origin:', origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    maxAge: 3600
  })
);

// Middleware for JSON and URL encoded bodies (50mb limit)
app.use(_express.default.json({ limit: "50mb" }));
app.use(_express.default.urlencoded({ extended: true, limit: "50mb" }));
app.use((0, _cookieParser.default)());

// JWT Authentication middleware
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== null && authHeader !== void 0 && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const secretKey = process.env.JWT_SECRET_ACCESS;

    if (!secretKey) {
      console.error("JWT_SECRET is not defined in environment variables");
      return next();
    }

    try {
      const decoded = _jsonwebtoken.default.verify(token, secretKey);
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

// MongoDB connection
const URI = process.env.MONGODB_URI || process.env.MONGOOSE_URI;
const mongooseOptions = {
  serverSelectionTimeoutMS: 60000,
  socketTimeoutMS: 90000,
  connectTimeoutMS: 60000,
  retryWrites: true,
  retryReads: true,
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 60000,
  waitQueueTimeoutMS: 60000,
  heartbeatFrequencyMS: 10000,
  family: 4
};

// Hàm kết nối MongoDB với retry logic
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await _mongoose.default.connect(URI, mongooseOptions);
      console.log("MongoDB Connected Successfully");
      console.log("MongoDB Connection Info:", {
        host: _mongoose.default.connection.host,
        port: _mongoose.default.connection.port,
        dbName: _mongoose.default.connection.name,
        readyState: _mongoose.default.connection.readyState,
        env: process.env.NODE_ENV
      });
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, err);

      if (err.name === "MongooseServerSelectionError") {var _err$reason;
        console.error({
          uri: URI ? URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@") : "URI is undefined",
          message: err.message,
          reason: (_err$reason = err.reason) === null || _err$reason === void 0 ? void 0 : _err$reason.message,
          code: err.code,
          env: process.env.NODE_ENV
        });
      }

      if (i === retries - 1) {
        console.error("Max retries reached. Could not connect to MongoDB.");
        process.exit(1);
      }

      console.log(`Retrying in ${delay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Xử lý các sự kiện kết nối
_mongoose.default.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
  if (err.name === "MongooseServerSelectionError") {
    console.error(
      "IP whitelist issue detected. Please check MongoDB Atlas IP whitelist settings."
    );
  }
});

_mongoose.default.connection.on("disconnected", () => {
  console.log("MongoDB disconnected. Attempting to reconnect...");
  connectWithRetry();
});

_mongoose.default.connection.on("reconnected", () => {
  console.log("MongoDB reconnected successfully");
});

// Khởi tạo kết nối
connectWithRetry();

// Register API routes
app.use("/auth", _authRoutes.default);
app.use("/admin/auth", _adminAuthRoutes.default);
app.use("/api", _adminRoutes.default);
app.use("/api/categories", _categoryRoutes.default);
app.use("/api", _scraperRoutes.default);
app.use("/api", _productsRoutes.default);
app.use("/api/cart", _cartRoutes.default);
app.use("/api/chatbot", _chatbotRoutes.chatbotRoutes);
app.use("/api/payments", _paymentRoutes.default);
app.use("/orders", _orderRoutes.default);
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

// Direct product best sellers endpoint
app.get("/api/products/best-sellers", _productsController.getBestSellingProducts);

// Reports endpoints registration (mapping path -> handler)
const reportEndpoints = {
  "/api/dashboard/stats": _reportsController.default.getDashboardStats,
  "/api/analytics/revenue": _reportsController.default.getRevenueData,
  "/api/analytics/top-products": _reportsController.default.getTopProducts,
  "/api/products/inventory": _reportsController.default.getInventoryData,
  "/api/users/stats": _reportsController.default.getUserData,
  "/api/orders/stats": _reportsController.default.getOrderData,
  "/api/coupons/stats": _reportsController.default.getPromotionData,
  "/api/admin/activity-logs": _reportsController.default.getSystemActivityData,
  "/api/orders/delivery-stats": _reportsController.default.getDeliveryData,
  "/api/reviews/stats": _reportsController.default.getFeedbackData
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
    console.error("Webhook error:", error);
    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        code: "00",
        message: "Webhook received with error",
        error: error.message
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
"/api/payments/sepay/webhook"].
forEach((path) => app.post(path, webhookHandler));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development"
  });
});

// Middleware to catch unhandled requests (404)
app.use((req, res, next) => {
  // Chỉ xử lý nếu headersSent = false, tránh lỗi khi response đã được gửi
  if (!res.headersSent) {
    res.status(404).json({
      success: false,
      message: `Cannot ${req.method} ${req.url}`
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
  const path = (req === null || req === void 0 ? void 0 : req.path) || '';

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
      error: err.message
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message
  });
});

// Scheduled tasks
const scheduleIntervalHours = 6;
const scheduleIntervalMs = scheduleIntervalHours * 60 * 60 * 1000;

const runScheduledTasks = async () => {
  try {
    await Promise.all([(0, _savedVoucherController.deleteExpiredVouchers)(), (0, _productsController.updateProductExpirations)()]);
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
        error_message: "Missing address"
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        status: "REQUEST_DENIED",
        error_message: "Missing Google Maps API key"
      });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&region=vn&language=vi&key=${apiKey}`;

    const response = await (0, _nodeFetch.default)(url);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Geocoding error:", error);
    res.status(500).json({
      status: "ERROR",
      error_message: error.message
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
  });
};

startServer(process.env.PORT);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZXhwcmVzcyIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwiX2NvcnMiLCJfY29va2llUGFyc2VyIiwiX21vbmdvb3NlIiwiX2RvdGVudiIsIl9ub2RlRmV0Y2giLCJfanNvbndlYnRva2VuIiwiX3NhdmVkVm91Y2hlckNvbnRyb2xsZXIiLCJfcGF5bWVudENvbnRyb2xsZXIiLCJfcmVwb3J0c0NvbnRyb2xsZXIiLCJfcHJvZHVjdHNDb250cm9sbGVyIiwiX2F1dGhSb3V0ZXMiLCJfc2NyYXBlclJvdXRlcyIsIl9jYXRlZ29yeVJvdXRlcyIsIl9wcm9kdWN0c1JvdXRlcyIsIl9jYXJ0Um91dGVzIiwiX2NoYXRib3RSb3V0ZXMiLCJfcGF5bWVudFJvdXRlcyIsIl9vcmRlclJvdXRlcyIsIl9hZG1pblJvdXRlcyIsIl9hZG1pbkF1dGhSb3V0ZXMiLCJfZGFzaGJvYXJkUm91dGVzIiwiX3RpcHNSb3V0ZXMiLCJfY29udGFjdFJvdXRlcyIsIl9tZXNzYWdlUm91dGVzIiwiX3Jldmlld1JvdXRlcyIsIl9jb3Vwb25Sb3V0ZXMiLCJfc2F2ZWRWb3VjaGVyUm91dGVzIiwiX3JlcG9ydFJvdXRlcyIsIl9zeXN0ZW1Sb3V0ZXMiLCJfc3VwcGxpZXJSb3V0ZXMiLCJfYnJhbmRSb3V0ZXMiLCJlIiwiX19lc01vZHVsZSIsImRlZmF1bHQiLCJkb3RlbnYiLCJjb25maWciLCJwYXRoIiwiZm9yRWFjaCIsIm1vZGVsIiwibW9uZ29vc2UiLCJtb2RlbHMiLCJhcHAiLCJleHByZXNzIiwiYWxsb3dlZE9yaWdpbnMiLCJ1c2UiLCJjb3JzIiwib3JpZ2luIiwiY2FsbGJhY2siLCJpbmNsdWRlcyIsImVuZHNXaXRoIiwicHJvY2VzcyIsImVudiIsIk5PREVfRU5WIiwiY29uc29sZSIsImxvZyIsIkVycm9yIiwiY3JlZGVudGlhbHMiLCJtZXRob2RzIiwibWF4QWdlIiwianNvbiIsImxpbWl0IiwidXJsZW5jb2RlZCIsImV4dGVuZGVkIiwiY29va2llUGFyc2VyIiwicmVxIiwicmVzIiwibmV4dCIsImF1dGhIZWFkZXIiLCJoZWFkZXJzIiwiYXV0aG9yaXphdGlvbiIsInN0YXJ0c1dpdGgiLCJ0b2tlbiIsInN1YnN0cmluZyIsInNlY3JldEtleSIsIkpXVF9TRUNSRVRfQUNDRVNTIiwiZXJyb3IiLCJkZWNvZGVkIiwiand0IiwidmVyaWZ5IiwidXNlciIsIm5hbWUiLCJ3YXJuIiwibWVzc2FnZSIsIlVSSSIsIk1PTkdPREJfVVJJIiwiTU9OR09PU0VfVVJJIiwibW9uZ29vc2VPcHRpb25zIiwic2VydmVyU2VsZWN0aW9uVGltZW91dE1TIiwic29ja2V0VGltZW91dE1TIiwiY29ubmVjdFRpbWVvdXRNUyIsInJldHJ5V3JpdGVzIiwicmV0cnlSZWFkcyIsIm1heFBvb2xTaXplIiwibWluUG9vbFNpemUiLCJtYXhJZGxlVGltZU1TIiwid2FpdFF1ZXVlVGltZW91dE1TIiwiaGVhcnRiZWF0RnJlcXVlbmN5TVMiLCJmYW1pbHkiLCJjb25uZWN0V2l0aFJldHJ5IiwicmV0cmllcyIsImRlbGF5IiwiaSIsImNvbm5lY3QiLCJob3N0IiwiY29ubmVjdGlvbiIsInBvcnQiLCJkYk5hbWUiLCJyZWFkeVN0YXRlIiwiZXJyIiwiX2VyciRyZWFzb24iLCJ1cmkiLCJyZXBsYWNlIiwicmVhc29uIiwiY29kZSIsImV4aXQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInNldFRpbWVvdXQiLCJvbiIsImF1dGhSb3V0ZXMiLCJhZG1pbkF1dGhSb3V0ZXMiLCJhZG1pblJvdXRlcyIsImNhdGVnb3J5Um91dGVzIiwic2NyYXBlclJvdXRlcyIsInByb2R1Y3RzUm91dGVzIiwiY2FydFJvdXRlcyIsImNoYXRib3RSb3V0ZXMiLCJwYXltZW50Um91dGVzIiwib3JkZXJSb3V0ZXMiLCJkYXNoYm9hcmRSb3V0ZXMiLCJ0aXBzUm91dGVzIiwiY29udGFjdFJvdXRlcyIsIm1lc3NhZ2VSb3V0ZXMiLCJyZXZpZXdSb3V0ZXMiLCJjb3Vwb25Sb3V0ZXMiLCJzYXZlZFZvdWNoZXJSb3V0ZXMiLCJyZXBvcnRSb3V0ZXMiLCJzeXN0ZW1Sb3V0ZXMiLCJzdXBwbGllclJvdXRlcyIsImJyYW5kUm91dGVzIiwiZ2V0IiwiZ2V0QmVzdFNlbGxpbmdQcm9kdWN0cyIsInJlcG9ydEVuZHBvaW50cyIsInJlcG9ydHNDb250cm9sbGVyIiwiZ2V0RGFzaGJvYXJkU3RhdHMiLCJnZXRSZXZlbnVlRGF0YSIsImdldFRvcFByb2R1Y3RzIiwiZ2V0SW52ZW50b3J5RGF0YSIsImdldFVzZXJEYXRhIiwiZ2V0T3JkZXJEYXRhIiwiZ2V0UHJvbW90aW9uRGF0YSIsImdldFN5c3RlbUFjdGl2aXR5RGF0YSIsImdldERlbGl2ZXJ5RGF0YSIsImdldEZlZWRiYWNrRGF0YSIsImhhbmRsZXIiLCJPYmplY3QiLCJlbnRyaWVzIiwid2ViaG9va0hhbmRsZXIiLCJib2R5IiwiZ2F0ZXdheSIsInRyYW5zZmVyQW1vdW50IiwiaGFuZGxlQmFua1dlYmhvb2siLCJoYW5kbGVTZXBheUNhbGxiYWNrIiwiaGVhZGVyc1NlbnQiLCJzdGF0dXMiLCJzdWNjZXNzIiwicG9zdCIsInRpbWVzdGFtcCIsIkRhdGUiLCJ0b0lTT1N0cmluZyIsIm1ldGhvZCIsInVybCIsInNjaGVkdWxlSW50ZXJ2YWxIb3VycyIsInNjaGVkdWxlSW50ZXJ2YWxNcyIsInJ1blNjaGVkdWxlZFRhc2tzIiwiYWxsIiwiZGVsZXRlRXhwaXJlZFZvdWNoZXJzIiwidXBkYXRlUHJvZHVjdEV4cGlyYXRpb25zIiwiYWRkcmVzcyIsInF1ZXJ5IiwiZXJyb3JfbWVzc2FnZSIsImFwaUtleSIsIkdPT0dMRV9NQVBTX0FQSV9LRVkiLCJlbmNvZGVVUklDb21wb25lbnQiLCJyZXNwb25zZSIsImZldGNoIiwiZGF0YSIsInN0YXJ0U2VydmVyIiwicG9ydE51bWJlciIsIk51bWJlciIsImxpc3RlbiIsInNldEludGVydmFsIiwiUE9SVCJdLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlZiAqL1xuaW1wb3J0IGV4cHJlc3MgZnJvbSBcImV4cHJlc3NcIjtcbmltcG9ydCBjb3JzIGZyb20gXCJjb3JzXCI7XG5pbXBvcnQgY29va2llUGFyc2VyIGZyb20gXCJjb29raWUtcGFyc2VyXCI7XG5pbXBvcnQgbW9uZ29vc2UgZnJvbSBcIm1vbmdvb3NlXCI7XG5pbXBvcnQgZG90ZW52IGZyb20gXCJkb3RlbnZcIjtcbmltcG9ydCBmZXRjaCBmcm9tIFwibm9kZS1mZXRjaFwiO1xuaW1wb3J0IGp3dCBmcm9tIFwianNvbndlYnRva2VuXCI7XG5cbmltcG9ydCB7IGRlbGV0ZUV4cGlyZWRWb3VjaGVycyB9IGZyb20gXCIuL0NvbnRyb2xsZXIvc2F2ZWRWb3VjaGVyQ29udHJvbGxlci5qc1wiO1xuaW1wb3J0IHtcbiAgaGFuZGxlU2VwYXlDYWxsYmFjayxcbiAgaGFuZGxlQmFua1dlYmhvb2ssXG59IGZyb20gXCIuL0NvbnRyb2xsZXIvcGF5bWVudENvbnRyb2xsZXIuanNcIjtcbmltcG9ydCByZXBvcnRzQ29udHJvbGxlciBmcm9tIFwiLi9Db250cm9sbGVyL3JlcG9ydHNDb250cm9sbGVyLmpzXCI7XG5pbXBvcnQge1xuICBnZXRCZXN0U2VsbGluZ1Byb2R1Y3RzLFxuICB1cGRhdGVQcm9kdWN0RXhwaXJhdGlvbnMsXG59IGZyb20gXCIuL0NvbnRyb2xsZXIvcHJvZHVjdHNDb250cm9sbGVyLmpzXCI7XG5cbi8vIExvYWQgZW52IHZhcmlhYmxlc1xuZG90ZW52LmNvbmZpZyh7IHBhdGg6IFwiLmVudlwiIH0pO1xuXG4vLyBJbXBvcnQgbW9kZWxzIHRvIGF2b2lkIE92ZXJ3cml0ZU1vZGVsRXJyb3JcbmltcG9ydCBcIi4vTW9kZWwvUmV2aWV3LmpzXCI7XG5pbXBvcnQgXCIuL01vZGVsL1Jldmlld1N0YXRzLmpzXCI7XG5cbi8vIENsZWFyIG1vZGVsIGNhY2hlIGZvciBzcGVjaWZpYyBtb2RlbHMgdG8gYXZvaWQgb3ZlcndyaXRlIGVycm9ycyBvbiBob3QgcmVsb2Fkc1xuW1wiTWVzc2FnZXNcIiwgXCJDb252ZXJzYXRpb25cIl0uZm9yRWFjaCgobW9kZWwpID0+IHtcbiAgaWYgKG1vbmdvb3NlLm1vZGVsc1ttb2RlbF0pIHtcbiAgICBkZWxldGUgbW9uZ29vc2UubW9kZWxzW21vZGVsXTtcbiAgfVxufSk7XG5cbi8vIEltcG9ydCByb3V0ZXNcbmltcG9ydCBhdXRoUm91dGVzIGZyb20gXCIuL3JvdXRlcy9hdXRoUm91dGVzLmpzXCI7XG5pbXBvcnQgc2NyYXBlclJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvc2NyYXBlclJvdXRlcy5qc1wiO1xuaW1wb3J0IGNhdGVnb3J5Um91dGVzIGZyb20gXCIuL3JvdXRlcy9jYXRlZ29yeVJvdXRlcy5qc1wiO1xuaW1wb3J0IHByb2R1Y3RzUm91dGVzIGZyb20gXCIuL3JvdXRlcy9wcm9kdWN0c1JvdXRlcy5qc1wiO1xuaW1wb3J0IGNhcnRSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL2NhcnRSb3V0ZXMuanNcIjtcbmltcG9ydCB7IGNoYXRib3RSb3V0ZXMgfSBmcm9tIFwiLi9yb3V0ZXMvY2hhdGJvdFJvdXRlcy5qc1wiO1xuaW1wb3J0IHBheW1lbnRSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL3BheW1lbnRSb3V0ZXMuanNcIjtcbmltcG9ydCBvcmRlclJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvb3JkZXJSb3V0ZXMuanNcIjtcbmltcG9ydCBhZG1pblJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvYWRtaW5Sb3V0ZXMuanNcIjtcbmltcG9ydCBhZG1pbkF1dGhSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL2FkbWluQXV0aFJvdXRlcy5qc1wiO1xuaW1wb3J0IGRhc2hib2FyZFJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvZGFzaGJvYXJkUm91dGVzLmpzXCI7XG5pbXBvcnQgdGlwc1JvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvdGlwc1JvdXRlcy5qc1wiO1xuaW1wb3J0IGNvbnRhY3RSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL2NvbnRhY3RSb3V0ZXMuanNcIjtcbmltcG9ydCBtZXNzYWdlUm91dGVzIGZyb20gXCIuL3JvdXRlcy9tZXNzYWdlUm91dGVzLmpzXCI7XG5pbXBvcnQgcmV2aWV3Um91dGVzIGZyb20gXCIuL3JvdXRlcy9yZXZpZXdSb3V0ZXMuanNcIjtcbmltcG9ydCBjb3Vwb25Sb3V0ZXMgZnJvbSBcIi4vcm91dGVzL2NvdXBvblJvdXRlcy5qc1wiO1xuaW1wb3J0IHNhdmVkVm91Y2hlclJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvc2F2ZWRWb3VjaGVyUm91dGVzLmpzXCI7XG5pbXBvcnQgcmVwb3J0Um91dGVzIGZyb20gXCIuL3JvdXRlcy9yZXBvcnRSb3V0ZXMuanNcIjtcbmltcG9ydCBzeXN0ZW1Sb3V0ZXMgZnJvbSBcIi4vcm91dGVzL3N5c3RlbVJvdXRlcy5qc1wiO1xuaW1wb3J0IHN1cHBsaWVyUm91dGVzIGZyb20gXCIuL3JvdXRlcy9zdXBwbGllclJvdXRlcy5qc1wiO1xuaW1wb3J0IGJyYW5kUm91dGVzIGZyb20gXCIuL3JvdXRlcy9icmFuZFJvdXRlcy5qc1wiO1xuXG5jb25zdCBhcHAgPSBleHByZXNzKCk7XG5cbi8vIENPUlMgY29uZmlndXJhdGlvblxuY29uc3QgYWxsb3dlZE9yaWdpbnMgPSBbXG4gICAgICBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiLCBcbiAgICAgIFwiaHR0cHM6Ly9xdWFubHl0aHVjcGhhbS52ZXJjZWwuYXBwXCIsIFxuICAgICAgXCJodHRwczovL3F1YW5seXRodWNwaGFtLXZlcmNlbC5hcHBcIixcbiAgICAgIFwiaHR0cHM6Ly9xdWFubHl0aHVjcGhhbS1naXQtbWFpbi1raXRzLXByb2plY3RzLnZlcmNlbC5hcHBcIixcbiAgXCJodHRwczovL3F1YW5seXRodWNwaGFtLWF6ZjYtY3ZqYmJpajZ1LWtpdDI3MTAyazNzLXByb2plY3RzLnZlcmNlbC5hcHBcIixcbiAgXCJodHRwczovLyoudmVyY2VsLmFwcFwiIC8vIENobyBwaMOpcCB04bqldCBj4bqjIHN1YmRvbWFpbiBj4bunYSB2ZXJjZWwuYXBwXG5dO1xuXG5hcHAudXNlKFxuICBjb3JzKHtcbiAgICBvcmlnaW46IChvcmlnaW4sIGNhbGxiYWNrKSA9PiB7XG4gICAgICAvLyBDaG8gcGjDqXAgcmVxdWVzdHMga2jDtG5nIGPDsyBvcmlnaW4gKG5oxrAgbW9iaWxlIGFwcHMpXG4gICAgICBpZiAoIW9yaWdpbikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgdHJ1ZSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmIChhbGxvd2VkT3JpZ2lucy5pbmNsdWRlcyhvcmlnaW4pIHx8IFxuICAgICAgICAgIG9yaWdpbi5lbmRzV2l0aCgnLnZlcmNlbC5hcHAnKSB8fCBcbiAgICAgICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHtcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgdHJ1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygnQ09SUyBibG9ja2VkIGZvciBvcmlnaW46Jywgb3JpZ2luKTtcbiAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKFwiTm90IGFsbG93ZWQgYnkgQ09SU1wiKSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBjcmVkZW50aWFsczogdHJ1ZSxcbiAgICBtZXRob2RzOiBbXCJHRVRcIiwgXCJQT1NUXCIsIFwiUFVUXCIsIFwiREVMRVRFXCIsIFwiUEFUQ0hcIiwgXCJPUFRJT05TXCJdLFxuICAgIG1heEFnZTogMzYwMCxcbiAgfSlcbik7XG5cbi8vIE1pZGRsZXdhcmUgZm9yIEpTT04gYW5kIFVSTCBlbmNvZGVkIGJvZGllcyAoNTBtYiBsaW1pdClcbmFwcC51c2UoZXhwcmVzcy5qc29uKHsgbGltaXQ6IFwiNTBtYlwiIH0pKTtcbmFwcC51c2UoZXhwcmVzcy51cmxlbmNvZGVkKHsgZXh0ZW5kZWQ6IHRydWUsIGxpbWl0OiBcIjUwbWJcIiB9KSk7XG5hcHAudXNlKGNvb2tpZVBhcnNlcigpKTtcblxuLy8gSldUIEF1dGhlbnRpY2F0aW9uIG1pZGRsZXdhcmVcbmFwcC51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgY29uc3QgYXV0aEhlYWRlciA9IHJlcS5oZWFkZXJzLmF1dGhvcml6YXRpb247XG4gIGlmIChhdXRoSGVhZGVyPy5zdGFydHNXaXRoKFwiQmVhcmVyIFwiKSkge1xuICAgICAgY29uc3QgdG9rZW4gPSBhdXRoSGVhZGVyLnN1YnN0cmluZyg3KTtcbiAgICBjb25zdCBzZWNyZXRLZXkgPSBwcm9jZXNzLmVudi5KV1RfU0VDUkVUX0FDQ0VTUztcblxuICAgIGlmICghc2VjcmV0S2V5KSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiSldUX1NFQ1JFVCBpcyBub3QgZGVmaW5lZCBpbiBlbnZpcm9ubWVudCB2YXJpYWJsZXNcIik7XG4gICAgICByZXR1cm4gbmV4dCgpO1xuICAgIH1cbiAgICAgIFxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZGVjb2RlZCA9IGp3dC52ZXJpZnkodG9rZW4sIHNlY3JldEtleSk7XG4gICAgICAgIHJlcS51c2VyID0gZGVjb2RlZDtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBDaOG7iSBsb2cgbOG7l2kgbuG6v3Uga2jDtG5nIHBo4bqjaSBs4buXaSB0b2tlbiBo4bq/dCBo4bqhblxuICAgICAgaWYgKGVycm9yLm5hbWUgIT09ICdUb2tlbkV4cGlyZWRFcnJvcicpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiSW52YWxpZCBKV1QgdG9rZW46XCIsIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBuZXh0KCk7XG59KTtcblxuLy8gTW9uZ29EQiBjb25uZWN0aW9uXG5jb25zdCBVUkkgPSBwcm9jZXNzLmVudi5NT05HT0RCX1VSSSB8fCBwcm9jZXNzLmVudi5NT05HT09TRV9VUkk7XG5jb25zdCBtb25nb29zZU9wdGlvbnMgPSB7XG4gIHNlcnZlclNlbGVjdGlvblRpbWVvdXRNUzogNjAwMDAsXG4gIHNvY2tldFRpbWVvdXRNUzogOTAwMDAsXG4gIGNvbm5lY3RUaW1lb3V0TVM6IDYwMDAwLFxuICByZXRyeVdyaXRlczogdHJ1ZSxcbiAgcmV0cnlSZWFkczogdHJ1ZSxcbiAgbWF4UG9vbFNpemU6IDUwLFxuICBtaW5Qb29sU2l6ZTogMTAsXG4gIG1heElkbGVUaW1lTVM6IDYwMDAwLFxuICB3YWl0UXVldWVUaW1lb3V0TVM6IDYwMDAwLFxuICBoZWFydGJlYXRGcmVxdWVuY3lNUzogMTAwMDAsXG4gIGZhbWlseTogNFxufTtcblxuLy8gSMOgbSBr4bq/dCBu4buRaSBNb25nb0RCIHbhu5tpIHJldHJ5IGxvZ2ljXG5jb25zdCBjb25uZWN0V2l0aFJldHJ5ID0gYXN5bmMgKHJldHJpZXMgPSA1LCBkZWxheSA9IDUwMDApID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXRyaWVzOyBpKyspIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgbW9uZ29vc2UuY29ubmVjdChVUkksIG1vbmdvb3NlT3B0aW9ucyk7XG4gICAgICBjb25zb2xlLmxvZyhcIk1vbmdvREIgQ29ubmVjdGVkIFN1Y2Nlc3NmdWxseVwiKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiTW9uZ29EQiBDb25uZWN0aW9uIEluZm86XCIsIHtcbiAgICAgICAgaG9zdDogbW9uZ29vc2UuY29ubmVjdGlvbi5ob3N0LFxuICAgICAgICBwb3J0OiBtb25nb29zZS5jb25uZWN0aW9uLnBvcnQsXG4gICAgICAgIGRiTmFtZTogbW9uZ29vc2UuY29ubmVjdGlvbi5uYW1lLFxuICAgICAgICByZWFkeVN0YXRlOiBtb25nb29zZS5jb25uZWN0aW9uLnJlYWR5U3RhdGUsXG4gICAgICAgIGVudjogcHJvY2Vzcy5lbnYuTk9ERV9FTlZcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihgTW9uZ29EQiBjb25uZWN0aW9uIGF0dGVtcHQgJHtpICsgMX0gZmFpbGVkOmAsIGVycik7XG4gICAgICBcbiAgICAgIGlmIChlcnIubmFtZSA9PT0gXCJNb25nb29zZVNlcnZlclNlbGVjdGlvbkVycm9yXCIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcih7XG4gICAgICAgICAgdXJpOiBVUkkgPyBVUkkucmVwbGFjZSgvXFwvXFwvW146XSs6W15AXStALywgXCIvLyoqKjoqKipAXCIpIDogXCJVUkkgaXMgdW5kZWZpbmVkXCIsXG4gICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UsXG4gICAgICAgICAgcmVhc29uOiBlcnIucmVhc29uPy5tZXNzYWdlLFxuICAgICAgICAgIGNvZGU6IGVyci5jb2RlLFxuICAgICAgICAgIGVudjogcHJvY2Vzcy5lbnYuTk9ERV9FTlZcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChpID09PSByZXRyaWVzIC0gMSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiTWF4IHJldHJpZXMgcmVhY2hlZC4gQ291bGQgbm90IGNvbm5lY3QgdG8gTW9uZ29EQi5cIik7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coYFJldHJ5aW5nIGluICR7ZGVsYXkvMTAwMH0gc2Vjb25kcy4uLmApO1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIGRlbGF5KSk7XG4gICAgfVxuICB9XG59O1xuXG4vLyBY4butIGzDvSBjw6FjIHPhu7Ega2nhu4duIGvhur90IG7hu5FpXG5tb25nb29zZS5jb25uZWN0aW9uLm9uKFwiZXJyb3JcIiwgKGVycikgPT4ge1xuICBjb25zb2xlLmVycm9yKFwiTW9uZ29EQiBjb25uZWN0aW9uIGVycm9yOlwiLCBlcnIpO1xuICBpZiAoZXJyLm5hbWUgPT09IFwiTW9uZ29vc2VTZXJ2ZXJTZWxlY3Rpb25FcnJvclwiKSB7XG4gICAgY29uc29sZS5lcnJvcihcbiAgICAgIFwiSVAgd2hpdGVsaXN0IGlzc3VlIGRldGVjdGVkLiBQbGVhc2UgY2hlY2sgTW9uZ29EQiBBdGxhcyBJUCB3aGl0ZWxpc3Qgc2V0dGluZ3MuXCJcbiAgICApO1xuICB9XG59KTtcblxubW9uZ29vc2UuY29ubmVjdGlvbi5vbihcImRpc2Nvbm5lY3RlZFwiLCAoKSA9PiB7XG4gIGNvbnNvbGUubG9nKFwiTW9uZ29EQiBkaXNjb25uZWN0ZWQuIEF0dGVtcHRpbmcgdG8gcmVjb25uZWN0Li4uXCIpO1xuICBjb25uZWN0V2l0aFJldHJ5KCk7XG59KTtcblxubW9uZ29vc2UuY29ubmVjdGlvbi5vbihcInJlY29ubmVjdGVkXCIsICgpID0+IHtcbiAgY29uc29sZS5sb2coXCJNb25nb0RCIHJlY29ubmVjdGVkIHN1Y2Nlc3NmdWxseVwiKTtcbn0pO1xuXG4vLyBLaOG7n2kgdOG6oW8ga+G6v3QgbuG7kWlcbmNvbm5lY3RXaXRoUmV0cnkoKTtcblxuLy8gUmVnaXN0ZXIgQVBJIHJvdXRlc1xuYXBwLnVzZShcIi9hdXRoXCIsIGF1dGhSb3V0ZXMpO1xuYXBwLnVzZShcIi9hZG1pbi9hdXRoXCIsIGFkbWluQXV0aFJvdXRlcyk7XG5hcHAudXNlKFwiL2FwaVwiLCBhZG1pblJvdXRlcyk7XG5hcHAudXNlKFwiL2FwaS9jYXRlZ29yaWVzXCIsIGNhdGVnb3J5Um91dGVzKTtcbmFwcC51c2UoXCIvYXBpXCIsIHNjcmFwZXJSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGlcIiwgcHJvZHVjdHNSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvY2FydFwiLCBjYXJ0Um91dGVzKTtcbmFwcC51c2UoXCIvYXBpL2NoYXRib3RcIiwgY2hhdGJvdFJvdXRlcyk7XG5hcHAudXNlKFwiL2FwaS9wYXltZW50c1wiLCBwYXltZW50Um91dGVzKTtcbmFwcC51c2UoXCIvb3JkZXJzXCIsIG9yZGVyUm91dGVzKTtcbmFwcC51c2UoXCIvYXBpL2Rhc2hib2FyZFwiLCBkYXNoYm9hcmRSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGlcIiwgdGlwc1JvdXRlcyk7XG5hcHAudXNlKFwiL2FwaS9jb250YWN0XCIsIGNvbnRhY3RSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvbWVzc2FnZXNcIiwgbWVzc2FnZVJvdXRlcyk7XG5hcHAudXNlKFwiL2FwaS9yZXZpZXdzXCIsIHJldmlld1JvdXRlcyk7XG5hcHAudXNlKFwiL2FwaS9jb3Vwb25zXCIsIGNvdXBvblJvdXRlcyk7XG5hcHAudXNlKFwiL2FwaS9zYXZlZC12b3VjaGVyc1wiLCBzYXZlZFZvdWNoZXJSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvcmVwb3J0c1wiLCByZXBvcnRSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvc3lzdGVtXCIsIHN5c3RlbVJvdXRlcyk7XG5hcHAudXNlKFwiL2FwaS9zdXBwbGllcnNcIiwgc3VwcGxpZXJSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvYnJhbmRzXCIsIGJyYW5kUm91dGVzKTtcblxuLy8gRGlyZWN0IHByb2R1Y3QgYmVzdCBzZWxsZXJzIGVuZHBvaW50XG5hcHAuZ2V0KFwiL2FwaS9wcm9kdWN0cy9iZXN0LXNlbGxlcnNcIiwgZ2V0QmVzdFNlbGxpbmdQcm9kdWN0cyk7XG5cbi8vIFJlcG9ydHMgZW5kcG9pbnRzIHJlZ2lzdHJhdGlvbiAobWFwcGluZyBwYXRoIC0+IGhhbmRsZXIpXG5jb25zdCByZXBvcnRFbmRwb2ludHMgPSB7XG4gIFwiL2FwaS9kYXNoYm9hcmQvc3RhdHNcIjogcmVwb3J0c0NvbnRyb2xsZXIuZ2V0RGFzaGJvYXJkU3RhdHMsXG4gIFwiL2FwaS9hbmFseXRpY3MvcmV2ZW51ZVwiOiByZXBvcnRzQ29udHJvbGxlci5nZXRSZXZlbnVlRGF0YSxcbiAgXCIvYXBpL2FuYWx5dGljcy90b3AtcHJvZHVjdHNcIjogcmVwb3J0c0NvbnRyb2xsZXIuZ2V0VG9wUHJvZHVjdHMsXG4gIFwiL2FwaS9wcm9kdWN0cy9pbnZlbnRvcnlcIjogcmVwb3J0c0NvbnRyb2xsZXIuZ2V0SW52ZW50b3J5RGF0YSxcbiAgXCIvYXBpL3VzZXJzL3N0YXRzXCI6IHJlcG9ydHNDb250cm9sbGVyLmdldFVzZXJEYXRhLFxuICBcIi9hcGkvb3JkZXJzL3N0YXRzXCI6IHJlcG9ydHNDb250cm9sbGVyLmdldE9yZGVyRGF0YSxcbiAgXCIvYXBpL2NvdXBvbnMvc3RhdHNcIjogcmVwb3J0c0NvbnRyb2xsZXIuZ2V0UHJvbW90aW9uRGF0YSxcbiAgXCIvYXBpL2FkbWluL2FjdGl2aXR5LWxvZ3NcIjogcmVwb3J0c0NvbnRyb2xsZXIuZ2V0U3lzdGVtQWN0aXZpdHlEYXRhLFxuICBcIi9hcGkvb3JkZXJzL2RlbGl2ZXJ5LXN0YXRzXCI6IHJlcG9ydHNDb250cm9sbGVyLmdldERlbGl2ZXJ5RGF0YSxcbiAgXCIvYXBpL3Jldmlld3Mvc3RhdHNcIjogcmVwb3J0c0NvbnRyb2xsZXIuZ2V0RmVlZGJhY2tEYXRhLFxufTtcblxuLy8gUmVnaXN0ZXIgcmVwb3J0IGVuZHBvaW50cyBhbmQgdGhlaXIgYWxpYXNlcyB1bmRlciAvYXBpL3JlcG9ydHNcbmZvciAoY29uc3QgW3BhdGgsIGhhbmRsZXJdIG9mIE9iamVjdC5lbnRyaWVzKHJlcG9ydEVuZHBvaW50cykpIHtcbiAgYXBwLmdldChwYXRoLCBoYW5kbGVyKTtcbiAgYXBwLmdldChgL2FwaS9yZXBvcnRzJHtwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCBcIlwiKX1gLCBoYW5kbGVyKTtcbn1cblxuLy8gV2ViaG9vayBoYW5kbGVyIGZ1bmN0aW9uXG5jb25zdCB3ZWJob29rSGFuZGxlciA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGlmIChyZXEuYm9keS5nYXRld2F5ID09PSBcIk1CQmFua1wiIHx8IHJlcS5ib2R5LnRyYW5zZmVyQW1vdW50KSB7XG4gICAgICAgIGF3YWl0IGhhbmRsZUJhbmtXZWJob29rKHJlcSwgcmVzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IGhhbmRsZVNlcGF5Q2FsbGJhY2socmVxLCByZXMpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXJlcy5oZWFkZXJzU2VudCkge1xuICAgICAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICBjb2RlOiBcIjAwXCIsXG4gICAgICAgICAgbWVzc2FnZTogXCJXZWJob29rIHByb2Nlc3NlZCBzdWNjZXNzZnVsbHlcIixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiV2ViaG9vayBlcnJvcjpcIiwgZXJyb3IpO1xuICAgICAgaWYgKCFyZXMuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgY29kZTogXCIwMFwiLFxuICAgICAgICAgIG1lc3NhZ2U6IFwiV2ViaG9vayByZWNlaXZlZCB3aXRoIGVycm9yXCIsXG4gICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG59O1xuXG4vLyBSZWdpc3RlciB3ZWJob29rIHJvdXRlc1xuW1xuICBcIi93ZWJob29rXCIsXG4gIFwiL2FwaS93ZWJob29rXCIsXG4gIFwiL2FwaS93ZWJob29rL2JhbmtcIixcbiAgXCIvYXBpL3BheW1lbnRzL3dlYmhvb2tcIixcbiAgXCIvYXBpL3BheW1lbnRzL3dlYmhvb2svYmFua1wiLFxuICBcIi9hcGkvcGF5bWVudHMvc2VwYXkvd2ViaG9va1wiLFxuXS5mb3JFYWNoKChwYXRoKSA9PiBhcHAucG9zdChwYXRoLCB3ZWJob29rSGFuZGxlcikpO1xuXG4vLyBIZWFsdGggY2hlY2sgZW5kcG9pbnRcbmFwcC5nZXQoXCIvaGVhbHRoXCIsIChyZXEsIHJlcykgPT4ge1xuICByZXMuanNvbih7XG4gICAgc3RhdHVzOiBcIm9rXCIsXG4gICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgZW52OiBwcm9jZXNzLmVudi5OT0RFX0VOViB8fCBcImRldmVsb3BtZW50XCIsXG4gIH0pO1xufSk7XG5cbi8vIE1pZGRsZXdhcmUgdG8gY2F0Y2ggdW5oYW5kbGVkIHJlcXVlc3RzICg0MDQpXG5hcHAudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAvLyBDaOG7iSB44butIGzDvSBu4bq/dSBoZWFkZXJzU2VudCA9IGZhbHNlLCB0csOhbmggbOG7l2kga2hpIHJlc3BvbnNlIMSRw6MgxJHGsOG7o2MgZ+G7rWlcbiAgaWYgKCFyZXMuaGVhZGVyc1NlbnQpIHtcbiAgICByZXMuc3RhdHVzKDQwNCkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IGBDYW5ub3QgJHtyZXEubWV0aG9kfSAke3JlcS51cmx9YCxcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICAvLyBO4bq/dSBoZWFkZXJzIMSRw6MgxJHGsOG7o2MgZ+G7rWksIGNo4buJIGfhu41pIG5leHQgduG7m2kgbOG7l2kgKG7hur91IGPDsylcbiAgICBuZXh0KCk7XG4gIH1cbn0pO1xuXG4vLyBHbG9iYWwgZXJyb3IgaGFuZGxpbmcgbWlkZGxld2FyZVxuYXBwLnVzZSgoZXJyLCByZXEsIHJlcykgPT4ge1xuICBjb25zb2xlLmVycm9yKFwiR2xvYmFsIGVycm9yOlwiLCBlcnIpO1xuXG4gIC8vIEtp4buDbSB0cmEgcmVxLnBhdGggdOG7k24gdOG6oWkgdHLGsOG7m2Mga2hpIHPhu60gZOG7pW5nXG4gIGNvbnN0IHBhdGggPSByZXE/LnBhdGggfHwgJyc7XG5cbiAgLy8gS2nhu4NtIHRyYSByZXMgbMOgIMSR4buRaSB0xrDhu6NuZyByZXNwb25zZSBo4bujcCBs4buHXG4gIGlmICghcmVzIHx8IHR5cGVvZiByZXMuc3RhdHVzICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkludmFsaWQgRXhwcmVzcyByZXNwb25zZSBvYmplY3QgaW4gZXJyb3IgaGFuZGxlci5cIik7XG4gICAgLy8gVMO5eSBjaOG7jW46IGxvZyB0aMOqbSB0aMO0bmcgdGluIGRlYnVnIHbhu4EgcmVxIHbDoCBlcnJcbiAgICAvLyBjb25zb2xlLmxvZygnUmVxdWVzdCBkZXRhaWxzOicsIHJlcSk7XG4gICAgLy8gY29uc29sZS5sb2coJ0Vycm9yIGRldGFpbHM6JywgZXJyKTtcbiAgICAvLyBL4bq/dCB0aMO6YyByZXF1ZXN0IG3hu5l0IGPDoWNoIGFuIHRvw6BuIG7hur91IGPDsyB0aOG7gywgaG/hurdjIHJlLXRocm93IGzhu5dpXG4gICAgLy8gxJDhu4MgxJHGoW4gZ2nhuqNuLCB0YSBz4bq9IGxvZyB2w6AgY8OzIHRo4buDIMSR4buDIHJlcXVlc3QgdGltZW91dCBob+G6t2MgdHLhuqMgduG7gSBs4buXaSBjaHVuZyB0w7l5IGPhuqV1IGjDrG5oIHNlcnZlcmxlc3NcbiAgICAvLyBUcm9uZyBtw7RpIHRyxrDhu51uZyBzZXJ2ZXJsZXNzLCB0aMaw4budbmcga2jDtG5nIGPDsyBzZXJ2ZXIub24oJ2Vycm9yJykgbmjGsCBzZXJ2ZXIgdHJ1eeG7gW4gdGjhu5FuZ1xuICAgIC8vIEzhu5dpIOG7nyDEkcOieSBjw7MgdGjhu4MgZG8gY29udGV4dCBraMO0bmcgxJHDum5nXG4gICAgcmV0dXJuOyAvLyBUaG/DoXQga2jhu49pIG1pZGRsZXdhcmUgxJHhu4MgdHLDoW5oIGzhu5dpIHRow6ptXG4gIH1cblxuICBpZiAocGF0aC5pbmNsdWRlcyhcIndlYmhvb2tcIikgfHwgcGF0aC5pbmNsdWRlcyhcIi9hcGkvcGF5bWVudHMvXCIpKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICBzdWNjZXNzOiB0cnVlLFxuICAgIGNvZGU6IFwiMDBcIixcbiAgICAgIG1lc3NhZ2U6IFwiUmVxdWVzdCByZWNlaXZlZCB3aXRoIGVycm9yXCIsXG4gICAgICBlcnJvcjogZXJyLm1lc3NhZ2UsXG4gICAgfSk7XG4gIH1cblxuICByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgc3VjY2VzczogZmFsc2UsXG4gICAgbWVzc2FnZTogXCJJbnRlcm5hbCBzZXJ2ZXIgZXJyb3JcIixcbiAgICBlcnJvcjogZXJyLm1lc3NhZ2UsXG4gIH0pO1xufSk7XG5cbi8vIFNjaGVkdWxlZCB0YXNrc1xuY29uc3Qgc2NoZWR1bGVJbnRlcnZhbEhvdXJzID0gNjtcbmNvbnN0IHNjaGVkdWxlSW50ZXJ2YWxNcyA9IHNjaGVkdWxlSW50ZXJ2YWxIb3VycyAqIDYwICogNjAgKiAxMDAwO1xuXG5jb25zdCBydW5TY2hlZHVsZWRUYXNrcyA9IGFzeW5jICgpID0+IHtcbiAgdHJ5IHtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChbZGVsZXRlRXhwaXJlZFZvdWNoZXJzKCksIHVwZGF0ZVByb2R1Y3RFeHBpcmF0aW9ucygpXSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIlNjaGVkdWxlZCB0YXNrIGVycm9yOlwiLCBlcnJvcik7XG4gIH1cbn07XG5cbi8vIEdvb2dsZSBNYXBzIEdlb2NvZGluZyBBUEkgcHJveHkgZW5kcG9pbnRcbmFwcC5nZXQoXCIvYXBpL2dlb2NvZGVcIiwgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBhZGRyZXNzIH0gPSByZXEucXVlcnk7XG4gICAgaWYgKCFhZGRyZXNzKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBzdGF0dXM6IFwiWkVST19SRVNVTFRTXCIsXG4gICAgICAgIGVycm9yX21lc3NhZ2U6IFwiTWlzc2luZyBhZGRyZXNzXCIsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBhcGlLZXkgPSBwcm9jZXNzLmVudi5HT09HTEVfTUFQU19BUElfS0VZO1xuICAgIGlmICghYXBpS2V5KSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgICBzdGF0dXM6IFwiUkVRVUVTVF9ERU5JRURcIixcbiAgICAgICAgZXJyb3JfbWVzc2FnZTogXCJNaXNzaW5nIEdvb2dsZSBNYXBzIEFQSSBrZXlcIixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHVybCA9IGBodHRwczovL21hcHMuZ29vZ2xlYXBpcy5jb20vbWFwcy9hcGkvZ2VvY29kZS9qc29uP2FkZHJlc3M9JHtlbmNvZGVVUklDb21wb25lbnQoXG4gICAgICBhZGRyZXNzXG4gICAgKX0mcmVnaW9uPXZuJmxhbmd1YWdlPXZpJmtleT0ke2FwaUtleX1gO1xuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG5cbiAgICByZXMuanNvbihkYXRhKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiR2VvY29kaW5nIGVycm9yOlwiLCBlcnJvcik7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgc3RhdHVzOiBcIkVSUk9SXCIsXG4gICAgICBlcnJvcl9tZXNzYWdlOiBlcnJvci5tZXNzYWdlLFxuICAgIH0pO1xuICB9XG59KTtcblxuLy8gU3RhcnQgc2VydmVyIGZ1bmN0aW9uXG5jb25zdCBzdGFydFNlcnZlciA9IChwb3J0KSA9PiB7XG4gIGNvbnN0IHBvcnROdW1iZXIgPSBOdW1iZXIocG9ydCkgfHwgODA4MDtcblxuICBhcHAubGlzdGVuKHBvcnROdW1iZXIsIGFzeW5jICgpID0+IHtcbiAgICBjb25zb2xlLmxvZyhgU2VydmVyIHJ1bm5pbmcgb24gcG9ydCAke3BvcnROdW1iZXJ9YCk7XG5cbiAgICAvLyBSdW4gc2NoZWR1bGVkIHRhc2tzIGltbWVkaWF0ZWx5IG9uIHN0YXJ0XG4gICAgYXdhaXQgcnVuU2NoZWR1bGVkVGFza3MoKTtcblxuICAgIC8vIFNjaGVkdWxlIHBlcmlvZGljIHRhc2tzXG4gICAgc2V0SW50ZXJ2YWwocnVuU2NoZWR1bGVkVGFza3MsIHNjaGVkdWxlSW50ZXJ2YWxNcyk7XG4gIH0pO1xufTtcblxuc3RhcnRTZXJ2ZXIocHJvY2Vzcy5lbnYuUE9SVCk7XG4iXSwibWFwcGluZ3MiOiI7QUFDQSxJQUFBQSxRQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxLQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxhQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFB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