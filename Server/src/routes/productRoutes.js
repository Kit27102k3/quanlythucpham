const express = require('express');
const router = express.Router();
const productController = require('../../controllers/productController');
const auth = require('../Middleware/verifyToken');

// API lấy dữ liệu tồn kho sản phẩm (không cần xác thực)
router.get('/inventory', productController.getInventory);

// Các routes khác

// Lấy tất cả sản phẩm
router.get('/', productController.getAllProducts);

// Lấy sản phẩm theo ID
router.get('/:id', productController.getProductById);

// Các routes cần xác thực
router.post('/', auth.verifyToken, productController.createProduct);
router.put('/:id', auth.verifyToken, productController.updateProduct);
router.delete('/:id', auth.verifyToken, productController.deleteProduct);

module.exports = router; 