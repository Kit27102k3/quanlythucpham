/**
 * Xử lý câu hỏi về sản phẩm cụ thể
 * File này chứa các hàm để trả lời câu hỏi về sản phẩm
 */

import Product from "../../Model/Products.js";
import { getContext, saveContext } from "./chatbotController.js";
import { handleIntentWithProductCategory, handleIntentWithProductType, handleIntentWithProductBrand, handleIntentWithProductOrigin, handleIntentWithPriceRange } from "./ProductIntentHandlers.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Lấy đường dẫn thư mục hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đường dẫn đến file cấu hình phản hồi sức khỏe
const healthResponsesPath = path.join(__dirname, "..", "..", "chatbot", "config", "health_responses.json");

// Đọc file cấu hình phản hồi sức khỏe
let healthResponses = {};
try {
  if (fs.existsSync(healthResponsesPath)) {
    const healthResponsesData = fs.readFileSync(healthResponsesPath, "utf8");
    healthResponses = JSON.parse(healthResponsesData);
    console.log("Đã tải cấu hình phản hồi sức khỏe");
  } else {
    console.log("Không tìm thấy file cấu hình phản hồi sức khỏe, sẽ sử dụng cấu hình mặc định");
  }
} catch (error) {
  console.error("Lỗi khi đọc file cấu hình phản hồi sức khỏe:", error);
}

/**
 * Các từ khóa liên quan đến nhu cầu sức khỏe
 */
const healthKeywords = {
  tieuDuong: ["tiểu đường", "đường huyết", "đường trong máu", "tiểu đường", "tiêu đường", "đái tháo đường", "glucose", "đường", "glycemic", "blood sugar", "diabetes"],
  huyetAp: ["huyết áp", "cao huyết áp", "tăng huyết áp", "hạ huyết áp", "huyết áp cao", "huyết áp thấp", "hypertension", "hypotension", "blood pressure"],
  giamCan: ["giảm cân", "giảm béo", "giảm mỡ", "giảm kg", "giảm kí", "giảm ký", "giảm cân nhanh", "giảm cân an toàn", "giảm cân hiệu quả", "giảm cân khỏe mạnh", "diet", "weight loss", "ít calo", "ít béo", "low calorie"],
  tangCan: ["tăng cân", "tăng cân nhanh", "tăng cân an toàn", "tăng cân hiệu quả", "tăng cân khỏe mạnh", "tăng kg", "tăng kí", "tăng ký", "weight gain"],
  anChay: ["ăn chay", "chay", "thuần chay", "chay trường", "chay kỳ", "đồ chay", "thực phẩm chay", "vegan", "vegetarian"],
  tangCo: ["tăng cơ", "phát triển cơ bắp", "tăng cơ bắp", "xây dựng cơ bắp", "tăng cơ nhanh", "tăng cơ hiệu quả", "tăng cơ khỏe mạnh", "cơ bắp", "gym", "thể hình", "muscle", "bodybuilding"],
  meBau: ["mẹ bầu", "bà bầu", "phụ nữ mang thai", "thai phụ", "thai kỳ", "mang thai", "có thai", "pregnancy", "pregnant"],
  treSoSinh: ["trẻ sơ sinh", "em bé", "bé sơ sinh", "trẻ nhỏ", "trẻ em", "baby", "infant", "newborn"],
  nguoiGia: ["người già", "người cao tuổi", "cao tuổi", "lớn tuổi", "già", "tuổi cao", "elderly", "senior"],
  cholesterol: ["cholesterol", "mỡ máu", "máu nhiễm mỡ", "rối loạn mỡ máu", "lipid máu", "mỡ trong máu"],
  tieu_hoa: ["tiêu hóa", "dạ dày", "đường ruột", "đại tràng", "ruột", "tiêu chảy", "táo bón", "khó tiêu", "đầy hơi", "ợ chua", "trào ngược", "digestion", "digestive", "stomach", "gut"],
  gluten: ["gluten", "không gluten", "gluten-free", "celiac"],
  lactose: ["lactose", "không lactose", "lactose-free", "sữa", "bơ", "phô mai"],
  duong: ["đường", "ít đường", "không đường", "low sugar", "sugar-free"],
  muoi: ["muối", "ít muối", "không muối", "low salt", "salt-free", "sodium"],
  chat_beo: ["chất béo", "ít béo", "không béo", "low fat", "fat-free"],
  protein: ["protein", "đạm", "chất đạm", "nhiều đạm", "high protein"],
  chat_xo: ["chất xơ", "nhiều chất xơ", "fiber", "high fiber"],
  vitamin: ["vitamin", "khoáng chất", "vi chất", "vitamin A", "vitamin B", "vitamin C", "vitamin D", "vitamin E", "kẽm", "sắt", "canxi", "magie", "minerals"]
};

/**
 * Thông tin dinh dưỡng và khuyến nghị cho từng nhu cầu sức khỏe
 */
