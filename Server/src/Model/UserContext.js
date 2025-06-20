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

/**
 * Lưu context của người dùng
 * @param {string} userId - ID của người dùng
 * @param {object} context - Dữ liệu context cần lưu
 * @returns {Promise<object>} - Context đã được cập nhật
 */
export const saveContext = async (userId, context) => {
  try {
    // Tìm và cập nhật context của người dùng, nếu không có thì tạo mới
    const updatedContext = await UserContext.findOneAndUpdate(
      { userId },
      { $set: context },
      { new: true, upsert: true }
    );
    
    return updatedContext;
  } catch (error) {
    console.error("Lỗi khi lưu context:", error);
    throw error;
  }
};

/**
 * Lấy context của người dùng
 * @param {string} userId - ID của người dùng
 * @returns {Promise<object>} - Context của người dùng
 */
export const getUserContext = async (userId) => {
  try {
    const userContext = await UserContext.findOne({ userId });
    return userContext;
  } catch (error) {
    console.error("Lỗi khi lấy context:", error);
    return null;
  }
};

export default UserContext; 