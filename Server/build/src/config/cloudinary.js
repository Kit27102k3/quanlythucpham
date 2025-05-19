"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _cloudinary = require("cloudinary");
var _dotenv = _interopRequireDefault(require("dotenv"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
/* eslint-disable no-undef */

_dotenv["default"].config();
var requiredConfig = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
for (var _i = 0, _requiredConfig = requiredConfig; _i < _requiredConfig.length; _i++) {
  var key = _requiredConfig[_i];
  if (!process.env[key]) {
    throw new Error("Missing required Cloudinary config: ".concat(key));
  }
}
_cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});
var _default = exports["default"] = _cloudinary.v2;