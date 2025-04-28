// Hàm xác định trạng thái thanh toán
const isOrderPaid = (order) => {
  // Kiểm tra nhiều trường khác nhau để xác định đã thanh toán
  return (
    order.isPaid === true || 
    order.paymentStatus === 'completed' ||
    order.status === 'processing' ||
    order.status === 'shipped' ||
    order.status === 'delivered'
  );
};

// Hàm dịch trạng thái từ tiếng Anh sang tiếng Việt
const translateStatus = (status) => {
  const statusMap = {
    'pending': 'Chờ xử lý',
    'processing': 'Đang chuẩn bị hàng',
    'shipped': 'Đang giao',
    'delivered': 'Đã giao',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy',
    'awaiting_payment': 'Chờ thanh toán'
  };
  
  return statusMap[status] || status;
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
      return 'bg-indigo-100 text-indigo-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'awaiting_payment':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export { isOrderPaid, PaymentStatus, OrderStatus, translateStatus }; 