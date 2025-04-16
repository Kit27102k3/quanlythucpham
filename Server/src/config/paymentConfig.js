/* eslint-disable no-undef */
import dotenv from 'dotenv';
dotenv.config();

// Tự động nhận diện môi trường
const isDevelopment = process.env.NODE_ENV !== 'production';

// Cấu hình domain dựa theo môi trường
const SITE_CONFIG = {
    baseUrl: isDevelopment ? "http://localhost:3000" : "https://dncfood.com",
    apiUrl: isDevelopment ? "http://localhost:8080" : "https://api.dncfood.com"
};

export const SEPAY = {
    merchantId: 'DNCFOOD',
    apiToken: process.env.SEPAY_API_TOKEN || 'J63FBVYE2ABYD8RQLHIGETZ1A799DKWZS5PBOYJZJ4HDXSQTSWIUU0RQGTVFATF',
    endpoint: 'https://api.sepay.vn/v1/payments',
    returnUrl: `${SITE_CONFIG.baseUrl}/payment-result`,
    notifyUrl: `${SITE_CONFIG.apiUrl}/api/payments/sepay/callback`,
    qrExpireTime: 24 * 60 // 24 giờ tính bằng phút
};
                                                 