import User from '../Model/Register.js';
import mongoose from 'mongoose';

// Lấy ID của admin từ cơ sở dữ liệu hoặc sử dụng một ID cố định
export const getAdminId = async () => {
  // Lấy ID của admin đầu tiên trong cơ sở dữ liệu
  try {
    // Tìm người dùng đầu tiên (có thể là admin) để test
    const anyUser = await User.findOne({}).select('_id');
    if (anyUser) {
      return anyUser._id;
    }
    
    // Fallback: Tìm admin nếu có
    const adminUser = await User.findOne({ role: 'admin' }).select('_id');
    if (adminUser) {
      return adminUser._id;
    }
    
    // Nếu không tìm thấy, trả về một ID cố định hoặc ID của một tài khoản mặc định
    return new mongoose.Types.ObjectId('67db0c092c1d10f927cf6d69'); // Thay bằng ID người dùng thực tế
  } catch (error) {
    console.error('Lỗi khi lấy ID admin:', error);
    return new mongoose.Types.ObjectId('67db0c092c1d10f927cf6d69'); // Thay bằng ID người dùng thực tế 
  }
}; 