import express from 'express';
import reportsController from '../controllers/reportsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Dashboard statistics
router.get('/dashboard/stats', authenticate, reportsController.getDashboardStats);

// Revenue data
router.get('/analytics/revenue', authenticate, reportsController.getRevenueData);

// Top products
router.get('/analytics/top-products', authenticate, reportsController.getTopProducts);

// Inventory data - add specific route with improved query handling
router.get('/products/inventory', authenticate, reportsController.getInventoryData);

// Alternative routes for inventory
router.get('/inventory', authenticate, reportsController.getInventoryData);
router.get('/inventory/low-stock', authenticate, reportsController.getInventoryData);

// User statistics
router.get('/users/stats', authenticate, reportsController.getUserData);

// Order statistics
router.get('/orders/stats', authenticate, reportsController.getOrderData);

// Promotion statistics
router.get('/coupons/stats', authenticate, reportsController.getPromotionData);

// System activity logs
router.get('/admin/activity-logs', authenticate, reportsController.getSystemActivityData);

// Delivery statistics
router.get('/orders/delivery-stats', authenticate, reportsController.getDeliveryData);

// Feedback statistics
router.get('/reviews/stats', authenticate, reportsController.getFeedbackData);

export default router;