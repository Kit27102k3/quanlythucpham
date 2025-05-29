import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icon in Leaflet with React
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom styled marker
const customIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #51bb1a; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 3px rgba(0,0,0,0.4)"></div>
         <div style="background-color: rgba(81, 187, 26, 0.3); width: 40px; height: 40px; border-radius: 50%; position: absolute; top: -12px; left: -12px; z-index: -1;"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

L.Marker.prototype.options.icon = defaultIcon;

// Component to update map view when position changes
const ChangeMapView = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);
  return null;
};

// Add locate me control
const LocateControl = ({ setPosition, reverseGeocode }) => {
  const map = useMap();
  
  const locateUser = () => {
    map.locate({ setView: true, maxZoom: 18 });
  };
  
  useEffect(() => {
    map.on('locationfound', (e) => {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      if (reverseGeocode) {
        reverseGeocode(lat, lng);
      }
    });
    
    map.on('locationerror', (e) => {
      console.error('Error locating user:', e.message);
      // Show error toast or notification here if needed
    });
    
    return () => {
      map.off('locationfound');
      map.off('locationerror');
    };
  }, [map, setPosition, reverseGeocode]);
  
  return (
    <div className="leaflet-bottom leaflet-left" style={{ zIndex: 1000, marginBottom: '60px' }}>
      <div className="leaflet-control leaflet-bar">
        <button 
          type="button" 
          onClick={locateUser} 
          className="flex items-center justify-center bg-white w-8 h-8 text-blue-600 rounded-sm shadow-md hover:bg-blue-50 focus:outline-none"
          title="Định vị vị trí của tôi"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Custom zoom controls with improved functionality
const CustomZoomControl = () => {
  const map = useMap();
  
  const handleZoomIn = (e) => {
    e.preventDefault();
    map.setZoom(map.getZoom() + 1);
  };
  
  const handleZoomOut = (e) => {
    e.preventDefault();
    map.setZoom(map.getZoom() - 1);
  };
  
  return (
    <div className="leaflet-bottom leaflet-right" style={{ zIndex: 999, marginBottom: '20px', marginRight: '10px' }}>
      <div className="leaflet-control leaflet-bar">
        <a 
          href="#" 
          onClick={handleZoomIn}
          className="flex items-center justify-center bg-white w-8 h-8 text-gray-700 hover:bg-gray-100 border-b border-gray-300"
          title="Phóng to"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </a>
        <a 
          href="#" 
          onClick={handleZoomOut}
          className="flex items-center justify-center bg-white w-8 h-8 text-gray-700 hover:bg-gray-100"
          title="Thu nhỏ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </a>
      </div>
    </div>
  );
};

// Component to handle map events
const MapEventHandler = ({ setPosition, reverseGeocode }) => {
  const map = useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      if (reverseGeocode) {
        reverseGeocode(lat, lng);
      }
    },
    dragend: () => {
      // Update center when map is dragged
      const center = map.getCenter();
      setPosition([center.lat, center.lng]);
    },
    zoomend: () => {
      // Ensure maximum detail level is loaded when zooming
      const center = map.getCenter();
      setPosition([center.lat, center.lng]);
    }
  });
  
  // Allow zooming beyond the default limits
  useEffect(() => {
    if (map) {
      map.setMinZoom(5);  // Allow zooming out to country level
      map.setMaxZoom(22); // Allow very detailed zoom in
    }
  }, [map]);
  
  return null;
};

// Component for draggable marker
const DraggableMarker = ({ position, setPosition, reverseGeocode }) => {
  const eventHandlers = {
    dragend(e) {
      const marker = e.target;
      const position = marker.getLatLng();
      setPosition([position.lat, position.lng]);
      if (reverseGeocode) {
        reverseGeocode(position.lat, position.lng);
      }
    },
  };

  return (
    <Marker 
      position={position} 
      draggable={true}
      eventHandlers={eventHandlers}
      icon={customIcon}
    />
  );
};

