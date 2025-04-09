/* eslint-disable no-unused-vars */
import axios from 'axios';
import { SEPAY } from '../config/paymentConfig.js';

class PaymentService {
    // SePay Payment
    static async createSePayPayment(orderId, amount, orderInfo) {
        const { merchantId, apiToken, endpoint, returnUrl, notifyUrl } = SEPAY;
        
        const timestamp = new Date().getTime();
        const nonce = Math.random().toString(36).substring(7);
        
        const payload = {
            merchant_id: merchantId,
            order_id: orderId,
            amount: amount,
            currency: 'VND',
            order_info: orderInfo,
            return_url: returnUrl,
            notify_url: notifyUrl,
            timestamp: timestamp,
            nonce: nonce
        };

        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                const response = await axios.post(`${endpoint}/payment/create`, payload, {
                    headers: {
                        'Authorization': `Bearer ${apiToken}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000 // 10 seconds timeout
                });
                return response.data.payment_url;
            } catch (error) {
                retryCount++;
                console.error(`SePay payment error (attempt ${retryCount}/${maxRetries}):`, error);
                
                if (retryCount === maxRetries) {
                    // Fallback to mock payment for testing
                    console.log('Falling back to mock payment for testing');
                    return this.createMockPayment(orderId, amount, orderInfo);
                }
                
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
            }
        }
    }

    // Mock payment method for testing
    static async createMockPayment(orderId, amount, orderInfo) {
        // Simulate a successful payment URL
        const mockPaymentUrl = `http://localhost:8081/api/payments/mock?orderId=${orderId}&amount=${amount}&status=success`;
        return mockPaymentUrl;
    }

    static verifySePayCallback() {
        // Verify callback data from SePay
        // Implement this if SePay provides verification mechanism
        return true;
    }

    static sortObject(obj) {
        return Object.keys(obj).sort().reduce((result, key) => {
            result[key] = obj[key];
            return result;
        }, {});
    }
}

export default PaymentService;