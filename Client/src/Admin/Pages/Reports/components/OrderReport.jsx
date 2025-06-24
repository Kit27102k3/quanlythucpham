import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { reportsApi } from '../../../../api/reportsApi';

const OrderReport = ({ 
  orderData = {}, 
  exportToPDF, 
  exportToExcel, 
  sendReportEmail, 
  exportLoading, 
  setExportLoading,
  formatCurrency 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(orderData);

  const fetchOrderData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getOrderData();
      if (response) {
        console.log("Dữ liệu đơn hàng:", response);
        setData(response);
      } else {
        setError("Không thể lấy dữ liệu đơn hàng từ server");
      }
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu đơn hàng:", err);
      setError("Lỗi khi lấy dữ liệu đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Chỉ gọi API nếu không có dữ liệu được truyền vào qua props
    if (!orderData || Object.keys(orderData).length === 0) {
      fetchOrderData();
    } else {
      setData(orderData);
    }
  }, [orderData]);

  // Chuyển đổi dữ liệu thô thành định dạng cần thiết cho biểu đồ
  const orderStatus = useMemo(() => {
    // Nếu không có dữ liệu, trả về mảng rỗng
    if (!data) return [];

    // Kiểm tra nếu đã có orderStatus trong dữ liệu
    if (data.orderStatus && Array.isArray(data.orderStatus) && data.orderStatus.length > 0) {
      return data.orderStatus;
    }

    // Tạo dữ liệu trạng thái đơn hàng từ dữ liệu thô
    const result = [];
    
    if (data.pendingOrders !== undefined) {
      result.push({ name: 'Đang xử lý', value: data.pendingOrders });
    }
    
    if (data.completedOrders !== undefined) {
      result.push({ name: 'Đã giao', value: data.completedOrders });
    }
    
    if (data.cancelledOrders !== undefined) {
      result.push({ name: 'Đã hủy', value: data.cancelledOrders });
    }
    
    // Tính toán đơn hàng đang giao (nếu không có trực tiếp từ API)
    if (data.totalOrders !== undefined) {
      const inDelivery = data.totalOrders - 
        (data.pendingOrders || 0) - 
        (data.completedOrders || 0) - 
        (data.cancelledOrders || 0);
      
      if (inDelivery > 0) {
        result.push({ name: 'Đang giao', value: inDelivery });
      }
    }
    
    return result;
  }, [data]);

  // Tạo dữ liệu thời gian xử lý
  const processingTime = useMemo(() => {
    // Nếu không có dữ liệu, trả về mảng rỗng
    if (!data) return [];

    // Kiểm tra nếu đã có processingTime trong dữ liệu
    if (data.processingTime && Array.isArray(data.processingTime) && data.processingTime.length > 0) {
      return data.processingTime;
    }

    // Nếu có averageProcessingTime, sử dụng nó
    if (data.averageProcessingTime) {
      return [
        { name: 'Xác nhận', time: Math.round(data.averageProcessingTime * 0.2) },
        { name: 'Đóng gói', time: Math.round(data.averageProcessingTime * 0.3) },
        { name: 'Vận chuyển', time: Math.round(data.averageProcessingTime * 0.5) }
      ];
    }

    // Nếu không có dữ liệu xử lý, trả về mảng rỗng
    return [];
  }, [data]);

  // Danh sách top đơn hàng
  const topOrders = useMemo(() => {
    if (!data) return [];

    // Kiểm tra nếu đã có topOrders trong dữ liệu
    if (data.topOrders && Array.isArray(data.topOrders) && data.topOrders.length > 0) {
      return data.topOrders;
    }

    // Nếu không có dữ liệu top đơn hàng, trả về mảng rỗng
    return [];
  }, [data]);
  
  const formatPrice = (value) => {
    if (formatCurrency) {
      return formatCurrency(value);
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  const handleRefresh = () => {
    fetchOrderData();
  };

  // Tính tổng số đơn hàng
  const totalOrders = useMemo(() => {
    if (data && data.totalOrders !== undefined) {
      return data.totalOrders;
    }
    return orderStatus.reduce((sum, item) => sum + item.value, 0);
  }, [data, orderStatus]);
  
  return (
    <div id="orders-report" className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Báo cáo đơn hàng</h2>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm font-medium flex items-center"
          >
            {loading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-blue-700 rounded-full"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Làm mới
          </button>
          <button
            onClick={() => exportToPDF('orders', setExportLoading)}
            disabled={exportLoading || loading || orderStatus.length === 0}
            className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium flex items-center disabled:opacity-50"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất PDF
          </button>
          <button
            onClick={() => exportToExcel({orderStatus, processingTime, topOrders, totalOrders, averageOrderValue: data?.averageOrderValue}, 'orders', setExportLoading)}
            disabled={exportLoading || loading || orderStatus.length === 0}
            className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-medium flex items-center disabled:opacity-50"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất Excel
          </button>
          <button
            onClick={() => sendReportEmail('orders', setExportLoading)}
            disabled={exportLoading || loading || orderStatus.length === 0}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm font-medium flex items-center disabled:opacity-50"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Gửi Email
          </button>
        </div>
      </div>

      {/* Hiển thị trạng thái tải dữ liệu */}
      {loading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      )}
      
      {/* Hiển thị lỗi nếu có */}
      {error && !loading && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-center">
          <p className="font-medium">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Thử lại
          </button>
        </div>
      )}

      {/* Nếu không có dữ liệu và không đang tải */}
      {!loading && !error && orderStatus.length === 0 && (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-500">Không có dữ liệu đơn hàng</p>
          <button
            onClick={handleRefresh}
            className="mt-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm font-medium inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Làm mới dữ liệu
          </button>
        </div>
      )}

      {/* Chỉ hiển thị dữ liệu khi có */}
      {!loading && !error && orderStatus.length > 0 && (
        <>
          {/* Thống kê trạng thái đơn hàng */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {orderStatus.map((status, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg ${
                  status.name === 'Đang xử lý' ? 'bg-yellow-50' : 
                  status.name === 'Đang giao' ? 'bg-blue-50' : 
                  status.name === 'Đã giao' ? 'bg-green-50' : 
                  'bg-red-50'
                }`}
              >
                <h3 className="text-lg font-medium text-gray-800">{status.name}</h3>
                <p className={`text-3xl font-bold mt-2 ${
                  status.name === 'Đang xử lý' ? 'text-yellow-600' : 
                  status.name === 'Đang giao' ? 'text-blue-600' : 
                  status.name === 'Đã giao' ? 'text-green-600' : 
                  'text-red-600'
                }`}>
                  {status.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {Math.round(status.value / totalOrders * 100)}% tổng đơn
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Biểu đồ trạng thái đơn hàng */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Tỷ lệ theo trạng thái</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderStatus.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.name === 'Đang xử lý' ? '#FBBF24' : 
                            entry.name === 'Đang giao' ? '#3B82F6' : 
                            entry.name === 'Đã giao' ? '#10B981' : 
                            '#EF4444'
                          } 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} đơn hàng`, "Số lượng"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Biểu đồ thời gian xử lý đơn hàng hoặc giá trị đơn hàng trung bình */}
            <div>
              {processingTime.length > 0 ? (
                <>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Thời gian xử lý trung bình (phút)</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={processingTime}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} phút`, "Thời gian"]} />
                        <Legend />
                        <Bar dataKey="time" name="Thời gian" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Giá trị đơn hàng trung bình</h3>
                  <div className="h-80 flex flex-col items-center justify-center">
                    {data && data.averageOrderValue ? (
                      <>
                        <div className="text-5xl font-bold text-blue-600">
                          {formatPrice(data.averageOrderValue)}
                        </div>
                        <p className="text-gray-500 mt-4">Giá trị trung bình trên mỗi đơn hàng</p>
                      </>
                    ) : (
                      <p className="text-gray-500">Không có dữ liệu thời gian xử lý</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bảng top đơn hàng giá trị cao */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Đơn hàng giá trị cao nhất</h3>
            {topOrders && topOrders.length > 0 ? (
              <div className="overflow-x-auto bg-gray-50 p-4 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã đơn
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Khách hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá trị
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày đặt
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topOrders.map((order, index) => (
                      <tr key={index} className={index < 3 ? "bg-yellow-50" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.id || order._id || `#${index+1}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.customer || order.customerName || "Khách hàng"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-700">
                          {formatPrice(order.total || order.totalAmount || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              order.status === 'Đang xử lý' ? 'bg-yellow-100 text-yellow-800' : 
                              order.status === 'Đang giao' ? 'bg-blue-100 text-blue-800' : 
                              (order.status === 'Đã giao' || order.status === 'Đã hoàn thành' || order.status === 'completed' || order.status === 'delivered') ? 'bg-green-100 text-green-800' : 
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            {order.status === 'completed' || order.status === 'delivered' ? 'Đã giao' : order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.date || formatDate(order.createdAt || order.orderDate || new Date())}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <p className="text-gray-500">Không có dữ liệu đơn hàng giá trị cao</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

OrderReport.propTypes = {
  orderData: PropTypes.object,
  exportToPDF: PropTypes.func,
  exportToExcel: PropTypes.func,
  sendReportEmail: PropTypes.func,
  exportLoading: PropTypes.bool,
  setExportLoading: PropTypes.func,
  formatCurrency: PropTypes.func
};

export default OrderReport; 