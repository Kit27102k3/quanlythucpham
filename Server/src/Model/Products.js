import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true },
    productPrice: { type: Number, required: true, min: 0 },
    productImages: { type: [String], default: [] },
    productCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    productDescription: { type: [String], required: true },
    productBrand: { type: String, required: true, trim: true },
    productStatus: { 
      type: String, 
      enum: ['Còn hàng', 'Hết hàng', 'Ngừng kinh doanh'],
      default: 'Còn hàng'
    },
    productDiscount: { type: Number, default: 0, min: 0 },
    productInfo: { type: String, trim: true },
    productDetails: { type: String, trim: true },
    productStock: { type: Number, default: 0, min: 0 },
    productCode: { type: String, required: true, unique: true, trim: true },
    productWeight: { type: Number, default: 0, min: 0 },
    productPromoPrice: { type: Number, default: 0, min: 0 },
    productWarranty: { type: Number, default: 0, min: 0 },
    productOrigin: { type: String, trim: true },
    productIntroduction: { type: String, trim: true },
  },
  { timestamps: true }
);

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
