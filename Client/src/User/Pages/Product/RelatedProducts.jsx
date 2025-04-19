import { useState, useEffect } from "react";
import { Carousel } from "primereact/carousel";
import PropTypes from "prop-types";
import productsApi from "../../../api/productsApi";
import useCartAndNavigation from "../../Until/useCartAndNavigation";
import "../../../index.css";
import { motion, AnimatePresence } from "framer-motion";
// import ProductList from "../../Until/ProductsList";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping } from "@fortawesome/free-solid-svg-icons";
import formatCurrency from "../../Until/FotmatPrice";

// Thêm style để căn giữa carousel
const carouselStyle = `
  .related-products-carousel .p-carousel-items-container {
    justify-content: center;
  }
  
  .related-products-carousel .p-carousel-item {
    display: flex;
    justify-content: center;
  }
  
  .related-products-carousel .p-carousel-indicators {
    display: flex;
    justify-content: center;
  }
`;

function RelatedProducts({ currentProduct }) {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const { handleAddToCart, handleClick, getPrice } = useCartAndNavigation();
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Force re-render animation khi component mount
    setKey((prevKey) => prevKey + 1);
  }, []);

  const fetchRelatedProducts = async (categoryName, currentProductId) => {
    try {
      const data = await productsApi.getProductByCategory(
        categoryName,
        currentProductId
      );
      setRelatedProducts(data);
    } catch (error) {
      console.error("Lỗi khi lấy sản phẩm liên quan:", error);
    }
  };

  useEffect(() => {
    if (currentProduct?.productCategory) {
      fetchRelatedProducts(currentProduct.productCategory, currentProduct._id);
    }
  }, [currentProduct]);

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

  const productTemplate = (product) => {
    return (
      <div className="w-full lg:w-[272px] mx-auto">
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
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      <style>{carouselStyle}</style>
      <motion.div 
        key={key} 
        className="px-2 sm:px-8 md:px-16 lg:px-[120px] my-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {relatedProducts.length > 0 && (
          <>
            <motion.h1
              className="uppercase text-lg sm:text-xl md:text-2xl lg:text-[26px] text-[#1c1c1c] text-center font-medium mb-6"
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.5 }}
            >
              Sản phẩm liên quan
            </motion.h1>

            <div className="card">
              <Carousel
                value={relatedProducts}
                numVisible={4}
                numScroll={1}
                responsiveOptions={[
                  {
                    breakpoint: "1400px",
                    numVisible: 3,
                    numScroll: 1,
                  },
                  {
                    breakpoint: "1199px",
                    numVisible: 2,
                    numScroll: 1,
                  },
                  {
                    breakpoint: "767px",
                    numVisible: 1,
                    numScroll: 1,
                  },
                ]}
                itemTemplate={productTemplate}
                circular
                showNavigators
                className="related-products-carousel"
              />
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

RelatedProducts.propTypes = {
  currentProduct: PropTypes.shape({
    _id: PropTypes.string,
    productCategory: PropTypes.string,
    productName: PropTypes.string,
    productPrice: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    productDiscount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    productImages: PropTypes.array,
  }),
};

export default RelatedProducts;
