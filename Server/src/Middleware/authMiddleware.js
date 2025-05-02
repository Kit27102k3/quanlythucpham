// File: authMiddleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Khởi tạo biến môi trường
dotenv.config();

// Khóa bí mật từ biến môi trường
const JWT_SECRET = process.env.JWT_SECRET_ACCESS || 'your_jwt_secret';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access Denied - No token provided" });
    }

    const token = authHeader.split(' ')[1];
    
    // Kiểm tra xem có phải là token đặc biệt cho TKhiem không
    if (token === 'admin-token-for-TKhiem') {
      // Cho phép đặc biệt cho admin TKhiem
      req.user = {
        id: '67ee8bb1478f5c2b3a566552',
        role: 'admin',
        username: 'TKhiem'
      };
      return next();
    }
    
    // Xác thực JWT token thông thường
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    return res.status(401).json({ message: 'Invalid Token' });
  }
};