const healthRecommendations = {
  tieuDuong: {
    title: "Thực phẩm cho người tiểu đường",
    description: "Người tiểu đường nên ưu tiên thực phẩm có chỉ số đường huyết (GI) thấp, giàu chất xơ và kiểm soát lượng carbohydrate.",
    recommended: [
      "Rau xanh các loại (rau muống, cải xanh, rau ngót...)",
      "Các loại đậu (đậu đen, đậu nành, đậu lăng)",
      "Ngũ cốc nguyên hạt (gạo lứt, yến mạch, quinoa)",
      "Protein nạc (cá, thịt gà không da, đậu hũ)",
      "Quả mọng (việt quất, dâu tây) và trái cây ít ngọt (táo, lê)",
      "Các loại hạt (hạnh nhân, óc chó) không thêm muối đường",
      "Dầu lành mạnh (dầu oliu, dầu mè)"
    ],
    avoid: [
      "Thực phẩm chế biến sẵn có nhiều đường",
      "Nước ngọt, nước trái cây đóng hộp",
      "Bánh kẹo, đồ ngọt",
      "Gạo trắng, bánh mì trắng",
      "Trái cây quá ngọt (xoài chín, dứa, chuối chín)"
    ],
    productCategories: ["Thực phẩm ít đường", "Ngũ cốc nguyên hạt", "Rau củ", "Đậu", "Thực phẩm hữu cơ"],
    productKeywords: ["ít đường", "đường thấp", "chỉ số GI thấp", "tiểu đường", "gạo lứt", "yến mạch", "hữu cơ", "không đường"]
  },
  huyetAp: {
    title: "Thực phẩm cho người huyết áp",
    description: "Người huyết áp cao nên ăn thực phẩm ít muối, giàu kali, magie và canxi để kiểm soát huyết áp.",
    recommended: [
      "Rau lá xanh đậm (rau bina, cải xoăn)",
      "Trái cây (chuối, cam, kiwi) giàu kali",
      "Các loại đậu và hạt",
      "Cá béo (cá hồi, cá thu) giàu omega-3",
      "Sữa chua và các sản phẩm từ sữa ít béo",
      "Socola đen (hàm lượng cacao >70%)",
      "Quả bơ"
    ],
    avoid: [
      "Thực phẩm chế biến sẵn có nhiều muối",
      "Thực phẩm đóng hộp, đồ ăn nhanh",
      "Dưa muối, kim chi, các loại thực phẩm ngâm muối",
      "Nước tương, bột ngọt, bột nêm",
      "Thịt chế biến (xúc xích, thịt nguội)"
    ],
    productCategories: ["Thực phẩm ít muối", "Rau củ", "Trái cây", "Hải sản", "Thực phẩm hữu cơ"],
    productKeywords: ["ít muối", "không muối", "huyết áp", "omega-3", "hữu cơ", "tự nhiên", "không gia vị"]
  },
  giamCan: {
    title: "Thực phẩm giúp giảm cân",
    description: "Để giảm cân hiệu quả và khỏe mạnh, nên ưu tiên thực phẩm giàu chất xơ, protein, ít calo và chất béo.",
    recommended: [
      "Rau xanh các loại (càng nhiều càng tốt)",
      "Protein nạc (thịt gà không da, cá, đậu hũ)",
      "Trứng",
      "Các loại đậu và ngũ cốc nguyên hạt",
      "Trái cây ít đường (táo, dâu, quả mọng)",
      "Sữa chua không đường",
      "Các loại hạt không muối (hạnh nhân, óc chó) với lượng vừa phải"
    ],
    avoid: [
      "Thực phẩm chiên rán",
      "Đồ ngọt, bánh kẹo",
      "Nước ngọt, nước trái cây đóng hộp",
      "Thực phẩm chế biến sẵn",
      "Rượu bia",
      "Thực phẩm nhiều tinh bột trắng (bánh mì trắng, cơm trắng)"
    ],
    productCategories: ["Thực phẩm ít calo", "Protein", "Rau củ", "Thực phẩm hữu cơ", "Thực phẩm ít béo"],
    productKeywords: ["giảm cân", "ít calo", "ít béo", "protein", "không đường", "hữu cơ", "chất xơ", "detox"]
  },
  anChay: {
    title: "Thực phẩm cho người ăn chay",
    description: "Người ăn chay cần đảm bảo đủ protein, vitamin B12, sắt, kẽm và omega-3 từ nguồn thực vật.",
    recommended: [
      "Đậu các loại (đậu nành, đậu đen, đậu lăng)",
      "Đậu hũ và các sản phẩm từ đậu nành",
      "Các loại hạt (hạt điều, hạt óc chó, hạt chia)",
      "Ngũ cốc nguyên hạt (gạo lứt, quinoa)",
      "Rau lá xanh đậm",
      "Trái cây tươi",
      "Sữa thực vật được bổ sung vitamin B12 và canxi"
    ],
    avoid: [
      "Thực phẩm chứa gelatin (một số kẹo, bánh)",
      "Một số loại phô mai (chứa rennet)",
      "Thực phẩm chứa mỡ động vật",
      "Mật ong (đối với người ăn chay trường)"
    ],
    productCategories: ["Thực phẩm chay", "Đậu", "Ngũ cốc", "Rau củ", "Hạt", "Sữa thực vật"],
    productKeywords: ["chay", "thuần chay", "vegan", "vegetarian", "đậu", "hạt", "ngũ cốc", "sữa thực vật"]
  },
  tangCo: {
    title: "Thực phẩm giúp tăng cơ",
    description: "Để phát triển cơ bắp, cần ưu tiên thực phẩm giàu protein, carbohydrate phức hợp và chất béo lành mạnh.",
    recommended: [
      "Thịt nạc (gà, bò, heo)",
      "Cá (đặc biệt là cá hồi và cá ngừ)",
      "Trứng",
      "Sữa và các sản phẩm từ sữa",
      "Đậu và các sản phẩm từ đậu nành",
      "Ngũ cốc nguyên hạt",
      "Khoai lang, khoai tây",
      "Các loại hạt và quả bơ",
      "Rau xanh (cung cấp vitamin và khoáng chất)"
    ],
    avoid: [
      "Thực phẩm nhiều đường",
      "Thức ăn nhanh và thực phẩm chế biến sẵn",
      "Rượu bia",
      "Thực phẩm nhiều chất béo bão hòa"
    ],
    productCategories: ["Protein", "Thực phẩm tăng cơ", "Thực phẩm bổ sung", "Ngũ cốc", "Thịt"],
    productKeywords: ["protein", "tăng cơ", "whey", "đạm", "thể thao", "tập gym", "bổ sung", "amino acid"]
  },
  meBau: {
    title: "Thực phẩm cho mẹ bầu",
    description: "Mẹ bầu cần thực phẩm giàu folate, sắt, canxi, DHA và nhiều vitamin khoáng chất khác để hỗ trợ sự phát triển của thai nhi.",
    recommended: [
      "Rau lá xanh đậm (rau bina, cải xoăn)",
      "Trái cây tươi",
      "Các loại đậu",
      "Ngũ cốc nguyên hạt",
      "Trứng",
      "Sữa và các sản phẩm từ sữa",
      "Cá béo (cá hồi, cá thu) giàu DHA",
      "Thịt nạc",
      "Các loại hạt"
    ],
    avoid: [
      "Cá có hàm lượng thủy ngân cao (cá kiếm, cá thu king)",
      "Thịt sống hoặc chưa nấu chín",
      "Trứng sống",
      "Pho mát mềm chưa tiệt trùng",
      "Cà phê, rượu bia",
      "Thực phẩm chế biến sẵn có nhiều muối và chất bảo quản"
    ],
    productCategories: ["Thực phẩm cho mẹ bầu", "Sữa bầu", "Thực phẩm bổ sung", "Rau củ", "Trái cây", "Hải sản"],
    productKeywords: ["mẹ bầu", "bà bầu", "thai kỳ", "DHA", "folate", "sắt", "canxi", "vitamin", "hữu cơ", "tự nhiên"]
  },
  treSoSinh: {
    title: "Thực phẩm cho trẻ sơ sinh và trẻ nhỏ",
    description: "Trẻ sơ sinh và trẻ nhỏ cần thực phẩm an toàn, dễ tiêu hóa và giàu dinh dưỡng để phát triển toàn diện.",
    recommended: [
      "Sữa mẹ (tốt nhất cho trẻ sơ sinh)",
      "Sữa công thức (nếu không thể cho bú)",
      "Cháo, bột ngũ cốc cho trẻ",
      "Rau củ quả nghiền nhuyễn",
      "Thịt, cá nghiền nhỏ (cho trẻ trên 6 tháng)",
      "Trứng (cho trẻ trên 6 tháng)",
      "Sữa chua không đường (cho trẻ trên 12 tháng)"
    ],
    avoid: [
      "Mật ong (cho trẻ dưới 12 tháng)",
      "Sữa bò nguyên chất (cho trẻ dưới 12 tháng)",
      "Thực phẩm dễ gây dị ứng (đậu phộng, hải sản)",
      "Thực phẩm cứng, tròn dễ gây hóc (nho, đậu, kẹo cứng)",
      "Thực phẩm nhiều muối, đường",
      "Nước ngọt, nước ép đóng hộp"
    ],
    productCategories: ["Sữa công thức", "Thực phẩm trẻ em", "Bột ăn dặm", "Ngũ cốc trẻ em", "Thực phẩm hữu cơ"],
    productKeywords: ["trẻ em", "em bé", "sơ sinh", "ăn dặm", "bột", "cháo", "sữa", "hữu cơ", "không hóa chất"]
  },
  nguoiGia: {
    title: "Thực phẩm cho người cao tuổi",
    description: "Người cao tuổi cần thực phẩm dễ tiêu hóa, giàu canxi, protein và các vitamin khoáng chất để duy trì sức khỏe và phòng ngừa bệnh tật.",
    recommended: [
      "Rau xanh và trái cây tươi",
      "Protein dễ tiêu hóa (cá, thịt gà, đậu hũ)",
      "Sữa và các sản phẩm từ sữa giàu canxi",
      "Ngũ cốc nguyên hạt",
      "Các loại hạt và dầu thực vật",
      "Thực phẩm giàu omega-3 (cá hồi, hạt chia)",
      "Nước và các loại trà thảo mộc"
    ],
    avoid: [
      "Thực phẩm nhiều muối",
      "Thực phẩm nhiều đường",
      "Thực phẩm chế biến sẵn",
      "Thực phẩm chiên rán",
      "Rượu bia",
      "Thực phẩm khó tiêu hóa"
    ],
    productCategories: ["Thực phẩm người cao tuổi", "Thực phẩm bổ sung", "Sữa", "Ngũ cốc", "Thực phẩm hữu cơ"],
    productKeywords: ["người già", "cao tuổi", "canxi", "dễ tiêu", "mềm", "dinh dưỡng", "vitamin", "bổ sung"]
  },
  cholesterol: {
    title: "Thực phẩm cho người mỡ máu cao",
    description: "Người có mỡ máu cao cần ưu tiên thực phẩm ít chất béo bão hòa, giàu chất xơ và chất béo không bão hòa để giảm cholesterol xấu (LDL).",
    recommended: [
      "Yến mạch và ngũ cốc nguyên hạt",
      "Các loại đậu và đậu nành",
      "Trái cây tươi, đặc biệt là táo, lê và quả mọng",
      "Rau xanh các loại",
      "Cá béo (cá hồi, cá thu, cá trích) giàu omega-3",
      "Các loại hạt (hạnh nhân, óc chó)",
      "Dầu oliu, dầu hạt cải"
    ],
    avoid: [
      "Thịt đỏ và thịt chế biến sẵn",
      "Thực phẩm chiên rán",
      "Bơ, phô mai và các sản phẩm từ sữa nguyên kem",
      "Bánh ngọt và bánh quy",
      "Thực phẩm chứa dầu dừa, dầu cọ",
      "Nội tạng động vật"
    ],
    productCategories: ["Thực phẩm ít béo", "Ngũ cốc nguyên hạt", "Hải sản", "Rau củ", "Thực phẩm hữu cơ"],
    productKeywords: ["cholesterol", "mỡ máu", "ít béo", "omega-3", "chất xơ", "hữu cơ", "nguyên hạt"]
  },
  tieuHoa: {
    title: "Thực phẩm cho người có vấn đề tiêu hóa",
    description: "Người có vấn đề tiêu hóa cần thực phẩm dễ tiêu, giàu chất xơ hòa tan và men vi sinh để cải thiện hệ tiêu hóa.",
    recommended: [
      "Sữa chua và thực phẩm lên men (kim chi, dưa chua)",
      "Chuối chín",
      "Gạo trắng và bánh mì trắng (khi bị tiêu chảy)",
      "Thực phẩm giàu chất xơ hòa tan (yến mạch, táo)",
      "Nước và trà thảo mộc",
      "Thịt nạc và cá hấp",
      "Rau củ nấu chín kỹ"
    ],
    avoid: [
      "Thực phẩm cay nóng",
      "Thực phẩm nhiều dầu mỡ",
      "Đồ uống có ga và caffeine",
      "Rượu bia",
      "Sữa (nếu không dung nạp lactose)",
      "Thực phẩm gây đầy hơi (đậu, bắp cải)"
    ],
    productCategories: ["Thực phẩm dễ tiêu", "Sữa chua", "Thực phẩm lên men", "Ngũ cốc", "Thực phẩm hữu cơ"],
    productKeywords: ["tiêu hóa", "dễ tiêu", "men vi sinh", "probiotic", "chất xơ", "lên men", "không cay", "nhẹ bụng"]
  },
  gan: {
    title: "Thực phẩm tốt cho gan",
    description: "Người có vấn đề về gan cần thực phẩm giàu chất chống oxy hóa, ít chất béo và không chứa rượu để bảo vệ và phục hồi chức năng gan.",
    recommended: [
      "Rau xanh đậm (cải xoăn, rau bina)",
      "Trái cây họ cam quýt",
      "Cà phê (lượng vừa phải)",
      "Trà xanh",
      "Tỏi",
      "Các loại hạt",
      "Cá béo giàu omega-3",
      "Thực phẩm giàu choline (trứng, thịt gà)"
    ],
    avoid: [
      "Rượu bia",
      "Thực phẩm chiên rán",
      "Thịt đỏ",
      "Thực phẩm nhiều đường",
      "Muối",
      "Thực phẩm chế biến sẵn"
    ],
    productCategories: ["Thực phẩm hữu cơ", "Rau củ", "Trà", "Thực phẩm bổ sung", "Hải sản"],
    productKeywords: ["gan", "detox", "giải độc", "chống oxy hóa", "hữu cơ", "tự nhiên", "không cồn", "ít béo"]
  },
  than: {
    title: "Thực phẩm cho người bệnh thận",
    description: "Người bệnh thận cần kiểm soát lượng natri, kali, phospho và protein để giảm gánh nặng cho thận.",
    recommended: [
      "Rau củ đã luộc để giảm kali (nếu cần)",
      "Trái cây ít kali (táo, việt quất, dâu tây)",
      "Bánh mì trắng, gạo trắng",
      "Protein chất lượng cao với lượng vừa phải",
      "Dầu oliu và các loại dầu thực vật",
      "Gia vị thảo mộc thay thế muối"
    ],
    avoid: [
      "Thực phẩm nhiều muối",
      "Thực phẩm chế biến sẵn",
      "Thực phẩm nhiều kali (chuối, khoai tây, cà chua)",
      "Thực phẩm nhiều phospho (sữa, phô mai, đồ uống có ga)",
      "Protein động vật quá nhiều"
    ],
    productCategories: ["Thực phẩm ít muối", "Thực phẩm ít kali", "Thực phẩm ít phospho", "Rau củ", "Thực phẩm hữu cơ"],
    productKeywords: ["thận", "ít muối", "ít kali", "ít phospho", "hữu cơ", "tự nhiên", "không gia vị"]
  },
  xương: {
    title: "Thực phẩm tốt cho xương khớp",
    description: "Người có vấn đề về xương khớp cần thực phẩm giàu canxi, vitamin D, magie và các chất chống viêm để bảo vệ và tăng cường sức khỏe xương.",
    recommended: [
      "Sữa và các sản phẩm từ sữa",
      "Rau lá xanh đậm (cải xoăn, rau bina)",
      "Cá béo (cá hồi, cá thu) giàu vitamin D",
      "Các loại đậu",
      "Các loại hạt (hạnh nhân, hạt chia)",
      "Thực phẩm giàu magie (bơ, chuối)",
      "Trái cây họ cam quýt"
    ],
    avoid: [
      "Thực phẩm nhiều muối",
      "Đồ uống có caffeine quá nhiều",
      "Rượu bia",
      "Thực phẩm chế biến sẵn",
      "Thực phẩm nhiều đường"
    ],
    productCategories: ["Thực phẩm giàu canxi", "Sữa", "Hải sản", "Thực phẩm bổ sung", "Thực phẩm hữu cơ"],
    productKeywords: ["xương", "khớp", "canxi", "vitamin D", "magie", "omega-3", "chống viêm", "collagen"]
  }
};

