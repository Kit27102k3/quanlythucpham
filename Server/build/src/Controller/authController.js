"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateSubscription = exports.updateUserAddress = exports.updateUser = exports.subscribeToPush = exports.setDefaultAddress = exports.resetPassword = exports.requestPasswordReset = exports.register = exports.refreshToken = exports.migrateAllLegacyAddresses = exports.logout = exports.login = exports.googleLogin = exports.getVapidPublicKey = exports.getUserProfile = exports.getUserAvatar = exports.getUserAddresses = exports.getAllUser = exports.facebookTokenLogin = exports.facebookLogin = exports.facebookCallback = exports.deleteUserAddress = exports.blockUser = exports.addUserAddress = void 0;
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _bcryptjs = _interopRequireDefault(require("bcryptjs"));
var _Register = _interopRequireDefault(require("../Model/Register.js"));
var _RefreshToken = _interopRequireDefault(require("../Model/RefreshToken.js"));
var _otpUntil = require("../utils/otp.until.js");
var _emailService = require("../Services/email.service.js");
var _adminModel = _interopRequireDefault(require("../Model/adminModel.js"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _googleAuthLibrary = require("google-auth-library");
var _axios = _interopRequireDefault(require("axios"));
var _webPush = _interopRequireDefault(require("web-push"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } /* eslint-disable no-undef */ /* eslint-disable no-unused-vars */
// Load environment variables
_dotenv["default"].config();

// Fallback secret keys in case environment variables aren't set
var JWT_SECRET_ACCESS = process.env.JWT_SECRET_ACCESS || "a5e2c2e7-bf3a-4aa1-b5e2-eab36d9db2ea";
var JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5d6f7e8c9d0a1b2";

// Google OAuth client
var googleClient = new _googleAuthLibrary.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
var register = exports.register = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(req, res) {
    var _req$body, email, phone, firstName, lastName, userName, password, address, userImage, existingEmail, existingUsername, hashedPassword, newUser, _refreshToken, accessToken;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _req$body = req.body, email = _req$body.email, phone = _req$body.phone, firstName = _req$body.firstName, lastName = _req$body.lastName, userName = _req$body.userName, password = _req$body.password, address = _req$body.address, userImage = _req$body.userImage; // Kiểm tra email đã tồn tại
          _context.next = 4;
          return _Register["default"].findOne({
            email: email
          });
        case 4:
          existingEmail = _context.sent;
          if (!existingEmail) {
            _context.next = 7;
            break;
          }
          return _context.abrupt("return", res.status(400).json({
            message: "Email đã được sử dụng"
          }));
        case 7:
          _context.next = 9;
          return _Register["default"].findOne({
            userName: userName
          });
        case 9:
          existingUsername = _context.sent;
          if (!existingUsername) {
            _context.next = 12;
            break;
          }
          return _context.abrupt("return", res.status(400).json({
            message: "Tên đăng nhập đã được sử dụng"
          }));
        case 12:
          _context.next = 14;
          return _bcryptjs["default"].hash(password, 10);
        case 14:
          hashedPassword = _context.sent;
          // Tạo user mới
          newUser = new _Register["default"]({
            email: email,
            phone: phone,
            firstName: firstName,
            lastName: lastName,
            userName: userName,
            password: hashedPassword,
            address: address,
            userImage: userImage
          }); // Lưu user vào database
          _context.next = 18;
          return newUser.save();
        case 18:
          // Tạo refresh token với secret key từ biến môi trường
          _refreshToken = _jsonwebtoken["default"].sign({
            id: newUser._id
          }, process.env.JWT_REFRESH_SECRET || "SECRET_REFRESH",
          // Fallback nếu không có biến môi trường
          {
            expiresIn: "7d"
          }); // Lưu refresh token vào database với thời gian hết hạn
          _context.next = 21;
          return _RefreshToken["default"].create({
            userId: newUser._id,
            userModel: "User",
            token: _refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 ngày
          });
        case 21:
          // Tạo access token cho người dùng mới
          accessToken = _jsonwebtoken["default"].sign({
            id: newUser._id,
            role: "user",
            permissions: ["Xem"]
          }, process.env.JWT_SECRET_ACCESS || "SECRET_ACCESS",
          // Fallback nếu không có biến môi trường
          {
            expiresIn: "1d"
          }); // Trả về thông tin đăng ký thành công
          res.status(201).json({
            success: true,
            message: "Đăng ký người dùng thành công",
            userId: newUser._id,
            accessToken: accessToken,
            refreshToken: _refreshToken,
            role: "user",
            permissions: ["Xem"],
            fullName: "".concat(newUser.firstName, " ").concat(newUser.lastName)
          });
          _context.next = 29;
          break;
        case 25:
          _context.prev = 25;
          _context.t0 = _context["catch"](0);
          console.error("Registration error:", _context.t0);
          res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi đăng ký người dùng",
            error: _context.t0.message
          });
        case 29:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 25]]);
  }));
  return function register(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();
var login = exports.login = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res) {
    var _req$body2, username, userName, user_name, password, usernameToUse, foundUser, isPasswordValid, accessToken, _refreshToken2;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _req$body2 = req.body, username = _req$body2.username, userName = _req$body2.userName, user_name = _req$body2.user_name, password = _req$body2.password; // Normalize username variants (database might have either username or userName)
          usernameToUse = username || userName || user_name;
          if (!(!usernameToUse || !password)) {
            _context2.next = 5;
            break;
          }
          return _context2.abrupt("return", res.status(400).json({
            success: false,
            message: "Vui lòng cung cấp tên người dùng và mật khẩu"
          }));
        case 5:
          _context2.next = 7;
          return _Register["default"].findOne({
            $or: [{
              userName: usernameToUse
            }, {
              username: usernameToUse
            }, {
              email: usernameToUse
            }]
          });
        case 7:
          foundUser = _context2.sent;
          if (foundUser) {
            _context2.next = 10;
            break;
          }
          return _context2.abrupt("return", res.status(404).json({
            success: false,
            message: "Người dùng không tồn tại"
          }));
        case 10:
          if (!foundUser.isBlocked) {
            _context2.next = 12;
            break;
          }
          return _context2.abrupt("return", res.status(403).json({
            success: false,
            message: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên."
          }));
        case 12:
          _context2.next = 14;
          return _bcryptjs["default"].compare(password, foundUser.password);
        case 14:
          isPasswordValid = _context2.sent;
          if (isPasswordValid) {
            _context2.next = 17;
            break;
          }
          return _context2.abrupt("return", res.status(401).json({
            success: false,
            message: "Mật khẩu không đúng"
          }));
        case 17:
          accessToken = _jsonwebtoken["default"].sign({
            id: foundUser._id,
            role: "user",
            permissions: ["Xem"]
          }, process.env.JWT_SECRET_ACCESS, {
            expiresIn: "1d"
          }); // Generate refresh token with extended expiry
          _refreshToken2 = _jsonwebtoken["default"].sign({
            id: foundUser._id
          }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: "7d"
          }); // Xóa refresh tokens cũ của user này trước khi tạo mới
          _context2.prev = 19;
          _context2.next = 22;
          return _RefreshToken["default"].deleteMany({
            userId: foundUser._id,
            userModel: "User"
          });
        case 22:
          _context2.next = 24;
          return _RefreshToken["default"].create({
            userId: foundUser._id,
            userModel: "User",
            token: _refreshToken2,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          });
        case 24:
          _context2.next = 29;
          break;
        case 26:
          _context2.prev = 26;
          _context2.t0 = _context2["catch"](19);
          console.error("Error managing refresh tokens:", _context2.t0);
          // Continue even if token storage fails
        case 29:
          // Update last login time
          foundUser.lastLogin = new Date();
          _context2.next = 32;
          return foundUser.save();
        case 32:
          return _context2.abrupt("return", res.status(200).json({
            success: true,
            message: "Đăng nhập thành công",
            token: accessToken,
            refreshToken: _refreshToken2,
            user: {
              id: foundUser._id,
              userName: foundUser.userName,
              email: foundUser.email,
              firstName: foundUser.firstName,
              lastName: foundUser.lastName,
              role: "user"
            }
          }));
        case 35:
          _context2.prev = 35;
          _context2.t1 = _context2["catch"](0);
          console.error("Login error:", _context2.t1);
          return _context2.abrupt("return", res.status(500).json({
            success: false,
            message: "Lỗi đăng nhập: " + _context2.t1.message
          }));
        case 39:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 35], [19, 26]]);
  }));
  return function login(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();
var refreshToken = exports.refreshToken = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(req, res) {
    var refreshToken, decoded, storedToken, user, newAccessToken;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          refreshToken = req.body.refreshToken;
          if (refreshToken) {
            _context3.next = 3;
            break;
          }
          return _context3.abrupt("return", res.status(401).json({
            message: "Refresh token is required"
          }));
        case 3:
          _context3.prev = 3;
          // Verify refresh token
          decoded = _jsonwebtoken["default"].verify(refreshToken, process.env.JWT_REFRESH_SECRET); // Check if refresh token exists in database
          _context3.next = 7;
          return _RefreshToken["default"].findOne({
            token: refreshToken,
            userId: decoded.id
          });
        case 7:
          storedToken = _context3.sent;
          if (storedToken) {
            _context3.next = 10;
            break;
          }
          return _context3.abrupt("return", res.status(403).json({
            message: "Invalid refresh token"
          }));
        case 10:
          _context3.next = 12;
          return _Register["default"].findById(decoded.id);
        case 12:
          _context3.t0 = _context3.sent;
          if (_context3.t0) {
            _context3.next = 17;
            break;
          }
          _context3.next = 16;
          return _adminModel["default"].findById(decoded.id);
        case 16:
          _context3.t0 = _context3.sent;
        case 17:
          user = _context3.t0;
          if (user) {
            _context3.next = 20;
            break;
          }
          return _context3.abrupt("return", res.status(404).json({
            message: "User not found"
          }));
        case 20:
          // Generate new access token
          newAccessToken = _jsonwebtoken["default"].sign({
            id: user._id,
            role: user.role,
            permissions: user.permissions || []
          }, process.env.JWT_SECRET_ACCESS, {
            expiresIn: "1h"
          });
          res.json({
            accessToken: newAccessToken
          });
          _context3.next = 31;
          break;
        case 24:
          _context3.prev = 24;
          _context3.t1 = _context3["catch"](3);
          if (!(_context3.t1.name === "TokenExpiredError")) {
            _context3.next = 30;
            break;
          }
          _context3.next = 29;
          return _RefreshToken["default"].findOneAndDelete({
            token: refreshToken
          });
        case 29:
          return _context3.abrupt("return", res.status(403).json({
            message: "Refresh token expired"
          }));
        case 30:
          return _context3.abrupt("return", res.status(403).json({
            message: "Invalid refresh token"
          }));
        case 31:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[3, 24]]);
  }));
  return function refreshToken(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();
var logout = exports.logout = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(req, res) {
    var _refreshToken3;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _refreshToken3 = req.body.refreshToken;
          if (_refreshToken3) {
            _context4.next = 4;
            break;
          }
          return _context4.abrupt("return", res.status(401).json({
            message: "No refresh token provided"
          }));
        case 4:
          _context4.next = 6;
          return _RefreshToken["default"].findOneAndDelete({
            token: _refreshToken3
          });
        case 6:
          res.status(200).json({
            message: "Logged out successfully"
          });
          _context4.next = 12;
          break;
        case 9:
          _context4.prev = 9;
          _context4.t0 = _context4["catch"](0);
          res.status(500).json({
            message: _context4.t0.message
          });
        case 12:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[0, 9]]);
  }));
  return function logout(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();

// Migrate single address to addresses array
var migrateLegacyAddress = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(user) {
    var newAddress;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          if (!((!user.addresses || user.addresses.length === 0) && user.address)) {
            _context5.next = 8;
            break;
          }
          console.log("Migrating legacy address for user: ".concat(user._id));

          // Create new address object from legacy fields
          newAddress = {
            fullAddress: user.fullAddress || user.address,
            houseNumber: user.houseNumber || '',
            ward: user.ward || '',
            district: user.district || '',
            province: user.province || '',
            coordinates: user.coordinates || {},
            isDefault: true,
            label: "Nhà",
            receiverName: "".concat(user.firstName, " ").concat(user.lastName),
            receiverPhone: user.phone
          }; // Add to addresses array
          user.addresses = [newAddress];
          _context5.next = 7;
          return user.save();
        case 7:
          console.log("Legacy address migrated successfully for user: ".concat(user._id));
        case 8:
          return _context5.abrupt("return", user);
        case 11:
          _context5.prev = 11;
          _context5.t0 = _context5["catch"](0);
          console.error("Error migrating legacy address:", _context5.t0);
          return _context5.abrupt("return", user);
        case 15:
        case "end":
          return _context5.stop();
      }
    }, _callee5, null, [[0, 11]]);
  }));
  return function migrateLegacyAddress(_x9) {
    return _ref5.apply(this, arguments);
  };
}();

