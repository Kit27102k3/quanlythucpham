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

// Route webhook ngân hàng - thêm cả path cũ và mới để đảm bảo tương thích
router.post("/webhook/bank", handleBankWebhook);

// Thêm route mới khớp với URL trong SePay
router.post("/sepay/webhook", handleBankWebhook);

// Thêm route mới cho webhook URL trên SePay
router.post("/payments/webhook/bank", handleBankWebhook);

export default router;
