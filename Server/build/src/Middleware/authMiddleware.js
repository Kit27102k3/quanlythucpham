/* eslint-disable no-undef */
/* eslint-disable no-undef */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
"use strict";
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.verifyAdmin = exports.isAdmin = void 0;
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _dotenv = _interopRequireDefault(require("dotenv")); // File: authMiddleware.js

// Khởi tạo biến môi trường
_dotenv.default.config();

/* eslint-disable no-undef */
// Khóa bí mật từ biến môi trường hoặc giá trị mặc định
const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.JWT_SECRET_ACCESS ||
  "QUANLYTHUCPHAM_MERN";
const ADMIN_SECRET_TOKEN = "admin-token-for-TKhiem";
/* eslint-enable no-undef */

const verifyToken = (req, res, next) => {
  // Kiểm tra nếu là một route không yêu cầu xác thực
  const publicRoutes = [
    "/api/products/best-sellers",
    "/api/products",
    "/api/categories",
  ];

  // Kiểm tra nếu đây là route công khai
  if (
    publicRoutes.some(
      (route) => req.originalUrl.includes(route) && req.method === "GET"
    )
  ) {
    return next();
  }

  try {
    // Lấy token từ header hoặc cookie
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : req.cookies && req.cookies.AccessToken
        ? req.cookies.AccessToken
        : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy token xác thực",
      });
    }

    // Kiểm tra xem có phải là token đặc biệt cho admin không
    if (token === ADMIN_SECRET_TOKEN) {
      // Cho phép đặc biệt cho admin
      req.user = {
        id: "65f62e09ac3ea4ad23023293", // ID của admin
        role: "admin",
        username: "Admin",
      };
      return next();
    }

    // Verify token
    try {
      const decoded = _jsonwebtoken.default.verify(token, JWT_SECRET);
      req.user = decoded;

      // Thêm token vào request để sử dụng trong các middleware khác
      req.token = token;

      next();
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token đã hết hạn, vui lòng đăng nhập lại",
          error: "TOKEN_EXPIRED",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
        error: jwtError.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi xác thực token",
    });
  }
};

// Middleware kiểm tra quyền admin
exports.verifyToken = verifyToken;
const isAdmin = (req, res, next) => {
  try {
    // Kiểm tra xem user đã được xác thực chưa
    if (!req.user) {
      console.log("No user found in request");
      return res.status(401).json({ message: "Chưa xác thực người dùng" });
    }

    // Kiểm tra quyền
    if (req.user.role !== "admin") {
      console.log("User role:", req.user.role);
      return res
        .status(403)
        .json({ message: "Không có quyền thực hiện hành động này" });
    }

    // Nếu là admin, cho phép tiếp tục
    next();
  } catch (error) {
    console.error("Error in isAdmin middleware:", error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

// Middleware kiểm tra quyền admin
exports.isAdmin = isAdmin;
const verifyAdmin = (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy token xác thực",
      });
    }

    // Kiểm tra xem có phải là token đặc biệt cho admin không
    if (token === ADMIN_SECRET_TOKEN) {
      // Cho phép đặc biệt cho admin
      req.user = {
        id: "65f62e09ac3ea4ad23023293", // ID của admin
        role: "admin",
        username: "Admin",
      };
      return next();
    }

    // Verify token
    try {
      const decoded = _jsonwebtoken.default.verify(token, JWT_SECRET);
      req.user = decoded;

      // Kiểm tra quyền admin hoặc manager
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({
          success: false,
          message: "Không có quyền thực hiện hành động này",
        });
      }

      next();
    } catch (jwtError) {
      console.log(`[verifyAdmin] Lỗi verify token: ${jwtError.message}`);

      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
        error: jwtError.message,
      });
    }
  } catch (error) {
    console.error("[verifyAdmin] Lỗi:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi xác thực quyền admin",
    });
  }
};

exports.verifyAdmin = verifyAdmin;
