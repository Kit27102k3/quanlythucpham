/* eslint-disable no-unused-vars */
// Các hằng số
export const ORDER_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  PACKAGING: "packaging",
  SHIPPING: "shipping",
  SORTING_FACILITY: "sorting_facility",
  DELIVERING: "delivering",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  DELIVERY_FAILED: "delivery_failed",
  AWAITING_PAYMENT: "awaiting_payment",
};

// Các options cho dropdown
export const statusFilterOptions = [
  { label: "Tất cả", value: "all" },
  { label: "Chờ xử lý", value: "pending" },
  { label: "Đã xác nhận", value: "confirmed" },
  { label: "Đang chuẩn bị", value: "preparing" },
  { label: "Đã đóng gói", value: "packaging" },
  { label: "Đang vận chuyển", value: "shipping" },
  { label: "Chuyển đến kho phân loại", value: "sorting_facility" },
  { label: "Đang giao hàng", value: "delivering" },
  { label: "Đã giao hàng", value: "delivered" },
  { label: "Đã hoàn thành", value: "completed" },
  { label: "Đã hủy", value: "cancelled" },
  { label: "Giao thất bại", value: "delivery_failed" },
  { label: "Chờ thanh toán", value: "awaiting_payment" },
];

// Options cho bulk actions
export const bulkActionOptions = [
  { label: "Xác nhận đơn hàng", value: "confirmed" },
  { label: "Đang chuẩn bị", value: "preparing" },
  { label: "Đã đóng gói", value: "packaging" },
  { label: "Đang vận chuyển", value: "shipping" },
  { label: "Chuyển đến kho phân loại", value: "sorting_facility" },
  { label: "Đang giao hàng", value: "delivering" },
  { label: "Đã giao hàng", value: "delivered" },
  { label: "Hoàn thành", value: "completed" },
  { label: "Hủy đơn hàng", value: "cancelled" },
];

// Styles cho dropdown
export const dropdownStyles = {
  statusDropdownPanelStyle: {
    className:
      "p-2 border border-gray-200 bg-white rounded-xl shadow-lg animate-dropdown w-full max-h-80 overflow-y-auto",
  },
  statusDropdownItemStyle: {
    className:
      "p-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg my-1 cursor-pointer transition-colors",
  },
  statusDropdownHeaderStyle: {
    className:
      "p-3 font-medium text-gray-700 bg-gray-50 border-b border-gray-200",
  },
};

// Helper functions
export const getCustomerName = (order) => {
  if (order.userId && order.userId.fullName) {
    return order.userId.fullName;
  } else if (order.shippingInfo && order.shippingInfo.fullName) {
    return order.shippingInfo.fullName;
  } else {
    return "Khách hàng ẩn danh";
  }
};

