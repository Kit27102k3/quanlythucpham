/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import { RadioButton } from "primereact/radiobutton";
import AllProducts from "./AllProducts";
import "../../../index.css";
import FilterByPrice from "../../component/FilterByPrice";

// Ánh xạ từ slug URL sang tên danh mục gốc (bạn có thể thêm các ánh xạ khác tùy theo danh mục của bạn)
const categoryMappings = {
  "nuoc-ngot-giai-khat": "Nước ngọt, giải khát",
  "bia-nuoc-uong-co-con": "Bia, nước uống có cồn",
  "nuoc-suoi": "Nước suối",
  "nuoc-trai-cay-ep": "Nước trái cây ép",
  "nuoc-yen": "Nước yến",
  "ca-phe-tra": "Cà phê, trà",
  "nuoc-sua-trai-cay": "Nước sữa trái cây",
  "sua-tuoi": "Sữa tươi",
  "sua-dau-nanh-sua-tu-hat": "Sữa đậu nành, sữa từ hạt",
  "sua-dac": "Sữa đặc",
  "sua-chua-pho-mai": "Sữa chua, phô mai",
  "sua-bot-bot-an-dam": "Sữa bột, bột ăn dặm",
  "mi-an-lien": "Mì ăn liền",
  "chao-an-lien": "Cháo ăn liền",
  "pho-an-lien": "Phở ăn liền",
  "thuc-pham-an-lien-khac": "Thực phẩm ăn liền khác",
  "dau-an": "Dầu ăn",
  "nuoc-tuong": "Nước tương",
  "nuoc-mam": "Nước mắm",
  "tuong-ot-tuong-ca-tuong-den": "Tương ớt, tương cà, tương đen",
  "duong-hat-nem-bot-ngot-muoi": "Đường, hạt nêm, bột ngọt, muối",
};

