"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
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
var _brandRoutes = _interopRequireDefault(require("./routes/brandRoutes.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } /* eslint-disable no-undef */
// Load env variables
_dotenv["default"].config({
  path: ".env"
});

// Import models to avoid OverwriteModelError

// Clear model cache for specific models to avoid overwrite errors on hot reloads
["Messages", "Conversation"].forEach(function (model) {
  if (_mongoose["default"].models[model]) {
    delete _mongoose["default"].models[model];
  }
});

// Import routes

var app = (0, _express["default"])();

// CORS configuration
var allowedOrigins = ["http://localhost:3000", "https://quanlythucpham.vercel.app", "https://quanlythucpham-vercel.app", "https://quanlythucpham-git-main-kits-projects.vercel.app", "https://quanlythucpham-azf6-cvjbbij6u-kit27102k3s-projects.vercel.app", "https://*.vercel.app" // Cho phép tất cả subdomain của vercel.app
];
app.use((0, _cors["default"])({
  origin: function origin(_origin, callback) {
    // Cho phép requests không có origin (như mobile apps)
    if (!_origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(_origin) || _origin.endsWith('.vercel.app') || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', _origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  maxAge: 3600
}));

// Middleware for JSON and URL encoded bodies (50mb limit)
app.use(_express["default"].json({
  limit: "50mb"
}));
app.use(_express["default"].urlencoded({
  extended: true,
  limit: "50mb"
}));
app.use((0, _cookieParser["default"])());

// JWT Authentication middleware
app.use(function (req, res, next) {
  var authHeader = req.headers.authorization;
  if (authHeader !== null && authHeader !== void 0 && authHeader.startsWith("Bearer ")) {
    var token = authHeader.substring(7);
    var secretKey = process.env.JWT_SECRET_ACCESS;
    if (!secretKey) {
      console.error("JWT_SECRET is not defined in environment variables");
      return next();
    }
    try {
      var decoded = _jsonwebtoken["default"].verify(token, secretKey);
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
var URI = process.env.MONGODB_URI || process.env.MONGOOSE_URI;
var mongooseOptions = {
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
var connectWithRetry = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
    var retries,
      delay,
      i,
      _err$reason,
      _args = arguments;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          retries = _args.length > 0 && _args[0] !== undefined ? _args[0] : 5;
          delay = _args.length > 1 && _args[1] !== undefined ? _args[1] : 5000;
          i = 0;
        case 3:
          if (!(i < retries)) {
            _context.next = 23;
            break;
          }
          _context.prev = 4;
          _context.next = 7;
          return _mongoose["default"].connect(URI, mongooseOptions);
        case 7:
          console.log("MongoDB Connected Successfully");
          console.log("MongoDB Connection Info:", {
            host: _mongoose["default"].connection.host,
            port: _mongoose["default"].connection.port,
            dbName: _mongoose["default"].connection.name,
            readyState: _mongoose["default"].connection.readyState,
            env: process.env.NODE_ENV
          });
          return _context.abrupt("return");
        case 12:
          _context.prev = 12;
          _context.t0 = _context["catch"](4);
          console.error("MongoDB connection attempt ".concat(i + 1, " failed:"), _context.t0);
          if (_context.t0.name === "MongooseServerSelectionError") {
            console.error({
              uri: URI ? URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@") : "URI is undefined",
              message: _context.t0.message,
              reason: (_err$reason = _context.t0.reason) === null || _err$reason === void 0 ? void 0 : _err$reason.message,
              code: _context.t0.code,
              env: process.env.NODE_ENV
            });
          }
          if (i === retries - 1) {
            console.error("Max retries reached. Could not connect to MongoDB.");
            process.exit(1);
          }
          console.log("Retrying in ".concat(delay / 1000, " seconds..."));
          _context.next = 20;
          return new Promise(function (resolve) {
            return setTimeout(resolve, delay);
          });
        case 20:
          i++;
          _context.next = 3;
          break;
        case 23:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[4, 12]]);
  }));
  return function connectWithRetry() {
    return _ref.apply(this, arguments);
  };
}();

// Xử lý các sự kiện kết nối
_mongoose["default"].connection.on("error", function (err) {
  console.error("MongoDB connection error:", err);
  if (err.name === "MongooseServerSelectionError") {
    console.error("IP whitelist issue detected. Please check MongoDB Atlas IP whitelist settings.");
  }
});
_mongoose["default"].connection.on("disconnected", function () {
  console.log("MongoDB disconnected. Attempting to reconnect...");
  connectWithRetry();
});
_mongoose["default"].connection.on("reconnected", function () {
  console.log("MongoDB reconnected successfully");
});

// Khởi tạo kết nối
connectWithRetry();

// Register API routes
app.use("/auth", _authRoutes["default"]);
app.use("/admin/auth", _adminAuthRoutes["default"]);
app.use("/api", _adminRoutes["default"]);
app.use("/api/categories", _categoryRoutes["default"]);
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

// Direct product best sellers endpoint
app.get("/api/products/best-sellers", _productsController.getBestSellingProducts);

// Reports endpoints registration (mapping path -> handler)
var reportEndpoints = {
  "/api/dashboard/stats": _reportsController["default"].getDashboardStats,
  "/api/analytics/revenue": _reportsController["default"].getRevenueData,
  "/api/analytics/top-products": _reportsController["default"].getTopProducts,
  "/api/products/inventory": _reportsController["default"].getInventoryData,
  "/api/users/stats": _reportsController["default"].getUserData,
  "/api/orders/stats": _reportsController["default"].getOrderData,
  "/api/coupons/stats": _reportsController["default"].getPromotionData,
  "/api/admin/activity-logs": _reportsController["default"].getSystemActivityData,
  "/api/orders/delivery-stats": _reportsController["default"].getDeliveryData,
  "/api/reviews/stats": _reportsController["default"].getFeedbackData
};

// Register report endpoints and their aliases under /api/reports
for (var _i = 0, _Object$entries = Object.entries(reportEndpoints); _i < _Object$entries.length; _i++) {
  var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
    path = _Object$entries$_i[0],
    handler = _Object$entries$_i[1];
  app.get(path, handler);
  app.get("/api/reports".concat(path.replace(/^\/api/, "")), handler);
}

// Webhook handler function
var webhookHandler = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res) {
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          if (!(req.body.gateway === "MBBank" || req.body.transferAmount)) {
            _context2.next = 6;
            break;
          }
          _context2.next = 4;
          return (0, _paymentController.handleBankWebhook)(req, res);
        case 4:
          _context2.next = 8;
          break;
        case 6:
          _context2.next = 8;
          return (0, _paymentController.handleSepayCallback)(req, res);
        case 8:
          if (!res.headersSent) {
            res.status(200).json({
              success: true,
              code: "00",
              message: "Webhook processed successfully"
            });
          }
          _context2.next = 15;
          break;
        case 11:
          _context2.prev = 11;
          _context2.t0 = _context2["catch"](0);
          console.error("Webhook error:", _context2.t0);
          if (!res.headersSent) {
            res.status(200).json({
              success: true,
              code: "00",
              message: "Webhook received with error",
              error: _context2.t0.message
            });
          }
        case 15:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 11]]);
  }));
  return function webhookHandler(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

// Register webhook routes
["/webhook", "/api/webhook", "/api/webhook/bank", "/api/payments/webhook", "/api/payments/webhook/bank", "/api/payments/sepay/webhook"].forEach(function (path) {
  return app.post(path, webhookHandler);
});

// Health check endpoint
app.get("/health", function (req, res) {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development"
  });
});

