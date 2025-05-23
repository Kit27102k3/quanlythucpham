/* eslint-disable react/no-unused-prop-types */
import PropTypes from 'prop-types';
import { ArrowLeftIcon, PackageIcon, ClipboardListIcon, TruckIcon, CheckCircleIcon, ChevronDownIcon } from 'lucide-react';
import { formatDate } from './MapUtils';
import { FiMapPin } from 'react-icons/fi';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRef, useState, useEffect } from 'react';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
/**
 * Component cho bản đồ theo dõi đơn hàng
 */
export const OrderTrackingMap = ({ shopLocation, customerLocation, orderId }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!map.current && mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [customerLocation.lng, customerLocation.lat],
        zoom: 13,
        accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        
        // Thêm marker cửa hàng
        new mapboxgl.Marker({ color: '#4CAF50' })
          .setLngLat([shopLocation.lng, shopLocation.lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<h3>${shopLocation.name}</h3><p>${shopLocation.address}</p>`))
          .addTo(map.current);

        // Thêm marker khách hàng
        new mapboxgl.Marker({ color: '#E74C3C' })
          .setLngLat([customerLocation.lng, customerLocation.lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<h3>Giao đến</h3><p>${customerLocation.address}</p>`))
          .addTo(map.current);

        // Vẽ đường đi giữa 2 điểm
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [shopLocation.lng, shopLocation.lat],
                [customerLocation.lng, customerLocation.lat]
              ]
            }
          }
        });

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#4A90E2',
            'line-width': 3,
            'line-opacity': 0.7
          }
        });

        // Tự động zoom để hiển thị cả 2 điểm
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([shopLocation.lng, shopLocation.lat]);
        bounds.extend([customerLocation.lng, customerLocation.lat]);
        map.current.fitBounds(bounds, { padding: 50 });
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      {/* ...phần header giữ nguyên... */}
      <div id="map-container" className="aspect-video w-full relative border border-gray-200 rounded-lg overflow-hidden">
        <div ref={mapContainer} className="w-full h-full absolute inset-0"></div>
    </div>
  </div>
);
};

OrderTrackingMap.propTypes = {
  shopLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    name: PropTypes.string,
    address: PropTypes.string
  }).isRequired,
  customerLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    address: PropTypes.string
  }).isRequired,
  orderId: PropTypes.string.isRequired
};

/**
 * Component hiển thị header chi tiết đơn hàng
 */
export const OrderHeader = ({ orderId, goBack }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center">
        <button 
          onClick={goBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          <span className="font-medium">Quay lại</span>
        </button>
        
        <div className="ml-4 hidden sm:block text-lg font-medium text-gray-800">
          Chi tiết đơn hàng #{orderId.slice(-6)}
        </div>
    </div>
      
      <div className="text-sm text-gray-500">
        Mã đơn hàng: <span className="font-medium">{orderId}</span>
    </div>
  </div>
);
};

OrderHeader.propTypes = {
  orderId: PropTypes.string.isRequired,
  goBack: PropTypes.func.isRequired
};

/**
 * Component hiển thị thông tin đơn hàng
 */
