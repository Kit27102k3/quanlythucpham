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
} from "recharts";
import {
  ShoppingCart,
  Users,
  Box,
  TrendingUp,
} from "lucide-react";
import dashboardApi from "../../api/dashboardApi";
import formatCurrency from '../../User/Until/FotmatPrice'

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('daily'); // 'daily', 'weekly', 'monthly'

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardApi.getDashboardStats();
        
        if (response.success) {
          setStats(response.data);
        } else {
          setError(response.message || "Không thể tải dữ liệu");
        }
      } catch (err) {
        console.error("Dashboard error:", err);
        setError(err.message || "Có lỗi xảy ra khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

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

    switch (timeRange) {
      case 'daily':
        return stats.dailyRevenue.map(item => ({
          date: formatDate(new Date(item._id.year, item._id.month - 1, item._id.day)),
          doanh_thu: item.revenue,
          don_hang: item.orders
        }));
      case 'weekly':
        return stats.weeklyRevenue.map(item => ({
          date: `Tuần ${item._id.week}/${item._id.year}`,
          doanh_thu: item.revenue,
          don_hang: item.orders
        }));
      case 'monthly':
        return stats.monthlyRevenue.map(item => ({
          date: `Tháng ${item._id.month}/${item._id.year}`,
          doanh_thu: item.revenue,
          don_hang: item.orders
        }));
      default:
        return [];
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="p-6">Đang tải dữ liệu...</div>;
    }

    if (error) {
      return <div className="p-6 text-red-500">{error}</div>;
    }

    if (!stats) {
      return <div className="p-6">Không có dữ liệu</div>;
    }

    const revenueData = getRevenueData();

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Tổng Quan</h2>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-100 p-4 rounded-lg flex items-center">
            <TrendingUp className="mr-3" />
            <div>
              <p className="text-sm">Doanh Thu</p>
              <h3 className="text-xl font-bold">{formatCurrency(stats.totalRevenue)}</h3>
            </div>
          </div>
          <div className="bg-green-100 p-4 rounded-lg flex items-center">
            <ShoppingCart className="mr-3" />
            <div>
              <p className="text-sm">Đơn Hàng</p>
              <h3 className="text-xl font-bold">{stats.totalOrders}</h3>
            </div>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg flex items-center">
            <Box className="mr-3" />
            <div>
              <p className="text-sm">Sản Phẩm</p>
              <h3 className="text-xl font-bold">{stats.totalProducts}</h3>
            </div>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg flex items-center">
            <Users className="mr-3" />
            <div>
              <p className="text-sm">Khách Hàng</p>
              <h3 className="text-xl font-bold">{stats.totalCustomers}</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white shadow-lg rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Doanh Thu</h3>
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded ${
                    timeRange === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                  onClick={() => setTimeRange('daily')}
                >
                  Theo Ngày
                </button>
                <button
                  className={`px-3 py-1 rounded ${
                    timeRange === 'weekly' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                  onClick={() => setTimeRange('weekly')}
                >
                  Theo Tuần
                </button>
                <button
                  className={`px-3 py-1 rounded ${
                    timeRange === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                  onClick={() => setTimeRange('monthly')}
                >
                  Theo Tháng
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="doanh_thu" fill="#8884d8" name="Doanh Thu" />
                <Bar dataKey="don_hang" fill="#82ca9d" name="Đơn Hàng" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Nhóm Sản Phẩm</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.productsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.productsByCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center p-3 mb-2 cursor-pointer">
      <div className="flex-1 bg-gray-100 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
