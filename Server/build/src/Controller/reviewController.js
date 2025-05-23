"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateReview = exports.toggleReviewPublishStatus = exports.replyToReview = exports.getProductReviews = exports.getAllReviews = exports.editReply = exports.deleteReview = exports.deleteReply = exports.addReview = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
var _Review = _interopRequireDefault(require("../Model/Review.js"));
var _Register = _interopRequireDefault(require("../Model/Register.js"));
var _Products = _interopRequireDefault(require("../Model/Products.js"));
var _tokenExtractor = require("../utils/tokenExtractor.js");
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _notificationService = require("../Services/notificationService.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } /* eslint-disable no-undef */
// Khởi tạo cấu hình dotenv
_dotenv["default"].config();

// Lấy JWT_SECRET từ biến môi trường - process is available in Node.js by default
var JWT_SECRET = process.env.JWT_SECRET_ACCESS || "SECRET_ACCESS";

// Lấy tất cả đánh giá cho một sản phẩm
var getProductReviews = exports.getProductReviews = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(req, res) {
    var productId, reviews, product;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          productId = req.params.productId; // Kiểm tra productId có đúng định dạng không
          if (_mongoose["default"].Types.ObjectId.isValid(productId)) {
            _context.next = 4;
            break;
          }
          return _context.abrupt("return", res.status(400).json({
            success: false,
            message: "ID sản phẩm không hợp lệ"
          }));
        case 4:
          _context.next = 6;
          return _Review["default"].find({
            productId: productId,
            isPublished: true
          }).sort({
            createdAt: -1
          });
        case 6:
          reviews = _context.sent;
          _context.next = 9;
          return _Products["default"].findById(productId);
        case 9:
          product = _context.sent;
          if (product) {
            _context.next = 12;
            break;
          }
          return _context.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy sản phẩm"
          }));
        case 12:
          return _context.abrupt("return", res.status(200).json({
            success: true,
            data: {
              reviews: reviews,
              averageRating: product.averageRating || 0,
              numOfReviews: product.numOfReviews || 0
            }
          }));
        case 15:
          _context.prev = 15;
          _context.t0 = _context["catch"](0);
          console.error("Lỗi khi lấy đánh giá:", _context.t0);
          return _context.abrupt("return", res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy đánh giá",
            error: _context.t0.message
          }));
        case 19:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 15]]);
  }));
  return function getProductReviews(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

// Thêm đánh giá mới
var addReview = exports.addReview = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res) {
    var _req$body, rating, comment, productId, userName, token, decodedToken, userId, user, product, existingReview, newReview;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _req$body = req.body, rating = _req$body.rating, comment = _req$body.comment, productId = _req$body.productId, userName = _req$body.userName; // Xác thực người dùng từ token
          token = (0, _tokenExtractor.getTokenFrom)(req);
          if (token) {
            _context2.next = 5;
            break;
          }
          return _context2.abrupt("return", res.status(401).json({
            success: false,
            message: "Bạn cần đăng nhập để đánh giá sản phẩm"
          }));
        case 5:
          decodedToken = _jsonwebtoken["default"].verify(token, JWT_SECRET);
          if (decodedToken.id) {
            _context2.next = 8;
            break;
          }
          return _context2.abrupt("return", res.status(401).json({
            success: false,
            message: "Token không hợp lệ"
          }));
        case 8:
          userId = decodedToken.id; // Kiểm tra người dùng có tồn tại không
          _context2.next = 11;
          return _Register["default"].findById(userId);
        case 11:
          user = _context2.sent;
          if (user) {
            _context2.next = 14;
            break;
          }
          return _context2.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy người dùng"
          }));
        case 14:
          if (_mongoose["default"].Types.ObjectId.isValid(productId)) {
            _context2.next = 16;
            break;
          }
          return _context2.abrupt("return", res.status(400).json({
            success: false,
            message: "ID sản phẩm không hợp lệ"
          }));
        case 16:
          _context2.next = 18;
          return _Products["default"].findById(productId);
        case 18:
          product = _context2.sent;
          if (product) {
            _context2.next = 21;
            break;
          }
          return _context2.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy sản phẩm"
          }));
        case 21:
          _context2.next = 23;
          return _Review["default"].findOne({
            userId: userId,
            productId: productId
          });
        case 23:
          existingReview = _context2.sent;
          if (!existingReview) {
            _context2.next = 26;
            break;
          }
          return _context2.abrupt("return", res.status(400).json({
            success: false,
            message: "Bạn đã đánh giá sản phẩm này rồi"
          }));
        case 26:
          // Tạo đánh giá mới
          newReview = new _Review["default"]({
            userId: userId,
            productId: productId,
            rating: parseFloat(rating) || 5,
            // Đảm bảo rating là số float, mặc định là 5
            comment: comment,
            userName: userName || "".concat(user.firstName, " ").concat(user.lastName),
            userImage: user.userImage || ""
            // Có thể kiểm tra xem người dùng đã mua sản phẩm chưa và đặt isVerified
          }); // Lưu đánh giá
          _context2.next = 29;
          return newReview.save();
        case 29:
          return _context2.abrupt("return", res.status(201).json({
            success: true,
            message: "Đánh giá của bạn đã được ghi nhận",
            data: newReview
          }));
        case 32:
          _context2.prev = 32;
          _context2.t0 = _context2["catch"](0);
          console.error("Lỗi khi thêm đánh giá:", _context2.t0);
          return _context2.abrupt("return", res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi thêm đánh giá",
            error: _context2.t0.message
          }));
        case 36:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 32]]);
  }));
  return function addReview(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

// Cập nhật đánh giá
var updateReview = exports.updateReview = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(req, res) {
    var reviewId, _req$body2, rating, comment, token, decodedToken, userId, review;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          reviewId = req.params.reviewId;
          _req$body2 = req.body, rating = _req$body2.rating, comment = _req$body2.comment; // Xác thực người dùng
          token = (0, _tokenExtractor.getTokenFrom)(req);
          if (token) {
            _context3.next = 6;
            break;
          }
          return _context3.abrupt("return", res.status(401).json({
            success: false,
            message: "Không có quyền cập nhật đánh giá"
          }));
        case 6:
          decodedToken = _jsonwebtoken["default"].verify(token, JWT_SECRET);
          userId = decodedToken.id; // Kiểm tra xem đánh giá có tồn tại không
          if (_mongoose["default"].Types.ObjectId.isValid(reviewId)) {
            _context3.next = 10;
            break;
          }
          return _context3.abrupt("return", res.status(400).json({
            success: false,
            message: "ID đánh giá không hợp lệ"
          }));
        case 10:
          _context3.next = 12;
          return _Review["default"].findById(reviewId);
        case 12:
          review = _context3.sent;
          if (review) {
            _context3.next = 15;
            break;
          }
          return _context3.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy đánh giá"
          }));
        case 15:
          if (!(review.userId.toString() !== userId && !decodedToken.isAdmin)) {
            _context3.next = 17;
            break;
          }
          return _context3.abrupt("return", res.status(403).json({
            success: false,
            message: "Bạn không có quyền cập nhật đánh giá này"
          }));
        case 17:
          // Cập nhật đánh giá
          review.rating = parseFloat(rating) || review.rating; // Sử dụng giá trị cũ nếu không có giá trị mới
          review.comment = comment;
          _context3.next = 21;
          return review.save();
        case 21:
          return _context3.abrupt("return", res.status(200).json({
            success: true,
            message: "Đánh giá đã được cập nhật",
            data: review
          }));
        case 24:
          _context3.prev = 24;
          _context3.t0 = _context3["catch"](0);
          console.error("Lỗi khi cập nhật đánh giá:", _context3.t0);
          return _context3.abrupt("return", res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi cập nhật đánh giá",
            error: _context3.t0.message
          }));
        case 28:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[0, 24]]);
  }));
  return function updateReview(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();

// Xóa đánh giá
var deleteReview = exports.deleteReview = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(req, res) {
    var reviewId, token, decodedToken, userId, review, productId;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          reviewId = req.params.reviewId; // Xác thực người dùng
          token = (0, _tokenExtractor.getTokenFrom)(req);
          if (token) {
            _context4.next = 5;
            break;
          }
          return _context4.abrupt("return", res.status(401).json({
            success: false,
            message: "Không có quyền xóa đánh giá"
          }));
        case 5:
          decodedToken = _jsonwebtoken["default"].verify(token, JWT_SECRET);
          userId = decodedToken.id; // Kiểm tra xem đánh giá có tồn tại không
          if (_mongoose["default"].Types.ObjectId.isValid(reviewId)) {
            _context4.next = 9;
            break;
          }
          return _context4.abrupt("return", res.status(400).json({
            success: false,
            message: "ID đánh giá không hợp lệ"
          }));
        case 9:
          _context4.next = 11;
          return _Review["default"].findById(reviewId);
        case 11:
          review = _context4.sent;
          if (review) {
            _context4.next = 14;
            break;
          }
          return _context4.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy đánh giá"
          }));
        case 14:
          if (!(review.userId.toString() !== userId && !decodedToken.isAdmin)) {
            _context4.next = 16;
            break;
          }
          return _context4.abrupt("return", res.status(403).json({
            success: false,
            message: "Bạn không có quyền xóa đánh giá này"
          }));
        case 16:
          // Lưu productId trước khi xóa để cập nhật lại rating
          productId = review.productId; // Xóa đánh giá
          _context4.next = 19;
          return _Review["default"].findByIdAndDelete(reviewId);
        case 19:
          _context4.next = 21;
          return _Review["default"].calculateAverageRating(productId);
        case 21:
          return _context4.abrupt("return", res.status(200).json({
            success: true,
            message: "Đánh giá đã được xóa thành công"
          }));
        case 24:
          _context4.prev = 24;
          _context4.t0 = _context4["catch"](0);
          console.error("Lỗi khi xóa đánh giá:", _context4.t0);
          return _context4.abrupt("return", res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xóa đánh giá",
            error: _context4.t0.message
          }));
        case 28:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[0, 24]]);
  }));
  return function deleteReview(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();

// API cho Admin: Lấy tất cả đánh giá
var getAllReviews = exports.getAllReviews = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(req, res) {
    var token, page, limit, skip, reviews, total, decodedToken, _page, _limit, _skip, _reviews, _total;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          // Lấy token từ query parameter hoặc từ authorization header
          token = req.query.token || (0, _tokenExtractor.getTokenFrom)(req);
          if (token) {
            _context5.next = 4;
            break;
          }
          return _context5.abrupt("return", res.status(401).json({
            success: false,
            message: "Không có quyền truy cập"
          }));
        case 4:
          if (!(token === "admin-token-for-TKhiem")) {
            _context5.next = 15;
            break;
          }
          // Bỏ qua xác thực JWT, trực tiếp lấy dữ liệu
          // Phân trang
          page = parseInt(req.query.page) || 1;
          limit = parseInt(req.query.limit) || 10;
          skip = (page - 1) * limit; // Tìm tất cả đánh giá
          _context5.next = 10;
          return _Review["default"].find().sort({
            createdAt: -1
          }).skip(skip).limit(limit).populate({
            path: 'productId',
            select: 'productName productImages price category'
          });
        case 10:
          reviews = _context5.sent;
          _context5.next = 13;
          return _Review["default"].countDocuments();
        case 13:
          total = _context5.sent;
          return _context5.abrupt("return", res.status(200).json({
            success: true,
            data: {
              reviews: reviews,
              pagination: {
                total: total,
                page: page,
                pages: Math.ceil(total / limit)
              }
            }
          }));
        case 15:
          if (!(!token || token === 'undefined' || token === 'null')) {
            _context5.next = 17;
            break;
          }
          return _context5.abrupt("return", res.status(401).json({
            success: false,
            message: "Token không hợp lệ"
          }));
        case 17:
          _context5.prev = 17;
          // Verify token trong block try-catch riêng để xử lý lỗi verify
          decodedToken = _jsonwebtoken["default"].verify(token, JWT_SECRET); // Kiểm tra quyền admin hoặc manager
          if (!(!decodedToken.isAdmin && decodedToken.role !== "manager")) {
            _context5.next = 21;
            break;
          }
          return _context5.abrupt("return", res.status(403).json({
            success: false,
            message: "Chỉ admin hoặc manager mới có quyền xem tất cả đánh giá"
          }));
        case 21:
          // Phân trang
          _page = parseInt(req.query.page) || 1;
          _limit = parseInt(req.query.limit) || 10;
          _skip = (_page - 1) * _limit; // Tìm tất cả đánh giá
          _context5.next = 26;
          return _Review["default"].find().sort({
            createdAt: -1
          }).skip(_skip).limit(_limit).populate({
            path: 'productId',
            select: 'productName productImages price category'
          });
        case 26:
          _reviews = _context5.sent;
          _context5.next = 29;
          return _Review["default"].countDocuments();
        case 29:
          _total = _context5.sent;
          return _context5.abrupt("return", res.status(200).json({
            success: true,
            data: {
              reviews: _reviews,
              pagination: {
                total: _total,
                page: _page,
                pages: Math.ceil(_total / _limit)
              }
            }
          }));
        case 33:
          _context5.prev = 33;
          _context5.t0 = _context5["catch"](17);
          console.error("Lỗi xác thực token:", _context5.t0);
          return _context5.abrupt("return", res.status(401).json({
            success: false,
            message: "Token không hợp lệ hoặc đã hết hạn",
            error: _context5.t0.message
          }));
        case 37:
          _context5.next = 43;
          break;
        case 39:
          _context5.prev = 39;
          _context5.t1 = _context5["catch"](0);
          console.error("Lỗi khi lấy tất cả đánh giá:", _context5.t1);
          return _context5.abrupt("return", res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy tất cả đánh giá",
            error: _context5.t1.message
          }));
        case 43:
        case "end":
          return _context5.stop();
      }
    }, _callee5, null, [[0, 39], [17, 33]]);
  }));
  return function getAllReviews(_x9, _x0) {
    return _ref5.apply(this, arguments);
  };
}();

