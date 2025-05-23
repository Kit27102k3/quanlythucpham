"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sendMessage = exports.markAllAsRead = exports.getUnreadCount = exports.getMessagesByUserId = exports.getAllContacts = void 0;
var _Message = _interopRequireDefault(require("../Model/Message.js"));
var _Register = _interopRequireDefault(require("../Model/Register.js"));
var _Admin = _interopRequireDefault(require("../Model/Admin.js"));
var _admin = require("../config/admin.js");
var _dotenv = _interopRequireDefault(require("dotenv"));
var _notificationService = require("../Services/notificationService.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
// Cấu hình dotenv
_dotenv["default"].config();

// Mã token admin cố định
var ADMIN_SECRET_TOKEN = "admin-token-for-TKhiem";

// Hàm lấy tất cả người dùng đã nhắn tin với admin
var getAllContacts = exports.getAllContacts = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(req, res) {
    var conversations, userIds, users, adminIds, admins, contacts;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return _Message["default"].find().sort({
            lastUpdated: -1
          });
        case 3:
          conversations = _context.sent;
          // Lấy thông tin chi tiết về người dùng
          userIds = conversations.map(function (conv) {
            return conv.userId;
          });
          _context.next = 7;
          return _Register["default"].find({
            _id: {
              $in: userIds
            }
          });
        case 7:
          users = _context.sent;
          // Lấy thông tin admin nếu có adminId
          adminIds = conversations.map(function (conv) {
            return conv.adminId;
          }).filter(function (id) {
            return id !== null;
          });
          _context.next = 11;
          return _Admin["default"].find({
            _id: {
              $in: adminIds
            }
          });
        case 11:
          admins = _context.sent;
          // Map thông tin người dùng vào kết quả
          contacts = conversations.map(function (conv) {
            var _conv$adminId;
            var user = users.find(function (u) {
              return u._id.toString() === conv.userId.toString();
            });
            var admin = admins.find(function (a) {
              return a && conv.adminId && a._id.toString() === conv.adminId.toString();
            });
            var lastMessage = conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;
            return {
              id: (user === null || user === void 0 ? void 0 : user._id.toString()) || conv.userId.toString(),
              name: user !== null && user !== void 0 && user.firstName ? "".concat(user.firstName, " ").concat(user.lastName) : 'Người dùng',
              avatar: (user === null || user === void 0 ? void 0 : user.userImage) || null,
              online: false,
              // Có thể triển khai sau với Socket.io
              lastSeen: lastMessage ? formatTimeAgo(lastMessage.timestamp) : null,
              lastMessage: lastMessage ? lastMessage.text : '',
              unread: conv.messages.filter(function (msg) {
                return msg.sender === 'user' && !msg.read;
              }).length,
              adminName: (admin === null || admin === void 0 ? void 0 : admin.fullName) || 'Admin',
              adminId: (_conv$adminId = conv.adminId) === null || _conv$adminId === void 0 ? void 0 : _conv$adminId.toString()
            };
          });
          return _context.abrupt("return", res.status(200).json(contacts));
        case 16:
          _context.prev = 16;
          _context.t0 = _context["catch"](0);
          console.error("Lỗi khi lấy danh sách liên hệ:", _context.t0);
          return _context.abrupt("return", res.status(500).json({
            message: "Lỗi server: " + _context.t0.message
          }));
        case 20:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 16]]);
  }));
  return function getAllContacts(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

// Hàm lấy tin nhắn giữa admin và một user cụ thể
var getMessagesByUserId = exports.getMessagesByUserId = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res) {
    var userId, isAdmin, actualUserId, conversation, currentUserId, formattedMessages;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          userId = req.params.userId; // Kiểm tra xem người dùng có phải là admin không
          isAdmin = req.headers['admin-token'] === ADMIN_SECRET_TOKEN || req.user && req.user.role === 'admin'; // Nếu userId là "admin", thay thế bằng ID admin thực
          actualUserId = userId;
          if (!(userId === "admin")) {
            _context2.next = 8;
            break;
          }
          _context2.next = 7;
          return (0, _admin.getAdminId)();
        case 7:
          actualUserId = _context2.sent;
        case 8:
          if (!isAdmin) {
            _context2.next = 14;
            break;
          }
          _context2.next = 11;
          return _Message["default"].findOne({
            userId: actualUserId
          });
        case 11:
          conversation = _context2.sent;
          _context2.next = 18;
          break;
        case 14:
          // Người dùng đang xem tin nhắn của họ với admin
          currentUserId = req.user ? req.user.id : actualUserId;
          _context2.next = 17;
          return _Message["default"].findOne({
            userId: currentUserId
          });
        case 17:
          conversation = _context2.sent;
        case 18:
          if (conversation) {
            _context2.next = 20;
            break;
          }
          return _context2.abrupt("return", res.status(200).json([]));
        case 20:
          // Format lại tin nhắn cho client
          formattedMessages = conversation.messages.map(function (msg) {
            return {
              id: msg._id.toString(),
              text: msg.text,
              sender: msg.sender,
              read: msg.read,
              createdAt: msg.timestamp
            };
          });
          return _context2.abrupt("return", res.status(200).json(formattedMessages));
        case 24:
          _context2.prev = 24;
          _context2.t0 = _context2["catch"](0);
          console.error("Lỗi khi lấy tin nhắn:", _context2.t0);
          return _context2.abrupt("return", res.status(500).json({
            message: "Lỗi server: " + _context2.t0.message
          }));
        case 28:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 24]]);
  }));
  return function getMessagesByUserId(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

// Hàm gửi tin nhắn mới
var sendMessage = exports.sendMessage = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(req, res) {
    var _req$body, text, sender, receiverId, requestUserId, userId, adminId, conversation, newMessage, addedMessage, _user$pushSubscriptio, _user$pushSubscriptio2, admin, senderName, user, notificationResult;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _req$body = req.body, text = _req$body.text, sender = _req$body.sender, receiverId = _req$body.receiverId, requestUserId = _req$body.userId;
          if (!(!text || !sender)) {
            _context3.next = 4;
            break;
          }
          return _context3.abrupt("return", res.status(400).json({
            message: "Thiếu thông tin tin nhắn"
          }));
        case 4:
          _context3.next = 6;
          return (0, _admin.getAdminId)();
        case 6:
          adminId = _context3.sent;
          // Xác định userId dựa vào sender
          if (sender === 'admin') {
            // Nếu admin gửi tin nhắn, receiverId chính là userId
            userId = receiverId;
          } else {
            // Nếu user gửi tin nhắn, lấy userId từ request hoặc token
            userId = requestUserId || (req.user ? req.user.id : null);
          }
          if (userId) {
            _context3.next = 10;
            break;
          }
          return _context3.abrupt("return", res.status(400).json({
            message: "Không xác định được người nhận tin nhắn"
          }));
        case 10:
          _context3.next = 12;
          return _Message["default"].findOne({
            userId: userId
          });
        case 12:
          conversation = _context3.sent;
          if (!conversation) {
            // Tạo mới cuộc hội thoại nếu chưa tồn tại
            conversation = new _Message["default"]({
              userId: userId,
              adminId: adminId,
              messages: [],
              unreadCount: 0
            });
          }

          // Thêm tin nhắn mới vào mảng
          newMessage = {
            text: text,
            sender: sender,
            read: false,
            timestamp: new Date()
          };
          conversation.messages.push(newMessage);

          // Cập nhật số lượng tin nhắn chưa đọc
          if (sender === 'user') {
            conversation.unreadCount = (conversation.unreadCount || 0) + 1;
          }

          // Lưu cuộc hội thoại
          _context3.next = 19;
          return conversation.save();
        case 19:
          // Lấy tin nhắn vừa thêm vào
          addedMessage = conversation.messages[conversation.messages.length - 1]; // Gửi thông báo nếu tin nhắn từ admin gửi cho user
          if (!(sender === 'admin' && userId)) {
            _context3.next = 40;
            break;
          }
          _context3.prev = 21;
          _context3.next = 24;
          return _Admin["default"].findById(adminId);
        case 24:
          admin = _context3.sent;
          senderName = admin ? admin.fullName || "Admin" : "Admin"; // Lấy thông tin user để kiểm tra
          _context3.next = 28;
          return _Register["default"].findById(userId);
        case 28:
          user = _context3.sent;
          console.log("Ki\u1EC3m tra user tr\u01B0\u1EDBc khi g\u1EEDi th\xF4ng b\xE1o:", {
            userId: userId,
            hasSubscriptions: (user === null || user === void 0 || (_user$pushSubscriptio = user.pushSubscriptions) === null || _user$pushSubscriptio === void 0 ? void 0 : _user$pushSubscriptio.length) > 0,
            subscriptionsCount: (user === null || user === void 0 || (_user$pushSubscriptio2 = user.pushSubscriptions) === null || _user$pushSubscriptio2 === void 0 ? void 0 : _user$pushSubscriptio2.length) || 0
          });

          // Gửi thông báo đến người dùng
          console.log("Chu\u1EA9n b\u1ECB g\u1EEDi th\xF4ng b\xE1o v\u1EDBi c\xE1c tham s\u1ED1:", {
            userId: userId,
            senderName: senderName,
            textPreview: text.substring(0, 20) + (text.length > 20 ? '...' : '')
          });
          _context3.next = 33;
          return (0, _notificationService.sendMessageNotification)(userId, senderName, text)["catch"](function (error) {
            console.error('Error sending message notification:', error);
            return false;
          });
        case 33:
          notificationResult = _context3.sent;
          console.log("K\u1EBFt qu\u1EA3 g\u1EEDi th\xF4ng b\xE1o:", notificationResult ? 'Thành công' : 'Thất bại');
          _context3.next = 40;
          break;
        case 37:
          _context3.prev = 37;
          _context3.t0 = _context3["catch"](21);
          console.error('Lỗi khi gửi thông báo tin nhắn mới:', _context3.t0);
          // Không ảnh hưởng đến việc trả về response
        case 40:
          return _context3.abrupt("return", res.status(201).json({
            id: addedMessage._id.toString(),
            text: addedMessage.text,
            sender: addedMessage.sender,
            read: addedMessage.read,
            createdAt: addedMessage.timestamp
          }));
        case 43:
          _context3.prev = 43;
          _context3.t1 = _context3["catch"](0);
          console.error("Lỗi khi gửi tin nhắn:", _context3.t1);
          return _context3.abrupt("return", res.status(500).json({
            message: "Lỗi server: " + _context3.t1.message
          }));
        case 47:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[0, 43], [21, 37]]);
  }));
  return function sendMessage(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();

// Hàm đánh dấu tất cả tin nhắn là đã đọc
var markAllAsRead = exports.markAllAsRead = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(req, res) {
    var userId, conversation, updated;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          userId = req.params.userId; // Tìm cuộc hội thoại
          _context4.next = 4;
          return _Message["default"].findOne({
            userId: userId
          });
        case 4:
          conversation = _context4.sent;
          if (conversation) {
            _context4.next = 7;
            break;
          }
          return _context4.abrupt("return", res.status(404).json({
            message: "Không tìm thấy cuộc hội thoại"
          }));
        case 7:
          // Cập nhật trạng thái đã đọc cho tất cả tin nhắn từ admin
          updated = false;
          conversation.messages = conversation.messages.map(function (msg) {
            if (msg.sender === 'admin' && !msg.read) {
              updated = true;
              return _objectSpread(_objectSpread({}, msg.toObject()), {}, {
                read: true
              });
            }
            return msg;
          });

          // Reset số lượng tin nhắn chưa đọc
          if (!updated) {
            _context4.next = 13;
            break;
          }
          conversation.unreadCount = 0;
          _context4.next = 13;
          return conversation.save();
        case 13:
          return _context4.abrupt("return", res.status(200).json({
            success: true
          }));
        case 16:
          _context4.prev = 16;
          _context4.t0 = _context4["catch"](0);
          console.error("Lỗi khi đánh dấu tin nhắn đã đọc:", _context4.t0);
          return _context4.abrupt("return", res.status(500).json({
            message: "Lỗi server: " + _context4.t0.message
          }));
        case 20:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[0, 16]]);
  }));
  return function markAllAsRead(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();

// Hàm lấy số lượng tin nhắn chưa đọc cho admin
var getUnreadCount = exports.getUnreadCount = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(req, res) {
    var isAdmin, conversations, totalUnread;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          // Kiểm tra admin token
          isAdmin = req.headers['admin-token'] === ADMIN_SECRET_TOKEN;
          if (isAdmin) {
            _context5.next = 4;
            break;
          }
          return _context5.abrupt("return", res.status(403).json({
            message: "Không có quyền truy cập"
          }));
        case 4:
          _context5.next = 6;
          return _Message["default"].find();
        case 6:
          conversations = _context5.sent;
          totalUnread = conversations.reduce(function (sum, conv) {
            return sum + (conv.unreadCount || 0);
          }, 0);
          return _context5.abrupt("return", res.status(200).json({
            count: totalUnread
          }));
        case 11:
          _context5.prev = 11;
          _context5.t0 = _context5["catch"](0);
          console.error("Lỗi khi lấy số lượng tin nhắn chưa đọc:", _context5.t0);
          return _context5.abrupt("return", res.status(500).json({
            message: "Lỗi server: " + _context5.t0.message
          }));
        case 15:
        case "end":
          return _context5.stop();
      }
    }, _callee5, null, [[0, 11]]);
  }));
  return function getUnreadCount(_x9, _x0) {
    return _ref5.apply(this, arguments);
  };
}();

// Hàm format thời gian
function formatTimeAgo(date) {
  var now = new Date();
  var diff = Math.floor((now - date) / 1000); // Độ chênh lệch tính bằng giây

  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return "".concat(Math.floor(diff / 60), " ph\xFAt tr\u01B0\u1EDBc");
  if (diff < 86400) return "".concat(Math.floor(diff / 3600), " gi\u1EDD tr\u01B0\u1EDBc");
  return new Date(date).toLocaleDateString('vi-VN');
}