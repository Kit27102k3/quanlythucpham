import React, { useRef, useState } from "react";
import { Stepper } from "primereact/stepper";
import { StepperPanel } from "primereact/stepperpanel";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputOtp } from "primereact/inputotp";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import "../../../App.css";

export default function ForgotPassword() {
  const stepperRef = useRef(null);
  const toast = useRef(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState({
    step1: false,
    step2: false,
    step3: false,
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirm: "",
  });

  const [errors, setErrors] = useState({
    email: false,
    password: false,
    confirm: false,
    otp: false,
  });

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleNext = () => {
    stepperRef.current.nextCallback();
  };

  const handleBack = () => {
    stepperRef.current.prevCallback();
  };

  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail, life: 3000 });
  };

  const handleSubmitStep1 = async () => {
    if (!formData.email) {
      setErrors((prev) => ({ ...prev, email: "Email không được để trống" }));
      return;
    }
    if (!validateEmail(formData.email)) {
      setErrors((prev) => ({ ...prev, email: "Email không hợp lệ" }));
      return;
    }
    setLoading((prev) => ({ ...prev, step1: true }));
    try {
      const response = await fetch("http://localhost:8080/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Yêu cầu OTP thất bại");
      }
      showToast("success", "Thành công", data.message);
      handleNext();
    } catch (error) {
      showToast("error", "Lỗi", error.message);
    } finally {
      setLoading((prev) => ({ ...prev, step1: false }));
    }
  };

  const handleSubmitStep2 = async () => {
    if (!token || token.length < 6) {
      setErrors((prev) => ({ ...prev, otp: "Mã OTP phải có 6 chữ số" }));
      return;
    }
    setLoading((prev) => ({ ...prev, step2: true }));
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast("success", "Thành công", "Xác thực OTP thành công");
      handleNext();
    } catch (error) {
      showToast("error", "Lỗi", "Mã OTP không chính xác");
    } finally {
      setLoading((prev) => ({ ...prev, step2: false }));
    }
  };

  const handleSubmitStep3 = async () => {
    if (!formData.password) {
      setErrors((prev) => ({
        ...prev,
        password: "Mật khẩu không được để trống",
      }));
      return;
    }
    if (!validatePassword(formData.password)) {
      setErrors((prev) => ({
        ...prev,
        password: "Mật khẩu phải có ít nhất 8 ký tự",
      }));
      return;
    }
    if (formData.password !== formData.confirm) {
      setErrors((prev) => ({ ...prev, confirm: "Mật khẩu không khớp" }));
      return;
    }
    setLoading((prev) => ({ ...prev, step3: true }));
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast("success", "Thành công", "Đổi mật khẩu thành công");
      setFormData({
        email: "",
        password: "",
        confirm: "",
      });
      setToken("");
    } catch (error) {
      showToast("error", "Lỗi", "Đổi mật khẩu thất bại");
    } finally {
      setLoading((prev) => ({ ...prev, step3: false }));
    }
  };

  return (
    <div className="p-6 flex justify-content-center">
      <div style={{ maxWidth: "40rem", width: "100%" }}>
        <Toast ref={toast} position="top-center" />
        <Stepper
          ref={stepperRef}
          orientation="horizontal"
          className="text-black mb-6 "
        >
          <StepperPanel header="Xác thực email">
            <div className="border-dashed border-round surface-ground font-medium p-5 w-full">
              <div className="field mb-3">
                <label htmlFor="email" className="font-bold block mb-2">
                  Email:
                </label>
                <InputText
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập email của bạn"
                  className={classNames("w-full p-3 border-round border", {
                    "p-invalid": errors.email,
                  })}
                  style={{
                    backgroundColor: "white",
                    color: "black",
                  }}
                />
                {errors.email && (
                  <small className="p-error block mt-1">{errors.email}</small>
                )}
              </div>
            </div>
            <div className="flex pt-4 justify-end w-full">
              <Button
                label="Tiếp theo"
                icon="pi pi-arrow-right"
                iconPos="right"
                loading={loading.step1}
                className="h-10 w-28 bg-blue-500 text-white mr-4 px-2 text-sm size-8"
                onClick={handleSubmitStep1}
              />
            </div>
          </StepperPanel>

          <StepperPanel header="Xác thực OTP">
            <div className="border-dashed border-round surface-ground font-medium p-5 w-full">
              <h2 className="mb-4">Nhập mã OTP đã gửi đến email của bạn</h2>
              <div className="flex justify-content-center mb-3">
                <InputOtp
                  value={token}
                  onChange={(e) => {
                    setToken(e.value);
                    if (errors.otp)
                      setErrors((prev) => ({ ...prev, otp: false }));
                  }}
                  length={6}
                  integerOnly
                  inputClassName={classNames("w-3rem h-3rem mx-1 text-xl", {
                    "border-red-500": errors.otp,
                  })}
                  inputStyle={{
                    border: errors.otp
                      ? "1px solid #ff0000"
                      : "1px solid #ced4da",
                    borderRadius: "6px",
                  }}
                />
              </div>
              {errors.otp && (
                <small className="p-error block text-center">
                  {errors.otp}
                </small>
              )}
              <div className="text-center mt-3">
                <Button
                  label="Gửi lại mã OTP"
                  link
                  className="p-0 text-sm"
                  onClick={() =>
                    showToast("info", "Thông báo", "Mã OTP mới đã được gửi")
                  }
                />
              </div>
            </div>
            <div className="flex pt-4 justify-between w-full">
              <Button
                label="Quay lại"
                severity="secondary"
                className="h-10 w-28 text-black border-1 px-2 text-sm"
                icon="pi pi-arrow-left"
                onClick={handleBack}
              />
              <Button
                label="Tiếp theo"
                icon="pi pi-arrow-right"
                iconPos="right"
                loading={loading.step2}
                className="h-10 w-28 bg-blue-500 text-white px-2 text-sm"
                onClick={handleSubmitStep2}
              />
            </div>
          </StepperPanel>

          <StepperPanel header="Đặt mật khẩu mới">
            <div className="border-dashed border-round surface-ground font-medium p-5 w-full">
              <div className="field mb-4">
                <label htmlFor="password" className="font-bold block mb-2">
                  Mật khẩu mới:
                </label>
                <InputText
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
                  className={classNames("w-full p-3 border-round border", {
                    "p-invalid": errors.password,
                  })}
                  type="password"
                  style={{
                    backgroundColor: "white",
                    color: "black",
                  }}
                />
                {errors.password && (
                  <small className="p-error block mt-1">
                    {errors.password}
                  </small>
                )}
              </div>
              <div className="field mb-4">
                <label htmlFor="confirm" className="font-bold block mb-2">
                  Xác nhận mật khẩu:
                </label>
                <InputText
                  id="confirm"
                  name="confirm"
                  value={formData.confirm}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu mới"
                  className={classNames("w-full p-3 border-round border", {
                    "p-invalid": errors.confirm,
                  })}
                  type="password"
                  style={{
                    backgroundColor: "white",
                    color: "black",
                  }}
                />
                {errors.confirm && (
                  <small className="p-error block mt-1">{errors.confirm}</small>
                )}
              </div>
            </div>
            <div className="flex pt-4 justify-between w-full">
              <Button
                label="Quay lại"
                severity="secondary"
                className="h-10 w-28 text-black border-1 px-2 text-sm"
                icon="pi pi-arrow-left"
                onClick={handleBack}
              />
              <Button
                label="Xác nhận"
                icon="pi pi-check"
                loading={loading.step3}
                className="h-10 w-28 bg-[#51bb1a] text-white px-2 text-sm size-8"
                onClick={handleSubmitStep3}
              />
            </div>
          </StepperPanel>
        </Stepper>
      </div>
    </div>
  );
}
