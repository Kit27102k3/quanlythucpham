"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateUser = exports.subscribeToPush = exports.resetPassword = exports.requestPasswordReset = exports.register = exports.refreshToken = exports.logout = exports.login = exports.googleLogin = exports.getVapidPublicKey = exports.getUserProfile = exports.getUserAvatar = exports.getAllUser = exports.facebookTokenLogin = exports.facebookLogin = exports.facebookCallback = exports.blockUser = void 0;
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
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
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
var getUserProfile = exports.getUserProfile = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(req, res) {
    var userId, user;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          userId = req.params.id;
          _context5.next = 4;
          return _Register["default"].findById(userId).select("-password");
        case 4:
          user = _context5.sent;
          if (user) {
            _context5.next = 7;
            break;
          }
          return _context5.abrupt("return", res.status(404).json({
            message: "User not found"
          }));
        case 7:
          res.status(200).json(user);
          _context5.next = 13;
          break;
        case 10:
          _context5.prev = 10;
          _context5.t0 = _context5["catch"](0);
          res.status(500).json({
            message: _context5.t0.message
          });
        case 13:
        case "end":
          return _context5.stop();
      }
    }, _callee5, null, [[0, 10]]);
  }));
  return function getUserProfile(_x9, _x0) {
    return _ref5.apply(this, arguments);
  };
}();
var getAllUser = exports.getAllUser = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(req, res) {
    var user;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          _context6.next = 3;
          return _Register["default"].find();
        case 3:
          user = _context6.sent;
          res.status(200).json(user);
          _context6.next = 10;
          break;
        case 7:
          _context6.prev = 7;
          _context6.t0 = _context6["catch"](0);
          res.status(500).json({
            message: _context6.t0.message
          });
        case 10:
        case "end":
          return _context6.stop();
      }
    }, _callee6, null, [[0, 7]]);
  }));
  return function getAllUser(_x1, _x10) {
    return _ref6.apply(this, arguments);
  };
}();
var updateUser = exports.updateUser = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(req, res) {
    var userId, _req$body3, currentPassword, newPassword, firstName, lastName, phone, address, userImage, user, isMatch, salt;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          userId = req.params.userId;
          _req$body3 = req.body, currentPassword = _req$body3.currentPassword, newPassword = _req$body3.newPassword, firstName = _req$body3.firstName, lastName = _req$body3.lastName, phone = _req$body3.phone, address = _req$body3.address, userImage = _req$body3.userImage;
          console.log("Updating user profile:", userId);
          console.log("Request body:", req.body);
          _context7.next = 7;
          return _Register["default"].findById(userId);
        case 7:
          user = _context7.sent;
          if (user) {
            _context7.next = 10;
            break;
          }
          return _context7.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy người dùng"
          }));
        case 10:
          if (!newPassword) {
            _context7.next = 32;
            break;
          }
          if (currentPassword) {
            _context7.next = 13;
            break;
          }
          return _context7.abrupt("return", res.status(400).json({
            success: false,
            message: "Vui lòng cung cấp mật khẩu hiện tại"
          }));
        case 13:
          _context7.next = 15;
          return _bcryptjs["default"].compare(currentPassword, user.password);
        case 15:
          isMatch = _context7.sent;
          if (isMatch) {
            _context7.next = 18;
            break;
          }
          return _context7.abrupt("return", res.status(401).json({
            success: false,
            message: "Mật khẩu hiện tại không chính xác"
          }));
        case 18:
          if (!(newPassword.length < 8)) {
            _context7.next = 20;
            break;
          }
          return _context7.abrupt("return", res.status(400).json({
            success: false,
            message: "Mật khẩu mới phải có ít nhất 8 ký tự"
          }));
        case 20:
          if (/[A-Z]/.test(newPassword)) {
            _context7.next = 22;
            break;
          }
          return _context7.abrupt("return", res.status(400).json({
            success: false,
            message: "Mật khẩu mới cần ít nhất 1 chữ hoa"
          }));
        case 22:
          if (/[0-9]/.test(newPassword)) {
            _context7.next = 24;
            break;
          }
          return _context7.abrupt("return", res.status(400).json({
            success: false,
            message: "Mật khẩu mới cần ít nhất 1 chữ số"
          }));
        case 24:
          if (/[!@#$%^&*]/.test(newPassword)) {
            _context7.next = 26;
            break;
          }
          return _context7.abrupt("return", res.status(400).json({
            success: false,
            message: "Mật khẩu mới cần ít nhất 1 ký tự đặc biệt"
          }));
        case 26:
          _context7.next = 28;
          return _bcryptjs["default"].genSalt(10);
        case 28:
          salt = _context7.sent;
          _context7.next = 31;
          return _bcryptjs["default"].hash(newPassword, salt);
        case 31:
          user.password = _context7.sent;
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
          _context7.next = 39;
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
          _context7.next = 47;
          break;
        case 43:
          _context7.prev = 43;
          _context7.t0 = _context7["catch"](0);
          console.error("Error updating user:", _context7.t0);
          res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi cập nhật thông tin",
            error: _context7.t0.message
          });
        case 47:
        case "end":
          return _context7.stop();
      }
    }, _callee7, null, [[0, 43]]);
  }));
  return function updateUser(_x11, _x12) {
    return _ref7.apply(this, arguments);
  };
}();
var requestPasswordReset = exports.requestPasswordReset = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(req, res) {
    var email, user, otp, otpExpires;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          email = req.body.email;
          _context8.next = 4;
          return _Register["default"].findOne({
            email: email
          });
        case 4:
          user = _context8.sent;
          if (user) {
            _context8.next = 7;
            break;
          }
          return _context8.abrupt("return", res.status(404).json({
            success: false,
            message: "Email chưa được đăng ký trong hệ thống"
          }));
        case 7:
          otp = (0, _otpUntil.generateOTP)();
          otpExpires = new Date(Date.now() + 15 * 60 * 1000);
          user.resetPasswordToken = otp;
          user.resetPasswordExpires = otpExpires;
          _context8.next = 13;
          return user.save();
        case 13:
          _context8.next = 15;
          return (0, _emailService.sendOTPEmail)(email, otp);
        case 15:
          res.status(200).json({
            success: true,
            message: "Mã OTP đã được gửi đến email của bạn"
          });
          _context8.next = 22;
          break;
        case 18:
          _context8.prev = 18;
          _context8.t0 = _context8["catch"](0);
          console.error("Error in requestPasswordReset:", _context8.t0);
          res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xử lý yêu cầu"
          });
        case 22:
        case "end":
          return _context8.stop();
      }
    }, _callee8, null, [[0, 18]]);
  }));
  return function requestPasswordReset(_x13, _x14) {
    return _ref8.apply(this, arguments);
  };
}();
var resetPassword = exports.resetPassword = /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee9(req, res) {
    var _req$body4, email, otp, newPassword, user, salt;
    return _regeneratorRuntime().wrap(function _callee9$(_context9) {
      while (1) switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          _req$body4 = req.body, email = _req$body4.email, otp = _req$body4.otp, newPassword = _req$body4.newPassword;
          if (!(!email || !otp || !newPassword)) {
            _context9.next = 4;
            break;
          }
          return _context9.abrupt("return", res.status(400).json({
            success: false,
            message: "Thiếu thông tin cần thiết"
          }));
        case 4:
          _context9.next = 6;
          return _Register["default"].findOne({
            email: email,
            resetPasswordToken: otp,
            resetPasswordExpires: {
              $gt: Date.now()
            } // OTP còn hạn sử dụng
          });
        case 6:
          user = _context9.sent;
          if (user) {
            _context9.next = 9;
            break;
          }
          return _context9.abrupt("return", res.status(400).json({
            success: false,
            message: "Mã OTP không hợp lệ hoặc đã hết hạn"
          }));
        case 9:
          if (!(newPassword.length < 8)) {
            _context9.next = 11;
            break;
          }
          return _context9.abrupt("return", res.status(400).json({
            success: false,
            message: "Mật khẩu mới phải có ít nhất 8 ký tự"
          }));
        case 11:
          if (/[A-Z]/.test(newPassword)) {
            _context9.next = 13;
            break;
          }
          return _context9.abrupt("return", res.status(400).json({
            success: false,
            message: "Mật khẩu mới cần ít nhất 1 chữ hoa"
          }));
        case 13:
          if (/[0-9]/.test(newPassword)) {
            _context9.next = 15;
            break;
          }
          return _context9.abrupt("return", res.status(400).json({
            success: false,
            message: "Mật khẩu mới cần ít nhất 1 chữ số"
          }));
        case 15:
          if (/[!@#$%^&*]/.test(newPassword)) {
            _context9.next = 17;
            break;
          }
          return _context9.abrupt("return", res.status(400).json({
            success: false,
            message: "Mật khẩu mới cần ít nhất 1 ký tự đặc biệt"
          }));
        case 17:
          _context9.next = 19;
          return _bcryptjs["default"].genSalt(10);
        case 19:
          salt = _context9.sent;
          _context9.next = 22;
          return _bcryptjs["default"].hash(newPassword, salt);
        case 22:
          user.password = _context9.sent;
          // Xóa OTP sau khi sử dụng
          user.resetPasswordToken = null;
          user.resetPasswordExpires = null;
          _context9.next = 27;
          return user.save();
        case 27:
          return _context9.abrupt("return", res.status(200).json({
            success: true,
            message: "Đặt lại mật khẩu thành công"
          }));
        case 30:
          _context9.prev = 30;
          _context9.t0 = _context9["catch"](0);
          return _context9.abrupt("return", res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi đặt lại mật khẩu"
          }));
        case 33:
        case "end":
          return _context9.stop();
      }
    }, _callee9, null, [[0, 30]]);
  }));
  return function resetPassword(_x15, _x16) {
    return _ref9.apply(this, arguments);
  };
}();

