import axios from "axios";
import { API_URLS } from "../config/apiConfig";

export const getPaymentById = async (paymentId) => {
  try {
    const response = await axios.get(`${API_URLS.PAYMENTS}/${paymentId}`);
    // Kiểm tra và đảm bảo trả về cấu trúc dữ liệu mong đợi
    return response.data.data || response.data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin thanh toán:", error);
    throw error;
  }
};

// Tạo link QR chuyển khoản ngân hàng trực tiếp
function createDirectBankQRUrl(orderId, amount, bankCode = "MB", accountNumber = "0326743391") {
  // Chuẩn bị nội dung chuyển khoản
  const description = encodeURIComponent(`Thanh toan don hang #${orderId}`);
  
  // Tạo URL QR theo cấu trúc của SePay - sử dụng thông tin Napas 247 đúng định dạng
  return `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankCode}&amount=${amount}&des=${description}`;
}

// Tạo đối tượng QR kết quả đầy đủ cho chuyển khoản ngân hàng
function createBankTransferQR(orderId, amount, orderInfo) {
  // Thông tin tài khoản ngân hàng - đảm bảo chính xác theo Napas 247
  const bankInfo = {
    name: "MBBank - Ngân hàng Thương mại Cổ phần Quân đội",
    accountName: "NGUYEN TRONG KHIEM",
    accountNumber: "0326743391",
    bankCode: "MB"  // Mã ngân hàng phải đúng định dạng Napas (MB thay vì MBBank)
  };
  
  // Tạo QR URL
  const qrUrl = createDirectBankQRUrl(orderId, amount, bankInfo.bankCode, bankInfo.accountNumber);
  
  // Tạo URL redirect xử lý thủ công
  const baseUrl = window.location.origin;
  const manualRedirectUrl = `${baseUrl}/payment-result?orderId=${orderId}&status=manual&amount=${amount}`;
  
  return {
    success: false, // Chuyển thành false ban đầu, chỉ true khi webhook xác nhận đã thanh toán
    method: "bank_transfer",
    data: manualRedirectUrl,
    qrCode: qrUrl,
    bankInfo: bankInfo,
    message: "Vui lòng quét mã QR để thanh toán qua ngân hàng",
    isManualVerification: true
  };
}

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
      
      console.log("Sending payment request with data:", JSON.stringify(requestData));
      
      try {
        // Thử gọi API SePay với timeout ngắn hơn để không đợi quá lâu
        const response = await axios.post(
          `${API_URLS.PAYMENTS}/sepay/create-payment-url`, 
          requestData, 
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 15000 // Tăng timeout lên 15 giây để đảm bảo đủ thời gian xử lý
          }
        );
        
        console.log("SePay API response:", response.data);
        
        // Kiểm tra response
        if (response.data && response.data.success) {
          return {
            success: false, // Chuyển thành false ban đầu, chỉ true khi webhook xác nhận đã thanh toán
            data: response.data.paymentUrl,
            qrCode: response.data.qrCode,
            method: "sepay"
          };
        }
        
        console.log("SePay API returned success=false, falling back to bank transfer");
        // Nếu SePay trả về lỗi, chuyển sang phương án dự phòng
        return createBankTransferQR(orderId, amount, orderInfo);
      } catch (sepayError) {
        console.log("Lỗi SePay, chuyển sang QR chuyển khoản:", sepayError.message);
        // Phương án dự phòng: Tạo QR chuyển khoản ngân hàng
        return createBankTransferQR(orderId, amount, orderInfo);
      }
    } catch (error) {
      console.error("Lỗi toàn bộ quá trình thanh toán:", error);
      // Đảm bảo luôn trả về QR code ngân hàng thay vì throw error
      const bankQR = createBankTransferQR(orderId, amount, orderInfo);
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Không thể tạo URL thanh toán",
        fallbackQR: createDirectBankQRUrl(orderId, amount),
        // Thêm toàn bộ thông tin từ bankQR để client có thể hiển thị
        qrCode: bankQR.qrCode,
        bankInfo: bankQR.bankInfo,
        message: "Vui lòng quét mã QR để thanh toán qua ngân hàng",
        method: "bank_transfer",
        isManualVerification: true
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

  // Check payment status
  checkPaymentStatus: async (orderId) => {
    if (!orderId) {
      console.error("OrderId is required for checking payment status");
      return { success: false, status: "unknown", message: "Thiếu mã đơn hàng" };
    }
    
    try {
      const response = await axios.get(
        `${API_URLS.PAYMENTS}/status/${orderId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          // Giảm timeout để không chờ quá lâu nếu server không phản hồi
          timeout: 5000
        }
      );
      return response.data;
    } catch (error) {
      // Xử lý lỗi 404 (API endpoint không tồn tại hoặc chưa khởi động)
      if (error.response && error.response.status === 404) {
        // Trả về trạng thái mặc định thay vì ném lỗi
        return { success: false, status: "pending", message: "Đang chờ thanh toán" };
      }
      
      // Log các lỗi khác
      console.error("Error checking payment status:", error);
      throw error;
    }
  }
};

export default paymentApi; 