// API cho Admin: Cập nhật trạng thái hiển thị của đánh giá
var toggleReviewPublishStatus = exports.toggleReviewPublishStatus = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(req, res) {
    var reviewId, token, review, productId, decodedToken, _review, _productId;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          reviewId = req.params.reviewId; // Lấy token từ query parameter hoặc từ authorization header
          token = req.query.token || (0, _tokenExtractor.getTokenFrom)(req);
          if (token) {
            _context6.next = 5;
            break;
          }
          return _context6.abrupt("return", res.status(401).json({
            success: false,
            message: "Không có quyền truy cập"
          }));
        case 5:
          if (!(token === "admin-token-for-TKhiem")) {
            _context6.next = 20;
            break;
          }
          if (_mongoose["default"].Types.ObjectId.isValid(reviewId)) {
            _context6.next = 8;
            break;
          }
          return _context6.abrupt("return", res.status(400).json({
            success: false,
            message: "ID đánh giá không hợp lệ"
          }));
        case 8:
          _context6.next = 10;
          return _Review["default"].findById(reviewId);
        case 10:
          review = _context6.sent;
          if (review) {
            _context6.next = 13;
            break;
          }
          return _context6.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy đánh giá"
          }));
        case 13:
          // Lưu productId trước khi cập nhật
          productId = review.productId; // Cập nhật trạng thái hiển thị
          review.isPublished = !review.isPublished;
          _context6.next = 17;
          return review.save();
        case 17:
          _context6.next = 19;
          return _Review["default"].calculateAverageRating(productId);
        case 19:
          return _context6.abrupt("return", res.status(200).json({
            success: true,
            message: "\u0110\xE1nh gi\xE1 \u0111\xE3 \u0111\u01B0\u1EE3c ".concat(review.isPublished ? 'hiển thị' : 'ẩn', " th\xE0nh c\xF4ng"),
            data: review
          }));
        case 20:
          if (!(!token || token === 'undefined' || token === 'null')) {
            _context6.next = 22;
            break;
          }
          return _context6.abrupt("return", res.status(401).json({
            success: false,
            message: "Token không hợp lệ"
          }));
        case 22:
          _context6.prev = 22;
          // Verify token trong block try-catch riêng để xử lý lỗi verify
          decodedToken = _jsonwebtoken["default"].verify(token, JWT_SECRET); // Kiểm tra quyền admin
          if (decodedToken.isAdmin) {
            _context6.next = 26;
            break;
          }
          return _context6.abrupt("return", res.status(403).json({
            success: false,
            message: "Chỉ admin mới có quyền cập nhật trạng thái đánh giá"
          }));
        case 26:
          if (_mongoose["default"].Types.ObjectId.isValid(reviewId)) {
            _context6.next = 28;
            break;
          }
          return _context6.abrupt("return", res.status(400).json({
            success: false,
            message: "ID đánh giá không hợp lệ"
          }));
        case 28:
          _context6.next = 30;
          return _Review["default"].findById(reviewId);
        case 30:
          _review = _context6.sent;
          if (_review) {
            _context6.next = 33;
            break;
          }
          return _context6.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy đánh giá"
          }));
        case 33:
          // Lưu productId trước khi cập nhật
          _productId = _review.productId; // Cập nhật trạng thái hiển thị
          _review.isPublished = !_review.isPublished;
          _context6.next = 37;
          return _review.save();
        case 37:
          _context6.next = 39;
          return _Review["default"].calculateAverageRating(_productId);
        case 39:
          return _context6.abrupt("return", res.status(200).json({
            success: true,
            message: "\u0110\xE1nh gi\xE1 \u0111\xE3 \u0111\u01B0\u1EE3c ".concat(_review.isPublished ? 'hiển thị' : 'ẩn', " th\xE0nh c\xF4ng"),
            data: _review
          }));
        case 42:
          _context6.prev = 42;
          _context6.t0 = _context6["catch"](22);
          console.error("Lỗi xác thực token:", _context6.t0);
          return _context6.abrupt("return", res.status(401).json({
            success: false,
            message: "Token không hợp lệ hoặc đã hết hạn",
            error: _context6.t0.message
          }));
        case 46:
          _context6.next = 52;
          break;
        case 48:
          _context6.prev = 48;
          _context6.t1 = _context6["catch"](0);
          console.error("Lỗi khi cập nhật trạng thái đánh giá:", _context6.t1);
          return _context6.abrupt("return", res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi cập nhật trạng thái đánh giá",
            error: _context6.t1.message
          }));
        case 52:
        case "end":
          return _context6.stop();
      }
    }, _callee6, null, [[0, 48], [22, 42]]);
  }));
  return function toggleReviewPublishStatus(_x1, _x10) {
    return _ref6.apply(this, arguments);
  };
}();

