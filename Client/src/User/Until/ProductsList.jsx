/* eslint-disable react/prop-types */
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping } from "@fortawesome/free-solid-svg-icons";
import { formatCurrency } from "../../utils/formatCurrency";

const ProductList = ({
  products = [], 
  isChangingPage,
  containerVariants,
  itemVariants,
  handleClick,
  handleAddToCart,
  getPrice,
}) => {
  return (
    <AnimatePresence mode="sync">
      <motion.div
        key={products.length > 0 ? "products" : "empty"}
        initial="hidden"
        animate={isChangingPage ? "exit" : "visible"}
        exit="exit"
        variants={containerVariants}
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 "
      >
        {products.length > 0 ? (
          products.map((product, index) => (
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
                  className="w-full mx-auto h-[197px] object-cover hover-scale-up lg:w-[272px] lg:h-[272px]"
                  loading="lazy"
                />
                {(product.productStock === 0 || product.productStatus === "Hết hàng") && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white px-2 py-1 text-xs font-semibold">
                    Hết hàng
                  </div>
                )}
              </div>
              <div className="flex flex-col mt-auto p-4 gap-2">
                <p className="text-gray-400 text-[10px] lg:text-[14px]">
                  {product.productCategory}
                </p>
                <p className="font-medium text-[10px] hover:text-[#51aa1b] line-clamp-1 lg:text-[14px] transition-colors duration-300">
                  {product.productName}
                </p>
                {product.productDiscount > 0 ? (
                  <div className="flex items-center gap-2 mt-4 justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-[#51aa1b] text-[10px] mt-1 lg:text-[14px]">
                        {formatCurrency(getPrice(product))}đ
                      </p>
                      <p className="text-gray-400 text-[10px] mt-1 lg:text-[14px] line-through">
                        {formatCurrency(product.productPrice)}đ
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
                      className={`p-2 rounded-full text-[16px] size-5 mt-1 lg:text-[14px] ${
                        product.productStock === 0 || product.productStatus === "Hết hàng"
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : "bg-[#51aa1b] text-white cursor-pointer hover:bg-[#438e17]"
                      }`}
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
                        if (product.productStock > 0 && product.productStatus !== "Hết hàng") {
                        handleAddToCart(product._id);
                        }
                      }}
                      icon={faCartShopping}
                      className={`p-2 rounded-full text-[16px] size-5 mt-1 lg:text-[14px] ${
                        product.productStock === 0 || product.productStatus === "Hết hàng"
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : "bg-[#51aa1b] text-white cursor-pointer hover:bg-[#438e17]"
                      }`}
                    />
                  </div>
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
  );
};

export default ProductList;
