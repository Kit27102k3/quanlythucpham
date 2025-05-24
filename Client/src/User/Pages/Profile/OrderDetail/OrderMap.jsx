/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState, useCallback } from "react";
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
  const [loading, setLoading] = useState(true);
  const locationUpdatedRef = useRef(false);
  const routeAddedRef = useRef(false);

  // Helper function to add markers and route - moved outside useEffect for reuse
  const addMarkersAndRoute = useCallback(
    (mapInstance) => {
      if (!mapInstance || !shopLocation?.lat || !customerLocation?.lat) {
        return;
      }

      const shopCoords = [shopLocation.lng, shopLocation.lat];
      const customerCoords = [customerLocation.lng, customerLocation.lat];

      try {
        // Remove existing markers if any
        if (markersRef.current.shop) markersRef.current.shop.remove();
        if (markersRef.current.customer) markersRef.current.customer.remove();

        // Create marker element
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

        // Add shop marker
        const shopMarker = new mapboxgl.Marker(
          createMarkerElement("#e74c3c", "SHOP")
        )
          .setLngLat(shopCoords)
          .addTo(mapInstance);
        markersRef.current.shop = shopMarker;

        // Add customer marker
        const customerMarker = new mapboxgl.Marker(
          createMarkerElement("#3498db", "NHẬN")
        )
          .setLngLat(customerCoords)
          .addTo(mapInstance);
        markersRef.current.customer = customerMarker;

        // Fit bounds to show both markers
        const bounds = new mapboxgl.LngLatBounds()
          .extend(shopCoords)
          .extend(customerCoords);
        mapInstance.fitBounds(bounds, { padding: 100 });

        // Add or update route line
        if (mapInstance.getSource("route")) {
          // Update existing source
          mapInstance.getSource("route").setData({
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [shopCoords, customerCoords],
            },
          });
        } else {
          // Add new source and layer
          mapInstance.addSource("route", {
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

          mapInstance.addLayer({
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
        }

        routeAddedRef.current = true;

        // Update map info
        updateMapInfo();
      } catch (err) {
        console.error("Error adding markers and route:", err);
      }
    },
    [shopLocation, customerLocation]
  );

  // Initialize map
  useEffect(() => {
    if (mapInitialized) return;

    const initializeMapContainer = () => {
      // First try to find existing container
      const existingContainer = document.getElementById("order-tracking-map");
      if (existingContainer) {
        mapContainer.current = existingContainer;
        return true;
      }

      // If not found, try to find or create parent container
      let parentContainer = document.getElementById("map-container");
      if (!parentContainer) {
        // Create parent container if it doesn't exist
        parentContainer = document.createElement("div");
        parentContainer.id = "map-container";
        parentContainer.className = "relative w-full h-full min-h-[300px]";

        // Find a suitable place to insert the container
        const mapSection = document.getElementById("order-map-section");
        if (mapSection) {
          mapSection.appendChild(parentContainer);
        } else {
          // If no section found, create one
          const newSection = document.createElement("div");
          newSection.id = "order-map-section";
          newSection.className = "w-full h-full";
          newSection.appendChild(parentContainer);
          document.body.appendChild(newSection);
        }
      }

      // Create map container
      const newContainer = document.createElement("div");
      newContainer.id = "order-tracking-map";
      newContainer.className = "absolute inset-0 w-full h-full";
      parentContainer.appendChild(newContainer);
      mapContainer.current = newContainer;

      return true;
    };

    // Try to initialize container with retries
    let retryCount = 0;
    const maxRetries = 3;

    const attemptInitialization = () => {
      if (retryCount >= maxRetries) {
        console.error(
          "Failed to initialize map container after",
          maxRetries,
          "attempts"
        );
        setError(true);
        setLoading(false);
        return;
      }

      if (!initializeMapContainer()) {
        retryCount++;
        setTimeout(attemptInitialization, 500 * retryCount);
        return;
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
        setLoading(false);
        return;
      }

      try {
        // Calculate center point between shop and customer
        const centerLng = (shopLocation.lng + customerLocation.lng) / 2;
        const centerLat = (shopLocation.lat + customerLocation.lat) / 2;

        // Create the map
        const newMap = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [centerLng, centerLat],
          zoom: 8.5,
          attributionControl: false,
          logoPosition: "bottom-right",
          preserveDrawingBuffer: true, // Helps with rendering issues
        });

        // Add loading indicator
        const loadingEl = document.createElement("div");
        loadingEl.className = "map-loading-indicator";
        loadingEl.style.position = "absolute";
        loadingEl.style.top = "50%";
        loadingEl.style.left = "50%";
        loadingEl.style.transform = "translate(-50%, -50%)";
        loadingEl.style.backgroundColor = "rgba(255,255,255,0.8)";
        loadingEl.style.padding = "10px 15px";
        loadingEl.style.borderRadius = "8px";
        loadingEl.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
        loadingEl.style.zIndex = "500";
        loadingEl.innerHTML = "<div>Đang tải bản đồ...</div>";
        mapContainer.current.appendChild(loadingEl);

        // Store map reference early
        map.current = newMap;
        window.orderTrackingMap = newMap;

        // Add navigation controls
        newMap.addControl(new mapboxgl.NavigationControl(), "top-right");

        // When map style loads (this happens before the full map loads)
        newMap.on("style.load", () => {
          try {
            // Add markers and route as soon as style loads
            addMarkersAndRoute(newMap);
            // Remove loading indicator
            loadingEl.remove();
            setLoading(false);
          } catch (err) {
            console.error("Error adding markers on style load:", err);
          }
        });

        // When map fully loads
        newMap.on("load", () => {
          setMapInitialized(true);
          locationUpdatedRef.current = true;

          // If markers weren't added during style.load, add them now
          if (!routeAddedRef.current) {
            addMarkersAndRoute(newMap);
          }

          setLoading(false);
        });

        // Handle map error
        newMap.on("error", (e) => {
          console.error("Map error:", e);
          setError(true);
          setLoading(false);
        });
      } catch (err) {
        console.error("Error initializing map:", err);
        setError(true);
        setLoading(false);
      }
    };

    // Only attempt initialization if we have valid coordinates
    if (customerLocation?.lat && customerLocation?.lng) {
      attemptInitialization();
    }

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      if (markersRef.current.shop) {
        markersRef.current.shop.remove();
      }
      if (markersRef.current.customer) {
        markersRef.current.customer.remove();
      }
      setMapInitialized(false);
      locationUpdatedRef.current = false;
      routeAddedRef.current = false;
    };
  }, [shopLocation, customerLocation, mapInitialized, addMarkersAndRoute]);

  // Effect to handle customer location updates after map is initialized
  useEffect(() => {
    // Skip if map isn't initialized yet or we don't have valid coordinates
    if (
      !mapInitialized ||
      !map.current ||
      !customerLocation?.lat ||
      !customerLocation?.lng
    ) {
      return;
    }

    // Skip if this is the initial location we used to create the map
    if (locationUpdatedRef.current) {
      locationUpdatedRef.current = false;
      return;
    }

    // Use the shared function to update markers and route
    addMarkersAndRoute(map.current);
  }, [customerLocation, mapInitialized, addMarkersAndRoute]);

  // Add a retry mechanism for markers that might not appear initially
  useEffect(() => {
    if (!mapInitialized || !map.current) return;

    // Try again after map is fully loaded
    const retryMarkersTimer = setTimeout(() => {
      if (!routeAddedRef.current) {
        addMarkersAndRoute(map.current);
      }
    }, 1000);

    return () => clearTimeout(retryMarkersTimer);
  }, [mapInitialized, addMarkersAndRoute]);

  // Function to update map info display
  const updateMapInfo = () => {
    try {
      if (!customerLocation || !shopLocation) return;

      // Calculate distance between shop and customer
      const distance = calculateDistance(
        shopLocation.lat,
        shopLocation.lng,
        customerLocation.lat,
        customerLocation.lng
      );

      // Calculate estimated delivery time (30km/h average speed)
      const estimatedMinutes = Math.ceil((distance / 30) * 60);

      // Update info element if it exists
      const infoElement = document.getElementById("map-info");
      if (infoElement) {
        infoElement.innerHTML = `
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs">
            <div class="flex items-center gap-2">
              <span class="inline-block w-3 h-3 rounded-full bg-green-500"></span>
              <span class="font-medium text-gray-700">Cửa hàng → Địa chỉ nhận hàng</span>
            </div>
            <div class="flex gap-4">
              <div><span class="font-medium text-blue-600">Khoảng cách:</span> ${distance.toFixed(
                1
              )} km</div>
              <div><span class="font-medium text-blue-600">Thời gian ước tính:</span> ${estimatedMinutes} phút</div>
            </div>
          </div>
        `;
      }
    } catch (err) {
      console.error("Error updating map info:", err);
    }
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Force redraw after component mount
  useEffect(() => {
    const forceRedrawTimer = setTimeout(() => {
      if (map.current && mapInitialized) {
        map.current.resize();

        // If route still not visible, try adding it again
        if (!routeAddedRef.current) {
          addMarkersAndRoute(map.current);
        }
      }
    }, 1500);

    return () => clearTimeout(forceRedrawTimer);
  }, [mapInitialized, addMarkersAndRoute]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <FiMapPin className="mx-auto text-red-500 mb-2" size={24} />
        <p className="text-red-700 text-sm">
          Không thể tải bản đồ. Vui lòng làm mới trang và thử lại.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Làm mới trang
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div
        id="map-info"
        className="mb-2 text-xs text-gray-500 p-2 bg-gray-50 rounded"
      ></div>
      <div className="relative aspect-video w-full border border-gray-200 rounded-lg overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-70 z-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
              <p className="mt-2 text-sm text-gray-600">Đang tải bản đồ...</p>
            </div>
          </div>
        )}
        <div
          id="order-tracking-map"
          ref={mapContainer}
          className="absolute inset-0 w-full h-full"
        ></div>
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
