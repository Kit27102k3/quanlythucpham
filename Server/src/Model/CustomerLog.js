import mongoose from 'mongoose';

const customerLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  customerEmail: {
    type: String,
    required: false
  },
  action: {
    type: String,
    required: true,
    enum: ['login', 'logout', 'register', 'password_reset', 'profile_update', 'order_placed', 'payment', 'cart_update', 'review_submitted', 'coupon_used', 'view_product', 'search', 'other']
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending', 'cancelled'],
    default: 'success'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ip: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  deviceInfo: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  sessionId: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Tạo index để tìm kiếm nhanh
customerLogSchema.index({ customerId: 1 });
customerLogSchema.index({ action: 1 });
customerLogSchema.index({ status: 1 });
customerLogSchema.index({ timestamp: -1 });
customerLogSchema.index({ customerEmail: 1 });

// Phương thức tĩnh để tạo log
customerLogSchema.statics.createLog = async function(logData) {
  try {
    return await this.create(logData);
  } catch (error) {
    console.error('Error creating customer log:', error);
    return null;
  }
};

// Phương thức tĩnh để lấy logs của một khách hàng
customerLogSchema.statics.getCustomerLogs = async function(customerId, limit = 50) {
  return this.find({ customerId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Phương thức tĩnh để lấy logs theo loại hành động
customerLogSchema.statics.getLogsByAction = async function(action, limit = 50) {
  return this.find({ action })
    .sort({ timestamp: -1 })
    .limit(limit);
};

const CustomerLog = mongoose.model('CustomerLog', customerLogSchema);

export default CustomerLog; 