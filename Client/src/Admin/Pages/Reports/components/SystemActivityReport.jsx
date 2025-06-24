import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { COLORS } from '../utils/reportUtils';

const SystemActivityReport = ({ 
  systemActivityData,
  exportToPDF,
  exportToExcel,
  sendReportEmail,
  exportLoading,
  setExportLoading
}) => {
  // Cập nhật khi dữ liệu thay đổi
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState({});
  const [processedData, setProcessedData] = useState(null);

  useEffect(() => {
    setLoading(true);
    
    console.log("System activity data in component:", systemActivityData);
    
    // Generate mock data regardless of input data
    const today = new Date();
    const dates = [];
    
    // Generate dates for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString('vi-VN'));
    }
    
    // Format ISO timestamp for mock data
    const formatISODate = (daysAgo, hours, minutes) => {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(hours, minutes, 0, 0);
      return date.toISOString();
    };
    
    const mockData = {
      successLogins: 45,
      failedLogins: 12,
      dataUpdates: 78,
      errors: 5,
      totalUsers: 120,
      totalProducts: 350,
      totalOrders: 230,
      registerCount: 15,
      passwordResetCount: 3,
      profileUpdateCount: 28,
      orderPlacedCount: 230,
      paymentCount: 225,
      cartUpdateCount: 50,
      reviewCount: 35,
      couponUsedCount: 42,
      viewProductCount: 1250,
      searchCount: 450,
      activityOverTime: [
        { date: dates[0], logins: 5, updates: 8, orders: 3, errors: 1 },
        { date: dates[1], logins: 7, updates: 12, orders: 5, errors: 0 },
        { date: dates[2], logins: 8, updates: 10, orders: 4, errors: 2 },
        { date: dates[3], logins: 6, updates: 15, orders: 7, errors: 0 },
        { date: dates[4], logins: 9, updates: 11, orders: 6, errors: 1 },
        { date: dates[5], logins: 5, updates: 9, orders: 2, errors: 0 },
        { date: dates[6], logins: 5, updates: 13, orders: 3, errors: 1 }
      ],
      activityLog: [
        { 
          timestamp: formatISODate(0, 9, 15), 
          user: 'admin@example.com', 
          action: 'login', 
          status: 'success', 
          ip: '::1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          details: {}
        },
        { 
          timestamp: formatISODate(0, 10, 30), 
          user: 'customer@example.com', 
          action: 'order_placed', 
          status: 'success', 
          ip: '::1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          details: { orderId: 'ORD12345', total: 583000 }
        },
        { 
          timestamp: formatISODate(1, 14, 20), 
          user: 'manager@example.com', 
          action: 'login', 
          status: 'success', 
          ip: '::1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          details: {}
        },
        { 
          timestamp: formatISODate(1, 15, 45), 
          user: 'user123@example.com', 
          action: 'login', 
          status: 'failed', 
          ip: '::1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          details: {}
        },
        { 
          timestamp: formatISODate(2, 11, 30), 
          user: 'customer@example.com', 
          action: 'cart_update', 
          status: 'success', 
          ip: '::1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          details: { productId: 'PROD789', quantity: 2 }
        }
      ]
    };
    
    // Always use mock data for now
    setProcessedData(mockData);
    setHasData(true);
    setLoading(false);
  }, [systemActivityData]);

  // Toggle details expansion
  const toggleDetails = (index) => {
    setExpandedDetails(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Format ISO date to readable format
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
    } catch (err) {
      console.error("Error formatting timestamp:", err);
      return timestamp;
    }
  };

  // Format action type to display text
  const formatAction = (action) => {
    if (!action) return "Không xác định";
    
    switch(action.toLowerCase()) {
      case 'login':
        return 'Đăng nhập';
      case 'logout':
        return 'Đăng xuất';
      case 'register':
        return 'Đăng ký';
      case 'password_reset':
        return 'Đặt lại mật khẩu';
      case 'profile_update':
        return 'Cập nhật hồ sơ';
      case 'order_placed':
        return 'Đặt đơn hàng';
      case 'payment':
        return 'Thanh toán';
      case 'cart_update':
        return 'Cập nhật giỏ hàng';
      case 'review_submitted':
        return 'Gửi đánh giá';
      case 'coupon_used':
        return 'Sử dụng mã giảm giá';
      case 'view_product':
        return 'Xem sản phẩm';
      case 'search':
        return 'Tìm kiếm';
      case 'update':
        return 'Cập nhật';
      case 'create':
        return 'Tạo mới';
      case 'delete':
        return 'Xóa';
      case 'other':
        return 'Khác';
      default:
        return action;
    }
  };

  // Format status to display text
  const formatStatus = (status) => {
    if (!status) return "Không xác định";
    
    switch(status.toLowerCase()) {
      case 'success':
        return 'Thành công';
      case 'failed':
        return 'Thất bại';
      case 'error':
        return 'Lỗi';
      case 'pending':
        return 'Đang xử lý';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  // Get status color class based on status
  const getStatusColorClass = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";
    
    switch(status.toLowerCase()) {
      case 'success':
        return "bg-green-100 text-green-800";
      case 'failed':
        return "bg-red-100 text-red-800";
      case 'error':
        return "bg-red-100 text-red-800";
      case 'pending':
        return "bg-yellow-100 text-yellow-800";
      case 'cancelled':
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format details object to readable text
  const formatDetails = (details) => {
    if (!details || typeof details !== 'object' || Object.keys(details).length === 0) {
      return null;
    }

    return (
      <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
        {Object.entries(details).map(([key, value]) => (
          <div key={key} className="grid grid-cols-2 gap-2 mb-1">
            <span className="font-medium">{key}:</span>
            <span>{typeof value === 'object' ? JSON.stringify(value) : value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-700"></div>
          <span className="ml-3 text-gray-700">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (!processedData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Báo cáo hoạt động hệ thống</h2>
        </div>
        <div className="text-center py-10 bg-gray-50 rounded-lg mb-6">
          <p className="text-lg text-gray-500">Không có dữ liệu hoạt động hệ thống</p>
          <p className="text-sm text-gray-400 mt-2">Hệ thống chưa có đủ dữ liệu để hiển thị báo cáo</p>
        </div>
      </div>
    );
  }

  return (
    <div id="system-activity-report" className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Báo cáo hoạt động hệ thống</h2>
        <div className="flex gap-2">
          <button
            onClick={() => exportToPDF('system-activity', setExportLoading)}
            disabled={exportLoading || !hasData}
            className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium flex items-center disabled:opacity-50"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất PDF
          </button>
          <button
            onClick={() => exportToExcel(processedData?.activityLog || [], 'system-activity', setExportLoading)}
            disabled={exportLoading || !hasData}
            className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-medium flex items-center disabled:opacity-50"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất Excel
          </button>
          <button
            onClick={() => sendReportEmail('system-activity', setExportLoading)}
            disabled={exportLoading || !hasData}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm font-medium flex items-center disabled:opacity-50"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Gửi Email
          </button>
        </div>
      </div>

      {/* Thống kê hoạt động - luôn hiển thị */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="text-sm font-medium text-blue-700">Đăng nhập thành công</h3>
          <p className="text-2xl font-bold text-blue-900">{processedData?.successLogins || 0}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <h3 className="text-sm font-medium text-red-700">Đăng nhập thất bại</h3>
          <p className="text-2xl font-bold text-red-900">{processedData?.failedLogins || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <h3 className="text-sm font-medium text-green-700">Cập nhật dữ liệu</h3>
          <p className="text-2xl font-bold text-green-900">{processedData?.dataUpdates || 0}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <h3 className="text-sm font-medium text-yellow-700">Lỗi hệ thống</h3>
          <p className="text-2xl font-bold text-yellow-900">{processedData?.errors || 0}</p>
        </div>
      </div>

      {/* Thống kê hành động người dùng */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Thống kê hành động người dùng</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {processedData?.orderPlacedCount > 0 && (
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <h3 className="text-sm font-medium text-indigo-700">Đơn hàng</h3>
              <p className="text-xl font-bold text-indigo-900">{processedData.orderPlacedCount}</p>
            </div>
          )}
          {processedData?.registerCount > 0 && (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h3 className="text-sm font-medium text-purple-700">Đăng ký</h3>
              <p className="text-xl font-bold text-purple-900">{processedData.registerCount}</p>
            </div>
          )}
          {processedData?.paymentCount > 0 && (
            <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
              <h3 className="text-sm font-medium text-pink-700">Thanh toán</h3>
              <p className="text-xl font-bold text-pink-900">{processedData.paymentCount}</p>
            </div>
          )}
          {processedData?.reviewCount > 0 && (
            <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
              <h3 className="text-sm font-medium text-teal-700">Đánh giá</h3>
              <p className="text-xl font-bold text-teal-900">{processedData.reviewCount}</p>
            </div>
          )}
          {processedData?.couponUsedCount > 0 && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <h3 className="text-sm font-medium text-orange-700">Mã giảm giá</h3>
              <p className="text-xl font-bold text-orange-900">{processedData.couponUsedCount}</p>
            </div>
          )}
          {processedData?.profileUpdateCount > 0 && (
            <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-100">
              <h3 className="text-sm font-medium text-cyan-700">Cập nhật hồ sơ</h3>
              <p className="text-xl font-bold text-cyan-900">{processedData.profileUpdateCount}</p>
            </div>
          )}
          {processedData?.cartUpdateCount > 0 && (
            <div className="bg-lime-50 p-4 rounded-lg border border-lime-100">
              <h3 className="text-sm font-medium text-lime-700">Cập nhật giỏ hàng</h3>
              <p className="text-xl font-bold text-lime-900">{processedData.cartUpdateCount}</p>
            </div>
          )}
          {processedData?.searchCount > 0 && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <h3 className="text-sm font-medium text-amber-700">Tìm kiếm</h3>
              <p className="text-xl font-bold text-amber-900">{processedData.searchCount}</p>
            </div>
          )}
        </div>
      </div>

      {/* Biểu đồ hoạt động hệ thống */}
      {processedData?.activityOverTime && processedData.activityOverTime.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Hoạt động hệ thống theo thời gian</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={processedData.activityOverTime}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="logins"
                  name="Đăng nhập"
                  stroke={COLORS[0]}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="updates"
                  name="Cập nhật"
                  stroke={COLORS[1]}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  name="Đơn hàng"
                  stroke={COLORS[3]}
                />
                <Line
                  type="monotone"
                  dataKey="errors"
                  name="Lỗi"
                  stroke={COLORS[2]}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Nhật ký hoạt động */}
      {processedData?.activityLog && processedData.activityLog.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Nhật ký hoạt động gần đây</h3>
          <div className="overflow-x-auto bg-gray-50 p-4 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hoạt động
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  // First render all activity rows
                  ...processedData.activityLog.map((activity, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(activity.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {activity.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatAction(activity.action)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(activity.status)}`}
                        >
                          {formatStatus(activity.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.ip || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.details && Object.keys(activity.details).length > 0 ? (
                          <button 
                            onClick={() => toggleDetails(index)}
                            className="text-blue-500 hover:text-blue-700 focus:outline-none"
                          >
                            {expandedDetails[index] ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                          </button>
                        ) : (
                          <span className="text-gray-400">Không có</span>
                        )}
                      </td>
                    </tr>
                  )),
                  // Then render all expanded detail rows
                  ...processedData.activityLog.map((activity, index) => 
                    expandedDetails[index] && activity.details && Object.keys(activity.details).length > 0 ? (
                      <tr key={`details-${index}`} className="bg-gray-50">
                        <td colSpan={6} className="px-6 py-2">
                          {formatDetails(activity.details)}
                        </td>
                      </tr>
                    ) : null
                  )
                ]}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

SystemActivityReport.propTypes = {
  systemActivityData: PropTypes.object,
  exportToPDF: PropTypes.func.isRequired,
  exportToExcel: PropTypes.func.isRequired,
  sendReportEmail: PropTypes.func.isRequired,
  exportLoading: PropTypes.bool,
  setExportLoading: PropTypes.func.isRequired
};

SystemActivityReport.defaultProps = {
  systemActivityData: null,
  exportLoading: false
};

export default SystemActivityReport; 