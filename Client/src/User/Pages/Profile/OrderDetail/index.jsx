import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Paper, Typography, Grid, Divider, Button, Chip, Skeleton } from '@mui/material';
import { ShoppingBag, Truck, MapPin, Clock, ArrowRight } from 'lucide-react';
import OrderItems from './OrderItems';
import PaymentInfo from './PaymentInfo';
import { generateMockOrder, formatDate } from './MapUtils';

const OrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  
  useEffect(() => {
    const fetchOrderDetail = async () => {
      setLoading(true);
      try {
        // Tạo đơn hàng mẫu để demo
        const mockOrder = generateMockOrder(orderId);
        setOrder(mockOrder);
      } catch (error) {
        console.error('Lỗi khi lấy thông tin đơn hàng:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);
  
  const handleCancelOrder = async () => {
    if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
      try {
        // Giả lập hủy đơn hàng
        setOrder(prev => ({
          ...prev,
          status: 'canceled'
        }));
      } catch (error) {
        console.error('Lỗi khi hủy đơn hàng:', error);
      }
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'shipping':
        return 'Đang giao hàng';
      case 'delivered':
        return 'Đã giao hàng';
      case 'canceled':
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'shipping':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'canceled':
        return 'error';
      default:
        return 'default';
    }
  };
  
  const navigateToWarehouseTracking = () => {
    navigate(`/tai-khoan/don-hang/${orderId}/theo-doi-kho`);
  };
  
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" width="100%" height={200} />
        <Skeleton variant="text" sx={{ my: 1 }} />
        <Skeleton variant="text" sx={{ my: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={300} />
      </Box>
    );
  }
  
  if (!order) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Không tìm thấy thông tin đơn hàng. Vui lòng kiểm tra lại mã đơn hàng.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Chi tiết đơn hàng #{orderId}
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ShoppingBag size={20} />
            <Typography variant="h6" sx={{ ml: 1 }}>
              Thông tin đơn hàng
            </Typography>
          </Box>
          <Chip 
            label={getStatusText(order.status)} 
            color={getStatusColor(order.status)}
            variant="outlined"
          />
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Ngày đặt hàng:
            </Typography>
            <Typography variant="body1">
              {formatDate(order.createdAt)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Ngày giao hàng dự kiến:
            </Typography>
            <Typography variant="body1">
              {formatDate(order.estimatedDelivery)}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <MapPin size={18} style={{ marginTop: 4, marginRight: 8 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Địa chỉ giao hàng:
                </Typography>
                <Typography variant="body1">
                  {order.shippingAddress}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Truck size={18} style={{ marginTop: 4, marginRight: 8 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Phương thức giao hàng:
                </Typography>
                <Typography variant="body1">
                  Giao hàng tiêu chuẩn
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        {order.status === 'shipping' && (
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="outlined" 
              color="primary"
              startIcon={<Clock />}
              endIcon={<ArrowRight />}
              onClick={navigateToWarehouseTracking}
              fullWidth
              sx={{ mt: 1 }}
            >
              Theo dõi đơn hàng qua các kho
            </Button>
          </Box>
        )}
        
        {(order.status === 'pending' || order.status === 'confirmed') && (
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="outlined" 
              color="error"
              onClick={handleCancelOrder}
              fullWidth
              sx={{ mt: 1 }}
            >
              Hủy đơn hàng
            </Button>
          </Box>
        )}
      </Paper>
      
      <OrderItems order={order} />
      
      <PaymentInfo order={order} />
    </Box>
  );
};

export default OrderDetail; 