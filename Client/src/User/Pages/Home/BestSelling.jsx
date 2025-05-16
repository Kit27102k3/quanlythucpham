import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "../../../utils/formatCurrency";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping } from "@fortawesome/free-solid-svg-icons";
import useCartAndNavigation from "../../Until/useCartAndNavigation";
import {API_URLS} from "../../../config/apiConfig";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  },
  exit: { opacity: 0 }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

function BestSelling() {
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { handleAddToCart, handleClick } = useCartAndNavigation();
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const [isChangingBanner, setIsChangingBanner] = useState(false);
  
  // Handle swipe gestures
  const swipeRef = useRef(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  // Banner images for mobile
  const bannerImages = [
    {
      src: "https://images.pexels.com/photos/4062274/pexels-photo-4062274.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      alt: "Sản phẩm bán chạy nhất"
    },
    {
      src: "https://images.pexels.com/photos/5945839/pexels-photo-5945839.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      alt: "Sản phẩm nổi bật"
    }
  ];

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        let products = [];
        
        try {
          const response = await axios.get(`${API_URLS.PRODUCTS}/best-sellers?limit=4`);
          
          // Check if the response has a data property structure used by the server
          if (response.data && response.data.success && response.data.data) {
            products = response.data.data;
          } else {
            // If not, assume the response is the direct array of products
            products = response.data;
          }
        } catch (error) {
          console.error('Error fetching best selling products:', error);
          
          // If API fails, try a fallback to get regular products
          try {
            const fallbackResponse = await axios.get('/api/products?limit=4');
            if (fallbackResponse.data && Array.isArray(fallbackResponse.data)) {
              products = fallbackResponse.data;
            }
          } catch (fallbackError) {
            console.error('Fallback fetch also failed:', fallbackError);
          }
        }
        
        setBestSellers(products);
        setLoading(false);
      } catch (mainError) {
        console.error('Could not fetch any products:', mainError);
        setLoading(false);
      }
    };

    fetchBestSellers();
    
    // Check screen size on mount
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);
  
  // Get price function
  const getPrice = (product) => {
    if (product.productDiscount > 0) {
      return product.productPrice - (product.productPrice * product.productDiscount / 100);
    }
    return product.productPrice;
  };
  
  // Mobile swipe handlers
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
    
    if (isLeftSwipe && currentPage < getTotalPages(bestSellers) - 1) {
      handlePageChange(currentPage + 1);
    }
    
    if (isRightSwipe && currentPage > 0) {
      handlePageChange(currentPage - 1);
    }
    
    // Reset touch values
    setTouchStart(0);
    setTouchEnd(0);
  };
  
  // Banner dot click handler
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
  
  // Pagination utilities
  const itemsPerPage = isMobile ? 2 : 4;
  
  const getTotalPages = (items) => {
    return Math.ceil(items.length / itemsPerPage);
  };
  
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  
  const getPaginatedProducts = (items, page) => {
    const startIndex = page * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };
  
  // Cycle through banner images every 5 seconds
  useEffect(() => {
    if (isMobile) {
      const interval = setInterval(() => {
        setIsChangingBanner(true);
        setTimeout(() => {
          setActiveImage(prev => (prev === 0 ? 1 : 0));
          setTimeout(() => {
            setIsChangingBanner(false);
          }, 500);
        }, 300);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isMobile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Return null if no best sellers found
  if (!bestSellers || bestSellers.length === 0) {
    return null;
  }

  return (
    <div className="mt-10 mb-12">
      <div className=" mb-6 text-center lg:text-left">
        <button className="bg-yellow-400 text-[#000000] text-sm p-2 rounded font-medium lg:text-[16px]">
          SẢN PHẨM NỔI BẬT
        </button>
        <h1 className="text-[26px]  font-medium mt-2 lg:text-[40px]">BÁN CHẠY NHẤT</h1>
        <p className="text-gray-500 text-[13px] lg:text-[16px]">
          Những sản phẩm được khách hàng tin dùng và mua nhiều nhất
        </p>
      </div>
      
      {/* Mobile Banner */}
      {isMobile && (
        <div className="w-full mb-6">
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
                  filter: isChangingBanner && activeImage === index ? 'brightness(1.2)' : 'brightness(1)'
                }}
                transition={{ 
                  duration: 0.8,
                  ease: "easeInOut",
                  scale: {
                    duration: 1.2,
                    ease: "easeOut"
                  }
                }}
              />
            ))}
            
            {/* Banner navigation dots */}
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
      )}
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="w-full"
          ref={swipeRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2"
          >
            {getPaginatedProducts(bestSellers, currentPage).map((product, index) => {
              // Handle both direct product objects and products inside a productId property
              const productData = product.productId || product;
              if (!productData) return null;
              
              return (
                <motion.div
                  key={`${productData._id}-${index}`}
                  variants={itemVariants}
                  onClick={() => handleClick(productData)}
                  className="items-center justify-center bg-white rounded-md overflow-hidden shadow-lg hover:shadow-md transition-shadow duration-300 relative"
                >
                  <div className="relative">
                    <img
                      src={`${productData.productImages?.[0]}`}
                      alt={productData.productName}
                      className="w-full mx-auto h-[197px] object-cover hover-scale-up lg:w-[272px] lg:h-[272px]"
                      loading="lazy"
                    />
                    {(productData.productStock === 0 || productData.productStatus === "Hết hàng") && (
                      <div className="absolute top-0 right-0 bg-red-600 text-white px-2 py-1 text-xs font-semibold">
                        Hết hàng
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col mt-auto p-4 gap-2">
                    <p className="text-gray-400 text-[10px] lg:text-[14px]">
                      {product.productCategory || productData.productCategory}
                    </p>
                    <p className="font-medium text-[10px] hover:text-[#51aa1b] line-clamp-1 lg:text-[14px] transition-colors duration-300">
                      {productData.productName}
                    </p>
                    {productData.productDiscount > 0 ? (
                      <div className="flex items-center gap-2 mt-4 justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-[#51aa1b] text-[10px] mt-1 lg:text-[14px]">
                            {formatCurrency(getPrice(productData))}
                          </p>
                          <p className="text-gray-400 text-[10px] mt-1 lg:text-[14px] line-through">
                            {formatCurrency(productData.productPrice)}
                          </p>
                        </div>
                        <FontAwesomeIcon
                          onClick={(e) => {
                            e.stopPropagation();
                            if (productData.productStock > 0 && productData.productStatus !== "Hết hàng") {
                              handleAddToCart(productData._id);
                            }
                          }}
                          icon={faCartShopping}
                          className={`p-2 rounded-full text-[16px] size-5 mt-1 lg:text-[14px] ${
                            productData.productStock === 0 || productData.productStatus === "Hết hàng"
                              ? "bg-gray-400 text-white cursor-not-allowed"
                              : "bg-[#51aa1b] text-white cursor-pointer hover:bg-[#438e17]"
                          }`}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 justify-between mt-4">
                        <p className="text-[#51aa1b] text-[10px] mt-1 lg:text-[16px]">
                          {formatCurrency(getPrice(productData))}đ
                        </p>
                        <FontAwesomeIcon
                          onClick={(e) => {
                            e.stopPropagation();
                            if (productData.productStock > 0 && productData.productStatus !== "Hết hàng") {
                              handleAddToCart(productData._id);
                            }
                          }}
                          icon={faCartShopping}
                          className={`p-2 rounded-full text-[16px] size-5 mt-1 lg:text-[14px] ${
                            productData.productStock === 0 || productData.productStatus === "Hết hàng"
                              ? "bg-gray-400 text-white cursor-not-allowed"
                              : "bg-[#51aa1b] text-white cursor-pointer hover:bg-[#438e17]"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </AnimatePresence>
      
      {/* Pagination dots */}
      {bestSellers.length > itemsPerPage && (
        <div className="w-full flex flex-col items-center mt-4">
          <div className="flex justify-center items-center">
            <div className="flex space-x-3">
              {Array.from({ length: getTotalPages(bestSellers) }, (_, index) => (
                <button
                  key={index}
                  onClick={() => handlePageChange(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    currentPage === index ? 'bg-[#51aa1b] w-3.5' : 'bg-gray-300'
                  }`}
                  aria-label={`Đến trang ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BestSelling; 