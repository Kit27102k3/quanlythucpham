"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateOrderPaymentStatus = exports.updateOrder = exports.orderUpdate = exports.orderGetById = exports.orderGetAll = exports.orderGet = exports.orderDelete = exports.orderCreate = exports.notifyOrderSuccess = exports.markOrderAsPaid = exports.getTopOrders = exports.getOrderTracking = exports.getOrderStats = exports.getDeliveryStats = exports.cancelOrder = void 0;
var _Order = _interopRequireDefault(require("../Model/Order.js"));
var _Products = _interopRequireDefault(require("../Model/Products.js"));
var _axios = _interopRequireDefault(require("axios"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _emailService = require("../utils/emailService.js");
var _BestSellingProduct = _interopRequireDefault(require("../Model/BestSellingProduct.js"));
var _notificationService = require("../Services/notificationService.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } /* eslint-disable no-undef */
_dotenv["default"].config();

// Hàm tạo mã vận đơn ngẫu nhiên
function generateOrderCode() {
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var result = '';
  for (var i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Hàm cập nhật số lượng tồn kho sản phẩm
function updateProductStock(_x) {
  return _updateProductStock.apply(this, arguments);
}
function _updateProductStock() {
  _updateProductStock = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee14(products) {
    var increase,
      updateSoldCount,
      _iterator7,
      _step7,
      item,
      product,
      newStock,
      _args14 = arguments;
    return _regeneratorRuntime().wrap(function _callee14$(_context14) {
      while (1) switch (_context14.prev = _context14.next) {
        case 0:
          increase = _args14.length > 1 && _args14[1] !== undefined ? _args14[1] : false;
          updateSoldCount = _args14.length > 2 && _args14[2] !== undefined ? _args14[2] : false;
          _context14.prev = 2;
          _iterator7 = _createForOfIteratorHelper(products);
          _context14.prev = 4;
          _iterator7.s();
        case 6:
          if ((_step7 = _iterator7.n()).done) {
            _context14.next = 20;
            break;
          }
          item = _step7.value;
          _context14.next = 10;
          return _Products["default"].findById(item.productId);
        case 10:
          product = _context14.sent;
          if (!product) {
            _context14.next = 18;
            break;
          }
          // Tăng hoặc giảm số lượng tồn kho dựa vào tham số increase
          newStock = increase ? product.productStock + item.quantity : product.productStock - item.quantity; // Cập nhật số lượng tồn kho và trạng thái sản phẩm
          product.productStock = Math.max(0, newStock);

          // Cập nhật trạng thái nếu hết hàng
          if (product.productStock === 0) {
            product.productStatus = "Hết hàng";
          } else if (product.productStatus === "Hết hàng") {
            product.productStatus = "Còn hàng";
          }

          // Cập nhật số lượng bán ra nếu cần
          if (updateSoldCount && !increase) {
            product.soldCount = (product.soldCount || 0) + item.quantity;
          } else if (updateSoldCount && increase) {
            // Trừ soldCount khi hủy đơn hàng đã thanh toán
            product.soldCount = Math.max(0, (product.soldCount || 0) - item.quantity);
          }
          _context14.next = 18;
          return product.save();
        case 18:
          _context14.next = 6;
          break;
        case 20:
          _context14.next = 25;
          break;
        case 22:
          _context14.prev = 22;
          _context14.t0 = _context14["catch"](4);
          _iterator7.e(_context14.t0);
        case 25:
          _context14.prev = 25;
          _iterator7.f();
          return _context14.finish(25);
        case 28:
          _context14.next = 34;
          break;
        case 30:
          _context14.prev = 30;
          _context14.t1 = _context14["catch"](2);
          console.error("Lỗi khi cập nhật thông tin sản phẩm:", _context14.t1);
          throw _context14.t1;
        case 34:
        case "end":
          return _context14.stop();
      }
    }, _callee14, null, [[2, 30], [4, 22, 25, 28]]);
  }));
  return _updateProductStock.apply(this, arguments);
}
var orderCreate = exports.orderCreate = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(req, res) {
    var _req$body, userId, products, totalAmount, paymentMethod, coupon, _iterator, _step, item, product, order, populatedOrder, shippingInfo, emailSent, _populatedOrder$userI;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          // Validate required fields
          // eslint-disable-next-line no-unused-vars
          _req$body = req.body, userId = _req$body.userId, products = _req$body.products, totalAmount = _req$body.totalAmount, paymentMethod = _req$body.paymentMethod, coupon = _req$body.coupon;
          if (!(!userId || !products || !Array.isArray(products) || products.length === 0 || !totalAmount)) {
            _context.next = 4;
            break;
          }
          return _context.abrupt("return", res.status(400).json({
            success: false,
            error: "Missing required fields: userId, products (non-empty array), totalAmount"
          }));
        case 4:
          // Kiểm tra số lượng tồn kho trước khi tạo đơn hàng
          _iterator = _createForOfIteratorHelper(products);
          _context.prev = 5;
          _iterator.s();
        case 7:
          if ((_step = _iterator.n()).done) {
            _context.next = 18;
            break;
          }
          item = _step.value;
          _context.next = 11;
          return _Products["default"].findById(item.productId);
        case 11:
          product = _context.sent;
          if (product) {
            _context.next = 14;
            break;
          }
          return _context.abrupt("return", res.status(404).json({
            success: false,
            error: "S\u1EA3n ph\u1EA9m v\u1EDBi ID ".concat(item.productId, " kh\xF4ng t\u1ED3n t\u1EA1i")
          }));
        case 14:
          if (!(product.productStock < item.quantity)) {
            _context.next = 16;
            break;
          }
          return _context.abrupt("return", res.status(400).json({
            success: false,
            error: "S\u1EA3n ph\u1EA9m \"".concat(product.productName, "\" ch\u1EC9 c\xF2n ").concat(product.productStock, " s\u1EA3n ph\u1EA9m trong kho")
          }));
        case 16:
          _context.next = 7;
          break;
        case 18:
          _context.next = 23;
          break;
        case 20:
          _context.prev = 20;
          _context.t0 = _context["catch"](5);
          _iterator.e(_context.t0);
        case 23:
          _context.prev = 23;
          _iterator.f();
          return _context.finish(23);
        case 26:
          // Create the order with all fields from request body
          order = new _Order["default"](req.body); // Set default values if not provided
          if (!order.status) {
            order.status = paymentMethod === "cod" ? "pending" : "awaiting_payment";
          }
          if (!order.createdAt) {
            order.createdAt = new Date();
          }

          // Tạo mã vận đơn ngẫu nhiên
          if (!order.orderCode) {
            order.orderCode = generateOrderCode();
          }

          // Save the order
          _context.next = 32;
          return order.save();
        case 32:
          if (!(paymentMethod !== "cod")) {
            _context.next = 35;
            break;
          }
          _context.next = 35;
          return updateProductStock(products, false, false);
        case 35:
          _context.next = 37;
          return _Order["default"].findById(order._id).populate('userId').populate('products.productId');
        case 37:
          populatedOrder = _context.sent;
          if (!(populatedOrder && populatedOrder.userId && populatedOrder.userId.email)) {
            _context.next = 54;
            break;
          }
          _context.prev = 39;
          // Chuẩn bị thông tin giao hàng cho email
          shippingInfo = {
            fullName: "".concat(populatedOrder.userId.firstName || '', " ").concat(populatedOrder.userId.lastName || '').trim(),
            address: populatedOrder.address || populatedOrder.userId.address || '',
            phone: populatedOrder.userId.phone || '',
            email: populatedOrder.userId.email || ''
          }; // Thêm thông tin giao hàng vào đơn hàng để gửi email
          populatedOrder.shippingInfo = shippingInfo;
          console.log("Sending confirmation email to:", populatedOrder.userId.email);
          _context.next = 45;
          return (0, _emailService.sendOrderConfirmationEmail)(populatedOrder);
        case 45:
          emailSent = _context.sent;
          console.log("Email sent status:", emailSent ? "Success" : "Failed");
          _context.next = 52;
          break;
        case 49:
          _context.prev = 49;
          _context.t1 = _context["catch"](39);
          console.error("Error sending confirmation email:", _context.t1);
          // Không throw error nếu gửi email thất bại để không ảnh hưởng đến luồng đặt hàng
        case 52:
          _context.next = 55;
          break;
        case 54:
          console.log("Missing email information for order confirmation:", {
            hasOrder: !!populatedOrder,
            hasUserId: !!(populatedOrder && populatedOrder.userId),
            hasEmail: !!(populatedOrder && populatedOrder.userId && populatedOrder.userId.email),
            email: populatedOrder === null || populatedOrder === void 0 || (_populatedOrder$userI = populatedOrder.userId) === null || _populatedOrder$userI === void 0 ? void 0 : _populatedOrder$userI.email
          });
        case 55:
          return _context.abrupt("return", res.status(201).json(order));
        case 58:
          _context.prev = 58;
          _context.t2 = _context["catch"](0);
          console.error("Error creating order:", _context.t2);
          return _context.abrupt("return", res.status(500).json({
            success: false,
            error: _context.t2.message || "Lỗi khi tạo đơn hàng"
          }));
        case 62:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 58], [5, 20, 23, 26], [39, 49]]);
  }));
  return function orderCreate(_x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();
var orderGet = exports.orderGet = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res) {
    var _req$user, userId, query, orders;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          userId = req.query.userId || ((_req$user = req.user) === null || _req$user === void 0 ? void 0 : _req$user._id); // Sử dụng userId nếu có, nếu không trả về tất cả đơn hàng
          query = userId ? {
            userId: userId
          } : {};
          _context2.next = 5;
          return _Order["default"].find(query).populate('userId').populate('products.productId').sort({
            createdAt: -1
          });
        case 5:
          orders = _context2.sent;
          res.status(200).json(orders);
          _context2.next = 12;
          break;
        case 9:
          _context2.prev = 9;
          _context2.t0 = _context2["catch"](0);
          res.status(500).json({
            success: false,
            error: _context2.t0.message
          });
        case 12:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 9]]);
  }));
  return function orderGet(_x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}();
var orderGetAll = exports.orderGetAll = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(req, res) {
    var orders;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return _Order["default"].find().populate("userId").populate('products.productId').sort({
            createdAt: -1
          });
        case 3:
          orders = _context3.sent;
          res.json(orders);
          _context3.next = 10;
          break;
        case 7:
          _context3.prev = 7;
          _context3.t0 = _context3["catch"](0);
          res.status(500).json({
            error: _context3.t0.message
          });
        case 10:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[0, 7]]);
  }));
  return function orderGetAll(_x6, _x7) {
    return _ref3.apply(this, arguments);
  };
}();
var orderGetById = exports.orderGetById = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(req, res) {
    var order;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _context4.next = 3;
          return _Order["default"].findById(req.params.id).populate("userId").populate('products.productId');
        case 3:
          order = _context4.sent;
          if (order) {
            _context4.next = 6;
            break;
          }
          return _context4.abrupt("return", res.status(404).json({
            message: "Không tìm thấy đơn hàng"
          }));
        case 6:
          res.json(order);
          _context4.next = 12;
          break;
        case 9:
          _context4.prev = 9;
          _context4.t0 = _context4["catch"](0);
          res.status(500).json({
            error: _context4.t0.message
          });
        case 12:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[0, 9]]);
  }));
  return function orderGetById(_x8, _x9) {
    return _ref4.apply(this, arguments);
  };
}();

