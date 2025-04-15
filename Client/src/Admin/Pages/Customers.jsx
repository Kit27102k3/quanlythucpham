import React, { useState, useEffect } from "react";
import {
  Trash2,
  Lock,
  Unlock,
  Eye,
  Search,
  UserX,
  UserCheck,
} from "lucide-react";
import { API_BASE_URL } from '../../config/apiConfig';

function Customers() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Thêm token xác thực nếu cần
          // 'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("Lỗi khi lấy dữ liệu");
      }

      const data = await response.json();
      const processedUsers = Array.isArray(data) ? data : [data];
      setUsers(processedUsers);
      setFilteredUsers(processedUsers);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu người dùng:", error);
    }
  };

  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = users.filter((user) => {
      const fullName = `${user.firstName || ""} ${
        user.lastName || ""
      }`.toLowerCase();
      return (
        fullName.includes(term) ||
        (user.userName && user.userName.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term)) ||
        (user.phone && user.phone.toLowerCase().includes(term))
      );
    });

    setFilteredUsers(filtered);
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/profile/${userId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            // Thêm token xác thực nếu cần
            // 'Authorization': `Bearer ${token}`
          },
        });

        if (!response.ok) {
          throw new Error("Xóa người dùng thất bại");
        }

        const updatedUsers = users.filter((user) => user._id !== userId);
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
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

      const response = await fetch(`${API_BASE_URL}/auth/profile/block/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          // Thêm token xác thực nếu cần
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isBlocked }),
      });

      if (!response.ok) {
        throw new Error("Thao tác thất bại");
      }

      const updatedUsers = users.map((user) =>
        user._id === userId ? { ...user, isBlocked } : user
      );

      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);

      alert(
        isBlocked ? "Người dùng đã bị chặn!" : "Người dùng đã được bỏ chặn!"
      );
    } catch (error) {
      console.error("Lỗi khi chặn/bỏ chặn người dùng:", error);
      alert("Thao tác thất bại!");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
          <h1 className="text-3xl font-bold text-white text-center">
            Quản Lý Khách Hàng
          </h1>
        </div>

        <div className="p-6">
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
            />
            <Search className="absolute left-3 top-4 text-gray-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-4 text-left">Thông Tin</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-gray-200 hover:bg-gray-100 transition duration-200"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="mr-4">
                          {user.isBlocked ? (
                            <UserX className="text-red-500" />
                          ) : (
                            <UserCheck className="text-green-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">
                            {`${user.firstName || ""} ${
                              user.lastName || ""
                            }`.trim() || "Chưa có tên"}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {user.email || "Chưa có email"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          user.isBlocked
                            ? "bg-red-200 text-red-800"
                            : "bg-green-200 text-green-800"
                        }`}
                      >
                        {user.isBlocked ? "Đã Chặn" : "Hoạt Động"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="text-red-500 hover:bg-red-100 p-2 rounded-full transition"
                          title="Xóa người dùng"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={() => handleBlock(user._id)}
                          className="text-blue-500 hover:bg-blue-100 p-2 rounded-full transition"
                          title={user.isBlocked ? "Bỏ chặn" : "Chặn"}
                        >
                          {user.isBlocked ? (
                            <Unlock size={18} />
                          ) : (
                            <Lock size={18} />
                          )}
                        </button>
                        <a
                        href={`/admin/customers/details/${user._id}`}
                          className="text-green-500 hover:bg-green-100 p-2 rounded-full transition"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Customers;
