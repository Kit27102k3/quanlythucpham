/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import authRoutes from "./routes/authRoutes.js";
import scraperRoutes from "./routes/scraperRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productsRoutes from "./routes/productsRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import { chatbotRoutes } from "./routes/chatbotRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import tipsRoutes from "./routes/tipsRoutes.js";
import { handleSepayCallback, handleBankWebhook } from "./Controller/paymentController.js";

dotenv.config({ path: ".env" });
const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "https://quanlythucpham.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    maxAge: 3600,
  })
);

// Add a CORS preflight handler for OPTIONS requests
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.post('/webhook', (req, res) => {
  try {
    console.log("Root webhook handler received:", JSON.stringify(req.body));
    res.status(200).json({
      success: true,
      code: "00",
      message: "Webhook received successfully at root level",
      data: req.body
    });
    
    // Forward request to appropriate handler (không await để đảm bảo response nhanh)
    if (req.body.gateway === 'MBBank' || req.body.transferAmount) {
      handleBankWebhook(req, res).catch(err => {
        console.error("Error processing bank webhook:", err);
      });
    } else {
      handleSepayCallback(req, res).catch(err => {
        console.error("Error processing SePay webhook:", err);
      });
    }
  } catch (error) {
    console.error("Error in root webhook handler:", error);
    // Luôn trả về 200
    res.status(200).json({ success: true, code: "00", message: "Webhook received with error" });
  }
});

// Middleware kiểm tra token và trích xuất thông tin người dùng
app.use((req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwt = require('jsonwebtoken');
      const secretKey = process.env.JWT_SECRET || 'your-secret-key';
      
      try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded;
      } catch (error) {
        // Xử lý token không hợp lệ
      }
    }
    next();
  } catch (error) {
    next();
  }
});

