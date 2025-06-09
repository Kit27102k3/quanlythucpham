import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

// Tạo instance axios với cấu hình cơ bản
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/admin`,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  },
});

const employeeApi = {
  async getAllAdmins(userRole, branchId = null) {
    try {
      let url = "/";

      // Nếu là manager thì chỉ lấy nhân viên của chi nhánh đó
      if (userRole === "manager" && branchId) {
        url = `/branch/${branchId}`;
      }

      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async createAdmin(adminData) {
    try {
      // Chuẩn bị dữ liệu theo định dạng backend yêu cầu
      const payload = {
        username: adminData.userName,
        userName: adminData.userName,
        password: adminData.password,
        fullName: adminData.fullName,
        email: adminData.email,
        phone: adminData.phone,
        role: adminData.role,
        branchId: adminData.branchId,
        isActive: true,
      };

      const response = await apiClient.post("/create", payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async updateAdmin(id, updateData) {
    try {
      // Chuẩn bị dữ liệu cập nhật
      const payload = {
        userName: updateData.userName,
        fullName: updateData.fullName,
        email: updateData.email,
        phone: updateData.phone,
        role: updateData.role,
        branchId: updateData.branchId,
        isActive: updateData.isActive,
      };

      // Thêm birthday nếu có
      if (updateData.birthday) {
        payload.birthday = updateData.birthday;
      }

      const response = await apiClient.put(`/update/${id}`, payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async deleteAdmin(id) {
    try {
      const response = await apiClient.delete(`/delete/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  handleError(error) {
    if (error.response) {
      // Lỗi từ phía server
      const { status, data } = error.response;

      let errorMessage = "Đã có lỗi xảy ra";
      if (data && data.message) {
        errorMessage = data.message;
      } else if (data && data.error) {
        errorMessage = data.error;
      }

      // Tạo lỗi mới với thông tin chi tiết
      const apiError = new Error(errorMessage);
      apiError.status = status;
      apiError.details = data;

      // Thêm thông báo cụ thể cho các mã lỗi thường gặp
      if (status === 400) {
        apiError.message = "Dữ liệu không hợp lệ: " + errorMessage;
      } else if (status === 401) {
        apiError.message = "Bạn không có quyền truy cập";
      } else if (status === 404) {
        apiError.message = "Không tìm thấy nhân viên";
      } else if (status === 409) {
        apiError.message = "Tên đăng nhập đã tồn tại";
      } else if (status >= 500) {
        apiError.message = "Lỗi máy chủ: " + errorMessage;
      }

      return apiError;
    } else if (error.request) {
      // Không nhận được phản hồi từ server
      const networkError = new Error(
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng."
      );
      networkError.isNetworkError = true;
      return networkError;
    } else {
      // Lỗi khi thiết lập request
      return new Error("Lỗi khi thiết lập yêu cầu: " + error.message);
    }
  },
};

export default employeeApi;
