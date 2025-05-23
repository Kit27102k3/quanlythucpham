"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var brandSchema = new _mongoose["default"].Schema({
  name: {
    type: String,
    required: [true, "Tên thương hiệu không được để trống"],
    trim: true
  },
  code: {
    type: String,
    unique: true,
    trim: true
  },
  logo: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    "enum": ["active", "inactive"],
    "default": "active"
  },
  createdBy: {
    type: _mongoose["default"].Schema.Types.ObjectId,
    ref: "Admin"
  },
  updatedBy: {
    type: _mongoose["default"].Schema.Types.ObjectId,
    ref: "Admin"
  }
}, {
  timestamps: true
});

// Tạo index tìm kiếm cho các trường thường xuyên được tìm kiếm
brandSchema.index({
  name: 1,
  code: 1
});
var Brand = _mongoose["default"].model("Brand", brandSchema);
var _default = exports["default"] = Brand;