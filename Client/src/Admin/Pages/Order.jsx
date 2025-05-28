/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import {
  EyeOpenIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Checkbox } from "primereact/checkbox";
import { MultiSelect } from "primereact/multiselect";
import { Tag } from "primereact/tag";
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { toast, Toaster } from 'sonner';
import { PackageIcon, ClockIcon, CheckIcon, XIcon, EyeIcon, Trash2Icon, RefreshCcwIcon, ArrowRightIcon, InfoIcon, TimerIcon, SettingsIcon } from "lucide-react";
import { API_BASE_URL } from '../../config/apiConfig';
import { Activity, Banknote, Calendar, ChevronDown, Clock, DollarSign, ExternalLink, Eye, FileText, Gift, Home, List, Loader2, PackageCheck, PackageOpen, PackageX, PanelRight, Phone, Plus, RefreshCcw, Search, ShoppingBag, Truck, User, XCircle } from "lucide-react";
import { showToast } from '../Utils/toast';
import Pagination from "../../utils/Paginator";

// Mô hình OrderAutoTransition - Định nghĩa luồng chuyển đổi trạng thái tự động
const OrderAutoTransition = {
  // Các trạng thái chính của đơn hàng
  STATES: {
    PENDING: "pending",                 // Chờ xử lý ban đầu
    CONFIRMED: "confirmed",             // Đã xác nhận đơn hàng
    PREPARING: "preparing",             // Đang chuẩn bị hàng
    PACKAGING: "packaging",             // Hoàn tất đóng gói
    SHIPPING: "shipping",               // Đang được vận chuyển
    DELIVERING: "delivering",           // Đơn hàng đang được giao đến khách
    COMPLETED: "completed",             // Giao hàng thành công
    CANCELLED: "cancelled",             // Đã hủy
    DELIVERY_FAILED: "delivery_failed", // Giao hàng thất bại
    AWAITING_PAYMENT: "awaiting_payment" // Chờ thanh toán (cho thanh toán online)
  },
  
  // Điều kiện chuyển đổi trạng thái - Event-driven (theo sự kiện)
  TRANSITIONS: {
    // Từ chờ xử lý sang đã xác nhận khi admin xác nhận
    PENDING_TO_CONFIRMED: {
      from: "pending",
      to: "confirmed",
      event: "admin_confirmed",
      condition: "manual_approval" // Cần xác nhận thủ công
    },
    
    // Chuyển từ chờ thanh toán sang đã xác nhận khi thanh toán thành công
    AWAITING_PAYMENT_TO_CONFIRMED: {
      from: "awaiting_payment",
      to: "confirmed",
      event: "payment_success", 
      condition: "auto" // Tự động khi có webhook thanh toán
    },
    
    // Từ đã xác nhận sang đang chuẩn bị hàng
    CONFIRMED_TO_PREPARING: {
      from: "confirmed",
      to: "preparing",
      event: "order_processing_started",
      condition: "auto" // Tự động sau khi đã xác nhận
    },
    
    // Từ đang chuẩn bị hàng sang đóng gói
    PREPARING_TO_PACKAGING: {
      from: "preparing",
      to: "packaging",
      event: "products_prepared",
      condition: "trigger" // Khi hệ thống kho báo đã chuẩn bị xong
    },
    
    // Từ đóng gói sang đang vận chuyển (khi shipper lấy hàng)
    PACKAGING_TO_SHIPPING: {
      from: "packaging",
      to: "shipping",
      event: "shipping_pickup",
      condition: "trigger" // Khi có event từ hệ thống vận chuyển
    },
    
    // Từ đang vận chuyển sang đang giao đến khách
    SHIPPING_TO_DELIVERING: {
      from: "shipping",
      to: "delivering",
      event: "out_for_delivery",
      condition: "trigger" // Khi có webhook từ đơn vị vận chuyển
    },
    
    // Từ đang giao sang giao thành công
    DELIVERING_TO_COMPLETED: {
      from: "delivering",
      to: "completed",
      event: "delivery_success",
      condition: "trigger" // Khi có webhook từ đơn vị vận chuyển
    },
    
    // Từ đang giao sang giao thất bại
    DELIVERING_TO_FAILED: {
      from: "delivering",
      to: "delivery_failed",
      event: "delivery_failed",
      condition: "trigger" // Khi có webhook từ đơn vị vận chuyển
    },
    
    // Người dùng có thể hủy đơn từ các trạng thái đầu
    ANY_TO_CANCELLED: {
      from: ["pending", "confirmed", "preparing", "awaiting_payment"],
      to: "cancelled",
      event: "order_cancelled",
      condition: "trigger" // Khi người dùng hoặc admin hủy
    }
  },
  
  // Logic điều kiện để tự động chuyển đổi
  CONDITIONS: {
    // Sau bao lâu từ thời điểm đặt/xác nhận đơn thì tự động chuyển sang trạng thái tiếp theo
    TIME_BASED: {
      // Đơn được xác nhận tự động sau 15 phút nếu là COP (không thanh toán online)
      PENDING_AUTO_CONFIRM: 15 * 60 * 1000, // 15 phút
      
      // Chuyển từ đã xác nhận sang đang chuẩn bị hàng sau 30 phút
      CONFIRMED_TO_PREPARING: 30 * 60 * 1000, // 30 phút
      
      // Tự động hủy đơn nếu chưa thanh toán sau 24h
      AUTO_CANCEL_UNPAID: 24 * 60 * 60 * 1000, // 24 giờ
    },
    
    // Set minimum time between transitions to prevent rapid changes
    MINIMUM_TRANSITION_TIME: 5 * 60 * 1000, // 5 phút
  },
  
  // Có cho phép admin can thiệp vào luồng tự động không
  ADMIN_OVERRIDE: true,
  
  // Có ghi log lịch sử thay đổi trạng thái không
  LOG_TRANSITIONS: true,
  
  // Function kiểm tra xem có thể chuyển từ trạng thái hiện tại sang trạng thái đích hay không
  canTransition: (currentStatus, targetStatus) => {
    // Logic kiểm tra xem có thể chuyển từ trạng thái hiện tại sang trạng thái đích hay không
    // Dựa vào cấu hình TRANSITIONS ở trên
    const validTransitions = Object.values(OrderAutoTransition.TRANSITIONS)
      .filter(transition => {
        if (Array.isArray(transition.from)) {
          return transition.from.includes(currentStatus) && transition.to === targetStatus;
        }
        return transition.from === currentStatus && transition.to === targetStatus;
      });
    
    return validTransitions.length > 0;
  },
  
  // Function lấy các trạng thái có thể chuyển tiếp từ trạng thái hiện tại
  getNextPossibleStates: (currentStatus) => {
    // Logic lấy các trạng thái có thể chuyển tiếp từ trạng thái hiện tại
    // Dựa vào cấu hình TRANSITIONS ở trên
    return Object.values(OrderAutoTransition.TRANSITIONS)
      .filter(transition => {
        if (Array.isArray(transition.from)) {
          return transition.from.includes(currentStatus);
        }
        return transition.from === currentStatus;
      })
      .map(transition => transition.to);
  }
};

// Memoized Order Stats Component
const OrderStats = memo(({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
      <Card className="shadow-lg bg-gradient-to-br from-white to-blue-50 p-6 border border-gray-100 rounded-xl hover:shadow-xl transition-all transform hover:-translate-y-1"
        pt={{ 
          root: { className: 'overflow-hidden' },
          content: { className: 'p-0' }
        }}>
        <div className="flex items-center">
          <div className="p-4 bg-blue-100 rounded-full">
            <PackageIcon size={30} className="text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-md font-semibold text-gray-700">Tất cả</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
        </div>
      </Card>
      
      <Card className="shadow-lg bg-gradient-to-br from-white to-yellow-50 p-6 border border-gray-100 rounded-xl hover:shadow-xl transition-all transform hover:-translate-y-1"
        pt={{ 
          root: { className: 'overflow-hidden' },
          content: { className: 'p-0' }
        }}>
        <div className="flex items-center">
          <div className="p-4 bg-yellow-100 rounded-full">
            <ClockIcon size={30} className="text-yellow-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-md font-semibold text-gray-700">Chờ xử lý</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
        </div>
      </Card>
      
      <Card className="shadow-lg bg-gradient-to-br from-white to-indigo-50 p-6 border border-gray-100 rounded-xl hover:shadow-xl transition-all transform hover:-translate-y-1"
        pt={{ 
          root: { className: 'overflow-hidden' },
          content: { className: 'p-0' }
        }}>
        <div className="flex items-center">
          <div className="p-4 bg-indigo-100 rounded-full">
            <i className="pi pi-box text-indigo-600" style={{ fontSize: '1.5rem' }}></i>
          </div>
          <div className="ml-4">
            <h3 className="text-md font-semibold text-gray-700">Chuẩn bị</h3>
            <p className="text-2xl font-bold text-indigo-600">{stats.preparing}</p>
          </div>
        </div>
      </Card>
      
      <Card className="shadow-lg bg-gradient-to-br from-white to-purple-50 p-6 border border-gray-100 rounded-xl hover:shadow-xl transition-all transform hover:-translate-y-1"
        pt={{ 
          root: { className: 'overflow-hidden' },
          content: { className: 'p-0' }
        }}>
        <div className="flex items-center">
          <div className="p-4 bg-purple-100 rounded-full">
            <i className="pi pi-gift text-purple-600" style={{ fontSize: '1.5rem' }}></i>
          </div>
          <div className="ml-4">
            <h3 className="text-md font-semibold text-gray-700">Đóng gói</h3>
            <p className="text-2xl font-bold text-purple-600">{stats.packaging}</p>
          </div>
        </div>
      </Card>
      
      <Card className="shadow-lg bg-gradient-to-br from-white to-cyan-50 p-6 border border-gray-100 rounded-xl hover:shadow-xl transition-all transform hover:-translate-y-1"
        pt={{ 
          root: { className: 'overflow-hidden' },
          content: { className: 'p-0' }
        }}>
        <div className="flex items-center">
          <div className="p-4 bg-cyan-100 rounded-full">
            <i className="pi pi-truck text-cyan-600" style={{ fontSize: '1.5rem' }}></i>
          </div>
          <div className="ml-4">
            <h3 className="text-md font-semibold text-gray-700">Đang giao</h3>
            <p className="text-2xl font-bold text-cyan-600">{stats.delivering}</p>
          </div>
        </div>
      </Card>
      
      <Card className="shadow-lg bg-gradient-to-br from-white to-green-50 p-6 border border-gray-100 rounded-xl hover:shadow-xl transition-all transform hover:-translate-y-1"
        pt={{ 
          root: { className: 'overflow-hidden' },
          content: { className: 'p-0' }
        }}>
        <div className="flex items-center">
          <div className="p-4 bg-green-100 rounded-full">
            <CheckIcon size={30} className="text-green-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-md font-semibold text-gray-700">Hoàn thành</h3>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
        </div>
      </Card>
      
      <Card className="shadow-lg bg-gradient-to-br from-white to-red-50 p-6 border border-gray-100 rounded-xl hover:shadow-xl transition-all transform hover:-translate-y-1"
        pt={{ 
          root: { className: 'overflow-hidden' },
          content: { className: 'p-0' }
        }}>
        <div className="flex items-center">
          <div className="p-4 bg-red-100 rounded-full">
            <XIcon size={30} className="text-red-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-md font-semibold text-gray-700">Đã hủy</h3>
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
          </div>
        </div>
      </Card>
    </div>
  );
});

