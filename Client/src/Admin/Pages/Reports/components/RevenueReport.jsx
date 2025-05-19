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
import { 
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";

const RevenueReport = ({ revenueData, timeRange, setTimeRange, formatCurrency }) => {
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

export default RevenueReport; 