// Add the migration logic to getUserProfile
var getUserProfile = exports.getUserProfile = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(req, res) {
    var userId, user;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          userId = req.params.id;
          _context6.next = 4;
          return _Register["default"].findById(userId).select("-password");
        case 4:
          user = _context6.sent;
          if (user) {
            _context6.next = 7;
            break;
          }
          return _context6.abrupt("return", res.status(404).json({
            message: "User not found"
          }));
        case 7:
          _context6.next = 9;
          return migrateLegacyAddress(user);
        case 9:
          user = _context6.sent;
          res.status(200).json(user);
          _context6.next = 16;
          break;
        case 13:
          _context6.prev = 13;
          _context6.t0 = _context6["catch"](0);
          res.status(500).json({
            message: _context6.t0.message
          });
        case 16:
        case "end":
          return _context6.stop();
      }
    }, _callee6, null, [[0, 13]]);
  }));
  return function getUserProfile(_x0, _x1) {
    return _ref6.apply(this, arguments);
  };
}();
var getAllUser = exports.getAllUser = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(req, res) {
    var user;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          _context7.next = 3;
          return _Register["default"].find();
        case 3:
          user = _context7.sent;
          res.status(200).json(user);
          _context7.next = 10;
          break;
        case 7:
          _context7.prev = 7;
          _context7.t0 = _context7["catch"](0);
          res.status(500).json({
            message: _context7.t0.message
          });
        case 10:
        case "end":
          return _context7.stop();
      }
    }, _callee7, null, [[0, 7]]);
  }));
  return function getAllUser(_x10, _x11) {
    return _ref7.apply(this, arguments);
  };
}();
var updateUser = exports.updateUser = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(req, res) {
    var userId, _req$body3, currentPassword, newPassword, firstName, lastName, phone, address, userImage, user, isMatch, salt;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          userId = req.params.userId;
          _req$body3 = req.body, currentPassword = _req$body3.currentPassword, newPassword = _req$body3.newPassword, firstName = _req$body3.firstName, lastName = _req$body3.lastName, phone = _req$body3.phone, address = _req$body3.address, userImage = _req$body3.userImage;
          console.log("Updating user profile:", userId);
          console.log("Request body:", req.body);
          _context8.next = 7;
          return _Register["default"].findById(userId);
        case 7:
          user = _context8.sent;
          if (user) {
            _context8.next = 10;
            break;
          }
          return _context8.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy người dùng"
          }));
        case 10:
          if (!newPassword) {
            _context8.next = 32;
            break;
          }
          if (currentPassword) {
            _context8.next = 13;
            break;
          }
          return _context8.abrupt("return", res.status(400).json({
            success: false,
            message: "Vui lòng cung cấp mật khẩu hiện tại"
          }));
        case 13:
          _context8.next = 15;
          return _bcryptjs["default"].compare(currentPassword, user.password);
        case 15:
          isMatch = _context8.sent;
          if (isMatch) {
            _context8.next = 18;
            break;
          }
          return _context8.abrupt("return", res.status(401).json({
            success: false,
            message: "Mật khẩu hiện tại không chính xác"
          }));
        case 18:
          if (!(newPassword.length < 8)) {
            _context8.next = 20;
            break;
          }
          return _context8.abrupt("return", res.status(400).json({
            success: false,
            message: "Mật khẩu mới phải có ít nhất 8 ký tự"
          }));
        case 20:
          if (/[A-Z]/.test(newPassword)) {
            _context8.next = 22;
            break;
          }
          return _context8.abrupt("return", res.status(400).json({
            success: false,
            message: "Mật khẩu mới cần ít nhất 1 chữ hoa"
          }));
        case 22:
          if (/[0-9]/.test(newPassword)) {
            _context8.next = 24;
            break;
          }
          return _context8.abrupt("return", res.status(400).json({
            success: false,
            message: "Mật khẩu mới cần ít nhất 1 chữ số"
          }));
        case 24:
          if (/[!@#$%^&*]/.test(newPassword)) {
            _context8.next = 26;
            break;
          }
          return _context8.abrupt("return", res.status(400).json({
            success: false,
            message: "Mật khẩu mới cần ít nhất 1 ký tự đặc biệt"
          }));
        case 26:
          _context8.next = 28;
          return _bcryptjs["default"].genSalt(10);
        case 28:
          salt = _context8.sent;
          _context8.next = 31;
          return _bcryptjs["default"].hash(newPassword, salt);
        case 31:
          user.password = _context8.sent;
        case 32:
          // Xử lý cập nhật thông tin cá nhân
          if (firstName !== undefined) user.firstName = firstName;
          if (lastName !== undefined) user.lastName = lastName;
          if (phone !== undefined) user.phone = phone;
          if (address !== undefined) {
            console.log("Updating address to:", address);
            user.address = address;
          }

          // Xử lý cập nhật avatar nếu có
          if (userImage !== undefined) {
            console.log("Updating user image to:", userImage);
            user.userImage = userImage;
          }
          _context8.next = 39;
          return user.save();
        case 39:
          console.log("User updated successfully:", user);

          // Trả về thông tin người dùng đã được cập nhật
          res.json({
            success: true,
            message: "Cập nhật thông tin thành công",
            user: {
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone,
              address: user.address,
              userImage: user.userImage
            }
          });
          _context8.next = 47;
          break;
        case 43:
          _context8.prev = 43;
          _context8.t0 = _context8["catch"](0);
          console.error("Error updating user:", _context8.t0);
          res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi cập nhật thông tin",
            error: _context8.t0.message
          });
        case 47:
        case "end":
          return _context8.stop();
      }
    }, _callee8, null, [[0, 43]]);
  }));
  return function updateUser(_x12, _x13) {
    return _ref8.apply(this, arguments);
  };
}();
var requestPasswordReset = exports.requestPasswordReset = /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee9(req, res) {
    var email, user, otp, otpExpires;
    return _regeneratorRuntime().wrap(function _callee9$(_context9) {
      while (1) switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          email = req.body.email;
          _context9.next = 4;
          return _Register["default"].findOne({
            email: email
          });
        case 4:
          user = _context9.sent;
          if (user) {
            _context9.next = 7;
            break;
          }
          return _context9.abrupt("return", res.status(404).json({
            success: false,
            message: "Email chưa được đăng ký trong hệ thống"
          }));
        case 7:
          otp = (0, _otpUntil.generateOTP)();
          otpExpires = new Date(Date.now() + 15 * 60 * 1000);
          user.resetPasswordToken = otp;
          user.resetPasswordExpires = otpExpires;
          _context9.next = 13;
          return user.save();
        case 13:
          _context9.next = 15;
          return (0, _emailService.sendOTPEmail)(email, otp);
        case 15:
          res.status(200).json({
            success: true,
            message: "Mã OTP đã được gửi đến email của bạn"
          });
          _context9.next = 22;
          break;
        case 18:
          _context9.prev = 18;
          _context9.t0 = _context9["catch"](0);
          console.error("Error in requestPasswordReset:", _context9.t0);
          res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xử lý yêu cầu"
          });
        case 22:
        case "end":
          return _context9.stop();
      }
    }, _callee9, null, [[0, 18]]);
  }));
  return function requestPasswordReset(_x14, _x15) {
    return _ref9.apply(this, arguments);
  };
}();
var resetPassword = exports.resetPassword = /*#__PURE__*/function () {
  var _ref0 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee0(req, res) {
    var _req$body4, email, otp, newPassword, user, salt;
    return _regeneratorRuntime().wrap(function _callee0$(_context0) {
      while (1) switch (_context0.prev = _context0.next) {
        case 0:
          _context0.prev = 0;
          _req$body4 = req.body, email = _req$body4.email, otp = _req$body4.otp, newPassword = _req$body4.newPassword;
          if (!(!email || !otp || !newPassword)) {
            _context0.next = 4;
            break;
          }
          return _context0.abrupt("return", res.status(400).json({
            success: false,
            message: "Thiếu thông tin cần thiết"
          }));
        case 4:
          _context0.next = 6;
          return _Register["default"].findOne({
            email: email,
            resetPasswordToken: otp,
            resetPasswordExpires: {
              $gt: Date.now()
            } // OTP còn hạn sử dụng
          });
        case 6:
          user = _context0.sent;
          if (user) {
            _context0.next = 9;
            break;
          }
          return _context0.abrupt("return", res.status(400).json({
            success: false,
            message: "Mã OTP không hợp lệ hoặc đã hết hạn"
          }));
        case 9:
          if (!(newPassword.length < 8)) {
            _context0.next = 11;
            break;
          }
          return _context0.abrupt("return", res.status(400).json({
            success: false,
            message: "Mật khẩu mới phải có ít nhất 8 ký tự"
          }));
        case 11:
          if (/[A-Z]/.test(newPassword)) {
            _context0.next = 13;
            break;
          }
          return _context0.abrupt("return", res.status(400).json({
            success: false,
            message: "Mật khẩu mới cần ít nhất 1 chữ hoa"
          }));
        case 13:
          if (/[0-9]/.test(newPassword)) {
            _context0.next = 15;
            break;
          }
          return _context0.abrupt("return", res.status(400).json({
            success: false,
            message: "Mật khẩu mới cần ít nhất 1 chữ số"
          }));
        case 15:
          if (/[!@#$%^&*]/.test(newPassword)) {
            _context0.next = 17;
            break;
          }
          return _context0.abrupt("return", res.status(400).json({
            success: false,
            message: "Mật khẩu mới cần ít nhất 1 ký tự đặc biệt"
          }));
        case 17:
          _context0.next = 19;
          return _bcryptjs["default"].genSalt(10);
        case 19:
          salt = _context0.sent;
          _context0.next = 22;
          return _bcryptjs["default"].hash(newPassword, salt);
        case 22:
          user.password = _context0.sent;
          // Xóa OTP sau khi sử dụng
          user.resetPasswordToken = null;
          user.resetPasswordExpires = null;
          _context0.next = 27;
          return user.save();
        case 27:
          return _context0.abrupt("return", res.status(200).json({
            success: true,
            message: "Đặt lại mật khẩu thành công"
          }));
        case 30:
          _context0.prev = 30;
          _context0.t0 = _context0["catch"](0);
          return _context0.abrupt("return", res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi đặt lại mật khẩu"
          }));
        case 33:
        case "end":
          return _context0.stop();
      }
    }, _callee0, null, [[0, 30]]);
  }));
  return function resetPassword(_x16, _x17) {
    return _ref0.apply(this, arguments);
  };
}();

