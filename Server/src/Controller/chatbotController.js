/* eslint-disable no-useless-escape */
/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

import axios from 'axios';
import Product from "../Model/Products.js";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Định nghĩa các pattern và từ khóa cho các intent
const intents = {
  price: {
    patterns: [
      "giá", "giá cả", "bao nhiêu tiền", "giá bao nhiêu", "chi phí", 
      "giá sản phẩm", "giá của sản phẩm", "giá của", "giá bao nhiêu", 
      "bao nhiêu", "giá thế nào", "giá như thế nào", "giá hiện tại"
    ],
    response: (product) => `Giá sản phẩm ${product.productName} là ${formatCurrency(product.productPrice)}`,
  },
  info: {
    patterns: [
      "thông tin", "chi tiết", "mô tả", "thế nào", "thông tin sản phẩm", 
      "thông tin chi tiết", "thông tin về", "thông tin của", "thông tin gì", 
      "cho tôi biết", "kể cho tôi", "nói cho tôi", "giới thiệu", "giới thiệu về"
    ],
    response: (product) => `${product.productName}:\n${product.productInfo}\n\nChi tiết: ${product.productDetails}`,
  },
  usage: {
    patterns: [
      "công dụng", "tác dụng", "dùng để", "dùng làm gì", "sử dụng", 
      "công dụng gì", "tác dụng gì", "dùng để làm gì", "sử dụng để làm gì", 
      "công dụng của", "tác dụng của", "dùng để làm", "sử dụng để làm", 
      "công dụng như thế nào", "tác dụng như thế nào"
    ],
    response: (product) => `Công dụng của ${product.productName}:\n${product.productInfo}`,
  },
  origin: {
    patterns: [
      "xuất xứ", "sản xuất", "nước nào", "ở đâu", "nhà sản xuất", 
      "xuất xứ từ đâu", "sản xuất ở đâu", "sản xuất tại đâu", "sản xuất bởi", 
      "nhà sản xuất nào", "công ty nào", "thương hiệu nào", "thương hiệu", 
      "xuất xứ của", "sản xuất của", "nhà sản xuất của"
    ],
    response: (product) => `Sản phẩm ${product.productName} có xuất xứ từ ${product.origin || "chưa có thông tin"}`,
  },
  ingredients: {
    patterns: [
      "thành phần", "nguyên liệu", "chứa gì", "có gì", "thành phần gì", 
      "nguyên liệu gì", "chứa những gì", "có những gì", "thành phần của", 
      "nguyên liệu của", "chứa những thành phần gì", "có những thành phần gì", 
      "thành phần như thế nào", "nguyên liệu như thế nào"
    ],
    response: (product) => `Thành phần của ${product.productName}:\n${product.ingredients || "Chưa có thông tin chi tiết về thành phần"}`,
  },
  howToUse: {
    patterns: [
      "cách dùng", "hướng dẫn", "sử dụng như thế nào", "dùng thế nào", "dùng như nào", 
      "cách sử dụng", "hướng dẫn sử dụng", "dùng như thế nào", "sử dụng thế nào", 
      "cách dùng như thế nào", "hướng dẫn dùng", "cách sử dụng như thế nào", 
      "dùng như thế nào", "sử dụng như thế nào", "cách dùng của", "hướng dẫn của"
    ],
    response: (product) => `Hướng dẫn sử dụng ${product.productName}:\n${product.howToUse || product.productDetails}`,
  },
  relatedProducts: {
    patterns: [
      "sản phẩm liên quan", "sản phẩm tương tự", "sản phẩm khác", "các sản phẩm liên quan", 
      "sản phẩm giống", "sản phẩm tương tự", "sản phẩm cùng loại", "sản phẩm cùng danh mục", 
      "sản phẩm khác trong cùng danh mục", "sản phẩm khác trong cùng loại", 
      "sản phẩm khác trong cùng nhóm", "có sản phẩm nào khác", "các nước uống liên quan",
      "nước uống liên quan", "các nước uống tương tự", "nước uống tương tự", 
      "có nước uống nào khác"
    ],
    response: async (product) => {
      try {
        // Sử dụng trường category hoặc productCategory (tùy theo schema)
        const categoryField = product.productCategory ? 'productCategory' : 'category';
        const categoryValue = product.productCategory || product.category;
        
        // Kiểm tra nếu là nước uống, tìm theo từ khóa trong tên
        let query = { _id: { $ne: product._id } };
        
        if (product.productName.toLowerCase().includes('nước') || 
            product.productName.toLowerCase().includes('pepsi') || 
            product.productName.toLowerCase().includes('cocacola') ||
            product.productName.toLowerCase().includes('strongbow')) {
          // Nếu là nước uống, tìm các sản phẩm cùng loại nước uống
          query.$or = [
            { productName: { $regex: 'nước', $options: 'i' } },
            { productName: { $regex: 'pepsi', $options: 'i' } },
            { productName: { $regex: 'coca', $options: 'i' } },
            { productName: { $regex: 'strongbow', $options: 'i' } },
            { productName: { $regex: 'chai', $options: 'i' } },
            { productName: { $regex: 'lon', $options: 'i' } },
            { productName: { $regex: 'lốc', $options: 'i' } }
          ];
        } else if (categoryValue) {
          // Sử dụng category nếu có
          query[categoryField] = categoryValue;
        } else {
          // Nếu không có category, tìm sản phẩm có tên tương tự
          const words = product.productName.split(' ').filter(word => word.length > 3);
          if (words.length > 0) {
            const regexPatterns = words.map(word => new RegExp(word, 'i'));
            query.productName = { $in: regexPatterns };
          }
        }
        
        // Tìm sản phẩm liên quan với query đã xây dựng
        const relatedProducts = await Product.find(query).limit(4);

        if (relatedProducts.length === 0) {
          // Nếu không tìm thấy sản phẩm liên quan, thử tìm bất kỳ sản phẩm nào
          const randomProducts = await Product.find({ _id: { $ne: product._id } }).limit(4);
          
          if (randomProducts.length === 0) {
            return "Hiện tại chưa có sản phẩm liên quan nào.";
          }
          
          // Tạo phản hồi với sản phẩm ngẫu nhiên
          const productElements = randomProducts.map(p => {
            const imageUrl = p.productImages && p.productImages.length > 0 
              ? p.productImages[0] 
              : "default-product.jpg";
              
            return {
              type: "product",
              id: p._id,
              name: p.productName,
              price: p.productPrice,
              image: imageUrl,
              slug: createSlug(p.productName)
            };
          });
          
          return {
            text: `Các sản phẩm khác bạn có thể quan tâm:\n\n`,
            products: productElements,
            type: "relatedProducts"
          };
        }

        // Tạo phản hồi dạng HTML với hình ảnh và link
        let responseHtml = `Các sản phẩm liên quan:\n\n`;
        
        // Thêm thẻ HTML cho các sản phẩm liên quan
        const productElements = relatedProducts.map(p => {
          // Lấy URL hình ảnh đầu tiên từ mảng productImages nếu có
          const imageUrl = p.productImages && p.productImages.length > 0 
            ? p.productImages[0] 
            : "default-product.jpg";
          
          return {
            type: "product",
            id: p._id,
            name: p.productName,
            price: p.productPrice,
            image: imageUrl,
            slug: createSlug(p.productName)
          };
        });
        
        return {
          text: responseHtml,
          products: productElements,
          type: "relatedProducts"
        };
      } catch (error) {
        return "Xin lỗi, tôi không thể tìm thấy sản phẩm liên quan lúc này.";
      }
    }
  },
  mostExpensiveProduct: {
    patterns: [
      "sản phẩm nào đắt nhất", "sản phẩm đắt nhất", "sản phẩm nào đắt nhất trong cửa hàng", 
      "sản phẩm đắt nhất trong cửa hàng", "đắt nhất", "giá cao nhất", "sản phẩm giá cao nhất"
    ],
    response: async () => {
      try {
        const mostExpensiveProduct = await Product.findOne().sort({ productPrice: -1 }).limit(1);
        if (!mostExpensiveProduct) {
          return "Hiện tại chưa có thông tin về sản phẩm đắt nhất.";
        }
        return `Sản phẩm đắt nhất hiện tại là: ${mostExpensiveProduct.productName} với giá ${formatCurrency(mostExpensiveProduct.productPrice)}`;
      } catch (error) {
        return "Xin lỗi, tôi không thể tìm thấy thông tin về sản phẩm đắt nhất lúc này.";
      }
    }
  },
  cheapestProduct: {
    patterns: [
      "sản phẩm nào rẻ nhất", "sản phẩm rẻ nhất", "sản phẩm nào rẻ nhất trong cửa hàng", 
      "sản phẩm rẻ nhất trong cửa hàng", "rẻ nhất", "giá thấp nhất", "sản phẩm giá thấp nhất"
    ],
    response: async () => {
      try {
        const cheapestProduct = await Product.findOne().sort({ productPrice: 1 }).limit(1);
        if (!cheapestProduct) {
          return "Hiện tại chưa có thông tin về sản phẩm rẻ nhất.";
        }
        return `Sản phẩm rẻ nhất hiện tại là: ${cheapestProduct.productName} với giá ${formatCurrency(cheapestProduct.productPrice)}`;
      } catch (error) {
        return "Xin lỗi, tôi không thể tìm thấy thông tin về sản phẩm rẻ nhất lúc này.";
      }
    }
  },
  storeAddress: {
    patterns: [
      "địa chỉ", "cửa hàng ở đâu", "cửa hàng nằm ở đâu", "địa chỉ cửa hàng", 
      "vị trí cửa hàng", "cửa hàng ở chỗ nào", "cửa hàng nằm ở chỗ nào", 
      "tìm cửa hàng", "mua ở đâu", "mua tại đâu", "mua trực tiếp ở đâu"
    ],
    response: () => "Cửa hàng của chúng tôi nằm tại: 273 An Dương Vương, Phường 3, Quận 5, TP. Hồ Chí Minh.\n\nGiờ mở cửa: 8h00 - 22h00 các ngày trong tuần."
  },
  orderStatus: {
    patterns: [
      "tình trạng đơn hàng", "trạng thái đơn hàng", "đơn hàng của tôi", 
      "theo dõi đơn hàng", "kiểm tra đơn hàng", "đơn hàng đến đâu rồi", 
      "đơn hàng khi nào đến", "khi nào nhận được hàng"
    ],
    response: () => "Để kiểm tra tình trạng đơn hàng, vui lòng đăng nhập vào tài khoản và truy cập mục 'Đơn hàng của tôi'. Hoặc bạn có thể cung cấp mã đơn hàng để chúng tôi kiểm tra giúp bạn."
  },
  contactInfo: {
    patterns: [
      "liên hệ", "số điện thoại", "email", "hotline", "gọi cho ai", 
      "liên hệ với ai", "thông tin liên hệ", "liên lạc", "liên hệ như thế nào"
    ],
    response: () => "Thông tin liên hệ của chúng tôi:\n- Hotline: 1900 6789\n- Email: support@chuoikoicho.com\n- Địa chỉ: 273 An Dương Vương, Phường 3, Quận 5, TP. Hồ Chí Minh"
  },
  greeting: {
    patterns: [
      "xin chào", "hello", "hi", "chào", "chào bạn", "chào bot", "chào chatbot", 
      "xin chào bot", "xin chào chatbot", "chào buổi sáng", "chào buổi tối", 
      "chào buổi chiều", "chào buổi trưa", "chào buổi tối", "chào buổi sáng", 
      "chào buổi chiều", "chào buổi trưa"
    ],
    response: () => "Xin chào! Tôi có thể giúp gì cho bạn?",
  },
  thanks: {
    patterns: [
      "cảm ơn", "thank", "thanks", "cám ơn", "cảm ơn bạn", "cảm ơn bot", 
      "cảm ơn chatbot", "cảm ơn nhiều", "cảm ơn rất nhiều", "cảm ơn vì đã giúp", 
      "cảm ơn vì đã trả lời", "cảm ơn vì đã hỗ trợ", "cảm ơn vì đã tư vấn", 
      "cảm ơn vì đã giải đáp", "cảm ơn vì đã hướng dẫn"
    ],
    response: () => "Rất vui được giúp đỡ bạn! Bạn cần hỗ trợ gì thêm không?",
  },
  bye: {
    patterns: [
      "tạm biệt", "bye", "goodbye", "chào tạm biệt", "hẹn gặp lại", 
      "gặp lại sau", "tôi đi đây", "tôi phải đi"
    ],
    response: () => "Chào tạm biệt! Cảm ơn bạn đã trò chuyện. Hẹn gặp lại bạn sau!",
  },
  buyingMethods: {
    patterns: [
      "mua sản phẩm như nào", "mua sản phẩm thế nào", "mua như thế nào", "làm thế nào để mua", 
      "làm sao để mua", "cách mua", "cách đặt hàng", "đặt hàng như thế nào", 
      "cách thức mua", "có thể mua ở đâu", "mua online được không"
    ],
    response: () => "Để mua sản phẩm, bạn có thể:\n1. Đặt hàng trực tiếp trên website này bằng cách thêm vào giỏ hàng\n2. Mua tại cửa hàng: 273 An Dương Vương, Phường 3, Quận 5, TP. Hồ Chí Minh\n3. Đặt hàng qua hotline: 1900 6789\n\nSau khi đặt hàng, bạn sẽ nhận được xác nhận qua email và có thể theo dõi trạng thái đơn hàng trong tài khoản của mình."
  },
  discountedProducts: {
    patterns: [
      "sản phẩm giảm giá", "sản phẩm đang giảm giá", "khuyến mãi", "đang khuyến mãi", 
      "giảm giá", "ưu đãi", "sản phẩm nào đang giảm giá", "khuyến mãi gì", 
      "có chương trình giảm giá", "có chương trình khuyến mãi nào", "sản phẩm khuyến mãi",
      "deal hot", "flash sale", "có sale không", "đang sale", "có đang giảm giá không"
    ],
    response: async () => {
      try {
        // Tìm các sản phẩm có giá khuyến mãi (priceDiscount > 0)
        const discountedProducts = await Product.find({
          $expr: { $gt: [{ $subtract: ["$productPrice", "$productPromotionalPrice"] }, 0] }
        }).limit(4);
        
        if (discountedProducts.length === 0) {
          return "Hiện tại chưa có sản phẩm nào đang được giảm giá.";
        }
        
        // Tạo phản hồi với các sản phẩm giảm giá
        const productElements = discountedProducts.map(p => {
          const imageUrl = p.productImages && p.productImages.length > 0 
            ? p.productImages[0] 
            : "default-product.jpg";
          
          const discount = p.productPrice - p.productPromotionalPrice;
          const discountPercent = Math.round((discount / p.productPrice) * 100);
          
          return {
            type: "product",
            id: p._id,
            name: p.productName,
            price: p.productPrice,
            promotionalPrice: p.productPromotionalPrice,
            discount: discountPercent,
            image: imageUrl,
            slug: createSlug(p.productName)
          };
        });
        
        return {
          text: `Các sản phẩm đang giảm giá:\n\n`,
          products: productElements,
          type: "discountedProducts"
        };
      } catch (error) {
        return "Xin lỗi, tôi không thể tìm thấy thông tin về sản phẩm giảm giá lúc này.";
      }
    }
  },
  userInfo: {
    patterns: [
      "tên của tôi là gì", "tên tôi", "thông tin của tôi", "thông tin tài khoản của tôi",
      "tôi là ai", "thông tin cá nhân của tôi", "tài khoản của tôi", "hồ sơ của tôi",
      "cho tôi biết tên của tôi", "nói tên tôi", "tên người dùng của tôi"
    ],
    response: (userId) => {
      if (!userId) {
        return "Bạn chưa đăng nhập. Vui lòng đăng nhập để xem thông tin cá nhân.";
      }
      
      return "Để xem thông tin cá nhân của bạn, vui lòng truy cập vào trang Tài khoản.";
    }
  },
};

