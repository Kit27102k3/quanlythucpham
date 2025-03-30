import React, { useEffect, useState } from "react";
import { ClipboardListIcon, PackageIcon, CreditCardIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import orderApi from "../../../api/orderApi"; // Giả sử bạn có file API này
import formatCurrency  from "../../Until/FotmatPrice"; // Hàm định dạng tiền tệ

export default function Order() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderApi.getUserOrders(); // API lấy danh sách đơn hàng
        setOrders(response);
      } catch (error) {
        console.error("Lỗi khi lấy đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const statusCounts = {
    pending: orders.filter((o) => o.status === "pending").length,
    paid: orders.filter((o) => o.status === "paid").length,
    completed: orders.filter((o) => o.status === "completed").length,
  };

  if (loading) return <div className="text-center py-8">Đang tải...</div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardListIcon className="w-6 h-6 text-[#51bb1a]" />
        <h2 className="text-xl font-semibold text-gray-800 lg:text-2xl">
          ĐƠN HÀNG CỦA BẠN
        </h2>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-green-50 border-b border-green-100">
              <tr>
                {[
                  "Đơn hàng",
                  "Ngày",
                  "Địa chỉ",
                  "Giá trị đơn hàng",
                  "TT thanh toán",
                  "TT vận chuyển",
                ].map((header, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr className="text-center">
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-gray-500 bg-gray-50"
                  >
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <PackageIcon className="w-12 h-12 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Không có đơn hàng nào.
                      </p>
                      <button
                        onClick={() => navigate("/products")}
                        className="px-4 py-2 bg-[#51bb1a] text-white rounded-md hover:bg-[#51bb1a] transition-colors"
                      >
                        Bắt đầu mua sắm
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/orders/${order._id}`)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {order.shippingInfo.address}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          order.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.status === "paid"
                          ? "Đã thanh toán"
                          : "Chưa thanh toán"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          order.status === "completed"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {getShippingStatus(order.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <OrderStatusCard
          icon={<PackageIcon className="w-6 h-6 text-blue-600" />}
          title="Đang xử lý"
          count={statusCounts.pending}
        />
        <OrderStatusCard
          icon={<CreditCardIcon className="w-6 h-6 text-[#51bb1a]" />}
          title="Đã thanh toán"
          count={statusCounts.paid}
        />
        <OrderStatusCard
          icon={<ClipboardListIcon className="w-6 h-6 text-purple-600" />}
          title="Hoàn thành"
          count={statusCounts.completed}
        />
      </div>
    </div>
  );
}

// Helper function
function getShippingStatus(status) {
  switch (status) {
    case "pending":
      return "Đang xử lý";
    case "paid":
      return "Đang giao hàng";
    case "completed":
      return "Đã giao";
    default:
      return status;
  }
}

const OrderStatusCard = ({ icon, title, count }) => (
  <div className="bg-white shadow-md rounded-lg p-4 flex items-center justify-between hover:shadow-lg transition-shadow">
    <div className="flex items-center space-x-4">
      {icon}
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-semibold text-gray-800">{count}</p>
      </div>
    </div>
  </div>
);
