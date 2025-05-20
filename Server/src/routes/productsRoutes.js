// server/routes/productsRoutes.js
import express from "express";
import {
  createProduct,
  getAllProducts,
  updateProduct,
  getProductById,
  deleteProduct,
  searchProducts,
  getProductByCategory,
  getProductBySlug,
  getBestSellingProducts,
  checkAndUpdateExpirations
} from "../Controller/productsController.js";
import { verifyToken, isAdmin } from "../Middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/products", getAllProducts);
router.get("/products/search", searchProducts);
router.get("/products/best-selling", getBestSellingProducts);
router.get("/products/best-sellers", getBestSellingProducts);
router.get("/products/category/:category", getProductByCategory);
router.get("/products/slug/:slug", getProductBySlug);
router.get("/products/:id", getProductById);

// Protected routes (require authentication)
router.post("/products", verifyToken, isAdmin, createProduct);
router.put("/products/:id", verifyToken, isAdmin, updateProduct);
router.delete("/products/:id", verifyToken, isAdmin, deleteProduct);

// Thêm route kiểm tra và cập nhật hạn sử dụng và giảm giá
router.get("/check-expirations", verifyToken, isAdmin, checkAndUpdateExpirations);

export default router;
