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
// Import xử lý câu hỏi về sản phẩm
import { handleProductPageQuestion, detectHealthNeeds, findProductsForHealthNeed, generateHealthResponse } from "./chatbotProductHandler.js";
import { handleFAQQuestion } from "./chatbotFAQHandler.js";
import UserContext from "../../Model/UserContext.js";

// Load environment variables
dotenv.config();

// Cache để lưu ngữ cảnh cuộc hội thoại cho từng người dùng
const conversationContext = new Map();

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

/**
 * Lưu ngữ cảnh cuộc hội thoại
 * @param {string} userId - ID người dùng
 * @param {object} context - Dữ liệu ngữ cảnh
 */
export const saveContext = (userId, context) => {
  if (!userId) return;
  
  // Lấy ngữ cảnh hiện tại hoặc tạo mới nếu không có
  const currentContext = conversationContext.get(userId) || {
    createdAt: Date.now(),
  };
  
  // Cập nhật ngữ cảnh
  conversationContext.set(userId, {
    ...currentContext,
    ...context,
    updatedAt: Date.now(),
  });
  
  console.log(`Đã lưu ngữ cảnh cho user ${userId}:`, JSON.stringify(context));
};

/**
 * Lấy ngữ cảnh cuộc hội thoại
 * @param {string} userId - ID người dùng
 * @returns {object|null} - Dữ liệu ngữ cảnh hoặc null nếu không có/hết hạn
 */
