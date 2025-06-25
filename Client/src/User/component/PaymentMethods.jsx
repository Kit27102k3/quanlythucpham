/* eslint-disable react/prop-types */
import  { useState } from 'react';
import { Button, message } from 'antd';
import axios from 'axios';
import SePayCheckout from './SePayCheckout';

const PaymentMethods = ({ orderId, amount, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/payment/create-payment', {
        orderId,
        amount,
        paymentMethod: 'SEPAY'
      });
      
      if (response.data && response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        throw new Error('Không nhận được URL thanh toán');
      }
    } catch (error) {
      console.error('Lỗi thanh toán:', error);
      message.error('Không thể tạo thanh toán, vui lòng thử lại');
      setLoading(false);
    }
  };

  return (
    <div className="payment-methods">
      <h3 className="text-xl font-semibold mb-4">Thanh toán đơn hàng</h3>
      
      <div className="mb-4">
        <p className="text-gray-700 mb-2">Thông tin đơn hàng:</p>
        <div className="bg-gray-50 p-3 rounded-md">
          <p>Mã đơn hàng: <span className="font-medium">{orderId}</span></p>
          <p>Tổng thanh toán: <span className="font-medium text-red-600">{amount.toLocaleString('vi-VN')} VNĐ</span></p>
        </div>
      </div>
      
      <SePayCheckout />
      
      <Button 
        type="primary" 
        onClick={handlePayment}
        loading={loading}
        className="mt-4 bg-blue-600 hover:bg-blue-700 w-full h-10 text-base"
      >
        Thanh toán ngay
      </Button>
    </div>
  );
};

export default PaymentMethods;