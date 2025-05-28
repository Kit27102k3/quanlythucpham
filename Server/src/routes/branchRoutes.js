import express from "express";
import {
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchById,
  searchBranches,
} from "../Controller/branchController.js";
import { verifyAdmin } from "../Middleware/authMiddleware.js";

const router = express.Router();

// Route lấy tất cả chi nhánh (không cần đăng nhập)
router.get("/", getAllBranches);

// Route tìm kiếm chi nhánh (không cần đăng nhập)
router.get("/search", searchBranches);

// Route lấy chi nhánh theo ID (không cần đăng nhập)
router.get("/:id", getBranchById);

// Route thêm chi nhánh mới (cần quyền admin)
router.post("/", verifyAdmin, createBranch);

// Route cập nhật chi nhánh (cần quyền admin)
router.put("/:id", verifyAdmin, updateBranch);

// Route xóa chi nhánh (cần quyền admin)
router.delete("/:id", verifyAdmin, deleteBranch);

export default router; 