/**
 * Định dạng số tiền sang VND
 * @param {number} amount - Số tiền
 * @returns {string} - Chuỗi tiền đã định dạng
 */
const formatCurrency = (amount) => {
  // Đảm bảo amount là số
  const validAmount = Number(amount) || 0;
  
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(validAmount);
};

/**
 * Nhận diện intent từ tin nhắn cho sản phẩm đang xem
 * @param {string} message - Tin nhắn từ người dùng
 * @returns {string} - Intent được phát hiện
 */
export const detectProductPageIntent = (message) => {
  if (!message) return null;
  
  const lowerMessage = message.toLowerCase().trim();
  
  // Công dụng sản phẩm (productDetails)
  if (lowerMessage.includes('công dụng') || 
      lowerMessage.includes('tác dụng') || 
      lowerMessage.includes('dùng để làm gì') ||
      lowerMessage.includes('dùng làm gì') ||
      lowerMessage.includes('sử dụng') || 
      lowerMessage.includes('tác dụng gì')) {
    return 'productUsage';
  }
  
  // Giới thiệu sản phẩm (productIntroduction)
  if (lowerMessage.includes('giới thiệu') || 
      lowerMessage.includes('nói về') || 
      lowerMessage.includes('giới thiệu về') ||
      lowerMessage.includes('thông tin về') ||
      lowerMessage.includes('mô tả')) {
    return 'productIntro';
  }
  
  // Giá sản phẩm (productPrice, productPromoPrice)
  if (lowerMessage.includes('giá') || 
      lowerMessage.includes('bao nhiêu tiền') || 
      lowerMessage.includes('giá cả') ||
      lowerMessage.includes('giá bao nhiêu')) {
    return 'productPrice';
  }
  
  // Sản phẩm liên quan (productCategory)
  if (lowerMessage.includes('liên quan') || 
      lowerMessage.includes('tương tự') || 
      lowerMessage.includes('sản phẩm khác') ||
      lowerMessage.includes('sản phẩm cùng loại') ||
      lowerMessage.includes('còn gì khác') ||
      lowerMessage.includes('gợi ý')) {
    return 'relatedProducts';
  }
  
  // Xuất xứ sản phẩm
  if (lowerMessage.includes('xuất xứ') || 
      lowerMessage.includes('nguồn gốc') || 
      lowerMessage.includes('sản xuất ở đâu') ||
      lowerMessage.includes('nước nào') ||
      lowerMessage.includes('hãng nào')) {
    return 'productOrigin';
  }
  
  // Thành phần sản phẩm
  if (lowerMessage.includes('thành phần') || 
      lowerMessage.includes('nguyên liệu') || 
      lowerMessage.includes('có chứa') ||
      lowerMessage.includes('làm từ') ||
      lowerMessage.includes('được làm từ') ||
      lowerMessage.includes('chất liệu')) {
    return 'productIngredients';
  }
  
  // Hạn sử dụng sản phẩm
  if (lowerMessage.includes('hạn sử dụng') || 
      lowerMessage.includes('date') || 
      lowerMessage.includes('hết hạn') ||
      lowerMessage.includes('dùng được bao lâu') ||
      lowerMessage.includes('bảo quản')) {
    return 'productExpiry';
  }
  
  // Đánh giá sản phẩm
  if (lowerMessage.includes('đánh giá') || 
      lowerMessage.includes('review') || 
      lowerMessage.includes('feedback') ||
      lowerMessage.includes('nhận xét') ||
      lowerMessage.includes('tốt không') ||
      lowerMessage.includes('có ngon không') ||
      lowerMessage.includes('có tốt không')) {
    return 'productReviews';
  }
  
  return null;
};

