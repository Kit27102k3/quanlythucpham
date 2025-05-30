/* eslint-disable no-unused-vars */
import axios from "axios";
import { API_URLS } from "../config/apiConfig";

export const getPaymentById = async (paymentId) => {
  try {
    const response = await axios.get(`${API_URLS.PAYMENTS}/${paymentId}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin thanh toán:", error);
    throw error;
  }
};

function createDirectBankQRUrl(
  orderId,
  amount,
  bankCode = "MB",
  accountNumber = "0326743391",
  transferContent = ""
) {
  let description = orderId;
  return `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankCode}&amount=${amount}&des=${description}`;
}

// Tạo đối tượng QR kết quả đầy đủ cho chuyển khoản ngân hàng
function createBankTransferQR(orderId, amount, orderInfo) {
  const bankInfo = {
    name: import.meta.env.VITE_BANK_NAME,
    accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME,
    accountNumber: import.meta.env.VITE_BANK_ACCOUNT_NUMBER,
    bankCode: import.meta.env.VITE_BANK_CODE,
  };

  const transferContent = `TT DH ${orderId}`;
  const qrUrl = createDirectBankQRUrl(
    orderId,
    amount,
    bankInfo.bankCode,
    bankInfo.accountNumber,
    transferContent
  );

  // Tạo URL redirect xử lý thủ công
  const baseUrl = window.location.origin;
  const manualRedirectUrl = `${baseUrl}/payment-result?orderId=${orderId}&status=manual&amount=${amount}`;

  return {
    success: false,
    method: "bank_transfer",
    data: manualRedirectUrl,
    qrCode: qrUrl,
    bankInfo: bankInfo,
    message: "Vui lòng quét mã QR để thanh toán qua ngân hàng",
    isManualVerification: true,
  };
}

const paymentApi = {
  getAllPayments: async (userId) => {
    try {
      const response = await axios.get(`${API_URLS.PAYMENTS}/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thanh toán:", error);
      throw error;
    }
  },

  createPayment: async (data) => {
    try {
      const response = await axios.post(`${API_URLS.PAYMENTS}`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tạo thanh toán:", error);
      throw error;
    }
  },

  createSepayPaymentUrl: async (orderId, amount, orderInfo) => {
    try {
      const baseUrl = window.location.origin;
      const redirectUrl = `${baseUrl}/payment-result?orderId=${orderId}`;
      const requestData = {
        orderId: orderId.toString(),
        amount: parseInt(amount),
        orderInfo: orderInfo,
        redirectUrl,
      };

      try {
        const response = await axios.post(
          `${API_URLS.PAYMENTS}/sepay/create-payment-url`,
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 15000, 
          }
        );

        if (response.data && response.data.qrCode) {
          return {
            success: false,
            method: "bank_transfer",
            qrCode: response.data.qrCode,
            bankInfo: {
              name: import.meta.env.VITE_BANK_NAME,
              accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME,
              accountNumber: import.meta.env.VITE_BANK_ACCOUNT_NUMBER,
              bankCode: import.meta.env.VITE_BANK_CODE,
            },
          };
        } else if (response.data && response.data.paymentUrl) {
          return {
            success: false,
            data: response.data.paymentUrl,
            qrCode: response.data.qrCode,
            method: "sepay",
          };
        } else if (response.data && response.data.success) {
          return createBankTransferQR(orderId, amount, orderInfo);
        } else {
          // Nếu phản hồi không chứa URL thanh toán, chuyển sang phương án dự phòng
          throw new Error(
            response.data?.message || "Không nhận được URL thanh toán"
          );
        }
      } catch (sepayError) {
        console.log(
          "Lỗi khi gọi API SePay, chuyển sang QR chuyển khoản:",
          sepayError.message
        );
        return createBankTransferQR(orderId, amount, orderInfo);
      }
    } catch (error) {
      console.error("Lỗi toàn bộ quá trình thanh toán:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Không thể tạo URL thanh toán",
        fallbackQR: createDirectBankQRUrl(orderId, amount),
        method: "bank_transfer",
        bankInfo: {
          name: import.meta.env.VITE_BANK_NAME,
          accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME,
          accountNumber: import.meta.env.VITE_BANK_ACCOUNT_NUMBER,
          bankCode: import.meta.env.VITE_BANK_CODE,
        },
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

  deletePayment: async (paymentId) => {
    try {
      const response = await axios.delete(`${API_URLS.PAYMENTS}/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi xóa thanh toán:", error);
      throw error;
    }
  },
  getPaymentById,
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

  checkPaymentStatus: async (orderId) => {
    if (!orderId) {
      console.error("OrderId is required for checking payment status");
      return {
        success: false,
        status: "unknown",
        message: "Thiếu mã đơn hàng",
      };
    }

    try {
      // Thêm timestamp và random để tránh cache hoàn toàn
      const timestamp = new Date().getTime();
      const randomParam = Math.floor(Math.random() * 1000000);
      const response = await axios.get(
        `${API_URLS.PAYMENTS}/status/${orderId}?_=${timestamp}&random=${randomParam}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
            "X-Requested-With": "XMLHttpRequest",
          },
          params: {
            _: timestamp,
            random: randomParam,
          },
          timeout: 5000,
        }
      );
      if (isSuccessful(response.data)) {
        console.log(`Payment SUCCESSFUL for order ${orderId}`);
        return {
          success: true,
          status: "completed",
          message: response.data.message || "Thanh toán thành công",
          data: response.data.data,
          timestamp,
        };
      }
      return {
        success: false,
        status: response.data.status || "pending",
        message: response.data.message || "Đang chờ thanh toán",
        data: response.data.data,
        timestamp,
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return {
          success: false,
          status: "pending",
          message: "Đang chờ thanh toán",
        };
      }
      console.error("Error checking payment status:", error);
      return {
        success: false,
        status: "error",
        message: "Lỗi kiểm tra thanh toán",
      };
    }
  },
};
function isSuccessful(response) {
  if (!response) return false;
  const successIndicators = [
    response.success === true,
    response.status === "completed",
    response.data?.status === "completed",
    response.order?.paymentStatus === "completed",
    response.message?.includes("thành công"),
    response.data?.success === true,
    response.data?.paymentStatus === "completed",
  ];
  return successIndicators.some((indicator) => indicator === true);
}

export default paymentApi;
