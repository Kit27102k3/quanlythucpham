/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import Payment from "../Model/Payment.js";
import Cart from "../Model/Cart.js";
import Order from "../Model/Order.js";
import PaymentService from "../Services/paymentService.js";
import crypto from 'crypto';
import querystring from 'querystring';
import axios from 'axios';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from "uuid";
import moment from 'moment';

dotenv.config();

// Tạo URL thanh toán SePay
export const createSepayPaymentUrl = async (req, res) => {
  try {
    const { orderId, amount, orderInfo, redirectUrl } = req.body;

    // Validate input
    if (!orderId || !amount) {
      return res.status(400).json({
        code: "97",
        message: "Thiếu thông tin bắt buộc"
      });
    }

    // Sử dụng mock payment URL cho môi trường phát triển
    if (process.env.NODE_ENV === "development" || process.env.USE_MOCK_PAYMENT === "true") {
      console.log("Using mock payment URL for development");
      
      // Tạo URL mock có chứa thông tin thanh toán và redirectUrl
      const mockPaymentUrl = redirectUrl 
        ? `http://localhost:8080/api/payments/sepay/mock-payment?orderId=${orderId}&amount=${amount}&redirectUrl=${encodeURIComponent(redirectUrl)}`
        : `http://localhost:8080/api/payments/sepay/mock-payment?orderId=${orderId}&amount=${amount}`;
      
      return res.json({
        code: "01",
        message: "Sử dụng URL thanh toán mẫu",
        data: mockPaymentUrl
      });
    }

    // Trong môi trường thực tế, sẽ tạo chữ ký và gọi API của SePay
    // Đây chỉ là mẫu, trong thực tế cần thay thế bằng logic tương thích với API thực của SePay
    const sepayUrl = process.env.SEPAY_API_URL;
    const sepayPartnerCode = process.env.SEPAY_PARTNER_CODE;
    const sepaySecretKey = process.env.SEPAY_SECRET_KEY;
    
    // Tạo signature sử dụng crypto
    const signData = `partnerCode=${sepayPartnerCode}&orderId=${orderId}&amount=${amount}`;
    const hmac = crypto.createHmac("sha256", sepaySecretKey || "sepay-secret-key-default");
    const signature = hmac.update(signData).digest("hex");
    
    // Trong môi trường thực tế sẽ gửi request đến API của SePay
    // Nhưng ở đây vẫn sử dụng mock URL
    const mockPaymentUrl = redirectUrl 
      ? `http://localhost:8080/api/payments/sepay/mock-payment?orderId=${orderId}&amount=${amount}&redirectUrl=${encodeURIComponent(redirectUrl)}`
      : `http://localhost:8080/api/payments/sepay/mock-payment?orderId=${orderId}&amount=${amount}`;
    
    return res.json({
      code: "01",
      message: "Sử dụng URL thanh toán mẫu",
      data: mockPaymentUrl
    });
  } catch (error) {
    console.error("Lỗi khi tạo URL thanh toán SePay:", error);
    res.status(500).json({
      code: "99",
      message: "Lỗi khi tạo URL thanh toán",
      error: error.message
    });
  }
};

