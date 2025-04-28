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
function createDirectBankQRUrl(orderId, amount, bankCode = "MB", accountNumber = "0326743391", transferContent = "") {
  // Chuẩn bị nội dung chuyển khoản - chỉ dùng đúng OrderID, không thêm tiền tố
  // Lấy 24 ký tự hex nếu có thể (MongoDB ID)
  let description = orderId;
  
  // Tạo URL QR theo cấu trúc của SePay - KHÔNG thêm tiền tố vào nội dung
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
  
  // Tạo nội dung chuyển khoản chuẩn hóa
  const transferContent = `TT DH ${orderId}`;
  
  // Tạo QR URL
  const qrUrl = createDirectBankQRUrl(orderId, amount, bankInfo.bankCode, bankInfo.accountNumber, transferContent);
  
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
      
      try {
        // Gọi API thanh toán với timeout cao hơn để đảm bảo xử lý
        console.log("Gọi API tạo URL thanh toán với dữ liệu:", requestData);
        
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
        
        // Ghi log phản hồi để kiểm tra
        console.log("Phản hồi từ API tạo URL thanh toán:", response.data);
        
        // Kiểm tra response
        if (response.data && response.data.paymentUrl) {
          return {
            success: false, // Chuyển thành false ban đầu, chỉ true khi webhook xác nhận đã thanh toán
            data: response.data.paymentUrl,
            qrCode: response.data.qrCode,
            method: "sepay"
          };
        } else if (response.data && response.data.success) {
          // Xử lý khi API trả về success nhưng không có paymentUrl
          console.log("API trả về thành công nhưng không có URL thanh toán, chuyển sang QR chuyển khoản");
          return createBankTransferQR(orderId, amount, orderInfo);
        } else {
          // Nếu phản hồi không chứa URL thanh toán, chuyển sang phương án dự phòng
          throw new Error(response.data?.message || "Không nhận được URL thanh toán");
        }
      } catch (sepayError) {
        console.log("Lỗi khi gọi API SePay, chuyển sang QR chuyển khoản:", sepayError.message);
        // Phương án dự phòng: Tạo QR chuyển khoản ngân hàng
        return createBankTransferQR(orderId, amount, orderInfo);
      }
    } catch (error) {
      console.error("Lỗi toàn bộ quá trình thanh toán:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Không thể tạo URL thanh toán",
        fallbackQR: createDirectBankQRUrl(orderId, amount)
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
      // Thêm timestamp và random để tránh cache hoàn toàn
      const timestamp = new Date().getTime();
      const randomParam = Math.floor(Math.random() * 1000000);
      
      // Force reload dữ liệu API không lấy từ cache
      const response = await axios.get(
        `${API_URLS.PAYMENTS}/status/${orderId}?_=${timestamp}&random=${randomParam}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "X-Requested-With": "XMLHttpRequest"
          },
          // Thêm fetchPolicy: 'network-only' để đảm bảo không dùng cache
          // Đây là trick để axios luôn gọi mới
          params: {
            _: timestamp,
            random: randomParam
          },
          timeout: 5000
        }
      );
      
      // Log kết quả
      console.log(`Payment status check [${timestamp}]:`, JSON.stringify(response.data));
      
      // Kiểm tra thành công
      if (isSuccessful(response.data)) {
        console.log(`Payment SUCCESSFUL for order ${orderId}`);
        return {
          success: true,
          status: "completed",
          message: response.data.message || "Thanh toán thành công",
          data: response.data.data,
          timestamp
        };
      }
      
      // Trường hợp không thành công
      console.log(`Payment PENDING for order ${orderId}`);
      return {
        success: false,
        status: response.data.status || "pending",
        message: response.data.message || "Đang chờ thanh toán",
        data: response.data.data,
        timestamp
      };
    } catch (error) {
      // Xử lý lỗi 404
      if (error.response && error.response.status === 404) {
        return { success: false, status: "pending", message: "Đang chờ thanh toán" };
      }
      
      // Log các lỗi
      console.error("Error checking payment status:", error);
      return { success: false, status: "error", message: "Lỗi kiểm tra thanh toán" };
    }
  }
};

// Helper function to check if payment is successful
function isSuccessful(response) {
  if (!response) return false;
  
  // Kiểm tra tất cả các dấu hiệu thành công có thể có
  const successIndicators = [
    response.success === true,
    response.status === "completed",
    response.data?.status === "completed",
    response.order?.paymentStatus === "completed",
    response.message?.includes("thành công"),
    response.data?.success === true,
    response.data?.paymentStatus === "completed"
  ];
  
  // Nếu bất kỳ điều kiện nào true, trả về true
  return successIndicators.some(indicator => indicator === true);
}

export default paymentApi; 