/**
 * Xử lý câu hỏi về công dụng sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
export const handleProductUsageQuestion = (product) => {
  if (!product) return { success: false, message: 'Không tìm thấy thông tin sản phẩm' };
  
  const usage = product.productDetails || 'Hiện chưa có thông tin chi tiết về công dụng của sản phẩm này.';
  
  return {
    success: true,
    message: `<strong>Công dụng của ${product.productName}:</strong><br>${usage}`,
    intent: 'productUsage'
  };
};

/**
 * Xử lý câu hỏi về giới thiệu sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
export const handleProductIntroQuestion = (product) => {
  if (!product) return { success: false, message: 'Không tìm thấy thông tin sản phẩm' };
  
  const intro = product.productIntroduction || 'Hiện chưa có thông tin giới thiệu về sản phẩm này.';
  
  return {
    success: true,
    message: `<strong>Giới thiệu về ${product.productName}:</strong><br>${intro}`,
    intent: 'productIntro'
  };
};

/**
 * Xử lý câu hỏi về giá sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
export const handleProductPriceQuestion = (product) => {
  if (!product) return { success: false, message: 'Không tìm thấy thông tin sản phẩm' };
  
  const originalPrice = product.productPrice;
  const discount = product.productDiscount || 0;
  const promoPrice = product.productPromoPrice || (discount > 0 ? Math.round(originalPrice * (1 - discount/100)) : originalPrice);
  
  let priceMessage = `<strong>Giá ${product.productName}:</strong><br>`;
  
  if (discount > 0) {
    priceMessage += `<span style="text-decoration: line-through;">${formatCurrency(originalPrice)}đ</span><br>`;
    priceMessage += `<strong style="color: red;">${formatCurrency(promoPrice)}đ</strong> (Giảm ${discount}%)`;
  } else {
    priceMessage += `<strong style="color: red;">${formatCurrency(originalPrice)}đ</strong>`;
  }
  
  return {
    success: true,
    message: priceMessage,
    intent: 'productPrice'
  };
};

/**
 * Xử lý câu hỏi về sản phẩm liên quan
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
export const handleRelatedProductsQuestion = async (product) => {
  if (!product) return { success: false, message: 'Không tìm thấy thông tin sản phẩm' };
  
  try {
    // Tìm các sản phẩm cùng danh mục
    const relatedProducts = await Product.find({
      productCategory: product.productCategory,
      _id: { $ne: product._id } // Loại trừ sản phẩm hiện tại
    }).limit(5);
    
    if (!relatedProducts || relatedProducts.length === 0) {
      return {
        success: true,
        message: `Hiện không có sản phẩm nào khác trong danh mục "${product.productCategory}".`,
        intent: 'relatedProducts'
      };
    }
    
    // Format sản phẩm để hiển thị
    const formattedProducts = relatedProducts.map(p => ({
      id: p._id,
      name: p.productName,
      price: p.productPrice,
      discount: p.productDiscount || 0,
      promotionalPrice: p.productPromoPrice || (p.productDiscount ? Math.round(p.productPrice * (1 - p.productDiscount/100)) : p.productPrice),
      image: p.productImages && p.productImages.length > 0 ? p.productImages[0] : 'default-product.jpg',
      description: p.productInfo || p.productDetails || ''
    }));
    
    return {
      success: true,
      message: `Các sản phẩm liên quan đến ${product.productName}:`,
      data: formattedProducts,
      type: 'relatedProducts',
      text: `Các sản phẩm liên quan đến ${product.productName}:`,
      intent: 'relatedProducts',
      nameCategory: `Sản phẩm cùng loại "${product.productCategory}"`
    };
  } catch (error) {
    console.error('Lỗi khi tìm sản phẩm liên quan:', error);
    return {
      success: false,
      message: 'Có lỗi xảy ra khi tìm sản phẩm liên quan.',
      intent: 'error'
    };
  }
};

/**
 * Xử lý câu hỏi về xuất xứ sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
export const handleProductOriginQuestion = (product) => {
  if (!product) return { success: false, message: 'Không tìm thấy thông tin sản phẩm' };
  
  let originInfo = '';
  
  if (product.productOrigin || product.origin) {
    originInfo = `<strong>Xuất xứ ${product.productName}:</strong><br>${product.productOrigin || product.origin}`;
    
    if (product.productBrand) {
      originInfo += `<br>Thương hiệu: ${product.productBrand}`;
    }
    
    if (product.productManufacturer) {
      originInfo += `<br>Nhà sản xuất: ${product.productManufacturer}`;
    }
  } else {
    originInfo = `<strong>Xuất xứ ${product.productName}:</strong><br>Thông tin về xuất xứ sản phẩm được ghi rõ trên bao bì.`;
  }
  
  return {
    success: true,
    message: originInfo,
    intent: 'productOrigin'
  };
};

/**
 * Xử lý câu hỏi về thành phần sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
export const handleProductIngredientsQuestion = (product) => {
  if (!product) return { success: false, message: 'Không tìm thấy thông tin sản phẩm' };
  
  let ingredientsInfo = '';
  
  if (product.productIngredients || product.ingredients) {
    ingredientsInfo = `<strong>Thành phần của ${product.productName}:</strong><br>${product.productIngredients || product.ingredients}`;
  } else {
    ingredientsInfo = `<strong>Thành phần của ${product.productName}:</strong><br>Thông tin chi tiết về thành phần sản phẩm được ghi rõ trên bao bì.`;
  }
  
  return {
    success: true,
    message: ingredientsInfo,
    intent: 'productIngredients'
  };
};

/**
 * Xử lý câu hỏi về hạn sử dụng sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
export const handleProductExpiryQuestion = (product) => {
  if (!product) return { success: false, message: 'Không tìm thấy thông tin sản phẩm' };
  
  let expiryInfo = '';
  
  if (product.expiryDate || product.productExpiry) {
    expiryInfo = `<strong>Hạn sử dụng ${product.productName}:</strong><br>${product.expiryDate || product.productExpiry}`;
  } else {
    expiryInfo = `<strong>Hạn sử dụng ${product.productName}:</strong><br>Thông tin về hạn sử dụng được in trên bao bì sản phẩm. 
    Vui lòng kiểm tra khi nhận hàng.`;
  }
  
  if (product.storageInfo || product.productStorage) {
    expiryInfo += `<br><br><strong>Hướng dẫn bảo quản:</strong><br>${product.storageInfo || product.productStorage}`;
  }
  
  return {
    success: true,
    message: expiryInfo,
    intent: 'productExpiry'
  };
};

/**
 * Xử lý câu hỏi về đánh giá sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
export const handleProductReviewsQuestion = (product) => {
  if (!product) return { success: false, message: 'Không tìm thấy thông tin sản phẩm' };
  
  let reviewInfo = '';
  
  if (product.averageRating) {
    reviewInfo = `<strong>Đánh giá ${product.productName}:</strong><br>
    Điểm đánh giá trung bình: ${product.averageRating}/5 sao`;
    
    if (product.numOfReviews) {
      reviewInfo += ` (${product.numOfReviews} lượt đánh giá)`;
    }
  } else {
    reviewInfo = `<strong>Đánh giá ${product.productName}:</strong><br>
    Sản phẩm này chưa có đánh giá. ${product.productName} là sản phẩm chất lượng cao, 
    được nhiều khách hàng tin dùng trong thời gian qua.`;
  }
  
  return {
    success: true,
    message: reviewInfo,
    intent: 'productReviews'
  };
};

/**
 * Xử lý câu hỏi liên quan đến sản phẩm và nhu cầu sức khỏe
 */

