import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { adminInfo, logout } = useAuth();

  const menuItems = [
    {
      path: "/admin/dashboard",
      label: "Tổng Quan",
      icon: "pi pi-home",
    },
    {
      path: "/admin/employees",
      label: "Quản Lý Nhân Viên",
      icon: "pi pi-users",
      roles: ["admin", "manager"],
    },
    {
      path: "/admin/products",
      label: "Quản Lý Sản Phẩm",
      icon: "pi pi-box",
    },
    {
      path: "/admin/categories",
      label: "Quản Lý Danh Mục",
      icon: "pi pi-list",
    },
    {
      path: "/admin/orders",
      label: "Quản Lý Đơn Hàng",
      icon: "pi pi-shopping-cart",
    },
    {
      path: "/admin/users",
      label: "Quản Lý Người Dùng",
      icon: "pi pi-user",
      roles: ["admin"],
    },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-emerald-800 text-white transition-transform duration-300 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-emerald-700">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-emerald-700"
          >
            <i className="pi pi-times"></i>
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              // Kiểm tra quyền truy cập
              if (item.roles && !item.roles.includes(adminInfo?.role)) {
                return null;
              }

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center p-2 rounded-lg hover:bg-emerald-700 transition-colors ${
                      location.pathname === item.path
                        ? "bg-emerald-700"
                        : ""
                    }`}
                  >
                    <i className={`${item.icon} mr-2`}></i>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <i className="pi pi-bars"></i>
            </button>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <i className="pi pi-user mr-2"></i>
                <span>{adminInfo?.fullName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-100 text-red-600"
              >
                <i className="pi pi-sign-out"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout; 