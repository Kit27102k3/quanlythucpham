"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateCoupon = exports.updateCouponUsage = exports.updateCoupon = exports.resetCouponUsage = exports.getCouponStats = exports.getCouponByCode = exports.getAllCoupons = exports.getActiveCoupons = exports.deleteCoupon = exports.createCoupon = exports.applyCoupon = void 0;
var _Coupon = _interopRequireDefault(require("../Model/Coupon.js"));
var _notificationService = require("../Services/notificationService.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } /* eslint-disable no-dupe-keys */
// Tạo mã giảm giá mới
var createCoupon = exports.createCoupon = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(req, res) {
    var _req$body, code, type, value, minOrder, maxDiscount, expiresAt, usageLimit, description, isActive, existingCoupon, newCoupon;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _req$body = req.body, code = _req$body.code, type = _req$body.type, value = _req$body.value, minOrder = _req$body.minOrder, maxDiscount = _req$body.maxDiscount, expiresAt = _req$body.expiresAt, usageLimit = _req$body.usageLimit, description = _req$body.description, isActive = _req$body.isActive; // Kiểm tra xem mã giảm giá đã tồn tại chưa
          _context.next = 4;
          return _Coupon["default"].findOne({
            code: code.toUpperCase()
          });
        case 4:
          existingCoupon = _context.sent;
          if (!existingCoupon) {
            _context.next = 7;
            break;
          }
          return _context.abrupt("return", res.status(400).json({
            success: false,
            message: "Mã giảm giá này đã tồn tại"
          }));
        case 7:
          // Tạo mới coupon với used = 0 rõ ràng
          newCoupon = new _Coupon["default"]({
            code: code.toUpperCase(),
            type: type,
            value: value,
            minOrder: minOrder,
            maxDiscount: maxDiscount,
            expiresAt: expiresAt,
            usageLimit: usageLimit,
            used: 0,
            isActive: isActive !== undefined ? isActive : true,
            description: description
          });
          _context.next = 10;
          return newCoupon.save();
        case 10:
          // Gửi thông báo về mã giảm giá mới đến tất cả người dùng đã đăng ký
          (0, _notificationService.sendNewCouponNotification)(newCoupon)["catch"](function (error) {
            return console.error('Error sending coupon notification to users:', error);
          });
          return _context.abrupt("return", res.status(201).json({
            success: true,
            data: newCoupon,
            message: "Đã tạo mã giảm giá thành công"
          }));
        case 14:
          _context.prev = 14;
          _context.t0 = _context["catch"](0);
          console.error("Error creating coupon:", _context.t0);
          return _context.abrupt("return", res.status(500).json({
            success: false,
            message: "\u0110\xE3 x\u1EA3y ra l\u1ED7i khi t\u1EA1o m\xE3 gi\u1EA3m gi\xE1: ".concat(_context.t0.message)
          }));
        case 18:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 14]]);
  }));
  return function createCoupon(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

// Lấy tất cả mã giảm giá (dành cho admin)
var getAllCoupons = exports.getAllCoupons = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res) {
    var coupons;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return _Coupon["default"].find().sort({
            createdAt: -1
          });
        case 3:
          coupons = _context2.sent;
          res.status(200).json({
            success: true,
            count: coupons.length,
            data: coupons
          });
          _context2.next = 11;
          break;
        case 7:
          _context2.prev = 7;
          _context2.t0 = _context2["catch"](0);
          console.error("Error getting coupons:", _context2.t0);
          res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy danh sách mã giảm giá",
            error: _context2.t0.message
          });
        case 11:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 7]]);
  }));
  return function getAllCoupons(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

// Lấy thông tin mã giảm giá theo code
var getCouponByCode = exports.getCouponByCode = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(req, res) {
    var code, coupon;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          code = req.params.code;
          _context3.next = 4;
          return _Coupon["default"].findOne({
            code: code.toUpperCase()
          });
        case 4:
          coupon = _context3.sent;
          if (coupon) {
            _context3.next = 7;
            break;
          }
          return _context3.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy mã giảm giá"
          }));
        case 7:
          res.status(200).json({
            success: true,
            data: coupon
          });
          _context3.next = 14;
          break;
        case 10:
          _context3.prev = 10;
          _context3.t0 = _context3["catch"](0);
          console.error("Error getting coupon:", _context3.t0);
          res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy thông tin mã giảm giá",
            error: _context3.t0.message
          });
        case 14:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[0, 10]]);
  }));
  return function getCouponByCode(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();

// Get active coupons for public display
var getActiveCoupons = exports.getActiveCoupons = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(req, res) {
    var limit, now, coupons;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          limit = parseInt(req.query.limit) || 3;
          now = new Date(); // Find active coupons that haven't expired and haven't reached usage limit
          _context4.next = 5;
          return _Coupon["default"].find(_defineProperty({
            isActive: true,
            $or: [{
              expiresAt: {
                $gt: now
              }
            }, {
              expiresAt: null
            }]
          }, "$or", [{
            $expr: {
              $lt: ["$used", "$usageLimit"]
            }
          }, {
            usageLimit: null
          }])).sort({
            createdAt: -1
          }).limit(limit);
        case 5:
          coupons = _context4.sent;
          return _context4.abrupt("return", res.status(200).json(coupons));
        case 9:
          _context4.prev = 9;
          _context4.t0 = _context4["catch"](0);
          console.error("Error getting active coupons:", _context4.t0);
          return _context4.abrupt("return", res.status(500).json({
            message: "Internal server error"
          }));
        case 13:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[0, 9]]);
  }));
  return function getActiveCoupons(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();

// Validate a coupon code
var validateCoupon = exports.validateCoupon = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(req, res) {
    var _req$body2, code, orderTotal, now, coupon, discountAmount;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          _req$body2 = req.body, code = _req$body2.code, orderTotal = _req$body2.orderTotal;
          if (code) {
            _context5.next = 4;
            break;
          }
          return _context5.abrupt("return", res.status(400).json({
            message: "Coupon code is required"
          }));
        case 4:
          now = new Date();
          _context5.next = 7;
          return _Coupon["default"].findOne(_defineProperty({
            code: code.toUpperCase(),
            isActive: true,
            $or: [{
              expiresAt: {
                $gt: now
              }
            }, {
              expiresAt: null
            }]
          }, "$or", [{
            $expr: {
              $lt: ["$used", "$usageLimit"]
            }
          }, {
            usageLimit: null
          }]));
        case 7:
          coupon = _context5.sent;
          if (coupon) {
            _context5.next = 10;
            break;
          }
          return _context5.abrupt("return", res.status(404).json({
            message: "Invalid or expired coupon code"
          }));
        case 10:
          if (!(orderTotal < coupon.minOrder)) {
            _context5.next = 12;
            break;
          }
          return _context5.abrupt("return", res.status(400).json({
            message: "T\u1ED5ng gi\xE1 tr\u1ECB \u0111\u01A1n h\xE0ng ph\u1EA3i \xEDt nh\u1EA5t l\xE0 ".concat(coupon.minOrder, " \u0111\u1EC3 s\u1EED d\u1EE5ng phi\u1EBFu gi\u1EA3m gi\xE1 n\xE0y")
          }));
        case 12:
          // Calculate discount amount
          discountAmount = 0;
          if (coupon.type === 'percentage') {
            discountAmount = orderTotal * coupon.value / 100;
            // Apply max discount limit if it exists
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
              discountAmount = coupon.maxDiscount;
            }
          } else {
            discountAmount = coupon.value;
          }
          return _context5.abrupt("return", res.status(200).json({
            valid: true,
            coupon: coupon,
            discountAmount: discountAmount
          }));
        case 17:
          _context5.prev = 17;
          _context5.t0 = _context5["catch"](0);
          console.error("Error validating coupon:", _context5.t0);
          return _context5.abrupt("return", res.status(500).json({
            message: "Internal server error"
          }));
        case 21:
        case "end":
          return _context5.stop();
      }
    }, _callee5, null, [[0, 17]]);
  }));
  return function validateCoupon(_x9, _x0) {
    return _ref5.apply(this, arguments);
  };
}();

