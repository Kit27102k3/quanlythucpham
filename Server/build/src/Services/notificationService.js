"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sendReviewReplyNotification = exports.sendPushNotification = exports.sendOrderStatusNotification = exports.sendNotificationToUser = exports.sendNewProductNotification = exports.sendNewCouponNotification = exports.sendMessageNotification = void 0;
var _webPush = _interopRequireDefault(require("web-push"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _Register = _interopRequireDefault(require("../Model/Register.js"));
var _notificationModel = _interopRequireDefault(require("../Model/notificationModel.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } /* eslint-disable no-undef */ // Import User model
// import Admin from '../Model/adminModel.js'; // Import Admin model - commented out as not used yet
// Import Notification model

// Cấu hình dotenv
_dotenv["default"].config();

// Lấy VAPID keys từ biến môi trường
var vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
var vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
console.log('Kiểm tra VAPID keys:');
console.log('- Public key exists:', !!vapidPublicKey);
console.log('- Private key exists:', !!vapidPrivateKey);

// Configure web-push with VAPID keys
try {
  _webPush["default"].setVapidDetails('mailto:kit10012003@gmail.com',
  // Đảm bảo có tiền tố mailto:
  vapidPublicKey, vapidPrivateKey);
  console.log('✅ VAPID details set successfully');
} catch (error) {
  console.error('❌ Error setting VAPID details:', error);
}

// Function to send a push notification to a single subscription
var sendPushNotification = exports.sendPushNotification = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(userId, subscription, payload) {
    var _payload$data, _payload$data2, _payload$data3, notification, webPushPayload, _webpush, result;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          if (!(!subscription || !subscription.endpoint)) {
            _context.next = 4;
            break;
          }
          console.log("Subscription kh\xF4ng h\u1EE3p l\u1EC7 cho user ".concat(userId));
          return _context.abrupt("return", {
            success: false,
            message: 'Subscription không hợp lệ'
          });
        case 4:
          // Lưu thông báo vào DB trước khi gửi
          notification = new _notificationModel["default"]({
            userId: userId,
            title: payload.title,
            body: payload.body,
            data: payload.data,
            status: 'pending'
          });
          _context.next = 7;
          return notification.save();
        case 7:
          // Tạo payload với định dạng chi tiết hơn cho Web Push
          webPushPayload = {
            notification: {
              title: payload.title,
              body: payload.body,
              icon: ((_payload$data = payload.data) === null || _payload$data === void 0 ? void 0 : _payload$data.icon) || '/logo192.png',
              badge: '/badge-icon.png',
              vibrate: [100, 50, 100],
              tag: ((_payload$data2 = payload.data) === null || _payload$data2 === void 0 ? void 0 : _payload$data2.type) || 'general',
              actions: ((_payload$data3 = payload.data) === null || _payload$data3 === void 0 ? void 0 : _payload$data3.actions) || [{
                action: 'view',
                title: 'Xem ngay'
              }],
              data: _objectSpread(_objectSpread({}, payload.data), {}, {
                dateOfArrival: Date.now(),
                requireInteraction: true,
                renotify: true
              })
            }
          }; // Gửi thông báo với payload đã tăng cường
          _context.next = 10;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require('web-push'));
          });
        case 10:
          _webpush = _context.sent;
          _context.next = 13;
          return _webpush.sendNotification(subscription, JSON.stringify(webPushPayload));
        case 13:
          result = _context.sent;
          // Cập nhật trạng thái sau khi gửi
          notification.status = 'sent';
          _context.next = 17;
          return notification.save();
        case 17:
          return _context.abrupt("return", {
            success: true,
            result: result
          });
        case 20:
          _context.prev = 20;
          _context.t0 = _context["catch"](0);
          console.error("L\u1ED7i khi g\u1EEDi push notification cho user ".concat(userId, ":"), _context.t0.message);

          // Cập nhật thông báo là thất bại nhưng không dừng luồng xử lý
          _context.prev = 23;
          _context.next = 26;
          return _notificationModel["default"].findOneAndUpdate({
            userId: userId,
            title: payload.title,
            body: payload.body,
            status: 'pending'
          }, {
            status: 'failed',
            error: _context.t0.message
          });
        case 26:
          _context.next = 31;
          break;
        case 28:
          _context.prev = 28;
          _context.t1 = _context["catch"](23);
          console.error('Lỗi khi cập nhật trạng thái thông báo:', _context.t1);
        case 31:
          return _context.abrupt("return", {
            success: false,
            error: _context.t0.message
          });
        case 32:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 20], [23, 28]]);
  }));
  return function sendPushNotification(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

// Gửi thông báo cho một người dùng cụ thể (tất cả các thiết bị đã đăng ký)
var sendNotificationToUser = exports.sendNotificationToUser = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(userId, payload) {
    var user, notification, results, successCount;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          console.log("[sendNotificationToUser] B\u1EAFt \u0111\u1EA7u g\u1EEDi th\xF4ng b\xE1o cho user: ".concat(userId));
          console.log("[sendNotificationToUser] Tham s\u1ED1:", payload);
          _context3.next = 5;
          return _Register["default"].findById(userId);
        case 5:
          user = _context3.sent;
          if (user) {
            _context3.next = 9;
            break;
          }
          console.log("[sendNotificationToUser] Kh\xF4ng t\xECm th\u1EA5y user v\u1EDBi ID: ".concat(userId));
          return _context3.abrupt("return", {
            success: false,
            message: 'User không tồn tại'
          });
        case 9:
          if (!(!user.pushSubscriptions || user.pushSubscriptions.length === 0)) {
            _context3.next = 21;
            break;
          }
          console.log("[sendNotificationToUser] User ".concat(userId, " kh\xF4ng c\xF3 \u0111\u0103ng k\xFD push subscriptions n\xE0o"));

          // Vẫn lưu thông báo vào DB để hiển thị trong ứng dụng
          _context3.prev = 11;
          notification = new _notificationModel["default"]({
            userId: userId,
            title: payload.title,
            body: payload.body,
            data: payload.data,
            status: 'pending_view' // Trạng thái chờ xem trong ứng dụng
          });
          _context3.next = 15;
          return notification.save();
        case 15:
          _context3.next = 20;
          break;
        case 17:
          _context3.prev = 17;
          _context3.t0 = _context3["catch"](11);
          console.error('Lỗi khi lưu thông báo:', _context3.t0);
        case 20:
          return _context3.abrupt("return", {
            success: true,
            message: 'Đã lưu thông báo để hiển thị trong ứng dụng'
          });
        case 21:
          _context3.next = 23;
          return Promise.all(user.pushSubscriptions.map(/*#__PURE__*/function () {
            var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(subscription) {
              return _regeneratorRuntime().wrap(function _callee2$(_context2) {
                while (1) switch (_context2.prev = _context2.next) {
                  case 0:
                    _context2.prev = 0;
                    _context2.next = 3;
                    return sendPushNotification(userId, subscription, payload);
                  case 3:
                    return _context2.abrupt("return", _context2.sent);
                  case 6:
                    _context2.prev = 6;
                    _context2.t0 = _context2["catch"](0);
                    console.error("L\u1ED7i khi g\u1EEDi \u0111\u1EBFn subscription c\u1EE5 th\u1EC3:", _context2.t0);
                    return _context2.abrupt("return", {
                      success: false,
                      error: _context2.t0.message
                    });
                  case 10:
                  case "end":
                    return _context2.stop();
                }
              }, _callee2, null, [[0, 6]]);
            }));
            return function (_x6) {
              return _ref3.apply(this, arguments);
            };
          }()));
        case 23:
          results = _context3.sent;
          successCount = results.filter(function (r) {
            return r.success;
          }).length;
          return _context3.abrupt("return", {
            success: successCount > 0,
            message: "\u0110\xE3 g\u1EEDi th\xE0nh c\xF4ng \u0111\u1EBFn ".concat(successCount, "/").concat(user.pushSubscriptions.length, " thi\u1EBFt b\u1ECB")
          });
        case 28:
          _context3.prev = 28;
          _context3.t1 = _context3["catch"](0);
          console.error("[sendNotificationToUser] L\u1ED7i t\u1ED5ng th\u1EC3:", _context3.t1);
          return _context3.abrupt("return", {
            success: false,
            error: _context3.t1.message
          });
        case 32:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[0, 28], [11, 17]]);
  }));
  return function sendNotificationToUser(_x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}();

