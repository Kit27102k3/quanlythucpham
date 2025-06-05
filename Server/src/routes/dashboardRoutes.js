import express from "express";
import { getDashboardStats } from "../Controller/dashboardController.js";
// import { verifyToken } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.get("/stats", getDashboardStats);
router.get("/", getDashboardStats); // Add root path for /api/dashboard

export default router; 