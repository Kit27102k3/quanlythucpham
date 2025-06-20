/**
 * Xử lý câu hỏi về sản phẩm cụ thể
 * File này chứa các hàm để trả lời câu hỏi về sản phẩm
 */

import Product from "../../Model/Products.js";
import { saveContext, getUserContext } from "../../Model/UserContext.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Lấy đường dẫn thư mục hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import health recommendations data
const healthResponsesPath = path.join(
  __dirname,
  "../../chatbot/config/health_responses.json"
);
let healthRecommendations = {};

try {
  // Kiểm tra xem file có tồn tại không
  if (fs.existsSync(healthResponsesPath)) {
    const healthResponsesData = JSON.parse(
      fs.readFileSync(healthResponsesPath, "utf8")
    );
    healthRecommendations = healthResponsesData;
    console.log("Đã tải thành công dữ liệu health_responses.json");
  } else {
    console.log(
      "File health_responses.json không tồn tại tại đường dẫn:",
      healthResponsesPath
    );
    // Tạo dữ liệu mặc định
    healthRecommendations = {
      meBau: {
        title: "Thực phẩm cho mẹ bầu",
        description:
          "Mẹ bầu cần thực phẩm giàu folate, sắt, canxi, DHA và nhiều vitamin khoáng chất khác để hỗ trợ sự phát triển của thai nhi.",
        recommended: [
          "Rau lá xanh đậm (rau bina, cải xoăn)",
          "Trái cây tươi",
          "Các loại đậu",
          "Ngũ cốc nguyên hạt",
          "Trứng",
          "Sữa và các sản phẩm từ sữa",
          "Cá béo (cá hồi, cá thu) giàu DHA",
          "Thịt nạc",
          "Các loại hạt",
        ],
        avoid: [
          "Cá có hàm lượng thủy ngân cao (cá kiếm, cá thu king)",
          "Thịt sống hoặc chưa nấu chín",
          "Trứng sống",
          "Pho mát mềm chưa tiệt trùng",
          "Cà phê, rượu bia",
          "Thực phẩm chế biến sẵn có nhiều muối và chất bảo quản",
        ],
        productKeywords: [
          "mẹ bầu",
          "bà bầu",
          "thai kỳ",
          "DHA",
          "folate",
          "sắt",
          "canxi",
          "vitamin",
        ],
        productCategories: [
          "Thực phẩm cho mẹ bầu",
          "Sữa bầu",
          "Thực phẩm bổ sung",
        ],
      },
    };
  }
} catch (error) {
  console.error("Lỗi khi đọc file health_responses.json:", error);
  // Tạo dữ liệu mặc định nếu có lỗi
  healthRecommendations = {
    meBau: {
      title: "Thực phẩm cho mẹ bầu",
      description:
        "Mẹ bầu cần thực phẩm giàu folate, sắt, canxi, DHA và nhiều vitamin khoáng chất khác để hỗ trợ sự phát triển của thai nhi.",
      recommended: [
        "Rau lá xanh đậm (rau bina, cải xoăn)",
        "Trái cây tươi",
        "Các loại đậu",
        "Ngũ cốc nguyên hạt",
        "Trứng",
        "Sữa và các sản phẩm từ sữa",
        "Cá béo (cá hồi, cá thu) giàu DHA",
        "Thịt nạc",
        "Các loại hạt",
      ],
      avoid: [
        "Cá có hàm lượng thủy ngân cao (cá kiếm, cá thu king)",
        "Thịt sống hoặc chưa nấu chín",
        "Trứng sống",
        "Pho mát mềm chưa tiệt trùng",
        "Cà phê, rượu bia",
        "Thực phẩm chế biến sẵn có nhiều muối và chất bảo quản",
      ],
      productKeywords: [
        "mẹ bầu",
        "bà bầu",
        "thai kỳ",
        "DHA",
        "folate",
        "sắt",
        "canxi",
        "vitamin",
      ],
      productCategories: [
        "Thực phẩm cho mẹ bầu",
        "Sữa bầu",
        "Thực phẩm bổ sung",
      ],
    },
  };
}

// Define health keywords based on the health recommendations data
const healthKeywords = {
  tieuDuong: [
    "tiểu đường",
    "đường huyết",
    "đường trong máu",
    "tiểu nhiều",
    "khát nước",
    "insulin",
  ],
  huyetAp: [
    "huyết áp",
    "cao huyết áp",
    "tăng huyết áp",
    "hạ huyết áp",
    "đau đầu",
    "chóng mặt",
  ],
  giamCan: [
    "giảm cân",
    "béo phì",
    "thừa cân",
    "giảm mỡ",
    "đốt mỡ",
    "calo thấp",
  ],
  anChay: [
    "ăn chay",
    "chay trường",
    "thuần chay",
    "không thịt",
    "không động vật",
    "đạm thực vật",
  ],
  tangCo: [
    "tăng cơ",
    "phát triển cơ bắp",
    "protein",
    "tập gym",
    "thể hình",
    "whey",
  ],
  meBau: [
    "mẹ bầu",
    "bà bầu",
    "mang thai",
    "thai kỳ",
    "thai nhi",
    "đang mang thai",
  ],
  treSoSinh: [
    "trẻ sơ sinh",
    "em bé",
    "trẻ nhỏ",
    "trẻ em",
    "dinh dưỡng trẻ",
    "bé",
  ],
  nguoiGia: [
    "người già",
    "cao tuổi",
    "người lớn tuổi",
    "tuổi cao",
    "xương khớp",
    "trí nhớ",
  ],
};

/**
 * Tạo phản hồi cho nhu cầu sức khỏe
 * @param {string} healthNeed - Loại nhu cầu sức khỏe
 * @param {Array} products - Danh sách sản phẩm phù hợp
 * @returns {string|Object} - Phản hồi cho người dùng
 */
