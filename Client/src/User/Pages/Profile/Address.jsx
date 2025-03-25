import { useState, useEffect } from "react";
import UpdateAddress from "../../../Until/UpdateAddress";
import useFetchUserProfile from "../../Until/useFetchUserProfile";

function Address() {
  const [isShow, setIsShow] = useState(false);
  const users = useFetchUserProfile();

  return (
    <div className="mt-2">
      <h1 className="text-[20px] uppercase font-normal text-[#212b25]">
        Địa chỉ của bạn
      </h1>
      <button className="cursor-pointer hover-animation-button p-2 bg-[#51bb1a] mt-2 w-[50%] uppercase text-[12px] text-white lg:w-[150px] lg:mt-4">
        Thêm địa chỉ
      </button>
      <div className="border border-gray-200 mt-4 mb-4"></div>
      <div className="lg:grid lg:grid-cols-[70%_30%]">
        <div className="flex flex-col gap-2">
          <p className="text-[#1c1c1c] text-[12px] font-medium lg:text-sm">
            Họ tên:
            <span className="font-normal">
              {" "}
              {`${users?.firstName} ${users?.lastName}`}
            </span>
            <span className="font-normal text-[#51bb1a] text-[10px] ml-2 lg:text-[12px]">
              {" "}
              Địa chỉ mặc định
            </span>
          </p>
          <p className="text-[#1c1c1c] text-[12px] font-medium lg:text-sm">
            Địa chỉ:
            <span className="font-normal"> {users?.address}</span>
          </p>
          <p className="text-[#1c1c1c] text-[12px] font-medium lg:text-sm">
            Số điện thoại:
            <span className="font-normal"> {users?.phone}</span>
          </p>
        </div>
        <button
          onClick={() => setIsShow(!isShow)}
          className="hover-animation-button p-2 bg-[#51bb1a] w-[50%] uppercase text-[12px] text-white mt-5 hide-on-pc"
        >
          Chỉnh sửa địa chỉ
        </button>
        <button
          onClick={() => setIsShow(!isShow)}
          className=" p-2 hover:text-[#51bb1a] cursor-pointer w-[50%] uppercase text-[12px] mt-5 hide-on-mobile"
        >
          Chỉnh sửa địa chỉ
        </button>
      </div>
      {isShow && <UpdateAddress onUpdate={fetchUserProfile} />}
    </div>
  );
}

export default Address;
