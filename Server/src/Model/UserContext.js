import mongoose from 'mongoose';

const userContextSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  lastQuery: {
    type: String,
    default: ''
  },
  lastProduct: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  lastProducts: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  lastComparison: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  lastRecipe: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  conversationHistory: {
    type: Array,
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Tự động xóa sau 24 giờ (86400 giây)
  }
}, { timestamps: true });

// Đảm bảo index cho userId để tìm kiếm nhanh
userContextSchema.index({ userId: 1 });

const UserContext = mongoose.model('UserContext', userContextSchema);

export default UserContext; 