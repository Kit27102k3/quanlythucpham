import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ClipboardListIcon, ChevronLeftIcon, TruckIcon, PackageIcon, XCircleIcon, ClockIcon, MapPinIcon, EyeIcon } from "lucide-react";
import orderApi, { getOrderById } from "../../../api/orderApi";
import formatCurrency from "../../Until/FotmatPrice";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Thêm constant cho địa chỉ cửa hàng mặc định
const SHOP_LOCATION = {
  address: "Trường Đại học Nam Cần Thơ",
  lat: 10.0079465,
  lng: 105.7202567
};

// Lấy API key từ biến môi trường
const GOOGLE_MAPS_API_KEY = "AIzaSyDeUx_vBJVsL86Fsvef9Kq6FFRB7O8D4t0";

// Biến toàn cục để theo dõi trạng thái tải API
window.googleMapsLoadPromise = window.googleMapsLoadPromise || null;

// Viết theo phương pháp đơn giản hơn, tạo custom hook useLoadGoogleMaps
const useLoadGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
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
          setLoadError(error);
        });
      return;
    }

    // Tạo một promise mới để tải API
    const loadScript = () => {
      return new Promise((resolve, reject) => {
        try {
          // Kiểm tra nếu script đã tồn tại
          const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
          if (existingScript) {
            console.log("Script Google Maps đã tồn tại trong DOM");
            resolve();
            return;
          }
          
          // Đặt timeout để xử lý trường hợp script bị chặn mà không gây ra lỗi onerror
          const timeoutId = setTimeout(() => {
            if (!window.google || !window.google.maps) {
              console.warn("Google Maps API không được tải trong thời gian chờ");
              delete window.initGoogleMapsCallback;
              reject(new Error("Google Maps API loading timeout - có thể bị chặn bởi trình duyệt"));
            }
          }, 10000);
          
          // Xử lý alternative loading cho Google Maps để tránh bị chặn
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
          // Sử dụng callback thay vì async/defer để tương thích tốt hơn
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMapsCallback`;
          script.async = true;
          // Không sử dụng &loading=async vì thường bị các trình chặn quảng cáo nhắm đến
          
          // Xử lý khi script gặp lỗi
          script.onerror = (error) => {
            console.error("Không thể tải Google Maps API:", error);
            clearTimeout(timeoutId); // Dọn dẹp timeout
            delete window.initGoogleMapsCallback; // Dọn dẹp biến global khi có lỗi
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

    // Lưu promise vào biến toàn cục và thực hiện tải
    window.googleMapsLoadPromise = loadScript();
    
    window.googleMapsLoadPromise
      .then(() => {
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error("Lỗi khi tải Google Maps API:", error);
        setLoadError(error);
        
        // Xử lý lỗi cụ thể
        const errorMessage = error?.message || "";
        const scriptContent = document.querySelector('script[src*="maps.googleapis.com"]')?.textContent || "";
        
        if (scriptContent.includes("ApiTargetBlockedMapError") || 
            errorMessage.includes("ApiTargetBlockedMapError")) {
          toast.error(
            "Google Maps bị chặn bởi trình duyệt hoặc extension. Vui lòng tắt trình chặn quảng cáo, tạm thời cho phép JavaScript từ maps.googleapis.com, và làm mới trang",
            { duration: 6000 }
          );
        } else if (errorMessage.includes("RefererNotAllowedMapError") || 
            scriptContent.includes("RefererNotAllowedMapError")) {
          toast.error("API key không được phép sử dụng trên domain này. Vui lòng cấu hình API key trong Google Cloud Console.");
        } else {
          toast.error("Không thể tải bản đồ, vui lòng kích hoạt Google Maps JavaScript API");
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

  // Chuyển địa chỉ thành tọa độ - phải nằm sau định nghĩa của initMap
  const performGeocoding = useCallback((address) => {
    if (!window.google || !window.google.maps) {
      console.error("Google Maps API chưa được tải");
      return;
    }

    // Kiểm tra nếu maps API đã tải nhưng bị lỗi
    try {
      // Kiểm tra xem API đã hoạt động đúng bằng cách gọi một hàm bất kỳ
      if (!window.google.maps.Geocoder || !window.google.maps.Map) {
        console.error("Google Maps API tải không đúng hoặc bị lỗi");
        setMapError(true);
        return;
      }
    } catch (err) {
      console.error("Lỗi khi kiểm tra tính khả dụng của Google Maps API:", err);
      setMapError(true);
      return;
    }

    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
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
        } else {
          console.error("Không thể chuyển đổi địa chỉ thành tọa độ", status);
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
        }
      });
    } catch (error) {
      console.error("Lỗi khi thực hiện geocoding:", error);
      setMapError(true);
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
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        
        // Lấy userId của người dùng hiện tại
        const currentUserId = localStorage.getItem("userId");
        if (!currentUserId) {
          toast.error("Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại.");
          setTimeout(() => navigate("/dang-nhap"), 2000);
          setLoading(false);
          return;
        }
        
        const orderData = await getOrderById(orderId);
        
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
        
        setOrder(orderData);
        
        // Nếu đơn hàng có mã vận đơn thì lấy thông tin tracking
        if (orderData.orderCode) {
          fetchTrackingInfo(orderData.orderCode);
        }

        // Lấy thông tin địa chỉ khách hàng để hiển thị trên bản đồ
        if (orderData.userId && orderData.userId.address) {
          const fullAddress = `${orderData.userId.address}, ${orderData.userId.ward || ''}, ${orderData.userId.district || ''}, ${orderData.userId.province || ''}`;
          if (mapLoaded) {
            performGeocoding(fullAddress);
          } else {
            // Đặt địa chỉ vào state để sử dụng sau khi API đã tải
            setCustomerLocation({
              address: fullAddress,
              pending: true
            });
          }
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin đơn hàng:", error);
        toast.error("Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.");
        setTimeout(() => navigate("/tai-khoan/don-hang"), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, navigate, mapLoaded, performGeocoding]);

  const fetchTrackingInfo = async (orderCode) => {
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
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-10">
        <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Không tìm thấy đơn hàng</h2>
        <p className="text-gray-600 mb-6">Đơn hàng này không tồn tại hoặc đã bị xóa</p>
        <Link to="/tai-khoan/don-hang" className="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 transition-colors">
          Trở về danh sách đơn hàng
        </Link>
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
        return "Đang xử lý";
      case "paid":
        return "Đã thanh toán";
      case "completed":
        return "Hoàn thành";
      case "cancelled":
        return "Đã hủy";
      case "awaiting_payment":
        return "Chờ thanh toán";
      default:
        return status;
    }
  };

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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/tai-khoan/don-hang" className="flex items-center text-green-600 hover:text-green-700">
          <ChevronLeftIcon className="w-5 h-5" />
          <span>Quay lại</span>
        </Link>
        <ClipboardListIcon className="w-6 h-6 text-[#51bb1a]" />
        <h2 className="text-xl font-semibold text-gray-800 lg:text-2xl">
          Chi tiết đơn hàng #{order._id.slice(-6).toUpperCase()}
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Thông tin đơn hàng */}
        <div className="md:col-span-2">
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="bg-green-50 py-4 px-6 border-b border-green-100">
              <h3 className="text-lg font-semibold text-gray-800">Thông tin đơn hàng</h3>
            </div>
            <div className="px-6 py-4 space-y-4 text-sm flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="text-gray-600">Mã đơn hàng:</div>
                <div className="font-medium">#{order._id.slice(-6).toUpperCase()}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600">Ngày đặt:</div>
                <div>{formatDate(order.createdAt)}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600">Tổng tiền:</div>
                <div className="font-semibold text-lg">{formatCurrency(order.totalAmount)}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600">Trạng thái đơn hàng:</div>
                <div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600">Trạng thái thanh toán:</div>
                <div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
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
                <div className="text-gray-600">Phương thức thanh toán:</div>
                <div className="font-medium">
                  {order.paymentMethod === "cod" ? "Thanh toán khi nhận hàng" : 
                   order.paymentMethod === "bank_transfer" ? "Chuyển khoản ngân hàng" : 
                   order.paymentMethod}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600">Mã vận đơn:</div>
                <div className="flex items-center gap-2">
                  {!order.orderCode ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Chưa có mã vận đơn</span>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium">{order.orderCode}</span>
                      <button
                        onClick={toggleTracking}
                        className={`flex items-center gap-1 text-sm ${
                          showTracking 
                            ? "text-green-600 bg-green-50 hover:bg-green-100" 
                            : "text-blue-600 bg-blue-50 hover:bg-blue-100"
                        } px-2 py-1 rounded-full transition-colors`}
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span>{showTracking ? "Ẩn tiến trình" : "Xem tiến trình"}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Thêm phần bản đồ theo dõi đơn hàng */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="bg-green-50 py-4 px-6 border-b border-green-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Bản đồ theo dõi đơn hàng</h3>
              <div className="flex gap-2 items-center">
                {mapError && (
                  <button 
                    onClick={() => {
                      setMapError(null);
                      document.querySelector(`script[src*="maps.googleapis.com"]`)?.remove();
                      window.googleMapsLoadPromise = null;
                      window.location.reload();
                    }}
                    className="flex items-center gap-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Làm mới</span>
                  </button>
                )}
                <MapPinIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="p-4">
              {mapError && (
                <div className="map-error bg-red-50 border border-red-200 text-red-800 p-4 rounded-md my-4">
                  <h3 className="font-semibold mb-2">Không thể hiển thị bản đồ</h3>
                  <p>{mapError.message || "Có lỗi xảy ra khi tải Google Maps."}</p>
                  
                  {mapError.message && mapError.message.includes("ApiTargetBlockedMapError") && (
                    <div className="mt-2 text-sm">
                      <p className="font-semibold">Google Maps API đang bị chặn bởi trình duyệt hoặc add-on.</p>
                      <p>Vui lòng:</p>
                      <ul className="list-disc ml-5 mt-1">
                        <li>Tắt các trình chặn quảng cáo (Ad Blocker)</li>
                        <li>Cho phép JavaScript từ domain maps.googleapis.com</li>
                        <li>Sau đó làm mới trang</li>
                      </ul>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      setMapError(null);
                      document.querySelector(`script[src*="maps.googleapis.com"]`)?.remove();
                      window.googleMapsLoadPromise = null;
                      window.location.reload();
                    }}
                    className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm"
                  >
                    Thử lại
                  </button>
                </div>
              )}
              {!mapLoaded || !customerLocation || customerLocation.pending ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : (
                <div>
                  <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                    <div className="flex flex-col md:flex-row md:justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-green-600"></span>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-600">Xuất phát từ:</span>
                          <span className="font-medium text-sm">{SHOP_LOCATION.address}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-red-600"></span>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-600">Giao đến:</span>
                          <span className="font-medium text-sm">{customerLocation.address}</span>
                        </div>
                      </div>
                    </div>
                    <div id="map-info" className="mt-3 text-sm bg-white p-3 rounded shadow-sm"></div>
                  </div>
                  <div id="order-tracking-map" className="w-full h-64 md:h-96 rounded-lg border border-gray-200 shadow-md"></div>
                  <div className="mt-3 text-xs text-gray-500 flex items-start gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Đường đi được tính toán tự động và có thể khác với tuyến đường thực tế của đơn vị vận chuyển.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="bg-green-50 py-4 px-6 border-b border-green-100">
              <h3 className="text-lg font-semibold text-gray-800">Sản phẩm</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">Đơn giá</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.products.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded">
                            {item.productId?.productImages ? (
                              
                              <img 
                                src={item.productId.productImages[0]} 
                                alt={item.productId.productName} 
                                className="h-10 w-10 object-cover rounded" 
                              />
                            ) : (
                              <PackageIcon className="h-6 w-6 m-2 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.productId?.productName || "Sản phẩm không tồn tại"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-right text-sm font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="py-3 px-4 text-right text-sm font-medium text-gray-500">
                      Tổng cộng:
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-bold text-gray-900">
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
              className="bg-white shadow-md rounded-lg overflow-hidden mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-blue-50 py-4 px-6 border-b border-blue-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-blue-800">Tiến trình giao hàng</h3>
                <TruckIcon className="w-5 h-5 text-blue-600" />
              </div>
              
              <div className="px-6 py-4">
                {trackingLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : trackingError ? (
                  <div className="text-center py-6">
                    <XCircleIcon className="w-12 h-12 text-orange-500 mx-auto mb-2" />
                    <p className="text-gray-600">Không thể lấy thông tin vận chuyển</p>
                    <p className="text-sm text-gray-500 mt-2">Đơn hàng của bạn đang được xử lý</p>
                  </div>
                ) : !trackingInfo ? (
                  <div className="text-center py-6">
                    <ClockIcon className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                    <p className="text-gray-600">Đang chờ thông tin vận chuyển</p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6 py-4 px-5 bg-blue-50 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500">Trạng thái hiện tại</div>
                        <div className="font-medium text-blue-700 text-lg">{trackingInfo.status_name || "Đang vận chuyển"}</div>
                      </div>
                      {trackingInfo.estimated_delivery_time && (
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Dự kiến giao hàng</div>
                          <div className="font-medium text-blue-700">
                            {new Date(trackingInfo.estimated_delivery_time).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                      <MapPinIcon className="w-5 h-5 text-blue-500" />
                      Chi tiết hành trình
                    </h4>
                    
                    {trackingInfo.tracking_logs && trackingInfo.tracking_logs.length > 0 ? (
                      <div className="relative mb-6">
                        <div className="absolute top-0 bottom-0 left-[10px] w-0.5 bg-gray-200"></div>
                        <div className="space-y-6">
                          {trackingInfo.tracking_logs.map((log, index) => (
                            <motion.div 
                              key={index}
                              className="flex gap-4"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <div className={`h-5 w-5 rounded-full flex-shrink-0 mt-1.5 ${index === 0 ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                              <div className="pb-2">
                                <div className="text-sm font-medium text-gray-900">{log.status_name}</div>
                                <div className="text-xs text-gray-500">{formatDate(log.timestamp)}</div>
                                {log.location && (
                                  <div className="text-xs text-gray-600 mt-1 bg-gray-50 py-1 px-2 rounded">
                                    {log.location}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Chưa có thông tin vận chuyển</p>
                    )}

                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Lưu ý:</h5>
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
        <div className="md:col-span-1">
          {/* Thông tin giao hàng */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="bg-green-50 py-4 px-6 border-b border-green-100">
              <h3 className="text-lg font-semibold text-gray-800">Thông tin giao hàng</h3>
            </div>
            <div className="px-6 py-4 space-y-6 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600 ">Người nhận:</div>
                <div className="font-medium">{order.userId?.firstName + " " + order.userId?.lastName || "Không có thông tin"}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">Số điện thoại:</div>
                <div className="font-medium">{order.userId?.phone || "Không có thông tin"}</div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-sm text-gray-600 ">Địa chỉ giao hàng:</div>
                <div className="font-medium">
                  {order.userId?.address ? (
                    <span >
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
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600 ">Phương thức giao hàng:</div>
                <div className="font-medium">
                  {order.shippingInfo?.method === "standard" ? "Giao hàng tiêu chuẩn" : 
                   order.shippingInfo?.method === "express" ? "Giao hàng nhanh" : 
                   order.shippingInfo?.method || "Tiêu chuẩn"}
                </div>
              </div>
            </div>
          </div>

          {/* Theo dõi đơn hàng (dạng thu gọn) */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-green-50 py-4 px-6 border-b border-green-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Theo dõi đơn hàng</h3>
              <TruckIcon className="w-5 h-5 text-green-600" />
            </div>
            
            <div className="px-6 py-4">
              {!order.orderCode ? (
                <div className="text-center py-6">
                  <PackageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Đơn hàng chưa có mã vận đơn</p>
                </div>
              ) : trackingLoading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : trackingError ? (
                <div className="text-center py-6">
                  <ClockIcon className="w-12 h-12 text-orange-500 mx-auto mb-2" />
                  <p className="text-gray-600">Đơn hàng đang xử lý</p>
                </div> 
              ) : !trackingInfo ? (
                <div className="text-center py-6">
                  <ClockIcon className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                  <p className="text-gray-600">Đang chờ thông tin vận chuyển</p>
                </div>
              ) : (
                <div>
                  <div className="mb-4 py-3 px-4 bg-blue-50 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Trạng thái</div>
                      <div className="font-medium text-blue-700">{trackingInfo.status_name || "Đang vận chuyển"}</div>
                    </div>
                    {trackingInfo.estimated_delivery_time && (
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Dự kiến giao</div>
                        <div className="font-medium text-blue-700">
                          {new Date(trackingInfo.estimated_delivery_time).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <h4 className="font-medium text-gray-800 mb-3">Lịch sử vận chuyển</h4>
                  
                  {trackingInfo.tracking_logs && trackingInfo.tracking_logs.length > 0 ? (
                    <div className="relative">
                      <div className="absolute top-0 bottom-0 left-[10px] w-0.5 bg-gray-200"></div>
                      <div className="space-y-4">
                        {/* Chỉ hiện thị 3 cập nhật gần nhất */}
                        {trackingInfo.tracking_logs.slice(0, 3).map((log, index) => (
                          <motion.div 
                            key={index}
                            className="flex gap-3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className={`h-5 w-5 rounded-full flex-shrink-0 mt-1.5 ${index === 0 ? 'bg-green-500' : 'bg-blue-400'}`}></div>
                            <div className="pb-2">
                              <div className="text-sm font-medium">{log.status_name}</div>
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
                    <p className="text-gray-500 text-sm">Chưa có thông tin vận chuyển</p>
                  )}

                  {trackingInfo.tracking_logs && trackingInfo.tracking_logs.length > 3 && (
                    <div className="mt-3 text-center">
                      <button
                        onClick={toggleTracking}
                        className="text-blue-600 text-sm hover:text-blue-800"
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