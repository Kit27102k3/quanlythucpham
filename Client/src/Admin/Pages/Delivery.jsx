/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import Pagination from "../../utils/Paginator";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import { useRef } from "react";
import { canAccess } from "../../utils/permission";
import orderApi from "../../api/orderApi";
import { toast } from "sonner";
import "./styles.css";

const Delivery = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(null);
  const [updateDialog, setUpdateDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [updateNote, setUpdateNote] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [first, setFirst] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const fileInputRef = useRef(null);
  const [isPaidCheckbox, setIsPaidCheckbox] = useState(false);

  // Lấy thông tin user và chi nhánh từ localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentRole = localStorage.getItem("userRole");
  const branchId = localStorage.getItem("branchId") || currentUser.branchId;

  // Kiểm tra quyền truy cập
  if (!canAccess(currentRole, "delivery")) {
    return (
      <div className="text-center text-red-500 font-bold text-xl mt-10">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  // Hiển thị thông báo nếu không có chi nhánh
  if (!branchId) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-white shadow-md rounded-lg p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Quản lý giao hàng
            </h1>
            <p className="text-red-500 font-medium">
              Không thể tải dữ liệu. Tài khoản của bạn chưa được gán chi nhánh.
            </p>
            <p className="text-gray-600 mt-2">
              Vui lòng liên hệ quản trị viên để được hỗ trợ.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Các trạng thái đơn hàng
  const orderStatusOptions = [
    { label: "Đang giao", value: "delivering" },
    { label: "Đã giao", value: "delivered" },
    { label: "Giao thất bại", value: "delivery_failed" },
  ];

  // Filter options
  const statusFilterOptions = [
    { label: "Tất cả", value: "all" },
    { label: "Chờ xác nhận", value: "pending" },
    { label: "Đã xác nhận", value: "confirmed" },
    { label: "Đang chuẩn bị", value: "preparing" },
    { label: "Đang đóng gói", value: "packaging" },
    { label: "Chờ giao hàng", value: "shipping" },
    { label: "Chuyển đến kho phân loại", value: "sorting_facility" },
    { label: "Đang giao", value: "delivering" },
    { label: "Đã giao", value: "delivered" },
    { label: "Giao thất bại", value: "delivery_failed" },
    { label: "Đã hoàn thành", value: "completed" },
    { label: "Đã hủy", value: "cancelled" },
  ];

  // Lấy danh sách đơn hàng khi component được mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Lọc đơn hàng khi thay đổi bộ lọc
  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, dateFilter]);

  // Lấy danh sách đơn hàng từ API
  const fetchOrders = async () => {
    if (!branchId) {
      toast.error("Không tìm thấy thông tin chi nhánh", {
        description: "Lỗi",
        duration: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      const response = await orderApi.getOrdersByBranch(branchId);
      if (response && response.data) {
        if (Array.isArray(response.data.orders)) {
          console.log(
            "Tìm thấy mảng orders với",
            response.data.orders.length,
            "đơn hàng"
          );
          
          // Lọc đơn hàng theo vai trò shipper - chỉ hiển thị đơn hàng có trạng thái "sorting_facility"
          if (currentRole === "shipper") {
            const filteredOrders = response.data.orders.filter(order => order.status === "sorting_facility");
            setOrders(filteredOrders);
            setFilteredOrders(filteredOrders);
            setTotalRecords(filteredOrders.length);
            console.log("Vai trò shipper: Lọc đơn hàng trạng thái 'sorting_facility':", filteredOrders.length);
          } else {
            setOrders(response.data.orders);
            setFilteredOrders(response.data.orders);
            setTotalRecords(response.data.orders.length);
          }
        }
        // Nếu response.data là mảng, sử dụng nó
        else if (Array.isArray(response.data)) {
          console.log(
            "Tìm thấy mảng response.data với",
            response.data.length,
            "đơn hàng"
          );
          
          // Lọc đơn hàng theo vai trò shipper - chỉ hiển thị đơn hàng có trạng thái "sorting_facility"
          if (currentRole === "shipper") {
            const filteredOrders = response.data.filter(order => order.status === "sorting_facility");
            setOrders(filteredOrders);
            setFilteredOrders(filteredOrders);
            setTotalRecords(filteredOrders.length);
            console.log("Vai trò shipper: Lọc đơn hàng trạng thái 'sorting_facility':", filteredOrders.length);
          } else {
            setOrders(response.data);
            setFilteredOrders(response.data);
            setTotalRecords(response.data.length);
          }
        }
        // Nếu response.data không phải mảng và không có thuộc tính orders
        else {
          setOrders([]);
          setFilteredOrders([]);
          setTotalRecords(0);
        }
      } else {
        setOrders([]);
        setFilteredOrders([]);
        setTotalRecords(0);
      }

      setLoading(false);
      toast.success("Tải danh sách đơn hàng thành công", {
        duration: 2000,
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Không thể tải danh sách đơn hàng", {
        description: "Lỗi",
        duration: 3000,
      });
      setOrders([]);
      setFilteredOrders([]);
      setTotalRecords(0);
      setLoading(false);
    }
  };

  // Lọc đơn hàng theo trạng thái và ngày
  const filterOrders = () => {
    // Đảm bảo orders là một mảng
    if (!Array.isArray(orders)) {
      setFilteredOrders([]);
      setTotalRecords(0);
      return;
    }

    console.log("Đang lọc đơn hàng từ:", orders.length, "đơn hàng");
    let filtered = [...orders];

    // Nếu là shipper, chỉ hiển thị đơn hàng có trạng thái "sorting_facility"
    if (currentRole === "shipper") {
      filtered = filtered.filter((order) => order.status === "sorting_facility");
    }
    // Nếu không phải shipper, lọc theo trạng thái người dùng chọn
    else if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Lọc theo ngày
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filterDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === filterDate.getTime();
      });
    }
    setFilteredOrders(filtered);
    setTotalRecords(filtered.length);
    setFirst(0);
  };

  // Mở dialog cập nhật trạng thái đơn hàng
  const openUpdateDialog = (order) => {
    setCurrentOrder(order);
    setUpdateStatus(order.status);
    setUpdateNote("");
    setImageUrls([]);
    setIsPaidCheckbox(order.isPaid);
    setUpdateDialog(true);
  };

  // Mở dialog chi tiết đơn hàng
  const openDetailDialog = (order) => {
    console.log("Order detail:", order);
    console.log("Products:", order.products);
    
    // Ensure we have product data in a standard format
    const enhancedOrder = { ...order };
    if (!enhancedOrder.products && enhancedOrder.items) {
      enhancedOrder.products = enhancedOrder.items;
    }
    
    setCurrentOrder(enhancedOrder);
    setDetailDialog(true);
  };

  // Xử lý khi upload ảnh
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Xử lý upload ảnh lên server hoặc convert sang base64
    const promises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target.result);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then((results) => {
      setImageUrls([...imageUrls, ...results]);
    });
  };

  // Xử lý cập nhật trạng thái đơn hàng
  const handleUpdateStatus = async () => {
    if (!updateStatus) {
      toast.error("Vui lòng chọn trạng thái đơn hàng", {
        description: "Lỗi",
        duration: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      
      // Kiểm tra xem trạng thái thanh toán có thay đổi không
      const isPaidChanged = isPaidCheckbox !== currentOrder.isPaid;
      
      // Nếu chỉ thay đổi trạng thái thanh toán, sử dụng API payment-status
      if (isPaidChanged && updateStatus === currentOrder.status) {
        await orderApi.markOrderAsPaid(currentOrder._id);
        toast.success("Cập nhật trạng thái thanh toán thành công", {
          duration: 3000,
        });
      } 
      // Nếu thay đổi cả trạng thái đơn hàng và trạng thái thanh toán
      else if (isPaidChanged) {
        // Cập nhật trạng thái thanh toán trước
        if (isPaidCheckbox) {
          await orderApi.markOrderAsPaid(currentOrder._id);
        }
        
        // Sau đó cập nhật trạng thái đơn hàng
        const updateData = {
          status: updateStatus,
          note: updateNote || ""
        };
        
        await orderApi.updateOrderStatus(currentOrder._id, updateData);
        toast.success("Cập nhật trạng thái đơn hàng thành công", {
          duration: 3000,
        });
      }
      // Nếu chỉ thay đổi trạng thái đơn hàng
      else {
        // Gửi đúng định dạng dữ liệu để API xử lý
        const updateData = {
          status: updateStatus,
          note: updateNote || ""
        };

        await orderApi.updateOrderStatus(currentOrder._id, updateData);
        toast.success("Cập nhật trạng thái đơn hàng thành công", {
          duration: 3000,
        });
      }

      // Nếu có ảnh, xử lý riêng hoặc bỏ qua (tùy theo yêu cầu)
      if (imageUrls.length > 0) {
        console.log("Có", imageUrls.length, "ảnh nhưng không gửi đi để tránh lỗi");
        // Có thể thêm code xử lý ảnh ở đây nếu cần
      }

      setUpdateDialog(false);
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Không thể cập nhật trạng thái đơn hàng", {
        description: error.message || "Lỗi từ server",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination change
  const handlePageChange = ({ page, rows }) => {
    setFirst((page - 1) * rows);
    setRowsPerPage(rows);
  };

  // Hiển thị tag trạng thái đơn hàng
  const getStatusTag = (status) => {
    switch (status) {
      case "pending":
        return <Tag severity="info" value="Chờ xác nhận" />;
      case "confirmed":
        return <Tag severity="info" value="Đã xác nhận" />;
      case "preparing":
        return <Tag severity="info" value="Đang chuẩn bị" />;
      case "packaging":
        return <Tag severity="info" value="Đang đóng gói" />;
      case "shipping":
        return <Tag severity="warning" value="Chờ giao hàng" />;
      case "sorting_facility":
        return <Tag severity="warning" value="Chuyển đến kho phân loại" />;
      case "delivering":
        return <Tag severity="warning" value="Đang giao" />;
      case "delivered":
        return <Tag severity="success" value="Đã giao" />;
      case "delivery_failed":
        return <Tag severity="danger" value="Giao thất bại" />;
      case "completed":
        return <Tag severity="success" value="Đã hoàn thành" />;
      case "cancelled":
        return <Tag severity="danger" value="Đã hủy" />;
      default:
        return <Tag severity="secondary" value={status || "Không xác định"} />;
    }
  };

  // Lấy đơn hàng cho trang hiện tại
  const getCurrentPageOrders = () =>
    filteredOrders.slice(first, first + rowsPerPage);

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white shadow-md rounded-lg p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Quản lý giao hàng
          </h1>
          <p className="text-gray-600">
            Quản lý và cập nhật trạng thái đơn hàng đang giao
          </p>
        </div>

        {/* Bộ lọc */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <Dropdown
              value={statusFilter}
              options={statusFilterOptions}
              onChange={(e) => setStatusFilter(e.value)}
              className="w-full border p-3 rounded "
              placeholder="Chọn trạng thái"
              panelClassName="custom-option-padding"
            />
          </div>
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày đặt hàng
            </label>
            <Calendar
              value={dateFilter}
              onChange={(e) => setDateFilter(e.value)}
              className="w-full"
              dateFormat="dd/mm/yy"
              showIcon
              placeholder="Chọn ngày"
            />
          </div>
          <div className="w-full md:w-1/3 flex items-end">
            <Button
              label="Làm mới"
              icon="pi pi-refresh"
              className="p-button-outlined border p-2 rounded"
              onClick={() => {
                setStatusFilter("all");
                setDateFilter(null);
                fetchOrders();
              }}
            />
          </div>
        </div>

        {/* Bảng đơn hàng */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider border-b">
                  Mã đơn hàng
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider border-b">
                  Thông tin khách hàng
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider border-b">
                  Địa chỉ giao hàng
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider border-b">
                  Tổng tiền
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider border-b">
                  Trạng thái
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider border-b">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-20 text-center">
                    <div className="flex justify-center">
                      <i className="pi pi-spin pi-spinner text-blue-500 text-4xl"></i>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    Không có đơn hàng nào
                  </td>
                </tr>
              ) : (
                getCurrentPageOrders().map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 border-b ">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderCode || order._id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {order?.userId?.firstName} {order?.userId?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.shippingInfo?.phone ||
                          order.phone ||
                          "Không có SĐT"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {order.shippingInfo?.address ||
                          order.shippingAddress ||
                          "Không có địa chỉ"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(order.totalAmount)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusTag(order.status)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex flex-col gap-2">
                        <Button
                          label="Cập nhật"
                          icon="pi pi-pencil"
                          className="p-button-sm bg-[#51bb1a] text-white p-2 rounded px-4"
                          onClick={() => openUpdateDialog(order)}
                        />
                        <Button
                          label="Chi tiết"
                          icon="pi pi-eye"
                          className="p-button-sm p-button-outlined bg-red-500 text-white p-2 rounded px-4"
                          onClick={() => openDetailDialog(order)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="mt-4">
          <Pagination
            totalRecords={filteredOrders.length}
            rowsPerPageOptions={[10, 25, 50]}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Dialog chi tiết đơn hàng */}
      <Dialog
        header="Chi tiết đơn hàng"
        visible={detailDialog}
        style={{ width: "90%", maxWidth: "800px" }}
        headerClassName="p-3"
        onHide={() => setDetailDialog(false)}
        footer={
          <div className="flex justify-end gap-2 p-2">
            <Button
              label="Đóng"
              className="p-button-text bg-red-500 text-white p-2 rounded px-4"
              onClick={() => setDetailDialog(false)}
            />
          </div>
        }
      >
        {currentOrder && (
          <div className="p-fluid p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">
                  Thông tin đơn hàng
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã đơn hàng:</span>
                    <span className="font-medium">{currentOrder.orderCode || currentOrder._id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày đặt:</span>
                    <span>{new Date(currentOrder.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái:</span>
                    <span>{getStatusTag(currentOrder.status)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng tiền:</span>
                    <span className="font-medium text-green-600">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(currentOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">
                  Thông tin khách hàng
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Họ tên:</span>
                    <span className="font-medium">
                      {currentOrder?.userId?.firstName} {currentOrder?.userId?.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số điện thoại:</span>
                    <span>
                      {currentOrder.shippingInfo?.phone || currentOrder.phone || "Không có SĐT"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span>{currentOrder?.userId?.email || "Không có email"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Địa chỉ:</span>
                    <span className="text-right">
                      {currentOrder.shippingInfo?.address || currentOrder.shippingAddress || "Không có địa chỉ"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">
                Danh sách sản phẩm
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đơn giá
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số lượng
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(currentOrder.products || []).map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            {item.productId?.productImages?.[0] ? (
                              <img
                                src={item.productId.productImages[0]}
                                alt={item.productId.productName || "Sản phẩm"}
                                className="w-10 h-10 object-cover rounded mr-3"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded mr-3 flex items-center justify-center">
                                <i className="pi pi-image text-gray-400"></i>
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.productId?.productName || "Sản phẩm không xác định"}
                              </div>
                              {item.productId?.productCode && (
                                <div className="text-xs text-gray-500">
                                  Mã: {item.productId.productCode}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(item.price)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                    {!currentOrder.products || currentOrder.products.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-4 py-4 text-center text-gray-500">
                          Không có sản phẩm nào trong đơn hàng
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              {/* Tổng tiền */}
              <div className="mt-4 border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Tổng tiền sản phẩm:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(currentOrder.totalAmount)}
                  </span>
                </div>
                {currentOrder.shippingFee > 0 && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span>
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(currentOrder.shippingFee)}
                    </span>
                  </div>
                )}
                {currentOrder.discount > 0 && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-600">Giảm giá:</span>
                    <span className="text-red-500">
                      -{new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(currentOrder.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                  <span className="text-gray-800 font-bold">Tổng thanh toán:</span>
                  <span className="text-xl font-bold text-green-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(currentOrder.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Phương thức thanh toán:</span>
                  <span className="font-medium">
                    {currentOrder.paymentMethod === "cod" 
                     ? "Thanh toán khi nhận hàng" 
                     : currentOrder.paymentMethod === "vnpay" 
                       ? "VNPay" 
                       : currentOrder.paymentMethod === "momo" 
                         ? "MoMo" 
                         : currentOrder.paymentMethod === "sepay" 
                           ? "Ví SePay" 
                           : currentOrder.paymentMethod || "Không xác định"}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Trạng thái thanh toán:</span>
                  <span className={`font-medium ${currentOrder.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                    {currentOrder.isPaid 
                      ? "Đã thanh toán" 
                      : "Chưa thanh toán"}
                  </span>
                </div>
              </div>
            </div>

            {currentOrder.note && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Ghi chú từ khách hàng</h3>
                <p className="text-gray-700 italic">{currentOrder.note}</p>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Dialog cập nhật trạng thái */}
      <Dialog
        header="Cập nhật trạng thái đơn hàng"
        visible={updateDialog}
        style={{ width: "90%", maxWidth: "600px" }}
        headerClassName="p-2"
        onHide={() => setUpdateDialog(false)}
        footer={
          <div className="flex justify-end gap-2 p-2">
            <Button
              label="Hủy"
              className="p-button-text bg-red-500 text-white p-2 rounded px-4"
              onClick={() => setUpdateDialog(false)}
              disabled={loading}
            />
            <Button
              label="Cập nhật"
              className="p-button-text bg-[#51bb1a] text-white p-2 rounded px-4"
              onClick={handleUpdateStatus}
              disabled={loading}
            />
          </div>
        }
      >
        <div className="p-fluid p-2">
          <div className="mb-4">
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Trạng thái đơn hàng
            </label>
            <Dropdown
              id="status"
              value={updateStatus}
              options={orderStatusOptions}
              onChange={(e) => setUpdateStatus(e.value)}
              placeholder="Chọn trạng thái"
              className="w-full border p-3 rounded"
              panelClassName="custom-option-padding"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="note"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Ghi chú
            </label>
            <InputTextarea
              id="note"
              value={updateNote}
              onChange={(e) => setUpdateNote(e.target.value)}
              rows={3}
              placeholder="Nhập ghi chú về việc giao hàng..."
              className="w-full border p-2 rounded"
            />
          </div>

          {/* Trạng thái thanh toán */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <input
                id="isPaidCheckbox"
                type="checkbox"
                checked={isPaidCheckbox}
                onChange={(e) => setIsPaidCheckbox(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="isPaidCheckbox"
                className="text-sm font-medium text-gray-700"
              >
                Đánh dấu đã thanh toán
              </label>
            </div>
            {isPaidCheckbox ? (
              <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
                Đơn hàng sẽ được đánh dấu là đã thanh toán
              </div>
            ) : (
              <div className="mt-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                Đơn hàng chưa được thanh toán
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hình ảnh chứng minh đã giao hàng
            </label>
            <div className="flex flex-wrap gap-2 mb-2 border p-2 rounded">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`delivery-${index}`}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                    onClick={() =>
                      setImageUrls(imageUrls.filter((_, i) => i !== index))
                    }
                  >
                    <i className="pi pi-times text-xs" />
                  </button>
                </div>
              ))}
              {imageUrls.length === 0 && (
                <div className="text-gray-500 text-sm">Chưa có hình ảnh</div>
              )}
            </div>
            <div className="flex gap-2 border p-2 rounded">
              <Button
                label="Thêm ảnh"
                className="p-button-outlined p-button-sm"
                onClick={() => fileInputRef.current.click()}
              />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
            </div>
          </div>

          {currentOrder && (
            <div className="mt-4 bg-gray-50 p-3 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Thông tin đơn hàng
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Mã đơn hàng:</span>
                  <span className="ml-1 font-medium">
                    {currentOrder.orderCode || currentOrder._id}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Ngày đặt:</span>
                  <span className="ml-1">
                    {new Date(currentOrder.createdAt).toLocaleDateString(
                      "vi-VN"
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Khách hàng:</span>
                  <span className="ml-1">
                    {currentOrder?.userId?.firstName}{" "}
                    {currentOrder?.userId?.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">SĐT:</span>
                  <span className="ml-1">{currentOrder?.userId?.phone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Địa chỉ:</span>
                  <span className="ml-1">
                    {currentOrder?.shippingInfo?.address}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default Delivery;
