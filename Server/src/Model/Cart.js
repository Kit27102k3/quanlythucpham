import mongoose from "mongoose";

const cartSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
      price: {
        type: Number,
        required: true,
        default: 0
      },
      unit: {
        type: String,
        default: "gram"
      },
      unitPrice: {
        type: Number,
        default: 0
      },
      conversionRate: {
        type: Number,
        default: 1
      },
      createdAt: {
        type: Date,
        default: Date.now(),
      },
    },
  ],
});

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
