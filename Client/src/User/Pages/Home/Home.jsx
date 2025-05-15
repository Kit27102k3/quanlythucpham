import { lazy, Suspense } from "react";
import slide from "../../../assets/slide.png";
import SEO from "../../../components/SEO";

// Lazy load components
const Fruit = lazy(() => import("../../Pages/Product/Fruit"));
const Kitchen = lazy(() => import("../../Pages/Product/Kitchen"));
const Drinks = lazy(() => import("../../Pages/Product/Drinks"));
const ProductNew = lazy(() => import("./ProductNew"));
const BestSelling = lazy(() => import("./BestSelling"));
const Vouchers = lazy(() => import("./Vouchers"));

// Loading component
const Loading = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
  </div>
);

function Home() {
  return (
    <>
      <SEO 
        title="Trang chủ" 
        description="DNC FOOD - Nông Trại Hữu Cơ Cung Cấp Thực Phẩm Sạch. Chúng tôi cung cấp rau củ, thịt, cá, trứng, trái cây các loại, hàng luôn tươi mới mỗi ngày."
        image="/src/assets/slide.png"
      />
      
      <div className="w-full">
        <div className="">
          <img
            src={slide}
            alt="DNC FOOD - Nông Trại Hữu Cơ Cung Cấp Thực Phẩm Sạch"
            className="w-full h-auto"
            loading="eager"
            width="1600"
            height="600"
          />
        </div>

        <div className="text-center mt-4 px-3 lg:px-[120px] lg:grid lg:grid-cols-1 lg:items-start lg:justify-items-start">
          <button className="bg-yellow-400 text-[#000000] text-sm p-2 rounded font-medium lg:text-[16px]">
            GIÁ TỐT HÔM NAY
          </button>
          <h1 className="text-[26px] font-medium mt-2 text-center lg:text-[40px]">HÀNG MỚI VỀ</h1>
          <p className="text-gray-500 text-[13px] lg:text-[16px]">
            Rau củ, thịt, cá, trứng, trái cây các loại, hàng luôn tươi mới mỗi
            ngày.
          </p>
        </div>
      </div>
      
      <div className="mt-5 lg:mt-5 lg:px-[120px]">
        <Suspense fallback={<Loading />}>
          <ProductNew />
        </Suspense>
        
        <Suspense fallback={<Loading />}>
          <BestSelling />
        </Suspense>
        
        <Suspense fallback={<Loading />}>
          <Vouchers />
        </Suspense>
        
        <Suspense fallback={<Loading />}>
          <Fruit />
        </Suspense>
        
        <Suspense fallback={<Loading />}>
          <Drinks />
        </Suspense>

        <Suspense fallback={<Loading />}>
          <Kitchen />
        </Suspense>

      </div>
    </>
  );
}

export default Home;
