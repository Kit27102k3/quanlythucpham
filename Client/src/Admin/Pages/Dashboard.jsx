/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  Sector,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  ShoppingCart,
  Users,
  Box,
  TrendingUp,
  ChevronUp,
  BarChart2,
} from "lucide-react";
import dashboardApi from "../../api/dashboardApi";
import formatCurrency from '../../User/Until/FotmatPrice';

// Bảng màu đẹp và hài hòa
const COLORS = ["#6366f1", "#10b981", "#f97316", "#6366f1", "#8b5cf6"];
const ORDER_STATUS_COLORS = {
  "pending": "#eab308",
  "awaiting_payment": "#f97316",
  "completed": "#10b981",
  "cancelled": "#ef4444",
  "shipping": "#3b82f6",
  "Đang xử lý": "#eab308",
  "Chờ thanh toán": "#f97316",
  "Đã giao hàng": "#10b981",
  "Đã hủy": "#ef4444",
  "Đang giao": "#3b82f6"
};

// Tùy chỉnh tooltip cho biểu đồ
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg">
        <p className="font-semibold text-gray-700">{label}</p>
        {payload.map((entry, index) => {
          // Kiểm tra giá trị hợp lệ
          const value = entry.value !== undefined && entry.value !== null && !isNaN(entry.value) 
            ? entry.value 
            : 0;
            
          // Xác định hiển thị giá trị
          const displayValue = entry.name === "Doanh Thu" || entry.name === "doanh_thu" 
            ? formatCurrency(value) 
            : value;
            
          return (
            <p key={`item-${index}`} style={{ color: entry.color }} className="flex items-center mt-1">
              <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
              <span className="mr-2">
                {entry.name === "Doanh Thu" || entry.name === "doanh_thu" 
                  ? "Doanh Thu" 
                  : entry.name === "Đơn Hàng" || entry.name === "don_hang" 
                    ? "Đơn Hàng" 
                    : entry.name}:
              </span>
              <span className="font-medium">{displayValue}</span>
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

// Component ô hiển thị số liệu tổng quan
const StatCard = ({ icon: Icon, title, value, bgColor }) => (
  <div className={`${bgColor} p-3 md:p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-700 text-xs md:text-sm font-medium mb-1">{title}</p>
        <h3 className="text-lg md:text-2xl font-bold text-gray-800">{value}</h3>
      </div>
      <div className={`p-2 md:p-3 rounded-full ${bgColor === 'bg-blue-100' ? 'bg-blue-200' : 
                          bgColor === 'bg-green-100' ? 'bg-green-200' : 
                          bgColor === 'bg-yellow-100' ? 'bg-yellow-200' : 'bg-purple-200'}`}>
        <Icon size={18} className={`${bgColor === 'bg-blue-100' ? 'text-blue-600' : 
                                    bgColor === 'bg-green-100' ? 'text-green-600' : 
                                    bgColor === 'bg-yellow-100' ? 'text-yellow-600' : 'text-purple-600'}`} />
      </div>
    </div>
    {title === "Doanh Thu" && (
      <div className="flex items-center mt-2 text-green-600 text-xs font-medium">
        <ChevronUp size={14} />
        <span>12% so với tháng trước</span>
      </div>
    )}
  </div>
);

// Component tiêu đề phần
const SectionTitle = ({ title, icon: Icon }) => (
  <div className="flex items-center mb-4">
    {Icon && <Icon size={18} className="text-indigo-600 mr-2" />}
    <h3 className="text-base md:text-lg font-semibold text-gray-800">{title}</h3>
  </div>
);

// Component nút chọn
const TimeButton = ({ active, onClick, children }) => (
  <button
    className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors ${
      active ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);

// Hiệu ứng khi hover trên biểu đồ tròn
const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" fontSize={12}>{payload.name}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" fontSize={12}>
        {`${(percent * 100).toFixed(2)}%`}
      </text>
    </g>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('daily');
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeOrderIndex, setActiveOrderIndex] = useState(0);

  const fetchStats = async () => {
    try {
      const response = await dashboardApi.getDashboardStats();
      
      if (response && response.success) {
        console.log("Dashboard API response:", response.data);
        
        // Kiểm tra và xử lý dữ liệu doanh thu trước khi lưu vào state
        if (!response.data.dailyRevenue) {
          console.warn("Không có dữ liệu doanh thu theo ngày");
          response.data.dailyRevenue = []; // Đảm bảo có mảng rỗng để tránh lỗi
        }
        
        if (!response.data.weeklyRevenue) {
          console.warn("Không có dữ liệu doanh thu theo tuần");
          response.data.weeklyRevenue = []; // Đảm bảo có mảng rỗng để tránh lỗi
        }
        
        if (!response.data.monthlyRevenue) {
          console.warn("Không có dữ liệu doanh thu theo tháng");
          response.data.monthlyRevenue = []; // Đảm bảo có mảng rỗng để tránh lỗi
        }
        
        // Kiểm tra tổng doanh thu
        if (response.data.totalRevenue === undefined || response.data.totalRevenue === null) {
          console.warn("Không có dữ liệu tổng doanh thu");
          response.data.totalRevenue = 0; // Đặt giá trị mặc định
        }
        
        console.log("Product categories:", response.data.productsByCategory);
        setStats(response.data);
      } else {
        setError(response?.message || "Không thể tải dữ liệu");
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getRevenueData = () => {
    if (!stats) return [];

    try {
      let result = [];
      
      switch (timeRange) {
        case 'daily':
          // Kiểm tra dữ liệu mỗi ngày
          if (Array.isArray(stats.dailyRevenue) && stats.dailyRevenue.length > 0) {
            result = stats.dailyRevenue
              .filter(item => item && item._id && item._id.year && item._id.month && item._id.day)
              .map(item => ({
                date: formatDate(new Date(item._id.year, item._id.month - 1, item._id.day)),
                doanh_thu: item.revenue || 0,
                don_hang: item.orders || 0
              }))
              .slice(-7);
          }
          break;
          
        case 'weekly':
          // Kiểm tra dữ liệu mỗi tuần
          if (Array.isArray(stats.weeklyRevenue) && stats.weeklyRevenue.length > 0) {
            result = stats.weeklyRevenue
              .filter(item => item && item._id && item._id.week && item._id.year)
              .map(item => ({
                date: `Tuần ${item._id.week}/${item._id.year}`,
                doanh_thu: item.revenue || 0,
                don_hang: item.orders || 0
              }));
          }
          break;
          
        case 'monthly':
          // Kiểm tra dữ liệu mỗi tháng
          if (Array.isArray(stats.monthlyRevenue) && stats.monthlyRevenue.length > 0) {
            result = stats.monthlyRevenue
              .filter(item => item && item._id && item._id.month && item._id.year)
              .map(item => ({
                date: `Tháng ${item._id.month}/${item._id.year}`,
                doanh_thu: item.revenue || 0,
                don_hang: item.orders || 0
              }));
          }
          break;
          
        default:
          result = [];
      }
      
      // Nếu không có dữ liệu, tạo dữ liệu mẫu để tránh biểu đồ trống
      if (result.length === 0) {
        console.warn(`Không có dữ liệu doanh thu cho ${timeRange}`);
        
        // Tạo dữ liệu mẫu cho 7 ngày gần nhất
        if (timeRange === 'daily') {
          const today = new Date();
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            result.push({
              date: formatDate(date),
              doanh_thu: 0,
              don_hang: 0
            });
          }
        } 
        // Tạo dữ liệu mẫu cho 4 tuần gần nhất
        else if (timeRange === 'weekly') {
          for (let i = 4; i >= 1; i--) {
            result.push({
              date: `Tuần ${i}/${new Date().getFullYear()}`,
              doanh_thu: 0,
              don_hang: 0
            });
          }
        }
        // Tạo dữ liệu mẫu cho 6 tháng gần nhất
        else if (timeRange === 'monthly') {
          const today = new Date();
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();
          
          for (let i = 5; i >= 0; i--) {
            let month = currentMonth - i;
            let year = currentYear;
            
            if (month < 0) {
              month += 12;
              year -= 1;
            }
            
            result.push({
              date: `Tháng ${month + 1}/${year}`,
              doanh_thu: 0,
              don_hang: 0
            });
          }
        }
      }
      
      console.log(`Dữ liệu biểu đồ doanh thu (${timeRange}):`, result);
      return result;
    } catch (error) {
      console.error("Lỗi xử lý dữ liệu doanh thu:", error);
      return [];
    }
  };

  const getOrderStatusData = () => {
    if (!stats || !stats.ordersByStatus) return [];
    
    const statusTranslation = {
      "pending": "Đang xử lý",
      "awaiting_payment": "Chờ thanh toán",
      "completed": "Đã giao hàng",
      "cancelled": "Đã hủy"
    };
    
    const requiredStatuses = ["Đã giao hàng", "Đã hủy", "Đang xử lý", "Chờ thanh toán"];
    
    const transformedData = stats.ordersByStatus.map(item => ({
      name: statusTranslation[item.name] || item.name,
      value: item.value
    }));
    
    const existingStatuses = transformedData.map(item => item.name);
    
    const result = [...transformedData];
    
    requiredStatuses.forEach(status => {
      if (!existingStatuses.includes(status)) {
        result.push({ name: status, value: 0 });
      }
    });
    
    return result;
  };

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onOrderPieEnter = (_, index) => {
    setActiveOrderIndex(index);
  };

  const gradientOffset = (data) => {
    const dataMax = Math.max(...data.map((i) => i.completed));
    const dataMin = Math.min(...data.map((i) => i.completed));
  
    if (dataMax <= 0) {
      return 0;
    }
    if (dataMin >= 0) {
      return 1;
    }
  
    return dataMax / (dataMax - dataMin);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
          <p className="ml-4 text-lg font-medium text-gray-700">Đang tải thông tin...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-lg max-w-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Lỗi khi tải dữ liệu</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!stats) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-5 rounded-lg max-w-lg">
            <p className="text-yellow-700">Không có dữ liệu thống kê khả dụng</p>
          </div>
        </div>
      );
    }

    const revenueData = getRevenueData();
    const orderStatusData = getOrderStatusData();
    const orderComparisonData = stats.dailyRevenue && stats.dailyRevenue.length > 0 
      ? stats.dailyRevenue
          .map(item => ({
            date: formatDate(new Date(item._id.year, item._id.month - 1, item._id.day)),
            completed: Math.floor(item.orders * 0.65),
            cancelled: Math.floor(item.orders * 0.35)
          }))
          .slice(-14)
          .reverse()
      : [];

    const categoryData = stats.productsByCategory 
      ? stats.productsByCategory
          .filter(category => category && category.name)
          .map(category => ({
            name: category.name,
            value: category.value || 0,
            tooltip: `${category.value || 0} sản phẩm`
          }))
          .sort((a, b) => b.value - a.value)
      : [];

    const topProducts = stats.topProducts && stats.topProducts.length > 0
      ? stats.topProducts
          .map((product, index) => ({
            name: product.name,
            value: product.soldQuantity,
            fill: COLORS[index % COLORS.length],
            tooltip: `Đã bán: ${product.soldQuantity} sản phẩm`
          }))
          .slice(0, 5)
      : [];

    // Đảm bảo totalRevenue luôn là số hợp lệ
    const totalRevenue = typeof stats.totalRevenue === 'number' && !isNaN(stats.totalRevenue) 
      ? stats.totalRevenue 
      : 0;

    return (
      <div className="p-3 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 md:mb-0">Tổng Quan</h2>
          <div className="flex items-center text-xs md:text-sm text-gray-500">
            <span className="mr-2">Cập nhật gần nhất:</span>
            <span className="font-medium">{new Date().toLocaleString('vi-VN')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <StatCard 
            icon={TrendingUp} 
            title="Doanh Thu" 
            value={formatCurrency(totalRevenue)} 
            bgColor="bg-blue-100" 
          />
          <StatCard 
            icon={ShoppingCart} 
            title="Đơn Hàng" 
            value={stats.totalOrders || 0} 
            bgColor="bg-green-100" 
          />
          <StatCard 
            icon={Box} 
            title="Sản Phẩm" 
            value={stats.totalProducts || 0} 
            bgColor="bg-yellow-100" 
          />
          <StatCard 
            icon={Users} 
            title="Khách Hàng" 
            value={stats.totalCustomers || 0} 
            bgColor="bg-purple-100" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white shadow-md rounded-lg p-3 md:p-5 hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6">
              <SectionTitle title="Doanh Thu & Đơn Hàng" icon={BarChart2} />
              <div className="flex gap-1 md:gap-2 mt-2 sm:mt-0">
                <TimeButton 
                  active={timeRange === 'daily'} 
                  onClick={() => setTimeRange('daily')}
                >
                  Ngày
                </TimeButton>
                <TimeButton 
                  active={timeRange === 'weekly'} 
                  onClick={() => setTimeRange('weekly')}
                >
                  Tuần
                </TimeButton>
                <TimeButton 
                  active={timeRange === 'monthly'} 
                  onClick={() => setTimeRange('monthly')}
                >
                  Tháng
                </TimeButton>
              </div>
            </div>
            <div className="h-[250px] md:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#6b7280', fontSize: 10 }} 
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => {
                      if (value === undefined || value === null || isNaN(value)) return '0';
                      return value >= 1000000 
                        ? `${(value / 1000000).toFixed(1)}M` 
                        : value >= 1000 
                          ? `${(value / 1000).toFixed(0)}K` 
                          : value;
                    }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: 10 }}
                    iconType="circle"
                    formatter={(value) => {
                      let displayValue = value;
                      if (value === "doanh_thu") displayValue = "Doanh Thu";
                      if (value === "don_hang") displayValue = "Đơn Hàng";
                      return <span className="text-sm font-medium text-gray-700">{displayValue}</span>;
                    }} 
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="doanh_thu" 
                    name="Doanh Thu" 
                    fill="#6366f1" 
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                    isAnimationActive={true}
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="don_hang" 
                    name="Đơn Hàng" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                    isAnimationActive={true}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-3 md:p-5 hover:shadow-lg transition-shadow duration-300">
            <SectionTitle title="Phân Loại Sản Phẩm" icon={Box} />
            {categoryData && categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <defs>
                    {categoryData.map((entry, index) => (
                      <linearGradient 
                        key={`gradient-${index}`} 
                        id={`color-${index}`} 
                        x1="0" y1="0" x2="1" y2="1"
                      >
                        <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8}/>
                        <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={1}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`url(#color-${index})`}
                        stroke="#fff"
                        strokeWidth={1.5}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => {
                      const category = props.payload;
                      return [category.tooltip || `${value} sản phẩm`, name];
                    }} 
                    wrapperStyle={{ outline: 'none' }}
                    contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend 
                    layout="vertical"
                    align="right" 
                    verticalAlign="middle"
                    iconSize={10}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-sm font-medium text-gray-700">
                        {value} <span className="text-xs text-gray-500">({categoryData.find(c => c.name === value)?.value || 0} sản phẩm)</span>
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-500 text-center">
                  <p className="mb-2">Không có dữ liệu phân loại sản phẩm</p>
                  <p>Vui lòng kiểm tra lại kết nối hoặc thử lại sau</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white shadow-md rounded-lg p-3 md:p-5 hover:shadow-lg transition-shadow duration-300">
            <SectionTitle title="Top 5 Sản Phẩm Bán Chạy" icon={Box} />
            {topProducts && topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="20%" 
                  outerRadius="90%" 
                  barSize={20} 
                  data={topProducts}
                >
                  <RadialBar
                    minAngle={15}
                    background
                    clockWise
                    dataKey="value"
                    cornerRadius={12}
                    label={{
                      position: 'insideStart',
                      fill: '#fff',
                      fontSize: 12,
                      formatter: (value) => `${value} sp`
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg">
                            <p className="font-semibold text-gray-700">{payload[0].payload.name}</p>
                            <p className="text-sm mt-1">
                              <span className="font-medium">Đã bán: </span>
                              <span className="text-indigo-600">{payload[0].value} sản phẩm</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{
                      paddingLeft: '10px'
                    }}
                    formatter={(value, entry) => (
                      <span className="text-sm font-medium text-gray-700">
                        {entry.payload.name} <span className="text-xs text-gray-500">({entry.payload.value} sp)</span>
                      </span>
                    )}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-500 text-center">
                  <p className="mb-2">Không có dữ liệu sản phẩm bán chạy</p>
                  <p>Vui lòng kiểm tra lại kết nối hoặc thử lại sau</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white shadow-md rounded-lg p-3 md:p-5 hover:shadow-lg transition-shadow duration-300">
            <SectionTitle title="Trạng Thái Đơn Hàng" icon={ShoppingCart} />
            {orderStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <defs>
                    {orderStatusData.map((entry, index) => (
                      <linearGradient 
                        key={`gradient-order-${index}`} 
                        id={`color-order-${index}`} 
                        x1="0" y1="0" x2="1" y2="1"
                      >
                        <stop 
                          offset="0%" 
                          stopColor={ORDER_STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                          stopOpacity={0.8}
                        />
                        <stop 
                          offset="100%" 
                          stopColor={ORDER_STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                          stopOpacity={1}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    activeIndex={activeOrderIndex}
                    activeShape={renderActiveShape}
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    onMouseEnter={onOrderPieEnter}
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-order-${index}`} 
                        fill={`url(#color-order-${index})`}
                        stroke="#fff"
                        strokeWidth={1.5}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, name]} 
                    wrapperStyle={{ outline: 'none' }}
                    contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend 
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle"
                    iconSize={10}
                    iconType="circle"
                    formatter={(value) => (
                      <span style={{ color: ORDER_STATUS_COLORS[value] || '#333' }} className="text-sm font-medium">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-500 text-center">
                  <p className="mb-2">Không có dữ liệu trạng thái đơn hàng</p>
                  <p>Vui lòng kiểm tra lại kết nối hoặc thử lại sau</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white shadow-md rounded-lg p-3 md:p-5 hover:shadow-lg transition-shadow duration-300">
            <SectionTitle title="Đơn Hàng Đã Giao vs Đã Hủy" />
            {orderComparisonData && orderComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart
                  data={orderComparisonData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ORDER_STATUS_COLORS.completed} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={ORDER_STATUS_COLORS.completed} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCancelled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ORDER_STATUS_COLORS.cancelled} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={ORDER_STATUS_COLORS.cancelled} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    angle={-25}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    iconType="circle"
                    formatter={(value) => {
                      let displayValue = value;
                      if (value === "completed") displayValue = "Đã giao hàng";
                      if (value === "cancelled") displayValue = "Đã hủy";
                      
                      const color = value === "completed" ? ORDER_STATUS_COLORS.completed : ORDER_STATUS_COLORS.cancelled;
                      return <span style={{ color }} className="text-sm font-medium">{displayValue}</span>;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    name="Đã giao hàng" 
                    stroke={ORDER_STATUS_COLORS.completed}
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                    strokeWidth={2}
                    activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cancelled" 
                    name="Đã hủy" 
                    stroke={ORDER_STATUS_COLORS.cancelled} 
                    fillOpacity={1}
                    fill="url(#colorCancelled)"
                    strokeWidth={2}
                    activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-500 text-center">
                  <p className="mb-2">Không có dữ liệu so sánh đơn hàng</p>
                  <p>Vui lòng kiểm tra lại kết nối hoặc thử lại sau</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto min-h-screen">
        {renderContent()}
    </div>
  );
};

export default Dashboard;
