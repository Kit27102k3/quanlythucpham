import React from 'react';
import { useLocation } from 'react-router-dom';
import PaymentMethods from './PaymentMethods';

const CheckoutPage = () => {
  const location = useLocation();
  const { orderId, amount } = location.state || {};

  return (
    <div className="checkout-container">
      <h2>Thanh Toán Đơn Hàng</h2>
      <div className="order-summary">
        <p>Mã đơn hàng: {orderId}</p>
        <p>Tổng tiền: {amount.toLocaleString()} VND</p>
      </div>
      
      <PaymentMethods 
        orderId={orderId} 
        amount={amount} 
      />
    </div>
  );
};

export default CheckoutPage;