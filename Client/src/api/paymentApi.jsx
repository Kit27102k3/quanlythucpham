import axios from "axios";
import { API_URLS } from "../config/apiConfig";

export const getPaymentById = async (paymentId) => {
  try {
    const response = await axios.get(`${API_URLS.PAYMENTS}/${paymentId}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin thanh toán:", error);
    throw error;
  }
};

const paymentApi = {
  // Lấy tất cả thanh toán của người dùng
  getAllPayments: async (userId) => {
    try {
      const response = await axios.get(`${API_URLS.PAYMENTS}/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thanh toán:", error);
      throw error;
    }
  },

  // Tạo thanh toán mới
  createPayment: async (data) => {
    try {
      const response = await axios.post(`${API_URLS.PAYMENTS}`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Thanh toán thành công:", response.data);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tạo thanh toán:", error);
      throw error;
    }
  },

  // Tạo URL thanh toán SePay
  createSepayPaymentUrl: async (orderId, amount, orderInfo) => {
    try {
      // Lấy URL hiện tại để tạo URL callback
      const baseUrl = window.location.origin;
      const redirectUrl = `${baseUrl}/payment-result?orderId=${orderId}&status=success&amount=${amount}`;
      
      const response = await axios.post(
        `${API_URLS.PAYMENTS}/sepay/create-payment-url`, 
        { 
          orderId, 
          amount, 
          orderInfo,
          redirectUrl 
        }, 
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      // Check if we got a valid payment URL
      if (response.data && response.data.data) {
        // If it's a fallback URL (code 01), log a message
        if (response.data.code === "01") {
          console.log("Đang sử dụng cổng thanh toán mẫu để kiểm tra");
        }
        return response.data;
      } else {
        throw new Error("Không nhận được URL thanh toán");
      }
    } catch (error) {
      console.error("Lỗi khi tạo URL thanh toán SePay:", error);
      throw error;
    }
  },

  // Cập nhật trạng thái thanh toán
  updatePaymentStatus: async (paymentId, status) => {
    try {
      const response = await axios.patch(
        `${API_URLS.PAYMENTS}/${paymentId}/status`,
        { status },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái thanh toán:", error);
      throw error;
    }
  },

  // Xóa thanh toán
  deletePayment: async (paymentId) => {
    try {
      const response = await axios.delete(`${API_URLS.PAYMENTS}/${paymentId}`);
      console.log("Xóa thanh toán thành công:", response.data);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi xóa thanh toán:", error);
      throw error;
    }
  },

  // Lấy thông tin chi tiết thanh toán theo ID
  getPaymentById,

  // Tìm kiếm thanh toán theo trạng thái hoặc ngày thanh toán
  searchPayments: async (query) => {
    try {
      const response = await axios.get(
        `${API_URLS.PAYMENTS}/search?query=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tìm kiếm thanh toán:", error);
      throw error;
    }
  },

  // Lấy thông tin thanh toán cho chatbot
  getPaymentInfoForChatbot: async (paymentId) => {
    try {
      const response = await axios.post(`${API_URLS.PAYMENTS}/chatbot/payment-info`, {
        paymentId,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin thanh toán cho chatbot:", error);
      throw error;
    }
  },
};

export default paymentApi;
