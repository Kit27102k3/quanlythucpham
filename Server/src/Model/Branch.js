import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên chi nhánh không được để trống"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Địa chỉ chi nhánh không được để trống"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Số điện thoại chi nhánh không được để trống"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    manager: {
      type: String,
      trim: true,
    },
    openingHours: {
      type: String,
      default: "08:00 - 22:00",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    latitude: {
      type: Number,
      default: 0,
    },
    longitude: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

// Đảm bảo tên chi nhánh không trùng lặp
branchSchema.index({ name: 1 }, { unique: true });

const Branch = mongoose.model("Branch", branchSchema);

export default Branch; 