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

// Public debug route for development
router.get("/all-for-debug", async (req, res) => {
  try {
    const allCoupons = await Coupon.find().limit(10);
    return res.status(200).json(allCoupons);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error in debug route" });
  }
});

// Route để lấy danh sách mã giảm giá công khai cho người dùng
router.get("/active", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const now = new Date();
    
    // Find active coupons that haven't expired and haven't reached usage limit
    const coupons = await Coupon.find({
      isActive: true,
      $or: [
        { expiresAt: { $gt: now } },
        { expiresAt: null }
      ],
      $or: [
        { $expr: { $lt: ["$used", "$usageLimit"] } },
        { usageLimit: null }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(limit);
    
    return res.status(200).json(coupons);
  } catch (error) {
    console.error("Error getting active coupons:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Protected API - yêu cầu xác thực và quyền Admin
router.post("/", verifyToken, isAdmin, createCoupon);
router.get("/", verifyToken, isAdmin, getAllCoupons);
router.put("/:id", verifyToken, isAdmin, updateCoupon);
router.delete("/:id", verifyToken, isAdmin, deleteCoupon);

// Reset số lần sử dụng mã giảm giá (Admin only)
router.patch("/reset-usage/:id", verifyToken, isAdmin, resetCouponUsage);

export default router; 