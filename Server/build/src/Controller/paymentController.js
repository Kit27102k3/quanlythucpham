"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updatePaymentStatus = exports.updatePayment = exports.handleSepayCallback = exports.handleBankWebhook = exports.getPaymentStatus = exports.getPaymentById = exports.getAllPayments = exports.deletePayment = exports.createVnpayPaymentUrl = exports.createSepayPaymentUrl = exports.createPayment = exports.createBankQRCode = exports.checkPaymentStatus = void 0;
var _Payment = _interopRequireDefault(require("../Model/Payment.js"));
var _Cart = _interopRequireDefault(require("../Model/Cart.js"));
var _Order = _interopRequireDefault(require("../Model/Order.js"));
var _paymentService = _interopRequireDefault(require("../Services/paymentService.js"));
var _crypto = _interopRequireDefault(require("crypto"));
var _qs = _interopRequireDefault(require("qs"));
var _axios = _interopRequireDefault(require("axios"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _uuid = require("uuid");
var _moment = _interopRequireDefault(require("moment"));
var _paymentConfig = require("../config/paymentConfig.js");
var _SavedVoucher = _interopRequireDefault(require("../Model/SavedVoucher.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } /* eslint-disable no-undef */ /* eslint-disable no-unused-vars */
_dotenv["default"].config();
var SEPAY_API_URL = process.env.SEPAY_API_URL;
var SEPAY_API_TOKEN = process.env.SEPAY_API_TOKEN;

// Tạo URL thanh toán SePay
var createSepayPaymentUrl = exports.createSepayPaymentUrl = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(req, res) {
    var _req$body, orderId, amount, orderInfo, redirectUrl, numericAmount, transferContent, bankQRUrl, paymentResult, _transferContent, _bankQRUrl, _transferContent2, _bankQRUrl2;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _req$body = req.body, orderId = _req$body.orderId, amount = _req$body.amount, orderInfo = _req$body.orderInfo, redirectUrl = _req$body.redirectUrl; // Validate đầu vào
          if (!(!orderId || !amount || !orderInfo)) {
            _context.next = 4;
            break;
          }
          return _context.abrupt("return", res.status(400).json({
            success: false,
            message: "Thiếu thông tin cần thiết: orderId, amount, orderInfo"
          }));
        case 4:
          // Chuyển đổi amount sang kiểu số nếu cần
          numericAmount = parseInt(amount);
          if (!(isNaN(numericAmount) || numericAmount <= 0)) {
            _context.next = 7;
            break;
          }
          return _context.abrupt("return", res.status(400).json({
            success: false,
            message: "Số tiền không hợp lệ"
          }));
        case 7:
          console.log("Yêu cầu tạo URL thanh toán SePay:", {
            orderId: orderId,
            amount: numericAmount,
            redirectUrl: redirectUrl
          });

          // Tạo nội dung chuyển khoản chuẩn hóa (TT = Thanh toán, DH = đơn hàng)
          transferContent = "TT DH ".concat(orderId); // Tạo QR code chuyển khoản ngân hàng
          _context.next = 11;
          return _paymentService["default"].generateBankQRCode("0326743391", "MB", numericAmount, transferContent);
        case 11:
          bankQRUrl = _context.sent;
          return _context.abrupt("return", res.json({
            success: true,
            qrCode: bankQRUrl,
            bankInfo: {
              name: "MBBank - Ngân hàng Thương mại Cổ phần Quân đội",
              accountName: "NGUYEN TRONG KHIEM",
              accountNumber: "0326743391",
              bankCode: "MB"
            },
            paymentUrl: redirectUrl || "".concat(process.env.CLIENT_URL || 'http://localhost:3000', "/payment-result?orderId=").concat(orderId),
            fallbackMode: true
          }));
        case 16:
          paymentResult = _context.sent;
          console.log("Kết quả tạo URL thanh toán:", paymentResult);

          // Đảm bảo trả về URL thanh toán và QR code
          if (!(paymentResult && paymentResult.data)) {
            _context.next = 22;
            break;
          }
          return _context.abrupt("return", res.json({
            success: true,
            paymentUrl: paymentResult.data,
            qrCode: paymentResult.qr_code
          }));
        case 22:
          // Tạo QR code trực tiếp nếu không có URL từ SePay
          console.log("Không nhận được URL thanh toán từ SePay, tạo QR code trực tiếp");

          // Tạo nội dung chuyển khoản chuẩn hóa (TT = Thanh toán, DH = đơn hàng)
          _transferContent = "TT DH ".concat(orderId); // Tạo QR code chuyển khoản ngân hàng
          _context.next = 26;
          return _paymentService["default"].generateBankQRCode("0326743391", "MB", numericAmount, _transferContent);
        case 26:
          _bankQRUrl = _context.sent;
          return _context.abrupt("return", res.json({
            success: true,
            paymentUrl: redirectUrl || "".concat(process.env.CLIENT_URL || 'http://localhost:3000', "/payment-result?orderId=").concat(orderId),
            qrCode: _bankQRUrl,
            fallbackMode: true
          }));
        case 28:
          _context.next = 38;
          break;
        case 30:
          _context.prev = 30;
          _context.t0 = _context["catch"](13);
          console.error("Lỗi từ PaymentService:", _context.t0);

          // Tạo nội dung chuyển khoản chuẩn hóa
          _transferContent2 = "TT DH ".concat(orderId); // Tạo QR code trực tiếp trong trường hợp lỗi
          _context.next = 36;
          return _paymentService["default"].generateBankQRCode("0326743391", "MB", numericAmount, _transferContent2);
        case 36:
          _bankQRUrl2 = _context.sent;
          return _context.abrupt("return", res.json({
            success: true,
            message: "Sử dụng phương thức dự phòng",
            paymentUrl: redirectUrl || "".concat(process.env.CLIENT_URL || 'http://localhost:3000', "/payment-result?orderId=").concat(orderId),
            qrCode: _bankQRUrl2,
            fallbackMode: true
          }));
        case 38:
          _context.next = 44;
          break;
        case 40:
          _context.prev = 40;
          _context.t1 = _context["catch"](0);
          console.error("Lỗi khi tạo URL thanh toán SePay:", _context.t1);
          return _context.abrupt("return", res.status(500).json({
            success: false,
            message: "Không thể khởi tạo thanh toán SePay",
            error: _context.t1.message
          }));
        case 44:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 40], [13, 30]]);
  }));
  return function createSepayPaymentUrl(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

// Xử lý callback từ SePay
var handleSepayCallback = exports.handleSepayCallback = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res) {
    var response, _req$body2, orderId, amount, resultCode, message, orderIdToUse, order, payment;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          console.log('Received SePay webhook:', JSON.stringify(req.body));
          console.log('Webhook headers:', JSON.stringify(req.headers));

          // Luôn trả về 200 OK để tránh SePay gửi lại webhook
          // Sau khi trả về 200, tiếp tục xử lý bất đồng bộ
          response = {
            success: true,
            code: "00",
            message: "SePay webhook received successfully",
            data: null
          }; // Trả về ngay lập tức để tránh timeout
          res.status(200).json(response);
          _context2.prev = 5;
          // Tiếp tục xử lý sau khi đã trả về response
          _req$body2 = req.body, orderId = _req$body2.orderId, amount = _req$body2.amount, resultCode = _req$body2.resultCode, message = _req$body2.message; // Ensure orderId exists
          orderIdToUse = orderId || req.body.order_id;
          if (orderIdToUse) {
            _context2.next = 11;
            break;
          }
          console.error('Missing orderId in callback data');
          return _context2.abrupt("return");
        case 11:
          _context2.next = 13;
          return _Order["default"].findOne({
            $or: [{
              _id: orderIdToUse
            }, {
              orderId: orderIdToUse
            }]
          });
        case 13:
          order = _context2.sent;
          if (order) {
            _context2.next = 17;
            break;
          }
          console.error('Order not found:', orderIdToUse);
          return _context2.abrupt("return");
        case 17:
          _context2.next = 19;
          return _Payment["default"].findOne({
            orderId: order._id
          });
        case 19:
          payment = _context2.sent;
          if (!payment) {
            payment = new _Payment["default"]({
              orderId: order._id,
              amount: amount || order.totalAmount,
              paymentMethod: 'sepay',
              status: 'pending'
            });
          }

          // Cập nhật trạng thái thanh toán khi resultCode là "0"
          if (!(resultCode === "0" || resultCode === 0)) {
            _context2.next = 37;
            break;
          }
          payment.status = 'completed';
          order.paymentStatus = 'completed';
          order.status = 'processing';

          // Xóa voucher đã lưu sau khi thanh toán thành công (nếu có)
          if (!payment.savedVoucherId) {
            _context2.next = 35;
            break;
          }
          _context2.prev = 26;
          _context2.next = 29;
          return _SavedVoucher["default"].findByIdAndDelete(payment.savedVoucherId);
        case 29:
          console.log("\u0110\xE3 x\xF3a voucher \u0111\xE3 l\u01B0u ".concat(payment.savedVoucherId, " sau khi thanh to\xE1n th\xE0nh c\xF4ng"));
          _context2.next = 35;
          break;
        case 32:
          _context2.prev = 32;
          _context2.t0 = _context2["catch"](26);
          console.error('Error deleting saved voucher:', _context2.t0);
        case 35:
          _context2.next = 39;
          break;
        case 37:
          payment.status = 'failed';
          order.paymentStatus = 'pending';
        case 39:
          payment.responseCode = resultCode;
          payment.responseMessage = message;
          payment.paidAt = new Date();
          _context2.next = 44;
          return payment.save();
        case 44:
          _context2.next = 46;
          return order.save();
        case 46:
          console.log("Payment process completed for order ".concat(order._id, ", status: ").concat(payment.status));
          _context2.next = 52;
          break;
        case 49:
          _context2.prev = 49;
          _context2.t1 = _context2["catch"](5);
          console.error('Error processing SePay callback after response sent:', _context2.t1);
        case 52:
          _context2.next = 59;
          break;
        case 54:
          _context2.prev = 54;
          _context2.t2 = _context2["catch"](0);
          console.error('Error in handleSepayCallback:', _context2.t2);
          // Vẫn trả về 200 nếu chưa trả về
          if (res.headersSent) {
            _context2.next = 59;
            break;
          }
          return _context2.abrupt("return", res.status(200).json({
            success: true,
            code: "00",
            message: "SePay webhook received with error",
            error: _context2.t2.message
          }));
        case 59:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 54], [5, 49], [26, 32]]);
  }));
  return function handleSepayCallback(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

// Tạo thanh toán mới
var createPayment = exports.createPayment = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(req, res) {
    var _req$body3, userId, amount, totalAmount, products, paymentMethod, savedVoucherId, couponDiscount, couponCode, payment, savedPayment;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _req$body3 = req.body, userId = _req$body3.userId, amount = _req$body3.amount, totalAmount = _req$body3.totalAmount, products = _req$body3.products, paymentMethod = _req$body3.paymentMethod, savedVoucherId = _req$body3.savedVoucherId, couponDiscount = _req$body3.couponDiscount, couponCode = _req$body3.couponCode; // Validate đầu vào
          if (!(!amount || !products || !paymentMethod || !userId)) {
            _context3.next = 4;
            break;
          }
          return _context3.abrupt("return", res.status(400).json({
            success: false,
            message: "Thiếu thông tin cần thiết: amount, products, paymentMethod, userId"
          }));
        case 4:
          // Tạo payment
          payment = new _Payment["default"]({
            userId: userId,
            amount: amount,
            totalAmount: totalAmount || amount,
            products: products,
            paymentMethod: paymentMethod,
            savedVoucherId: savedVoucherId,
            // Lưu savedVoucherId để xóa voucher sau khi thanh toán
            status: "pending"
          }); // Nếu có thông tin coupon, lưu vào response message
          if (couponCode || couponDiscount) {
            payment.responseMessage = "\xC1p d\u1EE5ng m\xE3 gi\u1EA3m gi\xE1: ".concat(couponCode, ", gi\u1EA3m: ").concat(couponDiscount);
          }

          // Lưu payment
          _context3.next = 8;
          return payment.save();
        case 8:
          savedPayment = _context3.sent;
          return _context3.abrupt("return", res.status(201).json({
            success: true,
            data: savedPayment,
            message: "Đã tạo thông tin thanh toán"
          }));
        case 12:
          _context3.prev = 12;
          _context3.t0 = _context3["catch"](0);
          return _context3.abrupt("return", res.status(500).json({
            success: false,
            message: "Không thể tạo thông tin thanh toán",
            error: _context3.t0.message
          }));
        case 15:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[0, 12]]);
  }));
  return function createPayment(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();

// Lấy tất cả thanh toán
var getAllPayments = exports.getAllPayments = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(req, res) {
    var payments;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _context4.next = 3;
          return _Payment["default"].find().populate("products.productId");
        case 3:
          payments = _context4.sent;
          return _context4.abrupt("return", res.json(payments));
        case 7:
          _context4.prev = 7;
          _context4.t0 = _context4["catch"](0);
          return _context4.abrupt("return", res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách thanh toán",
            error: _context4.t0.message
          }));
        case 10:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[0, 7]]);
  }));
  return function getAllPayments(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();

// Lấy thanh toán theo ID
var getPaymentById = exports.getPaymentById = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(req, res) {
    var payment;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          _context5.next = 3;
          return _Payment["default"].findById(req.params.id).populate("products.productId");
        case 3:
          payment = _context5.sent;
          if (payment) {
            _context5.next = 6;
            break;
          }
          return _context5.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy thông tin thanh toán"
          }));
        case 6:
          return _context5.abrupt("return", res.json({
            success: true,
            data: payment
          }));
        case 9:
          _context5.prev = 9;
          _context5.t0 = _context5["catch"](0);
          return _context5.abrupt("return", res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin thanh toán",
            error: _context5.t0.message
          }));
        case 12:
        case "end":
          return _context5.stop();
      }
    }, _callee5, null, [[0, 9]]);
  }));
  return function getPaymentById(_x9, _x0) {
    return _ref5.apply(this, arguments);
  };
}();