// Xử lý callback từ SePay
export const handleSepayCallback = async (req, res) => {
  try {
    const { orderId, amount, resultCode, message } = req.body;

    // Find the payment by orderId
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      console.error("Không tìm thấy thông tin thanh toán cho orderId:", orderId);
      return res.status(404).send("Không tìm thấy thông tin thanh toán");
    }

    // Update payment status
    payment.paymentStatus = resultCode === '0' ? 'completed' : 'failed';
    payment.responseCode = resultCode;
    payment.responseMessage = message;
    await payment.save();

    // Update order status
    const order = await Order.findById(payment.orderId);
    if (!order) {
      console.error("Không tìm thấy đơn hàng:", orderId);
      return res.status(404).send("Không tìm thấy đơn hàng");
    }

    order.status = resultCode === '0' ? 'paid' : 'unpaid';
    await order.save();

    // Redirect to client result page
    const redirectUrl = `${process.env.CLIENT_URL}/payment-result?orderId=${order._id}&status=${payment.paymentStatus}&amount=${amount}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Lỗi khi xử lý callback SePay:", error);
    
    // Nếu có redirectUrl, vẫn redirect về đó với trạng thái thất bại
    if (req.body && req.body.redirectUrl) {
      const failureUrl = req.body.redirectUrl.replace("status=success", "status=failed");
      return res.redirect(failureUrl);
    }
    
    res.status(500).json({ 
      success: false,
      message: "Lỗi khi xử lý callback",
      error: error.message
    });
  }
};

// Tạo thanh toán mới
export const createPayment = async (req, res) => {
  try {
    const { amount, products, paymentMethod, userId } = req.body;

    // Validate required fields
    if (!amount || !products || !paymentMethod || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: amount, products, paymentMethod, userId",
      });
    }

    // Validate products array
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Products must be a non-empty array",
      });
    }

    // Validate payment method
    if (!["cod", "sepay"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Payment method must be either 'cod' or 'sepay'",
      });
    }

    // Create new payment
    const payment = new Payment({
      userId,
      totalAmount: amount,
      products: products.map(product => ({
        productId: product.productId,
        quantity: product.quantity,
        price: product.price
      })),
      paymentMethod,
      status: "pending",
    });

    await payment.save();

    res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({
      success: false,
      message: "Error creating payment",
      error: error.message
    });
  }
};

// Lấy tất cả thanh toán
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate("products.productId");
    res.json(payments);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách thanh toán:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách thanh toán" });
  }
};

// Lấy thanh toán theo ID
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate("products.productId");
    if (!payment) {
      return res.status(404).json({ message: "Không tìm thấy thông tin thanh toán" });
    }
    res.json(payment);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin thanh toán:", error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin thanh toán" });
  }
};

// Cập nhật trạng thái thanh toán
export const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!payment) {
      return res.status(404).json({ message: "Không tìm thấy thông tin thanh toán" });
    }
    res.json(payment);
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái thanh toán:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái thanh toán" });
  }
};

// Xóa thanh toán
export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Không tìm thấy thông tin thanh toán" });
    }
    res.json({ message: "Xóa thanh toán thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa thanh toán:", error);
    res.status(500).json({ message: "Lỗi khi xóa thanh toán" });
  }
};

export const createVnpayPaymentUrl = async (req, res) => {
  try {
    const { amount, products, userId } = req.body;

    // Validate input
    if (!amount || !products || !Array.isArray(products) || products.length === 0 || !userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid input: required fields are amount, products (non-empty array), and userId",
      });
    }

    // Create payment record first
    const payment = new Payment({
      userId,
      totalAmount: amount,
      products: products.map(product => ({
        productId: product.productId,
        quantity: product.quantity,
        price: product.price
      })),
      paymentMethod: "sepay", // Using sepay since vnpay is not in enum
      status: "pending",
    });
    await payment.save();

    // Create VNPay payment URL
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const orderId = moment(date).format('DDHHmmss');
    const ipAddr = req.headers['x-forwarded-for'] || 
                  req.connection.remoteAddress || 
                  req.socket.remoteAddress;

    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    let vnpUrl = process.env.VNP_URL;

    const vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: process.env.VNP_RETURN_URL,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: moment(date).add(15, 'minutes').format('YYYYMMDDHHmmss'),
    };

    const querystring = require('qs');
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex"); 
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

    // Return both payment record and VNPay URL
    res.status(200).json({
      success: true,
      data: {
        payment,
        vnpayUrl: vnpUrl
      }
    });

  } catch (error) {
    console.error("Error creating VNPay payment URL:", error);
    res.status(500).json({
      success: false,
      message: "Error creating VNPay payment URL",
      error: error.message
    });
  }
};

