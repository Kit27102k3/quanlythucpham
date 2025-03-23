import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Carousel } from "primereact/carousel";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import productsApi from "../../../api/productsApi";
import { toast } from "react-toastify";
import cartApi from "../../../api/cartApi";
import formatCurrency from "../../Until/FotmatPrice";
import "../../../index.css";

function RelatedProducts({ currentProduct }) {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  const fetchRelatedProducts = async (category, currentProductId) => {
    try {
      const data = await productsApi.getProductByCategory(category);
      const filteredProducts = data.filter(
        (product) => product._id !== currentProductId
      );
      setRelatedProducts(filteredProducts);
    } catch (error) {
      console.error("Lỗi khi lấy sản phẩm liên quan:", error);
    }
  };

  useEffect(() => {
    if (currentProduct) {
      fetchRelatedProducts(currentProduct.productCategory, currentProduct._id);
    }
  }, [currentProduct]);

  const handleAddToCart = async (productId) => {
    if (!userId) {
      toast.warning("Bạn cần phải đăng nhập trước!");
      navigate("/dang-nhap");
      return;
    }
    try {
      await cartApi.addToCart(userId, productId);
      toast.success("Sản phẩm đã được thêm vào giỏ hàng");
    } catch (error) {
      console.log("Lỗi khi thêm sản phẩm vào giỏ hàng!", error);
    }
  };

  const handleClick = (id) => {
    navigate(`/chi-tiet-san-pham/${id}`);
  };

  const productTemplate = (product) => {
    return (
      <div className=" m-2 text-center py-5 px-3 ">
        <div
          key={product._id}
          className="relative flex flex-col items-center group cursor-pointer"
        >
          <div className="relative overflow-hidden">
            {product.productImages?.length > 0 && (
              <img
                src={`http://localhost:8080/uploads/${product.productImages[0]}`}
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
                onClick={() => handleClick(product._id)}
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
      </div>
    );
  };

  return (
    <div className="px-[120px]">
      {relatedProducts.length > 0 && (
        <>
          <h1 className="uppercase text-[26px] text-[#1c1c1c] text-center">
            Sản phẩm liên quan
          </h1>

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
            />
          </div>
        </>
      )}
    </div>
  );
}

export default RelatedProducts;