export const generateHealthResponse = (healthNeed, products) => {
  console.log(
    `Tạo phản hồi cho nhu cầu sức khỏe: ${healthNeed} với ${products.length} sản phẩm`
  );

  // Xử lý đặc biệt cho "meBau" (phụ nữ mang thai)
  if (healthNeed === "meBau") {
    // Tìm các sản phẩm phù hợp cho phụ nữ mang thai
    console.log(
      `Tìm thấy ${products.length} sản phẩm phù hợp cho phụ nữ mang thai`
    );

    // Chuẩn bị danh sách sản phẩm để hiển thị
    const formattedProducts = products.map((product) => ({
      _id: product._id,
      productName: product.productName,
      productPrice: product.productPrice,
      productDiscount: product.productDiscount || 0,
      productImage:
        product.productImages && product.productImages.length > 0
          ? product.productImages[0]
          : null,
      productImageURL:
        product.productImageURLs && product.productImageURLs.length > 0
          ? product.productImageURLs[0]
          : null,
      imageBase64: product.productImageBase64 || null,
    }));

    // Tạo phản hồi
    if (products.length > 0) {
      return {
        type: "healthProducts",
        title: "Thực phẩm dành cho mẹ bầu",
        text: "- Thực phẩm chế biến sẵn có nhiều muối và chất bảo quản\n\nHiện tại cửa hàng có các sản phẩm phù hợp cho mẹ bầu:",
        products: formattedProducts,
      };
    } else {
      return {
        type: "text",
        text: "Hiện tại cửa hàng chưa có sản phẩm cụ thể dành cho mẹ bầu. Vui lòng liên hệ nhân viên tư vấn để được hỗ trợ thêm.",
      };
    }
  }

  // Xử lý đặc biệt cho "nguoiGia" (người lớn tuổi)
  if (healthNeed === "nguoiGia") {
    // Tìm các sản phẩm phù hợp cho người cao tuổi
    console.log(
      `Tìm thấy ${products.length} sản phẩm phù hợp cho người cao tuổi`
    );

    // Chuẩn bị danh sách sản phẩm để hiển thị
    const formattedProducts = products.map((product) => ({
      _id: product._id,
      productName: product.productName,
      productPrice: product.productPrice,
      productDiscount: product.productDiscount || 0,
      productImage:
        product.productImages && product.productImages.length > 0
          ? product.productImages[0]
          : null,
      productImageURL:
        product.productImageURLs && product.productImageURLs.length > 0
          ? product.productImageURLs[0]
          : null,
      imageBase64: product.productImageBase64 || null,
    }));

    // Danh sách thực phẩm nên ăn
    const recommendedFoods = [
      "Cá (đặc biệt cá béo như cá hồi, cá thu, cá mòi giàu omega-3)",
      "Trái cây tươi (đặc biệt là việt quất, dâu tây, cam quýt giàu chất chống oxy hóa)",
      "Rau lá xanh đậm (cải xoăn, rau bina, cải xoong giàu vitamin K)",
      "Các loại đậu (đậu đỏ, đậu đen, đậu nành giàu protein thực vật)",
      "Các loại hạt (hạnh nhân, óc chó, hạt lanh giàu chất béo lành mạnh)",
      "Sữa chua và các sản phẩm từ sữa lên men (giàu probiotics tốt cho hệ tiêu hóa)",
      "Ngũ cốc nguyên hạt (gạo lứt, yến mạch, quinoa giàu chất xơ)",
      "Thịt nạc (gà, thịt bò nạc giàu protein)",
      "Trứng (giàu protein chất lượng cao và vitamin D)",
      "Nước và các loại trà thảo mộc (giúp giữ nước và chống oxy hóa)",
    ];

    // Danh sách thực phẩm nên hạn chế
    const foodsToAvoid = [
      "Thực phẩm nhiều muối (mì ăn liền, đồ hộp, thực phẩm chế biến sẵn)",
      "Thực phẩm nhiều đường (bánh kẹo, nước ngọt, đồ ngọt)",
      "Thực phẩm chiên rán (nhiều dầu mỡ, khó tiêu hóa)",
      "Thực phẩm chứa nhiều chất béo bão hòa (bơ thực vật, mỡ động vật)",
      "Đồ uống có cồn (ảnh hưởng đến gan, não và tương tác với thuốc)",
      "Caffeine (có thể gây mất ngủ, tăng huyết áp)",
      "Thực phẩm cay nóng (có thể gây kích ứng dạ dày)",
      "Thực phẩm khó tiêu (thịt đỏ nhiều mỡ, đồ ăn cứng)",
    ];

    // Tạo phản hồi
    if (products.length > 0) {
      return {
        type: "healthProducts",
        title: "Thực phẩm dành cho người lớn tuổi",
        text:
          `Người cao tuổi cần thực phẩm dễ tiêu hóa, giàu dinh dưỡng, hỗ trợ sức khỏe xương khớp và não bộ.\n\n` +
          `✅ *Nên ăn:*\n${recommendedFoods
            .map((food) => `• ${food}`)
            .join("\n")}\n\n` +
          `❌ *Nên hạn chế:*\n${foodsToAvoid
            .map((food) => `• ${food}`)
            .join("\n")}\n\n` +
          `🛒 *Hiện tại cửa hàng có các sản phẩm phù hợp cho người cao tuổi:*`,
        products: formattedProducts,
      };
    } else {
      return {
        type: "text",
        text:
          `Người cao tuổi cần thực phẩm dễ tiêu hóa, giàu dinh dưỡng, hỗ trợ sức khỏe xương khớp và não bộ.\n\n` +
          `✅ *Nên ăn:*\n${recommendedFoods
            .map((food) => `• ${food}`)
            .join("\n")}\n\n` +
          `❌ *Nên hạn chế:*\n${foodsToAvoid
            .map((food) => `• ${food}`)
            .join("\n")}\n\n` +
          `Hiện tại cửa hàng chưa có sản phẩm cụ thể dành cho người cao tuổi. Vui lòng liên hệ nhân viên tư vấn để được hỗ trợ thêm.`,
      };
    }
  }

  // Xử lý các nhu cầu sức khỏe khác
  // Tạo phản hồi tùy theo nhu cầu sức khỏe
  let responseText = '';
  let recommendedFoods = [];
  let foodsToAvoid = [];
  
  switch(healthNeed) {
    case 'tieuDuong':
      responseText = "Với người bị tiểu đường, nên ưu tiên thực phẩm có chỉ số đường huyết thấp, giàu chất xơ và protein, hạn chế carbohydrate đơn giản.";
      
      recommendedFoods = [
        "Rau lá xanh (rau bina, cải xoăn, cải thìa)",
        "Rau không chứa tinh bột (bông cải xanh, súp lơ, đậu cô ve)",
        "Trái cây ít ngọt (táo, dâu tây, việt quất, cam quýt)",
        "Ngũ cốc nguyên hạt (gạo lứt, yến mạch)",
        "Các loại đậu (đậu đen, đậu đỏ, đậu gà)",
        "Các loại hạt (hạnh nhân, óc chó, hạt chia)",
        "Protein nạc (cá, ức gà, thịt bò nạc)",
        "Trứng",
        "Các loại dầu lành mạnh (dầu oliu, dầu mè)",
        "Các loại gia vị tự nhiên (quế, nghệ)"
      ];
      
      foodsToAvoid = [
        "Thực phẩm chứa đường tinh luyện (bánh ngọt, kẹo, nước ngọt)",
        "Nước ép trái cây (ngay cả 100% tự nhiên)",
        "Gạo trắng, bánh mì trắng, mì ống",
        "Khoai tây, ngô, khoai lang số lượng lớn",
        "Trái cây khô (nho khô, chà là)",
        "Thực phẩm chiên rán",
        "Thực phẩm chế biến sẵn",
        "Các loại sốt có đường (tương cà, tương ớt)",
        "Rượu bia"
      ];
      break;
    case 'huyetAp':
      responseText = "Với người bị huyết áp cao, nên ưu tiên thực phẩm ít muối, giàu kali, magiê và canxi, tránh thực phẩm chế biến sẵn.";
      
      recommendedFoods = [
        "Rau lá xanh đậm (rau bina, cải xoăn)",
        "Trái cây giàu kali (chuối, kiwi, cam, cà chua)",
        "Các loại quả mọng (việt quất, dâu tây, mâm xôi)",
        "Các loại hạt không muối (hạnh nhân, óc chó)",
        "Ngũ cốc nguyên hạt (yến mạch, gạo lứt, quinoa)",
        "Cá béo (cá hồi, cá thu, cá mòi)",
        "Sữa chua và các sản phẩm từ sữa ít béo",
        "Các loại đậu và đậu lăng",
        "Chocolate đen (hàm lượng cacao trên 70%)",
        "Tỏi và nghệ"
      ];
      
      foodsToAvoid = [
        "Thực phẩm chế biến sẵn (đồ hộp, thực phẩm đông lạnh)",
        "Thực phẩm đóng gói (snack, bánh quy mặn)",
        "Thịt chế biến (xúc xích, thịt nguội, giăm bông)",
        "Nước sốt đóng chai và súp đóng hộp",
        "Thực phẩm đồ ăn nhanh",
        "Đồ ngọt và nước ngọt",
        "Bơ thực vật và margarine",
        "Rượu bia",
        "Thực phẩm nhiều muối (dưa muối, cà muối)",
        "Các loại pho mát cứng"
      ];
      break;
    case 'giamCan':
      responseText = "Với người muốn giảm cân, nên ưu tiên thực phẩm giàu protein, ít carbohydrate, nhiều chất xơ và uống đủ nước.";
      
      recommendedFoods = [
        "Protein nạc (ức gà, cá, đậu phụ)",
        "Trứng",
        "Rau xanh không hạn chế (rau bina, cải xoăn, xà lách)",
        "Rau giàu chất xơ (bông cải xanh, súp lơ, cải Brussels)",
        "Trái cây ít đường (táo, dâu tây, quả mọng)",
        "Các loại hạt với lượng vừa phải (hạnh nhân, óc chó)",
        "Các loại đậu và đậu lăng",
        "Ngũ cốc nguyên hạt với lượng vừa phải",
        "Sữa chua Hy Lạp không đường",
        "Nước, trà xanh, cà phê không đường"
      ];
      
      foodsToAvoid = [
        "Thực phẩm chế biến sẵn",
        "Đồ ăn nhanh",
        "Thực phẩm chiên rán",
        "Bánh kẹo, đồ ngọt",
        "Nước ngọt, nước ép trái cây",
        "Rượu bia",
        "Bánh mì trắng, gạo trắng",
        "Các loại sốt béo (mayonnaise, sốt kem)",
        "Thực phẩm có nhãn 'ít béo' nhưng nhiều đường",
        "Các loại thịt chế biến (xúc xích, thịt xông khói)"
      ];
      break;
    case 'tangCo':
      responseText = "Với người muốn tăng cơ, nên ưu tiên thực phẩm giàu protein, carbohydrate phức hợp, chất béo lành mạnh và ăn nhiều bữa nhỏ trong ngày.";
      
      recommendedFoods = [
        "Protein chất lượng cao (thịt bò nạc, ức gà, cá hồi, trứng)",
        "Các sản phẩm từ sữa (sữa, phô mai, sữa chua Hy Lạp)",
        "Protein thực vật (đậu phụ, tempeh, seitan, các loại đậu)",
        "Carbohydrate phức hợp (gạo lứt, khoai lang, yến mạch)",
        "Trái cây (chuối, táo, dứa)",
        "Rau xanh (rau bina, cải xoăn, bông cải xanh)",
        "Chất béo lành mạnh (bơ, dầu oliu, các loại hạt)",
        "Các loại hạt và bơ hạt (đậu phộng, hạnh nhân)",
        "Ngũ cốc nguyên hạt",
        "Nước và các loại đồ uống bổ sung protein"
      ];
      
      foodsToAvoid = [
        "Thực phẩm chế biến sẵn",
        "Đồ ăn nhanh",
        "Thực phẩm nhiều đường",
        "Rượu bia",
        "Thực phẩm giàu chất béo bão hòa",
        "Thức ăn vặt nhiều muối",
        "Đồ uống có ga",
        "Carbohydrate tinh chế (bánh mì trắng, gạo trắng)",
        "Thực phẩm gây viêm"
      ];
      break;
    case 'cholesterol':
      responseText = "Với người có cholesterol cao, nên ưu tiên thực phẩm giàu chất xơ hòa tan, omega-3, hạn chế chất béo bão hòa và chất béo chuyển hóa.";
      
      recommendedFoods = [
        "Yến mạch và các loại ngũ cốc giàu chất xơ hòa tan",
        "Các loại đậu và đậu lăng",
        "Trái cây giàu pectin (táo, lê, cam quýt)",
        "Các loại quả mọng",
        "Cá béo (cá hồi, cá thu, cá mòi)",
        "Các loại hạt (hạnh nhân, óc chó)",
        "Dầu oliu và dầu canola",
        "Rau xanh và rau giàu chất xơ",
        "Đậu nành và các sản phẩm từ đậu nành",
        "Tỏi và gừng"
      ];
      
      foodsToAvoid = [
        "Thịt đỏ béo",
        "Da gà và da vịt",
        "Thực phẩm chiên rán",
        "Bơ và các sản phẩm từ sữa nguyên kem",
        "Thực phẩm chứa dầu dừa và dầu cọ",
        "Thực phẩm chế biến sẵn chứa chất béo chuyển hóa",
        "Bánh ngọt, bánh quy, bánh nướng",
        "Thực phẩm nhanh",
        "Lòng đỏ trứng với số lượng lớn",
        "Các loại pho mát cứng"
      ];
      break;
    default:
      responseText = "Để duy trì sức khỏe tốt, nên ưu tiên chế độ ăn cân bằng với nhiều rau xanh, trái cây, protein nạc và ngũ cốc nguyên hạt.";
      
      recommendedFoods = [
        "Rau xanh đa dạng (rau bina, cải xoăn, xà lách)",
        "Trái cây tươi theo mùa",
        "Protein nạc (gà, cá, đậu phụ)",
        "Ngũ cốc nguyên hạt (gạo lứt, yến mạch)",
        "Các loại đậu và đậu lăng",
        "Các loại hạt không muối",
        "Chất béo lành mạnh (dầu oliu, bơ)",
        "Sữa chua và các sản phẩm từ sữa ít béo",
        "Trứng",
        "Nước và trà thảo mộc"
      ];
      
      foodsToAvoid = [
        "Thực phẩm chế biến sẵn",
        "Đồ ăn nhanh",
        "Thực phẩm nhiều đường",
        "Đồ uống có ga và nước ngọt",
        "Thực phẩm chiên rán",
        "Thực phẩm nhiều muối",
        "Rượu bia với lượng lớn",
        "Thịt đỏ với lượng lớn",
        "Bánh kẹo và đồ ngọt",
        "Carbohydrate tinh chế (bánh mì trắng, gạo trắng)"
      ];
  }
  
  // Chuẩn bị danh sách sản phẩm để hiển thị
  const formattedProducts = products.map(product => ({
    _id: product._id,
    productName: product.productName,
    productPrice: product.productPrice,
    productDiscount: product.productDiscount || 0,
    productImage: product.productImages && product.productImages.length > 0 ? product.productImages[0] : null,
    productImageURL: product.productImageURLs && product.productImageURLs.length > 0 ? product.productImageURLs[0] : null,
    imageBase64: product.productImageBase64 || null
  }));
  
  // Tạo phản hồi
  if (products.length > 0) {
    return {
      type: 'healthProducts',
      title: `Thực phẩm cho ${getHealthNeedDisplayName(healthNeed)}`,
      text: `${responseText}\n\n` +
            `✅ *Nên ăn:*\n${recommendedFoods.map(food => `• ${food}`).join('\n')}\n\n` +
            `❌ *Nên hạn chế:*\n${foodsToAvoid.map(food => `• ${food}`).join('\n')}\n\n` +
            `🛒 *Hiện tại cửa hàng có các sản phẩm phù hợp:*`,
      products: formattedProducts
    };
  } else {
    return {
      type: 'text',
      text: `${responseText}\n\n` +
            `✅ *Nên ăn:*\n${recommendedFoods.map(food => `• ${food}`).join('\n')}\n\n` +
            `❌ *Nên hạn chế:*\n${foodsToAvoid.map(food => `• ${food}`).join('\n')}\n\n` +
            `Hiện tại cửa hàng chưa có sản phẩm cụ thể phù hợp với nhu cầu của bạn. Vui lòng liên hệ nhân viên tư vấn để được hỗ trợ thêm.`
    };
  }
};

