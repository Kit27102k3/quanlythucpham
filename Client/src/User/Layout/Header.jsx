/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
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
import productsApi from "../../api/productsApi";
import cartApi from "../../api/cartApi";

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [products, setProducts] = useState([]); // Danh sách sản phẩm từ API
  const [filteredProducts, setFilteredProducts] = useState([]); // Kết quả tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");
  const [showPromotion, setShowPromotion] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const handleNavigate = (path) => {
    navigate(path);
    if (path === "/khuyen-mai") {
      setShowPromotion(true);
    } else if (path === "/san-pham") {
      setShowPromotion(false);
    }
  };

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

  useEffect(() => {
    fetchCart();
    
    // Thiết lập polling để cập nhật giỏ hàng mỗi 5 giây
    const intervalId = setInterval(() => {
      fetchCart();
    }, 5000);
    
    // Cleanup khi component unmount
    return () => clearInterval(intervalId);
  }, [userId]);

  // Listen for custom event that signals cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCart();
    };
    
    window.addEventListener('cart-updated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productsApi.getAllProducts();
        setProducts(res);
      } catch (error) {
        // console.log(error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        const result = products.filter((product) =>
          product?.productName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredProducts(result);
      } else {
        setFilteredProducts([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, products]);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    const input = inputRef.current;
    let typingTimeout;
    let deletingTimeout;
    let index = 0;

    const typePlaceholder = () => {
      if (index <= placeholders[currentIndex].length) {
        input.placeholder = placeholders[currentIndex].slice(0, index);
        index++;
        typingTimeout = setTimeout(typePlaceholder, 50);
      } else {
        deletingTimeout = setTimeout(deletePlaceholder, 2000);
      }
    };

    const deletePlaceholder = () => {
      if (index >= 0) {
        input.placeholder = placeholders[currentIndex].slice(0, index);
        index--;
        deletingTimeout = setTimeout(deletePlaceholder, 50);
      } else {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % placeholders.length);
      }
    };

    typePlaceholder();

    return () => {
      clearTimeout(typingTimeout);
      clearTimeout(deletingTimeout);
    };
  }, [currentIndex]);

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
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowProduct(true);
  };
  
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowProduct(false);
    }, 300); // 300ms delay trước khi ẩn dropdown
  };

  return (
    <div className="">
      <ToastContainer />
      <div className="grid grid-cols-1 items-center p-2 bg-[#428b16] lg:grid-cols-[80%_20%] lg:px-[120px]">
        <h3 className="text-sm text-white text-center font-medium lg:text-left">
          Nông Trại Hữu Cơ Cung Cấp Thực Phẩm Sạch
        </h3>
        <div className="flex justify-center mt-2 lg:px-7 items-center ">
          {isLoggedIn ? (
            <a
              href="/tai-khoan"
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
              value={searchTerm}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              type="text"
              className="w-full hide-on-mobile bg-white p-3 border-2 h-10 border-none rounded-l-full rounded-r-full focus:outline-none transition duration-300"
            />
            <MagnifyingGlassIcon
              style={{
                fontSize: "2rem",
              }}
              onClick={handleSearch}
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
                    <Tooltip content="Giỏ hàng">
                      <i
                        className="pi pi-cart-minus"
                        style={{ fontSize: "22px", color: "white" }}
                      >
                        <Badge
                          value={cartItemCount}
                          className="absolute top-21 right-4 lg:right-32 lg:top-16 text-white bg-[#F9C938]"
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
                handleNavigate(item.path);
              }}
              onMouseEnter={() =>
                item.name === "Sản Phẩm" && handleMouseEnter()
              }
              onMouseLeave={() => 
                item.name === "Sản Phẩm" && handleMouseLeave()
              }
            >
              {item.name}
              {item.name === "Sản Phẩm" && <CaretDownIcon />}
              {item.name === "Sản Phẩm" && (
                <ProductDetail isVisible={showProduct} />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Header;
