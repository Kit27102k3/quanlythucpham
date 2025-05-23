"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = require("express");
var _orderController = require("../Controller/orderController.js");
var router = (0, _express.Router)();
router.post("/", _orderController.orderCreate);
router.get("/", _orderController.orderGetAll);
router.get("/user", _orderController.orderGet);
router.get("/stats", _orderController.getOrderStats);
router.get("/delivery-stats", _orderController.getDeliveryStats);
router.get("/tracking/:orderCode", _orderController.getOrderTracking);
router.get("/top", _orderController.getTopOrders);
router.get("/:id", _orderController.orderGetById);
router["delete"]("/:id", _orderController.orderDelete);
router.post("/:id/cancel", _orderController.cancelOrder);
router.patch("/:id", _orderController.updateOrder);
router.patch("/:id/mark-paid", _orderController.markOrderAsPaid);
router.patch("/:id/payment-status", _orderController.updateOrderPaymentStatus);
router.post("/notify-order-success/:id", _orderController.notifyOrderSuccess);
var _default = exports["default"] = router;