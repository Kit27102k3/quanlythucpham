"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var couponSchema = new _mongoose["default"].Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    "enum": ['percentage', 'fixed'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  minOrder: {
    type: Number,
    required: true,
    min: 0
  },
  maxDiscount: {
    type: Number,
    min: 0
  },
  expiresAt: {
    type: Date
  },
  usageLimit: {
    type: Number,
    min: 0
  },
  used: {
    type: Number,
    "default": 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    "default": true
  },
  createdAt: {
    type: Date,
    "default": Date.now
  },
  description: {
    type: String,
    "default": ""
  }
}, {
  timestamps: true
});

// Tạo index để tìm kiếm nhanh
couponSchema.index({
  code: 1
});
couponSchema.index({
  expiresAt: 1
});
couponSchema.index({
  isActive: 1
});
var Coupon = _mongoose["default"].model("Coupon", couponSchema);
var _default = exports["default"] = Coupon;