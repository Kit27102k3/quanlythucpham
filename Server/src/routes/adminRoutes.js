import express from "express";
import { 
    createAdmin, 
    getAllAdmins, 
    updateAdmin, 
    deleteAdmin 
} from "../Controller/adminController.js";

const router = express.Router();

router.post("/admin/create", createAdmin);
router.get("/admin/list", getAllAdmins);
router.put("/admin/:id", updateAdmin);
router.delete("/admin/:id", deleteAdmin);

export default router; 