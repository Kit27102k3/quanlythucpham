"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var contactSchema = new _mongoose["default"].Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  isRead: {
    type: Boolean,
    "default": false
  },
  isReplied: {
    type: Boolean,
    "default": false
  }
}, {
  timestamps: true
});
var Contact = _mongoose["default"].model("Contact", contactSchema);
var _default = exports["default"] = Contact;