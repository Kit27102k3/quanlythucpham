import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_ACCESS_TOKEN } from './MapUtils';
import { TruckIcon, PackageIcon, HomeIcon, FactoryIcon, ClockIcon } from "lucide-react";

// Đảm bảo token Mapbox được thiết lập
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

/**
 * Bản đồ theo dõi đơn hàng qua các kho trung chuyển
 * Hiển thị vị trí hiện tại của đơn hàng dựa trên thời gian
 * @param {Object} props
 * @param {Object} props.shopLocation - Vị trí cửa hàng
 * @param {Object} props.customerLocation - Vị trí khách hàng
 * @param {Array} props.warehouses - Danh sách các kho trung chuyển
 * @param {Object} props.order - Thông tin đơn hàng
 * @param {Date} props.currentTime - Thời gian hiện tại
 */
const WarehouseTrackingMap = ({ shopLocation, customerLocation, warehouses, order, currentTime, orderId }) => {
  const mapContainerRef = useRef(null);
  const map = useRef(null);
  const markersRef = useRef({});
  const animationRef = useRef(null);
  const [activePoint, setActivePoint] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [currentPosition, setCurrentPosition] = useState(null);
  const [activeWarehouseIndex, setActiveWarehouseIndex] = useState(-1);

  // Hàm tính toán vị trí hiện tại dựa trên thời gian
  const calculateCurrentPosition = (currentTime) => {
    if (!warehouses || warehouses.length === 0 || !shopLocation || !customerLocation) {
      return shopLocation;
    }

    // Thêm điểm xuất phát (shop) và điểm đích (customer) vào mảng điểm
    const allPoints = [
      { ...shopLocation, arrivalTime: new Date(new Date().getTime() - 3600000).toISOString(), departureTime: new Date(new Date().getTime() - 3540000).toISOString() },
      ...warehouses,
      { ...customerLocation, arrivalTime: new Date(new Date().getTime() + 3600000).toISOString(), departureTime: null }
    ];

    // Tìm điểm hiện tại dựa trên thời gian
    const now = currentTime || new Date();
    
    // Nếu chưa đến thời gian xuất phát, trả về vị trí shop
    if (new Date(allPoints[0].departureTime) > now) {
      setActiveWarehouseIndex(-1);
      return allPoints[0];
    }
    
    // Nếu đã đến điểm cuối, trả về vị trí khách hàng
    if (new Date(allPoints[allPoints.length - 2].departureTime) < now) {
      setActiveWarehouseIndex(warehouses.length);
      return allPoints[allPoints.length - 1];
    }
    
    // Tìm đoạn đường hiện tại
    for (let i = 0; i < allPoints.length - 1; i++) {
      const startPoint = allPoints[i];
      const endPoint = allPoints[i + 1];
      
      const startTime = new Date(startPoint.departureTime);
      const endTime = new Date(endPoint.arrivalTime);
      
      // Nếu thời gian hiện tại nằm trong khoảng này
      if (startTime <= now && now <= endTime) {
        // Tính toán tỷ lệ hoàn thành của đoạn đường
        const totalDuration = endTime - startTime;
        const elapsedDuration = now - startTime;
        const ratio = totalDuration > 0 ? elapsedDuration / totalDuration : 0;
        
        // Nội suy tuyến tính giữa 2 điểm
        const lat = startPoint.lat + (endPoint.lat - startPoint.lat) * ratio;
        const lng = startPoint.lng + (endPoint.lng - startPoint.lng) * ratio;
        
        // Cập nhật kho đang hoạt động (để hiển thị trên timeline)
        setActiveWarehouseIndex(i);
        
        return {
          lat,
          lng,
          inTransit: true,
          from: startPoint,
          to: endPoint,
          ratio
        };
      }
      
      // Nếu đang ở tại một kho (giữa thời gian đến và đi)
      if (new Date(startPoint.arrivalTime) <= now && now <= new Date(startPoint.departureTime)) {
        setActiveWarehouseIndex(i);
        return {
          ...startPoint,
          inTransit: false
        };
      }
    }
    
    // Mặc định trả về vị trí shop
    return allPoints[0];
  };

  // Thêm key vào dependency của useEffect để khởi tạo lại map khi orderId thay đổi
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    console.log("Initializing map for order ID:", orderId);
    
    // Cleanup previous map instance if exists
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    
    // Khởi tạo bản đồ
    const newMap = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [105.7855, 10.0339], // Mặc định ở Cần Thơ
      zoom: 9,
      trackUserLocation: false,
      collectResourceTiming: false,
      localIdeographFontFamily: "'Noto Sans', 'Noto Sans CJK SC', sans-serif"
    });
    
    // Thêm các controls
    newMap.addControl(new mapboxgl.NavigationControl());
    
    map.current = newMap;
    
    // Đợi map load xong
    newMap.on('load', () => {
      console.log("Map loaded for order ID:", orderId);
      
      // Thêm source và layer cho đường đi
      newMap.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });
      
      newMap.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3887be',
          'line-width': 5,
          'line-opacity': 0.75
        }
      });
      
      // Thêm source và layer cho vị trí hiện tại
      newMap.addSource('current-position', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [shopLocation?.lng || 105.7855, shopLocation?.lat || 10.0339]
          }
        }
      });
      
      newMap.addLayer({
        id: 'current-position',
        type: 'circle',
        source: 'current-position',
        paint: {
          'circle-radius': 10,
          'circle-color': '#007cbf',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });
      
      // Thêm hiệu ứng pulse cho vị trí hiện tại
      newMap.addLayer({
        id: 'current-position-pulse',
        type: 'circle',
        source: 'current-position',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'pulse'], 0, 5, 1, 25],
          'circle-opacity': ['interpolate', ['linear'], ['get', 'pulse'], 0, 0.7, 1, 0],
          'circle-color': '#007cbf',
          'circle-stroke-width': 0
        }
      });
      
      // Cập nhật dữ liệu ban đầu
      updateMapData();
      
      // Bắt đầu animation
      startAnimation();
    });
    
    // Cleanup khi unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      // Xóa tất cả markers hiện tại
      if (markersRef.current) {
        Object.values(markersRef.current).forEach(marker => marker.remove());
        markersRef.current = {};
      }
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [orderId]);
  
  // Cập nhật dữ liệu khi props thay đổi (ngoài orderId)
  useEffect(() => {
    if (map.current && map.current.loaded()) {
      console.log("Updating map data for order ID:", orderId);
      updateMapData();
    }
  }, [warehouses, shopLocation, customerLocation, orderId]);
  
  // Cập nhật vị trí hiện tại theo thời gian
  useEffect(() => {
    const position = calculateCurrentPosition(currentTime);
    setCurrentPosition(position);
    setActivePoint(position);
    
    // Cập nhật vị trí hiện tại trên bản đồ
    if (map.current && map.current.loaded() && map.current.getSource('current-position')) {
      map.current.getSource('current-position').setData({
        type: 'Feature',
        properties: {
          pulse: 0
        },
        geometry: {
          type: 'Point',
          coordinates: [position.lng, position.lat]
        }
      });
      
      // Cập nhật popup nếu cần
      updateCurrentPositionPopup(position);
    }
  }, [currentTime, warehouses, shopLocation, customerLocation, orderId]);
  
  // Hàm cập nhật dữ liệu bản đồ
  const updateMapData = () => {
    const mapInstance = map.current;
    if (!mapInstance || !mapInstance.loaded()) return;
    
    // Xóa tất cả markers hiện tại
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};
    
    // Thêm marker cho shop
    if (shopLocation) {
      const shopEl = document.createElement('div');
      shopEl.className = 'shop-marker';
      shopEl.style.width = '30px';
      shopEl.style.height = '30px';
      shopEl.style.backgroundImage = 'url(https://maps.google.com/mapfiles/ms/icons/green-dot.png)';
      shopEl.style.backgroundSize = 'cover';
      
      const shopMarker = new mapboxgl.Marker(shopEl)
        .setLngLat([shopLocation.lng, shopLocation.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>Chi nhánh</h3><p>${shopLocation.name || shopLocation.address}</p>`))
        .addTo(mapInstance);
      
      markersRef.current.shop = shopMarker;
    }
    
    // Thêm markers cho các kho
    if (warehouses) {
      warehouses.forEach((warehouse, index) => {
        const warehouseEl = document.createElement('div');
        warehouseEl.className = 'warehouse-marker';
        warehouseEl.style.width = '25px';
        warehouseEl.style.height = '25px';
        warehouseEl.style.backgroundImage = 'url(https://maps.google.com/mapfiles/ms/icons/blue-dot.png)';
        warehouseEl.style.backgroundSize = 'cover';
        
        const arrivalTime = new Date(warehouse.arrivalTime).toLocaleString();
        const departureTime = new Date(warehouse.departureTime).toLocaleString();
        
        const warehouseMarker = new mapboxgl.Marker(warehouseEl)
          .setLngLat([warehouse.lng, warehouse.lat])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <h3>Kho ${index + 1}: ${warehouse.name}</h3>
            <p>${warehouse.address}</p>
            <p><strong>Đến:</strong> ${arrivalTime}</p>
            <p><strong>Đi:</strong> ${departureTime}</p>
          `))
          .addTo(mapInstance);
        
        markersRef.current[`warehouse_${index}`] = warehouseMarker;
      });
    }
    
    // Thêm marker cho khách hàng
    if (customerLocation) {
      const customerEl = document.createElement('div');
      customerEl.className = 'customer-marker';
      customerEl.style.width = '30px';
      customerEl.style.height = '30px';
      customerEl.style.backgroundImage = 'url(https://maps.google.com/mapfiles/ms/icons/red-dot.png)';
      customerEl.style.backgroundSize = 'cover';
      
      const customerMarker = new mapboxgl.Marker(customerEl)
        .setLngLat([customerLocation.lng, customerLocation.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>Địa chỉ giao hàng</h3><p>${customerLocation.address}</p>`))
        .addTo(mapInstance);
      
      markersRef.current.customer = customerMarker;
    }
    
    // Cập nhật đường đi
    if (mapInstance.getSource('route')) {
      // Tạo mảng tọa độ cho đường đi
      const coordinates = [
        shopLocation ? [shopLocation.lng, shopLocation.lat] : null,
        ...(warehouses || []).map(w => [w.lng, w.lat]),
        customerLocation ? [customerLocation.lng, customerLocation.lat] : null
      ].filter(Boolean);
      
      mapInstance.getSource('route').setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates
        }
      });
      
      // Fit bounds để nhìn thấy toàn bộ đường đi
      if (coordinates.length > 1) {
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
        
        mapInstance.fitBounds(bounds, {
          padding: 50
        });
      }
    }
  };
  
  // Hàm cập nhật popup cho vị trí hiện tại
  const updateCurrentPositionPopup = (position) => {
    if (!position || !map.current) return;
    
    // Xóa popup cũ nếu có
    const existingPopup = document.querySelector('.mapboxgl-popup.current-position-popup');
    if (existingPopup) {
      existingPopup.remove();
    }
    
    if (position.inTransit) {
      // Đang di chuyển giữa 2 điểm
      const from = position.from;
      const to = position.to;
      const progress = Math.round(position.ratio * 100);
      
      new mapboxgl.Popup({ closeButton: false, className: 'current-position-popup' })
        .setLngLat([position.lng, position.lat])
        .setHTML(`
          <div style="padding: 10px;">
            <h4 style="margin: 0 0 5px 0;">Đang vận chuyển</h4>
            <p style="margin: 0 0 5px 0;">Từ: ${from.name || 'Cửa hàng'}</p>
            <p style="margin: 0 0 5px 0;">Đến: ${to.name || 'Địa chỉ giao hàng'}</p>
            <div style="background: #eee; height: 5px; border-radius: 5px; overflow: hidden;">
              <div style="background: #3887be; width: ${progress}%; height: 100%;"></div>
            </div>
            <p style="text-align: center; margin: 5px 0 0 0;">${progress}%</p>
          </div>
        `)
        .addTo(map.current);
    } else {
      // Đang ở một điểm cụ thể
      let locationName = 'Không xác định';
      let status = 'Đang chờ';
      
      if (position === shopLocation) {
        locationName = shopLocation.name || 'Cửa hàng';
        status = 'Đang chuẩn bị đơn hàng';
      } else if (position === customerLocation) {
        locationName = 'Địa chỉ giao hàng';
        status = 'Đã giao hàng';
      } else {
        locationName = position.name || 'Kho trung chuyển';
        status = 'Đang xử lý tại kho';
      }
      
      new mapboxgl.Popup({ closeButton: false, className: 'current-position-popup' })
        .setLngLat([position.lng, position.lat])
        .setHTML(`
          <div style="padding: 10px;">
            <h4 style="margin: 0 0 5px 0;">${locationName}</h4>
            <p style="margin: 0;">${status}</p>
          </div>
        `)
        .addTo(map.current);
    }
  };
  
  // Animation cho vị trí hiện tại
  const startAnimation = () => {
    let start;
    
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / 2000; // 2 giây cho một chu kỳ
      
      if (map.current && map.current.loaded() && map.current.getSource('current-position')) {
        map.current.getSource('current-position').setData({
          type: 'Feature',
          properties: {
            pulse: (progress % 1)
          },
          geometry: {
            type: 'Point',
            coordinates: currentPosition ? [currentPosition.lng, currentPosition.lat] : [105.7855, 10.0339]
          }
        });
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="warehouse-tracking-map-container" style={{ position: 'relative', width: '100%', height: '400px' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Thông tin vị trí hiện tại */}
      {currentPosition && (
        <div className="current-position-info" style={{ 
          position: 'absolute', 
          bottom: '10px', 
          left: '10px', 
          background: 'white', 
          padding: '10px', 
          borderRadius: '4px',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          maxWidth: '300px'
        }}>
          <h4 style={{ margin: '0 0 5px 0' }}>Vị trí hiện tại</h4>
          {currentPosition.inTransit ? (
            <>
              <p style={{ margin: '0 0 5px 0' }}>
                Đang vận chuyển từ <strong>{currentPosition.from?.name || 'Cửa hàng'}</strong> đến <strong>{currentPosition.to?.name || 'Điểm giao hàng'}</strong>
              </p>
              <div style={{ background: '#eee', height: '5px', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ background: '#3887be', width: `${Math.round(currentPosition.ratio * 100)}%`, height: '100%' }}></div>
              </div>
              <p style={{ textAlign: 'center', margin: '5px 0 0 0' }}>{Math.round(currentPosition.ratio * 100)}%</p>
            </>
          ) : (
            <p style={{ margin: '0' }}>
              {currentPosition === shopLocation ? 'Đang chuẩn bị tại cửa hàng' : 
               currentPosition === customerLocation ? 'Đã giao hàng' : 
               `Đang xử lý tại ${currentPosition.name || 'kho'}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

WarehouseTrackingMap.propTypes = {
  shopLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    address: PropTypes.string
  }).isRequired,
  customerLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    address: PropTypes.string
  }),
  warehouses: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      address: PropTypes.string.isRequired,
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
      arrivalTime: PropTypes.string.isRequired,
      departureTime: PropTypes.string.isRequired
    })
  ),
  order: PropTypes.object,
  currentTime: PropTypes.instanceOf(Date).isRequired,
  orderId: PropTypes.string.isRequired
};

WarehouseTrackingMap.defaultProps = {
  warehouses: [],
  order: null
};

export default WarehouseTrackingMap; 