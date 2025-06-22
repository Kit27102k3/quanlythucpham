/**
 * Hệ thống xử lý câu hỏi thường gặp (FAQ)
 * File này chứa các hàm để trả lời các câu hỏi chung về cửa hàng, chính sách, và dịch vụ
 */

// Định nghĩa từ khóa cho mỗi intent để tăng độ chính xác khi nhận diện câu hỏi
const intentKeywords = {
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
  faq_payment_methods: [
    "thanh toán",
    "trả tiền",
    "phương thức thanh toán",
    "cách thanh toán",
    "chuyển khoản",
    "tiền mặt",
    "thẻ tín dụng",
    "cod",
    "trả góp",
    "visa",
    "mastercard",
    "atm",
    "hình thức thanh toán",
  ],
  faq_store_location: [
    "địa chỉ",
    "cửa hàng",
    "chỗ bán",
    "cơ sở",
    "chi nhánh",
    "vị trí",
    "nơi bán",
    "ở đâu",
    "shop ở đâu",
    "cửa hàng ở đâu",
    "chỗ nào",
  ],
  faq_product_quality: [
    "chất lượng",
    "sản phẩm",
    "đảm bảo",
    "độ an toàn",
    "hạn sử dụng",
    "chứng nhận",
    "kiểm định",
    "cam kết",
    "bảo đảm",
    "chất lượng như thế nào",
    "nguồn gốc",
    "xuất xứ",
  ],
  faq_shipping_time: [
    "giao hàng",
    "vận chuyển",
    "thời gian giao",
    "bao lâu",
    "mấy ngày",
    "nhận hàng",
    "ship",
    "khi nào nhận được",
    "giao trong bao lâu",
    "giao nhanh không",
  ],
  faq_return_policy: [
    "đổi trả",
    "hoàn tiền",
    "trả lại",
    "không ưng",
    "đổi sản phẩm",
    "chính sách đổi",
    "bảo hành",
    "không vừa ý",
    "không thích",
    "lỗi",
    "hư hỏng",
    "kém chất lượng",
    "đổi hàng",
    "chính sách đổi trả",
    "trả hàng",
    "hoàn trả",
    "đổi trả hàng",
    "chính sách trả hàng",
    "quy định đổi trả",
    "điều kiện đổi trả",
    "thời gian đổi trả",
    "hạn đổi trả",
    "có được đổi trả không",
  ],
  faq_promotions: [
    "khuyến mãi",
    "giảm giá",
    "ưu đãi",
    "sale",
    "quà tặng kèm",
    "mã giảm giá",
    "voucher",
    "coupon",
    "có ưu đãi",
    "đang giảm giá",
    "sale off",
    "có khuyến mãi không",
    "ưu đãi gì",
  ],
  faq_trending_products: [
    "sản phẩm hot",
    "bán chạy",
    "xu hướng",
    "mới nhất",
    "phổ biến",
    "nhiều người mua",
    "trend",
    "nổi bật",
    "sản phẩm mới",
    "hàng hot",
    "hàng mới về",
    "sản phẩm phổ biến",
  ],
  faq_shipping_fee: [
    "phí vận chuyển",
    "phí giao hàng",
    "ship",
    "freeship",
    "miễn phí giao",
    "giá ship",
    "tiền ship",
    "tốn phí",
    "mất phí",
    "chi phí giao",
    "free ship",
    "giao miễn phí",
    "phí ship",
  ],
  faq_customer_support: [
    "hỗ trợ",
    "tư vấn",
    "liên hệ",
    "giúp đỡ",
    "hotline",
    "số điện thoại",
    "nhân viên",
    "chăm sóc",
    "tổng đài",
    "zalo",
    "facebook",
    "email",
  ],
  faq_membership: [
    "thành viên",
    "khách hàng thân thiết",
    "membership",
    "hội viên",
    "tích điểm",
    "ưu đãi thành viên",
    "vip",
    "điểm thưởng",
    "chương trình thành viên",
    "quyền lợi",
    "đăng ký thành viên",
  ],
  faq_organic_products: [
    "hữu cơ",
    "organic",
    "tự nhiên",
    "không hóa chất",
    "sạch",
    "an toàn",
    "sinh học",
    "không thuốc trừ sâu",
    "không phân bón",
    "sản phẩm hữu cơ",
    "thực phẩm sạch",
    "xanh",
    "eco",
  ],
  faq_dietary_options: [
    "ăn kiêng",
    "chay",
    "thuần chay",
    "vegan",
    "keto",
    "low-carb",
    "gluten-free",
    "không đường",
    "ít đường",
    "không lactose",
    "ăn chay",
    "đồ chay",
    "không tinh bột",
    "ít muối",
    "ít béo",
    "thực phẩm chay",
    "món chay",
    "người ăn chay",
    "đồ ăn chay",
    "thực phẩm dành cho người ăn chay",
    "thực phẩm thuần chay",
    "thực phẩm không chứa thịt",
  ],
  faq_gift_services: [
    "quà tặng",
    "gói quà",
    "giỏ quà",
    "thẻ quà tặng",
    "gift card",
    "gửi quà",
    "quà biếu",
    "quà sinh nhật",
    "dịch vụ quà",
    "gửi quà tặng",
    "có dịch vụ gói quà không",
    "làm hộp quà",
  ],
  faq_bulk_orders: [
    "đơn hàng lớn",
    "mua số lượng nhiều",
    "mua sỉ",
    "đặt hàng số lượng lớn",
    "doanh nghiệp",
    "công ty đặt hàng",
    "số lượng lớn",
    "mua nhiều",
    "giá sỉ",
    "giảm giá khi mua nhiều",
    "đơn đoàn",
    "mua hàng loạt",
    "mua với số lượng lớn",
    "đơn hàng số lượng lớn",
    "đơn số lượng lớn",
  ],
  faq_chatbot_help: [
    "chatbot có thể giúp gì cho tôi",
    "chatbot giúp gì cho tôi",
    "chatbot giúp gì",
    "chatbot có thể giúp gì",
    "chatbot hỗ trợ",
    "bot có thể làm gì",
    "chatbot làm được gì",
    "trợ lý ảo",
    "bot giúp được gì",
    "bot hỗ trợ gì",
    "chatbot có tính năng gì",
    "website hỗ trợ",
    "tính năng chatbot",
    "tính năng website",
    "hệ thống hỗ trợ",
    "chatbot làm gì",
  ],
  faq_product_not_found: [
    "không tìm thấy sản phẩm",
    "tìm không ra",
    "không có sản phẩm",
    "sản phẩm không có",
    "không thấy hàng",
    "không tìm được",
    "sản phẩm không hiển thị",
    "không thấy sản phẩm",
    "tìm sản phẩm",
    "tìm kiếm sản phẩm",
    "tìm không thấy",
  ],
  // Thêm các intent keywords cho các bệnh
  faq_diabetes_food: [
    "tiểu đường",
    "đái tháo đường", 
    "đường huyết",
    "đường trong máu",
    "thực phẩm cho người tiểu đường",
    "đồ ăn cho người tiểu đường",
    "tiểu đường nên ăn gì",
    "tiểu đường không nên ăn gì",
    "đồ ăn cho bệnh nhân tiểu đường",
    "đường huyết cao",
    "thực phẩm cho bệnh tiểu đường",
    "ăn gì khi bị tiểu đường",
    "thực phẩm tốt cho tiểu đường",
    "tiểu đường kiêng gì",
    "thực phẩm giúp hạ đường huyết",
    "thực phẩm an toàn cho bệnh nhân tiểu đường",
    "chỉ số đường huyết thấp",
    "chỉ số GI thấp",
    "đồ ăn cho người bệnh tiểu đường",
  ],
  faq_hypertension_food: [
    "huyết áp cao",
    "huyết áp",
    "tăng huyết áp",
    "cao huyết áp",
    "thực phẩm cho người huyết áp cao",
    "đồ ăn cho người huyết áp cao", 
    "huyết áp cao nên ăn gì",
    "huyết áp cao không nên ăn gì",
    "đồ ăn cho bệnh nhân huyết áp",
    "thực phẩm hạ huyết áp",
    "thực phẩm cho bệnh huyết áp",
    "ăn gì khi bị cao huyết áp",
    "thực phẩm tốt cho huyết áp cao",
    "huyết áp kiêng gì",
    "thực phẩm giúp hạ huyết áp",
    "thực phẩm giảm huyết áp",
    "thực phẩm an toàn cho bệnh nhân huyết áp",
    "món ăn cho người huyết áp cao",
    "thực phẩm ít muối",
  ],
  faq_heart_food: [
    "tim mạch",
    "bệnh tim",
    "suy tim",
    "mạch vành",
    "nhồi máu cơ tim",
    "mỡ máu",
    "cholesterol",
    "thực phẩm cho người bệnh tim mạch",
    "đồ ăn cho người bệnh tim",
    "tim mạch nên ăn gì",
    "tim mạch không nên ăn gì",
    "đồ ăn cho bệnh nhân tim mạch",
    "thực phẩm tốt cho tim",
    "thực phẩm cho bệnh tim",
    "ăn gì khi bị bệnh tim",
    "thực phẩm tốt cho tim mạch",
    "người bị tim mạch kiêng gì",
    "thực phẩm giúp tim khỏe",
    "thực phẩm giảm cholesterol",
    "thực phẩm có lợi cho tim mạch",
    "thực phẩm bảo vệ tim mạch",
  ],
  faq_liver_food: [
    "gan nhiễm mỡ",
    "gan",
    "bệnh gan",
    "suy gan", 
    "viêm gan",
    "mỡ gan",
    "thực phẩm cho người bệnh gan",
    "đồ ăn cho người gan nhiễm mỡ",
    "gan nhiễm mỡ nên ăn gì",
    "gan nhiễm mỡ không nên ăn gì",
    "đồ ăn cho bệnh nhân gan",
    "thực phẩm tốt cho gan",
    "thực phẩm cho bệnh gan",
    "ăn gì khi bị bệnh gan",
    "thực phẩm tốt cho gan nhiễm mỡ",
    "gan nhiễm mỡ kiêng gì",
    "thực phẩm giải độc gan",
    "thực phẩm bảo vệ gan",
    "thực phẩm tốt cho gan",
    "thực phẩm phục hồi gan",
  ],
  faq_gout_food: [
    "gout",
    "gút",
    "axit uric",
    "bệnh gút",
    "purin",
    "thực phẩm cho người bệnh gout",
    "đồ ăn cho người gout",
    "gout nên ăn gì",
    "gout không nên ăn gì",
    "đồ ăn cho bệnh nhân gout",
    "thực phẩm giảm axit uric",
    "thực phẩm cho bệnh gout",
    "ăn gì khi bị gout",
    "thực phẩm tốt cho gout",
    "gout kiêng gì",
    "thực phẩm không có purin",
    "thực phẩm ít purin",
    "thực phẩm hạ axit uric",
    "thực phẩm an toàn cho bệnh nhân gout",
  ],
  faq_digestion_food: [
    "tiêu hóa",
    "dạ dày",
    "đường ruột",
    "viêm loét dạ dày",
    "trào ngược",
    "táo bón",
    "tiêu chảy",
    "thực phẩm cho người bệnh dạ dày",
    "đồ ăn cho người đau dạ dày",
    "dạ dày nên ăn gì",
    "dạ dày không nên ăn gì",
    "đồ ăn cho bệnh nhân đau dạ dày",
    "thực phẩm tốt cho tiêu hóa",
    "thực phẩm cho bệnh dạ dày",
    "ăn gì khi bị đau dạ dày",
    "thực phẩm tốt cho dạ dày",
    "dạ dày kiêng gì",
    "thực phẩm dễ tiêu hóa",
    "thực phẩm bảo vệ dạ dày",
    "thực phẩm chữa đau dạ dày",
    "thực phẩm giảm trào ngược",
    "thực phẩm giảm táo bón",
  ],
  faq_immune_food: [
    "hệ miễn dịch",
    "miễn dịch",
    "sức đề kháng",
    "chống lại bệnh tật",
    "dễ ốm",
    "hay bị bệnh",
    "thực phẩm tăng cường miễn dịch",
    "đồ ăn tăng đề kháng",
    "tăng miễn dịch nên ăn gì",
    "tăng sức đề kháng không nên ăn gì",
    "đồ ăn tăng cường hệ miễn dịch",
    "thực phẩm tốt cho miễn dịch",
    "thực phẩm tăng cường sức đề kháng",
    "ăn gì để tăng đề kháng",
    "thực phẩm tăng sức đề kháng",
    "thực phẩm cho hệ miễn dịch",
    "thực phẩm giúp không bị ốm",
    "thực phẩm tăng cường kháng thể",
    "thực phẩm phòng bệnh",
  ],
  faq_joint_food: [
    "xương khớp",
    "khớp",
    "viêm khớp",
    "đau khớp",
    "thoái hóa khớp",
    "thấp khớp",
    "loãng xương",
    "thực phẩm cho người bệnh xương khớp",
    "đồ ăn cho người đau xương khớp",
    "xương khớp nên ăn gì",
    "xương khớp không nên ăn gì",
    "đồ ăn cho bệnh nhân đau khớp",
    "thực phẩm tốt cho xương khớp",
    "thực phẩm cho bệnh khớp",
    "ăn gì khi bị đau khớp",
    "thực phẩm tốt cho khớp",
    "đau khớp kiêng gì",
    "thực phẩm bảo vệ xương khớp",
    "thực phẩm chống loãng xương",
    "thực phẩm bổ xương khớp",
    "thực phẩm chứa canxi",
  ],
  faq_cholesterol_food: [
    "cholesterol cao",
    "mỡ máu",
    "lipid máu",
    "máu nhiễm mỡ",
    "chỉ số cholesterol",
    "thực phẩm cho người cholesterol cao",
    "đồ ăn cho người mỡ máu",
    "cholesterol cao nên ăn gì",
    "cholesterol cao không nên ăn gì",
    "đồ ăn cho bệnh nhân mỡ máu",
    "thực phẩm giảm cholesterol",
    "thực phẩm cho người mỡ máu",
    "ăn gì khi bị cholesterol cao",
    "thực phẩm tốt cho người mỡ máu",
    "cholesterol kiêng gì",
    "thực phẩm hạ mỡ máu",
    "thực phẩm giảm lipid máu",
    "thực phẩm an toàn cho người cholesterol cao",
  ],
  faq_weight_loss_food: [
    "giảm cân",
    "ăn kiêng",
    "giảm mỡ",
    "giảm bụng",
    "béo phì",
    "thừa cân",
    "thực phẩm giảm cân",
    "đồ ăn cho người giảm cân",
    "giảm cân nên ăn gì",
    "giảm cân không nên ăn gì",
    "đồ ăn cho người đang ăn kiêng",
    "thực phẩm giúp giảm cân",
    "thực phẩm cho người thừa cân",
    "ăn gì để giảm cân",
    "thực phẩm tốt cho giảm cân",
    "giảm cân kiêng gì",
    "thực phẩm đốt mỡ",
    "thực phẩm ít calo",
    "thực phẩm giảm mỡ bụng",
    "thực phẩm giảm béo",
  ],
  faq_kids_health_food: [
    "sức khỏe trẻ em",
    "dinh dưỡng trẻ em",
    "tăng chiều cao",
    "tăng cân cho trẻ",
    "phát triển trí não",
    "thực phẩm cho trẻ",
    "đồ ăn cho bé",
    "trẻ em nên ăn gì",
    "trẻ em không nên ăn gì",
    "đồ ăn tốt cho trẻ",
    "thực phẩm giúp trẻ thông minh",
    "thực phẩm tăng chiều cao",
    "ăn gì giúp trẻ phát triển",
    "thực phẩm tốt cho sức khỏe trẻ",
    "bé không nên ăn gì",
    "thực phẩm phát triển não bộ",
    "thực phẩm tăng cường trí nhớ",
    "thực phẩm cho trẻ biếng ăn",
    "thực phẩm bổ sung dinh dưỡng cho trẻ",
  ]
}