// Hàm cập nhật thông tin đơn hàng
var updateOrder = exports.updateOrder = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(req, res) {
    var orderId, updateData, order, previousStatus, newStatus, allowedFields, filteredData, _i, _Object$keys, key, statusName, newTrackingLog, populatedOrder, _iterator2, _step2, item, _iterator3, _step3, _item2, product, _populatedOrder, _iterator4, _step4, _item, updatedOrder, _order$userId, _order$userId2, _order$userId3, _order$userId4, _order$userId5, _order$userId6, emailSent, _order$userId7, _order$userId8, _order$userId9, _order$userId0, _order$userId1;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          orderId = req.params.id;
          updateData = req.body;
          console.log("updateOrder được gọi với dữ liệu:", JSON.stringify(updateData));

          // Tìm và cập nhật đơn hàng
          _context5.next = 6;
          return _Order["default"].findById(orderId).populate("userId", "firstName lastName userName email phone address").populate("products.productId");
        case 6:
          order = _context5.sent;
          if (order) {
            _context5.next = 9;
            break;
          }
          return _context5.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy đơn hàng"
          }));
        case 9:
          // Lưu trạng thái cũ trước khi cập nhật
          previousStatus = order.status;
          newStatus = updateData.status; // Lọc các trường được phép cập nhật
          allowedFields = ['status', 'orderCode', 'shippingInfo', 'notes'];
          filteredData = {};
          for (_i = 0, _Object$keys = Object.keys(updateData); _i < _Object$keys.length; _i++) {
            key = _Object$keys[_i];
            if (allowedFields.includes(key)) {
              filteredData[key] = updateData[key];
            }
          }

          // Nếu không có orderCode nhưng cần thêm, tạo một mã vận đơn mới
          if (!order.orderCode && !filteredData.orderCode) {
            filteredData.orderCode = generateOrderCode();
          }

          // THÊM MỚI: Xử lý cập nhật tracking_logs khi có thay đổi trạng thái
          if (!(newStatus && newStatus !== previousStatus)) {
            _context5.next = 57;
            break;
          }
          // Khởi tạo tracking object nếu chưa có
          if (!order.tracking) {
            order.tracking = {
              status_name: "",
              tracking_logs: []
            };
          }

          // Lấy tên hiển thị cho trạng thái
          statusName = "";
          _context5.t0 = newStatus;
          _context5.next = _context5.t0 === 'pending' ? 21 : _context5.t0 === 'confirmed' ? 23 : _context5.t0 === 'processing' ? 25 : _context5.t0 === 'preparing' ? 27 : _context5.t0 === 'packaging' ? 29 : _context5.t0 === 'shipping' ? 31 : _context5.t0 === 'shipped' ? 33 : _context5.t0 === 'delivering' ? 35 : _context5.t0 === 'delivered' ? 37 : _context5.t0 === 'completed' ? 39 : _context5.t0 === 'cancelled' ? 41 : _context5.t0 === 'awaiting_payment' ? 43 : _context5.t0 === 'refunded' ? 45 : _context5.t0 === 'failed' ? 47 : _context5.t0 === 'delivery_failed' ? 49 : 51;
          break;
        case 21:
          statusName = "Chờ xử lý";
          return _context5.abrupt("break", 52);
        case 23:
          statusName = "Đã xác nhận";
          return _context5.abrupt("break", 52);
        case 25:
          statusName = "Đang xử lý";
          return _context5.abrupt("break", 52);
        case 27:
          statusName = "Đang chuẩn bị hàng";
          return _context5.abrupt("break", 52);
        case 29:
          statusName = "Hoàn tất đóng gói";
          return _context5.abrupt("break", 52);
        case 31:
          statusName = "Đang vận chuyển";
          return _context5.abrupt("break", 52);
        case 33:
          statusName = "Đã giao cho vận chuyển";
          return _context5.abrupt("break", 52);
        case 35:
          statusName = "Đang giao hàng";
          return _context5.abrupt("break", 52);
        case 37:
          statusName = "Đã giao hàng";
          return _context5.abrupt("break", 52);
        case 39:
          statusName = "Hoàn thành";
          return _context5.abrupt("break", 52);
        case 41:
          statusName = "Đã hủy";
          return _context5.abrupt("break", 52);
        case 43:
          statusName = "Chờ thanh toán";
          return _context5.abrupt("break", 52);
        case 45:
          statusName = "Đã hoàn tiền";
          return _context5.abrupt("break", 52);
        case 47:
          statusName = "Thất bại";
          return _context5.abrupt("break", 52);
        case 49:
          statusName = "Giao hàng thất bại";
          return _context5.abrupt("break", 52);
        case 51:
          statusName = newStatus;
        case 52:
          // Thêm bản ghi mới vào đầu mảng tracking_logs
          newTrackingLog = {
            status: newStatus,
            status_name: statusName,
            timestamp: new Date().toISOString(),
            location: "Cửa hàng DNC FOOD"
          }; // Khởi tạo mảng tracking_logs nếu chưa có
          if (!order.tracking.tracking_logs) {
            order.tracking.tracking_logs = [];
          }

          // Thêm log mới vào đầu mảng (để log mới nhất nằm đầu tiên)
          order.tracking.tracking_logs.unshift(newTrackingLog);

          // Cập nhật status_name chính
          order.tracking.status_name = statusName;

          // Lưu tracking vào filteredData để cập nhật
          filteredData.tracking = order.tracking;
        case 57:
          if (!(newStatus === 'completed')) {
            _context5.next = 142;
            break;
          }
          filteredData.isPaid = true;
          filteredData.completedAt = new Date();

          // Nếu đơn hàng là COD và chưa cập nhật kho thì giảm số lượng và tăng soldCount
          if (!(order.paymentMethod === "cod" && !order.isPaid)) {
            _context5.next = 92;
            break;
          }
          _context5.next = 63;
          return updateProductStock(order.products, false, true);
        case 63:
          _context5.prev = 63;
          _context5.next = 66;
          return _Order["default"].findById(orderId).populate("products.productId");
        case 66:
          populatedOrder = _context5.sent;
          // Cập nhật từng sản phẩm trong đơn hàng
          _iterator2 = _createForOfIteratorHelper(populatedOrder.products);
          _context5.prev = 68;
          _iterator2.s();
        case 70:
          if ((_step2 = _iterator2.n()).done) {
            _context5.next = 77;
            break;
          }
          item = _step2.value;
          if (!item.productId) {
            _context5.next = 75;
            break;
          }
          _context5.next = 75;
          return _BestSellingProduct["default"].updateSalesData(item.productId._id, item.productId, item.quantity, orderId);
        case 75:
          _context5.next = 70;
          break;
        case 77:
          _context5.next = 82;
          break;
        case 79:
          _context5.prev = 79;
          _context5.t1 = _context5["catch"](68);
          _iterator2.e(_context5.t1);
        case 82:
          _context5.prev = 82;
          _iterator2.f();
          return _context5.finish(82);
        case 85:
          _context5.next = 90;
          break;
        case 87:
          _context5.prev = 87;
          _context5.t2 = _context5["catch"](63);
          console.error("Lỗi khi cập nhật sản phẩm bán chạy:", _context5.t2);
          // Không trả về lỗi, vẫn tiếp tục xử lý
        case 90:
          _context5.next = 142;
          break;
        case 92:
          if (!(order.paymentMethod !== "cod" && order.status !== "awaiting_payment")) {
            _context5.next = 142;
            break;
          }
          // Chỉ cập nhật soldCount mà không trừ kho (đã trừ lúc tạo đơn)
          _iterator3 = _createForOfIteratorHelper(order.products);
          _context5.prev = 94;
          _iterator3.s();
        case 96:
          if ((_step3 = _iterator3.n()).done) {
            _context5.next = 107;
            break;
          }
          _item2 = _step3.value;
          _context5.next = 100;
          return _Products["default"].findById(_item2.productId);
        case 100:
          product = _context5.sent;
          if (!product) {
            _context5.next = 105;
            break;
          }
          product.soldCount = (product.soldCount || 0) + _item2.quantity;
          _context5.next = 105;
          return product.save();
        case 105:
          _context5.next = 96;
          break;
        case 107:
          _context5.next = 112;
          break;
        case 109:
          _context5.prev = 109;
          _context5.t3 = _context5["catch"](94);
          _iterator3.e(_context5.t3);
        case 112:
          _context5.prev = 112;
          _iterator3.f();
          return _context5.finish(112);
        case 115:
          _context5.prev = 115;
          _context5.next = 118;
          return _Order["default"].findById(orderId).populate("products.productId");
        case 118:
          _populatedOrder = _context5.sent;
          // Cập nhật từng sản phẩm trong đơn hàng
          _iterator4 = _createForOfIteratorHelper(_populatedOrder.products);
          _context5.prev = 120;
          _iterator4.s();
        case 122:
          if ((_step4 = _iterator4.n()).done) {
            _context5.next = 129;
            break;
          }
          _item = _step4.value;
          if (!_item.productId) {
            _context5.next = 127;
            break;
          }
          _context5.next = 127;
          return _BestSellingProduct["default"].updateSalesData(_item.productId._id, _item.productId, _item.quantity, orderId);
        case 127:
          _context5.next = 122;
          break;
        case 129:
          _context5.next = 134;
          break;
        case 131:
          _context5.prev = 131;
          _context5.t4 = _context5["catch"](120);
          _iterator4.e(_context5.t4);
        case 134:
          _context5.prev = 134;
          _iterator4.f();
          return _context5.finish(134);
        case 137:
          _context5.next = 142;
          break;
        case 139:
          _context5.prev = 139;
          _context5.t5 = _context5["catch"](115);
          console.error("Lỗi khi cập nhật sản phẩm bán chạy:", _context5.t5);
          // Không trả về lỗi, vẫn tiếp tục xử lý
        case 142:
          if (!(newStatus === 'cancelled')) {
            _context5.next = 148;
            break;
          }
          if (!(previousStatus === 'completed' || previousStatus === 'delivering')) {
            _context5.next = 145;
            break;
          }
          return _context5.abrupt("return", res.status(400).json({
            success: false,
            message: previousStatus === "delivering" ? "Không thể hủy đơn hàng đang giao" : "Không thể hủy đơn hàng đã giao"
          }));
        case 145:
          if (!(order.paymentMethod !== "cod")) {
            _context5.next = 148;
            break;
          }
          _context5.next = 148;
          return updateProductStock(order.products, true, false);
        case 148:
          _context5.next = 150;
          return _Order["default"].findByIdAndUpdate(orderId, {
            $set: filteredData
          }, {
            "new": true
          }).populate("userId").populate("products.productId");
        case 150:
          updatedOrder = _context5.sent;
          if (!(newStatus === 'delivering' && previousStatus !== 'delivering')) {
            _context5.next = 171;
            break;
          }
          _context5.prev = 152;
          console.log("Đang chuẩn bị gửi email thông báo giao hàng...");
          console.log("Thông tin đơn hàng để gửi email:", {
            orderCode: order.orderCode,
            email: (_order$userId = order.userId) === null || _order$userId === void 0 ? void 0 : _order$userId.email,
            address: (_order$userId2 = order.userId) === null || _order$userId2 === void 0 ? void 0 : _order$userId2.address,
            phone: (_order$userId3 = order.userId) === null || _order$userId3 === void 0 ? void 0 : _order$userId3.phone,
            userName: (_order$userId4 = order.userId) === null || _order$userId4 === void 0 ? void 0 : _order$userId4.userName,
            firstName: (_order$userId5 = order.userId) === null || _order$userId5 === void 0 ? void 0 : _order$userId5.firstName,
            lastName: (_order$userId6 = order.userId) === null || _order$userId6 === void 0 ? void 0 : _order$userId6.lastName
          });

          // Đảm bảo order.userId đã được populate đầy đủ
          if (!(order.userId && _typeof(order.userId) === 'object')) {
            _context5.next = 162;
            break;
          }
          _context5.next = 158;
          return (0, _emailService.sendOrderShippingEmail)(order);
        case 158:
          emailSent = _context5.sent;
          if (emailSent) {
            console.log("\u0110\xE3 g\u1EEDi email th\xF4ng b\xE1o giao h\xE0ng cho \u0111\u01A1n h\xE0ng #".concat(order.orderCode || order._id));
          } else {
            console.log("Kh\xF4ng th\u1EC3 g\u1EEDi email th\xF4ng b\xE1o giao h\xE0ng cho \u0111\u01A1n h\xE0ng #".concat(order.orderCode || order._id));
            console.log("Chi tiết đơn hàng:", JSON.stringify({
              id: order._id,
              orderCode: order.orderCode,
              userId: {
                email: (_order$userId7 = order.userId) === null || _order$userId7 === void 0 ? void 0 : _order$userId7.email,
                firstName: (_order$userId8 = order.userId) === null || _order$userId8 === void 0 ? void 0 : _order$userId8.firstName,
                lastName: (_order$userId9 = order.userId) === null || _order$userId9 === void 0 ? void 0 : _order$userId9.lastName,
                address: (_order$userId0 = order.userId) === null || _order$userId0 === void 0 ? void 0 : _order$userId0.address,
                phone: (_order$userId1 = order.userId) === null || _order$userId1 === void 0 ? void 0 : _order$userId1.phone
              }
            }, null, 2));
          }
          _context5.next = 163;
          break;
        case 162:
          console.log("Không thể gửi email: order.userId không được populate đầy đủ");
        case 163:
          _context5.next = 169;
          break;
        case 165:
          _context5.prev = 165;
          _context5.t6 = _context5["catch"](152);
          console.error('Lỗi khi gửi email thông báo giao hàng:', _context5.t6);
          console.error('Stack trace:', _context5.t6.stack);
          // Không trả về lỗi cho client, chỉ log lỗi
        case 169:
          _context5.next = 181;
          break;
        case 171:
          if (!(newStatus && newStatus !== previousStatus && updatedOrder.shippingInfo && updatedOrder.shippingInfo.email)) {
            _context5.next = 181;
            break;
          }
          _context5.prev = 172;
          _context5.next = 175;
          return (0, _emailService.sendOrderConfirmationEmail)(updatedOrder);
        case 175:
          console.log("\u0110\xE3 g\u1EEDi email c\u1EADp nh\u1EADt tr\u1EA1ng th\xE1i \u0111\u01A1n h\xE0ng ".concat(updatedOrder.orderCode, " \u0111\u1EBFn ").concat(updatedOrder.shippingInfo.email));
          _context5.next = 181;
          break;
        case 178:
          _context5.prev = 178;
          _context5.t7 = _context5["catch"](172);
          console.error('Lỗi khi gửi email cập nhật trạng thái đơn hàng:', _context5.t7);
        case 181:
          if (!(newStatus && newStatus !== previousStatus && updatedOrder.userId)) {
            _context5.next = 191;
            break;
          }
          _context5.prev = 182;
          _context5.next = 185;
          return (0, _notificationService.sendOrderStatusNotification)(updatedOrder.userId, updatedOrder, getStatusText(updatedOrder.status));
        case 185:
          console.log("\u0110\xE3 g\u1EEDi th\xF4ng b\xE1o c\u1EADp nh\u1EADt tr\u1EA1ng th\xE1i \u0111\u01A1n h\xE0ng ".concat(updatedOrder.orderCode, " \u0111\u1EBFn user ").concat(updatedOrder.userId));
          _context5.next = 191;
          break;
        case 188:
          _context5.prev = 188;
          _context5.t8 = _context5["catch"](182);
          console.error('Lỗi khi gửi thông báo cập nhật trạng thái đơn hàng:', _context5.t8);
        case 191:
          return _context5.abrupt("return", res.status(200).json({
            success: true,
            message: "Cập nhật đơn hàng thành công",
            data: updatedOrder
          }));
        case 194:
          _context5.prev = 194;
          _context5.t9 = _context5["catch"](0);
          console.error("Error in updateOrder:", _context5.t9);
          console.error(_context5.t9.stack);
          return _context5.abrupt("return", res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật đơn hàng",
            error: _context5.t9.message
          }));
        case 199:
        case "end":
          return _context5.stop();
      }
    }, _callee5, null, [[0, 194], [63, 87], [68, 79, 82, 85], [94, 109, 112, 115], [115, 139], [120, 131, 134, 137], [152, 165], [172, 178], [182, 188]]);
  }));
  return function updateOrder(_x0, _x1) {
    return _ref5.apply(this, arguments);
  };
}();
var orderUpdate = exports.orderUpdate = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(req, res) {
    var _currentOrder$userId, status, currentOrder, previousStatus, _currentOrder$userId2, emailSent, _currentOrder$userId3, _currentOrder$userId4, _currentOrder$userId5, updatedOrder;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          status = req.body.status;
          console.log("orderUpdate called with status:", status);
          console.log("Request body:", JSON.stringify(req.body));

          // Trước tiên lấy thông tin đơn hàng hiện tại để theo dõi thay đổi trạng thái
          // Đảm bảo populate đầy đủ thông tin để gửi email
          _context6.next = 6;
          return _Order["default"].findById(req.params.id).populate("userId", "firstName lastName userName email phone address").populate("products.productId");
        case 6:
          currentOrder = _context6.sent;
          if (currentOrder) {
            _context6.next = 10;
            break;
          }
          console.log("Không tìm thấy đơn hàng với ID:", req.params.id);
          return _context6.abrupt("return", res.status(404).json({
            error: "Không tìm thấy đơn hàng"
          }));
        case 10:
          console.log("Thông tin đơn hàng trước khi cập nhật:", {
            id: currentOrder._id,
            status: currentOrder.status,
            email: (_currentOrder$userId = currentOrder.userId) === null || _currentOrder$userId === void 0 ? void 0 : _currentOrder$userId.email,
            orderCode: currentOrder.orderCode
          });

          // Lưu trạng thái cũ trước khi cập nhật
          previousStatus = currentOrder.status; // Cập nhật trạng thái đơn hàng
          currentOrder.status = status;
          _context6.next = 15;
          return currentOrder.save();
        case 15:
          if (!(status === 'delivering' && previousStatus !== 'delivering')) {
            _context6.next = 29;
            break;
          }
          _context6.prev = 16;
          console.log("Đang chuẩn bị gửi email thông báo giao hàng...");
          console.log("Đơn hàng có userId với email:", (_currentOrder$userId2 = currentOrder.userId) === null || _currentOrder$userId2 === void 0 ? void 0 : _currentOrder$userId2.email);

          // Gửi email thông báo đơn hàng đang được giao
          _context6.next = 21;
          return (0, _emailService.sendOrderShippingEmail)(currentOrder);
        case 21:
          emailSent = _context6.sent;
          if (emailSent) {
            console.log("\u0110\xE3 g\u1EEDi email th\xF4ng b\xE1o giao h\xE0ng cho \u0111\u01A1n h\xE0ng #".concat(currentOrder.orderCode || currentOrder._id));
          } else {
            console.log("Kh\xF4ng th\u1EC3 g\u1EEDi email th\xF4ng b\xE1o giao h\xE0ng cho \u0111\u01A1n h\xE0ng #".concat(currentOrder.orderCode || currentOrder._id));
            console.log("Chi tiết đơn hàng:", JSON.stringify({
              id: currentOrder._id,
              orderCode: currentOrder.orderCode,
              userId: {
                email: (_currentOrder$userId3 = currentOrder.userId) === null || _currentOrder$userId3 === void 0 ? void 0 : _currentOrder$userId3.email,
                firstName: (_currentOrder$userId4 = currentOrder.userId) === null || _currentOrder$userId4 === void 0 ? void 0 : _currentOrder$userId4.firstName,
                lastName: (_currentOrder$userId5 = currentOrder.userId) === null || _currentOrder$userId5 === void 0 ? void 0 : _currentOrder$userId5.lastName
              }
            }, null, 2));
          }
          _context6.next = 29;
          break;
        case 25:
          _context6.prev = 25;
          _context6.t0 = _context6["catch"](16);
          console.error('Lỗi khi gửi email thông báo giao hàng:', _context6.t0);
          console.error('Stack trace:', _context6.t0.stack);
          // Không trả về lỗi cho client, chỉ log lỗi
        case 29:
          _context6.next = 31;
          return _Order["default"].findById(req.params.id).populate("userId").populate("products.productId");
        case 31:
          updatedOrder = _context6.sent;
          res.json(updatedOrder);
          _context6.next = 40;
          break;
        case 35:
          _context6.prev = 35;
          _context6.t1 = _context6["catch"](0);
          console.error("Lỗi khi cập nhật trạng thái đơn hàng:", _context6.t1);
          console.error("Stack trace:", _context6.t1.stack);
          res.status(500).json({
            error: _context6.t1.message
          });
        case 40:
        case "end":
          return _context6.stop();
      }
    }, _callee6, null, [[0, 35], [16, 25]]);
  }));
  return function orderUpdate(_x10, _x11) {
    return _ref6.apply(this, arguments);
  };
}();

