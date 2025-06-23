/* eslint-disable no-useless-escape */
/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

import axios from "axios";
import Product from "../../Model/Products.js";
import dotenv from "dotenv";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
// Import xử lý câu hỏi về sản phẩm
import { handleProductQuery, detectHealthNeeds, findProductsForHealthNeed, generateHealthResponse, handleCompareProducts } from "./chatbotProductHandler.js";
import { handleFAQQuestion } from "./chatbotFAQHandler.js";
import { saveContext, getUserContext, initOrGetUserContext, updateProductsInContext } from "./chatbotContextHandler.js";

// Load environment variables
dotenv.config();

// Lấy đường dẫn thư mục hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import health recommendations data
const healthResponsesPath = path.join(__dirname, "../../chatbot/config/health_responses.json");
let healthRecommendations = {};

try {
  if (fs.existsSync(healthResponsesPath)) {
    healthRecommendations = JSON.parse(fs.readFileSync(healthResponsesPath, 'utf8'));
    console.log("Successfully loaded health_responses.json");
  } else {
    console.log("health_responses.json file not found at:", healthResponsesPath);
    // Create default data with example questions
    healthRecommendations = {
      tieuDuong: {
        title: "Thực phẩm cho người tiểu đường",
        description: "Người tiểu đường cần chế độ ăn uống cân bằng, kiểm soát lượng carbohydrate và ưu tiên thực phẩm có chỉ số đường huyết thấp.",
        recommended: [
          "Rau xanh các loại",
          "Các loại đậu",
          "Ngũ cốc nguyên hạt",
          "Trái cây ít đường (táo, dâu, việt quất)",
          "Cá, thịt nạc",
          "Các loại hạt không muối",
          "Sữa và sản phẩm từ sữa ít béo"
        ],
        avoid: [
          "Đồ ngọt, bánh kẹo",
          "Nước ngọt, đồ uống có đường",
          "Trái cây có nhiều đường (chuối chín, xoài, nho)",
          "Gạo trắng, bánh mì trắng",
          "Thực phẩm chế biến sẵn",
          "Mỡ động vật"
        ],
        productKeywords: ["đường huyết thấp", "ít đường", "không đường", "cho người tiểu đường", "chỉ số GI thấp"],
        productCategories: ["Thực phẩm chức năng", "Đồ uống không đường", "Thực phẩm dinh dưỡng"],
        examples: [
          {
            "question": "Người tiểu đường nên ăn gì?",
            "answer": "Người tiểu đường nên ăn nhiều rau xanh, đậu các loại, ngũ cốc nguyên hạt, trái cây ít đường như táo và dâu tây, cá và thịt nạc. Nên hạn chế đồ ngọt, bánh kẹo, nước ngọt và thực phẩm chế biến sẵn."
          },
          {
            "question": "Trái cây nào tốt cho người tiểu đường?",
            "answer": "Người tiểu đường nên chọn các loại trái cây có chỉ số đường huyết thấp như táo, dâu tây, việt quất, lê, quýt. Nên hạn chế các loại trái cây ngọt như chuối chín, xoài, nho, vì chúng có thể làm tăng đường huyết nhanh chóng."
          }
        ]
      }
    };
  }
} catch (error) {
  console.error("Error loading health_responses.json:", error);
  // Set default data for error case
  healthRecommendations = {
    tieuDuong: {
      title: "Thực phẩm cho người tiểu đường",
      examples: [
        {
          "question": "Người tiểu đường nên ăn gì?",
          "answer": "Người tiểu đường nên ăn nhiều rau xanh, đậu các loại, ngũ cốc nguyên hạt, trái cây ít đường như táo và dâu tây, cá và thịt nạc. Nên hạn chế đồ ngọt, bánh kẹo, nước ngọt và thực phẩm chế biến sẵn."
        }
      ]
    }
  };
}

// Thời gian hết hạn cho ngữ cảnh (15 phút = 15 * 60 * 1000 ms)
const CONTEXT_EXPIRY_TIME = 15 * 60 * 1000;

/**
 * Trích xuất nguyên liệu từ câu trả lời công thức nấu ăn
 * @param {string} recipeResponse - Câu trả lời công thức nấu ăn
 * @returns {string[]} - Danh sách nguyên liệu đã trích xuất
 */
const extractIngredientsFromRecipe = (recipeResponse) => {
  if (!recipeResponse) return [];
  
  // Danh sách nguyên liệu phổ biến để tìm kiếm
  const commonIngredients = [
    "thịt",
    "cá",
    "hải sản",
    "gà",
    "bò",
    "heo",
    "vịt",
    "trứng",
    "hột vịt",
    "hột gà",
    "rau",
    "củ",
    "quả",
    "cà chua",
    "cà rốt",
    "bắp cải",
    "xà lách",
    "hành",
    "tỏi",
    "gừng",
    "ớt",
    "tiêu",
    "muối",
    "đường",
    "nước mắm",
    "dầu ăn",
    "dầu hào",
    "nước tương",
    "mì",
    "bún",
    "phở",
    "miến",
    "gạo",
    "bột",
    "bánh",
    "kẹo",
    "nước dừa",
    "sữa",
    "nước",
    "bia",
    "rượu",
  ];
  
  // Tạo pattern để tìm nguyên liệu từ danh sách đánh số
  const ingredientListPattern = /\d+\.\s+([^\d]+?)(?=\n|$)/g;
  let ingredients = [];
  
  // Tìm kiếm danh sách đánh số
  let match;
  while ((match = ingredientListPattern.exec(recipeResponse)) !== null) {
    const ingredient = match[1].trim().toLowerCase();
    ingredients.push(ingredient);
  }
  
  // Nếu không tìm thấy danh sách đánh số, tìm kiếm các nguyên liệu phổ biến
  if (ingredients.length === 0) {
    const lowerResponse = recipeResponse.toLowerCase();
    
    for (const ingredient of commonIngredients) {
      if (lowerResponse.includes(ingredient)) {
        // Trích xuất nguyên liệu và ngữ cảnh xung quanh
        const regex = new RegExp(`\\b${ingredient}\\b([^,.;]+)?`, "g");
        let ingredientMatch;
        
        while ((ingredientMatch = regex.exec(lowerResponse)) !== null) {
          const fullMatch = ingredientMatch[0].trim();
          ingredients.push(fullMatch);
        }
      }
    }
  }
  
  // Loại bỏ trùng lặp và tinh chỉnh
  ingredients = [...new Set(ingredients)]
    .map((ing) => {
    // Loại bỏ số lượng và đơn vị
      return ing
        .replace(/\(\d+.*?\)/g, "")
        .replace(/\d+\s*(g|kg|ml|l|muỗng|tép|củ|quả)/gi, "")
        .replace(/khoảng/gi, "")
              .trim();
    })
    .filter((ing) => ing.length > 1); // Loại bỏ các mục quá ngắn
  
  return ingredients;
};

// Thêm hàm phân loại sản phẩm chay/mặn
const classifyVeganStatus = (product) => {
  if (!product) return "Không xác định";
  
  const name = (product.productName || "").toLowerCase();
  const category = (product.productCategory || "").toLowerCase();
  const description = (product.productDescription || "").toLowerCase();
  const details = (product.productDetails || "").toLowerCase();
  
  // Các từ khóa mặn
  const nonVegKeywords = [
    "thịt", "bò", "gà", "heo", "lợn", "cá", "tôm", "mực", "hải sản", "trứng", 
    "xúc xích", "giò", "chả", "sữa", "bơ", "phô mai", "cheese", "cua", "ghẹ", 
    "sò", "ốc", "thủy hải sản", "cừu", "dê", "sườn", "ba chỉ", "nạc", "vai", "đùi"
  ];
  
  // Các từ khóa chay
  const vegKeywords = [
    "chay", "rau", "củ", "quả", "nấm", "đậu", "hạt", "ngũ cốc", 
    "gạo", "bún", "miến", "đồ chay", "thuần chay", "vegan", "vegetarian"
  ];
  
  // Kiểm tra từ khóa mặn
  for (const keyword of nonVegKeywords) {
    if (name.includes(keyword) || category.includes(keyword) || 
        description.includes(keyword) || details.includes(keyword)) {
      return "Mặn";
    }
  }
  
  // Kiểm tra từ khóa chay
  for (const keyword of vegKeywords) {
    if (name.includes(keyword) || category.includes(keyword)) {
      return "Chay";
    }
  }
  
  // Mặc định nếu không rõ
  return "Không xác định";
};

// Hàm tìm sản phẩm chay
const findVeganProducts = async (limit = 8) => {
  try {
    // Tìm sản phẩm có tên hoặc danh mục chứa từ khóa chay
    const veganKeywords = ["chay", "rau", "củ", "quả", "nấm", "đậu", "hạt", "trái cây"];
    
    // Danh sách các danh mục thực phẩm
    const foodCategories = [
      "Thực phẩm", "Rau củ", "Trái cây", "Gia vị", 
      "Đồ khô", "Đồ uống", "Bánh kẹo", "Thực phẩm đông lạnh", 
      "Thực phẩm chế biến", "Ngũ cốc", "Gạo", "Bột", "Đậu", "Hạt"
    ];
    
    // Lọc sản phẩm theo danh mục thực phẩm và từ khóa chay
    const products = await Product.find({
      $or: [
        // Tìm theo danh mục thực phẩm
        { productCategory: { $in: foodCategories } },
        { productCategory: { $regex: "thực phẩm|đồ ăn|thức ăn|rau|củ|quả|trái cây", $options: "i" } },
        // Tìm theo từ khóa chay
        { productName: { $regex: veganKeywords.join("|"), $options: "i" } },
        // Tìm theo từ khóa "chay" trong mô tả
        { productDescription: { $regex: "chay|thuần chay|ăn chay|vegan|vegetarian", $options: "i" } }
      ],
      // Loại bỏ các sản phẩm hết hàng
      productStatus: { $ne: "Hết hàng" }
    }).limit(limit * 2); // Lấy nhiều hơn để có thể lọc
    
    // Lọc lại để đảm bảo không có từ khóa mặn
    const nonVegKeywords = ["thịt", "bò", "gà", "heo", "lợn", "cá", "tôm", "mực", "hải sản", "trứng"];
    
    const veganProducts = products.filter(product => {
      const name = (product.productName || "").toLowerCase();
      // Đảm bảo productDescription là chuỗi trước khi gọi toLowerCase()
      const description = typeof product.productDescription === 'string' 
        ? product.productDescription.toLowerCase() 
        : "";
      const category = (product.productCategory || "").toLowerCase();
      
      // Nếu sản phẩm có từ "chay" trong tên, mô tả hoặc danh mục, ưu tiên giữ lại
      if (name.includes("chay") || description.includes("chay") || category.includes("chay")) {
        return true;
      }
      
      // Nếu là rau củ quả, trái cây, đồ uống không chứa từ khóa mặn, giữ lại
      if (category.includes("rau") || category.includes("củ") || 
          category.includes("quả") || category.includes("trái cây") ||
          name.includes("rau") || name.includes("củ") || 
          name.includes("quả") || name.includes("trái cây") ||
          category.includes("đồ uống") || name.includes("nước")) {
        return !nonVegKeywords.some(keyword => 
          name.includes(keyword) || description.includes(keyword)
        );
      }
      
      // Cho các sản phẩm khác, kiểm tra không chứa từ khóa mặn
      return !nonVegKeywords.some(keyword => 
        name.includes(keyword) || description.includes(keyword)
      );
    });
    
    // Giới hạn số lượng kết quả trả về
    return veganProducts.slice(0, limit);
  } catch (error) {
    console.error("Lỗi khi tìm sản phẩm chay:", error);
    return [];
  }
};

