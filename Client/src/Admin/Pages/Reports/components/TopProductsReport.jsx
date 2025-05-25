import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
import { Button, CircularProgress, Typography } from '@mui/material';
import { reportsApi } from "../../../../api/reportsApi";

const TopProductsReport = ({ 
  topProducts, 
  exportToPDF, 
  exportToExcel, 
  sendReportEmail, 
  exportLoading, 
  setExportLoading,
  formatCurrency 
}) => {
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState([]);
  const [error, setError] = useState(null);

  // Tự động lấy dữ liệu nếu props không có sẵn
  useEffect(() => {
    if (topProducts && topProducts.length > 0) {
      setProductData(processTopProductsData(topProducts));
    } else {
      fetchTopProductsData();
    }
  }, [topProducts]);

  // Hàm gọi API để lấy dữ liệu
  const fetchTopProductsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsApi.getTopProducts();
      if (data && data.length > 0) {
        setProductData(processTopProductsData(data));
      } else {
        setError("Không thể lấy dữ liệu sản phẩm bán chạy");
      }
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu sản phẩm bán chạy:", err);
      setError("Lỗi khi lấy dữ liệu sản phẩm bán chạy");
    } finally {
      setLoading(false);
    }
  };

  // Thử lại khi có lỗi
  const handleRetry = () => {
    fetchTopProductsData();
  };

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
  const processTopProductsData = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    // Đảm bảo dữ liệu có các trường cần thiết
    return data.map(product => ({
      name: product.name || 'Không xác định',
      sold: product.sold || 0,
      revenue: typeof product.revenue === 'number' ? product.revenue : 0,
      category: product.category || 'Không phân loại'
    })).filter(product => product.name && product.revenue > 0);
  };

  // Trạng thái loading
  if (loading) {
    return (
      <div id="top-products-report" className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Sản phẩm bán chạy</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-60">
          <CircularProgress className="mb-4" />
          <p className="text-gray-500">Đang tải dữ liệu sản phẩm bán chạy...</p>
        </div>
      </div>
    );
  }

  // Trạng thái lỗi
  if (error) {
    return (
      <div id="top-products-report" className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Sản phẩm bán chạy</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-60 bg-red-50 rounded-lg p-6">
          <Typography variant="h6" className="text-red-500 mb-2">
            {error}
          </Typography>
          <p className="text-gray-600 mb-4">Không thể kết nối đến máy chủ hoặc không có dữ liệu</p>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleRetry}
            startIcon={<span className="material-icons">refresh</span>}
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

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
              disabled={exportLoading || productData.length === 0}
              className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium flex items-center"
            >
              {exportLoading ? (
                <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
              ) : null}
              Xuất PDF
            </button>
            <button
              onClick={() => exportToExcel(productData, 'top-products', setExportLoading)}
              disabled={exportLoading || productData.length === 0}
              className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-medium flex items-center"
            >
              {exportLoading ? (
                <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
              ) : null}
              Xuất Excel
            </button>
            <button
              onClick={() => sendReportEmail('top-products', setExportLoading)}
              disabled={exportLoading || productData.length === 0}
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

      {productData.length > 0 ? (
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
                {productData.map((product, index) => (
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
                            width: `${productData[0]?.revenue > 0 
                              ? (product.revenue / productData[0].revenue) * 100 
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
                data={productData}
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
        <div className="flex flex-col items-center justify-center h-60 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-5xl mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <Typography variant="h6" className="text-gray-500 mb-2">
            Không có dữ liệu sản phẩm bán chạy
          </Typography>
          <p className="text-gray-500 mb-4">
            Chưa có dữ liệu bán hàng hoặc không thể kết nối đến máy chủ
          </p>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleRetry}
            startIcon={<span className="material-icons">refresh</span>}
          >
            Tải lại dữ liệu
          </Button>
        </div>
      )}
    </div>
  );
};

// Định nghĩa PropTypes
TopProductsReport.propTypes = {
  topProducts: PropTypes.array,
  exportToPDF: PropTypes.func.isRequired,
  exportToExcel: PropTypes.func.isRequired,
  sendReportEmail: PropTypes.func.isRequired,
  exportLoading: PropTypes.bool.isRequired,
  setExportLoading: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
};

// Giá trị mặc định
TopProductsReport.defaultProps = {
  topProducts: [],
};

export default TopProductsReport; 