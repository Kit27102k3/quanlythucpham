"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var Schema = _mongoose["default"].Schema;

// Schema cho một tin nhắn đơn lẻ trong cuộc hội thoại
var MessageItemSchema = new Schema({
  text: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    "enum": ['user', 'admin'],
    required: true
  },
  read: {
    type: Boolean,
    "default": false
  },
  timestamp: {
    type: Date,
    "default": Date.now
  }
});

// Schema chính cho cuộc hội thoại
var ConversationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    "default": null
  },
  messages: [MessageItemSchema],
  lastUpdated: {
    type: Date,
    "default": Date.now
  },
  unreadCount: {
    type: Number,
    "default": 0
  }
});

// Tự động cập nhật lastUpdated khi có tin nhắn mới
ConversationSchema.pre('save', function (next) {
  this.lastUpdated = new Date();
  next();
});

// Tạo model từ schema với tên collection cụ thể (để tránh xung đột)
var Conversation = _mongoose["default"].model("Conversation", ConversationSchema, "conversations");
var _default = exports["default"] = Conversation;