import React, { useState, useEffect } from "react";
import {
  EyeOpenIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import authApi from "../../api/authApi";

const OrderAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndUpdateOrders = async () => {
      try {
        // Lấy danh sách đơn hàng
        const response = await fetch("http://localhost:8080/orders");
        const data = await response.json();

        // Cập nhật trạng thái cho từng đơn hàng
        const updatedOrders = await Promise.all(
          data.map(async (order) => {
            const newStatus = determineStatus(order.createdAt);

            // Nếu trạng thái thay đổi, cập nhật lên server
            if (order.status !== newStatus) {
              await updateOrderStatus(order._id, newStatus);
              return { ...order, status: newStatus };
            }
            return order;
          })
        );

        // Sắp xếp theo ngày tạo mới nhất
        const sortedOrders = updatedOrders.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setOrders(sortedOrders);
      } catch (error) {
        console.error("Lỗi khi xử lý đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndUpdateOrders();

    // Kiểm tra cập nhật mỗi giờ
    const interval = setInterval(fetchAndUpdateOrders, 3600000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "completed":
        return "text-green-600 bg-green-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Đang xử lý";
      case "completed":
        return "Đã giao";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

 
  const handleViewOrder = (orderId) => {
    console.log("Xem đơn hàng:", orderId);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await fetch(`http://localhost:8080/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
    }
  };

  const determineStatus = (createdAt) => {
    const now = new Date();
    const orderDate = new Date(createdAt);
    const hoursDiff = (now - orderDate) / (1000 * 60 * 60);

    if (hoursDiff < 24) return "pending";
    if (hoursDiff < 48) return "shipping";
    return "completed";
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      // Gọi API xóa đơn hàng
      await fetch(`http://localhost:3001/orders/${orderId}`, {
        method: "DELETE",
      });

      // Cập nhật state
      setOrders(orders.filter((order) => order._id !== orderId));
    } catch (error) {
      console.error("Lỗi khi xóa đơn hàng:", error);
    }
  };

  const getCustomerName = (order) => {
    if (order.userId?.firstName && order.userId?.lastName) {
      return `${order.userId.firstName} ${order.userId.lastName}`;
    }
    if (order.userId?.userName) {
      return order.userId.userName;
    }
    if (order.shippingInfo?.phone) {
      return `Khách ${order.shippingInfo.phone}`;
    }
    return "Khách vãng lai";
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "numeric", day: "numeric" };
    return new Date(dateString).toLocaleDateString("vi-VN", options);
  };

  const filteredOrders = orders.filter((order) => {
    const customerName = getCustomerName(order).toLowerCase();
    const matchesSearch =
      order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "Tất cả" ||
      (filterStatus === "Đang xử lý" && order.status === "pending") ||
      (filterStatus === "Đã giao" && order.status === "completed") ||
      (filterStatus === "Đã hủy" && order.status === "cancelled");

    return matchesSearch && matchesStatus;
  });


  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">Đang tải đơn hàng...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-md rounded-lg">
        <div className="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Đơn hàng</h1>

          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Tìm kiếm đơn hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-3 text-gray-400" />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="Đang xử lý">Đang xử lý</option>
              <option value="Đã giao">Đã giao</option>
              <option value="Đã hủy">Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Order Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-4 text-left">Mã Đơn hàng</th>
                <th className="p-4 text-left">Khách hàng</th>
                <th className="p-4 text-left">Sản phẩm</th>
                <th className="p-4 text-left">Tổng tiền</th>
                <th className="p-4 text-left">Ngày đặt</th>
                <th className="p-4 text-left">Trạng thái</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4 font-medium">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="p-4">
                      {getCustomerName(order)}{" "}
                      {order.userId && (
                        <span className="text-gray-500">
                          ({order.userId.email})
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {order.products?.length || 0} sản phẩm
                    </td>
                    <td className="p-4">
                      {order.totalAmount?.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="p-4">{formatDate(order.createdAt)}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleViewOrder(order._id)}
                          className="text-blue-600 hover:bg-blue-100 p-2 rounded-full"
                          title="Xem chi tiết"
                        >
                          <EyeOpenIcon />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order._id)}
                          className="text-red-600 hover:bg-red-100 p-2 rounded-full"
                          title="Xóa đơn hàng"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-gray-500">
                    Không có đơn hàng nào phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with summary */}
        <div className="p-6 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span className="text-sm text-gray-600">
              Hiển thị {filteredOrders.length} trong tổng số {orders.length} đơn
              hàng
            </span>
          </div>
          <div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Xuất báo cáo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderAdmin;
