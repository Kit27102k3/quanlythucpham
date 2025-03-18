import React, { useState } from "react";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import {
  EnterIcon,
  PersonIcon,
  MagnifyingGlassIcon,
  CaretDownIcon,
  ExitIcon,
} from "@radix-ui/react-icons";
import LogoHeader from "../../assets/Logo.png";
import MenuDropDown from "./PanelMenu";

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

export default function SidebarLeft() {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative mt-7 hide-on-pc w-full h-full">
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
          Xin chào, Nguyễn Trọng Khiêm
        </h2>
        <div className="w-full p-1 border-b border-b-gray-400"></div>

        <div className="grid grid-cols-2 items-center justify-baseline mt-2">
          <div className="flex items-center justify-center ">
            <EnterIcon className="text-black" />
            <a
              href="dang-nhap"
              className="text-[12px] text-black font-medium uppercase cursor-pointer p-1"
            >
              Đăng nhập
            </a>
          </div>
          <div className="flex items-center text-black justify-center ">
            <PersonIcon />
            <button className="text-[12px] text-black font-medium uppercase cursor-pointer p-1">
              Đăng ký
            </button>
          </div>
        </div>
        <div className="p-4">
          <ul className="text-black text-sm grid grid-cols-1 gap-4 hover:text-[#51bb1a] font-medium">
            <li>Trang chủ</li>
            <li>Giới thiệu</li>
            <li>
              <MenuDropDown />
            </li>
            <li>Khuyến mãi</li>
            <li>Tin tức</li>
            <li>Mẹo hay</li>
            <li>Liên hệ</li>
            <li>Cửa hàng</li>
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
}
