import SavedVoucher from "../Model/SavedVoucher.js";
import Coupon from "../Model/Coupon.js";
import mongoose from "mongoose";

// Lấy danh sách voucher đã lưu của người dùng
export const getUserSavedVouchers = async (req, res) => {
  try {
    const userId = req.user.id;

    const savedVouchers = await SavedVoucher.find({ userId }).populate({
      path: 'couponId',
      select: '-__v'
    }).sort({ savedAt: -1 });

    if (!savedVouchers || savedVouchers.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "Người dùng chưa lưu voucher nào"
      });
    }

    // Kiểm tra trạng thái của từng voucher đã lưu
    const vouchers = savedVouchers.map(savedVoucher => {
      const coupon = savedVoucher.couponId;
      const now = new Date();
      const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < now;
      const isActive = coupon.isActive;

      return {
        ...savedVoucher.toObject(),
        couponStatus: {
          isExpired,
          isActive
        }
      };
    });

    return res.status(200).json({
      success: true,
      data: vouchers,
      message: "Lấy danh sách voucher đã lưu thành công"
    });
  } catch (error) {
    console.error("Error getting saved vouchers:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách voucher đã lưu"
    });
  }
};

// Lưu voucher cho người dùng
export const saveVoucher = async (req, res) => {
  try {
    const userId = req.user.id;
    const { couponId } = req.body;

    console.log(`Attempting to save voucher for user ${userId}, coupon: ${couponId}`);

    if (!couponId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin mã giảm giá"
      });
    }

    // Kiểm tra coupon có tồn tại không
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Mã giảm giá không tồn tại"
      });
    }

    console.log("Coupon found:", {
      id: coupon._id,
      code: coupon.code,
      usageLimit: coupon.usageLimit,
      used: coupon.used
    });

    // Kiểm tra coupon còn hiệu lực không
    const now = new Date();
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá đã hết hạn"
      });
    }

    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá không còn hiệu lực"
      });
    }

    // Kiểm tra số lượng voucher còn lại
    const currentUsed = coupon.used || 0;
    const usageLimit = coupon.usageLimit;
    console.log(`Voucher usage: ${currentUsed}/${usageLimit}`);
    
    if (usageLimit && currentUsed >= usageLimit) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá đã hết số lượng"
      });
    }

    try {
      // Kiểm tra xem user đã lưu voucher này chưa - Chỉ kiểm tra theo couponId
      const existingSavedVoucher = await SavedVoucher.findOne({ 
        userId, 
        couponId
      });
      
      console.log("Existing saved voucher check:", existingSavedVoucher ? "Found existing" : "Not found");

      if (existingSavedVoucher) {
        return res.status(400).json({
          success: false,
          message: "Bạn đã lưu mã giảm giá này rồi"
        });
      }
      
      // Tạo bản ghi lưu voucher mới
      const newSavedVoucher = new SavedVoucher({
        userId,
        couponId,
        savedAt: new Date()
      });

      console.log("Saving new voucher:", newSavedVoucher);
      await newSavedVoucher.save();
      console.log("Saved voucher successfully for user:", userId);

      // Sau khi lưu thành công, mới tăng số lượng đã sử dụng
      coupon.used = currentUsed + 1;
      await coupon.save();
      console.log(`Updated voucher usage to: ${coupon.used}/${usageLimit}`);

      return res.status(201).json({
        success: true,
        data: newSavedVoucher,
        message: "Đã lưu mã giảm giá thành công"
      });
    
    } catch (error) {
      // Xử lý lỗi
      if (error.code === 11000) {
        // Nếu là lỗi trùng lặp, kiểm tra trường nào bị trùng
        const keyPattern = error.keyPattern;
        
        // Nếu lỗi chỉ do userId, cho phép lưu
        if (keyPattern && keyPattern.userId && !keyPattern.couponId) {
          // Ignore userId unique constraint
          const savedVoucher = new SavedVoucher({
            _id: new mongoose.Types.ObjectId(), // Tạo ID mới
            userId,
            couponId,
            savedAt: new Date()
          });
          
          await savedVoucher.save({ checkKeys: false });
          
          // Cập nhật số lượng sử dụng
          coupon.used = currentUsed + 1;
          await coupon.save();
          
          return res.status(201).json({
            success: true,
            data: savedVoucher,
            message: "Đã lưu mã giảm giá thành công"
          });
        } else {
          // Nếu lỗi do cả userId và couponId, thì người dùng đã lưu mã này
          return res.status(400).json({
            success: false,
            message: "Bạn đã lưu mã giảm giá này rồi"
          });
        }
      }
      
      // Lỗi khác
      console.error("Error saving voucher:", error);
      return res.status(500).json({
        success: false,
        message: "Đã xảy ra lỗi khi lưu mã giảm giá: " + error.message
      });
    }
  } catch (mainError) {
    console.error("Unexpected error:", mainError);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi không mong muốn: " + mainError.message
    });
  }
};

// Xóa voucher đã lưu
export const deleteSavedVoucher = async (req, res) => {
  try {
    const userId = req.user.id;
    const { couponId } = req.params;

    if (!couponId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin mã giảm giá"
      });
    }

    // Tìm voucher đã lưu
    const savedVoucher = await SavedVoucher.findOne({ userId, couponId });

    if (!savedVoucher) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy voucher đã lưu"
      });
    }

    // Giảm số lượng đã sử dụng của voucher
    const coupon = await Coupon.findById(couponId);
    if (coupon && coupon.used > 0) {
      coupon.used -= 1;
      await coupon.save();
    }

    // Xóa voucher đã lưu
    await SavedVoucher.findOneAndDelete({ userId, couponId });

    return res.status(200).json({
      success: true,
      message: "Đã xóa voucher đã lưu thành công"
    });
  } catch (error) {
    console.error("Error deleting saved voucher:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xóa voucher đã lưu"
    });
  }
}; 