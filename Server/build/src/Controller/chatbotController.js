"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handleRasaWebhook = exports.handleMessage = void 0;
var _axios = _interopRequireDefault(require("axios"));
var _Products = _interopRequireDefault(require("../Model/Products.js"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _child_process = require("child_process");
var _path = _interopRequireDefault(require("path"));
var _fs = _interopRequireDefault(require("fs"));
var _chatbotProductHandler = require("./chatbotProductHandler.js");
var _chatbotFAQHandler = require("./chatbotFAQHandler.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; } /* eslint-disable no-useless-escape */ /* eslint-disable no-empty */ /* eslint-disable no-unused-vars */ /* eslint-disable no-undef */ // Import xử lý câu hỏi về sản phẩm
// Load environment variables
_dotenv["default"].config();

// Cache để lưu ngữ cảnh cuộc hội thoại cho từng người dùng
var conversationContext = new Map();

// Thời gian hết hạn cho ngữ cảnh (15 phút = 15 * 60 * 1000 ms)
var CONTEXT_EXPIRY_TIME = 15 * 60 * 1000;

/**
 * Trích xuất nguyên liệu từ câu trả lời công thức nấu ăn
 * @param {string} recipeResponse - Câu trả lời công thức nấu ăn
 * @returns {string[]} - Danh sách nguyên liệu đã trích xuất
 */
var extractIngredientsFromRecipe = function extractIngredientsFromRecipe(recipeResponse) {
  if (!recipeResponse) return [];

  // Danh sách nguyên liệu phổ biến để tìm kiếm
  var commonIngredients = ['thịt', 'cá', 'hải sản', 'gà', 'bò', 'heo', 'vịt', 'trứng', 'hột vịt', 'hột gà', 'rau', 'củ', 'quả', 'cà chua', 'cà rốt', 'bắp cải', 'xà lách', 'hành', 'tỏi', 'gừng', 'ớt', 'tiêu', 'muối', 'đường', 'nước mắm', 'dầu ăn', 'dầu hào', 'nước tương', 'mì', 'bún', 'phở', 'miến', 'gạo', 'bột', 'bánh', 'kẹo', 'nước dừa', 'sữa', 'nước', 'bia', 'rượu'];

  // Tạo pattern để tìm nguyên liệu từ danh sách đánh số
  var ingredientListPattern = /\d+\.\s+([^\d]+?)(?=\n|$)/g;
  var ingredients = [];

  // Tìm kiếm danh sách đánh số
  var match;
  while ((match = ingredientListPattern.exec(recipeResponse)) !== null) {
    var ingredient = match[1].trim().toLowerCase();
    ingredients.push(ingredient);
  }

  // Nếu không tìm thấy danh sách đánh số, tìm kiếm các nguyên liệu phổ biến
  if (ingredients.length === 0) {
    var lowerResponse = recipeResponse.toLowerCase();
    var _iterator = _createForOfIteratorHelper(commonIngredients),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var _ingredient = _step.value;
        if (lowerResponse.includes(_ingredient)) {
          // Trích xuất nguyên liệu và ngữ cảnh xung quanh
          var regex = new RegExp("\\b".concat(_ingredient, "\\b([^,.;]+)?"), 'g');
          var ingredientMatch = void 0;
          while ((ingredientMatch = regex.exec(lowerResponse)) !== null) {
            var fullMatch = ingredientMatch[0].trim();
            ingredients.push(fullMatch);
          }
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }

  // Loại bỏ trùng lặp và tinh chỉnh
  ingredients = _toConsumableArray(new Set(ingredients)).map(function (ing) {
    // Loại bỏ số lượng và đơn vị
    return ing.replace(/\(\d+.*?\)/g, '').replace(/\d+\s*(g|kg|ml|l|muỗng|tép|củ|quả)/gi, '').replace(/khoảng/gi, '').trim();
  }).filter(function (ing) {
    return ing.length > 1;
  }); // Loại bỏ các mục quá ngắn

  return ingredients;
};

/**
 * Lưu ngữ cảnh cuộc hội thoại
 * @param {string} userId - ID người dùng
 * @param {object} context - Dữ liệu ngữ cảnh
 */
var saveContext = function saveContext(userId, context) {
  if (!userId) return;

  // Lấy ngữ cảnh hiện tại hoặc tạo mới nếu không có
  var currentContext = conversationContext.get(userId) || {
    createdAt: Date.now()
  };

  // Cập nhật ngữ cảnh
  conversationContext.set(userId, _objectSpread(_objectSpread(_objectSpread({}, currentContext), context), {}, {
    updatedAt: Date.now()
  }));
  console.log("\u0110\xE3 l\u01B0u ng\u1EEF c\u1EA3nh cho user ".concat(userId, ":"), JSON.stringify(context));
};

/**
 * Lấy ngữ cảnh cuộc hội thoại
 * @param {string} userId - ID người dùng
 * @returns {object|null} - Dữ liệu ngữ cảnh hoặc null nếu không có/hết hạn
 */
var getContext = function getContext(userId) {
  if (!userId) return null;
  var context = conversationContext.get(userId);
  if (!context) return null;

  // Kiểm tra xem ngữ cảnh có hết hạn chưa
  var now = Date.now();
  if (now - context.updatedAt > CONTEXT_EXPIRY_TIME) {
    // Nếu hết hạn, xóa ngữ cảnh và trả về null
    conversationContext["delete"](userId);
    return null;
  }
  return context;
};

// Hàm xử lý tin nhắn từ người dùng
var handleMessage = exports.handleMessage = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(req, res) {
    var _req$body, message, userId, productId, isIngredientRequest, context, ingredients, multiResults, totalProducts, queriesWithResults, responseMessage, lastProducts, multiProductQueries, _multiResults, _totalProducts, _queriesWithResults, _responseMessage, _lastProducts, product, productResponse, isContextDependent, _context, _productResponse, _response, productQuestion, products, intent, response, pyRes, productResults, faqResponse, _products;
    return _regeneratorRuntime().wrap(function _callee$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _req$body = req.body, message = _req$body.message, userId = _req$body.userId, productId = _req$body.productId;
          if (message) {
            _context2.next = 4;
            break;
          }
          return _context2.abrupt("return", res.status(400).json({
            success: false,
            message: "Message is required"
          }));
        case 4:
          console.log("Nh\u1EADn tin nh\u1EAFn t\u1EEB user ".concat(userId || 'anonymous', ": \"").concat(message, "\""));
          console.log("Thông tin sản phẩm đang xem (productId):", productId);

          // Kiểm tra xem có phải yêu cầu về nguyên liệu từ công thức trước đó
          isIngredientRequest = /tìm (các )?nguyên liệu|nguyên liệu (ở )?trên|chỗ nào (có )?bán|mua (ở )?đâu/i.test(message);
          if (!(isIngredientRequest && userId)) {
            _context2.next = 31;
            break;
          }
          context = getContext(userId);
          if (!(context && context.lastRecipe)) {
            _context2.next = 31;
            break;
          }
          console.log("Phát hiện yêu cầu tìm nguyên liệu từ công thức trước:", context.lastRecipe.substring(0, 50) + "...");

          // Trích xuất nguyên liệu từ công thức
          ingredients = extractIngredientsFromRecipe(context.lastRecipe);
          console.log("Các nguyên liệu được trích xuất:", ingredients);
          if (!(ingredients.length > 0)) {
            _context2.next = 30;
            break;
          }
          _context2.next = 16;
          return handleMultiProductSearch(ingredients);
        case 16:
          multiResults = _context2.sent;
          if (!(multiResults.length > 0)) {
            _context2.next = 27;
            break;
          }
          // Đếm tổng số sản phẩm tìm được
          totalProducts = multiResults.reduce(function (total, result) {
            return total + (result.products ? result.products.length : 0);
          }, 0); // Đếm số lượng queries có kết quả
          queriesWithResults = multiResults.filter(function (result) {
            return result.products && result.products.length > 0;
          }).length; // Tạo thông báo phù hợp
          responseMessage = "";
          if (queriesWithResults === ingredients.length) {
            responseMessage = "T\xF4i \u0111\xE3 t\xECm th\u1EA5y ".concat(totalProducts, " s\u1EA3n ph\u1EA9m ph\xF9 h\u1EE3p v\u1EDBi ").concat(ingredients.length, " nguy\xEAn li\u1EC7u t\u1EEB c\xF4ng th\u1EE9c:");
          } else if (queriesWithResults > 0) {
            responseMessage = "T\xF4i t\xECm th\u1EA5y s\u1EA3n ph\u1EA9m ph\xF9 h\u1EE3p v\u1EDBi ".concat(queriesWithResults, "/").concat(ingredients.length, " nguy\xEAn li\u1EC7u t\u1EEB c\xF4ng th\u1EE9c:");
          } else {
            responseMessage = "Rất tiếc, tôi không tìm thấy sản phẩm phù hợp với các nguyên liệu từ công thức. Bạn có thể thử lại với từ khóa khác không?";
          }

          // Lưu kết quả tìm kiếm vào ngữ cảnh
          lastProducts = multiResults.flatMap(function (result) {
            return result.products || [];
          });
          saveContext(userId, {
            multiSearchResults: multiResults,
            lastProducts: lastProducts.length > 0 ? lastProducts : null,
            lastProduct: lastProducts.length > 0 ? lastProducts[0] : null,
            lastQuery: message
          });
          return _context2.abrupt("return", res.status(200).json({
            success: true,
            type: 'multiProductSearch',
            message: responseMessage,
            data: multiResults,
            totalResults: totalProducts
          }));
        case 27:
          return _context2.abrupt("return", res.status(200).json({
            success: true,
            type: 'text',
            message: "Rất tiếc, tôi không tìm thấy sản phẩm phù hợp với các nguyên liệu từ công thức. Bạn có thể tìm kiếm trực tiếp bằng từng nguyên liệu cụ thể."
          }));
        case 28:
          _context2.next = 31;
          break;
        case 30:
          return _context2.abrupt("return", res.status(200).json({
            success: true,
            type: 'text',
            message: "Tôi không thể trích xuất được nguyên liệu từ công thức trước đó. Bạn có thể cho tôi biết cụ thể nguyên liệu bạn đang tìm kiếm không?"
          }));
        case 31:
          // Kiểm tra xem có phải yêu cầu tìm nhiều sản phẩm cùng lúc không
          multiProductQueries = detectMultiProductSearch(message);
          if (!multiProductQueries) {
            _context2.next = 47;
            break;
          }
          console.log("Phát hiện yêu cầu tìm nhiều sản phẩm cùng lúc:", multiProductQueries);
          _context2.next = 36;
          return handleMultiProductSearch(multiProductQueries);
        case 36:
          _multiResults = _context2.sent;
          if (!(_multiResults.length > 0)) {
            _context2.next = 46;
            break;
          }
          // Đếm tổng số sản phẩm tìm được
          _totalProducts = _multiResults.reduce(function (total, result) {
            return total + (result.products ? result.products.length : 0);
          }, 0); // Đếm số lượng queries có kết quả
          _queriesWithResults = _multiResults.filter(function (result) {
            return result.products && result.products.length > 0;
          }).length; // Tạo thông báo phù hợp
          _responseMessage = "";
          if (_queriesWithResults === multiProductQueries.length) {
            // Tìm thấy kết quả cho tất cả các truy vấn
            _responseMessage = "T\xF4i \u0111\xE3 t\xECm th\u1EA5y ".concat(_totalProducts, " s\u1EA3n ph\u1EA9m ph\xF9 h\u1EE3p v\u1EDBi ").concat(multiProductQueries.length, " lo\u1EA1i b\u1EA1n y\xEAu c\u1EA7u:");
          } else if (_queriesWithResults > 0) {
            // Chỉ tìm thấy kết quả cho một số truy vấn
            _responseMessage = "T\xF4i t\xECm th\u1EA5y s\u1EA3n ph\u1EA9m ph\xF9 h\u1EE3p v\u1EDBi ".concat(_queriesWithResults, "/").concat(multiProductQueries.length, " lo\u1EA1i b\u1EA1n y\xEAu c\u1EA7u:");
          } else {
            // Không tìm thấy kết quả nào
            _responseMessage = "Tôi không tìm thấy sản phẩm nào phù hợp với yêu cầu của bạn. Bạn có thể thử lại với từ khóa khác không?";
          }

          // Lưu kết quả tìm kiếm vào ngữ cảnh nếu có userId
          if (userId) {
            _lastProducts = _multiResults.flatMap(function (result) {
              return result.products || [];
            });
            saveContext(userId, {
              multiSearchResults: _multiResults,
              lastProducts: _lastProducts.length > 0 ? _lastProducts : null,
              lastProduct: _lastProducts.length > 0 ? _lastProducts[0] : null,
              lastQuery: message
            });
          }
          return _context2.abrupt("return", res.status(200).json({
            success: true,
            type: 'multiProductSearch',
            message: _responseMessage,
            data: _multiResults,
            totalResults: _totalProducts
          }));
        case 46:
          return _context2.abrupt("return", res.status(200).json({
            success: true,
            type: 'text',
            message: "Rất tiếc, tôi không tìm thấy sản phẩm nào phù hợp với các tiêu chí tìm kiếm của bạn. Bạn có thể thử lại với các từ khóa khác không?"
          }));
        case 47:
          if (!productId) {
            _context2.next = 66;
            break;
          }
          _context2.prev = 48;
          _context2.next = 51;
          return _Products["default"].findById(productId);
        case 51:
          product = _context2.sent;
          if (!product) {
            _context2.next = 61;
            break;
          }
          console.log("\u0110ang x\u1EED l\xFD c\xE2u h\u1ECFi v\u1EC1 s\u1EA3n ph\u1EA9m: ".concat(product.productName));

          // Lưu sản phẩm vào ngữ cảnh
          saveContext(userId, {
            lastProduct: product
          });

          // Xử lý câu hỏi về sản phẩm hiện tại
          _context2.next = 57;
          return (0, _chatbotProductHandler.handleProductPageQuestion)(message, product);
        case 57:
          productResponse = _context2.sent;
          if (!(productResponse && productResponse.success)) {
            _context2.next = 61;
            break;
          }
          console.log("Phản hồi từ xử lý câu hỏi sản phẩm:", productResponse.message);
          return _context2.abrupt("return", res.status(200).json(productResponse));
        case 61:
          _context2.next = 66;
          break;
        case 63:
          _context2.prev = 63;
          _context2.t0 = _context2["catch"](48);
          console.error("Lỗi khi xử lý câu hỏi về sản phẩm:", _context2.t0);
        case 66:
          // Kiểm tra xem có phải câu hỏi phụ thuộc ngữ cảnh sản phẩm trước đó không
          isContextDependent = checkContextDependentQuery(message);
          console.log("Kiểm tra câu hỏi phụ thuộc ngữ cảnh:", isContextDependent);
          if (!(isContextDependent && userId)) {
            _context2.next = 81;
            break;
          }
          _context = getContext(userId);
          console.log("Ngữ cảnh hiện tại:", _context ? JSON.stringify({
            hasLastProduct: !!_context.lastProduct,
            productName: _context.lastProduct ? _context.lastProduct.productName : null,
            lastQuery: _context.lastQuery || null
          }) : "Không có ngữ cảnh");
          if (!(_context && _context.lastProduct)) {
            _context2.next = 81;
            break;
          }
          console.log("Ph\xE1t hi\u1EC7n c\xE2u h\u1ECFi ph\u1EE5 thu\u1ED9c ng\u1EEF c\u1EA3nh v\u1EC1 s\u1EA3n ph\u1EA9m: ".concat(_context.lastProduct.productName));

          // Xử lý câu hỏi dựa trên sản phẩm trong ngữ cảnh
          _context2.next = 75;
          return (0, _chatbotProductHandler.handleProductPageQuestion)(message, _context.lastProduct);
        case 75:
          _productResponse = _context2.sent;
          if (!(_productResponse && _productResponse.success)) {
            _context2.next = 78;
            break;
          }
          return _context2.abrupt("return", res.status(200).json(_productResponse));
        case 78:
          // Nếu không xử lý được bằng handleProductPageQuestion, tạo câu trả lời dựa trên thuộc tính sản phẩm
          _response = generateContextResponse(message, _context.lastProduct);
          if (!_response) {
            _context2.next = 81;
            break;
          }
          return _context2.abrupt("return", res.status(200).json(_response));
        case 81:
          // Đối với câu hỏi "Có sản phẩm X không?"
          productQuestion = checkProductAvailabilityQuestion(message);
          if (!productQuestion) {
            _context2.next = 98;
            break;
          }
          _context2.prev = 83;
          _context2.next = 86;
          return searchProductsMongoDB(productQuestion);
        case 86:
          products = _context2.sent;
          if (!(products && products.length > 0)) {
            _context2.next = 92;
            break;
          }
          // Lưu sản phẩm đầu tiên vào ngữ cảnh để sử dụng cho câu hỏi tiếp theo
          saveContext(userId, {
            lastProduct: products[0],
            lastProducts: products
          });
          return _context2.abrupt("return", res.status(200).json({
            success: true,
            type: 'categoryQuery',
            message: "Ch\xFAng t\xF4i c\xF3 ".concat(products.length, " s\u1EA3n ph\u1EA9m ph\xF9 h\u1EE3p:"),
            data: products
          }));
        case 92:
          return _context2.abrupt("return", res.status(200).json({
            success: true,
            type: 'text',
            message: "R\u1EA5t ti\u1EBFc, ch\xFAng t\xF4i hi\u1EC7n kh\xF4ng c\xF3 s\u1EA3n ph\u1EA9m \"".concat(productQuestion, "\" trong kho. B\u1EA1n c\xF3 th\u1EC3 xem c\xE1c s\u1EA3n ph\u1EA9m t\u01B0\u01A1ng t\u1EF1 kh\xE1c kh\xF4ng?")
          }));
        case 93:
          _context2.next = 98;
          break;
        case 95:
          _context2.prev = 95;
          _context2.t1 = _context2["catch"](83);
          console.error("Lỗi khi tìm kiếm sản phẩm:", _context2.t1);
        case 98:
          // Tiếp tục xử lý các intent khác nếu không phải câu hỏi về sản phẩm hiện tại
          // Phát hiện intent từ tin nhắn
          intent = detectIntent(message);
          console.log("Intent được phát hiện:", intent);

          // Xử lý dựa trên intent
          _context2.t2 = intent;
          _context2.next = _context2.t2 === 'greeting' ? 103 : _context2.t2 === 'price' ? 105 : _context2.t2 === 'cooking_recipe' ? 107 : _context2.t2 === 'product' ? 122 : _context2.t2 === 'faq_how_to_buy' ? 139 : _context2.t2 === 'faq_how_to_order' ? 139 : _context2.t2 === 'faq_payment_methods' ? 139 : _context2.t2 === 'faq_store_location' ? 139 : _context2.t2 === 'faq_product_quality' ? 139 : _context2.t2 === 'faq_shipping_time' ? 139 : _context2.t2 === 'faq_return_policy' ? 139 : _context2.t2 === 'faq_promotions' ? 139 : _context2.t2 === 'faq_trending_products' ? 139 : _context2.t2 === 'faq_shipping_fee' ? 139 : _context2.t2 === 'faq_customer_support' ? 139 : _context2.t2 === 'unknown' ? 149 : 149;
          break;
        case 103:
          response = {
            success: true,
            type: 'text',
            message: "Xin chào! Tôi là trợ lý ảo của cửa hàng. Tôi có thể giúp gì cho bạn?"
          };
          return _context2.abrupt("break", 166);
        case 105:
          response = {
            success: true,
            type: 'text',
            message: "Để biết giá cụ thể của sản phẩm, vui lòng cho tôi biết bạn quan tâm đến sản phẩm nào?"
          };
          return _context2.abrupt("break", 166);
        case 107:
          _context2.prev = 107;
          _context2.next = 110;
          return _axios["default"].post('http://localhost:5000/api/chatbot/ask', {
            question: message
          });
        case 110:
          pyRes = _context2.sent;
          if (!(pyRes.data && pyRes.data.answer)) {
            _context2.next = 114;
            break;
          }
          // Lưu công thức vào ngữ cảnh để sử dụng sau này
          if (userId) {
            saveContext(userId, {
              lastRecipe: pyRes.data.answer,
              lastQuery: message
            });
          }
          return _context2.abrupt("return", res.status(200).json({
            success: true,
            type: 'text',
            message: pyRes.data.answer
          }));
        case 114:
          return _context2.abrupt("return", res.status(200).json({
            success: true,
            type: 'text',
            message: "Xin lỗi, tôi không tìm thấy công thức phù hợp."
          }));
        case 117:
          _context2.prev = 117;
          _context2.t3 = _context2["catch"](107);
          console.error("Lỗi khi lấy công thức nấu ăn:", _context2.t3);
          return _context2.abrupt("return", res.status(200).json({
            success: true,
            type: 'text',
            message: "Xin lỗi, đã có lỗi xảy ra khi lấy công thức nấu ăn."
          }));
        case 121:
          return _context2.abrupt("break", 166);
        case 122:
          _context2.prev = 122;
          _context2.next = 125;
          return searchProductsMongoDB(message);
        case 125:
          productResults = _context2.sent;
          if (!(productResults && productResults.length > 0)) {
            _context2.next = 131;
            break;
          }
          // Lưu sản phẩm đầu tiên vào ngữ cảnh
          if (userId) {
            saveContext(userId, {
              lastProduct: productResults[0],
              lastProducts: productResults,
              lastQuery: message
            });
            console.log("\u0110\xE3 l\u01B0u s\u1EA3n ph\u1EA9m \"".concat(productResults[0].productName, "\" v\xE0o ng\u1EEF c\u1EA3nh cho user ").concat(userId));
          }
          return _context2.abrupt("return", res.status(200).json({
            success: true,
            type: 'categoryQuery',
            message: "Đây là một số sản phẩm phù hợp với yêu cầu của bạn:",
            data: productResults
          }));
        case 131:
          response = {
            success: true,
            type: 'text',
            message: "Rất tiếc, tôi không tìm thấy sản phẩm phù hợp với yêu cầu của bạn. Bạn có thể mô tả chi tiết hơn không?"
          };
        case 132:
          _context2.next = 138;
          break;
        case 134:
          _context2.prev = 134;
          _context2.t4 = _context2["catch"](122);
          console.error("Lỗi khi tìm kiếm sản phẩm:", _context2.t4);
          response = {
            success: true,
            type: 'text',
            message: "Đã xảy ra lỗi khi tìm kiếm sản phẩm. Vui lòng thử lại sau."
          };
        case 138:
          return _context2.abrupt("break", 166);
        case 139:
          _context2.prev = 139;
          // Gọi hàm xử lý FAQ
          faqResponse = (0, _chatbotFAQHandler.handleFAQQuestion)(intent);
          if (!faqResponse) {
            _context2.next = 143;
            break;
          }
          return _context2.abrupt("return", res.status(200).json(faqResponse));
        case 143:
          _context2.next = 148;
          break;
        case 145:
          _context2.prev = 145;
          _context2.t5 = _context2["catch"](139);
          console.error("Lỗi khi xử lý câu hỏi FAQ:", _context2.t5);
        case 148:
          return _context2.abrupt("break", 166);
        case 149:
          _context2.prev = 149;
          _context2.next = 152;
          return searchProductsMongoDB(message);
        case 152:
          _products = _context2.sent;
          if (!(_products && _products.length > 0)) {
            _context2.next = 158;
            break;
          }
          // Lưu sản phẩm đầu tiên vào ngữ cảnh
          if (userId) {
            saveContext(userId, {
              lastProduct: _products[0],
              lastProducts: _products,
              lastQuery: message
            });
            console.log("\u0110\xE3 l\u01B0u s\u1EA3n ph\u1EA9m \"".concat(_products[0].productName, "\" v\xE0o ng\u1EEF c\u1EA3nh cho user ").concat(userId));
          }
          return _context2.abrupt("return", res.status(200).json({
            success: true,
            type: 'categoryQuery',
            message: "Đây là một số sản phẩm phù hợp với yêu cầu của bạn:",
            data: _products
          }));
        case 158:
          response = {
            success: true,
            type: 'text',
            message: "Tôi không tìm thấy thông tin phù hợp. Bạn có thể hỏi cụ thể hơn về sản phẩm, giá cả, hoặc thông tin khác không?"
          };
        case 159:
          _context2.next = 165;
          break;
        case 161:
          _context2.prev = 161;
          _context2.t6 = _context2["catch"](149);
          console.error("Lỗi khi xử lý câu hỏi:", _context2.t6);
          response = {
            success: true,
            type: 'text',
            message: "Tôi không hiểu ý của bạn. Bạn có thể diễn đạt theo cách khác được không?"
          };
        case 165:
          return _context2.abrupt("break", 166);
        case 166:
          return _context2.abrupt("return", res.status(200).json(response));
        case 169:
          _context2.prev = 169;
          _context2.t7 = _context2["catch"](0);
          console.error("Lỗi khi xử lý tin nhắn:", _context2.t7);
          return _context2.abrupt("return", res.status(500).json({
            success: false,
            message: "An error occurred while processing the message"
          }));
        case 173:
        case "end":
          return _context2.stop();
      }
    }, _callee, null, [[0, 169], [48, 63], [83, 95], [107, 117], [122, 134], [139, 145], [149, 161]]);
  }));
  return function handleMessage(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * Hàm xử lý webhook từ Rasa
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} - JSON response
 */
