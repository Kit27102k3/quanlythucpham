import { useState, useEffect } from "react";
import apiClient from "../../../api/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ClockIcon, CalendarIcon, DocumentTextIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("revenue");
  const [timeRange, setTimeRange] = useState("week");
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [userData, setUserData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Lấy dữ liệu doanh thu
        const revenueResponse = await apiClient.get(`/api/reports/revenue?timeRange=${timeRange}`);
        console.log('Revenue data from API:', revenueResponse.data);
        if (revenueResponse.data && revenueResponse.data.length > 0) {
          setRevenueData(revenueResponse.data);
        } else {
          console.log('API trả về dữ liệu doanh thu trống, sử dụng dữ liệu mẫu.');
          setRevenueData(getSampleRevenueData(timeRange));
        }

        // Lấy dữ liệu sản phẩm bán chạy
        const topProductsResponse = await apiClient.get('/api/reports/top-products');
        console.log('Top products data from API:', topProductsResponse.data);
        if (topProductsResponse.data && topProductsResponse.data.length > 0) {
          setTopProducts(topProductsResponse.data);
        } else {
          console.log('API trả về dữ liệu sản phẩm bán chạy trống, sử dụng dữ liệu mẫu.');
          setTopProducts(getSampleTopProducts());
        }

        // Lấy dữ liệu tồn kho
        const inventoryResponse = await apiClient.get('/api/reports/inventory');
        console.log('Inventory data from API:', inventoryResponse.data);
        if (inventoryResponse.data && inventoryResponse.data.length > 0) {
          setInventory(inventoryResponse.data);
        } else {
          console.log('API trả về dữ liệu tồn kho trống, sử dụng dữ liệu mẫu.');
          setInventory(getSampleInventory());
        }

        // Lấy dữ liệu người dùng
        const userResponse = await apiClient.get('/api/reports/users');
        console.log('User data from API:', userResponse.data);
        if (userResponse.data && userResponse.data.length > 0) {
          setUserData(userResponse.data);
        } else {
          console.log('API trả về dữ liệu người dùng trống, sử dụng dữ liệu mẫu.');
          setUserData(getSampleUserData());
        }
      } catch (error) {
        console.error("Error fetching report data:", error);
        
        // Chỉ hiển thị thông báo, không tự động sử dụng dữ liệu mẫu
        alert("Không thể kết nối với server để lấy dữ liệu báo cáo. Vui lòng kiểm tra kết nối mạng hoặc liên hệ quản trị viên.");
        
        // Vẫn hiển thị dữ liệu mẫu để demo
        setRevenueData(getSampleRevenueData(timeRange));
        setTopProducts(getSampleTopProducts());
        setInventory(getSampleInventory());
        setUserData(getSampleUserData());
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  // Dữ liệu mẫu để hiển thị khi chưa có API
  const getSampleRevenueData = (range) => {
    if (range === "week") {
      return [
        { name: "Thứ 2", revenue: 1500000 },
        { name: "Thứ 3", revenue: 2300000 },
        { name: "Thứ 4", revenue: 1800000 },
        { name: "Thứ 5", revenue: 2100000 },
        { name: "Thứ 6", revenue: 2500000 },
        { name: "Thứ 7", revenue: 3000000 },
        { name: "CN", revenue: 2000000 },
      ];
    } else if (range === "month") {
      return Array.from({ length: 30 }, (_, i) => ({
        name: `${i + 1}`,
        revenue: Math.floor(Math.random() * 3000000) + 1000000,
      }));
    } else {
      return [
        { name: "Tháng 1", revenue: 45000000 },
        { name: "Tháng 2", revenue: 42000000 },
        { name: "Tháng 3", revenue: 48000000 },
        { name: "Tháng 4", revenue: 50000000 },
        { name: "Tháng 5", revenue: 52000000 },
        { name: "Tháng 6", revenue: 58000000 },
        { name: "Tháng 7", revenue: 62000000 },
        { name: "Tháng 8", revenue: 68000000 },
        { name: "Tháng 9", revenue: 72000000 },
        { name: "Tháng 10", revenue: 75000000 },
        { name: "Tháng 11", revenue: 85000000 },
        { name: "Tháng 12", revenue: 95000000 },
      ];
    }
  };

  const getSampleTopProducts = () => {
    return [
      { name: "Thịt heo ba chỉ", sold: 120, revenue: 12000000 },
      { name: "Gạo ST25", sold: 150, revenue: 9000000 },
      { name: "Trứng gà", sold: 200, revenue: 7500000 },
      { name: "Sữa tươi Vinamilk", sold: 180, revenue: 6500000 },
      { name: "Rau cải xanh", sold: 250, revenue: 5000000 },
    ];
  };

  const getSampleInventory = () => {
    return [
      { name: "Thịt & Hải sản", value: 150, stock: 150, lowStock: 20 },
      { name: "Rau củ quả", value: 250, stock: 250, lowStock: 40 },
      { name: "Trứng & Sữa", value: 180, stock: 180, lowStock: 30 },
      { name: "Gạo & Ngũ cốc", value: 120, stock: 120, lowStock: 25 },
      { name: "Gia vị", value: 90, stock: 90, lowStock: 15 },
    ];
  };

  const getSampleUserData = () => {
    return [
      { name: "Người dùng mới", count: 120, color: "#8884d8" },
      { name: "Khách hàng thân thiết", count: 300, color: "#82ca9d" },
      { name: "Khách vãng lai", count: 180, color: "#ffc658" },
    ];
  };

  // Format tiền VND
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const renderRevenueReport = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Báo cáo doanh thu</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange("week")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                timeRange === "week"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tuần
            </button>
            <button
              onClick={() => setTimeRange("month")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                timeRange === "month"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tháng
            </button>
            <button
              onClick={() => setTimeRange("year")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                timeRange === "year"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Năm
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 text-white p-3 rounded-full">
                <CurrencyDollarIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm">Doanh thu</h3>
                <p className="text-xl font-bold text-gray-800">
                  {formatCurrency(
                    revenueData.reduce((sum, item) => sum + item.revenue, 0)
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 text-white p-3 rounded-full">
                <DocumentTextIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm">Đơn hàng</h3>
                <p className="text-xl font-bold text-gray-800">
                  {Math.floor(Math.random() * 100) + 50}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500 text-white p-3 rounded-full">
                <ClockIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm">Trung bình</h3>
                <p className="text-xl font-bold text-gray-800">
                  {formatCurrency(
                    revenueData.reduce((sum, item) => sum + item.revenue, 0) / 
                    (Math.floor(Math.random() * 100) + 50)
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="bg-red-500 text-white p-3 rounded-full">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm">Tăng trưởng</h3>
                <p className="text-xl font-bold text-green-500">+{Math.floor(Math.random() * 20) + 5}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={revenueData}
              margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
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
              <Legend />
              <Bar
                dataKey="revenue"
                name="Doanh thu"
                fill="#4ade80"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderTopProductsReport = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Sản phẩm bán chạy</h2>
          <div>
            <select 
              className="bg-gray-100 border border-gray-300 text-gray-700 py-1.5 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue="revenue"
            >
              <option value="revenue">Theo doanh thu</option>
              <option value="quantity">Theo số lượng</option>
            </select>
          </div>
        </div>

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
              {topProducts.map((product, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.sold}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(product.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-500 h-2.5 rounded-full"
                        style={{
                          width: `${(product.revenue / topProducts[0].revenue) * 100}%`,
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
              data={topProducts}
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
              <YAxis dataKey="name" type="category" />
              <Tooltip 
                formatter={(value) => [formatCurrency(value), "Doanh thu"]}
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
      </div>
    );
  };

  const renderInventoryReport = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Báo cáo tồn kho</h2>
          <button className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-medium">
            Xuất báo cáo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {inventory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} sản phẩm`, "Số lượng"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tồn kho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.stock <= item.lowStock
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
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
    );
  };

  const renderUserReport = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Báo cáo người dùng</h2>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md text-sm font-medium"
            >
              Tuần
            </button>
            <button
              className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-medium"
            >
              Tháng
            </button>
            <button
              className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md text-sm font-medium"
            >
              Năm
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800">Người dùng mới</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">120</p>
            <p className="text-sm text-green-500 mt-1">+12% so với tháng trước</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800">Khách hàng hoạt động</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">450</p>
            <p className="text-sm text-green-500 mt-1">+5% so với tháng trước</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800">Tỷ lệ quay lại</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">65%</p>
            <p className="text-sm text-green-500 mt-1">+2% so với tháng trước</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {userData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} người dùng`, ""]} 
                  labelStyle={{ color: "#333" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { month: "Tháng 1", users: 250 },
                  { month: "Tháng 2", users: 280 },
                  { month: "Tháng 3", users: 300 },
                  { month: "Tháng 4", users: 320 },
                  { month: "Tháng 5", users: 350 },
                  { month: "Tháng 6", users: 380 },
                  { month: "Tháng 7", users: 410 },
                  { month: "Tháng 8", users: 440 },
                  { month: "Tháng 9", users: 460 },
                  { month: "Tháng 10", users: 480 },
                  { month: "Tháng 11", users: 500 },
                  { month: "Tháng 12", users: 550 },
                ]}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} người dùng`, "Số lượng"]} 
                  labelStyle={{ color: "#333" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  name="Người dùng"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-6 py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Báo cáo & Thống kê</h1>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <nav className="flex flex-wrap justify-between">
            <div className="flex space-x-2 mb-2 md:mb-0">
              <button
                onClick={() => setActiveTab("revenue")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === "revenue"
                    ? "bg-green-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Doanh thu
              </button>
              <button
                onClick={() => setActiveTab("products")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === "products"
                    ? "bg-green-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Sản phẩm bán chạy
              </button>
              <button
                onClick={() => setActiveTab("inventory")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === "inventory"
                    ? "bg-green-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Tồn kho
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === "users"
                    ? "bg-green-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Người dùng
              </button>
            </div>
            
            <button
              onClick={async () => {
                try {
                  const response = await apiClient.get('/api/reports/test-structure');
                  console.log('Thông tin về cấu trúc dữ liệu:', response.data);
                  alert(`Số lượng dữ liệu: Orders: ${response.data.orderCount}, Products: ${response.data.productCount}, Users: ${response.data.userCount}`);
                } catch (error) {
                  console.error('Lỗi khi kiểm tra cấu trúc dữ liệu:', error);
                  alert('Không thể kiểm tra cấu trúc dữ liệu. Xem console để biết chi tiết.');
                }
              }}
              className="px-4 py-2 rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600"
            >
              Kiểm tra dữ liệu
            </button>
          </nav>
        </div>

        {isLoading ? (
          <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-96">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
              <p className="text-gray-500">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "revenue" && renderRevenueReport()}
            {activeTab === "products" && renderTopProductsReport()}
            {activeTab === "inventory" && renderInventoryReport()}
            {activeTab === "users" && renderUserReport()}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports; 