import express from "express";
import { 
    createAdmin, 
    getAllAdmins, 
    updateAdmin, 
    deleteAdmin,
    adminLogin,
    getAdminById,
    updateRolePermissions
} from "../Controller/adminController.js";
import { verifyToken, isAdmin } from "../Middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/login", adminLogin);

// Admin management routes
router.post("/admin/create", createAdmin);
router.get("/admin/list", getAllAdmins);
router.put("/admin/:id", updateAdmin);
router.delete("/admin/:id", deleteAdmin);
router.get("/admin/:id", getAdminById);

// Route để cập nhật quyền cho tất cả admin/manager/employee thuộc một vai trò nhất định (Chỉ Admin)
router.put("/roles/:roleKey/permissions", verifyToken, isAdmin, updateRolePermissions);

export default router; 