"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _mongoose = _interopRequireDefault(require("mongoose"));
var _Order = _interopRequireDefault(require("../Model/Order.js"));
var _Products = _interopRequireDefault(require("../Model/Products.js"));
var _Register = _interopRequireDefault(require("../Model/Register.js"));
var _authMiddleware = require("../Middleware/authMiddleware.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
var router = _express["default"].Router();
// Lấy dữ liệu doanh thu theo khoảng thời gian (tuần/tháng/năm)
router.get('/revenue', _authMiddleware.verifyToken, /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(req, res) {
    var timeRange, completedOrderCount, startDate, endDate, currentDate, revenueData, daysOfWeek, completeData, _loop, i, months, _completeData, _loop2, _i;
    return _regeneratorRuntime().wrap(function _callee$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          timeRange = req.query.timeRange;
          console.log("L\u1EA5y d\u1EEF li\u1EC7u doanh thu v\u1EDBi timeRange=".concat(timeRange));

          // Kiểm tra xem có order nào đã hoàn thành không
          _context3.next = 5;
          return _Order["default"].countDocuments({
            status: 'completed'
          });
        case 5:
          completedOrderCount = _context3.sent;
          console.log("S\u1ED1 l\u01B0\u1EE3ng \u0111\u01A1n h\xE0ng \u0111\xE3 ho\xE0n th\xE0nh: ".concat(completedOrderCount));

          // Nếu không có đơn hàng hoàn thành, trả về mảng trống
          if (!(completedOrderCount === 0)) {
            _context3.next = 10;
            break;
          }
          console.log("Không có đơn hàng đã hoàn thành để tính doanh thu");
          return _context3.abrupt("return", res.json([]));
        case 10:
          currentDate = new Date(); // Xác định khoảng thời gian dựa trên timeRange
          if (!(timeRange === 'week')) {
            _context3.next = 16;
            break;
          }
          // Lấy dữ liệu 7 ngày gần nhất
          startDate = new Date(currentDate);
          startDate.setDate(currentDate.getDate() - 7);
          _context3.next = 27;
          break;
        case 16:
          if (!(timeRange === 'month')) {
            _context3.next = 21;
            break;
          }
          // Lấy dữ liệu 30 ngày gần nhất
          startDate = new Date(currentDate);
          startDate.setDate(currentDate.getDate() - 30);
          _context3.next = 27;
          break;
        case 21:
          if (!(timeRange === 'year')) {
            _context3.next = 26;
            break;
          }
          // Lấy dữ liệu 12 tháng gần nhất
          startDate = new Date(currentDate);
          startDate.setFullYear(currentDate.getFullYear() - 1);
          _context3.next = 27;
          break;
        case 26:
          return _context3.abrupt("return", res.status(400).json({
            message: 'Thông số không hợp lệ'
          }));
        case 27:
          if (!(timeRange === 'week')) {
            _context3.next = 43;
            break;
          }
          _context3.next = 30;
          return _Order["default"].aggregate([{
            $match: {
              createdAt: {
                $gte: startDate,
                $lte: currentDate
              },
              status: {
                $in: ['completed', 'delivered']
              } // Tính cả đơn hàng đã hoàn thành và đã giao
            }
          }, {
            $group: {
              _id: {
                $dayOfWeek: '$createdAt'
              },
              revenue: {
                $sum: '$totalAmount'
              }
            }
          }, {
            $sort: {
              _id: 1
            }
          }, {
            $project: {
              _id: 0,
              day: '$_id',
              revenue: 1
            }
          }]);
        case 30:
          revenueData = _context3.sent;
          // Chuyển đổi định dạng dữ liệu cho phù hợp với frontend
          daysOfWeek = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']; // Tạo dữ liệu cho tất cả các ngày trong tuần, kể cả ngày không có doanh thu
          completeData = [];
          _loop = /*#__PURE__*/_regeneratorRuntime().mark(function _loop(i) {
            var dayData;
            return _regeneratorRuntime().wrap(function _loop$(_context) {
              while (1) switch (_context.prev = _context.next) {
                case 0:
                  dayData = revenueData.find(function (item) {
                    return item.day === i;
                  });
                  completeData.push({
                    name: daysOfWeek[i - 1],
                    revenue: dayData ? dayData.revenue : 0
                  });
                case 2:
                case "end":
                  return _context.stop();
              }
            }, _loop);
          });
          i = 1;
        case 35:
          if (!(i <= 7)) {
            _context3.next = 40;
            break;
          }
          return _context3.delegateYield(_loop(i), "t0", 37);
        case 37:
          i++;
          _context3.next = 35;
          break;
        case 40:
          revenueData = completeData;
          _context3.next = 64;
          break;
        case 43:
          if (!(timeRange === 'month')) {
            _context3.next = 50;
            break;
          }
          _context3.next = 46;
          return _Order["default"].aggregate([{
            $match: {
              createdAt: {
                $gte: startDate,
                $lte: currentDate
              },
              status: {
                $in: ['completed', 'delivered']
              }
            }
          }, {
            $group: {
              _id: {
                $dayOfMonth: '$createdAt'
              },
              revenue: {
                $sum: '$totalAmount'
              }
            }
          }, {
            $sort: {
              _id: 1
            }
          }, {
            $project: {
              _id: 0,
              name: {
                $toString: '$_id'
              },
              revenue: 1
            }
          }]);
        case 46:
          revenueData = _context3.sent;
          // Đảm bảo có dữ liệu cho mỗi ngày trong tháng
          if (revenueData.length === 0) {
            revenueData = Array.from({
              length: 30
            }, function (_, i) {
              return {
                name: "".concat(i + 1),
                revenue: 0
              };
            });
          }
          _context3.next = 64;
          break;
        case 50:
          if (!(timeRange === 'year')) {
            _context3.next = 64;
            break;
          }
          _context3.next = 53;
          return _Order["default"].aggregate([{
            $match: {
              createdAt: {
                $gte: startDate,
                $lte: currentDate
              },
              status: {
                $in: ['completed', 'delivered']
              }
            }
          }, {
            $group: {
              _id: {
                $month: '$createdAt'
              },
              revenue: {
                $sum: '$totalAmount'
              }
            }
          }, {
            $sort: {
              _id: 1
            }
          }, {
            $project: {
              _id: 0,
              month: '$_id',
              revenue: 1
            }
          }]);
        case 53:
          revenueData = _context3.sent;
          // Chuyển đổi định dạng dữ liệu
          months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']; // Tạo dữ liệu cho tất cả các tháng, kể cả tháng không có doanh thu
          _completeData = [];
          _loop2 = /*#__PURE__*/_regeneratorRuntime().mark(function _loop2(_i) {
            var monthData;
            return _regeneratorRuntime().wrap(function _loop2$(_context2) {
              while (1) switch (_context2.prev = _context2.next) {
                case 0:
                  monthData = revenueData.find(function (item) {
                    return item.month === _i;
                  });
                  _completeData.push({
                    name: months[_i - 1],
                    revenue: monthData ? monthData.revenue : 0
                  });
                case 2:
                case "end":
                  return _context2.stop();
              }
            }, _loop2);
          });
          _i = 1;
        case 58:
          if (!(_i <= 12)) {
            _context3.next = 63;
            break;
          }
          return _context3.delegateYield(_loop2(_i), "t1", 60);
        case 60:
          _i++;
          _context3.next = 58;
          break;
        case 63:
          revenueData = _completeData;
        case 64:
          // Log kết quả trước khi trả về
          console.log("Revenue data result:", revenueData);
          res.json(revenueData);
          _context3.next = 72;
          break;
        case 68:
          _context3.prev = 68;
          _context3.t2 = _context3["catch"](0);
          console.error('Lỗi khi lấy dữ liệu doanh thu:', _context3.t2);
          res.status(500).json({
            message: 'Đã xảy ra lỗi khi lấy dữ liệu doanh thu'
          });
        case 72:
        case "end":
          return _context3.stop();
      }
    }, _callee, null, [[0, 68]]);
  }));
  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}());

