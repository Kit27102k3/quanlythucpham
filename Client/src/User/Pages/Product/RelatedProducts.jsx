import { useState, useEffect } from "react";
import { Carousel } from "primereact/carousel";
import PropTypes from "prop-types";
import productsApi from "../../../api/productsApi";
import useCartAndNavigation from "../../Until/useCartAndNavigation";
import "../../../index.css";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping } from "@fortawesome/free-solid-svg-icons";
import formatCurrency from "../../Until/FotmatPrice";

const carouselStyle = `
  .related-products-container {
    width: 100%;
    overflow: hidden;
    padding: 0 8px;
    margin: 30px 0;
  }
  
  .related-products-carousel {
    width: 100%;
    margin: 0 auto;
  }
  
  .related-products-carousel .p-carousel-items-container {
    display: flex;
    align-items: stretch;
  }
  
  .related-products-carousel .p-carousel-item {
    padding: 0 4px;
    display: flex;
    height: auto;
  }
  
  .related-products-carousel .p-carousel-indicators {
    padding: 12px 0;
  }
  
  .related-product-card {
    width: 100%;
    max-width: 240px;
    margin: 0 auto;
  }
  
  .related-products-carousel .p-carousel-next,
  .related-products-carousel .p-carousel-prev {
    background-color: rgba(81, 170, 27, 0.8);
    border-radius: 50%;
    color: white;
    width: 2rem;
    height: 2rem;
    margin: 0 -5px;
    z-index: 10;
  }

  .related-products-carousel .p-carousel-next:hover,
  .related-products-carousel .p-carousel-prev:hover {
    background-color: rgba(81, 170, 27, 1);
  }
  
  .cart-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #51aa1b;
    color: white;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .cart-btn:hover {
    background-color: #458f17;
    transform: translateY(-2px);
  }
  
  @media (max-width: 767px) {
    .related-products-container {
      padding: 0 4px;
      margin: 20px 0;
    }
    
    .related-products-carousel .p-carousel-item {
      padding: 0 6px;
    }
    
    .related-product-card {
      max-width: 100%;
    }

    .related-products-carousel .p-carousel-next,
    .related-products-carousel .p-carousel-prev {
      width: 1.8rem;
      height: 1.8rem;
      margin: 0 -8px;
    }
    
    .cart-btn {
      width: 32px;
      height: 32px;
    }
  }
`;

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
      <motion.div
        variants={itemVariants}
        className="related-product-card"
      >
        <div 
          onClick={() => handleClick(product)}
          className="flex flex-col h-full bg-white rounded-md overflow-hidden shadow-sm hover:shadow transition-all"
        >
          <div className="aspect-square overflow-hidden relative">
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
                className="cart-btn"
                aria-label="Thêm vào giỏ hàng"
              >
                <FontAwesomeIcon icon={faCartShopping} size="sm" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence mode="sync">
      <style>{carouselStyle}</style>
      <motion.div 
        key="related-products-container"
        className="related-products-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {relatedProducts.length > 0 && (
          <>
            <motion.h2
              className="text-center text-xl font-semibold mb-6 text-gray-800 uppercase"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              Sản phẩm liên quan
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