OrderStats.displayName = 'OrderStats';

// Memoized Order Item component
const OrderItem = memo(({ 
  order, 
  getStatusColor, 
  getStatusText, 
  getStatusIcon, 
  getCustomerName, 
  formatDate, 
  formatCurrency, 
  onViewOrder, 
  onDeleteOrder,
  onMarkAsPaid,
  onUpdateStatus,
  ORDER_STATUSES
}) => {
  const paymentMethod = order.paymentMethod || "";
  const isCOD = paymentMethod.toLowerCase() === "cod" || paymentMethod.toUpperCase() === "COD";
  
  // Hiển thị nút thanh toán chỉ khi đơn hàng là COD, đang ở trạng thái đang xử lý và chưa thanh toán
  const showPaymentButton = isCOD && order.status === ORDER_STATUSES.PENDING && !order.isPaid;

  return (
    <tr className="border-b hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 font-medium text-blue-600">
        #{order._id.slice(-6).toUpperCase()}
      </td>
      <td className="px-6 py-4">
        <div>
          <div className="font-medium">{getCustomerName(order)}</div>
          {order.userId?.email && (
            <div className="text-xs text-gray-500 mt-1">
              {order.userId.email}
            </div>
          )}
          {order.shippingInfo?.phone && (
            <div className="text-xs text-gray-500 mt-1">
              SĐT: {order.shippingInfo.phone}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {order.products?.length || 0} sản phẩm
        </span>
      </td>
      <td className="px-6 py-4 font-medium">
        {formatCurrency(order.totalAmount || 0)}
      </td>
      <td className="px-6 py-4 text-sm">
        {formatDate(order.createdAt)}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(
            order.status
          )}`}
        >
          {getStatusIcon(order.status)}
          {getStatusText(order.status)}
        </span>
        {order.isPaid && (
          <span className="inline-flex items-center ml-2 px-3 py-1.5 rounded-full text-xs font-medium border text-green-600 bg-green-100 border-green-200">
            <CheckIcon size={16} className="mr-1" />
            Đã thanh toán
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-center space-x-2">
          <Button
            icon={<EyeIcon size={18} />}
            rounded
            text
            severity="info"
            onClick={() => onViewOrder(order)}
            tooltip="Xem chi tiết"
            tooltipOptions={{ position: 'top' }}
            className="w-9 h-9 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all"
            pt={{ 
              root: { className: 'flex items-center justify-center' },
              icon: { className: 'text-blue-600' } 
            }}
          />
          
          {/* Thêm nút cập nhật trạng thái */}
          {order.status !== ORDER_STATUSES.COMPLETED && order.status !== ORDER_STATUSES.CANCELLED && (
            <Button
              icon={<i className="pi pi-arrow-right-arrow-left" style={{ fontSize: '1rem' }}></i>}
              rounded
              text
              severity="warning"
              onClick={() => onUpdateStatus(order)}
              tooltip="Cập nhật trạng thái"
              tooltipOptions={{ position: 'top' }}
              className="w-9 h-9 hover:bg-yellow-50 border border-transparent hover:border-yellow-200 transition-all"
              pt={{ 
                root: { className: 'flex items-center justify-center' },
                icon: { className: 'text-yellow-600' } 
              }}
            />
          )}
          
          {showPaymentButton && (
            <Button
              icon={<i className="pi pi-check-circle" style={{ fontSize: '1rem' }}></i>}
              rounded
              text
              severity="success"
              onClick={() => onMarkAsPaid(order._id)}
              tooltip="Đánh dấu đã thanh toán"
              tooltipOptions={{ position: 'top' }}
              className="w-9 h-9 hover:bg-green-50 border border-transparent hover:border-green-200 transition-all"
              pt={{ 
                root: { className: 'flex items-center justify-center' },
                icon: { className: 'text-green-600' } 
              }}
            />
          )}
          
          <Button
            icon={<Trash2Icon size={18} />}
            rounded
            text
            severity="danger"
            onClick={() => onDeleteOrder(order._id)}
            tooltip="Xóa đơn hàng"
            tooltipOptions={{ position: 'top' }}
            className="w-9 h-9 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
            pt={{ 
              root: { className: 'flex items-center justify-center' },
              icon: { className: 'text-red-600' } 
            }}
          />
        </div>
      </td>
    </tr>
  );
});

OrderItem.displayName = 'OrderItem';

// Status Transition Info component với thiết kế mới
const StatusTransitionInfo = memo(({ currentStatus, nextStatus }) => {
  const getTransitionDetails = () => {
    // Tìm transition tương ứng trong định nghĩa
    let transition = null;
    
    for (const key in OrderAutoTransition.TRANSITIONS) {
      const t = OrderAutoTransition.TRANSITIONS[key];
      const fromMatches = Array.isArray(t.from) 
        ? t.from.includes(currentStatus) 
        : t.from === currentStatus;
      
      if (fromMatches && t.to === nextStatus) {
        transition = t;
        break;
      }
    }
    
    if (!transition) {
      return { type: 'manual', message: 'Chuyển đổi thủ công', isAuto: false };
    }
    
    // Dựa vào loại điều kiện để hiển thị thông tin phù hợp
    switch (transition.condition) {
      case 'auto':
        return {
          type: 'auto',
          message: 'Tự động sau khi xử lý',
          icon: <ClockIcon size={14} className="mr-1" />,
          isAuto: true
        };
      case 'trigger':
        return {
          type: 'trigger',
          message: `Khi có sự kiện "${transition.event}"`,
          icon: <ArrowRightIcon size={14} className="mr-1" />,
          isAuto: false
        };
      case 'manual_approval':
        return {
          type: 'manual',
          message: 'Cần xác nhận thủ công',
          icon: <InfoIcon size={14} className="mr-1" />,
          isAuto: false
        };
      default:
        return {
          type: 'unknown',
          message: 'Không xác định',
          icon: <InfoIcon size={14} className="mr-1" />,
          isAuto: false
        };
    }
  };
  
  const transitionDetails = getTransitionDetails();
  
  // Xác định style dựa vào loại transition
  const getBgStyle = () => {
    switch (transitionDetails.type) {
      case 'auto':
        return 'bg-gradient-to-r from-green-50 to-green-100 border-green-200';
      case 'trigger':
        return 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200';
      case 'manual':
        return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200';
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
    }
  };
  
  const getTextStyle = () => {
    switch (transitionDetails.type) {
      case 'auto':
        return 'text-green-700';
      case 'trigger':
        return 'text-blue-700';
      case 'manual':
        return 'text-orange-700';
      default:
        return 'text-gray-700';
    }
  };
  
  return (
    <div className={`
      text-xs flex items-center px-2.5 py-1.5 rounded-full mt-1
      ${getBgStyle()} ${getTextStyle()}
      border shadow-sm transition-all duration-200 hover:shadow
    `}>
      {transitionDetails.icon}
      {transitionDetails.message}
      {transitionDetails.isAuto && (
        <span className="ml-1 inline-flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
      )}
    </div>
  );
});

StatusTransitionInfo.displayName = 'StatusTransitionInfo';

// Định nghĩa component OrderAdmin
const OrderAdmin = () => {
  try {
    // State for orders and UI
    const [orders, setOrders] = useState([]);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshTime, setLastRefreshTime] = useState(null);
    const [orderStats, setOrderStats] = useState({
      total: 0,
      pending: 0,
      preparing: 0,
      packaging: 0,
      shipping: 0,
      delivering: 0,
      completed: 0,
      cancelled: 0
    });
    // Pagination state
    const [first, setFirst] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    // State for search and filtering
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("Tất cả");
    
    // State for modals and dialogs
    const [viewOrderDialogVisible, setViewOrderDialogVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusDialogVisible, setStatusDialogVisible] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [bulkActionVisible, setBulkActionVisible] = useState(false);
    const [bulkStatus, setBulkStatus] = useState("");
    const [bulkConfirmVisible, setBulkConfirmVisible] = useState(false);
    const [transitionHistoryVisible, setTransitionHistoryVisible] = useState(false);
    const [autoTransitionConfigVisible, setAutoTransitionConfigVisible] = useState(false);
    
    // Add missing state variables
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [paymentDialog, setPaymentDialog] = useState(false);
    const [paymentOrderId, setPaymentOrderId] = useState(null);
    const [selectedOrderForStatus, setSelectedOrderForStatus] = useState(null);
    // Alias for backward compatibility
    const setViewOrder = setSelectedOrder;
    const setStatusDialog = setStatusDialogVisible;
    const viewOrder = selectedOrder;
    const statusDialog = statusDialogVisible;
    
    // State for auto-transition settings
    const [autoConfirmEnabled, setAutoConfirmEnabled] = useState(true);
    const [autoConfirmMinutes, setAutoConfirmMinutes] = useState(15);
    const [autoPrepareEnabled, setAutoPrepareEnabled] = useState(true);
    const [autoPrepareMinutes, setAutoPrepareMinutes] = useState(30);
    const [autoCancelEnabled, setAutoCancelEnabled] = useState(true);
    const [autoCancelHours, setAutoCancelHours] = useState(24);
    
    // Helper function để hiển thị toast
    const showToast = useCallback((severity, summary, detail) => {
      switch (severity) {
        case 'success':
          toast.success(summary, {
            description: detail,
            position: 'top-right',
          });
          break;
        case 'error':
          toast.error(summary, {
            description: detail,
            position: 'top-right',
          });
          break;
        case 'info':
          toast.info(summary, {
            description: detail,
            position: 'top-right',
          });
          break;
        case 'warning':
          toast.warning(summary, {
            description: detail,
            position: 'top-right',
          });
          break;
        default:
          toast(summary, {
            description: detail,
            position: 'top-right',
          });
      }
    }, []);
    
    // Lưu cấu hình chuyển đổi trạng thái tự động
    const saveAutoTransitionConfig = useCallback(() => {
      // Cập nhật các giá trị trong OrderAutoTransition.CONDITIONS.TIME_BASED
      const updatedTimeConditions = {
        PENDING_AUTO_CONFIRM: autoConfirmEnabled ? autoConfirmMinutes * 60 * 1000 : Infinity,
        CONFIRMED_TO_PREPARING: autoPrepareEnabled ? autoPrepareMinutes * 60 * 1000 : Infinity,
        AUTO_CANCEL_UNPAID: autoCancelEnabled ? autoCancelHours * 60 * 60 * 1000 : Infinity
      };
      
      // Trong thực tế, đây sẽ là một API call để lưu cấu hình vào database
      console.log("Lưu cấu hình vào database:", updatedTimeConditions);
      
      // Mô phỏng việc cập nhật cấu hình
      OrderAutoTransition.CONDITIONS.TIME_BASED = {
        ...OrderAutoTransition.CONDITIONS.TIME_BASED,
        ...updatedTimeConditions
      };
      
      setAutoTransitionConfigVisible(false);
      showToast('success', 'Cập nhật thành công', 'Đã lưu cấu hình chuyển đổi trạng thái tự động');
    }, [
      autoConfirmEnabled, autoConfirmMinutes,
      autoPrepareEnabled, autoPrepareMinutes,
      autoCancelEnabled, autoCancelHours,
      showToast
    ]);
    
    // Định nghĩa các trạng thái đơn hàng theo luồng xử lý
    const ORDER_STATUSES = {
      PENDING: "pending",                  // Chờ xử lý ban đầu
      PREPARING: "preparing",              // Đang chuẩn bị hàng
      PACKAGING: "packaging",              // Hoàn tất đóng gói
      SHIPPING: "shipping",                // Đang được vận chuyển
      DELIVERING: "delivering",            // Đơn hàng đang được giao đến khách
      COMPLETED: "completed",              // Giao hàng thành công
      CANCELLED: "cancelled",              // Đã hủy
      AWAITING_PAYMENT: "awaiting_payment" // Chờ thanh toán (cho thanh toán online)
    };

    // Memoize utility functions to prevent re-creation on each render
    const getStatusColor = useCallback((status) => {
      switch (status) {
        case ORDER_STATUSES.PENDING:
          return "text-yellow-600 bg-yellow-100 border-yellow-200";
        case ORDER_STATUSES.PREPARING:
          return "text-blue-600 bg-blue-100 border-blue-200";
        case ORDER_STATUSES.PACKAGING:
          return "text-indigo-600 bg-indigo-100 border-indigo-200";
        case ORDER_STATUSES.SHIPPING:
          return "text-purple-600 bg-purple-100 border-purple-200";
        case ORDER_STATUSES.DELIVERING:
          return "text-cyan-600 bg-cyan-100 border-cyan-200";
        case ORDER_STATUSES.AWAITING_PAYMENT:
          return "text-orange-600 bg-orange-100 border-orange-200";
        case ORDER_STATUSES.COMPLETED:
          return "text-green-600 bg-green-100 border-green-200";
        case ORDER_STATUSES.CANCELLED:
          return "text-red-600 bg-red-100 border-red-200";
        default:
          return "text-gray-600 bg-gray-100 border-gray-200";
      }
    }, [ORDER_STATUSES]);

    const getStatusText = useCallback((status) => {
      switch (status) {
        case ORDER_STATUSES.PENDING:
          return "Chờ xử lý";
        case ORDER_STATUSES.PREPARING:
          return "Đang chuẩn bị hàng";
        case ORDER_STATUSES.PACKAGING:
          return "Hoàn tất đóng gói";
        case ORDER_STATUSES.SHIPPING:
          return "Đang vận chuyển";
        case ORDER_STATUSES.DELIVERING:
          return "Đang giao đến khách";
        case ORDER_STATUSES.AWAITING_PAYMENT:
          return "Chờ thanh toán";
        case ORDER_STATUSES.COMPLETED:
          return "Giao hàng thành công";
        case ORDER_STATUSES.CANCELLED:
          return "Đã hủy";
        default:
          return status;
      }
    }, [ORDER_STATUSES]);

    const getStatusIcon = useCallback((status) => {
      switch (status) {
        case ORDER_STATUSES.PENDING:
          return <ClockIcon size={16} className="mr-1" />;
        case ORDER_STATUSES.PREPARING:
          return <i className="pi pi-box mr-1" style={{ fontSize: '0.9rem' }}></i>;
        case ORDER_STATUSES.PACKAGING:
          return <i className="pi pi-gift mr-1" style={{ fontSize: '0.9rem' }}></i>;
        case ORDER_STATUSES.SHIPPING:
          return <i className="pi pi-truck mr-1" style={{ fontSize: '0.9rem' }}></i>;
        case ORDER_STATUSES.DELIVERING:
          return <i className="pi pi-map-marker mr-1" style={{ fontSize: '0.9rem' }}></i>;
        case ORDER_STATUSES.COMPLETED:
          return <CheckIcon size={16} className="mr-1" />;
        case ORDER_STATUSES.CANCELLED:
          return <XIcon size={16} className="mr-1" />;
        case ORDER_STATUSES.AWAITING_PAYMENT:
          return <i className="pi pi-wallet mr-1" style={{ fontSize: '0.9rem' }}></i>;
        default:
          return null;
      }
    }, [ORDER_STATUSES]);

    const getCustomerName = useCallback((order) => {
      if (order.userId?.firstName && order.userId?.lastName) {
        return `${order.userId.firstName} ${order.userId.lastName}`;
      }
      if (order.userId?.userName) {
        return order.userId.userName;
      }
      if (order.shippingInfo?.phone) {
        return `Khách ${order.shippingInfo.phone}`;
      }
      return "Khách vãng lai";
    }, []);

    const formatDate = useCallback((dateString) => {
      const options = { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" };
      return new Date(dateString).toLocaleDateString("vi-VN", options);
    }, []);

    const formatCurrency = useCallback((amount) => {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }, []);

    const calculateOrderStats = useCallback((ordersList) => {
      const stats = {
        total: ordersList.length,
        pending: ordersList.filter(order => order.status === ORDER_STATUSES.PENDING).length,
        preparing: ordersList.filter(order => order.status === ORDER_STATUSES.PREPARING).length,
        packaging: ordersList.filter(order => order.status === ORDER_STATUSES.PACKAGING).length,
        shipping: ordersList.filter(order => order.status === ORDER_STATUSES.SHIPPING).length,
        delivering: ordersList.filter(order => 
          order.status === ORDER_STATUSES.DELIVERING ||
          order.status === ORDER_STATUSES.SHIPPING
        ).length,
        completed: ordersList.filter(order => order.status === ORDER_STATUSES.COMPLETED).length,
        cancelled: ordersList.filter(order => order.status === ORDER_STATUSES.CANCELLED).length,
      };
      setOrderStats(stats);
    }, [ORDER_STATUSES]);

    // Cập nhật hàm fetchOrders - cơ chế mới để chặn triệt để gọi API trùng lặp
    const fetchOrders = useCallback(async (preventLoading = false, forceRefresh = false) => {
      // Kiểm tra cờ global để ngăn gọi trùng lặp
      if (window._isOrderFetching && !forceRefresh) {
        console.log('Đang có request đang chạy, bỏ qua request mới');
        return; 
      }
      
      // Đánh dấu đang fetching trên window object để mọi instance đều thấy
      window._isOrderFetching = true;
      
      // Đánh dấu thời gian last fetched để không fetch quá thường xuyên
      const now = Date.now();
      const lastFetchTime = window._lastOrderFetchTime || 0;
      
      // Chỉ fetch nếu đã quá 30 giây kể từ lần cuối hoặc force refresh
      if (!forceRefresh && (now - lastFetchTime < 30000)) {
        console.log('Mới fetch gần đây, bỏ qua');
        window._isOrderFetching = false;
        return;
      }
      
      if (!preventLoading) {
        setLoading(true);
      }
      
      try {
        // Lưu thời điểm fetch hiện tại
        window._lastOrderFetchTime = now;
        
        // Tạo AbortController để có thể hủy request nếu cần
        const controller = new AbortController();
        const signal = controller.signal;
        
        // Thêm timeout để tự hủy request sau 15 giây nếu không có phản hồi
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        // Bỏ tham số _cache hoàn toàn để tránh gây ra request mới
        const response = await fetch(`${API_BASE_URL}/orders`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          signal: signal
        });
        
        // Xóa timeout vì request đã hoàn thành
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 404) {
            // API chưa có dữ liệu đơn hàng hoặc endpoint không tồn tại
            setOrders([]);
            calculateOrderStats([]);
          } else {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
        } else {
          const data = await response.json();
          
          const sortedOrders = data.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );

          // Mô phỏng auto transition dựa trên thời gian
          const processedOrders = processAutoTransitions(sortedOrders);

          setOrders(processedOrders);
          calculateOrderStats(processedOrders);
          
          // Fetch thành công, hiển thị toast khi force refresh
          if (forceRefresh) {
            showToast('success', 'Thành công', 'Dữ liệu đơn hàng đã được cập nhật');
          }
        }
      } catch (error) {
        // Kiểm tra nếu lỗi không phải do abort (hủy request)
        if (error.name !== 'AbortError') {
          console.error("Lỗi khi lấy dữ liệu đơn hàng:", error);
          setOrders([]);
          calculateOrderStats([]);
          showToast('error', 'Lỗi', 'Không thể tải dữ liệu đơn hàng');
        }
      } finally {
        setLoading(false);
        setLastRefreshTime(Date.now());
        
        // Reset trạng thái loading global
        window._isOrderFetching = false;
      }
    }, [calculateOrderStats, showToast]);

    // Hàm xử lý auto transition dựa trên quy tắc thời gian
    const processAutoTransitions = useCallback((ordersList) => {
      // Biến cấu hình auto transition, có thể lấy từ settings của admin
      const AUTO_TRANSITION_ENABLED = true;
      const now = new Date();
      
      if (!AUTO_TRANSITION_ENABLED) {
        return ordersList;
      }
      
      return ordersList.map(order => {
        const orderCreatedAt = new Date(order.createdAt);
        const orderUpdatedAt = order.updatedAt ? new Date(order.updatedAt) : orderCreatedAt;
        const timeSinceCreated = now - orderCreatedAt;
        const timeSinceUpdated = now - orderUpdatedAt;
        
        let updatedOrder = { ...order };
        
        // Mô phỏng các quy tắc auto transition dựa trên thời gian
        switch (order.status) {
          case ORDER_STATUSES.PENDING:
            // Tự động chuyển sang confirmed sau 15 phút nếu là COD
            if (timeSinceCreated >= OrderAutoTransition.CONDITIONS.TIME_BASED.PENDING_AUTO_CONFIRM && 
                (order.paymentMethod === 'cod' || !order.paymentMethod)) {
              updatedOrder = { 
                ...updatedOrder, 
                status: ORDER_STATUSES.CONFIRMED,
                updatedAt: new Date(orderCreatedAt.getTime() + OrderAutoTransition.CONDITIONS.TIME_BASED.PENDING_AUTO_CONFIRM)
              };
            }
            break;
            
          case ORDER_STATUSES.CONFIRMED:
            // Tự động chuyển sang preparing sau 30 phút từ confirmed
            if (timeSinceUpdated >= OrderAutoTransition.CONDITIONS.TIME_BASED.CONFIRMED_TO_PREPARING) {
              updatedOrder = {
                ...updatedOrder,
                status: ORDER_STATUSES.PREPARING,
                updatedAt: new Date(orderUpdatedAt.getTime() + OrderAutoTransition.CONDITIONS.TIME_BASED.CONFIRMED_TO_PREPARING)
              };
            }
            break;
            
          case ORDER_STATUSES.AWAITING_PAYMENT:
            // Hủy đơn nếu chưa thanh toán sau 24h
            if (timeSinceCreated >= OrderAutoTransition.CONDITIONS.TIME_BASED.AUTO_CANCEL_UNPAID && !order.isPaid) {
              updatedOrder = {
                ...updatedOrder,
                status: ORDER_STATUSES.CANCELLED,
                updatedAt: new Date(orderCreatedAt.getTime() + OrderAutoTransition.CONDITIONS.TIME_BASED.AUTO_CANCEL_UNPAID),
                cancelReason: "Hệ thống tự động hủy do quá thời gian thanh toán"
              };
            }
            break;
            
          // Có thể thêm các trường hợp khác tùy theo yêu cầu
          default:
            break;
        }
        
        return updatedOrder;
      });
    }, [ORDER_STATUSES]);

    // Cải tiến useEffect để tránh việc gọi API liên tục
    useEffect(() => {
      // Khởi tạo biến global nếu chưa có
      if (typeof window._isOrderFetching === 'undefined') {
        window._isOrderFetching = false;
        window._lastOrderFetchTime = 0;
      }
      
      // Chỉ gọi API lần đầu khi component mount
      fetchOrders();
      
      // Thiết lập interval refresh dài hơn và chỉ refresh khi tab đang active
      const interval = setInterval(() => {
        // Chỉ fetch khi tab đang active và không có request đang chạy
        if (document.visibilityState === 'visible' && !window._isOrderFetching) {
          fetchOrders(true);
        }
      }, 180000); // 3 phút refresh một lần thay vì 2 phút
      
      // Cleanup khi unmount
      return () => {
        clearInterval(interval);
      };
    }, [fetchOrders]);

    const handleViewOrder = useCallback((order) => {
      setViewOrder(order);
    }, []);

    const confirmDeleteOrder = useCallback((orderId) => {
      setSelectedOrderId(orderId);
      setDeleteDialog(true);
    }, []);

    const handleDeleteOrder = useCallback(async () => {
      try {
        // Gọi API xóa đơn hàng
        await fetch(`${API_BASE_URL}/orders/${selectedOrderId}`, {
          method: "DELETE",
        });

        // Cập nhật state
        setOrders(prevOrders => {
          const updatedOrders = prevOrders.filter(
            (order) => order._id !== selectedOrderId
          );
          calculateOrderStats(updatedOrders);
          return updatedOrders;
        });
        
        setDeleteDialog(false);
      } catch (error) {
        console.error("Lỗi khi xóa đơn hàng:", error);
      }
    }, [selectedOrderId, calculateOrderStats]);

    // Hàm xử lý cập nhật trạng thái đơn hàng
    const openUpdateStatusDialog = useCallback((order) => {
      setSelectedOrderForStatus(order);
      setStatusDialog(true);
    }, []);

    // Xác định trạng thái tiếp theo của đơn hàng
    const getNextStatuses = useCallback((currentStatus, isPaid) => {
      // Lấy danh sách trạng thái có thể chuyển tiếp từ OrderAutoTransition
      const nextPossibleStates = OrderAutoTransition.getNextPossibleStates(currentStatus);
      
      // Lọc và map sang định dạng phù hợp với UI
      const mappedStates = nextPossibleStates.map(state => {
        return {
          label: getStatusText(state),
          value: state
        };
      });
      
      // Nếu không có trạng thái tiếp theo, hoặc là trạng thái completed/cancelled, thì không thể chuyển tiếp
      if (mappedStates.length === 0 || 
          currentStatus === ORDER_STATUSES.COMPLETED || 
          currentStatus === ORDER_STATUSES.CANCELLED) {
        return [];
      }
      
      // Luôn thêm trạng thái Hủy đơn
      if (!mappedStates.some(state => state.value === ORDER_STATUSES.CANCELLED)) {
        mappedStates.push({ label: 'Đã hủy', value: ORDER_STATUSES.CANCELLED });
      }
      
      return mappedStates;
    }, [ORDER_STATUSES, getStatusText]);

    // Hàm cập nhật trạng thái đơn hàng
    const updateOrderStatus = useCallback(async (orderId, newStatus) => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            status: newStatus,
            // Nếu cập nhật thành trạng thái completed và là đơn COD, thì cũng cập nhật isPaid
            isPaid: newStatus === ORDER_STATUSES.COMPLETED ? true : undefined
          }),
        });

        if (response.ok) {
          // Cập nhật local state
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
            calculateOrderStats(updatedOrders);
            return updatedOrders;
          });
          
          // Hiển thị thông báo phù hợp dựa trên trạng thái
          if (newStatus === ORDER_STATUSES.DELIVERING) {
            showToast('success', 'Đã cập nhật trạng thái', 'Email thông báo giao hàng đã được gửi đến khách hàng kèm thông tin thanh toán');
          } else {
            showToast('success', 'Đã cập nhật trạng thái', 'Trạng thái đơn hàng đã được cập nhật thành công');
          }
          
          setStatusDialog(false);
          setSelectedOrderForStatus(null);
        } else {
          console.error("Lỗi khi cập nhật trạng thái đơn hàng");
          showToast('error', 'Lỗi cập nhật', 'Không thể cập nhật trạng thái đơn hàng');
        }
      } catch (error) {
        console.error("Lỗi khi gọi API cập nhật trạng thái:", error);
        showToast('error', 'Lỗi hệ thống', 'Đã xảy ra lỗi khi cập nhật trạng thái');
      }
    }, [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.DELIVERING, calculateOrderStats, showToast]);

    const confirmMarkAsPaid = useCallback((orderId) => {
      setPaymentOrderId(orderId);
      setPaymentDialog(true);
    }, []);

    const handleMarkAsPaid = useCallback(async () => {
      try {
        // Cập nhật: Gọi API để cập nhật cả isPaid và status
        const response = await fetch(`${API_BASE_URL}/orders/${paymentOrderId}/mark-paid`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            isPaid: true,
            status: ORDER_STATUSES.COMPLETED // Cập nhật trạng thái thành "Đã giao"
          }),
        });

        if (response.ok) {
          // Cập nhật state
          setOrders(prevOrders => {
            const updatedOrders = prevOrders.map(order => 
              order._id === paymentOrderId 
                ? { ...order, isPaid: true, status: ORDER_STATUSES.COMPLETED } 
                : order
            );
            // Cập nhật lại số liệu thống kê sau khi đổi trạng thái
            calculateOrderStats(updatedOrders);
            return updatedOrders;
          });
          
          setPaymentDialog(false);
        } else {
          console.error("Lỗi khi đánh dấu đơn hàng đã thanh toán");
        }
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái thanh toán:", error);
      }
    }, [paymentOrderId, calculateOrderStats, ORDER_STATUSES]);

    // Memoize filtered orders to prevent recalculation on every render
    const filteredOrders = useMemo(() => {
      return orders.filter((order) => {
        const customerName = getCustomerName(order).toLowerCase();
        const orderIdMatch = order._id?.toLowerCase().includes(searchTerm.toLowerCase());
        const customerNameMatch = customerName.includes(searchTerm.toLowerCase());
        const phoneMatch = order.shippingInfo?.phone?.includes(searchTerm);
        
        const matchesSearch = orderIdMatch || customerNameMatch || phoneMatch;

        const matchesStatus =
          filterStatus === "Tất cả" ||
          (filterStatus === "Chờ xử lý" && order.status === ORDER_STATUSES.PENDING) ||
          (filterStatus === "Đang chuẩn bị" && order.status === ORDER_STATUSES.PREPARING) ||
          (filterStatus === "Đóng gói" && order.status === ORDER_STATUSES.PACKAGING) ||
          (filterStatus === "Vận chuyển" && order.status === ORDER_STATUSES.SHIPPING) ||
          (filterStatus === "Đang giao" && order.status === ORDER_STATUSES.DELIVERING) ||
          (filterStatus === "Chờ thanh toán" && order.status === ORDER_STATUSES.AWAITING_PAYMENT) ||
          (filterStatus === "Hoàn thành" && order.status === ORDER_STATUSES.COMPLETED) ||
          (filterStatus === "Đã hủy" && order.status === ORDER_STATUSES.CANCELLED);

        return matchesSearch && matchesStatus;
      });
    }, [orders, searchTerm, filterStatus, getCustomerName, ORDER_STATUSES]);

    // Danh sách options cho dropdown filter status
    const statusFilterOptions = useMemo(() => [
      {label: 'Tất cả trạng thái', value: 'Tất cả'},
      {label: 'Chờ xử lý', value: 'Chờ xử lý'},
      {label: 'Đang chuẩn bị', value: 'Đang chuẩn bị'},
      {label: 'Đóng gói', value: 'Đóng gói'},
      {label: 'Vận chuyển', value: 'Vận chuyển'},
      {label: 'Đang giao', value: 'Đang giao'},
      {label: 'Chờ thanh toán', value: 'Chờ thanh toán'},
      {label: 'Hoàn thành', value: 'Hoàn thành'},
      {label: 'Đã hủy', value: 'Đã hủy'}
    ], []);
    
    // Danh sách các action cập nhật hàng loạt
    const bulkActionOptions = useMemo(() => [
      {label: 'Chọn hành động', value: null},
      {label: 'Đang chuẩn bị hàng', value: ORDER_STATUSES.PREPARING},
      {label: 'Hoàn tất đóng gói', value: ORDER_STATUSES.PACKAGING},
      {label: 'Đang vận chuyển', value: ORDER_STATUSES.SHIPPING},
      {label: 'Đang giao đến khách', value: ORDER_STATUSES.DELIVERING},
      {label: 'Giao hàng thành công', value: ORDER_STATUSES.COMPLETED},
      {label: 'Đã hủy', value: ORDER_STATUSES.CANCELLED}
    ], [ORDER_STATUSES]);
    
    // Xử lý cập nhật hàng loạt
    const confirmBulkAction = useCallback(() => {
      if (!bulkStatus || selectedOrders.length === 0) return;
      
      // Mở dialog xác nhận thay vì sử dụng confirmDialog
      setBulkConfirmVisible(true);
    }, [bulkStatus, selectedOrders]);
    
    // Thực hiện cập nhật hàng loạt
    const executeBulkUpdate = useCallback(async () => {
      if (!bulkStatus || selectedOrders.length === 0) return;
      
      setLoading(true);
      let successCount = 0;
      let errorCount = 0;
      
      // Cập nhật tuần tự để tránh quá tải server
      for (const order of selectedOrders) {
        try {
          const response = await fetch(`${API_BASE_URL}/orders/${order._id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              status: bulkStatus,
              // Nếu cập nhật thành trạng thái completed, thì cũng cập nhật isPaid
              isPaid: bulkStatus === ORDER_STATUSES.COMPLETED ? true : undefined
            }),
          });
          
          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Lỗi khi cập nhật đơn hàng ${order._id}:`, error);
          errorCount++;
        }
      }
      
      // Cập nhật state local
      if (successCount > 0) {
        setOrders(prevOrders => {
          const updatedOrders = prevOrders.map(order => 
            selectedOrders.some(selected => selected._id === order._id)
              ? { 
                  ...order, 
                  status: bulkStatus,
                  isPaid: bulkStatus === ORDER_STATUSES.COMPLETED ? true : order.isPaid
                } 
              : order
          );
          calculateOrderStats(updatedOrders);
          return updatedOrders;
        });
        
        showToast('success', 'Cập nhật thành công', `Đã cập nhật ${successCount} đơn hàng`);
        
        // Reset selection
        setSelectedOrders([]);
        setBulkStatus(null);
      }
      
      if (errorCount > 0) {
        showToast('error', 'Lỗi cập nhật', `${errorCount} đơn hàng không thể cập nhật`);
      }
      
      setLoading(false);
    }, [bulkStatus, selectedOrders, calculateOrderStats, ORDER_STATUSES.COMPLETED, showToast]);

    // Thêm hàm chuyển đổi phương thức thanh toán
    const getPaymentMethodText = useCallback((method) => {
      if (!method) return "Thanh toán khi nhận hàng";
      
      method = method.toLowerCase();
      switch (method) {
        case "cod":
          return "Thanh toán khi nhận hàng";
        case "sepay":
          return "Thanh toán SePay";
        case "bank_transfer":
          return "Chuyển khoản ngân hàng";
        case "credit_card":
          return "Thẻ tín dụng";
        case "momo":
          return "Ví MoMo";
        case "zalopay":
          return "ZaloPay";
        default:
          return method;
      }
    }, []);

    // Update the loading indicator
    if (loading && orders.length === 0) {
      return (
        <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse opacity-20"></div>
              <div className="absolute inset-2 bg-white rounded-full"></div>
              <div className="absolute inset-4 border-4 border-t-blue-500 border-r-transparent border-b-indigo-500 border-l-transparent rounded-full animate-spin"></div>
              <i className="pi pi-shopping-cart absolute inset-0 flex items-center justify-center text-blue-600" style={{ fontSize: '1.5rem' }}></i>
            </div>
            <div className="text-xl font-bold text-gray-800 mb-2">Đang tải dữ liệu...</div>
            <p className="text-gray-500">Hệ thống đang tải đơn hàng, vui lòng đợi trong giây lát</p>
            
            <div className="mt-6 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-loading-bar"></div>
            </div>
          </div>
        </div>
      );
    }

    // Styling for the dropdown menu that shows order status options
    const statusDropdownPanelStyle = {
      className: 'rounded-lg shadow-lg border border-gray-200 overflow-hidden p-0 mt-1 animate-dropdown transform transition-all duration-200',
      style: { 
        transformOrigin: 'top center',
        minWidth: '16rem'
      }
    };

    const statusDropdownItemStyle = {
      className: 'cursor-pointer px-4 py-3 hover:bg-blue-50 flex items-center border-b border-gray-100 last:border-b-0 transition-colors',
    };

    const statusDropdownHeaderStyle = {
      className: 'py-2 px-4 bg-gradient-to-r from-gray-50 to-white font-medium text-gray-800 border-b border-gray-200'
    };

    return (
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <style>
          {`
            @keyframes dropdown {
              from {
                opacity: 0;
                transform: scale(0.98) translateY(-10px);
              }
              to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }

            .animate-dropdown {
              animation: dropdown 0.2s ease-out forwards;
            }

            /* Chỉnh sửa CSS cho checkbox để hiển thị dấu check rõ ràng */
            .p-checkbox-box.p-highlight {
              background-color: #3b82f6 !important;
              border-color: #3b82f6 !important;
            }
            
            .p-checkbox-box.p-highlight .p-checkbox-icon {
              color: white !important;
              font-size: 12px !important;
              font-weight: bold !important;
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
            }
            
            .p-checkbox {
              width: 20px !important;
              height: 20px !important;
            }
            
            .p-checkbox .p-checkbox-box {
              width: 20px !important;
              height: 20px !important;
            }
          `}
        </style>
        <Toaster position="top-right" richColors closeButton />
        <ConfirmDialog />
        
        <div className="flex flex-col mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Quản lý Đơn hàng</h1>
              <p className="text-gray-500 mt-2">Quản lý tất cả đơn hàng, cập nhật trạng thái và theo dõi tiến trình giao hàng</p>
            </div>
            
            <div className="flex items-center gap-3">
          <Button
            icon={<SettingsIcon size={18} className="mr-2" />}
                label="Cài đặt tự động"
            onClick={() => setAutoTransitionConfigVisible(true)}
                className="px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium rounded-lg shadow-sm hover:shadow transition-all flex items-center"
            tooltip="Cấu hình tự động chuyển đổi trạng thái đơn hàng"
            tooltipOptions={{ position: 'left' }}
          />
          <Button
            icon={<RefreshCcwIcon size={18} className="mr-2" />}
            label="Làm mới dữ liệu"
            onClick={() => fetchOrders(false, true)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all flex items-center"
            tooltip="Cập nhật dữ liệu đơn hàng"
            tooltipOptions={{ position: 'left' }}
            loading={loading}
            loadingIcon="pi pi-spin pi-spinner"
          />
            </div>
          </div>

          {/* Info panel for any helpful instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mt-4 flex items-start">
            <div className="bg-white p-2 rounded-full mr-4 shadow-sm">
              <i className="pi pi-info-circle text-blue-500" style={{ fontSize: '1.2rem' }}></i>
            </div>
            <div>
              <h3 className="font-medium text-blue-800 mb-1">Mẹo quản lý đơn hàng</h3>
              <p className="text-blue-700 text-sm">
                Quản lý đơn hàng hiệu quả bằng cách sử dụng tính năng cập nhật hàng loạt. Chọn nhiều đơn hàng cùng lúc bằng cách nhấn vào ô checkbox và áp dụng trạng thái mới cho tất cả đơn hàng đã chọn.
              </p>
              <div className="flex mt-3 gap-2">
                <button className="text-xs bg-white px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-colors shadow-sm border border-blue-200 hover:border-blue-600 flex items-center">
                  <i className="pi pi-external-link mr-1"></i> Xem hướng dẫn
                </button>
                <button className="text-xs bg-white px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-colors shadow-sm border border-blue-200 hover:border-blue-600 flex items-center">
                  <i className="pi pi-cog mr-1"></i> Tùy chỉnh giao diện
                </button>
              </div>
            </div>
            <button className="ml-auto bg-white w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shadow-sm">
              <i className="pi pi-times" style={{ fontSize: '0.8rem' }}></i>
            </button>
          </div>
        </div>
        
        {/* Thống kê đơn hàng */}
        <OrderStats stats={orderStats} />

        <Card 
          className="shadow-lg mb-8 border border-gray-200 rounded-xl overflow-hidden bg-white"
          pt={{ 
            root: { className: 'overflow-hidden' },
            content: { className: 'p-0' }
          }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="relative w-full md:w-64 flex items-center">
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn hoặc tên khách..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-3 border border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:border-gray-300 transition-all bg-gray-50 hover:bg-white"
              />
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>

            <Dropdown
              value={filterStatus}
              options={statusFilterOptions}
              onChange={(e) => setFilterStatus(e.value)}
              placeholder="Chọn trạng thái"
              className="w-full md:w-64"
              pt={{
                root: { className: 'w-full border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 transition-all bg-gray-50 hover:bg-white' },
                input: { className: 'p-3 flex items-center' },
                trigger: { 
                  className: 'p-3 flex items-center justify-between hover:text-blue-600 transition-colors', 
                  children: <ChevronDown className="opacity-60" size={16} />
                },
                panel: statusDropdownPanelStyle,
                item: statusDropdownItemStyle,
                header: statusDropdownHeaderStyle,
                itemgroup: { className: 'p-3 font-medium text-gray-700 bg-gray-50 border-b border-gray-200' }
              }}
            />
          </div>

          {loading && orders.length > 0 && (
            <div className="relative w-full h-1">
              <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 animate-gradient-x w-full"></div>
            </div>
          )}

          {/* Bulk Update Controls */}
          {selectedOrders.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center p-5 bg-blue-50 border-y border-blue-100">
              <div className="flex items-center">
                <span className="text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full">
                  Đã chọn {selectedOrders.length} đơn hàng
                </span>
              </div>
              <div className="flex items-center gap-3 mt-3 sm:mt-0">
                <Dropdown
                  value={bulkStatus}
                  options={bulkActionOptions}
                  onChange={(e) => setBulkStatus(e.value)}
                  placeholder="Chọn trạng thái mới"
                  className="w-52 h-10"
                  disabled={selectedOrders.length === 0}
                  pt={{
                    root: { className: 'border border-gray-300 rounded-lg bg-white shadow-sm hover:border-blue-300 transition-all' },
                    input: { className: 'p-2.5 flex items-center' },
                    trigger: {
                      className: 'p-2.5 flex items-center justify-between hover:text-blue-600 transition-colors', 
                      children: <ChevronDown className="opacity-60" size={16} />
                    },
                    panel: statusDropdownPanelStyle,
                    item: statusDropdownItemStyle,
                    header: statusDropdownHeaderStyle,
                    emptyMessage: { className: 'p-4 text-gray-500 text-center' }
                  }}
                />
                <Button
                  label="Cập nhật hàng loạt"
                  icon="pi pi-check"
                  disabled={!bulkStatus || selectedOrders.length === 0}
                  onClick={confirmBulkAction}
                  className="px-4 py-2.5 bg-blue-600 text-white hover:bg-blue-700 font-medium rounded-lg transition-colors"
                />
                <Button
                  icon="pi pi-times"
                  onClick={() => setSelectedOrders([])}
                  tooltip="Bỏ chọn tất cả"
                  tooltipOptions={{ position: 'top' }}
                  className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg"
                />
              </div>
            </div>
          )}

          <div className="p-4 bg-gray-50">
            <DataTable
              value={filteredOrders.slice(first, first + rowsPerPage)}
              selection={selectedOrders}
              onSelectionChange={(e) => setSelectedOrders(e.value)}
              dataKey="_id"
              tableStyle={{ minWidth: '960px', borderCollapse: 'separate', borderSpacing: '0 0.8rem' }}
              emptyMessage={
                <div className="text-center py-12 px-4">
                  <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <i className="pi pi-inbox text-gray-400" style={{ fontSize: '2.5rem' }}></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Không tìm thấy đơn hàng</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    {searchTerm || filterStatus !== "Tất cả" ? 
                      "Không tìm thấy đơn hàng phù hợp với bộ lọc hiện tại. Vui lòng thử tiêu chí tìm kiếm khác." : 
                      "Hiện tại chưa có đơn hàng nào trong hệ thống. Đơn hàng mới sẽ xuất hiện tại đây."}
                  </p>
                  {(searchTerm || filterStatus !== "Tất cả") && (
                    <Button
                      label="Xóa bộ lọc"
                      icon="pi pi-filter-slash"
                      onClick={() => {
                        setSearchTerm("");
                        setFilterStatus("Tất cả");
                      }}
                      className="px-4 py-2 bg-white text-blue-600 border border-blue-300 hover:bg-blue-50 rounded-lg shadow-sm transition-colors"
                    />
                  )}
                </div>
              }
              loading={loading && orders.length === 0}
              selectionMode="checkbox"
              resizableColumns
              columnResizeMode="fit"
              rowClassName="shadow-sm hover:shadow-md transition-all"
              pt={{
                wrapper: { className: 'border-none' },
                table: { className: '' },
                thead: { className: 'bg-gray-100 rounded-lg' },
                headerRow: { className: 'text-gray-700 text-sm font-semibold' },
                headerCell: { className: 'p-5 first:rounded-l-xl last:rounded-r-xl bg-white border-b border-gray-200' },
                bodyRow: { className: 'bg-white mb-2 rounded-xl' },
                bodyCellWrapper: { className: 'p-4 text-gray-700 text-sm' },
                checkboxWrapper: { className: 'flex items-center justify-center' },
                checkbox: { 
                  root: { className: 'flex items-center justify-center scale-125' },
                  box: { className: 'w-5 h-5 border-2 flex items-center justify-center relative' },
                  input: { className: 'cursor-pointer' },
                  icon: { className: 'text-white z-10 visible opacity-100' }
                },
                paginator: {
                  root: { className: 'flex items-center justify-center my-4 px-4' },
                  pageButton: { className: 'w-9 h-9 mx-1 rounded-full flex items-center justify-center transition-colors border border-transparent hover:border-blue-200 hover:bg-blue-50' },
                  currentPageButton: { className: 'w-9 h-9 mx-1 rounded-full flex items-center justify-center transition-colors font-medium bg-blue-500 text-white border border-blue-500' },
                  prevPageButton: { className: 'w-9 h-9 mx-1 rounded-full flex items-center justify-center transition-colors text-gray-600 border border-transparent hover:border-blue-200 hover:bg-blue-50' },
                  nextPageButton: { className: 'w-9 h-9 mx-1 rounded-full flex items-center justify-center transition-colors text-gray-600 border border-transparent hover:border-blue-200 hover:bg-blue-50' },
                  pages: { className: 'flex items-center' },
                  dropdown: { root: { className: 'border border-gray-300 rounded-lg mx-2 text-sm' } }
                }
              }}
              rowHover
            >
              <Column 
                selectionMode="multiple" 
                frozen 
                pt={{
                  headerCheckbox: { 
                    className: 'w-6 h-6 border-2 border-gray-400 rounded-md cursor-pointer hover:border-blue-500 focus:border-blue-500 transition-colors relative' 
                  },
                  bodyCheckbox: { 
                    className: 'w-6 h-6 border-2 border-gray-400 rounded-md cursor-pointer hover:border-blue-500 focus:border-blue-500 transition-colors relative' 
                  }
                }}
                headerStyle={{ 
                  width: '5rem', 
                  paddingLeft: '1.5rem',
                  backgroundColor: '#f8fafc'
                }}
                bodyStyle={{ 
                  borderTopLeftRadius: '0.5rem', 
                  borderBottomLeftRadius: '0.5rem',
                  paddingLeft: '1.5rem',
                  backgroundColor: '#f8fafc'
                }}
              />
              <Column 
                header="Mã Đơn hàng" 
                body={(rowData) => (
                  <div className="font-medium text-blue-600">
                    #{rowData._id.slice(-6).toUpperCase()}
                  </div>
                )}
                style={{ width: '10%', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}
              />
              <Column 
                header="Khách hàng" 
                body={(rowData) => (
                  <div>
                    <div className="font-medium text-gray-900">{getCustomerName(rowData)}</div>
                    {rowData.userId?.email && (
                      <div className="text-xs text-gray-500 mt-1">
                        {rowData.userId.email}
                      </div>
                    )}
                    {rowData.shippingInfo?.phone && (
                      <div className="text-xs text-gray-500 mt-1">
                        SĐT: {rowData.shippingInfo.phone}
                      </div>
                    )}
                  </div>
                )}
                style={{ width: '20%', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}
              />
              <Column 
                header="Sản phẩm" 
                body={(rowData) => (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {rowData.products?.length || 0} sản phẩm
                  </span>
                )}
                style={{ width: '10%', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}
              />
              <Column 
                header="Tổng tiền" 
                body={(rowData) => (
                  <div className="font-medium text-gray-900">
                    {formatCurrency(rowData.totalAmount || 0)}
                  </div>
                )}
                style={{ width: '15%', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}
              />
              <Column 
                header="Ngày đặt" 
                body={(rowData) => (
                  <div className="text-sm text-gray-600">
                    {formatDate(rowData.createdAt)}
                  </div>
                )}
                style={{ width: '15%', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}
              />
              <Column 
                header="Trạng thái" 
                body={(rowData) => (
                  <div className="flex flex-col gap-1.5">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(
                        rowData.status
                      )}`}
                    >
                      {getStatusIcon(rowData.status)}
                      {getStatusText(rowData.status)}
                    </span>
                    {rowData.isPaid && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border text-green-600 bg-green-100 border-green-200">
                        <CheckIcon size={16} className="mr-1" />
                        Đã thanh toán
                      </span>
                    )}
                  </div>
                )}
                style={{ width: '15%', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}
              />
              <Column 
                header="Thao tác" 
                body={(rowData) => (
                  <div className="flex justify-end space-x-2">
                    <Button
                      icon={<EyeIcon size={18} />}
                      rounded
                      text
                      severity="info"
                      onClick={() => handleViewOrder(rowData)}
                      tooltip="Xem chi tiết"
                      tooltipOptions={{ position: 'top' }}
                      className="w-9 h-9 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all"
                      pt={{ 
                        root: { className: 'flex items-center justify-center' },
                        icon: { className: 'text-blue-600' } 
                      }}
                    />
                    
                    {/* Thêm nút cập nhật trạng thái */}
                    {rowData.status !== ORDER_STATUSES.COMPLETED && rowData.status !== ORDER_STATUSES.CANCELLED && (
                      <Button
                        icon={<i className="pi pi-arrow-right-arrow-left" style={{ fontSize: '1rem' }}></i>}
                        rounded
                        text
                        severity="warning"
                        onClick={() => openUpdateStatusDialog(rowData)}
                        tooltip="Cập nhật trạng thái"
                        tooltipOptions={{ position: 'top' }}
                        className="w-9 h-9 hover:bg-yellow-50 border border-transparent hover:border-yellow-200 transition-all"
                        pt={{ 
                          root: { className: 'flex items-center justify-center' },
                          icon: { className: 'text-yellow-600' } 
                        }}
                      />
                    )}
                    
                    {/* Nút đánh dấu thanh toán */}
                    {rowData.paymentMethod && 
                     (rowData.paymentMethod.toLowerCase() === "cod" || rowData.paymentMethod.toUpperCase() === "COD") && 
                     rowData.status === ORDER_STATUSES.PENDING && 
                     !rowData.isPaid && (
                      <Button
                        icon={<i className="pi pi-check-circle" style={{ fontSize: '1rem' }}></i>}
                        rounded
                        text
                        severity="success"
                        onClick={() => confirmMarkAsPaid(rowData._id)}
                        tooltip="Đánh dấu đã thanh toán"
                        tooltipOptions={{ position: 'top' }}
                        className="w-9 h-9 hover:bg-green-50 border border-transparent hover:border-green-200 transition-all"
                        pt={{ 
                          root: { className: 'flex items-center justify-center' },
                          icon: { className: 'text-green-600' } 
                        }}
                      />
                    )}
                    
                    <Button
                      icon={<Trash2Icon size={18} />}
                      rounded
                      text
                      severity="danger"
                      onClick={() => confirmDeleteOrder(rowData._id)}
                      tooltip="Xóa đơn hàng"
                      tooltipOptions={{ position: 'top' }}
                      className="w-9 h-9 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                      pt={{ 
                        root: { className: 'flex items-center justify-center' },
                        icon: { className: 'text-red-600' } 
                      }}
                    />
                  </div>
                )}
                align="center"
                style={{ width: '15%' }}
                headerStyle={{ paddingRight: '1.5rem' }}
                bodyStyle={{ 
                  borderTopRightRadius: '0.5rem', 
                  borderBottomRightRadius: '0.5rem',
                  paddingRight: '1.5rem'
                }}
              />
            </DataTable>
          </div>

          {/* External pagination */}
          <div className="mt-4">
            <Pagination
              totalRecords={filteredOrders.length}
              rowsPerPageOptions={[10,25,50]}
              onPageChange={({ page, rows }) => {
                setFirst((page - 1) * rows);
                setRowsPerPage(rows);
              }}
            />
          </div>

          <div className="p-5 bg-gradient-to-r from-gray-50 to-white rounded-b-xl border-t border-gray-100 mt-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div className="text-sm text-gray-600 mb-2 sm:mb-0">
                Hiển thị <span className="font-medium text-blue-600">{Math.min(filteredOrders.length, 50)}</span> trong tổng số <span className="font-medium text-blue-600">{filteredOrders.length}</span> đơn hàng
                {filteredOrders.length > 50 && (
                  <span className="ml-2 text-gray-500">(Hiển thị tối đa 50 đơn hàng để tối ưu hiệu suất)</span>
                )}
              </div>
              <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                <i className="pi pi-clock mr-1 text-gray-400"></i>
                Cập nhật lần cuối: {new Date(lastRefreshTime).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </Card>
        
        {/* Dialog xem chi tiết đơn hàng */}
        <Dialog 
          header={
            viewOrder && (
              <div className="flex items-center">
                <i className="pi pi-shopping-bag text-blue-500 mr-3" style={{ fontSize: '1.5rem' }}></i>
                <span>Chi tiết đơn hàng #{viewOrder?._id?.slice(-6).toUpperCase()}</span>
              </div>
            )
          }
          visible={viewOrder !== null} 
          onHide={() => setViewOrder(null)}
          style={{ width: '75vw', maxWidth: '1200px' }}
          breakpoints={{ '960px': '90vw', '640px': '95vw' }}
          contentClassName="p-0"
          pt={{
            root: { className: 'rounded-xl border border-gray-200 shadow-2xl' },
            header: { className: 'p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-t-xl' },
            headerTitle: { className: 'text-xl font-bold text-gray-800' },
            closeButton: { className: 'p-2.5 hover:bg-gray-100 rounded-full transition-colors' },
            content: { className: 'p-0' }
          }}
        >
          {viewOrder && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                    <i className="pi pi-user mr-2 text-blue-500"></i>
                    Thông tin khách hàng
                  </h3>
                  <Card 
                    className="shadow-md p-6 border border-gray-100 rounded-xl bg-white hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-blue-50"
                    pt={{ 
                      root: { className: 'overflow-hidden' },
                      content: { className: 'p-0' }
                    }}>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start">
                        <div className="w-1/3 text-gray-500 text-sm">Tên khách hàng:</div>
                        <div className="w-2/3 font-medium text-gray-800">{getCustomerName(viewOrder)}</div>
                      </div>
                    {viewOrder.userId?.email && (
                        <div className="flex items-start">
                          <div className="w-1/3 text-gray-500 text-sm">Email:</div>
                          <div className="w-2/3 font-medium text-gray-800">{viewOrder.userId.email}</div>
                        </div>
                    )}
                    {viewOrder.shippingInfo?.phone && (
                        <div className="flex items-start">
                          <div className="w-1/3 text-gray-500 text-sm">Số điện thoại:</div>
                          <div className="w-2/3 font-medium text-gray-800">{viewOrder.shippingInfo.phone}</div>
                        </div>
                    )}
                    {viewOrder.shippingInfo?.address && (
                        <div className="flex items-start">
                          <div className="w-1/3 text-gray-500 text-sm">Địa chỉ:</div>
                          <div className="w-2/3 font-medium text-gray-800">{viewOrder.shippingInfo.address}</div>
                        </div>
                    )}
                    </div>
                  </Card>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                    <i className="pi pi-info-circle mr-2 text-blue-500"></i>
                    Thông tin đơn hàng
                  </h3>
                  <Card 
                    className="shadow-md p-6 border border-gray-100 rounded-xl bg-white hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-blue-50"
                    pt={{ 
                      root: { className: 'overflow-hidden' },
                      content: { className: 'p-0' }
                    }}>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start">
                        <div className="w-1/3 text-gray-500 text-sm">Mã đơn hàng:</div>
                        <div className="w-2/3 font-medium text-blue-600">#{viewOrder._id.slice(-6).toUpperCase()}</div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-1/3 text-gray-500 text-sm">Ngày đặt:</div>
                        <div className="w-2/3 font-medium text-gray-800">{formatDate(viewOrder.createdAt)}</div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-1/3 text-gray-500 text-sm">Trạng thái:</div>
                        <div className="w-2/3">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(viewOrder.status)}`}>
                        {getStatusIcon(viewOrder.status)}
                        {getStatusText(viewOrder.status)}
                      </span>
                        </div>
                      </div>
                    
                    {/* Hiển thị các trạng thái tiếp theo có thể chuyển đến */}
                    {viewOrder.status !== ORDER_STATUSES.COMPLETED && 
                     viewOrder.status !== ORDER_STATUSES.CANCELLED && (
                        <div className="flex items-start">
                          <div className="w-1/3 text-gray-500 text-sm">Trạng thái tiếp theo:</div>
                          <div className="w-2/3">
                        <div className="space-y-2">
                          {getNextStatuses(viewOrder.status, viewOrder.isPaid).map((status) => (
                            <div key={status.value} className="flex items-start p-2 bg-gray-50 rounded-lg border border-gray-100">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  {getStatusIcon(status.value)}
                                  <span className="ml-1 font-medium text-sm">{status.label}</span>
                                </div>
                                <StatusTransitionInfo 
                                  currentStatus={viewOrder.status} 
                                  nextStatus={status.value} 
                                />
                              </div>
                            </div>
                          ))}
                            </div>
                        </div>
                      </div>
                    )}
                    
                      <div className="flex items-start">
                        <div className="w-1/3 text-gray-500 text-sm">Thanh toán:</div>
                        <div className="w-2/3">
                      {viewOrder.isPaid ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border text-green-600 bg-green-100 border-green-200">
                          <CheckIcon size={16} className="mr-1" />
                          Đã thanh toán
                        </span>
                      ) : (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border text-orange-600 bg-orange-100 border-orange-200">
                          <i className="pi pi-clock mr-1" style={{ fontSize: '0.9rem' }}></i>
                          Chưa thanh toán
                        </span>
                      )}
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-1/3 text-gray-500 text-sm">Phương thức thanh toán:</div>
                        <div className="w-2/3 font-medium text-gray-800">{getPaymentMethodText(viewOrder.paymentMethod)}</div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-1/3 text-gray-500 text-sm">Ghi chú:</div>
                        <div className="w-2/3 font-medium text-gray-800">{viewOrder.note || "Không có"}</div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                <i className="pi pi-shopping-cart mr-2 text-blue-500"></i>
                Sản phẩm đã đặt
              </h3>
              <Card 
                className="shadow-md mb-8 p-0 border border-gray-100 rounded-xl overflow-hidden bg-gradient-to-br from-white to-gray-50"
                pt={{ 
                  root: { className: 'overflow-hidden' },
                  content: { className: 'p-0' }
                }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-700">Tên sản phẩm</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-700">Đơn giá</th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-700">Số lượng</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-700">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewOrder.products && viewOrder.products.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {item.productId?.productImages && item.productId.productImages[0] && (
                                <img 
                                  src={item.productId.productImages[0]} 
                                  alt={item.productId.productName} 
                                  className="w-16 h-16 object-cover rounded-lg mr-4 border border-gray-200 shadow-sm"
                                  loading="lazy"
                                />
                              )}
                              <div>
                                <p className="font-medium text-gray-900">{item.productId?.productName || "Sản phẩm không có sẵn"}</p>
                                {item.productId?.productCode && (
                                  <p className="text-xs text-gray-500 mt-1">Mã: {item.productId.productCode}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(item.price)}</td>
                          <td className="px-6 py-4 text-center text-gray-900">{item.quantity}</td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-right font-medium text-gray-800">Tổng cộng:</td>
                        <td className="px-6 py-4 text-right font-bold text-lg text-blue-600">{formatCurrency(viewOrder.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
              
              <div className="flex justify-end gap-3">
                {viewOrder.status !== ORDER_STATUSES.COMPLETED && viewOrder.status !== ORDER_STATUSES.CANCELLED && (
                  <Button 
                    label="Cập nhật trạng thái" 
                    icon="pi pi-arrow-right-arrow-left"
                    onClick={() => {
                      setViewOrder(null);
                      setTimeout(() => openUpdateStatusDialog(viewOrder), 100);
                    }} 
                    className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-medium rounded-lg transition-all shadow-md flex items-center gap-2"
                  />
                )}
                <Button 
                  label="Đóng" 
                  icon="pi pi-times" 
                  onClick={() => setViewOrder(null)} 
                  className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium rounded-lg transition-colors flex items-center gap-2"
                />
              </div>
            </div>
          )}
        </Dialog>
        
        {/* Dialog xác nhận xóa */}
        <Dialog
          header={
            <div className="flex items-center text-red-600">
              <i className="pi pi-trash mr-2" style={{ fontSize: '1.5rem' }}></i>
              <span>Xác nhận xóa</span>
            </div>
          }
          visible={deleteDialog}
          style={{ width: '450px' }}
          modal
          footer={
            <div className="pt-3 flex justify-end gap-3 p-4">
              <Button 
                label="Không" 
                icon="pi pi-times" 
                onClick={() => setDeleteDialog(false)} 
                className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium rounded-lg transition-colors" 
              />
              <Button 
                label="Có, xóa đơn hàng" 
                icon="pi pi-trash" 
                onClick={handleDeleteOrder} 
                autoFocus 
                className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-md" 
              />
            </div>
          }
          onHide={() => setDeleteDialog(false)}
          contentClassName="p-5"
          pt={{
            root: { className: 'rounded-xl border border-gray-200 shadow-xl' },
            header: { className: 'p-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white rounded-t-xl' },
            closeButton: { className: 'p-2 hover:bg-red-50 rounded-full transition-colors' },
            content: { className: 'p-5' }
          }}
        >
          <div className="flex flex-col items-center justify-center p-5">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '2rem' }} />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-3">Xóa đơn hàng</h3>
            <p className="text-gray-600 text-center">Bạn có chắc chắn muốn xóa đơn hàng này? Hành động này không thể hoàn tác.</p>
          </div>
        </Dialog>
        
        {/* Dialog cập nhật trạng thái đơn hàng */}
        <Dialog
          header={
            <div className="flex items-center">
              <i className="pi pi-sync text-blue-500 mr-2" style={{ fontSize: '1.5rem' }}></i>
              <span>Cập nhật trạng thái đơn hàng</span>
            </div>
          }
          visible={statusDialog}
          style={{ width: '550px' }}
          modal
          onHide={() => {
            setStatusDialog(false);
            setSelectedOrderForStatus(null);
          }}
          contentClassName="p-0"
          pt={{
            root: { className: 'rounded-xl border border-gray-200 shadow-xl' },
            header: { className: 'p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white rounded-t-xl' },
            closeButton: { className: 'p-2 hover:bg-blue-50 rounded-full transition-colors' },
            content: { className: 'p-0' }
          }}
        >
          {selectedOrderForStatus && (
            <div className="flex flex-col">
              <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <i className="pi pi-sync text-blue-500" style={{ fontSize: '2rem' }} />
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">Đơn hàng #{selectedOrderForStatus._id.slice(-6).toUpperCase()}</h3>
                <p className="text-gray-600 mb-3">Trạng thái hiện tại:</p>
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(selectedOrderForStatus.status)}`}>
                  {getStatusIcon(selectedOrderForStatus.status)}
                  {getStatusText(selectedOrderForStatus.status)}
                </span>
              </div>
              
              <div className="p-5">
                <p className="font-medium text-gray-700 mb-4">Chọn trạng thái mới:</p>
                <div className="grid grid-cols-1 gap-3">
                  {getNextStatuses(selectedOrderForStatus.status, selectedOrderForStatus.isPaid).map((statusOption) => (
                    <button
                      key={statusOption.value}
                      className={`flex flex-col items-start justify-between p-4 rounded-xl border transition-all transform hover:-translate-y-1 hover:shadow-md ${
                        selectedStatus === statusOption.value ? 'ring-2 ring-blue-400 ring-offset-2 ' : ''
                      }${
                        statusOption.value === ORDER_STATUSES.CANCELLED
                          ? 'bg-red-50 hover:bg-red-100 border-red-200'
                          : 'bg-white hover:bg-blue-50 border-gray-200'
                      }`}
                      onClick={() => {
                        setSelectedStatus(statusOption.value);
                        updateOrderStatus(selectedOrderForStatus._id, statusOption.value);
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full mr-3 ${
                            statusOption.value === ORDER_STATUSES.CANCELLED
                              ? 'bg-red-100 text-red-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {getStatusIcon(statusOption.value) || <i className="pi pi-arrow-right"></i>}
                          </span>
                          <span className="font-medium">{statusOption.label}</span>
                        </div>
                        <i className="pi pi-arrow-right text-gray-400"></i>
                      </div>
                      <div className="mt-2 ml-13">
                        <StatusTransitionInfo 
                          currentStatus={selectedOrderForStatus.status} 
                          nextStatus={statusOption.value} 
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 p-5 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
                <Button 
                  label="Đóng" 
                  icon="pi pi-times" 
                  onClick={() => {
                    setStatusDialog(false);
                    setSelectedOrderForStatus(null);
                  }}
                  className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium rounded-lg transition-colors" 
                />
              </div>
            </div>
          )}
        </Dialog>
        
        {/* Dialog xác nhận đánh dấu đã thanh toán */}
        <Dialog
          header={
            <div className="flex items-center">
              <i className="pi pi-check-circle text-green-500 mr-2" style={{ fontSize: '1.5rem' }}></i>
              <span>Xác nhận thanh toán</span>
            </div>
          }
          visible={paymentDialog}
          style={{ width: '500px' }}
          modal
          footer={
            <div className="pt-3 flex justify-end gap-3 p-4">
              <Button 
                label="Hủy" 
                icon="pi pi-times" 
                onClick={() => setPaymentDialog(false)} 
                className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium rounded-lg transition-colors" 
              />
              <Button 
                label="Xác nhận đã thanh toán" 
                icon="pi pi-check" 
                onClick={handleMarkAsPaid} 
                autoFocus 
                className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-md" 
              />
            </div>
          }
          onHide={() => setPaymentDialog(false)}
          contentClassName="p-5"
          pt={{
            root: { className: 'rounded-xl border border-gray-200 shadow-xl' },
            header: { className: 'p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white rounded-t-xl' },
            closeButton: { className: 'p-2 hover:bg-green-50 rounded-full transition-colors' },
            content: { className: 'p-5' }
          }}
        >
          <div className="flex flex-col items-center justify-center p-5">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <i className="pi pi-check-circle text-green-500" style={{ fontSize: '2rem' }} />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-3">Xác nhận đã thanh toán và giao hàng</h3>
            <p className="text-gray-600 text-center">
              Khi xác nhận, đơn hàng sẽ được đánh dấu là <span className="font-semibold text-green-600">đã thanh toán</span> và chuyển trạng thái thành <span className="font-semibold text-green-600">Giao hàng thành công</span>. Bạn có chắc chắn không?
            </p>
          </div>
        </Dialog>
        
        {/* Dialog xác nhận cập nhật hàng loạt */}
        <Dialog
          header={
            <div className="flex items-center">
              <i className="pi pi-cog text-blue-500 mr-2" style={{ fontSize: '1.5rem' }}></i>
              <span>Cập nhật hàng loạt</span>
            </div>
          }
          visible={bulkConfirmVisible}
          style={{ width: '550px' }}
          modal
          onHide={() => setBulkConfirmVisible(false)}
          footer={
            <div className="pt-3 flex justify-end gap-3 p-4">
              <Button 
                label="Hủy" 
                icon="pi pi-times" 
                onClick={() => setBulkConfirmVisible(false)} 
                className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium rounded-lg transition-colors" 
              />
              <Button 
                label="Xác nhận cập nhật" 
                icon="pi pi-check" 
                onClick={executeBulkUpdate} 
                autoFocus 
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-md" 
              />
            </div>
          }
          contentClassName="p-0"
          pt={{
            root: { className: 'rounded-xl border border-gray-200 shadow-xl' },
            header: { className: 'p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white rounded-t-xl' },
            closeButton: { className: 'p-2 hover:bg-blue-50 rounded-full transition-colors' },
            content: { className: 'p-0' }
          }}
        >
          <div className="flex flex-col">
            <div className="p-5 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <i className="pi pi-cog text-blue-500" style={{ fontSize: '2rem' }} />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-3">Xác nhận cập nhật hàng loạt</h3>
            <p className="text-gray-600 text-center mb-4">
              Bạn có chắc chắn muốn cập nhật <span className="font-semibold text-blue-600">{selectedOrders.length}</span> đơn hàng sang trạng thái 
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border mx-2 bg-blue-100 text-blue-700 border-blue-200">
                    {bulkActionOptions.find(op => op.value === bulkStatus)?.label || bulkStatus}
                  </span>?
            </p>
              </div>
            
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 w-full mb-5">
              <div className="flex items-start">
                <i className="pi pi-info-circle text-yellow-500 mr-3 mt-0.5" style={{ fontSize: '1.2rem' }} />
                <div>
                  <h4 className="font-medium text-yellow-700 mb-1">Lưu ý quan trọng</h4>
                  <p className="text-sm text-yellow-600">
                    Hành động này sẽ thay đổi trạng thái của nhiều đơn hàng cùng lúc và có thể ảnh hưởng đến thông báo cho khách hàng.
                  </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-100">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <p className="font-medium text-gray-700">Các đơn hàng được chọn ({selectedOrders.length})</p>
              </div>
              <div className="max-h-48 overflow-y-auto p-5 bg-white">
                <ul className="text-sm space-y-2">
                  {selectedOrders.slice(0, 5).map((order, index) => (
                    <li key={index} className="py-2 px-3 flex items-center bg-gray-50 rounded-lg">
                      <i className="pi pi-circle-fill text-blue-500 mr-2" style={{ fontSize: '0.5rem' }} />
                      <span className="font-medium text-blue-600">#{order._id.slice(-6).toUpperCase()}</span>
                      <span className="mx-2 text-gray-400">-</span>
                      <span className="text-gray-600 truncate">{getCustomerName(order)}</span>
                      <span className={`ml-auto inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </li>
                  ))}
                  {selectedOrders.length > 5 && (
                    <li className="py-2 px-3 text-gray-500 italic bg-gray-50 rounded-lg text-center">
                      ...và {selectedOrders.length - 5} đơn hàng khác
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </Dialog>
      </div>
    );
  } catch (error) {
    console.error("Error in OrderAdmin component:", error);
    // Trả về UI lỗi đơn giản khi có vấn đề với hooks
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '2rem' }} />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi: Không thể tải trang quản lý đơn hàng</h2>
          <p className="mb-4 text-gray-600">Đã xảy ra lỗi khi tải component quản lý đơn hàng.</p>
          <p className="text-sm text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg">{error.message}</p>
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
};

// Sử dụng memo cho OrderAdmin ở đây thay vì trong export
const MemoizedOrderAdmin = memo(OrderAdmin);

// Export component thông thường
export default MemoizedOrderAdmin;