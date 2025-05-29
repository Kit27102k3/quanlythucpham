import express from "express";
import {
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchById,
  searchBranches,
  findNearestBranch,
  assignBranchToAddress,
  getBranchByManager
} from "../Controller/branchController.js";
import { verifyAdmin, verifyToken } from "../Middleware/authMiddleware.js";

const router = express.Router();

// Route lấy tất cả chi nhánh (không cần đăng nhập)
router.get("/", getAllBranches);

// Route tìm kiếm chi nhánh (không cần đăng nhập)
router.get("/search", searchBranches);

// Route tìm chi nhánh gần nhất (không cần đăng nhập)
router.get("/nearest", findNearestBranch);

// Route phân công chi nhánh cho địa chỉ (không cần đăng nhập)
router.post("/assign", assignBranchToAddress);

// Route lấy chi nhánh của manager (cần đăng nhập)
router.get("/manager", verifyToken, getBranchByManager);

// Route lấy chi nhánh theo ID (không cần đăng nhập)
router.get("/:id", getBranchById);

// Route thêm chi nhánh mới (cần quyền admin)
router.post("/", verifyAdmin, createBranch);

// Route cập nhật chi nhánh (cần quyền admin)
router.put("/:id", verifyAdmin, updateBranch);

// Route xóa chi nhánh (cần quyền admin)
router.delete("/:id", verifyAdmin, deleteBranch);

export default router; 