/**
 * Phát hiện nhu cầu sức khỏe từ câu hỏi
 * @param {string} message - Câu hỏi của người dùng
 * @returns {Array} - Danh sách các nhu cầu sức khỏe phát hiện được và điểm số
 */
export const detectHealthNeeds = (message) => {
  if (!message) return [];

  const normalizedMessage = message.toLowerCase();
  const healthNeeds = [];

  // Kiểm tra các từ khóa liên quan đến sức khỏe
  for (const [need, keywords] of Object.entries(healthKeywords)) {
    for (const keyword of keywords) {
      if (normalizedMessage.includes(keyword)) {
        // Tính điểm dựa trên độ dài từ khóa và vị trí xuất hiện
        const score = keyword.length * (1 + 1/Math.max(1, normalizedMessage.indexOf(keyword)));
        healthNeeds.push({ need, keyword, score });
        break; // Chỉ tính điểm cho từ khóa đầu tiên tìm thấy trong mỗi nhóm
      }
    }
  }

  // Sắp xếp theo điểm số giảm dần
  healthNeeds.sort((a, b) => b.score - a.score);
  
  return healthNeeds;
};

/**
 * Kiểm tra xem câu hỏi có khớp với câu hỏi mẫu không
 * @param {string} message - Câu hỏi của người dùng
 * @param {string} healthNeed - Nhu cầu sức khỏe
 * @returns {string|null} - Câu trả lời mẫu nếu khớp, null nếu không khớp
 */
