import { memo } from "react";
import PropTypes from "prop-types";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Divider } from "primereact/divider";
import { InputNumber } from "primereact/inputnumber";

const OrderFilters = ({
  filters,
  setFilters,
  statusOptions,
  paymentMethodOptions,
  paymentStatusOptions,
  clearFilters,
  userRole,
  userBranch,
  branches,
  handleBranchChange,
  nearbyOrdersRadius,
  setNearbyOrdersRadius,
}) => {
  let branchFilterField = null;
  
  if (userRole === "admin") {
    branchFilterField = (
      <div className="flex items-center gap-3 bg-white p-2 rounded-md border border-gray-200">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[100px]">
          Chi nhánh:
        </label>
        <Dropdown
          value={filters.branchFilter}
          options={branches}
          onChange={handleBranchChange}
          optionLabel="name"
          optionValue="_id"
          placeholder="Tất cả chi nhánh"
          className="w-full"
        />
      </div>
    );
  } else if (userRole === "manager") {
    branchFilterField = (
      <div className="flex flex-col gap-2 bg-blue-50 p-3 rounded-md border-2 border-blue-300 shadow-md">
        <div className="flex items-center">
          <label className="text-sm font-bold text-blue-700 whitespace-nowrap min-w-[100px] flex items-center">
            <i className="pi pi-shield mr-2"></i>
            Chi nhánh:
          </label>
          <div className="flex-1 py-2 px-3 bg-white rounded-md text-blue-700 font-medium border border-blue-300 flex items-center">
            <i className="pi pi-map-marker mr-2 text-blue-500"></i>
            <span className="font-semibold">{userBranch?.name || "Chi nhánh của bạn"}</span>
            <span className="ml-2 text-xs text-white bg-blue-500 px-2 py-1 rounded-full">
              Manager
            </span>
          </div>
        </div>
        <div className="bg-blue-100 p-2 rounded-md border border-blue-200 text-sm text-blue-800">
          <p className="flex items-center">
            <i className="pi pi-info-circle mr-2"></i>
            <span>Bạn chỉ có thể xem và quản lý đơn hàng của chi nhánh này</span>
          </p>
          {userBranch?.address && (
            <p className="mt-1 pl-5 text-blue-700 italic text-xs">
              Địa chỉ: {userBranch.address}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
      <h3 className="text-lg font-medium text-gray-800 mb-3">
        Bộ lọc đơn hàng
      </h3>

      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex-1">
          <span className="p-input-icon-left flex items-center w-full p-2">
            <i className="pi pi-search px-2 -mt-2" />
            <InputText
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters({ ...filters, searchTerm: e.target.value })
              }
              placeholder="Tìm kiếm theo mã đơn, tên khách hàng, số điện thoại..."
              className="w-full px-8 p-inputtext-sm border p-2 border-gray-300 rounded-md"
            />
          </span>
        </div>
      </div>

      <Divider className="my-3" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3 bg-white p-4 rounded-md border border-gray-200">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[100px]">
            Trạng thái:
          </label>
          <Dropdown
            value={filters.statusFilter}
            options={statusOptions}
            onChange={(e) => setFilters({ ...filters, statusFilter: e.value })}
            placeholder="Tất cả trạng thái"
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-md border border-gray-200">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[100px]">
            Phương thức:
          </label>
          <Dropdown
            value={filters.paymentMethodFilter}
            options={paymentMethodOptions}
            onChange={(e) =>
              setFilters({ ...filters, paymentMethodFilter: e.value })
            }
            placeholder="Tất cả phương thức"
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-md border border-gray-200">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[100px]">
            Thanh toán:
          </label>
          <Dropdown
            value={filters.paymentStatusFilter}
            options={paymentStatusOptions}
            onChange={(e) =>
              setFilters({ ...filters, paymentStatusFilter: e.value })
            }
            placeholder="Tất cả trạng thái"
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-md border border-gray-200">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[100px]">
            Ngày đặt:
          </label>
          <Calendar
            value={filters.dateFilter}
            onChange={(e) => setFilters({ ...filters, dateFilter: e.value })}
            placeholder="Chọn ngày"
            showIcon
            className="w-full"
            pt={{
              root: { className: "w-full" },
              input: { className: "w-full border border-gray-300 rounded-md" },
              panel: {
                className:
                  "bg-white border border-gray-200 rounded-lg shadow-lg",
              },
            }}
          />
        </div>

        {branchFilterField}

        {userRole === "manager" && (
          <div className="flex items-center gap-3 bg-white p-2 rounded-md border border-gray-200 col-span-1 md:col-span-2">
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  inputId="nearbyOrders"
                  checked={filters.nearbyFilter}
                  onChange={(e) =>
                    setFilters({ ...filters, nearbyFilter: e.checked })
                  }
                />
                <label
                  htmlFor="nearbyOrders"
                  className="text-sm cursor-pointer"
                >
                  Chỉ hiển thị đơn hàng trong khu vực gần chi nhánh
                </label>
              </div>

              {filters.nearbyFilter && (
                <div className="flex items-center gap-2 mt-1">
                  <label className="text-sm text-gray-600">
                    Bán kính (km):
                  </label>
                  <InputNumber
                    value={nearbyOrdersRadius}
                    onValueChange={(e) => setNearbyOrdersRadius(e.value)}
                    min={1}
                    max={50}
                    showButtons
                    buttonLayout="horizontal"
                    decrementButtonClassName="p-button-secondary"
                    incrementButtonClassName="p-button-secondary"
                    incrementButtonIcon="pi pi-plus"
                    decrementButtonIcon="pi pi-minus"
                    className="w-24"
                    pt={{
                      input: { className: "text-center" },
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Divider className="my-3" />

      <div className="flex justify-end">
        <Button
          label="Xóa bộ lọc"
          icon="pi pi-filter-slash"
          className="p-button-outlined p-button-secondary border p-2 rounded gap-1"
          onClick={clearFilters}
        />
      </div>
    </div>
  );
};

OrderFilters.propTypes = {
  filters: PropTypes.shape({
    searchTerm: PropTypes.string,
    statusFilter: PropTypes.string,
    paymentMethodFilter: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object,
    ]),
    paymentStatusFilter: PropTypes.string,
    dateFilter: PropTypes.instanceOf(Date),
    branchFilter: PropTypes.string,
    nearbyFilter: PropTypes.bool,
  }).isRequired,
  setFilters: PropTypes.func.isRequired,
  statusOptions: PropTypes.array.isRequired,
  paymentMethodOptions: PropTypes.array.isRequired,
  paymentStatusOptions: PropTypes.array.isRequired,
  clearFilters: PropTypes.func.isRequired,
  userRole: PropTypes.string.isRequired,
  userBranch: PropTypes.object,
  branches: PropTypes.array.isRequired,
  handleBranchChange: PropTypes.func.isRequired,
  nearbyOrdersRadius: PropTypes.number,
  setNearbyOrdersRadius: PropTypes.func,
};

export default memo(OrderFilters);
