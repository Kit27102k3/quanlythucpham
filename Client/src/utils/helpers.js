/**
 * Tập hợp các hàm tiện ích cho ứng dụng
 */

/**
 * Format ngày tháng theo định dạng mặc định hoặc tùy chỉnh
 * @param {string|Date} date - Ngày cần định dạng
 * @param {object} options - Tùy chọn định dạng
 * @returns {string} Chuỗi ngày đã định dạng
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Ngày không hợp lệ';
    
    // Nếu chỉ muốn hiển thị ngày/tháng/năm
    if (options.dateOnly) {
      return dateObj.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    }
    
    // Sử dụng options mặc định nếu không có options nào được cung cấp
    const finalOptions = Object.keys(options).length > 0 ? options : defaultOptions;
    
    return dateObj.toLocaleString('vi-VN', finalOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Ngày không hợp lệ';
  }
};

/**
 * Định dạng số thành chuỗi tiền tệ với đơn vị VND
 * @param {number} amount - Số tiền cần định dạng
 * @param {boolean} showSymbol - Có hiển thị ký hiệu tiền tệ không
 * @returns {string} Chuỗi tiền tệ đã định dạng
 */
export const formatCurrency = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 ₫';
  
  try {
    const formatter = new Intl.NumberFormat('vi-VN', {
      style: showSymbol ? 'currency' : 'decimal',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    return formatter.format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '0 ₫';
  }
};

/**
 * Tạo slug từ chuỗi văn bản (sử dụng cho URL)
 * @param {string} text - Chuỗi cần chuyển thành slug
 * @returns {string} Slug đã tạo
 */
export const createSlug = (text) => {
  if (!text) return '';
  
  try {
    // Chuyển về chữ thường, thay thế các ký tự đặc biệt và dấu cách bằng dấu gạch ngang
    const slug = text.toLowerCase()
      .normalize('NFD') // Chuẩn hóa Unicode
      .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu thanh
      .replace(/[đĐ]/g, 'd') // Thay thế đ/Đ
      .replace(/[^a-z0-9\s-]/g, '') // Loại bỏ ký tự đặc biệt
      .replace(/\s+/g, '-') // Thay thế dấu cách bằng dấu gạch ngang
      .replace(/-+/g, '-') // Loại bỏ dấu gạch ngang liên tiếp
      .trim();
      
    return slug;
  } catch (error) {
    console.error('Error creating slug:', error);
    return '';
  }
};

/**
 * Rút ngắn chuỗi văn bản với dấu chấm lửng nếu vượt quá độ dài tối đa
 * @param {string} text - Chuỗi cần rút ngắn
 * @param {number} maxLength - Độ dài tối đa
 * @returns {string} Chuỗi đã rút ngắn
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
};

/**
 * Lấy tên hiển thị từ thông tin người dùng
 * @param {object} user - Đối tượng chứa thông tin người dùng
 * @returns {string} Tên hiển thị
 */
export const getUserDisplayName = (user) => {
  if (!user) return 'Người dùng';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  if (user.fullName) {
    return user.fullName;
  }
  
  if (user.userName) {
    return user.userName;
  }
  
  return 'Người dùng';
}; 