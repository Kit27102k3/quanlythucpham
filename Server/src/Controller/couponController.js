import Coupon from "../Model/Coupon.js";

// Tạo mã giảm giá mới
export const createCoupon = async (req, res) => {
  try {
    const { code, type, value, minOrder, maxDiscount, expiresAt, usageLimit, isActive } = req.body;

    // Kiểm tra xem mã giảm giá đã tồn tại chưa
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá này đã tồn tại"
      });
    }

    // Tạo mã giảm giá mới
    const coupon = new Coupon({
      code: code.toUpperCase(),
      type,
      value,
      minOrder,
      maxDiscount,
      expiresAt,
      usageLimit,
      isActive: isActive !== undefined ? isActive : true
    });

    await coupon.save();

    res.status(201).json({
      success: true,
      message: "Tạo mã giảm giá thành công",
      data: coupon
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi tạo mã giảm giá",
      error: error.message
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

// Kiểm tra và áp dụng mã giảm giá
export const validateCoupon = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập mã giảm giá"
      });
    }
    
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    // Kiểm tra mã giảm giá có tồn tại không
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Mã giảm giá không hợp lệ"
      });
    }
    
    // Kiểm tra mã giảm giá có còn hoạt động không
    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá này đã bị vô hiệu hóa"
      });
    }
    
    // Kiểm tra thời hạn
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá đã hết hạn"
      });
    }
    
    // Kiểm tra giới hạn sử dụng
    if (coupon.usageLimit !== null && coupon.used >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá đã đạt giới hạn sử dụng"
      });
    }
    
    // Kiểm tra đơn hàng tối thiểu
    if (coupon.minOrder && orderTotal < coupon.minOrder) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng tối thiểu ${coupon.minOrder.toLocaleString('vi-VN')}đ để sử dụng mã này`
      });
    }
    
    // Tính toán số tiền giảm giá
    let discountAmount = 0;
    
    if (coupon.type === 'percentage') {
      // Giảm theo phần trăm
      discountAmount = (orderTotal * coupon.value) / 100;
      
      // Áp dụng giới hạn giảm giá tối đa (nếu có)
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      // Giảm theo số tiền cố định
      discountAmount = coupon.value;
      
      // Không giảm nhiều hơn giá trị đơn hàng
      if (discountAmount > orderTotal) {
        discountAmount = orderTotal;
      }
    }
    
    // Làm tròn số tiền giảm giá
    discountAmount = Math.round(discountAmount);
    
    const finalAmount = orderTotal - discountAmount;
    
    res.status(200).json({
      success: true,
      data: {
        coupon,
        discountAmount,
        finalAmount,
        message: coupon.type === 'percentage' 
          ? `Áp dụng giảm ${coupon.value}%, số tiền giảm: ${discountAmount.toLocaleString('vi-VN')}đ`
          : `Áp dụng giảm ${discountAmount.toLocaleString('vi-VN')}đ`
      }
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi kiểm tra mã giảm giá",
      error: error.message
    });
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