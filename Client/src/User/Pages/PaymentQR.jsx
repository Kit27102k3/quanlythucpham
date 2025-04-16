import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { FaCopy, FaArrowLeft } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatCurrency } from "../../utils/formatCurrency";
import paymentApi from "../../api/paymentApi";

const PaymentQR = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Lấy thông tin từ query params
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const qrCode = searchParams.get("qrCode");
  const bankName = searchParams.get("bankName");
  const accountNumber = searchParams.get("accountNumber");
  const accountName = searchParams.get("accountName");
  
  const [timeLeft, setTimeLeft] = useState(initializeTimer());
  const [expired, setExpired] = useState(timeLeft === 0);
  const [checking, setChecking] = useState(false);

  // Khởi tạo thời gian từ localStorage hoặc mặc định
  function initializeTimer() {
    const storedExpiry = localStorage.getItem(`qr_expiry_${orderId}`);
    if (storedExpiry) {
      const timeRemaining = Math.max(0, Math.floor((parseInt(storedExpiry) - Date.now()) / 1000));
      return timeRemaining > 0 ? timeRemaining : 0;
    }
    const expiryTime = Date.now() + (300 * 1000); // 5 phút
    localStorage.setItem(`qr_expiry_${orderId}`, expiryTime.toString());
    return 300;
  }

  useEffect(() => {
    // Timer for QR code expiration
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setExpired(true);
          localStorage.removeItem(`qr_expiry_${orderId}`);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Check payment status every 10 seconds
    const statusChecker = setInterval(async () => {
      if (!checking && !expired) {
        setChecking(true);
        try {
          const response = await paymentApi.checkPaymentStatus(orderId);
          if (response && response.status === "completed") {
            clearInterval(statusChecker);
            clearInterval(timer);
            localStorage.removeItem(`qr_expiry_${orderId}`);
            toast.success("Thanh toán thành công!");
            navigate(`/payment-result?orderId=${orderId}&status=success&amount=${amount}`);
          }
        } catch (error) {
          // Không hiển thị lỗi liên tục trên console nếu server chưa khởi động xong
          // hoặc không tìm thấy endpoint - đây là lỗi tạm thời và không ảnh hưởng
          // đến người dùng, chúng ta sẽ thử lại sau
          if (error.response && error.response.status !== 404) {
            console.error("Error checking payment status:", error);
          }
        } finally {
          setChecking(false);
        }
      }
    }, 5000);

    // Cleanup
    return () => {
      clearInterval(timer);
      clearInterval(statusChecker);
      if (expired) {
        localStorage.removeItem(`qr_expiry_${orderId}`);
      }
    };
  }, [orderId, amount, navigate, expired, checking]);

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
    navigate(-1);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (expired) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Mã QR đã hết hạn</h2>
          <p className="text-gray-600 mb-4">Vui lòng thực hiện lại giao dịch</p>
          <button
            onClick={handleGoBack}
            className="bg-[#51bb1a] text-white px-6 py-2 rounded-lg hover:bg-[#3d8b14]"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

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
            <p className="text-yellow-600 mt-2">
              Mã QR sẽ hết hạn sau: <span className="font-bold">{formatTime(timeLeft)}</span>
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
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Ngân hàng</p>
                <p className="font-medium">{decodeURIComponent(bankName || "MBBank - Ngân hàng Thương mại Cổ phần Quân đội")}</p>
              </div>
              
              <div>
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
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Chủ tài khoản</p>
                <div className="flex items-center justify-between">
                  <p className="font-medium">{decodeURIComponent(accountName || "NGUYEN TRONG KHIEM")}</p>
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
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Hệ thống sẽ tự động xác nhận sau khi bạn chuyển khoản thành công.</p>
            <p>Vui lòng không đóng trang này trong quá trình thanh toán.</p>
            {checking && <p className="text-[#51bb1a] mt-2">Đang kiểm tra trạng thái thanh toán...</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentQR; 