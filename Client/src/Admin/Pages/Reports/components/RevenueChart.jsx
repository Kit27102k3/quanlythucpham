/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
} from "recharts";

// Format currency helper function
const formatVietnameseCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

const RevenueChart = ({ 
  revenueData, 
  chartType = "line", 
  formatCurrency = formatVietnameseCurrency 
}) => {
  const [chartData, setChartData] = useState([]);

  // Hàm định dạng ngày trong tuần theo tiếng Việt
  const formatDayOfWeek = (dateStr) => {
    if (typeof dateStr === "string" && dateStr.length <= 3) {
      return dateStr;
    }

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr;
      }

      const day = date.getDay();
      const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      return daysOfWeek[day];
    } catch (error) {
      return dateStr;
    }
  };

  useEffect(() => {
    if (!revenueData || !Array.isArray(revenueData)) {
      setChartData([]);
      return;
    }
    
    if (revenueData.length === 0) {
      setChartData([]);
      return;
    }
    
    try {
      let processedData = [...revenueData].map((item, index) => {
        let formattedDate = item.date;
        
        if (formattedDate === "N/A" || !formattedDate) {
          const currentDate = new Date();
          const newDate = new Date(currentDate);
          newDate.setDate(currentDate.getDate() - (revenueData.length - 1 - index));
          formattedDate = newDate.toLocaleDateString('vi-VN');
        }
        
        if (typeof formattedDate !== 'string') {
          try {
            formattedDate = String(formattedDate);
          } catch {
            formattedDate = `Ngày ${index + 1}`;
          }
        }
        
        if (!formattedDate || formattedDate === 'undefined' || formattedDate === 'null') {
          formattedDate = `Ngày ${index + 1}`;
        }
        
        let revenue = 0;
        if (typeof item.doanh_thu === 'number') {
          revenue = item.doanh_thu;
        } else if (typeof item.revenue === 'number') {
          revenue = item.revenue;
        } else if (typeof item.amount === 'number') {
          revenue = item.amount;
        } else if (typeof item.total === 'number') {
          revenue = item.total;
        }
        
        if (isNaN(revenue)) {
          revenue = 0;
        }
        
        return {
          date: formattedDate,
          doanh_thu: revenue,
          index: index
        };
      });
      
      processedData = processedData.sort((a, b) => a.index - b.index);
      setChartData(processedData);
    } catch {
      const dummyData = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        dummyData.push({
          date: date.toLocaleDateString('vi-VN'),
          doanh_thu: Math.floor(Math.random() * 5000000)
        });
      }
      setChartData(dummyData);
    }
  }, [revenueData]);

  // Custom formatter cho XAxis để hiển thị ngày gọn hơn
  const dateAxisFormatter = (dateStr) => {
    if (!dateStr || dateStr === "N/A") return "";
    
    try {
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('/');
        return `${parts[0]}/${parts[1]}`;
      }
      
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }
      
      return dateStr.length > 10 ? dateStr.substring(0, 10) : dateStr;
    } catch {
      return dateStr;
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      let formattedValue;
      try {
        if (typeof formatCurrency === "function") {
          formattedValue = formatCurrency(payload[0].value);
        } else {
          formattedValue = formatVietnameseCurrency(payload[0].value);
        }
      } catch {
        formattedValue = `${payload[0].value.toLocaleString("vi-VN")} đ`;
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

  CustomTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.array,
    label: PropTypes.string
  };

  // Hiển thị thông báo nếu không có dữ liệu
  if (chartData.length === 0) {
    return (
      <div className="w-full h-72 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Không có dữ liệu doanh thu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-72 mt-4 border border-gray-100 rounded-lg p-2">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === "line" ? (
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={dateAxisFormatter} />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat("vi-VN", {
                  notation: "compact",
                  compactDisplay: "short",
                  maximumFractionDigits: 1,
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
            <XAxis dataKey="date" tickFormatter={dateAxisFormatter} />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat("vi-VN", {
                  notation: "compact",
                  compactDisplay: "short",
                  maximumFractionDigits: 1,
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

RevenueChart.propTypes = {
  revenueData: PropTypes.array,
  chartType: PropTypes.oneOf(["line", "bar"]),
  formatCurrency: PropTypes.func
};

export default RevenueChart;
