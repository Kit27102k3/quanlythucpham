"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handleFAQQuestion = exports.detectIntentFromKeywords = void 0;
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/**
 * Hệ thống xử lý câu hỏi thường gặp (FAQ)
 * File này chứa các hàm để trả lời các câu hỏi chung về cửa hàng, chính sách, và dịch vụ
 */

// Định nghĩa từ khóa cho mỗi intent để tăng độ chính xác khi nhận diện câu hỏi
var intentKeywords = {
  'faq_how_to_buy': ['mua hàng', 'mua sản phẩm', 'cách mua', 'mua như thế nào', 'làm sao để mua', 'đặt mua', 'mua như nào', 'mua ở đâu'],
  'faq_how_to_order': ['đặt hàng', 'order', 'cách đặt', 'các bước đặt hàng', 'hướng dẫn đặt hàng', 'làm sao để đặt', 'đặt như thế nào'],
  'faq_payment_methods': ['thanh toán', 'trả tiền', 'phương thức thanh toán', 'cách thanh toán', 'chuyển khoản', 'tiền mặt', 'thẻ tín dụng', 'cod', 'trả góp', 'visa', 'mastercard', 'atm', 'hình thức thanh toán'],
  'faq_store_location': ['địa chỉ', 'cửa hàng', 'chỗ bán', 'cơ sở', 'chi nhánh', 'vị trí', 'nơi bán', 'ở đâu', 'shop ở đâu', 'cửa hàng ở đâu', 'chỗ nào'],
  'faq_product_quality': ['chất lượng', 'sản phẩm', 'đảm bảo', 'độ an toàn', 'hạn sử dụng', 'chứng nhận', 'kiểm định', 'cam kết', 'bảo đảm', 'chất lượng như thế nào', 'nguồn gốc', 'xuất xứ'],
  'faq_shipping_time': ['giao hàng', 'vận chuyển', 'thời gian giao', 'bao lâu', 'mấy ngày', 'nhận hàng', 'ship', 'khi nào nhận được', 'giao trong bao lâu', 'giao nhanh không'],
  'faq_return_policy': ['đổi trả', 'hoàn tiền', 'trả lại', 'không ưng', 'đổi sản phẩm', 'chính sách đổi', 'bảo hành', 'không vừa ý', 'không thích', 'lỗi', 'hư hỏng', 'kém chất lượng', 'đổi hàng'],
  'faq_promotions': ['khuyến mãi', 'giảm giá', 'ưu đãi', 'sale', 'quà tặng kèm', 'mã giảm giá', 'voucher', 'coupon', 'có ưu đãi', 'đang giảm giá', 'sale off', 'có khuyến mãi không', 'ưu đãi gì'],
  'faq_trending_products': ['sản phẩm hot', 'bán chạy', 'xu hướng', 'mới nhất', 'phổ biến', 'nhiều người mua', 'trend', 'nổi bật', 'sản phẩm mới', 'hàng hot', 'hàng mới về', 'sản phẩm phổ biến'],
  'faq_shipping_fee': ['phí vận chuyển', 'phí giao hàng', 'ship', 'freeship', 'miễn phí giao', 'giá ship', 'tiền ship', 'tốn phí', 'mất phí', 'chi phí giao', 'free ship', 'giao miễn phí', 'phí ship'],
  'faq_customer_support': ['hỗ trợ', 'tư vấn', 'liên hệ', 'giúp đỡ', 'hotline', 'số điện thoại', 'nhân viên', 'chăm sóc', 'tổng đài', 'zalo', 'facebook', 'email'],
  'faq_membership': ['thành viên', 'khách hàng thân thiết', 'membership', 'hội viên', 'tích điểm', 'ưu đãi thành viên', 'vip', 'điểm thưởng', 'chương trình thành viên', 'quyền lợi', 'đăng ký thành viên'],
  'faq_organic_products': ['hữu cơ', 'organic', 'tự nhiên', 'không hóa chất', 'sạch', 'an toàn', 'sinh học', 'không thuốc trừ sâu', 'không phân bón', 'sản phẩm hữu cơ', 'thực phẩm sạch', 'xanh', 'eco'],
  'faq_dietary_options': ['ăn kiêng', 'chay', 'thuần chay', 'vegan', 'keto', 'low-carb', 'gluten-free', 'không đường', 'ít đường', 'không lactose', 'ăn chay', 'đồ chay', 'không tinh bột', 'ít muối', 'ít béo'],
  'faq_gift_services': ['quà tặng', 'gói quà', 'giỏ quà', 'thẻ quà tặng', 'gift card', 'gửi quà', 'quà biếu', 'quà sinh nhật', 'dịch vụ quà', 'gửi quà tặng', 'có dịch vụ gói quà không', 'làm hộp quà'],
  'faq_bulk_orders': ['đơn hàng lớn', 'mua số lượng nhiều', 'mua sỉ', 'đặt hàng số lượng lớn', 'doanh nghiệp', 'công ty đặt hàng', 'số lượng lớn', 'mua nhiều', 'giá sỉ', 'giảm giá khi mua nhiều', 'đơn đoàn', 'mua hàng loạt', 'mua với số lượng lớn', 'đơn hàng số lượng lớn', 'đơn số lượng lớn'],
  'faq_chatbot_help': ['chatbot có thể giúp gì cho tôi', 'chatbot giúp gì cho tôi', 'chatbot giúp gì', 'chatbot có thể giúp gì', 'chatbot hỗ trợ', 'bot có thể làm gì', 'chatbot làm được gì', 'trợ lý ảo', 'bot giúp được gì', 'bot hỗ trợ gì', 'chatbot có tính năng gì', 'website hỗ trợ', 'tính năng chatbot', 'tính năng website', 'hệ thống hỗ trợ', 'chatbot làm gì'],
  'faq_product_not_found': ['không tìm thấy sản phẩm', 'tìm không ra', 'không có sản phẩm', 'sản phẩm không có', 'không thấy hàng', 'không tìm được', 'sản phẩm không hiển thị', 'không thấy sản phẩm', 'tìm sản phẩm', 'tìm kiếm sản phẩm', 'tìm không thấy']
};

