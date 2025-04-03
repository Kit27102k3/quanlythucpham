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
} from "../Controller/productsController.js";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

const router = express.Router();

// Route để tạo sản phẩm (upload ảnh)
router.post("/products", upload.array("productImages", 5), createProduct);

// Route để lấy tất cả sản phẩm
router.get("/products", getAllProducts);

router.get("/products/search", searchProducts);

router.get("/products/category/:category", getProductByCategory);

// Route để lấy sản phẩm theo slug
router.get("/products/slug/:slug", getProductBySlug);

// Route để lấy sản phẩm theo ID
router.get("/products/:id", getProductById);

// Route để cập nhật sản phẩm
router.put("/products/:id", upload.array("productImages", 5), updateProduct);

// Route để xóa sản phẩm
router.delete("/products/:id", deleteProduct);

export default router;