export const getContext = (userId) => {
  if (!userId) return null;
  
  const context = conversationContext.get(userId);
  if (!context) return null;
  
  // Kiểm tra xem ngữ cảnh có hết hạn chưa
  const now = Date.now();
  if (now - context.updatedAt > CONTEXT_EXPIRY_TIME) {
    // Nếu hết hạn, xóa ngữ cảnh và trả về null
    conversationContext.delete(userId);
    return null;
  }
  
  return context;
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
    const { message, userId, productId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin tin nhắn",
      });
    }
    
    console.log(`Nhận tin nhắn từ user ${userId || 'anonymous'}: "${message}"`);
    
    // Lấy ngữ cảnh hiện tại của người dùng (nếu có)
    const context = getContext(userId);
    console.log("Ngữ cảnh hiện tại:", context);
    
    // Kiểm tra xem có phải câu hỏi về sức khỏe không
    const healthNeeds = detectHealthNeeds(message);
    if (healthNeeds && healthNeeds.length > 0) {
      console.log("Phát hiện câu hỏi về sức khỏe:", healthNeeds);
      
      const primaryNeed = healthNeeds[0].need;
      const products = await findProductsForHealthNeed(primaryNeed);
      const healthResponse = generateHealthResponse(primaryNeed, products);
      
      // Lưu ngữ cảnh để sử dụng sau này
      if (userId) {
        saveContext(userId, {
          lastHealthNeed: primaryNeed,
          lastHealthProducts: products.map(p => p._id)
        });
      }
      
      // Kiểm tra nếu healthResponse là object với type 'healthProducts'
      if (typeof healthResponse === 'object' && healthResponse.type === 'healthProducts') {
        return res.json({
          success: true,
          message: healthResponse.text,
          products: healthResponse.products,
          title: healthResponse.title,
          type: healthResponse.type
        });
      } else {
        return res.json({
          success: true,
          message: healthResponse,
          type: 'text'
        });
      }
    }
    
    // Kiểm tra xem có phải câu hỏi liên quan đến nhu cầu sức khỏe trước đó
    if (context && context.lastHealthNeed && 
        (message.toLowerCase().includes("sản phẩm") || 
         message.toLowerCase().includes("món ăn") ||
         message.toLowerCase().includes("như trên") ||
         message.toLowerCase().includes("cửa hàng có") ||
         message.toLowerCase().includes("mua ở đâu"))) {
      console.log(`Phát hiện câu hỏi liên quan đến nhu cầu sức khỏe trước đó: ${context.lastHealthNeed}`);
      
      // Tìm sản phẩm liên quan đến nhu cầu sức khỏe trước đó
      // Import động các hàm cần thiết
      const chatbotProductHandler = await import("./chatbotProductHandler.js");
      const products = await chatbotProductHandler.findProductsForHealthNeed(context.lastHealthNeed);
      
      if (products && products.length > 0) {
        // Tạo danh sách sản phẩm để hiển thị
        let responseMsg = `Dựa vào nhu cầu sức khỏe của bạn, chúng tôi có các sản phẩm sau phù hợp:\n\n`;
        
        // Phân loại sản phẩm theo danh mục
        const categorizedProducts = {};
        products.forEach(product => {
          const category = product.productCategory || "Khác";
          if (!categorizedProducts[category]) {
            categorizedProducts[category] = [];
          }
          categorizedProducts[category].push(product);
        });
        
        // Hiển thị sản phẩm theo từng danh mục
        for (const [category, categoryProducts] of Object.entries(categorizedProducts)) {
          responseMsg += `**${category}:**\n`;
          categoryProducts.forEach((product, index) => {
            responseMsg += `${index + 1}. ${product.productName} - ${formatCurrency(product.productPrice)}đ\n`;
          });
          responseMsg += "\n";
        }
        
        responseMsg += "Bạn có thể nhấn vào tên sản phẩm để xem chi tiết.";
        
        return res.json({
          success: true,
          message: responseMsg,
          type: "text",
          intent: `health_products_${context.lastHealthNeed}`,
          products: products.slice(0, 8).map(p => ({
            id: p._id,
            name: p.productName,
            price: p.productPrice,
            image: p.productImages && p.productImages.length > 0 ? p.productImages[0] : null
          }))
        });
      } else {
        return res.json({
          success: true,
          message: `Hiện tại cửa hàng chưa có sản phẩm cụ thể phù hợp với nhu cầu sức khỏe của bạn. Vui lòng tham khảo các loại thực phẩm đã gợi ý trước đó hoặc liên hệ nhân viên tư vấn để được hỗ trợ thêm.`,
          type: "text",
          intent: `no_health_products_${context.lastHealthNeed}`
        });
      }
    }
    
    // Kiểm tra xem có phải câu hỏi về đơn hàng không
    const orderPattern = /đơn hàng|đơn của tôi|theo dõi đơn|trạng thái đơn|hủy đơn|đổi hàng|trả hàng|vận chuyển|giao hàng|order|tracking/i;
    if (orderPattern.test(message)) {
      return res.json({
          success: true,
        message: "Để kiểm tra thông tin đơn hàng, vui lòng đăng nhập và truy cập mục 'Đơn hàng của tôi' trong tài khoản của bạn. Bạn cũng có thể liên hệ với bộ phận Chăm sóc khách hàng theo số hotline 1800-xxxx để được hỗ trợ.",
            type: "text",
        intent: "order_info",
      });
    }
    
    // Kiểm tra xem có phải câu hỏi về chế độ ăn không
    const dietPattern = /ăn kiêng|chế độ ăn|dinh dưỡng|calories|calo|ăn chay|thuần chay|keto|low carb|giảm cân|tăng cân|tăng cơ|bầu|mang thai/i;
    if (dietPattern.test(message)) {
      const dietResponse = await handleDietQuestion(message, productId);
      return res.json(dietResponse);
    }
    
    // Kiểm tra xem có phải câu hỏi về rau củ quả/trái cây không
    const fruitVegPattern = /trái cây|rau củ|rau xanh|hoa quả|quả|rau|củ|trái/i;
    const recommendPattern = /nên|tư vấn|gợi ý|phù hợp|thích hợp|tốt|khuyên|chọn/i;
    
    // Kiểm tra xem có phải câu hỏi về việc nên mua trái cây nào dựa vào nhu cầu sức khỏe
    if ((fruitVegPattern.test(message) && recommendPattern.test(message)) || 
        (message.toLowerCase().includes("nên mua trái cây nào")) || 
        (message.toLowerCase().includes("trái cây nào") && message.toLowerCase().includes("nên mua")) ||
        (message.toLowerCase().includes("loại trái cây") && message.toLowerCase().includes("nên"))) {
      
      console.log("Phát hiện câu hỏi về việc nên mua trái cây nào");
      
      // Kiểm tra xem có ngữ cảnh sức khỏe trước đó không
      if (context && context.lastHealthNeed) {
        console.log(`Tìm trái cây phù hợp với nhu cầu sức khỏe: ${context.lastHealthNeed}`);
        
        // Lọc các loại trái cây phù hợp với nhu cầu sức khỏe
        const healthNeed = context.lastHealthNeed;
        
        // Danh sách từ khóa sức khỏe cho từng loại trái cây
        const fruitHealthBenefits = {
          tieuDuong: {
            goodFruits: ["táo xanh", "táo", "dâu tây", "việt quất", "quả mọng", "chanh", "bưởi", "cam", "quýt", "lê"],
            benefits: "có chỉ số đường huyết thấp hoặc trung bình, giàu chất xơ và chất chống oxy hóa",
            avoid: ["nho ngọt", "xoài chín", "dứa", "chuối chín"]
          },
          huyetAp: {
            goodFruits: ["chuối", "cam", "kiwi", "lê", "dâu tây", "việt quất", "dưa hấu", "thanh long"],
            benefits: "giàu kali, magie và chất chống oxy hóa giúp điều hòa huyết áp",
            avoid: ["cam thảo", "trái cây ngâm muối"]
          },
          giamCan: {
            goodFruits: ["táo", "dâu tây", "cam", "quýt", "bưởi", "chanh", "dưa hấu", "dưa lưới"],
            benefits: "ít calo, giàu chất xơ, giúp tạo cảm giác no lâu",
            avoid: ["xoài chín", "sầu riêng", "chuối", "mít"]
          },
          duong: {
            goodFruits: ["táo xanh", "táo", "dâu tây", "việt quất", "chanh", "bưởi", "cam", "quýt", "lê"],
            benefits: "ít đường tự nhiên hoặc có chỉ số đường huyết thấp",
            avoid: ["nho ngọt", "xoài chín", "dứa", "chuối chín"]
          }
        };
        
        try {
          // Tìm sản phẩm từ danh mục trái cây trong cửa hàng
          const fruitProducts = await Product.find({
            productCategory: { $regex: "trái cây", $options: "i" },
            productStatus: { $ne: "Hết hàng" }
          }).limit(15);
          
          if (fruitProducts && fruitProducts.length > 0) {
            // Lọc và xếp hạng trái cây phù hợp với nhu cầu sức khỏe
            const ratedFruits = [];
            
            // Nếu có thông tin về nhu cầu sức khỏe, xếp hạng trái cây
            if (fruitHealthBenefits[healthNeed]) {
              const healthInfo = fruitHealthBenefits[healthNeed];
              
              // Kiểm tra từng sản phẩm và cho điểm phù hợp
              fruitProducts.forEach(product => {
                const productName = product.productName.toLowerCase();
                let score = 0;
                let isRecommended = false;
                let isAvoided = false;
                
                // Kiểm tra xem sản phẩm có thuộc danh sách nên dùng không
                healthInfo.goodFruits.forEach(goodFruit => {
                  if (productName.includes(goodFruit.toLowerCase())) {
                    score += 5;
                    isRecommended = true;
                  }
                });
                
                // Kiểm tra xem sản phẩm có thuộc danh sách nên tránh không
                if (healthInfo.avoid) {
                  healthInfo.avoid.forEach(badFruit => {
                    if (productName.includes(badFruit.toLowerCase())) {
                      score -= 5;
                      isAvoided = true;
                    }
                  });
                }
                
                // Chỉ thêm vào danh sách nếu không thuộc danh sách tránh
                if (!isAvoided || isRecommended) {
                  ratedFruits.push({
                    product,
                    score,
                    isRecommended,
                    isAvoided
                  });
                }
              });
              
              // Sắp xếp theo điểm giảm dần
              ratedFruits.sort((a, b) => b.score - a.score);
              
              // Tạo câu trả lời
              let responseMsg = `Dựa vào nhu cầu sức khỏe của bạn (${healthNeed === 'tieuDuong' ? 'tiểu đường' : 
                              healthNeed === 'huyetAp' ? 'huyết áp' : 
                              healthNeed === 'giamCan' ? 'giảm cân' : 
                              healthNeed === 'duong' ? 'giảm đường' : healthNeed}), tôi đề xuất các loại trái cây sau:\n\n`;
              
              // Đề xuất trái cây phù hợp
              const recommendedFruits = ratedFruits.filter(item => item.isRecommended);
              if (recommendedFruits.length > 0) {
                responseMsg += `**Trái cây phù hợp nhất:**\n`;
                recommendedFruits.forEach((item, index) => {
                  responseMsg += `${index + 1}. ${item.product.productName} - ${formatCurrency(item.product.productPrice)}đ\n`;
                });
                responseMsg += `\nCác loại trái cây này ${healthInfo.benefits}.\n\n`;
              }
              
              // Liệt kê các loại trái cây khác
              const otherFruits = ratedFruits.filter(item => !item.isRecommended && !item.isAvoided);
              if (otherFruits.length > 0) {
                responseMsg += `**Các loại trái cây khác trong cửa hàng:**\n`;
                otherFruits.slice(0, 5).forEach((item, index) => {
                  responseMsg += `${index + 1}. ${item.product.productName} - ${formatCurrency(item.product.productPrice)}đ\n`;
                });
              }
              
              // Danh sách trái cây nên tránh
              if (healthInfo.avoid && healthInfo.avoid.length > 0) {
                responseMsg += `\n**Lưu ý:** Nên hạn chế các loại trái cây có hàm lượng đường cao như ${healthInfo.avoid.join(', ')}.\n`;
              }
              
              // Thêm kết luận rõ ràng
              responseMsg += `\n**Kết luận:** `;
              
              if (recommendedFruits.length > 0) {
                const topFruit = recommendedFruits[0];
                
                if (healthNeed === 'tieuDuong') {
                  responseMsg += `Bạn nên chọn **${topFruit.product.productName}** vì đây là lựa chọn tốt nhất cho người tiểu đường với chỉ số đường huyết thấp, giàu chất xơ và ít ngọt. `;
                  if (recommendedFruits.length > 1) {
                    responseMsg += `Ngoài ra, ${recommendedFruits[1].product.productName} cũng là lựa chọn tốt.`;
                  }
                } else if (healthNeed === 'huyetAp') {
                  responseMsg += `Bạn nên chọn **${topFruit.product.productName}** vì đây là lựa chọn tốt nhất cho người huyết áp với hàm lượng kali cao, giúp điều hòa huyết áp. `;
                  if (recommendedFruits.length > 1) {
                    responseMsg += `Ngoài ra, ${recommendedFruits[1].product.productName} cũng là lựa chọn tốt.`;
                  }
                } else if (healthNeed === 'giamCan') {
                  responseMsg += `Bạn nên chọn **${topFruit.product.productName}** vì đây là lựa chọn tốt nhất cho người giảm cân với hàm lượng calo thấp, giàu chất xơ và tạo cảm giác no lâu. `;
                  if (recommendedFruits.length > 1) {
                    responseMsg += `Ngoài ra, ${recommendedFruits[1].product.productName} cũng là lựa chọn tốt.`;
                  }
        } else {
                  responseMsg += `Bạn nên chọn **${topFruit.product.productName}** vì đây là lựa chọn tốt nhất phù hợp với nhu cầu sức khỏe của bạn. `;
                  if (recommendedFruits.length > 1) {
                    responseMsg += `Ngoài ra, ${recommendedFruits[1].product.productName} cũng là lựa chọn tốt.`;
                  }
                }
              } else {
                responseMsg += `Hiện tại cửa hàng chưa có loại trái cây nào đặc biệt phù hợp với nhu cầu sức khỏe của bạn. Bạn nên tham khảo các loại thực phẩm đã gợi ý trước đó.`;
              }
              
              // Lưu ngữ cảnh
        if (userId) {
          saveContext(userId, { 
                  ...context,
                  lastSearch: message,
                  lastProducts: recommendedFruits.length > 0 ? recommendedFruits.map(item => item.product) : fruitProducts,
                  lastProductType: "trái cây phù hợp sức khỏe"
                });
              }
              
              return res.json({
          success: true,
                message: responseMsg,
          type: "text",
                intent: `health_fruit_recommendation_${healthNeed}`,
                products: recommendedFruits.length > 0 
                  ? recommendedFruits.slice(0, 8).map(item => ({
                      id: item.product._id,
                      name: item.product.productName,
                      price: item.product.productPrice,
                      image: item.product.productImages && item.product.productImages.length > 0 ? item.product.productImages[0] : null
                    }))
                  : []
              });
            }
          }
        } catch (error) {
          console.error("Lỗi khi tìm trái cây phù hợp với nhu cầu sức khỏe:", error);
        }
      }
    }
    
    // Kiểm tra xem có phải câu hỏi về rau củ quả/trái cây thông thường
    if (fruitVegPattern.test(message) && 
        (/có|bán|cửa hàng|shop|đâu|nào|loại|gì|những/i.test(message))) {
      try {
        console.log("Phát hiện câu hỏi về rau củ quả/trái cây");
        
        // Kiểm tra ngữ cảnh sức khỏe trước đó
        if (context && context.lastHealthNeed) {
          console.log(`Tìm trái cây phù hợp với nhu cầu sức khỏe: ${context.lastHealthNeed}`);
          
          // Lọc các loại trái cây phù hợp với nhu cầu sức khỏe
          const healthNeed = context.lastHealthNeed;
          
          // Danh sách từ khóa sức khỏe cho từng loại trái cây
          const fruitHealthBenefits = {
            tieuDuong: {
              goodFruits: ["táo xanh", "táo", "dâu tây", "việt quất", "quả mọng", "chanh", "bưởi", "cam", "quýt", "lê"],
              benefits: "có chỉ số đường huyết thấp hoặc trung bình, giàu chất xơ và chất chống oxy hóa",
              avoid: ["nho ngọt", "xoài chín", "dứa", "chuối chín"]
            },
            huyetAp: {
              goodFruits: ["chuối", "cam", "kiwi", "lê", "dâu tây", "việt quất", "dưa hấu", "thanh long"],
              benefits: "giàu kali, magie và chất chống oxy hóa giúp điều hòa huyết áp",
              avoid: ["cam thảo", "trái cây ngâm muối"]
            },
            giamCan: {
              goodFruits: ["táo", "dâu tây", "cam", "quýt", "bưởi", "chanh", "dưa hấu", "dưa lưới"],
              benefits: "ít calo, giàu chất xơ, giúp tạo cảm giác no lâu",
              avoid: ["xoài chín", "sầu riêng", "chuối", "mít"]
            },
            duong: {
              goodFruits: ["táo xanh", "táo", "dâu tây", "việt quất", "chanh", "bưởi", "cam", "quýt", "lê"],
              benefits: "ít đường tự nhiên hoặc có chỉ số đường huyết thấp",
              avoid: ["nho ngọt", "xoài chín", "dứa", "chuối chín"]
            }
          };
          
          // Tìm sản phẩm từ danh mục trái cây trong cửa hàng
          const fruitProducts = await Product.find({
            productCategory: { $regex: "trái cây", $options: "i" },
            productStatus: { $ne: "Hết hàng" }
          }).limit(15);
          
          if (fruitProducts && fruitProducts.length > 0) {
            // Lọc và xếp hạng trái cây phù hợp với nhu cầu sức khỏe
            const ratedFruits = [];
            
            // Nếu có thông tin về nhu cầu sức khỏe, xếp hạng trái cây
            if (fruitHealthBenefits[healthNeed]) {
              const healthInfo = fruitHealthBenefits[healthNeed];
              
              // Kiểm tra từng sản phẩm và cho điểm phù hợp
              fruitProducts.forEach(product => {
                const productName = product.productName.toLowerCase();
                let score = 0;
                let isRecommended = false;
                let isAvoided = false;
                
                // Kiểm tra xem sản phẩm có thuộc danh sách nên dùng không
                healthInfo.goodFruits.forEach(goodFruit => {
                  if (productName.includes(goodFruit.toLowerCase())) {
                    score += 5;
                    isRecommended = true;
                  }
                });
                
                // Kiểm tra xem sản phẩm có thuộc danh sách nên tránh không
                if (healthInfo.avoid) {
                  healthInfo.avoid.forEach(badFruit => {
                    if (productName.includes(badFruit.toLowerCase())) {
                      score -= 5;
                      isAvoided = true;
                    }
                  });
                }
                
                // Chỉ thêm vào danh sách nếu không thuộc danh sách tránh
                if (!isAvoided || isRecommended) {
                  ratedFruits.push({
                    product,
                    score,
                    isRecommended,
                    isAvoided
                  });
                }
              });
              
              // Sắp xếp theo điểm giảm dần
              ratedFruits.sort((a, b) => b.score - a.score);
              
              // Tạo câu trả lời
              let responseMsg = `Dựa vào nhu cầu sức khỏe của bạn (${healthNeed === 'tieuDuong' ? 'tiểu đường' : 
                                healthNeed === 'huyetAp' ? 'huyết áp' : 
                                healthNeed === 'giamCan' ? 'giảm cân' : 
                                healthNeed === 'duong' ? 'giảm đường' : healthNeed}), tôi đề xuất các loại trái cây sau:\n\n`;
              
              // Đề xuất trái cây phù hợp
              const recommendedFruits = ratedFruits.filter(item => item.isRecommended);
              if (recommendedFruits.length > 0) {
                responseMsg += `**Trái cây phù hợp nhất:**\n`;
                recommendedFruits.forEach((item, index) => {
                  responseMsg += `${index + 1}. ${item.product.productName} - ${formatCurrency(item.product.productPrice)}đ\n`;
                });
                responseMsg += `\nCác loại trái cây này ${healthInfo.benefits}.\n\n`;
              }
              
              // Liệt kê các loại trái cây khác
              const otherFruits = ratedFruits.filter(item => !item.isRecommended && !item.isAvoided);
              if (otherFruits.length > 0) {
                responseMsg += `**Các loại trái cây khác trong cửa hàng:**\n`;
                otherFruits.slice(0, 5).forEach((item, index) => {
                  responseMsg += `${index + 1}. ${item.product.productName} - ${formatCurrency(item.product.productPrice)}đ\n`;
                });
              }
              
              // Danh sách trái cây nên tránh
              if (healthInfo.avoid && healthInfo.avoid.length > 0) {
                responseMsg += `\n**Lưu ý:** Nên hạn chế các loại trái cây có hàm lượng đường cao như ${healthInfo.avoid.join(', ')}.\n`;
              }
              
              // Thêm kết luận rõ ràng
              responseMsg += `\n**Kết luận:** `;
              
              if (recommendedFruits.length > 0) {
                const topFruit = recommendedFruits[0];
                
                if (healthNeed === 'tieuDuong') {
                  responseMsg += `Bạn nên chọn **${topFruit.product.productName}** vì đây là lựa chọn tốt nhất cho người tiểu đường với chỉ số đường huyết thấp, giàu chất xơ và ít ngọt. `;
                  if (recommendedFruits.length > 1) {
                    responseMsg += `Ngoài ra, ${recommendedFruits[1].product.productName} cũng là lựa chọn tốt.`;
                  }
                } else if (healthNeed === 'huyetAp') {
                  responseMsg += `Bạn nên chọn **${topFruit.product.productName}** vì đây là lựa chọn tốt nhất cho người huyết áp với hàm lượng kali cao, giúp điều hòa huyết áp. `;
                  if (recommendedFruits.length > 1) {
                    responseMsg += `Ngoài ra, ${recommendedFruits[1].product.productName} cũng là lựa chọn tốt.`;
                  }
                } else if (healthNeed === 'giamCan') {
                  responseMsg += `Bạn nên chọn **${topFruit.product.productName}** vì đây là lựa chọn tốt nhất cho người giảm cân với hàm lượng calo thấp, giàu chất xơ và tạo cảm giác no lâu. `;
                  if (recommendedFruits.length > 1) {
                    responseMsg += `Ngoài ra, ${recommendedFruits[1].product.productName} cũng là lựa chọn tốt.`;
                  }
                } else {
                  responseMsg += `Bạn nên chọn **${topFruit.product.productName}** vì đây là lựa chọn tốt nhất phù hợp với nhu cầu sức khỏe của bạn. `;
                  if (recommendedFruits.length > 1) {
                    responseMsg += `Ngoài ra, ${recommendedFruits[1].product.productName} cũng là lựa chọn tốt.`;
                  }
                }
              } else {
                responseMsg += `Hiện tại cửa hàng chưa có loại trái cây nào đặc biệt phù hợp với nhu cầu sức khỏe của bạn. Bạn nên tham khảo các loại thực phẩm đã gợi ý trước đó.`;
              }
              
              // Lưu ngữ cảnh
              if (userId) {
          saveContext(userId, {
                  ...context,
                  lastSearch: message,
                  lastProducts: recommendedFruits.length > 0 ? recommendedFruits.map(item => item.product) : fruitProducts,
                  lastProductType: "trái cây phù hợp sức khỏe"
                });
              }
              
              return res.json({
            success: true,
                message: responseMsg,
            type: "text",
                intent: `health_fruit_recommendation_${healthNeed}`,
                products: recommendedFruits.length > 0 
                  ? recommendedFruits.slice(0, 8).map(item => ({
                      id: item.product._id,
                      name: item.product.productName,
                      price: item.product.productPrice,
                      image: item.product.productImages && item.product.productImages.length > 0 ? item.product.productImages[0] : null
                    }))
                  : []
              });
            }
          }
        }
        
        // Nếu không có ngữ cảnh sức khỏe hoặc không có trái cây phù hợp, hiển thị tất cả trái cây
        const fruitVegProducts = await Product.find({
          $or: [
            { productCategory: { $regex: "rau|củ|quả|trái cây", $options: "i" } },
            { productName: { $regex: "rau|củ|quả|trái cây", $options: "i" } }
          ],
          productStatus: { $ne: "Hết hàng" }
        }).limit(10);
        
        if (fruitVegProducts && fruitVegProducts.length > 0) {
          // Phân loại sản phẩm
          const categorizedProducts = {};
          fruitVegProducts.forEach(product => {
            const category = product.productCategory || "Khác";
            if (!categorizedProducts[category]) {
              categorizedProducts[category] = [];
            }
            categorizedProducts[category].push(product);
          });
          
          // Tạo câu trả lời
          let responseMsg = "🍎 **Cửa hàng có các loại rau củ quả sau:**\n\n";
          
          // Hiển thị sản phẩm theo từng danh mục
          for (const [category, products] of Object.entries(categorizedProducts)) {
            responseMsg += `**${category}:**\n`;
            products.forEach((product, index) => {
              responseMsg += `${index + 1}. ${product.productName} - ${formatCurrency(product.productPrice)}đ\n`;
            });
            responseMsg += "\n";
          }
          
          // Lưu ngữ cảnh
            if (userId) {
              saveContext(userId, {
              lastSearch: message,
              lastProducts: fruitVegProducts,
              lastProductType: "rau củ quả"
              });
            }
            
          return res.json({
              success: true,
            message: responseMsg,
              type: "text",
            intent: "fruit_veg_search",
            products: fruitVegProducts.slice(0, 8).map(p => ({
              id: p._id,
              name: p.productName,
              price: p.productPrice,
              image: p.productImages && p.productImages.length > 0 ? p.productImages[0] : null
            }))
          });
        } else {
          return res.json({
            success: true,
            message: "Hiện tại cửa hàng chưa có sản phẩm rau củ quả nào. Chúng tôi sẽ cập nhật thêm sản phẩm trong thời gian tới.",
            type: "text",
            intent: "no_fruit_veg"
          });
        }
        } catch (error) {
        console.error("Lỗi khi tìm sản phẩm rau củ quả:", error);
      }
    }
    
    // Kiểm tra xem có phải câu hỏi về nấu ăn không
    if (isCookingQuestion(message)) {
      // Xử lý câu hỏi về nấu ăn
      const cookingResponse = await handleCookingQuestion(message);
      
      // Trích xuất nguyên liệu từ công thức
      const ingredients = extractIngredientsFromRecipe(cookingResponse.message);
      
      // Lưu ngữ cảnh về công thức và nguyên liệu
      if (userId && ingredients.length > 0) {
              saveContext(userId, { 
          lastRecipe: cookingResponse.message,
          lastIngredients: ingredients,
        });
      }
      
      return res.json(cookingResponse);
    }
    
    // Kiểm tra xem có phải câu hỏi về sản phẩm không
    if (productId) {
      // Nếu có ID sản phẩm, xử lý câu hỏi liên quan đến sản phẩm cụ thể
      const productResponse = await handleProductPageQuestion(message, productId, userId);
      return res.json(productResponse);
    }
    
    // Kiểm tra xem có phải câu hỏi thường gặp không
    const faqIntent = detectFAQIntent(message);
    if (faqIntent) {
      const faqResponse = await handleFAQQuestion(message, faqIntent);
      return res.json(faqResponse);
    }
    
    // Kiểm tra xem có phải câu hỏi phụ thuộc vào ngữ cảnh không
    const contextQuery = checkContextDependentQuery(message);
    if (contextQuery && context) {
      // Xử lý câu hỏi phụ thuộc vào ngữ cảnh
      const contextResponse = await generateContextResponse(message, context);
      return res.json(contextResponse);
    }
    
    // Kiểm tra xem có phải câu hỏi về so sánh sản phẩm không
    if (isComparisonRequest(message)) {
      // Chuyển hướng xử lý sang API so sánh sản phẩm
      return processMessage(req, res);
    }
    
    // Kiểm tra xem có phải câu hỏi tìm kiếm nhiều sản phẩm không
    const multiProductQueries = detectMultiProductSearch(message);
    if (multiProductQueries && multiProductQueries.length > 0) {
      const multiProductResponse = await handleMultiProductSearch(multiProductQueries);
      return res.json(multiProductResponse);
    }
    
    // Phát hiện ý định chung của người dùng
    const intent = detectIntent(message);
    console.log("Phát hiện ý định:", intent);
    
    // Xử lý theo ý định
    switch (intent) {
      case "greeting":
        return res.json({
          success: true,
          message: "Xin chào! Tôi là trợ lý ảo của cửa hàng thực phẩm sạch. Tôi có thể giúp bạn tìm kiếm sản phẩm, giới thiệu công thức nấu ăn, tư vấn dinh dưỡng hoặc trả lời các câu hỏi về cửa hàng. Bạn cần hỗ trợ gì?",
          type: "text",
          intent: "greeting",
        });
        
      case "product_search":
        // Tìm kiếm sản phẩm
        const searchResults = await searchProductsMongoDB(message);
        
        if (searchResults.success && searchResults.products.length > 0) {
          // Lưu ngữ cảnh tìm kiếm
            if (userId) {
              saveContext(userId, { 
              lastSearch: message,
              lastSearchResults: searchResults.products.map(p => p._id),
            });
          }
          
          return res.json(searchResults);
        }
        break;
        
      case "product_availability":
        // Kiểm tra tình trạng sản phẩm
        const productQuery = checkProductAvailabilityQuestion(message);
        if (productQuery) {
          const availabilityResults = await searchProductsMongoDB(productQuery);
          
          if (availabilityResults.success && availabilityResults.products.length > 0) {
            const product = availabilityResults.products[0];
            const isAvailable = product.productStatus !== "Hết hàng";
            
            return res.json({
            success: true,
              message: isAvailable
                ? `Sản phẩm "${product.productName}" hiện đang có sẵn với giá ${formatCurrency(product.productPrice)}. Bạn có thể đặt hàng ngay bây giờ.`
                : `Rất tiếc, sản phẩm "${product.productName}" hiện đang hết hàng. Bạn có thể đăng ký nhận thông báo khi có hàng trở lại hoặc xem các sản phẩm tương tự.`,
            type: "text",
              intent: "product_availability",
              products: [product],
            });
          }
        }
        break;
      
      default:
        // Xử lý mặc định - chuyển hướng sang API xử lý tin nhắn chung
        return processMessage(req, res);
    }
    
    // Nếu không tìm thấy kết quả phù hợp
    return res.json({
              success: true,
      message: "Tôi không tìm thấy thông tin phù hợp với câu hỏi của bạn. Vui lòng hỏi rõ hơn hoặc thử lại sau.",
              type: "text",
    });
    
  } catch (error) {
    console.error("Lỗi khi xử lý tin nhắn:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xử lý tin nhắn của bạn. Vui lòng thử lại sau.",
    });
  }
};

