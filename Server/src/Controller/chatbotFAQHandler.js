/**
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
  'faq_bulk_orders': ['đơn hàng lớn', 'mua số lượng nhiều', 'mua sỉ', 'đặt hàng số lượng lớn', 'doanh nghiệp', 'công ty đặt hàng', 'số lượng lớn', 'mua nhiều', 'giá sỉ', 'giảm giá khi mua nhiều', 'đơn đoàn', 'mua hàng loạt', 'mua với số lượng lớn', 'đơn hàng số lượng lớn', 'đơn số lượng lớn']
};

// Đánh giá mức độ ưu tiên cho từng loại intent
const intentPriority = {
  'faq_bulk_orders': 3,
  'faq_organic_products': 3,
  'faq_gift_services': 3,
  'faq_promotions': 2,
  'faq_payment_methods': 2,
  'faq_shipping_fee': 2,
  'faq_shipping_time': 2,
  'faq_return_policy': 2,
  'faq_dietary_options': 2,
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
export const detectIntentFromKeywords = (query) => {
  if (!query) return null;
  
  // Chuyển câu hỏi thành chữ thường để so sánh dễ dàng hơn
  const normalizedQuery = query.toLowerCase();
  
  // Điểm số cho mỗi intent
  const scores = {};
  let bestMatch = null;
  let highestScore = 0;
  
  // Kiểm tra các intent với độ ưu tiên cao trước
  // Kiểm tra chính xác cụm từ hoàn chỉnh
  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    const priority = intentPriority[intent] || 1;
    scores[intent] = 0;
    
    for (const keyword of keywords) {
      // Kiểm tra từ khóa chính xác
      if (normalizedQuery === keyword.toLowerCase()) {
        // Khớp hoàn toàn
        scores[intent] += keyword.length * 3 * priority;
      }
      else if (normalizedQuery.includes(keyword.toLowerCase())) {
        // Từ khóa dài sẽ có trọng số cao hơn
        scores[intent] += keyword.length * priority;
      }
    }
    
    // Cập nhật intent có điểm cao nhất
    if (scores[intent] > highestScore) {
      highestScore = scores[intent];
      bestMatch = intent;
    }
  }
  
  // Trả về intent phù hợp nhất nếu điểm đủ cao
  return highestScore > 0 ? bestMatch : null;
};

/**
 * Xử lý câu hỏi từ người dùng dựa trên loại intent đã phát hiện
 * @param {string} intent - Intent được phát hiện từ câu hỏi
 * @param {string} query - Câu hỏi gốc của người dùng
 * @returns {object} - Phản hồi cho câu hỏi
 */
export const handleFAQQuestion = (intent, query = "") => {
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