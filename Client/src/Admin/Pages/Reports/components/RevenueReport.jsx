import { useState, useEffect } from "react";
import RevenueChart from "./RevenueChart";
import {
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { FaChartLine, FaMoneyBillWave, FaCalendarAlt } from "react-icons/fa";
import { reportsApi } from "../../../../api/reportsApi";
import dashboardApi from "../../../../api/dashboardApi";
import ErrorBoundary from "../../../../components/ErrorBoundary";
import PropTypes from "prop-types";
import { toast } from "sonner";
import { Scrollbars } from "react-custom-scrollbars-2";
import AutoExportConfig from "./AutoExportConfig";

const RevenueReport = ({
  exportToPDF,
  exportToExcel,
  sendReportEmail,
  exportLoading,
  setExportLoading,
  formatCurrency,
}) => {
  const [revenueData, setRevenueData] = useState([]);
  const [chartType, setChartType] = useState("line"); // 'line' or 'bar'
  const [timeRange, setTimeRange] = useState("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bestDay, setBestDay] = useState(null);
  const [tableHeight, setTableHeight] = useState("auto");

  // Tính tổng doanh thu từ dữ liệu
  const totalRevenue = revenueData.reduce(
    (sum, item) => sum + (item.doanh_thu || 0),
    0
  );

  // Tính doanh thu trung bình
  const averageRevenue =
    revenueData.length > 0 ? totalRevenue / revenueData.length : 0;

  // Điều chỉnh chiều cao dựa trên timeRange
  useEffect(() => {
    if (timeRange === "week") {
      setTableHeight("auto");
    } else if (timeRange === "month") {
      setTableHeight("450px"); // Tăng chiều cao cho tháng
    } else {
      setTableHeight("400px"); // Tăng chiều cao cho năm
    }
  }, [timeRange]);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Thử lấy dữ liệu từ nhiều API endpoints
        try {
          // Thử lấy từ reportsApi
          const reportData = await reportsApi.getRevenueData(timeRange);
          console.log("Raw report data from API:", reportData);
          
          if (
            reportData &&
            Array.isArray(reportData) &&
            reportData.length > 0
          ) {
            // Kiểm tra xem dữ liệu có chứa trường createdAt không
            const hasCreatedAt = reportData.some(item => item.createdAt);
            console.log("Data contains createdAt fields:", hasCreatedAt);
            
            // Nếu có dữ liệu MongoDB, xử lý theo ngày tạo đơn hàng
            if (hasCreatedAt) {
              console.log("Processing MongoDB data with createdAt fields");
              
              // Tạo mảng các ngày trong khoảng thời gian
              const daysInRange = [];
              const today = new Date();
              
              if (timeRange === "week") {
                for (let i = 6; i >= 0; i--) {
                  const date = new Date(today);
                  date.setDate(today.getDate() - i);
                  daysInRange.push({
                    date: date,
                    dateString: date.toLocaleDateString("vi-VN"),
                    doanh_thu: 0
                  });
                }
              }
              
              // Xử lý từng bản ghi MongoDB
              reportData.forEach(item => {
                if (item.createdAt) {
                  const orderDate = new Date(item.createdAt);
                  console.log(`Processing order with createdAt: ${item.createdAt}, parsed as: ${orderDate}`);
                  
                  if (!isNaN(orderDate.getTime())) {
                    // Tìm ngày tương ứng trong mảng ngày
                    const dayIndex = daysInRange.findIndex(day => 
                      day.date.getDate() === orderDate.getDate() && 
                      day.date.getMonth() === orderDate.getMonth() && 
                      day.date.getFullYear() === orderDate.getFullYear()
                    );
                    
                    if (dayIndex !== -1) {
                      console.log(`Found matching day at index ${dayIndex} for order date ${orderDate.toLocaleDateString("vi-VN")}`);
                      daysInRange[dayIndex].doanh_thu += (item.totalAmount || item.amount || item.doanh_thu || 0);
                    } else {
                      console.log(`No matching day found for order date ${orderDate.toLocaleDateString("vi-VN")}`);
                    }
                  }
                }
              });
              
              // Chuyển đổi thành định dạng dữ liệu cần thiết
              const formattedData = daysInRange.map((day, index) => {
                // Chuyển đổi sang tên thứ nếu cần
                const dayOfWeek = day.date.getDay();
                const dayNames = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
                const displayName = dayNames[dayOfWeek];
                
                const result = {
                  date: day.dateString,
                  displayName: displayName,
                  doanh_thu: day.doanh_thu,
                  don_hang: 0,
                  createdAt: day.date.toISOString()
                };
                
                console.log(`Processed day ${index}:`, result);
                return result;
              });
              
              console.log("Final formatted data:", formattedData);
              setRevenueData(formattedData);
              return;
            }
            
            // Xử lý dữ liệu thông thường nếu không phải dữ liệu MongoDB
            const formattedData = reportData.map((item, index) => {
              // Ưu tiên sử dụng createdAt nếu có (từ MongoDB)
              let formattedDate;
              if (item.createdAt) {
                const date = new Date(item.createdAt);
                console.log(`Item ${index} createdAt:`, item.createdAt, "parsed as:", date);
                if (!isNaN(date.getTime())) {
                  formattedDate = date.toLocaleDateString("vi-VN");
                } else {
                  formattedDate = formatDateString(item.date);
                }
              } else {
                formattedDate = formatDateString(item.date);
              }
              
              // Xử lý trường hợp ngày không hợp lệ
              if (formattedDate === "N/A" || !formattedDate || (typeof formattedDate === 'string' && formattedDate.includes('Invalid'))) {
                const currentDate = new Date();
                const newDate = new Date(currentDate);
                newDate.setDate(currentDate.getDate() - (reportData.length - 1 - index));
                formattedDate = newDate.toLocaleDateString("vi-VN");
                console.log(`Fixed invalid date for item ${index}, using:`, formattedDate);
              }
              
              const result = {
                date: formattedDate,
                doanh_thu: item.doanh_thu || item.amount || item.totalAmount || 0,
                don_hang: item.don_hang || 0,
                createdAt: item.createdAt || null,
              };
              
              console.log(`Processed item ${index}:`, result);
              return result;
            });

            console.log("Final formatted data:", formattedData);
            setRevenueData(formattedData);
            return;
          }
        } catch (reportError) {
          console.warn("Failed to get data from reports API:", reportError);
        }

        // Thử lấy từ dashboardApi
        try {
          const dashboardData = await dashboardApi.getRevenueData(timeRange);
          console.log("Raw dashboard data from API:", dashboardData);
          
          if (
            dashboardData &&
            Array.isArray(dashboardData) &&
            dashboardData.length > 0
          ) {
            console.log("Revenue data from dashboard API:", dashboardData);

            // Chuẩn hóa dữ liệu để đảm bảo ngày hiển thị đúng
            const formattedData = dashboardData.map((item, index) => {
              // Ưu tiên sử dụng createdAt nếu có (từ MongoDB)
              let formattedDate;
              if (item.createdAt) {
                const date = new Date(item.createdAt);
                console.log(`Item ${index} createdAt:`, item.createdAt, "parsed as:", date);
                if (!isNaN(date.getTime())) {
                  formattedDate = date.toLocaleDateString("vi-VN");
                } else {
                  formattedDate = formatDateString(item.date);
                }
              } else {
                formattedDate = formatDateString(item.date);
              }
              
              // Xử lý trường hợp ngày không hợp lệ
              if (formattedDate === "N/A" || !formattedDate || (typeof formattedDate === 'string' && formattedDate.includes('Invalid'))) {
                const currentDate = new Date();
                const newDate = new Date(currentDate);
                newDate.setDate(currentDate.getDate() - (dashboardData.length - 1 - index));
                formattedDate = newDate.toLocaleDateString("vi-VN");
                console.log(`Fixed invalid date for item ${index}, using:`, formattedDate);
              }
              
              const result = {
                date: formattedDate,
                doanh_thu: item.doanh_thu || item.amount || item.totalAmount || 0,
                don_hang: item.don_hang || 0,
                createdAt: item.createdAt || null,
              };
              
              console.log(`Processed item ${index}:`, result);
              return result;
            });

            console.log("Final formatted data:", formattedData);
            setRevenueData(formattedData);
            return;
          }
        } catch (dashboardError) {
          console.warn(
            "Failed to get data from dashboard API:",
            dashboardError
          );
        }

        // Nếu không có dữ liệu, tạo dữ liệu giả tạm thời
        const currentDate = new Date();
        let tempData = [];

        if (timeRange === "week") {
          // Dữ liệu 7 ngày gần đây
          for (let i = 6; i >= 0; i--) {
            const date = new Date(currentDate);
            date.setDate(date.getDate() - i);
            tempData.push({
              date: formatDateString(date.toLocaleDateString("vi-VN")),
              doanh_thu: Math.floor(Math.random() * 10000000), // Random value
            });
          }
        } else if (timeRange === "month") {
          // Dữ liệu theo tháng
          const daysInMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0
          ).getDate();
          for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              i
            );
            tempData.push({
              date: formatDateString(date.toLocaleDateString("vi-VN")),
              doanh_thu: Math.floor(Math.random() * 10000000), // Random value
            });
          }
        } else if (timeRange === "year") {
          // Dữ liệu theo năm
          for (let i = 0; i < 12; i++) {
            const date = new Date(currentDate.getFullYear(), i, 1);
            tempData.push({
              date: formatDateString(
                date.toLocaleDateString("vi-VN", {
                  month: "long",
                  year: "numeric",
                })
              ),
              doanh_thu: Math.floor(Math.random() * 100000000),
            });
          }
        }

        console.log("Using temporary data:", tempData);
        setRevenueData(tempData);
        toast.warning(
          "Không thể kết nối tới máy chủ. Đang hiển thị dữ liệu mẫu."
        );
      } catch (error) {
        console.error("Error fetching revenue data:", error);
        setError(error.message || "Không thể tải dữ liệu doanh thu");
        toast.error("Không thể tải dữ liệu doanh thu");
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [timeRange]);

  useEffect(() => {
    if (revenueData && revenueData.length > 0) {
      console.log("Processing best day from revenue data:", revenueData);
      
      // Lọc dữ liệu có doanh thu > 0
      const validData = revenueData.filter((item) => item.doanh_thu > 0);
      console.log("Valid data (doanh_thu > 0):", validData);
    
      if (validData.length > 0) {
        // Tìm ngày có doanh thu cao nhất
        let best = validData.reduce(
          (max, current) => (current.doanh_thu > max.doanh_thu ? current : max),
          validData[0]
        );
        console.log("Initial best day:", best);

        // Ưu tiên sử dụng displayName nếu có
        if (best.displayName) {
          console.log("Best day has displayName:", best.displayName);
          // Không cần xử lý thêm vì displayName đã là tên thứ
        }
        // Xử lý trường hợp ngày hiển thị là tên thứ (CN, Thứ 2, etc.)
        else if (best.date && typeof best.date === 'string') {
          const dayNames = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
          if (dayNames.includes(best.date)) {
            console.log("Best day date is already a day name:", best.date);
            best.displayName = best.date;
          } else {
            // Xử lý định dạng ngày Việt Nam (dd/MM/yyyy)
            const vietnameseDatePattern = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/;
            const match = best.date.match(vietnameseDatePattern);
            
            if (match) {
              // Chuyển đổi từ dd/MM/yyyy sang Date object
              const day = parseInt(match[1], 10);
              const month = parseInt(match[2], 10) - 1; // Tháng trong JS là 0-11
              const year = parseInt(match[3], 10);
              
              const dateObj = new Date(year, month, day);
              if (!isNaN(dateObj.getTime())) {
                const dayOfWeek = dateObj.getDay();
                best.displayName = dayNames[dayOfWeek];
                console.log(`Converted Vietnamese date format to day name: ${best.displayName} for date ${best.date}`);
              }
            }
            // Nếu có createdAt, sử dụng nó để xác định tên thứ
            else if (best.createdAt) {
              try {
                const createdDate = new Date(best.createdAt);
                if (!isNaN(createdDate.getTime())) {
                  const dayOfWeek = createdDate.getDay();
                  best.displayName = dayNames[dayOfWeek];
                  console.log(`Determined day name from createdAt: ${best.displayName}`);
                }
              } catch (error) {
                console.error("Error parsing createdAt for best day:", error);
              }
            } else {
              // Thử chuyển đổi date thành ngày
              try {
                const dateObj = new Date(best.date);
                if (!isNaN(dateObj.getTime())) {
                  const dayOfWeek = dateObj.getDay();
                  best.displayName = dayNames[dayOfWeek];
                  console.log(`Converted date to day name: ${best.displayName}`);
                }
              } catch (error) {
                console.error("Error converting date to day name:", error);
              }
            }
          }
        }
        
        // Nếu date là N/A hoặc Invalid, tạo ngày hợp lệ
        if (!best.displayName || best.date === "N/A" || !best.date || (typeof best.date === 'string' && best.date.includes('Invalid'))) {
          console.log("Best day has invalid date or missing displayName:", best.date);
          
          // Tìm item trong dữ liệu gốc có cùng doanh thu và có date hợp lệ
          const matchingItem = revenueData.find(
            (item) =>
              item.doanh_thu === best.doanh_thu &&
              ((item.displayName && item.displayName !== "N/A") || 
               (item.date && item.date !== "N/A" && !(typeof item.date === 'string' && item.date.includes('Invalid'))))
          );

          if (matchingItem) {
            console.log("Found matching item with valid date:", matchingItem);
            best = { 
              ...best, 
              date: matchingItem.date,
              displayName: matchingItem.displayName || null
            };
          } else {
            // Nếu không tìm thấy, gán ngày thủ công dựa vào index
            const index = revenueData.findIndex(
              (item) => item.doanh_thu === best.doanh_thu
            );
            if (index !== -1) {
              console.log(`Generating date based on index ${index}`);
              const currentDate = new Date();
              const newDate = new Date(currentDate);
              newDate.setDate(
                currentDate.getDate() - (revenueData.length - 1 - index)
              );
              
              // Chuyển đổi thành tên thứ
              const dayOfWeek = newDate.getDay();
              const dayNames = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
              
              best = { 
                ...best, 
                date: newDate.toLocaleDateString("vi-VN"),
                displayName: dayNames[dayOfWeek]
              };
              console.log("Generated date and day name:", best);
            }
          }
        }

        // Đảm bảo date không phải là Invalid Date
        if (typeof best.date === 'string' && best.date.includes('Invalid')) {
          console.log("Best day still has invalid date after processing:", best.date);
          const currentDate = new Date();
          const dayOfWeek = currentDate.getDay();
          const dayNames = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
          
          best = { 
            ...best, 
            date: currentDate.toLocaleDateString("vi-VN"),
            displayName: dayNames[dayOfWeek]
          };
          console.log("Fallback to current date and day name:", best);
        }
    
        console.log("Final best day:", best);
        setBestDay(best);
      } else {
        console.log("No valid data with doanh_thu > 0");
        // Nếu không có dữ liệu hợp lệ, tạo một ngày mặc định
        const currentDate = new Date();
        const dayOfWeek = currentDate.getDay();
        const dayNames = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
        
        const defaultBestDay = {
          date: currentDate.toLocaleDateString("vi-VN"),
          displayName: dayNames[dayOfWeek],
          doanh_thu: 0
        };
        console.log("Using default best day:", defaultBestDay);
        setBestDay(defaultBestDay);
      }
    } else {
      console.log("No revenue data available");
      // Nếu không có dữ liệu, tạo một ngày mặc định
      const currentDate = new Date();
      const dayOfWeek = currentDate.getDay();
      const dayNames = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
      
      const defaultBestDay = {
        date: currentDate.toLocaleDateString("vi-VN"),
        displayName: dayNames[dayOfWeek],
        doanh_thu: 0
      };
      console.log("Using default best day:", defaultBestDay);
      setBestDay(defaultBestDay);
    }
  }, [revenueData]);

  // Cải thiện hàm formatDateString để xử lý tốt hơn định dạng ngày Việt Nam
  const formatDateString = (dateString) => {
    if (!dateString) return "N/A";

    try {
      // Xử lý trường hợp đã là Invalid Date
      if (typeof dateString === 'string' && dateString.includes('Invalid')) {
        return "N/A";
      }

      // Kiểm tra xem dateString có phải là định dạng ISO không (từ MongoDB)
      if (typeof dateString === 'string' && dateString.includes("T")) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "N/A"; // Nếu không phải date hợp lệ
        return date.toLocaleDateString("vi-VN");
      }

      // Xử lý các định dạng khác nhau của chuỗi ngày Việt Nam
      if (typeof dateString === 'string') {
        // Kiểm tra định dạng dd/MM/yyyy
        const ddMMyyyyPattern = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/;
        const match = dateString.match(ddMMyyyyPattern);
        
        if (match) {
          // Đã là định dạng Việt Nam, trả về nguyên bản
          return dateString;
        }
        
        const datePatterns = [
          /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/, // DD/MM/YYYY
          /(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/, // YYYY/MM/DD
          /Tháng (\d{1,2})\/(\d{4})/, // Tháng MM/YYYY
        ];

        for (const pattern of datePatterns) {
          if (pattern.test(dateString)) {
            return dateString; // Nếu đúng định dạng, trả về nguyên bản
          }
        }
      }

      // Nếu là Date object
      if (dateString instanceof Date && !isNaN(dateString.getTime())) {
        return dateString.toLocaleDateString("vi-VN");
      }

      // Thử phân tích cú pháp làm date object
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("vi-VN");
      }

      // Nếu không thể xác định định dạng ngày
      console.warn("Unrecognized date format:", dateString);
      return "N/A";
    } catch (error) {
      console.warn("Error formatting date:", error, dateString);
      return "N/A"; // Trả về N/A nếu có lỗi xảy ra
    }
  };

  // Thêm hàm định dạng ngày cho thẻ Ngày tốt nhất
  const formatBestDay = (dateStr) => {
    try {
      // Nếu đã là định dạng Việt Nam dd/MM/yyyy, trả về ngay
      if (
        typeof dateStr === "string" &&
        /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)
      ) {
        return dateStr;
      }

      // Nếu là N/A hoặc null/undefined, trả về 'Không có'
      if (!dateStr || dateStr === "N/A") {
        return "Không có";
      }

      // Xử lý khi là Date object hoặc chuỗi ISO
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString("vi-VN");
      }

      return "Không có";
    } catch (error) {
      console.error("Error formatting best day:", error, dateStr);
      return "Không có";
    }
  };

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
  };

  const handleChartTypeChange = (type) => {
    setChartType(type);
  };

  return (
    <div id="revenue-report" className="p-6">
      {/* Report header with export buttons */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Báo cáo doanh thu</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => exportToPDF("revenue", setExportLoading)}
            disabled={exportLoading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {exportLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span> Đang xuất...
              </>
            ) : (
              "Xuất PDF"
            )}
          </button>
          <button
            onClick={() => exportToExcel("revenue", setExportLoading)}
            disabled={exportLoading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? "Đang xuất..." : "Xuất Excel"}
          </button>
          <button
            onClick={() => sendReportEmail("revenue", setExportLoading)}
            disabled={exportLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? "Đang gửi..." : "Gửi Email"}
          </button>
        </div>
      </div>

      {/* Bộ lọc và điều khiển */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-blue-500" />
            <span className="text-gray-700">Thời gian:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleTimeRangeChange("week")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                timeRange === "week"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              7 ngày
            </button>
            <button
              onClick={() => handleTimeRangeChange("month")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                timeRange === "month"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Tháng
            </button>
            <button
              onClick={() => handleTimeRangeChange("year")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                timeRange === "year"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Năm
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FaChartLine className="text-green-500" />
            <span className="text-gray-700">Loại biểu đồ:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleChartTypeChange("line")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                chartType === "line"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Đường
            </button>
            <button
              onClick={() => handleChartTypeChange("bar")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                chartType === "bar"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Cột
            </button>
          </div>
        </div>
      </div>

      {/* Hiển thị trạng thái đang tải */}
      {loading && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-3 text-gray-600">Đang tải dữ liệu doanh thu...</p>
        </div>
      )}

      {/* Hiển thị lỗi nếu có */}
      {error && !loading && (
        <div className="text-center py-10 bg-red-50 rounded-lg">
          <div className="text-red-500 text-5xl mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Không thể tải dữ liệu
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => handleTimeRangeChange(timeRange)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Nội dung báo cáo */}
      {!loading && !error && revenueData.length > 0 && (
        <>
          {/* Thẻ thống kê tổng quan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="bg-blue-50 shadow-md transition-all hover:shadow-lg border-l-4 border-blue-500">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      component="p"
                    >
                      Tổng doanh thu
                    </Typography>
                    <Typography
                      variant="h5"
                      component="h2"
                      className="font-bold"
                    >
                      {formatCurrency(totalRevenue)}
                    </Typography>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <FaMoneyBillWave className="text-blue-600 text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 shadow-md transition-all hover:shadow-lg border-l-4 border-green-500">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      component="p"
                    >
                      Doanh thu trung bình
                    </Typography>
                    <Typography
                      variant="h5"
                      component="h2"
                      className="font-bold"
                    >
                      {formatCurrency(averageRevenue)}
                    </Typography>
                  </div>
                  <div className="p-2 bg-green-100 rounded-full">
                    <FaChartLine className="text-green-600 text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 shadow-md transition-all hover:shadow-lg border-l-4 border-yellow-500">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      component="p"
                    >
                      Ngày tốt nhất
                    </Typography>
                    <Typography
                      variant="h5"
                      component="h2"
                      className="font-bold"
                    >
                      {bestDay && bestDay.displayName 
                        ? (bestDay.date && !bestDay.date.includes('Invalid') 
                           ? `${bestDay.displayName} (${bestDay.date})` 
                           : bestDay.displayName)
                        : bestDay && bestDay.date
                        ? formatBestDay(bestDay.date)
                        : new Date().toLocaleDateString("vi-VN")}
                    </Typography>
                    {bestDay && (
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        component="p"
                        className={bestDay.doanh_thu > 0 ? "text-green-600 font-semibold" : "text-gray-500"}
                      >
                        {formatCurrency(bestDay.doanh_thu || 0)}
                      </Typography>
                    )}
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <FaCalendarAlt className="text-yellow-600 text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Biểu đồ doanh thu */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Biểu đồ doanh thu{" "}
              {timeRange === "week"
                ? "7 ngày qua"
                : timeRange === "month"
                ? "tháng này"
                : "năm nay"}
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg h-96">
              <ErrorBoundary>
                <RevenueChart
                  revenueData={revenueData}
                  chartType={chartType}
                  formatCurrency={formatCurrency}
                />
              </ErrorBoundary>
            </div>
          </div>

          {/* Bảng dữ liệu chi tiết */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                Dữ liệu chi tiết
              </h3>
              <div className="text-sm text-gray-500 flex items-center">
                {revenueData.length} bản ghi
                {revenueData.length > 10 && (
                  <span className="ml-2 px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Cuộn để xem thêm
                  </span>
                )}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <TableContainer
                component={Paper}
                elevation={0}
                className="overflow-hidden"
                style={{
                  maxHeight: timeRange === "week" ? "auto" : tableHeight,
                }}
              >
                <Scrollbars
                  autoHide
                  autoHeight={timeRange === "week"}
                  autoHeightMin={200}
                  autoHeightMax={550}
                  style={{
                    height: timeRange === "week" ? "auto" : tableHeight,
                  }}
                  renderThumbVertical={({ style, ...props }) => (
                    <div
                      {...props}
                      style={{
                        ...style,
                        backgroundColor: "#10b981",
                        borderRadius: "4px",
                        width: "6px",
                      }}
                    />
                  )}
                >
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow className="bg-gray-100">
                        <TableCell className="font-semibold text-gray-800 bg-gray-100 sticky top-0 z-10">
                          Ngày
                        </TableCell>
                        <TableCell
                          align="right"
                          className="font-semibold text-gray-800 bg-gray-100 sticky top-0 z-10"
                        >
                          Doanh thu
                        </TableCell>
                        <TableCell
                          align="right"
                          className="font-semibold text-gray-800 bg-gray-100 sticky top-0 z-10"
                        >
                          So với trung bình
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {revenueData.map((item, index) => {
                        // Đảm bảo ngày hiển thị đúng
                        let displayDate = item.date;
                        let originalDate = item.date; // Lưu lại ngày gốc
                        
                        // Xử lý định dạng ngày Việt Nam (dd/MM/yyyy)
                        if (displayDate && typeof displayDate === 'string') {
                          const vietnameseDatePattern = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/;
                          const match = displayDate.match(vietnameseDatePattern);
                          
                          if (match) {
                            // Đã là định dạng ngày/tháng/năm, giữ nguyên
                            originalDate = displayDate;
                            
                            // Chuyển đổi từ dd/MM/yyyy sang Date object để lấy tên thứ
                            const day = parseInt(match[1], 10);
                            const month = parseInt(match[2], 10) - 1; // Tháng trong JS là 0-11
                            const year = parseInt(match[3], 10);
                            
                            const dateObj = new Date(year, month, day);
                            if (!isNaN(dateObj.getTime())) {
                              const dayOfWeek = dateObj.getDay();
                              const dayNames = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
                              const dayName = dayNames[dayOfWeek];
                              displayDate = `${dayName}, ${displayDate}`;
                            }
                          }
                        }
                        
                        // Kiểm tra xem có phải là tên thứ không (CN, Thứ 2, etc.)
                        const dayNames = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
                        if (item.displayName && dayNames.includes(item.displayName)) {
                          // Nếu đã có displayName và là tên thứ, kết hợp với ngày gốc
                          if (originalDate && originalDate !== item.displayName) {
                            displayDate = `${item.displayName}, ${originalDate}`;
                          } else {
                            displayDate = item.displayName;
                          }
                        }
                        
                        // Ưu tiên sử dụng createdAt nếu có
                        if (item.createdAt) {
                          try {
                            const date = new Date(item.createdAt);
                            if (!isNaN(date.getTime())) {
                              // Định dạng ngày đầy đủ
                              const formattedDate = date.toLocaleDateString("vi-VN");
                              
                              // Chuyển đổi sang tên thứ
                              const dayOfWeek = date.getDay();
                              if (dayNames[dayOfWeek]) {
                                displayDate = `${dayNames[dayOfWeek]}, ${formattedDate}`;
                              } else {
                                displayDate = formattedDate;
                              }
                            }
                          } catch {
                            console.error("Error parsing createdAt for item:", item.createdAt);
                          }
                        }
                        
                        // Xử lý các trường hợp ngày không hợp lệ
                        if (!displayDate || displayDate === "N/A" || (typeof displayDate === 'string' && displayDate.includes('Invalid'))) {
                          // Tạo ngày dựa vào index
                          const currentDate = new Date();
                          const newDate = new Date(currentDate);
                          newDate.setDate(
                            currentDate.getDate() - (revenueData.length - 1 - index)
                          );
                          
                          // Định dạng ngày đầy đủ
                          const formattedDate = newDate.toLocaleDateString("vi-VN");
                          
                          // Chuyển đổi sang tên thứ
                          const dayOfWeek = newDate.getDay();
                          displayDate = `${dayNames[dayOfWeek]}, ${formattedDate}`;
                        }

                        // Kiểm tra và đảm bảo displayDate là chuỗi hợp lệ
                        if (typeof displayDate !== "string") {
                          try {
                            if (displayDate instanceof Date && !isNaN(displayDate.getTime())) {
                              const formattedDate = displayDate.toLocaleDateString("vi-VN");
                              const dayOfWeek = displayDate.getDay();
                              displayDate = `${dayNames[dayOfWeek]}, ${formattedDate}`;
                            } else {
                              displayDate = String(displayDate);
                            }
                          } catch {
                            displayDate = `Ngày ${index + 1}`;
                          }
                        }
                        
                        if (typeof displayDate === 'string' && displayDate.includes('Invalid')) {
                          displayDate = `Ngày ${index + 1}`;
                        }

                        // Thêm highlight cho ngày tốt nhất
                        const isBestDay =
                          bestDay &&
                          (item.doanh_thu === bestDay.doanh_thu ||
                            (bestDay.displayName && displayDate.includes(bestDay.displayName)) ||
                            (bestDay.date && displayDate.includes(bestDay.date)));

                        return (
                          <TableRow
                            key={index}
                            className={`${
                              index % 2 === 0 ? "bg-gray-50" : ""
                            } ${isBestDay ? "bg-green-50" : ""}`}
                            hover
                          >
                            <TableCell
                              component="th"
                              scope="row"
                              className={isBestDay ? "font-medium" : ""}
                            >
                              {displayDate || "Không có"}
                            </TableCell>
                            <TableCell
                              align="right"
                              className={
                                isBestDay ? "font-medium text-green-600" : ""
                              }
                            >
                              {formatCurrency(item.doanh_thu)}
                            </TableCell>
                            <TableCell align="right">
                              <div className="flex items-center justify-end">
                                <span
                                  className={`font-medium ${
                                    item.doanh_thu > averageRevenue
                                      ? "text-green-600"
                                      : item.doanh_thu < averageRevenue
                                      ? "text-red-600"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {item.doanh_thu > averageRevenue
                                    ? "+"
                                    : item.doanh_thu < averageRevenue
                                    ? "-"
                                    : ""}
                                  {formatCurrency(
                                    Math.abs(item.doanh_thu - averageRevenue)
                                  )}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Scrollbars>
              </TableContainer>
            </div>
          </div>
        </>
      )}

      {/* Add Auto Export Configuration */}
      <div className="mt-8 border-t pt-4">
        <AutoExportConfig reportId="revenue" setExportLoading={setExportLoading} />
      </div>
    </div>
  );
};

RevenueReport.propTypes = {
  exportToPDF: PropTypes.func.isRequired,
  exportToExcel: PropTypes.func.isRequired,
  sendReportEmail: PropTypes.func.isRequired,
  exportLoading: PropTypes.bool.isRequired,
  setExportLoading: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
};

export default RevenueReport;
