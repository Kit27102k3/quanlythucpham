import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Outlet } from "react-router-dom";
import { Pencil1Icon } from "@radix-ui/react-icons";

function Customers() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get("http://localhost:8080/auth/profile");
      const data = response.data;
      if (Array.isArray(data)) {
        setUsers(data);
        setFilteredUsers(data);
      } else {
        setUsers([data]);
        setFilteredUsers([data]);
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu người dùng:", error);
    }
  };

  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(event.target.value);

    const filtered = users.filter((user) => {
      return (
        (user.userName && user.userName.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term)) ||
        (user.phone && user.phone.toLowerCase().includes(term)) ||
        `${user.firstName || ""} ${user.lastName || ""}`
          .toLowerCase()
          .includes(term)
      );
    });

    setFilteredUsers(filtered);
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      try {
        await axios.delete(`http://localhost:8080/auth/profile/${userId}`);
        setUsers((prev) => prev.filter((user) => user._id !== userId));
        setFilteredUsers((prev) => prev.filter((user) => user._id !== userId));
        alert("Xóa người dùng thành công!");
      } catch (error) {
        console.error("Lỗi khi xóa người dùng:", error);
        alert("Xóa người dùng thất bại!");
      }
    }
  };

  const handleBlock = async (userId) => {
    try {
      const user = users.find((u) => u._id === userId);
      const isBlocked = !user.isBlocked;

      await axios.put(`http://localhost:8080/auth/profile/block/${userId}`, {
        isBlocked,
      });

      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, isBlocked } : user
        )
      );

      setFilteredUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, isBlocked } : user
        )
      );

      alert(
        isBlocked ? "Người dùng đã bị chặn!" : "Người dùng đã được bỏ chặn!"
      );
    } catch (error) {
      console.error("Lỗi khi chặn/bỏ chặn người dùng:", error);
      alert("Thao tác thất bại!");
    }
  };

  const handleViewDetails = async (userId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/orders/user/${userId}`
      );
      setOrders(response.data);
      setSelectedUser(filteredUsers.find((user) => user._id === userId));
      setShowDetails(true);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin chi tiết:", error);
      alert("Không thể lấy thông tin chi tiết!");
    }
  };

  return (
    <div className="p-5 font-sans bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Thông tin người dùng
      </h1>

      <input
        type="text"
        placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
        value={searchTerm}
        onChange={handleSearch}
        className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <div className="overflow-x-auto">
        <table className="w-full bg-white shadow-md rounded-md overflow-hidden">
          <thead>
            <tr className="bg-blue-600 text-white text-left">
              <th className="p-3">Tên đăng nhập</th>
              <th className="p-3">Họ và tên</th>
              <th className="p-3">Email</th>
              <th className="p-3">Số điện thoại</th>
              <th className="p-3">Địa chỉ</th>
              <th className="p-3">Ảnh đại diện</th>
              <th className="p-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id} className="border-b hover:bg-gray-100">
                <td className="p-3">{user.userName || "Chưa có"}</td>
                <td className="p-3">
                  {`${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                    "Chưa có"}
                </td>
                <td className="p-3">{user.email || "Chưa có"}</td>
                <td className="p-3">{user.phone || "Chưa có"}</td>
                <td className="p-3">{user.address || "Chưa có"}</td>
                <td className="p-3">
                  {user.userImage ? (
                    <img
                      src={user.userImage}
                      alt="Avatar"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    "Chưa có ảnh"
                  )}
                </td>
                <td className="p-3 space-x-2 flex gap-2">
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="text-white bg-red-500 p-1 rounded hover:opacity-70 cursor-pointer text-[12px]"
                  >
                    Xóa
                  </button>
                  <button
                    onClick={() => handleBlock(user._id)}
                    className="text-white bg-blue-500 rounded p-1 text-[12px] hover:opacity-70 cursor-pointer"
                  >
                    {user.isBlocked ? "Bỏ chặn" : "Chặn"}
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/admin/customers/details/${user._id}`)
                    }
                    className="text-white text-[12px] bg-green-500 rounded p-1 hover:opacity-70 cursor-pointer"
                  >
                    Xem chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Outlet />
      </div>
    </div>
  );
}

export default Customers;
