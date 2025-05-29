import axios from "axios";
import { API_BASE_URL } from '../config/apiConfig';
import { instance as axiosInstance } from "./authApi";

const API_URL = `${API_BASE_URL}/api`;

const adminApi = {
  createAdmin: async (adminData) => {
    try {
      console.log("Đang gửi dữ liệu tạo admin:", JSON.stringify(adminData, null, 2));
      
      // Thêm sample data để so sánh
      console.log("Ví dụ dữ liệu mẫu (sẽ thành công):", JSON.stringify({
        userName: "sample_user",
        username: "sample_user",
        fullName: "Nguyễn Văn Sample",
        email: "sample@example.com",
        phone: "0123456789",
        password: "Password123",
        role: "employee",
        branchId: "68374aed10562d7b04a9ac80"
      }, null, 2));
      
      // Sử dụng fetch thay vì axios
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/admin/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(adminData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Lỗi tạo admin từ server:", errorData);
        throw {
          response: {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          }
        };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Lỗi khi tạo admin:", error);
      
      // Log chi tiết về lỗi
      if (error.response) {
        // Server trả về lỗi với mã trạng thái
        console.error("Chi tiết lỗi từ server:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // Nếu là lỗi 500, có thể là vấn đề ở phía server
        if (error.response.status === 500) {
          console.error("Lỗi máy chủ 500, kiểm tra log phía server để biết thêm chi tiết");
        }
      } else if (error.request) {
        // Request đã được gửi nhưng không nhận được response
        console.error("Không nhận được phản hồi từ server:", error.request);
      } else {
        // Lỗi khi thiết lập request
        console.error("Lỗi khi thiết lập request:", error.message);
      }
      
      throw error;
    }
  },

  getAllAdmins: async () => {
    try {
      const response = await axiosInstance.get(`${API_URL}/admin/list`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách admin:", error);
      throw error;
    }
  },

  updateAdmin: async (id, data) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await axios.put(`${API_URL}/admin/${id}`, data, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật admin:", error);
      throw error;
    }
  },

  deleteAdmin: async (id) => {
    try {
      const response = await axiosInstance.delete(`${API_URL}/admin/${id}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi xóa admin:", error);
      throw error;
    }
  },

  getProfile: async (id) => {
    try {
      const response = await axiosInstance.get(`${API_URL}/admin/${id}`);
      return response;
    } catch (error) {
      console.error("Lỗi khi lấy profile admin:", error);
      throw error;
    }
  },

  updateRolePermissions: async (roleKey, permissions) => {
    try {
      const response = await axiosInstance.put(`${API_URL}/roles/${roleKey}/permissions`, { permissions });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật quyền vai trò:", error);
      throw error;
    }
  }
};

export default adminApi;
