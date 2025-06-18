import express from 'express';
import { handleMessage, handleRasaWebhook, processMessage, handleProductComparison } from '../Controller/Chatbot/chatbotController.js';
import { verifyToken } from '../Middleware/verifyToken.js';
import chatbotTrainer from '../chatbot/training_data/chatbot_trainer.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Lấy đường dẫn thư mục hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Route cho chatbot
router.post('/', handleMessage);

// Route cho webhook từ Rasa
router.post('/webhook', handleRasaWebhook);

// Xử lý tin nhắn chatbot
router.post("/message", verifyToken, processMessage);

// Xử lý so sánh sản phẩm
router.post("/compare-products", verifyToken, handleProductComparison);

// Route cập nhật prompt cho chatbot
router.post('/update-prompt', verifyToken, async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền thực hiện hành động này' 
      });
    }
    
    const { promptType = 'withExamples' } = req.body;
    
    // Cập nhật prompt
    const result = await chatbotTrainer.updateChatbotPrompt(promptType);
    
    if (result) {
      return res.status(200).json({
        success: true,
        message: `Đã cập nhật prompt chatbot thành công với loại: ${promptType}`
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Không thể cập nhật prompt chatbot'
      });
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật prompt chatbot:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật prompt chatbot',
      error: error.message
    });
  }
});

// Route tạo tất cả các prompt
router.post('/generate-prompts', verifyToken, async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền thực hiện hành động này' 
      });
    }
    
    // Tạo và lưu tất cả các prompt
    const prompts = chatbotTrainer.generateAndSaveAllPrompts();
    
    return res.status(200).json({
      success: true,
      message: 'Đã tạo và lưu tất cả các prompt thành công',
      prompts
    });
  } catch (error) {
    console.error('Lỗi khi tạo prompt chatbot:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo prompt chatbot',
      error: error.message
    });
  }
});

// Route lấy prompt hiện tại
router.get('/prompt', verifyToken, async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền thực hiện hành động này' 
      });
    }
    
    const { promptType = 'withExamples' } = req.query;
    
    // Lấy prompt
    const prompt = chatbotTrainer.getTrainingPrompt(promptType);
    
    if (prompt) {
      return res.status(200).json({
        success: true,
        promptType,
        prompt
      });
    } else {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy prompt loại: ${promptType}`
      });
    }
  } catch (error) {
    console.error('Lỗi khi lấy prompt chatbot:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy prompt chatbot',
      error: error.message
    });
  }
});

// Route khởi động lại chatbot
router.post('/restart', verifyToken, async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền thực hiện hành động này' 
      });
    }
    
    // Đường dẫn đến script khởi động lại chatbot
    const chatbotDir = path.join(__dirname, '..', 'chatbot');
    const scriptPath = path.join(chatbotDir, 'run.py');
    
    // Kiểm tra xem script có tồn tại không
    const fs = await import('fs');
    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy script khởi động chatbot'
      });
    }
    
    // Khởi động lại chatbot
    const pythonProcess = spawn('python', [scriptPath, '--restart'], {
      cwd: chatbotDir,
      detached: true,
      stdio: 'ignore'
    });
    
    // Không đợi tiến trình hoàn thành
    pythonProcess.unref();
    
    return res.status(200).json({
      success: true,
      message: 'Đã gửi lệnh khởi động lại chatbot'
    });
  } catch (error) {
    console.error('Lỗi khi khởi động lại chatbot:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi khởi động lại chatbot',
      error: error.message
    });
  }
});

export const chatbotRoutes = router;