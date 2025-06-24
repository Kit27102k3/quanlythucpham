/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { confirmDialog } from "primereact/confirmdialog";
import adminApi from "../../api/adminApi";
import { canAccess } from "../../utils/permission";
import branchesApi from "../../api/branchesApi";
import { toast } from "sonner";
import { API_BASE_URL } from "../../config/apiConfig";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [branches, setBranches] = useState([]);
  const [filterBranchId, setFilterBranchId] = useState("");
  const initialFormState = {
    userName: "",
    fullName: "",
    birthday: null,
    phone: "",
    email: "",
    role: null,
    password: "111111",
    isActive: true,
    branchId: null,
    activityStatus: "working",
  };
  const [employeeForm, setEmployeeForm] = useState(initialFormState);
  const roles = [
    { label: "Quản trị viên", value: "admin" },
    { label: "Quản lý", value: "manager" },
    { label: "Nhân viên", value: "employee" },
    { label: "Giao hàng", value: "shipper" },
  ];

  const currentRole = localStorage.getItem("userRole");
  const managerBranchId =
    localStorage.getItem("branchId") ||
    (branches.length > 0 ? branches[0]._id : "");

  useEffect(() => {
    if (currentRole === "manager" && managerBranchId) {
      setFilterBranchId(managerBranchId);
    }
  }, [currentRole, managerBranchId]);

  useEffect(() => {
    // Gọi cả hai hàm trong một useEffect để tránh gọi nhiều lần
    const initData = async () => {
      await fetchBranches();
      await fetchEmployees();
    };

    initData();
  }, []);

  if (!canAccess(currentRole, "employees")) {
    return (
      <div className="text-center text-red-500 font-bold text-xl mt-10">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  let allowedRoles = roles;
  if (currentRole === "manager") {
    allowedRoles = roles.filter(
      (r) => r.value === "employee" || r.value === "shipper"
    );
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

      const normalizedEmployees = response.map((emp) => {
        // Tìm tên chi nhánh từ ID chi nhánh
        let branchName = "N/A";
        if (emp.branchId) {
          if (typeof emp.branchId === "object" && emp.branchId.name) {
            // Nếu branchId đã được populate
            branchName = emp.branchId.name;
          } else {
            // Nếu branchId chỉ là ID, tìm trong danh sách chi nhánh
            const branch = branchList.find((b) => b._id === emp.branchId);
            if (branch) {
              branchName = branch.name;
            }
          }
        }

        return {
          ...emp,
          userName:
            emp.userName || emp.username || emp.user_name || emp.user || "N/A",
          branchName: branchName,
        };
      });

      setEmployees(normalizedEmployees);
    } catch (error) {
      toast.error("Lỗi", {
        description:
          error.response?.data?.message || "Không thể tải danh sách nhân viên",
      });
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
      toast.error("Lỗi", {
        description: "Không thể tải danh sách chi nhánh",
      });
    }
  };

  const resetForm = () => {
    setEmployeeForm({ ...initialFormState });
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
        password: "",
        activityStatus: employee.activityStatus || "working",
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

  const createNewAdmin = async (data) => {
    const essentialData = {
      userName: data.userName.trim(),
      username: data.userName.trim(),
      password: data.password || "111111",
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      role: data.role,
      branchId: data.branchId || null,
      isActive: true,
      activityStatus: data.activityStatus || "working",
    };
    const response = await adminApi.createAdmin(essentialData);
    return response;
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

      const missingFields = requiredFields.filter(
        (field) => !employeeForm[field]
      );

      if (missingFields.length > 0) {
        const fieldLabels = {
          userName: "Tên đăng nhập",
          password: "Mật khẩu",
          fullName: "Họ tên",
          phone: "Số điện thoại",
          email: "Email",
          role: "Vai trò",
          branchId: "Chi nhánh",
        };

        const missingFieldNames = missingFields
          .map((field) => fieldLabels[field])
          .join(", ");
        toast.error("Lỗi", {
          description: `Vui lòng điền đầy đủ thông tin: ${missingFieldNames}`,
        });
        return;
      }

      // Kiểm tra định dạng email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (employeeForm.email && !emailRegex.test(employeeForm.email)) {
        toast.error("Lỗi", {
          description: "Email không đúng định dạng",
        });
        return;
      }

      // Kiểm tra định dạng số điện thoại (10 hoặc 11 số)
      const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
      if (employeeForm.phone && !phoneRegex.test(employeeForm.phone)) {
        toast.error("Lỗi", {
          description:
            "Số điện thoại không đúng định dạng (phải có 10-11 số và bắt đầu bằng 0 hoặc +84)",
        });
        return;
      }

      setLoading(true);

      // Chuẩn bị dữ liệu
      const formData = {
        ...employeeForm,
        userName: employeeForm.userName.trim(),
        username: employeeForm.userName.trim(),
        email: employeeForm.email.trim().toLowerCase(),
        phone: employeeForm.phone.trim(),
        fullName: employeeForm.fullName.trim(),
        branchId: employeeForm.branchId || null,
      };

      if (isEditMode) {
        try {
          await adminApi.updateAdmin(formData._id, formData);
          toast.success("Thành công", {
            description: "Cập nhật nhân viên thành công",
          });
          await fetchEmployees();
          closeDialog();
        } catch (updateError) {
          handleApiError(updateError, "Cập nhật nhân viên thất bại");
        }
      } else {
        try {
          // Sử dụng hàm tạo admin mới đã tối ưu hóa
          await createNewAdmin(formData);
          toast.success("Thành công", {
            description: "Thêm nhân viên mới thành công",
          });
          await fetchEmployees();
          closeDialog();
        } catch (createError) {
          // Thử giải pháp thay thế nếu lỗi 500
          if (createError.response && createError.response.status === 500) {
            try {
              console.log("Thử phương pháp thay thế...");
              // Thử sử dụng PUT thay vì POST để tránh lỗi 500
              const altResponse = await fetch(
                `${API_BASE_URL}/api/admin/create`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                      "accessToken"
                    )}`,
                  },
                  body: JSON.stringify({
                    username: formData.userName,
                    userName: formData.userName,
                    password: formData.password,
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    role: formData.role,
                    branchId: formData.branchId,
                  }),
                }
              );

              if (altResponse.ok) {
                toast.success("Thành công", {
                  description:
                    "Thêm nhân viên mới thành công (phương pháp thay thế)",
                });
                await fetchEmployees();
                closeDialog();
                return;
              } else {
                const errorData = await altResponse.json();
                throw new Error(errorData.message || "Lỗi khi tạo admin");
              }
            } catch (altError) {
              console.error("Lỗi khi thử phương pháp thay thế:", altError);
              handleApiError(
                altError,
                "Thêm nhân viên mới thất bại (phương pháp thay thế)"
              );
            }
          } else {
            handleApiError(createError, "Thêm nhân viên mới thất bại");
          }
        }
      }
    } catch (error) {
      console.error("Lỗi:", error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý lỗi API
  const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
    let errorMessage = defaultMessage;

    if (error.response) {
      // Lỗi từ server
      if (error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === "string") {
          errorMessage = error.response.data;
        }
      }

      // Log chi tiết lỗi
      console.error("Chi tiết lỗi từ server:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });

      // Xử lý các mã lỗi cụ thể
      if (error.response.status === 409) {
        errorMessage =
          "Tên đăng nhập đã tồn tại. Vui lòng chọn tên đăng nhập khác.";
      } else if (error.response.status === 400) {
        errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
      } else if (error.response.status === 500) {
        errorMessage =
          "Lỗi máy chủ. Vui lòng thử lại sau hoặc liên hệ quản trị viên.";
      }
    } else if (error.request) {
      // Request đã được gửi nhưng không nhận được response
      errorMessage =
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
    } else if (error.message) {
      // Lỗi khi thiết lập request
      errorMessage = error.message;
    }

    toast.error("Lỗi", {
      description: errorMessage,
    });
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
      toast.success("Thành công", {
        description: "Xóa nhân viên thành công",
      });
      fetchEmployees();
    } catch (error) {
      toast.error("Lỗi", {
        description: error.response?.data?.message || "Không thể xóa nhân viên",
      });
    } finally {
      setLoading(false);
    }
  };

  // Lọc employees theo filterBranchId
  const filteredEmployees = filterBranchId
    ? employees.filter((emp) => {
        if (!emp.branchId) return false;
        if (typeof emp.branchId === "object")
          return emp.branchId._id === filterBranchId;
        return emp.branchId === filterBranchId;
      })
    : employees;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div
        className="container mx-auto bg-white shadow-xl rounded-xl p-4 md:p-8"
        style={{ overflowX: "auto" }}
      >
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
        {/* Filter chi nhánh */}
        {currentRole !== "employee" && (
          <div className="mb-4 flex items-center gap-3">
            <label className="font-semibold text-emerald-700 flex items-center">
              <i className="pi pi-map-marker mr-2 text-emerald-600" />
              Lọc theo chi nhánh:
            </label>
            <Dropdown
              value={filterBranchId}
              options={
                currentRole === "admin"
                  ? [{ _id: "", name: "Tất cả chi nhánh" }, ...branches]
                  : branches.filter((b) => b._id === managerBranchId)
              }
              onChange={(e) => setFilterBranchId(e.value)}
              optionLabel="name"
              optionValue="_id"
              placeholder="Chọn chi nhánh"
              disabled={currentRole === "manager"}
              className="min-w-[220px] border p-2 rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200"
            />
          </div>
        )}
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
                  "Trạng thái",
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
              {loading && !filteredEmployees.length ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <i className="pi pi-spinner pi-spin text-2xl text-emerald-500"></i>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    Không có nhân viên nào
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
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
                      {employee.role
                        ? roles.find((r) => r.value === employee.role)?.label ||
                          employee.role
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {employee.branchName || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {employee.activityStatus === "working" ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Còn làm việc
                        </span>
                      ) : employee.activityStatus === "resigned" ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          Nghỉ việc
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Còn làm việc
                        </span>
                      )}
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
                  <label
                    htmlFor="userName"
                    className="text-sm font-medium text-emerald-800 mb-2 flex items-center"
                  >
                    <i className="pi pi-user mr-2 text-emerald-600" />
                    Tên Đăng Nhập
                  </label>
                  <InputText
                    id="userName"
                    value={employeeForm.userName || ""}
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        userName: e.target.value,
                      })
                    }
                    className="w-full border p-2 rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200"
                    placeholder="Nhập tên đăng nhập"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-emerald-800 mb-2 flex items-center"
                  >
                    <i className="pi pi-lock mr-2 text-emerald-600" />
                    Mật Khẩu
                  </label>
                  <InputText
                    id="password"
                    type="password"
                    value={employeeForm.password || ""}
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        password: e.target.value,
                      })
                    }
                    className="w-full border p-2 rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200"
                    placeholder="Nhập mật khẩu"
                  />
                </div>

                <div>
                  <label
                    htmlFor="fullName"
                    className="text-sm font-medium text-emerald-800 mb-2 flex items-center"
                  >
                    <i className="pi pi-user mr-2 text-emerald-600" />
                    Họ Tên
                  </label>
                  <InputText
                    id="fullName"
                    value={employeeForm.fullName || ""}
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        fullName: e.target.value,
                      })
                    }
                    className="w-full border p-2 rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200"
                    placeholder="Nhập họ tên"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="text-sm font-medium text-emerald-800 mb-2 flex items-center"
                  >
                    <i className="pi pi-phone mr-2 text-emerald-600" />
                    Số Điện Thoại
                  </label>
                  <InputText
                    id="phone"
                    type="tel"
                    value={employeeForm.phone || ""}
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        phone: e.target.value,
                      })
                    }
                    className="w-full border p-2 rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div className="col-span-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-emerald-800 mb-2 flex items-center"
                  >
                    <i className="pi pi-envelope mr-2 text-emerald-600" />
                    Email
                  </label>
                  <InputText
                    id="email"
                    type="email"
                    value={employeeForm.email || ""}
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        email: e.target.value,
                      })
                    }
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
                  onChange={(e) =>
                    setEmployeeForm({ ...employeeForm, birthday: e.value })
                  }
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
                  onChange={(e) =>
                    setEmployeeForm({ ...employeeForm, role: e.value })
                  }
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
                  options={
                    currentRole === "manager"
                      ? branches.filter((b) => b._id === managerBranchId)
                      : branches
                  }
                  onChange={(e) =>
                    setEmployeeForm({ ...employeeForm, branchId: e.value })
                  }
                  optionLabel="name"
                  optionValue="_id"
                  className="w-full border p-2 rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200"
                  placeholder="Chọn chi nhánh"
                  disabled={currentRole === "manager"}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-emerald-800 mb-2 flex items-center">
                  <i className="pi pi-user-plus mr-2 text-emerald-600" />
                  Trạng thái hoạt động
                </label>
                <Dropdown
                  id="activityStatus"
                  value={employeeForm.activityStatus || "working"}
                  options={[
                    { label: "Còn làm việc", value: "working" },
                    { label: "Nghỉ việc", value: "resigned" }
                  ]}
                  onChange={(e) =>
                    setEmployeeForm({ ...employeeForm, activityStatus: e.value })
                  }
                  optionLabel="label"
                  optionValue="value"
                  className="w-full border p-2 rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200"
                  placeholder="Chọn trạng thái"
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
