import express from 'express';
import { 
  getAllSuppliers, 
  getSupplierById, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier, 
  searchSuppliers 
} from '../Controller/supplierController.js';
import { verifyToken, isAdmin } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Tất cả routes đều được bảo vệ, chỉ admin mới có quyền truy cập
router.use(verifyToken);

// GET /api/suppliers - Lấy tất cả nhà cung cấp
router.route('/')
  .get(isAdmin, getAllSuppliers)
  .post(isAdmin, createSupplier);

// GET /api/suppliers/search - Tìm kiếm nhà cung cấp
router.route('/search')
  .get(isAdmin, searchSuppliers);

// GET, PUT, DELETE /api/suppliers/:id - Lấy, cập nhật, xóa nhà cung cấp theo ID
router.route('/:id')
  .get(isAdmin, getSupplierById)
  .put(isAdmin, updateSupplier)
  .delete(isAdmin, deleteSupplier);

export default router; 