// Hàm xử lý câu hỏi về chế độ ăn chay/mặn
const handleDietQuestion = async (message, productId) => {
  try {
    // Kiểm tra xem có phải câu hỏi về chế độ ăn chay không
    const isVeganQuestion = /chay|ăn chay|người ăn chay|thuần chay|vegetarian|vegan/i.test(message);
    
    if (!isVeganQuestion) return null;
    
    // Kiểm tra xem có phải câu hỏi tìm kiếm thực phẩm chay không
    const isSearchingVeganFood = /tìm|có|cho|thực phẩm|đồ ăn|món ăn|sản phẩm|thức ăn|người ăn chay|dành cho/i.test(message);
    
    // Nếu là câu hỏi tìm kiếm thực phẩm chay
    if (isSearchingVeganFood) {
      console.log("Phát hiện yêu cầu tìm kiếm thực phẩm chay");
      const veganProducts = await findVeganProducts(10);
      
      if (veganProducts.length === 0) {
        return "Hiện tại cửa hàng không có sản phẩm thực phẩm chay. Chúng tôi sẽ cập nhật thêm sản phẩm trong thời gian tới.";
      }
      
      let response = "🌱 **Các sản phẩm phù hợp cho người ăn chay:**\n\n";
      
      // Phân loại sản phẩm theo danh mục
      const categorizedProducts = {};
      veganProducts.forEach(product => {
        const category = product.productCategory || "Khác";
        if (!categorizedProducts[category]) {
          categorizedProducts[category] = [];
        }
        categorizedProducts[category].push(product);
      });
      
      // Hiển thị sản phẩm theo từng danh mục
      for (const [category, products] of Object.entries(categorizedProducts)) {
        response += `**${category}:**\n`;
        products.forEach((product, index) => {
          response += `${index + 1}. ${product.productName} - ${formatCurrency(product.productPrice)}đ\n`;
        });
        response += "\n";
      }
      
      response += "💡 *Bạn có thể nhấn vào tên sản phẩm để xem thông tin chi tiết.*";
      
      return response;
    }
    
    // Nếu có productId, kiểm tra sản phẩm đó có phù hợp cho người ăn chay không
    if (productId) {
      const product = await Product.findById(productId);
      if (!product) return "Không tìm thấy thông tin sản phẩm.";
      
      const veganStatus = classifyVeganStatus(product);
      
      if (veganStatus === "Chay") {
        return `✅ Sản phẩm "${product.productName}" phù hợp với người ăn chay.`;
      } else if (veganStatus === "Mặn") {
        // Tìm một số sản phẩm chay để gợi ý
        const veganProducts = await findVeganProducts(3);
        
        let response = `❌ Sản phẩm "${product.productName}" không phù hợp với người ăn chay vì có nguồn gốc từ động vật.`;
        
        if (veganProducts.length > 0) {
          response += "\n\n🌱 **Bạn có thể tham khảo một số sản phẩm chay sau:**\n";
          veganProducts.forEach((p, index) => {
            response += `${index + 1}. ${p.productName} - ${formatCurrency(p.productPrice)}đ\n`;
          });
        }
        
        return response;
      } else {
        return `⚠️ Không thể xác định chắc chắn liệu sản phẩm "${product.productName}" có phù hợp với người ăn chay hay không. Vui lòng kiểm tra thành phần sản phẩm.`;
      }
    }
    
    // Nếu là câu hỏi chung về sản phẩm chay
    if (/có (sản phẩm|món|đồ) (nào )?(chay|ăn chay)/i.test(message)) {
      const veganProducts = await findVeganProducts(8);
      
      if (veganProducts.length === 0) {
        return "Hiện tại cửa hàng không có sản phẩm phù hợp cho người ăn chay.";
      }
      
      // Phân loại sản phẩm theo danh mục
      const categorizedProducts = {};
      veganProducts.forEach(product => {
        const category = product.productCategory || "Khác";
        if (!categorizedProducts[category]) {
          categorizedProducts[category] = [];
        }
        categorizedProducts[category].push(product);
      });
      
      let response = "🌱 **Cửa hàng có nhiều sản phẩm phù hợp cho người ăn chay:**\n\n";
      
      // Hiển thị sản phẩm theo từng danh mục
      for (const [category, products] of Object.entries(categorizedProducts)) {
        response += `**${category}:**\n`;
        products.forEach((product, index) => {
          response += `${index + 1}. ${product.productName} - ${formatCurrency(product.productPrice)}đ\n`;
        });
        response += "\n";
      }
      
      response += "💡 *Bạn có thể tìm thêm sản phẩm chay bằng cách gõ: \"Tìm thực phẩm chay\"*";
      
      return response;
    }
    
    return null;
  } catch (error) {
    console.error("Lỗi khi xử lý câu hỏi về chế độ ăn:", error);
    return "Đã xảy ra lỗi khi xử lý câu hỏi về chế độ ăn.";
  }
};

/**
 * Xử lý tin nhắn từ người dùng và trả về câu trả lời
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const handleMessage = async (req, res) => {
  try {
    const message = req.body.message;
    const userId = req.body.userId;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp tin nhắn"
      });
    }

    console.log(`Nhận tin nhắn từ user ${userId}: "${message}"`);
    
    // Lấy ngữ cảnh của người dùng nếu có
    const context = userId ? await initOrGetUserContext(userId) : {};
    console.log("Ngữ cảnh hiện tại:", context);
    
    // Phân loại intent
    const intent = classifyMainIntent(message);
    console.log("Phân loại ý định chính:", intent);
    
    // Trích xuất entities
    const entities = extractEntities(message);
    console.log("Entities:", entities);
    
    // Khai báo biến ở đây để tránh lỗi "Unexpected lexical declaration in case block"
    let healthNeeds;
    let healthInfo;
    let progressData;
    let healthProfile;
    let currentHealthInfo;
    let compareResponse;
    let productResponse;
    let faqResponse;
    
    // Xử lý theo intent
    switch (intent) {
      case 'greeting':
        return res.json({
          success: true,
          message: "Xin chào! Tôi là trợ lý ảo của DNCFOOD. Tôi có thể giúp bạn tìm kiếm sản phẩm, trả lời câu hỏi về sức khỏe và dinh dưỡng, hoặc cung cấp thông tin về cửa hàng. Bạn cần hỗ trợ gì?"
        });
      
      case 'health_inquiry':
        healthNeeds = detectPersonalHealthInfo(message);
        
        // Nếu không phát hiện nhu cầu sức khỏe cụ thể, hỏi thêm thông tin
        if (!healthNeeds || healthNeeds.length === 0) {
          return res.json({
            success: true,
            message: "Bạn quan tâm đến vấn đề sức khỏe nào? Ví dụ: tiểu đường, huyết áp, giảm cân, tăng cường miễn dịch, v.v. Tôi có thể gợi ý các thực phẩm phù hợp."
          });
        }
        
        healthInfo = await handleHealthInquiry(message, { userId });
        return res.json({
          success: true,
          message: healthInfo.text,
          type: healthInfo.type,
          products: healthInfo.products
        });
      
      case 'health_progress':
        if (!userId) {
          return res.json({
            success: true,
            message: "Để theo dõi tiến trình sức khỏe, bạn cần đăng nhập vào tài khoản của mình."
          });
        }
        
        // Giả lập dữ liệu tiến trình sức khỏe
        progressData = {
          weight: { current: 65, previous: 68, goal: 60 },
          steps: { today: 8500, average: 7200, goal: 10000 },
          water: { today: 1.5, goal: 2 },
          sleep: { lastNight: 7, average: 6.5, goal: 8 }
        };
        
        return res.json({
          success: true,
          message: `Tiến trình sức khỏe của bạn:
- Cân nặng: ${progressData.weight.current}kg (giảm ${progressData.weight.previous - progressData.weight.current}kg, mục tiêu: ${progressData.weight.goal}kg)
- Bước chân: ${progressData.steps.today} bước hôm nay (trung bình: ${progressData.steps.average}, mục tiêu: ${progressData.steps.goal})
- Nước: Đã uống ${progressData.water.today}L (mục tiêu: ${progressData.water.goal}L)
- Giấc ngủ: ${progressData.sleep.lastNight} giờ đêm qua (trung bình: ${progressData.sleep.average}, mục tiêu: ${progressData.sleep.goal} giờ)`,
          progress: progressData
        });
      
      case 'health_profile_update':
        if (!userId) {
          return res.json({
              success: true,
            message: "Để cập nhật thông tin sức khỏe, bạn cần đăng nhập vào tài khoản của mình."
          });
        }
        
        // Giả lập cập nhật thông tin sức khỏe
        healthProfile = {
          age: 35,
          weight: 65,
          height: 170,
          gender: "Nam",
          healthGoal: "Giảm cân",
          dietaryRestrictions: ["Ít đường", "Hạn chế tinh bột"],
          allergies: ["Hải sản"]
        };
        
        // Lưu vào context
        saveContext(userId, { healthProfile });
        
        return res.json({
          success: true,
          message: "Thông tin sức khỏe của bạn đã được cập nhật. Tôi sẽ đề xuất các sản phẩm phù hợp với nhu cầu của bạn."
        });
      
      case 'health_info_request':
        if (!userId) {
          return res.json({
            success: true,
            message: "Để xem thông tin sức khỏe, bạn cần đăng nhập vào tài khoản của mình."
          });
        }
        
        currentHealthInfo = context.healthProfile || {
          age: 35,
          weight: 65,
          height: 170,
          gender: "Nam",
          healthGoal: "Giảm cân",
          dietaryRestrictions: ["Ít đường", "Hạn chế tinh bột"],
          allergies: ["Hải sản"]
        };
        
        return res.json({
          success: true,
          message: `Thông tin sức khỏe của bạn:
- Tuổi: ${currentHealthInfo.age}
- Cân nặng: ${currentHealthInfo.weight}kg
- Chiều cao: ${currentHealthInfo.height}cm
- Giới tính: ${currentHealthInfo.gender}
- Mục tiêu: ${currentHealthInfo.healthGoal}
- Hạn chế ăn uống: ${currentHealthInfo.dietaryRestrictions.join(", ")}
- Dị ứng: ${currentHealthInfo.allergies.join(", ")}`,
          healthProfile: currentHealthInfo
        });
      
      case 'meal_plan_request':
        if (!userId) {
          return res.json({
          success: true,
            message: "Để nhận kế hoạch bữa ăn, bạn cần đăng nhập vào tài khoản của mình."
          });
        }
        
        // Giả lập kế hoạch bữa ăn
        return res.json({
          success: true,
          message: `Kế hoạch bữa ăn cho bạn:

Sáng:
- Yến mạch với sữa hạnh nhân và trái cây
- Trà xanh không đường

Giữa sáng:
- Một nắm hạt hỗn hợp (hạnh nhân, óc chó, hạt bí)

Trưa:
- Cơm gạo lứt với cá hồi nướng
- Salad rau xanh với dầu olive

Giữa chiều:
- Sữa chua Hy Lạp với mật ong

Tối:
- Súp rau củ
- Thịt gà nướng với rau xanh
- Trái cây tráng miệng`,
          type: 'text'
        });
      
      case 'meal_plan_diet':
        // Kế hoạch ăn kiêng chi tiết
        return res.json({
          success: true,
          message: `✅ *KẾ HOẠCH ĂN KIÊNG 7 NGÀY*

*Nguyên tắc chung:*
- Ăn 5-6 bữa nhỏ mỗi ngày
- Uống ít nhất 2 lít nước
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

*Ngày 4-7: (Tiếp tục với thực đơn tương tự, thay đổi món ăn)*

*Lưu ý:*
- Nên kết hợp với tập thể dục 30 phút mỗi ngày
- Điều chỉnh lượng thức ăn phù hợp với nhu cầu cá nhân
- Có thể thay đổi món ăn trong cùng nhóm thực phẩm

Bạn có thể tìm mua các thực phẩm hỗ trợ ăn kiêng tại cửa hàng của chúng tôi như: yến mạch, hạt dinh dưỡng, sữa hạnh nhân, gạo lứt, và các loại rau củ hữu cơ.`,
          type: 'text'
        });
      
      case 'compare_products':
        compareResponse = await handleProductComparison(req, res);
        return compareResponse;
      
      case 'product_search':
        console.log("Xử lý tìm kiếm sản phẩm");
        productResponse = await handleProductQuery(message, { userId });
        if (productResponse.products && productResponse.products.length > 0) {
          return res.json({
          success: true,
            message: productResponse.message,
            products: productResponse.products,
            type: 'productSearch'
          });
        } else {
          return res.json({
          success: true,
            message: productResponse.message,
            type: 'text'
          });
        }
      
      case 'order_inquiry':
        if (!userId) {
          return res.json({
              success: true,
            message: "Để kiểm tra thông tin đơn hàng, bạn cần đăng nhập vào tài khoản của mình. Sau khi đăng nhập, bạn có thể xem tất cả đơn hàng trong mục 'Đơn hàng của tôi'."
            });
          }
        return res.json({
            success: true,
          message: "Bạn có thể xem thông tin đơn hàng của mình trong mục 'Đơn hàng của tôi' trên trang cá nhân. Nếu bạn muốn hủy đơn hàng, vui lòng chọn đơn hàng cần hủy và nhấn vào nút 'Hủy đơn hàng'. Lưu ý rằng bạn chỉ có thể hủy đơn hàng khi đơn hàng chưa được xử lý."
        });
      
      default:
        faqResponse = await handleFAQQuestion(intent, message);
        if (faqResponse) {
          return res.json({
              success: true,
            message: faqResponse.message || faqResponse,
            type: faqResponse.type || 'text'
          });
        }
        return res.json({
            success: true,
          message: "Xin lỗi, tôi không hiểu câu hỏi của bạn. Bạn có thể hỏi về sản phẩm, sức khỏe, khuyến mãi, chứng nhận, hoặc liên hệ nhân viên hỗ trợ để được tư vấn chi tiết hơn!",
          type: 'text'
        });
    }
  } catch (error) {
    console.error("Lỗi khi xử lý tin nhắn:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xử lý tin nhắn. Vui lòng thử lại sau."
    });
  }
};

/**
 * Phát hiện intent từ tin nhắn
 * @param {string} message - Tin nhắn từ người dùng
 * @returns {string} - Intent được phát hiện
 */
