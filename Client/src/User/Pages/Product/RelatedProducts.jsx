import { useState, useEffect } from "react";
import { Carousel } from "primereact/carousel";
import PropTypes from 'prop-types';
import productsApi from "../../../api/productsApi";
import formatCurrency from "../../Until/FotmatPrice";
import useCartAndNavigation from "../../Until/useCartAndNavigation";
import "../../../index.css";
import { motion, AnimatePresence } from "framer-motion";

function RelatedProducts({ currentProduct }) {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const { handleAddToCart, handleClick } = useCartAndNavigation();
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Force re-render animation khi component mount
    setKey(prevKey => prevKey + 1);
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

  // Hàm chuyển đổi chuỗi thành số
  const parsePrice = (price) => {
    if (typeof price === 'string') {
      return parseFloat(price.replace(/[^\d.-]/g, ''));
    }
    return price;
  };

  const productTemplate = (product) => {
    const productPrice = parsePrice(product.productPrice);
    const productDiscount = product?.productDiscount || 0;

    return (
      <div className="product-carousel-item-wrapper flex justify-center items-center w-full">
        <div
          key={product._id}
          className="product-item flex flex-col items-center w-full max-w-[280px] group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div className="product-image-container relative w-full h-0 pb-[100%] overflow-hidden bg-white">
            {product.productImages?.length > 0 && (
              <img
                src={`${product.productImages[0]}`}
                alt={product.productName}
                className="absolute inset-0 m-auto w-auto h-auto max-w-[90%] max-h-[90%] object-contain hover-scale-up transition-transform duration-500"
              />
            )}
            {productDiscount > 0 && (
              <div className="absolute top-2 left-2 bg-red-500 w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md">
                -{productDiscount}%
              </div>
            )}
            
            <div className="absolute inset-x-0 bottom-0 flex justify-center items-center gap-2 opacity-0 translate-y-full group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-in-out bg-gradient-to-t from-black/50 to-transparent pt-10 pb-3">
              <button
                onClick={() => handleAddToCart(product._id)}
                className="px-3 py-2 bg-[#51aa1b] text-white text-xs uppercase rounded-md hover:bg-white hover:text-[#51aa1b] border border-transparent hover:border-[#51aa1b] transition-colors shadow-md"
              >
                Thêm vào giỏ
              </button>
              <button
                onClick={() => handleClick(product)}
                className="px-3 py-2 bg-[#51aa1b] text-white text-xs uppercase rounded-md hover:bg-white hover:text-[#51aa1b] border border-transparent hover:border-[#51aa1b] transition-colors shadow-md"
              >
                Xem chi tiết
              </button>
            </div>
          </div>
          
          <div className="product-info text-center w-full p-3">
            <h3 className="product-name text-sm font-medium mb-2 line-clamp-1 hover:text-[#51aa1b] transition-colors">
              {product.productName}
            </h3>
            <div className="product-price flex justify-center items-center gap-2">
              <span className="text-[#51aa1b] font-semibold text-base">
                {formatCurrency(productPrice * (1 - productDiscount/100))}đ
              </span>
              {productDiscount > 0 && (
                <span className="text-gray-400 text-sm line-through">
                  {formatCurrency(productPrice)}đ
                </span>
              )}
            </div>
          </div>
        </div>
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
    productImages: PropTypes.array
  })
};

export default RelatedProducts;
