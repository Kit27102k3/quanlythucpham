/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import Payment from "../Model/Payment.js";
import Cart from "../Model/Cart.js";
import Order from "../Model/Order.js";
import PaymentService from "../Services/paymentService.js";
import crypto from "crypto";
import querystring from "qs";
import axios from "axios";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import { SEPAY } from "../config/paymentConfig.js";

dotenv.config();
const SEPAY_API_URL = process.env.SEPAY_API_URL;
const SEPAY_API_TOKEN = process.env.SEPAY_API_TOKEN;

// Tạo URL thanh toán SePay
export const createSepayPaymentUrl = async (req, res) => {
  try {
    const { orderId, amount, orderInfo, redirectUrl } = req.body;
    
    console.log("Received payment request:", JSON.stringify(req.body));
    
    // Validate đầu vào
    if (!orderId || !amount || !orderInfo) {
      console.log("Missing required fields for payment");
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cần thiết: orderId, amount, orderInfo"
      });
    }
    
    // Chuyển đổi amount sang kiểu số nếu cần
    const numericAmount = parseInt(amount);
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      console.log("Invalid amount:", amount);
      return res.status(400).json({
        success: false,
        message: "Số tiền không hợp lệ"
      });
    }
    
    try {
      // Gọi service để tạo thanh toán SePay
      const paymentResult = await PaymentService.createSePayPayment(
        orderId,
        numericAmount,
        orderInfo,
        redirectUrl // Truyền redirectUrl vào hàm
      );
      
      console.log("Payment result:", JSON.stringify(paymentResult));
      
      // Trả về URL thanh toán thực từ SePay
      return res.json({
        success: true,
        paymentUrl: paymentResult.data,
        qrCode: paymentResult.qr_code
      });
    } catch (paymentError) {
      console.error("Error creating SePay payment:", paymentError);
      
      // Tạo QR code chuyển khoản ngân hàng dự phòng
      try {
        // Tạo mã QR dự phòng
        const bankQRCode = await PaymentService.generateBankQRCode(
          "0326743391", // Số tài khoản
          "MB", // Mã ngân hàng MB Bank
          numericAmount,
          `Thanh toan don hang ${orderId}`
        );
        
        // Tạo data URL cho QR code
        const qrDataURL = await PaymentService.generateQRCode(bankQRCode);
        
        return res.json({
          success: true,
          paymentUrl: null,
          qrCode: qrDataURL,
          method: "bank_transfer",
          message: "Sử dụng mã QR chuyển khoản ngân hàng"
        });
      } catch (backupError) {
        console.error("Error creating backup bank QR:", backupError);
        return res.status(500).json({
          success: false,
          message: "Không thể khởi tạo thanh toán",
          error: backupError.message
        });
      }
    }
  } catch (error) {
    console.error("SePay payment creation failed:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể khởi tạo thanh toán SePay",
      error: error.message
    });
  }
};

// Xử lý callback từ SePay
export const handleSepayCallback = async (req, res) => {
  try {
    console.log('Received SePay webhook:', JSON.stringify(req.body));
    console.log('Webhook headers:', JSON.stringify(req.headers));

    // Luôn trả về 200 OK để tránh SePay gửi lại webhook
    // Sau khi trả về 200, tiếp tục xử lý bất đồng bộ
    const response = {
      success: true,
      code: "00",
      message: "SePay webhook received successfully",
      data: null
    };
    
    // Trả về ngay lập tức để tránh timeout
    res.status(200).json(response);

    try {
      // Tiếp tục xử lý sau khi đã trả về response
      const { orderId, amount, resultCode, message } = req.body;
      
      // Ensure orderId exists
      const orderIdToUse = orderId || req.body.order_id;
      if (!orderIdToUse) {
        console.error('Missing orderId in callback data');
        return;
      }

      // Tìm đơn hàng
      const order = await Order.findOne({ 
        $or: [
          { _id: orderIdToUse },
          { orderId: orderIdToUse }
        ]
      });

      if (!order) {
        console.error('Order not found:', orderIdToUse);
        return;
      }

      // Tìm hoặc tạo payment record
      let payment = await Payment.findOne({ 
        $or: [
          { orderId: order._id },
          { orderId: orderIdToUse }
        ]
      });
      if (!payment) {
        payment = new Payment({
          orderId: order._id,
          amount: amount || order.totalAmount,
          paymentMethod: 'sepay',
          status: 'pending'
        });
      }

      // Cập nhật trạng thái thanh toán khi resultCode là "0"
      if (resultCode === "0" || resultCode === 0) {
        payment.status = 'completed';
        order.paymentStatus = 'completed';
        order.status = 'processing';
      } else {
        payment.status = 'failed';
        order.paymentStatus = 'pending';
      }

      payment.responseCode = resultCode;
      payment.responseMessage = message;
      payment.paidAt = new Date();
      
      await payment.save();
      await order.save();

      console.log(`Payment process completed for order ${order._id}, status: ${payment.status}`);
    } catch (error) {
      console.error('Error processing SePay callback after response sent:', error);
    }

  } catch (error) {
    console.error('Error in handleSepayCallback:', error);
    // Vẫn trả về 200 nếu chưa trả về
    if (!res.headersSent) {
      return res.status(200).json({
        success: true,
        code: "00",
        message: "SePay webhook received with error",
        error: error.message
      });
    }
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
        message:
          "Missing required fields: amount, products, paymentMethod, userId",
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
      products: products.map((product) => ({
        productId: product.productId,
        quantity: product.quantity,
        price: product.price,
      })),
      paymentMethod,
      status: "pending",
    });

    await payment.save();

    return res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating payment",
      error: error.message,
    });
  }
};

