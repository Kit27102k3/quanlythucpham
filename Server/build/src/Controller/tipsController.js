"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateTip = exports.likeTip = exports.getTipsByCategory = exports.getTipById = exports.getFeaturedTips = exports.getAllTips = exports.deleteTip = exports.createTip = void 0;
var _Tips = _interopRequireDefault(require("../Model/Tips.js"));
var _cloudinary = _interopRequireDefault(require("../config/cloudinary.js"));
var _fs = _interopRequireDefault(require("fs"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
// Lấy tất cả mẹo hay
var getAllTips = exports.getAllTips = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(req, res) {
    var tips;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return _Tips["default"].find().sort({
            createdAt: -1
          });
        case 3:
          tips = _context.sent;
          res.status(200).json(tips);
          _context.next = 11;
          break;
        case 7:
          _context.prev = 7;
          _context.t0 = _context["catch"](0);
          console.error("Lỗi khi lấy danh sách mẹo:", _context.t0);
          res.status(500).json({
            message: "Lỗi khi lấy danh sách mẹo",
            error: _context.t0.message
          });
        case 11:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 7]]);
  }));
  return function getAllTips(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

// Lấy mẹo hay theo ID
var getTipById = exports.getTipById = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res) {
    var id, tip;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          id = req.params.id;
          _context2.next = 4;
          return _Tips["default"].findById(id);
        case 4:
          tip = _context2.sent;
          if (tip) {
            _context2.next = 7;
            break;
          }
          return _context2.abrupt("return", res.status(404).json({
            message: "Không tìm thấy mẹo"
          }));
        case 7:
          res.status(200).json(tip);
          _context2.next = 14;
          break;
        case 10:
          _context2.prev = 10;
          _context2.t0 = _context2["catch"](0);
          console.error("Lỗi khi lấy chi tiết mẹo:", _context2.t0);
          res.status(500).json({
            message: "Lỗi khi lấy chi tiết mẹo",
            error: _context2.t0.message
          });
        case 14:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 10]]);
  }));
  return function getTipById(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

// Lấy mẹo hay theo danh mục
var getTipsByCategory = exports.getTipsByCategory = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(req, res) {
    var category, tips;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          category = req.params.category;
          _context3.next = 4;
          return _Tips["default"].find({
            category: category
          }).sort({
            createdAt: -1
          });
        case 4:
          tips = _context3.sent;
          res.status(200).json(tips);
          _context3.next = 12;
          break;
        case 8:
          _context3.prev = 8;
          _context3.t0 = _context3["catch"](0);
          console.error("Lỗi khi lấy mẹo theo danh mục:", _context3.t0);
          res.status(500).json({
            message: "Lỗi khi lấy mẹo theo danh mục",
            error: _context3.t0.message
          });
        case 12:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[0, 8]]);
  }));
  return function getTipsByCategory(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();

// Tạo mẹo hay mới
var createTip = exports.createTip = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(req, res) {
    var imageUrl, result, tags, datePublished, newTip, savedTip;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          imageUrl = ""; // Xử lý upload ảnh nếu có
          if (!req.file) {
            _context4.next = 16;
            break;
          }
          _context4.prev = 3;
          _context4.next = 6;
          return _cloudinary["default"].uploader.upload(req.file.path, {
            folder: "tips",
            resource_type: "auto"
          });
        case 6:
          result = _context4.sent;
          imageUrl = result.secure_url;
          // Xóa file tạm sau khi đã upload
          _fs["default"].unlinkSync(req.file.path);
          _context4.next = 16;
          break;
        case 11:
          _context4.prev = 11;
          _context4.t0 = _context4["catch"](3);
          console.error("Lỗi khi upload ảnh:", _context4.t0);
          if (_fs["default"].existsSync(req.file.path)) {
            _fs["default"].unlinkSync(req.file.path);
          }
          return _context4.abrupt("return", res.status(500).json({
            message: "Lỗi khi upload ảnh",
            error: _context4.t0.message
          }));
        case 16:
          // Xử lý tags
          tags = [];
          if (req.body.tags) {
            try {
              tags = Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags);
            } catch (_unused) {
              tags = req.body.tags.split(",").map(function (tag) {
                return tag.trim();
              });
            }
          }

          // Format ngày xuất bản
          datePublished = req.body.datePublished ? new Date(req.body.datePublished) : new Date();
          newTip = new _Tips["default"]({
            title: req.body.title,
            category: req.body.category,
            image: imageUrl || req.body.image,
            content: req.body.content,
            author: req.body.author,
            authorTitle: req.body.authorTitle,
            tags: tags,
            likes: req.body.likes || 0,
            datePublished: datePublished,
            isFeatured: req.body.isFeatured === "true"
          });
          _context4.next = 22;
          return newTip.save();
        case 22:
          savedTip = _context4.sent;
          res.status(201).json(savedTip);
          _context4.next = 31;
          break;
        case 26:
          _context4.prev = 26;
          _context4.t1 = _context4["catch"](0);
          console.error("Lỗi khi tạo mẹo mới:", _context4.t1);
          // Xóa file tạm nếu có lỗi xảy ra
          if (req.file && _fs["default"].existsSync(req.file.path)) {
            _fs["default"].unlinkSync(req.file.path);
          }
          res.status(500).json({
            message: "Lỗi khi tạo mẹo mới",
            error: _context4.t1.message
          });
        case 31:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[0, 26], [3, 11]]);
  }));
  return function createTip(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();

// Cập nhật mẹo hay
var updateTip = exports.updateTip = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(req, res) {
    var id, existingTip, imageUrl, result, tags, datePublished, updatedTip;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          id = req.params.id; // Kiểm tra mẹo có tồn tại không
          _context5.next = 4;
          return _Tips["default"].findById(id);
        case 4:
          existingTip = _context5.sent;
          if (existingTip) {
            _context5.next = 7;
            break;
          }
          return _context5.abrupt("return", res.status(404).json({
            message: "Không tìm thấy mẹo"
          }));
        case 7:
          // Xử lý upload ảnh mới nếu có
          imageUrl = existingTip.image;
          if (!req.file) {
            _context5.next = 24;
            break;
          }
          _context5.prev = 9;
          _context5.next = 12;
          return _cloudinary["default"].uploader.upload(req.file.path, {
            folder: "tips",
            resource_type: "auto"
          });
        case 12:
          result = _context5.sent;
          imageUrl = result.secure_url;
          // Xóa file tạm sau khi đã upload
          _fs["default"].unlinkSync(req.file.path);
          _context5.next = 22;
          break;
        case 17:
          _context5.prev = 17;
          _context5.t0 = _context5["catch"](9);
          console.error("Lỗi khi upload ảnh:", _context5.t0);
          if (_fs["default"].existsSync(req.file.path)) {
            _fs["default"].unlinkSync(req.file.path);
          }
          return _context5.abrupt("return", res.status(500).json({
            message: "Lỗi khi upload ảnh",
            error: _context5.t0.message
          }));
        case 22:
          _context5.next = 25;
          break;
        case 24:
          if (req.body.image) {
            // Nếu có image URL trong request body
            imageUrl = req.body.image;
          }
        case 25:
          // Xử lý tags
          tags = existingTip.tags;
          if (req.body.tags) {
            try {
              tags = Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags);
            } catch (_unused2) {
              tags = req.body.tags.split(",").map(function (tag) {
                return tag.trim();
              });
            }
          }

          // Format ngày xuất bản
          datePublished = existingTip.datePublished;
          if (req.body.datePublished) {
            datePublished = new Date(req.body.datePublished);
          }
          _context5.next = 31;
          return _Tips["default"].findByIdAndUpdate(id, {
            title: req.body.title || existingTip.title,
            category: req.body.category || existingTip.category,
            image: imageUrl,
            content: req.body.content || existingTip.content,
            author: req.body.author || existingTip.author,
            authorTitle: req.body.authorTitle || existingTip.authorTitle,
            tags: tags,
            likes: req.body.likes !== undefined ? req.body.likes : existingTip.likes,
            datePublished: datePublished,
            isFeatured: req.body.isFeatured !== undefined ? req.body.isFeatured === "true" || req.body.isFeatured === true : existingTip.isFeatured
          }, {
            "new": true
          });
        case 31:
          updatedTip = _context5.sent;
          res.status(200).json(updatedTip);
          _context5.next = 40;
          break;
        case 35:
          _context5.prev = 35;
          _context5.t1 = _context5["catch"](0);
          console.error("Lỗi khi cập nhật mẹo:", _context5.t1);
          // Xóa file tạm nếu có lỗi xảy ra
          if (req.file && _fs["default"].existsSync(req.file.path)) {
            _fs["default"].unlinkSync(req.file.path);
          }
          res.status(500).json({
            message: "Lỗi khi cập nhật mẹo",
            error: _context5.t1.message
          });
        case 40:
        case "end":
          return _context5.stop();
      }
    }, _callee5, null, [[0, 35], [9, 17]]);
  }));
  return function updateTip(_x9, _x0) {
    return _ref5.apply(this, arguments);
  };
}();