// Cấu hình Rasa
const RASA_URL = process.env.RASA_URL || 'http://localhost:5005';

// Hàm format tiền tệ
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

// Hàm tính điểm tương đồng giữa câu hỏi và pattern
function calculateSimilarity(message, pattern) {
  // Chuyển đổi cả message và pattern thành chữ thường
  const messageLower = message.toLowerCase();
  const patternLower = pattern.toLowerCase();
  
  // Kiểm tra xem pattern có nằm trong message không
  if (messageLower.includes(patternLower)) {
    return 0.8; // Điểm cao nếu pattern là một phần của message
  }
  
  // Tách các từ trong message và pattern
  const messageWords = messageLower.split(/\s+/);
  const patternWords = patternLower.split(/\s+/);
  
  // Đếm số từ trùng khớp
  let matchCount = 0;
  for (const word of messageWords) {
    if (patternWords.includes(word)) {
      matchCount++;
    }
  }
  
  // Tính điểm dựa trên tỷ lệ từ trùng khớp
  const similarity = matchCount / Math.max(messageWords.length, patternWords.length);
  
  // Tăng điểm nếu có nhiều từ trùng khớp
  return similarity + (matchCount * 0.1);
}

// Hàm xác định intent của tin nhắn
function detectIntent(message) {
  let bestMatch = {
    intent: null,
    score: 0
  };

  for (const [intent, data] of Object.entries(intents)) {
    for (const pattern of data.patterns) {
      const similarity = calculateSimilarity(message, pattern);
      if (similarity > bestMatch.score) {
        bestMatch = {
          intent: intent,
          score: similarity
        };
      }
    }
  }

  // Tăng ngưỡng phát hiện intent để tránh trả lời sai
  return bestMatch.score > 0.3 ? bestMatch.intent : null;
}

