"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateReview = exports.replyToReview = exports.recalculateAllReviewStats = exports.getProductReviews = exports.getProductReviewStats = exports.deleteReview = exports.createReview = void 0;
var _Review = _interopRequireDefault(require("../../Model/Review.js"));
var _Products = _interopRequireDefault(require("../../Model/Products.js"));
var _User = _interopRequireDefault(require("../../Model/User.js"));
var _ReviewStats = _interopRequireDefault(require("../../Model/ReviewStats.js"));
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
// Tạo đánh giá mới
var createReview = exports.createReview = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(req, res) {
    var _req$body, productId, rating, comment, userId, product, existingReview, user, newReview;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _req$body = req.body, productId = _req$body.productId, rating = _req$body.rating, comment = _req$body.comment;
          userId = req.user.id; // Kiểm tra xem sản phẩm có tồn tại không
          _context.next = 5;
          return _Products["default"].findById(productId);
        case 5:
          product = _context.sent;
          if (product) {
            _context.next = 8;
            break;
          }
          return _context.abrupt("return", res.status(404).json({
            message: "Không tìm thấy sản phẩm"
          }));
        case 8:
          _context.next = 10;
          return _Review["default"].findOne({
            userId: userId,
            productId: productId
          });
        case 10:
          existingReview = _context.sent;
          if (!existingReview) {
            _context.next = 13;
            break;
          }
          return _context.abrupt("return", res.status(400).json({
            message: "Bạn đã đánh giá sản phẩm này rồi"
          }));
        case 13:
          _context.next = 15;
          return _User["default"].findById(userId);
        case 15:
          user = _context.sent;
          if (user) {
            _context.next = 18;
            break;
          }
          return _context.abrupt("return", res.status(404).json({
            message: "Không tìm thấy thông tin người dùng"
          }));
        case 18:
          // Tạo đánh giá mới
          newReview = new _Review["default"]({
            userId: userId,
            productId: productId,
            rating: rating,
            comment: comment,
            userName: user.username || "".concat(user.firstName, " ").concat(user.lastName),
            userImage: user.avatar || "",
            // Kiểm tra xem người dùng đã mua sản phẩm chưa (có thể làm phức tạp hơn sau)
            isVerified: true
          }); // Lưu đánh giá
          _context.next = 21;
          return newReview.save();
        case 21:
          _context.next = 23;
          return _ReviewStats["default"].updateReviewStats(productId);
        case 23:
          res.status(201).json({
            success: true,
            data: newReview,
            message: "Đánh giá sản phẩm thành công"
          });
          _context.next = 30;
          break;
        case 26:
          _context.prev = 26;
          _context.t0 = _context["catch"](0);
          console.error("Lỗi khi tạo đánh giá:", _context.t0);
          res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi tạo đánh giá",
            error: _context.t0.message
          });
        case 30:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 26]]);
  }));
  return function createReview(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

// Lấy tất cả đánh giá của một sản phẩm
var getProductReviews = exports.getProductReviews = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res) {
    var _stats, _stats2, _stats3, _stats4, productId, _req$query, _req$query$page, page, _req$query$limit, limit, _req$query$sort, sort, reviews, totalReviews, stats;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          productId = req.params.productId;
          _req$query = req.query, _req$query$page = _req$query.page, page = _req$query$page === void 0 ? 1 : _req$query$page, _req$query$limit = _req$query.limit, limit = _req$query$limit === void 0 ? 10 : _req$query$limit, _req$query$sort = _req$query.sort, sort = _req$query$sort === void 0 ? "-createdAt" : _req$query$sort; // Xác thực productId
          if (_mongoose["default"].Types.ObjectId.isValid(productId)) {
            _context2.next = 5;
            break;
          }
          return _context2.abrupt("return", res.status(400).json({
            success: false,
            message: "ID sản phẩm không hợp lệ"
          }));
        case 5:
          _context2.next = 7;
          return _Review["default"].find({
            productId: productId,
            isPublished: true
          }).sort(sort).skip((page - 1) * limit).limit(parseInt(limit)).populate("userId", "username firstName lastName avatar");
        case 7:
          reviews = _context2.sent;
          _context2.next = 10;
          return _Review["default"].countDocuments({
            productId: productId,
            isPublished: true
          });
        case 10:
          totalReviews = _context2.sent;
          _context2.next = 13;
          return _ReviewStats["default"].findOne({
            productId: productId
          });
        case 13:
          stats = _context2.sent;
          if (stats) {
            _context2.next = 18;
            break;
          }
          _context2.next = 17;
          return _ReviewStats["default"].updateReviewStats(productId);
        case 17:
          stats = _context2.sent;
        case 18:
          res.status(200).json({
            success: true,
            data: {
              reviews: reviews,
              totalReviews: totalReviews,
              stats: {
                averageRating: ((_stats = stats) === null || _stats === void 0 ? void 0 : _stats.averageRating) || 0,
                totalReviews: ((_stats2 = stats) === null || _stats2 === void 0 ? void 0 : _stats2.totalReviews) || 0,
                ratingDistribution: ((_stats3 = stats) === null || _stats3 === void 0 ? void 0 : _stats3.ratingDistribution) || {
                  1: 0,
                  2: 0,
                  3: 0,
                  4: 0,
                  5: 0
                },
                percentages: ((_stats4 = stats) === null || _stats4 === void 0 ? void 0 : _stats4.getStarPercentages()) || {
                  oneStar: 0,
                  twoStar: 0,
                  threeStar: 0,
                  fourStar: 0,
                  fiveStar: 0
                }
              },
              pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalReviews / limit),
                totalItems: totalReviews,
                itemsPerPage: parseInt(limit)
              }
            },
            message: "Lấy danh sách đánh giá thành công"
          });
          _context2.next = 25;
          break;
        case 21:
          _context2.prev = 21;
          _context2.t0 = _context2["catch"](0);
          console.error("Lỗi khi lấy đánh giá:", _context2.t0);
          res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy đánh giá",
            error: _context2.t0.message
          });
        case 25:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 21]]);
  }));
  return function getProductReviews(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

// Cập nhật đánh giá
var updateReview = exports.updateReview = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(req, res) {
    var id, _req$body2, rating, comment, userId, review;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          id = req.params.id;
          _req$body2 = req.body, rating = _req$body2.rating, comment = _req$body2.comment;
          userId = req.user.id; // Tìm đánh giá
          _context3.next = 6;
          return _Review["default"].findById(id);
        case 6:
          review = _context3.sent;
          if (review) {
            _context3.next = 9;
            break;
          }
          return _context3.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy đánh giá"
          }));
        case 9:
          if (!(review.userId.toString() !== userId)) {
            _context3.next = 11;
            break;
          }
          return _context3.abrupt("return", res.status(403).json({
            success: false,
            message: "Bạn không có quyền cập nhật đánh giá này"
          }));
        case 11:
          // Cập nhật đánh giá
          review.rating = rating || review.rating;
          review.comment = comment || review.comment;
          _context3.next = 15;
          return review.save();
        case 15:
          _context3.next = 17;
          return _ReviewStats["default"].updateReviewStats(review.productId);
        case 17:
          res.status(200).json({
            success: true,
            data: review,
            message: "Cập nhật đánh giá thành công"
          });
          _context3.next = 24;
          break;
        case 20:
          _context3.prev = 20;
          _context3.t0 = _context3["catch"](0);
          console.error("Lỗi khi cập nhật đánh giá:", _context3.t0);
          res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi cập nhật đánh giá",
            error: _context3.t0.message
          });
        case 24:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[0, 20]]);
  }));
  return function updateReview(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();

// Xóa đánh giá
var deleteReview = exports.deleteReview = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(req, res) {
    var id, userId, review, productId;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          id = req.params.id;
          userId = req.user.id; // Tìm đánh giá
          _context4.next = 5;
          return _Review["default"].findById(id);
        case 5:
          review = _context4.sent;
          if (review) {
            _context4.next = 8;
            break;
          }
          return _context4.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy đánh giá"
          }));
        case 8:
          if (!(review.userId.toString() !== userId && req.user.role !== "admin")) {
            _context4.next = 10;
            break;
          }
          return _context4.abrupt("return", res.status(403).json({
            success: false,
            message: "Bạn không có quyền xóa đánh giá này"
          }));
        case 10:
          // Lưu lại productId trước khi xóa
          productId = review.productId; // Xóa đánh giá
          _context4.next = 13;
          return review.remove();
        case 13:
          _context4.next = 15;
          return _ReviewStats["default"].updateReviewStats(productId);
        case 15:
          res.status(200).json({
            success: true,
            message: "Xóa đánh giá thành công"
          });
          _context4.next = 22;
          break;
        case 18:
          _context4.prev = 18;
          _context4.t0 = _context4["catch"](0);
          console.error("Lỗi khi xóa đánh giá:", _context4.t0);
          res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi xóa đánh giá",
            error: _context4.t0.message
          });
        case 22:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[0, 18]]);
  }));
  return function deleteReview(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();

// Phản hồi đánh giá (dành cho admin)
var replyToReview = exports.replyToReview = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(req, res) {
    var id, text, userId, isAdmin, review, user, reply;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          id = req.params.id;
          text = req.body.text;
          userId = req.user.id;
          isAdmin = req.user.role === "admin";
          if (text) {
            _context5.next = 7;
            break;
          }
          return _context5.abrupt("return", res.status(400).json({
            success: false,
            message: "Nội dung phản hồi không được để trống"
          }));
        case 7:
          _context5.next = 9;
          return _Review["default"].findById(id);
        case 9:
          review = _context5.sent;
          if (review) {
            _context5.next = 12;
            break;
          }
          return _context5.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy đánh giá"
          }));
        case 12:
          _context5.next = 14;
          return _User["default"].findById(userId);
        case 14:
          user = _context5.sent;
          if (user) {
            _context5.next = 17;
            break;
          }
          return _context5.abrupt("return", res.status(404).json({
            success: false,
            message: "Không tìm thấy thông tin người dùng"
          }));
        case 17:
          // Tạo phản hồi mới
          reply = {
            userId: userId,
            adminId: isAdmin ? userId : null,
            userName: user.username || "".concat(user.firstName, " ").concat(user.lastName),
            text: text,
            isAdmin: isAdmin
          }; // Thêm phản hồi vào mảng replies
          review.replies.push(reply);
          _context5.next = 21;
          return review.save();
        case 21:
          res.status(201).json({
            success: true,
            data: review,
            message: "Phản hồi đánh giá thành công"
          });
          _context5.next = 28;
          break;
        case 24:
          _context5.prev = 24;
          _context5.t0 = _context5["catch"](0);
          console.error("Lỗi khi phản hồi đánh giá:", _context5.t0);
          res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi phản hồi đánh giá",
            error: _context5.t0.message
          });
        case 28:
        case "end":
          return _context5.stop();
      }
    }, _callee5, null, [[0, 24]]);
  }));
  return function replyToReview(_x9, _x0) {
    return _ref5.apply(this, arguments);
  };
}();

