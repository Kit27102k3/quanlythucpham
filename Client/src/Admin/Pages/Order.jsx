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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-5 mb-8">
      <Card className="shadow-lg bg-white p-5 border border-gray-100 rounded-lg hover:shadow-xl transition-all"
        pt={{ 
          root: { className: 'overflow-hidden' },
          content: { className: 'p-0' }
        }}>
        <div className="flex items-center">
          <div className="p-3.5 bg-blue-100 rounded-xl">
            <PackageIcon size={28} className="text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-md font-semibold text-gray-700">Tất cả</h3>
            <p className="text-xl font-bold text-blue-600">{stats.total}</p>
          </div>
        </div>
      </Card>
      
      <Card className="shadow-lg bg-white p-5 border border-gray-100 rounded-lg hover:shadow-xl transition-all"
        pt={{ 
          root: { className: 'overflow-hidden' },
          content: { className: 'p-0' }
        }}>
        <div className="flex items-center">
          <div className="p-3.5 bg-yellow-100 rounded-xl">
            <ClockIcon size={28} className="text-yellow-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-md font-semibold text-gray-700">Chờ xử lý</h3>
            <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
        </div>
      </Card>
      
      <Card className="shadow-lg bg-white p-5 border border-gray-100 rounded-lg hover:shadow-xl transition-all"
        pt={{ 
          root: { className: 'overflow-hidden' },
          content: { className: 'p-0' }
        }}>
        <div className="flex items-center">
          <div className="p-3.5 bg-indigo-100 rounded-xl">
            <i className="pi pi-box text-indigo-600" style={{ fontSize: '1.5rem' }}></i>
          </div>
          <div className="ml-4">
            <h3 className="text-md font-semibold text-gray-700">Chuẩn bị</h3>
            <p className="text-xl font-bold text-indigo-600">{stats.preparing}</p>
          </div>
        </div>
      </Card>
      
      <Card className="shadow-lg bg-white p-5 border border-gray-100 rounded-lg hover:shadow-xl transition-all"
        pt={{ 
          root: { className: 'overflow-hidden' },
          content: { className: 'p-0' }
        }}>
        <div className="flex items-center">
          <div className="p-3.5 bg-purple-100 rounded-xl">
            <i className="pi pi-gift text-purple-600" style={{ fontSize: '1.5rem' }}></i>
          </div>
          <div className="ml-4">
            <h3 className="text-md font-semibold text-gray-700">Đóng gói</h3>
            <p className="text-xl font-bold text-purple-600">{stats.packaging}</p>
          </div>
        </div>
      </Card>
      
      <Card className="shadow-lg bg-white p-5 border border-gray-100 rounded-lg hover:shadow-xl transition-all"
        pt={{ 
          root: { className: 'overflow-hidden' },
          content: { className: 'p-0' }
        }}>
        <div className="flex items-center">
          <div className="p-3.5 bg-cyan-100 rounded-xl">
            <i className="pi pi-truck text-cyan-600" style={{ fontSize: '1.5rem' }}></i>
          </div>
          <div className="ml-4">
            <h3 className="text-md font-semibold text-gray-700">Đang giao</h3>
            <p className="text-xl font-bold text-cyan-600">{stats.delivering}</p>
          </div>
        </div>
      </Card>
      
      <Card className="shadow-lg bg-white p-5 border border-gray-100 rounded-lg hover:shadow-xl transition-all"
        pt={{ 
          root: { className: 'overflow-hidden' },
          content: { className: 'p-0' }
        }}>
        <div className="flex items-center">
          <div className="p-3.5 bg-green-100 rounded-xl">
            <CheckIcon size={28} className="text-green-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-md font-semibold text-gray-700">Hoàn thành</h3>
            <p className="text-xl font-bold text-green-600">{stats.completed}</p>
          </div>
        </div>
      </Card>
      
      <Card className="shadow-lg bg-white p-5 border border-gray-100 rounded-lg hover:shadow-xl transition-all"
        pt={{ 
          root: { className: 'overflow-hidden' },
          content: { className: 'p-0' }
        }}>
        <div className="flex items-center">
          <div className="p-3.5 bg-red-100 rounded-xl">
            <XIcon size={28} className="text-red-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-md font-semibold text-gray-700">Đã hủy</h3>
            <p className="text-xl font-bold text-red-600">{stats.cancelled}</p>
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

