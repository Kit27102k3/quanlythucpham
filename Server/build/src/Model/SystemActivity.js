"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var systemActivitySchema = new _mongoose["default"].Schema({
  user: {
    type: String,
    required: false,
    "default": 'system'
  },
  userId: {
    type: _mongoose["default"].Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  action: {
    type: String,
    required: true
  },
  type: {
    type: String,
    "enum": ['login', 'logout', 'data_update', 'error', 'other'],
    required: true
  },
  status: {
    type: String,
    "enum": ['success', 'failed', 'pending'],
    "default": 'success'
  },
  details: {
    type: _mongoose["default"].Schema.Types.Mixed,
    "default": {}
  },
  ip: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    "default": Date.now
  }
}, {
  timestamps: true
});

// Tạo index để tìm kiếm nhanh
systemActivitySchema.index({
  type: 1
});
systemActivitySchema.index({
  timestamp: -1
});
systemActivitySchema.index({
  status: 1
});
systemActivitySchema.index({
  user: 1
});
var SystemActivity = _mongoose["default"].model('SystemActivity', systemActivitySchema);
var _default = exports["default"] = SystemActivity;