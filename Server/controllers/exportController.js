const fs = require('fs');
const path = require('path');

/**
 * Xử lý yêu cầu xuất file Excel
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const exportExcel = async (req, res) => {
  try {
    const { fileName, targetPath, data } = req.body;
    
    if (!fileName || !data) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin file hoặc dữ liệu'
      });
    }
    
    // Đường dẫn thư mục lưu file
    const dirPath = targetPath || 'D:/LUANVANTOTNGHIEP/Voucher/';
    
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Đường dẫn đầy đủ của file
    const filePath = path.join(dirPath, fileName);
    
    // Chuyển đổi dữ liệu Base64 thành buffer
    const buffer = Buffer.from(data, 'base64');
    
    // Ghi file
    fs.writeFileSync(filePath, buffer);
    
    return res.status(200).json({
      success: true,
      message: 'Xuất file thành công',
      filePath
    });
  } catch (error) {
    console.error('Error exporting Excel file:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xuất file Excel'
    });
  }
};

module.exports = {
  exportExcel
}; 