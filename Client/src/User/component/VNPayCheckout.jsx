import React from "react";

const VNPayCheckout = () => {
  return (
    <div className="vnpay-info">
      <p>Thanh toán qua VNPAY với các ngân hàng liên kết</p>
      <img
        src="/images/vnpay-banks.png"
        alt="Các ngân hàng hỗ trợ VNPAY"
        style={{ maxWidth: "100%" }}
      />
    </div>
  );
};

export default VNPayCheckout;