var handleRasaWebhook = exports.handleRasaWebhook = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res) {
    var rasaResponse;
    return _regeneratorRuntime().wrap(function _callee2$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          console.log("Nhận webhook từ Rasa:", req.body);

          // Xử lý dữ liệu từ Rasa
          rasaResponse = req.body; // Trả về phản hồi
          return _context3.abrupt("return", res.status(200).json({
            success: true,
            message: "Webhook received successfully",
            data: rasaResponse
          }));
        case 6:
          _context3.prev = 6;
          _context3.t0 = _context3["catch"](0);
          console.error("Lỗi khi xử lý webhook từ Rasa:", _context3.t0);
          return _context3.abrupt("return", res.status(500).json({
            success: false,
            message: "An error occurred while processing the webhook"
          }));
        case 10:
        case "end":
          return _context3.stop();
      }
    }, _callee2, null, [[0, 6]]);
  }));
  return function handleRasaWebhook(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

/**
 * Tìm kiếm sản phẩm trực tiếp bằng MongoDB
 * @param {string} query - Câu truy vấn tìm kiếm
 * @returns {Array} - Danh sách sản phẩm
 */
var searchProductsMongoDB = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(query) {
    var lowerQuery, priceMatch, priceHighMatch, priceBetweenMatch, conditions, isPriceQuery, maxPrice, minPrice, _minPrice, _maxPrice, specificPhrases, foundSpecificPhrase, _i, _specificPhrases, item, categoryKeywords, foundCategory, _i2, _categoryKeywords, _item, stopWords, words, priceKeywords, keywords, isVegetableSearch, isSpecialCategorySearch, categoryIndex, keywordConditions, _iterator2, _step2, keyword, _keywordConditions, _iterator3, _step3, _keyword, filter, products, allMatchedProducts, aggregationPipeline, isVegetableQuery, _categoryKeywords2, _i3, _categoryKeywords3, _item2;
    return _regeneratorRuntime().wrap(function _callee3$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          console.log("Đang tìm kiếm sản phẩm với query:", query);

          // Xử lý query để tìm từ khóa quan trọng
          lowerQuery = query.toLowerCase(); // Tìm kiếm sản phẩm theo giá
          priceMatch = lowerQuery.match(/dưới (\d+)k/i) || lowerQuery.match(/< (\d+)k/i) || lowerQuery.match(/nhỏ hơn (\d+)k/i);
          priceHighMatch = lowerQuery.match(/trên (\d+)k/i) || lowerQuery.match(/> (\d+)k/i) || lowerQuery.match(/lớn hơn (\d+)k/i);
          priceBetweenMatch = lowerQuery.match(/từ (\d+)k đến (\d+)k/i) || lowerQuery.match(/(\d+)k - (\d+)k/i); // Mảng các điều kiện tìm kiếm
          conditions = [];
          isPriceQuery = false; // Xử lý tìm kiếm theo khoảng giá
          if (priceMatch) {
            maxPrice = parseInt(priceMatch[1]) * 1000;
            conditions.push({
              $or: [{
                price: {
                  $lte: maxPrice
                }
              }, {
                productPrice: {
                  $lte: maxPrice
                }
              }]
            });
            isPriceQuery = true;
            console.log("Tìm sản phẩm có giá dưới:", maxPrice);
          } else if (priceHighMatch) {
            minPrice = parseInt(priceHighMatch[1]) * 1000;
            conditions.push({
              $or: [{
                price: {
                  $gte: minPrice
                }
              }, {
                productPrice: {
                  $gte: minPrice
                }
              }]
            });
            isPriceQuery = true;
            console.log("Tìm sản phẩm có giá trên:", minPrice);
          } else if (priceBetweenMatch) {
            _minPrice = parseInt(priceBetweenMatch[1]) * 1000;
            _maxPrice = parseInt(priceBetweenMatch[2]) * 1000;
            conditions.push({
              $or: [{
                price: {
                  $gte: _minPrice,
                  $lte: _maxPrice
                }
              }, {
                productPrice: {
                  $gte: _minPrice,
                  $lte: _maxPrice
                }
              }]
            });
            isPriceQuery = true;
            console.log("Tìm sản phẩm có giá từ", _minPrice, "đến", _maxPrice);
          }

          // Kiểm tra xem có cụm từ "nước giặt" không
          specificPhrases = [{
            phrase: "nước giặt",
            category: "Đồ gia dụng"
          }, {
            phrase: "nước rửa chén",
            category: "Đồ gia dụng"
          }, {
            phrase: "nước lau sàn",
            category: "Đồ gia dụng"
          }, {
            phrase: "nước giải khát",
            category: "Đồ uống"
          }, {
            phrase: "nước ngọt",
            category: "Đồ uống"
          }, {
            phrase: "nước tương",
            category: "Gia vị"
          }];
          foundSpecificPhrase = false;
          _i = 0, _specificPhrases = specificPhrases;
        case 12:
          if (!(_i < _specificPhrases.length)) {
            _context4.next = 22;
            break;
          }
          item = _specificPhrases[_i];
          if (!lowerQuery.includes(item.phrase)) {
            _context4.next = 19;
            break;
          }
          foundSpecificPhrase = true;
          conditions.push({
            $or: [{
              productName: {
                $regex: item.phrase,
                $options: 'i'
              }
            }, {
              description: {
                $regex: item.phrase,
                $options: 'i'
              }
            }, {
              category: item.category
            }]
          });
          console.log("T\xECm s\u1EA3n ph\u1EA9m v\u1EDBi c\u1EE5m t\u1EEB c\u1EE5 th\u1EC3: \"".concat(item.phrase, "\" thu\u1ED9c danh m\u1EE5c ").concat(item.category));
          return _context4.abrupt("break", 22);
        case 19:
          _i++;
          _context4.next = 12;
          break;
        case 22:
          if (!(!foundSpecificPhrase && !isPriceQuery)) {
            _context4.next = 36;
            break;
          }
          categoryKeywords = [{
            keywords: ['rau', 'củ', 'quả', 'rau củ', 'rau quả', 'trái cây'],
            category: 'Rau củ quả'
          }, {
            keywords: ['thịt', 'cá', 'hải sản', 'thịt cá', 'thủy hải sản'],
            category: 'Thịt và hải sản'
          }, {
            keywords: ['đồ uống', 'nước ngọt', 'bia', 'rượu'],
            category: 'Đồ uống'
          }, {
            keywords: ['gia vị', 'dầu ăn', 'nước mắm', 'muối', 'đường', 'mì chính'],
            category: 'Gia vị'
          }, {
            keywords: ['bánh', 'kẹo', 'snack', 'đồ ăn vặt'],
            category: 'Bánh kẹo'
          }, {
            keywords: ['mì', 'bún', 'phở', 'miến', 'hủ tiếu'],
            category: 'Mì, bún, phở'
          }, {
            keywords: ['giặt', 'xà phòng', 'nước rửa', 'lau', 'vệ sinh'],
            category: 'Đồ gia dụng'
          }];
          foundCategory = false;
          _i2 = 0, _categoryKeywords = categoryKeywords;
        case 26:
          if (!(_i2 < _categoryKeywords.length)) {
            _context4.next = 36;
            break;
          }
          _item = _categoryKeywords[_i2];
          if (!_item.keywords.some(function (keyword) {
            return lowerQuery.includes(keyword);
          })) {
            _context4.next = 33;
            break;
          }
          conditions.push({
            category: _item.category
          });
          console.log("Tìm sản phẩm thuộc danh mục:", _item.category);
          foundCategory = true;
          return _context4.abrupt("break", 36);
        case 33:
          _i2++;
          _context4.next = 26;
          break;
        case 36:
          // Tìm theo từ khóa cụ thể (tên sản phẩm)
          stopWords = ['tìm', 'kiếm', 'sản', 'phẩm', 'sản phẩm', 'hàng', 'giá', 'mua', 'bán', 'các', 'có', 'không', 'vậy', 'shop', 'cửa hàng', 'thì', 'là', 'và', 'hay', 'hoặc', 'nhé', 'ạ', 'dưới', 'trên', 'khoảng', 'từ', 'đến'];
          words = lowerQuery.split(/\s+/); // Lọc bỏ từ khóa giá (100k, 50k)
          priceKeywords = words.filter(function (word) {
            return word.match(/\d+k$/i);
          });
          keywords = words.filter(function (word) {
            return !stopWords.includes(word) && word.length > 1 && !word.match(/\d+k$/i);
          });
          console.log("Từ khóa giá:", priceKeywords);
          console.log("Từ khóa tìm kiếm:", keywords);

          // Xử lý đặc biệt cho trường hợp tìm kiếm "rau"
          isVegetableSearch = keywords.some(function (kw) {
            return ['rau', 'củ', 'quả'].includes(kw);
          });
          isSpecialCategorySearch = false;
          if (isVegetableSearch) {
            isSpecialCategorySearch = true;
            // Nếu chỉ toàn từ khóa liên quan đến rau củ quả, ưu tiên sử dụng danh mục thay vì tìm theo từ khóa
            if (keywords.every(function (kw) {
              return ['rau', 'củ', 'quả', 'trái'].includes(kw);
            })) {
              console.log("Tìm tất cả sản phẩm trong danh mục Rau củ quả");
              // Xóa điều kiện tìm kiếm hiện tại nếu có
              categoryIndex = conditions.findIndex(function (c) {
                return c.category === 'Rau củ quả';
              });
              if (categoryIndex !== -1) {
                conditions.splice(categoryIndex, 1);
              }
              // Thêm điều kiện tìm kiếm theo danh mục
              conditions.push({
                category: 'Rau củ quả'
              });
            }
          }

          // Nếu đây là câu hỏi về giá, ưu tiên chỉ tìm theo giá nếu không có từ khóa đặc biệt
          if (isPriceQuery) {
            if (keywords.length === 0) {
              console.log("Đây là câu hỏi tìm theo giá, chỉ tìm kiếm dựa trên điều kiện giá");
            } else {
              // Tạo các điều kiện tìm kiếm theo từng từ khóa
              keywordConditions = [];
              _iterator2 = _createForOfIteratorHelper(keywords);
              try {
                for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                  keyword = _step2.value;
                  keywordConditions.push({
                    productName: {
                      $regex: keyword,
                      $options: 'i'
                    }
                  });
                  keywordConditions.push({
                    description: {
                      $regex: keyword,
                      $options: 'i'
                    }
                  });
                }
              } catch (err) {
                _iterator2.e(err);
              } finally {
                _iterator2.f();
              }
              if (keywordConditions.length > 0) {
                conditions.push({
                  $or: keywordConditions
                });
                console.log("Tìm sản phẩm theo cả giá và từ khóa:", keywords);
              }
            }
          }
          // Nếu không phải câu hỏi về giá, tìm theo từ khóa thông thường
          else if (keywords.length > 0 && !isSpecialCategorySearch) {
            // Tạo các điều kiện tìm kiếm theo từng từ khóa
            _keywordConditions = [];
            _iterator3 = _createForOfIteratorHelper(keywords);
            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                _keyword = _step3.value;
                _keywordConditions.push({
                  productName: {
                    $regex: _keyword,
                    $options: 'i'
                  }
                });
                _keywordConditions.push({
                  description: {
                    $regex: _keyword,
                    $options: 'i'
                  }
                });
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
            if (_keywordConditions.length > 0) {
              conditions.push({
                $or: _keywordConditions
              });
              console.log("Tìm sản phẩm theo từ khóa:", keywords);
            }
          }
          filter = {}; // Xây dựng filter tùy thuộc vào loại tìm kiếm
          if (isPriceQuery && keywords.length === 0) {
            // Nếu chỉ tìm theo giá, không bao gồm từ khóa
            filter = conditions.length > 0 ? {
              $and: conditions
            } : {};
          } else if (isPriceQuery && keywords.length > 0) {
            // Nếu tìm theo cả giá và từ khóa, cho phép tìm kiếm linh hoạt hơn (giá HOẶC từ khóa)
            filter = {
              $or: conditions
            };
          } else {
            // Các trường hợp tìm kiếm thông thường khác
            filter = conditions.length > 0 ? {
              $and: conditions
            } : {};
          }
          console.log("Filter tìm kiếm:", JSON.stringify(filter));
          _context4.prev = 49;
          products = [];
          if (!(Object.keys(filter).length > 0)) {
            _context4.next = 94;
            break;
          }
          _context4.next = 54;
          return _Products["default"].find(filter).limit(20);
        case 54:
          allMatchedProducts = _context4.sent;
          if (!(allMatchedProducts.length === 0)) {
            _context4.next = 89;
            break;
          }
          if (!(keywords.length > 0)) {
            _context4.next = 63;
            break;
          }
          console.log("Không tìm thấy sản phẩm, thử tìm chỉ với từ khóa");

          // Tạo pipeline aggregation để tính điểm phù hợp
          aggregationPipeline = [{
            $match: {
              $or: keywords.flatMap(function (keyword) {
                return [{
                  productName: {
                    $regex: keyword,
                    $options: 'i'
                  }
                }, {
                  description: {
                    $regex: keyword,
                    $options: 'i'
                  }
                }];
              })
            }
          }, {
            $addFields: {
              matchScore: {
                $add: keywords.map(function (keyword) {
                  return [{
                    $cond: [{
                      $regexMatch: {
                        input: "$productName",
                        regex: keyword,
                        options: "i"
                      }
                    }, 2, 0]
                  }, {
                    $cond: [{
                      $regexMatch: {
                        input: "$description",
                        regex: keyword,
                        options: "i"
                      }
                    }, 1, 0]
                  }];
                }).flat()
              }
            }
          }, {
            $sort: {
              matchScore: -1
            }
          }, {
            $limit: 10
          }];
          _context4.next = 61;
          return _Products["default"].aggregate(aggregationPipeline);
        case 61:
          products = _context4.sent;
          console.log("T\xECm th\u1EA5y ".concat(products.length, " s\u1EA3n ph\u1EA9m b\u1EB1ng t\u1EEB kh\xF3a v\u1EDBi \u0111i\u1EC3m ph\xF9 h\u1EE3p"));
        case 63:
          if (!(products.length === 0 && !foundSpecificPhrase)) {
            _context4.next = 87;
            break;
          }
          // Xử lý đặc biệt cho từ khóa "rau"
          isVegetableQuery = lowerQuery.includes("rau") || lowerQuery.includes("củ") || lowerQuery.includes("quả");
          if (!isVegetableQuery) {
            _context4.next = 73;
            break;
          }
          console.log("Thử tìm tất cả sản phẩm trong danh mục Rau củ quả");
          _context4.next = 69;
          return _Products["default"].find({
            category: "Rau củ quả"
          }).limit(10);
        case 69:
          products = _context4.sent;
          if (!(products.length > 0)) {
            _context4.next = 73;
            break;
          }
          console.log("T\xECm th\u1EA5y ".concat(products.length, " s\u1EA3n ph\u1EA9m trong danh m\u1EE5c Rau c\u1EE7 qu\u1EA3"));
          return _context4.abrupt("return", products);
        case 73:
          _categoryKeywords2 = [{
            keywords: ['rau', 'củ', 'quả', 'rau củ', 'rau quả', 'trái cây'],
            category: 'Rau củ quả'
          }, {
            keywords: ['thịt', 'cá', 'hải sản', 'thịt cá', 'thủy hải sản'],
            category: 'Thịt và hải sản'
          }, {
            keywords: ['đồ uống', 'nước ngọt', 'bia', 'rượu'],
            category: 'Đồ uống'
          }, {
            keywords: ['gia vị', 'dầu ăn', 'nước mắm', 'muối', 'đường', 'mì chính'],
            category: 'Gia vị'
          }, {
            keywords: ['bánh', 'kẹo', 'snack', 'đồ ăn vặt'],
            category: 'Bánh kẹo'
          }, {
            keywords: ['mì', 'bún', 'phở', 'miến', 'hủ tiếu'],
            category: 'Mì, bún, phở'
          }, {
            keywords: ['giặt', 'xà phòng', 'nước rửa', 'lau', 'vệ sinh'],
            category: 'Đồ gia dụng'
          }];
          _i3 = 0, _categoryKeywords3 = _categoryKeywords2;
        case 75:
          if (!(_i3 < _categoryKeywords3.length)) {
            _context4.next = 87;
            break;
          }
          _item2 = _categoryKeywords3[_i3];
          if (!_item2.keywords.some(function (keyword) {
            return lowerQuery.includes(keyword);
          })) {
            _context4.next = 84;
            break;
          }
          console.log("Thử tìm chỉ với danh mục:", _item2.category);
          _context4.next = 81;
          return _Products["default"].find({
            category: _item2.category
          }).limit(10);
        case 81:
          products = _context4.sent;
          if (!(products.length > 0)) {
            _context4.next = 84;
            break;
          }
          return _context4.abrupt("break", 87);
        case 84:
          _i3++;
          _context4.next = 75;
          break;
        case 87:
          _context4.next = 92;
          break;
        case 89:
          // Nếu có kết quả, tính điểm phù hợp và sắp xếp kết quả
          products = allMatchedProducts.map(function (product) {
            try {
              // Kiểm tra xem product có hợp lệ không
              if (!product || _typeof(product) !== 'object') {
                console.log("Bỏ qua sản phẩm không hợp lệ:", product);
                return {
                  matchScore: -1
                }; // Sẽ bị loại bỏ khi sắp xếp
              }

              // Chuyển đổi an toàn thành plain object
              var productObj = product.toObject ? product.toObject() : product;

              // Đảm bảo các trường văn bản tồn tại
              var nameText = (productObj.productName || '').toLowerCase();
              var descText = (productObj.description || '').toLowerCase();

              // Tính điểm dựa trên số từ khóa khớp
              var score = 0;

              // Nếu có cụm từ cụ thể, cho điểm cao hơn
              var _iterator4 = _createForOfIteratorHelper(specificPhrases),
                _step4;
              try {
                for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                  var phrase = _step4.value.phrase;
                  if (nameText.includes(phrase)) score += 5;
                  if (descText.includes(phrase)) score += 3;
                }

                // Tính điểm cho từng từ khóa
              } catch (err) {
                _iterator4.e(err);
              } finally {
                _iterator4.f();
              }
              var _iterator5 = _createForOfIteratorHelper(keywords),
                _step5;
              try {
                for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                  var _keyword2 = _step5.value;
                  if (nameText.includes(_keyword2)) score += 2;
                  if (descText.includes(_keyword2)) score += 1;
                }

                // Nếu khớp chính xác với cụm từ tìm kiếm, cho điểm cao nhất
              } catch (err) {
                _iterator5.e(err);
              } finally {
                _iterator5.f();
              }
              var exactPhrase = keywords.join(' ');
              if (exactPhrase.length > 3 && nameText.includes(exactPhrase)) {
                score += 10;
              }
              return _objectSpread(_objectSpread({}, productObj), {}, {
                matchScore: score
              });
            } catch (error) {
              console.error("Lỗi khi tính điểm cho sản phẩm:", error);
              return {
                matchScore: -1
              }; // Sẽ bị loại bỏ khi sắp xếp
            }
          }).filter(function (product) {
            return product.matchScore > -1;
          }); // Loại bỏ các sản phẩm không hợp lệ

          // Sắp xếp theo điểm cao nhất trước
          products.sort(function (a, b) {
            return b.matchScore - a.matchScore;
          });

          // Giới hạn kết quả
          products = products.slice(0, 10);
        case 92:
          _context4.next = 97;
          break;
        case 94:
          _context4.next = 96;
          return _Products["default"].find().sort({
            createdAt: -1
          }).limit(10);
        case 96:
          products = _context4.sent;
        case 97:
          console.log("T\xECm th\u1EA5y ".concat(products.length, " s\u1EA3n ph\u1EA9m ph\xF9 h\u1EE3p"));
          return _context4.abrupt("return", products);
        case 101:
          _context4.prev = 101;
          _context4.t0 = _context4["catch"](49);
          console.error("Lỗi khi tìm kiếm sản phẩm với MongoDB:", _context4.t0);
          throw _context4.t0;
        case 105:
          _context4.next = 111;
          break;
        case 107:
          _context4.prev = 107;
          _context4.t1 = _context4["catch"](0);
          console.error("Lỗi khi tìm kiếm sản phẩm với MongoDB:", _context4.t1);
          throw _context4.t1;
        case 111:
        case "end":
          return _context4.stop();
      }
    }, _callee3, null, [[0, 107], [49, 101]]);
  }));
  return function searchProductsMongoDB(_x5) {
    return _ref3.apply(this, arguments);
  };
}();

