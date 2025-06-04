"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.validateCoupon = exports.updateCouponUsage = exports.updateCoupon = exports.resetCouponUsage = exports.getCouponStats = exports.getCouponByCode = exports.getAllCoupons = exports.getActiveCoupons = exports.deleteCoupon = exports.createCoupon = exports.applyCoupon = void 0;
var _Coupon = _interopRequireDefault(require("../Model/Coupon.js"));
var _notificationService = require("../Services/notificationService.js"); /* eslint-disable no-dupe-keys */

// Tạo mã giảm giá mới
const createCoupon = async (req, res) => {
  try {
    const { code, type, value, minOrder, maxDiscount, expiresAt, usageLimit, description, isActive } = req.body;

    // Kiểm tra xem mã giảm giá đã tồn tại chưa
    const existingCoupon = await _Coupon.default.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá này đã tồn tại"
      });
    }

    // Tạo mới coupon với used = 0 rõ ràng
    const newCoupon = new _Coupon.default({
      code: code.toUpperCase(),
      type,
      value,
      minOrder,
      maxDiscount,
      expiresAt,
      usageLimit,
      used: 0,
      isActive: isActive !== undefined ? isActive : true,
      description
    });

    await newCoupon.save();

    // Gửi thông báo về mã giảm giá mới đến tất cả người dùng đã đăng ký
    (0, _notificationService.sendNewCouponNotification)(newCoupon).catch((error) =>
    console.error('Error sending coupon notification to users:', error)
    );

    return res.status(201).json({
      success: true,
      data: newCoupon,
      message: "Đã tạo mã giảm giá thành công"
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return res.status(500).json({
      success: false,
      message: `Đã xảy ra lỗi khi tạo mã giảm giá: ${error.message}`
    });
  }
};

// Lấy tất cả mã giảm giá (dành cho admin)
exports.createCoupon = createCoupon;const getAllCoupons = async (req, res) => {
  try {
    const coupons = await _Coupon.default.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons
    });
  } catch (error) {
    console.error("Error getting coupons:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách mã giảm giá",
      error: error.message
    });
  }
};

// Lấy thông tin mã giảm giá theo code
exports.getAllCoupons = getAllCoupons;const getCouponByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const coupon = await _Coupon.default.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mã giảm giá"
      });
    }

    res.status(200).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error("Error getting coupon:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy thông tin mã giảm giá",
      error: error.message
    });
  }
};

// Get active coupons for public display
exports.getCouponByCode = getCouponByCode;const getActiveCoupons = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const now = new Date();

    // Find active coupons that haven't expired and haven't reached usage limit
    const coupons = await _Coupon.default.find({
      isActive: true,
      $or: [
      { expiresAt: { $gt: now } },
      { expiresAt: null }],

      $or: [
      { $expr: { $lt: ["$used", "$usageLimit"] } },
      { usageLimit: null }]

    }).
    sort({ createdAt: -1 }).
    limit(limit);

    return res.status(200).json(coupons);
  } catch (error) {
    console.error("Error getting active coupons:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Validate a coupon code
exports.getActiveCoupons = getActiveCoupons;const validateCoupon = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    const now = new Date();
    const coupon = await _Coupon.default.findOne({
      code: code.toUpperCase(),
      isActive: true,
      $or: [
      { expiresAt: { $gt: now } },
      { expiresAt: null }],

      $or: [
      { $expr: { $lt: ["$used", "$usageLimit"] } },
      { usageLimit: null }]

    });

    if (!coupon) {
      return res.status(404).json({ message: "Invalid or expired coupon code" });
    }

    // Check if order meets minimum amount
    if (orderTotal < coupon.minOrder) {
      return res.status(400).json({
        message: `Tổng giá trị đơn hàng phải ít nhất là ${coupon.minOrder} để sử dụng phiếu giảm giá này`
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = orderTotal * coupon.value / 100;
      // Apply max discount limit if it exists
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.value;
    }

    return res.status(200).json({
      valid: true,
      coupon,
      discountAmount
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Apply a coupon (increment usage count)
exports.validateCoupon = validateCoupon;const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    const coupon = await _Coupon.default.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    // Increment usage count
    coupon.used += 1;
    await coupon.save();

    return res.status(200).json({ message: "Coupon applied successfully" });
  } catch (error) {
    console.error("Error applying coupon:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Cập nhật số lần sử dụng mã giảm giá
exports.applyCoupon = applyCoupon;const updateCouponUsage = async (req, res) => {
  try {
    const { code } = req.params;

    const coupon = await _Coupon.default.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mã giảm giá"
      });
    }

    // Tăng số lần sử dụng
    coupon.used += 1;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật số lần sử dụng mã giảm giá thành công",
      data: coupon
    });
  } catch (error) {
    console.error("Error updating coupon usage:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật số lần sử dụng mã giảm giá",
      error: error.message
    });
  }
};

// Cập nhật thông tin mã giảm giá
exports.updateCouponUsage = updateCouponUsage;const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Kiểm tra xem mã giảm giá có tồn tại không
    const existingCoupon = await _Coupon.default.findById(id);
    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mã giảm giá"
      });
    }

    // Nếu đang thay đổi code, kiểm tra xem code mới đã tồn tại chưa
    if (updateData.code && updateData.code !== existingCoupon.code) {
      const duplicateCoupon = await _Coupon.default.findOne({
        code: updateData.code.toUpperCase(),
        _id: { $ne: id }
      });

      if (duplicateCoupon) {
        return res.status(400).json({
          success: false,
          message: "Mã giảm giá này đã tồn tại"
        });
      }

      // Đảm bảo code luôn được lưu dưới dạng chữ hoa
      updateData.code = updateData.code.toUpperCase();
    }

    // Cập nhật mã giảm giá
    const updatedCoupon = await _Coupon.default.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Cập nhật mã giảm giá thành công",
      data: updatedCoupon
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật mã giảm giá",
      error: error.message
    });
  }
};

// Xóa mã giảm giá
exports.updateCoupon = updateCoupon;const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem mã giảm giá có tồn tại không
    const coupon = await _Coupon.default.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mã giảm giá"
      });
    }

    // Xóa mã giảm giá
    await _Coupon.default.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Xóa mã giảm giá thành công"
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xóa mã giảm giá",
      error: error.message
    });
  }
};

// Đặt lại số lượng đã sử dụng của coupon
exports.deleteCoupon = deleteCoupon;const resetCouponUsage = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await _Coupon.default.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mã giảm giá"
      });
    }

    // Đặt lại giá trị used về 0 hoặc số chỉ định
    const { value } = req.body;
    const resetValue = value !== undefined ? Number(value) : 0;

    coupon.used = resetValue;
    await coupon.save();

    return res.status(200).json({
      success: true,
      message: `Đã đặt lại số lượng sử dụng thành ${resetValue}`,
      data: coupon
    });
  } catch (error) {
    console.error("Error resetting coupon usage:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi đặt lại số lượng sử dụng",
      error: error.message
    });
  }
};