// Apply a coupon (increment usage count)
var applyCoupon = exports.applyCoupon = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(req, res) {
    var code, coupon;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          code = req.body.code;
          _context6.next = 4;
          return _Coupon["default"].findOne({
            code: code.toUpperCase()
          });
        case 4:
          coupon = _context6.sent;
          if (coupon) {
            _context6.next = 7;
            break;
          }
          return _context6.abrupt("return", res.status(404).json({
            message: "Coupon not found"
          }));
        case 7:
          // Increment usage count
          coupon.used += 1;
          _context6.next = 10;
          return coupon.save();
        case 10:
          return _context6.abrupt("return", res.status(200).json({
            message: "Coupon applied successfully"
          }));
        case 13:
          _context6.prev = 13;
          _context6.t0 = _context6["catch"](0);
          console.error("Error applying coupon:", _context6.t0);
          return _context6.abrupt("return", res.status(500).json({
            message: "Internal server error"
          }));
        case 17:
        case "end":
          return _context6.stop();
      }
    }, _callee6, null, [[0, 13]]);
  }));
  return function applyCoupon(_x1, _x10) {
    return _ref6.apply(this, arguments);
  };
}();

// Cập nhật số lần sử dụng mã giảm giá
var updateCouponUsage = exports.updateCouponUsage = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(req, res) {
    var code, coupon;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          code = req.params.code;
          _context7.next = 4;
          return _Coupon["default"].findOne({
            code: code.toUpperCase()
          });
        case 4:
          coupon = _context7.sent;
          if (coupon) {
            _context7.next = 7;
            break;
          }
          return _context7.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy mã giảm giá"
          }));
        case 7:
          // Tăng số lần sử dụng
          coupon.used += 1;
          _context7.next = 10;
          return coupon.save();
        case 10:
          res.status(200).json({
            success: true,
            message: "Cập nhật số lần sử dụng mã giảm giá thành công",
            data: coupon
          });
          _context7.next = 17;
          break;
        case 13:
          _context7.prev = 13;
          _context7.t0 = _context7["catch"](0);
          console.error("Error updating coupon usage:", _context7.t0);
          res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi cập nhật số lần sử dụng mã giảm giá",
            error: _context7.t0.message
          });
        case 17:
        case "end":
          return _context7.stop();
      }
    }, _callee7, null, [[0, 13]]);
  }));
  return function updateCouponUsage(_x11, _x12) {
    return _ref7.apply(this, arguments);
  };
}();