// Hàm hỗ trợ để hiển thị tên nhu cầu sức khỏe
function getHealthNeedDisplayName(healthNeed) {
  const displayNames = {
    tieuDuong: "người tiểu đường",
    huyetAp: "người huyết áp cao",
    giamCan: "người muốn giảm cân",
    tangCo: "người muốn tăng cân",
    cholesterol: "người có cholesterol cao",
    meBau: "mẹ bầu",
    nguoiGia: "người cao tuổi",
    treSoSinh: "trẻ sơ sinh",
  };

  return displayNames[healthNeed] || "sức khỏe tốt";
}

/**
 * Định dạng số tiền thành chuỗi có dấu phân cách hàng nghìn
 * @param {number} amount - Số tiền cần định dạng
 * @returns {string} - Chuỗi đã được định dạng
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN").format(amount);
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
  if (
    lowerMessage.includes("công dụng") ||
    lowerMessage.includes("tác dụng") ||
    lowerMessage.includes("dùng để làm gì") ||
    lowerMessage.includes("dùng làm gì") ||
    lowerMessage.includes("sử dụng") ||
    lowerMessage.includes("tác dụng gì")
  ) {
    return "productUsage";
  }
  
  // Giới thiệu sản phẩm (productIntroduction)
  if (
    lowerMessage.includes("giới thiệu") ||
    lowerMessage.includes("nói về") ||
    lowerMessage.includes("giới thiệu về") ||
    lowerMessage.includes("thông tin về") ||
    lowerMessage.includes("mô tả")
  ) {
    return "productIntro";
  }
  
  // Giá sản phẩm (productPrice, productPromoPrice)
  if (
    lowerMessage.includes("giá") ||
    lowerMessage.includes("bao nhiêu tiền") ||
    lowerMessage.includes("giá cả") ||
    lowerMessage.includes("giá bao nhiêu")
  ) {
    return "productPrice";
  }
  
  // Sản phẩm liên quan (productCategory)
  if (
    lowerMessage.includes("liên quan") ||
    lowerMessage.includes("tương tự") ||
    lowerMessage.includes("sản phẩm khác") ||
    lowerMessage.includes("sản phẩm cùng loại") ||
    lowerMessage.includes("còn gì khác") ||
    lowerMessage.includes("gợi ý")
  ) {
    return "relatedProducts";
  }
  
  // Xuất xứ sản phẩm
  if (
    lowerMessage.includes("xuất xứ") ||
    lowerMessage.includes("nguồn gốc") ||
    lowerMessage.includes("sản xuất ở đâu") ||
    lowerMessage.includes("nước nào") ||
    lowerMessage.includes("hãng nào")
  ) {
    return "productOrigin";
  }
  
  // Thành phần sản phẩm
  if (
    lowerMessage.includes("thành phần") ||
    lowerMessage.includes("nguyên liệu") ||
    lowerMessage.includes("có chứa") ||
    lowerMessage.includes("làm từ") ||
    lowerMessage.includes("được làm từ") ||
    lowerMessage.includes("chất liệu")
  ) {
    return "productIngredients";
  }
  
  // Hạn sử dụng sản phẩm
  if (
    lowerMessage.includes("hạn sử dụng") ||
    lowerMessage.includes("date") ||
    lowerMessage.includes("hết hạn") ||
    lowerMessage.includes("dùng được bao lâu") ||
    lowerMessage.includes("bảo quản")
  ) {
    return "productExpiry";
  }
  
  // Đánh giá sản phẩm
  if (
    lowerMessage.includes("đánh giá") ||
    lowerMessage.includes("review") ||
    lowerMessage.includes("feedback") ||
    lowerMessage.includes("nhận xét") ||
    lowerMessage.includes("tốt không") ||
    lowerMessage.includes("có ngon không") ||
    lowerMessage.includes("có tốt không")
  ) {
    return "productReviews";
  }
  
  return null;
};

/**
 * Xử lý câu hỏi về công dụng sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
export const handleProductUsageQuestion = (product) => {
  if (!product)
    return { success: false, message: "Không tìm thấy thông tin sản phẩm" };
  
  const usage =
    product.productDetails ||
    "Hiện chưa có thông tin chi tiết về công dụng của sản phẩm này.";
  
  return {
    success: true,
    message: `<strong>Công dụng của ${product.productName}:</strong><br>${usage}`,
    intent: "productUsage",
  };
};

/**
 * Xử lý câu hỏi về giới thiệu sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
export const handleProductIntroQuestion = (product) => {
  if (!product)
    return { success: false, message: "Không tìm thấy thông tin sản phẩm" };
  
  const intro =
    product.productIntroduction ||
    "Hiện chưa có thông tin giới thiệu về sản phẩm này.";
  
  return {
    success: true,
    message: `<strong>Giới thiệu về ${product.productName}:</strong><br>${intro}`,
    intent: "productIntro",
  };
};

/**
 * Xử lý câu hỏi về giá sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
export const handleProductPriceQuestion = (product) => {
  if (!product)
    return { success: false, message: "Không tìm thấy thông tin sản phẩm" };
  
  const originalPrice = product.productPrice;
  const discount = product.productDiscount || 0;
  const promoPrice =
    product.productPromoPrice ||
    (discount > 0
      ? Math.round(originalPrice * (1 - discount / 100))
      : originalPrice);
  
  let priceMessage = `<strong>Giá ${product.productName}:</strong><br>`;
  
  if (discount > 0) {
    priceMessage += `<span style="text-decoration: line-through;">${formatCurrency(
      originalPrice
    )}đ</span><br>`;
    priceMessage += `<strong style="color: red;">${formatCurrency(
      promoPrice
    )}đ</strong> (Giảm ${discount}%)`;
  } else {
    priceMessage += `<strong style="color: red;">${formatCurrency(
      originalPrice
    )}đ</strong>`;
  }
  
  return {
    success: true,
    message: priceMessage,
    intent: "productPrice",
  };
};

/**
 * Xử lý câu hỏi về sản phẩm liên quan
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
export const handleRelatedProductsQuestion = async (product) => {
  if (!product)
    return { success: false, message: "Không tìm thấy thông tin sản phẩm" };
  
  try {
    // Tìm các sản phẩm cùng danh mục
    const relatedProducts = await Product.find({
      productCategory: product.productCategory,
      _id: { $ne: product._id }, // Loại trừ sản phẩm hiện tại
    }).limit(5);
    
    if (!relatedProducts || relatedProducts.length === 0) {
      return {
        success: true,
        message: `Hiện không có sản phẩm nào khác trong danh mục "${product.productCategory}".`,
        intent: "relatedProducts",
      };
    }
    
    // Format sản phẩm để hiển thị
    const formattedProducts = relatedProducts.map((p) => ({
      id: p._id,
      name: p.productName,
      price: p.productPrice,
      discount: p.productDiscount || 0,
      promotionalPrice:
        p.productPromoPrice ||
        (p.productDiscount
          ? Math.round(p.productPrice * (1 - p.productDiscount / 100))
          : p.productPrice),
      image:
        p.productImages && p.productImages.length > 0
          ? p.productImages[0]
          : "default-product.jpg",
      description: p.productInfo || p.productDetails || "",
    }));
    
    return {
      success: true,
      message: `Các sản phẩm liên quan đến ${product.productName}:`,
      data: formattedProducts,
      type: "relatedProducts",
      text: `Các sản phẩm liên quan đến ${product.productName}:`,
      intent: "relatedProducts",
      nameCategory: `Sản phẩm cùng loại "${product.productCategory}"`,
    };
  } catch (error) {
    console.error("Lỗi khi tìm sản phẩm liên quan:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra khi tìm sản phẩm liên quan.",
      intent: "error",
    };
  }
};

/**
 * Xử lý câu hỏi về xuất xứ sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
export const handleProductOriginQuestion = (product) => {
  if (!product)
    return { success: false, message: "Không tìm thấy thông tin sản phẩm" };
  
  let originInfo = "";
  
  if (product.productOrigin || product.origin) {
    originInfo = `<strong>Xuất xứ ${product.productName}:</strong><br>${
      product.productOrigin || product.origin
    }`;
    
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
    intent: "productOrigin",
  };
};

/**
 * Xử lý câu hỏi về thành phần sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
export const handleProductIngredientsQuestion = (product) => {
  if (!product)
    return { success: false, message: "Không tìm thấy thông tin sản phẩm" };
  
  let ingredientsInfo = "";
  
  if (product.productIngredients || product.ingredients) {
    ingredientsInfo = `<strong>Thành phần của ${
      product.productName
    }:</strong><br>${product.productIngredients || product.ingredients}`;
  } else {
    ingredientsInfo = `<strong>Thành phần của ${product.productName}:</strong><br>Thông tin chi tiết về thành phần sản phẩm được ghi rõ trên bao bì.`;
  }
  
  return {
    success: true,
    message: ingredientsInfo,
    intent: "productIngredients",
  };
};

/**
 * Xử lý câu hỏi về hạn sử dụng sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
export const handleProductExpiryQuestion = (product) => {
  if (!product)
    return { success: false, message: "Không tìm thấy thông tin sản phẩm" };
  
  let expiryInfo = "";
  
  if (product.expiryDate || product.productExpiry) {
    expiryInfo = `<strong>Hạn sử dụng ${product.productName}:</strong><br>${
      product.expiryDate || product.productExpiry
    }`;
  } else {
    expiryInfo = `<strong>Hạn sử dụng ${product.productName}:</strong><br>Thông tin về hạn sử dụng được in trên bao bì sản phẩm. 
    Vui lòng kiểm tra khi nhận hàng.`;
  }
  
  if (product.storageInfo || product.productStorage) {
    expiryInfo += `<br><br><strong>Hướng dẫn bảo quản:</strong><br>${
      product.storageInfo || product.productStorage
    }`;
  }
  
  return {
    success: true,
    message: expiryInfo,
    intent: "productExpiry",
  };
};

/**
 * Xử lý câu hỏi về đánh giá sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
export const handleProductReviewsQuestion = (product) => {
  if (!product)
    return { success: false, message: "Không tìm thấy thông tin sản phẩm" };
  
  let reviewInfo = "";
  
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
    intent: "productReviews",
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

  // Kiểm tra trường hợp đặc biệt cho mẹ bầu
  if (
    normalizedMessage.includes("mẹ bầu") ||
    normalizedMessage.includes("bà bầu") ||
    normalizedMessage.includes("mang thai")
  ) {
    healthNeeds.push({ need: "meBau", keyword: "mẹ bầu", score: 10 });
    return healthNeeds;
  }

  // Kiểm tra các từ khóa liên quan đến sức khỏe
  for (const [need, keywords] of Object.entries(healthKeywords)) {
    for (const keyword of keywords) {
      if (normalizedMessage.includes(keyword)) {
        // Tính điểm dựa trên độ dài từ khóa và vị trí xuất hiện
        const score =
          keyword.length *
          (1 + 1 / Math.max(1, normalizedMessage.indexOf(keyword)));
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
 * Tìm sản phẩm phù hợp với nhu cầu sức khỏe
 * @param {string} healthNeed - Nhu cầu sức khỏe (tieuDuong, huyetAp, ...)
 * @returns {Promise<Array>} - Danh sách sản phẩm phù hợp
 */
