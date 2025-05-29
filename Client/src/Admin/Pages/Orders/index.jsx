import { useState, useEffect, useCallback, memo } from 'react';
import { Toaster } from 'sonner';
import branchesApi from '../../../api/branchesApi';
import orderApi from '../../../api/orderApi';
import { useSelector } from 'react-redux';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import OrderStats from './OrderStats';
import OrderItem from './OrderItem';
import OrderAutoTransition from './OrderAutoTransition';
import StatusTransitionInfo from './StatusTransitionInfo';
import { 
  ORDER_STATUSES,
  statusFilterOptions,
  formatDate, 
  formatCurrency, 
  getStatusColor,
  getStatusText,
  getStatusIcon,
  getPaymentMethodText,
} from './OrderHelpers';

import { 
  ViewOrderDialog,
  DeleteOrderDialog,
  StatusUpdateDialog,
  PaymentDialog,
  BulkActionDialog,
  AutoTransitionSettingsDialog
} from './OrderDialogs';
import OrderFilters from './OrderFilters';
import OrderTable from './OrderTable';

OrderStats.displayName = 'OrderStats';
OrderItem.displayName = 'OrderItem';
OrderAutoTransition.displayName = 'OrderAutoTransition';
StatusTransitionInfo.displayName = 'StatusTransitionInfo';

