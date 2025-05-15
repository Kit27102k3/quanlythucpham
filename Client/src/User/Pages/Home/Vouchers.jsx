import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "../../../utils/formatCurrency";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

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

function Vouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
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
      src: "https://images.pexels.com/photos/6634172/pexels-photo-6634172.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      alt: "Mã giảm giá đặc biệt"
    },
    {
      src: "https://images.pexels.com/photos/7319098/pexels-photo-7319098.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      alt: "Ưu đãi giới hạn"
    }
  ];

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setLoading(true);
        let success = false;
        
        // List of potential endpoints to try
        const endpoints = [
          '/api/coupons/active',
          '/api/coupons/public',
          '/api/coupons/all-for-debug'
        ];
        
        for (const endpoint of endpoints) {
          if (success) break;
          
          try {
            console.log(`Attempting to fetch vouchers from ${endpoint} endpoint`);
            const response = await axios.get(`${endpoint}?limit=3`);
            
            console.log(`Vouchers API response from ${endpoint}:`, response.data);
            
            // Handle different response formats
            if (response.data && Array.isArray(response.data)) {
              setVouchers(response.data);
              success = true;
              console.log(`Successfully fetched vouchers from ${endpoint}`);
              break;
            } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
              setVouchers(response.data.data);
              success = true;
              console.log(`Successfully fetched vouchers from ${endpoint} with data property`);
              break;
            } else {
              console.error(`Unexpected response format from ${endpoint}:`, response.data);
            }
          } catch (error) {
            console.error(`Error fetching vouchers from ${endpoint}:`, error);
          }
        }
        
        // If all endpoints failed, use dummy data in development
        if (!success) {
          if (process.env.NODE_ENV === 'development') {
            console.log('All endpoints failed. Creating dummy voucher data for development');
            setVouchers([
              {
                _id: 'dummy1',
                code: 'WELCOME10',
                type: 'percentage',
                value: 10,
                minOrder: 100000,
                maxDiscount: 50000,
                usageLimit: 100,
                used: 45,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                description: 'Giảm 10% cho đơn hàng đầu tiên'
              },
              {
                _id: 'dummy2',
                code: 'FREESHIP',
                type: 'fixed',
                value: 30000,
                minOrder: 200000,
                usageLimit: null,
                used: 0,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                description: 'Miễn phí vận chuyển'
              },
              {
                _id: 'dummy3',
                code: 'SUMMER25',
                type: 'percentage',
                value: 25,
                minOrder: 500000,
                maxDiscount: 100000,
                usageLimit: 50,
                used: 12,
                expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                description: 'Giảm 25% cho mùa hè'
              }
            ]);
          } else {
            console.log('All endpoints failed and not in development mode. Setting empty vouchers array.');
            setVouchers([]);
          }
        }
      } catch (mainError) {
        console.error('Top-level error in fetchVouchers:', mainError);
        setVouchers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
    
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

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopied(code);
        setTimeout(() => setCopied(null), 2000);
      })
      .catch(err => console.error('Failed to copy code:', err));
  };

  const formatVoucherValue = (voucher) => {
    if (voucher.type === 'percentage') {
      return `${voucher.value}%`;
    } else {
      return `${formatCurrency(voucher.value)}đ`;
    }
  };

  const getVoucherColor = (index) => {
    const colors = [
      'bg-gradient-to-r from-green-500 to-green-600',
      'bg-gradient-to-r from-blue-500 to-blue-600',
      'bg-gradient-to-r from-purple-500 to-purple-600'
    ];
    return colors[index % colors.length];
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
    
    if (isLeftSwipe && currentPage < getTotalPages(vouchers) - 1) {
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
  const itemsPerPage = isMobile ? 1 : 3;
  
  const getTotalPages = (items) => {
    return Math.ceil(items.length / itemsPerPage);
  };
  
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  
  const getPaginatedVouchers = (items, page) => {
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

  if (vouchers.length === 0) {
    return null;
  }

  return (
    <div className="mt-10 mb-12">
      <div className="text-center mb-6">
        <button className="bg-yellow-400 text-[#000000] text-sm p-2 rounded font-medium lg:text-[16px]">
          KHUYẾN MÃI
        </button>
        <h1 className="text-[26px] font-medium mt-2 text-center lg:text-[40px]">MÃ GIẢM GIÁ</h1>
        <p className="text-gray-500 text-[13px] lg:text-[16px]">
          Sử dụng mã giảm giá để nhận ưu đãi khi mua hàng
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
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4"
          >
            {getPaginatedVouchers(vouchers, currentPage).map((voucher, index) => (
              <motion.div
                key={voucher._id}
                variants={itemVariants}
                className={`rounded-lg shadow-md overflow-hidden relative ${getVoucherColor(index)} text-white`}
              >
                <div className="absolute top-0 right-0 w-16 h-16">
                  <div className="absolute transform rotate-45 bg-white text-green-600 text-xs font-bold py-1 right-[-35px] top-[15px] w-[140px] text-center">
                    {voucher.usageLimit ? `Còn ${voucher.usageLimit - voucher.used}` : 'Không giới hạn'}
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold mb-2">Giảm {formatVoucherValue(voucher)}</h3>
                      <p className="text-sm mb-1">Đơn tối thiểu: {formatCurrency(voucher.minOrder)}đ</p>
                      {voucher.maxDiscount && (
                        <p className="text-sm mb-1">Giảm tối đa: {formatCurrency(voucher.maxDiscount)}đ</p>
                      )}
                      {voucher.expiresAt && (
                        <p className="text-sm">Hết hạn: {format(new Date(voucher.expiresAt), 'dd/MM/yyyy', { locale: vi })}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between bg-white rounded p-2">
                    <span className="text-gray-800 font-bold">{voucher.code}</span>
                    <button
                      onClick={() => handleCopyCode(voucher.code)}
                      className="ml-2 p-2 bg-green-500 hover:bg-green-600 rounded text-white transition-colors"
                    >
                      <FontAwesomeIcon icon={faCopy} />
                      {copied === voucher.code && (
                        <span className="absolute top-0 right-0 bg-black text-white text-xs p-1 rounded mt-[-20px]">
                          Đã sao chép!
                        </span>
                      )}
                    </button>
                  </div>
                  
                  {voucher.description && (
                    <p className="mt-3 text-sm italic">{voucher.description}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </AnimatePresence>
      
      {/* Pagination dots */}
      {vouchers.length > itemsPerPage && (
        <div className="w-full flex flex-col items-center mt-6">
          <div className="flex justify-center items-center">
            <div className="flex space-x-3">
              {Array.from({ length: getTotalPages(vouchers) }, (_, index) => (
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

export default Vouchers; 