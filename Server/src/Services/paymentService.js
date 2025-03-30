import { createHmac } from 'crypto';
import moment from 'moment';
import { stringify } from 'querystring';
import { post } from 'axios';
import { VNPAY, MOMO } from '../config/paymentConfig';

class PaymentService {
    // vnpay Payment
    static async createVNPayPayment(orderId, amount, bankCode = '') {
        const { VNP_TmnCode, VNP_HashSecret, VNP_Url, VNP_ReturnUrl } = VNPAY;
        
        const vnp_Params = {
            vnp_Version: '2.1.0',
            vnp_TmnCode: VNP_TmnCode,
            vnp_Amount: amount * 100,
            vnp_Command: 'pay',
            vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
            vnp_CurrCode: 'VND',
            vnp_IpAddr: '127.0.0.1',
            vnp_Locale: 'vn',
            vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
            vnp_OrderType: 'other',
            vnp_ReturnUrl: VNP_ReturnUrl,
            vnp_TxnRef: orderId,
        };

        if (bankCode) {
            vnp_Params.vnp_BankCode = bankCode;
        }

        const sortedParams = this.sortObject(vnp_Params);
        const signData = stringify(sortedParams, { encode: false });
        const hmac = createHmac('sha512', VNP_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        return `${VNP_Url}?${signData}&vnp_SecureHash=${signed}`;
    }

    // momo Payment
    static async createMomoPayment(orderId, amount, orderInfo) {
        const { partnerCode, accessKey, secretKey, endpoint, returnUrl, notifyUrl } = MOMO;
    
    const requestId = partnerCode + new Date().getTime();
    const extraData = '';
    const requestType = 'captureWallet';
    
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${requestType}`;
    
    const signature = createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl: returnUrl,
      ipnUrl: notifyUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi'
    };

    const response = await post(endpoint, requestBody);
    return response.data.payUrl;
  }

  static sortObject(obj) {
    return Object.keys(obj).sort().reduce((result, key) => {
      result[key] = obj[key];
      return result;
    }, {});
  }
}

export default PaymentService;