// Thêm phản hồi cho đánh giá
var replyToReview = exports.replyToReview = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(req, res) {
    var reviewId, text, token, _review2, adminId, _reply, decodedToken, userId, review, user, isAdmin, reply;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          reviewId = req.params.reviewId;
          text = req.body.text;
          console.log("Request body:", req.body);
          if (!(!text || !text.trim())) {
            _context7.next = 6;
            break;
          }
          return _context7.abrupt("return", res.status(400).json({
            success: false,
            message: "Nội dung phản hồi không được để trống"
          }));
        case 6:
          // Lấy token từ query parameter hoặc từ authorization header
          token = req.query.token || (0, _tokenExtractor.getTokenFrom)(req);
          console.log("Token from request:", token);
          if (token) {
            _context7.next = 10;
            break;
          }
          return _context7.abrupt("return", res.status(401).json({
            success: false,
            message: "Không có quyền trả lời đánh giá"
          }));
        case 10:
          if (!(token === "admin-token-for-TKhiem")) {
            _context7.next = 34;
            break;
          }
          if (_mongoose["default"].Types.ObjectId.isValid(reviewId)) {
            _context7.next = 13;
            break;
          }
          return _context7.abrupt("return", res.status(400).json({
            success: false,
            message: "ID đánh giá không hợp lệ"
          }));
        case 13:
          _context7.next = 15;
          return _Review["default"].findById(reviewId);
        case 15:
          _review2 = _context7.sent;
          if (_review2) {
            _context7.next = 18;
            break;
          }
          return _context7.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy đánh giá"
          }));
        case 18:
          // Tạo phản hồi mới với vai trò admin - sử dụng ID hợp lệ
          adminId = new _mongoose["default"].Types.ObjectId("65f62e09ac3ea4ad23023293"); // Sử dụng ID admin cố định
          _reply = {
            userId: adminId,
            // Sử dụng ObjectId hợp lệ
            userName: "Admin",
            text: text.trim(),
            isAdmin: true
          }; // Thêm phản hồi vào danh sách
          _review2.replies.push(_reply);
          _context7.next = 23;
          return _review2.save();
        case 23:
          if (!(_reply.isAdmin && _review2.userId)) {
            _context7.next = 33;
            break;
          }
          _context7.prev = 24;
          _context7.next = 27;
          return (0, _notificationService.sendReviewReplyNotification)(_review2.userId, _review2, text)["catch"](function (error) {
            return console.error('Error sending review reply notification:', error);
          });
        case 27:
          console.log("\u0110\xE3 g\u1EEDi th\xF4ng b\xE1o ph\u1EA3n h\u1ED3i \u0111\xE1nh gi\xE1 \u0111\u1EBFn user ".concat(_review2.userId));
          _context7.next = 33;
          break;
        case 30:
          _context7.prev = 30;
          _context7.t0 = _context7["catch"](24);
          console.error('Lỗi khi gửi thông báo phản hồi đánh giá:', _context7.t0);
          // Không ảnh hưởng đến việc trả về response
        case 33:
          return _context7.abrupt("return", res.status(201).json({
            success: true,
            message: "Đã thêm phản hồi thành công",
            data: _review2
          }));
        case 34:
          _context7.prev = 34;
          decodedToken = _jsonwebtoken["default"].verify(token, JWT_SECRET);
          if (decodedToken.id) {
            _context7.next = 38;
            break;
          }
          return _context7.abrupt("return", res.status(401).json({
            success: false,
            message: "Token không hợp lệ"
          }));
        case 38:
          _context7.next = 44;
          break;
        case 40:
          _context7.prev = 40;
          _context7.t1 = _context7["catch"](34);
          console.error("Lỗi xác thực token:", _context7.t1);
          return _context7.abrupt("return", res.status(401).json({
            success: false,
            message: "Token không hợp lệ hoặc đã hết hạn",
            error: _context7.t1.message
          }));
        case 44:
          userId = decodedToken.id;
          console.log("User ID from token:", userId);

          // Kiểm tra xem đánh giá có tồn tại không
          if (_mongoose["default"].Types.ObjectId.isValid(reviewId)) {
            _context7.next = 48;
            break;
          }
          return _context7.abrupt("return", res.status(400).json({
            success: false,
            message: "ID đánh giá không hợp lệ"
          }));
        case 48:
          _context7.next = 50;
          return _Review["default"].findById(reviewId);
        case 50:
          review = _context7.sent;
          if (review) {
            _context7.next = 53;
            break;
          }
          return _context7.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy đánh giá"
          }));
        case 53:
          _context7.next = 55;
          return _Register["default"].findById(userId);
        case 55:
          user = _context7.sent;
          if (user) {
            _context7.next = 58;
            break;
          }
          return _context7.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy người dùng"
          }));
        case 58:
          // Bỏ kiểm tra quyền trả lời - cho phép bất kỳ người dùng nào đã đăng nhập đều có thể trả lời
          // Vẫn phân biệt vai trò admin/người dùng để hiển thị khác nhau
          isAdmin = decodedToken.isAdmin || decodedToken.role === 'admin'; // Tạo phản hồi mới
          reply = {
            userId: userId,
            userName: isAdmin ? 'Admin' : "".concat(user.firstName, " ").concat(user.lastName),
            text: text.trim(),
            isAdmin: isAdmin
          };
          if (isAdmin) {
            reply.adminId = userId;
          }

          // In ra thông tin phản hồi trước khi lưu
          console.log("Reply to be added:", reply);

          // Thêm phản hồi vào danh sách
          review.replies.push(reply);
          _context7.next = 65;
          return review.save();
        case 65:
          if (!(isAdmin && review.userId)) {
            _context7.next = 75;
            break;
          }
          _context7.prev = 66;
          _context7.next = 69;
          return (0, _notificationService.sendReviewReplyNotification)(review.userId, review, text)["catch"](function (error) {
            return console.error('Error sending review reply notification:', error);
          });
        case 69:
          console.log("\u0110\xE3 g\u1EEDi th\xF4ng b\xE1o ph\u1EA3n h\u1ED3i \u0111\xE1nh gi\xE1 \u0111\u1EBFn user ".concat(review.userId));
          _context7.next = 75;
          break;
        case 72:
          _context7.prev = 72;
          _context7.t2 = _context7["catch"](66);
          console.error('Lỗi khi gửi thông báo phản hồi đánh giá:', _context7.t2);
          // Không ảnh hưởng đến việc trả về response
        case 75:
          return _context7.abrupt("return", res.status(201).json({
            success: true,
            message: "Đã thêm phản hồi thành công",
            data: review
          }));
        case 78:
          _context7.prev = 78;
          _context7.t3 = _context7["catch"](0);
          console.error("Lỗi khi thêm phản hồi cho đánh giá:", _context7.t3);
          return _context7.abrupt("return", res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi thêm phản hồi",
            error: _context7.t3.message
          }));
        case 82:
        case "end":
          return _context7.stop();
      }
    }, _callee7, null, [[0, 78], [24, 30], [34, 40], [66, 72]]);
  }));
  return function replyToReview(_x11, _x12) {
    return _ref7.apply(this, arguments);
  };
}();

