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
    productUnit: { type: String, default: "gram", trim: true },
    discountStartDate: { type: Date },
    discountEndDate: { type: Date },
    soldCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    numOfReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.methods.isDiscountActive = function() {
  if (!this.discountStartDate || !this.discountEndDate) {
    return this.productDiscount > 0;
  }
  
  const now = new Date();
  return (
    this.productDiscount > 0 && 
    now >= this.discountStartDate && 
    now <= this.discountEndDate
  );
};

productSchema.methods.toJSON = function() {
  const productObject = this.toObject();
  
  if (!this.isDiscountActive()) {
    productObject.productDiscount = 0;
    productObject.productPromoPrice = 0;
  }
  
  return productObject;
};

productSchema.methods.updateSoldCount = async function(quantity) {
  this.soldCount += quantity;
  await this.save();
};

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
