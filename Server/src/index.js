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
import contactRoutes from "./routes/contactRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { handleSepayCallback, handleBankWebhook } from "./Controller/paymentController.js";

dotenv.config({ path: ".env" });
const app = express();

// Xóa model cache để tránh lỗi OverwriteModelError
Object.keys(mongoose.models).forEach(modelName => {
  if (modelName === 'Messages' || modelName === 'Conversation') {
    delete mongoose.models[modelName];
  }
});

app.use(
  cors({
    origin: ["http://localhost:3000", "https://quanlythucpham.vercel.app", process.env.NODE_ENV !== 'production' ? '*' : null].filter(Boolean),
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
app.use("/api/contact", contactRoutes);
app.use("/api/messages", messageRoutes);

// Dọn dẹp các webhook handler trùng lặp
// Đây là danh sách các đường dẫn webhook cần hỗ trợ
const webhookPaths = [
  '/webhook',
  '/api/webhook',
  '/api/webhook/bank',
  '/api/payments/webhook',
  '/api/payments/webhook/bank',
  '/api/payments/sepay/webhook'
];

// Đăng ký tất cả các route webhook với một handler duy nhất
webhookPaths.forEach(path => {
  app.post(path, async (req, res) => {
    try {
      console.log(`Webhook received at ${path}:`, JSON.stringify(req.body));
      
      // Xử lý webhook đồng bộ trước khi trả về response
      if (req.body.gateway === 'MBBank' || req.body.transferAmount) {
        await handleBankWebhook(req, res);
      } else {
        await handleSepayCallback(req, res);
      }

      // Chỉ trả về response nếu chưa được trả về từ các handler
      if (!res.headersSent) {
        res.status(200).json({
          success: true,
          code: "00",
          message: "Webhook processed successfully",
        });
      }
    } catch (error) {
      console.error(`Error handling webhook at ${path}:`, error);
      if (!res.headersSent) {
        res.status(200).json({
          success: true,
          code: "00",
          message: "Webhook received with error",
          error: error.message
        });
      }
    }
  });
});

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

// Khởi động server với cơ chế xử lý lỗi cổng
const startServer = (port, retryCount = 0) => {
  // Đảm bảo port là số và trong phạm vi hợp lệ
  const portNumber = parseInt(port, 10);
  if (isNaN(portNumber)) {
    port = 8080;
  } 
  // else {
  //   port = portNumber; // Ensure port is a number, not a string
  // }

  // Giới hạn số lần thử lại để tránh đệ quy vô hạn
  if (retryCount > 10) {
    console.error('Failed to start server after 10 retries');
    process.exit(1);
    return;
  }

  try {
    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${port} is in use, trying next port...`);
        // Thử port tiếp theo với tăng số lần thử
        startServer(parseInt(port) + 1, retryCount + 1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Error starting server:', error);
    // Thử port tiếp theo với tăng số lần thử
    startServer(parseInt(port) + 1, retryCount + 1);
  }
};

// Khởi động server
const port = process.env.PORT || 8081;
startServer(port);
