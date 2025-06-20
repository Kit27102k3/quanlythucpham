/**
 * Module xử lý nhận diện ý định người dùng cho chatbot
 */

// Cải thiện hàm phát hiện ý định
const detectIntent = (message, context) => {
  const lowerMessage = message.toLowerCase();
  
  // Các từ khóa cho từng ý định
  const intentKeywords = {
    greeting: ['chào', 'hello', 'hi', 'xin chào', 'chào bạn'],
    product_search: [
      'tìm', 'sản phẩm', 'có', 'bán', 'mua', 'giá', 'đồ', 'hàng', 'trái cây', 
      'rau củ', 'thực phẩm', 'loại', 'nào', 'ít đường', 'ăn kiêng', 'dinh dưỡng'
    ],
    product_info: ['thông tin', 'chi tiết', 'mô tả', 'đặc điểm', 'tính năng'],
    product_price: ['giá', 'bao nhiêu', 'giá tiền', 'giá cả', 'đắt', 'rẻ', 'tiền'],
    product_compare: ['so sánh', 'khác nhau', 'khác biệt', 'tốt hơn', 'hơn', 'nên chọn'],
    order_status: ['đơn hàng', 'tình trạng', 'trạng thái', 'giao hàng', 'vận chuyển', 'theo dõi'],
    payment: ['thanh toán', 'chuyển khoản', 'tiền mặt', 'thẻ', 'ví điện tử', 'momo', 'zalopay'],
    return_policy: ['đổi trả', 'hoàn tiền', 'trả lại', 'không vừa ý', 'lỗi', 'hư hỏng'],
    promotion: ['khuyến mãi', 'giảm giá', 'ưu đãi', 'mã giảm giá', 'voucher', 'coupon'],
    store_info: ['cửa hàng', 'địa chỉ', 'chỗ', 'mở cửa', 'giờ', 'liên hệ']
  };

  // Các mẫu câu hỏi cụ thể về sản phẩm
  const productQueryPatterns = [
    /loại .* nào/i,
    /có .* không/i,
    /bán .* không/i,
    /tìm .* ít đường/i,
    /tìm .* ăn kiêng/i,
    /sản phẩm .* cho người/i,
    /trái cây nào/i,
    /rau củ nào/i,
    /thực phẩm nào/i
  ];

  // Kiểm tra các mẫu câu hỏi về sản phẩm
  for (const pattern of productQueryPatterns) {
    if (pattern.test(lowerMessage)) {
      console.log(`Phát hiện mẫu câu hỏi về sản phẩm: ${pattern}`);
      return "product";
    }
  }

  // Kiểm tra từng ý định dựa trên từ khóa
  let bestIntent = null;
  let highestScore = 0;

  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        score += 1;
      }
    }
    
    // Cải thiện điểm số dựa trên ngữ cảnh
    if (context && context.lastProduct && intent.startsWith('product_')) {
      score += 0.5; // Tăng điểm cho các ý định liên quan đến sản phẩm nếu đang có ngữ cảnh sản phẩm
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestIntent = intent;
    }
  }

  // Nếu có ý định rõ ràng
  if (highestScore >= 2) {
    if (bestIntent.startsWith('product_')) {
      return "product";
    }
    return bestIntent;
  }
  
  // Xử lý các trường hợp đặc biệt
  if (lowerMessage.includes('trái cây') || 
      lowerMessage.includes('rau củ') || 
      lowerMessage.includes('thực phẩm') ||
      lowerMessage.includes('ít đường') ||
      lowerMessage.includes('ăn kiêng')) {
    return "product";
  }
  
  // Mặc định là faq nếu không phát hiện ý định rõ ràng
  return "faq";
};

export { detectIntent };
export default { detectIntent }; 