// Gửi thông báo khi có sản phẩm mới
var sendNewProductNotification = exports.sendNewProductNotification = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(product) {
    var users, title, body, notificationPromises;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _context4.next = 3;
          return _Register["default"].find({
            pushSubscriptions: {
              $exists: true,
              $not: {
                $size: 0
              }
            }
          });
        case 3:
          users = _context4.sent;
          if (!(!users || users.length === 0)) {
            _context4.next = 7;
            break;
          }
          console.log('No users with push subscriptions found');
          return _context4.abrupt("return");
        case 7:
          title = 'Sản phẩm mới!';
          body = "".concat(product.productName, " \u0111\xE3 \u0111\u01B0\u1EE3c th\xEAm v\xE0o c\u1EEDa h\xE0ng. Gi\xE1: ").concat(product.productPrice, "\u0111");
          notificationPromises = users.map(function (user) {
            return sendNotificationToUser(user._id, {
              title: title,
              body: body,
              data: {
                url: "/san-pham/".concat(product._id),
                productId: product._id,
                type: 'new_product'
              }
            });
          });
          _context4.next = 12;
          return Promise.allSettled(notificationPromises);
        case 12:
          console.log("Sent new product notifications to ".concat(users.length, " users"));
          return _context4.abrupt("return", true);
        case 16:
          _context4.prev = 16;
          _context4.t0 = _context4["catch"](0);
          console.error('Error sending new product notifications:', _context4.t0);
          return _context4.abrupt("return", false);
        case 20:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[0, 16]]);
  }));
  return function sendNewProductNotification(_x7) {
    return _ref4.apply(this, arguments);
  };
}();