export const formatDate = (dateString) => {
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

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export const getStatusColor = (status) => {
  switch (status) {
    case ORDER_STATUSES.PENDING:
      return "bg-blue-100 text-blue-800";
    case ORDER_STATUSES.CONFIRMED:
      return "bg-indigo-100 text-indigo-800";
    case ORDER_STATUSES.PREPARING:
      return "bg-purple-100 text-purple-800";
    case ORDER_STATUSES.PACKAGING:
      return "bg-pink-100 text-pink-800";
    case ORDER_STATUSES.SHIPPING:
      return "bg-yellow-100 text-yellow-800";
    case ORDER_STATUSES.SORTING_FACILITY:
      return "bg-teal-100 text-teal-800";
    case ORDER_STATUSES.DELIVERING:
      return "bg-orange-100 text-orange-800";
    case ORDER_STATUSES.DELIVERED:
      return "bg-green-100 text-green-800";
    case ORDER_STATUSES.COMPLETED:
      return "bg-green-100 text-green-800";
    case ORDER_STATUSES.CANCELLED:
      return "bg-red-100 text-red-800";
    case ORDER_STATUSES.DELIVERY_FAILED:
      return "bg-red-100 text-red-800";
    case ORDER_STATUSES.AWAITING_PAYMENT:
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getStatusText = (status) => {
  switch (status) {
    case ORDER_STATUSES.PENDING:
      return "Chờ xử lý";
    case ORDER_STATUSES.CONFIRMED:
      return "Đã xác nhận";
    case ORDER_STATUSES.PREPARING:
      return "Đang chuẩn bị";
    case ORDER_STATUSES.PACKAGING:
      return "Đã đóng gói";
    case ORDER_STATUSES.SHIPPING:
      return "Đang vận chuyển";
    case ORDER_STATUSES.SORTING_FACILITY:
      return "Chuyển đến kho phân loại";
    case ORDER_STATUSES.DELIVERING:
      return "Đang giao hàng";
    case ORDER_STATUSES.DELIVERED:
      return "Đã giao hàng";
    case ORDER_STATUSES.COMPLETED:
      return "Đã hoàn thành";
    case ORDER_STATUSES.CANCELLED:
      return "Đã hủy";
    case ORDER_STATUSES.DELIVERY_FAILED:
      return "Giao thất bại";
    case ORDER_STATUSES.AWAITING_PAYMENT:
      return "Chờ thanh toán";
    default:
      return "Không xác định";
  }
};

export const getStatusIcon = (status) => {
  switch (status) {
    case ORDER_STATUSES.PENDING:
      return (
        <i
          className="pi pi-clock mr-1 text-yellow-600"
          style={{ fontSize: "0.9rem" }}
        ></i>
      );
    case ORDER_STATUSES.CONFIRMED:
      return (
        <i
          className="pi pi-check-circle mr-1 text-blue-600"
          style={{ fontSize: "0.9rem" }}
        ></i>
      );
    case ORDER_STATUSES.PREPARING:
      return (
        <i
          className="pi pi-box mr-1 text-indigo-600"
          style={{ fontSize: "0.9rem" }}
        ></i>
      );
    case ORDER_STATUSES.PACKAGING:
      return (
        <i
          className="pi pi-gift mr-1 text-purple-600"
          style={{ fontSize: "0.9rem" }}
        ></i>
      );
    case ORDER_STATUSES.SHIPPING:
      return (
        <i
          className="pi pi-send mr-1 text-sky-600"
          style={{ fontSize: "0.9rem" }}
        ></i>
      );
    case ORDER_STATUSES.SORTING_FACILITY:
      return (
        <i
          className="pi pi-building mr-1 text-teal-600"
          style={{ fontSize: "0.9rem" }}
        ></i>
      );
    case ORDER_STATUSES.DELIVERING:
      return (
        <i
          className="pi pi-truck mr-1 text-cyan-600"
          style={{ fontSize: "0.9rem" }}
        ></i>
      );
    case ORDER_STATUSES.DELIVERED:
      return (
        <i
          className="pi pi-check mr-1 text-green-600"
          style={{ fontSize: "0.9rem" }}
        ></i>
      );
    case ORDER_STATUSES.COMPLETED:
      return (
        <i
          className="pi pi-check mr-1 text-green-600"
          style={{ fontSize: "0.9rem" }}
        ></i>
      );
    case ORDER_STATUSES.CANCELLED:
      return (
        <i
          className="pi pi-times mr-1 text-red-600"
          style={{ fontSize: "0.9rem" }}
        ></i>
      );
    case ORDER_STATUSES.DELIVERY_FAILED:
      return (
        <i
          className="pi pi-exclamation-circle mr-1 text-orange-600"
          style={{ fontSize: "0.9rem" }}
        ></i>
      );
    case ORDER_STATUSES.AWAITING_PAYMENT:
      return (
        <i
          className="pi pi-wallet mr-1 text-amber-600"
          style={{ fontSize: "0.9rem" }}
        ></i>
      );
    default:
      return (
        <i
          className="pi pi-question-circle mr-1"
          style={{ fontSize: "0.9rem" }}
        ></i>
      );
  }
};

export const getPaymentMethodText = (method) => {
  if (!method) return "Không xác định";

  switch (method.toLowerCase()) {
    case "cod":
      return "Thanh toán khi nhận hàng (COD)";
    case "card":
      return "Thẻ tín dụng/ghi nợ";
    case "banking":
      return "Chuyển khoản ngân hàng";
    case "wallet":
      return "Ví điện tử";
    case "momo":
      return "Ví MoMo";
    case "zalopay":
      return "ZaloPay";
    default:
      return method;
  }
};
export const getNextStatuses = (currentStatus, isPaid) => {
  let nextStatuses = [];

  switch (currentStatus) {
    case ORDER_STATUSES.PENDING:
      nextStatuses = [
        { value: ORDER_STATUSES.CONFIRMED, label: "Xác nhận đơn hàng" },
        { value: ORDER_STATUSES.CANCELLED, label: "Hủy đơn hàng" },
      ];
      break;
    case ORDER_STATUSES.CONFIRMED:
      nextStatuses = [
        { value: ORDER_STATUSES.PREPARING, label: "Đang chuẩn bị hàng" },
        { value: ORDER_STATUSES.CANCELLED, label: "Hủy đơn hàng" },
      ];
      break;
    case ORDER_STATUSES.PREPARING:
      nextStatuses = [
        { value: ORDER_STATUSES.PACKAGING, label: "Đã đóng gói" },
        { value: ORDER_STATUSES.CANCELLED, label: "Hủy đơn hàng" },
      ];
      break;
    case ORDER_STATUSES.PACKAGING:
      nextStatuses = [
        { value: ORDER_STATUSES.SHIPPING, label: "Đang vận chuyển" },
      ];
      break;
    case ORDER_STATUSES.SHIPPING:
      nextStatuses = [
        { value: ORDER_STATUSES.SORTING_FACILITY, label: "Chuyển đến kho phân loại" },
        { value: ORDER_STATUSES.CANCELLED, label: "Hủy đơn hàng" },
      ];
      break;
    case ORDER_STATUSES.SORTING_FACILITY:
      nextStatuses = [
        { value: ORDER_STATUSES.DELIVERING, label: "Đang giao hàng" },
        { value: ORDER_STATUSES.CANCELLED, label: "Hủy đơn hàng" },
      ];
      break;
    case ORDER_STATUSES.DELIVERING:
      nextStatuses = [
        { value: ORDER_STATUSES.DELIVERED, label: "Đã giao hàng" },
        { value: ORDER_STATUSES.DELIVERY_FAILED, label: "Giao hàng thất bại" },
      ];
      break;
    case ORDER_STATUSES.DELIVERED:
      nextStatuses = [
        { value: ORDER_STATUSES.COMPLETED, label: "Hoàn thành đơn hàng" },
      ];
      break;
    case ORDER_STATUSES.DELIVERY_FAILED:
      nextStatuses = [
        { value: ORDER_STATUSES.DELIVERING, label: "Giao lại" },
        { value: ORDER_STATUSES.CANCELLED, label: "Hủy đơn hàng" },
      ];
      break;
    case ORDER_STATUSES.AWAITING_PAYMENT:
      nextStatuses = [
        { value: ORDER_STATUSES.CONFIRMED, label: "Đã thanh toán" },
        { value: ORDER_STATUSES.CANCELLED, label: "Hủy đơn hàng" },
      ];
      break;
    default:
      nextStatuses = [];
  }

  return nextStatuses;
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;

  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};
