"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.handleRasaWebhook = exports.handleMessage = void 0;




var _axios = _interopRequireDefault(require("axios"));
var _Products = _interopRequireDefault(require("../Model/Products.js"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _child_process = require("child_process");
var _path = _interopRequireDefault(require("path"));
var _fs = _interopRequireDefault(require("fs"));

var _chatbotProductHandler = require("./chatbotProductHandler.js");
var _chatbotFAQHandler = require("./chatbotFAQHandler.js");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };} /* eslint-disable no-useless-escape */ /* eslint-disable no-empty */ /* eslint-disable no-unused-vars */ /* eslint-disable no-undef */ // Import xử lý câu hỏi về sản phẩm

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXhpb3MiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9Qcm9kdWN0cyIsIl9kb3RlbnYiLCJfY2hpbGRfcHJvY2VzcyIsIl9wYXRoIiwiX2ZzIiwiX2NoYXRib3RQcm9kdWN0SGFuZGxlciIsIl9jaGF0Ym90RkFRSGFuZGxlciIsImUiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImRvdGVudiIsImNvbmZpZyIsImNvbnZlcnNhdGlvbkNvbnRleHQiLCJNYXAiLCJDT05URVhUX0VYUElSWV9USU1FIiwiZXh0cmFjdEluZ3JlZGllbnRzRnJvbVJlY2lwZSIsInJlY2lwZVJlc3BvbnNlIiwiY29tbW9uSW5ncmVkaWVudHMiLCJpbmdyZWRpZW50TGlzdFBhdHRlcm4iLCJpbmdyZWRpZW50cyIsIm1hdGNoIiwiZXhlYyIsImluZ3JlZGllbnQiLCJ0cmltIiwidG9Mb3dlckNhc2UiLCJwdXNoIiwibGVuZ3RoIiwibG93ZXJSZXNwb25zZSIsImluY2x1ZGVzIiwicmVnZXgiLCJSZWdFeHAiLCJpbmdyZWRpZW50TWF0Y2giLCJmdWxsTWF0Y2giLCJTZXQiLCJtYXAiLCJpbmciLCJyZXBsYWNlIiwiZmlsdGVyIiwic2F2ZUNvbnRleHQiLCJ1c2VySWQiLCJjb250ZXh0IiwiY3VycmVudENvbnRleHQiLCJnZXQiLCJjcmVhdGVkQXQiLCJEYXRlIiwibm93Iiwic2V0IiwidXBkYXRlZEF0IiwiY29uc29sZSIsImxvZyIsIkpTT04iLCJzdHJpbmdpZnkiLCJnZXRDb250ZXh0IiwiZGVsZXRlIiwiaGFuZGxlTWVzc2FnZSIsInJlcSIsInJlcyIsIm1lc3NhZ2UiLCJwcm9kdWN0SWQiLCJib2R5Iiwic3RhdHVzIiwianNvbiIsInN1Y2Nlc3MiLCJpc0luZ3JlZGllbnRSZXF1ZXN0IiwidGVzdCIsImxhc3RSZWNpcGUiLCJzdWJzdHJpbmciLCJtdWx0aVJlc3VsdHMiLCJoYW5kbGVNdWx0aVByb2R1Y3RTZWFyY2giLCJ0b3RhbFByb2R1Y3RzIiwicmVkdWNlIiwidG90YWwiLCJyZXN1bHQiLCJwcm9kdWN0cyIsInF1ZXJpZXNXaXRoUmVzdWx0cyIsInJlc3BvbnNlTWVzc2FnZSIsImxhc3RQcm9kdWN0cyIsImZsYXRNYXAiLCJtdWx0aVNlYXJjaFJlc3VsdHMiLCJsYXN0UHJvZHVjdCIsImxhc3RRdWVyeSIsInR5cGUiLCJkYXRhIiwidG90YWxSZXN1bHRzIiwibXVsdGlQcm9kdWN0UXVlcmllcyIsImRldGVjdE11bHRpUHJvZHVjdFNlYXJjaCIsInByb2R1Y3QiLCJQcm9kdWN0IiwiZmluZEJ5SWQiLCJwcm9kdWN0TmFtZSIsInByb2R1Y3RSZXNwb25zZSIsImhhbmRsZVByb2R1Y3RQYWdlUXVlc3Rpb24iLCJlcnJvciIsImlzQ29udGV4dERlcGVuZGVudCIsImNoZWNrQ29udGV4dERlcGVuZGVudFF1ZXJ5IiwiaGFzTGFzdFByb2R1Y3QiLCJyZXNwb25zZSIsImdlbmVyYXRlQ29udGV4dFJlc3BvbnNlIiwicHJvZHVjdFF1ZXN0aW9uIiwiY2hlY2tQcm9kdWN0QXZhaWxhYmlsaXR5UXVlc3Rpb24iLCJzZWFyY2hQcm9kdWN0c01vbmdvREIiLCJpbnRlbnQiLCJkZXRlY3RJbnRlbnQiLCJweVJlcyIsImF4aW9zIiwicG9zdCIsInF1ZXN0aW9uIiwiYW5zd2VyIiwicHJvZHVjdFJlc3VsdHMiLCJmYXFSZXNwb25zZSIsImhhbmRsZUZBUVF1ZXN0aW9uIiwiZXhwb3J0cyIsImhhbmRsZVJhc2FXZWJob29rIiwicmFzYVJlc3BvbnNlIiwicXVlcnkiLCJsb3dlclF1ZXJ5IiwicHJpY2VNYXRjaCIsInByaWNlSGlnaE1hdGNoIiwicHJpY2VCZXR3ZWVuTWF0Y2giLCJjb25kaXRpb25zIiwiaXNQcmljZVF1ZXJ5IiwibWF4UHJpY2UiLCJwYXJzZUludCIsIiRvciIsInByaWNlIiwiJGx0ZSIsInByb2R1Y3RQcmljZSIsIm1pblByaWNlIiwiJGd0ZSIsInNwZWNpZmljUGhyYXNlcyIsInBocmFzZSIsImNhdGVnb3J5IiwiZm91bmRTcGVjaWZpY1BocmFzZSIsIml0ZW0iLCIkcmVnZXgiLCIkb3B0aW9ucyIsImRlc2NyaXB0aW9uIiwiY2F0ZWdvcnlLZXl3b3JkcyIsImtleXdvcmRzIiwiZm91bmRDYXRlZ29yeSIsInNvbWUiLCJrZXl3b3JkIiwic3RvcFdvcmRzIiwid29yZHMiLCJzcGxpdCIsInByaWNlS2V5d29yZHMiLCJ3b3JkIiwiaXNWZWdldGFibGVTZWFyY2giLCJrdyIsImlzU3BlY2lhbENhdGVnb3J5U2VhcmNoIiwiZXZlcnkiLCJjYXRlZ29yeUluZGV4IiwiZmluZEluZGV4IiwiYyIsInNwbGljZSIsImtleXdvcmRDb25kaXRpb25zIiwiJGFuZCIsIk9iamVjdCIsImtleXMiLCJhbGxNYXRjaGVkUHJvZHVjdHMiLCJmaW5kIiwibGltaXQiLCJhZ2dyZWdhdGlvblBpcGVsaW5lIiwiJG1hdGNoIiwiJGFkZEZpZWxkcyIsIm1hdGNoU2NvcmUiLCIkYWRkIiwiJGNvbmQiLCIkcmVnZXhNYXRjaCIsImlucHV0Iiwib3B0aW9ucyIsImZsYXQiLCIkc29ydCIsIiRsaW1pdCIsImFnZ3JlZ2F0ZSIsImlzVmVnZXRhYmxlUXVlcnkiLCJwcm9kdWN0T2JqIiwidG9PYmplY3QiLCJuYW1lVGV4dCIsImRlc2NUZXh0Iiwic2NvcmUiLCJleGFjdFBocmFzZSIsImpvaW4iLCJzb3J0IiwiYSIsImIiLCJzbGljZSIsImxvd2VyTWVzc2FnZSIsImZhcUludGVudCIsImRldGVjdEZBUUludGVudCIsImlzQ29va2luZ1F1ZXN0aW9uIiwiY29udGV4dFBhdHRlcm5zIiwicGF0dGVybiIsInByb2R1Y3RBdmFpbGFiaWxpdHlQYXR0ZXJucyIsImNsZWFuUHJvZHVjdE5hbWUiLCJzdGFydHNXaXRoIiwicHJvZHVjdERldGFpbHMiLCJwcm9kdWN0Q2F0ZWdvcnkiLCJwcm9kdWN0SW50cm9kdWN0aW9uIiwib3JpZ2luYWxQcmljZSIsImRpc2NvdW50IiwicHJvZHVjdERpc2NvdW50IiwicHJvbW9QcmljZSIsInByb2R1Y3RQcm9tb1ByaWNlIiwiTWF0aCIsInJvdW5kIiwiZm9ybWF0Q3VycmVuY3kiLCJwcm9kdWN0T3JpZ2luIiwib3JpZ2luIiwicHJvZHVjdEJyYW5kIiwiZXhwaXJ5RGF0ZSIsImFtb3VudCIsInZhbGlkQW1vdW50IiwiTnVtYmVyIiwiSW50bCIsIk51bWJlckZvcm1hdCIsInN0eWxlIiwiY3VycmVuY3kiLCJtYXhpbXVtRnJhY3Rpb25EaWdpdHMiLCJmb3JtYXQiLCJjb29raW5nS2V5d29yZHMiLCJjb21tb25Qcm9kdWN0S2V5d29yZHMiLCJwcm9kdWN0S2V5d29yZHNGb3VuZCIsImhhc011bHRpcGxlUHJvZHVjdEtleXdvcmRzIiwiaGFzTXVsdGlTZWFyY2hJbmRpY2F0b3IiLCJzZXBhcmF0b3JzIiwicGFydHMiLCJjb21wYXJpc29uVGVybXMiLCJjbGVhbk1lc3NhZ2UiLCJ0ZXJtIiwic3BsaXRSZXN1bHQiLCJzZXBhcmF0b3IiLCJwIiwiY29tbW9uQ2F0ZWdvcmllcyIsImNhdGVnb3JpZXMiLCJyZW1haW5pbmdUZXh0Iiwic29ydGVkS2V5d29yZHMiLCJmb3VuZCIsImluZGV4IiwiaW5kZXhPZiIsImJlZm9yZVRleHQiLCJleHBhbmRlZEtleXdvcmRzIiwiZGV0ZWN0ZWRQcm9kdWN0cyIsInF1ZXJpZXMiLCJyZXN1bHRzIiwiY2xlYW5RdWVyeSIsIm9yaWdpbmFsUHJvZHVjdHMiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvQ29udHJvbGxlci9jaGF0Ym90Q29udHJvbGxlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBuby11c2VsZXNzLWVzY2FwZSAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tZW1wdHkgKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC12YXJzICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlZiAqL1xuXG5pbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnO1xuaW1wb3J0IFByb2R1Y3QgZnJvbSBcIi4uL01vZGVsL1Byb2R1Y3RzLmpzXCI7XG5pbXBvcnQgZG90ZW52IGZyb20gJ2RvdGVudic7XG5pbXBvcnQgeyBzcGF3biB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuLy8gSW1wb3J0IHjhu60gbMO9IGPDonUgaOG7j2kgduG7gSBz4bqjbiBwaOG6qW1cbmltcG9ydCB7IGhhbmRsZVByb2R1Y3RQYWdlUXVlc3Rpb24gfSBmcm9tICcuL2NoYXRib3RQcm9kdWN0SGFuZGxlci5qcyc7XG5pbXBvcnQgeyBoYW5kbGVGQVFRdWVzdGlvbiB9IGZyb20gJy4vY2hhdGJvdEZBUUhhbmRsZXIuanMnO1xuXG4vLyBMb2FkIGVudmlyb25tZW50IHZhcmlhYmxlc1xuZG90ZW52LmNvbmZpZygpO1xuXG4vLyBDYWNoZSDEkeG7gyBsxrB1IG5n4buvIGPhuqNuaCBjdeG7mWMgaOG7mWkgdGhv4bqhaSBjaG8gdOG7q25nIG5nxrDhu51pIGTDuW5nXG5jb25zdCBjb252ZXJzYXRpb25Db250ZXh0ID0gbmV3IE1hcCgpO1xuXG4vLyBUaOG7nWkgZ2lhbiBo4bq/dCBo4bqhbiBjaG8gbmfhu68gY+G6o25oICgxNSBwaMO6dCA9IDE1ICogNjAgKiAxMDAwIG1zKVxuY29uc3QgQ09OVEVYVF9FWFBJUllfVElNRSA9IDE1ICogNjAgKiAxMDAwO1xuXG4vKipcbiAqIFRyw61jaCB4deG6pXQgbmd1ecOqbiBsaeG7h3UgdOG7qyBjw6J1IHRy4bqjIGzhu51pIGPDtG5nIHRo4bupYyBu4bqldSDEg25cbiAqIEBwYXJhbSB7c3RyaW5nfSByZWNpcGVSZXNwb25zZSAtIEPDonUgdHLhuqMgbOG7nWkgY8O0bmcgdGjhu6ljIG7huqV1IMSDblxuICogQHJldHVybnMge3N0cmluZ1tdfSAtIERhbmggc8OhY2ggbmd1ecOqbiBsaeG7h3UgxJHDoyB0csOtY2ggeHXhuqV0XG4gKi9cbmNvbnN0IGV4dHJhY3RJbmdyZWRpZW50c0Zyb21SZWNpcGUgPSAocmVjaXBlUmVzcG9uc2UpID0+IHtcbiAgaWYgKCFyZWNpcGVSZXNwb25zZSkgcmV0dXJuIFtdO1xuICBcbiAgLy8gRGFuaCBzw6FjaCBuZ3V5w6puIGxp4buHdSBwaOG7lSBiaeG6v24gxJHhu4MgdMOsbSBraeG6v21cbiAgY29uc3QgY29tbW9uSW5ncmVkaWVudHMgPSBbXG4gICAgJ3Ro4buLdCcsICdjw6EnLCAnaOG6o2kgc+G6o24nLCAnZ8OgJywgJ2LDsicsICdoZW8nLCAnduG7i3QnLCAndHLhu6luZycsICdo4buZdCB24buLdCcsICdo4buZdCBnw6AnLFxuICAgICdyYXUnLCAnY+G7pycsICdxdeG6oycsICdjw6AgY2h1YScsICdjw6AgcuG7kXQnLCAnYuG6r3AgY+G6o2knLCAneMOgIGzDoWNoJywgJ2jDoG5oJywgJ3Thu49pJywgJ2fhu6tuZycsXG4gICAgJ+G7m3QnLCAndGnDqnUnLCAnbXXhu5FpJywgJ8SRxrDhu51uZycsICduxrDhu5tjIG3huq9tJywgJ2Thuqd1IMSDbicsICdk4bqndSBow6BvJywgJ27GsOG7m2MgdMawxqFuZycsIFxuICAgICdtw6wnLCAnYsO6bicsICdwaOG7nycsICdtaeG6v24nLCAnZ+G6oW8nLCAnYuG7mXQnLCAnYsOhbmgnLCAna+G6uW8nLFxuICAgICduxrDhu5tjIGThu6thJywgJ3Phu69hJywgJ27GsOG7m2MnLCAnYmlhJywgJ3LGsOG7o3UnXG4gIF07XG4gIFxuICAvLyBU4bqhbyBwYXR0ZXJuIMSR4buDIHTDrG0gbmd1ecOqbiBsaeG7h3UgdOG7qyBkYW5oIHPDoWNoIMSRw6FuaCBz4buRXG4gIGNvbnN0IGluZ3JlZGllbnRMaXN0UGF0dGVybiA9IC9cXGQrXFwuXFxzKyhbXlxcZF0rPykoPz1cXG58JCkvZztcbiAgbGV0IGluZ3JlZGllbnRzID0gW107XG4gIFxuICAvLyBUw6xtIGtp4bq/bSBkYW5oIHPDoWNoIMSRw6FuaCBz4buRXG4gIGxldCBtYXRjaDtcbiAgd2hpbGUgKChtYXRjaCA9IGluZ3JlZGllbnRMaXN0UGF0dGVybi5leGVjKHJlY2lwZVJlc3BvbnNlKSkgIT09IG51bGwpIHtcbiAgICBjb25zdCBpbmdyZWRpZW50ID0gbWF0Y2hbMV0udHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgaW5ncmVkaWVudHMucHVzaChpbmdyZWRpZW50KTtcbiAgfVxuICBcbiAgLy8gTuG6v3Uga2jDtG5nIHTDrG0gdGjhuqV5IGRhbmggc8OhY2ggxJHDoW5oIHPhu5EsIHTDrG0ga2nhur9tIGPDoWMgbmd1ecOqbiBsaeG7h3UgcGjhu5UgYmnhur9uXG4gIGlmIChpbmdyZWRpZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBjb25zdCBsb3dlclJlc3BvbnNlID0gcmVjaXBlUmVzcG9uc2UudG9Mb3dlckNhc2UoKTtcbiAgICBcbiAgICBmb3IgKGNvbnN0IGluZ3JlZGllbnQgb2YgY29tbW9uSW5ncmVkaWVudHMpIHtcbiAgICAgIGlmIChsb3dlclJlc3BvbnNlLmluY2x1ZGVzKGluZ3JlZGllbnQpKSB7XG4gICAgICAgIC8vIFRyw61jaCB4deG6pXQgbmd1ecOqbiBsaeG7h3UgdsOgIG5n4buvIGPhuqNuaCB4dW5nIHF1YW5oXG4gICAgICAgIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChgXFxcXGIke2luZ3JlZGllbnR9XFxcXGIoW14sLjtdKyk/YCwgJ2cnKTtcbiAgICAgICAgbGV0IGluZ3JlZGllbnRNYXRjaDtcbiAgICAgICAgXG4gICAgICAgIHdoaWxlICgoaW5ncmVkaWVudE1hdGNoID0gcmVnZXguZXhlYyhsb3dlclJlc3BvbnNlKSkgIT09IG51bGwpIHtcbiAgICAgICAgICBjb25zdCBmdWxsTWF0Y2ggPSBpbmdyZWRpZW50TWF0Y2hbMF0udHJpbSgpO1xuICAgICAgICAgIGluZ3JlZGllbnRzLnB1c2goZnVsbE1hdGNoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBcbiAgLy8gTG/huqFpIGLhu48gdHLDuW5nIGzhurdwIHbDoCB0aW5oIGNo4buJbmhcbiAgaW5ncmVkaWVudHMgPSBbLi4ubmV3IFNldChpbmdyZWRpZW50cyldLm1hcChpbmcgPT4ge1xuICAgIC8vIExv4bqhaSBi4buPIHPhu5EgbMaw4bujbmcgdsOgIMSRxqFuIHbhu4tcbiAgICByZXR1cm4gaW5nLnJlcGxhY2UoL1xcKFxcZCsuKj9cXCkvZywgJycpXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC9cXGQrXFxzKihnfGtnfG1sfGx8bXXhu5duZ3x0w6lwfGPhu6d8cXXhuqMpL2dpLCAnJylcbiAgICAgICAgICAgICAgLnJlcGxhY2UoL2tob+G6o25nL2dpLCAnJylcbiAgICAgICAgICAgICAgLnRyaW0oKTtcbiAgfSkuZmlsdGVyKGluZyA9PiBpbmcubGVuZ3RoID4gMSk7IC8vIExv4bqhaSBi4buPIGPDoWMgbeG7pWMgcXXDoSBuZ+G6r25cbiAgXG4gIHJldHVybiBpbmdyZWRpZW50cztcbn07XG5cbi8qKlxuICogTMawdSBuZ+G7ryBj4bqjbmggY3Xhu5ljIGjhu5lpIHRob+G6oWlcbiAqIEBwYXJhbSB7c3RyaW5nfSB1c2VySWQgLSBJRCBuZ8aw4budaSBkw7luZ1xuICogQHBhcmFtIHtvYmplY3R9IGNvbnRleHQgLSBE4buvIGxp4buHdSBuZ+G7ryBj4bqjbmhcbiAqL1xuY29uc3Qgc2F2ZUNvbnRleHQgPSAodXNlcklkLCBjb250ZXh0KSA9PiB7XG4gIGlmICghdXNlcklkKSByZXR1cm47XG4gIFxuICAvLyBM4bqleSBuZ+G7ryBj4bqjbmggaGnhu4duIHThuqFpIGhv4bq3YyB04bqhbyBt4bubaSBu4bq/dSBraMO0bmcgY8OzXG4gIGNvbnN0IGN1cnJlbnRDb250ZXh0ID0gY29udmVyc2F0aW9uQ29udGV4dC5nZXQodXNlcklkKSB8fCB7IGNyZWF0ZWRBdDogRGF0ZS5ub3coKSB9O1xuICBcbiAgLy8gQ+G6rXAgbmjhuq10IG5n4buvIGPhuqNuaFxuICBjb252ZXJzYXRpb25Db250ZXh0LnNldCh1c2VySWQsIHtcbiAgICAuLi5jdXJyZW50Q29udGV4dCxcbiAgICAuLi5jb250ZXh0LFxuICAgIHVwZGF0ZWRBdDogRGF0ZS5ub3coKVxuICB9KTtcbiAgXG4gIGNvbnNvbGUubG9nKGDEkMOjIGzGsHUgbmfhu68gY+G6o25oIGNobyB1c2VyICR7dXNlcklkfTpgLCBKU09OLnN0cmluZ2lmeShjb250ZXh0KSk7XG59O1xuXG4vKipcbiAqIEzhuqV5IG5n4buvIGPhuqNuaCBjdeG7mWMgaOG7mWkgdGhv4bqhaVxuICogQHBhcmFtIHtzdHJpbmd9IHVzZXJJZCAtIElEIG5nxrDhu51pIGTDuW5nXG4gKiBAcmV0dXJucyB7b2JqZWN0fG51bGx9IC0gROG7ryBsaeG7h3Ugbmfhu68gY+G6o25oIGhv4bq3YyBudWxsIG7hur91IGtow7RuZyBjw7MvaOG6v3QgaOG6oW5cbiAqL1xuY29uc3QgZ2V0Q29udGV4dCA9ICh1c2VySWQpID0+IHtcbiAgaWYgKCF1c2VySWQpIHJldHVybiBudWxsO1xuICBcbiAgY29uc3QgY29udGV4dCA9IGNvbnZlcnNhdGlvbkNvbnRleHQuZ2V0KHVzZXJJZCk7XG4gIGlmICghY29udGV4dCkgcmV0dXJuIG51bGw7XG4gIFxuICAvLyBLaeG7g20gdHJhIHhlbSBuZ+G7ryBj4bqjbmggY8OzIGjhur90IGjhuqFuIGNoxrBhXG4gIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gIGlmIChub3cgLSBjb250ZXh0LnVwZGF0ZWRBdCA+IENPTlRFWFRfRVhQSVJZX1RJTUUpIHtcbiAgICAvLyBO4bq/dSBo4bq/dCBo4bqhbiwgeMOzYSBuZ+G7ryBj4bqjbmggdsOgIHRy4bqjIHbhu4EgbnVsbFxuICAgIGNvbnZlcnNhdGlvbkNvbnRleHQuZGVsZXRlKHVzZXJJZCk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgXG4gIHJldHVybiBjb250ZXh0O1xufTtcblxuLy8gSMOgbSB44butIGzDvSB0aW4gbmjhuq9uIHThu6sgbmfGsOG7nWkgZMO5bmdcbmV4cG9ydCBjb25zdCBoYW5kbGVNZXNzYWdlID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBtZXNzYWdlLCB1c2VySWQsIHByb2R1Y3RJZCB9ID0gcmVxLmJvZHk7XG5cbiAgICBpZiAoIW1lc3NhZ2UpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIk1lc3NhZ2UgaXMgcmVxdWlyZWRcIlxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIGNvbnNvbGUubG9nKGBOaOG6rW4gdGluIG5o4bqvbiB04burIHVzZXIgJHt1c2VySWQgfHwgJ2Fub255bW91cyd9OiBcIiR7bWVzc2FnZX1cImApO1xuICAgIGNvbnNvbGUubG9nKFwiVGjDtG5nIHRpbiBz4bqjbiBwaOG6qW0gxJFhbmcgeGVtIChwcm9kdWN0SWQpOlwiLCBwcm9kdWN0SWQpO1xuICAgIFxuICAgIC8vIEtp4buDbSB0cmEgeGVtIGPDsyBwaOG6o2kgecOqdSBj4bqndSB24buBIG5ndXnDqm4gbGnhu4d1IHThu6sgY8O0bmcgdGjhu6ljIHRyxrDhu5tjIMSRw7NcbiAgICBjb25zdCBpc0luZ3JlZGllbnRSZXF1ZXN0ID0gL3TDrG0gKGPDoWMgKT9uZ3V5w6puIGxp4buHdXxuZ3V5w6puIGxp4buHdSAo4bufICk/dHLDqm58Y2jhu5cgbsOgbyAoY8OzICk/YsOhbnxtdWEgKOG7nyApP8SRw6J1L2kudGVzdChtZXNzYWdlKTtcbiAgICBpZiAoaXNJbmdyZWRpZW50UmVxdWVzdCAmJiB1c2VySWQpIHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBnZXRDb250ZXh0KHVzZXJJZCk7XG4gICAgICBcbiAgICAgIGlmIChjb250ZXh0ICYmIGNvbnRleHQubGFzdFJlY2lwZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIlBow6F0IGhp4buHbiB5w6p1IGPhuqd1IHTDrG0gbmd1ecOqbiBsaeG7h3UgdOG7qyBjw7RuZyB0aOG7qWMgdHLGsOG7m2M6XCIsIGNvbnRleHQubGFzdFJlY2lwZS5zdWJzdHJpbmcoMCwgNTApICsgXCIuLi5cIik7XG4gICAgICAgIFxuICAgICAgICAvLyBUcsOtY2ggeHXhuqV0IG5ndXnDqm4gbGnhu4d1IHThu6sgY8O0bmcgdGjhu6ljXG4gICAgICAgIGNvbnN0IGluZ3JlZGllbnRzID0gZXh0cmFjdEluZ3JlZGllbnRzRnJvbVJlY2lwZShjb250ZXh0Lmxhc3RSZWNpcGUpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIkPDoWMgbmd1ecOqbiBsaeG7h3UgxJHGsOG7o2MgdHLDrWNoIHh14bqldDpcIiwgaW5ncmVkaWVudHMpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGluZ3JlZGllbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAvLyBUw6xtIGtp4bq/bSBz4bqjbiBwaOG6qW0gdGhlbyB04burbmcgbmd1ecOqbiBsaeG7h3VcbiAgICAgICAgICBjb25zdCBtdWx0aVJlc3VsdHMgPSBhd2FpdCBoYW5kbGVNdWx0aVByb2R1Y3RTZWFyY2goaW5ncmVkaWVudHMpO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmIChtdWx0aVJlc3VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgLy8gxJDhur9tIHThu5VuZyBz4buRIHPhuqNuIHBo4bqpbSB0w6xtIMSRxrDhu6NjXG4gICAgICAgICAgICBjb25zdCB0b3RhbFByb2R1Y3RzID0gbXVsdGlSZXN1bHRzLnJlZHVjZSgodG90YWwsIHJlc3VsdCkgPT4gdG90YWwgKyAocmVzdWx0LnByb2R1Y3RzID8gcmVzdWx0LnByb2R1Y3RzLmxlbmd0aCA6IDApLCAwKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gxJDhur9tIHPhu5EgbMaw4bujbmcgcXVlcmllcyBjw7Mga+G6v3QgcXXhuqNcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJpZXNXaXRoUmVzdWx0cyA9IG11bHRpUmVzdWx0cy5maWx0ZXIocmVzdWx0ID0+IHJlc3VsdC5wcm9kdWN0cyAmJiByZXN1bHQucHJvZHVjdHMubGVuZ3RoID4gMCkubGVuZ3RoO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBU4bqhbyB0aMO0bmcgYsOhbyBwaMO5IGjhu6NwXG4gICAgICAgICAgICBsZXQgcmVzcG9uc2VNZXNzYWdlID0gXCJcIjtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHF1ZXJpZXNXaXRoUmVzdWx0cyA9PT0gaW5ncmVkaWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIHJlc3BvbnNlTWVzc2FnZSA9IGBUw7RpIMSRw6MgdMOsbSB0aOG6pXkgJHt0b3RhbFByb2R1Y3RzfSBz4bqjbiBwaOG6qW0gcGjDuSBo4bujcCB24bubaSAke2luZ3JlZGllbnRzLmxlbmd0aH0gbmd1ecOqbiBsaeG7h3UgdOG7qyBjw7RuZyB0aOG7qWM6YDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocXVlcmllc1dpdGhSZXN1bHRzID4gMCkge1xuICAgICAgICAgICAgICByZXNwb25zZU1lc3NhZ2UgPSBgVMO0aSB0w6xtIHRo4bqleSBz4bqjbiBwaOG6qW0gcGjDuSBo4bujcCB24bubaSAke3F1ZXJpZXNXaXRoUmVzdWx0c30vJHtpbmdyZWRpZW50cy5sZW5ndGh9IG5ndXnDqm4gbGnhu4d1IHThu6sgY8O0bmcgdGjhu6ljOmA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXNwb25zZU1lc3NhZ2UgPSBcIlLhuqV0IHRp4bq/YywgdMO0aSBraMO0bmcgdMOsbSB0aOG6pXkgc+G6o24gcGjhuqltIHBow7kgaOG7o3AgduG7m2kgY8OhYyBuZ3V5w6puIGxp4buHdSB04burIGPDtG5nIHRo4bupYy4gQuG6oW4gY8OzIHRo4buDIHRo4butIGzhuqFpIHbhu5tpIHThu6sga2jDs2Ega2jDoWMga2jDtG5nP1wiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBMxrB1IGvhur90IHF14bqjIHTDrG0ga2nhur9tIHbDoG8gbmfhu68gY+G6o25oXG4gICAgICAgICAgICBjb25zdCBsYXN0UHJvZHVjdHMgPSBtdWx0aVJlc3VsdHMuZmxhdE1hcChyZXN1bHQgPT4gcmVzdWx0LnByb2R1Y3RzIHx8IFtdKTtcbiAgICAgICAgICAgIHNhdmVDb250ZXh0KHVzZXJJZCwgeyBcbiAgICAgICAgICAgICAgbXVsdGlTZWFyY2hSZXN1bHRzOiBtdWx0aVJlc3VsdHMsXG4gICAgICAgICAgICAgIGxhc3RQcm9kdWN0czogbGFzdFByb2R1Y3RzLmxlbmd0aCA+IDAgPyBsYXN0UHJvZHVjdHMgOiBudWxsLFxuICAgICAgICAgICAgICBsYXN0UHJvZHVjdDogbGFzdFByb2R1Y3RzLmxlbmd0aCA+IDAgPyBsYXN0UHJvZHVjdHNbMF0gOiBudWxsLFxuICAgICAgICAgICAgICBsYXN0UXVlcnk6IG1lc3NhZ2UgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgdHlwZTogJ211bHRpUHJvZHVjdFNlYXJjaCcsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IHJlc3BvbnNlTWVzc2FnZSxcbiAgICAgICAgICAgICAgZGF0YTogbXVsdGlSZXN1bHRzLFxuICAgICAgICAgICAgICB0b3RhbFJlc3VsdHM6IHRvdGFsUHJvZHVjdHNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IFwiUuG6pXQgdGnhur9jLCB0w7RpIGtow7RuZyB0w6xtIHRo4bqleSBz4bqjbiBwaOG6qW0gcGjDuSBo4bujcCB24bubaSBjw6FjIG5ndXnDqm4gbGnhu4d1IHThu6sgY8O0bmcgdGjhu6ljLiBC4bqhbiBjw7MgdGjhu4MgdMOsbSBraeG6v20gdHLhu7FjIHRp4bq/cCBi4bqxbmcgdOG7q25nIG5ndXnDqm4gbGnhu4d1IGPhu6UgdGjhu4MuXCJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiVMO0aSBraMO0bmcgdGjhu4MgdHLDrWNoIHh14bqldCDEkcaw4bujYyBuZ3V5w6puIGxp4buHdSB04burIGPDtG5nIHRo4bupYyB0csaw4bubYyDEkcOzLiBC4bqhbiBjw7MgdGjhu4MgY2hvIHTDtGkgYmnhur90IGPhu6UgdGjhu4Mgbmd1ecOqbiBsaeG7h3UgYuG6oW4gxJFhbmcgdMOsbSBraeG6v20ga2jDtG5nP1wiXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gS2nhu4NtIHRyYSB4ZW0gY8OzIHBo4bqjaSB5w6p1IGPhuqd1IHTDrG0gbmhp4buBdSBz4bqjbiBwaOG6qW0gY8O5bmcgbMO6YyBraMO0bmdcbiAgICBjb25zdCBtdWx0aVByb2R1Y3RRdWVyaWVzID0gZGV0ZWN0TXVsdGlQcm9kdWN0U2VhcmNoKG1lc3NhZ2UpO1xuICAgIGlmIChtdWx0aVByb2R1Y3RRdWVyaWVzKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlBow6F0IGhp4buHbiB5w6p1IGPhuqd1IHTDrG0gbmhp4buBdSBz4bqjbiBwaOG6qW0gY8O5bmcgbMO6YzpcIiwgbXVsdGlQcm9kdWN0UXVlcmllcyk7XG4gICAgICBcbiAgICAgIGNvbnN0IG11bHRpUmVzdWx0cyA9IGF3YWl0IGhhbmRsZU11bHRpUHJvZHVjdFNlYXJjaChtdWx0aVByb2R1Y3RRdWVyaWVzKTtcbiAgICAgIFxuICAgICAgaWYgKG11bHRpUmVzdWx0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIMSQ4bq/bSB04buVbmcgc+G7kSBz4bqjbiBwaOG6qW0gdMOsbSDEkcaw4bujY1xuICAgICAgICBjb25zdCB0b3RhbFByb2R1Y3RzID0gbXVsdGlSZXN1bHRzLnJlZHVjZSgodG90YWwsIHJlc3VsdCkgPT4gdG90YWwgKyAocmVzdWx0LnByb2R1Y3RzID8gcmVzdWx0LnByb2R1Y3RzLmxlbmd0aCA6IDApLCAwKTtcbiAgICAgICAgXG4gICAgICAgIC8vIMSQ4bq/bSBz4buRIGzGsOG7o25nIHF1ZXJpZXMgY8OzIGvhur90IHF14bqjXG4gICAgICAgIGNvbnN0IHF1ZXJpZXNXaXRoUmVzdWx0cyA9IG11bHRpUmVzdWx0cy5maWx0ZXIocmVzdWx0ID0+IHJlc3VsdC5wcm9kdWN0cyAmJiByZXN1bHQucHJvZHVjdHMubGVuZ3RoID4gMCkubGVuZ3RoO1xuICAgICAgICBcbiAgICAgICAgLy8gVOG6oW8gdGjDtG5nIGLDoW8gcGjDuSBo4bujcFxuICAgICAgICBsZXQgcmVzcG9uc2VNZXNzYWdlID0gXCJcIjtcbiAgICAgICAgXG4gICAgICAgIGlmIChxdWVyaWVzV2l0aFJlc3VsdHMgPT09IG11bHRpUHJvZHVjdFF1ZXJpZXMubGVuZ3RoKSB7XG4gICAgICAgICAgLy8gVMOsbSB0aOG6pXkga+G6v3QgcXXhuqMgY2hvIHThuqV0IGPhuqMgY8OhYyB0cnV5IHbhuqVuXG4gICAgICAgICAgcmVzcG9uc2VNZXNzYWdlID0gYFTDtGkgxJHDoyB0w6xtIHRo4bqleSAke3RvdGFsUHJvZHVjdHN9IHPhuqNuIHBo4bqpbSBwaMO5IGjhu6NwIHbhu5tpICR7bXVsdGlQcm9kdWN0UXVlcmllcy5sZW5ndGh9IGxv4bqhaSBi4bqhbiB5w6p1IGPhuqd1OmA7XG4gICAgICAgIH0gZWxzZSBpZiAocXVlcmllc1dpdGhSZXN1bHRzID4gMCkge1xuICAgICAgICAgIC8vIENo4buJIHTDrG0gdGjhuqV5IGvhur90IHF14bqjIGNobyBt4buZdCBz4buRIHRydXkgduG6pW5cbiAgICAgICAgICByZXNwb25zZU1lc3NhZ2UgPSBgVMO0aSB0w6xtIHRo4bqleSBz4bqjbiBwaOG6qW0gcGjDuSBo4bujcCB24bubaSAke3F1ZXJpZXNXaXRoUmVzdWx0c30vJHttdWx0aVByb2R1Y3RRdWVyaWVzLmxlbmd0aH0gbG/huqFpIGLhuqFuIHnDqnUgY+G6p3U6YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBLaMO0bmcgdMOsbSB0aOG6pXkga+G6v3QgcXXhuqMgbsOgb1xuICAgICAgICAgIHJlc3BvbnNlTWVzc2FnZSA9IFwiVMO0aSBraMO0bmcgdMOsbSB0aOG6pXkgc+G6o24gcGjhuqltIG7DoG8gcGjDuSBo4bujcCB24bubaSB5w6p1IGPhuqd1IGPhu6dhIGLhuqFuLiBC4bqhbiBjw7MgdGjhu4MgdGjhu60gbOG6oWkgduG7m2kgdOG7qyBraMOzYSBraMOhYyBraMO0bmc/XCI7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEzGsHUga+G6v3QgcXXhuqMgdMOsbSBraeG6v20gdsOgbyBuZ+G7ryBj4bqjbmggbuG6v3UgY8OzIHVzZXJJZFxuICAgICAgICBpZiAodXNlcklkKSB7XG4gICAgICAgICAgY29uc3QgbGFzdFByb2R1Y3RzID0gbXVsdGlSZXN1bHRzLmZsYXRNYXAocmVzdWx0ID0+IHJlc3VsdC5wcm9kdWN0cyB8fCBbXSk7XG4gICAgICAgICAgc2F2ZUNvbnRleHQodXNlcklkLCB7IFxuICAgICAgICAgICAgbXVsdGlTZWFyY2hSZXN1bHRzOiBtdWx0aVJlc3VsdHMsXG4gICAgICAgICAgICBsYXN0UHJvZHVjdHM6IGxhc3RQcm9kdWN0cy5sZW5ndGggPiAwID8gbGFzdFByb2R1Y3RzIDogbnVsbCxcbiAgICAgICAgICAgIGxhc3RQcm9kdWN0OiBsYXN0UHJvZHVjdHMubGVuZ3RoID4gMCA/IGxhc3RQcm9kdWN0c1swXSA6IG51bGwsXG4gICAgICAgICAgICBsYXN0UXVlcnk6IG1lc3NhZ2UgXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICB0eXBlOiAnbXVsdGlQcm9kdWN0U2VhcmNoJyxcbiAgICAgICAgICBtZXNzYWdlOiByZXNwb25zZU1lc3NhZ2UsXG4gICAgICAgICAgZGF0YTogbXVsdGlSZXN1bHRzLFxuICAgICAgICAgIHRvdGFsUmVzdWx0czogdG90YWxQcm9kdWN0c1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgICAgbWVzc2FnZTogXCJS4bqldCB0aeG6v2MsIHTDtGkga2jDtG5nIHTDrG0gdGjhuqV5IHPhuqNuIHBo4bqpbSBuw6BvIHBow7kgaOG7o3AgduG7m2kgY8OhYyB0acOqdSBjaMOtIHTDrG0ga2nhur9tIGPhu6dhIGLhuqFuLiBC4bqhbiBjw7MgdGjhu4MgdGjhu60gbOG6oWkgduG7m2kgY8OhYyB04burIGtow7NhIGtow6FjIGtow7RuZz9cIlxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gWOG7rSBsw70gY8OidSBo4buPaSB24buBIHPhuqNuIHBo4bqpbSBoaeG7h24gdOG6oWkgbuG6v3UgY8OzIHByb2R1Y3RJZFxuICAgIGlmIChwcm9kdWN0SWQpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIFTDrG0gdGjDtG5nIHRpbiBz4bqjbiBwaOG6qW0gdOG7qyBkYXRhYmFzZVxuICAgICAgICBjb25zdCBwcm9kdWN0ID0gYXdhaXQgUHJvZHVjdC5maW5kQnlJZChwcm9kdWN0SWQpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHByb2R1Y3QpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgxJBhbmcgeOG7rSBsw70gY8OidSBo4buPaSB24buBIHPhuqNuIHBo4bqpbTogJHtwcm9kdWN0LnByb2R1Y3ROYW1lfWApO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIEzGsHUgc+G6o24gcGjhuqltIHbDoG8gbmfhu68gY+G6o25oXG4gICAgICAgICAgc2F2ZUNvbnRleHQodXNlcklkLCB7IGxhc3RQcm9kdWN0OiBwcm9kdWN0IH0pO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSBz4bqjbiBwaOG6qW0gaGnhu4duIHThuqFpXG4gICAgICAgICAgY29uc3QgcHJvZHVjdFJlc3BvbnNlID0gYXdhaXQgaGFuZGxlUHJvZHVjdFBhZ2VRdWVzdGlvbihtZXNzYWdlLCBwcm9kdWN0KTtcbiAgICAgICAgICBcbiAgICAgICAgICBpZiAocHJvZHVjdFJlc3BvbnNlICYmIHByb2R1Y3RSZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBo4bqjbiBo4buTaSB04burIHjhu60gbMO9IGPDonUgaOG7j2kgc+G6o24gcGjhuqltOlwiLCBwcm9kdWN0UmVzcG9uc2UubWVzc2FnZSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24ocHJvZHVjdFJlc3BvbnNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgeOG7rSBsw70gY8OidSBo4buPaSB24buBIHPhuqNuIHBo4bqpbTpcIiwgZXJyb3IpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBLaeG7g20gdHJhIHhlbSBjw7MgcGjhuqNpIGPDonUgaOG7j2kgcGjhu6UgdGh14buZYyBuZ+G7ryBj4bqjbmggc+G6o24gcGjhuqltIHRyxrDhu5tjIMSRw7Mga2jDtG5nXG4gICAgY29uc3QgaXNDb250ZXh0RGVwZW5kZW50ID0gY2hlY2tDb250ZXh0RGVwZW5kZW50UXVlcnkobWVzc2FnZSk7XG4gICAgY29uc29sZS5sb2coXCJLaeG7g20gdHJhIGPDonUgaOG7j2kgcGjhu6UgdGh14buZYyBuZ+G7ryBj4bqjbmg6XCIsIGlzQ29udGV4dERlcGVuZGVudCk7XG4gICAgXG4gICAgaWYgKGlzQ29udGV4dERlcGVuZGVudCAmJiB1c2VySWQpIHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBnZXRDb250ZXh0KHVzZXJJZCk7XG4gICAgICBjb25zb2xlLmxvZyhcIk5n4buvIGPhuqNuaCBoaeG7h24gdOG6oWk6XCIsIGNvbnRleHQgPyBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIGhhc0xhc3RQcm9kdWN0OiAhIWNvbnRleHQubGFzdFByb2R1Y3QsXG4gICAgICAgIHByb2R1Y3ROYW1lOiBjb250ZXh0Lmxhc3RQcm9kdWN0ID8gY29udGV4dC5sYXN0UHJvZHVjdC5wcm9kdWN0TmFtZSA6IG51bGwsXG4gICAgICAgIGxhc3RRdWVyeTogY29udGV4dC5sYXN0UXVlcnkgfHwgbnVsbFxuICAgICAgfSkgOiBcIktow7RuZyBjw7Mgbmfhu68gY+G6o25oXCIpO1xuICAgICAgXG4gICAgICBpZiAoY29udGV4dCAmJiBjb250ZXh0Lmxhc3RQcm9kdWN0KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBQaMOhdCBoaeG7h24gY8OidSBo4buPaSBwaOG7pSB0aHXhu5ljIG5n4buvIGPhuqNuaCB24buBIHPhuqNuIHBo4bqpbTogJHtjb250ZXh0Lmxhc3RQcm9kdWN0LnByb2R1Y3ROYW1lfWApO1xuICAgICAgICBcbiAgICAgICAgLy8gWOG7rSBsw70gY8OidSBo4buPaSBk4buxYSB0csOqbiBz4bqjbiBwaOG6qW0gdHJvbmcgbmfhu68gY+G6o25oXG4gICAgICAgIGNvbnN0IHByb2R1Y3RSZXNwb25zZSA9IGF3YWl0IGhhbmRsZVByb2R1Y3RQYWdlUXVlc3Rpb24obWVzc2FnZSwgY29udGV4dC5sYXN0UHJvZHVjdCk7XG4gICAgICAgIFxuICAgICAgICBpZiAocHJvZHVjdFJlc3BvbnNlICYmIHByb2R1Y3RSZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHByb2R1Y3RSZXNwb25zZSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIE7hur91IGtow7RuZyB44butIGzDvSDEkcaw4bujYyBi4bqxbmcgaGFuZGxlUHJvZHVjdFBhZ2VRdWVzdGlvbiwgdOG6oW8gY8OidSB0cuG6oyBs4budaSBk4buxYSB0csOqbiB0aHXhu5ljIHTDrW5oIHPhuqNuIHBo4bqpbVxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGdlbmVyYXRlQ29udGV4dFJlc3BvbnNlKG1lc3NhZ2UsIGNvbnRleHQubGFzdFByb2R1Y3QpO1xuICAgICAgICBpZiAocmVzcG9uc2UpIHtcbiAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24ocmVzcG9uc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIMSQ4buRaSB24bubaSBjw6J1IGjhu49pIFwiQ8OzIHPhuqNuIHBo4bqpbSBYIGtow7RuZz9cIlxuICAgIGNvbnN0IHByb2R1Y3RRdWVzdGlvbiA9IGNoZWNrUHJvZHVjdEF2YWlsYWJpbGl0eVF1ZXN0aW9uKG1lc3NhZ2UpO1xuICAgIGlmIChwcm9kdWN0UXVlc3Rpb24pIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIFTDrG0ga2nhur9tIHPhuqNuIHBo4bqpbSBk4buxYSB0csOqbiB0w6puIHPhuqNuIHBo4bqpbSDEkcaw4bujYyB0csOtY2ggeHXhuqV0XG4gICAgICAgIGNvbnN0IHByb2R1Y3RzID0gYXdhaXQgc2VhcmNoUHJvZHVjdHNNb25nb0RCKHByb2R1Y3RRdWVzdGlvbik7XG4gICAgICAgIFxuICAgICAgICBpZiAocHJvZHVjdHMgJiYgcHJvZHVjdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIC8vIEzGsHUgc+G6o24gcGjhuqltIMSR4bqndSB0acOqbiB2w6BvIG5n4buvIGPhuqNuaCDEkeG7gyBz4butIGThu6VuZyBjaG8gY8OidSBo4buPaSB0aeG6v3AgdGhlb1xuICAgICAgICAgIHNhdmVDb250ZXh0KHVzZXJJZCwgeyBsYXN0UHJvZHVjdDogcHJvZHVjdHNbMF0sIGxhc3RQcm9kdWN0czogcHJvZHVjdHMgfSk7XG4gICAgICAgICAgXG4gICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICB0eXBlOiAnY2F0ZWdvcnlRdWVyeScsXG4gICAgICAgICAgICBtZXNzYWdlOiBgQ2jDum5nIHTDtGkgY8OzICR7cHJvZHVjdHMubGVuZ3RofSBz4bqjbiBwaOG6qW0gcGjDuSBo4bujcDpgLFxuICAgICAgICAgICAgZGF0YTogcHJvZHVjdHNcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBS4bqldCB0aeG6v2MsIGNow7puZyB0w7RpIGhp4buHbiBraMO0bmcgY8OzIHPhuqNuIHBo4bqpbSBcIiR7cHJvZHVjdFF1ZXN0aW9ufVwiIHRyb25nIGtoby4gQuG6oW4gY8OzIHRo4buDIHhlbSBjw6FjIHPhuqNuIHBo4bqpbSB0xrDGoW5nIHThu7Ega2jDoWMga2jDtG5nP2BcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSB0w6xtIGtp4bq/bSBz4bqjbiBwaOG6qW06XCIsIGVycm9yKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gVGnhur9wIHThu6VjIHjhu60gbMO9IGPDoWMgaW50ZW50IGtow6FjIG7hur91IGtow7RuZyBwaOG6o2kgY8OidSBo4buPaSB24buBIHPhuqNuIHBo4bqpbSBoaeG7h24gdOG6oWlcbiAgICAvLyBQaMOhdCBoaeG7h24gaW50ZW50IHThu6sgdGluIG5o4bqvblxuICAgIGNvbnN0IGludGVudCA9IGRldGVjdEludGVudChtZXNzYWdlKTtcbiAgICBjb25zb2xlLmxvZyhcIkludGVudCDEkcaw4bujYyBwaMOhdCBoaeG7h246XCIsIGludGVudCk7XG4gICAgXG4gICAgLy8gWOG7rSBsw70gZOG7sWEgdHLDqm4gaW50ZW50XG4gICAgbGV0IHJlc3BvbnNlO1xuICAgIHN3aXRjaCAoaW50ZW50KSB7XG4gICAgICBjYXNlICdncmVldGluZyc6XG4gICAgICAgIHJlc3BvbnNlID0ge1xuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICAgIG1lc3NhZ2U6IFwiWGluIGNow6BvISBUw7RpIGzDoCB0cuG7oyBsw70g4bqjbyBj4bunYSBj4butYSBow6BuZy4gVMO0aSBjw7MgdGjhu4MgZ2nDunAgZ8OsIGNobyBi4bqhbj9cIlxuICAgICAgICB9O1xuICAgICAgICBicmVhaztcbiAgICAgICAgXG4gICAgICBjYXNlICdwcmljZSc6XG4gICAgICAgIHJlc3BvbnNlID0ge1xuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICAgIG1lc3NhZ2U6IFwixJDhu4MgYmnhur90IGdpw6EgY+G7pSB0aOG7gyBj4bunYSBz4bqjbiBwaOG6qW0sIHZ1aSBsw7JuZyBjaG8gdMO0aSBiaeG6v3QgYuG6oW4gcXVhbiB0w6JtIMSR4bq/biBz4bqjbiBwaOG6qW0gbsOgbz9cIlxuICAgICAgICB9O1xuICAgICAgICBicmVhaztcbiAgICAgICAgXG4gICAgICBjYXNlICdjb29raW5nX3JlY2lwZSc6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gR+G7jWkgQVBJIFB5dGhvbiBiYWNrZW5kIMSR4buDIGzhuqV5IGPDtG5nIHRo4bupYyBu4bqldSDEg25cbiAgICAgICAgICBjb25zdCBweVJlcyA9IGF3YWl0IGF4aW9zLnBvc3QoJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMC9hcGkvY2hhdGJvdC9hc2snLCB7IHF1ZXN0aW9uOiBtZXNzYWdlIH0pO1xuICAgICAgICAgIGlmIChweVJlcy5kYXRhICYmIHB5UmVzLmRhdGEuYW5zd2VyKSB7XG4gICAgICAgICAgICAvLyBMxrB1IGPDtG5nIHRo4bupYyB2w6BvIG5n4buvIGPhuqNuaCDEkeG7gyBz4butIGThu6VuZyBzYXUgbsOgeVxuICAgICAgICAgICAgaWYgKHVzZXJJZCkge1xuICAgICAgICAgICAgICBzYXZlQ29udGV4dCh1c2VySWQsIHsgbGFzdFJlY2lwZTogcHlSZXMuZGF0YS5hbnN3ZXIsIGxhc3RRdWVyeTogbWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICAgICAgICBtZXNzYWdlOiBweVJlcy5kYXRhLmFuc3dlclxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc3BvbnNlID0ge1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiWGluIGzhu5dpLCB0w7RpIGtow7RuZyB0w6xtIHRo4bqleSBjw7RuZyB0aOG7qWMgcGjDuSBo4bujcC5cIlxuICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSBs4bqleSBjw7RuZyB0aOG7qWMgbuG6pXUgxINuOlwiLCBlcnJvcik7XG4gICAgICAgICAgcmVzcG9uc2UgPSB7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICAgICAgbWVzc2FnZTogXCJYaW4gbOG7l2ksIMSRw6MgY8OzIGzhu5dpIHjhuqN5IHJhIGtoaSBs4bqleSBjw7RuZyB0aOG7qWMgbuG6pXUgxINuLlwiXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgICAgXG4gICAgICBjYXNlICdwcm9kdWN0JzpcbiAgICAgICAgLy8gVMOsbSBraeG6v20gc+G6o24gcGjhuqltXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gU+G7rSBk4bulbmcgTW9uZ29EQiDEkeG7gyB0w6xtIGtp4bq/bSB0aGF5IHbDrCBQeXRob25cbiAgICAgICAgICBjb25zdCBwcm9kdWN0UmVzdWx0cyA9IGF3YWl0IHNlYXJjaFByb2R1Y3RzTW9uZ29EQihtZXNzYWdlKTtcbiAgICAgICAgICBcbiAgICAgICAgICBpZiAocHJvZHVjdFJlc3VsdHMgJiYgcHJvZHVjdFJlc3VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgLy8gTMawdSBz4bqjbiBwaOG6qW0gxJHhuqd1IHRpw6puIHbDoG8gbmfhu68gY+G6o25oXG4gICAgICAgICAgICBpZiAodXNlcklkKSB7XG4gICAgICAgICAgICAgIHNhdmVDb250ZXh0KHVzZXJJZCwgeyBcbiAgICAgICAgICAgICAgICBsYXN0UHJvZHVjdDogcHJvZHVjdFJlc3VsdHNbMF0sIFxuICAgICAgICAgICAgICAgIGxhc3RQcm9kdWN0czogcHJvZHVjdFJlc3VsdHMsXG4gICAgICAgICAgICAgICAgbGFzdFF1ZXJ5OiBtZXNzYWdlIFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYMSQw6MgbMawdSBz4bqjbiBwaOG6qW0gXCIke3Byb2R1Y3RSZXN1bHRzWzBdLnByb2R1Y3ROYW1lfVwiIHbDoG8gbmfhu68gY+G6o25oIGNobyB1c2VyICR7dXNlcklkfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICB0eXBlOiAnY2F0ZWdvcnlRdWVyeScsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IFwixJDDonkgbMOgIG3hu5l0IHPhu5Egc+G6o24gcGjhuqltIHBow7kgaOG7o3AgduG7m2kgecOqdSBj4bqndSBj4bunYSBi4bqhbjpcIixcbiAgICAgICAgICAgICAgZGF0YTogcHJvZHVjdFJlc3VsdHNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXNwb25zZSA9IHtcbiAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICAgICAgICBtZXNzYWdlOiBcIlLhuqV0IHRp4bq/YywgdMO0aSBraMO0bmcgdMOsbSB0aOG6pXkgc+G6o24gcGjhuqltIHBow7kgaOG7o3AgduG7m2kgecOqdSBj4bqndSBj4bunYSBi4bqhbi4gQuG6oW4gY8OzIHRo4buDIG3DtCB04bqjIGNoaSB0aeG6v3QgaMahbiBraMO0bmc/XCJcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgdMOsbSBraeG6v20gc+G6o24gcGjhuqltOlwiLCBlcnJvcik7XG4gICAgICAgICAgcmVzcG9uc2UgPSB7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICAgICAgbWVzc2FnZTogXCLEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSB0w6xtIGtp4bq/bSBz4bqjbiBwaOG6qW0uIFZ1aSBsw7JuZyB0aOG7rSBs4bqhaSBzYXUuXCJcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgXG4gICAgICAvLyBY4butIGzDvSBjw6FjIGPDonUgaOG7j2kgdGjGsOG7nW5nIGfhurdwIChGQVEpXG4gICAgICBjYXNlICdmYXFfaG93X3RvX2J1eSc6XG4gICAgICBjYXNlICdmYXFfaG93X3RvX29yZGVyJzpcbiAgICAgIGNhc2UgJ2ZhcV9wYXltZW50X21ldGhvZHMnOlxuICAgICAgY2FzZSAnZmFxX3N0b3JlX2xvY2F0aW9uJzpcbiAgICAgIGNhc2UgJ2ZhcV9wcm9kdWN0X3F1YWxpdHknOlxuICAgICAgY2FzZSAnZmFxX3NoaXBwaW5nX3RpbWUnOlxuICAgICAgY2FzZSAnZmFxX3JldHVybl9wb2xpY3knOlxuICAgICAgY2FzZSAnZmFxX3Byb21vdGlvbnMnOlxuICAgICAgY2FzZSAnZmFxX3RyZW5kaW5nX3Byb2R1Y3RzJzpcbiAgICAgIGNhc2UgJ2ZhcV9zaGlwcGluZ19mZWUnOlxuICAgICAgY2FzZSAnZmFxX2N1c3RvbWVyX3N1cHBvcnQnOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIEfhu41pIGjDoG0geOG7rSBsw70gRkFRXG4gICAgICAgICAgY29uc3QgZmFxUmVzcG9uc2UgPSBoYW5kbGVGQVFRdWVzdGlvbihpbnRlbnQpO1xuICAgICAgICAgIGlmIChmYXFSZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKGZhcVJlc3BvbnNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSB44butIGzDvSBjw6J1IGjhu49pIEZBUTpcIiwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBcbiAgICAgIGNhc2UgJ3Vua25vd24nOlxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBUaOG7rSB0w6xtIGtp4bq/bSBz4bqjbiBwaOG6qW0gdHLhu7FjIHRp4bq/cFxuICAgICAgICAgIGNvbnN0IHByb2R1Y3RzID0gYXdhaXQgc2VhcmNoUHJvZHVjdHNNb25nb0RCKG1lc3NhZ2UpO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmIChwcm9kdWN0cyAmJiBwcm9kdWN0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAvLyBMxrB1IHPhuqNuIHBo4bqpbSDEkeG6p3UgdGnDqm4gdsOgbyBuZ+G7ryBj4bqjbmhcbiAgICAgICAgICAgIGlmICh1c2VySWQpIHtcbiAgICAgICAgICAgICAgc2F2ZUNvbnRleHQodXNlcklkLCB7IFxuICAgICAgICAgICAgICAgIGxhc3RQcm9kdWN0OiBwcm9kdWN0c1swXSwgXG4gICAgICAgICAgICAgICAgbGFzdFByb2R1Y3RzOiBwcm9kdWN0cyxcbiAgICAgICAgICAgICAgICBsYXN0UXVlcnk6IG1lc3NhZ2UgXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgxJDDoyBsxrB1IHPhuqNuIHBo4bqpbSBcIiR7cHJvZHVjdHNbMF0ucHJvZHVjdE5hbWV9XCIgdsOgbyBuZ+G7ryBj4bqjbmggY2hvIHVzZXIgJHt1c2VySWR9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgIHR5cGU6ICdjYXRlZ29yeVF1ZXJ5JyxcbiAgICAgICAgICAgICAgbWVzc2FnZTogXCLEkMOieSBsw6AgbeG7mXQgc+G7kSBz4bqjbiBwaOG6qW0gcGjDuSBo4bujcCB24bubaSB5w6p1IGPhuqd1IGPhu6dhIGLhuqFuOlwiLFxuICAgICAgICAgICAgICBkYXRhOiBwcm9kdWN0c1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3BvbnNlID0ge1xuICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IFwiVMO0aSBraMO0bmcgdMOsbSB0aOG6pXkgdGjDtG5nIHRpbiBwaMO5IGjhu6NwLiBC4bqhbiBjw7MgdGjhu4MgaOG7j2kgY+G7pSB0aOG7gyBoxqFuIHbhu4Egc+G6o24gcGjhuqltLCBnacOhIGPhuqMsIGhv4bq3YyB0aMO0bmcgdGluIGtow6FjIGtow7RuZz9cIlxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSB44butIGzDvSBjw6J1IGjhu49pOlwiLCBlcnJvcik7XG4gICAgICAgICAgcmVzcG9uc2UgPSB7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICAgICAgbWVzc2FnZTogXCJUw7RpIGtow7RuZyBoaeG7g3Ugw70gY+G7p2EgYuG6oW4uIELhuqFuIGPDsyB0aOG7gyBkaeG7hW4gxJHhuqF0IHRoZW8gY8OhY2gga2jDoWMgxJHGsOG7o2Mga2jDtG5nP1wiXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHJlc3BvbnNlKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIHjhu60gbMO9IHRpbiBuaOG6r246XCIsIGVycm9yKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBcIkFuIGVycm9yIG9jY3VycmVkIHdoaWxlIHByb2Nlc3NpbmcgdGhlIG1lc3NhZ2VcIlxuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIEjDoG0geOG7rSBsw70gd2ViaG9vayB04burIFJhc2FcbiAqIEBwYXJhbSB7b2JqZWN0fSByZXEgLSBSZXF1ZXN0IG9iamVjdFxuICogQHBhcmFtIHtvYmplY3R9IHJlcyAtIFJlc3BvbnNlIG9iamVjdFxuICogQHJldHVybnMge29iamVjdH0gLSBKU09OIHJlc3BvbnNlXG4gKi9cbmV4cG9ydCBjb25zdCBoYW5kbGVSYXNhV2ViaG9vayA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKFwiTmjhuq1uIHdlYmhvb2sgdOG7qyBSYXNhOlwiLCByZXEuYm9keSk7XG4gICAgXG4gICAgLy8gWOG7rSBsw70gZOG7ryBsaeG7h3UgdOG7qyBSYXNhXG4gICAgY29uc3QgcmFzYVJlc3BvbnNlID0gcmVxLmJvZHk7XG4gICAgXG4gICAgLy8gVHLhuqMgduG7gSBwaOG6o24gaOG7k2lcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IFwiV2ViaG9vayByZWNlaXZlZCBzdWNjZXNzZnVsbHlcIixcbiAgICAgIGRhdGE6IHJhc2FSZXNwb25zZVxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgeOG7rSBsw70gd2ViaG9vayB04burIFJhc2E6XCIsIGVycm9yKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBcIkFuIGVycm9yIG9jY3VycmVkIHdoaWxlIHByb2Nlc3NpbmcgdGhlIHdlYmhvb2tcIlxuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIFTDrG0ga2nhur9tIHPhuqNuIHBo4bqpbSB0cuG7sWMgdGnhur9wIGLhurFuZyBNb25nb0RCXG4gKiBAcGFyYW0ge3N0cmluZ30gcXVlcnkgLSBDw6J1IHRydXkgduG6pW4gdMOsbSBraeG6v21cbiAqIEByZXR1cm5zIHtBcnJheX0gLSBEYW5oIHPDoWNoIHPhuqNuIHBo4bqpbVxuICovXG5jb25zdCBzZWFyY2hQcm9kdWN0c01vbmdvREIgPSBhc3luYyAocXVlcnkpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZyhcIsSQYW5nIHTDrG0ga2nhur9tIHPhuqNuIHBo4bqpbSB24bubaSBxdWVyeTpcIiwgcXVlcnkpO1xuICAgIFxuICAgIC8vIFjhu60gbMO9IHF1ZXJ5IMSR4buDIHTDrG0gdOG7qyBraMOzYSBxdWFuIHRy4buNbmdcbiAgICBjb25zdCBsb3dlclF1ZXJ5ID0gcXVlcnkudG9Mb3dlckNhc2UoKTtcbiAgICBcbiAgICAvLyBUw6xtIGtp4bq/bSBz4bqjbiBwaOG6qW0gdGhlbyBnacOhXG4gICAgY29uc3QgcHJpY2VNYXRjaCA9IGxvd2VyUXVlcnkubWF0Y2goL2TGsOG7m2kgKFxcZCspay9pKSB8fCBsb3dlclF1ZXJ5Lm1hdGNoKC88IChcXGQrKWsvaSkgfHwgbG93ZXJRdWVyeS5tYXRjaCgvbmjhu48gaMahbiAoXFxkKylrL2kpO1xuICAgIGNvbnN0IHByaWNlSGlnaE1hdGNoID0gbG93ZXJRdWVyeS5tYXRjaCgvdHLDqm4gKFxcZCspay9pKSB8fCBsb3dlclF1ZXJ5Lm1hdGNoKC8+IChcXGQrKWsvaSkgfHwgbG93ZXJRdWVyeS5tYXRjaCgvbOG7m24gaMahbiAoXFxkKylrL2kpO1xuICAgIGNvbnN0IHByaWNlQmV0d2Vlbk1hdGNoID0gbG93ZXJRdWVyeS5tYXRjaCgvdOG7qyAoXFxkKylrIMSR4bq/biAoXFxkKylrL2kpIHx8IGxvd2VyUXVlcnkubWF0Y2goLyhcXGQrKWsgLSAoXFxkKylrL2kpO1xuICAgIFxuICAgIC8vIE3huqNuZyBjw6FjIMSRaeG7gXUga2nhu4duIHTDrG0ga2nhur9tXG4gICAgY29uc3QgY29uZGl0aW9ucyA9IFtdO1xuICAgIGxldCBpc1ByaWNlUXVlcnkgPSBmYWxzZTtcbiAgICBcbiAgICAvLyBY4butIGzDvSB0w6xtIGtp4bq/bSB0aGVvIGtob+G6o25nIGdpw6FcbiAgICBpZiAocHJpY2VNYXRjaCkge1xuICAgICAgY29uc3QgbWF4UHJpY2UgPSBwYXJzZUludChwcmljZU1hdGNoWzFdKSAqIDEwMDA7XG4gICAgICBjb25kaXRpb25zLnB1c2goeyBcbiAgICAgICAgJG9yOiBbXG4gICAgICAgICAgeyBwcmljZTogeyAkbHRlOiBtYXhQcmljZSB9IH0sXG4gICAgICAgICAgeyBwcm9kdWN0UHJpY2U6IHsgJGx0ZTogbWF4UHJpY2UgfSB9XG4gICAgICAgIF1cbiAgICAgIH0pO1xuICAgICAgaXNQcmljZVF1ZXJ5ID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUubG9nKFwiVMOsbSBz4bqjbiBwaOG6qW0gY8OzIGdpw6EgZMaw4bubaTpcIiwgbWF4UHJpY2UpO1xuICAgIH0gZWxzZSBpZiAocHJpY2VIaWdoTWF0Y2gpIHtcbiAgICAgIGNvbnN0IG1pblByaWNlID0gcGFyc2VJbnQocHJpY2VIaWdoTWF0Y2hbMV0pICogMTAwMDtcbiAgICAgIGNvbmRpdGlvbnMucHVzaCh7IFxuICAgICAgICAkb3I6IFtcbiAgICAgICAgICB7IHByaWNlOiB7ICRndGU6IG1pblByaWNlIH0gfSxcbiAgICAgICAgICB7IHByb2R1Y3RQcmljZTogeyAkZ3RlOiBtaW5QcmljZSB9IH1cbiAgICAgICAgXVxuICAgICAgfSk7XG4gICAgICBpc1ByaWNlUXVlcnkgPSB0cnVlO1xuICAgICAgY29uc29sZS5sb2coXCJUw6xtIHPhuqNuIHBo4bqpbSBjw7MgZ2nDoSB0csOqbjpcIiwgbWluUHJpY2UpO1xuICAgIH0gZWxzZSBpZiAocHJpY2VCZXR3ZWVuTWF0Y2gpIHtcbiAgICAgIGNvbnN0IG1pblByaWNlID0gcGFyc2VJbnQocHJpY2VCZXR3ZWVuTWF0Y2hbMV0pICogMTAwMDtcbiAgICAgIGNvbnN0IG1heFByaWNlID0gcGFyc2VJbnQocHJpY2VCZXR3ZWVuTWF0Y2hbMl0pICogMTAwMDtcbiAgICAgIGNvbmRpdGlvbnMucHVzaCh7IFxuICAgICAgICAkb3I6IFtcbiAgICAgICAgICB7IHByaWNlOiB7ICRndGU6IG1pblByaWNlLCAkbHRlOiBtYXhQcmljZSB9IH0sXG4gICAgICAgICAgeyBwcm9kdWN0UHJpY2U6IHsgJGd0ZTogbWluUHJpY2UsICRsdGU6IG1heFByaWNlIH0gfVxuICAgICAgICBdXG4gICAgICB9KTtcbiAgICAgIGlzUHJpY2VRdWVyeSA9IHRydWU7XG4gICAgICBjb25zb2xlLmxvZyhcIlTDrG0gc+G6o24gcGjhuqltIGPDsyBnacOhIHThu6tcIiwgbWluUHJpY2UsIFwixJHhur9uXCIsIG1heFByaWNlKTtcbiAgICB9XG4gICAgXG4gICAgLy8gS2nhu4NtIHRyYSB4ZW0gY8OzIGPhu6VtIHThu6sgXCJuxrDhu5tjIGdp4bq3dFwiIGtow7RuZ1xuICAgIGNvbnN0IHNwZWNpZmljUGhyYXNlcyA9IFtcbiAgICAgIHsgcGhyYXNlOiBcIm7GsOG7m2MgZ2nhurd0XCIsIGNhdGVnb3J5OiBcIsSQ4buTIGdpYSBk4bulbmdcIiB9LFxuICAgICAgeyBwaHJhc2U6IFwibsaw4bubYyBy4butYSBjaMOpblwiLCBjYXRlZ29yeTogXCLEkOG7kyBnaWEgZOG7pW5nXCIgfSxcbiAgICAgIHsgcGhyYXNlOiBcIm7GsOG7m2MgbGF1IHPDoG5cIiwgY2F0ZWdvcnk6IFwixJDhu5MgZ2lhIGThu6VuZ1wiIH0sXG4gICAgICB7IHBocmFzZTogXCJuxrDhu5tjIGdp4bqjaSBraMOhdFwiLCBjYXRlZ29yeTogXCLEkOG7kyB14buRbmdcIiB9LFxuICAgICAgeyBwaHJhc2U6IFwibsaw4bubYyBuZ+G7jXRcIiwgY2F0ZWdvcnk6IFwixJDhu5MgdeG7kW5nXCIgfSxcbiAgICAgIHsgcGhyYXNlOiBcIm7GsOG7m2MgdMawxqFuZ1wiLCBjYXRlZ29yeTogXCJHaWEgduG7i1wiIH1cbiAgICBdO1xuICAgIFxuICAgIGxldCBmb3VuZFNwZWNpZmljUGhyYXNlID0gZmFsc2U7XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHNwZWNpZmljUGhyYXNlcykge1xuICAgICAgaWYgKGxvd2VyUXVlcnkuaW5jbHVkZXMoaXRlbS5waHJhc2UpKSB7XG4gICAgICAgIGZvdW5kU3BlY2lmaWNQaHJhc2UgPSB0cnVlO1xuICAgICAgICBjb25kaXRpb25zLnB1c2goeyBcbiAgICAgICAgICAkb3I6IFtcbiAgICAgICAgICAgIHsgcHJvZHVjdE5hbWU6IHsgJHJlZ2V4OiBpdGVtLnBocmFzZSwgJG9wdGlvbnM6ICdpJyB9IH0sXG4gICAgICAgICAgICB7IGRlc2NyaXB0aW9uOiB7ICRyZWdleDogaXRlbS5waHJhc2UsICRvcHRpb25zOiAnaScgfSB9LFxuICAgICAgICAgICAgeyBjYXRlZ29yeTogaXRlbS5jYXRlZ29yeSB9XG4gICAgICAgICAgXVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5sb2coYFTDrG0gc+G6o24gcGjhuqltIHbhu5tpIGPhu6VtIHThu6sgY+G7pSB0aOG7gzogXCIke2l0ZW0ucGhyYXNlfVwiIHRodeG7mWMgZGFuaCBt4bulYyAke2l0ZW0uY2F0ZWdvcnl9YCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBY4butIGzDvSB0w6xtIGtp4bq/bSB0aGVvIGRhbmggbeG7pWMvbG/huqFpIHPhuqNuIHBo4bqpbSBu4bq/dSBraMO0bmcgdMOsbSDEkcaw4bujYyBj4bulbSB04burIGPhu6UgdGjhu4MgdsOgIGtow7RuZyBwaOG6o2kgbMOgIGPDonUgaOG7j2kgduG7gSBnacOhXG4gICAgaWYgKCFmb3VuZFNwZWNpZmljUGhyYXNlICYmICFpc1ByaWNlUXVlcnkpIHtcbiAgICAgIGNvbnN0IGNhdGVnb3J5S2V5d29yZHMgPSBbXG4gICAgICAgIHsga2V5d29yZHM6IFsncmF1JywgJ2Phu6cnLCAncXXhuqMnLCAncmF1IGPhu6cnLCAncmF1IHF14bqjJywgJ3Ryw6FpIGPDonknXSwgY2F0ZWdvcnk6ICdSYXUgY+G7pyBxdeG6oycgfSxcbiAgICAgICAgeyBrZXl3b3JkczogWyd0aOG7i3QnLCAnY8OhJywgJ2jhuqNpIHPhuqNuJywgJ3Ro4buLdCBjw6EnLCAndGjhu6d5IGjhuqNpIHPhuqNuJ10sIGNhdGVnb3J5OiAnVGjhu4t0IHbDoCBo4bqjaSBz4bqjbicgfSxcbiAgICAgICAgeyBrZXl3b3JkczogWyfEkeG7kyB14buRbmcnLCAnbsaw4bubYyBuZ+G7jXQnLCAnYmlhJywgJ3LGsOG7o3UnXSwgY2F0ZWdvcnk6ICfEkOG7kyB14buRbmcnIH0sXG4gICAgICAgIHsga2V5d29yZHM6IFsnZ2lhIHbhu4snLCAnZOG6p3UgxINuJywgJ27GsOG7m2MgbeG6r20nLCAnbXXhu5FpJywgJ8SRxrDhu51uZycsICdtw6wgY2jDrW5oJ10sIGNhdGVnb3J5OiAnR2lhIHbhu4snIH0sXG4gICAgICAgIHsga2V5d29yZHM6IFsnYsOhbmgnLCAna+G6uW8nLCAnc25hY2snLCAnxJHhu5MgxINuIHbhurd0J10sIGNhdGVnb3J5OiAnQsOhbmgga+G6uW8nIH0sXG4gICAgICAgIHsga2V5d29yZHM6IFsnbcOsJywgJ2LDum4nLCAncGjhu58nLCAnbWnhur9uJywgJ2jhu6cgdGnhur91J10sIGNhdGVnb3J5OiAnTcOsLCBiw7puLCBwaOG7nycgfSxcbiAgICAgICAgeyBrZXl3b3JkczogWydnaeG6t3QnLCAneMOgIHBow7JuZycsICduxrDhu5tjIHLhu61hJywgJ2xhdScsICd24buHIHNpbmgnXSwgY2F0ZWdvcnk6ICfEkOG7kyBnaWEgZOG7pW5nJyB9XG4gICAgICBdO1xuICAgICAgXG4gICAgICBsZXQgZm91bmRDYXRlZ29yeSA9IGZhbHNlO1xuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGNhdGVnb3J5S2V5d29yZHMpIHtcbiAgICAgICAgaWYgKGl0ZW0ua2V5d29yZHMuc29tZShrZXl3b3JkID0+IGxvd2VyUXVlcnkuaW5jbHVkZXMoa2V5d29yZCkpKSB7XG4gICAgICAgICAgY29uZGl0aW9ucy5wdXNoKHsgY2F0ZWdvcnk6IGl0ZW0uY2F0ZWdvcnkgfSk7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJUw6xtIHPhuqNuIHBo4bqpbSB0aHXhu5ljIGRhbmggbeG7pWM6XCIsIGl0ZW0uY2F0ZWdvcnkpO1xuICAgICAgICAgIGZvdW5kQ2F0ZWdvcnkgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIFTDrG0gdGhlbyB04burIGtow7NhIGPhu6UgdGjhu4MgKHTDqm4gc+G6o24gcGjhuqltKVxuICAgIGNvbnN0IHN0b3BXb3JkcyA9IFsndMOsbScsICdraeG6v20nLCAnc+G6o24nLCAncGjhuqltJywgJ3PhuqNuIHBo4bqpbScsICdow6BuZycsICdnacOhJywgJ211YScsICdiw6FuJywgJ2PDoWMnLCAnY8OzJywgJ2tow7RuZycsICd24bqteScsICdzaG9wJywgJ2Phu61hIGjDoG5nJywgJ3Row6wnLCAnbMOgJywgJ3bDoCcsICdoYXknLCAnaG/hurdjJywgJ25ow6knLCAn4bqhJywgJ2TGsOG7m2knLCAndHLDqm4nLCAna2hv4bqjbmcnLCAndOG7qycsICfEkeG6v24nXTtcbiAgICBjb25zdCB3b3JkcyA9IGxvd2VyUXVlcnkuc3BsaXQoL1xccysvKTtcbiAgICBcbiAgICAvLyBM4buNYyBi4buPIHThu6sga2jDs2EgZ2nDoSAoMTAwaywgNTBrKVxuICAgIGNvbnN0IHByaWNlS2V5d29yZHMgPSB3b3Jkcy5maWx0ZXIod29yZCA9PiB3b3JkLm1hdGNoKC9cXGQrayQvaSkpO1xuICAgIGNvbnN0IGtleXdvcmRzID0gd29yZHMuZmlsdGVyKHdvcmQgPT4gIXN0b3BXb3Jkcy5pbmNsdWRlcyh3b3JkKSAmJiB3b3JkLmxlbmd0aCA+IDEgJiYgIXdvcmQubWF0Y2goL1xcZCtrJC9pKSk7XG4gICAgXG4gICAgY29uc29sZS5sb2coXCJU4burIGtow7NhIGdpw6E6XCIsIHByaWNlS2V5d29yZHMpO1xuICAgIGNvbnNvbGUubG9nKFwiVOG7qyBraMOzYSB0w6xtIGtp4bq/bTpcIiwga2V5d29yZHMpO1xuICAgIFxuICAgIC8vIFjhu60gbMO9IMSR4bq3YyBiaeG7h3QgY2hvIHRyxrDhu51uZyBo4bujcCB0w6xtIGtp4bq/bSBcInJhdVwiXG4gICAgY29uc3QgaXNWZWdldGFibGVTZWFyY2ggPSBrZXl3b3Jkcy5zb21lKGt3ID0+IFsncmF1JywgJ2Phu6cnLCAncXXhuqMnXS5pbmNsdWRlcyhrdykpO1xuICAgIGxldCBpc1NwZWNpYWxDYXRlZ29yeVNlYXJjaCA9IGZhbHNlO1xuICAgIFxuICAgIGlmIChpc1ZlZ2V0YWJsZVNlYXJjaCkge1xuICAgICAgaXNTcGVjaWFsQ2F0ZWdvcnlTZWFyY2ggPSB0cnVlO1xuICAgICAgLy8gTuG6v3UgY2jhu4kgdG/DoG4gdOG7qyBraMOzYSBsacOqbiBxdWFuIMSR4bq/biByYXUgY+G7pyBxdeG6oywgxrB1IHRpw6puIHPhu60gZOG7pW5nIGRhbmggbeG7pWMgdGhheSB2w6wgdMOsbSB0aGVvIHThu6sga2jDs2FcbiAgICAgIGlmIChrZXl3b3Jkcy5ldmVyeShrdyA9PiBbJ3JhdScsICdj4bunJywgJ3F14bqjJywgJ3Ryw6FpJ10uaW5jbHVkZXMoa3cpKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIlTDrG0gdOG6pXQgY+G6oyBz4bqjbiBwaOG6qW0gdHJvbmcgZGFuaCBt4bulYyBSYXUgY+G7pyBxdeG6o1wiKTtcbiAgICAgICAgLy8gWMOzYSDEkWnhu4F1IGtp4buHbiB0w6xtIGtp4bq/bSBoaeG7h24gdOG6oWkgbuG6v3UgY8OzXG4gICAgICAgIGNvbnN0IGNhdGVnb3J5SW5kZXggPSBjb25kaXRpb25zLmZpbmRJbmRleChjID0+IGMuY2F0ZWdvcnkgPT09ICdSYXUgY+G7pyBxdeG6oycpO1xuICAgICAgICBpZiAoY2F0ZWdvcnlJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICBjb25kaXRpb25zLnNwbGljZShjYXRlZ29yeUluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBUaMOqbSDEkWnhu4F1IGtp4buHbiB0w6xtIGtp4bq/bSB0aGVvIGRhbmggbeG7pWNcbiAgICAgICAgY29uZGl0aW9ucy5wdXNoKHsgY2F0ZWdvcnk6ICdSYXUgY+G7pyBxdeG6oycgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIE7hur91IMSRw6J5IGzDoCBjw6J1IGjhu49pIHbhu4EgZ2nDoSwgxrB1IHRpw6puIGNo4buJIHTDrG0gdGhlbyBnacOhIG7hur91IGtow7RuZyBjw7MgdOG7qyBraMOzYSDEkeG6t2MgYmnhu4d0XG4gICAgaWYgKGlzUHJpY2VRdWVyeSkge1xuICAgICAgaWYgKGtleXdvcmRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIsSQw6J5IGzDoCBjw6J1IGjhu49pIHTDrG0gdGhlbyBnacOhLCBjaOG7iSB0w6xtIGtp4bq/bSBk4buxYSB0csOqbiDEkWnhu4F1IGtp4buHbiBnacOhXCIpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIC8vIFThuqFvIGPDoWMgxJFp4buBdSBraeG7h24gdMOsbSBraeG6v20gdGhlbyB04burbmcgdOG7qyBraMOzYVxuICAgICAgICBjb25zdCBrZXl3b3JkQ29uZGl0aW9ucyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGtleXdvcmQgb2Yga2V5d29yZHMpIHtcbiAgICAgICAgICBrZXl3b3JkQ29uZGl0aW9ucy5wdXNoKHsgcHJvZHVjdE5hbWU6IHsgJHJlZ2V4OiBrZXl3b3JkLCAkb3B0aW9uczogJ2knIH0gfSk7XG4gICAgICAgICAga2V5d29yZENvbmRpdGlvbnMucHVzaCh7IGRlc2NyaXB0aW9uOiB7ICRyZWdleDoga2V5d29yZCwgJG9wdGlvbnM6ICdpJyB9IH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXl3b3JkQ29uZGl0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgY29uZGl0aW9ucy5wdXNoKHsgJG9yOiBrZXl3b3JkQ29uZGl0aW9ucyB9KTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIlTDrG0gc+G6o24gcGjhuqltIHRoZW8gY+G6oyBnacOhIHbDoCB04burIGtow7NhOlwiLCBrZXl3b3Jkcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gTuG6v3Uga2jDtG5nIHBo4bqjaSBjw6J1IGjhu49pIHbhu4EgZ2nDoSwgdMOsbSB0aGVvIHThu6sga2jDs2EgdGjDtG5nIHRoxrDhu51uZ1xuICAgIGVsc2UgaWYgKGtleXdvcmRzLmxlbmd0aCA+IDAgJiYgIWlzU3BlY2lhbENhdGVnb3J5U2VhcmNoKSB7XG4gICAgICAvLyBU4bqhbyBjw6FjIMSRaeG7gXUga2nhu4duIHTDrG0ga2nhur9tIHRoZW8gdOG7q25nIHThu6sga2jDs2FcbiAgICAgIGNvbnN0IGtleXdvcmRDb25kaXRpb25zID0gW107XG4gICAgICBmb3IgKGNvbnN0IGtleXdvcmQgb2Yga2V5d29yZHMpIHtcbiAgICAgICAga2V5d29yZENvbmRpdGlvbnMucHVzaCh7IHByb2R1Y3ROYW1lOiB7ICRyZWdleDoga2V5d29yZCwgJG9wdGlvbnM6ICdpJyB9IH0pO1xuICAgICAgICBrZXl3b3JkQ29uZGl0aW9ucy5wdXNoKHsgZGVzY3JpcHRpb246IHsgJHJlZ2V4OiBrZXl3b3JkLCAkb3B0aW9uczogJ2knIH0gfSk7XG4gICAgICB9XG4gICAgICBpZiAoa2V5d29yZENvbmRpdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25kaXRpb25zLnB1c2goeyAkb3I6IGtleXdvcmRDb25kaXRpb25zIH0pO1xuICAgICAgICBjb25zb2xlLmxvZyhcIlTDrG0gc+G6o24gcGjhuqltIHRoZW8gdOG7qyBraMOzYTpcIiwga2V5d29yZHMpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBsZXQgZmlsdGVyID0ge307XG4gICAgXG4gICAgLy8gWMOieSBk4buxbmcgZmlsdGVyIHTDuXkgdGh14buZYyB2w6BvIGxv4bqhaSB0w6xtIGtp4bq/bVxuICAgIGlmIChpc1ByaWNlUXVlcnkgJiYga2V5d29yZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAvLyBO4bq/dSBjaOG7iSB0w6xtIHRoZW8gZ2nDoSwga2jDtG5nIGJhbyBn4buTbSB04burIGtow7NhXG4gICAgICBmaWx0ZXIgPSBjb25kaXRpb25zLmxlbmd0aCA+IDAgPyB7ICRhbmQ6IGNvbmRpdGlvbnMgfSA6IHt9O1xuICAgIH0gZWxzZSBpZiAoaXNQcmljZVF1ZXJ5ICYmIGtleXdvcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgIC8vIE7hur91IHTDrG0gdGhlbyBj4bqjIGdpw6EgdsOgIHThu6sga2jDs2EsIGNobyBwaMOpcCB0w6xtIGtp4bq/bSBsaW5oIGhv4bqhdCBoxqFuIChnacOhIEhP4bq2QyB04burIGtow7NhKVxuICAgICAgZmlsdGVyID0geyAkb3I6IGNvbmRpdGlvbnMgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQ8OhYyB0csaw4budbmcgaOG7o3AgdMOsbSBraeG6v20gdGjDtG5nIHRoxrDhu51uZyBraMOhY1xuICAgICAgZmlsdGVyID0gY29uZGl0aW9ucy5sZW5ndGggPiAwID8geyAkYW5kOiBjb25kaXRpb25zIH0gOiB7fTtcbiAgICB9XG4gICAgXG4gICAgY29uc29sZS5sb2coXCJGaWx0ZXIgdMOsbSBraeG6v206XCIsIEpTT04uc3RyaW5naWZ5KGZpbHRlcikpO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICBsZXQgcHJvZHVjdHMgPSBbXTtcbiAgICAgIFxuICAgICAgaWYgKE9iamVjdC5rZXlzKGZpbHRlcikubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBUcnV5IHbhuqVuIHThuqV0IGPhuqMgc+G6o24gcGjhuqltIHBow7kgaOG7o3AgduG7m2kgZmlsdGVyXG4gICAgICAgIGNvbnN0IGFsbE1hdGNoZWRQcm9kdWN0cyA9IGF3YWl0IFByb2R1Y3QuZmluZChmaWx0ZXIpLmxpbWl0KDIwKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChhbGxNYXRjaGVkUHJvZHVjdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgLy8gTuG6v3Uga2jDtG5nIHTDrG0gdGjhuqV5IHPhuqNuIHBo4bqpbSwgdGjhu60gdMOsbSBjaOG7iSB24bubaSB04burIGtow7NhXG4gICAgICAgICAgaWYgKGtleXdvcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiS2jDtG5nIHTDrG0gdGjhuqV5IHPhuqNuIHBo4bqpbSwgdGjhu60gdMOsbSBjaOG7iSB24bubaSB04burIGtow7NhXCIpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBU4bqhbyBwaXBlbGluZSBhZ2dyZWdhdGlvbiDEkeG7gyB0w61uaCDEkWnhu4NtIHBow7kgaOG7o3BcbiAgICAgICAgICAgIGNvbnN0IGFnZ3JlZ2F0aW9uUGlwZWxpbmUgPSBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAkbWF0Y2g6IHtcbiAgICAgICAgICAgICAgICAgICRvcjoga2V5d29yZHMuZmxhdE1hcChrZXl3b3JkID0+IFtcbiAgICAgICAgICAgICAgICAgICAgeyBwcm9kdWN0TmFtZTogeyAkcmVnZXg6IGtleXdvcmQsICRvcHRpb25zOiAnaScgfSB9LFxuICAgICAgICAgICAgICAgICAgICB7IGRlc2NyaXB0aW9uOiB7ICRyZWdleDoga2V5d29yZCwgJG9wdGlvbnM6ICdpJyB9IH1cbiAgICAgICAgICAgICAgICAgIF0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgJGFkZEZpZWxkczoge1xuICAgICAgICAgICAgICAgICAgbWF0Y2hTY29yZToge1xuICAgICAgICAgICAgICAgICAgICAkYWRkOiBrZXl3b3Jkcy5tYXAoa2V5d29yZCA9PiBbXG4gICAgICAgICAgICAgICAgICAgICAgeyAkY29uZDogW3sgJHJlZ2V4TWF0Y2g6IHsgaW5wdXQ6IFwiJHByb2R1Y3ROYW1lXCIsIHJlZ2V4OiBrZXl3b3JkLCBvcHRpb25zOiBcImlcIiB9IH0sIDIsIDBdIH0sXG4gICAgICAgICAgICAgICAgICAgICAgeyAkY29uZDogW3sgJHJlZ2V4TWF0Y2g6IHsgaW5wdXQ6IFwiJGRlc2NyaXB0aW9uXCIsIHJlZ2V4OiBrZXl3b3JkLCBvcHRpb25zOiBcImlcIiB9IH0sIDEsIDBdIH1cbiAgICAgICAgICAgICAgICAgICAgXSkuZmxhdCgpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgJHNvcnQ6IHsgbWF0Y2hTY29yZTogLTEgfVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgJGxpbWl0OiAxMFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBwcm9kdWN0cyA9IGF3YWl0IFByb2R1Y3QuYWdncmVnYXRlKGFnZ3JlZ2F0aW9uUGlwZWxpbmUpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFTDrG0gdGjhuqV5ICR7cHJvZHVjdHMubGVuZ3RofSBz4bqjbiBwaOG6qW0gYuG6sW5nIHThu6sga2jDs2EgduG7m2kgxJFp4buDbSBwaMO5IGjhu6NwYCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIE7hur91IHbhuqtuIGtow7RuZyB0w6xtIHRo4bqleSBob+G6t2Mga2jDtG5nIGPDsyB04burIGtow7NhLCB0aOG7rSB0w6xtIHRoZW8gZGFuaCBt4bulY1xuICAgICAgICAgIGlmIChwcm9kdWN0cy5sZW5ndGggPT09IDAgJiYgIWZvdW5kU3BlY2lmaWNQaHJhc2UpIHtcbiAgICAgICAgICAgIC8vIFjhu60gbMO9IMSR4bq3YyBiaeG7h3QgY2hvIHThu6sga2jDs2EgXCJyYXVcIlxuICAgICAgICAgICAgY29uc3QgaXNWZWdldGFibGVRdWVyeSA9IGxvd2VyUXVlcnkuaW5jbHVkZXMoXCJyYXVcIikgfHwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3dlclF1ZXJ5LmluY2x1ZGVzKFwiY+G7p1wiKSB8fCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvd2VyUXVlcnkuaW5jbHVkZXMoXCJxdeG6o1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGlzVmVnZXRhYmxlUXVlcnkpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUaOG7rSB0w6xtIHThuqV0IGPhuqMgc+G6o24gcGjhuqltIHRyb25nIGRhbmggbeG7pWMgUmF1IGPhu6cgcXXhuqNcIik7XG4gICAgICAgICAgICAgIHByb2R1Y3RzID0gYXdhaXQgUHJvZHVjdC5maW5kKHsgY2F0ZWdvcnk6IFwiUmF1IGPhu6cgcXXhuqNcIiB9KS5saW1pdCgxMCk7XG4gICAgICAgICAgICAgIC8vIE7hur91IMSRw6MgdMOsbSB0aOG6pXkgc+G6o24gcGjhuqltLCBi4buPIHF1YSB2aeG7h2MgdMOsbSBraeG6v20gZGFuaCBt4bulYyB0aeG6v3AgdGhlb1xuICAgICAgICAgICAgICBpZiAocHJvZHVjdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBUw6xtIHRo4bqleSAke3Byb2R1Y3RzLmxlbmd0aH0gc+G6o24gcGjhuqltIHRyb25nIGRhbmggbeG7pWMgUmF1IGPhu6cgcXXhuqNgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvZHVjdHM7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgY2F0ZWdvcnlLZXl3b3JkcyA9IFtcbiAgICAgICAgICAgICAgeyBrZXl3b3JkczogWydyYXUnLCAnY+G7pycsICdxdeG6oycsICdyYXUgY+G7pycsICdyYXUgcXXhuqMnLCAndHLDoWkgY8OieSddLCBjYXRlZ29yeTogJ1JhdSBj4bunIHF14bqjJyB9LFxuICAgICAgICAgICAgICB7IGtleXdvcmRzOiBbJ3Ro4buLdCcsICdjw6EnLCAnaOG6o2kgc+G6o24nLCAndGjhu4t0IGPDoScsICd0aOG7p3kgaOG6o2kgc+G6o24nXSwgY2F0ZWdvcnk6ICdUaOG7i3QgdsOgIGjhuqNpIHPhuqNuJyB9LFxuICAgICAgICAgICAgICB7IGtleXdvcmRzOiBbJ8SR4buTIHXhu5FuZycsICduxrDhu5tjIG5n4buNdCcsICdiaWEnLCAncsaw4bujdSddLCBjYXRlZ29yeTogJ8SQ4buTIHXhu5FuZycgfSxcbiAgICAgICAgICAgICAgeyBrZXl3b3JkczogWydnaWEgduG7iycsICdk4bqndSDEg24nLCAnbsaw4bubYyBt4bqvbScsICdtdeG7kWknLCAnxJHGsOG7nW5nJywgJ23DrCBjaMOtbmgnXSwgY2F0ZWdvcnk6ICdHaWEgduG7iycgfSxcbiAgICAgICAgICAgICAgeyBrZXl3b3JkczogWydiw6FuaCcsICdr4bq5bycsICdzbmFjaycsICfEkeG7kyDEg24gduG6t3QnXSwgY2F0ZWdvcnk6ICdCw6FuaCBr4bq5bycgfSxcbiAgICAgICAgICAgICAgeyBrZXl3b3JkczogWydtw6wnLCAnYsO6bicsICdwaOG7nycsICdtaeG6v24nLCAnaOG7pyB0aeG6v3UnXSwgY2F0ZWdvcnk6ICdNw6wsIGLDum4sIHBo4bufJyB9LFxuICAgICAgICAgICAgICB7IGtleXdvcmRzOiBbJ2dp4bq3dCcsICd4w6AgcGjDsm5nJywgJ27GsOG7m2MgcuG7rWEnLCAnbGF1JywgJ3bhu4cgc2luaCddLCBjYXRlZ29yeTogJ8SQ4buTIGdpYSBk4bulbmcnIH1cbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBjYXRlZ29yeUtleXdvcmRzKSB7XG4gICAgICAgICAgICAgIGlmIChpdGVtLmtleXdvcmRzLnNvbWUoa2V5d29yZCA9PiBsb3dlclF1ZXJ5LmluY2x1ZGVzKGtleXdvcmQpKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGjhu60gdMOsbSBjaOG7iSB24bubaSBkYW5oIG3hu6VjOlwiLCBpdGVtLmNhdGVnb3J5KTtcbiAgICAgICAgICAgICAgICBwcm9kdWN0cyA9IGF3YWl0IFByb2R1Y3QuZmluZCh7IGNhdGVnb3J5OiBpdGVtLmNhdGVnb3J5IH0pLmxpbWl0KDEwKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvZHVjdHMubGVuZ3RoID4gMCkgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gTuG6v3UgY8OzIGvhur90IHF14bqjLCB0w61uaCDEkWnhu4NtIHBow7kgaOG7o3AgdsOgIHPhuq9wIHjhur9wIGvhur90IHF14bqjXG4gICAgICAgICAgcHJvZHVjdHMgPSBhbGxNYXRjaGVkUHJvZHVjdHMubWFwKHByb2R1Y3QgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgLy8gS2nhu4NtIHRyYSB4ZW0gcHJvZHVjdCBjw7MgaOG7o3AgbOG7hyBraMO0bmdcbiAgICAgICAgICAgICAgaWYgKCFwcm9kdWN0IHx8IHR5cGVvZiBwcm9kdWN0ICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQuG7jyBxdWEgc+G6o24gcGjhuqltIGtow7RuZyBo4bujcCBs4buHOlwiLCBwcm9kdWN0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBtYXRjaFNjb3JlOiAtMSB9OyAvLyBT4bq9IGLhu4sgbG/huqFpIGLhu48ga2hpIHPhuq9wIHjhur9wXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIC8vIENodXnhu4NuIMSR4buVaSBhbiB0b8OgbiB0aMOgbmggcGxhaW4gb2JqZWN0XG4gICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RPYmogPSBwcm9kdWN0LnRvT2JqZWN0ID8gcHJvZHVjdC50b09iamVjdCgpIDogcHJvZHVjdDtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIC8vIMSQ4bqjbSBi4bqjbyBjw6FjIHRyxrDhu51uZyB2xINuIGLhuqNuIHThu5NuIHThuqFpXG4gICAgICAgICAgICAgIGNvbnN0IG5hbWVUZXh0ID0gKHByb2R1Y3RPYmoucHJvZHVjdE5hbWUgfHwgJycpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgIGNvbnN0IGRlc2NUZXh0ID0gKHByb2R1Y3RPYmouZGVzY3JpcHRpb24gfHwgJycpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAvLyBUw61uaCDEkWnhu4NtIGThu7FhIHRyw6puIHPhu5EgdOG7qyBraMOzYSBraOG7m3BcbiAgICAgICAgICAgICAgbGV0IHNjb3JlID0gMDtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIC8vIE7hur91IGPDsyBj4bulbSB04burIGPhu6UgdGjhu4MsIGNobyDEkWnhu4NtIGNhbyBoxqFuXG4gICAgICAgICAgICAgIGZvciAoY29uc3QgeyBwaHJhc2UgfSBvZiBzcGVjaWZpY1BocmFzZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAobmFtZVRleHQuaW5jbHVkZXMocGhyYXNlKSkgc2NvcmUgKz0gNTtcbiAgICAgICAgICAgICAgICBpZiAoZGVzY1RleHQuaW5jbHVkZXMocGhyYXNlKSkgc2NvcmUgKz0gMztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgLy8gVMOtbmggxJFp4buDbSBjaG8gdOG7q25nIHThu6sga2jDs2FcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBrZXl3b3JkIG9mIGtleXdvcmRzKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5hbWVUZXh0LmluY2x1ZGVzKGtleXdvcmQpKSBzY29yZSArPSAyO1xuICAgICAgICAgICAgICAgIGlmIChkZXNjVGV4dC5pbmNsdWRlcyhrZXl3b3JkKSkgc2NvcmUgKz0gMTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgLy8gTuG6v3Uga2jhu5twIGNow61uaCB4w6FjIHbhu5tpIGPhu6VtIHThu6sgdMOsbSBraeG6v20sIGNobyDEkWnhu4NtIGNhbyBuaOG6pXRcbiAgICAgICAgICAgICAgY29uc3QgZXhhY3RQaHJhc2UgPSBrZXl3b3Jkcy5qb2luKCcgJyk7XG4gICAgICAgICAgICAgIGlmIChleGFjdFBocmFzZS5sZW5ndGggPiAzICYmIG5hbWVUZXh0LmluY2x1ZGVzKGV4YWN0UGhyYXNlKSkge1xuICAgICAgICAgICAgICAgIHNjb3JlICs9IDEwO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgLi4ucHJvZHVjdE9iaixcbiAgICAgICAgICAgICAgICBtYXRjaFNjb3JlOiBzY29yZVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSB0w61uaCDEkWnhu4NtIGNobyBz4bqjbiBwaOG6qW06XCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHsgbWF0Y2hTY29yZTogLTEgfTsgLy8gU+G6vSBi4buLIGxv4bqhaSBi4buPIGtoaSBz4bqvcCB44bq/cFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pLmZpbHRlcihwcm9kdWN0ID0+IHByb2R1Y3QubWF0Y2hTY29yZSA+IC0xKTsgLy8gTG/huqFpIGLhu48gY8OhYyBz4bqjbiBwaOG6qW0ga2jDtG5nIGjhu6NwIGzhu4dcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBT4bqvcCB44bq/cCB0aGVvIMSRaeG7g20gY2FvIG5o4bqldCB0csaw4bubY1xuICAgICAgICAgIHByb2R1Y3RzLnNvcnQoKGEsIGIpID0+IGIubWF0Y2hTY29yZSAtIGEubWF0Y2hTY29yZSk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gR2nhu5tpIGjhuqFuIGvhur90IHF14bqjXG4gICAgICAgICAgcHJvZHVjdHMgPSBwcm9kdWN0cy5zbGljZSgwLCAxMCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE7hur91IGtow7RuZyBjw7MgZmlsdGVyIGPhu6UgdGjhu4MsIGzhuqV5IHPhuqNuIHBo4bqpbSBt4bubaSBuaOG6pXRcbiAgICAgICAgcHJvZHVjdHMgPSBhd2FpdCBQcm9kdWN0LmZpbmQoKS5zb3J0KHsgY3JlYXRlZEF0OiAtMSB9KS5saW1pdCgxMCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGNvbnNvbGUubG9nKGBUw6xtIHRo4bqleSAke3Byb2R1Y3RzLmxlbmd0aH0gc+G6o24gcGjhuqltIHBow7kgaOG7o3BgKTtcbiAgICAgIHJldHVybiBwcm9kdWN0cztcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSB0w6xtIGtp4bq/bSBz4bqjbiBwaOG6qW0gduG7m2kgTW9uZ29EQjpcIiwgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgdMOsbSBraeG6v20gc+G6o24gcGjhuqltIHbhu5tpIE1vbmdvREI6XCIsIGVycm9yKTtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufTtcblxuLyoqXG4gKiBQaMOhdCBoaeG7h24gaW50ZW50IHThu6sgdGluIG5o4bqvblxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBUaW4gbmjhuq9uIHThu6sgbmfGsOG7nWkgZMO5bmdcbiAqIEByZXR1cm5zIHtzdHJpbmd9IC0gSW50ZW50IMSRxrDhu6NjIHBow6F0IGhp4buHblxuICovXG5jb25zdCBkZXRlY3RJbnRlbnQgPSAobWVzc2FnZSkgPT4ge1xuICBjb25zdCBsb3dlck1lc3NhZ2UgPSBtZXNzYWdlLnRvTG93ZXJDYXNlKCk7XG4gIC8vIEtp4buDbSB0cmEgeGVtIGPDsyBwaOG6o2kgbMOgIGPDonUgaOG7j2kgRkFRIGtow7RuZ1xuICBjb25zdCBmYXFJbnRlbnQgPSBkZXRlY3RGQVFJbnRlbnQobG93ZXJNZXNzYWdlKTtcbiAgaWYgKGZhcUludGVudCkge1xuICAgIHJldHVybiBmYXFJbnRlbnQ7XG4gIH1cbiAgLy8gVGjDqm0gbmjhuq1uIGRp4buHbiBpbnRlbnQgY8O0bmcgdGjhu6ljIG7huqV1IMSDblxuICBpZiAoaXNDb29raW5nUXVlc3Rpb24obG93ZXJNZXNzYWdlKSkge1xuICAgIHJldHVybiAnY29va2luZ19yZWNpcGUnO1xuICB9XG4gIC8vIE3huqt1IHjhu60gbMO9IGludGVudCDEkcahbiBnaeG6o25cbiAgaWYgKGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnY2jDoG8nKSB8fCBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ2hlbGxvJykgfHwgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdoaScpKSB7XG4gICAgcmV0dXJuICdncmVldGluZyc7XG4gIH1cbiAgaWYgKGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnZ2nDoScpIHx8IGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnYmFvIG5oacOqdScpKSB7XG4gICAgcmV0dXJuICdwcmljZSc7XG4gIH1cbiAgaWYgKGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnc+G6o24gcGjhuqltJykgfHwgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdtdWEnKSB8fCBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ2jDoG5nJykpIHtcbiAgICByZXR1cm4gJ3Byb2R1Y3QnO1xuICB9XG4gIC8vIFRy4bqjIHbhu4EgaW50ZW50IG3hurdjIMSR4buLbmggbuG6v3Uga2jDtG5nIG5o4bqtbiBkaeG7h24gxJHGsOG7o2NcbiAgcmV0dXJuICd1bmtub3duJztcbn07XG5cbi8qKlxuICogUGjDoXQgaGnhu4duIGludGVudCBsacOqbiBxdWFuIMSR4bq/biBGQVFcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIC0gVGluIG5o4bqvbiB04burIG5nxrDhu51pIGTDuW5nIMSRw6MgbG93ZXJjYXNlXG4gKiBAcmV0dXJucyB7c3RyaW5nfG51bGx9IC0gSW50ZW50IEZBUSBob+G6t2MgbnVsbCBu4bq/dSBraMO0bmcgcGjDoXQgaGnhu4duXG4gKi9cbmNvbnN0IGRldGVjdEZBUUludGVudCA9IChtZXNzYWdlKSA9PiB7XG4gIC8vIE11YSBow6BuZ1xuICBpZiAobWVzc2FnZS5pbmNsdWRlcygnbMOgbSBzYW8gxJHhu4MgbXVhJykgfHwgXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdtdWEgaMOgbmcgbmjGsCB0aOG6vyBuw6BvJykgfHwgXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdjw6FjaCBtdWEnKSB8fCBcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ211YSBow6BuZycpIHx8XG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdtdWEgbmjGsCB0aOG6vyBuw6BvJykgfHxcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ2PDoWNoIHRo4bupYyBtdWEnKSkge1xuICAgIHJldHVybiAnZmFxX2hvd190b19idXknO1xuICB9XG4gIFxuICAvLyDEkOG6t3QgaMOgbmdcbiAgaWYgKG1lc3NhZ2UuaW5jbHVkZXMoJ8SR4bq3dCBow6BuZycpIHx8IFxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygnY8OhY2ggxJHhurd0JykgfHwgXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCfEkeG6t3QgbXVhJykgfHxcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ8SR4bq3dCBuaMawIHRo4bq/IG7DoG8nKSkge1xuICAgIHJldHVybiAnZmFxX2hvd190b19vcmRlcic7XG4gIH1cbiAgXG4gIC8vIFRoYW5oIHRvw6FuXG4gIGlmIChtZXNzYWdlLmluY2x1ZGVzKCd0aGFuaCB0b8OhbicpIHx8IFxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygncGjGsMahbmcgdGjhu6ljIHRoYW5oIHRvw6FuJykgfHwgXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdjw6FjaCB0aGFuaCB0b8OhbicpIHx8XG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdow6xuaCB0aOG7qWMgdGhhbmggdG/DoW4nKSB8fFxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygndHLhuqMgdGnhu4FuJykgfHxcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ2JhbyBuaGnDqnUgaMOsbmggdGjhu6ljIHRoYW5oIHRvw6FuJykpIHtcbiAgICByZXR1cm4gJ2ZhcV9wYXltZW50X21ldGhvZHMnO1xuICB9XG4gIFxuICAvLyDEkOG7i2EgY2jhu4kgY+G7rWEgaMOgbmdcbiAgaWYgKG1lc3NhZ2UuaW5jbHVkZXMoJ8SR4buLYSBjaOG7iScpIHx8IFxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygnY+G7rWEgaMOgbmcg4bufIMSRw6J1JykgfHwgXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdzaG9wIOG7nyDEkcOidScpIHx8XG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCd24buLIHRyw60nKSB8fFxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygnxJHhu4thIMSRaeG7g20nKSkge1xuICAgIHJldHVybiAnZmFxX3N0b3JlX2xvY2F0aW9uJztcbiAgfVxuICBcbiAgLy8gQ2jhuqV0IGzGsOG7o25nIHPhuqNuIHBo4bqpbVxuICBpZiAobWVzc2FnZS5pbmNsdWRlcygnY2jhuqV0IGzGsOG7o25nJykgfHwgXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdz4bqjbiBwaOG6qW0gY8OzIHThu5F0JykgfHwgXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdjw7MgxJHhuqNtIGLhuqNvJykgfHxcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ2jDoG5nIGPDsyB04buRdCcpIHx8XG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdz4bqjbiBwaOG6qW0gdOG7kXQga2jDtG5nJykpIHtcbiAgICByZXR1cm4gJ2ZhcV9wcm9kdWN0X3F1YWxpdHknO1xuICB9XG4gIFxuICAvLyBUaOG7nWkgZ2lhbiBnaWFvIGjDoG5nXG4gIGlmIChtZXNzYWdlLmluY2x1ZGVzKCdnaWFvIGjDoG5nJykgfHwgXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdzaGlwJykgfHwgXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCd24bqtbiBjaHV54buDbicpIHx8XG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCd0aOG7nWkgZ2lhbiBnaWFvJykgfHxcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ2dpYW8gdHJvbmcgYmFvIGzDonUnKSB8fFxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygnbeG6pXQgYmFvIGzDonUgxJHhu4Mgbmjhuq1uJykpIHtcbiAgICByZXR1cm4gJ2ZhcV9zaGlwcGluZ190aW1lJztcbiAgfVxuICBcbiAgLy8gQ2jDrW5oIHPDoWNoIMSR4buVaSB0cuG6o1xuICBpZiAobWVzc2FnZS5pbmNsdWRlcygnxJHhu5VpIHRy4bqjJykgfHwgXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdob8OgbiB0aeG7gW4nKSB8fCBcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ3Ry4bqjIGzhuqFpJykgfHxcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ8SR4buVaSBow6BuZycpIHx8XG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdi4buLIGzhu5dpJykgfHxcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ2tow7RuZyBow6BpIGzDsm5nJykpIHtcbiAgICByZXR1cm4gJ2ZhcV9yZXR1cm5fcG9saWN5JztcbiAgfVxuICBcbiAgLy8gS2h1eeG6v24gbcOjaSBoaeG7h24gY8OzXG4gIGlmIChtZXNzYWdlLmluY2x1ZGVzKCdraHV54bq/biBtw6NpJykgfHwgXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdnaeG6o20gZ2nDoScpIHx8IFxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygnxrB1IMSRw6NpJykgfHxcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ2PDsyBtw6MgZ2nhuqNtJykgfHxcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ8SRYW5nIGdp4bqjbSBnacOhJykpIHtcbiAgICByZXR1cm4gJ2ZhcV9wcm9tb3Rpb25zJztcbiAgfVxuICBcbiAgLy8gU+G6o24gcGjhuqltIG3hu5tpL2LDoW4gY2jhuqF5XG4gIGlmIChtZXNzYWdlLmluY2x1ZGVzKCdz4bqjbiBwaOG6qW0gbeG7m2knKSB8fCBcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ23hu5tpIHJhIG3huq90JykgfHwgXG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdiw6FuIGNo4bqheSBuaOG6pXQnKSB8fFxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygncGjhu5UgYmnhur9uIG5o4bqldCcpIHx8XG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdob3QgbmjhuqV0JykgfHxcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ3h1IGjGsOG7m25nJykpIHtcbiAgICByZXR1cm4gJ2ZhcV90cmVuZGluZ19wcm9kdWN0cyc7XG4gIH1cbiAgXG4gIC8vIFBow60gduG6rW4gY2h1eeG7g25cbiAgaWYgKG1lc3NhZ2UuaW5jbHVkZXMoJ3Bow60gduG6rW4gY2h1eeG7g24nKSB8fCBcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ3Bow60gc2hpcCcpIHx8IFxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygncGjDrSBnaWFvIGjDoG5nJykgfHxcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ3NoaXAgYmFvIG5oacOqdSB0aeG7gW4nKSB8fFxuICAgICAgbWVzc2FnZS5pbmNsdWRlcygndOG7kW4gYmFvIG5oacOqdSB0aeG7gW4gZ2lhbyBow6BuZycpKSB7XG4gICAgcmV0dXJuICdmYXFfc2hpcHBpbmdfZmVlJztcbiAgfVxuICBcbiAgLy8gSOG7lyB0cuG7oyBraMOhY2ggaMOgbmdcbiAgaWYgKG1lc3NhZ2UuaW5jbHVkZXMoJ2jhu5cgdHLhu6MnKSB8fCBcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ2xpw6puIGjhu4cnKSB8fCBcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ3TGsCB24bqlbicpIHx8XG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKCdob3RsaW5lJykgfHxcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ3Phu5EgxJFp4buHbiB0aG/huqFpJykgfHxcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoJ2VtYWlsJykpIHtcbiAgICByZXR1cm4gJ2ZhcV9jdXN0b21lcl9zdXBwb3J0JztcbiAgfVxuICBcbiAgcmV0dXJuIG51bGw7XG59O1xuXG4vKipcbiAqIEtp4buDbSB0cmEgeGVtIGPDonUgaOG7j2kgY8OzIHBo4bulIHRodeG7mWMgdsOgbyBuZ+G7ryBj4bqjbmggc+G6o24gcGjhuqltIGtow7RuZ1xuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBDw6J1IGjhu49pIGPhu6dhIG5nxrDhu51pIGTDuW5nXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSBDw7MgcGjhu6UgdGh14buZYyB2w6BvIG5n4buvIGPhuqNuaCBz4bqjbiBwaOG6qW0gaGF5IGtow7RuZ1xuICovXG5jb25zdCBjaGVja0NvbnRleHREZXBlbmRlbnRRdWVyeSA9IChtZXNzYWdlKSA9PiB7XG4gIGNvbnN0IGxvd2VyTWVzc2FnZSA9IG1lc3NhZ2UudG9Mb3dlckNhc2UoKTtcbiAgXG4gIC8vIE7hur91IGzDoCBjw6J1IGjhu49pIHbhu4EgbcOzbiDEg24vY8O0bmcgdGjhu6ljIHRow6wgS0jDlE5HIHBo4bulIHRodeG7mWMgbmfhu68gY+G6o25oIHPhuqNuIHBo4bqpbVxuICBpZiAoaXNDb29raW5nUXVlc3Rpb24obG93ZXJNZXNzYWdlKSkgcmV0dXJuIGZhbHNlO1xuICBcbiAgLy8gS2nhu4NtIHRyYSB4ZW0gY8OzIHBo4bqjaSBsw6AgY8OidSB0w6xtIGtp4bq/bSBt4bubaSBraMO0bmdcbiAgLy8gTuG6v3UgbMOgIHTDrG0ga2nhur9tIG3hu5tpIHRow6wga2jDtG5nIHBo4bulIHRodeG7mWMgbmfhu68gY+G6o25oXG4gIGlmIChsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ3TDrG0nKSB8fCBcbiAgICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygna2nhur9tJykgfHwgXG4gICAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ2PDsyBz4bqjbiBwaOG6qW0nKSB8fCBcbiAgICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnZMaw4bubaScpIHx8XG4gICAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ3Ryw6puJykgfHxcbiAgICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygna2hv4bqjbmcgZ2nDoScpIHx8XG4gICAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ2sgJykgfHwgXG4gICAgICBsb3dlck1lc3NhZ2UubWF0Y2goL1xcZCtrLykpIHtcbiAgICBjb25zb2xlLmxvZyhcIsSQw6J5IGzDoCBjw6J1IGjhu49pIHTDrG0ga2nhur9tIG3hu5tpLCBraMO0bmcgcGjhu6UgdGh14buZYyBuZ+G7ryBj4bqjbmhcIik7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICAvLyBDw6FjIG3huqt1IGPDonUgaOG7j2kgcGjhu6UgdGh14buZYyBuZ+G7ryBj4bqjbmhcbiAgY29uc3QgY29udGV4dFBhdHRlcm5zID0gW1xuICAgIC8vIEPDonUgaOG7j2kgduG7gSBjw7RuZyBk4bulbmdcbiAgICAvY8O0bmcgZOG7pW5nL2ksIC90w6FjIGThu6VuZy9pLCAvZMO5bmcgxJHhu4MgbMOgbSBnw6wvaSwgL2TDuW5nIMSR4buDL2ksIC9kw7luZyBuaMawIHRo4bq/IG7DoG8vaSwgL3Phu60gZOG7pW5nL2ksIC9jw6FjaCBkw7luZy9pLFxuICAgIC8vIEPDonUgaOG7j2kgduG7gSBnacOhXG4gICAgL2dpw6EgYmFvIG5oacOqdS9pLCAvYmFvIG5oacOqdSB0aeG7gW4vaSwgL2dpw6EvaSwgL2JhbyBuaGnDqnUvaSxcbiAgICAvLyBDw6J1IGjhu49pIHbhu4EgeHXhuqV0IHjhu6ksIHRow6BuaCBwaOG6p25cbiAgICAveHXhuqV0IHjhu6kvaSwgL3PhuqNuIHh14bqldC9pLCAvdGjDoG5oIHBo4bqnbi9pLCAvbmd1ecOqbiBsaeG7h3UvaSwgL2PDsyBjaOG7qWEvaSwgL2LhuqNvIHF14bqjbi9pLFxuICAgIC8vIEPDonUgaOG7j2kgduG7gSBnaeG7m2kgdGhp4buHdVxuICAgIC9naeG7m2kgdGhp4buHdS9pLCAvbsOzaSB24buBL2ksIC90aMO0bmcgdGluIHbhu4EvaSwgL23DtCB04bqjL2ksXG4gICAgLy8gxJDhuqFpIHThu6sgY2jhu4kgxJHhu4tuaCBraMO0bmcgcsO1IHLDoG5nXG4gICAgL3PhuqNuIHBo4bqpbSBuw6B5L2ksIC9uw7MvaSwgL2PDoWkgbsOgeS9pLCAvbcOzbiBuw6B5L2ksIC9ow6BuZyBuw6B5L2ksXG4gICAgLy8gU+G6o24gcGjhuqltIGxpw6puIHF1YW5cbiAgICAvc+G6o24gcGjhuqltIGxpw6puIHF1YW4vaSwgL2xpw6puIHF1YW4vaSwgL3TGsMahbmcgdOG7sS9pLCAvZ2nhu5FuZy9pLCAvc+G6o24gcGjhuqltIGtow6FjL2ksXG4gICAgLy8gQ8OidSBo4buPaSBtxqEgaOG7kyBraMOhYyBtw6Aga2jDtG5nIMSR4buBIGPhuq1wIHPhuqNuIHBo4bqpbSBj4bulIHRo4buDXG4gICAgL2jhuqFuIHPhu60gZOG7pW5nL2ksIC9i4bqjbyBow6BuaC9pLCAvY2jhuqV0IGzGsOG7o25nL2ksIC/EkcOhbmggZ2nDoS9pLCAvcmV2aWV3L2lcbiAgXTtcbiAgXG4gIHJldHVybiBjb250ZXh0UGF0dGVybnMuc29tZShwYXR0ZXJuID0+IHBhdHRlcm4udGVzdChsb3dlck1lc3NhZ2UpKTtcbn07XG5cbi8qKlxuICogS2nhu4NtIHRyYSBjw6J1IGjhu49pIHbhu4Egdmnhu4djIGPDsyBz4bqjbiBwaOG6qW0gbsOgbyDEkcOzIGtow7RuZ1xuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBDw6J1IGjhu49pIGPhu6dhIG5nxrDhu51pIGTDuW5nXG4gKiBAcmV0dXJucyB7c3RyaW5nfG51bGx9IC0gVMOqbiBz4bqjbiBwaOG6qW0gxJHGsOG7o2MgdHLDrWNoIHh14bqldCBob+G6t2MgbnVsbCBu4bq/dSBraMO0bmcgcGjhuqNpXG4gKi9cbmNvbnN0IGNoZWNrUHJvZHVjdEF2YWlsYWJpbGl0eVF1ZXN0aW9uID0gKG1lc3NhZ2UpID0+IHtcbiAgY29uc3QgbG93ZXJNZXNzYWdlID0gbWVzc2FnZS50b0xvd2VyQ2FzZSgpO1xuICBcbiAgLy8gTeG6q3UgY8OidSBo4buPaSBcIkPDsyBz4bqjbiBwaOG6qW0gWCBraMO0bmdcIlxuICBjb25zdCBwcm9kdWN0QXZhaWxhYmlsaXR5UGF0dGVybnMgPSBbXG4gICAgL2PDsyAoYsOhbiB8Y3VuZyBj4bqlcCB8c+G6o24gcGjhuqltIHxow6BuZyB8KT8oW2EtekEtWjAtOcOALeG7uVxcc10rPykgKGtow7RuZ3xrb3xrfGhvbmd8aMO0bmcpKFxcPyk/JC9pLFxuICAgIC9zaG9wIChjw7MgfGLDoW4gfGN1bmcgY+G6pXAgfCkoW2EtekEtWjAtOcOALeG7uVxcc10rPykgKGtow7RuZ3xrb3xrfGhvbmd8aMO0bmcpKFxcPyk/JC9pLFxuICAgIC9j4butYSBow6BuZyAoY8OzIHxiw6FuIHxjdW5nIGPhuqVwIHwpKFthLXpBLVowLTnDgC3hu7lcXHNdKz8pIChraMO0bmd8a298a3xob25nfGjDtG5nKShcXD8pPyQvaVxuICBdO1xuICBcbiAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHByb2R1Y3RBdmFpbGFiaWxpdHlQYXR0ZXJucykge1xuICAgIGNvbnN0IG1hdGNoID0gbG93ZXJNZXNzYWdlLm1hdGNoKHBhdHRlcm4pO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgY29uc3QgcHJvZHVjdE5hbWUgPSBtYXRjaFsyXS50cmltKCk7XG4gICAgICAvLyBMb+G6oWkgYuG7jyBjw6FjIHThu6sga2jDtG5nIGPhuqduIHRoaeG6v3RcbiAgICAgIGNvbnN0IHN0b3BXb3JkcyA9IFsnc+G6o24gcGjhuqltJywgJ2jDoG5nJywgJ2PDoWknLCAnbcOzbicsICfEkeG7kyddO1xuICAgICAgbGV0IGNsZWFuUHJvZHVjdE5hbWUgPSBwcm9kdWN0TmFtZTtcbiAgICAgIFxuICAgICAgZm9yIChjb25zdCB3b3JkIG9mIHN0b3BXb3Jkcykge1xuICAgICAgICBpZiAoY2xlYW5Qcm9kdWN0TmFtZS5zdGFydHNXaXRoKHdvcmQgKyAnICcpKSB7XG4gICAgICAgICAgY2xlYW5Qcm9kdWN0TmFtZSA9IGNsZWFuUHJvZHVjdE5hbWUuc3Vic3RyaW5nKHdvcmQubGVuZ3RoKS50cmltKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgcmV0dXJuIGNsZWFuUHJvZHVjdE5hbWU7XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4gbnVsbDtcbn07XG5cbi8qKlxuICogVOG6oW8gY8OidSB0cuG6oyBs4budaSBk4buxYSB0csOqbiBuZ+G7ryBj4bqjbmggc+G6o24gcGjhuqltXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSAtIEPDonUgaOG7j2kgY+G7p2EgbmfGsOG7nWkgZMO5bmdcbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9kdWN0IC0gVGjDtG5nIHRpbiBz4bqjbiBwaOG6qW1cbiAqIEByZXR1cm5zIHtvYmplY3R8bnVsbH0gLSBDw6J1IHRy4bqjIGzhu51pIGhv4bq3YyBudWxsIG7hur91IGtow7RuZyB0aOG7gyB0cuG6oyBs4budaVxuICovXG5jb25zdCBnZW5lcmF0ZUNvbnRleHRSZXNwb25zZSA9IChtZXNzYWdlLCBwcm9kdWN0KSA9PiB7XG4gIGNvbnN0IGxvd2VyTWVzc2FnZSA9IG1lc3NhZ2UudG9Mb3dlckNhc2UoKTtcbiAgXG4gIC8vIEtp4buDbSB0cmEgbOG6oWkgbOG6p24gbuG7r2EgcHJvZHVjdCBjw7MgdOG7k24gdOG6oWkga2jDtG5nXG4gIGlmICghcHJvZHVjdCkgcmV0dXJuIG51bGw7XG4gIFxuICAvLyBU4bqhbyBjw6J1IHRy4bqjIGzhu51pIGThu7FhIHbDoG8gbG/huqFpIGPDonUgaOG7j2lcbiAgbGV0IHJlc3BvbnNlTWVzc2FnZSA9ICcnO1xuICBcbiAgLy8gQ8OidSBo4buPaSB24buBIGPDtG5nIGThu6VuZ1xuICBpZiAoL2PDtG5nIGThu6VuZ3x0w6FjIGThu6VuZ3xkw7luZyDEkeG7gyBsw6BtIGfDrHxkw7luZyDEkeG7g3xkw7luZyBuaMawIHRo4bq/IG7DoG98c+G7rSBk4bulbmd8Y8OhY2ggZMO5bmcvLnRlc3QobG93ZXJNZXNzYWdlKSkge1xuICAgIHJlc3BvbnNlTWVzc2FnZSA9IHByb2R1Y3QucHJvZHVjdERldGFpbHNcbiAgICAgID8gYCR7cHJvZHVjdC5wcm9kdWN0TmFtZX0gJHtwcm9kdWN0LnByb2R1Y3REZXRhaWxzfWBcbiAgICAgIDogYCR7cHJvZHVjdC5wcm9kdWN0TmFtZX0gbMOgIHPhuqNuIHBo4bqpbSAke3Byb2R1Y3QucHJvZHVjdENhdGVnb3J5IHx8IHByb2R1Y3QuY2F0ZWdvcnl9LiBWdWkgbMOybmcgeGVtIGNoaSB0aeG6v3Qgc+G6o24gcGjhuqltIMSR4buDIGJp4bq/dCB0aMOqbSB24buBIGPDtG5nIGThu6VuZy5gO1xuICB9XG4gIC8vIEPDonUgaOG7j2kgduG7gSBnaeG7m2kgdGhp4buHdVxuICBlbHNlIGlmICgvZ2nhu5tpIHRoaeG7h3V8bsOzaSB24buBfHRow7RuZyB0aW4gduG7gXxtw7QgdOG6o3xz4bqjbiBwaOG6qW0gbsOgeXx0aOG6vyBuw6BvLy50ZXN0KGxvd2VyTWVzc2FnZSkpIHtcbiAgICByZXNwb25zZU1lc3NhZ2UgPSBwcm9kdWN0LnByb2R1Y3RJbnRyb2R1Y3Rpb25cbiAgICAgID8gYEdp4bubaSB0aGnhu4d1IHbhu4EgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfTogJHtwcm9kdWN0LnByb2R1Y3RJbnRyb2R1Y3Rpb259YFxuICAgICAgOiBgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfSBsw6Agc+G6o24gcGjhuqltICR7cHJvZHVjdC5wcm9kdWN0Q2F0ZWdvcnkgfHwgcHJvZHVjdC5jYXRlZ29yeX0uIEhp4buHbiBjaMawYSBjw7MgdGjDtG5nIHRpbiBnaeG7m2kgdGhp4buHdSBjaGkgdGnhur90IHbhu4Egc+G6o24gcGjhuqltIG7DoHkuYDtcbiAgfVxuICAvLyBDw6J1IGjhu49pIHbhu4EgZ2nDoVxuICBlbHNlIGlmICgvZ2nDoSBiYW8gbmhpw6p1fGJhbyBuaGnDqnUgdGnhu4FufGdpw6F8YmFvIG5oacOqdS8udGVzdChsb3dlck1lc3NhZ2UpKSB7XG4gICAgY29uc3Qgb3JpZ2luYWxQcmljZSA9IHByb2R1Y3QucHJvZHVjdFByaWNlIHx8IHByb2R1Y3QucHJpY2UgfHwgMDtcbiAgICBjb25zdCBkaXNjb3VudCA9IHByb2R1Y3QucHJvZHVjdERpc2NvdW50IHx8IDA7XG4gICAgY29uc3QgcHJvbW9QcmljZSA9IHByb2R1Y3QucHJvZHVjdFByb21vUHJpY2UgfHwgKGRpc2NvdW50ID4gMCA/IE1hdGgucm91bmQob3JpZ2luYWxQcmljZSAqICgxIC0gZGlzY291bnQvMTAwKSkgOiBvcmlnaW5hbFByaWNlKTtcbiAgXG4gICAgaWYgKGRpc2NvdW50ID4gMCkge1xuICAgICAgcmVzcG9uc2VNZXNzYWdlID0gYEdpw6EgY+G7p2EgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfSBsw6AgJHtmb3JtYXRDdXJyZW5jeShwcm9tb1ByaWNlKX0gKMSQw6MgZ2nhuqNtICR7ZGlzY291bnR9JSB04burICR7Zm9ybWF0Q3VycmVuY3kob3JpZ2luYWxQcmljZSl9KS5gO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXNwb25zZU1lc3NhZ2UgPSBgR2nDoSBj4bunYSAke3Byb2R1Y3QucHJvZHVjdE5hbWV9IGzDoCAke2Zvcm1hdEN1cnJlbmN5KG9yaWdpbmFsUHJpY2UpfS5gO1xuICAgIH1cbiAgfVxuICAvLyBDw6J1IGjhu49pIHbhu4EgeHXhuqV0IHjhu6ksIHRow6BuaCBwaOG6p25cbiAgZWxzZSBpZiAoL3h14bqldCB44bupfHPhuqNuIHh14bqldHx0aMOgbmggcGjhuqdufG5ndXnDqm4gbGnhu4d1fGPDsyBjaOG7qWF8YuG6o28gcXXhuqNuLy50ZXN0KGxvd2VyTWVzc2FnZSkpIHtcbiAgICByZXNwb25zZU1lc3NhZ2UgPSBwcm9kdWN0LnByb2R1Y3RPcmlnaW4gfHwgcHJvZHVjdC5vcmlnaW5cbiAgICAgID8gYCR7cHJvZHVjdC5wcm9kdWN0TmFtZX0gY8OzIHh14bqldCB44bupIHThu6sgJHtwcm9kdWN0LnByb2R1Y3RPcmlnaW4gfHwgcHJvZHVjdC5vcmlnaW59LmBcbiAgICAgIDogYFRow7RuZyB0aW4gY2hpIHRp4bq/dCB24buBIHh14bqldCB44bupIHbDoCB0aMOgbmggcGjhuqduIGPhu6dhICR7cHJvZHVjdC5wcm9kdWN0TmFtZX0gxJHGsOG7o2MgZ2hpIHLDtSB0csOqbiBiYW8gYsOsIHPhuqNuIHBo4bqpbS5gO1xuICAgIFxuICAgIC8vIFRow6ptIHRow7RuZyB0aW4gdGjGsMahbmcgaGnhu4d1IG7hur91IGPDs1xuICAgIGlmIChwcm9kdWN0LnByb2R1Y3RCcmFuZCkge1xuICAgICAgcmVzcG9uc2VNZXNzYWdlICs9IGAgU+G6o24gcGjhuqltIHRodeG7mWMgdGjGsMahbmcgaGnhu4d1ICR7cHJvZHVjdC5wcm9kdWN0QnJhbmR9LmA7XG4gICAgfVxuICB9XG4gIC8vIEPDonUgaOG7j2kgduG7gSBo4bqhbiBz4butIGThu6VuZ1xuICBlbHNlIGlmICgvaOG6oW4gc+G7rSBk4bulbmd8YuG6o28gaMOgbmh8Y2jhuqV0IGzGsOG7o25nLy50ZXN0KGxvd2VyTWVzc2FnZSkpIHtcbiAgICByZXNwb25zZU1lc3NhZ2UgPSBwcm9kdWN0LmV4cGlyeURhdGVcbiAgICAgID8gYCR7cHJvZHVjdC5wcm9kdWN0TmFtZX0gY8OzIGjhuqFuIHPhu60gZOG7pW5nIMSR4bq/biAke3Byb2R1Y3QuZXhwaXJ5RGF0ZX0uYFxuICAgICAgOiBgVGjDtG5nIHRpbiB24buBIGjhuqFuIHPhu60gZOG7pW5nIGPhu6dhICR7cHJvZHVjdC5wcm9kdWN0TmFtZX0gxJHGsOG7o2MgZ2hpIHLDtSB0csOqbiBiYW8gYsOsIHPhuqNuIHBo4bqpbS5gO1xuICB9XG4gIC8vIEPDoWMgY8OidSBo4buPaSBjaHVuZ1xuICBlbHNlIHtcbiAgICBjb25zdCBwcmljZSA9IHByb2R1Y3QucHJvZHVjdFByaWNlIHx8IHByb2R1Y3QucHJpY2UgfHwgMDtcbiAgICByZXNwb25zZU1lc3NhZ2UgPSBgU+G6o24gcGjhuqltICR7cHJvZHVjdC5wcm9kdWN0TmFtZX0gdGh14buZYyBkYW5oIG3hu6VjICR7cHJvZHVjdC5wcm9kdWN0Q2F0ZWdvcnkgfHwgcHJvZHVjdC5jYXRlZ29yeX0gduG7m2kgZ2nDoSAke2Zvcm1hdEN1cnJlbmN5KHByaWNlKX0uIELhuqFuIG114buRbiBiaeG6v3QgdGjDqm0gdGjDtG5nIHRpbiBnw6wgduG7gSBz4bqjbiBwaOG6qW0gbsOgeT9gO1xuICB9XG4gIFxuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgdHlwZTogJ3RleHQnLFxuICAgIG1lc3NhZ2U6IHJlc3BvbnNlTWVzc2FnZSxcbiAgICBwcm9kdWN0OiBwcm9kdWN0IC8vIFRy4bqjIHbhu4EgdGjDtG5nIHRpbiBz4bqjbiBwaOG6qW0gxJHhu4MgaGnhu4NuIHRo4buLIG7hur91IGPhuqduXG4gIH07XG59O1xuXG4vKipcbiAqIMSQ4buLbmggZOG6oW5nIHPhu5EgdGnhu4FuIHNhbmcgVk5EXG4gKiBAcGFyYW0ge251bWJlcn0gYW1vdW50IC0gU+G7kSB0aeG7gW5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IC0gQ2h14buXaSB0aeG7gW4gxJHDoyDEkeG7i25oIGThuqFuZ1xuICovXG5jb25zdCBmb3JtYXRDdXJyZW5jeSA9IChhbW91bnQpID0+IHtcbiAgLy8gxJDhuqNtIGLhuqNvIGFtb3VudCBsw6Agc+G7kVxuICBjb25zdCB2YWxpZEFtb3VudCA9IE51bWJlcihhbW91bnQpIHx8IDA7XG4gIFxuICByZXR1cm4gbmV3IEludGwuTnVtYmVyRm9ybWF0KCd2aS1WTicsIHsgXG4gICAgc3R5bGU6ICdjdXJyZW5jeScsIFxuICAgIGN1cnJlbmN5OiAnVk5EJyxcbiAgICBtYXhpbXVtRnJhY3Rpb25EaWdpdHM6IDBcbiAgfSkuZm9ybWF0KHZhbGlkQW1vdW50KTtcbn07XG5cbi8vIFRow6ptIGjDoG0gbmjhuq1uIGRp4buHbiBjw6J1IGjhu49pIHbhu4EgbcOzbiDEg24vY8O0bmcgdGjhu6ljXG5jb25zdCBpc0Nvb2tpbmdRdWVzdGlvbiA9IChtZXNzYWdlKSA9PiB7XG4gIGNvbnN0IGNvb2tpbmdLZXl3b3JkcyA9IFtcIm7huqV1XCIsIFwiY8O0bmcgdGjhu6ljXCIsIFwibmd1ecOqbiBsaeG7h3VcIiwgXCJjw6FjaCBsw6BtXCJdO1xuICByZXR1cm4gY29va2luZ0tleXdvcmRzLnNvbWUoa3cgPT4gbWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGt3KSk7XG59O1xuXG4vKipcbiAqIERldGVjdHMgaWYgdGhlIHVzZXIgaXMgdHJ5aW5nIHRvIHNlYXJjaCBmb3IgbXVsdGlwbGUgcHJvZHVjdHMgaW4gb25lIG1lc3NhZ2VcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIC0gVXNlcidzIG1lc3NhZ2VcbiAqIEByZXR1cm5zIHtzdHJpbmdbXXxudWxsfSAtIEFycmF5IG9mIHByb2R1Y3QgcXVlcmllcyBvciBudWxsIGlmIG5vdCBhIG11bHRpLXByb2R1Y3Qgc2VhcmNoXG4gKi9cbmNvbnN0IGRldGVjdE11bHRpUHJvZHVjdFNlYXJjaCA9IChtZXNzYWdlKSA9PiB7XG4gIGlmICghbWVzc2FnZSkgcmV0dXJuIG51bGw7XG4gIFxuICBjb25zdCBsb3dlck1lc3NhZ2UgPSBtZXNzYWdlLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuICBcbiAgLy8gRGFuaCBzw6FjaCBjw6FjIHThu6sga2hvw6Egc+G6o24gcGjhuqltIHBo4buVIGJp4bq/biDEkeG7gyBraeG7g20gdHJhXG4gIGNvbnN0IGNvbW1vblByb2R1Y3RLZXl3b3JkcyA9IFtcbiAgICAnbsaw4bubYyBnaeG6t3QnLCAnbsaw4bubYyBy4butYScsICduxrDhu5tjIG5n4buNdCcsICduxrDhu5tjIGdp4bqjaSBraMOhdCcsICdwZXBzaScsICdjb2NhJywgXG4gICAgJ3Ro4buLdCcsICdjw6EnLCAncmF1JywgJ2Phu6cnLCAncXXhuqMnLCAnYsOhbmgnLCAna+G6uW8nLCAnbcOsJywgJ2LDum4nLCBcbiAgICAnZ2lhIHbhu4snLCAnZOG6p3UgxINuJywgJ27GsOG7m2MgbeG6r20nLCAnbsaw4bubYyB0xrDGoW5nJywgJ3Phu69hJywgJ3Ryw6AnLCAnY8OgIHBow6onXG4gIF07XG4gIFxuICAvLyBLaeG7g20gdHJhIHhlbSB0aW4gbmjhuq9uIGPDsyBjaOG7qWEgw610IG5o4bqldCAyIHThu6sga2hvw6Egc+G6o24gcGjhuqltIGtow7RuZ1xuICBsZXQgcHJvZHVjdEtleXdvcmRzRm91bmQgPSBbXTtcbiAgZm9yIChjb25zdCBrZXl3b3JkIG9mIGNvbW1vblByb2R1Y3RLZXl3b3Jkcykge1xuICAgIGlmIChsb3dlck1lc3NhZ2UuaW5jbHVkZXMoa2V5d29yZCkpIHtcbiAgICAgIHByb2R1Y3RLZXl3b3Jkc0ZvdW5kLnB1c2goa2V5d29yZCk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBO4bq/dSB0w6xtIHRo4bqleSDDrXQgbmjhuqV0IDIgdOG7qyBraG/DoSBz4bqjbiBwaOG6qW0sIGNvaSBsw6AgdMOsbSBraeG6v20gbmhp4buBdSBz4bqjbiBwaOG6qW1cbiAgY29uc3QgaGFzTXVsdGlwbGVQcm9kdWN0S2V5d29yZHMgPSBwcm9kdWN0S2V5d29yZHNGb3VuZC5sZW5ndGggPj0gMjtcbiAgXG4gIC8vIENoZWNrIGZvciBtdWx0aS1wcm9kdWN0IHNlYXJjaCBpbmRpY2F0b3JzXG4gIGNvbnN0IGhhc011bHRpU2VhcmNoSW5kaWNhdG9yID0gXG4gICAgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCduaGnhu4F1IHPhuqNuIHBo4bqpbScpIHx8IFxuICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnbmhp4buBdSBsb+G6oWknKSB8fFxuICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygndMOsbSBuaGnhu4F1JykgfHxcbiAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ2PDuW5nIGzDumMnKSB8fFxuICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnc28gc8OhbmgnKSB8fFxuICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnxJHhu5FpIGNoaeG6v3UnKSB8fFxuICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnY8OhYyBsb+G6oWknKSB8fFxuICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnY8OhYyBz4bqjbiBwaOG6qW0nKSB8fFxuICAgIGxvd2VyTWVzc2FnZS5tYXRjaCgvdMOsbS4rdsOgLisvKSAhPT0gbnVsbCB8fFxuICAgIC8vIFRow6ptIG5o4bqtbiBkaeG7h24ga2hpIHRpbiBuaOG6r24gY2jhu6lhIFwidMOsbVwiIHbDoCBk4bqldSBwaOG6qXlcbiAgICBsb3dlck1lc3NhZ2UubWF0Y2goL3TDrG0uKywuKy8pICE9PSBudWxsIHx8XG4gICAgLy8gSG/hurdjIGtoaSBjaOG7qWEgdOG7qyB0w6xtIGtp4bq/bSB2w6AgY2jhu6lhIMOtdCBuaOG6pXQgMiB04burIGtob8OhIHPhuqNuIHBo4bqpbVxuICAgIChsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ3TDrG0nKSAmJiBoYXNNdWx0aXBsZVByb2R1Y3RLZXl3b3Jkcyk7XG4gIFxuICAvLyBO4bq/dSBraMO0bmcgY8OzIGThuqV1IGhp4buHdSB0w6xtIG5oaeG7gXUgc+G6o24gcGjhuqltLCBraeG7g20gdHJhIHRow6ptIGPDoWMgdHLGsOG7nW5nIGjhu6NwIMSR4bq3YyBiaeG7h3RcbiAgaWYgKCFoYXNNdWx0aVNlYXJjaEluZGljYXRvcikge1xuICAgIC8vIEtp4buDbSB0cmEgeGVtIGPDsyBwaOG6o2kgdGluIG5o4bqvbiBjaOG7iSBsaeG7h3Qga8OqIGPDoWMgc+G6o24gcGjhuqltIGtow7RuZywgdsOtIGThu6U6IFwibsaw4bubYyBnaeG6t3Qgbsaw4bubYyBy4butYSBjaMOpblwiXG4gICAgaWYgKGhhc011bHRpcGxlUHJvZHVjdEtleXdvcmRzKSB7XG4gICAgICAvLyBO4bq/dSBjw7MgY2jhu6lhIMOtdCBuaOG6pXQgMiB04burIGtob8OhIHPhuqNuIHBo4bqpbSBtw6Aga2jDtG5nIGPDsyB04burIGtob8OhIHTDrG0ga2nhur9tLFxuICAgICAgLy8gZ2nhuqMgxJHhu4tuaCBsw6AgbmfGsOG7nWkgZMO5bmcgxJFhbmcgbXXhu5FuIHTDrG0gbmhp4buBdSBz4bqjbiBwaOG6qW1cbiAgICAgIGNvbnNvbGUubG9nKFwiUGjDoXQgaGnhu4duIHnDqnUgY+G6p3UgdMOsbSBuaGnhu4F1IHPhuqNuIHBo4bqpbSB04burIGRhbmggc8OhY2ggdOG7qyBraG/DoTpcIiwgcHJvZHVjdEtleXdvcmRzRm91bmQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBLaMO0bmcgcGjhuqNpIHRpbiBuaOG6r24gdMOsbSBuaGnhu4F1IHPhuqNuIHBo4bqpbVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIFxuICAvLyBDb21tb24gc2VwYXJhdG9ycyBpbiBWaWV0bmFtZXNlIHF1ZXJpZXNcbiAgY29uc3Qgc2VwYXJhdG9ycyA9IFsnLCcsICd2w6AnLCAnduG7m2knLCAnY8O5bmcgduG7m2knLCAnOycsICcrJywgJ3NvIHbhu5tpJywgJ3NvIHPDoW5oIHbhu5tpJ107XG4gIFxuICAvLyBUcnkgdG8gc3BsaXQgYnkgY29tbW9uIHNlcGFyYXRvcnNcbiAgbGV0IHBhcnRzID0gW107XG4gIFxuICAvLyBTcGVjaWFsIGhhbmRsaW5nIGZvciBjb21wYXJpc29uIHF1ZXJpZXNcbiAgaWYgKGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnc28gc8OhbmgnKSB8fCBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ8SR4buRaSBjaGnhur91JykpIHtcbiAgICBjb25zdCBjb21wYXJpc29uVGVybXMgPSBbJ3NvIHPDoW5oJywgJ8SR4buRaSBjaGnhur91JywgJ3NvIHbhu5tpJywgJ8SR4buRaSB24bubaScsICdzbycsICdoxqFuJywgJ2vDqW0nLCAndGh1YSddO1xuICAgIFxuICAgIC8vIEV4dHJhY3QgdGhlIHBhcnQgYWZ0ZXIgY29tcGFyaXNvbiBrZXl3b3Jkc1xuICAgIGxldCBjbGVhbk1lc3NhZ2UgPSBsb3dlck1lc3NhZ2U7XG4gICAgZm9yIChjb25zdCB0ZXJtIG9mIGNvbXBhcmlzb25UZXJtcykge1xuICAgICAgaWYgKGxvd2VyTWVzc2FnZS5pbmNsdWRlcyh0ZXJtKSkge1xuICAgICAgICBjb25zdCBzcGxpdFJlc3VsdCA9IGxvd2VyTWVzc2FnZS5zcGxpdCh0ZXJtKTtcbiAgICAgICAgY2xlYW5NZXNzYWdlID0gc3BsaXRSZXN1bHQubGVuZ3RoID4gMSAmJiBzcGxpdFJlc3VsdFsxXSA/IHNwbGl0UmVzdWx0WzFdLnRyaW0oKSA6IGxvd2VyTWVzc2FnZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIElmIHdlIGhhdmUgYSBjbGVhbmVyIG1lc3NhZ2UgYWZ0ZXIgY29tcGFyaXNvbiB0ZXJtcywgdHJ5IHRvIHNwbGl0IGl0XG4gICAgaWYgKGNsZWFuTWVzc2FnZSAhPT0gbG93ZXJNZXNzYWdlKSB7XG4gICAgICBmb3IgKGNvbnN0IHNlcGFyYXRvciBvZiBzZXBhcmF0b3JzKSB7XG4gICAgICAgIGlmIChjbGVhbk1lc3NhZ2UuaW5jbHVkZXMoc2VwYXJhdG9yKSkge1xuICAgICAgICAgIGlmIChzZXBhcmF0b3IgPT09ICd2w6AnKSB7XG4gICAgICAgICAgICBwYXJ0cyA9IGNsZWFuTWVzc2FnZS5zcGxpdCgvXFxzK3bDoFxccysvaSkuZmlsdGVyKHAgPT4gcC50cmltKCkubGVuZ3RoID4gMCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChzZXBhcmF0b3IgPT09ICd24bubaScgfHwgc2VwYXJhdG9yID09PSAnc28gduG7m2knIHx8IHNlcGFyYXRvciA9PT0gJ3NvIHPDoW5oIHbhu5tpJykge1xuICAgICAgICAgICAgLy8gU3BlY2lhbCBoYW5kbGluZyBmb3IgJ3bhu5tpJyBhcyBpdCBjYW4gYmUgcGFydCBvZiBvdGhlciBwaHJhc2VzXG4gICAgICAgICAgICBwYXJ0cyA9IGNsZWFuTWVzc2FnZS5zcGxpdCgvXFxzKyh24bubaXxzbyB24bubaXxzbyBzw6FuaCB24bubaSlcXHMrL2kpLmZpbHRlcihwID0+IHAudHJpbSgpLmxlbmd0aCA+IDApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXJ0cyA9IGNsZWFuTWVzc2FnZS5zcGxpdChzZXBhcmF0b3IpLmZpbHRlcihwID0+IHAudHJpbSgpLmxlbmd0aCA+IDApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBSZWd1bGFyIG5vbi1jb21wYXJpc29uIG11bHRpLXByb2R1Y3Qgc2VhcmNoXG4gICAgZm9yIChjb25zdCBzZXBhcmF0b3Igb2Ygc2VwYXJhdG9ycykge1xuICAgICAgLy8gSWYgd2UgYWxyZWFkeSBoYXZlIG11bHRpcGxlIHBhcnRzLCBicmVha1xuICAgICAgaWYgKHBhcnRzLmxlbmd0aCA+IDEpIGJyZWFrO1xuICAgICAgXG4gICAgICAvLyBUcnkgc3BsaXR0aW5nIGJ5IHRoaXMgc2VwYXJhdG9yXG4gICAgICBpZiAobWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHNlcGFyYXRvcikpIHtcbiAgICAgICAgLy8gSGFuZGxlIFwidsOgXCIgc3BlY2lhbGx5IHRvIGF2b2lkIHNwbGl0dGluZyBwaHJhc2VzIGxpa2UgXCJyYXUgdsOgIGPhu6dcIiB0aGF0IHNob3VsZCBzdGF5IHRvZ2V0aGVyXG4gICAgICAgIGlmIChzZXBhcmF0b3IgPT09ICd2w6AnKSB7XG4gICAgICAgICAgcGFydHMgPSBtZXNzYWdlLnNwbGl0KC9cXHMrdsOgXFxzKy9pKS5maWx0ZXIocCA9PiBwLnRyaW0oKS5sZW5ndGggPiAwKTtcbiAgICAgICAgfSBlbHNlIGlmIChzZXBhcmF0b3IgPT09ICd24bubaScgfHwgc2VwYXJhdG9yID09PSAnc28gduG7m2knIHx8IHNlcGFyYXRvciA9PT0gJ3NvIHPDoW5oIHbhu5tpJykge1xuICAgICAgICAgIC8vIFNwZWNpYWwgaGFuZGxpbmcgZm9yICd24bubaScgYXMgaXQgY2FuIGJlIHBhcnQgb2Ygb3RoZXIgcGhyYXNlc1xuICAgICAgICAgIHBhcnRzID0gbWVzc2FnZS5zcGxpdCgvXFxzKyh24bubaXxzbyB24bubaXxzbyBzw6FuaCB24bubaSlcXHMrL2kpLmZpbHRlcihwID0+IHAudHJpbSgpLmxlbmd0aCA+IDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBhcnRzID0gbWVzc2FnZS5zcGxpdChzZXBhcmF0b3IpLmZpbHRlcihwID0+IHAudHJpbSgpLmxlbmd0aCA+IDApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICAvLyBO4bq/dSBraMO0bmcgdMOhY2ggxJHGsOG7o2MgdsOgIGPDsyBuaGnhu4F1IHThu6sga2hvw6Egc+G6o24gcGjhuqltLCB04bqhbyByYSBjw6FjIHBo4bqnbiB04burIGPDoWMgdOG7qyBraG/DoSDEkcOzXG4gIGlmIChwYXJ0cy5sZW5ndGggPD0gMSAmJiBwcm9kdWN0S2V5d29yZHNGb3VuZC5sZW5ndGggPj0gMikge1xuICAgIGNvbnNvbGUubG9nKFwiVOG6oW8gY8OhYyBwaOG6p24gdMOsbSBraeG6v20gdOG7qyBjw6FjIHThu6sga2hvw6Egc+G6o24gcGjhuqltIHBow6F0IGhp4buHbiDEkcaw4bujY1wiKTtcbiAgICBcbiAgICAvLyBMb+G6oWkgYuG7jyBcInTDrG1cIiwgXCJ0w6xtIGtp4bq/bVwiIHThu6sgdGluIG5o4bqvblxuICAgIGxldCBjbGVhbk1lc3NhZ2UgPSBsb3dlck1lc3NhZ2VcbiAgICAgIC5yZXBsYWNlKC90w6xtIGtp4bq/bS9pLCAnJylcbiAgICAgIC5yZXBsYWNlKC90w6xtL2ksICcnKVxuICAgICAgLnRyaW0oKTtcbiAgICBcbiAgICAvLyBUaOG7rSBwaMOhdCBoaeG7h24gY8OhYyBz4bqjbiBwaOG6qW0gZOG7sWEgdHLDqm4gY8OhYyB04burIGtob8OhIHBo4buVIGJp4bq/blxuICAgIHBhcnRzID0gW107XG4gICAgZm9yIChjb25zdCBrZXl3b3JkIG9mIHByb2R1Y3RLZXl3b3Jkc0ZvdW5kKSB7XG4gICAgICAvLyBU4bqhbyByZWdleCDEkeG7gyBs4bqleSBjb250ZXh0IHh1bmcgcXVhbmggdOG7qyBraG/DoVxuICAgICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKGAoXFxcXHcrXFxcXHMrKT8oXFxcXHcrXFxcXHMrKT8ke2tleXdvcmR9KFxcXFxzK1xcXFx3Kyk/KFxcXFxzK1xcXFx3Kyk/YCwgJ2knKTtcbiAgICAgIGNvbnN0IG1hdGNoID0gY2xlYW5NZXNzYWdlLm1hdGNoKHJlZ2V4KTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICBwYXJ0cy5wdXNoKG1hdGNoWzBdLnRyaW0oKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJ0cy5wdXNoKGtleXdvcmQpOyAgLy8gTuG6v3Uga2jDtG5nIGzhuqV5IMSRxrDhu6NjIGNvbnRleHQsIGTDuW5nIGNow61uaCB04burIGtob8OhXG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICAvLyBJZiB3ZSBjb3VsZG4ndCBzcGxpdCBieSBzZXBhcmF0b3JzIGJ1dCBoYXMgbXVsdGktc2VhcmNoIGluZGljYXRvcixcbiAgLy8gdHJ5IHRvIGV4dHJhY3QgcHJvZHVjdCBuYW1lcyB1c2luZyBOTFAtbGlrZSBhcHByb2FjaFxuICBpZiAocGFydHMubGVuZ3RoIDw9IDEpIHtcbiAgICAvLyBFeHRyYWN0IHByb2R1Y3QgbmFtZXMgYWZ0ZXIgcmVtb3ZpbmcgY29tbW9uIHByZWZpeGVzXG4gICAgY29uc3QgY2xlYW5NZXNzYWdlID0gbG93ZXJNZXNzYWdlXG4gICAgICAucmVwbGFjZSgvc28gc8OhbmggKGdp4buvYXxj4bunYXx24buBfGdpw6F8Y2jhuqV0IGzGsOG7o25nfMawdSDEkWnhu4NtfG5oxrDhu6NjIMSRaeG7g20pIC9pLCAnJylcbiAgICAgIC5yZXBsYWNlKC9zbyBzw6FuaC9pLCAnJylcbiAgICAgIC5yZXBsYWNlKC/EkeG7kWkgY2hp4bq/dS9pLCAnJylcbiAgICAgIC5yZXBsYWNlKC90w6xtIG5oaeG7gXUgKHPhuqNuIHBo4bqpbXxsb+G6oWl8dGjhu6kpIChuaMawfGzDoHxn4buTbXxiYW8gZ+G7k218Y8OzKS9pLCAnJylcbiAgICAgIC5yZXBsYWNlKC90w6xtIChjw6FjfG5o4buvbmcpIChz4bqjbiBwaOG6qW18bG/huqFpfHRo4bupKSAobmjGsHxsw6B8Z+G7k218YmFvIGfhu5NtfGPDsykvaSwgJycpXG4gICAgICAucmVwbGFjZSgvdMOsbSAoY8OhY3xuaOG7r25nfG5oaeG7gXUpL2ksICcnKVxuICAgICAgLnJlcGxhY2UoL2PDoWMgbG/huqFpL2ksICcnKVxuICAgICAgLnJlcGxhY2UoL2PDoWMgc+G6o24gcGjhuqltL2ksICcnKVxuICAgICAgLnRyaW0oKTtcbiAgICBcbiAgICAvLyBSZS1hdHRlbXB0IHRvIHNwbGl0IGFmdGVyIGNsZWFuaW5nXG4gICAgZm9yIChjb25zdCBzZXBhcmF0b3Igb2Ygc2VwYXJhdG9ycykge1xuICAgICAgaWYgKGNsZWFuTWVzc2FnZS5pbmNsdWRlcyhzZXBhcmF0b3IpKSB7XG4gICAgICAgIGlmIChzZXBhcmF0b3IgPT09ICd2w6AnKSB7XG4gICAgICAgICAgcGFydHMgPSBjbGVhbk1lc3NhZ2Uuc3BsaXQoL1xccyt2w6BcXHMrL2kpLmZpbHRlcihwID0+IHAudHJpbSgpLmxlbmd0aCA+IDApO1xuICAgICAgICB9IGVsc2UgaWYgKHNlcGFyYXRvciA9PT0gJ3bhu5tpJyB8fCBzZXBhcmF0b3IgPT09ICdzbyB24bubaScgfHwgc2VwYXJhdG9yID09PSAnc28gc8OhbmggduG7m2knKSB7XG4gICAgICAgICAgcGFydHMgPSBjbGVhbk1lc3NhZ2Uuc3BsaXQoL1xccysoduG7m2l8c28gduG7m2l8c28gc8OhbmggduG7m2kpXFxzKy9pKS5maWx0ZXIocCA9PiBwLnRyaW0oKS5sZW5ndGggPiAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYXJ0cyA9IGNsZWFuTWVzc2FnZS5zcGxpdChzZXBhcmF0b3IpLmZpbHRlcihwID0+IHAudHJpbSgpLmxlbmd0aCA+IDApO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBJZiB3ZSBzdGlsbCBjb3VsZG4ndCBzcGxpdCBpdCwgdHJ5IGxvb2tpbmcgZm9yIHByb2R1Y3QgY2F0ZWdvcmllcyBvciBjb21tb24gcHJvZHVjdHNcbiAgICBpZiAocGFydHMubGVuZ3RoIDw9IDEpIHtcbiAgICAgIGNvbnN0IGNvbW1vbkNhdGVnb3JpZXMgPSBbXG4gICAgICAgICdyYXUnLCAnY+G7pycsICdxdeG6oycsICd0aOG7i3QnLCAnY8OhJywgJ2jhuqNpIHPhuqNuJywgJ8SR4buTIHXhu5FuZycsICduxrDhu5tjIG5n4buNdCcsIFxuICAgICAgICAnYmlhJywgJ3LGsOG7o3UnLCAnYsOhbmgnLCAna+G6uW8nLCAnZ2lhIHbhu4snLCAnZOG6p3UgxINuJywgJ27GsOG7m2MgbeG6r20nLCAnbcOsJywgJ2LDum4nLFxuICAgICAgICAnbsaw4bubYyBnaeG6t3QnLCAnbsaw4bubYyBy4butYScsICduxrDhu5tjIHThuql5J1xuICAgICAgXTtcbiAgICAgIFxuICAgICAgLy8gVHJ5IHRvIGlkZW50aWZ5IGNhdGVnb3JpZXMgaW4gdGhlIG1lc3NhZ2VcbiAgICAgIGNvbnN0IGNhdGVnb3JpZXMgPSBbXTtcbiAgICAgIGZvciAoY29uc3QgY2F0ZWdvcnkgb2YgY29tbW9uQ2F0ZWdvcmllcykge1xuICAgICAgICBpZiAoY2xlYW5NZXNzYWdlLmluY2x1ZGVzKGNhdGVnb3J5KSkge1xuICAgICAgICAgIC8vIEV4dHJhY3Qgc3Vycm91bmRpbmcgY29udGV4dCAodXAgdG8gMiB3b3JkcyBiZWZvcmUgYW5kIGFmdGVyKVxuICAgICAgICAgIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChgKFxcXFx3K1xcXFxzKyk/KFxcXFx3K1xcXFxzKyk/JHtjYXRlZ29yeX0oXFxcXHMrXFxcXHcrKT8oXFxcXHMrXFxcXHcrKT9gLCAnaScpO1xuICAgICAgICAgIGNvbnN0IG1hdGNoID0gY2xlYW5NZXNzYWdlLm1hdGNoKHJlZ2V4KTtcbiAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIGNhdGVnb3JpZXMucHVzaChtYXRjaFswXS50cmltKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBJZiB3ZSBmb3VuZCBhdCBsZWFzdCAyIGNhdGVnb3JpZXMsIHVzZSB0aGVtIGFzIHBhcnRzXG4gICAgICBpZiAoY2F0ZWdvcmllcy5sZW5ndGggPj0gMikge1xuICAgICAgICBwYXJ0cyA9IGNhdGVnb3JpZXM7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICAvLyBY4butIGzDvSB0csaw4budbmcgaOG7o3AgxJHhuqd1IHbDoG8gbmjGsCBcIm7GsOG7m2MgZ2nhurd0IG7GsOG7m2MgcuG7rWEgY2jDqW5cIiAoa2jDtG5nIGPDsyBk4bqldSBwaMOibiBjw6FjaClcbiAgaWYgKHBhcnRzLmxlbmd0aCA8PSAxICYmIGhhc011bHRpcGxlUHJvZHVjdEtleXdvcmRzKSB7XG4gICAgLy8gVGjhu60gdMOhY2ggZOG7sWEgdsOgbyB04burIGtob8OhIHBo4buVIGJp4bq/blxuICAgIGxldCByZW1haW5pbmdUZXh0ID0gbG93ZXJNZXNzYWdlO1xuICAgIHBhcnRzID0gW107XG4gICAgXG4gICAgLy8gU+G6r3AgeOG6v3AgY8OhYyB04burIGtob8OhIHRoZW8gxJHhu5kgZMOgaSBnaeG6o20gZOG6p24gxJHhu4MgxJHhuqNtIGLhuqNvIHTDrG0gdGjhuqV5IHThu6sgZMOgaSBuaOG6pXQgdHLGsOG7m2NcbiAgICBjb25zdCBzb3J0ZWRLZXl3b3JkcyA9IFsuLi5jb21tb25Qcm9kdWN0S2V5d29yZHNdLnNvcnQoKGEsIGIpID0+IGIubGVuZ3RoIC0gYS5sZW5ndGgpO1xuICAgIFxuICAgIHdoaWxlIChyZW1haW5pbmdUZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgICAgXG4gICAgICBmb3IgKGNvbnN0IGtleXdvcmQgb2Ygc29ydGVkS2V5d29yZHMpIHtcbiAgICAgICAgaWYgKHJlbWFpbmluZ1RleHQuaW5jbHVkZXMoa2V5d29yZCkpIHtcbiAgICAgICAgICBjb25zdCBpbmRleCA9IHJlbWFpbmluZ1RleHQuaW5kZXhPZihrZXl3b3JkKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBO4bq/dSBjw7MgbuG7mWkgZHVuZyB0csaw4bubYyB04burIGtob8OhIHbDoCBuw7Mga2jDtG5nIGNo4buJIGzDoCBraG/huqNuZyB0cuG6r25nXG4gICAgICAgICAgaWYgKGluZGV4ID4gMCkge1xuICAgICAgICAgICAgY29uc3QgYmVmb3JlVGV4dCA9IHJlbWFpbmluZ1RleHQuc3Vic3RyaW5nKDAsIGluZGV4KS50cmltKCk7XG4gICAgICAgICAgICBpZiAoYmVmb3JlVGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIHBhcnRzLnB1c2goYmVmb3JlVGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIFRow6ptIGPhu6VtIHThu6sga2hvw6EgdsOgIGNvbnRleHQgeHVuZyBxdWFuaFxuICAgICAgICAgIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChgKFxcXFx3K1xcXFxzKyk/KFxcXFx3K1xcXFxzKyk/JHtrZXl3b3JkfShcXFxccytcXFxcdyspPyhcXFxccytcXFxcdyspP2AsICdpJyk7XG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSByZW1haW5pbmdUZXh0Lm1hdGNoKHJlZ2V4KTtcbiAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIHBhcnRzLnB1c2gobWF0Y2hbMF0udHJpbSgpKTtcbiAgICAgICAgICAgIHJlbWFpbmluZ1RleHQgPSByZW1haW5pbmdUZXh0LnN1YnN0cmluZyhpbmRleCArIGtleXdvcmQubGVuZ3RoKS50cmltKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBhcnRzLnB1c2goa2V5d29yZCk7XG4gICAgICAgICAgICByZW1haW5pbmdUZXh0ID0gcmVtYWluaW5nVGV4dC5zdWJzdHJpbmcoaW5kZXggKyBrZXl3b3JkLmxlbmd0aCkudHJpbSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gTuG6v3Uga2jDtG5nIHTDrG0gdGjhuqV5IHThu6sga2hvw6EgbsOgbyBu4buvYSwgdGjDqm0gcGjhuqduIGPDsm4gbOG6oWkgdsOgbyBwYXJ0cyBu4bq/dSBjw7JuXG4gICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIGlmIChyZW1haW5pbmdUZXh0LnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcGFydHMucHVzaChyZW1haW5pbmdUZXh0LnRyaW0oKSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICAvLyBMb+G6oWkgYuG7jyBjw6FjIHBo4bqnbiB0csO5bmcgbOG6t3BcbiAgcGFydHMgPSBbLi4ubmV3IFNldChwYXJ0cyldO1xuICBcbiAgLy8gTG/huqFpIGLhu48gY8OhYyBwaOG6p24gcXXDoSBuZ+G6r24gKMOtdCBoxqFuIDIga8O9IHThu7EpXG4gIHBhcnRzID0gcGFydHMuZmlsdGVyKHAgPT4gcC5sZW5ndGggPj0gMik7XG4gIFxuICAvLyBPbmx5IGNvbnNpZGVyIGl0IGEgbXVsdGktcHJvZHVjdCBzZWFyY2ggaWYgd2UgaGF2ZSBhdCBsZWFzdCAyIHBhcnRzXG4gIGlmIChwYXJ0cy5sZW5ndGggPj0gMikge1xuICAgIGNvbnNvbGUubG9nKFwiVMOsbSBraeG6v20gbmhp4buBdSBz4bqjbiBwaOG6qW0gxJHGsOG7o2MgcGjDoXQgaGnhu4duOlwiLCBwYXJ0cyk7XG4gICAgcmV0dXJuIHBhcnRzLm1hcChwID0+IHAudHJpbSgpKTtcbiAgfVxuICBcbiAgLy8gTuG6v3UgduG6q24ga2jDtG5nIHTDrG0gxJHGsOG7o2Mgbmhp4buBdSBz4bqjbiBwaOG6qW0gZMO5IMSRw6MgcGjDoXQgaGnhu4duIGThuqV1IGhp4buHdSwgXG4gIC8vIGPhu5EgZ+G6r25nIHBow6JuIHTDrWNoIGPDonUgbeG7mXQgY8OhY2ggdGjDtG5nIG1pbmggaMahblxuICBpZiAoaGFzTXVsdGlTZWFyY2hJbmRpY2F0b3IgfHwgaGFzTXVsdGlwbGVQcm9kdWN0S2V5d29yZHMpIHtcbiAgICBjb25zb2xlLmxvZyhcIkPhu5EgZ+G6r25nIHBow6JuIHTDrWNoIGPDonUgdGjDtG5nIG1pbmggaMahbiAtIGxvd2VyTWVzc2FnZTpcIiwgbG93ZXJNZXNzYWdlKTtcbiAgICBcbiAgICAvLyBU4bqhbyBkYW5oIHPDoWNoIHThu6sga2hvw6EgduG7m2kgY8OhYyB0aeG7gW4gdOG7kSBwaOG7lSBiaeG6v25cbiAgICBjb25zdCBleHBhbmRlZEtleXdvcmRzID0gW107XG4gICAgZm9yIChjb25zdCBrZXl3b3JkIG9mIGNvbW1vblByb2R1Y3RLZXl3b3Jkcykge1xuICAgICAgZXhwYW5kZWRLZXl3b3Jkcy5wdXNoKGtleXdvcmQpO1xuICAgICAgZXhwYW5kZWRLZXl3b3Jkcy5wdXNoKGBz4bqjbiBwaOG6qW0gJHtrZXl3b3JkfWApO1xuICAgICAgZXhwYW5kZWRLZXl3b3Jkcy5wdXNoKGBsb+G6oWkgJHtrZXl3b3JkfWApO1xuICAgIH1cbiAgICBcbiAgICAvLyBUw6xtIHThuqV0IGPhuqMgY8OhYyB04burIGtob8OhIHBo4buVIGJp4bq/biB0cm9uZyB0aW4gbmjhuq9uXG4gICAgY29uc3QgZGV0ZWN0ZWRQcm9kdWN0cyA9IFtdO1xuICAgIGZvciAoY29uc3Qga2V5d29yZCBvZiBleHBhbmRlZEtleXdvcmRzKSB7XG4gICAgICBpZiAobG93ZXJNZXNzYWdlLmluY2x1ZGVzKGtleXdvcmQpKSB7XG4gICAgICAgIC8vIFRyw61jaCB4deG6pXQgdOG7qyBraG/DoSB2w6Agbmfhu68gY+G6o25oIHh1bmcgcXVhbmhcbiAgICAgICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKGAoXFxcXHcrXFxcXHMrKT8oXFxcXHcrXFxcXHMrKT8ke2tleXdvcmR9KFxcXFxzK1xcXFx3Kyk/KFxcXFxzK1xcXFx3Kyk/YCwgJ2knKTtcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBsb3dlck1lc3NhZ2UubWF0Y2gocmVnZXgpO1xuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICBkZXRlY3RlZFByb2R1Y3RzLnB1c2gobWF0Y2hbMF0udHJpbSgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBO4bq/dSBwaMOhdCBoaeG7h24gxJHGsOG7o2MgdOG7qyAyIHPhuqNuIHBo4bqpbSB0cuG7nyBsw6puXG4gICAgaWYgKGRldGVjdGVkUHJvZHVjdHMubGVuZ3RoID49IDIpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiUGjDoXQgaGnhu4duIHPhuqNuIHBo4bqpbSB04burIHBow6JuIHTDrWNoIHRow7RuZyBtaW5oOlwiLCBkZXRlY3RlZFByb2R1Y3RzKTtcbiAgICAgIHJldHVybiBkZXRlY3RlZFByb2R1Y3RzLm1hcChwID0+IHAudHJpbSgpKTtcbiAgICB9XG4gIH1cbiAgXG4gIHJldHVybiBudWxsO1xufTtcblxuLyoqXG4gKiBIYW5kbGVzIHNlYXJjaCBmb3IgbXVsdGlwbGUgcHJvZHVjdHNcbiAqIEBwYXJhbSB7c3RyaW5nW119IHF1ZXJpZXMgLSBBcnJheSBvZiBzZWFyY2ggcXVlcmllc1xuICogQHJldHVybnMge1Byb21pc2U8QXJyYXk+fSAtIFNlYXJjaCByZXN1bHRzIGZvciBlYWNoIHF1ZXJ5XG4gKi9cbmNvbnN0IGhhbmRsZU11bHRpUHJvZHVjdFNlYXJjaCA9IGFzeW5jIChxdWVyaWVzKSA9PiB7XG4gIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgXG4gIC8vIERhbmggc8OhY2ggY8OhYyB04burIGPhuqduIGxv4bqhaSBi4buPIGtoaSB0w6xtIGtp4bq/bVxuICBjb25zdCBzdG9wV29yZHMgPSBbJ3TDrG0nLCAna2nhur9tJywgJ3TDrG0ga2nhur9tJywgJ3PhuqNuIHBo4bqpbScsICdsb+G6oWknLCAnbmjGsCcsICdjw6FjJywgJ25o4buvbmcnLCAnbmhp4buBdScsICdjaG8nLCAndMO0aSddO1xuICBcbiAgZm9yIChjb25zdCBxdWVyeSBvZiBxdWVyaWVzKSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENodeG6qW4gaG/DoSBxdWVyeSBk4buxYSB2w6BvIHThu6sga2hvw6FcbiAgICAgIGxldCBjbGVhblF1ZXJ5ID0gcXVlcnkudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gICAgICBcbiAgICAgIC8vIExv4bqhaSBi4buPIGPDoWMgc3RvcHdvcmRzIMSR4buDIHThuq1wIHRydW5nIHbDoG8gdMOqbiBz4bqjbiBwaOG6qW1cbiAgICAgIGZvciAoY29uc3Qgd29yZCBvZiBzdG9wV29yZHMpIHtcbiAgICAgICAgLy8gQ2jhu4kgbG/huqFpIGLhu48gbuG6v3UgdOG7qyDEkeG7qW5nIMSR4buZYyBs4bqtcCwga2jDtG5nIHBo4bqjaSBt4buZdCBwaOG6p24gY+G7p2EgdOG7qyBraMOhY1xuICAgICAgICBjbGVhblF1ZXJ5ID0gY2xlYW5RdWVyeS5yZXBsYWNlKG5ldyBSZWdFeHAoYFxcXFxiJHt3b3JkfVxcXFxiYCwgJ2dpJyksICcnKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgY2xlYW5RdWVyeSA9IGNsZWFuUXVlcnkudHJpbSgpO1xuICAgICAgXG4gICAgICBjb25zb2xlLmxvZyhgVMOsbSBraeG6v20gc+G6o24gcGjhuqltIFwiJHtxdWVyeX1cIiAoxJHDoyBjaHXhuqluIGhvw6E6IFwiJHtjbGVhblF1ZXJ5fVwiKWApO1xuICAgICAgXG4gICAgICAvLyBT4butIGThu6VuZyBxdWVyeSDEkcOjIGNodeG6qW4gaG/DoSDEkeG7gyB0w6xtIGtp4bq/bVxuICAgICAgY29uc3QgcHJvZHVjdHMgPSBhd2FpdCBzZWFyY2hQcm9kdWN0c01vbmdvREIoY2xlYW5RdWVyeSk7XG4gICAgICBcbiAgICAgIGlmIChwcm9kdWN0cyAmJiBwcm9kdWN0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgcXVlcnk6IHF1ZXJ5LCAvLyBHaeG7ryBs4bqhaSBxdWVyeSBn4buRYyDEkeG7gyBoaeG7g24gdGjhu4sgY2hvIG5nxrDhu51pIGTDuW5nXG4gICAgICAgICAgY2xlYW5RdWVyeTogY2xlYW5RdWVyeSwgLy8gVGjDqm0gcXVlcnkgxJHDoyBjaHXhuqluIGhvw6EgxJHhu4MgZGVidWdcbiAgICAgICAgICBwcm9kdWN0czogcHJvZHVjdHMuc2xpY2UoMCwgNSkgIC8vIExpbWl0IHRvIHRvcCA1IHByb2R1Y3RzIHBlciBxdWVyeVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRo4butIGzhuqFpIHbhu5tpIHF1ZXJ5IGfhu5FjIG7hur91IHF1ZXJ5IMSRw6MgY2h14bqpbiBob8OhIGtow7RuZyBjw7Mga+G6v3QgcXXhuqNcbiAgICAgICAgY29uc29sZS5sb2coYEtow7RuZyB0w6xtIHRo4bqleSBr4bq/dCBxdeG6oyB24bubaSBxdWVyeSDEkcOjIGNodeG6qW4gaG/DoSwgdGjhu60gbOG6oWkgduG7m2kgcXVlcnkgZ+G7kWM6IFwiJHtxdWVyeX1cImApO1xuICAgICAgICBjb25zdCBvcmlnaW5hbFByb2R1Y3RzID0gYXdhaXQgc2VhcmNoUHJvZHVjdHNNb25nb0RCKHF1ZXJ5KTtcbiAgICAgICAgXG4gICAgICAgIGlmIChvcmlnaW5hbFByb2R1Y3RzICYmIG9yaWdpbmFsUHJvZHVjdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICBxdWVyeTogcXVlcnksXG4gICAgICAgICAgICBjbGVhblF1ZXJ5OiBudWxsLCAvLyDEkMOhbmggZOG6pXUgbMOgIGtow7RuZyBz4butIGThu6VuZyBxdWVyeSDEkcOjIGNodeG6qW4gaG/DoVxuICAgICAgICAgICAgcHJvZHVjdHM6IG9yaWdpbmFsUHJvZHVjdHMuc2xpY2UoMCwgNSlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBM4buXaSBraGkgdMOsbSBraeG6v20gc+G6o24gcGjhuqltIFwiJHtxdWVyeX1cIjpgLCBlcnJvcik7XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4gcmVzdWx0cztcbn07XG5cblxuIl0sIm1hcHBpbmdzIjoiOzs7OztBQUtBLElBQUFBLE1BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLE9BQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLGNBQUEsR0FBQUgsT0FBQTtBQUNBLElBQUFJLEtBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLEdBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQSxJQUFBTSxzQkFBQSxHQUFBTixPQUFBO0FBQ0EsSUFBQU8sa0JBQUEsR0FBQVAsT0FBQSwyQkFBMkQsU0FBQUQsdUJBQUFTLENBQUEsVUFBQUEsQ0FBQSxJQUFBQSxDQUFBLENBQUFDLFVBQUEs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