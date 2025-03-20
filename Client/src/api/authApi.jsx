import axios from "axios";
import { toast } from "react-toastify";

const API_URL = "http://localhost:8080/auth";

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
      window.location.href = "/";
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
        window.location.href = "/login";
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

  const response = await axios.post(`${API_URL}/refresh-token`, {
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

const authApi = {
  register: (userData) => instance.post("/register", userData),
  login: (credentials) => instance.post("/login", credentials),
  logout: async () => {
    try {
      await instance.post("/logout").catch(() => {});
    } finally {
      localStorage.clear();
      toast.success("Đăng xuất thành công!");
      window.location.href = "/";
    }
  },

  refreshToken: () => refreshToken(),
  getProfile: () => {
    const userId = localStorage.getItem("userId");
    if (!userId) throw new Error("User not logged in");
    return instance.get(`/profile/${userId}`);
  },
};

export default authApi;
