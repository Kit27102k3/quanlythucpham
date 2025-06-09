/* eslint-disable react-refresh/only-export-components */
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config/apiConfig";

// Danh sách đơn vị đo lường
export const MEASUREMENT_UNITS = [
  { label: "Gram (g)", value: "gram" },
  { label: "Kilogram (kg)", value: "kg" },
  { label: "Mililít (ml)", value: "ml" },
  { label: "Lít (l)", value: "l" },
  { label: "Cái", value: "cái" },
  { label: "Hộp", value: "hộp" },
  { label: "Chai", value: "chai" },
  { label: "Gói", value: "gói" },
  { label: "Lon", value: "lon" },
];

export const BasicInfoFields = ({
  product,
  handleInputChange,
  handleDropdownChange,
  selectedCategory,
  categories,
  handleNumberChange,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="space-y-2">
      <label
        htmlFor="productName"
        className="text-sm font-medium text-gray-700"
      >
        Tên sản phẩm <span className="text-red-500">*</span>
      </label>
      <InputText
        id="productName"
        name="productName"
        value={product.productName ?? ""}
        onChange={handleInputChange}
        className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        placeholder="Nhập tên sản phẩm"
        required
      />
    </div>

    <div className="space-y-2">
      <label
        htmlFor="productCategory"
        className="text-sm font-medium text-gray-700"
      >
        Danh mục <span className="text-red-500">*</span>
      </label>
      <Dropdown
        id="productCategory"
        value={selectedCategory || product.productCategory}
        onChange={(e) => handleDropdownChange(e, "productCategory")}
        options={categories.map((cat) => ({
          label: cat.nameCategory,
          value: cat._id,
          code: cat.codeCategory,
        }))}
        optionLabel="label"
        optionValue="value"
        placeholder="Chọn danh mục"
        className="w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        panelClassName="z-50 shadow-lg border border-gray-200 rounded-md"
        filter
        required
        appendTo="self"
        style={{ height: "2.5rem" }}
        itemTemplate={(option) => (
          <div className="px-4 py-2 hover:bg-gray-50 transition-colors">
            {option.label}
          </div>
        )}
        filterPlaceholder="Tìm danh mục..."
        dropdownIcon="pi pi-chevron-down"
        showFilterClear={false}
        filterIcon=""
        filterTemplate={(options) => (
          <div className="p-dropdown-filter-container">
            <input
              type="text"
              value={options.filterValue || ""}
              onChange={(e) => options.filterCallback(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md w-full mb-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              style={{ height: "36px" }}
              autoFocus
              placeholder="Tìm danh mục..."
            />
          </div>
        )}
        pt={{
          input: { className: "py-2 px-3" },
          trigger: { className: "py-2" },
        }}
      />
    </div>

    <div className="space-y-2">
      <label
        htmlFor="productPrice"
        className="text-sm font-medium text-gray-700"
      >
        Giá <span className="text-red-500">*</span>
      </label>
      <InputNumber
        id="productPrice"
        value={parseFloat(product.productPrice) || null}
        onValueChange={(e) => handleNumberChange(e, "productPrice")}
        mode="currency"
        currency="VND"
        locale="vi-VN"
        placeholder="0 ₫"
        className="w-full h-10 flex items-center"
        required
        inputClassName="h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
    </div>

    <div className="space-y-2">
      <label
        htmlFor="productStatus"
        className="text-sm font-medium text-gray-700"
      >
        Tình trạng
      </label>
      <Dropdown
        id="productStatus"
        value={product.productStatus || "Còn hàng"}
        onChange={(e) => handleDropdownChange(e, "productStatus")}
        options={[
          { label: "Còn hàng", value: "Còn hàng" },
          { label: "Hết hàng", value: "Hết hàng" },
          { label: "Ngừng kinh doanh", value: "Ngừng kinh doanh" },
        ]}
        className="w-full flex items-center pl-2 h-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        style={{ height: "2.5rem" }}
        itemTemplate={(option) => (
          <div className="px-4 py-2 hover:bg-gray-50 transition-colors">
            {option.label}
          </div>
        )}
      />
    </div>
  </div>
);

export const DetailInfoFields = ({
  product,
  handleInputChange,
  handleDropdownChange,
  handleNumberChange,
  brands,
  suppliers,
}) => {
  // Get branches from API
  const [branches, setBranches] = useState([]);
  const userRole = localStorage.getItem("userRole") || "";
  const userBranchId = localStorage.getItem("branchId") || "";
  const [selectedBranch, setSelectedBranch] = useState(null);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${API_BASE_URL}/api/branches`, {
          headers,
        });

        if (response.data && Array.isArray(response.data.data)) {
          setBranches(response.data.data);

          // Nếu là manager, tìm chi nhánh của user từ danh sách
          if (userRole === "manager" && userBranchId) {
            const userBranch = response.data.data.find(
              (branch) => branch._id === userBranchId
            );
            if (userBranch) {
              setSelectedBranch(userBranch);
            }
          }
        } else if (Array.isArray(response.data)) {
          setBranches(response.data);

          // Nếu là manager, tìm chi nhánh của user từ danh sách
          if (userRole === "manager" && userBranchId) {
            const userBranch = response.data.find(
              (branch) => branch._id === userBranchId
            );
            if (userBranch) {
              setSelectedBranch(userBranch);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };

    fetchBranches();
  }, [userRole, userBranchId]);

  // Nếu là manager, tự động cập nhật branchId trong product
  useEffect(() => {
    if (
      userRole === "manager" &&
      userBranchId &&
      (!product.branchId || product.branchId !== userBranchId)
    ) {
      handleDropdownChange({ value: userBranchId }, "branchId");
    }
  }, [userRole, userBranchId, product.branchId, handleDropdownChange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label
          htmlFor="productBrand"
          className="text-sm font-medium text-gray-700"
        >
          Thương hiệu
        </label>
        <Dropdown
          id="productBrand"
          value={product.productBrandId}
          onChange={(e) => handleDropdownChange(e, "productBrand")}
          options={brands.map((brand) => ({
            label: brand.name,
            value: brand._id,
          }))}
          optionLabel="label"
          filter
          className="w-full border flex items-center pl-2 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Chọn thương hiệu"
          emptyMessage="Không tìm thấy thương hiệu"
          emptyFilterMessage="Không tìm thấy kết quả"
          appendTo="self"
          style={{ height: "2.5rem" }}
          panelClassName="z-50 shadow-lg border border-gray-200 rounded-md"
          itemTemplate={(option) => (
            <div className="px-3 py-2 hover:bg-gray-50 transition-colors">
              {option.label}
            </div>
          )}
          filterPlaceholder="Tìm thương hiệu..."
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="productSupplier"
          className="text-sm font-medium text-gray-700"
        >
          Nhà cung cấp
        </label>
        <Dropdown
          id="productSupplier"
          value={product.productSupplierId}
          onChange={(e) => handleDropdownChange(e, "productSupplier")}
          options={suppliers.map((supplier) => ({
            label: supplier.name,
            value: supplier._id,
          }))}
          optionLabel="label"
          filter
          className="w-full border flex items-center pl-2 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Chọn nhà cung cấp"
          appendTo="self"
          style={{ height: "2.5rem" }}
          panelClassName="z-50 shadow-lg border border-gray-200 rounded-md"
          itemTemplate={(option) => (
            <div className="px-3 py-2 hover:bg-gray-50 transition-colors">
              {option.label}
            </div>
          )}
          filterPlaceholder="Tìm nhà cung cấp..."
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="branchId" className="text-sm font-medium text-gray-700">
          Chi nhánh
        </label>
        {userRole === "admin" ? (
          <Dropdown
            id="branchId"
            value={product.branchId}
            onChange={(e) => handleDropdownChange(e, "branchId")}
            options={branches.map((branch) => ({
              label: branch.name,
              value: branch._id,
            }))}
            optionLabel="label"
            filter
            className="w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Chọn chi nhánh"
            appendTo="self"
            style={{ height: "2.5rem" }}
            panelClassName="z-50 shadow-lg border border-gray-200 rounded-md"
            itemTemplate={(option) => (
              <div className="px-3 py-2 hover:bg-gray-50 transition-colors">
                {option.label}
              </div>
            )}
            filterPlaceholder="Tìm chi nhánh..."
          />
        ) : (
          <div className="h-10 px-3 border border-gray-300 rounded-md bg-gray-50 flex items-center">
            {selectedBranch ? selectedBranch.name : "Đang tải..."}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="productOrigin"
          className="text-sm font-medium text-gray-700"
        >
          Xuất xứ
        </label>
        <InputText
          id="productOrigin"
          name="productOrigin"
          value={product.productOrigin || ""}
          onChange={handleInputChange}
          className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Nhập xuất xứ sản phẩm"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="productWeight"
          className="text-sm font-medium text-gray-700"
        >
          Trọng lượng
        </label>
        <InputNumber
          id="productWeight"
          value={product.productWeight || null}
          onValueChange={(e) => handleNumberChange(e, "productWeight")}
          suffix=" g"
          placeholder="0"
          className="w-full h-10 flex items-center"
          inputClassName="h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="productStock"
          className="text-sm font-medium text-gray-700"
        >
          Số lượng tồn kho
        </label>
        <InputNumber
          id="productStock"
          value={product.productStock || null}
          onValueChange={(e) => handleNumberChange(e, "productStock")}
          placeholder="0"
          className="w-full h-10 flex items-center"
          inputClassName="h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="productDiscount"
          className="text-sm font-medium text-gray-700"
        >
          Giảm giá (%)
        </label>
        <InputNumber
          id="productDiscount"
          value={product.productDiscount || null}
          onValueChange={(e) => handleNumberChange(e, "productDiscount")}
          placeholder="0"
          suffix=" %"
          min={0}
          max={100}
          className="w-full h-10 flex items-center"
          inputClassName="h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="productUnit"
          className="text-sm font-medium text-gray-700"
        >
          Đơn vị cơ bản
        </label>
        <Dropdown
          id="productUnit"
          value={product.productUnit || "gram"}
          onChange={(e) => handleDropdownChange(e, "productUnit")}
          options={MEASUREMENT_UNITS}
          className="w-full border flex items-center pl-2 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          style={{ height: "2.5rem" }}
          panelClassName="z-50 shadow-lg border border-gray-200 rounded-md"
          itemTemplate={(option) => (
            <div className="px-3 py-2 hover:bg-gray-50 transition-colors">
              {option.label}
            </div>
          )}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="productCode"
          className="text-sm font-medium text-gray-700"
        >
          Mã sản phẩm
        </label>
        <InputText
          id="productCode"
          name="productCode"
          value={product.productCode || ""}
          onChange={handleInputChange}
          className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
          placeholder="Mã sản phẩm"
          readOnly
        />
      </div>
    </div>
  );
};

export const DiscountDateFields = ({ product, handleDateChange }) => (
  <div className="field col-span-2">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Thời hạn giảm giá
    </label>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label
          htmlFor="discountStartDate"
          className="block text-sm text-gray-600 mb-1"
        >
          Từ ngày
        </label>
        <Calendar
          id="discountStartDate"
          value={product.discountStartDate}
          onChange={(e) => handleDateChange(e.value, "discountStartDate")}
          showIcon
          className="w-full"
          dateFormat="dd/mm/yy"
          placeholder="Chọn ngày bắt đầu"
          minDate={new Date()}
          appendTo="self"
          panelClassName="z-50 shadow-lg rounded-lg border border-gray-200"
          pt={{
            root: { className: "z-50" },
            panel: { className: "z-50 rounded-lg" },
            input: {
              className: "border border-gray-300 rounded-md h-10 w-full",
              style: { height: "2.5rem" },
            },
            button: { className: "text-blue-500 hover:text-blue-700" },
            monthNavigator: { className: "text-sm font-medium" },
            yearNavigator: { className: "text-sm font-medium" },
            header: { className: "bg-gray-50 rounded-t-lg p-2" },
            footer: { className: "bg-gray-50 rounded-b-lg p-2" },
            today: { className: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
            day: { className: "rounded hover:bg-blue-50" },
            selectedDay: {
              className: "bg-blue-500 text-white rounded hover:bg-blue-600",
            },
          }}
        />
      </div>
      <div>
        <label
          htmlFor="discountEndDate"
          className="block text-sm text-gray-600 mb-1"
        >
          Đến ngày
        </label>
        <Calendar
          id="discountEndDate"
          value={product.discountEndDate}
          onChange={(e) => handleDateChange(e.value, "discountEndDate")}
          showIcon
          className="w-full"
          dateFormat="dd/mm/yy"
          placeholder="Chọn ngày kết thúc"
          minDate={product.discountStartDate || new Date()}
          appendTo="self"
          panelClassName="z-50 shadow-lg rounded-lg border border-gray-200"
          pt={{
            root: { className: "z-50" },
            panel: { className: "z-50 rounded-lg" },
            input: {
              className: "border border-gray-300 rounded-md h-10 w-full",
              style: { height: "2.5rem" },
            },
            button: { className: "text-blue-500 hover:text-blue-700" },
            monthNavigator: { className: "text-sm font-medium" },
            yearNavigator: { className: "text-sm font-medium" },
            header: { className: "bg-gray-50 rounded-t-lg p-2" },
            footer: { className: "bg-gray-50 rounded-b-lg p-2" },
            today: { className: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
            day: { className: "rounded hover:bg-blue-50" },
            selectedDay: {
              className: "bg-blue-500 text-white rounded hover:bg-blue-600",
            },
          }}
        />
      </div>
    </div>
    <small className="text-gray-500 mt-1 block">
      Sau khi hết thời hạn giảm giá, giá sản phẩm sẽ tự động trở về giá gốc.
    </small>
  </div>
);

export const ExpiryDateField = ({ product, handleDateChange }) => (
  <div className="field">
    <label
      htmlFor="expiryDate"
      className="block text-sm font-medium text-gray-700 mb-2"
    >
      Hạn sử dụng
    </label>
    <Calendar
      id="expiryDate"
      value={product.expiryDate}
      onChange={(e) => handleDateChange(e.value, "expiryDate")}
      showIcon
      className="w-full"
      dateFormat="dd/mm/yy"
      placeholder="Chọn hạn sử dụng"
      minDate={new Date()}
      appendTo="self"
      panelClassName="z-50 shadow-lg rounded-lg border border-gray-200"
      pt={{
        root: { className: "z-50" },
        panel: { className: "z-50 rounded-lg" },
        input: {
          className: "border border-gray-300 rounded-md h-10 w-full",
          style: { height: "2.5rem" },
        },
        button: { className: "text-blue-500 hover:text-blue-700" },
        monthNavigator: { className: "text-sm font-medium" },
        yearNavigator: { className: "text-sm font-medium" },
        header: { className: "bg-gray-50 rounded-t-lg p-2" },
        footer: { className: "bg-gray-50 rounded-b-lg p-2" },
        today: { className: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
        day: { className: "rounded hover:bg-blue-50" },
        selectedDay: {
          className: "bg-blue-500 text-white rounded hover:bg-blue-600",
        },
      }}
    />
    <small className="text-gray-500 mt-1 block">
      Sản phẩm sẽ tự động chuyển sang trạng thái &quot;Hết hàng&quot; khi quá
      hạn sử dụng
    </small>
  </div>
);

export const DescriptionFields = ({
  product,
  handleInputChange,
  productDescription,
  setProductDescription,
}) => (
  <div className="p-1">
    <div className="field mb-4">
      <label
        htmlFor="productDescription"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Mô tả chi tiết
      </label>
      <InputTextarea
        id="productDescription"
        value={
          typeof productDescription === "string"
            ? productDescription
            : product.productDescription || ""
        }
        onChange={(e) => setProductDescription(e.target.value)}
        rows={5}
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        placeholder="Mỗi đặc điểm nên kết thúc bằng dấu chấm (.)"
      />
      <small className="text-gray-500 mt-1 block">
        Các đặc điểm được phân tách bằng dấu chấm (.)
      </small>
    </div>

    <div className="field mb-4">
      <label
        htmlFor="productIntroduction"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Giới thiệu sản phẩm
      </label>
      <InputTextarea
        id="productIntroduction"
        name="productIntroduction"
        value={product.productIntroduction ?? ""}
        onChange={handleInputChange}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        placeholder="Giới thiệu ngắn gọn về sản phẩm"
      />
    </div>

    <div className="field mb-4">
      <label
        htmlFor="productDetails"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Chi tiết sản phẩm
      </label>
      <InputTextarea
        id="productDetails"
        name="productDetails"
        value={product.productDetails ?? ""}
        onChange={handleInputChange}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        placeholder="Thông tin chi tiết về đặc tính, công dụng của sản phẩm"
      />
    </div>

    <div className="field">
      <label
        htmlFor="productInfo"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Thông tin bổ sung
      </label>
      <InputText
        id="productInfo"
        name="productInfo"
        value={product.productInfo ?? ""}
        onChange={handleInputChange}
        className="w-full h-10 px-3 border border-gray-300 rounded-md"
        placeholder="Thông tin thêm về sản phẩm"
      />
    </div>
  </div>
);

export const UnitOptionItem = ({
  option,
  index,
  handleUnitOptionChange,
  removeUnitOption,
  setDefaultUnit,
  unitOptionsList,
  product,
}) => (
  <div key={index} className="border border-gray-200 rounded-md p-3 mb-3">
    <div className="flex items-center justify-between mb-2">
      <div className="font-medium text-sm">Đơn vị #{index + 1}</div>
      <div className="flex items-center">
        <label className="inline-flex items-center mr-3">
          <input
            type="checkbox"
            checked={option.isDefault}
            onChange={() => setDefaultUnit(index)}
            className="form-checkbox h-4 w-4 text-[#51bb1a]"
          />
          <span className="ml-2 text-sm">Đơn vị mặc định</span>
        </label>
        {unitOptionsList.length > 1 && (
          <button
            type="button"
            onClick={() => removeUnitOption(index)}
            className="text-red-500 hover:text-red-700"
          >
            <i className="pi pi-trash text-sm"></i>
          </button>
        )}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-2">
      <div>
        <label className="block text-xs text-gray-600 mb-1">Đơn vị</label>
        <Dropdown
          value={option.unit}
          options={MEASUREMENT_UNITS}
          onChange={(e) => handleUnitOptionChange(index, "unit", e.value)}
          className="w-full border flex items-center pl-2 p-2 border-gray-300 rounded-md"
          optionLabel="label"
          optionValue="value"
          placeholder="Chọn đơn vị"
          appendTo="self"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">
          Giá ({option.unit})
        </label>
        <InputNumber
          value={parseFloat(option.price) || 0}
          onValueChange={(e) => handleUnitOptionChange(index, "price", e.value)}
          className="w-full "
          placeholder="Nhập giá"
          min={0}
          mode="currency"
          currency="VND"
          locale="vi-VN"
          inputClassName="w-full h-10 border border-gray-300 rounded-md pl-2"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs text-gray-600 mb-1">
          Tỷ lệ quy đổi
        </label>
        <InputNumber
          value={parseFloat(option.conversionRate) || 1}
          onValueChange={(e) =>
            handleUnitOptionChange(index, "conversionRate", e.value)
          }
          className="w-full"
          placeholder="1"
          min={0.01}
          step={0.01}
          inputClassName="w-full h-10 border border-gray-300 rounded-md pl-2"
        />
        <small className="text-gray-500 text-xs">
          1 {option.unit} = {option.conversionRate} {product.productUnit}
        </small>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">
          Số lượng tồn kho
        </label>
        <InputNumber
          value={parseInt(option.inStock) || 0}
          onValueChange={(e) =>
            handleUnitOptionChange(index, "inStock", e.value)
          }
          className="w-full"
          placeholder="0"
          min={0}
          inputClassName="w-full h-10 border border-gray-300 rounded-md pl-2"
        />
      </div>
    </div>
  </div>
);

export const UnitOptionsSection = ({
  unitOptionsList,
  addUnitOption,
  handleUnitOptionChange,
  removeUnitOption,
  setDefaultUnit,
  product,
}) => (
  <div className="border border-gray-300 rounded-md p-3 mb-2">
    <div className="mb-3">
      <div className="text-sm font-semibold mb-2">
        Các đơn vị đo cho sản phẩm này
      </div>

      {unitOptionsList.map((option, index) => (
        <UnitOptionItem
          key={index}
          option={option}
          index={index}
          handleUnitOptionChange={handleUnitOptionChange}
          removeUnitOption={removeUnitOption}
          setDefaultUnit={setDefaultUnit}
          unitOptionsList={unitOptionsList}
          product={product}
        />
      ))}

      <button
        type="button"
        onClick={addUnitOption}
        className="flex items-center text-white bg-[#51bb1a] p-2 rounded cursor-pointer hover:bg-[#45a011] text-sm font-medium"
      >
        <i className="pi pi-plus mr-1 text-sm cursor-pointer"></i> Thêm đơn vị đo
      </button>
    </div>

    <div className="text-xs text-gray-500">
      <p>
        - <strong>Đơn vị mặc định</strong>: Đơn vị hiển thị chính khi khách hàng
        xem sản phẩm
      </p>
      <p>
        - <strong>Tỷ lệ quy đổi</strong>: Dùng để tính giữa các đơn vị (vd: 1 kg
        = 1000 gram, 1 thùng = 24 chai)
      </p>
      <p>
        - <strong>Ví dụ</strong>: Nước có thể bán theo chai, lốc, thùng; thịt có
        thể bán theo gram, kg; trái cây có thể bán theo kg, thùng
      </p>
    </div>
  </div>
);

export const ImageUploadSection = ({
  imagePreviews,
  handleCloudinaryUpload,
  handleRemoveImage,
}) => (
  <div className="flex flex-wrap gap-3 p-1">
    {imagePreviews.map((preview, index) => (
      <div key={index} className="relative">
        <img
          src={preview}
          alt={`Preview ${index + 1}`}
          className="w-32 h-32 object-cover rounded-md border border-gray-200"
        />
        <button
          type="button"
          onClick={() => handleRemoveImage(index)}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
        >
          ×
        </button>
      </div>
    ))}
    <button
      type="button"
      onClick={handleCloudinaryUpload}
      className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <i className="pi pi-cloud-upload text-2xl text-gray-400 mb-2"></i>
      <span className="text-sm text-gray-500 text-center px-2">
        Tải ảnh lên
      </span>
    </button>
  </div>
);

// PropTypes validation
BasicInfoFields.propTypes = {
  product: PropTypes.shape({
    productName: PropTypes.string,
    productCategory: PropTypes.string,
    productPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    productStatus: PropTypes.string,
  }).isRequired,
  handleInputChange: PropTypes.func.isRequired,
  handleDropdownChange: PropTypes.func.isRequired,
  selectedCategory: PropTypes.string,
  categories: PropTypes.array.isRequired,
  handleNumberChange: PropTypes.func.isRequired,
};

DetailInfoFields.propTypes = {
  product: PropTypes.shape({
    productBrandId: PropTypes.string,
    productSupplierId: PropTypes.string,
    productOrigin: PropTypes.string,
    productStock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    productDiscount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    productCode: PropTypes.string,
    productWeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    productUnit: PropTypes.string,
    branchId: PropTypes.string,
  }).isRequired,
  handleInputChange: PropTypes.func.isRequired,
  handleDropdownChange: PropTypes.func.isRequired,
  handleNumberChange: PropTypes.func.isRequired,
  brands: PropTypes.array.isRequired,
  suppliers: PropTypes.array.isRequired,
};

DiscountDateFields.propTypes = {
  product: PropTypes.shape({
    discountStartDate: PropTypes.instanceOf(Date),
    discountEndDate: PropTypes.instanceOf(Date),
  }).isRequired,
  handleDateChange: PropTypes.func.isRequired,
};

ExpiryDateField.propTypes = {
  product: PropTypes.shape({
    expiryDate: PropTypes.instanceOf(Date),
  }).isRequired,
  handleDateChange: PropTypes.func.isRequired,
};

DescriptionFields.propTypes = {
  product: PropTypes.shape({
    productDescription: PropTypes.string,
    productIntroduction: PropTypes.string,
    productDetails: PropTypes.string,
    productInfo: PropTypes.string,
  }).isRequired,
  handleInputChange: PropTypes.func.isRequired,
  productDescription: PropTypes.string,
  setProductDescription: PropTypes.func.isRequired,
};

UnitOptionItem.propTypes = {
  option: PropTypes.shape({
    isDefault: PropTypes.bool,
    unit: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    conversionRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    inStock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  index: PropTypes.number.isRequired,
  handleUnitOptionChange: PropTypes.func.isRequired,
  removeUnitOption: PropTypes.func.isRequired,
  setDefaultUnit: PropTypes.func.isRequired,
  unitOptionsList: PropTypes.array.isRequired,
  product: PropTypes.shape({
    productUnit: PropTypes.string,
  }).isRequired,
};

UnitOptionsSection.propTypes = {
  unitOptionsList: PropTypes.array.isRequired,
  addUnitOption: PropTypes.func.isRequired,
  handleUnitOptionChange: PropTypes.func.isRequired,
  removeUnitOption: PropTypes.func.isRequired,
  setDefaultUnit: PropTypes.func.isRequired,
  product: PropTypes.object.isRequired,
};

ImageUploadSection.propTypes = {
  imagePreviews: PropTypes.array.isRequired,
  handleCloudinaryUpload: PropTypes.func.isRequired,
  handleRemoveImage: PropTypes.func.isRequired,
};