// Thêm controller mới để đánh dấu đơn hàng đã thanh toán
var markOrderAsPaid = exports.markOrderAsPaid = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(req, res) {
    var orderId, _req$body2, isPaid, status, updateData, order, wasPaid, previousStatus, statusName, newTrackingLog, _iterator5, _step5, item, updatedOrder;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          orderId = req.params.id;
          _req$body2 = req.body, isPaid = _req$body2.isPaid, status = _req$body2.status; // Cập nhật thông tin đơn hàng: trạng thái thanh toán và trạng thái đơn hàng (nếu có)
          updateData = {
            isPaid: isPaid
          }; // Tìm đơn hàng để kiểm tra
          _context7.next = 6;
          return _Order["default"].findById(orderId).populate("products.productId");
        case 6:
          order = _context7.sent;
          if (order) {
            _context7.next = 9;
            break;
          }
          return _context7.abrupt("return", res.status(404).json({
            error: "Không tìm thấy đơn hàng"
          }));
        case 9:
          // Theo dõi trạng thái trước khi cập nhật
          wasPaid = order.isPaid;
          previousStatus = order.status; // Nếu có trạng thái mới được gửi lên, cập nhật trạng thái đơn hàng
          if (status) {
            updateData.status = status;
          }

          // THÊM MỚI: Xử lý cập nhật tracking_logs khi có thay đổi trạng thái hoặc thanh toán
          if (!(status && status !== previousStatus || isPaid && !wasPaid)) {
            _context7.next = 58;
            break;
          }
          // Khởi tạo tracking object nếu chưa có
          if (!order.tracking) {
            order.tracking = {
              status_name: "",
              tracking_logs: []
            };
          }

          // Lấy tên hiển thị cho trạng thái
          statusName = "";
          if (!status) {
            _context7.next = 52;
            break;
          }
          _context7.t0 = status;
          _context7.next = _context7.t0 === 'pending' ? 19 : _context7.t0 === 'confirmed' ? 21 : _context7.t0 === 'processing' ? 23 : _context7.t0 === 'preparing' ? 25 : _context7.t0 === 'packaging' ? 27 : _context7.t0 === 'shipping' ? 29 : _context7.t0 === 'shipped' ? 31 : _context7.t0 === 'delivering' ? 33 : _context7.t0 === 'delivered' ? 35 : _context7.t0 === 'completed' ? 37 : _context7.t0 === 'cancelled' ? 39 : _context7.t0 === 'awaiting_payment' ? 41 : _context7.t0 === 'refunded' ? 43 : _context7.t0 === 'failed' ? 45 : _context7.t0 === 'delivery_failed' ? 47 : 49;
          break;
        case 19:
          statusName = "Chờ xử lý";
          return _context7.abrupt("break", 50);
        case 21:
          statusName = "Đã xác nhận";
          return _context7.abrupt("break", 50);
        case 23:
          statusName = "Đang xử lý";
          return _context7.abrupt("break", 50);
        case 25:
          statusName = "Đang chuẩn bị hàng";
          return _context7.abrupt("break", 50);
        case 27:
          statusName = "Hoàn tất đóng gói";
          return _context7.abrupt("break", 50);
        case 29:
          statusName = "Đang vận chuyển";
          return _context7.abrupt("break", 50);
        case 31:
          statusName = "Đã giao cho vận chuyển";
          return _context7.abrupt("break", 50);
        case 33:
          statusName = "Đang giao hàng";
          return _context7.abrupt("break", 50);
        case 35:
          statusName = "Đã giao hàng";
          return _context7.abrupt("break", 50);
        case 37:
          statusName = "Hoàn thành";
          return _context7.abrupt("break", 50);
        case 39:
          statusName = "Đã hủy";
          return _context7.abrupt("break", 50);
        case 41:
          statusName = "Chờ thanh toán";
          return _context7.abrupt("break", 50);
        case 43:
          statusName = "Đã hoàn tiền";
          return _context7.abrupt("break", 50);
        case 45:
          statusName = "Thất bại";
          return _context7.abrupt("break", 50);
        case 47:
          statusName = "Giao hàng thất bại";
          return _context7.abrupt("break", 50);
        case 49:
          statusName = status;
        case 50:
          _context7.next = 53;
          break;
        case 52:
          if (isPaid && !wasPaid) {
            statusName = "Đã thanh toán";
          }
        case 53:
          // Thêm bản ghi mới vào đầu mảng tracking_logs
          newTrackingLog = {
            status: status || order.status,
            status_name: statusName || "Cập nhật thanh toán",
            timestamp: new Date().toISOString(),
            location: "Cửa hàng DNC FOOD"
          }; // Khởi tạo mảng tracking_logs nếu chưa có
          if (!order.tracking.tracking_logs) {
            order.tracking.tracking_logs = [];
          }

          // Thêm log mới vào đầu mảng (để log mới nhất nằm đầu tiên)
          order.tracking.tracking_logs.unshift(newTrackingLog);

          // Cập nhật status_name chính
          if (statusName) {
            order.tracking.status_name = statusName;
          }

          // Lưu tracking vào updateData để cập nhật
          updateData.tracking = order.tracking;
        case 58:
          // Nếu đánh dấu là đã thanh toán và hoàn thành, cập nhật thời gian hoàn thành
          if (isPaid && status === 'completed') {
            updateData.completedAt = new Date();
          }

          // Nếu đơn hàng COD hoặc chưa từng thanh toán, và giờ đã thanh toán
          if (!(order.paymentMethod === "cod" && !wasPaid && isPaid)) {
            _context7.next = 86;
            break;
          }
          _context7.next = 62;
          return updateProductStock(order.products, false, true);
        case 62:
          _context7.prev = 62;
          _iterator5 = _createForOfIteratorHelper(order.products);
          _context7.prev = 64;
          _iterator5.s();
        case 66:
          if ((_step5 = _iterator5.n()).done) {
            _context7.next = 73;
            break;
          }
          item = _step5.value;
          if (!item.productId) {
            _context7.next = 71;
            break;
          }
          _context7.next = 71;
          return _BestSellingProduct["default"].updateSalesData(item.productId._id, item.productId, item.quantity, orderId);
        case 71:
          _context7.next = 66;
          break;
        case 73:
          _context7.next = 78;
          break;
        case 75:
          _context7.prev = 75;
          _context7.t1 = _context7["catch"](64);
          _iterator5.e(_context7.t1);
        case 78:
          _context7.prev = 78;
          _iterator5.f();
          return _context7.finish(78);
        case 81:
          _context7.next = 86;
          break;
        case 83:
          _context7.prev = 83;
          _context7.t2 = _context7["catch"](62);
          console.error("Lỗi khi cập nhật sản phẩm bán chạy:", _context7.t2);
          // Không trả về lỗi, vẫn tiếp tục xử lý
        case 86:
          _context7.next = 88;
          return _Order["default"].findByIdAndUpdate(orderId, updateData, {
            "new": true
          }).populate("userId").populate("products.productId");
        case 88:
          updatedOrder = _context7.sent;
          // Ghi log hoặc thông báo
          console.log("\u0110\u01A1n h\xE0ng ".concat(orderId, " \u0111\xE3 \u0111\u01B0\u1EE3c \u0111\xE1nh d\u1EA5u l\xE0 \u0111\xE3 thanh to\xE1n").concat(status ? " v\xE0 chuy\u1EC3n tr\u1EA1ng th\xE1i th\xE0nh ".concat(status) : ''));

          // Gửi email thông báo nếu có email và khi đơn hàng chuyển sang trạng thái completed
          if (!(status === 'completed' && order.shippingInfo && order.shippingInfo.email)) {
            _context7.next = 100;
            break;
          }
          _context7.prev = 91;
          _context7.next = 94;
          return (0, _emailService.sendOrderConfirmationEmail)(updatedOrder);
        case 94:
          console.log("\u0110\xE3 g\u1EEDi email ho\xE0n th\xE0nh \u0111\u01A1n h\xE0ng ".concat(order.orderCode, " \u0111\u1EBFn ").concat(order.shippingInfo.email));
          _context7.next = 100;
          break;
        case 97:
          _context7.prev = 97;
          _context7.t3 = _context7["catch"](91);
          console.error('Lỗi khi gửi email hoàn thành đơn hàng:', _context7.t3);
        case 100:
          res.json(updatedOrder);
          _context7.next = 107;
          break;
        case 103:
          _context7.prev = 103;
          _context7.t4 = _context7["catch"](0);
          console.error("Lỗi khi đánh dấu đơn hàng đã thanh toán:", _context7.t4);
          res.status(500).json({
            error: _context7.t4.message
          });
        case 107:
        case "end":
          return _context7.stop();
      }
    }, _callee7, null, [[0, 103], [62, 83], [64, 75, 78, 81], [91, 97]]);
  }));
  return function markOrderAsPaid(_x12, _x13) {
    return _ref7.apply(this, arguments);
  };
}();
var orderDelete = exports.orderDelete = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(req, res) {
    var order;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          _context8.next = 3;
          return _Order["default"].findByIdAndDelete(req.params.id);
        case 3:
          order = _context8.sent;
          if (order) {
            _context8.next = 6;
            break;
          }
          return _context8.abrupt("return", res.status(404).json({
            message: "Không tìm thấy đơn hàng"
          }));
        case 6:
          res.json({
            message: "Đơn hàng đã được xóa thành công"
          });
          _context8.next = 12;
          break;
        case 9:
          _context8.prev = 9;
          _context8.t0 = _context8["catch"](0);
          res.status(500).json({
            error: _context8.t0.message
          });
        case 12:
        case "end":
          return _context8.stop();
      }
    }, _callee8, null, [[0, 9]]);
  }));
  return function orderDelete(_x14, _x15) {
    return _ref8.apply(this, arguments);
  };
}();

