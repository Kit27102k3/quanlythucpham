"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var tipSchema = new _mongoose["default"].Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    "enum": ['Mua Sắm', 'Bảo Quản', 'Nấu Ăn', 'Kiến Thức', 'Làm Vườn']
  },
  image: {
    type: String
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: String,
    "default": 'DNC Food'
  },
  authorTitle: {
    type: String,
    "default": 'Chuyên gia dinh dưỡng'
  },
  tags: {
    type: [String]
  },
  likes: {
    type: Number,
    "default": 0
  },
  datePublished: {
    type: Date,
    "default": Date.now
  },
  isFeatured: {
    type: Boolean,
    "default": false
  }
}, {
  timestamps: true
});
var Tip = _mongoose["default"].model("Tip", tipSchema);
var _default = exports["default"] = Tip;