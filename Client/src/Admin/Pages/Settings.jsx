import { useState, useEffect } from "react";
import RolePermissionSetting from "../components/RolePermissionSetting";
import adminApi from "../../api/adminApi";

const ROLES = [
  { key: "admin", label: "Quản trị viên" },
  { key: "manager", label: "Quản lý" },
  { key: "employee", label: "Nhân viên" },
  { key: "shipper", label: "Nhân viên giao hàng" },
];

// Lấy quyền mặc định
const getDefaultPermissions = () => ({
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
    "delivery"
  ],
  manager: [
    "dashboard",
    "products",
    "categories",
    "brands",
    "suppliers",
    "employees",
    "customers",
    "orders",
    "reviews",
    "contacts",
    "messages"
  ],
  employee: [
    "dashboard",
    "products",
    "orders",
    "customers",
    "reviews",
    "contacts",
    "messages"
  ],
  shipper: ["delivery", "orders"]
});

// Lấy quyền từ localStorage hoặc mặc định
const getPermissionsFromStorage = () => {
  const saved = localStorage.getItem("rolePermissions");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error("Lỗi khi phân tích JSON từ localStorage:", error);
      return getDefaultPermissions();
    }
  }
  return getDefaultPermissions();
};

const Settings = () => {
  const [selectedRole, setSelectedRole] = useState("admin");
  const [rolePermissions, setRolePermissions] = useState(getPermissionsFromStorage());
  const [saveMsg, setSaveMsg] = useState("");

  // Effect để cập nhật permissions khi selectedRole thay đổi
  useEffect(() => {
    // Tải quyền từ localStorage hoặc default khi selectedRole thay đổi
    const savedPermissions = getPermissionsFromStorage();
    setRolePermissions(prev => ({
      ...prev,
      [selectedRole]: savedPermissions[selectedRole] || getDefaultPermissions()[selectedRole]
    }));
  }, [selectedRole]);

  const handleChangePermissions = (perms) => {
    setRolePermissions((prev) => ({
      ...prev,
      [selectedRole]: perms,
    }));
    setSaveMsg("");
  };

  const handleSave = async () => {
    try {
      // Lấy quyền hiện tại của selectedRole từ state rolePermissions
      const currentPermissions = rolePermissions[selectedRole];

      // Lưu toàn bộ object rolePermissions vào localStorage (cho FE)
      localStorage.setItem("rolePermissions", JSON.stringify(rolePermissions));

      // Gọi API để lưu quyền của selectedRole vào database (cho BE)
      const response = await adminApi.updateRolePermissions(
        selectedRole,
        currentPermissions
      );

      if (response.success) {
        setSaveMsg(response.message || "Lưu phân quyền thành công!");
      } else {
        setSaveMsg(response.message || "Lưu phân quyền thất bại!");
      }

      setTimeout(() => setSaveMsg(""), 2000);
    } catch (error) {
      console.error("Lỗi khi lưu phân quyền:", error);
      setSaveMsg("Lỗi khi lưu phân quyền!");
      setTimeout(() => setSaveMsg(""), 2000);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Cài đặt phân quyền vai trò</h1>
      <div className="flex gap-4 mb-8">
        {ROLES.map((role) => (
          <button
            key={role.key}
            className={`px-4 py-2 rounded font-semibold border ${selectedRole === role.key ? "bg-green-600 text-white" : "bg-white text-green-700 border-green-600"}`}
            onClick={() => setSelectedRole(role.key)}
          >
            {role.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Phân quyền cho vai trò: <span className="text-green-700">{ROLES.find(r => r.key === selectedRole)?.label}</span></h2>
        <RolePermissionSetting
          role={selectedRole}
          permissions={rolePermissions[selectedRole] || []} // Đảm bảo luôn truyền một mảng
          onChange={handleChangePermissions}
        />
        <div className="mt-6 flex items-center gap-4">
          <button
            className="px-6 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 transition-colors"
            onClick={handleSave}
          >
            Lưu phân quyền
          </button>
          {saveMsg && <span className="text-green-600 font-medium">{saveMsg}</span>}
        </div>
      </div>
    </div>
  );
};

export default Settings; 