import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { OrderDetailLoading } from './ui/LoadingIndicators';
import { OrderNotFoundError } from './ui/ErrorMessage';
import { 
  OrderHeader, 
  OrderInfo,
  ProductList,
  TrackingSummary,
  TrackingInfo
} from './MapComponents';
import OrderMap from './OrderMap';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import { geocodeAddressDebounced } from './MapUtils';

// Mapbox token validation
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 
                    import.meta.env.VITE_MAPBOX_KEY || 
                    'pk.eyJ1IjoiYmllcGhvbmciLCJhIjoiY2xydmprbDZ0MDVpdjJqbzNrYnYwcXlhOCJ9.nh-L7QQrTbXMpnLcK9HVsw';

if (!MAPBOX_TOKEN) {
  console.error('Mapbox token is missing. Please provide a valid VITE_MAPBOX_ACCESS_TOKEN.');
} else {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  const [showTracking, setShowTracking] = useState(false);
  const [customerCoords, setCustomerCoords] = useState(null);

  // Fetch order data
  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) {
        setError('Invalid order ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`/api/orders/${id}`);
        setOrder(response.data);
        setError(null);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Không thể tải thông tin đơn hàng';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  // Fetch tracking info
  useEffect(() => {
    const fetchTrackingInfo = async () => {
      if (!order?.orderCode) return;

      try {
        setTrackingLoading(true);
        const response = await axios.get(`/api/orders/tracking/${order.orderCode}`);
        setTrackingInfo(response.data);
        setTrackingError(null);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Không thể tải thông tin vận chuyển';
        setTrackingError(errorMessage);
        console.error('Tracking error:', err);
      } finally {
        setTrackingLoading(false);
      }
    };

    fetchTrackingInfo();
  }, [order?.orderCode]);

  // Khi order thay đổi, luôn geocoding địa chỉ giao hàng
  useEffect(() => {
    if (!order) return;
    const address = order?.shipping?.address || order?.shippingAddress || '';
    if (!address) return;

    geocodeAddressDebounced(address, (result) => {
      if (result && result.lat && result.lng) {
        setCustomerCoords({
          lat: result.lat,
          lng: result.lng,
          address: address,
        });
      }
    });
  }, [order]);

  // Toggle tracking details
  const toggleTracking = useCallback(() => {
    setShowTracking((prev) => !prev);
  }, []);

  // Handle back button
  const goBack = useCallback(() => {
    navigate('/tai-khoan/don-hang');
  }, [navigate]);

  // Helper functions
  const getStatusColor = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipping':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusText = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'processing':
        return 'Đang xử lý';
      case 'shipping':
        return 'Đang giao hàng';
      case 'delivered':
        return 'Đã giao hàng';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  }, []);

  const isOrderPaid = useCallback((order) => {
    return order?.isPaid || (order?.paymentMethod === 'bank_transfer' && order?.status !== 'cancelled');
  }, []);

  // Loading state
  if (loading) {
    return <OrderDetailLoading />;
  }

  // Error state or order not found
  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <OrderNotFoundError onBack={goBack} />
      </div>
    );
  }

  // Render shipping info
  const renderShippingInfo = () => {
    if (!order?.shipping && !order?.shippingAddress) {
      return (
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Thông tin vận chuyển</h3>
          <p className="text-gray-600">Không có thông tin vận chuyển.</p>
        </div>
      );
    }

    // Hard-coded shop coordinates
    const shopCoords = {
      lat: 10.0070868,
      lng: 105.7683238,
      name: 'DNC Food - Nông Trại Hữu Cơ',
      address: 'Đại học Nam Cần Thơ, Nguyễn Văn Cừ nối dài, An Bình, Ninh Kiều, Cần Thơ',
    };

    return (
      <div id="order-map-section" className="mb-6 bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Thông tin vận chuyển</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Người nhận:</p>
            <p className="font-medium">{order?.shipping?.name || order?.user?.fullName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Số điện thoại:</p>
            <p className="font-medium">{order?.shipping?.phone || order?.user?.phone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Địa chỉ:</p>
            <p className="font-medium">{order?.shipping?.address || order?.shippingAddress || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Phương thức vận chuyển:</p>
            <p className="font-medium">{order?.shippingMethod || 'Giao hàng tiêu chuẩn'}</p>
          </div>
        </div>
        {MAPBOX_TOKEN && customerCoords ? (
          <OrderMap shopLocation={shopCoords} customerLocation={customerCoords} />
        ) : (
          <p className="text-red-600">Không thể hiển thị bản đồ do thiếu Mapbox token hoặc chưa có tọa độ.</p>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet>
        <title>Chi tiết đơn hàng #{order?._id?.slice(-6) || 'N/A'} | Nông Trại Hữu Cơ</title>
      </Helmet>

      <OrderHeader orderId={order._id} goBack={goBack} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <OrderInfo 
            order={order} 
            isOrderPaid={isOrderPaid} 
            getStatusColor={getStatusColor} 
            getStatusText={getStatusText} 
          />
          {renderShippingInfo()}
          <ProductList 
            products={order?.items || order?.products || []} 
            totalAmount={order?.totalAmount || 0} 
          />
        </div>
        <div>
          <TrackingSummary 
            order={order} 
            toggleTracking={toggleTracking} 
            showTracking={showTracking} 
          />
          {showTracking && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TrackingInfo 
                trackingInfo={trackingInfo} 
                trackingLoading={trackingLoading} 
                trackingError={trackingError} 
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;