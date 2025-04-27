import express from "express";
import {
  createSepayPaymentUrl,
  handleSepayCallback,
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  deletePayment,
  createVnpayPaymentUrl,
  createBankQRCode,
  checkPaymentStatus,
  handleBankWebhook,
  updatePayment
} from "../Controller/paymentController.js";

const router = express.Router();

// Route CRUD cơ bản
router.post("/", createPayment);
router.get("/", getAllPayments);
router.get("/:id", getPaymentById);
router.patch("/:id/status", updatePaymentStatus);
router.patch("/:id", updatePayment);
router.delete("/:id", deletePayment);

// Routes thanh toán
router.post("/sepay/create-payment-url", createSepayPaymentUrl);
router.post("/sepay/callback", handleSepayCallback);
router.post("/vnpay/create-payment-url", createVnpayPaymentUrl);

// Route cho QR code ngân hàng
router.post("/bank-qr", createBankQRCode);

// Route kiểm tra trạng thái thanh toán
router.get("/status/:orderId", checkPaymentStatus);

// Các routes webhook - hỗ trợ nhiều dạng đường dẫn khác nhau
router.post("/webhook/bank", handleBankWebhook);
router.post("/sepay/webhook", handleBankWebhook);
router.post("/webhook", handleBankWebhook);
router.post("/payments/webhook/bank", handleBankWebhook);
router.post("/callback", handleBankWebhook);
router.post("/ipn", handleBankWebhook);
// Thêm route cho webhook MBBank
router.post("/webhook/mbbank", handleBankWebhook);
// Route tổng cho tất cả webhook
router.post("*webhook*", handleBankWebhook);

export default router;
