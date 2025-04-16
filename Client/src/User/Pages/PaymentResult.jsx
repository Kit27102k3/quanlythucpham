import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { formatCurrency } from "../../utils/formatCurrency";
import axios from "axios";

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [checkCount, setCheckCount] = useState(0);
  const MAX_CHECKS = 10; // Số lần kiểm tra tối đa
  const CHECK_INTERVAL = 3000; // Thời gian giữa các lần kiểm tra (3 giây)

  const checkPaymentStatus = async (orderId) => {
    try {
      const response = await axios.get(`/api/payments/status/${orderId}`);
      if (response.data.success) {
        setOrderData(prevData => ({
          ...prevData,
          status: response.data.status,
          amount: response.data.amount || prevData.amount
        }));
        
        // Nếu trạng thái đã xác định (completed hoặc failed), dừng kiểm tra
        if (["completed", "failed"].includes(response.data.status)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error checking payment status:", error);
      return false;
    }
  };

  useEffect(() => {
    // Parse query parameters
    const searchParams = new URLSearchParams(location.search);
    const orderId = searchParams.get("orderId");
    const status = searchParams.get("status") || searchParams.get("vnp_ResponseCode");
    const amount = searchParams.get("amount");
    
    // Create a minimal order object from URL parameters
    setOrderData({
      orderId: orderId || "Unknown",
      amount: amount ? parseFloat(amount) : 0,
      status: status === "success" || status === "00" ? "completed" : "pending"
    });

    // Nếu có orderId và trạng thái chưa hoàn thành, bắt đầu kiểm tra định kỳ
    if (orderId && status !== "success" && status !== "00") {
      const intervalId = setInterval(async () => {
        setCheckCount(prev => {
          // Nếu đã kiểm tra đủ số lần, dừng lại
          if (prev >= MAX_CHECKS) {
            clearInterval(intervalId);
            setLoading(false);
            return prev;
          }
          return prev + 1;
        });

        const isComplete = await checkPaymentStatus(orderId);
        if (isComplete) {
          clearInterval(intervalId);
          setLoading(false);
        }
      }, CHECK_INTERVAL);

      // Cleanup interval khi component unmount
      return () => clearInterval(intervalId);
    } else {
      setLoading(false);
    }
  }, [location]);

  const handleContinueShopping = () => {
    navigate("/");
  };

  const handleViewOrder = () => {
    navigate(`/orders/${orderData.orderId}`);
  };

  if (loading && checkCount < MAX_CHECKS) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        <p className="mt-4 text-gray-600">Đang kiểm tra trạng thái thanh toán...</p>
      </div>
    );
  }

  const isSuccess = orderData?.status === "completed" || 
                    location.search.includes("status=success") || 
                    location.search.includes("vnp_ResponseCode=00");

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center">
            {isSuccess ? (
              <FaCheckCircle className="mx-auto h-16 w-16 text-green-500" />
            ) : (
              <FaTimesCircle className="mx-auto h-16 w-16 text-red-500" />
            )}
            <h2 className="mt-4 text-2xl font-semibold text-gray-900">
              {isSuccess ? "Đặt hàng thành công" : "Đặt hàng thất bại"}
            </h2>
            <p className="mt-2 text-gray-600">
              {isSuccess
                ? "Cảm ơn bạn đã mua hàng. Chúng tôi sẽ xử lý đơn hàng của bạn sớm nhất có thể."
                : "Đã có lỗi xảy ra trong quá trình đặt hàng. Vui lòng thử lại."}
            </p>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-8">
            <dl className="divide-y divide-gray-200">
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Mã đơn hàng</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {orderData.orderId}
                </dd>
              </div>
              {orderData.amount > 0 && (
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Tổng tiền</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatCurrency(orderData.amount)}
                  </dd>
                </div>
              )}
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Trạng thái</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {isSuccess ? "Đã đặt hàng thành công" : "Đặt hàng thất bại"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={handleContinueShopping}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Tiếp tục mua sắm
            </button>
            {isSuccess && (
              <button
                onClick={handleViewOrder}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Xem đơn hàng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult; 