import React from 'react';
import PropTypes from 'prop-types';
import { Box, Paper, Typography, Grid, Chip } from '@mui/material';
import { CreditCard, Wallet, Receipt, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatCurrency } from './MapUtils';

/**
 * Hiển thị thông tin thanh toán của đơn hàng
 * @param {Object} props
 * @param {Object} props.order - Thông tin đơn hàng
 */
const PaymentInfo = ({ order }) => {
  // Xác định phương thức thanh toán
  const getPaymentMethodInfo = (method) => {
    switch (method) {
      case 'cod':
        return {
          label: 'Thanh toán khi nhận hàng (COD)',
          icon: <Wallet size={20} />,
          color: 'warning'
        };
      case 'banking':
        return {
          label: 'Chuyển khoản ngân hàng',
          icon: <CreditCard size={20} />,
          color: 'info'
        };
      case 'momo':
        return {
          label: 'Ví MoMo',
          icon: <Wallet size={20} />,
          color: 'secondary'
        };
      case 'zalopay':
        return {
          label: 'ZaloPay',
          icon: <Wallet size={20} />,
          color: 'primary'
        };
      case 'vnpay':
        return {
          label: 'VNPay',
          icon: <CreditCard size={20} />,
          color: 'success'
        };
      default:
        return {
          label: 'Không xác định',
          icon: <Receipt size={20} />,
          color: 'default'
        };
    }
  };

  // Xác định trạng thái thanh toán
  const getPaymentStatusInfo = (status, paymentMethod) => {
    // Nếu là COD và đơn hàng chưa giao, xem như chưa thanh toán
    if (paymentMethod === 'cod' && status !== 'delivered') {
      return {
        label: 'Chưa thanh toán',
        icon: <Clock size={20} />,
        color: 'warning'
      };
    }

    switch (status) {
      case 'delivered':
        return {
          label: 'Đã thanh toán',
          icon: <CheckCircle size={20} />,
          color: 'success'
        };
      case 'canceled':
        return {
          label: 'Đã hủy',
          icon: <XCircle size={20} />,
          color: 'error'
        };
      case 'pending':
      case 'confirmed':
      case 'shipping':
        return paymentMethod === 'cod'
          ? {
              label: 'Chưa thanh toán',
              icon: <Clock size={20} />,
              color: 'warning'
            }
          : {
              label: 'Đã thanh toán',
              icon: <CheckCircle size={20} />,
              color: 'success'
            };
      default:
        return {
          label: 'Không xác định',
          icon: <Clock size={20} />,
          color: 'default'
        };
    }
  };

  if (!order) {
    return null;
  }

  const paymentMethod = getPaymentMethodInfo(order.paymentMethod);
  const paymentStatus = getPaymentStatusInfo(order.status, order.paymentMethod);

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Thông tin thanh toán
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Phương thức thanh toán
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Chip
                icon={paymentMethod.icon}
                label={paymentMethod.label}
                color={paymentMethod.color}
                variant="outlined"
              />
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Trạng thái thanh toán
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Chip
                icon={paymentStatus.icon}
                label={paymentStatus.label}
                color={paymentStatus.color}
                variant="outlined"
              />
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, mt: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={7} sm={9}>
                <Typography variant="body1" textAlign="right" fontWeight="bold">
                  Tổng thanh toán:
                </Typography>
              </Grid>
              <Grid item xs={5} sm={3}>
                <Typography variant="body1" fontWeight="bold" textAlign="right" color="primary">
                  {formatCurrency(order.totalAmount)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

PaymentInfo.propTypes = {
  order: PropTypes.shape({
    _id: PropTypes.string,
    status: PropTypes.string,
    paymentMethod: PropTypes.string,
    paymentStatus: PropTypes.string,
    totalAmount: PropTypes.number
  })
};

export default PaymentInfo; 