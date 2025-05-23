import React from 'react';
import PropTypes from 'prop-types';
import { ArrowLeftIcon, SearchXIcon, ServerCrashIcon, AlertTriangleIcon } from 'lucide-react';

/**
 * Component hiển thị khi không tìm thấy đơn hàng
 */
export const OrderNotFoundError = ({ onBack }) => {
  return (
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <div className="flex justify-center mb-4">
        <SearchXIcon size={64} className="text-gray-400" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy đơn hàng</h2>
      <p className="text-gray-600 mb-6">
        Đơn hàng này không tồn tại hoặc đã bị xóa. Vui lòng kiểm tra lại mã đơn hàng của bạn.
      </p>
      
      <button
        onClick={onBack}
        className="flex items-center justify-center mx-auto bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors"
      >
        <ArrowLeftIcon size={16} className="mr-2" />
        Quay lại danh sách đơn hàng
      </button>
    </div>
  );
};

OrderNotFoundError.propTypes = {
  onBack: PropTypes.func.isRequired
};

/**
 * Component hiển thị khi có lỗi server
 */
export const ServerError = ({ message, onRetry }) => {
  return (
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <div className="flex justify-center mb-4">
        <ServerCrashIcon size={64} className="text-red-500" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Lỗi máy chủ</h2>
      <p className="text-gray-600 mb-6">
        {message || "Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau."}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors"
        >
          Thử lại
        </button>
      )}
    </div>
  );
};

ServerError.propTypes = {
  message: PropTypes.string,
  onRetry: PropTypes.func
};

/**
 * Component hiển thị khi có lỗi vận chuyển
 */
export const TrackingError = ({ message }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 text-center">
      <div className="flex justify-center mb-3">
        <AlertTriangleIcon size={36} className="text-orange-500" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-800 mb-2">Không thể tải thông tin vận chuyển</h3>
      <p className="text-gray-600 text-sm">
        {message || "Đã xảy ra lỗi khi tải thông tin vận chuyển. Vui lòng thử lại sau."}
      </p>
    </div>
  );
};

TrackingError.propTypes = {
  message: PropTypes.string
};

export default OrderNotFoundError; 