import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import productsApi from "../../../API/productsApi";
import useCartAndNavigation from "../../Until/useCartAndNavigation";
import formatCurrency from "../../Until/FotmatPrice";

function ProductNew() {
  const [products, setProducts] = useState([]);
  const { handleClick, handleAddToCart, getPrice } = useCartAndNavigation();

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
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  const bannerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.5,
        delay: 0.3
      }
    }
  };

  return (
    <AnimatePresence mode="sync">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
          {products.map((product, index) => (
            <motion.div
              key={index}
              className="relative items-center justify-center group cursor-pointer bg-white rounded-md overflow-hidden"
              variants={itemVariants}
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
                    className="px-4 py-2 cursor-pointer bg-[#51aa1b] text-white uppercase text-[12px] hover:text-[#51aa1b] hover:bg-white hover:border hover:border-[#51aa1b]"
                  >
                    Thêm vào giỏ
                  </button>
                  <button
                    onClick={() => handleClick(product)}
                    className="px-4 py-2 cursor-pointer bg-[#51aa1b] text-white uppercase text-[12px] hover:text-[#51aa1b] hover:bg-white hover:border hover:border-[#51aa1b]"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-center mt-auto p-4 text-center">
                <p className="font-medium text-[10px] hover:text-[#51aa1b] line-clamp-1 lg:text-[14px]">
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
          ))}
        </motion.div>

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
              <h2 className="text-[#51aa1b] text-xl font-semibold">
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
      </motion.div>
    </AnimatePresence>
  );
}

export default ProductNew;