// Chỉnh sửa phản hồi
var editReply = exports.editReply = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(req, res) {
    var _req$params, reviewId, replyId, text, token, _review3, _reply2, decodedToken, userId, review, reply, isAdmin, isOwner;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          _req$params = req.params, reviewId = _req$params.reviewId, replyId = _req$params.replyId;
          text = req.body.text;
          if (!(!text || !text.trim())) {
            _context8.next = 5;
            break;
          }
          return _context8.abrupt("return", res.status(400).json({
            success: false,
            message: "Nội dung phản hồi không được để trống"
          }));
        case 5:
          // Lấy token từ query parameter hoặc từ authorization header
          token = req.query.token || (0, _tokenExtractor.getTokenFrom)(req);
          console.log("Token from request:", token);
          if (token) {
            _context8.next = 9;
            break;
          }
          return _context8.abrupt("return", res.status(401).json({
            success: false,
            message: "Không có quyền chỉnh sửa phản hồi"
          }));
        case 9:
          if (!(token === "admin-token-for-TKhiem")) {
            _context8.next = 24;
            break;
          }
          if (_mongoose["default"].Types.ObjectId.isValid(reviewId)) {
            _context8.next = 12;
            break;
          }
          return _context8.abrupt("return", res.status(400).json({
            success: false,
            message: "ID đánh giá không hợp lệ"
          }));
        case 12:
          _context8.next = 14;
          return _Review["default"].findById(reviewId);
        case 14:
          _review3 = _context8.sent;
          if (_review3) {
            _context8.next = 17;
            break;
          }
          return _context8.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy đánh giá"
          }));
        case 17:
          // Tìm phản hồi cần chỉnh sửa
          _reply2 = _review3.replies.id(replyId);
          if (_reply2) {
            _context8.next = 20;
            break;
          }
          return _context8.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy phản hồi"
          }));
        case 20:
          // Cập nhật phản hồi với quyền admin
          _reply2.text = text.trim();
          _context8.next = 23;
          return _review3.save();
        case 23:
          return _context8.abrupt("return", res.status(200).json({
            success: true,
            message: "Đã cập nhật phản hồi thành công",
            data: _review3
          }));
        case 24:
          _context8.prev = 24;
          decodedToken = _jsonwebtoken["default"].verify(token, JWT_SECRET);
          if (decodedToken.id) {
            _context8.next = 28;
            break;
          }
          return _context8.abrupt("return", res.status(401).json({
            success: false,
            message: "Token không hợp lệ"
          }));
        case 28:
          _context8.next = 34;
          break;
        case 30:
          _context8.prev = 30;
          _context8.t0 = _context8["catch"](24);
          console.error("Lỗi xác thực token:", _context8.t0);
          return _context8.abrupt("return", res.status(401).json({
            success: false,
            message: "Token không hợp lệ hoặc đã hết hạn",
            error: _context8.t0.message
          }));
        case 34:
          userId = decodedToken.id; // Kiểm tra xem đánh giá có tồn tại không
          if (_mongoose["default"].Types.ObjectId.isValid(reviewId)) {
            _context8.next = 37;
            break;
          }
          return _context8.abrupt("return", res.status(400).json({
            success: false,
            message: "ID đánh giá không hợp lệ"
          }));
        case 37:
          _context8.next = 39;
          return _Review["default"].findById(reviewId);
        case 39:
          review = _context8.sent;
          if (review) {
            _context8.next = 42;
            break;
          }
          return _context8.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy đánh giá"
          }));
        case 42:
          // Tìm phản hồi cần chỉnh sửa
          reply = review.replies.id(replyId);
          if (reply) {
            _context8.next = 45;
            break;
          }
          return _context8.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy phản hồi"
          }));
        case 45:
          // Kiểm tra quyền chỉnh sửa (chỉ cho phép người viết phản hồi hoặc admin)
          isAdmin = decodedToken.isAdmin || decodedToken.role === 'admin';
          isOwner = reply.userId.toString() === userId;
          if (!(!isAdmin && !isOwner)) {
            _context8.next = 49;
            break;
          }
          return _context8.abrupt("return", res.status(403).json({
            success: false,
            message: "Bạn không có quyền chỉnh sửa phản hồi này"
          }));
        case 49:
          // Cập nhật phản hồi
          reply.text = text.trim();
          _context8.next = 52;
          return review.save();
        case 52:
          return _context8.abrupt("return", res.status(200).json({
            success: true,
            message: "Đã cập nhật phản hồi thành công",
            data: review
          }));
        case 55:
          _context8.prev = 55;
          _context8.t1 = _context8["catch"](0);
          console.error("Lỗi khi chỉnh sửa phản hồi:", _context8.t1);
          return _context8.abrupt("return", res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi chỉnh sửa phản hồi",
            error: _context8.t1.message
          }));
        case 59:
        case "end":
          return _context8.stop();
      }
    }, _callee8, null, [[0, 55], [24, 30]]);
  }));
  return function editReply(_x13, _x14) {
    return _ref8.apply(this, arguments);
  };
}();

