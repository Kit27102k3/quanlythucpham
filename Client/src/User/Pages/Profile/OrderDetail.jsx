import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ClipboardListIcon, ChevronLeftIcon, TruckIcon, PackageIcon, XCircleIcon, ClockIcon, MapPinIcon, EyeIcon, ArrowLeftIcon } from "lucide-react";
import orderApi from "../../../api/orderApi";
import formatCurrency from "../../Until/FotmatPrice";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { translateStatus } from '../../component/OrderStatusDisplay';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FaDirections, FaMapMarkerAlt } from 'react-icons/fa';

// Kiểm tra server nào đang hoạt động
// Removing unused function
// const checkServerStatus = async () => {
//   const ports = ["8080", "3000"]; // Các port có thể chạy server
//   for (const port of ports) {
//     try {
//       const url = `http://localhost:${port}/health-check`;
//       const response = await fetch(url, { 
//         method: 'HEAD',
//         timeout: 500,
//         mode: 'no-cors'
//       });
//       if (response) {
//         console.log(`Server đang chạy ở port ${port}`);
//         return `http://localhost:${port}`;
//       }
//     } catch (error) {
//       // Bỏ qua lỗi
//     }
//   }
//   return API_BASE_URL; // Sử dụng URL từ cấu hình nếu không tìm thấy server local
// };

// Thêm constant cho địa chỉ cửa hàng mặc định
const SHOP_LOCATION = {
  address: "Trường Đại học Nam Cần Thơ",
  lat: 10.0079465,
  lng: 105.7202567
};

// Mapbox access token
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

// Viết theo phương pháp đơn giản hơn, tạo custom hook useMapbox
const useMapbox = () => {
  const [isLoaded, setIsLoaded] = useState(true); // Mapbox is loaded from npm, not from CDN
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    // Check if mapboxgl is supported by the browser
    if (!mapboxgl.supported()) {
      console.error("Mapbox GL không được hỗ trợ bởi trình duyệt này");
      setLoadError(new Error("MapboxNotSupported"));
      toast.error("Trình duyệt của bạn không hỗ trợ Mapbox. Vui lòng sử dụng trình duyệt khác.");
      return;
    }

    // Mapbox GL is already loaded via npm package
      setIsLoaded(true);
  }, []);

  return { isLoaded, loadError };
};