// Cập nhật thông tin mã giảm giá
var updateCoupon = exports.updateCoupon = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(req, res) {
    var id, updateData, existingCoupon, duplicateCoupon, updatedCoupon;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          id = req.params.id;
          updateData = req.body; // Kiểm tra xem mã giảm giá có tồn tại không
          _context8.next = 5;
          return _Coupon["default"].findById(id);
        case 5:
          existingCoupon = _context8.sent;
          if (existingCoupon) {
            _context8.next = 8;
            break;
          }
          return _context8.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy mã giảm giá"
          }));
        case 8:
          if (!(updateData.code && updateData.code !== existingCoupon.code)) {
            _context8.next = 15;
            break;
          }
          _context8.next = 11;
          return _Coupon["default"].findOne({
            code: updateData.code.toUpperCase(),
            _id: {
              $ne: id
            }
          });
        case 11:
          duplicateCoupon = _context8.sent;
          if (!duplicateCoupon) {
            _context8.next = 14;
            break;
          }
          return _context8.abrupt("return", res.status(400).json({
            success: false,
            message: "Mã giảm giá này đã tồn tại"
          }));
        case 14:
          // Đảm bảo code luôn được lưu dưới dạng chữ hoa
          updateData.code = updateData.code.toUpperCase();
        case 15:
          _context8.next = 17;
          return _Coupon["default"].findByIdAndUpdate(id, updateData, {
            "new": true,
            runValidators: true
          });
        case 17:
          updatedCoupon = _context8.sent;
          res.status(200).json({
            success: true,
            message: "Cập nhật mã giảm giá thành công",
            data: updatedCoupon
          });
          _context8.next = 25;
          break;
        case 21:
          _context8.prev = 21;
          _context8.t0 = _context8["catch"](0);
          console.error("Error updating coupon:", _context8.t0);
          res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi cập nhật mã giảm giá",
            error: _context8.t0.message
          });
        case 25:
        case "end":
          return _context8.stop();
      }
    }, _callee8, null, [[0, 21]]);
  }));
  return function updateCoupon(_x13, _x14) {
    return _ref8.apply(this, arguments);
  };
}();

