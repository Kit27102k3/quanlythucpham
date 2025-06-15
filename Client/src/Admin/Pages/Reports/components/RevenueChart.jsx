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
  Area,
  AreaChart,
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
    
    console.log("RevenueChart received data:", revenueData);
    
    try {
      // Xử lý dữ liệu từ API
      const processedData = revenueData.map((item, index) => {
        // Ưu tiên sử dụng displayDate và dayName từ API trả về
        let displayDate = item.displayDate;
        let dayName = item.dayName;
        let fullDate = item.date;
        
        // Nếu API không trả về displayDate, tự tạo từ date
        if (!displayDate) {
          let dateObj;
          try {
            if (typeof item.date === 'string') {
              dateObj = new Date(item.date);
              
              // Kiểm tra nếu date không hợp lệ
              if (isNaN(dateObj.getTime())) {
                // Thử phân tích theo định dạng YYYY-MM-DD
                const parts = item.date.split('-');
                if (parts.length === 3) {
                  dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                } else {
                  // Nếu vẫn không hợp lệ, tạo ngày tương đối dựa vào index
                  dateObj = new Date();
                  dateObj.setDate(dateObj.getDate() - (revenueData.length - 1 - index));
                }
              }
            } else {
              // Nếu không có date, tạo ngày tương đối dựa vào index
              dateObj = new Date();
              dateObj.setDate(dateObj.getDate() - (revenueData.length - 1 - index));
            }
            
            // Tạo dayName nếu không có
            if (!dayName) {
              const dayOfWeek = dateObj.getDay();
              const dayNames = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
              dayName = dayNames[dayOfWeek];
            }
            
            // Tạo displayDate nếu không có
            if (!displayDate) {
              displayDate = `${dayName} (${dateObj.getDate()}/${dateObj.getMonth() + 1})`;
            }
            
            // Tạo fullDate nếu không có
            if (!fullDate) {
              fullDate = dateObj.toLocaleDateString("vi-VN");
            }
          } catch (error) {
            // Fallback nếu có lỗi khi xử lý ngày
            const dateObj = new Date();
            dateObj.setDate(dateObj.getDate() - (revenueData.length - 1 - index));
            const dayOfWeek = dateObj.getDay();
            const dayNames = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
            dayName = dayNames[dayOfWeek];
            displayDate = `${dayName} (${dateObj.getDate()}/${dateObj.getMonth() + 1})`;
            fullDate = dateObj.toLocaleDateString("vi-VN");
          }
        }
        
        // Lấy giá trị doanh thu
        let revenue = 0;
        if (typeof item.revenue === 'number') {
          revenue = item.revenue;
        } else if (typeof item.doanh_thu === 'number') {
          revenue = item.doanh_thu;
        }
        
        return {
          date: displayDate || `Ngày ${index + 1}`,
          fullDate: fullDate || `Ngày ${index + 1}`,
          dayName: dayName || "",
          doanh_thu: revenue,
          index: index
        };
      });
      
      // Sử dụng tất cả dữ liệu, không lọc
      console.log("Processed chart data:", processedData);
      setChartData(processedData);
    } catch (error) {
      console.error("Error processing chart data:", error);
      setChartData([]);
    }
  }, [revenueData]);

  // Custom formatter cho XAxis để hiển thị ngày gọn hơn
  const dateAxisFormatter = (dateStr) => {
    if (!dateStr || dateStr === "N/A") return "";
    
    // Nếu đã là định dạng "Thứ X (dd/MM)" thì trả về nguyên bản
    if (typeof dateStr === 'string' && dateStr.includes('(') && dateStr.includes(')')) {
      return dateStr;
    }
    
    try {
      // Kiểm tra định dạng dd/MM/yyyy
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('/');
        return `${parts[0]}/${parts[1]}`;
      }
      
      // Xử lý chuỗi ngày khác
      if (dateStr.includes('Invalid')) {
        return "N/A";
      }
      
      // Thử chuyển đổi sang đối tượng Date
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }
      
      // Cắt chuỗi nếu quá dài
      return dateStr.length > 15 ? dateStr.substring(0, 15) + "..." : dateStr;
    } catch (error) {
      console.error("Error formatting axis date:", error);
      return "N/A";
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

      let formattedLabel = label;
      if (typeof label === 'string' && label.includes('Invalid')) {
        formattedLabel = "Không xác định";
      }

      // Lấy thông tin ngày đầy đủ nếu có
      let fullDate = "";
      if (payload[0].payload && payload[0].payload.fullDate) {
        fullDate = payload[0].payload.fullDate;
      }

      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="text-sm font-medium text-gray-900">{`Ngày: ${formattedLabel}`}</p>
          {fullDate && fullDate !== formattedLabel && (
            <p className="text-xs text-gray-500">{fullDate}</p>
          )}
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
      <div className="w-full h-72 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Không có dữ liệu doanh thu</p>
        </div>
      </div>
    );
  }

  // Shadcn UI styled chart colors
  const primaryColor = "#10b981"; // Green-500
  const secondaryColor = "#06b6d4"; // Cyan-500
  const gridColor = "#f1f5f9"; // Slate-100
  const textColor = "#64748b"; // Slate-500

  return (
    <div className="w-full h-72 mt-4 rounded-xl p-4 bg-white shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === "line" ? (
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid stroke={gridColor} strokeDasharray="5 5" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: textColor, fontSize: 12 }}
              axisLine={{ stroke: gridColor }}
              tickLine={{ stroke: gridColor }}
            />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat("vi-VN", {
                  notation: "compact",
                  compactDisplay: "short",
                  maximumFractionDigits: 1,
                }).format(value)
              }
              tick={{ fill: textColor, fontSize: 12 }}
              axisLine={{ stroke: gridColor }}
              tickLine={{ stroke: gridColor }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line
              type="monotone"
              dataKey="doanh_thu"
              name="Doanh thu"
              stroke={primaryColor}
              strokeWidth={3}
              dot={{ stroke: primaryColor, strokeWidth: 2, r: 4, fill: 'white' }}
              activeDot={{ r: 6, stroke: primaryColor, strokeWidth: 2, fill: 'white' }}
            />
          </LineChart>
        ) : chartType === "area" ? (
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid stroke={gridColor} strokeDasharray="5 5" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: textColor, fontSize: 12 }}
              axisLine={{ stroke: gridColor }}
              tickLine={{ stroke: gridColor }}
            />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat("vi-VN", {
                  notation: "compact",
                  compactDisplay: "short",
                  maximumFractionDigits: 1,
                }).format(value)
              }
              tick={{ fill: textColor, fontSize: 12 }}
              axisLine={{ stroke: gridColor }}
              tickLine={{ stroke: gridColor }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="doanh_thu" 
              name="Doanh thu"
              stroke={primaryColor} 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
              dot={{ stroke: primaryColor, strokeWidth: 2, r: 4, fill: 'white' }}
              activeDot={{ r: 6, stroke: primaryColor, strokeWidth: 2, fill: 'white' }}
            />
          </AreaChart>
        ) : (
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid stroke={gridColor} strokeDasharray="5 5" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: textColor, fontSize: 12 }}
              axisLine={{ stroke: gridColor }}
              tickLine={{ stroke: gridColor }}
            />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat("vi-VN", {
                  notation: "compact",
                  compactDisplay: "short",
                  maximumFractionDigits: 1,
                }).format(value)
              }
              tick={{ fill: textColor, fontSize: 12 }}
              axisLine={{ stroke: gridColor }}
              tickLine={{ stroke: gridColor }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar
              dataKey="doanh_thu"
              name="Doanh thu"
              fill={primaryColor}
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

RevenueChart.propTypes = {
  revenueData: PropTypes.array,
  chartType: PropTypes.oneOf(["line", "bar", "area"]),
  formatCurrency: PropTypes.func
};

export default RevenueChart;
