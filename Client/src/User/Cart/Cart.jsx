import React, { useState } from "react";
import { MinusIcon, PlusIcon } from "@radix-ui/react-icons";
import { Checkbox } from "@radix-ui/themes";
function Cart() {
  const [count, setCount] = useState(1);
  return (
    <div className="lg:grid lg:px-[120px] mb-5">
      <div className="flex gap-2 text-sm text-[#333333] p-2">
        <a
          href="/"
          className="hover:text-[#51bb1a] cursor-pointer lg:text-[16px]"
        >
          Trang chủ
        </a>{" "}
        {" >"}
        <p className="font-medium lg:text-[16px]">Giỏ hàng</p>
      </div>
      <div className="border-b border-gray-300"></div>
      <h1 className="text-[26px] uppercase font-medium hide-on-mobile p-2 mt-4">
        Giỏ hàng <span className="text-sm font-normal">(1 sản phẩm)</span>
      </h1>
      <div className="lg:grid lg:grid-cols-[75%_25%]">
        <div className="p-2 mt-5">
          <h1 className="text-[16px] uppercase text-[#1c1c1c] font-medium hide-on-pc">
            Giỏ hàng của bạn
          </h1>
          <div className="grid grid-cols-[25%_45%_25%] mt-5 lg:grid lg:grid-cols-[2%_20%_53%_25%] place-items-center">
            <Checkbox defaultChecked />
            <img
              src="https://bizweb.dktcdn.net/thumb/large/100/360/151/products/nuocdua.jpg?v=1562726113047"
              alt=""
              className="w-20 h-20 lg:w-[170px] lg:h-[170px] object-cover"
            />
            <div className="text-[12px] lg:text-[16px]">
              <p className="font-medium">
                Nước dừa xiêm hương vị sen Cocoxin hộp 330ml
              </p>
              <p className="text-gray-500">
                Giá: <span className="text-[#51bb1a]">13.500đ</span>
              </p>
            </div>
            <div className="grid grid-cols-1 place-items-center">
              <div className="flex items-center cursor-pointer">
                <MinusIcon
                  onClick={() =>
                    setCount((prevCount) => (prevCount > 1 ? prevCount - 1 : 1))
                  }
                  className=" size-[25.5px] border p-2 text-black lg:size-[28px]"
                />
                <input
                  type="text"
                  className="text-black w-10 border border-l-0 border-r-0 outline-none text-center lg:py-[1.2px]"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value) || 1)}
                />
                <PlusIcon
                  onClick={() => setCount(count + 1)}
                  className=" size-[25.5px] border p-2 text-black cursor-pointer lg:size-[28px]"
                />
              </div>
              <button className="text-[12px] lg:mt-4 mt-2 cursor-pointer hover:text-[#51bb1a]">
                Xóa
              </button>
            </div>
          </div>
        </div>
        <div className="border-b border-gray-300 hide-on-pc"></div>
        <div className="p-2">
          <div className="lg:flex lg:items-center lg:justify-between hide-on-mobile font-medium">
            <p>Tạm tính</p>
            <p>13.500đ</p>
          </div>
          <div className="border-gray-200 border mt-4 mb-4 hide-on-mobile"></div>
          <div className="flex justify-between items-center">
            <p>Tổng tiền:</p>
            <p className="lg:text-[26px] lg:text-[#51bb1a] lg:font-medium">
              13.500đ
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 mt-2">
            <button className="w-full text-white  uppercase bg-[#51bb1a] text-sm p-3 cursor-pointer hover-animation-button">
              Thanh toán ngay
            </button>
            <button className="w-full uppercase border text-sm p-3 cursor-pointer lg:font-medium hover:bg-[#51bb1a] hover:text-white">
              Tiếp tục mua hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
