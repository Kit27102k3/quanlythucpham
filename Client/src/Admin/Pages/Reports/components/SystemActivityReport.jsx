import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
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

  useEffect(() => {
    // Kiểm tra xem có dữ liệu thực tế nào không
    const dataCheck = systemActivityData && (
      systemActivityData.successLogins > 0 || 
      systemActivityData.failedLogins > 0 || 
      systemActivityData.dataUpdates > 0 || 
      systemActivityData.errors > 0 ||
      systemActivityData.totalUsers > 0
    );
    
    setHasData(dataCheck);
  }, [systemActivityData]);

  return (
    <div id="system-activity-report" className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Báo cáo hoạt động hệ thống</h2>
        <div className="flex gap-2">
          <button
            onClick={() => exportToPDF('system-activity', setExportLoading)}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất PDF
          </button>
          <button
            onClick={() => exportToExcel(systemActivityData.activityLog || [], 'system-activity', setExportLoading)}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất Excel
          </button>
          <button
            onClick={() => sendReportEmail('system-activity', setExportLoading)}
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

      {!hasData && (
        <div className="text-center py-10 bg-gray-50 rounded-lg mb-6">
          <p className="text-lg text-gray-500">Không có dữ liệu hoạt động hệ thống</p>
          <p className="text-sm text-gray-400 mt-2">Hệ thống chưa có đủ dữ liệu để hiển thị báo cáo</p>
        </div>
      )}

      {/* Thống kê hoạt động - luôn hiển thị */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="text-sm font-medium text-blue-700">Đăng nhập thành công</h3>
          <p className="text-2xl font-bold text-blue-900">{systemActivityData?.successLogins || 0}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <h3 className="text-sm font-medium text-red-700">Đăng nhập thất bại</h3>
          <p className="text-2xl font-bold text-red-900">{systemActivityData?.failedLogins || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <h3 className="text-sm font-medium text-green-700">Cập nhật dữ liệu</h3>
          <p className="text-2xl font-bold text-green-900">{systemActivityData?.dataUpdates || 0}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <h3 className="text-sm font-medium text-yellow-700">Lỗi hệ thống</h3>
          <p className="text-2xl font-bold text-yellow-900">{systemActivityData?.errors || 0}</p>
        </div>
      </div>

      {/* Thống kê dữ liệu hệ thống */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
          <h3 className="text-sm font-medium text-indigo-700">Tổng người dùng</h3>
          <p className="text-2xl font-bold text-indigo-900">{systemActivityData?.totalUsers || 0}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <h3 className="text-sm font-medium text-purple-700">Tổng sản phẩm</h3>
          <p className="text-2xl font-bold text-purple-900">{systemActivityData?.totalProducts || 0}</p>
        </div>
        <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
          <h3 className="text-sm font-medium text-pink-700">Tổng đơn hàng</h3>
          <p className="text-2xl font-bold text-pink-900">{systemActivityData?.totalOrders || 0}</p>
        </div>
      </div>

      {/* Biểu đồ hoạt động hệ thống */}
      {systemActivityData?.activityOverTime && systemActivityData.activityOverTime.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Hoạt động hệ thống theo thời gian</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={systemActivityData.activityOverTime}
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
      {systemActivityData?.activityLog && systemActivityData.activityLog.length > 0 && (
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {systemActivityData.activityLog.map((activity, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {activity.user}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          activity.status === "success" || activity.status === "Thành công"
                            ? "bg-green-100 text-green-800"
                            : activity.status === "failed" || activity.status === "Thất bại"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {activity.status === "success" ? "Thành công" :
                         activity.status === "failed" ? "Thất bại" :
                         activity.status || "Không xác định"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.ip}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemActivityReport; 