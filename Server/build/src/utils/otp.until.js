"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateOTP = void 0;
var generateOTP = exports.generateOTP = function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};