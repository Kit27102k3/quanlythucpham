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
app.post(["/api/payments/webhook/bank", "/api/payments/sepay/webhook", "/api/webhook/bank"], async (req, res) => {
  try {
    console.log("Direct webhook handler received:", req.originalUrl);
    console.log("Webhook payload:", JSON.stringify(req.body));
    
    const { order_id, status } = req.body;
    
    // Luôn trả về 200 cho SePay để tránh retry
    return res.status(200).json({
      success: true,
      code: "00",
      message: "Webhook received successfully",
      data: {
        order_id: order_id || "unknown",
        status: status || "pending"
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
