"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
var Product = require('../../models/Product');
var _require = require('../../config/db'),
  connectToDatabase = _require.connectToDatabase;
var _require2 = require('mongodb'),
  ObjectId = _require2.ObjectId;
var productHelper = require('../../util/productHelper');

// Xử lý yêu cầu về thông tin sản phẩm
var handleProductInfo = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(productId) {
    var product;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return connectToDatabase();
        case 3:
          _context.next = 5;
          return Product.findById(productId);
        case 5:
          product = _context.sent;
          if (product) {
            _context.next = 8;
            break;
          }
          return _context.abrupt("return", 'Không tìm thấy thông tin sản phẩm này.');
        case 8:
          return _context.abrupt("return", "".concat(product.productName, " - ").concat(product.productInfo || 'Không có thông tin chi tiết.', "\n\nGi\xE1: ").concat(new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
          }).format(product.productPrice)).concat(product.productDiscount ? " (gi\u1EA3m ".concat(product.productDiscount, "%)") : ''));
        case 11:
          _context.prev = 11;
          _context.t0 = _context["catch"](0);
          console.error('Lỗi khi lấy thông tin sản phẩm:', _context.t0);
          return _context.abrupt("return", 'Đã xảy ra lỗi khi lấy thông tin sản phẩm.');
        case 15:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 11]]);
  }));
  return function handleProductInfo(_x) {
    return _ref.apply(this, arguments);
  };
}();

// Xử lý yêu cầu về giá sản phẩm
var handleProductPrice = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(productId) {
    var product, priceMessage, discountedPrice;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return connectToDatabase();
        case 3:
          _context2.next = 5;
          return Product.findById(productId);
        case 5:
          product = _context2.sent;
          if (product) {
            _context2.next = 8;
            break;
          }
          return _context2.abrupt("return", 'Không tìm thấy thông tin sản phẩm này.');
        case 8:
          priceMessage = "Gi\xE1 c\u1EE7a s\u1EA3n ph\u1EA9m \"".concat(product.productName, "\" l\xE0 ").concat(new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
          }).format(product.productPrice));
          if (product.productDiscount && product.productDiscount > 0) {
            discountedPrice = product.productPrice * (1 - product.productDiscount / 100);
            priceMessage += " (\u0110\xE3 gi\u1EA3m ".concat(product.productDiscount, "%, gi\xE1 g\u1ED1c: ").concat(new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(product.productPrice), ")");
          }
          return _context2.abrupt("return", priceMessage);
        case 13:
          _context2.prev = 13;
          _context2.t0 = _context2["catch"](0);
          console.error('Lỗi khi lấy giá sản phẩm:', _context2.t0);
          return _context2.abrupt("return", 'Đã xảy ra lỗi khi lấy thông tin giá sản phẩm.');
        case 17:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 13]]);
  }));
  return function handleProductPrice(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

// Xử lý yêu cầu về xuất xứ sản phẩm
var handleProductOrigin = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(productId) {
    var product;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return connectToDatabase();
        case 3:
          _context3.next = 5;
          return Product.findById(productId);
        case 5:
          product = _context3.sent;
          if (product) {
            _context3.next = 8;
            break;
          }
          return _context3.abrupt("return", 'Không tìm thấy thông tin sản phẩm này.');
        case 8:
          if (!product.origin) {
            _context3.next = 12;
            break;
          }
          return _context3.abrupt("return", "Xu\u1EA5t x\u1EE9 c\u1EE7a s\u1EA3n ph\u1EA9m \"".concat(product.productName, "\" l\xE0: ").concat(product.origin));
        case 12:
          return _context3.abrupt("return", productHelper.generateOrigin(product));
        case 13:
          _context3.next = 19;
          break;
        case 15:
          _context3.prev = 15;
          _context3.t0 = _context3["catch"](0);
          console.error('Lỗi khi lấy xuất xứ sản phẩm:', _context3.t0);
          return _context3.abrupt("return", 'Đã xảy ra lỗi khi lấy thông tin xuất xứ sản phẩm.');
        case 19:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[0, 15]]);
  }));
  return function handleProductOrigin(_x3) {
    return _ref3.apply(this, arguments);
  };
}();

