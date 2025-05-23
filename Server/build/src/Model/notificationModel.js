"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var notificationSchema = new _mongoose["default"].Schema({
  userId: {
    type: _mongoose["default"].Schema.Types.ObjectId,
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
    "default": {}
  },
  isRead: {
    type: Boolean,
    "default": false
  },
  status: {
    type: String,
    "enum": ['pending', 'sent', 'failed', 'pending_view', 'viewed'],
    "default": 'pending'
  },
  error: {
    type: String,
    "default": null
  }
}, {
  timestamps: true
});

// Tạo index cho truy vấn nhanh hơn
notificationSchema.index({
  userId: 1,
  createdAt: -1
});
notificationSchema.index({
  status: 1
});
notificationSchema.index({
  isRead: 1
});

// Tự động xóa thông báo cũ sau 30 ngày
notificationSchema.index({
  createdAt: 1
}, {
  expireAfterSeconds: 2592000
});
var Notification = _mongoose["default"].model('Notification', notificationSchema);
var _default = exports["default"] = Notification;