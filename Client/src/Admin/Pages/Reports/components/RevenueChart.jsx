import React, { useState, useEffect } from "react";
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

const RevenueChart = ({ revenueData, chartType = "line", formatCurrency }) => {
  const [chartData, setChartData] = useState([]);

  // Hàm định dạng ngày trong tuần theo tiếng Việt
  const formatDayOfWeek = (dateStr) => {
    // Nếu dateStr đã là string ngắn như 'T2', 'T3' thì giữ nguyên
    if (typeof dateStr === "string" && dateStr.length <= 3) {
      return dateStr;
    }

    try {
      const date = new Date(dateStr);
      // Kiểm tra xem date có hợp lệ không
      if (isNaN(date.getTime())) {
        return dateStr; // Trả về string ban đầu nếu không phải date hợp lệ
      }

      const day = date.getDay(); // 0 = CN, 1 = T2, ...
      const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      return daysOfWeek[day];
    } catch (error) {
      console.error("Error formatting day of week:", error);
      return dateStr; // Trả về string ban đầu nếu có lỗi
    }
  };

  useEffect(() => {
    if (revenueData && Array.isArray(revenueData)) {
      console.log("Original revenue data:", revenueData);
      
      // Đảm bảo dữ liệu có định dạng phù hợp
      let processedData = [...revenueData].map((item, index) => {
        // Xử lý ngày tháng
        let formattedDate = item.date;
        
        if (formattedDate === "N/A" || !formattedDate) {
          // Tạo ngày theo index nếu không có dữ liệu ngày
          const currentDate = new Date();
          const newDate = new Date(currentDate);
          newDate.setDate(currentDate.getDate() - (revenueData.length - 1 - index));
          formattedDate = newDate.toLocaleDateString('vi-VN');
        }
        
        // Đảm bảo formattedDate là chuỗi
        if (typeof formattedDate !== 'string') {
          try {
            formattedDate = String(formattedDate);
          } catch {
            formattedDate = `Ngày ${index + 1}`;
          }
        }
        
        // Kiểm tra xem formattedDate có phải là chuỗi rỗng hoặc 'undefined'/'null'
        if (!formattedDate || formattedDate === 'undefined' || formattedDate === 'null') {
          formattedDate = `Ngày ${index + 1}`;
        }
        
        // Đảm bảo có doanh thu
        const result = {
          date: formattedDate,
          doanh_thu: typeof item.doanh_thu === 'number' ? item.doanh_thu : 0,
          index: index // Thêm index để đảm bảo thứ tự hiển thị đúng
        };
        
        console.log(`Processed chart item ${index}:`, result);
        return result;
      });
      
      // Sắp xếp lại dữ liệu theo thứ tự index để đảm bảo hiển thị đúng
      processedData = processedData.sort((a, b) => a.index - b.index);
      
      console.log("Final processed chart data:", processedData);
      setChartData(processedData);
    } else {
      console.warn("No revenue data or invalid format");
      setChartData([]);
    }
  }, [revenueData]);

  // Custom formatter cho XAxis để hiển thị ngày gọn hơn
  const dateAxisFormatter = (dateStr) => {
    if (!dateStr || dateStr === "N/A") return "";
    
    try {
      // Kiểm tra các định dạng ngày Việt Nam phổ biến: DD/MM/YYYY
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('/');
        // Trả về ngày và tháng: DD/MM
        return `${parts[0]}/${parts[1]}`;
      }
      
      // Nếu là chuỗi date khác, thử parse và format
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        // Format ngày/tháng
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }
      
      // Trả về 10 ký tự đầu tiên nếu quá dài
      return dateStr.length > 10 ? dateStr.substring(0, 10) : dateStr;
    } catch (error) {
      console.warn("Error formatting axis date:", error, dateStr);
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
      } catch (error) {
        console.error("Error formatting currency:", error);
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

  return (
    <div className="w-full h-72 mt-4">
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

export default RevenueChart;
