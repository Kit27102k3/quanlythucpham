/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback, memo } from "react";
import { toast, Toaster } from "sonner";
import { API_BASE_URL } from "../../config/apiConfig";
import branchesApi from "../../api/branchesApi";
import orderApi from "../../api/orderApi";
import { useRef } from "react";

// Import components from Orders folder
import OrderStats from "./Orders/OrderStats";
import OrderItem from "./Orders/OrderItem";
import OrderAutoTransition from "./Orders/OrderAutoTransition";
import StatusTransitionInfo from "./Orders/StatusTransitionInfo";
import {
  ORDER_STATUSES,
  statusFilterOptions,
  formatDate,
  formatCurrency,
  getStatusColor,
  getStatusText,
  getStatusIcon,
  getPaymentMethodText,
  getCustomerName,
  getNextStatuses,
} from "./Orders/OrderHelpers";
import {
  ViewOrderDialog,
  DeleteOrderDialog,
  StatusUpdateDialog,
  PaymentDialog,
  BulkActionDialog,
  AutoTransitionSettingsDialog,
} from "./Orders/OrderDialogs";
import OrderFilters from "./Orders/OrderFilters";
import OrderTable from "./Orders/OrderTable";

// Set display names for components
OrderStats.displayName = "OrderStats";
OrderItem.displayName = "OrderItem";
OrderAutoTransition.displayName = "OrderAutoTransition";
StatusTransitionInfo.displayName = "StatusTransitionInfo";

// Custom hook to safely access user data
const useSafeAuth = () => {
  const [user, setUser] = useState({ role: "admin" });
  const [userRole, setUserRole] = useState("admin");
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Effect to set user data from localStorage
  useEffect(() => {
    try {
      // Try to get user from localStorage
      const localUser = JSON.parse(localStorage.getItem("user") || "{}");
      const localRole = localStorage.getItem("userRole") || "admin";

      if (localUser && Object.keys(localUser).length > 0) {
        setUser(localUser);
        setUserRole(localRole);
      }
    } catch (e) {
      console.error("Error accessing localStorage:", e);
      setHasError(true);
      setErrorMessage("Could not retrieve user data: " + e.message);
    }
  }, []);

  return { user, userRole, hasError, errorMessage };
};

