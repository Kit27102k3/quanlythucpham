"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _reportsController = _interopRequireDefault(require("../Controller/reportsController.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var router = _express["default"].Router();

// Traditional endpoints (no authentication required)
router.get('/dashboard/stats', _reportsController["default"].getDashboardStats);
router.get('/analytics/revenue', _reportsController["default"].getRevenueData);
router.get('/analytics/top-products', _reportsController["default"].getTopProducts);
router.get('/products/inventory', _reportsController["default"].getInventoryData);
router.get('/users/stats', _reportsController["default"].getUserData);
router.get('/orders/stats', _reportsController["default"].getOrderData);
router.get('/coupons/stats', _reportsController["default"].getPromotionData);
router.get('/admin/activity-logs', _reportsController["default"].getSystemActivityData);
router.get('/orders/delivery-stats', _reportsController["default"].getDeliveryData);
router.get('/reviews/stats', _reportsController["default"].getFeedbackData);

// Edge API endpoints (no authentication required)
router.get('/reports/dashboard', _reportsController["default"].getDashboardStats);
router.get('/reports/revenue', _reportsController["default"].getRevenueData);
router.get('/reports/top-products', _reportsController["default"].getTopProducts);
router.get('/reports/inventory', _reportsController["default"].getInventoryData);
router.get('/reports/users', _reportsController["default"].getUserData);
router.get('/reports/orders', _reportsController["default"].getOrderData);
router.get('/reports/promotions', _reportsController["default"].getPromotionData);
router.get('/reports/system-activity', _reportsController["default"].getSystemActivityData);
router.get('/reports/delivery', _reportsController["default"].getDeliveryData);
router.get('/reports/feedback', _reportsController["default"].getFeedbackData);
var _default = exports["default"] = router;