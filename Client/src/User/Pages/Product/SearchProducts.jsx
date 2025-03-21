import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import productsApi from "../../../api/productsApi";
import formatCurrency from "../../Until/FotmatPrice";

function SearchProducts() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [sliceLength, setSliceLength] = useState(40);
  const query = searchParams.get("query");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      if (query) {
        try {
          const results = await productsApi.searchProducts(query);
          setProducts(results.products);
        } catch (error) {
          console.error("Error fetching products:", error);
        }
      }
    };
    fetchProducts();
  }, [query]);

  const handleClick = (id) => {
    navigate(`/chi-tiet-san-pham/${id}`);
    window.location.reload();
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSliceLength(20);
      } else {
        setSliceLength(40);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 p-2 lg:px-[120px]">
        <a href="/" className="hover:text-[#51bb1a] text-sm lg:text-[16px]">
          Trang chủ
        </a>{" "}
        {" >"}
        <p className="text-[#51bb1a] text-sm lg:text-[16px]">
          Kết quả tìm kiếm
        </p>
      </div>
      <div className="border border-gray-100"></div>
      <div className=" gap-4 mt-4 p-2 lg:px-[120px]">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 ">
          {products.length > 0 ? (
            products.map((product) => (
              <div
                key={product._id}
                onClick={() => handleClick(product._id)}
                className="relative cursor-pointer group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={`http://localhost:8080/uploads/${product?.productImages[0]}`}
                    alt={product.productName}
                    className="w-[160px] h-[160px] lg:w-64 lg:h-64 object-cover hover-scale-up mx-auto"
                  />
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
                    {product.productName.slice(0, sliceLength)}...
                  </p>
                  <p className="text-[#51aa1b]">
                    {formatCurrency(product.productPrice)}đ
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center col-span-4 mt-4">
              Không tìm thấy sản phẩm nào
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchProducts;
