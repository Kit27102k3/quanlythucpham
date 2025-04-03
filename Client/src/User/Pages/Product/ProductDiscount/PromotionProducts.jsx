import productsApi from "../../../../api/productsApi";
import { memo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import formatCurrency from "../../../Until/FotmatPrice";
import useCartAndNavigation from "../../../Until/useCartAndNavigation";

const PromotionProducts = memo(() => {
  const [products, setProducts] = useState([]);
  const { handleClick } = useCartAndNavigation();

  useEffect(() => {
    const fetchAllProducts = async () => {
      const res = await productsApi.getAllProducts();
      const filteredProducts = res.filter(
        (product) => product?.productDiscount > 0
      );
      setProducts(filteredProducts);
    };
    fetchAllProducts();
  }, []);

  return (
    <div>
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {products.map((product, index) => (
            <div
              key={index}
              onClick={() => handleClick(product)}
              className="relative items-center justify-center group cursor-pointer bg-white rounded-md overflow-hidden"
            >
              <div className="relative overflow-hidden">
                {product.productImages?.length > 0 && (
                  <img
                    src={`${product.productImages[0]}`}
                    alt={product.title}
                    className="w-64 h-64 object-cover hover-scale-up mx-auto"
                  />
                )}
                <div className="lg:bg-red-500 w-10 p-1 text-white rounded lg:absolute top-2 left-2 text-center">
                  {product.productDiscount}%
                </div>
                <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <button className="px-4 py-2 bg-[#51aa1b] text-white uppercase text-[12px] cursor-pointer hover:text-[#51aa1b] hover:bg-white hover:border-1">
                    Thêm vào giỏ
                  </button>
                  <button className="px-4 py-2 bg-[#51aa1b] text-white uppercase text-[12px] cursor-pointer hover:text-[#51aa1b] hover:bg-white hover:border-1">
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
    </div>
  );
});

export default PromotionProducts;
