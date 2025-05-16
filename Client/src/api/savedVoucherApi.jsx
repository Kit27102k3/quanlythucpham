import axios from "axios";
import { API_URLS } from "../config/apiConfig";

const savedVoucherApi = {
  // Lấy danh sách voucher đã lưu của người dùng
  getUserSavedVouchers: async (accessToken) => {
    try {
      const response = await axios.get(
        `${API_URLS.SAVED_VOUCHERS}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      // Nếu lỗi 401, trả về mảng rỗng thay vì lỗi
      if (error.response?.status === 401) {
        return {
          success: true,
          data: [],
          message: "Bạn cần đăng nhập để xem voucher đã lưu"
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || "Không thể lấy danh sách voucher đã lưu"
      };
    }
  },

  // Lưu voucher mới cho người dùng
  saveVoucher: async (couponId, accessToken) => {
    try {
      const response = await axios.post(
        `${API_URLS.SAVED_VOUCHERS}`,
        { couponId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error("API error details:", error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || "Không thể lưu voucher",
        error: error.response?.data
      };
    }
  },

  // Xóa voucher đã lưu
  deleteSavedVoucher: async (couponId, accessToken) => {
    try {
      const response = await axios.delete(
        `${API_URLS.SAVED_VOUCHERS}/${couponId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error("Error deleting saved voucher:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Không thể xóa voucher đã lưu"
      };
    }
  },
  
  // Cập nhật trạng thái isPaid của voucher đã lưu
  updateSavedVoucherStatus: async (savedVoucherId, isPaid, accessToken) => {
    try {
      const response = await axios.patch(
        `${API_URLS.SAVED_VOUCHERS}/status/${savedVoucherId}`,
        { isPaid },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error("Error updating saved voucher status:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Không thể cập nhật trạng thái voucher đã lưu"
      };
    }
  }
};

export default savedVoucherApi; 