"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
// Xóa hoàn toàn model SavedVoucher nếu đã tồn tại
_mongoose["default"].models = {};
_mongoose["default"].modelSchemas = {};
var savedVoucherSchema = new _mongoose["default"].Schema({
  userId: {
    type: _mongoose["default"].Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  couponId: {
    type: _mongoose["default"].Schema.Types.ObjectId,
    ref: "Coupon",
    required: true
  },
  savedAt: {
    type: Date,
    "default": Date.now
  },
  isPaid: {
    type: Boolean,
    "default": false
  }
});

// Tạo index mới cho cặp userId và couponId
savedVoucherSchema.index({
  userId: 1,
  couponId: 1
}, {
  unique: true
});

// Tạo model sau khi đã xóa model cũ
var SavedVoucher = _mongoose["default"].model("SavedVoucher", savedVoucherSchema);
var _default = exports["default"] = SavedVoucher;