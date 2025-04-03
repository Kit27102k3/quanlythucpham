import { useEffect, useState } from "react";
import formatCurrency from "../../Until/FotmatPrice";
import productsApi from "../../../api/productsApi";
import useCartAndNavigation from "../../Until/useCartAndNavigation";
import "../../../index.css";

function AllProducts({ sortOption, priceFilters, typeFilters }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const { handleAddToCart, handleClick } = useCartAndNavigation();

  useEffect(() => {
    const fetchAllProducts = async () => {
      const res = await productsApi.getAllProducts();
      setProducts(res);
    };
    fetchAllProducts();
  }, []);

  useEffect(() => {
    let filtered = [...products];

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
        break;
    }

    setFilteredProducts(filtered);
  }, [products, sortOption, priceFilters, typeFilters]);

  return (
    <div className="px-4 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filteredProducts.map((product, index) => (
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
              <p className="text-[#51aa1b] text-[10px] mt-1 lg:text-[14px]">
                {formatCurrency(product.productPrice)}đ
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AllProducts;
