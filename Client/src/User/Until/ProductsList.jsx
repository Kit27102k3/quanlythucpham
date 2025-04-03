import React from "react";
import formatCurrency from "../Until/FotmatPrice";

function ProductList({ products, handleAddToCart, handleClick }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-2">
      {products?.map((product) => (
        <div
          key={product._id}
          className="relative flex flex-col items-center group cursor-pointer"
        >
          <div className="relative overflow-hidden">
            {product.productImages?.length > 0 && (
              <img
                src={`${product.productImages[0]}`}
                alt={product.productName}
                className="w-64 h-64 object-cover hover-scale-up mx-auto"
              />
            )}
            <div
              className={`${
                product?.productDiscount > 0
                  ? "lg:bg-red-500 w-10 p-1 text-white rounded lg:absolute top-2 left-2 text-center"
                  : "w-10 p-1 text-white rounded lg:absolute top-2 left-2 text-center"
              }`}
            >
              {product?.productDiscount}%
            </div>
            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <button
                onClick={() => handleAddToCart(product._id)}
                className="px-4 py-2 bg-[#51aa1b] text-white uppercase text-[12px] cursor-pointer hover:text-[#51aa1b] hover:bg-white hover:border-1"
              >
                Thêm vào giỏ
              </button>
              <button
                onClick={() => handleClick(product)}
                className="px-4 py-2 bg-[#51aa1b] text-white uppercase text-[12px] cursor-pointer hover:text-[#51aa1b] hover:bg-white hover:border-1"
              >
                Xem chi tiết
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center mt-2">
            <p className="font-medium hover:text-[#51aa1b] text-sm">
              {product.productName.slice(0, 30)}...
            </p>
            <p className="text-[#51aa1b]">
              {formatCurrency(product.productPrice)}đ
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProductList;
