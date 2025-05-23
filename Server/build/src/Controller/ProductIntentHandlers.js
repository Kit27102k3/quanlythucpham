"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handleRelatedProducts = exports.handleProductUsage = exports.handleProductReviews = exports.handleProductPrice = exports.handleProductPageQuestions = exports.handleProductOrigin = exports.handleProductIntro = exports.handleProductIngredients = exports.handleProductExpiry = exports.detectProductIntent = void 0;
var _Products = _interopRequireDefault(require("../Model/Products.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
/**
 * Format currency to VND format
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted amount
 */
var formatCurrency = function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount || 0);
};

/**
 * Hàm phát hiện intent cho các câu hỏi liên quan đến sản phẩm đang xem
 * @param {string} message - Tin nhắn từ người dùng
 * @returns {object} - Intent được phát hiện
 */
var detectProductIntent = exports.detectProductIntent = function detectProductIntent(message) {
  if (!message || typeof message !== 'string') {
    return {
      name: 'unknown',
      confidence: 0
    };
  }
  var lowerCaseMsg = message.toLowerCase().trim();

  // Phát hiện câu hỏi về công dụng sản phẩm
  if (lowerCaseMsg.includes("công dụng") || lowerCaseMsg.includes("tác dụng") || lowerCaseMsg.includes("sử dụng") || lowerCaseMsg.includes("dùng như thế nào") || lowerCaseMsg.includes("cách dùng") || lowerCaseMsg.includes("dùng làm gì") || lowerCaseMsg.includes("dùng để làm gì")) {
    return {
      name: 'productUsage',
      confidence: 0.9
    };
  }

  // Phát hiện câu hỏi về giới thiệu sản phẩm
  if (lowerCaseMsg.includes("giới thiệu") || lowerCaseMsg.includes("thông tin") || lowerCaseMsg.includes("cho biết về") || lowerCaseMsg.includes("mô tả") || lowerCaseMsg.includes("kể về")) {
    return {
      name: 'productIntro',
      confidence: 0.9
    };
  }

  // Phát hiện câu hỏi về giá sản phẩm
  if ((lowerCaseMsg.includes("giá") || lowerCaseMsg.includes("bao nhiêu tiền") || lowerCaseMsg.includes("giá bao nhiêu") || lowerCaseMsg.includes("giá cả") || lowerCaseMsg.includes("chi phí")) && !lowerCaseMsg.includes("giá rẻ") && !lowerCaseMsg.includes("giảm giá")) {
    return {
      name: 'productPrice',
      confidence: 0.9
    };
  }

  // Phát hiện câu hỏi về sản phẩm liên quan
  if (lowerCaseMsg.includes("liên quan") || lowerCaseMsg.includes("tương tự") || lowerCaseMsg.includes("sản phẩm khác") || lowerCaseMsg.includes("sản phẩm cùng loại") || lowerCaseMsg.includes("thay thế") || lowerCaseMsg.includes("gợi ý thêm")) {
    return {
      name: 'relatedProducts',
      confidence: 0.9
    };
  }

  // Phát hiện câu hỏi về nguồn gốc/xuất xứ sản phẩm
  if (lowerCaseMsg.includes("xuất xứ") || lowerCaseMsg.includes("nguồn gốc") || lowerCaseMsg.includes("sản xuất ở đâu") || lowerCaseMsg.includes("nước nào") || lowerCaseMsg.includes("hãng nào")) {
    return {
      name: 'productOrigin',
      confidence: 0.9
    };
  }

  // Phát hiện câu hỏi về thành phần sản phẩm
  if (lowerCaseMsg.includes("thành phần") || lowerCaseMsg.includes("nguyên liệu") || lowerCaseMsg.includes("có chứa") || lowerCaseMsg.includes("làm từ") || lowerCaseMsg.includes("được làm từ") || lowerCaseMsg.includes("chất liệu")) {
    return {
      name: 'productIngredients',
      confidence: 0.9
    };
  }

  // Phát hiện câu hỏi về date (hạn sử dụng)
  if (lowerCaseMsg.includes("hạn sử dụng") || lowerCaseMsg.includes("date") || lowerCaseMsg.includes("hết hạn") || lowerCaseMsg.includes("dùng được bao lâu") || lowerCaseMsg.includes("bảo quản")) {
    return {
      name: 'productExpiry',
      confidence: 0.9
    };
  }

  // Phát hiện câu hỏi về đánh giá sản phẩm
  if (lowerCaseMsg.includes("đánh giá") || lowerCaseMsg.includes("review") || lowerCaseMsg.includes("feedback") || lowerCaseMsg.includes("nhận xét") || lowerCaseMsg.includes("tốt không") || lowerCaseMsg.includes("có ngon không") || lowerCaseMsg.includes("có tốt không")) {
    return {
      name: 'productReviews',
      confidence: 0.9
    };
  }
  return {
    name: 'unknown',
    confidence: 0
  };
};

