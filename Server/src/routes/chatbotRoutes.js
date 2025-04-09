import express from 'express';
import { handleMessage, handleRasaWebhook } from '../Controller/chatbotController.js';

const router = express.Router();

// Route cho chatbot
router.post('/', handleMessage);

// Route cho webhook từ Rasa
router.post('/webhook', handleRasaWebhook);

export const chatbotRoutes = router;