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
  createBankQRCode
} from "../Controller/paymentController.js";

const router = express.Router();

// Route CRUD cơ bản
router.post("/", createPayment);
router.get("/", getAllPayments);
router.get("/:id", getPaymentById);
router.patch("/:id/status", updatePaymentStatus);
router.delete("/:id", deletePayment);

// Routes thanh toán
router.post("/sepay/create-payment-url", createSepayPaymentUrl);
router.post("/sepay/callback", handleSepayCallback);
router.post("/vnpay/create-payment-url", createVnpayPaymentUrl);

// Route mới cho QR code ngân hàng
router.post("/bank-qr", createBankQRCode);

// Thêm route mock tạm thời để xử lý redirect và hiển thị QR code
router.get('/mock', (req, res) => {
  const { orderId, amount, status, qr } = req.query;
  
  // Nếu có tham số qr, hiển thị trang với mã QR
  if (qr === 'true') {
    const paymentUrl = `http://localhost:8080/api/payments/mock?orderId=${orderId}&amount=${amount}&status=${status || 'success'}`;
    
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quét mã QR để thanh toán</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
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
        }
        .order-info {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          text-align: left;
        }
        .qr-container {
          margin: 20px 0;
        }
        .btn {
          display: inline-block;
          padding: 10px 20px;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Quét mã QR để thanh toán</h1>
        <div class="order-info">
          <p><strong>Mã đơn hàng:</strong> ${orderId}</p>
          <p><strong>Số tiền:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}</p>
        </div>
        <div class="qr-container">
          <img src="data:image/png;base64,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" alt="QR Code thanh toán" width="250">
          <p>Quét mã QR trên để thanh toán đơn hàng của bạn</p>
        </div>
        <p>Hoặc:</p>
        <a href="${paymentUrl}" class="btn">Nhấn vào đây để thanh toán</a>
      </div>
    </body>
    </html>
    `;
    
    return res.send(htmlContent);
  }
  
  // Nếu không có tham số qr, redirect đến trang kết quả thanh toán
  const redirectUrl = `http://localhost:3000/payment-result?orderId=${orderId}&status=${status || 'success'}&amount=${amount}`;
  res.redirect(redirectUrl);
});

export default router;
