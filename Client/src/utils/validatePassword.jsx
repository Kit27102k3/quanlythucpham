/**
 * Kiểm tra mật khẩu có đủ mạnh không
 * @param {string} password - Mật khẩu cần kiểm tra
 * @returns {boolean} - Kết quả kiểm tra
 */
const validatePassword = (password) => {
  // Kiểm tra độ dài tối thiểu 8 ký tự
  if (!password || password.length < 8) {
    return false;
  }
  
  // Kiểm tra chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>\\/?]/.test(password);
  
  // Mật khẩu phải đáp ứng ít nhất 3 trong 4 điều kiện
  const conditionsMet = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;
  
  return conditionsMet >= 3;
};

export default validatePassword; 