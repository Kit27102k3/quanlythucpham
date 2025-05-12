/**
 * Hệ thống xử lý câu hỏi thường gặp (FAQ)
 * File này chứa các hàm để trả lời các câu hỏi chung về cửa hàng, chính sách, và dịch vụ
 */

/**
 * Xử lý câu hỏi từ người dùng dựa trên loại intent đã phát hiện
 * @param {string} intent - Intent được phát hiện từ câu hỏi
 * @returns {object} - Phản hồi cho câu hỏi
 */
export const handleFAQQuestion = (intent) => {
  console.log(`Xử lý câu hỏi FAQ với intent: ${intent}`);
  
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
  const message = `**Hướng dẫn mua hàng:**

**Cách 1: Mua hàng trực tuyến**
1. Tìm kiếm sản phẩm trên trang web
2. Nhấp vào sản phẩm để xem chi tiết
3. Chọn "Thêm vào giỏ hàng" hoặc "Mua ngay"
4. Tiến hành đặt hàng và thanh toán

**Cách 2: Mua hàng trực tiếp tại cửa hàng**
- Địa chỉ: Trường Đại học Nam Cần Thơ, Nguyễn Văn Cừ nối dài, Cần Thơ
- Thời gian mở cửa: 8:00 - 21:00 mỗi ngày

**Cách 3: Đặt hàng qua điện thoại**
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
  const message = `**Các bước đặt hàng trên website:**

1. **Tìm kiếm sản phẩm:** Sử dụng thanh tìm kiếm hoặc duyệt qua danh mục
2. **Thêm vào giỏ hàng:** Nhấp vào nút "Thêm vào giỏ" sau khi chọn sản phẩm
3. **Kiểm tra giỏ hàng:** Nhấp vào biểu tượng giỏ hàng để xem và chỉnh sửa đơn hàng
4. **Thanh toán:** Nhấp "Thanh toán" và điền thông tin giao hàng
5. **Chọn phương thức thanh toán:** Chọn hình thức thanh toán phù hợp
6. **Hoàn tất đơn hàng:** Xác nhận đơn hàng và nhận mã đơn hàng

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
  const message = `**Các hình thức thanh toán được chấp nhận:**

1. **Thanh toán khi nhận hàng (COD):** Thanh toán trực tiếp cho nhân viên giao hàng

2. **Chuyển khoản ngân hàng:**
   - Ngân hàng: MB Bank
   - Số tài khoản: 0326743391
   - Chủ tài khoản: NGUYEN TRONG KHIEM
   - Nội dung: [Mã đơn hàng]

3. **Thẻ tín dụng/ghi nợ:** MB BANK

4. **Thanh toán khi nhận hàng**

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
  const message = `**Địa chỉ cửa hàng:**

**Cửa hàng chính:**
Trường Đại học Nam Cần Thơ, Nguyễn Văn Cừ nối dài, Cần Thơ City
Điện thoại: 0326 743391
Giờ mở cửa: 8:00 - 21:00 hàng ngày

**Chi nhánh 1:**
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
  const message = `**Cam kết về chất lượng sản phẩm:**

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
  const message = `**Thời gian giao hàng:**

**Nội thành Cần Thơ:**
- Giao hàng nhanh: 2-4 giờ (đơn hàng đặt trước 16:00)
- Giao hàng tiêu chuẩn: 1-2 ngày làm việc

**Các tỉnh thành khác:**
- Khu vực miền Nam: 2-3 ngày làm việc
- Khu vực miền Trung: 3-5 ngày làm việc
- Khu vực miền Bắc: 3-5 ngày làm việc
- Khu vực miền núi và hải đảo: 5-7 ngày làm việc

**Lưu ý:** Thời gian có thể thay đổi do điều kiện thời tiết hoặc sự kiện đặc biệt. Đơn hàng được giao từ 8:00-21:00 hàng ngày.`;
  
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
  const message = `**Chính sách đổi trả sản phẩm:**

**Điều kiện đổi trả:**
- Sản phẩm còn nguyên vẹn, chưa mở seal/bao bì
- Sản phẩm không đúng mô tả, không đúng chủng loại
- Sản phẩm bị lỗi do vận chuyển hoặc nhà sản xuất
- Sản phẩm còn trong thời hạn sử dụng

**Thời hạn đổi trả:**
- Thực phẩm tươi sống: trong vòng 24 giờ
- Sản phẩm đóng gói: trong vòng 3 ngày
- Sản phẩm đồ khô, gia dụng: trong vòng 7 ngày

**Liên hệ đổi trả:** 0326 743391 hoặc kit10012003@gmail.com`;
  
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
  const message = `**Chương trình khuyến mãi hiện tại:**

**1. Ưu đãi mùa lễ hội (15/11-31/12):**
- Giảm 10% cho tất cả sản phẩm "Đồ uống"
- Mua 2 tặng 1 cho các sản phẩm bánh kẹo

**2. Chương trình tích điểm:**
- Tích 1 điểm cho mỗi 10,000đ chi tiêu
- Đổi 100 điểm = Voucher 50,000đ

**3. Ưu đãi giao hàng:**
- Miễn phí giao hàng cho đơn từ 200,000đ
- Giảm 50% phí giao hàng cho đơn từ 100,000đ đến 199,999đ

**4. Mã giảm giá:**
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
  const message = `**Sản phẩm mới và bán chạy:**

**Sản phẩm mới:**
1. Nước ép trái cây hữu cơ nguyên chất (nhiều hương vị)
2. Trà thảo mộc detox nhập khẩu từ Hàn Quốc
3. Bánh ăn kiêng không đường, ít carb
4. Các loại hạt dinh dưỡng mix sẵn

**Sản phẩm bán chạy nhất:**
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
  const message = `**Phí vận chuyển:**

**Khu vực nội thành HCM, Hà Nội:**
- Đơn dưới 100,000đ: 15,000đ
- Đơn từ 100,000đ đến 199,999đ: 10,000đ
- Đơn từ 200,000đ trở lên: Miễn phí

**Khu vực ngoại thành và tỉnh thành khác:**
- Đơn dưới 200,000đ: 30,000đ
- Đơn từ 200,000đ đến 499,999đ: 20,000đ
- Đơn từ 500,000đ trở lên: Miễn phí

**Khu vực miền núi và hải đảo:**
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
  const message = `**Thông tin hỗ trợ khách hàng:**

**Hotline:** 0326 743391 (8:00-21:00 hàng ngày)
**Email hỗ trợ:** kit10012003@gmail.com
**Fanpage:** facebook.com/tzkit27
**Zalo:** 0326743391
**Chat trực tuyến:** Góc phải màn hình website
**Địa chỉ:** Trường ĐH Nam Cần Thơ, Nguyễn Văn Cừ nối dài, Cần Thơ

Đội ngũ nhân viên tư vấn luôn sẵn sàng hỗ trợ bạn mọi thắc mắc về sản phẩm và đơn hàng.`;
  
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_customer_support'
  };
}; 