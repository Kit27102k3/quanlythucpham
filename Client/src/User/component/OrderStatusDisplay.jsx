// Hàm xác định trạng thái thanh toán
const isOrderPaid = (order) => {
  // Kiểm tra nhiều trường khác nhau để xác định đã thanh toán
  return (
    order.isPaid === true || 
    order.paymentStatus === 'completed' ||
    order.status === 'processing' ||
    order.status === 'shipped' ||
    order.status === 'delivered' ||
    order.status === 'shipping' ||
    order.status === 'delivering' ||
    order.status === 'completed'
  );
};

// Hàm dịch trạng thái từ tiếng Anh sang tiếng Việt
export const translateStatus = (status) => {
  switch (status) {
    case "pending":
      return "Chờ xử lý";
    case "confirmed":
      return "Đã xác nhận";
    case "processing":
      return "Đang xử lý";
    case "preparing":
      return "Đang chuẩn bị hàng";
    case "packaging":
      return "Hoàn tất đóng gói";
    case "shipping":
      return "Đang vận chuyển";
    case "shipped":
      return "Đã giao cho vận chuyển";
    case "delivering":
      return "Đang giao hàng";
    case "delivered":
      return "Đã giao hàng";
    case "completed":
      return "Hoàn thành";
    case "paid":
      return "Đã thanh toán";
    case "cancelled":
      return "Đã hủy";
    case "awaiting_payment":
      return "Chờ thanh toán";
    case "refunded":
      return "Đã hoàn tiền";
    case "failed":
      return "Thất bại";
    case "delivery_failed":
      return "Giao hàng thất bại";
    case "collected":
      return "Đã lấy hàng";
    case "accepted":
      return "Đã nhận đơn";
    case "on_the_way":
    case "in_transit":
      return "Đang giao hàng";
    case "ready_for_pickup":
      return "Sẵn sàng nhận hàng";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  }
};

// Hàm hiển thị trạng thái thanh toán
const PaymentStatus = ({ order }) => {
  const isPaid = isOrderPaid(order);
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs ${isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
      {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
    </span>
  );
};

// Hàm hiển thị trạng thái đơn hàng
const OrderStatus = ({ status }) => {
  const translatedStatus = translateStatus(status);
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(status)}`}>
      {translatedStatus}
    </span>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'bg-purple-100 text-purple-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'delivering':
    case 'shipped':
    case 'shipping':
      return 'bg-indigo-100 text-indigo-800';
    case 'processing':
    case 'preparing':
    case 'packaging':
      return 'bg-blue-100 text-blue-800';
    case 'awaiting_payment':
      return 'bg-orange-100 text-orange-800';
    case 'delivery_failed':
      return 'bg-red-100 text-red-800';
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export { isOrderPaid, PaymentStatus, OrderStatus }; 