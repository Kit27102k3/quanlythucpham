import mongoose from "mongoose";

// Định nghĩa schema cho tin nhắn
const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ["user", "bot"],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  type: {
    type: String,
    enum: ["text", "image", "file"],
    default: "text",
  },
});

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userInfo: {
    name: String,
    email: String,
    phone: String,
  },
  messages: [messageSchema],
  status: {
    type: String,
    enum: ["active", "closed"],
    default: "active",
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  createAt: {
    type: Date,
    default: Date.now,
  },
  updateAt: {
    type: Date,
    default: Date.now,
  },
});

chatSchema.pre("save", function (next) {
  this.updateAt = Date.now();
  next();
});

// Tạo model từ schema
const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
