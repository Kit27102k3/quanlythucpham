import Admin from '../Model/Admin.js';
import dotenv from 'dotenv';

// Cấu hình dotenv
dotenv.config();

// Lấy ID của admin từ cơ sở dữ liệu hoặc sử dụng một ID cố định
export const getAdminId = async () => {
  // Lấy ID của admin đầu tiên trong cơ sở dữ liệu
  try {
    const adminUser = await Admin.findOne({ role: 'admin' }).select('_id');
    return adminUser._id;
  } catch (error) {
    console.error('Lỗi khi lấy ID admin:', error);
  }
}; 