// Gửi thông báo khi có coupon mới
var sendNewCouponNotification = exports.sendNewCouponNotification = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(coupon) {
    var users, title, body, notificationPromises;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          _context5.next = 3;
          return _Register["default"].find({
            pushSubscriptions: {
              $exists: true,
              $not: {
                $size: 0
              }
            }
          });
        case 3:
          users = _context5.sent;
          if (!(!users || users.length === 0)) {
            _context5.next = 7;
            break;
          }
          console.log('No users with push subscriptions found');
          return _context5.abrupt("return");
        case 7:
          title = 'Mã giảm giá mới!';
          body = "S\u1EED d\u1EE5ng m\xE3 ".concat(coupon.code, " \u0111\u1EC3 \u0111\u01B0\u1EE3c gi\u1EA3m ").concat(coupon.type === 'percentage' ? "".concat(coupon.value, "%") : "".concat(coupon.value, "\u0111"));
          notificationPromises = users.map(function (user) {
            return sendNotificationToUser(user._id, {
              title: title,
              body: body,
              data: {
                url: "/voucher",
                couponCode: coupon.code,
                type: 'new_coupon'
              }
            });
          });
          _context5.next = 12;
          return Promise.allSettled(notificationPromises);
        case 12:
          console.log("Sent new coupon notifications to ".concat(users.length, " users"));
          return _context5.abrupt("return", true);
        case 16:
          _context5.prev = 16;
          _context5.t0 = _context5["catch"](0);
          console.error('Error sending new coupon notifications:', _context5.t0);
          return _context5.abrupt("return", false);
        case 20:
        case "end":
          return _context5.stop();
      }
    }, _callee5, null, [[0, 16]]);
  }));
  return function sendNewCouponNotification(_x8) {
    return _ref5.apply(this, arguments);
  };
}();

// Gửi thông báo khi có phản hồi đánh giá
var sendReviewReplyNotification = exports.sendReviewReplyNotification = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(userId, review, replyText) {
    var title, body;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          console.log("[sendReviewReplyNotification] G\u1EEDi th\xF4ng b\xE1o ph\u1EA3n h\u1ED3i \u0111\xE1nh gi\xE1 cho user ".concat(userId));
          title = "Ph\u1EA3n h\u1ED3i \u0111\xE1nh gi\xE1 s\u1EA3n ph\u1EA9m";
          body = "Admin: \"".concat(replyText.substring(0, 120)).concat(replyText.length > 120 ? '...' : '', "\""); // Thêm chi tiết trong payload
          _context6.next = 6;
          return sendNotificationToUser(userId, {
            title: title,
            body: body,
            data: {
              url: "/product/".concat(review.productId),
              reviewId: review._id,
              type: 'review_reply',
              productName: review.productName,
              replyContent: replyText,
              icon: '/review-icon.png'
            }
          });
        case 6:
          return _context6.abrupt("return", _context6.sent);
        case 9:
          _context6.prev = 9;
          _context6.t0 = _context6["catch"](0);
          console.error('[sendReviewReplyNotification] Lỗi:', _context6.t0);
          return _context6.abrupt("return", {
            success: false,
            error: _context6.t0.message
          });
        case 13:
        case "end":
          return _context6.stop();
      }
    }, _callee6, null, [[0, 9]]);
  }));
  return function sendReviewReplyNotification(_x9, _x0, _x1) {
    return _ref6.apply(this, arguments);
  };
}();