// Hàm xử lý context của cuộc trò chuyện
function handleContext(context, currentIntent) {
  if (!context || !context.lastIntent) return currentIntent;

  // Nếu câu hỏi mới không rõ ràng, thử sử dụng context trước đó
  if (!currentIntent && context.lastIntent) {
    return context.lastIntent;
  }

  return currentIntent;
}

// Hàm gửi tin nhắn đến Rasa và nhận phản hồi
async function sendToRasa(message, senderId) {
  try {
    const response = await axios.post(`${RASA_URL}/webhooks/rest/webhook`, {
      sender: senderId,
      message: message
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0].text;
    }
    
    return "Xin lỗi, tôi không hiểu câu hỏi của bạn.";
  } catch (error) {
    return "Đã có lỗi xảy ra khi xử lý tin nhắn của bạn.";
  }
}

// Hàm tạo slug từ tên sản phẩm
function createSlug(name) {
  if (!name) {
    return "";
  }
  
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
  
  return slug;
}

// Kiểm tra các intent không cần thông tin sản phẩm
const generalIntents = [
  'greeting', 'thanks', 'bye', 'storeAddress', 'orderStatus', 'contactInfo', 
  'mostExpensiveProduct', 'cheapestProduct', 'discountedProducts', 'userInfo', 'buyingMethods'
];

