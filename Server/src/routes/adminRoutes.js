import express from "express";
import {
  loginAdmin,
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAdminById,
} from "../Controller/AdminController.js";

const router = express.Router();

// Public routes
router.post("/login", loginAdmin);
router.get("/admin", getAllAdmins);
router.post("/admin", createAdmin);
router.put("/admin/:id", updateAdmin);
router.delete("/admin/:id", deleteAdmin);
router.get("/admin/:id", getAdminById);

export default router; 