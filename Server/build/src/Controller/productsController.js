"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateProductCategory = exports.updateProduct = exports.searchProducts = exports.getProductBySlug = exports.getProductById = exports.getProductByCategory = exports.getBestSellingProducts = exports.getAllProducts = exports.deleteProduct = exports.createProduct = void 0;
var _cloudinary = _interopRequireDefault(require("../config/cloudinary.js"));
var _Products = _interopRequireDefault(require("../Model/Products.js"));
var _Categories = _interopRequireDefault(require("../Model/Categories.js"));
var _BestSellingProduct = _interopRequireDefault(require("../Model/BestSellingProduct.js"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _mongoose = _interopRequireDefault(require("mongoose"));
var _adminModel = _interopRequireDefault(require("../Model/adminModel.js"));
var _notificationService = require("../Services/notificationService.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } /*************  ✨ Windsurf Command 🌟  *************/ /* eslint-disable no-unused-vars */ /* eslint-disable no-undef */ // Import Admin model
// Import notification service

var createProduct = exports.createProduct = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(req, res) {
    var category, uploadedUrls, descriptions, discountStartDate, discountEndDate, newProduct, savedProduct, adminsToNotify, notificationPayload, _iterator, _step, admin, _iterator2, _step2, subscription, productToSend;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          if (!(!req.body.imageUrls || req.body.imageUrls.length === 0)) {
            _context.next = 3;
            break;
          }
          return _context.abrupt("return", res.status(400).json({
            message: "Vui lòng tải lên ít nhất một hình ảnh"
          }));
        case 3:
          _context.next = 5;
          return _Categories["default"].findOne({
            nameCategory: req.body.productCategory
          });
        case 5:
          category = _context.sent;
          if (category) {
            _context.next = 8;
            break;
          }
          return _context.abrupt("return", res.status(400).json({
            message: "Danh mục sản phẩm không tồn tại"
          }));
        case 8:
          // Sử dụng URLs đã được upload thông qua Cloudinary widget
          uploadedUrls = Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [req.body.imageUrls];
          descriptions = [];
          try {
            descriptions = typeof req.body.productDescription === "string" ? JSON.parse(req.body.productDescription) : req.body.productDescription;
          } catch (_unused) {
            descriptions = req.body.productDescription.split(",");
          }

          // Xử lý thông tin ngày bắt đầu và kết thúc giảm giá
          discountStartDate = null;
          discountEndDate = null;
          if (req.body.discountStartDate) {
            discountStartDate = new Date(req.body.discountStartDate);
          }
          if (req.body.discountEndDate) {
            discountEndDate = new Date(req.body.discountEndDate);
          }
          newProduct = new _Products["default"](_objectSpread(_objectSpread({}, req.body), {}, {
            productImages: uploadedUrls,
            productDescription: descriptions,
            productPrice: Number(req.body.productPrice),
            productDiscount: Number(req.body.productDiscount) || 0,
            productStock: Number(req.body.productStock) || 0,
            productWeight: Number(req.body.productWeight) || 0,
            productCategory: category.nameCategory,
            productUnit: req.body.productUnit || "gram",
            discountStartDate: discountStartDate,
            discountEndDate: discountEndDate
          })); // Tính productPromoPrice từ productPrice và productDiscount
          if (newProduct.productDiscount > 0) {
            newProduct.productPromoPrice = newProduct.productPrice * (1 - newProduct.productDiscount / 100);
          }
          _context.next = 19;
          return newProduct.save();
        case 19:
          savedProduct = _context.sent;
          _context.next = 22;
          return _adminModel["default"].find({
            $or: [{
              role: 'admin'
            },
            // Admin gets all notifications
            {
              role: 'manager',
              permissions: {
                $in: ['Quản lý sản phẩm', 'products']
              }
            } // Managers with product permission
            // Add other roles/permissions if needed
            ],
            'pushSubscriptions.0': {
              $exists: true
            } // Only users with at least one subscription
          });
        case 22:
          adminsToNotify = _context.sent;
          notificationPayload = {
            title: 'Sản phẩm mới',
            body: "S\u1EA3n ph\u1EA9m \"".concat(savedProduct.productName, "\" \u0111\xE3 \u0111\u01B0\u1EE3c th\xEAm m\u1EDBi."),
            // Sử dụng tên sản phẩm
            data: {
              url: "/admin/products/edit/".concat(savedProduct._id),
              // URL để mở khi click (ví dụ: trang chi tiết sản phẩm admin)
              productId: savedProduct._id
            }
          };
          _iterator = _createForOfIteratorHelper(adminsToNotify);
          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              admin = _step.value;
              _iterator2 = _createForOfIteratorHelper(admin.pushSubscriptions);
              try {
                for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                  subscription = _step2.value;
                  // Use async/await here if you want to wait for each notification to be sent
                  // or use .catch() if you want to send them concurrently without waiting
                  (0, _notificationService.sendPushNotification)(admin._id, subscription, notificationPayload)["catch"](function (error) {
                    return console.error('Error sending notification:', error);
                  });
                }
              } catch (err) {
                _iterator2.e(err);
              } finally {
                _iterator2.f();
              }
            }
            // --- End Push Notification Logic ---

            // Chuyển đổi dữ liệu số thành chuỗi trước khi gửi về client
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
          productToSend = savedProduct.toObject();
          productToSend.productPrice = String(productToSend.productPrice);
          productToSend.productDiscount = String(productToSend.productDiscount);
          productToSend.productStock = String(productToSend.productStock);
          productToSend.productWeight = String(productToSend.productWeight);
          productToSend.productPromoPrice = String(productToSend.productPromoPrice);
          productToSend.productWarranty = String(productToSend.productWarranty);

          // Format discount dates
          if (productToSend.discountStartDate) {
            productToSend.discountStartDate = productToSend.discountStartDate.toISOString();
          }
          if (productToSend.discountEndDate) {
            productToSend.discountEndDate = productToSend.discountEndDate.toISOString();
          }
          return _context.abrupt("return", res.status(201).json(productToSend));
        case 38:
          _context.prev = 38;
          _context.t0 = _context["catch"](0);
          console.error("Error in createProduct:", _context.t0);
          return _context.abrupt("return", res.status(500).json({
            success: false,
            message: _context.t0.message,
            errorDetails: process.env.NODE_ENV === "development" ? _context.t0.stack : undefined
          }));
        case 42:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 38]]);
  }));
  return function createProduct(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();
var getAllProducts = exports.getAllProducts = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res) {
    var products, productsToSend;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return _Products["default"].find();
        case 3:
          products = _context2.sent;
          // Chuyển đổi dữ liệu số thành chuỗi
          productsToSend = products.map(function (product) {
            var productObj = product.toObject();
            productObj.productPrice = String(productObj.productPrice || "");
            productObj.productDiscount = String(productObj.productDiscount || "");
            productObj.productStock = String(productObj.productStock || "");
            productObj.productWeight = String(productObj.productWeight || "");
            productObj.productPromoPrice = String(productObj.productPromoPrice || "");
            productObj.productWarranty = String(productObj.productWarranty || "");
            return productObj;
          });
          res.status(200).json(productsToSend);
          _context2.next = 11;
          break;
        case 8:
          _context2.prev = 8;
          _context2.t0 = _context2["catch"](0);
          res.status(500).json({
            message: "Lấy danh sách sản phẩm thất bại",
            error: _context2.t0
          });
        case 11:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 8]]);
  }));
  return function getAllProducts(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();
var getProductBySlug = exports.getProductBySlug = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(req, res) {
    var slug, products, product, productToSend;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          slug = req.params.slug;
          _context3.prev = 1;
          _context3.next = 4;
          return _Products["default"].find();
        case 4:
          products = _context3.sent;
          product = products.find(function (p) {
            return p.productName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") === slug;
          });
          if (product) {
            _context3.next = 8;
            break;
          }
          return _context3.abrupt("return", res.status(404).json({
            message: "Không tìm thấy sản phẩm"
          }));
        case 8:
          // Chuyển đổi dữ liệu số thành chuỗi
          productToSend = product.toObject();
          productToSend.productPrice = String(productToSend.productPrice || "");
          productToSend.productDiscount = String(productToSend.productDiscount || "");
          productToSend.productStock = String(productToSend.productStock || "");
          productToSend.productWeight = String(productToSend.productWeight || "");
          productToSend.productPromoPrice = String(productToSend.productPromoPrice || "");
          productToSend.productWarranty = String(productToSend.productWarranty || "");
          res.status(200).json(productToSend);
          _context3.next = 21;
          break;
        case 18:
          _context3.prev = 18;
          _context3.t0 = _context3["catch"](1);
          res.status(500).json({
            message: "Lấy chi tiết sản phẩm thất bại",
            error: _context3.t0
          });
        case 21:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[1, 18]]);
  }));
  return function getProductBySlug(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();
var updateProduct = exports.updateProduct = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(req, res) {
    var id, product, category, newImageUrls, existingImages, keepImages, imagesToDelete, productDescription, discountStartDate, discountEndDate, updatedProduct, productToSend;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          id = req.params.id;
          _context4.prev = 1;
          _context4.next = 4;
          return _Products["default"].findById(id);
        case 4:
          product = _context4.sent;
          if (product) {
            _context4.next = 7;
            break;
          }
          return _context4.abrupt("return", res.status(404).json({
            message: "Không tìm thấy sản phẩm"
          }));
        case 7:
          if (!(req.body.productCategory && req.body.productCategory !== product.productCategory)) {
            _context4.next = 14;
            break;
          }
          _context4.next = 10;
          return _Categories["default"].findOne({
            nameCategory: req.body.productCategory
          });
        case 10:
          category = _context4.sent;
          if (category) {
            _context4.next = 13;
            break;
          }
          return _context4.abrupt("return", res.status(400).json({
            message: "Danh mục sản phẩm không tồn tại"
          }));
        case 13:
          req.body.productCategory = category.nameCategory;
        case 14:
          // Sử dụng URLs đã được upload thông qua Cloudinary widget
          newImageUrls = [];
          if (req.body.newImageUrls && req.body.newImageUrls.length > 0) {
            newImageUrls = Array.isArray(req.body.newImageUrls) ? req.body.newImageUrls : [req.body.newImageUrls];
          }
          existingImages = product.productImages || [];
          if (!req.body.keepImages) {
            _context4.next = 23;
            break;
          }
          keepImages = Array.isArray(req.body.keepImages) ? req.body.keepImages : JSON.parse(req.body.keepImages);
          existingImages = existingImages.filter(function (img) {
            return keepImages.includes(img);
          });
          imagesToDelete = product.productImages.filter(function (img) {
            return !keepImages.includes(img);
          }); // Xóa các ảnh không giữ lại
          _context4.next = 23;
          return Promise.all(imagesToDelete.map(function (img) {
            var publicId = img.split("/").pop().split(".")[0];
            return _cloudinary["default"].uploader.destroy("products/".concat(publicId));
          }));
        case 23:
          productDescription = product.productDescription;
          if (req.body.productDescription) {
            try {
              productDescription = JSON.parse(req.body.productDescription);
            } catch (_unused2) {
              productDescription = req.body.productDescription.split(".").map(function (desc) {
                return desc.trim();
              }).filter(function (desc) {
                return desc !== "";
              });
            }
          }

          // Xử lý thông tin ngày bắt đầu và kết thúc giảm giá
          discountStartDate = null;
          discountEndDate = null;
          if (req.body.discountStartDate) {
            discountStartDate = new Date(req.body.discountStartDate);
          }
          if (req.body.discountEndDate) {
            discountEndDate = new Date(req.body.discountEndDate);
          }
          _context4.next = 31;
          return _Products["default"].findByIdAndUpdate(id, _objectSpread(_objectSpread(_objectSpread({}, req.body), {}, {
            productImages: [].concat(_toConsumableArray(existingImages), _toConsumableArray(newImageUrls)),
            productDescription: productDescription,
            productPrice: Number(req.body.productPrice),
            productDiscount: Number(req.body.productDiscount) || 0,
            productStock: Number(req.body.productStock) || 0,
            productWeight: Number(req.body.productWeight) || 0,
            productWarranty: Number(req.body.productWarranty) || 0,
            productUnit: req.body.productUnit || product.productUnit || "gram"
          }, discountStartDate && {
            discountStartDate: discountStartDate
          }), discountEndDate && {
            discountEndDate: discountEndDate
          }), {
            "new": true
          });
        case 31:
          updatedProduct = _context4.sent;
          if (!(updatedProduct.productDiscount > 0)) {
            _context4.next = 38;
            break;
          }
          updatedProduct.productPromoPrice = updatedProduct.productPrice * (1 - updatedProduct.productDiscount / 100);
          _context4.next = 36;
          return updatedProduct.save();
        case 36:
          _context4.next = 41;
          break;
        case 38:
          updatedProduct.productPromoPrice = 0;
          _context4.next = 41;
          return updatedProduct.save();
        case 41:
          // Chuyển đổi dữ liệu số thành chuỗi trước khi gửi về client
          productToSend = updatedProduct.toObject();
          productToSend.productPrice = String(productToSend.productPrice);
          productToSend.productDiscount = String(productToSend.productDiscount);
          productToSend.productStock = String(productToSend.productStock);
          productToSend.productWeight = String(productToSend.productWeight);
          productToSend.productPromoPrice = String(productToSend.productPromoPrice);
          productToSend.productWarranty = String(productToSend.productWarranty);

          // Format discount dates
          if (productToSend.discountStartDate) {
            productToSend.discountStartDate = productToSend.discountStartDate.toISOString();
          }
          if (productToSend.discountEndDate) {
            productToSend.discountEndDate = productToSend.discountEndDate.toISOString();
          }
          res.status(200).json({
            success: true,
            message: "Cập nhật sản phẩm thành công",
            product: productToSend
          });
          _context4.next = 57;
          break;
        case 53:
          _context4.prev = 53;
          _context4.t0 = _context4["catch"](1);
          console.error("Lỗi khi cập nhật sản phẩm:", _context4.t0);
          res.status(500).json({
            success: false,
            message: "Cập nhật sản phẩm thất bại",
            error: _context4.t0.message
          });
        case 57:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[1, 53]]);
  }));
  return function updateProduct(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();
var deleteProduct = exports.deleteProduct = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(req, res) {
    var id, product;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          id = req.params.id;
          _context5.prev = 1;
          _context5.next = 4;
          return _Products["default"].findByIdAndDelete(id);
        case 4:
          product = _context5.sent;
          if (product) {
            _context5.next = 7;
            break;
          }
          return _context5.abrupt("return", res.status(404).json({
            message: "Không tìm thấy sản phẩm"
          }));
        case 7:
          res.status(200).json({
            message: "Xóa sản phẩm thành công"
          });
          _context5.next = 13;
          break;
        case 10:
          _context5.prev = 10;
          _context5.t0 = _context5["catch"](1);
          res.status(500).json({
            message: "Xóa sản phẩm thất bại",
            error: _context5.t0
          });
        case 13:
        case "end":
          return _context5.stop();
      }
    }, _callee5, null, [[1, 10]]);
  }));
  return function deleteProduct(_x9, _x0) {
    return _ref5.apply(this, arguments);
  };
}();
var getProductById = exports.getProductById = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(req, res) {
    var id, product, productToSend;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          id = req.params.id;
          _context6.prev = 1;
          _context6.next = 4;
          return _Products["default"].findById(id);
        case 4:
          product = _context6.sent;
          if (product) {
            _context6.next = 7;
            break;
          }
          return _context6.abrupt("return", res.status(404).json({
            message: "Không tìm thấy sản phẩm"
          }));
        case 7:
          // Chuyển đổi dữ liệu số thành chuỗi
          productToSend = product.toObject();
          productToSend.productPrice = String(productToSend.productPrice || "");
          productToSend.productDiscount = String(productToSend.productDiscount || "");
          productToSend.productStock = String(productToSend.productStock || "");
          productToSend.productWeight = String(productToSend.productWeight || "");
          productToSend.productPromoPrice = String(productToSend.productPromoPrice || "");
          productToSend.productWarranty = String(productToSend.productWarranty || "");
          res.status(200).json(productToSend);
          _context6.next = 20;
          break;
        case 17:
          _context6.prev = 17;
          _context6.t0 = _context6["catch"](1);
          res.status(500).json({
            message: "Lấy chi tiết sản phẩm thất bại",
            error: _context6.t0
          });
        case 20:
        case "end":
          return _context6.stop();
      }
    }, _callee6, null, [[1, 17]]);
  }));
  return function getProductById(_x1, _x10) {
    return _ref6.apply(this, arguments);
  };
}();
var searchProducts = exports.searchProducts = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(req, res) {
    var _req$query, name, _req$query$page, page, _req$query$limit, limit, searchQuery, products, total, productsToSend;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          _req$query = req.query, name = _req$query.name, _req$query$page = _req$query.page, page = _req$query$page === void 0 ? 1 : _req$query$page, _req$query$limit = _req$query.limit, limit = _req$query$limit === void 0 ? 10 : _req$query$limit;
          page = parseInt(page) > 0 ? parseInt(page) : 1;
          limit = Math.min(parseInt(limit) > 0 ? parseInt(limit) : 10, 100);
          if (!(!name || typeof name !== "string")) {
            _context7.next = 6;
            break;
          }
          return _context7.abrupt("return", res.status(400).json({
            message: "Invalid search input"
          }));
        case 6:
          searchQuery = {
            $or: [{
              productName: {
                $regex: name.trim(),
                $options: "i"
              }
            }, {
              productInfo: {
                $regex: name.trim(),
                $options: "i"
              }
            }, {
              productCategory: {
                $regex: name.trim(),
                $options: "i"
              }
            }, {
              productBrand: {
                $regex: name.trim(),
                $options: "i"
              }
            }, {
              productCode: {
                $regex: name.trim(),
                $options: "i"
              }
            }, {
              productDetails: {
                $regex: name.trim(),
                $options: "i"
              }
            }, {
              productOrigin: {
                $regex: name.trim(),
                $options: "i"
              }
            }]
          };
          _context7.next = 9;
          return _Products["default"].find(searchQuery).sort({
            createdAt: -1
          }).skip((page - 1) * limit).limit(limit).lean();
        case 9:
          products = _context7.sent;
          _context7.next = 12;
          return _Products["default"].countDocuments(searchQuery);
        case 12:
          total = _context7.sent;
          // Chuyển đổi dữ liệu số thành chuỗi
          productsToSend = products.map(function (product) {
            product.productPrice = String(product.productPrice || "");
            product.productDiscount = String(product.productDiscount || "");
            product.productStock = String(product.productStock || "");
            product.productWeight = String(product.productWeight || "");
            product.productPromoPrice = String(product.productPromoPrice || "");
            product.productWarranty = String(product.productWarranty || "");
            return product;
          });
          return _context7.abrupt("return", res.status(200).json({
            products: productsToSend,
            total: total,
            page: page,
            totalPages: Math.ceil(total / limit)
          }));
        case 17:
          _context7.prev = 17;
          _context7.t0 = _context7["catch"](0);
          if (!(_context7.t0.name === "CastError" && _context7.t0.path === "_id")) {
            _context7.next = 21;
            break;
          }
          return _context7.abrupt("return", res.status(400).json({
            message: "Invalid search parameter"
          }));
        case 21:
          return _context7.abrupt("return", res.status(500).json({
            message: "Internal server error",
            error: _context7.t0.message
          }));
        case 22:
        case "end":
          return _context7.stop();
      }
    }, _callee7, null, [[0, 17]]);
  }));
  return function searchProducts(_x11, _x12) {
    return _ref7.apply(this, arguments);
  };
}();
var getProductByCategory = exports.getProductByCategory = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(req, res) {
    var categoryName, excludeId, query, products, productsToSend;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          categoryName = req.params.category;
          excludeId = req.query.excludeId;
          query = {
            productCategory: categoryName
          };
          if (excludeId) {
            query._id = {
              $ne: excludeId
            };
          }
          _context8.next = 7;
          return _Products["default"].find(query);
        case 7:
          products = _context8.sent;
          // Chuyển đổi dữ liệu số thành chuỗi
          productsToSend = products.map(function (product) {
            var productObj = product.toObject();
            productObj.productPrice = String(productObj.productPrice || "");
            productObj.productDiscount = String(productObj.productDiscount || "");
            productObj.productStock = String(productObj.productStock || "");
            productObj.productWeight = String(productObj.productWeight || "");
            productObj.productPromoPrice = String(productObj.productPromoPrice || "");
            productObj.productWarranty = String(productObj.productWarranty || "");
            return productObj;
          });
          res.status(200).json(productsToSend);
          _context8.next = 15;
          break;
        case 12:
          _context8.prev = 12;
          _context8.t0 = _context8["catch"](0);
          res.status(500).json({
            message: "Lấy sản phẩm theo danh mục thất bại",
            error: _context8.t0
          });
        case 15:
        case "end":
          return _context8.stop();
      }
    }, _callee8, null, [[0, 12]]);
  }));
  return function getProductByCategory(_x13, _x14) {
    return _ref8.apply(this, arguments);
  };
}();
var updateProductCategory = exports.updateProductCategory = /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee9(req, res) {
    var productId, categoryId, category, product;
    return _regeneratorRuntime().wrap(function _callee9$(_context9) {
      while (1) switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          productId = req.params.productId;
          categoryId = req.body.categoryId;
          _context9.next = 5;
          return _Categories["default"].findById(categoryId);
        case 5:
          category = _context9.sent;
          if (category) {
            _context9.next = 8;
            break;
          }
          return _context9.abrupt("return", res.status(404).json({
            message: "Không tìm thấy danh mục"
          }));
        case 8:
          _context9.next = 10;
          return _Products["default"].findByIdAndUpdate(productId, {
            productCategory: categoryId
          }, {
            "new": true
          });
        case 10:
          product = _context9.sent;
          if (product) {
            _context9.next = 13;
            break;
          }
          return _context9.abrupt("return", res.status(404).json({
            message: "Không tìm thấy sản phẩm"
          }));
        case 13:
          res.status(200).json({
            success: true,
            message: "Cập nhật danh mục sản phẩm thành công",
            product: product
          });
          _context9.next = 20;
          break;
        case 16:
          _context9.prev = 16;
          _context9.t0 = _context9["catch"](0);
          console.error("Error in updateProductCategory:", _context9.t0);
          res.status(500).json({
            message: "Cập nhật danh mục sản phẩm thất bại",
            error: _context9.t0
          });
        case 20:
        case "end":
          return _context9.stop();
      }
    }, _callee9, null, [[0, 16]]);
  }));
  return function updateProductCategory(_x15, _x16) {
    return _ref9.apply(this, arguments);
  };
}();

