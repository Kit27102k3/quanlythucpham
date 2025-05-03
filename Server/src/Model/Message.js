import mongoose from "mongoose";
const { Schema } = mongoose;

// Schema cho một tin nhắn đơn lẻ trong cuộc hội thoại
const MessageItemSchema = new Schema({
  text: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Schema chính cho cuộc hội thoại
const ConversationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  messages: [MessageItemSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Number,
    default: 0
  }
});

// Tự động cập nhật lastUpdated khi có tin nhắn mới
ConversationSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Tạo model từ schema với tên collection cụ thể (để tránh xung đột)
const Conversation = mongoose.model("Conversation", ConversationSchema, "conversations");

export default Conversation; 