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
    const priority = intentPriority[intent] || 1;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJpbnRlbnRLZXl3b3JkcyIsImludGVudFByaW9yaXR5IiwiZGV0ZWN0SW50ZW50RnJvbUtleXdvcmRzIiwicXVlcnkiLCJub3JtYWxpemVkUXVlcnkiLCJ0b0xvd2VyQ2FzZSIsImNvbnNvbGUiLCJsb2ciLCJpbnRlbnQiLCJrZXl3b3JkcyIsIk9iamVjdCIsImVudHJpZXMiLCJwcmlvcml0eSIsImtleXdvcmQiLCJyZXBsYWNlIiwic2NvcmVzIiwiYmVzdE1hdGNoIiwiaGlnaGVzdFNjb3JlIiwibGVuZ3RoIiwiaW5jbHVkZXMiLCJleHBvcnRzIiwiaGFuZGxlRkFRUXVlc3Rpb24iLCJoYW5kbGVIb3dUb0J1eSIsImhhbmRsZUhvd1RvT3JkZXIiLCJoYW5kbGVQYXltZW50TWV0aG9kcyIsImhhbmRsZVN0b3JlTG9jYXRpb24iLCJoYW5kbGVQcm9kdWN0UXVhbGl0eSIsImhhbmRsZVNoaXBwaW5nVGltZSIsImhhbmRsZVJldHVyblBvbGljeSIsImhhbmRsZVByb21vdGlvbnMiLCJoYW5kbGVUcmVuZGluZ1Byb2R1Y3RzIiwiaGFuZGxlU2hpcHBpbmdGZWUiLCJoYW5kbGVDdXN0b21lclN1cHBvcnQiLCJoYW5kbGVNZW1iZXJzaGlwIiwiaGFuZGxlT3JnYW5pY1Byb2R1Y3RzIiwiaGFuZGxlRGlldGFyeU9wdGlvbnMiLCJoYW5kbGVHaWZ0U2VydmljZXMiLCJoYW5kbGVCdWxrT3JkZXJzIiwiaGFuZGxlQ2hhdGJvdEhlbHAiLCJoYW5kbGVQcm9kdWN0Tm90Rm91bmQiLCJzdWNjZXNzIiwidHlwZSIsIm1lc3NhZ2UiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvQ29udHJvbGxlci9jaGF0Ym90RkFRSGFuZGxlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogSOG7hyB0aOG7kW5nIHjhu60gbMO9IGPDonUgaOG7j2kgdGjGsOG7nW5nIGfhurdwIChGQVEpXHJcbiAqIEZpbGUgbsOgeSBjaOG7qWEgY8OhYyBow6BtIMSR4buDIHRy4bqjIGzhu51pIGPDoWMgY8OidSBo4buPaSBjaHVuZyB24buBIGPhu61hIGjDoG5nLCBjaMOtbmggc8OhY2gsIHbDoCBk4buLY2ggduG7pVxyXG4gKi9cclxuXHJcbi8vIMSQ4buLbmggbmdoxKlhIHThu6sga2jDs2EgY2hvIG3hu5dpIGludGVudCDEkeG7gyB0xINuZyDEkeG7mSBjaMOtbmggeMOhYyBraGkgbmjhuq1uIGRp4buHbiBjw6J1IGjhu49pXHJcbmNvbnN0IGludGVudEtleXdvcmRzID0ge1xyXG4gICdmYXFfaG93X3RvX2J1eSc6IFsnbXVhIGjDoG5nJywgJ211YSBz4bqjbiBwaOG6qW0nLCAnY8OhY2ggbXVhJywgJ211YSBuaMawIHRo4bq/IG7DoG8nLCAnbMOgbSBzYW8gxJHhu4MgbXVhJywgJ8SR4bq3dCBtdWEnLCAnbXVhIG5oxrAgbsOgbycsICdtdWEg4bufIMSRw6J1J10sXHJcbiAgJ2ZhcV9ob3dfdG9fb3JkZXInOiBbJ8SR4bq3dCBow6BuZycsICdvcmRlcicsICdjw6FjaCDEkeG6t3QnLCAnY8OhYyBixrDhu5tjIMSR4bq3dCBow6BuZycsICdoxrDhu5tuZyBk4bqrbiDEkeG6t3QgaMOgbmcnLCAnbMOgbSBzYW8gxJHhu4MgxJHhurd0JywgJ8SR4bq3dCBuaMawIHRo4bq/IG7DoG8nXSxcclxuICAnZmFxX3BheW1lbnRfbWV0aG9kcyc6IFsndGhhbmggdG/DoW4nLCAndHLhuqMgdGnhu4FuJywgJ3BoxrDGoW5nIHRo4bupYyB0aGFuaCB0b8OhbicsICdjw6FjaCB0aGFuaCB0b8OhbicsICdjaHV54buDbiBraG/huqNuJywgJ3Rp4buBbiBt4bq3dCcsICd0aOG6uyB0w61uIGThu6VuZycsICdjb2QnLCAndHLhuqMgZ8OzcCcsICd2aXNhJywgJ21hc3RlcmNhcmQnLCAnYXRtJywgJ2jDrG5oIHRo4bupYyB0aGFuaCB0b8OhbiddLFxyXG4gICdmYXFfc3RvcmVfbG9jYXRpb24nOiBbJ8SR4buLYSBjaOG7iScsICdj4butYSBow6BuZycsICdjaOG7lyBiw6FuJywgJ2PGoSBz4bufJywgJ2NoaSBuaMOhbmgnLCAnduG7iyB0csOtJywgJ27GoWkgYsOhbicsICfhu58gxJHDonUnLCAnc2hvcCDhu58gxJHDonUnLCAnY+G7rWEgaMOgbmcg4bufIMSRw6J1JywgJ2No4buXIG7DoG8nXSxcclxuICAnZmFxX3Byb2R1Y3RfcXVhbGl0eSc6IFsnY2jhuqV0IGzGsOG7o25nJywgJ3PhuqNuIHBo4bqpbScsICfEkeG6o20gYuG6o28nLCAnxJHhu5kgYW4gdG/DoG4nLCAnaOG6oW4gc+G7rSBk4bulbmcnLCAnY2jhu6luZyBuaOG6rW4nLCAna2nhu4NtIMSR4buLbmgnLCAnY2FtIGvhur90JywgJ2LhuqNvIMSR4bqjbScsICdjaOG6pXQgbMaw4bujbmcgbmjGsCB0aOG6vyBuw6BvJywgJ25ndeG7k24gZ+G7kWMnLCAneHXhuqV0IHjhu6knXSxcclxuICAnZmFxX3NoaXBwaW5nX3RpbWUnOiBbJ2dpYW8gaMOgbmcnLCAnduG6rW4gY2h1eeG7g24nLCAndGjhu51pIGdpYW4gZ2lhbycsICdiYW8gbMOidScsICdt4bqleSBuZ8OgeScsICduaOG6rW4gaMOgbmcnLCAnc2hpcCcsICdraGkgbsOgbyBuaOG6rW4gxJHGsOG7o2MnLCAnZ2lhbyB0cm9uZyBiYW8gbMOidScsICdnaWFvIG5oYW5oIGtow7RuZyddLFxyXG4gICdmYXFfcmV0dXJuX3BvbGljeSc6IFsnxJHhu5VpIHRy4bqjJywgJ2hvw6BuIHRp4buBbicsICd0cuG6oyBs4bqhaScsICdraMO0bmcgxrBuZycsICfEkeG7lWkgc+G6o24gcGjhuqltJywgJ2Now61uaCBzw6FjaCDEkeG7lWknLCAnYuG6o28gaMOgbmgnLCAna2jDtG5nIHbhu6thIMO9JywgJ2tow7RuZyB0aMOtY2gnLCAnbOG7l2knLCAnaMawIGjhu49uZycsICdrw6ltIGNo4bqldCBsxrDhu6NuZycsICfEkeG7lWkgaMOgbmcnXSxcclxuICAnZmFxX3Byb21vdGlvbnMnOiBbJ2todXnhur9uIG3Do2knLCAnZ2nhuqNtIGdpw6EnLCAnxrB1IMSRw6NpJywgJ3NhbGUnLCAncXXDoCB04bq3bmcga8OobScsICdtw6MgZ2nhuqNtIGdpw6EnLCAndm91Y2hlcicsICdjb3Vwb24nLCAnY8OzIMawdSDEkcOjaScsICfEkWFuZyBnaeG6o20gZ2nDoScsICdzYWxlIG9mZicsICdjw7Mga2h1eeG6v24gbcOjaSBraMO0bmcnLCAnxrB1IMSRw6NpIGfDrCddLFxyXG4gICdmYXFfdHJlbmRpbmdfcHJvZHVjdHMnOiBbJ3PhuqNuIHBo4bqpbSBob3QnLCAnYsOhbiBjaOG6oXknLCAneHUgaMaw4bubbmcnLCAnbeG7m2kgbmjhuqV0JywgJ3Bo4buVIGJp4bq/bicsICduaGnhu4F1IG5nxrDhu51pIG11YScsICd0cmVuZCcsICdu4buVaSBi4bqtdCcsICdz4bqjbiBwaOG6qW0gbeG7m2knLCAnaMOgbmcgaG90JywgJ2jDoG5nIG3hu5tpIHbhu4EnLCAnc+G6o24gcGjhuqltIHBo4buVIGJp4bq/biddLFxyXG4gICdmYXFfc2hpcHBpbmdfZmVlJzogWydwaMOtIHbhuq1uIGNodXnhu4NuJywgJ3Bow60gZ2lhbyBow6BuZycsICdzaGlwJywgJ2ZyZWVzaGlwJywgJ21p4buFbiBwaMOtIGdpYW8nLCAnZ2nDoSBzaGlwJywgJ3Rp4buBbiBzaGlwJywgJ3Thu5FuIHBow60nLCAnbeG6pXQgcGjDrScsICdjaGkgcGjDrSBnaWFvJywgJ2ZyZWUgc2hpcCcsICdnaWFvIG1p4buFbiBwaMOtJywgJ3Bow60gc2hpcCddLFxyXG4gICdmYXFfY3VzdG9tZXJfc3VwcG9ydCc6IFsnaOG7lyB0cuG7oycsICd0xrAgduG6pW4nLCAnbGnDqm4gaOG7hycsICdnacO6cCDEkeG7oScsICdob3RsaW5lJywgJ3Phu5EgxJFp4buHbiB0aG/huqFpJywgJ25ow6JuIHZpw6puJywgJ2NoxINtIHPDs2MnLCAndOG7lW5nIMSRw6BpJywgJ3phbG8nLCAnZmFjZWJvb2snLCAnZW1haWwnXSxcclxuICAnZmFxX21lbWJlcnNoaXAnOiBbJ3Row6BuaCB2acOqbicsICdraMOhY2ggaMOgbmcgdGjDom4gdGhp4bq/dCcsICdtZW1iZXJzaGlwJywgJ2jhu5lpIHZpw6puJywgJ3TDrWNoIMSRaeG7g20nLCAnxrB1IMSRw6NpIHRow6BuaCB2acOqbicsICd2aXAnLCAnxJFp4buDbSB0aMaw4bufbmcnLCAnY2jGsMahbmcgdHLDrG5oIHRow6BuaCB2acOqbicsICdxdXnhu4FuIGzhu6NpJywgJ8SRxINuZyBrw70gdGjDoG5oIHZpw6puJ10sXHJcbiAgJ2ZhcV9vcmdhbmljX3Byb2R1Y3RzJzogWydo4buvdSBjxqEnLCAnb3JnYW5pYycsICd04buxIG5oacOqbicsICdraMO0bmcgaMOzYSBjaOG6pXQnLCAnc+G6oWNoJywgJ2FuIHRvw6BuJywgJ3NpbmggaOG7jWMnLCAna2jDtG5nIHRodeG7kWMgdHLhu6sgc8OidScsICdraMO0bmcgcGjDom4gYsOzbicsICdz4bqjbiBwaOG6qW0gaOG7r3UgY8ahJywgJ3Ro4buxYyBwaOG6qW0gc+G6oWNoJywgJ3hhbmgnLCAnZWNvJ10sXHJcbiAgJ2ZhcV9kaWV0YXJ5X29wdGlvbnMnOiBbJ8SDbiBracOqbmcnLCAnY2hheScsICd0aHXhuqduIGNoYXknLCAndmVnYW4nLCAna2V0bycsICdsb3ctY2FyYicsICdnbHV0ZW4tZnJlZScsICdraMO0bmcgxJHGsOG7nW5nJywgJ8OtdCDEkcaw4budbmcnLCAna2jDtG5nIGxhY3Rvc2UnLCAnxINuIGNoYXknLCAnxJHhu5MgY2hheScsICdraMO0bmcgdGluaCBi4buZdCcsICfDrXQgbXXhu5FpJywgJ8OtdCBiw6lvJ10sXHJcbiAgJ2ZhcV9naWZ0X3NlcnZpY2VzJzogWydxdcOgIHThurduZycsICdnw7NpIHF1w6AnLCAnZ2nhu48gcXXDoCcsICd0aOG6uyBxdcOgIHThurduZycsICdnaWZ0IGNhcmQnLCAnZ+G7rWkgcXXDoCcsICdxdcOgIGJp4bq/dScsICdxdcOgIHNpbmggbmjhuq10JywgJ2Thu4tjaCB24bulIHF1w6AnLCAnZ+G7rWkgcXXDoCB04bq3bmcnLCAnY8OzIGThu4tjaCB24bulIGfDs2kgcXXDoCBraMO0bmcnLCAnbMOgbSBo4buZcCBxdcOgJ10sXHJcbiAgJ2ZhcV9idWxrX29yZGVycyc6IFsnxJHGoW4gaMOgbmcgbOG7m24nLCAnbXVhIHPhu5EgbMaw4bujbmcgbmhp4buBdScsICdtdWEgc+G7iScsICfEkeG6t3QgaMOgbmcgc+G7kSBsxrDhu6NuZyBs4bubbicsICdkb2FuaCBuZ2hp4buHcCcsICdjw7RuZyB0eSDEkeG6t3QgaMOgbmcnLCAnc+G7kSBsxrDhu6NuZyBs4bubbicsICdtdWEgbmhp4buBdScsICdnacOhIHPhu4knLCAnZ2nhuqNtIGdpw6Ega2hpIG11YSBuaGnhu4F1JywgJ8SRxqFuIMSRb8OgbicsICdtdWEgaMOgbmcgbG/huqF0JywgJ211YSB24bubaSBz4buRIGzGsOG7o25nIGzhu5tuJywgJ8SRxqFuIGjDoG5nIHPhu5EgbMaw4bujbmcgbOG7m24nLCAnxJHGoW4gc+G7kSBsxrDhu6NuZyBs4bubbiddLFxyXG4gICdmYXFfY2hhdGJvdF9oZWxwJzogWydjaGF0Ym90IGPDsyB0aOG7gyBnacO6cCBnw6wgY2hvIHTDtGknLCAnY2hhdGJvdCBnacO6cCBnw6wgY2hvIHTDtGknLCAnY2hhdGJvdCBnacO6cCBnw6wnLCAnY2hhdGJvdCBjw7MgdGjhu4MgZ2nDunAgZ8OsJywgJ2NoYXRib3QgaOG7lyB0cuG7oycsICdib3QgY8OzIHRo4buDIGzDoG0gZ8OsJywgJ2NoYXRib3QgbMOgbSDEkcaw4bujYyBnw6wnLCAndHLhu6MgbMO9IOG6o28nLCAnYm90IGdpw7pwIMSRxrDhu6NjIGfDrCcsICdib3QgaOG7lyB0cuG7oyBnw6wnLCAnY2hhdGJvdCBjw7MgdMOtbmggbsSDbmcgZ8OsJywgJ3dlYnNpdGUgaOG7lyB0cuG7oycsICd0w61uaCBuxINuZyBjaGF0Ym90JywgJ3TDrW5oIG7Eg25nIHdlYnNpdGUnLCAnaOG7hyB0aOG7kW5nIGjhu5cgdHLhu6MnLCAnY2hhdGJvdCBsw6BtIGfDrCddLFxyXG4gICdmYXFfcHJvZHVjdF9ub3RfZm91bmQnOiBbJ2tow7RuZyB0w6xtIHRo4bqleSBz4bqjbiBwaOG6qW0nLCAndMOsbSBraMO0bmcgcmEnLCAna2jDtG5nIGPDsyBz4bqjbiBwaOG6qW0nLCAnc+G6o24gcGjhuqltIGtow7RuZyBjw7MnLCAna2jDtG5nIHRo4bqleSBow6BuZycsICdraMO0bmcgdMOsbSDEkcaw4bujYycsICdz4bqjbiBwaOG6qW0ga2jDtG5nIGhp4buDbiB0aOG7iycsICdraMO0bmcgdGjhuqV5IHPhuqNuIHBo4bqpbScsICd0w6xtIHPhuqNuIHBo4bqpbScsICd0w6xtIGtp4bq/bSBz4bqjbiBwaOG6qW0nLCAndMOsbSBraMO0bmcgdGjhuqV5J11cclxufTtcclxuXHJcbi8vIMSQw6FuaCBnacOhIG3hu6ljIMSR4buZIMawdSB0acOqbiBjaG8gdOG7q25nIGxv4bqhaSBpbnRlbnRcclxuY29uc3QgaW50ZW50UHJpb3JpdHkgPSB7XHJcbiAgJ2ZhcV9idWxrX29yZGVycyc6IDMsXHJcbiAgJ2ZhcV9vcmdhbmljX3Byb2R1Y3RzJzogMyxcclxuICAnZmFxX2dpZnRfc2VydmljZXMnOiAzLFxyXG4gICdmYXFfY2hhdGJvdF9oZWxwJzogMyxcclxuICAnZmFxX3Byb21vdGlvbnMnOiAyLFxyXG4gICdmYXFfcGF5bWVudF9tZXRob2RzJzogMixcclxuICAnZmFxX3NoaXBwaW5nX2ZlZSc6IDIsXHJcbiAgJ2ZhcV9zaGlwcGluZ190aW1lJzogMixcclxuICAnZmFxX3JldHVybl9wb2xpY3knOiAyLFxyXG4gICdmYXFfZGlldGFyeV9vcHRpb25zJzogMixcclxuICAnZmFxX3Byb2R1Y3Rfbm90X2ZvdW5kJzogMixcclxuICAnZmFxX2hvd190b19idXknOiAxLFxyXG4gICdmYXFfaG93X3RvX29yZGVyJzogMSxcclxuICAnZmFxX3N0b3JlX2xvY2F0aW9uJzogMSxcclxuICAnZmFxX3Byb2R1Y3RfcXVhbGl0eSc6IDEsXHJcbiAgJ2ZhcV90cmVuZGluZ19wcm9kdWN0cyc6IDEsXHJcbiAgJ2ZhcV9jdXN0b21lcl9zdXBwb3J0JzogMSxcclxuICAnZmFxX21lbWJlcnNoaXAnOiAxXHJcbn07XHJcblxyXG4vKipcclxuICogUGjDoXQgaGnhu4duIGludGVudCBk4buxYSB0csOqbiB04burIGtow7NhIHRyb25nIGPDonUgaOG7j2lcclxuICogQHBhcmFtIHtzdHJpbmd9IHF1ZXJ5IC0gQ8OidSBo4buPaSBj4bunYSBuZ8aw4budaSBkw7luZ1xyXG4gKiBAcmV0dXJucyB7c3RyaW5nfG51bGx9IC0gSW50ZW50IHBow6F0IGhp4buHbiDEkcaw4bujYyBob+G6t2MgbnVsbCBu4bq/dSBraMO0bmcgdMOsbSB0aOG6pXlcclxuICovXHJcbmV4cG9ydCBjb25zdCBkZXRlY3RJbnRlbnRGcm9tS2V5d29yZHMgPSAocXVlcnkpID0+IHtcclxuICBpZiAoIXF1ZXJ5KSByZXR1cm4gbnVsbDtcclxuICBcclxuICAvLyBDaHV54buDbiBjw6J1IGjhu49pIHRow6BuaCBjaOG7ryB0aMaw4budbmcgxJHhu4Mgc28gc8OhbmggZOG7hSBkw6BuZyBoxqFuXHJcbiAgY29uc3Qgbm9ybWFsaXplZFF1ZXJ5ID0gcXVlcnkudG9Mb3dlckNhc2UoKTtcclxuICBjb25zb2xlLmxvZyhgTm9ybWFsaXplZCBRdWVyeTogXCIke25vcm1hbGl6ZWRRdWVyeX1cImApO1xyXG4gIFxyXG4gIC8vIEtp4buDbSB0cmEga2jhu5twIGNow61uaCB4w6FjIHbhu5tpIGPDonUgaOG7j2lcclxuICBmb3IgKGNvbnN0IFtpbnRlbnQsIGtleXdvcmRzXSBvZiBPYmplY3QuZW50cmllcyhpbnRlbnRLZXl3b3JkcykpIHtcclxuICAgIGNvbnN0IHByaW9yaXR5ID0gaW50ZW50UHJpb3JpdHlbaW50ZW50XSB8fCAxO1xyXG4gICAgZm9yIChjb25zdCBrZXl3b3JkIG9mIGtleXdvcmRzKSB7XHJcbiAgICAgIC8vIE7hur91IGPDonUgaOG7j2kga2jhu5twIGNow61uaCB4w6FjIHbhu5tpIHThu6sga2jDs2FcclxuICAgICAgaWYgKG5vcm1hbGl6ZWRRdWVyeSA9PT0ga2V5d29yZC50b0xvd2VyQ2FzZSgpIHx8IFxyXG4gICAgICAgICAgbm9ybWFsaXplZFF1ZXJ5LnJlcGxhY2UoL1s/LiwhXS9nLCAnJykgPT09IGtleXdvcmQudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBFeGFjdCBtYXRjaCBmb3VuZCBmb3IgaW50ZW50OiAke2ludGVudH0sIGtleXdvcmQ6IFwiJHtrZXl3b3JkfVwiYCk7XHJcbiAgICAgICAgcmV0dXJuIGludGVudDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICBcclxuICAvLyDEkGnhu4NtIHPhu5EgY2hvIG3hu5dpIGludGVudFxyXG4gIGNvbnN0IHNjb3JlcyA9IHt9O1xyXG4gIGxldCBiZXN0TWF0Y2ggPSBudWxsO1xyXG4gIGxldCBoaWdoZXN0U2NvcmUgPSAwO1xyXG4gIFxyXG4gIC8vIEtp4buDbSB0cmEga2jhu5twIG3hu5l0IHBo4bqnbiB24bubaSB04burIGtow7NhXHJcbiAgZm9yIChjb25zdCBbaW50ZW50LCBrZXl3b3Jkc10gb2YgT2JqZWN0LmVudHJpZXMoaW50ZW50S2V5d29yZHMpKSB7XHJcbiAgICBjb25zdCBwcmlvcml0eSA9IGludGVudFByaW9yaXR5W2ludGVudF0gfHwgMTtcclxuICAgIHNjb3Jlc1tpbnRlbnRdID0gMDtcclxuICAgIFxyXG4gICAgZm9yIChjb25zdCBrZXl3b3JkIG9mIGtleXdvcmRzKSB7XHJcbiAgICAgIC8vIEtp4buDbSB0cmEgdOG7qyBraMOzYSBkw6BpIHRyb25nIGPDonUgaOG7j2lcclxuICAgICAgaWYgKGtleXdvcmQubGVuZ3RoID4gMTAgJiYgbm9ybWFsaXplZFF1ZXJ5LmluY2x1ZGVzKGtleXdvcmQudG9Mb3dlckNhc2UoKSkpIHtcclxuICAgICAgICBzY29yZXNbaW50ZW50XSArPSBrZXl3b3JkLmxlbmd0aCAqIDIgKiBwcmlvcml0eTtcclxuICAgICAgICBjb25zb2xlLmxvZyhgTG9uZyBrZXl3b3JkIG1hdGNoOiBcIiR7a2V5d29yZH1cIiBmb3IgaW50ZW50ICR7aW50ZW50fSwgc2NvcmUgKyR7a2V5d29yZC5sZW5ndGggKiAyICogcHJpb3JpdHl9YCk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gVOG7qyBraMOzYSBuZ+G6r24gY2jhu4kgdMOtbmggbuG6v3UgbMOgIHThu6sgcmnDqm5nIGJp4buHdCB0cm9uZyBjw6J1XHJcbiAgICAgIGVsc2UgaWYgKG5vcm1hbGl6ZWRRdWVyeS5pbmNsdWRlcyhrZXl3b3JkLnRvTG93ZXJDYXNlKCkpKSB7XHJcbiAgICAgICAgc2NvcmVzW2ludGVudF0gKz0ga2V5d29yZC5sZW5ndGggKiBwcmlvcml0eTtcclxuICAgICAgICBjb25zb2xlLmxvZyhgS2V5d29yZCBtYXRjaDogXCIke2tleXdvcmR9XCIgZm9yIGludGVudCAke2ludGVudH0sIHNjb3JlICske2tleXdvcmQubGVuZ3RoICogcHJpb3JpdHl9YCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gQ+G6rXAgbmjhuq10IGludGVudCBjw7MgxJFp4buDbSBjYW8gbmjhuqV0XHJcbiAgICBpZiAoc2NvcmVzW2ludGVudF0gPiBoaWdoZXN0U2NvcmUpIHtcclxuICAgICAgaGlnaGVzdFNjb3JlID0gc2NvcmVzW2ludGVudF07XHJcbiAgICAgIGJlc3RNYXRjaCA9IGludGVudDtcclxuICAgIH1cclxuICB9XHJcbiAgXHJcbiAgY29uc29sZS5sb2coYEJlc3QgbWF0Y2hpbmcgaW50ZW50OiAke2Jlc3RNYXRjaH0sIHNjb3JlOiAke2hpZ2hlc3RTY29yZX1gKTtcclxuICAvLyBUcuG6oyB24buBIGludGVudCBwaMO5IGjhu6NwIG5o4bqldCBu4bq/dSDEkWnhu4NtIMSR4bunIGNhb1xyXG4gIHJldHVybiBoaWdoZXN0U2NvcmUgPiAwID8gYmVzdE1hdGNoIDogbnVsbDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBY4butIGzDvSBjw6J1IGjhu49pIHThu6sgbmfGsOG7nWkgZMO5bmcgZOG7sWEgdHLDqm4gbG/huqFpIGludGVudCDEkcOjIHBow6F0IGhp4buHblxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaW50ZW50IC0gSW50ZW50IMSRxrDhu6NjIHBow6F0IGhp4buHbiB04burIGPDonUgaOG7j2lcclxuICogQHBhcmFtIHtzdHJpbmd9IHF1ZXJ5IC0gQ8OidSBo4buPaSBn4buRYyBj4bunYSBuZ8aw4budaSBkw7luZ1xyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaSBjaG8gY8OidSBo4buPaVxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IGhhbmRsZUZBUVF1ZXN0aW9uID0gKGludGVudCwgcXVlcnkgPSBcIlwiKSA9PiB7XHJcbiAgY29uc29sZS5sb2coYFjhu60gbMO9IGPDonUgaOG7j2kgRkFRIHbhu5tpIGludGVudDogJHtpbnRlbnR9YCk7XHJcbiAgXHJcbiAgLy8gTuG6v3Uga2jDtG5nIGPDsyBpbnRlbnQgxJHGsOG7o2MgY3VuZyBj4bqlcCwgdGjhu60gcGjDoXQgaGnhu4duIHThu6sgY8OidSBo4buPaVxyXG4gIGlmICghaW50ZW50ICYmIHF1ZXJ5KSB7XHJcbiAgICBpbnRlbnQgPSBkZXRlY3RJbnRlbnRGcm9tS2V5d29yZHMocXVlcnkpO1xyXG4gICAgY29uc29sZS5sb2coYFBow6F0IGhp4buHbiBpbnRlbnQgdOG7qyBjw6J1IGjhu49pOiAke2ludGVudH1gKTtcclxuICB9XHJcbiAgXHJcbiAgLy8gxJDhu4tuaCB0dXnhur9uIMSR4bq/biBow6BtIHjhu60gbMO9IHTGsMahbmcg4bupbmcgduG7m2kgaW50ZW50XHJcbiAgc3dpdGNoIChpbnRlbnQpIHtcclxuICAgIGNhc2UgJ2ZhcV9ob3dfdG9fYnV5JzpcclxuICAgICAgcmV0dXJuIGhhbmRsZUhvd1RvQnV5KCk7XHJcbiAgICBjYXNlICdmYXFfaG93X3RvX29yZGVyJzpcclxuICAgICAgcmV0dXJuIGhhbmRsZUhvd1RvT3JkZXIoKTtcclxuICAgIGNhc2UgJ2ZhcV9wYXltZW50X21ldGhvZHMnOlxyXG4gICAgICByZXR1cm4gaGFuZGxlUGF5bWVudE1ldGhvZHMoKTtcclxuICAgIGNhc2UgJ2ZhcV9zdG9yZV9sb2NhdGlvbic6XHJcbiAgICAgIHJldHVybiBoYW5kbGVTdG9yZUxvY2F0aW9uKCk7XHJcbiAgICBjYXNlICdmYXFfcHJvZHVjdF9xdWFsaXR5JzpcclxuICAgICAgcmV0dXJuIGhhbmRsZVByb2R1Y3RRdWFsaXR5KCk7XHJcbiAgICBjYXNlICdmYXFfc2hpcHBpbmdfdGltZSc6XHJcbiAgICAgIHJldHVybiBoYW5kbGVTaGlwcGluZ1RpbWUoKTtcclxuICAgIGNhc2UgJ2ZhcV9yZXR1cm5fcG9saWN5JzpcclxuICAgICAgcmV0dXJuIGhhbmRsZVJldHVyblBvbGljeSgpO1xyXG4gICAgY2FzZSAnZmFxX3Byb21vdGlvbnMnOlxyXG4gICAgICByZXR1cm4gaGFuZGxlUHJvbW90aW9ucygpO1xyXG4gICAgY2FzZSAnZmFxX3RyZW5kaW5nX3Byb2R1Y3RzJzpcclxuICAgICAgcmV0dXJuIGhhbmRsZVRyZW5kaW5nUHJvZHVjdHMoKTtcclxuICAgIGNhc2UgJ2ZhcV9zaGlwcGluZ19mZWUnOlxyXG4gICAgICByZXR1cm4gaGFuZGxlU2hpcHBpbmdGZWUoKTtcclxuICAgIGNhc2UgJ2ZhcV9jdXN0b21lcl9zdXBwb3J0JzpcclxuICAgICAgcmV0dXJuIGhhbmRsZUN1c3RvbWVyU3VwcG9ydCgpO1xyXG4gICAgY2FzZSAnZmFxX21lbWJlcnNoaXAnOlxyXG4gICAgICByZXR1cm4gaGFuZGxlTWVtYmVyc2hpcCgpO1xyXG4gICAgY2FzZSAnZmFxX29yZ2FuaWNfcHJvZHVjdHMnOlxyXG4gICAgICByZXR1cm4gaGFuZGxlT3JnYW5pY1Byb2R1Y3RzKCk7XHJcbiAgICBjYXNlICdmYXFfZGlldGFyeV9vcHRpb25zJzpcclxuICAgICAgcmV0dXJuIGhhbmRsZURpZXRhcnlPcHRpb25zKCk7XHJcbiAgICBjYXNlICdmYXFfZ2lmdF9zZXJ2aWNlcyc6XHJcbiAgICAgIHJldHVybiBoYW5kbGVHaWZ0U2VydmljZXMoKTtcclxuICAgIGNhc2UgJ2ZhcV9idWxrX29yZGVycyc6XHJcbiAgICAgIHJldHVybiBoYW5kbGVCdWxrT3JkZXJzKCk7XHJcbiAgICBjYXNlICdmYXFfY2hhdGJvdF9oZWxwJzpcclxuICAgICAgcmV0dXJuIGhhbmRsZUNoYXRib3RIZWxwKCk7XHJcbiAgICBjYXNlICdmYXFfcHJvZHVjdF9ub3RfZm91bmQnOlxyXG4gICAgICByZXR1cm4gaGFuZGxlUHJvZHVjdE5vdEZvdW5kKCk7XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiVMO0aSBraMO0bmcgdMOsbSB0aOG6pXkgdGjDtG5nIHRpbiBwaMO5IGjhu6NwIHbhu5tpIGPDonUgaOG7j2kgY+G7p2EgYuG6oW4uIFZ1aSBsw7JuZyB0aOG7rSBs4bqhaSB24bubaSBjw6J1IGjhu49pIGtow6FjIGhv4bq3YyBsacOqbiBo4buHIHRy4buxYyB0aeG6v3AgduG7m2kgYuG7mSBwaOG6rW4gaOG7lyB0cuG7oyBraMOhY2ggaMOgbmcgcXVhIHPhu5EgxJFp4buHbiB0aG/huqFpIDAzMjYgNzQzMzkxIMSR4buDIMSRxrDhu6NjIGdpw7pwIMSR4buhLlwiXHJcbiAgICAgIH07XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSBjw6FjaCBtdWEgaMOgbmdcclxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2kgY2hvIGPDonUgaOG7j2lcclxuICovXHJcbmNvbnN0IGhhbmRsZUhvd1RvQnV5ID0gKCkgPT4ge1xyXG4gIGNvbnN0IG1lc3NhZ2UgPSBgSMaw4bubbmcgZOG6q24gbXVhIGjDoG5nOlxyXG5cclxuQ8OhY2ggMTogTXVhIGjDoG5nIHRy4buxYyB0dXnhur9uXHJcbjEuIFTDrG0ga2nhur9tIHPhuqNuIHBo4bqpbSB0csOqbiB0cmFuZyB3ZWJcclxuMi4gTmjhuqVwIHbDoG8gc+G6o24gcGjhuqltIMSR4buDIHhlbSBjaGkgdGnhur90XHJcbjMuIENo4buNbiBcIlRow6ptIHbDoG8gZ2nhu48gaMOgbmdcIiBob+G6t2MgXCJNdWEgbmdheVwiXHJcbjQuIFRp4bq/biBow6BuaCDEkeG6t3QgaMOgbmcgdsOgIHRoYW5oIHRvw6FuXHJcblxyXG5Dw6FjaCAyOiBNdWEgaMOgbmcgdHLhu7FjIHRp4bq/cCB04bqhaSBj4butYSBow6BuZ1xyXG4tIMSQ4buLYSBjaOG7iTogVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBOYW0gQ+G6p24gVGjGoSwgTmd1eeG7hW4gVsSDbiBD4burIG7hu5FpIGTDoGksIEPhuqduIFRoxqFcclxuLSBUaOG7nWkgZ2lhbiBt4bufIGPhu61hOiA4OjAwIC0gMjE6MDAgbeG7l2kgbmfDoHlcclxuXHJcbkPDoWNoIDM6IMSQ4bq3dCBow6BuZyBxdWEgxJFp4buHbiB0aG/huqFpXHJcbi0gSG90bGluZTogMDMyNiA3NDMzOTFcclxuLSBOaMOibiB2acOqbiBz4bq9IGjhu5cgdHLhu6MgxJHhurd0IGjDoG5nIHbDoCBnaWFvIGjDoG5nIHThuq1uIG7GoWlgO1xyXG4gIFxyXG4gIHJldHVybiB7XHJcbiAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgdHlwZTogJ3RleHQnLFxyXG4gICAgbWVzc2FnZTogbWVzc2FnZSxcclxuICAgIGludGVudDogJ2ZhcV9ob3dfdG9fYnV5J1xyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogWOG7rSBsw70gY8OidSBo4buPaSB24buBIGPDoWNoIMSR4bq3dCBow6BuZ1xyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaSBjaG8gY8OidSBo4buPaVxyXG4gKi9cclxuY29uc3QgaGFuZGxlSG93VG9PcmRlciA9ICgpID0+IHtcclxuICBjb25zdCBtZXNzYWdlID0gYEPDoWMgYsaw4bubYyDEkeG6t3QgaMOgbmcgdHLDqm4gd2Vic2l0ZTpcclxuXHJcbjEuIFTDrG0ga2nhur9tIHPhuqNuIHBo4bqpbTogU+G7rSBk4bulbmcgdGhhbmggdMOsbSBraeG6v20gaG/hurdjIGR1eeG7h3QgcXVhIGRhbmggbeG7pWNcclxuMi4gVGjDqm0gdsOgbyBnaeG7jyBow6BuZzogTmjhuqVwIHbDoG8gbsO6dCBcIlRow6ptIHbDoG8gZ2nhu49cIiBzYXUga2hpIGNo4buNbiBz4bqjbiBwaOG6qW1cclxuMy4gS2nhu4NtIHRyYSBnaeG7jyBow6BuZzogTmjhuqVwIHbDoG8gYmnhu4N1IHTGsOG7o25nIGdp4buPIGjDoG5nIMSR4buDIHhlbSB2w6AgY2jhu4luaCBz4butYSDEkcahbiBow6BuZ1xyXG40LiBUaGFuaCB0b8OhbjogTmjhuqVwIFwiVGhhbmggdG/DoW5cIiB2w6AgxJFp4buBbiB0aMO0bmcgdGluIGdpYW8gaMOgbmdcclxuNS4gQ2jhu41uIHBoxrDGoW5nIHRo4bupYyB0aGFuaCB0b8OhbjogQ2jhu41uIGjDrG5oIHRo4bupYyB0aGFuaCB0b8OhbiBwaMO5IGjhu6NwXHJcbjYuIEhvw6BuIHThuqV0IMSRxqFuIGjDoG5nOiBYw6FjIG5o4bqtbiDEkcahbiBow6BuZyB2w6Agbmjhuq1uIG3DoyDEkcahbiBow6BuZ1xyXG5cclxuTuG6v3UgZ+G6t3Aga2jDsyBraMSDbiwgdnVpIGzDsm5nIGxpw6puIGjhu4cgaG90bGluZTogMDMyNiA3NDMzOTFgO1xyXG4gIFxyXG4gIHJldHVybiB7XHJcbiAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgdHlwZTogJ3RleHQnLFxyXG4gICAgbWVzc2FnZTogbWVzc2FnZSxcclxuICAgIGludGVudDogJ2ZhcV9ob3dfdG9fb3JkZXInXHJcbiAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBY4butIGzDvSBjw6J1IGjhu49pIHbhu4EgY8OhYyBwaMawxqFuZyB0aOG7qWMgdGhhbmggdG/DoW5cclxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2kgY2hvIGPDonUgaOG7j2lcclxuICovXHJcbmNvbnN0IGhhbmRsZVBheW1lbnRNZXRob2RzID0gKCkgPT4ge1xyXG4gIGNvbnN0IG1lc3NhZ2UgPSBgQ8OhYyBow6xuaCB0aOG7qWMgdGhhbmggdG/DoW4gxJHGsOG7o2MgY2jhuqVwIG5o4bqtbjpcclxuXHJcbjEuIFRoYW5oIHRvw6FuIGtoaSBuaOG6rW4gaMOgbmcgKENPRCk6IFRoYW5oIHRvw6FuIHRy4buxYyB0aeG6v3AgY2hvIG5ow6JuIHZpw6puIGdpYW8gaMOgbmdcclxuXHJcbjIuIENodXnhu4NuIGtob+G6o24gbmfDom4gaMOgbmc6XHJcbiAgIC0gTmfDom4gaMOgbmc6IE1CIEJhbmtcclxuICAgLSBT4buRIHTDoGkga2hv4bqjbjogMDMyNjc0MzM5MVxyXG4gICAtIENo4bunIHTDoGkga2hv4bqjbjogTkdVWUVOIFRST05HIEtISUVNXHJcbiAgIC0gTuG7mWkgZHVuZzogW03DoyDEkcahbiBow6BuZ11cclxuXHJcbjMuIFRo4bq7IHTDrW4gZOG7pW5nL2doaSBu4bujOiBNQiBCQU5LXHJcblxyXG40LiBUaGFuaCB0b8OhbiBraGkgbmjhuq1uIGjDoG5nXHJcblxyXG5DaMO6bmcgdMO0aSDEkeG6o20gYuG6o28gdGjDtG5nIHRpbiB0aGFuaCB0b8OhbiBj4bunYSBi4bqhbiDEkcaw4bujYyBi4bqjbyBt4bqtdCB2w6AgYW4gdG/DoG4uYDtcclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgc3VjY2VzczogdHJ1ZSxcclxuICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXHJcbiAgICBpbnRlbnQ6ICdmYXFfcGF5bWVudF9tZXRob2RzJ1xyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogWOG7rSBsw70gY8OidSBo4buPaSB24buBIMSR4buLYSBjaOG7iSBj4butYSBow6BuZ1xyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaSBjaG8gY8OidSBo4buPaVxyXG4gKi9cclxuY29uc3QgaGFuZGxlU3RvcmVMb2NhdGlvbiA9ICgpID0+IHtcclxuICBjb25zdCBtZXNzYWdlID0gYMSQ4buLYSBjaOG7iSBj4butYSBow6BuZzpcclxuXHJcbkPhu61hIGjDoG5nIGNow61uaDpcclxuVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBOYW0gQ+G6p24gVGjGoSwgTmd1eeG7hW4gVsSDbiBD4burIG7hu5FpIGTDoGksIEPhuqduIFRoxqEgQ2l0eVxyXG7EkGnhu4duIHRob+G6oWk6IDAzMjYgNzQzMzkxXHJcbkdp4budIG3hu58gY+G7rWE6IDg6MDAgLSAyMTowMCBow6BuZyBuZ8OgeVxyXG5cclxuQ2hpIG5ow6FuaCAxOlxyXG5Ucsaw4budbmcgxJDhuqFpIGjhu41jIE5hbSBD4bqnbiBUaMahLCBOZ3V54buFbiBWxINuIEPhu6sgbuG7kWkgZMOgaSwgQ+G6p24gVGjGoSBDaXR5XHJcbsSQaeG7h24gdGhv4bqhaTogMDMyNiA3NDMzOTFcclxuR2nhu50gbeG7nyBj4butYTogODowMCAtIDIxOjAwIGjDoG5nIG5nw6B5XHJcblxyXG5C4bqhbiBjw7MgdGjhu4MgdMOsbSDEkcaw4budbmcgxJHhur9uIGPhu61hIGjDoG5nIGLhurFuZyBjw6FjaCB0w6xtIGtp4bq/bSBcIkROQ0ZPT0RcIiB0csOqbiBHb29nbGUgTWFwcy5gO1xyXG4gIFxyXG4gIHJldHVybiB7XHJcbiAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgdHlwZTogJ3RleHQnLFxyXG4gICAgbWVzc2FnZTogbWVzc2FnZSxcclxuICAgIGludGVudDogJ2ZhcV9zdG9yZV9sb2NhdGlvbidcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSBjaOG6pXQgbMaw4bujbmcgc+G6o24gcGjhuqltXHJcbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGjhuqNuIGjhu5NpIGNobyBjw6J1IGjhu49pXHJcbiAqL1xyXG5jb25zdCBoYW5kbGVQcm9kdWN0UXVhbGl0eSA9ICgpID0+IHtcclxuICBjb25zdCBtZXNzYWdlID0gYENhbSBr4bq/dCB24buBIGNo4bqldCBsxrDhu6NuZyBz4bqjbiBwaOG6qW06XHJcblxyXG4tIFThuqV0IGPhuqMgc+G6o24gcGjhuqltIMSR4buBdSDEkcaw4bujYyBraeG7g20gc2/DoXQgY2jhuqV0IGzGsOG7o25nIG5naGnDqm0gbmfhurd0XHJcbi0gQ2jhu4kgY3VuZyBj4bqlcCBz4bqjbiBwaOG6qW0gdOG7qyBuaMOgIGN1bmcgY+G6pXAgdXkgdMOtbiwgY8OzIGdp4bqleSBjaOG7qW5nIG5o4bqtbiBhbiB0b8OgbiB0aOG7sWMgcGjhuqltXHJcbi0gxJDhu5FpIHbhu5tpIHRo4buxYyBwaOG6qW0gdMawxqFpIHPhu5FuZywgxJHhuqNtIGLhuqNvIMSR4buZIHTGsMahaSBt4bubaSBow6BuZyBuZ8OgeVxyXG4tIFThuqV0IGPhuqMgc+G6o24gcGjhuqltIGPDsyBuZ3Xhu5NuIGfhu5FjIHh14bqldCB44bupIHLDtSByw6BuZyB2w6AgZ2hpIMSR4bqneSDEkeG7pyB0csOqbiBiYW8gYsOsXHJcbi0gw4FwIGThu6VuZyBjaMOtbmggc8OhY2ggXCJIb8OgbiB0aeG7gW4gMTAwJVwiIG7hur91IHPhuqNuIHBo4bqpbSBraMO0bmcgxJHhuqF0IGNo4bqldCBsxrDhu6NuZ1xyXG4tIMSQ4buZaSBuZ8WpIGtp4buDbSDEkeG7i25oIHZpw6puIMSR4bqjbSBi4bqjbyBt4buXaSBsw7QgaMOgbmcgxJHhu4F1IMSR4bqhdCB0acOqdSBjaHXhuqluYDtcclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgc3VjY2VzczogdHJ1ZSxcclxuICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXHJcbiAgICBpbnRlbnQ6ICdmYXFfcHJvZHVjdF9xdWFsaXR5J1xyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogWOG7rSBsw70gY8OidSBo4buPaSB24buBIHRo4budaSBnaWFuIGdpYW8gaMOgbmdcclxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2kgY2hvIGPDonUgaOG7j2lcclxuICovXHJcbmNvbnN0IGhhbmRsZVNoaXBwaW5nVGltZSA9ICgpID0+IHtcclxuICBjb25zdCBtZXNzYWdlID0gYFRo4budaSBnaWFuIGdpYW8gaMOgbmc6XHJcblxyXG5O4buZaSB0aMOgbmggQ+G6p24gVGjGoTpcclxuLSBHaWFvIGjDoG5nIG5oYW5oOiAyLTQgZ2nhu50gKMSRxqFuIGjDoG5nIMSR4bq3dCB0csaw4bubYyAxNjowMClcclxuLSBHaWFvIGjDoG5nIHRpw6p1IGNodeG6qW46IDEtMiBuZ8OgeSBsw6BtIHZp4buHY1xyXG5cclxuQ8OhYyB04buJbmggdGjDoG5oIGtow6FjOlxyXG4tIEtodSB24buxYyBtaeG7gW4gTmFtOiAyLTMgbmfDoHkgbMOgbSB2aeG7h2NcclxuLSBLaHUgduG7sWMgbWnhu4FuIFRydW5nOiAzLTUgbmfDoHkgbMOgbSB2aeG7h2NcclxuLSBLaHUgduG7sWMgbWnhu4FuIELhuq9jOiAzLTUgbmfDoHkgbMOgbSB2aeG7h2NcclxuLSBLaHUgduG7sWMgbWnhu4FuIG7DumkgdsOgIGjhuqNpIMSR4bqjbzogNS03IG5nw6B5IGzDoG0gdmnhu4djXHJcblxyXG5MxrB1IMO9OiBUaOG7nWkgZ2lhbiBjw7MgdGjhu4MgdGhheSDEkeG7lWkgZG8gxJFp4buBdSBraeG7h24gdGjhu51pIHRp4bq/dCBob+G6t2Mgc+G7sSBraeG7h24gxJHhurdjIGJp4buHdC4gxJDGoW4gaMOgbmcgxJHGsOG7o2MgZ2lhbyB04burIDg6MDAtMjE6MDAgaMOgbmcgbmfDoHkuYDtcclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgc3VjY2VzczogdHJ1ZSxcclxuICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXHJcbiAgICBpbnRlbnQ6ICdmYXFfc2hpcHBpbmdfdGltZSdcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSBjaMOtbmggc8OhY2ggxJHhu5VpIHRy4bqjXHJcbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGjhuqNuIGjhu5NpIGNobyBjw6J1IGjhu49pXHJcbiAqL1xyXG5jb25zdCBoYW5kbGVSZXR1cm5Qb2xpY3kgPSAoKSA9PiB7XHJcbiAgY29uc3QgbWVzc2FnZSA9IGBDaMOtbmggc8OhY2ggxJHhu5VpIHRy4bqjIHPhuqNuIHBo4bqpbTpcclxuXHJcbsSQaeG7gXUga2nhu4duIMSR4buVaSB0cuG6ozpcclxuLSBT4bqjbiBwaOG6qW0gY8OybiBuZ3V5w6puIHbhurluLCBjaMawYSBt4bufIHNlYWwvYmFvIGLDrFxyXG4tIFPhuqNuIHBo4bqpbSBraMO0bmcgxJHDum5nIG3DtCB04bqjLCBraMO0bmcgxJHDum5nIGNo4bunbmcgbG/huqFpXHJcbi0gU+G6o24gcGjhuqltIGLhu4sgbOG7l2kgZG8gduG6rW4gY2h1eeG7g24gaG/hurdjIG5ow6Agc+G6o24geHXhuqV0XHJcbi0gU+G6o24gcGjhuqltIGPDsm4gdHJvbmcgdGjhu51pIGjhuqFuIHPhu60gZOG7pW5nXHJcblxyXG5UaOG7nWkgaOG6oW4gxJHhu5VpIHRy4bqjOlxyXG4tIFRo4buxYyBwaOG6qW0gdMawxqFpIHPhu5FuZzogdHJvbmcgdsOybmcgMjQgZ2nhu51cclxuLSBT4bqjbiBwaOG6qW0gxJHDs25nIGfDs2k6IHRyb25nIHbDsm5nIDMgbmfDoHlcclxuLSBT4bqjbiBwaOG6qW0gxJHhu5Mga2jDtCwgZ2lhIGThu6VuZzogdHJvbmcgdsOybmcgNyBuZ8OgeVxyXG5cclxuTGnDqm4gaOG7hyDEkeG7lWkgdHLhuqM6IDAzMjYgNzQzMzkxIGhv4bq3YyBraXQxMDAxMjAwM0BnbWFpbC5jb21gO1xyXG4gIFxyXG4gIHJldHVybiB7XHJcbiAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgdHlwZTogJ3RleHQnLFxyXG4gICAgbWVzc2FnZTogbWVzc2FnZSxcclxuICAgIGludGVudDogJ2ZhcV9yZXR1cm5fcG9saWN5J1xyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogWOG7rSBsw70gY8OidSBo4buPaSB24buBIGtodXnhur9uIG3Do2kgaGnhu4duIGPDs1xyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaSBjaG8gY8OidSBo4buPaVxyXG4gKi9cclxuY29uc3QgaGFuZGxlUHJvbW90aW9ucyA9ICgpID0+IHtcclxuICBjb25zdCBtZXNzYWdlID0gYENoxrDGoW5nIHRyw6xuaCBraHV54bq/biBtw6NpIGhp4buHbiB04bqhaTpcclxuXHJcbjEuIMavdSDEkcOjaSBtw7lhIGzhu4UgaOG7mWkgKDE1LzExLTMxLzEyKTpcclxuLSBHaeG6o20gMTAlIGNobyB04bqldCBj4bqjIHPhuqNuIHBo4bqpbSBcIsSQ4buTIHXhu5FuZ1wiXHJcbi0gTXVhIDIgdOG6t25nIDEgY2hvIGPDoWMgc+G6o24gcGjhuqltIGLDoW5oIGvhurlvXHJcblxyXG4yLiBDaMawxqFuZyB0csOsbmggdMOtY2ggxJFp4buDbTpcclxuLSBUw61jaCAxIMSRaeG7g20gY2hvIG3hu5dpIDEwLDAwMMSRIGNoaSB0acOqdVxyXG4tIMSQ4buVaSAxMDAgxJFp4buDbSA9IFZvdWNoZXIgNTAsMDAwxJFcclxuXHJcbjMuIMavdSDEkcOjaSBnaWFvIGjDoG5nOlxyXG4tIE1p4buFbiBwaMOtIGdpYW8gaMOgbmcgY2hvIMSRxqFuIHThu6sgMjAwLDAwMMSRXHJcbi0gR2nhuqNtIDUwJSBwaMOtIGdpYW8gaMOgbmcgY2hvIMSRxqFuIHThu6sgMTAwLDAwMMSRIMSR4bq/biAxOTksOTk5xJFcclxuXHJcbjQuIE3DoyBnaeG6o20gZ2nDoTpcclxuLSBXRUxDT01FOiBHaeG6o20gMzAsMDAwxJEgY2hvIMSRxqFuIGjDoG5nIMSR4bqndSB0acOqblxyXG4tIEZSRUVTSElQOiBNaeG7hW4gcGjDrSBnaWFvIGjDoG5nICjEkeG6v24gMzEvMTIpYDtcclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgc3VjY2VzczogdHJ1ZSxcclxuICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXHJcbiAgICBpbnRlbnQ6ICdmYXFfcHJvbW90aW9ucydcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSBz4bqjbiBwaOG6qW0gbeG7m2kvYsOhbiBjaOG6oXlcclxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2kgY2hvIGPDonUgaOG7j2lcclxuICovXHJcbmNvbnN0IGhhbmRsZVRyZW5kaW5nUHJvZHVjdHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgbWVzc2FnZSA9IGBT4bqjbiBwaOG6qW0gbeG7m2kgdsOgIGLDoW4gY2jhuqF5OlxyXG5cclxuU+G6o24gcGjhuqltIG3hu5tpOlxyXG4xLiBOxrDhu5tjIMOpcCB0csOhaSBjw6J5IGjhu691IGPGoSBuZ3V5w6puIGNo4bqldCAobmhp4buBdSBoxrDGoW5nIHbhu4spXHJcbjIuIFRyw6AgdGjhuqNvIG3hu5ljIGRldG94IG5o4bqtcCBraOG6qXUgdOG7qyBIw6BuIFF14buRY1xyXG4zLiBCw6FuaCDEg24ga2nDqm5nIGtow7RuZyDEkcaw4budbmcsIMOtdCBjYXJiXHJcbjQuIEPDoWMgbG/huqFpIGjhuqF0IGRpbmggZMaw4buhbmcgbWl4IHPhurVuXHJcblxyXG5T4bqjbiBwaOG6qW0gYsOhbiBjaOG6oXkgbmjhuqV0OlxyXG4xLiBOxrDhu5tjIHTGsMahbmcgaOG7r3UgY8ahIHRoxrDhu6NuZyBo4bqhbmdcclxuMi4gQsOhbmggZ+G6oW8gSMOgbiBRdeG7kWMgduG7iyB04bqjbyBiaeG7g25cclxuMy4gU+G7r2EgY2h1YSBIeSBM4bqhcCBjYW8gxJHhuqFtXHJcbjQuIE5nxakgY+G7kWMgZGluaCBkxrDhu6FuZyDEg24gc8OhbmdcclxuNS4gTsaw4bubYyBnaeG6t3Qgc2luaCBo4buNYyB0aMOibiB0aGnhu4duIG3DtGkgdHLGsOG7nW5nYDtcclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgc3VjY2VzczogdHJ1ZSxcclxuICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXHJcbiAgICBpbnRlbnQ6ICdmYXFfdHJlbmRpbmdfcHJvZHVjdHMnXHJcbiAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBY4butIGzDvSBjw6J1IGjhu49pIHbhu4EgcGjDrSB24bqtbiBjaHV54buDblxyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaSBjaG8gY8OidSBo4buPaVxyXG4gKi9cclxuY29uc3QgaGFuZGxlU2hpcHBpbmdGZWUgPSAoKSA9PiB7XHJcbiAgY29uc3QgbWVzc2FnZSA9IGBQaMOtIHbhuq1uIGNodXnhu4NuOlxyXG5cclxuS2h1IHbhu7FjIG7hu5lpIHRow6BuaCBIQ00sIEjDoCBO4buZaTpcclxuLSDEkMahbiBkxrDhu5tpIDEwMCwwMDDEkTogMTUsMDAwxJFcclxuLSDEkMahbiB04burIDEwMCwwMDDEkSDEkeG6v24gMTk5LDk5OcSROiAxMCwwMDDEkVxyXG4tIMSQxqFuIHThu6sgMjAwLDAwMMSRIHRy4bufIGzDqm46IE1p4buFbiBwaMOtXHJcblxyXG5LaHUgduG7sWMgbmdv4bqhaSB0aMOgbmggdsOgIHThu4luaCB0aMOgbmgga2jDoWM6XHJcbi0gxJDGoW4gZMaw4bubaSAyMDAsMDAwxJE6IDMwLDAwMMSRXHJcbi0gxJDGoW4gdOG7qyAyMDAsMDAwxJEgxJHhur9uIDQ5OSw5OTnEkTogMjAsMDAwxJFcclxuLSDEkMahbiB04burIDUwMCwwMDDEkSB0cuG7nyBsw6puOiBNaeG7hW4gcGjDrVxyXG5cclxuS2h1IHbhu7FjIG1p4buBbiBuw7ppIHbDoCBo4bqjaSDEkeG6o286XHJcbi0gUGjDrSB24bqtbiBjaHV54buDbiB0w61uaCBk4buxYSB0csOqbiBraG/huqNuZyBjw6FjaCB2w6AgdHLhu41uZyBsxrDhu6NuZyDEkcahbiBow6BuZ1xyXG5cclxuUGjDrSB24bqtbiBjaHV54buDbiBz4bq9IGhp4buDbiB0aOG7iyBjaMOtbmggeMOhYyBraGkgYuG6oW4gbmjhuq1wIMSR4buLYSBjaOG7iSBnaWFvIGjDoG5nLmA7XHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICB0eXBlOiAndGV4dCcsXHJcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxyXG4gICAgaW50ZW50OiAnZmFxX3NoaXBwaW5nX2ZlZSdcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSBo4buXIHRy4bujIGtow6FjaCBow6BuZ1xyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaSBjaG8gY8OidSBo4buPaVxyXG4gKi9cclxuY29uc3QgaGFuZGxlQ3VzdG9tZXJTdXBwb3J0ID0gKCkgPT4ge1xyXG4gIGNvbnN0IG1lc3NhZ2UgPSBgVGjDtG5nIHRpbiBo4buXIHRy4bujIGtow6FjaCBow6BuZzpcclxuXHJcbkhvdGxpbmU6IDAzMjYgNzQzMzkxICg4OjAwLTIxOjAwIGjDoG5nIG5nw6B5KVxyXG5FbWFpbCBo4buXIHRy4bujOiBraXQxMDAxMjAwM0BnbWFpbC5jb21cclxuRmFucGFnZTogZmFjZWJvb2suY29tL3R6a2l0MjdcclxuWmFsbzogMDMyNjc0MzM5MVxyXG5DaGF0IHRy4buxYyB0dXnhur9uOiBHw7NjIHBo4bqjaSBtw6BuIGjDrG5oIHdlYnNpdGVcclxuxJDhu4thIGNo4buJOiBUcsaw4budbmcgxJBIIE5hbSBD4bqnbiBUaMahLCBOZ3V54buFbiBWxINuIEPhu6sgbuG7kWkgZMOgaSwgQ+G6p24gVGjGoVxyXG5cclxuxJDhu5lpIG5nxakgbmjDom4gdmnDqm4gdMawIHbhuqVuIGx1w7RuIHPhurVuIHPDoG5nIGjhu5cgdHLhu6MgYuG6oW4gbeG7jWkgdGjhuq9jIG3huq9jIHbhu4Egc+G6o24gcGjhuqltIHbDoCDEkcahbiBow6BuZy5gO1xyXG4gIFxyXG4gIHJldHVybiB7XHJcbiAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgdHlwZTogJ3RleHQnLFxyXG4gICAgbWVzc2FnZTogbWVzc2FnZSxcclxuICAgIGludGVudDogJ2ZhcV9jdXN0b21lcl9zdXBwb3J0J1xyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogWOG7rSBsw70gY8OidSBo4buPaSB24buBIGNoxrDGoW5nIHRyw6xuaCB0aMOgbmggdmnDqm5cclxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2kgY2hvIGPDonUgaOG7j2lcclxuICovXHJcbmNvbnN0IGhhbmRsZU1lbWJlcnNoaXAgPSAoKSA9PiB7XHJcbiAgY29uc3QgbWVzc2FnZSA9IGBDaMawxqFuZyB0csOsbmggdGjDoG5oIHZpw6puOlxyXG5cclxuQ+G6pXAgxJHhu5kgdGjDoG5oIHZpw6puOlxyXG4xLiBUaMOgbmggdmnDqm4gQuG6oWM6IENoaSB0acOqdSAxLDAwMCwwMDDEkSB0cm9uZyAzIHRow6FuZ1xyXG4gICAtIEdp4bqjbSAzJSB04bqldCBj4bqjIMSRxqFuIGjDoG5nXHJcbiAgIC0gVMOtY2ggxJFp4buDbSB4MS4yXHJcbiAgIC0gxq91IHRpw6puIGdpYW8gaMOgbmdcclxuXHJcbjIuIFRow6BuaCB2acOqbiBWw6BuZzogQ2hpIHRpw6p1IDMsMDAwLDAwMMSRIHRyb25nIDMgdGjDoW5nXHJcbiAgIC0gR2nhuqNtIDUlIHThuqV0IGPhuqMgxJHGoW4gaMOgbmdcclxuICAgLSBUw61jaCDEkWnhu4NtIHgxLjVcclxuICAgLSBNaeG7hW4gcGjDrSBnaWFvIGjDoG5nIGtow7RuZyBnaeG7m2kgaOG6oW5cclxuICAgLSBRdcOgIHNpbmggbmjhuq10XHJcblxyXG4zLiBUaMOgbmggdmnDqm4gS2ltIEPGsMahbmc6IENoaSB0acOqdSA3LDAwMCwwMDDEkSB0cm9uZyAzIHRow6FuZ1xyXG4gICAtIEdp4bqjbSA3JSB04bqldCBj4bqjIMSRxqFuIGjDoG5nXHJcbiAgIC0gVMOtY2ggxJFp4buDbSB4MlxyXG4gICAtIE1p4buFbiBwaMOtIGdpYW8gaMOgbmcga2jDtG5nIGdp4bubaSBo4bqhblxyXG4gICAtIFF1w6Agc2luaCBuaOG6rXQgY2FvIGPhuqVwXHJcbiAgIC0gVMawIHbhuqVuIHZpw6puIHJpw6puZ1xyXG5cclxuxJDEg25nIGvDvSB0aMOgbmggdmnDqm4gbWnhu4VuIHBow60gdOG6oWkgcXXhuqd5IGhv4bq3YyB3ZWJzaXRlLmA7XHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICB0eXBlOiAndGV4dCcsXHJcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxyXG4gICAgaW50ZW50OiAnZmFxX21lbWJlcnNoaXAnXHJcbiAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBY4butIGzDvSBjw6J1IGjhu49pIHbhu4Egc+G6o24gcGjhuqltIGjhu691IGPGoVxyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaSBjaG8gY8OidSBo4buPaVxyXG4gKi9cclxuY29uc3QgaGFuZGxlT3JnYW5pY1Byb2R1Y3RzID0gKCkgPT4ge1xyXG4gIGNvbnN0IG1lc3NhZ2UgPSBgU+G6o24gcGjhuqltIGjhu691IGPGoTpcclxuXHJcbkNow7puZyB0w7RpIGN1bmcgY+G6pXAgxJFhIGThuqFuZyBz4bqjbiBwaOG6qW0gaOG7r3UgY8ahIMSRxrDhu6NjIGNo4bupbmcgbmjhuq1uIGJhbyBn4buTbTpcclxuXHJcbjEuIFJhdSBj4bunIHF14bqjIGjhu691IGPGoTpcclxuICAgLSBSYXUgeGFuaCBjw6FjIGxv4bqhaSAoY+G6o2ksIHjDoCBsw6FjaCwgcmF1IG114buRbmcuLi4pXHJcbiAgIC0gQ+G7pyBxdeG6oyAoY8OgIHLhu5F0LCBraG9haSB0w6J5LCBjw6AgY2h1YS4uLilcclxuICAgLSBUcsOhaSBjw6J5IChjYW0sIHTDoW8sIGzDqiwgY2h14buRaS4uLilcclxuXHJcbjIuIEfhuqFvIHbDoCBuZ8WpIGPhu5FjIGjhu691IGPGoTpcclxuICAgLSBH4bqhbyBs4bupdCwgZ+G6oW8gdHLhuq9uZyBo4buvdSBjxqFcclxuICAgLSBOZ8WpIGPhu5FjIG5ndXnDqm4gaOG6oXRcclxuICAgLSBZ4bq/biBt4bqhY2gsIGjhuqF0IGNoaWFcclxuXHJcbjMuIFRo4buxYyBwaOG6qW0ga2jDtCBo4buvdSBjxqE6XHJcbiAgIC0gxJDhuq11IHbDoCBjw6FjIGxv4bqhaSBo4bqhdFxyXG4gICAtIELhu5l0IG3DrCwgYuG7mXQgZ+G6oW9cclxuICAgLSBUcsOgIHbDoCBjw6AgcGjDqiBo4buvdSBjxqFcclxuXHJcblRpw6p1IGNodeG6qW4gaOG7r3UgY8ahOlxyXG4tIENhbmggdMOhYyBraMO0bmcgc+G7rSBk4bulbmcgaMOzYSBjaOG6pXQsIHRodeG7kWMgdHLhu6sgc8OidVxyXG4tIEtow7RuZyBiaeG6v24gxJHhu5VpIGdlbiAoTm9uLUdNTylcclxuLSDEkMaw4bujYyBjaOG7qW5nIG5o4bqtbiBi4bufaSBjw6FjIHThu5UgY2jhu6ljIHV5IHTDrW5cclxuLSDEkOG6o20gYuG6o28gcXV5IHRyw6xuaCB04burIG7DtG5nIHRy4bqhaSDEkeG6v24gYsOgbiDEg25gO1xyXG4gIFxyXG4gIHJldHVybiB7XHJcbiAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgdHlwZTogJ3RleHQnLFxyXG4gICAgbWVzc2FnZTogbWVzc2FnZSxcclxuICAgIGludGVudDogJ2ZhcV9vcmdhbmljX3Byb2R1Y3RzJ1xyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogWOG7rSBsw70gY8OidSBo4buPaSB24buBIGPDoWMgbOG7sWEgY2jhu41uIGNobyBjaOG6vyDEkeG7mSDEg24gxJHhurdjIGJp4buHdFxyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaSBjaG8gY8OidSBo4buPaVxyXG4gKi9cclxuY29uc3QgaGFuZGxlRGlldGFyeU9wdGlvbnMgPSAoKSA9PiB7XHJcbiAgY29uc3QgbWVzc2FnZSA9IGBDw6FjIGzhu7FhIGNo4buNbiBjaG8gY2jhur8gxJHhu5kgxINuIMSR4bq3YyBiaeG7h3Q6XHJcblxyXG4xLiBT4bqjbiBwaOG6qW0gY2hvIG5nxrDhu51pIMSDbiBjaGF5L3RodeG6p24gY2hheTpcclxuICAgLSBUaOG7sWMgcGjhuqltIGNoYXkgxJHDtG5nIGzhuqFuaFxyXG4gICAtIFPhu69hIHRo4buxYyB24bqtdCAoxJHhuq11IG7DoG5oLCBo4bqhbmggbmjDom4sIHnhur9uIG3huqFjaClcclxuICAgLSDEkOG6rXUgaMWpIHbDoCB0ZW1wZWhcclxuICAgLSBUaOG7i3QgdGjhu7FjIHbhuq10XHJcblxyXG4yLiBT4bqjbiBwaOG6qW0ga2jDtG5nIGdsdXRlbjpcclxuICAgLSBCw6FuaCBtw6wga2jDtG5nIGdsdXRlblxyXG4gICAtIE3DrCB2w6AgcGFzdGEgdOG7qyBn4bqhbywgbmfDtFxyXG4gICAtIELhu5l0IGzDoG0gYsOhbmgga2jDtG5nIGdsdXRlblxyXG4gICAtIE5nxakgY+G7kWMga2jDtG5nIGdsdXRlblxyXG5cclxuMy4gU+G6o24gcGjhuqltIMOtdCDEkcaw4budbmcva2jDtG5nIMSRxrDhu51uZzpcclxuICAgLSBT4buvYSBjaHVhIGtow7RuZyDEkcaw4budbmdcclxuICAgLSDEkOG7kyB14buRbmcga2jDtG5nIMSRxrDhu51uZ1xyXG4gICAtIELDoW5oIGvhurlvIHbhu5tpIGNo4bqldCBsw6BtIG5n4buNdCB04buxIG5oacOqblxyXG5cclxuNC4gU+G6o24gcGjhuqltIGxvdy1jYXJiL2tldG86XHJcbiAgIC0gVGjhu7FjIHBo4bqpbSBnacOgdSBjaOG6pXQgYsOpbyBsw6BuaCBt4bqhbmhcclxuICAgLSBC4buZdCBsw6BtIGLDoW5oIGtldG9cclxuICAgLSDEkOG7kyDEg24gbmjhurkgbG93LWNhcmJcclxuICAgLSBUaOG7sWMgcGjhuqltIGLhu5Ugc3VuZ1xyXG5cclxuQ8OhYyBz4bqjbiBwaOG6qW0gxJHhu4F1IMSRxrDhu6NjIGfhuq9uIG5ow6NuIHLDtSByw6BuZyB2w6AgYuG6oW4gY8OzIHRo4buDIGzhu41jIHTDrG0gdGhlbyBsb+G6oWkgY2jhur8gxJHhu5kgxINuIHRyw6puIHdlYnNpdGUuYDtcclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgc3VjY2VzczogdHJ1ZSxcclxuICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXHJcbiAgICBpbnRlbnQ6ICdmYXFfZGlldGFyeV9vcHRpb25zJ1xyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogWOG7rSBsw70gY8OidSBo4buPaSB24buBIGThu4tjaCB24bulIHF1w6AgdOG6t25nXHJcbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGjhuqNuIGjhu5NpIGNobyBjw6J1IGjhu49pXHJcbiAqL1xyXG5jb25zdCBoYW5kbGVHaWZ0U2VydmljZXMgPSAoKSA9PiB7XHJcbiAgY29uc3QgbWVzc2FnZSA9IGBE4buLY2ggduG7pSBxdcOgIHThurduZzpcclxuXHJcbjEuIEdp4buPIHF1w6AgdOG6t25nOlxyXG4gICAtIEdp4buPIHF1w6Agc+G7qWMga2jhu49lICh04burIDMwMCwwMDDEkSDEkeG6v24gMiwwMDAsMDAwxJEpXHJcbiAgIC0gR2nhu48gcXXDoCB0csOhaSBjw6J5IGNhbyBj4bqlcCAodOG7qyA0MDAsMDAwxJEgxJHhur9uIDEsNTAwLDAwMMSRKVxyXG4gICAtIEdp4buPIHF1w6AgxJHhurdjIHPhuqNuIHbDuW5nIG1p4buBbiAodOG7qyA1MDAsMDAwxJEgxJHhur9uIDIsNTAwLDAwMMSRKVxyXG4gICAtIEdp4buPIHF1w6AgZG9hbmggbmdoaeG7h3AgKHTDuXkgY2jhu4luaCB0aGVvIG5nw6JuIHPDoWNoKVxyXG5cclxuMi4gVGjhursgcXXDoCB04bq3bmc6XHJcbiAgIC0gVGjhursgcXXDoCB04bq3bmcgxJFp4buHbiB04butIChn4butaSBxdWEgZW1haWwpXHJcbiAgIC0gVGjhursgcXXDoCB04bq3bmcgduG6rXQgbMO9ICh0aGnhur90IGvhur8gxJHhurlwIG3huq90KVxyXG4gICAtIEdpw6EgdHLhu4sgdOG7qyAxMDAsMDAwxJEgxJHhur9uIDUsMDAwLDAwMMSRXHJcbiAgIC0gVGjhu51pIGjhuqFuIHPhu60gZOG7pW5nIDEgbsSDbVxyXG5cclxuMy4gROG7i2NoIHbhu6UgZ8OzaSBxdcOgOlxyXG4gICAtIEfDs2kgcXXDoCBjxqEgYuG6o246IDIwLDAwMMSRXHJcbiAgIC0gR8OzaSBxdcOgIGNhbyBj4bqlcDogNTAsMDAwxJEgKGjhu5lwIHNhbmcgdHLhu41uZywgdGhp4buHcClcclxuICAgLSBHw7NpIHF1w6AgxJHhurdjIGJp4buHdDogMTAwLDAwMMSRICho4buZcCBn4buXLCB0aGnhu4dwIHRo4bunIGPDtG5nKVxyXG5cclxuNC4gxJBp4buBdSBjaOG7iW5oIHRoZW8gecOqdSBj4bqndTpcclxuICAgLSBUw7l5IGNo4buJbmggbuG7mWkgZHVuZyBnaeG7jyBxdcOgXHJcbiAgIC0gVGhp4buHcCBjaMO6YyBt4burbmcgY8OhIG5ow6JuIGjDs2FcclxuICAgLSBHaWFvIGjDoG5nIMSRw7puZyBuZ8OgeSDEkeG6t2MgYmnhu4d0XHJcblxyXG7EkOG6t3QgaMOgbmcgdHLGsOG7m2MgMiBuZ8OgeSDEkeG7gyDEkeG6o20gYuG6o28gY2h14bqpbiBi4buLIMSR4bqneSDEkeG7py5gO1xyXG4gIFxyXG4gIHJldHVybiB7XHJcbiAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgdHlwZTogJ3RleHQnLFxyXG4gICAgbWVzc2FnZTogbWVzc2FnZSxcclxuICAgIGludGVudDogJ2ZhcV9naWZ0X3NlcnZpY2VzJ1xyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogWOG7rSBsw70gY8OidSBo4buPaSB24buBIMSRxqFuIGjDoG5nIHPhu5EgbMaw4bujbmcgbOG7m25cclxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2kgY2hvIGPDonUgaOG7j2lcclxuICovXHJcbmNvbnN0IGhhbmRsZUJ1bGtPcmRlcnMgPSAoKSA9PiB7XHJcbiAgY29uc3QgbWVzc2FnZSA9IGDEkMahbiBow6BuZyBz4buRIGzGsOG7o25nIGzhu5tuOlxyXG5cclxuMS4gxJDhu5FpIHTGsOG7o25nIMOhcCBk4bulbmc6XHJcbiAgIC0gTmjDoCBow6BuZywgcXXDoW4gxINuLCBxdcOhbiBjYWbDqVxyXG4gICAtIEPDtG5nIHR5LCB2xINuIHBow7JuZywgY8ahIHF1YW5cclxuICAgLSBUcsaw4budbmcgaOG7jWMsIGLhu4duaCB2aeG7h25cclxuICAgLSBT4buxIGtp4buHbiwgaOG7mWkgbmdo4buLXHJcblxyXG4yLiDGr3UgxJHDo2kgxJHhurdjIGJp4buHdDpcclxuICAgLSBHaeG6o20gNSUgY2hvIMSRxqFuIGjDoG5nIHThu6sgMiwwMDAsMDAwxJFcclxuICAgLSBHaeG6o20gNyUgY2hvIMSRxqFuIGjDoG5nIHThu6sgNSwwMDAsMDAwxJFcclxuICAgLSBHaeG6o20gMTAlIGNobyDEkcahbiBow6BuZyB04burIDEwLDAwMCwwMDDEkVxyXG4gICAtIE1p4buFbiBwaMOtIHbhuq1uIGNodXnhu4NuIGNobyBt4buNaSDEkcahbiBow6BuZyBz4buRIGzGsOG7o25nIGzhu5tuXHJcblxyXG4zLiBE4buLY2ggduG7pSDEkWkga8OobTpcclxuICAgLSBUxrAgduG6pW4gbOG7sWEgY2jhu41uIHPhuqNuIHBo4bqpbSBwaMO5IGjhu6NwXHJcbiAgIC0gQsOhbyBnacOhIG5oYW5oIHRyb25nIHbDsm5nIDIgZ2nhu51cclxuICAgLSBI4buXIHRy4bujIHh14bqldCBow7NhIMSRxqFuIFZBVFxyXG4gICAtIEdpYW8gaMOgbmcgxJHDum5nIGjhurluLCBraeG7g20gdHJhIGNo4bqldCBsxrDhu6NuZ1xyXG5cclxuNC4gUXV5IHRyw6xuaCDEkeG6t3QgaMOgbmc6XHJcbiAgIC0gTGnDqm4gaOG7hyAwMzI2IDc0MzM5MSBob+G6t2MgZW1haWwga2l0MTAwMTIwMDNAZ21haWwuY29tXHJcbiAgIC0gQ3VuZyBj4bqlcCBkYW5oIHPDoWNoIHPhuqNuIHBo4bqpbSB2w6Agc+G7kSBsxrDhu6NuZ1xyXG4gICAtIE5o4bqtbiBiw6FvIGdpw6EgdsOgIHjDoWMgbmjhuq1uIMSRxqFuIGjDoG5nXHJcbiAgIC0gVGjhu5FuZyBuaOG6pXQgdGjhu51pIGdpYW4gZ2lhbyBow6BuZ1xyXG5cclxuVnVpIGzDsm5nIMSR4bq3dCB0csaw4bubYyDDrXQgbmjhuqV0IDMtNSBuZ8OgeSB24bubaSDEkcahbiBow6BuZyBs4bubbi5gO1xyXG4gIFxyXG4gIHJldHVybiB7XHJcbiAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgdHlwZTogJ3RleHQnLFxyXG4gICAgbWVzc2FnZTogbWVzc2FnZSxcclxuICAgIGludGVudDogJ2ZhcV9idWxrX29yZGVycydcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSB2aeG7h2MgY2hhdGJvdCBjw7MgdGjhu4MgZ2nDunAgZ8OsXHJcbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGjhuqNuIGjhu5NpIGNobyBjw6J1IGjhu49pXHJcbiAqL1xyXG5jb25zdCBoYW5kbGVDaGF0Ym90SGVscCA9ICgpID0+IHtcclxuICBjb25zdCBtZXNzYWdlID0gYFTDtGkgY8OzIHRo4buDIGdpw7pwIGLhuqFuIHTDrG0gc+G6o24gcGjhuqltLCBraeG7g20gdHJhIMSRxqFuIGjDoG5nLCBnaeG6o2kgxJHDoXAgY2jDrW5oIHPDoWNoIGdpYW8gaMOgbmcg4oCTIHRoYW5oIHRvw6FuIOKAkyDEkeG7lWkgdHLhuqMuYDtcclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgc3VjY2VzczogdHJ1ZSxcclxuICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXHJcbiAgICBpbnRlbnQ6ICdmYXFfY2hhdGJvdF9oZWxwJ1xyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogWOG7rSBsw70gY8OidSBo4buPaSBraGkga2jDtG5nIHTDrG0gdGjhuqV5IHPhuqNuIHBo4bqpbVxyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaSBjaG8gY8OidSBo4buPaVxyXG4gKi9cclxuY29uc3QgaGFuZGxlUHJvZHVjdE5vdEZvdW5kID0gKCkgPT4ge1xyXG4gIGNvbnN0IG1lc3NhZ2UgPSBgQuG6oW4gaMOjeSB0aOG7rSBuaOG6rXAgdMOqbiBz4bqjbiBwaOG6qW0ga2jDoWMgaG/hurdjIG3DtCB04bqjIGNoaSB0aeG6v3QgaMahbi4gTuG6v3UgduG6q24ga2jDtG5nIGPDsywgYuG6oW4gY8OzIHRo4buDIGfhu61pIHnDqnUgY+G6p3UgxJHhurd0IGjDoG5nIHJpw6puZy5gO1xyXG4gIFxyXG4gIHJldHVybiB7XHJcbiAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgdHlwZTogJ3RleHQnLFxyXG4gICAgbWVzc2FnZTogbWVzc2FnZSxcclxuICAgIGludGVudDogJ2ZhcV9wcm9kdWN0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