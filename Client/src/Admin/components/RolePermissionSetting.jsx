import React, { useState } from "react";

// Map key quyền sang label tiếng Việt
const PERMISSION_LABELS = {
  employees: "Quản lý nhân viên",
  reviews: "Quản lý đánh giá",
  contacts: "Quản lý liên hệ",
  customers: "Quản lý khách hàng",
  messages: "Quản lý tin nhắn",
  orders: "Quản lý đơn hàng",
  dashboard: "Xem dashboard",
  products: "Quản lý sản phẩm",
  categories: "Quản lý danh mục",
  coupons: "Quản lý mã giảm giá",
  tips: "Quản lý mẹo hay",
  reports: "Xem báo cáo",
  settings: "Cài đặt hệ thống"
};

// Gom nhóm quyền theo sidebar
const PERMISSION_GROUPS = [
  {
    group: "Quản lý chung",
    keys: ["dashboard", "reports", "settings"]
  },
  {
    group: "Quản lý nhân sự",
    keys: ["employees", "customers"]
  },
  {
    group: "Quản lý sản phẩm",
    keys: ["products", "categories", "coupons", "tips"]
  },
  {
    group: "Quản lý đơn hàng & đánh giá",
    keys: ["orders", "reviews"]
  },
  {
    group: "Khác",
    keys: ["contacts", "messages"]
  }
];

const RolePermissionSetting = ({ role, permissions, onChange }) => {
  // permissions là mảng key quyền hiện tại của role (ví dụ: ["employees", "reviews", ...])
  const [currentPerms, setCurrentPerms] = useState(permissions);

  const handleToggle = (permKey) => {
    let newPerms;
    if (currentPerms.includes(permKey)) {
      newPerms = currentPerms.filter(k => k !== permKey);
    } else {
      newPerms = [...currentPerms, permKey];
    }
    setCurrentPerms(newPerms);
    onChange && onChange(newPerms);
  };

  return (
    <div>
      {PERMISSION_GROUPS.map(group => (
        <div key={group.group} style={{ marginBottom: 24 }}>
          <h3 style={{ fontWeight: "bold", marginBottom: 8 }}>{group.group}</h3>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {group.keys.map(key => (
              <label key={key} style={{ display: "flex", alignItems: "center", minWidth: 220 }}>
                <input
                  type="checkbox"
                  checked={currentPerms.includes(key)}
                  onChange={() => handleToggle(key)}
                />
                <span style={{ marginLeft: 8 }}>{PERMISSION_LABELS[key] || key}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RolePermissionSetting; 