// Đánh giá mức độ ưu tiên cho từng loại intent
var intentPriority = {
  'faq_bulk_orders': 3,
  'faq_organic_products': 3,
  'faq_gift_services': 3,
  'faq_chatbot_help': 3,
  'faq_promotions': 2,
  'faq_payment_methods': 2,
  'faq_shipping_fee': 2,
  'faq_shipping_time': 2,
  'faq_return_policy': 2,
  'faq_dietary_options': 2,
  'faq_product_not_found': 2,
  'faq_how_to_buy': 1,
  'faq_how_to_order': 1,
  'faq_store_location': 1,
  'faq_product_quality': 1,
  'faq_trending_products': 1,
  'faq_customer_support': 1,
  'faq_membership': 1
};

/**
 * Phát hiện intent dựa trên từ khóa trong câu hỏi
 * @param {string} query - Câu hỏi của người dùng
 * @returns {string|null} - Intent phát hiện được hoặc null nếu không tìm thấy
 */
var detectIntentFromKeywords = exports.detectIntentFromKeywords = function detectIntentFromKeywords(query) {
  if (!query) return null;

  // Chuyển câu hỏi thành chữ thường để so sánh dễ dàng hơn
  var normalizedQuery = query.toLowerCase();
  console.log("Normalized Query: \"".concat(normalizedQuery, "\""));

  // Kiểm tra khớp chính xác với câu hỏi
  for (var _i = 0, _Object$entries = Object.entries(intentKeywords); _i < _Object$entries.length; _i++) {
    var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
      intent = _Object$entries$_i[0],
      keywords = _Object$entries$_i[1];
    var priority = intentPriority[intent] || 1;
    var _iterator = _createForOfIteratorHelper(keywords),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var keyword = _step.value;
        // Nếu câu hỏi khớp chính xác với từ khóa
        if (normalizedQuery === keyword.toLowerCase() || normalizedQuery.replace(/[?.,!]/g, '') === keyword.toLowerCase()) {
          console.log("Exact match found for intent: ".concat(intent, ", keyword: \"").concat(keyword, "\""));
          return intent;
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }

  // Điểm số cho mỗi intent
  var scores = {};
  var bestMatch = null;
  var highestScore = 0;

  // Kiểm tra khớp một phần với từ khóa
  for (var _i2 = 0, _Object$entries2 = Object.entries(intentKeywords); _i2 < _Object$entries2.length; _i2++) {
    var _Object$entries2$_i = _slicedToArray(_Object$entries2[_i2], 2),
      _intent = _Object$entries2$_i[0],
      _keywords = _Object$entries2$_i[1];
    var _priority = intentPriority[_intent] || 1;
    scores[_intent] = 0;
    var _iterator2 = _createForOfIteratorHelper(_keywords),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var _keyword = _step2.value;
        // Kiểm tra từ khóa dài trong câu hỏi
        if (_keyword.length > 10 && normalizedQuery.includes(_keyword.toLowerCase())) {
          scores[_intent] += _keyword.length * 2 * _priority;
          console.log("Long keyword match: \"".concat(_keyword, "\" for intent ").concat(_intent, ", score +").concat(_keyword.length * 2 * _priority));
        }
        // Từ khóa ngắn chỉ tính nếu là từ riêng biệt trong câu
        else if (normalizedQuery.includes(_keyword.toLowerCase())) {
          scores[_intent] += _keyword.length * _priority;
          console.log("Keyword match: \"".concat(_keyword, "\" for intent ").concat(_intent, ", score +").concat(_keyword.length * _priority));
        }
      }

      // Cập nhật intent có điểm cao nhất
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
    if (scores[_intent] > highestScore) {
      highestScore = scores[_intent];
      bestMatch = _intent;
    }
  }
  console.log("Best matching intent: ".concat(bestMatch, ", score: ").concat(highestScore));
  // Trả về intent phù hợp nhất nếu điểm đủ cao
  return highestScore > 0 ? bestMatch : null;
};

