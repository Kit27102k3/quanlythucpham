import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AllProducts from "./AllProducts";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { BreadCrumb } from "primereact/breadcrumb";
import { SlidersHorizontal, ArrowLeft } from "lucide-react";

const CategoryProducts = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [sortOption, setSortOption] = useState("productNew");
  const [priceFilters, setPriceFilters] = useState([]);
  const [typeFilters] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const decodedCategory = decodeURIComponent(category);

  // Options for sorting dropdown
  const sortOptions = [
    { label: "Mới nhất", value: "productNew" },
    { label: "A đến Z", value: "a-z" },
    { label: "Z đến A", value: "z-a" },
    { label: "Giá tăng dần", value: "priceUp" },
    { label: "Giá giảm dần", value: "priceDown" },
  ];

  // Options for price filters
  const priceOptions = [
    { label: "Dưới 50.000đ", value: { min: 0, max: 50000 } },
    { label: "50.000đ - 100.000đ", value: { min: 50000, max: 100000 } },
    { label: "100.000đ - 200.000đ", value: { min: 100000, max: 200000 } },
    { label: "200.000đ - 500.000đ", value: { min: 200000, max: 500000 } },
    { label: "Trên 500.000đ", value: { min: 500000, max: 100000000 } },
  ];

  // Breadcrumb items
  const items = [
    { label: "Trang chủ", command: () => navigate("/") },
    { label: "Sản phẩm", command: () => navigate("/san-pham") },
    { label: decodedCategory },
  ];

  const home = { icon: "pi pi-home", command: () => navigate("/") };

  const handleSortChange = (e) => {
    setSortOption(e.value);
  };

  const handlePriceFilterChange = (option) => {
    if (priceFilters.some((filter) => filter.min === option.value.min)) {
      setPriceFilters(
        priceFilters.filter((filter) => filter.min !== option.value.min)
      );
    } else {
      setPriceFilters([...priceFilters, option.value]);
    }
  };

  const isPriceSelected = (option) => {
    return priceFilters.some((filter) => filter.min === option.value.min);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4">
        <BreadCrumb model={items} home={home} className="border-none p-0" />
      </div>

      <div className="flex justify-between items-center mb-6">
        <Button
          icon={<ArrowLeft size={16} />}
          onClick={handleGoBack}
          text
          className="text-gray-700 flex items-center gap-1 hover:bg-gray-100 rounded-md px-2 py-1"
          label="Quay lại"
        />

        <h1 className="text-2xl font-semibold text-[#51bb1a]">
          {decodedCategory}
        </h1>

        <div className="flex items-center gap-3">
          <Button
            icon={<SlidersHorizontal size={16} />}
            onClick={() => setShowFilters(!showFilters)}
            outlined
            className="p-button-sm border border-gray-300 text-gray-700"
            label="Lọc"
          />

          <Dropdown
            value={sortOption}
            options={sortOptions}
            onChange={handleSortChange}
            className="w-40 h-10 border border-gray-300 rounded-md"
            placeholder="Sắp xếp theo"
          />
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-md mb-6 border border-gray-200">
          <h3 className="font-medium mb-3">Lọc theo giá</h3>
          <div className="flex flex-wrap gap-2">
            {priceOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handlePriceFilterChange(option)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  isPriceSelected(option)
                    ? "bg-[#51bb1a] text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <AllProducts
        sortOption={sortOption}
        priceFilters={priceFilters}
        typeFilters={typeFilters}
      />
    </div>
  );
};

export default CategoryProducts; 