const URI = process.env.MONGOOSE_URI;
mongoose
  .connect(URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/auth", authRoutes);
app.use("/admin/auth", adminAuthRoutes);
app.use("/api", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/logout", authRoutes);
app.use("/api", scraperRoutes);
app.use("/api", productsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", tipsRoutes);

// Thêm route đặc biệt cho webhook SePay để tránh lỗi 404
app.post("/api/payments/webhook/bank", handleBankWebhook);
app.post("/api/payments/sepay/webhook", handleBankWebhook);
app.post("/api/payments/webhook/bank", handleBankWebhook);

// Thêm middleware xử lý lỗi nghiêm trọng
app.use((req, res, next) => {
  try {
    next();
  } catch (error) {
    console.error("Uncaught error in request:", error);
    // Đối với webhook, luôn trả về 200
    if (req.path.includes('webhook') || req.path.includes('/api/payments/')) {
      return res.status(200).json({
        success: true,
        code: "00",
        message: "Request received with uncaught error",
        error: error.message
      });
    }
    // Đối với các request khác, trả về 500
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Đặt route webhook SePay trực tiếp tại root level (không qua router)
app.post([
  "/api/payments/webhook/bank", 
  "/api/payments/sepay/webhook", 
  "/api/webhook/bank",
  // Thêm URL chính xác từ SePay
  "/api/payments/webhook/bank"
], async (req, res) => {
  try {
    console.log("Direct webhook handler received:", req.originalUrl);
    console.log("Webhook payload:", JSON.stringify(req.body));
    
    const { order_id, status } = req.body;
    
    // Chuyển tiếp đến handler chính (không đợi xử lý)
    handleBankWebhook(req, res).catch(err => {
      console.error("Error forwarding to bank webhook handler:", err);
      // Nếu có lỗi từ handler chính và chưa gửi response, đảm bảo vẫn trả về 200
      if (!res.headersSent) {
        return res.status(200).json({
          success: true,
          code: "00",
          message: "Webhook received with processing error",
          data: {
            order_id: order_id || "unknown",
            status: status || "pending"
          }
        });
      }
    });
  } catch (error) {
    console.error("Direct webhook handler error:", error);
    return res.status(200).json({
      success: true,
      code: "00",
      message: "Webhook received with error",
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Thêm endpoint trực tiếp cho SePay để debug lỗi 500
app.get("/webhook", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SePay webhook endpoint is active",
    environment: process.env.NODE_ENV || 'development'
  });
});

// Thêm handler đơn giản cho webhook test
app.post("/webhook", (req, res) => {
  console.log("Received direct webhook POST:", req.body);
  res.status(200).json({
    success: true,
    code: "00",
    message: "Webhook received successfully"
  });
});

// Thêm webhook handler tối ưu và đúng đường dẫn cho SePay
app.post('/api/payments/webhook/bank', async (req, res) => {
  try {
    console.log("SePay webhook received:", JSON.stringify(req.body));
    
    // Đảm bảo luôn trả về 200 OK trước tiên để SePay biết webhook đã được nhận
    res.status(200).json({
      success: true,
      code: "00",
      message: "Webhook received successfully"
    });
    
    // Xử lý dữ liệu webhook bất đồng bộ
    handleWebhookData(req.body).catch(err => {
      console.error("Error processing webhook data:", err);
    });
  } catch (error) {
    console.error("Error in webhook handler:", error);
    // Nếu chưa trả về response, đảm bảo vẫn trả về 200
    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        code: "00",
        message: "Webhook received with error"
      });
    }
  }
});

// Thêm route và handler đặc biệt cho MBBank
app.post('*/webhook*', async (req, res) => {
  try {
    console.log("Generic webhook handler received:", JSON.stringify(req.body));
    
    // Luôn trả về 200 OK 
    res.status(200).json({
      success: true,
      code: "00",
      message: "Webhook received successfully" 
    });
    
    // Xử lý nội dung đặc biệt cho MBBank
    // Nếu có nội dung chuyển khoản, phân tích để tìm ID đơn hàng
    if (req.body.content || (req.body.gateway === 'MBBank')) {
      console.log("Processing MBBank webhook with content:", req.body.content);
      req.body.gateway = req.body.gateway || 'MBBank'; // Đánh dấu là webhook từ MBBank
    }
    
    // Chuyển tiếp đến hàm xử lý chung
    handleWebhookData(req.body).catch(err => {
      console.error("Error processing generic webhook:", err);
    });
  } catch (error) {
    console.error("Error in generic webhook handler:", error);
    // Đảm bảo vẫn trả về 200 nếu chưa trả về
    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        code: "00",
        message: "Webhook received with error"
      });
    }
  }
});

// Hàm xử lý dữ liệu webhook riêng biệt
async function handleWebhookData(webhookData) {
  try {
    console.log("Processing webhook data:", JSON.stringify(webhookData));
    
    // Trích xuất thông tin từ webhook
    const { 
      // Fields từ SePay
      transaction_id, 
      order_id, 
      amount, 
      status,
      
      // Fields từ MBBank
      gateway,
      accountNumber,
      content,
      transferAmount,
      transferType,
      referenceCode,
      
      // Fields được chuẩn hóa
      orderId: requestOrderId,
      transactionId = transaction_id || referenceCode
    } = webhookData;
    
    // Tìm orderId từ các nguồn khác nhau
    let finalOrderId = requestOrderId || order_id;
    
    // Trích xuất orderId từ nội dung chuyển khoản (MBBank)
    if (!finalOrderId && content) {
      console.log("Trying to extract orderId from content:", content);
      
      // Các mẫu regex khác nhau để tìm mã đơn hàng từ nội dung
      const patterns = [
        /don hang[:\s]*#?([a-zA-Z0-9_-]+)/i,  // "Thanh toan don hang #ABC123"
        /thanh toan don hang[:\s]*#?([a-zA-Z0-9_-]+)/i, // "Thanh toan don hang ABC123"
        /#([a-zA-Z0-9_-]+)/i,  // "#ABC123"
        /([a-f0-9]{24})/i,  // MongoDB ID format
        /(\d{8,15}[-]?\d{1,6})/i  // Timestamp-random format
      ];
      
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          finalOrderId = match[1].trim();
          console.log(`Extracted orderId from content: ${finalOrderId} using pattern: ${pattern}`);
          break;
        }
      }
      
      // Nếu nội dung có mã như #680db5f0067c94fe83e85e30
      const hashtagMatch = content.match(/#([a-zA-Z0-9]+)/);
      if (!finalOrderId && hashtagMatch && hashtagMatch[1]) {
        finalOrderId = hashtagMatch[1];
        console.log(`Extracted orderId from hashtag: ${finalOrderId}`);
      }
    }
    
    // Trích xuất trực tiếp từ nội dung chuyển khoản nếu có format #ID
    if (!finalOrderId && content) {
      // Tìm trong toàn bộ chuỗi content
      const extractedOrderId = content.match(/680[a-zA-Z0-9]+/);
      if (extractedOrderId && extractedOrderId[0]) {
        finalOrderId = extractedOrderId[0];
        console.log(`Found orderId in content by direct match: ${finalOrderId}`);
      }
    }
    
    if (!finalOrderId) {
      console.log("No orderId found in webhook data");
      return;
    }
    
    console.log(`Processing payment for order: ${finalOrderId}, transaction: ${transactionId}`);
    
    // Tìm order
    const Order = mongoose.model('Order');
    const order = await Order.findOne({ 
      $or: [
        { _id: finalOrderId },
        { orderId: finalOrderId }
      ]
    });
    
    if (!order) {
      console.log(`Order not found: ${finalOrderId}`);
      // Tìm kiếm mở rộng với pattern matching trên ID
      const allOrders = await Order.find({}).limit(10).sort({createdAt: -1});
      console.log(`Latest 10 orders in system:`, allOrders.map(o => o._id));
      return;
    }
    
    console.log(`Found order: ${order._id}, current status: ${order.status}, payment: ${order.paymentStatus}`);
    
    // Xác định trạng thái thành công
    const isSuccessful = 
      status === 'success' || 
      status === 'completed' || 
      status === '0' || 
      status === 0 || 
      (gateway === 'MBBank' && transferAmount > 0) ||
      (webhookData.transferAmount && webhookData.transferAmount > 0);
    
    // Tìm hoặc tạo payment record
    const Payment = mongoose.model('Payment');
    let payment = await Payment.findOne({ 
      $or: [
        { orderId: order._id },
        { orderId: finalOrderId }
      ] 
    });
    
    const finalAmount = amount || transferAmount || webhookData.transferAmount || order.totalAmount;
    
    // Xác định phương thức thanh toán
    const paymentMethod = gateway === 'MBBank' || webhookData.gateway === 'MBBank' 
      ? 'bank_transfer' 
      : 'sepay';
    
    if (payment) {
      console.log(`Found payment record: ${payment._id}, current status: ${payment.status}`);
      
      // Cập nhật payment và đảm bảo đặt userId nếu chưa có
      if (!payment.userId && order.userId) {
        payment.userId = order.userId;
      }
      
      // Chỉ cập nhật nếu payment chưa complete hoặc cần thay đổi trạng thái
      if (payment.status !== 'completed' || !isSuccessful) {
        payment.status = isSuccessful ? 'completed' : 'pending';
        payment.transactionId = transactionId || `webhook_${Date.now()}`;
        payment.amount = finalAmount;
        payment.paymentMethod = paymentMethod;
        if (isSuccessful) payment.paidAt = new Date();
        await payment.save();
        console.log(`Updated payment ${payment._id} status to '${payment.status}'`);
      } else {
        console.log(`Payment ${payment._id} already completed, no update needed`);
      }
    } else {
      // Tạo payment mới
      try {
        payment = new Payment({
          orderId: order._id,
          userId: order.userId, // Đảm bảo có userId
          amount: finalAmount,
          paymentMethod: paymentMethod,
          status: isSuccessful ? 'completed' : 'pending',
          transactionId: transactionId || `webhook_${Date.now()}`,
          paidAt: isSuccessful ? new Date() : null
        });
        await payment.save();
        console.log(`Created new payment for order ${order._id} with status: ${payment.status}`);
      } catch (paymentCreateError) {
        console.error("Error creating payment:", paymentCreateError);
      }
    }
    
    // Cập nhật trạng thái đơn hàng
    if (isSuccessful) {
      order.paymentStatus = 'completed';
      order.status = 'processing'; // Chuyển sang trạng thái xử lý đơn hàng
      await order.save();
      console.log(`Updated order ${order._id} status to 'processing'`);
    }
  } catch (error) {
    console.error("Error processing webhook data:", error);
  }
}

// Thay đổi cách thiết lập server để xử lý lỗi cổng đã sử dụng
const startServer = (port) => {
  // Đảm bảo port là số và trong phạm vi hợp lệ
  const portNumber = parseInt(port, 10);
  if (isNaN(portNumber) || portNumber < 1024 || portNumber > 65535) {
    console.log(`Invalid port ${port}, using default port 8090...`);
    port = 8090;
  }

  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      // Tăng port lên 1 và kiểm tra không vượt quá 65535
      const nextPort = port + 1;
      if (nextPort > 65535) {
        console.error('No available ports in valid range');
        process.exit(1);
      }
      console.log(`Port ${port} is in use, trying alternative port ${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error('Server error:', error);
    }
  });
};

// Khởi động server với cơ chế xử lý lỗi cổng
const port = process.env.PORT || 8081;
startServer(port);
