export const formatDate = (date, options = {}) => {
  if (!date) return "";

  const defaultOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "Ngày không hợp lệ";

    if (options.dateOnly) {
      return dateObj.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }

    const finalOptions =
      Object.keys(options).length > 0 ? options : defaultOptions;

    return dateObj.toLocaleString("vi-VN", finalOptions);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Ngày không hợp lệ";
  }
};

export const formatCurrency = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) return "0 ₫";

  try {
    const formatter = new Intl.NumberFormat("vi-VN", {
      style: showSymbol ? "currency" : "decimal",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return formatter.format(amount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return "0 ₫";
  }
};

export const createSlug = (text) => {
  if (!text) return "";

  try {
    const slug = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    return slug;
  } catch (error) {
    console.error("Error creating slug:", error);
    return "";
  }
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return "";

  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength) + "...";
};

export const getUserDisplayName = (user) => {
  if (!user) return "Người dùng";

  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  if (user.fullName) {
    return user.fullName;
  }

  if (user.userName) {
    return user.userName;
  }

  return "Người dùng";
};
