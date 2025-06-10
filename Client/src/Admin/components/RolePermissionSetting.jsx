/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";

const PERMISSION_LABELS = {
  dashboard: "Xem dashboard",
  products: "Quản lý sản phẩm",
  categories: "Quản lý danh mục",
  brands: "Quản lý thương hiệu",
  suppliers: "Quản lý nhà cung cấp",
  branches: "Quản lý chi nhánh",
  employees: "Quản lý nhân viên",
  customers: "Quản lý khách hàng",
  orders: "Quản lý đơn hàng",
  reviews: "Quản lý đánh giá",
  contacts: "Quản lý liên hệ",
  messages: "Quản lý tin nhắn",
  coupons: "Quản lý mã giảm giá",
  tips: "Quản lý mẹo hay",
  reports: "Xem báo cáo",
  settings: "Cài đặt hệ thống",
  delivery: "Quản lý giao hàng"
};

// Gom nhóm quyền theo sidebar
const PERMISSION_GROUPS = {
  admin: [
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
      keys: ["products", "categories", "brands", "suppliers", "branches"]
    },
    {
      group: "Quản lý đơn hàng & đánh giá",
      keys: ["orders", "reviews", "delivery"]
    },
    {
      group: "Quản lý khuyến mãi",
      keys: ["coupons", "tips"]
    },
    {
      group: "Khác",
      keys: ["contacts", "messages"]
    }
  ],
  manager: [
    {
      group: "Quản lý chung",
      keys: ["dashboard"]
    },
    {
      group: "Quản lý nhân sự",
      keys: ["employees", "customers"]
    },
    {
      group: "Quản lý sản phẩm",
      keys: ["products", "categories", "brands", "suppliers"]
    },
    {
      group: "Quản lý đơn hàng & đánh giá",
      keys: ["orders", "reviews"]
    },
    {
      group: "Khác",
      keys: ["contacts", "messages"]
    }
  ],
  employee: [
    {
      group: "Quản lý chung",
      keys: ["dashboard"]
    },
    {
      group: "Quản lý sản phẩm",
      keys: ["products"]
    },
    {
      group: "Quản lý khách hàng & đơn hàng",
      keys: ["customers", "orders", "reviews"]
    },
    {
      group: "Khác",
      keys: ["contacts", "messages"]
    }
  ],
  shipper: [
    {
      group: "Giao hàng",
      keys: ["delivery", "orders"]
    }
  ]
};

// Danh sách tất cả các quyền có thể có
const ALL_PERMISSIONS = [
  "dashboard", "products", "categories", "brands", "suppliers", "branches", 
  "employees", "customers", "orders", "reviews", "contacts", "messages", 
  "coupons", "tips", "reports", "settings", "delivery"
];

const RolePermissionSetting = ({ role, permissions, onChange }) => {
  // permissions là mảng key quyền hiện tại của role (ví dụ: ["employees", "reviews", ...])
  const [currentPerms, setCurrentPerms] = useState(permissions);
  const [availableGroups, setAvailableGroups] = useState([]);

  useEffect(() => {
    // Lấy nhóm quyền phù hợp với vai trò
    setAvailableGroups(PERMISSION_GROUPS[role] || PERMISSION_GROUPS.admin);
  }, [role]);

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
      {availableGroups.map(group => (
        <div key={group.group} className="mb-6">
          <h3 className="font-bold mb-2">{group.group}</h3>
          <div className="flex gap-6 flex-wrap">
            {group.keys.map(key => (
              <label key={key} className="flex items-center min-w-[220px]">
                <input
                  type="checkbox"
                  checked={currentPerms.includes(key)}
                  onChange={() => handleToggle(key)}
                  className="form-checkbox h-5 w-5 text-green-600"
                />
                <span className="ml-2">{PERMISSION_LABELS[key] || key}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {role === "admin" && (
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700 mb-2">
            <i className="pi pi-info-circle mr-1"></i>
            Admin có quyền truy cập tất cả các tính năng của hệ thống.
          </p>
        </div>
      )}
    </div>
  );
};

export default RolePermissionSetting; 