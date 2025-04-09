import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const orderId = searchParams.get('orderId');
  const paymentStatus = searchParams.get('status');

  useEffect(() => {
    if (paymentStatus) {
      setStatus(paymentStatus === 'success' ? 'success' : 'error');
    }
    
    const fetchOrderDetails = async () => {
      try {
        if (!orderId) {
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`/api/orders/${orderId}`);
        setOrderDetails(response.data);
      } catch (error) {
        console.error('Lỗi khi tải thông tin đơn hàng:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, paymentStatus]);

  const handleContinueShopping = () => {
    navigate('/');
  };

  const handleViewOrders = () => {
    navigate('/user/orders');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spin size="large" tip="Đang tải thông tin thanh toán..." />
      </div>
    );
  }

  return (
    <div className="payment-result py-8">
      <Result
        status={status === 'success' ? 'success' : 'error'}
        icon={status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        title={status === 'success' ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
        subTitle={
          <div className="mt-3">
            <p>Mã đơn hàng: {orderId}</p>
            {orderDetails && (
              <p className="mt-1">Tổng tiền: {orderDetails.totalAmount?.toLocaleString('vi-VN')} VNĐ</p>
            )}
          </div>
        }
        extra={[
          <Button type="primary" key="orders" onClick={handleViewOrders}>
            Xem đơn hàng
          </Button>,
          <Button key="continue" onClick={handleContinueShopping}>
            Tiếp tục mua sắm
          </Button>,
        ]}
      />
    </div>
  );
};

export default PaymentResult; 