"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateSavedVoucherStatus = exports.saveVoucher = exports.getUserSavedVouchers = exports.deleteSavedVoucher = exports.deleteExpiredVouchers = void 0;
var _SavedVoucher = _interopRequireDefault(require("../Model/SavedVoucher.js"));
var _Coupon = _interopRequireDefault(require("../Model/Coupon.js"));
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
// Lấy danh sách voucher đã lưu của người dùng
var getUserSavedVouchers = exports.getUserSavedVouchers = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(req, res) {
    var userId, savedVouchers, vouchers;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          userId = req.user.id; // Lấy chỉ những voucher chưa sử dụng (isPaid = false)
          _context.next = 4;
          return _SavedVoucher["default"].find({
            userId: userId,
            isPaid: false
          }).populate({
            path: 'couponId',
            select: '-__v'
          }).sort({
            savedAt: -1
          });
        case 4:
          savedVouchers = _context.sent;
          if (!(!savedVouchers || savedVouchers.length === 0)) {
            _context.next = 7;
            break;
          }
          return _context.abrupt("return", res.status(200).json({
            success: true,
            data: [],
            message: "Người dùng chưa lưu voucher nào"
          }));
        case 7:
          // Kiểm tra trạng thái của từng voucher đã lưu
          vouchers = savedVouchers.map(function (savedVoucher) {
            var coupon = savedVoucher.couponId;
            var now = new Date();
            var isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < now;
            var isActive = coupon.isActive;
            return _objectSpread(_objectSpread({}, savedVoucher.toObject()), {}, {
              couponStatus: {
                isExpired: isExpired,
                isActive: isActive
              }
            });
          });
          return _context.abrupt("return", res.status(200).json({
            success: true,
            data: vouchers,
            message: "Lấy danh sách voucher đã lưu thành công"
          }));
        case 11:
          _context.prev = 11;
          _context.t0 = _context["catch"](0);
          console.error("Error getting saved vouchers:", _context.t0);
          return _context.abrupt("return", res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy danh sách voucher đã lưu"
          }));
        case 15:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 11]]);
  }));
  return function getUserSavedVouchers(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

// Lưu voucher cho người dùng
var saveVoucher = exports.saveVoucher = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res) {
    var userId, couponId, coupon, now, currentUsed, usageLimit, existingSavedVoucher, newSavedVoucher, keyPattern, savedVoucher;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          userId = req.user.id;
          couponId = req.body.couponId;
          console.log("Attempting to save voucher for user ".concat(userId, ", coupon: ").concat(couponId));
          if (couponId) {
            _context2.next = 6;
            break;
          }
          return _context2.abrupt("return", res.status(400).json({
            success: false,
            message: "Thiếu thông tin mã giảm giá"
          }));
        case 6:
          _context2.next = 8;
          return _Coupon["default"].findById(couponId);
        case 8:
          coupon = _context2.sent;
          if (coupon) {
            _context2.next = 11;
            break;
          }
          return _context2.abrupt("return", res.status(404).json({
            success: false,
            message: "Mã giảm giá không tồn tại"
          }));
        case 11:
          console.log("Coupon found:", {
            id: coupon._id,
            code: coupon.code,
            usageLimit: coupon.usageLimit,
            used: coupon.used
          });

          // Kiểm tra coupon còn hiệu lực không
          now = new Date();
          if (!(coupon.expiresAt && new Date(coupon.expiresAt) < now)) {
            _context2.next = 15;
            break;
          }
          return _context2.abrupt("return", res.status(400).json({
            success: false,
            message: "Mã giảm giá đã hết hạn"
          }));
        case 15:
          if (coupon.isActive) {
            _context2.next = 17;
            break;
          }
          return _context2.abrupt("return", res.status(400).json({
            success: false,
            message: "Mã giảm giá không còn hiệu lực"
          }));
        case 17:
          // Kiểm tra số lượng voucher còn lại
          currentUsed = coupon.used || 0;
          usageLimit = coupon.usageLimit;
          console.log("Voucher usage: ".concat(currentUsed, "/").concat(usageLimit));
          if (!(usageLimit && currentUsed >= usageLimit)) {
            _context2.next = 22;
            break;
          }
          return _context2.abrupt("return", res.status(400).json({
            success: false,
            message: "Mã giảm giá đã hết số lượng"
          }));
        case 22:
          _context2.prev = 22;
          _context2.next = 25;
          return _SavedVoucher["default"].findOne({
            userId: userId,
            couponId: couponId
          });
        case 25:
          existingSavedVoucher = _context2.sent;
          console.log("Existing saved voucher check:", existingSavedVoucher ? "Found existing" : "Not found");
          if (!existingSavedVoucher) {
            _context2.next = 29;
            break;
          }
          return _context2.abrupt("return", res.status(400).json({
            success: false,
            message: "Bạn đã lưu mã giảm giá này rồi"
          }));
        case 29:
          // Tạo bản ghi lưu voucher mới
          newSavedVoucher = new _SavedVoucher["default"]({
            userId: userId,
            couponId: couponId,
            savedAt: new Date()
          });
          console.log("Saving new voucher:", newSavedVoucher);
          _context2.next = 33;
          return newSavedVoucher.save();
        case 33:
          console.log("Saved voucher successfully for user:", userId);

          // Sau khi lưu thành công, mới tăng số lượng đã sử dụng
          coupon.used = currentUsed + 1;
          _context2.next = 37;
          return coupon.save();
        case 37:
          console.log("Updated voucher usage to: ".concat(coupon.used, "/").concat(usageLimit));
          return _context2.abrupt("return", res.status(201).json({
            success: true,
            data: newSavedVoucher,
            message: "Đã lưu mã giảm giá thành công"
          }));
        case 41:
          _context2.prev = 41;
          _context2.t0 = _context2["catch"](22);
          if (!(_context2.t0.code === 11000)) {
            _context2.next = 56;
            break;
          }
          // Nếu là lỗi trùng lặp, kiểm tra trường nào bị trùng
          keyPattern = _context2.t0.keyPattern; // Nếu lỗi chỉ do userId, cho phép lưu
          if (!(keyPattern && keyPattern.userId && !keyPattern.couponId)) {
            _context2.next = 55;
            break;
          }
          // Ignore userId unique constraint
          savedVoucher = new _SavedVoucher["default"]({
            _id: new _mongoose["default"].Types.ObjectId(),
            // Tạo ID mới
            userId: userId,
            couponId: couponId,
            savedAt: new Date()
          });
          _context2.next = 49;
          return savedVoucher.save({
            checkKeys: false
          });
        case 49:
          // Cập nhật số lượng sử dụng
          coupon.used = currentUsed + 1;
          _context2.next = 52;
          return coupon.save();
        case 52:
          return _context2.abrupt("return", res.status(201).json({
            success: true,
            data: savedVoucher,
            message: "Đã lưu mã giảm giá thành công"
          }));
        case 55:
          return _context2.abrupt("return", res.status(400).json({
            success: false,
            message: "Bạn đã lưu mã giảm giá này rồi"
          }));
        case 56:
          // Lỗi khác
          console.error("Error saving voucher:", _context2.t0);
          return _context2.abrupt("return", res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lưu mã giảm giá: " + _context2.t0.message
          }));
        case 58:
          _context2.next = 64;
          break;
        case 60:
          _context2.prev = 60;
          _context2.t1 = _context2["catch"](0);
          console.error("Unexpected error:", _context2.t1);
          return _context2.abrupt("return", res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi không mong muốn: " + _context2.t1.message
          }));
        case 64:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 60], [22, 41]]);
  }));
  return function saveVoucher(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

// Xóa voucher đã lưu
var deleteSavedVoucher = exports.deleteSavedVoucher = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(req, res) {
    var userId, couponId, savedVoucher, coupon;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          userId = req.user.id;
          couponId = req.params.couponId;
          if (couponId) {
            _context3.next = 5;
            break;
          }
          return _context3.abrupt("return", res.status(400).json({
            success: false,
            message: "Thiếu thông tin mã giảm giá"
          }));
        case 5:
          _context3.next = 7;
          return _SavedVoucher["default"].findOne({
            userId: userId,
            couponId: couponId
          });
        case 7:
          savedVoucher = _context3.sent;
          if (savedVoucher) {
            _context3.next = 10;
            break;
          }
          return _context3.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy voucher đã lưu"
          }));
        case 10:
          _context3.next = 12;
          return _Coupon["default"].findById(couponId);
        case 12:
          coupon = _context3.sent;
          if (!(coupon && coupon.used > 0)) {
            _context3.next = 17;
            break;
          }
          coupon.used -= 1;
          _context3.next = 17;
          return coupon.save();
        case 17:
          _context3.next = 19;
          return _SavedVoucher["default"].findOneAndDelete({
            userId: userId,
            couponId: couponId
          });
        case 19:
          return _context3.abrupt("return", res.status(200).json({
            success: true,
            message: "Đã xóa voucher đã lưu thành công"
          }));
        case 22:
          _context3.prev = 22;
          _context3.t0 = _context3["catch"](0);
          console.error("Error deleting saved voucher:", _context3.t0);
          return _context3.abrupt("return", res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xóa voucher đã lưu"
          }));
        case 26:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[0, 22]]);
  }));
  return function deleteSavedVoucher(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();

// Cập nhật trạng thái isPaid của voucher đã lưu
var updateSavedVoucherStatus = exports.updateSavedVoucherStatus = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(req, res) {
    var userId, savedVoucherId, isPaid, savedVoucher;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          userId = req.user.id;
          savedVoucherId = req.params.savedVoucherId;
          isPaid = req.body.isPaid;
          if (!(isPaid === undefined)) {
            _context4.next = 6;
            break;
          }
          return _context4.abrupt("return", res.status(400).json({
            success: false,
            message: "Thiếu thông tin trạng thái isPaid"
          }));
        case 6:
          _context4.next = 8;
          return _SavedVoucher["default"].findOne({
            _id: savedVoucherId,
            userId: userId
          });
        case 8:
          savedVoucher = _context4.sent;
          if (savedVoucher) {
            _context4.next = 11;
            break;
          }
          return _context4.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy voucher đã lưu"
          }));
        case 11:
          // Cập nhật trạng thái isPaid
          savedVoucher.isPaid = isPaid;
          _context4.next = 14;
          return savedVoucher.save();
        case 14:
          return _context4.abrupt("return", res.status(200).json({
            success: true,
            data: savedVoucher,
            message: "Đã cập nhật trạng thái voucher thành công"
          }));
        case 17:
          _context4.prev = 17;
          _context4.t0 = _context4["catch"](0);
          console.error("Error updating saved voucher status:", _context4.t0);
          return _context4.abrupt("return", res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi cập nhật trạng thái voucher"
          }));
        case 21:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[0, 17]]);
  }));
  return function updateSavedVoucherStatus(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();

// Hàm xóa voucher đã hết hạn
var deleteExpiredVouchers = exports.deleteExpiredVouchers = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
    var now, savedVouchers, expiredVouchers, expiredIds, result;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          now = new Date(); // Tìm tất cả saved vouchers
          _context5.next = 4;
          return _SavedVoucher["default"].find().populate('couponId');
        case 4:
          savedVouchers = _context5.sent;
          // Lọc các voucher đã hết hạn
          expiredVouchers = savedVouchers.filter(function (savedVoucher) {
            var coupon = savedVoucher.couponId;
            return coupon && coupon.expiresAt && new Date(coupon.expiresAt) < now;
          }); // Xóa các voucher đã hết hạn
          if (!(expiredVouchers.length > 0)) {
            _context5.next = 12;
            break;
          }
          expiredIds = expiredVouchers.map(function (voucher) {
            return voucher._id;
          });
          _context5.next = 10;
          return _SavedVoucher["default"].deleteMany({
            _id: {
              $in: expiredIds
            }
          });
        case 10:
          result = _context5.sent;
          console.log("\u0110\xE3 x\xF3a ".concat(result.deletedCount, " voucher \u0111\xE3 h\u1EBFt h\u1EA1n."));
        case 12:
          return _context5.abrupt("return", true);
        case 15:
          _context5.prev = 15;
          _context5.t0 = _context5["catch"](0);
          console.error("Error deleting expired vouchers:", _context5.t0);
          return _context5.abrupt("return", false);
        case 19:
        case "end":
          return _context5.stop();
      }
    }, _callee5, null, [[0, 15]]);
  }));
  return function deleteExpiredVouchers() {
    return _ref5.apply(this, arguments);
  };
}();