import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Tạo icon tùy chỉnh đẹp hơn
const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Thêm style cho popup
const popupStyle = `
  <style>
    .custom-popup {
      font-family: 'Arial', sans-serif;
      font-size: 14px;
      line-height: 1.4;
      padding: 5px 0;
      color: #333;
    }
    .custom-popup-title {
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 5px;
    }
  </style>
`;

const MapWrapper = ({ mapKey, mapPosition, setMapPosition, reverseGeocode }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [mapId] = useState(`map-${Math.random().toString(36).substring(2, 9)}`);

  // Khởi tạo map khi component mount
  useEffect(() => {
    // Đảm bảo rằng chỉ chạy ở phía client
    if (typeof window === 'undefined') return;

    console.log("Khởi tạo bản đồ với vị trí:", mapPosition);

    // Cleanup trước khi khởi tạo map mới
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Đợi một tick để đảm bảo DOM đã được cập nhật
    const timer = setTimeout(() => {
      if (mapRef.current && !mapInstanceRef.current) {
        try {
          // Khởi tạo map mới với các tùy chọn đẹp hơn
          const map = L.map(mapRef.current, {
            center: mapPosition,
            zoom: 13,
            zoomControl: true,
            scrollWheelZoom: true,
            fadeAnimation: true
          });
          
          // Thêm tile layer với style đẹp hơn
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
          }).addTo(map);

          // Tạo marker với popup
          markerRef.current = L.marker(mapPosition, { 
            draggable: true,
            icon: customIcon,
            title: 'Kéo để di chuyển',
            autoPan: true
          }).addTo(map);

          // Thêm popup cho marker
          markerRef.current.bindPopup(
            `${popupStyle}<div class="custom-popup"><div class="custom-popup-title">Vị trí đã chọn</div>Vĩ độ: ${mapPosition[0].toFixed(6)}<br>Kinh độ: ${mapPosition[1].toFixed(6)}</div>`
          );

          // Xử lý sự kiện khi marker được kéo
          markerRef.current.on('dragend', function(e) {
            const position = e.target.getLatLng();
            setMapPosition([position.lat, position.lng]);
            reverseGeocode(position.lat, position.lng);
            
            // Cập nhật popup
            markerRef.current.setPopupContent(
              `${popupStyle}<div class="custom-popup"><div class="custom-popup-title">Vị trí đã chọn</div>Vĩ độ: ${position.lat.toFixed(6)}<br>Kinh độ: ${position.lng.toFixed(6)}</div>`
            );
          });

          // Xử lý sự kiện khi click vào map
          map.on('click', function(e) {
            const { lat, lng } = e.latlng;
            markerRef.current.setLatLng([lat, lng]);
            setMapPosition([lat, lng]);
            reverseGeocode(lat, lng);
            
            // Cập nhật popup
            markerRef.current.setPopupContent(
              `${popupStyle}<div class="custom-popup"><div class="custom-popup-title">Vị trí đã chọn</div>Vĩ độ: ${lat.toFixed(6)}<br>Kinh độ: ${lng.toFixed(6)}</div>`
            );
            markerRef.current.openPopup();
          });

          // Lưu instance của map để có thể xóa sau này
          mapInstanceRef.current = map;
        } catch (error) {
          console.error("Error initializing map:", error);
        }
      }
    }, 0);

    // Cleanup khi component unmount hoặc dependencies thay đổi
    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapKey]); // Chỉ phụ thuộc vào mapKey để tránh khởi tạo lại map khi mapPosition thay đổi

  // Cập nhật vị trí marker và view khi mapPosition thay đổi
  useEffect(() => {
    console.log("mapPosition thay đổi:", mapPosition);
    
    if (markerRef.current && mapInstanceRef.current) {
      console.log("Cập nhật marker và view");
      markerRef.current.setLatLng(mapPosition);
      mapInstanceRef.current.setView(mapPosition, mapInstanceRef.current.getZoom());
      
      // Cập nhật popup
      markerRef.current.setPopupContent(
        `${popupStyle}<div class="custom-popup"><div class="custom-popup-title">Vị trí đã chọn</div>Vĩ độ: ${mapPosition[0].toFixed(6)}<br>Kinh độ: ${mapPosition[1].toFixed(6)}</div>`
      );
    }
  }, [mapPosition]);

  return (
    <div id={mapId} ref={mapRef} style={{ height: '100%', width: '100%' }} />
  );
};

export default MapWrapper; 