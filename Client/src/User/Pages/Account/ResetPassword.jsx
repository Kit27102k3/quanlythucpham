import React, { useState } from "react";
import { KeyIcon, CheckIcon, LockIcon } from "lucide-react";
import authApi from "../../../api/authApi"; // Đảm bảo đường dẫn đúng
import { toast } from "react-toastify";

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
  const [isSubmitting, setIsSubmitting] = useState(false); // Thêm state để quản lý trạng thái gửi form

  const validatePassword = (password) => {
    const errors = [];
    if (!password) errors.push("Vui lòng nhập mật khẩu");
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
    setPasswordErrors((prev) => ({
      ...prev,
      [id]: "", // Xóa lỗi khi người dùng nhập
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let isValid = true;
    const newErrors = {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    };

    // Validate old password
    if (!passwords.oldPassword) {
      newErrors.oldPassword = "Vui lòng nhập mật khẩu cũ";
      isValid = false;
    }

    // Validate new password
    const newPasswordErrors = validatePassword(passwords.newPassword);
    if (newPasswordErrors.length > 0) {
      newErrors.newPassword = newPasswordErrors.join(", ");
      isValid = false;
    }

    // Validate confirm password
    if (!passwords.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
      isValid = false;
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
      isValid = false;
    }

    setPasswordErrors(newErrors);

    if (!isValid) return;

    // Thực hiện đổi mật khẩu
    setIsSubmitting(true);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("Bạn cần đăng nhập để đổi mật khẩu");

      await authApi.updateProfile(userId, {
        currentPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      });

      toast.success("Đổi mật khẩu thành công!");
      setPasswords({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Lỗi khi đổi mật khẩu:", error);
      if (error.response?.status === 401) {
        setPasswordErrors((prev) => ({
          ...prev,
          oldPassword: "Mật khẩu cũ không chính xác",
        }));
      } else {
        toast.error(
          error.response?.data?.message ||
            "Đổi mật khẩu thất bại. Vui lòng thử lại."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md bg-white rounded-lg space-y-4 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <KeyIcon className="w-6 h-6 text-[#51bb1a]" />
        <h2 className="text-xl uppercase font-semibold text-gray-800">
          Đổi mật khẩu
        </h2>
      </div>

      <p className="text-sm text-gray-600 flex items-center gap-2 bg-green-50 p-3 rounded-md mb-4">
        <LockIcon className="w-5 h-5 text-[#51bb1a]" />
        Để đảm bảo tính bảo mật, mật khẩu cần ít nhất 8 ký tự, bao gồm chữ hoa,
        số và ký tự đặc biệt.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-2"
            htmlFor="oldPassword"
          >
            Mật khẩu cũ *
          </label>
          <input
            className={`w-full p-2 border rounded-md outline-none focus:ring-2 ${
              passwordErrors.oldPassword
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-green-500"
            }`}
            type="password"
            id="oldPassword"
            value={passwords.oldPassword}
            onChange={handleInputChange}
            placeholder="Nhập mật khẩu cũ"
            disabled={isSubmitting}
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
            Mật khẩu mới *
          </label>
          <input
            className={`w-full p-2 border rounded-md outline-none focus:ring-2 ${
              passwordErrors.newPassword
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-green-500"
            }`}
            type="password"
            id="newPassword"
            value={passwords.newPassword}
            onChange={handleInputChange}
            placeholder="Nhập mật khẩu mới"
            disabled={isSubmitting}
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
            Xác nhận lại mật khẩu *
          </label>
          <input
            className={`w-full p-2 border rounded-md outline-none focus:ring-2 ${
              passwordErrors.confirmPassword
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-green-500"
            }`}
            type="password"
            id="confirmPassword"
            value={passwords.confirmPassword}
            onChange={handleInputChange}
            placeholder="Xác nhận lại mật khẩu"
            disabled={isSubmitting}
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
          className={`w-full mt-5 py-2 rounded-md text grounding-colors duration-300 flex items-center justify-center gap-2 ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#51bb1a] hover:bg-[#3fa312]"
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Đang xử lý...
            </>
          ) : (
            <>
              <CheckIcon className="w-5 h-5" />
              Đặt lại mật khẩu
            </>
          )}
        </button>
      </form>
    </div>
  );
}
