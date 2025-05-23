"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var _express = _interopRequireDefault(require("express"));
var _cors = _interopRequireDefault(require("cors"));
var _cookieParser = _interopRequireDefault(require("cookie-parser"));
var _mongoose = _interopRequireDefault(require("mongoose"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _bodyParser = _interopRequireDefault(require("body-parser"));
var _path = _interopRequireWildcard(require("path"));
var _url = require("url");
var _savedVoucherController = require("./Controller/savedVoucherController.js");
var _paymentController = require("./Controller/paymentController.js");
var _reportsController = _interopRequireDefault(require("./Controller/reportsController.js"));
var _nodeFetch = _interopRequireDefault(require("node-fetch"));
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
var _productsController = require("./Controller/productsController.js");
var _console = require("console");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } /* eslint-disable no-unused-vars */ /* eslint-disable no-undef */
// ES modules compatibility
var _filename = (0, _url.fileURLToPath)(import.meta.url);
var _dirname = (0, _path.dirname)(_filename);

// Import models before routes

// Import specific controller for direct endpoint handling

_dotenv["default"].config({
  path: ".env"
});
var app = (0, _express["default"])();

// Xóa model cache để tránh lỗi OverwriteModelError
Object.keys(_mongoose["default"].models).forEach(function (modelName) {
  if (modelName === 'Messages' || modelName === 'Conversation') {
    delete _mongoose["default"].models[modelName];
  }
});
app.use((0, _cors["default"])({
  origin: ["http://localhost:3000", "https://quanlythucpham.vercel.app", "https://quanlythucpham-vercel.app", "https://quanlythucpham-git-main-kits-projects.vercel.app", process.env.NODE_ENV !== 'production' ? '*' : null].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  maxAge: 3600
}));

// Add a CORS preflight handler for OPTIONS requests
app.options('*', (0, _cors["default"])());
app.use(_express["default"].json({
  limit: '50mb'
}));
app.use((0, _cookieParser["default"])());
app.use(_bodyParser["default"].json({
  limit: '50mb'
}));
app.use(_bodyParser["default"].urlencoded({
  extended: true,
  limit: '50mb'
}));

// Middleware kiểm tra token và trích xuất thông tin người dùng
app.use(function (req, res, next) {
  try {
    var authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      var token = authHeader.substring(7);
      var jwt = require('jsonwebtoken');
      var secretKey = process.env.JWT_SECRET || 'your-secret-key';
      try {
        var decoded = jwt.verify(token, secretKey);
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
var URI = process.env.MONGOOSE_URI;
_mongoose["default"].connect(URI).then(function () {
  // Removed console.log for MongoDB connection success
})["catch"](function (err) {
  return console.error("MongoDB connection error:", err);
});
app.use("/auth", _authRoutes["default"]);
app.use("/admin/auth", _adminAuthRoutes["default"]);
app.use("/api", _adminRoutes["default"]);
app.use("/api/categories", _categoryRoutes["default"]);
app.use("/logout", _authRoutes["default"]);
app.use("/api", _scraperRoutes["default"]);
app.use("/api", _productsRoutes["default"]);
app.use("/api/cart", _cartRoutes["default"]);
app.use("/api/chatbot", _chatbotRoutes.chatbotRoutes);
app.use("/api/payments", _paymentRoutes["default"]);
app.use("/orders", _orderRoutes["default"]);
app.use("/api/dashboard", _dashboardRoutes["default"]);
app.use("/api", _tipsRoutes["default"]);
app.use("/api/contact", _contactRoutes["default"]);
app.use("/api/messages", _messageRoutes["default"]);
app.use("/api/reviews", _reviewRoutes["default"]);
app.use("/api/coupons", _couponRoutes["default"]);
app.use("/api/saved-vouchers", _savedVoucherRoutes["default"]);
app.use("/api/reports", _reportRoutes["default"]);
app.use("/api/system", _systemRoutes["default"]);
app.use("/api/suppliers", _supplierRoutes["default"]);
app.use("/api/brands", _brandRoutes["default"]);

// Handle best-sellers endpoint directly to avoid route conflicts
app.get('/api/products/best-sellers', _productsController.getBestSellingProducts);

// Add reports direct endpoints
// Reports API routes for traditional endpoints (no authentication required)
app.get('/api/dashboard/stats', _reportsController["default"].getDashboardStats);
app.get('/api/analytics/revenue', _reportsController["default"].getRevenueData);
app.get('/api/analytics/top-products', _reportsController["default"].getTopProducts);
app.get('/api/products/inventory', _reportsController["default"].getInventoryData);
app.get('/api/users/stats', _reportsController["default"].getUserData);
app.get('/api/orders/stats', _reportsController["default"].getOrderData);
app.get('/api/coupons/stats', _reportsController["default"].getPromotionData);
app.get('/api/admin/activity-logs', _reportsController["default"].getSystemActivityData);
app.get('/api/orders/delivery-stats', _reportsController["default"].getDeliveryData);
app.get('/api/reviews/stats', _reportsController["default"].getFeedbackData);

// Reports API routes for Edge API (no authentication required)
app.get('/api/reports/dashboard', function (req, res) {
  _reportsController["default"].getDashboardStats(req, res);
});
app.get('/api/reports/revenue', function (req, res) {
  _reportsController["default"].getRevenueData(req, res);
});
app.get('/api/reports/top-products', function (req, res) {
  _reportsController["default"].getTopProducts(req, res);
});
app.get('/api/reports/inventory', function (req, res) {
  _reportsController["default"].getInventoryData(req, res);
});
app.get('/api/reports/users', function (req, res) {
  _reportsController["default"].getUserData(req, res);
});
app.get('/api/reports/orders', function (req, res) {
  _reportsController["default"].getOrderData(req, res);
});
app.get('/api/reports/promotions', function (req, res) {
  _reportsController["default"].getPromotionData(req, res);
});
app.get('/api/reports/system-activity', function (req, res) {
  _reportsController["default"].getSystemActivityData(req, res);
});
app.get('/api/reports/delivery', function (req, res) {
  _reportsController["default"].getDeliveryData(req, res);
});
app.get('/api/reports/feedback', function (req, res) {
  _reportsController["default"].getFeedbackData(req, res);
});

// Dọn dẹp các webhook handler trùng lặp
// Đây là danh sách các đường dẫn webhook cần hỗ trợ
var webhookPaths = ['/webhook', '/api/webhook', '/api/webhook/bank', '/api/payments/webhook', '/api/payments/webhook/bank', '/api/payments/sepay/webhook'];

// Đăng ký tất cả các route webhook với một handler duy nhất
webhookPaths.forEach(function (path) {
  app.post(path, /*#__PURE__*/function () {
    var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(req, res) {
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            if (!(req.body.gateway === 'MBBank' || req.body.transferAmount)) {
              _context.next = 6;
              break;
            }
            _context.next = 4;
            return (0, _paymentController.handleBankWebhook)(req, res);
          case 4:
            _context.next = 8;
            break;
          case 6:
            _context.next = 8;
            return (0, _paymentController.handleSepayCallback)(req, res);
          case 8:
            // Chỉ trả về response nếu chưa được trả về từ các handler
            if (!res.headersSent) {
              res.status(200).json({
                success: true,
                code: "00",
                message: "Webhook processed successfully"
              });
            }
            _context.next = 15;
            break;
          case 11:
            _context.prev = 11;
            _context.t0 = _context["catch"](0);
            console.error("Error handling webhook at ".concat(path, ":"), _context.t0);
            if (!res.headersSent) {
              res.status(200).json({
                success: true,
                code: "00",
                message: "Webhook received with error",
                error: _context.t0.message
              });
            }
          case 15:
          case "end":
            return _context.stop();
        }
      }, _callee, null, [[0, 11]]);
    }));
    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }());
});

