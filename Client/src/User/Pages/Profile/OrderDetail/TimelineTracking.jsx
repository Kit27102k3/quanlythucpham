import React from 'react';
import { CheckCircle, Clock, ArrowDown, Home, PackageCheck, MapPin, Package, Truck } from 'lucide-react';
import PropTypes from 'prop-types';
import { Box, Typography, Paper, Chip, Divider, Stack, Avatar } from '@mui/material';
import { formatDate } from './MapUtils';

/**
 * Hiển thị timeline theo dõi đơn hàng qua các kho trung chuyển
 * @param {Object} props
 * @param {Array} props.warehouses - Danh sách các kho trung chuyển
 * @param {Object} props.shopLocation - Vị trí cửa hàng
 * @param {Object} props.customerLocation - Vị trí khách hàng
 * @param {Date} props.currentTime - Thời gian hiện tại
 * @param {String} props.orderStatus - Trạng thái đơn hàng
 */
const TimelineTracking = ({ warehouses, shopLocation, customerLocation, currentTime, orderStatus }) => {
  // Thời gian bắt đầu và kết thúc của đơn hàng
  const orderStartTime = warehouses.length > 0 ? 
    new Date(warehouses[0].arrivalTime) : 
    currentTime;
  
  // Ước tính thời gian đến dựa trên kho cuối cùng
  const orderDeliveryTime = warehouses.length > 0 ? 
    new Date(warehouses[warehouses.length - 1].departureTime) : 
    new Date(currentTime.getTime() + 2 * 60 * 60 * 1000); // Mặc định + 2 giờ
  
  // Thêm thời gian vận chuyển từ kho cuối cùng đến khách hàng
  const estimatedDeliveryTime = new Date(orderDeliveryTime.getTime() + 60 * 60 * 1000); // Thêm 1 giờ
  
  // Xác định trạng thái đơn hàng hiện tại dựa trên thời gian
  const getCurrentStatus = () => {
    // Nếu đã được giao
    if (orderStatus === 'delivered') {
      return 'delivered';
    }
    
    // Nếu bị hủy
    if (orderStatus === 'canceled') {
      return 'canceled';
    }
    
    // Nếu chưa bắt đầu vận chuyển
    if (currentTime < orderStartTime) {
      return 'preparing';
    }
    
    // Nếu đã đến thời gian giao hàng
    if (currentTime > estimatedDeliveryTime) {
      return 'delivered';
    }
    
    // Đang ở trong các kho trung chuyển
    for (let i = 0; i < warehouses.length; i++) {
      const warehouse = warehouses[i];
      const arrivalTime = new Date(warehouse.arrivalTime);
      const departureTime = new Date(warehouse.departureTime);
      
      // Nếu đang trong kho này
      if (currentTime >= arrivalTime && currentTime <= departureTime) {
        return `at_warehouse_${i}`;
      }
      
      // Nếu đang trên đường đến kho tiếp theo
      if (i < warehouses.length - 1) {
        const nextWarehouse = warehouses[i + 1];
        const nextArrivalTime = new Date(nextWarehouse.arrivalTime);
        
        if (currentTime > departureTime && currentTime < nextArrivalTime) {
          return `to_warehouse_${i + 1}`;
        }
      }
    }
    
    // Đang trên đường giao hàng đến khách hàng
    if (warehouses.length > 0) {
      const lastWarehouse = warehouses[warehouses.length - 1];
      const lastDepartureTime = new Date(lastWarehouse.departureTime);
      
      if (currentTime > lastDepartureTime && currentTime <= estimatedDeliveryTime) {
        return 'out_for_delivery';
      }
    }
    
    return 'shipping';
  };
  
  const currentStatus = getCurrentStatus();
  
  const getStatusIcon = (status, isActive) => {
    const iconProps = { 
      sx: { 
        color: isActive ? 'success.main' : 'text.secondary',
        width: 20,
        height: 20
      }
    };
    
    switch (status) {
      case 'shop':
        return <Home {...iconProps} />;
      case 'warehouse':
        return <Package {...iconProps} />;
      case 'customer':
        return <MapPin {...iconProps} />;
      case 'delivered':
        return <CheckCircle {...iconProps} />;
      case 'preparing':
        return <Clock {...iconProps} />;
      case 'shipping':
        return <Truck {...iconProps} />;
      case 'canceled':
        return <Clock {...iconProps} sx={{ color: 'error.main', width: 20, height: 20 }} />;
      default:
        return <Package {...iconProps} />;
    }
  };
  
  const getStatusColor = (isActive, isCurrent = false) => {
    if (currentStatus === 'canceled') return 'error';
    if (isCurrent) return 'info';
    return isActive ? 'success' : 'default';
  };
  
  return (
    <Box sx={{ pt: 1 }}>
      {/* Cửa hàng */}
      <Box sx={{ display: 'flex', mb: 2 }}>
        <Avatar 
          sx={{ 
            bgcolor: currentStatus !== 'preparing' ? 'success.light' : 'grey.200',
            width: 40, 
            height: 40
          }}
        >
          {getStatusIcon('shop', currentStatus !== 'preparing')}
        </Avatar>
        
        <Box sx={{ ml: 2 }}>
          <Typography variant="subtitle2">
            Đã lấy hàng từ cửa hàng
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {shopLocation.address}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {warehouses.length > 0 
              ? formatDate(warehouses[0].arrivalTime)
              : 'Đang chuẩn bị'}
          </Typography>
        </Box>
      </Box>
      
      {/* Đường nối */}
      <Box sx={{ ml: 2.5, borderLeft: 1, borderStyle: 'dashed', borderColor: 'divider', height: 24 }} />
      
      {/* Các kho trung chuyển */}
      {warehouses.map((warehouse, index) => {
        const isActive = currentStatus === `at_warehouse_${index}` || 
                         (index === 0 && currentStatus !== 'preparing') ||
                         (index > 0 && currentStatus.startsWith('at_warehouse_') && parseInt(currentStatus.split('_')[2]) > index) ||
                         (index > 0 && currentStatus.startsWith('to_warehouse_') && parseInt(currentStatus.split('_')[2]) > index) ||
                         currentStatus === 'out_for_delivery' || 
                         currentStatus === 'delivered';
        
        const isCurrentWarehouse = currentStatus === `at_warehouse_${index}`;
        
        return (
          <React.Fragment key={index}>
            <Box sx={{ display: 'flex', mb: 2 }}>
              <Avatar 
                sx={{ 
                  bgcolor: isActive ? 'success.light' : 'grey.200',
                  width: 40, 
                  height: 40,
                  border: isCurrentWarehouse ? 2 : 0,
                  borderColor: 'info.main'
                }}
              >
                {getStatusIcon('warehouse', isActive)}
              </Avatar>
              
              <Box sx={{ ml: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="subtitle2">
                    {warehouse.name}
                  </Typography>
                  {isCurrentWarehouse && (
                    <Chip 
                      label="Hiện tại" 
                      color="info" 
                      size="small" 
                      sx={{ ml: 1, height: 20 }}
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {warehouse.address}
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Đến: {formatDate(warehouse.arrivalTime)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Đi: {formatDate(warehouse.departureTime)}
                  </Typography>
                </Stack>
              </Box>
            </Box>
            
            {/* Đường nối */}
            {index < warehouses.length - 1 && (
              <Box sx={{ ml: 2.5, borderLeft: 1, borderStyle: 'dashed', borderColor: 'divider', height: 24 }} />
            )}
          </React.Fragment>
        );
      })}
      
      {/* Đường nối đến khách hàng */}
      {warehouses.length > 0 && (
        <Box sx={{ ml: 2.5, borderLeft: 1, borderStyle: 'dashed', borderColor: 'divider', height: 24 }} />
      )}
      
      {/* Khách hàng */}
      <Box sx={{ display: 'flex', mb: 2 }}>
        <Avatar 
          sx={{ 
            bgcolor: currentStatus === 'delivered' ? 'success.light' : 'grey.200',
            width: 40, 
            height: 40
          }}
        >
          {getStatusIcon('customer', currentStatus === 'delivered')}
        </Avatar>
        
        <Box sx={{ ml: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle2">
              Giao hàng đến khách hàng
            </Typography>
            {currentStatus === 'out_for_delivery' && (
              <Chip 
                label="Đang giao" 
                color="warning" 
                size="small" 
                sx={{ ml: 1, height: 20 }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {customerLocation?.address}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Dự kiến: {formatDate(estimatedDeliveryTime)}
          </Typography>
        </Box>
      </Box>
      
      {/* Trạng thái hiện tại */}
      <Paper 
        elevation={0} 
        sx={{ 
          mt: 3, 
          p: 2, 
          bgcolor: 'grey.50', 
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {currentStatus === 'preparing' && (
          <>
            <Clock sx={{ color: 'info.main', mr: 1 }} />
            <Typography variant="body2" fontWeight="medium">
              Đơn hàng đang được chuẩn bị
            </Typography>
          </>
        )}
        
        {currentStatus.startsWith('at_warehouse_') && (
          <>
            <Package sx={{ color: 'info.main', mr: 1 }} />
            <Typography variant="body2" fontWeight="medium">
              Đơn hàng đang ở {warehouses[parseInt(currentStatus.split('_')[2])].name}
            </Typography>
          </>
        )}
        
        {currentStatus.startsWith('to_warehouse_') && (
          <>
            <ArrowDown sx={{ color: 'info.main', mr: 1 }} />
            <Typography variant="body2" fontWeight="medium">
              Đang vận chuyển đến {warehouses[parseInt(currentStatus.split('_')[2])].name}
            </Typography>
          </>
        )}
        
        {currentStatus === 'out_for_delivery' && (
          <>
            <Truck sx={{ color: 'info.main', mr: 1 }} />
            <Typography variant="body2" fontWeight="medium">
              Đang giao hàng đến khách hàng
            </Typography>
          </>
        )}
        
        {currentStatus === 'delivered' && (
          <>
            <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
            <Typography variant="body2" fontWeight="medium">
              Đơn hàng đã được giao thành công
            </Typography>
          </>
        )}
        
        {currentStatus === 'canceled' && (
          <>
            <Clock sx={{ color: 'error.main', mr: 1 }} />
            <Typography variant="body2" fontWeight="medium" color="error.main">
              Đơn hàng đã bị hủy
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
};

TimelineTracking.propTypes = {
  warehouses: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      address: PropTypes.string,
      arrivalTime: PropTypes.string.isRequired,
      departureTime: PropTypes.string.isRequired,
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
    })
  ).isRequired,
  shopLocation: PropTypes.shape({
    address: PropTypes.string,
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
  }).isRequired,
  customerLocation: PropTypes.shape({
    address: PropTypes.string,
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
  }),
  currentTime: PropTypes.instanceOf(Date),
  orderStatus: PropTypes.string
};

TimelineTracking.defaultProps = {
  customerLocation: null,
  currentTime: new Date(),
  orderStatus: 'shipping'
};

export default TimelineTracking; 