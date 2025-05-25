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
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  // Tải danh mục từ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const categoriesData = await productsApi.getCategoriesData();
        if (categoriesData && Array.isArray(categoriesData)) {
          setCategories(categoriesData.map(cat => cat.name || cat));
          console.log("Đã tải", categoriesData.length, "danh mục từ API");
        } else {
          console.warn("Dữ liệu danh mục không hợp lệ:", categoriesData);
          setCategories([]);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh mục:", error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, []);
  
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
          } else {
            console.log("Đã tải", data.length, "sản phẩm từ API");
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
  
  // Lấy danh sách danh mục từ dữ liệu tồn kho nếu không có danh mục từ API
  const availableCategories = useMemo(() => {
    if (categories.length > 0) {
      return categories.sort();
    }
    
    if (!localInventory || !Array.isArray(localInventory) || localInventory.length === 0) {
      return [];
    }
    
    const uniqueCategories = [...new Set(localInventory.map(item => item.category || 'Không phân loại'))];
    return uniqueCategories.sort();
  }, [localInventory, categories]);
  
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
    return filteredInventory.reduce((sum, item) => {
      const itemValue = (item.price || 0) * (item.stock || 0);
      return sum + itemValue;
    }, 0);
  }, [filteredInventory]);
  
  // Tính tổng số lượng sản phẩm tồn kho
  const totalStockCount = useMemo(() => {
    return filteredInventory.reduce((sum, item) => sum + (item.stock || 0), 0);
  }, [filteredInventory]);
  
  // Làm mới dữ liệu
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await productsApi.getInventoryData();
      if (data && Array.isArray(data)) {
        setLocalInventory(data);
        toast.success('Đã cập nhật dữ liệu tồn kho');
      } else {
        setError('Dữ liệu tồn kho không hợp lệ');
        toast.error('Không thể tải dữ liệu tồn kho');
      }
    } catch (error) {
      console.error('Lỗi khi tải lại dữ liệu tồn kho:', error);
      setError('Lỗi khi tải dữ liệu tồn kho: ' + (error.message || 'Lỗi không xác định'));
      toast.error('Lỗi khi tải lại dữ liệu');
    } finally {
      setLoading(false);
    }
  };
  
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
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {loading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Làm mới
          </button>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Danh mục 
            {loadingCategories && (
              <span className="ml-2 inline-block w-4 h-4 border-t-2 border-gray-500 rounded-full animate-spin"></span>
            )}
          </label>
          <select
            className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            disabled={loadingCategories}
          >
            <option value="all">Tất cả danh mục</option>
            {availableCategories.map((category, index) => (
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
            onClick={handleRefresh} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Tải lại dữ liệu
          </button>
        </div>
      ) : filteredInventory.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="h-80 border border-gray-200 rounded-lg shadow-sm p-4 bg-white">
              <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">Top 10 sản phẩm tồn kho nhiều nhất</h3>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, value }) => 
                      `${name && name.length > 15 ? name.substring(0, 12) + '...' : name || 'Không tên'}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={90}
                    innerRadius={30}
                    paddingAngle={2}
                    fill="#8884d8"
                    dataKey="stock"
                    nameKey="name"
                    stroke="#fff"
                    strokeWidth={1}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, entry) => {
                      return [
                        `${value} sản phẩm (${((value / totalStockCount) * 100).toFixed(1)}%)`, 
                        entry && entry.payload && entry.payload.name ? entry.payload.name : "Sản phẩm"
                      ];
                    }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    itemStyle={{
                      padding: '4px 0'
                    }}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{
                      fontSize: '12px',
                      paddingLeft: '10px'
                    }}
                    formatter={(value) => {
                      return <span style={{ color: '#333', fontSize: '10px' }}>
                        {value && value.length > 16 ? value.substring(0, 14) + '...' : value || 'Không tên'}
                      </span>
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="h-80 border border-gray-200 rounded-lg shadow-sm p-4 bg-white">
              <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">Tồn kho theo danh mục</h3>
              <ResponsiveContainer width="100%" height="90%">
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
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="totalStock" name="Tổng số lượng" fill="#4ade80" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold p-4 bg-gray-50 border-b border-gray-200">Chi tiết tồn kho</h3>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-custom">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
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
                          <div>
                            <div className="font-medium">{item.name || 'Không xác định'}</div>
                            {item.sku && <div className="text-xs text-gray-500">SKU: {item.sku}</div>}
                          </div>
                        </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={`
                          ${item.stock <= 5 ? "text-red-600" : (item.stock <= 20 ? "text-yellow-600" : "text-green-600")}
                        `}>
                          {item.stock || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.weight ? `${item.weight} ${item.unit || 'gram'}` : item.unit || 'gram'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format((item.price || 0) * (item.stock || 0))}
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
          ) : (
            <button 
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Tải lại dữ liệu
            </button>
          )}
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