// Get coupon statistics for reports
exports.resetCouponUsage = resetCouponUsage;const getCouponStats = async (req, res) => {
  try {
    const now = new Date();

    // Get all coupons
    const allCoupons = await _Coupon.default.find();

    // Count active coupons
    const activeCoupons = await _Coupon.default.countDocuments({
      isActive: true,
      $or: [
      { expiresAt: { $gt: now } },
      { expiresAt: null }]

    });

    // Get total used count
    const totalUsedCount = allCoupons.reduce((sum, coupon) => sum + coupon.used, 0);

    // Calculate usage by type
    const typeStats = {
      percentage: {
        count: 0,
        used: 0,
        totalValue: 0,
        estimatedRevenue: 0
      },
      fixed: {
        count: 0,
        used: 0,
        totalValue: 0,
        estimatedRevenue: 0
      }
    };

    allCoupons.forEach((coupon) => {
      if (coupon.type === 'percentage') {
        typeStats.percentage.count++;
        typeStats.percentage.used += coupon.used;
        typeStats.percentage.totalValue += coupon.value * coupon.used; // Total percentage points

        // Estimate revenue based on minimum order value
        const estimatedOrderValue = coupon.minOrder * 1.5; // Assume average order is 1.5x minimum
        typeStats.percentage.estimatedRevenue += coupon.used * estimatedOrderValue;
      } else {
        typeStats.fixed.count++;
        typeStats.fixed.used += coupon.used;
        typeStats.fixed.totalValue += coupon.value * coupon.used; // Total fixed amount

        // Estimate revenue based on minimum order value
        const estimatedOrderValue = coupon.minOrder * 1.5; // Assume average order is 1.5x minimum
        typeStats.fixed.estimatedRevenue += coupon.used * estimatedOrderValue;
      }
    });

    // Format voucher usage data for table display
    const voucherUsage = allCoupons.
    sort((a, b) => b.used - a.used) // Sort by most used
    .map((coupon) => ({
      code: coupon.code,
      discount: coupon.type === 'percentage' ? `${coupon.value}%` : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.value),
      used: coupon.used,
      limit: coupon.usageLimit || '∞',
      revenue: coupon.type === 'percentage' ?
      coupon.value * coupon.used * coupon.minOrder / 100 : // Estimate for percentage type
      coupon.used * coupon.minOrder, // Estimate for fixed type
      description: coupon.description
    }));

    // Generate mock data for usage over time (last 6 months)
    const usageOverTime = [];
    const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

    const currentMonth = new Date().getMonth();
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      usageOverTime.push({
        month: monthNames[monthIndex],
        'Phần trăm': Math.floor(Math.random() * 30) + 10,
        'Cố định': Math.floor(Math.random() * 20) + 5
      });
    }

    // Revenue comparison: Estimated revenue with coupons vs without coupons (mock data)
    const revenueComparison = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const baseRevenue = Math.floor(Math.random() * 50000000) + 20000000;
      const discountValue = Math.floor(Math.random() * 8000000) + 2000000;

      revenueComparison.push({
        month: monthNames[monthIndex],
        'Doanh thu thực tế': baseRevenue - discountValue,
        'Doanh thu không có khuyến mãi': baseRevenue,
        'Tổng giảm giá': discountValue
      });
    }

    // Sample data for promotion effectiveness by category
    const promotionEffectiveness = allCoupons.
    sort((a, b) => b.used - a.used).
    slice(0, 3).
    map((coupon) => ({
      name: coupon.code,
      'Rau': Math.floor(Math.random() * 500000) + 300000,
      'Thịt & Hải sản': Math.floor(Math.random() * 800000) + 600000,
      'Trứng & Sữa': Math.floor(Math.random() * 400000) + 200000
    }));

    // Sample data for conversion rates - use real codes
    const conversionRate = allCoupons.
    sort((a, b) => b.used - a.used).
    slice(0, 5).
    map((coupon) => ({
      name: coupon.code,
      rate: Math.floor(Math.random() * 40) + 50 // Random rate between 50-90%
    }));

    // Return the statistics
    res.status(200).json({
      success: true,
      data: {
        totalCoupons: allCoupons.length,
        activeCoupons,
        totalUsedCount,
        typeStats,
        voucherUsage,
        usageOverTime,
        revenueComparison,
        promotionEffectiveness,
        conversionRate
      }
    });
  } catch (error) {
    console.error("Error getting coupon statistics:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy thống kê mã giảm giá",
      error: error.message
    });
  }
};exports.getCouponStats = getCouponStats;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfQ291cG9uIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfbm90aWZpY2F0aW9uU2VydmljZSIsImNyZWF0ZUNvdXBvbiIsInJlcSIsInJlcyIsImNvZGUiLCJ0eXBlIiwidmFsdWUiLCJtaW5PcmRlciIsIm1heERpc2NvdW50IiwiZXhwaXJlc0F0IiwidXNhZ2VMaW1pdCIsImRlc2NyaXB0aW9uIiwiaXNBY3RpdmUiLCJib2R5IiwiZXhpc3RpbmdDb3Vwb24iLCJDb3Vwb24iLCJmaW5kT25lIiwidG9VcHBlckNhc2UiLCJzdGF0dXMiLCJqc29uIiwic3VjY2VzcyIsIm1lc3NhZ2UiLCJuZXdDb3Vwb24iLCJ1c2VkIiwidW5kZWZpbmVkIiwic2F2ZSIsInNlbmROZXdDb3Vwb25Ob3RpZmljYXRpb24iLCJjYXRjaCIsImVycm9yIiwiY29uc29sZSIsImRhdGEiLCJleHBvcnRzIiwiZ2V0QWxsQ291cG9ucyIsImNvdXBvbnMiLCJmaW5kIiwic29ydCIsImNyZWF0ZWRBdCIsImNvdW50IiwibGVuZ3RoIiwiZ2V0Q291cG9uQnlDb2RlIiwicGFyYW1zIiwiY291cG9uIiwiZ2V0QWN0aXZlQ291cG9ucyIsImxpbWl0IiwicGFyc2VJbnQiLCJxdWVyeSIsIm5vdyIsIkRhdGUiLCIkb3IiLCIkZ3QiLCIkZXhwciIsIiRsdCIsInZhbGlkYXRlQ291cG9uIiwib3JkZXJUb3RhbCIsImRpc2NvdW50QW1vdW50IiwidmFsaWQiLCJhcHBseUNvdXBvbiIsInVwZGF0ZUNvdXBvblVzYWdlIiwidXBkYXRlQ291cG9uIiwiaWQiLCJ1cGRhdGVEYXRhIiwiZmluZEJ5SWQiLCJkdXBsaWNhdGVDb3Vwb24iLCJfaWQiLCIkbmUiLCJ1cGRhdGVkQ291cG9uIiwiZmluZEJ5SWRBbmRVcGRhdGUiLCJuZXciLCJydW5WYWxpZGF0b3JzIiwiZGVsZXRlQ291cG9uIiwiZmluZEJ5SWRBbmREZWxldGUiLCJyZXNldENvdXBvblVzYWdlIiwicmVzZXRWYWx1ZSIsIk51bWJlciIsImdldENvdXBvblN0YXRzIiwiYWxsQ291cG9ucyIsImFjdGl2ZUNvdXBvbnMiLCJjb3VudERvY3VtZW50cyIsInRvdGFsVXNlZENvdW50IiwicmVkdWNlIiwic3VtIiwidHlwZVN0YXRzIiwicGVyY2VudGFnZSIsInRvdGFsVmFsdWUiLCJlc3RpbWF0ZWRSZXZlbnVlIiwiZml4ZWQiLCJmb3JFYWNoIiwiZXN0aW1hdGVkT3JkZXJWYWx1ZSIsInZvdWNoZXJVc2FnZSIsImEiLCJiIiwibWFwIiwiZGlzY291bnQiLCJJbnRsIiwiTnVtYmVyRm9ybWF0Iiwic3R5bGUiLCJjdXJyZW5jeSIsImZvcm1hdCIsInJldmVudWUiLCJ1c2FnZU92ZXJUaW1lIiwibW9udGhOYW1lcyIsImN1cnJlbnRNb250aCIsImdldE1vbnRoIiwiaSIsIm1vbnRoSW5kZXgiLCJwdXNoIiwibW9udGgiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJyZXZlbnVlQ29tcGFyaXNvbiIsImJhc2VSZXZlbnVlIiwiZGlzY291bnRWYWx1ZSIsInByb21vdGlvbkVmZmVjdGl2ZW5lc3MiLCJzbGljZSIsIm5hbWUiLCJjb252ZXJzaW9uUmF0ZSIsInJhdGUiLCJ0b3RhbENvdXBvbnMiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvQ29udHJvbGxlci9jb3Vwb25Db250cm9sbGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIG5vLWR1cGUta2V5cyAqL1xyXG5pbXBvcnQgQ291cG9uIGZyb20gXCIuLi9Nb2RlbC9Db3Vwb24uanNcIjtcclxuaW1wb3J0IHsgc2VuZE5ld0NvdXBvbk5vdGlmaWNhdGlvbiB9IGZyb20gXCIuLi9TZXJ2aWNlcy9ub3RpZmljYXRpb25TZXJ2aWNlLmpzXCI7XHJcblxyXG4vLyBU4bqhbyBtw6MgZ2nhuqNtIGdpw6EgbeG7m2lcclxuZXhwb3J0IGNvbnN0IGNyZWF0ZUNvdXBvbiA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IGNvZGUsIHR5cGUsIHZhbHVlLCBtaW5PcmRlciwgbWF4RGlzY291bnQsIGV4cGlyZXNBdCwgdXNhZ2VMaW1pdCwgZGVzY3JpcHRpb24sIGlzQWN0aXZlIH0gPSByZXEuYm9keTtcclxuXHJcbiAgICAvLyBLaeG7g20gdHJhIHhlbSBtw6MgZ2nhuqNtIGdpw6EgxJHDoyB04buTbiB04bqhaSBjaMawYVxyXG4gICAgY29uc3QgZXhpc3RpbmdDb3Vwb24gPSBhd2FpdCBDb3Vwb24uZmluZE9uZSh7IGNvZGU6IGNvZGUudG9VcHBlckNhc2UoKSB9KTtcclxuICAgIGlmIChleGlzdGluZ0NvdXBvbikge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiTcOjIGdp4bqjbSBnacOhIG7DoHkgxJHDoyB04buTbiB04bqhaVwiXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFThuqFvIG3hu5tpIGNvdXBvbiB24bubaSB1c2VkID0gMCByw7UgcsOgbmdcclxuICAgIGNvbnN0IG5ld0NvdXBvbiA9IG5ldyBDb3Vwb24oe1xyXG4gICAgICBjb2RlOiBjb2RlLnRvVXBwZXJDYXNlKCksXHJcbiAgICAgIHR5cGUsXHJcbiAgICAgIHZhbHVlLFxyXG4gICAgICBtaW5PcmRlcixcclxuICAgICAgbWF4RGlzY291bnQsXHJcbiAgICAgIGV4cGlyZXNBdCxcclxuICAgICAgdXNhZ2VMaW1pdCxcclxuICAgICAgdXNlZDogMCxcclxuICAgICAgaXNBY3RpdmU6IGlzQWN0aXZlICE9PSB1bmRlZmluZWQgPyBpc0FjdGl2ZSA6IHRydWUsXHJcbiAgICAgIGRlc2NyaXB0aW9uXHJcbiAgICB9KTtcclxuXHJcbiAgICBhd2FpdCBuZXdDb3Vwb24uc2F2ZSgpO1xyXG5cclxuICAgIC8vIEfhu61pIHRow7RuZyBiw6FvIHbhu4EgbcOjIGdp4bqjbSBnacOhIG3hu5tpIMSR4bq/biB04bqldCBj4bqjIG5nxrDhu51pIGTDuW5nIMSRw6MgxJHEg25nIGvDvVxyXG4gICAgc2VuZE5ld0NvdXBvbk5vdGlmaWNhdGlvbihuZXdDb3Vwb24pLmNhdGNoKGVycm9yID0+IFxyXG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzZW5kaW5nIGNvdXBvbiBub3RpZmljYXRpb24gdG8gdXNlcnM6JywgZXJyb3IpXHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMSkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIGRhdGE6IG5ld0NvdXBvbixcclxuICAgICAgbWVzc2FnZTogXCLEkMOjIHThuqFvIG3DoyBnaeG6o20gZ2nDoSB0aMOgbmggY8O0bmdcIlxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBjcmVhdGluZyBjb3Vwb246XCIsIGVycm9yKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiBgxJDDoyB44bqjeSByYSBs4buXaSBraGkgdOG6oW8gbcOjIGdp4bqjbSBnacOhOiAke2Vycm9yLm1lc3NhZ2V9YFxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gTOG6pXkgdOG6pXQgY+G6oyBtw6MgZ2nhuqNtIGdpw6EgKGTDoG5oIGNobyBhZG1pbilcclxuZXhwb3J0IGNvbnN0IGdldEFsbENvdXBvbnMgPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgY291cG9ucyA9IGF3YWl0IENvdXBvbi5maW5kKCkuc29ydCh7IGNyZWF0ZWRBdDogLTEgfSk7XHJcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIGNvdW50OiBjb3Vwb25zLmxlbmd0aCxcclxuICAgICAgZGF0YTogY291cG9uc1xyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBnZXR0aW5nIGNvdXBvbnM6XCIsIGVycm9yKTtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IFwixJDDoyB44bqjeSByYSBs4buXaSBraGkgbOG6pXkgZGFuaCBzw6FjaCBtw6MgZ2nhuqNtIGdpw6FcIixcclxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIEzhuqV5IHRow7RuZyB0aW4gbcOjIGdp4bqjbSBnacOhIHRoZW8gY29kZVxyXG5leHBvcnQgY29uc3QgZ2V0Q291cG9uQnlDb2RlID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgY29kZSB9ID0gcmVxLnBhcmFtcztcclxuICAgIFxyXG4gICAgY29uc3QgY291cG9uID0gYXdhaXQgQ291cG9uLmZpbmRPbmUoeyBjb2RlOiBjb2RlLnRvVXBwZXJDYXNlKCkgfSk7XHJcbiAgICBcclxuICAgIGlmICghY291cG9uKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgbcOjIGdp4bqjbSBnacOhXCJcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgZGF0YTogY291cG9uXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGdldHRpbmcgY291cG9uOlwiLCBlcnJvcik7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiBcIsSQw6MgeOG6o3kgcmEgbOG7l2kga2hpIGzhuqV5IHRow7RuZyB0aW4gbcOjIGdp4bqjbSBnacOhXCIsXHJcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBHZXQgYWN0aXZlIGNvdXBvbnMgZm9yIHB1YmxpYyBkaXNwbGF5XHJcbmV4cG9ydCBjb25zdCBnZXRBY3RpdmVDb3Vwb25zID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGxpbWl0ID0gcGFyc2VJbnQocmVxLnF1ZXJ5LmxpbWl0KSB8fCAzO1xyXG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcclxuICAgIFxyXG4gICAgLy8gRmluZCBhY3RpdmUgY291cG9ucyB0aGF0IGhhdmVuJ3QgZXhwaXJlZCBhbmQgaGF2ZW4ndCByZWFjaGVkIHVzYWdlIGxpbWl0XHJcbiAgICBjb25zdCBjb3Vwb25zID0gYXdhaXQgQ291cG9uLmZpbmQoe1xyXG4gICAgICBpc0FjdGl2ZTogdHJ1ZSxcclxuICAgICAgJG9yOiBbXHJcbiAgICAgICAgeyBleHBpcmVzQXQ6IHsgJGd0OiBub3cgfSB9LFxyXG4gICAgICAgIHsgZXhwaXJlc0F0OiBudWxsIH1cclxuICAgICAgXSxcclxuICAgICAgJG9yOiBbXHJcbiAgICAgICAgeyAkZXhwcjogeyAkbHQ6IFtcIiR1c2VkXCIsIFwiJHVzYWdlTGltaXRcIl0gfSB9LFxyXG4gICAgICAgIHsgdXNhZ2VMaW1pdDogbnVsbCB9XHJcbiAgICAgIF1cclxuICAgIH0pXHJcbiAgICAuc29ydCh7IGNyZWF0ZWRBdDogLTEgfSlcclxuICAgIC5saW1pdChsaW1pdCk7XHJcbiAgICBcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbihjb3Vwb25zKTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGdldHRpbmcgYWN0aXZlIGNvdXBvbnM6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IG1lc3NhZ2U6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gVmFsaWRhdGUgYSBjb3Vwb24gY29kZVxyXG5leHBvcnQgY29uc3QgdmFsaWRhdGVDb3Vwb24gPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgeyBjb2RlLCBvcmRlclRvdGFsIH0gPSByZXEuYm9keTtcclxuICAgIFxyXG4gICAgaWYgKCFjb2RlKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IG1lc3NhZ2U6IFwiQ291cG9uIGNvZGUgaXMgcmVxdWlyZWRcIiB9KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcclxuICAgIGNvbnN0IGNvdXBvbiA9IGF3YWl0IENvdXBvbi5maW5kT25lKHtcclxuICAgICAgY29kZTogY29kZS50b1VwcGVyQ2FzZSgpLFxyXG4gICAgICBpc0FjdGl2ZTogdHJ1ZSxcclxuICAgICAgJG9yOiBbXHJcbiAgICAgICAgeyBleHBpcmVzQXQ6IHsgJGd0OiBub3cgfSB9LFxyXG4gICAgICAgIHsgZXhwaXJlc0F0OiBudWxsIH1cclxuICAgICAgXSxcclxuICAgICAgJG9yOiBbXHJcbiAgICAgICAgeyAkZXhwcjogeyAkbHQ6IFtcIiR1c2VkXCIsIFwiJHVzYWdlTGltaXRcIl0gfSB9LFxyXG4gICAgICAgIHsgdXNhZ2VMaW1pdDogbnVsbCB9XHJcbiAgICAgIF1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICBpZiAoIWNvdXBvbikge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBtZXNzYWdlOiBcIkludmFsaWQgb3IgZXhwaXJlZCBjb3Vwb24gY29kZVwiIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBDaGVjayBpZiBvcmRlciBtZWV0cyBtaW5pbXVtIGFtb3VudFxyXG4gICAgaWYgKG9yZGVyVG90YWwgPCBjb3Vwb24ubWluT3JkZXIpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgXHJcbiAgICAgICAgbWVzc2FnZTogYFThu5VuZyBnacOhIHRy4buLIMSRxqFuIGjDoG5nIHBo4bqjaSDDrXQgbmjhuqV0IGzDoCAke2NvdXBvbi5taW5PcmRlcn0gxJHhu4Mgc+G7rSBk4bulbmcgcGhp4bq/dSBnaeG6o20gZ2nDoSBuw6B5YCBcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIENhbGN1bGF0ZSBkaXNjb3VudCBhbW91bnRcclxuICAgIGxldCBkaXNjb3VudEFtb3VudCA9IDA7XHJcbiAgICBpZiAoY291cG9uLnR5cGUgPT09ICdwZXJjZW50YWdlJykge1xyXG4gICAgICBkaXNjb3VudEFtb3VudCA9IChvcmRlclRvdGFsICogY291cG9uLnZhbHVlKSAvIDEwMDtcclxuICAgICAgLy8gQXBwbHkgbWF4IGRpc2NvdW50IGxpbWl0IGlmIGl0IGV4aXN0c1xyXG4gICAgICBpZiAoY291cG9uLm1heERpc2NvdW50ICYmIGRpc2NvdW50QW1vdW50ID4gY291cG9uLm1heERpc2NvdW50KSB7XHJcbiAgICAgICAgZGlzY291bnRBbW91bnQgPSBjb3Vwb24ubWF4RGlzY291bnQ7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGRpc2NvdW50QW1vdW50ID0gY291cG9uLnZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICB2YWxpZDogdHJ1ZSxcclxuICAgICAgY291cG9uLFxyXG4gICAgICBkaXNjb3VudEFtb3VudFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciB2YWxpZGF0aW5nIGNvdXBvbjpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgbWVzc2FnZTogXCJJbnRlcm5hbCBzZXJ2ZXIgZXJyb3JcIiB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBBcHBseSBhIGNvdXBvbiAoaW5jcmVtZW50IHVzYWdlIGNvdW50KVxyXG5leHBvcnQgY29uc3QgYXBwbHlDb3Vwb24gPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgeyBjb2RlIH0gPSByZXEuYm9keTtcclxuICAgIFxyXG4gICAgY29uc3QgY291cG9uID0gYXdhaXQgQ291cG9uLmZpbmRPbmUoeyBjb2RlOiBjb2RlLnRvVXBwZXJDYXNlKCkgfSk7XHJcbiAgICBcclxuICAgIGlmICghY291cG9uKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IG1lc3NhZ2U6IFwiQ291cG9uIG5vdCBmb3VuZFwiIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBJbmNyZW1lbnQgdXNhZ2UgY291bnRcclxuICAgIGNvdXBvbi51c2VkICs9IDE7XHJcbiAgICBhd2FpdCBjb3Vwb24uc2F2ZSgpO1xyXG4gICAgXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBtZXNzYWdlOiBcIkNvdXBvbiBhcHBsaWVkIHN1Y2Nlc3NmdWxseVwiIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgYXBwbHlpbmcgY291cG9uOlwiLCBlcnJvcik7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBtZXNzYWdlOiBcIkludGVybmFsIHNlcnZlciBlcnJvclwiIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIEPhuq1wIG5o4bqtdCBz4buRIGzhuqduIHPhu60gZOG7pW5nIG3DoyBnaeG6o20gZ2nDoVxyXG5leHBvcnQgY29uc3QgdXBkYXRlQ291cG9uVXNhZ2UgPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgeyBjb2RlIH0gPSByZXEucGFyYW1zO1xyXG4gICAgXHJcbiAgICBjb25zdCBjb3Vwb24gPSBhd2FpdCBDb3Vwb24uZmluZE9uZSh7IGNvZGU6IGNvZGUudG9VcHBlckNhc2UoKSB9KTtcclxuICAgIFxyXG4gICAgaWYgKCFjb3Vwb24pIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSBtw6MgZ2nhuqNtIGdpw6FcIlxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gVMSDbmcgc+G7kSBs4bqnbiBz4butIGThu6VuZ1xyXG4gICAgY291cG9uLnVzZWQgKz0gMTtcclxuICAgIGF3YWl0IGNvdXBvbi5zYXZlKCk7XHJcbiAgICBcclxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgbWVzc2FnZTogXCJD4bqtcCBuaOG6rXQgc+G7kSBs4bqnbiBz4butIGThu6VuZyBtw6MgZ2nhuqNtIGdpw6EgdGjDoG5oIGPDtG5nXCIsXHJcbiAgICAgIGRhdGE6IGNvdXBvblxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciB1cGRhdGluZyBjb3Vwb24gdXNhZ2U6XCIsIGVycm9yKTtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IFwixJDDoyB44bqjeSByYSBs4buXaSBraGkgY+G6rXAgbmjhuq10IHPhu5EgbOG6p24gc+G7rSBk4bulbmcgbcOjIGdp4bqjbSBnacOhXCIsXHJcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBD4bqtcCBuaOG6rXQgdGjDtG5nIHRpbiBtw6MgZ2nhuqNtIGdpw6FcclxuZXhwb3J0IGNvbnN0IHVwZGF0ZUNvdXBvbiA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IGlkIH0gPSByZXEucGFyYW1zO1xyXG4gICAgY29uc3QgdXBkYXRlRGF0YSA9IHJlcS5ib2R5O1xyXG4gICAgXHJcbiAgICAvLyBLaeG7g20gdHJhIHhlbSBtw6MgZ2nhuqNtIGdpw6EgY8OzIHThu5NuIHThuqFpIGtow7RuZ1xyXG4gICAgY29uc3QgZXhpc3RpbmdDb3Vwb24gPSBhd2FpdCBDb3Vwb24uZmluZEJ5SWQoaWQpO1xyXG4gICAgaWYgKCFleGlzdGluZ0NvdXBvbikge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IG3DoyBnaeG6o20gZ2nDoVwiXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBO4bq/dSDEkWFuZyB0aGF5IMSR4buVaSBjb2RlLCBraeG7g20gdHJhIHhlbSBjb2RlIG3hu5tpIMSRw6MgdOG7k24gdOG6oWkgY2jGsGFcclxuICAgIGlmICh1cGRhdGVEYXRhLmNvZGUgJiYgdXBkYXRlRGF0YS5jb2RlICE9PSBleGlzdGluZ0NvdXBvbi5jb2RlKSB7XHJcbiAgICAgIGNvbnN0IGR1cGxpY2F0ZUNvdXBvbiA9IGF3YWl0IENvdXBvbi5maW5kT25lKHsgXHJcbiAgICAgICAgY29kZTogdXBkYXRlRGF0YS5jb2RlLnRvVXBwZXJDYXNlKCksIFxyXG4gICAgICAgIF9pZDogeyAkbmU6IGlkIH0gXHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgaWYgKGR1cGxpY2F0ZUNvdXBvbikge1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgIG1lc3NhZ2U6IFwiTcOjIGdp4bqjbSBnacOhIG7DoHkgxJHDoyB04buTbiB04bqhaVwiXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vIMSQ4bqjbSBi4bqjbyBjb2RlIGx1w7RuIMSRxrDhu6NjIGzGsHUgZMaw4bubaSBk4bqhbmcgY2jhu68gaG9hXHJcbiAgICAgIHVwZGF0ZURhdGEuY29kZSA9IHVwZGF0ZURhdGEuY29kZS50b1VwcGVyQ2FzZSgpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBD4bqtcCBuaOG6rXQgbcOjIGdp4bqjbSBnacOhXHJcbiAgICBjb25zdCB1cGRhdGVkQ291cG9uID0gYXdhaXQgQ291cG9uLmZpbmRCeUlkQW5kVXBkYXRlKFxyXG4gICAgICBpZCxcclxuICAgICAgdXBkYXRlRGF0YSxcclxuICAgICAgeyBuZXc6IHRydWUsIHJ1blZhbGlkYXRvcnM6IHRydWUgfVxyXG4gICAgKTtcclxuICAgIFxyXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlOiBcIkPhuq1wIG5o4bqtdCBtw6MgZ2nhuqNtIGdpw6EgdGjDoG5oIGPDtG5nXCIsXHJcbiAgICAgIGRhdGE6IHVwZGF0ZWRDb3Vwb25cclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgdXBkYXRpbmcgY291cG9uOlwiLCBlcnJvcik7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiBcIsSQw6MgeOG6o3kgcmEgbOG7l2kga2hpIGPhuq1wIG5o4bqtdCBtw6MgZ2nhuqNtIGdpw6FcIixcclxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIFjDs2EgbcOjIGdp4bqjbSBnacOhXHJcbmV4cG9ydCBjb25zdCBkZWxldGVDb3Vwb24gPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgeyBpZCB9ID0gcmVxLnBhcmFtcztcclxuICAgIFxyXG4gICAgLy8gS2nhu4NtIHRyYSB4ZW0gbcOjIGdp4bqjbSBnacOhIGPDsyB04buTbiB04bqhaSBraMO0bmdcclxuICAgIGNvbnN0IGNvdXBvbiA9IGF3YWl0IENvdXBvbi5maW5kQnlJZChpZCk7XHJcbiAgICBpZiAoIWNvdXBvbikge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IG3DoyBnaeG6o20gZ2nDoVwiXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBYw7NhIG3DoyBnaeG6o20gZ2nDoVxyXG4gICAgYXdhaXQgQ291cG9uLmZpbmRCeUlkQW5kRGVsZXRlKGlkKTtcclxuICAgIFxyXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlOiBcIljDs2EgbcOjIGdp4bqjbSBnacOhIHRow6BuaCBjw7RuZ1wiXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGRlbGV0aW5nIGNvdXBvbjpcIiwgZXJyb3IpO1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgbWVzc2FnZTogXCLEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSB4w7NhIG3DoyBnaeG6o20gZ2nDoVwiLFxyXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gxJDhurd0IGzhuqFpIHPhu5EgbMaw4bujbmcgxJHDoyBz4butIGThu6VuZyBj4bunYSBjb3Vwb25cclxuZXhwb3J0IGNvbnN0IHJlc2V0Q291cG9uVXNhZ2UgPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgeyBpZCB9ID0gcmVxLnBhcmFtcztcclxuICAgIFxyXG4gICAgY29uc3QgY291cG9uID0gYXdhaXQgQ291cG9uLmZpbmRCeUlkKGlkKTtcclxuICAgIGlmICghY291cG9uKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgbcOjIGdp4bqjbSBnacOhXCJcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIMSQ4bq3dCBs4bqhaSBnacOhIHRy4buLIHVzZWQgduG7gSAwIGhv4bq3YyBz4buRIGNo4buJIMSR4buLbmhcclxuICAgIGNvbnN0IHsgdmFsdWUgfSA9IHJlcS5ib2R5O1xyXG4gICAgY29uc3QgcmVzZXRWYWx1ZSA9IHZhbHVlICE9PSB1bmRlZmluZWQgPyBOdW1iZXIodmFsdWUpIDogMDtcclxuICAgIFxyXG4gICAgY291cG9uLnVzZWQgPSByZXNldFZhbHVlO1xyXG4gICAgYXdhaXQgY291cG9uLnNhdmUoKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgbWVzc2FnZTogYMSQw6MgxJHhurd0IGzhuqFpIHPhu5EgbMaw4bujbmcgc+G7rSBk4bulbmcgdGjDoG5oICR7cmVzZXRWYWx1ZX1gLFxyXG4gICAgICBkYXRhOiBjb3Vwb25cclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgcmVzZXR0aW5nIGNvdXBvbiB1c2FnZTpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IFwixJDDoyB44bqjeSByYSBs4buXaSBraGkgxJHhurd0IGzhuqFpIHPhu5EgbMaw4bujbmcgc+G7rSBk4bulbmdcIixcclxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIEdldCBjb3Vwb24gc3RhdGlzdGljcyBmb3IgcmVwb3J0c1xyXG5leHBvcnQgY29uc3QgZ2V0Q291cG9uU3RhdHMgPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcclxuICAgIFxyXG4gICAgLy8gR2V0IGFsbCBjb3Vwb25zXHJcbiAgICBjb25zdCBhbGxDb3Vwb25zID0gYXdhaXQgQ291cG9uLmZpbmQoKTtcclxuICAgIFxyXG4gICAgLy8gQ291bnQgYWN0aXZlIGNvdXBvbnNcclxuICAgIGNvbnN0IGFjdGl2ZUNvdXBvbnMgPSBhd2FpdCBDb3Vwb24uY291bnREb2N1bWVudHMoe1xyXG4gICAgICBpc0FjdGl2ZTogdHJ1ZSxcclxuICAgICAgJG9yOiBbXHJcbiAgICAgICAgeyBleHBpcmVzQXQ6IHsgJGd0OiBub3cgfSB9LFxyXG4gICAgICAgIHsgZXhwaXJlc0F0OiBudWxsIH1cclxuICAgICAgXVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEdldCB0b3RhbCB1c2VkIGNvdW50XHJcbiAgICBjb25zdCB0b3RhbFVzZWRDb3VudCA9IGFsbENvdXBvbnMucmVkdWNlKChzdW0sIGNvdXBvbikgPT4gc3VtICsgY291cG9uLnVzZWQsIDApO1xyXG4gICAgXHJcbiAgICAvLyBDYWxjdWxhdGUgdXNhZ2UgYnkgdHlwZVxyXG4gICAgY29uc3QgdHlwZVN0YXRzID0ge1xyXG4gICAgICBwZXJjZW50YWdlOiB7XHJcbiAgICAgICAgY291bnQ6IDAsXHJcbiAgICAgICAgdXNlZDogMCxcclxuICAgICAgICB0b3RhbFZhbHVlOiAwLFxyXG4gICAgICAgIGVzdGltYXRlZFJldmVudWU6IDBcclxuICAgICAgfSxcclxuICAgICAgZml4ZWQ6IHtcclxuICAgICAgICBjb3VudDogMCxcclxuICAgICAgICB1c2VkOiAwLFxyXG4gICAgICAgIHRvdGFsVmFsdWU6IDAsXHJcbiAgICAgICAgZXN0aW1hdGVkUmV2ZW51ZTogMFxyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBhbGxDb3Vwb25zLmZvckVhY2goY291cG9uID0+IHtcclxuICAgICAgaWYgKGNvdXBvbi50eXBlID09PSAncGVyY2VudGFnZScpIHtcclxuICAgICAgICB0eXBlU3RhdHMucGVyY2VudGFnZS5jb3VudCsrO1xyXG4gICAgICAgIHR5cGVTdGF0cy5wZXJjZW50YWdlLnVzZWQgKz0gY291cG9uLnVzZWQ7XHJcbiAgICAgICAgdHlwZVN0YXRzLnBlcmNlbnRhZ2UudG90YWxWYWx1ZSArPSBjb3Vwb24udmFsdWUgKiBjb3Vwb24udXNlZDsgLy8gVG90YWwgcGVyY2VudGFnZSBwb2ludHNcclxuICAgICAgICBcclxuICAgICAgICAvLyBFc3RpbWF0ZSByZXZlbnVlIGJhc2VkIG9uIG1pbmltdW0gb3JkZXIgdmFsdWVcclxuICAgICAgICBjb25zdCBlc3RpbWF0ZWRPcmRlclZhbHVlID0gY291cG9uLm1pbk9yZGVyICogMS41OyAvLyBBc3N1bWUgYXZlcmFnZSBvcmRlciBpcyAxLjV4IG1pbmltdW1cclxuICAgICAgICB0eXBlU3RhdHMucGVyY2VudGFnZS5lc3RpbWF0ZWRSZXZlbnVlICs9IGNvdXBvbi51c2VkICogZXN0aW1hdGVkT3JkZXJWYWx1ZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0eXBlU3RhdHMuZml4ZWQuY291bnQrKztcclxuICAgICAgICB0eXBlU3RhdHMuZml4ZWQudXNlZCArPSBjb3Vwb24udXNlZDtcclxuICAgICAgICB0eXBlU3RhdHMuZml4ZWQudG90YWxWYWx1ZSArPSBjb3Vwb24udmFsdWUgKiBjb3Vwb24udXNlZDsgLy8gVG90YWwgZml4ZWQgYW1vdW50XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gRXN0aW1hdGUgcmV2ZW51ZSBiYXNlZCBvbiBtaW5pbXVtIG9yZGVyIHZhbHVlXHJcbiAgICAgICAgY29uc3QgZXN0aW1hdGVkT3JkZXJWYWx1ZSA9IGNvdXBvbi5taW5PcmRlciAqIDEuNTsgLy8gQXNzdW1lIGF2ZXJhZ2Ugb3JkZXIgaXMgMS41eCBtaW5pbXVtXHJcbiAgICAgICAgdHlwZVN0YXRzLmZpeGVkLmVzdGltYXRlZFJldmVudWUgKz0gY291cG9uLnVzZWQgKiBlc3RpbWF0ZWRPcmRlclZhbHVlO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gRm9ybWF0IHZvdWNoZXIgdXNhZ2UgZGF0YSBmb3IgdGFibGUgZGlzcGxheVxyXG4gICAgY29uc3Qgdm91Y2hlclVzYWdlID0gYWxsQ291cG9uc1xyXG4gICAgICAuc29ydCgoYSwgYikgPT4gYi51c2VkIC0gYS51c2VkKSAvLyBTb3J0IGJ5IG1vc3QgdXNlZFxyXG4gICAgICAubWFwKGNvdXBvbiA9PiAoe1xyXG4gICAgICAgIGNvZGU6IGNvdXBvbi5jb2RlLFxyXG4gICAgICAgIGRpc2NvdW50OiBjb3Vwb24udHlwZSA9PT0gJ3BlcmNlbnRhZ2UnID8gYCR7Y291cG9uLnZhbHVlfSVgIDogbmV3IEludGwuTnVtYmVyRm9ybWF0KCd2aS1WTicsIHsgc3R5bGU6ICdjdXJyZW5jeScsIGN1cnJlbmN5OiAnVk5EJyB9KS5mb3JtYXQoY291cG9uLnZhbHVlKSxcclxuICAgICAgICB1c2VkOiBjb3Vwb24udXNlZCxcclxuICAgICAgICBsaW1pdDogY291cG9uLnVzYWdlTGltaXQgfHwgJ+KInicsXHJcbiAgICAgICAgcmV2ZW51ZTogY291cG9uLnR5cGUgPT09ICdwZXJjZW50YWdlJyA/IFxyXG4gICAgICAgICAgKGNvdXBvbi52YWx1ZSAqIGNvdXBvbi51c2VkICogY291cG9uLm1pbk9yZGVyIC8gMTAwKSA6IC8vIEVzdGltYXRlIGZvciBwZXJjZW50YWdlIHR5cGVcclxuICAgICAgICAgIChjb3Vwb24udXNlZCAqIGNvdXBvbi5taW5PcmRlciksIC8vIEVzdGltYXRlIGZvciBmaXhlZCB0eXBlXHJcbiAgICAgICAgZGVzY3JpcHRpb246IGNvdXBvbi5kZXNjcmlwdGlvblxyXG4gICAgICB9KSk7XHJcbiAgICBcclxuICAgIC8vIEdlbmVyYXRlIG1vY2sgZGF0YSBmb3IgdXNhZ2Ugb3ZlciB0aW1lIChsYXN0IDYgbW9udGhzKVxyXG4gICAgY29uc3QgdXNhZ2VPdmVyVGltZSA9IFtdO1xyXG4gICAgY29uc3QgbW9udGhOYW1lcyA9IFtcIlRow6FuZyAxXCIsIFwiVGjDoW5nIDJcIiwgXCJUaMOhbmcgM1wiLCBcIlRow6FuZyA0XCIsIFwiVGjDoW5nIDVcIiwgXCJUaMOhbmcgNlwiLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgIFwiVGjDoW5nIDdcIiwgXCJUaMOhbmcgOFwiLCBcIlRow6FuZyA5XCIsIFwiVGjDoW5nIDEwXCIsIFwiVGjDoW5nIDExXCIsIFwiVGjDoW5nIDEyXCJdO1xyXG4gICAgXHJcbiAgICBjb25zdCBjdXJyZW50TW9udGggPSBuZXcgRGF0ZSgpLmdldE1vbnRoKCk7XHJcbiAgICBmb3IgKGxldCBpID0gNTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgY29uc3QgbW9udGhJbmRleCA9IChjdXJyZW50TW9udGggLSBpICsgMTIpICUgMTI7XHJcbiAgICAgIHVzYWdlT3ZlclRpbWUucHVzaCh7XHJcbiAgICAgICAgbW9udGg6IG1vbnRoTmFtZXNbbW9udGhJbmRleF0sXHJcbiAgICAgICAgJ1Bo4bqnbiB0csSDbSc6IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDMwKSArIDEwLFxyXG4gICAgICAgICdD4buRIMSR4buLbmgnOiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyMCkgKyA1LFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gUmV2ZW51ZSBjb21wYXJpc29uOiBFc3RpbWF0ZWQgcmV2ZW51ZSB3aXRoIGNvdXBvbnMgdnMgd2l0aG91dCBjb3Vwb25zIChtb2NrIGRhdGEpXHJcbiAgICBjb25zdCByZXZlbnVlQ29tcGFyaXNvbiA9IFtdO1xyXG4gICAgZm9yIChsZXQgaSA9IDU7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgIGNvbnN0IG1vbnRoSW5kZXggPSAoY3VycmVudE1vbnRoIC0gaSArIDEyKSAlIDEyO1xyXG4gICAgICBjb25zdCBiYXNlUmV2ZW51ZSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDUwMDAwMDAwKSArIDIwMDAwMDAwO1xyXG4gICAgICBjb25zdCBkaXNjb3VudFZhbHVlID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogODAwMDAwMCkgKyAyMDAwMDAwO1xyXG4gICAgICBcclxuICAgICAgcmV2ZW51ZUNvbXBhcmlzb24ucHVzaCh7XHJcbiAgICAgICAgbW9udGg6IG1vbnRoTmFtZXNbbW9udGhJbmRleF0sXHJcbiAgICAgICAgJ0RvYW5oIHRodSB0aOG7sWMgdOG6vyc6IGJhc2VSZXZlbnVlIC0gZGlzY291bnRWYWx1ZSxcclxuICAgICAgICAnRG9hbmggdGh1IGtow7RuZyBjw7Mga2h1eeG6v24gbcOjaSc6IGJhc2VSZXZlbnVlLFxyXG4gICAgICAgICdU4buVbmcgZ2nhuqNtIGdpw6EnOiBkaXNjb3VudFZhbHVlXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBTYW1wbGUgZGF0YSBmb3IgcHJvbW90aW9uIGVmZmVjdGl2ZW5lc3MgYnkgY2F0ZWdvcnlcclxuICAgIGNvbnN0IHByb21vdGlvbkVmZmVjdGl2ZW5lc3MgPSBhbGxDb3Vwb25zXHJcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBiLnVzZWQgLSBhLnVzZWQpXHJcbiAgICAgIC5zbGljZSgwLCAzKVxyXG4gICAgICAubWFwKGNvdXBvbiA9PiAoe1xyXG4gICAgICAgIG5hbWU6IGNvdXBvbi5jb2RlLFxyXG4gICAgICAgICdSYXUnOiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1MDAwMDApICsgMzAwMDAwLFxyXG4gICAgICAgICdUaOG7i3QgJiBI4bqjaSBz4bqjbic6IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDgwMDAwMCkgKyA2MDAwMDAsIFxyXG4gICAgICAgICdUcuG7qW5nICYgU+G7r2EnOiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA0MDAwMDApICsgMjAwMDAwXHJcbiAgICAgIH0pKTtcclxuICAgIFxyXG4gICAgLy8gU2FtcGxlIGRhdGEgZm9yIGNvbnZlcnNpb24gcmF0ZXMgLSB1c2UgcmVhbCBjb2Rlc1xyXG4gICAgY29uc3QgY29udmVyc2lvblJhdGUgPSBhbGxDb3Vwb25zXHJcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBiLnVzZWQgLSBhLnVzZWQpXHJcbiAgICAgIC5zbGljZSgwLCA1KVxyXG4gICAgICAubWFwKGNvdXBvbiA9PiAoe1xyXG4gICAgICAgIG5hbWU6IGNvdXBvbi5jb2RlLFxyXG4gICAgICAgIHJhdGU6IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDQwKSArIDUwIC8vIFJhbmRvbSByYXRlIGJldHdlZW4gNTAtOTAlXHJcbiAgICAgIH0pKTtcclxuICAgIFxyXG4gICAgLy8gUmV0dXJuIHRoZSBzdGF0aXN0aWNzXHJcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIGRhdGE6IHtcclxuICAgICAgICB0b3RhbENvdXBvbnM6IGFsbENvdXBvbnMubGVuZ3RoLFxyXG4gICAgICAgIGFjdGl2ZUNvdXBvbnMsXHJcbiAgICAgICAgdG90YWxVc2VkQ291bnQsXHJcbiAgICAgICAgdHlwZVN0YXRzLFxyXG4gICAgICAgIHZvdWNoZXJVc2FnZSxcclxuICAgICAgICB1c2FnZU92ZXJUaW1lLFxyXG4gICAgICAgIHJldmVudWVDb21wYXJpc29uLFxyXG4gICAgICAgIHByb21vdGlvbkVmZmVjdGl2ZW5lc3MsXHJcbiAgICAgICAgY29udmVyc2lvblJhdGVcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBnZXR0aW5nIGNvdXBvbiBzdGF0aXN0aWNzOlwiLCBlcnJvcik7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiBcIsSQw6MgeOG6o3kgcmEgbOG7l2kga2hpIGzhuqV5IHRo4buRbmcga8OqIG3DoyBnaeG6o20gZ2nDoVwiLFxyXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxyXG4gICAgfSk7XHJcbiAgfVxyXG59OyAiXSwibWFwcGluZ3MiOiI7QUFDQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxvQkFBQSxHQUFBRCxPQUFBLHVDQUErRSxDQUYvRTs7QUFJQTtBQUNPLE1BQU1FLFlBQVksR0FBRyxNQUFBQSxDQUFPQyxHQUFHLEVBQUVDLEdBQUcsS0FBSztFQUM5QyxJQUFJO0lBQ0YsTUFBTSxFQUFFQyxJQUFJLEVBQUVDLElBQUksRUFBRUMsS0FBSyxFQUFFQyxRQUFRLEVBQUVDLFdBQVcsRUFBRUMsU0FBUyxFQUFFQyxVQUFVLEVBQUVDLFdBQVcsRUFBRUMsUUFBUSxDQUFDLENBQUMsR0FBR1YsR0FBRyxDQUFDVyxJQUFJOztJQUUzRztJQUNBLE1BQU1DLGNBQWMsR0FBRyxNQUFNQyxlQUFNLENBQUNDLE9BQU8sQ0FBQyxFQUFFWixJQUFJLEVBQUVBLElBQUksQ0FBQ2EsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekUsSUFBSUgsY0FBYyxFQUFFO01BQ2xCLE9BQU9YLEdBQUcsQ0FBQ2UsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUM7UUFDMUJDLE9BQU8sRUFBRSxLQUFLO1FBQ2RDLE9BQU8sRUFBRTtNQUNYLENBQUMsQ0FBQztJQUNKOztJQUVBO0lBQ0EsTUFBTUMs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