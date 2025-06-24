/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { FaCopy, FaArrowLeft } from "react-icons/fa";
import { toast } from "sonner";
import { formatCurrency } from "../../../utils/formatCurrency";
import paymentApi from "../../../api/paymentApi";

const PaymentQR = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const qrCode = searchParams.get("qrCode");
  const bankName = searchParams.get("bankName");
  const accountNumber = searchParams.get("accountNumber");
  const accountName = searchParams.get("accountName");

  const [timeLeft, setTimeLeft] = useState(initializeTimer());
  const [expired, setExpired] = useState(timeLeft === 0);
  const [checking, setChecking] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  function initializeTimer() {
    const storedExpiry = localStorage.getItem(`qr_expiry_${orderId}`);
    if (storedExpiry) {
      const timeRemaining = Math.max(
        0,
        Math.floor((parseInt(storedExpiry) - Date.now()) / 1000)
      );
      return timeRemaining > 0 ? timeRemaining : 0;
    }
    const expiryTime = Date.now() + 3600 * 1000;
    localStorage.setItem(`qr_expiry_${orderId}`, expiryTime.toString());
    return 3600;
  }

  useEffect(() => {
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

    const statusChecker = setInterval(async () => {
      if (!checking && !expired) {
        setChecking(true);
        try {
          const response = await paymentApi.checkPaymentStatus(orderId);
          if (
            response &&
            (response.success === true || response.status === "completed")
          ) {
            clearInterval(statusChecker);
            clearInterval(timer);
            localStorage.removeItem(`qr_expiry_${orderId}`);
            toast.success("Thanh toán thành công!");
            setTimeout(() => {
              navigate(
                `/payment-result?orderId=${orderId}&status=success&amount=${amount}`
              );
            }, 1500);
          }
        } catch (error) {
          if (error.response && error.response.status !== 404) {
            console.error("Error checking payment status:", error);
          }
        } finally {
          setChecking(false);
        }
      }
    }, 10000);

    const initialCheck = async () => {
      try {
        if (!expired) {
          const response = await paymentApi.checkPaymentStatus(orderId);
          if (
            response &&
            (response.success === true || response.status === "completed")
          ) {
            clearInterval(statusChecker);
            clearInterval(timer);
            localStorage.removeItem(`qr_expiry_${orderId}`);

            toast.success("Thanh toán thành công!");
            setTimeout(() => {
              navigate(
                `/payment-result?orderId=${orderId}&status=success&amount=${amount}`
              );
            }, 1500);
          }
        }
      } catch (error) {
        console.log(error);
      }
    };

    initialCheck();

    return () => {
      clearInterval(timer);
      clearInterval(statusChecker);
      if (expired) {
        localStorage.removeItem(`qr_expiry_${orderId}`);
      }
    };
  }, [orderId, amount, navigate, expired, checking]);

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

  const handleGoBack = () => {
    navigate(-1);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const forceCheckStatus = async () => {
    if (!checking && !expired) {
      setChecking(true);
      try {
        toast.info("Đang kiểm tra trạng thái thanh toán...");
        setRefreshCount((prev) => prev + 1);
        const response = await paymentApi.checkPaymentStatus(orderId);

        if (
          response &&
          (response.success === true || response.status === "completed")
        ) {
          toast.success("Thanh toán thành công!");
          setTimeout(() => {
            navigate(
              `/payment-result?orderId=${orderId}&status=success&amount=${amount}`
            );
          }, 1500);
        } else {
          toast.info("Chưa nhận được xác nhận thanh toán, vui lòng đợi thêm");
        }
      } catch (error) {
        toast.error("Lỗi kiểm tra thanh toán");
      } finally {
        setChecking(false);
      }
    }
  };

  if (expired) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">
            Mã QR đã hết hạn
          </h2>
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
          <h2 className="text-2xl font-bold text-red-500 mb-4">
            Thông tin QR code không hợp lệ
          </h2>
          <p className="mb-4">
            Không tìm thấy thông tin thanh toán cần thiết. Vui lòng thử lại.
          </p>
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-3 px-4">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-3 bg-gradient-to-r from-[#51bb1a] to-[#3d8b14] text-white flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className="flex items-center cursor-pointer text-white hover:text-gray-200"
          >
            <FaArrowLeft className="mr-2" /> Quay lại
          </button>
          <h1 className="text-xl font-bold flex items-center">
            {/* <img 
              src="https://i.imgur.com/Tc9t5YD.png" 
              alt="DNC Logo" 
              className="h-6 mr-2 inline" 
            /> */}
            DNC FOOD
          </h1>
        </div>

        <div className="p-4">
          <div className="text-center mb-3 pb-2 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              Quét mã QR để thanh toán
            </h2>
            <div className="flex items-center justify-center space-x-2 text-sm">
              <p className="text-gray-600">
                Đơn hàng: <span className="font-semibold">#{orderId}</span>
              </p>

            </div>
            <div className="bg-yellow-50 rounded-md mt-1 p-2">
              <p className="text-yellow-600 text-[14px] font-medium">
                Mã QR sẽ hết hạn sau:{" "}
                <span className="font-bold">{formatTime(timeLeft)}</span>
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Left Side: QR Code and Payment Info */}
            <div className="space-y-3">
              {/* QR Code */}
              <div className="flex flex-col items-center">
                <div className="p-2 border-2 border-gray-200 rounded-lg bg-white relative">
                  <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#51bb1a]"></div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#51bb1a]"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#51bb1a]"></div>
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#51bb1a]"></div>
                  <img
                    src={qrCode}
                    alt="QR Code Thanh Toán"
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <div className="mt-2 text-center flex space-x-2">
                  <button
                    onClick={forceCheckStatus}
                    disabled={checking || expired}
                    className={`py-1.5 px-3 rounded-md ${
                      checking
                        ? "bg-gray-400"
                        : "bg-[#51bb1a] hover:bg-[#3d8b14]"
                    } text-white transition-colors text-xs font-medium`}
                  >
                    {checking ? "Đang kiểm tra..." : "Kiểm tra thanh toán"}
                  </button>
                  <a
                    href={qrCode}
                    download={`QR-thanh-toan-${orderId}.png`}
                    className="py-1.5 px-3 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors text-xs font-medium flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Tải QR
                  </a>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-2 text-xs uppercase tracking-wide flex items-center">
                  <span className=" w-5 h-5 bg-[#51bb1a] text-white rounded-full text-xs flex items-center justify-center mr-2">
                    1
                  </span>
                  Thông tin chuyển khoản
                </h3>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center">
                    <div className="w-1/3">
                      <p className="text-xs text-gray-500">Ngân hàng</p>
                    </div>
                    <div className="w-2/3">
                      <p className="font-medium text-sm">
                        {decodeURIComponent(
                          bankName || "MBBank - Ngân hàng TMCP Quân đội"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-1/3">
                      <p className="text-xs text-gray-500">Số tài khoản</p>
                    </div>
                    <div className="w-2/3 flex items-center justify-between">
                      <p className="font-medium text-sm">{accountNumber}</p>
                      <button
                        onClick={() => copyToClipboard(accountNumber)}
                        className="text-[#51bb1a] p-1 hover:bg-gray-200 rounded-full"
                        title="Sao chép"
                      >
                        <FaCopy size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-1/3">
                      <p className="text-xs text-gray-500">Chủ tài khoản</p>
                    </div>
                    <div className="w-2/3">
                      <p className="font-medium text-sm">
                        {decodeURIComponent(
                          accountName || "NGUYEN TRONG KHIEM"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-1/3">
                      <p className="text-xs text-gray-500">Số tiền</p>
                    </div>
                    <div className="w-2/3">
                      <p className="font-medium text-sm">
                        {formatCurrency(amount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-1/3">
                      <p className="text-xs text-gray-500">Nội dung CK</p>
                    </div>
                    <div className="w-2/3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{orderId}</p>
                        <button
                          onClick={() => copyToClipboard(orderId)}
                          className="text-[#51bb1a] p-1 hover:bg-gray-200 rounded-full"
                          title="Sao chép"
                        >
                          <FaCopy size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Chỉ điền mã đơn hàng, không thêm ký tự khác
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Payment Steps */}
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 h-full">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide flex items-center">
                <span className="w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center mr-2">
                  2
                </span>
                Hướng dẫn thanh toán
              </h3>

              <div className="space-y-4 text-[14px] ">
                <ol className="space-y-3 pl-2 flex flex-col gap-1">
                  <li className="text-xs text-gray-700 flex">
                    <span className=" w-4 h-4 bg-blue-100 text-blue-500 rounded-full text-xs flex items-center justify-center mr-2 flex-shrink-0">
                      1
                    </span>
                    <span>
                      Mở ứng dụng ngân hàng hoặc ví điện tử trên điện thoại
                    </span>
                  </li>
                  <li className="text-xs text-gray-700 flex">
                    <span className=" w-4 h-4 bg-blue-100 text-blue-500 rounded-full text-xs flex items-center justify-center mr-2 flex-shrink-0">
                      2
                    </span>
                    <span>
                      Quét mã QR hoặc chuyển khoản thủ công với thông tin bên
                      trái
                    </span>
                  </li>
                  <li className="text-xs text-gray-700 flex">
                    <span className=" w-4 h-4 bg-blue-100 text-blue-500 rounded-full text-xs flex items-center justify-center mr-2 flex-shrink-0">
                      3
                    </span>
                    <span>
                      Nhập chính xác số tiền <b>{formatCurrency(amount)}</b>
                    </span>
                  </li>
                  <li className="text-xs text-gray-700 flex">
                    <span className=" w-4 h-4 bg-blue-100 text-blue-500 rounded-full text-xs flex items-center justify-center mr-2 flex-shrink-0">
                      4
                    </span>
                    <span>
                      Nhập đúng nội dung chuyển khoản: <b>{orderId}</b>
                    </span>
                  </li>
                  <li className="text-xs text-gray-700 flex">
                    <span className=" w-4 h-4 bg-blue-100 text-blue-500 rounded-full text-xs flex items-center justify-center mr-2 flex-shrink-0">
                      5
                    </span>
                    <span>Xác nhận và hoàn tất thanh toán</span>
                  </li>
                </ol>

                <div className="mt-4 pt-3 border-t border-blue-100">
                  <div className="bg-white p-3 rounded-md">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">
                      Lưu ý quan trọng:
                    </h4>
                    <ul className="space-y-1 text-xs text-gray-600 pl-4 list-disc">
                      <li>Mã QR chỉ có hiệu lực trong thời gian giới hạn</li>
                      <li>
                        Nhập chính xác nội dung chuyển khoản để hệ thống xác
                        nhận tự động
                      </li>
                      <li>Không tắt trang này trong quá trình thanh toán</li>
                      <li>
                        Hệ thống sẽ cập nhật tự động sau khi nhận được thanh
                        toán
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 mt-3 pt-2 border-t">
          <p className="flex items-center justify-center p-2">
            <span
              className={`h-2 w-2 rounded-full ${
                checking ? "bg-green-500 animate-pulse" : "bg-gray-300"
              } mr-1.5`}
            ></span>
            Hệ thống tự động xác nhận sau khi bạn chuyển khoản thành công
            {checking && (
              <span className="text-[#51bb1a] ml-1">(đang kiểm tra...)</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentQR;
