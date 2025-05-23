"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _axios = _interopRequireDefault(require("axios"));
var _paymentConfig = require("../config/paymentConfig.js");
var _qrcode = _interopRequireDefault(require("qrcode"));
var _crypto = _interopRequireDefault(require("crypto"));
var _dotenv = _interopRequireDefault(require("dotenv"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /* eslint-disable no-unused-vars */ /* eslint-disable no-undef */
_dotenv["default"].config();

// Thêm biến môi trường cho domain
var isDevelopment = process.env.NODE_ENV !== 'production';
var SITE_CONFIG = {
  baseUrl: isDevelopment ? "http://localhost:3000" : "https://quanlythucpham.vercel.app",
  apiUrl: isDevelopment ? "http://localhost:8080" : "https://quanlythucpham-azf6.vercel.app"
};
var PaymentService = /*#__PURE__*/function () {
  function PaymentService() {
    _classCallCheck(this, PaymentService);
  }
  return _createClass(PaymentService, null, [{
    key: "createSePayPayment",
    value: // SePay Payment
    function () {
      var _createSePayPayment = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(orderId, amount, orderInfo) {
        var customRedirectUrl,
          returnUrl,
          ngrokUrl,
          apiBaseUrl,
          notifyUrl,
          requestData,
          response,
          qrCodeDataURL,
          _response$data,
          _args = arguments;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              customRedirectUrl = _args.length > 3 && _args[3] !== undefined ? _args[3] : null;
              _context.prev = 1;
              // Cấu hình endpoints callback
              // Sử dụng customRedirectUrl từ client nếu có, ngược lại dùng URL mặc định
              returnUrl = customRedirectUrl || "".concat(SITE_CONFIG.baseUrl, "/payment-result"); // Ưu tiên sử dụng NGROK_URL nếu có (cho môi trường phát triển với ngrok)
              ngrokUrl = process.env.NGROK_URL; // Sử dụng đường dẫn chính xác của API
              apiBaseUrl = ngrokUrl || (isDevelopment ? "http://localhost:8080" : "https://quanlythucpham-azf6.vercel.app"); // Đường dẫn webhook SePay chính xác
              notifyUrl = "".concat(apiBaseUrl, "/api/payments/webhook/bank");
              requestData = {
                merchantId: _paymentConfig.SEPAY.merchantId,
                orderId: orderId.toString(),
                amount: parseInt(amount),
                orderInfo: orderInfo,
                returnUrl: "".concat(returnUrl).concat(returnUrl.includes('?') ? '&' : '?', "status=success&amount=").concat(amount),
                notifyUrl: notifyUrl,
                expireTime: _paymentConfig.SEPAY.qrExpireTime // Thêm thời gian hết hạn từ config
              }; // Gọi API SePay thực từ tệp .env
              _context.next = 9;
              return _axios["default"].post(process.env.SEPAY_API_URL, requestData, {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': "Bearer ".concat(process.env.SEPAY_API_TOKEN)
                },
                timeout: 30000 // 30 giây
              });
            case 9:
              response = _context.sent;
              if (!(response.data && response.data.code === '00')) {
                _context.next = 17;
                break;
              }
              _context.next = 13;
              return this.generateQRCode(response.data.data);
            case 13:
              qrCodeDataURL = _context.sent;
              return _context.abrupt("return", {
                code: response.data.code,
                message: response.data.message,
                data: response.data.data,
                qr_code: qrCodeDataURL
              });
            case 17:
              throw new Error("Ph\u1EA3n h\u1ED3i kh\xF4ng th\xE0nh c\xF4ng t\u1EEB SePay API: ".concat(((_response$data = response.data) === null || _response$data === void 0 ? void 0 : _response$data.message) || 'Unknown error'));
            case 18:
              _context.next = 23;
              break;
            case 20:
              _context.prev = 20;
              _context.t0 = _context["catch"](1);
              throw new Error("L\u1ED7i t\u1EA1o thanh to\xE1n SePay: ".concat(_context.t0.message));
            case 23:
            case "end":
              return _context.stop();
          }
        }, _callee, this, [[1, 20]]);
      }));
      function createSePayPayment(_x, _x2, _x3) {
        return _createSePayPayment.apply(this, arguments);
      }
      return createSePayPayment;
    }() // Tạo URL thanh toán dự phòng
  }, {
    key: "createFallbackPayment",
    value: function () {
      var _createFallbackPayment = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(orderId, amount, orderInfo) {
        var baseUrl, fallbackUrl, qrCodeDataURL, _baseUrl, emergencyUrl;
        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;
              // Sử dụng URL động dựa vào môi trường
              baseUrl = SITE_CONFIG.baseUrl; // URL thanh toán dự phòng
              fallbackUrl = "".concat(baseUrl, "/payment-result?orderId=").concat(orderId, "&status=success&amount=").concat(amount); // Tạo QR code cho URL thanh toán
              _context2.next = 5;
              return this.generateQRCode(fallbackUrl);
            case 5:
              qrCodeDataURL = _context2.sent;
              return _context2.abrupt("return", {
                code: '01',
                // Dùng code "01" cho thanh toán dự phòng
                message: 'Sử dụng URL thanh toán dự phòng',
                data: fallbackUrl,
                qr_code: qrCodeDataURL
              });
            case 9:
              _context2.prev = 9;
              _context2.t0 = _context2["catch"](0);
              // Đảm bảo luôn trả về kết quả hợp lệ
              _baseUrl = SITE_CONFIG.baseUrl;
              emergencyUrl = "".concat(_baseUrl, "/payment-result?orderId=").concat(orderId, "&status=success&amount=").concat(amount);
              return _context2.abrupt("return", {
                code: '01',
                message: 'Sử dụng URL thanh toán dự phòng khẩn cấp',
                data: emergencyUrl,
                qr_code: null
              });
            case 14:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this, [[0, 9]]);
      }));
      function createFallbackPayment(_x4, _x5, _x6) {
        return _createFallbackPayment.apply(this, arguments);
      }
      return createFallbackPayment;
    }() // Tạo mã QR cho URL thanh toán
  }, {
    key: "generateQRCode",
    value: function () {
      var _generateQRCode = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(text) {
        var qrCodeDataURL;
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              _context3.prev = 0;
              if (text) {
                _context3.next = 3;
                break;
              }
              return _context3.abrupt("return", null);
            case 3:
              _context3.next = 5;
              return _qrcode["default"].toDataURL(text, {
                width: 300,
                margin: 2,
                errorCorrectionLevel: 'H'
              });
            case 5:
              qrCodeDataURL = _context3.sent;
              return _context3.abrupt("return", qrCodeDataURL);
            case 9:
              _context3.prev = 9;
              _context3.t0 = _context3["catch"](0);
              return _context3.abrupt("return", null);
            case 12:
            case "end":
              return _context3.stop();
          }
        }, _callee3, null, [[0, 9]]);
      }));
      function generateQRCode(_x7) {
        return _generateQRCode.apply(this, arguments);
      }
      return generateQRCode;
    }() // Xử lý callback từ SePay
  }, {
    key: "verifySePayCallback",
    value: function verifySePayCallback(callbackData) {
      try {
        if (!callbackData) {
          return false;
        }

        // Xác thực thông tin callback từ SePay
        var resultCode = callbackData.resultCode,
          amount = callbackData.amount,
          orderId = callbackData.orderId,
          signature = callbackData.signature;

        // Kiểm tra các trường bắt buộc
        if (!orderId || !resultCode) {
          return false;
        }

        // Kiểm tra chữ ký nếu SePay cung cấp
        if (signature) {
          // Tạo chuỗi dữ liệu cần xác thực
          var dataToVerify = "".concat(orderId, "|").concat(amount, "|").concat(resultCode);

          // Tạo chữ ký dựa trên secret key SePay
          var expectedSignature = _crypto["default"].createHmac('sha256', process.env.SEPAY_API_TOKEN).update(dataToVerify).digest('hex');

          // So sánh chữ ký
          if (signature !== expectedSignature) {
            return false;
          }
        }

        // Nếu không có lỗi và kiểm tra chữ ký thành công, trả về true
        return true;
      } catch (error) {
        // Trong trường hợp có lỗi, trả về false
        return false;
      }
    }

    // Hàm hỗ trợ sắp xếp object
  }, {
    key: "sortObject",
    value: function sortObject(obj) {
      return Object.keys(obj).sort().reduce(function (result, key) {
        result[key] = obj[key];
        return result;
      }, {});
    }

    // Lưu lại lịch sử webhook
  }, {
    key: "logWebhook",
    value: function logWebhook(data) {
      try {
        // Nếu có order_id hoặc orderId, kiểm tra và cập nhật đơn hàng
        var orderId = data.order_id || data.orderId;
        if (orderId) {
          // Trong triển khai thực tế, bạn sẽ lưu webhook vào database
          // Ví dụ: Lưu vào bảng PaymentLogs, WebhookLogs...

          // Lưu trữ tạm thời vào bộ nhớ (chỉ cho phát triển)
          if (!global.webhookHistory) {
            global.webhookHistory = [];
          }
          global.webhookHistory.push({
            timestamp: new Date(),
            orderId: orderId,
            data: data
          });

          // Giới hạn số lượng webhook lưu trong bộ nhớ
          if (global.webhookHistory.length > 100) {
            global.webhookHistory.shift();
          }
        }
      } catch (error) {
        console.error("Error logging webhook:", error);
      }
    }

    // Tạo QR Code thanh toán ngân hàng sử dụng SePay
  }, {
    key: "generateBankQRCode",
    value: function generateBankQRCode(accountNumber, bankCode, amount, description) {
      try {
        // Validate input
        if (!accountNumber || !bankCode) {
          return null;
        }

        // Chuẩn hóa mã ngân hàng để đảm bảo tương thích với Napas 247
        var normalizedBankCode = this.normalizeBankCode(bankCode);

        // Trích xuất orderId từ description
        var orderId = '';
        if (description) {
          var idMatch = description.match(/([a-f0-9]{24})/i);
          if (idMatch && idMatch[1]) {
            orderId = idMatch[1];
          }
        }

        // Tạo nội dung chuyển khoản cực kỳ đơn giản - CHỈ CÓ ID
        // Bỏ qua "TT DH" và các text khác để đảm bảo không có vấn đề khi nhận diện
        var simpleDescription = orderId || description;

        // Tạo URL QR Code với định dạng tương thích Napas 247
        var qrUrl = "https://qr.sepay.vn/img?acc=".concat(accountNumber, "&bank=").concat(normalizedBankCode);

        // Thêm số tiền nếu có
        if (amount && amount > 0) {
          qrUrl += "&amount=".concat(amount);
        }

        // Thêm nội dung chuyển khoản - CHỈ LÀ ID không thêm bất kỳ prefix nào
        qrUrl += "&des=".concat(simpleDescription);
        return qrUrl;
      } catch (error) {
        console.error("Lỗi tạo QR code ngân hàng:", error);
        return null;
      }
    }

    // Hàm chuẩn hóa mã ngân hàng cho Napas 247
  }, {
    key: "normalizeBankCode",
    value: function normalizeBankCode(bankCode) {
      // Bảng ánh xạ mã ngân hàng thường gặp sang mã Napas 247
      var bankMapping = {
        'MBBank': 'MB',
        'Techcombank': 'TCB',
        'Vietcombank': 'VCB',
        'VietinBank': 'CTG',
        'BIDV': 'BIDV',
        'Agribank': 'AGR',
        'TPBank': 'TPB',
        'VPBank': 'VPB',
        'ACB': 'ACB',
        'OCB': 'OCB',
        'SHB': 'SHB'
      };

      // Kiểm tra nếu bankCode cần được ánh xạ
      if (bankMapping[bankCode]) {
        return bankMapping[bankCode];
      }

      // Nếu không tìm thấy trong bảng ánh xạ, trả về mã gốc
      return bankCode;
    }
  }]);
}();
var _default = exports["default"] = PaymentService;