// Xử lý chặn/bỏ chặn người dùng
var blockUser = exports.blockUser = /*#__PURE__*/function () {
  var _ref1 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee1(req, res) {
    var userId, isBlocked, user;
    return _regeneratorRuntime().wrap(function _callee1$(_context1) {
      while (1) switch (_context1.prev = _context1.next) {
        case 0:
          _context1.prev = 0;
          userId = req.params.userId;
          isBlocked = req.body.isBlocked;
          if (!(isBlocked === undefined)) {
            _context1.next = 5;
            break;
          }
          return _context1.abrupt("return", res.status(400).json({
            success: false,
            message: "Thiếu thông tin trạng thái chặn người dùng"
          }));
        case 5:
          _context1.next = 7;
          return _Register["default"].findById(userId);
        case 7:
          user = _context1.sent;
          if (user) {
            _context1.next = 10;
            break;
          }
          return _context1.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy người dùng"
          }));
        case 10:
          // Cập nhật trạng thái chặn
          user.isBlocked = isBlocked;
          _context1.next = 13;
          return user.save();
        case 13:
          res.status(200).json({
            success: true,
            message: isBlocked ? "Đã chặn người dùng thành công" : "Đã bỏ chặn người dùng thành công",
            user: {
              _id: user._id,
              isBlocked: user.isBlocked
            }
          });
          _context1.next = 19;
          break;
        case 16:
          _context1.prev = 16;
          _context1.t0 = _context1["catch"](0);
          res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xử lý yêu cầu"
          });
        case 19:
        case "end":
          return _context1.stop();
      }
    }, _callee1, null, [[0, 16]]);
  }));
  return function blockUser(_x18, _x19) {
    return _ref1.apply(this, arguments);
  };
}();

// Hàm đăng nhập bằng Facebook
var facebookLogin = exports.facebookLogin = /*#__PURE__*/function () {
  var _ref10 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee10(req, res) {
    var _req$body5, accessToken, userID, fbResponse, _fbResponse$data, id, email, first_name, last_name, picture, user, uniqueUsername, randomPassword, hashedPassword, profileImageUrl, token, _refreshToken4;
    return _regeneratorRuntime().wrap(function _callee10$(_context10) {
      while (1) switch (_context10.prev = _context10.next) {
        case 0:
          _context10.prev = 0;
          _req$body5 = req.body, accessToken = _req$body5.accessToken, userID = _req$body5.userID;
          if (!(!accessToken || !userID)) {
            _context10.next = 4;
            break;
          }
          return _context10.abrupt("return", res.status(400).json({
            success: false,
            message: "Thiếu thông tin xác thực từ Facebook"
          }));
        case 4:
          _context10.next = 6;
          return _axios["default"].get("https://graph.facebook.com/v18.0/".concat(userID), {
            params: {
              fields: 'id,email,first_name,last_name,picture',
              access_token: accessToken
            }
          });
        case 6:
          fbResponse = _context10.sent;
          if (!(!fbResponse.data || !fbResponse.data.id)) {
            _context10.next = 9;
            break;
          }
          return _context10.abrupt("return", res.status(401).json({
            success: false,
            message: "Không thể xác thực với Facebook"
          }));
        case 9:
          _fbResponse$data = fbResponse.data, id = _fbResponse$data.id, email = _fbResponse$data.email, first_name = _fbResponse$data.first_name, last_name = _fbResponse$data.last_name, picture = _fbResponse$data.picture; // Tìm user với FacebookID
          _context10.next = 12;
          return _Register["default"].findOne({
            facebookId: id
          });
        case 12:
          user = _context10.sent;
          if (!(!user && email)) {
            _context10.next = 22;
            break;
          }
          _context10.next = 16;
          return _Register["default"].findOne({
            email: email
          });
        case 16:
          user = _context10.sent;
          if (!user) {
            _context10.next = 22;
            break;
          }
          // Liên kết tài khoản đã tồn tại với Facebook
          user.facebookId = id;
          user.authProvider = 'facebook';
          _context10.next = 22;
          return user.save();
        case 22:
          if (user) {
            _context10.next = 32;
            break;
          }
          // Tạo username ngẫu nhiên nếu không có
          uniqueUsername = "fb_".concat(id, "_").concat(Date.now().toString().slice(-4)); // Tạo mật khẩu ngẫu nhiên
          randomPassword = Math.random().toString(36).slice(-10);
          _context10.next = 27;
          return _bcryptjs["default"].hash(randomPassword, 10);
        case 27:
          hashedPassword = _context10.sent;
          // Use default avatar instead of Facebook profile pic
          profileImageUrl = ''; // Don't store Facebook profile URL
          user = new _Register["default"]({
            email: email || "".concat(id, "@facebook.com"),
            phone: '0000000000',
            // Placeholder phone number
            firstName: first_name || 'Facebook',
            lastName: last_name || 'User',
            userName: uniqueUsername,
            password: hashedPassword,
            userImage: profileImageUrl,
            facebookId: id,
            authProvider: 'facebook'
          });
          _context10.next = 32;
          return user.save();
        case 32:
          if (!user.isBlocked) {
            _context10.next = 34;
            break;
          }
          return _context10.abrupt("return", res.status(403).json({
            success: false,
            message: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên."
          }));
        case 34:
          // Tạo tokens
          token = _jsonwebtoken["default"].sign({
            id: user._id,
            role: "user",
            permissions: ["Xem"]
          }, process.env.JWT_SECRET_ACCESS, {
            expiresIn: "1d"
          });
          _refreshToken4 = _jsonwebtoken["default"].sign({
            id: user._id
          }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: "7d"
          }); // Lưu refresh token
          _context10.next = 38;
          return _RefreshToken["default"].create({
            userId: user._id,
            userModel: "User",
            token: _refreshToken4,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          });
        case 38:
          // Cập nhật lastLogin
          user.lastLogin = new Date();
          _context10.next = 41;
          return user.save();
        case 41:
          // Gửi response
          res.status(200).json({
            success: true,
            token: token,
            refreshToken: _refreshToken4,
            user: {
              id: user._id,
              name: "".concat(user.firstName, " ").concat(user.lastName),
              email: user.email,
              role: "user",
              permissions: ["Xem"]
            },
            message: "Đăng nhập bằng Facebook thành công!"
          });
          _context10.next = 48;
          break;
        case 44:
          _context10.prev = 44;
          _context10.t0 = _context10["catch"](0);
          console.error("Facebook login error:", _context10.t0);
          res.status(500).json({
            success: false,
            message: "Đăng nhập bằng Facebook thất bại. Vui lòng thử lại."
          });
        case 48:
        case "end":
          return _context10.stop();
      }
    }, _callee10, null, [[0, 44]]);
  }));
  return function facebookLogin(_x20, _x21) {
    return _ref10.apply(this, arguments);
  };
}();

