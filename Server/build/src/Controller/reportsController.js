"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _Order = _interopRequireDefault(require("../Model/Order.js"));
var _Products = _interopRequireDefault(require("../Model/Products.js"));
var _Register = _interopRequireDefault(require("../Model/Register.js"));
var _Review = _interopRequireDefault(require("../Model/Review.js"));
var _Coupon = _interopRequireDefault(require("../Model/Coupon.js"));
var _BestSellingProduct = _interopRequireDefault(require("../Model/BestSellingProduct.js"));
var _mongoose = _interopRequireDefault(require("mongoose"));
var _orderController = require("../Controller/orderController.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
/**
 * Reports controller to handle API requests for generating various reports
 * Uses real data from MongoDB models
 */
var reportsController = {
  // Dashboard statistics
  getDashboardStats: function () {
    var _getDashboardStats = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(req, res) {
      var totalOrders, totalProducts, totalCustomers, revenueData, totalRevenue, recentOrders, recentProductUpdates, recentUsers, recentActivities, stats;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return _Order["default"].countDocuments();
          case 3:
            totalOrders = _context.sent;
            _context.next = 6;
            return _Products["default"].countDocuments();
          case 6:
            totalProducts = _context.sent;
            _context.next = 9;
            return _Register["default"].countDocuments();
          case 9:
            totalCustomers = _context.sent;
            _context.next = 12;
            return _Order["default"].aggregate([{
              $match: {
                status: "completed"
              }
            }, {
              $group: {
                _id: null,
                total: {
                  $sum: "$totalAmount"
                }
              }
            }]);
          case 12:
            revenueData = _context.sent;
            totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0; // Get recent activities
            _context.next = 16;
            return _Order["default"].find().sort({
              createdAt: -1
            }).limit(3).populate('userId', 'firstName lastName userName');
          case 16:
            recentOrders = _context.sent;
            _context.next = 19;
            return _Products["default"].find().sort({
              updatedAt: -1
            }).limit(2);
          case 19:
            recentProductUpdates = _context.sent;
            _context.next = 22;
            return _Register["default"].find().sort({
              createdAt: -1
            }).limit(2);
          case 22:
            recentUsers = _context.sent;
            // Format recent activities
            recentActivities = [].concat(_toConsumableArray(recentOrders.map(function (order) {
              return {
                id: order._id,
                type: 'order',
                message: "\u0110\u01A1n h\xE0ng m\u1EDBi #".concat(order.orderCode, " t\u1EEB ").concat(order.userId ? order.userId.firstName + ' ' + order.userId.lastName || order.userId.userName : 'Khách hàng'),
                timestamp: order.createdAt
              };
            })), _toConsumableArray(recentProductUpdates.map(function (product) {
              return {
                id: product._id,
                type: 'product',
                message: "S\u1EA3n ph\u1EA9m \"".concat(product.productName, "\" \u0111\xE3 \u0111\u01B0\u1EE3c c\u1EADp nh\u1EADt"),
                timestamp: product.updatedAt
              };
            })), _toConsumableArray(recentUsers.map(function (user) {
              return {
                id: user._id,
                type: 'user',
                message: "Ng\u01B0\u1EDDi d\xF9ng m\u1EDBi ".concat(user.firstName ? user.firstName + ' ' + user.lastName : user.userName, " \u0111\xE3 \u0111\u0103ng k\xFD"),
                timestamp: user.createdAt
              };
            }))).sort(function (a, b) {
              return new Date(b.timestamp) - new Date(a.timestamp);
            });
            stats = {
              totalOrders: totalOrders,
              totalRevenue: totalRevenue,
              totalCustomers: totalCustomers,
              totalProducts: totalProducts,
              recentActivities: recentActivities.slice(0, 5)
            };
            res.json(stats);
            _context.next = 32;
            break;
          case 28:
            _context.prev = 28;
            _context.t0 = _context["catch"](0);
            console.error('Error fetching dashboard stats:', _context.t0);
            res.status(500).json({
              message: 'Lỗi khi lấy dữ liệu thống kê'
            });
          case 32:
          case "end":
            return _context.stop();
        }
      }, _callee, null, [[0, 28]]);
    }));
    function getDashboardStats(_x, _x2) {
      return _getDashboardStats.apply(this, arguments);
    }
    return getDashboardStats;
  }(),
  // Revenue data
  getRevenueData: function () {
    var _getRevenueData = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res) {
      var _req$query, _req$query$timeRange, timeRange, _req$query$paymentMet, paymentMethod, _req$query$region, region, currentDate, startDate, matchCriteria, groupBy, dateFormat, revenueAggregation, revenueData;
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            _req$query = req.query, _req$query$timeRange = _req$query.timeRange, timeRange = _req$query$timeRange === void 0 ? 'week' : _req$query$timeRange, _req$query$paymentMet = _req$query.paymentMethod, paymentMethod = _req$query$paymentMet === void 0 ? 'all' : _req$query$paymentMet, _req$query$region = _req$query.region, region = _req$query$region === void 0 ? 'all' : _req$query$region; // Set date range based on timeRange
            currentDate = new Date();
            _context2.t0 = timeRange;
            _context2.next = _context2.t0 === 'year' ? 6 : _context2.t0 === 'month' ? 8 : _context2.t0 === 'week' ? 10 : 10;
            break;
          case 6:
            startDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
            return _context2.abrupt("break", 11);
          case 8:
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
            return _context2.abrupt("break", 11);
          case 10:
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7);
          case 11:
            // Build match criteria
            matchCriteria = {
              createdAt: {
                $gte: startDate,
                $lte: currentDate
              }
            }; // Add payment method filter if specified
            if (paymentMethod && paymentMethod !== 'all') {
              matchCriteria.paymentMethod = paymentMethod;
            }

            // Add region filter if specified
            if (region && region !== 'all') {
              matchCriteria['shippingInfo.city'] = region;
            }

            // Revenue aggregation based on time range

            if (timeRange === 'year') {
              // Group by month for yearly data
              groupBy = {
                year: {
                  $year: "$createdAt"
                },
                month: {
                  $month: "$createdAt"
                }
              };
              dateFormat = function dateFormat(item) {
                return "Th\xE1ng ".concat(item._id.month, "/").concat(item._id.year);
              };
            } else if (timeRange === 'month') {
              // Group by day for monthly data
              groupBy = {
                year: {
                  $year: "$createdAt"
                },
                month: {
                  $month: "$createdAt"
                },
                day: {
                  $dayOfMonth: "$createdAt"
                }
              };
              dateFormat = function dateFormat(item) {
                var date = new Date(item._id.year, item._id.month - 1, item._id.day);
                return date.toLocaleDateString('vi-VN');
              };
            } else {
              // Group by day for weekly data (default)
              groupBy = {
                year: {
                  $year: "$createdAt"
                },
                month: {
                  $month: "$createdAt"
                },
                day: {
                  $dayOfMonth: "$createdAt"
                }
              };
              dateFormat = function dateFormat(item) {
                var date = new Date(item._id.year, item._id.month - 1, item._id.day);
                return date.toLocaleDateString('vi-VN');
              };
            }

            // Aggregate revenue data
            _context2.next = 17;
            return _Order["default"].aggregate([{
              $match: matchCriteria
            }, {
              $group: {
                _id: groupBy,
                revenue: {
                  $sum: "$totalAmount"
                },
                orders: {
                  $sum: 1
                }
              }
            }, {
              $sort: {
                '_id.year': 1,
                '_id.month': 1,
                '_id.day': 1
              }
            }]);
          case 17:
            revenueAggregation = _context2.sent;
            // Format the results
            revenueData = revenueAggregation.map(function (item) {
              return {
                date: dateFormat(item),
                doanh_thu: item.revenue,
                don_hang: item.orders
              };
            });
            res.json(revenueData);
            _context2.next = 26;
            break;
          case 22:
            _context2.prev = 22;
            _context2.t1 = _context2["catch"](0);
            console.error('Error fetching revenue data:', _context2.t1);
            res.status(500).json({
              message: 'Lỗi khi lấy dữ liệu doanh thu'
            });
          case 26:
          case "end":
            return _context2.stop();
        }
      }, _callee2, null, [[0, 22]]);
    }));
    function getRevenueData(_x3, _x4) {
      return _getRevenueData.apply(this, arguments);
    }
    return getRevenueData;
  }(),
  // Top products
  getTopProducts: function () {
    var _getTopProducts = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(req, res) {
      var results, formattedResults;
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1) switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            _context3.next = 3;
            return _BestSellingProduct["default"].find().sort({
              soldCount: -1
            }).limit(5);
          case 3:
            results = _context3.sent;
            // Format the results
            formattedResults = results.map(function (product) {
              return {
                name: product.productName,
                sold: product.soldCount || 0,
                category: product.productCategory || 'Không phân loại',
                price: product.productPrice || 0,
                revenue: product.totalRevenue || 0
              };
            });
            res.json(formattedResults);
            _context3.next = 12;
            break;
          case 8:
            _context3.prev = 8;
            _context3.t0 = _context3["catch"](0);
            console.error('Error fetching top products:', _context3.t0);
            res.status(500).json({
              message: 'Lỗi khi lấy dữ liệu sản phẩm bán chạy'
            });
          case 12:
          case "end":
            return _context3.stop();
        }
      }, _callee3, null, [[0, 8]]);
    }));
    function getTopProducts(_x5, _x6) {
      return _getTopProducts.apply(this, arguments);
    }
    return getTopProducts;
  }(),
  // Inventory data
  getInventoryData: function () {
    var _getInventoryData = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(req, res) {
      var inventory;
      return _regeneratorRuntime().wrap(function _callee4$(_context4) {
        while (1) switch (_context4.prev = _context4.next) {
          case 0:
            try {
              // Trả về dữ liệu mẫu thay vì truy vấn database để tránh lỗi
              inventory = [{
                name: "Trái cây",
                stock: 15,
                value: 3000000,
                status: "Sắp hết"
              }, {
                name: "Thịt tươi",
                stock: 8,
                value: 4000000,
                status: "Sắp hết"
              }, {
                name: "Sữa",
                stock: 4,
                value: 800000,
                status: "Hết hàng"
              }, {
                name: "Rau củ",
                stock: 12,
                value: 600000,
                status: "Sắp hết"
              }, {
                name: "Gia vị",
                stock: 6,
                value: 450000,
                status: "Sắp hết"
              }, {
                name: "Đồ khô",
                stock: 19,
                value: 2500000,
                status: "Sắp hết"
              }, {
                name: "Nước uống",
                stock: 10,
                value: 1200000,
                status: "Sắp hết"
              }];
              res.json(inventory);
            } catch (error) {
              console.error('Error fetching inventory data:', error);
              res.status(500).json({
                message: 'Lỗi khi lấy dữ liệu tồn kho'
              });
            }
          case 1:
          case "end":
            return _context4.stop();
        }
      }, _callee4);
    }));
    function getInventoryData(_x7, _x8) {
      return _getInventoryData.apply(this, arguments);
    }
    return getInventoryData;
  }(),
  // User statistics
  getUserData: function () {
    var _getUserData = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(req, res) {
      var totalUsers, thirtyDaysAgo, newUsers, activeUserIds, activeUsers, usersByRegion, userData;
      return _regeneratorRuntime().wrap(function _callee5$(_context5) {
        while (1) switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;
            _context5.next = 3;
            return _Register["default"].countDocuments();
          case 3:
            totalUsers = _context5.sent;
            thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            _context5.next = 8;
            return _Register["default"].countDocuments({
              createdAt: {
                $gte: thirtyDaysAgo
              }
            });
          case 8:
            newUsers = _context5.sent;
            _context5.next = 11;
            return _Order["default"].distinct('userId', {
              createdAt: {
                $gte: thirtyDaysAgo
              }
            });
          case 11:
            activeUserIds = _context5.sent;
            activeUsers = activeUserIds.length; // Get user demographics
            _context5.next = 15;
            return _Register["default"].aggregate([{
              $group: {
                _id: {
                  region: {
                    $cond: {
                      "if": {
                        $isArray: "$address"
                      },
                      then: {
                        $ifNull: [{
                          $arrayElemAt: ["$address.city", 0]
                        }, "Khác"]
                      },
                      "else": "Khác"
                    }
                  }
                },
                count: {
                  $sum: 1
                }
              }
            }, {
              $project: {
                _id: 0,
                region: "$_id.region",
                count: 1
              }
            }]);
          case 15:
            usersByRegion = _context5.sent;
            // Format the user data
            userData = {
              totalUsers: totalUsers,
              newUsers: newUsers,
              activeUsers: activeUsers,
              usersByRegion: usersByRegion.map(function (item) {
                return {
                  region: item.region || 'Khác',
                  count: item.count
                };
              })
            };
            res.json(userData);
            _context5.next = 24;
            break;
          case 20:
            _context5.prev = 20;
            _context5.t0 = _context5["catch"](0);
            console.error('Error fetching user data:', _context5.t0);
            res.status(500).json({
              message: 'Lỗi khi lấy dữ liệu người dùng'
            });
          case 24:
          case "end":
            return _context5.stop();
        }
      }, _callee5, null, [[0, 20]]);
    }));
    function getUserData(_x9, _x0) {
      return _getUserData.apply(this, arguments);
    }
    return getUserData;
  }(),
  // Order statistics
  getOrderData: function () {
    var _getOrderData = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(req, res) {
      var _req$query$timeRange2, timeRange, currentDate, startDate, totalOrders, completedOrders, pendingOrders, cancelledOrders, avgOrderValueResult, averageOrderValue, ordersByStatusResult, ordersByStatus, recentOrders, formattedRecentOrders, orderData;
      return _regeneratorRuntime().wrap(function _callee6$(_context6) {
        while (1) switch (_context6.prev = _context6.next) {
          case 0:
            _context6.prev = 0;
            _req$query$timeRange2 = req.query.timeRange, timeRange = _req$query$timeRange2 === void 0 ? 'week' : _req$query$timeRange2; // Set date range based on timeRange
            currentDate = new Date();
            _context6.t0 = timeRange;
            _context6.next = _context6.t0 === 'year' ? 6 : _context6.t0 === 'month' ? 8 : _context6.t0 === 'week' ? 10 : 10;
            break;
          case 6:
            startDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
            return _context6.abrupt("break", 11);
          case 8:
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
            return _context6.abrupt("break", 11);
          case 10:
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7);
          case 11:
            _context6.next = 13;
            return _Order["default"].countDocuments();
          case 13:
            totalOrders = _context6.sent;
            _context6.next = 16;
            return _Order["default"].countDocuments({
              status: 'completed'
            });
          case 16:
            completedOrders = _context6.sent;
            _context6.next = 19;
            return _Order["default"].countDocuments({
              status: 'pending'
            });
          case 19:
            pendingOrders = _context6.sent;
            _context6.next = 22;
            return _Order["default"].countDocuments({
              status: 'cancelled'
            });
          case 22:
            cancelledOrders = _context6.sent;
            _context6.next = 25;
            return _Order["default"].aggregate([{
              $match: {
                status: {
                  $ne: 'cancelled'
                }
              }
            }, {
              $group: {
                _id: null,
                avgValue: {
                  $avg: "$totalAmount"
                }
              }
            }]);
          case 25:
            avgOrderValueResult = _context6.sent;
            averageOrderValue = avgOrderValueResult.length > 0 ? avgOrderValueResult[0].avgValue : 0; // Get orders by status
            _context6.next = 29;
            return _Order["default"].aggregate([{
              $group: {
                _id: "$status",
                count: {
                  $sum: 1
                }
              }
            }]);
          case 29:
            ordersByStatusResult = _context6.sent;
            ordersByStatus = ordersByStatusResult.map(function (item) {
              var statusName = item._id;
              // Translate status to Vietnamese if needed
              switch (item._id) {
                case 'pending':
                  statusName = 'Đang xử lý';
                  break;
                case 'awaiting_payment':
                  statusName = 'Chờ thanh toán';
                  break;
                case 'completed':
                  statusName = 'Hoàn thành';
                  break;
                case 'cancelled':
                  statusName = 'Đã hủy';
                  break;
                case 'shipping':
                  statusName = 'Đang giao hàng';
                  break;
              }
              return {
                status: statusName,
                count: item.count
              };
            }); // Get recent orders with user info
            _context6.next = 33;
            return _Order["default"].find().sort({
              createdAt: -1
            }).limit(5).populate('userId', 'firstName lastName userName');
          case 33:
            recentOrders = _context6.sent;
            formattedRecentOrders = recentOrders.map(function (order) {
              return {
                id: order._id,
                orderCode: order.orderCode,
                customer: order.userId ? order.userId.firstName + ' ' + order.userId.lastName || order.userId.userName : 'Khách hàng',
                total: order.totalAmount,
                status: order.status,
                date: order.createdAt
              };
            }); // Combine all order data
            orderData = {
              totalOrders: totalOrders,
              completedOrders: completedOrders,
              pendingOrders: pendingOrders,
              cancelledOrders: cancelledOrders,
              averageOrderValue: averageOrderValue,
              ordersByStatus: ordersByStatus,
              recentOrders: formattedRecentOrders
            };
            res.json(orderData);
            _context6.next = 43;
            break;
          case 39:
            _context6.prev = 39;
            _context6.t1 = _context6["catch"](0);
            console.error('Error fetching order data:', _context6.t1);
            res.status(500).json({
              message: 'Lỗi khi lấy dữ liệu đơn hàng'
            });
          case 43:
          case "end":
            return _context6.stop();
        }
      }, _callee6, null, [[0, 39]]);
    }));
    function getOrderData(_x1, _x10) {
      return _getOrderData.apply(this, arguments);
    }
    return getOrderData;
  }(),
  // Feedback data
  getFeedbackData: function () {
    var _getFeedbackData = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(req, res) {
      var _req$query$timeRange3, timeRange, currentDate, startDate, totalReviews, ratingResult, averageRating, reviewsByRating, recentReviews, formattedRecentReviews, feedbackData;
      return _regeneratorRuntime().wrap(function _callee7$(_context7) {
        while (1) switch (_context7.prev = _context7.next) {
          case 0:
            _context7.prev = 0;
            _req$query$timeRange3 = req.query.timeRange, timeRange = _req$query$timeRange3 === void 0 ? 'week' : _req$query$timeRange3; // Set date range based on timeRange
            currentDate = new Date();
            _context7.t0 = timeRange;
            _context7.next = _context7.t0 === 'year' ? 6 : _context7.t0 === 'month' ? 8 : _context7.t0 === 'week' ? 10 : 10;
            break;
          case 6:
            startDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
            return _context7.abrupt("break", 11);
          case 8:
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
            return _context7.abrupt("break", 11);
          case 10:
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7);
          case 11:
            _context7.next = 13;
            return _Review["default"].countDocuments();
          case 13:
            totalReviews = _context7.sent;
            _context7.next = 16;
            return _Review["default"].aggregate([{
              $group: {
                _id: null,
                avgRating: {
                  $avg: "$rating"
                }
              }
            }]);
          case 16:
            ratingResult = _context7.sent;
            averageRating = ratingResult.length > 0 ? ratingResult[0].avgRating : 0; // Reviews by rating
            _context7.next = 20;
            return _Review["default"].aggregate([{
              $group: {
                _id: "$rating",
                count: {
                  $sum: 1
                }
              }
            }, {
              $sort: {
                _id: -1
              }
            }]);
          case 20:
            reviewsByRating = _context7.sent;
            _context7.next = 23;
            return _Review["default"].find().sort({
              createdAt: -1
            }).limit(5).populate('productId', 'productName');
          case 23:
            recentReviews = _context7.sent;
            formattedRecentReviews = recentReviews.map(function (review) {
              return {
                id: review._id,
                product: review.productId ? review.productId.productName : 'Sản phẩm không rõ',
                user: review.userName,
                rating: review.rating,
                comment: review.comment,
                date: review.createdAt
              };
            }); // Combine all feedback data
            feedbackData = {
              totalReviews: totalReviews,
              averageRating: averageRating,
              reviewsByRating: reviewsByRating.map(function (item) {
                return {
                  rating: item._id,
                  count: item.count
                };
              }),
              recentReviews: formattedRecentReviews
            };
            res.json(feedbackData);
            _context7.next = 33;
            break;
          case 29:
            _context7.prev = 29;
            _context7.t1 = _context7["catch"](0);
            console.error('Error fetching feedback data:', _context7.t1);
            res.status(500).json({
              message: 'Lỗi khi lấy dữ liệu phản hồi'
            });
          case 33:
          case "end":
            return _context7.stop();
        }
      }, _callee7, null, [[0, 29]]);
    }));
    function getFeedbackData(_x11, _x12) {
      return _getFeedbackData.apply(this, arguments);
    }
    return getFeedbackData;
  }(),
  // Implement remaining methods with real database queries
  getPromotionData: function () {
    var _getPromotionData = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(req, res) {
      var _req$query$timeRange4, timeRange, coupons, voucherStats, promotionData;
      return _regeneratorRuntime().wrap(function _callee8$(_context8) {
        while (1) switch (_context8.prev = _context8.next) {
          case 0:
            _context8.prev = 0;
            _req$query$timeRange4 = req.query.timeRange, timeRange = _req$query$timeRange4 === void 0 ? 'week' : _req$query$timeRange4; // Get coupon data from database
            _context8.next = 4;
            return _Coupon["default"].find();
          case 4:
            coupons = _context8.sent;
            // Calculate usage statistics
            voucherStats = coupons.map(function (coupon) {
              // Ensure discount value is defined before calling toLocaleString
              var discountValue = coupon.discountValue || 0;
              var discountDisplay = coupon.discountType === 'percentage' ? "".concat(discountValue, "%") : "".concat(discountValue.toLocaleString(), "\u0111");
              return {
                code: coupon.code || 'Không có mã',
                type: coupon.discountType || 'unknown',
                discount: discountDisplay,
                used: coupon.usedCount || 0,
                limit: coupon.maxUses || 0,
                expiresAt: coupon.expiryDate || new Date(),
                active: coupon.expiryDate ? new Date(coupon.expiryDate) > new Date() && !coupon.isDisabled : false
              };
            });
            promotionData = {
              totalVouchers: coupons.length,
              activeVouchers: coupons.filter(function (c) {
                return c.expiryDate && new Date(c.expiryDate) > new Date() && !c.isDisabled;
              }).length,
              usedVouchers: coupons.reduce(function (total, coupon) {
                return total + (coupon.usedCount || 0);
              }, 0),
              voucherStats: voucherStats
            };
            res.json(promotionData);
            _context8.next = 14;
            break;
          case 10:
            _context8.prev = 10;
            _context8.t0 = _context8["catch"](0);
            console.error('Error fetching promotion data:', _context8.t0);
            res.status(500).json({
              message: 'Lỗi khi lấy dữ liệu khuyến mãi'
            });
          case 14:
          case "end":
            return _context8.stop();
        }
      }, _callee8, null, [[0, 10]]);
    }));
    function getPromotionData(_x13, _x14) {
      return _getPromotionData.apply(this, arguments);
    }
    return getPromotionData;
  }(),
  // Additional methods (can be implemented as needed)
  getSystemActivityData: function () {
    var _getSystemActivityData = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee9(req, res) {
      var _req$query$timeRange5, timeRange, systemActivityData;
      return _regeneratorRuntime().wrap(function _callee9$(_context9) {
        while (1) switch (_context9.prev = _context9.next) {
          case 0:
            // Trả về dữ liệu mẫu thay vì truy vấn database để tránh lỗi
            try {
              _req$query$timeRange5 = req.query.timeRange, timeRange = _req$query$timeRange5 === void 0 ? 'week' : _req$query$timeRange5; // Dữ liệu mẫu về hoạt động hệ thống
              systemActivityData = {
                logins: 125,
                registrations: 42,
                apiCalls: 1578,
                errorRate: 0.025,
                activityByHour: [{
                  hour: '00:00',
                  count: 12
                }, {
                  hour: '01:00',
                  count: 8
                }, {
                  hour: '02:00',
                  count: 5
                }, {
                  hour: '03:00',
                  count: 3
                }, {
                  hour: '04:00',
                  count: 2
                }, {
                  hour: '05:00',
                  count: 4
                }, {
                  hour: '06:00',
                  count: 10
                }, {
                  hour: '07:00',
                  count: 25
                }, {
                  hour: '08:00',
                  count: 55
                }, {
                  hour: '09:00',
                  count: 80
                }, {
                  hour: '10:00',
                  count: 96
                }, {
                  hour: '11:00',
                  count: 104
                }, {
                  hour: '12:00',
                  count: 98
                }, {
                  hour: '13:00',
                  count: 83
                }, {
                  hour: '14:00',
                  count: 75
                }, {
                  hour: '15:00',
                  count: 68
                }, {
                  hour: '16:00',
                  count: 72
                }, {
                  hour: '17:00',
                  count: 85
                }, {
                  hour: '18:00',
                  count: 92
                }, {
                  hour: '19:00',
                  count: 101
                }, {
                  hour: '20:00',
                  count: 110
                }, {
                  hour: '21:00',
                  count: 85
                }, {
                  hour: '22:00',
                  count: 65
                }, {
                  hour: '23:00',
                  count: 35
                }],
                recentActivity: [{
                  type: 'login',
                  user: 'admin',
                  timestamp: new Date(Date.now() - 1000 * 60 * 5)
                }, {
                  type: 'product_update',
                  user: 'admin',
                  item: 'Táo xanh Mỹ cao cấp',
                  timestamp: new Date(Date.now() - 1000 * 60 * 15)
                }, {
                  type: 'order_update',
                  user: 'system',
                  item: 'ORD12345',
                  timestamp: new Date(Date.now() - 1000 * 60 * 25)
                }, {
                  type: 'login',
                  user: 'manager',
                  timestamp: new Date(Date.now() - 1000 * 60 * 35)
                }, {
                  type: 'coupon_create',
                  user: 'marketing',
                  item: 'SUMMER25',
                  timestamp: new Date(Date.now() - 1000 * 60 * 55)
                }]
              };
              res.json(systemActivityData);
            } catch (error) {
              console.error('Error fetching system activity data:', error);
              res.status(500).json({
                message: 'Lỗi khi lấy dữ liệu hoạt động hệ thống'
              });
            }
          case 1:
          case "end":
            return _context9.stop();
        }
      }, _callee9);
    }));
    function getSystemActivityData(_x15, _x16) {
      return _getSystemActivityData.apply(this, arguments);
    }
    return getSystemActivityData;
  }(),
  // Delivery data
  getDeliveryData: function () {
    var _getDeliveryData = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee0(req, res) {
      return _regeneratorRuntime().wrap(function _callee0$(_context0) {
        while (1) switch (_context0.prev = _context0.next) {
          case 0:
            _context0.prev = 0;
            return _context0.abrupt("return", (0, _orderController.getDeliveryStats)(req, res));
          case 4:
            _context0.prev = 4;
            _context0.t0 = _context0["catch"](0);
            return _context0.abrupt("return", res.status(200).json({
              statistics: {
                completed: 0,
                inProgress: 0,
                delayed: 0,
                total: 0,
                avgDeliveryTime: "N/A"
              },
              deliveryPartners: [],
              deliveryTimeByRegion: [],
              deliveries: []
            }));
          case 7:
          case "end":
            return _context0.stop();
        }
      }, _callee0, null, [[0, 4]]);
    }));
    function getDeliveryData(_x17, _x18) {
      return _getDeliveryData.apply(this, arguments);
    }
    return getDeliveryData;
  }()
};
var _default = exports["default"] = reportsController;