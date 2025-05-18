/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {authApi} from "../../../api/authApi";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    userName: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const { email, phone, firstName, lastName, userName, password } = formData;

    if (!email) return "Email không được để trống";
    if (!phone) return "Số điện thoại không được để trống";
    if (!firstName) return "Tên không được để trống";
    if (!lastName) return "Họ không được để trống";
    if (!userName) return "Tên đăng nhập không được để trống";
    if (!password) return "Mật khẩu không được để trống";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Email không hợp lệ";
    }

    if (!/^\d{10,11}$/.test(phone)) {
      return "Số điện thoại phải có 10-11 chữ số";
    }

    if (password.length < 8) {
      return "Mật khẩu phải có ít nhất 8 ký tự";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra validation
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authApi.register(formData);

      // Lưu token và thông tin người dùng nếu có
      if (response.data && response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        localStorage.setItem("userId", response.data.userId);
        localStorage.setItem("userRole", response.data.role || "user");
        localStorage.setItem(
          "fullName",
          response.data.fullName || `${formData.firstName} ${formData.lastName}`
        );
      }

      toast.success("Đăng ký tài khoản thành công!");

      // Đặt thời gian chuyển hướng sau khi hiển thị thông báo
      setTimeout(() => {
        navigate("/");
      }, 2000);

      // Reset form
      setFormData({
        email: "",
        phone: "",
        firstName: "",
        lastName: "",
        userName: "",
        password: "",
      });
    } catch (error) {
      let errorMessage = "Đăng ký không thành công!";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center background-login p-4">
      <ToastContainer />

      <div className="w-full max-w-5xl bg-white shadow-2xl rounded-3xl overflow-hidden grid md:grid-cols-2">
        {/* Food Image Section */}
        <div
          className="hidden md:block bg-cover bg-center relative"
          style={{
            backgroundImage:
              "url('https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')",
            backgroundSize: "cover",
          }}
        >
          <div className="absolute inset-0 bg-opacity-50 flex items-center justify-center">
            <h2 className="text-4xl font-bold  text-center px-8">
              Khám Phá Ẩm Thực <br />
              <span className="text-[#51bb1a]">DNC FOOD</span>
            </h2>
          </div>
        </div>

        {/* Registration Form Section */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-center mb-6 text-[#51bb1a]">
            Đăng Ký Tài Khoản
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4 flex flex-col gap-2">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên
                </label>
                <InputText
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#51bb1a]"
                  placeholder="Nhập tên"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ
                </label>
                <InputText
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#51bb1a]"
                  placeholder="Nhập họ"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số Điện Thoại
              </label>
              <InputText
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#51bb1a]"
                placeholder="Nhập số điện thoại"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <InputText
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#51bb1a]"
                placeholder="Nhập email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên Đăng Nhập
              </label>
              <InputText
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#51bb1a]"
                placeholder="Chọn tên đăng nhập"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật Khẩu
              </label>
              <InputText
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#51bb1a]"
                placeholder="Tạo mật khẩu"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full mt-4 p-3 bg-[#51bb1a] text-white rounded-lg ${
                isSubmitting
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-[#51bb1a] hover:scale-105"
              } transition duration-300 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-[#51bb1a]`}
            >
              {isSubmitting ? "ĐANG XỬ LÝ..." : "ĐĂNG KÝ"}
            </button>

            <div className="text-center mt-4 text-sm">
              Đã có tài khoản?{" "}
              <a
                href="/dang-nhap"
                className="text-[#51bb1a] font-semibold hover:underline"
              >
                Đăng nhập ngay
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
