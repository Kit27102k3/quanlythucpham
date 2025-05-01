import { useParams } from "react-router-dom";

function OrderConfirmation() {
  const { orderId } = useParams();

  return (
    <div className="text-center py-20">
      <h1 className="text-3xl font-bold text-[#51bb1a] mb-4">
        Đặt hàng thành công!
      </h1>
      <p>
        Mã đơn hàng: <strong>{orderId}</strong>
      </p>
      <p>Chúng tôi sẽ liên hệ bạn để xác nhận.</p>
    </div>
  );
}

export default OrderConfirmation;
