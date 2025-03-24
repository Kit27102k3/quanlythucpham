import express from "express";
import { getProductInfoForChatbot } from "../Controller/chatbotController.js";

const router = express.Router();

router.post("/chat", getProductInfoForChatbot);

export default router;