// Lấy tất cả thanh toán
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate("products.productId");
    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: "Lỗi khi lấy danh sách thanh toán",
      error: error.message 
    });
  }
};

// Lấy thanh toán theo ID
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate(
      "products.productId"
    );
    
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy thông tin thanh toán" 
      });
    }
    
    return res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: "Lỗi khi lấy thông tin thanh toán",
      error: error.message
    });
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
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy thông tin thanh toán" 
      });
    }
    
    return res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: "Lỗi khi cập nhật trạng thái thanh toán",
      error: error.message 
    });
  }
};

// Cập nhật thông tin thanh toán
export const updatePayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const updateData = req.body;
    
    // Chỉ cho phép cập nhật các trường an toàn
    const allowedFields = ['orderId', 'status', 'transactionId'];
    const filteredData = {};
    
    for (const key of Object.keys(updateData)) {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    }
    
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { $set: filteredData },
      { new: true }
    );
    
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy thông tin thanh toán" 
      });
    }
    
    return res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: "Lỗi khi cập nhật thông tin thanh toán",
      error: error.message 
    });
  }
};

// Xóa thanh toán
export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy thông tin thanh toán" 
      });
    }
    
    return res.json({ 
      success: true,
      message: "Xóa thanh toán thành công" 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: "Lỗi khi xóa thanh toán",
      error: error.message
    });
  }
};

export const createVnpayPaymentUrl = async (req, res) => {
  try {
    const { amount, products, userId } = req.body;

    // Validate input
    if (
      !amount ||
      !products ||
      !Array.isArray(products) ||
      products.length === 0 ||
      !userId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid input: required fields are amount, products (non-empty array), and userId",
      });
    }

    // Create payment record first
    const payment = new Payment({
      userId,
      totalAmount: amount,
      products: products.map((product) => ({
        productId: product.productId,
        quantity: product.quantity,
        price: product.price,
      })),
      paymentMethod: "sepay", // Using sepay since vnpay is not in enum
      status: "pending",
    });
    await payment.save();

    // Create VNPay payment URL
    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");
    const orderId = moment(date).format("DDHHmmss");
    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress;

    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    let vnpUrl = process.env.VNP_URL;

    const vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: "other",
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: process.env.VNP_RETURN_URL,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: moment(date).add(15, "minutes").format("YYYYMMDDHHmmss"),
    };

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;
    vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

    // Return both payment record and VNPay URL
    return res.status(200).json({
      success: true,
      data: {
        payment,
        vnpayUrl: vnpUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating VNPay payment URL",
      error: error.message,
    });
  }
};