// Hàm đăng nhập bằng Google
var googleLogin = exports.googleLogin = /*#__PURE__*/function () {
  var _ref11 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee11(req, res) {
    var credential, ticket, payload, sub, email, given_name, family_name, picture, user, uniqueUsername, randomPassword, hashedPassword, token, _refreshToken5;
    return _regeneratorRuntime().wrap(function _callee11$(_context11) {
      while (1) switch (_context11.prev = _context11.next) {
        case 0:
          _context11.prev = 0;
          credential = req.body.credential;
          if (credential) {
            _context11.next = 4;
            break;
          }
          return _context11.abrupt("return", res.status(400).json({
            success: false,
            message: "Thiếu thông tin xác thực từ Google"
          }));
        case 4:
          console.log("Google login with clientID:", process.env.GOOGLE_CLIENT_ID);

          // Xác thực Google ID token
          _context11.prev = 5;
          _context11.next = 8;
          return googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
          });
        case 8:
          ticket = _context11.sent;
          payload = ticket.getPayload();
          console.log("Google payload verified successfully:", payload.sub);
          sub = payload.sub, email = payload.email, given_name = payload.given_name, family_name = payload.family_name, picture = payload.picture; // Tìm user với GoogleID
          _context11.next = 14;
          return _Register["default"].findOne({
            googleId: sub
          });
        case 14:
          user = _context11.sent;
          if (!(!user && email)) {
            _context11.next = 24;
            break;
          }
          _context11.next = 18;
          return _Register["default"].findOne({
            email: email
          });
        case 18:
          user = _context11.sent;
          if (!user) {
            _context11.next = 24;
            break;
          }
          // Liên kết tài khoản đã tồn tại với Google
          user.googleId = sub;
          user.authProvider = 'google';
          _context11.next = 24;
          return user.save();
        case 24:
          if (user) {
            _context11.next = 33;
            break;
          }
          // Tạo username ngẫu nhiên nếu không có
          uniqueUsername = "google_".concat(sub.slice(-8), "_").concat(Date.now().toString().slice(-4)); // Tạo mật khẩu ngẫu nhiên
          randomPassword = Math.random().toString(36).slice(-10);
          _context11.next = 29;
          return _bcryptjs["default"].hash(randomPassword, 10);
        case 29:
          hashedPassword = _context11.sent;
          user = new _Register["default"]({
            email: email,
            phone: '0000000000',
            // Placeholder phone number
            firstName: given_name || 'Google',
            lastName: family_name || 'User',
            userName: uniqueUsername,
            password: hashedPassword,
            userImage: picture || '',
            googleId: sub,
            authProvider: 'google'
          });
          _context11.next = 33;
          return user.save();
        case 33:
          if (!user.isBlocked) {
            _context11.next = 35;
            break;
          }
          return _context11.abrupt("return", res.status(403).json({
            success: false,
            message: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên."
          }));
        case 35:
          // Tạo tokens
          token = _jsonwebtoken["default"].sign({
            id: user._id,
            role: "user",
            permissions: ["Xem"]
          }, process.env.JWT_SECRET_ACCESS, {
            expiresIn: "1d"
          });
          _refreshToken5 = _jsonwebtoken["default"].sign({
            id: user._id
          }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: "7d"
          }); // Lưu refresh token
          _context11.next = 39;
          return _RefreshToken["default"].create({
            userId: user._id,
            userModel: "User",
            token: _refreshToken5,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          });
        case 39:
          // Cập nhật lastLogin
          user.lastLogin = new Date();
          _context11.next = 42;
          return user.save();
        case 42:
          // Gửi response
          res.status(200).json({
            success: true,
            token: token,
            refreshToken: _refreshToken5,
            user: {
              id: user._id,
              name: "".concat(user.firstName, " ").concat(user.lastName),
              email: user.email,
              role: "user",
              permissions: ["Xem"]
            },
            message: "Đăng nhập bằng Google thành công!"
          });
          _context11.next = 49;
          break;
        case 45:
          _context11.prev = 45;
          _context11.t0 = _context11["catch"](5);
          console.error("Google login error:", _context11.t0);
          res.status(500).json({
            success: false,
            message: "Đăng nhập bằng Google thất bại. Vui lòng thử lại."
          });
        case 49:
          _context11.next = 55;
          break;
        case 51:
          _context11.prev = 51;
          _context11.t1 = _context11["catch"](0);
          console.error("Google login error:", _context11.t1);
          res.status(500).json({
            success: false,
            message: "Đăng nhập bằng Google thất bại. Vui lòng thử lại."
          });
        case 55:
        case "end":
          return _context11.stop();
      }
    }, _callee11, null, [[0, 51], [5, 45]]);
  }));
  return function googleLogin(_x22, _x23) {
    return _ref11.apply(this, arguments);
  };
}();

// Hàm xử lý callback từ Facebook OAuth
var facebookCallback = exports.facebookCallback = /*#__PURE__*/function () {
  var _ref12 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee12(req, res) {
    var code, tokenResponse, accessToken, userDataResponse, _userDataResponse$dat, id, first_name, last_name, email, user, uniqueUsername, randomPassword, hashedPassword, profileImageUrl, token, _refreshToken6;
    return _regeneratorRuntime().wrap(function _callee12$(_context12) {
      while (1) switch (_context12.prev = _context12.next) {
        case 0:
          _context12.prev = 0;
          // Code from authentication callback
          code = req.query.code;
          if (code) {
            _context12.next = 4;
            break;
          }
          return _context12.abrupt("return", res.redirect('/dang-nhap?error=no_code'));
        case 4:
          _context12.next = 6;
          return _axios["default"].get('https://graph.facebook.com/oauth/access_token', {
            params: {
              client_id: process.env.FACEBOOK_APP_ID,
              client_secret: process.env.FACEBOOK_APP_SECRET,
              redirect_uri: process.env.FACEBOOK_CALLBACK_URL,
              code: code
            }
          });
        case 6:
          tokenResponse = _context12.sent;
          if (tokenResponse.data.access_token) {
            _context12.next = 9;
            break;
          }
          return _context12.abrupt("return", res.redirect('/dang-nhap?error=token_exchange_failed'));
        case 9:
          accessToken = tokenResponse.data.access_token; // Get user data with access token
          _context12.next = 12;
          return _axios["default"].get('https://graph.facebook.com/me', {
            params: {
              fields: 'id,first_name,last_name,email,picture',
              access_token: accessToken
            }
          });
        case 12:
          userDataResponse = _context12.sent;
          if (userDataResponse.data.id) {
            _context12.next = 15;
            break;
          }
          return _context12.abrupt("return", res.redirect('/dang-nhap?error=user_data_failed'));
        case 15:
          _userDataResponse$dat = userDataResponse.data, id = _userDataResponse$dat.id, first_name = _userDataResponse$dat.first_name, last_name = _userDataResponse$dat.last_name, email = _userDataResponse$dat.email; // Look for user with Facebook ID
          _context12.next = 18;
          return _Register["default"].findOne({
            facebookId: id
          });
        case 18:
          user = _context12.sent;
          if (!(!user && email)) {
            _context12.next = 27;
            break;
          }
          _context12.next = 22;
          return _Register["default"].findOne({
            email: email
          });
        case 22:
          user = _context12.sent;
          if (!user) {
            _context12.next = 27;
            break;
          }
          user.facebookId = id;
          _context12.next = 27;
          return user.save();
        case 27:
          if (user) {
            _context12.next = 37;
            break;
          }
          uniqueUsername = "fb_".concat(id, "_").concat(Date.now().toString().slice(-4));
          randomPassword = Math.random().toString(36).slice(-10);
          _context12.next = 32;
          return _bcryptjs["default"].hash(randomPassword, 10);
        case 32:
          hashedPassword = _context12.sent;
          // Use default avatar instead of Facebook image
          profileImageUrl = '';
          user = new _Register["default"]({
            email: "".concat(uniqueUsername, "@facebook.com"),
            phone: '0000000000',
            // Placeholder phone number
            firstName: first_name || 'Facebook',
            lastName: last_name || 'User',
            userName: uniqueUsername,
            password: hashedPassword,
            userImage: profileImageUrl,
            facebookId: id,
            authProvider: 'facebook'
          });
          _context12.next = 37;
          return user.save();
        case 37:
          if (!user.isBlocked) {
            _context12.next = 39;
            break;
          }
          return _context12.abrupt("return", res.redirect('/dang-nhap?error=account_blocked'));
        case 39:
          // Create tokens
          token = _jsonwebtoken["default"].sign({
            id: user._id,
            role: "user",
            permissions: ["Xem"]
          }, process.env.JWT_SECRET_ACCESS, {
            expiresIn: "1d"
          });
          _refreshToken6 = _jsonwebtoken["default"].sign({
            id: user._id
          }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: "7d"
          }); // Xóa refresh tokens cũ của user này trước khi tạo mới
          _context12.prev = 41;
          _context12.next = 44;
          return _RefreshToken["default"].deleteMany({
            userId: user._id,
            userModel: "User"
          });
        case 44:
          _context12.next = 46;
          return _RefreshToken["default"].create({
            userId: user._id,
            userModel: "User",
            token: _refreshToken6,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          });
        case 46:
          _context12.next = 51;
          break;
        case 48:
          _context12.prev = 48;
          _context12.t0 = _context12["catch"](41);
          console.error("Error managing refresh tokens:", _context12.t0);
          // Continue even if token storage fails
        case 51:
          // Update last login
          user.lastLogin = new Date();
          _context12.next = 54;
          return user.save();
        case 54:
          // Redirect with tokens as URL parameters
          res.redirect("/dang-nhap/success?token=".concat(token, "&refreshToken=").concat(_refreshToken6, "&userId=").concat(user._id, "&name=").concat(encodeURIComponent("".concat(user.firstName, " ").concat(user.lastName)), "&role=user"));
          _context12.next = 61;
          break;
        case 57:
          _context12.prev = 57;
          _context12.t1 = _context12["catch"](0);
          console.error("Facebook callback error:", _context12.t1);
          res.redirect('/dang-nhap?error=server_error');
        case 61:
        case "end":
          return _context12.stop();
      }
    }, _callee12, null, [[0, 57], [41, 48]]);
  }));
  return function facebookCallback(_x24, _x25) {
    return _ref12.apply(this, arguments);
  };
}();

