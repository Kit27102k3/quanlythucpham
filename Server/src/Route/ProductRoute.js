import express from "express";
import * as ProductController from "../Controller/ProductController.js";
import { verifyToken, isAdmin } from "../Middleware/AuthMiddleware.js";
import { upload } from "../Config/Multer.js";

const router = express.Router();

// ... existing routes ...

// Route to get best selling products (public route)
router.get("/best-sellers", ProductController.getBestSellingProducts);

// ... existing routes ...

export default router; 