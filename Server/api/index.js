/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import express from "express";
import mongoose from "mongoose";
import reports from "./reports/index.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

const router = express.Router();
// MongoDB connection string - default to localhost if not defined in environment
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/quanlythucpham";

// Mount reports routes
router.use("/reports", reports);

// Add a direct inventory endpoint for development
router.get("/products/inventory", async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;

  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      // Try to connect if not already connected
      try {
        await mongoose.connect(MONGODB_URI);
      } catch (connError) {
        console.error("MongoDB connection error:", connError);
        return res
          .status(500)
          .json({ error: "Không thể kết nối đến cơ sở dữ liệu" });
      }
    }

    // Get products collection
    const productsCollection = mongoose.connection.collection("products");

    // Find individual products with stock under 20
    const products = await productsCollection
      .find({
        $or: [
          { productStock: { $lt: 20, $gt: 0 } }, // Check productStock field
          { stock: { $lt: 20, $gt: 0 } }, // Also check stock field as fallback
        ],
      })
      .sort({ productStock: 1, stock: 1 }) // Sort by stock (ascending)
      .limit(limit)
      .toArray();

    if (products && products.length > 0) {
      console.log(
        `Found ${products.length} individual products with low stock`
      );

      // Transform to required format - focus on individual products, not categories
      const inventoryData = products.map((product) => ({
        id: product._id,
        name: product.productName || product.name || "Sản phẩm không tên",
        category:
          product.productCategory || product.category || "Không phân loại",
        stock:
          product.productStock !== undefined
            ? product.productStock
            : product.stock || 0,
        status:
          (product.productStock !== undefined
            ? product.productStock
            : product.stock || 0) <= 5
            ? "Sắp hết"
            : "Còn hàng",
        price: product.productPrice || product.price || 0,
        sku: product.productCode || product.sku || "",
        image: product.productImages?.[0] || product.image || "",
      }));

      return res.json(inventoryData);
    } else {
      // Try alternative query approach using mock data for testing
      const mockProducts = [];

      console.log("Using mock data for products with low stock");
      return res.json(mockProducts);
    }
  } catch (error) {
    console.error("Error fetching inventory data:", error);
    return res.status(500).json({ error: "Lỗi khi lấy dữ liệu tồn kho" });
  }
});

// Error handler - eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

export default router;
