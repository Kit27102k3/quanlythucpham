// server/routes/productRoutes.js
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
} from "../Controller/productsController.js";

const router = express.Router();

// Route để tạo sản phẩm (sử dụng Cloudinary trực tiếp)
router.post("/products", createProduct);

// Route để lấy tất cả sản phẩm
router.get("/products", getAllProducts);

router.get("/products/search", searchProducts);

// Route để lấy danh sách sản phẩm bán chạy nhất
router.get("/products/best-selling", getBestSellingProducts);

router.get("/products/category/:category", getProductByCategory);

// Route để lấy sản phẩm theo slug
router.get("/products/slug/:slug", getProductBySlug);

// Route để lấy sản phẩm theo ID
router.get("/products/:id", getProductById);

// Route để cập nhật sản phẩm
router.put("/products/:id", updateProduct);

// Route để xóa sản phẩm
router.delete("/products/:id", deleteProduct);

export default router;