/**
 * Phát hiện intent từ tin nhắn
 * @param {string} message - Tin nhắn từ người dùng
 * @returns {string} - Intent được phát hiện
 */
var detectIntent = function detectIntent(message) {
  var lowerMessage = message.toLowerCase();
  // Kiểm tra xem có phải là câu hỏi FAQ không
  var faqIntent = detectFAQIntent(lowerMessage);
  if (faqIntent) {
    return faqIntent;
  }
  // Thêm nhận diện intent công thức nấu ăn
  if (isCookingQuestion(lowerMessage)) {
    return 'cooking_recipe';
  }
  // Mẫu xử lý intent đơn giản
  if (lowerMessage.includes('chào') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return 'greeting';
  }
  if (lowerMessage.includes('giá') || lowerMessage.includes('bao nhiêu')) {
    return 'price';
  }
  if (lowerMessage.includes('sản phẩm') || lowerMessage.includes('mua') || lowerMessage.includes('hàng')) {
    return 'product';
  }
  // Trả về intent mặc định nếu không nhận diện được
  return 'unknown';
};

/**
 * Phát hiện intent liên quan đến FAQ
 * @param {string} message - Tin nhắn từ người dùng đã lowercase
 * @returns {string|null} - Intent FAQ hoặc null nếu không phát hiện
 */
