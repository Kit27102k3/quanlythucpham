import React, { useState } from 'react';
import { Button, Radio, message } from 'antd';
import axios from 'axios';
import VNPayCheckout from './VNPayCheckout';
import MomoCheckout from './MomoCheckout';

const PaymentMethods = ({ orderId, amount, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/payment/create-payment', {
        orderId,
        amount,
        paymentMethod
      });
      
      window.location.href = response.data.paymentUrl;
    } catch (error) {
      message.error('Lỗi khi tạo thanh toán');
      setLoading(false);
    }
  };

  return (
    <div className="payment-methods">
      <h3>Chọn phương thức thanh toán</h3>
      
      <Radio.Group 
        onChange={(e) => setPaymentMethod(e.target.value)} 
        value={paymentMethod}
        className="mb-4"
      >
        <Radio value="VNPAY">VNPAY</Radio>
        <Radio value="MOMO">Momo</Radio>
      </Radio.Group>

      {paymentMethod === 'VNPAY' && <VNPayCheckout />}
      {paymentMethod === 'MOMO' && <MomoCheckout />}

      <Button 
        type="primary" 
        onClick={handlePayment}
        loading={loading}
        className="mt-4"
      >
        Thanh toán ngay
      </Button>
    </div>
  );
};

export default PaymentMethods;