// Cập nhật trạng thái thanh toán
var updatePaymentStatus = exports.updatePaymentStatus = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(req, res) {
    var status, payment;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          status = req.body.status;
          _context6.next = 4;
          return _Payment["default"].findByIdAndUpdate(req.params.id, {
            status: status
          }, {
            "new": true
          });
        case 4:
          payment = _context6.sent;
          if (payment) {
            _context6.next = 7;
            break;
          }
          return _context6.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy thông tin thanh toán"
          }));
        case 7:
          return _context6.abrupt("return", res.json({
            success: true,
            data: payment
          }));
        case 10:
          _context6.prev = 10;
          _context6.t0 = _context6["catch"](0);
          return _context6.abrupt("return", res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật trạng thái thanh toán",
            error: _context6.t0.message
          }));
        case 13:
        case "end":
          return _context6.stop();
      }
    }, _callee6, null, [[0, 10]]);
  }));
  return function updatePaymentStatus(_x1, _x10) {
    return _ref6.apply(this, arguments);
  };
}();

// Cập nhật thông tin thanh toán
var updatePayment = exports.updatePayment = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(req, res) {
    var paymentId, updateData, allowedFields, filteredData, _i, _Object$keys, key, payment;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          paymentId = req.params.id;
          updateData = req.body; // Chỉ cho phép cập nhật các trường an toàn
          allowedFields = ['orderId', 'status', 'transactionId'];
          filteredData = {};
          for (_i = 0, _Object$keys = Object.keys(updateData); _i < _Object$keys.length; _i++) {
            key = _Object$keys[_i];
            if (allowedFields.includes(key)) {
              filteredData[key] = updateData[key];
            }
          }
          _context7.next = 8;
          return _Payment["default"].findByIdAndUpdate(paymentId, {
            $set: filteredData
          }, {
            "new": true
          });
        case 8:
          payment = _context7.sent;
          if (payment) {
            _context7.next = 11;
            break;
          }
          return _context7.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy thông tin thanh toán"
          }));
        case 11:
          return _context7.abrupt("return", res.json({
            success: true,
            data: payment
          }));
        case 14:
          _context7.prev = 14;
          _context7.t0 = _context7["catch"](0);
          return _context7.abrupt("return", res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật thông tin thanh toán",
            error: _context7.t0.message
          }));
        case 17:
        case "end":
          return _context7.stop();
      }
    }, _callee7, null, [[0, 14]]);
  }));
  return function updatePayment(_x11, _x12) {
    return _ref7.apply(this, arguments);
  };
}();

