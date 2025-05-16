import { useState, useEffect } from "react";
import { Carousel } from "primereact/carousel";
import PropTypes from "prop-types";
import productsApi from "../../../api/productsApi";
import useCartAndNavigation from "../../Until/useCartAndNavigation";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping } from "@fortawesome/free-solid-svg-icons";
import formatCurrency from "../../Until/FotmatPrice";

function RelatedProducts({ currentProduct }) {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const { handleAddToCart, handleClick, getPrice } = useCartAndNavigation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
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
    if (currentProduct?.productCategory) {
      fetchRelatedProducts(currentProduct.productCategory, currentProduct._id);
    }
  }, [currentProduct]);

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

  const productTemplate = (product) => (
    <motion.div
      variants={itemVariants}
      className="flex justify-center items-stretch h-full -mr-[0px] lg:mr-[5px]"
    >
      <div 
        onClick={() => handleClick(product)}
        className="flex flex-col h-full w-[150px] max-w-xs md:w-64 bg-white rounded-md overflow-hidden shadow-sm hover:shadow transition-all cursor-pointer"
      >
        <div className="aspect-square overflow-hidden relative w-full">
          <img
            src={`${product.productImages[0]}`}
            alt={product.productName}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <div className="flex flex-col p-3 flex-grow">
          <p className="text-gray-500 text-xs mb-1">{product.productCategory}</p>
          <h3 className="font-medium text-sm mb-3 line-clamp-2 hover:text-[#51aa1b] transition-colors">
            {product.productName}
          </h3>
          <div className="mt-auto pt-1 flex items-center justify-between">
            <div className="flex flex-col">
              {product.productDiscount > 0 && (
                <span className="text-xs text-gray-400 line-through">
                  {formatCurrency(product.productPrice)}
                </span>
              )}
              <span className={`text-sm font-medium ${product.productDiscount > 0 ? 'text-[#51aa1b]' : 'text-gray-800'}`}>
                {formatCurrency(getPrice(product))}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(product._id);
              }}
              className="cart-btn bg-[#51aa1b] hover:bg-[#458f17] w-9 h-9 flex items-center justify-center rounded-full text-white"
              aria-label="Thêm vào giỏ hàng"
            >
              <FontAwesomeIcon icon={faCartShopping} size="sm" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence mode="sync">
      <motion.div 
        key="related-products-container"
        className="w-full max-w-7xl mx-auto px-2 md:px-8 my-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {relatedProducts.length > 0 && (
          <>
            <motion.h2
              className="text-center text-4xl font-semibold mb-6 text-gray-800 uppercase"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              SẢN PHẨM LIÊN QUAN
            </motion.h2>
            <Carousel
              value={relatedProducts}
              numVisible={isMobile ? 1 : 4}
              numScroll={1}
              responsiveOptions={[
                {
                  breakpoint: '1024px',
                  numVisible: 3,
                  numScroll: 1
                },
                {
                  breakpoint: '768px',
                  numVisible: 2,
                  numScroll: 1
                }
              ]}
              itemTemplate={productTemplate}
              circular
              showNavigators={!isMobile}
              showIndicators={isMobile}
              className="related-products-carousel"
              contentClassName="items-stretch"
            />
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