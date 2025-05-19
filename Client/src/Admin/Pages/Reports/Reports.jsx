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

// Import sample data utilities
import {
  getSampleDashboardData,
  getSampleRevenueData,
  getSampleTopProducts,
  getSampleInventory,
  getSampleUserData,
  getSampleOrderData,
  getSamplePromotionData,
  getSampleSystemActivityData,
  getSampleDeliveryData,
  getSampleFeedbackData,
} from "./utils/sampleData";

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

  const fetchDataWithFallback = async (fetchFunction, setter, sampleDataFn) => {
    try {
      const data = await fetchFunction();
      if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
        console.log('Using API data');
        setter(data);
        return true;
      }
      console.log('API returned empty data, using sample data');
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    
    // Fallback to sample data
    console.log('Using sample data');
    setter(sampleDataFn());
    return false;
  };

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      
      try {
        // Use promise.all to fetch data in parallel
        await Promise.all([
          // Dashboard data
          fetchDataWithFallback(
            reportsApi.getDashboardData,
            setDashboardData,
            getSampleDashboardData
          ),
          
          // Revenue data
          fetchDataWithFallback(
            () => reportsApi.getRevenueData(timeRange, filters.paymentMethod, filters.region),
            setRevenueData,
            () => getSampleRevenueData(timeRange)
          ),
          
          // Top products data
          fetchDataWithFallback(
            reportsApi.getTopProducts,
            setTopProducts,
            getSampleTopProducts
          ),
          
          // Inventory data
          fetchDataWithFallback(
            reportsApi.getInventoryData,
            setInventory,
            getSampleInventory
          ),
          
          // User data
          fetchDataWithFallback(
            reportsApi.getUserData,
            setUserData,
            getSampleUserData
          ),
          
          // Order data
          fetchDataWithFallback(
            () => reportsApi.getOrderData(timeRange),
            setOrderData,
            getSampleOrderData
          ),
          
          // Promotion data
          fetchDataWithFallback(
            () => reportsApi.getPromotionData(timeRange),
            setPromotionData,
            getSamplePromotionData
          ),
          
          // System activity data
          fetchDataWithFallback(
            () => reportsApi.getSystemActivityData(timeRange),
            setSystemActivityData,
            getSampleSystemActivityData
          ),
          
          // Delivery data
          fetchDataWithFallback(
            () => reportsApi.getDeliveryData(timeRange),
            setDeliveryData,
            getSampleDeliveryData
          ),
          
          // Feedback data
          fetchDataWithFallback(
            () => reportsApi.getFeedbackData(timeRange),
            setFeedbackData,
            getSampleFeedbackData
          )
        ]);
      } catch (error) {
        console.error("Error loading report data:", error);
        
        // Fallback to sample data for all reports
        setDashboardData(getSampleDashboardData());
        setRevenueData(getSampleRevenueData(timeRange));
        setTopProducts(getSampleTopProducts());
        setInventory(getSampleInventory());
        setUserData(getSampleUserData());
        setOrderData(getSampleOrderData());
        setPromotionData(getSamplePromotionData());
        setSystemActivityData(getSampleSystemActivityData());
        setDeliveryData(getSampleDeliveryData());
        setFeedbackData(getSampleFeedbackData());
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
            topProductsData={topProducts}
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
            inventoryData={inventory}
            exportToPDF={exportToPDF}
            exportToExcel={exportToExcel}
            sendReportEmail={sendReportEmail}
            exportLoading={exportLoading}
            setExportLoading={setExportLoading}
            formatCurrency={formatCurrency}
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