// Lấy danh sách sản phẩm bán chạy
router.get('/top-products', _authMiddleware.verifyToken, /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res) {
    var orderCount, productCount, sampleOrder, topProducts;
    return _regeneratorRuntime().wrap(function _callee2$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _context4.next = 3;
          return _Order["default"].countDocuments({
            status: 'completed'
          });
        case 3:
          orderCount = _context4.sent;
          if (!(orderCount === 0)) {
            _context4.next = 7;
            break;
          }
          console.log("Không có đơn hàng đã hoàn thành trong hệ thống");
          return _context4.abrupt("return", res.json([]));
        case 7:
          _context4.next = 9;
          return _Products["default"].countDocuments();
        case 9:
          productCount = _context4.sent;
          if (!(productCount === 0)) {
            _context4.next = 13;
            break;
          }
          console.log("Không có sản phẩm nào trong hệ thống");
          return _context4.abrupt("return", res.json([]));
        case 13:
          _context4.next = 15;
          return _Order["default"].findOne({
            status: 'completed'
          }).lean();
        case 15:
          sampleOrder = _context4.sent;
          console.log("Sample order structure:", JSON.stringify(sampleOrder, null, 2));
          _context4.next = 19;
          return _Order["default"].aggregate([{
            $match: {
              status: 'completed'
            }
          }, {
            $unwind: {
              path: '$products',
              preserveNullAndEmptyArrays: false
            }
          }, {
            $lookup: {
              from: 'products',
              localField: 'products.productId',
              foreignField: '_id',
              as: 'productInfo'
            }
          }, {
            $group: {
              _id: '$products.productId',
              name: {
                $first: {
                  $cond: [{
                    $gt: [{
                      $size: '$productInfo'
                    }, 0]
                  }, {
                    $arrayElemAt: ['$productInfo.productName', 0]
                  }, 'Sản phẩm không xác định']
                }
              },
              sold: {
                $sum: '$products.quantity'
              },
              revenue: {
                $sum: {
                  $multiply: ['$products.price', '$products.quantity']
                }
              }
            }
          }, {
            $sort: {
              revenue: -1
            }
          }, {
            $limit: 10
          }, {
            $project: {
              _id: 0,
              name: 1,
              sold: 1,
              revenue: 1
            }
          }]);
        case 19:
          topProducts = _context4.sent;
          // Log kết quả trước khi trả về
          console.log("Top products result:", topProducts);
          res.json(topProducts);
          _context4.next = 28;
          break;
        case 24:
          _context4.prev = 24;
          _context4.t0 = _context4["catch"](0);
          console.error('Lỗi khi lấy danh sách sản phẩm bán chạy:', _context4.t0);
          res.status(500).json({
            message: 'Đã xảy ra lỗi khi lấy danh sách sản phẩm bán chạy'
          });
        case 28:
        case "end":
          return _context4.stop();
      }
    }, _callee2, null, [[0, 24]]);
  }));
  return function (_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}());

