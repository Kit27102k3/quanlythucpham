import React, { useState } from "react";
import authApi from "../../../api/authApi";
import { InputText } from "primereact/inputtext";
import { FloatLabel } from "primereact/floatlabel";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    userName: "",
    address: "",
    password: "",
    userImage: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const { email, phone, firstName, lastName, userName, password } = formData;
    if (!email || !phone || !firstName || !lastName || !userName || !password) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return false;
    }
    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await authApi.register(formData);
      toast.success("Đăng ký thành công!");
      setFormData({
        email: "",
        phone: "",
        firstName: "",
        lastName: "",
        userName: "",
        password: "",
        address: "",
        userImage: "",
      });
    } catch (error) {
      if (error.response && error.response.data) {
        const { message } = error.response.data;
        if (message.includes("duplicate key error")) {
          toast.error(
            "Tên người dùng hoặc email đã tồn tại. Vui lòng chọn tên khác."
          );
        } else {
          toast.error(message || "Đăng ký không thành công!");
        }
      } else {
        toast.error("Đăng ký không thành công!");
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <ToastContainer />
      <div className="w-full md:w-1/2">
        <img
          src="https://imgs.search.brave.com/-iKO9iDdLIcHOwXs51kpeiQB7vWzM3DBw9Ph4mBZL3U/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZWRlbGl2ZXJ5Lm5l/dC9aZUd0c0dTanVR/ZTFQM1VQX3prM2ZR/LzMxNzZlNjc0LTg1/NDgtNDJiMC05OWMz/LWViYTNjNmFlNzcw/MC9zdG9yZWRhdGE"
          alt="Login Banner"
          className="w-full h-full object-cover"
        />
      </div>
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
          Vui lòng đăng ký tài khoản của bạn!
        </p>
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-6 w-full md:w-[400px]">
          <button className="p-2 w-full bg-blue-600 text-white cursor-pointer rounded">
            Login with Facebook
          </button>
          <button className="p-2 w-full bg-red-600 text-white cursor-pointer rounded">
            Login with Google
          </button>
        </div>

        <form onSubmit={handleSubmit} className="w-full md:w-[400px]">
          <div className="flex flex-col md:flex-row items-center mb-7 gap-7">
            <FloatLabel>
              <InputText
                style={{
                  width: "100%",
                  color: "black",
                  backgroundColor: "white",
                  height: "40px",
                }}
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <label htmlFor="firstName">First Name</label>
            </FloatLabel>
            <FloatLabel>
              <InputText
                style={{
                  width: "100%",
                  color: "black",
                  backgroundColor: "white",
                  height: "40px",
                }}
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
              <label htmlFor="lastName">Last Name</label>
            </FloatLabel>
          </div>

          <div className="flex flex-col gap-7 mb-7">
            <FloatLabel>
              <InputText
                style={{
                  width: "100%",
                  color: "black",
                  backgroundColor: "white",
                  height: "40px",
                }}
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <label htmlFor="phone">Phone</label>
            </FloatLabel>
            <FloatLabel>
              <InputText
                style={{
                  width: "100%",
                  color: "black",
                  backgroundColor: "white",
                  height: "40px",
                }}
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <label htmlFor="email">Email</label>
            </FloatLabel>
          </div>

          {/* Username and Password */}
          <div className="flex flex-col gap-7">
            <FloatLabel>
              <InputText
                style={{
                  width: "100%",
                  color: "black",
                  backgroundColor: "white",
                  height: "40px",
                }}
                id="userName"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                required
              />
              <label htmlFor="userName">Username</label>
            </FloatLabel>
            <FloatLabel>
              <InputText
                style={{
                  width: "100%",
                  color: "black",
                  backgroundColor: "white",
                  height: "40px",
                }}
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <label htmlFor="password">Password</label>
            </FloatLabel>
          </div>

          <div className="mt-5 flex flex-col md:flex-row items-center justify-between text-sm">
            <div>
              Đã có tài khoản{" "}
              <a href="dang-nhap" className="text-blue-500 font-semibold">
                Đăng nhập tại đây
              </a>
            </div>
          </div>

          <button
            type="submit"
            className="p-3 w-full bg-[#51aa1b] text-white rounded mt-6 cursor-pointer text-[14px] hover:opacity-90"
          >
            ĐĂNG KÝ
          </button>
        </form>
      </div>
    </div>
  );
}
