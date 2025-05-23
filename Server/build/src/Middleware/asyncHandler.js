"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.asyncHandler = void 0;
/**
 * Middleware để xử lý lỗi không đồng bộ
 * Giúp giảm thiểu việc sử dụng try/catch trong các controller
 * @param {Function} fn - Hàm controller cần wrap
 * @returns {Function} Middleware function
 */
var asyncHandler = exports.asyncHandler = function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next))["catch"](function (error) {
      console.error("[AsyncHandler Error]: ".concat(error.message));
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Lỗi máy chủ nội bộ',
        stack: process.env.NODE_ENV === 'production' ? null : error.stack
      });
    });
  };
};