export const findProductsForHealthNeed = async (healthNeed) => {
  try {
    if (!healthNeed) {
      console.log(`Không có nhu cầu sức khỏe được chỉ định`);
      return [];
    }

    console.log(`Tìm sản phẩm cho nhu cầu sức khỏe: ${healthNeed}`);

    // Xác định từ khóa tìm kiếm dựa trên nhu cầu sức khỏe
    let keywords = [];
    let categories = [];

    // Xử lý đặc biệt cho mẹ bầu
    if (healthNeed === "meBau") {
      keywords = [
        "mẹ bầu",
        "bà bầu",
        "thai kỳ",
        "DHA",
        "folate",
        "sắt",
        "canxi",
        "vitamin",
      ];
      categories = [
        "Thực phẩm cho mẹ bầu",
        "Sữa bầu",
        "Thực phẩm bổ sung",
        "Vitamin và khoáng chất",
      ];
    }
    // Xử lý cho các nhu cầu sức khỏe khác
    else if (healthRecommendations && healthRecommendations[healthNeed]) {
      const recommendation = healthRecommendations[healthNeed];
      keywords = recommendation.productKeywords || [];
      categories = recommendation.productCategories || [];
    }
    // Fallback nếu không có dữ liệu
    else {
      // Fallback keywords cho các nhu cầu sức khỏe phổ biến
      const fallbackKeywords = {
        tieuDuong: [
          "đường huyết thấp",
          "ít đường",
          "không đường",
          "cho người tiểu đường",
          "chỉ số GI thấp",
        ],
        huyetAp: ["ít muối", "không muối", "giảm huyết áp", "DASH", "tim mạch"],
        giamCan: [
          "giảm cân",
          "ít calo",
          "đốt mỡ",
          "kiểm soát cân nặng",
          "chất xơ",
        ],
        anChay: [
          "chay",
          "thuần chay",
          "đạm thực vật",
          "không động vật",
          "thực vật",
        ],
        tangCo: ["protein", "tăng cơ", "whey", "bcaa", "creatine", "tập gym"],
        treSoSinh: [
          "trẻ em",
          "trẻ sơ sinh",
          "em bé",
          "sữa công thức",
          "bột ăn dặm",
          "dinh dưỡng trẻ",
        ],
        nguoiGia: [
          "người cao tuổi",
          "người già",
          "xương khớp",
          "canxi",
          "vitamin D",
          "dễ tiêu hóa",
        ],
      };

      const fallbackCategories = {
        tieuDuong: [
          "Thực phẩm chức năng",
          "Đồ uống không đường",
          "Thực phẩm dinh dưỡng",
        ],
        huyetAp: [
          "Thực phẩm chức năng",
          "Đồ uống tốt cho tim mạch",
          "Thực phẩm dinh dưỡng",
        ],
        giamCan: [
          "Thực phẩm chức năng",
          "Đồ uống không đường",
          "Thực phẩm dinh dưỡng",
        ],
        anChay: ["Thực phẩm chay", "Đồ uống thực vật", "Thực phẩm dinh dưỡng"],
        tangCo: ["Thực phẩm bổ sung", "Protein", "Thực phẩm dinh dưỡng"],
        treSoSinh: [
          "Sữa công thức",
          "Thực phẩm ăn dặm",
          "Thực phẩm cho trẻ em",
        ],
        nguoiGia: [
          "Thực phẩm chức năng",
          "Sữa cho người cao tuổi",
          "Thực phẩm dinh dưỡng",
        ],
      };

      keywords = fallbackKeywords[healthNeed] || [
        "thực phẩm",
        "dinh dưỡng",
        "sức khỏe",
      ];
      categories = fallbackCategories[healthNeed] || [
        "Thực phẩm chức năng",
        "Thực phẩm dinh dưỡng",
      ];
    }

    console.log(`Từ khóa tìm kiếm: ${keywords.join(", ")}`);
    console.log(`Danh mục tìm kiếm: ${categories.join(", ")}`);

    // Danh sách các từ khóa/danh mục thực phẩm (ăn/uống được)
    const foodInclude = [
      "thực phẩm", "đồ ăn", "sữa", "nước uống", "ngũ cốc", "bánh", "kẹo", "trái cây", "rau", "củ", "quả", "thức uống", "protein", "dinh dưỡng", "bột", "cháo", "súp", "sữa chua", "nước ép", "đậu", "hạt", "mật ong", "dầu ăn", "gia vị"
    ];
    // Danh sách loại trừ các sản phẩm không phải thực phẩm
    const foodExclude = [
      "kem đánh răng", "xà phòng", "bột giặt", "nước rửa", "mỹ phẩm", "dầu gội", "sữa tắm", "nước lau", "nước tẩy", "băng vệ sinh", "bỉm", "tã", "khăn giấy", "giấy vệ sinh", "nước hoa", "nước xịt", "thuốc", "vitamin tổng hợp", "thực phẩm chức năng" // có thể giữ lại tùy nhu cầu
    ];

    // Xây dựng query tìm kiếm
    const searchQuery = {
      $and: [
        {
          $or: [
            // Tìm theo từ khóa trong tên sản phẩm
            { productName: { $regex: keywords.join("|"), $options: "i" } },
            // Tìm theo danh mục
            { productCategory: { $in: categories } },
            // Tìm trong mô tả sản phẩm
            { productDescription: { $regex: keywords.join("|"), $options: "i" } },
          ],
        },
        {
          $or: [
            // Chỉ lấy các sản phẩm thực phẩm (ăn/uống được)
            { productCategory: { $regex: foodInclude.join("|"), $options: "i" } },
            { productName: { $regex: foodInclude.join("|"), $options: "i" } },
          ],
        },
        {
          // Loại trừ các sản phẩm không phải thực phẩm
          productCategory: { $not: { $regex: foodExclude.join("|"), $options: "i" } },
        },
        {
          // Đảm bảo sản phẩm còn hàng
          productStatus: { $ne: "Hết hàng" },
        },
      ],
    };

    // Tìm kiếm sản phẩm
    const products = await Product.find(searchQuery).limit(10);
    console.log(
      `Tìm thấy ${products.length} sản phẩm cho nhu cầu sức khỏe ${healthNeed}`
    );

    return products;
  } catch (error) {
    console.error(
      `Lỗi khi tìm sản phẩm cho nhu cầu sức khỏe ${healthNeed}:`,
      error
    );
    return [];
  }
};

