import { Button } from "primereact/button";
import PropTypes from "prop-types";
import { useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Set Mapbox access token
const MAPBOX_ACCESS_TOKEN = "pk.eyJ1Ijoia2l0MjcxMCIsImEiOiJjbWF4bWh5YWQwc2N0MmtxM2p1M2Z5azZkIn0.navJSR4rbpRHVV3TEXelQg";
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

// Dialog xem chi tiết đơn hàng
export const ViewOrderDialog = ({
  viewOrder,
  setViewOrder,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusText,
  getStatusIcon,
  getPaymentMethodText,
  ORDER_STATUSES,
  openUpdateStatusDialog,
}) => {
  if (!viewOrder) return null;
  return (
    <div className="fixed inset-0 bg-opacity-30 backdrop-blur-xs flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            Chi tiết đơn hàng #{viewOrder._id.slice(-6).toUpperCase()}
          </h2>
          <button
            onClick={() => setViewOrder(null)}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          >
            <i className="pi pi-times"></i>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Thông tin khách hàng */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="font-medium text-blue-700 mb-3 flex items-center">
              <i className="pi pi-user mr-2"></i>
              Thông tin khách hàng
            </h3>
            <div className="space-y-2">
              <div className="flex">
                <span className="text-gray-500 w-32">Tên:</span>
                <span className="font-medium">
                  {viewOrder.userId?.firstName +
                    " " +
                    viewOrder.userId?.lastName || "N/A"}
                </span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-32">Email:</span>
                <span className="font-medium">
                  {viewOrder.userId?.email || "N/A"}
                </span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-32">Số điện thoại:</span>
                <span className="font-medium">
                  {viewOrder.shippingInfo?.phone || "N/A"}
                </span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-32">Địa chỉ:</span>
                <span className="font-medium">
                  {viewOrder.shippingInfo?.address || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Thông tin đơn hàng */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="font-medium text-blue-700 mb-3 flex items-center">
              <i className="pi pi-shopping-cart mr-2"></i>
              Thông tin đơn hàng
            </h3>
            <div className="space-y-2">
              <div className="flex">
                <span className="text-gray-500 w-32">Mã đơn hàng:</span>
                <span className="font-medium">
                  #{viewOrder._id.slice(-6).toUpperCase()}
                </span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-32">Ngày đặt:</span>
                <span className="font-medium">
                  {formatDate(viewOrder.createdAt)}
                </span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-32">Trạng thái:</span>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    viewOrder.status
                  )}`}
                >
                  {getStatusIcon(viewOrder.status)}
                  {getStatusText(viewOrder.status)}
                </span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-32">Thanh toán:</span>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    viewOrder.isPaid
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  <i
                    className={`pi ${
                      viewOrder.isPaid ? "pi-check-circle" : "pi-clock"
                    } mr-1`}
                  ></i>
                  {viewOrder.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                </span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-32">Phương thức:</span>
                <span className="font-medium">
                  {getPaymentMethodText(viewOrder.paymentMethod)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sản phẩm */}
        <div className="mb-6">
          <h3 className="font-medium text-blue-700 mb-3 flex items-center">
            <i className="pi pi-list mr-2"></i>
            Sản phẩm đã đặt
          </h3>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-600">
                    Sản phẩm
                  </th>
                  <th className="px-4 py-2 text-right text-gray-600">
                    Đơn giá
                  </th>
                  <th className="px-4 py-2 text-center text-gray-600">SL</th>
                  <th className="px-4 py-2 text-right text-gray-600">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody>
                {viewOrder.products?.map((item, index) => (
                  <tr key={index} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {item.productId?.productImages &&
                          item.productId?.productImages[0] && (
                            <img
                              src={item.productId.productImages[0]}
                              alt=""
                              className="w-12 h-12 object-cover rounded-md mr-3"
                            />
                          )}
                        <div>
                          <div className="font-medium">
                            {item.productId?.productName ||
                              "Sản phẩm không có sẵn"}
                          </div>
                          {item.productId?.productCode && (
                            <div className="text-xs text-gray-500">
                              Mã: {item.productId.productCode}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr className="border-t border-gray-200">
                  <td colSpan="3" className="px-4 py-3 text-right font-medium">
                    Tổng cộng:
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600">
                    {formatCurrency(viewOrder.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          {viewOrder.status !== ORDER_STATUSES.COMPLETED &&
            viewOrder.status !== ORDER_STATUSES.CANCELLED && (
              <Button
                label="Cập nhật trạng thái"
                className="p-button-warning bg-[#51bb1a] text-white p-2 rounded"
                onClick={() => {
                  setViewOrder(null);
                  openUpdateStatusDialog(viewOrder);
                }}
              />
            )}
          <Button
            label="Đóng"
            className="p-button-secondary bg-red-500 text-white p-2 rounded px-4"
            onClick={() => setViewOrder(null)}
          />
        </div>
      </div>
    </div>
  );
};

// Dialog xác nhận xóa đơn hàng
export const DeleteOrderDialog = ({
  deleteDialog,
  setDeleteDialog,
  handleDeleteOrder,
}) => {
  if (!deleteDialog) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full m-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="pi pi-trash text-red-500 text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold mb-2">Xác nhận xóa</h2>
          <p className="text-gray-600">
            Bạn có chắc chắn muốn xóa đơn hàng này không? Hành động này không
            thể hoàn tác.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            label="Hủy"
            icon="pi pi-times"
            className="p-button-text"
            onClick={() => setDeleteDialog(false)}
          />
          <Button
            label="Xóa đơn hàng"
            icon="pi pi-trash"
            className="p-button-danger"
            onClick={handleDeleteOrder}
          />
        </div>
      </div>
    </div>
  );
};

// Dialog cập nhật trạng thái đơn hàng
export const StatusUpdateDialog = ({
  statusDialogVisible,
  setStatusDialogVisible,
  selectedOrderForStatus,
  getNextStatuses,
  updateOrderStatus,
  getStatusText,
  getStatusColor,
  getStatusIcon,
  ORDER_STATUSES,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const animationRef = useRef(null);
  const [showMap, setShowMap] = useState(false);
  const [route, setRoute] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  if (!statusDialogVisible || !selectedOrderForStatus) return null;

  const nextStatuses = getNextStatuses(
    selectedOrderForStatus.status,
    selectedOrderForStatus.isPaid
  );

  // Function to check if a status is shipping
  const isShippingStatus = (status) => {
    return status === "SHIPPING" || status === ORDER_STATUSES.SHIPPING;
  };

  // Animation function to move marker along the route
  const animateMarker = (map, coordinates) => {
    let step = 0;
    const numSteps = 500; // Adjust this for animation speed

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Create a marker with a truck icon
    if (!markerRef.current) {
      // Create a custom truck element
      const el = document.createElement('div');
      el.className = 'delivery-vehicle';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.backgroundImage = 'url(https://cdn-icons-png.flaticon.com/512/3128/3128826.png)';
      el.style.backgroundSize = 'cover';
      el.style.backgroundRepeat = 'no-repeat';
      
      markerRef.current = new mapboxgl.Marker(el)
        .setLngLat(coordinates[0])
        .addTo(map);
    }

    setIsAnimating(true);

    function animate() {
      if (step >= numSteps) {
        setIsAnimating(false);
        return;
      }
      
      // Calculate the percentage of the route that should be complete
      const percentAlongRoute = step / numSteps;
      
      // Find the appropriate point along the route
      const pointIndex = Math.floor(percentAlongRoute * (coordinates.length - 1));
      
      // Interpolate between points for smoother animation
      if (pointIndex < coordinates.length - 1) {
        const nextPointIndex = pointIndex + 1;
        const segmentPercent = (percentAlongRoute * (coordinates.length - 1)) % 1;
        
        const currentPoint = coordinates[pointIndex];
        const nextPoint = coordinates[nextPointIndex];
        
        const lng = currentPoint[0] + (nextPoint[0] - currentPoint[0]) * segmentPercent;
        const lat = currentPoint[1] + (nextPoint[1] - currentPoint[1]) * segmentPercent;
        
        // Update marker position
        markerRef.current.setLngLat([lng, lat]);
        
        // Rotate marker to face direction of travel
        const bearing = getBearing(
          [currentPoint[0], currentPoint[1]],
          [nextPoint[0], nextPoint[1]]
        );
        
        // Update rotation of the marker's element
        const markerEl = markerRef.current.getElement();
        markerEl.style.transform = `${markerEl.style.transform.replace(/rotate\([^)]+\)/, '')} rotate(${bearing}deg)`;
      }
      
      step += 1;
      animationRef.current = requestAnimationFrame(animate);
    }
    
    animate();
  };
  
  // Calculate bearing between two points
  const getBearing = (start, end) => {
    const startLat = start[1] * Math.PI / 180;
    const startLng = start[0] * Math.PI / 180;
    const endLat = end[1] * Math.PI / 180;
    const endLng = end[0] * Math.PI / 180;
    
    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
              Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
              
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  // Function to create and display a map with route
  const displayRouteMap = async (status) => {
    if (!isShippingStatus(status)) {
      setShowMap(false);
      return;
    }

    setShowMap(true);
    
    // Wait for DOM to update
    setTimeout(async () => {
      if (!mapContainerRef.current) return;
      
      // Clean up previous map if exists
      if (mapRef.current) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        
        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }
        
        mapRef.current.remove();
      }

      // Define branch and delivery locations
      // Use real data from order if available
      const branchLocation = {
        lat: 10.0339, // Chi nhánh Cần Thơ (example)
        lng: 105.7855
      };
      
      // Get delivery location from order's shipping info
      const deliveryAddress = selectedOrderForStatus.shippingInfo?.address || "";
      let deliveryLocation = null;
      
      try {
        // Try to geocode the delivery address
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(deliveryAddress)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=vn&limit=1`
        );
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          deliveryLocation = { lat, lng };
        }
      } catch (error) {
        console.error("Error geocoding address:", error);
        // Fallback to default location if geocoding fails
        deliveryLocation = {
          lat: 10.0252, // Default example location 
          lng: 105.7625
        };
      }
      
      if (!deliveryLocation) {
        // Fallback if geocoding failed
        deliveryLocation = {
          lat: 10.0252,
          lng: 105.7625
        };
      }

      // Initialize map
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [branchLocation.lng, branchLocation.lat],
        zoom: 12
      });
      
      mapRef.current = map;

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add branch marker
      new mapboxgl.Marker({ color: '#3887be' })
        .setLngLat([branchLocation.lng, branchLocation.lat])
        .setPopup(new mapboxgl.Popup().setHTML('<h3>Chi nhánh Cần Thơ</h3><p>Điểm xuất hàng</p>'))
        .addTo(map);
      
      // Add delivery location marker
      new mapboxgl.Marker({ color: '#f30' })
        .setLngLat([deliveryLocation.lng, deliveryLocation.lat])
        .setPopup(new mapboxgl.Popup().setHTML('<h3>Địa chỉ nhận hàng</h3><p>' + deliveryAddress + '</p>'))
        .addTo(map);
      
      // Insert a CSS style for the marker animation
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .mapboxgl-marker {
          transition: transform 0.2s ease;
        }
        .delivery-vehicle {
          transform-origin: center;
        }
      `;
      document.head.appendChild(styleElement);

      // Get route from branch to delivery location
      try {
        const directionsResponse = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${branchLocation.lng},${branchLocation.lat};${deliveryLocation.lng},${deliveryLocation.lat}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`
        );
        const directionsData = await directionsResponse.json();
        
        if (directionsData.routes && directionsData.routes.length > 0) {
          const routeData = directionsData.routes[0];
          setRoute(routeData);
          
          // Add the route to the map
          map.on('load', () => {
            map.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: routeData.geometry
              }
            });
            
            map.addLayer({
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
            
            // Fit map to route bounds
            const bounds = new mapboxgl.LngLatBounds();
            routeData.geometry.coordinates.forEach(coord => {
              bounds.extend(coord);
            });
            map.fitBounds(bounds, { padding: 50 });
            
            // Start the animation after map is loaded and route is displayed
            animateMarker(map, routeData.geometry.coordinates);
          });
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    }, 100);
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    if (isShippingStatus(newStatus)) {
      displayRouteMap(newStatus);
    }
    updateOrderStatus(orderId, newStatus);
  };

  return (
    <div className="fixed inset-0 bg-opacity-30 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Cập nhật trạng thái</h2>
          <button
            onClick={() => {
              if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
              }
              setStatusDialogVisible(false);
            }}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          >
            <i className="pi pi-times"></i>
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
            <p className="text-gray-600 mb-2">Trạng thái hiện tại:</p>
            <div
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(
                selectedOrderForStatus.status
              )}`}
            >
              {getStatusIcon(selectedOrderForStatus.status)}
              {getStatusText(selectedOrderForStatus.status)}
            </div>
          </div>

          <p className="font-medium mb-3">Chọn trạng thái mới:</p>
          <div className="space-y-3">
            {nextStatuses.map((status) => (
              <button
                key={status.value}
                className="w-full p-3 flex items-center justify-between bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
                onClick={() =>
                  handleStatusUpdate(selectedOrderForStatus._id, status.value)
                }
              >
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getStatusColor(
                      status.value
                    )}`}
                  >
                    {getStatusIcon(status.value)}
                  </div>
                  <span className="font-medium">{status.label}</span>
                </div>
                <i className="pi pi-chevron-right text-gray-400"></i>
              </button>
            ))}

            {nextStatuses.length === 0 && (
              <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                Không có trạng thái tiếp theo khả dụng
              </div>
            )}
          </div>
        </div>

        {showMap && (
          <div className="mb-6">
            <h3 className="font-medium mb-3">Bản đồ theo dõi</h3>
            <div 
              ref={mapContainerRef} 
              className="h-[300px] w-full rounded-lg border border-gray-200 overflow-hidden"
            ></div>
            {route && (
              <div className="mt-2 text-sm text-gray-600">
                <p>Khoảng cách: {(route.distance / 1000).toFixed(1)} km</p>
                <p>Thời gian ước tính: {Math.ceil(route.duration / 60)} phút</p>
                {isAnimating && (
                  <p className="text-blue-600 font-medium">
                    <i className="pi pi-spin pi-spinner mr-1"></i> Đang vận chuyển...
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            label="Đóng"
            className="p-button-secondary bg-red-500 text-white p-2 rounded px-4"
            onClick={() => {
              if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
              }
              setStatusDialogVisible(false);
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Dialog xác nhận thanh toán
export const PaymentDialog = ({
  paymentDialog,
  setPaymentDialog,
  handleMarkAsPaid,
}) => {
  if (!paymentDialog) return null;

  return (
    <div className="fixed inset-0 bg-opacity-30 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full m-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="pi pi-check-circle text-green-500 text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold mb-2">Xác nhận thanh toán</h2>
          <p className="text-gray-600">
            Bạn có chắc chắn muốn đánh dấu đơn hàng này là đã thanh toán không?
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            label="Hủy"
            className="p-button-text bg-red-500 text-white p-2 rounded px-4"
            onClick={() => setPaymentDialog(false)}
          />
          <Button
            label="Xác nhận"
            className="p-button-success bg-[#51bb1a] text-white p-2 rounded px-4"
            onClick={handleMarkAsPaid}
          />
        </div>
      </div>
    </div>
  );
};

// Dialog cập nhật hàng loạt
export const BulkActionDialog = ({
  bulkConfirmVisible,
  setBulkConfirmVisible,
  bulkStatus = "",
  selectedOrders,
  getStatusText,
  executeBulkUpdate,
}) => {
  if (!bulkConfirmVisible) return null;

  return (
    <div className="fixed inset-0 bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full m-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="pi pi-cog text-blue-500 text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold mb-2">Cập nhật hàng loạt</h2>
          <p className="text-gray-600">
            {bulkStatus ? (
              <>
                Bạn có chắc chắn muốn cập nhật{" "}
                <strong>{selectedOrders.length}</strong> đơn hàng sang trạng
                thái <strong>{getStatusText(bulkStatus)}</strong>?
              </>
            ) : (
              <>Vui lòng chọn trạng thái để cập nhật đơn hàng</>
            )}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            label="Hủy"
            className="p-button-text rounded bg-red-500 text-white p-2 px-4"
            onClick={() => setBulkConfirmVisible(false)}
          />
          <Button
            label="Xác nhận"
            className="p-button-primary rounded bg-[#51bb1a] text-white p-2"
            onClick={executeBulkUpdate}
            disabled={!bulkStatus}
          />
        </div>
      </div>
    </div>
  );
};

// Dialog cài đặt tự động chuyển trạng thái
export const AutoTransitionSettingsDialog = ({
  autoTransitionSettingsVisible,
  setAutoTransitionSettingsVisible,
  autoTransitionEnabled,
  setAutoTransitionEnabled,
  transitionDelays,
  setTransitionDelays,
}) => {
  if (!autoTransitionSettingsVisible) return null;

  const handleDelayChange = (key, value) => {
    setTransitionDelays({
      ...transitionDelays,
      [key]: value,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            Cài đặt tự động chuyển trạng thái
          </h2>
          <button
            onClick={() => setAutoTransitionSettingsVisible(false)}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          >
            <i className="pi pi-times"></i>
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg">
            <div>
              <h3 className="font-medium">Bật tự động chuyển trạng thái</h3>
              <p className="text-sm text-gray-600">
                Cho phép hệ thống tự động cập nhật trạng thái đơn hàng
              </p>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoTransitionEnabled"
                checked={autoTransitionEnabled}
                onChange={(e) => setAutoTransitionEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <label
                htmlFor="autoTransitionEnabled"
                className="ml-2 cursor-pointer"
              >
                {autoTransitionEnabled ? "Bật" : "Tắt"}
              </label>
            </div>
          </div>

          <div
            className={
              autoTransitionEnabled ? "" : "opacity-50 pointer-events-none"
            }
          >
            <h3 className="font-medium mb-3">
              Thời gian chuyển trạng thái (phút)
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-600">
                  Chờ xử lý → Đã xác nhận:
                </label>
                <input
                  type="number"
                  value={transitionDelays.pending_to_confirmed}
                  onChange={(e) =>
                    handleDelayChange(
                      "pending_to_confirmed",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                  min="1"
                  max="1440"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-gray-600">
                  Đã xác nhận → Đang chuẩn bị:
                </label>
                <input
                  type="number"
                  value={transitionDelays.confirmed_to_preparing}
                  onChange={(e) =>
                    handleDelayChange(
                      "confirmed_to_preparing",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                  min="1"
                  max="1440"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-gray-600">
                  Đang chuẩn bị → Đã đóng gói:
                </label>
                <input
                  type="number"
                  value={transitionDelays.preparing_to_packaging}
                  onChange={(e) =>
                    handleDelayChange(
                      "preparing_to_packaging",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                  min="1"
                  max="1440"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-gray-600">
                  Đã đóng gói → Đang vận chuyển:
                </label>
                <input
                  type="number"
                  value={transitionDelays.packaging_to_shipping}
                  onChange={(e) =>
                    handleDelayChange(
                      "packaging_to_shipping",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                  min="1"
                  max="1440"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            label="Hủy"
            icon="pi pi-times"
            className="p-button-text"
            onClick={() => setAutoTransitionSettingsVisible(false)}
          />
          <Button
            label="Lưu cài đặt"
            icon="pi pi-save"
            className="p-button-primary"
            onClick={() => setAutoTransitionSettingsVisible(false)}
          />
        </div>
      </div>
    </div>
  );
};

// PropTypes cho các components
ViewOrderDialog.propTypes = {
  viewOrder: PropTypes.object,
  setViewOrder: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  getStatusColor: PropTypes.func.isRequired,
  getStatusText: PropTypes.func.isRequired,
  getStatusIcon: PropTypes.func.isRequired,
  getPaymentMethodText: PropTypes.func.isRequired,
  ORDER_STATUSES: PropTypes.object.isRequired,
  openUpdateStatusDialog: PropTypes.func.isRequired,
};

DeleteOrderDialog.propTypes = {
  deleteDialog: PropTypes.bool.isRequired,
  setDeleteDialog: PropTypes.func.isRequired,
  handleDeleteOrder: PropTypes.func.isRequired,
};

StatusUpdateDialog.propTypes = {
  statusDialogVisible: PropTypes.bool.isRequired,
  setStatusDialogVisible: PropTypes.func.isRequired,
  selectedOrderForStatus: PropTypes.object,
  getNextStatuses: PropTypes.func.isRequired,
  updateOrderStatus: PropTypes.func.isRequired,
  getStatusText: PropTypes.func.isRequired,
  getStatusColor: PropTypes.func.isRequired,
  getStatusIcon: PropTypes.func.isRequired,
  ORDER_STATUSES: PropTypes.object.isRequired,
};

PaymentDialog.propTypes = {
  paymentDialog: PropTypes.bool.isRequired,
  setPaymentDialog: PropTypes.func.isRequired,
  handleMarkAsPaid: PropTypes.func.isRequired,
};

BulkActionDialog.propTypes = {
  bulkConfirmVisible: PropTypes.bool.isRequired,
  setBulkConfirmVisible: PropTypes.func.isRequired,
  bulkStatus: PropTypes.string.isRequired,
  selectedOrders: PropTypes.array.isRequired,
  getStatusText: PropTypes.func.isRequired,
  executeBulkUpdate: PropTypes.func.isRequired,
};

AutoTransitionSettingsDialog.propTypes = {
  autoTransitionSettingsVisible: PropTypes.bool.isRequired,
  setAutoTransitionSettingsVisible: PropTypes.func.isRequired,
  autoTransitionEnabled: PropTypes.bool.isRequired,
  setAutoTransitionEnabled: PropTypes.func.isRequired,
  transitionDelays: PropTypes.object.isRequired,
  setTransitionDelays: PropTypes.func.isRequired,
};
