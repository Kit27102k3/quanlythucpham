import express from "express";
import {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  searchBrands,
} from "../Controller/brandController.js";
import { verifyToken, isAdmin } from "../Middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllBrands);
router.get("/search", searchBrands);
router.get("/:id", getBrandById);

// Admin & Manager only routes
router.post(
  "/",
  verifyToken,
  isAdmin,
  createBrand
);
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  updateBrand
);
router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  deleteBrand
);

export default router; 