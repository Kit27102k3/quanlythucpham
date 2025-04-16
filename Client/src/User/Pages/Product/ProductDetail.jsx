import "../../../App.css";
import "../../../index.css";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from 'prop-types';

function ProductDetail({ isVisible = false }) {
  try {
    const navigate = useNavigate();
    const [isInitialRender, setIsInitialRender] = useState(true);
    const dropdownRef = useRef(null);
    
    useEffect(() => {
      if (isVisible) {
        setIsInitialRender(false);
      }
    }, [isVisible]);

    const handleCategoryClick = (category) => {
      navigate(`/products/category/${encodeURIComponent(category)}`);
    };

    // Animation variants
    const dropdownVariants = {
      hidden: { 
        opacity: 0, 
        y: -10,
        transition: {
          duration: 0.2,
          ease: "easeInOut"
        }
      },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: {
          duration: 0.3,
          ease: "easeOut",
          staggerChildren: 0.05
        }
      }
    };

    const columnVariants = {
      hidden: { 
        opacity: 0, 
        y: 10,
      },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: {
          duration: 0.3,
          staggerChildren: 0.03
        }
      }
    };

    const itemVariants = {
      hidden: { opacity: 0, x: -5 },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: { duration: 0.2 }
      }
    };

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            className="product-dropdown-container absolute left-0 right-0 px-[120px] top-full z-50"
            style={{ display: "block", visibility: "visible", opacity: 1, transform: "none" }}
            initial={!isInitialRender ? "hidden" : false}
            animate="visible"
            exit="hidden"
            variants={dropdownVariants}
            ref={dropdownRef}
          >
            <motion.div 
              className="product-dropdown-content text-black bg-white shadow-lg rounded-b-lg"
              variants={dropdownVariants}
            >
              <motion.div 
                className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4 px-6"
                variants={dropdownVariants}
              >
                <motion.div 
                  className="p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  variants={columnVariants}
                >
                  <motion.h2 
                    className="text-[16px] font-semibold uppercase text-[#51bb1a] mb-3"
                    variants={itemVariants}
                  >
                    Đồ uống các loại
                  </motion.h2>
                  <motion.ul className="space-y-2" variants={columnVariants}>
                    {[
                      "Nước ngọt, giải khát",
                      "Bia, nước uống có cồn",
                      "Nước suối",
                      "Nước trái cây ép",
                      "Nước yến",
                      "Cà phê, trà",
                      "Nước sữa trái cây",
                    ].map((item, index) => (
                      <motion.li key={index} variants={itemVariants}>
                        <a
                          onClick={() => handleCategoryClick(item)}
                          className="text-[14px] text-gray-700 hover:text-[#51bb1a] hover:underline transition-colors cursor-pointer"
                        >
                          {item}
                        </a>
                      </motion.li>
                    ))}
                  </motion.ul>
                </motion.div>

                <motion.div 
                  className="p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  variants={columnVariants}
                >
                  <motion.h2 
                    className="text-[16px] font-semibold uppercase text-[#51bb1a] mb-3"
                    variants={itemVariants}
                  >
                    Sữa các loại, tã bỉm
                  </motion.h2>
                  <motion.ul className="space-y-2" variants={columnVariants}>
                    {[
                      "Sữa tươi",
                      "Sữa đậu nành, sữa từ hạt",
                      "Sữa đặc",
                      "Sữa chua, phô mai",
                      "Sữa bột, bột ăn dặm",
                    ].map((item, index) => (
                      <motion.li key={index} variants={itemVariants}>
                        <a
                          onClick={() => handleCategoryClick(item)}
                          className="text-[14px] text-gray-700 hover:text-[#51bb1a] hover:underline transition-colors cursor-pointer"
                        >
                          {item}
                        </a>
                      </motion.li>
                    ))}
                  </motion.ul>
                </motion.div>

                <motion.div 
                  className="p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  variants={columnVariants}
                >
                  <motion.h2 
                    className="text-[16px] font-semibold uppercase text-[#51bb1a] mb-3"
                    variants={itemVariants}
                  >
                    Mì, cháo, phở ăn liền
                  </motion.h2>
                  <motion.ul className="space-y-2" variants={columnVariants}>
                    {[
                      "Mì ăn liền",
                      "Cháo ăn liền",
                      "Phở ăn liền",
                      "Thực phẩm ăn liền khác",
                    ].map((item, index) => (
                      <motion.li key={index} variants={itemVariants}>
                        <a
                          onClick={() => handleCategoryClick(item)}
                          className="text-[14px] text-gray-700 hover:text-[#51bb1a] hover:underline transition-colors cursor-pointer"
                        >
                          {item}
                        </a>
                      </motion.li>
                    ))}
                  </motion.ul>
                </motion.div>

                <motion.div 
                  className="p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  variants={columnVariants}
                >
                  <motion.h2 
                    className="text-[16px] font-semibold uppercase text-[#51bb1a] mb-3"
                    variants={itemVariants}
                  >
                    Dầu ăn, nước chấm, gia vị
                  </motion.h2>
                  <motion.ul className="space-y-2" variants={columnVariants}>
                    {[
                      "Dầu ăn",
                      "Nước tương",
                      "Nước mắm",
                      "Tương ớt, tương cà, tương đen",
                      "Đường, hạt nêm, bột ngọt, muối",
                    ].map((item, index) => (
                      <motion.li key={index} variants={itemVariants}>
                        <a
                          onClick={() => handleCategoryClick(item)}
                          className="text-[14px] text-gray-700 hover:text-[#51bb1a] hover:underline transition-colors cursor-pointer"
                        >
                          {item}
                        </a>
                      </motion.li>
                    ))}
                  </motion.ul>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  } catch (error) {
    console.error("Error in ProductDetail component:", error);
    return null;
  }
}

ProductDetail.propTypes = {
  isVisible: PropTypes.bool
};

export default ProductDetail;
