/**
 * Hệ thống xử lý câu hỏi thường gặp (FAQ)
 * File này chứa các hàm để trả lời các câu hỏi chung về cửa hàng, chính sách, và dịch vụ
 */

// Định nghĩa từ khóa cho mỗi intent để tăng độ chính xác khi nhận diện câu hỏi
export const intentKeywords = {
  faq_how_to_buy: [
    "mua hàng",
    "mua sản phẩm",
    "cách mua",
    "mua như thế nào",
    "làm sao để mua",
    "đặt mua",
    "mua như nào",
    "mua ở đâu",
  ],
  faq_how_to_order: [
    "đặt hàng",
    "order",
    "cách đặt",
    "các bước đặt hàng",
    "hướng dẫn đặt hàng",
    "làm sao để đặt",
    "đặt như thế nào",
  ],
  // Các intent khác giữ nguyên
};

/**
 * Xử lý câu hỏi FAQ và trả về câu trả lời phù hợp
 * @param {string} intent - Intent được phát hiện
 * @param {string} query - Câu hỏi gốc
 * @returns {string} - Câu trả lời
 */
export const handleFAQQuestion = (intent, query = "") => {
  console.log(`Xử lý câu hỏi FAQ với intent: ${intent}, query: ${query}`);
  
  // Các câu trả lời mặc định cho từng loại câu hỏi
  const responses = {
    faq_how_to_buy: "Bạn có thể mua sản phẩm của chúng tôi qua website, ứng dụng di động hoặc trực tiếp tại cửa hàng. Để mua hàng online, bạn chỉ cần tìm sản phẩm, thêm vào giỏ hàng và tiến hành thanh toán.",
    
    faq_how_to_order: "Để đặt hàng, bạn cần: 1) Đăng nhập vào tài khoản (hoặc đặt hàng không cần tài khoản), 2) Chọn sản phẩm và thêm vào giỏ hàng, 3) Kiểm tra giỏ hàng và tiến hành thanh toán, 4) Điền thông tin giao hàng, 5) Chọn phương thức thanh toán và hoàn tất đơn hàng.",
    
    faq_payment_methods: "Chúng tôi chấp nhận nhiều phương thức thanh toán: tiền mặt khi nhận hàng (COD), thẻ tín dụng/ghi nợ (Visa, Mastercard, JCB), chuyển khoản ngân hàng, ví điện tử (MoMo, ZaloPay, VNPay), và trả góp qua các đối tác tài chính.",
    
    // Các câu trả lời khác giữ nguyên
  };
  
  // Trả về câu trả lời tương ứng với intent
  return responses[intent] || "Xin lỗi, tôi không có thông tin về câu hỏi này. Bạn có thể liên hệ với bộ phận hỗ trợ khách hàng để được giúp đỡ.";
};
