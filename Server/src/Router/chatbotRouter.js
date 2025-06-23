import express from 'express';
import { handleMessage, processMessage } from "../Controller/Chatbot/chatbotController.js";
import { handleProductQuery, handleCompareProducts } from "../Controller/Chatbot/chatbotProductHandler.js";
import { initOrGetUserContext } from "../Controller/Chatbot/chatbotContextHandler.js";

const chatbotRouter = express.Router();

// Xử lý tin nhắn chatbot
chatbotRouter.post('/message', handleMessage);
chatbotRouter.post('/process', processMessage);

// API tìm kiếm sản phẩm
chatbotRouter.post('/product/search', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp từ khóa tìm kiếm"
      });
    }
    
    const result = await handleProductQuery(message, { userId });
    return res.json(result);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm sản phẩm:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi tìm kiếm sản phẩm"
    });
  }
});

// API so sánh sản phẩm
chatbotRouter.post('/product/compare', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    console.log(`[Router] Nhận yêu cầu so sánh sản phẩm từ API endpoint với userId: ${userId}`);
    console.log(`[Router] Dữ liệu request.body:`, JSON.stringify(req.body));
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu userId. Vui lòng cung cấp userId để so sánh sản phẩm."
      });
    }
    
    // Lấy hoặc khởi tạo context
    const userContext = await initOrGetUserContext(userId);
    console.log("[Router] Context của người dùng:", userContext ? 
                `Tìm thấy (có ${userContext.lastProducts?.length || 0} sản phẩm)` : 'Không tìm thấy');
    
    // Chuẩn bị dữ liệu đúng định dạng
    const messageData = { userId, message: message || "so sánh sản phẩm" };
    const contextData = { 
      userId,
      ...userContext?._doc  // Truyền toàn bộ dữ liệu context từ MongoDB
    };
    
    const result = await handleCompareProducts(messageData, contextData);
    return res.json(result);
  } catch (error) {
    console.error("Lỗi khi so sánh sản phẩm:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi so sánh sản phẩm",
      error: error.message
    });
  }
});

export default chatbotRouter; 