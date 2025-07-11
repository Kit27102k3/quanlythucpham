/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import ProductList from "../../Until/ProductsList";
import productsApi from "../../../api/productsApi";
import useCartAndNavigation from "../../Until/useCartAndNavigation";
import { motion } from "framer-motion";
import "../../../index.css";

function AllProducts({
  sortOption,
  priceFilters,
  typeFilters,
  showPromotional = false,
  category: propCategory,
}) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(8);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const { handleAddToCart, handleClick, getPrice } = useCartAndNavigation();
  const { category: paramCategory } = useParams();
  const location = useLocation();
  const productsContainerRef = useRef(null);
  
  // Ưu tiên category từ props, nếu không có thì lấy từ params
  const category = propCategory || paramCategory;

  useEffect(() => {
    const fetchAllProducts = async () => {
      const res = await productsApi.getAllProducts();
      const filteredRes = showPromotional
        ? res.filter((product) => product?.productDiscount > 0)
        : res;
      
      // Filter out products that are out of stock
      const inStockProducts = filteredRes.filter(product => 
        product.productStatus !== "Hết hàng" && 
        (product.productStock === undefined || 
         product.productStock === null || 
         product.productStock > 0)
      );
      
      setProducts(inStockProducts);
      console.log("Fetched products (in stock only):", inStockProducts);
    };
    fetchAllProducts();
  }, [showPromotional]);

  useEffect(() => {
    let filtered = [...products];
    console.log("Category used for filtering:", category);
    
    // Lọc theo danh mục từ URL nếu có
    if (category) {
      const decodedCategory = typeof category === 'string' ? decodeURIComponent(category) : category;
      console.log("Decoded category:", decodedCategory);
      
      // Danh sách các danh mục chính xác
      const exactCategories = [
        "NƯỚC NGỌT, GIẢI KHÁT",
        "BIA, NƯỚC UỐNG CÓ CỒN",
        "NƯỚC SUỐI",
        "NƯỚC TRÁI CÂY ÉP",
        "NƯỚC YẾN",
        "CÀ PHÊ, TRÀ",
        "NƯỚC SỮA TRÁI CÂY",
        "SỮA TƯƠI",
        "SỮA ĐẬU NÀNH, SỮA TỪ HẠT",
        "SỮA ĐẶC",
        "SỮA CHUA, PHÔ MAI",
        "SỮA BỘT, BỘT ĂN DẶM",
        "MÌ ĂN LIỀN",
        "CHÁO ĂN LIỀN",
        "PHỞ ĂN LIỀN",
        "THỰC PHẨM ĂN LIỀN KHÁC",
        "DẦU ĂN",
        "NƯỚC TƯƠNG",
        "NƯỚC MẮM",
        "TƯƠNG ỚT, TƯƠNG CÀ, TƯƠNG ĐEN",
        "ĐƯỜNG, HẠT NÊM, BỘT NGỌT, MUỐI"
      ];
      
      // Kiểm tra nếu danh mục được chọn là một trong các danh mục chính xác
      const isExactCategory = exactCategories.some(
        cat => cat.toLowerCase() === decodedCategory.toLowerCase()
      );
      
      if (isExactCategory) {
        // Nếu là danh mục chính xác, lọc chính xác theo tên danh mục
        filtered = filtered.filter(product => {
          const productCategory = (product.productCategory || '').toLowerCase();
          const categoryLower = decodedCategory.toLowerCase();
          
          // Kiểm tra chính xác danh mục hoặc từ đầu tiên của danh mục
          return productCategory === categoryLower || 
                 productCategory.startsWith(categoryLower.split(',')[0].trim());
        });
      } else {
        // Tiếp cận 1: Tìm kiếm chính xác chuỗi danh mục (ưu tiên)
        let exactMatches = filtered.filter(product => {
          const productCategory = (product.productCategory || '').toLowerCase();
          return productCategory.includes(decodedCategory.toLowerCase());
        });
        
        // Nếu tìm được ít nhất 1 kết quả khớp chính xác, sử dụng nó
        if (exactMatches.length > 0) {
          console.log("Found exact category matches:", exactMatches.length);
          filtered = exactMatches;
        } 
        // Nếu không tìm thấy khớp chính xác, thử tìm theo từ khóa
        else {
          // Tách danh mục thành các từ khóa có nghĩa
          // Loại bỏ các từ quá ngắn như "và", "với", "các"...
          const keywords = decodedCategory.toLowerCase().split(/[,\s]+/).filter(keyword => keyword.length > 3);
          console.log("Keywords for search:", keywords);
          
          filtered = filtered.filter((product) => {
            // Ưu tiên tìm trong danh mục sản phẩm
            const productCategory = (product.productCategory || '').toLowerCase();
            const productName = (product.productName || '').toLowerCase();
            
            // Đếm số từ khóa khớp với danh mục sản phẩm
            const categoryMatchCount = keywords.filter(keyword => 
              productCategory.includes(keyword)
            ).length;
            
            // Đếm số từ khóa khớp với tên sản phẩm
            const nameMatchCount = keywords.filter(keyword => 
              productName.includes(keyword)
            ).length;
            
            // Tính điểm phù hợp (category match có trọng số cao hơn)
            const relevanceScore = (categoryMatchCount * 2) + nameMatchCount;
            
            // Sản phẩm phải có ít nhất 2 điểm phù hợp
            // Hoặc khớp chính xác với ít nhất 1 từ khóa quan trọng trong cả category và name
            const hasImportantKeywordMatch = keywords.some(keyword => 
              (productCategory.includes(keyword) && productName.includes(keyword)) &&
              (keyword.length > 4) // từ khóa quan trọng thường dài hơn
            );
            
            return relevanceScore >= 2 || hasImportantKeywordMatch;
          });
        }
      }
      
      console.log("Filtered products count:", filtered.length);
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
        const productCategory = (product.productCategory || '').toLowerCase();
        
        return typeFilters.some(type => {
          const typeName = type.name.toLowerCase();
          
          // Kiểm tra nếu loại là một phần của danh mục sản phẩm
          return productCategory.includes(typeName) || 
                 // Hoặc tên sản phẩm chứa tên loại và cũng phải phù hợp với danh mục
                 ((product.productName || '').toLowerCase().includes(typeName) && productCategory.includes(typeName.split(' ')[0]));
        });
      });
      
      console.log("Products after type filtering:", filtered.length);
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
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  // Tính tổng số trang
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Hiệu ứng mượt mà khi chuyển trang
  const smoothScrollTop = () => {
    setIsChangingPage(true); // Bắt đầu hiệu ứng chuyển trang

    // Delay một chút để hiệu ứng fade out diễn ra
    setTimeout(() => {
      const scrollOptions = {
        top: 0,
        behavior: "smooth",
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
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="py-6" ref={productsContainerRef}>
      {category && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#51bb1a] mb-2">
            {decodeURIComponent(category)}
          </h2>
        </div>
      )}

      <ProductList
        products={currentProducts}
        isChangingPage={isChangingPage}
        containerVariants={containerVariants}
        itemVariants={itemVariants}
        handleClick={handleClick}
        handleAddToCart={handleAddToCart}
        getPrice={getPrice}
      />

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
