// server/routes/productsRoutes.js
import express from "express";
import * as ProductController from "../Controller/Products/index.js";
import { verifyToken, isAdmin } from "../Middleware/authMiddleware.js";
import { getInventory, getProductsByBranch } from "../Controller/Products/ProductQueryController.js";

const router = express.Router();

// Public routes
router.get("/products", ProductController.getAllProducts);
router.get("/products/search", ProductController.searchProducts);
router.get("/products/best-selling", ProductController.getBestSellingProductsCustom);
router.get("/products/best-sellers", ProductController.getBestSellingProductsCustom);
router.get("/products/top-rated", ProductController.getTopRatedProducts);
router.get("/products/category/:category", ProductController.getProductByCategory);
router.get("/products/slug/:slug", ProductController.getProductBySlug);
router.get("/products/:id", ProductController.getProductById);
router.get("/inventory", ProductController.getInventory);

// Protected routes (require authentication)
router.post("/products", verifyToken, isAdmin, ProductController.createProduct);
router.put("/products/:id", verifyToken, isAdmin, ProductController.updateProduct);
router.delete("/products/:id", verifyToken, isAdmin, ProductController.deleteProduct);

// Thêm route kiểm tra và cập nhật hạn sử dụng và giảm giá
router.get("/check-expirations", verifyToken, isAdmin, ProductController.checkAndUpdateExpirations);

// Add the route for getting products by branch
router.get("/branch/:branchId", getProductsByBranch);

export default router;
