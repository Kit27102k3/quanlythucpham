import express from 'express';
import { 
  getAllSuppliers, 
  getSupplierById, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier, 
  searchSuppliers,
  resetSupplierIndexes 
} from '../Controller/supplierController.js';
import { verifyToken, verifyAdmin } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Route đặc biệt để reset indexes - không yêu cầu xác thực
router.post("/reset-indexes-now", resetSupplierIndexes);

// GET routes không yêu cầu xác thực
router.get('/', getAllSuppliers);
router.get('/search', searchSuppliers);
router.get('/:id', getSupplierById);

// Các routes khác yêu cầu xác thực
router.use(verifyToken);

// POST /api/suppliers - Tạo nhà cung cấp
router.post('/', verifyAdmin, createSupplier);

// POST /api/suppliers/reset-indexes - Reset indexes (yêu cầu xác thực)
router.post('/reset-indexes', verifyAdmin, resetSupplierIndexes);

// PUT, DELETE /api/suppliers/:id - Cập nhật, xóa nhà cung cấp theo ID
router.put('/:id', verifyAdmin, updateSupplier);
router.delete('/:id', verifyAdmin, deleteSupplier);

export default router; 