/**
 * Hàm xử lý webhook từ Rasa
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} - JSON response
 */
export const handleRasaWebhook = async (req, res) => {
  try {
    console.log("Nhận webhook từ Rasa:", req.body);
    
    // Xử lý dữ liệu từ Rasa
    const rasaResponse = req.body;
    
    // Trả về phản hồi
    return res.status(200).json({
      success: true,
      message: "Webhook received successfully",
      data: rasaResponse,
    });
  } catch (error) {
    console.error("Lỗi khi xử lý webhook từ Rasa:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing the webhook",
    });
  }
};

/**
 * Tìm kiếm sản phẩm trực tiếp bằng MongoDB
 * @param {string} query - Câu truy vấn tìm kiếm
 * @returns {Array} - Danh sách sản phẩm
 */
const searchProductsMongoDB = async (query) => {
  try {
    console.log("Đang tìm kiếm sản phẩm với query:", query);
    
    // Xử lý query để tìm từ khóa quan trọng
    const lowerQuery = query.toLowerCase();
    
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
    
    // Kiểm tra xem có cụm từ "nước giặt" không
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
            { description: { $regex: item.phrase, $options: "i" } },
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
      
      let foundCategory = false;
      for (const item of categoryKeywords) {
        if (item.keywords.some((keyword) => lowerQuery.includes(keyword))) {
          conditions.push({ category: item.category });
          console.log("Tìm sản phẩm thuộc danh mục:", item.category);
          foundCategory = true;
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
    
    // Xử lý đặc biệt cho trường hợp tìm kiếm "rau"
    const isVegetableSearch = keywords.some((kw) =>
      ["rau", "củ", "quả"].includes(kw)
    );
    let isSpecialCategorySearch = false;
    
    if (isVegetableSearch) {
      isSpecialCategorySearch = true;
      // Nếu chỉ toàn từ khóa liên quan đến rau củ quả, ưu tiên sử dụng danh mục thay vì tìm theo từ khóa
      if (keywords.every((kw) => ["rau", "củ", "quả", "trái"].includes(kw))) {
        console.log("Tìm tất cả sản phẩm trong danh mục Rau củ quả");
        // Xóa điều kiện tìm kiếm hiện tại nếu có
        const categoryIndex = conditions.findIndex(
          (c) => c.category === "Rau củ quả"
        );
        if (categoryIndex !== -1) {
          conditions.splice(categoryIndex, 1);
        }
        // Thêm điều kiện tìm kiếm theo danh mục
        conditions.push({ category: "Rau củ quả" });
      }
    }
    
    // Nếu đây là câu hỏi về giá, ưu tiên chỉ tìm theo giá nếu không có từ khóa đặc biệt
    if (isPriceQuery) {
      if (keywords.length === 0) {
        console.log(
          "Đây là câu hỏi tìm theo giá, chỉ tìm kiếm dựa trên điều kiện giá"
        );
      } else {
        // Tạo các điều kiện tìm kiếm theo từng từ khóa
        const keywordConditions = [];
        for (const keyword of keywords) {
          keywordConditions.push({
            productName: { $regex: keyword, $options: "i" },
          });
          keywordConditions.push({
            description: { $regex: keyword, $options: "i" },
          });
        }
        if (keywordConditions.length > 0) {
          conditions.push({ $or: keywordConditions });
          console.log("Tìm sản phẩm theo cả giá và từ khóa:", keywords);
        }
      }
    }
    // Nếu không phải câu hỏi về giá, tìm theo từ khóa thông thường
    else if (keywords.length > 0 && !isSpecialCategorySearch) {
      // Tạo các điều kiện tìm kiếm theo từng từ khóa
      const keywordConditions = [];
      for (const keyword of keywords) {
        keywordConditions.push({
          productName: { $regex: keyword, $options: "i" },
        });
        keywordConditions.push({
          description: { $regex: keyword, $options: "i" },
        });
      }
      if (keywordConditions.length > 0) {
        conditions.push({ $or: keywordConditions });
        console.log("Tìm sản phẩm theo từ khóa:", keywords);
      }
    }
    
    let filter = {};
    
    // Xây dựng filter tùy thuộc vào loại tìm kiếm
    if (isPriceQuery && keywords.length === 0) {
      // Nếu chỉ tìm theo giá, không bao gồm từ khóa
      filter = conditions.length > 0 ? { $and: conditions } : {};
    } else if (isPriceQuery && keywords.length > 0) {
      // Nếu tìm theo cả giá và từ khóa, cho phép tìm kiếm linh hoạt hơn (giá HOẶC từ khóa)
      filter = { $or: conditions };
    } else {
      // Các trường hợp tìm kiếm thông thường khác
      filter = conditions.length > 0 ? { $and: conditions } : {};
    }
    
    console.log("Filter tìm kiếm:", JSON.stringify(filter));
    
    try {
      let products = [];
      
      if (Object.keys(filter).length > 0) {
        // Truy vấn tất cả sản phẩm phù hợp với filter
        const allMatchedProducts = await Product.find(filter).limit(20);
        
        if (allMatchedProducts.length === 0) {
          // Nếu không tìm thấy sản phẩm, thử tìm chỉ với từ khóa
          if (keywords.length > 0) {
            console.log("Không tìm thấy sản phẩm, thử tìm chỉ với từ khóa");
            
            // Tạo pipeline aggregation để tính điểm phù hợp
            const aggregationPipeline = [
              {
                $match: {
                  $or: keywords.flatMap((keyword) => [
                    { productName: { $regex: keyword, $options: "i" } },
                    { description: { $regex: keyword, $options: "i" } },
                  ]),
                },
              },
              {
                $addFields: {
                  matchScore: {
                    $add: keywords
                      .map((keyword) => [
                        {
                          $cond: [
                            {
                              $regexMatch: {
                                input: "$productName",
                                regex: keyword,
                                options: "i",
                              },
                            },
                            2,
                            0,
                          ],
                        },
                        {
                          $cond: [
                            {
                              $regexMatch: {
                                input: "$description",
                                regex: keyword,
                                options: "i",
                              },
                            },
                            1,
                            0,
                          ],
                        },
                      ])
                      .flat(),
                  },
                },
              },
              {
                $sort: { matchScore: -1 },
              },
              {
                $limit: 10,
              },
            ];
            
            products = await Product.aggregate(aggregationPipeline);
            console.log(
              `Tìm thấy ${products.length} sản phẩm bằng từ khóa với điểm phù hợp`
            );
          }
          
          // Nếu vẫn không tìm thấy hoặc không có từ khóa, thử tìm theo danh mục
          if (products.length === 0 && !foundSpecificPhrase) {
            // Xử lý đặc biệt cho từ khóa "rau"
            const isVegetableQuery =
              lowerQuery.includes("rau") ||
                                    lowerQuery.includes("củ") || 
                                    lowerQuery.includes("quả");
                                    
            if (isVegetableQuery) {
              console.log("Thử tìm tất cả sản phẩm trong danh mục Rau củ quả");
              products = await Product.find({ category: "Rau củ quả" }).limit(
                10
              );
              // Nếu đã tìm thấy sản phẩm, bỏ qua việc tìm kiếm danh mục tiếp theo
              if (products.length > 0) {
                console.log(
                  `Tìm thấy ${products.length} sản phẩm trong danh mục Rau củ quả`
                );
                return products;
              }
            }
            
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
              if (
                item.keywords.some((keyword) => lowerQuery.includes(keyword))
              ) {
                console.log("Thử tìm chỉ với danh mục:", item.category);
                products = await Product.find({
                  category: item.category,
                }).limit(10);
                if (products.length > 0) break;
              }
            }
          }
        } else {
          // Nếu có kết quả, tính điểm phù hợp và sắp xếp kết quả
          products = allMatchedProducts
            .map((product) => {
            try {
              // Kiểm tra xem product có hợp lệ không
                if (!product || typeof product !== "object") {
                console.log("Bỏ qua sản phẩm không hợp lệ:", product);
                return { matchScore: -1 }; // Sẽ bị loại bỏ khi sắp xếp
              }
              
              // Chuyển đổi an toàn thành plain object
                const productObj = product.toObject
                  ? product.toObject()
                  : product;
              
              // Đảm bảo các trường văn bản tồn tại
                const nameText = (productObj.productName || "").toLowerCase();
                const descText = (productObj.description || "").toLowerCase();
              
              // Tính điểm dựa trên số từ khóa khớp
              let score = 0;
              
              // Nếu có cụm từ cụ thể, cho điểm cao hơn
              for (const { phrase } of specificPhrases) {
                if (nameText.includes(phrase)) score += 5;
                if (descText.includes(phrase)) score += 3;
              }
              
              // Tính điểm cho từng từ khóa
              for (const keyword of keywords) {
                if (nameText.includes(keyword)) score += 2;
                if (descText.includes(keyword)) score += 1;
              }
              
              // Nếu khớp chính xác với cụm từ tìm kiếm, cho điểm cao nhất
                const exactPhrase = keywords.join(" ");
              if (exactPhrase.length > 3 && nameText.includes(exactPhrase)) {
                score += 10;
              }

            return {
                ...productObj,
                  matchScore: score,
              };
            } catch (error) {
              console.error("Lỗi khi tính điểm cho sản phẩm:", error);
              return { matchScore: -1 }; // Sẽ bị loại bỏ khi sắp xếp
            }
            })
            .filter((product) => product.matchScore > -1); // Loại bỏ các sản phẩm không hợp lệ
          
          // Sắp xếp theo điểm cao nhất trước
          products.sort((a, b) => b.matchScore - a.matchScore);
          
          // Giới hạn kết quả
          products = products.slice(0, 10);
        }
      } else {
        // Nếu không có filter cụ thể, lấy sản phẩm mới nhất
        products = await Product.find().sort({ createdAt: -1 }).limit(10);
      }
      
      console.log(`Tìm thấy ${products.length} sản phẩm phù hợp`);
      return products;
    } catch (error) {
      console.error("Lỗi khi tìm kiếm sản phẩm với MongoDB:", error);
      throw error;
    }
  } catch (error) {
    console.error("Lỗi khi tìm kiếm sản phẩm với MongoDB:", error);
    throw error;
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
      const context = getContext(userId);

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

      // Kiểm tra xem có đủ sản phẩm để so sánh không
      const context = getContext(userId);

      if (
        !context ||
        !context.lastProducts ||
        context.lastProducts.length < 2
      ) {
        console.log("Không có đủ sản phẩm để so sánh trong ngữ cảnh");

        // Nếu có một sản phẩm trong ngữ cảnh, thử tìm thêm sản phẩm tương tự
        if (context && context.lastProduct) {
          try {
            console.log(
              `Tìm sản phẩm tương tự với ${context.lastProduct.productName} để so sánh`
            );
            const similarProducts = await Product.find({
              productCategory: context.lastProduct.productCategory,
              _id: { $ne: context.lastProduct._id },
            }).limit(2);

            if (similarProducts && similarProducts.length > 0) {
              // Tạo danh sách sản phẩm để so sánh
              const productsToCompare = [
                context.lastProduct,
                ...similarProducts,
              ];

              // Lưu danh sách vào ngữ cảnh
              saveContext(userId, {
                lastProducts: productsToCompare,
                lastQuery: message,
              });

              console.log(
                `Đã tìm thấy ${similarProducts.length} sản phẩm tương tự để so sánh`
              );

              // Chuyển sang xử lý so sánh
              req.body.productIds = productsToCompare.map((p) => p._id);
              return await handleProductComparison(req, res);
            }
          } catch (error) {
            console.error("Lỗi khi tìm sản phẩm tương tự:", error);
          }
        }

        return res.status(200).json({
          success: true,
          message:
            "Bạn cần chọn ít nhất 2 sản phẩm để so sánh. Vui lòng tìm kiếm và xem một số sản phẩm trước khi yêu cầu so sánh.",
        });
      }

      // Có đủ sản phẩm để so sánh, chuyển sang xử lý so sánh
      console.log(
        `Có ${context.lastProducts.length} sản phẩm trong ngữ cảnh để so sánh`
      );
      req.body.productIds = context.lastProducts.map((p) => p._id);
      return await handleProductComparison(req, res);
    }

    // Xử lý các loại tin nhắn khác...

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

  // Các mẫu câu cụ thể về so sánh - kiểm tra trước tiên
  const exactPhrases = [
    "so sánh 2 sản phẩm này",
    "so sánh hai sản phẩm này",
    "so sánh 2 sản phẩm",
    "so sánh hai sản phẩm",
    "so sánh các sản phẩm này",
    "so sánh giúp mình",
    "so sánh giúp tôi",
    "so sánh giùm",
    "so sánh 2 cái này",
    "so sánh hai cái này",
    "so sánh giùm tôi",
    "so sánh dùm",
    "so sánh hộ",
    "không thể so sánh",
    "s nó không so sánh",
    "có so sánh đâu",
    "có so sánh",
    "so sánh",
  ];

  // Kiểm tra các câu chính xác
  for (const phrase of exactPhrases) {
    if (lowerMessage.includes(phrase)) {
      console.log(`Phát hiện yêu cầu so sánh từ cụm từ chính xác: "${phrase}"`);
      return true;
    }
  }

  // Các từ khóa liên quan đến so sánh
  const comparisonKeywords = [
    "so sánh",
    "so với",
    "đối chiếu",
    "khác nhau",
    "giống nhau",
    "khác biệt",
    "giống biệt",
    "so",
    "đối",
    "compare",
    "vs",
    "versus",
    "hơn",
    "kém",
    "tốt hơn",
    "xấu hơn",
    "rẻ hơn",
    "đắt hơn",
  ];

  // Các từ khóa liên quan đến sản phẩm
  const productKeywords = [
    "sản phẩm",
    "hàng",
    "món",
    "cái",
    "thứ",
    "loại",
    "2 cái",
    "hai cái",
    "2 sản phẩm",
    "hai sản phẩm",
    "cả hai",
    "này",
    "kia",
    "đồ",
    "thực phẩm",
  ];

  // Các mẫu câu cụ thể về so sánh
  const comparisonPhrases = [
    "so sánh giúp",
    "giúp so sánh",
    "muốn so sánh",
    "cần so sánh",
    "nên chọn cái nào",
    "cái nào tốt hơn",
    "cái nào rẻ hơn",
    "cái nào đắt hơn",
    "cái nào chất lượng hơn",
  ];

  // Kiểm tra các mẫu câu cụ thể
  for (const phrase of comparisonPhrases) {
    if (lowerMessage.includes(phrase)) {
      console.log(`Phát hiện yêu cầu so sánh từ cụm từ: "${phrase}"`);
      return true;
    }
  }

  // Kiểm tra xem tin nhắn có chứa từ khóa so sánh không
  const hasComparisonKeyword = comparisonKeywords.some((keyword) =>
    lowerMessage.includes(keyword)
  );

  // Kiểm tra xem tin nhắn có chứa từ khóa sản phẩm không
  const hasProductKeyword = productKeywords.some((keyword) =>
    lowerMessage.includes(keyword)
  );

  // Nếu tin nhắn có chứa cả từ khóa so sánh và từ khóa sản phẩm, hoặc chỉ có từ khóa so sánh và ngắn
  const result =
    hasComparisonKeyword && (hasProductKeyword || lowerMessage.length < 30);

  if (result) {
    console.log(
      `Phát hiện yêu cầu so sánh từ từ khóa: comparison=${hasComparisonKeyword}, product=${hasProductKeyword}`
    );
  }

  return result;
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
