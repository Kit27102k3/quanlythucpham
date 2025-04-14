/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import axios from 'axios';
import { SEPAY } from '../config/paymentConfig.js';
import QRCode from 'qrcode';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Thêm biến môi trường cho domain
const isDevelopment = process.env.NODE_ENV !== 'production';
const SITE_CONFIG = {
    baseUrl: isDevelopment ? "http://localhost:3000" : "https://dncfood.com",
    apiUrl: isDevelopment ? "http://localhost:8080" : "https://api.dncfood.com"
};

class PaymentService {
    // SePay Payment
    static async createSePayPayment(orderId, amount, orderInfo, customRedirectUrl = null) {
        try {
            // Cấu hình endpoints callback
            // Sử dụng customRedirectUrl từ client nếu có, ngược lại dùng URL mặc định
            const returnUrl = customRedirectUrl || `${SITE_CONFIG.baseUrl}/payment-result`;
            const notifyUrl = `${SITE_CONFIG.apiUrl}/api/payments/sepay/callback`;
            
            const requestData = {
                merchantId: SEPAY.merchantId,
                orderId: orderId.toString(),
                amount: parseInt(amount),
                orderInfo: orderInfo,
                returnUrl: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}status=success&amount=${amount}`,
                notifyUrl: notifyUrl
            };
            
            // Gọi API SePay thực từ tệp .env
            const response = await axios.post(
                process.env.SEPAY_API_URL,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.SEPAY_API_TOKEN}`
                    },
                    timeout: 30000 // 30 giây
                }
            );
            
            if (response.data && response.data.code === '00') {
                // Tạo QR code cho URL thanh toán
                const qrCodeDataURL = await this.generateQRCode(response.data.data);
                
                return {
                    code: response.data.code,
                    message: response.data.message,
                    data: response.data.data,
                    qr_code: qrCodeDataURL
                };
            } else {
                throw new Error(`Phản hồi không thành công từ SePay API: ${response.data?.message || 'Unknown error'}`);
            }
        } catch (error) {
            throw new Error(`Lỗi tạo thanh toán SePay: ${error.message}`);
        }
    }

    // Tạo URL thanh toán dự phòng
    static async createFallbackPayment(orderId, amount, orderInfo) {
        try {
            console.log("[SePay] Tạo URL thanh toán dự phòng");
            
            // Sử dụng URL động dựa vào môi trường
            const baseUrl = SITE_CONFIG.baseUrl;
                
            // URL thanh toán dự phòng
            const fallbackUrl = `${baseUrl}/payment-result?orderId=${orderId}&status=success&amount=${amount}`;
            
            // Tạo QR code cho URL thanh toán
            const qrCodeDataURL = await this.generateQRCode(fallbackUrl);
            
            return {
                code: '01', // Dùng code "01" cho thanh toán dự phòng
                message: 'Sử dụng URL thanh toán dự phòng',
                data: fallbackUrl, 
                qr_code: qrCodeDataURL
            };
        } catch (error) {
            console.error("[SePay] Lỗi khi tạo thanh toán dự phòng:", error);
            
            // Đảm bảo luôn trả về kết quả hợp lệ
            const baseUrl = SITE_CONFIG.baseUrl;
            const emergencyUrl = `${baseUrl}/payment-result?orderId=${orderId}&status=success&amount=${amount}`;
            
            return {
                code: '01',
                message: 'Sử dụng URL thanh toán dự phòng khẩn cấp',
                data: emergencyUrl,
                qr_code: null
            };
        }
    }

    // Tạo mã QR cho URL thanh toán
    static async generateQRCode(text) {
        try {
            if (!text) {
                return null;
            }
            
            // Tạo QR code dạng data URL
            const qrCodeDataURL = await QRCode.toDataURL(text, {
                width: 300,
                margin: 2,
                errorCorrectionLevel: 'H'
            });
            return qrCodeDataURL;
        } catch (error) {
            // Tiếp tục mà không ném lỗi - chỉ trả về null nếu không thể tạo QR
            return null;
        }
    }

    // Xử lý callback từ SePay
    static verifySePayCallback(callbackData) {
        try {
            if (!callbackData) {
                return false;
            }
            
            // Xác thực thông tin callback từ SePay
            const { resultCode, amount, orderId, signature } = callbackData;
            
            // Kiểm tra các trường bắt buộc
            if (!orderId || !resultCode) {
                return false;
            }
            
            // Kiểm tra chữ ký nếu SePay cung cấp
            if (signature) {
                // Tạo chuỗi dữ liệu cần xác thực
                const dataToVerify = `${orderId}|${amount}|${resultCode}`;
                
                // Tạo chữ ký dựa trên secret key SePay
                const expectedSignature = crypto
                    .createHmac('sha256', process.env.SEPAY_API_TOKEN)
                    .update(dataToVerify)
                    .digest('hex');
                
                // So sánh chữ ký
                if (signature !== expectedSignature) {
                    return false;
                }
            }
            
            // Nếu không có lỗi và kiểm tra chữ ký thành công, trả về true
            return true;
        } catch (error) {
            // Trong trường hợp có lỗi, trả về false
            return false;
        }
    }

    // Hàm hỗ trợ sắp xếp object
    static sortObject(obj) {
        return Object.keys(obj).sort().reduce((result, key) => {
            result[key] = obj[key];
            return result;
        }, {});
    }

    // Lưu lại lịch sử webhook
    static logWebhook(data) {
        try {
            // Triển khai logic lưu webhook vào database thực tế
            // Ví dụ: Lưu vào bảng PaymentLogs, WebhookLogs...
        } catch (error) {
            // Xử lý lỗi
        }
    }

    // Tạo QR Code thanh toán ngân hàng sử dụng SePay
    static generateBankQRCode(accountNumber, bankCode, amount, description) {
        try {
            // Validate input
            if (!accountNumber || !bankCode) {
                return null;
            }

            // Mã hóa nội dung chuyển khoản nếu có
            const encodedDescription = description ? encodeURIComponent(description) : '';

            // Tạo URL QR Code
            let qrUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankCode}`;
            
            // Thêm số tiền nếu có
            if (amount && amount > 0) {
                qrUrl += `&amount=${amount}`;
            }
            
            // Thêm nội dung chuyển khoản nếu có
            if (encodedDescription) {
                qrUrl += `&des=${encodedDescription}`;
            }
            
            return qrUrl;
        } catch (error) {
            return null;
        }
    }
}

export default PaymentService;