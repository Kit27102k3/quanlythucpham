import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import RevenueChart from "./RevenueChart";
import {
  ShoppingCart,
  Users,
  Box as LucideBox,
  ClipboardList,
} from "lucide-react";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PeopleIcon from "@mui/icons-material/People";
import InventoryIcon from "@mui/icons-material/Inventory";
import dashboardApi from "../../../../api/dashboardApi";
import { FiActivity } from "react-icons/fi";
import { Tooltip as MuiTooltip } from "@mui/material";
import { FaChartLine, FaShoppingBasket, FaWarehouse } from "react-icons/fa";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import ErrorBoundary from "../../../../components/ErrorBoundary";
import { toast } from "sonner";

const StatCard = ({ icon: Icon, title, value, bgColor }) => (
  <div
    className={`${bgColor} p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-300`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-700 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-xl font-bold text-gray-800">{value}</h3>
      </div>
      <div
        className={`p-3 rounded-full ${
          bgColor === "bg-blue-50"
            ? "bg-blue-100"
            : bgColor === "bg-green-50"
            ? "bg-green-100"
            : bgColor === "bg-yellow-50"
            ? "bg-yellow-100"
            : "bg-purple-100"
        }`}
      >
        <Icon
          size={18}
          className={`${
            bgColor === "bg-blue-50"
              ? "text-blue-600"
              : bgColor === "bg-green-50"
              ? "text-green-600"
              : bgColor === "bg-yellow-50"
              ? "text-yellow-600"
              : "text-purple-600"
          }`}
        />
      </div>
    </div>
  </div>
);

StatCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  bgColor: PropTypes.string.isRequired,
};