// Xử lý yêu cầu về công dụng sản phẩm
var handleProductUsage = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(productId) {
    var product;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _context4.next = 3;
          return connectToDatabase();
        case 3:
          _context4.next = 5;
          return Product.findById(productId);
        case 5:
          product = _context4.sent;
          if (product) {
            _context4.next = 8;
            break;
          }
          return _context4.abrupt("return", 'Không tìm thấy thông tin sản phẩm này.');
        case 8:
          return _context4.abrupt("return", productHelper.generateProductUsage(product));
        case 11:
          _context4.prev = 11;
          _context4.t0 = _context4["catch"](0);
          console.error('Lỗi khi lấy công dụng sản phẩm:', _context4.t0);
          return _context4.abrupt("return", 'Đã xảy ra lỗi khi lấy thông tin công dụng sản phẩm.');
        case 15:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[0, 11]]);
  }));
  return function handleProductUsage(_x4) {
    return _ref4.apply(this, arguments);
  };
}();

// Xử lý yêu cầu về cách sử dụng sản phẩm
var handleHowToUse = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(productId) {
    var product;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          _context5.next = 3;
          return connectToDatabase();
        case 3:
          _context5.next = 5;
          return Product.findById(productId);
        case 5:
          product = _context5.sent;
          if (product) {
            _context5.next = 8;
            break;
          }
          return _context5.abrupt("return", 'Không tìm thấy thông tin sản phẩm này.');
        case 8:
          return _context5.abrupt("return", productHelper.generateHowToUse(product));
        case 11:
          _context5.prev = 11;
          _context5.t0 = _context5["catch"](0);
          console.error('Lỗi khi lấy cách sử dụng sản phẩm:', _context5.t0);
          return _context5.abrupt("return", 'Đã xảy ra lỗi khi lấy thông tin cách sử dụng sản phẩm.');
        case 15:
        case "end":
          return _context5.stop();
      }
    }, _callee5, null, [[0, 11]]);
  }));
  return function handleHowToUse(_x5) {
    return _ref5.apply(this, arguments);
  };
}();

// Xử lý yêu cầu về thành phần sản phẩm
var handleIngredients = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(productId) {
    var product;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          _context6.next = 3;
          return connectToDatabase();
        case 3:
          _context6.next = 5;
          return Product.findById(productId);
        case 5:
          product = _context6.sent;
          if (product) {
            _context6.next = 8;
            break;
          }
          return _context6.abrupt("return", 'Không tìm thấy thông tin sản phẩm này.');
        case 8:
          return _context6.abrupt("return", productHelper.generateIngredients(product));
        case 11:
          _context6.prev = 11;
          _context6.t0 = _context6["catch"](0);
          console.error('Lỗi khi lấy thành phần sản phẩm:', _context6.t0);
          return _context6.abrupt("return", 'Đã xảy ra lỗi khi lấy thông tin thành phần sản phẩm.');
        case 15:
        case "end":
          return _context6.stop();
      }
    }, _callee6, null, [[0, 11]]);
  }));
  return function handleIngredients(_x6) {
    return _ref6.apply(this, arguments);
  };
}();

// Xử lý yêu cầu về các sản phẩm liên quan
var handleRelatedProducts = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(productId) {
    var product, relatedProducts;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          _context7.next = 3;
          return connectToDatabase();
        case 3:
          _context7.next = 5;
          return Product.findById(productId);
        case 5:
          product = _context7.sent;
          if (product) {
            _context7.next = 8;
            break;
          }
          return _context7.abrupt("return", 'Không tìm thấy thông tin sản phẩm này.');
        case 8:
          _context7.next = 10;
          return Product.find({
            productCategory: product.productCategory,
            _id: {
              $ne: productId
            }
          }).limit(5);
        case 10:
          relatedProducts = _context7.sent;
          if (!(relatedProducts.length === 0)) {
            _context7.next = 13;
            break;
          }
          return _context7.abrupt("return", "Hi\u1EC7n kh\xF4ng c\xF3 s\u1EA3n ph\u1EA9m n\xE0o t\u01B0\u01A1ng t\u1EF1 v\u1EDBi \"".concat(product.productName, "\"."));
        case 13:
          return _context7.abrupt("return", {
            type: 'relatedProducts',
            text: "C\xE1c s\u1EA3n ph\u1EA9m t\u01B0\u01A1ng t\u1EF1 v\u1EDBi \"".concat(product.productName, "\":"),
            products: relatedProducts
          });
        case 16:
          _context7.prev = 16;
          _context7.t0 = _context7["catch"](0);
          console.error('Lỗi khi lấy sản phẩm liên quan:', _context7.t0);
          return _context7.abrupt("return", 'Đã xảy ra lỗi khi lấy thông tin sản phẩm liên quan.');
        case 20:
        case "end":
          return _context7.stop();
      }
    }, _callee7, null, [[0, 16]]);
  }));
  return function handleRelatedProducts(_x7) {
    return _ref7.apply(this, arguments);
  };
}();

