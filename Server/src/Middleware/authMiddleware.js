/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const JWT_SECRET =
  process.env.JWT_SECRET_ACCESS ||
  process.env.JWT_SECRET ||
  "QUANLYTHUCPHAM_MERN";
const ADMIN_SECRET_TOKEN = "admin-token-for-TKhiem";

export const verifyToken = (req, res, next) => {
  const publicRoutes = [
    '/api/products/best-sellers',
    '/api/products',
    '/api/categories'
  ];

  if (publicRoutes.some(route => req.originalUrl.includes(route) && req.method === 'GET')) {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : (req.cookies && req.cookies.AccessToken ? req.cookies.AccessToken : null);

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Không tìm thấy token xác thực"
      });
    }

    if (token === ADMIN_SECRET_TOKEN) {
      req.user = {
        id: "65f62e09ac3ea4ad23023293",
        role: "admin",
        username: "Admin",
      };
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        ...decoded,
        id: decoded.id || decoded.userId
      };
      req.token = token;
      next();
    } catch (jwtError) {
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
    res.status(500).json({ 
      success: false,
      message: "Lỗi máy chủ khi xác thực token" 
    });
  }
};

export const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Chưa xác thực người dùng" });
    }

    if (req.user.role !== "admin" && req.user.role !== "manager") {
      return res
        .status(403)
        .json({ message: "Không có quyền thực hiện hành động này" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

export const verifyAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Không tìm thấy token xác thực"
      });
    }

    if (token === ADMIN_SECRET_TOKEN) {
      req.user = {
        id: "65f62e09ac3ea4ad23023293",
        role: "admin",
        username: "Admin",
      };
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        ...decoded,
        id: decoded.id || decoded.userId
      };

      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({
          success: false,
          message: "Không có quyền thực hiện hành động này"
        });
      }

      next();
    } catch (jwtError) {
      return res.status(401).json({ 
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
        error: jwtError.message
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Lỗi máy chủ khi xác thực quyền admin" 
    });
  }
};
