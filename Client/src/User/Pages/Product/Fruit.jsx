import { useEffect, useState, memo } from "react";
import "../../../index.css";
import productsApi from "../../../api/productsApi";
import formatCurrency from "../../Until/FotmatPrice";
import useCartAndNavigation from "../../Until/useCartAndNavigation";
import SEO from "../../../components/SEO";

// Memo hóa ProductItem để tránh render lại không cần thiết
const ProductItem = memo(({ product, handleAddToCart, handleClick, getPrice }) => (
  <div className="relative flex flex-col items-center group cursor-pointer h-full">
    <div className="relative overflow-hidden">
      <img
        src={`${product.productImages[0]}`}
        alt={product.productName}
        loading="lazy"
        width="350"
        height="350"
        className="w-[150px] h-[150px] lg:w-[350px] lg:h-[350px] object-cover hover-scale-up"
      />
      {product.productDiscount > 0 && (
        <div className="bg-red-500 w-10 p-1 text-white rounded absolute top-2 left-2 text-center">
          {product.productDiscount}%
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <button 
          onClick={() => handleAddToCart(product._id)}
          className="px-4 py-2 bg-[#51aa1b] text-white uppercase text-[12px] cursor-pointer hover:text-[#51aa1b] hover:bg-white border border-transparent hover:border-[#51aa1b] transition-colors"
          aria-label={`Thêm ${product.productName} vào giỏ hàng`}
        >
          Thêm vào giỏ
        </button>
        <button 
          onClick={() => handleClick(product)}
          className="px-4 py-2 bg-[#51aa1b] text-white uppercase text-[12px] cursor-pointer hover:text-[#51aa1b] hover:bg-white border border-transparent hover:border-[#51aa1b] transition-colors"
          aria-label={`Xem chi tiết sản phẩm ${product.productName}`}
        >
          Xem chi tiết
        </button>
      </div>
    </div>
    <div className="flex flex-col items-center mt-auto">
      <p className="font-medium text-[12px] hover:text-[#51aa1b] lg:text-[16px]">
        {product.productName}
      </p>
      {product.productDiscount > 0 ? (
        <div className="flex items-center gap-2">
          <p className="text-[#51aa1b] text-[12px] lg:text-[16px]">
            {formatCurrency(getPrice(product))}đ
          </p>
          <p className="text-gray-400 text-[12px] lg:text-[16px] line-through">
            {formatCurrency(product.productPrice)}đ
          </p>
        </div>
      ) : (
        <p className="text-[#51aa1b] text-[12px] lg:text-[16px]">
          {formatCurrency(getPrice(product))}đ
        </p>
      )}
    </div>
  </div>
));

// Đặt tên hiển thị cho component để dễ debug
ProductItem.displayName = 'ProductItem';

function Fruit() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { handleAddToCart, handleClick, getPrice } = useCartAndNavigation();

  useEffect(() => {
    const fetchProductCategory = async () => {
      try {
        setIsLoading(true);
        const res = await productsApi.getProductByCategory("Trái cây");
        setProducts(res);
      } catch (error) {
        console.error("Lỗi khi lấy sản phẩm theo danh mục:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProductCategory();
  }, []);

  return (
    <div className="grid grid-cols-1 px-4">
      <SEO 
        title="Trái cây nhập khẩu" 
        description="Trái cây tươi ngon nhập khẩu từ các nước, đảm bảo chất lượng, giá cả hợp lý."
      />
      
      <h2 className="text-[14px] font-medium text-[#292929] uppercase lg:text-[35px]">
        Trái cây nhập khẩu
      </h2>
      
      <div className="mt-4 gap-10 lg:grid lg:grid-cols-[70%_30%]">
        <div className="w-full">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 items-stretch justify-around gap-4">
              {products.map((product) => (
                <ProductItem
                  key={product._id}
                  product={product}
                  handleAddToCart={handleAddToCart}
                  handleClick={handleClick}
                  getPrice={getPrice}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="w-full grid grid-cols-2 lg:grid-cols-1 mt-4 items-center justify-between gap-4">
          <img
            src="https://bizweb.dktcdn.net/100/360/151/themes/727143/assets/evo_col_product_banner_1.jpg?1721896755861"
            alt="Khuyến mãi đặc biệt cho trái cây"
            loading="lazy"
            width="273"
            height="358"
            className="w-[332px] h-[300px] lg:w-[273px] lg:h-[358px]"
          />
          <img
            src="https://bizweb.dktcdn.net/100/360/151/themes/727143/assets/evo_col_product_banner_1s.jpg?1721896755861"
            alt="Ưu đãi trái cây nhập khẩu" 
            loading="lazy"
            width="273"
            height="358"
            className="w-[332px] h-[300px] lg:w-[273px] lg:h-[358px]"
          />
        </div>
      </div>
      
      <img
        src="https://bizweb.dktcdn.net/100/360/151/themes/727143/assets/evo_banner_full_1.jpg?1721896755861"
        alt="Banner khuyến mãi trái cây"
        loading="lazy"
        width="1200" 
        height="200"
        className="w-full mt-5"
      />
    </div>
  );
}

export default memo(Fruit);
