/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import productsApi from "../../../api/productsApi";
import useCartAndNavigation from "../../Until/useCartAndNavigation";
import ProductList from "../../Until/ProductsList";

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
      <div>
        <ProductList
          products={products}
          containerVariants={containerVariants}
          itemVariants={itemVariants}
          handleClick={handleClick}
          handleAddToCart={handleAddToCart}
          getPrice={getPrice}
        />
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
