/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback, useMemo, memo } from "react";
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
import { PackageIcon, ClockIcon, CheckIcon, XIcon, EyeIcon, Trash2Icon } from "lucide-react";

// Memoized Order Stats Component
const OrderStats = memo(({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <Card className="shadow-sm bg-white p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow"
        pt={{ 
          root: { className: 'overflow-hidden' },
          content: { className: 'p-0' }
        }}>
        <div className="flex items-center">
          <div className="p-3.5 bg-blue-100 rounded-lg">
            <PackageIcon size={26} className="text-blue-600" />
          </div>
          <div className="ml-5">
            <h3 className="text-lg font-semibold text-gray-700">Tất cả đơn hàng</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
        </div>
      </Card>
      
      <Card className="shadow-sm bg-white p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow"
        pt={{ 
          root: { className: 'overflow-hidden' },
          content: { className: 'p-0' }
        }}>
        <div className="flex items-center">
          <div className="p-3.5 bg-yellow-100 rounded-lg">
            <ClockIcon size={26} className="text-yellow-600" />
          </div>
          <div className="ml-5">
            <h3 className="text-lg font-semibold text-gray-700">Đang xử lý</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
        </div>
      </Card>
      
      <Card className="shadow-sm bg-white p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow"
        pt={{ 
          root: { className: 'overflow-hidden' },
          content: { className: 'p-0' }
        }}>
        <div className="flex items-center">
          <div className="p-3.5 bg-green-100 rounded-lg">
            <CheckIcon size={26} className="text-green-600" />
          </div>
          <div className="ml-5">
            <h3 className="text-lg font-semibold text-gray-700">Đã giao</h3>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
        </div>
      </Card>
      
      <Card className="shadow-sm bg-white p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow"
        pt={{ 
          root: { className: 'overflow-hidden' },
          content: { className: 'p-0' }
        }}>
        <div className="flex items-center">
          <div className="p-3.5 bg-red-100 rounded-lg">
            <XIcon size={26} className="text-red-600" />
          </div>
          <div className="ml-5">
            <h3 className="text-lg font-semibold text-gray-700">Đã hủy</h3>
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
  onDeleteOrder 
}) => {
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
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-center space-x-3">
          <Button
            icon={<EyeIcon size={18} />}
            rounded
            text
            severity="info"
            onClick={() => onViewOrder(order)}
            tooltip="Xem chi tiết"
            tooltipOptions={{ position: 'top' }}
            className="w-10 h-10 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all"
            pt={{ 
              root: { className: 'flex items-center justify-center shadow-sm' },
              icon: { className: 'text-blue-600' } 
            }}
          />
          <Button
            icon={<Trash2Icon size={18} />}
            rounded
            text
            severity="danger"
            onClick={() => onDeleteOrder(order._id)}
            tooltip="Xóa đơn hàng"
            tooltipOptions={{ position: 'top' }}
            className="w-10 h-10 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
            pt={{ 
              root: { className: 'flex items-center justify-center shadow-sm' },
              icon: { className: 'text-red-600' } 
            }}
          />
        </div>
      </td>
    </tr>
  );
});

OrderItem.displayName = 'OrderItem';

const OrderAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [loading, setLoading] = useState(true);
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  });
  const [viewOrder, setViewOrder] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());

  // Memoize utility functions to prevent re-creation on each render
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "completed":
        return "text-green-600 bg-green-100 border-green-200";
      case "cancelled":
        return "text-red-600 bg-red-100 border-red-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  }, []);

  const getStatusText = useCallback((status) => {
    switch (status) {
      case "pending":
        return "Đang xử lý";
      case "completed":
        return "Đã giao";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  }, []);

  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case "pending":
        return <ClockIcon size={16} className="mr-1" />;
      case "completed":
        return <CheckIcon size={16} className="mr-1" />;
      case "cancelled":
        return <XIcon size={16} className="mr-1" />;
      default:
        return null;
    }
  }, []);

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
      pending: ordersList.filter(order => order.status === "pending").length,
      completed: ordersList.filter(order => order.status === "completed").length,
      cancelled: ordersList.filter(order => order.status === "cancelled").length,
    };
    setOrderStats(stats);
  }, []);

  const fetchOrders = useCallback(async (preventLoading = false) => {
    if (!preventLoading) {
      setLoading(true);
    }
    
    try {
      // Thêm tham số để tránh cache
      const timestamp = Date.now();
      
      // Sửa URL cho phù hợp với API server
      const response = await fetch(`http://localhost:8080/orders?_cache=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
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

        setOrders(sortedOrders);
        calculateOrderStats(sortedOrders);
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu đơn hàng:", error);
      setOrders([]);
      calculateOrderStats([]);
    } finally {
      setLoading(false);
      setLastRefreshTime(Date.now());
    }
  }, [calculateOrderStats]);

  // Fetch orders on initial load
  useEffect(() => {
    fetchOrders();
    
    // Fetch orders every 20 seconds instead of 10
    const interval = setInterval(() => {
      fetchOrders(true); // Use silent refresh to prevent loading indicator
    }, 20000);
    
    return () => clearInterval(interval);
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
      await fetch(`http://localhost:8080/orders/${selectedOrderId}`, {
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
        (filterStatus === "Đang xử lý" && order.status === "pending") ||
        (filterStatus === "Đã giao" && order.status === "completed") ||
        (filterStatus === "Đã hủy" && order.status === "cancelled");

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, filterStatus, getCustomerName]);

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
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Quản lý Đơn hàng</h1>
      
      {/* Thống kê đơn hàng */}
      <OrderStats stats={orderStats} />

      <Card 
        className="shadow-sm mb-8 p-0 border border-gray-200 rounded-lg"
        pt={{ 
          root: { className: 'overflow-hidden' },
          content: { className: 'p-0' }
        }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 p-5 border-b border-gray-100">
          <div className="relative w-full md:w-64 flex items-center">
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn hoặc tên khách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-2.5 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>

          <Dropdown
            value={filterStatus}
            options={[
              {label: 'Tất cả trạng thái', value: 'Tất cả'},
              {label: 'Đang xử lý', value: 'Đang xử lý'},
              {label: 'Đã giao', value: 'Đã giao'},
              {label: 'Đã hủy', value: 'Đã hủy'}
            ]}
            onChange={(e) => setFilterStatus(e.value)}
            placeholder="Chọn trạng thái"
            className="w-full md:w-64 h-10"
            pt={{
              root: { className: 'w-full border border-gray-300 rounded-md' },
              input: { className: 'p-2.5 flex items-center' },
              trigger: { className: 'p-2.5' },
              panel: { className: 'border border-gray-200 shadow-md rounded-md mt-1' },
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

        <div className="overflow-x-auto px-4">
          <table className="w-full">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left font-medium text-gray-700 text-sm">Mã Đơn hàng</th>
                <th className="px-6 py-4 text-left font-medium text-gray-700 text-sm">Khách hàng</th>
                <th className="px-6 py-4 text-left font-medium text-gray-700 text-sm">Sản phẩm</th>
                <th className="px-6 py-4 text-left font-medium text-gray-700 text-sm">Tổng tiền</th>
                <th className="px-6 py-4 text-left font-medium text-gray-700 text-sm">Ngày đặt</th>
                <th className="px-6 py-4 text-left font-medium text-gray-700 text-sm">Trạng thái</th>
                <th className="px-6 py-4 text-center font-medium text-gray-700 text-sm">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                // Chỉ render tối đa 50 đơn hàng một lúc để tránh giật lag
                filteredOrders.slice(0, 50).map((order) => (
                  <OrderItem
                    key={order._id}
                    order={order}
                    getStatusColor={getStatusColor}
                    getStatusText={getStatusText}
                    getStatusIcon={getStatusIcon}
                    getCustomerName={getCustomerName}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                    onViewOrder={handleViewOrder}
                    onDeleteOrder={confirmDeleteOrder}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    Không có đơn hàng nào phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-5 mt-4 bg-gray-50 rounded-b-lg border-t border-gray-100">
          <div className="text-sm text-gray-600">
            Hiển thị <span className="font-medium text-blue-600">{Math.min(filteredOrders.length, 50)}</span> trong tổng số <span className="font-medium text-blue-600">{filteredOrders.length}</span> đơn hàng
            {filteredOrders.length > 50 && (
              <span className="ml-2 text-gray-500">(Hiển thị tối đa 50 đơn hàng để tối ưu hiệu suất)</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Cập nhật lần cuối: {new Date(lastRefreshTime).toLocaleTimeString()}
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
        contentClassName="p-5"
        pt={{
          root: { className: 'rounded-lg border border-gray-200' },
          header: { className: 'p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg' },
          closeButton: { className: 'p-2 hover:bg-gray-100 rounded-full' },
          content: { className: 'p-5' }
        }}
      >
        {viewOrder && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Thông tin khách hàng</h3>
                <Card 
                  className="shadow-sm p-4 border border-gray-100 rounded-lg"
                  pt={{ 
                    root: { className: 'overflow-hidden' },
                    content: { className: 'p-0' }
                  }}>
                  <p className="mb-3"><span className="font-medium">Tên khách hàng:</span> {getCustomerName(viewOrder)}</p>
                  {viewOrder.userId?.email && (
                    <p className="mb-3"><span className="font-medium">Email:</span> {viewOrder.userId.email}</p>
                  )}
                  {viewOrder.shippingInfo?.phone && (
                    <p className="mb-3"><span className="font-medium">Số điện thoại:</span> {viewOrder.shippingInfo.phone}</p>
                  )}
                  {viewOrder.shippingInfo?.address && (
                    <p className="mb-3"><span className="font-medium">Địa chỉ:</span> {viewOrder.shippingInfo.address}</p>
                  )}
                </Card>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Thông tin đơn hàng</h3>
                <Card 
                  className="shadow-sm p-4 border border-gray-100 rounded-lg"
                  pt={{ 
                    root: { className: 'overflow-hidden' },
                    content: { className: 'p-0' }
                  }}>
                  <p className="mb-3"><span className="font-medium">Mã đơn hàng:</span> #{viewOrder._id.slice(-6).toUpperCase()}</p>
                  <p className="mb-3"><span className="font-medium">Ngày đặt:</span> {formatDate(viewOrder.createdAt)}</p>
                  <p className="mb-3">
                    <span className="font-medium">Trạng thái:</span> 
                    <span className={`inline-flex items-center ml-2 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(viewOrder.status)}`}>
                      {getStatusIcon(viewOrder.status)}
                      {getStatusText(viewOrder.status)}
                    </span>
                  </p>
                  <p className="mb-3"><span className="font-medium">Phương thức thanh toán:</span> {viewOrder.paymentMethod || "COD"}</p>
                  <p><span className="font-medium">Ghi chú:</span> {viewOrder.note || "Không có"}</p>
                </Card>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-3">Sản phẩm đã đặt</h3>
            <Card 
              className="shadow-sm mb-6 p-0 border border-gray-100 rounded-lg"
              pt={{ 
                root: { className: 'overflow-hidden' },
                content: { className: 'p-0' }
              }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Tên sản phẩm</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700">Đơn giá</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700">Số lượng</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewOrder.products && viewOrder.products.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {item.productId?.productImages && item.productId.productImages[0] && (
                              <img 
                                src={item.productId.productImages[0]} 
                                alt={item.productId.productName} 
                                className="w-14 h-14 object-cover rounded mr-4"
                                loading="lazy"
                              />
                            )}
                            <div>
                              <p className="font-medium">{item.productId?.productName || "Sản phẩm không có sẵn"}</p>
                              {item.productId?.productCode && (
                                <p className="text-xs text-gray-500 mt-1">Mã: {item.productId.productCode}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">{formatCurrency(item.price)}</td>
                        <td className="px-6 py-4 text-center">{item.quantity}</td>
                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-right font-medium">Tổng cộng:</td>
                      <td className="px-6 py-4 text-right font-bold text-lg">{formatCurrency(viewOrder.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
            
            <div className="flex justify-end">
              <Button 
                label="Đóng" 
                icon="pi pi-times" 
                onClick={() => setViewOrder(null)} 
                className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium rounded-lg transition-colors flex items-center gap-2"
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
          <div className="pt-3 flex justify-end gap-3">
            <Button 
              label="Không" 
              icon="pi pi-times" 
              onClick={() => setDeleteDialog(false)} 
              className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium rounded-lg transition-colors" 
            />
            <Button 
              label="Có, xóa" 
              icon="pi pi-trash" 
              onClick={handleDeleteOrder} 
              autoFocus 
              className="px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 font-medium rounded-lg transition-colors flex items-center gap-2" 
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
    </div>
  );
};

export default memo(OrderAdmin);
