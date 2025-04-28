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

// Route cập nhật trạng thái thủ công
router.post("/update-status/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing orderId parameter" 
      });
    }
    
    const Order = await import("../Model/Order.js").then(module => module.default);
    
    // Tìm đơn hàng
    const order = await Order.findOne({
      $or: [
        { _id: orderId },
        { orderId: orderId }
      ]
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    // Cập nhật trạng thái
    order.paymentStatus = 'completed';
    order.isPaid = true;
    if (status) {
      order.status = status;
    } else if (order.status === 'pending') {
      order.status = 'processing';
    }
    
    await order.save();
    
    return res.json({
      success: true,
      message: "Order payment status updated successfully",
      data: { orderId: order._id, status: order.status, paymentStatus: order.paymentStatus }
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: error.message
    });
  }
});

export default router;
