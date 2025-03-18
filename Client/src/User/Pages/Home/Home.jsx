import slide from "../../../assets/slide.png";
import Fruit from "../../Pages/Product/Fruit";
import Kitchen from "../../Pages/Product/Kitchen";
import ProductNew from "./ProductNew";

function Home() {
  return (
    <>
      <div className="w-full ">
        <div className="">
          <img
            src={slide}
            alt="Ảnh Slider"
            className="w-full h-auto "
          />
        </div>
        {/* <div
          className="absolute bottom-0 left-0 w-full bg-white h-40 lg:h-64 z-10 "
          style={{
            clipPath: "ellipse(100% 110% at 0% 100%)",
          }}
        ></div> */}
        <div className="text-center mt-4 px-3 lg:px-[120px] lg:grid lg:grid-cols-1 lg:items-start lg:justify-items-start">
          <button className="bg-yellow-400 text-[#000000] text-sm p-2 rounded font-medium lg:text-[16px]">
            GIÁ TỐT HÔM NAY
          </button>
          <h2 className="text-[26px] font-medium mt-2 text-center lg:text-[40px]">HÀNG MỚI VỀ</h2>
          <p className="text-gray-500 text-[13px] lg:text-[16px]">
            Rau củ, thịt, cá, trứng, trái cây các loại, hàng luôn tươi mới mỗi
            ngày.
          </p>
        </div>
      </div>
      <div className="mt-5 lg:mt-5 lg:px-[120px]">
        <ProductNew />
        <Fruit />
        <Kitchen />
      </div>
    </>
  );
}

export default Home;