const detectIntent = (message) => {
  const lowerMessage = message.toLowerCase();
  // Kiểm tra xem có phải là câu hỏi FAQ không
  const faqIntent = detectFAQIntent(lowerMessage);
  if (faqIntent) {
    return faqIntent;
  }
  // Thêm nhận diện intent công thức nấu ăn
  if (isCookingQuestion(lowerMessage)) {
    return "cooking_recipe";
  }
  // Mẫu xử lý intent đơn giản
  if (
    lowerMessage.includes("chào") ||
    lowerMessage.includes("hello") ||
    lowerMessage.includes("hi")
  ) {
    return "greeting";
  }
  if (lowerMessage.includes("giá") || lowerMessage.includes("bao nhiêu")) {
    return "price";
  }
  if (
    lowerMessage.includes("sản phẩm") ||
    lowerMessage.includes("mua") ||
    lowerMessage.includes("hàng")
  ) {
    return "product";
  }
  // Trả về intent mặc định nếu không nhận diện được
  return "unknown";
};

/**
 * Phát hiện intent liên quan đến FAQ
 * @param {string} message - Tin nhắn từ người dùng đã lowercase
 * @returns {string|null} - Intent FAQ hoặc null nếu không phát hiện
 */
const detectFAQIntent = (message) => {
  // Mua hàng
  if (
    message.includes("làm sao để mua") ||
    message.includes("mua hàng như thế nào") ||
    message.includes("cách mua") ||
    message.includes("mua hàng") ||
    message.includes("mua như thế nào") ||
    message.includes("cách thức mua")
  ) {
    return "faq_how_to_buy";
  }
  
  // Đặt hàng
  if (
    message.includes("đặt hàng") ||
    message.includes("cách đặt") ||
    message.includes("đặt mua") ||
    message.includes("đặt như thế nào")
  ) {
    return "faq_how_to_order";
  }
  
  // Thanh toán
  if (
    message.includes("thanh toán") ||
    message.includes("phương thức thanh toán") ||
    message.includes("cách thanh toán") ||
    message.includes("hình thức thanh toán") ||
    message.includes("trả tiền") ||
    message.includes("bao nhiêu hình thức thanh toán")
  ) {
    return "faq_payment_methods";
  }
  
  // Địa chỉ cửa hàng
  if (
    message.includes("địa chỉ") ||
    message.includes("cửa hàng ở đâu") ||
    message.includes("shop ở đâu") ||
    message.includes("vị trí") ||
    message.includes("địa điểm")
  ) {
    return "faq_store_location";
  }
  
  // Chất lượng sản phẩm
  if (
    message.includes("chất lượng") ||
    message.includes("sản phẩm có tốt") ||
    message.includes("có đảm bảo") ||
    message.includes("hàng có tốt") ||
    message.includes("sản phẩm tốt không")
  ) {
    return "faq_product_quality";
  }
  
  // Thời gian giao hàng
  if (
    message.includes("giao hàng") ||
    message.includes("ship") ||
    message.includes("vận chuyển") ||
    message.includes("thời gian giao") ||
    message.includes("giao trong bao lâu") ||
    message.includes("mất bao lâu để nhận")
  ) {
    return "faq_shipping_time";
  }
  
  // Chính sách đổi trả
  if (
    message.includes("đổi trả") ||
    message.includes("hoàn tiền") ||
    message.includes("trả lại") ||
    message.includes("đổi hàng") ||
    message.includes("bị lỗi") ||
    message.includes("không hài lòng")
  ) {
    return "faq_return_policy";
  }
  
  // Khuyến mãi hiện có
  if (
    message.includes("khuyến mãi") ||
    message.includes("giảm giá") ||
    message.includes("ưu đãi") ||
    message.includes("có mã giảm") ||
    message.includes("đang giảm giá")
  ) {
    return "faq_promotions";
  }
  
  // Sản phẩm mới/bán chạy
  if (
    message.includes("sản phẩm mới") ||
    message.includes("mới ra mắt") ||
    message.includes("bán chạy nhất") ||
    message.includes("phổ biến nhất") ||
    message.includes("hot nhất") ||
    message.includes("xu hướng")
  ) {
    return "faq_trending_products";
  }
  
  // Phí vận chuyển
  if (
    message.includes("phí vận chuyển") ||
    message.includes("phí ship") ||
    message.includes("phí giao hàng") ||
    message.includes("ship bao nhiêu tiền") ||
    message.includes("tốn bao nhiêu tiền giao hàng")
  ) {
    return "faq_shipping_fee";
  }
  
  // Hỗ trợ khách hàng
  if (
    message.includes("hỗ trợ") ||
    message.includes("liên hệ") ||
    message.includes("tư vấn") ||
    message.includes("hotline") ||
    message.includes("số điện thoại") ||
    message.includes("email")
  ) {
    return "faq_customer_support";
  }
  
  return null;
};

/**
 * Kiểm tra xem câu hỏi có phụ thuộc vào ngữ cảnh sản phẩm không
 * @param {string} message - Câu hỏi của người dùng
 * @returns {boolean} - Có phụ thuộc vào ngữ cảnh sản phẩm hay không
 */
const checkContextDependentQuery = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Nếu là câu hỏi về món ăn/công thức thì KHÔNG phụ thuộc ngữ cảnh sản phẩm
  if (isCookingQuestion(lowerMessage)) return false;
  
  // Kiểm tra xem có phải là câu tìm kiếm mới không
  // Nếu là tìm kiếm mới thì không phụ thuộc ngữ cảnh
  if (
    lowerMessage.includes("tìm") ||
    lowerMessage.includes("kiếm") ||
    lowerMessage.includes("có sản phẩm") ||
    lowerMessage.includes("dưới") ||
    lowerMessage.includes("trên") ||
    lowerMessage.includes("khoảng giá") ||
    lowerMessage.includes("k ") ||
    lowerMessage.match(/\d+k/)
  ) {
    console.log("Đây là câu hỏi tìm kiếm mới, không phụ thuộc ngữ cảnh");
    return false;
  }
  
  // Các mẫu câu hỏi phụ thuộc ngữ cảnh
  const contextPatterns = [
    // Câu hỏi về công dụng
    /công dụng/i,
    /tác dụng/i,
    /dùng để làm gì/i,
    /dùng để/i,
    /dùng như thế nào/i,
    /sử dụng/i,
    /cách dùng/i,
    // Câu hỏi về giá
    /giá bao nhiêu/i,
    /bao nhiêu tiền/i,
    /giá/i,
    /bao nhiêu/i,
    // Câu hỏi về xuất xứ, thành phần
    /xuất xứ/i,
    /sản xuất/i,
    /thành phần/i,
    /nguyên liệu/i,
    /có chứa/i,
    /bảo quản/i,
    // Câu hỏi về giới thiệu
    /giới thiệu/i,
    /nói về/i,
    /thông tin về/i,
    /mô tả/i,
    // Đại từ chỉ định không rõ ràng
    /sản phẩm này/i,
    /nó/i,
    /cái này/i,
    /món này/i,
    /hàng này/i,
    // Sản phẩm liên quan
    /sản phẩm liên quan/i,
    /liên quan/i,
    /tương tự/i,
    /giống/i,
    /sản phẩm khác/i,
    // Câu hỏi mơ hồ khác mà không đề cập sản phẩm cụ thể
    /hạn sử dụng/i,
    /bảo hành/i,
    /chất lượng/i,
    /đánh giá/i,
    /review/i,
  ];

  return contextPatterns.some((pattern) => pattern.test(lowerMessage));
};

/**
 * Kiểm tra câu hỏi về việc có sản phẩm nào đó không
 * @param {string} message - Câu hỏi của người dùng
 * @returns {string|null} - Tên sản phẩm được trích xuất hoặc null nếu không phải
 */
const checkProductAvailabilityQuestion = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Mẫu câu hỏi "Có sản phẩm X không"
  const productAvailabilityPatterns = [
    /có (bán |cung cấp |sản phẩm |hàng |)?([a-zA-Z0-9À-ỹ\s]+?) (không|ko|k|hong|hông)(\?)?$/i,
    /shop (có |bán |cung cấp |)([a-zA-Z0-9À-ỹ\s]+?) (không|ko|k|hong|hông)(\?)?$/i,
    /cửa hàng (có |bán |cung cấp |)([a-zA-Z0-9À-ỹ\s]+?) (không|ko|k|hong|hông)(\?)?$/i,
  ];
  
  for (const pattern of productAvailabilityPatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      const productName = match[2].trim();
      // Loại bỏ các từ không cần thiết
      const stopWords = ["sản phẩm", "hàng", "cái", "món", "đồ"];
      let cleanProductName = productName;
      
      for (const word of stopWords) {
        if (cleanProductName.startsWith(word + " ")) {
          cleanProductName = cleanProductName.substring(word.length).trim();
        }
      }
      
      return cleanProductName;
    }
  }
  
  return null;
};

/**
 * Tạo câu trả lời dựa trên ngữ cảnh sản phẩm
 * @param {string} message - Câu hỏi của người dùng
 * @param {object} product - Thông tin sản phẩm
 * @returns {object|null} - Câu trả lời hoặc null nếu không thể trả lời
 */
const generateContextResponse = (message, product) => {
  const lowerMessage = message.toLowerCase();
  
  // Kiểm tra lại lần nữa product có tồn tại không
  if (!product) return null;
  
  // Tạo câu trả lời dựa vào loại câu hỏi
  let responseMessage = "";
  
  // Câu hỏi về công dụng
  if (
    /công dụng|tác dụng|dùng để làm gì|dùng để|dùng như thế nào|sử dụng|cách dùng/.test(
      lowerMessage
    )
  ) {
    responseMessage = product.productDetails
      ? `${product.productName} ${product.productDetails}`
      : `${product.productName} là sản phẩm ${
          product.productCategory || product.category
        }. Vui lòng xem chi tiết sản phẩm để biết thêm về công dụng.`;
  }
  // Câu hỏi về giới thiệu
  else if (
    /giới thiệu|nói về|thông tin về|mô tả|sản phẩm này|thế nào/.test(
      lowerMessage
    )
  ) {
    responseMessage = product.productIntroduction
      ? `Giới thiệu về ${product.productName}: ${product.productIntroduction}`
      : `${product.productName} là sản phẩm ${
          product.productCategory || product.category
        }. Hiện chưa có thông tin giới thiệu chi tiết về sản phẩm này.`;
  }
  // Câu hỏi về giá
  else if (/giá bao nhiêu|bao nhiêu tiền|giá|bao nhiêu/.test(lowerMessage)) {
    const originalPrice = product.productPrice || product.price || 0;
    const discount = product.productDiscount || 0;
    const promoPrice =
      product.productPromoPrice ||
      (discount > 0
        ? Math.round(originalPrice * (1 - discount / 100))
        : originalPrice);
  
    if (discount > 0) {
      responseMessage = `Giá của ${product.productName} là ${formatCurrency(
        promoPrice
      )} (Đã giảm ${discount}% từ ${formatCurrency(originalPrice)}).`;
    } else {
      responseMessage = `Giá của ${product.productName} là ${formatCurrency(
        originalPrice
      )}.`;
    }
  }
  // Câu hỏi về xuất xứ, thành phần
  else if (
    /xuất xứ|sản xuất|thành phần|nguyên liệu|có chứa|bảo quản/.test(
      lowerMessage
    )
  ) {
    responseMessage =
      product.productOrigin || product.origin
        ? `${product.productName} có xuất xứ từ ${
            product.productOrigin || product.origin
          }.`
      : `Thông tin chi tiết về xuất xứ và thành phần của ${product.productName} được ghi rõ trên bao bì sản phẩm.`;
    
    // Thêm thông tin thương hiệu nếu có
    if (product.productBrand) {
      responseMessage += ` Sản phẩm thuộc thương hiệu ${product.productBrand}.`;
    }
  }
  // Câu hỏi về hạn sử dụng
  else if (/hạn sử dụng|bảo hành|chất lượng/.test(lowerMessage)) {
    responseMessage = product.expiryDate
      ? `${product.productName} có hạn sử dụng đến ${product.expiryDate}.`
      : `Thông tin về hạn sử dụng của ${product.productName} được ghi rõ trên bao bì sản phẩm.`;
  }
  // Các câu hỏi chung
  else {
    const price = product.productPrice || product.price || 0;
    responseMessage = `Sản phẩm ${product.productName} thuộc danh mục ${
      product.productCategory || product.category
    } với giá ${formatCurrency(
      price
    )}. Bạn muốn biết thêm thông tin gì về sản phẩm này?`;
  }
  
  return {
    success: true,
    type: "text",
    message: responseMessage,
    product: product, // Trả về thông tin sản phẩm để hiển thị nếu cần
  };
};

