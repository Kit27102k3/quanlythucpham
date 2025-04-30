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
  InfoCircledIcon,
  EnvelopeClosedIcon
} from "@radix-ui/react-icons";

const AdminSidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeItem, setActiveItem] = useState(() => {
    return localStorage.getItem("activeItem") || "dashboard";
  });
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-collapse sidebar on mobile
      if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNavigation = (path, item) => {
    setActiveItem(item);
    localStorage.setItem("activeItem", item);
    navigate(path);
    
    // Auto close sidebar on mobile after navigation
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    const savedActiveItem = localStorage.getItem("activeItem");
    if (savedActiveItem) {
      setActiveItem(savedActiveItem);
    }
  }, []);

  const menuItems = [
    {
      icon: <HomeIcon className="size-5 md:size-6" />,
      text: "Trang chủ",
      path: "/admin/dashboard",
      key: "dashboard",
    },
    {
      icon: <CubeIcon className="size-5 md:size-6" />,
      text: "Sản phẩm",
      path: "/admin/products",
      key: "products",
    },
    {
      icon: <CardStackPlusIcon className="size-5 md:size-6" />,
      text: "Danh mục",
      path: "/admin/categories",
      key: "categories",
    },
    {
      icon: <CardStackIcon className="size-5 md:size-6" />,
      text: "Đơn hàng",
      path: "/admin/orders",
      key: "orders",
    },
    {
      icon: <InfoCircledIcon className="size-5 md:size-6" />,
      text: "Mẹo hay",
      path: "/admin/tips",
      key: "tips",
    },
    {
      icon: <EnvelopeClosedIcon className="size-5 md:size-6" />,
      text: "Liên hệ",
      path: "/admin/contacts",
      key: "contacts",
    },
    {
      icon: <PersonIcon className="size-5 md:size-6" />,
      text: "Khách hàng",
      path: "/admin/customers",
      key: "customers",
    },
    {
      icon: <PersonIcon className="size-5 md:size-6" />,
      text: "Nhân viên",
      path: "/admin/employees",
      key: "employees",
    },
    {
      icon: <ReaderIcon className="size-5 md:size-6" />,
      text: "Báo cáo",
      path: "/admin/reports",
      key: "reports",
    },
    {
      icon: <GearIcon className="size-5 md:size-6" />,
      text: "Cài đặt",
      path: "/admin/settings",
      key: "settings",
    },
  ];

  // Render mobile bottom navigation bar
  if (isMobile && !isSidebarOpen) {
    return (
      <>
        {/* Mobile bottom navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 z-50 shadow-lg">
          <div className="flex justify-between items-center px-2 py-2">
            {/* Only show first 5 menu items in the bottom bar */}
            {menuItems.slice(0, 5).map((item) => (
              <div
                key={item.key}
                onClick={() => handleNavigation(item.path, item.key)}
                className={`flex flex-col items-center justify-center p-2 rounded-md ${
                  activeItem === item.key
                    ? "text-blue-400"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                <span className="text-[10px] mt-1">{item.text}</span>
              </div>
            ))}
            {/* More button to toggle sidebar for additional options */}
            <div
              onClick={toggleSidebar}
              className="flex flex-col items-center justify-center p-2 rounded-md text-gray-300 hover:text-white"
            >
              <span>
                <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </span>
              <span className="text-[10px] mt-1">Thêm</span>
            </div>
          </div>
        </div>

        {/* Floating action button for adding - positioned above bottom nav */}
        <div className="fixed right-4 bottom-16 z-50">
          <button 
            onClick={() => navigate('/admin/products')}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        {/* Add padding to main content to prevent overlap with bottom nav */}
        <div className="pb-16"></div>
      </>
    );
  }

  // Full sidebar (desktop or mobile when expanded)
  return (
    <div
      className={`flex flex-col h-screen bg-gray-800 text-white transition-all duration-300 shadow-lg 
        ${isSidebarOpen ? "w-64" : "w-20"} 
        ${isMobile ? "fixed top-0 left-0 z-50" : ""}`}
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

      {/* Mobile close button - only visible on mobile with sidebar open */}
      {isMobile && isSidebarOpen && (
        <div className="absolute top-4 right-4">
          <button 
            onClick={toggleSidebar}
            className="p-2 bg-gray-700 rounded-full"
            aria-label="Close Sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      {/* Menu Items */}
      <nav className="flex-1 py-4 overflow-y-auto">
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
            src="/images/avatar.png"
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
      
      {/* Overlay for mobile sidebar */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        ></div>
      )}
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
