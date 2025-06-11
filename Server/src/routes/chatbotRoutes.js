import express from 'express';
import { handleMessage, handleRasaWebhook, processMessage, handleProductComparison } from '../Controller/Chatbot/chatbotController.js';
import { verifyToken } from '../Middleware/verifyToken.js';

const router = express.Router();

// Route cho chatbot
router.post('/', handleMessage);

// Route cho webhook từ Rasa
router.post('/webhook', handleRasaWebhook);

// Xử lý tin nhắn chatbot
router.post("/message", verifyToken, processMessage);

// Xử lý so sánh sản phẩm
router.post("/compare-products", verifyToken, handleProductComparison);

export const chatbotRoutes = router;