/**
 * Định dạng số tiền sang VND
 * @param {number} amount - Số tiền
 * @returns {string} - Chuỗi tiền đã định dạng
 */
const formatCurrency = (amount) => {
  if (!amount) return "0 đ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Thêm hàm nhận diện câu hỏi về món ăn/công thức
const isCookingQuestion = (message) => {
  const cookingKeywords = ["nấu", "công thức", "nguyên liệu", "cách làm"];
  return cookingKeywords.some((kw) => message.toLowerCase().includes(kw));
};

/**
 * Detects if the user is trying to search for multiple products in one message
 * @param {string} message - User's message
 * @returns {string[]|null} - Array of product queries or null if not a multi-product search
 */
const detectMultiProductSearch = (message) => {
  if (!message) return null;
  
  const lowerMessage = message.toLowerCase().trim();
  
  // Danh sách các từ khoá sản phẩm phổ biến để kiểm tra
  const commonProductKeywords = [
    "nước giặt",
    "nước rửa",
    "nước ngọt",
    "nước giải khát",
    "pepsi",
    "coca",
    "thịt",
    "cá",
    "rau",
    "củ",
    "quả",
    "bánh",
    "kẹo",
    "mì",
    "bún",
    "gia vị",
    "dầu ăn",
    "nước mắm",
    "nước tương",
    "sữa",
    "trà",
    "cà phê",
  ];
  
  // Kiểm tra xem tin nhắn có chứa ít nhất 2 từ khoá sản phẩm không
  let productKeywordsFound = [];
  for (const keyword of commonProductKeywords) {
    if (lowerMessage.includes(keyword)) {
      productKeywordsFound.push(keyword);
    }
  }
  
  // Nếu tìm thấy ít nhất 2 từ khoá sản phẩm, coi là tìm kiếm nhiều sản phẩm
  const hasMultipleProductKeywords = productKeywordsFound.length >= 2;
  
  // Check for multi-product search indicators
  const hasMultiSearchIndicator = 
    lowerMessage.includes("nhiều sản phẩm") ||
    lowerMessage.includes("nhiều loại") ||
    lowerMessage.includes("tìm nhiều") ||
    lowerMessage.includes("cùng lúc") ||
    lowerMessage.includes("so sánh") ||
    lowerMessage.includes("đối chiếu") ||
    lowerMessage.includes("các loại") ||
    lowerMessage.includes("các sản phẩm") ||
    lowerMessage.match(/tìm.+và.+/) !== null ||
    // Thêm nhận diện khi tin nhắn chứa "tìm" và dấu phẩy
    lowerMessage.match(/tìm.+,.+/) !== null ||
    // Hoặc khi chứa từ tìm kiếm và chứa ít nhất 2 từ khoá sản phẩm
    (lowerMessage.includes("tìm") && hasMultipleProductKeywords);
  
  // Nếu không có dấu hiệu tìm nhiều sản phẩm, kiểm tra thêm các trường hợp đặc biệt
  if (!hasMultiSearchIndicator) {
    // Kiểm tra xem có phải tin nhắn chỉ liệt kê các sản phẩm không, ví dụ: "nước giặt nước rửa chén"
    if (hasMultipleProductKeywords) {
      // Nếu có chứa ít nhất 2 từ khoá sản phẩm mà không có từ khoá tìm kiếm,
      // giả định là người dùng đang muốn tìm nhiều sản phẩm
      console.log(
        "Phát hiện yêu cầu tìm nhiều sản phẩm từ danh sách từ khoá:",
        productKeywordsFound
      );
    } else {
      // Không phải tin nhắn tìm nhiều sản phẩm
      return null;
    }
  }
  
  // Common separators in Vietnamese queries
  const separators = [
    ",",
    "và",
    "với",
    "cùng với",
    ";",
    "+",
    "so với",
    "so sánh với",
  ];
  
  // Try to split by common separators
  let parts = [];
  
  // Special handling for comparison queries
  if (lowerMessage.includes("so sánh") || lowerMessage.includes("đối chiếu")) {
    const comparisonTerms = [
      "so sánh",
      "đối chiếu",
      "so với",
      "đối với",
      "so",
      "hơn",
      "kém",
      "thua",
    ];
    
    // Extract the part after comparison keywords
    let cleanMessage = lowerMessage;
    for (const term of comparisonTerms) {
      if (lowerMessage.includes(term)) {
        const splitResult = lowerMessage.split(term);
        cleanMessage =
          splitResult.length > 1 && splitResult[1]
            ? splitResult[1].trim()
            : lowerMessage;
        break;
      }
    }
    
    // If we have a cleaner message after comparison terms, try to split it
    if (cleanMessage !== lowerMessage) {
      for (const separator of separators) {
        if (cleanMessage.includes(separator)) {
          if (separator === "và") {
            parts = cleanMessage
              .split(/\s+và\s+/i)
              .filter((p) => p.trim().length > 0);
          } else if (
            separator === "với" ||
            separator === "so với" ||
            separator === "so sánh với"
          ) {
            // Special handling for 'với' as it can be part of other phrases
            parts = cleanMessage
              .split(/\s+(với|so với|so sánh với)\s+/i)
              .filter((p) => p.trim().length > 0);
          } else {
            parts = cleanMessage
              .split(separator)
              .filter((p) => p.trim().length > 0);
          }
          break;
        }
      }
    }
  } else {
    // Regular non-comparison multi-product search
    for (const separator of separators) {
      // If we already have multiple parts, break
      if (parts.length > 1) break;
      
      // Try splitting by this separator
      if (message.toLowerCase().includes(separator)) {
        // Handle "và" specially to avoid splitting phrases like "rau và củ" that should stay together
        if (separator === "và") {
          parts = message.split(/\s+và\s+/i).filter((p) => p.trim().length > 0);
        } else if (
          separator === "với" ||
          separator === "so với" ||
          separator === "so sánh với"
        ) {
          // Special handling for 'với' as it can be part of other phrases
          parts = message
            .split(/\s+(với|so với|so sánh với)\s+/i)
            .filter((p) => p.trim().length > 0);
        } else {
          parts = message.split(separator).filter((p) => p.trim().length > 0);
        }
      }
    }
  }
  
  // Nếu không tách được và có nhiều từ khoá sản phẩm, tạo ra các phần từ các từ khoá đó
  if (parts.length <= 1 && productKeywordsFound.length >= 2) {
    console.log("Tạo các phần tìm kiếm từ các từ khoá sản phẩm phát hiện được");
    
    // Loại bỏ "tìm", "tìm kiếm" từ tin nhắn
    let cleanMessage = lowerMessage
      .replace(/tìm kiếm/i, "")
      .replace(/tìm/i, "")
      .trim();
    
    // Thử phát hiện các sản phẩm dựa trên các từ khoá phổ biến
    parts = [];
    for (const keyword of productKeywordsFound) {
      // Tạo regex để lấy context xung quanh từ khoá
      const regex = new RegExp(
        `(\\w+\\s+)?(\\w+\\s+)?${keyword}(\\s+\\w+)?(\\s+\\w+)?`,
        "i"
      );
      const match = cleanMessage.match(regex);
      if (match) {
        parts.push(match[0].trim());
      } else {
        parts.push(keyword); // Nếu không lấy được context, dùng chính từ khoá
      }
    }
  }
  
  // If we couldn't split by separators but has multi-search indicator,
  // try to extract product names using NLP-like approach
  if (parts.length <= 1) {
    // Extract product names after removing common prefixes
    const cleanMessage = lowerMessage
      .replace(/so sánh (giữa|của|về|giá|chất lượng|ưu điểm|nhược điểm) /i, "")
      .replace(/so sánh/i, "")
      .replace(/đối chiếu/i, "")
      .replace(/tìm nhiều (sản phẩm|loại|thứ) (như|là|gồm|bao gồm|có)/i, "")
      .replace(
        /tìm (các|những) (sản phẩm|loại|thứ) (như|là|gồm|bao gồm|có)/i,
        ""
      )
      .replace(/tìm (các|những|nhiều)/i, "")
      .replace(/các loại/i, "")
      .replace(/các sản phẩm/i, "")
      .trim();
    
    // Re-attempt to split after cleaning
    for (const separator of separators) {
      if (cleanMessage.includes(separator)) {
        if (separator === "và") {
          parts = cleanMessage
            .split(/\s+và\s+/i)
            .filter((p) => p.trim().length > 0);
        } else if (
          separator === "với" ||
          separator === "so với" ||
          separator === "so sánh với"
        ) {
          parts = cleanMessage
            .split(/\s+(với|so với|so sánh với)\s+/i)
            .filter((p) => p.trim().length > 0);
        } else {
          parts = cleanMessage
            .split(separator)
            .filter((p) => p.trim().length > 0);
        }
        break;
      }
    }
    
    // If we still couldn't split it, try looking for product categories or common products
    if (parts.length <= 1) {
      const commonCategories = [
        "rau",
        "củ",
        "quả",
        "thịt",
        "cá",
        "hải sản",
        "đồ uống",
        "nước ngọt",
        "bia",
        "rượu",
        "bánh",
        "kẹo",
        "gia vị",
        "dầu ăn",
        "nước mắm",
        "mì",
        "bún",
        "nước giặt",
        "nước rửa",
        "nước tẩy",
      ];
      
      // Try to identify categories in the message
      const categories = [];
      for (const category of commonCategories) {
        if (cleanMessage.includes(category)) {
          // Extract surrounding context (up to 2 words before and after)
          const regex = new RegExp(
            `(\\w+\\s+)?(\\w+\\s+)?${category}(\\s+\\w+)?(\\s+\\w+)?`,
            "i"
          );
          const match = cleanMessage.match(regex);
          if (match) {
            categories.push(match[0].trim());
          }
        }
      }
      
      // If we found at least 2 categories, use them as parts
      if (categories.length >= 2) {
        parts = categories;
      }
    }
  }
  
  // Xử lý trường hợp đầu vào như "nước giặt nước rửa chén" (không có dấu phân cách)
  if (parts.length <= 1 && hasMultipleProductKeywords) {
    // Thử tách dựa vào từ khoá phổ biến
    let remainingText = lowerMessage;
    parts = [];
    
    // Sắp xếp các từ khoá theo độ dài giảm dần để đảm bảo tìm thấy từ dài nhất trước
    const sortedKeywords = [...commonProductKeywords].sort(
      (a, b) => b.length - a.length
    );
    
    while (remainingText.length > 0) {
      let found = false;
      
      for (const keyword of sortedKeywords) {
        if (remainingText.includes(keyword)) {
          const index = remainingText.indexOf(keyword);
          
          // Nếu có nội dung trước từ khoá và nó không chỉ là khoảng trắng
          if (index > 0) {
            const beforeText = remainingText.substring(0, index).trim();
            if (beforeText.length > 0) {
              parts.push(beforeText);
            }
          }
          
          // Thêm cụm từ khoá và context xung quanh
          const regex = new RegExp(
            `(\\w+\\s+)?(\\w+\\s+)?${keyword}(\\s+\\w+)?(\\s+\\w+)?`,
            "i"
          );
          const match = remainingText.match(regex);
          if (match) {
            parts.push(match[0].trim());
            remainingText = remainingText
              .substring(index + keyword.length)
              .trim();
          } else {
            parts.push(keyword);
            remainingText = remainingText
              .substring(index + keyword.length)
              .trim();
          }
          
          found = true;
          break;
        }
      }
      
      // Nếu không tìm thấy từ khoá nào nữa, thêm phần còn lại vào parts nếu còn
      if (!found) {
        if (remainingText.trim().length > 0) {
          parts.push(remainingText.trim());
        }
        break;
      }
    }
  }
  
  // Loại bỏ các phần trùng lặp
  parts = [...new Set(parts)];
  
  // Loại bỏ các phần quá ngắn (ít hơn 2 ký tự)
  parts = parts.filter((p) => p.length >= 2);
  
  // Only consider it a multi-product search if we have at least 2 parts
  if (parts.length >= 2) {
    console.log("Tìm kiếm nhiều sản phẩm được phát hiện:", parts);
    return parts.map((p) => p.trim());
  }
  
  // Nếu vẫn không tìm được nhiều sản phẩm dù đã phát hiện dấu hiệu, 
  // cố gắng phân tích câu một cách thông minh hơn
  if (hasMultiSearchIndicator || hasMultipleProductKeywords) {
    console.log(
      "Cố gắng phân tích câu thông minh hơn - lowerMessage:",
      lowerMessage
    );
    
    // Tạo danh sách từ khoá với các tiền tố phổ biến
    const expandedKeywords = [];
    for (const keyword of commonProductKeywords) {
      expandedKeywords.push(keyword);
      expandedKeywords.push(`sản phẩm ${keyword}`);
      expandedKeywords.push(`loại ${keyword}`);
    }
    
    // Tìm tất cả các từ khoá phổ biến trong tin nhắn
    const detectedProducts = [];
    for (const keyword of expandedKeywords) {
      if (lowerMessage.includes(keyword)) {
        // Trích xuất từ khoá và ngữ cảnh xung quanh
        const regex = new RegExp(
          `(\\w+\\s+)?(\\w+\\s+)?${keyword}(\\s+\\w+)?(\\s+\\w+)?`,
          "i"
        );
        const match = lowerMessage.match(regex);
        if (match) {
          detectedProducts.push(match[0].trim());
        }
      }
    }
    
    // Nếu phát hiện được từ 2 sản phẩm trở lên
    if (detectedProducts.length >= 2) {
      console.log(
        "Phát hiện sản phẩm từ phân tích thông minh:",
        detectedProducts
      );
      return detectedProducts.map((p) => p.trim());
    }
  }
  
  return null;
};

/**
 * Handles search for multiple products
 * @param {string[]} queries - Array of search queries
 * @returns {Promise<Array>} - Search results for each query
 */
const handleMultiProductSearch = async (queries) => {
  const results = [];
  
  // Danh sách các từ cần loại bỏ khi tìm kiếm
  const stopWords = [
    "tìm",
    "kiếm",
    "tìm kiếm",
    "sản phẩm",
    "loại",
    "như",
    "các",
    "những",
    "nhiều",
    "cho",
    "tôi",
  ];
  
  for (const query of queries) {
    try {
      // Chuẩn hoá query dựa vào từ khoá
      let cleanQuery = query.toLowerCase().trim();
      
      // Loại bỏ các stopwords để tập trung vào tên sản phẩm
      for (const word of stopWords) {
        // Chỉ loại bỏ nếu từ đứng độc lập, không phải một phần của từ khác
        cleanQuery = cleanQuery.replace(new RegExp(`\\b${word}\\b`, "gi"), "");
      }
      
      cleanQuery = cleanQuery.trim();
      
      console.log(
        `Tìm kiếm sản phẩm "${query}" (đã chuẩn hoá: "${cleanQuery}")`
      );
      
      // Sử dụng query đã chuẩn hoá để tìm kiếm
      const products = await searchProductsMongoDB(cleanQuery);
      
      if (products && products.length > 0) {
        results.push({
          query: query, // Giữ lại query gốc để hiển thị cho người dùng
          cleanQuery: cleanQuery, // Thêm query đã chuẩn hoá để debug
          products: products.slice(0, 5), // Limit to top 5 products per query
        });
      } else {
        // Thử lại với query gốc nếu query đã chuẩn hoá không có kết quả
        console.log(
          `Không tìm thấy kết quả với query đã chuẩn hoá, thử lại với query gốc: "${query}"`
        );
        const originalProducts = await searchProductsMongoDB(query);
        
        if (originalProducts && originalProducts.length > 0) {
          results.push({
            query: query,
            cleanQuery: null, // Đánh dấu là không sử dụng query đã chuẩn hoá
            products: originalProducts.slice(0, 5),
          });
        }
      }
    } catch (error) {
      console.error(`Lỗi khi tìm kiếm sản phẩm "${query}":`, error);
    }
  }
  
  return results;
};

// Thêm hàm xử lý so sánh sản phẩm
export const handleProductComparison = async (req, res) => {
  try {
    const { userId, productIds, message } = req.body;
    console.log(`Xử lý yêu cầu so sánh sản phẩm từ user ${userId}`);

    let products = [];

    // Nếu có danh sách productIds được gửi lên
    if (productIds && Array.isArray(productIds) && productIds.length >= 2) {
      console.log(`So sánh các sản phẩm với ID: ${productIds.join(", ")}`);
      products = await Product.find({ _id: { $in: productIds } });
    }
    // Nếu không có productIds nhưng có userId, tìm sản phẩm từ ngữ cảnh
    else if (userId) {
      const context = await initOrGetUserContext(userId);

      if (context && context.lastProducts && context.lastProducts.length >= 2) {
        console.log(
          `Sử dụng sản phẩm từ ngữ cảnh: ${context.lastProducts.length} sản phẩm`
        );
        // Lấy tối đa 3 sản phẩm từ ngữ cảnh
        products = context.lastProducts.slice(0, 3);
      } else if (context && context.lastProduct) {
        // Nếu chỉ có 1 sản phẩm trong ngữ cảnh, tìm thêm sản phẩm tương tự
        try {
          const similarProducts = await Product.find({
            productCategory: context.lastProduct.productCategory,
            _id: { $ne: context.lastProduct._id },
          }).limit(2);

          if (similarProducts && similarProducts.length > 0) {
            products = [context.lastProduct, ...similarProducts];
            console.log(
              `Sử dụng 1 sản phẩm từ ngữ cảnh và ${similarProducts.length} sản phẩm tương tự`
            );
          } else {
            console.log("Không tìm thấy sản phẩm tương tự để so sánh");
          }
        } catch (error) {
          console.error("Lỗi khi tìm sản phẩm tương tự:", error);
        }
      }
    }

    // Nếu không tìm thấy đủ sản phẩm để so sánh
    if (!products || products.length < 2) {
      console.log("Không đủ sản phẩm để so sánh");
      return res.status(200).json({
        success: false,
        message:
          "Không tìm thấy đủ sản phẩm để so sánh. Vui lòng xem và chọn ít nhất 2 sản phẩm để so sánh.",
      });
    }

    console.log(`Tiến hành so sánh ${products.length} sản phẩm`);

    // So sánh sản phẩm
    let comparison;
    let comparisonMessage;

    try {
      // Nếu có đúng 2 sản phẩm, sử dụng hàm generateSimpleComparison
      if (products.length === 2) {
        console.log("Sử dụng so sánh chi tiết cho 2 sản phẩm");
        comparisonMessage = generateSimpleComparison(products);
        
        // Chuẩn bị thông tin sản phẩm đầy đủ để hiển thị
        const productData = products.map(p => ({
          id: p._id,
          name: p.productName,
          price: p.productPrice,
          image: p.productImages && p.productImages.length > 0 ? p.productImages[0] : null,
          imageUrl: p.productImageURLs && p.productImageURLs.length > 0 ? p.productImageURLs[0] : null,
          imageBase64: p.productImageBase64 || null
        }));
        
        comparison = {
          products: productData,
          type: "simple_comparison",
          message: comparisonMessage,
        };
      } else {
        // Nếu có nhiều hơn 2 sản phẩm, sử dụng hàm compareProducts hiện tại
        comparison = compareProducts(products);
        comparisonMessage = generateComparisonMessage(comparison);
      }
    } catch (error) {
      console.error("Lỗi khi so sánh sản phẩm:", error);
      return res.status(200).json({
        success: false,
        message: `Lỗi khi so sánh sản phẩm: ${error.message}`,
      });
    }

    // Lưu kết quả so sánh vào ngữ cảnh
    if (userId) {
      saveContext(userId, {
        lastComparison: comparison,
        lastProducts: products,
        lastProduct: products[0],
        lastQuery: message || "So sánh sản phẩm",
      });
    }

    return res.status(200).json({
      success: true,
      type: "comparison",
      message: comparisonMessage,
      data: comparison,
    });
  } catch (error) {
    console.error("Lỗi khi so sánh sản phẩm:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi so sánh sản phẩm.",
    });
  }
};

