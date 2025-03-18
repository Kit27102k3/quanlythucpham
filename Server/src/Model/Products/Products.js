import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  productPrice: { type: Number, required: true },
  productCategory: { type: String, required: true },
  productDescription: { type: String, required: true },
  productImages: { type: [Buffer], default: [] },
  productBrand: String,
  productStatus: String,
  productDiscount: Number,
  productInfo: String,
  productDetails: String,
  productStock: Number,
  productCode: String,
  productWeight: Number,
  productPromoPrice: Number,
  productWarranty: Number,
  productOrigin: String,
  productIntroduction: String,
});

const Product = mongoose.model("Product", productSchema);

export default Product;
