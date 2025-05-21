import { useState, useEffect } from "react";
import { Button, Dialog, InputText } from "primereact";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Paginator } from "primereact/paginator";
import suppliersApi from "../../api/suppliersApi";

const Suppliers = () => {
  const [visible, setVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [editVisible, setEditVisible] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    taxCode: "",
    notes: "",
    status: "active",
  });

  // Pagination states
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    // Filter suppliers based on search term
    const filtered = suppliers.filter((supplier) =>
      searchTerm
        ? supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier?.contactPerson
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
        : true
    );

    setFilteredSuppliers(filtered);
    setTotalRecords(filtered.length);
    // Reset to first page when filter changes
    setFirst(0);
  }, [suppliers, searchTerm]);

  const fetchSuppliers = async () => {
    try {
      const data = await suppliersApi.getAllSuppliers();
      if (Array.isArray(data)) {
        setSuppliers(data);
      } else if (data && Array.isArray(data.suppliers)) {
        setSuppliers(data.suppliers);
      } else {
        console.error("Data is not in expected format:", data);
        setSuppliers([]);
      }
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      setSuppliers([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Hàm tạo mã nhà cung cấp ngẫu nhiên 6 chữ số
  const generateRandomCode = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setFormData({
      ...formData,
      code: randomCode,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      taxCode: "",
      notes: "",
      status: "active",
    });
  };

  const handleAddSupplier = async () => {
    // Kiểm tra dữ liệu trước khi gửi
    if (!formData.name || !formData.phone) {
      toast.error("Vui lòng điền đầy đủ tên và số điện thoại!");
      return;
    }

    // Nếu không có mã, tự động tạo mã
    if (!formData.code) {
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      formData.code = randomCode;
    }

    try {
      // Log dữ liệu để debug
      console.log("Đang gửi dữ liệu:", formData);

      const response = await suppliersApi.createSupplier(formData);
      console.log("Kết quả trả về:", response);

      resetForm();
      setVisible(false);
      fetchSuppliers();
      toast.success("Thêm nhà cung cấp thành công!");
    } catch (err) {
      console.error("Lỗi khi thêm nhà cung cấp:", err);
      if (err.response && err.response.data && err.response.data.message) {
        toast.error(`Thêm nhà cung cấp thất bại: ${err.response.data.message}`);
      } else {
        toast.error("Thêm nhà cung cấp thất bại!");
      }
    }
  };

  const handleEditSupplier = (supplier) => {
    setCurrentSupplier(supplier);
    setFormData({
      name: supplier.name || "",
      code: supplier.code || "",
      contactPerson: supplier.contactPerson || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      taxCode: supplier.taxCode || "",
      notes: supplier.notes || "",
      status: supplier.status || "active",
    });
    setEditVisible(true);
  };

  const handleUpdateSupplier = async () => {
    // Kiểm tra dữ liệu trước khi gửi
    if (!formData.name || !formData.phone) {
      toast.error("Vui lòng điền đầy đủ tên và số điện thoại!");
      return;
    }

    // Nếu không có mã, tự động tạo mã
    if (!formData.code) {
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      formData.code = randomCode;
    }

    try {
      // Log dữ liệu để debug
      console.log("Đang cập nhật dữ liệu:", formData);

      const response = await suppliersApi.updateSupplier(
        currentSupplier._id,
        formData
      );
      console.log("Kết quả trả về:", response);

      setEditVisible(false);
      resetForm();
      fetchSuppliers();
      toast.success("Cập nhật nhà cung cấp thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật nhà cung cấp:", error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        toast.error(
          `Cập nhật nhà cung cấp thất bại: ${error.response.data.message}`
        );
      } else {
        toast.error("Cập nhật nhà cung cấp thất bại!");
      }
    }
  };

  // Handle pagination change
  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  // Get current page suppliers
  const getCurrentPageSuppliers = () => {
    return filteredSuppliers.slice(first, first + rows);
  };

  const renderSupplierForm = () => (
    <div className="p-6 bg-gradient-to-b from-white to-blue-50 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tên nhà cung cấp <span className="text-red-500">*</span>
          </label>
          <InputText
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-2.5 border-blue-200 shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md"
            required
          />
        </div>
        <div>
          <label
            htmlFor="code"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Mã nhà cung cấp{" "}
            <span className="text-gray-400 text-xs">(6 chữ số)</span>
          </label>
          <div className="flex gap-2">
            <InputText
              id="code"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              placeholder="Để trống để tự động tạo"
              className="w-full p-2.5 border-blue-200 shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md"
            />
            <Button
              icon="pi pi-refresh"
              className="p-button-secondary"
              tooltip="Tạo mã ngẫu nhiên"
              onClick={generateRandomCode}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="contactPerson"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Người liên hệ
          </label>
          <InputText
            id="contactPerson"
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleInputChange}
            className="w-full p-2.5 border-blue-200 shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md"
          />
        </div>
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Số điện thoại <span className="text-red-500">*</span>
          </label>
          <InputText
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full p-2.5 border-blue-200 shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md"
            required
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <InputText
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full p-2.5 border-blue-200 shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md"
          />
        </div>
        <div>
          <label
            htmlFor="taxCode"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Mã số thuế <span className="text-gray-400 text-xs">(tùy chọn)</span>
          </label>
          <InputText
            id="taxCode"
            name="taxCode"
            value={formData.taxCode}
            onChange={handleInputChange}
            className="w-full p-2.5 border-blue-200 shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md"
          />
        </div>
        <div className="md:col-span-2">
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Địa chỉ
          </label>
          <InputText
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full p-2.5 border-blue-200 shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md"
          />
        </div>
        <div className="md:col-span-2">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Ghi chú
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className="w-full p-2.5 border border-blue-200 shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md"
            rows={3}
          />
        </div>
        <div className="col-span-1">
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Trạng thái
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full p-2.5 border border-blue-200 shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md"
          >
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-2 md:p-4">
      <ToastContainer />
      <h1 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">
        Quản Lý Nhà Cung Cấp
      </h1>
      <div className="flex flex-col md:flex-row gap-2 mb-3 md:mb-5">
        <div className="w-full md:w-2/3">
          <IconField iconPosition="left" className="w-full">
            <InputIcon className="pi pi-search -mt-2"> </InputIcon>
            <InputText
              placeholder="Tìm kiếm theo tên, mã hoặc người liên hệ"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded w-full p-2 px-12"
            />
          </IconField>
        </div>
        <div className="w-full md:w-1/3">
          <Button
            label="Thêm Nhà Cung Cấp"
            icon="pi pi-plus"
            onClick={() => {
              resetForm();
              setVisible(true);
            }}
            className="bg-blue-500 text-white rounded text-xs md:text-sm w-full p-2"
          />
        </div>
      </div>

      {/* Table container with horizontal scroll for mobile */}
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="w-full min-w-[800px] border-collapse bg-white">
          <thead>
            <tr className="bg-gradient-to-r from-blue-500 to-green-500 text-white">
              <th className="border border-blue-300 p-3 text-sm font-semibold text-center">
                Mã NCC
              </th>
              <th className="border border-blue-300 p-3 text-sm font-semibold text-center">
                Tên nhà cung cấp
              </th>
              <th className="border border-blue-300 p-3 text-sm font-semibold text-center">
                Người liên hệ
              </th>
              <th className="border border-blue-300 p-3 text-sm font-semibold text-center">
                Số điện thoại
              </th>
              <th className="border border-blue-300 p-3 text-sm font-semibold text-center">
                Email
              </th>
              <th className="border border-blue-300 p-3 text-sm font-semibold text-center">
                Địa chỉ
              </th>
              <th className="border border-blue-300 p-3 text-sm font-semibold text-center">
                Trạng thái
              </th>
              <th className="border border-blue-300 p-3 text-sm font-semibold text-center w-[100px] md:w-[120px]">
                Chức năng
              </th>
            </tr>
          </thead>
          <tbody>
            {getCurrentPageSuppliers().map((supplier, index) => (
              <tr
                key={supplier?._id}
                className={`border-b hover:bg-blue-50 transition-colors ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <td className="border border-gray-200 p-3 text-sm font-medium text-center">
                  {supplier?.code}
                </td>
                <td className="border border-gray-200 p-3 text-sm">
                  {supplier?.name}
                </td>
                <td className="border border-gray-200 p-3 text-sm text-center">
                  {supplier?.contactPerson}
                </td>
                <td className="border border-gray-200 p-3 text-sm text-center">
                  {supplier?.phone}
                </td>
                <td className="border border-gray-200 p-3 text-sm text-center">
                  {supplier?.email}
                </td>
                <td className="border border-gray-200 p-3 text-sm">
                  {supplier?.address}
                </td>
                <td className="border border-gray-200 p-3 text-sm text-center">
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-white text-xs font-medium ${
                      supplier?.status === "active"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  >
                    {supplier?.status === "active"
                      ? "Đang hoạt động"
                      : "Không hoạt động"}
                  </span>
                </td>
                <td className="border border-gray-200 p-3 text-sm">
                  <div className="flex justify-center space-x-2">
                    <Button
                      icon="pi pi-pencil"
                      className="p-button-warning p-button-rounded p-button-sm"
                      tooltip="Chỉnh sửa"
                      tooltipOptions={{ position: "top" }}
                      onClick={() => handleEditSupplier(supplier)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {getCurrentPageSuppliers().length === 0 && (
              <tr>
                <td colSpan="8" className="p-5 text-center text-gray-500">
                  Không có dữ liệu nhà cung cấp. Hãy thêm nhà cung cấp mới!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 bg-white p-2 rounded-lg shadow-sm">
        <Paginator
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          onPageChange={onPageChange}
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          className="p-1 md:p-2 text-xs md:text-sm"
        />
      </div>

      {/* Add Supplier Dialog */}
      <Dialog
        header={
          <div className="text-xl font-bold text-blue-800 p-2">
            Thêm Nhà Cung Cấp Mới
          </div>
        }
        visible={visible}
        onHide={() => setVisible(false)}
        className="w-[95vw] md:w-[80vw] lg:w-[70vw]"
        footer={
          <div className="flex justify-end gap-4 space-x-2 p-3 bg-gray-50">
            <Button
              label="Hủy"
              icon="pi pi-times"
              className="bg-red-600 text-white rounded p-2 px-4"
              onClick={() => setVisible(false)}
            />
            <Button
              label="Lưu"
              icon="pi pi-check"
              className="bg-[#51bb1a] text-white rounded p-2 px-4"
              onClick={handleAddSupplier}
            />
          </div>
        }
      >
        {renderSupplierForm()}
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog
        header={
          <div className="text-xl font-bold text-blue-800 p-2">
            Chỉnh Sửa Nhà Cung Cấp
          </div>
        }
        visible={editVisible}
        onHide={() => setEditVisible(false)}
        className="w-[95vw] md:w-[80vw] lg:w-[70vw]"
        footer={
          <div className="flex justify-end gap-4 space-x-2 p-3 bg-gray-50">
            <Button
              label="Hủy"
              icon="pi pi-times"
              className="bg-red-600 text-white rounded p-2 px-4"
              onClick={() => setEditVisible(false)}
            />
            <Button
              label="Cập Nhật"
              icon="pi pi-check"
              className="bg-[#51bb1a] text-white rounded p-2"
              onClick={handleUpdateSupplier}
            />
          </div>
        }
      >
        {renderSupplierForm()}
      </Dialog>
    </div>
  );
};

export default Suppliers;
