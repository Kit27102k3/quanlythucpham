import express from "express";
import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
} from "../Controller/cartController.js";

const router = express.Router();

router.post("/add-to-cart", addToCart);
router.delete("/remove-from-cart", removeFromCart);
router.get("/:userId", getCart);
router.put("/update-cart-item", updateCartItem);

export default router;
