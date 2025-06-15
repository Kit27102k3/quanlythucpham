import express from "express";
import multer from "multer";
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

// Configure multer to use memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Không hỗ trợ định dạng file này. Chỉ chấp nhận JPEG, PNG, JPG, GIF, WEBP.'), false);
    }
  }
});

// Lấy tất cả mẹo hay
router.get("/tips", getAllTips);

// Lấy mẹo hay theo ID
router.get("/tips/:id", getTipById);

// Lấy mẹo hay theo danh mục
router.get("/tips/category/:category", getTipsByCategory);

// Lấy các mẹo nổi bật
router.get("/tips/featured", getFeaturedTips);

// Tạo mẹo hay mới
router.post("/tips", upload.single('image'), createTip);

// Cập nhật mẹo hay
router.put("/tips/:id", upload.single('image'), updateTip);

// Xóa mẹo hay
router.delete("/tips/:id", deleteTip);

// Tăng likes cho mẹo hay
router.post("/tips/:id/like", likeTip);

export default router; 