// Hàm hủy đơn hàng
var cancelOrder = exports.cancelOrder = /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee9(req, res) {
    var orderId, order;
    return _regeneratorRuntime().wrap(function _callee9$(_context9) {
      while (1) switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          orderId = req.params.id;
          _context9.next = 4;
          return _Order["default"].findById(orderId);
        case 4:
          order = _context9.sent;
          if (order) {
            _context9.next = 7;
            break;
          }
          return _context9.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy đơn hàng"
          }));
        case 7:
          if (!(order.status === 'completed' || order.status === 'delivering')) {
            _context9.next = 9;
            break;
          }
          return _context9.abrupt("return", res.status(400).json({
            success: false,
            message: order.status === "delivering" ? "Không thể hủy đơn hàng đang giao" : "Không thể hủy đơn hàng đã giao"
          }));
        case 9:
          // Cập nhật trạng thái đơn hàng thành 'cancelled'
          order.status = 'cancelled';
          _context9.next = 12;
          return order.save();
        case 12:
          if (!(order.paymentMethod !== "cod")) {
            _context9.next = 17;
            break;
          }
          _context9.next = 15;
          return updateProductStock(order.products, true, false);
        case 15:
          _context9.next = 20;
          break;
        case 17:
          if (!(order.paymentMethod === "cod" && order.isPaid)) {
            _context9.next = 20;
            break;
          }
          _context9.next = 20;
          return updateProductStock(order.products, false, true);
        case 20:
          return _context9.abrupt("return", res.status(200).json({
            success: true,
            message: "Hủy đơn hàng thành công",
            data: order
          }));
        case 23:
          _context9.prev = 23;
          _context9.t0 = _context9["catch"](0);
          return _context9.abrupt("return", res.status(500).json({
            success: false,
            message: "Lỗi khi hủy đơn hàng",
            error: _context9.t0.message
          }));
        case 26:
        case "end":
          return _context9.stop();
      }
    }, _callee9, null, [[0, 23]]);
  }));
  return function cancelOrder(_x16, _x17) {
    return _ref9.apply(this, arguments);
  };
}();