var detectFAQIntent = function detectFAQIntent(message) {
  // Mua hàng
  if (message.includes('làm sao để mua') || message.includes('mua hàng như thế nào') || message.includes('cách mua') || message.includes('mua hàng') || message.includes('mua như thế nào') || message.includes('cách thức mua')) {
    return 'faq_how_to_buy';
  }

  // Đặt hàng
  if (message.includes('đặt hàng') || message.includes('cách đặt') || message.includes('đặt mua') || message.includes('đặt như thế nào')) {
    return 'faq_how_to_order';
  }

  // Thanh toán
  if (message.includes('thanh toán') || message.includes('phương thức thanh toán') || message.includes('cách thanh toán') || message.includes('hình thức thanh toán') || message.includes('trả tiền') || message.includes('bao nhiêu hình thức thanh toán')) {
    return 'faq_payment_methods';
  }

  // Địa chỉ cửa hàng
  if (message.includes('địa chỉ') || message.includes('cửa hàng ở đâu') || message.includes('shop ở đâu') || message.includes('vị trí') || message.includes('địa điểm')) {
    return 'faq_store_location';
  }

  // Chất lượng sản phẩm
  if (message.includes('chất lượng') || message.includes('sản phẩm có tốt') || message.includes('có đảm bảo') || message.includes('hàng có tốt') || message.includes('sản phẩm tốt không')) {
    return 'faq_product_quality';
  }

  // Thời gian giao hàng
  if (message.includes('giao hàng') || message.includes('ship') || message.includes('vận chuyển') || message.includes('thời gian giao') || message.includes('giao trong bao lâu') || message.includes('mất bao lâu để nhận')) {
    return 'faq_shipping_time';
  }

  // Chính sách đổi trả
  if (message.includes('đổi trả') || message.includes('hoàn tiền') || message.includes('trả lại') || message.includes('đổi hàng') || message.includes('bị lỗi') || message.includes('không hài lòng')) {
    return 'faq_return_policy';
  }

  // Khuyến mãi hiện có
  if (message.includes('khuyến mãi') || message.includes('giảm giá') || message.includes('ưu đãi') || message.includes('có mã giảm') || message.includes('đang giảm giá')) {
    return 'faq_promotions';
  }

  // Sản phẩm mới/bán chạy
  if (message.includes('sản phẩm mới') || message.includes('mới ra mắt') || message.includes('bán chạy nhất') || message.includes('phổ biến nhất') || message.includes('hot nhất') || message.includes('xu hướng')) {
    return 'faq_trending_products';
  }

  // Phí vận chuyển
  if (message.includes('phí vận chuyển') || message.includes('phí ship') || message.includes('phí giao hàng') || message.includes('ship bao nhiêu tiền') || message.includes('tốn bao nhiêu tiền giao hàng')) {
    return 'faq_shipping_fee';
  }

  // Hỗ trợ khách hàng
  if (message.includes('hỗ trợ') || message.includes('liên hệ') || message.includes('tư vấn') || message.includes('hotline') || message.includes('số điện thoại') || message.includes('email')) {
    return 'faq_customer_support';
  }
  return null;
};

