import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên thương hiệu không được để trống"],
      trim: true,
    },
    code: {
      type: String,
      unique: true,
      trim: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

// Tạo index tìm kiếm cho các trường thường xuyên được tìm kiếm
brandSchema.index({ name: 1, code: 1 });

const Brand = mongoose.model("Brand", brandSchema);

export default Brand; 