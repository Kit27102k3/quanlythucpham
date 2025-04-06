const formatCurrency = (amount) => {
  if (!amount) return "0";
  
  // Chuyển đổi thành số nếu là chuỗi
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Kiểm tra nếu không phải số hợp lệ
  if (isNaN(numericAmount)) return "0";
  
  // Định dạng số với dấu chấm phân cách hàng nghìn
  return numericAmount.toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

export default formatCurrency;