// Xóa mã giảm giá
var deleteCoupon = exports.deleteCoupon = /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee9(req, res) {
    var id, coupon;
    return _regeneratorRuntime().wrap(function _callee9$(_context9) {
      while (1) switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          id = req.params.id; // Kiểm tra xem mã giảm giá có tồn tại không
          _context9.next = 4;
          return _Coupon["default"].findById(id);
        case 4:
          coupon = _context9.sent;
          if (coupon) {
            _context9.next = 7;
            break;
          }
          return _context9.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy mã giảm giá"
          }));
        case 7:
          _context9.next = 9;
          return _Coupon["default"].findByIdAndDelete(id);
        case 9:
          res.status(200).json({
            success: true,
            message: "Xóa mã giảm giá thành công"
          });
          _context9.next = 16;
          break;
        case 12:
          _context9.prev = 12;
          _context9.t0 = _context9["catch"](0);
          console.error("Error deleting coupon:", _context9.t0);
          res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xóa mã giảm giá",
            error: _context9.t0.message
          });
        case 16:
        case "end":
          return _context9.stop();
      }
    }, _callee9, null, [[0, 12]]);
  }));
  return function deleteCoupon(_x15, _x16) {
    return _ref9.apply(this, arguments);
  };
}();

// Đặt lại số lượng đã sử dụng của coupon
var resetCouponUsage = exports.resetCouponUsage = /*#__PURE__*/function () {
  var _ref0 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee0(req, res) {
    var id, coupon, value, resetValue;
    return _regeneratorRuntime().wrap(function _callee0$(_context0) {
      while (1) switch (_context0.prev = _context0.next) {
        case 0:
          _context0.prev = 0;
          id = req.params.id;
          _context0.next = 4;
          return _Coupon["default"].findById(id);
        case 4:
          coupon = _context0.sent;
          if (coupon) {
            _context0.next = 7;
            break;
          }
          return _context0.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy mã giảm giá"
          }));
        case 7:
          // Đặt lại giá trị used về 0 hoặc số chỉ định
          value = req.body.value;
          resetValue = value !== undefined ? Number(value) : 0;
          coupon.used = resetValue;
          _context0.next = 12;
          return coupon.save();
        case 12:
          return _context0.abrupt("return", res.status(200).json({
            success: true,
            message: "\u0110\xE3 \u0111\u1EB7t l\u1EA1i s\u1ED1 l\u01B0\u1EE3ng s\u1EED d\u1EE5ng th\xE0nh ".concat(resetValue),
            data: coupon
          }));
        case 15:
          _context0.prev = 15;
          _context0.t0 = _context0["catch"](0);
          console.error("Error resetting coupon usage:", _context0.t0);
          return _context0.abrupt("return", res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi đặt lại số lượng sử dụng",
            error: _context0.t0.message
          }));
        case 19:
        case "end":
          return _context0.stop();
      }
    }, _callee0, null, [[0, 15]]);
  }));
  return function resetCouponUsage(_x17, _x18) {
    return _ref0.apply(this, arguments);
  };
}();