// Hàm so sánh sản phẩm
const compareProducts = (products) => {
  // Đảm bảo có ít nhất 2 sản phẩm để so sánh
  if (!products || products.length < 2) {
    throw new Error("Cần ít nhất 2 sản phẩm để so sánh");
  }

  // Giới hạn số lượng sản phẩm so sánh
  const productsToCompare = products.slice(0, 3);

  // Các thuộc tính cần so sánh
  const comparisonAttributes = [
    { key: "productName", label: "Tên sản phẩm" },
    { key: "productBrand", label: "Thương hiệu" },
    { key: "productCategory", label: "Danh mục" },
    { key: "productPrice", label: "Giá" },
    { key: "productDiscount", label: "Giảm giá" },
    { key: "averageRating", label: "Đánh giá" },
    { key: "productStock", label: "Số lượng tồn kho" },
    { key: "productWeight", label: "Trọng lượng" },
    { key: "productOrigin", label: "Xuất xứ" },
    { key: "productDescription", label: "Mô tả" },
  ];

  // Tạo bảng so sánh
  const comparisonTable = comparisonAttributes.map((attr) => {
    const row = {
      attribute: attr.label,
      values: {},
    };

    // Lấy giá trị của thuộc tính cho từng sản phẩm
    productsToCompare.forEach((product) => {
      let value = product[attr.key];

      // Xử lý các trường hợp đặc biệt
      if (attr.key === "productPrice") {
        // Định dạng giá tiền
        value = formatCurrency(value);
      } else if (attr.key === "productDiscount") {
        // Định dạng phần trăm giảm giá
        value = value ? `${value}%` : "0%";
      } else if (attr.key === "averageRating") {
        // Định dạng đánh giá
        value = value ? `${value}/5` : "Chưa có đánh giá";
      } else if (attr.key === "productDescription") {
        // Rút gọn mô tả
        value = value
          ? value.length > 100
            ? value.substring(0, 100) + "..."
            : value
          : "Không có mô tả";
      } else if (!value) {
        // Giá trị mặc định nếu không có dữ liệu
        value = "Không có thông tin";
      }

      row.values[product._id] = value;
    });

    return row;
  });

  // Phân tích sự khác biệt giữa các sản phẩm
  const differences = analyzeDifferences(productsToCompare);

  // Phân tích ưu điểm của từng sản phẩm
  const advantages = {};
  productsToCompare.forEach((product) => {
    const otherProducts = productsToCompare.filter(
      (p) => p._id !== product._id
    );
    advantages[product._id] = analyzeAdvantages(product, otherProducts);
  });

  // Chuẩn bị thông tin sản phẩm đầy đủ để hiển thị
  const productData = productsToCompare.map(p => ({
    id: p._id,
    name: p.productName,
    price: p.productPrice,
    image: p.productImages && p.productImages.length > 0 ? p.productImages[0] : null,
    imageUrl: p.productImageURLs && p.productImageURLs.length > 0 ? p.productImageURLs[0] : null,
    imageBase64: p.productImageBase64 || null
  }));

  return {
    products: productData,
    comparisonTable,
    differences,
    advantages,
  };
};

