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
  console.warn('Could not set app element for Modal:', error);
}

// Chuyển đổi thành function component hoàn chỉnh
const Payment = ({ calculateTotalPrice }) => {
  const [loading, setLoading] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [isScanned, setIsScanned] = useState(false);
  
  // Hiển thị modal QR code
  const showQRCodeModal = (url, qrCodeData = null) => {
    console.log("Hiển thị QR code modal với URL:", url);
    console.log("QR code data từ server:", qrCodeData ? "Có" : "Không");
    
    setPaymentUrl(url);
    // Nếu có QR code từ server, dùng nó - ngược lại để null để modal tự tạo QR
    setQrValue(qrCodeData);
    setShowQRCode(true);
    setIsScanned(false); // Reset trạng thái quét mỗi khi mở modal
  };

  // Đóng modal
  const handleCancel = () => {
    setShowQRCode(false);
  };

  // Xử lý khi người dùng quét mã QR
  const handleQRScanned = () => {
    setIsScanned(true);
    toast.success("Đã quét mã QR thành công!");
  };

  // Xử lý khi người dùng hoàn tất thanh toán
  const handleCompletePayment = () => {
    if (!isScanned) {
      toast.warning("Vui lòng quét mã QR trước khi hoàn tất thanh toán");
      return;
    }
    
    // Chuyển hướng đến trang kết quả thanh toán
    window.location.href = paymentUrl;
  };

  // Function to handle placing order
  const handlePlaceOrder = async () => {
    setLoading(true);
    
    try {
      // Tạo mã đơn hàng duy nhất
      const orderId = `${new Date().getTime()}-${Math.floor(Math.random() * 1000)}`;
      const amount = calculateTotalPrice();
      const orderInfo = `Thanh toán đơn hàng ${orderId}`;
      
      console.log("Bắt đầu thanh toán với:", { orderId, amount, orderInfo });
      
      // Gọi API thanh toán SePay
      const response = await paymentApi.createSepayPaymentUrl(orderId, amount, orderInfo);
      
      console.log("Phản hồi đầy đủ từ API thanh toán:", response);
      
      // Kiểm tra object response
      if (!response || typeof response !== 'object') {
        console.error("Phản hồi không hợp lệ từ API thanh toán:", response);
        throw new Error("Phản hồi không hợp lệ từ API thanh toán");
      }
      
      // Kiểm tra data (chứa URL thanh toán)
      if (!response.data) {
        console.error("Không có URL thanh toán trong phản hồi:", response);
        throw new Error("Không nhận được URL thanh toán");
      }
      
      // Log thông tin QR code để debug
      console.log("Thông tin QR Code:", {
        có_qr_code: !!response.qr_code,
        loại_qr_code: response.qr_code ? typeof response.qr_code : 'không có',
        độ_dài: response.qr_code ? response.qr_code.length : 0,
        bắt_đầu_bằng: response.qr_code ? response.qr_code.substring(0, 30) + '...' : 'N/A'
      });
      
      // LUÔN hiển thị QR code modal, không tự động chuyển hướng
      showQRCodeModal(response.data, response.qr_code);
    } catch (error) {
      console.error("Chi tiết lỗi khi tạo cổng thanh toán:", error);
      toast.error("Không thể kết nối đến cổng thanh toán. Vui lòng thử lại sau.");
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
            {!isScanned ? (
              <button 
                onClick={handleQRScanned} 
                className="scan-qr-btn"
              >
                Đã quét mã QR
              </button>
            ) : (
              <button 
                onClick={handleCompletePayment} 
                className="complete-payment-btn"
              >
                Hoàn tất thanh toán
              </button>
            )}
          </div>
          <button
            onClick={handleCancel}
            className="cancel-payment-btn"
          >
            Hủy
          </button>
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