// Gửi thông báo cập nhật trạng thái đơn hàng
var sendOrderStatusNotification = exports.sendOrderStatusNotification = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(userId, order, statusText) {
    var _order$items, title, body;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          console.log("[sendOrderStatusNotification] G\u1EEDi th\xF4ng b\xE1o \u0111\u01A1n h\xE0ng ".concat(order._id, " cho user ").concat(userId));
          title = "C\u1EADp nh\u1EADt \u0111\u01A1n h\xE0ng #".concat(order.orderNumber || order._id.toString().substring(0, 8));
          body = "\u0110\u01A1n h\xE0ng c\u1EE7a b\u1EA1n ".concat(statusText);
          if (order.totalAmount) {
            body += " - Gi\xE1 tr\u1ECB: ".concat(new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(order.totalAmount));
          }

          // Thêm chi tiết trong payload
          _context7.next = 7;
          return sendNotificationToUser(userId, {
            title: title,
            body: body,
            data: {
              url: "/tai-khoan/don-hang/".concat(order._id),
              orderId: order._id,
              type: 'order_update',
              status: order.status,
              orderItems: (_order$items = order.items) === null || _order$items === void 0 ? void 0 : _order$items.map(function (item) {
                return {
                  name: item.productName,
                  quantity: item.quantity
                };
              }),
              icon: '/order-icon.png'
            }
          });
        case 7:
          return _context7.abrupt("return", _context7.sent);
        case 10:
          _context7.prev = 10;
          _context7.t0 = _context7["catch"](0);
          console.error('[sendOrderStatusNotification] Lỗi:', _context7.t0);
          return _context7.abrupt("return", {
            success: false,
            error: _context7.t0.message
          });
        case 14:
        case "end":
          return _context7.stop();
      }
    }, _callee7, null, [[0, 10]]);
  }));
  return function sendOrderStatusNotification(_x10, _x11, _x12) {
    return _ref7.apply(this, arguments);
  };
}();

// Gửi thông báo khi có tin nhắn mới
var sendMessageNotification = exports.sendMessageNotification = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(userId, senderName, messageText) {
    var title, body;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          console.log("[sendMessageNotification] G\u1EEDi th\xF4ng b\xE1o tin nh\u1EAFn t\u1EEB ".concat(senderName, " \u0111\u1EBFn user ").concat(userId));
          title = "Tin nh\u1EAFn m\u1EDBi t\u1EEB ".concat(senderName);
          body = messageText.length > 100 ? "".concat(messageText.substring(0, 100), "...") : messageText; // Thêm chi tiết trong payload
          _context8.next = 6;
          return sendNotificationToUser(userId, {
            title: title,
            body: body,
            data: {
              url: '/tai-khoan/tin-nhan',
              type: 'new_message',
              senderId: senderName,
              messageContent: messageText,
              icon: '/chat-icon.png',
              actions: [{
                action: 'reply',
                title: 'Trả lời'
              }, {
                action: 'view',
                title: 'Xem tất cả'
              }]
            }
          });
        case 6:
          return _context8.abrupt("return", _context8.sent);
        case 9:
          _context8.prev = 9;
          _context8.t0 = _context8["catch"](0);
          console.error('[sendMessageNotification] Lỗi:', _context8.t0);
          return _context8.abrupt("return", {
            success: false,
            error: _context8.t0.message
          });
        case 13:
        case "end":
          return _context8.stop();
      }
    }, _callee8, null, [[0, 9]]);
  }));
  return function sendMessageNotification(_x13, _x14, _x15) {
    return _ref8.apply(this, arguments);
  };
}();