// Hàm đăng nhập bằng Facebook token
var facebookTokenLogin = exports.facebookTokenLogin = /*#__PURE__*/function () {
  var _ref13 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee13(req, res) {
    var accessToken, fbResponse, _fbResponse$data2, id, first_name, last_name, email, picture, profileImageUrl, pictureResponse, user, uniqueUsername, randomPassword, hashedPassword, userEmail, token, _refreshToken7;
    return _regeneratorRuntime().wrap(function _callee13$(_context13) {
      while (1) switch (_context13.prev = _context13.next) {
        case 0:
          _context13.prev = 0;
          accessToken = req.body.accessToken;
          if (accessToken) {
            _context13.next = 4;
            break;
          }
          return _context13.abrupt("return", res.status(400).json({
            success: false,
            message: "Thiếu access token"
          }));
        case 4:
          _context13.next = 6;
          return _axios["default"].get("https://graph.facebook.com/v18.0/me", {
            params: {
              fields: 'id,first_name,last_name,email,picture{url,width,height,is_silhouette}',
              access_token: accessToken
            }
          });
        case 6:
          fbResponse = _context13.sent;
          if (!(!fbResponse.data || !fbResponse.data.id)) {
            _context13.next = 9;
            break;
          }
          return _context13.abrupt("return", res.status(401).json({
            success: false,
            message: "Không thể xác thực với Facebook"
          }));
        case 9:
          _fbResponse$data2 = fbResponse.data, id = _fbResponse$data2.id, first_name = _fbResponse$data2.first_name, last_name = _fbResponse$data2.last_name, email = _fbResponse$data2.email, picture = _fbResponse$data2.picture; // Log thông tin nhận được từ Facebook
          console.log("Facebook data received:", {
            id: id,
            first_name: first_name,
            last_name: last_name,
            email: email || "No email provided by Facebook",
            hasPicture: !!picture
          });

          // Lấy ảnh chất lượng cao hơn từ Facebook nếu có
          profileImageUrl = '';
          if (!(picture && picture.data && !picture.data.is_silhouette)) {
            _context13.next = 24;
            break;
          }
          _context13.prev = 13;
          _context13.next = 16;
          return _axios["default"].get("https://graph.facebook.com/v18.0/".concat(id, "/picture"), {
            params: {
              type: 'large',
              redirect: 'false',
              access_token: accessToken
            }
          });
        case 16:
          pictureResponse = _context13.sent;
          if (pictureResponse.data && pictureResponse.data.data && pictureResponse.data.data.url) {
            profileImageUrl = pictureResponse.data.data.url;
            console.log("Retrieved larger Facebook profile image:", profileImageUrl);
          }
          _context13.next = 24;
          break;
        case 20:
          _context13.prev = 20;
          _context13.t0 = _context13["catch"](13);
          console.error("Error fetching larger picture:", _context13.t0);
          // Fallback to original picture if available
          if (picture && picture.data && picture.data.url) {
            profileImageUrl = picture.data.url;
          }
        case 24:
          // Fallback to default avatar if no Facebook image
          if (!profileImageUrl) {
            profileImageUrl = 'https://www.gravatar.com/avatar/?d=mp&s=256';
          }

          // Tìm user với FacebookID
          _context13.next = 27;
          return _Register["default"].findOne({
            facebookId: id
          });
        case 27:
          user = _context13.sent;
          if (!(!user && email)) {
            _context13.next = 36;
            break;
          }
          _context13.next = 31;
          return _Register["default"].findOne({
            email: email
          });
        case 31:
          user = _context13.sent;
          if (!user) {
            _context13.next = 36;
            break;
          }
          user.facebookId = id;
          _context13.next = 36;
          return user.save();
        case 36:
          if (user) {
            _context13.next = 48;
            break;
          }
          // Tạo username ngẫu nhiên nếu không có
          uniqueUsername = "fb_".concat(id, "_").concat(Date.now().toString().slice(-4)); // Tạo mật khẩu ngẫu nhiên
          randomPassword = Math.random().toString(36).slice(-10);
          _context13.next = 41;
          return _bcryptjs["default"].hash(randomPassword, 10);
        case 41:
          hashedPassword = _context13.sent;
          // Tạo email giả nếu không có email từ Facebook
          userEmail = email || "".concat(uniqueUsername, "@facebook.user");
          user = new _Register["default"]({
            email: userEmail,
            phone: '0000000000',
            // Placeholder phone number
            firstName: first_name || 'Facebook',
            lastName: last_name || 'User',
            userName: uniqueUsername,
            password: hashedPassword,
            userImage: profileImageUrl,
            facebookId: id,
            authProvider: 'facebook'
          });
          _context13.next = 46;
          return user.save();
        case 46:
          _context13.next = 52;
          break;
        case 48:
          if (!(profileImageUrl && profileImageUrl !== 'https://www.gravatar.com/avatar/?d=mp&s=256')) {
            _context13.next = 52;
            break;
          }
          user.userImage = profileImageUrl;
          _context13.next = 52;
          return user.save();
        case 52:
          if (!user.isBlocked) {
            _context13.next = 54;
            break;
          }
          return _context13.abrupt("return", res.status(403).json({
            success: false,
            message: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên."
          }));
        case 54:
          // Tạo tokens
          token = _jsonwebtoken["default"].sign({
            id: user._id,
            role: "user",
            permissions: ["Xem"]
          }, process.env.JWT_SECRET_ACCESS, {
            expiresIn: "1d"
          });
          _refreshToken7 = _jsonwebtoken["default"].sign({
            id: user._id
          }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: "7d"
          }); // Xóa refresh tokens cũ của user này trước khi tạo mới
          _context13.prev = 56;
          _context13.next = 59;
          return _RefreshToken["default"].deleteMany({
            userId: user._id,
            userModel: "User"
          });
        case 59:
          _context13.next = 61;
          return _RefreshToken["default"].create({
            userId: user._id,
            userModel: "User",
            token: _refreshToken7,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          });
        case 61:
          _context13.next = 66;
          break;
        case 63:
          _context13.prev = 63;
          _context13.t1 = _context13["catch"](56);
          console.error("Error managing refresh tokens:", _context13.t1);
          // Continue even if token storage fails
        case 66:
          // Cập nhật lastLogin
          user.lastLogin = new Date();
          _context13.next = 69;
          return user.save();
        case 69:
          // Gửi response
          res.status(200).json({
            success: true,
            token: token,
            refreshToken: _refreshToken7,
            user: {
              id: user._id,
              name: "".concat(user.firstName, " ").concat(user.lastName),
              email: user.email,
              userImage: user.userImage,
              role: "user",
              permissions: ["Xem"]
            },
            message: "Đăng nhập bằng Facebook thành công!"
          });
          _context13.next = 76;
          break;
        case 72:
          _context13.prev = 72;
          _context13.t2 = _context13["catch"](0);
          console.error("Facebook token login error:", _context13.t2);
          res.status(500).json({
            success: false,
            message: "Đăng nhập bằng Facebook thất bại. Vui lòng thử lại."
          });
        case 76:
        case "end":
          return _context13.stop();
      }
    }, _callee13, null, [[0, 72], [13, 20], [56, 63]]);
  }));
  return function facebookTokenLogin(_x26, _x27) {
    return _ref13.apply(this, arguments);
  };
}();