// Lấy thống kê đánh giá của sản phẩm
var getProductReviewStats = exports.getProductReviewStats = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(req, res) {
    var productId, stats;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          productId = req.params.productId; // Xác thực productId
          if (_mongoose["default"].Types.ObjectId.isValid(productId)) {
            _context6.next = 4;
            break;
          }
          return _context6.abrupt("return", res.status(400).json({
            success: false,
            message: "ID sản phẩm không hợp lệ"
          }));
        case 4:
          _context6.next = 6;
          return _ReviewStats["default"].findOne({
            productId: productId
          });
        case 6:
          stats = _context6.sent;
          if (stats) {
            _context6.next = 11;
            break;
          }
          _context6.next = 10;
          return _ReviewStats["default"].updateReviewStats(productId);
        case 10:
          stats = _context6.sent;
        case 11:
          if (stats) {
            _context6.next = 13;
            break;
          }
          return _context6.abrupt("return", res.status(200).json({
            success: true,
            data: {
              averageRating: 0,
              totalReviews: 0,
              ratingDistribution: {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0
              },
              percentages: {
                oneStar: 0,
                twoStar: 0,
                threeStar: 0,
                fourStar: 0,
                fiveStar: 0
              }
            },
            message: "Không có đánh giá nào cho sản phẩm này"
          }));
        case 13:
          res.status(200).json({
            success: true,
            data: {
              averageRating: stats.averageRating,
              totalReviews: stats.totalReviews,
              verifiedReviews: stats.verifiedReviews,
              ratingDistribution: stats.ratingDistribution,
              percentages: stats.getStarPercentages(),
              lastUpdated: stats.lastUpdated
            },
            message: "Lấy thống kê đánh giá thành công"
          });
          _context6.next = 20;
          break;
        case 16:
          _context6.prev = 16;
          _context6.t0 = _context6["catch"](0);
          console.error("Lỗi khi lấy thống kê đánh giá:", _context6.t0);
          res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy thống kê đánh giá",
            error: _context6.t0.message
          });
        case 20:
        case "end":
          return _context6.stop();
      }
    }, _callee6, null, [[0, 16]]);
  }));
  return function getProductReviewStats(_x1, _x10) {
    return _ref6.apply(this, arguments);
  };
}();

