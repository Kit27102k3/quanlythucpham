/* eslint-disable react/prop-types */
/* eslint-disable react-hooks/exhaustive-deps */
import  { useState, useEffect } from 'react';
import paymentApi from '../api/paymentApi';
import { toast } from 'react-toastify';

// Danh sách ngân hàng phổ biến ở Việt Nam
const POPULAR_BANKS = [
  { code: 'Vietcombank', name: 'Vietcombank' },
  { code: 'VietinBank', name: 'VietinBank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'Agribank', name: 'Agribank' },
  { code: 'TPBank', name: 'TPBank' },
  { code: 'Techcombank', name: 'Techcombank' },
  { code: 'MBBank', name: 'MB Bank' },
  { code: 'VPBank', name: 'VPBank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'OCB', name: 'OCB' },
  { code: 'SHB', name: 'SHB' }
];

const BankQRCode = ({ 
  amount = 0, 
  orderId = '', 
  description = '', 
  defaultAccountNumber = '',
  defaultBankCode = 'Vietcombank',
  title = 'Thanh toán bằng QR code ngân hàng' 
}) => {
  const [accountNumber, setAccountNumber] = useState(defaultAccountNumber);
  const [bankCode, setBankCode] = useState(defaultBankCode);
  const [qrCodeUrl, setQRCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Xử lý tạo QR code khi component được render hoặc khi dữ liệu thay đổi
  useEffect(() => {
    if (defaultAccountNumber && defaultBankCode) {
      generateQRCode();
    }
  }, [defaultAccountNumber, defaultBankCode, amount, orderId]);

  // Hàm tạo QR code
  const generateQRCode = async () => {
    if (!accountNumber) {
      setError('Vui lòng nhập số tài khoản ngân hàng');
      return;
    }

    if (!bankCode) {
      setError('Vui lòng chọn ngân hàng');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const transferDescription = description || (orderId ? `Thanh toan don hang ${orderId}` : '');
      
      const response = await paymentApi.createBankQRCode({
        accountNumber,
        bankCode,
        amount: amount || 0,
        description: transferDescription,
        orderId,
        generateDataUrl: false // Chỉ lấy URL không cần data URL
      });

      if (response.success && response.data) {
        setQRCodeUrl(response.data.qrCodeUrl);
      } else {
        setError('Không thể tạo mã QR. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error('Lỗi khi tạo mã QR:', err);
      setError(err.message || 'Không thể tạo mã QR. Vui lòng thử lại sau.');
      toast.error('Không thể tạo mã QR. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Format số tiền thành VND
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-center mb-4">{title}</h2>
      
      {/* Thông tin đơn hàng */}
      {orderId && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-medium">Mã đơn hàng: <span className="font-bold">{orderId}</span></p>
          {amount > 0 && (
            <p className="text-sm font-medium">Số tiền: <span className="font-bold text-red-600">{formatCurrency(amount)}</span></p>
          )}
        </div>
      )}

      {/* Form nhập thông tin tài khoản */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Số tài khoản ngân hàng
        </label>
        <input 
          type="text" 
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="Nhập số tài khoản"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ngân hàng
        </label>
        <select 
          value={bankCode}
          onChange={(e) => setBankCode(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Chọn ngân hàng</option>
          {POPULAR_BANKS.map((bank) => (
            <option key={bank.code} value={bank.code}>
              {bank.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Nút tạo QR code */}
      <button 
        onClick={generateQRCode}
        disabled={loading || !accountNumber || !bankCode}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
      >
        {loading ? 'Đang tạo...' : 'Tạo mã QR'}
      </button>

      {/* Hiển thị lỗi */}
      {error && (
        <div className="mt-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Hiển thị QR code */}
      {qrCodeUrl && (
        <div className="mt-6 text-center">
          <div className="mb-3 font-medium">Quét mã QR bằng ứng dụng ngân hàng để thanh toán</div>
          <div className="flex justify-center">
            <img 
              src={qrCodeUrl} 
              alt="QR Code thanh toán" 
              className="w-64 h-64 object-contain border p-2 rounded-md"
            />
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Sau khi quét, ứng dụng ngân hàng sẽ tự điền thông tin thanh toán. Bạn chỉ cần xác nhận để hoàn tất.
          </div>
        </div>
      )}
    </div>
  );
};

export default BankQRCode; 