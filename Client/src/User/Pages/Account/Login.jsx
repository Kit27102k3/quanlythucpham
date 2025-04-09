import { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { FaFacebook, FaGoogle, FaLock, FaUser } from "react-icons/fa";
import ForgotPassword from "./ForgotPassword";
import authApi from "../../../api/authApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");
    
    if (token && userId) {
      // User is already logged in, redirect to home page
      navigate("/");
    }
  }, [navigate]);

  // const handleAdminLogin = async () => {
  //   try {
  //     const response = await authApi.adminLogin({
  //       userName: username,
  //       password,
  //     });

  //     if (response.data && response.data.accessToken) {
  //       saveAuthData(response.data);
  //       toast.success("Đăng nhập admin thành công!");
  //       navigate("/admin/dashboard");
  //     } else {
  //       throw new Error("Không phải tài khoản admin");
  //     }
  //   } catch (error) {
  //     toast.error("Lỗi đăng nhập admin. Thử đăng nhập user...");
  //     console.error(error);
  //     handleUserLogin();
  //   }
  // };

  const handleUserLogin = async () => {
    try {
      const response = await authApi.login({ userName: username, password });

      if (response.data && response.data.accessToken) {
        // Kiểm tra người dùng có bị chặn hay không
        if (response.data.isBlocked) {
          toast.error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.");
          return;
        }
        
        saveAuthData(response.data);
        toast.success("Đăng nhập thành công!");
        
        // Kiểm tra role và chuyển hướng
        if (response.data.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }
      } else {
        toast.error("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
      }
    } catch (userError) {
      // Kiểm tra nếu lỗi là do tài khoản bị chặn
      if (userError.response?.data?.message === "Account is blocked") {
        toast.error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.");
      } else {
        toast.error("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
      }
      console.error(
        "Lỗi đăng nhập user:",
        userError.response?.data || userError.message
      );
    }
  };

  const saveAuthData = (data) => {
    if (!data.accessToken || !data.refreshToken || !data.userId) {
      throw new Error("Dữ liệu đăng nhập không hợp lệ");
    }

    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("userRole", data.role || "user");
    
    // Lưu trạng thái isBlocked
    if (data.isBlocked !== undefined) {
      localStorage.setItem("isBlocked", data.isBlocked);
    }

    if (data.permissions) {
      localStorage.setItem("permissions", JSON.stringify(data.permissions));
    }

    if (data.fullName) {
      localStorage.setItem("fullName", data.fullName);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    handleUserLogin()
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8 background-login">
      <ToastContainer position="top-right" autoClose={3000} />
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