/**
 * Xử lý câu hỏi liên quan đến sản phẩm
 * @param {string} message - Câu hỏi của người dùng
 * @param {string} productIntent - Loại câu hỏi sản phẩm đã được phân loại
 * @returns {Promise<Object>} - Phản hồi cho người dùng
 */
export const handleProductQuery = async (message, context) => {
  try {
    console.log(`Xử lý câu hỏi: "${message}"`);

    // Tìm kiếm sản phẩm dựa trên tin nhắn
    const products = await searchProductsMongoDB(message);
    console.log(`Tìm thấy ${products.length} sản phẩm phù hợp`);

    if (products && products.length > 0) {
      // Lưu ngữ cảnh nếu có userId
      if (context && context.userId) {
        saveContext(context.userId, {
          lastProducts: products,
          lastProduct: products[0],
          lastQuery: message,
        });
      }

      // Chuẩn bị danh sách sản phẩm để hiển thị
      const formattedProducts = products.map((product) => ({
        _id: product._id,
        productName: product.productName,
        productPrice: product.productPrice,
        productDiscount: product.productDiscount || 0,
        productImage:
          product.productImages && product.productImages.length > 0
            ? product.productImages[0]
            : null,
        productImageURL:
          product.productImageURLs && product.productImageURLs.length > 0
            ? product.productImageURLs[0]
            : null,
        imageBase64: product.productImageBase64 || null,
      }));

      console.log(
        "Sản phẩm đã định dạng:",
        JSON.stringify(formattedProducts[0])
      );

      // Tạo phản hồi với danh sách sản phẩm
    return {
      success: true,
        message: `Tôi đã tìm thấy ${products.length} sản phẩm phù hợp với yêu cầu của bạn:`,
        products: formattedProducts,
        type: "productSearch",
      };
    } else {
      return {
        success: true,
        message:
          "Tôi không tìm thấy sản phẩm nào phù hợp với yêu cầu của bạn. Vui lòng thử lại với từ khóa khác.",
        products: [],
        type: "text",
      };
    }
  } catch (error) {
    console.error("Lỗi khi tìm kiếm sản phẩm:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi tìm kiếm sản phẩm. Vui lòng thử lại sau.",
      type: "text",
    };
  }
};

