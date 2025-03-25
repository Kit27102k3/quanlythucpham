import { useState } from "react";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import { RadioButton } from "primereact/radiobutton";
import AllProducts from "./AllProducts";
import PaginatorBasic from "../../../Until/Paginator";
import "../../../index.css";
import FilterByPrice from "../../component/FilterByPrice";

function ProductLayout() {
  const [ingredient, setIngredient] = useState("");

  return (
    <div>
      <div className="flex items-center px-4 mt-2 text-sm lg:px-[120px]">
        <a href="/" className="hover:text-[#51bb1a]">
          Trang chủ
        </a>
        <ChevronRightIcon />
        <p className="font-medium "></p>
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
            <FilterByPrice />
          </div>
        </aside>

        <main className="w-full">
          <h1 className="text-[16px] font-medium text-[#1e1e1e] mb-4 lg:text-[26px] uppercase">
            Tất cả sản phẩm
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
            <AllProducts />
          </div>
          <PaginatorBasic />
        </main>
      </div>
    </div>
  );
}

export default ProductLayout;