// Xóa phản hồi
var deleteReply = exports.deleteReply = /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee9(req, res) {
    var _req$params2, reviewId, replyId, token, _review4, _reply3, decodedToken, userId, review, reply, isAdmin, isOwner;
    return _regeneratorRuntime().wrap(function _callee9$(_context9) {
      while (1) switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          _req$params2 = req.params, reviewId = _req$params2.reviewId, replyId = _req$params2.replyId; // Lấy token từ query parameter hoặc từ authorization header
          token = req.query.token || (0, _tokenExtractor.getTokenFrom)(req);
          console.log("Token from request:", token);
          if (token) {
            _context9.next = 6;
            break;
          }
          return _context9.abrupt("return", res.status(401).json({
            success: false,
            message: "Không có quyền xóa phản hồi"
          }));
        case 6:
          if (!(token === "admin-token-for-TKhiem")) {
            _context9.next = 21;
            break;
          }
          if (_mongoose["default"].Types.ObjectId.isValid(reviewId)) {
            _context9.next = 9;
            break;
          }
          return _context9.abrupt("return", res.status(400).json({
            success: false,
            message: "ID đánh giá không hợp lệ"
          }));
        case 9:
          _context9.next = 11;
          return _Review["default"].findById(reviewId);
        case 11:
          _review4 = _context9.sent;
          if (_review4) {
            _context9.next = 14;
            break;
          }
          return _context9.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy đánh giá"
          }));
        case 14:
          // Tìm phản hồi cần xóa
          _reply3 = _review4.replies.id(replyId);
          if (_reply3) {
            _context9.next = 17;
            break;
          }
          return _context9.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy phản hồi"
          }));
        case 17:
          // Xóa phản hồi với quyền admin
          _review4.replies.pull(replyId);
          _context9.next = 20;
          return _review4.save();
        case 20:
          return _context9.abrupt("return", res.status(200).json({
            success: true,
            message: "Đã xóa phản hồi thành công"
          }));
        case 21:
          _context9.prev = 21;
          decodedToken = _jsonwebtoken["default"].verify(token, JWT_SECRET);
          if (decodedToken.id) {
            _context9.next = 25;
            break;
          }
          return _context9.abrupt("return", res.status(401).json({
            success: false,
            message: "Token không hợp lệ"
          }));
        case 25:
          _context9.next = 31;
          break;
        case 27:
          _context9.prev = 27;
          _context9.t0 = _context9["catch"](21);
          console.error("Lỗi xác thực token:", _context9.t0);
          return _context9.abrupt("return", res.status(401).json({
            success: false,
            message: "Token không hợp lệ hoặc đã hết hạn",
            error: _context9.t0.message
          }));
        case 31:
          userId = decodedToken.id; // Kiểm tra xem đánh giá có tồn tại không
          if (_mongoose["default"].Types.ObjectId.isValid(reviewId)) {
            _context9.next = 34;
            break;
          }
          return _context9.abrupt("return", res.status(400).json({
            success: false,
            message: "ID đánh giá không hợp lệ"
          }));
        case 34:
          _context9.next = 36;
          return _Review["default"].findById(reviewId);
        case 36:
          review = _context9.sent;
          if (review) {
            _context9.next = 39;
            break;
          }
          return _context9.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy đánh giá"
          }));
        case 39:
          // Tìm phản hồi cần xóa
          reply = review.replies.id(replyId);
          if (reply) {
            _context9.next = 42;
            break;
          }
          return _context9.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy phản hồi"
          }));
        case 42:
          // Kiểm tra quyền xóa (chỉ cho phép người viết phản hồi hoặc admin)
          isAdmin = decodedToken.isAdmin || decodedToken.role === 'admin';
          isOwner = reply.userId.toString() === userId;
          if (!(!isAdmin && !isOwner)) {
            _context9.next = 46;
            break;
          }
          return _context9.abrupt("return", res.status(403).json({
            success: false,
            message: "Bạn không có quyền xóa phản hồi này"
          }));
        case 46:
          // Xóa phản hồi
          review.replies.pull(replyId);
          _context9.next = 49;
          return review.save();
        case 49:
          return _context9.abrupt("return", res.status(200).json({
            success: true,
            message: "Đã xóa phản hồi thành công"
          }));
        case 52:
          _context9.prev = 52;
          _context9.t1 = _context9["catch"](0);
          console.error("Lỗi khi xóa phản hồi:", _context9.t1);
          return _context9.abrupt("return", res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xóa phản hồi",
            error: _context9.t1.message
          }));
        case 56:
        case "end":
          return _context9.stop();
      }
    }, _callee9, null, [[0, 52], [21, 27]]);
  }));
  return function deleteReply(_x15, _x16) {
    return _ref9.apply(this, arguments);
  };
}();