import { Router } from "express";
import { 
  orderCreate, 
  orderGet, 
  orderGetAll,
  orderGetById, 
  orderDelete,
  cancelOrder,
  getOrderTracking,
  updateOrder,
  markOrderAsPaid,
  updateOrderPaymentStatus,
  notifyOrderSuccess,
  getTopOrders,
  getOrderStats,
  getDeliveryStats
} from "../Controller/orderController.js";

const router = Router();

router.post("/", orderCreate);
router.get("/", orderGetAll);
router.get("/user", orderGet);
router.get("/stats", getOrderStats);
router.get("/delivery-stats", getDeliveryStats);
router.get("/tracking/:orderCode", getOrderTracking);
router.get("/top", getTopOrders);
router.get("/:id", orderGetById);
router.delete("/:id", orderDelete);
router.post("/:id/cancel", cancelOrder);
router.patch("/:id", updateOrder);
router.patch("/:id/mark-paid", markOrderAsPaid);
router.patch("/:id/payment-status", updateOrderPaymentStatus);
router.post("/notify-order-success/:id", notifyOrderSuccess);

export default router;