// Xóa mẹo hay
var deleteTip = exports.deleteTip = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(req, res) {
    var id, tip;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          id = req.params.id;
          _context6.next = 4;
          return _Tips["default"].findByIdAndDelete(id);
        case 4:
          tip = _context6.sent;
          if (tip) {
            _context6.next = 7;
            break;
          }
          return _context6.abrupt("return", res.status(404).json({
            message: "Không tìm thấy mẹo"
          }));
        case 7:
          res.status(200).json({
            message: "Xóa mẹo thành công"
          });
          _context6.next = 14;
          break;
        case 10:
          _context6.prev = 10;
          _context6.t0 = _context6["catch"](0);
          console.error("Lỗi khi xóa mẹo:", _context6.t0);
          res.status(500).json({
            message: "Lỗi khi xóa mẹo",
            error: _context6.t0.message
          });
        case 14:
        case "end":
          return _context6.stop();
      }
    }, _callee6, null, [[0, 10]]);
  }));
  return function deleteTip(_x1, _x10) {
    return _ref6.apply(this, arguments);
  };
}();

// Tăng likes cho mẹo hay
var likeTip = exports.likeTip = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(req, res) {
    var id, tip;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          id = req.params.id;
          _context7.next = 4;
          return _Tips["default"].findById(id);
        case 4:
          tip = _context7.sent;
          if (tip) {
            _context7.next = 7;
            break;
          }
          return _context7.abrupt("return", res.status(404).json({
            message: "Không tìm thấy mẹo"
          }));
        case 7:
          tip.likes += 1;
          _context7.next = 10;
          return tip.save();
        case 10:
          res.status(200).json({
            likes: tip.likes
          });
          _context7.next = 17;
          break;
        case 13:
          _context7.prev = 13;
          _context7.t0 = _context7["catch"](0);
          console.error("Lỗi khi tăng like:", _context7.t0);
          res.status(500).json({
            message: "Lỗi khi tăng like",
            error: _context7.t0.message
          });
        case 17:
        case "end":
          return _context7.stop();
      }
    }, _callee7, null, [[0, 13]]);
  }));
  return function likeTip(_x11, _x12) {
    return _ref7.apply(this, arguments);
  };
}();

// Lấy các mẹo nổi bật
var getFeaturedTips = exports.getFeaturedTips = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(req, res) {
    var featuredTips;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          _context8.next = 3;
          return _Tips["default"].find({
            isFeatured: true
          }).sort({
            datePublished: -1
          });
        case 3:
          featuredTips = _context8.sent;
          res.status(200).json(featuredTips);
          _context8.next = 11;
          break;
        case 7:
          _context8.prev = 7;
          _context8.t0 = _context8["catch"](0);
          console.error("Lỗi khi lấy mẹo nổi bật:", _context8.t0);
          res.status(500).json({
            message: "Lỗi khi lấy mẹo nổi bật",
            error: _context8.t0.message
          });
        case 11:
        case "end":
          return _context8.stop();
      }
    }, _callee8, null, [[0, 7]]);
  }));
  return function getFeaturedTips(_x13, _x14) {
    return _ref8.apply(this, arguments);
  };
}();