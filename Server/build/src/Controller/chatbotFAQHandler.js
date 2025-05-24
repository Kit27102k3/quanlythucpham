"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.handleFAQQuestion = exports.detectIntentFromKeywords = void 0; /**
 * Hệ thống xử lý câu hỏi thường gặp (FAQ)
 * File này chứa các hàm để trả lời các câu hỏi chung về cửa hàng, chính sách, và dịch vụ
 */

// Định nghĩa từ khóa cho mỗi intent để tăng độ chính xác khi nhận diện câu hỏi
const intentKeywords = {
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
const intentPriority = {
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
const detectIntentFromKeywords = (query) => {
  if (!query) return null;

  // Chuyển câu hỏi thành chữ thường để so sánh dễ dàng hơn
  const normalizedQuery = query.toLowerCase();
  console.log(`Normalized Query: "${normalizedQuery}"`);

  // Kiểm tra khớp chính xác với câu hỏi
  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    for (const keyword of keywords) {
      // Nếu câu hỏi khớp chính xác với từ khóa
      if (normalizedQuery === keyword.toLowerCase() ||
      normalizedQuery.replace(/[?.,!]/g, '') === keyword.toLowerCase()) {
        console.log(`Exact match found for intent: ${intent}, keyword: "${keyword}"`);
        return intent;
      }
    }
  }

  // Điểm số cho mỗi intent
  const scores = {};
  let bestMatch = null;
  let highestScore = 0;

  // Kiểm tra khớp một phần với từ khóa
  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    const priority = intentPriority[intent] || 1;
    scores[intent] = 0;

    for (const keyword of keywords) {
      // Kiểm tra từ khóa dài trong câu hỏi
      if (keyword.length > 10 && normalizedQuery.includes(keyword.toLowerCase())) {
        scores[intent] += keyword.length * 2 * priority;
        console.log(`Long keyword match: "${keyword}" for intent ${intent}, score +${keyword.length * 2 * priority}`);
      }
      // Từ khóa ngắn chỉ tính nếu là từ riêng biệt trong câu
      else if (normalizedQuery.includes(keyword.toLowerCase())) {
        scores[intent] += keyword.length * priority;
        console.log(`Keyword match: "${keyword}" for intent ${intent}, score +${keyword.length * priority}`);
      }
    }

    // Cập nhật intent có điểm cao nhất
    if (scores[intent] > highestScore) {
      highestScore = scores[intent];
      bestMatch = intent;
    }
  }

  console.log(`Best matching intent: ${bestMatch}, score: ${highestScore}`);
  // Trả về intent phù hợp nhất nếu điểm đủ cao
  return highestScore > 0 ? bestMatch : null;
};

/**
 * Xử lý câu hỏi từ người dùng dựa trên loại intent đã phát hiện
 * @param {string} intent - Intent được phát hiện từ câu hỏi
 * @param {string} query - Câu hỏi gốc của người dùng
 * @returns {object} - Phản hồi cho câu hỏi
 */exports.detectIntentFromKeywords = detectIntentFromKeywords;
