import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_ACCESS_TOKEN } from "./MapUtils";
import { FiMapPin } from "react-icons/fi";

// Set access token
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

const OrderMap = ({ shopLocation, customerLocation }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [error, setError] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const markersRef = useRef({ shop: null, customer: null });

  // Initialize map
  useEffect(() => {
    if (mapInitialized) return;

    // Kiểm tra container
    if (!mapContainer.current) {
      const existingContainer = document.getElementById("order-tracking-map");
      if (existingContainer) {
        mapContainer.current = existingContainer;
      } else {
        const parentContainer = document.getElementById("map-container");
        if (parentContainer) {
          const newContainer = document.createElement("div");
          newContainer.id = "order-tracking-map";
          newContainer.className = "absolute inset-0 w-full h-full";
          parentContainer.appendChild(newContainer);
          mapContainer.current = newContainer;
        } else {
          console.error("Map container not found");
          setError(true);
          return;
        }
      }
    }

    // Check required data
    if (
      !shopLocation?.lat ||
      !shopLocation?.lng ||
      !customerLocation?.lat ||
      !customerLocation?.lng
    ) {
      console.error("Missing location data:", {
        shopLocation,
        customerLocation,
      });
      setError(true);
      return;
    }

    console.log("Initializing map with locations:", {
      shop: [shopLocation.lng, shopLocation.lat],
      customer: [customerLocation.lng, customerLocation.lat],
      container: mapContainer.current?.id || "unknown",
    });

    try {
      // Calculate center point between shop and customer
      const centerLng = (shopLocation.lng + customerLocation.lng) / 2;
      const centerLat = (shopLocation.lat + customerLocation.lat) / 2;

      // Create the map
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [105.77, 9.85], // Center between shop and customer
        zoom: 8.5,
        attributionControl: false,
        logoPosition: "bottom-right",
      });

      // Log when the map style is fully loaded
      newMap.on("style.load", () => {
        console.log("Map style loaded - adding markers");

        try {
          // Sử dụng tọa độ từ props
          const shopCoords = [shopLocation.lng, shopLocation.lat];
          const customerCoords = [customerLocation.lng, customerLocation.lat];

          // Tạo marker element đơn giản
          const createMarkerElement = (color, text) => {
            const el = document.createElement("div");
            el.style.width = "30px";
            el.style.height = "30px";
            el.style.borderRadius = "50%";
            el.style.backgroundColor = color;
            el.style.border = "3px solid white";
            el.style.boxShadow = "0 3px 6px rgba(0,0,0,0.5)";
            el.style.color = "white";
            el.style.fontSize = "12px";
            el.style.fontWeight = "bold";
            el.style.display = "flex";
            el.style.alignItems = "center";
            el.style.justifyContent = "center";
            el.style.zIndex = "999";
            el.innerText = text;
            return el;
          };

          // Thêm marker cửa hàng (màu đỏ)
          const shopMarker = new mapboxgl.Marker(
            createMarkerElement("#e74c3c", "SHOP")
          )
            .setLngLat(shopCoords)
            .addTo(newMap);

          markersRef.current.shop = shopMarker;

          // Thêm marker khách hàng (màu xanh)
          const customerMarker = new mapboxgl.Marker(
            createMarkerElement("#3498db", "NHẬN")
          )
            .setLngLat(customerCoords)
            .addTo(newMap);

          markersRef.current.customer = customerMarker;

          // Fit bounds để hiển thị cả 2 điểm
          const bounds = new mapboxgl.LngLatBounds()
            .extend(shopCoords)
            .extend(customerCoords);

          newMap.fitBounds(bounds, { padding: 100 });

          // Thêm đường đi giữa 2 điểm
          newMap.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: [shopCoords, customerCoords],
              },
            },
          });

          newMap.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#2ecc71",
              "line-width": 4,
            },
          });

          console.log("Markers and route added successfully");
        } catch (err) {
          console.error("Error adding markers:", err);
        }
      });

      // Log when the map's initial style batch is loaded (partial rendering)
      newMap.on("styledata", () => {
        console.log("Map style data event - partial style loaded");
      });

      // Log when the map is idle (all resources loaded)
      newMap.on("idle", () => {
        console.log("Map is idle - all resources loaded");
      });

      // Store the map in the window object for debugging
      window.orderTrackingMap = newMap;

      // Add navigation controls
      newMap.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Store map reference
      map.current = newMap;

      // When map loads
      newMap.on("load", () => {
        console.log("Map loaded successfully");

        // Display distance and delivery time
        updateMapInfo();

        // Mark as initialized
        setMapInitialized(true);
      });

      // Handle map error
      newMap.on("error", (e) => {
        console.error("Map error:", e);
        setError(true);
      });
    } catch (err) {
      console.error("Error initializing map:", err);
      setError(true);
    }

    // Cleanup function
    return () => {
      try {
        if (markersRef.current.shop) {
          markersRef.current.shop.remove();
        }
        if (markersRef.current.customer) {
          markersRef.current.customer.remove();
        }
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
        setMapInitialized(false);
      } catch (err) {
        console.error("Error cleaning up map:", err);
      }
    };
  }, [shopLocation, customerLocation, mapInitialized]);

  // Add a retry mechanism for markers that might not appear initially
  useEffect(() => {
    if (!mapInitialized || !map.current) return;

    const retryMarkers = () => {
      console.log("Retrying marker creation");
      try {
        const shopCoords = [shopLocation.lng, shopLocation.lat];
        const customerCoords = [customerLocation.lng, customerLocation.lat];

        // Xóa markers cũ nếu có
        if (markersRef.current.shop) markersRef.current.shop.remove();
        if (markersRef.current.customer) markersRef.current.customer.remove();

        // Tạo lại markers
        const createSimpleMarker = (color, text) => {
          const el = document.createElement("div");
          el.style.width = "25px";
          el.style.height = "25px";
          el.style.borderRadius = "50%";
          el.style.backgroundColor = color;
          el.style.border = "2px solid white";
          el.style.display = "flex";
          el.style.alignItems = "center";
          el.style.justifyContent = "center";
          el.style.color = "white";
          el.style.fontSize = "10px";
          el.style.fontWeight = "bold";
          el.innerText = text;
          return el;
        };

        markersRef.current.shop = new mapboxgl.Marker(
          createSimpleMarker("#e74c3c", "SHOP")
        )
          .setLngLat(shopCoords)
          .addTo(map.current);

        markersRef.current.customer = new mapboxgl.Marker(
          createSimpleMarker("#3498db", "NHẬN")
        )
          .setLngLat(customerCoords)
          .addTo(map.current);

        // Fit bounds
        const bounds = new mapboxgl.LngLatBounds()
          .extend(shopCoords)
          .extend(customerCoords);

        map.current.fitBounds(bounds, { padding: 100 });

        console.log("Markers recreated successfully");
      } catch (err) {
        console.error("Error recreating markers:", err);
      }
    };

    // Thử lại sau 2 giây nếu markers không hiển thị
    const timer = setTimeout(retryMarkers, 2000);
    return () => clearTimeout(timer);
  }, [mapInitialized, shopLocation, customerLocation]);

  // Function to update info below map
  const updateMapInfo = () => {
    try {
      if (
        !shopLocation?.lat ||
        !shopLocation?.lng ||
        !customerLocation?.lat ||
        !customerLocation?.lng
      ) {
        return;
      }

      // Calculate distance (km)
      const R = 6371; // Earth's radius in km
      const dLat = ((customerLocation.lat - shopLocation.lat) * Math.PI) / 180;
      const dLon = ((customerLocation.lng - shopLocation.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((shopLocation.lat * Math.PI) / 180) *
          Math.cos((customerLocation.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = (R * c).toFixed(1);

      // Estimate delivery time (minutes)
      const timeInMinutes = Math.round((distance / 15) * 60);

      setTimeout(() => {
        const infoElement = document.getElementById("map-info");
        if (infoElement) {
          infoElement.innerHTML = `
                  <div class="bg-white p-3 border-t-2 border-green-500 rounded-t-md shadow">
                    <div class="flex justify-between items-center text-sm font-medium">
                      <div>Khoảng cách: <span class="text-blue-600">${distance} km</span></div>
                      <div>Thời gian giao: <span class="text-blue-600">${timeInMinutes} phút</span></div>
                    </div>
                  </div>
                `;
        }
      }, 500);
    } catch (err) {
      console.error("Error updating map info:", err);
    }
  };

  // Only render our own container if we're not using the existing one in OrderDetail.jsx
  const renderOwnContainer = !document.getElementById("order-tracking-map");

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          Bản đồ giao hàng
        </h3>
        <div className="flex flex-wrap gap-3 mt-2 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span>Cửa hàng: {shopLocation?.name}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span>
              Địa chỉ giao hàng: {customerLocation?.address?.split(",")[0]}
            </span>
          </div>
        </div>
      </div>

      <div className="relative">
        {error ? (
          <div className="flex flex-col items-center justify-center h-96 bg-gray-100">
            <FiMapPin className="text-red-500 w-12 h-12 mb-2" />
            <p className="text-gray-700 text-center px-4">
              Không thể tải bản đồ. Vui lòng thử lại sau.
            </p>
          </div>
        ) : renderOwnContainer ? (
          <>
            <div
              ref={mapContainer}
              className="w-full h-96"
              style={{ height: "400px" }}
              id="map-container"
            >
              <div
                id="order-tracking-map"
                className="absolute inset-0"
                style={{ width: "100%", height: "100%", minHeight: "300px" }}
              ></div>
            </div>

            <div
              id="map-info"
              className="absolute bottom-0 left-0 right-0 z-10"
            ></div>
          </>
        ) : (
          <div className="w-full h-96" style={{ height: "400px" }}>
            <p className="text-center text-sm text-gray-500 py-2">
              Sử dụng bản đồ đã có trong trang
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

OrderMap.propTypes = {
  shopLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    name: PropTypes.string,
    address: PropTypes.string,
  }).isRequired,
  customerLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    address: PropTypes.string,
  }).isRequired,
};

export default OrderMap;
