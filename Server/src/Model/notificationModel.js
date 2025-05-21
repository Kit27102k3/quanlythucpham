import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    data: {
      type: Object,
      default: {}
    },
    isRead: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'pending_view', 'viewed'],
      default: 'pending'
    },
    error: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// Tạo index cho truy vấn nhanh hơn
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ isRead: 1 });

// Tự động xóa thông báo cũ sau 30 ngày
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 