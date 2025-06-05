import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { API_BASE_URL } from "../../../config/apiConfig";

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("Token expired, attempting to refresh...");
        // Try to refresh token
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/admin/auth/refresh-token`,
          {
            refreshToken,
          }
        );

        if (response.data && response.data.accessToken) {
          console.log("Token refreshed successfully");
          // Store new tokens
          localStorage.setItem("accessToken", response.data.accessToken);
          if (response.data.refreshToken) {
            localStorage.setItem("refreshToken", response.data.refreshToken);
          }

          // Update authorization header and retry original request
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return axios(originalRequest);
        } else {
          console.log("Token refresh response did not contain a new token");
          throw new Error("Failed to refresh token");
        }
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
        // Clear tokens and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const AdminProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [admin, setAdmin] = useState({
    fullName: "",
    email: "",
    phone: "",
    userName: "",
    birthday: "",
    avatar: "",
    role: "",
    position: "",
    branchId: "",
  });
  const [branches, setBranches] = useState([]);
  const [previewImage, setPreviewImage] = useState("");

  // Function to set test data
  const setTestData = async () => {
    try {
      // Hiển thị form nhập token
      const token = prompt("Nhập access token:");
      if (!token) {
        toast.error("Bạn chưa nhập token!");
        return;
      }

      // Lưu token vào localStorage
      localStorage.setItem("accessToken", token);

      // Tùy chọn: Nhập refresh token
      const refreshToken = prompt("Nhập refresh token (không bắt buộc):");
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      toast.success("Token đã được thiết lập! Đang tải dữ liệu...");

      // Fetch the user data from the server using the token
      await fetchAdminData();
    } catch (error) {
      console.error("Error setting test data:", error);
      toast.error("Không thể thiết lập dữ liệu thử nghiệm");
    }
  };

  // Function to handle direct login for testing
  const handleDirectLogin = async () => {
    try {
      setLoading(true);

      // Try to login as admin
      const loginResponse = await api.post(`/api/admin/auth/login`, {
        userName: "TKhiem2710",
        password: "Kit@2710",
      });

      console.log("Login response:", loginResponse.data);

      if (loginResponse.data && loginResponse.data.accessToken) {
        // Store token in localStorage
        localStorage.setItem("accessToken", loginResponse.data.accessToken);
        localStorage.setItem(
          "refreshToken",
          loginResponse.data.refreshToken || ""
        );
        localStorage.setItem("userId", loginResponse.data.userId || "");
        localStorage.setItem("userRole", loginResponse.data.role || "admin");

        toast.success("Đăng nhập thành công! Đang tải thông tin...");

        // Fetch admin data again
        fetchAdminData();
      } else {
        toast.error("Đăng nhập thất bại!");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(
        "Đăng nhập thất bại: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Try both token keys
      let token = localStorage.getItem("accessToken");
      if (!token) {
        token = localStorage.getItem("token");
        if (token) {
          console.log(
            "Using 'token' from localStorage instead of 'accessToken'"
          );
          localStorage.setItem("accessToken", token);
        }
      }
      if (!token) {
        toast.error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }

      // Mảng các endpoint để thử
      const endpoints = [
        "/api/admin/me",
        "/api/admin/profile",
        "/api/admins/me",
        "/api/admins/profile",
      ];

      let adminData = null;
      let successEndpoint = null;

      // Thử từng endpoint cho đến khi thành công
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.data) {
            adminData = response.data.data || response.data;
            successEndpoint = endpoint;
            break;
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint} thất bại:`, error.message);
          // Tiếp tục thử endpoint tiếp theo
        }
      }

      if (!adminData) {
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map(function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join("")
          );
          const payload = JSON.parse(jsonPayload);

          toast.error(
            `Không tìm thấy dữ liệu admin. Token có role: ${
              payload.role || "không xác định"
            }, userId: ${payload.id || payload.userId || "không xác định"}`
          );

          // Tạo dữ liệu admin tạm thời từ thông tin token
          if (payload.id || payload.userId) {
            adminData = {
              _id: payload.id || payload.userId,
              fullName: localStorage.getItem("userName") || "Admin",
              email: "",
              phone: "",
              userName: "",
              birthday: "",
              avatar: localStorage.getItem("userAvatar") || "",
              role: payload.role || "admin",
              position: "",
              branchId: "",
            };

            toast.info(
              "Đã tạo dữ liệu tạm thời từ token. Một số chức năng có thể không hoạt động."
            );
          }
        } catch (tokenError) {
          console.error("Error decoding token:", tokenError);
          toast.error("Không thể giải mã token. Token có thể không hợp lệ.");
        }

        if (!adminData) {
          throw new Error("Không thể tải dữ liệu admin từ bất kỳ endpoint nào");
        }
      }

      if (adminData.birthday) {
        try {
          const date = new Date(adminData.birthday);
          adminData.birthday = date.toISOString().substring(0, 10);
        } catch (error) {
          console.error("Error formatting birthday:", error);
          adminData.birthday = "";
        }
      }

      setAdmin(adminData);
      setPreviewImage(adminData.avatar || "/images/avatar.png");

      // Store avatar in localStorage for sidebar
      localStorage.setItem(
        "userAvatar",
        adminData.avatar || "/images/avatar.png"
      );
      localStorage.setItem("userName", adminData.fullName || "Admin");
      localStorage.setItem("userRole", adminData.role || "Quản trị viên");

      if (successEndpoint) {
        toast.success(`Tải dữ liệu thành công từ ${successEndpoint}`);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      } else if (error.response?.status === 404) {
        const errorMsg =
          error.response?.data?.message || "Không tìm thấy dữ liệu người dùng";
        toast.error(`Lỗi: ${errorMsg}. Bạn cần thiết lập token hợp lệ.`);

        const useTestData = window.confirm(
          "Bạn có muốn thiết lập token thử nghiệm không?"
        );
        if (useTestData) {
          setTestData();
          return;
        }
      } else {
        const errorMsg =
          error.response?.data?.message ||
          error.message ||
          "Lỗi không xác định";
        toast.error(`Không thể tải thông tin: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }

    // Only fetch branches if not admin
    if (admin.role !== "admin") {
      // Fetch branches for dropdown in a separate try-catch
      try {
        const token = localStorage.getItem("accessToken");
        const branchesResponse = await api.get(`/api/branches`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (branchesResponse.data) {
          const branchesData =
            branchesResponse.data.data || branchesResponse.data;
          if (Array.isArray(branchesData) && branchesData.length > 0) {
            console.log("Fetched branches:", branchesData);
            setBranches(branchesData);
          } else {
            console.log("No branches found in API response, using empty array");
            setBranches([]);
          }
        } else {
          setBranches([]);
        }
      } catch (branchError) {
        console.error("Error fetching branches:", branchError);
        // Don't show error toast for branches as it's not critical
        console.log("No branches data available");
        setBranches([]);
      }
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Updating field ${name} to ${value}`);
    setAdmin((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file hình ảnh (JPEG, PNG, JPG, GIF, WEBP)");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 2MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload image
    handleImageUpload(file);
  };

  const handleImageUpload = async (file) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("image", file);

      const token = localStorage.getItem("accessToken");
      const response = await api.post(`/api/upload/image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && response.data.imageUrl) {
        setAdmin((prev) => ({
          ...prev,
          avatar: response.data.imageUrl,
        }));
        // Store the avatar URL in localStorage so it appears in the sidebar immediately
        localStorage.setItem("userAvatar", response.data.imageUrl);
        toast.success("Tải ảnh lên thành công!");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(
        error.response?.data?.message ||
          "Tải ảnh lên thất bại. Vui lòng thử lại."
      );
      // Reset preview if upload fails
      setPreviewImage(admin.avatar || "/images/avatar.png");
    } finally {
      setUploadingImage(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      console.log("Submitting form with data:", admin);

      const token = localStorage.getItem("accessToken");
      const response = await api.put(`/api/admin/profile`, admin, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success) {
        toast.success("Cập nhật thông tin thành công!");
        // Update localStorage with new data
        localStorage.setItem(
          "userAvatar",
          admin.avatar || "/images/avatar.png"
        );
        localStorage.setItem("userName", admin.fullName || "Admin");
        localStorage.setItem("userRole", admin.role || "Quản trị viên");
      } else {
        toast.error(
          response.data?.message || "Cập nhật thất bại. Vui lòng thử lại."
        );
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        error.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const oldPassword = e.target.oldPassword.value;
    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp!");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("accessToken");
      const response = await api.put(
        `/api/admin/change-password`,
        { oldPassword, newPassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data) {
        toast.success("Đổi mật khẩu thành công!");
        e.target.reset();
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(
        error.response?.data?.message ||
          "Đổi mật khẩu thất bại. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Thông tin cá nhân
      </h1>

      {/* Add login button for testing */}
      {!admin._id && (
        <div className="mb-6">
          <button
            onClick={handleDirectLogin}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
          >
            Đăng nhập thử nghiệm
          </button>
          <p className="mt-2 text-sm text-gray-600">
            Không thể tải thông tin? Hãy thử đăng nhập lại.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          {/* Avatar Section */}
          <div className="md:w-1/3 bg-gray-50 p-8 flex flex-col items-center justify-start border-r">
            <div className="mb-6 relative">
              <img
                src={previewImage}
                alt="Avatar"
                className="w-48 h-48 rounded-full object-cover border-4 border-green-100"
              />
              {uploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div className="w-full">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/jpeg, image/png, image/jpg, image/gif, image/webp"
                className="hidden"
              />
              <button
                type="button"
                onClick={triggerFileInput}
                disabled={uploadingImage}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {uploadingImage ? "Đang tải lên..." : "Tải ảnh lên"}
              </button>
              <p className="mt-2 text-xs text-gray-500">
                Hỗ trợ định dạng: JPEG, PNG, JPG, GIF, WEBP. Kích thước tối đa:
                2MB.
              </p>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Hình đại diện
                </label>
                <input
                  type="text"
                  name="avatar"
                  value={admin.avatar || ""}
                  onChange={handleChange}
                  placeholder="URL sẽ được cập nhật tự động khi tải ảnh lên"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="md:w-2/3 p-8">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={admin.fullName || ""}
                    onChange={handleChange}
                    required
                    placeholder="Nhập họ và tên"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    name="userName"
                    value={admin.userName || ""}
                    onChange={handleChange}
                    required
                    placeholder="Nhập tên đăng nhập"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={admin.email || ""}
                    onChange={handleChange}
                    required
                    placeholder="Nhập email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={admin.phone || ""}
                    onChange={handleChange}
                    required
                    placeholder="Nhập số điện thoại"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    name="birthday"
                    value={admin.birthday || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chi nhánh
                  </label>
                  <input
                    type="text"
                    value={
                      admin.role === "admin"
                        ? "Quản trị viên (Tất cả chi nhánh)"
                        : typeof admin.branchId === "object" &&
                          admin.branchId !== null
                        ? admin.branchId.name || "Không xác định"
                        : Array.isArray(branches) && admin.branchId
                        ? branches.find(
                            (branch) => branch._id === admin.branchId
                          )?.name || "Không tìm thấy chi nhánh"
                        : "Chưa có chi nhánh"
                    }
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500"
                  />
                  <input
                    type="hidden"
                    name="branchId"
                    value={
                      admin.role === "admin"
                        ? ""
                        : typeof admin.branchId === "object" &&
                          admin.branchId !== null
                        ? admin.branchId._id || ""
                        : admin.branchId || ""
                    }
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {admin.role === "admin"
                      ? "Quản trị viên có quyền truy cập tất cả chi nhánh."
                      : "Chi nhánh được thiết lập bởi quản trị viên và không thể thay đổi."}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vai trò
                  </label>
                  <input
                    type="text"
                    value={admin.role || ""}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chức vụ
                  </label>
                  <input
                    type="text"
                    value={admin.position || ""}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500"
                  />
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400"
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="border-t border-gray-200 p-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">
            Đổi mật khẩu
          </h2>

          <form onSubmit={handlePasswordChange} className="max-w-md">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  name="oldPassword"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  name="newPassword"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="mt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
                >
                  {saving ? "Đang xử lý..." : "Đổi mật khẩu"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
