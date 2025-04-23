import express from "express";
import {
  getAllTips,
  getTipById,
  getTipsByCategory,
  createTip,
  updateTip,
  deleteTip,
  likeTip,
  getFeaturedTips
} from "../Controller/tipsController.js";

const router = express.Router();

// Lấy tất cả mẹo hay
router.get("/tips", getAllTips);

// Lấy mẹo hay theo ID
router.get("/tips/:id", getTipById);

// Lấy mẹo hay theo danh mục
router.get("/tips/category/:category", getTipsByCategory);

// Lấy các mẹo nổi bật
router.get("/tips/featured", getFeaturedTips);

// Tạo mẹo hay mới
router.post("/tips", createTip);

// Cập nhật mẹo hay
router.put("/tips/:id", updateTip);

// Xóa mẹo hay
router.delete("/tips/:id", deleteTip);

// Tăng likes cho mẹo hay
router.post("/tips/:id/like", likeTip);

export default router; 