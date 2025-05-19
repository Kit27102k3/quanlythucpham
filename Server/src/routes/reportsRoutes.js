import express from 'express';
import reportsController from '../Controller/reportsController.js';

const router = express.Router();

// Traditional endpoints (no authentication required)
router.get('/dashboard/stats', reportsController.getDashboardStats);
router.get('/analytics/revenue', reportsController.getRevenueData);
router.get('/analytics/top-products', reportsController.getTopProducts);
router.get('/products/inventory', reportsController.getInventoryData);
router.get('/users/stats', reportsController.getUserData);
router.get('/orders/stats', reportsController.getOrderData);
router.get('/coupons/stats', reportsController.getPromotionData);
router.get('/admin/activity-logs', reportsController.getSystemActivityData);
router.get('/orders/delivery-stats', reportsController.getDeliveryData);
router.get('/reviews/stats', reportsController.getFeedbackData);

// Edge API endpoints (no authentication required)
router.get('/reports/dashboard', reportsController.getDashboardStats);
router.get('/reports/revenue', reportsController.getRevenueData);
router.get('/reports/top-products', reportsController.getTopProducts);
router.get('/reports/inventory', reportsController.getInventoryData);
router.get('/reports/users', reportsController.getUserData);
router.get('/reports/orders', reportsController.getOrderData);
router.get('/reports/promotions', reportsController.getPromotionData);
router.get('/reports/system-activity', reportsController.getSystemActivityData);
router.get('/reports/delivery', reportsController.getDeliveryData);
router.get('/reports/feedback', reportsController.getFeedbackData);

export default router; 