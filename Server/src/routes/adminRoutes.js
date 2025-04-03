import express from "express";
import { 
    createAdmin, 
    getAllAdmins, 
    updateAdmin, 
    deleteAdmin,
    adminLogin,
    getAdminById
} from "../Controller/adminController.js";

const router = express.Router();

// Public routes
router.post("/login", adminLogin);

// Admin management routes
router.post("/admin/create", createAdmin);
router.get("/admin/list", getAllAdmins);
router.put("/admin/:id", updateAdmin);
router.delete("/admin/:id", deleteAdmin);
router.get("/admin/:id", getAdminById);

export default router; 