// Search control component
const MapSearch = ({ onSearch }) => {
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const searchTimeoutRef = useRef(null);
  const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Tìm kiếm địa điểm khi nhập với delay để tránh gọi API quá nhiều
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    setErrorMessage('');
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (value.trim().length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    // Delay 500ms trước khi gọi API để tránh gọi quá nhiều
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 500);
  };
  
  // Hàm tìm kiếm địa điểm sử dụng OpenStreetMap hoặc Mapbox
  const searchLocations = async (query) => {
    if (!query || query.trim().length < 3) return;
    
    setIsSearching(true);
    setErrorMessage('');
    
    try {
      // Thử tìm kiếm qua Mapbox trước (nếu có token)
      if (MAPBOX_ACCESS_TOKEN) {
        try {
          const mapboxResponse = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=vn&language=vi&access_token=${MAPBOX_ACCESS_TOKEN}&limit=5`
          );
          
          if (mapboxResponse.ok) {
            const data = await mapboxResponse.json();
            
            if (data && data.features && data.features.length > 0) {
              const formattedResults = data.features.map(feature => {
                const mainPart = feature.text || '';
                const secondaryPart = feature.place_name.replace(mainPart + ', ', '');
                
                return {
                  display: feature.place_name,
                  mainPart: mainPart,
                  secondaryPart: secondaryPart,
                  lat: feature.center[1],
                  lng: feature.center[0]
                };
              });
              
              setSearchResults(formattedResults);
              setShowResults(true);
              setIsSearching(false);
              return;
            }
          }
        } catch (error) {
          console.log('Không thể tìm kiếm qua Mapbox, thử OpenStreetMap:', error);
          // Tiếp tục sử dụng OpenStreetMap nếu Mapbox không hoạt động
        }
      }
      
      // Sử dụng OpenStreetMap Nominatim API (giải pháp dự phòng)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout sau 5 giây
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=vn&accept-language=vi&addressdetails=1`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'FoodManagementApp/1.0' // Tạo user-agent cụ thể để tuân thủ quy định của OSM
          }
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        // Định dạng kết quả tìm kiếm để hiển thị
        const formattedResults = data.map(item => {
          // Tách các thành phần địa chỉ để hiển thị rõ ràng hơn
          const address = item.address || {};
          const mainPart = [
            address.house_number,
            address.road,
            address.neighbourhood,
            address.hamlet,
            address.village
          ].filter(Boolean).join(', ');
          
          const secondaryPart = [
            address.suburb,
            address.town || address.city,
            address.district,
            address.state || address.province
          ].filter(Boolean).join(', ');
          
          return {
            display: item.display_name,
            mainPart: mainPart || item.display_name.split(',')[0],
            secondaryPart,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          };
        });
        
        setSearchResults(formattedResults);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
        setErrorMessage('Không tìm thấy địa điểm. Vui lòng thử từ khóa khác.');
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm địa điểm:', error);
      setSearchResults([]);
      setShowResults(false);
      
      if (error.name === 'AbortError') {
        setErrorMessage('Tìm kiếm bị hủy do mất kết nối. Vui lòng thử lại.');
      } else if (error.message.includes('Failed to fetch')) {
        setErrorMessage('Không thể kết nối đến máy chủ tìm kiếm. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setErrorMessage('Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSearching(false);
    }
  };
  
  // Xử lý khi gửi form tìm kiếm
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchValue.trim() || searchValue.length < 3) return;
    
    setErrorMessage('');
    setIsSearching(true);
    
    try {
      // Thử tìm kiếm qua Mapbox trước (nếu có token)
      if (MAPBOX_ACCESS_TOKEN) {
        try {
          const mapboxResponse = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchValue)}.json?country=vn&language=vi&access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`
          );
          
          if (mapboxResponse.ok) {
            const data = await mapboxResponse.json();
            
            if (data && data.features && data.features.length > 0) {
              const feature = data.features[0];
              onSearch([feature.center[1], feature.center[0]]);
              setIsSearching(false);
              setShowResults(false);
              if (isMobile) setIsExpanded(false);
              return;
            }
          }
        } catch (error) {
          console.log('Không thể tìm kiếm qua Mapbox, thử OpenStreetMap:', error);
        }
      }
      
      // Sử dụng OpenStreetMap Nominatim API (giải pháp dự phòng)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout sau 5 giây
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchValue)}&limit=1&countrycodes=vn&accept-language=vi&addressdetails=1`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'FoodManagementApp/1.0'
          }
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        onSearch([parseFloat(lat), parseFloat(lon)]);
      } else {
        setErrorMessage('Không tìm thấy địa điểm. Vui lòng thử từ khóa khác.');
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm địa điểm:', error);
      
      if (error.name === 'AbortError') {
        setErrorMessage('Tìm kiếm bị hủy do mất kết nối. Vui lòng thử lại.');
      } else if (error.message.includes('Failed to fetch')) {
        setErrorMessage('Không thể kết nối đến máy chủ tìm kiếm. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setErrorMessage('Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSearching(false);
      setShowResults(false);
      if (isMobile) {
        setIsExpanded(false);
      }
    }
  };
  
  // Xử lý khi chọn một kết quả
  const handleSelectResult = (result) => {
    setSearchValue(result.display);
    onSearch([result.lat, result.lng]);
    setShowResults(false);
    setErrorMessage('');
  };
  
  // Xử lý khi muốn tìm kiếm thủ công trên bản đồ
  const handleManualSearch = () => {
    setErrorMessage('');
    setShowResults(false);
    setSearchValue('');
    // Hiển thị thông báo hướng dẫn người dùng
    alert('Vui lòng nhấp chuột vào vị trí trên bản đồ để chọn địa điểm.');
  };
  
  // Hiển thị nút tìm kiếm thu gọn trên thiết bị di động
  if (isMobile && !isExpanded) {
    return (
      <div className="leaflet-top leaflet-right" style={{ zIndex: 1000 }}>
        <div className="leaflet-control leaflet-bar">
          <button 
            type="button" 
            onClick={() => setIsExpanded(true)} 
            className="flex items-center justify-center bg-white w-8 h-8 text-gray-700 rounded-sm shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="leaflet-top leaflet-right" style={{ zIndex: 1000 }}>
      <div className="leaflet-control leaflet-bar p-2 bg-white shadow-md rounded-md">
        {isMobile && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-700">Tìm kiếm địa điểm</span>
            <button 
              type="button" 
              onClick={() => setIsExpanded(false)} 
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <form onSubmit={handleSearch} className="flex items-center">
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchInput}
            placeholder="Tìm ấp, hẻm, đường, phường..."
            className="p-1.5 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            style={{ width: isMobile ? '200px' : '220px' }}
          />
          <button 
            type="submit" 
            className="bg-green-500 text-white p-1.5 rounded-r-md hover:bg-green-600"
            disabled={isSearching}
          >
            {isSearching ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
        </form>
        
        {/* Hiển thị thông báo lỗi */}
        {errorMessage && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
            <p className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errorMessage}
            </p>
            <button 
              onClick={handleManualSearch}
              className="mt-1 text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Chọn vị trí trực tiếp trên bản đồ
            </button>
          </div>
        )}
        
        {/* Kết quả tìm kiếm */}
        {showResults && searchResults.length > 0 && (
          <div className="mt-2 bg-white border border-gray-200 rounded-md shadow-lg overflow-y-auto max-h-60">
            <ul className="divide-y divide-gray-100">
              {searchResults.map((result, index) => (
                <li 
                  key={index} 
                  className="p-2 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSelectResult(result)}
                >
                  <div className="text-sm font-medium text-gray-800">{result.mainPart}</div>
                  <div className="text-xs text-gray-500">{result.secondaryPart}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Hướng dẫn tìm kiếm */}
        {!errorMessage && !showResults && (
          <div className="mt-2 text-xs text-gray-600">
            <p className="font-medium mb-1">Mẹo tìm kiếm:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Tìm "Ấp 2, Long Hưng" cho khu vực ấp</li>
              <li>Tìm "Hẻm 123, Lê Văn Việt" cho hẻm</li>
              <li>Nhập tên đường, phường, huyện càng chi tiết càng tốt</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const MapComponent = ({ position, setPosition, reverseGeocode }) => {
  const [isBrowser, setIsBrowser] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapStyle, setMapStyle] = useState("streets-v12"); // Default style
  const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    setIsBrowser(typeof window !== 'undefined');
  }, []);

  const handleSearchResult = (newPosition) => {
    setPosition(newPosition);
    if (reverseGeocode) {
      reverseGeocode(newPosition[0], newPosition[1]);
    }
  };

  // Function to toggle between map styles
  const toggleMapStyle = () => {
    setMapStyle(prevStyle => 
      prevStyle === "streets-v12" ? "satellite-streets-v12" : "streets-v12"
    );
  };

  if (!isBrowser) {
    return <div className="h-full w-full bg-gray-200 flex items-center justify-center">Loading map...</div>;
  }

  return (
    <MapContainer 
      center={position} 
      zoom={18} // Start with a higher zoom level for more detail
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
      zoomControl={false}
      whenReady={() => setIsMapReady(true)}
      maxZoom={22} // Allow very detailed zoom in
      minZoom={5}  // Allow zooming out to country level
    >
      <TileLayer
        attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={`https://api.mapbox.com/styles/v1/mapbox/${mapStyle}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`}
        maxZoom={22}
        maxNativeZoom={19} // Maximum zoom level for which the tile server provides tiles
        tileSize={512}
        zoomOffset={-1}
      />
      <CustomZoomControl />
      <DraggableMarker 
        position={position} 
        setPosition={setPosition} 
        reverseGeocode={reverseGeocode}
      />
      <MapEventHandler 
        setPosition={setPosition} 
        reverseGeocode={reverseGeocode}
      />
      <ChangeMapView position={position} />
      {isMapReady && (
        <>
          <MapSearch onSearch={handleSearchResult} />
          <LocateControl setPosition={setPosition} reverseGeocode={reverseGeocode} />
          {/* Map Style Toggle Button */}
          <div className="leaflet-bottom leaflet-left" style={{ zIndex: 1000, marginBottom: '110px' }}>
            <div className="leaflet-control leaflet-bar">
              <button 
                type="button" 
                onClick={toggleMapStyle} 
                className="flex items-center justify-center bg-white w-8 h-8 text-gray-700 rounded-sm shadow-md hover:bg-gray-100 focus:outline-none"
                title={mapStyle === "streets-v12" ? "Chuyển sang chế độ vệ tinh" : "Chuyển sang chế độ đường phố"}
              >
                {mapStyle === "streets-v12" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </MapContainer>
  );
};

export default MapComponent; 