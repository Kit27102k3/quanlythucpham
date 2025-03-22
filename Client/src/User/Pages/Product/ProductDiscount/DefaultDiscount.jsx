import { useState } from "react";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import { RadioButton } from "primereact/radiobutton";
import { Checkbox } from "primereact/checkbox";
import { Scrollbars } from "react-custom-scrollbars-2";
import PaginatorBasic from "../../../../Until/Paginator";
import PromotionProducts from "./PromotionProducts";
import "../../../../index.css";

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

function DefaultDiscount() {
  const [ingredient, setIngredient] = useState("");
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
      <div className="flex items-center px-4 mt-2 text-sm lg:px-[120px]">
        <a href="/" className="hover:text-[#51bb1a]">
          Trang chủ
        </a>
        <ChevronRightIcon />
        <p className="font-medium ">Sản phẩm khuyến mãi</p>
      </div>
      <p className="border-b mt-4 border-gray-300 "></p>
      <div className="flex flex-col md:flex-row p-4 bg-background lg:px-[120px] lg:gap-4">
        <aside className="w-full hide-on-mobile md:w-1/4 bg-card p-4 rounded-lg shadow-md border mt-5 h-full">
          <div className="cursor-pointer text-[#1c1c1c] text-sm">
            <h2 className="text-lg font-semibold mb-4 bg-gray-100 p-2">
              DANH MỤC
            </h2>
            <ul className="space-y-2 flex flex-col gap-2 text-[#1c1c1c] text-sm">
              <li>
                <a href="#" className="text-primary hover:text-[#51aa1b]">
                  Trang chủ
                </a>
              </li>
              <li>
                <a href="#" className="text-primary hover:text-[#51aa1b]">
                  Giới thiệu
                </a>
              </li>
              <li>
                <a href="#" className="text-primary hover:text-[#51aa1b]">
                  Sản phẩm
                </a>
              </li>
              <li>
                <a href="#" className="text-primary hover:text-[#51aa1b]">
                  Khuyến mãi
                </a>
              </li>
              <li>
                <a href="#" className="text-primary hover:text-[#51aa1b]">
                  Tin tức
                </a>
              </li>
              <li>
                <a href="#" className="text-primary hover:text-[#51aa1b]">
                  Mẹo hay
                </a>
              </li>
              <li>
                <a href="#" className="text-primary hover:text-[#51aa1b]">
                  Liên hệ
                </a>
              </li>
              <li>
                <a href="#" className="text-primary hover:text-[#51aa1b]">
                  Cửa hàng
                </a>
              </li>
            </ul>
          </div>

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
        </aside>

        <main className="w-full">
          <h1 className="text-[16px] font-medium text-[#1e1e1e] mb-4 lg:text-[26px] uppercase">
            Sản phẩm khuyến mãi
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
              <div className="card ">
                <div className="flex gap-3 ">
                  <div className="flex items-center hide-on-mobile">
                    <div className="hide-on-mobile">
                      <RadioButton
                        inputId="ingredient1"
                        name="pizza"
                        value="a-z"
                        onChange={(e) => setIngredient(e.value)}
                        checked={ingredient === "a-z"}
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
                        htmlFor="ingredient1"
                        className="cursor-pointer text-[#1c1c1c] hide-on-mobile"
                      >
                        Tên A-Z
                      </label>
                    </div>
                  </div>
                  <div className="flex align-items-center">
                    <div className="hide-on-mobile">
                      <RadioButton
                        inputId="ingredient2"
                        name="pizza"
                        value="z-a"
                        onChange={(e) => setIngredient(e.value)}
                        checked={ingredient === "z-a"}
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
                        htmlFor="ingredient2"
                        className="cursor-pointer text-[#1c1c1c] text-sm"
                      >
                        Tên Z-A
                      </label>
                    </div>
                  </div>
                  <div className="flex align-items-center">
                    <div className="hide-on-mobile">
                      <RadioButton
                        inputId="ingredient3"
                        name="pizza"
                        value="productNew"
                        onChange={(e) => setIngredient(e.value)}
                        checked={ingredient === "productNew"}
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
                        htmlFor="ingredient3"
                        className="cursor-pointer text-[#1c1c1c] text-sm"
                      >
                        Hàng mới
                      </label>
                    </div>
                  </div>
                  <div className="flex align-items-center">
                    <div className="hide-on-mobile">
                      <RadioButton
                        inputId="ingredient4"
                        name="pizza"
                        value="priceUp"
                        onChange={(e) => setIngredient(e.value)}
                        checked={ingredient === "priceUp"}
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
                        htmlFor="ingredient4"
                        className="cursor-pointer text-[#1c1c1c] text-sm"
                      >
                        Giá thấp đến cao
                      </label>
                    </div>
                  </div>
                  <div className="flex align-items-center">
                    <div className="hide-on-mobile">
                      <RadioButton
                        inputId="ingredient4"
                        name="pizza"
                        value="priceSort"
                        onChange={(e) => setIngredient(e.value)}
                        checked={ingredient === "priceSort"}
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
                        htmlFor="ingredient4"
                        className="cursor-pointer text-[#1c1c1c] text-sm"
                      >
                        Giá cao đến thấp
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="cursor-pointer text-[#1c1c1c] text-sm mb-5">
            <PromotionProducts />
          </div>
          <PaginatorBasic />
        </main>
      </div>
    </div>
  );
}

export default DefaultDiscount;
