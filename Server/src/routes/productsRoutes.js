// server/routes/productRoutes.js
import express from "express";
import {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
} from "../Controller/productsController.js";
import upload from "../config/multerConfig.js"; // Import cấu hình multer

const router = express.Router();

// Route để tạo sản phẩm (upload ảnh)
router.post("/products", upload.array("productImages", 5), createProduct);

// Route để lấy tất cả sản phẩm
router.get("/products", getAllProducts);

// Route để cập nhật sản phẩm
router.put("/products/:id", upload.array("productImages", 5), updateProduct);

// Route để xóa sản phẩm
router.delete("/products/:id", deleteProduct);

export default router;
