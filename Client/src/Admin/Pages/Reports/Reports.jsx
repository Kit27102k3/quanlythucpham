import { useState, useEffect } from "react";
import reportsApi from "../../../api/reportsApi";

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
} from "./components";

// Import utility functions
import {
  formatCurrency,
  exportToPDF,
  exportToExcel,
  sendReportEmail,
} from "./utils/reportUtils";

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

  // Function to fetch data from API
  const fetchData = async (fetchFunction, setter) => {
    try {
      const data = await fetchFunction();
      if (data) {
        console.log('Using API data');
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
              console.log("Fetching system activity data");
              return reportsApi.getSystemActivityData(timeRange);
            },
            (data) => {
              console.log("Setting system activity data:", data);
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
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Báo cáo & Thống kê</h1>

      {/* Tabs */}
      <div className="mb-6 overflow-x-auto hide-scrollbar">
        <div className="whitespace-nowrap">
          {[
            { id: "dashboard", label: "Tổng quan" },
            { id: "revenue", label: "Doanh thu" },
            { id: "top-products", label: "Top sản phẩm" },
            { id: "inventory", label: "Tồn kho" },
            { id: "users", label: "Người dùng" },
            { id: "orders", label: "Đơn hàng" },
            { id: "promotions", label: "Khuyến mãi" },
            { id: "system-activity", label: "Hệ thống" },
            { id: "delivery", label: "Giao hàng" },
            { id: "feedback", label: "Phản hồi" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 mr-2 rounded-md ${
                activeTab === tab.id
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
            </div>

      {/* Time range selector */}
      {activeTab !== "dashboard" && activeTab !== "inventory" && (
        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-gray-700">Thời gian:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1"
            >
              <option value="week">7 ngày qua</option>
              <option value="month">30 ngày qua</option>
              <option value="year">12 tháng qua</option>
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default Reports; 
