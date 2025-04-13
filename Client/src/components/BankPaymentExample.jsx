import { useState } from 'react';
import BankQRCode from './BankQRCode';

const BankPaymentExample = () => {
  const [selectedPayment, setSelectedPayment] = useState('sepay');
  const orderId = 'ORDER' + Date.now();
  const amount = 150000; // 150,000 VND

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-center">Thanh toán đơn hàng</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Chọn phương thức thanh toán</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div 
            className={`border rounded-lg p-4 cursor-pointer ${selectedPayment === 'sepay' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            onClick={() => setSelectedPayment('sepay')}
          >
            <div className="flex items-center">
              <input 
                type="radio" 
                checked={selectedPayment === 'sepay'} 
                onChange={() => setSelectedPayment('sepay')}
                className="mr-2"
              />
              <div>
                <h3 className="font-semibold">Thanh toán qua SePay</h3>
                <p className="text-sm text-gray-600">Thanh toán an toàn qua cổng SePay</p>
              </div>
            </div>
          </div>
          
          <div 
            className={`border rounded-lg p-4 cursor-pointer ${selectedPayment === 'bank' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            onClick={() => setSelectedPayment('bank')}
          >
            <div className="flex items-center">
              <input 
                type="radio" 
                checked={selectedPayment === 'bank'} 
                onChange={() => setSelectedPayment('bank')}
                className="mr-2"
              />
              <div>
                <h3 className="font-semibold">Chuyển khoản ngân hàng</h3>
                <p className="text-sm text-gray-600">Quét mã QR để chuyển khoản trực tiếp</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Thông tin đơn hàng */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="font-semibold mb-2">Thông tin đơn hàng</h3>
          <p className="text-sm">Mã đơn hàng: <span className="font-medium">{orderId}</span></p>
          <p className="text-sm">Tổng tiền: <span className="font-medium text-red-600">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}
          </span></p>
        </div>
      </div>
      
      {/* Hiển thị phương thức thanh toán đã chọn */}
      {selectedPayment === 'bank' ? (
        <BankQRCode 
          amount={amount}
          orderId={orderId}
          description={`Thanh toan don hang ${orderId}`}
          defaultAccountNumber="0010000000355"
          defaultBankCode="Vietcombank"
          title="Thanh toán bằng chuyển khoản ngân hàng"
        />
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Thanh toán qua SePay</h2>
          <p className="mb-4">Nhấn nút bên dưới để tiếp tục thanh toán qua SePay</p>
          <button className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700">
            Tiếp tục thanh toán
          </button>
        </div>
      )}
    </div>
  );
};

export default BankPaymentExample; 