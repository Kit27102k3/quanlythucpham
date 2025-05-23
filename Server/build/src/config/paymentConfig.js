"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SEPAY = void 0;
var _dotenv = _interopRequireDefault(require("dotenv"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
/* eslint-disable no-undef */

_dotenv["default"].config();

// Tự động nhận diện môi trường
var isDevelopment = process.env.NODE_ENV !== 'production';

// Cấu hình domain dựa theo môi trường
var SITE_CONFIG = {
  baseUrl: isDevelopment ? "http://localhost:3000" : "https://quanlythucpham.vercel.app",
  apiUrl: isDevelopment ? "http://localhost:8080" : "https://quanlythucpham-azf6.vercel.app"
};
var SEPAY = exports.SEPAY = {
  merchantId: 'DNCFOOD',
  apiToken: process.env.SEPAY_API_TOKEN || 'J63FBVYE2ABYD8RQLHIGETZ1A799DKWZS5PBOYJZJ4HDXSQTSWIUU0RQGTVFATF',
  endpoint: 'https://api.sepay.vn/v1/payments',
  returnUrl: "".concat(SITE_CONFIG.baseUrl, "/payment-result"),
  notifyUrl: "".concat(SITE_CONFIG.apiUrl, "/webhook"),
  qrExpireTime: 60 // 1 tiếng tính bằng phút
};