const handleFAQQuestion = (intent, query = "") => {
  console.log(`Xử lý câu hỏi FAQ với intent: ${intent}`);

  // Nếu không có intent được cung cấp, thử phát hiện từ câu hỏi
  if (!intent && query) {
    intent = detectIntentFromKeywords(query);
    console.log(`Phát hiện intent từ câu hỏi: ${intent}`);
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
 */exports.handleFAQQuestion = handleFAQQuestion;
const handleHowToBuy = () => {
  const message = `Hướng dẫn mua hàng:

Cách 1: Mua hàng trực tuyến
1. Tìm kiếm sản phẩm trên trang web
2. Nhấp vào sản phẩm để xem chi tiết
3. Chọn "Thêm vào giỏ hàng" hoặc "Mua ngay"
4. Tiến hành đặt hàng và thanh toán

Cách 2: Mua hàng trực tiếp tại cửa hàng
- Địa chỉ: Trường Đại học Nam Cần Thơ, Nguyễn Văn Cừ nối dài, Cần Thơ
- Thời gian mở cửa: 8:00 - 21:00 mỗi ngày

Cách 3: Đặt hàng qua điện thoại
- Hotline: 0326 743391
- Nhân viên sẽ hỗ trợ đặt hàng và giao hàng tận nơi`;

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
const handleHowToOrder = () => {
  const message = `Các bước đặt hàng trên website:

1. Tìm kiếm sản phẩm: Sử dụng thanh tìm kiếm hoặc duyệt qua danh mục
2. Thêm vào giỏ hàng: Nhấp vào nút "Thêm vào giỏ" sau khi chọn sản phẩm
3. Kiểm tra giỏ hàng: Nhấp vào biểu tượng giỏ hàng để xem và chỉnh sửa đơn hàng
4. Thanh toán: Nhấp "Thanh toán" và điền thông tin giao hàng
5. Chọn phương thức thanh toán: Chọn hình thức thanh toán phù hợp
6. Hoàn tất đơn hàng: Xác nhận đơn hàng và nhận mã đơn hàng

Nếu gặp khó khăn, vui lòng liên hệ hotline: 0326 743391`;

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
const handlePaymentMethods = () => {
  const message = `Các hình thức thanh toán được chấp nhận:

1. Thanh toán khi nhận hàng (COD): Thanh toán trực tiếp cho nhân viên giao hàng

2. Chuyển khoản ngân hàng:
   - Ngân hàng: MB Bank
   - Số tài khoản: 0326743391
   - Chủ tài khoản: NGUYEN TRONG KHIEM
   - Nội dung: [Mã đơn hàng]

3. Thẻ tín dụng/ghi nợ: MB BANK

4. Thanh toán khi nhận hàng

Chúng tôi đảm bảo thông tin thanh toán của bạn được bảo mật và an toàn.`;

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
const handleStoreLocation = () => {
  const message = `Địa chỉ cửa hàng:

Cửa hàng chính:
Trường Đại học Nam Cần Thơ, Nguyễn Văn Cừ nối dài, Cần Thơ City
Điện thoại: 0326 743391
Giờ mở cửa: 8:00 - 21:00 hàng ngày

Chi nhánh 1:
Trường Đại học Nam Cần Thơ, Nguyễn Văn Cừ nối dài, Cần Thơ City
Điện thoại: 0326 743391
Giờ mở cửa: 8:00 - 21:00 hàng ngày

Bạn có thể tìm đường đến cửa hàng bằng cách tìm kiếm "DNCFOOD" trên Google Maps.`;

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
const handleProductQuality = () => {
  const message = `Cam kết về chất lượng sản phẩm:

- Tất cả sản phẩm đều được kiểm soát chất lượng nghiêm ngặt
- Chỉ cung cấp sản phẩm từ nhà cung cấp uy tín, có giấy chứng nhận an toàn thực phẩm
- Đối với thực phẩm tươi sống, đảm bảo độ tươi mới hàng ngày
- Tất cả sản phẩm có nguồn gốc xuất xứ rõ ràng và ghi đầy đủ trên bao bì
- Áp dụng chính sách "Hoàn tiền 100%" nếu sản phẩm không đạt chất lượng
- Đội ngũ kiểm định viên đảm bảo mỗi lô hàng đều đạt tiêu chuẩn`;

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
const handleShippingTime = () => {
  const message = `Thời gian giao hàng:

Nội thành Cần Thơ:
- Giao hàng nhanh: 2-4 giờ (đơn hàng đặt trước 16:00)
- Giao hàng tiêu chuẩn: 1-2 ngày làm việc

Các tỉnh thành khác:
- Khu vực miền Nam: 2-3 ngày làm việc
- Khu vực miền Trung: 3-5 ngày làm việc
- Khu vực miền Bắc: 3-5 ngày làm việc
- Khu vực miền núi và hải đảo: 5-7 ngày làm việc

Lưu ý: Thời gian có thể thay đổi do điều kiện thời tiết hoặc sự kiện đặc biệt. Đơn hàng được giao từ 8:00-21:00 hàng ngày.`;

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
const handleReturnPolicy = () => {
  const message = `Chính sách đổi trả sản phẩm:

Điều kiện đổi trả:
- Sản phẩm còn nguyên vẹn, chưa mở seal/bao bì
- Sản phẩm không đúng mô tả, không đúng chủng loại
- Sản phẩm bị lỗi do vận chuyển hoặc nhà sản xuất
- Sản phẩm còn trong thời hạn sử dụng

Thời hạn đổi trả:
- Thực phẩm tươi sống: trong vòng 24 giờ
- Sản phẩm đóng gói: trong vòng 3 ngày
- Sản phẩm đồ khô, gia dụng: trong vòng 7 ngày

Liên hệ đổi trả: 0326 743391 hoặc kit10012003@gmail.com`;

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
const handlePromotions = () => {
  const message = `Chương trình khuyến mãi hiện tại:

1. Ưu đãi mùa lễ hội (15/11-31/12):
- Giảm 10% cho tất cả sản phẩm "Đồ uống"
- Mua 2 tặng 1 cho các sản phẩm bánh kẹo

2. Chương trình tích điểm:
- Tích 1 điểm cho mỗi 10,000đ chi tiêu
- Đổi 100 điểm = Voucher 50,000đ

3. Ưu đãi giao hàng:
- Miễn phí giao hàng cho đơn từ 200,000đ
- Giảm 50% phí giao hàng cho đơn từ 100,000đ đến 199,999đ

4. Mã giảm giá:
- WELCOME: Giảm 30,000đ cho đơn hàng đầu tiên
- FREESHIP: Miễn phí giao hàng (đến 31/12)`;

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
const handleTrendingProducts = () => {
  const message = `Sản phẩm mới và bán chạy:

Sản phẩm mới:
1. Nước ép trái cây hữu cơ nguyên chất (nhiều hương vị)
2. Trà thảo mộc detox nhập khẩu từ Hàn Quốc
3. Bánh ăn kiêng không đường, ít carb
4. Các loại hạt dinh dưỡng mix sẵn

Sản phẩm bán chạy nhất:
1. Nước tương hữu cơ thượng hạng
2. Bánh gạo Hàn Quốc vị tảo biển
3. Sữa chua Hy Lạp cao đạm
4. Ngũ cốc dinh dưỡng ăn sáng
5. Nước giặt sinh học thân thiện môi trường`;

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
const handleShippingFee = () => {
  const message = `Phí vận chuyển:

Khu vực nội thành HCM, Hà Nội:
- Đơn dưới 100,000đ: 15,000đ
- Đơn từ 100,000đ đến 199,999đ: 10,000đ
- Đơn từ 200,000đ trở lên: Miễn phí

Khu vực ngoại thành và tỉnh thành khác:
- Đơn dưới 200,000đ: 30,000đ
- Đơn từ 200,000đ đến 499,999đ: 20,000đ
- Đơn từ 500,000đ trở lên: Miễn phí

Khu vực miền núi và hải đảo:
- Phí vận chuyển tính dựa trên khoảng cách và trọng lượng đơn hàng

Phí vận chuyển sẽ hiển thị chính xác khi bạn nhập địa chỉ giao hàng.`;

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
const handleCustomerSupport = () => {
  const message = `Thông tin hỗ trợ khách hàng:

Hotline: 0326 743391 (8:00-21:00 hàng ngày)
Email hỗ trợ: kit10012003@gmail.com
Fanpage: facebook.com/tzkit27
Zalo: 0326743391
Chat trực tuyến: Góc phải màn hình website
Địa chỉ: Trường ĐH Nam Cần Thơ, Nguyễn Văn Cừ nối dài, Cần Thơ

Đội ngũ nhân viên tư vấn luôn sẵn sàng hỗ trợ bạn mọi thắc mắc về sản phẩm và đơn hàng.`;

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
const handleMembership = () => {
  const message = `Chương trình thành viên:

Cấp độ thành viên:
1. Thành viên Bạc: Chi tiêu 1,000,000đ trong 3 tháng
   - Giảm 3% tất cả đơn hàng
   - Tích điểm x1.2
   - Ưu tiên giao hàng

2. Thành viên Vàng: Chi tiêu 3,000,000đ trong 3 tháng
   - Giảm 5% tất cả đơn hàng
   - Tích điểm x1.5
   - Miễn phí giao hàng không giới hạn
   - Quà sinh nhật

3. Thành viên Kim Cương: Chi tiêu 7,000,000đ trong 3 tháng
   - Giảm 7% tất cả đơn hàng
   - Tích điểm x2
   - Miễn phí giao hàng không giới hạn
   - Quà sinh nhật cao cấp
   - Tư vấn viên riêng

Đăng ký thành viên miễn phí tại quầy hoặc website.`;

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
const handleOrganicProducts = () => {
  const message = `Sản phẩm hữu cơ:

Chúng tôi cung cấp đa dạng sản phẩm hữu cơ được chứng nhận bao gồm:

1. Rau củ quả hữu cơ:
   - Rau xanh các loại (cải, xà lách, rau muống...)
   - Củ quả (cà rốt, khoai tây, cà chua...)
   - Trái cây (cam, táo, lê, chuối...)

2. Gạo và ngũ cốc hữu cơ:
   - Gạo lứt, gạo trắng hữu cơ
   - Ngũ cốc nguyên hạt
   - Yến mạch, hạt chia

3. Thực phẩm khô hữu cơ:
   - Đậu và các loại hạt
   - Bột mì, bột gạo
   - Trà và cà phê hữu cơ

Tiêu chuẩn hữu cơ:
- Canh tác không sử dụng hóa chất, thuốc trừ sâu
- Không biến đổi gen (Non-GMO)
- Được chứng nhận bởi các tổ chức uy tín
- Đảm bảo quy trình từ nông trại đến bàn ăn`;

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
const handleDietaryOptions = () => {
  const message = `Các lựa chọn cho chế độ ăn đặc biệt:

1. Sản phẩm cho người ăn chay/thuần chay:
   - Thực phẩm chay đông lạnh
   - Sữa thực vật (đậu nành, hạnh nhân, yến mạch)
   - Đậu hũ và tempeh
   - Thịt thực vật

2. Sản phẩm không gluten:
   - Bánh mì không gluten
   - Mì và pasta từ gạo, ngô
   - Bột làm bánh không gluten
   - Ngũ cốc không gluten

3. Sản phẩm ít đường/không đường:
   - Sữa chua không đường
   - Đồ uống không đường
   - Bánh kẹo với chất làm ngọt tự nhiên

4. Sản phẩm low-carb/keto:
   - Thực phẩm giàu chất béo lành mạnh
   - Bột làm bánh keto
   - Đồ ăn nhẹ low-carb
   - Thực phẩm bổ sung

Các sản phẩm đều được gắn nhãn rõ ràng và bạn có thể lọc tìm theo loại chế độ ăn trên website.`;

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
const handleGiftServices = () => {
  const message = `Dịch vụ quà tặng:

1. Giỏ quà tặng:
   - Giỏ quà sức khỏe (từ 300,000đ đến 2,000,000đ)
   - Giỏ quà trái cây cao cấp (từ 400,000đ đến 1,500,000đ)
   - Giỏ quà đặc sản vùng miền (từ 500,000đ đến 2,500,000đ)
   - Giỏ quà doanh nghiệp (tùy chỉnh theo ngân sách)

2. Thẻ quà tặng:
   - Thẻ quà tặng điện tử (gửi qua email)
   - Thẻ quà tặng vật lý (thiết kế đẹp mắt)
   - Giá trị từ 100,000đ đến 5,000,000đ
   - Thời hạn sử dụng 1 năm

3. Dịch vụ gói quà:
   - Gói quà cơ bản: 20,000đ
   - Gói quà cao cấp: 50,000đ (hộp sang trọng, thiệp)
   - Gói quà đặc biệt: 100,000đ (hộp gỗ, thiệp thủ công)

4. Điều chỉnh theo yêu cầu:
   - Tùy chỉnh nội dung giỏ quà
   - Thiệp chúc mừng cá nhân hóa
   - Giao hàng đúng ngày đặc biệt

Đặt hàng trước 2 ngày để đảm bảo chuẩn bị đầy đủ.`;

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
const handleBulkOrders = () => {
  const message = `Đơn hàng số lượng lớn:

1. Đối tượng áp dụng:
   - Nhà hàng, quán ăn, quán café
   - Công ty, văn phòng, cơ quan
   - Trường học, bệnh viện
   - Sự kiện, hội nghị

2. Ưu đãi đặc biệt:
   - Giảm 5% cho đơn hàng từ 2,000,000đ
   - Giảm 7% cho đơn hàng từ 5,000,000đ
   - Giảm 10% cho đơn hàng từ 10,000,000đ
   - Miễn phí vận chuyển cho mọi đơn hàng số lượng lớn

3. Dịch vụ đi kèm:
   - Tư vấn lựa chọn sản phẩm phù hợp
   - Báo giá nhanh trong vòng 2 giờ
   - Hỗ trợ xuất hóa đơn VAT
   - Giao hàng đúng hẹn, kiểm tra chất lượng

4. Quy trình đặt hàng:
   - Liên hệ 0326 743391 hoặc email kit10012003@gmail.com
   - Cung cấp danh sách sản phẩm và số lượng
   - Nhận báo giá và xác nhận đơn hàng
   - Thống nhất thời gian giao hàng

Vui lòng đặt trước ít nhất 3-5 ngày với đơn hàng lớn.`;

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
const handleChatbotHelp = () => {
  const message = `Tôi có thể giúp bạn tìm sản phẩm, kiểm tra đơn hàng, giải đáp chính sách giao hàng – thanh toán – đổi trả.`;

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
const handleProductNotFound = () => {
  const message = `Bạn hãy thử nhập tên sản phẩm khác hoặc mô tả chi tiết hơn. Nếu vẫn không có, bạn có thể gửi yêu cầu đặt hàng riêng.`;

  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_product_not_found'
  };
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJpbnRlbnRLZXl3b3JkcyIsImludGVudFByaW9yaXR5IiwiZGV0ZWN0SW50ZW50RnJvbUtleXdvcmRzIiwicXVlcnkiLCJub3JtYWxpemVkUXVlcnkiLCJ0b0xvd2VyQ2FzZSIsImNvbnNvbGUiLCJsb2ciLCJpbnRlbnQiLCJrZXl3b3JkcyIsIk9iamVjdCIsImVudHJpZXMiLCJrZXl3b3JkIiwicmVwbGFjZSIsInNjb3JlcyIsImJlc3RNYXRjaCIsImhpZ2hlc3RTY29yZSIsInByaW9yaXR5IiwibGVuZ3RoIiwiaW5jbHVkZXMiLCJleHBvcnRzIiwiaGFuZGxlRkFRUXVlc3Rpb24iLCJoYW5kbGVIb3dUb0J1eSIsImhhbmRsZUhvd1RvT3JkZXIiLCJoYW5kbGVQYXltZW50TWV0aG9kcyIsImhhbmRsZVN0b3JlTG9jYXRpb24iLCJoYW5kbGVQcm9kdWN0UXVhbGl0eSIsImhhbmRsZVNoaXBwaW5nVGltZSIsImhhbmRsZVJldHVyblBvbGljeSIsImhhbmRsZVByb21vdGlvbnMiLCJoYW5kbGVUcmVuZGluZ1Byb2R1Y3RzIiwiaGFuZGxlU2hpcHBpbmdGZWUiLCJoYW5kbGVDdXN0b21lclN1cHBvcnQiLCJoYW5kbGVNZW1iZXJzaGlwIiwiaGFuZGxlT3JnYW5pY1Byb2R1Y3RzIiwiaGFuZGxlRGlldGFyeU9wdGlvbnMiLCJoYW5kbGVHaWZ0U2VydmljZXMiLCJoYW5kbGVCdWxrT3JkZXJzIiwiaGFuZGxlQ2hhdGJvdEhlbHAiLCJoYW5kbGVQcm9kdWN0Tm90Rm91bmQiLCJzdWNjZXNzIiwidHlwZSIsIm1lc3NhZ2UiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvQ29udHJvbGxlci9jaGF0Ym90RkFRSGFuZGxlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogSOG7hyB0aOG7kW5nIHjhu60gbMO9IGPDonUgaOG7j2kgdGjGsOG7nW5nIGfhurdwIChGQVEpXHJcbiAqIEZpbGUgbsOgeSBjaOG7qWEgY8OhYyBow6BtIMSR4buDIHRy4bqjIGzhu51pIGPDoWMgY8OidSBo4buPaSBjaHVuZyB24buBIGPhu61hIGjDoG5nLCBjaMOtbmggc8OhY2gsIHbDoCBk4buLY2ggduG7pVxyXG4gKi9cclxuXHJcbi8vIMSQ4buLbmggbmdoxKlhIHThu6sga2jDs2EgY2hvIG3hu5dpIGludGVudCDEkeG7gyB0xINuZyDEkeG7mSBjaMOtbmggeMOhYyBraGkgbmjhuq1uIGRp4buHbiBjw6J1IGjhu49pXHJcbmNvbnN0IGludGVudEtleXdvcmRzID0ge1xyXG4gICdmYXFfaG93X3RvX2J1eSc6IFsnbXVhIGjDoG5nJywgJ211YSBz4bqjbiBwaOG6qW0nLCAnY8OhY2ggbXVhJywgJ211YSBuaMawIHRo4bq/IG7DoG8nLCAnbMOgbSBzYW8gxJHhu4MgbXVhJywgJ8SR4bq3dCBtdWEnLCAnbXVhIG5oxrAgbsOgbycsICdtdWEg4bufIMSRw6J1J10sXHJcbiAgJ2ZhcV9ob3dfdG9fb3JkZXInOiBbJ8SR4bq3dCBow6BuZycsICdvcmRlcicsICdjw6FjaCDEkeG6t3QnLCAnY8OhYyBixrDhu5tjIMSR4bq3dCBow6BuZycsICdoxrDhu5tuZyBk4bqrbiDEkeG6t3QgaMOgbmcnLCAnbMOgbSBzYW8gxJHhu4MgxJHhurd0JywgJ8SR4bq3dCBuaMawIHRo4bq/IG7DoG8nXSxcclxuICAnZmFxX3BheW1lbnRfbWV0aG9kcyc6IFsndGhhbmggdG/DoW4nLCAndHLhuqMgdGnhu4FuJywgJ3BoxrDGoW5nIHRo4bupYyB0aGFuaCB0b8OhbicsICdjw6FjaCB0aGFuaCB0b8OhbicsICdjaHV54buDbiBraG/huqNuJywgJ3Rp4buBbiBt4bq3dCcsICd0aOG6uyB0w61uIGThu6VuZycsICdjb2QnLCAndHLhuqMgZ8OzcCcsICd2aXNhJywgJ21hc3RlcmNhcmQnLCAnYXRtJywgJ2jDrG5oIHRo4bupYyB0aGFuaCB0b8OhbiddLFxyXG4gICdmYXFfc3RvcmVfbG9jYXRpb24nOiBbJ8SR4buLYSBjaOG7iScsICdj4butYSBow6BuZycsICdjaOG7lyBiw6FuJywgJ2PGoSBz4bufJywgJ2NoaSBuaMOhbmgnLCAnduG7iyB0csOtJywgJ27GoWkgYsOhbicsICfhu58gxJHDonUnLCAnc2hvcCDhu58gxJHDonUnLCAnY+G7rWEgaMOgbmcg4bufIMSRw6J1JywgJ2No4buXIG7DoG8nXSxcclxuICAnZmFxX3Byb2R1Y3RfcXVhbGl0eSc6IFsnY2jhuqV0IGzGsOG7o25nJywgJ3PhuqNuIHBo4bqpbScsICfEkeG6o20gYuG6o28nLCAnxJHhu5kgYW4gdG/DoG4nLCAnaOG6oW4gc+G7rSBk4bulbmcnLCAnY2jhu6luZyBuaOG6rW4nLCAna2nhu4NtIMSR4buLbmgnLCAnY2FtIGvhur90JywgJ2LhuqNvIMSR4bqjbScsICdjaOG6pXQgbMaw4bujbmcgbmjGsCB0aOG6vyBuw6BvJywgJ25ndeG7k24gZ+G7kWMnLCAneHXhuqV0IHjhu6knXSxcclxuICAnZmFxX3NoaXBwaW5nX3RpbWUnOiBbJ2dpYW8gaMOgbmcnLCAnduG6rW4gY2h1eeG7g24nLCAndGjhu51pIGdpYW4gZ2lhbycsICdiYW8gbMOidScsICdt4bqleSBuZ8OgeScsICduaOG6rW4gaMOgbmcnLCAnc2hpcCcsICdraGkgbsOgbyBuaOG6rW4gxJHGsOG7o2MnLCAnZ2lhbyB0cm9uZyBiYW8gbMOidScsICdnaWFvIG5oYW5oIGtow7RuZyddLFxyXG4gICdmYXFfcmV0dXJuX3BvbGljeSc6IFsnxJHhu5VpIHRy4bqjJywgJ2hvw6BuIHRp4buBbicsICd0cuG6oyBs4bqhaScsICdraMO0bmcgxrBuZycsICfEkeG7lWkgc+G6o24gcGjhuqltJywgJ2Now61uaCBzw6FjaCDEkeG7lWknLCAnYuG6o28gaMOgbmgnLCAna2jDtG5nIHbhu6thIMO9JywgJ2tow7RuZyB0aMOtY2gnLCAnbOG7l2knLCAnaMawIGjhu49uZycsICdrw6ltIGNo4bqldCBsxrDhu6NuZycsICfEkeG7lWkgaMOgbmcnXSxcclxuICAnZmFxX3Byb21vdGlvbnMnOiBbJ2todXnhur9uIG3Do2knLCAnZ2nhuqNtIGdpw6EnLCAnxrB1IMSRw6NpJywgJ3NhbGUnLCAncXXDoCB04bq3bmcga8OobScsICdtw6MgZ2nhuqNtIGdpw6EnLCAndm91Y2hlcicsICdjb3Vwb24nLCAnY8OzIMawdSDEkcOjaScsICfEkWFuZyBnaeG6o20gZ2nDoScsICdzYWxlIG9mZicsICdjw7Mga2h1eeG6v24gbcOjaSBraMO0bmcnLCAnxrB1IMSRw6NpIGfDrCddLFxyXG4gICdmYXFfdHJlbmRpbmdfcHJvZHVjdHMnOiBbJ3PhuqNuIHBo4bqpbSBob3QnLCAnYsOhbiBjaOG6oXknLCAneHUgaMaw4bubbmcnLCAnbeG7m2kgbmjhuqV0JywgJ3Bo4buVIGJp4bq/bicsICduaGnhu4F1IG5nxrDhu51pIG11YScsICd0cmVuZCcsICdu4buVaSBi4bqtdCcsICdz4bqjbiBwaOG6qW0gbeG7m2knLCAnaMOgbmcgaG90JywgJ2jDoG5nIG3hu5tpIHbhu4EnLCAnc+G6o24gcGjhuqltIHBo4buVIGJp4bq/biddLFxyXG4gICdmYXFfc2hpcHBpbmdfZmVlJzogWydwaMOtIHbhuq1uIGNodXnhu4NuJywgJ3Bow60gZ2lhbyBow6BuZycsICdzaGlwJywgJ2ZyZWVzaGlwJywgJ21p4buFbiBwaMOtIGdpYW8nLCAnZ2nDoSBzaGlwJywgJ3Rp4buBbiBzaGlwJywgJ3Thu5FuIHBow60nLCAnbeG6pXQgcGjDrScsICdjaGkgcGjDrSBnaWFvJywgJ2ZyZWUgc2hpcCcsICdnaWFvIG1p4buFbiBwaMOtJywgJ3Bow60gc2hpcCddLFxyXG4gICdmYXFfY3VzdG9tZXJfc3VwcG9ydCc6IFsnaOG7lyB0cuG7oycsICd0xrAgduG6pW4nLCAnbGnDqm4gaOG7hycsICdnacO6cCDEkeG7oScsICdob3RsaW5lJywgJ3Phu5EgxJFp4buHbiB0aG/huqFpJywgJ25ow6JuIHZpw6puJywgJ2NoxINtIHPDs2MnLCAndOG7lW5nIMSRw6BpJywgJ3phbG8nLCAnZmFjZWJvb2snLCAnZW1haWwnXSxcclxuICAnZmFxX21lbWJlcnNoaXAnOiBbJ3Row6BuaCB2acOqbicsICdraMOhY2ggaMOgbmcgdGjDom4gdGhp4bq/dCcsICdtZW1iZXJzaGlwJywgJ2jhu5lpIHZpw6puJywgJ3TDrWNoIMSRaeG7g20nLCAnxrB1IMSRw6NpIHRow6BuaCB2acOqbicsICd2aXAnLCAnxJFp4buDbSB0aMaw4bufbmcnLCAnY2jGsMahbmcgdHLDrG5oIHRow6BuaCB2acOqbicsICdxdXnhu4FuIGzhu6NpJywgJ8SRxINuZyBrw70gdGjDoG5oIHZpw6puJ10sXHJcbiAgJ2ZhcV9vcmdhbmljX3Byb2R1Y3RzJzogWydo4buvdSBjxqEnLCAnb3JnYW5pYycsICd04buxIG5oacOqbicsICdraMO0bmcgaMOzYSBjaOG6pXQnLCAnc+G6oWNoJywgJ2FuIHRvw6BuJywgJ3NpbmggaOG7jWMnLCAna2jDtG5nIHRodeG7kWMgdHLhu6sgc8OidScsICdraMO0bmcgcGjDom4gYsOzbicsICdz4bqjbiBwaOG6qW0gaOG7r3UgY8ahJywgJ3Ro4buxYyBwaOG6qW0gc+G6oWNoJywgJ3hhbmgnLCAnZWNvJ10sXHJcbiAgJ2ZhcV9kaWV0YXJ5X29wdGlvbnMnOiBbJ8SDbiBracOqbmcnLCAnY2hheScsICd0aHXhuqduIGNoYXknLCAndmVnYW4nLCAna2V0bycsICdsb3ctY2FyYicsICdnbHV0ZW4tZnJlZScsICdraMO0bmcgxJHGsOG7nW5nJywgJ8OtdCDEkcaw4budbmcnLCAna2jDtG5nIGxhY3Rvc2UnLCAnxINuIGNoYXknLCAnxJHhu5MgY2hheScsICdraMO0bmcgdGluaCBi4buZdCcsICfDrXQgbXXhu5FpJywgJ8OtdCBiw6lvJ10sXHJcbiAgJ2ZhcV9naWZ0X3NlcnZpY2VzJzogWydxdcOgIHThurduZycsICdnw7NpIHF1w6AnLCAnZ2nhu48gcXXDoCcsICd0aOG6uyBxdcOgIHThurduZycsICdnaWZ0IGNhcmQnLCAnZ+G7rWkgcXXDoCcsICdxdcOgIGJp4bq/dScsICdxdcOgIHNpbmggbmjhuq10JywgJ2Thu4tjaCB24bulIHF1w6AnLCAnZ+G7rWkgcXXDoCB04bq3bmcnLCAnY8OzIGThu4tjaCB24bulIGfDs2kgcXXDoCBraMO0bmcnLCAnbMOgbSBo4buZcCBxdcOgJ10sXHJcbiAgJ2ZhcV9idWxrX29yZGVycyc6IFsnxJHGoW4gaMOgbmcgbOG7m24nLCAnbXVhIHPhu5EgbMaw4bujbmcgbmhp4buBdScsICdtdWEgc+G7iScsICfEkeG6t3QgaMOgbmcgc+G7kSBsxrDhu6NuZyBs4bubbicsICdkb2FuaCBuZ2hp4buHcCcsICdjw7RuZyB0eSDEkeG6t3QgaMOgbmcnLCAnc+G7kSBsxrDhu6NuZyBs4bubbicsICdtdWEgbmhp4buBdScsICdnacOhIHPhu4knLCAnZ2nhuqNtIGdpw6Ega2hpIG11YSBuaGnhu4F1JywgJ8SRxqFuIMSRb8OgbicsICdtdWEgaMOgbmcgbG/huqF0JywgJ211YSB24bubaSBz4buRIGzGsOG7o25nIGzhu5tuJywgJ8SRxqFuIGjDoG5nIHPhu5EgbMaw4bujbmcgbOG7m24nLCAnxJHGoW4gc+G7kSBsxrDhu6NuZyBs4bubbiddLFxyXG4gICdmYXFfY2hhdGJvdF9oZWxwJzogWydjaGF0Ym90IGPDsyB0aOG7gyBnacO6cCBnw6wgY2hvIHTDtGknLCAnY2hhdGJvdCBnacO6cCBnw6wgY2hvIHTDtGknLCAnY2hhdGJvdCBnacO6cCBnw6wnLCAnY2hhdGJvdCBjw7MgdGjhu4MgZ2nDunAgZ8OsJywgJ2NoYXRib3QgaOG7lyB0cuG7oycsICdib3QgY8OzIHRo4buDIGzDoG0gZ8OsJywgJ2NoYXRib3QgbMOgbSDEkcaw4bujYyBnw6wnLCAndHLhu6MgbMO9IOG6o28nLCAnYm90IGdpw7pwIMSRxrDhu6NjIGfDrCcsICdib3QgaOG7lyB0cuG7oyBnw6wnLCAnY2hhdGJvdCBjw7MgdMOtbmggbsSDbmcgZ8OsJywgJ3dlYnNpdGUgaOG7lyB0cuG7oycsICd0w61uaCBuxINuZyBjaGF0Ym90JywgJ3TDrW5oIG7Eg25nIHdlYnNpdGUnLCAnaOG7hyB0aOG7kW5nIGjhu5cgdHLhu6MnLCAnY2hhdGJvdCBsw6BtIGfDrCddLFxyXG4gICdmYXFfcHJvZHVjdF9ub3RfZm91bmQnOiBbJ2tow7RuZyB0w6xtIHRo4bqleSBz4bqjbiBwaOG6qW0nLCAndMOsbSBraMO0bmcgcmEnLCAna2jDtG5nIGPDsyBz4bqjbiBwaOG6qW0nLCAnc+G6o24gcGjhuqltIGtow7RuZyBjw7MnLCAna2jDtG5nIHRo4bqleSBow6BuZycsICdraMO0bmcgdMOsbSDEkcaw4bujYycsICdz4bqjbiBwaOG6qW0ga2jDtG5nIGhp4buDbiB0aOG7iycsICdraMO0bmcgdGjhuqV5IHPhuqNuIHBo4bqpbScsICd0w6xtIHPhuqNuIHBo4bqpbScsICd0w6xtIGtp4bq/bSBz4bqjbiBwaOG6qW0nLCAndMOsbSBraMO0bmcgdGjhuqV5J11cclxufTtcclxuXHJcbi8vIMSQw6FuaCBnacOhIG3hu6ljIMSR4buZIMawdSB0acOqbiBjaG8gdOG7q25nIGxv4bqhaSBpbnRlbnRcclxuY29uc3QgaW50ZW50UHJpb3JpdHkgPSB7XHJcbiAgJ2ZhcV9idWxrX29yZGVycyc6IDMsXHJcbiAgJ2ZhcV9vcmdhbmljX3Byb2R1Y3RzJzogMyxcclxuICAnZmFxX2dpZnRfc2VydmljZXMnOiAzLFxyXG4gICdmYXFfY2hhdGJvdF9oZWxwJzogMyxcclxuICAnZmFxX3Byb21vdGlvbnMnOiAyLFxyXG4gICdmYXFfcGF5bWVudF9tZXRob2RzJzogMixcclxuICAnZmFxX3NoaXBwaW5nX2ZlZSc6IDIsXHJcbiAgJ2ZhcV9zaGlwcGluZ190aW1lJzogMixcclxuICAnZmFxX3JldHVybl9wb2xpY3knOiAyLFxyXG4gICdmYXFfZGlldGFyeV9vcHRpb25zJzogMixcclxuICAnZmFxX3Byb2R1Y3Rfbm90X2ZvdW5kJzogMixcclxuICAnZmFxX2hvd190b19idXknOiAxLFxyXG4gICdmYXFfaG93X3RvX29yZGVyJzogMSxcclxuICAnZmFxX3N0b3JlX2xvY2F0aW9uJzogMSxcclxuICAnZmFxX3Byb2R1Y3RfcXVhbGl0eSc6IDEsXHJcbiAgJ2ZhcV90cmVuZGluZ19wcm9kdWN0cyc6IDEsXHJcbiAgJ2ZhcV9jdXN0b21lcl9zdXBwb3J0JzogMSxcclxuICAnZmFxX21lbWJlcnNoaXAnOiAxXHJcbn07XHJcblxyXG4vKipcclxuICogUGjDoXQgaGnhu4duIGludGVudCBk4buxYSB0csOqbiB04burIGtow7NhIHRyb25nIGPDonUgaOG7j2lcclxuICogQHBhcmFtIHtzdHJpbmd9IHF1ZXJ5IC0gQ8OidSBo4buPaSBj4bunYSBuZ8aw4budaSBkw7luZ1xyXG4gKiBAcmV0dXJucyB7c3RyaW5nfG51bGx9IC0gSW50ZW50IHBow6F0IGhp4buHbiDEkcaw4bujYyBob+G6t2MgbnVsbCBu4bq/dSBraMO0bmcgdMOsbSB0aOG6pXlcclxuICovXHJcbmV4cG9ydCBjb25zdCBkZXRlY3RJbnRlbnRGcm9tS2V5d29yZHMgPSAocXVlcnkpID0+IHtcclxuICBpZiAoIXF1ZXJ5KSByZXR1cm4gbnVsbDtcclxuICBcclxuICAvLyBDaHV54buDbiBjw6J1IGjhu49pIHRow6BuaCBjaOG7ryB0aMaw4budbmcgxJHhu4Mgc28gc8OhbmggZOG7hSBkw6BuZyBoxqFuXHJcbiAgY29uc3Qgbm9ybWFsaXplZFF1ZXJ5ID0gcXVlcnkudG9Mb3dlckNhc2UoKTtcclxuICBjb25zb2xlLmxvZyhgTm9ybWFsaXplZCBRdWVyeTogXCIke25vcm1hbGl6ZWRRdWVyeX1cImApO1xyXG4gIFxyXG4gIC8vIEtp4buDbSB0cmEga2jhu5twIGNow61uaCB4w6FjIHbhu5tpIGPDonUgaOG7j2lcclxuICBmb3IgKGNvbnN0IFtpbnRlbnQsIGtleXdvcmRzXSBvZiBPYmplY3QuZW50cmllcyhpbnRlbnRLZXl3b3JkcykpIHtcclxuICAgIGZvciAoY29uc3Qga2V5d29yZCBvZiBrZXl3b3Jkcykge1xyXG4gICAgICAvLyBO4bq/dSBjw6J1IGjhu49pIGto4bubcCBjaMOtbmggeMOhYyB24bubaSB04burIGtow7NhXHJcbiAgICAgIGlmIChub3JtYWxpemVkUXVlcnkgPT09IGtleXdvcmQudG9Mb3dlckNhc2UoKSB8fCBcclxuICAgICAgICAgIG5vcm1hbGl6ZWRRdWVyeS5yZXBsYWNlKC9bPy4sIV0vZywgJycpID09PSBrZXl3b3JkLnRvTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgRXhhY3QgbWF0Y2ggZm91bmQgZm9yIGludGVudDogJHtpbnRlbnR9LCBrZXl3b3JkOiBcIiR7a2V5d29yZH1cImApO1xyXG4gICAgICAgIHJldHVybiBpbnRlbnQ7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgXHJcbiAgLy8gxJBp4buDbSBz4buRIGNobyBt4buXaSBpbnRlbnRcclxuICBjb25zdCBzY29yZXMgPSB7fTtcclxuICBsZXQgYmVzdE1hdGNoID0gbnVsbDtcclxuICBsZXQgaGlnaGVzdFNjb3JlID0gMDtcclxuICBcclxuICAvLyBLaeG7g20gdHJhIGto4bubcCBt4buZdCBwaOG6p24gduG7m2kgdOG7qyBraMOzYVxyXG4gIGZvciAoY29uc3QgW2ludGVudCwga2V5d29yZHNdIG9mIE9iamVjdC5lbnRyaWVzKGludGVudEtleXdvcmRzKSkge1xyXG4gICAgY29uc3QgcHJpb3JpdHkgPSBpbnRlbnRQcmlvcml0eVtpbnRlbnRdIHx8IDE7XHJcbiAgICBzY29yZXNbaW50ZW50XSA9IDA7XHJcbiAgICBcclxuICAgIGZvciAoY29uc3Qga2V5d29yZCBvZiBrZXl3b3Jkcykge1xyXG4gICAgICAvLyBLaeG7g20gdHJhIHThu6sga2jDs2EgZMOgaSB0cm9uZyBjw6J1IGjhu49pXHJcbiAgICAgIGlmIChrZXl3b3JkLmxlbmd0aCA+IDEwICYmIG5vcm1hbGl6ZWRRdWVyeS5pbmNsdWRlcyhrZXl3b3JkLnRvTG93ZXJDYXNlKCkpKSB7XHJcbiAgICAgICAgc2NvcmVzW2ludGVudF0gKz0ga2V5d29yZC5sZW5ndGggKiAyICogcHJpb3JpdHk7XHJcbiAgICAgICAgY29uc29sZS5sb2coYExvbmcga2V5d29yZCBtYXRjaDogXCIke2tleXdvcmR9XCIgZm9yIGludGVudCAke2ludGVudH0sIHNjb3JlICske2tleXdvcmQubGVuZ3RoICogMiAqIHByaW9yaXR5fWApO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIFThu6sga2jDs2Egbmfhuq9uIGNo4buJIHTDrW5oIG7hur91IGzDoCB04burIHJpw6puZyBiaeG7h3QgdHJvbmcgY8OidVxyXG4gICAgICBlbHNlIGlmIChub3JtYWxpemVkUXVlcnkuaW5jbHVkZXMoa2V5d29yZC50b0xvd2VyQ2FzZSgpKSkge1xyXG4gICAgICAgIHNjb3Jlc1tpbnRlbnRdICs9IGtleXdvcmQubGVuZ3RoICogcHJpb3JpdHk7XHJcbiAgICAgICAgY29uc29sZS5sb2coYEtleXdvcmQgbWF0Y2g6IFwiJHtrZXl3b3JkfVwiIGZvciBpbnRlbnQgJHtpbnRlbnR9LCBzY29yZSArJHtrZXl3b3JkLmxlbmd0aCAqIHByaW9yaXR5fWApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEPhuq1wIG5o4bqtdCBpbnRlbnQgY8OzIMSRaeG7g20gY2FvIG5o4bqldFxyXG4gICAgaWYgKHNjb3Jlc1tpbnRlbnRdID4gaGlnaGVzdFNjb3JlKSB7XHJcbiAgICAgIGhpZ2hlc3RTY29yZSA9IHNjb3Jlc1tpbnRlbnRdO1xyXG4gICAgICBiZXN0TWF0Y2ggPSBpbnRlbnQ7XHJcbiAgICB9XHJcbiAgfVxyXG4gIFxyXG4gIGNvbnNvbGUubG9nKGBCZXN0IG1hdGNoaW5nIGludGVudDogJHtiZXN0TWF0Y2h9LCBzY29yZTogJHtoaWdoZXN0U2NvcmV9YCk7XHJcbiAgLy8gVHLhuqMgduG7gSBpbnRlbnQgcGjDuSBo4bujcCBuaOG6pXQgbuG6v3UgxJFp4buDbSDEkeG7pyBjYW9cclxuICByZXR1cm4gaGlnaGVzdFNjb3JlID4gMCA/IGJlc3RNYXRjaCA6IG51bGw7XHJcbn07XHJcblxyXG4vKipcclxuICogWOG7rSBsw70gY8OidSBo4buPaSB04burIG5nxrDhu51pIGTDuW5nIGThu7FhIHRyw6puIGxv4bqhaSBpbnRlbnQgxJHDoyBwaMOhdCBoaeG7h25cclxuICogQHBhcmFtIHtzdHJpbmd9IGludGVudCAtIEludGVudCDEkcaw4bujYyBwaMOhdCBoaeG7h24gdOG7qyBjw6J1IGjhu49pXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBxdWVyeSAtIEPDonUgaOG7j2kgZ+G7kWMgY+G7p2EgbmfGsOG7nWkgZMO5bmdcclxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2kgY2hvIGPDonUgaOG7j2lcclxuICovXHJcbmV4cG9ydCBjb25zdCBoYW5kbGVGQVFRdWVzdGlvbiA9IChpbnRlbnQsIHF1ZXJ5ID0gXCJcIikgPT4ge1xyXG4gIGNvbnNvbGUubG9nKGBY4butIGzDvSBjw6J1IGjhu49pIEZBUSB24bubaSBpbnRlbnQ6ICR7aW50ZW50fWApO1xyXG4gIFxyXG4gIC8vIE7hur91IGtow7RuZyBjw7MgaW50ZW50IMSRxrDhu6NjIGN1bmcgY+G6pXAsIHRo4butIHBow6F0IGhp4buHbiB04burIGPDonUgaOG7j2lcclxuICBpZiAoIWludGVudCAmJiBxdWVyeSkge1xyXG4gICAgaW50ZW50ID0gZGV0ZWN0SW50ZW50RnJvbUtleXdvcmRzKHF1ZXJ5KTtcclxuICAgIGNvbnNvbGUubG9nKGBQaMOhdCBoaeG7h24gaW50ZW50IHThu6sgY8OidSBo4buPaTogJHtpbnRlbnR9YCk7XHJcbiAgfVxyXG4gIFxyXG4gIC8vIMSQ4buLbmggdHV54bq/biDEkeG6v24gaMOgbSB44butIGzDvSB0xrDGoW5nIOG7qW5nIHbhu5tpIGludGVudFxyXG4gIHN3aXRjaCAoaW50ZW50KSB7XHJcbiAgICBjYXNlICdmYXFfaG93X3RvX2J1eSc6XHJcbiAgICAgIHJldHVybiBoYW5kbGVIb3dUb0J1eSgpO1xyXG4gICAgY2FzZSAnZmFxX2hvd190b19vcmRlcic6XHJcbiAgICAgIHJldHVybiBoYW5kbGVIb3dUb09yZGVyKCk7XHJcbiAgICBjYXNlICdmYXFfcGF5bWVudF9tZXRob2RzJzpcclxuICAgICAgcmV0dXJuIGhhbmRsZVBheW1lbnRNZXRob2RzKCk7XHJcbiAgICBjYXNlICdmYXFfc3RvcmVfbG9jYXRpb24nOlxyXG4gICAgICByZXR1cm4gaGFuZGxlU3RvcmVMb2NhdGlvbigpO1xyXG4gICAgY2FzZSAnZmFxX3Byb2R1Y3RfcXVhbGl0eSc6XHJcbiAgICAgIHJldHVybiBoYW5kbGVQcm9kdWN0UXVhbGl0eSgpO1xyXG4gICAgY2FzZSAnZmFxX3NoaXBwaW5nX3RpbWUnOlxyXG4gICAgICByZXR1cm4gaGFuZGxlU2hpcHBpbmdUaW1lKCk7XHJcbiAgICBjYXNlICdmYXFfcmV0dXJuX3BvbGljeSc6XHJcbiAgICAgIHJldHVybiBoYW5kbGVSZXR1cm5Qb2xpY3koKTtcclxuICAgIGNhc2UgJ2ZhcV9wcm9tb3Rpb25zJzpcclxuICAgICAgcmV0dXJuIGhhbmRsZVByb21vdGlvbnMoKTtcclxuICAgIGNhc2UgJ2ZhcV90cmVuZGluZ19wcm9kdWN0cyc6XHJcbiAgICAgIHJldHVybiBoYW5kbGVUcmVuZGluZ1Byb2R1Y3RzKCk7XHJcbiAgICBjYXNlICdmYXFfc2hpcHBpbmdfZmVlJzpcclxuICAgICAgcmV0dXJuIGhhbmRsZVNoaXBwaW5nRmVlKCk7XHJcbiAgICBjYXNlICdmYXFfY3VzdG9tZXJfc3VwcG9ydCc6XHJcbiAgICAgIHJldHVybiBoYW5kbGVDdXN0b21lclN1cHBvcnQoKTtcclxuICAgIGNhc2UgJ2ZhcV9tZW1iZXJzaGlwJzpcclxuICAgICAgcmV0dXJuIGhhbmRsZU1lbWJlcnNoaXAoKTtcclxuICAgIGNhc2UgJ2ZhcV9vcmdhbmljX3Byb2R1Y3RzJzpcclxuICAgICAgcmV0dXJuIGhhbmRsZU9yZ2FuaWNQcm9kdWN0cygpO1xyXG4gICAgY2FzZSAnZmFxX2RpZXRhcnlfb3B0aW9ucyc6XHJcbiAgICAgIHJldHVybiBoYW5kbGVEaWV0YXJ5T3B0aW9ucygpO1xyXG4gICAgY2FzZSAnZmFxX2dpZnRfc2VydmljZXMnOlxyXG4gICAgICByZXR1cm4gaGFuZGxlR2lmdFNlcnZpY2VzKCk7XHJcbiAgICBjYXNlICdmYXFfYnVsa19vcmRlcnMnOlxyXG4gICAgICByZXR1cm4gaGFuZGxlQnVsa09yZGVycygpO1xyXG4gICAgY2FzZSAnZmFxX2NoYXRib3RfaGVscCc6XHJcbiAgICAgIHJldHVybiBoYW5kbGVDaGF0Ym90SGVscCgpO1xyXG4gICAgY2FzZSAnZmFxX3Byb2R1Y3Rfbm90X2ZvdW5kJzpcclxuICAgICAgcmV0dXJuIGhhbmRsZVByb2R1Y3ROb3RGb3VuZCgpO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgICAgICBtZXNzYWdlOiBcIlTDtGkga2jDtG5nIHTDrG0gdGjhuqV5IHRow7RuZyB0aW4gcGjDuSBo4bujcCB24bubaSBjw6J1IGjhu49pIGPhu6dhIGLhuqFuLiBWdWkgbMOybmcgdGjhu60gbOG6oWkgduG7m2kgY8OidSBo4buPaSBraMOhYyBob+G6t2MgbGnDqm4gaOG7hyB0cuG7sWMgdGnhur9wIHbhu5tpIGLhu5kgcGjhuq1uIGjhu5cgdHLhu6Mga2jDoWNoIGjDoG5nIHF1YSBz4buRIMSRaeG7h24gdGhv4bqhaSAwMzI2IDc0MzM5MSDEkeG7gyDEkcaw4bujYyBnacO6cCDEkeG7oS5cIlxyXG4gICAgICB9O1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBY4butIGzDvSBjw6J1IGjhu49pIHbhu4EgY8OhY2ggbXVhIGjDoG5nXHJcbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGjhuqNuIGjhu5NpIGNobyBjw6J1IGjhu49pXHJcbiAqL1xyXG5jb25zdCBoYW5kbGVIb3dUb0J1eSA9ICgpID0+IHtcclxuICBjb25zdCBtZXNzYWdlID0gYEjGsOG7m25nIGThuqtuIG11YSBow6BuZzpcclxuXHJcbkPDoWNoIDE6IE11YSBow6BuZyB0cuG7sWMgdHV54bq/blxyXG4xLiBUw6xtIGtp4bq/bSBz4bqjbiBwaOG6qW0gdHLDqm4gdHJhbmcgd2ViXHJcbjIuIE5o4bqlcCB2w6BvIHPhuqNuIHBo4bqpbSDEkeG7gyB4ZW0gY2hpIHRp4bq/dFxyXG4zLiBDaOG7jW4gXCJUaMOqbSB2w6BvIGdp4buPIGjDoG5nXCIgaG/hurdjIFwiTXVhIG5nYXlcIlxyXG40LiBUaeG6v24gaMOgbmggxJHhurd0IGjDoG5nIHbDoCB0aGFuaCB0b8OhblxyXG5cclxuQ8OhY2ggMjogTXVhIGjDoG5nIHRy4buxYyB0aeG6v3AgdOG6oWkgY+G7rWEgaMOgbmdcclxuLSDEkOG7i2EgY2jhu4k6IFRyxrDhu51uZyDEkOG6oWkgaOG7jWMgTmFtIEPhuqduIFRoxqEsIE5ndXnhu4VuIFbEg24gQ+G7qyBu4buRaSBkw6BpLCBD4bqnbiBUaMahXHJcbi0gVGjhu51pIGdpYW4gbeG7nyBj4butYTogODowMCAtIDIxOjAwIG3hu5dpIG5nw6B5XHJcblxyXG5Dw6FjaCAzOiDEkOG6t3QgaMOgbmcgcXVhIMSRaeG7h24gdGhv4bqhaVxyXG4tIEhvdGxpbmU6IDAzMjYgNzQzMzkxXHJcbi0gTmjDom4gdmnDqm4gc+G6vSBo4buXIHRy4bujIMSR4bq3dCBow6BuZyB2w6AgZ2lhbyBow6BuZyB04bqtbiBuxqFpYDtcclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgc3VjY2VzczogdHJ1ZSxcclxuICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXHJcbiAgICBpbnRlbnQ6ICdmYXFfaG93X3RvX2J1eSdcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSBjw6FjaCDEkeG6t3QgaMOgbmdcclxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2kgY2hvIGPDonUgaOG7j2lcclxuICovXHJcbmNvbnN0IGhhbmRsZUhvd1RvT3JkZXIgPSAoKSA9PiB7XHJcbiAgY29uc3QgbWVzc2FnZSA9IGBDw6FjIGLGsOG7m2MgxJHhurd0IGjDoG5nIHRyw6puIHdlYnNpdGU6XHJcblxyXG4xLiBUw6xtIGtp4bq/bSBz4bqjbiBwaOG6qW06IFPhu60gZOG7pW5nIHRoYW5oIHTDrG0ga2nhur9tIGhv4bq3YyBkdXnhu4d0IHF1YSBkYW5oIG3hu6VjXHJcbjIuIFRow6ptIHbDoG8gZ2nhu48gaMOgbmc6IE5o4bqlcCB2w6BvIG7DunQgXCJUaMOqbSB2w6BvIGdp4buPXCIgc2F1IGtoaSBjaOG7jW4gc+G6o24gcGjhuqltXHJcbjMuIEtp4buDbSB0cmEgZ2nhu48gaMOgbmc6IE5o4bqlcCB2w6BvIGJp4buDdSB0xrDhu6NuZyBnaeG7jyBow6BuZyDEkeG7gyB4ZW0gdsOgIGNo4buJbmggc+G7rWEgxJHGoW4gaMOgbmdcclxuNC4gVGhhbmggdG/DoW46IE5o4bqlcCBcIlRoYW5oIHRvw6FuXCIgdsOgIMSRaeG7gW4gdGjDtG5nIHRpbiBnaWFvIGjDoG5nXHJcbjUuIENo4buNbiBwaMawxqFuZyB0aOG7qWMgdGhhbmggdG/DoW46IENo4buNbiBow6xuaCB0aOG7qWMgdGhhbmggdG/DoW4gcGjDuSBo4bujcFxyXG42LiBIb8OgbiB04bqldCDEkcahbiBow6BuZzogWMOhYyBuaOG6rW4gxJHGoW4gaMOgbmcgdsOgIG5o4bqtbiBtw6MgxJHGoW4gaMOgbmdcclxuXHJcbk7hur91IGfhurdwIGtow7Mga2jEg24sIHZ1aSBsw7JuZyBsacOqbiBo4buHIGhvdGxpbmU6IDAzMjYgNzQzMzkxYDtcclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgc3VjY2VzczogdHJ1ZSxcclxuICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXHJcbiAgICBpbnRlbnQ6ICdmYXFfaG93X3RvX29yZGVyJ1xyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogWOG7rSBsw70gY8OidSBo4buPaSB24buBIGPDoWMgcGjGsMahbmcgdGjhu6ljIHRoYW5oIHRvw6FuXHJcbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGjhuqNuIGjhu5NpIGNobyBjw6J1IGjhu49pXHJcbiAqL1xyXG5jb25zdCBoYW5kbGVQYXltZW50TWV0aG9kcyA9ICgpID0+IHtcclxuICBjb25zdCBtZXNzYWdlID0gYEPDoWMgaMOsbmggdGjhu6ljIHRoYW5oIHRvw6FuIMSRxrDhu6NjIGNo4bqlcCBuaOG6rW46XHJcblxyXG4xLiBUaGFuaCB0b8OhbiBraGkgbmjhuq1uIGjDoG5nIChDT0QpOiBUaGFuaCB0b8OhbiB0cuG7sWMgdGnhur9wIGNobyBuaMOibiB2acOqbiBnaWFvIGjDoG5nXHJcblxyXG4yLiBDaHV54buDbiBraG/huqNuIG5nw6JuIGjDoG5nOlxyXG4gICAtIE5nw6JuIGjDoG5nOiBNQiBCYW5rXHJcbiAgIC0gU+G7kSB0w6BpIGtob+G6o246IDAzMjY3NDMzOTFcclxuICAgLSBDaOG7pyB0w6BpIGtob+G6o246IE5HVVlFTiBUUk9ORyBLSElFTVxyXG4gICAtIE7hu5lpIGR1bmc6IFtNw6MgxJHGoW4gaMOgbmddXHJcblxyXG4zLiBUaOG6uyB0w61uIGThu6VuZy9naGkgbuG7ozogTUIgQkFOS1xyXG5cclxuNC4gVGhhbmggdG/DoW4ga2hpIG5o4bqtbiBow6BuZ1xyXG5cclxuQ2jDum5nIHTDtGkgxJHhuqNtIGLhuqNvIHRow7RuZyB0aW4gdGhhbmggdG/DoW4gY+G7p2EgYuG6oW4gxJHGsOG7o2MgYuG6o28gbeG6rXQgdsOgIGFuIHRvw6BuLmA7XHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICB0eXBlOiAndGV4dCcsXHJcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxyXG4gICAgaW50ZW50OiAnZmFxX3BheW1lbnRfbWV0aG9kcydcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSDEkeG7i2EgY2jhu4kgY+G7rWEgaMOgbmdcclxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2kgY2hvIGPDonUgaOG7j2lcclxuICovXHJcbmNvbnN0IGhhbmRsZVN0b3JlTG9jYXRpb24gPSAoKSA9PiB7XHJcbiAgY29uc3QgbWVzc2FnZSA9IGDEkOG7i2EgY2jhu4kgY+G7rWEgaMOgbmc6XHJcblxyXG5D4butYSBow6BuZyBjaMOtbmg6XHJcblRyxrDhu51uZyDEkOG6oWkgaOG7jWMgTmFtIEPhuqduIFRoxqEsIE5ndXnhu4VuIFbEg24gQ+G7qyBu4buRaSBkw6BpLCBD4bqnbiBUaMahIENpdHlcclxuxJBp4buHbiB0aG/huqFpOiAwMzI2IDc0MzM5MVxyXG5HaeG7nSBt4bufIGPhu61hOiA4OjAwIC0gMjE6MDAgaMOgbmcgbmfDoHlcclxuXHJcbkNoaSBuaMOhbmggMTpcclxuVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBOYW0gQ+G6p24gVGjGoSwgTmd1eeG7hW4gVsSDbiBD4burIG7hu5FpIGTDoGksIEPhuqduIFRoxqEgQ2l0eVxyXG7EkGnhu4duIHRob+G6oWk6IDAzMjYgNzQzMzkxXHJcbkdp4budIG3hu58gY+G7rWE6IDg6MDAgLSAyMTowMCBow6BuZyBuZ8OgeVxyXG5cclxuQuG6oW4gY8OzIHRo4buDIHTDrG0gxJHGsOG7nW5nIMSR4bq/biBj4butYSBow6BuZyBi4bqxbmcgY8OhY2ggdMOsbSBraeG6v20gXCJETkNGT09EXCIgdHLDqm4gR29vZ2xlIE1hcHMuYDtcclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgc3VjY2VzczogdHJ1ZSxcclxuICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXHJcbiAgICBpbnRlbnQ6ICdmYXFfc3RvcmVfbG9jYXRpb24nXHJcbiAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBY4butIGzDvSBjw6J1IGjhu49pIHbhu4EgY2jhuqV0IGzGsOG7o25nIHPhuqNuIHBo4bqpbVxyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaSBjaG8gY8OidSBo4buPaVxyXG4gKi9cclxuY29uc3QgaGFuZGxlUHJvZHVjdFF1YWxpdHkgPSAoKSA9PiB7XHJcbiAgY29uc3QgbWVzc2FnZSA9IGBDYW0ga+G6v3QgduG7gSBjaOG6pXQgbMaw4bujbmcgc+G6o24gcGjhuqltOlxyXG5cclxuLSBU4bqldCBj4bqjIHPhuqNuIHBo4bqpbSDEkeG7gXUgxJHGsOG7o2Mga2nhu4NtIHNvw6F0IGNo4bqldCBsxrDhu6NuZyBuZ2hpw6ptIG5n4bq3dFxyXG4tIENo4buJIGN1bmcgY+G6pXAgc+G6o24gcGjhuqltIHThu6sgbmjDoCBjdW5nIGPhuqVwIHV5IHTDrW4sIGPDsyBnaeG6pXkgY2jhu6luZyBuaOG6rW4gYW4gdG/DoG4gdGjhu7FjIHBo4bqpbVxyXG4tIMSQ4buRaSB24bubaSB0aOG7sWMgcGjhuqltIHTGsMahaSBz4buRbmcsIMSR4bqjbSBi4bqjbyDEkeG7mSB0xrDGoWkgbeG7m2kgaMOgbmcgbmfDoHlcclxuLSBU4bqldCBj4bqjIHPhuqNuIHBo4bqpbSBjw7Mgbmd14buTbiBn4buRYyB4deG6pXQgeOG7qSByw7UgcsOgbmcgdsOgIGdoaSDEkeG6p3kgxJHhu6cgdHLDqm4gYmFvIGLDrFxyXG4tIMOBcCBk4bulbmcgY2jDrW5oIHPDoWNoIFwiSG/DoG4gdGnhu4FuIDEwMCVcIiBu4bq/dSBz4bqjbiBwaOG6qW0ga2jDtG5nIMSR4bqhdCBjaOG6pXQgbMaw4bujbmdcclxuLSDEkOG7mWkgbmfFqSBraeG7g20gxJHhu4tuaCB2acOqbiDEkeG6o20gYuG6o28gbeG7l2kgbMO0IGjDoG5nIMSR4buBdSDEkeG6oXQgdGnDqnUgY2h14bqpbmA7XHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICB0eXBlOiAndGV4dCcsXHJcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxyXG4gICAgaW50ZW50OiAnZmFxX3Byb2R1Y3RfcXVhbGl0eSdcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSB0aOG7nWkgZ2lhbiBnaWFvIGjDoG5nXHJcbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGjhuqNuIGjhu5NpIGNobyBjw6J1IGjhu49pXHJcbiAqL1xyXG5jb25zdCBoYW5kbGVTaGlwcGluZ1RpbWUgPSAoKSA9PiB7XHJcbiAgY29uc3QgbWVzc2FnZSA9IGBUaOG7nWkgZ2lhbiBnaWFvIGjDoG5nOlxyXG5cclxuTuG7mWkgdGjDoG5oIEPhuqduIFRoxqE6XHJcbi0gR2lhbyBow6BuZyBuaGFuaDogMi00IGdp4budICjEkcahbiBow6BuZyDEkeG6t3QgdHLGsOG7m2MgMTY6MDApXHJcbi0gR2lhbyBow6BuZyB0acOqdSBjaHXhuqluOiAxLTIgbmfDoHkgbMOgbSB2aeG7h2NcclxuXHJcbkPDoWMgdOG7iW5oIHRow6BuaCBraMOhYzpcclxuLSBLaHUgduG7sWMgbWnhu4FuIE5hbTogMi0zIG5nw6B5IGzDoG0gdmnhu4djXHJcbi0gS2h1IHbhu7FjIG1p4buBbiBUcnVuZzogMy01IG5nw6B5IGzDoG0gdmnhu4djXHJcbi0gS2h1IHbhu7FjIG1p4buBbiBC4bqvYzogMy01IG5nw6B5IGzDoG0gdmnhu4djXHJcbi0gS2h1IHbhu7FjIG1p4buBbiBuw7ppIHbDoCBo4bqjaSDEkeG6o286IDUtNyBuZ8OgeSBsw6BtIHZp4buHY1xyXG5cclxuTMawdSDDvTogVGjhu51pIGdpYW4gY8OzIHRo4buDIHRoYXkgxJHhu5VpIGRvIMSRaeG7gXUga2nhu4duIHRo4budaSB0aeG6v3QgaG/hurdjIHPhu7Ega2nhu4duIMSR4bq3YyBiaeG7h3QuIMSQxqFuIGjDoG5nIMSRxrDhu6NjIGdpYW8gdOG7qyA4OjAwLTIxOjAwIGjDoG5nIG5nw6B5LmA7XHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICB0eXBlOiAndGV4dCcsXHJcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxyXG4gICAgaW50ZW50OiAnZmFxX3NoaXBwaW5nX3RpbWUnXHJcbiAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBY4butIGzDvSBjw6J1IGjhu49pIHbhu4EgY2jDrW5oIHPDoWNoIMSR4buVaSB0cuG6o1xyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaSBjaG8gY8OidSBo4buPaVxyXG4gKi9cclxuY29uc3QgaGFuZGxlUmV0dXJuUG9saWN5ID0gKCkgPT4ge1xyXG4gIGNvbnN0IG1lc3NhZ2UgPSBgQ2jDrW5oIHPDoWNoIMSR4buVaSB0cuG6oyBz4bqjbiBwaOG6qW06XHJcblxyXG7EkGnhu4F1IGtp4buHbiDEkeG7lWkgdHLhuqM6XHJcbi0gU+G6o24gcGjhuqltIGPDsm4gbmd1ecOqbiB24bq5biwgY2jGsGEgbeG7nyBzZWFsL2JhbyBiw6xcclxuLSBT4bqjbiBwaOG6qW0ga2jDtG5nIMSRw7puZyBtw7QgdOG6oywga2jDtG5nIMSRw7puZyBjaOG7p25nIGxv4bqhaVxyXG4tIFPhuqNuIHBo4bqpbSBi4buLIGzhu5dpIGRvIHbhuq1uIGNodXnhu4NuIGhv4bq3YyBuaMOgIHPhuqNuIHh14bqldFxyXG4tIFPhuqNuIHBo4bqpbSBjw7JuIHRyb25nIHRo4budaSBo4bqhbiBz4butIGThu6VuZ1xyXG5cclxuVGjhu51pIGjhuqFuIMSR4buVaSB0cuG6ozpcclxuLSBUaOG7sWMgcGjhuqltIHTGsMahaSBz4buRbmc6IHRyb25nIHbDsm5nIDI0IGdp4budXHJcbi0gU+G6o24gcGjhuqltIMSRw7NuZyBnw7NpOiB0cm9uZyB2w7JuZyAzIG5nw6B5XHJcbi0gU+G6o24gcGjhuqltIMSR4buTIGtow7QsIGdpYSBk4bulbmc6IHRyb25nIHbDsm5nIDcgbmfDoHlcclxuXHJcbkxpw6puIGjhu4cgxJHhu5VpIHRy4bqjOiAwMzI2IDc0MzM5MSBob+G6t2Mga2l0MTAwMTIwMDNAZ21haWwuY29tYDtcclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgc3VjY2VzczogdHJ1ZSxcclxuICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXHJcbiAgICBpbnRlbnQ6ICdmYXFfcmV0dXJuX3BvbGljeSdcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSBraHV54bq/biBtw6NpIGhp4buHbiBjw7NcclxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2kgY2hvIGPDonUgaOG7j2lcclxuICovXHJcbmNvbnN0IGhhbmRsZVByb21vdGlvbnMgPSAoKSA9PiB7XHJcbiAgY29uc3QgbWVzc2FnZSA9IGBDaMawxqFuZyB0csOsbmgga2h1eeG6v24gbcOjaSBoaeG7h24gdOG6oWk6XHJcblxyXG4xLiDGr3UgxJHDo2kgbcO5YSBs4buFIGjhu5lpICgxNS8xMS0zMS8xMik6XHJcbi0gR2nhuqNtIDEwJSBjaG8gdOG6pXQgY+G6oyBz4bqjbiBwaOG6qW0gXCLEkOG7kyB14buRbmdcIlxyXG4tIE11YSAyIHThurduZyAxIGNobyBjw6FjIHPhuqNuIHBo4bqpbSBiw6FuaCBr4bq5b1xyXG5cclxuMi4gQ2jGsMahbmcgdHLDrG5oIHTDrWNoIMSRaeG7g206XHJcbi0gVMOtY2ggMSDEkWnhu4NtIGNobyBt4buXaSAxMCwwMDDEkSBjaGkgdGnDqnVcclxuLSDEkOG7lWkgMTAwIMSRaeG7g20gPSBWb3VjaGVyIDUwLDAwMMSRXHJcblxyXG4zLiDGr3UgxJHDo2kgZ2lhbyBow6BuZzpcclxuLSBNaeG7hW4gcGjDrSBnaWFvIGjDoG5nIGNobyDEkcahbiB04burIDIwMCwwMDDEkVxyXG4tIEdp4bqjbSA1MCUgcGjDrSBnaWFvIGjDoG5nIGNobyDEkcahbiB04burIDEwMCwwMDDEkSDEkeG6v24gMTk5LDk5OcSRXHJcblxyXG40LiBNw6MgZ2nhuqNtIGdpw6E6XHJcbi0gV0VMQ09NRTogR2nhuqNtIDMwLDAwMMSRIGNobyDEkcahbiBow6BuZyDEkeG6p3UgdGnDqm5cclxuLSBGUkVFU0hJUDogTWnhu4VuIHBow60gZ2lhbyBow6BuZyAoxJHhur9uIDMxLzEyKWA7XHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICB0eXBlOiAndGV4dCcsXHJcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxyXG4gICAgaW50ZW50OiAnZmFxX3Byb21vdGlvbnMnXHJcbiAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBY4butIGzDvSBjw6J1IGjhu49pIHbhu4Egc+G6o24gcGjhuqltIG3hu5tpL2LDoW4gY2jhuqF5XHJcbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGjhuqNuIGjhu5NpIGNobyBjw6J1IGjhu49pXHJcbiAqL1xyXG5jb25zdCBoYW5kbGVUcmVuZGluZ1Byb2R1Y3RzID0gKCkgPT4ge1xyXG4gIGNvbnN0IG1lc3NhZ2UgPSBgU+G6o24gcGjhuqltIG3hu5tpIHbDoCBiw6FuIGNo4bqheTpcclxuXHJcblPhuqNuIHBo4bqpbSBt4bubaTpcclxuMS4gTsaw4bubYyDDqXAgdHLDoWkgY8OieSBo4buvdSBjxqEgbmd1ecOqbiBjaOG6pXQgKG5oaeG7gXUgaMawxqFuZyB24buLKVxyXG4yLiBUcsOgIHRo4bqjbyBt4buZYyBkZXRveCBuaOG6rXAga2jhuql1IHThu6sgSMOgbiBRdeG7kWNcclxuMy4gQsOhbmggxINuIGtpw6puZyBraMO0bmcgxJHGsOG7nW5nLCDDrXQgY2FyYlxyXG40LiBDw6FjIGxv4bqhaSBo4bqhdCBkaW5oIGTGsOG7oW5nIG1peCBz4bq1blxyXG5cclxuU+G6o24gcGjhuqltIGLDoW4gY2jhuqF5IG5o4bqldDpcclxuMS4gTsaw4bubYyB0xrDGoW5nIGjhu691IGPGoSB0aMaw4bujbmcgaOG6oW5nXHJcbjIuIELDoW5oIGfhuqFvIEjDoG4gUXXhu5FjIHbhu4sgdOG6o28gYmnhu4NuXHJcbjMuIFPhu69hIGNodWEgSHkgTOG6oXAgY2FvIMSR4bqhbVxyXG40LiBOZ8WpIGPhu5FjIGRpbmggZMaw4buhbmcgxINuIHPDoW5nXHJcbjUuIE7GsOG7m2MgZ2nhurd0IHNpbmggaOG7jWMgdGjDom4gdGhp4buHbiBtw7RpIHRyxrDhu51uZ2A7XHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICB0eXBlOiAndGV4dCcsXHJcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxyXG4gICAgaW50ZW50OiAnZmFxX3RyZW5kaW5nX3Byb2R1Y3RzJ1xyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogWOG7rSBsw70gY8OidSBo4buPaSB24buBIHBow60gduG6rW4gY2h1eeG7g25cclxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2kgY2hvIGPDonUgaOG7j2lcclxuICovXHJcbmNvbnN0IGhhbmRsZVNoaXBwaW5nRmVlID0gKCkgPT4ge1xyXG4gIGNvbnN0IG1lc3NhZ2UgPSBgUGjDrSB24bqtbiBjaHV54buDbjpcclxuXHJcbktodSB24buxYyBu4buZaSB0aMOgbmggSENNLCBIw6AgTuG7mWk6XHJcbi0gxJDGoW4gZMaw4bubaSAxMDAsMDAwxJE6IDE1LDAwMMSRXHJcbi0gxJDGoW4gdOG7qyAxMDAsMDAwxJEgxJHhur9uIDE5OSw5OTnEkTogMTAsMDAwxJFcclxuLSDEkMahbiB04burIDIwMCwwMDDEkSB0cuG7nyBsw6puOiBNaeG7hW4gcGjDrVxyXG5cclxuS2h1IHbhu7FjIG5nb+G6oWkgdGjDoG5oIHbDoCB04buJbmggdGjDoG5oIGtow6FjOlxyXG4tIMSQxqFuIGTGsOG7m2kgMjAwLDAwMMSROiAzMCwwMDDEkVxyXG4tIMSQxqFuIHThu6sgMjAwLDAwMMSRIMSR4bq/biA0OTksOTk5xJE6IDIwLDAwMMSRXHJcbi0gxJDGoW4gdOG7qyA1MDAsMDAwxJEgdHLhu58gbMOqbjogTWnhu4VuIHBow61cclxuXHJcbktodSB24buxYyBtaeG7gW4gbsO6aSB2w6AgaOG6o2kgxJHhuqNvOlxyXG4tIFBow60gduG6rW4gY2h1eeG7g24gdMOtbmggZOG7sWEgdHLDqm4ga2hv4bqjbmcgY8OhY2ggdsOgIHRy4buNbmcgbMaw4bujbmcgxJHGoW4gaMOgbmdcclxuXHJcblBow60gduG6rW4gY2h1eeG7g24gc+G6vSBoaeG7g24gdGjhu4sgY2jDrW5oIHjDoWMga2hpIGLhuqFuIG5o4bqtcCDEkeG7i2EgY2jhu4kgZ2lhbyBow6BuZy5gO1xyXG4gIFxyXG4gIHJldHVybiB7XHJcbiAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgdHlwZTogJ3RleHQnLFxyXG4gICAgbWVzc2FnZTogbWVzc2FnZSxcclxuICAgIGludGVudDogJ2ZhcV9zaGlwcGluZ19mZWUnXHJcbiAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBY4butIGzDvSBjw6J1IGjhu49pIHbhu4EgaOG7lyB0cuG7oyBraMOhY2ggaMOgbmdcclxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2kgY2hvIGPDonUgaOG7j2lcclxuICovXHJcbmNvbnN0IGhhbmRsZUN1c3RvbWVyU3VwcG9ydCA9ICgpID0+IHtcclxuICBjb25zdCBtZXNzYWdlID0gYFRow7RuZyB0aW4gaOG7lyB0cuG7oyBraMOhY2ggaMOgbmc6XHJcblxyXG5Ib3RsaW5lOiAwMzI2IDc0MzM5MSAoODowMC0yMTowMCBow6BuZyBuZ8OgeSlcclxuRW1haWwgaOG7lyB0cuG7ozoga2l0MTAwMTIwMDNAZ21haWwuY29tXHJcbkZhbnBhZ2U6IGZhY2Vib29rLmNvbS90emtpdDI3XHJcblphbG86IDAzMjY3NDMzOTFcclxuQ2hhdCB0cuG7sWMgdHV54bq/bjogR8OzYyBwaOG6o2kgbcOgbiBow6xuaCB3ZWJzaXRlXHJcbsSQ4buLYSBjaOG7iTogVHLGsOG7nW5nIMSQSCBOYW0gQ+G6p24gVGjGoSwgTmd1eeG7hW4gVsSDbiBD4burIG7hu5FpIGTDoGksIEPhuqduIFRoxqFcclxuXHJcbsSQ4buZaSBuZ8WpIG5ow6JuIHZpw6puIHTGsCB24bqlbiBsdcO0biBz4bq1biBzw6BuZyBo4buXIHRy4bujIGLhuqFuIG3hu41pIHRo4bqvYyBt4bqvYyB24buBIHPhuqNuIHBo4bqpbSB2w6AgxJHGoW4gaMOgbmcuYDtcclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgc3VjY2VzczogdHJ1ZSxcclxuICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXHJcbiAgICBpbnRlbnQ6ICdmYXFfY3VzdG9tZXJfc3VwcG9ydCdcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSBjaMawxqFuZyB0csOsbmggdGjDoG5oIHZpw6puXHJcbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGjhuqNuIGjhu5NpIGNobyBjw6J1IGjhu49pXHJcbiAqL1xyXG5jb25zdCBoYW5kbGVNZW1iZXJzaGlwID0gKCkgPT4ge1xyXG4gIGNvbnN0IG1lc3NhZ2UgPSBgQ2jGsMahbmcgdHLDrG5oIHRow6BuaCB2acOqbjpcclxuXHJcbkPhuqVwIMSR4buZIHRow6BuaCB2acOqbjpcclxuMS4gVGjDoG5oIHZpw6puIELhuqFjOiBDaGkgdGnDqnUgMSwwMDAsMDAwxJEgdHJvbmcgMyB0aMOhbmdcclxuICAgLSBHaeG6o20gMyUgdOG6pXQgY+G6oyDEkcahbiBow6BuZ1xyXG4gICAtIFTDrWNoIMSRaeG7g20geDEuMlxyXG4gICAtIMavdSB0acOqbiBnaWFvIGjDoG5nXHJcblxyXG4yLiBUaMOgbmggdmnDqm4gVsOgbmc6IENoaSB0acOqdSAzLDAwMCwwMDDEkSB0cm9uZyAzIHRow6FuZ1xyXG4gICAtIEdp4bqjbSA1JSB04bqldCBj4bqjIMSRxqFuIGjDoG5nXHJcbiAgIC0gVMOtY2ggxJFp4buDbSB4MS41XHJcbiAgIC0gTWnhu4VuIHBow60gZ2lhbyBow6BuZyBraMO0bmcgZ2nhu5tpIGjhuqFuXHJcbiAgIC0gUXXDoCBzaW5oIG5o4bqtdFxyXG5cclxuMy4gVGjDoG5oIHZpw6puIEtpbSBDxrDGoW5nOiBDaGkgdGnDqnUgNywwMDAsMDAwxJEgdHJvbmcgMyB0aMOhbmdcclxuICAgLSBHaeG6o20gNyUgdOG6pXQgY+G6oyDEkcahbiBow6BuZ1xyXG4gICAtIFTDrWNoIMSRaeG7g20geDJcclxuICAgLSBNaeG7hW4gcGjDrSBnaWFvIGjDoG5nIGtow7RuZyBnaeG7m2kgaOG6oW5cclxuICAgLSBRdcOgIHNpbmggbmjhuq10IGNhbyBj4bqlcFxyXG4gICAtIFTGsCB24bqlbiB2acOqbiByacOqbmdcclxuXHJcbsSQxINuZyBrw70gdGjDoG5oIHZpw6puIG1p4buFbiBwaMOtIHThuqFpIHF14bqneSBob+G6t2Mgd2Vic2l0ZS5gO1xyXG4gIFxyXG4gIHJldHVybiB7XHJcbiAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgdHlwZTogJ3RleHQnLFxyXG4gICAgbWVzc2FnZTogbWVzc2FnZSxcclxuICAgIGludGVudDogJ2ZhcV9tZW1iZXJzaGlwJ1xyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogWOG7rSBsw70gY8OidSBo4buPaSB24buBIHPhuqNuIHBo4bqpbSBo4buvdSBjxqFcclxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2kgY2hvIGPDonUgaOG7j2lcclxuICovXHJcbmNvbnN0IGhhbmRsZU9yZ2FuaWNQcm9kdWN0cyA9ICgpID0+IHtcclxuICBjb25zdCBtZXNzYWdlID0gYFPhuqNuIHBo4bqpbSBo4buvdSBjxqE6XHJcblxyXG5DaMO6bmcgdMO0aSBjdW5nIGPhuqVwIMSRYSBk4bqhbmcgc+G6o24gcGjhuqltIGjhu691IGPGoSDEkcaw4bujYyBjaOG7qW5nIG5o4bqtbiBiYW8gZ+G7k206XHJcblxyXG4xLiBSYXUgY+G7pyBxdeG6oyBo4buvdSBjxqE6XHJcbiAgIC0gUmF1IHhhbmggY8OhYyBsb+G6oWkgKGPhuqNpLCB4w6AgbMOhY2gsIHJhdSBtdeG7kW5nLi4uKVxyXG4gICAtIEPhu6cgcXXhuqMgKGPDoCBy4buRdCwga2hvYWkgdMOieSwgY8OgIGNodWEuLi4pXHJcbiAgIC0gVHLDoWkgY8OieSAoY2FtLCB0w6FvLCBsw6osIGNodeG7kWkuLi4pXHJcblxyXG4yLiBH4bqhbyB2w6AgbmfFqSBj4buRYyBo4buvdSBjxqE6XHJcbiAgIC0gR+G6oW8gbOG7qXQsIGfhuqFvIHRy4bqvbmcgaOG7r3UgY8ahXHJcbiAgIC0gTmfFqSBj4buRYyBuZ3V5w6puIGjhuqF0XHJcbiAgIC0gWeG6v24gbeG6oWNoLCBo4bqhdCBjaGlhXHJcblxyXG4zLiBUaOG7sWMgcGjhuqltIGtow7QgaOG7r3UgY8ahOlxyXG4gICAtIMSQ4bqtdSB2w6AgY8OhYyBsb+G6oWkgaOG6oXRcclxuICAgLSBC4buZdCBtw6wsIGLhu5l0IGfhuqFvXHJcbiAgIC0gVHLDoCB2w6AgY8OgIHBow6ogaOG7r3UgY8ahXHJcblxyXG5UacOqdSBjaHXhuqluIGjhu691IGPGoTpcclxuLSBDYW5oIHTDoWMga2jDtG5nIHPhu60gZOG7pW5nIGjDs2EgY2jhuqV0LCB0aHXhu5FjIHRy4burIHPDonVcclxuLSBLaMO0bmcgYmnhur9uIMSR4buVaSBnZW4gKE5vbi1HTU8pXHJcbi0gxJDGsOG7o2MgY2jhu6luZyBuaOG6rW4gYuG7n2kgY8OhYyB04buVIGNo4bupYyB1eSB0w61uXHJcbi0gxJDhuqNtIGLhuqNvIHF1eSB0csOsbmggdOG7qyBuw7RuZyB0cuG6oWkgxJHhur9uIGLDoG4gxINuYDtcclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgc3VjY2VzczogdHJ1ZSxcclxuICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXHJcbiAgICBpbnRlbnQ6ICdmYXFfb3JnYW5pY19wcm9kdWN0cydcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSBjw6FjIGzhu7FhIGNo4buNbiBjaG8gY2jhur8gxJHhu5kgxINuIMSR4bq3YyBiaeG7h3RcclxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2kgY2hvIGPDonUgaOG7j2lcclxuICovXHJcbmNvbnN0IGhhbmRsZURpZXRhcnlPcHRpb25zID0gKCkgPT4ge1xyXG4gIGNvbnN0IG1lc3NhZ2UgPSBgQ8OhYyBs4buxYSBjaOG7jW4gY2hvIGNo4bq/IMSR4buZIMSDbiDEkeG6t2MgYmnhu4d0OlxyXG5cclxuMS4gU+G6o24gcGjhuqltIGNobyBuZ8aw4budaSDEg24gY2hheS90aHXhuqduIGNoYXk6XHJcbiAgIC0gVGjhu7FjIHBo4bqpbSBjaGF5IMSRw7RuZyBs4bqhbmhcclxuICAgLSBT4buvYSB0aOG7sWMgduG6rXQgKMSR4bqtdSBuw6BuaCwgaOG6oW5oIG5ow6JuLCB54bq/biBt4bqhY2gpXHJcbiAgIC0gxJDhuq11IGjFqSB2w6AgdGVtcGVoXHJcbiAgIC0gVGjhu4t0IHRo4buxYyB24bqtdFxyXG5cclxuMi4gU+G6o24gcGjhuqltIGtow7RuZyBnbHV0ZW46XHJcbiAgIC0gQsOhbmggbcOsIGtow7RuZyBnbHV0ZW5cclxuICAgLSBNw6wgdsOgIHBhc3RhIHThu6sgZ+G6oW8sIG5nw7RcclxuICAgLSBC4buZdCBsw6BtIGLDoW5oIGtow7RuZyBnbHV0ZW5cclxuICAgLSBOZ8WpIGPhu5FjIGtow7RuZyBnbHV0ZW5cclxuXHJcbjMuIFPhuqNuIHBo4bqpbSDDrXQgxJHGsOG7nW5nL2tow7RuZyDEkcaw4budbmc6XHJcbiAgIC0gU+G7r2EgY2h1YSBraMO0bmcgxJHGsOG7nW5nXHJcbiAgIC0gxJDhu5MgdeG7kW5nIGtow7RuZyDEkcaw4budbmdcclxuICAgLSBCw6FuaCBr4bq5byB24bubaSBjaOG6pXQgbMOgbSBuZ+G7jXQgdOG7sSBuaGnDqm5cclxuXHJcbjQuIFPhuqNuIHBo4bqpbSBsb3ctY2FyYi9rZXRvOlxyXG4gICAtIFRo4buxYyBwaOG6qW0gZ2nDoHUgY2jhuqV0IGLDqW8gbMOgbmggbeG6oW5oXHJcbiAgIC0gQuG7mXQgbMOgbSBiw6FuaCBrZXRvXHJcbiAgIC0gxJDhu5MgxINuIG5o4bq5IGxvdy1jYXJiXHJcbiAgIC0gVGjhu7FjIHBo4bqpbSBi4buVIHN1bmdcclxuXHJcbkPDoWMgc+G6o24gcGjhuqltIMSR4buBdSDEkcaw4bujYyBn4bqvbiBuaMOjbiByw7UgcsOgbmcgdsOgIGLhuqFuIGPDsyB0aOG7gyBs4buNYyB0w6xtIHRoZW8gbG/huqFpIGNo4bq/IMSR4buZIMSDbiB0csOqbiB3ZWJzaXRlLmA7XHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICB0eXBlOiAndGV4dCcsXHJcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxyXG4gICAgaW50ZW50OiAnZmFxX2RpZXRhcnlfb3B0aW9ucydcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSBk4buLY2ggduG7pSBxdcOgIHThurduZ1xyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaSBjaG8gY8OidSBo4buPaVxyXG4gKi9cclxuY29uc3QgaGFuZGxlR2lmdFNlcnZpY2VzID0gKCkgPT4ge1xyXG4gIGNvbnN0IG1lc3NhZ2UgPSBgROG7i2NoIHbhu6UgcXXDoCB04bq3bmc6XHJcblxyXG4xLiBHaeG7jyBxdcOgIHThurduZzpcclxuICAgLSBHaeG7jyBxdcOgIHPhu6ljIGto4buPZSAodOG7qyAzMDAsMDAwxJEgxJHhur9uIDIsMDAwLDAwMMSRKVxyXG4gICAtIEdp4buPIHF1w6AgdHLDoWkgY8OieSBjYW8gY+G6pXAgKHThu6sgNDAwLDAwMMSRIMSR4bq/biAxLDUwMCwwMDDEkSlcclxuICAgLSBHaeG7jyBxdcOgIMSR4bq3YyBz4bqjbiB2w7luZyBtaeG7gW4gKHThu6sgNTAwLDAwMMSRIMSR4bq/biAyLDUwMCwwMDDEkSlcclxuICAgLSBHaeG7jyBxdcOgIGRvYW5oIG5naGnhu4dwICh0w7l5IGNo4buJbmggdGhlbyBuZ8OibiBzw6FjaClcclxuXHJcbjIuIFRo4bq7IHF1w6AgdOG6t25nOlxyXG4gICAtIFRo4bq7IHF1w6AgdOG6t25nIMSRaeG7h24gdOG7rSAoZ+G7rWkgcXVhIGVtYWlsKVxyXG4gICAtIFRo4bq7IHF1w6AgdOG6t25nIHbhuq10IGzDvSAodGhp4bq/dCBr4bq/IMSR4bq5cCBt4bqvdClcclxuICAgLSBHacOhIHRy4buLIHThu6sgMTAwLDAwMMSRIMSR4bq/biA1LDAwMCwwMDDEkVxyXG4gICAtIFRo4budaSBo4bqhbiBz4butIGThu6VuZyAxIG7Eg21cclxuXHJcbjMuIEThu4tjaCB24bulIGfDs2kgcXXDoDpcclxuICAgLSBHw7NpIHF1w6AgY8ahIGLhuqNuOiAyMCwwMDDEkVxyXG4gICAtIEfDs2kgcXXDoCBjYW8gY+G6pXA6IDUwLDAwMMSRICho4buZcCBzYW5nIHRy4buNbmcsIHRoaeG7h3ApXHJcbiAgIC0gR8OzaSBxdcOgIMSR4bq3YyBiaeG7h3Q6IDEwMCwwMDDEkSAoaOG7mXAgZ+G7lywgdGhp4buHcCB0aOG7pyBjw7RuZylcclxuXHJcbjQuIMSQaeG7gXUgY2jhu4luaCB0aGVvIHnDqnUgY+G6p3U6XHJcbiAgIC0gVMO5eSBjaOG7iW5oIG7hu5lpIGR1bmcgZ2nhu48gcXXDoFxyXG4gICAtIFRoaeG7h3AgY2jDumMgbeG7q25nIGPDoSBuaMOibiBow7NhXHJcbiAgIC0gR2lhbyBow6BuZyDEkcO6bmcgbmfDoHkgxJHhurdjIGJp4buHdFxyXG5cclxuxJDhurd0IGjDoG5nIHRyxrDhu5tjIDIgbmfDoHkgxJHhu4MgxJHhuqNtIGLhuqNvIGNodeG6qW4gYuG7iyDEkeG6p3kgxJHhu6cuYDtcclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgc3VjY2VzczogdHJ1ZSxcclxuICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXHJcbiAgICBpbnRlbnQ6ICdmYXFfZ2lmdF9zZXJ2aWNlcydcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSDEkcahbiBow6BuZyBz4buRIGzGsOG7o25nIGzhu5tuXHJcbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGjhuqNuIGjhu5NpIGNobyBjw6J1IGjhu49pXHJcbiAqL1xyXG5jb25zdCBoYW5kbGVCdWxrT3JkZXJzID0gKCkgPT4ge1xyXG4gIGNvbnN0IG1lc3NhZ2UgPSBgxJDGoW4gaMOgbmcgc+G7kSBsxrDhu6NuZyBs4bubbjpcclxuXHJcbjEuIMSQ4buRaSB0xrDhu6NuZyDDoXAgZOG7pW5nOlxyXG4gICAtIE5ow6AgaMOgbmcsIHF1w6FuIMSDbiwgcXXDoW4gY2Fmw6lcclxuICAgLSBDw7RuZyB0eSwgdsSDbiBwaMOybmcsIGPGoSBxdWFuXHJcbiAgIC0gVHLGsOG7nW5nIGjhu41jLCBi4buHbmggdmnhu4duXHJcbiAgIC0gU+G7sSBraeG7h24sIGjhu5lpIG5naOG7i1xyXG5cclxuMi4gxq91IMSRw6NpIMSR4bq3YyBiaeG7h3Q6XHJcbiAgIC0gR2nhuqNtIDUlIGNobyDEkcahbiBow6BuZyB04burIDIsMDAwLDAwMMSRXHJcbiAgIC0gR2nhuqNtIDclIGNobyDEkcahbiBow6BuZyB04burIDUsMDAwLDAwMMSRXHJcbiAgIC0gR2nhuqNtIDEwJSBjaG8gxJHGoW4gaMOgbmcgdOG7qyAxMCwwMDAsMDAwxJFcclxuICAgLSBNaeG7hW4gcGjDrSB24bqtbiBjaHV54buDbiBjaG8gbeG7jWkgxJHGoW4gaMOgbmcgc+G7kSBsxrDhu6NuZyBs4bubblxyXG5cclxuMy4gROG7i2NoIHbhu6UgxJFpIGvDqG06XHJcbiAgIC0gVMawIHbhuqVuIGzhu7FhIGNo4buNbiBz4bqjbiBwaOG6qW0gcGjDuSBo4bujcFxyXG4gICAtIELDoW8gZ2nDoSBuaGFuaCB0cm9uZyB2w7JuZyAyIGdp4budXHJcbiAgIC0gSOG7lyB0cuG7oyB4deG6pXQgaMOzYSDEkcahbiBWQVRcclxuICAgLSBHaWFvIGjDoG5nIMSRw7puZyBo4bq5biwga2nhu4NtIHRyYSBjaOG6pXQgbMaw4bujbmdcclxuXHJcbjQuIFF1eSB0csOsbmggxJHhurd0IGjDoG5nOlxyXG4gICAtIExpw6puIGjhu4cgMDMyNiA3NDMzOTEgaG/hurdjIGVtYWlsIGtpdDEwMDEyMDAzQGdtYWlsLmNvbVxyXG4gICAtIEN1bmcgY+G6pXAgZGFuaCBzw6FjaCBz4bqjbiBwaOG6qW0gdsOgIHPhu5EgbMaw4bujbmdcclxuICAgLSBOaOG6rW4gYsOhbyBnacOhIHbDoCB4w6FjIG5o4bqtbiDEkcahbiBow6BuZ1xyXG4gICAtIFRo4buRbmcgbmjhuqV0IHRo4budaSBnaWFuIGdpYW8gaMOgbmdcclxuXHJcblZ1aSBsw7JuZyDEkeG6t3QgdHLGsOG7m2Mgw610IG5o4bqldCAzLTUgbmfDoHkgduG7m2kgxJHGoW4gaMOgbmcgbOG7m24uYDtcclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgc3VjY2VzczogdHJ1ZSxcclxuICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXHJcbiAgICBpbnRlbnQ6ICdmYXFfYnVsa19vcmRlcnMnXHJcbiAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBY4butIGzDvSBjw6J1IGjhu49pIHbhu4Egdmnhu4djIGNoYXRib3QgY8OzIHRo4buDIGdpw7pwIGfDrFxyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaSBjaG8gY8OidSBo4buPaVxyXG4gKi9cclxuY29uc3QgaGFuZGxlQ2hhdGJvdEhlbHAgPSAoKSA9PiB7XHJcbiAgY29uc3QgbWVzc2FnZSA9IGBUw7RpIGPDsyB0aOG7gyBnacO6cCBi4bqhbiB0w6xtIHPhuqNuIHBo4bqpbSwga2nhu4NtIHRyYSDEkcahbiBow6BuZywgZ2nhuqNpIMSRw6FwIGNow61uaCBzw6FjaCBnaWFvIGjDoG5nIOKAkyB0aGFuaCB0b8OhbiDigJMgxJHhu5VpIHRy4bqjLmA7XHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICB0eXBlOiAndGV4dCcsXHJcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxyXG4gICAgaW50ZW50OiAnZmFxX2NoYXRib3RfaGVscCdcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kga2hpIGtow7RuZyB0w6xtIHRo4bqleSBz4bqjbiBwaOG6qW1cclxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2kgY2hvIGPDonUgaOG7j2lcclxuICovXHJcbmNvbnN0IGhhbmRsZVByb2R1Y3ROb3RGb3VuZCA9ICgpID0+IHtcclxuICBjb25zdCBtZXNzYWdlID0gYELhuqFuIGjDo3kgdGjhu60gbmjhuq1wIHTDqm4gc+G6o24gcGjhuqltIGtow6FjIGhv4bq3YyBtw7QgdOG6oyBjaGkgdGnhur90IGjGoW4uIE7hur91IHbhuqtuIGtow7RuZyBjw7MsIGLhuqFuIGPDsyB0aOG7gyBn4butaSB5w6p1IGPhuqd1IMSR4bq3dCBow6BuZyByacOqbmcuYDtcclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgc3VjY2VzczogdHJ1ZSxcclxuICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXHJcbiAgICBpbnRlbnQ6ICdmYXFfcHJvZHVjdF9ub3RfZm91bmQnXHJcbiAgfTtcclxufTsiXSwibWFwcGluZ3MiOiJrSkFBQTtBQUNBO0FB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O0VBRTdGLE9BQU87SUFDTEYsT0FBTyxFQUFFLElBQUk7SUFDYkMsSUFBSSxFQUFFLE1BQU07SUFDWkMsT0FBTyxFQUFFQSxPQUFPO0lBQ2hCbEMsTUFBTSxFQUFFO0VBQ1YsQ0FBQztBQUNILENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNNEIsa0JBQWtCLEdBQUdBLENBQUEsS0FBTTtFQUMvQixNQUFNTSxPQUFPLEdBQUc7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtEQUFrRDs7RUFFaEQsT0FBTztJQUNMRixPQUFPLEVBQUUsSUFBSTtJQUNiQyxJQUFJLEVBQUUsTUFBTTtJQUNaQyxPQUFPLEVBQUVBLE9BQU87SUFDaEJsQyxNQUFNLEVBQUU7RUFDVixDQUFDO0FBQ0gsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU02QixnQkFBZ0IsR0FBR0EsQ0FBQSxLQUFNO0VBQzdCLE1BQU1LLE9BQU8sR0FBRztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNEQUFzRDs7RUFFcEQsT0FBTztJQUNMRixPQUFPLEVBQUUsSUFBSTtJQUNiQyxJQUFJLEVBQUUsTUFBTTtJQUNaQyxPQUFPLEVBQUVBLE9BQU87SUFDaEJsQyxNQUFNLEVBQUU7RUFDVixDQUFDO0FBQ0gsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU04QixpQkFBaUIsR0FBR0EsQ0FBQSxLQUFNO0VBQzlCLE1BQU1JLE9BQU8sR0FBRyw0R0FBNEc7O0VBRTVILE9BQU87SUFDTEYsT0FBTyxFQUFFLElBQUk7SUFDYkMsSUFBSSxFQUFFLE1BQU07SUFDWkMsT0FBTyxFQUFFQSxPQUFPO0lBQ2hCbEMsTUFBTSxFQUFFO0VBQ1YsQ0FBQztBQUNILENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNK0IscUJBQXFCLEdBQUdBLENBQUEsS0FBTTtFQUNsQyxNQUFNRyxPQUFPLEdBQUcsc0hBQXNIOztFQUV0SSxPQUFPO0lBQ0xGLE9BQU8sRUFBRSxJQUFJO0lBQ2JDLElBQUksRUFBRSxNQUFNO0lBQ1pDLE9BQU8sRUFBRUEsT0FBTztJQUNoQmxDLE1BQU0sRUFBRTtFQUNWLENBQUM7QUFDSCxDQUFDIiwiaWdub3JlTGlzdCI6W119