// Status Transition Info component để hiển thị chi tiết về điều kiện chuyển đổi
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
      return { type: 'manual', message: 'Chuyển đổi thủ công' };
    }
    
    // Dựa vào loại điều kiện để hiển thị thông tin phù hợp
    switch (transition.condition) {
      case 'auto':
        return {
          type: 'auto',
          message: 'Tự động sau khi xử lý',
          icon: <ClockIcon size={14} className="mr-1" />
        };
      case 'trigger':
        return {
          type: 'trigger',
          message: `Khi có sự kiện "${transition.event}"`,
          icon: <ArrowRightIcon size={14} className="mr-1" />
        };
      case 'manual_approval':
        return {
          type: 'manual',
          message: 'Cần xác nhận thủ công',
          icon: <InfoIcon size={14} className="mr-1" />
        };
      default:
        return {
          type: 'unknown',
          message: 'Không xác định',
          icon: <InfoIcon size={14} className="mr-1" />
        };
    }
  };
  
  const transitionDetails = getTransitionDetails();
  
  return (
    <div className={`
      text-xs flex items-center px-2 py-1 rounded-full mt-1
      ${transitionDetails.type === 'auto' ? 'bg-green-50 text-green-700' : ''}
      ${transitionDetails.type === 'trigger' ? 'bg-blue-50 text-blue-700' : ''}
      ${transitionDetails.type === 'manual' ? 'bg-orange-50 text-orange-700' : ''}
      ${transitionDetails.type === 'unknown' ? 'bg-gray-50 text-gray-700' : ''}
    `}>
      {transitionDetails.icon}
      {transitionDetails.message}
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
          
          setStatusDialog(false);
          setSelectedOrderForStatus(null);
        } else {
          console.error("Lỗi khi cập nhật trạng thái đơn hàng");
        }
      } catch (error) {
        console.error("Lỗi khi gọi API cập nhật trạng thái:", error);
      }
    }, [ORDER_STATUSES.COMPLETED, calculateOrderStats]);

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

    // Loading indicator
    if (loading && orders.length === 0) {
      return (
        <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-xl font-medium text-gray-700">Đang tải đơn hàng...</div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 md:p-5 bg-gray-50 min-h-screen">
        <Toaster />
        <ConfirmDialog />
        
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Quản lý Đơn hàng</h1>
        
        {/* Thêm nút refresh thủ công */}
        <div className="flex justify-end mb-6">
          <Button
            icon={<SettingsIcon size={18} className="mr-2" />}
            label="Cài đặt chuyển đổi tự động"
            onClick={() => setAutoTransitionConfigVisible(true)}
            className="px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium rounded-lg shadow-sm hover:shadow transition-all flex items-center mr-3"
            tooltip="Cấu hình tự động chuyển đổi trạng thái đơn hàng"
            tooltipOptions={{ position: 'left' }}
          />
          <Button
            icon={<RefreshCcwIcon size={18} className="mr-2" />}
            label="Làm mới dữ liệu"
            onClick={() => fetchOrders(false, true)}
            className="px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium rounded-lg shadow-sm hover:shadow transition-all flex items-center"
            tooltip="Cập nhật dữ liệu đơn hàng"
            tooltipOptions={{ position: 'left' }}
            loading={loading}
            loadingIcon="pi pi-spin pi-spinner"
          />
        </div>
        
        {/* Thống kê đơn hàng */}
        <OrderStats stats={orderStats} />

        <Card 
          className="shadow-md mb-8 p-0 border border-gray-200 rounded-lg overflow-hidden"
          pt={{ 
            root: { className: 'overflow-hidden' },
            content: { className: 'p-0' }
          }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 p-5 border-b border-gray-100 bg-white">
            <div className="relative w-full md:w-64 flex items-center">
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn hoặc tên khách..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-3 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:border-gray-300 transition-all bg-gray-50 hover:bg-white"
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
                root: { className: 'w-full border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 transition-all bg-gray-50 hover:bg-white' },
                input: { className: 'p-3 flex items-center' },
                trigger: { className: 'p-3' },
                panel: { className: 'border border-gray-200 shadow-md rounded-lg mt-1' },
                item: { className: 'p-3 hover:bg-gray-50' },
                itemgroup: { className: 'p-3 font-medium text-gray-700 bg-gray-50 border-b border-gray-200' }
              }}
            />
          </div>

          {loading && orders.length > 0 && (
            <div className="absolute top-0 left-0 w-full h-1">
              <div className="h-full bg-blue-500 animate-pulse"></div>
            </div>
          )}

          {/* Bulk Update Controls */}
          {selectedOrders.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center p-5 bg-blue-50 border-y border-blue-100">
              <div className="flex items-center">
                <span className="text-sm font-medium text-blue-700">
                  Đã chọn {selectedOrders.length} đơn hàng
                </span>
              </div>
              <div className="flex items-center gap-3 mt-3 sm:mt-0">
                <Dropdown
                  value={bulkStatus}
                  options={bulkActionOptions}
                  onChange={(e) => setBulkStatus(e.value)}
                  placeholder="Chọn trạng thái mới"
                  className="w-48 h-10"
                  disabled={selectedOrders.length === 0}
                  pt={{
                    root: { className: 'border border-gray-300 rounded-md' },
                    panel: { className: 'border border-gray-200 shadow-md rounded-md mt-1' }
                  }}
                />
                <Button
                  label="Cập nhật"
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

          <div className="overflow-x-auto p-4 bg-gray-50">
            <DataTable
              value={filteredOrders.slice(0, 50)}
              selection={selectedOrders}
              onSelectionChange={(e) => setSelectedOrders(e.value)}
              dataKey="_id"
              paginator={filteredOrders.length > 10}
              rows={10}
              rowsPerPageOptions={[10, 25, 50]}
              tableStyle={{ minWidth: '960px', borderCollapse: 'separate', borderSpacing: '0 0.8rem' }}
              emptyMessage="Không có đơn hàng nào phù hợp"
              loading={loading && orders.length === 0}
              selectionMode="checkbox"
              resizableColumns
              columnResizeMode="fit"
              rowClassName="bg-white rounded-lg shadow hover:shadow-md transition-all"
              pt={{
                wrapper: { className: 'border-none' },
                table: { className: '' },
                thead: { className: 'bg-gray-100 rounded-lg' },
                headerRow: { className: 'text-gray-700 text-sm font-semibold' },
                headerCell: { className: 'p-5 first:rounded-l-lg last:rounded-r-lg bg-white border-b border-gray-200' },
                bodyRow: { className: 'bg-white rounded-lg mb-3 h-20' },
                bodyCell: { className: 'p-5 border-0' }
              }}
              rowHover
            >
              <Column 
                selectionMode="multiple" 
                frozen 
                pt={{
                  headerCheckbox: { className: 'border border-gray-300 rounded-md' },
                  bodyCheckbox: { className: 'border border-gray-300 rounded-md' }
                }}
                headerStyle={{ 
                  width: '3rem', 
                  paddingLeft: '1.5rem' 
                }}
                bodyStyle={{ 
                  borderTopLeftRadius: '0.5rem', 
                  borderBottomLeftRadius: '0.5rem',
                  paddingLeft: '1.5rem'
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

          <div className="p-5 bg-white rounded-b-lg border-t border-gray-100 mt-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div className="text-sm text-gray-600 mb-2 sm:mb-0">
                Hiển thị <span className="font-medium text-blue-600">{Math.min(filteredOrders.length, 50)}</span> trong tổng số <span className="font-medium text-blue-600">{filteredOrders.length}</span> đơn hàng
                {filteredOrders.length > 50 && (
                  <span className="ml-2 text-gray-500">(Hiển thị tối đa 50 đơn hàng để tối ưu hiệu suất)</span>
                )}
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <i className="pi pi-clock mr-1 text-gray-400"></i>
                Cập nhật lần cuối: {new Date(lastRefreshTime).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </Card>
        
        {/* Dialog xem chi tiết đơn hàng */}
        <Dialog 
          header="Chi tiết đơn hàng" 
          visible={viewOrder !== null} 
          onHide={() => setViewOrder(null)}
          style={{ width: '70vw' }}
          breakpoints={{ '960px': '80vw', '640px': '90vw' }}
          contentClassName="p-0"
          pt={{
            root: { className: 'rounded-xl border border-gray-200 shadow-xl' },
            header: { className: 'p-6 border-b border-gray-100 bg-gray-50 rounded-t-xl' },
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
                    className="shadow-md p-5 border border-gray-100 rounded-xl bg-white hover:shadow-lg transition-shadow"
                    pt={{ 
                      root: { className: 'overflow-hidden' },
                      content: { className: 'p-0' }
                    }}>
                    <p className="mb-4"><span className="font-medium text-gray-700">Tên khách hàng:</span> <span className="text-gray-900">{getCustomerName(viewOrder)}</span></p>
                    {viewOrder.userId?.email && (
                      <p className="mb-4"><span className="font-medium text-gray-700">Email:</span> <span className="text-gray-900">{viewOrder.userId.email}</span></p>
                    )}
                    {viewOrder.shippingInfo?.phone && (
                      <p className="mb-4"><span className="font-medium text-gray-700">Số điện thoại:</span> <span className="text-gray-900">{viewOrder.shippingInfo.phone}</span></p>
                    )}
                    {viewOrder.shippingInfo?.address && (
                      <p className="mb-0"><span className="font-medium text-gray-700">Địa chỉ:</span> <span className="text-gray-900">{viewOrder.shippingInfo.address}</span></p>
                    )}
                  </Card>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                    <i className="pi pi-info-circle mr-2 text-blue-500"></i>
                    Thông tin đơn hàng
                  </h3>
                  <Card 
                    className="shadow-md p-5 border border-gray-100 rounded-xl bg-white hover:shadow-lg transition-shadow"
                    pt={{ 
                      root: { className: 'overflow-hidden' },
                      content: { className: 'p-0' }
                    }}>
                    <p className="mb-4"><span className="font-medium text-gray-700">Mã đơn hàng:</span> <span className="text-blue-600 font-semibold">#{viewOrder._id.slice(-6).toUpperCase()}</span></p>
                    <p className="mb-4"><span className="font-medium text-gray-700">Ngày đặt:</span> <span className="text-gray-900">{formatDate(viewOrder.createdAt)}</span></p>
                    <p className="mb-4">
                      <span className="font-medium text-gray-700">Trạng thái:</span> 
                      <span className={`inline-flex items-center ml-2 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(viewOrder.status)}`}>
                        {getStatusIcon(viewOrder.status)}
                        {getStatusText(viewOrder.status)}
                      </span>
                    </p>
                    
                    {/* Hiển thị các trạng thái tiếp theo có thể chuyển đến */}
                    {viewOrder.status !== ORDER_STATUSES.COMPLETED && 
                     viewOrder.status !== ORDER_STATUSES.CANCELLED && (
                      <div className="mb-4">
                        <p className="font-medium text-gray-700 mb-2">Trạng thái tiếp theo:</p>
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
                    )}
                    
                    <p className="mb-4">
                      <span className="font-medium text-gray-700">Thanh toán:</span> 
                      {viewOrder.isPaid ? (
                        <span className="inline-flex items-center ml-2 px-3 py-1.5 rounded-full text-xs font-medium border text-green-600 bg-green-100 border-green-200">
                          <CheckIcon size={16} className="mr-1" />
                          Đã thanh toán
                        </span>
                      ) : (
                        <span className="inline-flex items-center ml-2 px-3 py-1.5 rounded-full text-xs font-medium border text-orange-600 bg-orange-100 border-orange-200">
                          <i className="pi pi-clock mr-1" style={{ fontSize: '0.9rem' }}></i>
                          Chưa thanh toán
                        </span>
                      )}
                    </p>
                    <p className="mb-4"><span className="font-medium text-gray-700">Phương thức thanh toán:</span> <span className="text-gray-900">{getPaymentMethodText(viewOrder.paymentMethod)}</span></p>
                    <p className="mb-0"><span className="font-medium text-gray-700">Ghi chú:</span> <span className="text-gray-900">{viewOrder.note || "Không có"}</span></p>
                  </Card>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                <i className="pi pi-shopping-cart mr-2 text-blue-500"></i>
                Sản phẩm đã đặt
              </h3>
              <Card 
                className="shadow-md mb-8 p-0 border border-gray-100 rounded-xl overflow-hidden"
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
                        <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {item.productId?.productImages && item.productId.productImages[0] && (
                                <img 
                                  src={item.productId.productImages[0]} 
                                  alt={item.productId.productName} 
                                  className="w-16 h-16 object-cover rounded-lg mr-4 border border-gray-200"
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
                    className="px-5 py-2.5 bg-yellow-600 text-white hover:bg-yellow-700 font-medium rounded-lg transition-colors flex items-center gap-2"
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
          header="Xác nhận xóa"
          visible={deleteDialog}
          style={{ width: '450px' }}
          modal
          footer={
            <div className="pt-3 flex justify-end gap-3 p-4">
              <Button 
                label="Không" 
                icon="pi pi-times" 
                onClick={() => setDeleteDialog(false)} 
                className="px-4 py-2.5  bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium rounded-lg transition-colors" 
              />
              <Button 
                label="Có" 
                icon="pi pi-trash" 
                onClick={handleDeleteOrder} 
                autoFocus 
                className="px-6 py-2.5 bg-red-600 text-white hover:bg-red-700 font-medium rounded-lg transition-colors flex items-center gap-2" 
              />
            </div>
          }
          onHide={() => setDeleteDialog(false)}
          contentClassName="p-5"
          pt={{
            root: { className: 'rounded-lg border border-gray-200 shadow-lg' },
            header: { className: 'p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg text-lg font-semibold' },
            closeButton: { className: 'p-2 hover:bg-gray-100 rounded-full transition-colors' },
            content: { className: 'p-5' }
          }}
        >
          <div className="flex flex-col items-center justify-center p-3">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '1.75rem' }} />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">Xóa đơn hàng</h3>
            <p className="text-gray-600 text-center">Bạn có chắc chắn muốn xóa đơn hàng này? Hành động này không thể hoàn tác.</p>
          </div>
        </Dialog>
        
        {/* Dialog cập nhật trạng thái đơn hàng */}
        <Dialog
          header="Cập nhật trạng thái đơn hàng"
          visible={statusDialog}
          style={{ width: '500px' }}
          modal
          onHide={() => {
            setStatusDialog(false);
            setSelectedOrderForStatus(null);
          }}
          contentClassName="p-5"
          pt={{
            root: { className: 'rounded-lg border border-gray-200 shadow-lg' },
            header: { className: 'p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg text-lg font-semibold' },
            closeButton: { className: 'p-2 hover:bg-gray-100 rounded-full transition-colors' },
            content: { className: 'p-5' }
          }}
        >
          {selectedOrderForStatus && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <i className="pi pi-sync text-blue-500" style={{ fontSize: '1.5rem' }} />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-1">Đơn hàng #{selectedOrderForStatus._id.slice(-6).toUpperCase()}</h3>
                <p className="text-gray-600 mb-2">Trạng thái hiện tại:</p>
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(selectedOrderForStatus.status)}`}>
                  {getStatusIcon(selectedOrderForStatus.status)}
                  {getStatusText(selectedOrderForStatus.status)}
                </span>
              </div>
              
              <div>
                <p className="font-medium text-gray-700 mb-3">Chọn trạng thái mới:</p>
                <div className="grid grid-cols-1 gap-3">
                  {getNextStatuses(selectedOrderForStatus.status, selectedOrderForStatus.isPaid).map((statusOption) => (
                    <button
                      key={statusOption.value}
                      className={`flex flex-col items-start justify-between p-4 rounded-lg border transition-all ${
                        statusOption.value === ORDER_STATUSES.CANCELLED
                          ? 'bg-red-50 hover:bg-red-100 border-red-200'
                          : 'bg-white hover:bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => updateOrderStatus(selectedOrderForStatus._id, statusOption.value)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
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
                      <div className="mt-2 ml-11">
                        <StatusTransitionInfo 
                          currentStatus={selectedOrderForStatus.status} 
                          nextStatus={statusOption.value} 
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end mt-3">
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
          header="Xác nhận thanh toán"
          visible={paymentDialog}
          style={{ width: '450px' }}
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
                label="Xác nhận" 
                icon="pi pi-check" 
                onClick={handleMarkAsPaid} 
                autoFocus 
                className="px-6 py-2.5 bg-green-600 text-white hover:bg-green-700 font-medium rounded-lg transition-colors flex items-center gap-2" 
              />
            </div>
          }
          onHide={() => setPaymentDialog(false)}
          contentClassName="p-5"
          pt={{
            root: { className: 'rounded-lg border border-gray-200 shadow-lg' },
            header: { className: 'p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg text-lg font-semibold' },
            closeButton: { className: 'p-2 hover:bg-gray-100 rounded-full transition-colors' },
            content: { className: 'p-5' }
          }}
        >
          <div className="flex flex-col items-center justify-center p-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <i className="pi pi-check-circle text-green-500" style={{ fontSize: '1.75rem' }} />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">Xác nhận đã thanh toán và giao hàng</h3>
            <p className="text-gray-600 text-center">
              Khi xác nhận, đơn hàng sẽ được đánh dấu là đã thanh toán và chuyển trạng thái thành &ldquo;Giao hàng thành công&rdquo;. Bạn có chắc chắn không?
            </p>
          </div>
        </Dialog>
        
        {/* Dialog xác nhận cập nhật hàng loạt */}
        <Dialog
          header="Xác nhận cập nhật hàng loạt"
          visible={bulkConfirmVisible}
          style={{ width: '500px' }}
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
                label="Xác nhận" 
                icon="pi pi-check" 
                onClick={executeBulkUpdate} 
                autoFocus 
                className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 font-medium rounded-lg transition-colors flex items-center gap-2" 
              />
            </div>
          }
          contentClassName="p-5"
          pt={{
            root: { className: 'rounded-lg border border-gray-200 shadow-lg' },
            header: { className: 'p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg text-lg font-semibold' },
            closeButton: { className: 'p-2 hover:bg-gray-100 rounded-full transition-colors' },
            content: { className: 'p-5' }
          }}
        >
          <div className="flex flex-col items-center justify-center p-3">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <i className="pi pi-exclamation-circle text-blue-500" style={{ fontSize: '1.75rem' }} />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-3">Xác nhận cập nhật hàng loạt</h3>
            <p className="text-gray-600 text-center mb-4">
              Bạn có chắc chắn muốn cập nhật <span className="font-semibold text-blue-600">{selectedOrders.length}</span> đơn hàng sang trạng thái 
              &quot;<span className="font-semibold text-blue-600">{bulkActionOptions.find(op => op.value === bulkStatus)?.label || bulkStatus}</span>&quot;?
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 w-full mb-3">
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
            
            <div className="w-full border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <p className="font-medium text-gray-700 text-sm">Các đơn hàng được chọn ({selectedOrders.length})</p>
              </div>
              <div className="max-h-36 overflow-y-auto p-3">
                <ul className="text-sm">
                  {selectedOrders.slice(0, 5).map((order, index) => (
                    <li key={index} className="py-1 flex items-center">
                      <i className="pi pi-circle-fill text-blue-500 mr-2" style={{ fontSize: '0.5rem' }} />
                      <span className="font-medium">#{order._id.slice(-6).toUpperCase()}</span>
                      <span className="mx-2 text-gray-400">-</span>
                      <span className="text-gray-600 truncate">{getCustomerName(order)}</span>
                    </li>
                  ))}
                  {selectedOrders.length > 5 && (
                    <li className="py-1 text-gray-500 italic">
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
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi: Không thể tải trang quản lý đơn hàng</h2>
          <p className="mb-4">Đã xảy ra lỗi khi tải component quản lý đơn hàng.</p>
          <p className="text-sm text-gray-600">Chi tiết lỗi: {error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
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