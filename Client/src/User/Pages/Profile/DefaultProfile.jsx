import { Link, Outlet, useLocation } from "react-router-dom";
import useFetchUserProfile from "../../Until/useFetchUserProfile";
import { useState, useEffect, createContext } from "react";
import messagesApi from "../../../api/messagesApi";

// Tạo context để chia sẻ dữ liệu tin nhắn chưa đọc
export const UnreadMessagesContext = createContext({
  unreadMessages: 0,
  refreshUnreadCount: () => {},
});

function DefaultProfile() {
  const users = useFetchUserProfile();
  const location = useLocation();
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Hàm fetch tin nhắn chưa đọc, có thể gọi từ bất kỳ component con nào
  const fetchUnreadMessages = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;
      
      const messages = await messagesApi.getMessagesByUserId("admin");
      const unreadCount = messages.filter(msg => msg.sender === "admin" && !msg.read).length;
      setUnreadMessages(unreadCount);
    } catch (error) {
      console.error("Lỗi khi lấy số tin nhắn chưa đọc:", error);
    }
  };

  // Kiểm tra tin nhắn chưa đọc của người dùng
  useEffect(() => {
    fetchUnreadMessages();
    
    // Cập nhật mỗi 10 giây
    const intervalId = setInterval(fetchUnreadMessages, 10000);
    return () => clearInterval(intervalId);
  }, []);

  // Tạo giá trị context
  const contextValue = {
    unreadMessages,
    refreshUnreadCount: fetchUnreadMessages
  };

  return (
    <UnreadMessagesContext.Provider value={contextValue}>
      <div className="w-full h-full ">
        <div className="grid grid-cols-1 sm:grid sm:grid-cols-[40%_60%] lg:grid-cols-[20%_80%]">
          <div className="flex flex-col ">
            <h1 className="uppercase text-[19px] font-normal text-[#212B25] mb-1 ">
              Trang tài khoản
            </h1>
            <p className="font-bold text-sm text-[#212B25] mb-2 ">
              Xin chào, <span>{`${users?.firstName} ${users?.lastName}`} !</span>
            </p>
            <ul>
              <li>
                <Link
                  to=""
                  className={`font-normal text-sm text-[#333] block py-2 hover:text-[#51aa1b] ${
                    location.pathname === "/tai-khoan" ? "text-[#51aa1b] font-semibold" : ""
                  }`}
                >
                  Thông tin tài khoản
                </Link>
              </li>
              <li>
                <Link
                  to="don-hang"
                  className={`font-normal text-sm text-[#333] block py-2 hover:text-[#51aa1b] ${
                    location.pathname.includes("don-hang") ? "text-[#51aa1b] font-semibold" : ""
                  }`}
                >
                  Đơn hàng của bạn
                </Link>
              </li>
              <li>
                <Link
                  to="tin-nhan"
                  className={`font-normal text-sm text-[#333] flex items-center py-2 hover:text-[#51aa1b] ${
                    location.pathname.includes("tin-nhan") ? "text-[#51aa1b] font-semibold" : ""
                  }`}
                >
                  Tin nhắn
                  {unreadMessages > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {unreadMessages}
                    </span>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  to="doi-mat-khau"
                  className={`font-normal text-sm text-[#333] block py-2 hover:text-[#51aa1b] ${
                    location.pathname.includes("doi-mat-khau") ? "text-[#51aa1b] font-semibold" : ""
                  }`}
                >
                  Đổi mật khẩu
                </Link>
              </li>
              <li>
                <Link
                  to="dia-chi"
                  className={`font-normal text-sm text-[#333] block py-2 hover:text-[#51aa1b] ${
                    location.pathname.includes("dia-chi") ? "text-[#51aa1b] font-semibold" : ""
                  }`}
                >
                  Địa chỉ
                </Link>
              </li>
              <li>
                <Link
                  to="voucher"
                  className={`font-normal text-sm text-[#333] block py-2 hover:text-[#51aa1b] ${
                    location.pathname.includes("voucher") ? "text-[#51aa1b] font-semibold" : ""
                  }`}
                >
                  Voucher của bạn
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <Outlet />
          </div>
        </div>
      </div>
    </UnreadMessagesContext.Provider>
  );
}

export default DefaultProfile;
