/* eslint-disable no-unused-vars */
import { ExitIcon } from "@radix-ui/react-icons";
import { Avatar } from "primereact/avatar";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCar, faMoneyCheckDollar, faTicket, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import paymentApi from "../../../api/paymentApi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import formatCurrency from "../../Until/FotmatPrice";
import orderApi from "../../../api/orderApi";
import authApi from "../../../api/authApi";
import couponApi from "../../../api/couponApi";
import axios from "axios";
import { API_URLS } from "../../../config/apiConfig";

export default function Payment() {
  const [users, setUsers] = useState(null);
  const [orderDetails, setOrderDetails] = useState({
    products: [],
    totalAmount: 0,
    productCount: 0,
  });
  const [note, setNote] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("delivery");
  const [selectedDelivery, setSelectedDelivery] = useState("standard");
  const [selectedPayment, setSelectedPayment] = useState("cod");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const navigate = useNavigate();
  const { paymentId } = useParams();
  const [loading, setLoading] = useState(false);

  const calculateShippingFee = () => {
    return selectedPayment === "sepay" ? 0 : 40000;
  };

  const calculateSubtotal = () => {
    return orderDetails.totalAmount;
  };

  const calculateFinalTotal = () => {
    const subtotal = calculateSubtotal();
    const shippingFee = calculateShippingFee();
    return subtotal + shippingFee - couponDiscount;
  };

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        if (!paymentId) {
          navigate("/gio-hang");
          return;
        }
        const response = await paymentApi.getPaymentById(paymentId);
        const paymentData = response.data || response;

        setOrderDetails({
          products: paymentData.products || [],
          totalAmount: paymentData.totalAmount || 0,
          productCount: paymentData.products?.length || 0,
        });

        try {
          const userResponse = await authApi.getProfile();
          setUsers(userResponse.data);
        } catch (userError) {
          toast.error("Không thể tải thông tin người dùng");
        }
      } catch (error) {
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
      toast.error("Xoá đơn hàng thất bại");
    }
  };

  const handleApplyCoupon = async () => {
    // Xóa thông báo lỗi cũ
    setCouponError("");
    setCouponSuccess("");
    
    // Kiểm tra đã nhập mã giảm giá chưa
    if (!couponCode.trim()) {
      setCouponError("Vui lòng nhập mã giảm giá");
      return;
    }
    
    setValidatingCoupon(true);
    
    try {
      // Gọi API để kiểm tra mã giảm giá
      const result = await couponApi.validateCoupon(couponCode, calculateSubtotal());
      
      if (result.success) {
        // Lưu thông tin mã giảm giá đã áp dụng
        setAppliedCoupon(result.data.coupon);
        setCouponDiscount(result.data.discountAmount);
        setCouponSuccess(result.data.message);
        
        // Hiển thị thông báo thành công
        toast.success(result.data.message);
      } else {
        // Hiển thị lỗi
        setCouponError(result.message);
        setCouponDiscount(0);
        setAppliedCoupon(null);
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      setCouponError(error.message || "Không thể áp dụng mã giảm giá");
      setCouponDiscount(0);
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponDiscount(0);
    setCouponSuccess("");
    setCouponError("");
    setAppliedCoupon(null);
    toast.info("Đã hủy mã giảm giá");
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPayment(method);
  };

  const handleDeliveryMethodChange = (method) => {
    setSelectedDelivery(method);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    if (!users) {
      toast.error("Vui lòng đăng nhập để tiếp tục!");
      setLoading(false);
      return;
    }

    if (!users.address) {
      toast.error("Vui lòng cập nhật địa chỉ giao hàng!");
      setLoading(false);
      return;
    }

    try {
      const orderId = `${new Date().getTime()}-${Math.floor(
        Math.random() * 1000
      )}`;
      const totalAmount = calculateFinalTotal();
      const orderInfo = `Thanh toán đơn hàng ${orderId}`;
      const currentShippingFee = calculateShippingFee();

      const orderData = {
        userId: users._id,
        products: orderDetails.products.map((product) => ({
          productId: product.productId._id,
          quantity: product.quantity,
          price: product.productId.productPrice,
        })),
        totalAmount: totalAmount,
        subtotal: calculateSubtotal(),
        deliveryMethod: selectedMethod,
        deliveryFee: currentShippingFee,
        address: users.address,
        note: note,
        paymentMethod: selectedPayment,
        status: "awaiting_payment",
      };
      
      // Thêm thông tin mã giảm giá nếu có
      if (appliedCoupon) {
        orderData.coupon = {
          code: appliedCoupon.code,
          discount: couponDiscount
        };
      }

      if (selectedPayment === "sepay") {
        try {
          const paymentData = {
            userId: users._id,
            amount: totalAmount,
            products: orderDetails.products.map((product) => ({
              productId: product.productId._id,
              quantity: product.quantity,
              price: product.productId.productPrice,
            })),
            paymentMethod: selectedPayment,
            couponDiscount: couponDiscount,
            couponCode: appliedCoupon?.code
          };

          const paymentResponse = await paymentApi.createPayment(paymentData);
          const paymentId = paymentResponse.data._id;

          const sepayResponse = await paymentApi.createSepayPaymentUrl(
            paymentId,
            totalAmount,
            orderInfo
          );

          if (sepayResponse) {
            const orderResponse = await orderApi.createOrder(orderData);
            const orderIdCreated = orderResponse._id;

            try {
              await paymentApi.updatePayment(paymentId, {
                orderId: orderIdCreated,
              });
            } catch (updateError) {
              await axios.patch(
                `${API_URLS.PAYMENTS}/${paymentId}`,
                { orderId: orderIdCreated },
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );
            }
            
            // Cập nhật số lần sử dụng mã giảm giá nếu có
            if (appliedCoupon) {
              try {
                await couponApi.updateCouponUsage(appliedCoupon.code);
              } catch (couponError) {
                console.error("Error updating coupon usage:", couponError);
              }
            }

            if (sepayResponse.method === "bank_transfer") {
              toast.info("Sử dụng phương thức thanh toán QR chuyển khoản");
              navigate(
                `/payment-qr?orderId=${orderIdCreated}&qrCode=${encodeURIComponent(
                  sepayResponse.qrCode
                )}&bankName=${encodeURIComponent(
                  sepayResponse.bankInfo.name
                )}&accountNumber=${
                  sepayResponse.bankInfo.accountNumber
                }&accountName=${encodeURIComponent(
                  sepayResponse.bankInfo.accountName
                )}&amount=${totalAmount}`
              );
              return;
            }

            if (sepayResponse.method === "sepay" && sepayResponse.data) {
              window.location.href = sepayResponse.data;
              return;
            }

            if (sepayResponse.fallbackQR) {
              toast.info(
                "Chuyển sang phương thức thanh toán chuyển khoản ngân hàng"
              );
              navigate(
                `/payment-qr?orderId=${orderIdCreated}&qrCode=${encodeURIComponent(
                  sepayResponse.fallbackQR
                )}&bankName=MBBank&accountNumber=0326743391&accountName=NGUYEN%20TRONG%20KHIEM&amount=${totalAmount}`
              );
              return;
            }

            if (sepayResponse.data) {
              window.location.href = sepayResponse.data;
              return;
            }

            throw new Error("Không nhận được thông tin thanh toán hợp lệ");
          } else {
            throw new Error("Không nhận được phản hồi từ cổng thanh toán");
          }
        } catch (error) {
          toast.error(
            `Không thể kết nối đến cổng thanh toán: ${error.message}`
          );
        }
      } else {
        orderData.status = "pending";
        const orderResponse = await orderApi.createOrder(orderData);
        const orderIdCreated = orderResponse._id;
        
        // Cập nhật số lần sử dụng mã giảm giá nếu có
        if (appliedCoupon) {
          try {
            await couponApi.updateCouponUsage(appliedCoupon.code);
          } catch (couponError) {
            console.error("Error updating coupon usage:", couponError);
          }
        }

        toast.success("Đặt hàng thành công!");
        navigate(
          `/payment-result?orderId=${orderIdCreated}&status=success&amount=${totalAmount}`
        );
      }
    } catch (error) {
      toast.error("Không thể đặt hàng. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    setUsers((prev) => ({
      ...prev,
      phone: e.target.value,
    }));
  };

  const handleAddressChange = (e) => {
    setUsers((prev) => ({
      ...prev,
      address: e.target.value,
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
            <button
              onClick={handleLogout}
              className="text-[#51bb1a] flex items-center gap-2 hover:text-[#51bb1a] transition"
            >
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
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3 mb-3">
                <FontAwesomeIcon icon={faCar} className="text-[#51bb1a]" />
                Vận chuyển
              </h3>
              <div className="border border-gray-300 rounded-md">
                <label className="flex items-center p-3 hover:bg-gray-50 transition cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    checked={selectedMethod === "delivery"}
                    onChange={() => setSelectedMethod("delivery")}
                    className="mr-3 text-[#51bb1a] focus:ring-[#51bb1a]"
                  />
                  <span className="flex-grow">Giao hàng tiêu chuẩn</span>
                  <span className="font-semibold text-[#51bb1a]">
                    {selectedPayment === "sepay" ? "Miễn phí" : "40.000đ"}
                  </span>
                </label>
              </div>
            </div>

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
                      <span className="mr-2">
                        Thanh toán khi nhận hàng (COD)
                      </span>
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
                      <span className="mr-2">
                        Thanh toán qua MbBank (Miễn phí vận chuyển)
                      </span>
                      <img
                        src="https://imgs.search.brave.com/c32x_Ya9gIz9oeR2LflnKsJQrHPvswMor65hM7AmCf8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9ydXli/YW5ncGh1b25naG9h/bmcuY29tL3dwLWNv/bnRlbnQvdXBsb2Fk/cy8yMDI0LzEwL0xP/R09NQkJBTkstMTMy/OHg4MDAuanBn"
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
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Đặt hàng"}
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

          {/* Mã giảm giá */}
          <div className="pt-3 mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FontAwesomeIcon icon={faTicket} className="text-[#51bb1a] mr-2" />
              Mã giảm giá
            </label>
            <div className="flex">
              <input
                type="text"
                placeholder="Nhập mã giảm giá"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-grow p-2 border border-gray-300 border-r-0 rounded-l-md outline-none"
                disabled={!!appliedCoupon}
              />
              {appliedCoupon ? (
                <button
                  onClick={handleRemoveCoupon}
                  className="bg-red-500 text-white px-3 rounded-r-md hover:bg-red-600 transition flex items-center"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              ) : (
                <button
                  onClick={handleApplyCoupon}
                  className={`bg-[#51bb1a] text-white px-4 border border-[#51bb1a] rounded-r-md hover:bg-[#48a718] transition ${
                    validatingCoupon ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  disabled={validatingCoupon}
                >
                  {validatingCoupon ? 'Đang áp dụng...' : 'Áp dụng'}
                </button>
              )}
            </div>
            
            {/* Hiển thị thông báo lỗi hoặc thành công */}
            {couponError && (
              <p className="text-red-500 mt-1 text-sm">{couponError}</p>
            )}
            {couponSuccess && (
              <p className="text-green-600 mt-1 text-sm">{couponSuccess}</p>
            )}
          </div>

          <div className="space-y-2 border-t pt-3 flex flex-col gap-2">
            <div className="flex justify-between text-gray-700">
              <span>Tạm tính</span>
              <span>{formatCurrency(calculateSubtotal())}đ</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Phí vận chuyển</span>
              <span>{formatCurrency(calculateShippingFee())}đ</span>
            </div>
            
            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá</span>
                <span>-{formatCurrency(couponDiscount)}đ</span>
              </div>
            )}
            
            <div className="flex justify-between font-bold text-xl text-[#51bb1a] border-t pt-3">
              <span>Tổng cộng</span>
              <span>{formatCurrency(calculateFinalTotal())}đ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
