import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { 
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UserIcon,
  TagIcon,
  ArrowPathIcon,
  TruckIcon
} from "@heroicons/react/24/outline";
import { COLORS } from '../utils/reportUtils';

const DashboardReport = ({ 
  dashboardData, 
  exportToPDF, 
  exportToExcel,
  sendReportEmail, 
  exportLoading, 
  setExportLoading,
  formatCurrency
}) => {
  // Sample data for weekly revenue
  const weeklyRevenueData = [
    { name: "T2", revenue: 2400000 },
    { name: "T3", revenue: 1600000 },
    { name: "T4", revenue: 3200000 },
    { name: "T5", revenue: 3800000 },
    { name: "T6", revenue: 2800000 },
    { name: "T7", revenue: 4800000 },
    { name: "CN", revenue: 3600000 }
  ];

  // Sample data for top products
  const topProductsData = [
    { name: "Thịt bò Wagyu", sold: 150, revenue: 45000000 },
    { name: "Cá hồi Na Uy", sold: 120, revenue: 36000000 },
    { name: "Tôm sú tươi", sold: 200, revenue: 30000000 },
    { name: "Rau xanh organic", sold: 300, revenue: 15000000 },
    { name: "Trái cây nhập khẩu", sold: 250, revenue: 12500000 }
  ];

  // Sample data for inventory
  const inventoryData = [
    { name: "Rau củ", stock: 15, lowStock: 20 },
    { name: "Thịt", stock: 25, lowStock: 15 },
    { name: "Hải sản", stock: 8, lowStock: 10 },
    { name: "Trái cây", stock: 12, lowStock: 15 },
    { name: "Đồ khô", stock: 50, lowStock: 20 }
  ];

  return (
    <div id="dashboard-report" className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Tổng quan hệ thống</h2>
        <div className="flex gap-2">
          <button
            onClick={() => exportToPDF('dashboard', setExportLoading)}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất PDF
          </button>
          <button
            onClick={() => exportToExcel(dashboardData.recentActivities, 'dashboard', setExportLoading)}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất Excel
          </button>
          <button
            onClick={() => sendReportEmail('dashboard', setExportLoading)}
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

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 text-white p-3 rounded-full">
              <CurrencyDollarIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm">Tổng doanh thu</h3>
              <p className="text-xl font-bold text-gray-800">
                {formatCurrency(dashboardData.totalRevenue)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 text-white p-3 rounded-full">
              <ShoppingBagIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm">Tổng đơn hàng</h3>
              <p className="text-xl font-bold text-gray-800">
                {dashboardData.totalOrders}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500 text-white p-3 rounded-full">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm">Tổng khách hàng</h3>
              <p className="text-xl font-bold text-gray-800">
                {dashboardData.totalCustomers}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 text-white p-3 rounded-full">
              <TagIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm">Tổng sản phẩm</h3>
              <p className="text-xl font-bold text-gray-800">
                {dashboardData.totalProducts}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Biểu đồ và bảng thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Biểu đồ doanh thu theo tuần */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Doanh thu 7 ngày qua</h3>
          <div className="h-80 bg-gray-50 p-4 rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyRevenueData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis 
                  tickFormatter={(value) => 
                    new Intl.NumberFormat('vi-VN', {
                      notation: 'compact',
                      compactDisplay: 'short',
                      maximumFractionDigits: 1
                    }).format(value)
                  }
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), "Doanh thu"]}
                  labelStyle={{ color: "#333" }}
                  contentStyle={{ backgroundColor: "white", borderRadius: "8px" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Doanh thu" 
                  stroke="#4ade80" 
                  fill="#4ade8080" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hoạt động gần đây */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Hoạt động gần đây</h3>
          <div className="bg-gray-50 p-4 rounded-lg h-80 overflow-y-auto">
            <ul className="space-y-3">
              {dashboardData.recentActivities && dashboardData.recentActivities.length > 0 ? (
                dashboardData.recentActivities.map((activity, index) => (
                  <li key={index} className="flex items-start gap-3 p-2 bg-white rounded-md shadow-sm">
                    <div className={`
                      p-2 rounded-full
                      ${activity.type === 'order' ? 'bg-blue-100 text-blue-600' : ''}
                      ${activity.type === 'product' ? 'bg-yellow-100 text-yellow-600' : ''}
                      ${activity.type === 'user' ? 'bg-purple-100 text-purple-600' : ''}
                      ${activity.type === 'system' ? 'bg-gray-100 text-gray-600' : ''}
                      ${activity.type === 'delivery' ? 'bg-green-100 text-green-600' : ''}
                    `}>
                      {activity.type === 'order' && <ShoppingBagIcon className="w-5 h-5" />}
                      {activity.type === 'product' && <TagIcon className="w-5 h-5" />}
                      {activity.type === 'user' && <UserIcon className="w-5 h-5" />}
                      {activity.type === 'system' && <ArrowPathIcon className="w-5 h-5" />}
                      {activity.type === 'delivery' && <TruckIcon className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-center text-gray-500 p-4">Không có hoạt động gần đây</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Sản phẩm bán chạy và tồn kho */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Top sản phẩm bán chạy */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Top 5 sản phẩm bán chạy</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Đã bán
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doanh thu
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topProductsData.slice(0, 5).map((product, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {product.sold}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sản phẩm sắp hết hàng */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Cảnh báo tồn kho</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Danh mục
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tồn kho
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventoryData.filter(item => item.stock <= item.lowStock).map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {item.stock}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${item.stock <= item.lowStock ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
                          `}
                        >
                          {item.stock <= item.lowStock ? "Sắp hết" : "Đủ hàng"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardReport; 