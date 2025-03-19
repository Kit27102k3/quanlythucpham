import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  EnterIcon,
  PersonIcon,
  MagnifyingGlassIcon,
  CaretDownIcon,
  ExitIcon,
} from "@radix-ui/react-icons";
import { HoverCard, Flex, Text, Link, Tooltip } from "@radix-ui/themes";
import { Badge } from "primereact/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone } from "@fortawesome/free-solid-svg-icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import authApi from "../../api/authApi";
import ProductDetail from "../Pages/Product/ProductDetail";
import SidebarLeft from "../Until/SidebarLeft";
import "../../index.css";
import Products from "../Cart/Products";

const placeholders = [
  "Đồ uống các loại",
  "Thực phẩm sạch",
  "Bạn muốn tìm gì?",
  "Trái cây nhập khẩu",
  "Sữa chua các loại - tả bỉm",
];

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

const fontHeader =
  "cursor-pointer uppercase text-[14px] font-medium p-3 transition-colors duration-300";

const Header = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showProduct, setShowProduct] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    const input = inputRef.current;

    const typePlaceholder = (text, index = 0) => {
      if (index < text.length) {
        input.placeholder = text.slice(0, index + 1);
        setTimeout(() => typePlaceholder(text, index + 1), 50);
      } else {
        setTimeout(() => deletePlaceholder(text), 2000);
      }
    };

    const deletePlaceholder = (text, index = text.length) => {
      if (index > 0) {
        input.placeholder = text.slice(0, index - 1);
        setTimeout(() => deletePlaceholder(text, index - 1), 50);
      } else {
        const nextIndex = (currentIndex + 1) % placeholders.length;
        setCurrentIndex(nextIndex);
      }
    };
    typePlaceholder(placeholders[currentIndex]);
  }, [currentIndex]);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await authApi.logout();
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      axios.interceptors.request.clear();
      axios.interceptors.response.clear();
      toast.success("Đăng xuất thành công!");
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="">
      <ToastContainer />
      <div className="grid grid-cols-1 items-center p-2 bg-[#428b16] lg:grid-cols-[80%_20%] lg:px-[120px]">
        <h3 className="text-sm text-white text-center font-medium lg:text-left">
          Nông Trại Hữu Cơ Cung Cấp Thực Phẩm Sạch
        </h3>
        <div className="flex lg:px-7 items-center ">
          {isLoggedIn ? (
            <a
              href="tai-khoan"
              className="grid items-center mr-2 cursor-pointer "
            >
              <img
                src="https://www.gravatar.com/avatar/?d=mp"
                alt="Avatar"
                className="w-8 h-8 rounded-full hide-on-mobile"
              />
            </a>
          ) : (
            <div className="flex items-center ">
              <EnterIcon className="text-white " />
              <a
                href="dang-nhap"
                className="text-[12px] text-white font-medium uppercase cursor-pointer p-1"
              >
                Đăng nhập
              </a>
            </div>
          )}
          {isLoggedIn ? (
            <div className="flex items-center justify-center text-white p-1 ml-1 pl-2 lg:border-l-2 ">
              <ExitIcon className="hide-on-mobile" />
              <button
                onClick={handleLogout}
                className="text-[12px] text-white font-medium uppercase cursor-pointer p-1 hide-on-mobile"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center text-white p-1 border-l-2 ml-1 pl-2 ">
              <PersonIcon />
              <button className="text-[12px] text-white  font-medium uppercase cursor-pointer p-1">
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#5ccd16]">
        <div className="grid grid-cols-[25%_35%_20%_20%] lg:grid-cols-3 lg:px-[120px] md:grid-cols-3 items-center justify-around p-5">
          <SidebarLeft />
          <h3 className="text-white text-4xl lg:text-4xl font-bold text-center">
            DNC<span className="text-green-200"> FO</span>OD
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-1 md:relative items-center lg:relative">
            <input
              ref={inputRef}
              type="text"
              className="w-full hide-on-mobile bg-white p-3 border-2 h-10 border-none rounded-l-full rounded-r-full focus:outline-none transition duration-300"
            />
            <MagnifyingGlassIcon
              style={{
                fontSize: "2rem",
              }}
              className="lg:size-4 ml-12 lg:absolute md:absolute md:right-3 text-white cursor-pointer lg:text-black"
            />
          </div>

          <div className="text-white grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-[82%_18%] items-center gap-2 px-4 lg:px-8">
            <div className="flex items-center lg:justify-end ">
              <FontAwesomeIcon
                icon={faPhone}
                fontSize={24}
                className="mr-3 hide-on-mobile"
              />
              <div
                className="border-l-2 ml-1 pl-2 hide-on-mobile"
                style={{ lineHeight: "1.0" }}
              >
                <h3 className="text-[14px]">Hotline 24/7</h3>
                <h3 className="text-[14px]">0326 743391</h3>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <HoverCard.Root>
                <HoverCard.Trigger>
                  <Link href="/gio-hang" className="text-white">
                    {" "}
                    {/* target="_blank" : chuyển tab mới nếu cần*/}
                    <Tooltip content="Giỏ hàng">
                      <i
                        className="pi pi-cart-minus"
                        style={{ fontSize: "22px" }}
                      >
                        <Badge
                          value="0"
                          className="absolute top-21 right-4 lg:right-32 lg:top-16"
                        />
                      </i>
                    </Tooltip>
                  </Link>
                </HoverCard.Trigger>
                <HoverCard.Content maxWidth="400px">
                  <Flex gap="4">
                    <Text>
                      <Products />
                    </Text>
                  </Flex>
                </HoverCard.Content>
              </HoverCard.Root>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#428b16] hide-on-mobile ">
        <ul className="flex justify-between lg:px-32 relative">
          {menuItems.map((item, index) => (
            <li
              key={index}
              className={`${fontHeader} ${
                activeIndex === index
                  ? "text-yellow-300"
                  : "text-white hover:text-yellow-300"
              } flex items-center gap-1`}
              onClick={() => {
                setActiveIndex(index);
                navigate(item.path);
              }}
              onMouseEnter={() =>
                item.name === "Sản Phẩm" && setShowProduct(true)
              }
              onMouseLeave={() => setShowProduct(false)}
            >
              {item.name}
              {item.name === "Sản Phẩm" && <CaretDownIcon />}
              {item.name === "Sản Phẩm" && showProduct && (
                <div
                  className={`dropdown ${
                    showProduct ? "show" : ""
                  } absolute left-0 right-0 px-[120px] top-full z-50`}
                  onMouseEnter={() => setShowProduct(true)}
                  onMouseLeave={() => setShowProduct(false)}
                >
                  <ProductDetail />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Header;
