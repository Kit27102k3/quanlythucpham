/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, memo, useRef } from "react";
import "../../../index.css";
import productsApi from "../../../api/productsApi";
import useCartAndNavigation from "../../Until/useCartAndNavigation";
import SEO from "../../../components/SEO";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping } from "@fortawesome/free-solid-svg-icons";
import { formatCurrency } from "../../../utils/formatCurrency";

// Cấu hình animation
const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
};

// Memo hóa ProductItem để tránh render lại không cần thiết
const ProductItem = memo(
  ({ product, handleAddToCart, handleClick, getPrice }) => (
    <motion.div
      variants={itemVariants}
      onClick={() => handleClick(product)}
      className="items-center justify-center bg-white rounded-md overflow-hidden shadow-lg hover:shadow-md transition-shadow duration-300"
    >
      <div>
        <img
          src={`${product.productImages[0]}`}
          alt={product.productName}
          className="w-full mx-auto h-[197px] object-cover hover-scale-up lg:w-[272px] lg:h-[272px]"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col mt-auto p-4 gap-2">
        <p className="text-gray-400 text-[10px] lg:text-[14px]">
          {product.productCategory}
        </p>
        <p className="font-medium text-[10px] hover:text-[#51aa1b] line-clamp-1 lg:text-[16px] transition-colors duration-300">
          {product.productName}
        </p>
        {product.productDiscount > 0 ? (
          <div className="flex items-center gap-2 mt-4 justify-between">
            <div className="flex items-center gap-2">
              <p className="text-[#51aa1b] text-[10px] mt-1 lg:text-[14px]">
                {formatCurrency(getPrice(product))}
              </p>
              <p className="text-gray-400 text-[10px] mt-1 lg:text-[14px] line-through">
                {formatCurrency(product.productPrice)}
              </p>
            </div>
            <FontAwesomeIcon
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(product._id);
              }}
              icon={faCartShopping}
              className="text-white p-2 rounded-full bg-[#51aa1b] text-[16px] size-5 mt-1 lg:text-[14px]"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 justify-between mt-4">
            <p className="text-[#51aa1b] text-[10px] mt-1 lg:text-[16px]">
              {formatCurrency(getPrice(product))}
            </p>
            <FontAwesomeIcon
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(product._id);
              }}
              icon={faCartShopping}
              className="text-white p-2 rounded-full bg-[#51aa1b] text-[16px] size-5 mt-1 lg:text-[14px]"
            />
          </div>
        )}
      </div>
    </motion.div>
  )
);

// Đặt tên hiển thị cho component để dễ debug
ProductItem.displayName = "ProductItem";

