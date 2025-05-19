"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
// Định nghĩa schema cho tin nhắn
var messageSchema = new _mongoose["default"].Schema({
  sender: {
    type: String,
    "enum": ["user", "bot"],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    "default": Date.now
  },
  productId: {
    type: _mongoose["default"].Schema.Types.ObjectId,
    ref: "Product"
  },
  type: {
    type: String,
    "enum": ["text", "image", "file"],
    "default": "text"
  }
});
var chatSchema = new _mongoose["default"].Schema({
  userId: {
    type: _mongoose["default"].Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  userInfo: {
    name: String,
    email: String,
    phone: String
  },
  messages: [messageSchema],
  status: {
    type: String,
    "enum": ["active", "closed"],
    "default": "active"
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  createAt: {
    type: Date,
    "default": Date.now
  },
  updateAt: {
    type: Date,
    "default": Date.now
  }
});
chatSchema.pre("save", function (next) {
  this.updateAt = Date.now();
  next();
});

// Tạo model từ schema
var Chat = _mongoose["default"].model("Chat", chatSchema);
var _default = exports["default"] = Chat;