// Đánh giá mức độ ưu tiên cho từng loại intent
const intentPriority = {
  faq_bulk_orders: 3,
  faq_organic_products: 3,
  faq_gift_services: 3,
  faq_chatbot_help: 3,
  faq_promotions: 2,
  faq_payment_methods: 2,
  faq_shipping_fee: 2,
  faq_shipping_time: 2,
  faq_return_policy: 2,
  faq_dietary_options: 2,
  faq_product_not_found: 2,
  faq_how_to_buy: 1,
  faq_how_to_order: 1,
  faq_store_location: 1,
  faq_product_quality: 1,
  faq_trending_products: 1,
  faq_customer_support: 1,
  faq_membership: 1,
  // Thêm các intent mới về bệnh với độ ưu tiên cao
  faq_diabetes_food: 3,
  faq_hypertension_food: 3,
  faq_heart_food: 3,
  faq_liver_food: 3,
  faq_gout_food: 3,
  faq_digestion_food: 3,
  faq_immune_food: 3,
  faq_joint_food: 3,
  faq_cholesterol_food: 3,
  faq_weight_loss_food: 2,
  faq_kids_health_food: 3,
  faq_kids_food: 2,
  faq_pregnant_food: 3
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
  console.log(`Normalized Query: "${normalizedQuery}"`);
  
  // Kiểm tra khớp chính xác với câu hỏi
  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    for (const keyword of keywords) {
      // Nếu câu hỏi khớp chính xác với từ khóa
      if (
        normalizedQuery === keyword.toLowerCase() ||
        normalizedQuery.replace(/[?.,!]/g, "") === keyword.toLowerCase()
      ) {
        console.log(
          `Exact match found for intent: ${intent}, keyword: "${keyword}"`
        );
        return intent;
      }
    }
  }
  
  // Phân tích ngữ nghĩa cơ bản cho một số trường hợp đặc biệt
  // Xử lý các câu hỏi về thực phẩm chay
  if (
    (normalizedQuery.includes("thực phẩm") ||
      normalizedQuery.includes("đồ ăn") ||
      normalizedQuery.includes("món ăn")) &&
    (normalizedQuery.includes("chay") || normalizedQuery.includes("không thịt"))
  ) {
    console.log("Phát hiện câu hỏi về thực phẩm chay qua phân tích ngữ nghĩa");
    return "faq_dietary_options";
  }
  
  // Xử lý câu hỏi về đổi trả
  if (
    (normalizedQuery.includes("đổi") || normalizedQuery.includes("trả")) &&
    (normalizedQuery.includes("hàng") ||
      normalizedQuery.includes("sản phẩm") ||
      normalizedQuery.includes("chính sách"))
  ) {
    console.log(
      "Phát hiện câu hỏi về chính sách đổi trả qua phân tích ngữ nghĩa"
    );
    return "faq_return_policy";
  }
  
  // Xử lý câu hỏi về giao hàng
  if (
    (normalizedQuery.includes("giao") ||
      normalizedQuery.includes("ship") ||
      normalizedQuery.includes("vận chuyển")) &&
    (normalizedQuery.includes("hàng") ||
      normalizedQuery.includes("mất") ||
      normalizedQuery.includes("thời gian") ||
      normalizedQuery.includes("bao lâu"))
  ) {
    console.log(
      "Phát hiện câu hỏi về thời gian giao hàng qua phân tích ngữ nghĩa"
    );
    return "faq_shipping_time";
  }
  
  // Xử lý câu hỏi về phí vận chuyển
  if (
    (normalizedQuery.includes("phí") || normalizedQuery.includes("tiền")) &&
    (normalizedQuery.includes("ship") ||
      normalizedQuery.includes("giao") ||
      normalizedQuery.includes("vận chuyển"))
  ) {
    console.log("Phát hiện câu hỏi về phí vận chuyển qua phân tích ngữ nghĩa");
    return "faq_shipping_fee";
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
      if (
        keyword.length > 10 &&
        normalizedQuery.includes(keyword.toLowerCase())
      ) {
        scores[intent] += keyword.length * 2 * priority;
        console.log(
          `Long keyword match: "${keyword}" for intent ${intent}, score +${
            keyword.length * 2 * priority
          }`
        );
      }
      // Từ khóa ngắn chỉ tính nếu là từ riêng biệt trong câu
      else if (normalizedQuery.includes(keyword.toLowerCase())) {
        scores[intent] += keyword.length * priority;
        console.log(
          `Keyword match: "${keyword}" for intent ${intent}, score +${
            keyword.length * priority
          }`
        );
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
    case "faq_how_to_buy":
      return handleHowToBuy();
    case "faq_how_to_order":
      return handleHowToOrder();
    case "faq_order":
      return handleHowToOrder();
    case "faq_payment_methods":
      return handlePaymentMethods();
    case "faq_store_location":
      return handleStoreLocation();
    case "faq_product_quality":
      return handleProductQuality();
    case "faq_shipping_time":
      return handleShippingTime();
    case "faq_return_policy":
      return handleReturnPolicy();
    case "faq_promotions":
      return handlePromotions();
    case "faq_trending_products":
      return handleTrendingProducts();
    case "faq_shipping_fee":
      return handleShippingFee();
    case "faq_customer_support":
      return handleCustomerSupport();
    case "faq_membership":
      return handleMembership();
    case "faq_organic_products":
      return handleOrganicProducts();
    case "faq_dietary_options":
      return handleDietaryOptions();
    case "faq_diet":
      return handleDietaryOptions();
    case "faq_gift_services":
      return handleGiftServices();
    case "faq_bulk_orders":
      return handleBulkOrders();
    case "faq_chatbot_help":
      return handleChatbotHelp();
    case "faq_product_not_found":
      return handleProductNotFound();
    case "meal_plan_diet":
      return handleMealPlanDiet();
    case "faq_product_info":
      return handleProductInfo();
    case "faq_kids_food":
      return handleKidsFood();
    case "faq_pregnant_food":
      return handlePregnantFood();
    // Thêm các intent mới cho bệnh
    case "faq_diabetes_food":
      return handleDiabetesFood();
    case "faq_hypertension_food":
      return handleHypertensionFood();
    case "faq_heart_food":
      return handleHeartFood();
    case "faq_liver_food":
      return handleLiverFood();
    case "faq_gout_food":
      return handleGoutFood();
    case "faq_digestion_food":
      return handleDigestionFood();
    case "faq_immune_food":
      return handleImmuneFood();
    case "faq_joint_food":
      return handleJointFood();
    case "faq_cholesterol_food":
      return handleCholesterolFood();
    case "faq_weight_loss_food":
      return handleWeightLossFood();
    case "faq_kids_health_food":
      return handleKidsHealthFood();
    default:
      return {
        success: true,
        type: "text",
        message:
          "Tôi không tìm thấy thông tin phù hợp với câu hỏi của bạn. Vui lòng thử lại với câu hỏi khác hoặc liên hệ trực tiếp với bộ phận hỗ trợ khách hàng qua số điện thoại 0326 743391 để được giúp đỡ.",
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
    type: "text",
    message: message,
    intent: "faq_how_to_buy",
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
    type: "text",
    message: message,
    intent: "faq_how_to_order",
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
    type: "text",
    message: message,
    intent: "faq_payment_methods",
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
    type: "text",
    message: message,
    intent: "faq_store_location",
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
    type: "text",
    message: message,
    intent: "faq_product_quality",
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
    type: "text",
    message: message,
    intent: "faq_shipping_time",
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

Quy trình đổi trả:
1. Liên hệ với chúng tôi qua hotline 0326 743391 hoặc email kit10012003@gmail.com
2. Cung cấp mã đơn hàng và lý do đổi trả
3. Nhận hướng dẫn đóng gói và gửi trả sản phẩm
4. Sau khi nhận được sản phẩm trả lại, chúng tôi sẽ kiểm tra và xử lý trong vòng 3-5 ngày làm việc
5. Hoàn tiền hoặc đổi sản phẩm mới theo yêu cầu của khách hàng

Lưu ý: Chi phí vận chuyển cho việc đổi trả sẽ do khách hàng chi trả, trừ trường hợp sản phẩm bị lỗi do nhà sản xuất hoặc vận chuyển.`;
  
  return {
    success: true,
    type: "text",
    message: message,
    intent: "faq_return_policy",
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
    type: "text",
    message: message,
    intent: "faq_promotions",
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
    type: "text",
    message: message,
    intent: "faq_trending_products",
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
    type: "text",
    message: message,
    intent: "faq_shipping_fee",
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
    type: "text",
    message: message,
    intent: "faq_customer_support",
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
    type: "text",
    message: message,
    intent: "faq_membership",
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
    type: "text",
    message: message,
    intent: "faq_organic_products",
  };
};

/**
 * Xử lý câu hỏi về các lựa chọn cho chế độ ăn đặc biệt
 * @returns {object} - Phản hồi cho câu hỏi
 */
const handleDietaryOptions = () => {
  const message = `🥗 *THỰC PHẨM CHO NGƯỜI ĂN KIÊNG*

*1. Sản phẩm cho người giảm cân:*
   - Ngũ cốc nguyên hạt (yến mạch, gạo lứt, quinoa)
   - Protein nạc (ức gà, cá hồi, đậu phụ)
   - Rau xanh các loại (bông cải xanh, cải xoăn, rau chân vịt)
   - Trái cây ít đường (dâu tây, việt quất, táo xanh)
   - Các loại hạt (hạnh nhân, óc chó, hạt chia)

*2. Sản phẩm cho người ăn chay/thuần chay:*
   - Đậu các loại (đậu đen, đậu lăng, đậu gà)
   - Sữa thực vật (đậu nành, hạnh nhân, yến mạch)
   - Đậu hũ và tempeh
   - Thịt thực vật từ đậu nành
   - Các loại hạt và quả hạch

*3. Sản phẩm cho người tiểu đường:*
   - Thực phẩm chỉ số đường huyết thấp
   - Đồ uống không đường
   - Bánh kẹo với chất làm ngọt tự nhiên (stevia, erythritol)
   - Các loại rau nhiều chất xơ
   - Quả mọng và trái cây ít ngọt

*4. Sản phẩm low-carb/keto:*
   - Thịt, cá, hải sản
   - Trứng và các sản phẩm từ sữa béo
   - Dầu lành mạnh (dầu oliu, dầu dừa, bơ)
   - Rau ít tinh bột (rau xanh, bông cải, dưa chuột)
   - Các loại hạt và quả hạch

*5. Sản phẩm không gluten:*
   - Bánh mì gạo, bánh mì hạt
   - Mì và pasta từ gạo, ngô, khoai lang
   - Bột làm bánh không gluten
   - Ngũ cốc không gluten (gạo, bắp, kê)

*6. Sản phẩm cho người cao tuổi:*
   - Thực phẩm giàu canxi (sữa, phô mai, sữa chua)
   - Rau lá xanh: cải xoăn, cải thìa, rau muống
   - Cá có xương mềm: cá mòi, cá hồi đóng hộp
   - Đậu nành và các sản phẩm từ đậu nành

*7. Sản phẩm cho người tập gym:*
   - Thực phẩm giàu protein (thịt nạc, trứng, sữa)
   - Bột protein các loại (whey, đậu nành, gạo)
   - Ngũ cốc nguyên hạt và carbs phức hợp
   - Thực phẩm bổ sung (BCAA, creatine)

Tất cả sản phẩm đều được gắn nhãn rõ ràng và bạn có thể lọc tìm theo loại chế độ ăn trên website hoặc hỏi nhân viên tư vấn để được hướng dẫn chi tiết.`;
  
  return {
    success: true,
    type: "text",
    message: message,
    intent: "faq_dietary_options",
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
    type: "text",
    message: message,
    intent: "faq_gift_services",
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
    type: "text",
    message: message,
    intent: "faq_bulk_orders",
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
    type: "text",
    message: message,
    intent: "faq_chatbot_help",
  };
};

/**
 * Xử lý câu hỏi về khi không tìm thấy sản phẩm
 * @returns {object} - Phản hồi cho câu hỏi
 */
const handleProductNotFound = () => {
  const message = `Bạn hãy thử nhập tên sản phẩm khác hoặc mô tả chi tiết hơn. Nếu vẫn không có, bạn có thể gửi yêu cầu đặt hàng riêng.`;

  return {
    success: true,
    type: "text",
    message: message,
    intent: "faq_product_not_found",
  };
};

/**
 * Xử lý câu hỏi về kế hoạch ăn kiêng
 * @returns {object} - Phản hồi cho câu hỏi
 */
const handleMealPlanDiet = () => {
  const message = `📋 *KẾ HOẠCH ĂN KIÊNG 7 NGÀY*

*Nguyên tắc chung:*
- Ăn 5-6 bữa nhỏ mỗi ngày để kiểm soát lượng đường trong máu
- Uống ít nhất 2 lít nước mỗi ngày
- Hạn chế muối, đường và dầu mỡ
- Ưu tiên thực phẩm giàu protein và chất xơ
- Tránh đồ chiên rán, đồ ngọt và thức uống có cồn

*THỰC ĐƠN CHI TIẾT:*

*Ngày 1:*
- Sáng: Yến mạch với sữa hạnh nhân + 1 quả táo
- Giữa sáng: 1 hộp sữa chua không đường
- Trưa: Salad gà nướng với rau xanh
- Giữa chiều: 1 nắm hạt dinh dưỡng (hạnh nhân, óc chó)
- Tối: Cá hấp với rau củ + 1/2 chén cơm gạo lứt

*Ngày 2:*
- Sáng: Sinh tố rau xanh với chuối và sữa chua
- Giữa sáng: 2 lát bánh mì nguyên cám với bơ đậu phộng
- Trưa: Thịt gà luộc với rau củ hấp
- Giữa chiều: 1 quả cam hoặc bưởi
- Tối: Đậu hũ xào rau cải + súp rau củ

*Ngày 3:*
- Sáng: Trứng luộc (2 quả) với bánh mì nguyên cám
- Giữa sáng: 1 quả chuối
- Trưa: Bún trộn rau thịt bò ít dầu
- Giữa chiều: Sữa chua Hy Lạp với hạt chia
- Tối: Cá nướng với salad rau

*Ngày 4:*
- Sáng: Cháo yến mạch với quả mọng
- Giữa sáng: 1 quả táo với 1 muỗng bơ hạnh nhân
- Trưa: Cơm gạo lứt với đậu hũ và rau xào
- Giữa chiều: Sinh tố protein (sữa chua + chuối + bột protein)
- Tối: Thịt heo nạc nướng với rau củ

*Ngày 5:*
- Sáng: Bánh pancake yến mạch với quả mọng
- Giữa sáng: Trái cây theo mùa
- Trưa: Bún gạo xào rau củ
- Giữa chiều: Sữa chua với hạt chia
- Tối: Thịt bò xào rau củ với cơm gạo lứt

*Ngày 6:*
- Sáng: Sinh tố protein (sữa chua + chuối + bột protein)
- Giữa sáng: Hạt dinh dưỡng mix
- Trưa: Soup rau củ với thịt gà
- Giữa chiều: Sữa chua với hạt lanh
- Tối: Cá hồi nướng với măng tây và khoai tây

*Ngày 7:*
- Sáng: Bánh pancake yến mạch với quả mọng
- Giữa sáng: Trái cây theo mùa
- Trưa: Bún gạo xào rau củ
- Giữa chiều: Sữa chua với hạt chia
- Tối: Thịt bò xào rau củ với cơm gạo lứt

*Lưu ý:*
- Nên kết hợp với tập thể dục 30 phút mỗi ngày
- Điều chỉnh lượng thức ăn phù hợp với nhu cầu cá nhân
- Có thể thay đổi món ăn trong cùng nhóm thực phẩm

Cửa hàng chúng tôi có đầy đủ các thực phẩm cần thiết cho kế hoạch ăn kiêng này. Bạn có thể tìm mua các sản phẩm như: yến mạch, gạo lứt, hạt dinh dưỡng, sữa hạnh nhân, và các loại rau củ hữu cơ.`;
  
  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'meal_plan_diet'
  };
};

/**
 * Xử lý câu hỏi về thông tin sản phẩm và chính sách đổi trả
 * @returns {object} - Phản hồi cho câu hỏi
 */
const handleProductInfo = () => {
  const message = `Về thông tin sản phẩm và chính sách đổi trả:

1. Thông tin sản phẩm:
   - Tất cả sản phẩm đều có thông tin chi tiết về thành phần, xuất xứ, hạn sử dụng
   - Hình ảnh sản phẩm là hình thật chụp tại cửa hàng
   - Mô tả sản phẩm được kiểm duyệt kỹ để đảm bảo chính xác

2. Chính sách đổi trả khi sản phẩm không đúng mô tả:
   - Bạn có quyền từ chối nhận hàng nếu sản phẩm không đúng như mô tả
   - Hoàn tiền 100% nếu sản phẩm không đúng với thông tin giới thiệu
   - Đổi sản phẩm mới nếu bạn vẫn muốn sử dụng sản phẩm đó
   - Thời hạn khiếu nại: trong vòng 24h đối với thực phẩm tươi, 3 ngày đối với hàng đóng gói

3. Quy trình đổi trả:
   - Chụp ảnh sản phẩm và liên hệ hotline 0326 743391
   - Nhân viên sẽ xác nhận thông tin và hướng dẫn đổi trả
   - Chúng tôi sẽ thu hồi sản phẩm và gửi sản phẩm mới hoặc hoàn tiền

Chúng tôi cam kết cung cấp thông tin sản phẩm chính xác và minh bạch. Nếu có bất kỳ sai sót nào, chúng tôi sẽ chịu hoàn toàn trách nhiệm và đền bù thỏa đáng.`;

  return {
    success: true,
    type: 'text',
    message: message,
    intent: 'faq_product_info'
  };
};

/**
 * Xử lý câu hỏi về thực phẩm dành cho trẻ em
 * @returns {object} - Phản hồi cho câu hỏi
 */
const handleKidsFood = () => {
  const message = `🧒 *THỰC PHẨM DÀNH CHO TRẺ EM*

*1. Thực phẩm tốt cho sự phát triển của trẻ:*
   - Sữa và các sản phẩm từ sữa (sữa tươi, phô mai, sữa chua) - giàu canxi và protein
   - Trứng - nguồn protein chất lượng cao và choline cho phát triển não bộ
   - Cá (đặc biệt là cá hồi, cá ngừ) - giàu DHA và omega-3
   - Thịt nạc - cung cấp protein, sắt và kẽm
   - Đậu và các loại hạt - protein thực vật, chất xơ và khoáng chất

*2. Rau củ quả phù hợp cho trẻ:*
   - Rau xanh (rau chân vịt, cải xoăn) - giàu sắt và vitamin
   - Cà rốt - vitamin A tốt cho mắt
   - Khoai lang - tinh bột phức hợp và vitamin A
   - Bông cải xanh - canxi, vitamin K và chất chống oxy hóa
   - Trái cây tươi (táo, chuối, cam, dâu) - vitamin C và chất xơ

*3. Thực phẩm bổ sung cho trẻ:*
   - Ngũ cốc nguyên hạt - năng lượng bền vững và chất xơ
   - Sữa chua có lợi khuẩn - tốt cho hệ tiêu hóa
   - Các loại hạt (nghiền nhỏ cho trẻ dưới 4 tuổi) - chất béo lành mạnh
   - Nước ép trái cây tự nhiên (hạn chế lượng) - vitamin

*4. Thực phẩm nên hạn chế:*
   - Đồ ngọt và bánh kẹo - hạn chế đường
   - Thức ăn nhanh và đồ chiên rán
   - Nước ngọt và đồ uống có gas
   - Thực phẩm chế biến sẵn có nhiều phụ gia

*5. Lưu ý về chế độ ăn cho trẻ:*
   - Đa dạng thực phẩm để cung cấp đủ dưỡng chất
   - Khẩu phần nhỏ, ăn thường xuyên (3 bữa chính, 2-3 bữa phụ)
   - Đảm bảo đủ nước
   - Tạo thói quen ăn uống lành mạnh từ sớm

Cửa hàng chúng tôi có nhiều sản phẩm phù hợp cho trẻ em như: sữa hữu cơ, ngũ cốc nguyên hạt, trái cây tươi, rau củ hữu cơ và các loại thực phẩm không chứa phụ gia, chất bảo quản.`;

  return {
    success: true,
    type: "text",
    message: message,
    intent: "faq_kids_food"
  };
};

/**
 * Xử lý câu hỏi về thực phẩm dành cho mẹ bầu
 * @returns {object} - Phản hồi cho câu hỏi
 */
const handlePregnantFood = () => {
  const message = `👶 *THỰC PHẨM DÀNH CHO MẸ BẦU*

*1. Thực phẩm giàu axit folic (cần thiết cho sự phát triển của hệ thần kinh thai nhi):*
   - Rau lá xanh đậm: rau chân vịt, cải xoăn, cải bó xôi
   - Trái cây họ cam quýt: cam, bưởi, quýt
   - Đậu và các loại hạt: đậu lăng, đậu gà, hạt hướng dương
   - Ngũ cốc nguyên hạt được bổ sung

*2. Thực phẩm giàu sắt (ngăn ngừa thiếu máu):*
   - Thịt đỏ nạc: thịt bò, thịt cừu
   - Gia cầm: thịt gà, thịt vịt
   - Cá và hải sản: cá hồi, cá ngừ, tôm
   - Rau lá xanh: rau bina, cải xoăn
   - Đậu và các loại hạt: đậu đen, đậu lăng, hạt bí

*3. Thực phẩm giàu canxi (phát triển xương và răng):*
   - Sữa và các sản phẩm từ sữa: sữa, phô mai, sữa chua
   - Rau lá xanh: cải xoăn, cải thìa, rau muống
   - Cá có xương mềm: cá mòi, cá hồi đóng hộp
   - Đậu nành và các sản phẩm từ đậu nành

*4. Thực phẩm giàu DHA và Omega-3 (phát triển não bộ):*
   - Cá béo: cá hồi, cá thu, cá trích
   - Các loại hạt và dầu: hạt óc chó, hạt lanh, dầu oliu
   - Trứng giàu DHA
   - Rong biển và tảo

*5. Thực phẩm giàu protein (phát triển cơ bắp và mô):*
   - Thịt nạc: thịt gà, thịt bò, thịt heo
   - Cá và hải sản: cá hồi, cá ngừ, tôm
   - Trứng: trứng gà, trứng vịt
   - Đậu và các loại hạt: đậu lăng, đậu gà, đậu phụ

*6. Thực phẩm nên hạn chế:*
   - Cá có hàm lượng thủy ngân cao: cá kiếm, cá thu king, cá ngừ vây dài
   - Thịt và hải sản sống hoặc chưa nấu chín
   - Đồ uống có caffeine và cồn
   - Thực phẩm nhiều đường và muối

*Sản phẩm phù hợp cho mẹ bầu tại cửa hàng:*
1. Sữa bầu Enfamama A+ - 350.000đ
2. Ngũ cốc dinh dưỡng cho mẹ bầu - 120.000đ
3. Trà thảo mộc an thai - 85.000đ
4. Viên bổ sung DHA cho bà bầu - 450.000đ
5. Bánh quy dinh dưỡng mẹ bầu - 75.000đ
6. Gạo lứt hữu cơ - 95.000đ/kg

Bạn có thể tìm thấy các sản phẩm này tại cửa hàng hoặc đặt hàng online. Nếu bạn cần tư vấn chi tiết hơn, vui lòng liên hệ hotline 0326 743391.`;

  // Tạo danh sách sản phẩm mẫu cho mẹ bầu
  const products = [
    {
      _id: "pregnant_product_1",
      name: "Sữa bầu Enfamama A+",
      price: 350000,
      image: "https://example.com/images/enfamama.jpg",
      description: "Sữa bầu giàu DHA, axit folic và canxi cho mẹ và bé",
      category: "Sữa bầu"
    },
    {
      _id: "pregnant_product_2",
      name: "Ngũ cốc dinh dưỡng cho mẹ bầu",
      price: 120000,
      image: "https://example.com/images/cereal.jpg",
      description: "Ngũ cốc nguyên hạt giàu dinh dưỡng, bổ sung vitamin và khoáng chất",
      category: "Thực phẩm bổ sung"
    },
    {
      _id: "pregnant_product_3",
      name: "Trà thảo mộc an thai",
      price: 85000,
      image: "https://example.com/images/herbal_tea.jpg",
      description: "Trà thảo mộc giúp an thai, giảm ốm nghén, tốt cho mẹ bầu",
      category: "Đồ uống"
    },
    {
      _id: "pregnant_product_4",
      name: "Viên bổ sung DHA cho bà bầu",
      price: 450000,
      image: "https://example.com/images/dha_supplement.jpg",
      description: "Bổ sung DHA và Omega-3 cho sự phát triển não bộ của thai nhi",
      category: "Thực phẩm bổ sung"
    }
  ];

  return {
    success: true,
    type: "productSearch",
    message: message,
    products: products,
    intent: "faq_pregnant_food"
  };
};

/**
 * Xử lý câu hỏi về thực phẩm cho bệnh tiểu đường
 * @returns {object} - Phản hồi cho câu hỏi
 */
const handleDiabetesFood = () => {
  const message = `🩺 *THỰC PHẨM CHO NGƯỜI BỆNH TIỂU ĐƯỜNG*

*Thực phẩm nên ăn:*
1. Rau xanh: bông cải xanh, rau chân vịt, cải xoăn, cải thìa - giàu chất xơ, ít carbs
2. Protein lành mạnh: thịt gà không da, thịt bò nạc, cá (đặc biệt là cá béo như cá hồi, cá ngừ)
3. Chất béo lành mạnh: bơ, dầu oliu, các loại hạt (hạnh nhân, óc chó)
4. Trái cây ít đường: việt quất, dâu tây, táo, cam (với lượng vừa phải)
5. Ngũ cốc nguyên hạt: yến mạch, gạo lứt, quinoa
6. Các loại đậu: đậu đen, đậu gà, đậu lăng
7. Sữa và sản phẩm từ sữa ít béo: sữa chua không đường, phô mai ít béo

*Thực phẩm nên hạn chế:*
1. Thực phẩm giàu carbohydrate tinh chế: bánh mì trắng, gạo trắng, mì
2. Đồ ngọt: bánh kẹo, nước ngọt, đồ uống có đường
3. Trái cây khô và nước ép trái cây
4. Thức ăn nhanh và đồ chiên rán
5. Đồ uống có cồn
6. Thực phẩm chế biến sẵn và đóng hộp
7. Các loại bơ thực vật giàu chất béo trans

*Lời khuyên dinh dưỡng:*
- Chia nhỏ bữa ăn trong ngày (ăn 5-6 bữa nhỏ)
- Kiểm soát khẩu phần ăn
- Uống đủ nước
- Duy trì lịch ăn đều đặn
- Theo dõi lượng carbs nạp vào
- Lưu ý chỉ số đường huyết (GI) của thực phẩm

*Sản phẩm phù hợp tại cửa hàng:*
1. Gạo lứt hữu cơ - 95.000đ/kg
2. Yến mạch nguyên hạt - 45.000đ/gói
3. Dầu oliu Extra Virgin - 150.000đ/chai
4. Bơ - 35.000đ/quả
5. Hạt óc chó - 120.000đ/hộp
6. Sữa chua không đường - 25.000đ/hộp 4 cốc
7. Thực phẩm bổ sung cho người tiểu đường - 350.000đ/hộp

Lưu ý: Nên tham khảo ý kiến bác sĩ hoặc chuyên gia dinh dưỡng để có chế độ ăn phù hợp với tình trạng bệnh cụ thể.`;

  // Tạo danh sách một số sản phẩm mẫu cho người tiểu đường
  const products = [
    {
      _id: "diabetes_product_1",
      name: "Gạo lứt hữu cơ",
      price: 95000,
      image: "https://example.com/images/brown_rice.jpg",
      description: "Gạo lứt hữu cơ nguyên hạt, chỉ số đường huyết thấp, phù hợp cho người tiểu đường",
      category: "Ngũ cốc"
    },
    {
      _id: "diabetes_product_2",
      name: "Yến mạch nguyên hạt",
      price: 45000,
      image: "https://example.com/images/oats.jpg",
      description: "Yến mạch nguyên hạt giàu chất xơ, chỉ số đường huyết thấp",
      category: "Ngũ cốc"
    },
    {
      _id: "diabetes_product_3",
      name: "Trà thảo mộc giảm đường huyết",
      price: 85000,
      image: "https://example.com/images/herbal_tea_diabetes.jpg",
      description: "Trà thảo mộc giúp ổn định đường huyết, từ các loại thảo mộc tự nhiên",
      category: "Đồ uống"
    },
    {
      _id: "diabetes_product_4",
      name: "Sữa chua không đường",
      price: 25000,
      image: "https://example.com/images/yogurt_no_sugar.jpg",
      description: "Sữa chua không đường, giàu protein và lợi khuẩn, phù hợp cho người tiểu đường",
      category: "Sữa & Sản phẩm từ sữa"
    }
  ];

  return {
    success: true,
    type: "productSearch",
    message: message,
    products: products,
    intent: "faq_diabetes_food"
  };
};

/**
 * Xử lý câu hỏi về thực phẩm cho bệnh huyết áp cao
 * @returns {object} - Phản hồi cho câu hỏi
 */
const handleHypertensionFood = () => {
  const message = `🩺 *THỰC PHẨM CHO NGƯỜI HUYẾT ÁP CAO*

*Thực phẩm nên ăn:*
1. Rau xanh lá: rau bina, cải xoăn, cải thìa - giàu kali, magiê và chất xơ
2. Trái cây: chuối, cam, kiwi, dưa hấu - giàu kali, giúp cân bằng với natri
3. Ngũ cốc nguyên hạt: gạo lứt, yến mạch, bánh mì nguyên cám
4. Thực phẩm giàu protein thực vật: đậu, các loại hạt, đậu phụ
5. Sữa và sản phẩm từ sữa ít béo: sữa chua, phô mai ít béo
6. Cá (đặc biệt là cá béo): cá hồi, cá thu, cá trích - giàu omega-3
7. Thực phẩm giàu magiê: các loại hạt, rau xanh, ngũ cốc nguyên hạt
8. Chocolate đen (cacao >70%)
9. Tỏi, nghệ, gừng

*Thực phẩm nên hạn chế:*
1. Thực phẩm có hàm lượng muối/natri cao: thực phẩm đóng hộp, đồ ăn nhanh
2. Thịt đỏ và thịt chế biến: thịt xông khói, xúc xích, giăm bông
3. Đồ uống có cồn
4. Đồ ngọt và nước ngọt
5. Thực phẩm giàu caffeine: cà phê, trà đặc, nước tăng lực
6. Dầu mỡ động vật và chất béo trans
7. Thực phẩm chiên rán

*Lời khuyên dinh dưỡng:*
- Tuân theo chế độ ăn DASH (Dietary Approaches to Stop Hypertension)
- Giảm lượng muối xuống dưới 5g/ngày (khoảng 1 thìa cà phê)
- Tăng cường thực phẩm giàu kali, magiê và canxi
- Duy trì cân nặng hợp lý
- Uống đủ nước
- Tập thể dục đều đặn

*Sản phẩm phù hợp tại cửa hàng:*
1. Muối giảm natri - 35.000đ/hộp
2. Dầu oliu Extra Virgin - 150.000đ/chai
3. Yến mạch nguyên hạt - 45.000đ/gói
4. Chuối hữu cơ - 15.000đ/nải
5. Cá hồi phi lê - 180.000đ/khay
6. Trà thảo mộc hạ huyết áp - 85.000đ/hộp
7. Các loại hạt không muối - 120.000đ/hộp

Lưu ý: Nên tham khảo ý kiến bác sĩ hoặc chuyên gia dinh dưỡng để có chế độ ăn phù hợp với tình trạng bệnh cụ thể.`;

  // Tạo danh sách một số sản phẩm mẫu cho người huyết áp cao
  const products = [
    {
      _id: "hypertension_product_1",
      name: "Muối giảm natri",
      price: 35000,
      image: "https://example.com/images/low_sodium_salt.jpg",
      description: "Muối giảm 30% natri, giúp giảm nguy cơ tăng huyết áp",
      category: "Gia vị"
    },
    {
      _id: "hypertension_product_2",
      name: "Trà thảo mộc hạ huyết áp",
      price: 85000,
      image: "https://example.com/images/herbal_tea_bp.jpg",
      description: "Trà thảo mộc giúp ổn định huyết áp từ các loại thảo dược tự nhiên",
      category: "Đồ uống"
    },
    {
      _id: "hypertension_product_3",
      name: "Thực phẩm bổ sung Omega-3",
      price: 250000,
      image: "https://example.com/images/omega3.jpg",
      description: "Bổ sung Omega-3 từ dầu cá, hỗ trợ sức khỏe tim mạch và huyết áp",
      category: "Thực phẩm bổ sung"
    },
    {
      _id: "hypertension_product_4",
      name: "Hỗn hợp hạt không muối",
      price: 120000,
      image: "https://example.com/images/mixed_nuts.jpg",
      description: "Các loại hạt tự nhiên không muối, giàu magiê và chất béo lành mạnh",
      category: "Hạt & Đậu"
    }
  ];

  return {
    success: true,
    type: "productSearch",
    message: message,
    products: products,
    intent: "faq_hypertension_food"
  };
};

/**
 * Xử lý câu hỏi về thực phẩm cho bệnh tim mạch
 * @returns {object} - Phản hồi cho câu hỏi
 */
const handleHeartFood = () => {
  const message = `🩺 *THỰC PHẨM CHO NGƯỜI BỆNH TIM MẠCH*

*Thực phẩm nên ăn:*
1. Cá béo: cá hồi, cá thu, cá mòi, cá trích - giàu omega-3, giúp giảm viêm và hạ cholesterol
2. Quả mọng: việt quất, dâu tây, mâm xôi - chứa nhiều chất chống oxy hóa
3. Các loại hạt và các loại đậu: hạnh nhân, óc chó, hạt lanh, đậu đen, đậu gà
4. Rau xanh lá: rau bina, cải xoăn, xà lách - giàu vitamin K và nitrat
5. Trái cây: cam, táo, lê, bơ - giàu chất xơ hòa tan
6. Ngũ cốc nguyên hạt: yến mạch, gạo lứt, quinoa
7. Dầu oliu extra virgin - chứa chất béo đơn không bão hòa
8. Sôcôla đen (>70% cacao)
9. Tỏi và hành

*Thực phẩm nên hạn chế:*
1. Thực phẩm giàu chất béo bão hòa: thịt đỏ béo, da động vật
2. Thực phẩm chứa chất béo trans: đồ chiên rán, thực phẩm chế biến sẵn
3. Natri (muối): thực phẩm đóng hộp, mì gói, thức ăn nhanh
4. Đường tinh luyện: bánh ngọt, nước ngọt, thực phẩm chế biến sẵn
5. Rượu bia và đồ uống có cồn
6. Thực phẩm chiên rán
7. Thịt chế biến: xúc xích, thịt nguội, giăm bông

*Lời khuyên dinh dưỡng:*
- Nên theo chế độ ăn Mediterranean hoặc DASH
- Hạn chế lượng muối (dưới 5g/ngày)
- Ưu tiên chế biến bằng cách hấp, luộc hoặc nướng
- Chia nhỏ bữa ăn, tránh ăn quá no
- Uống đủ nước (1.5-2 lít/ngày)
- Kiểm soát cân nặng
- Tập thể dục đều đặn

*Sản phẩm phù hợp tại cửa hàng:*
1. Dầu oliu Extra Virgin - 150.000đ/chai
2. Hạt óc chó - 120.000đ/hộp
3. Cá hồi phi lê - 180.000đ/khay
4. Yến mạch nguyên hạt - 45.000đ/gói
5. Việt quất sấy khô - 85.000đ/gói
6. Chocolate đen 85% cacao - 65.000đ/thanh
7. Trà thảo mộc tim mạch - 95.000đ/hộp
8. Thực phẩm bổ sung CoQ10 - 320.000đ/lọ
9. Thực phẩm bổ sung Omega-3 - 250.000đ/lọ

Lưu ý: Nên tham khảo ý kiến bác sĩ hoặc chuyên gia dinh dưỡng để có chế độ ăn phù hợp với tình trạng bệnh cụ thể.`;

  // Tạo danh sách một số sản phẩm mẫu cho người bệnh tim mạch
  const products = [
    {
      _id: "heart_product_1",
      name: "Dầu oliu Extra Virgin",
      price: 150000,
      image: "https://example.com/images/olive_oil.jpg",
      description: "Dầu oliu nguyên chất, giàu chất béo không bão hòa đơn, tốt cho tim mạch",
      category: "Dầu ăn"
    },
    {
      _id: "heart_product_2",
      name: "Thực phẩm bổ sung Omega-3",
      price: 250000,
      image: "https://example.com/images/omega3.jpg",
      description: "Bổ sung Omega-3 từ dầu cá, hỗ trợ sức khỏe tim mạch",
      category: "Thực phẩm bổ sung"
    },
    {
      _id: "heart_product_3",
      name: "Trà thảo mộc tim mạch",
      price: 95000,
      image: "https://example.com/images/heart_herbal_tea.jpg",
      description: "Trà thảo mộc hỗ trợ sức khỏe tim mạch từ các loại thảo dược tự nhiên",
      category: "Đồ uống"
    },
    {
      _id: "heart_product_4",
      name: "Hạt óc chó",
      price: 120000,
      image: "https://example.com/images/walnuts.jpg",
      description: "Hạt óc chó nguyên chất, giàu omega-3 thực vật và chất chống oxy hóa",
      category: "Hạt & Đậu"
    }
  ];

  return {
    success: true,
    type: "productSearch",
    message: message,
    products: products,
    intent: "faq_heart_food"
  };
};

/**
 * Xử lý câu hỏi về thực phẩm cho bệnh gan nhiễm mỡ
 * @returns {object} - Phản hồi cho câu hỏi
 */
const handleLiverFood = () => {
  const message = `🩺 *THỰC PHẨM CHO NGƯỜI BỆNH GAN NHIỄM MỠ*

*Thực phẩm nên ăn:*
1. Cà phê: Nghiên cứu cho thấy cà phê có thể giảm tích tụ mỡ trong gan
2. Trà xanh: Giàu chất chống oxy hóa, hỗ trợ chức năng gan
3. Rau xanh lá: Rau bina, cải xoăn - chứa nitrate và chất chống oxy hóa
4. Quả mọng: Việt quất, dâu tây - giàu chất chống oxy hóa polyphenol
5. Các loại hạt: Óc chó, hạnh nhân - chứa vitamin E
6. Cá béo: Cá hồi, cá thu, cá trích - giàu omega-3
7. Dầu oliu: Giàu chất béo đơn không bão hòa
8. Bơ: Chứa chất béo lành mạnh và chất xơ
9. Ngũ cốc nguyên hạt: Gạo lứt, yến mạch
10. Tỏi: Có tác dụng giải độc gan

*Thực phẩm nên hạn chế:*
1. Đường tinh luyện và ngô fructose cao (HFCS)
2. Thực phẩm chế biến sẵn, thức ăn nhanh
3. Bánh kẹo và đồ ngọt
4. Nước ngọt và đồ uống có đường
5. Thịt đỏ và thịt chế biến
6. Đồ chiên rán
7. Muối và thực phẩm nhiều muối
8. Đồ uống có cồn
9. Thực phẩm giàu chất béo bão hòa

*Lời khuyên dinh dưỡng:*
- Giảm lượng carbohydrate tinh chế
- Tăng cường protein nạc
- Giảm cân nếu thừa cân/béo phì
- Tăng cường chất xơ trong chế độ ăn
- Uống nhiều nước
- Giảm kích thước khẩu phần ăn
- Ưu tiên chế biến bằng hấp, luộc, hầm

*Sản phẩm phù hợp tại cửa hàng:*
1. Trà xanh hữu cơ - 65.000đ/hộp
2. Dầu oliu Extra Virgin - 150.000đ/chai
3. Cà phê nguyên chất - 85.000đ/gói
4. Gạo lứt hữu cơ - 95.000đ/kg
5. Hạt óc chó - 120.000đ/hộp
6. Việt quất sấy khô - 85.000đ/gói
7. Viên bổ gan Milk Thistle - 280.000đ/hộp
8. Bột cà chua - 75.000đ/hộp
9. Cà tím hữu cơ - 45.000đ/kg

Lưu ý: Nên tham khảo ý kiến bác sĩ hoặc chuyên gia dinh dưỡng để có chế độ ăn phù hợp với tình trạng bệnh cụ thể.`;

  // Tạo danh sách một số sản phẩm mẫu cho người bệnh gan nhiễm mỡ
  const products = [
    {
      _id: "liver_product_1",
      name: "Trà xanh hữu cơ",
      price: 65000,
      image: "https://example.com/images/green_tea.jpg",
      description: "Trà xanh hữu cơ nguyên lá, giàu chất chống oxy hóa, tốt cho gan",
      category: "Đồ uống"
    },
    {
      _id: "liver_product_2",
      name: "Viên bổ gan Milk Thistle",
      price: 280000,
      image: "https://example.com/images/milk_thistle.jpg",
      description: "Thực phẩm bổ sung chiết xuất từ cây kế sữa, hỗ trợ chức năng gan",
      category: "Thực phẩm bổ sung"
    },
    {
      _id: "liver_product_3",
      name: "Dầu oliu Extra Virgin",
      price: 150000,
      image: "https://example.com/images/olive_oil.jpg",
      description: "Dầu oliu nguyên chất, giàu chất béo không bão hòa đơn, tốt cho gan",
      category: "Dầu ăn"
    },
    {
      _id: "liver_product_4",
      name: "Cà phê nguyên chất",
      price: 85000,
      image: "https://example.com/images/coffee.jpg",
      description: "Cà phê nguyên chất, không pha trộn, hỗ trợ giảm mỡ gan",
      category: "Đồ uống"
    }
  ];

  return {
    success: true,
    type: "productSearch",
    message: message,
    products: products,
    intent: "faq_liver_food"
  };
};

/**
 * Xử lý câu hỏi về thực phẩm cho bệnh gout
 * @returns {object} - Phản hồi cho câu hỏi
 */
const handleGoutFood = () => {
  const message = `🩺 *THỰC PHẨM CHO NGƯỜI BỆNH GOUT*

*Thực phẩm nên ăn:*
1. Rau xanh: Bông cải xanh, rau bina, xà lách - ít purin
2. Trái cây (hầu hết): Đặc biệt trái cây có tính kiềm như cherry, dâu tây
3. Sản phẩm từ sữa ít béo: Sữa, phô mai, sữa chua
4. Ngũ cốc nguyên hạt: Gạo lứt, yến mạch, quinoa
5. Protein thực vật: Đậu phụ (vừa phải), đậu lăng
6. Trứng: Nguồn protein tốt với hàm lượng purin thấp
7. Thịt gia cầm (số lượng vừa phải): Thịt gà, thịt vịt - không da
8. Chất béo lành mạnh: Dầu oliu, dầu hướng dương
9. Nước: Uống nhiều nước (8-10 ly/ngày)

*Thực phẩm nên hạn chế:*
1. Thịt đỏ: Bò, cừu, heo - giàu purin
2. Hải sản và nội tạng: Tôm, cua, sò, gan, thận, tim - rất giàu purin
3. Thủy sản nhỏ: Cá trích, cá mòi, cá cơm
4. Đồ uống có cồn: Đặc biệt là bia - gây tăng sản xuất axit uric
5. Đồ uống có đường: Nước ngọt, nước trái cây có đường
6. Một số rau có hàm lượng purin cao: Nấm, măng tây, đậu Hà Lan
7. Thực phẩm chế biến sẵn và thức ăn nhanh
8. Bánh ngọt và thực phẩm nhiều đường

*Lời khuyên dinh dưỡng:*
- Uống nhiều nước để giúp thải axit uric
- Duy trì cân nặng hợp lý
- Giảm lượng protein động vật, tăng protein từ thực vật
- Tránh nhịn đói hoặc ăn kiêng cực đoan
- Ăn nhiều thực phẩm có tính kiềm (rau và trái cây)
- Giảm lượng đường tinh luyện
- Tạm ngưng sử dụng rượu bia trong giai đoạn cấp

*Sản phẩm phù hợp tại cửa hàng:*
1. Trà thảo mộc giảm axit uric - 85.000đ/hộp
2. Anh đào chua (Cherry) đóng hộp - 120.000đ/hộp
3. Sữa chua không đường - 25.000đ/hộp 4 cốc
4. Dầu oliu Extra Virgin - 150.000đ/chai
5. Yến mạch nguyên hạt - 45.000đ/gói
6. Thực phẩm bổ sung giảm axit uric - 290.000đ/hộp
7. Nước ép cherry không đường - 65.000đ/chai
8. Gạo lứt hữu cơ - 95.000đ/kg

Lưu ý: Nên tham khảo ý kiến bác sĩ hoặc chuyên gia dinh dưỡng để có chế độ ăn phù hợp với tình trạng bệnh cụ thể.`;

  // Tạo danh sách một số sản phẩm mẫu cho người bệnh gout
  const products = [
    {
      _id: "gout_product_1",
      name: "Trà thảo mộc giảm axit uric",
      price: 85000,
      image: "https://example.com/images/herbal_tea_gout.jpg",
      description: "Trà thảo mộc hỗ trợ giảm axit uric trong máu, làm từ các loại thảo dược tự nhiên",
      category: "Đồ uống"
    },
    {
      _id: "gout_product_2",
      name: "Anh đào chua đóng hộp",
      price: 120000,
      image: "https://example.com/images/cherries.jpg",
      description: "Anh đào chua nhập khẩu, giúp giảm viêm và axit uric, tốt cho người bị gout",
      category: "Trái cây"
    },
    {
      _id: "gout_product_3",
      name: "Thực phẩm bổ sung giảm axit uric",
      price: 290000,
      image: "https://example.com/images/uric_acid_supplement.jpg",
      description: "Thực phẩm bổ sung giúp hỗ trợ giảm axit uric trong máu và các triệu chứng gout",
      category: "Thực phẩm bổ sung"
    },
    {
      _id: "gout_product_4",
      name: "Nước ép cherry không đường",
      price: 65000,
      image: "https://example.com/images/cherry_juice.jpg",
      description: "Nước ép cherry tự nhiên 100%, không đường, hỗ trợ giảm triệu chứng gout",
      category: "Đồ uống"
    }
  ];

  return {
    success: true,
    type: "productSearch",
    message: message,
    products: products,
    intent: "faq_gout_food"
  };
};

/**
 * Xử lý câu hỏi về thực phẩm cho bệnh tiêu hóa
 * @returns {object} - Phản hồi cho câu hỏi
 */
const handleDigestionFood = () => {
  const message = `🩺 *THỰC PHẨM CHO NGƯỜI BỆNH TIÊU HÓA*

*Thực phẩm nên ăn khi bị đau dạ dày:*
1. Cháo, súp: Dễ tiêu hóa, giảm áp lực lên dạ dày
2. Trái cây ít axit: Chuối chín, dưa hấu, dưa lưới
3. Rau luộc mềm: Cà rốt, bí đỏ, khoai tây
4. Ngũ cốc nguyên hạt mềm: Yến mạch nấu nhừ, cơm gạo lứt nấu mềm
5. Thịt nạc hấp hoặc luộc: Thịt gà không da, cá hấp
6. Sữa chua và thực phẩm lên men: Hỗ trợ hệ tiêu hóa
7. Trà thảo mộc không caffeine: Trà hoa cúc, trà gừng
8. Thực phẩm chứa probiotic: Kim chi, dưa chua

*Thực phẩm nên hạn chế:*
1. Thực phẩm cay nóng: Ớt, tiêu, các loại gia vị mạnh
2. Thức ăn nhiều dầu mỡ và chiên rán
3. Thức ăn axit: Cà chua, cam, chanh, dứa
4. Đồ uống có caffeine: Cà phê, trà đặc, nước tăng lực
5. Đồ uống có gas và rượu bia
6. Thực phẩm chứa nhiều đường
7. Sữa và sản phẩm từ sữa nhiều béo (với người không dung nạp lactose)
8. Thực phẩm chế biến sẵn và thức ăn nhanh

*Lời khuyên cho từng vấn đề tiêu hóa:*

*1. Đau dạ dày/Viêm loét:*
- Ăn nhiều bữa nhỏ trong ngày
- Nhai kỹ, ăn chậm
- Tránh nằm ngay sau khi ăn
- Uống nhiều nước (ngoài bữa ăn)
- Tránh thức ăn kích thích

*2. Trào ngược dạ dày:*
- Tránh ăn 2-3 giờ trước khi ngủ
- Hạn chế thức ăn béo, cay, axit
- Gối cao đầu khi ngủ
- Tránh quần áo bó sát vùng bụng

*3. Táo bón:*
- Tăng cường chất xơ (rau xanh, trái cây)
- Uống đủ nước
- Bổ sung probiotics
- Tập thể dục đều đặn

*4. Tiêu chảy:*
- Ăn thực phẩm ít chất xơ
- Ăn thức ăn mềm, dễ tiêu
- Bù nước và điện giải
- Tránh sữa, caffeine và thực phẩm cay

*Sản phẩm phù hợp tại cửa hàng:*
1. Trà thảo mộc dạ dày - 85.000đ/hộp
2. Sữa chua probiotic - 35.000đ/hộp 4 cốc
3. Yến mạch hữu cơ - 45.000đ/gói
4. Cháo dinh dưỡng ăn liền - 15.000đ/gói
5. Nước dừa nguyên chất - 25.000đ/hộp
6. Bột mầm lúa mì (chất xơ) - 120.000đ/hộp
7. Thực phẩm bổ sung men tiêu hóa - 180.000đ/hộp
8. Mật ong nguyên chất - 95.000đ/chai

Lưu ý: Nên tham khảo ý kiến bác sĩ hoặc chuyên gia dinh dưỡng để có chế độ ăn phù hợp với tình trạng bệnh cụ thể.`;

  // Tạo danh sách một số sản phẩm mẫu cho người bệnh tiêu hóa
  const products = [
    {
      _id: "digestion_product_1",
      name: "Trà thảo mộc dạ dày",
      price: 85000,
      image: "https://example.com/images/stomach_herbal_tea.jpg",
      description: "Trà thảo mộc hỗ trợ sức khỏe dạ dày, làm từ gừng, cam thảo và các loại thảo dược tự nhiên",
      category: "Đồ uống"
    },
    {
      _id: "digestion_product_2",
      name: "Sữa chua probiotic",
      price: 35000,
      image: "https://example.com/images/probiotic_yogurt.jpg",
      description: "Sữa chua giàu men vi sinh, hỗ trợ hệ tiêu hóa khỏe mạnh",
      category: "Sữa & Sản phẩm từ sữa"
    },
    {
      _id: "digestion_product_3",
      name: "Thực phẩm bổ sung men tiêu hóa",
      price: 180000,
      image: "https://example.com/images/digestive_enzymes.jpg",
      description: "Thực phẩm bổ sung men tiêu hóa, hỗ trợ tiêu hóa thức ăn và giảm các triệu chứng khó tiêu",
      category: "Thực phẩm bổ sung"
    },
    {
      _id: "digestion_product_4",
      name: "Bột mầm lúa mì",
      price: 120000,
      image: "https://example.com/images/wheat_germ.jpg",
      description: "Bột mầm lúa mì giàu chất xơ, hỗ trợ nhu động ruột và phòng ngừa táo bón",
      category: "Thực phẩm bổ sung"
    }
  ];

  return {
    success: true,
    type: "productSearch",
    message: message,
    products: products,
    intent: "faq_digestion_food"
  };
};

/**
 * Xử lý câu hỏi về thực phẩm tăng cường miễn dịch
 * @returns {object} - Phản hồi cho câu hỏi
 */
const handleImmuneFood = () => {
  const message = `🩺 *THỰC PHẨM TĂNG CƯỜNG HỆ MIỄN DỊCH*

*Thực phẩm nên ăn:*
1. Trái cây giàu vitamin C: Cam, chanh, bưởi, kiwi, dâu tây
2. Rau lá xanh đậm: Rau bina, cải xoăn, cải bó xôi - giàu vitamin A, C và chất chống oxy hóa
3. Tỏi và hành: Chứa allicin, có tính kháng khuẩn và kháng virus
4. Gừng: Chống viêm và giúp giảm đau họng
5. Nghệ: Có chứa curcumin giúp chống viêm và tăng cường miễn dịch
6. Thực phẩm lên men: Sữa chua, kim chi, dưa chua - giàu probiotic
7. Trà xanh: Chứa EGCG, chất chống oxy hóa mạnh
8. Nấm: Nấm shiitake, nấm hương - kích thích hệ miễn dịch
9. Các loại hạt: Hạnh nhân, hạt điều - giàu vitamin E
10. Các loại hạt và thực phẩm giàu kẽm: Hạt bí ngô, hạt vừng, các loại đậu

*Thực phẩm nên hạn chế:*
1. Thực phẩm chế biến sẵn và đồ ăn nhanh
2. Thực phẩm có nhiều đường tinh luyện
3. Rượu bia và đồ uống có cồn
4. Thực phẩm chiên rán nhiều dầu mỡ
5. Thực phẩm giàu muối và chất bảo quản
6. Đồ uống có caffeine (với lượng cao)
7. Bánh kẹo và thức ăn có nhiều chất phụ gia

*Lời khuyên dinh dưỡng:*
- Uống đủ nước (2-3 lít/ngày)
- Đa dạng hóa chế độ ăn với nhiều màu sắc thực phẩm
- Bổ sung đủ protein
- Hạn chế các nguồn đường tinh luyện
- Kiểm soát stress và ngủ đủ giấc
- Tập thể dục vừa phải và đều đặn
- Duy trì cân nặng hợp lý

*Sản phẩm phù hợp tại cửa hàng:*
1. Trà xanh hữu cơ - 65.000đ/hộp
2. Mật ong nguyên chất - 95.000đ/chai
3. Sữa chua probiotic - 35.000đ/hộp 4 cốc
4. Vitamin C tự nhiên - 180.000đ/hộp
5. Nước ép hoa quả tự nhiên - 45.000đ/chai
6. Hỗn hợp các loại hạt - 120.000đ/hộp
7. Nấm hương khô - 85.000đ/hộp
8. Tinh bột nghệ - 75.000đ/hộp
9. Trà thảo mộc tăng đề kháng - 85.000đ/hộp
10. Thực phẩm bổ sung kẽm - 150.000đ/hộp

Lưu ý: Chế độ ăn uống cân bằng kết hợp với lối sống lành mạnh là cách tốt nhất để tăng cường hệ miễn dịch.`;

  // Tạo danh sách một số sản phẩm mẫu cho tăng cường miễn dịch
  const products = [
    {
      _id: "immune_product_1",
      name: "Vitamin C tự nhiên",
      price: 180000,
      image: "https://example.com/images/vitamin_c.jpg",
      description: "Thực phẩm bổ sung vitamin C từ nguồn tự nhiên, hỗ trợ tăng cường hệ miễn dịch",
      category: "Thực phẩm bổ sung"
    },
    {
      _id: "immune_product_2",
      name: "Trà thảo mộc tăng đề kháng",
      price: 85000,
      image: "https://example.com/images/immune_tea.jpg",
      description: "Trà thảo mộc kết hợp echinacea, gừng và các loại thảo dược giúp tăng cường đề kháng",
      category: "Đồ uống"
    },
    {
      _id: "immune_product_3",
      name: "Tinh bột nghệ",
      price: 75000,
      image: "https://example.com/images/turmeric.jpg",
      description: "Tinh bột nghệ nguyên chất, giàu curcumin, hỗ trợ chống viêm và tăng cường miễn dịch",
      category: "Thực phẩm bổ sung"
    },
    {
      _id: "immune_product_4",
      name: "Mật ong nguyên chất",
      price: 95000,
      image: "https://example.com/images/honey.jpg",
      description: "Mật ong nguyên chất từ rừng, không pha trộn, giàu enzyme và chất chống oxy hóa",
      category: "Thực phẩm"
    }
  ];

  return {
    success: true,
    type: "productSearch",
    message: message,
    products: products,
    intent: "faq_immune_food"
  };
};

/**
 * Xử lý câu hỏi về thực phẩm cho bệnh xương khớp
 * @returns {object} - Phản hồi cho câu hỏi
 */
const handleJointFood = () => {
  const message = `🩺 *THỰC PHẨM CHO NGƯỜI BỆNH XƯƠNG KHỚP*

*Thực phẩm nên ăn:*
1. Cá béo: Cá hồi, cá thu, cá mòi - giàu omega-3, chống viêm
2. Các loại quả mọng: Việt quất, dâu tây, phúc bồn tử - giàu chất chống oxy hóa
3. Thực phẩm giàu canxi: Sữa, phô mai, sữa chua, rau lá xanh đậm
4. Thực phẩm giàu vitamin D: Cá béo, lòng đỏ trứng, nấm
5. Thực phẩm giàu vitamin K: Rau lá xanh đậm, bông cải xanh
6. Thực phẩm giàu magiê: Các loại hạt, rau lá xanh, chuối
7. Thực phẩm giàu silicon: Chôm chôm, chuối, nho, đậu Hà Lan
8. Trà xanh: Giàu chất chống oxy hóa
9. Gia vị chống viêm: Nghệ, gừng, quế
10. Thực phẩm giàu collagen: Súp xương, thịt gà có da

*Thực phẩm nên hạn chế:*
1. Thực phẩm chế biến sẵn: Nhiều chất bảo quản và natri
2. Đường tinh luyện: Bánh ngọt, kẹo, nước ngọt
3. Chất béo trans: Thực phẩm chiên rán, bánh quy công nghiệp
4. Rượu bia và đồ uống có cồn
5. Muối và thực phẩm nhiều muối
6. Thịt đỏ (lượng lớn)
7. Thực phẩm nhiều purin (với người bị gout): Nội tạng, hải sản
8. Cà phê và đồ uống chứa caffeine (lượng lớn)

*Lời khuyên dinh dưỡng:*
- Duy trì cân nặng hợp lý
- Uống đủ nước
- Kiểm soát lượng canxi và vitamin D phù hợp
- Tăng cường thực phẩm chống viêm tự nhiên
- Bổ sung collagen từ thực phẩm tự nhiên
- Kết hợp với vận động nhẹ nhàng và đều đặn
- Tránh nhịn đói kéo dài

*Sản phẩm phù hợp tại cửa hàng:*
1. Viên bổ sung Canxi + D3 - 220.000đ/hộp
2. Tinh dầu cá omega-3 - 250.000đ/lọ
3. Collagen thủy phân - 380.000đ/hộp
4. Tinh bột nghệ - 75.000đ/hộp
5. Trà xanh hữu cơ - 65.000đ/hộp
6. Hạt óc chó - 120.000đ/hộp
7. Sữa hạt giàu canxi - 45.000đ/hộp
8. Bột súp xương hầm - 85.000đ/hộp
9. Thực phẩm bổ sung Vitamin K2 - 180.000đ/lọ
10. Thực phẩm bổ sung Glucosamine & MSM - 320.000đ/hộp

Lưu ý: Nên tham khảo ý kiến bác sĩ hoặc chuyên gia dinh dưỡng để có chế độ ăn phù hợp với tình trạng bệnh cụ thể.`;

  // Tạo danh sách một số sản phẩm mẫu cho người bệnh xương khớp
  const products = [
    {
      _id: "joint_product_1",
      name: "Viên bổ sung Canxi + D3",
      price: 220000,
      image: "https://example.com/images/calcium_d3.jpg",
      description: "Thực phẩm bổ sung canxi và vitamin D3 giúp tăng cường sức khỏe xương khớp",
      category: "Thực phẩm bổ sung"
    },
    {
      _id: "joint_product_2",
      name: "Thực phẩm bổ sung Glucosamine & MSM",
      price: 320000,
      image: "https://example.com/images/glucosamine.jpg",
      description: "Bổ sung glucosamine và MSM giúp hỗ trợ sức khỏe sụn khớp và giảm đau khớp",
      category: "Thực phẩm bổ sung"
    },
    {
      _id: "joint_product_3",
      name: "Collagen thủy phân",
      price: 380000,
      image: "https://example.com/images/collagen.jpg",
      description: "Collagen thủy phân hấp thu tốt, giúp tăng cường sụn khớp và giảm triệu chứng thoái hóa khớp",
      category: "Thực phẩm bổ sung"
    },
    {
      _id: "joint_product_4",
      name: "Tinh dầu cá omega-3",
      price: 250000,
      image: "https://example.com/images/fish_oil.jpg",
      description: "Tinh dầu cá giàu omega-3, giúp giảm viêm và cải thiện sức khỏe xương khớp",
      category: "Thực phẩm bổ sung"
    }
  ];

  return {
    success: true,
    type: "productSearch",
    message: message,
    products: products,
    intent: "faq_joint_food"
  };
};

/**
 * Xử lý câu hỏi về thực phẩm cho người cholesterol cao
 * @returns {object} - Phản hồi cho câu hỏi
 */
const handleCholesterolFood = () => {
  const message = `🩺 *THỰC PHẨM CHO NGƯỜI CHOLESTEROL CAO*

*Thực phẩm nên ăn:*
1. Yến mạch và các ngũ cốc nguyên hạt: Giàu beta-glucan, giúp giảm cholesterol
2. Các loại đậu: Đậu đỏ, đậu đen, đậu lăng - giàu chất xơ hòa tan
3. Trái cây: Táo, lê, cam, đặc biệt là quả bơ - chứa chất béo đơn không bão hòa
4. Các loại hạt: Hạnh nhân, óc chó, hạt lanh - giàu phytosterol
5. Dầu oliu: Giàu chất béo đơn không bão hòa
6. Cá béo: Cá hồi, cá thu, cá trích - giàu omega-3
7. Rau xanh: Rau bina, cải xoăn, bông cải xanh
8. Trà xanh: Có thể giúp hạ cholesterol
9. Tỏi: Chứa allicin, giúp giảm cholesterol
10. Thực phẩm giàu chất xơ: Đặc biệt là chất xơ hòa tan từ các loại rau, trái cây, ngũ cốc

*Thực phẩm nên hạn chế:*
1. Thực phẩm giàu cholesterol: Lòng đỏ trứng, nội tạng động vật
2. Thịt đỏ béo và thịt chế biến: Xúc xích, thịt xông khói, giăm bông
3. Thực phẩm chiên rán
4. Bánh ngọt và thực phẩm béo: Bánh quy, bánh ngọt, kem
5. Thực phẩm chứa dầu dừa và dầu cọ (giàu chất béo bão hòa)
6. Sữa và sản phẩm từ sữa nguyên kem
7. Thực phẩm chế biến sẵn: Thường chứa chất béo trans
8. Đồ uống có đường và rượu bia

*Lời khuyên dinh dưỡng:*
- Ưu tiên nấu bằng cách hấp, luộc hoặc nướng thay vì chiên rán
- Thay thế chất béo bão hòa bằng chất béo không bão hòa (dầu oliu, bơ đậu phộng)
- Tăng cường chất xơ hòa tan
- Kiểm soát khẩu phần ăn
- Uống nhiều nước
- Duy trì cân nặng hợp lý
- Tập thể dục đều đặn

*Sản phẩm phù hợp tại cửa hàng:*
1. Yến mạch nguyên hạt - 45.000đ/gói
2. Dầu oliu Extra Virgin - 150.000đ/chai
3. Hạt lanh - 80.000đ/gói
4. Hạt óc chó - 120.000đ/hộp
5. Trà xanh hữu cơ - 65.000đ/hộp
6. Đậu đỏ - 35.000đ/gói
7. Cá hồi phi lê đông lạnh - 180.000đ/khay
8. Thực phẩm bổ sung nấm đông trùng hạ thảo - 450.000đ/hộp
9. Thực phẩm bổ sung thực vật sterol - 320.000đ/hộp
10. Hỗn hợp các loại hạt giảm cholesterol - 140.000đ/hộp

Lưu ý: Nên tham khảo ý kiến bác sĩ hoặc chuyên gia dinh dưỡng để có chế độ ăn phù hợp với tình trạng bệnh cụ thể.`;

  // Tạo danh sách một số sản phẩm mẫu cho người cholesterol cao
  const products = [
    {
      _id: "cholesterol_product_1",
      name: "Yến mạch nguyên hạt",
      price: 45000,
      image: "https://example.com/images/oats.jpg",
      description: "Yến mạch nguyên hạt giàu beta-glucan, giúp giảm cholesterol trong máu",
      category: "Ngũ cốc"
    },
    {
      _id: "cholesterol_product_2",
      name: "Thực phẩm bổ sung thực vật sterol",
      price: 320000,
      image: "https://example.com/images/plant_sterol.jpg",
      description: "Thực phẩm bổ sung từ thực vật sterol giúp giảm hấp thu cholesterol từ thức ăn",
      category: "Thực phẩm bổ sung"
    },
    {
      _id: "cholesterol_product_3",
      name: "Dầu oliu Extra Virgin",
      price: 150000,
      image: "https://example.com/images/olive_oil.jpg",
      description: "Dầu oliu nguyên chất, giàu chất béo không bão hòa đơn, tốt cho người cholesterol cao",
      category: "Dầu ăn"
    },
    {
      _id: "cholesterol_product_4",
      name: "Hỗn hợp các loại hạt giảm cholesterol",
      price: 140000,
      image: "https://example.com/images/mixed_nuts.jpg",
      description: "Hỗn hợp các loại hạt không muối giúp cải thiện chỉ số cholesterol",
      category: "Hạt & Đậu"
    }
  ];

  return {
    success: true,
    type: "productSearch",
    message: message,
    products: products,
    intent: "faq_cholesterol_food"
  };
};

/**
 * Xử lý câu hỏi về thực phẩm giảm cân
 * @returns {object} - Phản hồi cho câu hỏi
 */
const handleWeightLossFood = () => {
  const message = `🩺 *THỰC PHẨM GIÚP GIẢM CÂN HIỆU QUẢ*

*Thực phẩm nên ăn:*
1. Protein nạc: Ức gà, cá, trứng, đậu phụ - giúp no lâu và xây dựng cơ bắp
2. Rau xanh: Bông cải xanh, cải xoăn, rau chân vịt - ít calo, nhiều chất xơ
3. Trái cây ít đường: Táo, dâu tây, quả mọng - nhiều chất xơ, ít calo
4. Ngũ cốc nguyên hạt: Gạo lứt, yến mạch, quinoa - giàu chất xơ, no lâu
5. Các loại đậu: Đậu đen, đậu lăng, đậu chickpea - giàu protein và chất xơ
6. Chất béo lành mạnh (lượng vừa phải): Bơ, dầu oliu, các loại hạt
7. Thực phẩm giàu chất xơ: Hạt chia, hạt lanh
8. Thực phẩm tăng cường trao đổi chất: Ớt, gừng, trà xanh
9. Sữa chua không đường: Cung cấp protein, calcium và probiotics
10. Nước và trà thảo mộc: Giúp tăng cường cảm giác no

*Thực phẩm nên hạn chế:*
1. Thực phẩm giàu đường tinh luyện: Bánh ngọt, kẹo, nước ngọt
2. Thực phẩm chế biến sẵn và thức ăn nhanh
3. Carbohydrate tinh chế: Bánh mì trắng, gạo trắng, mì
4. Thực phẩm chiên rán
5. Rượu bia và đồ uống có cồn
6. Nước ép trái cây có đường
7. Đồ ngọt và snack nhiều calo
8. Sữa và sản phẩm từ sữa nguyên kem
9. Các loại sốt và nước chấm nhiều dầu mỡ

*Lời khuyên giảm cân:*
- Kiểm soát khẩu phần ăn
- Ăn chậm và nhai kỹ
- Không bỏ bữa, đặc biệt là bữa sáng
- Uống đủ nước (2-3 lít/ngày)
- Tăng cường protein trong mỗi bữa ăn
- Lên kế hoạch bữa ăn trước
- Hạn chế ăn vặt
- Kết hợp với tập thể dục đều đặn
- Đảm bảo ngủ đủ giấc

*Kế hoạch giảm cân an toàn:*
- Giảm 0.5-1kg/tuần là lý tưởng và bền vững
- Không nên cắt giảm quá nhiều calo
- Ưu tiên thay đổi thói quen ăn uống lâu dài
- Chú ý bổ sung đầy đủ vitamin và khoáng chất

*Sản phẩm phù hợp tại cửa hàng:*
1. Yến mạch nguyên hạt - 45.000đ/gói
2. Hạt chia - 85.000đ/gói
3. Bột protein thực vật - 250.000đ/hộp
4. Trà xanh hữu cơ - 65.000đ/hộp
5. Sữa chua không đường - 35.000đ/hộp 4 cốc
6. Dầu oliu Extra Virgin - 150.000đ/chai
7. Gạo lứt hữu cơ - 95.000đ/kg
8. Bơ - 35.000đ/quả
9. Đậu lăng - 50.000đ/gói
10. Trà thảo mộc giảm cân - 85.000đ/hộp

Lưu ý: Giảm cân an toàn và bền vững cần có chế độ ăn cân bằng kết hợp với luyện tập thể dục đều đặn. Nên tham khảo ý kiến bác sĩ hoặc chuyên gia dinh dưỡng trước khi bắt đầu bất kỳ chế độ ăn kiêng nào.`;

  // Tạo danh sách một số sản phẩm mẫu cho người giảm cân
  const products = [
    {
      _id: "weight_loss_product_1",
      name: "Trà thảo mộc giảm cân",
      price: 85000,
      image: "https://example.com/images/weight_loss_tea.jpg",
      description: "Trà thảo mộc kết hợp từ lá sen, trà xanh và các thảo dược giúp hỗ trợ giảm cân",
      category: "Đồ uống"
    },
    {
      _id: "weight_loss_product_2",
      name: "Bột protein thực vật",
      price: 250000,
      image: "https://example.com/images/plant_protein.jpg",
      description: "Bột protein từ thực vật, giúp no lâu và hỗ trợ xây dựng cơ bắp trong quá trình giảm cân",
      category: "Thực phẩm bổ sung"
    },
    {
      _id: "weight_loss_product_3",
      name: "Hạt chia",
      price: 85000,
      image: "https://example.com/images/chia_seeds.jpg",
      description: "Hạt chia giàu omega-3 và chất xơ, giúp tăng cảm giác no và hỗ trợ giảm cân",
      category: "Thực phẩm bổ sung"
    },
    {
      _id: "weight_loss_product_4",
      name: "Gạo lứt hữu cơ",
      price: 95000,
      image: "https://example.com/images/brown_rice.jpg",
      description: "Gạo lứt hữu cơ giàu chất xơ, giúp no lâu và có chỉ số đường huyết thấp",
      category: "Ngũ cốc"
    }
  ];

  return {
    success: true,
    type: "productSearch",
    message: message,
    products: products,
    intent: "faq_weight_loss_food"
  };
};

/**
 * Xử lý câu hỏi về thực phẩm tốt cho sức khỏe trẻ em
 * @returns {object} - Phản hồi cho câu hỏi
 */
const handleKidsHealthFood = () => {
  const message = `🩺 *THỰC PHẨM TĂNG CƯỜNG SỨC KHỎE CHO TRẺ EM*

*Thực phẩm tốt cho phát triển toàn diện:*
1. Trứng: Giàu protein chất lượng cao, choline cho phát triển não bộ
2. Sữa và sản phẩm từ sữa: Cung cấp canxi, vitamin D cho xương chắc khỏe
3. Cá béo: Cá hồi, cá thu - giàu omega-3 DHA cho phát triển não và mắt
4. Trái cây đa dạng: Cung cấp vitamin, khoáng chất và chất xơ
5. Rau xanh: Bông cải xanh, rau bina - giàu vitamin, khoáng chất
6. Thịt nạc: Cung cấp protein, sắt và kẽm cho phát triển
7. Ngũ cốc nguyên hạt: Yến mạch, gạo lứt, bánh mì nguyên cám
8. Các loại đậu: Đậu Hà Lan, đậu lăng - protein thực vật và sắt
9. Các loại hạt và bơ đậu phộng: Chất béo lành mạnh, vitamin E
10. Nước và sữa: Đủ nước là rất quan trọng cho trẻ

*Thực phẩm hỗ trợ tăng sức đề kháng:*
1. Thực phẩm giàu vitamin C: Cam, kiwi, ổi, ớt chuông
2. Thực phẩm giàu vitamin A: Khoai lang, cà rốt, bí đỏ
3. Thực phẩm giàu kẽm: Thịt bò, hàu, các loại hạt
4. Tỏi và hành: Có tính kháng khuẩn tự nhiên
5. Sữa chua và thực phẩm lên men: Cung cấp probiotics
6. Thực phẩm giàu vitamin D: Cá béo, lòng đỏ trứng, sữa bổ sung

*Thực phẩm hỗ trợ phát triển chiều cao:*
1. Sữa và sản phẩm từ sữa: Giàu canxi và vitamin D
2. Thịt, cá, trứng: Cung cấp protein chất lượng cao
3. Các loại đậu: Giàu protein thực vật và khoáng chất
4. Trái cây: Chuối, táo, kiwi - cung cấp vitamin và khoáng chất
5. Rau xanh: Bông cải xanh, rau bina - giàu canxi và vitamin K

*Thực phẩm hỗ trợ phát triển não bộ:*
1. Cá béo: Giàu omega-3 DHA
2. Trứng: Chứa choline, protein chất lượng cao
3. Bơ: Chứa chất béo lành mạnh, vitamin E
4. Các loại hạt và hạt giống: Omega-3, kẽm, vitamin E
5. Ngũ cốc nguyên hạt: Năng lượng bền vững cho não
6. Sữa và sản phẩm từ sữa: Protein, vitamin B12, iốt

*Thực phẩm nên hạn chế:*
1. Đồ ngọt và nước ngọt
2. Thức ăn nhanh và thức ăn chế biến sẵn
3. Thực phẩm chiên rán
4. Đồ uống có caffeine
5. Thực phẩm có nhiều phụ gia, chất bảo quản
6. Bánh kẹo và snack công nghiệp

*Lời khuyên về dinh dưỡng cho trẻ:*
- Đa dạng thực phẩm
- Lên thời gian biểu ăn uống đều đặn
- Khuyến khích trẻ uống đủ nước
- Tạo không khí vui vẻ trong bữa ăn
- Cho trẻ tham gia vào quá trình chuẩn bị thức ăn
- Làm gương về thói quen ăn uống lành mạnh

*Sản phẩm phù hợp tại cửa hàng:*
1. Sữa tăng trưởng cho trẻ - 180.000đ/hộp
2. Ngũ cốc dinh dưỡng cho trẻ - 85.000đ/hộp
3. DHA từ tảo - 220.000đ/lọ
4. Bánh gạo lứt cho trẻ - 45.000đ/gói
5. Sữa chua hữu cơ cho trẻ - 35.000đ/hộp
6. Nước ép trái cây tự nhiên 100% - 40.000đ/chai
7. Bơ đậu phộng hữu cơ không đường - 75.000đ/hũ
8. Bột canxi từ tảo biển - 150.000đ/hộp
9. Thực phẩm bổ sung vitamin tổng hợp cho trẻ - 250.000đ/hộp
10. Snack rau củ tự nhiên - 35.000đ/gói

Lưu ý: Mỗi đứa trẻ có nhu cầu dinh dưỡng khác nhau tùy thuộc vào độ tuổi, cân nặng và mức độ hoạt động. Nên tham khảo ý kiến bác sĩ nhi khoa hoặc chuyên gia dinh dưỡng cho trẻ.`;

  // Tạo danh sách một số sản phẩm mẫu cho sức khỏe trẻ em
  const products = [
    {
      _id: "kids_health_product_1",
      name: "Sữa tăng trưởng cho trẻ",
      price: 180000,
      image: "https://example.com/images/kids_milk.jpg",
      description: "Sữa bổ sung dưỡng chất, vitamin và khoáng chất cần thiết cho sự tăng trưởng của trẻ",
      category: "Sữa & Sản phẩm từ sữa"
    },
    {
      _id: "kids_health_product_2",
      name: "DHA từ tảo",
      price: 220000,
      image: "https://example.com/images/dha_algae.jpg",
      description: "DHA chiết xuất từ tảo, hỗ trợ phát triển não bộ và thị lực cho trẻ em",
      category: "Thực phẩm bổ sung"
    },
    {
      _id: "kids_health_product_3",
      name: "Thực phẩm bổ sung vitamin tổng hợp cho trẻ",
      price: 250000,
      image: "https://example.com/images/kids_vitamins.jpg",
      description: "Vitamin tổng hợp dạng kẹo dẻo, bổ sung đầy đủ vitamin và khoáng chất cho trẻ",
      category: "Thực phẩm bổ sung"
    },
    {
      _id: "kids_health_product_4",
      name: "Snack rau củ tự nhiên",
      price: 35000,
      image: "https://example.com/images/veggie_snack.jpg",
      description: "Snack từ rau củ sấy giòn, không chất bảo quản, giúp trẻ ăn nhiều rau hơn",
      category: "Đồ ăn nhẹ"
    }
  ];

  return {
    success: true,
    type: "productSearch",
    message: message,
    products: products,
    intent: "faq_kids_health_food"
  };
};