/**
 * Kiểm tra xem câu hỏi có phụ thuộc vào ngữ cảnh sản phẩm không
 * @param {string} message - Câu hỏi của người dùng
 * @returns {boolean} - Có phụ thuộc vào ngữ cảnh sản phẩm hay không
 */
var checkContextDependentQuery = function checkContextDependentQuery(message) {
  var lowerMessage = message.toLowerCase();

  // Nếu là câu hỏi về món ăn/công thức thì KHÔNG phụ thuộc ngữ cảnh sản phẩm
  if (isCookingQuestion(lowerMessage)) return false;

  // Kiểm tra xem có phải là câu tìm kiếm mới không
  // Nếu là tìm kiếm mới thì không phụ thuộc ngữ cảnh
  if (lowerMessage.includes('tìm') || lowerMessage.includes('kiếm') || lowerMessage.includes('có sản phẩm') || lowerMessage.includes('dưới') || lowerMessage.includes('trên') || lowerMessage.includes('khoảng giá') || lowerMessage.includes('k ') || lowerMessage.match(/\d+k/)) {
    console.log("Đây là câu hỏi tìm kiếm mới, không phụ thuộc ngữ cảnh");
    return false;
  }

  // Các mẫu câu hỏi phụ thuộc ngữ cảnh
  var contextPatterns = [
  // Câu hỏi về công dụng
  /công dụng/i, /tác dụng/i, /dùng để làm gì/i, /dùng để/i, /dùng như thế nào/i, /sử dụng/i, /cách dùng/i,
  // Câu hỏi về giá
  /giá bao nhiêu/i, /bao nhiêu tiền/i, /giá/i, /bao nhiêu/i,
  // Câu hỏi về xuất xứ, thành phần
  /xuất xứ/i, /sản xuất/i, /thành phần/i, /nguyên liệu/i, /có chứa/i, /bảo quản/i,
  // Câu hỏi về giới thiệu
  /giới thiệu/i, /nói về/i, /thông tin về/i, /mô tả/i,
  // Đại từ chỉ định không rõ ràng
  /sản phẩm này/i, /nó/i, /cái này/i, /món này/i, /hàng này/i,
  // Sản phẩm liên quan
  /sản phẩm liên quan/i, /liên quan/i, /tương tự/i, /giống/i, /sản phẩm khác/i,
  // Câu hỏi mơ hồ khác mà không đề cập sản phẩm cụ thể
  /hạn sử dụng/i, /bảo hành/i, /chất lượng/i, /đánh giá/i, /review/i];
  return contextPatterns.some(function (pattern) {
    return pattern.test(lowerMessage);
  });
};