// Phân tích sự khác biệt chính giữa các sản phẩm
const analyzeDifferences = (products) => {
  const differences = [];

  // So sánh giá
  const prices = products.map((p) => parseFloat(p.productPrice) || 0);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (maxPrice - minPrice > 0) {
    const priceDiff = (((maxPrice - minPrice) / minPrice) * 100).toFixed(0);
    differences.push({
      type: "price",
      description: `Chênh lệch giá ${priceDiff}% giữa sản phẩm đắt nhất và rẻ nhất`,
    });
  }

  // So sánh trọng lượng/dung tích
  const weights = products
    .map((p) => parseFloat(p.productWeight))
    .filter((w) => !isNaN(w));
  if (weights.length === products.length) {
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);

    if (maxWeight / minWeight > 1.2) {
      // Chênh lệch hơn 20%
      differences.push({
        type: "weight",
        description: `Sản phẩm có trọng lượng/dung tích khác nhau đáng kể`,
      });
    }
  }

  // So sánh thương hiệu
  const brands = new Set(products.map((p) => p.productBrand).filter(Boolean));
  if (brands.size > 1) {
    differences.push({
      type: "brand",
      description: `Sản phẩm đến từ các thương hiệu khác nhau: ${Array.from(
        brands
      ).join(", ")}`,
    });
  }

  // So sánh xuất xứ
  const origins = new Set(products.map((p) => p.productOrigin).filter(Boolean));
  if (origins.size > 1) {
    differences.push({
      type: "origin",
      description: `Sản phẩm có xuất xứ khác nhau: ${Array.from(origins).join(
        ", "
      )}`,
    });
  }

  return differences;
};

// Phân tích ưu điểm của một sản phẩm so với các sản phẩm khác
const analyzeAdvantages = (product, otherProducts) => {
  const advantages = [];

  // So sánh giá
  const thisPrice = parseFloat(product.productPrice) || 0;
  const otherPrices = otherProducts.map((p) => parseFloat(p.productPrice) || 0);
  if (thisPrice < Math.min(...otherPrices)) {
    advantages.push({
      type: "price",
      description: "Giá thấp nhất trong các sản phẩm so sánh",
    });
  }

  // So sánh đánh giá
  const thisRating = parseFloat(product.averageRating) || 0;
  const otherRatings = otherProducts.map(
    (p) => parseFloat(p.averageRating) || 0
  );
  if (thisRating > Math.max(...otherRatings)) {
    advantages.push({
      type: "rating",
      description: "Đánh giá cao nhất trong các sản phẩm so sánh",
    });
  }

  // So sánh lượng bán
  const thisSold = parseInt(product.soldCount) || 0;
  const otherSold = otherProducts.map((p) => parseInt(p.soldCount) || 0);
  if (thisSold > Math.max(...otherSold)) {
    advantages.push({
      type: "popularity",
      description: "Bán chạy nhất trong các sản phẩm so sánh",
    });
  }

  // So sánh giảm giá
  const thisDiscount = parseFloat(product.productDiscount) || 0;
  const otherDiscounts = otherProducts.map(
    (p) => parseFloat(p.productDiscount) || 0
  );
  if (thisDiscount > Math.max(...otherDiscounts)) {
    advantages.push({
      type: "discount",
      description: "Có mức giảm giá cao nhất",
    });
  }

  return advantages;
};

// Tạo nội dung tin nhắn so sánh sản phẩm dễ đọc
const generateComparisonMessage = (comparison) => {
  if (!comparison || !comparison.products) {
    return "Không có đủ dữ liệu để so sánh sản phẩm.";
  }

  let message = "📊 *SO SÁNH SẢN PHẨM*\n\n";

  // Thêm tên sản phẩm
  message += "🔹 *Sản phẩm so sánh:*\n";
  comparison.products.forEach((product, index) => {
    message += `${index + 1}. ${product.name}\n`;
  });
  message += "\n";

  // Thêm bảng so sánh
  message += "🔹 *Bảng so sánh:*\n";
  comparison.comparisonTable.forEach((row) => {
    message += `- ${row.attribute}: `;

    // Lấy danh sách các sản phẩm
    const productIds = comparison.products.map((p) => p.id);

    // Hiển thị giá trị của từng sản phẩm
    productIds.forEach((productId, index) => {
      if (index > 0) message += " | ";
      message += `${row.values[productId] || "Không có"}`;
    });

    message += "\n";
  });
  message += "\n";

  // Thêm sự khác biệt chính
  if (comparison.differences && comparison.differences.length > 0) {
    message += "🔹 *Sự khác biệt chính:*\n";
    comparison.differences.forEach((diff) => {
      message += `- ${diff.description}\n`;
    });
    message += "\n";
  }

  // Thêm ưu điểm của từng sản phẩm
  message += "🔹 *Ưu điểm nổi bật:*\n";
  comparison.products.forEach((product, index) => {
    const advantages = comparison.advantages[product.id];
    message += `${index + 1}. ${product.name}:\n`;

    if (advantages && advantages.length > 0) {
      advantages.forEach((adv) => {
        message += `   ✓ ${adv.description}\n`;
      });
    } else {
      message += `   (Không có ưu điểm nổi bật)\n`;
    }
  });

  return message;
};

// Thêm xử lý nhận diện ý định so sánh sản phẩm trong hàm processMessage
export const processMessage = async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin người dùng hoặc tin nhắn",
      });
    }

    console.log(`Nhận tin nhắn từ user ${userId}: "${message}"`);

    // Kiểm tra xem có phải là yêu cầu so sánh sản phẩm không
    if (isComparisonRequest(message)) {
      console.log("Phát hiện yêu cầu so sánh sản phẩm");
      
      // Debug log để kiểm tra userId
      console.log("====> Truyền userId để so sánh:", userId);

      // Chuẩn bị dữ liệu đúng định dạng để gọi handleCompareProducts
      const messageData = { userId, message };
      const contextData = { userId };
      
      try {
        // Sử dụng hàm handleCompareProducts từ chatbotProductHandler.js  
        const compareResult = await handleCompareProducts(messageData, contextData);
        console.log("====> Kết quả so sánh:", compareResult.success);
        return res.status(200).json(compareResult);
      } catch (compareError) {
        console.error("Lỗi khi so sánh sản phẩm:", compareError);
        return res.status(200).json({
          success: false,
          message: "Đã xảy ra lỗi khi so sánh sản phẩm. Vui lòng thử lại sau.",
          error: compareError.message
        });
      }
    }

    // Xử lý các loại tin nhắn khác...
    // ...

    // Trả về phản hồi mặc định nếu không xử lý được
    return res.status(200).json({
      success: true,
      message:
        "Tôi không hiểu yêu cầu của bạn. Bạn có thể hỏi về sản phẩm cụ thể hoặc yêu cầu so sánh sản phẩm.",
    });
  } catch (error) {
    console.error("Lỗi khi xử lý tin nhắn:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xử lý tin nhắn.",
    });
  }
};

// Hàm kiểm tra xem tin nhắn có phải là yêu cầu so sánh sản phẩm không
const isComparisonRequest = (message) => {
  if (!message) return false;

  const lowerMessage = message.toLowerCase().trim();
  console.log(
    `Kiểm tra tin nhắn có phải yêu cầu so sánh không: "${lowerMessage}"`
  );

  // Các mẫu câu cụ thể về so sánh
  const comparisonPhrases = [
    "so sánh",
    "so với",
    "đối chiếu",
    "khác nhau",
    "so sánh sản phẩm",
    "phân tích",
    "nên chọn cái nào",
    "có thể so sánh",
    "so sánh giúp",
    "giúp so sánh",
    "cái nào tốt hơn",
    "cái nào tốt",
    "cái nào rẻ hơn",
    "so sánh giá"
  ];

  // Kiểm tra các câu chính xác có chứa từ khóa so sánh
  for (const phrase of comparisonPhrases) {
    if (lowerMessage.includes(phrase)) {
      console.log(`Phát hiện yêu cầu so sánh từ cụm từ: "${phrase}"`);
      return true;
    }
  }

  return false;
};

// Tạo nội dung so sánh sản phẩm đơn giản, dễ hiểu cho người dùng
const generateSimpleComparison = (products) => {
  // Đảm bảo có đúng 2 sản phẩm để so sánh
  if (!products || products.length !== 2) {
    return "Cần chính xác 2 sản phẩm để so sánh chi tiết.";
  }

  const product1 = products[0];
  const product2 = products[1];

  // Tạo đoạn giới thiệu
  let comparison = `📊 *SO SÁNH SẢN PHẨM*\n\n`;

  // Thông tin sản phẩm 1
  comparison += `🥬 *Sản phẩm 1: ${product1.productName}*\n`;
  comparison += `- Giá: ${formatCurrency(product1.productPrice)}\n`;
  comparison += `- Xuất xứ: ${
    product1.productOrigin || "Không có thông tin"
  }\n`;
  comparison += `- Loại: ${product1.productCategory || "Không có thông tin"}\n`;
  comparison += `- Thương hiệu: ${
    product1.productBrand || "Không có thông tin"
  }\n`;
  comparison += `- Đánh giá: ${
    product1.averageRating
      ? product1.averageRating + " sao"
      : "Chưa có đánh giá"
  }\n`;
  if (product1.productDescription) {
    comparison += `- Mô tả: ${
      product1.productDescription.length > 100
        ? product1.productDescription.substring(0, 100) + "..."
        : product1.productDescription
    }\n`;
  }
  comparison += "\n";

  // Thông tin sản phẩm 2
  comparison += `🥬 *Sản phẩm 2: ${product2.productName}*\n`;
  comparison += `- Giá: ${formatCurrency(product2.productPrice)}\n`;
  comparison += `- Xuất xứ: ${
    product2.productOrigin || "Không có thông tin"
  }\n`;
  comparison += `- Loại: ${product2.productCategory || "Không có thông tin"}\n`;
  comparison += `- Thương hiệu: ${
    product2.productBrand || "Không có thông tin"
  }\n`;
  comparison += `- Đánh giá: ${
    product2.averageRating
      ? product2.averageRating + " sao"
      : "Chưa có đánh giá"
  }\n`;
  if (product2.productDescription) {
    comparison += `- Mô tả: ${
      product2.productDescription.length > 100
        ? product2.productDescription.substring(0, 100) + "..."
        : product2.productDescription
    }\n`;
  }
  comparison += "\n";

  // So sánh giá
  comparison += `💰 *So sánh giá*\n`;
  const price1 = parseFloat(product1.productPrice) || 0;
  const price2 = parseFloat(product2.productPrice) || 0;

  if (price1 < price2) {
    const priceDiff = (((price2 - price1) / price1) * 100).toFixed(0);
    comparison += `${
      product1.productName
    } rẻ hơn ${priceDiff}% (${formatCurrency(price2 - price1)}) so với ${
      product2.productName
    }.\n`;
  } else if (price2 < price1) {
    const priceDiff = (((price1 - price2) / price2) * 100).toFixed(0);
    comparison += `${
      product2.productName
    } rẻ hơn ${priceDiff}% (${formatCurrency(price1 - price2)}) so với ${
      product1.productName
    }.\n`;
  } else {
    comparison += `Hai sản phẩm có giá tương đương nhau.\n`;
  }
  comparison += "\n";

  // So sánh chất lượng/đánh giá
  comparison += `⭐ *So sánh chất lượng*\n`;
  const rating1 = parseFloat(product1.averageRating) || 0;
  const rating2 = parseFloat(product2.averageRating) || 0;

  if (rating1 > rating2) {
    comparison += `${product1.productName} được đánh giá cao hơn với ${rating1} sao (so với ${rating2} sao của ${product2.productName}).\n`;
  } else if (rating2 > rating1) {
    comparison += `${product2.productName} được đánh giá cao hơn với ${rating2} sao (so với ${rating1} sao của ${product1.productName}).\n`;
  } else if (rating1 > 0) {
    comparison += `Cả hai sản phẩm đều có đánh giá tương đương nhau (${rating1} sao).\n`;
  } else {
    comparison += `Chưa có đủ đánh giá để so sánh chất lượng hai sản phẩm.\n`;
  }
  comparison += "\n";

  // So sánh xuất xứ
  if (product1.productOrigin && product2.productOrigin) {
    comparison += `🌍 *So sánh xuất xứ*\n`;
    if (product1.productOrigin === product2.productOrigin) {
      comparison += `Cả hai sản phẩm đều có xuất xứ từ ${product1.productOrigin}.\n`;
    } else {
      comparison += `${product1.productName} có xuất xứ từ ${product1.productOrigin}, trong khi ${product2.productName} có xuất xứ từ ${product2.productOrigin}.\n`;
    }
    comparison += "\n";
  }

  // Điểm mạnh của từng sản phẩm
  comparison += `💪 *Điểm mạnh*\n`;

  // Điểm mạnh sản phẩm 1
  comparison += `${product1.productName}:\n`;
  const strengths1 = [];

  if (price1 < price2) strengths1.push("Giá thấp hơn");
  if (rating1 > rating2) strengths1.push("Đánh giá cao hơn");
  if (product1.productDiscount > (product2.productDiscount || 0))
    strengths1.push("Giảm giá nhiều hơn");
  if (product1.soldCount > (product2.soldCount || 0))
    strengths1.push("Bán chạy hơn");

  if (strengths1.length > 0) {
    strengths1.forEach((strength) => {
      comparison += `- ${strength}\n`;
    });
  } else {
    comparison += `- Chưa có thông tin nổi bật\n`;
  }

  // Điểm mạnh sản phẩm 2
  comparison += `\n${product2.productName}:\n`;
  const strengths2 = [];

  if (price2 < price1) strengths2.push("Giá thấp hơn");
  if (rating2 > rating1) strengths2.push("Đánh giá cao hơn");
  if (product2.productDiscount > (product1.productDiscount || 0))
    strengths2.push("Giảm giá nhiều hơn");
  if (product2.soldCount > (product1.soldCount || 0))
    strengths2.push("Bán chạy hơn");

  if (strengths2.length > 0) {
    strengths2.forEach((strength) => {
      comparison += `- ${strength}\n`;
    });
  } else {
    comparison += `- Chưa có thông tin nổi bật\n`;
  }
  comparison += "\n";

  // Kết luận
  comparison += `🎯 *Kết luận*\n`;

  // Tạo kết luận dựa trên giá và đánh giá
  if (price1 < price2 && rating1 >= rating2) {
    comparison += `${product1.productName} có vẻ lựa chọn tốt hơn với giá thấp hơn và chất lượng tương đương hoặc tốt hơn.\n`;
  } else if (price2 < price1 && rating2 >= rating1) {
    comparison += `${product2.productName} có vẻ lựa chọn tốt hơn với giá thấp hơn và chất lượng tương đương hoặc tốt hơn.\n`;
  } else if (price1 === price2 && rating1 > rating2) {
    comparison += `Với cùng mức giá, ${product1.productName} được đánh giá cao hơn nên có thể là lựa chọn tốt hơn.\n`;
  } else if (price1 === price2 && rating2 > rating1) {
    comparison += `Với cùng mức giá, ${product2.productName} được đánh giá cao hơn nên có thể là lựa chọn tốt hơn.\n`;
  } else if (price1 < price2 && rating2 > rating1) {
    comparison += `Nếu bạn quan tâm đến giá cả, ${product1.productName} là lựa chọn tốt hơn. Nếu bạn ưu tiên chất lượng, ${product2.productName} có đánh giá cao hơn.\n`;
  } else if (price2 < price1 && rating1 > rating2) {
    comparison += `Nếu bạn quan tâm đến giá cả, ${product2.productName} là lựa chọn tốt hơn. Nếu bạn ưu tiên chất lượng, ${product1.productName} có đánh giá cao hơn.\n`;
  } else {
    comparison += `Cả hai sản phẩm đều có ưu điểm riêng. Bạn có thể chọn dựa trên sở thích cá nhân hoặc nhu cầu cụ thể.\n`;
  }

  return comparison;
};

