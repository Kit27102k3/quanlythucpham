import express from "express";
import { verifyToken } from "../Middleware/authMiddleware.js";
import {
  getUserSavedVouchers,
  saveVoucher,
  deleteSavedVoucher
} from "../Controller/savedVoucherController.js";

const router = express.Router();

// Lấy danh sách voucher đã lưu của người dùng đã đăng nhập
router.get("/", verifyToken, getUserSavedVouchers);

// Lưu voucher cho người dùng
router.post("/", verifyToken, saveVoucher);

// Xóa voucher đã lưu
router.delete("/:couponId", verifyToken, deleteSavedVoucher);

export default router; 