// Xóa thanh toán
var deletePayment = exports.deletePayment = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(req, res) {
    var payment;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          _context8.next = 3;
          return _Payment["default"].findByIdAndDelete(req.params.id);
        case 3:
          payment = _context8.sent;
          if (payment) {
            _context8.next = 6;
            break;
          }
          return _context8.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy thông tin thanh toán"
          }));
        case 6:
          return _context8.abrupt("return", res.json({
            success: true,
            message: "Xóa thanh toán thành công"
          }));
        case 9:
          _context8.prev = 9;
          _context8.t0 = _context8["catch"](0);
          return _context8.abrupt("return", res.status(500).json({
            success: false,
            message: "Lỗi khi xóa thanh toán",
            error: _context8.t0.message
          }));
        case 12:
        case "end":
          return _context8.stop();
      }
    }, _callee8, null, [[0, 9]]);
  }));
  return function deletePayment(_x13, _x14) {
    return _ref8.apply(this, arguments);
  };
}();
var createVnpayPaymentUrl = exports.createVnpayPaymentUrl = /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee9(req, res) {
    var _req$body4, amount, products, userId, payment, date, createDate, orderId, ipAddr, tmnCode, secretKey, vnpUrl, vnp_Params, signData, hmac, signed;
    return _regeneratorRuntime().wrap(function _callee9$(_context9) {
      while (1) switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          _req$body4 = req.body, amount = _req$body4.amount, products = _req$body4.products, userId = _req$body4.userId; // Validate input
          if (!(!amount || !products || !Array.isArray(products) || products.length === 0 || !userId)) {
            _context9.next = 4;
            break;
          }
          return _context9.abrupt("return", res.status(400).json({
            success: false,
            message: "Invalid input: required fields are amount, products (non-empty array), and userId"
          }));
        case 4:
          // Create payment record first
          payment = new _Payment["default"]({
            userId: userId,
            totalAmount: amount,
            products: products.map(function (product) {
              return {
                productId: product.productId,
                quantity: product.quantity,
                price: product.price
              };
            }),
            paymentMethod: "sepay",
            // Using sepay since vnpay is not in enum
            status: "pending"
          });
          _context9.next = 7;
          return payment.save();
        case 7:
          // Create VNPay payment URL
          date = new Date();
          createDate = (0, _moment["default"])(date).format("YYYYMMDDHHmmss");
          orderId = (0, _moment["default"])(date).format("DDHHmmss");
          ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress;
          tmnCode = process.env.VNP_TMN_CODE;
          secretKey = process.env.VNP_HASH_SECRET;
          vnpUrl = process.env.VNP_URL;
          vnp_Params = {
            vnp_Version: "2.1.0",
            vnp_Command: "pay",
            vnp_TmnCode: tmnCode,
            vnp_Locale: "vn",
            vnp_CurrCode: "VND",
            vnp_TxnRef: orderId,
            vnp_OrderInfo: "Thanh toan don hang ".concat(orderId),
            vnp_OrderType: "other",
            vnp_Amount: amount * 100,
            vnp_ReturnUrl: process.env.VNP_RETURN_URL,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
            vnp_ExpireDate: (0, _moment["default"])(date).add(15, "minutes").format("YYYYMMDDHHmmss")
          };
          signData = _qs["default"].stringify(vnp_Params, {
            encode: false
          });
          hmac = _crypto["default"].createHmac("sha512", secretKey);
          signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
          vnp_Params["vnp_SecureHash"] = signed;
          vnpUrl += "?" + _qs["default"].stringify(vnp_Params, {
            encode: false
          });

          // Return both payment record and VNPay URL
          return _context9.abrupt("return", res.status(200).json({
            success: true,
            data: {
              payment: payment,
              vnpayUrl: vnpUrl
            }
          }));
        case 23:
          _context9.prev = 23;
          _context9.t0 = _context9["catch"](0);
          return _context9.abrupt("return", res.status(500).json({
            success: false,
            message: "Error creating VNPay payment URL",
            error: _context9.t0.message
          }));
        case 26:
        case "end":
          return _context9.stop();
      }
    }, _callee9, null, [[0, 23]]);
  }));
  return function createVnpayPaymentUrl(_x15, _x16) {
    return _ref9.apply(this, arguments);
  };
}();

