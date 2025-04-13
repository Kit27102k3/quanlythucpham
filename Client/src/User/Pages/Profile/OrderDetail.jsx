import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ClipboardListIcon, ChevronLeftIcon, TruckIcon, PackageIcon, XCircleIcon, ClockIcon, MapPinIcon, EyeIcon } from "lucide-react";
import orderApi, { getOrderById } from "../../../api/orderApi";
import formatCurrency from "../../Until/FotmatPrice";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

export default function OrderDetail() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [trackingError, setTrackingError] = useState(false);
  const { orderId } = useParams();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const orderData = await getOrderById(orderId);
        
        setOrder(orderData);
        
        // Nếu đơn hàng có mã vận đơn thì lấy thông tin tracking
        if (orderData.orderCode) {
          fetchTrackingInfo(orderData.orderCode);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const fetchTrackingInfo = async (orderCode) => {
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
  };

  const toggleTracking = () => {
    setShowTracking(!showTracking);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-10">
        <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Không tìm thấy đơn hàng</h2>
        <p className="text-gray-600 mb-6">Đơn hàng này không tồn tại hoặc đã bị xóa</p>
        <Link to="/tai-khoan/don-hang" className="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 transition-colors">
          Trở về danh sách đơn hàng
        </Link>
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
        return "Đang xử lý";
      case "paid":
        return "Đã thanh toán";
      case "completed":
        return "Hoàn thành";
      case "cancelled":
        return "Đã hủy";
      case "awaiting_payment":
        return "Chờ thanh toán";
      default:
        return status;
    }
  };

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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/tai-khoan/don-hang" className="flex items-center text-green-600 hover:text-green-700">
          <ChevronLeftIcon className="w-5 h-5" />
          <span>Quay lại</span>
        </Link>
        <ClipboardListIcon className="w-6 h-6 text-[#51bb1a]" />
        <h2 className="text-xl font-semibold text-gray-800 lg:text-2xl">
          Chi tiết đơn hàng #{order._id.slice(-6).toUpperCase()}
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Thông tin đơn hàng */}
        <div className="md:col-span-2">
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="bg-green-50 py-4 px-6 border-b border-green-100">
              <h3 className="text-lg font-semibold text-gray-800">Thông tin đơn hàng</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-gray-600">Mã đơn hàng:</div>
                <div className="font-medium">#{order._id.slice(-6).toUpperCase()}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600">Ngày đặt:</div>
                <div>{formatDate(order.createdAt)}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600">Tổng tiền:</div>
                <div className="font-semibold text-lg">{formatCurrency(order.totalAmount)}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600">Trạng thái đơn hàng:</div>
                <div className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600">Phương thức thanh toán:</div>
                <div>
                  {order.paymentMethod === "cod" ? "Thanh toán khi nhận hàng" : 
                   order.paymentMethod === "bank_transfer" ? "Chuyển khoản ngân hàng" : 
                   order.paymentMethod}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600">Mã vận đơn:</div>
                <div className="flex items-center gap-2">
                  {!order.orderCode ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Chưa có mã vận đơn</span>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium">{order.orderCode}</span>
                      <button
                        onClick={toggleTracking}
                        className={`flex items-center gap-1 text-sm ${
                          showTracking 
                            ? "text-green-600 bg-green-50 hover:bg-green-100" 
                            : "text-blue-600 bg-blue-50 hover:bg-blue-100"
                        } px-2 py-1 rounded-full transition-colors`}
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span>{showTracking ? "Ẩn tiến trình" : "Xem tiến trình"}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="bg-green-50 py-4 px-6 border-b border-green-100">
              <h3 className="text-lg font-semibold text-gray-800">Sản phẩm</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">Đơn giá</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.products.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded">
                            {item.productId?.productImages ? (
                              
                              <img 
                                src={item.productId.productImages[0]} 
                                alt={item.productId.productName} 
                                className="h-10 w-10 object-cover rounded" 
                              />
                            ) : (
                              <PackageIcon className="h-6 w-6 m-2 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.productId?.productName || "Sản phẩm không tồn tại"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-right text-sm font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="py-3 px-4 text-right text-sm font-medium text-gray-500">
                      Tổng cộng:
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-bold text-gray-900">
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
              className="bg-white shadow-md rounded-lg overflow-hidden mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-blue-50 py-4 px-6 border-b border-blue-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-blue-800">Tiến trình giao hàng</h3>
                <TruckIcon className="w-5 h-5 text-blue-600" />
              </div>
              
              <div className="px-6 py-4">
                {trackingLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : trackingError ? (
                  <div className="text-center py-6">
                    <XCircleIcon className="w-12 h-12 text-orange-500 mx-auto mb-2" />
                    <p className="text-gray-600">Không thể lấy thông tin vận chuyển</p>
                    <p className="text-sm text-gray-500 mt-2">Đơn hàng của bạn đang được xử lý</p>
                  </div>
                ) : !trackingInfo ? (
                  <div className="text-center py-6">
                    <ClockIcon className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                    <p className="text-gray-600">Đang chờ thông tin vận chuyển</p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6 py-4 px-5 bg-blue-50 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500">Trạng thái hiện tại</div>
                        <div className="font-medium text-blue-700 text-lg">{trackingInfo.status_name || "Đang vận chuyển"}</div>
                      </div>
                      {trackingInfo.estimated_delivery_time && (
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Dự kiến giao hàng</div>
                          <div className="font-medium text-blue-700">
                            {new Date(trackingInfo.estimated_delivery_time).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                      <MapPinIcon className="w-5 h-5 text-blue-500" />
                      Chi tiết hành trình
                    </h4>
                    
                    {trackingInfo.tracking_logs && trackingInfo.tracking_logs.length > 0 ? (
                      <div className="relative mb-6">
                        <div className="absolute top-0 bottom-0 left-[10px] w-0.5 bg-gray-200"></div>
                        <div className="space-y-6">
                          {trackingInfo.tracking_logs.map((log, index) => (
                            <motion.div 
                              key={index}
                              className="flex gap-4"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <div className={`h-5 w-5 rounded-full flex-shrink-0 mt-1.5 ${index === 0 ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                              <div className="pb-2">
                                <div className="text-sm font-medium text-gray-900">{log.status_name}</div>
                                <div className="text-xs text-gray-500">{formatDate(log.timestamp)}</div>
                                {log.location && (
                                  <div className="text-xs text-gray-600 mt-1 bg-gray-50 py-1 px-2 rounded">
                                    {log.location}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Chưa có thông tin vận chuyển</p>
                    )}

                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Lưu ý:</h5>
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
        <div className="md:col-span-1">
          {/* Thông tin giao hàng */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="bg-green-50 py-4 px-6 border-b border-green-100">
              <h3 className="text-lg font-semibold text-gray-800">Thông tin giao hàng</h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <div className="text-sm text-gray-600 mb-1">Người nhận:</div>
                <div className="font-medium">{order.userId?.firstName + " " + order.userId?.lastName || "Không có thông tin"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Số điện thoại:</div>
                <div>{order.userId?.phone || "Không có thông tin"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Địa chỉ giao hàng:</div>
                <div>
                  {order.userId?.address ? (
                    <span>
                      {order.userId.address}, 
                      {order.userId.ward && ` ${order.userId.ward},`}
                      {order.userId.district && ` ${order.userId.district},`}
                      {order.userId.province && ` ${order.userId.province}`}
                    </span>
                  ) : (
                    "Không có thông tin địa chỉ"
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Phương thức giao hàng:</div>
                <div>
                  {order.shippingInfo?.method === "standard" ? "Giao hàng tiêu chuẩn" : 
                   order.shippingInfo?.method === "express" ? "Giao hàng nhanh" : 
                   order.shippingInfo?.method || "Tiêu chuẩn"}
                </div>
              </div>
            </div>
          </div>

          {/* Theo dõi đơn hàng (dạng thu gọn) */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-green-50 py-4 px-6 border-b border-green-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Theo dõi đơn hàng</h3>
              <TruckIcon className="w-5 h-5 text-green-600" />
            </div>
            
            <div className="px-6 py-4">
              {!order.orderCode ? (
                <div className="text-center py-6">
                  <PackageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Đơn hàng chưa có mã vận đơn</p>
                </div>
              ) : trackingLoading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : trackingError ? (
                <div className="text-center py-6">
                  <ClockIcon className="w-12 h-12 text-orange-500 mx-auto mb-2" />
                  <p className="text-gray-600">Đơn hàng đang xử lý</p>
                </div> 
              ) : !trackingInfo ? (
                <div className="text-center py-6">
                  <ClockIcon className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                  <p className="text-gray-600">Đang chờ thông tin vận chuyển</p>
                </div>
              ) : (
                <div>
                  <div className="mb-4 py-3 px-4 bg-blue-50 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Trạng thái</div>
                      <div className="font-medium text-blue-700">{trackingInfo.status_name || "Đang vận chuyển"}</div>
                    </div>
                    {trackingInfo.estimated_delivery_time && (
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Dự kiến giao</div>
                        <div className="font-medium text-blue-700">
                          {new Date(trackingInfo.estimated_delivery_time).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <h4 className="font-medium text-gray-800 mb-3">Lịch sử vận chuyển</h4>
                  
                  {trackingInfo.tracking_logs && trackingInfo.tracking_logs.length > 0 ? (
                    <div className="relative">
                      <div className="absolute top-0 bottom-0 left-[10px] w-0.5 bg-gray-200"></div>
                      <div className="space-y-4">
                        {/* Chỉ hiện thị 3 cập nhật gần nhất */}
                        {trackingInfo.tracking_logs.slice(0, 3).map((log, index) => (
                          <motion.div 
                            key={index}
                            className="flex gap-3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className={`h-5 w-5 rounded-full flex-shrink-0 mt-1.5 ${index === 0 ? 'bg-green-500' : 'bg-blue-400'}`}></div>
                            <div className="pb-2">
                              <div className="text-sm font-medium">{log.status_name}</div>
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
                    <p className="text-gray-500 text-sm">Chưa có thông tin vận chuyển</p>
                  )}

                  {trackingInfo.tracking_logs && trackingInfo.tracking_logs.length > 3 && (
                    <div className="mt-3 text-center">
                      <button
                        onClick={toggleTracking}
                        className="text-blue-600 text-sm hover:text-blue-800"
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