// Lấy dữ liệu tồn kho
router.get('/inventory', _authMiddleware.verifyToken, /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(req, res) {
    var productCount, sampleProduct, categories, inventory;
    return _regeneratorRuntime().wrap(function _callee3$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          console.log("Đang lấy dữ liệu tồn kho...");

          // Kiểm tra xem có sản phẩm nào không
          _context5.next = 4;
          return _Products["default"].countDocuments();
        case 4:
          productCount = _context5.sent;
          console.log("S\u1ED1 l\u01B0\u1EE3ng s\u1EA3n ph\u1EA9m: ".concat(productCount));
          if (!(productCount === 0)) {
            _context5.next = 9;
            break;
          }
          console.log("Không có sản phẩm nào trong hệ thống");
          return _context5.abrupt("return", res.json([]));
        case 9:
          _context5.next = 11;
          return _Products["default"].findOne().lean();
        case 11:
          sampleProduct = _context5.sent;
          console.log("Sample product structure:", JSON.stringify(sampleProduct, null, 2));

          // Lấy danh sách các danh mục
          _context5.next = 15;
          return _Products["default"].distinct('productCategory');
        case 15:
          categories = _context5.sent;
          console.log("Product categories:", categories);
          if (!(!categories || categories.length === 0)) {
            _context5.next = 20;
            break;
          }
          console.log("Không tìm thấy danh mục sản phẩm");
          return _context5.abrupt("return", res.json([]));
        case 20:
          _context5.next = 22;
          return _Products["default"].aggregate([{
            $group: {
              _id: '$productCategory',
              stock: {
                $sum: '$productStock'
              },
              lowStock: {
                $sum: {
                  $cond: [{
                    $lt: ['$productStock', 10]
                  }, 1, 0]
                }
              },
              value: {
                $sum: '$productStock'
              }
            }
          }, {
            $sort: {
              stock: -1
            }
          }, {
            $project: {
              _id: 0,
              name: '$_id',
              stock: 1,
              lowStock: 1,
              value: 1
            }
          }]);
        case 22:
          inventory = _context5.sent;
          // Log kết quả trước khi trả về
          console.log("Inventory data result:", inventory);
          if (!(inventory.length === 0)) {
            _context5.next = 27;
            break;
          }
          console.log("Không tìm thấy dữ liệu tồn kho");
          return _context5.abrupt("return", res.json([]));
        case 27:
          res.json(inventory);
          _context5.next = 34;
          break;
        case 30:
          _context5.prev = 30;
          _context5.t0 = _context5["catch"](0);
          console.error('Lỗi khi lấy dữ liệu tồn kho:', _context5.t0);
          res.status(500).json({
            message: 'Đã xảy ra lỗi khi lấy dữ liệu tồn kho'
          });
        case 34:
        case "end":
          return _context5.stop();
      }
    }, _callee3, null, [[0, 30]]);
  }));
  return function (_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}());

