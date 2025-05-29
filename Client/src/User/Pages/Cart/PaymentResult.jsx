/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { formatCurrency } from "../../../utils/formatCurrency";
import axios from "axios";

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [checkCount, setCheckCount] = useState(0);
  const [branchInfo, setBranchInfo] = useState(null);
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
    const params = new URLSearchParams(location.search);
    const orderId = params.get("orderId");
    const status = params.get("status");
    const amount = params.get("amount");
    
    const fetchOrderDetails = async () => {
      if (orderId) {
        try {
          // Lấy thông tin đơn hàng
          const response = await axios.get(`/api/orders/${orderId}`);
          if (response.data) {
            setOrderData({
              orderId,
              status: status || response.data.status,
              amount: amount || response.data.totalAmount,
              orderCode: response.data.orderCode,
              createdAt: response.data.createdAt,
              paymentMethod: response.data.paymentMethod,
              products: response.data.products,
              shippingInfo: response.data.shippingInfo,
              branchId: response.data.branchId
            });
            
            // Nếu có branchId, lấy thông tin chi nhánh
            if (response.data.branchId) {
              try {
                const branchResponse = await axios.get(`/api/branches/${response.data.branchId}`);
                if (branchResponse.data && branchResponse.data.success) {
                  setBranchInfo(branchResponse.data.branch);
                }
              } catch (branchError) {
                console.error("Error fetching branch info:", branchError);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching order details:", error);
          // Nếu không thể lấy thông tin từ API, sử dụng dữ liệu từ URL
          setOrderData({
            orderId,
            status: status || "pending",
            amount: amount || 0
          });
        }
        
        setLoading(false);
      } else {
        // Nếu không có orderId, chuyển hướng về trang chủ
        navigate("/");
      }
    };
    
    fetchOrderDetails();
    
    // Nếu trạng thái là chờ thanh toán, kiểm tra trạng thái sau mỗi khoảng thời gian
    if (status === "awaiting_payment" && orderId) {
      const intervalId = setInterval(async () => {
        setCheckCount(prev => {
          const newCount = prev + 1;
          // Dừng kiểm tra sau số lần tối đa
          if (newCount >= MAX_CHECKS) {
            clearInterval(intervalId);
          }
          return newCount;
        });
        
        const statusResolved = await checkPaymentStatus(orderId);
        if (statusResolved) {
          clearInterval(intervalId);
        }
      }, CHECK_INTERVAL);
      
      return () => clearInterval(intervalId);
    }
  }, [location.search, navigate, MAX_CHECKS, CHECK_INTERVAL]);

  const handleContinueShopping = () => {
    navigate("/");
  };

  const handleViewOrder = () => {
    navigate(`/tai-khoan/don-hang/${orderData.orderId}`);
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
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

          {isSuccess && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900">Thông tin đơn hàng</h3>
              <dl className="mt-3 space-y-3 text-sm text-gray-600">
                {orderData?.orderCode && (
                  <div className="flex justify-between">
                    <dt>Mã đơn hàng:</dt>
                    <dd className="font-medium text-gray-900">{orderData.orderCode}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt>Tổng tiền:</dt>
                  <dd className="font-medium text-gray-900">{formatCurrency(orderData?.amount || 0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Phương thức thanh toán:</dt>
                  <dd className="font-medium text-gray-900">
                    {orderData?.paymentMethod === "cod" ? "Thanh toán khi nhận hàng (COD)" : "Thanh toán trực tuyến"}
                  </dd>
                </div>
                {orderData?.createdAt && (
                  <div className="flex justify-between">
                    <dt>Ngày đặt:</dt>
                    <dd className="font-medium text-gray-900">
                      {new Date(orderData.createdAt).toLocaleDateString('vi-VN')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Hiển thị chi nhánh phục vụ nếu có */}
          {isSuccess && branchInfo && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900">Chi nhánh phục vụ</h3>
              <div className="mt-3 bg-gray-50 p-3 rounded-md">
                <div className="space-y-2">
                  <p className="font-medium text-gray-800">{branchInfo.name}</p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <i className="pi pi-map-marker mr-2 text-green-600"></i>
                    {branchInfo.address}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <i className="pi pi-phone mr-2 text-green-600"></i>
                    {branchInfo.phone}
                  </p>
                  {branchInfo.openingHours && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <i className="pi pi-clock mr-2 text-green-600"></i>
                      Giờ mở cửa: {branchInfo.openingHours}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 text-sm lg:text-[16px] flex justify-center gap-4 space-x-4">
            <button
              onClick={handleContinueShopping}
              className="px-4 py-2 bg-[#51bb1a] text-white rounded-md hover:bg-green-600 cursor-pointer"
            >
              Tiếp tục mua sắm
            </button>
            {isSuccess && (
              <button
                onClick={handleViewOrder}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer"
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