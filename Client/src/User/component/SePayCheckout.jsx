import { Card, Divider } from "antd";

const SePayCheckout = () => {
  return (
    <Card className="sepay-info mb-4">
      <h4 className="text-lg font-medium mb-2">Thanh toán qua SePay</h4>
      <p className="text-gray-600 mb-3">
        SePay hỗ trợ nhiều phương thức thanh toán an toàn và tiện lợi
      </p>
      <Divider className="my-3" />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h5 className="font-medium text-md mb-2">Thanh toán bằng:</h5>
          <ul className="list-disc pl-5 text-gray-600">
            <li>Thẻ ATM nội địa</li>
            <li>Thẻ quốc tế (Visa, Mastercard)</li>
            <li>Ví điện tử</li>
            <li>Quét mã QR</li>
          </ul>
        </div>
        <div className="flex items-center justify-center">
          <img 
            src="/images/sepay-logo.png" 
            alt="SePay Payment Logo" 
            className="max-h-16"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/150x60?text=SePay";
            }}
          />
        </div>
      </div>
      <Divider className="my-3" />
      <p className="text-sm text-gray-500 italic">
        Bạn sẽ được chuyển đến cổng thanh toán an toàn của SePay sau khi xác nhận
      </p>
    </Card>
  );
};

export default SePayCheckout; 