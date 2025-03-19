import axios from "axios";

const API_URL = "http://localhost:8080/auth";

const authApi = {
  register: (userData) =>
    axios.post(`${API_URL}/register`, userData, { withCredentials: true }),
  login: (credentials) =>
    axios.post(`${API_URL}/login`, credentials, { withCredentials: true }),
  refreshToken: () =>
    axios.post(`${API_URL}/refresh-token`, {
      refreshToken: localStorage.getItem("refreshToken"),
    }),
  logout: () => axios.post(`${API_URL}/logout`, {}, { withCredentials: true }),
  getProfile: () => axios.get(`${API_URL}/profile`),
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const response = await authApi.refreshToken();
        const newAccessToken = response.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


export default authApi;
