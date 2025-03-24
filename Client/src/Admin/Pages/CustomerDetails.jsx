import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import authApi from "../../api/authApi";

function CustomerDetails() {
  const { id } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authApi.getUserById(id);
        setUser(res.data);
      } catch (error) {
        console.log("Lỗi khi lấy thông tin người dùng:", error);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id]);

  return (
    <div className="px-[120px] p-6">
      <h1 className="uppercase text-2xl font-medium text-center">
        Thông tin khách hàng
      </h1>
      {user ? (
        <div>
          <img
            src={user.avatar || "https://www.gravatar.com/avatar/?d=mp"}
            alt="Avatar"
            className="rounded-full mx-auto mt-5 w-32 h-32 object-cover"
          />
          <p className="text-[16px] font-medium">
            Họ tên:{" "}
            <span className="font-normal">{`${user.firstName} ${user.lastName}`}</span>
          </p>
          <p className="text-[16px] font-medium">
            Số điện thoại: <span className="font-normal">{user.phone}</span>
          </p>
          <p className="text-[16px] font-medium">
            Email: <span className="font-normal">{user.email}</span>
          </p>
          <p className="text-[16px] font-medium">
            Địa chỉ: <span className="font-normal">{user.address}</span>
          </p>
        </div>
      ) : (
        <p className="text-center mt-4">Đang tải thông tin...</p>
      )}

      <div className="mt-5">
        <Tabs />
      </div>
    </div>
  );
}

const Tabs = () => {
  const [activeTab, setActiveTab] = useState("ordered");

  return (
    <div className="w-full border">
      <div className="flex border-b justify-center gap-10">
        <button
          className={`p-3 font-medium ${
            activeTab === "ordered"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500 cursor-pointer"
          }`}
          onClick={() => setActiveTab("ordered")}
        >
          Đơn đã đặt
        </button>
        <button
          className={`p-3 font-medium ${
            activeTab === "cancelled"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500 cursor-pointer"
          }`}
          onClick={() => setActiveTab("cancelled")}
        >
          Đơn đã hủy
        </button>
        <button
          className={`p-3 font-medium ${
            activeTab === "paid"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500 cursor-pointer"
          }`}
          onClick={() => setActiveTab("paid")}
        >
          Đơn đã thanh toán
        </button>
      </div>

      <div className="p-4">
        {activeTab === "ordered" && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Đơn đã đặt</h2>
            <p>Nội dung đơn đã đặt...</p>
          </div>
        )}
        {activeTab === "cancelled" && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Đơn đã hủy</h2>
            <p>Nội dung đơn đã hủy...</p>
          </div>
        )}
        {activeTab === "paid" && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Đơn đã thanh toán</h2>
            <p>Nội dung đơn đã thanh toán...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetails;