// Tạo QR Code thanh toán ngân hàng
var createBankQRCode = exports.createBankQRCode = /*#__PURE__*/function () {
  var _ref0 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee0(req, res) {
    var _req$body5, accountNumber, bankCode, amount, description, orderId, transferDescription, qrCodeUrl, qrCodeDataUrl;
    return _regeneratorRuntime().wrap(function _callee0$(_context0) {
      while (1) switch (_context0.prev = _context0.next) {
        case 0:
          _context0.prev = 0;
          _req$body5 = req.body, accountNumber = _req$body5.accountNumber, bankCode = _req$body5.bankCode, amount = _req$body5.amount, description = _req$body5.description, orderId = _req$body5.orderId; // Validate input
          if (!(!accountNumber || !bankCode)) {
            _context0.next = 4;
            break;
          }
          return _context0.abrupt("return", res.status(400).json({
            success: false,
            message: "Thiếu thông tin tài khoản hoặc mã ngân hàng"
          }));
        case 4:
          // Tạo nội dung mặc định cho đơn hàng nếu không có description
          transferDescription = description || (orderId ? "Thanh toan don hang ".concat(orderId) : "Thanh toan DNC Food"); // Tạo QR Code URL
          qrCodeUrl = _paymentService["default"].generateBankQRCode(accountNumber, bankCode, amount, transferDescription);
          if (qrCodeUrl) {
            _context0.next = 8;
            break;
          }
          return _context0.abrupt("return", res.status(500).json({
            success: false,
            message: "Không thể tạo QR Code thanh toán ngân hàng"
          }));
        case 8:
          // Tạo QR code dạng DataURL nếu client yêu cầu
          qrCodeDataUrl = null;
          if (!req.body.generateDataUrl) {
            _context0.next = 13;
            break;
          }
          _context0.next = 12;
          return _paymentService["default"].generateQRCode(qrCodeUrl);
        case 12:
          qrCodeDataUrl = _context0.sent;
        case 13:
          return _context0.abrupt("return", res.json({
            success: true,
            data: {
              qrCodeUrl: qrCodeUrl,
              qrCodeDataUrl: qrCodeDataUrl,
              accountInfo: {
                accountNumber: accountNumber,
                bankCode: bankCode,
                amount: amount || 0,
                description: transferDescription
              }
            }
          }));
        case 16:
          _context0.prev = 16;
          _context0.t0 = _context0["catch"](0);
          return _context0.abrupt("return", res.status(500).json({
            success: false,
            message: "Lỗi khi tạo QR Code thanh toán ngân hàng",
            error: _context0.t0.message
          }));
        case 19:
        case "end":
          return _context0.stop();
      }
    }, _callee0, null, [[0, 16]]);
  }));
  return function createBankQRCode(_x17, _x18) {
    return _ref0.apply(this, arguments);
  };
}();

