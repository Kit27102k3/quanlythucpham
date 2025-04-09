import express from "express";
import {
  createSepayPaymentUrl,
  handleSepayCallback,
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  deletePayment,
  createVnpayPaymentUrl
} from "../Controller/paymentController.js";

const router = express.Router();

// Route tạo URL thanh toán SePay
router.post("/sepay/create-payment-url", createSepayPaymentUrl);

// Route xử lý callback từ SePay
router.post("/sepay/callback", handleSepayCallback);

// Route CRUD cơ bản
router.post("/", createPayment);
router.get("/", getAllPayments);
router.get("/:id", getPaymentById);
router.patch("/:id/status", updatePaymentStatus);
router.delete("/:id", deletePayment);

// Tạo một mock payment endpoint để xử lý thanh toán mẫu
router.get('/sepay/mock-payment', (req, res) => {
  try {
    const { orderId, amount, redirectUrl } = req.query;
    
    // Hiển thị trang thanh toán mẫu
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SePay Mock Payment</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 20px;
          margin-top: 50px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #4CAF50;
          text-align: center;
        }
        .order-info {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .btn {
          display: inline-block;
          padding: 10px 20px;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin-right: 10px;
          cursor: pointer;
          border: none;
        }
        .btn-danger {
          background-color: #f44336;
        }
        .btn-container {
          text-align: center;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>SePay - Cổng thanh toán mẫu</h1>
        <div class="order-info">
          <p><strong>Mã đơn hàng:</strong> ${orderId}</p>
          <p><strong>Số tiền:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}</p>
        </div>
        <p>Đây là cổng thanh toán mẫu dùng để kiểm tra. Nhấn "Thanh toán thành công" để giả lập thanh toán thành công, hoặc "Thanh toán thất bại" để giả lập thất bại.</p>
        <div class="btn-container">
          <form action="/api/payments/sepay/callback" method="POST" style="display:inline;">
            <input type="hidden" name="orderId" value="${orderId}">
            <input type="hidden" name="amount" value="${amount}">
            <input type="hidden" name="transactionId" value="${Date.now()}">
            <input type="hidden" name="status" value="success">
            <input type="hidden" name="redirectUrl" value="${redirectUrl || ''}">
            <button type="submit" class="btn">Thanh toán thành công</button>
          </form>
          
          <form action="/api/payments/sepay/callback" method="POST" style="display:inline;">
            <input type="hidden" name="orderId" value="${orderId}">
            <input type="hidden" name="amount" value="${amount}">
            <input type="hidden" name="transactionId" value="${Date.now()}">
            <input type="hidden" name="status" value="failed">
            <input type="hidden" name="redirectUrl" value="${redirectUrl || ''}">
            <button type="submit" class="btn btn-danger">Thanh toán thất bại</button>
          </form>
        </div>
      </div>
    </body>
    </html>
    `;
    
    res.send(htmlContent);
  } catch (error) {
    console.error('Lỗi trang thanh toán mẫu:', error);
    res.status(500).send('Có lỗi xảy ra khi hiển thị trang thanh toán mẫu');
  }
});

// Routes
router.post("/", createPayment);
router.post("/sepay/create-payment-url", createSepayPaymentUrl);
router.post("/sepay/callback", handleSepayCallback);
router.post("/vnpay/create-payment-url", createVnpayPaymentUrl);
router.get("/", getAllPayments);
router.get("/:id", getPaymentById);
router.patch("/:id/status", updatePaymentStatus);
router.delete("/:id", deletePayment);

export default router;
