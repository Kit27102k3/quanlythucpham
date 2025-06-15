import express from "express";
import {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  searchBrands,
  resetBrandIndexes,
} from "../Controller/brandController.js";

import { verifyAdmin } from "../Middleware/authMiddleware.js"; // middleware bảo vệ route

const router = express.Router();

// Route đặc biệt để reset indexes - không yêu cầu xác thực
router.post("/reset-indexes-now", resetBrandIndexes);

// GET routes không yêu cầu xác thực
router.get("/", getAllBrands);
router.get("/search", searchBrands);
router.get("/:id", getBrandById);

// Các routes khác yêu cầu xác thực
router.use(verifyAdmin);

router.post("/", createBrand);
router.put("/:id", updateBrand);
router.delete("/:id", deleteBrand);
router.post("/reset-indexes", resetBrandIndexes);

export default router;
