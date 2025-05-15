/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import productsApi from "../../../api/productsApi";
import useCartAndNavigation from "../../Until/useCartAndNavigation";
import ProductList from "../../Until/ProductsList";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping } from "@fortawesome/free-solid-svg-icons";
import { formatCurrency } from "../../../utils/formatCurrency";

function ProductNew() {
  const [products, setProducts] = useState([]);
  const { handleClick, handleAddToCart, getPrice } = useCartAndNavigation();
  const [isMobile, setIsMobile] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  const productContainerRef = useRef(null);
  
  // Kiểm tra device
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);
  
  // Xử lý vuốt trên mobile
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
    
    if (isLeftSwipe && activeSlide < getSlideCount() - 1) {
      setActiveSlide(prev => prev + 1);
    }
    
    if (isRightSwipe && activeSlide > 0) {
      setActiveSlide(prev => prev - 1);
    }
    
    setTouchStart(0);
    setTouchEnd(0);
  };
  
  // Chuyển đến slide theo index
  const handleDotClick = (index) => {
    setActiveSlide(index);
  };
  
  // Lấy số slide cần hiển thị
  const getSlideCount = () => {
    if (!products.length) return 0;
    return Math.ceil(products.length / 2); // Hiển thị 2 sản phẩm mỗi slide
  };
  
  // Lấy sản phẩm cho slide hiện tại
  const getProductsForCurrentSlide = () => {
    const startIndex = activeSlide * 2;
    return products.slice(startIndex, startIndex + 2);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productsApi.getAllProducts();
        const sortedData = data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 4);

        setProducts(sortedData);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error);
      }
    };
    fetchProducts();

    // Cleanup function
    return () => {
      // Đảm bảo dọn dẹp tài nguyên khi component unmount
    };
  }, []);

  // Cấu hình animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

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

  const bannerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: 0.3,
      },
    },
  };

  return (
    <>
      {/* Hiển thị khác nhau trên mobile và desktop */}
      <div>
        {isMobile ? (
          <div 
            ref={productContainerRef}
            className="mb-4"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="grid grid-cols-2 gap-2"
              >
                {getProductsForCurrentSlide().map((product, index) => (
                  <motion.div
                    key={`${product._id}-${index}`}
                    variants={itemVariants}
                    onClick={() => handleClick(product)}
                    className="items-center justify-center bg-white rounded-md overflow-hidden shadow-lg hover:shadow-md transition-shadow duration-300 relative"
                  >
                    <div className="relative">
                      <img
                        src={`${product.productImages[0]}`}
                        alt={product.productName}
                        className="w-full mx-auto h-[197px] object-cover hover-scale-up"
                        loading="lazy"
                      />
                      {(product.productStock === 0 || product.productStatus === "Hết hàng") && (
                        <div className="absolute top-0 right-0 bg-red-600 text-white px-2 py-1 text-xs font-semibold">
                          Hết hàng
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col mt-auto p-4 gap-2">
                      <p className="text-gray-400 text-[10px]">
                        {product.productCategory}
                      </p>
                      <p className="font-medium text-[10px] hover:text-[#51aa1b] line-clamp-1 transition-colors duration-300">
                        {product.productName}
                      </p>
                      {product.productDiscount > 0 ? (
                        <div className="flex items-center gap-2 mt-4 justify-between">
                          <div className="flex items-center gap-2">
                            <p className="text-[#51aa1b] text-[10px] mt-1">
                              {formatCurrency(getPrice(product))}
                            </p>
                            <p className="text-gray-400 text-[10px] mt-1 line-through">
                              {formatCurrency(product.productPrice)}
                            </p>
                          </div>
                          <FontAwesomeIcon
                            onClick={(e) => {
                              e.stopPropagation();
                              if (product.productStock > 0 && product.productStatus !== "Hết hàng") {
                                handleAddToCart(product._id);
                              }
                            }}
                            icon={faCartShopping}
                            className={`p-2 rounded-full text-[16px] size-5 mt-1 ${
                              product.productStock === 0 || product.productStatus === "Hết hàng"
                                ? "bg-gray-400 text-white cursor-not-allowed"
                                : "bg-[#51aa1b] text-white cursor-pointer hover:bg-[#438e17]"
                            }`}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-between mt-4">
                          <p className="text-[#51aa1b] text-[10px] mt-1">
                            {formatCurrency(getPrice(product))}
                          </p>
                          <FontAwesomeIcon
                            onClick={(e) => {
                              e.stopPropagation();
                              if (product.productStock > 0 && product.productStatus !== "Hết hàng") {
                                handleAddToCart(product._id);
                              }
                            }}
                            icon={faCartShopping}
                            className={`p-2 rounded-full text-[16px] size-5 mt-1 ${
                              product.productStock === 0 || product.productStatus === "Hết hàng"
                                ? "bg-gray-400 text-white cursor-not-allowed"
                                : "bg-[#51aa1b] text-white cursor-pointer hover:bg-[#438e17]"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
            
            {/* Dots điều hướng slide */}
            {products.length > 2 && (
              <div className="w-full flex justify-center mt-3">
                <div className="flex space-x-3">
                  {Array.from({ length: getSlideCount() }, (_, index) => (
                    <button
                      key={index}
                      onClick={() => handleDotClick(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        activeSlide === index ? 'bg-[#51aa1b] w-3.5' : 'bg-gray-300'
                      }`}
                      aria-label={`Đến slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <ProductList
            products={products}
            containerVariants={containerVariants}
            itemVariants={itemVariants}
            handleClick={handleClick}
            handleAddToCart={handleAddToCart}
            getPrice={getPrice}
          />
        )}
      </div>
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
      >
        <motion.div
          className="p-4 rounded-lg relative"
          variants={bannerVariants}
        >
          <img
            alt="fresh-grapes"
            src="https://bizweb.dktcdn.net/100/360/151/themes/727143/assets/evo_banner_index_1.jpg?1721896755861"
            className="my-2 rounded-md shadow-lg w-full h-[327px] object-cover"
            loading="lazy"
          />
          <div className="absolute top-[20%] left-[40px]">
            <h2 className="text-[#51aa1b] text-xl font-semibold">
              THỰC PHẨM SẠCH
            </h2>
            <p className="text-2xl font-extralight">
              Đồ ăn tươi ngon <br /> Mỗi ngày
            </p>
            <button className="bg-[#d73e6e] text-white w-[150px] hover:bg-secondary/80 mt-2 p-2 rounded-4xl cursor-pointer">
              XEM THÊM
            </button>
          </div>
        </motion.div>

        <motion.div
          className="p-4 rounded-lg relative"
          variants={bannerVariants}
        >
          <img
            alt="fresh-lemon"
            src="https://bizweb.dktcdn.net/100/360/151/themes/727143/assets/evo_banner_index_2.jpg?1721896755861"
            className="my-2 rounded-md shadow-lg w-full h-[327px] object-cover"
            loading="lazy"
          />
          <div className="absolute left-[40px] top-[20%]">
            <h2 className="text-[#51aa1b] text-xl font-semibold ">
              THỰC PHẨM TƯƠI
            </h2>
            <p className="text-2xl font-extralight">
              Giao nhanh <br /> Chớp mắt
            </p>
            <button className="bg-[#fcc108] text-white w-[150px] hover:bg-secondary/80 mt-2 p-2 rounded-4xl cursor-pointer">
              XEM THÊM
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

export default ProductNew;
