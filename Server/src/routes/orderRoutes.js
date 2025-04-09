import { Router } from "express";
import { 
  orderCreate, 
  orderGet, 
  orderGetAll,
  orderGetById, 
  orderDelete,
  cancelOrder
} from "../Controller/orderController.js";

const router = Router();

router.post("/", orderCreate);
router.get("/", orderGetAll);
router.get("/user", orderGet);
router.get("/:id", orderGetById);
router.delete("/:id", orderDelete);
router.post("/:id/cancel", cancelOrder);

export default router;
