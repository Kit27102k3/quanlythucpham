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
import { Link } from "react-router-dom";
import Pagination from "../../utils/Paginator";

function Customers() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [first, setFirst] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  const handlePageChange = ({ page, rows }) => {
    setFirst((page - 1) * rows);
    setRowsPerPage(rows);
  };

  const paginatedUsers = filteredUsers.slice(first, first + rowsPerPage);

  return (
    <div className="container mx-auto px-2 md:px-4 py-4 md:py-8 bg-gray-50">
      <div className="bg-white shadow-md md:shadow-xl rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 md:p-6">
          <h1 className="text-xl md:text-3xl font-bold text-white text-center">
            Quản Lý Khách Hàng
          </h1>
        </div>

        <div className="p-3 md:p-6">
          <div className="relative mb-4 md:mb-6">
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 md:py-3 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 text-sm md:text-base"
            />
            <Search className="absolute left-3 top-2.5 md:top-4 text-gray-400 h-4 w-4 md:h-5 md:w-5" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-xs md:text-sm leading-normal">
                  <th className="py-2 md:py-3 px-2 md:px-4 text-left">Thông Tin</th>
                  <th className="py-2 md:py-3 px-2 md:px-4 text-center">Trạng Thái</th>
                  <th className="py-2 md:py-3 px-2 md:px-4 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-gray-200 hover:bg-gray-100 transition duration-200"
                  >
                    <td className="py-2 md:py-4 px-2 md:px-4">
                      <div className="flex items-center">
                        <div className="mr-2 md:mr-4">
                          {user.isBlocked ? (
                            <UserX className="text-red-500 h-4 w-4 md:h-5 md:w-5" />
                          ) : (
                            <UserCheck className="text-green-500 h-4 w-4 md:h-5 md:w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-xs md:text-sm">
                            {`${user.firstName || ""} ${
                              user.lastName || ""
                            }`.trim() || "Chưa có tên"}
                          </p>
                          <p className="text-gray-500 text-xs md:text-sm">
                            {user.email || "Chưa có email"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 md:py-4 px-2 md:px-4 text-center">
                      <span
                        className={`px-2 md:px-3 py-1 rounded-full text-xs ${
                          user.isBlocked
                            ? "bg-red-200 text-red-800"
                            : "bg-green-200 text-green-800"
                        }`}
                      >
                        {user.isBlocked ? "Đã Chặn" : "Hoạt Động"}
                      </span>
                    </td>
                    <td className="py-2 md:py-4 px-2 md:px-4 text-right">
                      <div className="flex justify-end space-x-1 md:space-x-2">
                        <Link
                          to={`/admin/customers/${user._id}`}
                          className="text-blue-500 hover:bg-blue-100 p-1 md:p-2 rounded-full transition"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4 md:h-5 md:w-5" />
                        </Link>
                        <button
                          onClick={() => handleBlock(user._id)}
                          className={`${
                            user.isBlocked ? "text-green-500 hover:bg-green-100" : "text-yellow-500 hover:bg-yellow-100"
                          } p-1 md:p-2 rounded-full transition`}
                          title={user.isBlocked ? "Bỏ chặn" : "Chặn"}
                        >
                          {user.isBlocked ? <Unlock className="h-4 w-4 md:h-5 md:w-5" /> : <Lock className="h-4 w-4 md:h-5 md:w-5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="text-red-500 hover:bg-red-100 p-1 md:p-2 rounded-full transition"
                          title="Xóa người dùng"
                        >
                          <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-gray-500 text-sm md:text-base">
                      Không tìm thấy khách hàng
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length > 0 && (
            <div className="mt-4 md:mt-6">
              <Pagination
                totalRecords={filteredUsers.length}
                rowsPerPageOptions={[5, 10, 20, 50]}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Customers;