// Get coupon statistics for reports
var getCouponStats = exports.getCouponStats = /*#__PURE__*/function () {
  var _ref1 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee1(req, res) {
    var now, allCoupons, activeCoupons, totalUsedCount, typeStats, voucherUsage, usageOverTime, monthNames, currentMonth, i, monthIndex, revenueComparison, _i, _monthIndex, baseRevenue, discountValue, promotionEffectiveness, conversionRate;
    return _regeneratorRuntime().wrap(function _callee1$(_context1) {
      while (1) switch (_context1.prev = _context1.next) {
        case 0:
          _context1.prev = 0;
          now = new Date(); // Get all coupons
          _context1.next = 4;
          return _Coupon["default"].find();
        case 4:
          allCoupons = _context1.sent;
          _context1.next = 7;
          return _Coupon["default"].countDocuments({
            isActive: true,
            $or: [{
              expiresAt: {
                $gt: now
              }
            }, {
              expiresAt: null
            }]
          });
        case 7:
          activeCoupons = _context1.sent;
          // Get total used count
          totalUsedCount = allCoupons.reduce(function (sum, coupon) {
            return sum + coupon.used;
          }, 0); // Calculate usage by type
          typeStats = {
            percentage: {
              count: 0,
              used: 0,
              totalValue: 0,
              estimatedRevenue: 0
            },
            fixed: {
              count: 0,
              used: 0,
              totalValue: 0,
              estimatedRevenue: 0
            }
          };
          allCoupons.forEach(function (coupon) {
            if (coupon.type === 'percentage') {
              typeStats.percentage.count++;
              typeStats.percentage.used += coupon.used;
              typeStats.percentage.totalValue += coupon.value * coupon.used; // Total percentage points

              // Estimate revenue based on minimum order value
              var estimatedOrderValue = coupon.minOrder * 1.5; // Assume average order is 1.5x minimum
              typeStats.percentage.estimatedRevenue += coupon.used * estimatedOrderValue;
            } else {
              typeStats.fixed.count++;
              typeStats.fixed.used += coupon.used;
              typeStats.fixed.totalValue += coupon.value * coupon.used; // Total fixed amount

              // Estimate revenue based on minimum order value
              var _estimatedOrderValue = coupon.minOrder * 1.5; // Assume average order is 1.5x minimum
              typeStats.fixed.estimatedRevenue += coupon.used * _estimatedOrderValue;
            }
          });

          // Format voucher usage data for table display
          voucherUsage = allCoupons.sort(function (a, b) {
            return b.used - a.used;
          }) // Sort by most used
          .map(function (coupon) {
            return {
              code: coupon.code,
              discount: coupon.type === 'percentage' ? "".concat(coupon.value, "%") : new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(coupon.value),
              used: coupon.used,
              limit: coupon.usageLimit || '∞',
              revenue: coupon.type === 'percentage' ? coupon.value * coupon.used * coupon.minOrder / 100 :
              // Estimate for percentage type
              coupon.used * coupon.minOrder,
              // Estimate for fixed type
              description: coupon.description
            };
          }); // Generate mock data for usage over time (last 6 months)
          usageOverTime = [];
          monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
          currentMonth = new Date().getMonth();
          for (i = 5; i >= 0; i--) {
            monthIndex = (currentMonth - i + 12) % 12;
            usageOverTime.push({
              month: monthNames[monthIndex],
              'Phần trăm': Math.floor(Math.random() * 30) + 10,
              'Cố định': Math.floor(Math.random() * 20) + 5
            });
          }

          // Revenue comparison: Estimated revenue with coupons vs without coupons (mock data)
          revenueComparison = [];
          for (_i = 5; _i >= 0; _i--) {
            _monthIndex = (currentMonth - _i + 12) % 12;
            baseRevenue = Math.floor(Math.random() * 50000000) + 20000000;
            discountValue = Math.floor(Math.random() * 8000000) + 2000000;
            revenueComparison.push({
              month: monthNames[_monthIndex],
              'Doanh thu thực tế': baseRevenue - discountValue,
              'Doanh thu không có khuyến mãi': baseRevenue,
              'Tổng giảm giá': discountValue
            });
          }

          // Sample data for promotion effectiveness by category
          promotionEffectiveness = allCoupons.sort(function (a, b) {
            return b.used - a.used;
          }).slice(0, 3).map(function (coupon) {
            return {
              name: coupon.code,
              'Rau': Math.floor(Math.random() * 500000) + 300000,
              'Thịt & Hải sản': Math.floor(Math.random() * 800000) + 600000,
              'Trứng & Sữa': Math.floor(Math.random() * 400000) + 200000
            };
          }); // Sample data for conversion rates - use real codes
          conversionRate = allCoupons.sort(function (a, b) {
            return b.used - a.used;
          }).slice(0, 5).map(function (coupon) {
            return {
              name: coupon.code,
              rate: Math.floor(Math.random() * 40) + 50 // Random rate between 50-90%
            };
          }); // Return the statistics
          res.status(200).json({
            success: true,
            data: {
              totalCoupons: allCoupons.length,
              activeCoupons: activeCoupons,
              totalUsedCount: totalUsedCount,
              typeStats: typeStats,
              voucherUsage: voucherUsage,
              usageOverTime: usageOverTime,
              revenueComparison: revenueComparison,
              promotionEffectiveness: promotionEffectiveness,
              conversionRate: conversionRate
            }
          });
          _context1.next = 27;
          break;
        case 23:
          _context1.prev = 23;
          _context1.t0 = _context1["catch"](0);
          console.error("Error getting coupon statistics:", _context1.t0);
          res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy thống kê mã giảm giá",
            error: _context1.t0.message
          });
        case 27:
        case "end":
          return _context1.stop();
      }
    }, _callee1, null, [[0, 23]]);
  }));
  return function getCouponStats(_x19, _x20) {
    return _ref1.apply(this, arguments);
  };
}();