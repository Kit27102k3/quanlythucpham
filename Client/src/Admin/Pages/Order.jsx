import React, { useState } from "react";
import {
  EyeOpenIcon,
  TrashIcon,
  MagnifyingGlassIcon,

} from "@radix-ui/react-icons";

// Mock data for orders
const initialOrders = [
  {
    id: "ODR-001",
    customerName: "Nguyễn Văn A",
    totalAmount: 1250000,
    status: "Đang xử lý",
    date: "2024-03-26",
    items: 3,
  },
  {
    id: "ODR-002",
    customerName: "Trần Thị B",
    totalAmount: 2350000,
    status: "Đã giao",
    date: "2024-03-25",
    items: 5,
  },
  {
    id: "ODR-003",
    customerName: "Lê Văn C",
    totalAmount: 980000,
    status: "Hủy",
    date: "2024-03-24",
    items: 2,
  },
];

const OrderAdmin = () => {
  const [orders, setOrders] = useState(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tất cả");

  const getStatusColor = (status) => {
    switch (status) {
      case "Đang xử lý":
        return "text-yellow-600 bg-yellow-100";
      case "Đã giao":
        return "text-green-600 bg-green-100";
      case "Hủy":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(
    (order) =>
      (filterStatus === "Tất cả" || order.status === filterStatus) &&
      (order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewOrder = (orderId) => {
    alert(`Xem chi tiết đơn hàng ${orderId}`);
  };

  const handleDeleteOrder = (orderId) => {
    setOrders(orders.filter((order) => order.id !== orderId));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-md rounded-lg">
        <div className="p-6 border-b flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Đơn hàng</h1>

          <div className="flex items-center space-x-4 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm đơn hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-3 text-gray-400" />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="Đang xử lý">Đang xử lý</option>
              <option value="Đã giao">Đã giao</option>
              <option value="Hủy">Đã hủy</option>
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
                <th className="p-4 text-left">Số lượng</th>
                <th className="p-4 text-left">Tổng tiền</th>
                <th className="p-4 text-left">Ngày</th>
                <th className="p-4 text-left">Trạng thái</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 font-medium">{order.id}</td>
                  <td className="p-4">{order.customerName}</td>
                  <td className="p-4">{order.items} sản phẩm</td>
                  <td className="p-4">
                    {order.totalAmount.toLocaleString()} đ
                  </td>
                  <td className="p-4">{order.date}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleViewOrder(order.id)}
                        className="text-blue-600 hover:bg-blue-100 p-2 rounded-full"
                        title="Xem chi tiết"
                      >
                        <EyeOpenIcon />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-600 hover:bg-red-100 p-2 rounded-full"
                        title="Xóa đơn hàng"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination or No Results */}
        {filteredOrders.length === 0 && (
          <div className="text-center p-8 text-gray-500">
            Không có đơn hàng nào phù hợp
          </div>
        )}

        {/* Footer with summary */}
        <div className="p-6 bg-gray-50 flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">
              Tổng số đơn hàng: {filteredOrders.length}
            </span>
          </div>
          <div className="flex space-x-2">
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