// Xử lý chặn/bỏ chặn người dùng
var blockUser = exports.blockUser = /*#__PURE__*/function () {
  var _ref0 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee0(req, res) {
    var userId, isBlocked, user;
    return _regeneratorRuntime().wrap(function _callee0$(_context0) {
      while (1) switch (_context0.prev = _context0.next) {
        case 0:
          _context0.prev = 0;
          userId = req.params.userId;
          isBlocked = req.body.isBlocked;
          if (!(isBlocked === undefined)) {
            _context0.next = 5;
            break;
          }
          return _context0.abrupt("return", res.status(400).json({
            success: false,
            message: "Thiếu thông tin trạng thái chặn người dùng"
          }));
        case 5:
          _context0.next = 7;
          return _Register["default"].findById(userId);
        case 7:
          user = _context0.sent;
          if (user) {
            _context0.next = 10;
            break;
          }
          return _context0.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy người dùng"
          }));
        case 10:
          // Cập nhật trạng thái chặn
          user.isBlocked = isBlocked;
          _context0.next = 13;
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
          _context0.next = 19;
          break;
        case 16:
          _context0.prev = 16;
          _context0.t0 = _context0["catch"](0);
          res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xử lý yêu cầu"
          });
        case 19:
        case "end":
          return _context0.stop();
      }
    }, _callee0, null, [[0, 16]]);
  }));
  return function blockUser(_x17, _x18) {
    return _ref0.apply(this, arguments);
  };
}();

