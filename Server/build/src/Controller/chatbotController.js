"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.handleRasaWebhook = exports.handleMessage = void 0;




var _axios = _interopRequireDefault(require("axios"));
var _Products = _interopRequireDefault(require("../Model/Products.js"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _child_process = require("child_process");
var _path = _interopRequireDefault(require("path"));
var _fs = _interopRequireDefault(require("fs"));

var _chatbotProductHandler = require("./chatbotProductHandler.js");
var _chatbotFAQHandler = require("./chatbotFAQHandler.js"); /* eslint-disable no-useless-escape */ /* eslint-disable no-empty */ /* eslint-disable no-unused-vars */ /* eslint-disable no-undef */ // Import xử lý câu hỏi về sản phẩm

// Load environment variables
_dotenv.default.config();

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
  'thịt', 'cá', 'hải sản', 'gà', 'bò', 'heo', 'vịt', 'trứng', 'hột vịt', 'hột gà',
  'rau', 'củ', 'quả', 'cà chua', 'cà rốt', 'bắp cải', 'xà lách', 'hành', 'tỏi', 'gừng',
  'ớt', 'tiêu', 'muối', 'đường', 'nước mắm', 'dầu ăn', 'dầu hào', 'nước tương',
  'mì', 'bún', 'phở', 'miến', 'gạo', 'bột', 'bánh', 'kẹo',
  'nước dừa', 'sữa', 'nước', 'bia', 'rượu'];


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
        const regex = new RegExp(`\\b${ingredient}\\b([^,.;]+)?`, 'g');
        let ingredientMatch;

        while ((ingredientMatch = regex.exec(lowerResponse)) !== null) {
          const fullMatch = ingredientMatch[0].trim();
          ingredients.push(fullMatch);
        }
      }
    }
  }

  // Loại bỏ trùng lặp và tinh chỉnh
  ingredients = [...new Set(ingredients)].map((ing) => {
    // Loại bỏ số lượng và đơn vị
    return ing.replace(/\(\d+.*?\)/g, '').
    replace(/\d+\s*(g|kg|ml|l|muỗng|tép|củ|quả)/gi, '').
    replace(/khoảng/gi, '').
    trim();
  }).filter((ing) => ing.length > 1); // Loại bỏ các mục quá ngắn

  return ingredients;
};

/**
 * Lưu ngữ cảnh cuộc hội thoại
 * @param {string} userId - ID người dùng
 * @param {object} context - Dữ liệu ngữ cảnh
 */
const saveContext = (userId, context) => {
  if (!userId) return;

  // Lấy ngữ cảnh hiện tại hoặc tạo mới nếu không có
  const currentContext = conversationContext.get(userId) || { createdAt: Date.now() };

  // Cập nhật ngữ cảnh
  conversationContext.set(userId, {
    ...currentContext,
    ...context,
    updatedAt: Date.now()
  });

  console.log(`Đã lưu ngữ cảnh cho user ${userId}:`, JSON.stringify(context));
};

/**
 * Lấy ngữ cảnh cuộc hội thoại
 * @param {string} userId - ID người dùng
 * @returns {object|null} - Dữ liệu ngữ cảnh hoặc null nếu không có/hết hạn
 */
const getContext = (userId) => {
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

// Hàm xử lý tin nhắn từ người dùng
const handleMessage = async (req, res) => {
  try {
    const { message, userId, productId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      });
    }

    console.log(`Nhận tin nhắn từ user ${userId || 'anonymous'}: "${message}"`);
    console.log("Thông tin sản phẩm đang xem (productId):", productId);

    // Kiểm tra xem có phải yêu cầu về nguyên liệu từ công thức trước đó
    const isIngredientRequest = /tìm (các )?nguyên liệu|nguyên liệu (ở )?trên|chỗ nào (có )?bán|mua (ở )?đâu/i.test(message);
    if (isIngredientRequest && userId) {
      const context = getContext(userId);

      if (context && context.lastRecipe) {
        console.log("Phát hiện yêu cầu tìm nguyên liệu từ công thức trước:", context.lastRecipe.substring(0, 50) + "...");

        // Trích xuất nguyên liệu từ công thức
        const ingredients = extractIngredientsFromRecipe(context.lastRecipe);
        console.log("Các nguyên liệu được trích xuất:", ingredients);

        if (ingredients.length > 0) {
          // Tìm kiếm sản phẩm theo từng nguyên liệu
          const multiResults = await handleMultiProductSearch(ingredients);

          if (multiResults.length > 0) {
            // Đếm tổng số sản phẩm tìm được
            const totalProducts = multiResults.reduce((total, result) => total + (result.products ? result.products.length : 0), 0);

            // Đếm số lượng queries có kết quả
            const queriesWithResults = multiResults.filter((result) => result.products && result.products.length > 0).length;

            // Tạo thông báo phù hợp
            let responseMessage = "";

            if (queriesWithResults === ingredients.length) {
              responseMessage = `Tôi đã tìm thấy ${totalProducts} sản phẩm phù hợp với ${ingredients.length} nguyên liệu từ công thức:`;
            } else if (queriesWithResults > 0) {
              responseMessage = `Tôi tìm thấy sản phẩm phù hợp với ${queriesWithResults}/${ingredients.length} nguyên liệu từ công thức:`;
            } else {
              responseMessage = "Rất tiếc, tôi không tìm thấy sản phẩm phù hợp với các nguyên liệu từ công thức. Bạn có thể thử lại với từ khóa khác không?";
            }

            // Lưu kết quả tìm kiếm vào ngữ cảnh
            const lastProducts = multiResults.flatMap((result) => result.products || []);
            saveContext(userId, {
              multiSearchResults: multiResults,
              lastProducts: lastProducts.length > 0 ? lastProducts : null,
              lastProduct: lastProducts.length > 0 ? lastProducts[0] : null,
              lastQuery: message
            });

            return res.status(200).json({
              success: true,
              type: 'multiProductSearch',
              message: responseMessage,
              data: multiResults,
              totalResults: totalProducts
            });
          } else {
            return res.status(200).json({
              success: true,
              type: 'text',
              message: "Rất tiếc, tôi không tìm thấy sản phẩm phù hợp với các nguyên liệu từ công thức. Bạn có thể tìm kiếm trực tiếp bằng từng nguyên liệu cụ thể."
            });
          }
        } else {
          return res.status(200).json({
            success: true,
            type: 'text',
            message: "Tôi không thể trích xuất được nguyên liệu từ công thức trước đó. Bạn có thể cho tôi biết cụ thể nguyên liệu bạn đang tìm kiếm không?"
          });
        }
      }
    }

    // Kiểm tra xem có phải yêu cầu tìm nhiều sản phẩm cùng lúc không
    const multiProductQueries = detectMultiProductSearch(message);
    if (multiProductQueries) {
      console.log("Phát hiện yêu cầu tìm nhiều sản phẩm cùng lúc:", multiProductQueries);

      const multiResults = await handleMultiProductSearch(multiProductQueries);

      if (multiResults.length > 0) {
        // Đếm tổng số sản phẩm tìm được
        const totalProducts = multiResults.reduce((total, result) => total + (result.products ? result.products.length : 0), 0);

        // Đếm số lượng queries có kết quả
        const queriesWithResults = multiResults.filter((result) => result.products && result.products.length > 0).length;

        // Tạo thông báo phù hợp
        let responseMessage = "";

        if (queriesWithResults === multiProductQueries.length) {
          // Tìm thấy kết quả cho tất cả các truy vấn
          responseMessage = `Tôi đã tìm thấy ${totalProducts} sản phẩm phù hợp với ${multiProductQueries.length} loại bạn yêu cầu:`;
        } else if (queriesWithResults > 0) {
          // Chỉ tìm thấy kết quả cho một số truy vấn
          responseMessage = `Tôi tìm thấy sản phẩm phù hợp với ${queriesWithResults}/${multiProductQueries.length} loại bạn yêu cầu:`;
        } else {
          // Không tìm thấy kết quả nào
          responseMessage = "Tôi không tìm thấy sản phẩm nào phù hợp với yêu cầu của bạn. Bạn có thể thử lại với từ khóa khác không?";
        }

        // Lưu kết quả tìm kiếm vào ngữ cảnh nếu có userId
        if (userId) {
          const lastProducts = multiResults.flatMap((result) => result.products || []);
          saveContext(userId, {
            multiSearchResults: multiResults,
            lastProducts: lastProducts.length > 0 ? lastProducts : null,
            lastProduct: lastProducts.length > 0 ? lastProducts[0] : null,
            lastQuery: message
          });
        }

        return res.status(200).json({
          success: true,
          type: 'multiProductSearch',
          message: responseMessage,
          data: multiResults,
          totalResults: totalProducts
        });
      } else {
        return res.status(200).json({
          success: true,
          type: 'text',
          message: "Rất tiếc, tôi không tìm thấy sản phẩm nào phù hợp với các tiêu chí tìm kiếm của bạn. Bạn có thể thử lại với các từ khóa khác không?"
        });
      }
    }

    // Xử lý câu hỏi về sản phẩm hiện tại nếu có productId
    if (productId) {
      try {
        // Tìm thông tin sản phẩm từ database
        const product = await _Products.default.findById(productId);

        if (product) {
          console.log(`Đang xử lý câu hỏi về sản phẩm: ${product.productName}`);

          // Lưu sản phẩm vào ngữ cảnh
          saveContext(userId, { lastProduct: product });

          // Xử lý câu hỏi về sản phẩm hiện tại
          const productResponse = await (0, _chatbotProductHandler.handleProductPageQuestion)(message, product);

          if (productResponse && productResponse.success) {
            console.log("Phản hồi từ xử lý câu hỏi sản phẩm:", productResponse.message);
            return res.status(200).json(productResponse);
          }
        }
      } catch (error) {
        console.error("Lỗi khi xử lý câu hỏi về sản phẩm:", error);
      }
    }

    // Kiểm tra xem có phải câu hỏi phụ thuộc ngữ cảnh sản phẩm trước đó không
    const isContextDependent = checkContextDependentQuery(message);
    console.log("Kiểm tra câu hỏi phụ thuộc ngữ cảnh:", isContextDependent);

    if (isContextDependent && userId) {
      const context = getContext(userId);
      console.log("Ngữ cảnh hiện tại:", context ? JSON.stringify({
        hasLastProduct: !!context.lastProduct,
        productName: context.lastProduct ? context.lastProduct.productName : null,
        lastQuery: context.lastQuery || null
      }) : "Không có ngữ cảnh");

      if (context && context.lastProduct) {
        console.log(`Phát hiện câu hỏi phụ thuộc ngữ cảnh về sản phẩm: ${context.lastProduct.productName}`);

        // Xử lý câu hỏi dựa trên sản phẩm trong ngữ cảnh
        const productResponse = await (0, _chatbotProductHandler.handleProductPageQuestion)(message, context.lastProduct);

        if (productResponse && productResponse.success) {
          return res.status(200).json(productResponse);
        }

        // Nếu không xử lý được bằng handleProductPageQuestion, tạo câu trả lời dựa trên thuộc tính sản phẩm
        const response = generateContextResponse(message, context.lastProduct);
        if (response) {
          return res.status(200).json(response);
        }
      }
    }

    // Đối với câu hỏi "Có sản phẩm X không?"
    const productQuestion = checkProductAvailabilityQuestion(message);
    if (productQuestion) {
      try {
        // Tìm kiếm sản phẩm dựa trên tên sản phẩm được trích xuất
        const products = await searchProductsMongoDB(productQuestion);

        if (products && products.length > 0) {
          // Lưu sản phẩm đầu tiên vào ngữ cảnh để sử dụng cho câu hỏi tiếp theo
          saveContext(userId, { lastProduct: products[0], lastProducts: products });

          return res.status(200).json({
            success: true,
            type: 'categoryQuery',
            message: `Chúng tôi có ${products.length} sản phẩm phù hợp:`,
            data: products
          });
        } else {
          return res.status(200).json({
            success: true,
            type: 'text',
            message: `Rất tiếc, chúng tôi hiện không có sản phẩm "${productQuestion}" trong kho. Bạn có thể xem các sản phẩm tương tự khác không?`
          });
        }
      } catch (error) {
        console.error("Lỗi khi tìm kiếm sản phẩm:", error);
      }
    }

    // Tiếp tục xử lý các intent khác nếu không phải câu hỏi về sản phẩm hiện tại
    // Phát hiện intent từ tin nhắn
    const intent = detectIntent(message);
    console.log("Intent được phát hiện:", intent);

    // Xử lý dựa trên intent
    let response;
    switch (intent) {
      case 'greeting':
        response = {
          success: true,
          type: 'text',
          message: "Xin chào! Tôi là trợ lý ảo của cửa hàng. Tôi có thể giúp gì cho bạn?"
        };
        break;

      case 'price':
        response = {
          success: true,
          type: 'text',
          message: "Để biết giá cụ thể của sản phẩm, vui lòng cho tôi biết bạn quan tâm đến sản phẩm nào?"
        };
        break;

      case 'cooking_recipe':
        try {
          // Gọi API Python backend để lấy công thức nấu ăn
          const pyRes = await _axios.default.post('http://localhost:5000/api/chatbot/ask', { question: message });
          if (pyRes.data && pyRes.data.answer) {
            // Lưu công thức vào ngữ cảnh để sử dụng sau này
            if (userId) {
              saveContext(userId, { lastRecipe: pyRes.data.answer, lastQuery: message });
            }

            return res.status(200).json({
              success: true,
              type: 'text',
              message: pyRes.data.answer
            });
          }
          response = {
            success: true,
            type: 'text',
            message: "Xin lỗi, tôi không tìm thấy công thức phù hợp."
          };
        } catch (error) {
          console.error("Lỗi khi lấy công thức nấu ăn:", error);
          response = {
            success: true,
            type: 'text',
            message: "Xin lỗi, đã có lỗi xảy ra khi lấy công thức nấu ăn."
          };
        }
        break;

      case 'product':
        // Tìm kiếm sản phẩm
        try {
          // Sử dụng MongoDB để tìm kiếm thay vì Python
          const productResults = await searchProductsMongoDB(message);

          if (productResults && productResults.length > 0) {
            // Lưu sản phẩm đầu tiên vào ngữ cảnh
            if (userId) {
              saveContext(userId, {
                lastProduct: productResults[0],
                lastProducts: productResults,
                lastQuery: message
              });
              console.log(`Đã lưu sản phẩm "${productResults[0].productName}" vào ngữ cảnh cho user ${userId}`);
            }

            return res.status(200).json({
              success: true,
              type: 'categoryQuery',
              message: "Đây là một số sản phẩm phù hợp với yêu cầu của bạn:",
              data: productResults
            });
          } else {
            response = {
              success: true,
              type: 'text',
              message: "Rất tiếc, tôi không tìm thấy sản phẩm phù hợp với yêu cầu của bạn. Bạn có thể mô tả chi tiết hơn không?"
            };
          }
        } catch (error) {
          console.error("Lỗi khi tìm kiếm sản phẩm:", error);
          response = {
            success: true,
            type: 'text',
            message: "Đã xảy ra lỗi khi tìm kiếm sản phẩm. Vui lòng thử lại sau."
          };
        }
        break;

      // Xử lý các câu hỏi thường gặp (FAQ)
      case 'faq_how_to_buy':
      case 'faq_how_to_order':
      case 'faq_payment_methods':
      case 'faq_store_location':
      case 'faq_product_quality':
      case 'faq_shipping_time':
      case 'faq_return_policy':
      case 'faq_promotions':
      case 'faq_trending_products':
      case 'faq_shipping_fee':
      case 'faq_customer_support':
        try {
          // Gọi hàm xử lý FAQ
          const faqResponse = (0, _chatbotFAQHandler.handleFAQQuestion)(intent);
          if (faqResponse) {
            return res.status(200).json(faqResponse);
          }
        } catch (error) {
          console.error("Lỗi khi xử lý câu hỏi FAQ:", error);
        }
        break;

      case 'unknown':
      default:
        try {
          // Thử tìm kiếm sản phẩm trực tiếp
          const products = await searchProductsMongoDB(message);

          if (products && products.length > 0) {
            // Lưu sản phẩm đầu tiên vào ngữ cảnh
            if (userId) {
              saveContext(userId, {
                lastProduct: products[0],
                lastProducts: products,
                lastQuery: message
              });
              console.log(`Đã lưu sản phẩm "${products[0].productName}" vào ngữ cảnh cho user ${userId}`);
            }

            return res.status(200).json({
              success: true,
              type: 'categoryQuery',
              message: "Đây là một số sản phẩm phù hợp với yêu cầu của bạn:",
              data: products
            });
          } else {
            response = {
              success: true,
              type: 'text',
              message: "Tôi không tìm thấy thông tin phù hợp. Bạn có thể hỏi cụ thể hơn về sản phẩm, giá cả, hoặc thông tin khác không?"
            };
          }
        } catch (error) {
          console.error("Lỗi khi xử lý câu hỏi:", error);
          response = {
            success: true,
            type: 'text',
            message: "Tôi không hiểu ý của bạn. Bạn có thể diễn đạt theo cách khác được không?"
          };
        }
        break;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Lỗi khi xử lý tin nhắn:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing the message"
    });
  }
};

/**
 * Hàm xử lý webhook từ Rasa
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} - JSON response
 */exports.handleMessage = handleMessage;
const handleRasaWebhook = async (req, res) => {
  try {
    console.log("Nhận webhook từ Rasa:", req.body);

    // Xử lý dữ liệu từ Rasa
    const rasaResponse = req.body;

    // Trả về phản hồi
    return res.status(200).json({
      success: true,
      message: "Webhook received successfully",
      data: rasaResponse
    });
  } catch (error) {
    console.error("Lỗi khi xử lý webhook từ Rasa:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing the webhook"
    });
  }
};

/**
 * Tìm kiếm sản phẩm trực tiếp bằng MongoDB
 * @param {string} query - Câu truy vấn tìm kiếm
 * @returns {Array} - Danh sách sản phẩm
 */exports.handleRasaWebhook = handleRasaWebhook;
