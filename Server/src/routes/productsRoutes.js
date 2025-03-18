import express from "express";
import multer from "multer";
import {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
} from "../Controller/productsController.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/products", upload.array("productImages", 5), createProduct);
router.get("/products", getAllProducts);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

export default router;
