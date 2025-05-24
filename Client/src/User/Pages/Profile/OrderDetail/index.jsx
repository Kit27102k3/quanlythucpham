import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import axios from "axios";
import { OrderDetailLoading } from "./ui/LoadingIndicators";
import { OrderNotFoundError } from "./ui/ErrorMessage";
import {
  OrderHeader,
  OrderInfo,
  ProductList,
  TrackingSummary,
  TrackingInfo,
} from "./MapComponents";
import OrderMap from "./OrderMap";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import { geocodeAddressDebounced, SHOP_LOCATION } from "./MapUtils";

// Mapbox token validation
const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
  import.meta.env.VITE_MAPBOX_KEY ||
  "pk.eyJ1IjoiYmllcGhvbmciLCJhIjoiY2xydmprbDZ0MDVpdjJqbzNrYnYwcXlhOCJ9.nh-L7QQrTbXMpnLcK9HVsw";

if (!MAPBOX_TOKEN) {
  console.error(
    "Mapbox token is missing. Please provide a valid VITE_MAPBOX_ACCESS_TOKEN."
  );
} else {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  const [showTracking, setShowTracking] = useState(false);
  const [customerCoords, setCustomerCoords] = useState(null);
  const [geocodingAttempted, setGeocodingAttempted] = useState(false);
  const geocodingRef = useRef(false);

  // Fetch order data
  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) {
        setError("Invalid order ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`/api/orders/${id}`);
        setOrder(response.data);
        setError(null);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || "Không thể tải thông tin đơn hàng";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  // Fetch tracking info
  useEffect(() => {
    const fetchTrackingInfo = async () => {
      if (!order?.orderCode) return;

      try {
        setTrackingLoading(true);
        const response = await axios.get(
          `/api/orders/tracking/${order.orderCode}`
        );
        setTrackingInfo(response.data);
        setTrackingError(null);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || "Không thể tải thông tin vận chuyển";
        setTrackingError(errorMessage);
        console.error("Tracking error:", err);
      } finally {
        setTrackingLoading(false);
      }
    };

    fetchTrackingInfo();
  }, [order?.orderCode]);

  // Function to get the shipping address from order
  const getShippingAddress = useCallback((order) => {
    if (!order) return "";

    // Try different possible locations for the address
    if (order.shipping?.address) return order.shipping.address;
    if (order.shippingAddress) return order.shippingAddress;
    if (order.shippingInfo?.address) return order.shippingInfo.address;

    // If no direct address, try to build from user info
    if (order.user) {
      const addressParts = [];
      if (order.user.address) addressParts.push(order.user.address);
      if (order.user.ward) addressParts.push(order.user.ward);
      if (order.user.district) addressParts.push(order.user.district);
      if (order.user.province) addressParts.push(order.user.province);
      if (addressParts.length) return addressParts.join(", ");
    }

    return "";
  }, []);

  // Geocoding logic with improved handling
  useEffect(() => {
    if (!order || geocodingRef.current) return;

    const address = getShippingAddress(order);
    if (!address) {
      console.warn("No shipping address found in order");
      return;
    }

    geocodingRef.current = true;
    setGeocodingAttempted(true);

    // Check if we already have coordinates in the order
    if (order.deliveryCoordinates?.lat && order.deliveryCoordinates?.lng) {
      setCustomerCoords({
        lat: parseFloat(order.deliveryCoordinates.lat),
        lng: parseFloat(order.deliveryCoordinates.lng),
        address: address,
      });
      return;
    }

    // Try to get coordinates from localStorage cache first
    const cacheKey = address.trim().toLowerCase().replace(/\s+/g, "_");
    try {
      const cachedLocations = JSON.parse(
        localStorage.getItem("geocoding_cache") || "{}"
      );
      if (cachedLocations[cacheKey]) {
        setCustomerCoords({
          ...cachedLocations[cacheKey],
          address: address,
          source: "cache",
        });
        return;
      }
    } catch (err) {
      console.error("Error reading from cache:", err);
    }

    // Perform geocoding with retry
    const performGeocoding = () => {
      // First attempt with full address
      geocodeAddressDebounced(address, (result) => {
        if (result && result.lat && result.lng) {
          // Save to cache
          try {
            const cachedLocations = JSON.parse(
              localStorage.getItem("geocoding_cache") || "{}"
            );
            cachedLocations[cacheKey] = {
              lat: result.lat,
              lng: result.lng,
              timestamp: Date.now(),
            };
            localStorage.setItem(
              "geocoding_cache",
              JSON.stringify(cachedLocations)
            );
          } catch (err) {
            console.error("Error saving to cache:", err);
          }

          setCustomerCoords({
            lat: result.lat,
            lng: result.lng,
            address: address,
          });
        } else {
          console.error("Geocoding failed for address:", address);
          // If geocoding fails, try with a simplified address
          const simplifiedAddress = address
            .split(",")
            .slice(-3)
            .join(",")
            .trim();
          if (simplifiedAddress && simplifiedAddress !== address) {
            geocodeAddressDebounced(simplifiedAddress, (result) => {
              if (result && result.lat && result.lng) {
                // Save simplified result to cache
                try {
                  const cachedLocations = JSON.parse(
                    localStorage.getItem("geocoding_cache") || "{}"
                  );
                  cachedLocations[cacheKey] = {
                    lat: result.lat,
                    lng: result.lng,
                    timestamp: Date.now(),
                  };
                  localStorage.setItem(
                    "geocoding_cache",
                    JSON.stringify(cachedLocations)
                  );
                } catch (err) {
                  console.error("Error saving to cache:", err);
                }

                setCustomerCoords({
                  lat: result.lat,
                  lng: result.lng,
                  address: address, // Keep original address for display
                });
              } else {
                // Use default coordinates as last resort
                console.warn("Using default coordinates as fallback");
                setCustomerCoords({
                  lat: 10.0070868, // Default coordinates (Can Tho)
                  lng: 105.7683238,
                  address: address,
                  isDefault: true,
                });
              }
            });
          } else {
            // Use default coordinates
            setCustomerCoords({
              lat: 10.0070868, // Default coordinates (Can Tho)
              lng: 105.7683238,
              address: address,
              isDefault: true,
            });
          }
        }
      });
    };

    // Execute geocoding immediately to avoid delay
    performGeocoding();
  }, [order, getShippingAddress]);

  // Toggle tracking details
  const toggleTracking = useCallback(() => {
    setShowTracking((prev) => !prev);
  }, []);

  // Handle back button
  const goBack = useCallback(() => {
    navigate("/tai-khoan/don-hang");
  }, [navigate]);

  // Helper functions
  const getStatusColor = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipping":
        return "bg-indigo-100 text-indigo-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }, []);

  const getStatusText = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "Chờ xác nhận";
      case "processing":
        return "Đang xử lý";
      case "shipping":
        return "Đang giao hàng";
      case "delivered":
        return "Đã giao hàng";
      case "cancelled":
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  }, []);

  const isOrderPaid = useCallback((order) => {
    return (
      order?.isPaid ||
      (order?.paymentMethod === "bank_transfer" &&
        order?.status !== "cancelled")
    );
  }, []);

  // Loading state
  if (loading) {
    return <OrderDetailLoading />;
  }

  // Error state or order not found
  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <OrderNotFoundError onBack={goBack} />
      </div>
    );
  }

  // Render shipping info
  const renderShippingInfo = () => {
    if (!order?.shipping && !order?.shippingAddress) {
      return (
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Thông tin vận chuyển
          </h3>
          <p className="text-gray-600">Không có thông tin vận chuyển.</p>
        </div>
      );
    }

    return (
      <div
        id="order-map-section"
        className="mb-6 bg-white rounded-lg shadow p-4"
      >
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Thông tin vận chuyển
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Người nhận:</p>
            <p className="font-medium">
              {order?.shipping?.name || order?.user?.fullName || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Số điện thoại:</p>
            <p className="font-medium">
              {order?.shipping?.phone || order?.user?.phone || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Địa chỉ:</p>
            <p className="font-medium">{getShippingAddress(order) || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">
              Phương thức vận chuyển:
            </p>
            <p className="font-medium">
              {order?.shippingMethod || "Giao hàng tiêu chuẩn"}
            </p>
          </div>
        </div>
        {MAPBOX_TOKEN && customerCoords ? (
          <OrderMap
            shopLocation={SHOP_LOCATION}
            customerLocation={customerCoords}
          />
        ) : geocodingAttempted ? (
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-amber-700 text-sm">
              Đang tải thông tin bản đồ...
            </p>
            <button
              onClick={() => {
                geocodingRef.current = false;
                const address = getShippingAddress(order);
                if (address) {
                  geocodeAddressDebounced(address, (result) => {
                    if (result && result.lat && result.lng) {
                      setCustomerCoords({
                        lat: result.lat,
                        lng: result.lng,
                        address: address,
                      });
                    }
                  });
                }
              }}
              className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Tải lại bản đồ
            </button>
          </div>
        ) : (
          <p className="text-red-600">
            Không thể hiển thị bản đồ do thiếu Mapbox token hoặc chưa có tọa độ.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet>
        <title>
          Chi tiết đơn hàng #{order?._id?.slice(-6) || "N/A"} | Nông Trại Hữu Cơ
        </title>
      </Helmet>

      <OrderHeader orderId={order._id} goBack={goBack} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <OrderInfo
            order={order}
            isOrderPaid={isOrderPaid}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
          />
          {renderShippingInfo()}
          <ProductList
            products={order?.items || order?.products || []}
            totalAmount={order?.totalAmount || 0}
          />
        </div>
        <div>
          <TrackingSummary
            order={order}
            toggleTracking={toggleTracking}
            showTracking={showTracking}
          />
          {showTracking && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TrackingInfo
                trackingInfo={trackingInfo}
                trackingLoading={trackingLoading}
                trackingError={trackingError}
                orderCode={order?.orderCode}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
