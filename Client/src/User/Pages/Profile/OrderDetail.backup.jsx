/* eslint-disable react-hooks/exhaustive-deps */
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
import { 
  geocodeAddressDebounced,
  SHOP_LOCATION
} from './OrderDetail/MapUtils';
import { OrderTrackingMap } from './OrderDetail/MapComponents';
import { BiLoaderAlt } from 'react-icons/bi';

// Mapbox access token
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || import.meta.env.VITE_MAPBOX_KEY;
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
  const [mapError, setMapError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  // Tham chiếu đến hàm geocoding để có thể gọi từ useEffect
  const geocodingFnRef = useRef(null);
  
  // Sử dụng hook đơn giản để tải Google Maps API
  const { isLoaded: mapboxLoaded, loadError } = useMapbox();
  
  // Define setDefaultLocation before performGeocoding
  const setDefaultLocation = useCallback((address) => {
    if (!address) return;
    
    console.log("Using default location fallback for address:", address);
    
    // Fallback to default location with error flag
    setCustomerLocation({
      lat: 10.0452, // Default to a location in Vietnam
      lng: 105.7469,
      displayName: address,
      error: true,
      errorMessage: "Không thể tìm tọa độ chính xác cho địa chỉ này",
      address: address,
      pending: false,
      initialized: true
    });
    
    // Show a warning toast
    toast.warning("Không thể tìm tọa độ chính xác cho địa chỉ giao hàng");
  }, []);
  
  // Implement the missing performGeocoding function
  const performGeocoding = useCallback((address, callback) => {
    if (!address) {
      console.error("Cannot perform geocoding: No address provided");
      return;
    }
    
    console.log("Performing geocoding for address:", address);
    
    // Use geocodeAddressDebounced from MapUtils
    geocodeAddressDebounced(address, (result) => {
      if (result && !result.error) {
        console.log("Geocoding successful:", result);
        
        const locationData = {
          ...result,
          address: address,
          pending: false,
          initialized: true,
          geocoded: true
        };
        
        setCustomerLocation(locationData);
        
        // Call the callback if provided
        if (typeof callback === 'function') {
          callback(result);
        }
      } else {
        console.error("Geocoding failed:", result?.errorMessage || "Unknown error");
        setDefaultLocation(address);
        
        // Call the callback with error if provided
        if (typeof callback === 'function') {
          callback(result || { error: true, errorMessage: "Geocoding failed" });
        }
      }
    });
  }, [setCustomerLocation, setDefaultLocation]);
  
  // Hàm để lấy địa chỉ giao hàng từ đơn hàng - ưu tiên địa chỉ giao hàng theo thứ tự
  const getOrderShippingAddress = useCallback((order) => {
    if (!order) return "Không có thông tin địa chỉ";
    
    if (order.shippingAddress) {
      console.log("Sử dụng shippingAddress:", order.shippingAddress);
      return order.shippingAddress;
    }
    
    if (order.shippingInfo && order.shippingInfo.address) {
      console.log("Sử dụng shippingInfo.address:", order.shippingInfo.address);
      return order.shippingInfo.address;
    }
    
    if (order.shipping && order.shipping.address) {
      console.log("Sử dụng shipping.address:", order.shipping.address);
      return order.shipping.address;
    }
    
    if (order.userId) {
      // Xây dựng địa chỉ từ các thành phần của userId
      const addressParts = [];
      if (order.userId.houseNumber) addressParts.push(order.userId.houseNumber);
      if (order.userId.address) addressParts.push(order.userId.address);
      if (order.userId.hamlet) addressParts.push(order.userId.hamlet);
      if (order.userId.ward) addressParts.push(order.userId.ward);
      if (order.userId.district) addressParts.push(order.userId.district);
      if (order.userId.province) addressParts.push(order.userId.province);
      
      const fullUserAddress = addressParts.filter(Boolean).join(", ");
      console.log("Sử dụng địa chỉ được tạo từ userId:", fullUserAddress);
      return fullUserAddress;
    }
    
    return "Không có thông tin địa chỉ";
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
  
  // Hàm tạo đường thẳng giữa 2 điểm (fallback)
  const createStraightLine = useCallback((map, customerCoords, distanceStraightLine) => {
    console.log("Creating straight line between shop and customer");
    
    // Check if layer already exists and remove it
    if (map.getLayer('route-layer')) {
      map.removeLayer('route-layer');
    }
    
    if (map.getSource('route')) {
      map.removeSource('route');
    }
    
    // Thêm đường thẳng giữa 2 điểm
    map.addSource('route', {
      'type': 'geojson',
      'data': {
        'type': 'Feature',
        'properties': {},
        'geometry': {
          'type': 'LineString',
          'coordinates': [
            [SHOP_LOCATION.lng, SHOP_LOCATION.lat],
            [customerCoords.lng, customerCoords.lat]
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
    
    // Create a bounds that includes both points
    const bounds = new mapboxgl.LngLatBounds()
      .extend([SHOP_LOCATION.lng, SHOP_LOCATION.lat])
      .extend([customerCoords.lng, customerCoords.lat]);
    
    // Fit the map to the bounds with some padding
    map.fitBounds(bounds, { 
      padding: { top: 60, bottom: 60, left: 60, right: 60 },
      maxZoom: 15 // Don't zoom in too much
    });
    
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
  }, []);
  
  // Hàm thêm markers và route line vào map
  const addMapMarkers = useCallback((map, location) => {
    if (!location && (!customerLocation || !customerLocation.lat || !customerLocation.lng)) {
      console.error("Missing customer location coordinates for markers");
      return;
    }
    
    // Use provided location or fall back to customerLocation state
    const customerCoords = location || customerLocation;
    
    console.log("Adding markers for shop and customer locations", {
      shop: SHOP_LOCATION,
      customer: customerCoords
    });
    
    // Clear any existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());
    
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
            <div style="padding: 8px;">
              <div style="font-weight: bold; font-size: 14px;">${SHOP_LOCATION.address}</div>
              <div style="font-size: 12px; color: #388e3c; margin-top: 4px;">Địa điểm xuất hàng</div>
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
    const displayAddress = customerCoords.address || "Địa chỉ không xác định";
          
          // Thêm marker khách hàng với popup
          new mapboxgl.Marker({ element: customerEl, color: '#ff0000' })
      .setLngLat([customerCoords.lng, customerCoords.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
            <div style="padding: 8px;">
              <div style="font-weight: bold; font-size: 14px;">Địa chỉ giao hàng</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">${displayAddress}</div>
                  </div>
                `)
            )
            .addTo(map);
          
          // Tính khoảng cách theo đường chim bay giữa shop và khách hàng
          const distanceStraightLine = calculateDistance(
            SHOP_LOCATION.lat, SHOP_LOCATION.lng,
      customerCoords.lat, customerCoords.lng
    );
    
    console.log(`Distance between shop and customer: ${distanceStraightLine.toFixed(2)}km`);
    
    // Make sure to remove any existing layers and sources
    if (map.getLayer('route-layer')) {
      map.removeLayer('route-layer');
    }
    
    if (map.getSource('route')) {
      map.removeSource('route');
    }
    
    // First fit bounds to include both points with padding
    const bounds = new mapboxgl.LngLatBounds()
      .extend([SHOP_LOCATION.lng, SHOP_LOCATION.lat])
      .extend([customerCoords.lng, customerCoords.lat]);
    
    map.fitBounds(bounds, {
      padding: { top: 80, bottom: 80, left: 80, right: 80 },
      maxZoom: 14
    });
    
    // Show loading indicator in info div
    const infoDiv = document.getElementById('map-info');
    if (infoDiv) {
      infoDiv.innerHTML = `
        <div class="flex justify-center items-center gap-2 py-1">
          <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
          <span class="text-sm text-gray-600">Đang tải đường đi từ <b>${SHOP_LOCATION.address}</b> đến <b>${displayAddress}</b>...</span>
        </div>
      `;
    }
    
    // Make the directions API request
    const directionsRequest = `https://api.mapbox.com/directions/v5/mapbox/driving/${SHOP_LOCATION.lng},${SHOP_LOCATION.lat};${customerCoords.lng},${customerCoords.lat}?steps=true&geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;
    
    console.log("Requesting route from Mapbox Directions API for driving route");
    
    // Fetch the route data
            fetch(directionsRequest)
              .then(response => {
                if (!response.ok) throw new Error('Không thể lấy dữ liệu đường đi');
                return response.json();
              })
              .then(data => {
        console.log("Route API response:", data);
                
                if (data.routes && data.routes.length > 0) {
                  const route = data.routes[0];
                  const routeDistance = route.distance / 1000; // Chuyển từ m sang km
          
          // Sửa tốc độ trung bình từ "theo giây thực tế" sang "tốc độ trung bình 30km/h"
          // Do thời gian từ API có thể không chính xác cho VN
          const routeDuration = Math.ceil(routeDistance / 30 * 60); // Tính dựa trên 30km/h
          
          console.log("Route data processed:", {
                    distance: routeDistance,
                    duration: routeDuration,
                    geometry: route.geometry
                  });
                  
          // Add the route as a new source
          if (!map.getSource('route')) {
                  map.addSource('route', {
                    'type': 'geojson',
                    'data': {
                      'type': 'Feature',
                      'properties': {},
                      'geometry': route.geometry
                    }
                  });
          } else {
            // Update the source if it already exists
            map.getSource('route').setData({
              'type': 'Feature',
              'properties': {},
              'geometry': route.geometry
            });
          }
          
          // Add the route layer if it doesn't exist
          if (!map.getLayer('route-layer')) {
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
                'line-width': 5,
                'line-opacity': 0.8
              }
            });
          }
          
          // Re-fit the bounds to the route
          const coordinates = route.geometry.coordinates;
          
          if (coordinates && coordinates.length > 0) {
            const routeBounds = coordinates.reduce((bounds, coord) => {
              return bounds.extend(coord);
            }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
            
            map.fitBounds(routeBounds, {
              padding: { top: 80, bottom: 80, left: 80, right: 80 },
              maxZoom: 14
            });
          }
          
          // Update the info div
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
                } else {
          console.error("No route data returned from API, using straight line");
          createStraightLine(map, customerCoords, distanceStraightLine);
                }
              })
              .catch(error => {
        console.error("Error fetching route:", error);
        // Fall back to straight line
        createStraightLine(map, customerCoords, distanceStraightLine);
      });
  }, [customerLocation, calculateDistance, createStraightLine]);

  // Khai báo các hàm xử lý map trước khi được sử dụng
  const initMap = useCallback(() => {
    try {
      console.log("Initializing map with token:", mapboxgl.accessToken ? "Token exists" : "Missing token");
      console.log("Window orderTrackingMap:", window.orderTrackingMap ? "exists" : "doesn't exist");
      
      if (window.orderTrackingMap) {
        console.log("Map already initialized, returning existing instance");
        return window.orderTrackingMap;
      }
      
      // Make sure we have the map container
      const mapContainer = document.getElementById('order-tracking-map');
      if (!mapContainer) {
        console.error("Map container not found when initializing map");
        
        // Try to create it if the parent exists
        const mapContainerParent = document.getElementById('map-container');
        if (!mapContainerParent) {
          console.error("Map container parent also not found");
          setMapError(true);
          
          // Let's attempt to force render the map container
          setTimeout(() => {
            const app = document.getElementById('root') || document.querySelector('.App');
            if (app) {
              console.log("Found app container, will try to force re-render");
              const event = new Event('resize');
              window.dispatchEvent(event);
            }
          }, 500);
          
          return null;
        }
        
        // Create the map container
        console.log("Creating new map container in parent");
        const newContainer = document.createElement('div');
        newContainer.id = 'order-tracking-map';
        newContainer.className = 'absolute inset-0';
        newContainer.style.width = '100%';
        newContainer.style.height = '100%';
        newContainer.style.minHeight = '300px';
        mapContainerParent.appendChild(newContainer);
        
        // Try again after DOM update
        setTimeout(() => {
          try {
            console.log("Retrying map initialization after creating container");
            initMap();
          } catch (err) {
            console.error("Error in delayed map initialization:", err);
            setMapError(true);
          }
        }, 100);
        
        return null;
      }
      
      // Center of Vietnam with appropriate zoom level
      const defaultCenter = [105.85, 16.45]; // Roughly center of Vietnam
      const defaultZoom = 5.5; // Zoom level to see most of Vietnam
      
      // Make sure accessToken is set
      mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
      
      console.log("Creating new map instance with container:", mapContainer.id);
      console.log("Mapbox GL initialized with token:", mapboxgl.accessToken.substring(0, 5) + "...");
      
      // Create the map instance
      const map = new mapboxgl.Map({
        container: mapContainer,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: defaultCenter,
        zoom: defaultZoom,
        minZoom: 4,
        maxZoom: 18,
        attributionControl: false,
        logoPosition: 'bottom-left'
      });
      
      // Add controls
      map.addControl(new mapboxgl.NavigationControl({ 
        showCompass: true,
        visualizePitch: true
      }), 'top-right');
      
      map.addControl(new mapboxgl.AttributionControl({
        compact: true,
        customAttribution: 'Bản đồ © Mapbox & OpenStreetMap',
      }), 'bottom-left');
      
      // Add fullscreen control for better map interactions
      map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      
      // Update map info element
      const mapInfoElement = document.getElementById('map-info');
      if (mapInfoElement) {
        mapInfoElement.innerHTML = '<div class="text-center text-sm text-gray-600 font-medium">Đang tải bản đồ...</div>';
      }
      
      // Store map instance for later use
      window.orderTrackingMap = map;
      
      // Handle map load event
      map.on('load', () => {
        console.log("Map loaded successfully");
        setMapLoaded(true);
        
        // Add markers when we have customer coordinates
        if (customerLocation && customerLocation.lat && customerLocation.lng) {
          console.log("Adding markers on map load");
          addMapMarkers(map);
        } else {
          console.log("No customer location available for markers");
        }
      });
      
      // Handle map error
      map.on('error', (e) => {
        console.error("Map error:", e);
        setMapError(true);
      });
      
      return map;
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError(true);
      return null;
    }
  }, [customerLocation, addMapMarkers, setMapLoaded, setMapError]);

  // Hàm đặt vị trí mặc định khi gặp lỗi (đã di chuyển xuống dưới để tránh circular dependency)
  const setDefaultLocation = useCallback((address) => {
    console.log("Không thể xác định tọa độ cho địa chỉ:", address);
    
    // Cập nhật customerLocation với trạng thái lỗi và hiển thị thông báo
    const errorLocation = {
      error: true,
      errorMessage: "Không thể xác định tọa độ của địa chỉ giao hàng",
      address: address || "Địa chỉ không xác định",
      pending: false,
      initialized: true
    };
    
    setCustomerLocation(errorLocation);
    setMapError(true);
    
    // Hiển thị thông báo lỗi
    toast.error("Không thể xác định vị trí của địa chỉ giao hàng trên bản đồ");
    
    // Đảm bảo infoDiv tồn tại trước khi cập nhật
    setTimeout(() => {
      const infoDiv = document.getElementById('map-info');
      if (infoDiv) {
        infoDiv.innerHTML = `
          <div class="p-2 text-center text-red-500 text-sm">
            <p>Không thể xác định tọa độ cho địa chỉ: ${address}</p>
            <p class="text-xs mt-1">Vui lòng kiểm tra lại địa chỉ giao hàng</p>
          </div>
        `;
      }
    }, 100);
  }, []);
  
  // Trong useEffect cho việc xử lý khi order được tải

  // Thêm biến để track request geocoding và khởi tạo bản đồ
  const [geocodingRequested, setGeocodingRequested] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Sửa useEffect để giảm số lần gọi API và tối ưu việc tải bản đồ
  useEffect(() => {
    if (order && !customerLocation?.initialized && !geocodingRequested) {
      console.log("Đang xử lý thông tin vị trí giao hàng từ order:", order._id);
      
      // Lấy thông tin địa chỉ đầy đủ khách hàng để hiển thị trên bản đồ
      const fullAddress = getOrderShippingAddress(order);
      console.log("Địa chỉ đầy đủ chi tiết khách hàng FINAL:", fullAddress);
      
      // Đánh dấu đã yêu cầu geocoding để tránh gọi lại nhiều lần
      setGeocodingRequested(true);
      
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
        if (!mapInitialized) {
          setTimeout(() => {
            try {
              console.log("Khởi tạo bản đồ với tọa độ từ database:", customerLocationData);
              initMap(customerLocationData);
              setMapInitialized(true);
            } catch (err) {
              console.error("Lỗi khi khởi tạo bản đồ với tọa độ từ database:", err);
              setMapError(true);
            }
          }, 500);
        }
      } else {
        // Kiểm tra cache trước khi thực hiện geocoding mới
        try {
          // Thử đọc cache từ localStorage
          const geocodingCache = JSON.parse(localStorage.getItem('geocoding_cache') || '{}');
          const addressKey = fullAddress.trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, '_');
          
          if (geocodingCache[addressKey]) {
            const cachedResult = geocodingCache[addressKey];
            
            console.log("Sử dụng kết quả geocoding từ cache cho địa chỉ:", fullAddress);
            
            const customerLocationData = {
              ...cachedResult,
              address: fullAddress,
              pending: false,
              initialized: true,
              geocoded: true,
              source: 'cache'
            };
                
            setCustomerLocation(customerLocationData);
                
            // Khởi tạo bản đồ với dữ liệu từ cache
            if (!mapInitialized) {
              setTimeout(() => {
                try {
                  console.log("Khởi tạo bản đồ với tọa độ từ cache:", customerLocationData);
                  initMap(customerLocationData);
                  setMapInitialized(true);
                } catch (err) {
                  console.error("Lỗi khi khởi tạo bản đồ với tọa độ từ cache:", err);
                  setMapError(true);
                }
              }, 500);
            }
            
            return; // Thoát khỏi useEffect, không cần geocoding
          }
        } catch (error) {
          console.warn("Lỗi khi đọc cache geocoding:", error);
        }
        
        // Nếu không có tọa độ từ database hoặc cache và chưa yêu cầu geocoding
        console.log("Không có tọa độ từ database hoặc cache, thực hiện geocoding cho địa chỉ:", fullAddress);
        
        // Khởi tạo customer location với địa chỉ đầy đủ, pending=true để trigger geocoding
        const pendingLocation = {
          address: fullAddress,
          pending: true,
          initialized: false
        };
        
        setCustomerLocation(pendingLocation);
        
        // Thực hiện geocoding
        if (mapboxLoaded && geocodingFnRef.current) {
          console.log("Map đã sẵn sàng, thực hiện geocoding");
          
          geocodingFnRef.current(fullAddress, (result) => {
            if (result && !result.error) {
              const locationData = {
                ...result,
                address: fullAddress,
                pending: false,
                initialized: true,
                geocoded: true
              };
              
              setCustomerLocation(locationData);
              
              // Khởi tạo bản đồ sau khi có tọa độ
              if (!mapInitialized) {
                setTimeout(() => {
                  try {
                    console.log("Khởi tạo bản đồ với tọa độ từ geocoding:", locationData);
                    initMap(locationData);
                    setMapInitialized(true);
                  } catch (err) {
                    console.error("Lỗi khi khởi tạo bản đồ sau geocoding:", err);
                    setMapError(true);
                  }
                }, 100);
              }
            } else {
              console.error("Lỗi geocoding:", result?.errorMessage || "Không xác định");
              setDefaultLocation(fullAddress);
            }
          }, 1000);
        } else {
          performGeocoding(fullAddress);
        }
      }
    }
  }, [order, customerLocation?.initialized, initMap, mapboxLoaded, setCustomerLocation, setMapError, performGeocoding, getOrderShippingAddress, geocodingRequested, mapInitialized]);

  // Theo dõi khi mapLoaded thay đổi để thực hiện geocoding
  useEffect(() => {
    // Đảm bảo chỉ thực hiện geocoding một lần cho mỗi địa chỉ
    if (mapLoaded && customerLocation?.pending && customerLocation?.address && 
        !customerLocation?.geocoded && !geocodingRequested) {
      try {
        console.log("Thực hiện geocoding địa chỉ khách hàng:", customerLocation.address);
        
        // Đánh dấu đã thực hiện geocoding request
        setGeocodingRequested(true);
        
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
  }, [mapLoaded, customerLocation, setDefaultLocation, geocodingRequested]);
  
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
            
            // Không gán tọa độ cứng, chỉ đặt địa chỉ và trạng thái pending để trigger geocoding
            setCustomerLocation({
              address: fullAddress,
              pending: true,
              initialized: false
            });
          } else {
            console.log("Không tìm thấy địa chỉ khách hàng trong đơn hàng");
            // Hiển thị thông báo lỗi thay vì sử dụng tọa độ mặc định
            setCustomerLocation({
              error: true,
              errorMessage: "Không tìm thấy thông tin địa chỉ khách hàng",
              address: "Không có thông tin địa chỉ",
              pending: false,
              initialized: true
            });
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
        newMapDiv.style.minHeight = '300px';
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

  // Thêm log để hiển thị thông tin địa chỉ trong đơn hàng
  useEffect(() => {
    if (order) {
      console.log("Thông tin địa chỉ trong đơn hàng:", {
        shippingAddress: order?.shippingAddress,
        shippingInfoAddress: order?.shippingInfo?.address,
        shippingAddress2: order?.shipping?.address,
        userAddress: order?.userId?.address
      });
    }
  }, [order]);

  // Tạo useEffect mới để debug việc lấy địa chỉ
  useEffect(() => {
    if (order) {
      console.log("========== DEBUG ĐỊA CHỈ GIAO HÀNG ==========");
      console.log("Order ID:", order._id);
      console.log("1. shippingAddress:", order.shippingAddress);
      console.log("2. shipping.address:", order.shipping?.address);
      console.log("3. shippingInfo.address:", order.shippingInfo?.address);
      
      if (order.userId && typeof order.userId === 'object') {
        console.log("4. userId.address:", order.userId.address);
        console.log("5. userId.fullAddress:", order.userId.fullAddress);
        console.log("6. Các thành phần địa chỉ:");
        console.log("   - houseNumber:", order.userId.houseNumber);
        console.log("   - hamlet:", order.userId.hamlet);
        console.log("   - ward:", order.userId.ward);
        console.log("   - district:", order.userId.district);
        console.log("   - province:", order.userId.province);
      }
      
      // Lấy địa chỉ cuối cùng được sử dụng
      const finalAddress = getOrderShippingAddress(order);
      console.log("Địa chỉ CUỐI CÙNG được sử dụng:", finalAddress);
      console.log("==========================================");
    }
  }, [order, getOrderShippingAddress]);

  // Lưu hàm geocoding vào ref để có thể gọi từ useEffect
  useEffect(() => {
    geocodingFnRef.current = performGeocoding;
  }, [performGeocoding]);

  // Add this useEffect to make sure the map container exists
  useEffect(() => {
    // Create the map container if it doesn't exist
    let mapContainer = document.getElementById('order-tracking-map');
    if (!mapContainer) {
      const mapContainerParent = document.getElementById('map-container');
      if (mapContainerParent) {
        console.log("Tạo map container từ useEffect");
        mapContainer = document.createElement('div');
        mapContainer.id = 'order-tracking-map';
        mapContainer.style.width = '100%';
        mapContainer.style.height = '100%';
        mapContainer.style.minHeight = '300px';
        mapContainerParent.appendChild(mapContainer);
      }
    }
  }, []);

  // Modify useEffect for map initialization
  useEffect(() => {
    // Create the map container if it doesn't exist
    const setupMapContainer = () => {
      let mapContainer = document.getElementById('order-tracking-map');
      if (!mapContainer) {
        const mapContainerParent = document.getElementById('map-container');
        if (mapContainerParent) {
          console.log("Tạo map container từ useEffect");
          mapContainer = document.createElement('div');
          mapContainer.id = 'order-tracking-map';
          mapContainer.style.width = '100%';
          mapContainer.style.height = '100%';
          mapContainer.style.minHeight = '300px';
          mapContainerParent.appendChild(mapContainer);
          return true;
        }
      } else {
        return true;
      }
      return false;
    };

    // Delay execution to ensure DOM is ready
    const timer = setTimeout(() => {
      if (setupMapContainer() && customerLocation && !mapError && mapLoaded) {
        console.log("Auto initializing map from useEffect");
        initMap(customerLocation);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [customerLocation, mapError, mapLoaded, initMap]);

  // Tạo useEffect mới để khởi tạo map container và geocoding khi component mount
  useEffect(() => {
    // Create the map container if it doesn't exist
    const setupMapContainer = () => {
      console.log("Running setupMapContainer");
      const mapContainer = document.getElementById('order-tracking-map');
      if (!mapContainer) {
        const mapContainerParent = document.getElementById('map-container');
        if (mapContainerParent) {
          console.log("Creating map container element");
          const newMapContainer = document.createElement('div');
          newMapContainer.id = 'order-tracking-map';
          newMapContainer.style.width = '100%';
          newMapContainer.style.height = '100%';
          newMapContainer.style.minHeight = '300px';
          mapContainerParent.appendChild(newMapContainer);
        } else {
          console.warn("Map container parent not found");
        }
      } else {
        console.log("Map container already exists");
      }
    };

    // This handles the case when the DOM loads after React renders the component
    const timer = setTimeout(() => {
      setupMapContainer();
    }, 300);

    // Initialize on first load
    setupMapContainer();

    // Clean up function
    return () => {
      clearTimeout(timer);
      
      // Clear any existing map instances to prevent duplicate maps
      if (window.mapInstance) {
        try {
          window.mapInstance.remove();
        } catch (e) {
          console.error("Error when removing map instance:", e);
        }
        window.mapInstance = null;
        window.__map_initialized = false;
      }
    };
  }, []);

  // Cải thiện useEffect cho việc khởi tạo map container
  useEffect(() => {
    console.log("Running map container initialization effect");
    
    const ensureMapContainer = () => {
      // First check if the map-container exists
      const mapContainerParent = document.getElementById('map-container');
      
      if (mapContainerParent) {
        console.log("Map container parent found:", mapContainerParent);
        
        // Now check if the map div exists inside it
        let mapDiv = document.getElementById('order-tracking-map');
        
        if (!mapDiv) {
          console.log("Creating new map container");
          mapDiv = document.createElement('div');
          mapDiv.id = 'order-tracking-map';
          mapDiv.className = 'absolute inset-0';
          mapDiv.style.width = '100%';
          mapDiv.style.height = '100%';
          mapDiv.style.minHeight = '300px';
          mapDiv.style.borderRadius = '6px';
          mapDiv.style.overflow = 'hidden';
          mapContainerParent.appendChild(mapDiv);
          
          // Add a clear loading indicator
          const loadingEl = document.createElement('div');
          loadingEl.className = 'map-loading-indicator';
          loadingEl.style.position = 'absolute';
          loadingEl.style.top = '50%';
          loadingEl.style.left = '50%';
          loadingEl.style.transform = 'translate(-50%, -50%)';
          loadingEl.style.backgroundColor = 'rgba(255,255,255,0.8)';
          loadingEl.style.padding = '10px 15px';
          loadingEl.style.borderRadius = '8px';
          loadingEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          loadingEl.style.fontSize = '14px';
          loadingEl.style.color = '#333';
          loadingEl.style.zIndex = '500';
          loadingEl.innerHTML = '<div>Đang tải bản đồ...</div>';
          mapDiv.appendChild(loadingEl);
        }
        
        return true;
      }
      
      console.error("Map container parent not found");
      return false;
    };
    
    // We'll use a timeout instead of an interval to avoid continuously trying
    // if the element never appears
    let retryCount = 0;
    const maxRetries = 3;
    
    const attemptSetup = () => {
      if (retryCount >= maxRetries) {
        console.error(`Failed to find map container after ${maxRetries} attempts`);
        setMapError(true);
        return;
      }
      
      if (!ensureMapContainer()) {
        console.log(`Attempt ${retryCount + 1} failed, trying again in ${500 * (retryCount + 1)}ms`);
        retryCount++;
        setTimeout(attemptSetup, 500 * retryCount);
      } else if (customerLocation && mapboxLoaded && !window.orderTrackingMap) {
        console.log("Container ready and we have customer location, initializing map");
        initMap();
      }
    };
    
    // Start the attempt process
    attemptSetup();
    
    // No cleanup needed since we're using timeouts, not intervals
  }, [customerLocation, mapboxLoaded, initMap, setMapError]);

  // Cải thiện việc cập nhật customerLocation và khởi tạo map
  useEffect(() => {
    if (customerLocation && mapLoaded && !window.__map_initialized) {
      console.log("Customer location available and map loaded, initializing map", customerLocation);
      setTimeout(() => {
        try {
          initMap(customerLocation);
        } catch (err) {
          console.error("Error initializing map:", err);
          setMapError(true);
        }
      }, 1000); // Delay to ensure DOM is ready
    }
  }, [customerLocation, mapLoaded, initMap, setMapError]);

  // Add CSS styles to make the map markers more visible and improve the map container element
  useEffect(() => {
    // Create map container CSS
    const injectCustomStyles = () => {
      // Check if styles already exist
      if (document.getElementById('mapbox-custom-styles')) {
        return;
      }
      
      // Create style element
      const styleEl = document.createElement('style');
      styleEl.id = 'mapbox-custom-styles';
      styleEl.textContent = `
        .shop-marker {
          width: 36px !important;
          height: 36px !important;
          background-size: cover;
          cursor: pointer;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        
        .customer-marker {
          width: 36px !important;
          height: 36px !important;
          background-size: cover;
          cursor: pointer;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        
        .mapboxgl-popup-content {
          padding: 10px !important;
          border-radius: 8px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
        }
        
        #order-tracking-map {
          border-radius: 4px;
          overflow: hidden;
        }
        
        #map-info {
          font-size: 13px;
        }
      `;
      
      // Add to head
      document.head.appendChild(styleEl);
      console.log("Injected custom map styles");
    };
    
    // Inject CSS
    injectCustomStyles();
    
    // Cleanup function
    return () => {
      const styleEl = document.getElementById('mapbox-custom-styles');
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, []);

  // Add new useEffect for mapbox validation
  useEffect(() => {
    // Ensure mapboxgl is supported by the browser
    try {
      if (!mapboxgl.supported()) {
        console.error("Mapbox GL không được hỗ trợ bởi trình duyệt này");
        setMapError(true);
        toast.error("Trình duyệt của bạn không hỗ trợ Mapbox. Vui lòng sử dụng trình duyệt khác.");
      }
    } catch (err) {
      console.error("Error checking Mapbox support:", err);
      setMapError(true);
    }
    
    // Verify Mapbox token
    if (!mapboxgl.accessToken) {
      console.error("Mapbox access token is missing");
      setMapError(true);
      toast.error("Thiếu token Mapbox. Vui lòng kiểm tra cấu hình.");
    } else {
      console.log("Mapbox token available:", mapboxgl.accessToken.substring(0, 8) + "...");
    }
  }, []);

  // Add this useEffect at the beginning of the component to ensure map container exists
  useEffect(() => {
    const ensureMapContainerExists = () => {
      console.log("Ensuring map container exists");
      
      // Check for map container parent - look for the container where we want to render the map
      const mapSection = document.getElementById('order-map-section');
      
      if (mapSection) {
        // Find or create the container for the aspect-video div
        let mapContainer = mapSection.querySelector('.aspect-video');
        
        if (!mapContainer) {
          console.log("Creating map container element (aspect-video)");
          mapContainer = document.createElement('div');
          mapContainer.className = 'aspect-video w-full relative border border-gray-200 rounded-lg overflow-hidden';
          
          // Find where to insert it - after the heading
          const heading = mapSection.querySelector('h3');
          if (heading) {
            heading.insertAdjacentElement('afterend', mapContainer);
          } else {
            mapSection.appendChild(mapContainer);
          }
        }
        
        // Check for the order-tracking-map div inside the aspect-video div
        let mapElement = document.getElementById('order-tracking-map');
        
        if (!mapElement) {
          console.log("Creating map element (order-tracking-map)");
          mapElement = document.createElement('div');
          mapElement.id = 'order-tracking-map';
          mapElement.className = 'absolute inset-0';
          mapElement.style.width = '100%';
          mapElement.style.height = '100%';
          mapElement.style.minHeight = '300px';
          mapContainer.appendChild(mapElement);
          
          // Add loading indicator inside map element
          const loadingIndicator = document.createElement('div');
          loadingIndicator.className = 'absolute inset-0 flex items-center justify-center bg-gray-100';
          loadingIndicator.innerHTML = `
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          `;
          mapElement.appendChild(loadingIndicator);
        }
      }
    };
    
    // Run immediately and after a short delay to ensure DOM is ready
    ensureMapContainerExists();
    const timer = setTimeout(ensureMapContainerExists, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Simplified OrderMapSection component that handles map rendering
  const OrderMapSection = () => {
    // Get delivery address from order detail
    const deliveryAddress = order?.shippingInfo?.address || 
                           order?.shipping?.address || 
                           order?.deliveryAddress ||
                           "Địa chỉ giao hàng";
    
    return (
      <div id="order-map-section" className="border rounded-lg p-4 bg-white">
        <h3 className="font-medium text-lg mb-3">Bản đồ đường đi giao hàng</h3>
        
        {!customerLocation || !customerLocation.lat || !customerLocation.lng ? (
          // Show placeholder if no coordinates are available
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-orange-500 font-medium mb-2">Đang tìm tọa độ địa chỉ giao hàng</div>
            <div className="text-sm text-gray-600">Vui lòng đợi trong giây lát...</div>
            <div className="mt-3 flex justify-center">
              <BiLoaderAlt className="animate-spin text-orange-500" size={24} />
            </div>
          </div>
        ) : customerLocation.error ? (
          // Show error message if geocoding failed
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-red-500 font-medium mb-2">{customerLocation.errorMessage || "Không thể xác định tọa độ"}</div>
            <div className="text-sm text-gray-600">Không thể hiển thị bản đồ cho địa chỉ này.</div>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(deliveryAddress || "")}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-2 inline-block text-blue-500 underline text-sm"
            >
              Tìm địa chỉ trên Google Maps
            </a>
          </div>
        ) : (
          <div>
            {/* Map information and route details */}
            <div id="map-info" className="mb-3 text-sm p-3 bg-gray-50 rounded-md border border-gray-200">
              <div className="text-center text-gray-500">
                <span className="inline-block align-middle mr-2">
                  <BiLoaderAlt className="animate-spin text-blue-500" size={18} />
                </span>
                Đang tải thông tin bản đồ...
              </div>
            </div>
            
            {/* Container for the map */}
            <div className="aspect-video w-full relative border border-gray-200 rounded-lg overflow-hidden" id="map-container">
              <OrderTrackingMap 
                customerLocation={{
                  ...customerLocation,
                  address: deliveryAddress
                }}
                shopLocation={SHOP_LOCATION}
              />
            </div>
          </div>
        )}
      </div>
    );
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
              <OrderMapSection />
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
                  {order.shippingAddress ? (
                    <span className="text-xs sm:text-sm">{order.shippingAddress}</span>
                  ) : order.shipping && order.shipping.address ? (
                    <span className="text-xs sm:text-sm">{order.shipping.address}</span>
                  ) : order.shippingInfo && order.shippingInfo.address ? (
                    <span className="text-xs sm:text-sm">
                      {order.shippingInfo.houseNumber && `${order.shippingInfo.houseNumber}, `}
                      {order.shippingInfo.address && `${order.shippingInfo.address}, `}
                      {order.shippingInfo.hamlet && `${order.shippingInfo.hamlet}, `}
                      {order.shippingInfo.ward && `${order.shippingInfo.ward}, `}
                      {order.shippingInfo.district && `${order.shippingInfo.district}, `}
                      {order.shippingInfo.province && `${order.shippingInfo.province}`}
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