// Hàm trích xuất dữ liệu hình ảnh từ sản phẩm
const getProductImageData = (product) => {
  const imageData = {};
  
  // Thử lấy hình ảnh từ tất cả các nguồn có thể
  // 1. Trường hợp productImages là mảng
  if (product.productImages && Array.isArray(product.productImages) && product.productImages.length > 0) {
    // Lưu URL đầy đủ vào các trường
    imageData.image = product.productImages[0];
    imageData.imageUrl = product.productImages[0];
  }
  
  // 2. Trường hợp productImages là string
  if (product.productImages && typeof product.productImages === 'string') {
    imageData.image = product.productImages;
    imageData.imageUrl = product.productImages;
  }
  
  // 3. Kiểm tra các trường hình ảnh khác
  if (product.productImageURLs && Array.isArray(product.productImageURLs) && product.productImageURLs.length > 0) {
    imageData.imageUrl = product.productImageURLs[0];
  }
  
  if (product.productImage) {
    imageData.image = product.productImage;
    imageData.imageUrl = imageData.imageUrl || product.productImage;
  }
  
  if (product.imageUrl) {
    imageData.imageUrl = product.imageUrl;
  }
  
  if (product.image) {
    imageData.image = product.image;
    imageData.imageUrl = imageData.imageUrl || product.image;
  }
  
  if (product.thumbnailUrl) {
    imageData.thumbnailUrl = product.thumbnailUrl;
    imageData.imageUrl = imageData.imageUrl || product.thumbnailUrl;
  }
  
  // 4. Trường hợp sử dụng imageBase64
  if (product.productImageBase64) {
    imageData.imageBase64 = product.productImageBase64;
  }
  
  // 5. Log để debug
  console.log(`Thông tin hình ảnh cho sản phẩm ${product.productName || product._id}:`, {
    hasProductImages: !!product.productImages,
    productImagesLength: Array.isArray(product.productImages) ? product.productImages.length : 'not array',
    extractedImageUrl: imageData.imageUrl,
    extractedImage: imageData.image
  });
  
  return imageData;
};

// Thêm hàm detectPersonalHealthInfo nếu chưa có
const detectPersonalHealthInfo = (message) => {
  // Hàm tạm để tránh lỗi
  console.log("Phát hiện thông tin sức khỏe từ tin nhắn:", message);
  return detectHealthNeeds(message);
};

// Xử lý câu hỏi về sức khỏe
async function handleHealthInquiry(message, context) {
  console.log("Xử lý câu hỏi về sức khỏe");
  
  // Phát hiện nhu cầu sức khỏe từ tin nhắn
  const healthNeeds = detectHealthNeeds(message);
  console.log("Phát hiện nhu cầu sức khỏe:", healthNeeds);
  
  if (healthNeeds && healthNeeds.length > 0) {
    const primaryNeed = healthNeeds[0].need;
    
    // Kiểm tra xem câu hỏi có khớp với câu hỏi mẫu không
    const exampleAnswer = await checkExampleQuestions(message, primaryNeed);
    if (exampleAnswer) {
      // Lưu ngữ cảnh nếu có userId và có sản phẩm
      if (context && context.userId && exampleAnswer.products) {
        saveContext(context.userId, {
          lastHealthNeed: primaryNeed,
          lastHealthProducts: exampleAnswer.products.map(p => p._id)
        });
      }
      
      return exampleAnswer;
    }
    
    // Tìm sản phẩm phù hợp với nhu cầu sức khỏe
    const products = await findProductsForHealthNeed(primaryNeed);
    
    // Tạo phản hồi dựa trên nhu cầu sức khỏe và sản phẩm phù hợp
    const response = generateHealthResponse(primaryNeed, products);
    
    // Lưu ngữ cảnh nếu có userId
    if (context && context.userId) {
      saveContext(context.userId, {
        lastHealthNeed: primaryNeed,
        lastHealthProducts: products.map(p => p._id)
      });
    }
    
    return response;
  }
  
  // Nếu không phát hiện được nhu cầu sức khỏe cụ thể
  return {
    text: "Tôi không hiểu rõ vấn đề sức khỏe bạn đang hỏi. Bạn có thể mô tả chi tiết hơn không?",
    type: 'text'
  };
}

/**
 * Kiểm tra xem câu hỏi có khớp với câu hỏi mẫu trong cơ sở dữ liệu không
 * @param {string} message - Tin nhắn của người dùng
 * @param {string} healthNeed - Loại nhu cầu sức khỏe đã phát hiện
 * @returns {string|null} - Câu trả lời mẫu hoặc null nếu không tìm thấy
 */
function checkExampleQuestions(message, healthNeed) {
  console.log(`Kiểm tra câu hỏi mẫu cho nhu cầu sức khỏe: ${healthNeed}`);
  
  if (!message || !healthNeed || !healthRecommendations) return null;
  
  const lowercaseMessage = message.toLowerCase().trim();
  
  // Xử lý đặc biệt cho tiểu đường
  if (healthNeed === 'tieuDuong' || 
      lowercaseMessage.includes("tiểu đường") || 
      lowercaseMessage.includes("đường huyết") ||
      lowercaseMessage.includes("bệnh tiểu đường")) {
    
    // Tìm sản phẩm phù hợp với nhu cầu sức khỏe tiểu đường
    return findProductsForHealthNeed(healthNeed).then(products => {
      const responseText = `Thực phẩm cho người bệnh tiểu đường:

✅ *Nên ăn:*
• Rau xanh các loại không hạn chế
• Các loại đậu (đậu đen, đậu đỏ, đậu nành)
• Ngũ cốc nguyên hạt (gạo lứt, yến mạch)
• Trái cây ít đường (táo, dâu, việt quất)
• Cá, thịt nạc
• Các loại hạt không muối
• Sữa và sản phẩm từ sữa ít béo

❌ *Nên hạn chế:*
• Đồ ngọt, bánh kẹo
• Nước ngọt, đồ uống có đường
• Trái cây có nhiều đường (chuối chín, xoài, nho)
• Gạo trắng, bánh mì trắng
• Thực phẩm chế biến sẵn
• Mỡ động vật`;

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

      return {
        text: responseText,
        type: "healthProducts",
        products: formattedProducts
      };
    });
  }
  
  // Kiểm tra xem có tồn tại dữ liệu cho nhu cầu sức khỏe này không
  if (healthRecommendations[healthNeed] && healthRecommendations[healthNeed].examples) {
    const examples = healthRecommendations[healthNeed].examples;
    
    // Tìm câu hỏi mẫu có nội dung gần với câu hỏi của người dùng
    for (const example of examples) {
      const exampleQuestion = example.question.toLowerCase().trim();
      
      if (lowercaseMessage.includes(exampleQuestion) || 
          exampleQuestion.includes(lowercaseMessage)) {
        console.log(`Tìm thấy câu hỏi mẫu: "${example.question}"`);
        return Promise.resolve({
          text: example.answer,
          type: 'text'
        });
      }
    }
  }
  
  return null;
}

/**
 * Tính toán độ tương đồng giữa hai chuỗi
 * @param {string} s1 - Chuỗi thứ nhất
 * @param {string} s2 - Chuỗi thứ hai
 * @returns {number} - Độ tương đồng (0-1)
 */
function similarity(s1, s2) {
  let longer = s1;
  let shorter = s2;
  
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  
  const longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  
  // Sử dụng khoảng cách Levenshtein
  const editDistance = levenshteinDistance(s1, s2);
  return (longerLength - editDistance) / parseFloat(longerLength);
}

/**
 * Tính khoảng cách Levenshtein giữa hai chuỗi
 * @param {string} s1 - Chuỗi thứ nhất
 * @param {string} s2 - Chuỗi thứ hai
 * @returns {number} - Khoảng cách Levenshtein
 */
function levenshteinDistance(s1, s2) {
  const a = s1.toLowerCase();
  const b = s2.toLowerCase();
  
  // Khởi tạo ma trận
  const costs = Array(b.length + 1);
  for (let i = 0; i <= b.length; i++) {
    costs[i] = i;
  }
  
  let i = 0;
  for (const x of a) {
    let j = 0;
    let prevCost = i;
    costs[0] = i + 1;
    
    for (const y of b) {
      const curCost = prevCost + (x !== y ? 1 : 0);
      prevCost = costs[++j];
      costs[j] = Math.min(costs[j] + 1, costs[j - 1] + 1, curCost);
    }
    
    i++;
  }
  
  return costs[b.length];
}

/**
 * Phân loại ý định chính của người dùng
 * @param {string} message - Tin nhắn của người dùng
 * @returns {string} - Ý định chính
 */