// Tạo QR Code thanh toán ngân hàng
export const createBankQRCode = async (req, res) => {
  try {
    const { accountNumber, bankCode, amount, description, orderId } = req.body;

    // Validate input
    if (!accountNumber || !bankCode) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin tài khoản hoặc mã ngân hàng",
      });
    }

    // Tạo nội dung mặc định cho đơn hàng nếu không có description
    const transferDescription =
      description ||
      (orderId ? `Thanh toan don hang ${orderId}` : "Thanh toan DNC Food");

    // Tạo QR Code URL
    const qrCodeUrl = PaymentService.generateBankQRCode(
      accountNumber,
      bankCode,
      amount,
      transferDescription
    );

    if (!qrCodeUrl) {
      return res.status(500).json({
        success: false,
        message: "Không thể tạo QR Code thanh toán ngân hàng",
      });
    }

    // Tạo QR code dạng DataURL nếu client yêu cầu
    let qrCodeDataUrl = null;
    if (req.body.generateDataUrl) {
      qrCodeDataUrl = await PaymentService.generateQRCode(qrCodeUrl);
    }

    // Trả về thông tin QR Code
    return res.json({
      success: true,
      data: {
        qrCodeUrl,
        qrCodeDataUrl,
        accountInfo: {
          accountNumber,
          bankCode,
          amount: amount || 0,
          description: transferDescription,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tạo QR Code thanh toán ngân hàng",
      error: error.message,
    });
  }
};

// Get payment status
export const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find payment by orderId
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin thanh toán"
      });
    }

    // Check if payment is completed
    const order = await Order.findOne({ orderId });
    if (order && order.paymentStatus === "completed") {
      return res.json({
        success: true,
        status: "completed",
        message: "Thanh toán đã hoàn tất"
      });
    }

    return res.json({
      success: true,
      status: "pending",
      message: "Đang chờ thanh toán"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi khi kiểm tra trạng thái thanh toán",
      error: error.message
    });
  }
};

