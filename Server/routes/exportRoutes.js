const express = require('express');
const router = express.Router();
const { exportExcel } = require('../controllers/exportController');
const { verifyToken } = require('../middleware/authMiddleware');

// Route để xuất file Excel
router.post('/export-excel', verifyToken, exportExcel);

module.exports = router; 