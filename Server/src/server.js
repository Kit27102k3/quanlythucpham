import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import multer from "multer";

import authRoutes from "./routes/authRoutes.js";
import scraperRoutes from "./routes/scraperRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productsRoutes from "./routes/productsRoutes.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 8081;

app.use(
  cors({
    credentials: true,
    origin: "http://localhost:5000",
  })
);
app.use(express.json());
app.use(cookieParser());

const URI = process.env.MONGOOSE_URI;

mongoose
  .connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/auth", authRoutes);
app.use("/api", scraperRoutes);
app.use("/logout", authRoutes);
app.use("/categories", categoryRoutes);
app.use("/api", productsRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