/**
 * Tìm kiếm sản phẩm trong MongoDB
 * @param {string} searchText - Từ khóa tìm kiếm
 * @returns {Promise<Array>} - Danh sách sản phẩm
 */
const searchProductsMongoDB = async (searchText) => {
  try {
    console.log("Đang tìm kiếm sản phẩm với query:", searchText);

    // Xử lý query để tìm từ khóa quan trọng
    const lowerQuery = searchText.toLowerCase();

    // Tìm kiếm sản phẩm theo giá
    const priceMatch =
      lowerQuery.match(/dưới (\d+)k/i) ||
      lowerQuery.match(/< (\d+)k/i) ||
      lowerQuery.match(/nhỏ hơn (\d+)k/i);
    const priceHighMatch =
      lowerQuery.match(/trên (\d+)k/i) ||
      lowerQuery.match(/> (\d+)k/i) ||
      lowerQuery.match(/lớn hơn (\d+)k/i);
    const priceBetweenMatch =
      lowerQuery.match(/từ (\d+)k đến (\d+)k/i) ||
      lowerQuery.match(/(\d+)k - (\d+)k/i);

    // Mảng các điều kiện tìm kiếm
    const conditions = [];
    let isPriceQuery = false;

    // Xử lý tìm kiếm theo khoảng giá
    if (priceMatch) {
      const maxPrice = parseInt(priceMatch[1]) * 1000;
      conditions.push({
        $or: [
          { price: { $lte: maxPrice } },
          { productPrice: { $lte: maxPrice } },
        ],
      });
      isPriceQuery = true;
      console.log("Tìm sản phẩm có giá dưới:", maxPrice);
    } else if (priceHighMatch) {
      const minPrice = parseInt(priceHighMatch[1]) * 1000;
      conditions.push({
        $or: [
          { price: { $gte: minPrice } },
          { productPrice: { $gte: minPrice } },
        ],
      });
      isPriceQuery = true;
      console.log("Tìm sản phẩm có giá trên:", minPrice);
    } else if (priceBetweenMatch) {
      const minPrice = parseInt(priceBetweenMatch[1]) * 1000;
      const maxPrice = parseInt(priceBetweenMatch[2]) * 1000;
      conditions.push({
        $or: [
          { price: { $gte: minPrice, $lte: maxPrice } },
          { productPrice: { $gte: minPrice, $lte: maxPrice } },
        ],
      });
      isPriceQuery = true;
      console.log("Tìm sản phẩm có giá từ", minPrice, "đến", maxPrice);
    }

    // Kiểm tra xem có cụm từ cụ thể không
    const specificPhrases = [
      { phrase: "nước giặt", category: "Đồ gia dụng" },
      { phrase: "nước rửa chén", category: "Đồ gia dụng" },
      { phrase: "nước lau sàn", category: "Đồ gia dụng" },
      { phrase: "nước giải khát", category: "Đồ uống" },
      { phrase: "nước ngọt", category: "Đồ uống" },
      { phrase: "nước tương", category: "Gia vị" },
    ];

    let foundSpecificPhrase = false;
    for (const item of specificPhrases) {
      if (lowerQuery.includes(item.phrase)) {
        foundSpecificPhrase = true;
        conditions.push({
          $or: [
            { productName: { $regex: item.phrase, $options: "i" } },
            { productDescription: { $regex: item.phrase, $options: "i" } },
            { productCategory: item.category },
            { category: item.category },
          ],
        });
        console.log(
          `Tìm sản phẩm với cụm từ cụ thể: "${item.phrase}" thuộc danh mục ${item.category}`
        );
        break;
      }
    }

    // Xử lý tìm kiếm theo danh mục/loại sản phẩm nếu không tìm được cụm từ cụ thể và không phải là câu hỏi về giá
    if (!foundSpecificPhrase && !isPriceQuery) {
      const categoryKeywords = [
        {
          keywords: ["rau", "củ", "quả", "rau củ", "rau quả", "trái cây"],
          category: "Rau củ quả",
        },
        {
          keywords: ["thịt", "cá", "hải sản", "thịt cá", "thủy hải sản"],
          category: "Thịt và hải sản",
        },
        {
          keywords: ["đồ uống", "nước ngọt", "bia", "rượu"],
          category: "Đồ uống",
        },
        {
          keywords: [
            "gia vị",
            "dầu ăn",
            "nước mắm",
            "muối",
            "đường",
            "mì chính",
          ],
          category: "Gia vị",
        },
        {
          keywords: ["bánh", "kẹo", "snack", "đồ ăn vặt"],
          category: "Bánh kẹo",
        },
        {
          keywords: ["mì", "bún", "phở", "miến", "hủ tiếu"],
          category: "Mì, bún, phở",
        },
        {
          keywords: ["giặt", "xà phòng", "nước rửa", "lau", "vệ sinh"],
          category: "Đồ gia dụng",
        },
      ];

      for (const item of categoryKeywords) {
        if (item.keywords.some((keyword) => lowerQuery.includes(keyword))) {
          conditions.push({
            $or: [
              { productCategory: item.category },
              { category: item.category },
            ],
          });
          console.log("Tìm sản phẩm thuộc danh mục:", item.category);
          break;
        }
      }
    }

    // Tìm theo từ khóa cụ thể (tên sản phẩm)
    const stopWords = [
      "tìm",
      "kiếm",
      "sản",
      "phẩm",
      "sản phẩm",
      "hàng",
      "giá",
      "mua",
      "bán",
      "các",
      "có",
      "không",
      "vậy",
      "shop",
      "cửa hàng",
      "thì",
      "là",
      "và",
      "hay",
      "hoặc",
      "nhé",
      "ạ",
      "dưới",
      "trên",
      "khoảng",
      "từ",
      "đến",
    ];
    const words = lowerQuery.split(/\s+/);

    // Lọc bỏ từ khóa giá (100k, 50k)
    const priceKeywords = words.filter((word) => word.match(/\d+k$/i));
    const keywords = words.filter(
      (word) =>
        !stopWords.includes(word) && word.length > 1 && !word.match(/\d+k$/i)
    );

    console.log("Từ khóa giá:", priceKeywords);
    console.log("Từ khóa tìm kiếm:", keywords);

    // Nếu không có điều kiện nào, thêm điều kiện tìm kiếm theo từ khóa
    if (conditions.length === 0 && keywords.length > 0) {
      const keywordConditions = keywords.map((keyword) => ({
        $or: [
          { productName: { $regex: keyword, $options: "i" } },
          { productDescription: { $regex: keyword, $options: "i" } },
          { productCategory: { $regex: keyword, $options: "i" } },
        ],
      }));

      if (keywordConditions.length > 0) {
        conditions.push({ $and: keywordConditions });
      }
    }

    // Tìm kiếm sản phẩm với các điều kiện đã xác định
    let queryCondition = {};
    if (conditions.length > 0) {
      queryCondition = { $or: conditions };
    }

    console.log("Query tìm kiếm:", JSON.stringify(queryCondition));

    // Thực hiện tìm kiếm
    const products = await Product.find(queryCondition).limit(10);
    console.log(`Tìm thấy ${products.length} sản phẩm`);

    return products;
  } catch (error) {
    console.error("Lỗi khi tìm kiếm sản phẩm:", error);
    return [];
  }
};