const OrderAdmin = () => {
  // Get user data safely
  const { user, userRole, hasError, errorMessage } = useSafeAuth();
  
  // State for orders and UI
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    preparing: 0,
    packaging: 0,
    shipping: 0,
    delivering: 0,
    completed: 0,
    cancelled: 0,
    delivery_failed: 0,
    awaiting_payment: 0,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // State for filters
  const [filters, setFilters] = useState({
    searchTerm: "",
    statusFilter: "",
    paymentMethodFilter: "",
    paymentStatusFilter: "all",
    dateFilter: null,
    branchFilter: "",
    nearbyFilter: false,
  });

  // State for branches
  const [branches, setBranches] = useState([]);

  // State for modals
  const [viewOrder, setViewOrder] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState(null);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState(null);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkConfirmVisible, setBulkConfirmVisible] = useState(false);
  const [autoTransitionSettingsVisible, setAutoTransitionSettingsVisible] =
    useState(false);

  // State for user branch info
  const [userBranch, setUserBranch] = useState(null);
  const [showOnlyBranchOrders, setShowOnlyBranchOrders] = useState(false);
  const [nearbyOrdersRadius, setNearbyOrdersRadius] = useState(10);

  // State for auto-transition settings
  const [autoTransitionEnabled, setAutoTransitionEnabled] = useState(true);
  const [transitionDelays, setTransitionDelays] = useState({
    pending_to_confirmed: 15,
    confirmed_to_preparing: 30,
    preparing_to_packaging: 45,
    packaging_to_shipping: 60,
  });

  // Load user's branch if manager
  useEffect(() => {
    const loadUserBranch = async () => {
      if (userRole === "manager" && user?.branchId) {
        try {
          const response = await branchesApi.getBranchById(user.branchId);
          setUserBranch(response.data);
          // Auto-set branch filter for managers
          setFilters((prev) => ({
            ...prev,
            branchFilter: user.branchId,
          }));
        } catch (error) {
          console.error("Error loading user branch:", error);
        }
      }
    };

    const loadBranches = async () => {
      if (userRole === "admin") {
        try {
          const response = await branchesApi.getAllBranches();

          // Check if response.data is iterable (array)
          if (response.data && Array.isArray(response.data)) {
            setBranches([
              { _id: "", name: "Tất cả chi nhánh" },
              ...response.data,
            ]);
          } else {
            console.warn("Branches data is not an array:", response.data);
            // Set default empty branches list with just the "All branches" option
            setBranches([{ _id: "", name: "Tất cả chi nhánh" }]);
          }
        } catch (error) {
          console.error("Error loading branches:", error);
          // Set default empty branches list
          setBranches([{ _id: "", name: "Tất cả chi nhánh" }]);
        }
      }
    };

    loadUserBranch();
    loadBranches();
  }, [userRole, user]);

  // Load orders
  const loadOrders = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        let response;
        const pageSize = 10; // Fixed page size to 10

        // Determine which API to call based on user role and filters
        if (userRole === "manager" && filters.branchFilter) {
          response = await orderApi.getOrdersByBranch(
            filters.branchFilter,
            page,
            pageSize,
            filters.searchTerm,
            filters.statusFilter,
            filters.paymentMethodFilter,
            filters.paymentStatusFilter === "paid"
              ? true
              : filters.paymentStatusFilter === "unpaid"
              ? false
              : undefined,
            filters.dateFilter
              ? new Date(filters.dateFilter).toISOString()
              : undefined,
            filters.nearbyFilter
          );
        } else {
          response = await orderApi.getAllOrders(
            page,
            pageSize,
            filters.searchTerm,
            filters.statusFilter,
            filters.paymentMethodFilter,
            filters.paymentStatusFilter === "paid"
              ? true
              : filters.paymentStatusFilter === "unpaid"
              ? false
              : undefined,
            filters.dateFilter
              ? new Date(filters.dateFilter).toISOString()
              : undefined,
            filters.branchFilter || undefined
          );
        }

        // Check if response data is valid
        if (response && response.data) {
          // Handle case where response.data is an array (direct orders array)
          if (Array.isArray(response.data)) {
            setOrders(response.data.slice((page - 1) * 10, page * 10));
            setTotalPages(Math.ceil(response.data.length / 10));

            // Create basic stats from the orders array
            const stats = {
              total: response.data.length,
              pending: response.data.filter(
                (order) => order.status === "pending"
              ).length,
              confirmed: response.data.filter(
                (order) => order.status === "confirmed"
              ).length,
              preparing: response.data.filter(
                (order) => order.status === "preparing"
              ).length,
              packaging: response.data.filter(
                (order) => order.status === "packaging"
              ).length,
              shipping: response.data.filter(
                (order) => order.status === "shipping"
              ).length,
              delivering: response.data.filter(
                (order) => order.status === "delivering"
              ).length,
              completed: response.data.filter(
                (order) => order.status === "completed"
              ).length,
              cancelled: response.data.filter(
                (order) => order.status === "cancelled"
              ).length,
              delivery_failed: response.data.filter(
                (order) => order.status === "delivery_failed"
              ).length,
              awaiting_payment: response.data.filter(
                (order) => order.status === "awaiting_payment"
              ).length,
            };

            setOrderStats(stats);
          }
          // Handle case where response.data.orders is an array (expected structure)
          else if (Array.isArray(response.data.orders)) {
            setOrders(response.data.orders);

            // Set total pages if totalCount exists
            if (response.data.totalCount !== undefined) {
              setTotalPages(Math.ceil(response.data.totalCount / 10));
            } else {
              setTotalPages(Math.ceil(response.data.orders.length / 10));
            }

            setLastRefreshTime(new Date());

            // Update stats if stats object exists
            if (response.data.stats) {
              setOrderStats({
                total: response.data.stats.total || 0,
                pending: response.data.stats.pending || 0,
                confirmed: response.data.stats.confirmed || 0,
                preparing: response.data.stats.preparing || 0,
                packaging: response.data.stats.packaging || 0,
                shipping: response.data.stats.shipping || 0,
                delivering: response.data.stats.delivering || 0,
                completed: response.data.stats.completed || 0,
                cancelled: response.data.stats.cancelled || 0,
                delivery_failed: response.data.stats.delivery_failed || 0,
                awaiting_payment: response.data.stats.awaiting_payment || 0,
              });
            }
          } else {
            setOrders([]);
            setTotalPages(1);
          }
        } else {
          // Handle empty response
          setOrders([]);
          setTotalPages(1);

          if (toast.current) {
            toast.current.show({
              severity: "warn",
              summary: "Thông báo",
              detail: "Không có dữ liệu đơn hàng",
              life: 3000,
            });
          }
        }
      } catch (error) {
        console.error("Error loading orders:", error);
        // Set empty data on error
        setOrders([]);
        setTotalPages(1);

        if (toast.current) {
          toast.current.show({
            severity: "error",
            summary: "Lỗi",
            detail:
              "Không thể tải danh sách đơn hàng: " +
              (error.message || "Lỗi không xác định"),
            life: 3000,
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [userRole, filters]
  );

  // Load orders when filters change
  useEffect(() => {
    loadOrders(currentPage);
    // Reset selected orders when filters change
    setSelectedOrders([]);
  }, [loadOrders, currentPage]);

  // Handle pagination
  const onPage = (event) => {
    setCurrentPage(event.page || 1);
  };

  // Clear filters
  const clearFilters = () => {
    // For managers, keep their branch filter
    if (userRole === "manager") {
      setFilters({
        searchTerm: "",
        statusFilter: "",
        paymentMethodFilter: "",
        paymentStatusFilter: "",
        dateFilter: null,
        branchFilter: user?.branchId || "",
        nearbyFilter: false,
      });
    } else {
      setFilters({
        searchTerm: "",
        statusFilter: "",
        paymentMethodFilter: "",
        paymentStatusFilter: "",
        dateFilter: null,
        branchFilter: "",
        nearbyFilter: false,
      });
    }
  };

  // Handle branch filter change
  const handleBranchChange = (e) => {
    setFilters({
      ...filters,
      branchFilter: e.value,
    });
  };

  // Handle view order
  const handleViewOrder = (order) => {
    setViewOrder(order);
  };

  // Handle delete order
  const handleDeleteOrder = (order) => {
    setSelectedOrderId(order._id);
    setDeleteDialog(true);
  };

  // Confirm delete order
  const confirmDeleteOrder = async () => {
    try {
      await orderApi.deleteOrder(selectedOrderId);

      if (toast.current) {
        toast.current.show({
          severity: "success",
          summary: "Thành công",
          detail: "Đã xóa đơn hàng",
          life: 3000,
        });
      }

      loadOrders(currentPage);
    } catch (error) {
      console.error("Error deleting order:", error);
      if (toast.current) {
        toast.current.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể xóa đơn hàng",
          life: 3000,
        });
      }
    } finally {
      setDeleteDialog(false);
      setSelectedOrderId(null);
    }
  };

  // Handle update status
  const handleUpdateStatus = (order) => {
    setSelectedOrderForStatus(order);
    setStatusDialogVisible(true);
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Cập nhật UI ngay lập tức
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => 
          order._id === orderId 
            ? { 
                ...order, 
                status: newStatus,
                isPaid: newStatus === ORDER_STATUSES.COMPLETED ? true : order.isPaid
              } 
            : order
        );
        return updatedOrders;
      });
      
      // Hiển thị thông báo thành công ngay lập tức
      toast.success('Đang cập nhật...', {
        description: `Đang cập nhật trạng thái thành ${getStatusText(newStatus)}`,
        position: "top-right",
      });
      
      // Đóng dialog
      setStatusDialogVisible(false);
      setSelectedOrderForStatus(null);
      
      // Gọi API ở background
      orderApi.updateOrderStatus(orderId, newStatus)
        .then(() => {
          // Reload data sau khi API hoàn thành
          loadOrders(currentPage);
        })
        .catch(error => {
          console.error('Error updating order status:', error);
          toast.error('Có lỗi xảy ra', {
            description: 'Đã có lỗi khi cập nhật. Vui lòng tải lại trang để xem trạng thái mới nhất.',
            position: "top-right",
          });
        });
    } catch (error) {
      console.error('Error in update process:', error);
      toast.error('Lỗi', {
        description: 'Không thể cập nhật trạng thái đơn hàng',
        position: "top-right",
      });
      setStatusDialogVisible(false);
      setSelectedOrderForStatus(null);
    }
  };

  // Handle mark as paid
  const handleMarkAsPaid = (order) => {
    setPaymentOrderId(order._id);
    setPaymentDialog(true);
  };

  // Confirm mark as paid
  const confirmMarkAsPaid = async () => {
    try {
      await orderApi.markOrderAsPaid(paymentOrderId);
      
      toast.success('Thành công', {
        description: 'Đã đánh dấu đơn hàng là đã thanh toán',
        position: "top-right",
      });
      
      loadOrders(currentPage);
    } catch (error) {
      console.error('Error marking order as paid:', error);
      toast.error('Lỗi', {
        description: 'Không thể cập nhật trạng thái thanh toán',
        position: "top-right",
      });
    } finally {
      setPaymentDialog(false);
      setPaymentOrderId(null);
    }
  };

  // Open bulk confirm dialog
  const openBulkConfirm = () => {
    if (selectedOrders.length === 0) {
      toast.warning("Không có đơn hàng nào được chọn", {
        description: "Vui lòng chọn ít nhất một đơn hàng để cập nhật",
        position: "top-right",
      });
      return;
    }

    if (!bulkStatus) {
      toast.warning("Chưa chọn trạng thái", {
        description: "Vui lòng chọn trạng thái để cập nhật đơn hàng",
        position: "top-right",
      });
      return;
    }

    setBulkConfirmVisible(true);
  };

  // Execute bulk update
  const executeBulkUpdate = async () => {
    try {
      if (!bulkStatus) {
        toast.warning("Vui lòng chọn trạng thái để cập nhật", {
          description: "Không thể cập nhật khi chưa chọn trạng thái",
          position: "top-right",
        });
        setBulkConfirmVisible(false);
        return;
      }
      
      const orderIds = selectedOrders.map(order => order._id);
      
      // Cập nhật UI ngay lập tức
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => 
          orderIds.includes(order._id) 
            ? { 
                ...order, 
                status: bulkStatus,
                isPaid: bulkStatus === ORDER_STATUSES.COMPLETED ? true : order.isPaid
              } 
            : order
        );
        return updatedOrders;
      });
      
      // Hiển thị thông báo thành công ngay lập tức
      toast.success("Đang cập nhật...", {
        description: `Đang cập nhật ${selectedOrders.length} đơn hàng sang trạng thái ${getStatusText(bulkStatus)}`,
        position: "top-right",
      });
      
      // Đóng dialog và reset selection
      setBulkConfirmVisible(false);
      setSelectedOrders([]);
      
      // Gọi API ở background
      orderApi.bulkUpdateStatus(orderIds, bulkStatus)
        .then(() => {
          // Reload data sau khi API hoàn thành
          loadOrders(currentPage);
        })
        .catch(error => {
          console.error('Error bulk updating orders:', error);
          toast("Có lỗi xảy ra", {
            description: 'Đã có lỗi khi cập nhật. Vui lòng tải lại trang để xem trạng thái mới nhất.',
            position: "top-right",
            style: { backgroundColor: "#FEF2F2", color: "#B91C1C", borderColor: "#F87171" }
          });
        });
    } catch (error) {
      console.error('Error in bulk update process:', error);
      toast("Không thể cập nhật đơn hàng", {
        description: error.message || 'Đã xảy ra lỗi khi cập nhật hàng loạt đơn hàng',
        position: "top-right",
        style: { backgroundColor: "#FEF2F2", color: "#B91C1C", borderColor: "#F87171" }
      });
      setBulkConfirmVisible(false);
    } finally {
      setBulkStatus('');
    }
  };

  // Open update status dialog
  const openUpdateStatusDialog = (order) => {
    setSelectedOrderForStatus(order);
    setStatusDialogVisible(true);
  };

  // If there's an error with Redux, display an error message
  if (hasError) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i
              className="pi pi-exclamation-triangle text-red-500"
              style={{ fontSize: "2rem" }}
            />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Lỗi: Không thể tải trang quản lý đơn hàng
          </h2>
          <p className="mb-4 text-gray-600">
            Đã xảy ra lỗi khi tải component quản lý đơn hàng.
          </p>
          <p className="text-sm text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg">
            {errorMessage}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md"
          >
            <i className="pi pi-refresh mr-2"></i>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Render component
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" richColors />
      
      {/* Header và thống kê */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Quản lý đơn hàng</h1>
        <p className="text-gray-600 mb-6">
          Quản lý và theo dõi tất cả đơn hàng trong hệ thống
        </p>
        
        {/* Thống kê đơn hàng */}
        <OrderStats stats={orderStats} />
      </div>
      <OrderFilters
        filters={filters}
        setFilters={setFilters}
        statusOptions={statusFilterOptions}
        paymentMethodOptions={[
          { label: "Tất cả phương thức", value: "" },
          { label: "Tiền mặt (COD)", value: "COD" },
          { label: "Chuyển khoản", value: "BANK_TRANSFER" },
          { label: "VNPay", value: "VNPAY" },
        ]}
        paymentStatusOptions={[
          { label: "Tất cả trạng thái", value: "all" },
          { label: "Đã thanh toán", value: "paid" },
          { label: "Chưa thanh toán", value: "unpaid" },
        ]}
        clearFilters={clearFilters}
        userRole={userRole}
        userBranch={userBranch}
        branches={branches}
        handleBranchChange={handleBranchChange}
        dropdownStyle={{
          panel: {
            className: "bg-white border border-gray-200 rounded-lg shadow-lg",
          },
          item: { className: "p-2 hover:bg-blue-50 cursor-pointer" },
          trigger: { className: "p-button-outlined w-full" },
          list: { className: "p-0 max-h-60 overflow-auto" },
        }}
      />

      {/* Bảng đơn hàng */}
      <OrderTable
        orders={orders}
        loading={loading}
        selectedOrders={selectedOrders}
        setSelectedOrders={setSelectedOrders}
        first={currentPage - 1}
        totalRecords={totalPages * itemsPerPage}
        onPage={onPage}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
        getPaymentMethodText={getPaymentMethodText}
        handleViewOrder={handleViewOrder}
        handleDeleteOrder={handleDeleteOrder}
        handleMarkAsPaid={handleMarkAsPaid}
        handleUpdateStatus={handleUpdateStatus}
        ORDER_STATUSES={ORDER_STATUSES}
        showBulkActions={userRole !== "user"}
        setBulkStatus={setBulkStatus}
        bulkStatus={bulkStatus}
        openBulkConfirm={openBulkConfirm}
        userRole={userRole}
      />

      {/* Các dialog */}
      <ViewOrderDialog
        viewOrder={viewOrder}
        setViewOrder={setViewOrder}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
        getStatusIcon={getStatusIcon}
        getPaymentMethodText={getPaymentMethodText}
        ORDER_STATUSES={ORDER_STATUSES}
        openUpdateStatusDialog={openUpdateStatusDialog}
      />

      <DeleteOrderDialog
        deleteDialog={deleteDialog}
        setDeleteDialog={setDeleteDialog}
        handleDeleteOrder={confirmDeleteOrder}
      />

      <StatusUpdateDialog
        statusDialogVisible={statusDialogVisible}
        setStatusDialogVisible={setStatusDialogVisible}
        selectedOrderForStatus={selectedOrderForStatus}
        getNextStatuses={getNextStatuses}
        updateOrderStatus={updateOrderStatus}
        getStatusText={getStatusText}
        getStatusColor={getStatusColor}
        getStatusIcon={getStatusIcon}
      />

      <PaymentDialog
        paymentDialog={paymentDialog}
        setPaymentDialog={setPaymentDialog}
        handleMarkAsPaid={confirmMarkAsPaid}
      />

      <BulkActionDialog
        bulkConfirmVisible={bulkConfirmVisible}
        setBulkConfirmVisible={setBulkConfirmVisible}
        bulkStatus={bulkStatus}
        selectedOrders={selectedOrders}
        getStatusText={getStatusText}
        executeBulkUpdate={executeBulkUpdate}
      />

      <AutoTransitionSettingsDialog
        autoTransitionSettingsVisible={autoTransitionSettingsVisible}
        setAutoTransitionSettingsVisible={setAutoTransitionSettingsVisible}
        autoTransitionEnabled={autoTransitionEnabled}
        setAutoTransitionEnabled={setAutoTransitionEnabled}
        transitionDelays={transitionDelays}
        setTransitionDelays={setTransitionDelays}
      />

      {/* Thông tin chi nhánh */}
      <div className="mt-8 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center">
          <i className="pi pi-map-marker text-blue-500 mr-2"></i>
          <div>
            {userRole === "manager" ? (
              <span className="font-medium">
                Quản lý chi nhánh <strong>{userBranch?.name}</strong>
                {userBranch?.address && ` - ${userBranch.address}`}
              </span>
            ) : (
              <div>
                {showOnlyBranchOrders ? (
                  <span>
                    Đang hiển thị đơn hàng của chi nhánh: {userBranch?.name}
                  </span>
                ) : (
                  <span>
                    Bạn đang xem các đơn hàng thuộc phạm vi chi nhánh của bạn
                    (bán kính {nearbyOrdersRadius}km)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Export memoized component
export default memo(OrderAdmin);
