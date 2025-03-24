import mongoose from "mongoose";

// Định nghĩa schema cho tin nhắn
const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ["user", "bot"], // Chỉ cho phép 'user' hoặc 'bot'
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now, // Mặc định là thời gian hiện tại
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId, // ID sản phẩm liên quan
    ref: "Product", // Tham chiếu đến collection Product (nếu có)
  },
  type: {
    type: String,
    enum: ["text", "image", "file"], // Phân loại tin nhắn
    default: "text", // Mặc định là tin nhắn văn bản
  },
});

// Định nghĩa schema cho cuộc trò chuyện
const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // ID người dùng
    ref: "User", // Tham chiếu đến collection User (nếu có)
    required: true,
  },
  userInfo: {
    name: String, // Tên người dùng
    email: String, // Email người dùng
    phone: String, // Số điện thoại người dùng
  },
  messages: [messageSchema], // Mảng các tin nhắn
  status: {
    type: String,
    enum: ["active", "closed"], // Trạng thái cuộc trò chuyện
    default: "active", // Mặc định là 'active'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5, // Đánh giá từ 1 đến 5 sao
  },
  createAt: {
    type: Date,
    default: Date.now, // Mặc định là thời gian hiện tại
  },
  updateAt: {
    type: Date,
    default: Date.now, // Mặc định là thời gian hiện tại
  },
});

// Tự động cập nhật trường updateAt mỗi khi document được cập nhật
chatSchema.pre("save", function (next) {
  this.updateAt = Date.now();
  next();
});

// Tạo model từ schema
const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