// Get payment status
var getPaymentStatus = exports.getPaymentStatus = /*#__PURE__*/function () {
  var _ref1 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee1(req, res) {
    var orderId, payment, order;
    return _regeneratorRuntime().wrap(function _callee1$(_context1) {
      while (1) switch (_context1.prev = _context1.next) {
        case 0:
          _context1.prev = 0;
          orderId = req.params.orderId; // Find payment by orderId
          _context1.next = 4;
          return _Payment["default"].findOne({
            orderId: orderId
          });
        case 4:
          payment = _context1.sent;
          if (payment) {
            _context1.next = 7;
            break;
          }
          return _context1.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy thông tin thanh toán"
          }));
        case 7:
          _context1.next = 9;
          return _Order["default"].findOne({
            orderId: orderId
          });
        case 9:
          order = _context1.sent;
          if (!(order && order.paymentStatus === "completed")) {
            _context1.next = 12;
            break;
          }
          return _context1.abrupt("return", res.json({
            success: true,
            status: "completed",
            message: "Thanh toán đã hoàn tất"
          }));
        case 12:
          return _context1.abrupt("return", res.json({
            success: true,
            status: "pending",
            message: "Đang chờ thanh toán"
          }));
        case 15:
          _context1.prev = 15;
          _context1.t0 = _context1["catch"](0);
          return _context1.abrupt("return", res.status(500).json({
            success: false,
            message: "Lỗi khi kiểm tra trạng thái thanh toán",
            error: _context1.t0.message
          }));
        case 18:
        case "end":
          return _context1.stop();
      }
    }, _callee1, null, [[0, 15]]);
  }));
  return function getPaymentStatus(_x19, _x20) {
    return _ref1.apply(this, arguments);
  };
}();

// Xử lý webhook từ SePay và ngân hàng
var handleBankWebhook = exports.handleBankWebhook = /*#__PURE__*/function () {
  var _ref10 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee10(req, res) {
    var timestamp, response;
    return _regeneratorRuntime().wrap(function _callee10$(_context10) {
      while (1) switch (_context10.prev = _context10.next) {
        case 0:
          _context10.prev = 0;
          timestamp = new Date().toISOString();
          console.log("[".concat(timestamp, "] Received webhook data:"), JSON.stringify(req.body));

          // Luôn trả về 200 OK trước, sau đó xử lý webhook bất đồng bộ
          // Điều này ngăn ngừa webhook timeout và hệ thống ngân hàng gửi lại webhook nhiều lần
          response = {
            success: true,
            code: "00",
            message: "Webhook received successfully",
            timestamp: timestamp
          }; // Trả về ngay để tránh timeout
          res.status(200).json(response);

          // Tiếp tục xử lý webhook bất đồng bộ
          processWebhook(req.body, req.headers)["catch"](function (err) {
            console.error("Error processing webhook:", err);
          });
          _context10.next = 13;
          break;
        case 8:
          _context10.prev = 8;
          _context10.t0 = _context10["catch"](0);
          console.error("Fatal error handling webhook:", _context10.t0);
          // Nếu chưa trả về, trả về 200 OK
          if (res.headersSent) {
            _context10.next = 13;
            break;
          }
          return _context10.abrupt("return", res.status(200).json({
            success: true,
            code: "00",
            message: "Webhook received with error",
            error: _context10.t0.message
          }));
        case 13:
        case "end":
          return _context10.stop();
      }
    }, _callee10, null, [[0, 8]]);
  }));
  return function handleBankWebhook(_x21, _x22) {
    return _ref10.apply(this, arguments);
  };
}();

