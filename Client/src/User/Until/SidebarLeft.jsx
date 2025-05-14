/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import {
  EnterIcon,
  PersonIcon,
  MagnifyingGlassIcon,
  CaretDownIcon,
  ExitIcon,
} from "@radix-ui/react-icons";
import { Badge } from "primereact/badge";
import { toast } from "react-toastify";
import authApi from "../../api/authApi";
import LogoHeader from "../../assets/Logo.png";
import MenuDropDown from "./PanelMenu";
import cartApi from "../../api/cartApi";

const menuItems = [
  { name: "Trang Chủ", path: "/" },
  { name: "Giới Thiệu", path: "/gioi-thieu" },
  { name: "Sản Phẩm", path: "/san-pham" },
  { name: "Khuyến Mãi", path: "/khuyen-mai" },
  { name: "Voucher", path: "/voucher" },
  { name: "Liên Hệ", path: "/lien-he" },
  { name: "Cửa Hàng", path: "/cua-hang" },
];

export default function SidebarLeft() {
  const [visible, setVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [userFullName, setUserFullName] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  // Kiểm tra trạng thái đăng nhập khi component mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const fullName = localStorage.getItem("fullName");
    if (token) {
      setIsLoggedIn(true);
      setUserFullName(fullName || "Khách hàng");
    }
  }, []);

  // Lấy số lượng sản phẩm trong giỏ hàng
  const fetchCart = async () => {
    try {
      if (userId) {
        const res = await cartApi.getCart(userId);
        const totalItems = res.cart.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        setCartItemCount(totalItems);
      }
    } catch (error) {
      // console.log("Lỗi khi lấy giỏ hàng:", error);
    }
  };

  // Lấy giỏ hàng khi component mount và mỗi 5 giây
  useEffect(() => {
    fetchCart();

    // Thiết lập polling để cập nhật giỏ hàng mỗi 5 giây
    const intervalId = setInterval(() => {
      fetchCart();
    }, 5000);

    // Cleanup khi component unmount
    return () => clearInterval(intervalId);
  }, [userId]);

  // Lắng nghe sự kiện cập nhật giỏ hàng
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCart();
    };

    window.addEventListener("cart-updated", handleCartUpdate);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
    };
  }, []);

  // Xử lý đăng xuất
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await authApi.logout();
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      localStorage.removeItem("isBlocked");
      localStorage.removeItem("permissions");
      localStorage.removeItem("fullName");
      setIsLoggedIn(false);
      toast.success("Đăng xuất thành công!");
      setVisible(false);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Xử lý điều hướng
  const handleNavigate = (path) => {
    navigate(path);
    setVisible(false);
  };

  // Xử lý lỗi và render fallback UI nếu có lỗi
  if (error) {
    return (
      <div className="relative mt-7 hide-on-pc w-full h-full">
        <Button
          icon="pi pi-align-left"
          style={{
            backgroundColor: "white",
          }}
          onClick={() => window.location.reload()}
        />
      </div>
    );
  }

  try {
    return (
      <div className="relative mt-7 hide-on-pc w-full h-full -mb-5">
        <Sidebar
          visible={visible}
          style={{
            backgroundColor: "#ffffff",
          }}
          onHide={() => setVisible(false)}
        >
          <h3 className="text-black text-4xl lg:text-4xl font-bold text-center">
            DNC<span className="text-green-200"> FO</span>OD
          </h3>
          <h2 className="text-sm text-[#000000] mt-8 font-medium uppercase text-center ">
            {isLoggedIn
              ? `Xin chào, ${userFullName}`
              : "Chào mừng đến với DNC FOOD"}
          </h2>
          <div className="w-full p-1 border-b border-b-gray-400"></div>

          <div className="grid grid-cols-2 items-center justify-baseline mt-2">
            {isLoggedIn ? (
              <>
                <div className="flex items-center justify-center">
                  <a
                    href="/tai-khoan"
                    className="text-[12px] text-black flex flex-row items-center font-medium uppercase cursor-pointer p-1"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate("/tai-khoan");
                    }}
                  >
                      <PersonIcon className="mr-2" />
                      Tài khoản
                  </a>
                </div>
                <div className="flex items-center justify-center">
                  <button
                    onClick={handleLogout}
                    className="text-[12px] text-black font-medium uppercase cursor-pointer p-1 flex flex-row items-center"
                  >
                    <ExitIcon className="mr-2" />
                    Đăng xuất
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center">
                  <a
                    href="/dang-nhap"
                    className="text-[12px] text-black font-medium uppercase cursor-pointer p-1 flex items-center"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate("/dang-nhap");
                    }}
                  >
                    <EnterIcon className="text-black mr-2" />
                    Đăng nhập
                  </a>
                </div>
                <div className="flex items-center text-black justify-center">
                  <a
                    href="/dang-ky"
                    className="text-[12px] text-black font-medium uppercase cursor-pointer p-1 flex items-center"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate("/dang-ky");
                    }}
                  >
                    <PersonIcon className="mr-2" />
                    Đăng ký
                  </a>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between p-3 border-b border-gray-200 mt-4">
            <div className="flex items-center">
              <i
                className="pi pi-cart-minus mr-2"
                style={{ fontSize: "18px" }}
              ></i>
              <span className="font-medium">Giỏ hàng</span>
            </div>
            <Badge value={cartItemCount} severity="warning" />
          </div>

          <div className="p-4">
            <ul className="text-black text-sm grid grid-cols-1 gap-4 font-medium">
              {menuItems.map((item, index) => (
                <li
                  key={index}
                  className="hover:text-[#51bb1a] cursor-pointer"
                  onClick={() => handleNavigate(item.path)}
                >
                  {item.name === "Sản Phẩm" ? <MenuDropDown /> : item.name}
                </li>
              ))}
            </ul>
          </div>
        </Sidebar>
        <Button
          icon="pi pi-align-left"
          style={{
            backgroundColor: "white",
          }}
          onClick={() => setVisible(true)}
        />
      </div>
    );
  } catch (error) {
    console.error("Error in SidebarLeft component:", error);
    setError(error);
    return null;
  }
}
