/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import {reportsApi} from "../../../api/reportsApi";

// Import report components
import {
  PromotionReport,
  SystemActivityReport,
  DeliveryReport,
  FeedbackReport,
  DashboardReport,
  RevenueReport,
  TopProductsReport,
  InventoryReport,
  UserReport,
  OrderReport,
  AnalysisReport,
  AutoExportManager
} from "./components";

// Import utility functions
import {
  formatCurrency,
  exportToPDF,
  exportToExcel,
  sendReportEmail,
} from "./utils/reportUtils";

// Import auto export initialization
import { initAutoExport } from "./utils/autoExport";

// Initialize auto export system
initAutoExport();

const Reports = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [timeRange, setTimeRange] = useState("week");
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [userData, setUserData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for additional reports
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    recentActivities: [],
  });
  const [orderData, setOrderData] = useState([]);
  const [promotionData, setPromotionData] = useState([]);
  const [systemActivityData, setSystemActivityData] = useState([]);
  const [deliveryData, setDeliveryData] = useState([]);
  const [feedbackData, setFeedbackData] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    paymentMethod: "all",
    region: "all",
  });
  const [exportLoading, setExportLoading] = useState(false);

  // Get user role and branch ID from your auth context or state management
  const userRole = "admin"; // Replace with actual user role from your auth system
  const branchId = "1"; // Replace with actual branch ID from your auth system

  // Function to fetch data from API
  const fetchData = async (fetchFunction, setter) => {
    try {
      const data = await fetchFunction();
      if (data) {
        setter(data);
      } else {
        console.warn('API returned empty or null data');
        setter([]); // Set empty array or appropriate default value
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setter([]); // Set empty array or appropriate default value on error
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      
      try {
        // Lấy dữ liệu dashboard
        const dashboardResult = await reportsApi.getDashboardData();
        
        // Lấy dữ liệu doanh thu cho dashboard tuần hiện tại
        const revenueWeeklyData = await reportsApi.getRevenueData('week');
        
        // Cập nhật dữ liệu dashboard kèm dữ liệu doanh thu tuần
        if (dashboardResult) {
          setDashboardData({
            ...dashboardResult,
            revenueData: revenueWeeklyData || [] // Thêm dữ liệu doanh thu vào dashboard
          });
        } else {
          setDashboardData({
            revenueData: revenueWeeklyData || []
          });
        }
        
        // Use promise.all to fetch other data in parallel
        await Promise.all([
          // Revenue data for revenue tab
          fetchData(
            () => reportsApi.getRevenueData(timeRange, filters.paymentMethod, filters.region),
            setRevenueData
          ),
          
          // Top products data
          fetchData(
            reportsApi.getTopProducts,
            setTopProducts
          ),
          
          // Inventory data
          fetchData(
            reportsApi.getInventoryData,
            setInventory
          ),
          
          // User data
          fetchData(
            reportsApi.getUserData,
            setUserData
          ),
          
          // Order data
          fetchData(
            () => reportsApi.getOrderData(timeRange),
            setOrderData
          ),
          
          // Promotion data
          fetchData(
            () => reportsApi.getPromotionData(timeRange),
            setPromotionData
          ),
          
          // System activity data
          fetchData(
            () => {
              return reportsApi.getSystemActivityData(timeRange);
            },
            (data) => {
              setSystemActivityData(data);
            }
          ),
          
          // Delivery data
          fetchData(
            () => reportsApi.getDeliveryData(timeRange),
            setDeliveryData
          ),
          
          // Feedback data
          fetchData(
            () => reportsApi.getFeedbackData(timeRange),
            setFeedbackData
          )
        ]);
      } catch (error) {
        console.error("Error loading report data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [timeRange, filters.paymentMethod, filters.region]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: value
    }));
  };

  const renderContent = () => {
    if (isLoading) {
    return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <span className="ml-3 text-gray-700">Đang tải dữ liệu...</span>
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardReport
            dashboardData={dashboardData}
            exportToPDF={exportToPDF}
            exportToExcel={exportToExcel}
            sendReportEmail={sendReportEmail}
            exportLoading={exportLoading}
            setExportLoading={setExportLoading}
            formatCurrency={formatCurrency}
          />
        );
      case "revenue":
        return (
          <RevenueReport
            revenueData={revenueData}
            paymentFilter={filters.paymentMethod}
            regionFilter={filters.region}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            onFilterChange={handleFilterChange}
            exportToPDF={exportToPDF}
            exportToExcel={exportToExcel}
            sendReportEmail={sendReportEmail}
            exportLoading={exportLoading}
            setExportLoading={setExportLoading}
            formatCurrency={formatCurrency}
          />
        );
      case "top-products":
        return (
          <TopProductsReport
            topProducts={topProducts}
            exportToPDF={exportToPDF}
            exportToExcel={exportToExcel}
            sendReportEmail={sendReportEmail}
            exportLoading={exportLoading}
            setExportLoading={setExportLoading}
            formatCurrency={formatCurrency}
          />
        );
      case "inventory":
        return (
          <InventoryReport
            inventory={inventory}
            exportToPDF={exportToPDF}
            exportToExcel={exportToExcel}
            sendReportEmail={sendReportEmail}
            exportLoading={exportLoading}
            setExportLoading={setExportLoading}
          />
        );
      case "users":
        return (
          <UserReport
            userData={userData}
            exportToPDF={exportToPDF}
            exportToExcel={exportToExcel}
            sendReportEmail={sendReportEmail}
            exportLoading={exportLoading}
            setExportLoading={setExportLoading}
          />
        );
      case "orders":
        return (
          <OrderReport
            orderData={orderData}
            exportToPDF={exportToPDF}
            exportToExcel={exportToExcel}
            sendReportEmail={sendReportEmail}
            exportLoading={exportLoading}
            setExportLoading={setExportLoading}
            formatCurrency={formatCurrency}
          />
        );
      case "promotions":
        return (
          <PromotionReport
            promotionData={promotionData}
            exportToPDF={exportToPDF}
            exportToExcel={exportToExcel}
            sendReportEmail={sendReportEmail}
            exportLoading={exportLoading}
            setExportLoading={setExportLoading}
            formatCurrency={formatCurrency}
          />
        );
      case "system-activity":
        return (
          <SystemActivityReport
            systemActivityData={systemActivityData}
            exportToPDF={exportToPDF}
            exportToExcel={exportToExcel}
            sendReportEmail={sendReportEmail}
            exportLoading={exportLoading}
            setExportLoading={setExportLoading}
          />
        );
      case "delivery":
        return (
          <DeliveryReport
            deliveryData={deliveryData}
            exportToPDF={exportToPDF}
            exportToExcel={exportToExcel}
            sendReportEmail={sendReportEmail}
            exportLoading={exportLoading}
            setExportLoading={setExportLoading}
            formatCurrency={formatCurrency}
          />
        );
      case "feedback":
        return (
          <FeedbackReport
            feedbackData={feedbackData}
            exportToPDF={exportToPDF}
            exportToExcel={exportToExcel}
            sendReportEmail={sendReportEmail}
            exportLoading={exportLoading}
            setExportLoading={setExportLoading}
          />
        );
      case "analysis":
        return (
          <AnalysisReport
            userRole={userRole}
            branchId={branchId}
          />
        );
      case "auto-export":
        return (
          <AutoExportManager
            setExportLoading={setExportLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Báo cáo</h1>
        <p className="text-gray-600">Xem và phân tích dữ liệu hệ thống</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`${
              activeTab === "dashboard"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab("revenue")}
            className={`${
              activeTab === "revenue"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Doanh thu
          </button>
          <button
            onClick={() => setActiveTab("top-products")}
            className={`${
              activeTab === "top-products"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Sản phẩm bán chạy
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`${
              activeTab === "inventory"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Tồn kho
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`${
              activeTab === "users"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Người dùng
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`${
              activeTab === "orders"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Đơn hàng
          </button>
          <button
            onClick={() => setActiveTab("promotions")}
            className={`${
              activeTab === "promotions"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Khuyến mãi
          </button>
          <button
            onClick={() => setActiveTab("system-activity")}
            className={`${
              activeTab === "system-activity"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Hoạt động hệ thống
          </button>
          <button
            onClick={() => setActiveTab("delivery")}
            className={`${
              activeTab === "delivery"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Giao hàng
          </button>
          <button
            onClick={() => setActiveTab("feedback")}
            className={`${
              activeTab === "feedback"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Phản hồi
          </button>
            <button
            onClick={() => setActiveTab("analysis")}
            className={`${
              activeTab === "analysis"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
            Phân tích AI
            </button>
          <button
            onClick={() => setActiveTab("auto-export")}
            className={`${
              activeTab === "auto-export"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Xuất tự động
          </button>
        </nav>
            </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {renderContent()}
      </div>
    </div>
  );
};

export default Reports; 