// Hàm xử lý webhook bất đồng bộ
function processWebhook(_x23, _x24) {
  return _processWebhook.apply(this, arguments);
} // Kiểm tra trạng thái thanh toán qua SePay
function _processWebhook() {
  _processWebhook = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee12(webhookData, headers) {
    var transaction_id, order_id, amount, status, id, gateway, transactionDate, accountNumber, content, transferAmount, referenceCode, orderId, transactionId, paymentAmount, hexIdPattern, hexMatch, orderIdMatch, patterns, _i2, _patterns, pattern, match, extractedId, cleanHexMatch, order, isSuccessful, payment, userId, _amount, newPayment;
    return _regeneratorRuntime().wrap(function _callee12$(_context12) {
      while (1) switch (_context12.prev = _context12.next) {
        case 0:
          _context12.prev = 0;
          // Phân tích dữ liệu webhook
          transaction_id = webhookData.transaction_id, order_id = webhookData.order_id, amount = webhookData.amount, status = webhookData.status, id = webhookData.id, gateway = webhookData.gateway, transactionDate = webhookData.transactionDate, accountNumber = webhookData.accountNumber, content = webhookData.content, transferAmount = webhookData.transferAmount, referenceCode = webhookData.referenceCode; // Ghi log dữ liệu webhook
          _paymentService["default"].logWebhook(webhookData);

          // Xử lý theo loại webhook
          orderId = order_id || webhookData.orderId || null;
          transactionId = transaction_id || id || referenceCode || null;
          paymentAmount = amount || transferAmount || null; // Tìm mã đơn hàng từ nội dung chuyển khoản nếu là MBBank
          if (!(gateway === 'MBBank' && content)) {
            _context12.next = 28;
            break;
          }
          console.log("Parsing MBBank content for order ID:", content);

          // Tìm chuỗi 24 ký tự hex - mã đơn hàng MongoDB
          hexIdPattern = /[a-f0-9]{24}/i;
          hexMatch = content.match(hexIdPattern);
          if (!hexMatch) {
            _context12.next = 15;
            break;
          }
          orderId = hexMatch[0];
          console.log("Extracted MongoDB ID from content:", orderId);
          _context12.next = 28;
          break;
        case 15:
          orderIdMatch = null;
          patterns = [/TT DH\s+([a-zA-Z0-9]+)/i, /don hang\s+([a-zA-Z0-9]+)/i, /DH\s+([a-zA-Z0-9]+)/i]; // Thử từng pattern
          _i2 = 0, _patterns = patterns;
        case 18:
          if (!(_i2 < _patterns.length)) {
            _context12.next = 27;
            break;
          }
          pattern = _patterns[_i2];
          match = content.match(pattern);
          if (!(match && match[1])) {
            _context12.next = 24;
            break;
          }
          orderIdMatch = match;
          return _context12.abrupt("break", 27);
        case 24:
          _i2++;
          _context12.next = 18;
          break;
        case 27:
          if (orderIdMatch && orderIdMatch[1]) {
            // Xử lý mã đơn hàng tìm được
            extractedId = orderIdMatch[1];
            cleanHexMatch = extractedId.match(/^([a-f0-9]{24})/i);
            if (cleanHexMatch) {
              orderId = cleanHexMatch[1];
            } else {
              orderId = extractedId;
            }
            console.log("Extracted order ID from MBBank content:", orderId);
          }
        case 28:
          if (orderId) {
            _context12.next = 31;
            break;
          }
          console.log("Could not find order ID in webhook data");
          return _context12.abrupt("return");
        case 31:
          console.log("Processing webhook for order ID: ".concat(orderId, ", transaction: ").concat(transactionId));

          // Tìm đơn hàng
          _context12.next = 34;
          return _Order["default"].findOne({
            $or: [{
              _id: orderId
            }, {
              orderId: orderId
            }]
          });
        case 34:
          order = _context12.sent;
          if (order) {
            _context12.next = 38;
            break;
          }
          console.log("Order not found with ID: ".concat(orderId));
          return _context12.abrupt("return");
        case 38:
          // Xác định trạng thái thanh toán thành công
          isSuccessful = status === 'success' || status === 'completed' || status === '0' || status === 0 || gateway === 'MBBank' && transferAmount > 0;
          if (!isSuccessful) {
            _context12.next = 123;
            break;
          }
          if (!(order.status !== 'completed')) {
            _context12.next = 66;
            break;
          }
          order.paymentStatus = 'completed';
          order.status = 'processing';
          order.isPaid = true;

          // Log chi tiết để troubleshoot
          console.log("C\u1EADp nh\u1EADt \u0111\u01A1n h\xE0ng ".concat(order._id, " th\xE0nh isPaid=true, paymentStatus=completed, status=processing"));

          // Lưu giao dịch vào đơn hàng
          if (!order.transactionId && transactionId) {
            order.transactionId = transactionId;
          }
          _context12.prev = 46;
          _context12.next = 49;
          return order.save();
        case 49:
          console.log("Updated order ".concat(order._id, " status to 'completed', isPaid=true"));
          _context12.next = 64;
          break;
        case 52:
          _context12.prev = 52;
          _context12.t0 = _context12["catch"](46);
          console.error("Error saving order:", _context12.t0);
          // Thử cập nhật lại chỉ các trường cần thiết
          _context12.prev = 55;
          _context12.next = 58;
          return _Order["default"].updateOne({
            _id: order._id
          }, {
            $set: {
              paymentStatus: 'completed',
              status: 'processing',
              isPaid: true,
              transactionId: transactionId || order.transactionId
            }
          });
        case 58:
          console.log("Updated order ".concat(order._id, " with updateOne"));
          _context12.next = 64;
          break;
        case 61:
          _context12.prev = 61;
          _context12.t1 = _context12["catch"](55);
          console.error("Error updating order:", _context12.t1);
        case 64:
          _context12.next = 67;
          break;
        case 66:
          console.log("Order ".concat(order._id, " already marked as completed"));
        case 67:
          _context12.prev = 67;
          _context12.next = 70;
          return _Payment["default"].findOne({
            $or: [{
              orderId: order._id
            }, {
              orderId: orderId
            }]
          });
        case 70:
          payment = _context12.sent;
          if (!payment) {
            _context12.next = 95;
            break;
          }
          if (!(payment.status !== 'completed')) {
            _context12.next = 92;
            break;
          }
          payment.status = 'completed';
          payment.transactionId = transactionId || "webhook_".concat(Date.now());
          payment.amount = paymentAmount || payment.amount;
          payment.paidAt = new Date();

          // Xóa voucher đã lưu sau khi thanh toán thành công (nếu có)
          if (!payment.savedVoucherId) {
            _context12.next = 87;
            break;
          }
          _context12.prev = 78;
          _context12.next = 81;
          return _SavedVoucher["default"].findByIdAndDelete(payment.savedVoucherId);
        case 81:
          console.log("\u0110\xE3 x\xF3a voucher \u0111\xE3 l\u01B0u ".concat(payment.savedVoucherId, " sau khi thanh to\xE1n th\xE0nh c\xF4ng (webhook)"));
          _context12.next = 87;
          break;
        case 84:
          _context12.prev = 84;
          _context12.t2 = _context12["catch"](78);
          console.error('Error deleting saved voucher from webhook:', _context12.t2);
        case 87:
          _context12.next = 89;
          return payment.save();
        case 89:
          console.log("Updated payment ".concat(payment._id, " status to 'completed'"));
          _context12.next = 93;
          break;
        case 92:
          console.log("Payment ".concat(payment._id, " already marked as completed"));
        case 93:
          _context12.next = 115;
          break;
        case 95:
          _context12.prev = 95;
          // Đảm bảo có đủ thông tin
          userId = order.userId || order.user;
          _amount = paymentAmount || order.totalAmount;
          if (userId) {
            _context12.next = 102;
            break;
          }
          console.warn("Cannot create payment record: missing userId");
          _context12.next = 110;
          break;
        case 102:
          if (_amount) {
            _context12.next = 106;
            break;
          }
          console.warn("Cannot create payment record: missing amount");
          _context12.next = 110;
          break;
        case 106:
          newPayment = new _Payment["default"]({
            orderId: order._id,
            userId: userId,
            totalAmount: _amount,
            amount: _amount,
            paymentMethod: gateway === 'MBBank' ? 'bank_transfer' : 'sepay',
            status: 'completed',
            transactionId: transactionId || "webhook_".concat(Date.now()),
            paidAt: new Date()
          });
          _context12.next = 109;
          return newPayment.save();
        case 109:
          console.log("Created new payment record for order ".concat(order._id));
        case 110:
          _context12.next = 115;
          break;
        case 112:
          _context12.prev = 112;
          _context12.t3 = _context12["catch"](95);
          console.error("Error creating payment record:", _context12.t3);
        case 115:
          _context12.next = 120;
          break;
        case 117:
          _context12.prev = 117;
          _context12.t4 = _context12["catch"](67);
          console.error("Error updating payment:", _context12.t4);
        case 120:
          console.log("Webhook processing for order ".concat(orderId, " completed successfully"));
          _context12.next = 124;
          break;
        case 123:
          console.log("Webhook received with non-success status: ".concat(status));
        case 124:
          _context12.next = 129;
          break;
        case 126:
          _context12.prev = 126;
          _context12.t5 = _context12["catch"](0);
          console.error("Error processing webhook:", _context12.t5);
        case 129:
        case "end":
          return _context12.stop();
      }
    }, _callee12, null, [[0, 126], [46, 52], [55, 61], [67, 117], [78, 84], [95, 112]]);
  }));
  return _processWebhook.apply(this, arguments);
}
var checkPaymentStatus = exports.checkPaymentStatus = /*#__PURE__*/function () {
  var _ref11 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee11(req, res) {
    var orderId, cacheKey, order, isPaid, payment;
    return _regeneratorRuntime().wrap(function _callee11$(_context11) {
      while (1) switch (_context11.prev = _context11.next) {
        case 0:
          _context11.prev = 0;
          orderId = req.params.orderId; // Cache-busting: Đảm bảo luôn lấy dữ liệu mới nhất từ DB
          cacheKey = req.query._ || Date.now();
          console.log("Checking payment status for orderId: ".concat(orderId, ", cache key: ").concat(cacheKey));
          if (orderId) {
            _context11.next = 6;
            break;
          }
          return _context11.abrupt("return", res.status(400).json({
            success: false,
            message: "Missing orderId parameter"
          }));
        case 6:
          // Kiểm tra đơn hàng trong database
          console.log("Querying order status from database");
          _context11.prev = 7;
          _context11.next = 10;
          return _Order["default"].findOne({
            $or: [{
              _id: orderId
            }, {
              orderId: orderId
            }]
          });
        case 10:
          order = _context11.sent;
          if (order) {
            _context11.next = 14;
            break;
          }
          console.log("Order not found with ID: ".concat(orderId));
          return _context11.abrupt("return", res.status(404).json({
            success: false,
            message: "Order not found"
          }));
        case 14:
          console.log("Found order:", JSON.stringify(order));

          // Kiểm tra nhiều trường hơn để xác định trạng thái thanh toán
          isPaid = order.paymentStatus === 'completed' || order.isPaid === true || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered';
          console.log("Order ID: ".concat(order._id, ", Payment Status: ").concat(order.paymentStatus, ", isPaid: ").concat(isPaid, ", Status: ").concat(order.status));

          // Kiểm tra trạng thái thanh toán dựa trên dữ liệu thực tế
          if (!isPaid) {
            _context11.next = 25;
            break;
          }
          if (!(order.paymentStatus !== 'completed' || order.isPaid !== true)) {
            _context11.next = 24;
            break;
          }
          order.paymentStatus = 'completed';
          order.isPaid = true;
          _context11.next = 23;
          return order.save();
        case 23:
          console.log("Updated order payment status for ".concat(order._id));
        case 24:
          return _context11.abrupt("return", res.status(200).json({
            success: true,
            status: "completed",
            message: "Thanh toán đã được xác nhận thành công",
            data: {
              orderId: order._id,
              totalAmount: order.totalAmount,
              paymentMethod: order.paymentMethod,
              isPaid: true,
              timestamp: Date.now()
            }
          }));
        case 25:
          _context11.next = 27;
          return _Payment["default"].findOne({
            $or: [{
              orderId: order._id
            }, {
              orderId: orderId
            }],
            status: 'completed'
          });
        case 27:
          payment = _context11.sent;
          if (!payment) {
            _context11.next = 36;
            break;
          }
          // Cập nhật trạng thái đơn hàng nếu chưa cập nhật
          order.paymentStatus = 'completed';
          order.status = 'processing';
          order.isPaid = true;
          _context11.next = 34;
          return order.save();
        case 34:
          console.log("Updated order ".concat(order._id, " payment status to completed"));
          return _context11.abrupt("return", res.status(200).json({
            success: true,
            status: "completed",
            message: "Thanh toán đã được xác nhận thành công",
            data: {
              orderId: order._id,
              totalAmount: order.totalAmount,
              paymentMethod: payment.paymentMethod,
              isPaid: true,
              timestamp: Date.now()
            }
          }));
        case 36:
          return _context11.abrupt("return", res.json({
            success: false,
            status: "pending",
            message: "Đang chờ thanh toán",
            data: {
              orderId: order._id,
              totalAmount: order.totalAmount,
              isPaid: false,
              timestamp: Date.now()
            }
          }));
        case 39:
          _context11.prev = 39;
          _context11.t0 = _context11["catch"](7);
          console.error("Error in database query:", _context11.t0);

          // Trả về lỗi cụ thể
          return _context11.abrupt("return", res.status(500).json({
            success: false,
            message: "Lỗi truy vấn cơ sở dữ liệu",
            error: _context11.t0.message,
            timestamp: Date.now()
          }));
        case 43:
          _context11.next = 49;
          break;
        case 45:
          _context11.prev = 45;
          _context11.t1 = _context11["catch"](0);
          console.error("Error checking payment status:", _context11.t1);
          return _context11.abrupt("return", res.status(500).json({
            success: false,
            message: "Error checking payment status",
            error: _context11.t1.message,
            timestamp: Date.now()
          }));
        case 49:
        case "end":
          return _context11.stop();
      }
    }, _callee11, null, [[0, 45], [7, 39]]);
  }));
  return function checkPaymentStatus(_x25, _x26) {
    return _ref11.apply(this, arguments);
  };
}();

