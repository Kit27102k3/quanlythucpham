export const canAccess = (role, pageKey) => {
  const savedPermissions = localStorage.getItem("rolePermissions");
  let permissions;

  if (savedPermissions) {
    permissions = JSON.parse(savedPermissions);
  } else {
    permissions = {
      admin: [
        "dashboard",
        "products",
        "categories",
        "brands",
        "suppliers",
        "branches",
        "employees",
        "customers",
        "orders",
        "reviews",
        "contacts",
        "messages",
        "coupons",
        "tips",
        "reports",
        "settings",
      ],
      manager: [
        "dashboard",
        "products",
        "categories",
        "brands",
        "suppliers",
        "branches",
        "employees",
        "customers",
        "orders",
        "reviews",
        "contacts",
        "messages",
        "coupons",
        "tips",
        "reports",
      ],
      employee: [

        "orders",
        "customers",
        "reviews",
        "contacts",
        "messages"
      ],
      shipper: ["delivery"]
    };
  }
  return permissions[role]?.includes(pageKey);
}; 