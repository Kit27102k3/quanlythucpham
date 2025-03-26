import { useEffect, useState } from "react";
import productsApi from "../../../api/productsApi";
import ProductList from "../../Until/ProductsList";
import useCartAndNavigation from "../../Until/useCartAndNavigation";

function ProductNew() {
  const [products, setProducts] = useState([]);
  const { handleClick, handleAddToCart } = useCartAndNavigation();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productsApi.getAllProducts();
        const sortedData = data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setProducts(data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error);
      }
    };
    fetchProducts();
  }, [setProducts]);

  return (
    <>
      <ProductList
        products={products}
        handleAddToCart={handleAddToCart}
        handleClick={handleClick}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="p-4 rounded-lg relative">
          <img
            alt="fresh-grapes"
            src="https://bizweb.dktcdn.net/100/360/151/themes/727143/assets/evo_banner_index_1.jpg?1721896755861"
            className="my-2 rounded-md shadow-lg w-full h-[327px] object-cover"
          />
          <div className="absolute top-[20%] left-[40px]">
            <h2 className="text-[#51aa1b] text-xl font-semibold">
              THỰC PHẨM SẠCH
            </h2>
            <p className="text-2xl font-extralight">
              Đồ ăn tươi ngon <br /> Mỗi ngày
            </p>
            <button className="bg-[#d73e6e] text-white w-[150px] hover:bg-secondary/80 mt-2 p-2 rounded-4xl cursor-pointer">
              XEM THÊM
            </button>
          </div>
        </div>

        <div className="p-4 rounded-lg relative">
          <img
            alt="fresh-lemon"
            src="https://bizweb.dktcdn.net/100/360/151/themes/727143/assets/evo_banner_index_2.jpg?1721896755861"
            className="my-2 rounded-md shadow-lg w-full h-[327px] object-cover"
          />
          <div className="absolute left-[40px] top-[20%]">
            <h2 className="text-[#51aa1b] text-xl font-semibold">
              THỰC PHẨM TƯƠI
            </h2>
            <p className="text-2xl font-extralight">
              Giao nhanh <br /> Chớp mắt
            </p>
            <button className="bg-[#fcc108] text-white w-[150px] hover:bg-secondary/80 mt-2 p-2 rounded-4xl cursor-pointer">
              XEM THÊM
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductNew;
