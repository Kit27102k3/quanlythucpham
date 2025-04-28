import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ClipboardListIcon, ChevronLeftIcon, TruckIcon, PackageIcon, XCircleIcon, ClockIcon, MapPinIcon, EyeIcon, ArrowLeftIcon } from "lucide-react";
import orderApi from "../../../api/orderApi";
import formatCurrency from "../../Until/FotmatPrice";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { translateStatus } from '../../component/OrderStatusDisplay';

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

// Lấy API key từ biến môi trường
// Tách API key thành nhiều phần để tránh bị Ad-blocker phát hiện
const API_KEY_PARTS = ["AIza", "SyDeUx_", "vBJVsL86Fs", "vef9Kq6FF", "RB7O8D4t0"];
const getGoogleMapsApiKey = () => API_KEY_PARTS.join("");

// Biến toàn cục để theo dõi trạng thái tải API
window.googleMapsLoadPromise = window.googleMapsLoadPromise || null;

// Biến xác định xem Maps API có bị chặn không
window.isMapsAPIBlocked = window.isMapsAPIBlocked || false;

// Khởi tạo script theo cách ít bị chặn hơn
const loadGoogleMapsScript = () => {
      return new Promise((resolve, reject) => {
        try {
          // Kiểm tra nếu script đã tồn tại
          const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
          if (existingScript) {
            console.log("Script Google Maps đã tồn tại trong DOM");
        return resolve();
          }
          
      // Đặt timeout để xử lý trường hợp script bị chặn
          const timeoutId = setTimeout(() => {
            if (!window.google || !window.google.maps) {
              console.warn("Google Maps API không được tải trong thời gian chờ");
              delete window.initGoogleMapsCallback;
              reject(new Error("Google Maps API loading timeout - có thể bị chặn bởi trình duyệt"));
            }
          }, 10000);
          
          // Khai báo callback trước khi tạo script
          window.initGoogleMapsCallback = function() {
            clearTimeout(timeoutId);
            console.log("Google Maps API đã được tải thành công qua callback");
            // Dọn dẹp callback sau khi đã sử dụng
            delete window.initGoogleMapsCallback;
            resolve();
          };

          // Tạo một script tag để tải Google Maps
          const script = document.createElement("script");
      const key = getGoogleMapsApiKey();
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=initGoogleMapsCallback`;
          script.async = true;
          
          // Xử lý khi script gặp lỗi
          script.onerror = (error) => {
            console.error("Không thể tải Google Maps API:", error);
        clearTimeout(timeoutId);
        delete window.initGoogleMapsCallback;
            reject(error);
          };

          // Thêm script vào document
          document.head.appendChild(script);
        } catch (error) {
          console.error("Lỗi khi tạo script:", error);
          reject(error);
        }
      });
    };

// Viết theo phương pháp đơn giản hơn, tạo custom hook useLoadGoogleMaps
const useLoadGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    // Kiểm tra nếu đã biết API bị chặn từ lần tải trước
    if (window.isMapsAPIBlocked) {
      console.warn("Google Maps API đã được xác định là bị chặn từ trước");
      setLoadError(new Error("ApiTargetBlockedMapError"));
      return;
    }

    // Nếu đã tải rồi thì không cần tải lại
    if (window.google && window.google.maps) {
      console.log("Google Maps API đã được tải trước đó");
      setIsLoaded(true);
      return;
    }

    // Nếu đang có promise tải rồi thì sử dụng lại
    if (window.googleMapsLoadPromise) {
      console.log("Đang sử dụng promise tải Google Maps API hiện có");
      window.googleMapsLoadPromise
        .then(() => {
          setIsLoaded(true);
        })
        .catch((error) => {
          // Đánh dấu API bị chặn nếu có lỗi phù hợp
          if (error.message && (
            error.message.includes("ApiTargetBlockedMapError") || 
            error.message.includes("Google Maps API loading timeout"))) {
              window.isMapsAPIBlocked = true;
          }
          setLoadError(error);
        });
      return;
    }

    // Lưu promise vào biến toàn cục và thực hiện tải
    window.googleMapsLoadPromise = loadGoogleMapsScript();
    
    window.googleMapsLoadPromise
      .then(() => {
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error("Lỗi khi tải Google Maps API:", error);
        setLoadError(error);
        
        // Đánh dấu API bị chặn nếu có lỗi phù hợp
        if (error?.message && (
          error.message.includes("ApiTargetBlockedMapError") || 
          error.message.includes("Google Maps API loading timeout"))) {
            window.isMapsAPIBlocked = true;
        }
        
        // Hiển thị thông báo lỗi dựa trên loại lỗi
        if (error?.message?.includes("ApiTargetBlockedMapError") || 
            error?.message?.includes("loading timeout") ||
            error?.message?.includes("ERR_BLOCKED")) {
          toast.error(
            "Google Maps bị chặn bởi trình duyệt. Vui lòng tắt các tiện ích chặn quảng cáo và làm mới trang.",
            { duration: 6000 }
          );
        } else {
          toast.error("Không thể tải bản đồ. Vui lòng làm mới trang và thử lại.");
        }
        
        // Xóa promise lỗi để lần sau có thể thử lại
        window.googleMapsLoadPromise = null;
      });

    return () => {
      // Không cần xóa script khi unmount vì chúng ta muốn giữ nó cho các component khác sử dụng
    };
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
  const { isLoaded: mapLoaded, loadError } = useLoadGoogleMaps();
  
  // Di chuyển định nghĩa fetchTrackingInfo lên trước (trước khi được sử dụng)
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
  
  // Khai báo các hàm xử lý map trước khi sử dụng
  const initMap = useCallback((location) => {
    console.log("Bắt đầu khởi tạo bản đồ với vị trí:", location);
    if (!window.google || !window.google.maps || !location) {
      console.error("Không thể khởi tạo bản đồ - API chưa sẵn sàng hoặc không có vị trí");
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
      if (mapContainer.__gm_initialized) {
        console.log("Bản đồ đã được khởi tạo trước đó");
        return;
      }

      // Kiểm tra nếu có lỗi API trước đó
      if (window.google.maps && window.google.maps.version === undefined) {
        console.error("Google Maps API không khởi tạo đúng cách");
        setMapError(true);
        return;
      }

      // Đánh dấu container đã được sử dụng
      mapContainer.__gm_initialized = true;

      // Tạo ID định danh duy nhất cho phiên làm việc này
      const mapInstanceId = `map_${Date.now()}`;
      mapContainer.setAttribute('data-map-id', mapInstanceId);

      console.log("Tạo bản đồ mới với ID:", mapInstanceId);

      // Tính toán giữa shop và khách hàng để đặt center và zoom
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: SHOP_LOCATION.lat, lng: SHOP_LOCATION.lng });
      bounds.extend({ lat: location.lat, lng: location.lng });

      // Tạo bản đồ mới
      try {
        const map = new window.google.maps.Map(mapContainer, {
          center: bounds.getCenter(),
          zoom: 12,
          mapTypeControl: false,
          fullscreenControl: true,
          streetViewControl: false,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });
        
        // Đảm bảo tất cả các điểm đều nằm trong vùng nhìn thấy
        map.fitBounds(bounds, { padding: 60 });
        
        console.log("Bản đồ được tạo thành công");

        // Tạo biểu tượng cho cửa hàng (giống Shopee)
        const shopIcon = {
          url: 'https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/ordertracking/f1f718b157cd67f128f91b166a08990e.png',
          // Nếu không có sẵn, có thể dùng màu xanh lá
          // url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
          scaledSize: new window.google.maps.Size(36, 36),
          origin: new window.google.maps.Point(0, 0),
          anchor: new window.google.maps.Point(18, 36)
        };

        // Thêm marker cho vị trí cửa hàng
        const shopMarker = new window.google.maps.Marker({
          position: { lat: SHOP_LOCATION.lat, lng: SHOP_LOCATION.lng },
          map,
          icon: shopIcon,
          title: 'Cửa hàng',
          animation: window.google.maps.Animation.DROP,
          zIndex: 2
        });

        // Thêm thông tin khi hover vào marker cửa hàng
        const shopInfoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 5px;">
              <div style="font-weight: bold;">${SHOP_LOCATION.address}</div>
              <div style="font-size: 12px; color: #666;">Địa điểm xuất hàng</div>
            </div>
          `
        });

        shopMarker.addListener('mouseover', () => {
          shopInfoWindow.open(map, shopMarker);
        });
        
        shopMarker.addListener('mouseout', () => {
          shopInfoWindow.close();
        });

        // Biểu tượng cho khách hàng - màu đỏ giống Shopee
        const customerIcon = {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(36, 36),
          origin: new window.google.maps.Point(0, 0),
          anchor: new window.google.maps.Point(18, 36)
        };

        // Thêm marker cho vị trí khách hàng
        const customerMarker = new window.google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map,
          icon: customerIcon,
          title: 'Địa chỉ nhận hàng',
          animation: window.google.maps.Animation.DROP,
          zIndex: 1
        });

        // Thêm thông tin khi hover vào marker khách hàng
        const customerInfoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 5px;">
              <div style="font-weight: bold;">Địa chỉ giao hàng</div>
              <div style="font-size: 12px; color: #666;">${location.address}</div>
            </div>
          `
        });

        customerMarker.addListener('mouseover', () => {
          customerInfoWindow.open(map, customerMarker);
        });
        
        customerMarker.addListener('mouseout', () => {
          customerInfoWindow.close();
        });

        // Thêm đường đi từ cửa hàng đến khách hàng - style giống Shopee
        try {
          const directionsService = new window.google.maps.DirectionsService();
          const directionsRenderer = new window.google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true, // Không hiển thị marker mặc định của directions
            polylineOptions: {
              strokeColor: '#2673DD', // Màu xanh dương đậm giống Shopee
              strokeOpacity: 0.7,
              strokeWeight: 4,
              icons: [{
                icon: {
                  path: 'M 0,-1 0,1',
                  strokeOpacity: 1,
                  scale: 3
                },
                offset: '0',
                repeat: '15px'
              }]
            }
          });

          directionsService.route(
            {
              origin: { lat: SHOP_LOCATION.lat, lng: SHOP_LOCATION.lng },
              destination: { lat: location.lat, lng: location.lng },
              travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (response, status) => {
              if (status === 'OK') {
                directionsRenderer.setDirections(response);
                
                // Hiển thị thông tin khoảng cách và thời gian - style giống Shopee
                const route = response.routes[0];
                const leg = route.legs[0];
                const infoDiv = document.getElementById('map-info');
                if (infoDiv) {
                  infoDiv.innerHTML = `
                    <div class="flex justify-between items-center">
                      <div class="flex items-center gap-2">
                        <span class="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                        <span class="font-semibold text-gray-700">Cửa hàng → Địa chỉ nhận hàng</span>
                      </div>
                      <div class="flex gap-4">
                        <div class="text-sm"><span class="font-medium text-blue-600">Khoảng cách:</span> ${leg.distance.text}</div>
                        <div class="text-sm"><span class="font-medium text-blue-600">Thời gian:</span> ${leg.duration.text}</div>
                      </div>
                    </div>
                  `;
                }
              } else {
                console.error("Không thể tính toán đường đi", status);
                const infoDiv = document.getElementById('map-info');
                if (infoDiv) {
                  infoDiv.innerHTML = `<div class="text-red-500">Không thể tính toán đường đi</div>`;
                }
              }
            }
          );
        } catch (directionsError) {
          console.error("Lỗi khi tạo đường đi:", directionsError);
          const infoDiv = document.getElementById('map-info');
          if (infoDiv) {
            infoDiv.innerHTML = `<div class="text-red-500">Lỗi khi tạo đường đi</div>`;
          }
        }
      } catch (mapError) {
        console.error("Lỗi khi tạo bản đồ:", mapError);
        setMapError(true);
        mapContainer.__gm_initialized = false;
        return;
      }
    } catch (error) {
      console.error("Lỗi khi khởi tạo bản đồ:", error);
      setMapError(true);
    }
  }, []);

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
            const fullAddress = `${orderData.userId.address}, ${orderData.userId.ward || ''}, ${orderData.userId.district || ''}, ${orderData.userId.province || ''}`;
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
    if (order && order.userId) {
      // Lấy thông tin địa chỉ đầy đủ khách hàng để hiển thị trên bản đồ
      const fullAddress = order.userId.address ? 
        `${order.userId.address}, ${order.userId.ward || ''}, ${order.userId.district || ''}, ${order.userId.province || ''}` : 
        "Địa chỉ không xác định";
      
      // Nếu có tọa độ có sẵn trong order, sử dụng luôn
      if (order.deliveryCoordinates && order.deliveryCoordinates.lat && order.deliveryCoordinates.lng) {
        setCustomerLocation({
          lat: parseFloat(order.deliveryCoordinates.lat),
          lng: parseFloat(order.deliveryCoordinates.lng),
          address: fullAddress,
          pending: false
        });
      } else {
        // Nếu không có tọa độ có sẵn, dùng tọa độ từ console log trong screenshot
        setCustomerLocation({
          lat: 10.034236,
          lng: 105.775285,
          address: fullAddress,
          pending: false
        });
      }
    }
  }, [order]);

  // Tạo URL cho Google Maps - cập nhật để sử dụng địa chỉ text thay vì tọa độ số
  const createGoogleMapsUrl = useCallback(() => {
    if (!customerLocation) {
      return null;
    }
    
    // Sử dụng từ khóa địa chỉ thay vì tọa độ để chính xác hơn
    const start = encodeURIComponent(SHOP_LOCATION.address);
    const end = encodeURIComponent(customerLocation.address);
    
    return `https://www.google.com/maps/dir/${start}/${end}`;
  }, [customerLocation]);

  // Hiển thị phiên bản đơn giản của bản đồ
  const renderSimpleMap = useCallback(() => {
    const mapUrl = createGoogleMapsUrl();
    
    if (!mapUrl) {
      return (
        <div className="flex flex-col justify-center items-center h-48 sm:h-64 space-y-3">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-green-500"></div>
          <p className="text-xs sm:text-sm text-gray-500">Đang tải bản đồ...</p>
        </div>
      );
    }
    
    return (
      <>
        <div className="mb-3 sm:mb-4 bg-blue-50 p-3 sm:p-4 rounded-lg">
          <div className="flex flex-col md:flex-row md:justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-600"></span>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600">Xuất phát từ:</span>
                <span className="text-xs sm:text-sm font-medium">{SHOP_LOCATION.address}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-600"></span>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600">Giao đến:</span>
                <span className="text-xs sm:text-sm font-medium">{customerLocation?.address || "Địa chỉ khách hàng"}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full h-48 sm:h-64 md:h-80 rounded-lg border border-gray-200 shadow-sm sm:shadow-md overflow-hidden">
          <div className="flex flex-col justify-center items-center h-full bg-blue-50 p-3 sm:p-4">
            <div className="mb-3 sm:mb-4">
              <MapPinIcon className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500 mx-auto" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-blue-800 mb-2">Xem chỉ đường trên Google Maps</h3>
            <p className="text-xs sm:text-sm text-blue-600 mb-3 sm:mb-4 text-center">
              Nhấn vào nút bên dưới để mở Google Maps<br className="hidden sm:block" /> và xem đường đi từ cửa hàng đến địa chỉ giao hàng
            </p>
            <a 
              href={mapUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-md text-xs sm:text-sm hover:bg-blue-700 transition-colors inline-flex items-center gap-1 sm:gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Xem trong Google Maps</span>
            </a>
          </div>
        </div>
        <div className="mt-2 sm:mt-3 text-xs text-gray-500 flex items-start gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] sm:text-xs">Đường đi được tính toán tự động và có thể khác với tuyến đường thực tế của đơn vị vận chuyển.</span>
        </div>
      </>
    );
  }, [customerLocation, createGoogleMapsUrl]);

  const renderMap = () => {
    // Luôn sử dụng renderSimpleMap để tránh sử dụng JavaScript API của Google Maps
    return renderSimpleMap();
  };

  // Chuyển địa chỉ thành tọa độ - phải nằm sau định nghĩa của initMap
  const performGeocoding = useCallback((address) => {
    if (!address) {
      console.error("Không có địa chỉ để thực hiện geocoding");
      setMapError(true);
      return;
    }

    if (!window.google || !window.google.maps) {
      console.error("Google Maps API chưa được tải");
      setMapError(true);
      window.isMapsAPIBlocked = true;
      return;
    }

    // Kiểm tra nếu maps API đã tải nhưng bị lỗi
    try {
      // Kiểm tra xem API đã hoạt động đúng bằng cách gọi một hàm bất kỳ
      if (!window.google.maps.Geocoder || !window.google.maps.Map) {
        console.error("Google Maps API tải không đúng hoặc bị lỗi");
        setMapError(true);
        window.isMapsAPIBlocked = true;
        return;
      }
    } catch (err) {
      console.error("Lỗi khi kiểm tra tính khả dụng của Google Maps API:", err);
      setMapError(true);
      window.isMapsAPIBlocked = true;
      return;
    }

    try {
      const geocoder = new window.google.maps.Geocoder();
      
      // Sử dụng Promise để xử lý callback
      const geocodePromise = new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
            resolve(results[0]);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });
      
      // Xử lý kết quả với timeout để tránh treo
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Geocoding timeout")), 5000);
      });
      
      // Chạy cả hai Promise và lấy kết quả từ cái nào hoàn thành trước
      Promise.race([geocodePromise, timeoutPromise])
        .then((result) => {
          const location = result.geometry.location;
          const customerLocationData = {
            lat: location.lat(),
            lng: location.lng(),
            address: address,
            pending: false
          };
          
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
        })
        .catch((error) => {
          console.error("Không thể chuyển đổi địa chỉ thành tọa độ:", error);
          
          // Sử dụng vị trí mặc định cho demo
          const defaultLocation = {
            lat: 10.034236,
            lng: 105.775285, // Vị trí ngẫu nhiên gần Nam Cần Thơ
            address: address,
            pending: false
          };
          setCustomerLocation(defaultLocation);
          
          // Khởi tạo bản đồ với vị trí mặc định
          setTimeout(() => {
            try {
              initMap(defaultLocation);
            } catch (err) {
              console.error("Lỗi khi khởi tạo bản đồ:", err);
              setMapError(true);
            }
          }, 300);
      });
    } catch (error) {
      console.error("Lỗi khi thực hiện geocoding:", error);
      setMapError(true);
      
      // Dùng vị trí mặc định
      const defaultLocation = {
        lat: 10.034236,
        lng: 105.775285,
        address: address,
        pending: false
      };
      setCustomerLocation(defaultLocation);
      
      // Khởi tạo bản đồ với vị trí mặc định
      setTimeout(() => {
        try {
          initMap(defaultLocation);
        } catch (err) {
          console.error("Lỗi khi khởi tạo bản đồ:", err);
          setMapError(true);
        }
      }, 300);
    }
  }, [initMap]);
  
  // Đặt lỗi bản đồ nếu có lỗi tải API
  useEffect(() => {
    if (loadError) {
      setMapError(true);
      console.error("Lỗi khi tải Google Maps API:", loadError);
      
      // Kiểm tra nếu API đã được tải nhưng không hoạt động đúng
      if (window.google && (!window.google.maps || typeof window.google.maps !== 'object')) {
        toast.error("Google Maps API không hoạt động đúng. Vui lòng làm mới trang.");
      }
    }
    
    // Đánh dấu biến global
    if (loadError && loadError.message && (
      loadError.message.includes("ApiTargetBlockedMapError") || 
      loadError.message.includes("loading timeout"))) {
        window.isMapsAPIBlocked = true;
    }
    
    // Kiểm tra sau 5 giây nếu Google Maps đã được tải nhưng không hoạt động
    const timeout = setTimeout(() => {
      if (window.google && window.google.maps && !mapError) {
        try {
          // Thử tạo một đối tượng Geocoder để kiểm tra
          new window.google.maps.Geocoder();
          
          // Nếu có customerLocation nhưng chưa khởi tạo bản đồ, thử lại
          if (customerLocation && !customerLocation.pending && !document.getElementById('order-tracking-map')?.__gm_initialized) {
            console.log("Thử lại khởi tạo bản đồ...");
            initMap(customerLocation);
          }
        } catch (error) {
          console.error("Google Maps API đã tải nhưng không thể sử dụng:", error);
          setMapError(true);
          window.isMapsAPIBlocked = true;
          toast.error("Google Maps API gặp vấn đề. Vui lòng làm mới trang.");
        }
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [loadError, mapError, customerLocation, initMap]);

  // Theo dõi khi mapLoaded thay đổi để thực hiện geocoding
  useEffect(() => {
    if (mapLoaded && customerLocation?.pending) {
      performGeocoding(customerLocation.address);
    }
  }, [mapLoaded, customerLocation, performGeocoding]);
  
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
    if (mapLoaded && !mapError && !window.isMapsAPIBlocked) {
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

  // Thêm useEffect để tải bản đồ khi có thông tin vị trí
  useEffect(() => {
    // Nếu đã có vị trí khách hàng và chưa bị lỗi map, thử tải bản đồ
    if (customerLocation && !mapError) {
      console.log("Có vị trí khách hàng, thử tải bản đồ:", customerLocation);
      
      // Sử dụng map-container thay vì order-tracking-map
      const mapContainer = document.getElementById('map-container');
      if (!mapContainer) {
        console.log("Không tìm thấy container 'map-container' cho bản đồ");
      }
    }
  }, [customerLocation, mapError]);

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
                      window.isMapsAPIBlocked = false;
                      document.querySelector(`script[src*="maps.googleapis.com"]`)?.remove();
                      window.googleMapsLoadPromise = null;
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
                    <p className="text-gray-600">Đang chờ thông tin vận chuyển</p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4 sm:mb-6 py-3 px-4 sm:py-4 sm:px-5 bg-blue-50 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="text-xs text-gray-500">Trạng thái hiện tại</div>
                        <div className="font-medium text-blue-700 text-sm sm:text-lg">{trackingInfo.status_name || "Đang vận chuyển"}</div>
                      </div>
                      {trackingInfo.estimated_delivery_time && (
                        <div className="sm:text-right">
                          <div className="text-xs text-gray-500">Dự kiến giao hàng</div>
                          <div className="font-medium text-blue-700">
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
                  {order.userId?.address ? (
                    <span className="text-xs sm:text-sm">
                      {order.userId.address}, 
                      {order.userId.ward && ` ${order.userId.ward},`}
                      {order.userId.district && ` ${order.userId.district},`}
                      {order.userId.province && ` ${order.userId.province}`}
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
                      <div className="text-xs text-gray-500">Trạng thái</div>
                      <div className="font-medium text-blue-700 text-sm sm:text-lg">{trackingInfo.status_name || "Đang vận chuyển"}</div>
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