export default function OrderDetail() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [trackingError, setTrackingError] = useState(false);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [mapError, setMapError] = useState(null);
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  // Sử dụng hook đơn giản để tải Google Maps API
  const { isLoaded: mapLoaded, loadError } = useMapbox();
  
  // Di chuyển fetchTrackingInfo lên trước (trước khi được sử dụng)
  const fetchTrackingInfo = useCallback(async (orderCode) => {
    if (!orderCode) {
      toast.warning("Đơn hàng chưa có mã vận đơn!");
      setTrackingLoading(false);
      setShowTracking(false);
      return;
    }

    try {
      setTrackingLoading(true);
      const response = await orderApi.getOrderTracking(orderCode);
      
      // Kiểm tra nếu là dữ liệu giả lập
      if (response.isMocked) {
        console.log("Đang sử dụng dữ liệu giả lập cho đơn hàng");
        toast.info(response.message || "Đang sử dụng dữ liệu giả lập do không thể kết nối đến GHN");
      }
      
      setTrackingInfo(response.data);
      setTrackingError(false);
      setTrackingLoading(false);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin vận chuyển:", error);
      setTrackingError(true);
      setTrackingLoading(false);
      toast.error("Không thể lấy thông tin vận chuyển. Vui lòng thử lại sau.");
    }
  }, []);
  
  // Hàm tính khoảng cách giữa 2 điểm địa lý (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Bán kính trái đất (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c;
    return distance;
  };
  
  // Khai báo các hàm xử lý map trước khi được sử dụng
  const initMap = useCallback((location) => {
    console.log("Bắt đầu khởi tạo bản đồ với vị trí:", location);
    if (!location) {
      console.error("Không thể khởi tạo bản đồ - không có vị trí");
      setMapError(true);
      return;
    }

    try {
      const mapContainer = document.getElementById('order-tracking-map');
      if (!mapContainer) {
        console.error("Không tìm thấy container cho bản đồ");
        return;
      }

      // Kiểm tra xem container đã có bản đồ chưa
      if (mapContainer.__map_initialized) {
        console.log("Bản đồ đã được khởi tạo trước đó");
        return;
      }

      // Đánh dấu container đã được sử dụng
      mapContainer.__map_initialized = true;
      window.__map_initialized = true;

      // Tạo ID định danh duy nhất cho phiên làm việc này
      const mapInstanceId = `map_${Date.now()}`;
      mapContainer.setAttribute('data-map-id', mapInstanceId);

      console.log("Tạo bản đồ mới với ID:", mapInstanceId);

      // Xác định vị trí giữa shop và khách hàng
      const centerLng = (SHOP_LOCATION.lng + location.lng) / 2;
      const centerLat = (SHOP_LOCATION.lat + location.lat) / 2;

      // Tạo bản đồ mới với Mapbox
      try {
        // Kiểm tra xem đã có instance map chưa
        if (window.mapInstance) {
          console.log("Đã có instance map, xóa và tạo lại");
          window.mapInstance.remove();
          window.mapInstance = null;
        }
        
        // Đặt thuộc tính cụ thể cho container
        mapContainer.style.width = '100%';
        mapContainer.style.height = '100%';
        
        const map = new mapboxgl.Map({
          container: mapContainer,
          style: 'mapbox://styles/mapbox/streets-v12', // style URL
          center: [centerLng, centerLat],
          zoom: 12
        });
        
        // Lưu trữ instance map vào window để có thể xóa sau này
        window.mapInstance = map;
        
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.addControl(new mapboxgl.FullscreenControl());
        
        // Đảm bảo map fit đúng với cả 2 điểm (shop và customer)
        map.on('load', () => {
          // Tạo marker cho vị trí cửa hàng
          const shopEl = document.createElement('div');
          shopEl.className = 'shop-marker';
          shopEl.style.width = '36px';
          shopEl.style.height = '36px';
          shopEl.style.backgroundImage = 'url(https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/ordertracking/f1f718b157cd67f128f91b166a08990e.png)';
          shopEl.style.backgroundSize = 'cover';
          
          // Thêm marker shop với popup
          new mapboxgl.Marker({ element: shopEl })
            .setLngLat([SHOP_LOCATION.lng, SHOP_LOCATION.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                  <div style="padding: 5px;">
                    <div style="font-weight: bold;">${SHOP_LOCATION.address}</div>
                    <div style="font-size: 12px; color: #666;">Địa điểm xuất hàng</div>
                  </div>
                `)
            )
            .addTo(map);
          
          // Tạo custom element cho customer marker
          const customerEl = document.createElement('div');
          customerEl.className = 'customer-marker';
          customerEl.style.width = '36px';
          customerEl.style.height = '36px';
          customerEl.style.backgroundImage = 'url(https://maps.google.com/mapfiles/ms/icons/red-dot.png)';
          customerEl.style.backgroundSize = 'cover';
          
          // Sử dụng địa chỉ từ location
          const displayAddress = location.address || "Địa chỉ không xác định";
          
          // Thêm marker khách hàng với popup
          new mapboxgl.Marker({ element: customerEl, color: '#ff0000' })
            .setLngLat([location.lng, location.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                  <div style="padding: 5px;">
                    <div style="font-weight: bold;">Địa chỉ giao hàng</div>
                    <div style="font-size: 12px; color: #666;">${displayAddress}</div>
                  </div>
                `)
            )
            .addTo(map);
          
          // Tính khoảng cách theo đường chim bay giữa shop và khách hàng
          const distanceStraightLine = calculateDistance(
            SHOP_LOCATION.lat, SHOP_LOCATION.lng,
            location.lat, location.lng
          );
          
          // Sử dụng Mapbox Directions API để lấy đường đi thật
          const directionsRequest = `https://api.mapbox.com/directions/v5/mapbox/walking/${SHOP_LOCATION.lng},${SHOP_LOCATION.lat};${location.lng},${location.lat}?steps=true&geometries=geojson&alternatives=true&access_token=${MAPBOX_ACCESS_TOKEN}`;
          
          console.log("Gọi directions API để lấy đường đi (chế độ đi bộ)");
          
          // Tạo ID duy nhất cho mỗi request để tránh trùng lặp
          const directionsRequestId = `directions_${Date.now()}`;
          window[directionsRequestId] = true;
          
          try {
            fetch(directionsRequest)
              .then(response => {
                if (!response.ok) throw new Error('Không thể lấy dữ liệu đường đi');
                return response.json();
              })
              .then(data => {
                // Xóa ID này sau khi hoàn thành
                delete window[directionsRequestId];
                
                if (data.routes && data.routes.length > 0) {
                  const route = data.routes[0];
                  const routeDistance = route.distance / 1000; // Chuyển từ m sang km
                  
                  // Sửa tốc độ trung bình từ "theo giây thực tế" sang "tốc độ trung bình 30km/h"
                  // Do thời gian từ API có thể không chính xác cho VN
                  const routeDuration = Math.ceil(routeDistance / 30 * 60); // Tính dựa trên 30km/h
                  
                  console.log("Nhận được dữ liệu đường đi:", {
                    distance: routeDistance,
                    duration: routeDuration,
                    geometry: route.geometry
                  });
                  
                  // Thêm layer đường đi
                  if (map.getSource('route')) {
                    map.removeLayer('route-layer');
                    map.removeSource('route');
                  }
                  
                  map.addSource('route', {
                    'type': 'geojson',
                    'data': {
                      'type': 'Feature',
                      'properties': {},
                      'geometry': route.geometry
                    }
                  });
                  
                  map.addLayer({
                    'id': 'route-layer',
                    'type': 'line',
                    'source': 'route',
                    'layout': {
                      'line-join': 'round',
                      'line-cap': 'round'
                    },
                    'paint': {
                      'line-color': '#2673DD',
                      'line-width': 4,
                      'line-opacity': 0.7
                    }
                  });
                  
                  // Hiển thị thông tin khoảng cách và thời gian
                  const infoDiv = document.getElementById('map-info');
                  if (infoDiv) {
                    infoDiv.innerHTML = `
                      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div class="flex items-center gap-2">
                          <span class="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                          <span class="font-semibold text-gray-700 text-xs sm:text-sm">Cửa hàng → Địa chỉ nhận hàng (đường thực tế)</span>
                        </div>
                        <div class="flex gap-4">
                          <div class="text-xs sm:text-sm"><span class="font-medium text-blue-600">Khoảng cách:</span> ${routeDistance.toFixed(1)} km</div>
                          <div class="text-xs sm:text-sm"><span class="font-medium text-blue-600">Thời gian ước tính:</span> ${routeDuration} phút</div>
                        </div>
                      </div>
                    `;
                  }
                  
                  // Fit bounds để hiển thị đầy đủ đường đi
                  const bounds = new mapboxgl.LngLatBounds();
                  route.geometry.coordinates.forEach(coord => {
                    bounds.extend(coord);
                  });
                  map.fitBounds(bounds, { padding: 80 });
                  
                } else {
                  console.error("Không có dữ liệu đường đi từ API, sử dụng đường thẳng");
                  createStraightLine();
                }
              })
              .catch(error => {
                // Xóa ID này nếu có lỗi
                delete window[directionsRequestId];
                console.error("Lỗi khi lấy đường đi:", error);
                // Fallback to straight line
                createStraightLine();
              });
          } catch (error) {
            console.error("Lỗi khi gọi Directions API:", error);
            // Fallback to straight line
            createStraightLine();
          }
          
          // Hàm tạo đường thẳng giữa 2 điểm (fallback)
          function createStraightLine() {
            // Thêm đường thẳng giữa 2 điểm
            if (map.getSource('route')) {
              map.removeLayer('route-layer');
              map.removeSource('route');
            }
            
            map.addSource('route', {
              'type': 'geojson',
              'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                  'type': 'LineString',
                  'coordinates': [
                    [SHOP_LOCATION.lng, SHOP_LOCATION.lat],
                    [location.lng, location.lat]
                  ]
                }
              }
            });
            
            map.addLayer({
              'id': 'route-layer',
              'type': 'line',
              'source': 'route',
              'layout': {
                'line-join': 'round',
                'line-cap': 'round'
              },
              'paint': {
                'line-color': '#2673DD',
                'line-width': 4,
                'line-opacity': 0.7,
                'line-dasharray': [0.5, 1.5]
              }
            });
            
            // Fit bounds để hiển thị đầy đủ đường đi
            const bounds = new mapboxgl.LngLatBounds()
              .extend([SHOP_LOCATION.lng, SHOP_LOCATION.lat])
              .extend([location.lng, location.lat]);
            map.fitBounds(bounds, { padding: 80 });
            
            // Hiển thị thông tin khoảng cách và thời gian
            const estimatedMinutes = Math.ceil(distanceStraightLine / 30 * 60);
            
            const infoDiv = document.getElementById('map-info');
            if (infoDiv) {
              infoDiv.innerHTML = `
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div class="flex items-center gap-2">
                    <span class="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                    <span class="font-semibold text-gray-700 text-xs sm:text-sm">Cửa hàng → Địa chỉ nhận hàng (đường thẳng)</span>
                  </div>
                  <div class="flex gap-4">
                    <div class="text-xs sm:text-sm"><span class="font-medium text-blue-600">Khoảng cách:</span> ${distanceStraightLine.toFixed(1)} km</div>
                    <div class="text-xs sm:text-sm"><span class="font-medium text-blue-600">Thời gian ước tính:</span> ${estimatedMinutes} phút</div>
                  </div>
                </div>
              `;
            }
          }
        });
        
        console.log("Bản đồ được tạo thành công");
      } catch (mapError) {
        console.error("Lỗi khi tạo bản đồ:", mapError);
        setMapError(true);
        mapContainer.__map_initialized = false;
        window.__map_initialized = false;
        return;
      }
    } catch (error) {
      console.error("Lỗi khi khởi tạo bản đồ:", error);
      setMapError(true);
    }
  }, [calculateDistance]);
  
  // Xóa các định nghĩa trùng lặp

  // Hàm tính khoảng cách giữa 2 điểm địa lý (Haversine formula) - đã được di chuyển lên trên
  
  // Thêm useEffect để tải dữ liệu đơn hàng
  useEffect(() => {
    let isMounted = true;
    
    const getOrderData = async () => {
      try {
        setLoading(true);
        if (!orderId) return;
        
        console.log("Bắt đầu tải dữ liệu đơn hàng:", orderId);
        
        // Lấy userId của người dùng hiện tại
        const currentUserId = localStorage.getItem("userId");
        if (!currentUserId) {
          toast.error("Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại.");
          setTimeout(() => navigate("/dang-nhap"), 2000);
          setLoading(false);
          return;
        }
         
        const orderData = await orderApi.getOrderById(orderId);
        console.log("Đã tải xong dữ liệu đơn hàng:", orderData?._id);
         
        // Kiểm tra xem đơn hàng có thuộc về người dùng hiện tại không
        const orderUserId = orderData.userId && typeof orderData.userId === 'object' 
          ? orderData.userId._id 
          : orderData.userId;
          
        if (orderUserId !== currentUserId) {
          toast.error("Bạn không có quyền xem đơn hàng này.");
          setTimeout(() => navigate("/tai-khoan/don-hang"), 2000);
          setLoading(false);
          return;
        }
        
        if (isMounted) {
          setOrder(orderData);
          setLoading(false);
          
          // Nếu đơn hàng có mã vận đơn thì lấy thông tin tracking
          if (orderData.orderCode) {
            console.log("Đơn hàng có mã vận đơn, tải thông tin tracking:", orderData.orderCode);
            fetchTrackingInfo(orderData.orderCode);
          }
        
          // Lấy thông tin địa chỉ khách hàng để hiển thị trên bản đồ
          if (orderData.userId && orderData.userId.address) {
            // Xây dựng địa chỉ đầy đủ với tất cả thành phần chi tiết
            const addressComponents = [];
            if (orderData.userId.houseNumber) addressComponents.push(orderData.userId.houseNumber);
            if (orderData.userId.address) addressComponents.push(orderData.userId.address);
            if (orderData.userId.hamlet) addressComponents.push(orderData.userId.hamlet);
            if (orderData.userId.ward) addressComponents.push(orderData.userId.ward);
            if (orderData.userId.district) addressComponents.push(orderData.userId.district);
            if (orderData.userId.province) addressComponents.push(orderData.userId.province);
            
            // Nối tất cả thành phần lại với nhau
            const fullAddress = addressComponents.filter(Boolean).join(", ");
            
            console.log("Địa chỉ đầy đủ chi tiết khách hàng:", fullAddress);
            
            setCustomerLocation({
              lat: 10.034236,
              lng: 105.775285,
              address: fullAddress,
              pending: false
            });
          } else {
            console.log("Không tìm thấy địa chỉ khách hàng trong đơn hàng");
            // Sử dụng vị trí mặc định cho khách hàng
            const defaultCustomerLocation = {
              lat: 10.034236,
              lng: 105.775285,
              address: "Địa chỉ khách hàng không có thông tin",
              pending: false
            };
            setCustomerLocation(defaultCustomerLocation);
          }
        }
        
        // Thiết lập polling để cập nhật trạng thái đơn hàng theo thời gian thực
        // Lưu ý: chỉ áp dụng cho những đơn hàng đang hoạt động (không phải "completed" hoặc "cancelled")
        if (orderData && orderData.status !== "completed" && orderData.status !== "cancelled") {
          const intervalId = setInterval(async () => {
            if (isMounted) {
              try {
                console.log("Cập nhật trạng thái đơn hàng:", orderId);
                const updatedOrder = await orderApi.checkOrderStatus(orderId);
                if (isMounted) {
                  // Chỉ cập nhật state nếu có thay đổi trạng thái
                  if (updatedOrder.status !== order?.status) {
                    console.log("Trạng thái đơn hàng đã thay đổi:", updatedOrder.status);
                    toast.info(`Trạng thái đơn hàng đã được cập nhật thành: ${translateStatus(updatedOrder.status)}`);
                    setOrder(updatedOrder);
                    
                    // Nếu đơn hàng có mã vận đơn thì cập nhật thông tin tracking
                    if (updatedOrder.orderCode) {
                      fetchTrackingInfo(updatedOrder.orderCode);
                    }
                  }
                }
              } catch (err) {
                console.error("Lỗi khi cập nhật trạng thái đơn hàng:", err);
              }
            }
          }, 10000); // Cập nhật mỗi 10 giây
          
          // Cleanup function cho interval
          return () => {
            clearInterval(intervalId);
          };
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin đơn hàng:", err);
        if (isMounted) {
          toast.error("Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.");
          setTimeout(() => navigate("/tai-khoan/don-hang"), 2000);
          setLoading(false);
        }
      }
    };
    
    getOrderData();
    
    return () => {
      isMounted = false;
    };
  }, [orderId, navigate, fetchTrackingInfo]);

  // Thêm useEffect để xử lý khi order được tải để trích xuất vị trí khách hàng
  useEffect(() => {
    if (order && order.userId && !customerLocation?.initialized) {
      console.log("Đang xử lý thông tin vị trí giao hàng từ order:", order);
      
      // Lấy thông tin địa chỉ đầy đủ khách hàng để hiển thị trên bản đồ
      // Đảm bảo thêm đầy đủ chi tiết: số nhà, ấp, xã, huyện, tỉnh
      const addressComponents = [];
      if (order.userId.houseNumber) addressComponents.push(order.userId.houseNumber);
      if (order.userId.address) addressComponents.push(order.userId.address);
      if (order.userId.hamlet) addressComponents.push(order.userId.hamlet);
      if (order.userId.ward) addressComponents.push(order.userId.ward);
      if (order.userId.district) addressComponents.push(order.userId.district);
      if (order.userId.province) addressComponents.push(order.userId.province);
      
      // Nối tất cả thành phần lại với nhau
      const fullAddress = addressComponents.filter(Boolean).join(", ");
      
      console.log("Địa chỉ đầy đủ chi tiết khách hàng:", fullAddress);
      
      // Ưu tiên sử dụng tọa độ từ DB nếu có
      if (order.deliveryCoordinates && order.deliveryCoordinates.lat && order.deliveryCoordinates.lng) {
        console.log("Sử dụng tọa độ từ database:", order.deliveryCoordinates);
        
        const customerLocationData = {
          lng: parseFloat(order.deliveryCoordinates.lng),
          lat: parseFloat(order.deliveryCoordinates.lat),
          address: fullAddress,
          pending: false,
          initialized: true
        };
        
        setCustomerLocation(customerLocationData);
        
        // Khởi tạo bản đồ sau một khoảng thời gian ngắn để đảm bảo DOM đã sẵn sàng
        setTimeout(() => {
          try {
            console.log("Khởi tạo bản đồ với tọa độ từ database:", customerLocationData);
            initMap(customerLocationData);
          } catch (err) {
            console.error("Lỗi khi khởi tạo bản đồ với tọa độ từ database:", err);
            setMapError(true);
          }
        }, 500);
      } else {
        // Nếu không có tọa độ từ database, thực hiện geocoding để lấy tọa độ từ địa chỉ
        console.log("Không có tọa độ từ database, thực hiện geocoding cho địa chỉ:", fullAddress);
        
        // Khởi tạo customer location với địa chỉ đầy đủ, pending=true để trigger geocoding
        const pendingLocation = {
          address: fullAddress,
          pending: true,
          initialized: false
        };
        
        setCustomerLocation(pendingLocation);
        
        // Thực hiện geocoding ngay lập tức nếu có thể
        if (mapLoaded) {
          console.log("Map đã sẵn sàng, thực hiện geocoding ngay lập tức");
          performGeocoding(fullAddress);
        }
      }
    }
  }, [order, customerLocation?.initialized, initMap, mapLoaded]);
  
  // Mover aquí la definición de setDefaultLocation
  // Hàm sử dụng vị trí mặc định (tránh lặp lại code)
  const setDefaultLocation = useCallback((address) => {
    console.log("Sử dụng vị trí mặc định cho địa chỉ:", address);
    // Sử dụng vị trí mặc định ở Cần Thơ
    const defaultLocation = {
          lat: 10.034236,
          lng: 105.775285,
      address: address,
          pending: false,
          initialized: true
    };
    setCustomerLocation(defaultLocation);
    
    setTimeout(() => {
      try {
        initMap(defaultLocation);
      } catch (err) {
        console.error("Lỗi khi khởi tạo bản đồ với vị trí mặc định:", err);
        setMapError(true);
      }
    }, 300);
  }, [initMap]);
  
  // Thêm các useRef để lưu trữ tham chiếu đến các hàm
  const geocodingFnRef = useRef(null);
  const fallbackGeocodingFnRef = useRef(null);
  
  // Định nghĩa performFallbackGeocoding trước, nhưng sử dụng useRef
  const performFallbackGeocoding = useCallback((address, specialLocation = null) => {
    // Tạo cache key dựa trên địa chỉ
    const cacheKey = `geocode_fallback_${address.trim().toLowerCase().replace(/\s+/g, '_')}`;
    
    // Kiểm tra nếu đã có dữ liệu trong cache
    if (window[cacheKey]) {
      console.log("Sử dụng dữ liệu fallback geocoding từ cache cho địa chỉ:", address);
      const cachedData = window[cacheKey];
      setCustomerLocation(cachedData);
      
      setTimeout(() => {
        try {
          initMap(cachedData);
        } catch (err) {
          console.error("Lỗi khi khởi tạo bản đồ từ dữ liệu cache fallback:", err);
          setMapError(true);
        }
      }, 300);
      
      return;
    }
    
    // Trích xuất thông tin quan trọng từ địa chỉ
    console.log("Thực hiện geocoding dự phòng với địa chỉ:", address, "specialLocation:", specialLocation);
    
    // Lấy phần cuối của địa chỉ (quận/huyện, tỉnh/thành phố)
    const parts = address.split(',').map(part => part.trim());
    
    if (parts.length < 2) {
      console.warn("Địa chỉ không đủ thông tin chi tiết, sử dụng mặc định");
      setDefaultLocation(address);
      return;
    }
    
    // Tìm các từ khóa xác định trong địa chỉ
    let district = '';
    let province = '';
    let commune = '';
    
    // Scan for specific keywords in the address
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].toLowerCase();
      
      if (part.includes('huyện') || part.includes('quận') || part.includes('thị xã') || part.includes('tx')) {
        district = parts[i];
      } else if (part.includes('tỉnh') || part.includes('thành phố') || part.includes('tp')) {
        province = parts[i];
      } else if (part.includes('xã') || part.includes('phường') || part.includes('thị trấn') || part.includes('tt')) {
        commune = parts[i];
      }
    }
    
    // Nếu không tìm thấy bằng từ khóa, thử lấy phần cuối
    if (!province && parts.length > 0) {
      province = parts[parts.length - 1];
    }
    
    if (!district && parts.length > 1) {
      district = parts[parts.length - 2];
    }
    
    // Tạo các địa chỉ dự phòng với mức độ chi tiết khác nhau
    const fallbackAddresses = [];
    
    // Thêm địa chỉ đầy đủ nhất có thể
    if (province) {
      if (district) {
        if (commune) {
          fallbackAddresses.push(`${commune}, ${district}, ${province}, Việt Nam`);
        }
        fallbackAddresses.push(`${district}, ${province}, Việt Nam`);
      }
      fallbackAddresses.push(`${province}, Việt Nam`);
    }
    
    // Nếu không có địa chỉ dự phòng, sử dụng vị trí mặc định
    if (fallbackAddresses.length === 0) {
      console.warn("Không thể tạo địa chỉ dự phòng, sử dụng vị trí mặc định");
      setDefaultLocation(address);
      return;
    }
    
    // Lưu lại danh sách địa chỉ đang được xử lý để tránh gọi lại
    if (!window._fallback_in_progress) window._fallback_in_progress = {};
    
    // Thử từng địa chỉ dự phòng cho đến khi thành công
    const tryNextAddress = (index) => {
      if (index >= fallbackAddresses.length) {
        console.warn("Đã thử tất cả địa chỉ dự phòng mà không thành công, sử dụng vị trí mặc định");
        setDefaultLocation(address);
      return;
    }

      const simplifiedAddress = fallbackAddresses[index];
      
      // Kiểm tra nếu địa chỉ này đang được xử lý
      if (window._fallback_in_progress[simplifiedAddress]) {
        console.log(`Địa chỉ dự phòng "${simplifiedAddress}" đang được xử lý, bỏ qua`);
        tryNextAddress(index + 1);
        return;
      }
      
      console.log(`Thử geocoding với địa chỉ dự phòng (${index + 1}/${fallbackAddresses.length}):`, simplifiedAddress);
      
      // Đánh dấu địa chỉ đang được xử lý
      window._fallback_in_progress[simplifiedAddress] = true;
      
      const encodedAddress = encodeURIComponent(simplifiedAddress);
      
      // Đối với Sóc Trăng, sử dụng proximity để tăng độ chính xác
      const proximity = simplifiedAddress.toLowerCase().includes("sóc trăng") ? 
        "105.77476,9.613899" : // Tọa độ trung tâm Sóc Trăng đã điều chỉnh
        "105.77,10.03"; // Mặc định là Cần Thơ
      
      const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=vn&proximity=${proximity}&limit=1&language=vi`;
      
      fetch(geocodingUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Geocoding API error: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // Xóa khỏi danh sách đang xử lý
          delete window._fallback_in_progress[simplifiedAddress];
          
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const [lng, lat] = feature.center;
            
            console.log("Geocoding dự phòng thành công:", { lng, lat, simplifiedAddress });
            
            // Tạo vị trí mới từ kết quả dự phòng
          const customerLocationData = {
              lng: lng,
              lat: lat,
              address: address, // Vẫn giữ địa chỉ gốc để hiển thị
              pending: false,
              initialized: true,
              geocoded: true
          };
          
          // Lưu vào cache
          window[cacheKey] = customerLocationData;
          
          setCustomerLocation(customerLocationData);

          setTimeout(() => {
            try {
              console.log("Khởi tạo bản đồ với vị trí từ geocoding dự phòng:", customerLocationData);
              initMap(customerLocationData);
            } catch (err) {
              console.error("Lỗi khi khởi tạo bản đồ:", err);
              setMapError(true);
            }
          }, 300);
          } else {
            // Xóa khỏi danh sách đang xử lý
            delete window._fallback_in_progress[simplifiedAddress];
            // Thử địa chỉ tiếp theo
            tryNextAddress(index + 1);
          }
        })
        .catch(error => {
          // Xóa khỏi danh sách đang xử lý
          delete window._fallback_in_progress[simplifiedAddress];
          
          console.error(`Lỗi khi geocoding địa chỉ dự phòng ${index + 1}:`, error);
          // Thử địa chỉ tiếp theo
          tryNextAddress(index + 1);
        });
    };
    
    // Bắt đầu thử với địa chỉ đầu tiên
    tryNextAddress(0);
  }, [initMap, MAPBOX_ACCESS_TOKEN, setDefaultLocation]);
  
  // Lưu tham chiếu fallbackGeocoding
  fallbackGeocodingFnRef.current = performFallbackGeocoding;
  
  // Chuyển địa chỉ thành tọa độ
  const performGeocoding = useCallback((address) => {
    if (!address) {
      console.error("Không có địa chỉ để thực hiện geocoding");
      setMapError(true);
      return;
    }

    // Kiểm tra nếu là địa chỉ tại Mỹ Tú, Sóc Trăng và sử dụng tọa độ chính xác
    if (address.toLowerCase().includes("mỹ tú") && address.toLowerCase().includes("sóc trăng")) {
      console.log("Phát hiện địa chỉ Mỹ Tú, Sóc Trăng - sử dụng tọa độ cụ thể");
      // Tọa độ chính xác cho Mỹ Tú, Sóc Trăng
      const myTuLocation = {
        lng: 105.77588,
        lat: 9.70391,
        address: address,
        pending: false,
        initialized: true,
        geocoded: true
      };
      
      setCustomerLocation(myTuLocation);
      
      setTimeout(() => {
        try {
          console.log("Khởi tạo bản đồ với tọa độ Mỹ Tú:", myTuLocation);
          initMap(myTuLocation);
        } catch (err) {
          console.error("Lỗi khi khởi tạo bản đồ với tọa độ Mỹ Tú:", err);
          setMapError(true);
        }
      }, 300);
      
      return;
    }

    // Tạo cache key dựa trên địa chỉ
    const cacheKey = `geocode_${address.trim().toLowerCase().replace(/\s+/g, '_')}`;
    
    // Kiểm tra nếu đã có dữ liệu trong cache
    if (window[cacheKey]) {
      console.log("Sử dụng dữ liệu geocoding từ cache cho địa chỉ:", address);
      const cachedData = window[cacheKey];
      setCustomerLocation(cachedData);
      
      setTimeout(() => {
        try {
          initMap(cachedData);
        } catch (err) {
          console.error("Lỗi khi khởi tạo bản đồ từ dữ liệu cache:", err);
          setMapError(true);
        }
      }, 300);
      
      return;
    }

    try {
      console.log("Thực hiện geocoding cho địa chỉ:", address);
      
      // Chuẩn bị địa chỉ để tăng độ chính xác
      let structuredAddress = address;
      
      // Phân tích địa chỉ để tìm kiếm chính xác hơn
      const parts = address.split(',').map(part => part.trim());
      
      // Các tỉnh/thành phố lớn ở Việt Nam để nhận diện
      const majorCities = [
        'hồ chí minh', 'hà nội', 'đà nẵng', 'cần thơ', 'hải phòng', 
        'sóc trăng', 'vĩnh long', 'kiên giang', 'bạc liêu', 'cà mau'
      ];
      
      // Kiểm tra xem phần cuối của địa chỉ có phải là tỉnh/thành phố không
      let hasProvince = false;
      if (parts.length > 0) {
        const lastPart = parts[parts.length - 1].toLowerCase();
        for (const city of majorCities) {
          if (lastPart.includes(city)) {
            hasProvince = true;
            break;
          }
        }
      }
      
      // Thêm "Việt Nam" vào cuối nếu chưa có và không đề cập đến tỉnh/thành phố
      if (!structuredAddress.toLowerCase().includes("việt nam") && !hasProvince) {
        if (parts.length > 0 && parts[parts.length - 1].trim() !== '') {
        structuredAddress += ", Việt Nam";
        } else {
          structuredAddress += "Việt Nam";
        }
      }
      
      console.log("Địa chỉ cấu trúc cho geocoding:", structuredAddress);
      
      // Kiểm tra nếu đang thực hiện geocoding cho cùng địa chỉ
      if (window._geocoding_in_progress?.includes(structuredAddress)) {
        console.log("Đang có yêu cầu geocoding cho địa chỉ này rồi, bỏ qua");
        return;
      }
      
      // Đánh dấu đang geocoding địa chỉ này
      if (!window._geocoding_in_progress) window._geocoding_in_progress = [];
      window._geocoding_in_progress.push(structuredAddress);
      
      const encodedAddress = encodeURIComponent(structuredAddress);
      
      // Độ ưu tiên dựa trên tỉnh thành phố (Sóc Trăng)
      let proximity = "105.85,21.0245"; // Mặc định là tọa độ trung tâm Việt Nam (Hà Nội)
      
      // Xác định tọa độ trung tâm tỉnh/thành phố từ địa chỉ
      if (structuredAddress.toLowerCase().includes("sóc trăng")) {
        proximity = "105.9722,9.6031"; // Tọa độ trung tâm Sóc Trăng
      } else if (structuredAddress.toLowerCase().includes("cần thơ")) {
        proximity = "105.7731,10.0341"; // Tọa độ trung tâm Cần Thơ
      }
      
      // Thêm các tham số để cải thiện kết quả geocoding
      const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=vn&proximity=${proximity}&limit=1&language=vi&types=address,place,locality,neighborhood,district,postcode`;
      
      console.log("Gọi API geocoding với địa chỉ đã chuẩn hóa:", structuredAddress);
      
      // Sử dụng fetch để gọi API
      fetch(geocodingUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Geocoding API error: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // Xóa địa chỉ khỏi danh sách đang xử lý
          window._geocoding_in_progress = window._geocoding_in_progress.filter(a => a !== structuredAddress);
        
          console.log("Kết quả geocoding:", data);
          // Kiểm tra kết quả
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const [lng, lat] = feature.center; // Mapbox trả về [longitude, latitude]
            
            // Thêm tên địa điểm tìm thấy
            const placeName = feature.place_name;
            
            console.log("Đã tìm thấy tọa độ:", { lng, lat, placeName });
            
            const customerLocationData = {
              lng: lng,
              lat: lat,
              address: address, // Giữ nguyên địa chỉ gốc để hiển thị
              pending: false,
              initialized: true,
              geocoded: true
            };
            
            // Lưu vào cache
            window[cacheKey] = customerLocationData;
      
            setCustomerLocation(customerLocationData);
            
            // Khởi tạo bản đồ sau khi có tọa độ
            setTimeout(() => {
              try {
                initMap(customerLocationData);
              } catch (err) {
                console.error("Lỗi khi khởi tạo bản đồ:", err);
                setMapError(true);
              }
            }, 300);
          } else {
            console.warn("Không tìm thấy kết quả geocoding, thử tìm kiếm với phương pháp khác");
            // Sử dụng tham chiếu từ useRef để tránh circular dependency
            if (fallbackGeocodingFnRef.current) {
              fallbackGeocodingFnRef.current(address);
            }
          }
        })
        .catch(error => {
          // Xóa địa chỉ khỏi danh sách đang xử lý
          window._geocoding_in_progress = window._geocoding_in_progress.filter(a => a !== structuredAddress);
        
          console.error("Không thể chuyển đổi địa chỉ thành tọa độ:", error);
          // Sử dụng tham chiếu từ useRef để tránh circular dependency
          if (fallbackGeocodingFnRef.current) {
            fallbackGeocodingFnRef.current(address);
          }
        });
    } catch (error) {
      console.error("Lỗi khi thực hiện geocoding:", error);
      setMapError(true);
      setDefaultLocation(address);
    }
  }, [initMap, MAPBOX_ACCESS_TOKEN, setDefaultLocation]);
  
  // Lưu tham chiếu đến performGeocoding
  geocodingFnRef.current = performGeocoding;
  
  // Thêm useEffect để xử lý khi order được tải để trích xuất vị trí khách hàng
  useEffect(() => {
    if (order && order.userId && !customerLocation?.initialized) {
      console.log("Đang xử lý thông tin vị trí giao hàng từ order:", order);
      
      // Lấy thông tin địa chỉ đầy đủ khách hàng để hiển thị trên bản đồ
      // Đảm bảo thêm đầy đủ chi tiết: số nhà, ấp, xã, huyện, tỉnh
      const addressComponents = [];
      if (order.userId.houseNumber) addressComponents.push(order.userId.houseNumber);
      if (order.userId.address) addressComponents.push(order.userId.address);
      if (order.userId.hamlet) addressComponents.push(order.userId.hamlet);
      if (order.userId.ward) addressComponents.push(order.userId.ward);
      if (order.userId.district) addressComponents.push(order.userId.district);
      if (order.userId.province) addressComponents.push(order.userId.province);
      
      // Nối tất cả thành phần lại với nhau
      const fullAddress = addressComponents.filter(Boolean).join(", ");
      
      console.log("Địa chỉ đầy đủ chi tiết khách hàng:", fullAddress);
      
      // Ưu tiên sử dụng tọa độ từ DB nếu có
      if (order.deliveryCoordinates && order.deliveryCoordinates.lat && order.deliveryCoordinates.lng) {
        console.log("Sử dụng tọa độ từ database:", order.deliveryCoordinates);
        
        const customerLocationData = {
          lng: parseFloat(order.deliveryCoordinates.lng),
          lat: parseFloat(order.deliveryCoordinates.lat),
          address: fullAddress,
          pending: false,
          initialized: true
        };
        
        setCustomerLocation(customerLocationData);
        
        // Khởi tạo bản đồ sau một khoảng thời gian ngắn để đảm bảo DOM đã sẵn sàng
        setTimeout(() => {
          try {
            console.log("Khởi tạo bản đồ với tọa độ từ database:", customerLocationData);
            initMap(customerLocationData);
          } catch (err) {
            console.error("Lỗi khi khởi tạo bản đồ với tọa độ từ database:", err);
            setMapError(true);
          }
        }, 500);
      } else {
        // Nếu không có tọa độ từ database, thực hiện geocoding để lấy tọa độ từ địa chỉ
        console.log("Không có tọa độ từ database, thực hiện geocoding cho địa chỉ:", fullAddress);
        
        // Khởi tạo customer location với địa chỉ đầy đủ, pending=true để trigger geocoding
        const pendingLocation = {
          address: fullAddress,
          pending: true,
          initialized: false
        };
        
        setCustomerLocation(pendingLocation);
        
        // Thực hiện geocoding ngay lập tức nếu có thể
        if (mapLoaded && geocodingFnRef.current) {
          console.log("Map đã sẵn sàng, thực hiện geocoding ngay lập tức");
          geocodingFnRef.current(fullAddress);
        }
      }
    }
  }, [order, customerLocation?.initialized, initMap, mapLoaded]);
  
  // Theo dõi khi mapLoaded thay đổi để thực hiện geocoding
  useEffect(() => {
    // Đảm bảo chỉ thực hiện geocoding một lần cho mỗi địa chỉ
    if (mapLoaded && customerLocation?.pending && customerLocation?.address && !customerLocation?.geocoded && !window._geocoding_requested) {
      try {
        console.log("Thực hiện geocoding địa chỉ khách hàng:", customerLocation.address);
        // Đánh dấu đã thực hiện geocoding request
        window._geocoding_requested = true;
        // Đánh dấu đã thực hiện geocoding
        setCustomerLocation(prev => ({...prev, geocoded: true}));
        if (geocodingFnRef.current) {
          geocodingFnRef.current(customerLocation.address);
        }
      } catch (geocodingError) {
        console.error("Lỗi khi thực hiện geocoding:", geocodingError);
        setMapError(true);
        // Usar la ubicación predeterminada en caso de error
        if (customerLocation?.address) {
          setDefaultLocation(customerLocation.address);
        }
      }
    }
  }, [mapLoaded, customerLocation, setDefaultLocation]);
  
  // Đặt lỗi bản đồ nếu có lỗi tải API
  useEffect(() => {
    if (loadError) {
      setMapError(true);
      console.error("Lỗi khi tải Mapbox:", loadError);
      
      if (loadError.message && loadError.message.includes("MapboxNotSupported")) {
        toast.error("Trình duyệt của bạn không hỗ trợ Mapbox. Vui lòng sử dụng trình duyệt khác.");
      } else {
        toast.error("Không thể tải bản đồ. Vui lòng làm mới trang và thử lại.");
      }
    }
  }, [loadError]);
  
  // Thêm useEffect để xử lý khi mapLoaded thay đổi và khởi tạo bản đồ mặc định nếu chưa có vị trí khách hàng
  useEffect(() => {
    // Chỉ chạy một lần khi mapLoaded = true và chưa có customerLocation
    // Đảm bảo chỉ chạy một lần với biến flag
    if (mapLoaded && !mapError && !customerLocation && !window.__map_default_initialized && !window._default_location_requested) {
      console.log("Khởi tạo vị trí mặc định cho bản đồ vì không có customerLocation");
      // Đánh dấu đã yêu cầu khởi tạo
      window._default_location_requested = true;
      // Đánh dấu đã khởi tạo
      window.__map_default_initialized = true;
      
      const defaultLocation = {
        lat: 10.034236,
        lng: 105.775285,
        address: order?.userId?.address || "Địa chỉ không xác định",
        pending: false,
        initialized: true
      };
      setCustomerLocation(defaultLocation);
      setTimeout(() => {
        try {
          initMap(defaultLocation);
        } catch (err) {
          console.error("Lỗi khi khởi tạo bản đồ với vị trí mặc định:", err);
          setMapError(true);
        }
      }, 500);
    }
  }, [mapLoaded, mapError, order, initMap]);

  // Thêm useEffect để tải bản đồ khi có thông tin vị trí
  useEffect(() => {
    // Nếu đã có vị trí khách hàng và chưa bị lỗi map và bản đồ chưa được khởi tạo
    if (customerLocation && !mapError && mapLoaded && !window.__map_initialized && !window._map_initialization_requested) {
      console.log("Có vị trí khách hàng, thử tải bản đồ:", customerLocation);
      // Đánh dấu đã yêu cầu khởi tạo
      window._map_initialization_requested = true;
      // Đánh dấu đã khởi tạo
      window.__map_initialized = true;
      
      // Tạo div cho bản đồ nếu chưa tồn tại
      const mapContainer = document.getElementById('order-tracking-map');
      if (!mapContainer) {
        console.log("Không tìm thấy container 'order-tracking-map' cho bản đồ");
        
        // Kiểm tra container map-container thay thế
        const mapContainerAlt = document.getElementById('map-container');
        if (mapContainerAlt) {
          // Tạo div cho Mapbox nếu chưa có
          if (!mapContainerAlt.querySelector('#order-tracking-map')) {
            const mapDiv = document.createElement('div');
            mapDiv.id = 'order-tracking-map';
            mapDiv.style.width = '100%';
            mapDiv.style.height = '100%';
            mapContainerAlt.appendChild(mapDiv);
            
            // Khởi tạo bản đồ
            setTimeout(() => initMap(customerLocation), 100);
          }
        }
      } else if (!mapContainer.__map_initialized) {
        // Khởi tạo bản đồ nếu container tồn tại nhưng chưa có bản đồ
        initMap(customerLocation);
      }
    }
  }, [customerLocation, mapError, mapLoaded, initMap]);

  // Manejar errores de Mapbox y mostrar el mapa estático como alternativa
  useEffect(() => {
    if (mapError && customerLocation) {
      console.log("El mapa interactivo ha fallado, utilizando mapa estático como alternativa");
      // Asegurar que tenemos las coordenadas para mostrar el mapa estático
      if (!customerLocation.lng || !customerLocation.lat) {
        const defaultLocation = {
          lat: 10.034236,
          lng: 105.775285,
          address: customerLocation.address || "Địa chỉ không xác định",
          pending: false
        };
        setCustomerLocation(defaultLocation);
      }
    }
  }, [mapError, customerLocation]);
  
  const toggleTracking = () => {
    setShowTracking(!showTracking);
  };

  // Hàm kiểm tra trạng thái thanh toán
  const isOrderPaid = (order) => {
    return (
      order.isPaid === true || 
      order.paymentStatus === 'completed' ||
      order.status === 'processing' ||
      order.status === 'shipped' ||
      order.status === 'delivered' ||
      order.status === 'completed'
    );
  };

  const goBack = () => {
    navigate('/tai-khoan/don-hang');
  };

  // Thêm useEffect để xử lý khi mapLoaded thay đổi và khởi tạo bản đồ mặc định nếu chưa có vị trí khách hàng
  useEffect(() => {
    if (mapLoaded && !mapError) {
      // Nếu không có vị trí khách hàng hoặc đang chờ, tạo vị trí mặc định
      if (!customerLocation || (customerLocation.pending && !customerLocation.address)) {
        console.log("Khởi tạo vị trí mặc định cho bản đồ vì không có customerLocation");
        const defaultLocation = {
          lat: 10.034236,
          lng: 105.775285,
          address: order?.userId?.address || "Địa chỉ không xác định",
          pending: false
        };
        setCustomerLocation(defaultLocation);
        setTimeout(() => {
          try {
            initMap(defaultLocation);
          } catch (err) {
            console.error("Lỗi khi khởi tạo bản đồ với vị trí mặc định:", err);
            setMapError(true);
          }
        }, 500);
      }
    }
  }, [mapLoaded, mapError, customerLocation, initMap, order]);

  // Cải thiện hàm formatDate để hiển thị ngày dự kiến giao hàng đẹp hơn
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // Thêm hàm chỉ hiển thị ngày tháng năm (không hiện giờ phút)
  const formatDateOnly = (dateString) => {
    const options = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // Hàm lấy encoded path từ Mapbox Directions API cho bản đồ tĩnh
  const getEncodedPath = useCallback(() => {
    // Ruta de ejemplo codificada en polyline para mostrar en el mapa estático
    // Este es un camino predefinido para usar cuando no podemos obtener la ruta real
    // desde la API de directions (que requiere llamadas del lado del servidor)
    
    // Devuelve un path codificado representando una ruta aproximada
    if (customerLocation && customerLocation.lng && customerLocation.lat) {
      try {
        // Crear un path básico con algunos puntos intermedios entre la tienda y el cliente
        const shopLng = SHOP_LOCATION.lng;
        const shopLat = SHOP_LOCATION.lat;
        const custLng = customerLocation.lng;
        const custLat = customerLocation.lat;
        
        // Calculamos 3 puntos intermedios para hacer la ruta más realista
        const path = [
          [shopLng, shopLat],
          [shopLng + (custLng - shopLng) * 0.25, shopLat + (custLat - shopLat) * 0.25],
          [shopLng + (custLng - shopLng) * 0.5, shopLat + (custLat - shopLat) * 0.5],
          [shopLng + (custLng - shopLng) * 0.75, shopLat + (custLat - shopLat) * 0.75],
          [custLng, custLat]
        ];
        
        // Codificar el path en formato polyline para Mapbox
        // Usamos una versión simplificada de codificación por compatibilidad
        return path.map(point => point.join(',').trim()).join(';');
      } catch (error) {
        console.error("Error al generar el path codificado:", error);
      }
    }
    
    // Devolver un path predeterminado en caso de error
    return `${SHOP_LOCATION.lng},${SHOP_LOCATION.lat};${customerLocation?.lng || 105.76},${customerLocation?.lat || 10.02}`;
  }, [customerLocation]);

  // Hiển thị phiên bản đơn giản của bản đồ
  const renderSimpleMap = useCallback(() => {
    // Si no tenemos la ubicación del cliente, mostrar un mensaje de carga
    if (!customerLocation) {
      return (
        <div className="w-full aspect-video bg-gray-100 flex items-center justify-center rounded-lg border border-gray-200">
          <div className="text-gray-500 flex flex-col items-center">
            <FaMapMarkerAlt size={32} className="mb-2 text-gray-400" />
            <p>Đang tải thông tin địa chỉ...</p>
          </div>
        </div>
      );
    }
    
    // Xóa dòng này - biến không sử dụng
    // const displayAddress = customerLocation.address;
    
    // Crear la URL para el mapa estático de Mapbox
    const path = getEncodedPath();
    const mapWidth = 800;
    const mapHeight = 450;
    const zoom = 13;
    
    // Marcadores para la tienda y el cliente
    const shopMarker = `pin-s-shop+C41E3A(${SHOP_LOCATION.lng},${SHOP_LOCATION.lat})`;
    const customerMarker = `pin-s-home+2673DD(${customerLocation.lng},${customerLocation.lat})`;
    
    // Crear la URL para el mapa estático con la ruta y los marcadores
    const mapImageUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/path-4+2673DD-0.7(${path})/${shopMarker},${customerMarker}/auto/${mapWidth}x${mapHeight}?access_token=${MAPBOX_ACCESS_TOKEN}`;
    
    // URL para ver las direcciones en Google Maps (más común para usuarios)
    const directionsUrl = `https://www.google.com/maps/dir/${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}/${customerLocation.lat},${customerLocation.lng}/data=!3m1!4b1!4m2!4m1!3e0`;
    
    // Calcular la distancia aproximada
    const distance = calculateDistance(
      SHOP_LOCATION.lat, SHOP_LOCATION.lng,
      customerLocation.lat, customerLocation.lng
    );
    
    // Estimar el tiempo de entrega (30 km/h cho đường dài giữa các tỉnh)
    const estimatedTime = Math.ceil(distance / 30 * 60);
    
    return (
      <div className="w-full rounded-lg overflow-hidden border border-gray-200">
        <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
          <img 
            src={mapImageUrl} 
            alt="Bản đồ vị trí giao hàng" 
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error("Lỗi khi tải bản đồ tĩnh");
              e.target.src = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${customerLocation.lng},${customerLocation.lat},${zoom}/${mapWidth}x${mapHeight}?access_token=${MAPBOX_ACCESS_TOKEN}`;
            }}
          />
          <a 
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 bg-white rounded-md shadow-md px-3 py-1.5 text-blue-600 text-xs font-medium hover:bg-blue-50 transition border border-gray-200 flex items-center gap-1"
          >
            <FaDirections className="text-blue-600" size={14} />
            Xem chỉ đường
          </a>
        </div>
        <div className="px-3 py-2 bg-white border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
              <span className="font-semibold text-gray-700 text-xs sm:text-sm">Cửa hàng → Địa chỉ nhận hàng</span>
            </div>
            <div className="flex gap-4">
              <div className="text-xs sm:text-sm"><span className="font-medium text-blue-600">Khoảng cách:</span> {distance.toFixed(1)} km</div>
              <div className="text-xs sm:text-sm"><span className="font-medium text-blue-600">Thời gian ước tính:</span> {estimatedTime} phút</div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [customerLocation, MAPBOX_ACCESS_TOKEN, getEncodedPath, calculateDistance]);

  // Hàm hiển thị bản đồ (quyết định hiển thị bản đồ nào)
  const renderMap = useCallback(() => {
    // Kiểm tra nếu đã hiển thị bản đồ tương tác thành công, không hiển thị static map
    if (mapLoaded && !mapError) {
      // Xóa dòng này - biến không sử dụng
      // const displayAddress = customerLocation?.address || "Địa chỉ giao hàng";
      
      return (
        <div className="w-full relative rounded-lg overflow-hidden border border-gray-200">
          <div className="aspect-video w-full" id="map-container">
            <div id="order-tracking-map" style={{width: '100%', height: '100%'}}></div>
          </div>
          <div id="map-info" className="px-3 py-2 bg-white border-t border-gray-200"></div>
          {/* Nút mở bản đồ chỉ đường */}
          {customerLocation && (
            <a 
              href={`https://www.google.com/maps/dir/${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}/${customerLocation.lat},${customerLocation.lng}/data=!3m1!4b1!4m2!4m1!3e0`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-12 right-3 bg-white rounded-md shadow-md px-3 py-1.5 text-blue-600 text-xs font-medium hover:bg-blue-50 transition border border-gray-200 flex items-center gap-1"
            >
              <FaDirections className="text-blue-600" size={14} />
              Xem chỉ đường tới địa điểm nhận hàng
            </a>
          )}
        </div>
      );
    }
    
    // Nếu không thể tải bản đồ tương tác, hiển thị bản đồ tĩnh
    if (customerLocation) {
      return renderSimpleMap();
    }
    
    // Nếu không có địa chỉ khách hàng, hiển thị thông báo
    return (
      <div className="w-full aspect-video bg-gray-100 flex items-center justify-center rounded-lg border border-gray-200">
        <div className="text-gray-500 flex flex-col items-center">
          <FaMapMarkerAlt size={32} className="mb-2 text-gray-400" />
          <p>Đang tải thông tin địa chỉ...</p>
        </div>
      </div>
    );
  }, [mapLoaded, mapError, customerLocation, renderSimpleMap]);
  
  // Tạo useEffect mới để đảm bảo container map tồn tại
  useEffect(() => {
    if (mapLoaded && !mapError) {
      // Tìm hoặc tạo container cho bản đồ
      const mapContainerDiv = document.getElementById('map-container');
      const mapDiv = document.getElementById('order-tracking-map');
      
      if (mapContainerDiv && !mapDiv) {
        console.log("Tạo mới div cho map vì không tìm thấy order-tracking-map");
        const newMapDiv = document.createElement('div');
        newMapDiv.id = 'order-tracking-map';
        newMapDiv.style.width = '100%';
        newMapDiv.style.height = '100%';
        mapContainerDiv.appendChild(newMapDiv);
      }
      
      // Đảm bảo container có kích thước
      if (mapContainerDiv) {
        mapContainerDiv.style.minHeight = '300px';
      }
      
      // Reset các biến global để tránh lỗi đã khởi tạo
      window.__map_initialized = false;
      window.__map_default_initialized = false;
    }
  }, [mapLoaded, mapError]);

  useEffect(() => {
    // Escuchar errores de Mapbox para setMapError
    const handleMapboxError = (e) => {
      console.error("Mapbox error event:", e);
      setMapError(true);
    };

    // Añadir listener de error a nivel de ventana para capturar errores de mapbox-gl
    window.addEventListener('error', handleMapboxError);

    return () => {
      window.removeEventListener('error', handleMapboxError);
    };
  }, []);

  // Cleanup global variables khi component unmount
  useEffect(() => {
    return () => {
      // Xóa tất cả các biến global đã tạo
      console.log("Cleanup global variables khi component unmount");
      
      // Xóa instance map nếu có
      if (window.mapInstance) {
        try {
          window.mapInstance.remove();
        } catch (e) {
          console.error("Lỗi khi xóa map instance:", e);
        }
        window.mapInstance = null;
      }
      
      // Reset các cờ đánh dấu
      window.__map_initialized = false;
      window.__map_default_initialized = false;
      window._geocoding_requested = false;
      window._default_location_requested = false;
      window._map_initialization_requested = false;
      
      // Xóa danh sách đang xử lý
      window._geocoding_in_progress = [];
      window._fallback_in_progress = {};
      
      // Xóa hàm global
      window._performFallbackGeocoding = null;
    };
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-4 sm:py-8 bg-gray-50">
        <div className="flex items-center justify-center min-h-[40vh] sm:min-h-[50vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-green-500"></div>
            <p className="text-sm sm:text-base text-gray-600">Đang tải thông tin đơn hàng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-4 sm:py-8 bg-gray-50">
        <div className="text-center">
          <XCircleIcon className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-3 sm:mb-4" />
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">Không tìm thấy đơn hàng</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4">Đơn hàng không tồn tại hoặc bạn không có quyền xem đơn hàng này.</p>
          <button
            onClick={goBack}
            className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm sm:text-base"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1 sm:mr-2" />
            Quay lại danh sách đơn hàng
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xử lý";
      case "confirmed":
        return "Đã xác nhận";
      case "processing":
        return "Đang xử lý";
      case "preparing":
        return "Đang chuẩn bị hàng";
      case "packaging":
        return "Hoàn tất đóng gói";
      case "shipping":
        return "Đang vận chuyển";
      case "shipped":
        return "Đã giao cho vận chuyển";
      case "delivering":
        return "Đang giao hàng";
      case "delivered":
        return "Đã giao hàng";
      case "completed":
        return "Hoàn thành";
      case "paid":
        return "Đã thanh toán";
      case "cancelled":
        return "Đã hủy";
      case "awaiting_payment":
        return "Chờ thanh toán";
      case "refunded":
        return "Đã hoàn tiền";
      case "failed":
        return "Thất bại";
      case "delivery_failed":
        return "Giao hàng thất bại";
      default:
        return translateStatus(status) || status;
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 bg-gray-50">
      <div className="flex items-center gap-1 sm:gap-2 mb-4 sm:mb-6">
        <Link to="/tai-khoan/don-hang" className="flex items-center text-green-600 hover:text-green-700 transition-colors">
          <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Quay lại</span>
        </Link>
        <ClipboardListIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#51bb1a]" />
        <h2 className="text-base sm:text-xl font-semibold text-gray-800 lg:text-2xl truncate">
          Đơn hàng #{order._id.slice(-6).toUpperCase()}
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-3 sm:gap-6">
        {/* Thông tin đơn hàng */}
        <div className="md:col-span-2 space-y-3 sm:space-y-6">
          <div className="bg-white shadow-sm sm:shadow-md rounded-lg overflow-hidden">
            <div className="bg-green-50 py-2 px-3 sm:py-4 sm:px-6 border-b border-green-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Thông tin đơn hàng</h3>
            </div>
            <div className="px-3 py-2 sm:px-6 sm:py-4 space-y-2 sm:space-y-3 text-sm flex flex-col gap-1 sm:gap-2">
              <div className="flex justify-between items-center">
                <div className="text-gray-600 text-xs sm:text-sm">Mã đơn:</div>
                <div className="font-medium text-xs sm:text-sm">#{order._id.slice(-6).toUpperCase()}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600 text-xs sm:text-sm">Ngày đặt:</div>
                <div className="text-xs sm:text-sm">{formatDate(order.createdAt)}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600 text-xs sm:text-sm">Tổng tiền:</div>
                <div className="font-semibold text-sm sm:text-base">{formatCurrency(order.totalAmount)}đ</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600 text-xs sm:text-sm">Trạng thái:</div>
                <div>
                  <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs rounded-full ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600 text-xs sm:text-sm">Thanh toán:</div>
                <div>
                  <span
                    className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs rounded-full ${
                      isOrderPaid(order)
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {isOrderPaid(order) ? "Đã thanh toán" : "Chưa thanh toán"}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600 text-xs sm:text-sm">Phương thức:</div>
                <div className="font-medium text-xs sm:text-sm text-right">
                  {order.paymentMethod === "cod" ? "Thanh toán khi nhận hàng" : 
                   order.paymentMethod === "bank_transfer" ? "Chuyển khoản ngân hàng" : 
                   order.paymentMethod}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600 text-xs sm:text-sm">Mã vận đơn:</div>
                <div className="flex items-center gap-1 sm:gap-2">
                  {!order.orderCode ? (
                    <div className="flex items-center">
                      <span className="text-gray-500 text-xs sm:text-sm">Chưa có</span>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-xs sm:text-sm">{order.orderCode}</span>
                      <button
                        onClick={toggleTracking}
                        className={`flex items-center gap-1 text-[10px] sm:text-xs ${
                          showTracking 
                            ? "text-green-600 bg-green-50 hover:bg-green-100" 
                            : "text-blue-600 bg-blue-50 hover:bg-blue-100"
                        } px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full transition-colors`}
                      >
                        <EyeIcon className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                        <span>{showTracking ? "Ẩn" : "Xem"}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bản đồ theo dõi đơn hàng */}
          <div className="bg-white shadow-sm sm:shadow-md rounded-lg overflow-hidden">
            <div className="bg-green-50 py-2 px-3 sm:py-4 sm:px-6 border-b border-green-100 flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Bản đồ theo dõi</h3>
              <div className="flex gap-1 sm:gap-2 items-center">
                {mapError && (
                  <button 
                    onClick={() => {
                      setMapError(null);
                      window.location.reload();
                    }}
                    className="flex items-center gap-1 text-[10px] sm:text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Làm mới</span>
                  </button>
                )}
                <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
            </div>
            <div className="p-2 sm:p-4">
              <div id="map-info" className="mb-2 text-xs text-gray-500"></div>
              {/* Chỉ hiển thị một bản đồ duy nhất */}
              {renderMap()}
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="bg-white shadow-sm sm:shadow-md rounded-lg overflow-hidden">
            <div className="bg-green-50 py-2 px-3 sm:py-4 sm:px-6 border-b border-green-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Sản phẩm</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-2 sm:py-3 sm:px-4 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                    <th className="py-2 px-2 sm:py-3 sm:px-4 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Đơn giá</th>
                    <th className="py-2 px-1 sm:py-3 sm:px-2 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">SL</th>
                    <th className="py-2 px-2 sm:py-3 sm:px-4 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">T.Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.products.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-2 px-2 sm:py-3 sm:px-4 break-words">
                        <div className="flex items-center">
                          <div className="h-8 w-8 flex-shrink-0 bg-gray-100 rounded">
                            {item.productId?.productImages ? (
                              <img 
                                src={item.productId.productImages[0]} 
                                alt={item.productId.productName} 
                                className="h-8 w-8 object-cover rounded" 
                              />
                            ) : (
                              <PackageIcon className="h-4 w-4 m-2 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-2 flex-1 min-w-0">
                            <div className="text-[10px] sm:text-xs font-medium text-gray-900 line-clamp-2 break-words">
                              {item.productId?.productName || "Sản phẩm không tồn tại"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 whitespace-nowrap text-right text-[10px] sm:text-xs text-gray-500">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-2 px-1 sm:py-3 sm:px-2 whitespace-nowrap text-right text-[10px] sm:text-xs text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 whitespace-nowrap text-right text-[10px] sm:text-xs font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="py-2 px-2 sm:py-3 sm:px-4 text-right text-[10px] sm:text-xs font-medium text-gray-500">
                      Tổng:
                    </td>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-right text-[10px] sm:text-xs font-bold text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Hiển thị thông tin theo dõi đơn hàng khi người dùng nhấn nút Xem tiến trình */}
          {showTracking && order.orderCode && (
            <motion.div 
              className="bg-white shadow-sm sm:shadow-md rounded-lg overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-blue-50 py-3 px-4 sm:py-4 sm:px-6 border-b border-blue-100 flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-semibold text-blue-800">Tiến trình giao hàng</h3>
                <TruckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              
              <div className="px-4 py-3 sm:px-6 sm:py-4">
                {trackingLoading ? (
                  <div className="flex justify-center py-4 sm:py-6">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : trackingError ? (
                  <div className="text-center py-4 sm:py-6">
                    <XCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500 mx-auto mb-2" />
                    <p className="text-gray-600">Không thể lấy thông tin vận chuyển</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-2">Đơn hàng của bạn đang được xử lý</p>
                  </div>
                ) : !trackingInfo ? (
                  <div className="text-center py-4 sm:py-6">
                    <ClockIcon className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-gray-600">Đang chờ thông tin vận chuyển</p>
                  </div>
                ) : (
                  <div>
                    {console.log("Debug tracking status:", {
                      main_status: trackingInfo.status_name,
                      latest_log: trackingInfo.tracking_logs && trackingInfo.tracking_logs.length > 0 ? trackingInfo.tracking_logs[0].status_name : null,
                      all_logs: trackingInfo.tracking_logs
                    })}
                    <div className="mb-3 sm:mb-4 py-2 px-3 sm:py-3 sm:px-4 bg-blue-50 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="text-xs text-gray-500">Trạng thái</div>
                        <div className="font-medium text-blue-700 text-sm sm:text-lg">
                          {trackingInfo.tracking_logs && trackingInfo.tracking_logs.length > 0 
                            ? trackingInfo.tracking_logs[0].status_name 
                            : trackingInfo.status_name || "Đang vận chuyển"}
                        </div>
                      </div>
                      {trackingInfo.estimated_delivery_time && (
                        <div className="sm:text-right">
                          <div className="text-xs text-gray-500">Dự kiến giao hàng</div>
                          <div className="font-medium text-blue-700 text-xs sm:text-sm">
                            {formatDateOnly(trackingInfo.estimated_delivery_time)}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                      Chi tiết hành trình
                    </h4>
                    
                    {trackingInfo.tracking_logs && trackingInfo.tracking_logs.length > 0 ? (
                      <div className="relative mb-4 sm:mb-6">
                        <div className="absolute top-0 bottom-0 left-[10px] w-0.5 bg-gray-200"></div>
                        <div className="space-y-4 sm:space-y-6">
                          {trackingInfo.tracking_logs.map((log, index) => (
                            <motion.div 
                              key={index}
                              className="flex gap-3 sm:gap-4"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <div className={`h-5 w-5 rounded-full flex-shrink-0 mt-1.5 ${index === 0 ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                              <div className="pb-2">
                                <div className="text-xs sm:text-sm font-medium">{log.status_name}</div>
                                <div className="text-xs text-gray-500">{formatDate(log.timestamp)}</div>
                                {log.location && (
                                  <div className="text-xs text-gray-600 mt-1">{log.location}</div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-xs sm:text-sm">Chưa có thông tin vận chuyển</p>
                    )}

                    <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50">
                      <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Lưu ý:</h5>
                      <p className="text-xs text-gray-600">
                        Thông tin theo dõi đơn hàng được cập nhật từ đơn vị vận chuyển Giao Hàng Nhanh. 
                        Nếu bạn có bất kỳ thắc mắc nào về đơn hàng, vui lòng liên hệ với chúng tôi qua hotline: 1900 1234.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Thông tin vận chuyển và tracking */}
        <div className="md:col-span-1 space-y-4 sm:space-y-6">
          {/* Thông tin giao hàng */}
          <div className="bg-white shadow-sm sm:shadow-md rounded-lg overflow-hidden">
            <div className="bg-green-50 py-3 px-4 sm:py-4 sm:px-6 border-b border-green-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Thông tin giao hàng</h3>
            </div>
            <div className="px-4 py-3 sm:px-6 sm:py-4 space-y-3 sm:space-y-6 text-sm flex flex-col gap-2 sm:gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="text-xs sm:text-sm text-gray-600 sm:min-w-[100px]">Người nhận:</div>
                <div className="font-medium">{order.userId?.firstName + " " + order.userId?.lastName || "Không có thông tin"}</div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="text-xs sm:text-sm text-gray-600 sm:min-w-[100px]">Số điện thoại:</div>
                <div className="font-medium">{order.userId?.phone || "Không có thông tin"}</div>
              </div>
              <div className="flex flex-col gap-1 sm:gap-2">
                <div className="text-xs sm:text-sm text-gray-600">Địa chỉ giao hàng:</div>
                <div className="font-medium">
                  {order.userId ? (
                    <span className="text-xs sm:text-sm">
                      {order.userId.houseNumber && `${order.userId.houseNumber}, `}
                      {order.userId.address && `${order.userId.address}, `}
                      {order.userId.hamlet && `${order.userId.hamlet}, `}
                      {order.userId.ward && `${order.userId.ward}, `}
                      {order.userId.district && `${order.userId.district}, `}
                      {order.userId.province && `${order.userId.province}`}
                    </span>
                  ) : (
                    "Không có thông tin địa chỉ"
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="text-xs sm:text-sm text-gray-600 sm:min-w-[100px]">Phương thức:</div>
                <div className="font-medium">
                  {order.shippingInfo?.method === "standard" ? "Giao hàng tiêu chuẩn" : 
                   order.shippingInfo?.method === "express" ? "Giao hàng nhanh" : 
                   order.shippingInfo?.method || "Tiêu chuẩn"}
                </div>
              </div>
            </div>
          </div>

          {/* Theo dõi đơn hàng (dạng thu gọn) */}
          <div className="bg-white shadow-sm sm:shadow-md rounded-lg overflow-hidden">
            <div className="bg-green-50 py-3 px-4 sm:py-4 sm:px-6 border-b border-green-100 flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Theo dõi đơn hàng</h3>
              <TruckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            
            <div className="px-4 py-3 sm:px-6 sm:py-4">
              {!order.orderCode ? (
                <div className="text-center py-4 sm:py-6">
                  <PackageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-gray-600">Đơn hàng chưa có mã vận đơn</p>
                </div>
              ) : trackingLoading ? (
                <div className="flex justify-center py-4 sm:py-6">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : trackingError ? (
                <div className="text-center py-4 sm:py-6">
                  <ClockIcon className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-gray-600">Đơn hàng đang xử lý</p>
                </div> 
              ) : !trackingInfo ? (
                <div className="text-center py-4 sm:py-6">
                  <ClockIcon className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-gray-600">Đang chờ thông tin vận chuyển</p>
                </div>
              ) : (
                <div>
                  <div className="mb-3 sm:mb-4 py-2 px-3 sm:py-3 sm:px-4 bg-blue-50 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="text-xs text-gray-500">Trạng thái hiện tại</div>
                      <div className="font-medium text-blue-700 text-sm sm:text-lg">
                        {trackingInfo.tracking_logs && trackingInfo.tracking_logs.length > 0 
                          ? trackingInfo.tracking_logs[0].status_name 
                          : trackingInfo.status_name || "Đang vận chuyển"}
                      </div>
                    </div>
                    {trackingInfo.estimated_delivery_time && (
                      <div className="sm:text-right">
                        <div className="text-xs text-gray-500">Dự kiến giao hàng</div>
                        <div className="font-medium text-blue-700 text-xs sm:text-sm">
                          {formatDateOnly(trackingInfo.estimated_delivery_time)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <h4 className="font-medium text-gray-800 text-sm mb-2 sm:mb-3">Lịch sử vận chuyển</h4>
                  
                  {trackingInfo.tracking_logs && trackingInfo.tracking_logs.length > 0 ? (
                    <div className="relative">
                      <div className="absolute top-0 bottom-0 left-[10px] w-0.5 bg-gray-200"></div>
                      <div className="space-y-3 sm:space-y-4">
                        {/* Chỉ hiện thị 3 cập nhật gần nhất */}
                        {trackingInfo.tracking_logs.slice(0, 3).map((log, index) => (
                          <motion.div 
                            key={index}
                            className="flex gap-2 sm:gap-3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className={`h-5 w-5 rounded-full flex-shrink-0 mt-1.5 ${index === 0 ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                            <div className="pb-2">
                              <div className="text-xs sm:text-sm font-medium">{log.status_name}</div>
                              <div className="text-xs text-gray-500">{formatDate(log.timestamp)}</div>
                              {log.location && (
                                <div className="text-xs text-gray-600 mt-1">{log.location}</div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs sm:text-sm">Chưa có thông tin vận chuyển</p>
                  )}

                  {trackingInfo.tracking_logs && trackingInfo.tracking_logs.length > 3 && (
                    <div className="mt-3 text-center">
                      <button
                        onClick={toggleTracking}
                        className="text-blue-600 text-xs sm:text-sm hover:text-blue-800 transition-colors"
                      >
                        {showTracking ? "Thu gọn" : "Xem đầy đủ lịch sử vận chuyển"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 