function ProductLayout({ showPromotional = false }) {
  const [sortOption, setSortOption] = useState("default");
  const [priceFilters, setPriceFilters] = useState([]);
  const [typeFilters, setTypeFilters] = useState([]);
  const { category: categorySlug } = useParams(); // Lấy tham số category từ URL
  const [originalCategory, setOriginalCategory] = useState(null);
  const categoryRef = useRef(null);
  
  // Lấy tên danh mục gốc từ slug URL
  useEffect(() => {
    if (categorySlug) {
      // Tìm tên danh mục gốc từ ánh xạ
      const mappedCategory = categoryMappings[categorySlug];
      if (mappedCategory) {
        setOriginalCategory(mappedCategory);
      } else {
        // Nếu không tìm thấy ánh xạ, hiển thị slug dưới dạng văn bản đọc được
        setOriginalCategory(
          categorySlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        );
      }
    } else {
      setOriginalCategory(null);
    }
  }, [categorySlug]);

  const scrollToCategory = () => {
    if (categoryRef.current) {
      categoryRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSortChange = (option) => {
    setSortOption(option);
  };

  const handlePriceFilterChange = (filters) => {
    setPriceFilters(filters);
  };

  const handleTypeFilterChange = (filters) => {
    setTypeFilters(filters);
  };

  // Tính toán tiêu đề trang
  const pageTitle = originalCategory 
    ? originalCategory 
    : (showPromotional ? "Sản phẩm khuyến mãi" : "Tất cả sản phẩm");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex px-4 items-center -mt-3 gap-1 text-sm lg:px-[120px] ">
        <a href="/" className="hover:text-[#51bb1a]">
          Trang chủ
        </a>
        <ChevronRightIcon />
        <a href="/san-pham" className="hover:text-[#51bb1a]">
          Sản phẩm
        </a>
        {originalCategory && (
          <>
            <ChevronRightIcon />
            <p className="font-medium">{originalCategory}</p>
          </>
        )}
        <ChevronRightIcon />
        {!originalCategory && (
          <p className="font-medium ">{showPromotional ? "Sản phẩm khuyến mãi" : "Tất cả sản phẩm"}</p>
        )}
      </div>
      <p className="border-b mt-4 border-gray-300 "></p>
      <div className="flex flex-col md:flex-row p-4 bg-background lg:px-[120px] lg:gap-4">
        {/* Nút cuộn xuống danh mục trên mobile */}
        <div className="fixed top-40 right-0 z-40 block md:hidden">
          <button 
            onClick={scrollToCategory}
            className="bg-green-600 text-white p-2 rounded-l-lg shadow-lg"
            aria-label="Mở danh mục"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Phần danh mục sidebar trên desktop */}
        <aside className="w-full md:w-1/4 bg-card p-4 rounded-lg shadow-md border mt-5 h-full hidden md:block">
          <div className="cursor-pointer text-[#1c1c1c] text-sm">
            <h2 className="text-lg font-semibold mb-4 bg-gray-100 p-2 rounded">
              DANH MỤC
            </h2>
            <ul className="space-y-2 flex flex-col gap-4 text-[#1c1c1c] text-sm">
              <li>
                <a href="/" className="text-primary hover:text-[#51aa1b]">
                  Trang chủ
                </a>
              </li>
              <li>
                <a href="/gioi-thieu" className="text-primary hover:text-[#51aa1b]">
                  Giới thiệu
                </a>
              </li>
              <li>
                <a href="/san-pham" className="text-primary hover:text-[#51aa1b]">
                  Sản phẩm
                </a>
              </li>
              <li>
                <a href="/khuyen-mai" className="text-primary hover:text-[#51aa1b]">
                  Khuyến mãi
                </a>
              </li>
              <li>
                <a href="/tin-tuc" className="text-primary hover:text-[#51aa1b]">
                  Tin tức
                </a>
              </li>
              <li>
                <a href="/meo-hay" className="text-primary hover:text-[#51aa1b]">
                  Mẹo hay
                </a>
              </li>
              <li>
                <a href="/lien-he" className="text-primary hover:text-[#51aa1b]">
                  Liên hệ
                </a>
              </li>
              <li>
                <a href="/cua-hang" className="text-primary hover:text-[#51aa1b]">
                  Cửa hàng
                </a>
              </li>
            </ul>
          </div>

          <div>
            <FilterByPrice
              onPriceFilterChange={handlePriceFilterChange}
              onTypeFilterChange={handleTypeFilterChange}
            />
          </div>
        </aside>

        <main className="w-full">
          <h1 className="text-[16px] font-medium text-[#1e1e1e] mb-4 lg:text-[26px] uppercase">
            {pageTitle}
          </h1>
          <div className="bg-accent text-white rounded-lg ">
            <img
              alt="Aperol Spritz"
              src="https://bizweb.dktcdn.net/100/360/151/themes/727143/assets/cat-banner-1.jpg?1721896755861"
              className="rounded-sm"
            />
          </div>

          <div className="grid items-center lg:grid-cols-[10%_90%] lg:items-center lg:justify-center">
            <span className="hide-on-mobile text-muted font-medium">
              Xếp theo:
            </span>
            <div className="p-2 grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex gap-3">
                  {[
                    { value: "a-z", label: "Tên A-Z" },
                    { value: "z-a", label: "Tên Z-A" },
                    { value: "productNew", label: "Hàng mới" },
                    { value: "priceUp", label: "Giá thấp đến cao" },
                    { value: "priceDown", label: "Giá cao đến thấp" },
                  ].map((option) => (
                    <div key={option.value} className="flex items-center">
                      <RadioButton
                        inputId={option.value}
                        name="sort"
                        value={option.value}
                        onChange={(e) => handleSortChange(e.value)}
                        checked={sortOption === option.value}
                        style={{
                          transform: "scale(0.6)",
                          transformOrigin: "left center",
                          border: "1px solid",
                          borderRadius: "50%",
                          backgroundColor: "white",
                        }}
                      />
                      <label
                        htmlFor={option.value}
                        className="cursor-pointer text-[#1c1c1c] text-sm"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="cursor-pointer text-[#1c1c1c] text-sm mb-5">
            <AllProducts
              sortOption={sortOption}
              priceFilters={priceFilters}
              typeFilters={typeFilters}
              showPromotional={showPromotional}
              category={originalCategory}
            />
          </div>
         
        </main>
      </div>

      {/* Thêm phần danh mục ở cuối trang cho mobile */}
      <div ref={categoryRef} className="block md:hidden mt-6 p-4 rounded-lg shadow-md border">
        <div className="cursor-pointer text-[#1c1c1c] text-sm">
          <h2 id="danh-muc" className="text-lg font-semibold mb-4 text-green-600 border-b pb-2">
            DANH MỤC
          </h2>
          <ul className="space-y-2 flex flex-col gap-4 text-[#1c1c1c] text-sm">
            <li>
              <a href="/" className="text-primary hover:text-[#51aa1b]">
                Trang chủ
              </a>
            </li>
            <li>
              <a href="/gioi-thieu" className="text-primary hover:text-[#51aa1b]">
                Giới thiệu
              </a>
            </li>
            <li>
              <a href="/san-pham" className="text-primary hover:text-[#51aa1b]">
                Sản phẩm
              </a>
            </li>
            <li>
              <a href="/khuyen-mai" className="text-primary hover:text-[#51aa1b]">
                Khuyến mãi
              </a>
            </li>
            <li>
              <a href="/tin-tuc" className="text-primary hover:text-[#51aa1b]">
                Tin tức
              </a>
            </li>
            <li>
              <a href="/meo-hay" className="text-primary hover:text-[#51aa1b]">
                Mẹo hay
              </a>
            </li>
            <li>
              <a href="/lien-he" className="text-primary hover:text-[#51aa1b]">
                Liên hệ
              </a>
            </li>
            <li>
              <a href="/cua-hang" className="text-primary hover:text-[#51aa1b]">
                Cửa hàng
              </a>
            </li>
          </ul>
        </div>

        <div className="mt-4">
          <FilterByPrice
            onPriceFilterChange={handlePriceFilterChange}
            onTypeFilterChange={handleTypeFilterChange}
          />
        </div>
      </div>
    </div>
  );
}

export default ProductLayout;
