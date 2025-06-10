import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load biến môi trường
dotenv.config();

/**
 * Middleware xác thực JWT token
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {function} next - Next middleware function
 */
export const verifyToken = (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    // Nếu không có token, cho phép truy cập nhưng đánh dấu là không xác thực
    if (!token) {
      req.user = null;
      return next();
    }

    // Xác thực token
    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, decoded) => {
      if (err) {
        // Token không hợp lệ, cho phép truy cập nhưng đánh dấu là không xác thực
        req.user = null;
        return next();
      }

      // Token hợp lệ, lưu thông tin người dùng vào request
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Lỗi xác thực token:', error);
    req.user = null;
    next();
  }
}; 