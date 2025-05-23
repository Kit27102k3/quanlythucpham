"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sendOrderShippingEmail = exports.sendOrderConfirmationEmail = exports["default"] = void 0;
var _nodemailer = _interopRequireDefault(require("nodemailer"));
var _qrcode = _interopRequireDefault(require("qrcode"));
var _dotenv = _interopRequireDefault(require("dotenv"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
// Cấu hình dotenv để đọc biến môi trường
_dotenv["default"].config();

// Thiết lập biến môi trường - Sửa lỗi ESLint
/* global process */
var ENV = {
  EMAIL_USERNAME: process.env.EMAIL_USERNAME || 'your-email@gmail.com',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || 'your-app-password',
  CLIENT_URL: process.env.CLIENT_URL || 'https://quanlythucpham-client.vercel.app'
};

// Khởi tạo transporter để gửi email
var transporter = _nodemailer["default"].createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: ENV.EMAIL_USERNAME,
    pass: ENV.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Tạo mã QR từ dữ liệu
var generateQRCode = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(data) {
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return _qrcode["default"].toDataURL(JSON.stringify(data));
        case 3:
          return _context.abrupt("return", _context.sent);
        case 6:
          _context.prev = 6;
          _context.t0 = _context["catch"](0);
          return _context.abrupt("return", null);
        case 9:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 6]]);
  }));
  return function generateQRCode(_x) {
    return _ref.apply(this, arguments);
  };
}();

