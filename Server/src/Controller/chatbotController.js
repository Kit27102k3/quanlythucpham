/* eslint-disable no-useless-escape */
/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

import axios from 'axios';
import Product from "../Model/Products.js";
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
// Import xử lý câu hỏi về sản phẩm
import { handleProductPageQuestion } from './chatbotProductHandler.js';
import { handleFAQQuestion } from './chatbotFAQHandler.js';

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
    'thịt', 'cá', 'hải sản', 'gà', 'bò', 'heo', 'vịt', 'trứng', 'hột vịt', 'hột gà',
    'rau', 'củ', 'quả', 'cà chua', 'cà rốt', 'bắp cải', 'xà lách', 'hành', 'tỏi', 'gừng',
    'ớt', 'tiêu', 'muối', 'đường', 'nước mắm', 'dầu ăn', 'dầu hào', 'nước tương', 
    'mì', 'bún', 'phở', 'miến', 'gạo', 'bột', 'bánh', 'kẹo',
    'nước dừa', 'sữa', 'nước', 'bia', 'rượu'
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
  ingredients = [...new Set(ingredients)].map(ing => {
    // Loại bỏ số lượng và đơn vị
    return ing.replace(/\(\d+.*?\)/g, '')
              .replace(/\d+\s*(g|kg|ml|l|muỗng|tép|củ|quả)/gi, '')
              .replace(/khoảng/gi, '')
              .trim();
  }).filter(ing => ing.length > 1); // Loại bỏ các mục quá ngắn
  
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
export const handleMessage = async (req, res) => {
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
            const queriesWithResults = multiResults.filter(result => result.products && result.products.length > 0).length;
            
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
            const lastProducts = multiResults.flatMap(result => result.products || []);
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
        const queriesWithResults = multiResults.filter(result => result.products && result.products.length > 0).length;
        
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
          const lastProducts = multiResults.flatMap(result => result.products || []);
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
        const product = await Product.findById(productId);
        
        if (product) {
          console.log(`Đang xử lý câu hỏi về sản phẩm: ${product.productName}`);
          
          // Lưu sản phẩm vào ngữ cảnh
          saveContext(userId, { lastProduct: product });
          
          // Xử lý câu hỏi về sản phẩm hiện tại
          const productResponse = await handleProductPageQuestion(message, product);
          
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
        const productResponse = await handleProductPageQuestion(message, context.lastProduct);
        
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
          const pyRes = await axios.post('http://localhost:5000/api/chatbot/ask', { question: message });
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
          return res.status(200).json({
            success: true,
            type: 'text',
            message: "Xin lỗi, tôi không tìm thấy công thức phù hợp."
          });
        } catch (error) {
          console.error("Lỗi khi lấy công thức nấu ăn:", error);
          return res.status(200).json({
            success: true,
            type: 'text',
            message: "Xin lỗi, đã có lỗi xảy ra khi lấy công thức nấu ăn."
          });
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
          const faqResponse = handleFAQQuestion(intent);
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
 */
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
          { productPrice: { $lte: maxPrice } }
        ]
      });
      isPriceQuery = true;
      console.log("Tìm sản phẩm có giá dưới:", maxPrice);
    } else if (priceHighMatch) {
      const minPrice = parseInt(priceHighMatch[1]) * 1000;
      conditions.push({ 
        $or: [
          { price: { $gte: minPrice } },
          { productPrice: { $gte: minPrice } }
        ]
      });
      isPriceQuery = true;
      console.log("Tìm sản phẩm có giá trên:", minPrice);
    } else if (priceBetweenMatch) {
      const minPrice = parseInt(priceBetweenMatch[1]) * 1000;
      const maxPrice = parseInt(priceBetweenMatch[2]) * 1000;
      conditions.push({ 
        $or: [
          { price: { $gte: minPrice, $lte: maxPrice } },
          { productPrice: { $gte: minPrice, $lte: maxPrice } }
        ]
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
      { phrase: "nước tương", category: "Gia vị" }
    ];
    
    let foundSpecificPhrase = false;
    for (const item of specificPhrases) {
      if (lowerQuery.includes(item.phrase)) {
        foundSpecificPhrase = true;
        conditions.push({ 
          $or: [
            { productName: { $regex: item.phrase, $options: 'i' } },
            { description: { $regex: item.phrase, $options: 'i' } },
            { category: item.category }
          ]
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
        { keywords: ['giặt', 'xà phòng', 'nước rửa', 'lau', 'vệ sinh'], category: 'Đồ gia dụng' }
      ];
      
      let foundCategory = false;
      for (const item of categoryKeywords) {
        if (item.keywords.some(keyword => lowerQuery.includes(keyword))) {
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
    const priceKeywords = words.filter(word => word.match(/\d+k$/i));
    const keywords = words.filter(word => !stopWords.includes(word) && word.length > 1 && !word.match(/\d+k$/i));
    
    console.log("Từ khóa giá:", priceKeywords);
    console.log("Từ khóa tìm kiếm:", keywords);
    
    // Xử lý đặc biệt cho trường hợp tìm kiếm "rau"
    const isVegetableSearch = keywords.some(kw => ['rau', 'củ', 'quả'].includes(kw));
    let isSpecialCategorySearch = false;
    
    if (isVegetableSearch) {
      isSpecialCategorySearch = true;
      // Nếu chỉ toàn từ khóa liên quan đến rau củ quả, ưu tiên sử dụng danh mục thay vì tìm theo từ khóa
      if (keywords.every(kw => ['rau', 'củ', 'quả', 'trái'].includes(kw))) {
        console.log("Tìm tất cả sản phẩm trong danh mục Rau củ quả");
        // Xóa điều kiện tìm kiếm hiện tại nếu có
        const categoryIndex = conditions.findIndex(c => c.category === 'Rau củ quả');
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
      }
      else {
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
        const allMatchedProducts = await Product.find(filter).limit(20);
        
        if (allMatchedProducts.length === 0) {
          // Nếu không tìm thấy sản phẩm, thử tìm chỉ với từ khóa
          if (keywords.length > 0) {
            console.log("Không tìm thấy sản phẩm, thử tìm chỉ với từ khóa");
            
            // Tạo pipeline aggregation để tính điểm phù hợp
            const aggregationPipeline = [
              {
                $match: {
                  $or: keywords.flatMap(keyword => [
                    { productName: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } }
                  ])
                }
              },
              {
                $addFields: {
                  matchScore: {
                    $add: keywords.map(keyword => [
                      { $cond: [{ $regexMatch: { input: "$productName", regex: keyword, options: "i" } }, 2, 0] },
                      { $cond: [{ $regexMatch: { input: "$description", regex: keyword, options: "i" } }, 1, 0] }
                    ]).flat()
                  }
                }
              },
              {
                $sort: { matchScore: -1 }
              },
              {
                $limit: 10
              }
            ];
            
            products = await Product.aggregate(aggregationPipeline);
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
              products = await Product.find({ category: "Rau củ quả" }).limit(10);
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
              { keywords: ['giặt', 'xà phòng', 'nước rửa', 'lau', 'vệ sinh'], category: 'Đồ gia dụng' }
            ];
            
            for (const item of categoryKeywords) {
              if (item.keywords.some(keyword => lowerQuery.includes(keyword))) {
                console.log("Thử tìm chỉ với danh mục:", item.category);
                products = await Product.find({ category: item.category }).limit(10);
                if (products.length > 0) break;
              }
            }
          }
        } else {
          // Nếu có kết quả, tính điểm phù hợp và sắp xếp kết quả
          products = allMatchedProducts.map(product => {
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
          }).filter(product => product.matchScore > -1); // Loại bỏ các sản phẩm không hợp lệ
          
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
    /hạn sử dụng/i, /bảo hành/i, /chất lượng/i, /đánh giá/i, /review/i
  ];
  
  return contextPatterns.some(pattern => pattern.test(lowerMessage));
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
    /cửa hàng (có |bán |cung cấp |)([a-zA-Z0-9À-ỹ\s]+?) (không|ko|k|hong|hông)(\?)?$/i
  ];
  
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
    responseMessage = product.productDetails
      ? `${product.productName} ${product.productDetails}`
      : `${product.productName} là sản phẩm ${product.productCategory || product.category}. Vui lòng xem chi tiết sản phẩm để biết thêm về công dụng.`;
  }
  // Câu hỏi về giới thiệu
  else if (/giới thiệu|nói về|thông tin về|mô tả|sản phẩm này|thế nào/.test(lowerMessage)) {
    responseMessage = product.productIntroduction
      ? `Giới thiệu về ${product.productName}: ${product.productIntroduction}`
      : `${product.productName} là sản phẩm ${product.productCategory || product.category}. Hiện chưa có thông tin giới thiệu chi tiết về sản phẩm này.`;
  }
  // Câu hỏi về giá
  else if (/giá bao nhiêu|bao nhiêu tiền|giá|bao nhiêu/.test(lowerMessage)) {
    const originalPrice = product.productPrice || product.price || 0;
    const discount = product.productDiscount || 0;
    const promoPrice = product.productPromoPrice || (discount > 0 ? Math.round(originalPrice * (1 - discount/100)) : originalPrice);
  
    if (discount > 0) {
      responseMessage = `Giá của ${product.productName} là ${formatCurrency(promoPrice)} (Đã giảm ${discount}% từ ${formatCurrency(originalPrice)}).`;
    } else {
      responseMessage = `Giá của ${product.productName} là ${formatCurrency(originalPrice)}.`;
    }
  }
  // Câu hỏi về xuất xứ, thành phần
  else if (/xuất xứ|sản xuất|thành phần|nguyên liệu|có chứa|bảo quản/.test(lowerMessage)) {
    responseMessage = product.productOrigin || product.origin
      ? `${product.productName} có xuất xứ từ ${product.productOrigin || product.origin}.`
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
  return cookingKeywords.some(kw => message.toLowerCase().includes(kw));
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
    'gia vị', 'dầu ăn', 'nước mắm', 'nước tương', 'sữa', 'trà', 'cà phê'
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
    (lowerMessage.includes('tìm') && hasMultipleProductKeywords);
  
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
        cleanMessage = lowerMessage.split(term)[1]?.trim() || lowerMessage;
        break;
      }
    }
    
    // If we have a cleaner message after comparison terms, try to split it
    if (cleanMessage !== lowerMessage) {
      for (const separator of separators) {
        if (cleanMessage.includes(separator)) {
          if (separator === 'và') {
            parts = cleanMessage.split(/\s+và\s+/i).filter(p => p.trim().length > 0);
          } else if (separator === 'với' || separator === 'so với' || separator === 'so sánh với') {
            // Special handling for 'với' as it can be part of other phrases
            parts = cleanMessage.split(/\s+(với|so với|so sánh với)\s+/i).filter(p => p.trim().length > 0);
          } else {
            parts = cleanMessage.split(separator).filter(p => p.trim().length > 0);
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
          parts = message.split(/\s+và\s+/i).filter(p => p.trim().length > 0);
        } else if (separator === 'với' || separator === 'so với' || separator === 'so sánh với') {
          // Special handling for 'với' as it can be part of other phrases
          parts = message.split(/\s+(với|so với|so sánh với)\s+/i).filter(p => p.trim().length > 0);
        } else {
          parts = message.split(separator).filter(p => p.trim().length > 0);
        }
      }
    }
  }
  
  // Nếu không tách được và có nhiều từ khoá sản phẩm, tạo ra các phần từ các từ khoá đó
  if (parts.length <= 1 && productKeywordsFound.length >= 2) {
    console.log("Tạo các phần tìm kiếm từ các từ khoá sản phẩm phát hiện được");
    
    // Loại bỏ "tìm", "tìm kiếm" từ tin nhắn
    let cleanMessage = lowerMessage
      .replace(/tìm kiếm/i, '')
      .replace(/tìm/i, '')
      .trim();
    
    // Thử phát hiện các sản phẩm dựa trên các từ khoá phổ biến
    parts = [];
    for (const keyword of productKeywordsFound) {
      // Tạo regex để lấy context xung quanh từ khoá
      const regex = new RegExp(`(\\w+\\s+)?(\\w+\\s+)?${keyword}(\\s+\\w+)?(\\s+\\w+)?`, 'i');
      const match = cleanMessage.match(regex);
      if (match) {
        parts.push(match[0].trim());
      } else {
        parts.push(keyword);  // Nếu không lấy được context, dùng chính từ khoá
      }
    }
  }
  
  // If we couldn't split by separators but has multi-search indicator,
  // try to extract product names using NLP-like approach
  if (parts.length <= 1) {
    // Extract product names after removing common prefixes
    const cleanMessage = lowerMessage
      .replace(/so sánh (giữa|của|về|giá|chất lượng|ưu điểm|nhược điểm) /i, '')
      .replace(/so sánh/i, '')
      .replace(/đối chiếu/i, '')
      .replace(/tìm nhiều (sản phẩm|loại|thứ) (như|là|gồm|bao gồm|có)/i, '')
      .replace(/tìm (các|những) (sản phẩm|loại|thứ) (như|là|gồm|bao gồm|có)/i, '')
      .replace(/tìm (các|những|nhiều)/i, '')
      .replace(/các loại/i, '')
      .replace(/các sản phẩm/i, '')
      .trim();
    
    // Re-attempt to split after cleaning
    for (const separator of separators) {
      if (cleanMessage.includes(separator)) {
        if (separator === 'và') {
          parts = cleanMessage.split(/\s+và\s+/i).filter(p => p.trim().length > 0);
        } else if (separator === 'với' || separator === 'so với' || separator === 'so sánh với') {
          parts = cleanMessage.split(/\s+(với|so với|so sánh với)\s+/i).filter(p => p.trim().length > 0);
        } else {
          parts = cleanMessage.split(separator).filter(p => p.trim().length > 0);
        }
        break;
      }
    }
    
    // If we still couldn't split it, try looking for product categories or common products
    if (parts.length <= 1) {
      const commonCategories = [
        'rau', 'củ', 'quả', 'thịt', 'cá', 'hải sản', 'đồ uống', 'nước ngọt', 
        'bia', 'rượu', 'bánh', 'kẹo', 'gia vị', 'dầu ăn', 'nước mắm', 'mì', 'bún',
        'nước giặt', 'nước rửa', 'nước tẩy'
      ];
      
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
  parts = parts.filter(p => p.length >= 2);
  
  // Only consider it a multi-product search if we have at least 2 parts
  if (parts.length >= 2) {
    console.log("Tìm kiếm nhiều sản phẩm được phát hiện:", parts);
    return parts.map(p => p.trim());
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
      return detectedProducts.map(p => p.trim());
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
          products: products.slice(0, 5)  // Limit to top 5 products per query
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