// Xử lý webhook từ SePay và ngân hàng
export const handleBankWebhook = async (req, res) => {
  try {
    // Log toàn bộ dữ liệu nhận được
    console.log("=============== WEBHOOK DATA ===============");
    console.log("Headers:", JSON.stringify(req.headers));
    console.log("Body:", JSON.stringify(req.body));
    console.log("URL:", req.originalUrl);
    console.log("===========================================");
    
    // Trả về thành công ngay lập tức để tránh webhook timeout
    res.status(200).json({
      success: true,
      code: "00",
      message: "Webhook received successfully"
    });
    
    // Xử lý bất đồng bộ sau khi đã trả về response
    try {
      // Phân tích request body để xác định loại webhook (SePay, MBBank, etc.)
      const { 
        // Chuẩn hóa các trường từ nhiều nguồn khác nhau
        transaction_id, 
        transactionId,
        order_id, 
        orderId: requestOrderId,
        amount, 
        status,
        gateway,
        transferAmount,
        content // Thêm content cho MBBank
      } = req.body;
      
      // Ưu tiên các trường theo thứ tự logic
      let finalOrderId = requestOrderId || order_id || null;
      const finalTransactionId = transactionId || transaction_id || `webhook_${Date.now()}`;
      const finalAmount = amount || transferAmount || null;
      
      // Ghi log dữ liệu webhook
      PaymentService.logWebhook(req.body);
      
      // Trích xuất orderId từ nội dung chuyển khoản nếu chưa có
      if (!finalOrderId && content) {
        console.log("Trying to extract orderId from content:", content);
        
        // Thử nhiều pattern để tìm mã đơn hàng
        const patterns = [
          /don hang[:\s]*#?([a-zA-Z0-9_-]+)/i,  // "Thanh toan don hang #ABC123"
          /thanh toan don hang[:\s]*#?([a-zA-Z0-9_-]+)/i, // "Thanh toan don hang ABC123"
          /#([a-zA-Z0-9_-]+)/i,  // "#ABC123"
          /([a-f0-9]{24})/i,  // MongoDB ID format
          /(\d{8,15}[-]?\d{1,6})/i  // Timestamp-random format
        ];
        
        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match && match[1]) {
            finalOrderId = match[1].trim();
            console.log(`Extracted orderId from content: ${finalOrderId} using pattern: ${pattern}`);
            break;
          }
        }
        
        // Tìm trực tiếp mã đơn hàng bắt đầu bằng "680" (như trong ảnh)
        if (!finalOrderId) {
          const directMatch = content.match(/680[a-zA-Z0-9]+/);
          if (directMatch && directMatch[0]) {
            finalOrderId = directMatch[0];
            console.log(`Found orderId by direct match: ${finalOrderId}`);
          }
        }
      }
      
      // Kiểm tra nếu không có orderId
      if (!finalOrderId) {
        console.log("Missing orderId in webhook data");
        return;
      }
      
      console.log(`Processing webhook for order ID: ${finalOrderId}, transaction: ${finalTransactionId}`);
      
      // Tìm đơn hàng với nhiều điều kiện
      const order = await Order.findOne({
        $or: [
          { _id: finalOrderId },
          { orderId: finalOrderId }
        ]
      });
      
      if (!order) {
        console.log(`Order not found with ID: ${finalOrderId}`);
        
        // In ra 10 đơn hàng gần nhất để kiểm tra
        const recentOrders = await Order.find({}).sort({createdAt: -1}).limit(10);
        console.log("Recent orders:", recentOrders.map(o => ({id: o._id, status: o.status})));
        return;
      }
      
      console.log(`Found order: ${order._id}, current status: ${order.status}, payment: ${order.paymentStatus}`);
      
      // Xác định trạng thái thành công
      const isSuccessful = 
        status === 'success' || 
        status === 'completed' || 
        status === '0' || 
        status === 0 || 
        (gateway === 'MBBank' && transferAmount > 0) ||
        (transferAmount && transferAmount > 0);
      
      // Tìm hoặc tạo payment record
      let payment = await Payment.findOne({ 
        $or: [
          { orderId: order._id },
          { orderId: finalOrderId }
        ]
      });
      
      if (payment) {
        console.log(`Found payment record: ${payment._id}, current status: ${payment.status}`);
        
        // Cập nhật userId nếu không tồn tại 
        if (!payment.userId && order.userId) {
          payment.userId = order.userId;
        }
        
        // Chỉ cập nhật nếu payment chưa complete hoặc cần thay đổi trạng thái
        if (payment.status !== 'completed' || !isSuccessful) {
          payment.status = isSuccessful ? 'completed' : 'pending';
          payment.transactionId = finalTransactionId;
          if (finalAmount) payment.amount = finalAmount;
          if (isSuccessful) payment.paidAt = new Date();
          await payment.save();
          console.log(`Updated payment ${payment._id} status to '${payment.status}'`);
        } else {
          console.log(`Payment ${payment._id} already completed, no update needed`);
        }
      } else {
        // Tạo payment mới
        try {
          payment = new Payment({
            orderId: order._id,
            userId: order.userId, // Thêm userId để đảm bảo đủ thông tin
            amount: finalAmount || order.totalAmount,
            paymentMethod: gateway === 'MBBank' ? 'bank_transfer' : 'sepay',
            status: isSuccessful ? 'completed' : 'pending',
            transactionId: finalTransactionId,
            paidAt: isSuccessful ? new Date() : null
          });
          await payment.save();
          console.log(`Created new payment ${payment._id} with status '${payment.status}'`);
        } catch (paymentCreateError) {
          console.error("Error creating payment:", paymentCreateError);
        }
      }
      
      // Cập nhật trạng thái đơn hàng
      if (isSuccessful) {
        if (order.paymentStatus !== 'completed') {
          order.paymentStatus = 'completed';
          order.status = 'processing'; // Chuyển sang trạng thái xử lý
          await order.save();
          console.log(`Updated order ${order._id} status to 'processing'`);
        } else {
          console.log(`Order ${order._id} already marked as completed`);
        }
      }
    } catch (processingError) {
      console.error("Error processing webhook after response:", processingError);
    }
  } catch (error) {
    console.error("Fatal error in webhook handler:", error);
    
    // Đảm bảo vẫn trả về 200 nếu chưa trả về
    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        code: "00",
        message: "Webhook received with error"
      });
    }
  }
};

