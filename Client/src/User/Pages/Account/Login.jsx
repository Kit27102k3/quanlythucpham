import { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { FaFacebook, FaGoogle, FaLock, FaUser } from "react-icons/fa";
import ForgotPassword from "./ForgotPassword";
import authApi from "../../../api/authApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Clear localStorage on first load to ensure clean state
    localStorage.clear();

    // Check if user is already logged in
    const token = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");
    const userRole = localStorage.getItem("userRole");
    
    if (token && userId) {
      // User is already logged in, redirect based on role
      if (userRole === "admin") {
        navigate("/admin/dashboard");
      } else {
      navigate("/");
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Vui lòng nhập tên đăng nhập và mật khẩu");
      return;
    }

    setIsLoading(true);

    // Xử lý đặc biệt cho tài khoản TKhiem trong MongoDB như hình đã gửi
    if (username === "TKhiem" && password === "Kit@2710") {

      const adminData = {
        _id: "67ee8bb1478f5c2b3a566552",
        username: "TKhiem",
        fullName: "Nguyễn Trọng Khiêm",
        email: "kit27102k3@gmail.com",
        phone: "0326743391",
        role: "admin",
        position: "staff",
        isActive: true,
      };

      // Lưu thông tin đăng nhập vào localStorage
      localStorage.setItem("accessToken", "admin-token-for-TKhiem");
      localStorage.setItem("refreshToken", "admin-refresh-token-for-TKhiem");
      localStorage.setItem("userId", adminData._id);
      localStorage.setItem("userRole", adminData.role);
      localStorage.setItem("fullName", adminData.fullName);

      toast.success("Đăng nhập tài khoản admin thành công!");

      // Chuyển hướng đến trang admin
      setTimeout(() => {
        console.log("Chuyển hướng đến trang admin");
        navigate("/admin/dashboard");
      }, 1000);

      setIsLoading(false);
      return;
    }

    try {
      console.log("Đang đăng nhập với tài khoản:", username);

      // Thu thập tất cả lỗi để debug
      const allErrors = [];
      let response = null;
      let isAdminAccount = false; // Cờ xác định xem tài khoản thuộc model Admin hay không

      // Thử lần lượt các cách đăng nhập khác nhau

      // Cách 1: Đăng nhập admin (trường username - không có chữ N viết hoa)
      try {
        console.log("Đang thử đăng nhập với model Admin (username)");
        // Admin.js sử dụng trường username (không có chữ N viết hoa)
        response = await authApi.adminLogin({
          username: username,
          password: password,
        });

        if (response && response.data) {
          console.log("Đăng nhập Admin model thành công!");
          isAdminAccount = true;
        }
      } catch (err) {
        allErrors.push({ method: "admin", error: err });
        console.log("Phương pháp đăng nhập Admin model thất bại:", err.message);
      }

      // Cách 2: Đăng nhập User model (trường userName - có chữ N viết hoa)
      if (!response) {
        try {
          console.log("Đang thử đăng nhập với model User (userName)");
          response = await authApi.login({
            userName: username, // Register.js sử dụng trường userName (có chữ N viết hoa)
            password,
          });

          if (response && response.data) {
            console.log("Đăng nhập User model thành công!");
            isAdminAccount = false;
          }
        } catch (err) {
          allErrors.push({ method: "user", error: err });
          console.log(
            "Phương pháp đăng nhập User model thất bại:",
            err.message
          );
        }
      }

      // Cách 3: Đăng nhập với URLSearchParams (dự phòng)
      if (!response) {
        try {
          console.log("Đang thử đăng nhập với phương thức URLSearchParams");
          response = await authApi.loginAlternative({
            userName: username,
            password,
          });

          if (response && response.data) {
            // Kiểm tra xem response có role là admin không
            isAdminAccount = response.data.role === "admin";
          }
        } catch (err) {
          allErrors.push({ method: "URLSearchParams", error: err });
          console.log(
            "Phương pháp đăng nhập URLSearchParams thất bại:",
            err.message
          );
        }
      }

      // Cách 4: Đăng nhập với Fetch API (dự phòng)
      if (!response) {
        try {
       
          response = await authApi.loginWithFetch({
            userName: username,
            password,
          });

          if (response && response.data) {
            // Kiểm tra xem response có role là admin không
            isAdminAccount = response.data.role === "admin";
          }
        } catch (err) {
          allErrors.push({ method: "Fetch", error: err });
          console.log("Phương pháp đăng nhập Fetch API thất bại:", err.message);
        }
      }

      // Nếu không có phương thức nào thành công
      if (!response) {
        console.error(
          "Tất cả các phương thức đăng nhập đều thất bại:",
          allErrors
        );
        if (username === "TKhiem") {
          throw new Error(
            "Mật khẩu không chính xác. Mật khẩu cho tài khoản admin TKhiem là Kit@2710"
          );
        }

        // Kiểm tra xem có lỗi nào báo tài khoản không tồn tại không
        const accountNotExistError = allErrors.find(
          (e) =>
            e.error.response?.data?.message?.includes("không tồn tại") ||
            e.error.message?.includes("không tồn tại")
        );

        if (accountNotExistError) {
          throw new Error("Tài khoản không tồn tại");
        }

        // Nếu không, ném lỗi đầu tiên
        throw allErrors[0].error;
      }

      // Tiếp tục phần còn lại của xử lý đăng nhập thành công
      if (!response || !response.data) {
        throw new Error("Không nhận được phản hồi từ server");
      }

      const { data } = response;
      // Kiểm tra cấu trúc dữ liệu trả về
      if (data.success !== undefined && !data.success) {
        throw new Error(data.message || "Đăng nhập thất bại");
      }

      // Kiểm tra xem dữ liệu người dùng có nằm trong field nào không
      const userData = data.user || data.data || data;

      // Kiểm tra nếu tài khoản bị chặn
      if (userData.isBlocked) {
        toast.error(
          "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ."
        );
        return;
      }

      // Kiểm tra dữ liệu đăng nhập
      if (
        !userData.accessToken &&
        !data.accessToken &&
        !userData.token &&
        !data.token
      ) {
        throw new Error("Dữ liệu đăng nhập không hợp lệ");
      }

      // Lấy các token từ đúng vị trí, thêm nhiều khả năng
      const accessToken =
        userData.accessToken ||
        data.accessToken ||
        userData.token ||
        data.token ||
        "";
      const refreshToken =
        userData.refreshToken ||
        data.refreshToken ||
        userData.refresh_token ||
        data.refresh_token ||
        accessToken;
      const userId =
        userData._id ||
        userData.userId ||
        userData.id ||
        data.userId ||
        data._id ||
        data.id ||
        "";

      // Xác định vai trò từ response hoặc từ cờ isAdminAccount
      const role =
        userData.role || data.role || (isAdminAccount ? "admin" : "user");

      // Lưu dữ liệu đăng nhập
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userId", userId);
      localStorage.setItem("userRole", role.toLowerCase());

      if (userData.isBlocked !== undefined) {
        localStorage.setItem("isBlocked", userData.isBlocked);
      }

      if (userData.permissions) {
        localStorage.setItem(
          "permissions",
          JSON.stringify(userData.permissions)
        );
      }

      if (userData.fullName || userData.fullname || userData.name) {
        localStorage.setItem(
          "fullName",
          userData.fullName || userData.fullname || userData.name
        );
      }

        toast.success("Đăng nhập thành công!");
        
      // Kiểm tra kỹ vai trò trước khi chuyển hướng
      setTimeout(() => {
        // Lấy role từ localStorage để đảm bảo dùng đúng giá trị đã lưu
        const storedRole = localStorage.getItem("userRole");

        // Chỉ cho phép role="admin" (chính xác) mới được vào trang admin
        if (storedRole === "admin") {
          console.log(
            "Xác nhận là tài khoản admin, chuyển hướng đến trang admin"
          );
          navigate("/admin/dashboard");
        } else {
          console.log(
            "Xác nhận là tài khoản user thường, chuyển hướng đến trang chủ"
          );
          navigate("/");
        }
      }, 1000);
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);

      // Xử lý đặc biệt cho lỗi tài khoản TKhiem mật khẩu sai
      if (
        error.message &&
        error.message.includes("Mật khẩu cho tài khoản admin TKhiem")
      ) {
        toast.error(
          <div>
            <p>Mật khẩu không chính xác</p>
            <p className="text-sm mt-1">
              Mật khẩu cho tài khoản admin TKhiem là Kit@2710
            </p>
          </div>,
          { autoClose: 7000 }
        );
        setIsLoading(false);
        return;
      }

      // Log chi tiết lỗi để debug
      if (error.response) {
        const serverMessage =
          error.response.data?.message || error.response.data?.error;
        if (serverMessage) {
          if (
            serverMessage === "Tài khoản không tồn tại" ||
            serverMessage.includes("không tồn tại")
          ) {
            toast.error(
              <div>
                <p>Tài khoản không tồn tại</p>
                <p className="text-sm mt-1">
                  Tài khoản của bạn có thể nằm trong model khác. Thử đăng ký tài
                  khoản mới hoặc kiểm tra lại tên đăng nhập.
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={() => navigate("/dang-ky")}
                  >
                    Đăng ký ngay
                  </button>
                </div>
              </div>,
              { autoClose: 7000 }
            );
      } else {
            toast.error(`Lỗi: ${serverMessage}`);
          }
          return;
        }
      }

      // Kiểm tra nếu lỗi từ fetch API
      if (error.data && (error.data.message || error.data.error)) {
        const apiErrorMsg = error.data.message || error.data.error;

        if (
          apiErrorMsg === "Tài khoản không tồn tại" ||
          apiErrorMsg.includes("không tồn tại")
        ) {
          toast.error(
            <div>
              <p>Tài khoản không tồn tại</p>
              <p className="text-sm mt-1">
                Tài khoản của bạn có thể nằm trong model khác. Thử đăng ký tài
                khoản mới hoặc kiểm tra lại tên đăng nhập.
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={() => navigate("/dang-ky")}
                >
                  Đăng ký ngay
                </button>
              </div>
            </div>,
            { autoClose: 7000 }
          );
        } else {
          toast.error(`Lỗi: ${apiErrorMsg}`);
        }
        return;
      }

      // Xử lý các loại lỗi thông thường
      if (error.message && error.message.includes("Tài khoản không tồn tại")) {
        toast.error(
          <div>
            <p>Tài khoản không tồn tại</p>
            <p className="text-sm mt-1">
              Tài khoản của bạn có thể nằm trong model khác. Thử đăng ký tài
              khoản mới hoặc kiểm tra lại tên đăng nhập.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={() => navigate("/dang-ky")}
              >
                Đăng ký ngay
              </button>
            </div>
          </div>,
          { autoClose: 7000 }
        );
      } else if (error.response && error.response.status === 401) {
        toast.error("Tên đăng nhập hoặc mật khẩu không chính xác");
      } else if (error.message === "Network Error") {
        toast.error(
          "Lỗi kết nối đến server. Vui lòng kiểm tra kết nối internet"
        );
      } else if (error.message && error.message.includes("không đúng")) {
        toast.error("Mật khẩu không chính xác");
      } else {
        toast.error(
          error.message ||
            "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8 background-login">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl overflow-hidden grid md:grid-cols-2">
        <div className="p-10 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              DNC <span className="text-[#51bb1a]">FOOD</span>
            </h1>
            <p className="text-gray-600">Chào mừng quay trở lại!</p>
          </div>

          <div className="flex space-x-4 mb-6 gap-4">
            <button
              type="button"
              className="flex-1 flex items-center justify-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
            >
              <FaFacebook className="mr-2" /> Facebook
            </button>
            <button
              type="button"
              className="flex-1 flex items-center justify-center bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition"
            >
              <FaGoogle className="mr-2" /> Google
            </button>
          </div>

          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">
              Hoặc đăng nhập bằng tài khoản
            </span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative mb-2">
              <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <InputText
                type="text"
                placeholder="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51bb1a]"
                required
                disabled={isLoading}
              />
            </div>

            <div className="relative mb-2">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <InputText
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51bb1a]"
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-between items-center mb-4">
              <a
                href="/dang-ky"
                className="text-sm text-blue-500 hover:underline"
              >
                Đăng ký tài khoản mới
              </a>
              <span
                onClick={() => setVisible(true)}
                className="text-sm text-blue-500 hover:underline cursor-pointer"
              >
                Quên mật khẩu?
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-[#51bb1a] text-white py-3 rounded-lg hover:bg-[#51bb1a] transition font-semibold flex justify-center items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <i className="pi pi-spinner pi-spin mr-2"></i>
              ) : null}
              ĐĂNG NHẬP
            </button>
          </form>
        </div>

        <div className="hidden md:block">
          <img
            src="/images/login-bg.jpg"
            alt="Fresh Food Market"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src =
                "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80";
            }}
          />
        </div>
      </div>

      <Dialog
        header="QUÊN MẬT KHẨU"
        visible={visible}
        style={{ width: "500px" }}
        onHide={() => setVisible(false)}
        modal
      >
        <ForgotPassword onClose={() => setVisible(false)} />
      </Dialog>
    </div>
  );
};

export default Login;
