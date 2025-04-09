import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { formatCurrency } from "../../utils/formatCurrency";

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    // Parse query parameters
    const searchParams = new URLSearchParams(location.search);
    const orderId = searchParams.get("orderId");
    const status = searchParams.get("status") || searchParams.get("vnp_ResponseCode");
    const amount = searchParams.get("amount");
    
    console.log("URL Parameters:", { orderId, status, amount });

    // Create a minimal order object from URL parameters
    setOrderData({
      orderId: orderId || "Unknown",
      amount: amount ? parseFloat(amount) : 0,
      status: status === "success" || status === "00" ? "completed" : "pending"
    });

    setLoading(false);
  }, [location]);

  const handleContinueShopping = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
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

          <div className="mt-8 text-center">
            <button
              onClick={handleContinueShopping}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult; 