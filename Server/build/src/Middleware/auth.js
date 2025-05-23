"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.verifyToken = exports.checkRole = void 0;
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

var verifyToken = exports.verifyToken = function verifyToken(req, res, next) {
  try {
    var _req$headers$authoriz;
    var token = (_req$headers$authoriz = req.headers.authorization) === null || _req$headers$authoriz === void 0 ? void 0 : _req$headers$authoriz.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        message: "Không tìm thấy token"
      });
    }
    var decoded = _jsonwebtoken["default"].verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token không hợp lệ"
    });
  }
};
var checkRole = exports.checkRole = function checkRole(roles) {
  return function (req, res, next) {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập"
      });
    }
    next();
  };
};