/**
 * Xử lý so sánh sản phẩm
 * @param {string} message - Câu hỏi của người dùng
 * @param {object} context - Thông tin ngữ cảnh
 * @returns {Promise<Object>} - Phản hồi cho người dùng
 */
export const handleCompareProducts = async (message, context) => {
  try {
    console.log("Xử lý so sánh sản phẩm:", message);

    // Kiểm tra xem có sản phẩm trong context không
    if (!context || !context.userId) {
      return {
        success: true,
        message: "Vui lòng chọn sản phẩm bạn muốn so sánh trước.",
        type: "text",
      };
    }

    // Lấy thông tin sản phẩm từ context
    const userContext = await getUserContext(context.userId);
    console.log("Context người dùng:", userContext);

    // Kiểm tra xem có sản phẩm đã lưu không
    if (
      !userContext ||
      !userContext.lastProducts ||
      userContext.lastProducts.length < 1
    ) {
  return {
    success: true,
        message:
          "Bạn chưa xem sản phẩm nào gần đây để so sánh. Vui lòng tìm kiếm sản phẩm trước.",
        type: "text",
      };
    }

    // Lấy 2 sản phẩm gần đây nhất để so sánh
    const productsToCompare = userContext.lastProducts.slice(0, 2);
    console.log(`Sản phẩm để so sánh: ${productsToCompare.length} sản phẩm`);

    if (productsToCompare.length < 2) {
      // Nếu chỉ có 1 sản phẩm, tìm thêm sản phẩm tương tự
      const product = productsToCompare[0];
      const similarProducts = await Product.find({
        productCategory: product.productCategory,
        _id: { $ne: product._id },
      }).limit(1);

      if (similarProducts.length > 0) {
        productsToCompare.push(similarProducts[0]);
      }
    }

    // Nếu có ít nhất 2 sản phẩm, tiến hành so sánh
    if (productsToCompare.length >= 2) {
      // Chuẩn bị danh sách sản phẩm để hiển thị
      const formattedProducts = productsToCompare.map((product) => ({
        _id: product._id,
        productName: product.productName,
        productPrice: product.productPrice,
        productDiscount: product.productDiscount || 0,
        productImage:
          product.productImages && product.productImages.length > 0
            ? product.productImages[0]
            : null,
        productImageURL:
          product.productImageURLs && product.productImageURLs.length > 0
            ? product.productImageURLs[0]
            : null,
        imageBase64: product.productImageBase64 || null,
        productCategory: product.productCategory,
        productDescription: product.productDescription,
        productBrand: product.productBrand,
        productWeight: product.productWeight,
        productOrigin: product.productOrigin,
        productDetails: product.productDetails,
        averageRating: product.averageRating,
      }));

      // Tạo so sánh chi tiết giữa các sản phẩm
      let comparisonText = "So sánh chi tiết giữa các sản phẩm:\n\n";

      // Lấy tên sản phẩm ngắn gọn để dễ so sánh
      const product1ShortName = formattedProducts[0].productName
        .split(" ")
        .slice(0, 3)
        .join(" ");
      const product2ShortName = formattedProducts[1].productName
        .split(" ")
        .slice(0, 3)
        .join(" ");

      // So sánh giá
      comparisonText += "🔹 Về giá: ";
      const priceDiff = Math.abs(
        formattedProducts[0].productPrice - formattedProducts[1].productPrice
      );
      const priceDiffPercent = Math.round(
        (priceDiff /
          Math.min(
            formattedProducts[0].productPrice,
            formattedProducts[1].productPrice
          )) *
          100
      );

      if (
        formattedProducts[0].productPrice > formattedProducts[1].productPrice
      ) {
        comparisonText += `${product2ShortName} rẻ hơn ${product1ShortName} ${formatCurrency(
          priceDiff
        )}đ (khoảng ${priceDiffPercent}%).\n\n`;
      } else if (
        formattedProducts[0].productPrice < formattedProducts[1].productPrice
      ) {
        comparisonText += `${product1ShortName} rẻ hơn ${product2ShortName} ${formatCurrency(
          priceDiff
        )}đ (khoảng ${priceDiffPercent}%).\n\n`;
  } else {
        comparisonText += "Hai sản phẩm có giá tương đương nhau.\n\n";
      }

      // So sánh thương hiệu
      if (
        formattedProducts[0].productBrand &&
        formattedProducts[1].productBrand
      ) {
        comparisonText += `🔹 Về thương hiệu: ${product1ShortName} là sản phẩm của ${formattedProducts[0].productBrand}, trong khi ${product2ShortName} là sản phẩm của ${formattedProducts[1].productBrand}.\n\n`;
      }

      // So sánh khối lượng/dung tích
      if (
        formattedProducts[0].productWeight &&
        formattedProducts[1].productWeight
      ) {
        comparisonText += "🔹 Về khối lượng/dung tích: ";

        // Xác định đơn vị đo (kg, L, g, ml)
        const getUnit = (productName) => {
          if (productName.includes("kg") || productName.includes("Kg"))
            return "kg";
          if (productName.includes("g") && !productName.includes("kg"))
            return "g";
          if (productName.includes("L") || productName.includes("l"))
            return "L";
          if (productName.includes("ml")) return "ml";
          return "";
        };

        const unit1 = getUnit(formattedProducts[0].productName);
        const unit2 = getUnit(formattedProducts[1].productName);

        // Tính giá trên đơn vị
        const calculateUnitPrice = (price, weight, unit) => {
          if (unit === "kg") return price / weight;
          if (unit === "g") return price / (weight / 1000);
          if (unit === "L") return price / weight;
          if (unit === "ml") return price / (weight / 1000);
          return price / weight;
        };

        const unitPrice1 = calculateUnitPrice(
          formattedProducts[0].productPrice,
          formattedProducts[0].productWeight,
          unit1
        );
        const unitPrice2 = calculateUnitPrice(
          formattedProducts[1].productPrice,
          formattedProducts[1].productWeight,
          unit2
        );

        comparisonText += `${product1ShortName} có ${formattedProducts[0].productWeight}${unit1}, trong khi ${product2ShortName} có ${formattedProducts[1].productWeight}${unit2}.\n\n`;

        // So sánh giá trị (giá trên đơn vị)
        comparisonText += "🔹 Về giá trị kinh tế: ";
        if (unitPrice1 < unitPrice2) {
          comparisonText += `${product1ShortName} có giá trị kinh tế tốt hơn với giá ${formatCurrency(
            Math.round(unitPrice1)
          )}đ/${
            unit1 === "g" ? "kg" : unit1 === "ml" ? "L" : unit1
          }, trong khi ${product2ShortName} có giá ${formatCurrency(
            Math.round(unitPrice2)
          )}đ/${unit2 === "g" ? "kg" : unit2 === "ml" ? "L" : unit2}.\n\n`;
        } else if (unitPrice1 > unitPrice2) {
          comparisonText += `${product2ShortName} có giá trị kinh tế tốt hơn với giá ${formatCurrency(
            Math.round(unitPrice2)
          )}đ/${
            unit2 === "g" ? "kg" : unit2 === "ml" ? "L" : unit2
          }, trong khi ${product1ShortName} có giá ${formatCurrency(
            Math.round(unitPrice1)
          )}đ/${unit1 === "g" ? "kg" : unit1 === "ml" ? "L" : unit1}.\n\n`;
  } else {
          comparisonText +=
            "Hai sản phẩm có giá trị kinh tế tương đương nhau.\n\n";
        }
      }

      // So sánh đánh giá
      if (
        formattedProducts[0].averageRating &&
        formattedProducts[1].averageRating
      ) {
        comparisonText += "🔹 Về đánh giá: ";
        if (
          formattedProducts[0].averageRating >
          formattedProducts[1].averageRating
        ) {
          comparisonText += `${product1ShortName} được đánh giá cao hơn với ${formattedProducts[0].averageRating}/5 sao, trong khi ${product2ShortName} được đánh giá ${formattedProducts[1].averageRating}/5 sao.\n\n`;
        } else if (
          formattedProducts[0].averageRating <
          formattedProducts[1].averageRating
        ) {
          comparisonText += `${product2ShortName} được đánh giá cao hơn với ${formattedProducts[1].averageRating}/5 sao, trong khi ${product1ShortName} được đánh giá ${formattedProducts[0].averageRating}/5 sao.\n\n`;
    } else {
          comparisonText += `Cả hai sản phẩm đều có đánh giá ${formattedProducts[0].averageRating}/5 sao.\n\n`;
        }
      }

      // So sánh công dụng
      if (
        formattedProducts[0].productDescription &&
        formattedProducts[1].productDescription
      ) {
        comparisonText += "🔹 Về công dụng:\n";
        comparisonText += `${product1ShortName}: ${
          Array.isArray(formattedProducts[0].productDescription)
            ? formattedProducts[0].productDescription.join(", ")
            : formattedProducts[0].productDescription
        }\n`;
        comparisonText += `${product2ShortName}: ${
          Array.isArray(formattedProducts[1].productDescription)
            ? formattedProducts[1].productDescription.join(", ")
            : formattedProducts[1].productDescription
        }\n\n`;
      }

      // Kết luận và đề xuất
      comparisonText += "🔹 Kết luận:\n";
      // Tính điểm cho từng sản phẩm dựa trên các tiêu chí
      let score1 = 0;
      let score2 = 0;

      // Điểm cho giá
      if (
        formattedProducts[0].productPrice < formattedProducts[1].productPrice
      ) {
        score1 += 1;
      } else if (
        formattedProducts[0].productPrice > formattedProducts[1].productPrice
      ) {
        score2 += 1;
      }

      // Điểm cho giá trị kinh tế
      const getUnit = (productName) => {
        if (productName.includes("kg") || productName.includes("Kg"))
          return "kg";
        if (productName.includes("g") && !productName.includes("kg"))
          return "g";
        if (productName.includes("L") || productName.includes("l")) return "L";
        if (productName.includes("ml")) return "ml";
        return "";
      };

      const unit1 = getUnit(formattedProducts[0].productName);
      const unit2 = getUnit(formattedProducts[1].productName);

      const calculateUnitPrice = (price, weight, unit) => {
        if (unit === "kg") return price / weight;
        if (unit === "g") return price / (weight / 1000);
        if (unit === "L") return price / weight;
        if (unit === "ml") return price / (weight / 1000);
        return price / weight;
      };

      if (
        formattedProducts[0].productWeight &&
        formattedProducts[1].productWeight
      ) {
        const unitPrice1 = calculateUnitPrice(
          formattedProducts[0].productPrice,
          formattedProducts[0].productWeight,
          unit1
        );
        const unitPrice2 = calculateUnitPrice(
          formattedProducts[1].productPrice,
          formattedProducts[1].productWeight,
          unit2
        );

        if (unitPrice1 < unitPrice2) {
          score1 += 2;
        } else if (unitPrice1 > unitPrice2) {
          score2 += 2;
        }
      }

      // Điểm cho đánh giá
      if (
        formattedProducts[0].averageRating &&
        formattedProducts[1].averageRating
      ) {
        if (
          formattedProducts[0].averageRating >
          formattedProducts[1].averageRating
        ) {
          score1 += 1.5;
        } else if (
          formattedProducts[0].averageRating <
          formattedProducts[1].averageRating
        ) {
          score2 += 1.5;
        }
      }

      // Đề xuất dựa trên điểm số
      if (score1 > score2) {
        comparisonText += `Dựa trên phân tích, ${product1ShortName} có vẻ lựa chọn tốt hơn nếu bạn đang tìm kiếm sản phẩm có giá trị kinh tế tốt hơn.\n\n`;
      } else if (score1 < score2) {
        comparisonText += `Dựa trên phân tích, ${product2ShortName} có vẻ lựa chọn tốt hơn nếu bạn đang tìm kiếm sản phẩm có giá trị kinh tế tốt hơn.\n\n`;
      } else {
        comparisonText += "Cả hai sản phẩm đều có những ưu điểm riêng. Bạn có thể chọn dựa trên nhu cầu cụ thể của mình.\n\n";
      }

      // Thêm lời khuyên
      if (
        formattedProducts[0].productWeight &&
        formattedProducts[1].productWeight
      ) {
        const unitPrice1 = calculateUnitPrice(
          formattedProducts[0].productPrice,
          formattedProducts[0].productWeight,
          unit1
        );
        const unitPrice2 = calculateUnitPrice(
          formattedProducts[1].productPrice,
          formattedProducts[1].productWeight,
          unit2
        );

        if (
          unitPrice1 < unitPrice2 &&
          formattedProducts[0].productPrice > formattedProducts[1].productPrice
        ) {
          comparisonText += `💡 Lời khuyên: Mặc dù ${product1ShortName} có giá cao hơn, nhưng xét về lâu dài, sản phẩm này có giá trị kinh tế tốt hơn do có khối lượng/dung tích lớn hơn nhiều so với mức chênh lệch giá.\n\n`;
        } else if (
          unitPrice2 < unitPrice1 &&
          formattedProducts[1].productPrice > formattedProducts[0].productPrice
        ) {
          comparisonText += `💡 Lời khuyên: Mặc dù ${product2ShortName} có giá cao hơn, nhưng xét về lâu dài, sản phẩm này có giá trị kinh tế tốt hơn do có khối lượng/dung tích lớn hơn nhiều so với mức chênh lệch giá.\n\n`;
        }
      }

      return {
        success: true,
        message: comparisonText,
        products: formattedProducts,
        type: "productSearch",
      };
    } else {
      return {
        success: true,
        message:
          "Không đủ sản phẩm để so sánh. Vui lòng tìm kiếm thêm sản phẩm.",
        type: "text",
      };
    }
  } catch (error) {
    console.error("Lỗi khi so sánh sản phẩm:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi so sánh sản phẩm. Vui lòng thử lại sau.",
      type: "text",
    };
  }
};
