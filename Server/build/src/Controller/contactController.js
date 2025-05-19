"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateContact = exports.testEmailConfig = exports.replyToContact = exports.getContacts = exports.getContactById = exports.deleteContact = exports.createContact = void 0;
var _Contact = _interopRequireDefault(require("../Model/Contact.js"));
var _nodemailer = _interopRequireDefault(require("nodemailer"));
var _dotenv = _interopRequireDefault(require("dotenv"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } /* eslint-disable no-undef */
_dotenv["default"].config();

// Get all contacts
var getContacts = exports.getContacts = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(req, res) {
    var contacts;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return _Contact["default"].find().sort({
            createdAt: -1
          });
        case 3:
          contacts = _context.sent;
          // Sắp xếp theo thời gian mới nhất
          res.status(200).json(contacts);
          _context.next = 10;
          break;
        case 7:
          _context.prev = 7;
          _context.t0 = _context["catch"](0);
          res.status(500).json({
            message: _context.t0.message
          });
        case 10:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 7]]);
  }));
  return function getContacts(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

// Get a specific contact by ID
var getContactById = exports.getContactById = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res) {
    var contact;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return _Contact["default"].findById(req.params.id);
        case 3:
          contact = _context2.sent;
          if (contact) {
            _context2.next = 6;
            break;
          }
          return _context2.abrupt("return", res.status(404).json({
            message: "Contact not found"
          }));
        case 6:
          res.status(200).json(contact);
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
  return function getContactById(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

// Create a new contact
var createContact = exports.createContact = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(req, res) {
    var _req$body, name, email, message, phone, newContact, savedContact;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _req$body = req.body, name = _req$body.name, email = _req$body.email, message = _req$body.message, phone = _req$body.phone;
          if (!(!name || !email || !message)) {
            _context3.next = 4;
            break;
          }
          return _context3.abrupt("return", res.status(400).json({
            message: "Please provide name, email and message"
          }));
        case 4:
          newContact = new _Contact["default"]({
            name: name,
            email: email,
            message: message,
            phone: phone,
            isRead: false,
            isReplied: false
          });
          _context3.next = 7;
          return newContact.save();
        case 7:
          savedContact = _context3.sent;
          res.status(201).json(savedContact);
          _context3.next = 14;
          break;
        case 11:
          _context3.prev = 11;
          _context3.t0 = _context3["catch"](0);
          res.status(500).json({
            message: _context3.t0.message
          });
        case 14:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[0, 11]]);
  }));
  return function createContact(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();

// Update a contact
var updateContact = exports.updateContact = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(req, res) {
    var updatedContact;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _context4.next = 3;
          return _Contact["default"].findByIdAndUpdate(req.params.id, req.body, {
            "new": true
          });
        case 3:
          updatedContact = _context4.sent;
          if (updatedContact) {
            _context4.next = 6;
            break;
          }
          return _context4.abrupt("return", res.status(404).json({
            message: "Contact not found"
          }));
        case 6:
          res.status(200).json(updatedContact);
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
  return function updateContact(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();

// Delete a contact
var deleteContact = exports.deleteContact = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(req, res) {
    var deletedContact;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          _context5.next = 3;
          return _Contact["default"].findByIdAndDelete(req.params.id);
        case 3:
          deletedContact = _context5.sent;
          if (deletedContact) {
            _context5.next = 6;
            break;
          }
          return _context5.abrupt("return", res.status(404).json({
            message: "Contact not found"
          }));
        case 6:
          res.status(200).json({
            message: "Contact deleted successfully"
          });
          _context5.next = 12;
          break;
        case 9:
          _context5.prev = 9;
          _context5.t0 = _context5["catch"](0);
          res.status(500).json({
            message: _context5.t0.message
          });
        case 12:
        case "end":
          return _context5.stop();
      }
    }, _callee5, null, [[0, 9]]);
  }));
  return function deleteContact(_x9, _x0) {
    return _ref5.apply(this, arguments);
  };
}();

