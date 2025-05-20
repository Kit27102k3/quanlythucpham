import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const TopProductsReport = ({ 
  topProducts, 
  exportToPDF, 
  exportToExcel, 
  sendReportEmail, 
  exportLoading, 
  setExportLoading,
  formatCurrency 
}) => {
  // Hàm format tiền tệ dự phòng khi formatCurrency không tồn tại
  const formatMoney = (value) => {
    try {
      if (typeof formatCurrency === 'function') {
        return formatCurrency(value);
      }
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    }
  };
  
  // Xử lý dữ liệu từ API
  const prepareTopProductsData = () => {
    if (!topProducts || !Array.isArray(topProducts) || topProducts.length === 0) {
      return [];
    }
    
    // Đảm bảo dữ liệu có các trường cần thiết
    return topProducts.map(product => ({
      name: product.name || 'Không xác định',
      sold: product.sold || 0,
      revenue: typeof product.revenue === 'number' ? product.revenue : 0,
      category: product.category || 'Không phân loại'
    })).filter(product => product.name && product.revenue > 0);
  };
  
  // Lấy dữ liệu đã xử lý
  const processedProducts = prepareTopProductsData();

  return (
    <div id="top-products-report" className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Sản phẩm bán chạy</h2>
        <div className="flex items-center gap-4">
          <select 
            className="bg-gray-100 border border-gray-300 text-gray-700 py-1.5 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            defaultValue="revenue"
          >
            <option value="revenue">Theo doanh thu</option>
            <option value="quantity">Theo số lượng</option>
          </select>
          
          <div className="flex gap-2">
            <button
              onClick={() => exportToPDF('top-products', setExportLoading)}
              disabled={exportLoading}
              className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium flex items-center"
            >
              {exportLoading ? (
                <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
              ) : null}
              Xuất PDF
            </button>
            <button
              onClick={() => exportToExcel(processedProducts, 'top-products', setExportLoading)}
              disabled={exportLoading}
              className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-medium flex items-center"
            >
              {exportLoading ? (
                <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
              ) : null}
              Xuất Excel
            </button>
            <button
              onClick={() => sendReportEmail('top-products', setExportLoading)}
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
      </div>

      {processedProducts.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 mb-6">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số lượng đã bán
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
                {processedProducts.map((product, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatMoney(product.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-green-500 h-2.5 rounded-full"
                          style={{
                            width: `${processedProducts[0]?.revenue > 0 
                              ? (product.revenue / processedProducts[0].revenue) * 100 
                              : 0}%`,
                          }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={processedProducts}
                margin={{ top: 10, right: 30, left: 100, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  tickFormatter={(value) => 
                    new Intl.NumberFormat('vi-VN', {
                      notation: 'compact',
                      compactDisplay: 'short',
                      maximumFractionDigits: 1
                    }).format(value)
                  }
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={90}
                  tick={{ 
                    fontSize: 12,
                    width: 90,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                  tickFormatter={(value) => {
                    // Nếu tên quá dài thì cắt ngắn và thêm dấu ...
                    return value.length > 12 ? value.substring(0, 10) + '...' : value;
                  }}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === "revenue") {
                      return [formatMoney(value), "Doanh thu"];
                    }
                    return [value, name];
                  }}
                  labelStyle={{ color: "#333" }}
                  contentStyle={{ backgroundColor: "white", borderRadius: "8px" }}
                />
                <Legend />
                <Bar
                  dataKey="revenue"
                  name="Doanh thu"
                  fill="#4ade80"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-60">
          <p className="text-gray-500">Không có dữ liệu sản phẩm bán chạy</p>
        </div>
      )}
    </div>
  );
};

export default TopProductsReport; 