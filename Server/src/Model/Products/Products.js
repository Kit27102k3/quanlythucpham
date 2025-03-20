import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  productPrice: { type: Number, required: true },
  productImages: { type: [String], default: [] },
});

const Product = mongoose.model("Product", productSchema);

export default Product;

// productCategory: { type: String, required: true },
// productDescription: { type: String, required: true },
// productBrand: String,
// productStatus: String,
// productDiscount: Number,
// productInfo: String,
// productDetails: String,
// productStock: Number,
// productCode: String,
// productWeight: Number,
// productPromoPrice: Number,
// productWarranty: Number,
// productOrigin: String,
// productIntroduction: String,