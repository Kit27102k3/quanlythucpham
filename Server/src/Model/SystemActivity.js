import mongoose from 'mongoose';

const systemActivitySchema = new mongoose.Schema({
  user: {
    type: String,
    required: false,
    default: 'system'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  action: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['login', 'logout', 'data_update', 'error', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
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
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Tạo index để tìm kiếm nhanh
systemActivitySchema.index({ type: 1 });
systemActivitySchema.index({ timestamp: -1 });
systemActivitySchema.index({ status: 1 });
systemActivitySchema.index({ user: 1 });

const SystemActivity = mongoose.model('SystemActivity', systemActivitySchema);

export default SystemActivity; 