// Lấy thông tin tracking từ Giao Hàng Nhanh API
var getOrderTracking = exports.getOrderTracking = /*#__PURE__*/function () {
  var _ref0 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee0(req, res) {
    var orderCode, order, estimatedDelivery, SHOP_ID, SHOP_TOKEN_API, USE_MOCK_ON_ERROR, mockData, response, _mockData, _mockData2, _error$response, _USE_MOCK_ON_ERROR, _order, _mockData3, _mockData4;
    return _regeneratorRuntime().wrap(function _callee0$(_context0) {
      while (1) switch (_context0.prev = _context0.next) {
        case 0:
          _context0.prev = 0;
          orderCode = req.params.orderCode;
          if (orderCode) {
            _context0.next = 4;
            break;
          }
          return _context0.abrupt("return", res.status(400).json({
            success: false,
            message: "Thiếu mã vận đơn"
          }));
        case 4:
          _context0.next = 6;
          return _Order["default"].findOne({
            orderCode: orderCode
          });
        case 6:
          order = _context0.sent;
          if (order) {
            _context0.next = 9;
            break;
          }
          return _context0.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy đơn hàng với mã vận đơn này"
          }));
        case 9:
          if (!(order.tracking && order.tracking.tracking_logs && order.tracking.tracking_logs.length > 0)) {
            _context0.next = 13;
            break;
          }
          console.log("Sử dụng thông tin tracking từ database");

          // Tạo estimated_delivery_time nếu chưa có
          if (!order.tracking.estimated_delivery_time) {
            estimatedDelivery = new Date();
            estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);
            order.tracking.estimated_delivery_time = estimatedDelivery.toISOString();
          }
          return _context0.abrupt("return", res.status(200).json({
            success: true,
            data: {
              order_code: order.orderCode,
              status: order.status,
              status_name: order.tracking.status_name || getStatusText(order.status),
              estimated_delivery_time: order.tracking.estimated_delivery_time,
              tracking_logs: order.tracking.tracking_logs,
              current_location: "Cửa hàng DNC FOOD",
              delivery_note: order.notes || "Hàng dễ vỡ, xin nhẹ tay"
            },
            isMocked: false
          }));
        case 13:
          // Tiếp tục với code gọi API GHN nếu cần
          SHOP_ID = process.env.SHOP_ID;
          SHOP_TOKEN_API = process.env.SHOP_TOKEN_API;
          USE_MOCK_ON_ERROR = process.env.USE_MOCK_ON_ERROR === 'true';
          if (!(!SHOP_ID || !SHOP_TOKEN_API)) {
            _context0.next = 22;
            break;
          }
          console.log("Thiếu thông tin cấu hình GHN trong biến môi trường");
          if (!USE_MOCK_ON_ERROR) {
            _context0.next = 21;
            break;
          }
          // Tạo dữ liệu giả lập dựa trên thông tin đơn hàng thực tế
          mockData = generateMockTrackingDataFromOrder(order);
          return _context0.abrupt("return", res.status(200).json({
            success: true,
            data: mockData,
            isMocked: true,
            message: "Đang sử dụng dữ liệu giả lập do thiếu cấu hình GHN API"
          }));
        case 21:
          return _context0.abrupt("return", res.status(500).json({
            success: false,
            message: "Thiếu thông tin cấu hình GHN"
          }));
        case 22:
          _context0.prev = 22;
          console.log("\u0110ang g\u1ECDi API GHN v\u1EDBi m\xE3 v\u1EADn \u0111\u01A1n: ".concat(orderCode));
          console.log("Th\xF4ng tin Shop: ID=".concat(SHOP_ID, ", TOKEN=").concat(SHOP_TOKEN_API.substring(0, 10), "..."));

          // Gọi API GHN để lấy thông tin tracking
          _context0.next = 27;
          return _axios["default"].post("https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/detail", {
            order_code: orderCode
          }, {
            headers: {
              'Token': SHOP_TOKEN_API,
              'ShopId': SHOP_ID,
              'Content-Type': 'application/json'
            }
          });
        case 27:
          response = _context0.sent;
          console.log("Kết quả từ API GHN:", JSON.stringify(response.data, null, 2));

          // Nếu API trả về lỗi, xử lý và trả về response phù hợp
          if (!(response.data.code !== 200)) {
            _context0.next = 35;
            break;
          }
          console.log("Lỗi từ GHN API:", response.data);
          if (!USE_MOCK_ON_ERROR) {
            _context0.next = 34;
            break;
          }
          // Tạo dữ liệu giả lập dựa trên thông tin đơn hàng thực tế
          _mockData = generateMockTrackingDataFromOrder(order);
          return _context0.abrupt("return", res.status(200).json({
            success: true,
            data: _mockData,
            isMocked: true,
            message: "Đang sử dụng dữ liệu giả lập do API GHN trả về lỗi"
          }));
        case 34:
          return _context0.abrupt("return", res.status(response.data.code).json({
            success: false,
            message: response.data.message || "Lỗi từ API GHN",
            code: response.data.code
          }));
        case 35:
          return _context0.abrupt("return", res.status(200).json({
            success: true,
            data: response.data.data,
            isMocked: false
          }));
        case 38:
          _context0.prev = 38;
          _context0.t0 = _context0["catch"](22);
          console.error("Lỗi gọi API GHN:", _context0.t0.message);
          if (!USE_MOCK_ON_ERROR) {
            _context0.next = 44;
            break;
          }
          // Tạo dữ liệu giả lập dựa trên thông tin đơn hàng thực tế
          _mockData2 = generateMockTrackingDataFromOrder(order);
          return _context0.abrupt("return", res.status(200).json({
            success: true,
            data: _mockData2,
            isMocked: true,
            message: "Đang sử dụng dữ liệu giả lập do không thể kết nối API GHN"
          }));
        case 44:
          return _context0.abrupt("return", res.status(500).json({
            success: false,
            message: "Không thể kết nối đến API GHN",
            error: _context0.t0.message
          }));
        case 45:
          _context0.next = 67;
          break;
        case 47:
          _context0.prev = 47;
          _context0.t1 = _context0["catch"](0);
          console.error("Lỗi khi lấy thông tin vận chuyển:", ((_error$response = _context0.t1.response) === null || _error$response === void 0 ? void 0 : _error$response.data) || _context0.t1.message);
          _USE_MOCK_ON_ERROR = process.env.USE_MOCK_ON_ERROR === 'true';
          if (!_USE_MOCK_ON_ERROR) {
            _context0.next = 66;
            break;
          }
          _context0.prev = 52;
          _context0.next = 55;
          return _Order["default"].findOne({
            orderCode: req.params.orderCode
          });
        case 55:
          _order = _context0.sent;
          if (!_order) {
            _context0.next = 59;
            break;
          }
          // Tạo dữ liệu giả lập dựa trên thông tin đơn hàng thực tế
          _mockData3 = generateMockTrackingDataFromOrder(_order);
          return _context0.abrupt("return", res.status(200).json({
            success: true,
            data: _mockData3,
            isMocked: true,
            message: "Đang sử dụng dữ liệu giả lập do lỗi hệ thống"
          }));
        case 59:
          _context0.next = 64;
          break;
        case 61:
          _context0.prev = 61;
          _context0.t2 = _context0["catch"](52);
          console.error("Lỗi khi tìm đơn hàng:", _context0.t2);
        case 64:
          // Nếu không tìm thấy đơn hàng hoặc có lỗi, sử dụng dữ liệu giả lập mặc định
          _mockData4 = generateMockTrackingData(req.params.orderCode);
          return _context0.abrupt("return", res.status(200).json({
            success: true,
            data: _mockData4,
            isMocked: true,
            message: "Đang sử dụng dữ liệu giả lập do lỗi hệ thống"
          }));
        case 66:
          return _context0.abrupt("return", res.status(500).json({
            success: false,
            message: "Lỗi hệ thống khi lấy thông tin vận chuyển",
            error: _context0.t1.message
          }));
        case 67:
        case "end":
          return _context0.stop();
      }
    }, _callee0, null, [[0, 47], [22, 38], [52, 61]]);
  }));
  return function getOrderTracking(_x18, _x19) {
    return _ref0.apply(this, arguments);
  };
}();

// Hàm chuyển đổi trạng thái đơn hàng thành text hiển thị
function getStatusText(status) {
  switch (status) {
    case 'pending':
      return "Chờ xử lý";
    case 'confirmed':
      return "Đã xác nhận";
    case 'processing':
      return "Đang xử lý";
    case 'preparing':
      return "Đang chuẩn bị hàng";
    case 'packaging':
      return "Hoàn tất đóng gói";
    case 'shipping':
      return "Đang vận chuyển";
    case 'shipped':
      return "Đã giao cho vận chuyển";
    case 'delivering':
      return "Đang giao hàng";
    case 'delivered':
      return "Đã giao hàng";
    case 'completed':
      return "Hoàn thành";
    case 'cancelled':
      return "Đã hủy";
    case 'awaiting_payment':
      return "Chờ thanh toán";
    case 'refunded':
      return "Đã hoàn tiền";
    case 'failed':
      return "Thất bại";
    case 'delivery_failed':
      return "Giao hàng thất bại";
    default:
      return status;
  }
}

// Hàm tạo dữ liệu giả lập từ đơn hàng thực tế
function generateMockTrackingDataFromOrder(order) {
  var now = new Date();
  var trackingLogs = [];

  // Sử dụng tracking_logs nếu đã có
  if (order.tracking && order.tracking.tracking_logs && order.tracking.tracking_logs.length > 0) {
    trackingLogs = order.tracking.tracking_logs;
  }
  // Nếu không có tracking_logs, tạo dữ liệu giả lập dựa vào trạng thái hiện tại
  else {
    // Tạo các mốc thời gian giả lập
    var timeDay2 = new Date(now);
    timeDay2.setHours(now.getHours() - 24); // 1 ngày trước

    var timeToday1 = new Date(now);
    timeToday1.setHours(now.getHours() - 10); // 10 giờ trước

    var timeToday2 = new Date(now);
    timeToday2.setHours(now.getHours() - 5); // 5 giờ trước

    var timeLatest = new Date(now);
    timeLatest.setMinutes(now.getMinutes() - 30); // 30 phút trước

    // Tạo logs dựa trên trạng thái đơn hàng
    switch (order.status) {
      case 'completed':
        trackingLogs = [{
          status: "completed",
          status_name: "Hoàn thành",
          timestamp: now.toISOString(),
          location: "Địa chỉ giao hàng"
        }, {
          status: "delivered",
          status_name: "Đã giao hàng",
          timestamp: timeLatest.toISOString(),
          location: "Địa chỉ giao hàng"
        }, {
          status: "delivering",
          status_name: "Đang giao hàng",
          timestamp: timeToday2.toISOString(),
          location: "Trung tâm phân loại"
        }, {
          status: "shipping",
          status_name: "Đang vận chuyển",
          timestamp: timeToday1.toISOString(),
          location: "Cửa hàng DNC FOOD"
        }, {
          status: "packaging",
          status_name: "Hoàn tất đóng gói",
          timestamp: timeDay2.toISOString(),
          location: "Cửa hàng DNC FOOD"
        }];
        break;
      case 'delivering':
        trackingLogs = [{
          status: "delivering",
          status_name: "Đang giao hàng",
          timestamp: timeLatest.toISOString(),
          location: "Trung tâm phân loại"
        }, {
          status: "shipping",
          status_name: "Đang vận chuyển",
          timestamp: timeToday1.toISOString(),
          location: "Cửa hàng DNC FOOD"
        }, {
          status: "packaging",
          status_name: "Hoàn tất đóng gói",
          timestamp: timeDay2.toISOString(),
          location: "Cửa hàng DNC FOOD"
        }];
        break;
      case 'shipping':
        trackingLogs = [{
          status: "shipping",
          status_name: "Đang vận chuyển",
          timestamp: timeLatest.toISOString(),
          location: "Cửa hàng DNC FOOD"
        }, {
          status: "packaging",
          status_name: "Hoàn tất đóng gói",
          timestamp: timeToday1.toISOString(),
          location: "Cửa hàng DNC FOOD"
        }];
        break;
      case 'packaging':
        trackingLogs = [{
          status: "packaging",
          status_name: "Hoàn tất đóng gói",
          timestamp: timeLatest.toISOString(),
          location: "Cửa hàng DNC FOOD"
        }];
        break;
      default:
        // Với các trạng thái khác, tạo một bản ghi phù hợp
        trackingLogs = [{
          status: order.status,
          status_name: getStatusText(order.status),
          timestamp: now.toISOString(),
          location: "Cửa hàng DNC FOOD"
        }];
    }
  }

  // Tạo ngày dự kiến giao hàng (3 ngày từ hiện tại)
  var estimatedDelivery = new Date(now);
  estimatedDelivery.setDate(now.getDate() + 3);

  // Lấy trạng thái và tên trạng thái từ bản ghi mới nhất
  var status = trackingLogs.length > 0 ? trackingLogs[0].status : order.status;
  var status_name = trackingLogs.length > 0 ? trackingLogs[0].status_name : getStatusText(order.status);

  // Trả về cấu trúc dữ liệu tracking
  return {
    order_code: order.orderCode,
    status: status,
    status_name: status_name,
    estimated_delivery_time: estimatedDelivery.toISOString(),
    tracking_logs: trackingLogs,
    current_location: "Cửa hàng DNC FOOD",
    delivery_note: order.notes || "Hàng dễ vỡ, xin nhẹ tay"
  };
}