// Thêm middleware xử lý lỗi nghiêm trọng
app.use(function (req, res, next) {
  try {
    next();
  } catch (error) {
    console.error("Uncaught error in request:", error);
    // Đối với webhook, luôn trả về 200
    if (req.path.includes('webhook') || req.path.includes('/api/payments/')) {
      return res.status(200).json({
        success: true,
        code: "00",
        message: "Request received with uncaught error",
        error: error.message
      });
    }
    // Đối với các request khác, trả về 500
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', function (req, res) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Thêm endpoint trực tiếp cho SePay để debug lỗi 500
app.get("/webhook", function (req, res) {
  res.status(200).json({
    success: true,
    message: "SePay webhook endpoint is active",
    environment: process.env.NODE_ENV || 'development'
  });
});

// Thêm handler đơn giản cho webhook test
app.post("/webhook", function (req, res) {
  console.log("Received direct webhook POST:", req.body);
  res.status(200).json({
    success: true,
    code: "00",
    message: "Webhook received successfully"
  });
});

// Hàm dọn dẹp voucher hết hạn
var scheduleExpiredVoucherCleanup = function scheduleExpiredVoucherCleanup() {
  try {
    // Gọi function để xóa các voucher hết hạn
    (0, _savedVoucherController.deleteExpiredVouchers)().then(function () {
      // Removed console.log for expired voucher cleanup completed
    });
  } catch (error) {
    console.error("Error in scheduled expired voucher cleanup:", error);
  }
};

// Bắt đầu lịch xóa voucher hết hạn
scheduleExpiredVoucherCleanup();

// Hàm kiểm tra sản phẩm hết hạn
var scheduleProductExpirationCheck = function scheduleProductExpirationCheck() {
  try {
    // Removed console.log for product expiration check
    (0, _productsController.updateProductExpirations)().then(function (result) {
      // Removed console.log for product expiration results
    });
  } catch (error) {
    console.error("Error in scheduled product expiration check:", error);
  }
};

// Thêm công việc định kỳ để kiểm tra và cập nhật hạn sản phẩm
// Chạy mỗi 6 giờ
var scheduleIntervalHours = 6;
var scheduleInterval = scheduleIntervalHours * 60 * 60 * 1000; // Convert hours to milliseconds

// Khởi động server với cơ chế xử lý lỗi cổng
var startServer = function startServer(port) {
  // Đảm bảo port là số và trong phạm vi hợp lệ
  var portNumber = parseInt(port, 10);
  if (isNaN(portNumber)) {
    port = 8080;
  }
  try {
    var server = app.listen(port, function () {
      // Removed console.log for server running

      // Schedule cleanup of expired vouchers
      scheduleExpiredVoucherCleanup(); // Run once at startup

      // Schedule check for product expirations
      scheduleProductExpirationCheck(); // Run once at startup

      // Set up interval to run cleanup and checks periodically
      setInterval(function () {
        scheduleExpiredVoucherCleanup()["catch"](function (err) {
          return console.error("Lỗi khi chạy tác vụ định kỳ dọn dẹp voucher:", err);
        });
      }, scheduleInterval);
      setInterval(function () {
        scheduleProductExpirationCheck()["catch"](function (err) {
          return console.error("Lỗi khi chạy tác vụ định kỳ kiểm tra sản phẩm:", err);
        });
      }, scheduleInterval);

      // Removed console.log for scheduled tasks
    });
    server.on('error', function (error) {
      if (error.code === 'EADDRINUSE') {
        console.error("Port ".concat(port, " is already in use. Please close the applications using this port and try again."));
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

// Khởi động server
var port = process.env.PORT || 8080;
startServer(port);

// Google Maps Geocoding API proxy endpoint
app.get('/api/geocode', /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res) {
    var address, apiKey, url, response, data;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          address = req.query.address;
          if (address) {
            _context2.next = 4;
            break;
          }
          return _context2.abrupt("return", res.status(400).json({
            status: 'ZERO_RESULTS',
            error_message: 'Missing address'
          }));
        case 4:
          apiKey = process.env.GOOGLE_MAPS_API_KEY;
          console.log("Key", apiKey);
          if (apiKey) {
            _context2.next = 8;
            break;
          }
          return _context2.abrupt("return", res.status(500).json({
            status: 'REQUEST_DENIED',
            error_message: 'Missing Google Maps API key'
          }));
        case 8:
          url = "https://maps.googleapis.com/maps/api/geocode/json?address=".concat(encodeURIComponent(address), "&region=vn&language=vi&key=").concat(apiKey);
          _context2.next = 11;
          return (0, _nodeFetch["default"])(url);
        case 11:
          response = _context2.sent;
          _context2.next = 14;
          return response.json();
        case 14:
          data = _context2.sent;
          res.json(data);
          _context2.next = 21;
          break;
        case 18:
          _context2.prev = 18;
          _context2.t0 = _context2["catch"](0);
          res.status(500).json({
            status: 'ERROR',
            error_message: _context2.t0.message
          });
        case 21:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 18]]);
  }));
  return function (_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}());