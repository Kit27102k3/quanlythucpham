import express from "express";
import * as CouponController from "../Controller/CouponController.js";
import { verifyToken, isAdmin } from "../Middleware/AuthMiddleware.js";

const router = express.Router();

// Public routes
router.get("/active", CouponController.getActiveCoupons);
router.post("/validate", CouponController.validateCoupon);

// Protected routes (for applying coupons during checkout)
router.post("/apply", verifyToken, CouponController.applyCoupon);

// Admin routes for managing coupons would go here
// router.post("/", verifyToken, isAdmin, CouponController.createCoupon);
// router.get("/", verifyToken, isAdmin, CouponController.getAllCoupons);
// etc.

export default router; 