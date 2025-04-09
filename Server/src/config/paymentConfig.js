import dotenv from 'dotenv';
dotenv.config();

export const SEPAY = {
    merchantId: 'DNCFOOD',
    apiToken: 'J63FBVYE2ABYD8RQLHIGETZ1A799DKWZS5PBOYJZJ4HDXSQTSWIUU0RQGTVFATF',
    endpoint: 'https://api.sepay.com.vn/v1',
    returnUrl: 'http://localhost:3000/payment/result',
    notifyUrl: 'http://localhost:8080/api/payments/sepay/callback'
};
                                                 