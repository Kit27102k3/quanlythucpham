"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.verifyToken = exports.isAdmin = void 0;
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _dotenv = _interopRequireDefault(require("dotenv"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
// File: authMiddleware.js

// Khởi tạo biến môi trường
_dotenv["default"].config();

/* eslint-disable no-undef */
// Khóa bí mật từ biến môi trường hoặc giá trị mặc định
var JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_ACCESS || "QUANLYTHUCPHAM_MERN";
var ADMIN_SECRET_TOKEN = "admin-token-for-TKhiem";
/* eslint-enable no-undef */

var verifyToken = exports.verifyToken = function verifyToken(req, res, next) {
  // Kiểm tra nếu là một route không yêu cầu xác thực
  var publicRoutes = ['/api/products/best-sellers', '/api/products', '/api/categories'];

  // Kiểm tra nếu đây là route công khai
  if (publicRoutes.some(function (route) {
    return req.originalUrl.includes(route) && req.method === 'GET';
  })) {
    console.log("[verifyToken] B\u1ECF qua x\xE1c th\u1EF1c cho route c\xF4ng khai: ".concat(req.originalUrl));
    return next();
  }
  try {
    var _req$cookies;
    // Lấy token từ header hoặc cookie
    var authHeader = req.headers.authorization;
    var token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : (_req$cookies = req.cookies) === null || _req$cookies === void 0 ? void 0 : _req$cookies.AccessToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy token xác thực"
      });
    }

    // Kiểm tra xem có phải là token đặc biệt cho admin không
    if (token === ADMIN_SECRET_TOKEN) {
      // Cho phép đặc biệt cho admin
      req.user = {
        id: "65f62e09ac3ea4ad23023293",
        // ID của admin
        role: "admin",
        username: "Admin"
      };
      return next();
    }

    // Verify token
    try {
      var decoded = _jsonwebtoken["default"].verify(token, JWT_SECRET);
      req.user = decoded;

      // Thêm token vào request để sử dụng trong các middleware khác
      req.token = token;
      next();
    } catch (jwtError) {
      console.log("[verifyToken] L\u1ED7i verify token: ".concat(jwtError.message));
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: "Token đã hết hạn, vui lòng đăng nhập lại",
          error: "TOKEN_EXPIRED"
        });
      }
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
        error: jwtError.message
      });
    }
  } catch (error) {
    console.error('[verifyToken] Lỗi:', error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi xác thực token"
    });
  }
};

// Middleware kiểm tra quyền admin
var isAdmin = exports.isAdmin = function isAdmin(req, res, next) {
  try {
    // Kiểm tra xem user đã được xác thực chưa
    if (!req.user) {
      console.log("No user found in request");
      return res.status(401).json({
        message: "Chưa xác thực người dùng"
      });
    }

    // Kiểm tra quyền
    if (req.user.role !== "admin") {
      console.log("User role:", req.user.role);
      return res.status(403).json({
        message: "Không có quyền thực hiện hành động này"
      });
    }

    // Nếu là admin, cho phép tiếp tục
    next();
  } catch (error) {
    console.error("Error in isAdmin middleware:", error);
    return res.status(500).json({
      message: "Lỗi máy chủ nội bộ"
    });
  }
};