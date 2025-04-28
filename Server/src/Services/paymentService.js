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
    baseUrl: isDevelopment ? "http://localhost:3000" : "https://quanlythucpham.vercel.app",
    apiUrl: isDevelopment ? "http://localhost:8080" : "https://quanlythucpham-azf6.vercel.app"
};

class PaymentService {
    // SePay Payment
    static async createSePayPayment(orderId, amount, orderInfo, customRedirectUrl = null) {
        try {
            // Cấu hình endpoints callback
            // Sử dụng customRedirectUrl từ client nếu có, ngược lại dùng URL mặc định
            const returnUrl = customRedirectUrl || `${SITE_CONFIG.baseUrl}/payment-result`;
            
            // Ưu tiên sử dụng NGROK_URL nếu có (cho môi trường phát triển với ngrok)
            const ngrokUrl = process.env.NGROK_URL;
            
            // Sử dụng đường dẫn chính xác của API
            const apiBaseUrl = ngrokUrl || (isDevelopment 
                ? "http://localhost:8080" 
                : "https://quanlythucpham-azf6.vercel.app");
            
            // Đường dẫn webhook SePay chính xác
            const notifyUrl = `${apiBaseUrl}/api/payments/webhook/bank`;
            
            console.log("Using SePay callback URLs:", { returnUrl, notifyUrl });
            console.log("Using ngrokUrl:", ngrokUrl || "Not set");
            
            const requestData = {
                merchantId: SEPAY.merchantId,
                orderId: orderId.toString(),
                amount: parseInt(amount),
                orderInfo: orderInfo,
                returnUrl: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}status=success&amount=${amount}`,
                notifyUrl: notifyUrl,
                expireTime: SEPAY.qrExpireTime // Thêm thời gian hết hạn từ config
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
            console.log("====== WEBHOOK LOG ======");
            console.log("Timestamp:", new Date().toISOString());
            console.log("Webhook data:", JSON.stringify(data, null, 2));
            console.log("=========================");
            
            // Nếu có order_id hoặc orderId, kiểm tra và cập nhật đơn hàng
            const orderId = data.order_id || data.orderId;
            if (orderId) {
                // Trong triển khai thực tế, bạn sẽ lưu webhook vào database
                // Ví dụ: Lưu vào bảng PaymentLogs, WebhookLogs...
                
                // Lưu trữ tạm thời vào bộ nhớ (chỉ cho phát triển)
                if (!global.webhookHistory) {
                    global.webhookHistory = [];
                }
                
                global.webhookHistory.push({
                    timestamp: new Date(),
                    orderId: orderId,
                    data: data
                });
                
                // Giới hạn số lượng webhook lưu trong bộ nhớ
                if (global.webhookHistory.length > 100) {
                    global.webhookHistory.shift();
                }
            }
        } catch (error) {
            console.error("Error logging webhook:", error);
        }
    }

    // Tạo QR Code thanh toán ngân hàng sử dụng SePay
    static generateBankQRCode(accountNumber, bankCode, amount, description) {
        try {
            // Validate input
            if (!accountNumber || !bankCode) {
                return null;
            }

            // Chuẩn hóa mã ngân hàng để đảm bảo tương thích với Napas 247
            const normalizedBankCode = this.normalizeBankCode(bankCode);
            
            // Trích xuất orderId từ description
            let orderId = '';
            if (description) {
                const idMatch = description.match(/([a-f0-9]{24})/i);
                if (idMatch && idMatch[1]) {
                    orderId = idMatch[1];
                }
            }
            
            // Tạo nội dung chuyển khoản cực kỳ đơn giản - CHỈ CÓ ID
            // Bỏ qua "TT DH" và các text khác để đảm bảo không có vấn đề khi nhận diện
            const simpleDescription = orderId || description;
            
            // Tạo URL QR Code với định dạng tương thích Napas 247
            let qrUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${normalizedBankCode}`;
            
            // Thêm số tiền nếu có
            if (amount && amount > 0) {
                qrUrl += `&amount=${amount}`;
            }
            
            // Thêm nội dung chuyển khoản - CHỈ LÀ ID không thêm bất kỳ prefix nào
            qrUrl += `&des=${simpleDescription}`;
            
            return qrUrl;
        } catch (error) {
            console.error("Lỗi tạo QR code ngân hàng:", error);
            return null;
        }
    }

    // Hàm chuẩn hóa mã ngân hàng cho Napas 247
    static normalizeBankCode(bankCode) {
        // Bảng ánh xạ mã ngân hàng thường gặp sang mã Napas 247
        const bankMapping = {
            'MBBank': 'MB',
            'Techcombank': 'TCB',
            'Vietcombank': 'VCB',
            'VietinBank': 'CTG',
            'BIDV': 'BIDV',
            'Agribank': 'AGR',
            'TPBank': 'TPB',
            'VPBank': 'VPB',
            'ACB': 'ACB',
            'OCB': 'OCB',
            'SHB': 'SHB'
        };

        // Kiểm tra nếu bankCode cần được ánh xạ
        if (bankMapping[bankCode]) {
            return bankMapping[bankCode];
        }

        // Nếu không tìm thấy trong bảng ánh xạ, trả về mã gốc
        return bankCode;
    }
}

export default PaymentService;