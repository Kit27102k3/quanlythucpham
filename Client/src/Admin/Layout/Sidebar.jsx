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
  EnvelopeClosedIcon,
  ChatBubbleIcon,
  StarFilledIcon,
  IdCardIcon
} from "@radix-ui/react-icons";
import messagesApi from "../../api/messagesApi";

const AdminSidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeItem, setActiveItem] = useState(() => {
    return localStorage.getItem("activeItem") || "dashboard";
  });
  const [unreadMessages, setUnreadMessages] = useState(0);
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
    if (isMobile) {
      setShowMobileMenu(!showMobileMenu);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  const handleNavigation = (path, item) => {
    setActiveItem(item);
    localStorage.setItem("activeItem", item);
    navigate(path);
    
    // Auto close sidebar on mobile after navigation
    if (isMobile) {
      setShowMobileMenu(false);
    }
  };

  useEffect(() => {
    const savedActiveItem = localStorage.getItem("activeItem");
    if (savedActiveItem) {
      setActiveItem(savedActiveItem);
    }
  }, []);

  // Lấy số lượng tin nhắn chưa đọc
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await messagesApi.getUnreadCount();
        if (response && response.count) {
          setUnreadMessages(response.count);
        }
      } catch (error) {
        console.error("Lỗi khi lấy số tin nhắn chưa đọc:", error);
      }
    };

    // Lấy dữ liệu khi component mount
    fetchUnreadCount();

    // Thiết lập interval để cập nhật mỗi 30 giây
    const intervalId = setInterval(fetchUnreadCount, 30000);

    // Dọn dẹp interval khi component unmount
    return () => clearInterval(intervalId);
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
      icon: <IdCardIcon className="size-5 md:size-6" />,
      text: "Mã giảm giá",
      path: "/admin/coupons",
      key: "coupons",
    },
    {
      icon: <StarFilledIcon className="size-5 md:size-6" />,
      text: "Đánh giá",
      path: "/admin/reviews",
      key: "reviews",
    },
    {
      icon: <ChatBubbleIcon className="size-5 md:size-6" />,
      text: "Tin nhắn",
      path: "/admin/messages",
      key: "messages",
      badge: unreadMessages > 0 ? unreadMessages : null,
      badgeClassName: "bg-red-500 text-white",
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
  if (isMobile) {
    return (
      <>
        {/* Mobile bottom navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
          <div className="flex justify-between items-center px-2 py-2">
            {/* Only show first 5 menu items in the bottom bar */}
            {menuItems.slice(0, 5).map((item) => (
              <div
                key={item.key}
                onClick={() => handleNavigation(item.path, item.key)}
                className={`flex flex-col items-center justify-center p-2 rounded-md ${
                  activeItem === item.key
                    ? "text-green-600"
                    : "text-gray-500 hover:text-green-500"
                }`}
              >
                <span>{item.icon}</span>
                <span className="text-[10px] mt-1">{item.text}</span>
                {item.badge && (
                  <span 
                    className={`badge inline-block px-2 py-1 text-xs font-semibold rounded-full ${item.badgeClassName || 'bg-green-500 text-white'}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
            {/* More button to toggle sidebar for additional options */}
            <div
              onClick={toggleSidebar}
              className={`flex flex-col items-center justify-center p-2 rounded-md ${
                showMobileMenu ? "text-green-600" : "text-gray-500 hover:text-green-500"
              }`}
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
        <div className="fixed right-4 bottom-16 z-30">
          <button 
            onClick={() => navigate('/admin/products')}
            className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        {/* Mobile menu popup */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-black bg-opacity-50" 
              onClick={toggleSidebar}
            ></div>
            <div className="relative bg-white w-11/12 max-w-md mx-auto rounded-lg shadow-xl z-10 max-h-[80vh] overflow-y-auto">
              <div className="p-4 bg-gradient-to-r from-green-500 to-green-400 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Menu chức năng</h2>
                  <button
                    onClick={toggleSidebar}
                    className="p-2 hover:bg-green-400 rounded-full text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-2">
                <div className="grid grid-cols-3 gap-2">
                  {menuItems.map((item) => (
                    <div
                      key={item.key}
                      onClick={() => handleNavigation(item.path, item.key)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg ${
                        activeItem === item.key
                          ? "bg-green-50 text-green-600 border border-green-200"
                          : "text-gray-700 hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      <div className="relative">
                        <span>{item.icon}</span>
                        {item.badge && (
                          <span 
                            className={`badge absolute -top-2 -right-2 inline-block px-2 py-0.5 min-w-[20px] text-center text-xs font-semibold rounded-full ${item.badgeClassName || 'bg-green-500 text-white'}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-xs mt-2 text-center">{item.text}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <img
                      src="/images/avatar.png"
                      alt="Admin"
                      className="w-10 h-10 rounded-full object-cover border-2 border-green-200"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-700">Admin</span>
                      <span className="text-xs text-gray-500">Quản trị viên</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleNavigation("/logout", "logout")}
                    className="flex items-center justify-center mt-3 p-2 w-full bg-red-50 text-red-500 hover:bg-red-100 rounded-md transition-colors"
                  >
                    <ExitIcon className="size-5 mr-2" />
                    <span className="font-medium">Đăng xuất</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add padding to main content to prevent overlap with bottom nav */}
        <div className="pb-16"></div>
      </>
    );
  }

  // Full sidebar (desktop or mobile when expanded)
  return (
    <div
      className={`flex flex-col h-screen bg-white text-gray-700 transition-all duration-300 shadow-md 
        ${isSidebarOpen ? "w-64" : "w-20"} 
        ${isMobile ? "fixed top-0 left-0 z-50" : ""}`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500 to-green-400 border-b">
        {isSidebarOpen && (
          <h2 className="text-xl font-bold text-white">Quản lý Siêu thị</h2>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-green-400 rounded-md transition-colors text-white"
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
            className="p-2 bg-green-400 rounded-full text-white"
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
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.key}
              icon={item.icon}
              text={item.text}
              onClick={() => handleNavigation(item.path, item.key)}
              isSidebarOpen={isSidebarOpen}
              isActive={activeItem === item.key}
              badge={item.badge}
              badgeClassName={item.badgeClassName}
            />
          ))}
        </ul>
      </nav>

      {/* User Profile and Logout */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <img
            src="/images/avatar.png"
            alt="Admin"
            className="w-10 h-10 rounded-full object-cover border-2 border-green-200"
          />
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-semibold text-gray-700">Admin</span>
              <span className="text-xs text-gray-500">Quản trị viên</span>
            </div>
          )}
        </div>
        <button
          onClick={() => handleNavigation("/logout", "logout")}
          className="flex items-center mt-4 p-2 w-full text-red-500 hover:bg-red-50 rounded-md transition-colors"
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

const SidebarItem = ({ icon, text, onClick, isSidebarOpen, isActive, badge, badgeClassName }) => {
  return (
    <li
      onClick={onClick}
      className={`${
        isActive 
          ? "bg-green-50 text-green-600 border-l-4 border-green-500" 
          : "text-gray-700 hover:bg-gray-100 hover:border-l-4 hover:border-green-300"
      } relative flex items-center px-3 py-3 rounded-md cursor-pointer transition-all duration-200`}
    >
      <div className={`text-lg ${isActive ? "ml-[-2px]" : ""}`}>{icon}</div>
      {isSidebarOpen && (
        <span className={`${isActive ? "font-semibold" : ""} ml-3 text-sm`}>
          {text}
        </span>
      )}
      {badge && (
        <span 
          className={`${badgeClassName || 'bg-red-500 text-white'} ml-auto px-2 py-0.5 min-w-[20px] text-center text-xs font-semibold rounded-full`}
        >
          {badge}
        </span>
      )}
    </li>
  );
};

export default AdminSidebar;
