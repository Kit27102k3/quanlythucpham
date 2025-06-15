import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên nhà cung cấp không được để trống"],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      required: [true, "Mã nhà cung cấp không được để trống"],
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Số điện thoại không được để trống"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    taxCode: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Chi nhánh không được để trống"],
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

// Thêm compound index để đảm bảo cặp (code, branchId) là duy nhất
supplierSchema.index({ code: 1, branchId: 1 }, { unique: true });
// Tạo index tìm kiếm cho các trường thường xuyên được tìm kiếm
supplierSchema.index({ name: 1, contactPerson: 1 });

// Thêm middleware để tự động xóa indexes khi khởi động (tạm thời để giải quyết vấn đề với index cũ)
supplierSchema.pre('init', async function() {
  try {
    await mongoose.connection.collections['suppliers'].dropIndexes();
  } catch (error) {
    console.error('Lỗi khi xóa indexes:', error);
  }
});

const Supplier = mongoose.model("Supplier", supplierSchema);

export default Supplier; 