import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import adminApi from "../../api/adminApi";

const Employees = () => {
  // State management
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const toastRef = React.useRef(null);

  // Form state
  const initialFormState = {
    userName: "",
    fullName: "",
    birthday: null,
    phone: "",
    email: "",
    role: "",
    password: "",
  };
  const [employeeForm, setEmployeeForm] = useState(initialFormState);

  const roles = [
    { label: "Quản trị viên", value: "admin" },
    { label: "Quản lý", value: "manager" },
    { label: "Nhân viên", value: "staff" },
  ];

  const tableHeaders = [
    "Tên Đăng Nhập",
    "Họ Tên",
    "Ngày Sinh",
    "Số Điện Thoại",
    "Email",
    "Vai Trò",
    "Thao Tác",
  ];

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllAdmins();
      setEmployees(response);
    } catch (error) {
      console.error("Error fetching employees:", error);
      showToast(
        "error", 
        "Lỗi", 
        error.response?.data?.message || "Không thể tải danh sách nhân viên"
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const showToast = (severity, summary, detail) => {
    toastRef.current.show({ severity, summary, detail, life: 3000 });
  };

  const resetForm = () => {
    setEmployeeForm(initialFormState);
    setIsEditMode(false);
  };

  // Dialog handlers
  const openEmployeeDialog = (employee = null) => {
    if (employee) {
      setEmployeeForm({ ...employee });
      setIsEditMode(true);
    } else {
      resetForm();
    }
    setIsDialogVisible(true);
  };

  const closeDialog = () => {
    setIsDialogVisible(false);
    resetForm();
  };

  // CRUD operations
  const handleSaveEmployee = async () => {
    try {
      setLoading(true);

      if (isEditMode) {
        await adminApi.updateAdmin(employeeForm._id, employeeForm);
        showToast("success", "Thành công", "Cập nhật nhân viên thành công");
      } else {
        await adminApi.createAdmin(employeeForm);
        showToast("success", "Thành công", "Thêm nhân viên mới thành công");
      }

      fetchEmployees();
      closeDialog();
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error.response?.data?.message || "Có lỗi xảy ra"
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => {
    confirmDialog({
      message: "Bạn có chắc chắn muốn xóa nhân viên này?",
      header: "Xác nhận xóa",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Xóa",
      rejectLabel: "Hủy",
      acceptClassName: "p-button-danger",
      accept: () => handleDeleteEmployee(id),
    });
  };

  const handleDeleteEmployee = async (id) => {
    try {
      setLoading(true);
      await adminApi.deleteAdmin(id);
      showToast("success", "Thành công", "Xóa nhân viên thành công");
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      showToast(
        "error", 
        "Lỗi", 
        error.response?.data?.message || "Không thể xóa nhân viên"
      );
    } finally {
      setLoading(false);
    }
  };

  // Form field components
  const renderFormField = ({ id, label, type, icon, colSpan }) => (
    <div key={id} className={`flex flex-col ${colSpan ? "col-span-2" : ""}`}>
      <label
        htmlFor={id}
        className="text-sm font-medium text-emerald-800 mb-2 flex items-center"
      >
        <i className={`${icon} mr-2 text-emerald-600`} />
        {label}
      </label>
      <InputText
        id={id}
        type={type}
        value={employeeForm[id]}
        onChange={(e) =>
          setEmployeeForm({ ...employeeForm, [id]: e.target.value })
        }
        className="w-full p-inputtext-sm border p-2 rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200"
        placeholder={`Nhập ${label.toLowerCase()}`}
      />
    </div>
  );

  const formFields = [
    {
      id: "userName",
      label: "Tên Đăng Nhập",
      type: "text",
      icon: "pi pi-user",
    },
    { id: "password", label: "Mật Khẩu", type: "password", icon: "pi pi-lock" },
    { id: "fullName", label: "Họ Tên", type: "text", icon: "pi pi-id-card" },
    { id: "phone", label: "Số Điện Thoại", type: "text", icon: "pi pi-phone" },
    {
      id: "email",
      label: "Email",
      type: "email",
      icon: "pi pi-envelope",
      colSpan: 2,
    },
  ];

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 md:p-8">
      <Toast ref={toastRef} position="top-right" />

      <div className="container mx-auto bg-white shadow-xl rounded-xl p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-700">
            Quản Lý Nhân Viên
          </h1>
          <Button
            label="Thêm Nhân Viên"
            icon="pi pi-plus"
            onClick={() => openEmployeeDialog()}
            className="p-button-success"
          />
        </div>

        {/* Employee Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
            <thead className="bg-emerald-50">
              <tr>
                {tableHeaders.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-emerald-800 font-semibold whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && !employees.length ? (
                <tr>
                  <td
                    colSpan={tableHeaders.length}
                    className="text-center py-8"
                  >
                    <i className="pi pi-spinner pi-spin text-2xl text-emerald-500"></i>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={tableHeaders.length}
                    className="text-center py-8 text-gray-500"
                  >
                    Không có nhân viên nào
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr
                    key={employee._id}
                    className="border-b hover:bg-emerald-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      {employee.userName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {employee.fullName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {employee.birthday
                        ? new Date(employee.birthday).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {employee.phone}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {employee.email}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {roles.find((r) => r.value === employee.role)?.label}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button
                          icon="pi pi-pencil"
                          className="p-button-rounded p-button-warning p-button-text"
                          onClick={() => openEmployeeDialog(employee)}
                          tooltip="Sửa"
                          tooltipOptions={{ position: "top" }}
                        />
                        <Button
                          icon="pi pi-trash"
                          className="p-button-rounded p-button-danger p-button-text"
                          onClick={() => confirmDelete(employee._id)}
                          tooltip="Xóa"
                          tooltipOptions={{ position: "top" }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog
          header={isEditMode ? "Chỉnh Sửa Nhân Viên" : "Thêm Nhân Viên Mới"}
          visible={isDialogVisible}
          style={{ width: "90vw", maxWidth: "600px" }}
          modal
          onHide={closeDialog}
          headerClassName="bg-emerald-50 border-b border-emerald-200 p-4 rounded-t-lg"
          contentClassName="p-0"
          footer={
            <div className="flex justify-end gap-3 p-4 border-t border-emerald-200 bg-emerald-50/50">
              <Button
                label="Hủy"
                onClick={closeDialog}
                className="p-button-text p-button-secondary"
                disabled={loading}
              />
              <Button
                label={isEditMode ? "Cập Nhật" : "Thêm"}
                onClick={handleSaveEmployee}
                className="p-button-success"
                icon={
                  loading
                    ? "pi pi-spinner pi-spin"
                    : isEditMode
                    ? "pi pi-check"
                    : "pi pi-plus"
                }
                disabled={loading}
              />
            </div>
          }
        >
          <div className="p-4 md:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formFields.map(renderFormField)}

              <div className="flex flex-col col-span-2">
                <label className="text-sm font-medium text-emerald-800 mb-2 flex items-center">
                  <i className="pi pi-calendar mr-2 text-emerald-600" />
                  Ngày Sinh
                </label>
                <Calendar
                  value={employeeForm.birthday}
                  onChange={(e) =>
                    setEmployeeForm({ ...employeeForm, birthday: e.value })
                  }
                  dateFormat="dd/mm/yy"
                  className="w-full"
                  showIcon
                  icon="pi pi-calendar"
                  placeholder="Chọn ngày sinh"
                  maxDate={new Date()}
                  inputClassName="p-inputtext-sm rounded-lg border p-2 border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200"
                />
              </div>

              <div className="flex flex-col col-span-2">
                <label className="text-sm font-medium text-emerald-800 mb-2 flex items-center">
                  <i className="pi pi-users mr-2 text-emerald-600" />
                  Vai Trò
                </label>
                <Dropdown
                  value={employeeForm.role}
                  options={roles}
                  onChange={(e) =>
                    setEmployeeForm({ ...employeeForm, role: e.value })
                  }
                  placeholder="Chọn vai trò"
                  className="w-full"
                  optionLabel="label"
                />
              </div>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default Employees;