const checkExampleQuestions = (message, healthNeed) => {
  if (!message || !healthNeed || !healthResponses[healthNeed] || !healthResponses[healthNeed].examples) {
    return null;
  }

  const normalizedMessage = message.toLowerCase();
  const examples = healthResponses[healthNeed].examples;

  for (const example of examples) {
    const normalizedQuestion = example.question.toLowerCase();
    
    // Kiểm tra xem câu hỏi có tương tự với câu hỏi mẫu không
    if (normalizedMessage === normalizedQuestion || 
        normalizedMessage.includes(normalizedQuestion) || 
        normalizedQuestion.includes(normalizedMessage)) {
      return example.answer;
    }
    
    // Tính số từ trùng nhau
    const messageWords = normalizedMessage.split(/\s+/);
    const questionWords = normalizedQuestion.split(/\s+/);
    const commonWords = messageWords.filter(word => questionWords.includes(word));
    
    // Nếu có ít nhất 3 từ trùng nhau và chiếm hơn 60% số từ trong câu hỏi mẫu
    if (commonWords.length >= 3 && commonWords.length / questionWords.length > 0.6) {
      return example.answer;
    }
  }

  return null;
};

/**
 * Tạo phản hồi cho nhu cầu sức khỏe cụ thể
 * @param {string} healthNeed - Nhu cầu sức khỏe
 * @param {Array} products - Danh sách sản phẩm phù hợp (nếu có)
 * @returns {string|Object} - Phản hồi cho người dùng
 */
