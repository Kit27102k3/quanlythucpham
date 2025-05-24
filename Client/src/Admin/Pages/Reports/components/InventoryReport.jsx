import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { COLORS } from '../utils/reportUtils';
import productsApi from '../../../../api/productsApi';
import { toast } from 'react-toastify';

const InventoryReport = ({ 
  inventory = [], 
  exportToPDF, 
  exportToExcel, 
  sendReportEmail, 
  exportLoading, 
  setExportLoading
}) => {
  const [filters, setFilters] = useState({
    stockStatus: 'all', // all, low, out, available
    category: 'all',
    sortBy: 'name' // name, stock-asc, stock-desc
  });
  const [loading, setLoading] = useState(false);
  const [localInventory, setLocalInventory] = useState([]);
  const [error, setError] = useState(null);
  
  // Tải dữ liệu tồn kho trực tiếp từ API
  useEffect(() => {
    const fetchInventoryData = async () => {
      // Nếu đã có dữ liệu từ props, sử dụng nó
      if (inventory && inventory.length > 0) {
        setLocalInventory(inventory);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Gọi API lấy dữ liệu tồn kho
        const data = await productsApi.getInventoryData();
        
        if (data && Array.isArray(data)) {

          
          // Kiểm tra dữ liệu trước khi hiển thị
          if (data.length === 0) {
            toast.warning('Không tìm thấy dữ liệu tồn kho');
          }
          
          setLocalInventory(data);
        } else {
          console.error('Dữ liệu tồn kho không hợp lệ:', data);
          setError('Dữ liệu tồn kho không hợp lệ');
          setLocalInventory([]);
          toast.error('Không thể tải dữ liệu tồn kho từ máy chủ');
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu tồn kho:', error);
        setError('Lỗi khi tải dữ liệu tồn kho: ' + (error.message || 'Lỗi không xác định'));
        setLocalInventory([]);
        toast.error('Lỗi khi tải dữ liệu tồn kho: ' + (error.message || 'Lỗi không xác định'));
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, [inventory]);
  
  // Lấy danh sách danh mục từ dữ liệu tồn kho
  const categories = useMemo(() => {
    if (!localInventory || !Array.isArray(localInventory) || localInventory.length === 0) return [];
    
    const uniqueCategories = [...new Set(localInventory.map(item => item.category || 'Không phân loại'))];
    return uniqueCategories.sort();
  }, [localInventory]);
  
  // Lọc dữ liệu theo bộ lọc hiện tại
  const filteredInventory = useMemo(() => {
    if (!localInventory || !Array.isArray(localInventory)) return [];
    
    let result = [...localInventory];
    
    // Lọc theo trạng thái tồn kho
    if (filters.stockStatus === 'low') {
      result = result.filter(item => (item.stock || 0) > 0 && (item.stock || 0) <= 20);
    } else if (filters.stockStatus === 'out') {
      result = result.filter(item => (item.stock || 0) <= 0);
    } else if (filters.stockStatus === 'available') {
      result = result.filter(item => (item.stock || 0) > 20);
    }
    
    // Lọc theo danh mục
    if (filters.category !== 'all') {
      result = result.filter(item => item.category === filters.category);
    }
    
    // Sắp xếp dữ liệu
    if (filters.sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (filters.sortBy === 'stock-asc') {
      result.sort((a, b) => (a.stock || 0) - (b.stock || 0));
    } else if (filters.sortBy === 'stock-desc') {
      result.sort((a, b) => (b.stock || 0) - (a.stock || 0));
    }
    
    return result;
  }, [localInventory, filters]);
  
  // Nhóm dữ liệu theo danh mục cho biểu đồ cột
  const categoryData = useMemo(() => {
    if (!filteredInventory.length) return [];
    
    const categoryGroups = {};
    filteredInventory.forEach(item => {
      const category = item.category || 'Không phân loại';
      if (!categoryGroups[category]) {
        categoryGroups[category] = {
          name: category,
          totalStock: 0,
          itemCount: 0
        };
      }
      categoryGroups[category].totalStock += (item.stock || 0);
      categoryGroups[category].itemCount += 1;
    });
    
    return Object.values(categoryGroups);
  }, [filteredInventory]);
  
  // Dữ liệu cho biểu đồ tròn
  const pieChartData = useMemo(() => {
    // Lấy 10 sản phẩm có tồn kho cao nhất
    return filteredInventory
      .filter(item => (item.stock || 0) > 0) // Chỉ lấy sản phẩm còn hàng
      .sort((a, b) => (b.stock || 0) - (a.stock || 0)) // Sắp xếp theo tồn kho giảm dần
      .slice(0, 10); // Lấy 10 sản phẩm đầu tiên
  }, [filteredInventory]);
  
  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };
  
  // Tính tổng giá trị tồn kho
  const totalInventoryValue = useMemo(() => {
    return filteredInventory.reduce((sum, item) => sum + (item.value || 0), 0);
  }, [filteredInventory]);
  
  // Tính tổng số lượng sản phẩm tồn kho
  const totalStockCount = useMemo(() => {
    return filteredInventory.reduce((sum, item) => sum + (item.stock || 0), 0);
  }, [filteredInventory]);
  
  return (
    <div id="inventory-report" className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Báo cáo tồn kho</h2>
          <div className="text-sm text-gray-600 mb-4">
            <span className="mr-4">Tổng số sản phẩm: <b>{filteredInventory.length}</b></span>
            <span className="mr-4">Tổng số lượng: <b>{totalStockCount.toLocaleString()}</b></span>
            <span>Tổng giá trị: <b>{new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(totalInventoryValue)}</b></span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportToPDF('inventory', setExportLoading)}
            disabled={exportLoading || loading}
            className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất PDF
          </button>
          <button
            onClick={() => exportToExcel(filteredInventory, 'inventory', setExportLoading)}
            disabled={exportLoading || loading}
            className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất Excel
          </button>
          <button
            onClick={() => sendReportEmail('inventory', setExportLoading)}
            disabled={exportLoading || loading}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Gửi Email
          </button>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái tồn kho</label>
          <select
            className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            value={filters.stockStatus}
            onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="out">Hết hàng</option>
            <option value="low">Dưới 20 sản phẩm</option>
            <option value="available">Còn hàng (trên 20 sản phẩm)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
          <select
            className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((category, index) => (
              <option key={index} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sắp xếp theo</label>
          <select
            className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="name">Tên sản phẩm</option>
            <option value="stock-asc">Tồn kho (thấp đến cao)</option>
            <option value="stock-desc">Tồn kho (cao đến thấp)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-60">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
          <span className="text-gray-700 text-lg">Đang tải dữ liệu tồn kho...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center h-60 bg-red-50 rounded-lg p-6">
          <div className="text-red-500 text-xl mb-2">⚠️ Lỗi khi tải dữ liệu</div>
          <p className="text-gray-700">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Tải lại trang
          </button>
        </div>
      ) : filteredInventory.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="h-80">
              <h3 className="text-lg font-semibold mb-2 text-center">Top 10 sản phẩm tồn kho nhiều nhất</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name && name.length > 15 ? name.substring(0, 12) + '...' : name || 'Không tên'} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="stock"
                    nameKey="name"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, entry) => {
                      return [`${value} sản phẩm`, entry && entry.payload && entry.payload.name ? entry.payload.name : "Số lượng"];
                    }} 
                  />
                  <Legend formatter={(value) => value || 'Không tên'} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="h-80">
              <h3 className="text-lg font-semibold mb-2 text-center">Tồn kho theo danh mục</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={80}
                    tick={{ 
                      fontSize: 12,
                      width: 80,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}
                    tickFormatter={(value) => {
                      return value && value.length > 10 ? value.substring(0, 8) + '...' : (value || 'Không phân loại');
                    }}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === "totalStock") return [`${value} sản phẩm`, "Tổng số lượng"];
                      if (name === "itemCount") return [`${value}`, "Số loại sản phẩm"];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="totalStock" name="Tổng số lượng" fill="#4ade80" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thương hiệu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Xuất xứ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tồn kho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn vị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá trị tồn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item, index) => (
                  <tr key={index} className={item.stock <= 5 ? "bg-red-50" : (item.stock <= 20 ? "bg-yellow-50" : "")}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                      {item.image && (
                        <img 
                          src={item.image.startsWith('http') ? item.image : `/images/products/${item.image}`} 
                          alt={item.name || 'Sản phẩm'}
                          className="w-10 h-10 object-cover rounded-md mr-2"
                          onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = "/placeholder-image.png"; 
                          }}
                        />
                      )}
                      <span>{item.name || 'Không xác định'}</span>
                      {item.sku && <span className="ml-2 text-xs text-gray-500">({item.sku})</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category || 'Không phân loại'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.brand || "Không có"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.origin || "Không có"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(item.price || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.stock || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.weight ? `${item.weight} ${item.unit || 'gram'}` : item.unit || 'gram'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(item.value || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.status === 'Hết hàng'
                            ? "bg-red-100 text-red-800"
                            : item.status === 'Sắp hết'
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {item.status || 'Không rõ'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="flex flex-col justify-center items-center h-60 bg-gray-50 rounded-lg">
          <div className="text-gray-500 text-xl mb-2">Không có dữ liệu tồn kho</div>
          <p className="text-gray-500">Không tìm thấy sản phẩm nào phù hợp với bộ lọc</p>
          {filters.category !== 'all' || filters.stockStatus !== 'all' ? (
            <button 
              onClick={() => setFilters({stockStatus: 'all', category: 'all', sortBy: 'name'})}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Xóa bộ lọc
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

// Thêm prop types validation
InventoryReport.propTypes = {
  inventory: PropTypes.array,
  exportToPDF: PropTypes.func,
  exportToExcel: PropTypes.func,
  sendReportEmail: PropTypes.func,
  exportLoading: PropTypes.bool,
  setExportLoading: PropTypes.func
};

export default InventoryReport; 