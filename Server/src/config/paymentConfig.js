/* eslint-disable no-undef */
import dotenv from 'dotenv';
dotenv.config();

// Tự động nhận diện môi trường
const isDevelopment = process.env.NODE_ENV !== 'production';

// Cấu hình domain dựa theo môi trường
const SITE_CONFIG = {
    baseUrl: isDevelopment ? "http://localhost:3000" : "https://quanlythucpham.vercel.app",
    apiUrl: isDevelopment ? "http://localhost:8080" : "https://quanlythucpham-azf6.vercel.app"
};

export const SEPAY = {
    merchantId: "DNC_FOOD",
    merchantName: "DNC Food",
    apiToken: process.env.SEPAY_API_TOKEN || 'J63FBVYE2ABYD8RQLHIGETZ1A799DKWZS5PBOYJZJ4HDXSQTSWIUU0RQGTVFATF',
    endpoint: 'https://api.sepay.vn/v1/payments',
    returnUrl: `${SITE_CONFIG.baseUrl}/payment-result`,
    notifyUrl: `${SITE_CONFIG.apiUrl}/webhook`,
    qrExpireTime: 60 * 60 * 1000, // 60 phút (đơn vị là milliseconds)
    currency: "VND"
};
                                                 