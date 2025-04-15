import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../api/authApi';
import { FaUser } from 'react-icons/fa';
import { CaretDownIcon, ExitIcon, EnterIcon, PersonIcon } from '@radix-ui/react-icons';

const menuItems = [
  { name: "Trang Chủ", path: "/" },
  { name: "Giới Thiệu", path: "/gioi-thieu" },
  { name: "Sản Phẩm", path: "/san-pham" },
  { name: "Khuyến Mãi", path: "/khuyen-mai" },
  { name: "Tin Tức", path: "/tin-tuc" },
  { name: "Mẹo Hay", path: "/meo-hay" },
  { name: "Liên Hệ", path: "/lien-he" },
  { name: "Cửa Hàng", path: "/cua-hang" },
];

const SidebarLeft = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const userId = localStorage.getItem('userId');
      const fullName = localStorage.getItem('fullName');
      
      if (token && userId) {
        setIsLoggedIn(true);
        
        if (fullName) {
          // If we have the fullName in localStorage, use it immediately
          setUser({ 
            firstName: fullName.split(' ')[0] || '',
            lastName: fullName.split(' ').slice(1).join(' ') || ''
          });
        }
        
        try {
          const response = await authApi.getProfile();
          setUser(response.data);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setIsLoggedIn(false);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    authApi.logout();
    setIsLoggedIn(false);
    setUser(null);
  };

  const handleNavigate = (path, index) => {
    setActiveIndex(index);
    navigate(path);
  };

  // Determine if we're on mobile
  const isMobile = window.innerWidth <= 768;

  return (
    <aside className={`${isMobile ? 'w-full' : 'w-64 min-h-screen'} bg-[#428b16] text-white p-4`}>
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold">
          DNC<span className="text-green-200"> FO</span>OD
        </h1>
      </div>

      {!loading && (
        <div className="mb-6">
          {isLoggedIn ? (
            <div className="flex flex-col items-center border-b border-[#5ccd16] pb-4 mb-4">
              <p className="text-lg font-medium text-white mb-4">{`XIN CHÀO, ${user?.firstName || ''} ${user?.lastName || ''}`}</p>
              <div className="w-16 h-16 rounded-full bg-[#5ccd16] flex items-center justify-center mb-2 overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="User avatar" className="w-full h-full object-cover" />
                ) : (
                  <FaUser size={24} />
                )}
              </div>
              <button 
                onClick={handleLogout}
                className="mt-2 flex items-center text-sm text-white hover:text-yellow-300"
              >
                <ExitIcon className="mr-1" />
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="border-b border-[#5ccd16] pb-4 mb-4">
              <Link to="/dang-nhap" className="flex items-center justify-center w-full py-2 px-4 bg-[#5ccd16] text-center rounded mb-2 hover:bg-[#51bb1a] transition">
                <EnterIcon className="mr-1" />
                Đăng nhập
              </Link>
              <Link to="/dang-ky" className="flex items-center justify-center w-full py-2 px-4 bg-[#51bb1a] text-center rounded hover:bg-[#5ccd16] transition">
                <PersonIcon className="mr-1" />
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      )}

      <nav>
        <ul>
          {menuItems.map((item, index) => (
            <li 
              key={index} 
              className={`mb-3 cursor-pointer uppercase text-[14px] font-medium p-2 transition-colors duration-300 ${
                activeIndex === index ? "text-yellow-300" : "text-white hover:text-yellow-300"
              } flex items-center gap-1`}
              onClick={() => handleNavigate(item.path, index)}
            >
              {item.name}
              {item.name === "Sản Phẩm" && <CaretDownIcon />}
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="mt-8 border-t border-[#5ccd16] pt-4">
        <div className="flex items-center">
          <div className="text-white" style={{ lineHeight: "1.0" }}>
            <h3 className="text-[14px]">Hotline 24/7</h3>
            <h3 className="text-[14px]">0326 743391</h3>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarLeft; 