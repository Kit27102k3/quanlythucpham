import { memo } from "react";
import PropTypes from "prop-types";

// Memoized Order Stats Component
const OrderStats = memo(({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Tổng đơn hàng */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Tổng đơn hàng</p>
            <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
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
            <h3 className="text-2xl font-bold mt-1">{stats.pending}</h3>
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
            <h3 className="text-2xl font-bold mt-1">{stats.preparing}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <i className="pi pi-box text-blue-500"></i>
          </div>
        </div>
      </div>
      
      {/* Đang giao */}
      <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-600 text-sm">Đang giao</p>
            <h3 className="text-2xl font-bold mt-1">{stats.shipping}</h3>
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
            <h3 className="text-2xl font-bold mt-1">{stats.completed}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <i className="pi pi-check-circle text-green-500"></i>
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
    pending: PropTypes.number.isRequired,
    preparing: PropTypes.number.isRequired,
    shipping: PropTypes.number.isRequired,
    completed: PropTypes.number.isRequired
  }).isRequired
};

OrderStats.displayName = "OrderStats";

export default OrderStats;
