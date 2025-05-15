import Coupon from "../Model/Coupon.js";

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
        message: `Order total must be at least ${coupon.minOrder} to use this coupon` 
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