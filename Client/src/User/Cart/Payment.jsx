/* eslint-disable no-unused-vars */
import { ExitIcon } from "@radix-ui/react-icons";
import { Avatar } from "primereact/avatar";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCar, faMoneyCheckDollar } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import paymentApi from "../../api/paymentApi.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import formatCurrency from "../Until/FotmatPrice";
import orderApi from "../../api/orderApi";
import authApi from "../../api/authApi";

export default function Payment() {
  const [users, setUsers] = useState(null);
  const [orderDetails, setOrderDetails] = useState({
    products: [],
    totalAmount: 0,
    productCount: 0,
  });
  const [note, setNote] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("delivery");
  const [selectedDelivery, setSelectedDelivery] = useState("standard");
  const [selectedPayment, setSelectedPayment] = useState("cod");
  const navigate = useNavigate();
  const { paymentId } = useParams();

  const deliveryFee = selectedDelivery === "standard" ? 40000 : 0;
  const totalPayment = orderDetails.totalAmount + deliveryFee;

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        if (!paymentId) {
          navigate("/gio-hang");
          return;
        }
        const response = await paymentApi.getPaymentById(paymentId);
        // Kiểm tra cấu trúc response thực tế 
        const paymentData = response.data || response;
        console.log("Payment data:", paymentData);
        
        setOrderDetails({
          products: paymentData.products || [],
          totalAmount: paymentData.totalAmount || 0,
          productCount: paymentData.products?.length || 0,
        });

        try {
          const userResponse = await authApi.getProfile();
          
          setUsers(userResponse.data);
        } catch (userError) {
          console.error("Lỗi khi lấy thông tin người dùng:", userError);
          toast.error("Không thể tải thông tin người dùng");
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin thanh toán:", error);
        toast.error("Không thể tải thông tin thanh toán");
        navigate("/gio-hang");
      }
    };

    fetchPaymentDetails();
  }, [paymentId, navigate]);

  const handleRemoveItem = async () => {
    if (!paymentId) return;
    try {
      await paymentApi.deletePayment(paymentId);
      navigate("/gio-hang");
    } catch (error) {
      console.log(error);
      toast.error("Xoá đơn hàng thất bại");
    }
  };

  const handleApplyCoupon = () => {
    // console.log(`Applying coupon: ${couponCode}`);
  };

  const handlePlaceOrder = async () => {
    if (!users) {
      toast.error("Vui lòng đăng nhập để tiếp tục!");
      return;
    }

    if (!users.address) {
      toast.error("Vui lòng cập nhật địa chỉ giao hàng!");
      return;
    }

    try {
      // Create order first for both payment methods
      const orderData = {
        userId: users._id,
        products: orderDetails.products.map(product => ({
          productId: product.productId._id,
          quantity: product.quantity,
          price: product.productId.productPrice
        })),
        totalAmount: totalPayment,
        deliveryMethod: selectedMethod,
        deliveryFee: deliveryFee,
        address: users.address,
        note: note,
        paymentMethod: selectedPayment,
        status: selectedPayment === "cod" ? "pending" : "awaiting_payment"
      };

      // Create order
      const orderResponse = await orderApi.createOrder(orderData);
      const orderId = orderResponse._id;

      if (selectedPayment === "sepay") {
        try {
          // Đảm bảo amount là số nguyên dương
          // Create payment record
          const paymentData = {
            userId: users._id,
            amount: totalPayment,
            products: orderDetails.products.map(product => ({
              productId: product.productId._id,
              quantity: product.quantity,
              price: product.productId.productPrice
            })),
            paymentMethod: selectedPayment,
            orderId: orderId
          };

          const paymentResponse = await paymentApi.createPayment(paymentData);
          const paymentId = paymentResponse.data._id;

          // Create SePay payment URL
          const sepayResponse = await paymentApi.createSepayPaymentUrl(
            paymentId,
            totalPayment,
            `Thanh toán đơn hàng #${orderId}`
          );

          // Check if we got a valid payment URL
          if (sepayResponse && sepayResponse.success) {
            // Kiểm tra xem đây là phương thức thanh toán nào
            if (sepayResponse.method === "bank_transfer") {
              // Phương án QR chuyển khoản ngân hàng
              toast.info("Phát hiện sự cố kết nối với cổng thanh toán SePay. Chuyển sang phương án thanh toán chuyển khoản qua QR");
              
              // Hiển thị QR code cho chuyển khoản
              navigate(`/payment-qr?orderId=${orderId}&qrCode=${encodeURIComponent(sepayResponse.qrCode)}&bankName=${encodeURIComponent(sepayResponse.bankInfo.name)}&accountNumber=${sepayResponse.bankInfo.accountNumber}&accountName=${encodeURIComponent(sepayResponse.bankInfo.accountName)}&amount=${totalPayment}`);
            } else {
              // Nếu là SePay thông thường
              if (sepayResponse.code === "01") {
                toast.info("Đang sử dụng cổng thanh toán mẫu để kiểm tra");
              }
              // Redirect to payment URL
              window.location.href = sepayResponse.data;
            }
          } else if (sepayResponse && sepayResponse.fallbackQR) {
            // Fallback là QR trực tiếp
            toast.info("Đang chuyển sang phương án thanh toán qua chuyển khoản ngân hàng");
            
            // Tạo một trang QR tạm thời và hiển thị
            const htmlContent = `
              <html>
                <head><title>Thanh toán qua QR Code</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                  .qr-container { margin: 20px auto; }
                  .bank-info { margin: 20px auto; text-align: left; max-width: 400px; }
                  .btn-back { padding: 10px 15px; background: #51bb1a; color: white; border: none; border-radius: 4px; cursor: pointer; }
                </style>
                </head>
                <body>
                  <h2>Quét mã QR để thanh toán</h2>
                  <p>Đơn hàng: #${orderId} - Số tiền: ${formatCurrency(totalPayment)}</p>
                  <div class="qr-container">
                    <img src="${sepayResponse.fallbackQR}" alt="QR Code Thanh Toán" style="max-width: 300px;"/>
                  </div>
                  <div class="bank-info">
                    <p><strong>Thông tin chuyển khoản:</strong></p>
                    <p>Ngân hàng: MBBank - Ngân hàng Thương mại Cổ phần Quân đội</p>
                    <p>Số tài khoản: 0326743391</p>
                    <p>Tên tài khoản: NGUYEN TRONG KHIEM</p>
                    <p>Nội dung: Thanh toan don hang #${orderId}</p>
                  </div>
                  <p>Sau khi quét mã và thanh toán thành công, quý khách vui lòng chờ 1-2 phút để hệ thống xác nhận.</p>
                  <button class="btn-back" onclick="window.location.href='/payment-result?orderId=${orderId}&status=manual&amount=${totalPayment}'">
                    Tôi đã thanh toán
                  </button>
                </body>
              </html>
            `;
            
            // Tạo Blob và mở trong cửa sổ mới
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const qrUrl = URL.createObjectURL(blob);
            window.location.href = qrUrl;
          } else {
            throw new Error("Không nhận được URL thanh toán");
          }
        } catch (error) {
          console.error("Lỗi khi tạo cổng thanh toán:", error);
          toast.error("Không thể kết nối đến cổng thanh toán. Vui lòng thử lại sau!");
          // Redirect to payment result page with failure status
          navigate(`/payment-result?orderId=${orderId}&status=failed&amount=${totalPayment}`);
        }
      } else {
        // For COD, no payment record is needed immediately
        toast.success("Đặt hàng thành công!");
        navigate(`/payment-result?orderId=${orderId}&status=success&amount=${totalPayment}`);
      }
    } catch (error) {
      console.error("Lỗi khi đặt hàng:", error);
      toast.error("Không thể đặt hàng. Vui lòng thử lại!");
    }
  };

  const handlePhoneChange = (e) => {
    setUsers(prev => ({
      ...prev,
      phone: e.target.value
    }));
  };

  const handleAddressChange = (e) => {
    setUsers(prev => ({
      ...prev,
      address: e.target.value
    }));
  };

  const handleNoteChange = (e) => {
    setNote(e.target.value);
  };

  const handleLogout = () => {
    authApi.logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden grid md:grid-cols-[1fr_400px]">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-[#51bb1a]">
              DNC <span className="text-[#51bb1a]">FOOD</span>
            </h1>
            <button onClick={handleLogout} className="text-[#51bb1a] flex items-center gap-2 hover:text-[#51bb1a] transition">
              <ExitIcon />
              Đăng xuất
            </button>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3 mb-4">
              <i className="pi pi-user text-[#51bb1a]"></i>
              Thông tin nhận hàng
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ tên
                </label>
                <input
                  type="text"
                  value={`${users?.firstName || ""} ${users?.lastName || ""}`}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={users?.phone || ""}
                  onChange={handlePhoneChange}
                  className="w-full p-2 border border-gray-300 rounded-md outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">
                Địa chỉ
              </label>
              <input
                type="text"
                value={users?.address || ""}
                onChange={handleAddressChange}
                className="w-full p-2 border border-gray-300 rounded-md outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">
                Ghi chú
              </label>
              <input
                type="text"
                placeholder="Ghi chú tùy chọn..."
                value={note}
                onChange={handleNoteChange}
                className="w-full p-2 border border-gray-300 rounded-md outline-none"
              />
            </div>
          </div>

          <div className="space-y-4 mt-2">
            {/* Vận chuyển */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3 mb-3">
                <FontAwesomeIcon icon={faCar} className="text-[#51bb1a]" />
                Vận chuyển
              </h3>
              <div className="border border-gray-300 rounded-md">
                <label className="flex items-center p-3 hover:bg-gray-50 transition cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === "delivery"}
                    onChange={() => setSelectedMethod("delivery")}
                    className="mr-3 text-[#51bb1a] focus:ring-[#51bb1a]"
                  />
                  <span className="flex-grow">Giao hàng tiêu chuẩn</span>
                  <span className="font-semibold text-[#51bb1a]">40.000đ</span>
                </label>
              </div>
            </div>

            {/* Thanh toán */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3 mb-3 mt-2">
                <FontAwesomeIcon
                  icon={faMoneyCheckDollar}
                  className="text-[#51bb1a]"
                />
                Thanh toán
              </h3>
              <div className="border border-gray-300 rounded-md">
                <div className="space-y-2">
                  <label className="flex items-center p-3 hover:bg-gray-50 transition cursor-pointer border-t border-gray-200">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={selectedPayment === "cod"}
                      onChange={() => setSelectedPayment("cod")}
                      className="mr-3 text-[#51bb1a] focus:ring-[#51bb1a]"
                    />
                    <div className="flex items-center">
                      <span className="mr-2">Thanh toán khi nhận hàng (COD)</span>
                    </div>
                  </label>
                  <label className="flex items-center p-3 hover:bg-gray-50 transition cursor-pointer border-t border-gray-200">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={selectedPayment === "sepay"}
                      onChange={() => setSelectedPayment("sepay")}
                      className="mr-3 text-[#51bb1a] focus:ring-[#51bb1a]"
                    />
                    <div className="flex items-center">
                      <span className="mr-2">Thanh toán qua SePay</span>
                      <img 
                        src="/sepay-logo.png" 
                        alt="SePay" 
                        className="h-6 ml-2" 
                      />
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <button
              onClick={handlePlaceOrder}
              className="w-full cursor-pointer bg-[#51bb1a] text-white py-3 rounded-lg hover:opacity-90  transition"
            >
              Đặt hàng
            </button>
            <button
              onClick={handleRemoveItem}
              className="w-full cursor-pointer border border-[#51bb1a] text-[#51bb1a] py-3 rounded-lg hover:opacity-90 transition"
            >
              Quay về giỏ hàng
            </button>
          </div>
        </div>

        <div className="bg-gray-100 p-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <span className="font-semibold text-gray-800">
              Đơn hàng ({orderDetails?.productCount} sản phẩm)
            </span>
            <span className="font-bold text-[#51bb1a]">
              {formatCurrency(orderDetails?.totalAmount)}
            </span>
          </div>

          <div className="space-y-3">
            {orderDetails?.products?.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white p-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    image={product?.productId?.productImages?.[0]}
                    size="large"
                    className="rounded-md"
                  />
                  <div>
                    <p className="font-medium text-gray-800">
                      {product?.productId?.productName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Số lượng: {product.quantity}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-[#51bb1a]">
                  {formatCurrency(product?.productId?.productPrice)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t pt-3 flex flex-col gap-2">
            <div className="flex justify-between text-gray-700">
              <span>Tạm tính</span>
              <span>{formatCurrency(orderDetails.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Phí vận chuyển</span>
              <span>{formatCurrency(deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-xl text-[#51bb1a] border-t pt-3">
              <span>Tổng cộng</span>
              <span>{formatCurrency(totalPayment)}</span>
            </div>
          </div>

          <div className="flex mt-2">
            <input
              type="text"
              placeholder="Nhập mã giảm giá"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-grow p-2 border border-[#51bb1a] border-r-0 rounded-l-md outline-none"
            />
            <button
              onClick={handleApplyCoupon}
              className="bg-[#51bb1a] text-white px-4 border border-[#51bb1a] rounded-r-md hover:bg-[#51bb1a] transition"
            >
              Áp dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
