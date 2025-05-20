/* eslint-disable no-dupe-keys */
import Coupon from "../Model/Coupon.js";
import { sendNewCouponNotification } from "../Services/notificationService.js";

// Tạo mã giảm giá mới
export const createCoupon = async (req, res) => {
  try {
    const { code, type, value, minOrder, maxDiscount, expiresAt, usageLimit, description, isActive } = req.body;

    // Kiểm tra xem mã giảm giá đã tồn tại chưa
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá này đã tồn tại"
      });
    }

    // Tạo mới coupon với used = 0 rõ ràng
    const newCoupon = new Coupon({
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
    sendNewCouponNotification(newCoupon).catch(error => 
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
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
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
export const getCouponByCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
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
export const getActiveCoupons = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const now = new Date();
    
    // Find active coupons that haven't expired and haven't reached usage limit
    const coupons = await Coupon.find({
      isActive: true,
      $or: [
        { expiresAt: { $gt: now } },
        { expiresAt: null }
      ],
      $or: [
        { $expr: { $lt: ["$used", "$usageLimit"] } },
        { usageLimit: null }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(limit);
    
    return res.status(200).json(coupons);
  } catch (error) {
    console.error("Error getting active coupons:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Validate a coupon code
export const validateCoupon = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }
    
    const now = new Date();
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      $or: [
        { expiresAt: { $gt: now } },
        { expiresAt: null }
      ],
      $or: [
        { $expr: { $lt: ["$used", "$usageLimit"] } },
        { usageLimit: null }
      ]
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
      discountAmount = (orderTotal * coupon.value) / 100;
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
export const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
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
export const updateCouponUsage = async (req, res) => {
  try {
    const { code } = req.params;
    
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
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
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Kiểm tra xem mã giảm giá có tồn tại không
    const existingCoupon = await Coupon.findById(id);
    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mã giảm giá"
      });
    }
    
    // Nếu đang thay đổi code, kiểm tra xem code mới đã tồn tại chưa
    if (updateData.code && updateData.code !== existingCoupon.code) {
      const duplicateCoupon = await Coupon.findOne({ 
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
    const updatedCoupon = await Coupon.findByIdAndUpdate(
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
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra xem mã giảm giá có tồn tại không
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mã giảm giá"
      });
    }
    
    // Xóa mã giảm giá
    await Coupon.findByIdAndDelete(id);
    
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
export const resetCouponUsage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const coupon = await Coupon.findById(id);
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
export const getCouponStats = async (req, res) => {
  try {
    const now = new Date();
    
    // Get all coupons
    const allCoupons = await Coupon.find();
    
    // Count active coupons
    const activeCoupons = await Coupon.countDocuments({
      isActive: true,
      $or: [
        { expiresAt: { $gt: now } },
        { expiresAt: null }
      ]
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
    
    allCoupons.forEach(coupon => {
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
    const voucherUsage = allCoupons
      .sort((a, b) => b.used - a.used) // Sort by most used
      .map(coupon => ({
        code: coupon.code,
        discount: coupon.type === 'percentage' ? `${coupon.value}%` : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.value),
        used: coupon.used,
        limit: coupon.usageLimit || '∞',
        revenue: coupon.type === 'percentage' ? 
          (coupon.value * coupon.used * coupon.minOrder / 100) : // Estimate for percentage type
          (coupon.used * coupon.minOrder), // Estimate for fixed type
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
        'Cố định': Math.floor(Math.random() * 20) + 5,
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
    const promotionEffectiveness = allCoupons
      .sort((a, b) => b.used - a.used)
      .slice(0, 3)
      .map(coupon => ({
        name: coupon.code,
        'Rau': Math.floor(Math.random() * 500000) + 300000,
        'Thịt & Hải sản': Math.floor(Math.random() * 800000) + 600000, 
        'Trứng & Sữa': Math.floor(Math.random() * 400000) + 200000
      }));
    
    // Sample data for conversion rates - use real codes
    const conversionRate = allCoupons
      .sort((a, b) => b.used - a.used)
      .slice(0, 5)
      .map(coupon => ({
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
}; 