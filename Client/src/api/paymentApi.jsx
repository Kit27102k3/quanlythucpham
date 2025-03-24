import axios from "axios";

const API_URL = "http://localhost:8080/api/payments";

const paymentApi = {
  // Lấy tất cả thanh toán của người dùng
  getAllPayments: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thanh toán:", error);
      throw error;
    }
  },

  // Tạo thanh toán mới
  createPayment: async (data) => {
    try {
      const response = await axios.post(`${API_URL}/create`, data, {
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

  // Cập nhật trạng thái thanh toán
  updatePaymentStatus: async (paymentId, status) => {
    try {
      const response = await axios.put(`${API_URL}/${paymentId}`, { status });
      console.log("Cập nhật trạng thái thành công:", response.data);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái thanh toán:", error);
      throw error;
    }
  },

  // Xóa thanh toán
  deletePayment: async (paymentId) => {
    try {
      const response = await axios.delete(`${API_URL}/${paymentId}`);
      console.log("Xóa thanh toán thành công:", response.data);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi xóa thanh toán:", error);
      throw error;
    }
  },

  // Lấy thông tin chi tiết thanh toán theo ID
  getPaymentById: async (paymentId) => {
    try {
      const response = await axios.get(`${API_URL}/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin thanh toán:", error);
      throw error;
    }
  },

  // Tìm kiếm thanh toán theo trạng thái hoặc ngày thanh toán
  searchPayments: async (query) => {
    try {
      const response = await axios.get(
        `${API_URL}/search?query=${encodeURIComponent(query)}`
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
      const response = await axios.post(`${API_URL}/chatbot/payment-info`, {
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
