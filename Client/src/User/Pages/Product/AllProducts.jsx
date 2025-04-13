/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import formatCurrency from "../../Until/FotmatPrice";
import productsApi from "../../../API/productsApi";
import useCartAndNavigation from "../../Until/useCartAndNavigation";
import "../../../index.css";
import { motion, AnimatePresence } from "framer-motion";

function AllProducts({
  sortOption,
  priceFilters,
  typeFilters,
  showPromotional = false,
}) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(9);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const { handleAddToCart, handleClick, getPrice } = useCartAndNavigation();
  const { category } = useParams();
  const location = useLocation();
  const productsContainerRef = useRef(null);

  useEffect(() => {
    const fetchAllProducts = async () => {
      const res = await productsApi.getAllProducts();
      const filteredRes = showPromotional
        ? res.filter((product) => product?.productDiscount > 0)
        : res;
      setProducts(filteredRes);
    };
    fetchAllProducts();
  }, [showPromotional]);

  useEffect(() => {
    let filtered = [...products];

    // Lọc theo danh mục từ URL nếu có
    if (category) {
      const decodedCategory = decodeURIComponent(category);
      filtered = filtered.filter((product) => {
        // Tìm kiếm sản phẩm theo tên danh mục hoặc mô tả
        return (
          product.productCategory?.includes(decodedCategory) ||
          product.productName?.includes(decodedCategory) ||
          product.productDetails?.includes(decodedCategory) ||
          product.productDescription?.some(desc => 
            desc.toLowerCase().includes(decodedCategory.toLowerCase())
          )
        );
      });
    }

    // Lọc theo giá
    if (priceFilters.length > 0) {
      filtered = filtered.filter((product) => {
        return priceFilters.some(
          (range) =>
            product.productPrice >= range.min &&
            product.productPrice <= range.max
        );
      });
    }

    // Lọc theo loại sản phẩm
    if (typeFilters.length > 0) {
      filtered = filtered.filter((product) => {
        return typeFilters.some(
          (type) => product.productCategory === type.name
        );
      });
    }

    switch (sortOption) {
      case "a-z":
        filtered.sort((a, b) => a.productName.localeCompare(b.productName));
        break;
      case "z-a":
        filtered.sort((a, b) => b.productName.localeCompare(a.productName));
        break;
      case "priceUp":
        filtered.sort((a, b) => a.productPrice - b.productPrice);
        break;
      case "priceDown":
        filtered.sort((a, b) => b.productPrice - a.productPrice);
        break;
      case "productNew":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        // Mặc định sắp xếp theo sản phẩm mới nhất
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    setFilteredProducts(filtered);
    // Reset về trang đầu tiên khi thay đổi bộ lọc
    setCurrentPage(1);
  }, [products, sortOption, priceFilters, typeFilters, category, location]);

  // Tính chỉ số sản phẩm đầu và cuối trên trang hiện tại
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  
  // Tính tổng số trang
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Hiệu ứng mượt mà khi chuyển trang
  const smoothScrollTop = () => {
    setIsChangingPage(true); // Bắt đầu hiệu ứng chuyển trang
    
    // Delay một chút để hiệu ứng fade out diễn ra
    setTimeout(() => {
      const scrollOptions = {
        top: 0,
        behavior: 'smooth'
      };
      
      if (productsContainerRef.current) {
        productsContainerRef.current.scrollIntoView(scrollOptions);
      } else {
        window.scrollTo(scrollOptions);
      }
      
      // Delay để hiệu ứng scroll hoàn thành trước khi fade in
      setTimeout(() => {
        setIsChangingPage(false); // Kết thúc hiệu ứng chuyển trang
      }, 300);
    }, 200);
  };

  // Hàm chuyển trang
  const paginate = (pageNumber) => {
    if (pageNumber !== currentPage) {
      smoothScrollTop();
      setCurrentPage(pageNumber);
    }
  };

  // Hàm chuyển đến trang trước
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      smoothScrollTop();
      setCurrentPage(currentPage - 1);
    }
  };

  // Hàm chuyển đến trang sau
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      smoothScrollTop();
      setCurrentPage(currentPage + 1);
    }
  };

  // Cấu hình animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="px-4 py-6" ref={productsContainerRef}>
      {category && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#51bb1a] mb-2">
            Sản phẩm: {decodeURIComponent(category)}
          </h2>
          <p className="text-gray-600 text-sm">
            Hiển thị {filteredProducts.length} sản phẩm
          </p>
        </div>
      )}
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial="hidden"
          animate={isChangingPage ? "exit" : "visible"}
          exit="exit"
          variants={containerVariants}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2"
        >
          {currentProducts.length > 0 ? (
            currentProducts.map((product, index) => (
              <motion.div
                key={`${product._id}-${index}`}
                variants={itemVariants}
                className="relative items-center justify-center group cursor-pointer bg-white rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={`${product.productImages[0]}`}
                    alt={product.productName}
                    className="w-full mx-auto h-[197px] object-cover hover-scale-up lg:w-[272px] lg:h-[272px]"
                    loading="lazy"
                  />
                  {product.productDiscount > 0 && (
                    <div className="bg-red-500 w-10 p-1 text-white rounded absolute top-2 left-2 text-center">
                      {product.productDiscount}%
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleAddToCart(product._id)}
                      className="px-4 py-2 cursor-pointer bg-[#51aa1b] text-white uppercase text-[12px] hover:text-[#51aa1b] hover:bg-white hover:border hover:border-[#51aa1b] transition-colors duration-300"
                    >
                      Thêm vào giỏ
                    </button>
                    <button
                      onClick={() => handleClick(product)}
                      className="px-4 py-2 cursor-pointer bg-[#51aa1b] text-white uppercase text-[12px] hover:text-[#51aa1b] hover:bg-white hover:border hover:border-[#51aa1b] transition-colors duration-300"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-center mt-auto p-4 text-center">
                  <p className="font-medium text-[10px] hover:text-[#51aa1b] line-clamp-1 lg:text-[14px] transition-colors duration-300">
                    {product.productName}
                  </p>
                  {product.productDiscount > 0 ? (
                    <div className="flex items-center gap-2">
                      <p className="text-[#51aa1b] text-[10px] mt-1 lg:text-[14px]">
                        {formatCurrency(getPrice(product))}đ
                      </p>
                      <p className="text-gray-400 text-[10px] mt-1 lg:text-[14px] line-through">
                        {formatCurrency(product.productPrice)}đ
                      </p>
                    </div>
                  ) : (
                    <p className="text-[#51aa1b] text-[10px] mt-1 lg:text-[14px]">
                      {formatCurrency(getPrice(product))}đ
                    </p>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-8"
            >
              <p className="text-gray-500">Không tìm thấy sản phẩm phù hợp</p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Phân trang */}
      {filteredProducts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center items-center mt-8"
        >
          <nav className="flex items-center gap-1">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded border transition-colors duration-300 ${
                currentPage === 1
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-green-600"
              }`}
            >
              &laquo;
            </button>
            
            {/* Hiển thị số trang */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => paginate(page)}
                className={`px-3 py-2 rounded border transition-all duration-300 ${
                  currentPage === page
                    ? "bg-[#51aa1b] text-white border-[#51aa1b] scale-105"
                    : "text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-green-600"
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded border transition-colors duration-300 ${
                currentPage === totalPages
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-green-600"
              }`}
            >
              &raquo;
            </button>
          </nav>
        </motion.div>
      )}
    </div>
  );
}

export default AllProducts;
