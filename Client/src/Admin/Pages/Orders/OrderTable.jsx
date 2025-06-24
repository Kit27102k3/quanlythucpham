import { memo } from "react";
import PropTypes from "prop-types";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Badge } from "primereact/badge";
import Pagination from "../../../utils/Paginator";

const OrderTable = ({
  orders,
  selectedOrders,
  setSelectedOrders,
  first,
  totalRecords,
  onPage,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusText,
  getPaymentMethodText,
  handleViewOrder,
  handleDeleteOrder,
  handleUpdateStatus,
  handleMarkAsPaid,
  ORDER_STATUSES,
  showBulkActions,
  setBulkStatus,
  bulkStatus,
  openBulkConfirm,
  userRole,
}) => {
  // Header cho bảng với checkbox chọn tất cả
  const header = (
    <div className="flex flex-wrap items-center justify-between gap-4 p-3">
      <h3 className="m-0 text-lg font-medium text-gray-800">
        Danh sách đơn hàng
      </h3>

      {selectedOrders.length > 0 && showBulkActions && (
        <div className="flex items-center gap-2">
          <Badge
            value={selectedOrders.length}
            severity="info"
            className="mr-2"
          ></Badge>
          <span className="text-sm text-gray-600 mr-2">
            Đã chọn {selectedOrders.length} đơn hàng
          </span>

          <Dropdown
            value={bulkStatus}
            options={[
              { label: "Đã xác nhận", value: ORDER_STATUSES.CONFIRMED },
              { label: "Đang chuẩn bị", value: ORDER_STATUSES.PREPARING },
              { label: "Đã đóng gói", value: ORDER_STATUSES.PACKAGING },
              { label: "Đang vận chuyển", value: ORDER_STATUSES.SHIPPING },
              { label: "Chuyển đến kho phân loại", value: ORDER_STATUSES.SORTING_FACILITY },
              { label: "Đang giao hàng", value: ORDER_STATUSES.DELIVERING },
              { label: "Hoàn thành", value: ORDER_STATUSES.COMPLETED },
              { label: "Đã hủy", value: ORDER_STATUSES.CANCELLED },
            ]}
            onChange={(e) => setBulkStatus(e.value)}
            placeholder="Chọn trạng thái"
            className="w-40 p-2 border"
            pt={{
              root: { className: "w-52" },
              panel: {
                className:
                  "bg-white border border-gray-200 rounded-lg shadow-lg",
              },
              item: { className: "p-2 hover:bg-blue-50 cursor-pointer" },
              // trigger: { className: "p-button-outlined w-full" },
              list: { className: "p-0 max-h-60 overflow-auto" },
            }}
          />

          <Button
            label="Cập nhật"
            className="p-button-sm p-button-info rounded bg-[#51bb1a] text-white p-2"
            onClick={openBulkConfirm}
            disabled={!bulkStatus}
          />

          <Button
            label="Bỏ chọn"
            className="p-button-sm p-button-outlined p-button-secondary rounded bg-red-500 text-white p-2"
            onClick={() => setSelectedOrders([])}
          />
        </div>
      )}
    </div>
  );

  // Template cho cột mã đơn hàng
  const orderIdTemplate = (rowData) => {
    return (
      <div className="font-medium text-blue-600 p-2">
        #{rowData._id.slice(-6).toUpperCase()}
      </div>
    );
  };

  // Template cho cột khách hàng và thông tin giao hàng (combined)
  const customerInfoTemplate = (rowData) => {
    const customerName = rowData.userId?.firstName + ' ' + rowData.userId?.lastName || 
                        (rowData.shippingInfo?.firstName + ' ' + rowData.shippingInfo?.lastName || "Khách vãng lai");
    const email = rowData.userId?.email || rowData.shippingInfo?.email;
    const phone = rowData.shippingInfo?.phone || "N/A";
    const address = rowData.shippingInfo?.address;
    
    // Truncate address if too long
    const truncatedAddress = address && address.length > 40 
      ? address.substring(0, 40) + '...' 
      : address || "N/A";
    
    return (
      <div className="p-2">
        <div className="font-medium text-gray-800">
          {customerName}
        </div>
        {email && (
          <div className="text-xs text-gray-500">{email}</div>
        )}
        <div className="text-xs text-gray-600 mt-1 font-medium">
          SĐT: {phone}
        </div>
        <div
          className="text-xs text-gray-500 truncate max-w-xs"
          title={address}
        >
          {truncatedAddress}
        </div>
      </div>
    );
  };

  // Template cho cột tổng tiền
  const amountTemplate = (rowData) => {
    return (
      <span className="font-medium text-blue-600 p-2 block">
        {formatCurrency(rowData.totalAmount)}
      </span>
    );
  };

  // Template cho cột ngày đặt
  const dateTemplate = (rowData) => {
    return <div className="text-sm p-2">{formatDate(rowData.createdAt)}</div>;
  };

  // Template cho cột trạng thái
  const statusTemplate = (rowData) => {
    return (
      <div className="p-2">
        <span
          className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${getStatusColor(
            rowData.status
          )}`}
        >
          {getStatusText(rowData.status)}
        </span>
      </div>
    );
  };

  // Template cho cột phương thức thanh toán
  const paymentMethodTemplate = (rowData) => {
    return (
      <span className="text-sm p-2 block">
        {getPaymentMethodText(rowData.paymentMethod)}
      </span>
    );
  };

  // Template cho cột chi nhánh
  const branchTemplate = (rowData) => {
    let branchName = "N/A";
    let branchId = "";
    
    // Xử lý các trường hợp khác nhau của dữ liệu chi nhánh
    if (rowData.branchId) {
      if (typeof rowData.branchId === 'object') {
        branchName = rowData.branchId.name || "Chi nhánh không xác định";
        branchId = rowData.branchId._id;
      } else if (typeof rowData.branchId === 'string') {
        branchId = rowData.branchId;
        branchName = `ID: ${rowData.branchId.substring(0, 8)}...`;
      }
    } else if (rowData.branch) {
      // Một số đơn hàng có thể lưu thông tin chi nhánh trong trường branch
      if (typeof rowData.branch === 'object') {
        branchName = rowData.branch.name || "Chi nhánh không xác định";
        branchId = rowData.branch._id;
      } else if (typeof rowData.branch === 'string') {
        branchId = rowData.branch;
        branchName = `ID: ${rowData.branch.substring(0, 8)}...`;
      }
    }
    
    return (
      <div className="p-2">
        <span className="text-sm font-medium text-gray-700 block">
          {branchName}
        </span>
        {branchId && (
          <span className="text-xs text-gray-500 block truncate" title={branchId}>
            {branchId.substring(0, 8)}...
          </span>
        )}
      </div>
    );
  };

  // Template cho cột trạng thái thanh toán
  const paymentStatusTemplate = (rowData) => {
    // Đọc danh sách đơn hàng đã thanh toán từ localStorage
    let manuallyMarkedAsPaid = [];
    try {
      const paidOrdersString = localStorage.getItem('paidOrders') || '[]';
      manuallyMarkedAsPaid = JSON.parse(paidOrdersString);
    } catch (err) {
      console.error("Lỗi khi đọc danh sách đơn hàng đã thanh toán:", err);
    }
    
    // Đảm bảo luôn sử dụng giá trị boolean
    // Kiểm tra nhiều điều kiện vì dữ liệu có thể là boolean, string hoặc undefined
    let isPaid = rowData.isPaid === true || 
                rowData.isPaid === "true" || 
                rowData.isPaid === 1 || 
                rowData.isPaid === "1";
                
    // Ghi đè trạng thái nếu đơn hàng nằm trong danh sách đã đánh dấu thủ công
    if (manuallyMarkedAsPaid.includes(rowData._id)) {
      isPaid = true;
    }
    
    return (
      <div className="p-2">
        <span
          className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
            isPaid
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
        </span>
      </div>
    );
  };

  // Template cho cột hành động
  const actionTemplate = (rowData) => {
    return (
      <div className="flex gap-2 justify-center p-2">
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-outlined p-button-sm"
          onClick={() => handleViewOrder(rowData)}
          tooltip="Xem chi tiết"
          tooltipOptions={{ position: "left" }}
        />

        {!rowData.isPaid && rowData.paymentMethod !== "VNPAY" && (
          <Button
            icon="pi pi-check-circle"
            className="p-button-rounded p-button-outlined p-button-success p-button-sm"
            onClick={() => handleMarkAsPaid(rowData)}
            tooltip="Đánh dấu đã thanh toán"
            tooltipOptions={{ position: "left" }}
          />
        )}

        {rowData.status !== ORDER_STATUSES.COMPLETED &&
          rowData.status !== ORDER_STATUSES.CANCELLED && (
            <Button
              icon="pi pi-sync"
              className="p-button-rounded p-button-outlined p-button-warning p-button-sm"
              onClick={() => handleUpdateStatus(rowData)}
              tooltip="Cập nhật trạng thái"
              tooltipOptions={{ position: "left" }}
            />
          )}

        {userRole === "admin" && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-outlined p-button-danger p-button-sm"
            onClick={() => handleDeleteOrder(rowData)}
            tooltip="Xóa đơn hàng"
            tooltipOptions={{ position: "left" }}
          />
        )}
      </div>
    );
  };

  // Custom footer template with Paginator component
  const footerTemplate = (
    <div className="p-3 flex justify-center">
      <Pagination 
        totalRecords={totalRecords}
        rowsPerPageOptions={[10]}
        onPageChange={onPage}
      />
    </div>
  );

  return (
    <div className="card">
      <DataTable
        value={orders}
        selection={selectedOrders}
        onSelectionChange={(e) => setSelectedOrders(e.value)}
        dataKey="_id"
        paginator={false} // We're using custom pagination
        rows={10} // Fixed to 10 items per page
        totalRecords={totalRecords}
        lazy
        first={(first-1) * 10}
        header={header}
        footer={footerTemplate}
        emptyMessage="Không tìm thấy đơn hàng nào"
        className="p-datatable-sm border border-gray-200 rounded-lg overflow-hidden"
        rowClassName={() => "border-b border-gray-200"}
        stripedRows
        showGridlines
        style={{ width: "100%" }}
        key={JSON.stringify(orders)}
      >
        <Column 
          selectionMode="multiple" 
          headerStyle={{ width: "3rem", padding: "1rem" }} 
          bodyClassName="border border-gray-200 rounded"
        />
        <Column
          field="_id"
          header="Mã đơn"
          body={orderIdTemplate}
          style={{ width: "100px" }}
          headerClassName="bg-gray-100 p-4"
        />
        <Column
          field="userId.fullName"
          header="Thông tin khách hàng"
          body={customerInfoTemplate}
          style={{ width: "280px" }}
          headerClassName="bg-gray-100 p-4"
        />
        <Column
          field="totalAmount"
          header="Tổng tiền"
          body={amountTemplate}
          style={{ width: "120px" }}
          headerClassName="bg-gray-100 p-4"
        />
        <Column
          field="createdAt"
          header="Ngày đặt"
          body={dateTemplate}
          style={{ width: "120px" }}
          headerClassName="bg-gray-100 p-4"
        />
        <Column
          field="status"
          header="Trạng thái"
          body={statusTemplate}
          style={{ width: "140px" }}
          headerClassName="bg-gray-100 p-4"
        />
        {userRole === "admin" && (
          <Column
            field="branchId"
            header="Chi nhánh"
            body={branchTemplate}
            style={{ width: "140px" }}
            headerClassName="bg-gray-100 p-4"
          />
        )}
        <Column
          field="paymentMethod"
          header="Phương thức"
          body={paymentMethodTemplate}
          style={{ width: "120px" }}
          headerClassName="bg-gray-100 p-4"
        />
        <Column
          field="isPaid"
          header="Thanh toán"
          body={paymentStatusTemplate}
          style={{ width: "140px" }}
          headerClassName="bg-gray-100 p-4"
        />
        <Column
          body={actionTemplate}
          header="Thao tác"
          headerClassName="bg-gray-100 p-4"
          style={{ width: "120px", textAlign: "center" }}
        />
      </DataTable>
    </div>
  );
};

OrderTable.propTypes = {
  orders: PropTypes.array.isRequired,
  selectedOrders: PropTypes.array.isRequired,
  setSelectedOrders: PropTypes.func.isRequired,
  first: PropTypes.number.isRequired,
  totalRecords: PropTypes.number.isRequired,
  onPage: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  getStatusColor: PropTypes.func.isRequired,
  getStatusText: PropTypes.func.isRequired,
  getPaymentMethodText: PropTypes.func.isRequired,
  handleViewOrder: PropTypes.func.isRequired,
  handleDeleteOrder: PropTypes.func.isRequired,
  handleUpdateStatus: PropTypes.func.isRequired,
  handleMarkAsPaid: PropTypes.func.isRequired,
  ORDER_STATUSES: PropTypes.object.isRequired,
  showBulkActions: PropTypes.bool.isRequired,
  setBulkStatus: PropTypes.func.isRequired,
  bulkStatus: PropTypes.string,
  openBulkConfirm: PropTypes.func.isRequired,
  userRole: PropTypes.string.isRequired,
};

export default memo(OrderTable);
