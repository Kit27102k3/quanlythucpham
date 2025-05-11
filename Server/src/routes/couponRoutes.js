import express from "express";
import { 
  createCoupon, 
  getAllCoupons, 
  getCouponByCode, 
  validateCoupon,
  updateCouponUsage,
  updateCoupon,
  deleteCoupon
} from "../Controller/couponController.js";
import { verifyToken, isAdmin } from "../Middleware/authMiddleware.js";

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

export default router; 