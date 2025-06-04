import express from 'express';
import { exportExcel } from '../Controller/exportController.js';
import { verifyToken } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Route để xuất file Excel
router.post('/excel', verifyToken, exportExcel);

export default router; 