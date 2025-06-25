import { useState } from 'react';
import axios from 'axios';
import { API_URLS } from '../config/apiConfig';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FixPaymentStatus = () => {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpdateStatus = async () => {
    if (!orderId) {
      toast.error('Vui lòng nhập mã đơn hàng!');
      return;
    }

    setLoading(true);
    try {
      // Thử cả hai API để đảm bảo một trong hai thành công
      try {
        // API 1: Cập nhật trạng thái thanh toán qua payment API
        const response1 = await axios.post(`${API_URLS.PAYMENTS}/update-status/${orderId}`, {
          status: 'processing'
        });
        setResult({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công!', data: response1.data });
        toast.success('Cập nhật trạng thái đơn hàng thành công!');
      } catch (error1) {
        console.log('Method 1 failed:', error1);
        
        // API 2: Cập nhật trạng thái thanh toán qua order API
        const response2 = await axios.patch(`${API_URLS.ORDERS}/${orderId}/payment-status`, {
          paymentStatus: 'completed',
          isPaid: true
        });
        
        setResult({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công!', data: response2.data });
        toast.success('Cập nhật trạng thái đơn hàng thành công!');
      }
    } catch (error) {
      setResult({ success: false, message: 'Cập nhật trạng thái thất bại!', error });
      toast.error('Cập nhật trạng thái thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!orderId) {
      toast.error('Vui lòng nhập mã đơn hàng!');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.patch(`${API_URLS.ORDERS}/${orderId}/mark-paid`);
      setResult({ success: true, message: 'Đánh dấu đơn hàng đã thanh toán thành công!', data: response.data });
      toast.success('Đánh dấu đơn hàng đã thanh toán thành công!');
    } catch (error) {
      setResult({ success: false, message: 'Đánh dấu thất bại!', error });
      toast.error('Đánh dấu thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="text-2xl font-semibold text-center mb-6">Cập nhật trạng thái thanh toán</h2>
      
      <div className="mb-4">
        <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-1">
          Mã đơn hàng
        </label>
        <input
          type="text"
          id="orderId"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Nhập mã đơn hàng cần cập nhật"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex space-x-4">
        <button
          onClick={handleUpdateStatus}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
        </button>
        
        <button
          onClick={handleMarkPaid}
          disabled={loading}
          className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Đang cập nhật...' : 'Đánh dấu đã thanh toán'}
        </button>
      </div>
      
      {result && (
        <div className={`mt-4 p-3 rounded-md ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
          <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            {result.message}
          </p>
          {result.data && (
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      )}
      
      <div className="mt-6 text-xs text-gray-500">
        <p className="mb-1">Hướng dẫn:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Nhập mã đơn hàng cần cập nhật trạng thái thanh toán</li>
          <li>Nhấn &quot;Cập nhật trạng thái&quot; để cập nhật trạng thái thanh toán</li>
          <li>Hoặc nhấn &quot;Đánh dấu đã thanh toán&quot; để sử dụng API mark-paid</li>
          <li>Sau khi cập nhật, làm mới trang đơn hàng để xem kết quả</li>
        </ol>
      </div>
    </div>
  );
};

export default FixPaymentStatus; 