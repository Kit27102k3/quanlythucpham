import express from 'express';
import { 
  getAllSuppliers, 
  getSupplierById, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier, 
  searchSuppliers 
} from '../Controller/supplierController.js';
import { verifyToken, verifyAdmin } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Tất cả routes đều được bảo vệ, chỉ admin và manager mới có quyền truy cập
router.use(verifyToken);

// GET /api/suppliers - Lấy tất cả nhà cung cấp
router.route('/')
  .get(verifyAdmin, getAllSuppliers)
  .post(verifyAdmin, createSupplier);

// GET /api/suppliers/search - Tìm kiếm nhà cung cấp
router.route('/search')
  .get(verifyAdmin, searchSuppliers);

// GET, PUT, DELETE /api/suppliers/:id - Lấy, cập nhật, xóa nhà cung cấp theo ID
router.route('/:id')
  .get(verifyAdmin, getSupplierById)
  .put(verifyAdmin, updateSupplier)
  .delete(verifyAdmin, deleteSupplier);

export default router; 