// Cập nhật lại tất cả thống kê đánh giá (route dành cho admin)
var recalculateAllReviewStats = exports.recalculateAllReviewStats = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(req, res) {
    var productsWithReviews, results;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          if (!(req.user.role !== "admin")) {
            _context8.next = 3;
            break;
          }
          return _context8.abrupt("return", res.status(403).json({
            success: false,
            message: "Bạn không có quyền thực hiện tác vụ này"
          }));
        case 3:
          _context8.next = 5;
          return _Review["default"].distinct("productId");
        case 5:
          productsWithReviews = _context8.sent;
          _context8.next = 8;
          return Promise.all(productsWithReviews.map(/*#__PURE__*/function () {
            var _ref8 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(productId) {
              var stats;
              return _regeneratorRuntime().wrap(function _callee7$(_context7) {
                while (1) switch (_context7.prev = _context7.next) {
                  case 0:
                    _context7.next = 2;
                    return _ReviewStats["default"].updateReviewStats(productId);
                  case 2:
                    stats = _context7.sent;
                    return _context7.abrupt("return", {
                      productId: productId,
                      success: !!stats
                    });
                  case 4:
                  case "end":
                    return _context7.stop();
                }
              }, _callee7);
            }));
            return function (_x13) {
              return _ref8.apply(this, arguments);
            };
          }()));
        case 8:
          results = _context8.sent;
          res.status(200).json({
            success: true,
            data: {
              totalUpdated: results.filter(function (r) {
                return r.success;
              }).length,
              totalProducts: results.length,
              results: results
            },
            message: "Cập nhật lại tất cả thống kê đánh giá thành công"
          });
          _context8.next = 16;
          break;
        case 12:
          _context8.prev = 12;
          _context8.t0 = _context8["catch"](0);
          console.error("Lỗi khi cập nhật lại tất cả thống kê đánh giá:", _context8.t0);
          res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi cập nhật lại tất cả thống kê đánh giá",
            error: _context8.t0.message
          });
        case 16:
        case "end":
          return _context8.stop();
      }
    }, _callee8, null, [[0, 12]]);
  }));
  return function recalculateAllReviewStats(_x11, _x12) {
    return _ref7.apply(this, arguments);
  };
}();