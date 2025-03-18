import React, { useState, useRef } from "react";
import { Cross1Icon } from "@radix-ui/react-icons";
import { Scrollbars } from "react-custom-scrollbars-2";
import { MinusIcon, PlusIcon } from "@radix-ui/react-icons";

function Products() {
  const [count, setCount] = useState(1);
  return (
    <div className="w-[350px]">
      <Scrollbars
        style={{
          width: "100%",
          height: "130px",
        }}
        className="border-b"
      >
        <div className="flex justify-between mb-4">
          <img
            src="https://bizweb.dktcdn.net/thumb/medium/100/360/151/products/nuocdua.jpg"
            alt=""
            className="w-20 h-20"
          />
          <div className="flex flex-col justify-items-start">
            <p>Nước dừa xiêm nè bạn haha...</p>
            <p>13.500₫</p>
            <div className="flex items-center cursor-pointer">
              <MinusIcon
                onClick={() =>
                  setCount((prevCount) => (prevCount > 1 ? prevCount - 1 : 1))
                }
                className=" size-[25px] border p-2 text-black"
              />
              <input
                type="text"
                className="text-black w-12 border border-l-0 border-r-0 outline-none text-center"
                value={count}
                onChange={(e) => setCount(Number(e.target.value) || 1)}
              />
              <PlusIcon
                onClick={() => setCount(count + 1)}
                className=" size-[25px] border p-2 text-black cursor-pointer"
              />
            </div>
          </div>
          <Cross1Icon className="cursor-pointer"/>
        </div>
        
      </Scrollbars>
      <div className="mt-2">
        <div className="flex justify-between mb-4">
          <p>TỔNG CỘNG: </p>
          <p>13.500đ</p>
        </div>
        <div className="flex justify-between gap-2">
          <button className="bg-[#51bb1a] text-white uppercase text-sm p-3 w-full cursor-pointer hover:opacity-80">
            Thanh toán
          </button>
          <button className="bg-[#51bb1a] text-white uppercase text-sm p-3 w-full cursor-pointer hover:opacity-80">
            Giỏ hàng
          </button>
        </div>
      </div>
    </div>
  );
}

export default Products;
