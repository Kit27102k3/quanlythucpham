import express from "express";
import { createPayment, getPaymentById, deletePayment, createSepayPaymentUrl, handleBankWebhook, checkPaymentStatus } from "../Controller/paymentController.js";

const router = express.Router();

// Các route hiện có
router.post("/", createPayment);
router.get("/:id", getPaymentById);
router.delete("/:id", deletePayment);
router.post("/sepay/create-payment-url", createSepayPaymentUrl);

// Thêm route webhook và kiểm tra trạng thái
router.post("/webhook/bank", handleBankWebhook);
router.get("/status/:orderId", checkPaymentStatus);

export default router; 