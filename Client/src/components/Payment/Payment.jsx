import { useState } from 'react';
import { toast } from 'react-toastify';
import paymentApi from '../../api/paymentApi';
import "./Payment.css";
import Modal from 'react-modal';
import PropTypes from 'prop-types';
import { Spin } from 'antd';

// Add Modal.setAppElement call - bọc trong try/catch để tránh lỗi trong môi trường test
try {
  Modal.setAppElement('#root');
} catch (error) {
  // Ignore error in testing environment
  console.error('Error setting app element:', error);
}

// Chuyển đổi thành function component hoàn chỉnh
const Payment = ({ calculateTotalPrice }) => {
  const [loading, setLoading] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [qrValue, setQrValue] = useState('');
  
  // Hiển thị modal QR code
  const showQRCodeModal = (url, qrCodeData = null) => {
    setPaymentUrl(url);
    // Nếu có QR code từ server, dùng nó - ngược lại để null để modal tự tạo QR
    setQrValue(qrCodeData);
    setShowQRCode(true);
  };

  // Đóng modal
  const handleCancel = () => {
    setShowQRCode(false);
  };

  // Function to handle placing order
  const handlePlaceOrder = async () => {
    setLoading(true);
    
    try {
      // Tạo mã đơn hàng duy nhất
      const orderId = `${new Date().getTime()}-${Math.floor(Math.random() * 1000)}`;
      
      // Lấy tổng số tiền và đảm bảo là số dương
      const totalPrice = calculateTotalPrice();
      const amount = Math.max(1, Math.round(totalPrice)); // Đảm bảo amount là số nguyên và lớn hơn 0
      
      const orderInfo = `Thanh toán đơn hàng ${orderId}`;
      
      // Gọi API thanh toán SePay
      const response = await paymentApi.createSepayPaymentUrl(orderId, amount, orderInfo);
      
      if (!response.success) {
        throw new Error(response.error || "Không thể khởi tạo thanh toán");
      }
      
      // Kiểm tra phản hồi từ API
      const { paymentUrl, qrCode } = response.data;
      
      if (!paymentUrl) {
        throw new Error("Không nhận được URL thanh toán");
      }
      
      // Hiển thị QR code modal hoặc chuyển hướng đến trang thanh toán
      if (qrCode) {
        // Nếu có QR code, hiển thị modal
        showQRCodeModal(paymentUrl, qrCode);
      } else {
        // Nếu không có QR code, chuyển hướng trực tiếp đến URL thanh toán
        window.location.href = paymentUrl;
      }
    } catch (error) {
      toast.error(error.message || "Không thể kết nối đến cổng thanh toán. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      <div className="payment-methods">
        <h2>Phương thức thanh toán</h2>
        <div className="payment-method-item">
          <input
            type="radio"
            id="sepay"
            name="payment-method"
            value="sepay"
            defaultChecked
          />
          <label htmlFor="sepay" className="payment-method-label">
            <div className="payment-logo-container">
              <img 
                src="/images/sepay-logo.png" 
                alt="SePay Logo" 
                className="payment-logo" 
              />
            </div>
            <span>Thanh toán qua SePay</span>
          </label>
        </div>
      </div>

      <button 
        className="place-order-btn" 
        onClick={handlePlaceOrder}
        disabled={loading}
      >
        {loading ? <Spin size="small" /> : 'Đặt hàng'}
      </button>

      {/* Modal hiển thị QR code */}
      <Modal
        isOpen={showQRCode}
        onRequestClose={handleCancel}
        contentLabel="QR Code Thanh Toán"
        className="qr-modal"
        overlayClassName="qr-modal-overlay"
      >
        <div className="qr-code-container">
          <img 
            src="/images/sepay-logo.png" 
            alt="SePay Logo" 
            className="qr-sepay-logo" 
          />
          <div className="qr-code">
            {qrValue ? (
              // Có QR code từ server (data URL)
              <img src={qrValue} alt="QR Code thanh toán" />
            ) : paymentUrl ? (
              // Không có QR từ server, tạo QR từ URL thanh toán
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  paymentUrl
                )}`}
                alt="QR Code thanh toán"
              />
            ) : (
              // Không có data
              <div className="qr-loading">
                <Spin size="large" />
                <p>Đang tải mã QR...</p>
              </div>
            )}
          </div>
          <p className="qr-instructions">Sử dụng ứng dụng SePay để quét mã QR</p>
          <div className="qr-action-buttons">
            <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="payment-link">
              Mở trang thanh toán
            </a>
            <button
              onClick={handleCancel}
              className="cancel-payment-btn"
            >
              Hủy
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Thêm prop validation
Payment.propTypes = {
  calculateTotalPrice: PropTypes.func.isRequired
};

export default Payment; 