// Xử lý yêu cầu về các sản phẩm đắt nhất
var handleMostExpensiveProduct = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(productId) {
    var product, mostExpensiveProducts, response;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          _context8.next = 3;
          return connectToDatabase();
        case 3:
          _context8.next = 5;
          return Product.findById(productId);
        case 5:
          product = _context8.sent;
          if (product) {
            _context8.next = 8;
            break;
          }
          return _context8.abrupt("return", 'Không tìm thấy thông tin sản phẩm này.');
        case 8:
          _context8.next = 10;
          return Product.find({
            productCategory: product.productCategory
          }).sort({
            productPrice: -1
          }).limit(5);
        case 10:
          mostExpensiveProducts = _context8.sent;
          if (!(mostExpensiveProducts.length === 0)) {
            _context8.next = 13;
            break;
          }
          return _context8.abrupt("return", "Kh\xF4ng t\xECm th\u1EA5y s\u1EA3n ph\u1EA9m n\xE0o trong danh m\u1EE5c c\u1EE7a \"".concat(product.productName, "\"."));
        case 13:
          response = "C\xE1c s\u1EA3n ph\u1EA9m cao c\u1EA5p nh\u1EA5t trong danh m\u1EE5c c\u1EE7a \"".concat(product.productName, "\":\n\n");
          mostExpensiveProducts.forEach(function (item, index) {
            response += "".concat(index + 1, ". ").concat(item.productName, " - ").concat(new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(item.productPrice), "\n");
          });
          return _context8.abrupt("return", response);
        case 18:
          _context8.prev = 18;
          _context8.t0 = _context8["catch"](0);
          console.error('Lỗi khi lấy sản phẩm đắt nhất:', _context8.t0);
          return _context8.abrupt("return", 'Đã xảy ra lỗi khi lấy thông tin sản phẩm đắt nhất.');
        case 22:
        case "end":
          return _context8.stop();
      }
    }, _callee8, null, [[0, 18]]);
  }));
  return function handleMostExpensiveProduct(_x8) {
    return _ref8.apply(this, arguments);
  };
}();

// Xử lý yêu cầu về các sản phẩm rẻ nhất
var handleCheapestProduct = /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee9(productId) {
    var product, cheapestProducts, response;
    return _regeneratorRuntime().wrap(function _callee9$(_context9) {
      while (1) switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          _context9.next = 3;
          return connectToDatabase();
        case 3:
          _context9.next = 5;
          return Product.findById(productId);
        case 5:
          product = _context9.sent;
          if (product) {
            _context9.next = 8;
            break;
          }
          return _context9.abrupt("return", 'Không tìm thấy thông tin sản phẩm này.');
        case 8:
          _context9.next = 10;
          return Product.find({
            productCategory: product.productCategory,
            productPrice: {
              $gt: 0
            } // Đảm bảo giá lớn hơn 0
          }).sort({
            productPrice: 1
          }).limit(5);
        case 10:
          cheapestProducts = _context9.sent;
          if (!(cheapestProducts.length === 0)) {
            _context9.next = 13;
            break;
          }
          return _context9.abrupt("return", "Kh\xF4ng t\xECm th\u1EA5y s\u1EA3n ph\u1EA9m n\xE0o trong danh m\u1EE5c c\u1EE7a \"".concat(product.productName, "\"."));
        case 13:
          response = "C\xE1c s\u1EA3n ph\u1EA9m gi\xE1 r\u1EBB nh\u1EA5t trong danh m\u1EE5c c\u1EE7a \"".concat(product.productName, "\":\n\n");
          cheapestProducts.forEach(function (item, index) {
            response += "".concat(index + 1, ". ").concat(item.productName, " - ").concat(new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(item.productPrice), "\n");
          });
          return _context9.abrupt("return", response);
        case 18:
          _context9.prev = 18;
          _context9.t0 = _context9["catch"](0);
          console.error('Lỗi khi lấy sản phẩm rẻ nhất:', _context9.t0);
          return _context9.abrupt("return", 'Đã xảy ra lỗi khi lấy thông tin sản phẩm rẻ nhất.');
        case 22:
        case "end":
          return _context9.stop();
      }
    }, _callee9, null, [[0, 18]]);
  }));
  return function handleCheapestProduct(_x9) {
    return _ref9.apply(this, arguments);
  };
}();
module.exports = {
  handleProductInfo: handleProductInfo,
  handleProductPrice: handleProductPrice,
  handleProductOrigin: handleProductOrigin,
  handleProductUsage: handleProductUsage,
  handleHowToUse: handleHowToUse,
  handleIngredients: handleIngredients,
  handleRelatedProducts: handleRelatedProducts,
  handleMostExpensiveProduct: handleMostExpensiveProduct,
  handleCheapestProduct: handleCheapestProduct
};