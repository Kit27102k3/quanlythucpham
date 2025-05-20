import express from 'express';
import { getSystemStats } from '../Controller/systemController.js';
import { verifyToken, isAdmin } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Route lấy thống kê hoạt động hệ thống - yêu cầu xác thực và quyền admin
router.get('/stats', verifyToken, isAdmin, getSystemStats);

export default router; 