// Tạo nội dung email đặt hàng thành công
var createOrderEmailTemplate = function createOrderEmailTemplate(order, qrCodeImage) {
  var _order$shippingInfo, _order$shippingInfo2, _order$shippingInfo3, _order$shippingInfo4, _order$shippingInfo5;
  // Tính tổng số lượng sản phẩm
  var totalItems = order.products.reduce(function (sum, item) {
    return sum + item.quantity;
  }, 0);

  // Format tiền tệ
  var formatCurrency = function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Tạo danh sách sản phẩm HTML
  var productsList = order.products.map(function (item) {
    var product = item.productId;
    var productName = product.productName || 'Sản phẩm';
    var productPrice = product.productPrice || 0;
    var subtotal = item.quantity * productPrice;
    return "\n      <tr>\n        <td style=\"padding: 10px; border-bottom: 1px solid #ddd;\">\n          <div style=\"display: flex; align-items: center;\">\n            ".concat(product.productImages && product.productImages[0] ? "<img src=\"".concat(product.productImages[0], "\" alt=\"").concat(productName, "\" style=\"width: 50px; height: 50px; object-fit: cover; margin-right: 10px; border-radius: 4px;\">") : '', "\n            <div>").concat(productName, "</div>\n          </div>\n        </td>\n        <td style=\"padding: 10px; border-bottom: 1px solid #ddd; text-align: center;\">").concat(item.quantity, "</td>\n        <td style=\"padding: 10px; border-bottom: 1px solid #ddd; text-align: right;\">").concat(formatCurrency(productPrice), "</td>\n        <td style=\"padding: 10px; border-bottom: 1px solid #ddd; text-align: right;\">").concat(formatCurrency(subtotal), "</td>\n      </tr>\n    ");
  }).join('');

  // Xác định thông tin về mã giảm giá nếu có
  var discountInfo = '';
  if (order.coupon && order.coupon.discount) {
    discountInfo = "\n      <p><strong>M\xE3 gi\u1EA3m gi\xE1:</strong> ".concat(order.coupon.code || 'Đã áp dụng', "</p>\n      <p><strong>Gi\u1EA3m gi\xE1:</strong> ").concat(formatCurrency(order.coupon.discount), "</p>\n    ");
  }

  // Xác định phí vận chuyển
  var shippingFee = order.shippingFee || order.deliveryFee || 0;

  // Tạo HTML cho email
  return "\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <meta charset=\"UTF-8\">\n      <title>X\xE1c nh\u1EADn \u0111\u01A1n h\xE0ng #".concat(order.orderCode, "</title>\n      <style>\n        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n        .header { background-color: #51bb1a; color: white; padding: 15px 20px; text-align: center; border-radius: 8px 8px 0 0; }\n        .content { padding: 20px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; }\n        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }\n        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }\n        th { background-color: #f2f2f2; text-align: left; padding: 10px; }\n        .summary { margin-top: 20px; font-weight: bold; }\n        .qrcode { text-align: center; margin: 20px 0; }\n        .qrcode img { max-width: 200px; }\n        .order-info { margin-bottom: 20px; background-color: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }\n        .shipping-info { margin-bottom: 20px; background-color: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }\n        .thank-you { margin-top: 30px; font-weight: bold; color: #51bb1a; text-align: center; font-size: 18px; }\n        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }\n        .btn { display: inline-block; background-color: #51bb1a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }\n      </style>\n    </head>\n    <body>\n      <div class=\"container\">\n        <div class=\"header\">\n          <div class=\"logo\">DNC FOOD</div>\n          <h2>X\xE1c nh\u1EADn \u0111\u01A1n h\xE0ng #").concat(order.orderCode, "</h2>\n        </div>\n        <div class=\"content\">\n          <p>Xin ch\xE0o ").concat(((_order$shippingInfo = order.shippingInfo) === null || _order$shippingInfo === void 0 ? void 0 : _order$shippingInfo.fullName) || 'Quý khách', ",</p>\n          <p>C\u1EA3m \u01A1n b\u1EA1n \u0111\xE3 \u0111\u1EB7t h\xE0ng t\u1EA1i DNC FOOD. \u0110\u01A1n h\xE0ng c\u1EE7a b\u1EA1n \u0111\xE3 \u0111\u01B0\u1EE3c x\xE1c nh\u1EADn!</p>\n          \n          <div class=\"order-info\">\n            <h3>Th\xF4ng tin \u0111\u01A1n h\xE0ng</h3>\n            <p><strong>M\xE3 \u0111\u01A1n h\xE0ng:</strong> ").concat(order.orderCode, "</p>\n            <p><strong>Ng\xE0y \u0111\u1EB7t h\xE0ng:</strong> ").concat(new Date(order.createdAt).toLocaleString('vi-VN'), "</p>\n            <p><strong>Ph\u01B0\u01A1ng th\u1EE9c thanh to\xE1n:</strong> ").concat(order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán trực tuyến', "</p>\n            <p><strong>Tr\u1EA1ng th\xE1i \u0111\u01A1n h\xE0ng:</strong> ").concat(order.status === 'pending' ? 'Đang xử lý' : order.status, "</p>\n            ").concat(discountInfo, "\n          </div>\n          \n          <div class=\"shipping-info\">\n            <h3>Th\xF4ng tin giao h\xE0ng</h3>\n            <p><strong>H\u1ECD t\xEAn:</strong> ").concat(((_order$shippingInfo2 = order.shippingInfo) === null || _order$shippingInfo2 === void 0 ? void 0 : _order$shippingInfo2.fullName) || '', "</p>\n            <p><strong>\u0110\u1ECBa ch\u1EC9:</strong> ").concat(((_order$shippingInfo3 = order.shippingInfo) === null || _order$shippingInfo3 === void 0 ? void 0 : _order$shippingInfo3.address) || '', "</p>\n            <p><strong>S\u1ED1 \u0111i\u1EC7n tho\u1EA1i:</strong> ").concat(((_order$shippingInfo4 = order.shippingInfo) === null || _order$shippingInfo4 === void 0 ? void 0 : _order$shippingInfo4.phone) || '', "</p>\n            <p><strong>Email:</strong> ").concat(((_order$shippingInfo5 = order.shippingInfo) === null || _order$shippingInfo5 === void 0 ? void 0 : _order$shippingInfo5.email) || '', "</p>\n          </div>\n          \n          <h3>Chi ti\u1EBFt \u0111\u01A1n h\xE0ng</h3>\n          <table>\n            <thead>\n              <tr>\n                <th style=\"padding: 10px; text-align: left;\">S\u1EA3n ph\u1EA9m</th>\n                <th style=\"padding: 10px; text-align: center;\">S\u1ED1 l\u01B0\u1EE3ng</th>\n                <th style=\"padding: 10px; text-align: right;\">\u0110\u01A1n gi\xE1</th>\n                <th style=\"padding: 10px; text-align: right;\">Th\xE0nh ti\u1EC1n</th>\n              </tr>\n            </thead>\n            <tbody>\n              ").concat(productsList, "\n            </tbody>\n          </table>\n          \n          <div class=\"summary\" style=\"background-color: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);\">\n            <p>T\u1ED5ng s\u1ED1 s\u1EA3n ph\u1EA9m: ").concat(totalItems, "</p>\n            <p>T\u1ED5ng ti\u1EC1n h\xE0ng: ").concat(formatCurrency(order.subtotal || order.totalAmount), "</p>\n            <p>Ph\xED v\u1EADn chuy\u1EC3n: ").concat(formatCurrency(shippingFee), "</p>\n            ").concat(order.coupon && order.coupon.discount ? "<p>Gi\u1EA3m gi\xE1: -".concat(formatCurrency(order.coupon.discount), "</p>") : '', "\n            <p style=\"font-size: 18px; color: #51bb1a;\">T\u1ED5ng thanh to\xE1n: ").concat(formatCurrency(order.totalAmount), "</p>\n          </div>\n          \n          ").concat(qrCodeImage ? "\n          <div class=\"qrcode\">\n            <p>M\xE3 QR \u0111\u01A1n h\xE0ng c\u1EE7a b\u1EA1n:</p>\n            <img src=\"".concat(qrCodeImage, "\" alt=\"QR Code\">\n            <p>Qu\xE9t m\xE3 n\xE0y \u0111\u1EC3 xem th\xF4ng tin \u0111\u01A1n h\xE0ng</p>\n          </div>\n          ") : '', "\n          \n          <p class=\"thank-you\">C\u1EA3m \u01A1n b\u1EA1n \u0111\xE3 l\u1EF1a ch\u1ECDn DNC FOOD!</p>\n          \n          <div style=\"text-align: center;\">\n            <a href=\"").concat(ENV.CLIENT_URL, "/tai-khoan/don-hang\" class=\"btn\">Xem \u0111\u01A1n h\xE0ng c\u1EE7a t\xF4i</a>\n          </div>\n          \n          <p>N\u1EBFu b\u1EA1n c\xF3 b\u1EA5t k\u1EF3 c\xE2u h\u1ECFi n\xE0o, vui l\xF2ng li\xEAn h\u1EC7 v\u1EDBi ch\xFAng t\xF4i qua email ").concat(ENV.EMAIL_USERNAME || 'support@dncfood.com', " ho\u1EB7c g\u1ECDi \u0111\u1EBFn hotline 0326 743391.</p>\n        </div>\n        <div class=\"footer\">\n          <p>\xA9 ").concat(new Date().getFullYear(), " DNC FOOD. \u0110\u1ECBa ch\u1EC9: 273 An D\u01B0\u01A1ng V\u01B0\u01A1ng, Ph\u01B0\u1EDDng 3, Qu\u1EADn 5, TP. H\u1ED3 Ch\xED Minh.</p>\n          <p>Email n\xE0y \u0111\u01B0\u1EE3c g\u1EEDi t\u1EF1 \u0111\u1ED9ng, vui l\xF2ng kh\xF4ng tr\u1EA3 l\u1EDDi.</p>\n        </div>\n      </div>\n    </body>\n    </html>\n  ");
};

// Hàm gửi email xác nhận đơn hàng
var sendOrderConfirmationEmail = exports.sendOrderConfirmationEmail = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(order) {
    var qrData, qrCodeImage, htmlContent, mailOptions, info;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          if (order.shippingInfo) {
            _context2.next = 3;
            break;
          }
          return _context2.abrupt("return", false);
        case 3:
          if (order.shippingInfo.email) {
            _context2.next = 9;
            break;
          }
          if (!(order.userId && order.userId.email)) {
            _context2.next = 8;
            break;
          }
          order.shippingInfo.email = order.userId.email;
          _context2.next = 9;
          break;
        case 8:
          return _context2.abrupt("return", false);
        case 9:
          // Tạo dữ liệu cho mã QR
          qrData = {
            orderCode: order.orderCode,
            totalAmount: order.totalAmount,
            status: order.status,
            date: order.createdAt
          }; // Tạo mã QR
          _context2.next = 12;
          return generateQRCode(qrData);
        case 12:
          qrCodeImage = _context2.sent;
          // Tạo nội dung email
          htmlContent = createOrderEmailTemplate(order, qrCodeImage); // Cấu hình email
          mailOptions = {
            from: "\"DNC FOOD\" <".concat(ENV.EMAIL_USERNAME, ">"),
            to: order.shippingInfo.email,
            subject: "X\xE1c nh\u1EADn \u0111\u01A1n h\xE0ng #".concat(order.orderCode),
            html: htmlContent
          }; // Gửi email
          _context2.next = 17;
          return transporter.sendMail(mailOptions);
        case 17:
          info = _context2.sent;
          return _context2.abrupt("return", true);
        case 21:
          _context2.prev = 21;
          _context2.t0 = _context2["catch"](0);
          return _context2.abrupt("return", false);
        case 24:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 21]]);
  }));
  return function sendOrderConfirmationEmail(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

// Create email template for order shipping notification
var createOrderShippingTemplate = function createOrderShippingTemplate(order) {
  // Format currency
  var formatCurrency = function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Get payment status and amount to be paid
  var isPaid = order.isPaid || false;
  var amountToBePaid = isPaid ? 0 : order.totalAmount + (order.shippingFee || 0);

  // Handle case where orderCode is missing
  var orderIdentifier = order.orderCode || (order._id ? order._id.toString().slice(-6).toUpperCase() : 'N/A');

  // Get customer name from either shippingInfo or userId
  var customerName = 'Quý khách';
  if (order.shippingInfo && order.shippingInfo.fullName) {
    customerName = order.shippingInfo.fullName;
  } else if (order.userId) {
    if (order.userId.firstName && order.userId.lastName) {
      customerName = "".concat(order.userId.firstName, " ").concat(order.userId.lastName);
    } else if (order.userId.userName) {
      customerName = order.userId.userName;
    }
  }

  // Get shipping address and phone from either shippingInfo or userId
  var shippingAddress = '';
  var phoneNumber = '';
  if (order.shippingInfo) {
    shippingAddress = order.shippingInfo.address || '';
    phoneNumber = order.shippingInfo.phone || '';
  } else if (order.userId) {
    shippingAddress = order.userId.address || '';
    phoneNumber = order.userId.phone || '';
  }
  return "\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <meta charset=\"UTF-8\">\n      <title>\u0110\u01A1n h\xE0ng c\u1EE7a b\u1EA1n \u0111ang \u0111\u01B0\u1EE3c giao \u0111\u1EBFn</title>\n      <style>\n        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n        .header { background-color: #4361ee; color: white; padding: 10px 20px; text-align: center; }\n        .content { padding: 20px; background-color: #f9f9f9; }\n        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }\n        .highlight { color: #4361ee; font-weight: bold; }\n        .payment-info { margin: 20px 0; padding: 15px; background-color: #fff8e6; border-left: 4px solid #ffc107; }\n        .thank-you { margin-top: 30px; font-weight: bold; color: #4361ee; }\n      </style>\n    </head>\n    <body>\n      <div class=\"container\">\n        <div class=\"header\">\n          <h2>\u0110\u01A1n h\xE0ng c\u1EE7a b\u1EA1n \u0111ang tr\xEAn \u0111\u01B0\u1EDDng giao \u0111\u1EBFn!</h2>\n        </div>\n        <div class=\"content\">\n          <p>Xin ch\xE0o ".concat(customerName, ",</p>\n          <p>Ch\xFAng t\xF4i vui m\u1EEBng th\xF4ng b\xE1o r\u1EB1ng \u0111\u01A1n h\xE0ng <span class=\"highlight\">#").concat(orderIdentifier, "</span> c\u1EE7a b\u1EA1n hi\u1EC7n \u0111ang \u0111\u01B0\u1EE3c giao \u0111\u1EBFn \u0111\u1ECBa ch\u1EC9 c\u1EE7a b\u1EA1n.</p>\n          \n          <p><strong>Th\xF4ng tin giao h\xE0ng:</strong></p>\n          <ul>\n            <li><strong>\u0110\u1ECBa ch\u1EC9:</strong> ").concat(shippingAddress, "</li>\n            <li><strong>S\u1ED1 \u0111i\u1EC7n tho\u1EA1i:</strong> ").concat(phoneNumber, "</li>\n            <li><strong>T\u1ED5ng gi\xE1 tr\u1ECB \u0111\u01A1n h\xE0ng:</strong> ").concat(formatCurrency(order.totalAmount + (order.shippingFee || 0)), "</li>\n          </ul>\n          \n          ").concat(!isPaid ? "\n          <div class=\"payment-info\">\n            <p><strong>Th\xF4ng tin thanh to\xE1n:</strong></p>\n            <p>Ph\u01B0\u01A1ng th\u1EE9c thanh to\xE1n: ".concat(order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : order.paymentMethod, "</p>\n            <p>S\u1ED1 ti\u1EC1n c\u1EA7n thanh to\xE1n: <span class=\"highlight\">").concat(formatCurrency(amountToBePaid), "</span></p>\n            <p>Vui l\xF2ng chu\u1EA9n b\u1ECB s\u1ED1 ti\u1EC1n ch\xEDnh x\xE1c \u0111\u1EC3 qu\xE1 tr\xECnh giao h\xE0ng di\u1EC5n ra thu\u1EADn l\u1EE3i.</p>\n          </div>\n          ") : "\n          <div class=\"payment-info\" style=\"background-color: #e7f7e7; border-left: 4px solid #4CAF50;\">\n            <p><strong>Th\xF4ng tin thanh to\xE1n:</strong></p>\n            <p>\u0110\u01A1n h\xE0ng c\u1EE7a b\u1EA1n \u0111\xE3 \u0111\u01B0\u1EE3c thanh to\xE1n \u0111\u1EA7y \u0111\u1EE7.</p>\n            <p>B\u1EA1n ch\u1EC9 c\u1EA7n nh\u1EADn h\xE0ng m\xE0 kh\xF4ng c\u1EA7n thanh to\xE1n th\xEAm kho\u1EA3n n\xE0o.</p>\n          </div>\n          ", "\n          \n          <p>\u0110\u01A1n h\xE0ng c\u1EE7a b\u1EA1n d\u1EF1 ki\u1EBFn s\u1EBD \u0111\u01B0\u1EE3c giao trong ng\xE0y. Nh\xE2n vi\xEAn giao h\xE0ng s\u1EBD li\xEAn h\u1EC7 v\u1EDBi b\u1EA1n tr\u01B0\u1EDBc khi giao.</p>\n          \n          <p>N\u1EBFu b\u1EA1n kh\xF4ng c\xF3 nh\xE0 v\xE0o th\u1EDDi \u0111i\u1EC3m giao h\xE0ng, vui l\xF2ng li\xEAn h\u1EC7 v\u1EDBi ch\xFAng t\xF4i \u0111\u1EC3 s\u1EAFp x\u1EBFp l\u1EA1i th\u1EDDi gian giao h\xE0ng ph\xF9 h\u1EE3p.</p>\n          \n          <p class=\"thank-you\">C\u1EA3m \u01A1n b\u1EA1n \u0111\xE3 l\u1EF1a ch\u1ECDn Si\xEAu Th\u1ECB Th\u1EF1c Ph\u1EA9m S\u1EA1ch!</p>\n          \n          <p>N\u1EBFu b\u1EA1n c\xF3 b\u1EA5t k\u1EF3 c\xE2u h\u1ECFi n\xE0o, vui l\xF2ng li\xEAn h\u1EC7 v\u1EDBi ch\xFAng t\xF4i qua email support@chuoikoicho.com ho\u1EB7c g\u1ECDi \u0111\u1EBFn hotline 1900 6789.</p>\n        </div>\n        <div class=\"footer\">\n          <p>\xA9 2023 Si\xEAu Th\u1ECB Th\u1EF1c Ph\u1EA9m S\u1EA1ch. \u0110\u1ECBa ch\u1EC9: 273 An D\u01B0\u01A1ng V\u01B0\u01A1ng, Ph\u01B0\u1EDDng 3, Qu\u1EADn 5, TP. H\u1ED3 Ch\xED Minh.</p>\n          <p>Email n\xE0y \u0111\u01B0\u1EE3c g\u1EEDi t\u1EF1 \u0111\u1ED9ng, vui l\xF2ng kh\xF4ng tr\u1EA3 l\u1EDDi.</p>\n        </div>\n      </div>\n    </body>\n    </html>\n  ");
};

// Function to send email notification when order is being delivered
var sendOrderShippingEmail = exports.sendOrderShippingEmail = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(order) {
    var recipientEmail, orderIdentifier, htmlContent, mailOptions, info;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          // Check if order has email information either in shippingInfo or userId
          recipientEmail = null; // First try to get email from shippingInfo
          if (order.shippingInfo && order.shippingInfo.email) {
            recipientEmail = order.shippingInfo.email;
          }
          // If not available, try to get from userId if it's populated
          else if (order.userId && order.userId.email) {
            recipientEmail = order.userId.email;
          }
          if (recipientEmail) {
            _context3.next = 4;
            break;
          }
          return _context3.abrupt("return", false);
        case 4:
          // Handle case where orderCode is missing
          orderIdentifier = order.orderCode || (order._id ? order._id.toString().slice(-6).toUpperCase() : 'N/A'); // Create email content
          htmlContent = createOrderShippingTemplate(order); // Configure email
          mailOptions = {
            from: "\"DNC FOOD\" <".concat(ENV.EMAIL_USERNAME || 'no-reply@dncfood.com', ">"),
            to: recipientEmail,
            subject: "\u0110\u01A1n h\xE0ng #".concat(orderIdentifier, " \u0111ang \u0111\u01B0\u1EE3c giao \u0111\u1EBFn b\u1EA1n"),
            html: htmlContent
          }; // Send email
          _context3.next = 9;
          return transporter.sendMail(mailOptions);
        case 9:
          info = _context3.sent;
          return _context3.abrupt("return", true);
        case 11:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return function sendOrderShippingEmail(_x3) {
    return _ref3.apply(this, arguments);
  };
}();
var _default = exports["default"] = {
  sendOrderConfirmationEmail: sendOrderConfirmationEmail,
  sendOrderShippingEmail: sendOrderShippingEmail
};