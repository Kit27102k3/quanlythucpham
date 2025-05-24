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
  const noDbEndpoints = ['/health', '/debug', '/favicon.ico', '/', '/maintenance.html', '/api/status'];

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
        <div class="status ${_database.isMongoConnected ? 'online' : 'offline'}">
          ${_database.isMongoConnected ? '✅ Hệ thống đang hoạt động' : '❌ Database đang ngắt kết nối'}
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZXhwcmVzcyIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwiX2NvcnMiLCJfY29va2llUGFyc2VyIiwiX21vbmdvb3NlIiwiX2RvdGVudiIsIl9ub2RlRmV0Y2giLCJfanNvbndlYnRva2VuIiwiX2RucyIsIl9zYXZlZFZvdWNoZXJDb250cm9sbGVyIiwiX3BheW1lbnRDb250cm9sbGVyIiwiX3JlcG9ydHNDb250cm9sbGVyIiwiX3Byb2R1Y3RzQ29udHJvbGxlciIsIl9hdXRoUm91dGVzIiwiX3NjcmFwZXJSb3V0ZXMiLCJfY2F0ZWdvcnlSb3V0ZXMiLCJfcHJvZHVjdHNSb3V0ZXMiLCJfY2FydFJvdXRlcyIsIl9jaGF0Ym90Um91dGVzIiwiX3BheW1lbnRSb3V0ZXMiLCJfb3JkZXJSb3V0ZXMiLCJfYWRtaW5Sb3V0ZXMiLCJfYWRtaW5BdXRoUm91dGVzIiwiX2Rhc2hib2FyZFJvdXRlcyIsIl90aXBzUm91dGVzIiwiX2NvbnRhY3RSb3V0ZXMiLCJfbWVzc2FnZVJvdXRlcyIsIl9yZXZpZXdSb3V0ZXMiLCJfY291cG9uUm91dGVzIiwiX3NhdmVkVm91Y2hlclJvdXRlcyIsIl9yZXBvcnRSb3V0ZXMiLCJfc3lzdGVtUm91dGVzIiwiX3N1cHBsaWVyUm91dGVzIiwiX2JyYW5kUm91dGVzIiwiX2FwaVJvdXRlcyIsIl9kYXRhYmFzZSIsImUiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImRvdGVudiIsImNvbmZpZyIsInBhdGgiLCJmb3JFYWNoIiwibW9kZWwiLCJtb25nb29zZSIsIm1vZGVscyIsImFwcCIsImV4cHJlc3MiLCJ1c2UiLCJjb3JzIiwib3JpZ2luIiwiY3JlZGVudGlhbHMiLCJtZXRob2RzIiwiYWxsb3dlZEhlYWRlcnMiLCJqc29uIiwibGltaXQiLCJ1cmxlbmNvZGVkIiwiZXh0ZW5kZWQiLCJjb29raWVQYXJzZXIiLCJyZXEiLCJyZXMiLCJuZXh0IiwiYXV0aEhlYWRlciIsImhlYWRlcnMiLCJhdXRob3JpemF0aW9uIiwic3RhcnRzV2l0aCIsInRva2VuIiwic3Vic3RyaW5nIiwic2VjcmV0S2V5IiwicHJvY2VzcyIsImVudiIsIkpXVF9TRUNSRVRfQUNDRVNTIiwiY29uc29sZSIsImVycm9yIiwiZGVjb2RlZCIsImp3dCIsInZlcmlmeSIsInVzZXIiLCJuYW1lIiwid2FybiIsIm1lc3NhZ2UiLCJsb2ciLCJEYXRlIiwidG9JU09TdHJpbmciLCJtZXRob2QiLCJ1cmwiLCJjaGVja0RiQ29ubmVjdGlvbiIsIm5vRGJFbmRwb2ludHMiLCJpc01vbmdvQ29ubmVjdGVkIiwiaW5jbHVkZXMiLCJzdGF0dXMiLCJzdWNjZXNzIiwiY29kZSIsInJlZGlyZWN0IiwiZ2V0Iiwic2VuZCIsImdldEZ1bGxZZWFyIiwibnBtX3BhY2thZ2VfdmVyc2lvbiIsImluaXRpYWxpemVEYXRhYmFzZSIsInRoZW4iLCJjYXRjaCIsImVyciIsImF1dGhSb3V0ZXMiLCJhZG1pbkF1dGhSb3V0ZXMiLCJhZG1pblJvdXRlcyIsImNhdGVnb3J5Um91dGVzIiwic2NyYXBlclJvdXRlcyIsInByb2R1Y3RzUm91dGVzIiwiY2FydFJvdXRlcyIsImNoYXRib3RSb3V0ZXMiLCJwYXltZW50Um91dGVzIiwib3JkZXJSb3V0ZXMiLCJkYXNoYm9hcmRSb3V0ZXMiLCJ0aXBzUm91dGVzIiwiY29udGFjdFJvdXRlcyIsIm1lc3NhZ2VSb3V0ZXMiLCJyZXZpZXdSb3V0ZXMiLCJjb3Vwb25Sb3V0ZXMiLCJzYXZlZFZvdWNoZXJSb3V0ZXMiLCJyZXBvcnRSb3V0ZXMiLCJzeXN0ZW1Sb3V0ZXMiLCJzdXBwbGllclJvdXRlcyIsImJyYW5kUm91dGVzIiwiYXBpUm91dGVzIiwiZ2V0QmVzdFNlbGxpbmdQcm9kdWN0cyIsInJlcG9ydEVuZHBvaW50cyIsInJlcG9ydHNDb250cm9sbGVyIiwiZ2V0RGFzaGJvYXJkU3RhdHMiLCJnZXRSZXZlbnVlRGF0YSIsImdldFRvcFByb2R1Y3RzIiwiZ2V0SW52ZW50b3J5RGF0YSIsImdldFVzZXJEYXRhIiwiZ2V0T3JkZXJEYXRhIiwiZ2V0UHJvbW90aW9uRGF0YSIsImdldFN5c3RlbUFjdGl2aXR5RGF0YSIsImdldERlbGl2ZXJ5RGF0YSIsImdldEZlZWRiYWNrRGF0YSIsImhhbmRsZXIiLCJPYmplY3QiLCJlbnRyaWVzIiwicmVwbGFjZSIsIndlYmhvb2tIYW5kbGVyIiwiYm9keSIsImdhdGV3YXkiLCJ0cmFuc2ZlckFtb3VudCIsImhhbmRsZUJhbmtXZWJob29rIiwiaGFuZGxlU2VwYXlDYWxsYmFjayIsImhlYWRlcnNTZW50IiwicG9zdCIsImRiU3RhdHVzIiwiZ2V0Q29ubmVjdGlvblN0YXR1cyIsInRpbWVzdGFtcCIsIk5PREVfRU5WIiwidXNlckFnZW50IiwiaXAiLCJtb25nb0Nvbm5lY3Rpb24iLCJpc0Nvbm5lY3RlZCIsIm1vbmdvUmVhZHlTdGF0ZSIsImNvbm5lY3Rpb24iLCJyZWFkeVN0YXRlIiwidXB0aW1lIiwiZmFsbGJhY2tNb2RlIiwiZGJDb25uZWN0aW9uQXR0ZW1wdHMiLCJjb25uZWN0aW9uQXR0ZW1wdHMiLCJkYkhvc3QiLCJob3N0IiwiZGJOYW1lIiwiUE9SVCIsIkhPU1QiLCJtb25nbyIsInBvcnQiLCJpbmZvIiwiZW52aXJvbm1lbnQiLCJub2RlRW52Iiwibm9kZVZlcnNpb24iLCJ2ZXJzaW9uIiwicGxhdGZvcm0iLCJhcmNoIiwibWVtb3J5VXNhZ2UiLCJjb25uZWN0aW9uU3RhdGUiLCJjb25uZWN0aW9uUGFyYW1zIiwicmVxdWVzdCIsImlwcyIsIm5ldHdvcmsiLCJkbnNTZXJ2ZXJzIiwiZG5zIiwiZ2V0U2VydmVycyIsIm1haW5Ib3N0IiwiZG5zTG9va3VwUHJvbWlzZSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwibG9va3VwIiwiYWRkcmVzcyIsImRuc1Jlc29sdmVQcm9taXNlIiwiYWRkcmVzc2VzIiwidGltZW91dCIsIl8iLCJzZXRUaW1lb3V0IiwiRXJyb3IiLCJkbnNMb29rdXAiLCJyYWNlIiwiZG5zTG9va3VwRXJyb3IiLCJkbnNSZXNvbHZlIiwiZG5zUmVzb2x2ZUVycm9yIiwiZG5zRXJyIiwiZG5zRXJyb3IiLCJzY2hlZHVsZUludGVydmFsSG91cnMiLCJzY2hlZHVsZUludGVydmFsTXMiLCJydW5TY2hlZHVsZWRUYXNrcyIsImFsbCIsImRlbGV0ZUV4cGlyZWRWb3VjaGVycyIsInVwZGF0ZVByb2R1Y3RFeHBpcmF0aW9ucyIsInF1ZXJ5IiwiZXJyb3JfbWVzc2FnZSIsImFwaUtleSIsIkdPT0dMRV9NQVBTX0FQSV9LRVkiLCJlbmNvZGVVUklDb21wb25lbnQiLCJyZXNwb25zZSIsImZldGNoIiwiZGF0YSIsInN0YXJ0U2VydmVyIiwicG9ydE51bWJlciIsIk51bWJlciIsImxpc3RlbiIsInNldEludGVydmFsIiwib24iXSwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cbmltcG9ydCBleHByZXNzIGZyb20gXCJleHByZXNzXCI7XG5pbXBvcnQgY29ycyBmcm9tIFwiY29yc1wiO1xuaW1wb3J0IGNvb2tpZVBhcnNlciBmcm9tIFwiY29va2llLXBhcnNlclwiO1xuaW1wb3J0IG1vbmdvb3NlIGZyb20gXCJtb25nb29zZVwiO1xuaW1wb3J0IGRvdGVudiBmcm9tIFwiZG90ZW52XCI7XG5pbXBvcnQgZmV0Y2ggZnJvbSBcIm5vZGUtZmV0Y2hcIjtcbmltcG9ydCBqd3QgZnJvbSBcImpzb253ZWJ0b2tlblwiO1xuaW1wb3J0IGRucyBmcm9tIFwiZG5zXCI7XG5cbmltcG9ydCB7IGRlbGV0ZUV4cGlyZWRWb3VjaGVycyB9IGZyb20gXCIuL0NvbnRyb2xsZXIvc2F2ZWRWb3VjaGVyQ29udHJvbGxlci5qc1wiO1xuaW1wb3J0IHtcbiAgaGFuZGxlU2VwYXlDYWxsYmFjayxcbiAgaGFuZGxlQmFua1dlYmhvb2ssXG59IGZyb20gXCIuL0NvbnRyb2xsZXIvcGF5bWVudENvbnRyb2xsZXIuanNcIjtcbmltcG9ydCByZXBvcnRzQ29udHJvbGxlciBmcm9tIFwiLi9Db250cm9sbGVyL3JlcG9ydHNDb250cm9sbGVyLmpzXCI7XG5pbXBvcnQge1xuICBnZXRCZXN0U2VsbGluZ1Byb2R1Y3RzLFxuICB1cGRhdGVQcm9kdWN0RXhwaXJhdGlvbnMsXG59IGZyb20gXCIuL0NvbnRyb2xsZXIvcHJvZHVjdHNDb250cm9sbGVyLmpzXCI7XG5cbi8vIExvYWQgZW52IHZhcmlhYmxlc1xuZG90ZW52LmNvbmZpZyh7IHBhdGg6IFwiLmVudlwiIH0pO1xuXG4vLyBJbXBvcnQgbW9kZWxzIHRvIGF2b2lkIE92ZXJ3cml0ZU1vZGVsRXJyb3JcbmltcG9ydCBcIi4vTW9kZWwvUmV2aWV3LmpzXCI7XG5pbXBvcnQgXCIuL01vZGVsL1Jldmlld1N0YXRzLmpzXCI7XG5cbi8vIENsZWFyIG1vZGVsIGNhY2hlIGZvciBzcGVjaWZpYyBtb2RlbHMgdG8gYXZvaWQgb3ZlcndyaXRlIGVycm9ycyBvbiBob3QgcmVsb2Fkc1xuW1wiTWVzc2FnZXNcIiwgXCJDb252ZXJzYXRpb25cIl0uZm9yRWFjaCgobW9kZWwpID0+IHtcbiAgaWYgKG1vbmdvb3NlLm1vZGVsc1ttb2RlbF0pIHtcbiAgICBkZWxldGUgbW9uZ29vc2UubW9kZWxzW21vZGVsXTtcbiAgfVxufSk7XG5cbi8vIEltcG9ydCByb3V0ZXNcbmltcG9ydCBhdXRoUm91dGVzIGZyb20gXCIuL3JvdXRlcy9hdXRoUm91dGVzLmpzXCI7XG5pbXBvcnQgc2NyYXBlclJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvc2NyYXBlclJvdXRlcy5qc1wiO1xuaW1wb3J0IGNhdGVnb3J5Um91dGVzIGZyb20gXCIuL3JvdXRlcy9jYXRlZ29yeVJvdXRlcy5qc1wiO1xuaW1wb3J0IHByb2R1Y3RzUm91dGVzIGZyb20gXCIuL3JvdXRlcy9wcm9kdWN0c1JvdXRlcy5qc1wiO1xuaW1wb3J0IGNhcnRSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL2NhcnRSb3V0ZXMuanNcIjtcbmltcG9ydCB7IGNoYXRib3RSb3V0ZXMgfSBmcm9tIFwiLi9yb3V0ZXMvY2hhdGJvdFJvdXRlcy5qc1wiO1xuaW1wb3J0IHBheW1lbnRSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL3BheW1lbnRSb3V0ZXMuanNcIjtcbmltcG9ydCBvcmRlclJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvb3JkZXJSb3V0ZXMuanNcIjtcbmltcG9ydCBhZG1pblJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvYWRtaW5Sb3V0ZXMuanNcIjtcbmltcG9ydCBhZG1pbkF1dGhSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL2FkbWluQXV0aFJvdXRlcy5qc1wiO1xuaW1wb3J0IGRhc2hib2FyZFJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvZGFzaGJvYXJkUm91dGVzLmpzXCI7XG5pbXBvcnQgdGlwc1JvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvdGlwc1JvdXRlcy5qc1wiO1xuaW1wb3J0IGNvbnRhY3RSb3V0ZXMgZnJvbSBcIi4vcm91dGVzL2NvbnRhY3RSb3V0ZXMuanNcIjtcbmltcG9ydCBtZXNzYWdlUm91dGVzIGZyb20gXCIuL3JvdXRlcy9tZXNzYWdlUm91dGVzLmpzXCI7XG5pbXBvcnQgcmV2aWV3Um91dGVzIGZyb20gXCIuL3JvdXRlcy9yZXZpZXdSb3V0ZXMuanNcIjtcbmltcG9ydCBjb3Vwb25Sb3V0ZXMgZnJvbSBcIi4vcm91dGVzL2NvdXBvblJvdXRlcy5qc1wiO1xuaW1wb3J0IHNhdmVkVm91Y2hlclJvdXRlcyBmcm9tIFwiLi9yb3V0ZXMvc2F2ZWRWb3VjaGVyUm91dGVzLmpzXCI7XG5pbXBvcnQgcmVwb3J0Um91dGVzIGZyb20gXCIuL3JvdXRlcy9yZXBvcnRSb3V0ZXMuanNcIjtcbmltcG9ydCBzeXN0ZW1Sb3V0ZXMgZnJvbSBcIi4vcm91dGVzL3N5c3RlbVJvdXRlcy5qc1wiO1xuaW1wb3J0IHN1cHBsaWVyUm91dGVzIGZyb20gXCIuL3JvdXRlcy9zdXBwbGllclJvdXRlcy5qc1wiO1xuaW1wb3J0IGJyYW5kUm91dGVzIGZyb20gXCIuL3JvdXRlcy9icmFuZFJvdXRlcy5qc1wiO1xuaW1wb3J0IGFwaVJvdXRlcyBmcm9tICcuL3JvdXRlcy9hcGlSb3V0ZXMuanMnO1xuXG4vLyBJbXBvcnQgZGF0YWJhc2UgY29uZmlnIG3hu5tpXG5pbXBvcnQgeyBpbml0aWFsaXplRGF0YWJhc2UsIGdldENvbm5lY3Rpb25TdGF0dXMsIGlzTW9uZ29Db25uZWN0ZWQgfSBmcm9tICcuL2NvbmZpZy9kYXRhYmFzZS5qcyc7XG5cbmNvbnN0IGFwcCA9IGV4cHJlc3MoKTtcblxuLy8gQ09SUyBjb25maWd1cmF0aW9uXG5hcHAudXNlKFxuICBjb3JzKHtcbiAgICBvcmlnaW46IFwiKlwiLCAvLyBDaG8gcGjDqXAgdOG6pXQgY+G6oyBjw6FjIG9yaWdpbiBcbiAgICBjcmVkZW50aWFsczogdHJ1ZSxcbiAgICBtZXRob2RzOiBbXCJHRVRcIiwgXCJQT1NUXCIsIFwiUFVUXCIsIFwiREVMRVRFXCIsIFwiUEFUQ0hcIiwgXCJPUFRJT05TXCJdLFxuICAgIGFsbG93ZWRIZWFkZXJzOiBbXCJDb250ZW50LVR5cGVcIiwgXCJBdXRob3JpemF0aW9uXCIsIFwiWC1SZXF1ZXN0ZWQtV2l0aFwiLCBcIlgtQWNjZXNzLVRva2VuXCIsIFwiQWNjZXB0XCIsIFwiT3JpZ2luXCJdXG4gIH0pXG4pO1xuXG4vLyBNaWRkbGV3YXJlIGZvciBKU09OIGFuZCBVUkwgZW5jb2RlZCBib2RpZXMgKDUwbWIgbGltaXQpXG5hcHAudXNlKGV4cHJlc3MuanNvbih7IGxpbWl0OiBcIjUwbWJcIiB9KSk7XG5hcHAudXNlKGV4cHJlc3MudXJsZW5jb2RlZCh7IGV4dGVuZGVkOiB0cnVlLCBsaW1pdDogXCI1MG1iXCIgfSkpO1xuYXBwLnVzZShjb29raWVQYXJzZXIoKSk7XG5cbi8vIEpXVCBBdXRoZW50aWNhdGlvbiBtaWRkbGV3YXJlXG5hcHAudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgIGNvbnN0IGF1dGhIZWFkZXIgPSByZXEuaGVhZGVycy5hdXRob3JpemF0aW9uO1xuICBpZiAoYXV0aEhlYWRlciAmJiBhdXRoSGVhZGVyLnN0YXJ0c1dpdGgoXCJCZWFyZXIgXCIpKSB7XG4gICAgICBjb25zdCB0b2tlbiA9IGF1dGhIZWFkZXIuc3Vic3RyaW5nKDcpO1xuICAgIGNvbnN0IHNlY3JldEtleSA9IHByb2Nlc3MuZW52LkpXVF9TRUNSRVRfQUNDRVNTO1xuXG4gICAgaWYgKCFzZWNyZXRLZXkpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJKV1RfU0VDUkVUIGlzIG5vdCBkZWZpbmVkIGluIGVudmlyb25tZW50IHZhcmlhYmxlc1wiKTtcbiAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgfVxuICAgICAgXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBkZWNvZGVkID0gand0LnZlcmlmeSh0b2tlbiwgc2VjcmV0S2V5KTtcbiAgICAgICAgcmVxLnVzZXIgPSBkZWNvZGVkO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIC8vIENo4buJIGxvZyBs4buXaSBu4bq/dSBraMO0bmcgcGjhuqNpIGzhu5dpIHRva2VuIGjhur90IGjhuqFuXG4gICAgICBpZiAoZXJyb3IubmFtZSAhPT0gJ1Rva2VuRXhwaXJlZEVycm9yJykge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJJbnZhbGlkIEpXVCB0b2tlbjpcIiwgZXJyb3IubWVzc2FnZSk7XG4gICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIG5leHQoKTtcbn0pO1xuXG4vLyBSZXF1ZXN0IGxvZ2dpbmcgbWlkZGxld2FyZVxuYXBwLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcbiAgY29uc29sZS5sb2coYFske25ldyBEYXRlKCkudG9JU09TdHJpbmcoKX1dICR7cmVxLm1ldGhvZH0gJHtyZXEudXJsfSAtIFVzZXIgQWdlbnQ6ICR7cmVxLmhlYWRlcnNbJ3VzZXItYWdlbnQnXX1gKTtcbiAgbmV4dCgpO1xufSk7XG5cbi8vIE1pZGRsZXdhcmUga2nhu4NtIHRyYSBr4bq/dCBu4buRaSBEQiB0csaw4bubYyBraGkgeOG7rSBsw70gcmVxdWVzdCBj4bqnbiBEQlxuY29uc3QgY2hlY2tEYkNvbm5lY3Rpb24gPSAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgLy8gRGFuaCBzw6FjaCBjw6FjIGVuZHBvaW50IGtow7RuZyBj4bqnbiBr4bq/dCBu4buRaSBEQlxuICBjb25zdCBub0RiRW5kcG9pbnRzID0gWycvaGVhbHRoJywgJy9kZWJ1ZycsICcvZmF2aWNvbi5pY28nLCAnLycsICcvbWFpbnRlbmFuY2UuaHRtbCcsICcvYXBpL3N0YXR1cyddO1xuICBcbiAgaWYgKGlzTW9uZ29Db25uZWN0ZWQgfHwgbm9EYkVuZHBvaW50cy5pbmNsdWRlcyhyZXEucGF0aCkpIHtcbiAgICByZXR1cm4gbmV4dCgpO1xuICB9XG4gIFxuICAvLyBLaeG7g20gdHJhIHhlbSByZXF1ZXN0IGPDsyBwaOG6o2kgbMOgIEFQSSBoYXkga2jDtG5nXG4gIGlmIChyZXEucGF0aC5zdGFydHNXaXRoKCcvYXBpLycpKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAzKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCJE4buLY2ggduG7pSBkYXRhYmFzZSB04bqhbSB0aOG7nWkga2jDtG5nIGto4bqjIGThu6VuZy4gVnVpIGzDsm5nIHRo4butIGzhuqFpIHNhdS5cIixcbiAgICAgIGNvZGU6IFwiREJfVU5BVkFJTEFCTEVcIlxuICAgIH0pO1xuICB9XG4gIFxuICAvLyBO4bq/dSBsw6AgcmVxdWVzdCB0cmFuZyB3ZWIgdGjDrCByZWRpcmVjdCB24buBIHRyYW5nIHRow7RuZyBiw6FvIGLhuqNvIHRyw6xcbiAgcmVzLnJlZGlyZWN0KCcvbWFpbnRlbmFuY2UuaHRtbCcpO1xufTtcblxuLy8gVOG6oW8gdHJhbmcgYuG6o28gdHLDrCDEkcahbiBnaeG6o25cbmFwcC5nZXQoJy9tYWludGVuYW5jZS5odG1sJywgKHJlcSwgcmVzKSA9PiB7XG4gIHJlcy5zZW5kKGBcbiAgICA8IURPQ1RZUEUgaHRtbD5cbiAgICA8aHRtbD5cbiAgICA8aGVhZD5cbiAgICAgIDx0aXRsZT5C4bqjbyB0csOsIGjhu4cgdGjhu5FuZzwvdGl0bGU+XG4gICAgICA8bWV0YSBuYW1lPVwidmlld3BvcnRcIiBjb250ZW50PVwid2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMFwiPlxuICAgICAgPHN0eWxlPlxuICAgICAgICBib2R5IHsgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmOyB0ZXh0LWFsaWduOiBjZW50ZXI7IHBhZGRpbmc6IDUwcHggMjBweDsgfVxuICAgICAgICBoMSB7IGNvbG9yOiAjZTUzOTM1OyB9XG4gICAgICAgIHAgeyBjb2xvcjogIzMzMzsgbWF4LXdpZHRoOiA2MDBweDsgbWFyZ2luOiAyMHB4IGF1dG87IH1cbiAgICAgICAgYnV0dG9uIHsgYmFja2dyb3VuZDogIzRjYWY1MDsgY29sb3I6IHdoaXRlOyBib3JkZXI6IG5vbmU7IHBhZGRpbmc6IDEwcHggMjBweDsgYm9yZGVyLXJhZGl1czogNHB4OyBjdXJzb3I6IHBvaW50ZXI7IH1cbiAgICAgIDwvc3R5bGU+XG4gICAgPC9oZWFkPlxuICAgIDxib2R5PlxuICAgICAgPGgxPkjhu4cgdGjhu5FuZyDEkWFuZyDEkcaw4bujYyBi4bqjbyB0csOsPC9oMT5cbiAgICAgIDxwPkNow7puZyB0w7RpIMSRYW5nIGfhurdwIHbhuqVuIMSR4buBIGvhur90IG7hu5FpIMSR4bq/biBjxqEgc+G7nyBk4buvIGxp4buHdS4gVnVpIGzDsm5nIHRo4butIGzhuqFpIHNhdSBob+G6t2MgbGnDqm4gaOG7hyB24bubaSBjaMO6bmcgdMO0aSBu4bq/dSB24bqlbiDEkeG7gSBrw6lvIGTDoGkuPC9wPlxuICAgICAgPHA+SG90bGluZTogMDMyNiA3NDMzOTE8L3A+XG4gICAgICA8YnV0dG9uIG9uY2xpY2s9XCJ3aW5kb3cubG9jYXRpb24ucmVsb2FkKClcIj5UaOG7rSBs4bqhaTwvYnV0dG9uPlxuICAgIDwvYm9keT5cbiAgICA8L2h0bWw+XG4gIGApO1xufSk7XG5cbi8vIFRyYW5nIGNo4bunIG3hurdjIMSR4buLbmhcbmFwcC5nZXQoJy8nLCAocmVxLCByZXMpID0+IHtcbiAgcmVzLnNlbmQoYFxuICAgIDwhRE9DVFlQRSBodG1sPlxuICAgIDxodG1sPlxuICAgIDxoZWFkPlxuICAgICAgPHRpdGxlPlF14bqjbiBMw70gVGjhu7FjIFBo4bqpbSBBUEk8L3RpdGxlPlxuICAgICAgPG1ldGEgbmFtZT1cInZpZXdwb3J0XCIgY29udGVudD1cIndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjBcIj5cbiAgICAgIDxzdHlsZT5cbiAgICAgICAgYm9keSB7IGZvbnQtZmFtaWx5OiBBcmlhbCwgc2Fucy1zZXJpZjsgdGV4dC1hbGlnbjogY2VudGVyOyBwYWRkaW5nOiA1MHB4IDIwcHg7IGJhY2tncm91bmQtY29sb3I6ICNmNWY1ZjU7IH1cbiAgICAgICAgLmNvbnRhaW5lciB7IG1heC13aWR0aDogODAwcHg7IG1hcmdpbjogMCBhdXRvOyBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTsgcGFkZGluZzogMzBweDsgYm9yZGVyLXJhZGl1czogMTBweDsgYm94LXNoYWRvdzogMCAycHggMTBweCByZ2JhKDAsMCwwLDAuMSk7IH1cbiAgICAgICAgaDEgeyBjb2xvcjogIzJlN2QzMjsgbWFyZ2luLWJvdHRvbTogMzBweDsgfVxuICAgICAgICAuc3RhdHVzIHsgZGlzcGxheTogaW5saW5lLWJsb2NrOyBwYWRkaW5nOiA4cHggMTVweDsgYm9yZGVyLXJhZGl1czogMjBweDsgZm9udC13ZWlnaHQ6IGJvbGQ7IG1hcmdpbi1ib3R0b206IDIwcHg7IH1cbiAgICAgICAgLnN0YXR1cy5vbmxpbmUgeyBiYWNrZ3JvdW5kLWNvbG9yOiAjZThmNWU5OyBjb2xvcjogIzJlN2QzMjsgfVxuICAgICAgICAuc3RhdHVzLm9mZmxpbmUgeyBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZlYmVlOyBjb2xvcjogI2M2MjgyODsgfVxuICAgICAgICAuZW5kcG9pbnRzIHsgdGV4dC1hbGlnbjogbGVmdDsgYmFja2dyb3VuZC1jb2xvcjogI2Y1ZjVmNTsgcGFkZGluZzogMjBweDsgYm9yZGVyLXJhZGl1czogNXB4OyBtYXJnaW4tdG9wOiAyMHB4OyB9XG4gICAgICAgIC5lbmRwb2ludHMgaDMgeyBtYXJnaW4tdG9wOiAwOyB9XG4gICAgICAgIC5lbmRwb2ludCB7IG1hcmdpbi1ib3R0b206IDEwcHg7IHBhZGRpbmc6IDVweDsgfVxuICAgICAgICAuZW5kcG9pbnQgY29kZSB7IGJhY2tncm91bmQtY29sb3I6ICNlMGUwZTA7IHBhZGRpbmc6IDNweCA2cHg7IGJvcmRlci1yYWRpdXM6IDNweDsgfVxuICAgICAgICBmb290ZXIgeyBtYXJnaW4tdG9wOiAzMHB4OyBjb2xvcjogIzc1NzU3NTsgZm9udC1zaXplOiAwLjllbTsgfVxuICAgICAgPC9zdHlsZT5cbiAgICA8L2hlYWQ+XG4gICAgPGJvZHk+XG4gICAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgICAgIDxoMT5RdeG6o24gTMO9IFRo4buxYyBQaOG6qW0gQVBJPC9oMT5cbiAgICAgICAgPGRpdiBjbGFzcz1cInN0YXR1cyAke2lzTW9uZ29Db25uZWN0ZWQgPyAnb25saW5lJyA6ICdvZmZsaW5lJ31cIj5cbiAgICAgICAgICAke2lzTW9uZ29Db25uZWN0ZWQgPyAn4pyFIEjhu4cgdGjhu5FuZyDEkWFuZyBob+G6oXQgxJHhu5luZycgOiAn4p2MIERhdGFiYXNlIMSRYW5nIG5n4bqvdCBr4bq/dCBu4buRaSd9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICBcbiAgICAgICAgPHA+xJDDonkgbMOgIEFQSSBzZXJ2ZXIgY2hvIOG7qW5nIGThu6VuZyBRdeG6o24gTMO9IFRo4buxYyBQaOG6qW0uIFZ1aSBsw7JuZyBz4butIGThu6VuZyBjbGllbnQgYXBwIMSR4buDIHRydXkgY+G6rXAgZOG7i2NoIHbhu6UuPC9wPlxuICAgICAgICBcbiAgICAgICAgPGRpdiBjbGFzcz1cImVuZHBvaW50c1wiPlxuICAgICAgICAgIDxoMz5Dw6FjIGVuZHBvaW50IGNow61uaDo8L2gzPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJlbmRwb2ludFwiPlxuICAgICAgICAgICAgPGNvZGU+R0VUIC9oZWFsdGg8L2NvZGU+IC0gS2nhu4NtIHRyYSB0cuG6oW5nIHRow6FpIGjhu4cgdGjhu5FuZ1xuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJlbmRwb2ludFwiPlxuICAgICAgICAgICAgPGNvZGU+R0VUIC9hcGkvcHJvZHVjdHM8L2NvZGU+IC0gRGFuaCBzw6FjaCBz4bqjbiBwaOG6qW1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZW5kcG9pbnRcIj5cbiAgICAgICAgICAgIDxjb2RlPkdFVCAvYXBpL2NhdGVnb3JpZXM8L2NvZGU+IC0gRGFuaCBzw6FjaCBkYW5oIG3hu6VjXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImVuZHBvaW50XCI+XG4gICAgICAgICAgICA8Y29kZT5HRVQgL2FwaS9kYi9zdGF0dXM8L2NvZGU+IC0gVHLhuqFuZyB0aMOhaSBr4bq/dCBu4buRaSBkYXRhYmFzZVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgXG4gICAgICAgIDxmb290ZXI+XG4gICAgICAgICAgPHA+wqkgJHtuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCl9IFF14bqjbiBMw70gVGjhu7FjIFBo4bqpbSAtIFBoacOqbiBi4bqjbiAke3Byb2Nlc3MuZW52Lm5wbV9wYWNrYWdlX3ZlcnNpb24gfHwgJzEuMC4wJ308L3A+XG4gICAgICAgIDwvZm9vdGVyPlxuICAgICAgPC9kaXY+XG4gICAgPC9ib2R5PlxuICAgIDwvaHRtbD5cbiAgYCk7XG59KTtcblxuLy8gw4FwIGThu6VuZyBtaWRkbGV3YXJlIGtp4buDbSB0cmEgREIgY2hvIHThuqV0IGPhuqMgY8OhYyByZXF1ZXN0XG5hcHAudXNlKGNoZWNrRGJDb25uZWN0aW9uKTtcblxuLy8gS2jhu59pIHThuqFvIGvhur90IG7hu5FpIMSR4bq/biBkYXRhYmFzZVxuaW5pdGlhbGl6ZURhdGFiYXNlKCkudGhlbigoKSA9PiB7XG4gIGNvbnNvbGUubG9nKFwiRGF0YWJhc2UgaW5pdGlhbGl6YXRpb24gY29tcGxldGVkXCIpO1xufSkuY2F0Y2goZXJyID0+IHtcbiAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBpbml0aWFsaXplIGRhdGFiYXNlOlwiLCBlcnIpO1xuICBjb25zb2xlLmxvZyhcIlNlcnZlciB3aWxsIHJ1biBpbiBmYWxsYmFjayBtb2RlXCIpO1xufSk7XG5cbi8vIFJlZ2lzdGVyIEFQSSByb3V0ZXNcbmFwcC51c2UoXCIvYXV0aFwiLCBhdXRoUm91dGVzKTtcbmFwcC51c2UoXCIvYWRtaW4vYXV0aFwiLCBhZG1pbkF1dGhSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGlcIiwgYWRtaW5Sb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvY2F0ZWdvcmllc1wiLCBjYXRlZ29yeVJvdXRlcyk7XG5hcHAudXNlKFwiL2FwaVwiLCBzY3JhcGVyUm91dGVzKTtcbmFwcC51c2UoXCIvYXBpXCIsIHByb2R1Y3RzUm91dGVzKTtcbmFwcC51c2UoXCIvYXBpL2NhcnRcIiwgY2FydFJvdXRlcyk7XG5hcHAudXNlKFwiL2FwaS9jaGF0Ym90XCIsIGNoYXRib3RSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvcGF5bWVudHNcIiwgcGF5bWVudFJvdXRlcyk7XG5hcHAudXNlKFwiL29yZGVyc1wiLCBvcmRlclJvdXRlcyk7XG5hcHAudXNlKFwiL2FwaS9kYXNoYm9hcmRcIiwgZGFzaGJvYXJkUm91dGVzKTtcbmFwcC51c2UoXCIvYXBpXCIsIHRpcHNSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvY29udGFjdFwiLCBjb250YWN0Um91dGVzKTtcbmFwcC51c2UoXCIvYXBpL21lc3NhZ2VzXCIsIG1lc3NhZ2VSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvcmV2aWV3c1wiLCByZXZpZXdSb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvY291cG9uc1wiLCBjb3Vwb25Sb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvc2F2ZWQtdm91Y2hlcnNcIiwgc2F2ZWRWb3VjaGVyUm91dGVzKTtcbmFwcC51c2UoXCIvYXBpL3JlcG9ydHNcIiwgcmVwb3J0Um91dGVzKTtcbmFwcC51c2UoXCIvYXBpL3N5c3RlbVwiLCBzeXN0ZW1Sb3V0ZXMpO1xuYXBwLnVzZShcIi9hcGkvc3VwcGxpZXJzXCIsIHN1cHBsaWVyUm91dGVzKTtcbmFwcC51c2UoXCIvYXBpL2JyYW5kc1wiLCBicmFuZFJvdXRlcyk7XG5hcHAudXNlKCcvYXBpL2RiJywgYXBpUm91dGVzKTtcblxuLy8gRGlyZWN0IHByb2R1Y3QgYmVzdCBzZWxsZXJzIGVuZHBvaW50XG5hcHAuZ2V0KFwiL2FwaS9wcm9kdWN0cy9iZXN0LXNlbGxlcnNcIiwgZ2V0QmVzdFNlbGxpbmdQcm9kdWN0cyk7XG5cbi8vIFJlcG9ydHMgZW5kcG9pbnRzIHJlZ2lzdHJhdGlvbiAobWFwcGluZyBwYXRoIC0+IGhhbmRsZXIpXG5jb25zdCByZXBvcnRFbmRwb2ludHMgPSB7XG4gIFwiL2FwaS9kYXNoYm9hcmQvc3RhdHNcIjogcmVwb3J0c0NvbnRyb2xsZXIuZ2V0RGFzaGJvYXJkU3RhdHMsXG4gIFwiL2FwaS9hbmFseXRpY3MvcmV2ZW51ZVwiOiByZXBvcnRzQ29udHJvbGxlci5nZXRSZXZlbnVlRGF0YSxcbiAgXCIvYXBpL2FuYWx5dGljcy90b3AtcHJvZHVjdHNcIjogcmVwb3J0c0NvbnRyb2xsZXIuZ2V0VG9wUHJvZHVjdHMsXG4gIFwiL2FwaS9wcm9kdWN0cy9pbnZlbnRvcnlcIjogcmVwb3J0c0NvbnRyb2xsZXIuZ2V0SW52ZW50b3J5RGF0YSxcbiAgXCIvYXBpL3VzZXJzL3N0YXRzXCI6IHJlcG9ydHNDb250cm9sbGVyLmdldFVzZXJEYXRhLFxuICBcIi9hcGkvb3JkZXJzL3N0YXRzXCI6IHJlcG9ydHNDb250cm9sbGVyLmdldE9yZGVyRGF0YSxcbiAgXCIvYXBpL2NvdXBvbnMvc3RhdHNcIjogcmVwb3J0c0NvbnRyb2xsZXIuZ2V0UHJvbW90aW9uRGF0YSxcbiAgXCIvYXBpL2FkbWluL2FjdGl2aXR5LWxvZ3NcIjogcmVwb3J0c0NvbnRyb2xsZXIuZ2V0U3lzdGVtQWN0aXZpdHlEYXRhLFxuICBcIi9hcGkvb3JkZXJzL2RlbGl2ZXJ5LXN0YXRzXCI6IHJlcG9ydHNDb250cm9sbGVyLmdldERlbGl2ZXJ5RGF0YSxcbiAgXCIvYXBpL3Jldmlld3Mvc3RhdHNcIjogcmVwb3J0c0NvbnRyb2xsZXIuZ2V0RmVlZGJhY2tEYXRhLFxufTtcblxuLy8gUmVnaXN0ZXIgcmVwb3J0IGVuZHBvaW50cyBhbmQgdGhlaXIgYWxpYXNlcyB1bmRlciAvYXBpL3JlcG9ydHNcbmZvciAoY29uc3QgW3BhdGgsIGhhbmRsZXJdIG9mIE9iamVjdC5lbnRyaWVzKHJlcG9ydEVuZHBvaW50cykpIHtcbiAgYXBwLmdldChwYXRoLCBoYW5kbGVyKTtcbiAgYXBwLmdldChgL2FwaS9yZXBvcnRzJHtwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCBcIlwiKX1gLCBoYW5kbGVyKTtcbn1cblxuLy8gV2ViaG9vayBoYW5kbGVyIGZ1bmN0aW9uXG5jb25zdCB3ZWJob29rSGFuZGxlciA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGlmIChyZXEuYm9keS5nYXRld2F5ID09PSBcIk1CQmFua1wiIHx8IHJlcS5ib2R5LnRyYW5zZmVyQW1vdW50KSB7XG4gICAgICAgIGF3YWl0IGhhbmRsZUJhbmtXZWJob29rKHJlcSwgcmVzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IGhhbmRsZVNlcGF5Q2FsbGJhY2socmVxLCByZXMpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXJlcy5oZWFkZXJzU2VudCkge1xuICAgICAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICBjb2RlOiBcIjAwXCIsXG4gICAgICAgICAgbWVzc2FnZTogXCJXZWJob29rIHByb2Nlc3NlZCBzdWNjZXNzZnVsbHlcIixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiV2ViaG9vayBlcnJvcjpcIiwgZXJyb3IpO1xuICAgICAgaWYgKCFyZXMuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgY29kZTogXCIwMFwiLFxuICAgICAgICAgIG1lc3NhZ2U6IFwiV2ViaG9vayByZWNlaXZlZCB3aXRoIGVycm9yXCIsXG4gICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG59O1xuXG4vLyBSZWdpc3RlciB3ZWJob29rIHJvdXRlc1xuW1xuICBcIi93ZWJob29rXCIsXG4gIFwiL2FwaS93ZWJob29rXCIsXG4gIFwiL2FwaS93ZWJob29rL2JhbmtcIixcbiAgXCIvYXBpL3BheW1lbnRzL3dlYmhvb2tcIixcbiAgXCIvYXBpL3BheW1lbnRzL3dlYmhvb2svYmFua1wiLFxuICBcIi9hcGkvcGF5bWVudHMvc2VwYXkvd2ViaG9va1wiLFxuXS5mb3JFYWNoKChwYXRoKSA9PiBhcHAucG9zdChwYXRoLCB3ZWJob29rSGFuZGxlcikpO1xuXG4vLyBFbmhhbmNlZCBoZWFsdGggY2hlY2sgZW5kcG9pbnRcbmFwcC5nZXQoXCIvaGVhbHRoXCIsIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCBkYlN0YXR1cyA9IGdldENvbm5lY3Rpb25TdGF0dXMoKTtcbiAgXG4gIHJlcy5qc29uKHtcbiAgICBzdGF0dXM6IFwib2tcIixcbiAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICBlbnY6IHByb2Nlc3MuZW52Lk5PREVfRU5WIHx8IFwiZGV2ZWxvcG1lbnRcIixcbiAgICB1c2VyQWdlbnQ6IHJlcS5oZWFkZXJzWyd1c2VyLWFnZW50J10sXG4gICAgaXA6IHJlcS5pcCB8fCByZXEuaGVhZGVyc1sneC1mb3J3YXJkZWQtZm9yJ10gfHwgJ3Vua25vd24nLFxuICAgIG1vbmdvQ29ubmVjdGlvbjogZGJTdGF0dXMuaXNDb25uZWN0ZWQgPyBcImNvbm5lY3RlZFwiIDogXCJkaXNjb25uZWN0ZWRcIixcbiAgICBtb25nb1JlYWR5U3RhdGU6IG1vbmdvb3NlLmNvbm5lY3Rpb24ucmVhZHlTdGF0ZSxcbiAgICB1cHRpbWU6IHByb2Nlc3MudXB0aW1lKCksXG4gICAgZmFsbGJhY2tNb2RlOiAhZGJTdGF0dXMuaXNDb25uZWN0ZWQsXG4gICAgZGJDb25uZWN0aW9uQXR0ZW1wdHM6IGRiU3RhdHVzLmNvbm5lY3Rpb25BdHRlbXB0cyxcbiAgICBkYkhvc3Q6IGRiU3RhdHVzLmhvc3QsXG4gICAgZGJOYW1lOiBkYlN0YXR1cy5kYk5hbWVcbiAgfSk7XG59KTtcblxuLy8gRW5kcG9pbnQgxJHhu4Mga2nhu4NtIHRyYSB0aMO0bmcgdGluIGNoaSB0aeG6v3QgKGNo4buJIGTDuW5nIHRyb25nIGRldmVsb3BtZW50KVxuYXBwLmdldChcIi9kZWJ1Z1wiLCAocmVxLCByZXMpID0+IHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicpIHtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oe1xuICAgICAgbWVzc2FnZTogXCJEZWJ1ZyBlbmRwb2ludCBpcyBkaXNhYmxlZCBpbiBwcm9kdWN0aW9uXCJcbiAgICB9KTtcbiAgfVxuICBcbiAgcmVzLmpzb24oe1xuICAgIGVudjoge1xuICAgICAgTk9ERV9FTlY6IHByb2Nlc3MuZW52Lk5PREVfRU5WLFxuICAgICAgUE9SVDogcHJvY2Vzcy5lbnYuUE9SVCxcbiAgICAgIEhPU1Q6IHByb2Nlc3MuZW52LkhPU1RcbiAgICB9LFxuICAgIGhlYWRlcnM6IHJlcS5oZWFkZXJzLFxuICAgIG1vbmdvOiB7XG4gICAgICBob3N0OiBtb25nb29zZS5jb25uZWN0aW9uLmhvc3QsXG4gICAgICBwb3J0OiBtb25nb29zZS5jb25uZWN0aW9uLnBvcnQsXG4gICAgICBuYW1lOiBtb25nb29zZS5jb25uZWN0aW9uLm5hbWUsXG4gICAgICByZWFkeVN0YXRlOiBtb25nb29zZS5jb25uZWN0aW9uLnJlYWR5U3RhdGVcbiAgICB9XG4gIH0pO1xufSk7XG5cbi8vIFRow6ptIGVuZHBvaW50IGhp4buHbiB0aOG7iyB0aMO0bmcgdGluIGNoaSB0aeG6v3QgduG7gSBr4bq/dCBu4buRaSBNb25nb0RCXG5hcHAuZ2V0KCcvbW9uZ29kYi1kZWJ1ZycsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIC8vIENo4buJIGNobyBwaMOpcCB0cm9uZyBtw7RpIHRyxrDhu51uZyBkZXZlbG9wbWVudFxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oeyBtZXNzYWdlOiAnRm9yYmlkZGVuIGluIHByb2R1Y3Rpb24gZW52aXJvbm1lbnQnIH0pO1xuICAgIH1cblxuICAgIC8vIFRodSB0aOG6rXAgdGjDtG5nIHRpbiBjaGkgdGnhur90IHbhu4EgbcO0aSB0csaw4budbmcgdsOgIGvhur90IG7hu5FpXG4gICAgY29uc3QgaW5mbyA9IHtcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIG5vZGVFbnY6IHByb2Nlc3MuZW52Lk5PREVfRU5WIHx8ICdkZXZlbG9wbWVudCcsXG4gICAgICAgIG5vZGVWZXJzaW9uOiBwcm9jZXNzLnZlcnNpb24sXG4gICAgICAgIHBsYXRmb3JtOiBwcm9jZXNzLnBsYXRmb3JtLFxuICAgICAgICBhcmNoOiBwcm9jZXNzLmFyY2gsXG4gICAgICAgIHVwdGltZTogcHJvY2Vzcy51cHRpbWUoKSxcbiAgICAgICAgbWVtb3J5VXNhZ2U6IHByb2Nlc3MubWVtb3J5VXNhZ2UoKSxcbiAgICAgIH0sXG4gICAgICBtb25nb29zZToge1xuICAgICAgICB2ZXJzaW9uOiBtb25nb29zZS52ZXJzaW9uLFxuICAgICAgICBjb25uZWN0aW9uU3RhdGU6IG1vbmdvb3NlLmNvbm5lY3Rpb24ucmVhZHlTdGF0ZSxcbiAgICAgICAgY29ubmVjdGlvblBhcmFtczoge1xuICAgICAgICAgIGhvc3Q6IG1vbmdvb3NlLmNvbm5lY3Rpb24uaG9zdCxcbiAgICAgICAgICBwb3J0OiBtb25nb29zZS5jb25uZWN0aW9uLnBvcnQsXG4gICAgICAgICAgbmFtZTogbW9uZ29vc2UuY29ubmVjdGlvbi5uYW1lLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHJlcXVlc3Q6IHtcbiAgICAgICAgaXA6IHJlcS5pcCxcbiAgICAgICAgaXBzOiByZXEuaXBzLFxuICAgICAgICBoZWFkZXJzOiByZXEuaGVhZGVycyxcbiAgICAgICAgdXNlckFnZW50OiByZXEuZ2V0KCdVc2VyLUFnZW50JyksXG4gICAgICB9LFxuICAgICAgbmV0d29yazoge1xuICAgICAgICBkbnNTZXJ2ZXJzOiBkbnMuZ2V0U2VydmVycygpLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgLy8gVGjhu60gcmVzb2x2ZSDEkeG7i2EgY2jhu4kgTW9uZ29EQiBBdGxhc1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBtYWluSG9zdCA9ICdjbHVzdGVyMC5haGZidHdkLm1vbmdvZGIubmV0JztcbiAgICAgIGNvbnN0IGRuc0xvb2t1cFByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGRucy5sb29rdXAobWFpbkhvc3QsIChlcnIsIGFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSByZWplY3QoZXJyKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoYWRkcmVzcyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGNvbnN0IGRuc1Jlc29sdmVQcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBkbnMucmVzb2x2ZShtYWluSG9zdCwgKGVyciwgYWRkcmVzc2VzKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikgcmVqZWN0KGVycik7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKGFkZHJlc3Nlcyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIMSQ4bq3dCB0aW1lb3V0IDUgZ2nDonkgY2hvIGPDoWMgRE5TIGxvb2t1cFxuICAgICAgY29uc3QgdGltZW91dCA9IG5ldyBQcm9taXNlKChfLCByZWplY3QpID0+IFxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHJlamVjdChuZXcgRXJyb3IoJ0ROUyBsb29rdXAgdGltZW91dCcpKSwgNTAwMClcbiAgICAgICk7XG4gICAgICBcbiAgICAgIC8vIENo4bqheSBjw6FjIHRoYW8gdMOhYyBETlMgduG7m2kgdGltZW91dFxuICAgICAgdHJ5IHtcbiAgICAgICAgaW5mby5uZXR3b3JrLmRuc0xvb2t1cCA9IGF3YWl0IFByb21pc2UucmFjZShbZG5zTG9va3VwUHJvbWlzZSwgdGltZW91dF0pO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpbmZvLm5ldHdvcmsuZG5zTG9va3VwRXJyb3IgPSBlLm1lc3NhZ2U7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHRyeSB7XG4gICAgICAgIGluZm8ubmV0d29yay5kbnNSZXNvbHZlID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtkbnNSZXNvbHZlUHJvbWlzZSwgdGltZW91dF0pO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpbmZvLm5ldHdvcmsuZG5zUmVzb2x2ZUVycm9yID0gZS5tZXNzYWdlO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGRuc0Vycikge1xuICAgICAgaW5mby5uZXR3b3JrLmRuc0Vycm9yID0gZG5zRXJyLm1lc3NhZ2U7XG4gICAgfVxuXG4gICAgcmVzLmpzb24oaW5mbyk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgfVxufSk7XG5cbi8vIE1pZGRsZXdhcmUgdG8gY2F0Y2ggdW5oYW5kbGVkIHJlcXVlc3RzICg0MDQpXG5hcHAudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAvLyBDaOG7iSB44butIGzDvSBu4bq/dSBoZWFkZXJzU2VudCA9IGZhbHNlLCB0csOhbmggbOG7l2kga2hpIHJlc3BvbnNlIMSRw6MgxJHGsOG7o2MgZ+G7rWlcbiAgaWYgKCFyZXMuaGVhZGVyc1NlbnQpIHtcbiAgICByZXMuc3RhdHVzKDQwNCkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IGBDYW5ub3QgJHtyZXEubWV0aG9kfSAke3JlcS51cmx9YCxcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICAvLyBO4bq/dSBoZWFkZXJzIMSRw6MgxJHGsOG7o2MgZ+G7rWksIGNo4buJIGfhu41pIG5leHQgduG7m2kgbOG7l2kgKG7hur91IGPDsylcbiAgICBuZXh0KCk7XG4gIH1cbn0pO1xuXG4vLyBHbG9iYWwgZXJyb3IgaGFuZGxpbmcgbWlkZGxld2FyZVxuYXBwLnVzZSgoZXJyLCByZXEsIHJlcykgPT4ge1xuICBjb25zb2xlLmVycm9yKFwiR2xvYmFsIGVycm9yOlwiLCBlcnIpO1xuXG4gIC8vIEtp4buDbSB0cmEgcmVxLnBhdGggdOG7k24gdOG6oWkgdHLGsOG7m2Mga2hpIHPhu60gZOG7pW5nXG4gIGNvbnN0IHBhdGggPSByZXEgJiYgcmVxLnBhdGggPyByZXEucGF0aCA6ICcnO1xuXG4gIC8vIEtp4buDbSB0cmEgcmVzIGzDoCDEkeG7kWkgdMaw4bujbmcgcmVzcG9uc2UgaOG7o3AgbOG7h1xuICBpZiAoIXJlcyB8fCB0eXBlb2YgcmVzLnN0YXR1cyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJJbnZhbGlkIEV4cHJlc3MgcmVzcG9uc2Ugb2JqZWN0IGluIGVycm9yIGhhbmRsZXIuXCIpO1xuICAgIC8vIFTDuXkgY2jhu41uOiBsb2cgdGjDqm0gdGjDtG5nIHRpbiBkZWJ1ZyB24buBIHJlcSB2w6AgZXJyXG4gICAgLy8gY29uc29sZS5sb2coJ1JlcXVlc3QgZGV0YWlsczonLCByZXEpO1xuICAgIC8vIGNvbnNvbGUubG9nKCdFcnJvciBkZXRhaWxzOicsIGVycik7XG4gICAgLy8gS+G6v3QgdGjDumMgcmVxdWVzdCBt4buZdCBjw6FjaCBhbiB0b8OgbiBu4bq/dSBjw7MgdGjhu4MsIGhv4bq3YyByZS10aHJvdyBs4buXaVxuICAgIC8vIMSQ4buDIMSRxqFuIGdp4bqjbiwgdGEgc+G6vSBsb2cgdsOgIGPDsyB0aOG7gyDEkeG7gyByZXF1ZXN0IHRpbWVvdXQgaG/hurdjIHRy4bqjIHbhu4EgbOG7l2kgY2h1bmcgdMO5eSBj4bqldSBow6xuaCBzZXJ2ZXJsZXNzXG4gICAgLy8gVHJvbmcgbcO0aSB0csaw4budbmcgc2VydmVybGVzcywgdGjGsOG7nW5nIGtow7RuZyBjw7Mgc2VydmVyLm9uKCdlcnJvcicpIG5oxrAgc2VydmVyIHRydXnhu4FuIHRo4buRbmdcbiAgICAvLyBM4buXaSDhu58gxJHDonkgY8OzIHRo4buDIGRvIGNvbnRleHQga2jDtG5nIMSRw7puZ1xuICAgIHJldHVybjsgLy8gVGhvw6F0IGto4buPaSBtaWRkbGV3YXJlIMSR4buDIHRyw6FuaCBs4buXaSB0aMOqbVxuICB9XG5cbiAgaWYgKHBhdGguaW5jbHVkZXMoXCJ3ZWJob29rXCIpIHx8IHBhdGguaW5jbHVkZXMoXCIvYXBpL3BheW1lbnRzL1wiKSkge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgc3VjY2VzczogdHJ1ZSxcbiAgICBjb2RlOiBcIjAwXCIsXG4gICAgICBtZXNzYWdlOiBcIlJlcXVlc3QgcmVjZWl2ZWQgd2l0aCBlcnJvclwiLFxuICAgICAgZXJyb3I6IGVyci5tZXNzYWdlLFxuICAgIH0pO1xuICB9XG5cbiAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgIG1lc3NhZ2U6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIsXG4gICAgZXJyb3I6IGVyci5tZXNzYWdlLFxuICB9KTtcbn0pO1xuXG4vLyBTY2hlZHVsZWQgdGFza3NcbmNvbnN0IHNjaGVkdWxlSW50ZXJ2YWxIb3VycyA9IDY7XG5jb25zdCBzY2hlZHVsZUludGVydmFsTXMgPSBzY2hlZHVsZUludGVydmFsSG91cnMgKiA2MCAqIDYwICogMTAwMDtcblxuY29uc3QgcnVuU2NoZWR1bGVkVGFza3MgPSBhc3luYyAoKSA9PiB7XG4gIHRyeSB7XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoW2RlbGV0ZUV4cGlyZWRWb3VjaGVycygpLCB1cGRhdGVQcm9kdWN0RXhwaXJhdGlvbnMoKV0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJTY2hlZHVsZWQgdGFzayBlcnJvcjpcIiwgZXJyb3IpO1xuICB9XG59O1xuXG4vLyBHb29nbGUgTWFwcyBHZW9jb2RpbmcgQVBJIHByb3h5IGVuZHBvaW50XG5hcHAuZ2V0KFwiL2FwaS9nZW9jb2RlXCIsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHsgYWRkcmVzcyB9ID0gcmVxLnF1ZXJ5O1xuICAgIGlmICghYWRkcmVzcykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgICAgc3RhdHVzOiBcIlpFUk9fUkVTVUxUU1wiLFxuICAgICAgICBlcnJvcl9tZXNzYWdlOiBcIk1pc3NpbmcgYWRkcmVzc1wiLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgYXBpS2V5ID0gcHJvY2Vzcy5lbnYuR09PR0xFX01BUFNfQVBJX0tFWTtcbiAgICBpZiAoIWFwaUtleSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgICAgc3RhdHVzOiBcIlJFUVVFU1RfREVOSUVEXCIsXG4gICAgICAgIGVycm9yX21lc3NhZ2U6IFwiTWlzc2luZyBHb29nbGUgTWFwcyBBUEkga2V5XCIsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCB1cmwgPSBgaHR0cHM6Ly9tYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL2dlb2NvZGUvanNvbj9hZGRyZXNzPSR7ZW5jb2RlVVJJQ29tcG9uZW50KFxuICAgICAgYWRkcmVzc1xuICAgICl9JnJlZ2lvbj12biZsYW5ndWFnZT12aSZrZXk9JHthcGlLZXl9YDtcblxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuXG4gICAgcmVzLmpzb24oZGF0YSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkdlb2NvZGluZyBlcnJvcjpcIiwgZXJyb3IpO1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN0YXR1czogXCJFUlJPUlwiLFxuICAgICAgZXJyb3JfbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcbiAgICB9KTtcbiAgfVxufSk7XG5cbi8vIFN0YXJ0IHNlcnZlciBmdW5jdGlvblxuY29uc3Qgc3RhcnRTZXJ2ZXIgPSAocG9ydCkgPT4ge1xuICBjb25zdCBwb3J0TnVtYmVyID0gTnVtYmVyKHBvcnQpIHx8IDgwODA7XG4gIFxuICBhcHAubGlzdGVuKHBvcnROdW1iZXIsIGFzeW5jICgpID0+IHtcbiAgICBjb25zb2xlLmxvZyhgU2VydmVyIHJ1bm5pbmcgb24gcG9ydCAke3BvcnROdW1iZXJ9YCk7XG5cbiAgICAvLyBSdW4gc2NoZWR1bGVkIHRhc2tzIGltbWVkaWF0ZWx5IG9uIHN0YXJ0XG4gICAgYXdhaXQgcnVuU2NoZWR1bGVkVGFza3MoKTtcblxuICAgIC8vIFNjaGVkdWxlIHBlcmlvZGljIHRhc2tzXG4gICAgc2V0SW50ZXJ2YWwocnVuU2NoZWR1bGVkVGFza3MsIHNjaGVkdWxlSW50ZXJ2YWxNcyk7XG4gIH0pLm9uKCdlcnJvcicsIChlcnIpID0+IHtcbiAgICBpZiAoZXJyLmNvZGUgPT09ICdFQUREUklOVVNFJykge1xuICAgICAgY29uc29sZS5sb2coYFBvcnQgJHtwb3J0TnVtYmVyfSBpcyBhbHJlYWR5IGluIHVzZS4gVHJ5aW5nIHBvcnQgJHtwb3J0TnVtYmVyICsgMX0uLi5gKTtcbiAgICAgIHN0YXJ0U2VydmVyKHBvcnROdW1iZXIgKyAxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5lcnJvcignU2VydmVyIGVycm9yOicsIGVycik7XG4gICAgfVxuICB9KTtcbn07XG5cbnN0YXJ0U2VydmVyKHByb2Nlc3MuZW52LlBPUlQpO1xuXG4iXSwibWFwcGluZ3MiOiI7QUFDQSxJQUFBQSxRQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxLQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxhQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxTQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxPQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSyxVQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTSxhQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTyxJQUFBLEdBQUFSLHNCQUFBLENBQUFDLE9BQUE7O0FBRUEsSUFBQVEsdUJBQUEsR0FBQVIsT0FBQTtBQUNBLElBQUFTLGtCQUFBLEdBQUFULE9BQUE7Ozs7QUFJQSxJQUFBVSxrQkFBQSxHQUFBWCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVcsbUJBQUEsR0FBQVgsT0FBQTs7Ozs7Ozs7O0FBU0FBLE9BQUE7QUFDQUEsT0FBQTs7Ozs7Ozs7OztBQVVBLElBQUFZLFdBQUEsR0FBQWIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFhLGNBQUEsR0FBQWQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFjLGVBQUEsR0FBQWYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFlLGVBQUEsR0FBQWhCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBZ0IsV0FBQSxHQUFBakIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFpQixjQUFBLEdBQUFqQixPQUFBO0FBQ0EsSUFBQWtCLGNBQUEsR0FBQW5CLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFB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