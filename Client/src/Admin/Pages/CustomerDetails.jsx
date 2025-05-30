import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { authApi } from "../../api/authApi";
import {
  Package,
  XCircle,
  CreditCard,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  ArrowLeft,
  ShoppingBag,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API_BASE_URL } from "../../config/apiConfig";
import PropTypes from "prop-types";
import { Scrollbars } from "react-custom-scrollbars-2";
import {
  ORDER_STATUSES,
  formatDate as formatOrderDate,
  formatCurrency as formatOrderCurrency,
  getStatusColor as getOrderStatusColor,
  getStatusText as getOrderStatusText,
  getStatusIcon as getOrderStatusIcon,
  getPaymentMethodText,
} from "../../Admin/Pages/Orders/OrderHelpers";
import { ViewOrderDialog } from "../../Admin/Pages/Orders/OrderDialogs";

function CustomerDetails() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authApi.getUserById(id);
        setUser(res.data);
        toast.success("Đã tải thông tin khách hàng");
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        setError("Không thể tải thông tin người dùng.");
        toast.error("Không thể tải thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };

    const fetchOrders = async () => {
      setOrderLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/orders/user?userId=${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
        setOrders(response.data || []);
      } catch (error) {
        console.error("Lỗi khi lấy đơn hàng:", error);
        toast.error("Không thể tải đơn hàng của khách hàng");
      } finally {
        setOrderLoading(false);
      }
    };

    if (id) {
      fetchUser();
      fetchOrders();
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

  // Format date to Vietnamese format
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Format currency to Vietnamese format
  const formatCurrency = (amount) => {
    if (!amount) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Get status color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "shipping":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status text based on status
  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "preparing":
        return "Đang chuẩn bị";
      case "packaging":
        return "Đang đóng gói";
      case "shipping":
        return "Đang giao hàng";
      case "completed":
        return "Hoàn thành";
      case "cancelled":
        return "Đã hủy";
      case "delivery_failed":
        return "Giao hàng thất bại";
      default:
        return "Không xác định";
    }
  };

  // Thêm hàm để hiển thị dialog chi tiết đơn hàng
  const handleViewOrder = (order) => {
    setViewOrder(order);
  };

  // Hàm mở dialog cập nhật trạng thái đơn hàng
  const openUpdateStatusDialog = (order) => {
    // Giữ lại để ViewOrderDialog không báo lỗi
    console.log("Chức năng cập nhật trạng thái đơn hàng:", order);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/admin/customers"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" /> Quay lại danh sách
        </Link>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
            <h1 className="text-2xl font-bold">Thông tin khách hàng</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            <div className="md:col-span-1">
              <div className="flex flex-col items-center bg-gray-50 p-6 rounded-lg border border-gray-100">
                <img
                  src={
                    user.userImage || "https://www.gravatar.com/avatar/?d=mp"
                  }
                  alt="Avatar"
                  className="rounded-full w-32 h-32 object-cover border-4 border-white shadow-md"
                />
                <h2 className="mt-4 text-xl font-semibold text-gray-800">
                  {`${user.firstName} ${user.lastName}`}
                </h2>
                <p className="text-gray-500 text-sm">
                  {user.userName ? `@${user.userName}` : ""}
                </p>

                <div className="w-full mt-6 space-y-3">
                  <div className="flex items-center text-gray-700">
                    <User size={18} className="mr-2 text-blue-500" />
                    <span className="text-sm">
                      {user.userName || "Chưa có tên người dùng"}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Phone size={18} className="mr-2 text-blue-500" />
                    <span className="text-sm">
                      {user.phone || "Chưa có số điện thoại"}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Mail size={18} className="mr-2 text-blue-500" />
                    <span className="text-sm">
                      {user.email || "Chưa có email"}
                    </span>
                  </div>
                  <div className="flex items-start text-gray-700">
                    <MapPin
                      size={18}
                      className="mr-2 mt-1 text-blue-500 flex-shrink-0"
                    />
                    <span className="text-sm">
                      {user.addresses && user.addresses.length > 0
                        ? user.addresses.map((addr, index) => (
                            <div key={index} className="mb-2">
                              <div className="font-medium">
                                {addr.label || "Địa chỉ chính"}
                              </div>
                              <div>{addr.fullAddress || "Chưa có địa chỉ"}</div>
                            </div>
                          ))
                        : "Chưa có địa chỉ"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 mt-4">
                <h3 className="font-medium text-gray-800 mb-4 flex items-center">
                  <Calendar size={18} className="mr-2 text-blue-500" />
                  Thông tin tài khoản
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">
                      Ngày tham gia:
                    </span>
                    <span className="text-sm font-medium">
                      {formatDate(user.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Trạng thái:</span>
                    <span
                      className={`text-sm font-medium ${
                        user.isBlocked ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {user.isBlocked ? "Đã khóa" : "Đang hoạt động"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">
                      Đăng nhập gần đây:
                    </span>
                    <span className="text-sm font-medium">
                      {formatDate(user.lastLogin)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="bg-white rounded-lg">
                <CustomerTabs
                  orders={orders}
                  loading={orderLoading}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                  handleViewOrder={handleViewOrder}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Thêm ViewOrderDialog */}
      <ViewOrderDialog
        viewOrder={viewOrder}
        setViewOrder={setViewOrder}
        formatCurrency={formatOrderCurrency}
        formatDate={formatOrderDate}
        getStatusColor={getOrderStatusColor}
        getStatusText={getOrderStatusText}
        getStatusIcon={getOrderStatusIcon}
        getPaymentMethodText={getPaymentMethodText}
        ORDER_STATUSES={ORDER_STATUSES}
        openUpdateStatusDialog={openUpdateStatusDialog}
      />
    </div>
  );
}

// Định nghĩa TabButton component riêng biệt
const TabButton = ({
  children,
  icon: Icon,
  tab,
  activeTab,
  onClick,
  count,
}) => (
  <button
    className={`flex items-center px-4 py-3 font-medium text-sm border-b-2 ${
      activeTab === tab
        ? "border-blue-500 text-blue-600"
        : "border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-200"
    }`}
    onClick={() => onClick(tab)}
  >
    <Icon size={18} className="mr-2" />
    <span>{children}</span>
    {count !== undefined && (
      <span
        className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
          activeTab === tab
            ? "bg-blue-100 text-blue-800"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

TabButton.propTypes = {
  children: PropTypes.node.isRequired,
  icon: PropTypes.elementType.isRequired,
  tab: PropTypes.string.isRequired,
  activeTab: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  count: PropTypes.number,
};

const CustomerTabs = ({
  orders,
  loading,
  formatDate,
  formatCurrency,
  getStatusColor,
  getStatusText,
  handleViewOrder,
}) => {
  const [activeTab, setActiveTab] = useState("all");

  // Filter orders based on active tab
  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true;
    if (activeTab === "completed") return order.status === "completed";
    if (activeTab === "cancelled") return order.status === "cancelled";
    if (activeTab === "paid") return order.isPaid;
    return true;
  });

  // Count orders for each tab
  const orderCounts = {
    all: orders.length,
    completed: orders.filter((order) => order.status === "completed").length,
    cancelled: orders.filter((order) => order.status === "cancelled").length,
    paid: orders.filter((order) => order.isPaid).length,
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex border-b overflow-x-auto">
        <TabButton
          tab="all"
          activeTab={activeTab}
          onClick={setActiveTab}
          icon={ShoppingBag}
          count={orderCounts.all}
        >
          Tất cả đơn hàng
        </TabButton>
        <TabButton
          tab="completed"
          activeTab={activeTab}
          onClick={setActiveTab}
          icon={Package}
          count={orderCounts.completed}
        >
          Đơn hoàn thành
        </TabButton>
        <TabButton
          tab="cancelled"
          activeTab={activeTab}
          onClick={setActiveTab}
          icon={XCircle}
          count={orderCounts.cancelled}
        >
          Đơn đã hủy
        </TabButton>
        <TabButton
          tab="paid"
          activeTab={activeTab}
          onClick={setActiveTab}
          icon={CreditCard}
          count={orderCounts.paid}
        >
          Đơn đã thanh toán
        </TabButton>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
            <p>
              Không có đơn hàng nào
              {activeTab !== "all" ? ` trong mục ${activeTab}` : ""}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Scrollbars style={{ width: "100%", height: "550px" }}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Mã đơn
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Ngày đặt
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Trạng thái
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Thanh toán
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Tổng tiền
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        #{order._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.isPaid
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {order.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          onClick={() => handleViewOrder(order)}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        >
                          <Eye size={16} className="mr-1" />
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Scrollbars>
          </div>
        )}
      </div>
    </div>
  );
};

CustomerTabs.propTypes = {
  orders: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  formatDate: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  getStatusColor: PropTypes.func.isRequired,
  getStatusText: PropTypes.func.isRequired,
  handleViewOrder: PropTypes.func.isRequired
};

export default CustomerDetails;
