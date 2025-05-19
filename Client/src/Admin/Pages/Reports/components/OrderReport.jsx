import React from 'react';
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
import { COLORS } from '../utils/reportUtils';

const OrderReport = ({ 
  orderData, 
  exportToPDF, 
  exportToExcel, 
  sendReportEmail, 
  exportLoading, 
  setExportLoading,
  formatCurrency 
}) => {
  return (
    <div id="orders-report" className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Báo cáo đơn hàng</h2>
        <div className="flex gap-2">
          <button
            onClick={() => exportToPDF('orders', setExportLoading)}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất PDF
          </button>
          <button
            onClick={() => exportToExcel(orderData.orderStatus.concat(orderData.processingTime), 'orders', setExportLoading)}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất Excel
          </button>
          <button
            onClick={() => sendReportEmail('orders', setExportLoading)}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Gửi Email
          </button>
        </div>
      </div>

      {/* Thống kê trạng thái đơn hàng */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {orderData.orderStatus && orderData.orderStatus.map((status, index) => (
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
              {Math.round(status.value / orderData.orderStatus.reduce((sum, item) => sum + item.value, 0) * 100)}% tổng đơn
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
                  data={orderData.orderStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderData.orderStatus && orderData.orderStatus.map((entry, index) => (
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

        {/* Biểu đồ thời gian xử lý đơn hàng */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Thời gian xử lý trung bình (phút)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={orderData.processingTime}
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
        </div>
      </div>

      {/* Bảng top đơn hàng giá trị cao */}
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-4">Đơn hàng giá trị cao nhất</h3>
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
              {orderData.topOrders && orderData.topOrders.map((order, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === 'Đang xử lý' ? 'bg-yellow-100 text-yellow-800' : 
                        order.status === 'Đang giao' ? 'bg-blue-100 text-blue-800' : 
                        order.status === 'Đã giao' ? 'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderReport; 