// Kiểm tra trạng thái thanh toán qua SePay
export const checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log("Checking payment status for orderId:", orderId);
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Missing orderId parameter"
      });
    }

    // Tìm đơn hàng
    const order = await Order.findOne({
      $or: [
        { _id: orderId },
        { orderId: orderId }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Tìm payment liên quan đến đơn hàng
    const payment = await Payment.findOne({ 
      $or: [
        { orderId: order._id },
        { orderId: orderId }
      ]
    });

    // Kiểm tra trạng thái thanh toán
    const isPaymentCompleted = payment && payment.status === 'completed';
    const isOrderPaid = order.paymentStatus === 'completed';
    
    // Nếu đã thanh toán thành công (từ payment record hoặc order status)
    if (isPaymentCompleted || isOrderPaid) {
      return res.json({
        success: true,
        status: "completed",
        message: "Thanh toán đã hoàn tất",
        data: {
          orderId: order._id,
          totalAmount: order.totalAmount,
          paymentMethod: payment?.paymentMethod || 'unknown',
          paidAt: payment?.paidAt || new Date(),
          orderStatus: order.status
        }
      });
    }

    // Tiến hành kiểm tra với cổng thanh toán nếu chưa cập nhật hoàn tất
    try {
      // Kiểm tra trực tiếp với SePay API nếu có thể
      const paymentResult = await axios.get(
        `${process.env.SEPAY_API_URL}/transaction/status`,
        {
          params: { order_id: orderId },
          headers: {
            'Authorization': `Bearer ${process.env.SEPAY_API_TOKEN}`
          },
          timeout: 5000 // 5 giây timeout
        }
      ).catch(err => {
        console.log("SePay API check error (non-fatal):", err.message);
        return { data: { status: 'pending' } };
      });

      // Nếu SePay trả về trạng thái thành công
      if (paymentResult.data && paymentResult.data.status === 'success') {
        // Cập nhật trạng thái đơn hàng và payment
        order.paymentStatus = 'completed';
        order.status = 'processing';
        await order.save();
        
        if (payment) {
          payment.status = 'completed';
          payment.paidAt = new Date();
          await payment.save();
        }
        
        return res.json({
          success: true,
          status: "completed",
          message: "Thanh toán đã hoàn tất",
          data: {
            orderId: order._id,
            totalAmount: order.totalAmount,
            orderStatus: order.status
          }
        });
      }

      // Trường hợp chưa thanh toán hoặc đang xử lý
      return res.json({
        success: false, // Ban đầu trạng thái success sẽ là false khi chưa thanh toán
        status: order.paymentStatus || "pending",
        message: "Đang chờ thanh toán",
        data: {
          orderId: order._id,
          totalAmount: order.totalAmount
        }
      });
    } catch (checkError) {
      console.error("Error checking with payment gateway:", checkError);
      
      // Trả về trạng thái hiện tại nếu không thể kiểm tra với cổng thanh toán
      return res.json({
        success: isOrderPaid, // Trạng thái success dựa trên paymentStatus hiện tại
        status: order.paymentStatus || "pending",
        message: isOrderPaid ? "Thanh toán đã hoàn tất" : "Đang chờ thanh toán",
        data: {
          orderId: order._id,
          totalAmount: order.totalAmount
        }
      });
    }
  } catch (error) {
    console.error("Error checking payment status:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking payment status",
      error: error.message
    });
  }
};

// Hàm kiểm tra chuyển khoản ngân hàng trực tiếp
// Trong thực tế, bạn sẽ tích hợp với API ngân hàng hoặc dịch vụ webhook
async function checkDirectBankTransfers(orderId) {
  try {
    // Đây là hàm mô phỏng, trong thực tế bạn sẽ kết nối với API ngân hàng
    // hoặc kiểm tra database ghi nhận webhook từ ngân hàng
    
    // Giả lập tìm kiếm giao dịch theo mã đơn hàng trong nội dung chuyển khoản
    // Trong ứng dụng thực, bạn sẽ truy vấn database hoặc gọi API ngân hàng
    
    console.log("Checking bank transfer for orderId:", orderId);
    
    // Cho mục đích demo, kiểm tra các ID giao dịch đã biết
    // Kiểm tra mã đơn hàng chứa "67feb82" hoặc các mã giao dịch SePay hiện có
    if (
      (orderId && orderId.includes("67feb82")) || 
      orderId === "1179156" || 
      orderId === "1179097"
    ) {
      console.log("Found matching bank transfer for orderId:", orderId);
      return {
        success: true,
        transaction: {
          id: `bank_${Date.now()}`,
          time: new Date(),
          amount: 5300,
          status: "success"
        }
      };
    }
    
    console.log("No bank transfer found for orderId:", orderId);
    return {
      success: false,
      message: "No bank transfer found"
    };
  } catch (error) {
    console.error("Error checking bank transfers:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