/**
 * Xử lý câu hỏi về công dụng sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var handleProductUsage = exports.handleProductUsage = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(product) {
    var usage;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          usage = product.productDetails || "Chưa có thông tin chi tiết về công dụng sản phẩm này.";
          return _context.abrupt("return", {
            success: true,
            message: "<strong>C\xF4ng d\u1EE5ng ".concat(product.productName, ":</strong><br>").concat(usage),
            intent: "productUsage"
          });
        case 2:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return function handleProductUsage(_x) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * Xử lý câu hỏi về giới thiệu sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var handleProductIntro = exports.handleProductIntro = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(product) {
    var intro;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          intro = product.productIntroduction || "Chưa có thông tin giới thiệu về sản phẩm này.";
          return _context2.abrupt("return", {
            success: true,
            message: "<strong>Gi\u1EDBi thi\u1EC7u ".concat(product.productName, ":</strong><br>").concat(intro),
            intent: "productIntro"
          });
        case 2:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return function handleProductIntro(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

/**
 * Xử lý câu hỏi về giá sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var handleProductPrice = exports.handleProductPrice = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(product) {
    var price, discountPercentage, hasDiscount, promoPrice, priceInfo;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          price = product.productPrice;
          discountPercentage = product.productDiscount || 0;
          hasDiscount = discountPercentage > 0;
          promoPrice = hasDiscount ? product.productPromoPrice || Math.round(price * (1 - discountPercentage / 100)) : price;
          priceInfo = "<strong>Gi\xE1 ".concat(product.productName, ":</strong><br>");
          if (hasDiscount) {
            priceInfo += "Gi\xE1 g\u1ED1c: <span style=\"text-decoration: line-through;\">".concat(formatCurrency(price), "</span><br>");
            priceInfo += "Gi\xE1 khuy\u1EBFn m\xE3i: <strong style=\"color: red;\">".concat(formatCurrency(promoPrice), "</strong> (Gi\u1EA3m ").concat(discountPercentage, "%)");
          } else {
            priceInfo += "<strong style=\"color: red;\">".concat(formatCurrency(price), "</strong>");
          }
          return _context3.abrupt("return", {
            success: true,
            message: priceInfo,
            intent: "productPrice"
          });
        case 7:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return function handleProductPrice(_x3) {
    return _ref3.apply(this, arguments);
  };
}();

/**
 * Xử lý câu hỏi về sản phẩm liên quan
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var handleRelatedProducts = exports.handleRelatedProducts = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(product) {
    var category, relatedProducts, formattedProducts;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          category = product.productCategory;
          _context4.next = 3;
          return _Products["default"].find({
            productCategory: category,
            _id: {
              $ne: product._id
            } // Loại trừ sản phẩm hiện tại
          }).limit(6);
        case 3:
          relatedProducts = _context4.sent;
          if (!(relatedProducts && relatedProducts.length > 0)) {
            _context4.next = 10;
            break;
          }
          console.log("T\xECm th\u1EA5y ".concat(relatedProducts.length, " s\u1EA3n ph\u1EA9m li\xEAn quan trong danh m\u1EE5c \"").concat(category, "\""));

          // Format products for display
          formattedProducts = relatedProducts.map(function (p) {
            return {
              id: p._id,
              name: p.productName,
              price: p.productPrice,
              discount: p.productDiscount,
              promotionalPrice: p.productDiscount ? Math.round(p.productPrice * (1 - p.productDiscount / 100)) : p.productPrice,
              image: p.productImages && p.productImages.length > 0 ? p.productImages[0] : "default-product.jpg",
              slug: p.productName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
            };
          });
          return _context4.abrupt("return", {
            success: true,
            message: "C\xE1c s\u1EA3n ph\u1EA9m li\xEAn quan \u0111\u1EBFn ".concat(product.productName, ":"),
            data: formattedProducts,
            type: 'relatedProducts',
            text: "C\xE1c s\u1EA3n ph\u1EA9m li\xEAn quan \u0111\u1EBFn ".concat(product.productName, ":"),
            intent: "relatedProducts"
          });
        case 10:
          return _context4.abrupt("return", {
            success: true,
            message: "Hi\u1EC7n t\u1EA1i kh\xF4ng c\xF3 s\u1EA3n ph\u1EA9m n\xE0o kh\xE1c trong danh m\u1EE5c \"".concat(category, "\"."),
            intent: "relatedProducts"
          });
        case 11:
        case "end":
          return _context4.stop();
      }
    }, _callee4);
  }));
  return function handleRelatedProducts(_x4) {
    return _ref4.apply(this, arguments);
  };
}();

/**
 * Xử lý câu hỏi về xuất xứ sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var handleProductOrigin = exports.handleProductOrigin = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(product) {
    var originInfo;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          originInfo = '';
          if (product.productOrigin || product.origin) {
            originInfo = "<strong>Xu\u1EA5t x\u1EE9 ".concat(product.productName, ":</strong><br>").concat(product.productOrigin || product.origin);
            if (product.productBrand) {
              originInfo += "<br>Th\u01B0\u01A1ng hi\u1EC7u: ".concat(product.productBrand);
            }
            if (product.productManufacturer) {
              originInfo += "<br>Nh\xE0 s\u1EA3n xu\u1EA5t: ".concat(product.productManufacturer);
            }
          } else {
            originInfo = "<strong>Xu\u1EA5t x\u1EE9 ".concat(product.productName, ":</strong><br>Th\xF4ng tin v\u1EC1 xu\u1EA5t x\u1EE9 s\u1EA3n ph\u1EA9m \u0111\u01B0\u1EE3c ghi r\xF5 tr\xEAn bao b\xEC.");
          }
          return _context5.abrupt("return", {
            success: true,
            message: originInfo,
            intent: "productOrigin"
          });
        case 3:
        case "end":
          return _context5.stop();
      }
    }, _callee5);
  }));
  return function handleProductOrigin(_x5) {
    return _ref5.apply(this, arguments);
  };
}();

/**
 * Xử lý câu hỏi về thành phần sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var handleProductIngredients = exports.handleProductIngredients = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(product) {
    var ingredientsInfo;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          ingredientsInfo = '';
          if (product.productIngredients || product.ingredients) {
            ingredientsInfo = "<strong>Th\xE0nh ph\u1EA7n c\u1EE7a ".concat(product.productName, ":</strong><br>").concat(product.productIngredients || product.ingredients);
          } else {
            ingredientsInfo = "<strong>Th\xE0nh ph\u1EA7n c\u1EE7a ".concat(product.productName, ":</strong><br>Th\xF4ng tin chi ti\u1EBFt v\u1EC1 th\xE0nh ph\u1EA7n s\u1EA3n ph\u1EA9m \u0111\u01B0\u1EE3c ghi r\xF5 tr\xEAn bao b\xEC.");
          }
          return _context6.abrupt("return", {
            success: true,
            message: ingredientsInfo,
            intent: "productIngredients"
          });
        case 3:
        case "end":
          return _context6.stop();
      }
    }, _callee6);
  }));
  return function handleProductIngredients(_x6) {
    return _ref6.apply(this, arguments);
  };
}();

/**
 * Xử lý câu hỏi về hạn sử dụng sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var handleProductExpiry = exports.handleProductExpiry = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(product) {
    var expiryInfo;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          expiryInfo = '';
          if (product.expiryDate || product.productExpiry) {
            expiryInfo = "<strong>H\u1EA1n s\u1EED d\u1EE5ng ".concat(product.productName, ":</strong><br>").concat(product.expiryDate || product.productExpiry);
          } else {
            expiryInfo = "<strong>H\u1EA1n s\u1EED d\u1EE5ng ".concat(product.productName, ":</strong><br>Th\xF4ng tin v\u1EC1 h\u1EA1n s\u1EED d\u1EE5ng \u0111\u01B0\u1EE3c in tr\xEAn bao b\xEC s\u1EA3n ph\u1EA9m. \n    Vui l\xF2ng ki\u1EC3m tra khi nh\u1EADn h\xE0ng.");
          }
          if (product.storageInfo || product.productStorage) {
            expiryInfo += "<br><br><strong>H\u01B0\u1EDBng d\u1EABn b\u1EA3o qu\u1EA3n:</strong><br>".concat(product.storageInfo || product.productStorage);
          }
          return _context7.abrupt("return", {
            success: true,
            message: expiryInfo,
            intent: "productExpiry"
          });
        case 4:
        case "end":
          return _context7.stop();
      }
    }, _callee7);
  }));
  return function handleProductExpiry(_x7) {
    return _ref7.apply(this, arguments);
  };
}();

/**
 * Xử lý câu hỏi về đánh giá sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var handleProductReviews = exports.handleProductReviews = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(product) {
    var reviewInfo;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          reviewInfo = '';
          if (product.averageRating) {
            reviewInfo = "<strong>\u0110\xE1nh gi\xE1 ".concat(product.productName, ":</strong><br>\n    \u0110i\u1EC3m \u0111\xE1nh gi\xE1 trung b\xECnh: ").concat(product.averageRating, "/5 sao");
            if (product.numOfReviews) {
              reviewInfo += " (".concat(product.numOfReviews, " l\u01B0\u1EE3t \u0111\xE1nh gi\xE1)");
            }
          } else {
            reviewInfo = "<strong>\u0110\xE1nh gi\xE1 ".concat(product.productName, ":</strong><br>\n    S\u1EA3n ph\u1EA9m n\xE0y ch\u01B0a c\xF3 \u0111\xE1nh gi\xE1. ").concat(product.productName, " l\xE0 s\u1EA3n ph\u1EA9m ch\u1EA5t l\u01B0\u1EE3ng cao, \n    \u0111\u01B0\u1EE3c nhi\u1EC1u kh\xE1ch h\xE0ng tin d\xF9ng trong th\u1EDDi gian qua.");
          }
          return _context8.abrupt("return", {
            success: true,
            message: reviewInfo,
            intent: "productReviews"
          });
        case 3:
        case "end":
          return _context8.stop();
      }
    }, _callee8);
  }));
  return function handleProductReviews(_x8) {
    return _ref8.apply(this, arguments);
  };
}();

/**
 * Main handler cho các câu hỏi liên quan đến sản phẩm đang xem
 * @param {string} message - Tin nhắn từ người dùng
 * @param {string} productId - ID của sản phẩm đang xem
 * @returns {object} - Phản hồi
 */
