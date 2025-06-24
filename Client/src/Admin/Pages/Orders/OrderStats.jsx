import { memo } from "react";
import PropTypes from "prop-types";

// Memoized Order Stats Component
const OrderStats = memo(({ stats }) => {
  // Tổng đơn hàng lấy trực tiếp từ props stats.total (orders.length)
  const displayTotal = stats.total;
  
  // Đảm bảo các giá trị là số
  const delivered = typeof stats.delivered === 'number' ? stats.delivered : 0;
  const deliveredAndPaid = typeof stats.deliveredAndPaid === 'number' ? stats.deliveredAndPaid : 0;
  const completedStatus = typeof stats.completed === 'number' ? stats.completed : 0;
  
  // Tính toán số lượng cho từng box
  const pendingOrders = stats.pending || 0;
  const preparingOrders = (stats.preparing || 0) + (stats.confirmed || 0) + (stats.packaging || 0);
  const shippingOrders = (stats.shipping || 0) + (stats.delivering || 0) + (stats.sorting_facility || 0);
  
  // Đơn hàng delivered nhưng chưa thanh toán
  const deliveredNotPaid = Math.max(0, delivered - deliveredAndPaid); // Đảm bảo không âm
  
  // Đơn hàng đã hoàn thành = completed + (delivered & đã thanh toán)
  // Đơn hàng được coi là hoàn thành khi:
  // 1. Có trạng thái "completed" HOẶC
  // 2. Có trạng thái "delivered" VÀ đã thanh toán
  // Đơn hàng delivered và đã thanh toán được tính là hoàn thành
  const completedOrders = completedStatus + deliveredAndPaid;

  // Đơn hàng đã hủy
  const cancelledOrders = stats.cancelled || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* Hàng 1 */}
      {/* Tổng đơn hàng */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Tổng đơn hàng</p>
            <h3 className="text-2xl font-bold mt-1">{displayTotal}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <i className="pi pi-shopping-cart text-blue-500"></i>
          </div>
        </div>
      </div>
      
      {/* Chờ xử lý */}
      <div className="bg-white rounded-xl border border-yellow-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-yellow-600 text-sm">Chờ xử lý</p>
            <h3 className="text-2xl font-bold mt-1">{pendingOrders}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <i className="pi pi-clock text-yellow-500"></i>
          </div>
        </div>
      </div>
      
      {/* Đang chuẩn bị */}
      <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-600 text-sm">Đang chuẩn bị</p>
            <h3 className="text-2xl font-bold mt-1">{preparingOrders}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <i className="pi pi-box text-blue-500"></i>
          </div>
        </div>
      </div>
      
      {/* Hàng 2 */}
      {/* Đang giao */}
      <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-600 text-sm">Đang giao</p>
            <h3 className="text-2xl font-bold mt-1">{shippingOrders + deliveredNotPaid}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <i className="pi pi-send text-purple-500"></i>
          </div>
        </div>
      </div>
      
      {/* Hoàn thành */}
      <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-600 text-sm">Hoàn thành</p>
            <h3 className="text-2xl font-bold mt-1">{completedOrders}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <i className="pi pi-check-circle text-green-500"></i>
          </div>
        </div>
      </div>
      
      {/* Đã hủy */}
      <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-600 text-sm">Đã hủy</p>
            <h3 className="text-2xl font-bold mt-1">{cancelledOrders}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <i className="pi pi-times-circle text-red-500"></i>
          </div>
        </div>
      </div>
    </div>
  );
});

// Thêm PropTypes để xác thực props
OrderStats.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    pending: PropTypes.number,
    confirmed: PropTypes.number,
    preparing: PropTypes.number,
    packaging: PropTypes.number,
    shipping: PropTypes.number,
    delivering: PropTypes.number,
    sorting_facility: PropTypes.number,
    completed: PropTypes.number,
    cancelled: PropTypes.number,
    delivery_failed: PropTypes.number,
    awaiting_payment: PropTypes.number,
    delivered: PropTypes.number,
    deliveredAndPaid: PropTypes.number
  }).isRequired
};

OrderStats.displayName = "OrderStats";

export default OrderStats;
