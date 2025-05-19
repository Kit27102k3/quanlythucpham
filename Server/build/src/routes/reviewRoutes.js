"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _reviewController = require("../Controller/reviewController.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var router = _express["default"].Router();

// Lấy tất cả đánh giá cho một sản phẩm
router.get("/product/:productId", _reviewController.getProductReviews);

// Thêm đánh giá mới
router.post("/product/:productId", _reviewController.addReview);

// Cập nhật đánh giá
router.put("/:reviewId", _reviewController.updateReview);

// Xóa đánh giá
router["delete"]("/:reviewId", _reviewController.deleteReview);

// Lấy tất cả đánh giá (chỉ admin)
router.get("/admin/all", _reviewController.getAllReviews);

// Cập nhật trạng thái hiển thị của đánh giá (chỉ admin)
router.patch("/admin/toggle/:reviewId", _reviewController.toggleReviewPublishStatus);

// API xử lý phản hồi đánh giá
router.post("/:reviewId/replies", _reviewController.replyToReview);
router.put("/:reviewId/replies/:replyId", _reviewController.editReply);
router["delete"]("/:reviewId/replies/:replyId", _reviewController.deleteReply);
var _default = exports["default"] = router;