export const generateHealthResponse = (healthNeed, products = []) => {
  try {
    // Nếu có cấu hình phản hồi cho nhu cầu sức khỏe này, sử dụng nó
    if (healthResponses[healthNeed] && healthResponses[healthNeed].responses) {
      // Lấy ngẫu nhiên một câu trả lời từ danh sách
      const responses = healthResponses[healthNeed].responses;
      const randomIndex = Math.floor(Math.random() * responses.length);
      return responses[randomIndex];
    }
    
    // Nếu không có cấu hình, sử dụng khuyến nghị mặc định
    if (!healthRecommendations[healthNeed]) {
      return "Tôi không có thông tin cụ thể về nhu cầu sức khỏe của bạn. Hãy tham khảo ý kiến của chuyên gia dinh dưỡng hoặc bác sĩ.";
    }
    
    const recommendation = healthRecommendations[healthNeed];
    
    let response = `${recommendation.description}\n\n`;
    response += "Nên ăn:\n";
    recommendation.recommended.forEach(food => {
      response += `- ${food}\n`;
    });
    
    response += "\nNên hạn chế:\n";
    recommendation.avoid.forEach(food => {
      response += `- ${food}\n`;
    });
    
    // Thêm thông tin về sản phẩm nếu có
    if (products && products.length > 0) {
      // Tạo danh sách sản phẩm được định dạng để hiển thị với hình ảnh
      const formattedProducts = products.slice(0, 5).map(product => ({
        id: product._id,
        name: product.productName,
        price: product.productPrice,
        discount: product.productDiscount || 0,
        promotionalPrice: product.productPromoPrice || 
          (product.productDiscount ? Math.round(product.productPrice * (1 - product.productDiscount/100)) : product.productPrice),
        image: product.productImages && product.productImages.length > 0 ? product.productImages[0] : 'default-product.jpg',
        description: product.productInfo || product.productDetails || ''
      }));
      
      // Trả về đối tượng với cả text và danh sách sản phẩm
      return {
        text: response,
        products: formattedProducts,
        title: `Sản phẩm phù hợp cho ${recommendation.title}`,
        type: 'healthProducts'
      };
    }
    
    return response;
  } catch (error) {
    console.error("Lỗi khi tạo câu trả lời về sức khỏe:", error);
    return "Đã xảy ra lỗi khi tạo câu trả lời về sức khỏe. Vui lòng thử lại sau.";
  }
};

