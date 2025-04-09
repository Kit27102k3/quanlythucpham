/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CardStackIcon,
  CardStackPlusIcon,
  CubeIcon,
  ExitIcon,
  GearIcon,
  HomeIcon,
  PersonIcon,
  ReaderIcon,
  TriangleLeftIcon,
  TriangleRightIcon,
} from "@radix-ui/react-icons";

const AdminSidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState(() => {
    return localStorage.getItem("activeItem") || "dashboard";
  });
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNavigation = (path, item) => {
    setActiveItem(item);
    localStorage.setItem("activeItem", item);
    navigate(path);
  };

  useEffect(() => {
    const savedActiveItem = localStorage.getItem("activeItem");
    if (savedActiveItem) {
      setActiveItem(savedActiveItem);
    }
  }, []);

  const menuItems = [
    {
      icon: <HomeIcon className="size-6" />,
      text: "Trang chủ",
      path: "/admin/dashboard",
      key: "dashboard",
    },
    {
      icon: <CubeIcon className="size-6" />,
      text: "Quản lý Sản phẩm",
      path: "/admin/products",
      key: "products",
    },
    {
      icon: <CardStackPlusIcon className="size-6" />,
      text: "Quản lý Danh mục",
      path: "/admin/categories",
      key: "categories",
    },
    {
      icon: <CardStackIcon className="size-6" />,
      text: "Quản lý Đơn hàng",
      path: "/admin/orders",
      key: "orders",
    },
    {
      icon: <PersonIcon className="size-6" />,
      text: "Quản lý Khách hàng",
      path: "/admin/customers",
      key: "customers",
    },
    {
      icon: <PersonIcon className="size-6" />,
      text: "Quản lý Nhân viên",
      path: "/admin/employees",
      key: "employees",
    },
    {
      icon: <ReaderIcon className="size-6" />,
      text: "Báo cáo",
      path: "/admin/reports",
      key: "reports",
    },
    {
      icon: <GearIcon className="size-6" />,
      text: "Cài đặt",
      path: "/admin/settings",
      key: "settings",
    },
  ];

  return (
    <div
      className={`flex flex-col h-screen bg-gray-800 text-white transition-all duration-300 shadow-lg 
        ${isSidebarOpen ? "w-64" : "w-20"}`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
        {isSidebarOpen && (
          <h2 className="text-xl font-bold text-gray-200">Quản lý Siêu thị</h2>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-700 rounded-md transition-colors"
          aria-label={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isSidebarOpen ? (
            <TriangleLeftIcon className="size-6" />
          ) : (
            <TriangleRightIcon className="size-6" />
          )}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.key}
              icon={item.icon}
              text={item.text}
              onClick={() => handleNavigation(item.path, item.key)}
              isSidebarOpen={isSidebarOpen}
              isActive={activeItem === item.key}
            />
          ))}
        </ul>
      </nav>

      {/* User Profile and Logout */}
      <div className="p-4 bg-gray-900 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <img
            src="https://scontent.fsgn5-10.fna.fbcdn.net/v/t39.30808-6/481456016_1231192658376202_738067928430088828_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeGvtO3WvuAtPyTXjbwJ7dFv5gipTJpZ4ODmCKlMmlng4GSv5lrR8EWLC0Dh64gktUtMbQJaJKREsRlVQj8YgHU3&_nc_ohc=zKWou0iuSL4Q7kNvwEDpG7E&_nc_oc=AdmvRXPpd9GT98oZ-wZ1k9p7mwfaXWh6WLQ8ybBuo7IPNzguehpoeANFdqjDkflCOrWR6exsPiXUxBC6BpaML2nP&_nc_zt=23&_nc_ht=scontent.fsgn5-10.fna&_nc_gid=UwDtT7VeVKA70Sjo6VnSFg&oh=00_AfFAH7OZYZ01fBtiEIkOnjXreS9ctcC-lqy6tLDvARGZ6A&oe=67FB4D9C"
            alt="Admin"
            className="w-10 h-10 rounded-full object-cover border-2 border-gray-600"
          />
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-semibold text-gray-200">Admin</span>
              <span className="text-xs text-gray-400">Quản trị viên</span>
            </div>
          )}
        </div>
        <button
          onClick={() => handleNavigation("/logout", "logout")}
          className="flex items-center mt-4 p-2 w-full text-red-400 hover:bg-gray-700 rounded-md transition-colors"
        >
          <ExitIcon className="size-6" />
          {isSidebarOpen && <a href="/dang-nhap" className="ml-3 font-medium">Đăng xuất</a>}
        </button>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, text, onClick, isSidebarOpen, isActive }) => {
  return (
    <li
      onClick={onClick}
      className={`
        flex items-center px-4 py-2 cursor-pointer transition-all 
        ${
          isActive
            ? "bg-gray-700 text-white"
            : "text-gray-300 hover:bg-gray-700 hover:text-white"
        }
      `}
    >
      <span className={`${isActive ? "text-blue-400" : ""}`}>{icon}</span>
      {isSidebarOpen && (
        <span
          className={`ml-3 text-sm ${
            isActive ? "font-semibold" : "font-normal"
          }`}
        >
          {text}
        </span>
      )}
    </li>
  );
};

export default AdminSidebar;
