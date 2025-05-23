"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _reviewController = require("../controllers/reviewController.js");
var _authMiddleware = require("../middleware/authMiddleware.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var router = _express["default"].Router();

// Lấy đánh giá của một sản phẩm (public)
router.get('/product/:productId', _reviewController.getProductReviews);

// Lấy thống kê đánh giá của sản phẩm (public)
router.get('/stats/:productId', _reviewController.getProductReviewStats);

// Các route yêu cầu đăng nhập
router.use(_authMiddleware.verifyToken);

// Tạo đánh giá mới
router.post('/', _reviewController.createReview);

// Cập nhật đánh giá
router.put('/:id', _reviewController.updateReview);

// Xóa đánh giá
router["delete"]('/:id', _reviewController.deleteReview);

// Phản hồi đánh giá 
router.post('/:id/reply', _reviewController.replyToReview);

// Các route yêu cầu quyền admin
router.use(_authMiddleware.checkAdmin);

// Cập nhật lại tất cả thống kê đánh giá (admin only)
router.post('/recalculate', _reviewController.recalculateAllReviewStats);
var _default = exports["default"] = router;