function classifyMainIntent(message) {
  console.log("Phân loại ý định chính:", message);
  const lowerMessage = message.toLowerCase();

  // Ưu tiên nhận diện thực phẩm cho mẹ bầu
  const pregnantKeywords = [
    'mẹ bầu', 'bà bầu', 'phụ nữ mang thai', 'thai phụ', 'đang mang thai', 
    'có thai', 'thực phẩm cho bà bầu', 'đồ ăn cho bà bầu', 'dinh dưỡng thai kỳ',
    'dinh dưỡng cho mẹ bầu', 'bầu bí', 'mang bầu', 'mang thai', 'thực phẩm thai kỳ'
  ];
  
  for (const keyword of pregnantKeywords) {
    if (lowerMessage.includes(keyword)) {
      console.log(`Phát hiện intent thực phẩm mẹ bầu với từ khóa: ${keyword}`);
      return 'faq_pregnant_food';
    }
  }

  // Ưu tiên nhận diện thực phẩm cho trẻ em
  const kidsKeywords = [
    'trẻ em', 'trẻ con', 'trẻ nhỏ', 'em bé', 'bé', 'con nít', 'nhi', 'thiếu nhi',
    'thực phẩm cho trẻ', 'đồ ăn cho trẻ', 'trẻ ăn', 'bé ăn', 'cho trẻ', 'cho bé',
    'trẻ sơ sinh', 'dinh dưỡng trẻ', 'dinh dưỡng cho bé', 'thức ăn trẻ em'
  ];
  
  for (const keyword of kidsKeywords) {
    if (lowerMessage.includes(keyword)) {
      console.log(`Phát hiện intent thực phẩm trẻ em với từ khóa: ${keyword}`);
      return 'faq_kids_food';
    }
  }

  // Ưu tiên nhận diện yêu cầu lập kế hoạch ăn kiêng
  const mealPlanKeywords = [
    'lập kế hoạch', 'tạo kế hoạch', 'lập thực đơn', 'tạo thực đơn', 'gợi ý thực đơn', 
    'kế hoạch ăn', 'thực đơn ăn', 'menu ăn kiêng', 'chế độ ăn', 'kế hoạch ăn uống',
    'thực đơn ăn kiêng', 'thực đơn giảm cân', 'kế hoạch giảm cân', 'lập lịch ăn'
  ];
  
  for (const keyword of mealPlanKeywords) {
    if (lowerMessage.includes(keyword)) {
      if (lowerMessage.includes('ăn kiêng') || lowerMessage.includes('giảm cân') || 
          lowerMessage.includes('diet') || lowerMessage.includes('keto') || 
          lowerMessage.includes('low carb')) {
        return 'meal_plan_diet';
      }
    }
  }

  // Ưu tiên nhận diện các câu hỏi về ăn kiêng, chế độ đặc biệt
  const dietKeywords = [
    'ăn kiêng', 'dành cho người ăn kiêng', 'low carb', 'keto', 'ít đường', 'giảm cân', 'dành cho người giảm cân', 'dành cho người tiểu đường', 'dành cho người huyết áp', 'dành cho người cholesterol', 'dành cho người béo phì', 'dành cho người ăn chay', 'dành cho người thuần chay', 'dành cho người dị ứng', 'dành cho người không dung nạp', 'dành cho người tập gym', 'dành cho người tập thể hình', 'dành cho người cao tuổi', 'dành cho trẻ em', 'dành cho mẹ bầu', 'dành cho bà bầu', 'dành cho người bệnh', 'dành cho người sức khỏe yếu', 'dành cho người cần dinh dưỡng đặc biệt'
  ];
  for (const keyword of dietKeywords) {
    if (lowerMessage.includes(keyword)) {
      return 'faq_diet';
    }
  }
  // 1. FAQ/chính sách/chất lượng
  const faqIntents = [
    { intent: 'faq_product_quality', keywords: ['chất lượng', 'có tốt không', 'đảm bảo', 'hàng có tốt', 'sản phẩm tốt không', 'có đảm bảo', 'hàng chất lượng', 'sản phẩm chất lượng'] },
    { intent: 'faq_return_policy', keywords: ['đổi trả', 'hoàn tiền', 'trả lại', 'không vừa ý', 'lỗi', 'hư hỏng', 'chính sách đổi', 'bảo hành', 'không thích', 'chính sách trả', 'bảo hành', 'bảo đảm'] },
    { intent: 'faq_customer_support', keywords: ['hỗ trợ', 'liên hệ', 'tư vấn', 'giúp đỡ', 'hotline', 'số điện thoại', 'chăm sóc', 'tổng đài', 'zalo', 'facebook', 'email', 'nhân viên'] },
    { intent: 'faq_store_location', keywords: ['địa chỉ', 'cửa hàng ở đâu', 'shop ở đâu', 'vị trí', 'địa điểm'] },
    { intent: 'faq_payment_methods', keywords: ['thanh toán', 'phương thức thanh toán', 'cách thanh toán', 'hình thức thanh toán', 'trả tiền', 'bao nhiêu hình thức thanh toán'] },
    { intent: 'faq_shipping_time', keywords: ['giao hàng', 'ship', 'vận chuyển', 'thời gian giao', 'giao trong bao lâu', 'mất bao lâu để nhận'] },
    { intent: 'faq_promotions', keywords: ['khuyến mãi', 'giảm giá', 'ưu đãi', 'có mã giảm', 'đang giảm giá', 'voucher', 'coupon', 'sale'] },
    { intent: 'faq_trending_products', keywords: ['sản phẩm mới', 'bán chạy nhất', 'phổ biến nhất', 'hot nhất', 'xu hướng', 'mới ra mắt'] },
    { intent: 'faq_shipping_fee', keywords: ['phí vận chuyển', 'phí ship', 'phí giao hàng', 'ship bao nhiêu tiền', 'tốn bao nhiêu tiền giao hàng'] },
    { intent: 'faq_membership', keywords: ['thành viên', 'khách hàng thân thiết', 'membership', 'hội viên', 'tích điểm', 'ưu đãi thành viên', 'vip', 'điểm thưởng', 'chương trình thành viên', 'quyền lợi', 'đăng ký thành viên'] },
    { intent: 'faq_certification', keywords: ['chứng nhận', 'an toàn', 'organic', 'hữu cơ', 'iso', 'gmp', 'haccp', 'certified'] },
    { intent: 'faq_origin', keywords: ['xuất xứ', 'nguồn gốc', 'sản xuất ở', 'nước nào', 'made in'] },
    { intent: 'faq_stock', keywords: ['còn hàng', 'tồn kho', 'có sẵn', 'hết hàng', 'còn không', 'còn bán không'] },
    { intent: 'faq_order', keywords: ['đặt hàng', 'mua online', 'mua qua mạng', 'order', 'cách đặt', 'cách mua'] },
    { intent: 'faq_delivery', keywords: ['giao hàng', 'ship', 'vận chuyển', 'thời gian giao', 'bao lâu nhận', 'giao trong bao lâu'] },
    { intent: 'faq_product_info', keywords: ['thông tin', 'giới thiệu', 'mô tả', 'chi tiết', 'review', 'đánh giá', 'thành phần', 'nguyên liệu', 'công dụng', 'tác dụng', 'dùng để', 'sử dụng', 'bảo quản', 'hạn sử dụng'] },
    { intent: 'faq_price', keywords: ['giá', 'bao nhiêu tiền', 'giá bao nhiêu', 'giá cả', 'đắt', 'rẻ', 'giá sản phẩm'] },
    { intent: 'faq_organic', keywords: ['hữu cơ', 'organic', 'sạch', 'an toàn', 'không hóa chất', 'không thuốc trừ sâu'] },
    { intent: 'faq_diet', keywords: ['ăn chay', 'chay', 'thuần chay', 'vegan', 'vegetarian', 'keto', 'low carb', 'không đường', 'không gluten', 'dành cho người tiểu đường', 'dành cho người ăn kiêng'] },
  ];
  for (const faq of faqIntents) {
    for (const keyword of faq.keywords) {
      if (lowerMessage.includes(keyword)) {
        console.log(`Phát hiện intent FAQ: ${faq.intent} với từ khóa: ${keyword}`);
        return faq.intent;
      }
    }
  }
  // 2. Sức khỏe
  const healthKeywords = [
    'sức khỏe', 'dinh dưỡng', 'bệnh', 'tiểu đường', 'huyết áp', 'tim mạch',
    'béo phì', 'giảm cân', 'tăng cơ', 'ăn chay', 'mang thai',
    'người già', 'người cao tuổi', 'lớn tuổi', 'trẻ em', 'dị ứng', 'không dung nạp',
    'tốt cho', 'có lợi', 'phòng bệnh', 'chữa bệnh', 'mẹ bầu', 'bà bầu',
    'thực phẩm dành cho', 'thực phẩm cho', 'đồ ăn cho', 'món ăn cho'
  ];
  for (const keyword of healthKeywords) {
    if (lowerMessage.includes(keyword)) {
      return 'health_inquiry';
    }
  }
  // 3. So sánh sản phẩm
  const compareProductsKeywords = [
    'so sánh', 'so với', 'đối chiếu', 'khác nhau', 'giống nhau', 'compare',
    'khác biệt', 'tốt hơn', 'rẻ hơn', 'đắt hơn', 'chất lượng hơn',
    'nên mua', 'nên chọn', 'lựa chọn', 'cái nào tốt hơn'
  ];
  for (const keyword of compareProductsKeywords) {
    if (lowerMessage.includes(keyword)) {
      return 'compare_products';
    }
  }
  // 4. Tìm kiếm sản phẩm
  const productSearchKeywords = [
    'tìm', 'mua', 'sản phẩm', 'hàng', 'bán', 'đặt', 'order', 'mua hàng',
    'mua sắm', 'shopping', 'giỏ hàng', 'cart', 'checkout', 'thanh toán',
    'product', 'item', 'hàng hóa', 'mặt hàng', 'có bán', 'đồ', 'đồ dùng'
  ];
  for (const keyword of productSearchKeywords) {
    if (lowerMessage.includes(keyword)) {
      return 'product_search';
    }
  }
  // 5. Mặc định
  return 'general_inquiry';
}

/**
 * Trích xuất entity từ câu hỏi của người dùng
 * @param {string} message - Tin nhắn của người dùng
 * @returns {object} - Các entity đã nhận diện
 */
function extractEntities(message) {
  const lowerMessage = message.toLowerCase();
  // Loại sản phẩm
  const productTypes = ['rau', 'củ', 'quả', 'sữa', 'thịt', 'cá', 'hải sản', 'bánh', 'kẹo', 'gạo', 'ngũ cốc', 'nước', 'đồ uống', 'gia vị', 'dầu ăn', 'nước mắm', 'nước tương', 'mì', 'bún', 'phở', 'trứng', 'đậu', 'hạt', 'bơ', 'phô mai', 'sữa chua', 'trà', 'cà phê'];
  const healthNeeds = ['tiểu đường', 'giảm cân', 'tăng cân', 'ăn chay', 'dinh dưỡng', 'huyết áp', 'tim mạch', 'béo phì', 'mang thai', 'người già', 'trẻ em', 'dị ứng', 'không dung nạp', 'tốt cho', 'có lợi', 'phòng bệnh', 'chữa bệnh', 'mẹ bầu', 'bà bầu'];
  const productAttributes = ['hữu cơ', 'organic', 'ít đường', 'nhiều xơ', 'giàu protein', 'ít béo', 'không đường', 'không gluten', 'low sugar', 'high fiber', 'gluten free', 'diabetes friendly', 'keto', 'vegan', 'vegetarian', 'chay', 'thuần chay'];
  const promoKeywords = ['khuyến mãi', 'giảm giá', 'ưu đãi', 'sale', 'voucher', 'coupon', 'mã giảm'];
  const originKeywords = ['xuất xứ', 'nguồn gốc', 'sản xuất ở', 'nước nào', 'made in'];
  const certificationKeywords = ['chứng nhận', 'an toàn', 'hữu cơ', 'organic', 'iso', 'gmp', 'haccp', 'certified'];

  // Tìm entity
  const entities = {
    productTypes: productTypes.filter(type => lowerMessage.includes(type)),
    healthNeeds: healthNeeds.filter(need => lowerMessage.includes(need)),
    productAttributes: productAttributes.filter(attr => lowerMessage.includes(attr)),
    promo: promoKeywords.some(k => lowerMessage.includes(k)),
    origin: originKeywords.some(k => lowerMessage.includes(k)),
    certification: certificationKeywords.some(k => lowerMessage.includes(k)),
  };
  return entities;
}
