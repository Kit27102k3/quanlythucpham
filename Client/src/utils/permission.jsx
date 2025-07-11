export const canAccess = (role, pageKey) => {
  const savedPermissions = localStorage.getItem("rolePermissions");
  let permissions;

  if (savedPermissions) {
    permissions = JSON.parse(savedPermissions);
  } else {
    permissions = {
      admin: [
        "employees",
        "reviews",
        "contacts",
        "customers",
        "messages",
        "orders",
        "dashboard",
        "products",
        "categories",
        "coupons",
        "tips",
        "reports",
        "settings",
        "suppliers",
        "brands",
        "branches",
      ],
      manager: [
        "employees",
        "reviews",
        "contacts",
        "customers",
        "messages",
        "orders",
        "suppliers",
        "products",
        "categories",
        "brands",
      ],
      employee: ["reviews", "contacts", "messages", "orders"],
      shipper: ["delivery"],
    };
  }
  return permissions[role]?.includes(pageKey);
};
