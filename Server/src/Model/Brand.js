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
      trim: true,
      required: [true, "Mã thương hiệu không được để trống"],
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

// Tạm thời bỏ tất cả các indexes để giải quyết lỗi
// Sau khi giải quyết được lỗi, chúng ta sẽ thêm lại indexes này
brandSchema.index({ code: 1, branchId: 1 }, { unique: true });
brandSchema.index({ name: 1 });

// Thêm middleware để tự động xóa indexes khi khởi động
brandSchema.pre('init', async function() {
  try {
    await mongoose.connection.collections['brands'].dropIndexes();
    console.log('Đã xóa tất cả indexes của Brand collection');
  } catch (error) {
    console.error('Lỗi khi xóa indexes:', error);
  }
});

const Brand = mongoose.model("Brand", brandSchema);

export default Brand; 