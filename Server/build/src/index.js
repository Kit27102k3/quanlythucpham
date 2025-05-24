"use strict";
var _express = _interopRequireDefault(require("express"));
var _cors = _interopRequireDefault(require("cors"));
var _cookieParser = _interopRequireDefault(require("cookie-parser"));
var _mongoose = _interopRequireDefault(require("mongoose"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _nodeFetch = _interopRequireDefault(require("node-fetch"));
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _dns = _interopRequireDefault(require("dns"));

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
var _brandRoutes = _interopRequireDefault(require("./routes/brandRoutes.js"));
var _apiRoutes = _interopRequireDefault(require("./routes/apiRoutes.js"));


var _database = require("./config/database.js");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };} /* eslint-disable no-undef */ // Load env variables
_dotenv.default.config({ path: ".env" }); // Import models to avoid OverwriteModelError
// Clear model cache for specific models to avoid overwrite errors on hot reloads
["Messages", "Conversation"].forEach((model) => {if (_mongoose.default.models[model]) {delete _mongoose.default.models[model];}}); // Import routes
// Import database config mới
const app = (0, _express.default)(); // CORS configuration
app.use((0, _cors.default)({
  origin: "*", // Cho phép tất cả các origin 
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Access-Token", "Accept", "Origin"]
})
);

