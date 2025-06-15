import fs from 'fs';
import path from 'path';

/**
 * Xử lý yêu cầu xuất file Excel
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const exportExcel = async (req, res) => {
  try {
    const { fileName, data } = req.body;
    
    if (!fileName || !data) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin file hoặc dữ liệu'
      });
    }
    
    // Chuyển đổi dữ liệu Base64 thành buffer
    const buffer = Buffer.from(data, 'base64');
    
    // Thiết lập headers cho việc tải file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Length', buffer.length);
    
    // Gửi buffer trực tiếp về client để tải xuống
    return res.send(buffer);
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