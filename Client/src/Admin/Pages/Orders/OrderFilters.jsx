import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Button,
  Grid,
  Typography,
  Divider,
} from "@mui/material";
import { getStatusText } from "./OrderHelpers";

const OrderFilters = ({
  filters,
  branches,
  onFilterChange,
  onClearFilters,
  ORDER_STATUSES,
  onToggleNearbyOrders,
}) => {
  const userRole = localStorage.getItem("userRole") || "user";
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    
    if (typeof onFilterChange === 'function') {
      onFilterChange(newFilters);
    } else {
      // Fallback nếu onFilterChange không phải là function
      console.warn('onFilterChange is not a function');
      // Sử dụng setFilters trực tiếp nếu có
      if (window.setFilters && typeof window.setFilters === 'function') {
        window.setFilters(newFilters);
      }
    }
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      searchTerm: "",
      statusFilter: "all",
      paymentMethodFilter: "all",
      paymentStatusFilter: "all",
      dateFilter: null,
      branchFilter: userRole === "manager" ? localFilters.branchFilter : null,
    };
    setLocalFilters(clearedFilters);
    
    if (typeof onClearFilters === 'function') {
      onClearFilters(clearedFilters);
    } else {
      console.warn('onClearFilters is not a function');
    }
  };

  // Branch filter field - only show for admin
  const branchFilterField = userRole === "admin" && (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <FormControl fullWidth variant="outlined" size="small">
        <InputLabel>Chi nhánh</InputLabel>
        <Select
          value={localFilters.branchFilter || ""}
          onChange={(e) => handleFilterChange("branchFilter", e.target.value)}
          label="Chi nhánh"
        >
          <MenuItem value="">Tất cả chi nhánh</MenuItem>
          {Array.isArray(branches) && branches.map((branch) => (
            <MenuItem key={branch._id} value={branch._id}>
              {branch.name || "Chi nhánh không xác định"}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
  );

  return (
    <Box
      sx={{
        p: 2,
        mb: 2,
        backgroundColor: "background.paper",
        borderRadius: 1,
        boxShadow: 1,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Bộ lọc đơn hàng
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2} alignItems="center">
        {/* Search field */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            fullWidth
            size="small"
            label="Tìm kiếm đơn hàng"
            variant="outlined"
            value={localFilters.searchTerm || ""}
            onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
            placeholder="Mã đơn, tên khách hàng, SĐT..."
          />
        </Grid>

        {/* Status filter */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={localFilters.statusFilter || "all"}
              onChange={(e) => handleFilterChange("statusFilter", e.target.value)}
              label="Trạng thái"
            >
              <MenuItem value="all">Tất cả trạng thái</MenuItem>
              {ORDER_STATUSES && Object.values(ORDER_STATUSES).map((status) => (
                <MenuItem key={status} value={status}>
                  {getStatusText(status)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Payment method filter */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>Phương thức thanh toán</InputLabel>
            <Select
              value={localFilters.paymentMethodFilter || "all"}
              onChange={(e) => handleFilterChange("paymentMethodFilter", e.target.value)}
              label="Phương thức thanh toán"
            >
              <MenuItem value="all">Tất cả phương thức</MenuItem>
              <MenuItem value="COD">Thanh toán khi nhận hàng (COD)</MenuItem>
              <MenuItem value="BANK_TRANSFER">Chuyển khoản ngân hàng</MenuItem>
              <MenuItem value="MOMO">Ví MoMo</MenuItem>
              <MenuItem value="VNPAY">VNPAY</MenuItem>
              <MenuItem value="ZALOPAY">ZaloPay</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Payment status filter */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>Trạng thái thanh toán</InputLabel>
            <Select
              value={localFilters.paymentStatusFilter || "all"}
              onChange={(e) => handleFilterChange("paymentStatusFilter", e.target.value)}
              label="Trạng thái thanh toán"
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="paid">Đã thanh toán</MenuItem>
              <MenuItem value="unpaid">Chưa thanh toán</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Date filter */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            fullWidth
            size="small"
            label="Ngày đặt hàng"
            variant="outlined"
            type="date"
            value={localFilters.dateFilter ? new Date(localFilters.dateFilter).toISOString().split('T')[0] : ""}
            onChange={(e) => handleFilterChange("dateFilter", e.target.value ? new Date(e.target.value) : null)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Branch filter - only for admin */}
        {branchFilterField}

        {/* Nearby orders toggle - only for manager */}
        {userRole === "manager" && (
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={localFilters.nearbyFilter || false}
                  onChange={(e) => {
                    handleFilterChange("nearbyFilter", e.target.checked);
                    if (typeof onToggleNearbyOrders === 'function') {
                      onToggleNearbyOrders(e.target.checked);
                    }
                  }}
                  color="primary"
                />
              }
              label="Đơn hàng gần đây"
            />
          </Grid>
        )}

        {/* Clear filters button */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
        <Button
            variant="outlined"
            color="secondary"
            onClick={handleClearFilters}
            fullWidth
          >
            Xóa bộ lọc
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

OrderFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  branches: PropTypes.array,
  onFilterChange: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  ORDER_STATUSES: PropTypes.object,
  onToggleNearbyOrders: PropTypes.func,
};

export default OrderFilters;
