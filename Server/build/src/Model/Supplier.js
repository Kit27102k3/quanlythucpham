"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var supplierSchema = new _mongoose["default"].Schema({
  name: {
    type: String,
    required: [true, "Tên nhà cung cấp không được để trống"],
    trim: true
  },
  code: {
    type: String,
    unique: true,
    trim: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    required: [true, "Số điện thoại không được để trống"],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  taxCode: {
    type: String,
    trim: true
  },
  notes: {
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
supplierSchema.index({
  name: 1,
  code: 1,
  contactPerson: 1
});
var Supplier = _mongoose["default"].model("Supplier", supplierSchema);
var _default = exports["default"] = Supplier;