/**
 * Kiểm tra câu hỏi về việc có sản phẩm nào đó không
 * @param {string} message - Câu hỏi của người dùng
 * @returns {string|null} - Tên sản phẩm được trích xuất hoặc null nếu không phải
 */
var checkProductAvailabilityQuestion = function checkProductAvailabilityQuestion(message) {
  var lowerMessage = message.toLowerCase();

  // Mẫu câu hỏi "Có sản phẩm X không"
  var productAvailabilityPatterns = [/có (bán |cung cấp |sản phẩm |hàng |)?([a-zA-Z0-9À-ỹ\s]+?) (không|ko|k|hong|hông)(\?)?$/i, /shop (có |bán |cung cấp |)([a-zA-Z0-9À-ỹ\s]+?) (không|ko|k|hong|hông)(\?)?$/i, /cửa hàng (có |bán |cung cấp |)([a-zA-Z0-9À-ỹ\s]+?) (không|ko|k|hong|hông)(\?)?$/i];
  for (var _i4 = 0, _productAvailabilityP = productAvailabilityPatterns; _i4 < _productAvailabilityP.length; _i4++) {
    var pattern = _productAvailabilityP[_i4];
    var match = lowerMessage.match(pattern);
    if (match) {
      var productName = match[2].trim();
      // Loại bỏ các từ không cần thiết
      var stopWords = ['sản phẩm', 'hàng', 'cái', 'món', 'đồ'];
      var cleanProductName = productName;
      for (var _i5 = 0, _stopWords = stopWords; _i5 < _stopWords.length; _i5++) {
        var word = _stopWords[_i5];
        if (cleanProductName.startsWith(word + ' ')) {
          cleanProductName = cleanProductName.substring(word.length).trim();
        }
      }
      return cleanProductName;
    }
  }
  return null;
};

/**
 * Tạo câu trả lời dựa trên ngữ cảnh sản phẩm
 * @param {string} message - Câu hỏi của người dùng
 * @param {object} product - Thông tin sản phẩm
 * @returns {object|null} - Câu trả lời hoặc null nếu không thể trả lời
 */
var generateContextResponse = function generateContextResponse(message, product) {
  var lowerMessage = message.toLowerCase();

  // Kiểm tra lại lần nữa product có tồn tại không
  if (!product) return null;

  // Tạo câu trả lời dựa vào loại câu hỏi
  var responseMessage = '';

  // Câu hỏi về công dụng
  if (/công dụng|tác dụng|dùng để làm gì|dùng để|dùng như thế nào|sử dụng|cách dùng/.test(lowerMessage)) {
    responseMessage = product.productDetails ? "".concat(product.productName, " ").concat(product.productDetails) : "".concat(product.productName, " l\xE0 s\u1EA3n ph\u1EA9m ").concat(product.productCategory || product.category, ". Vui l\xF2ng xem chi ti\u1EBFt s\u1EA3n ph\u1EA9m \u0111\u1EC3 bi\u1EBFt th\xEAm v\u1EC1 c\xF4ng d\u1EE5ng.");
  }
  // Câu hỏi về giới thiệu
  else if (/giới thiệu|nói về|thông tin về|mô tả|sản phẩm này|thế nào/.test(lowerMessage)) {
    responseMessage = product.productIntroduction ? "Gi\u1EDBi thi\u1EC7u v\u1EC1 ".concat(product.productName, ": ").concat(product.productIntroduction) : "".concat(product.productName, " l\xE0 s\u1EA3n ph\u1EA9m ").concat(product.productCategory || product.category, ". Hi\u1EC7n ch\u01B0a c\xF3 th\xF4ng tin gi\u1EDBi thi\u1EC7u chi ti\u1EBFt v\u1EC1 s\u1EA3n ph\u1EA9m n\xE0y.");
  }
  // Câu hỏi về giá
  else if (/giá bao nhiêu|bao nhiêu tiền|giá|bao nhiêu/.test(lowerMessage)) {
    var originalPrice = product.productPrice || product.price || 0;
    var discount = product.productDiscount || 0;
    var promoPrice = product.productPromoPrice || (discount > 0 ? Math.round(originalPrice * (1 - discount / 100)) : originalPrice);
    if (discount > 0) {
      responseMessage = "Gi\xE1 c\u1EE7a ".concat(product.productName, " l\xE0 ").concat(formatCurrency(promoPrice), " (\u0110\xE3 gi\u1EA3m ").concat(discount, "% t\u1EEB ").concat(formatCurrency(originalPrice), ").");
    } else {
      responseMessage = "Gi\xE1 c\u1EE7a ".concat(product.productName, " l\xE0 ").concat(formatCurrency(originalPrice), ".");
    }
  }
  // Câu hỏi về xuất xứ, thành phần
  else if (/xuất xứ|sản xuất|thành phần|nguyên liệu|có chứa|bảo quản/.test(lowerMessage)) {
    responseMessage = product.productOrigin || product.origin ? "".concat(product.productName, " c\xF3 xu\u1EA5t x\u1EE9 t\u1EEB ").concat(product.productOrigin || product.origin, ".") : "Th\xF4ng tin chi ti\u1EBFt v\u1EC1 xu\u1EA5t x\u1EE9 v\xE0 th\xE0nh ph\u1EA7n c\u1EE7a ".concat(product.productName, " \u0111\u01B0\u1EE3c ghi r\xF5 tr\xEAn bao b\xEC s\u1EA3n ph\u1EA9m.");

    // Thêm thông tin thương hiệu nếu có
    if (product.productBrand) {
      responseMessage += " S\u1EA3n ph\u1EA9m thu\u1ED9c th\u01B0\u01A1ng hi\u1EC7u ".concat(product.productBrand, ".");
    }
  }
  // Câu hỏi về hạn sử dụng
  else if (/hạn sử dụng|bảo hành|chất lượng/.test(lowerMessage)) {
    responseMessage = product.expiryDate ? "".concat(product.productName, " c\xF3 h\u1EA1n s\u1EED d\u1EE5ng \u0111\u1EBFn ").concat(product.expiryDate, ".") : "Th\xF4ng tin v\u1EC1 h\u1EA1n s\u1EED d\u1EE5ng c\u1EE7a ".concat(product.productName, " \u0111\u01B0\u1EE3c ghi r\xF5 tr\xEAn bao b\xEC s\u1EA3n ph\u1EA9m.");
  }
  // Các câu hỏi chung
  else {
    var price = product.productPrice || product.price || 0;
    responseMessage = "S\u1EA3n ph\u1EA9m ".concat(product.productName, " thu\u1ED9c danh m\u1EE5c ").concat(product.productCategory || product.category, " v\u1EDBi gi\xE1 ").concat(formatCurrency(price), ". B\u1EA1n mu\u1ED1n bi\u1EBFt th\xEAm th\xF4ng tin g\xEC v\u1EC1 s\u1EA3n ph\u1EA9m n\xE0y?");
  }
  return {
    success: true,
    type: 'text',
    message: responseMessage,
    product: product // Trả về thông tin sản phẩm để hiển thị nếu cần
  };
};

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