function Fruit() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { handleAddToCart, handleClick, getPrice } = useCartAndNavigation();
  const [isMobile, setIsMobile] = useState(false);

  // State cho hiệu ứng fade của hình ảnh trên mobile
  const [activeImage, setActiveImage] = useState(0);
  const [isChangingBanner, setIsChangingBanner] = useState(false);

  // State để theo dõi trang hiện tại của sản phẩm trên mobile và PC
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = isMobile ? 2 : 4; // Hiển thị 2 sản phẩm mỗi trang trên mobile, 4 trên PC

  // Danh sách hình ảnh
  const bannerImages = [
    {
      src: "https://images.pexels.com/photos/68525/soap-colorful-color-fruit-68525.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      alt: "Khuyến mãi đặc biệt cho trái cây",
    },
    {
      src: "https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      alt: "Ưu đãi trái cây nhập khẩu",
    },
  ];

  // Tính toán số trang dựa trên số lượng sản phẩm
  const getTotalPages = (items) => {
    return Math.ceil(items.length / itemsPerPage);
  };

  // Xử lý chuyển trang sản phẩm
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Lấy các sản phẩm cho trang hiện tại
  const getPaginatedProducts = (items, page) => {
    const startIndex = page * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  // Xử lý swipe gesture cho sản phẩm trên mobile
  const swipeRef = useRef(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentPage < getTotalPages(products) - 1) {
      handlePageChange(currentPage + 1);
    }

    if (isRightSwipe && currentPage > 0) {
      handlePageChange(currentPage - 1);
    }

    // Reset values
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Đổi hình mỗi 5 giây trên mobile
  useEffect(() => {
    if (isMobile) {
      const interval = setInterval(() => {
        setIsChangingBanner(true);
        setTimeout(() => {
          setActiveImage((prev) => (prev === 0 ? 1 : 0));
          setTimeout(() => {
            setIsChangingBanner(false);
          }, 500);
        }, 300);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isMobile]);

  // Xử lý khi người dùng click vào dots
  const handleBannerDotClick = (index) => {
    if (index !== activeImage && !isChangingBanner) {
      setIsChangingBanner(true);
      setTimeout(() => {
        setActiveImage(index);
        setTimeout(() => {
          setIsChangingBanner(false);
        }, 500);
      }, 300);
    }
  };

  useEffect(() => {
    const fetchProductCategory = async () => {
      try {
        setIsLoading(true);
        const res = await productsApi.getProductByCategory("Trái cây");
        // Sắp xếp sản phẩm từ mới nhất đến cũ nhất
        const sortedProducts = [...res].sort((a, b) => {
          // Sử dụng updatedAt hoặc createdAt để sắp xếp
          const dateA = new Date(a.updatedAt || a.createdAt);
          const dateB = new Date(b.updatedAt || b.createdAt);
          return dateB - dateA; // Sắp xếp giảm dần (mới nhất trước)
        });
        // Giới hạn tối đa 8 sản phẩm được hiển thị
        setProducts(sortedProducts.slice(0, 8));
      } catch (error) {
        console.error("Lỗi khi lấy sản phẩm theo danh mục:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProductCategory();

    // Kiểm tra kích thước màn hình khi component mount
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Chạy lần đầu
    checkIsMobile();

    // Thêm listener
    window.addEventListener("resize", checkIsMobile);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  return (
    <AnimatePresence mode="sync">
      <motion.div
        className="grid grid-cols-1 px-4 pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <SEO
          title="Trái cây nhập khẩu"
          description="Trái cây tươi ngon nhập khẩu từ các nước, đảm bảo chất lượng, giá cả hợp lý."
        />

        <motion.h2
          className="text-[14px] font-medium text-[#292929] uppercase lg:text-[35px] mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.3 }}
        >
          Trái cây nhập khẩu
        </motion.h2>

        {/* Banner đầu trang - thống nhất cho cả mobile và desktop */}
        <div className="w-full mb-6 hide-on-pc">
          <div className="w-full h-[150px] relative rounded-lg overflow-hidden shadow-md">
            {bannerImages.map((image, index) => (
              <motion.img
                key={index}
                src={image.src}
                alt={image.alt}
                loading="lazy"
                className="w-full h-[150px] object-cover absolute top-0 left-0"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: activeImage === index ? 1 : 0,
                  scale: activeImage === index ? 1 : 0.95,
                  filter:
                    isChangingBanner && activeImage === index
                      ? "brightness(1.2)"
                      : "brightness(1)",
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeInOut",
                  scale: {
                    duration: 1.2,
                    ease: "easeOut",
                  },
                }}
              />
            ))}

            {/* Dots điều khiển cho banner images */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2 z-10">
              {bannerImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleBannerDotClick(index)}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    activeImage === index ? "bg-white" : "bg-white/50"
                  }`}
                  aria-label={`Chuyển đến hình ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        <motion.div
          className="mt-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="w-full">
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : (
              <motion.div
                className="w-full grid grid-cols-2 lg:grid-cols-4 justify-around gap-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: false }}
                transition={{ staggerChildren: 0.1 }}
              >
                {/* Hiển thị sản phẩm với hiệu ứng slide */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPage}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="col-span-2 lg:col-span-4 w-full grid grid-cols-2 lg:grid-cols-4 gap-4"
                    ref={swipeRef}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {getPaginatedProducts(products, currentPage).map(
                      (product) => (
                        <ProductItem
                          key={product._id}
                          product={product}
                          handleAddToCart={handleAddToCart}
                          handleClick={handleClick}
                          getPrice={getPrice}
                        />
                      )
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Điều hướng trang sản phẩm - hiển thị trên cả mobile và PC */}
        {products.length > itemsPerPage && (
          <div className="w-full flex flex-col items-center mt-4">
            <div className="flex justify-center items-center">
              {/* Chỉ hiển thị dots điều hướng trang */}
              <div className="flex space-x-3">
                {Array.from({ length: getTotalPages(products) }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      currentPage === index
                        ? "bg-[#51aa1b] w-3.5"
                        : "bg-gray-300"
                    }`}
                    aria-label={`Đến trang ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default Fruit;