// Lấy danh sách sản phẩm bán chạy
var getBestSellingProducts = exports.getBestSellingProducts = /*#__PURE__*/function () {
  var _ref0 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee0(req, res) {
    var limit, period, bestSellingProducts, activeProducts;
    return _regeneratorRuntime().wrap(function _callee0$(_context0) {
      while (1) switch (_context0.prev = _context0.next) {
        case 0:
          _context0.prev = 0;
          limit = parseInt(req.query.limit) || 4;
          period = req.query.period || 'all';
          _context0.next = 5;
          return _BestSellingProduct["default"].find().sort({
            totalSold: -1
          }).limit(limit).populate('productId');
        case 5:
          bestSellingProducts = _context0.sent;
          activeProducts = bestSellingProducts.filter(function (item) {
            return item.productId && item.productId.isActive;
          });
          res.status(200).json(activeProducts);
          _context0.next = 13;
          break;
        case 10:
          _context0.prev = 10;
          _context0.t0 = _context0["catch"](0);
          res.status(500).json({
            message: _context0.t0.message
          });
        case 13:
        case "end":
          return _context0.stop();
      }
    }, _callee0, null, [[0, 10]]);
  }));
  return function getBestSellingProducts(_x17, _x18) {
    return _ref0.apply(this, arguments);
  };
}();

/*******  7cab8ad6-4345-4fb6-92ff-2129f8b85842  *******/