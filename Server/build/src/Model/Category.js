"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var categorySchema = new _mongoose["default"].Schema({
  nameCategory: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    "default": true
  }
}, {
  timestamps: true
});
var Category = _mongoose["default"].model("Category", categorySchema);
var _default = exports["default"] = Category;