/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ClipboardListIcon,
  ChevronLeftIcon,
  TruckIcon,
  PackageIcon,
  XCircleIcon,
  ClockIcon,
  MapPinIcon,
  EyeIcon,
  ArrowLeftIcon,
} from "lucide-react";
import orderApi from "../../../api/orderApi";
import { toast } from "sonner";
import { translateStatus } from "../../component/OrderStatusDisplay";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion } from "framer-motion";

// Import utility functions from MapUtils
import { 
  MAPBOX_ACCESS_TOKEN, 
  getNearestBranch, 
  calculateDistance, 
  geocodeAddress,
  formatDate,
  formatCurrency,
  SHOP_BRANCHES
} from "./OrderDetail/MapUtils";

// Set Mapbox token
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
      toast.error(
        "Trình duyệt của bạn không hỗ trợ Mapbox. Vui lòng sử dụng trình duyệt khác."
      );
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

  // Thêm ref để kiểm soát việc khởi tạo map container
  const mapContainerInitialized = useRef(false);

  // Thêm ref để lưu chi nhánh hiện tại
  const currentBranchRef = useRef(null);

  // Thêm biến và hàm thiếu để sửa lỗi
  const [geocodingRequested, setGeocodingRequested] = useState(false);

  // Hàm để lấy địa chỉ giao hàng từ đơn hàng - ưu tiên địa chỉ giao hàng theo thứ tự
  const getOrderShippingAddress = useCallback((order) => {
    if (!order) return "";

    // Ưu tiên lấy địa chỉ từ shippingAddress
    if (order.shippingAddress && typeof order.shippingAddress === "string" && order.shippingAddress.trim()) {
      return order.shippingAddress.trim();
    }

    // Hoặc từ shippingInfo
    if (order.shippingInfo && order.shippingInfo.address) {
      let address = order.shippingInfo.address;
      
      // Thêm các phần khác của địa chỉ nếu có
      if (order.shippingInfo.ward) address += `, ${order.shippingInfo.ward}`;
      if (order.shippingInfo.district) address += `, ${order.shippingInfo.district}`;
      if (order.shippingInfo.province) address += `, ${order.shippingInfo.province}`;
      
      return address.trim();
    }

    // Từ userId nếu có
    if (order.userId && order.userId.address) {
      return order.userId.address.trim();
    }

    // Nếu không tìm thấy địa chỉ
    return "Không có thông tin địa chỉ";
  }, []);

  // Thêm hàm lấy tọa độ từ đơn hàng
  const getOrderCoordinates = useCallback((order) => {
    if (!order) return null;

    // Ưu tiên lấy từ deliveryCoordinates
    if (order.deliveryCoordinates && order.deliveryCoordinates.lat && order.deliveryCoordinates.lng) {
      return {
        lat: parseFloat(order.deliveryCoordinates.lat),
        lng: parseFloat(order.deliveryCoordinates.lng)
      };
    }

    // Hoặc từ shippingInfo
    if (order.shippingInfo && order.shippingInfo.lat && order.shippingInfo.lng) {
      return {
        lat: parseFloat(order.shippingInfo.lat),
        lng: parseFloat(order.shippingInfo.lng)
      };
    }

    // Hoặc từ shipping
    if (order.shipping && order.shipping.coordinates) {
      const coords = order.shipping.coordinates;
      if (coords.lat && coords.lng) {
        return {
          lat: parseFloat(coords.lat),
          lng: parseFloat(coords.lng)
        };
      }
    }

    return null;
  }, []);

  // Hàm tính khoảng cách giữa 2 điểm địa lý (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Bán kính trái đất (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  // Hàm tạo đường thẳng giữa 2 điểm (fallback)
  const createStraightLine = useCallback(
    (map, customerCoords, distanceStraightLine, sourceBranch) => {
      if (map.getLayer("route-layer")) {
        map.removeLayer("route-layer");
      }

      if (map.getSource("route")) {
        map.removeSource("route");
      }

      // Thêm đường thẳng giữa 2 điểm
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [sourceBranch.lng, sourceBranch.lat],
              [customerCoords.lng, customerCoords.lat],
            ],
          },
        },
      });

      map.addLayer({
        id: "route-layer",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#2673DD",
          "line-width": 4,
          "line-opacity": 0.7,
          "line-dasharray": [0.5, 1.5],
        },
      });

      // Create a bounds that includes both points
      const bounds = new mapboxgl.LngLatBounds()
        .extend([sourceBranch.lng, sourceBranch.lat])
        .extend([customerCoords.lng, customerCoords.lat]);

      // Fit the map to the bounds with smaller padding
      map.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 12, // Giảm mức zoom tối đa để thấy rõ hơn cả 2 điểm
      });

      // Hiển thị thông tin khoảng cách và thời gian
      const estimatedMinutes = Math.ceil((distanceStraightLine / 30) * 60);

      const infoDiv = document.getElementById("map-info");
      if (infoDiv) {
        infoDiv.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div class="flex items-center gap-2">
            <span class="inline-block w-3 h-3 rounded-full bg-green-500"></span>
            <span class="font-semibold text-gray-700 text-xs sm:text-sm">${
              sourceBranch.name
            } → Địa chỉ nhận hàng (đường thẳng)</span>
          </div>
          <div class="flex gap-4">
            <div class="text-xs sm:text-sm"><span class="font-medium text-blue-600">Khoảng cách:</span> ${distanceStraightLine.toFixed(
              1
            )} km</div>
            <div class="text-xs sm:text-sm"><span class="font-medium text-blue-600">Thời gian ước tính:</span> ${estimatedMinutes} phút</div>
          </div>
        </div>
      `;
      }
    },
    []
  );

  // Thêm hàm addMapMarkers để hiển thị cả chi nhánh cửa hàng và địa điểm khách hàng kèm đường đi
  const addMapMarkers = useCallback((map, location) => {
    console.log("addMapMarkers called with:", { map, location, customerLocation });

    if (!map) {
      console.error("Map instance is null or undefined");
      return;
    }

    // Đảm bảo có tọa độ của khách hàng
    let customerCoords = location || customerLocation;
    console.log("Customer coordinates:", customerCoords);

    if (!customerCoords || !customerCoords.lat || !customerCoords.lng) {
      console.error("Invalid customer coordinates:", customerCoords);
      return;
    }

    // Xác định nếu địa chỉ chứa "Nguyễn Văn Cừ", sử dụng tọa độ chính xác
    if (customerCoords.address && customerCoords.address.includes("Nguyễn Văn Cừ")) {
      console.log("Địa chỉ Nguyễn Văn Cừ được phát hiện, sử dụng tọa độ chính xác");
      // Sử dụng tọa độ chính xác từ Google Maps cho đường Nguyễn Văn Cừ
      customerCoords = {
        ...customerCoords,
        lat: 10.030165, 
        lng: 105.7480393
      };
    }

    console.log("Drawing map with customer location:", customerCoords);

    // Lấy thông tin chi nhánh gần nhất
    const sourceBranch = getNearestBranch(customerCoords.lat, customerCoords.lng);
    console.log("Branch location:", sourceBranch);

    // Xóa các marker cũ nếu có
    const existingMarkers = document.querySelectorAll(".mapboxgl-marker");
    existingMarkers.forEach((marker) => marker.remove());

    // Xóa các layer và source cũ nếu có
    if (map.getLayer('route')) {
      map.removeLayer('route');
    }

    if (map.getSource('route')) {
      map.removeSource('route');
    }

    // Tạo marker cho vị trí cửa hàng
    const shopEl = document.createElement("div");
    shopEl.className = "shop-marker";
    shopEl.style.width = "40px";
    shopEl.style.height = "40px";
    shopEl.style.backgroundImage = "url(https://maps.google.com/mapfiles/ms/icons/green-dot.png)";
    shopEl.style.backgroundSize = "cover";
    shopEl.style.borderRadius = "50%";
    shopEl.style.border = "2px solid #4CAF50";
    shopEl.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";

    // Thêm marker shop với popup
    const shopMarker = new mapboxgl.Marker({ element: shopEl })
      .setLngLat([sourceBranch.lng, sourceBranch.lat])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <div style="font-weight: bold; font-size: 14px;">${sourceBranch.name}</div>
            <div style="font-size: 12px; color: #388e3c; margin-top: 4px;">Địa điểm xuất hàng</div>
          </div>
        `)
      )
      .addTo(map);

    // Hiển thị popup của shop mặc định khi load map
    shopMarker.togglePopup();

    // Tạo custom element cho customer marker
    const customerEl = document.createElement("div");
    customerEl.className = "customer-marker";
    customerEl.style.width = "40px";
    customerEl.style.height = "40px";
    customerEl.style.backgroundImage = "url(https://maps.google.com/mapfiles/ms/icons/red-dot.png)";
    customerEl.style.backgroundSize = "cover";
    customerEl.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";

    // Sử dụng địa chỉ từ location
    const displayAddress = customerCoords.address || "Địa chỉ không xác định";

    // Thêm marker cho khách hàng
    const customerMarker = new mapboxgl.Marker({ element: customerEl })
      .setLngLat([customerCoords.lng, customerCoords.lat])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <div style="font-weight: bold; font-size: 14px;">Địa điểm giao hàng</div>
            <div style="font-size: 12px; color: #d32f2f; margin-top: 4px;">${displayAddress}</div>
          </div>
        `)
      )
      .addTo(map);

    // Hiển thị đường đi giữa shop và khách hàng
    const drawRoute = async () => {
      try {
        console.log("Bắt đầu vẽ đường đi...");
        // Lấy tọa độ của shop và khách hàng
        const start = [sourceBranch.lng, sourceBranch.lat];
        const end = [customerCoords.lng, customerCoords.lat];
        
        console.log("Điểm bắt đầu:", start, "Điểm kết thúc:", end);

        // Đặt timeout để đảm bảo có đường đi nếu API quá chậm
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('API Timeout'));
          }, 5000); // 5 giây timeout
        });

        try {
          // Gọi Mapbox Directions API để lấy đường đi
          const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`;
          console.log("URL Directions API:", url);
          
          // Dùng Promise.race để đặt timeout cho fetch
          const response = await Promise.race([
            fetch(url),
            timeoutPromise
          ]);
          
          const data = await response.json();
          console.log("Kết quả từ Directions API:", data);
          
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const routeCoordinates = route.geometry.coordinates;
            
            // Thêm source và layer cho đường đi
            if (!map.getSource('route')) {
              console.log("Tạo mới source 'route'");
              map.addSource('route', {
                'type': 'geojson',
                'data': {
                  'type': 'Feature',
                  'properties': {},
                  'geometry': {
                    'type': 'LineString',
                    'coordinates': routeCoordinates
                  }
                }
              });
              
              console.log("Thêm layer 'route'");
              map.addLayer({
                'id': 'route',
                'type': 'line',
                'source': 'route',
                'layout': {
                  'line-join': 'round',
                  'line-cap': 'round'
                },
                'paint': {
                  'line-color': '#0085FF',
                  'line-width': 4,
                  'line-opacity': 0.8
                }
              });
            } else {
              // Cập nhật source đã tồn tại
              console.log("Cập nhật source 'route' đã tồn tại");
              map.getSource('route').setData({
                'type': 'Feature',
                'properties': {},
                'geometry': {
                  'type': 'LineString',
                  'coordinates': routeCoordinates
                }
              });
            }
            
            // Cập nhật thông tin khoảng cách và thời gian dự kiến
            const distance = (route.distance / 1000).toFixed(1); // km
            const duration = Math.ceil(route.duration / 60); // phút
            
            // Hiển thị thông tin lộ trình
            const infoDiv = document.getElementById("map-info");
            if (infoDiv) {
              infoDiv.innerHTML = `
                <div class="p-2 text-center text-sm">
                  <p class="font-medium">Khoảng cách: <span class="text-blue-600">${distance} km</span></p>
                  <p class="font-medium">Thời gian giao hàng dự kiến: <span class="text-blue-600">${duration} phút</span></p>
                </div>
              `;
            }
            
            // Cập nhật thông tin trong overlay
            const distanceValue = document.getElementById("distance-value");
            const timeValue = document.getElementById("time-value");
            
            if (distanceValue) {
              distanceValue.textContent = `${distance} km`;
            }
            
            if (timeValue) {
              timeValue.textContent = `${duration} phút`;
            }
            
            return; // Thoát hàm nếu vẽ đường thành công
          } else {
            console.warn("Không tìm thấy đường đi giữa hai điểm từ API, vẽ đường thẳng");
            throw new Error("Không có dữ liệu route");
          }
        } catch (apiError) {
          console.error("Lỗi khi gọi Directions API:", apiError);
          throw apiError; // Ném lại lỗi để xử lý ở catch bên ngoài
        }
      } catch (error) {
        console.error("Lỗi khi tìm đường đi:", error);
        // Fallback: vẽ đường thẳng
        const start = [sourceBranch.lng, sourceBranch.lat];
        const end = [customerCoords.lng, customerCoords.lat];
        console.log("Fallback: Vẽ đường thẳng từ", start, "đến", end);
        drawStraightLine(map, start, end);
      }
      
      // Fit bounds để nhìn thấy cả hai marker
      const bounds = new mapboxgl.LngLatBounds()
        .extend([sourceBranch.lng, sourceBranch.lat])
        .extend([customerCoords.lng, customerCoords.lat]);
        
      map.fitBounds(bounds, {
        padding: 80,
        maxZoom: 13
      });
    };
    
    // Hàm vẽ đường thẳng giữa hai điểm
    const drawStraightLine = (map, start, end) => {
      console.log("Đang vẽ đường thẳng giữa", start, "và", end);
      
      // Đảm bảo xóa layer route cũ nếu có
      if (map.getLayer('route')) {
        console.log("Xóa layer 'route' cũ");
        map.removeLayer('route');
      }
      
      // Đảm bảo xóa source route cũ nếu có
      if (map.getSource('route')) {
        console.log("Xóa source 'route' cũ");
        map.removeSource('route');
      }
      
      try {
        console.log("Thêm source 'route' mới cho đường thẳng");
        map.addSource('route', {
          'type': 'geojson',
          'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
              'type': 'LineString',
              'coordinates': [start, end]
            }
          }
        });
        
        console.log("Thêm layer 'route' mới cho đường thẳng");
        map.addLayer({
          'id': 'route',
          'type': 'line',
          'source': 'route',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#0085FF',
            'line-width': 3,
            'line-dasharray': [2, 1]
          }
        });
      } catch (error) {
        console.error("Lỗi khi vẽ đường thẳng:", error);
      }
      
      // Tính khoảng cách theo đường chim bay
      const distance = calculateDistance(
        start[1], start[0],
        end[1], end[0]
      ).toFixed(1);
      
      // Ước tính thời gian giao hàng (giả sử 30km/h trung bình)
      const estimatedMinutes = Math.ceil((parseFloat(distance) / 30) * 60);
      
      // Hiển thị thông tin
      const infoDiv = document.getElementById("map-info");
      if (infoDiv) {
        infoDiv.innerHTML = `
          <div class="p-2 text-center text-sm">
            <p class="font-medium">Khoảng cách: <span class="text-blue-600">${distance} km</span> (đường chim bay)</p>
            <p class="font-medium">Thời gian giao hàng dự kiến: <span class="text-blue-600">${estimatedMinutes} phút</span></p>
          </div>
        `;
      }
      
      // Cập nhật thông tin trong overlay
      const distanceValue = document.getElementById("distance-value");
      const timeValue = document.getElementById("time-value");
      
      if (distanceValue) {
        distanceValue.textContent = `${distance} km`;
      }
      
      if (timeValue) {
        timeValue.textContent = `${estimatedMinutes} phút`;
      }
    };
    
    // Thực hiện vẽ route
    if (map.loaded()) {
      drawRoute();
          } else {
      map.on('load', drawRoute);
    }

  }, [customerLocation, getNearestBranch, calculateDistance]);

  // Sửa hàm initMap để đảm bảo mặc định center đúng định dạng của Mapbox [lng, lat]
  const initMap = useCallback(
    (location) => {
      console.log("Initializing map with location:", location);

      if (!mapboxgl || !mapboxgl.supported()) {
        console.error("Trình duyệt không hỗ trợ Mapbox GL");
          setMapError(true);
        return;
      }

      try {
        // Sử dụng token đã khai báo ở đầu file
        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

        // Khởi tạo map với tùy chọn mặc định
        const mapContainer = document.getElementById("map-container");
        if (!mapContainer) {
          console.error("Không tìm thấy container cho map");
          return;
        }

        // Xóa map cũ nếu có
        if (window.orderTrackingMap) {
          window.orderTrackingMap.remove();
          window.orderTrackingMap = null;
        }

        // Xóa nội dung hiện tại trong container để tránh cảnh báo
        mapContainer.innerHTML = '';

        // Tạo bản đồ mới
        const map = new mapboxgl.Map({
          container: "map-container",
          style: "mapbox://styles/mapbox/streets-v11",
          center: [105.7203383, 10.0076303], // Mặc định là Cần Thơ [lng, lat]
          zoom: 12,
          attributionControl: false
        });

        // Lưu map vào biến toàn cục để sử dụng sau này
        window.orderTrackingMap = map;

        // Thêm controls
        map.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true,
            },
            trackUserLocation: false,
        }),
        "top-right"
      );

        // Xử lý sự kiện map load
        map.on("load", () => {
          console.log("Map loaded, adding markers for location:", location);
          
          // Đảm bảo xóa các layer và source cũ
          if (map.getLayer('route')) {
            map.removeLayer('route');
          }
          if (map.getSource('route')) {
            map.removeSource('route');
          }
          
          // Thêm markers và vẽ đường đi
          addMapMarkers(map, location);
          
          // Lưu các biến cần thiết để sử dụng trong timeout
          const locationForTimeout = location || customerLocation;
          
          // Thêm sự kiện để kiểm tra nếu route không được vẽ sau 2 giây
          setTimeout(() => {
            if (!map.getLayer('route') && locationForTimeout) {
              console.log("Route không được tạo sau 2 giây, thử vẽ lại");
              // Tìm lại chi nhánh gần nhất
              const branchForTimeout = getNearestBranch(
                locationForTimeout.lat, 
                locationForTimeout.lng
              );
              
              if (branchForTimeout && locationForTimeout) {
                const start = [branchForTimeout.lng, branchForTimeout.lat];
                const end = [locationForTimeout.lng, locationForTimeout.lat];
                
                // Vẽ đường thẳng giữa hai điểm
                try {
                  // Xóa layer cũ nếu có
                  if (map.getLayer('route')) {
                    map.removeLayer('route');
                  }
                  if (map.getSource('route')) {
                    map.removeSource('route');
                  }
                  
                  // Thêm source mới
                  map.addSource('route', {
                    'type': 'geojson',
                    'data': {
                      'type': 'Feature',
                      'properties': {},
                      'geometry': {
                        'type': 'LineString',
                        'coordinates': [start, end]
                      }
                    }
                  });
                  
                  // Thêm layer mới
                  map.addLayer({
                    'id': 'route',
                    'type': 'line',
                    'source': 'route',
                    'layout': {
                      'line-join': 'round',
                      'line-cap': 'round'
                    },
                    'paint': {
                      'line-color': '#0085FF',
                      'line-width': 3,
                      'line-dasharray': [2, 1]
                    }
                  });
                  
                  // Fit bounds
                  const bounds = new mapboxgl.LngLatBounds()
                    .extend(start)
                    .extend(end);
                    
                  map.fitBounds(bounds, {
                    padding: 80,
                    maxZoom: 13
                  });
                } catch (error) {
                  console.error("Lỗi khi vẽ đường thẳng trong timeout:", error);
                }
              }
            }
          }, 1000);
        });

        // Xử lý sự kiện lỗi
      map.on("error", (e) => {
        console.error("Map error:", e);
        setMapError(true);
      });

        // Đảm bảo không còn lỗi map
        setMapError(false);
    } catch (error) {
        console.error("Lỗi khi khởi tạo map:", error);
      setMapError(true);
      }
    },
    [addMapMarkers, setMapError]
  );

  // Sửa hàm performGeocoding để xử lý đúng thứ tự tọa độ của Mapbox
  const performGeocoding = useCallback(
    (address) => {
      // Nếu đã yêu cầu geocoding cho địa chỉ này, không gọi lại
      if (window._geocoding_requested === address) {
        return;
      }

      // Đánh dấu đã yêu cầu geocoding để tránh gọi lại
      window._geocoding_requested = address;
      setGeocodingRequested(true);

      // Thực hiện geocoding
      const doGeocode = async () => {
        try {
          console.log("Executing geocoding for address:", address);
          const result = await geocodeAddress(address);
          
          if (result && result.lat && result.lng) {
            console.log("Geocoding successful:", result);
            setCustomerLocation({
              ...result,
              address: address,
              pending: false,
              initialized: true,
              geocoded: true,
              source: "geocoded"
            });

            // Khởi tạo bản đồ với kết quả geocoding
            setTimeout(() => {
              try {
                initMap({
                  ...result,
                  address: address
                });
              } catch (err) {
                console.error("Lỗi khi khởi tạo bản đồ với kết quả geocoding:", err);
                setMapError(true);
                
                // Hiển thị thông báo lỗi cho người dùng
                const infoDiv = document.getElementById("map-info");
                if (infoDiv) {
                  infoDiv.innerHTML = `
                    <div class="p-2 text-center text-red-500 text-sm">
                      <p>Không thể hiển thị bản đồ. Vui lòng làm mới trang hoặc thử lại sau.</p>
                    </div>
                  `;
                }
              }
            }, 500);
          } else {
            console.warn("Không tìm thấy kết quả geocode cho địa chỉ:", address);
            
            // Sử dụng vị trí mặc định của Cần Thơ - lưu ý thứ tự của Mapbox là [lng, lat]
            setCustomerLocation({
              // Đây là tọa độ của Cần Thơ: [lng, lat] theo đúng thứ tự của Mapbox
              lng: 105.7203383, 
              lat: 10.0076303,
              address: address,
              pending: false,
              initialized: true,
              geocoded: true,
              source: "fallback"
            });
            
            // Khởi tạo bản đồ với vị trí mặc định
            setTimeout(() => {
              try {
                initMap({
                  lng: 105.7203383,
                  lat: 10.0076303,
                  address: address
                });
              } catch (err) {
                console.error("Lỗi khi khởi tạo bản đồ với vị trí mặc định:", err);
                setMapError(true);
              }
            }, 500);
            
            setMapError(true);
          }
        } catch (error) {
          console.error("Lỗi khi geocoding địa chỉ:", error);
          
          // Sử dụng vị trí mặc định của Cần Thơ khi có lỗi
          setCustomerLocation({
            lng: 105.7203383, 
            lat: 10.0076303,
            address: address,
            pending: false,
            initialized: true,
            geocoded: true,
            source: "error_fallback"
          });
          
          // Khởi tạo bản đồ với vị trí mặc định
          setTimeout(() => {
            try {
              initMap({
                lng: 105.7203383,
                lat: 10.0076303,
                address: address
              });
            } catch (err) {
              console.error("Lỗi khi khởi tạo bản đồ với vị trí mặc định:", err);
              setMapError(true);
            }
          }, 500);
          
          setMapError(true);
        }
      };

      doGeocode();
    },
    [setCustomerLocation, setMapError, initMap]
  );

  // Đặt hàm vào ref để có thể gọi từ useEffect
  useEffect(() => {
    geocodingFnRef.current = performGeocoding;
  }, [performGeocoding]);

  // Add this useEffect to make sure the map container exists
  useEffect(() => {
    // Create the map container if it doesn't exist
    let mapContainer = document.getElementById("order-tracking-map");
    if (!mapContainer) {
      const mapContainerParent = document.getElementById("map-container");
      if (mapContainerParent) {
        mapContainer = document.createElement("div");
        mapContainer.id = "order-tracking-map";
        mapContainer.style.width = "100%";
        mapContainer.style.height = "100%";
        mapContainer.style.minHeight = "300px";
        mapContainerParent.appendChild(mapContainer);
      }
    }
  }, []);

  // Thêm useEffect để debug customerLocation
  useEffect(() => {
    if (customerLocation) {
      console.log("CustomerLocation changed:", customerLocation);
      // Nếu đã có map và có tọa độ thì cập nhật markers
      if (window.orderTrackingMap && customerLocation.lat && customerLocation.lng) {
        console.log("Updating map markers with latest customerLocation");
        addMapMarkers(window.orderTrackingMap, customerLocation);
      }
    }
  }, [customerLocation, addMapMarkers]);

  // Add CSS styles to make the map markers more visible and improve the map container element
  useEffect(() => {
    // Create map container CSS
    const injectCustomStyles = () => {
      // Check if styles already exist
      if (document.getElementById("mapbox-custom-styles")) {
        return;
      }

      // Create style element
      const styleEl = document.createElement("style");
      styleEl.id = "mapbox-custom-styles";
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
    };

    // Inject CSS
    injectCustomStyles();

    // Cleanup function
    return () => {
      const styleEl = document.getElementById("mapbox-custom-styles");
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, []);

  // Sửa useEffect xử lý order để đảm bảo luôn hiển thị được địa chỉ khách hàng
  useEffect(() => {
    if (order && !customerLocation?.initialized && !geocodingRequested) {
      console.log("Processing order for map:", order);
      
      // Lấy địa chỉ đầy đủ
      const fullAddress = getOrderShippingAddress(order);
      console.log("Full shipping address:", fullAddress);
      
      // Thử lấy tọa độ từ đơn hàng trước
      const savedCoordinates = getOrderCoordinates(order);
      
      if (savedCoordinates) {
        console.log("Using coordinates from order:", savedCoordinates);
        
        // Khởi tạo customerLocation với tọa độ đã lưu
                const customerLocationData = {
          ...savedCoordinates,
                  address: fullAddress,
                  pending: false,
                  initialized: true,
          geocoded: false,
          source: "order"
                };

                setCustomerLocation(customerLocationData);
                setGeocodingRequested(true);

        // Khởi tạo bản đồ với tọa độ đã lưu
                setTimeout(() => {
                  try {
                    initMap(customerLocationData);
                  } catch (err) {
            console.error("Lỗi khi khởi tạo bản đồ với tọa độ từ order:", err);
                    setMapError(true);
                  }
                }, 500);

                return; // Thoát khỏi useEffect, không cần geocoding
      }
      
      // Nếu không có tọa độ đã lưu, thử tìm trong cache
        try {
          // Thử đọc cache từ localStorage
          const geocodingCache = JSON.parse(
            localStorage.getItem("geocoding_cache") || "{}"
          );
          const addressKey = fullAddress
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s]/g, "")
            .replace(/\s+/g, "_");

          if (geocodingCache[addressKey]) {
            const cachedResult = geocodingCache[addressKey];
          console.log("Using coordinates from cache:", cachedResult);
          
              const customerLocationData = {
                ...cachedResult,
                address: fullAddress,
                pending: false,
                initialized: true,
                geocoded: true,
            source: "cache"
              };

              setCustomerLocation(customerLocationData);
              setGeocodingRequested(true);

              // Khởi tạo bản đồ với dữ liệu từ cache
              setTimeout(() => {
                try {
                  initMap(customerLocationData);
                } catch (err) {
              console.error("Lỗi khi khởi tạo bản đồ với tọa độ từ cache:", err);
                  setMapError(true);
                }
              }, 500);

              return; // Thoát khỏi useEffect, không cần geocoding
          }
        } catch (error) {
          console.warn("Lỗi khi đọc cache geocoding:", error);
        }

        // Khởi tạo customer location với địa chỉ đầy đủ, pending=true để trigger geocoding
        const pendingLocation = {
          address: fullAddress,
          pending: true,
        initialized: false
        };

        setCustomerLocation(pendingLocation);

        // Chỉ thực hiện geocoding một lần
        if (mapboxLoaded && !window._geocoding_requested) {
        console.log("Performing geocoding for address:", fullAddress);
        
          if (geocodingFnRef.current) {
          geocodingFnRef.current(fullAddress);
          } else {
          performGeocoding(fullAddress);
        }
      }
    }
  }, [
    order,
    customerLocation?.initialized,
    initMap,
    mapboxLoaded,
    setCustomerLocation,
    setMapError,
    performGeocoding,
    getOrderShippingAddress,
    getOrderCoordinates,
    geocodingRequested
  ]);

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
        toast.info(
          response.message ||
            "Đang sử dụng dữ liệu giả lập do không thể kết nối đến GHN"
        );
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

        // Lấy userId của người dùng hiện tại
        const currentUserId = localStorage.getItem("userId");
        if (!currentUserId) {
          toast.error(
            "Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại."
          );
          setTimeout(() => navigate("/dang-nhap"), 2000);
          setLoading(false);
          return;
        }

        const orderData = await orderApi.getOrderById(orderId);

        // Kiểm tra xem đơn hàng có thuộc về người dùng hiện tại không
        const orderUserId =
          orderData.userId && typeof orderData.userId === "object"
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
            fetchTrackingInfo(orderData.orderCode);
          }

          // Lấy địa chỉ nhận hàng ưu tiên theo thứ tự
          let fullAddress = getOrderShippingAddress(orderData);
          let lat = null;
          let lng = null;
          if (
            orderData.deliveryCoordinates &&
            orderData.deliveryCoordinates.lat &&
            orderData.deliveryCoordinates.lng
          ) {
            lat = parseFloat(orderData.deliveryCoordinates.lat);
            lng = parseFloat(orderData.deliveryCoordinates.lng);
          }
          // Nếu không có, thử lấy từ shippingInfo
          else if (
            orderData.shippingInfo &&
            orderData.shippingInfo.lat &&
            orderData.shippingInfo.lng
          ) {
            lat = parseFloat(orderData.shippingInfo.lat);
            lng = parseFloat(orderData.shippingInfo.lng);
          }
          // Nếu không có, thử lấy từ shipping
          else if (
            orderData.shipping &&
            orderData.shipping.lat &&
            orderData.shipping.lng
          ) {
            lat = parseFloat(orderData.shipping.lat);
            lng = parseFloat(orderData.shipping.lng);
          }
          // Nếu có lat/lng thì set luôn customerLocation
          if (lat && lng) {
            setCustomerLocation({
              lat,
              lng,
              address: fullAddress,
              pending: false,
              initialized: true,
            });
          } else if (
            fullAddress &&
            fullAddress !== "Không có thông tin địa chỉ"
          ) {
            // Nếu có địa chỉ nhưng chưa có tọa độ, trigger geocoding
            setCustomerLocation({
              address: fullAddress,
              pending: true,
              initialized: false,
            });
          } else {
            // Không có địa chỉ nhận hàng
            setCustomerLocation({
              error: true,
              errorMessage: "Không tìm thấy thông tin địa chỉ khách hàng",
              address: "Không có thông tin địa chỉ",
              pending: false,
              initialized: true,
            });
          }
        }

        // Thiết lập polling để cập nhật trạng thái đơn hàng theo thời gian thực
        if (
          orderData &&
          orderData.status !== "completed" &&
          orderData.status !== "cancelled"
        ) {
          const intervalId = setInterval(async () => {
            if (isMounted) {
              try {
                const updatedOrder = await orderApi.checkOrderStatus(orderId);
                if (isMounted) {
                  // Chỉ cập nhật state nếu có thay đổi trạng thái
                  if (updatedOrder.status !== order?.status) {
                    toast.info(
                      `Trạng thái đơn hàng đã được cập nhật thành: ${translateStatus(
                        updatedOrder.status
                      )}`
                    );
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
          toast.error(
            "Không thể tải thông tin đơn hàng. Vui lòng thử lại sau."
          );
          setTimeout(() => navigate("/tai-khoan/don-hang"), 2000);
          setLoading(false);
        }
      }
    };

    getOrderData();

    return () => {
      isMounted = false;
    };
  }, [orderId, navigate, fetchTrackingInfo, getOrderShippingAddress]);

  // Đặt lỗi bản đồ nếu có lỗi tải API
  useEffect(() => {
    if (loadError) {
      setMapError(true);
      console.error("Lỗi khi tải Mapbox:", loadError);

      if (
        loadError.message &&
        loadError.message.includes("MapboxNotSupported")
      ) {
        toast.error(
          "Trình duyệt của bạn không hỗ trợ Mapbox. Vui lòng sử dụng trình duyệt khác."
        );
      } else {
        toast.error("Không thể tải bản đồ. Vui lòng làm mới trang và thử lại.");
      }
    }
  }, [loadError]);

  // Thêm useEffect để xử lý khi mapLoaded thay đổi và khởi tạo bản đồ mặc định nếu chưa có vị trí khách hàng
  useEffect(() => {
    // Chỉ chạy một lần khi mapLoaded = true và chưa có customerLocation
    // Đảm bảo chỉ chạy một lần với biến flag
    if (
      mapLoaded &&
      !mapError &&
      !customerLocation &&
      !window.__map_default_initialized &&
      !window._default_location_requested
    ) {
      // Đánh dấu đã yêu cầu khởi tạo
      window._default_location_requested = true;
      // Đánh dấu đã khởi tạo
      window.__map_default_initialized = true;

      const defaultLocation = {
        lat: 10.034236,
        lng: 105.775285,
        address: order?.userId?.address || "Địa chỉ không xác định",
        pending: false,
        initialized: true,
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
    if (
      customerLocation &&
      !mapError &&
      mapLoaded &&
      !window.__map_initialized &&
      !window._map_initialization_requested
    ) {
      // Đánh dấu đã yêu cầu khởi tạo
      window._map_initialization_requested = true;
      // Đánh dấu đã khởi tạo
      window.__map_initialized = true;

      // Tạo div cho bản đồ nếu chưa tồn tại
      const mapContainer = document.getElementById("order-tracking-map");
      if (!mapContainer) {
        // Kiểm tra container map-container thay thế
        const mapContainerAlt = document.getElementById("map-container");
        if (mapContainerAlt) {
          // Tạo div cho Mapbox nếu chưa có
          if (!mapContainerAlt.querySelector("#order-tracking-map")) {
            const mapDiv = document.createElement("div");
            mapDiv.id = "order-tracking-map";
            mapDiv.style.width = "100%";
            mapDiv.style.height = "100%";
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
      // Asegurar que tenemos las coordenadas para mostrar el mapa estático
      if (!customerLocation.lng || !customerLocation.lat) {
        const defaultLocation = {
          lat: 10.034236,
          lng: 105.775285,
          address: customerLocation.address || "Địa chỉ không xác định",
          pending: false,
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
      order.paymentStatus === "completed" ||
      order.status === "processing" ||
      order.status === "shipped" ||
      order.status === "delivered" ||
      order.status === "completed"
    );
  };

  const goBack = () => {
    navigate("/tai-khoan/don-hang");
  };

  // Thêm useEffect để xử lý khi mapLoaded thay đổi và khởi tạo bản đồ mặc định nếu chưa có vị trí khách hàng
  useEffect(() => {
    if (mapLoaded && !mapError) {
      // Nếu không có vị trí khách hàng hoặc đang chờ, tạo vị trí mặc định
      if (
        !customerLocation ||
        (customerLocation.pending && !customerLocation.address)
      ) {
        const defaultLocation = {
          lat: 10.034236,
          lng: 105.775285,
          address: order?.userId?.address || "Địa chỉ không xác định",
          pending: false,
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

  // Thêm hàm chỉ hiển thị ngày tháng năm (không hiện giờ phút)
  const formatDateOnly = (dateString) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("vi-VN", options);
  };

  // Tạo useEffect mới để đảm bảo container map tồn tại
  useEffect(() => {
    if (mapLoaded && !mapError) {
      // Tìm hoặc tạo container cho bản đồ
      const mapContainerDiv = document.getElementById("map-container");
      const mapDiv = document.getElementById("order-tracking-map");

      if (mapContainerDiv && !mapDiv) {
        const newMapDiv = document.createElement("div");
        newMapDiv.id = "order-tracking-map";
        newMapDiv.style.width = "100%";
        newMapDiv.style.height = "100%";
        newMapDiv.style.minHeight = "300px";
        mapContainerDiv.appendChild(newMapDiv);
      }

      // Đảm bảo container có kích thước
      if (mapContainerDiv) {
        mapContainerDiv.style.minHeight = "300px";
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
    window.addEventListener("error", handleMapboxError);

    return () => {
      window.removeEventListener("error", handleMapboxError);
    };
  }, []);

  // Cleanup global variables khi component unmount
  useEffect(() => {
    return () => {
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
      return;
    }
  }, [order]);

  // Tạo useEffect mới để debug việc lấy địa chỉ
  useEffect(() => {
    if (order) {
      if (order.userId && typeof order.userId === "object") {
        return;
      }
      const finalAddress = getOrderShippingAddress(order);
    }
  }, [order, getOrderShippingAddress]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-4 sm:py-8 bg-gray-50">
        <div className="flex items-center justify-center min-h-[40vh] sm:min-h-[50vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-green-500"></div>
            <p className="text-sm sm:text-base text-gray-600">
              Đang tải thông tin đơn hàng...
            </p>
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
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">
            Không tìm thấy đơn hàng
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Đơn hàng không tồn tại hoặc bạn không có quyền xem đơn hàng này.
          </p>
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
        <Link
          to="/tai-khoan/don-hang"
          className="flex items-center text-green-600 hover:text-green-700 transition-colors"
        >
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
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                Thông tin đơn hàng
              </h3>
            </div>
            <div className="px-3 py-2 sm:px-6 sm:py-4 space-y-2 sm:space-y-3 text-sm flex flex-col gap-1 sm:gap-2">
              <div className="flex justify-between items-center">
                <div className="text-gray-600 text-xs sm:text-sm">Mã đơn:</div>
                <div className="font-medium text-xs sm:text-sm">
                  #{order._id.slice(-6).toUpperCase()}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600 text-xs sm:text-sm">
                  Ngày đặt:
                </div>
                <div className="text-xs sm:text-sm">
                  {formatDate(order.createdAt)}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600 text-xs sm:text-sm">
                  Tổng tiền:
                </div>
                <div className="font-semibold text-sm sm:text-base">
                  {formatCurrency(order.totalAmount)}đ
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600 text-xs sm:text-sm">
                  Trạng thái:
                </div>
                <div>
                  <span
                    className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs rounded-full ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600 text-xs sm:text-sm">
                  Thanh toán:
                </div>
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
                <div className="text-gray-600 text-xs sm:text-sm">
                  Phương thức:
                </div>
                <div className="font-medium text-xs sm:text-sm text-right">
                  {order.paymentMethod === "cod"
                    ? "Thanh toán khi nhận hàng"
                    : order.paymentMethod === "bank_transfer"
                    ? "Chuyển khoản ngân hàng"
                    : order.paymentMethod}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600 text-xs sm:text-sm">
                  Mã vận đơn:
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  {!order.orderCode ? (
                    <div className="flex items-center">
                      <span className="text-gray-500 text-xs sm:text-sm">
                        Chưa có
                      </span>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-xs sm:text-sm">
                        {order.orderCode}
                      </span>
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
          <div
            className="bg-white shadow-sm sm:shadow-md rounded-lg overflow-hidden"
            id="order-map-section"
          >
            <div className="bg-green-50 py-2 px-3 sm:py-4 sm:px-6 border-b border-green-100 flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                Bản đồ theo dõi
              </h3>
              <div className="flex gap-1 sm:gap-2 items-center">
                {mapError && (
                  <button
                    onClick={() => {
                      setMapError(null);
                      window.location.reload();
                    }}
                    className="flex items-center gap-1 text-[10px] sm:text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-2.5 w-2.5 sm:h-4 sm:w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Làm mới</span>
                  </button>
                )}
                <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
            </div>
            <div className="p-2 sm:p-4">
              <div id="map-info" className="mb-2 text-xs text-gray-500"></div>
              {/* Map container div */}
              <div
                className="aspect-video w-full relative border border-gray-200 rounded-lg overflow-hidden"
                id="map-container"
              >
                <div
                  id="order-tracking-map"
                  className="absolute inset-0"
                  style={{ width: "100%", height: "100%", minHeight: "300px" }}
                ></div>
                
                {/* Fallback content when map doesn't load */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 z-0">
                  <div className="text-center p-4">
                    <MapPinIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Đang tải bản đồ...</p>
                    <p className="text-xs text-gray-500 mt-1">Vui lòng đợi trong giây lát</p>
                  </div>
                </div>
                
                {/* Thêm overlays hiển thị thông tin khoảng cách và thời gian giao hàng */}
                <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-lg p-2 shadow-md z-10 max-w-[200px]">
                  <div className="text-xs font-medium text-gray-700">Khoảng cách: <span id="distance-value" className="text-blue-600">4.8 km</span></div>
                  <div className="text-xs font-medium text-gray-700">Thời gian dự kiến: <span id="time-value" className="text-blue-600">11 phút</span></div>
                </div>
              </div>

              {/* Trạng thái vận chuyển */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TruckIcon className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-blue-800">Trạng thái vận chuyển</h4>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">
                    {order.orderCode ? 'Mã vận đơn: ' + order.orderCode : 'Đang chờ xử lý'}
                  </span>
                  <span className="text-xs font-medium text-blue-600">
                    {getStatusText(order.status)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full" 
                    style={{ 
                      width: order.status === 'pending' ? '10%' : 
                             order.status === 'confirmed' ? '20%' :
                             order.status === 'processing' ? '30%' :
                             order.status === 'preparing' ? '40%' :
                             order.status === 'packaging' ? '50%' :
                             order.status === 'shipping' || order.status === 'shipped' ? '70%' :
                             order.status === 'delivering' ? '80%' :
                             order.status === 'delivered' ? '90%' :
                             order.status === 'completed' ? '100%' : '25%'
                    }}
                  ></div>
                </div>
                
                {/* Các bước trạng thái */}
                <div className="mt-3 grid grid-cols-5 text-center">
                  <div className={`text-xs ${['confirmed', 'processing', 'preparing', 'packaging', 'shipping', 'shipped', 'delivering', 'delivered', 'completed'].includes(order.status) ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                    <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${['confirmed', 'processing', 'preparing', 'packaging', 'shipping', 'shipped', 'delivering', 'delivered', 'completed'].includes(order.status) ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                    Xác nhận
                  </div>
                  <div className={`text-xs ${['processing', 'preparing', 'packaging', 'shipping', 'shipped', 'delivering', 'delivered', 'completed'].includes(order.status) ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                    <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${['processing', 'preparing', 'packaging', 'shipping', 'shipped', 'delivering', 'delivered', 'completed'].includes(order.status) ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                    Chuẩn bị
                  </div>
                  <div className={`text-xs ${['shipping', 'shipped', 'delivering', 'delivered', 'completed'].includes(order.status) ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                    <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${['shipping', 'shipped', 'delivering', 'delivered', 'completed'].includes(order.status) ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                    Vận chuyển
                  </div>
                  <div className={`text-xs ${['delivering', 'delivered', 'completed'].includes(order.status) ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                    <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${['delivering', 'delivered', 'completed'].includes(order.status) ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                    Giao hàng
                  </div>
                  <div className={`text-xs ${['completed'].includes(order.status) ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                    <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${['completed'].includes(order.status) ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                    Hoàn thành
                  </div>
                </div>
              </div>
              
              {/* Thêm phần hiển thị trạng thái theo dõi */}
              {!order.orderCode && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                  <div className="mb-3">
                    <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-yellow-100 text-yellow-500 mb-2">
                      <ClockIcon className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-700">Đang chờ thông tin vận chuyển</h4>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    Hệ thống đang cập nhật thông tin vận chuyển đơn hàng của bạn
                  </p>
                  <button onClick={() => window.location.reload()} className="mt-2 text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors">
                    Làm mới
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="bg-white shadow-sm sm:shadow-md rounded-lg overflow-hidden">
            <div className="bg-green-50 py-2 px-3 sm:py-4 sm:px-6 border-b border-green-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                Sản phẩm
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-2 sm:py-3 sm:px-4 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                      Sản phẩm
                    </th>
                    <th className="py-2 px-2 sm:py-3 sm:px-4 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                      Đơn giá
                    </th>
                    <th className="py-2 px-1 sm:py-3 sm:px-2 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                      SL
                    </th>
                    <th className="py-2 px-2 sm:py-3 sm:px-4 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                      T.Tiền
                    </th>
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
                              {item.productId?.productName ||
                                "Sản phẩm không tồn tại"}
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
                    <td
                      colSpan="3"
                      className="py-2 px-2 sm:py-3 sm:px-4 text-right text-[10px] sm:text-xs font-medium text-gray-500"
                    >
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
                <h3 className="text-base sm:text-lg font-semibold text-blue-800">
                  Tiến trình giao hàng
                </h3>
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
                    <p className="text-gray-600">
                      Không thể lấy thông tin vận chuyển
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-2">
                      Đơn hàng của bạn đang được xử lý
                    </p>
                  </div>
                ) : !trackingInfo ? (
                  <div className="text-center py-4 sm:py-6">
                    <ClockIcon className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-gray-600">
                      Đang chờ thông tin vận chuyển
                    </p>
                  </div>
                ) : (
                  <div>
                    {console.log("Debug tracking status:", {
                      main_status: trackingInfo.status_name,
                      latest_log:
                        trackingInfo.tracking_logs &&
                        trackingInfo.tracking_logs.length > 0
                          ? trackingInfo.tracking_logs[0].status_name
                          : null,
                      all_logs: trackingInfo.tracking_logs,
                    })}
                    <div className="mb-3 sm:mb-4 py-2 px-3 sm:py-3 sm:px-4 bg-blue-50 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="text-xs text-gray-500">Trạng thái</div>
                        <div className="font-medium text-blue-700 text-sm sm:text-lg">
                          {trackingInfo.tracking_logs &&
                          trackingInfo.tracking_logs.length > 0
                            ? trackingInfo.tracking_logs[0].status_name
                            : trackingInfo.status_name || "Đang vận chuyển"}
                        </div>
                      </div>
                      {trackingInfo.estimated_delivery_time && (
                        <div className="sm:text-right">
                          <div className="text-xs text-gray-500">
                            Dự kiến giao hàng
                          </div>
                          <div className="font-medium text-blue-700 text-xs sm:text-sm">
                            {formatDateOnly(
                              trackingInfo.estimated_delivery_time
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <h4 className="font-medium text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                      Chi tiết hành trình
                    </h4>

                    {trackingInfo.tracking_logs &&
                    trackingInfo.tracking_logs.length > 0 ? (
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
                              <div
                                className={`h-5 w-5 rounded-full flex-shrink-0 mt-1.5 ${
                                  index === 0 ? "bg-green-500" : "bg-blue-500"
                                }`}
                              ></div>
                              <div className="pb-2">
                                <div className="text-xs sm:text-sm font-medium">
                                  {log.status_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(log.timestamp)}
                                </div>
                                {log.location && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {log.location}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-xs sm:text-sm">
                        Chưa có thông tin vận chuyển
                      </p>
                    )}

                    <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50">
                      <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Lưu ý:
                      </h5>
                      <p className="text-xs text-gray-600">
                        Thông tin theo dõi đơn hàng được cập nhật từ đơn vị vận
                        chuyển Giao Hàng Nhanh. Nếu bạn có bất kỳ thắc mắc nào
                        về đơn hàng, vui lòng liên hệ với chúng tôi qua hotline:
                        1900 1234.
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
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                Thông tin giao hàng
              </h3>
            </div>
            <div className="px-4 py-3 sm:px-6 sm:py-4 space-y-3 sm:space-y-6 text-sm flex flex-col gap-2 sm:gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="text-xs sm:text-sm text-gray-600 sm:min-w-[100px]">
                  Người nhận:
                </div>
                <div className="font-medium">
                  {order.userId?.firstName + " " + order.userId?.lastName ||
                    "Không có thông tin"}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="text-xs sm:text-sm text-gray-600 sm:min-w-[100px]">
                  Số điện thoại:
                </div>
                <div className="font-medium">
                  {order.userId?.phone || "Không có thông tin"}
                </div>
              </div>
              <div className="flex flex-col gap-1 sm:gap-2">
                <div className="text-xs sm:text-sm text-gray-600">
                  Địa chỉ giao hàng:
                </div>
                <div className="font-medium">
                  {order.shippingAddress ? (
                    <span className="text-xs sm:text-sm">
                      {order.shippingAddress}
                    </span>
                  ) : order.shipping && order.shipping.address ? (
                    <span className="text-xs sm:text-sm">
                      {order.shipping.address}
                    </span>
                  ) : order.shippingInfo && order.shippingInfo.address ? (
                    <span className="text-xs sm:text-sm">
                      {order.shippingInfo.houseNumber &&
                        `${order.shippingInfo.houseNumber}, `}
                      {order.shippingInfo.address &&
                        `${order.shippingInfo.address}, `}
                      {order.shippingInfo.hamlet &&
                        `${order.shippingInfo.hamlet}, `}
                      {order.shippingInfo.ward &&
                        `${order.shippingInfo.ward}, `}
                      {order.shippingInfo.district &&
                        `${order.shippingInfo.district}, `}
                      {order.shippingInfo.province &&
                        `${order.shippingInfo.province}`}
                    </span>
                  ) : (
                    "Không có thông tin địa chỉ"
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="text-xs sm:text-sm text-gray-600 sm:min-w-[100px]">
                  Phương thức:
                </div>
                <div className="font-medium">
                  {order.shippingInfo?.method === "standard"
                    ? "Giao hàng tiêu chuẩn"
                    : order.shippingInfo?.method === "express"
                    ? "Giao hàng nhanh"
                    : order.shippingInfo?.method || "Tiêu chuẩn"}
                </div>
              </div>
            </div>
          </div>

          {/* Theo dõi đơn hàng (dạng thu gọn) */}
          <div className="bg-white shadow-sm sm:shadow-md rounded-lg overflow-hidden">
            <div className="bg-green-50 py-3 px-4 sm:py-4 sm:px-6 border-b border-green-100 flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                Theo dõi đơn hàng
              </h3>
              <TruckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>

            <div className="px-4 py-3 sm:px-6 sm:py-4">
              {!order.orderCode ? (
                <div className="text-center py-4">
                  <div className="inline-flex justify-center items-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-500 mb-2">
                    <ClockIcon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Đang chờ mã vận đơn
                  </p>
                  <p className="text-xs text-gray-500">
                    Đơn hàng của bạn đang được xử lý
                  </p>
                </div>
              ) : trackingLoading ? (
                <div className="flex justify-center py-4 sm:py-6">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : trackingError ? (
                <div className="text-center py-4">
                  <div className="inline-flex justify-center items-center w-10 h-10 rounded-full bg-orange-100 text-orange-500 mb-2">
                    <XCircleIcon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Không thể tải thông tin
                  </p>
                  <p className="text-xs text-gray-500">
                    Vui lòng thử lại sau
                  </p>
                </div>
              ) : !trackingInfo ? (
                <div className="text-center py-4">
                  <div className="inline-flex justify-center items-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-500 mb-2">
                    <ClockIcon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Đang chờ thông tin vận chuyển
                  </p>
                  <p className="text-xs text-gray-500">
                    Mã vận đơn: {order.orderCode}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-3 sm:mb-4 py-2 px-3 sm:py-3 sm:px-4 bg-blue-50 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="text-xs text-gray-500">
                        Trạng thái hiện tại
                      </div>
                      <div className="font-medium text-blue-700 text-sm sm:text-lg">
                        {trackingInfo.tracking_logs &&
                        trackingInfo.tracking_logs.length > 0
                          ? trackingInfo.tracking_logs[0].status_name
                          : trackingInfo.status_name || "Đang vận chuyển"}
                      </div>
                    </div>
                    {trackingInfo.estimated_delivery_time && (
                      <div className="sm:text-right">
                        <div className="text-xs text-gray-500">
                          Dự kiến giao hàng
                        </div>
                        <div className="font-medium text-blue-700 text-xs sm:text-sm">
                          {formatDateOnly(trackingInfo.estimated_delivery_time)}
                        </div>
                      </div>
                    )}
                  </div>

                  <h4 className="font-medium text-gray-800 text-sm mb-2 sm:mb-3">
                    Lịch sử vận chuyển
                  </h4>

                  {trackingInfo.tracking_logs &&
                  trackingInfo.tracking_logs.length > 0 ? (
                    <div className="relative">
                      <div className="absolute top-0 bottom-0 left-[10px] w-0.5 bg-gray-200"></div>
                      <div className="space-y-3 sm:space-y-4">
                        {/* Chỉ hiện thị 3 cập nhật gần nhất */}
                        {trackingInfo.tracking_logs
                          .slice(0, 3)
                          .map((log, index) => (
                            <motion.div
                              key={index}
                              className="flex gap-2 sm:gap-3"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <div
                                className={`h-5 w-5 rounded-full flex-shrink-0 mt-1.5 ${
                                  index === 0 ? "bg-green-500" : "bg-blue-500"
                                }`}
                              ></div>
                              <div className="pb-2">
                                <div className="text-xs sm:text-sm font-medium">
                                  {log.status_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(log.timestamp)}
                                </div>
                                {log.location && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {log.location}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs sm:text-sm">
                      Chưa có thông tin vận chuyển
                    </p>
                  )}

                  {trackingInfo.tracking_logs &&
                    trackingInfo.tracking_logs.length > 3 && (
                      <div className="mt-3 text-center">
                        <button
                          onClick={toggleTracking}
                          className="text-blue-600 text-xs sm:text-sm hover:text-blue-800 transition-colors"
                        >
                          {showTracking
                            ? "Thu gọn"
                            : "Xem đầy đủ lịch sử vận chuyển"}
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
