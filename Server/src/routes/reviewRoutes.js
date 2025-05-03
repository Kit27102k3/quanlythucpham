import express from "express";
import {
  getProductReviews,
  addReview,
  updateReview,
  deleteReview,
  getAllReviews,
  toggleReviewPublishStatus,
  replyToReview,
  editReply,
  deleteReply
} from "../Controller/reviewController.js";

const router = express.Router();

// Lấy tất cả đánh giá cho một sản phẩm
router.get("/product/:productId", getProductReviews);

// Thêm đánh giá mới
router.post("/product/:productId", addReview);

// Cập nhật đánh giá
router.put("/:reviewId", updateReview);

// Xóa đánh giá
router.delete("/:reviewId", deleteReview);

// Lấy tất cả đánh giá (chỉ admin)
router.get("/admin/all", getAllReviews);

// Cập nhật trạng thái hiển thị của đánh giá (chỉ admin)
router.patch("/admin/toggle/:reviewId", toggleReviewPublishStatus);

// API xử lý phản hồi đánh giá
router.post("/:reviewId/replies", replyToReview);
router.put("/:reviewId/replies/:replyId", editReply);
router.delete("/:reviewId/replies/:replyId", deleteReply);

export default router; 