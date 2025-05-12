import express from "express";
import { 
  createCoupon, 
  getAllCoupons, 
  getCouponByCode, 
  validateCoupon,
  updateCouponUsage,
  updateCoupon,
  deleteCoupon,
  resetCouponUsage
} from "../Controller/couponController.js";
import { verifyToken, isAdmin } from "../Middleware/authMiddleware.js";
import Coupon from "../Model/Coupon.js";

const router = express.Router();

// Public API - có thể truy cập mà không cần xác thực
router.post("/validate", validateCoupon);
router.get("/code/:code", getCouponByCode);
router.post("/use/:code", updateCouponUsage);

// Protected API - yêu cầu xác thực và quyền Admin
router.post("/", verifyToken, isAdmin, createCoupon);
router.get("/", verifyToken, isAdmin, getAllCoupons);
router.put("/:id", verifyToken, isAdmin, updateCoupon);
router.delete("/:id", verifyToken, isAdmin, deleteCoupon);

// Route để lấy danh sách mã giảm giá công khai cho người dùng
router.get("/public", async (req, res) => {
  try {
    const coupons = await Coupon.find({ 
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    })
    .sort({ createdAt: -1 })
    .select('-__v');
    
    res.status(200).json({ 
      success: true, 
      message: "Danh sách mã giảm giá công khai",
      data: coupons
    });
  } catch (error) {
    console.error("Error fetching public coupons:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi khi lấy danh sách mã giảm giá",
      error: error.message 
    });
  }
});

// Reset số lần sử dụng mã giảm giá (Admin only)
router.patch("/reset-usage/:id", verifyToken, isAdmin, resetCouponUsage);

export default router; 