const DashboardReport = ({
  exportToPDF,
  exportToExcel,
  sendReportEmail,
  exportLoading,
  setExportLoading,
  formatCurrency,
}) => {
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    recentActivities: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        setErrorMessage("");
        
        // Use the dashboardApi to get complete dashboard data
        const dashboardResponse = await dashboardApi.getCompleteDashboardData();
        if (dashboardResponse) {
          
          setDashboardData(dashboardResponse);
        } else {
          throw new Error("Không thể tải dữ liệu tổng quan");
        }
        
        // Get revenue data for charts in a separate try-catch
        try {
         
          const revenueResponse = await dashboardApi.getRevenueData("week");
          
          if (revenueResponse && Array.isArray(revenueResponse) && revenueResponse.length > 0) {
            // Make sure revenue data has the right format
            const processedData = revenueResponse.map(item => ({
              date: item.date || "N/A",
              doanh_thu: typeof item.doanh_thu === 'number' ? item.doanh_thu : 
                        (typeof item.revenue === 'number' ? item.revenue : 0)
            }));
            
            setRevenueData(processedData);
          } else {
            console.warn("Revenue data is empty or not an array:", revenueResponse);
            // Create some dummy data to test chart rendering
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
            console.log("Using dummy revenue data:", dummyData);
            setRevenueData(dummyData);
          }
        } catch (revenueError) {
          console.error("Error loading revenue data:", revenueError);
          toast.error("Không thể tải dữ liệu doanh thu");
          
          // Create some dummy data to test chart rendering
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
          setRevenueData(dummyData);
        }
        
        // Get top selling products in a separate try-catch
        try {
          const topProductsResponse = await dashboardApi.getTopProducts();
          if (topProductsResponse && topProductsResponse.length > 0) {
            setTopProducts(topProductsResponse);
          }
        } catch (productsError) {
          console.error("Error loading top products:", productsError);
          toast.error("Không thể tải dữ liệu sản phẩm bán chạy");
        }
        
        // Get inventory data in a separate try-catch
        try {
          const inventoryResponse = await dashboardApi.getLowStockProducts(5, 20);
          if (inventoryResponse && inventoryResponse.length > 0) {
            setInventoryData(inventoryResponse);
          }
        } catch (inventoryError) {
          console.error("Error loading inventory data:", inventoryError);
          toast.error("Không thể tải dữ liệu tồn kho");
        }
        
      } catch (error) {
        setHasError(true);
        setErrorMessage(error.message || "Không thể kết nối đến máy chủ");
        
        // Retry after 5 seconds if we have less than 3 retries
        if (retryCount < 3) {
          toast.error(`Đang thử kết nối lại (lần ${retryCount + 1}/3)...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 5000);
        } else {
          toast.error("Không thể tải dữ liệu sau nhiều lần thử lại");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [retryCount, formatCurrency]);

  const recentActivityIcon = (type) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case "product":
        return <LucideBox className="h-4 w-4 text-green-500" />;
      case "user":
        return <Users className="h-4 w-4 text-purple-500" />;
      default:
        return <ClipboardList className="h-4 w-4 text-gray-500" />;
    }
  };

  // Handler to manually refresh data
  const handleRefresh = () => {
    setRetryCount(prev => prev + 1);
  };

  return (
    <div id="dashboard-report" className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Tổng quan hệ thống</h2>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium mr-2"
          >
            {isLoading ? "Đang tải..." : "Làm mới dữ liệu"}
          </button>
          <button
            onClick={() => exportToPDF("dashboard", setExportLoading)}
            disabled={exportLoading || isLoading || hasError}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium"
          >
            {exportLoading ? "Đang xử lý..." : "Xuất PDF"}
          </button>
          <button
            onClick={() => exportToExcel("dashboard", setExportLoading)}
            disabled={isLoading || hasError}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium"
          >
            Xuất Excel
          </button>
          <button
            onClick={() => sendReportEmail("dashboard", setExportLoading)}
            disabled={isLoading || hasError}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium"
          >
            Gửi Email
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-3 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      ) : hasError ? (
        <div className="text-center py-10 bg-red-50 rounded-lg">
          <div className="text-red-500 text-5xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Không thể tải dữ liệu</h3>
          <p className="text-red-600 mb-4">{errorMessage}</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={MonetizationOnIcon}
              title="Tổng doanh thu"
              value={
                formatCurrency
                  ? formatCurrency(dashboardData.totalRevenue || 0)
                  : new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(dashboardData.totalRevenue || 0)
              }
              bgColor="bg-green-50"
            />
            <StatCard
              icon={ShoppingCartIcon}
              title="Tổng đơn hàng"
              value={dashboardData.totalOrders || 0}
              bgColor="bg-blue-50"
            />
            <StatCard
              icon={InventoryIcon}
              title="Sản phẩm"
              value={dashboardData.totalProducts || 0}
              bgColor="bg-yellow-50"
            />
            <StatCard
              icon={PeopleIcon}
              title="Khách hàng"
              value={dashboardData.totalCustomers || 0}
              bgColor="bg-purple-50"
            />
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                Doanh thu theo thời gian
              </h3>
              <MuiTooltip title="Doanh thu 7 ngày gần nhất">
                <div>
                  <FaChartLine className="text-gray-500" />
                </div>
              </MuiTooltip>
            </div>
            <div className="chart-container">
              {revenueData.length > 0 ? (
                <RevenueChart
                  revenueData={revenueData}
                  formatCurrency={formatCurrency}
                />
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    Không có dữ liệu doanh thu
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Top 5 sản phẩm bán chạy */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                Top 5 sản phẩm bán chạy
              </h3>
              <MuiTooltip title="Sản phẩm bán chạy nhất">
                <div>
                  <FaShoppingBasket className="text-gray-500" />
                </div>
              </MuiTooltip>
            </div>
            <ErrorBoundary>
              {topProducts && topProducts.length > 0 ? (
                <TableContainer component={Paper} className="shadow-sm">
                  <Table>
                    <TableHead style={{ backgroundColor: "#f9fafb" }}>
                      <TableRow>
                        <TableCell className="font-medium">Sản phẩm</TableCell>
                        <TableCell className="font-medium">Danh mục</TableCell>
                        <TableCell className="font-medium" align="right">
                          Đã bán
                        </TableCell>
                        <TableCell className="font-medium" align="right">
                          Doanh thu
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topProducts.slice(0, 5).map((product, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{product.name || product.productName || "Không xác định"}</TableCell>
                          <TableCell>{product?.category || product?.productCategory || "Không phân loại"}</TableCell>
                          <TableCell align="right">{product.sold || product.quantitySold || 0}</TableCell>
                          <TableCell align="right">
                            {formatCurrency
                              ? formatCurrency(product.revenue || product.totalRevenue || 0)
                              : new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(product.revenue || product.totalRevenue || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* If we have fewer than 5 products, add empty rows to maintain consistent layout */}
                      {topProducts.length < 5 && Array(5 - topProducts.length).fill().map((_, index) => (
                        <TableRow key={`empty-${index}`} hover>
                          <TableCell colSpan={4} align="center" className="text-gray-400 italic">
                            {index === 0 ? "Không đủ dữ liệu sản phẩm bán chạy" : ""}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    Không có dữ liệu sản phẩm bán chạy
                  </p>
                </div>
              )}
            </ErrorBoundary>
          </div>

          {/* Danh sách hàng tồn kho dưới 20 */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                Sản phẩm sắp hết hàng (dưới 20)
              </h3>
              <div className="flex items-center">
                <button 
                  onClick={() => {
                    // Fetch inventory data again
                    setIsLoading(true);
                    dashboardApi.getLowStockProducts(5, 20)
                      .then(data => {
                        setInventoryData(data);
                        toast.success("Đã cập nhật dữ liệu tồn kho");
                      })
                      .catch(error => {
                        console.error("Error refreshing inventory data:", error);
                        toast.error("Không thể cập nhật dữ liệu tồn kho");
                      })
                      .finally(() => setIsLoading(false));
                  }}
                  className="mr-2 text-blue-500 hover:text-blue-700"
                  title="Làm mới dữ liệu tồn kho"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </button>
                <MuiTooltip title="Hàng tồn kho thấp">
                  <div>
                    <FaWarehouse className="text-gray-500" />
                  </div>
                </MuiTooltip>
              </div>
            </div>
            <ErrorBoundary>
              <TableContainer component={Paper} className="shadow-sm">
                <Table>
                  <TableHead style={{ backgroundColor: "#f9fafb" }}>
                    <TableRow>
                      <TableCell className="font-medium">Sản phẩm</TableCell>
                      <TableCell className="font-medium">Danh mục</TableCell>
                      <TableCell className="font-medium" align="right">
                        Số lượng
                      </TableCell>
                      <TableCell className="font-medium">
                        Trạng thái
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading ? (
                      // Loading state
                      <TableRow>
                        <TableCell colSpan={4} align="center" className="py-10">
                          <div className="flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                            <p className="text-gray-500">Đang tải dữ liệu tồn kho...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : inventoryData && inventoryData.length > 0 ? (
                      // Map through available inventory data - individual products
                      inventoryData.map((item, index) => (
                        <TableRow key={item.id || index} hover>
                          <TableCell className="py-3">
                            <div className="flex items-center">
                              {item.image ? (
                                <img 
                                  src={item.image} 
                                  alt={item.name} 
                                  className="w-10 h-10 object-cover mr-3 rounded"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://via.placeholder.com/40";
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 flex items-center justify-center mr-3 rounded">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-800">{item.name}</p>
                                {item.sku && (
                                  <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell align="right" className="font-medium">{item.stock}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.stock <= 5
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {item.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      // If no data, show placeholder message
                      <TableRow>
                        <TableCell colSpan={4} align="center" className="py-8 text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <FaWarehouse className="text-gray-300 text-4xl mb-2" />
                            <p>Không có dữ liệu sản phẩm sắp hết hàng</p>
                            <button 
                              onClick={() => {
                                // Fetch inventory data again
                                setIsLoading(true);
                                dashboardApi.getLowStockProducts(5, 20)
                                  .then(data => {
                                    setInventoryData(data);
                                    toast.success("Đã cập nhật dữ liệu tồn kho");
                                  })
                                  .catch(error => {
                                    console.error("Error refreshing inventory data:", error);
                                    toast.error("Không thể cập nhật dữ liệu tồn kho");
                                  })
                                  .finally(() => setIsLoading(false));
                              }}
                              className="mt-3 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              Thử lại
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </ErrorBoundary>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                Hoạt động gần đây
              </h3>
              <MuiTooltip title="Các hoạt động của hệ thống">
                <div>
                  <FiActivity className="text-gray-500" />
                </div>
              </MuiTooltip>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              {dashboardData.recentActivities &&
              dashboardData.recentActivities.length > 0 ? (
                <ul className="space-y-3">
                  {dashboardData.recentActivities
                    .slice(0, 5)
                    .map((activity, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-0"
                      >
                        <div className="mt-1 bg-gray-100 rounded-full p-1.5">
                          {recentActivityIcon(activity.type)}
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">
                            {activity.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(activity.timestamp).toLocaleString(
                              "vi-VN"
                            )}
                          </p>
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Không có hoạt động nào gần đây
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

DashboardReport.propTypes = {
  exportToPDF: PropTypes.func.isRequired,
  exportToExcel: PropTypes.func.isRequired,
  sendReportEmail: PropTypes.func.isRequired,
  exportLoading: PropTypes.bool,
  setExportLoading: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func,
};

DashboardReport.defaultProps = {
  exportLoading: false,
};

export default DashboardReport;