// Hàm đăng nhập bằng Facebook
var facebookLogin = exports.facebookLogin = /*#__PURE__*/function () {
  var _ref1 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee1(req, res) {
    var _req$body5, accessToken, userID, fbResponse, _fbResponse$data, id, email, first_name, last_name, picture, user, uniqueUsername, randomPassword, hashedPassword, profileImageUrl, token, _refreshToken4;
    return _regeneratorRuntime().wrap(function _callee1$(_context1) {
      while (1) switch (_context1.prev = _context1.next) {
        case 0:
          _context1.prev = 0;
          _req$body5 = req.body, accessToken = _req$body5.accessToken, userID = _req$body5.userID;
          if (!(!accessToken || !userID)) {
            _context1.next = 4;
            break;
          }
          return _context1.abrupt("return", res.status(400).json({
            success: false,
            message: "Thiếu thông tin xác thực từ Facebook"
          }));
        case 4:
          _context1.next = 6;
          return _axios["default"].get("https://graph.facebook.com/v18.0/".concat(userID), {
            params: {
              fields: 'id,email,first_name,last_name,picture',
              access_token: accessToken
            }
          });
        case 6:
          fbResponse = _context1.sent;
          if (!(!fbResponse.data || !fbResponse.data.id)) {
            _context1.next = 9;
            break;
          }
          return _context1.abrupt("return", res.status(401).json({
            success: false,
            message: "Không thể xác thực với Facebook"
          }));
        case 9:
          _fbResponse$data = fbResponse.data, id = _fbResponse$data.id, email = _fbResponse$data.email, first_name = _fbResponse$data.first_name, last_name = _fbResponse$data.last_name, picture = _fbResponse$data.picture; // Tìm user với FacebookID
          _context1.next = 12;
          return _Register["default"].findOne({
            facebookId: id
          });
        case 12:
          user = _context1.sent;
          if (!(!user && email)) {
            _context1.next = 22;
            break;
          }
          _context1.next = 16;
          return _Register["default"].findOne({
            email: email
          });
        case 16:
          user = _context1.sent;
          if (!user) {
            _context1.next = 22;
            break;
          }
          // Liên kết tài khoản đã tồn tại với Facebook
          user.facebookId = id;
          user.authProvider = 'facebook';
          _context1.next = 22;
          return user.save();
        case 22:
          if (user) {
            _context1.next = 32;
            break;
          }
          // Tạo username ngẫu nhiên nếu không có
          uniqueUsername = "fb_".concat(id, "_").concat(Date.now().toString().slice(-4)); // Tạo mật khẩu ngẫu nhiên
          randomPassword = Math.random().toString(36).slice(-10);
          _context1.next = 27;
          return _bcryptjs["default"].hash(randomPassword, 10);
        case 27:
          hashedPassword = _context1.sent;
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
          _context1.next = 32;
          return user.save();
        case 32:
          if (!user.isBlocked) {
            _context1.next = 34;
            break;
          }
          return _context1.abrupt("return", res.status(403).json({
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
          _context1.next = 38;
          return _RefreshToken["default"].create({
            userId: user._id,
            userModel: "User",
            token: _refreshToken4,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          });
        case 38:
          // Cập nhật lastLogin
          user.lastLogin = new Date();
          _context1.next = 41;
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
          _context1.next = 48;
          break;
        case 44:
          _context1.prev = 44;
          _context1.t0 = _context1["catch"](0);
          console.error("Facebook login error:", _context1.t0);
          res.status(500).json({
            success: false,
            message: "Đăng nhập bằng Facebook thất bại. Vui lòng thử lại."
          });
        case 48:
        case "end":
          return _context1.stop();
      }
    }, _callee1, null, [[0, 44]]);
  }));
  return function facebookLogin(_x19, _x20) {
    return _ref1.apply(this, arguments);
  };
}();

// Hàm đăng nhập bằng Google
var googleLogin = exports.googleLogin = /*#__PURE__*/function () {
  var _ref10 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee10(req, res) {
    var credential, ticket, payload, sub, email, given_name, family_name, picture, user, uniqueUsername, randomPassword, hashedPassword, token, _refreshToken5;
    return _regeneratorRuntime().wrap(function _callee10$(_context10) {
      while (1) switch (_context10.prev = _context10.next) {
        case 0:
          _context10.prev = 0;
          credential = req.body.credential;
          if (credential) {
            _context10.next = 4;
            break;
          }
          return _context10.abrupt("return", res.status(400).json({
            success: false,
            message: "Thiếu thông tin xác thực từ Google"
          }));
        case 4:
          console.log("Google login with clientID:", process.env.GOOGLE_CLIENT_ID);

          // Xác thực Google ID token
          _context10.prev = 5;
          _context10.next = 8;
          return googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
          });
        case 8:
          ticket = _context10.sent;
          payload = ticket.getPayload();
          console.log("Google payload verified successfully:", payload.sub);
          sub = payload.sub, email = payload.email, given_name = payload.given_name, family_name = payload.family_name, picture = payload.picture; // Tìm user với GoogleID
          _context10.next = 14;
          return _Register["default"].findOne({
            googleId: sub
          });
        case 14:
          user = _context10.sent;
          if (!(!user && email)) {
            _context10.next = 24;
            break;
          }
          _context10.next = 18;
          return _Register["default"].findOne({
            email: email
          });
        case 18:
          user = _context10.sent;
          if (!user) {
            _context10.next = 24;
            break;
          }
          // Liên kết tài khoản đã tồn tại với Google
          user.googleId = sub;
          user.authProvider = 'google';
          _context10.next = 24;
          return user.save();
        case 24:
          if (user) {
            _context10.next = 33;
            break;
          }
          // Tạo username ngẫu nhiên nếu không có
          uniqueUsername = "google_".concat(sub.slice(-8), "_").concat(Date.now().toString().slice(-4)); // Tạo mật khẩu ngẫu nhiên
          randomPassword = Math.random().toString(36).slice(-10);
          _context10.next = 29;
          return _bcryptjs["default"].hash(randomPassword, 10);
        case 29:
          hashedPassword = _context10.sent;
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
          _context10.next = 33;
          return user.save();
        case 33:
          if (!user.isBlocked) {
            _context10.next = 35;
            break;
          }
          return _context10.abrupt("return", res.status(403).json({
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
          _context10.next = 39;
          return _RefreshToken["default"].create({
            userId: user._id,
            userModel: "User",
            token: _refreshToken5,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          });
        case 39:
          // Cập nhật lastLogin
          user.lastLogin = new Date();
          _context10.next = 42;
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
          _context10.next = 49;
          break;
        case 45:
          _context10.prev = 45;
          _context10.t0 = _context10["catch"](5);
          console.error("Google login error:", _context10.t0);
          res.status(500).json({
            success: false,
            message: "Đăng nhập bằng Google thất bại. Vui lòng thử lại."
          });
        case 49:
          _context10.next = 55;
          break;
        case 51:
          _context10.prev = 51;
          _context10.t1 = _context10["catch"](0);
          console.error("Google login error:", _context10.t1);
          res.status(500).json({
            success: false,
            message: "Đăng nhập bằng Google thất bại. Vui lòng thử lại."
          });
        case 55:
        case "end":
          return _context10.stop();
      }
    }, _callee10, null, [[0, 51], [5, 45]]);
  }));
  return function googleLogin(_x21, _x22) {
    return _ref10.apply(this, arguments);
  };
}();

