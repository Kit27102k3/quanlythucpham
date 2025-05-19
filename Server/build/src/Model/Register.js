"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var UserSchema = new _mongoose["default"].Schema({
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  address: {
    type: String,
    require: false,
    "default": ""
  },
  userImage: {
    type: String,
    required: false,
    "default": ""
  },
  isBlocked: {
    type: Boolean,
    "default": false
  },
  resetPasswordToken: {
    type: String,
    "default": null
  },
  resetPasswordExpires: {
    type: Date,
    "default": null
  },
  lastLogin: {
    type: Date,
    "default": null
  },
  facebookId: {
    type: String,
    "default": null
  },
  googleId: {
    type: String,
    "default": null
  },
  authProvider: {
    type: String,
    "enum": ['local', 'facebook', 'google'],
    "default": 'local'
  },
  pushSubscriptions: [{
    endpoint: {
      type: String,
      required: true
    },
    expirationTime: {
      type: Date,
      "default": null
    },
    keys: {
      p256dh: {
        type: String,
        required: true
      },
      auth: {
        type: String,
        required: true
      }
    }
  }]
}, {
  timestamps: true
});
var _default = exports["default"] = _mongoose["default"].model("User", UserSchema);