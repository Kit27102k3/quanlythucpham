import { Link, Outlet } from "react-router-dom";
import useFetchUserProfile from "../../Until/useFetchUserProfile";

function DefaultProfile() {
  const { users, fetchUserProfile } = useFetchUserProfile();
  return (
    <div className="w-full h-full ">
      <div className="grid grid-cols-1 sm:grid sm:grid-cols-[40%_60%] lg:grid-cols-[20%_80%]">
        <div className="flex flex-col ">
          <h1 className="uppercase text-[19px] font-normal text-[#212B25] mb-1 ">
            Trang tài khoản
          </h1>
          {users.map((user, index) => (
            <p key={index} className="font-bold text-sm text-[#212B25] mb-2 ">
              Xin chào, <span>{`${user.firstName} ${user.lastName}`} !</span>
            </p>
          ))}
          <ul>
            <li>
              <Link
                to=""
                className="font-normal text-sm text-[#333] block py-2 hover:text-[#51aa1b]"
              >
                Thông tin tài khoản
              </Link>
            </li>
            <li>
              <Link
                to="don-hang"
                className="font-normal text-sm text-[#333] block py-2 hover:text-[#51aa1b]"
              >
                Đơn hàng của bạn
              </Link>
            </li>
            <li>
              <Link
                to="doi-mat-khau"
                className="font-normal text-sm text-[#333] block py-2 hover:text-[#51aa1b]"
              >
                Đổi mật khẩu
              </Link>
            </li>
            <li>
              <Link
                to="dia-chi"
                className="font-normal text-sm text-[#333] block py-2 hover:text-[#51aa1b]"
              >
                Địa chỉ
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DefaultProfile;