const searchProductsMongoDB = async (query) => {
  try {
    console.log("Đang tìm kiếm sản phẩm với query:", query);

    // Xử lý query để tìm từ khóa quan trọng
    const lowerQuery = query.toLowerCase();

    // Tìm kiếm sản phẩm theo giá
    const priceMatch = lowerQuery.match(/dưới (\d+)k/i) || lowerQuery.match(/< (\d+)k/i) || lowerQuery.match(/nhỏ hơn (\d+)k/i);
    const priceHighMatch = lowerQuery.match(/trên (\d+)k/i) || lowerQuery.match(/> (\d+)k/i) || lowerQuery.match(/lớn hơn (\d+)k/i);
    const priceBetweenMatch = lowerQuery.match(/từ (\d+)k đến (\d+)k/i) || lowerQuery.match(/(\d+)k - (\d+)k/i);

    // Mảng các điều kiện tìm kiếm
    const conditions = [];
    let isPriceQuery = false;

    // Xử lý tìm kiếm theo khoảng giá
    if (priceMatch) {
      const maxPrice = parseInt(priceMatch[1]) * 1000;
      conditions.push({
        $or: [
        { price: { $lte: maxPrice } },
        { productPrice: { $lte: maxPrice } }]

      });
      isPriceQuery = true;
      console.log("Tìm sản phẩm có giá dưới:", maxPrice);
    } else if (priceHighMatch) {
      const minPrice = parseInt(priceHighMatch[1]) * 1000;
      conditions.push({
        $or: [
        { price: { $gte: minPrice } },
        { productPrice: { $gte: minPrice } }]

      });
      isPriceQuery = true;
      console.log("Tìm sản phẩm có giá trên:", minPrice);
    } else if (priceBetweenMatch) {
      const minPrice = parseInt(priceBetweenMatch[1]) * 1000;
      const maxPrice = parseInt(priceBetweenMatch[2]) * 1000;
      conditions.push({
        $or: [
        { price: { $gte: minPrice, $lte: maxPrice } },
        { productPrice: { $gte: minPrice, $lte: maxPrice } }]

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
    { phrase: "nước tương", category: "Gia vị" }];


    let foundSpecificPhrase = false;
    for (const item of specificPhrases) {
      if (lowerQuery.includes(item.phrase)) {
        foundSpecificPhrase = true;
        conditions.push({
          $or: [
          { productName: { $regex: item.phrase, $options: 'i' } },
          { description: { $regex: item.phrase, $options: 'i' } },
          { category: item.category }]

        });
        console.log(`Tìm sản phẩm với cụm từ cụ thể: "${item.phrase}" thuộc danh mục ${item.category}`);
        break;
      }
    }

    // Xử lý tìm kiếm theo danh mục/loại sản phẩm nếu không tìm được cụm từ cụ thể và không phải là câu hỏi về giá
    if (!foundSpecificPhrase && !isPriceQuery) {
      const categoryKeywords = [
      { keywords: ['rau', 'củ', 'quả', 'rau củ', 'rau quả', 'trái cây'], category: 'Rau củ quả' },
      { keywords: ['thịt', 'cá', 'hải sản', 'thịt cá', 'thủy hải sản'], category: 'Thịt và hải sản' },
      { keywords: ['đồ uống', 'nước ngọt', 'bia', 'rượu'], category: 'Đồ uống' },
      { keywords: ['gia vị', 'dầu ăn', 'nước mắm', 'muối', 'đường', 'mì chính'], category: 'Gia vị' },
      { keywords: ['bánh', 'kẹo', 'snack', 'đồ ăn vặt'], category: 'Bánh kẹo' },
      { keywords: ['mì', 'bún', 'phở', 'miến', 'hủ tiếu'], category: 'Mì, bún, phở' },
      { keywords: ['giặt', 'xà phòng', 'nước rửa', 'lau', 'vệ sinh'], category: 'Đồ gia dụng' }];


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
    const stopWords = ['tìm', 'kiếm', 'sản', 'phẩm', 'sản phẩm', 'hàng', 'giá', 'mua', 'bán', 'các', 'có', 'không', 'vậy', 'shop', 'cửa hàng', 'thì', 'là', 'và', 'hay', 'hoặc', 'nhé', 'ạ', 'dưới', 'trên', 'khoảng', 'từ', 'đến'];
    const words = lowerQuery.split(/\s+/);

    // Lọc bỏ từ khóa giá (100k, 50k)
    const priceKeywords = words.filter((word) => word.match(/\d+k$/i));
    const keywords = words.filter((word) => !stopWords.includes(word) && word.length > 1 && !word.match(/\d+k$/i));

    console.log("Từ khóa giá:", priceKeywords);
    console.log("Từ khóa tìm kiếm:", keywords);

    // Xử lý đặc biệt cho trường hợp tìm kiếm "rau"
    const isVegetableSearch = keywords.some((kw) => ['rau', 'củ', 'quả'].includes(kw));
    let isSpecialCategorySearch = false;

    if (isVegetableSearch) {
      isSpecialCategorySearch = true;
      // Nếu chỉ toàn từ khóa liên quan đến rau củ quả, ưu tiên sử dụng danh mục thay vì tìm theo từ khóa
      if (keywords.every((kw) => ['rau', 'củ', 'quả', 'trái'].includes(kw))) {
        console.log("Tìm tất cả sản phẩm trong danh mục Rau củ quả");
        // Xóa điều kiện tìm kiếm hiện tại nếu có
        const categoryIndex = conditions.findIndex((c) => c.category === 'Rau củ quả');
        if (categoryIndex !== -1) {
          conditions.splice(categoryIndex, 1);
        }
        // Thêm điều kiện tìm kiếm theo danh mục
        conditions.push({ category: 'Rau củ quả' });
      }
    }

    // Nếu đây là câu hỏi về giá, ưu tiên chỉ tìm theo giá nếu không có từ khóa đặc biệt
    if (isPriceQuery) {
      if (keywords.length === 0) {
        console.log("Đây là câu hỏi tìm theo giá, chỉ tìm kiếm dựa trên điều kiện giá");
      } else
      {
        // Tạo các điều kiện tìm kiếm theo từng từ khóa
        const keywordConditions = [];
        for (const keyword of keywords) {
          keywordConditions.push({ productName: { $regex: keyword, $options: 'i' } });
          keywordConditions.push({ description: { $regex: keyword, $options: 'i' } });
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
        keywordConditions.push({ productName: { $regex: keyword, $options: 'i' } });
        keywordConditions.push({ description: { $regex: keyword, $options: 'i' } });
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
        const allMatchedProducts = await _Products.default.find(filter).limit(20);

        if (allMatchedProducts.length === 0) {
          // Nếu không tìm thấy sản phẩm, thử tìm chỉ với từ khóa
          if (keywords.length > 0) {
            console.log("Không tìm thấy sản phẩm, thử tìm chỉ với từ khóa");

            // Tạo pipeline aggregation để tính điểm phù hợp
            const aggregationPipeline = [
            {
              $match: {
                $or: keywords.flatMap((keyword) => [
                { productName: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }]
                )
              }
            },
            {
              $addFields: {
                matchScore: {
                  $add: keywords.map((keyword) => [
                  { $cond: [{ $regexMatch: { input: "$productName", regex: keyword, options: "i" } }, 2, 0] },
                  { $cond: [{ $regexMatch: { input: "$description", regex: keyword, options: "i" } }, 1, 0] }]
                  ).flat()
                }
              }
            },
            {
              $sort: { matchScore: -1 }
            },
            {
              $limit: 10
            }];


            products = await _Products.default.aggregate(aggregationPipeline);
            console.log(`Tìm thấy ${products.length} sản phẩm bằng từ khóa với điểm phù hợp`);
          }

          // Nếu vẫn không tìm thấy hoặc không có từ khóa, thử tìm theo danh mục
          if (products.length === 0 && !foundSpecificPhrase) {
            // Xử lý đặc biệt cho từ khóa "rau"
            const isVegetableQuery = lowerQuery.includes("rau") ||
            lowerQuery.includes("củ") ||
            lowerQuery.includes("quả");

            if (isVegetableQuery) {
              console.log("Thử tìm tất cả sản phẩm trong danh mục Rau củ quả");
              products = await _Products.default.find({ category: "Rau củ quả" }).limit(10);
              // Nếu đã tìm thấy sản phẩm, bỏ qua việc tìm kiếm danh mục tiếp theo
              if (products.length > 0) {
                console.log(`Tìm thấy ${products.length} sản phẩm trong danh mục Rau củ quả`);
                return products;
              }
            }

            const categoryKeywords = [
            { keywords: ['rau', 'củ', 'quả', 'rau củ', 'rau quả', 'trái cây'], category: 'Rau củ quả' },
            { keywords: ['thịt', 'cá', 'hải sản', 'thịt cá', 'thủy hải sản'], category: 'Thịt và hải sản' },
            { keywords: ['đồ uống', 'nước ngọt', 'bia', 'rượu'], category: 'Đồ uống' },
            { keywords: ['gia vị', 'dầu ăn', 'nước mắm', 'muối', 'đường', 'mì chính'], category: 'Gia vị' },
            { keywords: ['bánh', 'kẹo', 'snack', 'đồ ăn vặt'], category: 'Bánh kẹo' },
            { keywords: ['mì', 'bún', 'phở', 'miến', 'hủ tiếu'], category: 'Mì, bún, phở' },
            { keywords: ['giặt', 'xà phòng', 'nước rửa', 'lau', 'vệ sinh'], category: 'Đồ gia dụng' }];


            for (const item of categoryKeywords) {
              if (item.keywords.some((keyword) => lowerQuery.includes(keyword))) {
                console.log("Thử tìm chỉ với danh mục:", item.category);
                products = await _Products.default.find({ category: item.category }).limit(10);
                if (products.length > 0) break;
              }
            }
          }
        } else {
          // Nếu có kết quả, tính điểm phù hợp và sắp xếp kết quả
          products = allMatchedProducts.map((product) => {
            try {
              // Kiểm tra xem product có hợp lệ không
              if (!product || typeof product !== 'object') {
                console.log("Bỏ qua sản phẩm không hợp lệ:", product);
                return { matchScore: -1 }; // Sẽ bị loại bỏ khi sắp xếp
              }

              // Chuyển đổi an toàn thành plain object
              const productObj = product.toObject ? product.toObject() : product;

              // Đảm bảo các trường văn bản tồn tại
              const nameText = (productObj.productName || '').toLowerCase();
              const descText = (productObj.description || '').toLowerCase();

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
              const exactPhrase = keywords.join(' ');
              if (exactPhrase.length > 3 && nameText.includes(exactPhrase)) {
                score += 10;
              }

              return {
                ...productObj,
                matchScore: score
              };
            } catch (error) {
              console.error("Lỗi khi tính điểm cho sản phẩm:", error);
              return { matchScore: -1 }; // Sẽ bị loại bỏ khi sắp xếp
            }
          }).filter((product) => product.matchScore > -1); // Loại bỏ các sản phẩm không hợp lệ

          // Sắp xếp theo điểm cao nhất trước
          products.sort((a, b) => b.matchScore - a.matchScore);

          // Giới hạn kết quả
          products = products.slice(0, 10);
        }
      } else {
        // Nếu không có filter cụ thể, lấy sản phẩm mới nhất
        products = await _Products.default.find().sort({ createdAt: -1 }).limit(10);
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
    return 'cooking_recipe';
  }
  // Mẫu xử lý intent đơn giản
  if (lowerMessage.includes('chào') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return 'greeting';
  }
  if (lowerMessage.includes('giá') || lowerMessage.includes('bao nhiêu')) {
    return 'price';
  }
  if (lowerMessage.includes('sản phẩm') || lowerMessage.includes('mua') || lowerMessage.includes('hàng')) {
    return 'product';
  }
  // Trả về intent mặc định nếu không nhận diện được
  return 'unknown';
};

/**
 * Phát hiện intent liên quan đến FAQ
 * @param {string} message - Tin nhắn từ người dùng đã lowercase
 * @returns {string|null} - Intent FAQ hoặc null nếu không phát hiện
 */
const detectFAQIntent = (message) => {
  // Mua hàng
  if (message.includes('làm sao để mua') ||
  message.includes('mua hàng như thế nào') ||
  message.includes('cách mua') ||
  message.includes('mua hàng') ||
  message.includes('mua như thế nào') ||
  message.includes('cách thức mua')) {
    return 'faq_how_to_buy';
  }

  // Đặt hàng
  if (message.includes('đặt hàng') ||
  message.includes('cách đặt') ||
  message.includes('đặt mua') ||
  message.includes('đặt như thế nào')) {
    return 'faq_how_to_order';
  }

  // Thanh toán
  if (message.includes('thanh toán') ||
  message.includes('phương thức thanh toán') ||
  message.includes('cách thanh toán') ||
  message.includes('hình thức thanh toán') ||
  message.includes('trả tiền') ||
  message.includes('bao nhiêu hình thức thanh toán')) {
    return 'faq_payment_methods';
  }

  // Địa chỉ cửa hàng
  if (message.includes('địa chỉ') ||
  message.includes('cửa hàng ở đâu') ||
  message.includes('shop ở đâu') ||
  message.includes('vị trí') ||
  message.includes('địa điểm')) {
    return 'faq_store_location';
  }

  // Chất lượng sản phẩm
  if (message.includes('chất lượng') ||
  message.includes('sản phẩm có tốt') ||
  message.includes('có đảm bảo') ||
  message.includes('hàng có tốt') ||
  message.includes('sản phẩm tốt không')) {
    return 'faq_product_quality';
  }

  // Thời gian giao hàng
  if (message.includes('giao hàng') ||
  message.includes('ship') ||
  message.includes('vận chuyển') ||
  message.includes('thời gian giao') ||
  message.includes('giao trong bao lâu') ||
  message.includes('mất bao lâu để nhận')) {
    return 'faq_shipping_time';
  }

  // Chính sách đổi trả
  if (message.includes('đổi trả') ||
  message.includes('hoàn tiền') ||
  message.includes('trả lại') ||
  message.includes('đổi hàng') ||
  message.includes('bị lỗi') ||
  message.includes('không hài lòng')) {
    return 'faq_return_policy';
  }

  // Khuyến mãi hiện có
  if (message.includes('khuyến mãi') ||
  message.includes('giảm giá') ||
  message.includes('ưu đãi') ||
  message.includes('có mã giảm') ||
  message.includes('đang giảm giá')) {
    return 'faq_promotions';
  }

  // Sản phẩm mới/bán chạy
  if (message.includes('sản phẩm mới') ||
  message.includes('mới ra mắt') ||
  message.includes('bán chạy nhất') ||
  message.includes('phổ biến nhất') ||
  message.includes('hot nhất') ||
  message.includes('xu hướng')) {
    return 'faq_trending_products';
  }

  // Phí vận chuyển
  if (message.includes('phí vận chuyển') ||
  message.includes('phí ship') ||
  message.includes('phí giao hàng') ||
  message.includes('ship bao nhiêu tiền') ||
  message.includes('tốn bao nhiêu tiền giao hàng')) {
    return 'faq_shipping_fee';
  }

  // Hỗ trợ khách hàng
  if (message.includes('hỗ trợ') ||
  message.includes('liên hệ') ||
  message.includes('tư vấn') ||
  message.includes('hotline') ||
  message.includes('số điện thoại') ||
  message.includes('email')) {
    return 'faq_customer_support';
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
  if (lowerMessage.includes('tìm') ||
  lowerMessage.includes('kiếm') ||
  lowerMessage.includes('có sản phẩm') ||
  lowerMessage.includes('dưới') ||
  lowerMessage.includes('trên') ||
  lowerMessage.includes('khoảng giá') ||
  lowerMessage.includes('k ') ||
  lowerMessage.match(/\d+k/)) {
    console.log("Đây là câu hỏi tìm kiếm mới, không phụ thuộc ngữ cảnh");
    return false;
  }

  // Các mẫu câu hỏi phụ thuộc ngữ cảnh
  const contextPatterns = [
  // Câu hỏi về công dụng
  /công dụng/i, /tác dụng/i, /dùng để làm gì/i, /dùng để/i, /dùng như thế nào/i, /sử dụng/i, /cách dùng/i,
  // Câu hỏi về giá
  /giá bao nhiêu/i, /bao nhiêu tiền/i, /giá/i, /bao nhiêu/i,
  // Câu hỏi về xuất xứ, thành phần
  /xuất xứ/i, /sản xuất/i, /thành phần/i, /nguyên liệu/i, /có chứa/i, /bảo quản/i,
  // Câu hỏi về giới thiệu
  /giới thiệu/i, /nói về/i, /thông tin về/i, /mô tả/i,
  // Đại từ chỉ định không rõ ràng
  /sản phẩm này/i, /nó/i, /cái này/i, /món này/i, /hàng này/i,
  // Sản phẩm liên quan
  /sản phẩm liên quan/i, /liên quan/i, /tương tự/i, /giống/i, /sản phẩm khác/i,
  // Câu hỏi mơ hồ khác mà không đề cập sản phẩm cụ thể
  /hạn sử dụng/i, /bảo hành/i, /chất lượng/i, /đánh giá/i, /review/i];


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
  /cửa hàng (có |bán |cung cấp |)([a-zA-Z0-9À-ỹ\s]+?) (không|ko|k|hong|hông)(\?)?$/i];


  for (const pattern of productAvailabilityPatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      const productName = match[2].trim();
      // Loại bỏ các từ không cần thiết
      const stopWords = ['sản phẩm', 'hàng', 'cái', 'món', 'đồ'];
      let cleanProductName = productName;

      for (const word of stopWords) {
        if (cleanProductName.startsWith(word + ' ')) {
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
  let responseMessage = '';

  // Câu hỏi về công dụng
  if (/công dụng|tác dụng|dùng để làm gì|dùng để|dùng như thế nào|sử dụng|cách dùng/.test(lowerMessage)) {
    responseMessage = product.productDetails ?
    `${product.productName} ${product.productDetails}` :
    `${product.productName} là sản phẩm ${product.productCategory || product.category}. Vui lòng xem chi tiết sản phẩm để biết thêm về công dụng.`;
  }
  // Câu hỏi về giới thiệu
  else if (/giới thiệu|nói về|thông tin về|mô tả|sản phẩm này|thế nào/.test(lowerMessage)) {
    responseMessage = product.productIntroduction ?
    `Giới thiệu về ${product.productName}: ${product.productIntroduction}` :
    `${product.productName} là sản phẩm ${product.productCategory || product.category}. Hiện chưa có thông tin giới thiệu chi tiết về sản phẩm này.`;
  }
  // Câu hỏi về giá
  else if (/giá bao nhiêu|bao nhiêu tiền|giá|bao nhiêu/.test(lowerMessage)) {
    const originalPrice = product.productPrice || product.price || 0;
    const discount = product.productDiscount || 0;
    const promoPrice = product.productPromoPrice || (discount > 0 ? Math.round(originalPrice * (1 - discount / 100)) : originalPrice);

    if (discount > 0) {
      responseMessage = `Giá của ${product.productName} là ${formatCurrency(promoPrice)} (Đã giảm ${discount}% từ ${formatCurrency(originalPrice)}).`;
    } else {
      responseMessage = `Giá của ${product.productName} là ${formatCurrency(originalPrice)}.`;
    }
  }
  // Câu hỏi về xuất xứ, thành phần
  else if (/xuất xứ|sản xuất|thành phần|nguyên liệu|có chứa|bảo quản/.test(lowerMessage)) {
    responseMessage = product.productOrigin || product.origin ?
    `${product.productName} có xuất xứ từ ${product.productOrigin || product.origin}.` :
    `Thông tin chi tiết về xuất xứ và thành phần của ${product.productName} được ghi rõ trên bao bì sản phẩm.`;

    // Thêm thông tin thương hiệu nếu có
    if (product.productBrand) {
      responseMessage += ` Sản phẩm thuộc thương hiệu ${product.productBrand}.`;
    }
  }
  // Câu hỏi về hạn sử dụng
  else if (/hạn sử dụng|bảo hành|chất lượng/.test(lowerMessage)) {
    responseMessage = product.expiryDate ?
    `${product.productName} có hạn sử dụng đến ${product.expiryDate}.` :
    `Thông tin về hạn sử dụng của ${product.productName} được ghi rõ trên bao bì sản phẩm.`;
  }
  // Các câu hỏi chung
  else {
    const price = product.productPrice || product.price || 0;
    responseMessage = `Sản phẩm ${product.productName} thuộc danh mục ${product.productCategory || product.category} với giá ${formatCurrency(price)}. Bạn muốn biết thêm thông tin gì về sản phẩm này?`;
  }

  return {
    success: true,
    type: 'text',
    message: responseMessage,
    product: product // Trả về thông tin sản phẩm để hiển thị nếu cần
  };
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
  'nước giặt', 'nước rửa', 'nước ngọt', 'nước giải khát', 'pepsi', 'coca',
  'thịt', 'cá', 'rau', 'củ', 'quả', 'bánh', 'kẹo', 'mì', 'bún',
  'gia vị', 'dầu ăn', 'nước mắm', 'nước tương', 'sữa', 'trà', 'cà phê'];


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
  lowerMessage.includes('nhiều sản phẩm') ||
  lowerMessage.includes('nhiều loại') ||
  lowerMessage.includes('tìm nhiều') ||
  lowerMessage.includes('cùng lúc') ||
  lowerMessage.includes('so sánh') ||
  lowerMessage.includes('đối chiếu') ||
  lowerMessage.includes('các loại') ||
  lowerMessage.includes('các sản phẩm') ||
  lowerMessage.match(/tìm.+và.+/) !== null ||
  // Thêm nhận diện khi tin nhắn chứa "tìm" và dấu phẩy
  lowerMessage.match(/tìm.+,.+/) !== null ||
  // Hoặc khi chứa từ tìm kiếm và chứa ít nhất 2 từ khoá sản phẩm
  lowerMessage.includes('tìm') && hasMultipleProductKeywords;

  // Nếu không có dấu hiệu tìm nhiều sản phẩm, kiểm tra thêm các trường hợp đặc biệt
  if (!hasMultiSearchIndicator) {
    // Kiểm tra xem có phải tin nhắn chỉ liệt kê các sản phẩm không, ví dụ: "nước giặt nước rửa chén"
    if (hasMultipleProductKeywords) {
      // Nếu có chứa ít nhất 2 từ khoá sản phẩm mà không có từ khoá tìm kiếm,
      // giả định là người dùng đang muốn tìm nhiều sản phẩm
      console.log("Phát hiện yêu cầu tìm nhiều sản phẩm từ danh sách từ khoá:", productKeywordsFound);
    } else {
      // Không phải tin nhắn tìm nhiều sản phẩm
      return null;
    }
  }

  // Common separators in Vietnamese queries
  const separators = [',', 'và', 'với', 'cùng với', ';', '+', 'so với', 'so sánh với'];

  // Try to split by common separators
  let parts = [];

  // Special handling for comparison queries
  if (lowerMessage.includes('so sánh') || lowerMessage.includes('đối chiếu')) {
    const comparisonTerms = ['so sánh', 'đối chiếu', 'so với', 'đối với', 'so', 'hơn', 'kém', 'thua'];

    // Extract the part after comparison keywords
    let cleanMessage = lowerMessage;
    for (const term of comparisonTerms) {
      if (lowerMessage.includes(term)) {
        const splitResult = lowerMessage.split(term);
        cleanMessage = splitResult.length > 1 && splitResult[1] ? splitResult[1].trim() : lowerMessage;
        break;
      }
    }

    // If we have a cleaner message after comparison terms, try to split it
    if (cleanMessage !== lowerMessage) {
      for (const separator of separators) {
        if (cleanMessage.includes(separator)) {
          if (separator === 'và') {
            parts = cleanMessage.split(/\s+và\s+/i).filter((p) => p.trim().length > 0);
          } else if (separator === 'với' || separator === 'so với' || separator === 'so sánh với') {
            // Special handling for 'với' as it can be part of other phrases
            parts = cleanMessage.split(/\s+(với|so với|so sánh với)\s+/i).filter((p) => p.trim().length > 0);
          } else {
            parts = cleanMessage.split(separator).filter((p) => p.trim().length > 0);
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
        if (separator === 'và') {
          parts = message.split(/\s+và\s+/i).filter((p) => p.trim().length > 0);
        } else if (separator === 'với' || separator === 'so với' || separator === 'so sánh với') {
          // Special handling for 'với' as it can be part of other phrases
          parts = message.split(/\s+(với|so với|so sánh với)\s+/i).filter((p) => p.trim().length > 0);
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
    let cleanMessage = lowerMessage.
    replace(/tìm kiếm/i, '').
    replace(/tìm/i, '').
    trim();

    // Thử phát hiện các sản phẩm dựa trên các từ khoá phổ biến
    parts = [];
    for (const keyword of productKeywordsFound) {
      // Tạo regex để lấy context xung quanh từ khoá
      const regex = new RegExp(`(\\w+\\s+)?(\\w+\\s+)?${keyword}(\\s+\\w+)?(\\s+\\w+)?`, 'i');
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
    const cleanMessage = lowerMessage.
    replace(/so sánh (giữa|của|về|giá|chất lượng|ưu điểm|nhược điểm) /i, '').
    replace(/so sánh/i, '').
    replace(/đối chiếu/i, '').
    replace(/tìm nhiều (sản phẩm|loại|thứ) (như|là|gồm|bao gồm|có)/i, '').
    replace(/tìm (các|những) (sản phẩm|loại|thứ) (như|là|gồm|bao gồm|có)/i, '').
    replace(/tìm (các|những|nhiều)/i, '').
    replace(/các loại/i, '').
    replace(/các sản phẩm/i, '').
    trim();

    // Re-attempt to split after cleaning
    for (const separator of separators) {
      if (cleanMessage.includes(separator)) {
        if (separator === 'và') {
          parts = cleanMessage.split(/\s+và\s+/i).filter((p) => p.trim().length > 0);
        } else if (separator === 'với' || separator === 'so với' || separator === 'so sánh với') {
          parts = cleanMessage.split(/\s+(với|so với|so sánh với)\s+/i).filter((p) => p.trim().length > 0);
        } else {
          parts = cleanMessage.split(separator).filter((p) => p.trim().length > 0);
        }
        break;
      }
    }

    // If we still couldn't split it, try looking for product categories or common products
    if (parts.length <= 1) {
      const commonCategories = [
      'rau', 'củ', 'quả', 'thịt', 'cá', 'hải sản', 'đồ uống', 'nước ngọt',
      'bia', 'rượu', 'bánh', 'kẹo', 'gia vị', 'dầu ăn', 'nước mắm', 'mì', 'bún',
      'nước giặt', 'nước rửa', 'nước tẩy'];


      // Try to identify categories in the message
      const categories = [];
      for (const category of commonCategories) {
        if (cleanMessage.includes(category)) {
          // Extract surrounding context (up to 2 words before and after)
          const regex = new RegExp(`(\\w+\\s+)?(\\w+\\s+)?${category}(\\s+\\w+)?(\\s+\\w+)?`, 'i');
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
    const sortedKeywords = [...commonProductKeywords].sort((a, b) => b.length - a.length);

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
          const regex = new RegExp(`(\\w+\\s+)?(\\w+\\s+)?${keyword}(\\s+\\w+)?(\\s+\\w+)?`, 'i');
          const match = remainingText.match(regex);
          if (match) {
            parts.push(match[0].trim());
            remainingText = remainingText.substring(index + keyword.length).trim();
          } else {
            parts.push(keyword);
            remainingText = remainingText.substring(index + keyword.length).trim();
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
    console.log("Cố gắng phân tích câu thông minh hơn - lowerMessage:", lowerMessage);

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
        const regex = new RegExp(`(\\w+\\s+)?(\\w+\\s+)?${keyword}(\\s+\\w+)?(\\s+\\w+)?`, 'i');
        const match = lowerMessage.match(regex);
        if (match) {
          detectedProducts.push(match[0].trim());
        }
      }
    }

    // Nếu phát hiện được từ 2 sản phẩm trở lên
    if (detectedProducts.length >= 2) {
      console.log("Phát hiện sản phẩm từ phân tích thông minh:", detectedProducts);
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
  const stopWords = ['tìm', 'kiếm', 'tìm kiếm', 'sản phẩm', 'loại', 'như', 'các', 'những', 'nhiều', 'cho', 'tôi'];

  for (const query of queries) {
    try {
      // Chuẩn hoá query dựa vào từ khoá
      let cleanQuery = query.toLowerCase().trim();

      // Loại bỏ các stopwords để tập trung vào tên sản phẩm
      for (const word of stopWords) {
        // Chỉ loại bỏ nếu từ đứng độc lập, không phải một phần của từ khác
        cleanQuery = cleanQuery.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
      }

      cleanQuery = cleanQuery.trim();

      console.log(`Tìm kiếm sản phẩm "${query}" (đã chuẩn hoá: "${cleanQuery}")`);

      // Sử dụng query đã chuẩn hoá để tìm kiếm
      const products = await searchProductsMongoDB(cleanQuery);

      if (products && products.length > 0) {
        results.push({
          query: query, // Giữ lại query gốc để hiển thị cho người dùng
          cleanQuery: cleanQuery, // Thêm query đã chuẩn hoá để debug
          products: products.slice(0, 5) // Limit to top 5 products per query
        });
      } else {
        // Thử lại với query gốc nếu query đã chuẩn hoá không có kết quả
        console.log(`Không tìm thấy kết quả với query đã chuẩn hoá, thử lại với query gốc: "${query}"`);
        const originalProducts = await searchProductsMongoDB(query);

        if (originalProducts && originalProducts.length > 0) {
          results.push({
            query: query,
            cleanQuery: null, // Đánh dấu là không sử dụng query đã chuẩn hoá
            products: originalProducts.slice(0, 5)
          });
        }
      }
    } catch (error) {
      console.error(`Lỗi khi tìm kiếm sản phẩm "${query}":`, error);
    }
  }

  return results;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXhpb3MiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9Qcm9kdWN0cyIsIl9kb3RlbnYiLCJfY2hpbGRfcHJvY2VzcyIsIl9wYXRoIiwiX2ZzIiwiX2NoYXRib3RQcm9kdWN0SGFuZGxlciIsIl9jaGF0Ym90RkFRSGFuZGxlciIsImRvdGVudiIsImNvbmZpZyIsImNvbnZlcnNhdGlvbkNvbnRleHQiLCJNYXAiLCJDT05URVhUX0VYUElSWV9USU1FIiwiZXh0cmFjdEluZ3JlZGllbnRzRnJvbVJlY2lwZSIsInJlY2lwZVJlc3BvbnNlIiwiY29tbW9uSW5ncmVkaWVudHMiLCJpbmdyZWRpZW50TGlzdFBhdHRlcm4iLCJpbmdyZWRpZW50cyIsIm1hdGNoIiwiZXhlYyIsImluZ3JlZGllbnQiLCJ0cmltIiwidG9Mb3dlckNhc2UiLCJwdXNoIiwibGVuZ3RoIiwibG93ZXJSZXNwb25zZSIsImluY2x1ZGVzIiwicmVnZXgiLCJSZWdFeHAiLCJpbmdyZWRpZW50TWF0Y2giLCJmdWxsTWF0Y2giLCJTZXQiLCJtYXAiLCJpbmciLCJyZXBsYWNlIiwiZmlsdGVyIiwic2F2ZUNvbnRleHQiLCJ1c2VySWQiLCJjb250ZXh0IiwiY3VycmVudENvbnRleHQiLCJnZXQiLCJjcmVhdGVkQXQiLCJEYXRlIiwibm93Iiwic2V0IiwidXBkYXRlZEF0IiwiY29uc29sZSIsImxvZyIsIkpTT04iLCJzdHJpbmdpZnkiLCJnZXRDb250ZXh0IiwiZGVsZXRlIiwiaGFuZGxlTWVzc2FnZSIsInJlcSIsInJlcyIsIm1lc3NhZ2UiLCJwcm9kdWN0SWQiLCJib2R5Iiwic3RhdHVzIiwianNvbiIsInN1Y2Nlc3MiLCJpc0luZ3JlZGllbnRSZXF1ZXN0IiwidGVzdCIsImxhc3RSZWNpcGUiLCJzdWJzdHJpbmciLCJtdWx0aVJlc3VsdHMiLCJoYW5kbGVNdWx0aVByb2R1Y3RTZWFyY2giLCJ0b3RhbFByb2R1Y3RzIiwicmVkdWNlIiwidG90YWwiLCJyZXN1bHQiLCJwcm9kdWN0cyIsInF1ZXJpZXNXaXRoUmVzdWx0cyIsInJlc3BvbnNlTWVzc2FnZSIsImxhc3RQcm9kdWN0cyIsImZsYXRNYXAiLCJtdWx0aVNlYXJjaFJlc3VsdHMiLCJsYXN0UHJvZHVjdCIsImxhc3RRdWVyeSIsInR5cGUiLCJkYXRhIiwidG90YWxSZXN1bHRzIiwibXVsdGlQcm9kdWN0UXVlcmllcyIsImRldGVjdE11bHRpUHJvZHVjdFNlYXJjaCIsInByb2R1Y3QiLCJQcm9kdWN0IiwiZmluZEJ5SWQiLCJwcm9kdWN0TmFtZSIsInByb2R1Y3RSZXNwb25zZSIsImhhbmRsZVByb2R1Y3RQYWdlUXVlc3Rpb24iLCJlcnJvciIsImlzQ29udGV4dERlcGVuZGVudCIsImNoZWNrQ29udGV4dERlcGVuZGVudFF1ZXJ5IiwiaGFzTGFzdFByb2R1Y3QiLCJyZXNwb25zZSIsImdlbmVyYXRlQ29udGV4dFJlc3BvbnNlIiwicHJvZHVjdFF1ZXN0aW9uIiwiY2hlY2tQcm9kdWN0QXZhaWxhYmlsaXR5UXVlc3Rpb24iLCJzZWFyY2hQcm9kdWN0c01vbmdvREIiLCJpbnRlbnQiLCJkZXRlY3RJbnRlbnQiLCJweVJlcyIsImF4aW9zIiwicG9zdCIsInF1ZXN0aW9uIiwiYW5zd2VyIiwicHJvZHVjdFJlc3VsdHMiLCJmYXFSZXNwb25zZSIsImhhbmRsZUZBUVF1ZXN0aW9uIiwiZXhwb3J0cyIsImhhbmRsZVJhc2FXZWJob29rIiwicmFzYVJlc3BvbnNlIiwicXVlcnkiLCJsb3dlclF1ZXJ5IiwicHJpY2VNYXRjaCIsInByaWNlSGlnaE1hdGNoIiwicHJpY2VCZXR3ZWVuTWF0Y2giLCJjb25kaXRpb25zIiwiaXNQcmljZVF1ZXJ5IiwibWF4UHJpY2UiLCJwYXJzZUludCIsIiRvciIsInByaWNlIiwiJGx0ZSIsInByb2R1Y3RQcmljZSIsIm1pblByaWNlIiwiJGd0ZSIsInNwZWNpZmljUGhyYXNlcyIsInBocmFzZSIsImNhdGVnb3J5IiwiZm91bmRTcGVjaWZpY1BocmFzZSIsIml0ZW0iLCIkcmVnZXgiLCIkb3B0aW9ucyIsImRlc2NyaXB0aW9uIiwiY2F0ZWdvcnlLZXl3b3JkcyIsImtleXdvcmRzIiwiZm91bmRDYXRlZ29yeSIsInNvbWUiLCJrZXl3b3JkIiwic3RvcFdvcmRzIiwid29yZHMiLCJzcGxpdCIsInByaWNlS2V5d29yZHMiLCJ3b3JkIiwiaXNWZWdldGFibGVTZWFyY2giLCJrdyIsImlzU3BlY2lhbENhdGVnb3J5U2VhcmNoIiwiZXZlcnkiLCJjYXRlZ29yeUluZGV4IiwiZmluZEluZGV4IiwiYyIsInNwbGljZSIsImtleXdvcmRDb25kaXRpb25zIiwiJGFuZCIsIk9iamVjdCIsImtleXMiLCJhbGxNYXRjaGVkUHJvZHVjdHMiLCJmaW5kIiwibGltaXQiLCJhZ2dyZWdhdGlvblBpcGVsaW5lIiwiJG1hdGNoIiwiJGFkZEZpZWxkcyIsIm1hdGNoU2NvcmUiLCIkYWRkIiwiJGNvbmQiLCIkcmVnZXhNYXRjaCIsImlucHV0Iiwib3B0aW9ucyIsImZsYXQiLCIkc29ydCIsIiRsaW1pdCIsImFnZ3JlZ2F0ZSIsImlzVmVnZXRhYmxlUXVlcnkiLCJwcm9kdWN0T2JqIiwidG9PYmplY3QiLCJuYW1lVGV4dCIsImRlc2NUZXh0Iiwic2NvcmUiLCJleGFjdFBocmFzZSIsImpvaW4iLCJzb3J0IiwiYSIsImIiLCJzbGljZSIsImxvd2VyTWVzc2FnZSIsImZhcUludGVudCIsImRldGVjdEZBUUludGVudCIsImlzQ29va2luZ1F1ZXN0aW9uIiwiY29udGV4dFBhdHRlcm5zIiwicGF0dGVybiIsInByb2R1Y3RBdmFpbGFiaWxpdHlQYXR0ZXJucyIsImNsZWFuUHJvZHVjdE5hbWUiLCJzdGFydHNXaXRoIiwicHJvZHVjdERldGFpbHMiLCJwcm9kdWN0Q2F0ZWdvcnkiLCJwcm9kdWN0SW50cm9kdWN0aW9uIiwib3JpZ2luYWxQcmljZSIsImRpc2NvdW50IiwicHJvZHVjdERpc2NvdW50IiwicHJvbW9QcmljZSIsInByb2R1Y3RQcm9tb1ByaWNlIiwiTWF0aCIsInJvdW5kIiwiZm9ybWF0Q3VycmVuY3kiLCJwcm9kdWN0T3JpZ2luIiwib3JpZ2luIiwicHJvZHVjdEJyYW5kIiwiZXhwaXJ5RGF0ZSIsImFtb3VudCIsInZhbGlkQW1vdW50IiwiTnVtYmVyIiwiSW50bCIsIk51bWJlckZvcm1hdCIsInN0eWxlIiwiY3VycmVuY3kiLCJtYXhpbXVtRnJhY3Rpb25EaWdpdHMiLCJmb3JtYXQiLCJjb29raW5nS2V5d29yZHMiLCJjb21tb25Qcm9kdWN0S2V5d29yZHMiLCJwcm9kdWN0S2V5d29yZHNGb3VuZCIsImhhc011bHRpcGxlUHJvZHVjdEtleXdvcmRzIiwiaGFzTXVsdGlTZWFyY2hJbmRpY2F0b3IiLCJzZXBhcmF0b3JzIiwicGFydHMiLCJjb21wYXJpc29uVGVybXMiLCJjbGVhbk1lc3NhZ2UiLCJ0ZXJtIiwic3BsaXRSZXN1bHQiLCJzZXBhcmF0b3IiLCJwIiwiY29tbW9uQ2F0ZWdvcmllcyIsImNhdGVnb3JpZXMiLCJyZW1haW5pbmdUZXh0Iiwic29ydGVkS2V5d29yZHMiLCJmb3VuZCIsImluZGV4IiwiaW5kZXhPZiIsImJlZm9yZVRleHQiLCJleHBhbmRlZEtleXdvcmRzIiwiZGV0ZWN0ZWRQcm9kdWN0cyIsInF1ZXJpZXMiLCJyZXN1bHRzIiwiY2xlYW5RdWVyeSIsIm9yaWdpbmFsUHJvZHVjdHMiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvQ29udHJvbGxlci9jaGF0Ym90Q29udHJvbGxlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBuby11c2VsZXNzLWVzY2FwZSAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1lbXB0eSAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycyAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlZiAqL1xyXG5cclxuaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJztcclxuaW1wb3J0IFByb2R1Y3QgZnJvbSBcIi4uL01vZGVsL1Byb2R1Y3RzLmpzXCI7XHJcbmltcG9ydCBkb3RlbnYgZnJvbSAnZG90ZW52JztcclxuaW1wb3J0IHsgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBmcyBmcm9tICdmcyc7XHJcbi8vIEltcG9ydCB44butIGzDvSBjw6J1IGjhu49pIHbhu4Egc+G6o24gcGjhuqltXHJcbmltcG9ydCB7IGhhbmRsZVByb2R1Y3RQYWdlUXVlc3Rpb24gfSBmcm9tICcuL2NoYXRib3RQcm9kdWN0SGFuZGxlci5qcyc7XHJcbmltcG9ydCB7IGhhbmRsZUZBUVF1ZXN0aW9uIH0gZnJvbSAnLi9jaGF0Ym90RkFRSGFuZGxlci5qcyc7XHJcblxyXG4vLyBMb2FkIGVudmlyb25tZW50IHZhcmlhYmxlc1xyXG5kb3RlbnYuY29uZmlnKCk7XHJcblxyXG4vLyBDYWNoZSDEkeG7gyBsxrB1IG5n4buvIGPhuqNuaCBjdeG7mWMgaOG7mWkgdGhv4bqhaSBjaG8gdOG7q25nIG5nxrDhu51pIGTDuW5nXHJcbmNvbnN0IGNvbnZlcnNhdGlvbkNvbnRleHQgPSBuZXcgTWFwKCk7XHJcblxyXG4vLyBUaOG7nWkgZ2lhbiBo4bq/dCBo4bqhbiBjaG8gbmfhu68gY+G6o25oICgxNSBwaMO6dCA9IDE1ICogNjAgKiAxMDAwIG1zKVxyXG5jb25zdCBDT05URVhUX0VYUElSWV9USU1FID0gMTUgKiA2MCAqIDEwMDA7XHJcblxyXG4vKipcclxuICogVHLDrWNoIHh14bqldCBuZ3V5w6puIGxp4buHdSB04burIGPDonUgdHLhuqMgbOG7nWkgY8O0bmcgdGjhu6ljIG7huqV1IMSDblxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVjaXBlUmVzcG9uc2UgLSBDw6J1IHRy4bqjIGzhu51pIGPDtG5nIHRo4bupYyBu4bqldSDEg25cclxuICogQHJldHVybnMge3N0cmluZ1tdfSAtIERhbmggc8OhY2ggbmd1ecOqbiBsaeG7h3UgxJHDoyB0csOtY2ggeHXhuqV0XHJcbiAqL1xyXG5jb25zdCBleHRyYWN0SW5ncmVkaWVudHNGcm9tUmVjaXBlID0gKHJlY2lwZVJlc3BvbnNlKSA9PiB7XHJcbiAgaWYgKCFyZWNpcGVSZXNwb25zZSkgcmV0dXJuIFtdO1xyXG4gIFxyXG4gIC8vIERhbmggc8OhY2ggbmd1ecOqbiBsaeG7h3UgcGjhu5UgYmnhur9uIMSR4buDIHTDrG0ga2nhur9tXHJcbiAgY29uc3QgY29tbW9uSW5ncmVkaWVudHMgPSBbXHJcbiAgICAndGjhu4t0JywgJ2PDoScsICdo4bqjaSBz4bqjbicsICdnw6AnLCAnYsOyJywgJ2hlbycsICd24buLdCcsICd0cuG7qW5nJywgJ2jhu5l0IHbhu4t0JywgJ2jhu5l0IGfDoCcsXHJcbiAgICAncmF1JywgJ2Phu6cnLCAncXXhuqMnLCAnY8OgIGNodWEnLCAnY8OgIHLhu5F0JywgJ2Lhuq9wIGPhuqNpJywgJ3jDoCBsw6FjaCcsICdow6BuaCcsICd04buPaScsICdn4burbmcnLFxyXG4gICAgJ+G7m3QnLCAndGnDqnUnLCAnbXXhu5FpJywgJ8SRxrDhu51uZycsICduxrDhu5tjIG3huq9tJywgJ2Thuqd1IMSDbicsICdk4bqndSBow6BvJywgJ27GsOG7m2MgdMawxqFuZycsIFxyXG4gICAgJ23DrCcsICdiw7puJywgJ3Bo4bufJywgJ21p4bq/bicsICdn4bqhbycsICdi4buZdCcsICdiw6FuaCcsICdr4bq5bycsXHJcbiAgICAnbsaw4bubYyBk4burYScsICdz4buvYScsICduxrDhu5tjJywgJ2JpYScsICdyxrDhu6N1J1xyXG4gIF07XHJcbiAgXHJcbiAgLy8gVOG6oW8gcGF0dGVybiDEkeG7gyB0w6xtIG5ndXnDqm4gbGnhu4d1IHThu6sgZGFuaCBzw6FjaCDEkcOhbmggc+G7kVxyXG4gIGNvbnN0IGluZ3JlZGllbnRMaXN0UGF0dGVybiA9IC9cXGQrXFwuXFxzKyhbXlxcZF0rPykoPz1cXG58JCkvZztcclxuICBsZXQgaW5ncmVkaWVudHMgPSBbXTtcclxuICBcclxuICAvLyBUw6xtIGtp4bq/bSBkYW5oIHPDoWNoIMSRw6FuaCBz4buRXHJcbiAgbGV0IG1hdGNoO1xyXG4gIHdoaWxlICgobWF0Y2ggPSBpbmdyZWRpZW50TGlzdFBhdHRlcm4uZXhlYyhyZWNpcGVSZXNwb25zZSkpICE9PSBudWxsKSB7XHJcbiAgICBjb25zdCBpbmdyZWRpZW50ID0gbWF0Y2hbMV0udHJpbSgpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICBpbmdyZWRpZW50cy5wdXNoKGluZ3JlZGllbnQpO1xyXG4gIH1cclxuICBcclxuICAvLyBO4bq/dSBraMO0bmcgdMOsbSB0aOG6pXkgZGFuaCBzw6FjaCDEkcOhbmggc+G7kSwgdMOsbSBraeG6v20gY8OhYyBuZ3V5w6puIGxp4buHdSBwaOG7lSBiaeG6v25cclxuICBpZiAoaW5ncmVkaWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICBjb25zdCBsb3dlclJlc3BvbnNlID0gcmVjaXBlUmVzcG9uc2UudG9Mb3dlckNhc2UoKTtcclxuICAgIFxyXG4gICAgZm9yIChjb25zdCBpbmdyZWRpZW50IG9mIGNvbW1vbkluZ3JlZGllbnRzKSB7XHJcbiAgICAgIGlmIChsb3dlclJlc3BvbnNlLmluY2x1ZGVzKGluZ3JlZGllbnQpKSB7XHJcbiAgICAgICAgLy8gVHLDrWNoIHh14bqldCBuZ3V5w6puIGxp4buHdSB2w6Agbmfhu68gY+G6o25oIHh1bmcgcXVhbmhcclxuICAgICAgICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAoYFxcXFxiJHtpbmdyZWRpZW50fVxcXFxiKFteLC47XSspP2AsICdnJyk7XHJcbiAgICAgICAgbGV0IGluZ3JlZGllbnRNYXRjaDtcclxuICAgICAgICBcclxuICAgICAgICB3aGlsZSAoKGluZ3JlZGllbnRNYXRjaCA9IHJlZ2V4LmV4ZWMobG93ZXJSZXNwb25zZSkpICE9PSBudWxsKSB7XHJcbiAgICAgICAgICBjb25zdCBmdWxsTWF0Y2ggPSBpbmdyZWRpZW50TWF0Y2hbMF0udHJpbSgpO1xyXG4gICAgICAgICAgaW5ncmVkaWVudHMucHVzaChmdWxsTWF0Y2gpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICBcclxuICAvLyBMb+G6oWkgYuG7jyB0csO5bmcgbOG6t3AgdsOgIHRpbmggY2jhu4luaFxyXG4gIGluZ3JlZGllbnRzID0gWy4uLm5ldyBTZXQoaW5ncmVkaWVudHMpXS5tYXAoaW5nID0+IHtcclxuICAgIC8vIExv4bqhaSBi4buPIHPhu5EgbMaw4bujbmcgdsOgIMSRxqFuIHbhu4tcclxuICAgIHJldHVybiBpbmcucmVwbGFjZSgvXFwoXFxkKy4qP1xcKS9nLCAnJylcclxuICAgICAgICAgICAgICAucmVwbGFjZSgvXFxkK1xccyooZ3xrZ3xtbHxsfG114buXbmd8dMOpcHxj4bunfHF14bqjKS9naSwgJycpXHJcbiAgICAgICAgICAgICAgLnJlcGxhY2UoL2tob+G6o25nL2dpLCAnJylcclxuICAgICAgICAgICAgICAudHJpbSgpO1xyXG4gIH0pLmZpbHRlcihpbmcgPT4gaW5nLmxlbmd0aCA+IDEpOyAvLyBMb+G6oWkgYuG7jyBjw6FjIG3hu6VjIHF1w6Egbmfhuq9uXHJcbiAgXHJcbiAgcmV0dXJuIGluZ3JlZGllbnRzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEzGsHUgbmfhu68gY+G6o25oIGN14buZYyBo4buZaSB0aG/huqFpXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1c2VySWQgLSBJRCBuZ8aw4budaSBkw7luZ1xyXG4gKiBAcGFyYW0ge29iamVjdH0gY29udGV4dCAtIEThu68gbGnhu4d1IG5n4buvIGPhuqNuaFxyXG4gKi9cclxuY29uc3Qgc2F2ZUNvbnRleHQgPSAodXNlcklkLCBjb250ZXh0KSA9PiB7XHJcbiAgaWYgKCF1c2VySWQpIHJldHVybjtcclxuICBcclxuICAvLyBM4bqleSBuZ+G7ryBj4bqjbmggaGnhu4duIHThuqFpIGhv4bq3YyB04bqhbyBt4bubaSBu4bq/dSBraMO0bmcgY8OzXHJcbiAgY29uc3QgY3VycmVudENvbnRleHQgPSBjb252ZXJzYXRpb25Db250ZXh0LmdldCh1c2VySWQpIHx8IHsgY3JlYXRlZEF0OiBEYXRlLm5vdygpIH07XHJcbiAgXHJcbiAgLy8gQ+G6rXAgbmjhuq10IG5n4buvIGPhuqNuaFxyXG4gIGNvbnZlcnNhdGlvbkNvbnRleHQuc2V0KHVzZXJJZCwge1xyXG4gICAgLi4uY3VycmVudENvbnRleHQsXHJcbiAgICAuLi5jb250ZXh0LFxyXG4gICAgdXBkYXRlZEF0OiBEYXRlLm5vdygpXHJcbiAgfSk7XHJcbiAgXHJcbiAgY29uc29sZS5sb2coYMSQw6MgbMawdSBuZ+G7ryBj4bqjbmggY2hvIHVzZXIgJHt1c2VySWR9OmAsIEpTT04uc3RyaW5naWZ5KGNvbnRleHQpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBM4bqleSBuZ+G7ryBj4bqjbmggY3Xhu5ljIGjhu5lpIHRob+G6oWlcclxuICogQHBhcmFtIHtzdHJpbmd9IHVzZXJJZCAtIElEIG5nxrDhu51pIGTDuW5nXHJcbiAqIEByZXR1cm5zIHtvYmplY3R8bnVsbH0gLSBE4buvIGxp4buHdSBuZ+G7ryBj4bqjbmggaG/hurdjIG51bGwgbuG6v3Uga2jDtG5nIGPDsy9o4bq/dCBo4bqhblxyXG4gKi9cclxuY29uc3QgZ2V0Q29udGV4dCA9ICh1c2VySWQpID0+IHtcclxuICBpZiAoIXVzZXJJZCkgcmV0dXJuIG51bGw7XHJcbiAgXHJcbiAgY29uc3QgY29udGV4dCA9IGNvbnZlcnNhdGlvbkNvbnRleHQuZ2V0KHVzZXJJZCk7XHJcbiAgaWYgKCFjb250ZXh0KSByZXR1cm4gbnVsbDtcclxuICBcclxuICAvLyBLaeG7g20gdHJhIHhlbSBuZ+G7ryBj4bqjbmggY8OzIGjhur90IGjhuqFuIGNoxrBhXHJcbiAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcclxuICBpZiAobm93IC0gY29udGV4dC51cGRhdGVkQXQgPiBDT05URVhUX0VYUElSWV9USU1FKSB7XHJcbiAgICAvLyBO4bq/dSBo4bq/dCBo4bqhbiwgeMOzYSBuZ+G7ryBj4bqjbmggdsOgIHRy4bqjIHbhu4EgbnVsbFxyXG4gICAgY29udmVyc2F0aW9uQ29udGV4dC5kZWxldGUodXNlcklkKTtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuICBcclxuICByZXR1cm4gY29udGV4dDtcclxufTtcclxuXHJcbi8vIEjDoG0geOG7rSBsw70gdGluIG5o4bqvbiB04burIG5nxrDhu51pIGTDuW5nXHJcbmV4cG9ydCBjb25zdCBoYW5kbGVNZXNzYWdlID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgbWVzc2FnZSwgdXNlcklkLCBwcm9kdWN0SWQgfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgIGlmICghbWVzc2FnZSkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiTWVzc2FnZSBpcyByZXF1aXJlZFwiXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjb25zb2xlLmxvZyhgTmjhuq1uIHRpbiBuaOG6r24gdOG7qyB1c2VyICR7dXNlcklkIHx8ICdhbm9ueW1vdXMnfTogXCIke21lc3NhZ2V9XCJgKTtcclxuICAgIGNvbnNvbGUubG9nKFwiVGjDtG5nIHRpbiBz4bqjbiBwaOG6qW0gxJFhbmcgeGVtIChwcm9kdWN0SWQpOlwiLCBwcm9kdWN0SWQpO1xyXG4gICAgXHJcbiAgICAvLyBLaeG7g20gdHJhIHhlbSBjw7MgcGjhuqNpIHnDqnUgY+G6p3UgduG7gSBuZ3V5w6puIGxp4buHdSB04burIGPDtG5nIHRo4bupYyB0csaw4bubYyDEkcOzXHJcbiAgICBjb25zdCBpc0luZ3JlZGllbnRSZXF1ZXN0ID0gL3TDrG0gKGPDoWMgKT9uZ3V5w6puIGxp4buHdXxuZ3V5w6puIGxp4buHdSAo4bufICk/dHLDqm58Y2jhu5cgbsOgbyAoY8OzICk/YsOhbnxtdWEgKOG7nyApP8SRw6J1L2kudGVzdChtZXNzYWdlKTtcclxuICAgIGlmIChpc0luZ3JlZGllbnRSZXF1ZXN0ICYmIHVzZXJJZCkge1xyXG4gICAgICBjb25zdCBjb250ZXh0ID0gZ2V0Q29udGV4dCh1c2VySWQpO1xyXG4gICAgICBcclxuICAgICAgaWYgKGNvbnRleHQgJiYgY29udGV4dC5sYXN0UmVjaXBlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJQaMOhdCBoaeG7h24gecOqdSBj4bqndSB0w6xtIG5ndXnDqm4gbGnhu4d1IHThu6sgY8O0bmcgdGjhu6ljIHRyxrDhu5tjOlwiLCBjb250ZXh0Lmxhc3RSZWNpcGUuc3Vic3RyaW5nKDAsIDUwKSArIFwiLi4uXCIpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFRyw61jaCB4deG6pXQgbmd1ecOqbiBsaeG7h3UgdOG7qyBjw7RuZyB0aOG7qWNcclxuICAgICAgICBjb25zdCBpbmdyZWRpZW50cyA9IGV4dHJhY3RJbmdyZWRpZW50c0Zyb21SZWNpcGUoY29udGV4dC5sYXN0UmVjaXBlKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkPDoWMgbmd1ecOqbiBsaeG7h3UgxJHGsOG7o2MgdHLDrWNoIHh14bqldDpcIiwgaW5ncmVkaWVudHMpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChpbmdyZWRpZW50cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAvLyBUw6xtIGtp4bq/bSBz4bqjbiBwaOG6qW0gdGhlbyB04burbmcgbmd1ecOqbiBsaeG7h3VcclxuICAgICAgICAgIGNvbnN0IG11bHRpUmVzdWx0cyA9IGF3YWl0IGhhbmRsZU11bHRpUHJvZHVjdFNlYXJjaChpbmdyZWRpZW50cyk7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGlmIChtdWx0aVJlc3VsdHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAvLyDEkOG6v20gdOG7lW5nIHPhu5Egc+G6o24gcGjhuqltIHTDrG0gxJHGsOG7o2NcclxuICAgICAgICAgICAgY29uc3QgdG90YWxQcm9kdWN0cyA9IG11bHRpUmVzdWx0cy5yZWR1Y2UoKHRvdGFsLCByZXN1bHQpID0+IHRvdGFsICsgKHJlc3VsdC5wcm9kdWN0cyA/IHJlc3VsdC5wcm9kdWN0cy5sZW5ndGggOiAwKSwgMCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyDEkOG6v20gc+G7kSBsxrDhu6NuZyBxdWVyaWVzIGPDsyBr4bq/dCBxdeG6o1xyXG4gICAgICAgICAgICBjb25zdCBxdWVyaWVzV2l0aFJlc3VsdHMgPSBtdWx0aVJlc3VsdHMuZmlsdGVyKHJlc3VsdCA9PiByZXN1bHQucHJvZHVjdHMgJiYgcmVzdWx0LnByb2R1Y3RzLmxlbmd0aCA+IDApLmxlbmd0aDtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFThuqFvIHRow7RuZyBiw6FvIHBow7kgaOG7o3BcclxuICAgICAgICAgICAgbGV0IHJlc3BvbnNlTWVzc2FnZSA9IFwiXCI7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAocXVlcmllc1dpdGhSZXN1bHRzID09PSBpbmdyZWRpZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICByZXNwb25zZU1lc3NhZ2UgPSBgVMO0aSDEkcOjIHTDrG0gdGjhuqV5ICR7dG90YWxQcm9kdWN0c30gc+G6o24gcGjhuqltIHBow7kgaOG7o3AgduG7m2kgJHtpbmdyZWRpZW50cy5sZW5ndGh9IG5ndXnDqm4gbGnhu4d1IHThu6sgY8O0bmcgdGjhu6ljOmA7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocXVlcmllc1dpdGhSZXN1bHRzID4gMCkge1xyXG4gICAgICAgICAgICAgIHJlc3BvbnNlTWVzc2FnZSA9IGBUw7RpIHTDrG0gdGjhuqV5IHPhuqNuIHBo4bqpbSBwaMO5IGjhu6NwIHbhu5tpICR7cXVlcmllc1dpdGhSZXN1bHRzfS8ke2luZ3JlZGllbnRzLmxlbmd0aH0gbmd1ecOqbiBsaeG7h3UgdOG7qyBjw7RuZyB0aOG7qWM6YDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICByZXNwb25zZU1lc3NhZ2UgPSBcIlLhuqV0IHRp4bq/YywgdMO0aSBraMO0bmcgdMOsbSB0aOG6pXkgc+G6o24gcGjhuqltIHBow7kgaOG7o3AgduG7m2kgY8OhYyBuZ3V5w6puIGxp4buHdSB04burIGPDtG5nIHRo4bupYy4gQuG6oW4gY8OzIHRo4buDIHRo4butIGzhuqFpIHbhu5tpIHThu6sga2jDs2Ega2jDoWMga2jDtG5nP1wiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBMxrB1IGvhur90IHF14bqjIHTDrG0ga2nhur9tIHbDoG8gbmfhu68gY+G6o25oXHJcbiAgICAgICAgICAgIGNvbnN0IGxhc3RQcm9kdWN0cyA9IG11bHRpUmVzdWx0cy5mbGF0TWFwKHJlc3VsdCA9PiByZXN1bHQucHJvZHVjdHMgfHwgW10pO1xyXG4gICAgICAgICAgICBzYXZlQ29udGV4dCh1c2VySWQsIHsgXHJcbiAgICAgICAgICAgICAgbXVsdGlTZWFyY2hSZXN1bHRzOiBtdWx0aVJlc3VsdHMsXHJcbiAgICAgICAgICAgICAgbGFzdFByb2R1Y3RzOiBsYXN0UHJvZHVjdHMubGVuZ3RoID4gMCA/IGxhc3RQcm9kdWN0cyA6IG51bGwsXHJcbiAgICAgICAgICAgICAgbGFzdFByb2R1Y3Q6IGxhc3RQcm9kdWN0cy5sZW5ndGggPiAwID8gbGFzdFByb2R1Y3RzWzBdIDogbnVsbCxcclxuICAgICAgICAgICAgICBsYXN0UXVlcnk6IG1lc3NhZ2UgXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgIHR5cGU6ICdtdWx0aVByb2R1Y3RTZWFyY2gnLFxyXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IHJlc3BvbnNlTWVzc2FnZSxcclxuICAgICAgICAgICAgICBkYXRhOiBtdWx0aVJlc3VsdHMsXHJcbiAgICAgICAgICAgICAgdG90YWxSZXN1bHRzOiB0b3RhbFByb2R1Y3RzXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgICAgICAgICAgICBtZXNzYWdlOiBcIlLhuqV0IHRp4bq/YywgdMO0aSBraMO0bmcgdMOsbSB0aOG6pXkgc+G6o24gcGjhuqltIHBow7kgaOG7o3AgduG7m2kgY8OhYyBuZ3V5w6puIGxp4buHdSB04burIGPDtG5nIHRo4bupYy4gQuG6oW4gY8OzIHRo4buDIHTDrG0ga2nhur9tIHRy4buxYyB0aeG6v3AgYuG6sW5nIHThu6tuZyBuZ3V5w6puIGxp4buHdSBj4bulIHRo4buDLlwiXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICB0eXBlOiAndGV4dCcsXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiVMO0aSBraMO0bmcgdGjhu4MgdHLDrWNoIHh14bqldCDEkcaw4bujYyBuZ3V5w6puIGxp4buHdSB04burIGPDtG5nIHRo4bupYyB0csaw4bubYyDEkcOzLiBC4bqhbiBjw7MgdGjhu4MgY2hvIHTDtGkgYmnhur90IGPhu6UgdGjhu4Mgbmd1ecOqbiBsaeG7h3UgYuG6oW4gxJFhbmcgdMOsbSBraeG6v20ga2jDtG5nP1wiXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gS2nhu4NtIHRyYSB4ZW0gY8OzIHBo4bqjaSB5w6p1IGPhuqd1IHTDrG0gbmhp4buBdSBz4bqjbiBwaOG6qW0gY8O5bmcgbMO6YyBraMO0bmdcclxuICAgIGNvbnN0IG11bHRpUHJvZHVjdFF1ZXJpZXMgPSBkZXRlY3RNdWx0aVByb2R1Y3RTZWFyY2gobWVzc2FnZSk7XHJcbiAgICBpZiAobXVsdGlQcm9kdWN0UXVlcmllcykge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlBow6F0IGhp4buHbiB5w6p1IGPhuqd1IHTDrG0gbmhp4buBdSBz4bqjbiBwaOG6qW0gY8O5bmcgbMO6YzpcIiwgbXVsdGlQcm9kdWN0UXVlcmllcyk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zdCBtdWx0aVJlc3VsdHMgPSBhd2FpdCBoYW5kbGVNdWx0aVByb2R1Y3RTZWFyY2gobXVsdGlQcm9kdWN0UXVlcmllcyk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAobXVsdGlSZXN1bHRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAvLyDEkOG6v20gdOG7lW5nIHPhu5Egc+G6o24gcGjhuqltIHTDrG0gxJHGsOG7o2NcclxuICAgICAgICBjb25zdCB0b3RhbFByb2R1Y3RzID0gbXVsdGlSZXN1bHRzLnJlZHVjZSgodG90YWwsIHJlc3VsdCkgPT4gdG90YWwgKyAocmVzdWx0LnByb2R1Y3RzID8gcmVzdWx0LnByb2R1Y3RzLmxlbmd0aCA6IDApLCAwKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDEkOG6v20gc+G7kSBsxrDhu6NuZyBxdWVyaWVzIGPDsyBr4bq/dCBxdeG6o1xyXG4gICAgICAgIGNvbnN0IHF1ZXJpZXNXaXRoUmVzdWx0cyA9IG11bHRpUmVzdWx0cy5maWx0ZXIocmVzdWx0ID0+IHJlc3VsdC5wcm9kdWN0cyAmJiByZXN1bHQucHJvZHVjdHMubGVuZ3RoID4gMCkubGVuZ3RoO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFThuqFvIHRow7RuZyBiw6FvIHBow7kgaOG7o3BcclxuICAgICAgICBsZXQgcmVzcG9uc2VNZXNzYWdlID0gXCJcIjtcclxuICAgICAgICBcclxuICAgICAgICBpZiAocXVlcmllc1dpdGhSZXN1bHRzID09PSBtdWx0aVByb2R1Y3RRdWVyaWVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgLy8gVMOsbSB0aOG6pXkga+G6v3QgcXXhuqMgY2hvIHThuqV0IGPhuqMgY8OhYyB0cnV5IHbhuqVuXHJcbiAgICAgICAgICByZXNwb25zZU1lc3NhZ2UgPSBgVMO0aSDEkcOjIHTDrG0gdGjhuqV5ICR7dG90YWxQcm9kdWN0c30gc+G6o24gcGjhuqltIHBow7kgaOG7o3AgduG7m2kgJHttdWx0aVByb2R1Y3RRdWVyaWVzLmxlbmd0aH0gbG/huqFpIGLhuqFuIHnDqnUgY+G6p3U6YDtcclxuICAgICAgICB9IGVsc2UgaWYgKHF1ZXJpZXNXaXRoUmVzdWx0cyA+IDApIHtcclxuICAgICAgICAgIC8vIENo4buJIHTDrG0gdGjhuqV5IGvhur90IHF14bqjIGNobyBt4buZdCBz4buRIHRydXkgduG6pW5cclxuICAgICAgICAgIHJlc3BvbnNlTWVzc2FnZSA9IGBUw7RpIHTDrG0gdGjhuqV5IHPhuqNuIHBo4bqpbSBwaMO5IGjhu6NwIHbhu5tpICR7cXVlcmllc1dpdGhSZXN1bHRzfS8ke211bHRpUHJvZHVjdFF1ZXJpZXMubGVuZ3RofSBsb+G6oWkgYuG6oW4gecOqdSBj4bqndTpgO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAvLyBLaMO0bmcgdMOsbSB0aOG6pXkga+G6v3QgcXXhuqMgbsOgb1xyXG4gICAgICAgICAgcmVzcG9uc2VNZXNzYWdlID0gXCJUw7RpIGtow7RuZyB0w6xtIHRo4bqleSBz4bqjbiBwaOG6qW0gbsOgbyBwaMO5IGjhu6NwIHbhu5tpIHnDqnUgY+G6p3UgY+G7p2EgYuG6oW4uIELhuqFuIGPDsyB0aOG7gyB0aOG7rSBs4bqhaSB24bubaSB04burIGtow7NhIGtow6FjIGtow7RuZz9cIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gTMawdSBr4bq/dCBxdeG6oyB0w6xtIGtp4bq/bSB2w6BvIG5n4buvIGPhuqNuaCBu4bq/dSBjw7MgdXNlcklkXHJcbiAgICAgICAgaWYgKHVzZXJJZCkge1xyXG4gICAgICAgICAgY29uc3QgbGFzdFByb2R1Y3RzID0gbXVsdGlSZXN1bHRzLmZsYXRNYXAocmVzdWx0ID0+IHJlc3VsdC5wcm9kdWN0cyB8fCBbXSk7XHJcbiAgICAgICAgICBzYXZlQ29udGV4dCh1c2VySWQsIHsgXHJcbiAgICAgICAgICAgIG11bHRpU2VhcmNoUmVzdWx0czogbXVsdGlSZXN1bHRzLFxyXG4gICAgICAgICAgICBsYXN0UHJvZHVjdHM6IGxhc3RQcm9kdWN0cy5sZW5ndGggPiAwID8gbGFzdFByb2R1Y3RzIDogbnVsbCxcclxuICAgICAgICAgICAgbGFzdFByb2R1Y3Q6IGxhc3RQcm9kdWN0cy5sZW5ndGggPiAwID8gbGFzdFByb2R1Y3RzWzBdIDogbnVsbCxcclxuICAgICAgICAgICAgbGFzdFF1ZXJ5OiBtZXNzYWdlIFxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgdHlwZTogJ211bHRpUHJvZHVjdFNlYXJjaCcsXHJcbiAgICAgICAgICBtZXNzYWdlOiByZXNwb25zZU1lc3NhZ2UsXHJcbiAgICAgICAgICBkYXRhOiBtdWx0aVJlc3VsdHMsXHJcbiAgICAgICAgICB0b3RhbFJlc3VsdHM6IHRvdGFsUHJvZHVjdHNcclxuICAgICAgICB9KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgICAgICAgIG1lc3NhZ2U6IFwiUuG6pXQgdGnhur9jLCB0w7RpIGtow7RuZyB0w6xtIHRo4bqleSBz4bqjbiBwaOG6qW0gbsOgbyBwaMO5IGjhu6NwIHbhu5tpIGPDoWMgdGnDqnUgY2jDrSB0w6xtIGtp4bq/bSBj4bunYSBi4bqhbi4gQuG6oW4gY8OzIHRo4buDIHRo4butIGzhuqFpIHbhu5tpIGPDoWMgdOG7qyBraMOzYSBraMOhYyBraMO0bmc/XCJcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBY4butIGzDvSBjw6J1IGjhu49pIHbhu4Egc+G6o24gcGjhuqltIGhp4buHbiB04bqhaSBu4bq/dSBjw7MgcHJvZHVjdElkXHJcbiAgICBpZiAocHJvZHVjdElkKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgLy8gVMOsbSB0aMO0bmcgdGluIHPhuqNuIHBo4bqpbSB04burIGRhdGFiYXNlXHJcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IGF3YWl0IFByb2R1Y3QuZmluZEJ5SWQocHJvZHVjdElkKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAocHJvZHVjdCkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coYMSQYW5nIHjhu60gbMO9IGPDonUgaOG7j2kgduG7gSBz4bqjbiBwaOG6qW06ICR7cHJvZHVjdC5wcm9kdWN0TmFtZX1gKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gTMawdSBz4bqjbiBwaOG6qW0gdsOgbyBuZ+G7ryBj4bqjbmhcclxuICAgICAgICAgIHNhdmVDb250ZXh0KHVzZXJJZCwgeyBsYXN0UHJvZHVjdDogcHJvZHVjdCB9KTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gWOG7rSBsw70gY8OidSBo4buPaSB24buBIHPhuqNuIHBo4bqpbSBoaeG7h24gdOG6oWlcclxuICAgICAgICAgIGNvbnN0IHByb2R1Y3RSZXNwb25zZSA9IGF3YWl0IGhhbmRsZVByb2R1Y3RQYWdlUXVlc3Rpb24obWVzc2FnZSwgcHJvZHVjdCk7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGlmIChwcm9kdWN0UmVzcG9uc2UgJiYgcHJvZHVjdFJlc3BvbnNlLnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJQaOG6o24gaOG7k2kgdOG7qyB44butIGzDvSBjw6J1IGjhu49pIHPhuqNuIHBo4bqpbTpcIiwgcHJvZHVjdFJlc3BvbnNlLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24ocHJvZHVjdFJlc3BvbnNlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSB44butIGzDvSBjw6J1IGjhu49pIHbhu4Egc+G6o24gcGjhuqltOlwiLCBlcnJvcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gS2nhu4NtIHRyYSB4ZW0gY8OzIHBo4bqjaSBjw6J1IGjhu49pIHBo4bulIHRodeG7mWMgbmfhu68gY+G6o25oIHPhuqNuIHBo4bqpbSB0csaw4bubYyDEkcOzIGtow7RuZ1xyXG4gICAgY29uc3QgaXNDb250ZXh0RGVwZW5kZW50ID0gY2hlY2tDb250ZXh0RGVwZW5kZW50UXVlcnkobWVzc2FnZSk7XHJcbiAgICBjb25zb2xlLmxvZyhcIktp4buDbSB0cmEgY8OidSBo4buPaSBwaOG7pSB0aHXhu5ljIG5n4buvIGPhuqNuaDpcIiwgaXNDb250ZXh0RGVwZW5kZW50KTtcclxuICAgIFxyXG4gICAgaWYgKGlzQ29udGV4dERlcGVuZGVudCAmJiB1c2VySWQpIHtcclxuICAgICAgY29uc3QgY29udGV4dCA9IGdldENvbnRleHQodXNlcklkKTtcclxuICAgICAgY29uc29sZS5sb2coXCJOZ+G7ryBj4bqjbmggaGnhu4duIHThuqFpOlwiLCBjb250ZXh0ID8gSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgIGhhc0xhc3RQcm9kdWN0OiAhIWNvbnRleHQubGFzdFByb2R1Y3QsXHJcbiAgICAgICAgcHJvZHVjdE5hbWU6IGNvbnRleHQubGFzdFByb2R1Y3QgPyBjb250ZXh0Lmxhc3RQcm9kdWN0LnByb2R1Y3ROYW1lIDogbnVsbCxcclxuICAgICAgICBsYXN0UXVlcnk6IGNvbnRleHQubGFzdFF1ZXJ5IHx8IG51bGxcclxuICAgICAgfSkgOiBcIktow7RuZyBjw7Mgbmfhu68gY+G6o25oXCIpO1xyXG4gICAgICBcclxuICAgICAgaWYgKGNvbnRleHQgJiYgY29udGV4dC5sYXN0UHJvZHVjdCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBQaMOhdCBoaeG7h24gY8OidSBo4buPaSBwaOG7pSB0aHXhu5ljIG5n4buvIGPhuqNuaCB24buBIHPhuqNuIHBo4bqpbTogJHtjb250ZXh0Lmxhc3RQcm9kdWN0LnByb2R1Y3ROYW1lfWApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFjhu60gbMO9IGPDonUgaOG7j2kgZOG7sWEgdHLDqm4gc+G6o24gcGjhuqltIHRyb25nIG5n4buvIGPhuqNuaFxyXG4gICAgICAgIGNvbnN0IHByb2R1Y3RSZXNwb25zZSA9IGF3YWl0IGhhbmRsZVByb2R1Y3RQYWdlUXVlc3Rpb24obWVzc2FnZSwgY29udGV4dC5sYXN0UHJvZHVjdCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHByb2R1Y3RSZXNwb25zZSAmJiBwcm9kdWN0UmVzcG9uc2Uuc3VjY2Vzcykge1xyXG4gICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHByb2R1Y3RSZXNwb25zZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIE7hur91IGtow7RuZyB44butIGzDvSDEkcaw4bujYyBi4bqxbmcgaGFuZGxlUHJvZHVjdFBhZ2VRdWVzdGlvbiwgdOG6oW8gY8OidSB0cuG6oyBs4budaSBk4buxYSB0csOqbiB0aHXhu5ljIHTDrW5oIHPhuqNuIHBo4bqpbVxyXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gZ2VuZXJhdGVDb250ZXh0UmVzcG9uc2UobWVzc2FnZSwgY29udGV4dC5sYXN0UHJvZHVjdCk7XHJcbiAgICAgICAgaWYgKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24ocmVzcG9uc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyDEkOG7kWkgduG7m2kgY8OidSBo4buPaSBcIkPDsyBz4bqjbiBwaOG6qW0gWCBraMO0bmc/XCJcclxuICAgIGNvbnN0IHByb2R1Y3RRdWVzdGlvbiA9IGNoZWNrUHJvZHVjdEF2YWlsYWJpbGl0eVF1ZXN0aW9uKG1lc3NhZ2UpO1xyXG4gICAgaWYgKHByb2R1Y3RRdWVzdGlvbikge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIC8vIFTDrG0ga2nhur9tIHPhuqNuIHBo4bqpbSBk4buxYSB0csOqbiB0w6puIHPhuqNuIHBo4bqpbSDEkcaw4bujYyB0csOtY2ggeHXhuqV0XHJcbiAgICAgICAgY29uc3QgcHJvZHVjdHMgPSBhd2FpdCBzZWFyY2hQcm9kdWN0c01vbmdvREIocHJvZHVjdFF1ZXN0aW9uKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAocHJvZHVjdHMgJiYgcHJvZHVjdHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgLy8gTMawdSBz4bqjbiBwaOG6qW0gxJHhuqd1IHRpw6puIHbDoG8gbmfhu68gY+G6o25oIMSR4buDIHPhu60gZOG7pW5nIGNobyBjw6J1IGjhu49pIHRp4bq/cCB0aGVvXHJcbiAgICAgICAgICBzYXZlQ29udGV4dCh1c2VySWQsIHsgbGFzdFByb2R1Y3Q6IHByb2R1Y3RzWzBdLCBsYXN0UHJvZHVjdHM6IHByb2R1Y3RzIH0pO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICB0eXBlOiAnY2F0ZWdvcnlRdWVyeScsXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBDaMO6bmcgdMO0aSBjw7MgJHtwcm9kdWN0cy5sZW5ndGh9IHPhuqNuIHBo4bqpbSBwaMO5IGjhu6NwOmAsXHJcbiAgICAgICAgICAgIGRhdGE6IHByb2R1Y3RzXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBgUuG6pXQgdGnhur9jLCBjaMO6bmcgdMO0aSBoaeG7h24ga2jDtG5nIGPDsyBz4bqjbiBwaOG6qW0gXCIke3Byb2R1Y3RRdWVzdGlvbn1cIiB0cm9uZyBraG8uIELhuqFuIGPDsyB0aOG7gyB4ZW0gY8OhYyBz4bqjbiBwaOG6qW0gdMawxqFuZyB04buxIGtow6FjIGtow7RuZz9gXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSB0w6xtIGtp4bq/bSBz4bqjbiBwaOG6qW06XCIsIGVycm9yKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBUaeG6v3AgdOG7pWMgeOG7rSBsw70gY8OhYyBpbnRlbnQga2jDoWMgbuG6v3Uga2jDtG5nIHBo4bqjaSBjw6J1IGjhu49pIHbhu4Egc+G6o24gcGjhuqltIGhp4buHbiB04bqhaVxyXG4gICAgLy8gUGjDoXQgaGnhu4duIGludGVudCB04burIHRpbiBuaOG6r25cclxuICAgIGNvbnN0IGludGVudCA9IGRldGVjdEludGVudChtZXNzYWdlKTtcclxuICAgIGNvbnNvbGUubG9nKFwiSW50ZW50IMSRxrDhu6NjIHBow6F0IGhp4buHbjpcIiwgaW50ZW50KTtcclxuICAgIFxyXG4gICAgLy8gWOG7rSBsw70gZOG7sWEgdHLDqm4gaW50ZW50XHJcbiAgICBsZXQgcmVzcG9uc2U7XHJcbiAgICBzd2l0Y2ggKGludGVudCkge1xyXG4gICAgICBjYXNlICdncmVldGluZyc6XHJcbiAgICAgICAgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgbWVzc2FnZTogXCJYaW4gY2jDoG8hIFTDtGkgbMOgIHRy4bujIGzDvSDhuqNvIGPhu6dhIGPhu61hIGjDoG5nLiBUw7RpIGPDsyB0aOG7gyBnacO6cCBnw6wgY2hvIGLhuqFuP1wiXHJcbiAgICAgICAgfTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgICBcclxuICAgICAgY2FzZSAncHJpY2UnOlxyXG4gICAgICAgIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgICAgICAgIG1lc3NhZ2U6IFwixJDhu4MgYmnhur90IGdpw6EgY+G7pSB0aOG7gyBj4bunYSBz4bqjbiBwaOG6qW0sIHZ1aSBsw7JuZyBjaG8gdMO0aSBiaeG6v3QgYuG6oW4gcXVhbiB0w6JtIMSR4bq/biBz4bqjbiBwaOG6qW0gbsOgbz9cIlxyXG4gICAgICAgIH07XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgXHJcbiAgICAgIGNhc2UgJ2Nvb2tpbmdfcmVjaXBlJzpcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgLy8gR+G7jWkgQVBJIFB5dGhvbiBiYWNrZW5kIMSR4buDIGzhuqV5IGPDtG5nIHRo4bupYyBu4bqldSDEg25cclxuICAgICAgICAgIGNvbnN0IHB5UmVzID0gYXdhaXQgYXhpb3MucG9zdCgnaHR0cDovL2xvY2FsaG9zdDo1MDAwL2FwaS9jaGF0Ym90L2FzaycsIHsgcXVlc3Rpb246IG1lc3NhZ2UgfSk7XHJcbiAgICAgICAgICBpZiAocHlSZXMuZGF0YSAmJiBweVJlcy5kYXRhLmFuc3dlcikge1xyXG4gICAgICAgICAgICAvLyBMxrB1IGPDtG5nIHRo4bupYyB2w6BvIG5n4buvIGPhuqNuaCDEkeG7gyBz4butIGThu6VuZyBzYXUgbsOgeVxyXG4gICAgICAgICAgICBpZiAodXNlcklkKSB7XHJcbiAgICAgICAgICAgICAgc2F2ZUNvbnRleHQodXNlcklkLCB7IGxhc3RSZWNpcGU6IHB5UmVzLmRhdGEuYW5zd2VyLCBsYXN0UXVlcnk6IG1lc3NhZ2UgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXHJcbiAgICAgICAgICAgICAgbWVzc2FnZTogcHlSZXMuZGF0YS5hbnN3ZXJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBcIlhpbiBs4buXaSwgdMO0aSBraMO0bmcgdMOsbSB0aOG6pXkgY8O0bmcgdGjhu6ljIHBow7kgaOG7o3AuXCJcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgbOG6pXkgY8O0bmcgdGjhu6ljIG7huqV1IMSDbjpcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgICAgICAgICAgbWVzc2FnZTogXCJYaW4gbOG7l2ksIMSRw6MgY8OzIGzhu5dpIHjhuqN5IHJhIGtoaSBs4bqleSBjw7RuZyB0aOG7qWMgbuG6pXUgxINuLlwiXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuICAgICAgICBcclxuICAgICAgY2FzZSAncHJvZHVjdCc6XHJcbiAgICAgICAgLy8gVMOsbSBraeG6v20gc+G6o24gcGjhuqltXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIC8vIFPhu60gZOG7pW5nIE1vbmdvREIgxJHhu4MgdMOsbSBraeG6v20gdGhheSB2w6wgUHl0aG9uXHJcbiAgICAgICAgICBjb25zdCBwcm9kdWN0UmVzdWx0cyA9IGF3YWl0IHNlYXJjaFByb2R1Y3RzTW9uZ29EQihtZXNzYWdlKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgaWYgKHByb2R1Y3RSZXN1bHRzICYmIHByb2R1Y3RSZXN1bHRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgLy8gTMawdSBz4bqjbiBwaOG6qW0gxJHhuqd1IHRpw6puIHbDoG8gbmfhu68gY+G6o25oXHJcbiAgICAgICAgICAgIGlmICh1c2VySWQpIHtcclxuICAgICAgICAgICAgICBzYXZlQ29udGV4dCh1c2VySWQsIHsgXHJcbiAgICAgICAgICAgICAgICBsYXN0UHJvZHVjdDogcHJvZHVjdFJlc3VsdHNbMF0sIFxyXG4gICAgICAgICAgICAgICAgbGFzdFByb2R1Y3RzOiBwcm9kdWN0UmVzdWx0cyxcclxuICAgICAgICAgICAgICAgIGxhc3RRdWVyeTogbWVzc2FnZSBcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgxJDDoyBsxrB1IHPhuqNuIHBo4bqpbSBcIiR7cHJvZHVjdFJlc3VsdHNbMF0ucHJvZHVjdE5hbWV9XCIgdsOgbyBuZ+G7ryBj4bqjbmggY2hvIHVzZXIgJHt1c2VySWR9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICB0eXBlOiAnY2F0ZWdvcnlRdWVyeScsXHJcbiAgICAgICAgICAgICAgbWVzc2FnZTogXCLEkMOieSBsw6AgbeG7mXQgc+G7kSBz4bqjbiBwaOG6qW0gcGjDuSBo4bujcCB24bubaSB5w6p1IGPhuqd1IGPhu6dhIGLhuqFuOlwiLFxyXG4gICAgICAgICAgICAgIGRhdGE6IHByb2R1Y3RSZXN1bHRzXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXHJcbiAgICAgICAgICAgICAgbWVzc2FnZTogXCJS4bqldCB0aeG6v2MsIHTDtGkga2jDtG5nIHTDrG0gdGjhuqV5IHPhuqNuIHBo4bqpbSBwaMO5IGjhu6NwIHbhu5tpIHnDqnUgY+G6p3UgY+G7p2EgYuG6oW4uIELhuqFuIGPDsyB0aOG7gyBtw7QgdOG6oyBjaGkgdGnhur90IGjGoW4ga2jDtG5nP1wiXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgdMOsbSBraeG6v20gc+G6o24gcGjhuqltOlwiLCBlcnJvcik7XHJcbiAgICAgICAgICByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBcIsSQw6MgeOG6o3kgcmEgbOG7l2kga2hpIHTDrG0ga2nhur9tIHPhuqNuIHBo4bqpbS4gVnVpIGzDsm5nIHRo4butIGzhuqFpIHNhdS5cIlxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIFxyXG4gICAgICAvLyBY4butIGzDvSBjw6FjIGPDonUgaOG7j2kgdGjGsOG7nW5nIGfhurdwIChGQVEpXHJcbiAgICAgIGNhc2UgJ2ZhcV9ob3dfdG9fYnV5JzpcclxuICAgICAgY2FzZSAnZmFxX2hvd190b19vcmRlcic6XHJcbiAgICAgIGNhc2UgJ2ZhcV9wYXltZW50X21ldGhvZHMnOlxyXG4gICAgICBjYXNlICdmYXFfc3RvcmVfbG9jYXRpb24nOlxyXG4gICAgICBjYXNlICdmYXFfcHJvZHVjdF9xdWFsaXR5JzpcclxuICAgICAgY2FzZSAnZmFxX3NoaXBwaW5nX3RpbWUnOlxyXG4gICAgICBjYXNlICdmYXFfcmV0dXJuX3BvbGljeSc6XHJcbiAgICAgIGNhc2UgJ2ZhcV9wcm9tb3Rpb25zJzpcclxuICAgICAgY2FzZSAnZmFxX3RyZW5kaW5nX3Byb2R1Y3RzJzpcclxuICAgICAgY2FzZSAnZmFxX3NoaXBwaW5nX2ZlZSc6XHJcbiAgICAgIGNhc2UgJ2ZhcV9jdXN0b21lcl9zdXBwb3J0JzpcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgLy8gR+G7jWkgaMOgbSB44butIGzDvSBGQVFcclxuICAgICAgICAgIGNvbnN0IGZhcVJlc3BvbnNlID0gaGFuZGxlRkFRUXVlc3Rpb24oaW50ZW50KTtcclxuICAgICAgICAgIGlmIChmYXFSZXNwb25zZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oZmFxUmVzcG9uc2UpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIHjhu60gbMO9IGPDonUgaOG7j2kgRkFROlwiLCBlcnJvcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICAgIFxyXG4gICAgICBjYXNlICd1bmtub3duJzpcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgLy8gVGjhu60gdMOsbSBraeG6v20gc+G6o24gcGjhuqltIHRy4buxYyB0aeG6v3BcclxuICAgICAgICAgIGNvbnN0IHByb2R1Y3RzID0gYXdhaXQgc2VhcmNoUHJvZHVjdHNNb25nb0RCKG1lc3NhZ2UpO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBpZiAocHJvZHVjdHMgJiYgcHJvZHVjdHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAvLyBMxrB1IHPhuqNuIHBo4bqpbSDEkeG6p3UgdGnDqm4gdsOgbyBuZ+G7ryBj4bqjbmhcclxuICAgICAgICAgICAgaWYgKHVzZXJJZCkge1xyXG4gICAgICAgICAgICAgIHNhdmVDb250ZXh0KHVzZXJJZCwgeyBcclxuICAgICAgICAgICAgICAgIGxhc3RQcm9kdWN0OiBwcm9kdWN0c1swXSwgXHJcbiAgICAgICAgICAgICAgICBsYXN0UHJvZHVjdHM6IHByb2R1Y3RzLFxyXG4gICAgICAgICAgICAgICAgbGFzdFF1ZXJ5OiBtZXNzYWdlIFxyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDEkMOjIGzGsHUgc+G6o24gcGjhuqltIFwiJHtwcm9kdWN0c1swXS5wcm9kdWN0TmFtZX1cIiB2w6BvIG5n4buvIGPhuqNuaCBjaG8gdXNlciAke3VzZXJJZH1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgIHR5cGU6ICdjYXRlZ29yeVF1ZXJ5JyxcclxuICAgICAgICAgICAgICBtZXNzYWdlOiBcIsSQw6J5IGzDoCBt4buZdCBz4buRIHPhuqNuIHBo4bqpbSBwaMO5IGjhu6NwIHbhu5tpIHnDqnUgY+G6p3UgY+G7p2EgYuG6oW46XCIsXHJcbiAgICAgICAgICAgICAgZGF0YTogcHJvZHVjdHNcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgICAgICAgICAgICBtZXNzYWdlOiBcIlTDtGkga2jDtG5nIHTDrG0gdGjhuqV5IHRow7RuZyB0aW4gcGjDuSBo4bujcC4gQuG6oW4gY8OzIHRo4buDIGjhu49pIGPhu6UgdGjhu4MgaMahbiB24buBIHPhuqNuIHBo4bqpbSwgZ2nDoSBj4bqjLCBob+G6t2MgdGjDtG5nIHRpbiBraMOhYyBraMO0bmc/XCJcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSB44butIGzDvSBjw6J1IGjhu49pOlwiLCBlcnJvcik7XHJcbiAgICAgICAgICByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBcIlTDtGkga2jDtG5nIGhp4buDdSDDvSBj4bunYSBi4bqhbi4gQuG6oW4gY8OzIHRo4buDIGRp4buFbiDEkeG6oXQgdGhlbyBjw6FjaCBraMOhYyDEkcaw4bujYyBraMO0bmc/XCJcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24ocmVzcG9uc2UpO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIHjhu60gbMO9IHRpbiBuaOG6r246XCIsIGVycm9yKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiBcIkFuIGVycm9yIG9jY3VycmVkIHdoaWxlIHByb2Nlc3NpbmcgdGhlIG1lc3NhZ2VcIlxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEjDoG0geOG7rSBsw70gd2ViaG9vayB04burIFJhc2FcclxuICogQHBhcmFtIHtvYmplY3R9IHJlcSAtIFJlcXVlc3Qgb2JqZWN0XHJcbiAqIEBwYXJhbSB7b2JqZWN0fSByZXMgLSBSZXNwb25zZSBvYmplY3RcclxuICogQHJldHVybnMge29iamVjdH0gLSBKU09OIHJlc3BvbnNlXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgaGFuZGxlUmFzYVdlYmhvb2sgPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc29sZS5sb2coXCJOaOG6rW4gd2ViaG9vayB04burIFJhc2E6XCIsIHJlcS5ib2R5KTtcclxuICAgIFxyXG4gICAgLy8gWOG7rSBsw70gZOG7ryBsaeG7h3UgdOG7qyBSYXNhXHJcbiAgICBjb25zdCByYXNhUmVzcG9uc2UgPSByZXEuYm9keTtcclxuICAgIFxyXG4gICAgLy8gVHLhuqMgduG7gSBwaOG6o24gaOG7k2lcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2U6IFwiV2ViaG9vayByZWNlaXZlZCBzdWNjZXNzZnVsbHlcIixcclxuICAgICAgZGF0YTogcmFzYVJlc3BvbnNlXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSB44butIGzDvSB3ZWJob29rIHThu6sgUmFzYTpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IFwiQW4gZXJyb3Igb2NjdXJyZWQgd2hpbGUgcHJvY2Vzc2luZyB0aGUgd2ViaG9va1wiXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVMOsbSBraeG6v20gc+G6o24gcGjhuqltIHRy4buxYyB0aeG6v3AgYuG6sW5nIE1vbmdvREJcclxuICogQHBhcmFtIHtzdHJpbmd9IHF1ZXJ5IC0gQ8OidSB0cnV5IHbhuqVuIHTDrG0ga2nhur9tXHJcbiAqIEByZXR1cm5zIHtBcnJheX0gLSBEYW5oIHPDoWNoIHPhuqNuIHBo4bqpbVxyXG4gKi9cclxuY29uc3Qgc2VhcmNoUHJvZHVjdHNNb25nb0RCID0gYXN5bmMgKHF1ZXJ5KSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnNvbGUubG9nKFwixJBhbmcgdMOsbSBraeG6v20gc+G6o24gcGjhuqltIHbhu5tpIHF1ZXJ5OlwiLCBxdWVyeSk7XHJcbiAgICBcclxuICAgIC8vIFjhu60gbMO9IHF1ZXJ5IMSR4buDIHTDrG0gdOG7qyBraMOzYSBxdWFuIHRy4buNbmdcclxuICAgIGNvbnN0IGxvd2VyUXVlcnkgPSBxdWVyeS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgXHJcbiAgICAvLyBUw6xtIGtp4bq/bSBz4bqjbiBwaOG6qW0gdGhlbyBnacOhXHJcbiAgICBjb25zdCBwcmljZU1hdGNoID0gbG93ZXJRdWVyeS5tYXRjaCgvZMaw4bubaSAoXFxkKylrL2kpIHx8IGxvd2VyUXVlcnkubWF0Y2goLzwgKFxcZCspay9pKSB8fCBsb3dlclF1ZXJ5Lm1hdGNoKC9uaOG7jyBoxqFuIChcXGQrKWsvaSk7XHJcbiAgICBjb25zdCBwcmljZUhpZ2hNYXRjaCA9IGxvd2VyUXVlcnkubWF0Y2goL3Ryw6puIChcXGQrKWsvaSkgfHwgbG93ZXJRdWVyeS5tYXRjaCgvPiAoXFxkKylrL2kpIHx8IGxvd2VyUXVlcnkubWF0Y2goL2zhu5tuIGjGoW4gKFxcZCspay9pKTtcclxuICAgIGNvbnN0IHByaWNlQmV0d2Vlbk1hdGNoID0gbG93ZXJRdWVyeS5tYXRjaCgvdOG7qyAoXFxkKylrIMSR4bq/biAoXFxkKylrL2kpIHx8IGxvd2VyUXVlcnkubWF0Y2goLyhcXGQrKWsgLSAoXFxkKylrL2kpO1xyXG4gICAgXHJcbiAgICAvLyBN4bqjbmcgY8OhYyDEkWnhu4F1IGtp4buHbiB0w6xtIGtp4bq/bVxyXG4gICAgY29uc3QgY29uZGl0aW9ucyA9IFtdO1xyXG4gICAgbGV0IGlzUHJpY2VRdWVyeSA9IGZhbHNlO1xyXG4gICAgXHJcbiAgICAvLyBY4butIGzDvSB0w6xtIGtp4bq/bSB0aGVvIGtob+G6o25nIGdpw6FcclxuICAgIGlmIChwcmljZU1hdGNoKSB7XHJcbiAgICAgIGNvbnN0IG1heFByaWNlID0gcGFyc2VJbnQocHJpY2VNYXRjaFsxXSkgKiAxMDAwO1xyXG4gICAgICBjb25kaXRpb25zLnB1c2goeyBcclxuICAgICAgICAkb3I6IFtcclxuICAgICAgICAgIHsgcHJpY2U6IHsgJGx0ZTogbWF4UHJpY2UgfSB9LFxyXG4gICAgICAgICAgeyBwcm9kdWN0UHJpY2U6IHsgJGx0ZTogbWF4UHJpY2UgfSB9XHJcbiAgICAgICAgXVxyXG4gICAgICB9KTtcclxuICAgICAgaXNQcmljZVF1ZXJ5ID0gdHJ1ZTtcclxuICAgICAgY29uc29sZS5sb2coXCJUw6xtIHPhuqNuIHBo4bqpbSBjw7MgZ2nDoSBkxrDhu5tpOlwiLCBtYXhQcmljZSk7XHJcbiAgICB9IGVsc2UgaWYgKHByaWNlSGlnaE1hdGNoKSB7XHJcbiAgICAgIGNvbnN0IG1pblByaWNlID0gcGFyc2VJbnQocHJpY2VIaWdoTWF0Y2hbMV0pICogMTAwMDtcclxuICAgICAgY29uZGl0aW9ucy5wdXNoKHsgXHJcbiAgICAgICAgJG9yOiBbXHJcbiAgICAgICAgICB7IHByaWNlOiB7ICRndGU6IG1pblByaWNlIH0gfSxcclxuICAgICAgICAgIHsgcHJvZHVjdFByaWNlOiB7ICRndGU6IG1pblByaWNlIH0gfVxyXG4gICAgICAgIF1cclxuICAgICAgfSk7XHJcbiAgICAgIGlzUHJpY2VRdWVyeSA9IHRydWU7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiVMOsbSBz4bqjbiBwaOG6qW0gY8OzIGdpw6EgdHLDqm46XCIsIG1pblByaWNlKTtcclxuICAgIH0gZWxzZSBpZiAocHJpY2VCZXR3ZWVuTWF0Y2gpIHtcclxuICAgICAgY29uc3QgbWluUHJpY2UgPSBwYXJzZUludChwcmljZUJldHdlZW5NYXRjaFsxXSkgKiAxMDAwO1xyXG4gICAgICBjb25zdCBtYXhQcmljZSA9IHBhcnNlSW50KHByaWNlQmV0d2Vlbk1hdGNoWzJdKSAqIDEwMDA7XHJcbiAgICAgIGNvbmRpdGlvbnMucHVzaCh7IFxyXG4gICAgICAgICRvcjogW1xyXG4gICAgICAgICAgeyBwcmljZTogeyAkZ3RlOiBtaW5QcmljZSwgJGx0ZTogbWF4UHJpY2UgfSB9LFxyXG4gICAgICAgICAgeyBwcm9kdWN0UHJpY2U6IHsgJGd0ZTogbWluUHJpY2UsICRsdGU6IG1heFByaWNlIH0gfVxyXG4gICAgICAgIF1cclxuICAgICAgfSk7XHJcbiAgICAgIGlzUHJpY2VRdWVyeSA9IHRydWU7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiVMOsbSBz4bqjbiBwaOG6qW0gY8OzIGdpw6EgdOG7q1wiLCBtaW5QcmljZSwgXCLEkeG6v25cIiwgbWF4UHJpY2UpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBLaeG7g20gdHJhIHhlbSBjw7MgY+G7pW0gdOG7qyBcIm7GsOG7m2MgZ2nhurd0XCIga2jDtG5nXHJcbiAgICBjb25zdCBzcGVjaWZpY1BocmFzZXMgPSBbXHJcbiAgICAgIHsgcGhyYXNlOiBcIm7GsOG7m2MgZ2nhurd0XCIsIGNhdGVnb3J5OiBcIsSQ4buTIGdpYSBk4bulbmdcIiB9LFxyXG4gICAgICB7IHBocmFzZTogXCJuxrDhu5tjIHLhu61hIGNow6luXCIsIGNhdGVnb3J5OiBcIsSQ4buTIGdpYSBk4bulbmdcIiB9LFxyXG4gICAgICB7IHBocmFzZTogXCJuxrDhu5tjIGxhdSBzw6BuXCIsIGNhdGVnb3J5OiBcIsSQ4buTIGdpYSBk4bulbmdcIiB9LFxyXG4gICAgICB7IHBocmFzZTogXCJuxrDhu5tjIGdp4bqjaSBraMOhdFwiLCBjYXRlZ29yeTogXCLEkOG7kyB14buRbmdcIiB9LFxyXG4gICAgICB7IHBocmFzZTogXCJuxrDhu5tjIG5n4buNdFwiLCBjYXRlZ29yeTogXCLEkOG7kyB14buRbmdcIiB9LFxyXG4gICAgICB7IHBocmFzZTogXCJuxrDhu5tjIHTGsMahbmdcIiwgY2F0ZWdvcnk6IFwiR2lhIHbhu4tcIiB9XHJcbiAgICBdO1xyXG4gICAgXHJcbiAgICBsZXQgZm91bmRTcGVjaWZpY1BocmFzZSA9IGZhbHNlO1xyXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHNwZWNpZmljUGhyYXNlcykge1xyXG4gICAgICBpZiAobG93ZXJRdWVyeS5pbmNsdWRlcyhpdGVtLnBocmFzZSkpIHtcclxuICAgICAgICBmb3VuZFNwZWNpZmljUGhyYXNlID0gdHJ1ZTtcclxuICAgICAgICBjb25kaXRpb25zLnB1c2goeyBcclxuICAgICAgICAgICRvcjogW1xyXG4gICAgICAgICAgICB7IHByb2R1Y3ROYW1lOiB7ICRyZWdleDogaXRlbS5waHJhc2UsICRvcHRpb25zOiAnaScgfSB9LFxyXG4gICAgICAgICAgICB7IGRlc2NyaXB0aW9uOiB7ICRyZWdleDogaXRlbS5waHJhc2UsICRvcHRpb25zOiAnaScgfSB9LFxyXG4gICAgICAgICAgICB7IGNhdGVnb3J5OiBpdGVtLmNhdGVnb3J5IH1cclxuICAgICAgICAgIF1cclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zb2xlLmxvZyhgVMOsbSBz4bqjbiBwaOG6qW0gduG7m2kgY+G7pW0gdOG7qyBj4bulIHRo4buDOiBcIiR7aXRlbS5waHJhc2V9XCIgdGh14buZYyBkYW5oIG3hu6VjICR7aXRlbS5jYXRlZ29yeX1gKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBY4butIGzDvSB0w6xtIGtp4bq/bSB0aGVvIGRhbmggbeG7pWMvbG/huqFpIHPhuqNuIHBo4bqpbSBu4bq/dSBraMO0bmcgdMOsbSDEkcaw4bujYyBj4bulbSB04burIGPhu6UgdGjhu4MgdsOgIGtow7RuZyBwaOG6o2kgbMOgIGPDonUgaOG7j2kgduG7gSBnacOhXHJcbiAgICBpZiAoIWZvdW5kU3BlY2lmaWNQaHJhc2UgJiYgIWlzUHJpY2VRdWVyeSkge1xyXG4gICAgICBjb25zdCBjYXRlZ29yeUtleXdvcmRzID0gW1xyXG4gICAgICAgIHsga2V5d29yZHM6IFsncmF1JywgJ2Phu6cnLCAncXXhuqMnLCAncmF1IGPhu6cnLCAncmF1IHF14bqjJywgJ3Ryw6FpIGPDonknXSwgY2F0ZWdvcnk6ICdSYXUgY+G7pyBxdeG6oycgfSxcclxuICAgICAgICB7IGtleXdvcmRzOiBbJ3Ro4buLdCcsICdjw6EnLCAnaOG6o2kgc+G6o24nLCAndGjhu4t0IGPDoScsICd0aOG7p3kgaOG6o2kgc+G6o24nXSwgY2F0ZWdvcnk6ICdUaOG7i3QgdsOgIGjhuqNpIHPhuqNuJyB9LFxyXG4gICAgICAgIHsga2V5d29yZHM6IFsnxJHhu5MgdeG7kW5nJywgJ27GsOG7m2Mgbmfhu410JywgJ2JpYScsICdyxrDhu6N1J10sIGNhdGVnb3J5OiAnxJDhu5MgdeG7kW5nJyB9LFxyXG4gICAgICAgIHsga2V5d29yZHM6IFsnZ2lhIHbhu4snLCAnZOG6p3UgxINuJywgJ27GsOG7m2MgbeG6r20nLCAnbXXhu5FpJywgJ8SRxrDhu51uZycsICdtw6wgY2jDrW5oJ10sIGNhdGVnb3J5OiAnR2lhIHbhu4snIH0sXHJcbiAgICAgICAgeyBrZXl3b3JkczogWydiw6FuaCcsICdr4bq5bycsICdzbmFjaycsICfEkeG7kyDEg24gduG6t3QnXSwgY2F0ZWdvcnk6ICdCw6FuaCBr4bq5bycgfSxcclxuICAgICAgICB7IGtleXdvcmRzOiBbJ23DrCcsICdiw7puJywgJ3Bo4bufJywgJ21p4bq/bicsICdo4bunIHRp4bq/dSddLCBjYXRlZ29yeTogJ03DrCwgYsO6biwgcGjhu58nIH0sXHJcbiAgICAgICAgeyBrZXl3b3JkczogWydnaeG6t3QnLCAneMOgIHBow7JuZycsICduxrDhu5tjIHLhu61hJywgJ2xhdScsICd24buHIHNpbmgnXSwgY2F0ZWdvcnk6ICfEkOG7kyBnaWEgZOG7pW5nJyB9XHJcbiAgICAgIF07XHJcbiAgICAgIFxyXG4gICAgICBsZXQgZm91bmRDYXRlZ29yeSA9IGZhbHNlO1xyXG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgY2F0ZWdvcnlLZXl3b3Jkcykge1xyXG4gICAgICAgIGlmIChpdGVtLmtleXdvcmRzLnNvbWUoa2V5d29yZCA9PiBsb3dlclF1ZXJ5LmluY2x1ZGVzKGtleXdvcmQpKSkge1xyXG4gICAgICAgICAgY29uZGl0aW9ucy5wdXNoKHsgY2F0ZWdvcnk6IGl0ZW0uY2F0ZWdvcnkgfSk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIlTDrG0gc+G6o24gcGjhuqltIHRodeG7mWMgZGFuaCBt4bulYzpcIiwgaXRlbS5jYXRlZ29yeSk7XHJcbiAgICAgICAgICBmb3VuZENhdGVnb3J5ID0gdHJ1ZTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBUw6xtIHRoZW8gdOG7qyBraMOzYSBj4bulIHRo4buDICh0w6puIHPhuqNuIHBo4bqpbSlcclxuICAgIGNvbnN0IHN0b3BXb3JkcyA9IFsndMOsbScsICdraeG6v20nLCAnc+G6o24nLCAncGjhuqltJywgJ3PhuqNuIHBo4bqpbScsICdow6BuZycsICdnacOhJywgJ211YScsICdiw6FuJywgJ2PDoWMnLCAnY8OzJywgJ2tow7RuZycsICd24bqteScsICdzaG9wJywgJ2Phu61hIGjDoG5nJywgJ3Row6wnLCAnbMOgJywgJ3bDoCcsICdoYXknLCAnaG/hurdjJywgJ25ow6knLCAn4bqhJywgJ2TGsOG7m2knLCAndHLDqm4nLCAna2hv4bqjbmcnLCAndOG7qycsICfEkeG6v24nXTtcclxuICAgIGNvbnN0IHdvcmRzID0gbG93ZXJRdWVyeS5zcGxpdCgvXFxzKy8pO1xyXG4gICAgXHJcbiAgICAvLyBM4buNYyBi4buPIHThu6sga2jDs2EgZ2nDoSAoMTAwaywgNTBrKVxyXG4gICAgY29uc3QgcHJpY2VLZXl3b3JkcyA9IHdvcmRzLmZpbHRlcih3b3JkID0+IHdvcmQubWF0Y2goL1xcZCtrJC9pKSk7XHJcbiAgICBjb25zdCBrZXl3b3JkcyA9IHdvcmRzLmZpbHRlcih3b3JkID0+ICFzdG9wV29yZHMuaW5jbHVkZXMod29yZCkgJiYgd29yZC5sZW5ndGggPiAxICYmICF3b3JkLm1hdGNoKC9cXGQrayQvaSkpO1xyXG4gICAgXHJcbiAgICBjb25zb2xlLmxvZyhcIlThu6sga2jDs2EgZ2nDoTpcIiwgcHJpY2VLZXl3b3Jkcyk7XHJcbiAgICBjb25zb2xlLmxvZyhcIlThu6sga2jDs2EgdMOsbSBraeG6v206XCIsIGtleXdvcmRzKTtcclxuICAgIFxyXG4gICAgLy8gWOG7rSBsw70gxJHhurdjIGJp4buHdCBjaG8gdHLGsOG7nW5nIGjhu6NwIHTDrG0ga2nhur9tIFwicmF1XCJcclxuICAgIGNvbnN0IGlzVmVnZXRhYmxlU2VhcmNoID0ga2V5d29yZHMuc29tZShrdyA9PiBbJ3JhdScsICdj4bunJywgJ3F14bqjJ10uaW5jbHVkZXMoa3cpKTtcclxuICAgIGxldCBpc1NwZWNpYWxDYXRlZ29yeVNlYXJjaCA9IGZhbHNlO1xyXG4gICAgXHJcbiAgICBpZiAoaXNWZWdldGFibGVTZWFyY2gpIHtcclxuICAgICAgaXNTcGVjaWFsQ2F0ZWdvcnlTZWFyY2ggPSB0cnVlO1xyXG4gICAgICAvLyBO4bq/dSBjaOG7iSB0b8OgbiB04burIGtow7NhIGxpw6puIHF1YW4gxJHhur9uIHJhdSBj4bunIHF14bqjLCDGsHUgdGnDqm4gc+G7rSBk4bulbmcgZGFuaCBt4bulYyB0aGF5IHbDrCB0w6xtIHRoZW8gdOG7qyBraMOzYVxyXG4gICAgICBpZiAoa2V5d29yZHMuZXZlcnkoa3cgPT4gWydyYXUnLCAnY+G7pycsICdxdeG6oycsICd0csOhaSddLmluY2x1ZGVzKGt3KSkpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlTDrG0gdOG6pXQgY+G6oyBz4bqjbiBwaOG6qW0gdHJvbmcgZGFuaCBt4bulYyBSYXUgY+G7pyBxdeG6o1wiKTtcclxuICAgICAgICAvLyBYw7NhIMSRaeG7gXUga2nhu4duIHTDrG0ga2nhur9tIGhp4buHbiB04bqhaSBu4bq/dSBjw7NcclxuICAgICAgICBjb25zdCBjYXRlZ29yeUluZGV4ID0gY29uZGl0aW9ucy5maW5kSW5kZXgoYyA9PiBjLmNhdGVnb3J5ID09PSAnUmF1IGPhu6cgcXXhuqMnKTtcclxuICAgICAgICBpZiAoY2F0ZWdvcnlJbmRleCAhPT0gLTEpIHtcclxuICAgICAgICAgIGNvbmRpdGlvbnMuc3BsaWNlKGNhdGVnb3J5SW5kZXgsIDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBUaMOqbSDEkWnhu4F1IGtp4buHbiB0w6xtIGtp4bq/bSB0aGVvIGRhbmggbeG7pWNcclxuICAgICAgICBjb25kaXRpb25zLnB1c2goeyBjYXRlZ29yeTogJ1JhdSBj4bunIHF14bqjJyB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBO4bq/dSDEkcOieSBsw6AgY8OidSBo4buPaSB24buBIGdpw6EsIMawdSB0acOqbiBjaOG7iSB0w6xtIHRoZW8gZ2nDoSBu4bq/dSBraMO0bmcgY8OzIHThu6sga2jDs2EgxJHhurdjIGJp4buHdFxyXG4gICAgaWYgKGlzUHJpY2VRdWVyeSkge1xyXG4gICAgICBpZiAoa2V5d29yZHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCLEkMOieSBsw6AgY8OidSBo4buPaSB0w6xtIHRoZW8gZ2nDoSwgY2jhu4kgdMOsbSBraeG6v20gZOG7sWEgdHLDqm4gxJFp4buBdSBraeG7h24gZ2nDoVwiKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICAvLyBU4bqhbyBjw6FjIMSRaeG7gXUga2nhu4duIHTDrG0ga2nhur9tIHRoZW8gdOG7q25nIHThu6sga2jDs2FcclxuICAgICAgICBjb25zdCBrZXl3b3JkQ29uZGl0aW9ucyA9IFtdO1xyXG4gICAgICAgIGZvciAoY29uc3Qga2V5d29yZCBvZiBrZXl3b3Jkcykge1xyXG4gICAgICAgICAga2V5d29yZENvbmRpdGlvbnMucHVzaCh7IHByb2R1Y3ROYW1lOiB7ICRyZWdleDoga2V5d29yZCwgJG9wdGlvbnM6ICdpJyB9IH0pO1xyXG4gICAgICAgICAga2V5d29yZENvbmRpdGlvbnMucHVzaCh7IGRlc2NyaXB0aW9uOiB7ICRyZWdleDoga2V5d29yZCwgJG9wdGlvbnM6ICdpJyB9IH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoa2V5d29yZENvbmRpdGlvbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgY29uZGl0aW9ucy5wdXNoKHsgJG9yOiBrZXl3b3JkQ29uZGl0aW9ucyB9KTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiVMOsbSBz4bqjbiBwaOG6qW0gdGhlbyBj4bqjIGdpw6EgdsOgIHThu6sga2jDs2E6XCIsIGtleXdvcmRzKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIE7hur91IGtow7RuZyBwaOG6o2kgY8OidSBo4buPaSB24buBIGdpw6EsIHTDrG0gdGhlbyB04burIGtow7NhIHRow7RuZyB0aMaw4budbmdcclxuICAgIGVsc2UgaWYgKGtleXdvcmRzLmxlbmd0aCA+IDAgJiYgIWlzU3BlY2lhbENhdGVnb3J5U2VhcmNoKSB7XHJcbiAgICAgIC8vIFThuqFvIGPDoWMgxJFp4buBdSBraeG7h24gdMOsbSBraeG6v20gdGhlbyB04burbmcgdOG7qyBraMOzYVxyXG4gICAgICBjb25zdCBrZXl3b3JkQ29uZGl0aW9ucyA9IFtdO1xyXG4gICAgICBmb3IgKGNvbnN0IGtleXdvcmQgb2Yga2V5d29yZHMpIHtcclxuICAgICAgICBrZXl3b3JkQ29uZGl0aW9ucy5wdXNoKHsgcHJvZHVjdE5hbWU6IHsgJHJlZ2V4OiBrZXl3b3JkLCAkb3B0aW9uczogJ2knIH0gfSk7XHJcbiAgICAgICAga2V5d29yZENvbmRpdGlvbnMucHVzaCh7IGRlc2NyaXB0aW9uOiB7ICRyZWdleDoga2V5d29yZCwgJG9wdGlvbnM6ICdpJyB9IH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChrZXl3b3JkQ29uZGl0aW9ucy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgY29uZGl0aW9ucy5wdXNoKHsgJG9yOiBrZXl3b3JkQ29uZGl0aW9ucyB9KTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlTDrG0gc+G6o24gcGjhuqltIHRoZW8gdOG7qyBraMOzYTpcIiwga2V5d29yZHMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGxldCBmaWx0ZXIgPSB7fTtcclxuICAgIFxyXG4gICAgLy8gWMOieSBk4buxbmcgZmlsdGVyIHTDuXkgdGh14buZYyB2w6BvIGxv4bqhaSB0w6xtIGtp4bq/bVxyXG4gICAgaWYgKGlzUHJpY2VRdWVyeSAmJiBrZXl3b3Jkcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgLy8gTuG6v3UgY2jhu4kgdMOsbSB0aGVvIGdpw6EsIGtow7RuZyBiYW8gZ+G7k20gdOG7qyBraMOzYVxyXG4gICAgICBmaWx0ZXIgPSBjb25kaXRpb25zLmxlbmd0aCA+IDAgPyB7ICRhbmQ6IGNvbmRpdGlvbnMgfSA6IHt9O1xyXG4gICAgfSBlbHNlIGlmIChpc1ByaWNlUXVlcnkgJiYga2V5d29yZHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAvLyBO4bq/dSB0w6xtIHRoZW8gY+G6oyBnacOhIHbDoCB04burIGtow7NhLCBjaG8gcGjDqXAgdMOsbSBraeG6v20gbGluaCBob+G6oXQgaMahbiAoZ2nDoSBIT+G6tkMgdOG7qyBraMOzYSlcclxuICAgICAgZmlsdGVyID0geyAkb3I6IGNvbmRpdGlvbnMgfTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIEPDoWMgdHLGsOG7nW5nIGjhu6NwIHTDrG0ga2nhur9tIHRow7RuZyB0aMaw4budbmcga2jDoWNcclxuICAgICAgZmlsdGVyID0gY29uZGl0aW9ucy5sZW5ndGggPiAwID8geyAkYW5kOiBjb25kaXRpb25zIH0gOiB7fTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgY29uc29sZS5sb2coXCJGaWx0ZXIgdMOsbSBraeG6v206XCIsIEpTT04uc3RyaW5naWZ5KGZpbHRlcikpO1xyXG4gICAgXHJcbiAgICB0cnkge1xyXG4gICAgICBsZXQgcHJvZHVjdHMgPSBbXTtcclxuICAgICAgXHJcbiAgICAgIGlmIChPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAvLyBUcnV5IHbhuqVuIHThuqV0IGPhuqMgc+G6o24gcGjhuqltIHBow7kgaOG7o3AgduG7m2kgZmlsdGVyXHJcbiAgICAgICAgY29uc3QgYWxsTWF0Y2hlZFByb2R1Y3RzID0gYXdhaXQgUHJvZHVjdC5maW5kKGZpbHRlcikubGltaXQoMjApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChhbGxNYXRjaGVkUHJvZHVjdHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAvLyBO4bq/dSBraMO0bmcgdMOsbSB0aOG6pXkgc+G6o24gcGjhuqltLCB0aOG7rSB0w6xtIGNo4buJIHbhu5tpIHThu6sga2jDs2FcclxuICAgICAgICAgIGlmIChrZXl3b3Jkcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiS2jDtG5nIHTDrG0gdGjhuqV5IHPhuqNuIHBo4bqpbSwgdGjhu60gdMOsbSBjaOG7iSB24bubaSB04burIGtow7NhXCIpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVOG6oW8gcGlwZWxpbmUgYWdncmVnYXRpb24gxJHhu4MgdMOtbmggxJFp4buDbSBwaMO5IGjhu6NwXHJcbiAgICAgICAgICAgIGNvbnN0IGFnZ3JlZ2F0aW9uUGlwZWxpbmUgPSBbXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgJG1hdGNoOiB7XHJcbiAgICAgICAgICAgICAgICAgICRvcjoga2V5d29yZHMuZmxhdE1hcChrZXl3b3JkID0+IFtcclxuICAgICAgICAgICAgICAgICAgICB7IHByb2R1Y3ROYW1lOiB7ICRyZWdleDoga2V5d29yZCwgJG9wdGlvbnM6ICdpJyB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBkZXNjcmlwdGlvbjogeyAkcmVnZXg6IGtleXdvcmQsICRvcHRpb25zOiAnaScgfSB9XHJcbiAgICAgICAgICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAkYWRkRmllbGRzOiB7XHJcbiAgICAgICAgICAgICAgICAgIG1hdGNoU2NvcmU6IHtcclxuICAgICAgICAgICAgICAgICAgICAkYWRkOiBrZXl3b3Jkcy5tYXAoa2V5d29yZCA9PiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICB7ICRjb25kOiBbeyAkcmVnZXhNYXRjaDogeyBpbnB1dDogXCIkcHJvZHVjdE5hbWVcIiwgcmVnZXg6IGtleXdvcmQsIG9wdGlvbnM6IFwiaVwiIH0gfSwgMiwgMF0gfSxcclxuICAgICAgICAgICAgICAgICAgICAgIHsgJGNvbmQ6IFt7ICRyZWdleE1hdGNoOiB7IGlucHV0OiBcIiRkZXNjcmlwdGlvblwiLCByZWdleDoga2V5d29yZCwgb3B0aW9uczogXCJpXCIgfSB9LCAxLCAwXSB9XHJcbiAgICAgICAgICAgICAgICAgICAgXSkuZmxhdCgpXHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICRzb3J0OiB7IG1hdGNoU2NvcmU6IC0xIH1cclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICRsaW1pdDogMTBcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBwcm9kdWN0cyA9IGF3YWl0IFByb2R1Y3QuYWdncmVnYXRlKGFnZ3JlZ2F0aW9uUGlwZWxpbmUpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgVMOsbSB0aOG6pXkgJHtwcm9kdWN0cy5sZW5ndGh9IHPhuqNuIHBo4bqpbSBi4bqxbmcgdOG7qyBraMOzYSB24bubaSDEkWnhu4NtIHBow7kgaOG7o3BgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gTuG6v3UgduG6q24ga2jDtG5nIHTDrG0gdGjhuqV5IGhv4bq3YyBraMO0bmcgY8OzIHThu6sga2jDs2EsIHRo4butIHTDrG0gdGhlbyBkYW5oIG3hu6VjXHJcbiAgICAgICAgICBpZiAocHJvZHVjdHMubGVuZ3RoID09PSAwICYmICFmb3VuZFNwZWNpZmljUGhyYXNlKSB7XHJcbiAgICAgICAgICAgIC8vIFjhu60gbMO9IMSR4bq3YyBiaeG7h3QgY2hvIHThu6sga2jDs2EgXCJyYXVcIlxyXG4gICAgICAgICAgICBjb25zdCBpc1ZlZ2V0YWJsZVF1ZXJ5ID0gbG93ZXJRdWVyeS5pbmNsdWRlcyhcInJhdVwiKSB8fCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXJRdWVyeS5pbmNsdWRlcyhcImPhu6dcIikgfHwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvd2VyUXVlcnkuaW5jbHVkZXMoXCJxdeG6o1wiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpc1ZlZ2V0YWJsZVF1ZXJ5KSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUaOG7rSB0w6xtIHThuqV0IGPhuqMgc+G6o24gcGjhuqltIHRyb25nIGRhbmggbeG7pWMgUmF1IGPhu6cgcXXhuqNcIik7XHJcbiAgICAgICAgICAgICAgcHJvZHVjdHMgPSBhd2FpdCBQcm9kdWN0LmZpbmQoeyBjYXRlZ29yeTogXCJSYXUgY+G7pyBxdeG6o1wiIH0pLmxpbWl0KDEwKTtcclxuICAgICAgICAgICAgICAvLyBO4bq/dSDEkcOjIHTDrG0gdGjhuqV5IHPhuqNuIHBo4bqpbSwgYuG7jyBxdWEgdmnhu4djIHTDrG0ga2nhur9tIGRhbmggbeG7pWMgdGnhur9wIHRoZW9cclxuICAgICAgICAgICAgICBpZiAocHJvZHVjdHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFTDrG0gdGjhuqV5ICR7cHJvZHVjdHMubGVuZ3RofSBz4bqjbiBwaOG6qW0gdHJvbmcgZGFuaCBt4bulYyBSYXUgY+G7pyBxdeG6o2ApO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb2R1Y3RzO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29uc3QgY2F0ZWdvcnlLZXl3b3JkcyA9IFtcclxuICAgICAgICAgICAgICB7IGtleXdvcmRzOiBbJ3JhdScsICdj4bunJywgJ3F14bqjJywgJ3JhdSBj4bunJywgJ3JhdSBxdeG6oycsICd0csOhaSBjw6J5J10sIGNhdGVnb3J5OiAnUmF1IGPhu6cgcXXhuqMnIH0sXHJcbiAgICAgICAgICAgICAgeyBrZXl3b3JkczogWyd0aOG7i3QnLCAnY8OhJywgJ2jhuqNpIHPhuqNuJywgJ3Ro4buLdCBjw6EnLCAndGjhu6d5IGjhuqNpIHPhuqNuJ10sIGNhdGVnb3J5OiAnVGjhu4t0IHbDoCBo4bqjaSBz4bqjbicgfSxcclxuICAgICAgICAgICAgICB7IGtleXdvcmRzOiBbJ8SR4buTIHXhu5FuZycsICduxrDhu5tjIG5n4buNdCcsICdiaWEnLCAncsaw4bujdSddLCBjYXRlZ29yeTogJ8SQ4buTIHXhu5FuZycgfSxcclxuICAgICAgICAgICAgICB7IGtleXdvcmRzOiBbJ2dpYSB24buLJywgJ2Thuqd1IMSDbicsICduxrDhu5tjIG3huq9tJywgJ2114buRaScsICfEkcaw4budbmcnLCAnbcOsIGNow61uaCddLCBjYXRlZ29yeTogJ0dpYSB24buLJyB9LFxyXG4gICAgICAgICAgICAgIHsga2V5d29yZHM6IFsnYsOhbmgnLCAna+G6uW8nLCAnc25hY2snLCAnxJHhu5MgxINuIHbhurd0J10sIGNhdGVnb3J5OiAnQsOhbmgga+G6uW8nIH0sXHJcbiAgICAgICAgICAgICAgeyBrZXl3b3JkczogWydtw6wnLCAnYsO6bicsICdwaOG7nycsICdtaeG6v24nLCAnaOG7pyB0aeG6v3UnXSwgY2F0ZWdvcnk6ICdNw6wsIGLDum4sIHBo4bufJyB9LFxyXG4gICAgICAgICAgICAgIHsga2V5d29yZHM6IFsnZ2nhurd0JywgJ3jDoCBwaMOybmcnLCAnbsaw4bubYyBy4butYScsICdsYXUnLCAnduG7hyBzaW5oJ10sIGNhdGVnb3J5OiAnxJDhu5MgZ2lhIGThu6VuZycgfVxyXG4gICAgICAgICAgICBdO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGNhdGVnb3J5S2V5d29yZHMpIHtcclxuICAgICAgICAgICAgICBpZiAoaXRlbS5rZXl3b3Jkcy5zb21lKGtleXdvcmQgPT4gbG93ZXJRdWVyeS5pbmNsdWRlcyhrZXl3b3JkKSkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGjhu60gdMOsbSBjaOG7iSB24bubaSBkYW5oIG3hu6VjOlwiLCBpdGVtLmNhdGVnb3J5KTtcclxuICAgICAgICAgICAgICAgIHByb2R1Y3RzID0gYXdhaXQgUHJvZHVjdC5maW5kKHsgY2F0ZWdvcnk6IGl0ZW0uY2F0ZWdvcnkgfSkubGltaXQoMTApO1xyXG4gICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RzLmxlbmd0aCA+IDApIGJyZWFrO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAvLyBO4bq/dSBjw7Mga+G6v3QgcXXhuqMsIHTDrW5oIMSRaeG7g20gcGjDuSBo4bujcCB2w6Agc+G6r3AgeOG6v3Aga+G6v3QgcXXhuqNcclxuICAgICAgICAgIHByb2R1Y3RzID0gYWxsTWF0Y2hlZFByb2R1Y3RzLm1hcChwcm9kdWN0ID0+IHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAvLyBLaeG7g20gdHJhIHhlbSBwcm9kdWN0IGPDsyBo4bujcCBs4buHIGtow7RuZ1xyXG4gICAgICAgICAgICAgIGlmICghcHJvZHVjdCB8fCB0eXBlb2YgcHJvZHVjdCAhPT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQuG7jyBxdWEgc+G6o24gcGjhuqltIGtow7RuZyBo4bujcCBs4buHOlwiLCBwcm9kdWN0KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7IG1hdGNoU2NvcmU6IC0xIH07IC8vIFPhur0gYuG7iyBsb+G6oWkgYuG7jyBraGkgc+G6r3AgeOG6v3BcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgLy8gQ2h1eeG7g24gxJHhu5VpIGFuIHRvw6BuIHRow6BuaCBwbGFpbiBvYmplY3RcclxuICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0T2JqID0gcHJvZHVjdC50b09iamVjdCA/IHByb2R1Y3QudG9PYmplY3QoKSA6IHByb2R1Y3Q7XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgLy8gxJDhuqNtIGLhuqNvIGPDoWMgdHLGsOG7nW5nIHbEg24gYuG6o24gdOG7k24gdOG6oWlcclxuICAgICAgICAgICAgICBjb25zdCBuYW1lVGV4dCA9IChwcm9kdWN0T2JqLnByb2R1Y3ROYW1lIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICAgIGNvbnN0IGRlc2NUZXh0ID0gKHByb2R1Y3RPYmouZGVzY3JpcHRpb24gfHwgJycpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgLy8gVMOtbmggxJFp4buDbSBk4buxYSB0csOqbiBz4buRIHThu6sga2jDs2Ega2jhu5twXHJcbiAgICAgICAgICAgICAgbGV0IHNjb3JlID0gMDtcclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAvLyBO4bq/dSBjw7MgY+G7pW0gdOG7qyBj4bulIHRo4buDLCBjaG8gxJFp4buDbSBjYW8gaMahblxyXG4gICAgICAgICAgICAgIGZvciAoY29uc3QgeyBwaHJhc2UgfSBvZiBzcGVjaWZpY1BocmFzZXMpIHtcclxuICAgICAgICAgICAgICAgIGlmIChuYW1lVGV4dC5pbmNsdWRlcyhwaHJhc2UpKSBzY29yZSArPSA1O1xyXG4gICAgICAgICAgICAgICAgaWYgKGRlc2NUZXh0LmluY2x1ZGVzKHBocmFzZSkpIHNjb3JlICs9IDM7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIC8vIFTDrW5oIMSRaeG7g20gY2hvIHThu6tuZyB04burIGtow7NhXHJcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBrZXl3b3JkIG9mIGtleXdvcmRzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobmFtZVRleHQuaW5jbHVkZXMoa2V5d29yZCkpIHNjb3JlICs9IDI7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGVzY1RleHQuaW5jbHVkZXMoa2V5d29yZCkpIHNjb3JlICs9IDE7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIC8vIE7hur91IGto4bubcCBjaMOtbmggeMOhYyB24bubaSBj4bulbSB04burIHTDrG0ga2nhur9tLCBjaG8gxJFp4buDbSBjYW8gbmjhuqV0XHJcbiAgICAgICAgICAgICAgY29uc3QgZXhhY3RQaHJhc2UgPSBrZXl3b3Jkcy5qb2luKCcgJyk7XHJcbiAgICAgICAgICAgICAgaWYgKGV4YWN0UGhyYXNlLmxlbmd0aCA+IDMgJiYgbmFtZVRleHQuaW5jbHVkZXMoZXhhY3RQaHJhc2UpKSB7XHJcbiAgICAgICAgICAgICAgICBzY29yZSArPSAxMDtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgLi4ucHJvZHVjdE9iaixcclxuICAgICAgICAgICAgICAgIG1hdGNoU2NvcmU6IHNjb3JlXHJcbiAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIHTDrW5oIMSRaeG7g20gY2hvIHPhuqNuIHBo4bqpbTpcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgICAgIHJldHVybiB7IG1hdGNoU2NvcmU6IC0xIH07IC8vIFPhur0gYuG7iyBsb+G6oWkgYuG7jyBraGkgc+G6r3AgeOG6v3BcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSkuZmlsdGVyKHByb2R1Y3QgPT4gcHJvZHVjdC5tYXRjaFNjb3JlID4gLTEpOyAvLyBMb+G6oWkgYuG7jyBjw6FjIHPhuqNuIHBo4bqpbSBraMO0bmcgaOG7o3AgbOG7h1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBT4bqvcCB44bq/cCB0aGVvIMSRaeG7g20gY2FvIG5o4bqldCB0csaw4bubY1xyXG4gICAgICAgICAgcHJvZHVjdHMuc29ydCgoYSwgYikgPT4gYi5tYXRjaFNjb3JlIC0gYS5tYXRjaFNjb3JlKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gR2nhu5tpIGjhuqFuIGvhur90IHF14bqjXHJcbiAgICAgICAgICBwcm9kdWN0cyA9IHByb2R1Y3RzLnNsaWNlKDAsIDEwKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gTuG6v3Uga2jDtG5nIGPDsyBmaWx0ZXIgY+G7pSB0aOG7gywgbOG6pXkgc+G6o24gcGjhuqltIG3hu5tpIG5o4bqldFxyXG4gICAgICAgIHByb2R1Y3RzID0gYXdhaXQgUHJvZHVjdC5maW5kKCkuc29ydCh7IGNyZWF0ZWRBdDogLTEgfSkubGltaXQoMTApO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZyhgVMOsbSB0aOG6pXkgJHtwcm9kdWN0cy5sZW5ndGh9IHPhuqNuIHBo4bqpbSBwaMO5IGjhu6NwYCk7XHJcbiAgICAgIHJldHVybiBwcm9kdWN0cztcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgdMOsbSBraeG6v20gc+G6o24gcGjhuqltIHbhu5tpIE1vbmdvREI6XCIsIGVycm9yKTtcclxuICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgdMOsbSBraeG6v20gc+G6o24gcGjhuqltIHbhu5tpIE1vbmdvREI6XCIsIGVycm9yKTtcclxuICAgIHRocm93IGVycm9yO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBQaMOhdCBoaeG7h24gaW50ZW50IHThu6sgdGluIG5o4bqvblxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSAtIFRpbiBuaOG6r24gdOG7qyBuZ8aw4budaSBkw7luZ1xyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSAtIEludGVudCDEkcaw4bujYyBwaMOhdCBoaeG7h25cclxuICovXHJcbmNvbnN0IGRldGVjdEludGVudCA9IChtZXNzYWdlKSA9PiB7XHJcbiAgY29uc3QgbG93ZXJNZXNzYWdlID0gbWVzc2FnZS50b0xvd2VyQ2FzZSgpO1xyXG4gIC8vIEtp4buDbSB0cmEgeGVtIGPDsyBwaOG6o2kgbMOgIGPDonUgaOG7j2kgRkFRIGtow7RuZ1xyXG4gIGNvbnN0IGZhcUludGVudCA9IGRldGVjdEZBUUludGVudChsb3dlck1lc3NhZ2UpO1xyXG4gIGlmIChmYXFJbnRlbnQpIHtcclxuICAgIHJldHVybiBmYXFJbnRlbnQ7XHJcbiAgfVxyXG4gIC8vIFRow6ptIG5o4bqtbiBkaeG7h24gaW50ZW50IGPDtG5nIHRo4bupYyBu4bqldSDEg25cclxuICBpZiAoaXNDb29raW5nUXVlc3Rpb24obG93ZXJNZXNzYWdlKSkge1xyXG4gICAgcmV0dXJuICdjb29raW5nX3JlY2lwZSc7XHJcbiAgfVxyXG4gIC8vIE3huqt1IHjhu60gbMO9IGludGVudCDEkcahbiBnaeG6o25cclxuICBpZiAobG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdjaMOgbycpIHx8IGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnaGVsbG8nKSB8fCBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ2hpJykpIHtcclxuICAgIHJldHVybiAnZ3JlZXRpbmcnO1xyXG4gIH1cclxuICBpZiAobG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdnacOhJykgfHwgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdiYW8gbmhpw6p1JykpIHtcclxuICAgIHJldHVybiAncHJpY2UnO1xyXG4gIH1cclxuICBpZiAobG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdz4bqjbiBwaOG6qW0nKSB8fCBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ211YScpIHx8IGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnaMOgbmcnKSkge1xyXG4gICAgcmV0dXJuICdwcm9kdWN0JztcclxuICB9XHJcbiAgLy8gVHLhuqMgduG7gSBpbnRlbnQgbeG6t2MgxJHhu4tuaCBu4bq/dSBraMO0bmcgbmjhuq1uIGRp4buHbiDEkcaw4bujY1xyXG4gIHJldHVybiAndW5rbm93bic7XHJcbn07XHJcblxyXG4vKipcclxuICogUGjDoXQgaGnhu4duIGludGVudCBsacOqbiBxdWFuIMSR4bq/biBGQVFcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBUaW4gbmjhuq9uIHThu6sgbmfGsOG7nWkgZMO5bmcgxJHDoyBsb3dlcmNhc2VcclxuICogQHJldHVybnMge3N0cmluZ3xudWxsfSAtIEludGVudCBGQVEgaG/hurdjIG51bGwgbuG6v3Uga2jDtG5nIHBow6F0IGhp4buHblxyXG4gKi9cclxuY29uc3QgZGV0ZWN0RkFRSW50ZW50ID0gKG1lc3NhZ2UpID0+IHtcclxuICAvLyBNdWEgaMOgbmdcclxuICBpZiAobWVzc2FnZS5pbmNsdWRlcygnbMOgbSBzYW8gxJHhu4MgbXVhJykgfHwgXHJcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ211YSBow6BuZyBuaMawIHRo4bq/IG7DoG8nKSB8fCBcclxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygnY8OhY2ggbXVhJykgfHwgXHJcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ211YSBow6BuZycpIHx8XHJcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ211YSBuaMawIHRo4bq/IG7DoG8nKSB8fFxyXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdjw6FjaCB0aOG7qWMgbXVhJykpIHtcclxuICAgIHJldHVybiAnZmFxX2hvd190b19idXknO1xyXG4gIH1cclxuICBcclxuICAvLyDEkOG6t3QgaMOgbmdcclxuICBpZiAobWVzc2FnZS5pbmNsdWRlcygnxJHhurd0IGjDoG5nJykgfHwgXHJcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ2PDoWNoIMSR4bq3dCcpIHx8IFxyXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCfEkeG6t3QgbXVhJykgfHxcclxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygnxJHhurd0IG5oxrAgdGjhur8gbsOgbycpKSB7XHJcbiAgICByZXR1cm4gJ2ZhcV9ob3dfdG9fb3JkZXInO1xyXG4gIH1cclxuICBcclxuICAvLyBUaGFuaCB0b8OhblxyXG4gIGlmIChtZXNzYWdlLmluY2x1ZGVzKCd0aGFuaCB0b8OhbicpIHx8IFxyXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdwaMawxqFuZyB0aOG7qWMgdGhhbmggdG/DoW4nKSB8fCBcclxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygnY8OhY2ggdGhhbmggdG/DoW4nKSB8fFxyXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdow6xuaCB0aOG7qWMgdGhhbmggdG/DoW4nKSB8fFxyXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCd0cuG6oyB0aeG7gW4nKSB8fFxyXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdiYW8gbmhpw6p1IGjDrG5oIHRo4bupYyB0aGFuaCB0b8OhbicpKSB7XHJcbiAgICByZXR1cm4gJ2ZhcV9wYXltZW50X21ldGhvZHMnO1xyXG4gIH1cclxuICBcclxuICAvLyDEkOG7i2EgY2jhu4kgY+G7rWEgaMOgbmdcclxuICBpZiAobWVzc2FnZS5pbmNsdWRlcygnxJHhu4thIGNo4buJJykgfHwgXHJcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ2Phu61hIGjDoG5nIOG7nyDEkcOidScpIHx8IFxyXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdzaG9wIOG7nyDEkcOidScpIHx8XHJcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ3bhu4sgdHLDrScpIHx8XHJcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ8SR4buLYSDEkWnhu4NtJykpIHtcclxuICAgIHJldHVybiAnZmFxX3N0b3JlX2xvY2F0aW9uJztcclxuICB9XHJcbiAgXHJcbiAgLy8gQ2jhuqV0IGzGsOG7o25nIHPhuqNuIHBo4bqpbVxyXG4gIGlmIChtZXNzYWdlLmluY2x1ZGVzKCdjaOG6pXQgbMaw4bujbmcnKSB8fCBcclxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygnc+G6o24gcGjhuqltIGPDsyB04buRdCcpIHx8IFxyXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdjw7MgxJHhuqNtIGLhuqNvJykgfHxcclxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygnaMOgbmcgY8OzIHThu5F0JykgfHxcclxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygnc+G6o24gcGjhuqltIHThu5F0IGtow7RuZycpKSB7XHJcbiAgICByZXR1cm4gJ2ZhcV9wcm9kdWN0X3F1YWxpdHknO1xyXG4gIH1cclxuICBcclxuICAvLyBUaOG7nWkgZ2lhbiBnaWFvIGjDoG5nXHJcbiAgaWYgKG1lc3NhZ2UuaW5jbHVkZXMoJ2dpYW8gaMOgbmcnKSB8fCBcclxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygnc2hpcCcpIHx8IFxyXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCd24bqtbiBjaHV54buDbicpIHx8XHJcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ3Ro4budaSBnaWFuIGdpYW8nKSB8fFxyXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdnaWFvIHRyb25nIGJhbyBsw6J1JykgfHxcclxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygnbeG6pXQgYmFvIGzDonUgxJHhu4Mgbmjhuq1uJykpIHtcclxuICAgIHJldHVybiAnZmFxX3NoaXBwaW5nX3RpbWUnO1xyXG4gIH1cclxuICBcclxuICAvLyBDaMOtbmggc8OhY2ggxJHhu5VpIHRy4bqjXHJcbiAgaWYgKG1lc3NhZ2UuaW5jbHVkZXMoJ8SR4buVaSB0cuG6oycpIHx8IFxyXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdob8OgbiB0aeG7gW4nKSB8fCBcclxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygndHLhuqMgbOG6oWknKSB8fFxyXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCfEkeG7lWkgaMOgbmcnKSB8fFxyXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdi4buLIGzhu5dpJykgfHxcclxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygna2jDtG5nIGjDoGkgbMOybmcnKSkge1xyXG4gICAgcmV0dXJuICdmYXFfcmV0dXJuX3BvbGljeSc7XHJcbiAgfVxyXG4gIFxyXG4gIC8vIEtodXnhur9uIG3Do2kgaGnhu4duIGPDs1xyXG4gIGlmIChtZXNzYWdlLmluY2x1ZGVzKCdraHV54bq/biBtw6NpJykgfHwgXHJcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ2dp4bqjbSBnacOhJykgfHwgXHJcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ8awdSDEkcOjaScpIHx8XHJcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ2PDsyBtw6MgZ2nhuqNtJykgfHxcclxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygnxJFhbmcgZ2nhuqNtIGdpw6EnKSkge1xyXG4gICAgcmV0dXJuICdmYXFfcHJvbW90aW9ucyc7XHJcbiAgfVxyXG4gIFxyXG4gIC8vIFPhuqNuIHBo4bqpbSBt4bubaS9iw6FuIGNo4bqheVxyXG4gIGlmIChtZXNzYWdlLmluY2x1ZGVzKCdz4bqjbiBwaOG6qW0gbeG7m2knKSB8fCBcclxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygnbeG7m2kgcmEgbeG6r3QnKSB8fCBcclxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygnYsOhbiBjaOG6oXkgbmjhuqV0JykgfHxcclxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygncGjhu5UgYmnhur9uIG5o4bqldCcpIHx8XHJcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ2hvdCBuaOG6pXQnKSB8fFxyXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCd4dSBoxrDhu5tuZycpKSB7XHJcbiAgICByZXR1cm4gJ2ZhcV90cmVuZGluZ19wcm9kdWN0cyc7XHJcbiAgfVxyXG4gIFxyXG4gIC8vIFBow60gduG6rW4gY2h1eeG7g25cclxuICBpZiAobWVzc2FnZS5pbmNsdWRlcygncGjDrSB24bqtbiBjaHV54buDbicpIHx8IFxyXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdwaMOtIHNoaXAnKSB8fCBcclxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygncGjDrSBnaWFvIGjDoG5nJykgfHxcclxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygnc2hpcCBiYW8gbmhpw6p1IHRp4buBbicpIHx8XHJcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ3Thu5FuIGJhbyBuaGnDqnUgdGnhu4FuIGdpYW8gaMOgbmcnKSkge1xyXG4gICAgcmV0dXJuICdmYXFfc2hpcHBpbmdfZmVlJztcclxuICB9XHJcbiAgXHJcbiAgLy8gSOG7lyB0cuG7oyBraMOhY2ggaMOgbmdcclxuICBpZiAobWVzc2FnZS5pbmNsdWRlcygnaOG7lyB0cuG7oycpIHx8IFxyXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdsacOqbiBo4buHJykgfHwgXHJcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ3TGsCB24bqlbicpIHx8XHJcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ2hvdGxpbmUnKSB8fFxyXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdz4buRIMSRaeG7h24gdGhv4bqhaScpIHx8XHJcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ2VtYWlsJykpIHtcclxuICAgIHJldHVybiAnZmFxX2N1c3RvbWVyX3N1cHBvcnQnO1xyXG4gIH1cclxuICBcclxuICByZXR1cm4gbnVsbDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBLaeG7g20gdHJhIHhlbSBjw6J1IGjhu49pIGPDsyBwaOG7pSB0aHXhu5ljIHbDoG8gbmfhu68gY+G6o25oIHPhuqNuIHBo4bqpbSBraMO0bmdcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBDw6J1IGjhu49pIGPhu6dhIG5nxrDhu51pIGTDuW5nXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSAtIEPDsyBwaOG7pSB0aHXhu5ljIHbDoG8gbmfhu68gY+G6o25oIHPhuqNuIHBo4bqpbSBoYXkga2jDtG5nXHJcbiAqL1xyXG5jb25zdCBjaGVja0NvbnRleHREZXBlbmRlbnRRdWVyeSA9IChtZXNzYWdlKSA9PiB7XHJcbiAgY29uc3QgbG93ZXJNZXNzYWdlID0gbWVzc2FnZS50b0xvd2VyQ2FzZSgpO1xyXG4gIFxyXG4gIC8vIE7hur91IGzDoCBjw6J1IGjhu49pIHbhu4EgbcOzbiDEg24vY8O0bmcgdGjhu6ljIHRow6wgS0jDlE5HIHBo4bulIHRodeG7mWMgbmfhu68gY+G6o25oIHPhuqNuIHBo4bqpbVxyXG4gIGlmIChpc0Nvb2tpbmdRdWVzdGlvbihsb3dlck1lc3NhZ2UpKSByZXR1cm4gZmFsc2U7XHJcbiAgXHJcbiAgLy8gS2nhu4NtIHRyYSB4ZW0gY8OzIHBo4bqjaSBsw6AgY8OidSB0w6xtIGtp4bq/bSBt4bubaSBraMO0bmdcclxuICAvLyBO4bq/dSBsw6AgdMOsbSBraeG6v20gbeG7m2kgdGjDrCBraMO0bmcgcGjhu6UgdGh14buZYyBuZ+G7ryBj4bqjbmhcclxuICBpZiAobG93ZXJNZXNzYWdlLmluY2x1ZGVzKCd0w6xtJykgfHwgXHJcbiAgICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygna2nhur9tJykgfHwgXHJcbiAgICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnY8OzIHPhuqNuIHBo4bqpbScpIHx8IFxyXG4gICAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ2TGsOG7m2knKSB8fFxyXG4gICAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ3Ryw6puJykgfHxcclxuICAgICAgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdraG/huqNuZyBnacOhJykgfHxcclxuICAgICAgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdrICcpIHx8IFxyXG4gICAgICBsb3dlck1lc3NhZ2UubWF0Y2goL1xcZCtrLykpIHtcclxuICAgIGNvbnNvbGUubG9nKFwixJDDonkgbMOgIGPDonUgaOG7j2kgdMOsbSBraeG6v20gbeG7m2ksIGtow7RuZyBwaOG7pSB0aHXhu5ljIG5n4buvIGPhuqNuaFwiKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbiAgXHJcbiAgLy8gQ8OhYyBt4bqrdSBjw6J1IGjhu49pIHBo4bulIHRodeG7mWMgbmfhu68gY+G6o25oXHJcbiAgY29uc3QgY29udGV4dFBhdHRlcm5zID0gW1xyXG4gICAgLy8gQ8OidSBo4buPaSB24buBIGPDtG5nIGThu6VuZ1xyXG4gICAgL2PDtG5nIGThu6VuZy9pLCAvdMOhYyBk4bulbmcvaSwgL2TDuW5nIMSR4buDIGzDoG0gZ8OsL2ksIC9kw7luZyDEkeG7gy9pLCAvZMO5bmcgbmjGsCB0aOG6vyBuw6BvL2ksIC9z4butIGThu6VuZy9pLCAvY8OhY2ggZMO5bmcvaSxcclxuICAgIC8vIEPDonUgaOG7j2kgduG7gSBnacOhXHJcbiAgICAvZ2nDoSBiYW8gbmhpw6p1L2ksIC9iYW8gbmhpw6p1IHRp4buBbi9pLCAvZ2nDoS9pLCAvYmFvIG5oacOqdS9pLFxyXG4gICAgLy8gQ8OidSBo4buPaSB24buBIHh14bqldCB44bupLCB0aMOgbmggcGjhuqduXHJcbiAgICAveHXhuqV0IHjhu6kvaSwgL3PhuqNuIHh14bqldC9pLCAvdGjDoG5oIHBo4bqnbi9pLCAvbmd1ecOqbiBsaeG7h3UvaSwgL2PDsyBjaOG7qWEvaSwgL2LhuqNvIHF14bqjbi9pLFxyXG4gICAgLy8gQ8OidSBo4buPaSB24buBIGdp4bubaSB0aGnhu4d1XHJcbiAgICAvZ2nhu5tpIHRoaeG7h3UvaSwgL27Ds2kgduG7gS9pLCAvdGjDtG5nIHRpbiB24buBL2ksIC9tw7QgdOG6oy9pLFxyXG4gICAgLy8gxJDhuqFpIHThu6sgY2jhu4kgxJHhu4tuaCBraMO0bmcgcsO1IHLDoG5nXHJcbiAgICAvc+G6o24gcGjhuqltIG7DoHkvaSwgL27Dsy9pLCAvY8OhaSBuw6B5L2ksIC9tw7NuIG7DoHkvaSwgL2jDoG5nIG7DoHkvaSxcclxuICAgIC8vIFPhuqNuIHBo4bqpbSBsacOqbiBxdWFuXHJcbiAgICAvc+G6o24gcGjhuqltIGxpw6puIHF1YW4vaSwgL2xpw6puIHF1YW4vaSwgL3TGsMahbmcgdOG7sS9pLCAvZ2nhu5FuZy9pLCAvc+G6o24gcGjhuqltIGtow6FjL2ksXHJcbiAgICAvLyBDw6J1IGjhu49pIG3GoSBo4buTIGtow6FjIG3DoCBraMO0bmcgxJHhu4EgY+G6rXAgc+G6o24gcGjhuqltIGPhu6UgdGjhu4NcclxuICAgIC9o4bqhbiBz4butIGThu6VuZy9pLCAvYuG6o28gaMOgbmgvaSwgL2No4bqldCBsxrDhu6NuZy9pLCAvxJHDoW5oIGdpw6EvaSwgL3Jldmlldy9pXHJcbiAgXTtcclxuICBcclxuICByZXR1cm4gY29udGV4dFBhdHRlcm5zLnNvbWUocGF0dGVybiA9PiBwYXR0ZXJuLnRlc3QobG93ZXJNZXNzYWdlKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogS2nhu4NtIHRyYSBjw6J1IGjhu49pIHbhu4Egdmnhu4djIGPDsyBz4bqjbiBwaOG6qW0gbsOgbyDEkcOzIGtow7RuZ1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSAtIEPDonUgaOG7j2kgY+G7p2EgbmfGsOG7nWkgZMO5bmdcclxuICogQHJldHVybnMge3N0cmluZ3xudWxsfSAtIFTDqm4gc+G6o24gcGjhuqltIMSRxrDhu6NjIHRyw61jaCB4deG6pXQgaG/hurdjIG51bGwgbuG6v3Uga2jDtG5nIHBo4bqjaVxyXG4gKi9cclxuY29uc3QgY2hlY2tQcm9kdWN0QXZhaWxhYmlsaXR5UXVlc3Rpb24gPSAobWVzc2FnZSkgPT4ge1xyXG4gIGNvbnN0IGxvd2VyTWVzc2FnZSA9IG1lc3NhZ2UudG9Mb3dlckNhc2UoKTtcclxuICBcclxuICAvLyBN4bqrdSBjw6J1IGjhu49pIFwiQ8OzIHPhuqNuIHBo4bqpbSBYIGtow7RuZ1wiXHJcbiAgY29uc3QgcHJvZHVjdEF2YWlsYWJpbGl0eVBhdHRlcm5zID0gW1xyXG4gICAgL2PDsyAoYsOhbiB8Y3VuZyBj4bqlcCB8c+G6o24gcGjhuqltIHxow6BuZyB8KT8oW2EtekEtWjAtOcOALeG7uVxcc10rPykgKGtow7RuZ3xrb3xrfGhvbmd8aMO0bmcpKFxcPyk/JC9pLFxyXG4gICAgL3Nob3AgKGPDsyB8YsOhbiB8Y3VuZyBj4bqlcCB8KShbYS16QS1aMC05w4At4bu5XFxzXSs/KSAoa2jDtG5nfGtvfGt8aG9uZ3xow7RuZykoXFw/KT8kL2ksXHJcbiAgICAvY+G7rWEgaMOgbmcgKGPDsyB8YsOhbiB8Y3VuZyBj4bqlcCB8KShbYS16QS1aMC05w4At4bu5XFxzXSs/KSAoa2jDtG5nfGtvfGt8aG9uZ3xow7RuZykoXFw/KT8kL2lcclxuICBdO1xyXG4gIFxyXG4gIGZvciAoY29uc3QgcGF0dGVybiBvZiBwcm9kdWN0QXZhaWxhYmlsaXR5UGF0dGVybnMpIHtcclxuICAgIGNvbnN0IG1hdGNoID0gbG93ZXJNZXNzYWdlLm1hdGNoKHBhdHRlcm4pO1xyXG4gICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgIGNvbnN0IHByb2R1Y3ROYW1lID0gbWF0Y2hbMl0udHJpbSgpO1xyXG4gICAgICAvLyBMb+G6oWkgYuG7jyBjw6FjIHThu6sga2jDtG5nIGPhuqduIHRoaeG6v3RcclxuICAgICAgY29uc3Qgc3RvcFdvcmRzID0gWydz4bqjbiBwaOG6qW0nLCAnaMOgbmcnLCAnY8OhaScsICdtw7NuJywgJ8SR4buTJ107XHJcbiAgICAgIGxldCBjbGVhblByb2R1Y3ROYW1lID0gcHJvZHVjdE5hbWU7XHJcbiAgICAgIFxyXG4gICAgICBmb3IgKGNvbnN0IHdvcmQgb2Ygc3RvcFdvcmRzKSB7XHJcbiAgICAgICAgaWYgKGNsZWFuUHJvZHVjdE5hbWUuc3RhcnRzV2l0aCh3b3JkICsgJyAnKSkge1xyXG4gICAgICAgICAgY2xlYW5Qcm9kdWN0TmFtZSA9IGNsZWFuUHJvZHVjdE5hbWUuc3Vic3RyaW5nKHdvcmQubGVuZ3RoKS50cmltKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICByZXR1cm4gY2xlYW5Qcm9kdWN0TmFtZTtcclxuICAgIH1cclxuICB9XHJcbiAgXHJcbiAgcmV0dXJuIG51bGw7XHJcbn07XHJcblxyXG4vKipcclxuICogVOG6oW8gY8OidSB0cuG6oyBs4budaSBk4buxYSB0csOqbiBuZ+G7ryBj4bqjbmggc+G6o24gcGjhuqltXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIC0gQ8OidSBo4buPaSBj4bunYSBuZ8aw4budaSBkw7luZ1xyXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvZHVjdCAtIFRow7RuZyB0aW4gc+G6o24gcGjhuqltXHJcbiAqIEByZXR1cm5zIHtvYmplY3R8bnVsbH0gLSBDw6J1IHRy4bqjIGzhu51pIGhv4bq3YyBudWxsIG7hur91IGtow7RuZyB0aOG7gyB0cuG6oyBs4budaVxyXG4gKi9cclxuY29uc3QgZ2VuZXJhdGVDb250ZXh0UmVzcG9uc2UgPSAobWVzc2FnZSwgcHJvZHVjdCkgPT4ge1xyXG4gIGNvbnN0IGxvd2VyTWVzc2FnZSA9IG1lc3NhZ2UudG9Mb3dlckNhc2UoKTtcclxuICBcclxuICAvLyBLaeG7g20gdHJhIGzhuqFpIGzhuqduIG7hu69hIHByb2R1Y3QgY8OzIHThu5NuIHThuqFpIGtow7RuZ1xyXG4gIGlmICghcHJvZHVjdCkgcmV0dXJuIG51bGw7XHJcbiAgXHJcbiAgLy8gVOG6oW8gY8OidSB0cuG6oyBs4budaSBk4buxYSB2w6BvIGxv4bqhaSBjw6J1IGjhu49pXHJcbiAgbGV0IHJlc3BvbnNlTWVzc2FnZSA9ICcnO1xyXG4gIFxyXG4gIC8vIEPDonUgaOG7j2kgduG7gSBjw7RuZyBk4bulbmdcclxuICBpZiAoL2PDtG5nIGThu6VuZ3x0w6FjIGThu6VuZ3xkw7luZyDEkeG7gyBsw6BtIGfDrHxkw7luZyDEkeG7g3xkw7luZyBuaMawIHRo4bq/IG7DoG98c+G7rSBk4bulbmd8Y8OhY2ggZMO5bmcvLnRlc3QobG93ZXJNZXNzYWdlKSkge1xyXG4gICAgcmVzcG9uc2VNZXNzYWdlID0gcHJvZHVjdC5wcm9kdWN0RGV0YWlsc1xyXG4gICAgICA/IGAke3Byb2R1Y3QucHJvZHVjdE5hbWV9ICR7cHJvZHVjdC5wcm9kdWN0RGV0YWlsc31gXHJcbiAgICAgIDogYCR7cHJvZHVjdC5wcm9kdWN0TmFtZX0gbMOgIHPhuqNuIHBo4bqpbSAke3Byb2R1Y3QucHJvZHVjdENhdGVnb3J5IHx8IHByb2R1Y3QuY2F0ZWdvcnl9LiBWdWkgbMOybmcgeGVtIGNoaSB0aeG6v3Qgc+G6o24gcGjhuqltIMSR4buDIGJp4bq/dCB0aMOqbSB24buBIGPDtG5nIGThu6VuZy5gO1xyXG4gIH1cclxuICAvLyBDw6J1IGjhu49pIHbhu4EgZ2nhu5tpIHRoaeG7h3VcclxuICBlbHNlIGlmICgvZ2nhu5tpIHRoaeG7h3V8bsOzaSB24buBfHRow7RuZyB0aW4gduG7gXxtw7QgdOG6o3xz4bqjbiBwaOG6qW0gbsOgeXx0aOG6vyBuw6BvLy50ZXN0KGxvd2VyTWVzc2FnZSkpIHtcclxuICAgIHJlc3BvbnNlTWVzc2FnZSA9IHByb2R1Y3QucHJvZHVjdEludHJvZHVjdGlvblxyXG4gICAgICA/IGBHaeG7m2kgdGhp4buHdSB24buBICR7cHJvZHVjdC5wcm9kdWN0TmFtZX06ICR7cHJvZHVjdC5wcm9kdWN0SW50cm9kdWN0aW9ufWBcclxuICAgICAgOiBgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfSBsw6Agc+G6o24gcGjhuqltICR7cHJvZHVjdC5wcm9kdWN0Q2F0ZWdvcnkgfHwgcHJvZHVjdC5jYXRlZ29yeX0uIEhp4buHbiBjaMawYSBjw7MgdGjDtG5nIHRpbiBnaeG7m2kgdGhp4buHdSBjaGkgdGnhur90IHbhu4Egc+G6o24gcGjhuqltIG7DoHkuYDtcclxuICB9XHJcbiAgLy8gQ8OidSBo4buPaSB24buBIGdpw6FcclxuICBlbHNlIGlmICgvZ2nDoSBiYW8gbmhpw6p1fGJhbyBuaGnDqnUgdGnhu4FufGdpw6F8YmFvIG5oacOqdS8udGVzdChsb3dlck1lc3NhZ2UpKSB7XHJcbiAgICBjb25zdCBvcmlnaW5hbFByaWNlID0gcHJvZHVjdC5wcm9kdWN0UHJpY2UgfHwgcHJvZHVjdC5wcmljZSB8fCAwO1xyXG4gICAgY29uc3QgZGlzY291bnQgPSBwcm9kdWN0LnByb2R1Y3REaXNjb3VudCB8fCAwO1xyXG4gICAgY29uc3QgcHJvbW9QcmljZSA9IHByb2R1Y3QucHJvZHVjdFByb21vUHJpY2UgfHwgKGRpc2NvdW50ID4gMCA/IE1hdGgucm91bmQob3JpZ2luYWxQcmljZSAqICgxIC0gZGlzY291bnQvMTAwKSkgOiBvcmlnaW5hbFByaWNlKTtcclxuICBcclxuICAgIGlmIChkaXNjb3VudCA+IDApIHtcclxuICAgICAgcmVzcG9uc2VNZXNzYWdlID0gYEdpw6EgY+G7p2EgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfSBsw6AgJHtmb3JtYXRDdXJyZW5jeShwcm9tb1ByaWNlKX0gKMSQw6MgZ2nhuqNtICR7ZGlzY291bnR9JSB04burICR7Zm9ybWF0Q3VycmVuY3kob3JpZ2luYWxQcmljZSl9KS5gO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmVzcG9uc2VNZXNzYWdlID0gYEdpw6EgY+G7p2EgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfSBsw6AgJHtmb3JtYXRDdXJyZW5jeShvcmlnaW5hbFByaWNlKX0uYDtcclxuICAgIH1cclxuICB9XHJcbiAgLy8gQ8OidSBo4buPaSB24buBIHh14bqldCB44bupLCB0aMOgbmggcGjhuqduXHJcbiAgZWxzZSBpZiAoL3h14bqldCB44bupfHPhuqNuIHh14bqldHx0aMOgbmggcGjhuqdufG5ndXnDqm4gbGnhu4d1fGPDsyBjaOG7qWF8YuG6o28gcXXhuqNuLy50ZXN0KGxvd2VyTWVzc2FnZSkpIHtcclxuICAgIHJlc3BvbnNlTWVzc2FnZSA9IHByb2R1Y3QucHJvZHVjdE9yaWdpbiB8fCBwcm9kdWN0Lm9yaWdpblxyXG4gICAgICA/IGAke3Byb2R1Y3QucHJvZHVjdE5hbWV9IGPDsyB4deG6pXQgeOG7qSB04burICR7cHJvZHVjdC5wcm9kdWN0T3JpZ2luIHx8IHByb2R1Y3Qub3JpZ2lufS5gXHJcbiAgICAgIDogYFRow7RuZyB0aW4gY2hpIHRp4bq/dCB24buBIHh14bqldCB44bupIHbDoCB0aMOgbmggcGjhuqduIGPhu6dhICR7cHJvZHVjdC5wcm9kdWN0TmFtZX0gxJHGsOG7o2MgZ2hpIHLDtSB0csOqbiBiYW8gYsOsIHPhuqNuIHBo4bqpbS5gO1xyXG4gICAgXHJcbiAgICAvLyBUaMOqbSB0aMO0bmcgdGluIHRoxrDGoW5nIGhp4buHdSBu4bq/dSBjw7NcclxuICAgIGlmIChwcm9kdWN0LnByb2R1Y3RCcmFuZCkge1xyXG4gICAgICByZXNwb25zZU1lc3NhZ2UgKz0gYCBT4bqjbiBwaOG6qW0gdGh14buZYyB0aMawxqFuZyBoaeG7h3UgJHtwcm9kdWN0LnByb2R1Y3RCcmFuZH0uYDtcclxuICAgIH1cclxuICB9XHJcbiAgLy8gQ8OidSBo4buPaSB24buBIGjhuqFuIHPhu60gZOG7pW5nXHJcbiAgZWxzZSBpZiAoL2jhuqFuIHPhu60gZOG7pW5nfGLhuqNvIGjDoG5ofGNo4bqldCBsxrDhu6NuZy8udGVzdChsb3dlck1lc3NhZ2UpKSB7XHJcbiAgICByZXNwb25zZU1lc3NhZ2UgPSBwcm9kdWN0LmV4cGlyeURhdGVcclxuICAgICAgPyBgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfSBjw7MgaOG6oW4gc+G7rSBk4bulbmcgxJHhur9uICR7cHJvZHVjdC5leHBpcnlEYXRlfS5gXHJcbiAgICAgIDogYFRow7RuZyB0aW4gduG7gSBo4bqhbiBz4butIGThu6VuZyBj4bunYSAke3Byb2R1Y3QucHJvZHVjdE5hbWV9IMSRxrDhu6NjIGdoaSByw7UgdHLDqm4gYmFvIGLDrCBz4bqjbiBwaOG6qW0uYDtcclxuICB9XHJcbiAgLy8gQ8OhYyBjw6J1IGjhu49pIGNodW5nXHJcbiAgZWxzZSB7XHJcbiAgICBjb25zdCBwcmljZSA9IHByb2R1Y3QucHJvZHVjdFByaWNlIHx8IHByb2R1Y3QucHJpY2UgfHwgMDtcclxuICAgIHJlc3BvbnNlTWVzc2FnZSA9IGBT4bqjbiBwaOG6qW0gJHtwcm9kdWN0LnByb2R1Y3ROYW1lfSB0aHXhu5ljIGRhbmggbeG7pWMgJHtwcm9kdWN0LnByb2R1Y3RDYXRlZ29yeSB8fCBwcm9kdWN0LmNhdGVnb3J5fSB24bubaSBnacOhICR7Zm9ybWF0Q3VycmVuY3kocHJpY2UpfS4gQuG6oW4gbXXhu5FuIGJp4bq/dCB0aMOqbSB0aMO0bmcgdGluIGfDrCB24buBIHPhuqNuIHBo4bqpbSBuw6B5P2A7XHJcbiAgfVxyXG4gIFxyXG4gIHJldHVybiB7XHJcbiAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgdHlwZTogJ3RleHQnLFxyXG4gICAgbWVzc2FnZTogcmVzcG9uc2VNZXNzYWdlLFxyXG4gICAgcHJvZHVjdDogcHJvZHVjdCAvLyBUcuG6oyB24buBIHRow7RuZyB0aW4gc+G6o24gcGjhuqltIMSR4buDIGhp4buDbiB0aOG7iyBu4bq/dSBj4bqnblxyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogxJDhu4tuaCBk4bqhbmcgc+G7kSB0aeG7gW4gc2FuZyBWTkRcclxuICogQHBhcmFtIHtudW1iZXJ9IGFtb3VudCAtIFPhu5EgdGnhu4FuXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IC0gQ2h14buXaSB0aeG7gW4gxJHDoyDEkeG7i25oIGThuqFuZ1xyXG4gKi9cclxuY29uc3QgZm9ybWF0Q3VycmVuY3kgPSAoYW1vdW50KSA9PiB7XHJcbiAgLy8gxJDhuqNtIGLhuqNvIGFtb3VudCBsw6Agc+G7kVxyXG4gIGNvbnN0IHZhbGlkQW1vdW50ID0gTnVtYmVyKGFtb3VudCkgfHwgMDtcclxuICBcclxuICByZXR1cm4gbmV3IEludGwuTnVtYmVyRm9ybWF0KCd2aS1WTicsIHsgXHJcbiAgICBzdHlsZTogJ2N1cnJlbmN5JywgXHJcbiAgICBjdXJyZW5jeTogJ1ZORCcsXHJcbiAgICBtYXhpbXVtRnJhY3Rpb25EaWdpdHM6IDBcclxuICB9KS5mb3JtYXQodmFsaWRBbW91bnQpO1xyXG59O1xyXG5cclxuLy8gVGjDqm0gaMOgbSBuaOG6rW4gZGnhu4duIGPDonUgaOG7j2kgduG7gSBtw7NuIMSDbi9jw7RuZyB0aOG7qWNcclxuY29uc3QgaXNDb29raW5nUXVlc3Rpb24gPSAobWVzc2FnZSkgPT4ge1xyXG4gIGNvbnN0IGNvb2tpbmdLZXl3b3JkcyA9IFtcIm7huqV1XCIsIFwiY8O0bmcgdGjhu6ljXCIsIFwibmd1ecOqbiBsaeG7h3VcIiwgXCJjw6FjaCBsw6BtXCJdO1xyXG4gIHJldHVybiBjb29raW5nS2V5d29yZHMuc29tZShrdyA9PiBtZXNzYWdlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoa3cpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZXRlY3RzIGlmIHRoZSB1c2VyIGlzIHRyeWluZyB0byBzZWFyY2ggZm9yIG11bHRpcGxlIHByb2R1Y3RzIGluIG9uZSBtZXNzYWdlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIC0gVXNlcidzIG1lc3NhZ2VcclxuICogQHJldHVybnMge3N0cmluZ1tdfG51bGx9IC0gQXJyYXkgb2YgcHJvZHVjdCBxdWVyaWVzIG9yIG51bGwgaWYgbm90IGEgbXVsdGktcHJvZHVjdCBzZWFyY2hcclxuICovXHJcbmNvbnN0IGRldGVjdE11bHRpUHJvZHVjdFNlYXJjaCA9IChtZXNzYWdlKSA9PiB7XHJcbiAgaWYgKCFtZXNzYWdlKSByZXR1cm4gbnVsbDtcclxuICBcclxuICBjb25zdCBsb3dlck1lc3NhZ2UgPSBtZXNzYWdlLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xyXG4gIFxyXG4gIC8vIERhbmggc8OhY2ggY8OhYyB04burIGtob8OhIHPhuqNuIHBo4bqpbSBwaOG7lSBiaeG6v24gxJHhu4Mga2nhu4NtIHRyYVxyXG4gIGNvbnN0IGNvbW1vblByb2R1Y3RLZXl3b3JkcyA9IFtcclxuICAgICduxrDhu5tjIGdp4bq3dCcsICduxrDhu5tjIHLhu61hJywgJ27GsOG7m2Mgbmfhu410JywgJ27GsOG7m2MgZ2nhuqNpIGtow6F0JywgJ3BlcHNpJywgJ2NvY2EnLCBcclxuICAgICd0aOG7i3QnLCAnY8OhJywgJ3JhdScsICdj4bunJywgJ3F14bqjJywgJ2LDoW5oJywgJ2vhurlvJywgJ23DrCcsICdiw7puJywgXHJcbiAgICAnZ2lhIHbhu4snLCAnZOG6p3UgxINuJywgJ27GsOG7m2MgbeG6r20nLCAnbsaw4bubYyB0xrDGoW5nJywgJ3Phu69hJywgJ3Ryw6AnLCAnY8OgIHBow6onXHJcbiAgXTtcclxuICBcclxuICAvLyBLaeG7g20gdHJhIHhlbSB0aW4gbmjhuq9uIGPDsyBjaOG7qWEgw610IG5o4bqldCAyIHThu6sga2hvw6Egc+G6o24gcGjhuqltIGtow7RuZ1xyXG4gIGxldCBwcm9kdWN0S2V5d29yZHNGb3VuZCA9IFtdO1xyXG4gIGZvciAoY29uc3Qga2V5d29yZCBvZiBjb21tb25Qcm9kdWN0S2V5d29yZHMpIHtcclxuICAgIGlmIChsb3dlck1lc3NhZ2UuaW5jbHVkZXMoa2V5d29yZCkpIHtcclxuICAgICAgcHJvZHVjdEtleXdvcmRzRm91bmQucHVzaChrZXl3b3JkKTtcclxuICAgIH1cclxuICB9XHJcbiAgXHJcbiAgLy8gTuG6v3UgdMOsbSB0aOG6pXkgw610IG5o4bqldCAyIHThu6sga2hvw6Egc+G6o24gcGjhuqltLCBjb2kgbMOgIHTDrG0ga2nhur9tIG5oaeG7gXUgc+G6o24gcGjhuqltXHJcbiAgY29uc3QgaGFzTXVsdGlwbGVQcm9kdWN0S2V5d29yZHMgPSBwcm9kdWN0S2V5d29yZHNGb3VuZC5sZW5ndGggPj0gMjtcclxuICBcclxuICAvLyBDaGVjayBmb3IgbXVsdGktcHJvZHVjdCBzZWFyY2ggaW5kaWNhdG9yc1xyXG4gIGNvbnN0IGhhc011bHRpU2VhcmNoSW5kaWNhdG9yID0gXHJcbiAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ25oaeG7gXUgc+G6o24gcGjhuqltJykgfHwgXHJcbiAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ25oaeG7gXUgbG/huqFpJykgfHxcclxuICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygndMOsbSBuaGnhu4F1JykgfHxcclxuICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnY8O5bmcgbMO6YycpIHx8XHJcbiAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ3NvIHPDoW5oJykgfHxcclxuICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnxJHhu5FpIGNoaeG6v3UnKSB8fFxyXG4gICAgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdjw6FjIGxv4bqhaScpIHx8XHJcbiAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ2PDoWMgc+G6o24gcGjhuqltJykgfHxcclxuICAgIGxvd2VyTWVzc2FnZS5tYXRjaCgvdMOsbS4rdsOgLisvKSAhPT0gbnVsbCB8fFxyXG4gICAgLy8gVGjDqm0gbmjhuq1uIGRp4buHbiBraGkgdGluIG5o4bqvbiBjaOG7qWEgXCJ0w6xtXCIgdsOgIGThuqV1IHBo4bqpeVxyXG4gICAgbG93ZXJNZXNzYWdlLm1hdGNoKC90w6xtLissLisvKSAhPT0gbnVsbCB8fFxyXG4gICAgLy8gSG/hurdjIGtoaSBjaOG7qWEgdOG7qyB0w6xtIGtp4bq/bSB2w6AgY2jhu6lhIMOtdCBuaOG6pXQgMiB04burIGtob8OhIHPhuqNuIHBo4bqpbVxyXG4gICAgKGxvd2VyTWVzc2FnZS5pbmNsdWRlcygndMOsbScpICYmIGhhc011bHRpcGxlUHJvZHVjdEtleXdvcmRzKTtcclxuICBcclxuICAvLyBO4bq/dSBraMO0bmcgY8OzIGThuqV1IGhp4buHdSB0w6xtIG5oaeG7gXUgc+G6o24gcGjhuqltLCBraeG7g20gdHJhIHRow6ptIGPDoWMgdHLGsOG7nW5nIGjhu6NwIMSR4bq3YyBiaeG7h3RcclxuICBpZiAoIWhhc011bHRpU2VhcmNoSW5kaWNhdG9yKSB7XHJcbiAgICAvLyBLaeG7g20gdHJhIHhlbSBjw7MgcGjhuqNpIHRpbiBuaOG6r24gY2jhu4kgbGnhu4d0IGvDqiBjw6FjIHPhuqNuIHBo4bqpbSBraMO0bmcsIHbDrSBk4bulOiBcIm7GsOG7m2MgZ2nhurd0IG7GsOG7m2MgcuG7rWEgY2jDqW5cIlxyXG4gICAgaWYgKGhhc011bHRpcGxlUHJvZHVjdEtleXdvcmRzKSB7XHJcbiAgICAgIC8vIE7hur91IGPDsyBjaOG7qWEgw610IG5o4bqldCAyIHThu6sga2hvw6Egc+G6o24gcGjhuqltIG3DoCBraMO0bmcgY8OzIHThu6sga2hvw6EgdMOsbSBraeG6v20sXHJcbiAgICAgIC8vIGdp4bqjIMSR4buLbmggbMOgIG5nxrDhu51pIGTDuW5nIMSRYW5nIG114buRbiB0w6xtIG5oaeG7gXUgc+G6o24gcGjhuqltXHJcbiAgICAgIGNvbnNvbGUubG9nKFwiUGjDoXQgaGnhu4duIHnDqnUgY+G6p3UgdMOsbSBuaGnhu4F1IHPhuqNuIHBo4bqpbSB04burIGRhbmggc8OhY2ggdOG7qyBraG/DoTpcIiwgcHJvZHVjdEtleXdvcmRzRm91bmQpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gS2jDtG5nIHBo4bqjaSB0aW4gbmjhuq9uIHTDrG0gbmhp4buBdSBz4bqjbiBwaOG6qW1cclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG4gIFxyXG4gIC8vIENvbW1vbiBzZXBhcmF0b3JzIGluIFZpZXRuYW1lc2UgcXVlcmllc1xyXG4gIGNvbnN0IHNlcGFyYXRvcnMgPSBbJywnLCAndsOgJywgJ3bhu5tpJywgJ2PDuW5nIHbhu5tpJywgJzsnLCAnKycsICdzbyB24bubaScsICdzbyBzw6FuaCB24bubaSddO1xyXG4gIFxyXG4gIC8vIFRyeSB0byBzcGxpdCBieSBjb21tb24gc2VwYXJhdG9yc1xyXG4gIGxldCBwYXJ0cyA9IFtdO1xyXG4gIFxyXG4gIC8vIFNwZWNpYWwgaGFuZGxpbmcgZm9yIGNvbXBhcmlzb24gcXVlcmllc1xyXG4gIGlmIChsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ3NvIHPDoW5oJykgfHwgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCfEkeG7kWkgY2hp4bq/dScpKSB7XHJcbiAgICBjb25zdCBjb21wYXJpc29uVGVybXMgPSBbJ3NvIHPDoW5oJywgJ8SR4buRaSBjaGnhur91JywgJ3NvIHbhu5tpJywgJ8SR4buRaSB24bubaScsICdzbycsICdoxqFuJywgJ2vDqW0nLCAndGh1YSddO1xyXG4gICAgXHJcbiAgICAvLyBFeHRyYWN0IHRoZSBwYXJ0IGFmdGVyIGNvbXBhcmlzb24ga2V5d29yZHNcclxuICAgIGxldCBjbGVhbk1lc3NhZ2UgPSBsb3dlck1lc3NhZ2U7XHJcbiAgICBmb3IgKGNvbnN0IHRlcm0gb2YgY29tcGFyaXNvblRlcm1zKSB7XHJcbiAgICAgIGlmIChsb3dlck1lc3NhZ2UuaW5jbHVkZXModGVybSkpIHtcclxuICAgICAgICBjb25zdCBzcGxpdFJlc3VsdCA9IGxvd2VyTWVzc2FnZS5zcGxpdCh0ZXJtKTtcclxuICAgICAgICBjbGVhbk1lc3NhZ2UgPSBzcGxpdFJlc3VsdC5sZW5ndGggPiAxICYmIHNwbGl0UmVzdWx0WzFdID8gc3BsaXRSZXN1bHRbMV0udHJpbSgpIDogbG93ZXJNZXNzYWdlO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIElmIHdlIGhhdmUgYSBjbGVhbmVyIG1lc3NhZ2UgYWZ0ZXIgY29tcGFyaXNvbiB0ZXJtcywgdHJ5IHRvIHNwbGl0IGl0XHJcbiAgICBpZiAoY2xlYW5NZXNzYWdlICE9PSBsb3dlck1lc3NhZ2UpIHtcclxuICAgICAgZm9yIChjb25zdCBzZXBhcmF0b3Igb2Ygc2VwYXJhdG9ycykge1xyXG4gICAgICAgIGlmIChjbGVhbk1lc3NhZ2UuaW5jbHVkZXMoc2VwYXJhdG9yKSkge1xyXG4gICAgICAgICAgaWYgKHNlcGFyYXRvciA9PT0gJ3bDoCcpIHtcclxuICAgICAgICAgICAgcGFydHMgPSBjbGVhbk1lc3NhZ2Uuc3BsaXQoL1xccyt2w6BcXHMrL2kpLmZpbHRlcihwID0+IHAudHJpbSgpLmxlbmd0aCA+IDApO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChzZXBhcmF0b3IgPT09ICd24bubaScgfHwgc2VwYXJhdG9yID09PSAnc28gduG7m2knIHx8IHNlcGFyYXRvciA9PT0gJ3NvIHPDoW5oIHbhu5tpJykge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIGhhbmRsaW5nIGZvciAnduG7m2knIGFzIGl0IGNhbiBiZSBwYXJ0IG9mIG90aGVyIHBocmFzZXNcclxuICAgICAgICAgICAgcGFydHMgPSBjbGVhbk1lc3NhZ2Uuc3BsaXQoL1xccysoduG7m2l8c28gduG7m2l8c28gc8OhbmggduG7m2kpXFxzKy9pKS5maWx0ZXIocCA9PiBwLnRyaW0oKS5sZW5ndGggPiAwKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHBhcnRzID0gY2xlYW5NZXNzYWdlLnNwbGl0KHNlcGFyYXRvcikuZmlsdGVyKHAgPT4gcC50cmltKCkubGVuZ3RoID4gMCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgLy8gUmVndWxhciBub24tY29tcGFyaXNvbiBtdWx0aS1wcm9kdWN0IHNlYXJjaFxyXG4gICAgZm9yIChjb25zdCBzZXBhcmF0b3Igb2Ygc2VwYXJhdG9ycykge1xyXG4gICAgICAvLyBJZiB3ZSBhbHJlYWR5IGhhdmUgbXVsdGlwbGUgcGFydHMsIGJyZWFrXHJcbiAgICAgIGlmIChwYXJ0cy5sZW5ndGggPiAxKSBicmVhaztcclxuICAgICAgXHJcbiAgICAgIC8vIFRyeSBzcGxpdHRpbmcgYnkgdGhpcyBzZXBhcmF0b3JcclxuICAgICAgaWYgKG1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhzZXBhcmF0b3IpKSB7XHJcbiAgICAgICAgLy8gSGFuZGxlIFwidsOgXCIgc3BlY2lhbGx5IHRvIGF2b2lkIHNwbGl0dGluZyBwaHJhc2VzIGxpa2UgXCJyYXUgdsOgIGPhu6dcIiB0aGF0IHNob3VsZCBzdGF5IHRvZ2V0aGVyXHJcbiAgICAgICAgaWYgKHNlcGFyYXRvciA9PT0gJ3bDoCcpIHtcclxuICAgICAgICAgIHBhcnRzID0gbWVzc2FnZS5zcGxpdCgvXFxzK3bDoFxccysvaSkuZmlsdGVyKHAgPT4gcC50cmltKCkubGVuZ3RoID4gMCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChzZXBhcmF0b3IgPT09ICd24bubaScgfHwgc2VwYXJhdG9yID09PSAnc28gduG7m2knIHx8IHNlcGFyYXRvciA9PT0gJ3NvIHPDoW5oIHbhu5tpJykge1xyXG4gICAgICAgICAgLy8gU3BlY2lhbCBoYW5kbGluZyBmb3IgJ3bhu5tpJyBhcyBpdCBjYW4gYmUgcGFydCBvZiBvdGhlciBwaHJhc2VzXHJcbiAgICAgICAgICBwYXJ0cyA9IG1lc3NhZ2Uuc3BsaXQoL1xccysoduG7m2l8c28gduG7m2l8c28gc8OhbmggduG7m2kpXFxzKy9pKS5maWx0ZXIocCA9PiBwLnRyaW0oKS5sZW5ndGggPiAwKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcGFydHMgPSBtZXNzYWdlLnNwbGl0KHNlcGFyYXRvcikuZmlsdGVyKHAgPT4gcC50cmltKCkubGVuZ3RoID4gMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIFxyXG4gIC8vIE7hur91IGtow7RuZyB0w6FjaCDEkcaw4bujYyB2w6AgY8OzIG5oaeG7gXUgdOG7qyBraG/DoSBz4bqjbiBwaOG6qW0sIHThuqFvIHJhIGPDoWMgcGjhuqduIHThu6sgY8OhYyB04burIGtob8OhIMSRw7NcclxuICBpZiAocGFydHMubGVuZ3RoIDw9IDEgJiYgcHJvZHVjdEtleXdvcmRzRm91bmQubGVuZ3RoID49IDIpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiVOG6oW8gY8OhYyBwaOG6p24gdMOsbSBraeG6v20gdOG7qyBjw6FjIHThu6sga2hvw6Egc+G6o24gcGjhuqltIHBow6F0IGhp4buHbiDEkcaw4bujY1wiKTtcclxuICAgIFxyXG4gICAgLy8gTG/huqFpIGLhu48gXCJ0w6xtXCIsIFwidMOsbSBraeG6v21cIiB04burIHRpbiBuaOG6r25cclxuICAgIGxldCBjbGVhbk1lc3NhZ2UgPSBsb3dlck1lc3NhZ2VcclxuICAgICAgLnJlcGxhY2UoL3TDrG0ga2nhur9tL2ksICcnKVxyXG4gICAgICAucmVwbGFjZSgvdMOsbS9pLCAnJylcclxuICAgICAgLnRyaW0oKTtcclxuICAgIFxyXG4gICAgLy8gVGjhu60gcGjDoXQgaGnhu4duIGPDoWMgc+G6o24gcGjhuqltIGThu7FhIHRyw6puIGPDoWMgdOG7qyBraG/DoSBwaOG7lSBiaeG6v25cclxuICAgIHBhcnRzID0gW107XHJcbiAgICBmb3IgKGNvbnN0IGtleXdvcmQgb2YgcHJvZHVjdEtleXdvcmRzRm91bmQpIHtcclxuICAgICAgLy8gVOG6oW8gcmVnZXggxJHhu4MgbOG6pXkgY29udGV4dCB4dW5nIHF1YW5oIHThu6sga2hvw6FcclxuICAgICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKGAoXFxcXHcrXFxcXHMrKT8oXFxcXHcrXFxcXHMrKT8ke2tleXdvcmR9KFxcXFxzK1xcXFx3Kyk/KFxcXFxzK1xcXFx3Kyk/YCwgJ2knKTtcclxuICAgICAgY29uc3QgbWF0Y2ggPSBjbGVhbk1lc3NhZ2UubWF0Y2gocmVnZXgpO1xyXG4gICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICBwYXJ0cy5wdXNoKG1hdGNoWzBdLnRyaW0oKSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcGFydHMucHVzaChrZXl3b3JkKTsgIC8vIE7hur91IGtow7RuZyBs4bqleSDEkcaw4bujYyBjb250ZXh0LCBkw7luZyBjaMOtbmggdOG7qyBraG/DoVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIFxyXG4gIC8vIElmIHdlIGNvdWxkbid0IHNwbGl0IGJ5IHNlcGFyYXRvcnMgYnV0IGhhcyBtdWx0aS1zZWFyY2ggaW5kaWNhdG9yLFxyXG4gIC8vIHRyeSB0byBleHRyYWN0IHByb2R1Y3QgbmFtZXMgdXNpbmcgTkxQLWxpa2UgYXBwcm9hY2hcclxuICBpZiAocGFydHMubGVuZ3RoIDw9IDEpIHtcclxuICAgIC8vIEV4dHJhY3QgcHJvZHVjdCBuYW1lcyBhZnRlciByZW1vdmluZyBjb21tb24gcHJlZml4ZXNcclxuICAgIGNvbnN0IGNsZWFuTWVzc2FnZSA9IGxvd2VyTWVzc2FnZVxyXG4gICAgICAucmVwbGFjZSgvc28gc8OhbmggKGdp4buvYXxj4bunYXx24buBfGdpw6F8Y2jhuqV0IGzGsOG7o25nfMawdSDEkWnhu4NtfG5oxrDhu6NjIMSRaeG7g20pIC9pLCAnJylcclxuICAgICAgLnJlcGxhY2UoL3NvIHPDoW5oL2ksICcnKVxyXG4gICAgICAucmVwbGFjZSgvxJHhu5FpIGNoaeG6v3UvaSwgJycpXHJcbiAgICAgIC5yZXBsYWNlKC90w6xtIG5oaeG7gXUgKHPhuqNuIHBo4bqpbXxsb+G6oWl8dGjhu6kpIChuaMawfGzDoHxn4buTbXxiYW8gZ+G7k218Y8OzKS9pLCAnJylcclxuICAgICAgLnJlcGxhY2UoL3TDrG0gKGPDoWN8bmjhu69uZykgKHPhuqNuIHBo4bqpbXxsb+G6oWl8dGjhu6kpIChuaMawfGzDoHxn4buTbXxiYW8gZ+G7k218Y8OzKS9pLCAnJylcclxuICAgICAgLnJlcGxhY2UoL3TDrG0gKGPDoWN8bmjhu69uZ3xuaGnhu4F1KS9pLCAnJylcclxuICAgICAgLnJlcGxhY2UoL2PDoWMgbG/huqFpL2ksICcnKVxyXG4gICAgICAucmVwbGFjZSgvY8OhYyBz4bqjbiBwaOG6qW0vaSwgJycpXHJcbiAgICAgIC50cmltKCk7XHJcbiAgICBcclxuICAgIC8vIFJlLWF0dGVtcHQgdG8gc3BsaXQgYWZ0ZXIgY2xlYW5pbmdcclxuICAgIGZvciAoY29uc3Qgc2VwYXJhdG9yIG9mIHNlcGFyYXRvcnMpIHtcclxuICAgICAgaWYgKGNsZWFuTWVzc2FnZS5pbmNsdWRlcyhzZXBhcmF0b3IpKSB7XHJcbiAgICAgICAgaWYgKHNlcGFyYXRvciA9PT0gJ3bDoCcpIHtcclxuICAgICAgICAgIHBhcnRzID0gY2xlYW5NZXNzYWdlLnNwbGl0KC9cXHMrdsOgXFxzKy9pKS5maWx0ZXIocCA9PiBwLnRyaW0oKS5sZW5ndGggPiAwKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHNlcGFyYXRvciA9PT0gJ3bhu5tpJyB8fCBzZXBhcmF0b3IgPT09ICdzbyB24bubaScgfHwgc2VwYXJhdG9yID09PSAnc28gc8OhbmggduG7m2knKSB7XHJcbiAgICAgICAgICBwYXJ0cyA9IGNsZWFuTWVzc2FnZS5zcGxpdCgvXFxzKyh24bubaXxzbyB24bubaXxzbyBzw6FuaCB24bubaSlcXHMrL2kpLmZpbHRlcihwID0+IHAudHJpbSgpLmxlbmd0aCA+IDApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBwYXJ0cyA9IGNsZWFuTWVzc2FnZS5zcGxpdChzZXBhcmF0b3IpLmZpbHRlcihwID0+IHAudHJpbSgpLmxlbmd0aCA+IDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBJZiB3ZSBzdGlsbCBjb3VsZG4ndCBzcGxpdCBpdCwgdHJ5IGxvb2tpbmcgZm9yIHByb2R1Y3QgY2F0ZWdvcmllcyBvciBjb21tb24gcHJvZHVjdHNcclxuICAgIGlmIChwYXJ0cy5sZW5ndGggPD0gMSkge1xyXG4gICAgICBjb25zdCBjb21tb25DYXRlZ29yaWVzID0gW1xyXG4gICAgICAgICdyYXUnLCAnY+G7pycsICdxdeG6oycsICd0aOG7i3QnLCAnY8OhJywgJ2jhuqNpIHPhuqNuJywgJ8SR4buTIHXhu5FuZycsICduxrDhu5tjIG5n4buNdCcsIFxyXG4gICAgICAgICdiaWEnLCAncsaw4bujdScsICdiw6FuaCcsICdr4bq5bycsICdnaWEgduG7iycsICdk4bqndSDEg24nLCAnbsaw4bubYyBt4bqvbScsICdtw6wnLCAnYsO6bicsXHJcbiAgICAgICAgJ27GsOG7m2MgZ2nhurd0JywgJ27GsOG7m2MgcuG7rWEnLCAnbsaw4bubYyB04bqpeSdcclxuICAgICAgXTtcclxuICAgICAgXHJcbiAgICAgIC8vIFRyeSB0byBpZGVudGlmeSBjYXRlZ29yaWVzIGluIHRoZSBtZXNzYWdlXHJcbiAgICAgIGNvbnN0IGNhdGVnb3JpZXMgPSBbXTtcclxuICAgICAgZm9yIChjb25zdCBjYXRlZ29yeSBvZiBjb21tb25DYXRlZ29yaWVzKSB7XHJcbiAgICAgICAgaWYgKGNsZWFuTWVzc2FnZS5pbmNsdWRlcyhjYXRlZ29yeSkpIHtcclxuICAgICAgICAgIC8vIEV4dHJhY3Qgc3Vycm91bmRpbmcgY29udGV4dCAodXAgdG8gMiB3b3JkcyBiZWZvcmUgYW5kIGFmdGVyKVxyXG4gICAgICAgICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKGAoXFxcXHcrXFxcXHMrKT8oXFxcXHcrXFxcXHMrKT8ke2NhdGVnb3J5fShcXFxccytcXFxcdyspPyhcXFxccytcXFxcdyspP2AsICdpJyk7XHJcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IGNsZWFuTWVzc2FnZS5tYXRjaChyZWdleCk7XHJcbiAgICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgY2F0ZWdvcmllcy5wdXNoKG1hdGNoWzBdLnRyaW0oKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBJZiB3ZSBmb3VuZCBhdCBsZWFzdCAyIGNhdGVnb3JpZXMsIHVzZSB0aGVtIGFzIHBhcnRzXHJcbiAgICAgIGlmIChjYXRlZ29yaWVzLmxlbmd0aCA+PSAyKSB7XHJcbiAgICAgICAgcGFydHMgPSBjYXRlZ29yaWVzO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIFxyXG4gIC8vIFjhu60gbMO9IHRyxrDhu51uZyBo4bujcCDEkeG6p3UgdsOgbyBuaMawIFwibsaw4bubYyBnaeG6t3Qgbsaw4bubYyBy4butYSBjaMOpblwiIChraMO0bmcgY8OzIGThuqV1IHBow6JuIGPDoWNoKVxyXG4gIGlmIChwYXJ0cy5sZW5ndGggPD0gMSAmJiBoYXNNdWx0aXBsZVByb2R1Y3RLZXl3b3Jkcykge1xyXG4gICAgLy8gVGjhu60gdMOhY2ggZOG7sWEgdsOgbyB04burIGtob8OhIHBo4buVIGJp4bq/blxyXG4gICAgbGV0IHJlbWFpbmluZ1RleHQgPSBsb3dlck1lc3NhZ2U7XHJcbiAgICBwYXJ0cyA9IFtdO1xyXG4gICAgXHJcbiAgICAvLyBT4bqvcCB44bq/cCBjw6FjIHThu6sga2hvw6EgdGhlbyDEkeG7mSBkw6BpIGdp4bqjbSBk4bqnbiDEkeG7gyDEkeG6o20gYuG6o28gdMOsbSB0aOG6pXkgdOG7qyBkw6BpIG5o4bqldCB0csaw4bubY1xyXG4gICAgY29uc3Qgc29ydGVkS2V5d29yZHMgPSBbLi4uY29tbW9uUHJvZHVjdEtleXdvcmRzXS5zb3J0KChhLCBiKSA9PiBiLmxlbmd0aCAtIGEubGVuZ3RoKTtcclxuICAgIFxyXG4gICAgd2hpbGUgKHJlbWFpbmluZ1RleHQubGVuZ3RoID4gMCkge1xyXG4gICAgICBsZXQgZm91bmQgPSBmYWxzZTtcclxuICAgICAgXHJcbiAgICAgIGZvciAoY29uc3Qga2V5d29yZCBvZiBzb3J0ZWRLZXl3b3Jkcykge1xyXG4gICAgICAgIGlmIChyZW1haW5pbmdUZXh0LmluY2x1ZGVzKGtleXdvcmQpKSB7XHJcbiAgICAgICAgICBjb25zdCBpbmRleCA9IHJlbWFpbmluZ1RleHQuaW5kZXhPZihrZXl3b3JkKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gTuG6v3UgY8OzIG7hu5lpIGR1bmcgdHLGsOG7m2MgdOG7qyBraG/DoSB2w6AgbsOzIGtow7RuZyBjaOG7iSBsw6Aga2hv4bqjbmcgdHLhuq9uZ1xyXG4gICAgICAgICAgaWYgKGluZGV4ID4gMCkge1xyXG4gICAgICAgICAgICBjb25zdCBiZWZvcmVUZXh0ID0gcmVtYWluaW5nVGV4dC5zdWJzdHJpbmcoMCwgaW5kZXgpLnRyaW0oKTtcclxuICAgICAgICAgICAgaWYgKGJlZm9yZVRleHQubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgIHBhcnRzLnB1c2goYmVmb3JlVGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gVGjDqm0gY+G7pW0gdOG7qyBraG/DoSB2w6AgY29udGV4dCB4dW5nIHF1YW5oXHJcbiAgICAgICAgICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAoYChcXFxcdytcXFxccyspPyhcXFxcdytcXFxccyspPyR7a2V5d29yZH0oXFxcXHMrXFxcXHcrKT8oXFxcXHMrXFxcXHcrKT9gLCAnaScpO1xyXG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSByZW1haW5pbmdUZXh0Lm1hdGNoKHJlZ2V4KTtcclxuICAgICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICBwYXJ0cy5wdXNoKG1hdGNoWzBdLnRyaW0oKSk7XHJcbiAgICAgICAgICAgIHJlbWFpbmluZ1RleHQgPSByZW1haW5pbmdUZXh0LnN1YnN0cmluZyhpbmRleCArIGtleXdvcmQubGVuZ3RoKS50cmltKCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBwYXJ0cy5wdXNoKGtleXdvcmQpO1xyXG4gICAgICAgICAgICByZW1haW5pbmdUZXh0ID0gcmVtYWluaW5nVGV4dC5zdWJzdHJpbmcoaW5kZXggKyBrZXl3b3JkLmxlbmd0aCkudHJpbSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBmb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vIE7hur91IGtow7RuZyB0w6xtIHRo4bqleSB04burIGtob8OhIG7DoG8gbuG7r2EsIHRow6ptIHBo4bqnbiBjw7JuIGzhuqFpIHbDoG8gcGFydHMgbuG6v3UgY8OyblxyXG4gICAgICBpZiAoIWZvdW5kKSB7XHJcbiAgICAgICAgaWYgKHJlbWFpbmluZ1RleHQudHJpbSgpLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgIHBhcnRzLnB1c2gocmVtYWluaW5nVGV4dC50cmltKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICBcclxuICAvLyBMb+G6oWkgYuG7jyBjw6FjIHBo4bqnbiB0csO5bmcgbOG6t3BcclxuICBwYXJ0cyA9IFsuLi5uZXcgU2V0KHBhcnRzKV07XHJcbiAgXHJcbiAgLy8gTG/huqFpIGLhu48gY8OhYyBwaOG6p24gcXXDoSBuZ+G6r24gKMOtdCBoxqFuIDIga8O9IHThu7EpXHJcbiAgcGFydHMgPSBwYXJ0cy5maWx0ZXIocCA9PiBwLmxlbmd0aCA+PSAyKTtcclxuICBcclxuICAvLyBPbmx5IGNvbnNpZGVyIGl0IGEgbXVsdGktcHJvZHVjdCBzZWFyY2ggaWYgd2UgaGF2ZSBhdCBsZWFzdCAyIHBhcnRzXHJcbiAgaWYgKHBhcnRzLmxlbmd0aCA+PSAyKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIlTDrG0ga2nhur9tIG5oaeG7gXUgc+G6o24gcGjhuqltIMSRxrDhu6NjIHBow6F0IGhp4buHbjpcIiwgcGFydHMpO1xyXG4gICAgcmV0dXJuIHBhcnRzLm1hcChwID0+IHAudHJpbSgpKTtcclxuICB9XHJcbiAgXHJcbiAgLy8gTuG6v3UgduG6q24ga2jDtG5nIHTDrG0gxJHGsOG7o2Mgbmhp4buBdSBz4bqjbiBwaOG6qW0gZMO5IMSRw6MgcGjDoXQgaGnhu4duIGThuqV1IGhp4buHdSwgXHJcbiAgLy8gY+G7kSBn4bqvbmcgcGjDom4gdMOtY2ggY8OidSBt4buZdCBjw6FjaCB0aMO0bmcgbWluaCBoxqFuXHJcbiAgaWYgKGhhc011bHRpU2VhcmNoSW5kaWNhdG9yIHx8IGhhc011bHRpcGxlUHJvZHVjdEtleXdvcmRzKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIkPhu5EgZ+G6r25nIHBow6JuIHTDrWNoIGPDonUgdGjDtG5nIG1pbmggaMahbiAtIGxvd2VyTWVzc2FnZTpcIiwgbG93ZXJNZXNzYWdlKTtcclxuICAgIFxyXG4gICAgLy8gVOG6oW8gZGFuaCBzw6FjaCB04burIGtob8OhIHbhu5tpIGPDoWMgdGnhu4FuIHThu5EgcGjhu5UgYmnhur9uXHJcbiAgICBjb25zdCBleHBhbmRlZEtleXdvcmRzID0gW107XHJcbiAgICBmb3IgKGNvbnN0IGtleXdvcmQgb2YgY29tbW9uUHJvZHVjdEtleXdvcmRzKSB7XHJcbiAgICAgIGV4cGFuZGVkS2V5d29yZHMucHVzaChrZXl3b3JkKTtcclxuICAgICAgZXhwYW5kZWRLZXl3b3Jkcy5wdXNoKGBz4bqjbiBwaOG6qW0gJHtrZXl3b3JkfWApO1xyXG4gICAgICBleHBhbmRlZEtleXdvcmRzLnB1c2goYGxv4bqhaSAke2tleXdvcmR9YCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFTDrG0gdOG6pXQgY+G6oyBjw6FjIHThu6sga2hvw6EgcGjhu5UgYmnhur9uIHRyb25nIHRpbiBuaOG6r25cclxuICAgIGNvbnN0IGRldGVjdGVkUHJvZHVjdHMgPSBbXTtcclxuICAgIGZvciAoY29uc3Qga2V5d29yZCBvZiBleHBhbmRlZEtleXdvcmRzKSB7XHJcbiAgICAgIGlmIChsb3dlck1lc3NhZ2UuaW5jbHVkZXMoa2V5d29yZCkpIHtcclxuICAgICAgICAvLyBUcsOtY2ggeHXhuqV0IHThu6sga2hvw6EgdsOgIG5n4buvIGPhuqNuaCB4dW5nIHF1YW5oXHJcbiAgICAgICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKGAoXFxcXHcrXFxcXHMrKT8oXFxcXHcrXFxcXHMrKT8ke2tleXdvcmR9KFxcXFxzK1xcXFx3Kyk/KFxcXFxzK1xcXFx3Kyk/YCwgJ2knKTtcclxuICAgICAgICBjb25zdCBtYXRjaCA9IGxvd2VyTWVzc2FnZS5tYXRjaChyZWdleCk7XHJcbiAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICBkZXRlY3RlZFByb2R1Y3RzLnB1c2gobWF0Y2hbMF0udHJpbSgpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gTuG6v3UgcGjDoXQgaGnhu4duIMSRxrDhu6NjIHThu6sgMiBz4bqjbiBwaOG6qW0gdHLhu58gbMOqblxyXG4gICAgaWYgKGRldGVjdGVkUHJvZHVjdHMubGVuZ3RoID49IDIpIHtcclxuICAgICAgY29uc29sZS5sb2coXCJQaMOhdCBoaeG7h24gc+G6o24gcGjhuqltIHThu6sgcGjDom4gdMOtY2ggdGjDtG5nIG1pbmg6XCIsIGRldGVjdGVkUHJvZHVjdHMpO1xyXG4gICAgICByZXR1cm4gZGV0ZWN0ZWRQcm9kdWN0cy5tYXAocCA9PiBwLnRyaW0oKSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIFxyXG4gIHJldHVybiBudWxsO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEhhbmRsZXMgc2VhcmNoIGZvciBtdWx0aXBsZSBwcm9kdWN0c1xyXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBxdWVyaWVzIC0gQXJyYXkgb2Ygc2VhcmNoIHF1ZXJpZXNcclxuICogQHJldHVybnMge1Byb21pc2U8QXJyYXk+fSAtIFNlYXJjaCByZXN1bHRzIGZvciBlYWNoIHF1ZXJ5XHJcbiAqL1xyXG5jb25zdCBoYW5kbGVNdWx0aVByb2R1Y3RTZWFyY2ggPSBhc3luYyAocXVlcmllcykgPT4ge1xyXG4gIGNvbnN0IHJlc3VsdHMgPSBbXTtcclxuICBcclxuICAvLyBEYW5oIHPDoWNoIGPDoWMgdOG7qyBj4bqnbiBsb+G6oWkgYuG7jyBraGkgdMOsbSBraeG6v21cclxuICBjb25zdCBzdG9wV29yZHMgPSBbJ3TDrG0nLCAna2nhur9tJywgJ3TDrG0ga2nhur9tJywgJ3PhuqNuIHBo4bqpbScsICdsb+G6oWknLCAnbmjGsCcsICdjw6FjJywgJ25o4buvbmcnLCAnbmhp4buBdScsICdjaG8nLCAndMO0aSddO1xyXG4gIFxyXG4gIGZvciAoY29uc3QgcXVlcnkgb2YgcXVlcmllcykge1xyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gQ2h14bqpbiBob8OhIHF1ZXJ5IGThu7FhIHbDoG8gdOG7qyBraG/DoVxyXG4gICAgICBsZXQgY2xlYW5RdWVyeSA9IHF1ZXJ5LnRvTG93ZXJDYXNlKCkudHJpbSgpO1xyXG4gICAgICBcclxuICAgICAgLy8gTG/huqFpIGLhu48gY8OhYyBzdG9wd29yZHMgxJHhu4MgdOG6rXAgdHJ1bmcgdsOgbyB0w6puIHPhuqNuIHBo4bqpbVxyXG4gICAgICBmb3IgKGNvbnN0IHdvcmQgb2Ygc3RvcFdvcmRzKSB7XHJcbiAgICAgICAgLy8gQ2jhu4kgbG/huqFpIGLhu48gbuG6v3UgdOG7qyDEkeG7qW5nIMSR4buZYyBs4bqtcCwga2jDtG5nIHBo4bqjaSBt4buZdCBwaOG6p24gY+G7p2EgdOG7qyBraMOhY1xyXG4gICAgICAgIGNsZWFuUXVlcnkgPSBjbGVhblF1ZXJ5LnJlcGxhY2UobmV3IFJlZ0V4cChgXFxcXGIke3dvcmR9XFxcXGJgLCAnZ2knKSwgJycpO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICBjbGVhblF1ZXJ5ID0gY2xlYW5RdWVyeS50cmltKCk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZyhgVMOsbSBraeG6v20gc+G6o24gcGjhuqltIFwiJHtxdWVyeX1cIiAoxJHDoyBjaHXhuqluIGhvw6E6IFwiJHtjbGVhblF1ZXJ5fVwiKWApO1xyXG4gICAgICBcclxuICAgICAgLy8gU+G7rSBk4bulbmcgcXVlcnkgxJHDoyBjaHXhuqluIGhvw6EgxJHhu4MgdMOsbSBraeG6v21cclxuICAgICAgY29uc3QgcHJvZHVjdHMgPSBhd2FpdCBzZWFyY2hQcm9kdWN0c01vbmdvREIoY2xlYW5RdWVyeSk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAocHJvZHVjdHMgJiYgcHJvZHVjdHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHJlc3VsdHMucHVzaCh7XHJcbiAgICAgICAgICBxdWVyeTogcXVlcnksIC8vIEdp4buvIGzhuqFpIHF1ZXJ5IGfhu5FjIMSR4buDIGhp4buDbiB0aOG7iyBjaG8gbmfGsOG7nWkgZMO5bmdcclxuICAgICAgICAgIGNsZWFuUXVlcnk6IGNsZWFuUXVlcnksIC8vIFRow6ptIHF1ZXJ5IMSRw6MgY2h14bqpbiBob8OhIMSR4buDIGRlYnVnXHJcbiAgICAgICAgICBwcm9kdWN0czogcHJvZHVjdHMuc2xpY2UoMCwgNSkgIC8vIExpbWl0IHRvIHRvcCA1IHByb2R1Y3RzIHBlciBxdWVyeVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIFRo4butIGzhuqFpIHbhu5tpIHF1ZXJ5IGfhu5FjIG7hur91IHF1ZXJ5IMSRw6MgY2h14bqpbiBob8OhIGtow7RuZyBjw7Mga+G6v3QgcXXhuqNcclxuICAgICAgICBjb25zb2xlLmxvZyhgS2jDtG5nIHTDrG0gdGjhuqV5IGvhur90IHF14bqjIHbhu5tpIHF1ZXJ5IMSRw6MgY2h14bqpbiBob8OhLCB0aOG7rSBs4bqhaSB24bubaSBxdWVyeSBn4buRYzogXCIke3F1ZXJ5fVwiYCk7XHJcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxQcm9kdWN0cyA9IGF3YWl0IHNlYXJjaFByb2R1Y3RzTW9uZ29EQihxdWVyeSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKG9yaWdpbmFsUHJvZHVjdHMgJiYgb3JpZ2luYWxQcm9kdWN0cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICByZXN1bHRzLnB1c2goe1xyXG4gICAgICAgICAgICBxdWVyeTogcXVlcnksXHJcbiAgICAgICAgICAgIGNsZWFuUXVlcnk6IG51bGwsIC8vIMSQw6FuaCBk4bqldSBsw6Aga2jDtG5nIHPhu60gZOG7pW5nIHF1ZXJ5IMSRw6MgY2h14bqpbiBob8OhXHJcbiAgICAgICAgICAgIHByb2R1Y3RzOiBvcmlnaW5hbFByb2R1Y3RzLnNsaWNlKDAsIDUpXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoYEzhu5dpIGtoaSB0w6xtIGtp4bq/bSBz4bqjbiBwaOG6qW0gXCIke3F1ZXJ5fVwiOmAsIGVycm9yKTtcclxuICAgIH1cclxuICB9XHJcbiAgXHJcbiAgcmV0dXJuIHJlc3VsdHM7XHJcbn07XHJcblxyXG5cclxu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