// Hàm xử lý callback từ Facebook OAuth
var facebookCallback = exports.facebookCallback = /*#__PURE__*/function () {
  var _ref11 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee11(req, res) {
    var code, tokenResponse, accessToken, userDataResponse, _userDataResponse$dat, id, first_name, last_name, email, user, uniqueUsername, randomPassword, hashedPassword, profileImageUrl, token, _refreshToken6;
    return _regeneratorRuntime().wrap(function _callee11$(_context11) {
      while (1) switch (_context11.prev = _context11.next) {
        case 0:
          _context11.prev = 0;
          // Code from authentication callback
          code = req.query.code;
          if (code) {
            _context11.next = 4;
            break;
          }
          return _context11.abrupt("return", res.redirect('/dang-nhap?error=no_code'));
        case 4:
          _context11.next = 6;
          return _axios["default"].get('https://graph.facebook.com/oauth/access_token', {
            params: {
              client_id: process.env.FACEBOOK_APP_ID,
              client_secret: process.env.FACEBOOK_APP_SECRET,
              redirect_uri: process.env.FACEBOOK_CALLBACK_URL,
              code: code
            }
          });
        case 6:
          tokenResponse = _context11.sent;
          if (tokenResponse.data.access_token) {
            _context11.next = 9;
            break;
          }
          return _context11.abrupt("return", res.redirect('/dang-nhap?error=token_exchange_failed'));
        case 9:
          accessToken = tokenResponse.data.access_token; // Get user data with access token
          _context11.next = 12;
          return _axios["default"].get('https://graph.facebook.com/me', {
            params: {
              fields: 'id,first_name,last_name,email,picture',
              access_token: accessToken
            }
          });
        case 12:
          userDataResponse = _context11.sent;
          if (userDataResponse.data.id) {
            _context11.next = 15;
            break;
          }
          return _context11.abrupt("return", res.redirect('/dang-nhap?error=user_data_failed'));
        case 15:
          _userDataResponse$dat = userDataResponse.data, id = _userDataResponse$dat.id, first_name = _userDataResponse$dat.first_name, last_name = _userDataResponse$dat.last_name, email = _userDataResponse$dat.email; // Look for user with Facebook ID
          _context11.next = 18;
          return _Register["default"].findOne({
            facebookId: id
          });
        case 18:
          user = _context11.sent;
          if (!(!user && email)) {
            _context11.next = 27;
            break;
          }
          _context11.next = 22;
          return _Register["default"].findOne({
            email: email
          });
        case 22:
          user = _context11.sent;
          if (!user) {
            _context11.next = 27;
            break;
          }
          user.facebookId = id;
          _context11.next = 27;
          return user.save();
        case 27:
          if (user) {
            _context11.next = 37;
            break;
          }
          uniqueUsername = "fb_".concat(id, "_").concat(Date.now().toString().slice(-4));
          randomPassword = Math.random().toString(36).slice(-10);
          _context11.next = 32;
          return _bcryptjs["default"].hash(randomPassword, 10);
        case 32:
          hashedPassword = _context11.sent;
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
          _context11.next = 37;
          return user.save();
        case 37:
          if (!user.isBlocked) {
            _context11.next = 39;
            break;
          }
          return _context11.abrupt("return", res.redirect('/dang-nhap?error=account_blocked'));
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
          _context11.prev = 41;
          _context11.next = 44;
          return _RefreshToken["default"].deleteMany({
            userId: user._id,
            userModel: "User"
          });
        case 44:
          _context11.next = 46;
          return _RefreshToken["default"].create({
            userId: user._id,
            userModel: "User",
            token: _refreshToken6,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          });
        case 46:
          _context11.next = 51;
          break;
        case 48:
          _context11.prev = 48;
          _context11.t0 = _context11["catch"](41);
          console.error("Error managing refresh tokens:", _context11.t0);
          // Continue even if token storage fails
        case 51:
          // Update last login
          user.lastLogin = new Date();
          _context11.next = 54;
          return user.save();
        case 54:
          // Redirect with tokens as URL parameters
          res.redirect("/dang-nhap/success?token=".concat(token, "&refreshToken=").concat(_refreshToken6, "&userId=").concat(user._id, "&name=").concat(encodeURIComponent("".concat(user.firstName, " ").concat(user.lastName)), "&role=user"));
          _context11.next = 61;
          break;
        case 57:
          _context11.prev = 57;
          _context11.t1 = _context11["catch"](0);
          console.error("Facebook callback error:", _context11.t1);
          res.redirect('/dang-nhap?error=server_error');
        case 61:
        case "end":
          return _context11.stop();
      }
    }, _callee11, null, [[0, 57], [41, 48]]);
  }));
  return function facebookCallback(_x23, _x24) {
    return _ref11.apply(this, arguments);
  };
}();

