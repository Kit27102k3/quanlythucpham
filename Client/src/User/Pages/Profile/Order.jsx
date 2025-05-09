/* eslint-disable react/prop-types */
import { useEffect, useState, useCallback } from "react";
import { ClipboardListIcon, PackageIcon, CreditCardIcon, XCircleIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import orderApi from "../../../api/orderApi"; // Giả sử bạn có file API này
import formatCurrency from "../../Until/FotmatPrice"; // Hàm định dạng tiền tệ
import { toast } from "sonner";
import { translateStatus } from "../../component/OrderStatusDisplay"; // Import hàm dịch trạng thái

// Hàm kiểm tra trạng thái thanh toán
const isOrderPaid = (order) => {
  return (
    order.isPaid === true || 
    order.paymentStatus === 'completed' ||
    order.status === 'confirmed' ||
    order.status === 'preparing' ||
    order.status === 'packaging' ||
    order.status === 'shipping' ||
    order.status === 'processing' ||
    order.status === 'shipped' ||
    order.status === 'delivering' ||
    order.status === 'delivered' ||
    order.status === 'completed'
  );
};

export default function Order() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const navigate = useNavigate();

  // Tạo hàm fetchOrders với useCallback để có thể sử dụng trong useEffect và các event handlers
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      // Lấy userId của người dùng hiện tại
      const currentUserId = localStorage.getItem("userId");
      if (!currentUserId) {
        toast.error("Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại.");
        setTimeout(() => navigate("/dang-nhap"), 2000);
        setLoading(false);
        return;
      }
      
      const response = await orderApi.getUserOrders();
      
      // Kiểm tra và lọc đơn hàng thuộc về tài khoản hiện tại
      const filteredResponse = response.filter(order => {
        // Kiểm tra xem userId trong đơn hàng có phải là userId hiện tại không
        if (order.userId && typeof order.userId === 'object' && order.userId._id) {
          return order.userId._id === currentUserId;
        } else if (order.userId && typeof order.userId === 'string') {
          return order.userId === currentUserId;
        }
        return false;
      });
      
      // Sắp xếp đơn hàng mới nhất lên đầu
      const sortedOrders = filteredResponse.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setOrders(sortedOrders);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi lấy đơn hàng:", error);
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;

    const getOrders = async () => {
      if (!isMounted) return;
      await fetchOrders();
    };

    getOrders();

    // Thiết lập interval để cập nhật trạng thái đơn hàng mỗi 15 giây
    const intervalId = setInterval(() => {
      if (isMounted) {
        fetchOrders();
      }
    }, 15000); // 15 giây cập nhật một lần

    // Cleanup function
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [fetchOrders]);

  // Filter out awaiting_payment orders (SePay payments not yet completed)
  const filteredOrders = orders.filter(order => 
    !(order.status === "awaiting_payment" && order.paymentMethod === "sepay")
  );
  
  // Get pending SePay payments separately
  const pendingSePayOrders = orders.filter(order => 
    order.status === "awaiting_payment" && order.paymentMethod === "sepay"
  );

  const statusCounts = {
    pending: orders.filter((o) => o.status === "pending").length,
    paid: orders.filter((o) => o.status === "paid").length,
    completed: orders.filter((o) => o.status === "completed").length,
    awaiting_payment: orders.filter((o) => o.status === "awaiting_payment").length
  };

  const handleCancelOrder = async (orderId, event) => {
    event.stopPropagation(); // Ngăn không cho event click truyền lên row
    
    if (cancelLoading) return;
    
    // Kiểm tra trạng thái đơn hàng trước khi hủy
    const order = orders.find(o => o._id === orderId);
    if (order.status === "delivering" || order.status === "completed" || order.status === "cancelled") {
      toast.error("Không thể hủy đơn hàng đang giao, đã giao hoặc đã hủy");
      return;
    }
    
    try {
      setCancelLoading(true);
      
      // Gọi API để hủy đơn hàng
      const response = await orderApi.cancelOrder(orderId);
      
      if (response && response.success) {
        // Cập nhật UI ngay lập tức
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, status: "cancelled" } 
              : order
          )
        );
        
        toast.success("Đơn hàng đã được hủy thành công");
        
        // Tải lại dữ liệu đơn hàng sau 1 giây
        setTimeout(() => {
          fetchOrders();
        }, 1000);
      } else {
        console.error("Không nhận được phản hồi thành công");
        toast.error("Không thể hủy đơn hàng. Vui lòng thử lại sau");
      }
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
      toast.error("Không thể hủy đơn hàng. Vui lòng thử lại sau");
    } finally {
      setCancelLoading(false);
    }
  };

  // Cập nhật hàm xử lý chuyển hướng để đi đến trang chi tiết đơn hàng
  const handleOrderClick = (orderId) => {
    navigate(`/tai-khoan/don-hang/${orderId}`);
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
                  "Thao tác"
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
              {filteredOrders.length === 0 ? (
                <tr className="text-center">
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-gray-500 bg-gray-50"
                  >
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <PackageIcon className="w-12 h-12 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Không có đơn hàng nào.
                      </p>
                      <button
                        onClick={() => navigate("/san-pham")}
                        className="px-4 py-2 bg-[#51bb1a] text-white rounded-md hover:bg-[#51bb1a] transition-colors"
                      >
                        Bắt đầu mua sắm
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleOrderClick(order._id)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {order.userId?.address ? (
                        <span className="line-clamp-1">
                          {order.userId.address}
                          {order.userId.ward && `, ${order.userId.ward}`}
                          {order.userId.district && `, ${order.userId.district}`}
                        </span>
                      ) : (
                        "Chưa có địa chỉ"
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                      {formatCurrency(order.totalAmount)}đ
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          isOrderPaid(order)
                            ? "bg-green-100 text-green-800"
                            : order.status === "awaiting_payment"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {isOrderPaid(order)
                          ? "Đã thanh toán"
                          : order.status === "awaiting_payment"
                          ? "Chờ thanh toán"
                          : "Chưa thanh toán"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          order.status === "completed"
                            ? "bg-purple-100 text-purple-800"
                            : order.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : order.status === "delivering"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {getShippingStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {(order.status === "pending" || order.status === "awaiting_payment") && (
                        <button
                          onClick={(e) => handleCancelOrder(order._id, e)}
                          className="text-red-500 hover:bg-red-50 px-2 py-1 rounded flex items-center gap-1 text-sm transition-colors"
                          disabled={cancelLoading}
                        >
                          <XCircleIcon className="w-4 h-4" />
                          Hủy đơn
                        </button>
                      )}
                      {order.status === "delivering" && (
                        <span className="text-gray-500 text-sm">Đơn hàng đang giao</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pendingSePayOrders.length > 0 && (
        <div className="mt-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCardIcon className="w-6 h-6 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-800">
              Đơn hàng chờ thanh toán
            </h3>
          </div>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-orange-50 border-b border-orange-100">
                  <tr>
                    {[
                      "Đơn hàng",
                      "Ngày",
                      "Giá trị đơn hàng",
                      "Hành động"
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
                  {pendingSePayOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        {formatCurrency(order.totalAmount)}đ
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/payment-qr?orderId=${order._id}`)}
                            className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition-colors"
                          >
                            Thanh toán
                          </button>
                          <button
                            onClick={(e) => handleCancelOrder(order._id, e)}
                            className="text-red-500 hover:bg-red-50 px-2 py-1 rounded flex items-center gap-1 text-sm transition-colors"
                            disabled={cancelLoading}
                          >
                            <XCircleIcon className="w-4 h-4" />
                            Hủy
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <OrderStatusCard
          icon={<PackageIcon className="w-6 h-6 text-blue-600" />}
          title="Đang xử lý"
          count={statusCounts.pending}
        />
        <OrderStatusCard
          icon={<CreditCardIcon className="w-6 h-6 text-orange-500" />}
          title="Chờ thanh toán"
          count={statusCounts.awaiting_payment}
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
  return translateStatus(status);
}

const OrderStatusCard = ({ icon, title, count }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center space-x-4">
      <div className="bg-gray-50 p-3 rounded-lg">{icon}</div>
      <div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-2xl font-bold text-[#51bb1a]">{count}</p>
      </div>
    </div>
  </div>
);