// Hàm kiểm tra chuyển khoản ngân hàng trực tiếp
// Trong thực tế, bạn sẽ tích hợp với API ngân hàng hoặc dịch vụ webhook
function checkDirectBankTransfers(_x27) {
  return _checkDirectBankTransfers.apply(this, arguments);
}
function _checkDirectBankTransfers() {
  _checkDirectBankTransfers = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee13(orderId) {
    return _regeneratorRuntime().wrap(function _callee13$(_context13) {
      while (1) switch (_context13.prev = _context13.next) {
        case 0:
          _context13.prev = 0;
          // Đây là hàm mô phỏng, trong thực tế bạn sẽ kết nối với API ngân hàng
          // hoặc kiểm tra database ghi nhận webhook từ ngân hàng

          // Giả lập tìm kiếm giao dịch theo mã đơn hàng trong nội dung chuyển khoản
          // Trong ứng dụng thực, bạn sẽ truy vấn database hoặc gọi API ngân hàng

          console.log("Checking bank transfer for orderId:", orderId);

          // Cho mục đích demo, kiểm tra các ID giao dịch đã biết
          // Kiểm tra mã đơn hàng chứa "67feb82" hoặc các mã giao dịch SePay hiện có
          if (!(orderId && orderId.includes("67feb82") || orderId === "1179156" || orderId === "1179097")) {
            _context13.next = 5;
            break;
          }
          console.log("Found matching bank transfer for orderId:", orderId);
          return _context13.abrupt("return", {
            success: true,
            transaction: {
              id: "bank_".concat(Date.now()),
              time: new Date(),
              amount: 5300,
              status: "success"
            }
          });
        case 5:
          console.log("No bank transfer found for orderId:", orderId);
          return _context13.abrupt("return", {
            success: false,
            message: "No bank transfer found"
          });
        case 9:
          _context13.prev = 9;
          _context13.t0 = _context13["catch"](0);
          console.error("Error checking bank transfers:", _context13.t0);
          return _context13.abrupt("return", {
            success: false,
            error: _context13.t0.message
          });
        case 13:
        case "end":
          return _context13.stop();
      }
    }, _callee13, null, [[0, 9]]);
  }));
  return _checkDirectBankTransfers.apply(this, arguments);
}
var isOrderPaid = function isOrderPaid(order) {
  return order.isPaid === true || order.paymentStatus === 'completed' || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed';
};