// Giữ lại hàm cũ để tương thích ngược
function generateMockTrackingData(orderCode) {
  var now = new Date();

  // Tạo các mốc thời gian giả lập
  var timeDay2 = new Date(now);
  timeDay2.setHours(now.getHours() - 24); // 1 ngày trước

  var timeToday1 = new Date(now);
  timeToday1.setHours(now.getHours() - 10); // 10 giờ trước

  var timeToday2 = new Date(now);
  timeToday2.setHours(now.getHours() - 5); // 5 giờ trước

  var timeLatest = new Date(now);
  timeLatest.setMinutes(now.getMinutes() - 30); // 30 phút trước

  // Tạo ngày dự kiến giao hàng (3 ngày từ hiện tại)
  var estimatedDelivery = new Date(now);
  estimatedDelivery.setDate(now.getDate() + 3); // Dự kiến giao sau 3 ngày

  // Tạo danh sách các log vận chuyển giả lập (từ mới đến cũ)
  var trackingLogs = [{
    status: "packaging",
    status_name: "Hoàn tất đóng gói",
    timestamp: timeDay2.toISOString(),
    location: "Cửa hàng DNC FOOD"
  }, {
    status: "shipping",
    status_name: "Đã giao cho vận chuyển",
    timestamp: timeToday1.toISOString(),
    location: "Cửa hàng DNC FOOD"
  }, {
    status: "collected",
    status_name: "Đã lấy hàng",
    timestamp: timeToday2.toISOString(),
    location: "Cửa hàng DNC FOOD"
  }, {
    status: "delivering",
    status_name: "Đang giao hàng",
    timestamp: timeLatest.toISOString(),
    location: "Trung tâm phân loại"
  }];

  // Trả về cấu trúc dữ liệu tracking giả lập
  return {
    order_code: orderCode,
    status: "delivering",
    status_name: "Đang giao hàng",
    estimated_delivery_time: estimatedDelivery.toISOString(),
    tracking_logs: trackingLogs,
    current_location: "Trung tâm phân phối",
    delivery_note: "Hàng dễ vỡ, xin nhẹ tay"
  };
}

// Cập nhật trạng thái thanh toán của đơn hàng
var updateOrderPaymentStatus = exports.updateOrderPaymentStatus = /*#__PURE__*/function () {
  var _ref1 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee1(req, res) {
    var id, _req$body3, paymentStatus, isPaid, order, oldPaymentStatus, oldIsPaid, updateData, statusName, newTrackingLog, updatedOrder, _iterator6, _step6, item;
    return _regeneratorRuntime().wrap(function _callee1$(_context1) {
      while (1) switch (_context1.prev = _context1.next) {
        case 0:
          _context1.prev = 0;
          id = req.params.id;
          _req$body3 = req.body, paymentStatus = _req$body3.paymentStatus, isPaid = _req$body3.isPaid; // Validate input
          if (id) {
            _context1.next = 5;
            break;
          }
          return _context1.abrupt("return", res.status(400).json({
            success: false,
            message: "Order ID is required"
          }));
        case 5:
          _context1.next = 7;
          return _Order["default"].findById(id);
        case 7:
          order = _context1.sent;
          if (order) {
            _context1.next = 10;
            break;
          }
          return _context1.abrupt("return", res.status(404).json({
            success: false,
            message: "Order not found"
          }));
        case 10:
          // Track old values for comparison
          oldPaymentStatus = order.paymentStatus;
          oldIsPaid = order.isPaid; // Update payment status
          updateData = {};
          if (paymentStatus !== undefined) {
            updateData.paymentStatus = paymentStatus;
          }
          if (isPaid !== undefined) {
            updateData.isPaid = isPaid;
          }

          // THÊM MỚI: Cập nhật tracking_logs khi trạng thái thanh toán thay đổi
          if (!(paymentStatus && paymentStatus !== oldPaymentStatus || isPaid !== undefined && isPaid !== oldIsPaid)) {
            _context1.next = 38;
            break;
          }
          // Khởi tạo tracking object nếu chưa có
          if (!order.tracking) {
            order.tracking = {
              status_name: "",
              tracking_logs: []
            };
          }

          // Tạo status_name theo trạng thái thanh toán mới
          statusName = "";
          if (!paymentStatus) {
            _context1.next = 33;
            break;
          }
          _context1.t0 = paymentStatus;
          _context1.next = _context1.t0 === 'pending' ? 22 : _context1.t0 === 'completed' ? 24 : _context1.t0 === 'failed' ? 26 : _context1.t0 === 'refunded' ? 28 : 30;
          break;
        case 22:
          statusName = "Chờ thanh toán";
          return _context1.abrupt("break", 31);
        case 24:
          statusName = "Đã thanh toán";
          return _context1.abrupt("break", 31);
        case 26:
          statusName = "Thanh toán thất bại";
          return _context1.abrupt("break", 31);
        case 28:
          statusName = "Đã hoàn tiền";
          return _context1.abrupt("break", 31);
        case 30:
          statusName = "Tr\u1EA1ng th\xE1i thanh to\xE1n: ".concat(paymentStatus);
        case 31:
          _context1.next = 34;
          break;
        case 33:
          if (isPaid !== undefined) {
            statusName = isPaid ? "Đã thanh toán" : "Chưa thanh toán";
          }
        case 34:
          // Thêm bản ghi mới vào đầu mảng tracking_logs
          newTrackingLog = {
            status: order.status,
            status_name: statusName || "Cập nhật thanh toán",
            timestamp: new Date().toISOString(),
            location: "Cửa hàng DNC FOOD"
          }; // Khởi tạo mảng tracking_logs nếu chưa có
          if (!order.tracking.tracking_logs) {
            order.tracking.tracking_logs = [];
          }

          // Thêm log mới vào đầu mảng (để log mới nhất nằm đầu tiên)
          order.tracking.tracking_logs.unshift(newTrackingLog);

          // Lưu tracking vào updateData để cập nhật
          updateData.tracking = order.tracking;
        case 38:
          _context1.next = 40;
          return _Order["default"].findByIdAndUpdate(id, {
            $set: updateData
          }, {
            "new": true
          }).populate("userId").populate("products.productId");
        case 40:
          updatedOrder = _context1.sent;
          if (!(isPaid && !oldIsPaid)) {
            _context1.next = 66;
            break;
          }
          _context1.prev = 42;
          _iterator6 = _createForOfIteratorHelper(updatedOrder.products);
          _context1.prev = 44;
          _iterator6.s();
        case 46:
          if ((_step6 = _iterator6.n()).done) {
            _context1.next = 53;
            break;
          }
          item = _step6.value;
          if (!item.productId) {
            _context1.next = 51;
            break;
          }
          _context1.next = 51;
          return _BestSellingProduct["default"].updateSalesData(item.productId._id, item.productId, item.quantity, id);
        case 51:
          _context1.next = 46;
          break;
        case 53:
          _context1.next = 58;
          break;
        case 55:
          _context1.prev = 55;
          _context1.t1 = _context1["catch"](44);
          _iterator6.e(_context1.t1);
        case 58:
          _context1.prev = 58;
          _iterator6.f();
          return _context1.finish(58);
        case 61:
          _context1.next = 66;
          break;
        case 63:
          _context1.prev = 63;
          _context1.t2 = _context1["catch"](42);
          console.error("Error updating bestselling products:", _context1.t2);
        case 66:
          if (!(updatedOrder.userId && (paymentStatus && paymentStatus !== oldPaymentStatus || isPaid !== undefined && isPaid !== oldIsPaid))) {
            _context1.next = 76;
            break;
          }
          _context1.prev = 67;
          _context1.next = 70;
          return (0, _notificationService.sendOrderStatusNotification)(updatedOrder.userId, updatedOrder, getStatusText(updatedOrder.status));
        case 70:
          console.log("\u0110\xE3 g\u1EEDi th\xF4ng b\xE1o c\u1EADp nh\u1EADt tr\u1EA1ng th\xE1i thanh to\xE1n \u0111\u01A1n h\xE0ng ".concat(updatedOrder.orderCode, " \u0111\u1EBFn user ").concat(updatedOrder.userId));
          _context1.next = 76;
          break;
        case 73:
          _context1.prev = 73;
          _context1.t3 = _context1["catch"](67);
          console.error('Lỗi khi gửi thông báo cập nhật trạng thái thanh toán:', _context1.t3);
        case 76:
          return _context1.abrupt("return", res.status(200).json({
            success: true,
            message: "Order payment status updated successfully",
            data: updatedOrder
          }));
        case 79:
          _context1.prev = 79;
          _context1.t4 = _context1["catch"](0);
          console.error("Error updating payment status:", _context1.t4);
          return _context1.abrupt("return", res.status(500).json({
            success: false,
            message: "Error updating payment status",
            error: _context1.t4.message
          }));
        case 83:
        case "end":
          return _context1.stop();
      }
    }, _callee1, null, [[0, 79], [42, 63], [44, 55, 58, 61], [67, 73]]);
  }));
  return function updateOrderPaymentStatus(_x20, _x21) {
    return _ref1.apply(this, arguments);
  };
}();