// Thêm hàm nhận diện câu hỏi về món ăn/công thức
var isCookingQuestion = function isCookingQuestion(message) {
  var cookingKeywords = ["nấu", "công thức", "nguyên liệu", "cách làm"];
  return cookingKeywords.some(function (kw) {
    return message.toLowerCase().includes(kw);
  });
};

/**
 * Detects if the user is trying to search for multiple products in one message
 * @param {string} message - User's message
 * @returns {string[]|null} - Array of product queries or null if not a multi-product search
 */
var detectMultiProductSearch = function detectMultiProductSearch(message) {
  if (!message) return null;
  var lowerMessage = message.toLowerCase().trim();

  // Danh sách các từ khoá sản phẩm phổ biến để kiểm tra
  var commonProductKeywords = ['nước giặt', 'nước rửa', 'nước ngọt', 'nước giải khát', 'pepsi', 'coca', 'thịt', 'cá', 'rau', 'củ', 'quả', 'bánh', 'kẹo', 'mì', 'bún', 'gia vị', 'dầu ăn', 'nước mắm', 'nước tương', 'sữa', 'trà', 'cà phê'];

  // Kiểm tra xem tin nhắn có chứa ít nhất 2 từ khoá sản phẩm không
  var productKeywordsFound = [];
  for (var _i6 = 0, _commonProductKeyword = commonProductKeywords; _i6 < _commonProductKeyword.length; _i6++) {
    var keyword = _commonProductKeyword[_i6];
    if (lowerMessage.includes(keyword)) {
      productKeywordsFound.push(keyword);
    }
  }

  // Nếu tìm thấy ít nhất 2 từ khoá sản phẩm, coi là tìm kiếm nhiều sản phẩm
  var hasMultipleProductKeywords = productKeywordsFound.length >= 2;

  // Check for multi-product search indicators
  var hasMultiSearchIndicator = lowerMessage.includes('nhiều sản phẩm') || lowerMessage.includes('nhiều loại') || lowerMessage.includes('tìm nhiều') || lowerMessage.includes('cùng lúc') || lowerMessage.includes('so sánh') || lowerMessage.includes('đối chiếu') || lowerMessage.includes('các loại') || lowerMessage.includes('các sản phẩm') || lowerMessage.match(/tìm.+và.+/) !== null ||
  // Thêm nhận diện khi tin nhắn chứa "tìm" và dấu phẩy
  lowerMessage.match(/tìm.+,.+/) !== null ||
  // Hoặc khi chứa từ tìm kiếm và chứa ít nhất 2 từ khoá sản phẩm
  lowerMessage.includes('tìm') && hasMultipleProductKeywords;

  // Nếu không có dấu hiệu tìm nhiều sản phẩm, kiểm tra thêm các trường hợp đặc biệt
  if (!hasMultiSearchIndicator) {
    // Kiểm tra xem có phải tin nhắn chỉ liệt kê các sản phẩm không, ví dụ: "nước giặt nước rửa chén"
    if (hasMultipleProductKeywords) {
      // Nếu có chứa ít nhất 2 từ khoá sản phẩm mà không có từ khoá tìm kiếm,
      // giả định là người dùng đang muốn tìm nhiều sản phẩm
      console.log("Phát hiện yêu cầu tìm nhiều sản phẩm từ danh sách từ khoá:", productKeywordsFound);
    } else {
      // Không phải tin nhắn tìm nhiều sản phẩm
      return null;
    }
  }

  // Common separators in Vietnamese queries
  var separators = [',', 'và', 'với', 'cùng với', ';', '+', 'so với', 'so sánh với'];

  // Try to split by common separators
  var parts = [];

  // Special handling for comparison queries
  if (lowerMessage.includes('so sánh') || lowerMessage.includes('đối chiếu')) {
    var comparisonTerms = ['so sánh', 'đối chiếu', 'so với', 'đối với', 'so', 'hơn', 'kém', 'thua'];

    // Extract the part after comparison keywords
    var cleanMessage = lowerMessage;
    for (var _i7 = 0, _comparisonTerms = comparisonTerms; _i7 < _comparisonTerms.length; _i7++) {
      var term = _comparisonTerms[_i7];
      if (lowerMessage.includes(term)) {
        var _lowerMessage$split$;
        cleanMessage = ((_lowerMessage$split$ = lowerMessage.split(term)[1]) === null || _lowerMessage$split$ === void 0 ? void 0 : _lowerMessage$split$.trim()) || lowerMessage;
        break;
      }
    }

    // If we have a cleaner message after comparison terms, try to split it
    if (cleanMessage !== lowerMessage) {
      var _iterator6 = _createForOfIteratorHelper(separators),
        _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var separator = _step6.value;
          if (cleanMessage.includes(separator)) {
            if (separator === 'và') {
              parts = cleanMessage.split(/\s+và\s+/i).filter(function (p) {
                return p.trim().length > 0;
              });
            } else if (separator === 'với' || separator === 'so với' || separator === 'so sánh với') {
              // Special handling for 'với' as it can be part of other phrases
              parts = cleanMessage.split(/\s+(với|so với|so sánh với)\s+/i).filter(function (p) {
                return p.trim().length > 0;
              });
            } else {
              parts = cleanMessage.split(separator).filter(function (p) {
                return p.trim().length > 0;
              });
            }
            break;
          }
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
    }
  } else {
    // Regular non-comparison multi-product search
    var _iterator7 = _createForOfIteratorHelper(separators),
      _step7;
    try {
      for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
        var _separator = _step7.value;
        // If we already have multiple parts, break
        if (parts.length > 1) break;

        // Try splitting by this separator
        if (message.toLowerCase().includes(_separator)) {
          // Handle "và" specially to avoid splitting phrases like "rau và củ" that should stay together
          if (_separator === 'và') {
            parts = message.split(/\s+và\s+/i).filter(function (p) {
              return p.trim().length > 0;
            });
          } else if (_separator === 'với' || _separator === 'so với' || _separator === 'so sánh với') {
            // Special handling for 'với' as it can be part of other phrases
            parts = message.split(/\s+(với|so với|so sánh với)\s+/i).filter(function (p) {
              return p.trim().length > 0;
            });
          } else {
            parts = message.split(_separator).filter(function (p) {
              return p.trim().length > 0;
            });
          }
        }
      }
    } catch (err) {
      _iterator7.e(err);
    } finally {
      _iterator7.f();
    }
  }

  // Nếu không tách được và có nhiều từ khoá sản phẩm, tạo ra các phần từ các từ khoá đó
  if (parts.length <= 1 && productKeywordsFound.length >= 2) {
    console.log("Tạo các phần tìm kiếm từ các từ khoá sản phẩm phát hiện được");

    // Loại bỏ "tìm", "tìm kiếm" từ tin nhắn
    var _cleanMessage = lowerMessage.replace(/tìm kiếm/i, '').replace(/tìm/i, '').trim();

    // Thử phát hiện các sản phẩm dựa trên các từ khoá phổ biến
    parts = [];
    var _iterator8 = _createForOfIteratorHelper(productKeywordsFound),
      _step8;
    try {
      for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
        var _keyword3 = _step8.value;
        // Tạo regex để lấy context xung quanh từ khoá
        var regex = new RegExp("(\\w+\\s+)?(\\w+\\s+)?".concat(_keyword3, "(\\s+\\w+)?(\\s+\\w+)?"), 'i');
        var match = _cleanMessage.match(regex);
        if (match) {
          parts.push(match[0].trim());
        } else {
          parts.push(_keyword3); // Nếu không lấy được context, dùng chính từ khoá
        }
      }
    } catch (err) {
      _iterator8.e(err);
    } finally {
      _iterator8.f();
    }
  }

  // If we couldn't split by separators but has multi-search indicator,
  // try to extract product names using NLP-like approach
  if (parts.length <= 1) {
    // Extract product names after removing common prefixes
    var _cleanMessage2 = lowerMessage.replace(/so sánh (giữa|của|về|giá|chất lượng|ưu điểm|nhược điểm) /i, '').replace(/so sánh/i, '').replace(/đối chiếu/i, '').replace(/tìm nhiều (sản phẩm|loại|thứ) (như|là|gồm|bao gồm|có)/i, '').replace(/tìm (các|những) (sản phẩm|loại|thứ) (như|là|gồm|bao gồm|có)/i, '').replace(/tìm (các|những|nhiều)/i, '').replace(/các loại/i, '').replace(/các sản phẩm/i, '').trim();

    // Re-attempt to split after cleaning
    var _iterator9 = _createForOfIteratorHelper(separators),
      _step9;
    try {
      for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
        var _separator2 = _step9.value;
        if (_cleanMessage2.includes(_separator2)) {
          if (_separator2 === 'và') {
            parts = _cleanMessage2.split(/\s+và\s+/i).filter(function (p) {
              return p.trim().length > 0;
            });
          } else if (_separator2 === 'với' || _separator2 === 'so với' || _separator2 === 'so sánh với') {
            parts = _cleanMessage2.split(/\s+(với|so với|so sánh với)\s+/i).filter(function (p) {
              return p.trim().length > 0;
            });
          } else {
            parts = _cleanMessage2.split(_separator2).filter(function (p) {
              return p.trim().length > 0;
            });
          }
          break;
        }
      }

      // If we still couldn't split it, try looking for product categories or common products
    } catch (err) {
      _iterator9.e(err);
    } finally {
      _iterator9.f();
    }
    if (parts.length <= 1) {
      var commonCategories = ['rau', 'củ', 'quả', 'thịt', 'cá', 'hải sản', 'đồ uống', 'nước ngọt', 'bia', 'rượu', 'bánh', 'kẹo', 'gia vị', 'dầu ăn', 'nước mắm', 'mì', 'bún', 'nước giặt', 'nước rửa', 'nước tẩy'];

      // Try to identify categories in the message
      var categories = [];
      for (var _i8 = 0, _commonCategories = commonCategories; _i8 < _commonCategories.length; _i8++) {
        var category = _commonCategories[_i8];
        if (_cleanMessage2.includes(category)) {
          // Extract surrounding context (up to 2 words before and after)
          var _regex = new RegExp("(\\w+\\s+)?(\\w+\\s+)?".concat(category, "(\\s+\\w+)?(\\s+\\w+)?"), 'i');
          var _match = _cleanMessage2.match(_regex);
          if (_match) {
            categories.push(_match[0].trim());
          }
        }
      }

      // If we found at least 2 categories, use them as parts
      if (categories.length >= 2) {
        parts = categories;
      }
    }
  }

  // Xử lý trường hợp đầu vào như "nước giặt nước rửa chén" (không có dấu phân cách)
  if (parts.length <= 1 && hasMultipleProductKeywords) {
    // Thử tách dựa vào từ khoá phổ biến
    var remainingText = lowerMessage;
    parts = [];

    // Sắp xếp các từ khoá theo độ dài giảm dần để đảm bảo tìm thấy từ dài nhất trước
    var sortedKeywords = [].concat(commonProductKeywords).sort(function (a, b) {
      return b.length - a.length;
    });
    while (remainingText.length > 0) {
      var found = false;
      var _iterator0 = _createForOfIteratorHelper(sortedKeywords),
        _step0;
      try {
        for (_iterator0.s(); !(_step0 = _iterator0.n()).done;) {
          var _keyword4 = _step0.value;
          if (remainingText.includes(_keyword4)) {
            var index = remainingText.indexOf(_keyword4);

            // Nếu có nội dung trước từ khoá và nó không chỉ là khoảng trắng
            if (index > 0) {
              var beforeText = remainingText.substring(0, index).trim();
              if (beforeText.length > 0) {
                parts.push(beforeText);
              }
            }

            // Thêm cụm từ khoá và context xung quanh
            var _regex2 = new RegExp("(\\w+\\s+)?(\\w+\\s+)?".concat(_keyword4, "(\\s+\\w+)?(\\s+\\w+)?"), 'i');
            var _match2 = remainingText.match(_regex2);
            if (_match2) {
              parts.push(_match2[0].trim());
              remainingText = remainingText.substring(index + _keyword4.length).trim();
            } else {
              parts.push(_keyword4);
              remainingText = remainingText.substring(index + _keyword4.length).trim();
            }
            found = true;
            break;
          }
        }

        // Nếu không tìm thấy từ khoá nào nữa, thêm phần còn lại vào parts nếu còn
      } catch (err) {
        _iterator0.e(err);
      } finally {
        _iterator0.f();
      }
      if (!found) {
        if (remainingText.trim().length > 0) {
          parts.push(remainingText.trim());
        }
        break;
      }
    }
  }

  // Loại bỏ các phần trùng lặp
  parts = _toConsumableArray(new Set(parts));

  // Loại bỏ các phần quá ngắn (ít hơn 2 ký tự)
  parts = parts.filter(function (p) {
    return p.length >= 2;
  });

  // Only consider it a multi-product search if we have at least 2 parts
  if (parts.length >= 2) {
    console.log("Tìm kiếm nhiều sản phẩm được phát hiện:", parts);
    return parts.map(function (p) {
      return p.trim();
    });
  }

  // Nếu vẫn không tìm được nhiều sản phẩm dù đã phát hiện dấu hiệu, 
  // cố gắng phân tích câu một cách thông minh hơn
  if (hasMultiSearchIndicator || hasMultipleProductKeywords) {
    console.log("Cố gắng phân tích câu thông minh hơn - lowerMessage:", lowerMessage);

    // Tạo danh sách từ khoá với các tiền tố phổ biến
    var expandedKeywords = [];
    var _iterator1 = _createForOfIteratorHelper(commonProductKeywords),
      _step1;
    try {
      for (_iterator1.s(); !(_step1 = _iterator1.n()).done;) {
        var _keyword6 = _step1.value;
        expandedKeywords.push(_keyword6);
        expandedKeywords.push("s\u1EA3n ph\u1EA9m ".concat(_keyword6));
        expandedKeywords.push("lo\u1EA1i ".concat(_keyword6));
      }

      // Tìm tất cả các từ khoá phổ biến trong tin nhắn
    } catch (err) {
      _iterator1.e(err);
    } finally {
      _iterator1.f();
    }
    var detectedProducts = [];
    for (var _i9 = 0, _expandedKeywords = expandedKeywords; _i9 < _expandedKeywords.length; _i9++) {
      var _keyword5 = _expandedKeywords[_i9];
      if (lowerMessage.includes(_keyword5)) {
        // Trích xuất từ khoá và ngữ cảnh xung quanh
        var _regex3 = new RegExp("(\\w+\\s+)?(\\w+\\s+)?".concat(_keyword5, "(\\s+\\w+)?(\\s+\\w+)?"), 'i');
        var _match3 = lowerMessage.match(_regex3);
        if (_match3) {
          detectedProducts.push(_match3[0].trim());
        }
      }
    }

    // Nếu phát hiện được từ 2 sản phẩm trở lên
    if (detectedProducts.length >= 2) {
      console.log("Phát hiện sản phẩm từ phân tích thông minh:", detectedProducts);
      return detectedProducts.map(function (p) {
        return p.trim();
      });
    }
  }
  return null;
};

