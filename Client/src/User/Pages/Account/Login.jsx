import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { FloatLabel } from "primereact/floatlabel";
import { Dialog } from "primereact/dialog";
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
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <ToastContainer />
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-10 shadow-lg">
        <a
          href="/"
          className="uppercase text-black text-center text-3xl md:text-4xl font-bold mb-6"
        >
          Welcome To{" "}
          <h3 className="text-3xl md:text-4xl font-bold">
            DNC<span className="text-green-500"> FO</span>OD
          </h3>
        </a>
        <p className="mb-4 text-sm md:text-base text-center">
          Vui lòng đăng nhập tài khoản của bạn!
        </p>

        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-6 w-full md:w-[400px]">
          <button className="p-2 w-full bg-blue-600 text-white cursor-pointer rounded">
            Login with Facebook
          </button>
          <button className="p-2 w-full bg-red-600 text-white cursor-pointer rounded">
            Login with Google
          </button>
        </div>

        <form
          onSubmit={handleLogin}
          className="w-full md:w-[400px] flex flex-col gap-6"
        >
          <FloatLabel>
            <InputText
              style={{
                width: "100%",
                color: "black",
                backgroundColor: "white",
                height: "40px",
                border: "1px solid #ced4da",
              }}
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <label className="-mt-2" htmlFor="username">
              Username
            </label>
          </FloatLabel>

          <FloatLabel>
            <InputText
              style={{
                width: "100%",
                color: "black",
                backgroundColor: "white",
                height: "40px",
                border: "1px solid #ced4da",
              }}
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label className="-mt-2" htmlFor="password">
              Password
            </label>
          </FloatLabel>

          <div className="mt-5 flex flex-col md:flex-row items-center justify-between w-full text-sm">
            <div>
              Chưa có tài khoản?{" "}
              <a href="dang-ky" className="text-blue-500 font-semibold">
                Đăng ký tại đây
              </a>
            </div>
            <div
              onClick={() => setVisible(true)}
              className="text-blue-500 font-semibold cursor-pointer"
            >
              Quên mật khẩu?
            </div>
          </div>

          <button
            type="submit"
            className="p-3 w-full bg-[#51aa1b] text-white rounded mt-6 cursor-pointer text-[14px] hover:opacity-90"
          >
            ĐĂNG NHẬP
          </button>
        </form>

        <Dialog
          header="QUÊN MẬT KHẨU"
          visible={visible}
          style={{ width: "600px" }}
          contentStyle={{ backgroundColor: "white" }}
          headerStyle={{ backgroundColor: "white", color: "black" }}
          onHide={() => setVisible(false)}
          headerClassName="p-4"
        >
          <div className="mt-2">
            <ForgotPassword />
          </div>
        </Dialog>
      </div>
      <div className="w-full md:w-1/2">
        <img
          src="https://imgs.search.brave.com/-iKO9iDdLIcHOwXs51kpeiQB7vWzM3DBw9Ph4mBZL3U/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZWRlbGl2ZXJ5Lm5l/dC9aZUd0c0dTanVR/ZTFQM1VQX3prM2ZR/LzMxNzZlNjc0LTg1/NDgtNDJiMC05OWMz/LWViYTNjNmFlNzcw/MC9zdG9yZWRhdGE"
          alt="Login Banner"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default Login;
