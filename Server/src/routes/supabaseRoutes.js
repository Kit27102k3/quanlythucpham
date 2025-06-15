import express from 'express';
import supabaseController from '../Controller/supabaseController.js';

const router = express.Router();

// Route để lấy danh sách sản phẩm
router.get('/products', supabaseController.getProducts);

// Route để lấy thông tin sản phẩm theo ID
router.get('/products/:id', supabaseController.getProductById);

// Route để lấy danh sách đơn hàng
router.get('/orders', supabaseController.getOrders);

// Route để lấy thông tin người dùng theo ID
router.get('/users/:id', supabaseController.getUserById);

// Route để thực hiện truy vấn SQL tùy chỉnh
router.post('/query', supabaseController.executeQuery);

export default router; 