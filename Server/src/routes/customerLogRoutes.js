import express from 'express';
import customerLogController from '../Controller/customerLogController.js';
import { isAdmin, verifyToken } from '../Middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/logs
 * @desc Get all logs with pagination and filtering
 * @access Admin only
 */
router.get('/', verifyToken, isAdmin, customerLogController.getAllLogs);

/**
 * @route GET /api/logs/customer/:customerId
 * @desc Get logs for a specific customer
 * @access Admin only
 */
router.get('/customer/:customerId', verifyToken, isAdmin, customerLogController.getCustomerLogs);

/**
 * @route GET /api/logs/action/:action
 * @desc Get logs by action type
 * @access Admin only
 */
router.get('/action/:action', verifyToken, isAdmin, customerLogController.getLogsByAction);

/**
 * @route GET /api/logs/status/:status
 * @desc Get logs by status
 * @access Admin only
 */
router.get('/status/:status', verifyToken, isAdmin, customerLogController.getLogsByStatus);

/**
 * @route GET /api/logs/stats
 * @desc Get log statistics
 * @access Admin only
 */
router.get('/stats', verifyToken, isAdmin, customerLogController.getLogStats);

/**
 * @route DELETE /api/logs/cleanup
 * @desc Delete logs older than a certain date
 * @access Admin only
 */
router.delete('/cleanup', verifyToken, isAdmin, customerLogController.deleteOldLogs);

export default router; 