// Hàm xử lý tin nhắn từ người dùng
export const handleMessage = async (req, res) => {
  try {
    const { message, productId } = req.body;
    
    if (!message && !productId) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin tin nhắn hoặc sản phẩm" });
    }

    let response;
    let intent = null;
    
    // Xử lý truy vấn sản phẩm cụ thể
    if (productId) {
      try {
        // Kiểm tra xem productId có đúng định dạng ObjectId không
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(productId);
        
        let product = null;
        
        // Nếu là ObjectId hợp lệ, thử tìm sản phẩm bằng ID trước
        if (isValidObjectId) {
          product = await Product.findById(productId);
        }
        
        // Nếu không tìm thấy bằng ID, thử tìm bằng slug
        if (!product) {
          // Lấy tất cả sản phẩm và tìm theo slug được tạo từ tên
          const products = await Product.find();
          product = products.find(p => {
            const productSlug = createSlug(p.productName);
            return productSlug === productId;
          });
        }
        
        if (!product) {
          return res.json({
            success: true,
            message: "Xin lỗi, tôi không tìm thấy thông tin về sản phẩm này. Bạn có thể hỏi về các sản phẩm khác hoặc các thông tin khác như sản phẩm giảm giá, sản phẩm mới nhất."
          });
        }
        
        // Xử lý context nếu cần
        if (req.session && req.session.chatContext) {
          intent = handleContext(req.session.chatContext, detectIntent(message));
        } else {
          // Xác định intent từ tin nhắn nếu có
          if (message) {
            intent = detectIntent(message);
          }
        }
        
        // Nếu có intent cụ thể, sử dụng nó để xử lý phản hồi
        if (intent && intents[intent] && intents[intent].response) {
          response = await intents[intent].response(product);
        } else {
          // Hiển thị mặc định thông tin sản phẩm
          response = await intents.info.response(product);
        }
        
        if (typeof response === 'string') {
          return res.json({
            success: true,
            message: response,
            intent: intent
          });
        } else {
          return res.json({
            success: true,
            data: response,
            intent: intent
          });
        }
      } catch (error) {
        return res.json({
          success: false,
          message: "Đã xảy ra lỗi khi xử lý yêu cầu của bạn.",
          error: error.message
        });
      }
    } else if (message) {
      // Kiểm tra các intent không cần thông tin sản phẩm
      intent = detectIntent(message);
      
      // Nếu là intent chung không cần sản phẩm
      if (generalIntents.includes(intent)) {
        // Store the intent for context in future messages
        if (!req.session) req.session = {};
        req.session.chatContext = { intent, timestamp: Date.now() };
        
        // Nếu là intent chung không cần sản phẩm
        if (intent === 'userInfo') {
          response = intents[intent].response(req.body.userId);
        } else if (intent === 'discountedProducts') {
          response = await intents[intent].response();
        } else {
          response = await intents[intent].response();
        }
      } else {
        return res.json({
          success: true,
          message: "Xin lỗi, tôi không hiểu rõ câu hỏi của bạn. Bạn có thể hỏi rõ hơn về:\n- Sản phẩm giảm giá\n- Thông tin sản phẩm\n- Các danh mục sản phẩm",
          intent: null
        });
      }
    }

    return res.json({
      success: true,
      message: response,
      intent: intent
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra, vui lòng thử lại sau",
      error: error.message
    });
  }
};

