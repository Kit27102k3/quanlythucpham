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
      default: 'percentage'
    },
    value: { 
      type: Number, 
      required: true,
      min: 0
    },
    minOrder: { 
      type: Number, 
      default: 0
    },
    maxDiscount: { 
      type: Number,
      default: null
    },
    expiresAt: { 
      type: Date,
      default: null
    },
    usageLimit: { 
      type: Number, 
      default: null
    },
    used: { 
      type: Number, 
      default: 0
    },
    isActive: { 
      type: Boolean, 
      default: true
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

// Tạo index để tìm kiếm nhanh
couponSchema.index({ code: 1 });
couponSchema.index({ expiresAt: 1 });
couponSchema.index({ isActive: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon; 