var handleProductPageQuestions = exports.handleProductPageQuestions = /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee9(message, productId) {
    var intent, product;
    return _regeneratorRuntime().wrap(function _callee9$(_context9) {
      while (1) switch (_context9.prev = _context9.next) {
        case 0:
          if (productId) {
            _context9.next = 2;
            break;
          }
          return _context9.abrupt("return", null);
        case 2:
          _context9.prev = 2;
          console.log("\u0110ang x\u1EED l\xFD c\xE2u h\u1ECFi cho s\u1EA3n ph\u1EA9m ID: ".concat(productId));

          // Phát hiện intent
          intent = detectProductIntent(message);
          console.log("Product intent được phát hiện:", intent);
          if (!(intent.name === 'unknown')) {
            _context9.next = 8;
            break;
          }
          return _context9.abrupt("return", null);
        case 8:
          _context9.next = 10;
          return _Products["default"].findById(productId);
        case 10:
          product = _context9.sent;
          if (product) {
            _context9.next = 14;
            break;
          }
          console.log("Kh\xF4ng t\xECm th\u1EA5y s\u1EA3n ph\u1EA9m v\u1EDBi ID: ".concat(productId));
          return _context9.abrupt("return", {
            success: true,
            message: "Xin lỗi, tôi không tìm thấy thông tin về sản phẩm này.",
            intent: "productNotFound"
          });
        case 14:
          console.log("\u0110\xE3 t\xECm th\u1EA5y s\u1EA3n ph\u1EA9m: ".concat(product.productName));

          // Xử lý theo intent
          _context9.t0 = intent.name;
          _context9.next = _context9.t0 === 'productUsage' ? 18 : _context9.t0 === 'productIntro' ? 21 : _context9.t0 === 'productPrice' ? 24 : _context9.t0 === 'relatedProducts' ? 27 : _context9.t0 === 'productOrigin' ? 30 : _context9.t0 === 'productIngredients' ? 33 : _context9.t0 === 'productExpiry' ? 36 : _context9.t0 === 'productReviews' ? 39 : 42;
          break;
        case 18:
          _context9.next = 20;
          return handleProductUsage(product);
        case 20:
          return _context9.abrupt("return", _context9.sent);
        case 21:
          _context9.next = 23;
          return handleProductIntro(product);
        case 23:
          return _context9.abrupt("return", _context9.sent);
        case 24:
          _context9.next = 26;
          return handleProductPrice(product);
        case 26:
          return _context9.abrupt("return", _context9.sent);
        case 27:
          _context9.next = 29;
          return handleRelatedProducts(product);
        case 29:
          return _context9.abrupt("return", _context9.sent);
        case 30:
          _context9.next = 32;
          return handleProductOrigin(product);
        case 32:
          return _context9.abrupt("return", _context9.sent);
        case 33:
          _context9.next = 35;
          return handleProductIngredients(product);
        case 35:
          return _context9.abrupt("return", _context9.sent);
        case 36:
          _context9.next = 38;
          return handleProductExpiry(product);
        case 38:
          return _context9.abrupt("return", _context9.sent);
        case 39:
          _context9.next = 41;
          return handleProductReviews(product);
        case 41:
          return _context9.abrupt("return", _context9.sent);
        case 42:
          return _context9.abrupt("return", null);
        case 43:
          _context9.next = 49;
          break;
        case 45:
          _context9.prev = 45;
          _context9.t1 = _context9["catch"](2);
          console.error("Lỗi khi xử lý câu hỏi về sản phẩm:", _context9.t1);
          return _context9.abrupt("return", {
            success: true,
            message: "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn.",
            intent: "error"
          });
        case 49:
        case "end":
          return _context9.stop();
      }
    }, _callee9, null, [[2, 45]]);
  }));
  return function handleProductPageQuestions(_x9, _x0) {
    return _ref9.apply(this, arguments);
  };
}();