import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Container, Paper, Typography, Button } from '@mui/material';
import { ArrowLeft, Clock } from 'lucide-react';
import TimelineTracking from './TimelineTracking';
import WarehouseTrackingMap from './WarehouseTrackingMap';
import { generateWarehouseRoute, getNearestBranch } from './MapUtils';

/**
 * Trang theo dõi đơn hàng qua các kho trung chuyển
 * Sử dụng thuật toán tự động tạo lộ trình thay vì dữ liệu cứng
 */
const WarehouseTrackingPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shopLocation, setShopLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [timeSpeed, setTimeSpeed] = useState(1); // Tốc độ thời gian: 1x là thời gian thực, 60x là 1 phút = 1 giây

  // Lấy thông tin đơn hàng và tạo lộ trình kho
  useEffect(() => {
    const fetchOrderAndCreateRoute = async () => {
      setLoading(true);
      try {
        // Trong thực tế, bạn sẽ gọi API để lấy thông tin đơn hàng
        // Ở đây chúng ta sử dụng hàm tạo đơn hàng mẫu
        // const mockOrder = generateMockOrder(orderId);
        // setOrder(mockOrder);
        
        // Lấy vị trí khách hàng từ đơn hàng
        // const customerLoc = mockOrder.customerLocation;
        // setCustomerLocation(customerLoc);
        
        // Xác định chi nhánh gần nhất với khách hàng
        // const nearestBranch = getNearestBranch(customerLoc.lat, customerLoc.lng);
        // setShopLocation(nearestBranch);
        
        // Tạo lộ trình qua các kho trung chuyển
        // const warehouseRoute = generateWarehouseRoute(nearestBranch, customerLoc);
        // setWarehouses(warehouseRoute);
      } catch (error) {
        console.error('Lỗi khi lấy thông tin đơn hàng:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndCreateRoute();
  }, [orderId]);

  // Cập nhật thời gian hiện tại
  useEffect(() => {
    // Tạo timer để cập nhật thời gian hiện tại
    const timer = setInterval(() => {
      setCurrentTime(prevTime => {
        // Tính toán thời gian mới dựa trên tốc độ
        const newTime = new Date(prevTime.getTime() + 1000 * timeSpeed);
        return newTime;
      });
    }, 1000); // Cập nhật mỗi giây

    return () => clearInterval(timer);
  }, [timeSpeed]);

  // Xử lý thay đổi tốc độ thời gian
  const handleSpeedChange = (speed) => {
    setTimeSpeed(speed);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6">Đang tải thông tin theo dõi đơn hàng...</Typography>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6" color="error">
          Không tìm thấy thông tin đơn hàng. Vui lòng kiểm tra lại mã đơn hàng.
        </Typography>
        <Button 
          component={Link} 
          to="/tai-khoan/don-hang" 
          startIcon={<ArrowLeft />}
          sx={{ mt: 2 }}
        >
          Quay lại danh sách đơn hàng
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Tiêu đề và nút quay lại */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Theo dõi đơn hàng qua các kho #{orderId}
        </Typography>
        <Button 
          component={Link} 
          to={`/tai-khoan/don-hang/${orderId}`} 
          startIcon={<ArrowLeft />}
          variant="outlined"
        >
          Quay lại chi tiết đơn hàng
        </Button>
      </Box>

      {/* Thông tin thời gian */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Clock size={20} style={{ marginRight: 8 }} />
            <Typography>
              Thời gian hiện tại: {currentTime.toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">Tốc độ:</Typography>
            <Button 
              size="small" 
              variant={timeSpeed === 1 ? "contained" : "outlined"}
              onClick={() => handleSpeedChange(1)}
            >
              1x
            </Button>
            <Button 
              size="small" 
              variant={timeSpeed === 60 ? "contained" : "outlined"}
              onClick={() => handleSpeedChange(60)}
            >
              60x
            </Button>
            <Button 
              size="small" 
              variant={timeSpeed === 300 ? "contained" : "outlined"}
              onClick={() => handleSpeedChange(300)}
            >
              5m
            </Button>
            <Button 
              size="small" 
              variant={timeSpeed === 3600 ? "contained" : "outlined"}
              onClick={() => handleSpeedChange(3600)}
            >
              1h
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Timeline theo dõi */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Lộ trình vận chuyển</Typography>
        <TimelineTracking 
          warehouses={warehouses} 
          shopLocation={shopLocation} 
          customerLocation={customerLocation}
          currentTime={currentTime}
        />
      </Paper>

      {/* Bản đồ theo dõi */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Bản đồ theo dõi</Typography>
        <Box sx={{ height: 500, width: '100%' }}>
          <WarehouseTrackingMap 
            warehouses={warehouses}
            shopLocation={shopLocation}
            customerLocation={customerLocation}
            currentTime={currentTime}
            order={order}
            orderId={orderId}
          />
        </Box>
      </Paper>

      {/* Thông tin đơn hàng */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Thông tin đơn hàng</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Mã đơn hàng:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {order._id}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Trạng thái:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {order.status === 'pending' ? 'Chờ xác nhận' :
               order.status === 'confirmed' ? 'Đã xác nhận' :
               order.status === 'shipping' ? 'Đang giao hàng' :
               order.status === 'delivered' ? 'Đã giao hàng' :
               order.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Chi nhánh xử lý:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {shopLocation?.name || 'Chi nhánh Cần Thơ'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Địa chỉ giao hàng:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {order.shippingAddress}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default WarehouseTrackingPage; 