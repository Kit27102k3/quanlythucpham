import { ChevronDownIcon, ExitIcon } from "@radix-ui/react-icons";
import { Badge } from "primereact/badge";
import { Avatar } from "primereact/avatar";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCar, faMoneyCheckDollar } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import paymentApi from "../../api/paymentApi";
import { toast } from "react-toastify";
import formatCurrency from "../Until/FotmatPrice";
import useFetchUserProfile from "../Until/useFetchUserProfile";

export default function Payment() {
  const [orderDetails, setOrderDetails] = useState({
    productCount: 1,
    totalPrice: 53500,
  });

  const [coupon, setCoupon] = useState("");
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const users = useFetchUserProfile();

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        if (!paymentId) {
          navigate("/gio-hang");
          return;
        }
        const response = await paymentApi.getPaymentById(paymentId);
        setOrderDetails(response);
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
    console.log(`Applying coupon: ${coupon}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden grid md:grid-cols-[1fr_400px]">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-[#51bb1a]">
              DNC <span className="text-[#51bb1a]">FOOD</span>
            </h1>
            <button className="text-[#51bb1a] flex items-center gap-2 hover:text-[#51bb1a] transition">
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
                  value={`${users?.firstName} ${users?.lastName}`}
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
                  value={users?.phone}
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
                value={users?.address}
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
                    name="delivery"
                    className="mr-3 text-[#51bb1a] focus:ring-[#51bb1a]"
                  />
                  <span className="flex-grow">Giao hàng tiêu chuẩn</span>
                  <span className="font-semibold text-[#51bb1a]">40.000đ</span>
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
                <label className="flex items-center p-3 hover:bg-gray-50 transition cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    className="mr-3 text-[#51bb1a] focus:ring-[#51bb1a]"
                  />
                  <span>Thanh toán khi nhận hàng (COD)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <button className="w-full cursor-pointer bg-[#51bb1a] text-white py-3 rounded-lg hover:opacity-90  transition">
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
              Đơn hàng ({orderDetails?.products?.quantity} sản phẩm)
            </span>
            <span className="font-bold text-[#51bb1a]">
              {orderDetails?.totalAmount?.toLocaleString()}đ
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
                    image={product?.productId?.productImages[0]}
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
                  {formatCurrency(product.productId?.productPrice)}đ
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t pt-3 flex flex-col gap-2">
            <div className="flex justify-between text-gray-700">
              <span>Tạm tính</span>
              <span>13.500đ</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Phí vận chuyển</span>
              <span>40.000đ</span>
            </div>
            <div className="flex justify-between font-bold text-xl text-[#51bb1a] border-t pt-3">
              <span>Tổng cộng</span>
              <span>{formatCurrency(orderDetails.totalAmount)}đ</span>
            </div>
          </div>

          <div className="flex mt-2">
            <input
              type="text"
              placeholder="Nhập mã giảm giá"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
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
