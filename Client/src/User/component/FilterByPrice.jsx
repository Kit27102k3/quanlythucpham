import { useState } from "react";
import { Checkbox } from "primereact/checkbox";
import { Scrollbars } from "react-custom-scrollbars-2";

const categories = [
  { name: "Giá dưới 100.000đ", key: "A" },
  { name: "100.000đ - 200.000đ", key: "B" },
  { name: "200.000đ - 300.000đ", key: "C" },
  { name: "300.000đ - 500.000đ", key: "D" },
  { name: "500.000đ - 1.000.000đ", key: "E" },
  { name: "Giá trên 1.000.000đ", key: "F" },
];

const typeProducts = [
    { name: "Bột giặt", key: "A" },
    { name: "Đồ uống", key: "B" },
    { name: "Hạt nêm", key: "C" },
    { name: "Kem đánh răng", key: "D" },
    { name: "Mì gói", key: "E" },
    { name: "Rau củ", key: "F" },
    { name: "Kem đánh răng", key: "G" },
    { name: "Mì gói", key: "H" },
    { name: "Rau củ", key: "I" },
  ];

const FilterByPrice = () => {
  const [selectedCategories, setSelectedCategories] = useState([categories[0]]);
  const [selectedTypeProduct, setSelectedTypeProduct] = useState([
    typeProducts[0],
  ]);

  const onCategoryChange = (e) => {
    let _selectedCategories = [...selectedCategories];

    if (e.checked) _selectedCategories.push(e.value);
    else
      _selectedCategories = _selectedCategories.filter(
        (category) => category.key !== e.value.key
      );

    setSelectedCategories(_selectedCategories);
  };

  const onTypeProductChange = (e) => {
    let _selectedTypeProduct = [...selectedTypeProduct];

    if (e.checked) _selectedTypeProduct.push(e.value);
    else
      _selectedTypeProduct = _selectedTypeProduct.filter(
        (typeProduct) => typeProduct.key !== e.value.key
      );

    setSelectedTypeProduct(_selectedTypeProduct);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mt-10 mb-4 bg-gray-100 p-2">
        TÌM THEO
      </h2>
      <div className="card ">
        <div className="flex flex-col gap-3">
          <h1 className="font-medium">Giá sản phẩm</h1>
          {categories.map((category) => {
            return (
              <div key={category.key} className="flex items-center gap-2">
                <Checkbox
                  inputId={category.key}
                  name="category"
                  value={category}
                  onChange={onCategoryChange}
                  checked={selectedCategories.some(
                    (item) => item.key === category.key
                  )}
                  className="small-checkbox p-checkbox-box"
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
                  htmlFor={category.key}
                  className=" cursor-pointer text-[#1c1c1c] text-sm"
                >
                  {category.name}
                </label>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-3 mt-5">
          <h1 className="font-medium">Loại</h1>
          <Scrollbars
            style={{
              width: "100%",
              height: "150px",
            }}
          >
            {typeProducts.map((typeProduct) => {
              return (
                <div
                  key={typeProduct.key}
                  className="flex items-center gap-2 py-1"
                >
                  <Checkbox
                    inputId={typeProduct.key}
                    name="typeProduct"
                    value={typeProduct}
                    onChange={onTypeProductChange}
                    checked={selectedTypeProduct.some(
                      (item) => item.key === typeProduct.key
                    )}
                    className="small-checkbox p-checkbox-box"
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
                    htmlFor={typeProduct.key}
                    className=" cursor-pointer text-[#1c1c1c] text-sm"
                  >
                    {typeProduct.name}
                  </label>
                </div>
              );
            })}
          </Scrollbars>
        </div>
      </div>
    </div>
  );
};

export default FilterByPrice;
