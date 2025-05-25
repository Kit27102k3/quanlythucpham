import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PromotionReport = ({ 
  promotionData,
  exportToPDF,
  exportToExcel,
  sendReportEmail,
  exportLoading,
  setExportLoading,
  formatCurrency
}) => {
  // Create data for type distribution chart
  const typeData = useMemo(() => {
    if (!promotionData?.typeStats) return [
      { name: 'Phần trăm', value: 0 },
      { name: 'Giá trị cố định', value: 0 },
    ];
    
    return [
      { name: 'Phần trăm', value: promotionData.typeStats.percentage?.count || 0 },
      { name: 'Giá trị cố định', value: promotionData.typeStats.fixed?.count || 0 },
    ];
  }, [promotionData?.typeStats]);
  
  const COLORS = ['#4ade80', '#60a5fa'];
  
  // Ensure there's always data for usage over time chart
  const usageOverTime = useMemo(() => {
    if (Array.isArray(promotionData?.usageOverTime) && promotionData.usageOverTime.length > 0) {
      return promotionData.usageOverTime;
    }
    
    // Return empty array if no data
    return [];
  }, [promotionData?.usageOverTime]);
  
  // Ensure there's always data for revenue comparison chart
  const revenueComparison = useMemo(() => {
    if (Array.isArray(promotionData?.revenueComparison) && promotionData.revenueComparison.length > 0) {
      return promotionData.revenueComparison;
    }
    
    // Return empty array if no data
    return [];
  }, [promotionData?.revenueComparison]);
  
  // Ensure there's always data for voucher usage table
  const voucherUsage = useMemo(() => {
    if (Array.isArray(promotionData?.voucherUsage) && promotionData.voucherUsage.length > 0) {
      return promotionData.voucherUsage;
    }
    
    // Return empty array if no data
    return [];
  }, [promotionData?.voucherUsage]);
  
  // Ensure there's always data for promotion effectiveness chart
  const promotionEffectiveness = useMemo(() => {
    if (Array.isArray(promotionData?.promotionEffectiveness) && promotionData.promotionEffectiveness.length > 0) {
      return promotionData.promotionEffectiveness;
    }
    
    // Return empty array if no data
    return [];
  }, [promotionData?.promotionEffectiveness]);
  
  // Ensure there's always data for conversion rate chart
  const conversionRate = useMemo(() => {
    if (Array.isArray(promotionData?.conversionRate) && promotionData.conversionRate.length > 0) {
      return promotionData.conversionRate;
    }
    
    // Return empty array if no data
    return [];
  }, [promotionData?.conversionRate]);

  // Check if we have data to display
  const hasData = promotionData && Object.keys(promotionData).length > 0;

  if (!hasData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Báo cáo khuyến mãi / mã giảm giá</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="promotions-report" className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Báo cáo khuyến mãi / mã giảm giá</h2>
        <div className="flex gap-2">
          <button
            onClick={() => exportToPDF('promotions', setExportLoading)}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất PDF
          </button>
          <button
            onClick={() => exportToExcel(voucherUsage, 'promotions', setExportLoading)}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất Excel
          </button>
          <button
            onClick={() => sendReportEmail('promotions', setExportLoading)}
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

      {/* Stats summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-700">Tổng số mã giảm giá</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {promotionData?.totalCoupons || 0}
              </p>
            </div>
            <div className="text-green-500 text-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <div className="w-full bg-green-200 rounded-full h-2.5">
              <div
                className="bg-green-500 h-2.5 rounded-full"
                style={{ width: `${promotionData?.totalCoupons ? (promotionData?.activeCoupons / promotionData?.totalCoupons) * 100 : 0}%` }}
              ></div>
            </div>
            <span className="text-xs text-green-700 ml-2">
              {promotionData?.activeCoupons || 0} đang hoạt động
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-700">Tổng lượt sử dụng</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {promotionData?.totalUsedCount || 0}
              </p>
            </div>
            <div className="text-blue-500 text-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
                Tỷ lệ thành công: {Math.round((promotionData?.totalUsedCount / 
                  (voucherUsage.reduce((acc, v) => acc + (v.limit === '∞' ? 0 : v.limit), 0) || 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-700">Loại mã giảm giá</h3>
            </div>
            <div className="text-purple-500 text-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="h-20 w-20">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={35}
                    fill="#8884d8"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs text-gray-600">Phần trăm: {promotionData?.typeStats?.percentage?.count || 0}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-xs text-gray-600">Cố định: {promotionData?.typeStats?.fixed?.count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Impact Summary */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200 shadow-sm mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Tổng quan tác động doanh thu</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <h4 className="text-sm font-medium text-gray-500">Doanh thu ước tính từ mã % giảm giá</h4>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {formatCurrency(promotionData?.typeStats?.percentage?.estimatedRevenue || 0)}
            </p>
            <div className="text-xs text-gray-500 mt-1">
              Dựa trên {promotionData?.typeStats?.percentage?.used || 0} lượt sử dụng
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <h4 className="text-sm font-medium text-gray-500">Doanh thu ước tính từ mã giảm giá cố định</h4>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {formatCurrency(promotionData?.typeStats?.fixed?.estimatedRevenue || 0)}
            </p>
            <div className="text-xs text-gray-500 mt-1">
              Dựa trên {promotionData?.typeStats?.fixed?.used || 0} lượt sử dụng
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <h4 className="text-sm font-medium text-gray-500">Tổng giá trị giảm giá</h4>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {formatCurrency(promotionData?.typeStats?.fixed?.totalValue || 0)} + {promotionData?.typeStats?.percentage?.totalValue || 0}%
            </p>
            <div className="text-xs text-gray-500 mt-1">
              <span className="text-red-500 font-medium">Tác động: </span> 
              {formatCurrency(
                (promotionData?.revenueComparison || []).reduce((sum, item) => sum + (item['Tổng giảm giá'] || 0), 0)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bảng thống kê mã giảm giá */}
      {voucherUsage.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Thống kê mã giảm giá</h3>
          <div className="overflow-x-auto bg-gray-50 p-4 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã giảm giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại giảm giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đã sử dụng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giới hạn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doanh thu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tỷ lệ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {voucherUsage.map((voucher, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {voucher.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {voucher.discount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {voucher.used}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {voucher.limit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(voucher.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-green-500 h-2.5 rounded-full"
                          style={{
                            width: `${voucher.limit === '∞' ? 100 : (voucher.used / voucher.limit) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {voucher.limit === '∞' ? 'Không giới hạn' : `${Math.round((voucher.used / voucher.limit) * 100)}%`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts section - only render if data is available */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Usage Over Time */}
        {usageOverTime.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Lượng sử dụng mã giảm giá theo thời gian</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={usageOverTime}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Phần trăm" name="Loại phần trăm" fill="#4ade80" />
                  <Bar dataKey="Cố định" name="Loại cố định" fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Revenue Comparison */}
        {revenueComparison.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">So sánh doanh thu</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueComparison}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
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
                    formatter={(value) => [formatCurrency(value), ""]}
                  />
                  <Legend />
                  <Bar dataKey="Doanh thu thực tế" name="Doanh thu thực tế" fill="#4ade80" />
                  <Bar dataKey="Doanh thu không có khuyến mãi" name="Doanh thu không KM" fill="#94a3b8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* More charts - only render if data is available */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Hiệu quả chương trình khuyến mãi */}
        {promotionEffectiveness.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Hiệu quả chương trình khuyến mãi</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={promotionEffectiveness}
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
                    formatter={(value) => [formatCurrency(value), ""]}
                  />
                  <Legend />
                  <Bar dataKey="Rau" name="Rau" fill="#4ade80" />
                  <Bar dataKey="Thịt & Hải sản" name="Thịt & Hải sản" fill="#f87171" />
                  <Bar dataKey="Trứng & Sữa" name="Trứng & Sữa" fill="#fbbf24" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tỷ lệ chuyển đổi */}
        {conversionRate.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Tỷ lệ chuyển đổi (%)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={conversionRate}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, "Tỷ lệ chuyển đổi"]} />
                  <Legend />
                  <Bar dataKey="rate" name="Tỷ lệ chuyển đổi" fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// PropTypes validation
PromotionReport.propTypes = {
  promotionData: PropTypes.shape({
    totalCoupons: PropTypes.number,
    activeCoupons: PropTypes.number,
    totalUsedCount: PropTypes.number,
    typeStats: PropTypes.shape({
      percentage: PropTypes.shape({
        count: PropTypes.number,
        used: PropTypes.number,
        totalValue: PropTypes.number,
        estimatedRevenue: PropTypes.number
      }),
      fixed: PropTypes.shape({
        count: PropTypes.number,
        used: PropTypes.number,
        totalValue: PropTypes.number,
        estimatedRevenue: PropTypes.number
      })
    }),
    voucherUsage: PropTypes.arrayOf(
      PropTypes.shape({
        code: PropTypes.string,
        discount: PropTypes.string,
        used: PropTypes.number,
        limit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        revenue: PropTypes.number,
        description: PropTypes.string
      })
    ),
    usageOverTime: PropTypes.arrayOf(PropTypes.object),
    revenueComparison: PropTypes.arrayOf(PropTypes.object),
    promotionEffectiveness: PropTypes.arrayOf(PropTypes.object),
    conversionRate: PropTypes.arrayOf(PropTypes.object)
  }),
  exportToPDF: PropTypes.func.isRequired,
  exportToExcel: PropTypes.func.isRequired,
  sendReportEmail: PropTypes.func.isRequired,
  exportLoading: PropTypes.bool.isRequired,
  setExportLoading: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired
};

export default PromotionReport; 