import { ChevronRightIcon } from "@radix-ui/react-icons";
import DefaultProfile from "./DefaultProfile";

function ProfileUser() {
  return (
    <div>
      <div className="flex lg:px-[120px] px-[10px] items-center text-sm py-2 ">
        <a href="/" className="hover:text-[#51bb1a]">
          Trang chủ
        </a>
        <ChevronRightIcon />
        <p className="font-medium ">Thông tin khách hàng</p>
      </div>
      <div className="border border-b-gray-50 opacity-25"></div>
      <div className="lg:px-[120px] px-[10px] mt-10 mb-5">
        <DefaultProfile />
      </div>
    </div>
  );
}

export default ProfileUser;
