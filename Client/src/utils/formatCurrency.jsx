/**
 * Hàm định dạng số tiền thành định dạng tiền tệ VND
 * @param {number} amount - Số tiền cần định dạng
 * @returns {string} Chuỗi định dạng tiền tệ
 */
const formatCurrency = (amount) => {
  // Đảm bảo amount là số
  const numAmount = Number(amount);
  
  // Kiểm tra nếu không phải số hợp lệ
  if (isNaN(numAmount)) return "0 ₫";
  
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(numAmount);
};

// Export cả named export và default export
export { formatCurrency };
export default formatCurrency; 