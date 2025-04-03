import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import axios from "axios";
import { toast } from "react-toastify";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [employeeForm, setEmployeeForm] = useState({
    username: "",
    fullName: "",
    birthday: null,
    phone: "",
    email: "",
    role: "",
    password: "",
  });

  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const roles = [
    { label: "Nhân Viên", value: "staff" },
    { label: "Quản Lý", value: "manager" },
    { label: "Quản Trị Viên", value: "admin" },
  ];

  // Fetch all employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8080/api/admin");
      setEmployees(response.data);
    } catch (error) {
      console.error("Chi tiết lỗi:", error);
      toast.error(error.response?.data?.message || "Lỗi khi tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openEmployeeDialog = (employee = null) => {
    if (employee) {
      setEmployeeForm({ ...employee });
      setIsEditMode(true);
    } else {
      setEmployeeForm({
        username: "",
        fullName: "",
        birthday: null,
        phone: "",
        email: "",
        role: "",
        password: "",
      });
      setIsEditMode(false);
    }
    setIsDialogVisible(true);
  };

  const handleSaveEmployee = async () => {
    try {
      setLoading(true);
      const data = {
        ...employeeForm,
        birthday: employeeForm.birthday.toISOString(),
      };

      if (isEditMode) {
        await axios.put(
          `http://localhost:8080/api/admin/${employeeForm._id}`,
          data
        );
        toast.success("Cập nhật nhân viên thành công");
      } else {
        await axios.post("http://localhost:8080/api/admin", data);
        toast.success("Thêm nhân viên thành công");
      }

      setIsDialogVisible(false);
      fetchEmployees();
    } catch (error) {
      console.error("Chi tiết lỗi:", error);
      toast.error(error.response?.data?.message || "Lỗi khi lưu thông tin nhân viên");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
      try {
        setLoading(true);
        await axios.delete(`http://localhost:8080/api/admin/${id}`);
        toast.success("Xóa nhân viên thành công");
        fetchEmployees();
      } catch (error) {
        console.error("Chi tiết lỗi:", error);
        toast.error(error.response?.data?.message || "Lỗi khi xóa nhân viên");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 p-8">
      <div className="container mx-auto bg-white shadow-2xl rounded-2xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-emerald-700">
            Quản Lý Nhân Viên
          </h1>
          <button
            onClick={() => openEmployeeDialog()}
            className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-semibold shadow-md"
          >
            Thêm Nhân Viên
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-emerald-50">
              <tr>
                {[
                  "Tên Đăng Nhập",
                  "Họ Tên",
                  "Ngày Sinh",
                  "Số Điện Thoại",
                  "Email",
                  "Quyền",
                  "Trạng Thái",
                  "Thao Tác",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-emerald-800 font-semibold"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr
                  key={employee._id}
                  className="border-b hover:bg-emerald-50/50 transition-colors"
                >
                  <td className="px-4 py-3">{employee.username}</td>
                  <td className="px-4 py-3">{employee.fullName}</td>
                  <td className="px-4 py-3">
                    {new Date(employee.birthday).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{employee.phone}</td>
                  <td className="px-4 py-3">{employee.email}</td>
                  <td className="px-4 py-3">
                    {roles.find((r) => r.value === employee.role)?.label}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        employee.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {employee.isActive ? "Hoạt động" : "Đã khóa"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2 gap-2">
                      <button
                        onClick={() => openEmployeeDialog(employee)}
                        className="px-3 cursor-pointer py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-sm"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee._id)}
                        className="px-3 cursor-pointer py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Dialog
          header={isEditMode ? "Chỉnh Sửa Nhân Viên" : "Thêm Nhân Viên Mới"}
          visible={isDialogVisible}
          style={{ width: "600px" }}
          modal
          onHide={() => setIsDialogVisible(false)}
          headerClassName="bg-emerald-50 border-b border-emerald-200 p-4 rounded-t-lg"
          contentClassName="p-0"
          footer={
            <div className="flex justify-end gap-3 p-4 border-t border-emerald-200 bg-emerald-50/50">
              <Button
                label="Hủy"
                onClick={() => setIsDialogVisible(false)}
                className="p-button-text p-button-secondary p-2 border w-[100px] bg-red-600 text-white rounded"
                outlined
              />
              <Button
                label={isEditMode ? "Cập Nhật" : "Thêm"}
                onClick={handleSaveEmployee}
                className="p-button-success p-2 border w-[100px] bg-[#51bb1a] text-white rounded"
                loading={loading}
              />
            </div>
          }
        >
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-5">
              {[
                {
                  id: "username",
                  label: "Tên Đăng Nhập",
                  type: "text",
                  icon: "pi pi-user",
                  disabled: isEditMode,
                },
                {
                  id: "password",
                  label: "Mật Khẩu",
                  type: "password",
                  icon: "pi pi-lock",
                  required: !isEditMode,
                },
                {
                  id: "fullName",
                  label: "Họ Tên",
                  type: "text",
                  icon: "pi pi-id-card",
                },
                {
                  id: "phone",
                  label: "Số Điện Thoại",
                  type: "text",
                  icon: "pi pi-phone",
                },
                {
                  id: "email",
                  label: "Email",
                  type: "email",
                  icon: "pi pi-envelope",
                  colSpan: 2,
                },
              ].map(({ id, label, type, icon, disabled, required, colSpan }) => (
                <div
                  key={id}
                  className={`flex flex-col ${colSpan ? "col-span-2" : ""}`}
                >
                  <label
                    htmlFor={id}
                    className="text-sm font-medium text-emerald-800 mb-2 flex items-center"
                  >
                    <i className={`${icon} mr-2 text-emerald-600`} />
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
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
                    disabled={disabled}
                    required={required}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col col-span-2">
              <label
                htmlFor="birthday"
                className="text-sm font-medium text-emerald-800 mb-2 flex items-center"
              >
                <i className="pi pi-calendar mr-2 text-emerald-600" />
                Ngày Sinh
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Calendar
                id="birthday"
                value={employeeForm.birthday}
                onChange={(e) =>
                  setEmployeeForm({ ...employeeForm, birthday: e.value })
                }
                dateFormat="dd/mm/yy"
                className="w-full"
                showIcon
                icon="pi pi-calendar"
                placeholder="Chọn ngày sinh"
                touchUI={false}
                inputClassName="p-inputtext-sm rounded-lg border p-2 border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200"
                required
              />
            </div>

            <div className="flex flex-col col-span-2">
              <label
                htmlFor="role"
                className="text-sm font-medium text-emerald-800 mb-2 flex items-center"
              >
                <i className="pi pi-users mr-2 text-emerald-600" />
                Quyền
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Dropdown
                id="role"
                value={employeeForm.role}
                options={roles}
                onChange={(e) =>
                  setEmployeeForm({ ...employeeForm, role: e.value })
                }
                placeholder="Chọn quyền"
                className="w-full border p-2"
                panelClassName="shadow-lg p-4 py-2"
                optionClassName="hover:bg-emerald-50 p-2"
                required
              />
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default Employees;
