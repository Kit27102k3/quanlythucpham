import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { FloatLabel } from "primereact/floatlabel";
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await authApi.login({ userName: username, password });
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("userId", response.data.userId);
      setIsLoggedIn(true);
      toast.success("Đăng nhập thành công!");
      navigate("/");
    } catch (error) {
      toast.error("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8 background-login">
      <ToastContainer />
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl overflow-hidden grid md:grid-cols-2">
        <div className="p-10 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              DNC <span className="text-[#51bb1a]">FOOD</span>
            </h1>
            <p className="text-gray-600">Chào mừng quay trở lại!</p>
          </div>

          <div className="flex space-x-4 mb-6 gap-4">
            <button className="flex-1 flex items-center cursor-pointer justify-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
              <FaFacebook className="mr-2" /> Facebook
            </button>
            <button className="flex-1 flex items-center cursor-pointer justify-center bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition">
              <FaGoogle className="mr-2" /> Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">
              Hoặc đăng nhập bằng tài khoản
            </span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6 ">
            <div className="relative mb-2">
              <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51bb1a]"
                required
              />
            </div>

            <div className="relative mb-2">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51bb1a]"
                required
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
              className="w-full bg-[#51bb1a] text-white py-3 rounded-lg hover:bg-[#51bb1a] transition font-semibold cursor-pointer"
            >
              ĐĂNG NHẬP
            </button>
          </form>
        </div>

        {/* Background Image Section */}
        <div className="hidden md:block">
          <img
            src="https://imgs.search.brave.com/-iKO9iDdLIcHOwXs51kpeiQB7vWzM3DBw9Ph4mBZL3U/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZWRlbGl2ZXJ5Lm5l/dC9aZUd0c0dTanVR/ZTFQM1VQX3prM2ZR/LzMxNzZlNjc0LTg1/NDgtNDJiMC05OWMz/LWViYTNjNmFlNzcw/MC9zdG9yZWRhdGE"
            alt="Fresh Food Market"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog
        header="QUÊN MẬT KHẨU"
        visible={visible}
        style={{ width: "500px" }}
        onHide={() => setVisible(false)}
      >
        <ForgotPassword />
      </Dialog>
    </div>
  );
};

export default Login;
