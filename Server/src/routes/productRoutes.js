import express from 'express';
import { getInventory } from '../../controllers/productController.js';
import auth from '../Middleware/verifyToken.js';

const router = express.Router();

// API lấy dữ liệu tồn kho sản phẩm (không cần xác thực)
router.get('/inventory', getInventory);

// Các routes khác

// Lấy tất cả sản phẩm
// router.get('/', productController.getAllProducts);

// Lấy sản phẩm theo ID
// router.get('/:id', productController.getProductById);

// Các routes cần xác thực
// router.post('/', auth.verifyToken, productController.createProduct);
// router.put('/:id', auth.verifyToken, productController.updateProduct);
// router.delete('/:id', auth.verifyToken, productController.deleteProduct);

export default router; 