const OrderAdmin = () => {
  const toast = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const userRole = user?.role || 'user';
  
  // State for orders and UI
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [bulkStatus, setBulkStatus] = useState('');
  const [filters, setFilters] = useState({
    searchTerm: '',
    statusFilter: '',
    paymentMethodFilter: '',
    paymentStatusFilter: 'all',
    dateFilter: null,
    branchFilter: '',
    nearbyFilter: false
  });
  
  // Add missing state for branches
  const [branches, setBranches] = useState([]);

  // State for modals
  const [viewOrder, setViewOrder] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState(null);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState(null);
  const [bulkConfirmVisible, setBulkConfirmVisible] = useState(false);
  const [autoTransitionSettingsVisible, setAutoTransitionSettingsVisible] = useState(false);
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

  // Các hàm xử lý và useEffect

  // Load user's branch if manager and branches for admin
  useEffect(() => {
    const loadData = async () => {
      // Nếu là manager, load chi nhánh và thiết lập filter
      if (userRole === 'manager' && user?.branchId) {
        try {
          console.log("Manager branchId:", user.branchId);
          const response = await branchesApi.getBranchById(
            typeof user.branchId === 'object' ? user.branchId._id : user.branchId
          );
          console.log("Branch data:", response.data);
          
          // Thiết lập userBranch
          setUserBranch(response.data);
          
          // Thiết lập danh sách branches chỉ với chi nhánh của manager
          if (response.data) {
            setBranches([response.data]);
          }
          
          // Trực tiếp thiết lập branchFilter cho manager (luôn là string id)
          setFilters(prev => ({
            ...prev,
            branchFilter: typeof user.branchId === 'object' ? user.branchId._id : user.branchId
          }));
          
          console.log("Chi nhánh manager được thiết lập:", user.branchId);
        } catch (error) {
          console.error('Error loading user branch:', error);
        }
      } 
      // Nếu là admin, load tất cả chi nhánh
      else if (userRole === 'admin') {
        try {
          const response = await branchesApi.getAllBranches();
          setBranches([
            { _id: '', name: 'Tất cả chi nhánh' },
            ...response.data
          ]);
        } catch (error) {
          console.error('Error loading branches:', error);
        }
      }
    };
    
    loadData();
  }, [userRole, user, user?.branchId]);
  
  // Khởi tạo giá trị mặc định cho filters khi là manager
  useEffect(() => {
    if (userRole === 'manager' && user?.branchId) {
      console.log("Đặt branchFilter ban đầu cho manager:", user.branchId);
      setFilters(prev => ({
        ...prev,
        branchFilter: typeof user.branchId === 'object' ? user.branchId._id : user.branchId
      }));
    }
  }, [userRole, user?.branchId]);
  
  // Load orders
  const loadOrders = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      console.log("loadOrders được gọi với các tham số:");
      console.log("page:", page);
      console.log("filters:", filters);
      console.log("userRole:", userRole);
      console.log("branchFilter:", filters.branchFilter);
      
      let response;
      const pageSize = itemsPerPage;
      const pageNumber = Math.floor(page / pageSize) + 1;
      
      // Determine which API to call based on user role and filters
      if ((userRole === 'manager' && user?.branchId) || (userRole === 'admin' && filters.branchFilter)) {
        const branchToCall = userRole === 'manager' ? user.branchId : filters.branchFilter;
        console.log("Gọi getOrdersByBranch với branchId:", branchToCall);
        
        response = await orderApi.getOrdersByBranch(
          branchToCall,
          pageNumber,
          pageSize,
          filters.searchTerm,
          filters.statusFilter,
          filters.paymentMethodFilter,
          filters.paymentStatusFilter === 'paid' ? true : 
          filters.paymentStatusFilter === 'unpaid' ? false : undefined,
          filters.dateFilter ? new Date(filters.dateFilter).toISOString() : undefined,
          filters.nearbyFilter ? {
            enabled: true,
            radius: nearbyOrdersRadius
          } : undefined
        );
        console.log("Kết quả từ getOrdersByBranch:", response.data);
      } else {
        console.log("Gọi getAllOrders");
        response = await orderApi.getAllOrders(
          pageNumber,
          pageSize,
          filters.searchTerm,
          filters.statusFilter,
          filters.paymentMethodFilter,
          filters.paymentStatusFilter === 'paid' ? true : 
          filters.paymentStatusFilter === 'unpaid' ? false : undefined,
          filters.dateFilter ? new Date(filters.dateFilter).toISOString() : undefined,
          filters.branchFilter || undefined
        );
        console.log("Kết quả từ getAllOrders:", response.data);
      }
      
      setOrders(response.data.orders);
      setTotalPages(Math.ceil(response.data.totalCount / itemsPerPage));
      
      // Update stats
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
      
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách đơn hàng',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, userRole, filters, nearbyOrdersRadius]);
  
  // Load orders when filters change
  useEffect(() => {
    loadOrders(currentPage - 1);
    // Reset selected orders when filters change
    setSelectedOrders([]);
  }, [loadOrders, currentPage]);
  
  // Load orders khi branchFilter thay đổi
  useEffect(() => {
    console.log("Branch filter changed:", filters.branchFilter);
    if (filters.branchFilter) {
      loadOrders(0);
    }
  }, [filters.branchFilter]);
  
  // Handle pagination
  const onPage = (event) => {
    setCurrentPage(event.first + 1);
    setItemsPerPage(event.rows);
  };
  
  // Clear filters
  const clearFilters = () => {
    // For managers, keep their branch filter
    if (userRole === 'manager') {
      setFilters({
        searchTerm: '',
        statusFilter: '',
        paymentMethodFilter: '',
        paymentStatusFilter: '',
        dateFilter: null,
        branchFilter: typeof user?.branchId === 'object' ? user?.branchId._id : user?.branchId || '',
        nearbyFilter: false
      });
    } else {
      setFilters({
        searchTerm: '',
        statusFilter: '',
        paymentMethodFilter: '',
        paymentStatusFilter: '',
        dateFilter: null,
        branchFilter: '',
        nearbyFilter: false
      });
    }
  };
  
  // Handle branch filter change
  const handleBranchChange = (e) => {
    const selectedBranchId = e.value;
    setFilters(prev => ({
      ...prev,
      branchFilter: selectedBranchId
    }));
    
    // Reset nearby filter when changing branches
    if (!selectedBranchId) {
      setFilters(prev => ({
        ...prev,
        nearbyFilter: false
      }));
    }
    
    // Reset to first page
    setCurrentPage(1);
  };
  
  // Get next possible statuses for an order
  const getNextStatuses = (currentStatus) => {
    switch (currentStatus) {
      case ORDER_STATUSES.PENDING:
        return [
          { label: 'Xác nhận đơn hàng', value: ORDER_STATUSES.CONFIRMED },
          { label: 'Hủy đơn hàng', value: ORDER_STATUSES.CANCELLED }
        ];
      case ORDER_STATUSES.CONFIRMED:
        return [
          { label: 'Bắt đầu chuẩn bị', value: ORDER_STATUSES.PREPARING },
          { label: 'Hủy đơn hàng', value: ORDER_STATUSES.CANCELLED }
        ];
      case ORDER_STATUSES.PREPARING:
        return [
          { label: 'Đã đóng gói xong', value: ORDER_STATUSES.PACKAGING },
          { label: 'Hủy đơn hàng', value: ORDER_STATUSES.CANCELLED }
        ];
      case ORDER_STATUSES.PACKAGING:
        return [
          { label: 'Bắt đầu vận chuyển', value: ORDER_STATUSES.SHIPPING },
          { label: 'Hủy đơn hàng', value: ORDER_STATUSES.CANCELLED }
        ];
      case ORDER_STATUSES.SHIPPING:
        return [
          { label: 'Hoàn thành đơn hàng', value: ORDER_STATUSES.COMPLETED },
          { label: 'Hủy đơn hàng', value: ORDER_STATUSES.CANCELLED }
        ];
      default:
        return [];
    }
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
      
      toast.current.show({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã xóa đơn hàng',
        life: 3000
      });
      
      loadOrders(currentPage - 1);
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể xóa đơn hàng',
        life: 3000
      });
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
      await orderApi.updateOrderStatus(orderId, newStatus);
      
      toast.current.show({
        severity: 'success',
        summary: 'Thành công',
        detail: `Đã cập nhật trạng thái thành ${getStatusText(newStatus)}`,
        life: 3000
      });
      
      loadOrders(currentPage - 1);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể cập nhật trạng thái đơn hàng',
        life: 3000
      });
    } finally {
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
      
      toast.current.show({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã đánh dấu đơn hàng là đã thanh toán',
        life: 3000
      });
      
      loadOrders(currentPage - 1);
    } catch (error) {
      console.error('Error marking order as paid:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể cập nhật trạng thái thanh toán',
        life: 3000
      });
    } finally {
      setPaymentDialog(false);
      setPaymentOrderId(null);
    }
  };
  
  // Open bulk confirm dialog
  const openBulkConfirm = () => {
    if (!bulkStatus || selectedOrders.length === 0) return;
    setBulkConfirmVisible(true);
  };
  
  // Execute bulk update
  const executeBulkUpdate = async () => {
    try {
      const orderIds = selectedOrders.map(order => order._id);
      await orderApi.bulkUpdateStatus(orderIds, bulkStatus);
      
      toast.current.show({
        severity: 'success',
        summary: 'Thành công',
        detail: `Đã cập nhật ${selectedOrders.length} đơn hàng sang trạng thái ${getStatusText(bulkStatus)}`,
        life: 3000
      });
      
      loadOrders(currentPage - 1);
      setSelectedOrders([]);
    } catch (error) {
      console.error('Error bulk updating orders:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể cập nhật hàng loạt đơn hàng',
        life: 3000
      });
    } finally {
      setBulkConfirmVisible(false);
      setBulkStatus(null);
    }
  };
  
  // Open update status dialog
  const openUpdateStatusDialog = (order) => {
    setSelectedOrderForStatus(order);
    setStatusDialogVisible(true);
  };

  // Render component
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" richColors />
      <Toast ref={toast} />
      
      {/* Header và thống kê */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Quản lý đơn hàng</h1>
        <p className="text-gray-600 mb-6">
          Quản lý và theo dõi tất cả đơn hàng trong hệ thống
        </p>
        
        {/* Thống kê đơn hàng */}
        <OrderStats stats={orderStats} />
      </div>
      
      {/* Bộ lọc và tìm kiếm */}
      <OrderFilters 
        filters={filters}
        setFilters={setFilters}
        statusOptions={statusFilterOptions}
        paymentMethodOptions={[
          { label: 'Tất cả phương thức', value: '' },
          { label: 'Tiền mặt (COD)', value: 'COD' },
          { label: 'Chuyển khoản', value: 'BANK_TRANSFER' },
          { label: 'VNPay', value: 'VNPAY' }
        ]}
        paymentStatusOptions={[
          { label: 'Tất cả trạng thái', value: 'all' },
          { label: 'Đã thanh toán', value: 'paid' },
          { label: 'Chưa thanh toán', value: 'unpaid' }
        ]}
        clearFilters={clearFilters}
        userRole={userRole}
        userBranch={userBranch}
        branches={userRole === "admin" ? branches : userBranch ? [userBranch] : []}
        handleBranchChange={handleBranchChange}
        nearbyOrdersRadius={nearbyOrdersRadius}
        setNearbyOrdersRadius={setNearbyOrdersRadius}
      />
      
      {/* Bảng đơn hàng */}
      <OrderTable 
        orders={orders}
        loading={loading}
        selectedOrders={selectedOrders}
        setSelectedOrders={setSelectedOrders}
        first={currentPage - 1}
        rows={itemsPerPage}
        totalRecords={totalPages * itemsPerPage}
        onPage={onPage}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
        getStatusIcon={getStatusIcon}
        getPaymentMethodText={getPaymentMethodText}
        handleViewOrder={handleViewOrder}
        handleDeleteOrder={handleDeleteOrder}
        handleMarkAsPaid={handleMarkAsPaid}
        handleUpdateStatus={handleUpdateStatus}
        ORDER_STATUSES={ORDER_STATUSES}
        showBulkActions={userRole !== 'user'}
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
        setSelectedOrderForStatus={setSelectedOrderForStatus}
        getNextStatuses={getNextStatuses}
        updateOrderStatus={updateOrderStatus}
        getStatusText={getStatusText}
        getStatusColor={getStatusColor}
        getStatusIcon={getStatusIcon}
        ORDER_STATUSES={ORDER_STATUSES}
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
                    Đang hiển thị đơn hàng của chi nhánh: {userBranch.name}
                  </span>
                ) : (
                  <span>
                    Bạn đang xem các đơn hàng thuộc phạm vi chi nhánh của bạn (bán
                    kính {nearbyOrdersRadius}km)
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

export default memo(OrderAdmin);