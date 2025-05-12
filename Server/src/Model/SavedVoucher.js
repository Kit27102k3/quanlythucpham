import mongoose from "mongoose";

// Xóa hoàn toàn model SavedVoucher nếu đã tồn tại
mongoose.models = {};
mongoose.modelSchemas = {};

const savedVoucherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coupon",
    required: true
  },
  savedAt: {
    type: Date,
    default: Date.now
  },
  isPaid: {
    type: Boolean,
    default: false
  }
});

// Tạo index mới cho cặp userId và couponId
savedVoucherSchema.index({ userId: 1, couponId: 1 }, { unique: true });

// Tạo model sau khi đã xóa model cũ
const SavedVoucher = mongoose.model("SavedVoucher", savedVoucherSchema);

export default SavedVoucher; 