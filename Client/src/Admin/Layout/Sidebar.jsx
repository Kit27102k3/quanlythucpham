import React, { useState, useEffect } from "react";
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

  return (
    <div
      className={`flex flex-col h-screen bg-gray-800 text-white transition-all duration-300 ${
        isSidebarOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="flex items-center justify-between p-4 bg-gray-900">
        <h2 className={`text-xl font-semibold ${!isSidebarOpen && "hidden"}`}>
          Quản lý Siêu thị
        </h2>
        <button
          onClick={toggleSidebar}
          className="p-2 text-white hover:bg-gray-700 rounded cursor-pointer"
        >
          {isSidebarOpen ? <TriangleLeftIcon className="size-6"/> : <TriangleRightIcon className="size-6"/> }
        </button>
      </div>

      <ul className="flex-1 flex flex-col gap-3 p-2 space-y-1">
        <SidebarItem
          icon={<HomeIcon className="size-6 ml-2" />}
          text="Trang chủ"
          onClick={() => handleNavigation("/admin/dashboard", "dashboard")}
          isSidebarOpen={isSidebarOpen}
          isActive={activeItem === "dashboard"}
        />
        <SidebarItem
          icon={<CubeIcon className="size-6 ml-2" />}
          text="Quản lý Sản phẩm"
          onClick={() => handleNavigation("/admin/products", "products")}
          isSidebarOpen={isSidebarOpen}
          isActive={activeItem === "products"}
        />
        <SidebarItem
          icon={<CardStackPlusIcon className="size-6 ml-2" />}
          text="Quản lý Danh mục"
          onClick={() => handleNavigation("/admin/categories", "categories")}
          isSidebarOpen={isSidebarOpen}
          isActive={activeItem === "categories"}
        />
        <SidebarItem
          icon={<CardStackIcon className="size-6 ml-2" />}
          text="Quản lý Đơn hàng"
          onClick={() => handleNavigation("/admin/orders", "orders")}
          isSidebarOpen={isSidebarOpen}
          isActive={activeItem === "orders"}
        />
        <SidebarItem
          icon={<PersonIcon className="size-6 ml-2" />}
          text="Quản lý Khách hàng"
          onClick={() => handleNavigation("/admin/customers", "customers")}
          isSidebarOpen={isSidebarOpen}
          isActive={activeItem === "customers"}
        />
        <SidebarItem
          icon={<ReaderIcon className="size-6 ml-2" />}
          text="Báo cáo"
          onClick={() => handleNavigation("/admin/reports", "reports")}
          isSidebarOpen={isSidebarOpen}
          isActive={activeItem === "reports"}
        />
        <SidebarItem
          icon={<GearIcon className="size-6 ml-2" />}
          text="Cài đặt"
          onClick={() => handleNavigation("/admin/settings", "settings")}
          isSidebarOpen={isSidebarOpen}
          isActive={activeItem === "settings"}
        />
      </ul>

      <div className="p-4 bg-gray-900">
        <div className="flex items-center space-x-2">
          <img
            src="https://scontent.fsgn5-12.fna.fbcdn.net/v/t39.30808-6/481456016_1231192658376202_738067928430088828_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeGvtO3WvuAtPyTXjbwJ7dFv5gipTJpZ4ODmCKlMmlng4GSv5lrR8EWLC0Dh64gktUtMbQJaJKREsRlVQj8YgHU3&_nc_ohc=mie_r2QnTEYQ7kNvgF3m1_d&_nc_oc=AdiCKJ27_IkzjGsN5srbikGCVaOm4dhzDCSLmn0Jo9XT6q8TbGjj4fZOExoWLvBprWpzKSun1DF3BxQdJYsn51rg&_nc_zt=23&_nc_ht=scontent.fsgn5-12.fna&_nc_gid=A9cxFYb5KgmRlPrBg3e5wA&oh=00_AYGnKlzSLSRIB6xihIJO5pjZtFsbqK7icgdO2T8WLn9RxA&oe=67DC8A9C"
            alt="Admin"
            className="w-8 h-8 rounded-full mr-5 ml-2"
          />
          <span className={`${!isSidebarOpen && "hidden"}`}>Admin</span>
        </div>
        <button
          onClick={() => handleNavigation("/logout", "logout")}
          className="flex items-center mt-4 p-2 w-full text-white hover:bg-gray-700 rounded"
        >
          <span>
            <ExitIcon className="size-6"/>
          </span>
          <span className={`ml-2 cursor-pointer ${!isSidebarOpen && "hidden"}`}>
            Đăng xuất
          </span>
        </button>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, text, onClick, isSidebarOpen, isActive }) => {
  return (
    <li
      onClick={onClick}
      className={`flex items-center p-2 hover:bg-gray-700 rounded cursor-pointer ${
        isActive ? "bg-gray-700" : ""
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className={`ml-2 ${!isSidebarOpen && " hidden"}`}>{text}</span>
    </li>
  );
};

export default AdminSidebar;
