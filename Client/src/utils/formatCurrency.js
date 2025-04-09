export const formatCurrency = (amount) => {
  if (!amount) return "0 ₫";
  
  // Convert to number if it's a string
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  // Format the number with Vietnamese currency format
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericAmount);
}; 