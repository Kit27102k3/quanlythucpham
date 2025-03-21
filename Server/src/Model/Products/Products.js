import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true },
    productPrice: { type: Number, required: true },
    productImages: { type: [String], default: [] },
    productCategory: { type: String, required: true, trim: true },
    productDescription: { type: [String], required: true },
    productBrand: { type: String, trim: true },
    productStatus: { type: String, trim: true },
    productDiscount: { type: Number, default: 0 },
    productInfo: { type: String, trim: true },
    productDetails: { type: String, trim: true },
    productStock: { type: Number, default: 0 },
    productCode: { type: String, trim: true },
    productWeight: { type: Number, default: 0 },
    productPromoPrice: { type: Number, default: 0 },
    productWarranty: { type: Number, default: 0 },
    productOrigin: { type: String, trim: true },
    productIntroduction: { type: String, trim: true },
  },
  { timestamps: true }
);

// ✅ Thêm `productName` vào text index để tìm kiếm dễ dàng hơn
productSchema.index({
  productName: "text",
  productInfo: "text",
  productCategory: "text",
  productBrand: "text",
  productCode: "text",
  productDescription: "text",
  productDetails: "text",
  productOrigin: "text",
});

const Product = mongoose.model("Product", productSchema);

export default Product;