/**
 * Tìm sản phẩm phù hợp với nhu cầu sức khỏe
 * @param {string} healthNeed - Nhu cầu sức khỏe (tieuDuong, huyetAp, ...)
 * @returns {Promise<Array>} - Danh sách sản phẩm phù hợp
 */
export const findProductsForHealthNeed = async (healthNeed) => {
  try {
    if (!healthNeed || !healthRecommendations[healthNeed]) {
      console.log(`Không tìm thấy khuyến nghị cho nhu cầu sức khỏe: ${healthNeed}`);
      return [];
    }
    
    const recommendation = healthRecommendations[healthNeed];
    console.log(`Tìm sản phẩm cho nhu cầu sức khỏe: ${healthNeed}`);
    
    // Xây dựng query tìm kiếm
    const searchQuery = {
      $or: [
        // Tìm theo từ khóa trong tên sản phẩm
        { productName: { $regex: recommendation.productKeywords.join('|'), $options: 'i' } },
        // Tìm theo danh mục
        { productCategory: { $in: recommendation.productCategories } },
        // Tìm trong mô tả sản phẩm
        { productDescription: { $regex: recommendation.productKeywords.join('|'), $options: 'i' } }
      ],
      // Đảm bảo sản phẩm còn hàng
      productStatus: { $ne: "Hết hàng" }
    };
    
    // Tìm kiếm sản phẩm
    const products = await Product.find(searchQuery).limit(10);
    console.log(`Tìm thấy ${products.length} sản phẩm cho nhu cầu sức khỏe ${healthNeed}`);
    
    return products;
  } catch (error) {
    console.error(`Lỗi khi tìm sản phẩm cho nhu cầu sức khỏe ${healthNeed}:`, error);
    return [];
  }
};

/**
 * Xử lý câu hỏi liên quan đến sản phẩm
 * @param {string} message - Câu hỏi của người dùng
 * @param {string} productId - ID sản phẩm (nếu có)
 * @param {string} userId - ID người dùng
 * @returns {Promise<Object>} - Phản hồi cho người dùng
 */
export const handleProductPageQuestion = async (message, productId, userId) => {
  try {
    console.log(`Xử lý câu hỏi: "${message}"`);
    
    // Phát hiện nhu cầu sức khỏe từ câu hỏi
    const healthNeeds = detectHealthNeeds(message);
    console.log("Nhu cầu sức khỏe phát hiện được:", healthNeeds);
    
    // Nếu phát hiện nhu cầu sức khỏe, ưu tiên trả lời theo hướng đó
    if (healthNeeds.length > 0) {
      const primaryNeed = healthNeeds[0].need;
      console.log(`Phát hiện nhu cầu sức khỏe chính: ${primaryNeed}`);
      
      // Kiểm tra xem câu hỏi có khớp với câu hỏi mẫu không
      const exampleAnswer = checkExampleQuestions(message, primaryNeed);
      if (exampleAnswer) {
        console.log("Tìm thấy câu trả lời mẫu");
        
        // Lưu ngữ cảnh để sử dụng sau này
        if (userId) {
          saveContext(userId, {
            lastHealthNeed: primaryNeed
          });
        }
  
        return {
          success: true,
          message: exampleAnswer,
          type: 'text',
          intent: `health_${primaryNeed}`
        };
      }
      
      // Tìm sản phẩm phù hợp với nhu cầu sức khỏe
      const products = await findProductsForHealthNeed(primaryNeed);
      console.log(`Tìm thấy ${products.length} sản phẩm phù hợp với nhu cầu sức khỏe ${primaryNeed}`);
      
      // Tạo phản hồi cho nhu cầu sức khỏe
      const healthResponse = generateHealthResponse(primaryNeed, products);
      
      if (healthResponse) {
        // Lưu ngữ cảnh để sử dụng sau này
        if (userId) {
          saveContext(userId, {
            lastHealthNeed: primaryNeed,
            lastHealthProducts: products.map(p => p._id)
          });
        }
        
        // Kiểm tra xem phản hồi là đối tượng hay chuỗi
        if (typeof healthResponse === 'object' && healthResponse.type === 'healthProducts') {
          return {
            success: true,
            message: healthResponse.text,
            products: healthResponse.products,
            title: healthResponse.title,
            type: healthResponse.type,
            intent: `health_${primaryNeed}`
          };
        } else {
          return {
            success: true,
            message: healthResponse,
            type: 'text',
            intent: `health_${primaryNeed}`
          };
        }
      }
    }
    
    // Nếu không phát hiện nhu cầu sức khỏe hoặc không có phản hồi phù hợp,
    // tiếp tục xử lý câu hỏi về sản phẩm như trước đây
    // (Phần code xử lý câu hỏi sản phẩm thông thường)
    
    // Đây là phản hồi mặc định nếu không xử lý được câu hỏi
    return {
      success: true,
      message: "Tôi không tìm thấy thông tin phù hợp với câu hỏi của bạn. Vui lòng hỏi rõ hơn hoặc liên hệ với nhân viên tư vấn để được hỗ trợ.",
      type: 'text'
    };
    
  } catch (error) {
    console.error("Lỗi khi xử lý câu hỏi về sản phẩm:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.",
      type: 'text'
    };
  }
}; 