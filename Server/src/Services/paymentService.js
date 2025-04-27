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
            console.log(`[PaymentService] Creating payment for order: ${orderId}, amount: ${amount}`);
            
            // Cấu hình endpoints callback
            // Sử dụng customRedirectUrl từ client nếu có, ngược lại dùng URL mặc định
            const returnUrl = customRedirectUrl || `${SITE_CONFIG.baseUrl}/payment-result`;
            
            // Sửa URL webhook để khớp với cấu hình trực tiếp
            const notifyUrl = `https://quanlythucpham-azf6.vercel.app/api/payments/webhook/bank`;
            
            console.log("Using SePay callback URLs:", { returnUrl, notifyUrl });
            
            const requestData = {
                merchantId: SEPAY.merchantId,
                orderId: orderId.toString(),
                amount: parseInt(amount),
                orderInfo: orderInfo,
                returnUrl: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}status=success&amount=${amount}`,
                notifyUrl: notifyUrl,
                expireTime: SEPAY.qrExpireTime // Thêm thời gian hết hạn từ config
            };
            
            console.log("Sending request to SePay API:", JSON.stringify(requestData));
            
            // Kiểm tra SEPAY_API_URL và SEPAY_API_TOKEN
            if (!process.env.SEPAY_API_URL || !process.env.SEPAY_API_TOKEN) {
                console.log("Missing SEPAY_API_URL or SEPAY_API_TOKEN, using fallback payment");
                return this.createFallbackPayment(orderId, amount, orderInfo);
            }
            
            try {
                // Gọi API SePay thực từ tệp .env
                const response = await axios.post(
                    process.env.SEPAY_API_URL,
                    requestData,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.SEPAY_API_TOKEN}`
                        },
                        timeout: 15000 // Tăng timeout lên 15 giây
                    }
                );
                
                console.log("SePay API response:", JSON.stringify(response.data));
                
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
                    console.log("SePay response not successful, creating fallback payment");
                    // Nếu SePay trả về lỗi, chuyển sang phương án dự phòng
                    return this.createFallbackPayment(orderId, amount, orderInfo);
                }
            } catch (apiError) {
                console.error("SePay API call failed:", apiError.message);
                // Nếu gọi API lỗi, chuyển sang phương án dự phòng
                return this.createFallbackPayment(orderId, amount, orderInfo);
            }
        } catch (error) {
            console.error(`Error in createSePayPayment: ${error.message}`);
            // Đảm bảo không bao giờ throw lỗi, luôn tạo phương án dự phòng
            return this.createFallbackPayment(orderId, amount, orderInfo);
        }
    }

    // Tạo URL thanh toán dự phòng
    static async createFallbackPayment(orderId, amount, orderInfo) {
        try {
            console.log("[SePay] Tạo URL thanh toán dự phòng cho orderId:", orderId);
            
            // Sử dụng URL động dựa vào môi trường
            const baseUrl = SITE_CONFIG.baseUrl;
                
            // URL thanh toán dự phòng
            const fallbackUrl = `${baseUrl}/payment-result?orderId=${orderId}&status=success&amount=${amount}`;
            
            // Tạo QR chuyển khoản ngân hàng
            const bankQr = this.generateBankQRCode(
                "0326743391", // Số tài khoản MBBank
                "MB",         // Mã ngân hàng
                amount,
                `Thanh toan don hang ${orderId}`
            );
            
            // Tạo QR code cho URL thanh toán
            const qrCodeDataURL = await this.generateQRCode(bankQr || fallbackUrl);
            
            // Nếu tạo QR ngân hàng thành công, trả về thông tin đầy đủ
            if (bankQr) {
                console.log("[SePay] Đã tạo thành công QR ngân hàng dự phòng");
                return {
                    code: '01', // Dùng code "01" cho thanh toán dự phòng
                    message: 'Sử dụng mã QR chuyển khoản ngân hàng',
                    data: fallbackUrl, 
                    qr_code: qrCodeDataURL,
                    method: 'bank_transfer',
                    bank_info: {
                        accountNumber: "0326743391",
                        accountName: "NGUYEN TRONG KHIEM",
                        bankCode: "MB",
                        bankName: "MBBank - Ngân hàng Thương mại Cổ phần Quân đội"
                    }
                };
            }
            
            // Fallback nếu không tạo được QR ngân hàng
            return {
                code: '01', // Dùng code "01" cho thanh toán dự phòng
                message: 'Sử dụng URL thanh toán dự phòng',
                data: fallbackUrl, 
                qr_code: qrCodeDataURL
            };
        } catch (error) {
            console.error("[SePay] Lỗi khi tạo thanh toán dự phòng:", error);
            
            // Đảm bảo luôn trả về kết quả hợp lệ
            try {
                const baseUrl = SITE_CONFIG.baseUrl;
                const emergencyUrl = `${baseUrl}/payment-result?orderId=${orderId}&status=success&amount=${amount}`;
                
                // Tạo một QR code text-only trong trường hợp khẩn cấp
                const emergencyQR = `MBBank: 0326743391\nAmount: ${amount} VND\nContent: Thanh toan don hang ${orderId}`;
                let qrCodeEmergency = null;
                
                try {
                    qrCodeEmergency = await this.generateQRCode(emergencyQR);
                } catch (qrError) {
                    console.error("[SePay] Không thể tạo QR khẩn cấp:", qrError);
                }
                
                return {
                    code: '01',
                    message: 'Sử dụng thông tin chuyển khoản ngân hàng',
                    data: emergencyUrl,
                    qr_code: qrCodeEmergency,
                    bank_info: {
                        accountNumber: "0326743391",
                        accountName: "NGUYEN TRONG KHIEM",
                        bankCode: "MB",
                        bankName: "MBBank - Ngân hàng Thương mại Cổ phần Quân đội"
                    }
                };
            } catch (emergencyError) {
                console.error("[SePay] Lỗi nghiêm trọng khi tạo phương án khẩn cấp:", emergencyError);
                
                // Trả về thông tin tối thiểu
                return {
                    code: '01',
                    message: 'Chuyển khoản đến: MB Bank - 0326743391 - NGUYEN TRONG KHIEM',
                    data: null,
                    qr_code: null
                };
            }
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
            // Đảm bảo mã ngân hàng đúng định dạng Napas yêu cầu
            const normalizedBankCode = this.normalizeBankCode(bankCode);
            
            // Mã hóa nội dung chuyển khoản nếu có
            const encodedDescription = description ? encodeURIComponent(description) : '';

            // Tạo URL QR Code với định dạng tương thích Napas 247
            let qrUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${normalizedBankCode}`;
            
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