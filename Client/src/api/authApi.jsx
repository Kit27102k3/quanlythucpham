import axios from "axios";
import { toast } from "sonner";
import { API_BASE_URL, API_URLS } from "../config/apiConfig";

const instance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) =>
    error ? prom.reject(error) : prom.resolve(token)
  );
  failedQueue = [];
};

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url === "/auth/logout") {
      localStorage.clear();
      window.location.href = "/dang-nhap";
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login") &&
      !originalRequest.url.includes("/auth/register")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token found");
        }

        const response = await axios.post(`${API_URLS.AUTH}/refresh-token`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
          instance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          processQueue(null, accessToken);
          return instance(originalRequest);
        } else {
          throw new Error("Failed to refresh token");
        }
      } catch (err) {
        processQueue(err, null);
        localStorage.clear();
        toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!");
        setTimeout(() => {
          window.location.href = "/dang-nhap";
        }, 500);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

const authApi = {
  register: async (userData) => {
    try {
      // Thêm validation dữ liệu trước khi gửi
      if (!userData.email || !userData.password || !userData.userName) {
        throw new Error("Vui lòng điền đầy đủ thông tin");
      }

      console.log("Sending registration data:", {
        ...userData,
        password: "[HIDDEN]", // Ẩn mật khẩu trong log
      });

      const response = await instance.post(
        `${API_URLS.AUTH}/register`,
        userData
      );

      if (response.data && response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }

      return response;
    } catch (error) {
      console.error("Registration error:", error);

      // Ghi lại chi tiết lỗi để dễ debug
      if (error.response) {
        console.error("Server response error:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      } else if (error.request) {
        console.error("No response received:", error.request);
      }

      // Xử lý lỗi từ server và trả về message cụ thể
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw error;
    }
  },

  login: async (credentials) => {
    try {
      const loginData = {
        userName: credentials.userName || credentials.username, // Cho Register.js
        username: credentials.userName || credentials.username, // Cho Admin.js
        user_name: credentials.userName || credentials.username, // Dự phòng
        password: credentials.password,
      };

      const response = await axios.post(`${API_URLS.AUTH}/login`, loginData, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      // Check if this is an admin account based on response
      if (response.data && response.data.role === "admin") {
        console.log("Đây là tài khoản admin");
      } else {
        console.log("Đây là tài khoản user thông thường");
      }
      return response;
    } catch (error) {
      console.error("Login error:", error);

      if (error.response) {
        console.error("Error details:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        });
      }

      throw error;
    }
  },

  loginAlternative: async (credentials) => {
    try {
      const formData = new URLSearchParams();
      formData.append("userName", credentials.userName);
      formData.append("username", credentials.userName);
      formData.append("user_name", credentials.userName);
      formData.append("password", credentials.password);

      const response = await axios.post(`${API_URLS.AUTH}/login`, formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
      });

      return response;
    } catch (error) {
      if (error.response) {
        console.error("Error details:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        });
      }

      throw error;
    }
  },

  adminLogin: async (credentials) => {
    try {
      const loginData = {
        userName: credentials.userName || credentials.username,
        password: credentials.password,
      };
      // Gọi đúng endpoint đăng nhập admin
      const response = await axios.post(`${API_BASE_URL}/admin/auth/login`, loginData, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      return response;
    } catch (error) {
      console.error("Admin login API error:", error);
      if (error.response) {
        console.error("Error details:", error.response.data);
      }
      throw error;
    }
  },

  logout: async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await axios
          .post(
            `${API_URLS.AUTH}/logout`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
          .catch(() => {});
      }
    } finally {
      localStorage.clear();
      toast.success("Đăng xuất thành công!");
      window.location.href = "/";
    }
  },

  getProfile: async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User not logged in");

      // Lấy token từ nhiều nguồn khác nhau
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        "admin-token-for-TKhiem"; // Fallback token

      return await axios.get(`${API_URLS.AUTH}/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error getting profile:", error);
      throw error;
    }
  },

  getUserById: (id) => {
    if (!id) throw new Error("User ID is required");
    return instance.get(`${API_URLS.AUTH}/profile/${id}`);
  },

  updateProfile: async (userId, data) => {
    try {
      // Lấy token từ localStorage
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("access_token");

      if (!token) {
        throw new Error("User not authenticated");
      }

      // Kiểm tra nếu data là FormData hoặc đã có userImage thì gửi dưới dạng application/json
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      if (data.userImage) {
        headers["Content-Type"] = "application/json";
      }

      return await axios.put(`${API_URLS.AUTH}/update/${userId}`, data, {
        headers,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  requestPasswordReset: (data) =>
    instance.post(`${API_URLS.AUTH}/request-password-reset`, data),

  resetPassword: async (data) => {
    return instance.post(`${API_URLS.AUTH}/reset-password`, data);
  },

  // Phương thức đăng nhập thay thế sử dụng Fetch API
  loginWithFetch: async (credentials) => {
    try {
      const requestData = {
        userName: credentials.userName,
        username: credentials.userName,
        user_name: credentials.userName,
        password: credentials.password,
      };

      const response = await fetch(`${API_URLS.AUTH}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestData),
        credentials: "include", // Thử với credentials include
      });

      const data = await response.json();

      return {
        data: data,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      console.error("Login with fetch error:", error);
      throw error;
    }
  },

  // Methods for address management
  getAllAddresses: async (userId) => {
    try {
      const token = localStorage.getItem("accessToken") || 
                  localStorage.getItem("token") ||
                  localStorage.getItem("access_token");
                  
      if (!token) {
        throw new Error("User not authenticated");
      }
      
      return await axios.get(`${API_URLS.AUTH}/user/${userId}/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error("Error fetching addresses:", error);
      throw error;
    }
  },
  
  addAddress: async (userId, addressData) => {
    try {
      const token = localStorage.getItem("accessToken") || 
                  localStorage.getItem("token") ||
                  localStorage.getItem("access_token");
                  
      if (!token) {
        throw new Error("User not authenticated");
      }
      
      return await axios.post(`${API_URLS.AUTH}/user/${userId}/addresses`, addressData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
    } catch (error) {
      console.error("Error adding address:", error);
      throw error;
    }
  },
  
  updateAddress: async (userId, addressId, addressData) => {
    try {
      const token = localStorage.getItem("accessToken") || 
                  localStorage.getItem("token") ||
                  localStorage.getItem("access_token");
                  
      if (!token) {
        throw new Error("User not authenticated");
      }
      
      return await axios.put(`${API_URLS.AUTH}/user/${userId}/addresses/${addressId}`, addressData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
    } catch (error) {
      console.error("Error updating address:", error);
      throw error;
    }
  },
  
  deleteAddress: async (userId, addressId) => {
    try {
      const token = localStorage.getItem("accessToken") || 
                  localStorage.getItem("token") ||
                  localStorage.getItem("access_token");
                  
      if (!token) {
        throw new Error("User not authenticated");
      }
      
      return await axios.delete(`${API_URLS.AUTH}/user/${userId}/addresses/${addressId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error("Error deleting address:", error);
      throw error;
    }
  },
  
  setDefaultAddress: async (userId, addressId) => {
    try {
      const token = localStorage.getItem("accessToken") || 
                  localStorage.getItem("token") ||
                  localStorage.getItem("access_token");
                  
      if (!token) {
        throw new Error("User not authenticated");
      }
      
      return await axios.put(`${API_URLS.AUTH}/user/${userId}/addresses/${addressId}/default`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
    } catch (error) {
      console.error("Error setting default address:", error);
      throw error;
    }
  },
};

export { authApi, instance };
