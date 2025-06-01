import React from 'react';
import PropTypes from 'prop-types';
import { Box, Paper, Typography, Divider, List, ListItem, Grid } from '@mui/material';
import { formatCurrency } from './MapUtils';

/**
 * Hiển thị danh sách sản phẩm trong đơn hàng
 * @param {Object} props
 * @param {Object} props.order - Thông tin đơn hàng
 */
const OrderItems = ({ order }) => {
  // Kiểm tra nếu không có thông tin đơn hàng
  if (!order || !order.items || order.items.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sản phẩm đã mua
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Không có thông tin sản phẩm
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Sản phẩm đã mua ({order.items.length})
      </Typography>
      
      <List sx={{ width: '100%' }}>
        {order.items.map((item, index) => (
          <React.Fragment key={item._id || index}>
            <ListItem alignItems="flex-start" sx={{ px: 0 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={2}>
                  <Box
                    component="img"
                    src={item.product?.image || 'https://via.placeholder.com/100'}
                    alt={item.product?.name || 'Sản phẩm'}
                    sx={{
                      width: '100%',
                      height: 'auto',
                      objectFit: 'cover',
                      borderRadius: 1,
                      maxHeight: 100
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1" fontWeight="medium">
                    {item.product?.name || 'Sản phẩm không xác định'}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Số lượng: {item.quantity}
                  </Typography>
                  
                  {item.unit ? (
                    <Typography variant="body2" color="text.secondary">
                      Đơn vị: {item.unit} 
                      {item.conversionRate && item.conversionRate > 1 && ` (1 ${item.unit} = ${item.conversionRate} ${item.product?.unit || 'đơn vị'})`}
                    </Typography>
                  ) : item.product?.unit && (
                    <Typography variant="body2" color="text.secondary">
                      Đơn vị: {item.product.unit}
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(item.price)}
                  </Typography>
                  
                  {item.discountAmount > 0 && (
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                      Giảm giá: -{formatCurrency(item.discountAmount)}
                    </Typography>
                  )}
                  
                  <Typography variant="body1" fontWeight="bold" sx={{ mt: 1 }}>
                    Thành tiền: {formatCurrency(item.price * item.quantity - (item.discountAmount || 0))}
                  </Typography>
                </Grid>
              </Grid>
            </ListItem>
            
            {index < order.items.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
      
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={1}>
          <Grid item xs={7} sm={9}>
            <Typography variant="body1" textAlign="right">
              Tổng tiền hàng:
            </Typography>
          </Grid>
          <Grid item xs={5} sm={3}>
            <Typography variant="body1" fontWeight="medium" textAlign="right">
              {formatCurrency(order.totalAmount - (order.shippingFee || 0) - (order.tax || 0) + (order.discount || 0))}
            </Typography>
          </Grid>
          
          {order.discount > 0 && (
            <>
              <Grid item xs={7} sm={9}>
                <Typography variant="body1" textAlign="right" color="error">
                  Giảm giá:
                </Typography>
              </Grid>
              <Grid item xs={5} sm={3}>
                <Typography variant="body1" fontWeight="medium" textAlign="right" color="error">
                  -{formatCurrency(order.discount)}
                </Typography>
              </Grid>
            </>
          )}
          
          {order.shippingFee > 0 && (
            <>
              <Grid item xs={7} sm={9}>
                <Typography variant="body1" textAlign="right">
                  Phí vận chuyển:
                </Typography>
              </Grid>
              <Grid item xs={5} sm={3}>
                <Typography variant="body1" fontWeight="medium" textAlign="right">
                  {formatCurrency(order.shippingFee)}
                </Typography>
              </Grid>
            </>
          )}
          
          {order.tax > 0 && (
            <>
              <Grid item xs={7} sm={9}>
                <Typography variant="body1" textAlign="right">
                  Thuế:
                </Typography>
              </Grid>
              <Grid item xs={5} sm={3}>
                <Typography variant="body1" fontWeight="medium" textAlign="right">
                  {formatCurrency(order.tax)}
                </Typography>
              </Grid>
            </>
          )}
          
          <Grid item xs={7} sm={9}>
            <Typography variant="h6" textAlign="right">
              Tổng thanh toán:
            </Typography>
          </Grid>
          <Grid item xs={5} sm={3}>
            <Typography variant="h6" fontWeight="bold" textAlign="right" color="primary">
              {formatCurrency(order.totalAmount)}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

OrderItems.propTypes = {
  order: PropTypes.shape({
    _id: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        product: PropTypes.shape({
          _id: PropTypes.string,
          name: PropTypes.string,
          image: PropTypes.string,
          unit: PropTypes.string
        }),
        quantity: PropTypes.number,
        price: PropTypes.number,
        discountAmount: PropTypes.number,
        unit: PropTypes.string,
        unitPrice: PropTypes.number,
        conversionRate: PropTypes.number
      })
    ),
    totalAmount: PropTypes.number,
    discount: PropTypes.number,
    shippingFee: PropTypes.number,
    tax: PropTypes.number
  })
};

export default OrderItems; 