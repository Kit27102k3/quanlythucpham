import React, { useState } from "react";
import { KeyIcon, CheckIcon, LockIcon } from "lucide-react";

export default function ResetPassword() {
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push("Mật khẩu phải có ít nhất 8 ký tự");
    if (!/[A-Z]/.test(password)) errors.push("Cần ít nhất 1 chữ hoa");
    if (!/[0-9]/.test(password)) errors.push("Cần ít nhất 1 chữ số");
    if (!/[!@#$%^&*]/.test(password))
      errors.push("Cần ít nhất 1 ký tự đặc biệt");
    return errors;
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setPasswords((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let isValid = true;
    const newErrors = {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    };

    if (!passwords.oldPassword) {
      newErrors.oldPassword = "Vui lòng nhập mật khẩu cũ";
      isValid = false;
    }

    // Validate new password
    const newPasswordErrors = validatePassword(passwords.newPassword);
    if (newPasswordErrors.length > 0) {
      newErrors.newPassword = newPasswordErrors[0];
      isValid = false;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
      isValid = false;
    }

    setPasswordErrors(newErrors);

    if (isValid) {
      console.log("Password reset submitted");
    }
  };

  return (
    <div className="max-w-md bg-white rounded-lg  space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <KeyIcon className="w-6 h-6 text-[#51bb1a]" />
        <h2 className="text-xl uppercase font-semibold text-gray-800">
          ĐỔI MẬT KHẨU
        </h2>
      </div>

      <p className="text-sm text-gray-600 flex items-center gap-2 bg-green-50 p-3 rounded-md mb-4">
        <LockIcon className="w-5 h-5 text-[#51bb1a]" />
        Để đảm bảo tính bảo mật vui lòng đặt mật khẩu với ít nhất 8 ký tự
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-2"
            htmlFor="oldPassword"
          >
            MẬT KHẨU CŨ *
          </label>
          <input
            className={`w-full p-2 border rounded-md outline-none 
              ${
                passwordErrors.oldPassword
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-green-500"
              }`}
            type="password"
            id="oldPassword"
            value={passwords.oldPassword}
            onChange={handleInputChange}
            placeholder="Nhập mật khẩu cũ"
            required
          />
          {passwordErrors.oldPassword && (
            <p className="text-red-500 text-xs mt-1">
              {passwordErrors.oldPassword}
            </p>
          )}
        </div>

        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-2 mt-2"
            htmlFor="newPassword"
          >
            MẬT KHẨU MỚI *
          </label>
          <input
            className={`w-full p-2 border rounded-md outline-none 
              ${
                passwordErrors.newPassword
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-green-500"
              }`}
            type="password"
            id="newPassword"
            value={passwords.newPassword}
            onChange={handleInputChange}
            placeholder="Nhập mật khẩu mới"
            required
          />
          {passwordErrors.newPassword && (
            <p className="text-red-500 text-xs mt-1">
              {passwordErrors.newPassword}
            </p>
          )}
        </div>

        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-2 mt-2"
            htmlFor="confirmPassword"
          >
            XÁC NHẬN LẠI MẬT KHẨU *
          </label>
          <input
            className={`w-full p-2 border rounded-md outline-none 
              ${
                passwordErrors.confirmPassword
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-green-500"
              }`}
            type="password"
            id="confirmPassword"
            value={passwords.confirmPassword}
            onChange={handleInputChange}
            placeholder="Xác nhận lại mật khẩu"
            required
          />
          {passwordErrors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">
              {passwordErrors.confirmPassword}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full mt-5 bg-[#51bb1a] text-white py-2 rounded-md 
            hover:bg-[#51bb1a] transition-colors duration-300 
            flex items-center justify-center gap-2"
        >
          <CheckIcon className="w-5 h-5" />
          ĐẶT LẠI MẬT KHẨU
        </button>
      </form>
    </div>
  );
}
