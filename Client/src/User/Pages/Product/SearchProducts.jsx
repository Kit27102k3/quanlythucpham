import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import productsApi from "../../../api/productsApi";
import useCartAndNavigation from "../../Until/useCartAndNavigation";
import ProductList from "../../Until/ProductsList";

function SearchProducts() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const query = searchParams.get("query");
  const { handleClick, handleAddToCart } = useCartAndNavigation();

  useEffect(() => {
    const fetchProducts = async () => {
      if (query) {
        setIsChangingPage(true);
        try {
          const results = await productsApi.searchProducts(query);
          
          // Filter out products that are out of stock
          const inStockProducts = results.products.filter(product => 
            product.productStatus !== "Hết hàng" && 
            (product.productStock === undefined || 
             product.productStock === null || 
             product.productStock > 0)
          );
          
          setProducts(inStockProducts);
        } catch (error) {
          console.error("Error fetching products:", error);
        } finally {
          setIsChangingPage(false);
        }
      }
    };
    fetchProducts();
  }, [query]);

  // Tính giá hiển thị (giá giảm giá nếu có)
  const getPrice = (product) => {
    if (product.productDiscount > 0 && product.productPromoPrice) {
      return product.productPromoPrice;
    }
    return product.productPrice;
  };

  // Cấu hình animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 p-2 lg:px-[120px]">
        <a href="/" className="hover:text-[#51bb1a] text-sm lg:text-[16px]">
          Trang chủ
        </a>{" "}
        {" >"}
        <p className="text-[#51bb1a] text-sm lg:text-[16px]">
          Kết quả tìm kiếm cho: &ldquo;{query}&rdquo;
        </p>
      </div>
      <div className="border border-gray-100"></div>
      <div className="gap-4 mt-4 p-2 lg:px-[120px]">
        <ProductList
          products={products}
          isChangingPage={isChangingPage}
          containerVariants={containerVariants}
          itemVariants={itemVariants}
          handleClick={handleClick}
          handleAddToCart={handleAddToCart}
          getPrice={getPrice}
        />
      </div>
      {products.length === 0 && !isChangingPage && (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm phù hợp với từ khóa &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

export default SearchProducts;
