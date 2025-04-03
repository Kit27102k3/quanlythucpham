import axios from "axios";
import { toast } from "react-toastify";

const API_URL = "http://localhost:8080";

const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
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
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url === "/logout") {
      localStorage.clear();
      window.location.href = "/dang-nhap";
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
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
        const newAccessToken = await refreshToken();
        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return instance(originalRequest);
        }
      } catch (err) {
        processQueue(err, null);
        localStorage.clear();
        toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!");
        setTimeout(() => {
          window.location.href = "/dang-nhap";
        }, 500); // Đợi thông báo hiển thị rồi mới chuyển hướng
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

const refreshToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("No refresh token found");

  const response = await axios.post(`${API_URL}/auth/refresh-token`, {
    refreshToken,
  });
  const { accessToken } = response.data;

  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    instance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    return accessToken;
  }

  throw new Error("Failed to refresh token");
};

const userId = localStorage.getItem("userId");

const authApi = {
  register: (userData) => instance.post("/auth/register", userData),
  login: (credentials) =>
    instance.post("/auth/login", {
      userName: credentials.userName,
      password: credentials.password,
    }),
  adminLogin: (credentials) =>
    instance.post("/admin/auth/login", {
      userName: credentials.userName,
      password: credentials.password,
    }),
  logout: async () => {
    try {
      await instance.post("/auth/logout").catch(() => {});
    } finally {
      localStorage.clear();
      toast.success("Đăng xuất thành công!");
      window.location.href = "/";
    }
  },
  refreshToken: () => refreshToken(),
  getProfile: () => {
    if (!userId) throw new Error("User not logged in");
    return instance.get(`/auth/profile/${userId}`);
  },
  getUserById: (id) => {
    if (!id) throw new Error("User ID is required");
    return instance.get(`/auth/profile/${id}`);
  },
  updateProfile: (userId, data) => instance.put(`/auth/update/${userId}`, data),
  requestPasswordReset: (data) =>
    instance.post("/auth/request-password-reset", data),
  resetPassword: async (data) => {
    console.log("Dữ liệu gửi lên API:", data);
    return instance.post("/auth/reset-password", data);
  },
};

export default authApi;
