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
  markOrderAsPaid
} from "../Controller/orderController.js";

const router = Router();

router.post("/", orderCreate);
router.get("/", orderGetAll);
router.get("/user", orderGet);
router.get("/tracking/:orderCode", getOrderTracking);
router.get("/:id", orderGetById);
router.delete("/:id", orderDelete);
router.post("/:id/cancel", cancelOrder);
router.patch("/:id", updateOrder);
router.patch("/:id/mark-paid", markOrderAsPaid);

export default router;
