import { useEffect, useState } from "react";
import "../../../index.css";
import productsApi from "../../../api/productsApi";
import formatCurrency from "../../Until/FotmatPrice";
import useCartAndNavigation from "../../Until/useCartAndNavigation";

function Fruit() {
  const [products, setProducts] = useState([]);
  const { handleAddToCart, handleClick } = useCartAndNavigation();

  useEffect(() => {
    const fetchProductCategory = async () => {
      try {
        const res = await productsApi.getProductByCategory("Trái cây");
        setProducts(res);
      } catch (error) {
        console.log(error);
      }
    };
    fetchProductCategory();
  }, []);

  return (
    <div className="grid grid-cols-1 px-4">
      <h1 className="text-[14px] font-medium text-[#292929] uppercase lg:text-[35px]">
        Trái cây nhập khẩu
      </h1>
      <div className=" mt-4 gap-10 lg:grid lg:grid-cols-[70%_30%]">
        <div className="w-full">
          <div className="grid grid-cols-2 lg:grid-cols-3 items-stretch justify-around">
            {products.map((product, index) => (
              <div
                key={index}
                className="relative flex flex-col items-center group cursor-pointer h-full"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={`${product.productImages[0]}`}
                    alt=""
                    className="w-[150px] h-[150px] lg:w-[350px] lg:h-[350px] object-cover hover-scale-up"
                  />
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
                <div className="flex flex-col items-center mt-auto">
                  <p className="font-medium text-[12px] hover:text-[#51aa1b] lg:text-[16px]">
                    {product.productName}
                  </p>
                  <p className="text-[#51aa1b] text-[12px] lg:text-[16px]">
                    {formatCurrency(product.productPrice)}đ
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full grid grid-cols-2 lg:grid-cols-1 mt-4 items-center justify-between gap-4 ">
          <img
            src="https://bizweb.dktcdn.net/100/360/151/themes/727143/assets/evo_col_product_banner_1.jpg?1721896755861"
            alt=""
            className="w-[332px] h-[300px] lg:w-[273px] lg:h-[358px]"
          />
          <img
            src="https://bizweb.dktcdn.net/100/360/151/themes/727143/assets/evo_col_product_banner_1s.jpg?1721896755861"
            alt=""
            className="w-[332px] h-[300px] lg:w-[273px] lg:h-[358px]"
          />
        </div>
      </div>
      <img
        src="https://bizweb.dktcdn.net/100/360/151/themes/727143/assets/evo_banner_full_1.jpg?1721896755861"
        alt=""
        className="w-full mt-5"
      />
    </div>
  );
}

export default Fruit;
