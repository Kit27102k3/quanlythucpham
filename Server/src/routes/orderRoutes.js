import { Router } from "express";
const router = Router();
import {
  createPaymentUrl,
  vnpayReturn,
  momoReturn,
} from "../Controller/order.js";

router.post("/create-payment", createPaymentUrl);
router.get("/vnpay-return", vnpayReturn);
router.get("/momo-return", momoReturn);

export default router;
