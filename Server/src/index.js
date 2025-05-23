/* eslint-disable no-undef */
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";

import { deleteExpiredVouchers } from "./Controller/savedVoucherController.js";
import { handleSepayCallback, handleBankWebhook } from "./Controller/paymentController.js";
import reportsController from "./Controller/reportsController.js";
import { getBestSellingProducts, updateProductExpirations } from "./Controller/productsController.js";

// ES modules compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env variables
dotenv.config({ path: ".env" });

// Import models to avoid OverwriteModelError
import "./Model/Review.js";
import "./Model/ReviewStats.js";

// Clear model cache for specific models to avoid overwrite errors on hot reloads
["Messages", "Conversation"].forEach(model => {
  if (mongoose.models[model]) {
    delete mongoose.models[model];
  }
});

// Import routes
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
import reviewRoutes from "./routes/reviewRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import savedVoucherRoutes from "./routes/savedVoucherRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";

const app = express();

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "https://quanlythucpham.vercel.app",
  "https://quanlythucpham-vercel.app",
  "https://quanlythucpham-git-main-kits-projects.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    maxAge: 3600,
  })
);

// Middleware for JSON and URL encoded bodies (50mb limit)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// JWT Authentication middleware
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const secretKey = process.env.JWT_SECRET || "your-secret-key";

    try {
      const decoded = jwt.verify(token, secretKey);
      req.user = decoded;
    } catch (error) {
      console.warn("Invalid JWT token:", error.message);
    }
  }
  next();
});

// MongoDB connection
const URI = process.env.MONGODB_URI || process.env.MONGOOSE_URI;
const mongooseOptions = {
  serverSelectionTimeoutMS: 60000,
  socketTimeoutMS: 90000,
  connectTimeoutMS: 60000,
  retryWrites: true,
  retryReads: true,
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 60000,
  waitQueueTimeoutMS: 60000,
  heartbeatFrequencyMS: 10000,
  family: 4,
};

// Hàm kết nối MongoDB với retry logic
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(URI, mongooseOptions);
      console.log("MongoDB Connected Successfully");
      console.log("MongoDB Connection Info:", {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        dbName: mongoose.connection.name,
        readyState: mongoose.connection.readyState,
      });
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, err);
      
      if (err.name === "MongooseServerSelectionError") {
        console.error({
          uri: URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"),
          message: err.message,
          reason: err.reason?.message,
          code: err.code,
        });
        console.error("IP whitelist issue detected. Please check MongoDB Atlas IP whitelist settings.");
      }

      if (i === retries - 1) {
        console.error("Max retries reached. Could not connect to MongoDB.");
        process.exit(1);
      }

      console.log(`Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Xử lý các sự kiện kết nối
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
  if (err.name === "MongooseServerSelectionError") {
    console.error("IP whitelist issue detected. Please check MongoDB Atlas IP whitelist settings.");
  }
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected. Attempting to reconnect...");
  connectWithRetry();
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected successfully");
});

// Khởi tạo kết nối
connectWithRetry();

// Register API routes
app.use("/auth", authRoutes);
app.use("/admin/auth", adminAuthRoutes);
app.use("/api", adminRoutes);
app.use("/api/categories", categoryRoutes);
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
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/saved-vouchers", savedVoucherRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/brands", brandRoutes);

// Direct product best sellers endpoint
app.get("/api/products/best-sellers", getBestSellingProducts);

// Reports endpoints registration (mapping path -> handler)
const reportEndpoints = {
  "/api/dashboard/stats": reportsController.getDashboardStats,
  "/api/analytics/revenue": reportsController.getRevenueData,
  "/api/analytics/top-products": reportsController.getTopProducts,
  "/api/products/inventory": reportsController.getInventoryData,
  "/api/users/stats": reportsController.getUserData,
  "/api/orders/stats": reportsController.getOrderData,
  "/api/coupons/stats": reportsController.getPromotionData,
  "/api/admin/activity-logs": reportsController.getSystemActivityData,
  "/api/orders/delivery-stats": reportsController.getDeliveryData,
  "/api/reviews/stats": reportsController.getFeedbackData,
};

// Register report endpoints and their aliases under /api/reports
for (const [path, handler] of Object.entries(reportEndpoints)) {
  app.get(path, handler);
  app.get(`/api/reports${path.replace(/^\/api/, "")}`, handler);
}

// Webhook handler function
const webhookHandler = async (req, res) => {
  try {
    if (req.body.gateway === "MBBank" || req.body.transferAmount) {
      await handleBankWebhook(req, res);
    } else {
      await handleSepayCallback(req, res);
    }

    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        code: "00",
        message: "Webhook processed successfully",
      });
    }
  } catch (error) {
    console.error("Webhook error:", error);
    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        code: "00",
        message: "Webhook received with error",
        error: error.message,
      });
    }
  }
};

// Register webhook routes
[
  "/webhook",
  "/api/webhook",
  "/api/webhook/bank",
  "/api/payments/webhook",
  "/api/payments/webhook/bank",
  "/api/payments/sepay/webhook",
].forEach((path) => app.post(path, webhookHandler));

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error:", err);

  if (req.path.includes("webhook") || req.path.includes("/api/payments/")) {
    return res.status(200).json({
      success: true,
      code: "00",
      message: "Request received with error",
      error: err.message,
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message,
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// Scheduled tasks
const scheduleIntervalHours = 6;
const scheduleIntervalMs = scheduleIntervalHours * 60 * 60 * 1000;

const runScheduledTasks = async () => {
  try {
    await Promise.all([deleteExpiredVouchers(), updateProductExpirations()]);
  } catch (error) {
    console.error("Scheduled task error:", error);
  }
};

// Google Maps Geocoding API proxy endpoint
app.get("/api/geocode", async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({
        status: "ZERO_RESULTS",
        error_message: "Missing address",
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        status: "REQUEST_DENIED",
        error_message: "Missing Google Maps API key",
      });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&region=vn&language=vi&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Geocoding error:", error);
    res.status(500).json({
      status: "ERROR",
      error_message: error.message,
    });
  }
});

// Start server function
const startServer = (port) => {
  const portNumber = Number(port) || 8080;

  const server = app.listen(portNumber, async () => {
    console.log(`Server running on port ${portNumber}`);

    // Run scheduled tasks immediately on start
    await runScheduledTasks();

    // Schedule periodic tasks
    setInterval(runScheduledTasks, scheduleIntervalMs);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${portNumber} is already in use. Please use a different port.`);
      process.exit(1);
    } else {
      console.error("Server error:", error);
      process.exit(1);
    }
  });
};

startServer(process.env.PORT);
