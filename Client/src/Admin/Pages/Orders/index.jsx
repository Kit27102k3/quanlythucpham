/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback, memo } from "react";
import { Toaster, toast } from "sonner";
import branchesApi from "../../../api/branchesApi";
import orderApi from "../../../api/orderApi";
import { useSelector } from "react-redux";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import OrderStats from "./OrderStats";
import OrderItem from "./OrderItem";
import OrderAutoTransition from "./OrderAutoTransition";
import StatusTransitionInfo from "./StatusTransitionInfo";
import {
  ORDER_STATUSES,
  statusFilterOptions,
  formatDate,
  formatCurrency,
  getStatusColor,
  getStatusText,
  getStatusIcon,
  getPaymentMethodText,
} from "./OrderHelpers";

import {
  ViewOrderDialog,
  DeleteOrderDialog,
  StatusUpdateDialog,
  PaymentDialog,
  BulkActionDialog,
  AutoTransitionSettingsDialog,
} from "./OrderDialogs";
import OrderFilters from "./OrderFilters";
import OrderTable from "./OrderTable";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";

OrderStats.displayName = "OrderStats";
OrderItem.displayName = "OrderItem";
OrderAutoTransition.displayName = "OrderAutoTransition";
StatusTransitionInfo.displayName = "StatusTransitionInfo";

