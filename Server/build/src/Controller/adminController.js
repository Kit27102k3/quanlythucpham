"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateRolePermissions = exports.updateAdmin = exports.getAllAdmins = exports.getAdminProfile = exports.getAdminById = exports.deleteAdmin = exports.createAdmin = exports.adminLogin = void 0;
var _adminModel = _interopRequireDefault(require("../Model/adminModel.js"));
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _bcryptjs = _interopRequireDefault(require("bcryptjs"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } // File: adminAuthController.js
var adminLogin = exports.adminLogin = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(req, res) {
    var _req$body, userName, password, admin, isMatch, accessToken, refreshToken;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _req$body = req.body, userName = _req$body.userName, password = _req$body.password; // Kiểm tra admin tồn tại
          _context.next = 4;
          return _adminModel["default"].findOne({
            userName: userName
          });
        case 4:
          admin = _context.sent;
          if (admin) {
            _context.next = 7;
            break;
          }
          return _context.abrupt("return", res.status(404).json({
            message: "Tài khoản không tồn tại"
          }));
        case 7:
          _context.next = 9;
          return admin.comparePassword(password);
        case 9:
          isMatch = _context.sent;
          if (isMatch) {
            _context.next = 12;
            break;
          }
          return _context.abrupt("return", res.status(400).json({
            message: "Mật khẩu không chính xác"
          }));
        case 12:
          if (admin.isActive) {
            _context.next = 14;
            break;
          }
          return _context.abrupt("return", res.status(403).json({
            message: "Tài khoản đã bị vô hiệu hóa"
          }));
        case 14:
          // Tạo token
          accessToken = _jsonwebtoken["default"].sign({
            id: admin._id,
            role: admin.role,
            permissions: admin.permissions
          }, process.env.JWT_SECRET, {
            expiresIn: "1h"
          });
          refreshToken = _jsonwebtoken["default"].sign({
            id: admin._id
          }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: "7d"
          }); // Cập nhật last login
          admin.lastLogin = new Date();
          _context.next = 19;
          return admin.save();
        case 19:
          res.status(200).json({
            accessToken: accessToken,
            refreshToken: refreshToken,
            userId: admin._id,
            role: admin.role,
            permissions: admin.permissions,
            fullName: admin.fullName
          });
          _context.next = 25;
          break;
        case 22:
          _context.prev = 22;
          _context.t0 = _context["catch"](0);
          res.status(500).json({
            message: _context.t0.message
          });
        case 25:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 22]]);
  }));
  return function adminLogin(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();
var getAdminProfile = exports.getAdminProfile = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res) {
    var admin;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return _adminModel["default"].findById(req.user.id).select("-password");
        case 3:
          admin = _context2.sent;
          if (admin) {
            _context2.next = 6;
            break;
          }
          return _context2.abrupt("return", res.status(404).json({
            message: "Admin không tồn tại"
          }));
        case 6:
          res.status(200).json(admin);
          _context2.next = 12;
          break;
        case 9:
          _context2.prev = 9;
          _context2.t0 = _context2["catch"](0);
          res.status(500).json({
            message: _context2.t0.message
          });
        case 12:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 9]]);
  }));
  return function getAdminProfile(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

// Hàm helper để lấy quyền mặc định theo role
var getDefaultPermissions = function getDefaultPermissions(role) {
  switch (role) {
    case "admin":
      return ["Thêm", "Xem", "Sửa", "Xóa", "Quản lý người dùng", "Quản lý sản phẩm", "Quản lý đơn hàng", "Quản lý danh mục", "Quản lý cài đặt"];
    case "manager":
      return ["Thêm", "Xem", "Sửa", "Quản lý sản phẩm", "Quản lý đơn hàng", "Quản lý danh mục"];
    case "staff":
      return ["Xem", "Thêm", "Sửa", "Quản lý sản phẩm"];
    default:
      return ["Xem"];
  }
};
var createAdmin = exports.createAdmin = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(req, res) {
    var _req$body2, userName, password, fullName, email, phone, birthday, role, existingEmail, existingUsername, newAdmin, admin;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _req$body2 = req.body, userName = _req$body2.userName, password = _req$body2.password, fullName = _req$body2.fullName, email = _req$body2.email, phone = _req$body2.phone, birthday = _req$body2.birthday, role = _req$body2.role; // Kiểm tra email đã tồn tại
          _context3.next = 4;
          return _adminModel["default"].findOne({
            email: email
          });
        case 4:
          existingEmail = _context3.sent;
          if (!existingEmail) {
            _context3.next = 7;
            break;
          }
          return _context3.abrupt("return", res.status(400).json({
            message: "Email đã được sử dụng"
          }));
        case 7:
          _context3.next = 9;
          return _adminModel["default"].findOne({
            userName: userName
          });
        case 9:
          existingUsername = _context3.sent;
          if (!existingUsername) {
            _context3.next = 12;
            break;
          }
          return _context3.abrupt("return", res.status(400).json({
            message: "Tên đăng nhập đã được sử dụng"
          }));
        case 12:
          // Tạo admin mới
          newAdmin = new _adminModel["default"]({
            userName: userName,
            password: password,
            fullName: fullName,
            email: email,
            phone: phone,
            birthday: birthday,
            role: role,
            permissions: getDefaultPermissions(role)
          });
          _context3.next = 15;
          return newAdmin.save();
        case 15:
          admin = _context3.sent;
          res.status(201).json(admin);
          _context3.next = 22;
          break;
        case 19:
          _context3.prev = 19;
          _context3.t0 = _context3["catch"](0);
          res.status(500).json({
            message: _context3.t0.message
          });
        case 22:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[0, 19]]);
  }));
  return function createAdmin(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();
var getAllAdmins = exports.getAllAdmins = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(req, res) {
    var admins;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _context4.next = 3;
          return _adminModel["default"].find().select('-password');
        case 3:
          admins = _context4.sent;
          res.status(200).json(admins);
          _context4.next = 10;
          break;
        case 7:
          _context4.prev = 7;
          _context4.t0 = _context4["catch"](0);
          res.status(500).json({
            message: _context4.t0.message
          });
        case 10:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[0, 7]]);
  }));
  return function getAllAdmins(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();
var updateAdmin = exports.updateAdmin = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(req, res) {
    var id, updateData, salt, admin;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          id = req.params.id;
          updateData = _objectSpread({}, req.body); // Nếu có thay đổi mật khẩu, hash mật khẩu mới
          if (!updateData.password) {
            _context5.next = 10;
            break;
          }
          _context5.next = 6;
          return _bcryptjs["default"].genSalt(10);
        case 6:
          salt = _context5.sent;
          _context5.next = 9;
          return _bcryptjs["default"].hash(updateData.password, salt);
        case 9:
          updateData.password = _context5.sent;
        case 10:
          // Cập nhật quyền nếu thay đổi role
          if (updateData.role) {
            updateData.permissions = getDefaultPermissions(updateData.role);
          }
          _context5.next = 13;
          return _adminModel["default"].findByIdAndUpdate(id, updateData, {
            "new": true
          }).select('-password');
        case 13:
          admin = _context5.sent;
          if (admin) {
            _context5.next = 16;
            break;
          }
          return _context5.abrupt("return", res.status(404).json({
            message: "Không tìm thấy admin"
          }));
        case 16:
          res.status(200).json(admin);
          _context5.next = 22;
          break;
        case 19:
          _context5.prev = 19;
          _context5.t0 = _context5["catch"](0);
          res.status(500).json({
            message: _context5.t0.message
          });
        case 22:
        case "end":
          return _context5.stop();
      }
    }, _callee5, null, [[0, 19]]);
  }));
  return function updateAdmin(_x9, _x0) {
    return _ref5.apply(this, arguments);
  };
}();
var deleteAdmin = exports.deleteAdmin = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(req, res) {
    var id, admin;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          id = req.params.id;
          _context6.next = 4;
          return _adminModel["default"].findByIdAndDelete(id);
        case 4:
          admin = _context6.sent;
          if (admin) {
            _context6.next = 7;
            break;
          }
          return _context6.abrupt("return", res.status(404).json({
            message: "Không tìm thấy admin"
          }));
        case 7:
          res.status(200).json({
            message: "Xóa admin thành công"
          });
          _context6.next = 13;
          break;
        case 10:
          _context6.prev = 10;
          _context6.t0 = _context6["catch"](0);
          res.status(500).json({
            message: _context6.t0.message
          });
        case 13:
        case "end":
          return _context6.stop();
      }
    }, _callee6, null, [[0, 10]]);
  }));
  return function deleteAdmin(_x1, _x10) {
    return _ref6.apply(this, arguments);
  };
}();
var getAdminById = exports.getAdminById = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(req, res) {
    var id, admin;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          id = req.params.id;
          _context7.next = 4;
          return _adminModel["default"].findById(id).select('-password');
        case 4:
          admin = _context7.sent;
          if (admin) {
            _context7.next = 7;
            break;
          }
          return _context7.abrupt("return", res.status(404).json({
            message: "Không tìm thấy admin"
          }));
        case 7:
          res.status(200).json(admin);
          _context7.next = 13;
          break;
        case 10:
          _context7.prev = 10;
          _context7.t0 = _context7["catch"](0);
          res.status(500).json({
            message: _context7.t0.message
          });
        case 13:
        case "end":
          return _context7.stop();
      }
    }, _callee7, null, [[0, 10]]);
  }));
  return function getAdminById(_x11, _x12) {
    return _ref7.apply(this, arguments);
  };
}();
var updateRolePermissions = exports.updateRolePermissions = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(req, res) {
    var roleKey, permissions, result;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          roleKey = req.params.roleKey;
          permissions = req.body.permissions; // Kiểm tra xem mảng permissions có hợp lệ không
          if (Array.isArray(permissions)) {
            _context8.next = 5;
            break;
          }
          return _context8.abrupt("return", res.status(400).json({
            message: "Permissions phải là một mảng"
          }));
        case 5:
          _context8.next = 7;
          return _adminModel["default"].updateMany({
            role: roleKey
          }, {
            $set: {
              permissions: permissions
            }
          });
        case 7:
          result = _context8.sent;
          // Optional: Log số lượng documents đã được cập nhật
          console.log("Updated permissions for ".concat(result.modifiedCount, " users with role ").concat(roleKey));
          res.status(200).json({
            success: true,
            message: "C\u1EADp nh\u1EADt quy\u1EC1n cho vai tr\xF2 ".concat(roleKey, " th\xE0nh c\xF4ng."),
            // Message tiếng Việt
            modifiedCount: result.modifiedCount
          });
          _context8.next = 16;
          break;
        case 12:
          _context8.prev = 12;
          _context8.t0 = _context8["catch"](0);
          console.error("Error updating role permissions:", _context8.t0);
          res.status(500).json({
            message: "Lỗi server khi cập nhật quyền vai trò"
          });
        case 16:
        case "end":
          return _context8.stop();
      }
    }, _callee8, null, [[0, 12]]);
  }));
  return function updateRolePermissions(_x13, _x14) {
    return _ref8.apply(this, arguments);
  };
}();