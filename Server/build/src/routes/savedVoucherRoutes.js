"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _authMiddleware = require("../Middleware/authMiddleware.js");
var _savedVoucherController = require("../Controller/savedVoucherController.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var router = _express["default"].Router();

// Lấy danh sách voucher đã lưu của người dùng đã đăng nhập
router.get("/", _authMiddleware.verifyToken, _savedVoucherController.getUserSavedVouchers);

// Lưu voucher cho người dùng
router.post("/", _authMiddleware.verifyToken, _savedVoucherController.saveVoucher);

// Xóa voucher đã lưu
router["delete"]("/:couponId", _authMiddleware.verifyToken, _savedVoucherController.deleteSavedVoucher);

// Cập nhật trạng thái isPaid của voucher đã lưu
router.patch("/status/:savedVoucherId", _authMiddleware.verifyToken, _savedVoucherController.updateSavedVoucherStatus);
var _default = exports["default"] = router;