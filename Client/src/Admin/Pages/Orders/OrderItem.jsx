import { memo } from "react";
import PropTypes from "prop-types";
import { Button } from "primereact/button";
import { EyeIcon, Trash2Icon } from "lucide-react";

// Memoized Order Item component
const OrderItem = memo(
  ({
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
    ORDER_STATUSES,
  }) => {
    const paymentMethod = order.paymentMethod || "";
    const isCOD =
      paymentMethod.toLowerCase() === "cod" ||
      paymentMethod.toUpperCase() === "COD";

    // Hiển thị nút thanh toán chỉ khi đơn hàng là COD, đang ở trạng thái đang xử lý và chưa thanh toán
    const showPaymentButton =
      isCOD && order.status === ORDER_STATUSES.PENDING && !order.isPaid;

    return (
      <tr className="border-b hover:bg-gray-50 transition-colors p-4">
        <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">
          #{order._id.slice(-6).toUpperCase()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
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
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {order.products?.length || 0} sản phẩm
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap font-medium">
          {formatCurrency(order.totalAmount || 0)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(order.createdAt)}</td>
        <td className="px-6 py-4 whitespace-nowrap">
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
              <i className="pi pi-check mr-1"></i>
              Đã thanh toán
            </span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex justify-center space-x-2">
            <Button
              icon={<EyeIcon size={18} />}
              rounded
              text
              severity="info"
              onClick={() => onViewOrder(order)}
              tooltip="Xem chi tiết"
              tooltipOptions={{ position: "top" }}
              className="w-9 h-9 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all"
              pt={{
                root: { className: "flex items-center justify-center" },
                icon: { className: "text-blue-600" },
              }}
            />

            {/* Thêm nút cập nhật trạng thái */}
            {order.status !== ORDER_STATUSES.COMPLETED &&
              order.status !== ORDER_STATUSES.CANCELLED && (
                <Button
                  icon={
                    <i
                      className="pi pi-arrow-right-arrow-left"
                      style={{ fontSize: "1rem" }}
                    ></i>
                  }
                  rounded
                  text
                  severity="warning"
                  onClick={() => onUpdateStatus(order)}
                  tooltip="Cập nhật trạng thái"
                  tooltipOptions={{ position: "top" }}
                  className="w-9 h-9 hover:bg-yellow-50 border border-transparent hover:border-yellow-200 transition-all"
                  pt={{
                    root: { className: "flex items-center justify-center" },
                    icon: { className: "text-yellow-600" },
                  }}
                />
              )}

            {showPaymentButton && (
              <Button
                icon={
                  <i
                    className="pi pi-check-circle"
                    style={{ fontSize: "1rem" }}
                  ></i>
                }
                rounded
                text
                severity="success"
                onClick={() => onMarkAsPaid(order._id)}
                tooltip="Đánh dấu đã thanh toán"
                tooltipOptions={{ position: "top" }}
                className="w-9 h-9 hover:bg-green-50 border border-transparent hover:border-green-200 transition-all"
                pt={{
                  root: { className: "flex items-center justify-center" },
                  icon: { className: "text-green-600" },
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
              tooltipOptions={{ position: "top" }}
              className="w-9 h-9 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
              pt={{
                root: { className: "flex items-center justify-center" },
                icon: { className: "text-red-600" },
              }}
            />
          </div>
        </td>
      </tr>
    );
  }
);

// Thêm PropTypes để xác thực props
OrderItem.propTypes = {
  order: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    isPaid: PropTypes.bool,
    paymentMethod: PropTypes.string,
    totalAmount: PropTypes.number,
    createdAt: PropTypes.string,
    products: PropTypes.array,
    userId: PropTypes.shape({
      email: PropTypes.string,
    }),
    shippingInfo: PropTypes.shape({
      phone: PropTypes.string,
    }),
  }).isRequired,
  getStatusColor: PropTypes.func.isRequired,
  getStatusText: PropTypes.func.isRequired,
  getStatusIcon: PropTypes.func.isRequired,
  getCustomerName: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  onViewOrder: PropTypes.func.isRequired,
  onDeleteOrder: PropTypes.func.isRequired,
  onMarkAsPaid: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
  ORDER_STATUSES: PropTypes.object.isRequired,
};

OrderItem.displayName = "OrderItem";

export default OrderItem;