// Thêm controller function mới để gửi email xác nhận đơn hàng
var notifyOrderSuccess = exports.notifyOrderSuccess = /*#__PURE__*/function () {
  var _ref10 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee10(req, res) {
    var _order$userId10, _order$userId11, _order$userId12, _order$userId13, _order$userId14, _order$userId15, _order$userId16, orderId, _req$body4, email, fullName, phone, address, order, shippingInfo, emailSent;
    return _regeneratorRuntime().wrap(function _callee10$(_context10) {
      while (1) switch (_context10.prev = _context10.next) {
        case 0:
          _context10.prev = 0;
          orderId = req.params.id;
          _req$body4 = req.body, email = _req$body4.email, fullName = _req$body4.fullName, phone = _req$body4.phone, address = _req$body4.address;
          console.log("=====================================================");
          console.log("NOTIFY ORDER SUCCESS - ATTEMPTING TO SEND EMAIL");
          console.log("Order ID: ".concat(orderId));
          console.log("Email data:", {
            email: email,
            fullName: fullName,
            phone: phone,
            address: address
          });

          // Lấy thông tin đơn hàng
          _context10.next = 9;
          return _Order["default"].findById(orderId).populate("userId").populate("products.productId");
        case 9:
          order = _context10.sent;
          if (order) {
            _context10.next = 13;
            break;
          }
          console.log("Order not found with ID: ".concat(orderId));
          return _context10.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy đơn hàng"
          }));
        case 13:
          console.log("Order found:", {
            orderCode: order.orderCode,
            userId: (_order$userId10 = order.userId) === null || _order$userId10 === void 0 ? void 0 : _order$userId10._id,
            userEmail: (_order$userId11 = order.userId) === null || _order$userId11 === void 0 ? void 0 : _order$userId11.email,
            totalAmount: order.totalAmount
          });

          // Tạo thông tin giao hàng cho email
          shippingInfo = {
            fullName: fullName || "".concat(((_order$userId12 = order.userId) === null || _order$userId12 === void 0 ? void 0 : _order$userId12.firstName) || '', " ").concat(((_order$userId13 = order.userId) === null || _order$userId13 === void 0 ? void 0 : _order$userId13.lastName) || '').trim(),
            address: address || order.address || ((_order$userId14 = order.userId) === null || _order$userId14 === void 0 ? void 0 : _order$userId14.address) || '',
            phone: phone || ((_order$userId15 = order.userId) === null || _order$userId15 === void 0 ? void 0 : _order$userId15.phone) || '',
            email: email || ((_order$userId16 = order.userId) === null || _order$userId16 === void 0 ? void 0 : _order$userId16.email) || ''
          };
          console.log("Shipping info prepared:", shippingInfo);

          // Đảm bảo có email trong shippingInfo
          if (shippingInfo.email) {
            _context10.next = 19;
            break;
          }
          console.log("ERROR: No email provided in request or found in order");
          return _context10.abrupt("return", res.status(400).json({
            success: false,
            message: "Thiếu địa chỉ email để gửi xác nhận đơn hàng"
          }));
        case 19:
          // Gắn thông tin giao hàng vào đơn hàng
          order.shippingInfo = shippingInfo;

          // Lưu lại thông tin shippingInfo vào đơn hàng để sử dụng sau này
          _context10.prev = 20;
          _context10.next = 23;
          return _Order["default"].findByIdAndUpdate(orderId, {
            shippingInfo: shippingInfo
          });
        case 23:
          console.log("Updated order with shippingInfo");
          _context10.next = 29;
          break;
        case 26:
          _context10.prev = 26;
          _context10.t0 = _context10["catch"](20);
          console.log("Warning: Could not update order with shippingInfo: ".concat(_context10.t0.message));
          // Tiếp tục thực hiện gửi email mặc dù không cập nhật được order
        case 29:
          // Gửi email xác nhận đơn hàng
          console.log("Attempting to send confirmation email to: ".concat(shippingInfo.email));
          _context10.next = 32;
          return (0, _emailService.sendOrderConfirmationEmail)(order);
        case 32:
          emailSent = _context10.sent;
          console.log("Email sent result: ".concat(emailSent ? "SUCCESS" : "FAILED"));
          if (!emailSent) {
            _context10.next = 40;
            break;
          }
          console.log("Email successfully sent to: ".concat(shippingInfo.email));
          console.log("=====================================================");
          return _context10.abrupt("return", res.status(200).json({
            success: true,
            message: "Email xác nhận đơn hàng đã được gửi thành công"
          }));
        case 40:
          console.log("Failed to send email to: ".concat(shippingInfo.email));
          console.log("=====================================================");
          return _context10.abrupt("return", res.status(400).json({
            success: false,
            message: "Không thể gửi email xác nhận đơn hàng"
          }));
        case 43:
          _context10.next = 50;
          break;
        case 45:
          _context10.prev = 45;
          _context10.t1 = _context10["catch"](0);
          console.error("Error in notifyOrderSuccess:", _context10.t1);
          console.log("=====================================================");
          return _context10.abrupt("return", res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi gửi email xác nhận đơn hàng",
            error: _context10.t1.message
          }));
        case 50:
        case "end":
          return _context10.stop();
      }
    }, _callee10, null, [[0, 45], [20, 26]]);
  }));
  return function notifyOrderSuccess(_x22, _x23) {
    return _ref10.apply(this, arguments);
  };
}();

// Hàm lấy top đơn hàng có giá trị cao nhất
var getTopOrders = exports.getTopOrders = /*#__PURE__*/function () {
  var _ref11 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee11(req, res) {
    var limit, topOrders, formattedOrders;
    return _regeneratorRuntime().wrap(function _callee11$(_context11) {
      while (1) switch (_context11.prev = _context11.next) {
        case 0:
          _context11.prev = 0;
          limit = parseInt(req.query.limit) || 10; // Mặc định lấy top 10 đơn hàng
          // Tìm đơn hàng và sắp xếp theo totalAmount giảm dần
          _context11.next = 4;
          return _Order["default"].find().populate("userId", "firstName lastName email userName").sort({
            totalAmount: -1
          }).limit(limit);
        case 4:
          topOrders = _context11.sent;
          // Định dạng lại dữ liệu để phù hợp với cấu trúc hiển thị
          formattedOrders = topOrders.map(function (order) {
            // Định dạng tên khách hàng
            var customerName = 'Khách hàng';
            if (order.userId) {
              if (order.userId.firstName || order.userId.lastName) {
                customerName = "".concat(order.userId.firstName || '', " ").concat(order.userId.lastName || '').trim();
              } else if (order.userId.userName) {
                customerName = order.userId.userName;
              } else if (order.userId.email) {
                customerName = order.userId.email;
              }
            }

            // Định dạng ngày đặt hàng
            var orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
            var formattedDate = "".concat(orderDate.getDate(), "/").concat(orderDate.getMonth() + 1, "/").concat(orderDate.getFullYear());

            // Chuyển đổi trạng thái sang tiếng Việt
            var statusText = 'Đang xử lý';
            switch (order.status) {
              case 'pending':
                statusText = 'Đang xử lý';
                break;
              case 'confirmed':
                statusText = 'Đã xác nhận';
                break;
              case 'processing':
                statusText = 'Đang xử lý';
                break;
              case 'shipping':
                statusText = 'Đang vận chuyển';
                break;
              case 'delivering':
                statusText = 'Đang giao hàng';
                break;
              case 'delivered':
                statusText = 'Đã giao hàng';
                break;
              case 'completed':
                statusText = 'Đã hoàn thành';
                break;
              case 'cancelled':
                statusText = 'Đã hủy';
                break;
              case 'awaiting_payment':
                statusText = 'Chờ thanh toán';
                break;
              default:
                statusText = order.status;
            }
            return {
              id: order.orderCode || order._id,
              customer: customerName,
              total: order.totalAmount,
              status: statusText,
              date: formattedDate
            };
          });
          res.status(200).json(formattedOrders);
          _context11.next = 13;
          break;
        case 9:
          _context11.prev = 9;
          _context11.t0 = _context11["catch"](0);
          console.error('Lỗi khi lấy danh sách đơn hàng giá trị cao nhất:', _context11.t0);
          res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách đơn hàng giá trị cao nhất',
            error: _context11.t0.message
          });
        case 13:
        case "end":
          return _context11.stop();
      }
    }, _callee11, null, [[0, 9]]);
  }));
  return function getTopOrders(_x24, _x25) {
    return _ref11.apply(this, arguments);
  };
}();

// Hàm lấy thống kê đơn hàng
var getOrderStats = exports.getOrderStats = /*#__PURE__*/function () {
  var _ref12 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee12(req, res) {
    var period, startDate, endDate, pendingCount, shippingCount, completedCount, cancelledCount, totalOrders, orderStatus, processingTime, completedOrders, totalProcessingTime, totalShippingTime, totalTotalTime, avgProcessingTime, avgShippingTime, avgTotalTime, topOrders, formattedTopOrders;
    return _regeneratorRuntime().wrap(function _callee12$(_context12) {
      while (1) switch (_context12.prev = _context12.next) {
        case 0:
          _context12.prev = 0;
          period = req.query.period || 'week'; // Mặc định là tuần
          startDate = new Date();
          endDate = new Date(); // Thiết lập khoảng thời gian dựa trên period
          _context12.t0 = period;
          _context12.next = _context12.t0 === 'week' ? 7 : _context12.t0 === 'month' ? 9 : _context12.t0 === 'year' ? 11 : 13;
          break;
        case 7:
          startDate.setDate(startDate.getDate() - 7);
          return _context12.abrupt("break", 14);
        case 9:
          startDate.setDate(startDate.getDate() - 30);
          return _context12.abrupt("break", 14);
        case 11:
          startDate.setDate(startDate.getDate() - 365);
          return _context12.abrupt("break", 14);
        case 13:
          startDate.setDate(startDate.getDate() - 7);
        case 14:
          _context12.next = 16;
          return _Order["default"].countDocuments({
            status: {
              $in: ['pending', 'processing', 'awaiting_payment']
            },
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          });
        case 16:
          pendingCount = _context12.sent;
          _context12.next = 19;
          return _Order["default"].countDocuments({
            status: {
              $in: ['shipping', 'delivering']
            },
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          });
        case 19:
          shippingCount = _context12.sent;
          _context12.next = 22;
          return _Order["default"].countDocuments({
            status: 'completed',
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          });
        case 22:
          completedCount = _context12.sent;
          _context12.next = 25;
          return _Order["default"].countDocuments({
            status: 'cancelled',
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          });
        case 25:
          cancelledCount = _context12.sent;
          // Tính tổng số đơn hàng
          totalOrders = pendingCount + shippingCount + completedCount + cancelledCount; // Dữ liệu cho biểu đồ trạng thái đơn hàng
          orderStatus = [{
            name: 'Đang xử lý',
            value: pendingCount
          }, {
            name: 'Đang giao',
            value: shippingCount
          }, {
            name: 'Đã giao',
            value: completedCount
          }, {
            name: 'Đã hủy',
            value: cancelledCount
          }]; // Tính toán thời gian xử lý trung bình dựa trên dữ liệu thực tế
          processingTime = [];
          _context12.prev = 29;
          _context12.next = 32;
          return _Order["default"].find({
            status: 'completed',
            createdAt: {
              $gte: startDate,
              $lte: endDate
            },
            completedAt: {
              $exists: true
            }
          });
        case 32:
          completedOrders = _context12.sent;
          if (completedOrders.length > 0) {
            // Tính tổng thời gian xử lý
            totalProcessingTime = 0;
            totalShippingTime = 0;
            totalTotalTime = 0;
            completedOrders.forEach(function (order) {
              // Nếu có tracking logs, sử dụng chúng để tính thời gian chính xác hơn
              if (order.tracking && Array.isArray(order.tracking.tracking_logs) && order.tracking.tracking_logs.length >= 2) {
                var logs = order.tracking.tracking_logs;
                // Sắp xếp logs theo thời gian
                logs.sort(function (a, b) {
                  return new Date(a.timestamp) - new Date(b.timestamp);
                });

                // Tính thời gian từ tạo đơn đến đóng gói
                var packagingLog = logs.find(function (log) {
                  return log.status === 'packaging' || log.status_name.includes('đóng gói');
                });
                if (packagingLog) {
                  var packagingTime = (new Date(packagingLog.timestamp) - new Date(order.createdAt)) / (1000 * 60); // Phút
                  totalProcessingTime += packagingTime;
                }

                // Tính thời gian từ đóng gói đến giao hàng
                var shippingLog = logs.find(function (log) {
                  return log.status === 'shipping' || log.status === 'delivering';
                });
                var deliveredLog = logs.find(function (log) {
                  return log.status === 'delivered' || log.status === 'completed';
                });
                if (shippingLog && deliveredLog) {
                  var deliveryTime = (new Date(deliveredLog.timestamp) - new Date(shippingLog.timestamp)) / (1000 * 60);
                  totalShippingTime += deliveryTime;
                }

                // Tính tổng thời gian từ tạo đơn đến hoàn thành
                totalTotalTime += (new Date(order.completedAt) - new Date(order.createdAt)) / (1000 * 60);
              } else {
                // Nếu không có tracking logs, sử dụng createdAt và completedAt
                var totalTime = (new Date(order.completedAt) - new Date(order.createdAt)) / (1000 * 60);
                totalTotalTime += totalTime;

                // Giả định tỷ lệ thời gian cho từng giai đoạn
                totalProcessingTime += totalTime * 0.3; // 30% thời gian cho xử lý
                totalShippingTime += totalTime * 0.7; // 70% thời gian cho vận chuyển
              }
            });

            // Tính thời gian trung bình
            avgProcessingTime = Math.round(totalProcessingTime / completedOrders.length);
            avgShippingTime = Math.round(totalShippingTime / completedOrders.length);
            avgTotalTime = Math.round(totalTotalTime / completedOrders.length);
            processingTime = [{
              name: 'Xác nhận & Đóng gói',
              time: avgProcessingTime || 15
            }, {
              name: 'Vận chuyển',
              time: avgShippingTime || 45
            }, {
              name: 'Tổng thời gian',
              time: avgTotalTime || 60
            }];
          } else {
            // Nếu không có đơn hàng hoàn thành, sử dụng dữ liệu mẫu
            processingTime = [{
              name: 'Xác nhận',
              time: 15
            }, {
              name: 'Đóng gói',
              time: 30
            }, {
              name: 'Vận chuyển',
              time: 45
            }];
          }
          _context12.next = 40;
          break;
        case 36:
          _context12.prev = 36;
          _context12.t1 = _context12["catch"](29);
          console.error('Lỗi khi tính toán thời gian xử lý trung bình:', _context12.t1);
          // Dữ liệu mẫu khi có lỗi
          processingTime = [{
            name: 'Xác nhận',
            time: 15
          }, {
            name: 'Đóng gói',
            time: 30
          }, {
            name: 'Vận chuyển',
            time: 45
          }];
        case 40:
          _context12.next = 42;
          return _Order["default"].find({
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          }).populate("userId", "firstName lastName email userName").sort({
            totalAmount: -1
          }).limit(10);
        case 42:
          topOrders = _context12.sent;
          // Định dạng lại dữ liệu top orders
          formattedTopOrders = topOrders.map(function (order) {
            // Định dạng tên khách hàng
            var customerName = 'Khách hàng';
            if (order.userId) {
              if (order.userId.firstName || order.userId.lastName) {
                customerName = "".concat(order.userId.firstName || '', " ").concat(order.userId.lastName || '').trim();
              } else if (order.userId.userName) {
                customerName = order.userId.userName;
              } else if (order.userId.email) {
                customerName = order.userId.email;
              }
            }

            // Định dạng ngày đặt hàng
            var orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
            var formattedDate = "".concat(orderDate.getDate(), "/").concat(orderDate.getMonth() + 1, "/").concat(orderDate.getFullYear());

            // Chuyển đổi trạng thái sang tiếng Việt
            var statusText = 'Đang xử lý';
            switch (order.status) {
              case 'pending':
                statusText = 'Đang xử lý';
                break;
              case 'confirmed':
                statusText = 'Đã xác nhận';
                break;
              case 'processing':
                statusText = 'Đang xử lý';
                break;
              case 'shipping':
                statusText = 'Đang vận chuyển';
                break;
              case 'delivering':
                statusText = 'Đang giao hàng';
                break;
              case 'delivered':
                statusText = 'Đã giao hàng';
                break;
              case 'completed':
                statusText = 'Đã hoàn thành';
                break;
              case 'cancelled':
                statusText = 'Đã hủy';
                break;
              case 'awaiting_payment':
                statusText = 'Chờ thanh toán';
                break;
              default:
                statusText = order.status;
            }
            return {
              id: order.orderCode || order._id,
              customer: customerName,
              total: order.totalAmount,
              status: statusText,
              date: formattedDate
            };
          }); // Trả về dữ liệu thống kê
          res.status(200).json({
            totalOrders: totalOrders,
            pendingOrders: pendingCount,
            completedOrders: completedCount,
            cancelledOrders: cancelledCount,
            orderStatus: orderStatus,
            processingTime: processingTime,
            topOrders: formattedTopOrders
          });
          _context12.next = 51;
          break;
        case 47:
          _context12.prev = 47;
          _context12.t2 = _context12["catch"](0);
          console.error('Lỗi khi lấy thống kê đơn hàng:', _context12.t2);
          res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê đơn hàng',
            error: _context12.t2.message
          });
        case 51:
        case "end":
          return _context12.stop();
      }
    }, _callee12, null, [[0, 47], [29, 36]]);
  }));
  return function getOrderStats(_x26, _x27) {
    return _ref12.apply(this, arguments);
  };
}();

