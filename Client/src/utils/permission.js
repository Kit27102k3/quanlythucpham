// Hàm kiểm tra quyền thao tác sidebar/trang theo vai trò
export const canAccess = (role, pageKey) => {
  // Lấy quyền từ localStorage
  const savedPermissions = localStorage.getItem("rolePermissions");
  let permissions;

  if (savedPermissions) {
    permissions = JSON.parse(savedPermissions);
  } else {
    // Nếu không có trong localStorage, dùng quyền mặc định
    permissions = {
      admin: [
        "employees", "reviews", "contacts", "customers", "messages", "orders",
        "dashboard", "products", "categories", "coupons", "tips", "reports", "settings", "suppliers", "brands"
      ],
      manager: ["employees", "reviews", "contacts", "customers", "messages", "orders", "suppliers", "brands"],
      employee: ["reviews", "contacts", "messages", "orders"],
    };
  }

  // Kiểm tra quyền của vai trò hiện tại
  return permissions[role]?.includes(pageKey);
}; 