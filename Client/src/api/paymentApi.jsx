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
      const redirectUrl = `${baseUrl}/payment-result?orderId=${orderId}`;
      
      // Chuẩn bị dữ liệu theo đúng định dạng API server yêu cầu
      const requestData = {
        orderId: orderId.toString(),
        amount: parseInt(amount),
        orderInfo: orderInfo,
        redirectUrl
      };
      
      const response = await axios.post(
        `${API_URLS.PAYMENTS}/sepay/create-payment-url`, 
        requestData, 
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      // Kiểm tra response
      if (response.data && response.data.success) {
        return {
          success: true,
          data: {
            paymentUrl: response.data.paymentUrl,
            qrCode: response.data.qrCode
          }
        };
      } else {
        throw new Error(response.data?.message || "Không nhận được URL thanh toán");
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Không thể tạo URL thanh toán"
      };
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

  // Cập nhật thông tin thanh toán
  updatePayment: async (paymentId, paymentData) => {
    try {
      const response = await axios.patch(
        `${API_URLS.PAYMENTS}/${paymentId}`,
        paymentData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin thanh toán:", error);
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
