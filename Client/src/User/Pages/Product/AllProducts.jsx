/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import formatCurrency from "../../Until/FotmatPrice";
import productsApi from "../../../api/productsApi";
import useCartAndNavigation from "../../Until/useCartAndNavigation";
import "../../../index.css";

function AllProducts({
  sortOption,
  priceFilters,
  typeFilters,
  showPromotional = false,
}) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const { handleAddToCart, handleClick } = useCartAndNavigation();
  const { category } = useParams();
  const location = useLocation();

  useEffect(() => {
    const fetchAllProducts = async () => {
      const res = await productsApi.getAllProducts();
      const filteredRes = showPromotional
        ? res.filter((product) => product?.productDiscount > 0)
        : res;
      setProducts(filteredRes);
    };
    fetchAllProducts();
  }, [showPromotional]);

  useEffect(() => {
    let filtered = [...products];

    // Lọc theo danh mục từ URL nếu có
    if (category) {
      const decodedCategory = decodeURIComponent(category);
      filtered = filtered.filter((product) => {
        // Tìm kiếm sản phẩm theo tên danh mục hoặc mô tả
        return (
          product.productCategory?.includes(decodedCategory) ||
          product.productName?.includes(decodedCategory) ||
          product.productDetails?.includes(decodedCategory) ||
          product.productDescription?.some(desc => 
            desc.toLowerCase().includes(decodedCategory.toLowerCase())
          )
        );
      });
    }

    // Lọc theo giá
    if (priceFilters.length > 0) {
      filtered = filtered.filter((product) => {
        return priceFilters.some(
          (range) =>
            product.productPrice >= range.min &&
            product.productPrice <= range.max
        );
      });
    }

    // Lọc theo loại sản phẩm
    if (typeFilters.length > 0) {
      filtered = filtered.filter((product) => {
        return typeFilters.some(
          (type) => product.productCategory === type.name
        );
      });
    }

    switch (sortOption) {
      case "a-z":
        filtered.sort((a, b) => a.productName.localeCompare(b.productName));
        break;
      case "z-a":
        filtered.sort((a, b) => b.productName.localeCompare(a.productName));
        break;
      case "priceUp":
        filtered.sort((a, b) => a.productPrice - b.productPrice);
        break;
      case "priceDown":
        filtered.sort((a, b) => b.productPrice - a.productPrice);
        break;
      case "productNew":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        // Mặc định sắp xếp theo sản phẩm mới nhất
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    setFilteredProducts(filtered);
  }, [products, sortOption, priceFilters, typeFilters, category, location]);

  return (
    <div className="px-4 py-6">
      {category && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#51bb1a] mb-2">
            Sản phẩm: {decodeURIComponent(category)}
          </h2>
          <p className="text-gray-600 text-sm">
            Hiển thị {filteredProducts.length} sản phẩm
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product, index) => (
            <div
              key={index}
              className="relative items-center justify-center group cursor-pointer bg-white rounded-md overflow-hidden"
            >
              <div className="relative overflow-hidden ">
                <img
                  src={`${product.productImages[0]}`}
                  alt=""
                  className="w-full mx-auto h-[197px] object-cover hover-scale-up lg:w-[272px] lg:h-[272px]"
                />
                {showPromotional && product.productDiscount > 0 && (
                  <div className="lg:bg-red-500 w-10 p-1 text-white rounded lg:absolute top-2 left-2 text-center">
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
                      {formatCurrency(product.productPromoPrice)}đ
                    </p>
                    <p className="text-gray-400 text-[10px] mt-1 lg:text-[14px] line-through">
                      {formatCurrency(product.productPrice)}đ
                    </p>
                  </div>
                ) : (
                  <p className="text-[#51aa1b] text-[10px] mt-1 lg:text-[14px]">
                    {formatCurrency(product.productPrice)}đ
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">Không tìm thấy sản phẩm phù hợp</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AllProducts;