/**
 * Xử lý câu hỏi từ người dùng dựa trên loại intent đã phát hiện
 * @param {string} intent - Intent được phát hiện từ câu hỏi
 * @param {string} query - Câu hỏi gốc của người dùng
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handleFAQQuestion = exports.handleFAQQuestion = function handleFAQQuestion(intent) {
  var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  console.log("X\u1EED l\xFD c\xE2u h\u1ECFi FAQ v\u1EDBi intent: ".concat(intent));

  // Nếu không có intent được cung cấp, thử phát hiện từ câu hỏi
  if (!intent && query) {
    intent = detectIntentFromKeywords(query);
    console.log("Ph\xE1t hi\u1EC7n intent t\u1EEB c\xE2u h\u1ECFi: ".concat(intent));
  }

  // Định tuyến đến hàm xử lý tương ứng với intent
  switch (intent) {
    case 'faq_how_to_buy':
      return handleHowToBuy();
    case 'faq_how_to_order':
      return handleHowToOrder();
    case 'faq_payment_methods':
      return handlePaymentMethods();
    case 'faq_store_location':
      return handleStoreLocation();
    case 'faq_product_quality':
      return handleProductQuality();
    case 'faq_shipping_time':
      return handleShippingTime();
    case 'faq_return_policy':
      return handleReturnPolicy();
    case 'faq_promotions':
      return handlePromotions();
    case 'faq_trending_products':
      return handleTrendingProducts();
    case 'faq_shipping_fee':
      return handleShippingFee();
    case 'faq_customer_support':
      return handleCustomerSupport();
    case 'faq_membership':
      return handleMembership();
    case 'faq_organic_products':
      return handleOrganicProducts();
    case 'faq_dietary_options':
      return handleDietaryOptions();
    case 'faq_gift_services':
      return handleGiftServices();
    case 'faq_bulk_orders':
      return handleBulkOrders();
    case 'faq_chatbot_help':
      return handleChatbotHelp();
    case 'faq_product_not_found':
      return handleProductNotFound();
    default:
      return {
        success: true,
        type: 'text',
        message: "Tôi không tìm thấy thông tin phù hợp với câu hỏi của bạn. Vui lòng thử lại với câu hỏi khác hoặc liên hệ trực tiếp với bộ phận hỗ trợ khách hàng qua số điện thoại 0326 743391 để được giúp đỡ."
      };
  }
};

/**
 * Xử lý câu hỏi về cách mua hàng
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handleHowToBuy = function handleHowToBuy() {
  var message = "H\u01B0\u1EDBng d\u1EABn mua h\xE0ng:\n\nC\xE1ch 1: Mua h\xE0ng tr\u1EF1c tuy\u1EBFn\n1. T\xECm ki\u1EBFm s\u1EA3n ph\u1EA9m tr\xEAn trang web\n2. Nh\u1EA5p v\xE0o s\u1EA3n ph\u1EA9m \u0111\u1EC3 xem chi ti\u1EBFt\n3. Ch\u1ECDn \"Th\xEAm v\xE0o gi\u1ECF h\xE0ng\" ho\u1EB7c \"Mua ngay\"\n4. Ti\u1EBFn h\xE0nh \u0111\u1EB7t h\xE0ng v\xE0 thanh to\xE1n\n\nC\xE1ch 2: Mua h\xE0ng tr\u1EF1c ti\u1EBFp t\u1EA1i c\u1EEDa h\xE0ng\n- \u0110\u1ECBa ch\u1EC9: Tr\u01B0\u1EDDng \u0110\u1EA1i h\u1ECDc Nam C\u1EA7n Th\u01A1, Nguy\u1EC5n V\u0103n C\u1EEB n\u1ED1i d\xE0i, C\u1EA7n Th\u01A1\n- Th\u1EDDi gian m\u1EDF c\u1EEDa: 8:00 - 21:00 m\u1ED7i ng\xE0y\n\nC\xE1ch 3: \u0110\u1EB7t h\xE0ng qua \u0111i\u1EC7n tho\u1EA1i\n- Hotline: 0326 743391\n- Nh\xE2n vi\xEAn s\u1EBD h\u1ED7 tr\u1EE3 \u0111\u1EB7t h\xE0ng v\xE0 giao h\xE0ng t\u1EADn n\u01A1i";
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_how_to_buy'
  };
};

/**
 * Xử lý câu hỏi về cách đặt hàng
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handleHowToOrder = function handleHowToOrder() {
  var message = "C\xE1c b\u01B0\u1EDBc \u0111\u1EB7t h\xE0ng tr\xEAn website:\n\n1. T\xECm ki\u1EBFm s\u1EA3n ph\u1EA9m: S\u1EED d\u1EE5ng thanh t\xECm ki\u1EBFm ho\u1EB7c duy\u1EC7t qua danh m\u1EE5c\n2. Th\xEAm v\xE0o gi\u1ECF h\xE0ng: Nh\u1EA5p v\xE0o n\xFAt \"Th\xEAm v\xE0o gi\u1ECF\" sau khi ch\u1ECDn s\u1EA3n ph\u1EA9m\n3. Ki\u1EC3m tra gi\u1ECF h\xE0ng: Nh\u1EA5p v\xE0o bi\u1EC3u t\u01B0\u1EE3ng gi\u1ECF h\xE0ng \u0111\u1EC3 xem v\xE0 ch\u1EC9nh s\u1EEDa \u0111\u01A1n h\xE0ng\n4. Thanh to\xE1n: Nh\u1EA5p \"Thanh to\xE1n\" v\xE0 \u0111i\u1EC1n th\xF4ng tin giao h\xE0ng\n5. Ch\u1ECDn ph\u01B0\u01A1ng th\u1EE9c thanh to\xE1n: Ch\u1ECDn h\xECnh th\u1EE9c thanh to\xE1n ph\xF9 h\u1EE3p\n6. Ho\xE0n t\u1EA5t \u0111\u01A1n h\xE0ng: X\xE1c nh\u1EADn \u0111\u01A1n h\xE0ng v\xE0 nh\u1EADn m\xE3 \u0111\u01A1n h\xE0ng\n\nN\u1EBFu g\u1EB7p kh\xF3 kh\u0103n, vui l\xF2ng li\xEAn h\u1EC7 hotline: 0326 743391";
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_how_to_order'
  };
};

/**
 * Xử lý câu hỏi về các phương thức thanh toán
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handlePaymentMethods = function handlePaymentMethods() {
  var message = "C\xE1c h\xECnh th\u1EE9c thanh to\xE1n \u0111\u01B0\u1EE3c ch\u1EA5p nh\u1EADn:\n\n1. Thanh to\xE1n khi nh\u1EADn h\xE0ng (COD): Thanh to\xE1n tr\u1EF1c ti\u1EBFp cho nh\xE2n vi\xEAn giao h\xE0ng\n\n2. Chuy\u1EC3n kho\u1EA3n ng\xE2n h\xE0ng:\n   - Ng\xE2n h\xE0ng: MB Bank\n   - S\u1ED1 t\xE0i kho\u1EA3n: 0326743391\n   - Ch\u1EE7 t\xE0i kho\u1EA3n: NGUYEN TRONG KHIEM\n   - N\u1ED9i dung: [M\xE3 \u0111\u01A1n h\xE0ng]\n\n3. Th\u1EBB t\xEDn d\u1EE5ng/ghi n\u1EE3: MB BANK\n\n4. Thanh to\xE1n khi nh\u1EADn h\xE0ng\n\nCh\xFAng t\xF4i \u0111\u1EA3m b\u1EA3o th\xF4ng tin thanh to\xE1n c\u1EE7a b\u1EA1n \u0111\u01B0\u1EE3c b\u1EA3o m\u1EADt v\xE0 an to\xE0n.";
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_payment_methods'
  };
};

/**
 * Xử lý câu hỏi về địa chỉ cửa hàng
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handleStoreLocation = function handleStoreLocation() {
  var message = "\u0110\u1ECBa ch\u1EC9 c\u1EEDa h\xE0ng:\n\nC\u1EEDa h\xE0ng ch\xEDnh:\nTr\u01B0\u1EDDng \u0110\u1EA1i h\u1ECDc Nam C\u1EA7n Th\u01A1, Nguy\u1EC5n V\u0103n C\u1EEB n\u1ED1i d\xE0i, C\u1EA7n Th\u01A1 City\n\u0110i\u1EC7n tho\u1EA1i: 0326 743391\nGi\u1EDD m\u1EDF c\u1EEDa: 8:00 - 21:00 h\xE0ng ng\xE0y\n\nChi nh\xE1nh 1:\nTr\u01B0\u1EDDng \u0110\u1EA1i h\u1ECDc Nam C\u1EA7n Th\u01A1, Nguy\u1EC5n V\u0103n C\u1EEB n\u1ED1i d\xE0i, C\u1EA7n Th\u01A1 City\n\u0110i\u1EC7n tho\u1EA1i: 0326 743391\nGi\u1EDD m\u1EDF c\u1EEDa: 8:00 - 21:00 h\xE0ng ng\xE0y\n\nB\u1EA1n c\xF3 th\u1EC3 t\xECm \u0111\u01B0\u1EDDng \u0111\u1EBFn c\u1EEDa h\xE0ng b\u1EB1ng c\xE1ch t\xECm ki\u1EBFm \"DNCFOOD\" tr\xEAn Google Maps.";
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_store_location'
  };
};

/**
 * Xử lý câu hỏi về chất lượng sản phẩm
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handleProductQuality = function handleProductQuality() {
  var message = "Cam k\u1EBFt v\u1EC1 ch\u1EA5t l\u01B0\u1EE3ng s\u1EA3n ph\u1EA9m:\n\n- T\u1EA5t c\u1EA3 s\u1EA3n ph\u1EA9m \u0111\u1EC1u \u0111\u01B0\u1EE3c ki\u1EC3m so\xE1t ch\u1EA5t l\u01B0\u1EE3ng nghi\xEAm ng\u1EB7t\n- Ch\u1EC9 cung c\u1EA5p s\u1EA3n ph\u1EA9m t\u1EEB nh\xE0 cung c\u1EA5p uy t\xEDn, c\xF3 gi\u1EA5y ch\u1EE9ng nh\u1EADn an to\xE0n th\u1EF1c ph\u1EA9m\n- \u0110\u1ED1i v\u1EDBi th\u1EF1c ph\u1EA9m t\u01B0\u01A1i s\u1ED1ng, \u0111\u1EA3m b\u1EA3o \u0111\u1ED9 t\u01B0\u01A1i m\u1EDBi h\xE0ng ng\xE0y\n- T\u1EA5t c\u1EA3 s\u1EA3n ph\u1EA9m c\xF3 ngu\u1ED3n g\u1ED1c xu\u1EA5t x\u1EE9 r\xF5 r\xE0ng v\xE0 ghi \u0111\u1EA7y \u0111\u1EE7 tr\xEAn bao b\xEC\n- \xC1p d\u1EE5ng ch\xEDnh s\xE1ch \"Ho\xE0n ti\u1EC1n 100%\" n\u1EBFu s\u1EA3n ph\u1EA9m kh\xF4ng \u0111\u1EA1t ch\u1EA5t l\u01B0\u1EE3ng\n- \u0110\u1ED9i ng\u0169 ki\u1EC3m \u0111\u1ECBnh vi\xEAn \u0111\u1EA3m b\u1EA3o m\u1ED7i l\xF4 h\xE0ng \u0111\u1EC1u \u0111\u1EA1t ti\xEAu chu\u1EA9n";
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_product_quality'
  };
};

/**
 * Xử lý câu hỏi về thời gian giao hàng
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handleShippingTime = function handleShippingTime() {
  var message = "Th\u1EDDi gian giao h\xE0ng:\n\nN\u1ED9i th\xE0nh C\u1EA7n Th\u01A1:\n- Giao h\xE0ng nhanh: 2-4 gi\u1EDD (\u0111\u01A1n h\xE0ng \u0111\u1EB7t tr\u01B0\u1EDBc 16:00)\n- Giao h\xE0ng ti\xEAu chu\u1EA9n: 1-2 ng\xE0y l\xE0m vi\u1EC7c\n\nC\xE1c t\u1EC9nh th\xE0nh kh\xE1c:\n- Khu v\u1EF1c mi\u1EC1n Nam: 2-3 ng\xE0y l\xE0m vi\u1EC7c\n- Khu v\u1EF1c mi\u1EC1n Trung: 3-5 ng\xE0y l\xE0m vi\u1EC7c\n- Khu v\u1EF1c mi\u1EC1n B\u1EAFc: 3-5 ng\xE0y l\xE0m vi\u1EC7c\n- Khu v\u1EF1c mi\u1EC1n n\xFAi v\xE0 h\u1EA3i \u0111\u1EA3o: 5-7 ng\xE0y l\xE0m vi\u1EC7c\n\nL\u01B0u \xFD: Th\u1EDDi gian c\xF3 th\u1EC3 thay \u0111\u1ED5i do \u0111i\u1EC1u ki\u1EC7n th\u1EDDi ti\u1EBFt ho\u1EB7c s\u1EF1 ki\u1EC7n \u0111\u1EB7c bi\u1EC7t. \u0110\u01A1n h\xE0ng \u0111\u01B0\u1EE3c giao t\u1EEB 8:00-21:00 h\xE0ng ng\xE0y.";
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_shipping_time'
  };
};

/**
 * Xử lý câu hỏi về chính sách đổi trả
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handleReturnPolicy = function handleReturnPolicy() {
  var message = "Ch\xEDnh s\xE1ch \u0111\u1ED5i tr\u1EA3 s\u1EA3n ph\u1EA9m:\n\n\u0110i\u1EC1u ki\u1EC7n \u0111\u1ED5i tr\u1EA3:\n- S\u1EA3n ph\u1EA9m c\xF2n nguy\xEAn v\u1EB9n, ch\u01B0a m\u1EDF seal/bao b\xEC\n- S\u1EA3n ph\u1EA9m kh\xF4ng \u0111\xFAng m\xF4 t\u1EA3, kh\xF4ng \u0111\xFAng ch\u1EE7ng lo\u1EA1i\n- S\u1EA3n ph\u1EA9m b\u1ECB l\u1ED7i do v\u1EADn chuy\u1EC3n ho\u1EB7c nh\xE0 s\u1EA3n xu\u1EA5t\n- S\u1EA3n ph\u1EA9m c\xF2n trong th\u1EDDi h\u1EA1n s\u1EED d\u1EE5ng\n\nTh\u1EDDi h\u1EA1n \u0111\u1ED5i tr\u1EA3:\n- Th\u1EF1c ph\u1EA9m t\u01B0\u01A1i s\u1ED1ng: trong v\xF2ng 24 gi\u1EDD\n- S\u1EA3n ph\u1EA9m \u0111\xF3ng g\xF3i: trong v\xF2ng 3 ng\xE0y\n- S\u1EA3n ph\u1EA9m \u0111\u1ED3 kh\xF4, gia d\u1EE5ng: trong v\xF2ng 7 ng\xE0y\n\nLi\xEAn h\u1EC7 \u0111\u1ED5i tr\u1EA3: 0326 743391 ho\u1EB7c kit10012003@gmail.com";
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_return_policy'
  };
};

/**
 * Xử lý câu hỏi về khuyến mãi hiện có
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handlePromotions = function handlePromotions() {
  var message = "Ch\u01B0\u01A1ng tr\xECnh khuy\u1EBFn m\xE3i hi\u1EC7n t\u1EA1i:\n\n1. \u01AFu \u0111\xE3i m\xF9a l\u1EC5 h\u1ED9i (15/11-31/12):\n- Gi\u1EA3m 10% cho t\u1EA5t c\u1EA3 s\u1EA3n ph\u1EA9m \"\u0110\u1ED3 u\u1ED1ng\"\n- Mua 2 t\u1EB7ng 1 cho c\xE1c s\u1EA3n ph\u1EA9m b\xE1nh k\u1EB9o\n\n2. Ch\u01B0\u01A1ng tr\xECnh t\xEDch \u0111i\u1EC3m:\n- T\xEDch 1 \u0111i\u1EC3m cho m\u1ED7i 10,000\u0111 chi ti\xEAu\n- \u0110\u1ED5i 100 \u0111i\u1EC3m = Voucher 50,000\u0111\n\n3. \u01AFu \u0111\xE3i giao h\xE0ng:\n- Mi\u1EC5n ph\xED giao h\xE0ng cho \u0111\u01A1n t\u1EEB 200,000\u0111\n- Gi\u1EA3m 50% ph\xED giao h\xE0ng cho \u0111\u01A1n t\u1EEB 100,000\u0111 \u0111\u1EBFn 199,999\u0111\n\n4. M\xE3 gi\u1EA3m gi\xE1:\n- WELCOME: Gi\u1EA3m 30,000\u0111 cho \u0111\u01A1n h\xE0ng \u0111\u1EA7u ti\xEAn\n- FREESHIP: Mi\u1EC5n ph\xED giao h\xE0ng (\u0111\u1EBFn 31/12)";
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_promotions'
  };
};

/**
 * Xử lý câu hỏi về sản phẩm mới/bán chạy
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handleTrendingProducts = function handleTrendingProducts() {
  var message = "S\u1EA3n ph\u1EA9m m\u1EDBi v\xE0 b\xE1n ch\u1EA1y:\n\nS\u1EA3n ph\u1EA9m m\u1EDBi:\n1. N\u01B0\u1EDBc \xE9p tr\xE1i c\xE2y h\u1EEFu c\u01A1 nguy\xEAn ch\u1EA5t (nhi\u1EC1u h\u01B0\u01A1ng v\u1ECB)\n2. Tr\xE0 th\u1EA3o m\u1ED9c detox nh\u1EADp kh\u1EA9u t\u1EEB H\xE0n Qu\u1ED1c\n3. B\xE1nh \u0103n ki\xEAng kh\xF4ng \u0111\u01B0\u1EDDng, \xEDt carb\n4. C\xE1c lo\u1EA1i h\u1EA1t dinh d\u01B0\u1EE1ng mix s\u1EB5n\n\nS\u1EA3n ph\u1EA9m b\xE1n ch\u1EA1y nh\u1EA5t:\n1. N\u01B0\u1EDBc t\u01B0\u01A1ng h\u1EEFu c\u01A1 th\u01B0\u1EE3ng h\u1EA1ng\n2. B\xE1nh g\u1EA1o H\xE0n Qu\u1ED1c v\u1ECB t\u1EA3o bi\u1EC3n\n3. S\u1EEFa chua Hy L\u1EA1p cao \u0111\u1EA1m\n4. Ng\u0169 c\u1ED1c dinh d\u01B0\u1EE1ng \u0103n s\xE1ng\n5. N\u01B0\u1EDBc gi\u1EB7t sinh h\u1ECDc th\xE2n thi\u1EC7n m\xF4i tr\u01B0\u1EDDng";
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_trending_products'
  };
};

/**
 * Xử lý câu hỏi về phí vận chuyển
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handleShippingFee = function handleShippingFee() {
  var message = "Ph\xED v\u1EADn chuy\u1EC3n:\n\nKhu v\u1EF1c n\u1ED9i th\xE0nh HCM, H\xE0 N\u1ED9i:\n- \u0110\u01A1n d\u01B0\u1EDBi 100,000\u0111: 15,000\u0111\n- \u0110\u01A1n t\u1EEB 100,000\u0111 \u0111\u1EBFn 199,999\u0111: 10,000\u0111\n- \u0110\u01A1n t\u1EEB 200,000\u0111 tr\u1EDF l\xEAn: Mi\u1EC5n ph\xED\n\nKhu v\u1EF1c ngo\u1EA1i th\xE0nh v\xE0 t\u1EC9nh th\xE0nh kh\xE1c:\n- \u0110\u01A1n d\u01B0\u1EDBi 200,000\u0111: 30,000\u0111\n- \u0110\u01A1n t\u1EEB 200,000\u0111 \u0111\u1EBFn 499,999\u0111: 20,000\u0111\n- \u0110\u01A1n t\u1EEB 500,000\u0111 tr\u1EDF l\xEAn: Mi\u1EC5n ph\xED\n\nKhu v\u1EF1c mi\u1EC1n n\xFAi v\xE0 h\u1EA3i \u0111\u1EA3o:\n- Ph\xED v\u1EADn chuy\u1EC3n t\xEDnh d\u1EF1a tr\xEAn kho\u1EA3ng c\xE1ch v\xE0 tr\u1ECDng l\u01B0\u1EE3ng \u0111\u01A1n h\xE0ng\n\nPh\xED v\u1EADn chuy\u1EC3n s\u1EBD hi\u1EC3n th\u1ECB ch\xEDnh x\xE1c khi b\u1EA1n nh\u1EADp \u0111\u1ECBa ch\u1EC9 giao h\xE0ng.";
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_shipping_fee'
  };
};

/**
 * Xử lý câu hỏi về hỗ trợ khách hàng
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handleCustomerSupport = function handleCustomerSupport() {
  var message = "Th\xF4ng tin h\u1ED7 tr\u1EE3 kh\xE1ch h\xE0ng:\n\nHotline: 0326 743391 (8:00-21:00 h\xE0ng ng\xE0y)\nEmail h\u1ED7 tr\u1EE3: kit10012003@gmail.com\nFanpage: facebook.com/tzkit27\nZalo: 0326743391\nChat tr\u1EF1c tuy\u1EBFn: G\xF3c ph\u1EA3i m\xE0n h\xECnh website\n\u0110\u1ECBa ch\u1EC9: Tr\u01B0\u1EDDng \u0110H Nam C\u1EA7n Th\u01A1, Nguy\u1EC5n V\u0103n C\u1EEB n\u1ED1i d\xE0i, C\u1EA7n Th\u01A1\n\n\u0110\u1ED9i ng\u0169 nh\xE2n vi\xEAn t\u01B0 v\u1EA5n lu\xF4n s\u1EB5n s\xE0ng h\u1ED7 tr\u1EE3 b\u1EA1n m\u1ECDi th\u1EAFc m\u1EAFc v\u1EC1 s\u1EA3n ph\u1EA9m v\xE0 \u0111\u01A1n h\xE0ng.";
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_customer_support'
  };
};

/**
 * Xử lý câu hỏi về chương trình thành viên
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handleMembership = function handleMembership() {
  var message = "Ch\u01B0\u01A1ng tr\xECnh th\xE0nh vi\xEAn:\n\nC\u1EA5p \u0111\u1ED9 th\xE0nh vi\xEAn:\n1. Th\xE0nh vi\xEAn B\u1EA1c: Chi ti\xEAu 1,000,000\u0111 trong 3 th\xE1ng\n   - Gi\u1EA3m 3% t\u1EA5t c\u1EA3 \u0111\u01A1n h\xE0ng\n   - T\xEDch \u0111i\u1EC3m x1.2\n   - \u01AFu ti\xEAn giao h\xE0ng\n\n2. Th\xE0nh vi\xEAn V\xE0ng: Chi ti\xEAu 3,000,000\u0111 trong 3 th\xE1ng\n   - Gi\u1EA3m 5% t\u1EA5t c\u1EA3 \u0111\u01A1n h\xE0ng\n   - T\xEDch \u0111i\u1EC3m x1.5\n   - Mi\u1EC5n ph\xED giao h\xE0ng kh\xF4ng gi\u1EDBi h\u1EA1n\n   - Qu\xE0 sinh nh\u1EADt\n\n3. Th\xE0nh vi\xEAn Kim C\u01B0\u01A1ng: Chi ti\xEAu 7,000,000\u0111 trong 3 th\xE1ng\n   - Gi\u1EA3m 7% t\u1EA5t c\u1EA3 \u0111\u01A1n h\xE0ng\n   - T\xEDch \u0111i\u1EC3m x2\n   - Mi\u1EC5n ph\xED giao h\xE0ng kh\xF4ng gi\u1EDBi h\u1EA1n\n   - Qu\xE0 sinh nh\u1EADt cao c\u1EA5p\n   - T\u01B0 v\u1EA5n vi\xEAn ri\xEAng\n\n\u0110\u0103ng k\xFD th\xE0nh vi\xEAn mi\u1EC5n ph\xED t\u1EA1i qu\u1EA7y ho\u1EB7c website.";
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_membership'
  };
};

/**
 * Xử lý câu hỏi về sản phẩm hữu cơ
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handleOrganicProducts = function handleOrganicProducts() {
  var message = "S\u1EA3n ph\u1EA9m h\u1EEFu c\u01A1:\n\nCh\xFAng t\xF4i cung c\u1EA5p \u0111a d\u1EA1ng s\u1EA3n ph\u1EA9m h\u1EEFu c\u01A1 \u0111\u01B0\u1EE3c ch\u1EE9ng nh\u1EADn bao g\u1ED3m:\n\n1. Rau c\u1EE7 qu\u1EA3 h\u1EEFu c\u01A1:\n   - Rau xanh c\xE1c lo\u1EA1i (c\u1EA3i, x\xE0 l\xE1ch, rau mu\u1ED1ng...)\n   - C\u1EE7 qu\u1EA3 (c\xE0 r\u1ED1t, khoai t\xE2y, c\xE0 chua...)\n   - Tr\xE1i c\xE2y (cam, t\xE1o, l\xEA, chu\u1ED1i...)\n\n2. G\u1EA1o v\xE0 ng\u0169 c\u1ED1c h\u1EEFu c\u01A1:\n   - G\u1EA1o l\u1EE9t, g\u1EA1o tr\u1EAFng h\u1EEFu c\u01A1\n   - Ng\u0169 c\u1ED1c nguy\xEAn h\u1EA1t\n   - Y\u1EBFn m\u1EA1ch, h\u1EA1t chia\n\n3. Th\u1EF1c ph\u1EA9m kh\xF4 h\u1EEFu c\u01A1:\n   - \u0110\u1EADu v\xE0 c\xE1c lo\u1EA1i h\u1EA1t\n   - B\u1ED9t m\xEC, b\u1ED9t g\u1EA1o\n   - Tr\xE0 v\xE0 c\xE0 ph\xEA h\u1EEFu c\u01A1\n\nTi\xEAu chu\u1EA9n h\u1EEFu c\u01A1:\n- Canh t\xE1c kh\xF4ng s\u1EED d\u1EE5ng h\xF3a ch\u1EA5t, thu\u1ED1c tr\u1EEB s\xE2u\n- Kh\xF4ng bi\u1EBFn \u0111\u1ED5i gen (Non-GMO)\n- \u0110\u01B0\u1EE3c ch\u1EE9ng nh\u1EADn b\u1EDFi c\xE1c t\u1ED5 ch\u1EE9c uy t\xEDn\n- \u0110\u1EA3m b\u1EA3o quy tr\xECnh t\u1EEB n\xF4ng tr\u1EA1i \u0111\u1EBFn b\xE0n \u0103n";
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_organic_products'
  };
};

/**
 * Xử lý câu hỏi về các lựa chọn cho chế độ ăn đặc biệt
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handleDietaryOptions = function handleDietaryOptions() {
  var message = "C\xE1c l\u1EF1a ch\u1ECDn cho ch\u1EBF \u0111\u1ED9 \u0103n \u0111\u1EB7c bi\u1EC7t:\n\n1. S\u1EA3n ph\u1EA9m cho ng\u01B0\u1EDDi \u0103n chay/thu\u1EA7n chay:\n   - Th\u1EF1c ph\u1EA9m chay \u0111\xF4ng l\u1EA1nh\n   - S\u1EEFa th\u1EF1c v\u1EADt (\u0111\u1EADu n\xE0nh, h\u1EA1nh nh\xE2n, y\u1EBFn m\u1EA1ch)\n   - \u0110\u1EADu h\u0169 v\xE0 tempeh\n   - Th\u1ECBt th\u1EF1c v\u1EADt\n\n2. S\u1EA3n ph\u1EA9m kh\xF4ng gluten:\n   - B\xE1nh m\xEC kh\xF4ng gluten\n   - M\xEC v\xE0 pasta t\u1EEB g\u1EA1o, ng\xF4\n   - B\u1ED9t l\xE0m b\xE1nh kh\xF4ng gluten\n   - Ng\u0169 c\u1ED1c kh\xF4ng gluten\n\n3. S\u1EA3n ph\u1EA9m \xEDt \u0111\u01B0\u1EDDng/kh\xF4ng \u0111\u01B0\u1EDDng:\n   - S\u1EEFa chua kh\xF4ng \u0111\u01B0\u1EDDng\n   - \u0110\u1ED3 u\u1ED1ng kh\xF4ng \u0111\u01B0\u1EDDng\n   - B\xE1nh k\u1EB9o v\u1EDBi ch\u1EA5t l\xE0m ng\u1ECDt t\u1EF1 nhi\xEAn\n\n4. S\u1EA3n ph\u1EA9m low-carb/keto:\n   - Th\u1EF1c ph\u1EA9m gi\xE0u ch\u1EA5t b\xE9o l\xE0nh m\u1EA1nh\n   - B\u1ED9t l\xE0m b\xE1nh keto\n   - \u0110\u1ED3 \u0103n nh\u1EB9 low-carb\n   - Th\u1EF1c ph\u1EA9m b\u1ED5 sung\n\nC\xE1c s\u1EA3n ph\u1EA9m \u0111\u1EC1u \u0111\u01B0\u1EE3c g\u1EAFn nh\xE3n r\xF5 r\xE0ng v\xE0 b\u1EA1n c\xF3 th\u1EC3 l\u1ECDc t\xECm theo lo\u1EA1i ch\u1EBF \u0111\u1ED9 \u0103n tr\xEAn website.";
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_dietary_options'
  };
};

/**
 * Xử lý câu hỏi về dịch vụ quà tặng
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handleGiftServices = function handleGiftServices() {
  var message = "D\u1ECBch v\u1EE5 qu\xE0 t\u1EB7ng:\n\n1. Gi\u1ECF qu\xE0 t\u1EB7ng:\n   - Gi\u1ECF qu\xE0 s\u1EE9c kh\u1ECFe (t\u1EEB 300,000\u0111 \u0111\u1EBFn 2,000,000\u0111)\n   - Gi\u1ECF qu\xE0 tr\xE1i c\xE2y cao c\u1EA5p (t\u1EEB 400,000\u0111 \u0111\u1EBFn 1,500,000\u0111)\n   - Gi\u1ECF qu\xE0 \u0111\u1EB7c s\u1EA3n v\xF9ng mi\u1EC1n (t\u1EEB 500,000\u0111 \u0111\u1EBFn 2,500,000\u0111)\n   - Gi\u1ECF qu\xE0 doanh nghi\u1EC7p (t\xF9y ch\u1EC9nh theo ng\xE2n s\xE1ch)\n\n2. Th\u1EBB qu\xE0 t\u1EB7ng:\n   - Th\u1EBB qu\xE0 t\u1EB7ng \u0111i\u1EC7n t\u1EED (g\u1EEDi qua email)\n   - Th\u1EBB qu\xE0 t\u1EB7ng v\u1EADt l\xFD (thi\u1EBFt k\u1EBF \u0111\u1EB9p m\u1EAFt)\n   - Gi\xE1 tr\u1ECB t\u1EEB 100,000\u0111 \u0111\u1EBFn 5,000,000\u0111\n   - Th\u1EDDi h\u1EA1n s\u1EED d\u1EE5ng 1 n\u0103m\n\n3. D\u1ECBch v\u1EE5 g\xF3i qu\xE0:\n   - G\xF3i qu\xE0 c\u01A1 b\u1EA3n: 20,000\u0111\n   - G\xF3i qu\xE0 cao c\u1EA5p: 50,000\u0111 (h\u1ED9p sang tr\u1ECDng, thi\u1EC7p)\n   - G\xF3i qu\xE0 \u0111\u1EB7c bi\u1EC7t: 100,000\u0111 (h\u1ED9p g\u1ED7, thi\u1EC7p th\u1EE7 c\xF4ng)\n\n4. \u0110i\u1EC1u ch\u1EC9nh theo y\xEAu c\u1EA7u:\n   - T\xF9y ch\u1EC9nh n\u1ED9i dung gi\u1ECF qu\xE0\n   - Thi\u1EC7p ch\xFAc m\u1EEBng c\xE1 nh\xE2n h\xF3a\n   - Giao h\xE0ng \u0111\xFAng ng\xE0y \u0111\u1EB7c bi\u1EC7t\n\n\u0110\u1EB7t h\xE0ng tr\u01B0\u1EDBc 2 ng\xE0y \u0111\u1EC3 \u0111\u1EA3m b\u1EA3o chu\u1EA9n b\u1ECB \u0111\u1EA7y \u0111\u1EE7.";
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_gift_services'
  };
};

/**
 * Xử lý câu hỏi về đơn hàng số lượng lớn
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handleBulkOrders = function handleBulkOrders() {
  var message = "\u0110\u01A1n h\xE0ng s\u1ED1 l\u01B0\u1EE3ng l\u1EDBn:\n\n1. \u0110\u1ED1i t\u01B0\u1EE3ng \xE1p d\u1EE5ng:\n   - Nh\xE0 h\xE0ng, qu\xE1n \u0103n, qu\xE1n caf\xE9\n   - C\xF4ng ty, v\u0103n ph\xF2ng, c\u01A1 quan\n   - Tr\u01B0\u1EDDng h\u1ECDc, b\u1EC7nh vi\u1EC7n\n   - S\u1EF1 ki\u1EC7n, h\u1ED9i ngh\u1ECB\n\n2. \u01AFu \u0111\xE3i \u0111\u1EB7c bi\u1EC7t:\n   - Gi\u1EA3m 5% cho \u0111\u01A1n h\xE0ng t\u1EEB 2,000,000\u0111\n   - Gi\u1EA3m 7% cho \u0111\u01A1n h\xE0ng t\u1EEB 5,000,000\u0111\n   - Gi\u1EA3m 10% cho \u0111\u01A1n h\xE0ng t\u1EEB 10,000,000\u0111\n   - Mi\u1EC5n ph\xED v\u1EADn chuy\u1EC3n cho m\u1ECDi \u0111\u01A1n h\xE0ng s\u1ED1 l\u01B0\u1EE3ng l\u1EDBn\n\n3. D\u1ECBch v\u1EE5 \u0111i k\xE8m:\n   - T\u01B0 v\u1EA5n l\u1EF1a ch\u1ECDn s\u1EA3n ph\u1EA9m ph\xF9 h\u1EE3p\n   - B\xE1o gi\xE1 nhanh trong v\xF2ng 2 gi\u1EDD\n   - H\u1ED7 tr\u1EE3 xu\u1EA5t h\xF3a \u0111\u01A1n VAT\n   - Giao h\xE0ng \u0111\xFAng h\u1EB9n, ki\u1EC3m tra ch\u1EA5t l\u01B0\u1EE3ng\n\n4. Quy tr\xECnh \u0111\u1EB7t h\xE0ng:\n   - Li\xEAn h\u1EC7 0326 743391 ho\u1EB7c email kit10012003@gmail.com\n   - Cung c\u1EA5p danh s\xE1ch s\u1EA3n ph\u1EA9m v\xE0 s\u1ED1 l\u01B0\u1EE3ng\n   - Nh\u1EADn b\xE1o gi\xE1 v\xE0 x\xE1c nh\u1EADn \u0111\u01A1n h\xE0ng\n   - Th\u1ED1ng nh\u1EA5t th\u1EDDi gian giao h\xE0ng\n\nVui l\xF2ng \u0111\u1EB7t tr\u01B0\u1EDBc \xEDt nh\u1EA5t 3-5 ng\xE0y v\u1EDBi \u0111\u01A1n h\xE0ng l\u1EDBn.";
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_bulk_orders'
  };
};

/**
 * Xử lý câu hỏi về việc chatbot có thể giúp gì
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handleChatbotHelp = function handleChatbotHelp() {
  var message = "T\xF4i c\xF3 th\u1EC3 gi\xFAp b\u1EA1n t\xECm s\u1EA3n ph\u1EA9m, ki\u1EC3m tra \u0111\u01A1n h\xE0ng, gi\u1EA3i \u0111\xE1p ch\xEDnh s\xE1ch giao h\xE0ng \u2013 thanh to\xE1n \u2013 \u0111\u1ED5i tr\u1EA3.";
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_chatbot_help'
  };
};

/**
 * Xử lý câu hỏi khi không tìm thấy sản phẩm
 * @returns {object} - Phản hồi cho câu hỏi
 */
var handleProductNotFound = function handleProductNotFound() {
  var message = "B\u1EA1n h\xE3y th\u1EED nh\u1EADp t\xEAn s\u1EA3n ph\u1EA9m kh\xE1c ho\u1EB7c m\xF4 t\u1EA3 chi ti\u1EBFt h\u01A1n. N\u1EBFu v\u1EABn kh\xF4ng c\xF3, b\u1EA1n c\xF3 th\u1EC3 g\u1EEDi y\xEAu c\u1EA7u \u0111\u1EB7t h\xE0ng ri\xEAng.";
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_product_not_found'
  };
};