// Hàm xử lý webhook từ Rasa
export const handleRasaWebhook = async (req, res) => {
  try {
    const { sender, message } = req.body;
    
    if (!sender || !message) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cần thiết"
      });
    }
    
    // Xử lý tin nhắn từ Rasa
    // Có thể thêm logic xử lý đặc biệt ở đây nếu cần
    
    return res.json({
      success: true,
      message: "Đã nhận tin nhắn từ Rasa"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra khi xử lý webhook từ Rasa"
    });
  }
};

async function findRelatedProducts(product) {
  try {
    // Define the fields we want to use for finding related products
    const possibleFields = [
      { field: 'productCategory', value: product.productCategory },
      { field: 'categoryCode', value: product.categoryCode },
    ];

    // Select the first non-empty field
    const categoryField = possibleFields.find(f => f.value && f.value !== 'undefined');
    const categoryValue = categoryField?.value;

    // Build the query based on available data
    let query = {};

    // If it's a beverage product (can check based on category name or code)
    if (product.productCategory === 'Đồ uống các loại' || 
        product.categoryCode === 'douong') {
      // For beverages, find other beverages
      query = {
        $or: [
          { productCategory: 'Đồ uống các loại' },
          { categoryCode: 'douong' }
        ],
        _id: { $ne: product._id } // Exclude the current product
      };
    }
    // If we have category information
    else if (categoryValue) {
      query = {
        [categoryField.field]: categoryValue,
        _id: { $ne: product._id } // Exclude the current product
      };
    } else {
      // Fallback to a more general search if no category available
      // Could use text search here if available in your MongoDB setup
      query = {
        _id: { $ne: product._id } // At minimum, exclude the current product
      };
    }

    // Find related products
    const relatedProducts = await Product.find(query).limit(5);

    // If no related products found, get some random products
    if (relatedProducts.length === 0) {
      return await Product.aggregate([{ $sample: { size: 3 } }]);
    }

    return relatedProducts;
  } catch (_) {
    // Error handled by the caller
    return [];
  }
}

// Helper function to create a slug from a product name
function createSlugFromName(name) {
  if (!name) {
    return '';
  }
  
  try {
    // Basic slug creation: lowercase, replace spaces with hyphens, remove special chars
    const slug = name
      .toLowerCase()
      .replace(/đ/g, 'd')
      .replace(/[áàảãạâấầẩẫậăắằẳẵặ]/g, 'a')
      .replace(/[éèẻẽẹêếềểễệ]/g, 'e')
      .replace(/[íìỉĩị]/g, 'i')
      .replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o')
      .replace(/[úùủũụưứừửữự]/g, 'u')
      .replace(/[ýỳỷỹỵ]/g, 'y')
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .trim();
      
    return slug;
  } catch (error) {
    return '';
  }
}
