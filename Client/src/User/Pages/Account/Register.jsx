import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import authApi from "../../../api/authApi";

export default function Register() {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, phone, firstName, lastName, userName, password } = formData;

    if (!email || !phone || !firstName || !lastName || !userName || !password) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      await authApi.register(formData);
      toast.success("Đăng ký thành công!");
      setFormData({
        email: "",
        phone: "",
        firstName: "",
        lastName: "",
        userName: "",
        password: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng ký không thành công!");
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
              "url('https://img.freepik.com/free-photo/top-view-table-full-delicious-food_23-2149141463.jpg')",
            backgroundSize: "cover",
          }}
        >
          <div className="absolute inset-0 bg-[#51bb1a] bg-opacity-50 flex items-center justify-center">
            <h2 className="text-4xl font-bold text-white text-center px-8">
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

          <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full mt-4 p-3 bg-[#51bb1a] text-white rounded-lg hover:bg-[#51bb1a] transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#51bb1a]"
            >
              ĐĂNG KÝ
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