/**
 * Handles search for multiple products
 * @param {string[]} queries - Array of search queries
 * @returns {Promise<Array>} - Search results for each query
 */
var handleMultiProductSearch = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(queries) {
    var results, stopWords, _iterator10, _step10, query, cleanQuery, _iterator11, _step11, word, products, originalProducts;
    return _regeneratorRuntime().wrap(function _callee4$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          results = []; // Danh sách các từ cần loại bỏ khi tìm kiếm
          stopWords = ['tìm', 'kiếm', 'tìm kiếm', 'sản phẩm', 'loại', 'như', 'các', 'những', 'nhiều', 'cho', 'tôi'];
          _iterator10 = _createForOfIteratorHelper(queries);
          _context5.prev = 3;
          _iterator10.s();
        case 5:
          if ((_step10 = _iterator10.n()).done) {
            _context5.next = 32;
            break;
          }
          query = _step10.value;
          _context5.prev = 7;
          // Chuẩn hoá query dựa vào từ khoá
          cleanQuery = query.toLowerCase().trim(); // Loại bỏ các stopwords để tập trung vào tên sản phẩm
          _iterator11 = _createForOfIteratorHelper(stopWords);
          try {
            for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
              word = _step11.value;
              // Chỉ loại bỏ nếu từ đứng độc lập, không phải một phần của từ khác
              cleanQuery = cleanQuery.replace(new RegExp("\\b".concat(word, "\\b"), 'gi'), '');
            }
          } catch (err) {
            _iterator11.e(err);
          } finally {
            _iterator11.f();
          }
          cleanQuery = cleanQuery.trim();
          console.log("T\xECm ki\u1EBFm s\u1EA3n ph\u1EA9m \"".concat(query, "\" (\u0111\xE3 chu\u1EA9n ho\xE1: \"").concat(cleanQuery, "\")"));

          // Sử dụng query đã chuẩn hoá để tìm kiếm
          _context5.next = 15;
          return searchProductsMongoDB(cleanQuery);
        case 15:
          products = _context5.sent;
          if (!(products && products.length > 0)) {
            _context5.next = 20;
            break;
          }
          results.push({
            query: query,
            // Giữ lại query gốc để hiển thị cho người dùng
            cleanQuery: cleanQuery,
            // Thêm query đã chuẩn hoá để debug
            products: products.slice(0, 5) // Limit to top 5 products per query
          });
          _context5.next = 25;
          break;
        case 20:
          // Thử lại với query gốc nếu query đã chuẩn hoá không có kết quả
          console.log("Kh\xF4ng t\xECm th\u1EA5y k\u1EBFt qu\u1EA3 v\u1EDBi query \u0111\xE3 chu\u1EA9n ho\xE1, th\u1EED l\u1EA1i v\u1EDBi query g\u1ED1c: \"".concat(query, "\""));
          _context5.next = 23;
          return searchProductsMongoDB(query);
        case 23:
          originalProducts = _context5.sent;
          if (originalProducts && originalProducts.length > 0) {
            results.push({
              query: query,
              cleanQuery: null,
              // Đánh dấu là không sử dụng query đã chuẩn hoá
              products: originalProducts.slice(0, 5)
            });
          }
        case 25:
          _context5.next = 30;
          break;
        case 27:
          _context5.prev = 27;
          _context5.t0 = _context5["catch"](7);
          console.error("L\u1ED7i khi t\xECm ki\u1EBFm s\u1EA3n ph\u1EA9m \"".concat(query, "\":"), _context5.t0);
        case 30:
          _context5.next = 5;
          break;
        case 32:
          _context5.next = 37;
          break;
        case 34:
          _context5.prev = 34;
          _context5.t1 = _context5["catch"](3);
          _iterator10.e(_context5.t1);
        case 37:
          _context5.prev = 37;
          _iterator10.f();
          return _context5.finish(37);
        case 40:
          return _context5.abrupt("return", results);
        case 41:
        case "end":
          return _context5.stop();
      }
    }, _callee4, null, [[3, 34, 37, 40], [7, 27]]);
  }));
  return function handleMultiProductSearch(_x6) {
    return _ref4.apply(this, arguments);
  };
}();