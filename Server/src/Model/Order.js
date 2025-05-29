import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: Number,
        price: Number,
      },
    ],
    totalAmount: Number,
    coupon: {
      type: Object,
      default: null,
      required: false
    },
    status: { type: String, default: "pending" },
    shippingInfo: {
      address: String,
      phone: String,
      method: String,
    },
    paymentMethod: String,
    orderCode: { type: String },
    notes: { type: String },
    isPaid: { type: Boolean, default: false },
    completedAt: { type: Date },
    branchId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Branch" 
    }
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
