/* eslint-disable react/jsx-no-target-blank */
import { useRef, useState } from "react";
import { Stepper } from "primereact/stepper";
import { StepperPanel } from "primereact/stepperpanel";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { toast } from "sonner";
import { classNames } from "primereact/utils";
import {authApi} from "../../../api/authApi";
import "../../../App.css";

export default function ForgotPassword() {
  const stepperRef = useRef(null);
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
    otp: "",
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
    if (severity === "success") {
      toast.success(detail);
    } else if (severity === "error") {
      toast.error(detail);
    } else if (severity === "info") {
      toast.info(detail);
    } else {
      toast(detail);
    }
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
      const response = await authApi.requestPasswordReset({
        email: formData.email,
      });
      showToast("success", "Thành công", response.message);
      handleNext();
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error.response?.data?.message || "Yêu cầu OTP thất bại"
      );
    } finally {
      setLoading((prev) => ({ ...prev, step1: false }));
    }
  };

  const handleSubmitStep2 = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: "Mã OTP phải có 6 chữ số" }));
      return;
    }
    setLoading((prev) => ({ ...prev, step2: true }));
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setToken(formData.otp); // Lưu token OTP để sử dụng ở bước 3
      showToast("success", "Thành công", "Xác thực OTP thành công");
      handleNext();
    } catch (err) {
      showToast("error", "Lỗi", err?.message || "Mã OTP không chính xác");
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
      const response = await authApi.resetPassword({
        email: formData.email,
        newPassword: formData.password,
        otp: token,
      });

      showToast(
        "success",
        "Thành công",
        response.message || "Đổi mật khẩu thành công"
      );

      // Reset form sau khi đổi mật khẩu thành công
      setFormData({ email: "", password: "", confirm: "", otp: "" });
      setToken("");
    } catch (error) {
      console.error("Lỗi đổi mật khẩu:", error.response?.data);
      showToast(
        "error",
        "Lỗi",
        error.response?.data?.message || "Đổi mật khẩu thất bại"
      );
    } finally {
      setLoading((prev) => ({ ...prev, step3: false }));
    }
  };

  return (
    <div
      className="flex justify-content-center "
      style={{ padding: "12px 16px" }}
    >
      <div
        className="w-full max-w-full"
        style={{ maxWidth: "330px", margin: "0 auto" }}
      >
        <div className="text-center mb-3 mt-2">
          <h2 className="text-lg font-bold" style={{ marginBottom: "16px" }}>
            QUÊN MẬT KHẨU
          </h2>
        </div>
        <Stepper
          ref={stepperRef}
          orientation="horizontal"
          className="text-black mb-3"
          style={{ fontSize: "0.8rem", marginBottom: "16px" }}
          pt={{
            root: {
              className: "responsive-stepper",
              style: { paddingBottom: "10px" },
            },
            step: {
              className: "responsive-step",
              style: {
                padding: "0.5rem 0.25rem",
                minWidth: "auto",
              },
            },
            stepbutton: {
              style: {
                height: "auto",
                width: "auto",
                minWidth: "1.5rem",
                minHeight: "1.5rem",
              },
            },
            stepicon: {
              style: {
                fontSize: "0.75rem",
              },
            },
            steptitle: {
              className: "text-xs",
              style: {
                margin: "0.25rem 0 0 0",
                whiteSpace: "normal",
                textAlign: "center",
                maxWidth: "70px",
              },
            },
          }}
        >
          <StepperPanel header="Xác thực email">
            <div
              className="border-dashed border-round surface-ground font-medium w-full"
              style={{
                padding: "16px",
                borderRadius: "8px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.08)",
              }}
            >
              <div className="field mb-3">
                <label htmlFor="email" className="font-bold block mb-2 text-sm">
                  Email:
                </label>
                <InputText
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập email của bạn"
                  className={classNames("w-full border-round border text-sm", {
                    "p-invalid": errors.email,
                  })}
                  style={{
                    backgroundColor: "white",
                    color: "black",
                    padding: "10px 12px",
                    borderRadius: "6px",
                  }}
                />
                {errors.email && (
                  <small className="p-error block mt-1 text-xs">
                    {errors.email}
                  </small>
                )}
              </div>
            </div>
            <div className="flex pt-3 justify-content-end px-4">
              <Button
                label="Tiếp theo"
                // icon="pi pi-arrow-right"
                // iconPos="right"
                loading={loading.step1}
                className="w-full text-white text-xs"
                style={{
                  height: "38px",
                  backgroundColor: "#1976d2",
                  borderRadius: "6px",
                }}
                onClick={handleSubmitStep1}
              />
            </div>
          </StepperPanel>

          <StepperPanel header="Xác thực OTP">
            <div
              className="border-dashed border-round surface-ground font-medium w-full"
              style={{
                padding: "16px",
                borderRadius: "8px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.08)",
              }}
            >
              <h3
                className="mb-3 text-center text-xs"
                style={{ fontWeight: "600" }}
              >
                Nhập mã OTP đã gửi đến email của bạn
              </h3>
              <div className="field mb-3">
                <InputText
                  id="otp"
                  name="otp"
                  keyfilter="int"
                  maxLength={6}
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="Nhập mã 6 số"
                  className={classNames(
                    "w-full border-round border text-center text-base",
                    {
                      "p-invalid": errors.otp,
                    }
                  )}
                  style={{
                    backgroundColor: "white",
                    color: "black",
                    letterSpacing: "0.3rem",
                    padding: "10px 12px",
                    borderRadius: "6px",
                  }}
                />
                {errors.otp && (
                  <small className="p-error block text-center mt-1 text-xs">
                    {errors.otp}
                  </small>
                )}
              </div>
              <div className="text-center mt-2">
                <Button
                  label="Gửi lại mã OTP"
                  link
                  className="p-0 text-xs"
                  style={{ color: "#1976d2" }}
                  onClick={() =>
                    showToast("info", "Thông báo", "Mã OTP mới đã được gửi")
                  }
                />
              </div>
            </div>
            <div className="flex px-4 pt-3 justify-content-between w-full gap-2">
              <Button
                label="Quay lại"
                severity="secondary"
                className="w-full text-black border-1 text-xs"
                // icon="pi pi-arrow-left"
                style={{
                  height: "38px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "6px",
                }}
                onClick={handleBack}
              />
              <Button
                label="Tiếp theo"
                // icon="pi pi-arrow-right"
                // iconPos="right"
                loading={loading.step2}
                className="w-full text-white text-xs"
                style={{
                  height: "38px",
                  backgroundColor: "#1976d2",
                  borderRadius: "6px",
                }}
                onClick={handleSubmitStep2}
              />
            </div>
          </StepperPanel>

          <StepperPanel header="Đặt mật khẩu mới">
            <div
              className="border-dashed border-round surface-ground font-medium w-full"
              style={{
                padding: "16px",
                borderRadius: "8px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.08)",
              }}
            >
              <div className="field mb-3">
                <label
                  htmlFor="password"
                  className="font-bold block mb-2 text-sm"
                >
                  Mật khẩu mới:
                </label>
                <InputText
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
                  className={classNames("w-full border-round border text-sm", {
                    "p-invalid": errors.password,
                  })}
                  type="password"
                  style={{
                    backgroundColor: "white",
                    color: "black",
                    padding: "10px 12px",
                    borderRadius: "6px",
                  }}
                />
                {errors.password && (
                  <small className="p-error block mt-1 text-xs">
                    {errors.password}
                  </small>
                )}
              </div>
              <div className="field mb-2">
                <label
                  htmlFor="confirm"
                  className="font-bold block mb-2 text-sm"
                >
                  Xác nhận mật khẩu:
                </label>
                <InputText
                  id="confirm"
                  name="confirm"
                  value={formData.confirm}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu mới"
                  className={classNames("w-full border-round border text-sm", {
                    "p-invalid": errors.confirm,
                  })}
                  type="password"
                  style={{
                    backgroundColor: "white",
                    color: "black",
                    padding: "10px 12px",
                    borderRadius: "6px",
                  }}
                />
                {errors.confirm && (
                  <small className="p-error block mt-1 text-xs">
                    {errors.confirm}
                  </small>
                )}
              </div>
            </div>
            <div className="flex px-4 pt-3 justify-content-between w-full gap-2">
              <Button
                label="Quay lại"
                severity="secondary"
                className="w-full text-black border-1 text-xs"
                // icon="pi pi-arrow-left"
                style={{
                  height: "38px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "6px",
                }}
                onClick={handleBack}
              />
              <Button
                label="Xác nhận"
                // icon="pi pi-check"
                loading={loading.step3}
                className="w-full text-white text-xs"
                style={{
                  height: "38px",
                  backgroundColor: "#51bb1a",
                  borderRadius: "6px",
                }}
                onClick={handleSubmitStep3}
              />
            </div>
          </StepperPanel>
        </Stepper>
      </div>
    </div>
  );
}
