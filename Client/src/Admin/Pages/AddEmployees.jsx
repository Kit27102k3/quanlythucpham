import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
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
    role: null,
    password: "",
    isActive: true,
    permissions: ["Xem"]
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
  const renderFormField = ({ id, label, type, colSpan }) => (
    <div className={`col-${colSpan || 6} mb-3`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {type === "dropdown" ? (
        <Dropdown
          id={id}
          value={employeeForm[id]}
          onChange={(e) => setEmployeeForm({ ...employeeForm, [id]: e.value })}
          options={roles}
          optionLabel="label"
          optionValue="value"
          className="w-full"
        />
      ) : type === "calendar" ? (
        <Calendar
          id={id}
          value={employeeForm[id]}
          onChange={(e) => setEmployeeForm({ ...employeeForm, [id]: e.value })}
          className="w-full"
          dateFormat="dd/mm/yy"
          showIcon
        />
      ) : (
        <InputText
          id={id}
          type={type}
          value={employeeForm[id]}
          onChange={(e) => setEmployeeForm({ ...employeeForm, [id]: e.target.value })}
          className="w-full"
        />
      )}
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toastRef} />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Quản lý nhân viên</h2>
        <Button
          label="Thêm nhân viên"
          icon="pi pi-plus"
          onClick={() => openEmployeeDialog()}
        />
      </div>

      {/* Table */}
      <div className="card">
        <DataTable
          value={employees}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
          className="p-datatable-striped"
        >
          {tableHeaders.map((header) => (
            <Column
              key={header}
              field={header.toLowerCase().replace(/\s+/g, "")}
              header={header}
            />
          ))}
          <Column
            body={(rowData) => (
              <div className="flex gap-2">
                <Button
                  icon="pi pi-pencil"
                  className="p-button-rounded p-button-text"
                  onClick={() => openEmployeeDialog(rowData)}
                />
                <Button
                  icon="pi pi-trash"
                  className="p-button-rounded p-button-text p-button-danger"
                  onClick={() => confirmDelete(rowData._id)}
                />
              </div>
            )}
            header="Thao tác"
          />
        </DataTable>
      </div>

      {/* Dialog */}
      <Dialog
        visible={isDialogVisible}
        onHide={closeDialog}
        header={isEditMode ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
        className="w-8"
      >
        <div className="grid">
          {renderFormField({
            id: "userName",
            label: "Tên đăng nhập",
            type: "text",
          })}
          {renderFormField({
            id: "fullName",
            label: "Họ tên",
            type: "text",
          })}
          {renderFormField({
            id: "birthday",
            label: "Ngày sinh",
            type: "calendar",
          })}
          {renderFormField({
            id: "phone",
            label: "Số điện thoại",
            type: "tel",
          })}
          {renderFormField({
            id: "email",
            label: "Email",
            type: "email",
          })}
          {renderFormField({
            id: "role",
            label: "Vai trò",
            type: "dropdown",
          })}
          {!isEditMode && renderFormField({
            id: "password",
            label: "Mật khẩu",
            type: "password",
          })}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            label="Hủy"
            icon="pi pi-times"
            className="p-button-text"
            onClick={closeDialog}
          />
          <Button
            label="Lưu"
            icon="pi pi-check"
            onClick={handleSaveEmployee}
            loading={loading}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default Employees;
