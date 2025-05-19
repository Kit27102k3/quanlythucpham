"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
// File: RefreshToken.js

var RefreshTokenSchema = new _mongoose["default"].Schema({
  userId: {
    type: _mongoose["default"].Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    "enum": ['User', 'Admin']
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Add index for faster queries
RefreshTokenSchema.index({
  token: 1
});
RefreshTokenSchema.index({
  userId: 1
});
RefreshTokenSchema.index({
  expiresAt: 1
}, {
  expireAfterSeconds: 0
});
var _default = exports["default"] = _mongoose["default"].model("RefreshToken", RefreshTokenSchema);