// Hàm lấy thống kê giao hàng
var getDeliveryStats = exports.getDeliveryStats = /*#__PURE__*/function () {
  var _ref13 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee13(req, res) {
    var period, startDate, endDate, completedCount, inProgressCount, delayedCount, totalDeliveries, avgDeliveryTime, completedOrders, totalDeliveryHours, validOrderCount, deliveryPartners, deliveryTimeByRegion, recentOrders, deliveries;
    return _regeneratorRuntime().wrap(function _callee13$(_context13) {
      while (1) switch (_context13.prev = _context13.next) {
        case 0:
          _context13.prev = 0;
          period = req.query.period || 'week'; // Mặc định là tuần
          startDate = new Date();
          endDate = new Date(); // Thiết lập khoảng thời gian dựa trên period
          _context13.t0 = period;
          _context13.next = _context13.t0 === 'week' ? 7 : _context13.t0 === 'month' ? 9 : _context13.t0 === 'year' ? 11 : 13;
          break;
        case 7:
          startDate.setDate(startDate.getDate() - 7);
          return _context13.abrupt("break", 14);
        case 9:
          startDate.setDate(startDate.getDate() - 30);
          return _context13.abrupt("break", 14);
        case 11:
          startDate.setDate(startDate.getDate() - 365);
          return _context13.abrupt("break", 14);
        case 13:
          startDate.setDate(startDate.getDate() - 7);
        case 14:
          _context13.next = 16;
          return _Order["default"].countDocuments({
            status: {
              $in: ['completed', 'delivered']
            },
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          });
        case 16:
          completedCount = _context13.sent;
          _context13.next = 19;
          return _Order["default"].countDocuments({
            status: {
              $in: ['shipping', 'delivering']
            },
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          });
        case 19:
          inProgressCount = _context13.sent;
          _context13.next = 22;
          return _Order["default"].countDocuments({
            status: 'delivery_failed',
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          });
        case 22:
          delayedCount = _context13.sent;
          // Tính tổng số đơn hàng liên quan đến giao hàng
          totalDeliveries = completedCount + inProgressCount + delayedCount; // Tính thời gian giao hàng trung bình
          avgDeliveryTime = "N/A";
          _context13.prev = 25;
          _context13.next = 28;
          return _Order["default"].find({
            status: {
              $in: ['completed', 'delivered']
            },
            createdAt: {
              $gte: startDate,
              $lte: endDate
            },
            'tracking.tracking_logs': {
              $exists: true,
              $ne: []
            }
          });
        case 28:
          completedOrders = _context13.sent;
          if (completedOrders.length > 0) {
            totalDeliveryHours = 0;
            validOrderCount = 0;
            completedOrders.forEach(function (order) {
              if (order.tracking && Array.isArray(order.tracking.tracking_logs) && order.tracking.tracking_logs.length >= 2) {
                var logs = _toConsumableArray(order.tracking.tracking_logs).sort(function (a, b) {
                  return new Date(a.timestamp) - new Date(b.timestamp);
                });

                // Tìm log đầu tiên và log hoàn thành
                var firstLog = logs[0];
                var completionLog = logs.find(function (log) {
                  return log.status === 'completed' || log.status === 'delivered' || log.status_name.includes('hoàn thành') || log.status_name.includes('đã giao');
                });
                if (firstLog && completionLog) {
                  var startTime = new Date(firstLog.timestamp);
                  var endTime = new Date(completionLog.timestamp);
                  var deliveryHours = (endTime - startTime) / (1000 * 60 * 60);
                  if (deliveryHours > 0 && deliveryHours < 240) {
                    // Loại bỏ giá trị bất thường (> 10 ngày)
                    totalDeliveryHours += deliveryHours;
                    validOrderCount++;
                  }
                }
              }
            });
            if (validOrderCount > 0) {
              avgDeliveryTime = "".concat((totalDeliveryHours / validOrderCount).toFixed(1), " gi\u1EDD");
            }
          }
          _context13.next = 35;
          break;
        case 32:
          _context13.prev = 32;
          _context13.t1 = _context13["catch"](25);
          console.error('Lỗi khi tính thời gian giao hàng trung bình:', _context13.t1);
        case 35:
          // Thống kê đơn hàng theo đối tác giao hàng (mặc định là Giao Hàng Nhanh)
          deliveryPartners = [{
            name: 'Giao Hàng Nhanh',
            value: Math.round(totalDeliveries * 0.75)
          }, {
            name: 'Viettel Post',
            value: Math.round(totalDeliveries * 0.15)
          }, {
            name: 'Grab',
            value: Math.round(totalDeliveries * 0.07)
          }, {
            name: 'Khác',
            value: Math.round(totalDeliveries * 0.03)
          }]; // Dữ liệu thời gian giao hàng theo khu vực
          deliveryTimeByRegion = [{
            region: 'Tp.HCM',
            time: 12
          }, {
            region: 'Hà Nội',
            time: 24
          }, {
            region: 'Đà Nẵng',
            time: 36
          }, {
            region: 'Cần Thơ',
            time: 48
          }, {
            region: 'Tỉnh khác',
            time: 72
          }]; // Lấy danh sách đơn hàng gần đây để hiển thị
          _context13.next = 39;
          return _Order["default"].find({
            status: {
              $nin: ['cancelled', 'failed', 'awaiting_payment']
            },
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          }).populate("userId", "firstName lastName email").sort({
            createdAt: -1
          }).limit(10);
        case 39:
          recentOrders = _context13.sent;
          // Chuyển đổi đơn hàng thành định dạng hiển thị cho giao hàng
          deliveries = recentOrders.map(function (order) {
            // Xác định trạng thái giao hàng
            var status = 'Đang xử lý';
            if (order.status === 'completed' || order.status === 'delivered') {
              status = 'Hoàn thành';
            } else if (order.status === 'shipping' || order.status === 'delivering') {
              status = 'Đang giao';
            } else if (order.status === 'delivery_failed') {
              status = 'Thất bại';
            }

            // Định dạng tên khách hàng
            var customerName = 'Khách hàng';
            if (order.userId) {
              if (order.userId.firstName || order.userId.lastName) {
                customerName = "".concat(order.userId.firstName || '', " ").concat(order.userId.lastName || '').trim();
              } else if (order.userId.email) {
                customerName = order.userId.email;
              }
            }

            // Xác định đối tác giao hàng (mặc định là GHN)
            var partner = order.shippingPartner || 'Giao Hàng Nhanh';

            // Định dạng địa chỉ
            var address = order.shippingInfo && order.shippingInfo.address || order.address || order.userId && order.userId.address || 'Không có thông tin';
            return {
              orderId: order.orderCode || order._id,
              customerName: customerName,
              address: address,
              partner: partner,
              deliveryTime: order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A',
              status: status
            };
          }); // Trả về dữ liệu thống kê
          res.status(200).json({
            statistics: {
              completed: completedCount,
              inProgress: inProgressCount,
              delayed: delayedCount,
              total: totalDeliveries,
              avgDeliveryTime: avgDeliveryTime
            },
            deliveryPartners: deliveryPartners,
            deliveryTimeByRegion: deliveryTimeByRegion,
            deliveries: deliveries
          });
          _context13.next = 48;
          break;
        case 44:
          _context13.prev = 44;
          _context13.t2 = _context13["catch"](0);
          console.error('Lỗi khi lấy thống kê giao hàng:', _context13.t2);
          res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê giao hàng',
            error: _context13.t2.message
          });
        case 48:
        case "end":
          return _context13.stop();
      }
    }, _callee13, null, [[0, 44], [25, 32]]);
  }));
  return function getDeliveryStats(_x28, _x29) {
    return _ref13.apply(this, arguments);
  };
}();