import express from "express";
import {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
} from "../Controller/productsController.js";

const router = express.Router();

router.post("/products", createProduct);
router.get("/products", getAllProducts);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

export default router;
