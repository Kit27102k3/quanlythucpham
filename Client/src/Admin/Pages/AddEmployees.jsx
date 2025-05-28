/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import adminApi from "../../api/adminApi";
import { canAccess } from "../../utils/permission";
import branchesApi from "../../api/branchesApi";

const Employees = () => {
  // State management
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const toastRef = React.useRef(null);
  const [branches, setBranches] = useState([]);

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
    branchId: null
  };
  const [employeeForm, setEmployeeForm] = useState(initialFormState);

  const roles = [
    { label: "Quản trị viên", value: "admin" },
    { label: "Quản lý", value: "manager" },
    { label: "Nhân viên", value: "employee" },
    { label: "Giao hàng", value: "shipper" }
  ];

  // Lấy vai trò hiện tại
  const currentRole = localStorage.getItem("userRole");
  
  useEffect(() => {
    // Gọi cả hai hàm trong một useEffect để tránh gọi nhiều lần
    const initData = async () => {
      await fetchBranches();
      await fetchEmployees();
    };
    
    initData();
  }, []);
  
  if (!canAccess(currentRole, "employees")) {
    return <div className="text-center text-red-500 font-bold text-xl mt-10">Bạn không có quyền truy cập trang này.</div>;
  }
  
  let allowedRoles = roles;
  if (currentRole === "manager") {
    allowedRoles = roles.filter(r => r.value === "employee" || r.value === "shipper");
  } else if (currentRole === "employee") {
    allowedRoles = [];
  }

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      // Sử dụng danh sách chi nhánh đã được lưu trong state
      const branchList = branches;
      
      // Lấy danh sách nhân viên
      const response = await adminApi.getAllAdmins();
      
      const normalizedEmployees = response.map(emp => {
        // Tìm tên chi nhánh từ ID chi nhánh
        let branchName = "N/A";
        if (emp.branchId) {
          if (typeof emp.branchId === 'object' && emp.branchId.name) {
            // Nếu branchId đã được populate
            branchName = emp.branchId.name;
          } else {
            // Nếu branchId chỉ là ID, tìm trong danh sách chi nhánh
            const branch = branchList.find(b => b._id === emp.branchId);
            if (branch) {
              branchName = branch.name;
            }
          }
        }
        
        return {
          ...emp,
          userName: emp.userName || emp.username || emp.user_name || emp.user || "N/A",
          branchName: branchName
        };
      });
      
      setEmployees(normalizedEmployees);
    } catch (error) {
      showToast(
        "error", 
        "Lỗi", 
        error.response?.data?.message || "Không thể tải danh sách nhân viên"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await branchesApi.getAllBranches();
      if (Array.isArray(data)) {
        setBranches(data);
      } else if (data && Array.isArray(data.branches)) {
        setBranches(data.branches);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách chi nhánh:", error);
      showToast("error", "Lỗi", "Không thể tải danh sách chi nhánh");
    }
  };

  const showToast = (severity, summary, detail) => {
    toastRef.current.show({ severity, summary, detail, life: 3000 });
  };

  const resetForm = () => {
    setEmployeeForm({...initialFormState});
    setIsEditMode(false);
  };

  const openEmployeeDialog = async (employee = null) => {
    if (employee) {
      // Nếu có branchId, tìm tên chi nhánh
      let branchInfo = null;
      if (employee.branchId) {
        try {
          branchInfo = await branchesApi.getBranchById(employee.branchId);
          if (branchInfo && branchInfo.branch) {
            employee.branchName = branchInfo.branch.name;
          }
        } catch (error) {
          console.error("Không thể lấy thông tin chi nhánh:", error);
        }
      }
      
      setEmployeeForm({
        ...initialFormState,
        ...employee,
        userName: employee.userName || "",
        fullName: employee.fullName || "",
        phone: employee.phone || "",
        email: employee.email || "",
        branchId: employee.branchId || null,
        password: ""
      });
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
      // Validate required fields
      const requiredFields = ["userName", "fullName", "phone", "email", "role"];
      // Add password to required fields only when creating a new employee
      if (!isEditMode) {
        requiredFields.push("password");
      }
      
      const missingFields = requiredFields.filter(field => !employeeForm[field]);
      
      if (missingFields.length > 0) {
        const fieldLabels = {
          userName: "Tên đăng nhập",
          password: "Mật khẩu",
          fullName: "Họ tên",
          phone: "Số điện thoại",
          email: "Email",
          role: "Vai trò",
          branchId: "Chi nhánh"
        };
        
        const missingFieldNames = missingFields.map(field => fieldLabels[field]).join(", ");
        showToast("error", "Lỗi", `Vui lòng điền đầy đủ thông tin: ${missingFieldNames}`);
        return;
      }
      
      setLoading(true);
      
      const formData = {
        ...employeeForm,
        userName: employeeForm.userName.trim(),
      };

      if (isEditMode) {
        // Khi cập nhật, chỉ gửi mật khẩu nếu người dùng đã nhập mật khẩu mới
        if (!formData.password) {
          delete formData.password;
        }
        
        await adminApi.updateAdmin(formData._id, formData);
        showToast("success", "Thành công", "Cập nhật nhân viên thành công");
      } else {
        await adminApi.createAdmin(formData);
        showToast("success", "Thành công", "Thêm nhân viên mới thành công");
      }

      fetchEmployees();
      closeDialog();
    } catch (error) {
      console.error("Lỗi:", error);
      let errorMessage = "Có lỗi xảy ra";
      
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast("error", "Lỗi", errorMessage);
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
      showToast(
        "error", 
        "Lỗi", 
        error.response?.data?.message || "Không thể xóa nhân viên"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <Toast ref={toastRef} position="top-right" />

      <div className="container mx-auto bg-white shadow-xl rounded-xl p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-700">
            Quản Lý Nhân Viên
          </h1>
          {currentRole !== "employee" && (
            <Button
              label="Thêm Nhân Viên"
              icon="pi pi-plus"
              onClick={() => openEmployeeDialog()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
            />
          )}
        </div>

        {/* Employee Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
            <thead className="bg-gray-200">
              <tr>
                {[
                  "Tên Đăng Nhập",
                  "Họ Tên",
                  "Ngày Sinh",
                  "Số Điện Thoại",
                  "Email",
                  "Vai Trò",
                  "Chi Nhánh",
                  "Thao Tác",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-black font-semibold whitespace-nowrap"
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
                    colSpan={8}
                    className="text-center py-8"
                  >
                    <i className="pi pi-spinner pi-spin text-2xl text-emerald-500"></i>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
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
                      {employee.fullName || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {employee.birthday
                        ? new Date(employee.birthday).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {employee.phone || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {employee.email || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {employee.role ? roles.find((r) => r.value === employee.role)?.label || employee.role : "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {employee.branchName || "N/A"}
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

        {/* Chỉ render Dialog nếu không phải là employee */}
        {currentRole !== "employee" && (
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
                  className="p-button-text p-button-secondary bg-red-600 text-white p-2 rounded px-4"
                  disabled={loading}
                />
                <Button
                  label={isEditMode ? "Cập Nhật" : "Thêm"}
                  onClick={handleSaveEmployee}
                  className="p-button-success bg-[#51bb1a] p-2 text-white text-[14px] gap-2 rounded"
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
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label htmlFor="userName" className="text-sm font-medium text-emerald-800 mb-2 flex items-center">
                    <i className="pi pi-user mr-2 text-emerald-600" />
                    Tên Đăng Nhập
                  </label>
                  <InputText
                    id="userName"
                    value={employeeForm.userName || ""}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, userName: e.target.value })}
                    className="w-full border p-2 rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200"
                    placeholder="Nhập tên đăng nhập"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="text-sm font-medium text-emerald-800 mb-2 flex items-center">
                    <i className="pi pi-lock mr-2 text-emerald-600" />
                    Mật Khẩu
                  </label>
                  <InputText
                    id="password"
                    type="password"
                    value={employeeForm.password || ""}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                    className="w-full border p-2 rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200"
                    placeholder="Nhập mật khẩu"
                  />
                </div>
                
                <div>
                  <label htmlFor="fullName" className="text-sm font-medium text-emerald-800 mb-2 flex items-center">
                    <i className="pi pi-user mr-2 text-emerald-600" />
                    Họ Tên
                  </label>
                  <InputText
                    id="fullName"
                    value={employeeForm.fullName || ""}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, fullName: e.target.value })}
                    className="w-full border p-2 rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200"
                    placeholder="Nhập họ tên"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="text-sm font-medium text-emerald-800 mb-2 flex items-center">
                    <i className="pi pi-phone mr-2 text-emerald-600" />
                    Số Điện Thoại
                  </label>
                  <InputText
                    id="phone"
                    type="tel"
                    value={employeeForm.phone || ""}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                    className="w-full border p-2 rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                
                <div className="col-span-2">
                  <label htmlFor="email" className="text-sm font-medium text-emerald-800 mb-2 flex items-center">
                    <i className="pi pi-envelope mr-2 text-emerald-600" />
                    Email
                  </label>
                  <InputText
                    id="email"
                    type="email"
                    value={employeeForm.email || ""}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    className="w-full border p-2 rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200"
                    placeholder="Nhập email"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-emerald-800 mb-2 flex items-center">
                  <i className="pi pi-calendar mr-2 text-emerald-600" />
                  Ngày Sinh
                </label>
                <Calendar
                  id="birthday"
                  value={employeeForm.birthday || null}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, birthday: e.value })}
                  dateFormat="dd/mm/yy"
                  showIcon
                  maxDate={new Date()}
                  className="w-full border p-2 rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200"
                  placeholder="Chọn ngày sinh"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-emerald-800 mb-2 flex items-center">
                  <i className="pi pi-users mr-2 text-emerald-600" />
                  Vai Trò
                </label>
                <Dropdown
                  id="role"
                  value={employeeForm.role || null}
                  options={allowedRoles}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.value })}
                  optionLabel="label"
                  optionValue="value"
                  className="w-full border p-2 rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200"
                  placeholder="Chọn vai trò"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-emerald-800 mb-2 flex items-center">
                  <i className="pi pi-map-marker mr-2 text-emerald-600" />
                  Chi Nhánh
                </label>
                <Dropdown
                  id="branchId"
                  value={employeeForm.branchId || null}
                  options={branches}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, branchId: e.value })}
                  optionLabel="name"
                  optionValue="_id"
                  className="w-full border p-2 rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200"
                  placeholder="Chọn chi nhánh"
                />
              </div>
            </div>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default Employees;