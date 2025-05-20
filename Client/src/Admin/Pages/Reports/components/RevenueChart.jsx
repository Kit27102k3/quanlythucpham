import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend
} from "recharts";

// Format currency helper function
const formatVietnameseCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value);
};

const RevenueChart = ({ revenueData, chartType = 'line', formatCurrency }) => {
  const [chartData, setChartData] = useState([]);

  // Hàm định dạng ngày trong tuần theo tiếng Việt
  const formatDayOfWeek = (dateStr) => {
    // Nếu dateStr đã là string ngắn như 'T2', 'T3' thì giữ nguyên
    if (typeof dateStr === 'string' && dateStr.length <= 3) {
      return dateStr;
    }
    
    try {
      const date = new Date(dateStr);
      // Kiểm tra xem date có hợp lệ không
      if (isNaN(date.getTime())) {
        return dateStr; // Trả về string ban đầu nếu không phải date hợp lệ
      }
      
      const day = date.getDay(); // 0 = CN, 1 = T2, ...
      const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return daysOfWeek[day];
    } catch (error) {
      console.error("Error formatting day of week:", error);
      return dateStr; // Trả về string ban đầu nếu có lỗi
    }
  };

  useEffect(() => {
    if (revenueData && Array.isArray(revenueData)) {
      console.log("Processing revenue data for chart:", revenueData);
      
      // Make a copy to avoid modifying the original data
      let processedData = [...revenueData];
      
      // Ensure all data has doanh_thu property
      processedData = processedData.map(item => ({
        date: item.date || '',
        doanh_thu: item.doanh_thu || item.revenue || 0
      }));
      
      setChartData(processedData);
    } else {
      // Fallback data if revenueData is invalid
      console.log("Using fallback chart data");
      setChartData([
        { date: 'T2', doanh_thu: 500000 },
        { date: 'T3', doanh_thu: 700000 },
        { date: 'T4', doanh_thu: 600000 },
        { date: 'T5', doanh_thu: 800000 },
        { date: 'T6', doanh_thu: 900000 },
        { date: 'T7', doanh_thu: 800000 },
        { date: 'CN', doanh_thu: 600000 }
      ]);
    }
  }, [revenueData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      let formattedValue;
      try {
        if (typeof formatCurrency === 'function') {
          formattedValue = formatCurrency(payload[0].value);
        } else {
          formattedValue = formatVietnameseCurrency(payload[0].value);
        }
      } catch (error) {
        console.error("Error formatting currency:", error);
        formattedValue = `${payload[0].value.toLocaleString('vi-VN')} đ`;
      }
      
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="text-sm font-medium text-gray-900">{`Ngày: ${label}`}</p>
          <p className="text-sm text-green-600">
            {`Doanh thu: ${formattedValue}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'line' ? (
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis 
              tickFormatter={(value) => 
                new Intl.NumberFormat('vi-VN', {
                  notation: 'compact',
                  compactDisplay: 'short',
                  maximumFractionDigits: 1
                }).format(value)
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="doanh_thu"
              name="Doanh thu"
              stroke="#4ade80"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        ) : (
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis 
              tickFormatter={(value) => 
                new Intl.NumberFormat('vi-VN', {
                  notation: 'compact',
                  compactDisplay: 'short',
                  maximumFractionDigits: 1
                }).format(value)
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="doanh_thu"
              name="Doanh thu"
              fill="#4ade80"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart; 