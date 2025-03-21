import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import productsApi from "../../../api/productsApi";
import formatCurrency from "../../Until/FotmatPrice";

function ProductNew() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productsApi.getAllProducts();
        setProducts(data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error);
      }
    };
    fetchProducts();
  }, [setProducts]);

  const handleClick = (id) => {
    navigate(`/chi-tiet-san-pham/${id}`);
    window.location.reload();
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {products?.map((product) => (
          <div
            key={product._id}
            className="relative flex flex-col items-center group cursor-pointer"
            onClick={() => handleClick(product._id)}
          >
            <div className="relative overflow-hidden">
              {product.productImages?.length > 0 && (
                <img
                  src={`http://localhost:8080/uploads/${product.productImages[0]}`}
                  alt={product.title}
                  className="w-64 h-64 object-cover hover-scale-up"
                />
              )}
              <div className="lg:bg-red-500 w-10 p-1 text-white rounded lg:absolute top-2 left-2">
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
