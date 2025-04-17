import { useState, useEffect } from "react";
import { Carousel } from "primereact/carousel";
import PropTypes from "prop-types";
import productsApi from "../../../api/productsApi";
import useCartAndNavigation from "../../Until/useCartAndNavigation";
import "../../../index.css";
import { motion, AnimatePresence } from "framer-motion";
import ProductList from "../../Until/ProductsList";

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

  const productTemplate = (products) => {
    return (
      <div className="">
        <ProductList
          products={[products]}
          containerVariants={containerVariants}
          itemVariants={itemVariants}
          handleClick={handleClick}
          handleAddToCart={handleAddToCart}
          getPrice={getPrice}
        />
      </div>
    );
  };
  

  return (
    <AnimatePresence mode="wait">
      <div key={key} className="px-2 sm:px-8 md:px-16 lg:px-[120px] my-8">
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
      </div>
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
