/* eslint-disable react/prop-types */
import { useState } from "react";
import { RadioButton } from "primereact/radiobutton";
import { Checkbox } from "primereact/checkbox";
import { Scrollbars } from "react-custom-scrollbars-2";

const priceRanges = [
  { name: "Giá dưới 100.000đ", key: "A", min: 0, max: 100000 },
  { name: "100.000đ - 200.000đ", key: "B", min: 100000, max: 200000 },
  { name: "200.000đ - 300.000đ", key: "C", min: 200000, max: 300000 },
  { name: "300.000đ - 500.000đ", key: "D", min: 300000, max: 500000 },
  { name: "500.000đ - 1.000.000đ", key: "E", min: 500000, max: 1000000 },
  { name: "Giá trên 1.000.000đ", key: "F", min: 1000000, max: Infinity },
];

const typeProducts = [
  { name: "Muối", key: "A" },
  { name: "Nước", key: "B" },
  { name: "Trái cây", key: "C" },
  { name: "Rau", key: "D" },
  // Thêm các loại khác nếu có
];

const FilterByPrice = ({ onPriceFilterChange, onTypeFilterChange }) => {
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [selectedTypeProduct, setSelectedTypeProduct] = useState([]);

  const onPriceRangeChange = (e) => {
    setSelectedPriceRange(e.value);
    onPriceFilterChange(e.value ? [e.value] : []);
  };

  const onTypeProductChange = (e) => {
    let _selectedTypeProduct = [...selectedTypeProduct];

    if (e.checked) {
      _selectedTypeProduct.push(e.value);
    } else {
      _selectedTypeProduct = _selectedTypeProduct.filter(
        (type) => type.key !== e.value.key
      );
    }

    setSelectedTypeProduct(_selectedTypeProduct);
    onTypeFilterChange(_selectedTypeProduct);
  };

  const clearPriceFilter = () => {
    setSelectedPriceRange(null);
    onPriceFilterChange([]);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mt-10 mb-4 bg-gray-100 p-2">
        TÌM THEO
      </h2>
      <div className="card">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h1 className="font-medium">Giá sản phẩm</h1>
            {selectedPriceRange && (
              <button
                onClick={clearPriceFilter}
                className="text-sm text-blue-500 hover:underline"
              >
                Bỏ chọn
              </button>
            )}
          </div>
          {priceRanges.map((range) => (
            <div key={range.key} className="flex items-center gap-2">
              <RadioButton
                inputId={`price-${range.key}`}
                name="priceRange"
                value={range}
                onChange={onPriceRangeChange}
                checked={selectedPriceRange?.key === range.key}
                className="small-radio"
                style={{
                  transform: "scale(0.6)",
                  transformOrigin: "left center",
                  color: "black",
                  border: "1px solid",
                  borderRadius: "50%",
                  backgroundColor: "white",
                }}
              />
              <label
                htmlFor={`price-${range.key}`}
                className="cursor-pointer text-[#1c1c1c] text-sm"
              >
                {range.name}
              </label>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 mt-5">
          <h1 className="font-medium">Loại</h1>
          <Scrollbars style={{ width: "100%", height: "150px" }}>
            {typeProducts.map((type) => (
              <div key={type.key} className="flex items-center gap-2 py-1">
                <Checkbox
                  inputId={`type-${type.key}`}
                  name="typeProduct"
                  value={type}
                  onChange={onTypeProductChange}
                  checked={selectedTypeProduct.some((t) => t.key === type.key)}
                  style={{
                    transform: "scale(0.6)",
                    transformOrigin: "left center",
                    color: "black",
                    border: "2px solid",
                    borderRadius: "50%",
                    backgroundColor: "white",
                  }}
                />
                <label
                  htmlFor={`type-${type.key}`}
                  className="cursor-pointer text-[#1c1c1c] text-sm ml-2"
                >
                  {type.name}
                </label>
              </div>
            ))}
          </Scrollbars>
        </div>
      </div>
    </div>
  );
};

export default FilterByPrice;
