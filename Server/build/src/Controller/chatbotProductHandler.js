"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handleRelatedProductsQuestion = exports.handleProductUsageQuestion = exports.handleProductReviewsQuestion = exports.handleProductPriceQuestion = exports.handleProductPageQuestion = exports.handleProductOriginQuestion = exports.handleProductIntroQuestion = exports.handleProductIngredientsQuestion = exports.handleProductExpiryQuestion = exports.detectProductPageIntent = void 0;
var _Products = _interopRequireDefault(require("../Model/Products.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } /**
 * Xử lý câu hỏi về sản phẩm cụ thể
 * File này chứa các hàm để trả lời câu hỏi về sản phẩm
 */
/**
 * Định dạng số tiền sang VND
 * @param {number} amount - Số tiền
 * @returns {string} - Chuỗi tiền đã định dạng
 */
var formatCurrency = function formatCurrency(amount) {
  // Đảm bảo amount là số
  var validAmount = Number(amount) || 0;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(validAmount);
};

/**
 * Nhận diện intent từ tin nhắn cho sản phẩm đang xem
 * @param {string} message - Tin nhắn từ người dùng
 * @returns {string} - Intent được phát hiện
 */
var detectProductPageIntent = exports.detectProductPageIntent = function detectProductPageIntent(message) {
  if (!message) return null;
  var lowerMessage = message.toLowerCase().trim();

  // Công dụng sản phẩm (productDetails)
  if (lowerMessage.includes('công dụng') || lowerMessage.includes('tác dụng') || lowerMessage.includes('dùng để làm gì') || lowerMessage.includes('dùng làm gì') || lowerMessage.includes('sử dụng') || lowerMessage.includes('tác dụng gì')) {
    return 'productUsage';
  }

  // Giới thiệu sản phẩm (productIntroduction)
  if (lowerMessage.includes('giới thiệu') || lowerMessage.includes('nói về') || lowerMessage.includes('giới thiệu về') || lowerMessage.includes('thông tin về') || lowerMessage.includes('mô tả')) {
    return 'productIntro';
  }

  // Giá sản phẩm (productPrice, productPromoPrice)
  if (lowerMessage.includes('giá') || lowerMessage.includes('bao nhiêu tiền') || lowerMessage.includes('giá cả') || lowerMessage.includes('giá bao nhiêu')) {
    return 'productPrice';
  }

  // Sản phẩm liên quan (productCategory)
  if (lowerMessage.includes('liên quan') || lowerMessage.includes('tương tự') || lowerMessage.includes('sản phẩm khác') || lowerMessage.includes('sản phẩm cùng loại') || lowerMessage.includes('còn gì khác') || lowerMessage.includes('gợi ý')) {
    return 'relatedProducts';
  }

  // Xuất xứ sản phẩm
  if (lowerMessage.includes('xuất xứ') || lowerMessage.includes('nguồn gốc') || lowerMessage.includes('sản xuất ở đâu') || lowerMessage.includes('nước nào') || lowerMessage.includes('hãng nào')) {
    return 'productOrigin';
  }

  // Thành phần sản phẩm
  if (lowerMessage.includes('thành phần') || lowerMessage.includes('nguyên liệu') || lowerMessage.includes('có chứa') || lowerMessage.includes('làm từ') || lowerMessage.includes('được làm từ') || lowerMessage.includes('chất liệu')) {
    return 'productIngredients';
  }

  // Hạn sử dụng sản phẩm
  if (lowerMessage.includes('hạn sử dụng') || lowerMessage.includes('date') || lowerMessage.includes('hết hạn') || lowerMessage.includes('dùng được bao lâu') || lowerMessage.includes('bảo quản')) {
    return 'productExpiry';
  }

  // Đánh giá sản phẩm
  if (lowerMessage.includes('đánh giá') || lowerMessage.includes('review') || lowerMessage.includes('feedback') || lowerMessage.includes('nhận xét') || lowerMessage.includes('tốt không') || lowerMessage.includes('có ngon không') || lowerMessage.includes('có tốt không')) {
    return 'productReviews';
  }
  return null;
};

/**
 * Xử lý câu hỏi về công dụng sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var handleProductUsageQuestion = exports.handleProductUsageQuestion = function handleProductUsageQuestion(product) {
  if (!product) return {
    success: false,
    message: 'Không tìm thấy thông tin sản phẩm'
  };
  var usage = product.productDetails || 'Hiện chưa có thông tin chi tiết về công dụng của sản phẩm này.';
  return {
    success: true,
    message: "<strong>C\xF4ng d\u1EE5ng c\u1EE7a ".concat(product.productName, ":</strong><br>").concat(usage),
    intent: 'productUsage'
  };
};

/**
 * Xử lý câu hỏi về giới thiệu sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var handleProductIntroQuestion = exports.handleProductIntroQuestion = function handleProductIntroQuestion(product) {
  if (!product) return {
    success: false,
    message: 'Không tìm thấy thông tin sản phẩm'
  };
  var intro = product.productIntroduction || 'Hiện chưa có thông tin giới thiệu về sản phẩm này.';
  return {
    success: true,
    message: "<strong>Gi\u1EDBi thi\u1EC7u v\u1EC1 ".concat(product.productName, ":</strong><br>").concat(intro),
    intent: 'productIntro'
  };
};

/**
 * Xử lý câu hỏi về giá sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var handleProductPriceQuestion = exports.handleProductPriceQuestion = function handleProductPriceQuestion(product) {
  if (!product) return {
    success: false,
    message: 'Không tìm thấy thông tin sản phẩm'
  };
  var originalPrice = product.productPrice;
  var discount = product.productDiscount || 0;
  var promoPrice = product.productPromoPrice || (discount > 0 ? Math.round(originalPrice * (1 - discount / 100)) : originalPrice);
  var priceMessage = "<strong>Gi\xE1 ".concat(product.productName, ":</strong><br>");
  if (discount > 0) {
    priceMessage += "<span style=\"text-decoration: line-through;\">".concat(formatCurrency(originalPrice), "\u0111</span><br>");
    priceMessage += "<strong style=\"color: red;\">".concat(formatCurrency(promoPrice), "\u0111</strong> (Gi\u1EA3m ").concat(discount, "%)");
  } else {
    priceMessage += "<strong style=\"color: red;\">".concat(formatCurrency(originalPrice), "\u0111</strong>");
  }
  return {
    success: true,
    message: priceMessage,
    intent: 'productPrice'
  };
};

/**
 * Xử lý câu hỏi về sản phẩm liên quan
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var handleRelatedProductsQuestion = exports.handleRelatedProductsQuestion = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(product) {
    var relatedProducts, formattedProducts;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          if (product) {
            _context.next = 2;
            break;
          }
          return _context.abrupt("return", {
            success: false,
            message: 'Không tìm thấy thông tin sản phẩm'
          });
        case 2:
          _context.prev = 2;
          _context.next = 5;
          return _Products["default"].find({
            productCategory: product.productCategory,
            _id: {
              $ne: product._id
            } // Loại trừ sản phẩm hiện tại
          }).limit(5);
        case 5:
          relatedProducts = _context.sent;
          if (!(!relatedProducts || relatedProducts.length === 0)) {
            _context.next = 8;
            break;
          }
          return _context.abrupt("return", {
            success: true,
            message: "Hi\u1EC7n kh\xF4ng c\xF3 s\u1EA3n ph\u1EA9m n\xE0o kh\xE1c trong danh m\u1EE5c \"".concat(product.productCategory, "\"."),
            intent: 'relatedProducts'
          });
        case 8:
          // Format sản phẩm để hiển thị
          formattedProducts = relatedProducts.map(function (p) {
            return {
              id: p._id,
              name: p.productName,
              price: p.productPrice,
              discount: p.productDiscount || 0,
              promotionalPrice: p.productPromoPrice || (p.productDiscount ? Math.round(p.productPrice * (1 - p.productDiscount / 100)) : p.productPrice),
              image: p.productImages && p.productImages.length > 0 ? p.productImages[0] : 'default-product.jpg',
              description: p.productInfo || p.productDetails || ''
            };
          });
          return _context.abrupt("return", {
            success: true,
            message: "C\xE1c s\u1EA3n ph\u1EA9m li\xEAn quan \u0111\u1EBFn ".concat(product.productName, ":"),
            data: formattedProducts,
            type: 'relatedProducts',
            text: "C\xE1c s\u1EA3n ph\u1EA9m li\xEAn quan \u0111\u1EBFn ".concat(product.productName, ":"),
            intent: 'relatedProducts',
            nameCategory: "S\u1EA3n ph\u1EA9m c\xF9ng lo\u1EA1i \"".concat(product.productCategory, "\"")
          });
        case 12:
          _context.prev = 12;
          _context.t0 = _context["catch"](2);
          console.error('Lỗi khi tìm sản phẩm liên quan:', _context.t0);
          return _context.abrupt("return", {
            success: false,
            message: 'Có lỗi xảy ra khi tìm sản phẩm liên quan.',
            intent: 'error'
          });
        case 16:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[2, 12]]);
  }));
  return function handleRelatedProductsQuestion(_x) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * Xử lý câu hỏi về xuất xứ sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var handleProductOriginQuestion = exports.handleProductOriginQuestion = function handleProductOriginQuestion(product) {
  if (!product) return {
    success: false,
    message: 'Không tìm thấy thông tin sản phẩm'
  };
  var originInfo = '';
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
  return {
    success: true,
    message: originInfo,
    intent: 'productOrigin'
  };
};

/**
 * Xử lý câu hỏi về thành phần sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var handleProductIngredientsQuestion = exports.handleProductIngredientsQuestion = function handleProductIngredientsQuestion(product) {
  if (!product) return {
    success: false,
    message: 'Không tìm thấy thông tin sản phẩm'
  };
  var ingredientsInfo = '';
  if (product.productIngredients || product.ingredients) {
    ingredientsInfo = "<strong>Th\xE0nh ph\u1EA7n c\u1EE7a ".concat(product.productName, ":</strong><br>").concat(product.productIngredients || product.ingredients);
  } else {
    ingredientsInfo = "<strong>Th\xE0nh ph\u1EA7n c\u1EE7a ".concat(product.productName, ":</strong><br>Th\xF4ng tin chi ti\u1EBFt v\u1EC1 th\xE0nh ph\u1EA7n s\u1EA3n ph\u1EA9m \u0111\u01B0\u1EE3c ghi r\xF5 tr\xEAn bao b\xEC.");
  }
  return {
    success: true,
    message: ingredientsInfo,
    intent: 'productIngredients'
  };
};

/**
 * Xử lý câu hỏi về hạn sử dụng sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var handleProductExpiryQuestion = exports.handleProductExpiryQuestion = function handleProductExpiryQuestion(product) {
  if (!product) return {
    success: false,
    message: 'Không tìm thấy thông tin sản phẩm'
  };
  var expiryInfo = '';
  if (product.expiryDate || product.productExpiry) {
    expiryInfo = "<strong>H\u1EA1n s\u1EED d\u1EE5ng ".concat(product.productName, ":</strong><br>").concat(product.expiryDate || product.productExpiry);
  } else {
    expiryInfo = "<strong>H\u1EA1n s\u1EED d\u1EE5ng ".concat(product.productName, ":</strong><br>Th\xF4ng tin v\u1EC1 h\u1EA1n s\u1EED d\u1EE5ng \u0111\u01B0\u1EE3c in tr\xEAn bao b\xEC s\u1EA3n ph\u1EA9m. \n    Vui l\xF2ng ki\u1EC3m tra khi nh\u1EADn h\xE0ng.");
  }
  if (product.storageInfo || product.productStorage) {
    expiryInfo += "<br><br><strong>H\u01B0\u1EDBng d\u1EABn b\u1EA3o qu\u1EA3n:</strong><br>".concat(product.storageInfo || product.productStorage);
  }
  return {
    success: true,
    message: expiryInfo,
    intent: 'productExpiry'
  };
};

/**
 * Xử lý câu hỏi về đánh giá sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var handleProductReviewsQuestion = exports.handleProductReviewsQuestion = function handleProductReviewsQuestion(product) {
  if (!product) return {
    success: false,
    message: 'Không tìm thấy thông tin sản phẩm'
  };
  var reviewInfo = '';
  if (product.averageRating) {
    reviewInfo = "<strong>\u0110\xE1nh gi\xE1 ".concat(product.productName, ":</strong><br>\n    \u0110i\u1EC3m \u0111\xE1nh gi\xE1 trung b\xECnh: ").concat(product.averageRating, "/5 sao");
    if (product.numOfReviews) {
      reviewInfo += " (".concat(product.numOfReviews, " l\u01B0\u1EE3t \u0111\xE1nh gi\xE1)");
    }
  } else {
    reviewInfo = "<strong>\u0110\xE1nh gi\xE1 ".concat(product.productName, ":</strong><br>\n    S\u1EA3n ph\u1EA9m n\xE0y ch\u01B0a c\xF3 \u0111\xE1nh gi\xE1. ").concat(product.productName, " l\xE0 s\u1EA3n ph\u1EA9m ch\u1EA5t l\u01B0\u1EE3ng cao, \n    \u0111\u01B0\u1EE3c nhi\u1EC1u kh\xE1ch h\xE0ng tin d\xF9ng trong th\u1EDDi gian qua.");
  }
  return {
    success: true,
    message: reviewInfo,
    intent: 'productReviews'
  };
};

/**
 * Xử lý câu hỏi về sản phẩm cụ thể
 * @param {string} message - Câu hỏi của người dùng
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handleProductPageQuestion = exports.handleProductPageQuestion = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(message, product) {
    var productIntent, lowerMessage;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          if (!(!message || !product)) {
            _context2.next = 3;
            break;
          }
          return _context2.abrupt("return", {
            success: false,
            message: "Thông tin không đầy đủ"
          });
        case 3:
          console.log("\u0110ang x\u1EED l\xFD c\xE2u h\u1ECFi: \"".concat(message, "\" v\u1EC1 s\u1EA3n ph\u1EA9m ").concat(product.productName));

          // Phát hiện intent từ message
          productIntent = detectProductPageIntent(message);
          console.log("Sản phẩm intent được phát hiện:", productIntent);

          // Xử lý theo intent
          if (!productIntent) {
            _context2.next = 20;
            break;
          }
          _context2.t0 = productIntent;
          _context2.next = _context2.t0 === 'productUsage' ? 10 : _context2.t0 === 'productIntro' ? 11 : _context2.t0 === 'productPrice' ? 12 : _context2.t0 === 'relatedProducts' ? 13 : _context2.t0 === 'productOrigin' ? 16 : _context2.t0 === 'productIngredients' ? 17 : _context2.t0 === 'productExpiry' ? 18 : _context2.t0 === 'productReviews' ? 19 : 20;
          break;
        case 10:
          return _context2.abrupt("return", handleProductUsageQuestion(product));
        case 11:
          return _context2.abrupt("return", handleProductIntroQuestion(product));
        case 12:
          return _context2.abrupt("return", handleProductPriceQuestion(product));
        case 13:
          _context2.next = 15;
          return handleRelatedProductsQuestion(product);
        case 15:
          return _context2.abrupt("return", _context2.sent);
        case 16:
          return _context2.abrupt("return", handleProductOriginQuestion(product));
        case 17:
          return _context2.abrupt("return", handleProductIngredientsQuestion(product));
        case 18:
          return _context2.abrupt("return", handleProductExpiryQuestion(product));
        case 19:
          return _context2.abrupt("return", handleProductReviewsQuestion(product));
        case 20:
          lowerMessage = message.toLowerCase(); // Xử lý các loại câu hỏi khác nhau
          // Câu hỏi về công dụng
          if (!containsAny(lowerMessage, ['công dụng', 'tác dụng', 'để làm gì', 'dùng để', 'dùng như thế nào', 'sử dụng', 'cách dùng'])) {
            _context2.next = 23;
            break;
          }
          return _context2.abrupt("return", generateUsageResponse(product));
        case 23:
          if (!containsAny(lowerMessage, ['giới thiệu', 'nói về', 'thông tin về', 'mô tả', 'sản phẩm này', 'thế nào'])) {
            _context2.next = 25;
            break;
          }
          return _context2.abrupt("return", generateIntroductionResponse(product));
        case 25:
          if (!containsAny(lowerMessage, ['giá bao nhiêu', 'bao nhiêu tiền', 'giá cả', 'giá tiền', 'giá'])) {
            _context2.next = 27;
            break;
          }
          return _context2.abrupt("return", generatePriceResponse(product));
        case 27:
          if (!containsAny(lowerMessage, ['xuất xứ', 'sản xuất', 'thành phần', 'nguyên liệu', 'có chứa', 'bảo quản'])) {
            _context2.next = 29;
            break;
          }
          return _context2.abrupt("return", generateOriginResponse(product));
        case 29:
          if (!containsAny(lowerMessage, ['review', 'đánh giá', 'nhận xét', 'phản hồi', 'ý kiến', 'tốt không', 'có tốt', 'có ngon'])) {
            _context2.next = 31;
            break;
          }
          return _context2.abrupt("return", generateReviewResponse(product));
        case 31:
          if (!containsAny(lowerMessage, ['sản phẩm tương tự', 'tương tự', 'giống', 'sản phẩm khác', 'thay thế', 'sản phẩm liên quan', 'liên quan'])) {
            _context2.next = 35;
            break;
          }
          _context2.next = 34;
          return generateSimilarProductsResponse(product);
        case 34:
          return _context2.abrupt("return", _context2.sent);
        case 35:
          return _context2.abrupt("return", {
            success: true,
            type: 'text',
            message: "S\u1EA3n ph\u1EA9m ".concat(product.productName, " thu\u1ED9c danh m\u1EE5c ").concat(product.productCategory || product.category, " v\u1EDBi gi\xE1 ").concat(formatCurrency(product.productPrice || product.price || 0), ". B\u1EA1n mu\u1ED1n bi\u1EBFt th\xEAm th\xF4ng tin g\xEC v\u1EC1 s\u1EA3n ph\u1EA9m n\xE0y?")
          });
        case 38:
          _context2.prev = 38;
          _context2.t1 = _context2["catch"](0);
          console.error("Lỗi khi xử lý câu hỏi sản phẩm:", _context2.t1);
          return _context2.abrupt("return", {
            success: false,
            message: "Đã xảy ra lỗi khi xử lý câu hỏi. Vui lòng thử lại sau."
          });
        case 42:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 38]]);
  }));
  return function handleProductPageQuestion(_x2, _x3) {
    return _ref2.apply(this, arguments);
  };
}();

/**
 * Kiểm tra xem chuỗi có chứa một trong các từ khóa không
 * @param {string} text - Chuỗi cần kiểm tra
 * @param {Array} keywords - Mảng các từ khóa
 * @returns {boolean} - Có chứa từ khóa hay không
 */
var containsAny = function containsAny(text, keywords) {
  return keywords.some(function (keyword) {
    return text.includes(keyword);
  });
};

/**
 * Tạo phản hồi về công dụng sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var generateUsageResponse = function generateUsageResponse(product) {
  var message = '';
  if (product.productDetails && product.productDetails.length > 0) {
    message = "".concat(product.productName, " ").concat(product.productDetails);
  } else if (product.description && product.description.length > 0) {
    message = "".concat(product.productName, " d\xF9ng \u0111\u1EC3 ").concat(product.description);
  } else {
    message = "".concat(product.productName, " l\xE0 s\u1EA3n ph\u1EA9m ").concat(product.productCategory || product.category, ". B\u1EA1n c\xF3 th\u1EC3 s\u1EED d\u1EE5ng s\u1EA3n ph\u1EA9m theo h\u01B0\u1EDBng d\u1EABn tr\xEAn bao b\xEC.");
  }
  return {
    success: true,
    type: 'text',
    message: message
  };
};

/**
 * Tạo phản hồi về giá sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var generatePriceResponse = function generatePriceResponse(product) {
  // Lấy giá gốc và giá khuyến mãi nếu có
  var originalPrice = product.productPrice || product.price || 0;
  var discount = product.productDiscount || 0;
  var promoPrice = product.productPromoPrice || (discount > 0 ? Math.round(originalPrice * (1 - discount / 100)) : originalPrice);
  var message = '';
  if (discount > 0) {
    message = "Gi\xE1 c\u1EE7a ".concat(product.productName, " l\xE0 ").concat(formatCurrency(promoPrice), "\u0111 (\u0110\xE3 gi\u1EA3m ").concat(discount, "% t\u1EEB ").concat(formatCurrency(originalPrice), "\u0111).");
  } else {
    message = "Gi\xE1 c\u1EE7a ".concat(product.productName, " l\xE0 ").concat(formatCurrency(originalPrice), "\u0111.");
  }
  return {
    success: true,
    type: 'text',
    message: message
  };
};

/**
 * Tạo phản hồi về xuất xứ sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var generateOriginResponse = function generateOriginResponse(product) {
  var message = '';
  if (product.productOrigin || product.origin) {
    message = "".concat(product.productName, " c\xF3 xu\u1EA5t x\u1EE9 t\u1EEB ").concat(product.productOrigin || product.origin, ".");

    // Thêm thông tin thương hiệu nếu có
    if (product.productBrand) {
      message += " S\u1EA3n ph\u1EA9m thu\u1ED9c th\u01B0\u01A1ng hi\u1EC7u ".concat(product.productBrand, ".");
    }
  } else {
    message = "Th\xF4ng tin chi ti\u1EBFt v\u1EC1 xu\u1EA5t x\u1EE9 v\xE0 th\xE0nh ph\u1EA7n c\u1EE7a ".concat(product.productName, " \u0111\u01B0\u1EE3c ghi r\xF5 tr\xEAn bao b\xEC s\u1EA3n ph\u1EA9m.");
  }
  return {
    success: true,
    type: 'text',
    message: message
  };
};

/**
 * Tạo phản hồi về đánh giá sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var generateReviewResponse = function generateReviewResponse(product) {
  // Nếu có đánh giá thực tế từ database, có thể sử dụng thông tin đó
  var message = '';
  if (product.averageRating && product.averageRating > 0) {
    message = "".concat(product.productName, " c\xF3 \u0111i\u1EC3m \u0111\xE1nh gi\xE1 trung b\xECnh l\xE0 ").concat(product.averageRating, "/5 sao t\u1EEB ").concat(product.numOfReviews || 0, " l\u01B0\u1EE3t \u0111\xE1nh gi\xE1.");
  } else {
    message = "".concat(product.productName, " l\xE0 m\u1ED9t s\u1EA3n ph\u1EA9m ch\u1EA5t l\u01B0\u1EE3ng cao thu\u1ED9c danh m\u1EE5c ").concat(product.productCategory || product.category, ". ");
    if (product.productIntroduction) {
      message += product.productIntroduction;
    } else {
      message += "Kh\xE1ch h\xE0ng \u0111\xE1nh gi\xE1 r\u1EA5t t\u1ED1t v\u1EC1 s\u1EA3n ph\u1EA9m n\xE0y.";
    }
  }
  return {
    success: true,
    type: 'text',
    message: message
  };
};

/**
 * Tạo phản hồi về sản phẩm tương tự
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var generateSimilarProductsResponse = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(product) {
    var category, similarProducts;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          console.log("Tìm sản phẩm tương tự cho:", product.productName);
          category = product.productCategory || product.category;
          if (category) {
            _context3.next = 6;
            break;
          }
          console.error("Không tìm thấy danh mục cho sản phẩm:", product.productName);
          return _context3.abrupt("return", {
            success: true,
            type: 'text',
            message: "Hi\u1EC7n t\u1EA1i ch\xFAng t\xF4i kh\xF4ng t\xECm th\u1EA5y s\u1EA3n ph\u1EA9m t\u01B0\u01A1ng t\u1EF1 v\u1EDBi ".concat(product.productName, ".")
          });
        case 6:
          console.log("Tìm sản phẩm tương tự thuộc danh mục:", category);

          // Tìm các sản phẩm cùng danh mục
          _context3.next = 9;
          return _Products["default"].find({
            $or: [{
              productCategory: category
            }, {
              category: category
            }],
            _id: {
              $ne: product._id
            }
          }).limit(5);
        case 9:
          similarProducts = _context3.sent;
          console.log("T\xECm th\u1EA5y ".concat(similarProducts.length, " s\u1EA3n ph\u1EA9m t\u01B0\u01A1ng t\u1EF1 thu\u1ED9c danh m\u1EE5c ").concat(category));
          if (!(similarProducts && similarProducts.length > 0)) {
            _context3.next = 15;
            break;
          }
          return _context3.abrupt("return", {
            success: true,
            type: 'categoryQuery',
            message: "\u0110\xE2y l\xE0 m\u1ED9t s\u1ED1 s\u1EA3n ph\u1EA9m t\u01B0\u01A1ng t\u1EF1 v\u1EDBi ".concat(product.productName, ":"),
            data: similarProducts
          });
        case 15:
          return _context3.abrupt("return", {
            success: true,
            type: 'text',
            message: "Hi\u1EC7n t\u1EA1i ch\xFAng t\xF4i kh\xF4ng c\xF3 s\u1EA3n ph\u1EA9m t\u01B0\u01A1ng t\u1EF1 v\u1EDBi ".concat(product.productName, " thu\u1ED9c danh m\u1EE5c ").concat(category, ".")
          });
        case 16:
          _context3.next = 22;
          break;
        case 18:
          _context3.prev = 18;
          _context3.t0 = _context3["catch"](0);
          console.error("Lỗi khi tìm sản phẩm tương tự:", _context3.t0);
          return _context3.abrupt("return", {
            success: true,
            type: 'text',
            message: "Kh\xF4ng th\u1EC3 t\xECm th\u1EA5y s\u1EA3n ph\u1EA9m t\u01B0\u01A1ng t\u1EF1 v\u1EDBi ".concat(product.productName, ". Xin l\u1ED7i v\xEC s\u1EF1 b\u1EA5t ti\u1EC7n n\xE0y.")
          });
        case 22:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[0, 18]]);
  }));
  return function generateSimilarProductsResponse(_x4) {
    return _ref3.apply(this, arguments);
  };
}();

/**
 * Tạo phản hồi về giới thiệu sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
var generateIntroductionResponse = function generateIntroductionResponse(product) {
  var message = '';
  if (product.productIntroduction && product.productIntroduction.length > 0) {
    message = "Gi\u1EDBi thi\u1EC7u v\u1EC1 ".concat(product.productName, ": ").concat(product.productIntroduction);
  } else if (product.productInfo && product.productInfo.length > 0) {
    message = "Gi\u1EDBi thi\u1EC7u v\u1EC1 ".concat(product.productName, ": ").concat(product.productInfo);
  } else {
    message = "".concat(product.productName, " l\xE0 s\u1EA3n ph\u1EA9m ").concat(product.productCategory || product.category, ". Hi\u1EC7n ch\u01B0a c\xF3 th\xF4ng tin gi\u1EDBi thi\u1EC7u chi ti\u1EBFt v\u1EC1 s\u1EA3n ph\u1EA9m n\xE0y.");
  }
  return {
    success: true,
    type: 'text',
    message: message
  };
};