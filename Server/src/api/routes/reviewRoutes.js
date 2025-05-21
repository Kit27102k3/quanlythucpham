import express from 'express';
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  replyToReview,
  getProductReviewStats,
  recalculateAllReviewStats
} from '../controllers/reviewController.js';
import { verifyToken, checkAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Lấy đánh giá của một sản phẩm (public)
router.get('/product/:productId', getProductReviews);

// Lấy thống kê đánh giá của sản phẩm (public)
router.get('/stats/:productId', getProductReviewStats);

// Các route yêu cầu đăng nhập
router.use(verifyToken);

// Tạo đánh giá mới
router.post('/', createReview);

// Cập nhật đánh giá
router.put('/:id', updateReview);

// Xóa đánh giá
router.delete('/:id', deleteReview);

// Phản hồi đánh giá 
router.post('/:id/reply', replyToReview);

// Các route yêu cầu quyền admin
router.use(checkAdmin);

// Cập nhật lại tất cả thống kê đánh giá (admin only)
router.post('/recalculate', recalculateAllReviewStats);

export default router; 