import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from "./routes/authRoutes.js";
import scraperRoutes from "./routes/scraperRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productsRoutes from "./routes/productsRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config({ path: ".env" });
const app = express();
const port = process.env.PORT || 8081;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    maxAge: 3600,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const URI = process.env.MONGOOSE_URI;
mongoose
  .connect(URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/auth", authRoutes);
app.use("/logout", authRoutes);
app.use("/categories", categoryRoutes);
app.use("/api", scraperRoutes);
app.use("/api", productsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", chatbotRoutes);
app.use("/api/payments", paymentRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
