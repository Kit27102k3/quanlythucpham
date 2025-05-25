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
          if (
            reportData &&
            Array.isArray(reportData) &&
            reportData.length > 0
          ) {
            console.log("Revenue data from reports API:", reportData);

            // Chuẩn hóa dữ liệu để đảm bảo ngày hiển thị đúng
            const formattedData = reportData.map((item) => ({
              date: formatDateString(item.date),
              doanh_thu: item.doanh_thu || 0,
              don_hang: item.don_hang || 0,
            }));

            setRevenueData(formattedData);
            return;
          }
        } catch (reportError) {
          console.warn("Failed to get data from reports API:", reportError);
        }

        // Thử lấy từ dashboardApi
        try {
          const dashboardData = await dashboardApi.getRevenueData(timeRange);
          if (
            dashboardData &&
            Array.isArray(dashboardData) &&
            dashboardData.length > 0
          ) {
            console.log("Revenue data from dashboard API:", dashboardData);

            // Chuẩn hóa dữ liệu để đảm bảo ngày hiển thị đúng
            const formattedData = dashboardData.map((item) => ({
              date: formatDateString(item.date),
              doanh_thu: item.doanh_thu || 0,
              don_hang: item.don_hang || 0,
            }));

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
              doanh_thu: Math.floor(Math.random() * 100000000), // Random value
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
      // Lọc dữ liệu có doanh thu > 0
      const validData = revenueData.filter((item) => item.doanh_thu > 0);
      console.log("Valid data for best day calculation:", validData);

      if (validData.length > 0) {
        // Tìm ngày có doanh thu cao nhất
        let best = validData.reduce(
          (max, current) => (current.doanh_thu > max.doanh_thu ? current : max),
          validData[0]
        );

        // Nếu date là N/A, tìm dữ liệu thật từ revenueData với cùng doanh thu
        if (best.date === "N/A" || !best.date) {
          // Tìm item trong dữ liệu gốc có cùng doanh thu và có date hợp lệ
          const matchingItem = revenueData.find(
            (item) =>
              item.doanh_thu === best.doanh_thu &&
              item.date &&
              item.date !== "N/A"
          );

          if (matchingItem) {
            best = { ...best, date: matchingItem.date };
          } else {
            // Nếu không tìm thấy, gán ngày thủ công dựa vào index
            const index = revenueData.findIndex(
              (item) => item.doanh_thu === best.doanh_thu
            );
            if (index !== -1) {
              const currentDate = new Date();
              const newDate = new Date(currentDate);
              newDate.setDate(
                currentDate.getDate() - (revenueData.length - 1 - index)
              );
              best = { ...best, date: newDate.toLocaleDateString("vi-VN") };
            }
          }
        }

        console.log("Selected best day:", best);
        setBestDay(best);
      } else {
        console.log("No valid data for best day");
        setBestDay(null);
      }
    } else {
      console.log("No revenue data for best day");
      setBestDay(null);
    }
  }, [revenueData]);

  // Hàm để chuẩn hóa định dạng ngày
  const formatDateString = (dateString) => {
    if (!dateString) return "N/A";

    try {
      // Kiểm tra xem dateString có phải là định dạng ISO không
      if (dateString.includes("T") && dateString.includes("Z")) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Nếu không phải date hợp lệ, trả về nguyên bản
        return date.toLocaleDateString("vi-VN");
      }

      // Xử lý các định dạng khác nhau của chuỗi ngày Việt Nam
      // VD: 25/05/2023, 25-05-2023, 25.05.2023
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

      // Nếu chuỗi không khớp định dạng nào, có thể là ngày không hợp lệ
      // Thử phân tích cú pháp làm date object
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("vi-VN");
      }

      return dateString; // Trả về nguyên bản nếu không thể chuyển đổi
    } catch (error) {
      console.warn("Error formatting date:", error, dateString);
      return dateString; // Trả về nguyên bản nếu có lỗi xảy ra
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

      return dateStr || "Không có";
    } catch {
      return dateStr || "Không có";
    }
  };

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
  };

  const handleChartTypeChange = (type) => {
    setChartType(type);
  };

  return (
    <div id="revenue-report" className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Báo cáo doanh thu</h2>
        <div className="flex gap-2">
          <button
            onClick={() => exportToPDF("revenue", setExportLoading)}
            disabled={exportLoading || loading || error}
            className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất PDF
          </button>
          <button
            onClick={() =>
              exportToExcel({ revenueData }, "revenue", setExportLoading)
            }
            disabled={exportLoading || loading || error}
            className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất Excel
          </button>
          <button
            onClick={() => sendReportEmail("revenue", setExportLoading)}
            disabled={exportLoading || loading || error}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Gửi Email
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
                      {bestDay && bestDay.date
                        ? formatBestDay(bestDay.date)
                        : "Không có"}
                    </Typography>
                    {bestDay && bestDay.doanh_thu > 0 && (
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        component="p"
                        className="text-green-600 font-semibold"
                      >
                        {formatCurrency(bestDay.doanh_thu)}
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
                        if (!displayDate || displayDate === "N/A") {
                          // Tạo ngày dựa vào index
                          const currentDate = new Date();
                          const newDate = new Date(currentDate);
                          newDate.setDate(
                            currentDate.getDate() -
                              (revenueData.length - 1 - index)
                          );
                          displayDate = newDate.toLocaleDateString("vi-VN");
                        }

                        // Kiểm tra và đảm bảo displayDate là chuỗi hợp lệ
                        if (typeof displayDate !== "string") {
                          displayDate = `Ngày ${index + 1}`;
                        }

                        // Thêm highlight cho ngày tốt nhất
                        const isBestDay =
                          bestDay &&
                          (item.doanh_thu === bestDay.doanh_thu ||
                            displayDate === formatBestDay(bestDay.date));

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
