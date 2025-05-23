import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { 
      type: String, 
      required: true, 
      unique: true,
      uppercase: true,
      trim: true
    },
    type: { 
      type: String, 
      enum: ['percentage', 'fixed'], 
      required: true
    },
    value: { 
      type: Number, 
      required: true,
      min: 0
    },
    minOrder: { 
      type: Number, 
      required: true,
      min: 0
    },
    maxDiscount: { 
      type: Number,
      min: 0
    },
    expiresAt: { 
      type: Date
    },
    usageLimit: { 
      type: Number, 
      min: 0
    },
    used: { 
      type: Number, 
      default: 0,
      min: 0
    },
    isActive: { 
      type: Boolean, 
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon; 