// Endpoint to get user avatar
var getUserAvatar = exports.getUserAvatar = /*#__PURE__*/function () {
  var _ref14 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee14(req, res) {
    var userId, user, fbAvatarUrl;
    return _regeneratorRuntime().wrap(function _callee14$(_context14) {
      while (1) switch (_context14.prev = _context14.next) {
        case 0:
          _context14.prev = 0;
          userId = req.params.id;
          console.log("Fetching avatar for user ID:", userId);
          _context14.next = 5;
          return _Register["default"].findById(userId).select("userImage firstName lastName email authProvider facebookId");
        case 5:
          user = _context14.sent;
          if (user) {
            _context14.next = 9;
            break;
          }
          console.log("User not found for ID:", userId);
          return _context14.abrupt("return", res.json({
            userImage: 'https://www.gravatar.com/avatar/?d=mp&s=256'
          }));
        case 9:
          console.log("User found:", user.email, "- Image:", user.userImage);

          // Nếu người dùng đang sử dụng Facebook và không có ảnh đại diện
          if (!(user.authProvider === 'facebook' && (!user.userImage || user.userImage.includes('platform-lookaside.fbsbx.com')))) {
            _context14.next = 21;
            break;
          }
          if (!user.facebookId) {
            _context14.next = 20;
            break;
          }
          _context14.prev = 12;
          // Tạo một avatar tốt hơn cho người dùng Facebook
          fbAvatarUrl = "https://graph.facebook.com/".concat(user.facebookId, "/picture?type=large");
          return _context14.abrupt("return", res.json({
            userImage: fbAvatarUrl
          }));
        case 17:
          _context14.prev = 17;
          _context14.t0 = _context14["catch"](12);
          console.error("Error creating Facebook avatar URL:", _context14.t0);
        case 20:
          return _context14.abrupt("return", res.json({
            userImage: 'https://www.gravatar.com/avatar/?d=mp&s=256'
          }));
        case 21:
          if (!(user.userImage && (user.userImage.startsWith('http://') || user.userImage.startsWith('https://')))) {
            _context14.next = 24;
            break;
          }
          console.log("Returning external avatar URL:", user.userImage);
          return _context14.abrupt("return", res.json({
            userImage: user.userImage
          }));
        case 24:
          if (!user.userImage) {
            _context14.next = 27;
            break;
          }
          console.log("Serving local avatar");
          // You might need to adjust this depending on how your images are stored
          return _context14.abrupt("return", res.sendFile(user.userImage, {
            root: process.cwd()
          }));
        case 27:
          // If no image is found, return a default avatar
          console.log("No avatar found, using default");
          return _context14.abrupt("return", res.json({
            userImage: 'https://www.gravatar.com/avatar/?d=mp&s=256'
          }));
        case 31:
          _context14.prev = 31;
          _context14.t1 = _context14["catch"](0);
          console.error("Error fetching user avatar:", _context14.t1);
          return _context14.abrupt("return", res.json({
            userImage: 'https://www.gravatar.com/avatar/?d=mp&s=256'
          }));
        case 35:
        case "end":
          return _context14.stop();
      }
    }, _callee14, null, [[0, 31], [12, 17]]);
  }));
  return function getUserAvatar(_x28, _x29) {
    return _ref14.apply(this, arguments);
  };
}();

// New controller function to provide VAPID public key
var getVapidPublicKey = exports.getVapidPublicKey = function getVapidPublicKey(req, res) {
  try {
    console.log("[getVapidPublicKey] Đang lấy VAPID public key từ biến môi trường...");
    var vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    console.log("[getVapidPublicKey] VAPID_PUBLIC_KEY:", vapidPublicKey ? "Found" : "Not found");
    if (!vapidPublicKey) {
      console.error("[getVapidPublicKey] VAPID Public Key not configured in environment variables");
      return res.status(500).json({
        message: "VAPID Public Key not configured on server."
      });
    }

    // Log to confirm the key is valid (should be Base64 URL-safe encoded)
    var isValidBase64 = /^[A-Za-z0-9\-_]+=*$/.test(vapidPublicKey);
    console.log("[getVapidPublicKey] Key appears to be valid Base64:", isValidBase64);
    console.log("[getVapidPublicKey] Key length:", vapidPublicKey.length);
    console.log("[getVapidPublicKey] Returning VAPID public key to client");
    res.status(200).json({
      vapidPublicKey: vapidPublicKey
    });
  } catch (error) {
    console.error("[getVapidPublicKey] Error providing VAPID Public Key:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// Controller function to subscribe a user to push notifications
var subscribeToPush = exports.subscribeToPush = /*#__PURE__*/function () {
  var _ref15 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee15(req, res) {
    var subscription, userId, timeoutPromise, userPromise, user, existingSubscription, savePromise, testPayload, retries;
    return _regeneratorRuntime().wrap(function _callee15$(_context15) {
      while (1) switch (_context15.prev = _context15.next) {
        case 0:
          subscription = req.body;
          userId = req.user.id;
          console.log("[subscribeToPush] \u0110ang x\u1EED l\xFD y\xEAu c\u1EA7u \u0111\u0103ng k\xFD th\xF4ng b\xE1o cho user ".concat(userId));
          console.log("[subscribeToPush] D\u1EEF li\u1EC7u subscription:", JSON.stringify(subscription, null, 2));
          if (!(!subscription || !subscription.endpoint)) {
            _context15.next = 7;
            break;
          }
          console.error("[subscribeToPush] Missing or invalid subscription object");
          return _context15.abrupt("return", res.status(400).json({
            message: "Push subscription object is required."
          }));
        case 7:
          _context15.prev = 7;
          // Set timeout for MongoDB operations
          timeoutPromise = new Promise(function (_, reject) {
            return setTimeout(function () {
              return reject(new Error('Database operation timed out'));
            }, 5000);
          }); // Find user with timeout
          userPromise = _Register["default"].findById(userId);
          _context15.next = 12;
          return Promise.race([userPromise, timeoutPromise]);
        case 12:
          user = _context15.sent;
          if (user) {
            _context15.next = 16;
            break;
          }
          console.error("[subscribeToPush] User not found: ".concat(userId));
          return _context15.abrupt("return", res.status(404).json({
            message: "User not found."
          }));
        case 16:
          // Initialize pushSubscriptions array if not exists
          if (!user.pushSubscriptions) {
            console.log("[subscribeToPush] Initializing pushSubscriptions array for user: ".concat(userId));
            user.pushSubscriptions = [];
          }

          // Check for existing subscription
          existingSubscription = user.pushSubscriptions.find(function (sub) {
            return sub.endpoint === subscription.endpoint;
          });
          if (!existingSubscription) {
            _context15.next = 21;
            break;
          }
          console.log("[subscribeToPush] Subscription already exists for user: ".concat(userId));
          return _context15.abrupt("return", res.status(200).json({
            message: "Subscription already exists.",
            subscriptionCount: user.pushSubscriptions.length
          }));
        case 21:
          if (!(!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth)) {
            _context15.next = 24;
            break;
          }
          console.error("[subscribeToPush] Invalid subscription object, missing required keys");
          return _context15.abrupt("return", res.status(400).json({
            message: "Invalid subscription object. Missing required keys."
          }));
        case 24:
          // Add new subscription
          console.log("[subscribeToPush] Adding new subscription for user: ".concat(userId));
          user.pushSubscriptions.push(subscription);

          // Save with timeout
          savePromise = user.save();
          _context15.next = 29;
          return Promise.race([savePromise, timeoutPromise]);
        case 29:
          console.log("[subscribeToPush] Subscription saved successfully. Total subscriptions: ".concat(user.pushSubscriptions.length));

          // Send response immediately after saving
          res.status(201).json({
            message: "Push subscription saved successfully.",
            subscriptionCount: user.pushSubscriptions.length
          });

          // Send test notification asynchronously after response
          _context15.prev = 31;
          testPayload = {
            notification: {
              title: "Đăng ký thành công",
              body: "Bạn đã đăng ký nhận thông báo thành công!",
              icon: "/Logo.png",
              vibrate: [100, 50, 100],
              data: {
                url: "/",
                dateOfArrival: Date.now(),
                primaryKey: 1,
                type: "test_notification"
              }
            }
          }; // Add retry logic for sending notification
          retries = 3;
        case 34:
          if (!(retries > 0)) {
            _context15.next = 55;
            break;
          }
          _context15.prev = 35;
          console.log("[subscribeToPush] Sending test notification to new subscription (attempt ".concat(4 - retries, "/3)"));
          _context15.next = 39;
          return _webPush["default"].sendNotification(subscription, JSON.stringify(testPayload));
        case 39:
          console.log("[subscribeToPush] Test notification sent successfully");
          return _context15.abrupt("break", 55);
        case 43:
          _context15.prev = 43;
          _context15.t0 = _context15["catch"](35);
          retries--;
          if (!(retries === 0)) {
            _context15.next = 50;
            break;
          }
          console.error("[subscribeToPush] Failed to send test notification after 3 attempts:", _context15.t0);
          _context15.next = 53;
          break;
        case 50:
          console.log("[subscribeToPush] Retrying test notification...");
          _context15.next = 53;
          return new Promise(function (resolve) {
            return setTimeout(resolve, 1000);
          });
        case 53:
          _context15.next = 34;
          break;
        case 55:
          _context15.next = 60;
          break;
        case 57:
          _context15.prev = 57;
          _context15.t1 = _context15["catch"](31);
          console.error("[subscribeToPush] Error in test notification process:", _context15.t1);
          // Don't throw error since we already sent success response
        case 60:
          _context15.next = 66;
          break;
        case 62:
          _context15.prev = 62;
          _context15.t2 = _context15["catch"](7);
          console.error("[subscribeToPush] Error saving push subscription:", _context15.t2);
          res.status(500).json({
            message: "Internal server error while saving subscription",
            error: _context15.t2.message
          });
        case 66:
        case "end":
          return _context15.stop();
      }
    }, _callee15, null, [[7, 62], [31, 57], [35, 43]]);
  }));
  return function subscribeToPush(_x30, _x31) {
    return _ref15.apply(this, arguments);
  };
}();

// Validate Push Subscription
var validateSubscription = exports.validateSubscription = /*#__PURE__*/function () {
  var _ref16 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee16(req, res) {
    var subscription, _webpush, testPayload;
    return _regeneratorRuntime().wrap(function _callee16$(_context16) {
      while (1) switch (_context16.prev = _context16.next) {
        case 0:
          _context16.prev = 0;
          subscription = req.body.subscription;
          if (subscription) {
            _context16.next = 4;
            break;
          }
          return _context16.abrupt("return", res.status(400).json({
            success: false,
            message: "Subscription data is required"
          }));
        case 4:
          _webpush = require('web-push'); // Configure web-push with VAPID keys
          _webpush.setVapidDetails('mailto:daninc.system@gmail.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);

          // Send a small test notification payload
          testPayload = JSON.stringify({
            title: "Validation Test",
            body: "This is a test to validate your subscription",
            silent: true
          });
          _context16.prev = 7;
          _context16.next = 10;
          return _webpush.sendNotification(subscription, testPayload);
        case 10:
          return _context16.abrupt("return", res.status(200).json({
            success: true,
            valid: true,
            message: "Subscription is valid"
          }));
        case 13:
          _context16.prev = 13;
          _context16.t0 = _context16["catch"](7);
          console.log("Validation error:", _context16.t0);

          // Check for specific error status codes
          if (!(_context16.t0.statusCode === 404 || _context16.t0.statusCode === 410)) {
            _context16.next = 20;
            break;
          }
          return _context16.abrupt("return", res.status(200).json({
            success: true,
            valid: false,
            message: "Subscription has expired or is invalid",
            error: _context16.t0.body || _context16.t0.message
          }));
        case 20:
          if (!(_context16.t0.statusCode === 400)) {
            _context16.next = 24;
            break;
          }
          return _context16.abrupt("return", res.status(200).json({
            success: true,
            valid: false,
            message: "Invalid subscription format",
            error: _context16.t0.body || _context16.t0.message
          }));
        case 24:
          return _context16.abrupt("return", res.status(200).json({
            success: true,
            valid: false,
            message: "Error validating subscription",
            error: _context16.t0.body || _context16.t0.message
          }));
        case 25:
          _context16.next = 31;
          break;
        case 27:
          _context16.prev = 27;
          _context16.t1 = _context16["catch"](0);
          console.error("Validate subscription error:", _context16.t1);
          return _context16.abrupt("return", res.status(500).json({
            success: false,
            message: "Server error while validating subscription"
          }));
        case 31:
        case "end":
          return _context16.stop();
      }
    }, _callee16, null, [[0, 27], [7, 13]]);
  }));
  return function validateSubscription(_x32, _x33) {
    return _ref16.apply(this, arguments);
  };
}();

