// Look for the existing routes for order detail
// Add a new route for warehouse tracking page under the order detail route
// Example:
{
  path: "/tai-khoan/don-hang/:id",
  element: <OrderDetail />,
},
{
  path: "/tai-khoan/don-hang/:orderId/kho-trung-chuyen",
  element: <WarehouseTrackingPage />,
}, 