// Middleware for JSON and URL encoded bodies (50mb limit)
app.use(_express.default.json({ limit: "50mb" }));
app.use(_express.default.urlencoded({ extended: true, limit: "50mb" }));
app.use((0, _cookieParser.default)());

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

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - User Agent: ${req.headers['user-agent']}`);
  next();
});

// Middleware kiểm tra kết nối DB trước khi xử lý request cần DB
const checkDbConnection = (req, res, next) => {
  // Danh sách các endpoint không cần kết nối DB
  const noDbEndpoints = ['/health', '/debug', '/favicon.ico', '/', '/maintenance.html'];

  if (_database.isMongoConnected || noDbEndpoints.includes(req.path)) {
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

// Áp dụng middleware kiểm tra DB cho tất cả các request
app.use(checkDbConnection);

// Khởi tạo kết nối đến database
(0, _database.initializeDatabase)().then(() => {
  console.log("Database initialization completed");
}).catch((err) => {
  console.error("Failed to initialize database:", err);
  console.log("Server will run in fallback mode");
});

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
app.use('/api/db', _apiRoutes.default);

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

// Enhanced health check endpoint
app.get("/health", (req, res) => {
  const dbStatus = (0, _database.getConnectionStatus)();

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
    mongoConnection: dbStatus.isConnected ? "connected" : "disconnected",
    mongoReadyState: _mongoose.default.connection.readyState,
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
      host: _mongoose.default.connection.host,
      port: _mongoose.default.connection.port,
      name: _mongoose.default.connection.name,
      readyState: _mongoose.default.connection.readyState
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
        memoryUsage: process.memoryUsage()
      },
      mongoose: {
        version: _mongoose.default.version,
        connectionState: _mongoose.default.connection.readyState,
        connectionParams: {
          host: _mongoose.default.connection.host,
          port: _mongoose.default.connection.port,
          name: _mongoose.default.connection.name
        }
      },
      request: {
        ip: req.ip,
        ips: req.ips,
        headers: req.headers,
        userAgent: req.get('User-Agent')
      },
      network: {
        dnsServers: _dns.default.getServers()
      }
    };

    // Thử resolve địa chỉ MongoDB Atlas
    try {
      const mainHost = 'cluster0.ahfbtwd.mongodb.net';
      const dnsLookupPromise = new Promise((resolve, reject) => {
        _dns.default.lookup(mainHost, (err, address) => {
          if (err) reject(err);else
          resolve(address);
        });
      });

      const dnsResolvePromise = new Promise((resolve, reject) => {
        _dns.default.resolve(mainHost, (err, addresses) => {
          if (err) reject(err);else
          resolve(addresses);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZXhwcmVzcyIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwiX2NvcnMiLCJfY29va2llUGFyc2VyIiwiX21vbmdvb3NlIiwiX2RvdGVudiIsIl9ub2RlRmV0Y2giLCJfanNvbndlYnRva2VuIiwiX2RucyIsIl9zYXZlZFZvdWNoZXJDb250cm9sbGVyIiwiX3BheW1lbnRDb250cm9sbGVyIiwiX3JlcG9ydHNDb250cm9sbGVyIiwiX3Byb2R1Y3RzQ29udHJvbGxlciIsIl9hdXRoUm91dGVzIiwiX3NjcmFwZXJSb3V0ZXMiLCJfY2F0ZWdvcnlSb3V0ZXMiLCJfcHJvZHVjdHNSb3V0ZXMiLCJfY2FydFJvdXRlcyIsIl9jaGF0Ym90Um91dGVzIiwiX3BheW1lbnRSb3V0ZXMiLCJfb3JkZXJSb3V0ZXMiLCJfYWRtaW5Sb3V0ZXMiLCJfYWRtaW5BdXRoUm91dGVzIiwiX2Rhc2hib2FyZFJvdXRlcyIsIl90aXBzUm91dGVzIiwiX2NvbnRhY3RSb3V0ZXMiLCJfbWVzc2FnZVJvdXRlcyIsIl9yZXZpZXdSb3V0ZXMiLCJfY291cG9uUm91dGVzIiwiX3NhdmVkVm91Y2hlclJvdXRlcyIsIl9yZXBvcnRSb3V0ZXMiLCJfc3lzdGVtUm91dGVzIiwiX3N1cHBsaWVyUm91dGVzIiwiX2JyYW5kUm91dGVzIiwiX2FwaVJvdXRlcyIsIl9kYXRhYmFzZSIsImUiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImRvdGVudiIsImNvbmZpZyIsInBhdGgiLCJmb3JFYWNoIiwibW9kZWwiLCJtb25nb29zZSIsIm1vZGVscyIsImFwcCIsImV4cHJlc3MiLCJ1c2UiLCJjb3JzIiwib3JpZ2luIiwiY3JlZGVudGlhbHMiLCJtZXRob2RzIiwiYWxsb3dlZEhlYWRlcnMiLCJqc29uIiwibGltaXQiLCJ1cmxlbmNvZGVkIiwiZXh0ZW5kZWQiLCJjb29raWVQYXJzZXIiLCJyZXEiLCJyZXMiLCJuZXh0IiwiYXV0aEhlYWRlciIsImhlYWRlcnMiLCJhdXRob3JpemF0aW9uIiwic3RhcnRzV2l0aCIsInRva2VuIiwic3Vic3RyaW5nIiwic2VjcmV0S2V5IiwicHJvY2VzcyIsImVudiIsIkpXVF9TRUNSRVRfQUNDRVNTIiwiY29uc29sZSIsImVycm9yIiwiZGVjb2RlZCIsImp3dCIsInZlcmlmeSIsInVzZXIiLCJuYW1lIiwid2FybiIsIm1lc3NhZ2UiLCJsb2ciLCJEYXRlIiwidG9JU09TdHJpbmciLCJtZXRob2QiLCJ1cmwiLCJjaGVja0RiQ29ubmVjdGlvbiIsIm5vRGJFbmRwb2ludHMiLCJpc01vbmdvQ29ubmVjdGVkIiwiaW5jbHVkZXMiLCJzdGF0dXMiLCJzdWNjZXNzIiwiY29kZSIsInJlZGlyZWN0IiwiZ2V0Iiwic2VuZCIsImluaXRpYWxpemVEYXRhYmFzZSIsInRoZW4iLCJjYXRjaCIsImVyciIsImF1dGhSb3V0ZXMiLCJhZG1pbkF1dGhSb3V0ZXMiLCJhZG1pblJvdXRlcyIsImNhdGVnb3J5Um91dGVzIiwic2NyYXBlclJvdXRlcyIsInByb2R1Y3RzUm91dGVzIiwiY2FydFJvdXRlcyIsImNoYXRib3RSb3V0ZXMiLCJwYXltZW50Um91dGVzIiwib3JkZXJSb3V0ZXMiLCJkYXNoYm9hcmRSb3V0ZXMiLCJ0aXBzUm91dGVzIiwiY29udGFjdFJvdXRlcyIsIm1lc3NhZ2VSb3V0ZXMiLCJyZXZpZXdSb3V0ZXMiLCJjb3Vwb25Sb3V0ZXMiLCJzYXZlZFZvdWNoZXJSb3V0ZXMiLCJyZXBvcnRSb3V0ZXMiLCJzeXN0ZW1Sb3V0ZXMiLCJzdXBwbGllclJvdXRlcyIsImJyYW5kUm91dGVzIiwiYXBpUm91dGVzIiwiZ2V0QmVzdFNlbGxpbmdQcm9kdWN0cyIsInJlcG9ydEVuZHBvaW50cyIsInJlcG9ydHNDb250cm9sbGVyIiwiZ2V0RGFzaGJvYXJkU3RhdHMiLCJnZXRSZXZlbnVlRGF0YSIsImdldFRvcFByb2R1Y3RzIiwiZ2V0SW52ZW50b3J5RGF0YSIsImdldFVzZXJEYXRhIiwiZ2V0T3JkZXJEYXRhIiwiZ2V0UHJvbW90aW9uRGF0YSIsImdldFN5c3RlbUFjdGl2aXR5RGF0YSIsImdldERlbGl2ZXJ5RGF0YSIsImdldEZlZWRiYWNrRGF0YSIsImhhbmRsZXIiLCJPYmplY3QiLCJlbnRyaWVzIiwicmVwbGFjZSIsIndlYmhvb2tIYW5kbGVyIiwiYm9keSIsImdhdGV3YXkiLCJ0cmFuc2ZlckFtb3VudCIsImhhbmRsZUJhbmtXZWJob29rIiwiaGFuZGxlU2VwYXlDYWxsYmFjayIsImhlYWRlcnNTZW50IiwicG9zdCIsImRiU3RhdHVzIiwiZ2V0Q29ubmVjdGlvblN0YXR1cyIsInRpbWVzdGFtcCIsIk5PREVfRU5WIiwidXNlckFnZW50IiwiaXAiLCJtb25nb0Nvbm5lY3Rpb24iLCJpc0Nvbm5lY3RlZCIsIm1vbmdvUmVhZHlTdGF0ZSIsImNvbm5lY3Rpb24iLCJyZWFkeVN0YXRlIiwidXB0aW1lIiwiZmFsbGJhY2tNb2RlIiwiZGJDb25uZWN0aW9uQXR0ZW1wdHMiLCJjb25uZWN0aW9uQXR0ZW1wdHMiLCJkYkhvc3QiLCJob3N0IiwiZGJOYW1lIiwiUE9SVCIsIkhPU1QiLCJtb25nbyIsInBvcnQiLCJpbmZvIiwiZW52aXJvbm1lbnQiLCJub2RlRW52Iiwibm9kZVZlcnNpb24iLCJ2ZXJzaW9uIiwicGxhdGZvcm0iLCJhcmNoIiwibWVtb3J5VXNhZ2UiLCJjb25uZWN0aW9uU3RhdGUiLCJjb25uZWN0aW9uUGFyYW1zIiwicmVxdWVzdCIsImlwcyIsIm5ldHdvcmsiLCJkbnNTZXJ2ZXJzIiwiZG5zIiwiZ2V0U2VydmVycyIsIm1haW5Ib3N0IiwiZG5zTG9va3VwUHJvbWlzZSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwibG9va3VwIiwiYWRkcmVzcyIsImRuc1Jlc29sdmVQcm9taXNlIiwiYWRkcmVzc2VzIiwidGltZW91dCIsIl8iLCJzZXRUaW1lb3V0IiwiRXJyb3IiLCJkbnNMb29rdXAiLCJyYWNlIiwiZG5zTG9va3VwRXJyb3IiLCJkbnNSZXNvbHZlIiwiZG5zUmVzb2x2ZUVycm9yIiwiZG5zRXJyIiwiZG5zRXJyb3IiLCJzY2hlZHVsZUludGVydmFsSG91cnMiLCJzY2hlZHVsZUludGVydmFsTXMiLCJydW5TY2hlZHVsZWRUYXNrcyIsImFsbCIsImRlbGV0ZUV4cGlyZWRWb3VjaGVycyIsInVwZGF0ZVByb2R1Y3RFeHBpcmF0aW9ucyIsInF1ZXJ5IiwiZXJyb3JfbWVzc2FnZSIsImFwaUtleSIsIkdPT0dMRV9NQVBTX0FQSV9LRVkiLCJlbmNvZGVVUklDb21wb25lbnQiLCJyZXNwb25zZSIsImZldGNoIiwiZGF0YSIsInN0YXJ0U2VydmVyIiwicG9ydE51bWJlciIsIk51bWJlciIsImxpc3RlbiIsInNldEludGVydmFsIiwib24iXSwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cbmltcG9ydCBleHByZXNzIGZyb20gXCJleHByZXNzXCI7XG5pbXBvcnQgY29ycyBmcm9tIFwiY29yc1wiO1xuaW1wb3J0IGNvb2tpZVBhcnNlciBmcm9tIFwiY29va2llLXBhcnNlclwiO1xuaW1wb3J0IG1vbmdvb3NlIGZyb20gXCJtb25nb29zZVwiO1xuaW1wb3J0IGRvdGVudiBmcm9tIFwiZG90ZW52XCI7XG5pbXBvcnQgZmV0Y2ggZnJvbSBcIm5vZGUtZmV0Y2hcIjtcbmltcG9ydCBqd3QgZnJvbSBcImpzb253ZWJ0b2tlblwiO1xuaW1wb3J0IGRucyBmcm9tIFwiZG5zXCI7XG5cbmltcG9ydCB7IGRlbGV0ZUV4cGlyZWRWb3VjaGVycyB9IGZyb20gXCIuL0NvbnRyb2xsZXIvc2F2ZWRWb3VjaGVyQ29udHJvbGxlci5qc1wiO1xuaW1wb3J0IHtcbiAgaGFuZGxlU2VwYXlDYWxsYmFjayxcbiAgaGFuZGxlQmFua1dlYmhvb2ssXG59IGZyb20gXCIuL0NvbnRyb2xsZXIvcGF5bWVudENvbnRyb2xsZXIuanNcIjtcbmltcG9ydCByZXBvcnRzQ29udHJvbGxlciBmcm9tIFwiLi9Db250cm9sbGVyL3JlcG9ydHNDb250cm9sbGVyLmpzXCI7XG5pbXBvcnQge1xuICBnZXRCZXN0U2VsbGluZ1Byb2R1Y3RzLFxuICB1cGRhdGVQcm9kdWN0RXhwaXJhdGlvbnMsXG59IGZyb20gXCIuL0NvbnRyb2xsZXIvcHJvZHVjdHNDb250cm9sbGVyLmpzXCI7XG5cbi8vIExvYWQgZW52IHZhcmlhYmxlc1xuZG90ZW52LmNvbmZpZyh7IHBhdGg6IFwiLmVudlwiIH0pO1xuXG4vLyBJbXBvcnQgbW9kZWxzIHRvIGF2b2lkIE92ZXJ3cml0ZU1vZGVsRXJyb3JcbmltcG9ydCBcIi4vTW9kZWwvUmV2aWV3LmpzXCI7XG5pbXBvcnQgXCIuL01vZGVsL1Jldmlld1N0YXRzLmpzXCI7XG5cbi8vIENsZWFyIG1vZGVsIGNhY2hlIGZvciBzcGVjaWZpYyBtb2RlbHMgdG8gYXZvaWQgb3ZlcndyaXRlIGVycm9ycyBvbiBob3QgcmVsb2Fkc1xuW1wiTWVzc2FnZXNcIiwgXCJDb252ZXJzYXRpb25cIl0uZm9yRWFjaCgobW9kZWwpID0+IHtcbiAgaWYgKG1vbmdvb3NlLm1vZGVsc1ttb2RlbF0pIHtcbiAgICBkZWxldGUgbW9uZ29vc2UubW9kZWxzW21vZGVsXTtcbiAgfVxufSk7XG5cbi8vIEltcG9ydCByb3V0ZXNcbmltcG9ydCBhdXRoUm91dGVzIGZyb20gXCIuL3JvdXRlcy9hdXRoUm91dGVzLmpzXCI7XG5pbXBvcnQgc2NyYXBlclJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvc2NyYXBlclJvdXRlcy5qc1wiO1xuaW1wb3J0IGNhdGVnb3J5Um91dGVzIGZyb20gXCIuL3JvdXRlcy9jYXRlZ29yeVJvdXRlcy5qc1wiO1xuaW1wb3J0IHByb2R1Y3RzUm91dGVzIGZyb20gXCIuL3JvdXRlcy9wcm9kdWN0c1JvdXRlcy5qc1wiO1xuaW1wb3J0IGNhcnRSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL2NhcnRSb3V0ZXMuanNcIjtcbmltcG9ydCB7IGNoYXRib3RSb3V0ZXMgfSBmcm9tIFwiLi9yb3V0ZXMvY2hhdGJvdFJvdXRlcy5qc1wiO1xuaW1wb3J0IHBheW1lbnRSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL3BheW1lbnRSb3V0ZXMuanNcIjtcbmltcG9ydCBvcmRlclJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvb3JkZXJSb3V0ZXMuanNcIjtcbmltcG9ydCBhZG1pblJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvYWRtaW5Sb3V0ZXMuanNcIjtcbmltcG9ydCBhZG1pbkF1dGhSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL2FkbWluQXV0aFJvdXRlcy5qc1wiO1xuaW1wb3J0IGRhc2hib2FyZFJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvZGFzaGJvYXJkUm91dGVzLmpzXCI7XG5pbXBvcnQgdGlwc1JvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvdGlwc1JvdXRlcy5qc1wiO1xuaW1wb3J0IGNvbnRhY3RSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL2NvbnRhY3RSb3V0ZXMuanNcIjtcbmltcG9ydCBtZXNzYWdlUm91dGVzIGZyb20gXCIuL3JvdXRlcy9tZXNzYWdlUm91dGVzLmpzXCI7XG5pbXBvcnQgcmV2aWV3Um91dGVzIGZyb20gXCIuL3JvdXRlcy9yZXZpZXdSb3V0ZXMuanNcIjtcbmltcG9ydCBjb3Vwb25Sb3V0ZXMgZnJvbSBcIi4vcm91dGVzL2NvdXBvblJvdXRlcy5qc1wiO1xuaW1wb3J0IHNhdmVkVm91Y2hlclJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvc2F2ZWRWb3VjaGVyUm91dGVzLmpzXCI7XG5pbXBvcnQgcmVwb3J0Um91dGVzIGZyb20gXCIuL3JvdXRlcy9yZXBvcnRSb3V0ZXMuanNcIjtcbmltcG9ydCBzeXN0ZW1Sb3V0ZXMgZnJvbSBcIi4vcm91dGVzL3N5c3RlbVJvdXRlcy5qc1wiO1xuaW1wb3J0IHN1cHBsaWVyUm91dGVzIGZyb20gXCIuL3JvdXRlcy9zdXBwbGllclJvdXRlcy5qc1wiO1xuaW1wb3J0IGJyYW5kUm91dGVzIGZyb20gXCIuL3JvdXRlcy9icmFuZFJvdXRlcy5qc1wiO1xuaW1wb3J0IGFwaVJvdXRlcyBmcm9tICcuL3JvdXRlcy9hcGlSb3V0ZXMuanMnO1xuXG4vLyBJbXBvcnQgZGF0YWJhc2UgY29uZmlnIG3hu5tpXG5pbXBvcnQgeyBpbml0aWFsaXplRGF0YWJhc2UsIGdldENvbm5lY3Rpb25TdGF0dXMsIGlzTW9uZ29Db25uZWN0ZWQgfSBmcm9tICcuL2NvbmZpZy9kYXRhYmFzZS5qcyc7XG5cbmNvbnN0IGFwcCA9IGV4cHJlc3MoKTtcblxuLy8gQ09SUyBjb25maWd1cmF0aW9uXG5hcHAudXNlKFxuICBjb3JzKHtcbiAgICBvcmlnaW46IFwiKlwiLCAvLyBDaG8gcGjDqXAgdOG6pXQgY+G6oyBjw6FjIG9yaWdpbiBcbiAgICBjcmVkZW50aWFsczogdHJ1ZSxcbiAgICBtZXRob2RzOiBbXCJHRVRcIiwgXCJQT1NUXCIsIFwiUFVUXCIsIFwiREVMRVRFXCIsIFwiUEFUQ0hcIiwgXCJPUFRJT05TXCJdLFxuICAgIGFsbG93ZWRIZWFkZXJzOiBbXCJDb250ZW50LVR5cGVcIiwgXCJBdXRob3JpemF0aW9uXCIsIFwiWC1SZXF1ZXN0ZWQtV2l0aFwiLCBcIlgtQWNjZXNzLVRva2VuXCIsIFwiQWNjZXB0XCIsIFwiT3JpZ2luXCJdXG4gIH0pXG4pO1xuXG4vLyBNaWRkbGV3YXJlIGZvciBKU09OIGFuZCBVUkwgZW5jb2RlZCBib2RpZXMgKDUwbWIgbGltaXQpXG5hcHAudXNlKGV4cHJlc3MuanNvbih7IGxpbWl0OiBcIjUwbWJcIiB9KSk7XG5hcHAudXNlKGV4cHJlc3MudXJsZW5jb2RlZCh7IGV4dGVuZGVkOiB0cnVlLCBsaW1pdDogXCI1MG1iXCIgfSkpO1xuYXBwLnVzZShjb29raWVQYXJzZXIoKSk7XG5cbi8vIEpXVCBBdXRoZW50aWNhdGlvbiBtaWRkbGV3YXJlXG5hcHAudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgIGNvbnN0IGF1dGhIZWFkZXIgPSByZXEuaGVhZGVycy5hdXRob3JpemF0aW9uO1xuICBpZiAoYXV0aEhlYWRlciAmJiBhdXRoSGVhZGVyLnN0YXJ0c1dpdGgoXCJCZWFyZXIgXCIpKSB7XG4gICAgICBjb25zdCB0b2tlbiA9IGF1dGhIZWFkZXIuc3Vic3RyaW5nKDcpO1xuICAgIGNvbnN0IHNlY3JldEtleSA9IHByb2Nlc3MuZW52LkpXVF9TRUNSRVRfQUNDRVNTO1xuXG4gICAgaWYgKCFzZWNyZXRLZXkpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJKV1RfU0VDUkVUIGlzIG5vdCBkZWZpbmVkIGluIGVudmlyb25tZW50IHZhcmlhYmxlc1wiKTtcbiAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgfVxuICAgICAgXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBkZWNvZGVkID0gand0LnZlcmlmeSh0b2tlbiwgc2VjcmV0S2V5KTtcbiAgICAgICAgcmVxLnVzZXIgPSBkZWNvZGVkO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIC8vIENo4buJIGxvZyBs4buXaSBu4bq/dSBraMO0bmcgcGjhuqNpIGzhu5dpIHRva2VuIGjhur90IGjhuqFuXG4gICAgICBpZiAoZXJyb3IubmFtZSAhPT0gJ1Rva2VuRXhwaXJlZEVycm9yJykge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJJbnZhbGlkIEpXVCB0b2tlbjpcIiwgZXJyb3IubWVzc2FnZSk7XG4gICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIG5leHQoKTtcbn0pO1xuXG4vLyBSZXF1ZXN0IGxvZ2dpbmcgbWlkZGxld2FyZVxuYXBwLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcbiAgY29uc29sZS5sb2coYFske25ldyBEYXRlKCkudG9JU09TdHJpbmcoKX1dICR7cmVxLm1ldGhvZH0gJHtyZXEudXJsfSAtIFVzZXIgQWdlbnQ6ICR7cmVxLmhlYWRlcnNbJ3VzZXItYWdlbnQnXX1gKTtcbiAgbmV4dCgpO1xufSk7XG5cbi8vIE1pZGRsZXdhcmUga2nhu4NtIHRyYSBr4bq/dCBu4buRaSBEQiB0csaw4bubYyBraGkgeOG7rSBsw70gcmVxdWVzdCBj4bqnbiBEQlxuY29uc3QgY2hlY2tEYkNvbm5lY3Rpb24gPSAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgLy8gRGFuaCBzw6FjaCBjw6FjIGVuZHBvaW50IGtow7RuZyBj4bqnbiBr4bq/dCBu4buRaSBEQlxuICBjb25zdCBub0RiRW5kcG9pbnRzID0gWycvaGVhbHRoJywgJy9kZWJ1ZycsICcvZmF2aWNvbi5pY28nLCAnLycsICcvbWFpbnRlbmFuY2UuaHRtbCddO1xuICBcbiAgaWYgKGlzTW9uZ29Db25uZWN0ZWQgfHwgbm9EYkVuZHBvaW50cy5pbmNsdWRlcyhyZXEucGF0aCkpIHtcbiAgICByZXR1cm4gbmV4dCgpO1xuICB9XG4gIFxuICAvLyBLaeG7g20gdHJhIHhlbSByZXF1ZXN0IGPDsyBwaOG6o2kgbMOgIEFQSSBoYXkga2jDtG5nXG4gIGlmIChyZXEucGF0aC5zdGFydHNXaXRoKCcvYXBpLycpKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAzKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCJE4buLY2ggduG7pSBkYXRhYmFzZSB04bqhbSB0aOG7nWkga2jDtG5nIGto4bqjIGThu6VuZy4gVnVpIGzDsm5nIHRo4butIGzhuqFpIHNhdS5cIixcbiAgICAgIGNvZGU6IFwiREJfVU5BVkFJTEFCTEVcIlxuICAgIH0pO1xuICB9XG4gIFxuICAvLyBO4bq/dSBsw6AgcmVxdWVzdCB0cmFuZyB3ZWIgdGjDrCByZWRpcmVjdCB24buBIHRyYW5nIHRow7RuZyBiw6FvIGLhuqNvIHRyw6xcbiAgcmVzLnJlZGlyZWN0KCcvbWFpbnRlbmFuY2UuaHRtbCcpO1xufTtcblxuLy8gVOG6oW8gdHJhbmcgYuG6o28gdHLDrCDEkcahbiBnaeG6o25cbmFwcC5nZXQoJy9tYWludGVuYW5jZS5odG1sJywgKHJlcSwgcmVzKSA9PiB7XG4gIHJlcy5zZW5kKGBcbiAgICA8IURPQ1RZUEUgaHRtbD5cbiAgICA8aHRtbD5cbiAgICA8aGVhZD5cbiAgICAgIDx0aXRsZT5C4bqjbyB0csOsIGjhu4cgdGjhu5FuZzwvdGl0bGU+XG4gICAgICA8bWV0YSBuYW1lPVwidmlld3BvcnRcIiBjb250ZW50PVwid2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMFwiPlxuICAgICAgPHN0eWxlPlxuICAgICAgICBib2R5IHsgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmOyB0ZXh0LWFsaWduOiBjZW50ZXI7IHBhZGRpbmc6IDUwcHggMjBweDsgfVxuICAgICAgICBoMSB7IGNvbG9yOiAjZTUzOTM1OyB9XG4gICAgICAgIHAgeyBjb2xvcjogIzMzMzsgbWF4LXdpZHRoOiA2MDBweDsgbWFyZ2luOiAyMHB4IGF1dG87IH1cbiAgICAgICAgYnV0dG9uIHsgYmFja2dyb3VuZDogIzRjYWY1MDsgY29sb3I6IHdoaXRlOyBib3JkZXI6IG5vbmU7IHBhZGRpbmc6IDEwcHggMjBweDsgYm9yZGVyLXJhZGl1czogNHB4OyBjdXJzb3I6IHBvaW50ZXI7IH1cbiAgICAgIDwvc3R5bGU+XG4gICAgPC9oZWFkPlxuICAgIDxib2R5PlxuICAgICAgPGgxPkjhu4cgdGjhu5FuZyDEkWFuZyDEkcaw4bujYyBi4bqjbyB0csOsPC9oMT5cbiAgICAgIDxwPkNow7puZyB0w7RpIMSRYW5nIGfhurdwIHbhuqVuIMSR4buBIGvhur90IG7hu5FpIMSR4bq/biBjxqEgc+G7nyBk4buvIGxp4buHdS4gVnVpIGzDsm5nIHRo4butIGzhuqFpIHNhdSBob+G6t2MgbGnDqm4gaOG7hyB24bubaSBjaMO6bmcgdMO0aSBu4bq/dSB24bqlbiDEkeG7gSBrw6lvIGTDoGkuPC9wPlxuICAgICAgPHA+SG90bGluZTogMDMyNiA3NDMzOTE8L3A+XG4gICAgICA8YnV0dG9uIG9uY2xpY2s9XCJ3aW5kb3cubG9jYXRpb24ucmVsb2FkKClcIj5UaOG7rSBs4bqhaTwvYnV0dG9uPlxuICAgIDwvYm9keT5cbiAgICA8L2h0bWw+XG4gIGApO1xufSk7XG5cbi8vIMOBcCBk4bulbmcgbWlkZGxld2FyZSBraeG7g20gdHJhIERCIGNobyB04bqldCBj4bqjIGPDoWMgcmVxdWVzdFxuYXBwLnVzZShjaGVja0RiQ29ubmVjdGlvbik7XG5cbi8vIEto4bufaSB04bqhbyBr4bq/dCBu4buRaSDEkeG6v24gZGF0YWJhc2VcbmluaXRpYWxpemVEYXRhYmFzZSgpLnRoZW4oKCkgPT4ge1xuICBjb25zb2xlLmxvZyhcIkRhdGFiYXNlIGluaXRpYWxpemF0aW9uIGNvbXBsZXRlZFwiKTtcbn0pLmNhdGNoKGVyciA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gaW5pdGlhbGl6ZSBkYXRhYmFzZTpcIiwgZXJyKTtcbiAgY29uc29sZS5sb2coXCJTZXJ2ZXIgd2lsbCBydW4gaW4gZmFsbGJhY2sgbW9kZVwiKTtcbn0pO1xuXG4vLyBSZWdpc3RlciBBUEkgcm91dGVzXG5hcHAudXNlKFwiL2F1dGhcIiwgYXV0aFJvdXRlcyk7XG5hcHAudXNlKFwiL2FkbWluL2F1dGhcIiwgYWRtaW5BdXRoUm91dGVzKTtcbmFwcC51c2UoXCIvYXBpXCIsIGFkbWluUm91dGVzKTtcbmFwcC51c2UoXCIvYXBpL2NhdGVnb3JpZXNcIiwgY2F0ZWdvcnlSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGlcIiwgc2NyYXBlclJvdXRlcyk7XG5hcHAudXNlKFwiL2FwaVwiLCBwcm9kdWN0c1JvdXRlcyk7XG5hcHAudXNlKFwiL2FwaS9jYXJ0XCIsIGNhcnRSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvY2hhdGJvdFwiLCBjaGF0Ym90Um91dGVzKTtcbmFwcC51c2UoXCIvYXBpL3BheW1lbnRzXCIsIHBheW1lbnRSb3V0ZXMpO1xuYXBwLnVzZShcIi9vcmRlcnNcIiwgb3JkZXJSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvZGFzaGJvYXJkXCIsIGRhc2hib2FyZFJvdXRlcyk7XG5hcHAudXNlKFwiL2FwaVwiLCB0aXBzUm91dGVzKTtcbmFwcC51c2UoXCIvYXBpL2NvbnRhY3RcIiwgY29udGFjdFJvdXRlcyk7XG5hcHAudXNlKFwiL2FwaS9tZXNzYWdlc1wiLCBtZXNzYWdlUm91dGVzKTtcbmFwcC51c2UoXCIvYXBpL3Jldmlld3NcIiwgcmV2aWV3Um91dGVzKTtcbmFwcC51c2UoXCIvYXBpL2NvdXBvbnNcIiwgY291cG9uUm91dGVzKTtcbmFwcC51c2UoXCIvYXBpL3NhdmVkLXZvdWNoZXJzXCIsIHNhdmVkVm91Y2hlclJvdXRlcyk7XG5hcHAudXNlKFwiL2FwaS9yZXBvcnRzXCIsIHJlcG9ydFJvdXRlcyk7XG5hcHAudXNlKFwiL2FwaS9zeXN0ZW1cIiwgc3lzdGVtUm91dGVzKTtcbmFwcC51c2UoXCIvYXBpL3N1cHBsaWVyc1wiLCBzdXBwbGllclJvdXRlcyk7XG5hcHAudXNlKFwiL2FwaS9icmFuZHNcIiwgYnJhbmRSb3V0ZXMpO1xuYXBwLnVzZSgnL2FwaS9kYicsIGFwaVJvdXRlcyk7XG5cbi8vIERpcmVjdCBwcm9kdWN0IGJlc3Qgc2VsbGVycyBlbmRwb2ludFxuYXBwLmdldChcIi9hcGkvcHJvZHVjdHMvYmVzdC1zZWxsZXJzXCIsIGdldEJlc3RTZWxsaW5nUHJvZHVjdHMpO1xuXG4vLyBSZXBvcnRzIGVuZHBvaW50cyByZWdpc3RyYXRpb24gKG1hcHBpbmcgcGF0aCAtPiBoYW5kbGVyKVxuY29uc3QgcmVwb3J0RW5kcG9pbnRzID0ge1xuICBcIi9hcGkvZGFzaGJvYXJkL3N0YXRzXCI6IHJlcG9ydHNDb250cm9sbGVyLmdldERhc2hib2FyZFN0YXRzLFxuICBcIi9hcGkvYW5hbHl0aWNzL3JldmVudWVcIjogcmVwb3J0c0NvbnRyb2xsZXIuZ2V0UmV2ZW51ZURhdGEsXG4gIFwiL2FwaS9hbmFseXRpY3MvdG9wLXByb2R1Y3RzXCI6IHJlcG9ydHNDb250cm9sbGVyLmdldFRvcFByb2R1Y3RzLFxuICBcIi9hcGkvcHJvZHVjdHMvaW52ZW50b3J5XCI6IHJlcG9ydHNDb250cm9sbGVyLmdldEludmVudG9yeURhdGEsXG4gIFwiL2FwaS91c2Vycy9zdGF0c1wiOiByZXBvcnRzQ29udHJvbGxlci5nZXRVc2VyRGF0YSxcbiAgXCIvYXBpL29yZGVycy9zdGF0c1wiOiByZXBvcnRzQ29udHJvbGxlci5nZXRPcmRlckRhdGEsXG4gIFwiL2FwaS9jb3Vwb25zL3N0YXRzXCI6IHJlcG9ydHNDb250cm9sbGVyLmdldFByb21vdGlvbkRhdGEsXG4gIFwiL2FwaS9hZG1pbi9hY3Rpdml0eS1sb2dzXCI6IHJlcG9ydHNDb250cm9sbGVyLmdldFN5c3RlbUFjdGl2aXR5RGF0YSxcbiAgXCIvYXBpL29yZGVycy9kZWxpdmVyeS1zdGF0c1wiOiByZXBvcnRzQ29udHJvbGxlci5nZXREZWxpdmVyeURhdGEsXG4gIFwiL2FwaS9yZXZpZXdzL3N0YXRzXCI6IHJlcG9ydHNDb250cm9sbGVyLmdldEZlZWRiYWNrRGF0YSxcbn07XG5cbi8vIFJlZ2lzdGVyIHJlcG9ydCBlbmRwb2ludHMgYW5kIHRoZWlyIGFsaWFzZXMgdW5kZXIgL2FwaS9yZXBvcnRzXG5mb3IgKGNvbnN0IFtwYXRoLCBoYW5kbGVyXSBvZiBPYmplY3QuZW50cmllcyhyZXBvcnRFbmRwb2ludHMpKSB7XG4gIGFwcC5nZXQocGF0aCwgaGFuZGxlcik7XG4gIGFwcC5nZXQoYC9hcGkvcmVwb3J0cyR7cGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgXCJcIil9YCwgaGFuZGxlcik7XG59XG5cbi8vIFdlYmhvb2sgaGFuZGxlciBmdW5jdGlvblxuY29uc3Qgd2ViaG9va0hhbmRsZXIgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBpZiAocmVxLmJvZHkuZ2F0ZXdheSA9PT0gXCJNQkJhbmtcIiB8fCByZXEuYm9keS50cmFuc2ZlckFtb3VudCkge1xuICAgICAgICBhd2FpdCBoYW5kbGVCYW5rV2ViaG9vayhyZXEsIHJlcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCBoYW5kbGVTZXBheUNhbGxiYWNrKHJlcSwgcmVzKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFyZXMuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgY29kZTogXCIwMFwiLFxuICAgICAgICAgIG1lc3NhZ2U6IFwiV2ViaG9vayBwcm9jZXNzZWQgc3VjY2Vzc2Z1bGx5XCIsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIldlYmhvb2sgZXJyb3I6XCIsIGVycm9yKTtcbiAgICAgIGlmICghcmVzLmhlYWRlcnNTZW50KSB7XG4gICAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgIGNvZGU6IFwiMDBcIixcbiAgICAgICAgICBtZXNzYWdlOiBcIldlYmhvb2sgcmVjZWl2ZWQgd2l0aCBlcnJvclwiLFxuICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufTtcblxuLy8gUmVnaXN0ZXIgd2ViaG9vayByb3V0ZXNcbltcbiAgXCIvd2ViaG9va1wiLFxuICBcIi9hcGkvd2ViaG9va1wiLFxuICBcIi9hcGkvd2ViaG9vay9iYW5rXCIsXG4gIFwiL2FwaS9wYXltZW50cy93ZWJob29rXCIsXG4gIFwiL2FwaS9wYXltZW50cy93ZWJob29rL2JhbmtcIixcbiAgXCIvYXBpL3BheW1lbnRzL3NlcGF5L3dlYmhvb2tcIixcbl0uZm9yRWFjaCgocGF0aCkgPT4gYXBwLnBvc3QocGF0aCwgd2ViaG9va0hhbmRsZXIpKTtcblxuLy8gRW5oYW5jZWQgaGVhbHRoIGNoZWNrIGVuZHBvaW50XG5hcHAuZ2V0KFwiL2hlYWx0aFwiLCAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgZGJTdGF0dXMgPSBnZXRDb25uZWN0aW9uU3RhdHVzKCk7XG4gIFxuICByZXMuanNvbih7XG4gICAgc3RhdHVzOiBcIm9rXCIsXG4gICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgZW52OiBwcm9jZXNzLmVudi5OT0RFX0VOViB8fCBcImRldmVsb3BtZW50XCIsXG4gICAgdXNlckFnZW50OiByZXEuaGVhZGVyc1sndXNlci1hZ2VudCddLFxuICAgIGlwOiByZXEuaXAgfHwgcmVxLmhlYWRlcnNbJ3gtZm9yd2FyZGVkLWZvciddIHx8ICd1bmtub3duJyxcbiAgICBtb25nb0Nvbm5lY3Rpb246IGRiU3RhdHVzLmlzQ29ubmVjdGVkID8gXCJjb25uZWN0ZWRcIiA6IFwiZGlzY29ubmVjdGVkXCIsXG4gICAgbW9uZ29SZWFkeVN0YXRlOiBtb25nb29zZS5jb25uZWN0aW9uLnJlYWR5U3RhdGUsXG4gICAgdXB0aW1lOiBwcm9jZXNzLnVwdGltZSgpLFxuICAgIGZhbGxiYWNrTW9kZTogIWRiU3RhdHVzLmlzQ29ubmVjdGVkLFxuICAgIGRiQ29ubmVjdGlvbkF0dGVtcHRzOiBkYlN0YXR1cy5jb25uZWN0aW9uQXR0ZW1wdHMsXG4gICAgZGJIb3N0OiBkYlN0YXR1cy5ob3N0LFxuICAgIGRiTmFtZTogZGJTdGF0dXMuZGJOYW1lXG4gIH0pO1xufSk7XG5cbi8vIEVuZHBvaW50IMSR4buDIGtp4buDbSB0cmEgdGjDtG5nIHRpbiBjaGkgdGnhur90IChjaOG7iSBkw7luZyB0cm9uZyBkZXZlbG9wbWVudClcbmFwcC5nZXQoXCIvZGVidWdcIiwgKHJlcSwgcmVzKSA9PiB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHtcbiAgICAgIG1lc3NhZ2U6IFwiRGVidWcgZW5kcG9pbnQgaXMgZGlzYWJsZWQgaW4gcHJvZHVjdGlvblwiXG4gICAgfSk7XG4gIH1cbiAgXG4gIHJlcy5qc29uKHtcbiAgICBlbnY6IHtcbiAgICAgIE5PREVfRU5WOiBwcm9jZXNzLmVudi5OT0RFX0VOVixcbiAgICAgIFBPUlQ6IHByb2Nlc3MuZW52LlBPUlQsXG4gICAgICBIT1NUOiBwcm9jZXNzLmVudi5IT1NUXG4gICAgfSxcbiAgICBoZWFkZXJzOiByZXEuaGVhZGVycyxcbiAgICBtb25nbzoge1xuICAgICAgaG9zdDogbW9uZ29vc2UuY29ubmVjdGlvbi5ob3N0LFxuICAgICAgcG9ydDogbW9uZ29vc2UuY29ubmVjdGlvbi5wb3J0LFxuICAgICAgbmFtZTogbW9uZ29vc2UuY29ubmVjdGlvbi5uYW1lLFxuICAgICAgcmVhZHlTdGF0ZTogbW9uZ29vc2UuY29ubmVjdGlvbi5yZWFkeVN0YXRlXG4gICAgfVxuICB9KTtcbn0pO1xuXG4vLyBUaMOqbSBlbmRwb2ludCBoaeG7h24gdGjhu4sgdGjDtG5nIHRpbiBjaGkgdGnhur90IHbhu4Ega+G6v3QgbuG7kWkgTW9uZ29EQlxuYXBwLmdldCgnL21vbmdvZGItZGVidWcnLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICAvLyBDaOG7iSBjaG8gcGjDqXAgdHJvbmcgbcO0aSB0csaw4budbmcgZGV2ZWxvcG1lbnRcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgbWVzc2FnZTogJ0ZvcmJpZGRlbiBpbiBwcm9kdWN0aW9uIGVudmlyb25tZW50JyB9KTtcbiAgICB9XG5cbiAgICAvLyBUaHUgdGjhuq1wIHRow7RuZyB0aW4gY2hpIHRp4bq/dCB24buBIG3DtGkgdHLGsOG7nW5nIHbDoCBr4bq/dCBu4buRaVxuICAgIGNvbnN0IGluZm8gPSB7XG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBub2RlRW52OiBwcm9jZXNzLmVudi5OT0RFX0VOViB8fCAnZGV2ZWxvcG1lbnQnLFxuICAgICAgICBub2RlVmVyc2lvbjogcHJvY2Vzcy52ZXJzaW9uLFxuICAgICAgICBwbGF0Zm9ybTogcHJvY2Vzcy5wbGF0Zm9ybSxcbiAgICAgICAgYXJjaDogcHJvY2Vzcy5hcmNoLFxuICAgICAgICB1cHRpbWU6IHByb2Nlc3MudXB0aW1lKCksXG4gICAgICAgIG1lbW9yeVVzYWdlOiBwcm9jZXNzLm1lbW9yeVVzYWdlKCksXG4gICAgICB9LFxuICAgICAgbW9uZ29vc2U6IHtcbiAgICAgICAgdmVyc2lvbjogbW9uZ29vc2UudmVyc2lvbixcbiAgICAgICAgY29ubmVjdGlvblN0YXRlOiBtb25nb29zZS5jb25uZWN0aW9uLnJlYWR5U3RhdGUsXG4gICAgICAgIGNvbm5lY3Rpb25QYXJhbXM6IHtcbiAgICAgICAgICBob3N0OiBtb25nb29zZS5jb25uZWN0aW9uLmhvc3QsXG4gICAgICAgICAgcG9ydDogbW9uZ29vc2UuY29ubmVjdGlvbi5wb3J0LFxuICAgICAgICAgIG5hbWU6IG1vbmdvb3NlLmNvbm5lY3Rpb24ubmFtZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICByZXF1ZXN0OiB7XG4gICAgICAgIGlwOiByZXEuaXAsXG4gICAgICAgIGlwczogcmVxLmlwcyxcbiAgICAgICAgaGVhZGVyczogcmVxLmhlYWRlcnMsXG4gICAgICAgIHVzZXJBZ2VudDogcmVxLmdldCgnVXNlci1BZ2VudCcpLFxuICAgICAgfSxcbiAgICAgIG5ldHdvcms6IHtcbiAgICAgICAgZG5zU2VydmVyczogZG5zLmdldFNlcnZlcnMoKSxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIC8vIFRo4butIHJlc29sdmUgxJHhu4thIGNo4buJIE1vbmdvREIgQXRsYXNcbiAgICB0cnkge1xuICAgICAgY29uc3QgbWFpbkhvc3QgPSAnY2x1c3RlcjAuYWhmYnR3ZC5tb25nb2RiLm5ldCc7XG4gICAgICBjb25zdCBkbnNMb29rdXBQcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBkbnMubG9va3VwKG1haW5Ib3N0LCAoZXJyLCBhZGRyZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikgcmVqZWN0KGVycik7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKGFkZHJlc3MpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBjb25zdCBkbnNSZXNvbHZlUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgZG5zLnJlc29sdmUobWFpbkhvc3QsIChlcnIsIGFkZHJlc3NlcykgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHJlamVjdChlcnIpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShhZGRyZXNzZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyDEkOG6t3QgdGltZW91dCA1IGdpw6J5IGNobyBjw6FjIEROUyBsb29rdXBcbiAgICAgIGNvbnN0IHRpbWVvdXQgPSBuZXcgUHJvbWlzZSgoXywgcmVqZWN0KSA9PiBcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiByZWplY3QobmV3IEVycm9yKCdETlMgbG9va3VwIHRpbWVvdXQnKSksIDUwMDApXG4gICAgICApO1xuICAgICAgXG4gICAgICAvLyBDaOG6oXkgY8OhYyB0aGFvIHTDoWMgRE5TIHbhu5tpIHRpbWVvdXRcbiAgICAgIHRyeSB7XG4gICAgICAgIGluZm8ubmV0d29yay5kbnNMb29rdXAgPSBhd2FpdCBQcm9taXNlLnJhY2UoW2Ruc0xvb2t1cFByb21pc2UsIHRpbWVvdXRdKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaW5mby5uZXR3b3JrLmRuc0xvb2t1cEVycm9yID0gZS5tZXNzYWdlO1xuICAgICAgfVxuICAgICAgXG4gICAgICB0cnkge1xuICAgICAgICBpbmZvLm5ldHdvcmsuZG5zUmVzb2x2ZSA9IGF3YWl0IFByb21pc2UucmFjZShbZG5zUmVzb2x2ZVByb21pc2UsIHRpbWVvdXRdKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaW5mby5uZXR3b3JrLmRuc1Jlc29sdmVFcnJvciA9IGUubWVzc2FnZTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChkbnNFcnIpIHtcbiAgICAgIGluZm8ubmV0d29yay5kbnNFcnJvciA9IGRuc0Vyci5tZXNzYWdlO1xuICAgIH1cblxuICAgIHJlcy5qc29uKGluZm8pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gIH1cbn0pO1xuXG4vLyBNaWRkbGV3YXJlIHRvIGNhdGNoIHVuaGFuZGxlZCByZXF1ZXN0cyAoNDA0KVxuYXBwLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcbiAgLy8gQ2jhu4kgeOG7rSBsw70gbuG6v3UgaGVhZGVyc1NlbnQgPSBmYWxzZSwgdHLDoW5oIGzhu5dpIGtoaSByZXNwb25zZSDEkcOjIMSRxrDhu6NjIGfhu61pXG4gIGlmICghcmVzLmhlYWRlcnNTZW50KSB7XG4gICAgcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBgQ2Fubm90ICR7cmVxLm1ldGhvZH0gJHtyZXEudXJsfWAsXG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTuG6v3UgaGVhZGVycyDEkcOjIMSRxrDhu6NjIGfhu61pLCBjaOG7iSBn4buNaSBuZXh0IHbhu5tpIGzhu5dpIChu4bq/dSBjw7MpXG4gICAgbmV4dCgpO1xuICB9XG59KTtcblxuLy8gR2xvYmFsIGVycm9yIGhhbmRsaW5nIG1pZGRsZXdhcmVcbmFwcC51c2UoKGVyciwgcmVxLCByZXMpID0+IHtcbiAgY29uc29sZS5lcnJvcihcIkdsb2JhbCBlcnJvcjpcIiwgZXJyKTtcblxuICAvLyBLaeG7g20gdHJhIHJlcS5wYXRoIHThu5NuIHThuqFpIHRyxrDhu5tjIGtoaSBz4butIGThu6VuZ1xuICBjb25zdCBwYXRoID0gcmVxICYmIHJlcS5wYXRoID8gcmVxLnBhdGggOiAnJztcblxuICAvLyBLaeG7g20gdHJhIHJlcyBsw6AgxJHhu5FpIHTGsOG7o25nIHJlc3BvbnNlIGjhu6NwIGzhu4dcbiAgaWYgKCFyZXMgfHwgdHlwZW9mIHJlcy5zdGF0dXMgIT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiSW52YWxpZCBFeHByZXNzIHJlc3BvbnNlIG9iamVjdCBpbiBlcnJvciBoYW5kbGVyLlwiKTtcbiAgICAvLyBUw7l5IGNo4buNbjogbG9nIHRow6ptIHRow7RuZyB0aW4gZGVidWcgduG7gSByZXEgdsOgIGVyclxuICAgIC8vIGNvbnNvbGUubG9nKCdSZXF1ZXN0IGRldGFpbHM6JywgcmVxKTtcbiAgICAvLyBjb25zb2xlLmxvZygnRXJyb3IgZGV0YWlsczonLCBlcnIpO1xuICAgIC8vIEvhur90IHRow7pjIHJlcXVlc3QgbeG7mXQgY8OhY2ggYW4gdG/DoG4gbuG6v3UgY8OzIHRo4buDLCBob+G6t2MgcmUtdGhyb3cgbOG7l2lcbiAgICAvLyDEkOG7gyDEkcahbiBnaeG6o24sIHRhIHPhur0gbG9nIHbDoCBjw7MgdGjhu4MgxJHhu4MgcmVxdWVzdCB0aW1lb3V0IGhv4bq3YyB0cuG6oyB24buBIGzhu5dpIGNodW5nIHTDuXkgY+G6pXUgaMOsbmggc2VydmVybGVzc1xuICAgIC8vIFRyb25nIG3DtGkgdHLGsOG7nW5nIHNlcnZlcmxlc3MsIHRoxrDhu51uZyBraMO0bmcgY8OzIHNlcnZlci5vbignZXJyb3InKSBuaMawIHNlcnZlciB0cnV54buBbiB0aOG7kW5nXG4gICAgLy8gTOG7l2kg4bufIMSRw6J5IGPDsyB0aOG7gyBkbyBjb250ZXh0IGtow7RuZyDEkcO6bmdcbiAgICByZXR1cm47IC8vIFRob8OhdCBraOG7j2kgbWlkZGxld2FyZSDEkeG7gyB0csOhbmggbOG7l2kgdGjDqm1cbiAgfVxuXG4gIGlmIChwYXRoLmluY2x1ZGVzKFwid2ViaG9va1wiKSB8fCBwYXRoLmluY2x1ZGVzKFwiL2FwaS9wYXltZW50cy9cIikpIHtcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgY29kZTogXCIwMFwiLFxuICAgICAgbWVzc2FnZTogXCJSZXF1ZXN0IHJlY2VpdmVkIHdpdGggZXJyb3JcIixcbiAgICAgIGVycm9yOiBlcnIubWVzc2FnZSxcbiAgICB9KTtcbiAgfVxuXG4gIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICBtZXNzYWdlOiBcIkludGVybmFsIHNlcnZlciBlcnJvclwiLFxuICAgIGVycm9yOiBlcnIubWVzc2FnZSxcbiAgfSk7XG59KTtcblxuLy8gU2NoZWR1bGVkIHRhc2tzXG5jb25zdCBzY2hlZHVsZUludGVydmFsSG91cnMgPSA2O1xuY29uc3Qgc2NoZWR1bGVJbnRlcnZhbE1zID0gc2NoZWR1bGVJbnRlcnZhbEhvdXJzICogNjAgKiA2MCAqIDEwMDA7XG5cbmNvbnN0IHJ1blNjaGVkdWxlZFRhc2tzID0gYXN5bmMgKCkgPT4ge1xuICB0cnkge1xuICAgIGF3YWl0IFByb21pc2UuYWxsKFtkZWxldGVFeHBpcmVkVm91Y2hlcnMoKSwgdXBkYXRlUHJvZHVjdEV4cGlyYXRpb25zKCldKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiU2NoZWR1bGVkIHRhc2sgZXJyb3I6XCIsIGVycm9yKTtcbiAgfVxufTtcblxuLy8gR29vZ2xlIE1hcHMgR2VvY29kaW5nIEFQSSBwcm94eSBlbmRwb2ludFxuYXBwLmdldChcIi9hcGkvZ2VvY29kZVwiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IGFkZHJlc3MgfSA9IHJlcS5xdWVyeTtcbiAgICBpZiAoIWFkZHJlc3MpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIHN0YXR1czogXCJaRVJPX1JFU1VMVFNcIixcbiAgICAgICAgZXJyb3JfbWVzc2FnZTogXCJNaXNzaW5nIGFkZHJlc3NcIixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGFwaUtleSA9IHByb2Nlc3MuZW52LkdPT0dMRV9NQVBTX0FQSV9LRVk7XG4gICAgaWYgKCFhcGlLZXkpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICAgIHN0YXR1czogXCJSRVFVRVNUX0RFTklFRFwiLFxuICAgICAgICBlcnJvcl9tZXNzYWdlOiBcIk1pc3NpbmcgR29vZ2xlIE1hcHMgQVBJIGtleVwiLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgdXJsID0gYGh0dHBzOi8vbWFwcy5nb29nbGVhcGlzLmNvbS9tYXBzL2FwaS9nZW9jb2RlL2pzb24/YWRkcmVzcz0ke2VuY29kZVVSSUNvbXBvbmVudChcbiAgICAgIGFkZHJlc3NcbiAgICApfSZyZWdpb249dm4mbGFuZ3VhZ2U9dmkma2V5PSR7YXBpS2V5fWA7XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcblxuICAgIHJlcy5qc29uKGRhdGEpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJHZW9jb2RpbmcgZXJyb3I6XCIsIGVycm9yKTtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICBzdGF0dXM6IFwiRVJST1JcIixcbiAgICAgIGVycm9yX21lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXG4gICAgfSk7XG4gIH1cbn0pO1xuXG4vLyBTdGFydCBzZXJ2ZXIgZnVuY3Rpb25cbmNvbnN0IHN0YXJ0U2VydmVyID0gKHBvcnQpID0+IHtcbiAgY29uc3QgcG9ydE51bWJlciA9IE51bWJlcihwb3J0KSB8fCA4MDgwO1xuICBcbiAgYXBwLmxpc3Rlbihwb3J0TnVtYmVyLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc29sZS5sb2coYFNlcnZlciBydW5uaW5nIG9uIHBvcnQgJHtwb3J0TnVtYmVyfWApO1xuXG4gICAgLy8gUnVuIHNjaGVkdWxlZCB0YXNrcyBpbW1lZGlhdGVseSBvbiBzdGFydFxuICAgIGF3YWl0IHJ1blNjaGVkdWxlZFRhc2tzKCk7XG5cbiAgICAvLyBTY2hlZHVsZSBwZXJpb2RpYyB0YXNrc1xuICAgIHNldEludGVydmFsKHJ1blNjaGVkdWxlZFRhc2tzLCBzY2hlZHVsZUludGVydmFsTXMpO1xuICB9KS5vbignZXJyb3InLCAoZXJyKSA9PiB7XG4gICAgaWYgKGVyci5jb2RlID09PSAnRUFERFJJTlVTRScpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBQb3J0ICR7cG9ydE51bWJlcn0gaXMgYWxyZWFkeSBpbiB1c2UuIFRyeWluZyBwb3J0ICR7cG9ydE51bWJlciArIDF9Li4uYCk7XG4gICAgICBzdGFydFNlcnZlcihwb3J0TnVtYmVyICsgMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1NlcnZlciBlcnJvcjonLCBlcnIpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5zdGFydFNlcnZlcihwcm9jZXNzLmVudi5QT1JUKTtcblxuIl0sIm1hcHBpbmdzIjoiO0FBQ0EsSUFBQUEsUUFBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsS0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsYUFBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsU0FBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksT0FBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUssVUFBQSxHQUFBTixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU0sYUFBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU8sSUFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBOztBQUVBLElBQUFRLHVCQUFBLEdBQUFSLE9BQUE7QUFDQSxJQUFBUyxrQkFBQSxHQUFBVCxPQUFBOzs7O0FBSUEsSUFBQVUsa0JBQUEsR0FBQVgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFXLG1CQUFBLEdBQUFYLE9BQUE7Ozs7Ozs7OztBQVNBQSxPQUFBO0FBQ0FBLE9BQUE7Ozs7Ozs7Ozs7QUFVQSxJQUFBWSxXQUFBLEdBQUFiLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBYSxjQUFBLEdBQUFkLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBYyxlQUFBLEdBQUFmLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBZSxlQUFBLEdBQUFoQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWdCLFdBQUEsR0FBQWpCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBaUIsY0FB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