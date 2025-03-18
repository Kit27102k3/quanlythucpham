import React, { useRef, useState } from "react";
import { Stepper } from "primereact/stepper";
import { StepperPanel } from "primereact/stepperpanel";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputOtp } from "primereact/inputotp";
import { Toast } from "primereact/toast";
import "../../../App.css";

export default function ForgotPassword() {
  const stepperRef = useRef(null);
  const [token, setTokens] = useState();
  const toast = useRef(null);

  const showSuccess = () => {
    toast.current.show({
      severity: "success",
      summary: "Success",
      detail: "Message Content",
      life: 1000,
    });
  };
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirm: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNext = () => {
    stepperRef.current.nextCallback();
  };

  const handleBack = () => {
    stepperRef.current.prevCallback();
  };

  const handleSubmitStep1 = () => {
    handleNext();
  };

  const handleSubmitStep2 = () => {
    handleNext();
  };

  return (
    <div className="p-6">
      <Toast ref={toast} />
      <Stepper
        ref={stepperRef}
        orientation="horizontal"
        style={{ maxWidth: "40rem", width: "100%" }}
        className=" text-black "
      >
        <StepperPanel>
          <div className=" border-dashed  border-round surface-ground font-medium p-5 w-full">
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
                className="w-full p-2 border border-gray-300 rounded-md"
                style={{
                  backgroundColor: "white",
                  color: "black",
                  outline: "none",
                }}
              />
            </div>
          </div>
          <div className="flex pt-4 justify-end w-full">
            <Button
              label="Next"
              icon="pi pi-arrow-right"
              iconPos="right"
              className="h-10 w-28 bg-blue-500 text-black p-2"
              onClick={handleSubmitStep1}
            />
          </div>
        </StepperPanel>

        <StepperPanel>
          <div className=" border-dashed  border-round surface-ground font-medium p-5 w-full">
            <h2 className="mb-2">Nhập mã OTP:</h2>
            <InputOtp
              value={token}
              onChange={(e) => setTokens(e.value)}
              className="p-your-input-class border-2"
            />
          </div>
          <div className="flex pt-4 justify-between w-full">
            <Button
              label="Back"
              severity="secondary"
              className="h-10 w-28 bg-blue-500 text-black p-2"
              icon="pi pi-arrow-left"
              onClick={handleBack}
            />
            <Button
              label="Next"
              icon="pi pi-arrow-right"
              iconPos="right"
              onClick={handleSubmitStep2}
              className="h-10 w-28 bg-blue-500 text-black p-2"
            />
          </div>
        </StepperPanel>

        <StepperPanel>
          <div className=" border-dashed  border-round surface-ground font-medium p-5 w-full">
            <div className="field mb-3">
              <label htmlFor="password" className="font-bold block mb-2">
                Mật khẩu mới:
              </label>
              <InputText
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu"
                className="w-full p-2 border border-gray-300 rounded-md"  
                type="password"
                style={{
                  backgroundColor: "white",
                  color: "black",
                  outline: "none",
                }}
              />
            </div>
            <div className="field mb-3">
              <label htmlFor="confirm" className="font-bold block mb-2">
                Xác nhận mật khẩu:
              </label>
              <InputText
                id="confirm"
                name="confirm"
                value={formData.confirm}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu"
                className="w-full p-2 border border-gray-300 rounded-md"  
                type="password"
                style={{
                  backgroundColor: "white",
                  color: "black",
                  outline: "none",
                }}
              />
            </div>
          </div>
          <div className="flex pt-4 justify-around gap-90 w-full">
            <Button
              label="Xác nhận"
              severity="secondary"
              icon="pi pi-check"
              onClick={showSuccess}
              className="h-10 w-40 p-6 rounded-md"
              style={{
                backgroundColor: "#51bb1a",
                color: "white",
                outline: "none",
                borderRadius: "none",
              }}
            />
          </div>
        </StepperPanel>
      </Stepper>
    </div>
  );
}
