import axios from "axios";
import { API_URLS } from "../config/apiConfig";

const couponApi = {
  // Xác thực và áp dụng mã giảm giá
  validateCoupon: async (code, orderTotal) => {
    try {
      const response = await axios.post(
        `${API_URLS.COUPONS}/validate`,
        {
          code,
          orderTotal
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Không thể xác thực mã giảm giá"
      };
    }
  },

  // Lấy thông tin mã giảm giá theo code
  getCouponByCode: async (code) => {
    try {
      const response = await axios.get(`${API_URLS.COUPONS}/code/${code}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Không thể lấy thông tin mã giảm giá"
      };
    }
  },

  // Cập nhật số lần sử dụng mã giảm giá
  updateCouponUsage: async (code) => {
    try {
      const response = await axios.post(`${API_URLS.COUPONS}/use/${code}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Không thể cập nhật số lần sử dụng mã giảm giá"
      };
    }
  },

  // Tạo mã giảm giá mới (chỉ dành cho admin)
  createCoupon: async (couponData, accessToken) => {
    try {
      const response = await axios.post(
        `${API_URLS.COUPONS}`,
        couponData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Không thể tạo mã giảm giá"
      };
    }
  },

  // Cập nhật mã giảm giá (chỉ dành cho admin)
  updateCoupon: async (id, couponData, accessToken) => {
    try {
      const response = await axios.put(
        `${API_URLS.COUPONS}/${id}`,
        couponData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Không thể cập nhật mã giảm giá"
      };
    }
  },

  // Xóa mã giảm giá (chỉ dành cho admin)
  deleteCoupon: async (id, accessToken) => {
    try {
      const response = await axios.delete(
        `${API_URLS.COUPONS}/${id}`,
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
      return {
        success: false,
        message: error.response?.data?.message || "Không thể xóa mã giảm giá"
      };
    }
  },

  // Lấy tất cả mã giảm giá công khai (cho trang Voucher)
  getPublicCoupons: async () => {
    try {
      const response = await axios.get(`${API_URLS.COUPONS}/active`);
      console.log('Fetched coupons:', response.data);
      
      // Handle different response formats
      if (response.data && response.data.success === true && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object') {
        console.log('Unexpected response format:', response.data);
        return [];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching public coupons:', error);
      
      // Try fallback endpoint if primary fails
      try {
        console.log('Trying fallback endpoint /all-for-debug');
        const fallbackResponse = await axios.get(`${API_URLS.COUPONS}/all-for-debug`);
        
        if (Array.isArray(fallbackResponse.data)) {
          return fallbackResponse.data;
        } else if (fallbackResponse.data && fallbackResponse.data.success && Array.isArray(fallbackResponse.data.data)) {
          return fallbackResponse.data.data;
        }
        
        return [];
      } catch (fallbackError) {
        console.error('Fallback endpoint also failed:', fallbackError);
        return [];
      }
    }
  },

  // Lấy tất cả mã giảm giá (chỉ dành cho admin)
  getAllCoupons: async (accessToken) => {
    try {
      const response = await axios.get(
        `${API_URLS.COUPONS}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Không thể lấy danh sách mã giảm giá"
      };
    }
  },

  // [Admin] Reset số lượng sử dụng của voucher
  resetCouponUsage: async (couponId, value, accessToken) => {
    try {
      const response = await axios.patch(
        `${API_URLS.COUPONS}/reset-usage/${couponId}`,
        { value },
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
      console.error("Error resetting coupon usage:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Không thể đặt lại số lượng sử dụng voucher",
        error: error.response?.data
      };
    }
  }
};

export default couponApi; 