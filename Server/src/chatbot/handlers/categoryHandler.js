/**
 * Module xử lý danh mục sản phẩm cho chatbot
 */

// Cải thiện hàm trích xuất danh mục sản phẩm
const extractProductCategory = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Danh sách các danh mục sản phẩm và từ khóa liên quan
  const categories = {
    "Trái cây": [
      "trái cây",
      "hoa quả",
      "quả",
      "táo",
      "cam",
      "chuối",
      "dưa",
      "dâu",
      "xoài",
      "mít",
      "sầu riêng",
      "bơ",
      "chanh",
      "dừa",
      "ổi",
      "lê",
      "đào",
      "nho",
      "kiwi",
      "dưa hấu",
      "dưa lưới",
      "mận",
      "chôm chôm",
      "vải",
      "nhãn",
      "thanh long",
      "măng cụt",
      "bưởi",
      "cherry",
      "việt quất",
    ],
    "Rau củ quả": [
      "rau",
      "củ",
      "rau củ",
      "rau xanh",
      "rau sống",
      "rau muống",
      "cải",
      "cà rốt",
      "khoai tây",
      "khoai lang",
      "hành",
      "tỏi",
      "gừng",
      "ớt",
      "cà chua",
      "bắp cải",
      "súp lơ",
      "bông cải",
      "nấm",
      "dưa chuột",
      "bí đỏ",
      "bí xanh",
      "mồng tơi",
      "rau ngót",
      "rau dền",
      "xà lách",
    ],
    Thịt: [
      "thịt",
      "thịt heo",
      "thịt bò",
      "thịt gà",
      "thịt vịt",
      "thịt cừu",
      "thịt dê",
      "thịt trâu",
      "thịt thỏ",
      "sườn",
      "ba chỉ",
      "đùi",
      "cánh",
      "ức",
      "nạc",
      "mỡ",
      "gân",
      "sụn",
      "xương",
    ],
    "Hải sản": [
      "hải sản",
      "cá",
      "tôm",
      "cua",
      "ghẹ",
      "sò",
      "ốc",
      "mực",
      "bạch tuộc",
      "cá ngừ",
      "cá hồi",
      "cá thu",
      "cá trích",
      "cá chép",
      "cá rô",
      "cá lóc",
      "cá diêu hồng",
      "tôm sú",
      "tôm hùm",
      "tôm càng xanh",
    ],
    "Đồ uống": [
      "đồ uống",
      "nước",
      "nước ngọt",
      "nước khoáng",
      "nước lọc",
      "nước trái cây",
      "sinh tố",
      "sữa",
      "trà",
      "cà phê",
      "bia",
      "rượu",
      "cocktail",
      "mocktail",
      "nước ép",
      "soda",
      "coca",
      "pepsi",
      "sprite",
      "fanta",
      "mirinda",
    ],
    "Bánh kẹo": [
      "bánh",
      "kẹo",
      "bánh kẹo",
      "bánh quy",
      "bánh bông lan",
      "bánh mì",
      "bánh ngọt",
      "bánh kem",
      "kẹo dẻo",
      "kẹo cứng",
      "socola",
      "chocolate",
      "snack",
      "bim bim",
      "chips",
    ],
    "Gia vị": [
      "gia vị",
      "muối",
      "tiêu",
      "đường",
      "bột ngọt",
      "nước mắm",
      "nước tương",
      "tương ớt",
      "tương cà",
      "dầu ăn",
      "dầu hào",
      "dầu mè",
      "giấm",
      "hạt nêm",
      "bột canh",
      "bột ngũ vị hương",
      "sa tế",
      "ớt bột",
      "nghệ",
    ],
    "Sữa chua": [
      "sữa chua",
      "yogurt",
      "yaourt",
      "sữa chua uống",
      "sữa chua ăn",
      "sữa chua trái cây",
      "sữa chua việt quất",
      "sữa chua dâu",
    ],
  };

  // Các mẫu câu đặc biệt để xác định danh mục
  const specialPatterns = {
    "Trái cây": [
      /loại trái cây/i,
      /trái cây nào/i,
      /hoa quả nào/i,
      /quả gì/i,
      /trái cây ít đường/i,
      /trái cây cho người ăn kiêng/i,
    ],
    "Rau củ quả": [/loại rau/i, /rau gì/i, /rau củ nào/i, /rau xanh/i],
  };

  // Kiểm tra các mẫu câu đặc biệt
  for (const [category, patterns] of Object.entries(specialPatterns)) {
    if (patterns.some((pattern) => pattern.test(lowerMessage))) {
      return category;
    }
  }

  // Kiểm tra từng danh mục dựa trên từ khóa
  let bestCategory = null;
  let highestScore = 0;

  for (const [category, keywords] of Object.entries(categories)) {
    // Tính điểm cơ bản dựa trên từ khóa
    let score = keywords.reduce((total, keyword) => {
      if (lowerMessage.includes(keyword)) {
        return total + (keyword === category.toLowerCase() ? 3 : 1);
      }
      return total;
    }, 0);

    // Tính điểm bổ sung cho trường hợp đặc biệt
    if (
      category === "Trái cây" &&
      /(ít đường|ăn kiêng).*(trái cây|hoa quả|quả)/i.test(lowerMessage)
    ) {
      score = score + 5; // Cộng thêm điểm thay vì sử dụng toán tử +=
    }

    if (score > highestScore) {
      highestScore = score;
      bestCategory = category;
    }
  }

  // Nếu không tìm thấy danh mục phù hợp, trả về null
  return highestScore > 0 ? bestCategory : null;
};

export { extractProductCategory };
export default { extractProductCategory };
