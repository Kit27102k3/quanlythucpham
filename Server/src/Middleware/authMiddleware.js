// File: authMiddleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Khởi tạo biến môi trường
dotenv.config();

/* eslint-disable no-undef */
// Khóa bí mật từ biến môi trường hoặc giá trị mặc định
const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.JWT_SECRET_ACCESS ||
  "QUANLYTHUCPHAM_MERN";
const ADMIN_SECRET_TOKEN = "admin-token-for-TKhiem";
/* eslint-enable no-undef */

export const verifyToken = async (req, res, next) => {
  try {
    // Kiểm tra admin-token header trước
    const adminToken = req.headers["admin-token"];
    if (adminToken === ADMIN_SECRET_TOKEN) {
      // Cho phép đặc biệt cho admin
      req.user = {
        id: "65f62e09ac3ea4ad23023293", // ID của admin
        role: "admin",
        username: "Admin",
      };
      return next();
    }

    // Tiếp tục với xác thực Bearer token tiêu chuẩn
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No token provided in header");
      return res
        .status(401)
        .json({ message: "Access Denied - No token provided" });
    }

    const token = authHeader.split(" ")[1];

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

    // Xác thực JWT token thông thường
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }
    return res.status(401).json({ message: "Invalid Token" });
  }
};

// Middleware kiểm tra quyền admin
export const isAdmin = (req, res, next) => {
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
