// api/index.js
import express from "express";
import serverless from "serverless-http";

// Khởi tạo Express ngoài handler để giảm cold start
const app = express();

// Middleware đơn giản
app.use((req, res, next) => {
  console.log(`Request to: ${req.path}`);
  next();
});

// Route tối ưu
app.get("/api/hello", async (req, res) => {
  try {
    // Response nhanh với cache headers
    res
      .set('Cache-Control', 'public, max-age=60')
      .json({ 
        message: "Hello from Vercel Express!",
        timestamp: Date.now() 
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).end();
});

export default serverless(app);