// Tạo/cập nhật địa chỉ mặc định đơn lẻ từ mảng địa chỉ cho tính tương thích ngược
var updateDefaultAddressForBackwardCompatibility = /*#__PURE__*/function () {
  var _ref17 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee17(userId) {
    var user, defaultAddress;
    return _regeneratorRuntime().wrap(function _callee17$(_context17) {
      while (1) switch (_context17.prev = _context17.next) {
        case 0:
          _context17.prev = 0;
          console.log("[updateDefaultAddressForBackwardCompatibility] Updating legacy address for user ".concat(userId));
          _context17.next = 4;
          return _Register["default"].findById(userId);
        case 4:
          user = _context17.sent;
          if (user) {
            _context17.next = 8;
            break;
          }
          console.log("[updateDefaultAddressForBackwardCompatibility] User not found: ".concat(userId));
          return _context17.abrupt("return");
        case 8:
          // Tìm địa chỉ mặc định trong mảng
          defaultAddress = user.addresses.find(function (addr) {
            return addr.isDefault === true;
          });
          if (!defaultAddress) {
            _context17.next = 25;
            break;
          }
          console.log("[updateDefaultAddressForBackwardCompatibility] Found default address: ".concat(defaultAddress.fullAddress));

          // Cập nhật trường address legacy - đảm bảo không phải undefined
          user.address = defaultAddress.fullAddress || '';

          // Cập nhật các trường riêng lẻ cho địa chỉ (nếu có)
          user.houseNumber = defaultAddress.houseNumber || '';
          user.ward = defaultAddress.ward || '';
          user.district = defaultAddress.district || '';
          user.province = defaultAddress.province || '';

          // Sao chép tọa độ nếu có
          if (defaultAddress.coordinates && defaultAddress.coordinates.lat && defaultAddress.coordinates.lng) {
            user.coordinates = {
              lat: defaultAddress.coordinates.lat,
              lng: defaultAddress.coordinates.lng
            };
          }

          // Đảm bảo fullAddress được cập nhật
          user.fullAddress = defaultAddress.fullAddress || '';

          // Đánh dấu là đã sửa đổi để đảm bảo mongoose cập nhật
          user.markModified('address');
          user.markModified('coordinates');
          _context17.next = 22;
          return user.save();
        case 22:
          console.log("[updateDefaultAddressForBackwardCompatibility] Updated legacy address fields for user ".concat(userId));
          _context17.next = 26;
          break;
        case 25:
          console.log("[updateDefaultAddressForBackwardCompatibility] No default address found for user ".concat(userId));
        case 26:
          _context17.next = 31;
          break;
        case 28:
          _context17.prev = 28;
          _context17.t0 = _context17["catch"](0);
          console.error("[updateDefaultAddressForBackwardCompatibility] Error updating legacy address:", _context17.t0);
        case 31:
        case "end":
          return _context17.stop();
      }
    }, _callee17, null, [[0, 28]]);
  }));
  return function updateDefaultAddressForBackwardCompatibility(_x34) {
    return _ref17.apply(this, arguments);
  };
}();

// Thêm địa chỉ mới
var addUserAddress = exports.addUserAddress = /*#__PURE__*/function () {
  var _ref18 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee18(req, res) {
    var userId, addressData, user;
    return _regeneratorRuntime().wrap(function _callee18$(_context18) {
      while (1) switch (_context18.prev = _context18.next) {
        case 0:
          _context18.prev = 0;
          userId = req.params.userId;
          addressData = req.body;
          if (addressData.fullAddress) {
            _context18.next = 5;
            break;
          }
          return _context18.abrupt("return", res.status(400).json({
            success: false,
            message: "Vui lòng cung cấp địa chỉ đầy đủ"
          }));
        case 5:
          _context18.next = 7;
          return _Register["default"].findById(userId);
        case 7:
          user = _context18.sent;
          if (user) {
            _context18.next = 10;
            break;
          }
          return _context18.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy người dùng"
          }));
        case 10:
          // Nếu đây là địa chỉ đầu tiên, đặt nó làm mặc định
          if (!user.addresses || user.addresses.length === 0) {
            addressData.isDefault = true;
          } else if (addressData.isDefault) {
            // Nếu địa chỉ mới là mặc định, cập nhật tất cả các địa chỉ khác thành không mặc định
            user.addresses.forEach(function (addr) {
              addr.isDefault = false;
            });
          }

          // Nếu không có thông tin người nhận, sử dụng thông tin người dùng
          if (!addressData.receiverName) {
            addressData.receiverName = "".concat(user.firstName, " ").concat(user.lastName);
          }
          if (!addressData.receiverPhone) {
            addressData.receiverPhone = user.phone;
          }

          // Thêm địa chỉ mới vào mảng
          user.addresses.push(addressData);

          // Nếu đây là địa chỉ mặc định, cập nhật trường address cũ
          if (!(addressData.isDefault || user.addresses.length === 1)) {
            _context18.next = 17;
            break;
          }
          _context18.next = 17;
          return updateDefaultAddressForBackwardCompatibility(userId);
        case 17:
          _context18.next = 19;
          return user.save();
        case 19:
          res.status(200).json({
            success: true,
            message: "Thêm địa chỉ thành công",
            addresses: user.addresses
          });
          _context18.next = 26;
          break;
        case 22:
          _context18.prev = 22;
          _context18.t0 = _context18["catch"](0);
          console.error("Lỗi khi thêm địa chỉ:", _context18.t0);
          res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi thêm địa chỉ",
            error: _context18.t0.message
          });
        case 26:
        case "end":
          return _context18.stop();
      }
    }, _callee18, null, [[0, 22]]);
  }));
  return function addUserAddress(_x35, _x36) {
    return _ref18.apply(this, arguments);
  };
}();

// Lấy tất cả địa chỉ của người dùng
var getUserAddresses = exports.getUserAddresses = /*#__PURE__*/function () {
  var _ref19 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee19(req, res) {
    var userId, user;
    return _regeneratorRuntime().wrap(function _callee19$(_context19) {
      while (1) switch (_context19.prev = _context19.next) {
        case 0:
          _context19.prev = 0;
          userId = req.params.userId;
          _context19.next = 4;
          return _Register["default"].findById(userId);
        case 4:
          user = _context19.sent;
          if (user) {
            _context19.next = 7;
            break;
          }
          return _context19.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy người dùng"
          }));
        case 7:
          _context19.next = 9;
          return migrateLegacyAddress(user);
        case 9:
          user = _context19.sent;
          res.status(200).json({
            success: true,
            addresses: user.addresses || []
          });
          _context19.next = 17;
          break;
        case 13:
          _context19.prev = 13;
          _context19.t0 = _context19["catch"](0);
          console.error("Lỗi khi lấy danh sách địa chỉ:", _context19.t0);
          res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy danh sách địa chỉ",
            error: _context19.t0.message
          });
        case 17:
        case "end":
          return _context19.stop();
      }
    }, _callee19, null, [[0, 13]]);
  }));
  return function getUserAddresses(_x37, _x38) {
    return _ref19.apply(this, arguments);
  };
}();

