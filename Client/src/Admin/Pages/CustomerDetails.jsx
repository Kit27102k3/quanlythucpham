import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {authApi} from "../../api/authApi";
import { Package, XCircle, CreditCard } from "lucide-react";

function CustomerDetails() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authApi.getUserById(id);
        setUser(res.data);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        setError("Không thể tải thông tin người dùng.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 p-10">{error}</div>;
  }

  if (!user) {
    return (
      <div className="text-center text-gray-500 p-10">
        Không có thông tin người dùng.
      </div>
    );
  }

  return (
    <div className="px-[120px] p-6">
      <h1 className="uppercase text-2xl font-medium text-center">
        Thông tin khách hàng
      </h1>
      <div>
        <img
          src={user.userImage || "https://www.gravatar.com/avatar/?d=mp"}
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

      <div className="mt-5">
        <Tabs />
      </div>
    </div>
  );
}

const Tabs = () => {
  const [activeTab, setActiveTab] = useState("ordered");

  const TabButton = ({ children, icon: Icon, tab, activeTab, onClick }) => (
    <button
      className={`flex items-center p-3 font-medium space-x-2 ${
        activeTab === tab
          ? "border-b-2 border-blue-500 text-blue-500"
          : "text-gray-500 hover:text-blue-500"
      }`}
      onClick={() => onClick(tab)}
    >
      <Icon size={20} />
      <span>{children}</span>
    </button>
  );

  return (
    <div className="border-t">
      <div className="flex border-b justify-center gap-10">
        <TabButton
          tab="ordered"
          activeTab={activeTab}
          onClick={setActiveTab}
          icon={Package}
        >
          Đơn đã đặt
        </TabButton>
        <TabButton
          tab="cancelled"
          activeTab={activeTab}
          onClick={setActiveTab}
          icon={XCircle}
        >
          Đơn đã hủy
        </TabButton>
        <TabButton
          tab="paid"
          activeTab={activeTab}
          onClick={setActiveTab}
          icon={CreditCard}
        >
          Đơn đã thanh toán
        </TabButton>
      </div>

      <div className="p-6">
        {activeTab === "ordered" && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-blue-600">
              Đơn đã đặt
            </h2>
            <p className="text-gray-600">Nội dung đơn đã đặt...</p>
          </div>
        )}
        {activeTab === "cancelled" && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-red-600">
              Đơn đã hủy
            </h2>
            <p className="text-gray-600">Nội dung đơn đã hủy...</p>
          </div>
        )}
        {activeTab === "paid" && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-green-600">
              Đơn đã thanh toán
            </h2>
            <p className="text-gray-600">Nội dung đơn đã thanh toán...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetails;
