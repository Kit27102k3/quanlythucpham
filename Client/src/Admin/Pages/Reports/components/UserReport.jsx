import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const UserReport = ({ userData, exportToPDF, exportToExcel, sendReportEmail, exportLoading, setExportLoading }) => {
  // Handle case where userData is null, undefined, or not in expected format
  const usersByRegion = userData?.usersByRegion || [];
  
  // Add colors to usersByRegion data
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const regionData = usersByRegion.map((region, index) => ({
    ...region,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div id="user-report" className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Báo cáo người dùng</h2>
        <div className="flex gap-2">
          <button
            onClick={() => exportToPDF('user-report', 'Báo cáo người dùng')}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? 'Đang xuất...' : 'Xuất PDF'}
          </button>
          <button
            onClick={() => exportToExcel(regionData, 'bao-cao-nguoi-dung')}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? 'Đang xuất...' : 'Xuất Excel'}
          </button>
          <button
            onClick={() => sendReportEmail('Báo cáo người dùng', 'user-report')}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? 'Đang gửi...' : 'Gửi Email'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800">Tổng người dùng</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{userData?.totalUsers || 0}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800">Người dùng mới</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{userData?.newUsers || 0}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800">Người dùng hoạt động</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{userData?.activeUsers || 0}</p>
        </div>
      </div>

      {regionData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80">
            <h3 className="text-md font-medium text-gray-800 mb-2">Phân bố người dùng theo khu vực</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="region"
                >
                  {regionData.map((entry, index) => (
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
            <h3 className="text-md font-medium text-gray-800 mb-2">Phân bố người dùng theo độ tuổi</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={userData?.usersByAge || []}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} người dùng`, "Số lượng"]} 
                  labelStyle={{ color: "#333" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Người dùng"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">Không có dữ liệu người dùng theo khu vực</p>
        </div>
      )}
    </div>
  );
};

export default UserReport; 