// Lấy dữ liệu người dùng
router.get('/users', _authMiddleware.verifyToken, /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(req, res) {
    var currentDate, thirtyDaysAgo, totalUsers, newUsers, activeUsers, activeUsersCount, guestOrders, userData;
    return _regeneratorRuntime().wrap(function _callee4$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          console.log("Đang lấy dữ liệu người dùng...");
          currentDate = new Date();
          thirtyDaysAgo = new Date(currentDate);
          thirtyDaysAgo.setDate(currentDate.getDate() - 30);

          // Tổng số người dùng
          _context6.next = 7;
          return _Register["default"].countDocuments({});
        case 7:
          totalUsers = _context6.sent;
          _context6.next = 10;
          return _Register["default"].countDocuments({
            createdAt: {
              $gte: thirtyDaysAgo
            }
          });
        case 10:
          newUsers = _context6.sent;
          _context6.next = 13;
          return _Order["default"].aggregate([{
            $match: {
              createdAt: {
                $gte: thirtyDaysAgo
              },
              userId: {
                $exists: true,
                $ne: null
              } // Đảm bảo userId tồn tại và không phải null
            }
          }, {
            $group: {
              _id: '$userId'
            }
          }, {
            $count: 'count'
          }]);
        case 13:
          activeUsers = _context6.sent;
          activeUsersCount = activeUsers.length > 0 ? activeUsers[0].count : 0; // Khách vãng lai (có đơn hàng nhưng không có tài khoản)
          _context6.next = 17;
          return _Order["default"].countDocuments({
            createdAt: {
              $gte: thirtyDaysAgo
            },
            $or: [{
              userId: {
                $exists: false
              }
            }, {
              userId: null
            }]
          });
        case 17:
          guestOrders = _context6.sent;
          userData = [{
            name: 'Người dùng mới',
            count: newUsers,
            color: '#8884d8'
          }, {
            name: 'Khách hàng thân thiết',
            count: activeUsersCount,
            color: '#82ca9d'
          }, {
            name: 'Khách vãng lai',
            count: guestOrders,
            color: '#ffc658'
          }]; // Log kết quả trước khi trả về
          console.log("User data result:", userData);
          res.json(userData);
          _context6.next = 27;
          break;
        case 23:
          _context6.prev = 23;
          _context6.t0 = _context6["catch"](0);
          console.error('Lỗi khi lấy dữ liệu người dùng:', _context6.t0);
          res.status(500).json({
            message: 'Đã xảy ra lỗi khi lấy dữ liệu người dùng'
          });
        case 27:
        case "end":
          return _context6.stop();
      }
    }, _callee4, null, [[0, 23]]);
  }));
  return function (_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}());

// Thêm endpoint kiểm tra cấu trúc Order
router.get('/test-structure', _authMiddleware.verifyToken, /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(req, res) {
    var orders, products, users, orderCount, productCount, userCount, orderStatus, categories;
    return _regeneratorRuntime().wrap(function _callee5$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          _context7.next = 3;
          return _Order["default"].find().limit(1);
        case 3:
          orders = _context7.sent;
          _context7.next = 6;
          return _Products["default"].find().limit(1);
        case 6:
          products = _context7.sent;
          _context7.next = 9;
          return _Register["default"].find().limit(1);
        case 9:
          users = _context7.sent;
          _context7.next = 12;
          return _Order["default"].countDocuments();
        case 12:
          orderCount = _context7.sent;
          _context7.next = 15;
          return _Products["default"].countDocuments();
        case 15:
          productCount = _context7.sent;
          _context7.next = 18;
          return _Register["default"].countDocuments();
        case 18:
          userCount = _context7.sent;
          _context7.next = 21;
          return _Order["default"].aggregate([{
            $group: {
              _id: "$status",
              count: {
                $sum: 1
              }
            }
          }]);
        case 21:
          orderStatus = _context7.sent;
          _context7.next = 24;
          return Category.find();
        case 24:
          categories = _context7.sent;
          res.json({
            message: "Cấu trúc dữ liệu đã được kiểm tra",
            orderCount: orderCount,
            productCount: productCount,
            userCount: userCount,
            orderStatus: orderStatus,
            categories: categories
          });
          _context7.next = 31;
          break;
        case 28:
          _context7.prev = 28;
          _context7.t0 = _context7["catch"](0);
          res.status(500).json({
            message: 'Đã xảy ra lỗi khi kiểm tra cấu trúc dữ liệu'
          });
        case 31:
        case "end":
          return _context7.stop();
      }
    }, _callee5, null, [[0, 28]]);
  }));
  return function (_x9, _x0) {
    return _ref5.apply(this, arguments);
  };
}());
var _default = exports["default"] = router;