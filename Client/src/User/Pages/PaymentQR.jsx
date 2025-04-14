import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCopy, FaArrowLeft } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PaymentQR = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  // Lấy thông tin từ query params
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const qrCode = searchParams.get("qrCode");
  const bankName = searchParams.get("bankName");
  const accountNumber = searchParams.get("accountNumber");
  const accountName = searchParams.get("accountName");

  // Xử lý copy vào clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success("Đã sao chép vào clipboard");
      },
      (err) => {
        toast.error("Không thể sao chép: " + err);
      }
    );
  };

  // Xử lý quay lại
  const handleGoBack = () => {
    // Quay lại trang trước đó
    navigate(-1);
  };

  // Xử lý khi người dùng đã thanh toán
  const handleCompletedPayment = () => {
    navigate(`/payment-result?orderId=${orderId}&status=manual&amount=${amount}`);
  };

  // Format tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!orderId || !qrCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Thông tin QR code không hợp lệ</h2>
          <p className="mb-4">Không tìm thấy thông tin thanh toán cần thiết. Vui lòng thử lại.</p>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-[#51bb1a] text-white py-3 rounded-md hover:bg-opacity-90"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={handleGoBack}
              className="flex items-center text-gray-600 hover:text-[#51bb1a]"
            >
              <FaArrowLeft className="mr-2" /> Quay lại
            </button>
            <h1 className="text-xl font-bold text-[#51bb1a]">DNC FOOD</h1>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Quét mã QR để thanh toán</h2>
            <p className="text-gray-600">
              Đơn hàng: <span className="font-semibold">#{orderId}</span>
            </p>
            <p className="text-gray-600">
              Số tiền: <span className="font-semibold text-red-500">{formatCurrency(amount)}</span>
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="p-3 border border-gray-200 rounded-lg">
              <img 
                src={qrCode} 
                alt="QR Code Thanh Toán" 
                className="w-64 h-64 object-contain"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Thông tin chuyển khoản:</h3>
            
            <div className="mb-3">
              <p className="text-sm text-gray-500 mb-1">Ngân hàng</p>
              <div className="flex items-center justify-between">
                <p className="font-medium">{decodeURIComponent(bankName || "BIDV - Ngân hàng Đầu tư và Phát triển VN")}</p>
              </div>
            </div>
            
            <div className="mb-3">
              <p className="text-sm text-gray-500 mb-1">Số tài khoản</p>
              <div className="flex items-center justify-between">
                <p className="font-medium">{accountNumber}</p>
                <button 
                  onClick={() => copyToClipboard(accountNumber)}
                  className="text-[#51bb1a] p-2 hover:bg-gray-200 rounded-full"
                >
                  <FaCopy />
                </button>
              </div>
            </div>
            
            <div className="mb-3">
              <p className="text-sm text-gray-500 mb-1">Chủ tài khoản</p>
              <div className="flex items-center justify-between">
                <p className="font-medium">{decodeURIComponent(accountName || "CONG TY CP DNC FOOD")}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Nội dung chuyển khoản</p>
              <div className="flex items-center justify-between">
                <p className="font-medium">{`Thanh toan don hang #${orderId}`}</p>
                <button 
                  onClick={() => copyToClipboard(`Thanh toan don hang #${orderId}`)}
                  className="text-[#51bb1a] p-2 hover:bg-gray-200 rounded-full"
                >
                  <FaCopy />
                </button>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500 mb-6">
            <p>Sau khi chuyển khoản thành công, vui lòng bấm nút bên dưới.</p>
            <p>Đơn hàng của bạn sẽ được xử lý sau khi chúng tôi xác nhận thanh toán.</p>
          </div>

          <button
            onClick={handleCompletedPayment}
            className="w-full bg-[#51bb1a] text-white py-3 rounded-md hover:bg-opacity-90 transition"
          >
            Tôi đã hoàn tất thanh toán
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentQR; 