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

export default router;