export const OrderInfo = ({ order, isOrderPaid, getStatusColor, getStatusText }) => {
    return (
    <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Thông tin đơn hàng</h2>
      </div>
      
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Ngày đặt hàng:</p>
            <p className="font-medium">{formatDate(order.createdAt)}</p>
      </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-1">Trạng thái đơn hàng:</p>
            <div className="flex items-center">
              <span className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
      </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-1">Trạng thái thanh toán:</p>
            <div className="flex items-center">
              <span className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full ${isOrderPaid(order) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {isOrderPaid(order) ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-1">Phương thức thanh toán:</p>
            <p className="font-medium">
              {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 
               order.paymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' : 
               order.paymentMethod === 'momo' ? 'Ví MoMo' : 
               order.paymentMethod === 'zalopay' ? 'ZaloPay' : 
               'Không xác định'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

OrderInfo.propTypes = {
  order: PropTypes.object.isRequired,
  isOrderPaid: PropTypes.func.isRequired,
  getStatusColor: PropTypes.func.isRequired,
  getStatusText: PropTypes.func.isRequired
};

/**
 * Component hiển thị danh sách sản phẩm
 */
export const ProductList = ({ products, totalAmount }) => {
  return (
    <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Sản phẩm đã mua</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {products && products.map((product, index) => (
          <div key={index} className="p-4 sm:p-6 flex items-center">
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50">
              <img 
                src={product.image || product.productId?.images?.[0] || '/images/placeholder-product.png'} 
                alt={product.name || product.productId?.name} 
                className="h-full w-full object-cover object-center"
                onError={(e) => { e.target.src = '/images/placeholder-product.png' }}
              />
          </div>
            
            <div className="ml-4 flex-1">
              <h3 className="text-base font-medium text-gray-900">
                {product.name || product.productId?.name || 'Sản phẩm không xác định'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                SL: {product.quantity} x {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
              </p>
          </div>
            
            <div className="text-right">
              <p className="text-base font-medium text-gray-900">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price * product.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 sm:p-6 bg-gray-50">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900">Tổng cộng:</span>
          <span className="text-lg font-bold text-gray-900">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
};

ProductList.propTypes = {
  products: PropTypes.array.isRequired,
  totalAmount: PropTypes.number.isRequired
};

/**
 * Component hiển thị thông tin theo dõi đơn hàng
 */
export const TrackingSummary = ({ order, toggleTracking, showTracking }) => {
  const getStatusStep = (status) => {
    switch (status) {
      case 'pending': return 1;
      case 'processing': return 2;
      case 'shipping': return 3;
      case 'delivered': return 4;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const currentStep = getStatusStep(order.status);
    
    return (
    <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Trạng thái đơn hàng</h2>
        <button 
          onClick={toggleTracking}
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
        >
          {showTracking ? 'Thu gọn' : 'Chi tiết'}
          <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${showTracking ? 'transform rotate-180' : ''}`} />
        </button>
      </div>
      
      <div className="p-4 sm:p-6">
        <div className="space-y-6">
          <div className={`flex items-start`}>
            <div className={`flex-shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center ${currentStep >= 1 ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-400'}`}>
              <ClipboardListIcon className="h-4 w-4" />
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${currentStep >= 1 ? 'text-green-800' : 'text-gray-800'}`}>
                Đơn hàng đã đặt
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {order.createdAt ? formatDate(order.createdAt) : 'Chưa cập nhật'}
              </p>
            </div>
          </div>
          
          <div className={`flex items-start`}>
            <div className={`flex-shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center ${currentStep >= 2 ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-400'}`}>
              <PackageIcon className="h-4 w-4" />
        </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${currentStep >= 2 ? 'text-green-800' : 'text-gray-800'}`}>
                Đang chuẩn bị hàng
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {order.processedAt ? formatDate(order.processedAt) : 'Chưa cập nhật'}
              </p>
        </div>
      </div>
          
          <div className={`flex items-start`}>
            <div className={`flex-shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center ${currentStep >= 3 ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-400'}`}>
              <TruckIcon className="h-4 w-4" />
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${currentStep >= 3 ? 'text-green-800' : 'text-gray-800'}`}>
                Đang giao hàng
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {order.shippedAt ? formatDate(order.shippedAt) : 'Chưa cập nhật'}
              </p>
            </div>
          </div>
          
          <div className={`flex items-start`}>
            <div className={`flex-shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center ${currentStep >= 4 ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-400'}`}>
              <CheckCircleIcon className="h-4 w-4" />
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${currentStep >= 4 ? 'text-green-800' : 'text-gray-800'}`}>
                Giao hàng thành công
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {order.deliveredAt ? formatDate(order.deliveredAt) : 'Chưa cập nhật'}
              </p>
            </div>
          </div>
          
          {order.status === 'cancelled' && (
            <div className={`flex items-start`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full border-2 border-red-500 bg-red-50 text-red-700 flex items-center justify-center`}>
                <XIcon className="h-4 w-4" />
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium text-red-800`}>
                  Đơn hàng đã hủy
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {order.cancelledAt ? formatDate(order.cancelledAt) : formatDate(order.updatedAt)}
                </p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

TrackingSummary.propTypes = {
  order: PropTypes.object.isRequired,
  toggleTracking: PropTypes.func.isRequired,
  showTracking: PropTypes.bool.isRequired
};

/**
 * Component hiển thị chi tiết theo dõi đơn hàng
 */
export const TrackingInfo = ({ trackingInfo, trackingLoading, trackingError }) => {
  // Component nội dung cập nhật đơn hàng
  const TrackingEvent = ({ event }) => (
    <div className="mb-4 border-b border-gray-100 pb-4 last:mb-0 last:border-0 last:pb-0">
      <div className="flex">
        <div className="flex-shrink-0 mr-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <FiMapPin className="h-4 w-4 text-blue-600" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">{event.status}</p>
          <p className="text-xs text-gray-500 mt-1">{formatDate(event.time)}</p>
          {event.location && (
            <p className="text-xs text-gray-600 mt-1">{event.location}</p>
          )}
        </div>
      </div>
              </div>
  );

  TrackingEvent.propTypes = {
    event: PropTypes.shape({
      status: PropTypes.string.isRequired,
      time: PropTypes.string.isRequired,
      location: PropTypes.string
    }).isRequired
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-800">Chi tiết vận chuyển</h3>
      </div>
      
      <div className="p-4 sm:p-6">
        {trackingLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        ) : trackingError ? (
          <div className="text-center py-4">
            <div className="text-red-500 text-sm mb-2">Không thể tải thông tin vận chuyển</div>
            <p className="text-gray-500 text-xs">{trackingError}</p>
          </div>
        ) : trackingInfo && trackingInfo.events && trackingInfo.events.length > 0 ? (
          <div className="space-y-4">
            {trackingInfo.events.map((event, index) => (
              <TrackingEvent key={index} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            Không có thông tin cập nhật vận chuyển
        </div>
      )}
      </div>
    </div>
  );
};

TrackingInfo.propTypes = {
  trackingInfo: PropTypes.object,
  trackingLoading: PropTypes.bool.isRequired,
  trackingError: PropTypes.any
};

// XIcon component vì lucide-react không có nó
const XIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);