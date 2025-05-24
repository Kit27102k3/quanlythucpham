/* eslint-disable no-undef */
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({path: '.env'});

/**
 * Middleware xác thực cho API truy cập MongoDB
 * Yêu cầu JWT token hợp lệ trong header Authorization
 */
const apiAuth = (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Missing or invalid token format.'
      });
    }
    
    // Lấy token từ header
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_ACCESS);
    
    // Lưu thông tin user vào request để sử dụng ở các middleware và controller tiếp theo
    req.user = decoded;
    
    // Kiểm tra quyền truy cập nếu cần
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    
    console.error('API Authentication Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

export default apiAuth; 