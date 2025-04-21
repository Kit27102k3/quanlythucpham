/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import * as React from "react";
const { useState, useEffect, memo } = React;
import "../../../index.css";
import productsApi from "../../../api/productsApi";
import useCartAndNavigation from "../../Until/useCartAndNavigation";
import SEO from "../../../components/SEO";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping } from "@fortawesome/free-solid-svg-icons";
import { formatCurrency } from "../../../utils/formatCurrency";

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

// Memo hóa ProductItem để tránh render lại không cần thiết
const ProductItem = memo(
  ({ product, handleAddToCart, handleClick, getPrice, isChangingPage }) => (
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
  const [isChangingPage, setIsChangingPage] = useState(false);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { handleAddToCart, handleClick, getPrice } = useCartAndNavigation();

  useEffect(() => {
    const fetchProductCategory = async () => {
      try {
        setIsLoading(true);
        const res = await productsApi.getProductByCategory("Trái");
        console.log(res);

        setProducts(res);
      } catch (error) {
        console.error("Lỗi khi lấy sản phẩm theo danh mục:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProductCategory();

    // Cleanup function
    return () => {
      // Đảm bảo dọn dẹp tài nguyên khi component unmount
    };
  }, []);

  return (
    <AnimatePresence mode="sync">
      <motion.div
        className="grid grid-cols-1 px-4"
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
          className="text-[14px] font-medium text-[#292929] uppercase lg:text-[35px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.3 }}
        >
          Trái cây nhập khẩu
        </motion.h2>

        <motion.div
          className="mt-4 gap-10 lg:grid lg:grid-cols-[70%_30%]"
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
                className="w-full grid grid-cols-2 lg:grid-cols-3 justify-around gap-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: false }}
                transition={{ staggerChildren: 0.1 }}
              >
                {products.map((product) => (
                  <ProductItem
                    key={product._id}
                    product={product}
                    handleAddToCart={handleAddToCart}
                    handleClick={handleClick}
                    getPrice={getPrice}
                  />
                ))}
              </motion.div>
            )}
          </div>

          <div className="w-full grid grid-cols-2 lg:grid-cols-1 mt-4 items-center justify-between gap-4">
            <motion.img
              src="https://bizweb.dktcdn.net/100/360/151/themes/727143/assets/evo_col_product_banner_1.jpg?1721896755861"
              alt="Khuyến mãi đặc biệt cho trái cây"
              loading="lazy"
              width="273"
              height="358"
              className="w-[332px] h-[300px] lg:w-[273px] lg:h-[358px]"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false }}
              transition={{ duration: 0.5, delay: 0.3 }}
            />
            <motion.img
              src="https://bizweb.dktcdn.net/100/360/151/themes/727143/assets/evo_col_product_banner_1s.jpg?1721896755861"
              alt="Ưu đãi trái cây nhập khẩu"
              loading="lazy"
              width="273"
              height="358"
              className="w-[332px] h-[300px] lg:w-[273px] lg:h-[358px]"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false }}
              transition={{ duration: 0.5, delay: 0.5 }}
            />
          </div>
        </motion.div>

        <motion.img
          src="https://bizweb.dktcdn.net/100/360/151/themes/727143/assets/evo_banner_full_1.jpg?1721896755861"
          alt="Banner khuyến mãi trái cây"
          loading="lazy"
          width="1200"
          height="200"
          className="w-full mt-5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5, delay: 0.6 }}
        />
      </motion.div>
    </AnimatePresence>
  );
}

export default Fruit;