const OrderAdmin = () => {
  // const toast = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const userRole = localStorage.getItem("userRole") || "user";
  
  useEffect(() => {
    console.log("Current userRole:", userRole, "from localStorage:", localStorage.getItem("userRole"));
    console.log("User from Redux store:", user);
    
    if (user && Object.keys(user).length > 0 && !localStorage.getItem("user")) {
      localStorage.setItem("user", JSON.stringify(user));
      console.log("Saved user object to localStorage");
    }
  }, [user, userRole]);

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
  const [bulkStatus, setBulkStatus] = useState("");
  const [filters, setFilters] = useState({
    searchTerm: "",
    statusFilter: "",
    paymentMethodFilter: "",
    paymentStatusFilter: "all",
    dateFilter: null,
    branchFilter: "",
    nearbyFilter: false,
  });

  const [branches, setBranches] = useState([]);
  const [viewOrder, setViewOrder] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState(null);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState(null);
  const [bulkConfirmVisible, setBulkConfirmVisible] = useState(false);
  const [autoTransitionSettingsVisible, setAutoTransitionSettingsVisible] =
    useState(false);
  const [userBranch, setUserBranch] = useState(null);
  const [showOnlyBranchOrders, setShowOnlyBranchOrders] = useState(false);
  const [nearbyOrdersRadius, setNearbyOrdersRadius] = useState(10);
  const [autoTransitionEnabled, setAutoTransitionEnabled] = useState(true);
  const [transitionDelays, setTransitionDelays] = useState({
    pending_to_confirmed: 15,
    confirmed_to_preparing: 30,
    preparing_to_packaging: 45,
    packaging_to_shipping: 60,
  });

  useEffect(() => {
    const loadData = async () => {
      if (userRole === "manager") {
        try {
          console.log("Manager user object:", user);
          
          let branchId = null;
          let branchName = null;
          
          branchName = localStorage.getItem("branchName");
          
          if (user?.branchId && typeof user.branchId === 'object' && user.branchId._id) {
            branchId = user.branchId._id;
            console.log("Found branchId as object in user:", branchId);
            
            if (user.branchId.name) {
              branchName = user.branchId.name;
              localStorage.setItem("branchName", branchName);
            }
          } 
          else if (user?.branchId && typeof user.branchId === 'string') {
            branchId = user.branchId;
            console.log("Found branchId as string in user:", branchId);
          }
          
          if (!branchId && user?.branch) {
            if (typeof user.branch === 'object' && user.branch._id) {
              branchId = user.branch._id;
              if (user.branch.name) {
                branchName = user.branch.name;
                localStorage.setItem("branchName", branchName);
              }
              console.log("Found branch object in user:", branchId);
            } else if (typeof user.branch === 'string') {
              branchId = user.branch;
              console.log("Found branch string in user:", branchId);
            }
          }
          
          if (!branchId) {
            branchId = localStorage.getItem("branchId");
            console.log("Using branchId from localStorage:", branchId);
          }
          
          if (!branchId) {
            try {
              const localStorageUser = JSON.parse(localStorage.getItem("user") || "{}");
              if (localStorageUser.branchId) {
                if (typeof localStorageUser.branchId === 'object' && localStorageUser.branchId._id) {
                  branchId = localStorageUser.branchId._id;
                  if (localStorageUser.branchId.name) {
                    branchName = localStorageUser.branchId.name;
                  }
                } else if (typeof localStorageUser.branchId === 'string') {
                  branchId = localStorageUser.branchId;
                }
                console.log("Found branchId in localStorage user object:", branchId);
              } else if (localStorageUser.branch) {
                if (typeof localStorageUser.branch === 'object' && localStorageUser.branch._id) {
                  branchId = localStorageUser.branch._id;
                  if (localStorageUser.branch.name) {
                    branchName = localStorageUser.branch.name;
                  }
                } else if (typeof localStorageUser.branch === 'string') {
                  branchId = localStorageUser.branch;
                }
                console.log("Found branch in localStorage user object:", branchId);
              }
            } catch (e) {
              console.error("Error parsing user from localStorage:", e);
            }
          }
          
          if (!branchId) {
            branchId = localStorage.getItem("userId");
            console.log("Using userId as fallback branch ID:", branchId);
          }
            
          if (!branchId) {
            console.error("Manager doesn't have a branch ID");
            
            const tempBranch = { _id: "manager-branch", name: "Chi nhánh của bạn" };
            setUserBranch(tempBranch);
            setBranches([tempBranch]);
            
            toast.current.show({
              severity: "warning",
              summary: "Cảnh báo",
              detail: "Không tìm thấy thông tin chi nhánh của bạn. Vui lòng liên hệ admin.",
              life: 5000,
            });
            
            return;
          }
          
          localStorage.setItem("branchId", branchId);
          
          if (branchName) {
            const tempBranch = { _id: branchId, name: branchName };
            setUserBranch(tempBranch);
            setBranches([tempBranch]);
            setFilters((prev) => ({
              ...prev,
              branchFilter: branchId,
            }));
            console.log("Using cached branch name while loading from API:", branchName);
          }
          
          console.log("Loading branch data for manager. Branch ID:", branchId);
          try {
            const response = await branchesApi.getBranchById(branchId);
            
            if (response && response.data) {
              console.log("Branch data loaded:", response.data.name);
              
              setUserBranch(response.data);

              setBranches([response.data]);

              localStorage.setItem("branchName", response.data.name);

          setFilters((prev) => ({
            ...prev,
                branchFilter: branchId,
              }));
              
              toast.current.show({
                severity: "info",
                summary: "Chi nhánh",
                detail: `Đang hiển thị đơn hàng cho chi nhánh: ${response.data.name}`,
                life: 3000,
              });
            } else if (response && response.error) {
              console.error("Error from branch API:", response.message);
              
              if (!branchName) {
                const placeholderBranch = { _id: branchId, name: "Chi nhánh của bạn" };
                setUserBranch(placeholderBranch);
                setBranches([placeholderBranch]);
                setFilters((prev) => ({
                  ...prev,
                  branchFilter: branchId,
                }));
              }
              
              toast.current.show({
                severity: "warning",
                summary: "Cảnh báo",
                detail: "Không thể tải thông tin chi nhánh từ máy chủ. Hiển thị thông tin cơ bản.",
                life: 3000,
              });
            } else {
              console.error("No branch data returned from API");
              
              if (!branchName) {
                const placeholderBranch = { _id: branchId, name: "Chi nhánh của bạn" };
                setUserBranch(placeholderBranch);
                setBranches([placeholderBranch]);
                setFilters((prev) => ({
                  ...prev,
                  branchFilter: branchId,
                }));
              }
            }
          } catch (apiError) {
            console.error("API error loading branch data:", apiError);
            
            if (!branchName) {
              const placeholderBranch = { _id: branchId, name: "Chi nhánh của bạn" };
              setUserBranch(placeholderBranch);
              setBranches([placeholderBranch]);
              setFilters((prev) => ({
                ...prev,
                branchFilter: branchId,
              }));
            }
            
            toast.current.show({
              severity: "error",
              summary: "Lỗi",
              detail: "Không thể tải thông tin chi nhánh. Vui lòng thử lại sau.",
              life: 3000,
            });
          }
        } catch (error) {
          console.error("Error loading user branch:", error);
          toast.current.show({
            severity: "error",
            summary: "Lỗi",
            detail: "Lỗi khi tải thông tin chi nhánh.",
            life: 3000,
          });
        }
      }
      else if (userRole === "admin") {
        try {
          const response = await branchesApi.getAllBranches();
          if (response && response.data && Array.isArray(response.data)) {
          setBranches([
            { _id: "", name: "Tất cả chi nhánh" },
            ...response.data,
          ]);
          } else {
            console.error("Invalid branch data format:", response);
            toast.current.show({
              severity: "warning",
              summary: "Cảnh báo",
              detail: "Định dạng dữ liệu chi nhánh không hợp lệ.",
              life: 3000,
            });
          }
        } catch (error) {
          console.error("Error loading branches:", error);
          toast.current.show({
            severity: "error",
            summary: "Lỗi",
            detail: "Không thể tải danh sách chi nhánh.",
            life: 3000,
          });
        }
      }
    };

    loadData();
  }, [userRole, user]);

  const loadOrders = useCallback(
    async (page = 0, forceReload = false) => {
      setLoading(true);
      try {
        let response;
        const pageSize = itemsPerPage;
        const pageNumber = Math.floor(page / pageSize) + 1;
        
        // Thêm timestamp để tránh cache
        const timestamp = new Date().getTime();
        console.log(`Loading orders with timestamp: ${timestamp}, forceReload: ${forceReload}`);

        if (userRole === "manager") {
          let branchId = filters.branchFilter;
          console.log("Initial branchId from filters:", branchId);
          
          if (!branchId && userBranch && userBranch._id) {
            branchId = userBranch._id;
            console.log("Using branch ID from userBranch:", branchId);
          }
          
          if (!branchId && user?.branchId) {
            if (typeof user.branchId === 'object' && user.branchId._id) {
              branchId = user.branchId._id;
            } else if (typeof user.branchId === 'string') {
              branchId = user.branchId;
            }
            console.log("Using branch ID from user object:", branchId);
          }
          
          if (!branchId) {
            branchId = localStorage.getItem("branchId");
            console.log("Using branch ID from localStorage:", branchId);
          }
          
          if (!branchId) {
            branchId = localStorage.getItem("userId");
            console.log("Using userId as fallback branch ID:", branchId);
          }
                         
          if (!branchId) {
            console.error("No branch ID available for manager to load orders");
            toast.error("Không thể xác định chi nhánh của bạn để tải đơn hàng", {
              duration: 3000,
            });
            setLoading(false);
            setOrders([]);
            return;
          }
          
          console.log("Manager loading orders for branch:", branchId);
          
          try {
            // Thêm tham số timestamp vào API call
            response = await orderApi.getOrdersByBranch(
              branchId,
              pageNumber,
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
                ? {
                    enabled: true,
                    radius: nearbyOrdersRadius,
                    timestamp,
                    forceReload
                  }
                : { timestamp, forceReload }
            );
            
            console.log("Orders loaded successfully for branch:", branchId);
          } catch (error) {
            console.error("Error loading orders for branch:", branchId, error);
            toast.error("Không thể tải đơn hàng cho chi nhánh của bạn", {
              duration: 3000,
            });
            setLoading(false);
            setOrders([]);
            return;
          }
        } else if (userRole === "admin" && filters.branchFilter) {
          console.log("Admin loading orders for branch:", filters.branchFilter);

          response = await orderApi.getOrdersByBranch(
            filters.branchFilter,
            pageNumber,
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
              ? {
                  enabled: true,
                  radius: nearbyOrdersRadius,
                  timestamp,
                  forceReload
                }
              : { timestamp, forceReload }
          );
        } else {
          console.log("Admin loading all orders");
          
          response = await orderApi.getAllOrders(
            pageNumber,
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
            undefined,
            timestamp
          );
        }

        // Kiểm tra dữ liệu nhận về từ API
        console.log("Orders data received:", response.data.orders);

        // Đảm bảo trường isPaid được chuẩn hóa đúng kiểu dữ liệu boolean
        const normalizedOrders = response.data.orders?.map(order => {
          // Kiểm tra nhiều kiểu dữ liệu có thể có cho isPaid
          const isPaid = order.isPaid === true || 
                       order.isPaid === "true" || 
                       order.isPaid === 1 || 
                       order.isPaid === "1";
          
          console.log(`Đơn hàng ${order._id} có isPaid ban đầu:`, order.isPaid, "sau chuẩn hóa:", isPaid);
          
          return {
            ...order,
            isPaid: isPaid
          };
        }) || [];

        console.log("Normalized orders:", normalizedOrders);

        // Set dữ liệu orders
        setOrders(normalizedOrders);
        setTotalPages(Math.ceil(response.data.totalCount / itemsPerPage));

        setOrderStats({
          total: response.data.stats?.total || 0,
          pending: response.data.stats?.pending || 0,
          confirmed: response.data.stats?.confirmed || 0,
          preparing: response.data.stats?.preparing || 0,
          packaging: response.data.stats?.packaging || 0,
          shipping: response.data.stats?.shipping || 0,
          delivering: response.data.stats?.delivering || 0,
          completed: response.data.stats?.completed || 0,
          cancelled: response.data.stats?.cancelled || 0,
          delivery_failed: response.data.stats?.delivery_failed || 0,
          awaiting_payment: response.data.stats?.awaiting_payment || 0,
          sorting_facility: response.data.stats?.sorting_facility || 0
        });
      } catch (error) {
        console.error("Error loading orders:", error);
        toast.error("Không thể tải danh sách đơn hàng", {
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    },
    [itemsPerPage, userRole, filters, nearbyOrdersRadius, userBranch]
  );

  useEffect(() => {
    loadOrders(currentPage - 1);
    setSelectedOrders([]);
  }, [loadOrders, currentPage]);

  useEffect(() => {
    console.log("Branch filter changed:", filters.branchFilter);
    if (filters.branchFilter) {
      loadOrders(0);
    }
  }, [filters.branchFilter]);

  const onPage = (event) => {
    setCurrentPage(event.first + 1);
    setItemsPerPage(event.rows);
  };

  const clearFilters = () => {
    if (userRole === "manager") {
      let managerBranchId = userBranch?._id;
      
      if (!managerBranchId) {
        if (user?.branchId) {
          managerBranchId = typeof user.branchId === 'object' ? user.branchId._id : user.branchId;
        }
        
        if (!managerBranchId) {
          managerBranchId = localStorage.getItem("branchId");
        }
      }
      
      console.log("Clearing filters for manager, keeping branch filter:", managerBranchId);
      
      setFilters({
        searchTerm: "",
        statusFilter: "",
        paymentMethodFilter: "",
        paymentStatusFilter: "all",
        dateFilter: null,
        branchFilter: managerBranchId || "",
        nearbyFilter: false,
      });
      
      toast.current.show({
        severity: "info",
        summary: "Lọc đã được xóa",
        detail: "Vẫn giữ lọc theo chi nhánh của bạn",
        life: 2000,
      });
    } else {
      setFilters({
        searchTerm: "",
        statusFilter: "",
        paymentMethodFilter: "",
        paymentStatusFilter: "all",
        dateFilter: null,
        branchFilter: "",
        nearbyFilter: false,
      });
    }
    
    setCurrentPage(1);
  };

  const handleBranchChange = (e) => {
    if (userRole === "manager") {
      console.log("Managers cannot change their branch filter");
      return;
    }
    
    const selectedBranchId = e.value;
    setFilters((prev) => ({
      ...prev,
      branchFilter: selectedBranchId,
    }));

    if (!selectedBranchId) {
      setFilters((prev) => ({
        ...prev,
        nearbyFilter: false,
      }));
    }

    setCurrentPage(1);
  };

  const getNextStatuses = (currentStatus) => {
    switch (currentStatus) {
      case ORDER_STATUSES.PENDING:
        return [
          { label: "Xác nhận đơn hàng", value: ORDER_STATUSES.CONFIRMED },
          { label: "Hủy đơn hàng", value: ORDER_STATUSES.CANCELLED },
        ];
      case ORDER_STATUSES.CONFIRMED:
        return [
          { label: "Bắt đầu chuẩn bị", value: ORDER_STATUSES.PREPARING },
          { label: "Hủy đơn hàng", value: ORDER_STATUSES.CANCELLED },
        ];
      case ORDER_STATUSES.PREPARING:
        return [
          { label: "Hoàn tất đóng gói", value: ORDER_STATUSES.PACKAGING },
          { label: "Hủy đơn hàng", value: ORDER_STATUSES.CANCELLED },
        ];
      case ORDER_STATUSES.PACKAGING:
        return [
          { label: "Bắt đầu vận chuyển", value: ORDER_STATUSES.SHIPPING },
          { label: "Hủy đơn hàng", value: ORDER_STATUSES.CANCELLED },
        ];
      case ORDER_STATUSES.SHIPPING:
        return [
          { label: "Chuyển đến kho phân loại", value: ORDER_STATUSES.SORTING_FACILITY },
          { label: "Hủy đơn hàng", value: ORDER_STATUSES.CANCELLED },
        ];
      case ORDER_STATUSES.SORTING_FACILITY:
        return [
          { label: "Bắt đầu giao hàng", value: ORDER_STATUSES.DELIVERING },
          { label: "Hủy đơn hàng", value: ORDER_STATUSES.CANCELLED },
        ];
      case ORDER_STATUSES.DELIVERING:
        return [
          { label: "Đã giao hàng", value: ORDER_STATUSES.DELIVERED },
          { label: "Giao hàng thất bại", value: ORDER_STATUSES.DELIVERY_FAILED },
        ];
      case ORDER_STATUSES.DELIVERED:
        return [
          { label: "Hoàn thành đơn hàng", value: ORDER_STATUSES.COMPLETED },
        ];
      case ORDER_STATUSES.DELIVERY_FAILED:
        return [
          { label: "Giao lại", value: ORDER_STATUSES.DELIVERING },
          { label: "Hủy đơn hàng", value: ORDER_STATUSES.CANCELLED },
        ];
      default:
        return [];
    }
  };

  const handleViewOrder = (order) => {
    setViewOrder(order);
  };

  const handleDeleteOrder = (order) => {
    setSelectedOrderId(order._id);
    setDeleteDialog(true);
  };

  const confirmDeleteOrder = async () => {
    try {
      await orderApi.deleteOrder(selectedOrderId);

      toast.success("Đã xóa đơn hàng", {
        duration: 3000,
      });

      loadOrders(currentPage - 1);
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Không thể xóa đơn hàng", {
        description: error.message,
        duration: 3000,
      });
    } finally {
      setDeleteDialog(false);
      setSelectedOrderId(null);
    }
  };

  const handleUpdateStatus = (order) => {
    setSelectedOrderForStatus(order);
    setStatusDialogVisible(true);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderApi.updateOrderStatus(orderId, newStatus);

      toast.success(`Đã cập nhật trạng thái thành ${getStatusText(newStatus)}`, {
        duration: 3000,
      });

      loadOrders(currentPage - 1);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Không thể cập nhật trạng thái đơn hàng", {
        description: error.message,
        duration: 3000,
      });
    } finally {
      setStatusDialogVisible(false);
      setSelectedOrderForStatus(null);
    }
  };

  const handleMarkAsPaid = (order) => {
    setPaymentOrderId(order._id);
    setPaymentDialog(true);
  };

  const confirmMarkAsPaid = async () => {
    try {
      // Tìm đơn hàng cần cập nhật
      const orderToUpdate = orders.find(order => order._id === paymentOrderId);
      if (!orderToUpdate) {
        toast.error("Không tìm thấy đơn hàng để cập nhật", {
          duration: 3000,
        });
        setPaymentDialog(false);
        setPaymentOrderId(null);
        return;
      }
      
      console.log("Đơn hàng trước khi cập nhật:", orderToUpdate);
      
      // Cập nhật API trước
      const result = await orderApi.markOrderAsPaid(paymentOrderId);
      console.log("markOrderAsPaid result:", result);

      // Lưu ID đơn hàng đã thanh toán vào localStorage để giải quyết vấn đề hiển thị
      try {
        const paidOrdersString = localStorage.getItem('paidOrders') || '[]';
        const paidOrders = JSON.parse(paidOrdersString);
        if (!paidOrders.includes(paymentOrderId)) {
          paidOrders.push(paymentOrderId);
          localStorage.setItem('paidOrders', JSON.stringify(paidOrders));
          console.log("Đã lưu đơn hàng vào danh sách đã thanh toán:", paidOrders);
        }
      } catch (err) {
        console.error("Lỗi khi lưu trạng thái thanh toán vào localStorage:", err);
      }

      // Nếu API thành công, cập nhật UI
      if (result && result.success) {
        // Cập nhật local UI
        const updatedOrders = orders.map(order => {
          if (order._id === paymentOrderId) {
            return { 
              ...order, 
              isPaid: true,
              paymentDate: new Date().toISOString()
            };
          }
          return order;
        });
        
        // Cập nhật state 
        setOrders(updatedOrders);
        
        toast.success("Đơn hàng đã được đánh dấu thanh toán", {
          description: "Trạng thái thanh toán đã cập nhật thành công",
          duration: 3000,
        });
      } else {
        toast.error("Không thể cập nhật trạng thái thanh toán", { 
          duration: 3000 
        });
      }

      // Làm mới danh sách đơn hàng từ trang đầu tiên để đảm bảo UI được cập nhật
      setCurrentPage(1);
      await loadOrders(0, true); // Sử dụng force reload
      
    } catch (error) {
      console.error("Error marking order as paid:", error);
      
      // Phục hồi dữ liệu ban đầu nếu có lỗi
      await loadOrders(currentPage - 1);
      
      toast.error("Không thể cập nhật trạng thái thanh toán", {
        description: error.message || "Đã xảy ra lỗi khi cập nhật",
        duration: 3000,
      });
    } finally {
      setPaymentDialog(false);
      setPaymentOrderId(null);
    }
  };

  const openBulkConfirm = () => {
    if (!bulkStatus || selectedOrders.length === 0) return;
    setBulkConfirmVisible(true);
  };

  const executeBulkUpdate = async () => {
    try {
      const orderIds = selectedOrders.map((order) => order._id);
      await orderApi.bulkUpdateStatus(orderIds, bulkStatus);

      toast.success(`Đã cập nhật ${selectedOrders.length} đơn hàng sang trạng thái ${getStatusText(bulkStatus)}`, {
        duration: 3000,
      });

      loadOrders(currentPage - 1);
      setSelectedOrders([]);
    } catch (error) {
      console.error("Error bulk updating orders:", error);
      toast.error("Không thể cập nhật hàng loạt đơn hàng", {
        description: error.message,
        duration: 3000,
      });
    } finally {
      setBulkConfirmVisible(false);
      setBulkStatus(null);
    }
  };

  const openUpdateStatusDialog = (order) => {
    setSelectedOrderForStatus(order);
    setStatusDialogVisible(true);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" richColors />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Quản lý đơn hàng
        </h1>
        <p className="text-gray-600 mb-6">
          Quản lý và theo dõi tất cả đơn hàng trong hệ thống
        </p>

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
        nearbyOrdersRadius={nearbyOrdersRadius}
        setNearbyOrdersRadius={setNearbyOrdersRadius}
      />

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
        showBulkActions={userRole !== "user"}
        setBulkStatus={setBulkStatus}
        bulkStatus={bulkStatus}
        openBulkConfirm={openBulkConfirm}
        userRole={userRole}
      />

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

      <div className="mt-8 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center">
          <i className="pi pi-map-marker text-blue-500 mr-2"></i>
            {userRole === "manager" ? (
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="font-medium text-blue-600">
                  Quản lý chi nhánh:{" "}
                </span>
                <strong className="ml-2 text-blue-800">
                  {userBranch?.name || "Chi nhánh của bạn"}
                </strong>
                <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center">
                  <i className="pi pi-shield mr-1"></i>
                  Manager
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Bạn chỉ có thể xem và quản lý đơn hàng thuộc chi nhánh của mình.
                {userBranch?.address && (
                  <span className="ml-1 text-gray-500 italic">
                    Địa chỉ: {userBranch.address}
              </span>
                )}
              </p>
            </div>
            ) : (
              <div>
              {filters.branchFilter ? (
                  <span>
                  <span className="text-blue-600">Đang lọc theo chi nhánh:</span>{" "}
                  <strong>
                    {branches.find(b => b._id === filters.branchFilter)?.name || "Chi nhánh không xác định"}
                  </strong>
                  <button 
                    className="ml-2 p-1 text-xs text-gray-500 hover:text-red-500"
                    onClick={() => setFilters(prev => ({ ...prev, branchFilter: "" }))}
                  >
                    <i className="pi pi-times-circle"></i> Xóa bộ lọc
                  </button>
                  </span>
                ) : (
                  <span>
                  <span className="text-green-600">Hiển thị tất cả chi nhánh</span>
                  <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Admin
                  </span>
                  </span>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default memo(OrderAdmin);