// Cập nhật địa chỉ
var updateUserAddress = exports.updateUserAddress = /*#__PURE__*/function () {
  var _ref20 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee20(req, res) {
    var _req$params, userId, addressId, updatedData, user, addressIndex;
    return _regeneratorRuntime().wrap(function _callee20$(_context20) {
      while (1) switch (_context20.prev = _context20.next) {
        case 0:
          _context20.prev = 0;
          _req$params = req.params, userId = _req$params.userId, addressId = _req$params.addressId;
          updatedData = req.body;
          _context20.next = 5;
          return _Register["default"].findById(userId);
        case 5:
          user = _context20.sent;
          if (user) {
            _context20.next = 8;
            break;
          }
          return _context20.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy người dùng"
          }));
        case 8:
          // Tìm địa chỉ cần cập nhật
          addressIndex = user.addresses.findIndex(function (addr) {
            return addr._id.toString() === addressId;
          });
          if (!(addressIndex === -1)) {
            _context20.next = 11;
            break;
          }
          return _context20.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy địa chỉ"
          }));
        case 11:
          // Kiểm tra nếu địa chỉ được cập nhật trở thành mặc định
          if (updatedData.isDefault) {
            // Cập nhật tất cả các địa chỉ khác thành không mặc định
            user.addresses.forEach(function (addr) {
              addr.isDefault = false;
            });
          }

          // Cập nhật địa chỉ
          Object.keys(updatedData).forEach(function (key) {
            user.addresses[addressIndex][key] = updatedData[key];
          });

          // Nếu đây là địa chỉ mặc định, cập nhật trường address cũ
          if (!updatedData.isDefault) {
            _context20.next = 16;
            break;
          }
          _context20.next = 16;
          return updateDefaultAddressForBackwardCompatibility(userId);
        case 16:
          _context20.next = 18;
          return user.save();
        case 18:
          res.status(200).json({
            success: true,
            message: "Cập nhật địa chỉ thành công",
            addresses: user.addresses
          });
          _context20.next = 25;
          break;
        case 21:
          _context20.prev = 21;
          _context20.t0 = _context20["catch"](0);
          console.error("Lỗi khi cập nhật địa chỉ:", _context20.t0);
          res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi cập nhật địa chỉ",
            error: _context20.t0.message
          });
        case 25:
        case "end":
          return _context20.stop();
      }
    }, _callee20, null, [[0, 21]]);
  }));
  return function updateUserAddress(_x39, _x40) {
    return _ref20.apply(this, arguments);
  };
}();

// Xóa địa chỉ
var deleteUserAddress = exports.deleteUserAddress = /*#__PURE__*/function () {
  var _ref21 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee21(req, res) {
    var _req$params2, userId, addressId, user, addressIndex, isDefault;
    return _regeneratorRuntime().wrap(function _callee21$(_context21) {
      while (1) switch (_context21.prev = _context21.next) {
        case 0:
          _context21.prev = 0;
          _req$params2 = req.params, userId = _req$params2.userId, addressId = _req$params2.addressId;
          _context21.next = 4;
          return _Register["default"].findById(userId);
        case 4:
          user = _context21.sent;
          if (user) {
            _context21.next = 7;
            break;
          }
          return _context21.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy người dùng"
          }));
        case 7:
          // Tìm địa chỉ cần xóa
          addressIndex = user.addresses.findIndex(function (addr) {
            return addr._id.toString() === addressId;
          });
          if (!(addressIndex === -1)) {
            _context21.next = 10;
            break;
          }
          return _context21.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy địa chỉ"
          }));
        case 10:
          // Kiểm tra nếu địa chỉ bị xóa là mặc định
          isDefault = user.addresses[addressIndex].isDefault; // Xóa địa chỉ khỏi mảng
          user.addresses.splice(addressIndex, 1);

          // Nếu địa chỉ bị xóa là mặc định và vẫn còn địa chỉ khác, đặt địa chỉ đầu tiên còn lại làm mặc định
          if (isDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
          }

          // Nếu đã thay đổi địa chỉ mặc định, cập nhật trường address cũ
          if (!(isDefault && user.addresses.length > 0)) {
            _context21.next = 16;
            break;
          }
          _context21.next = 16;
          return updateDefaultAddressForBackwardCompatibility(userId);
        case 16:
          _context21.next = 18;
          return user.save();
        case 18:
          res.status(200).json({
            success: true,
            message: "Xóa địa chỉ thành công",
            addresses: user.addresses
          });
          _context21.next = 25;
          break;
        case 21:
          _context21.prev = 21;
          _context21.t0 = _context21["catch"](0);
          console.error("Lỗi khi xóa địa chỉ:", _context21.t0);
          res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xóa địa chỉ",
            error: _context21.t0.message
          });
        case 25:
        case "end":
          return _context21.stop();
      }
    }, _callee21, null, [[0, 21]]);
  }));
  return function deleteUserAddress(_x41, _x42) {
    return _ref21.apply(this, arguments);
  };
}();

// Đặt địa chỉ mặc định
var setDefaultAddress = exports.setDefaultAddress = /*#__PURE__*/function () {
  var _ref22 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee22(req, res) {
    var _req$params3, userId, addressId, user, addressExists;
    return _regeneratorRuntime().wrap(function _callee22$(_context22) {
      while (1) switch (_context22.prev = _context22.next) {
        case 0:
          _context22.prev = 0;
          _req$params3 = req.params, userId = _req$params3.userId, addressId = _req$params3.addressId;
          console.log("[setDefaultAddress] Setting address ".concat(addressId, " as default for user ").concat(userId));
          _context22.next = 5;
          return _Register["default"].findById(userId);
        case 5:
          user = _context22.sent;
          if (user) {
            _context22.next = 9;
            break;
          }
          console.log("[setDefaultAddress] User not found: ".concat(userId));
          return _context22.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy người dùng"
          }));
        case 9:
          // Kiểm tra xem địa chỉ có tồn tại không
          addressExists = user.addresses.some(function (addr) {
            return addr._id.toString() === addressId;
          });
          if (addressExists) {
            _context22.next = 13;
            break;
          }
          console.log("[setDefaultAddress] Address not found: ".concat(addressId));
          return _context22.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy địa chỉ"
          }));
        case 13:
          // Đặt tất cả địa chỉ thành không mặc định, sau đó đặt địa chỉ được chọn thành mặc định
          user.addresses.forEach(function (addr) {
            var isSelected = addr._id.toString() === addressId;
            addr.isDefault = isSelected;
            if (isSelected) {
              console.log("[setDefaultAddress] Setting address as default: ".concat(addr.fullAddress));
            }
          });

          // Đánh dấu mảng addresses đã được sửa đổi để đảm bảo mongoose cập nhật
          user.markModified('addresses');

          // Lưu thay đổi trước khi cập nhật tương thích ngược
          _context22.next = 17;
          return user.save();
        case 17:
          _context22.next = 19;
          return updateDefaultAddressForBackwardCompatibility(userId);
        case 19:
          res.status(200).json({
            success: true,
            message: "Đặt địa chỉ mặc định thành công",
            addresses: user.addresses
          });
          _context22.next = 26;
          break;
        case 22:
          _context22.prev = 22;
          _context22.t0 = _context22["catch"](0);
          console.error("[setDefaultAddress] Error setting default address:", _context22.t0);
          res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi đặt địa chỉ mặc định",
            error: _context22.t0.message
          });
        case 26:
        case "end":
          return _context22.stop();
      }
    }, _callee22, null, [[0, 22]]);
  }));
  return function setDefaultAddress(_x43, _x44) {
    return _ref22.apply(this, arguments);
  };
}();

// Admin endpoint to migrate all legacy addresses
var migrateAllLegacyAddresses = exports.migrateAllLegacyAddresses = /*#__PURE__*/function () {
  var _ref23 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee23(req, res) {
    var users, migratedCount, skippedCount, errorCount, _iterator, _step, user;
    return _regeneratorRuntime().wrap(function _callee23$(_context23) {
      while (1) switch (_context23.prev = _context23.next) {
        case 0:
          _context23.prev = 0;
          if (!(!req.user || !req.user.role || req.user.role !== 'admin')) {
            _context23.next = 3;
            break;
          }
          return _context23.abrupt("return", res.status(403).json({
            success: false,
            message: "Không có quyền thực hiện chức năng này"
          }));
        case 3:
          _context23.next = 5;
          return _Register["default"].find({
            address: {
              $exists: true,
              $ne: ""
            },
            $or: [{
              addresses: {
                $exists: false
              }
            }, {
              addresses: {
                $size: 0
              }
            }]
          });
        case 5:
          users = _context23.sent;
          migratedCount = 0;
          skippedCount = 0;
          errorCount = 0; // Xử lý từng user
          _iterator = _createForOfIteratorHelper(users);
          _context23.prev = 10;
          _iterator.s();
        case 12:
          if ((_step = _iterator.n()).done) {
            _context23.next = 30;
            break;
          }
          user = _step.value;
          _context23.prev = 14;
          if (!(!user.addresses || user.addresses.length === 0)) {
            _context23.next = 21;
            break;
          }
          _context23.next = 18;
          return migrateLegacyAddress(user);
        case 18:
          migratedCount++;
          _context23.next = 22;
          break;
        case 21:
          skippedCount++;
        case 22:
          _context23.next = 28;
          break;
        case 24:
          _context23.prev = 24;
          _context23.t0 = _context23["catch"](14);
          console.error("Error migrating address for user ".concat(user._id, ":"), _context23.t0);
          errorCount++;
        case 28:
          _context23.next = 12;
          break;
        case 30:
          _context23.next = 35;
          break;
        case 32:
          _context23.prev = 32;
          _context23.t1 = _context23["catch"](10);
          _iterator.e(_context23.t1);
        case 35:
          _context23.prev = 35;
          _iterator.f();
          return _context23.finish(35);
        case 38:
          res.status(200).json({
            success: true,
            message: "\u0110\xE3 di chuy\u1EC3n ".concat(migratedCount, " \u0111\u1ECBa ch\u1EC9, b\u1ECF qua ").concat(skippedCount, ", l\u1ED7i ").concat(errorCount),
            total: users.length,
            migrated: migratedCount,
            skipped: skippedCount,
            errors: errorCount
          });
          _context23.next = 45;
          break;
        case 41:
          _context23.prev = 41;
          _context23.t2 = _context23["catch"](0);
          console.error("Lỗi khi di chuyển dữ liệu địa chỉ:", _context23.t2);
          res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi di chuyển dữ liệu địa chỉ",
            error: _context23.t2.message
          });
        case 45:
        case "end":
          return _context23.stop();
      }
    }, _callee23, null, [[0, 41], [10, 32, 35, 38], [14, 24]]);
  }));
  return function migrateAllLegacyAddresses(_x45, _x46) {
    return _ref23.apply(this, arguments);
  };
}();