// Middleware to catch unhandled requests (404)
app.use(function (req, res, next) {
  // Chỉ xử lý nếu headersSent = false, tránh lỗi khi response đã được gửi
  if (!res.headersSent) {
    res.status(404).json({
      success: false,
      message: "Cannot ".concat(req.method, " ").concat(req.url)
    });
  } else {
    // Nếu headers đã được gửi, chỉ gọi next với lỗi (nếu có)
    next();
  }
});

// Global error handling middleware
app.use(function (err, req, res) {
  console.error("Global error:", err);

  // Kiểm tra req.path tồn tại trước khi sử dụng
  var path = (req === null || req === void 0 ? void 0 : req.path) || '';

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
var scheduleIntervalHours = 6;
var scheduleIntervalMs = scheduleIntervalHours * 60 * 60 * 1000;
var runScheduledTasks = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return Promise.all([(0, _savedVoucherController.deleteExpiredVouchers)(), (0, _productsController.updateProductExpirations)()]);
        case 3:
          _context3.next = 8;
          break;
        case 5:
          _context3.prev = 5;
          _context3.t0 = _context3["catch"](0);
          console.error("Scheduled task error:", _context3.t0);
        case 8:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[0, 5]]);
  }));
  return function runScheduledTasks() {
    return _ref3.apply(this, arguments);
  };
}();

// Google Maps Geocoding API proxy endpoint
app.get("/api/geocode", /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(req, res) {
    var address, apiKey, url, response, data;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          address = req.query.address;
          if (address) {
            _context4.next = 4;
            break;
          }
          return _context4.abrupt("return", res.status(400).json({
            status: "ZERO_RESULTS",
            error_message: "Missing address"
          }));
        case 4:
          apiKey = process.env.GOOGLE_MAPS_API_KEY;
          if (apiKey) {
            _context4.next = 7;
            break;
          }
          return _context4.abrupt("return", res.status(500).json({
            status: "REQUEST_DENIED",
            error_message: "Missing Google Maps API key"
          }));
        case 7:
          url = "https://maps.googleapis.com/maps/api/geocode/json?address=".concat(encodeURIComponent(address), "&region=vn&language=vi&key=").concat(apiKey);
          _context4.next = 10;
          return (0, _nodeFetch["default"])(url);
        case 10:
          response = _context4.sent;
          _context4.next = 13;
          return response.json();
        case 13:
          data = _context4.sent;
          res.json(data);
          _context4.next = 21;
          break;
        case 17:
          _context4.prev = 17;
          _context4.t0 = _context4["catch"](0);
          console.error("Geocoding error:", _context4.t0);
          res.status(500).json({
            status: "ERROR",
            error_message: _context4.t0.message
          });
        case 21:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[0, 17]]);
  }));
  return function (_x3, _x4) {
    return _ref4.apply(this, arguments);
  };
}());

// Start server function
var startServer = function startServer(port) {
  var portNumber = Number(port) || 8080;
  app.listen(portNumber, /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          console.log("Server running on port ".concat(portNumber));

          // Run scheduled tasks immediately on start
          _context5.next = 3;
          return runScheduledTasks();
        case 3:
          // Schedule periodic tasks
          setInterval(runScheduledTasks, scheduleIntervalMs);
        case 4:
        case "end":
          return _context5.stop();
      }
    }, _callee5);
  })));
};
startServer(process.env.PORT);