// Hàm đăng nhập bằng Facebook token
var facebookTokenLogin = exports.facebookTokenLogin = /*#__PURE__*/function () {
  var _ref12 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee12(req, res) {
    var accessToken, fbResponse, _fbResponse$data2, id, first_name, last_name, email, picture, profileImageUrl, pictureResponse, user, uniqueUsername, randomPassword, hashedPassword, userEmail, token, _refreshToken7;
    return _regeneratorRuntime().wrap(function _callee12$(_context12) {
      while (1) switch (_context12.prev = _context12.next) {
        case 0:
          _context12.prev = 0;
          accessToken = req.body.accessToken;
          if (accessToken) {
            _context12.next = 4;
            break;
          }
          return _context12.abrupt("return", res.status(400).json({
            success: false,
            message: "Thiếu access token"
          }));
        case 4:
          _context12.next = 6;
          return _axios["default"].get("https://graph.facebook.com/v18.0/me", {
            params: {
              fields: 'id,first_name,last_name,email,picture{url,width,height,is_silhouette}',
              access_token: accessToken
            }
          });
        case 6:
          fbResponse = _context12.sent;
          if (!(!fbResponse.data || !fbResponse.data.id)) {
            _context12.next = 9;
            break;
          }
          return _context12.abrupt("return", res.status(401).json({
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
            _context12.next = 24;
            break;
          }
          _context12.prev = 13;
          _context12.next = 16;
          return _axios["default"].get("https://graph.facebook.com/v18.0/".concat(id, "/picture"), {
            params: {
              type: 'large',
              redirect: 'false',
              access_token: accessToken
            }
          });
        case 16:
          pictureResponse = _context12.sent;
          if (pictureResponse.data && pictureResponse.data.data && pictureResponse.data.data.url) {
            profileImageUrl = pictureResponse.data.data.url;
            console.log("Retrieved larger Facebook profile image:", profileImageUrl);
          }
          _context12.next = 24;
          break;
        case 20:
          _context12.prev = 20;
          _context12.t0 = _context12["catch"](13);
          console.error("Error fetching larger picture:", _context12.t0);
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
          _context12.next = 27;
          return _Register["default"].findOne({
            facebookId: id
          });
        case 27:
          user = _context12.sent;
          if (!(!user && email)) {
            _context12.next = 36;
            break;
          }
          _context12.next = 31;
          return _Register["default"].findOne({
            email: email
          });
        case 31:
          user = _context12.sent;
          if (!user) {
            _context12.next = 36;
            break;
          }
          user.facebookId = id;
          _context12.next = 36;
          return user.save();
        case 36:
          if (user) {
            _context12.next = 48;
            break;
          }
          // Tạo username ngẫu nhiên nếu không có
          uniqueUsername = "fb_".concat(id, "_").concat(Date.now().toString().slice(-4)); // Tạo mật khẩu ngẫu nhiên
          randomPassword = Math.random().toString(36).slice(-10);
          _context12.next = 41;
          return _bcryptjs["default"].hash(randomPassword, 10);
        case 41:
          hashedPassword = _context12.sent;
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
          _context12.next = 46;
          return user.save();
        case 46:
          _context12.next = 52;
          break;
        case 48:
          if (!(profileImageUrl && profileImageUrl !== 'https://www.gravatar.com/avatar/?d=mp&s=256')) {
            _context12.next = 52;
            break;
          }
          user.userImage = profileImageUrl;
          _context12.next = 52;
          return user.save();
        case 52:
          if (!user.isBlocked) {
            _context12.next = 54;
            break;
          }
          return _context12.abrupt("return", res.status(403).json({
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
          _context12.prev = 56;
          _context12.next = 59;
          return _RefreshToken["default"].deleteMany({
            userId: user._id,
            userModel: "User"
          });
        case 59:
          _context12.next = 61;
          return _RefreshToken["default"].create({
            userId: user._id,
            userModel: "User",
            token: _refreshToken7,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          });
        case 61:
          _context12.next = 66;
          break;
        case 63:
          _context12.prev = 63;
          _context12.t1 = _context12["catch"](56);
          console.error("Error managing refresh tokens:", _context12.t1);
          // Continue even if token storage fails
        case 66:
          // Cập nhật lastLogin
          user.lastLogin = new Date();
          _context12.next = 69;
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
          _context12.next = 76;
          break;
        case 72:
          _context12.prev = 72;
          _context12.t2 = _context12["catch"](0);
          console.error("Facebook token login error:", _context12.t2);
          res.status(500).json({
            success: false,
            message: "Đăng nhập bằng Facebook thất bại. Vui lòng thử lại."
          });
        case 76:
        case "end":
          return _context12.stop();
      }
    }, _callee12, null, [[0, 72], [13, 20], [56, 63]]);
  }));
  return function facebookTokenLogin(_x25, _x26) {
    return _ref12.apply(this, arguments);
  };
}();

// Endpoint to get user avatar
var getUserAvatar = exports.getUserAvatar = /*#__PURE__*/function () {
  var _ref13 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee13(req, res) {
    var userId, user, fbAvatarUrl;
    return _regeneratorRuntime().wrap(function _callee13$(_context13) {
      while (1) switch (_context13.prev = _context13.next) {
        case 0:
          _context13.prev = 0;
          userId = req.params.id;
          console.log("Fetching avatar for user ID:", userId);
          _context13.next = 5;
          return _Register["default"].findById(userId).select("userImage firstName lastName email authProvider facebookId");
        case 5:
          user = _context13.sent;
          if (user) {
            _context13.next = 9;
            break;
          }
          console.log("User not found for ID:", userId);
          return _context13.abrupt("return", res.json({
            userImage: 'https://www.gravatar.com/avatar/?d=mp&s=256'
          }));
        case 9:
          console.log("User found:", user.email, "- Image:", user.userImage);

          // Nếu người dùng đang sử dụng Facebook và không có ảnh đại diện
          if (!(user.authProvider === 'facebook' && (!user.userImage || user.userImage.includes('platform-lookaside.fbsbx.com')))) {
            _context13.next = 21;
            break;
          }
          if (!user.facebookId) {
            _context13.next = 20;
            break;
          }
          _context13.prev = 12;
          // Tạo một avatar tốt hơn cho người dùng Facebook
          fbAvatarUrl = "https://graph.facebook.com/".concat(user.facebookId, "/picture?type=large");
          return _context13.abrupt("return", res.json({
            userImage: fbAvatarUrl
          }));
        case 17:
          _context13.prev = 17;
          _context13.t0 = _context13["catch"](12);
          console.error("Error creating Facebook avatar URL:", _context13.t0);
        case 20:
          return _context13.abrupt("return", res.json({
            userImage: 'https://www.gravatar.com/avatar/?d=mp&s=256'
          }));
        case 21:
          if (!(user.userImage && (user.userImage.startsWith('http://') || user.userImage.startsWith('https://')))) {
            _context13.next = 24;
            break;
          }
          console.log("Returning external avatar URL:", user.userImage);
          return _context13.abrupt("return", res.json({
            userImage: user.userImage
          }));
        case 24:
          if (!user.userImage) {
            _context13.next = 27;
            break;
          }
          console.log("Serving local avatar");
          // You might need to adjust this depending on how your images are stored
          return _context13.abrupt("return", res.sendFile(user.userImage, {
            root: process.cwd()
          }));
        case 27:
          // If no image is found, return a default avatar
          console.log("No avatar found, using default");
          return _context13.abrupt("return", res.json({
            userImage: 'https://www.gravatar.com/avatar/?d=mp&s=256'
          }));
        case 31:
          _context13.prev = 31;
          _context13.t1 = _context13["catch"](0);
          console.error("Error fetching user avatar:", _context13.t1);
          return _context13.abrupt("return", res.json({
            userImage: 'https://www.gravatar.com/avatar/?d=mp&s=256'
          }));
        case 35:
        case "end":
          return _context13.stop();
      }
    }, _callee13, null, [[0, 31], [12, 17]]);
  }));
  return function getUserAvatar(_x27, _x28) {
    return _ref13.apply(this, arguments);
  };
}();

// New controller function to provide VAPID public key
var getVapidPublicKey = exports.getVapidPublicKey = function getVapidPublicKey(req, res) {
  try {
    var vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      return res.status(500).json({
        message: "VAPID Public Key not configured on server."
      });
    }
    res.status(200).json({
      vapidPublicKey: vapidPublicKey
    });
  } catch (error) {
    console.error("Error providing VAPID Public Key:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// Controller function to subscribe a user to push notifications
var subscribeToPush = exports.subscribeToPush = /*#__PURE__*/function () {
  var _ref14 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee14(req, res) {
    var subscription, userId, user, existingSubscription;
    return _regeneratorRuntime().wrap(function _callee14$(_context14) {
      while (1) switch (_context14.prev = _context14.next) {
        case 0:
          subscription = req.body;
          userId = req.user.id; // Get user ID from the token (assuming verifyToken middleware is used)
          if (subscription) {
            _context14.next = 4;
            break;
          }
          return _context14.abrupt("return", res.status(400).json({
            message: "Push subscription object is required."
          }));
        case 4:
          _context14.prev = 4;
          _context14.next = 7;
          return _Register["default"].findById(userId);
        case 7:
          user = _context14.sent;
          if (user) {
            _context14.next = 10;
            break;
          }
          return _context14.abrupt("return", res.status(404).json({
            message: "User not found."
          }));
        case 10:
          // Check if this subscription already exists for the user
          existingSubscription = user.pushSubscriptions.find(function (sub) {
            return sub.endpoint === subscription.endpoint;
          });
          if (!existingSubscription) {
            _context14.next = 14;
            break;
          }
          console.log("Subscription already exists for this user.");
          return _context14.abrupt("return", res.status(200).json({
            message: "Subscription already exists."
          }));
        case 14:
          // Add the new subscription to the user's pushSubscriptions array
          user.pushSubscriptions.push(subscription);

          // Save the updated user document
          _context14.next = 17;
          return user.save();
        case 17:
          res.status(201).json({
            message: "Push subscription saved successfully."
          });
          _context14.next = 24;
          break;
        case 20:
          _context14.prev = 20;
          _context14.t0 = _context14["catch"](4);
          console.error("Error saving push subscription:", _context14.t0);
          res.status(500).json({
            message: "Internal server error while saving subscription",
            error: _context14.t0.message
          });
        case 24:
        case "end":
          return _context14.stop();
      }
    }, _callee14, null, [[4, 20]]);
  }));
  return function subscribeToPush(_x29, _x30) {
    return _ref14.apply(this, arguments);
  };
}();