// Reply to a contact by sending an email
var replyToContact = exports.replyToContact = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(req, res) {
    var _req$body2, contactId, to, subject, message, contact, emailUsername, emailPassword, transporter, mailOptions, info;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          _req$body2 = req.body, contactId = _req$body2.contactId, to = _req$body2.to, subject = _req$body2.subject, message = _req$body2.message;
          if (!(!contactId || !to || !subject || !message)) {
            _context6.next = 4;
            break;
          }
          return _context6.abrupt("return", res.status(400).json({
            message: "Please provide contactId, to, subject and message"
          }));
        case 4:
          _context6.next = 6;
          return _Contact["default"].findById(contactId);
        case 6:
          contact = _context6.sent;
          if (contact) {
            _context6.next = 9;
            break;
          }
          return _context6.abrupt("return", res.status(404).json({
            message: "Contact not found"
          }));
        case 9:
          // Lấy thông tin email từ biến môi trường
          emailUsername = process.env.EMAIL_USERNAME;
          emailPassword = process.env.EMAIL_PASSWORD;
          if (!(!emailUsername || !emailPassword)) {
            _context6.next = 13;
            break;
          }
          return _context6.abrupt("return", res.status(500).json({
            message: "Email configuration is missing",
            error: "Missing email credentials in server configuration"
          }));
        case 13:
          // Cấu hình nodemailer transporter
          transporter = _nodemailer["default"].createTransport({
            service: "gmail",
            auth: {
              user: emailUsername,
              pass: emailPassword
            },
            debug: true // Thêm để xem lỗi chi tiết hơn
          });
          console.log("Email configuration:", {
            emailUser: emailUsername ? "Set" : "Not set",
            emailPass: emailPassword ? "Set" : "Not set"
          });

          // Xác thực kết nối trước khi gửi
          _context6.prev = 15;
          _context6.next = 18;
          return transporter.verify();
        case 18:
          console.log("Email transport verified successfully");
          _context6.next = 25;
          break;
        case 21:
          _context6.prev = 21;
          _context6.t0 = _context6["catch"](15);
          console.error("Email transport verification failed:", _context6.t0);
          return _context6.abrupt("return", res.status(500).json({
            message: "Email server configuration error",
            error: _context6.t0.message
          }));
        case 25:
          // Cấu hình email
          mailOptions = {
            from: emailUsername,
            to: to,
            subject: subject,
            html: message.replace(/\n/g, '<br>')
          }; // Gửi email
          _context6.next = 28;
          return transporter.sendMail(mailOptions);
        case 28:
          info = _context6.sent;
          console.log("Email sent successfully:", info.messageId);

          // Cập nhật trạng thái liên hệ thành đã trả lời
          contact.isRead = true;
          contact.isReplied = true;
          _context6.next = 34;
          return contact.save();
        case 34:
          res.status(200).json({
            message: "Reply sent successfully",
            messageId: info.messageId,
            deliveryStatus: info.response
          });
          _context6.next = 41;
          break;
        case 37:
          _context6.prev = 37;
          _context6.t1 = _context6["catch"](0);
          console.error("Error sending reply:", _context6.t1);
          res.status(500).json({
            message: "Failed to send reply",
            error: _context6.t1.message
          });
        case 41:
        case "end":
          return _context6.stop();
      }
    }, _callee6, null, [[0, 37], [15, 21]]);
  }));
  return function replyToContact(_x1, _x10) {
    return _ref6.apply(this, arguments);
  };
}();

// Test email configuration
var testEmailConfig = exports.testEmailConfig = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(req, res) {
    var emailUsername, emailPassword, transporter;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          // Lấy thông tin cấu hình từ biến môi trường
          emailUsername = process.env.EMAIL_USERNAME;
          emailPassword = process.env.EMAIL_PASSWORD;
          if (!(!emailUsername || !emailPassword)) {
            _context7.next = 5;
            break;
          }
          return _context7.abrupt("return", res.status(400).json({
            success: false,
            message: "Email configuration is missing",
            config: {
              username: emailUsername ? "Set" : "Not set",
              password: emailPassword ? "Set" : "Not set"
            }
          }));
        case 5:
          // Cấu hình nodemailer transporter để kiểm tra
          transporter = _nodemailer["default"].createTransport({
            service: "gmail",
            auth: {
              user: emailUsername,
              pass: emailPassword
            }
          }); // Kiểm tra kết nối
          _context7.next = 8;
          return transporter.verify();
        case 8:
          res.status(200).json({
            success: true,
            message: "Email configuration is valid",
            email: emailUsername
          });
          _context7.next = 15;
          break;
        case 11:
          _context7.prev = 11;
          _context7.t0 = _context7["catch"](0);
          console.error("Error testing email config:", _context7.t0);
          res.status(500).json({
            success: false,
            message: "Failed to verify email configuration",
            error: _context7.t0.message,
            stack: process.env.NODE_ENV === 'development' ? _context7.t0.stack : undefined
          });
        case 15:
        case "end":
          return _context7.stop();
      }
    }, _callee7, null, [[0, 11]]);
  }));
  return function testEmailConfig(_x11, _x12) {
    return _ref7.apply(this, arguments);
  };
}();