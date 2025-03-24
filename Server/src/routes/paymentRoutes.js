import express from "express";
import {
  createPayment,
  deletePayment,
  getPaymentById,
} from "../Controller/paymentController.js";

const router = express.Router();

router.post("/create", createPayment);
router.get("/:paymentId", getPaymentById);
router.delete("/:paymentId", deletePayment);

export default router;
