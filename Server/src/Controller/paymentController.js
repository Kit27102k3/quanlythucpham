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
import SavedVoucher from "../Model/SavedVoucher.js";

dotenv.config();
const SEPAY_API_URL = process.env.SEPAY_API_URL;
const SEPAY_API_TOKEN = process.env.SEPAY_API_TOKEN;

// Tạo URL thanh toán SePay
export const createSepayPaymentUrl = async (req, res) => {
  try {
    const { orderId, amount, orderInfo, redirectUrl } = req.body;
    
    // Validate đầu vào
    if (!orderId || !amount || !orderInfo) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cần thiết: orderId, amount, orderInfo"
      });
    }
    
    // Chuyển đổi amount sang kiểu số nếu cần
    const numericAmount = parseInt(amount);
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền không hợp lệ"
      });
    }
    
    console.log("Yêu cầu tạo URL thanh toán SePay:", { orderId, amount: numericAmount, redirectUrl });
    
    // Tạo nội dung chuyển khoản chuẩn hóa (TT = Thanh toán, DH = đơn hàng)
    const transferContent = `TT DH ${orderId}`;
    
    // Tạo QR code chuyển khoản ngân hàng
    const bankQRUrl = await PaymentService.generateBankQRCode("0326743391", "MB", numericAmount, transferContent);
    
    // Ưu tiên trả về QR code trực tiếp để tránh redirect
    return res.json({
      success: true,
      qrCode: bankQRUrl,
      bankInfo: {
        name: "MBBank - Ngân hàng Thương mại Cổ phần Quân đội",
        accountName: "NGUYEN TRONG KHIEM",
        accountNumber: "0326743391",
        bankCode: "MB"
      },
      paymentUrl: redirectUrl || `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-result?orderId=${orderId}`,
      fallbackMode: true
    });
    
    // Đoạn code dưới đây được giữ lại nhưng không thực thi
    try {
    // Gọi service để tạo thanh toán SePay
    const paymentResult = await PaymentService.createSePayPayment(
      orderId,
      numericAmount,
      orderInfo,
      redirectUrl // Truyền redirectUrl vào hàm
    );
    
      console.log("Kết quả tạo URL thanh toán:", paymentResult);
      
      // Đảm bảo trả về URL thanh toán và QR code
      if (paymentResult && paymentResult.data) {
    return res.json({
      success: true,
      paymentUrl: paymentResult.data,
      qrCode: paymentResult.qr_code
    });
      } else {
        // Tạo QR code trực tiếp nếu không có URL từ SePay
        console.log("Không nhận được URL thanh toán từ SePay, tạo QR code trực tiếp");
        
        // Tạo nội dung chuyển khoản chuẩn hóa (TT = Thanh toán, DH = đơn hàng)
        const transferContent = `TT DH ${orderId}`;
        
        // Tạo QR code chuyển khoản ngân hàng
        const bankQRUrl = await PaymentService.generateBankQRCode("0326743391", "MB", numericAmount, transferContent);
        
        return res.json({
          success: true,
          paymentUrl: redirectUrl || `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-result?orderId=${orderId}`,
          qrCode: bankQRUrl,
          fallbackMode: true
        });
      }
    } catch (serviceError) {
      console.error("Lỗi từ PaymentService:", serviceError);
      
      // Tạo nội dung chuyển khoản chuẩn hóa
      const transferContent = `TT DH ${orderId}`;
      
      // Tạo QR code trực tiếp trong trường hợp lỗi
      const bankQRUrl = await PaymentService.generateBankQRCode("0326743391", "MB", numericAmount, transferContent);
      
      return res.json({
        success: true,
        message: "Sử dụng phương thức dự phòng",
        paymentUrl: redirectUrl || `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-result?orderId=${orderId}`,
        qrCode: bankQRUrl,
        fallbackMode: true
      });
    }
  } catch (error) {
    console.error("Lỗi khi tạo URL thanh toán SePay:", error);
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
      let payment = await Payment.findOne({ orderId: order._id });
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
        
        // Xóa voucher đã lưu sau khi thanh toán thành công (nếu có)
        if (payment.savedVoucherId) {
          try {
            await SavedVoucher.findByIdAndDelete(payment.savedVoucherId);
            console.log(`Đã xóa voucher đã lưu ${payment.savedVoucherId} sau khi thanh toán thành công`);
          } catch (voucherError) {
            console.error('Error deleting saved voucher:', voucherError);
          }
        }
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
    const { userId, amount, totalAmount, products, paymentMethod, savedVoucherId, couponDiscount, couponCode } = req.body;

    // Validate đầu vào
    if (!amount || !products || !paymentMethod || !userId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cần thiết: amount, products, paymentMethod, userId"
      });
    }

    // Tạo payment
    const payment = new Payment({
      userId,
      amount,
      totalAmount: totalAmount || amount,
      products,
      paymentMethod,
      savedVoucherId, // Lưu savedVoucherId để xóa voucher sau khi thanh toán
      status: "pending"
    });

    // Nếu có thông tin coupon, lưu vào response message
    if (couponCode || couponDiscount) {
      payment.responseMessage = `Áp dụng mã giảm giá: ${couponCode}, giảm: ${couponDiscount}`;
    }

    // Lưu payment
    const savedPayment = await payment.save();

    return res.status(201).json({
      success: true,
      data: savedPayment,
      message: "Đã tạo thông tin thanh toán"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể tạo thông tin thanh toán",
      error: error.message
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
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Received webhook data:`, JSON.stringify(req.body));
    
    // Luôn trả về 200 OK trước, sau đó xử lý webhook bất đồng bộ
    // Điều này ngăn ngừa webhook timeout và hệ thống ngân hàng gửi lại webhook nhiều lần
    const response = {
      success: true,
      code: "00",
      message: "Webhook received successfully",
      timestamp
    };
    
    // Trả về ngay để tránh timeout
    res.status(200).json(response);
    
    // Tiếp tục xử lý webhook bất đồng bộ
    processWebhook(req.body, req.headers).catch(err => {
      console.error("Error processing webhook:", err);
    });
  } catch (error) {
    console.error("Fatal error handling webhook:", error);
    // Nếu chưa trả về, trả về 200 OK
    if (!res.headersSent) {
      return res.status(200).json({
        success: true,
        code: "00",
        message: "Webhook received with error",
        error: error.message
      });
    }
  }
};

// Hàm xử lý webhook bất đồng bộ
async function processWebhook(webhookData, headers) {
  try {
    // Phân tích dữ liệu webhook
      const { 
        // Fields từ SePay
        transaction_id,
        order_id,
        amount,
        status,
        id,
        
        // Fields từ MBBank
        gateway,
        transactionDate,
        accountNumber,
        content,
        transferAmount,
        referenceCode
    } = webhookData;

      // Ghi log dữ liệu webhook
    PaymentService.logWebhook(webhookData);

      // Xử lý theo loại webhook
    let orderId = order_id || webhookData.orderId || null;
      let transactionId = transaction_id || id || referenceCode || null;
      let paymentAmount = amount || transferAmount || null;
      
      // Tìm mã đơn hàng từ nội dung chuyển khoản nếu là MBBank
      if (gateway === 'MBBank' && content) {
        console.log("Parsing MBBank content for order ID:", content);
      
      // Tìm chuỗi 24 ký tự hex - mã đơn hàng MongoDB
      const hexIdPattern = /[a-f0-9]{24}/i;
      const hexMatch = content.match(hexIdPattern);
      
      if (hexMatch) {
        orderId = hexMatch[0];
        console.log("Extracted MongoDB ID from content:", orderId);
      } 
      // Nếu không tìm được mã hex, thử tìm theo các format khác
      else {
        let orderIdMatch = null;
        const patterns = [
          /TT DH\s+([a-zA-Z0-9]+)/i,
          /don hang\s+([a-zA-Z0-9]+)/i,
          /DH\s+([a-zA-Z0-9]+)/i
        ];
        
        // Thử từng pattern
        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match && match[1]) {
            orderIdMatch = match;
            break;
          }
        }
        
        if (orderIdMatch && orderIdMatch[1]) {
          // Xử lý mã đơn hàng tìm được
          let extractedId = orderIdMatch[1];
          const cleanHexMatch = extractedId.match(/^([a-f0-9]{24})/i);
          
          if (cleanHexMatch) {
            orderId = cleanHexMatch[1];
          } else {
            orderId = extractedId;
          }
          
          console.log("Extracted order ID from MBBank content:", orderId);
        }
        }
      }

    // Nếu không tìm được orderId, dừng xử lý
      if (!orderId) {
        console.log("Could not find order ID in webhook data");
      return;
      }

      console.log(`Processing webhook for order ID: ${orderId}, transaction: ${transactionId}`);

    // Tìm đơn hàng
        const order = await Order.findOne({
          $or: [
            { _id: orderId },
            { orderId: orderId }
          ]
        });
        
        if (!order) {
          console.log(`Order not found with ID: ${orderId}`);
      return;
    }

    // Xác định trạng thái thanh toán thành công
        const isSuccessful = 
          status === 'success' || 
          status === 'completed' || 
          status === '0' || 
          status === 0 || 
          (gateway === 'MBBank' && transferAmount > 0);
          
        if (isSuccessful) {
      // Cập nhật trạng thái đơn hàng
          if (order.status !== 'completed') {
            order.paymentStatus = 'completed';
            order.status = 'processing';
            order.isPaid = true;
            
            // Log chi tiết để troubleshoot
            console.log(`Cập nhật đơn hàng ${order._id} thành isPaid=true, paymentStatus=completed, status=processing`);
            
            // Lưu giao dịch vào đơn hàng
            if (!order.transactionId && transactionId) {
              order.transactionId = transactionId;
            }
            
            try {
              await order.save();
              console.log(`Updated order ${order._id} status to 'completed', isPaid=true`);
            } catch (orderSaveError) {
              console.error("Error saving order:", orderSaveError);
              // Thử cập nhật lại chỉ các trường cần thiết
              try {
                await Order.updateOne(
                  { _id: order._id },
                  { 
                    $set: { 
                      paymentStatus: 'completed',
                      status: 'processing',
                      isPaid: true,
                      transactionId: transactionId || order.transactionId
                    }
                  }
                );
                console.log(`Updated order ${order._id} with updateOne`);
              } catch (updateError) {
                console.error("Error updating order:", updateError);
              }
            }
          } else {
            console.log(`Order ${order._id} already marked as completed`);
          }

      // Tìm hoặc tạo payment record
          try {
            let payment = await Payment.findOne({ 
              $or: [
                { orderId: order._id },
                { orderId: orderId }
              ]
            });
            
            if (payment) {
          // Cập nhật payment record nếu tồn tại
              if (payment.status !== 'completed') {
                payment.status = 'completed';
                payment.transactionId = transactionId || `webhook_${Date.now()}`;
                payment.amount = paymentAmount || payment.amount;
                payment.paidAt = new Date();
                
                // Xóa voucher đã lưu sau khi thanh toán thành công (nếu có)
                if (payment.savedVoucherId) {
                  try {
                    await SavedVoucher.findByIdAndDelete(payment.savedVoucherId);
                    console.log(`Đã xóa voucher đã lưu ${payment.savedVoucherId} sau khi thanh toán thành công (webhook)`);
                  } catch (voucherError) {
                    console.error('Error deleting saved voucher from webhook:', voucherError);
                  }
                }
                
                await payment.save();
                console.log(`Updated payment ${payment._id} status to 'completed'`);
              } else {
                console.log(`Payment ${payment._id} already marked as completed`);
              }
            } else {
          // Tạo payment record mới
          try {
            // Đảm bảo có đủ thông tin
            const userId = order.userId || order.user;
            const amount = paymentAmount || order.totalAmount;
            
            if (!userId) {
              console.warn("Cannot create payment record: missing userId");
            } else if (!amount) {
              console.warn("Cannot create payment record: missing amount");
            } else {
                const newPayment = new Payment({
                  orderId: order._id,
                userId: userId,
                totalAmount: amount,
                amount: amount,
                  paymentMethod: gateway === 'MBBank' ? 'bank_transfer' : 'sepay',
                  status: 'completed',
                  transactionId: transactionId || `webhook_${Date.now()}`,
                  paidAt: new Date()
                });
                await newPayment.save();
                console.log(`Created new payment record for order ${order._id}`);
            }
              } catch (paymentCreateError) {
            console.error("Error creating payment record:", paymentCreateError);
              }
            }
          } catch (paymentError) {
            console.error("Error updating payment:", paymentError);
          }

      console.log(`Webhook processing for order ${orderId} completed successfully`);
        } else {
          console.log(`Webhook received with non-success status: ${status}`);
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
  }
}

// Kiểm tra trạng thái thanh toán qua SePay
export const checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Cache-busting: Đảm bảo luôn lấy dữ liệu mới nhất từ DB
    const cacheKey = req.query._ || Date.now();
    console.log(`Checking payment status for orderId: ${orderId}, cache key: ${cacheKey}`);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Missing orderId parameter"
      });
    }

    // Kiểm tra đơn hàng trong database
    console.log("Querying order status from database");
    
    try {
    // Tìm đơn hàng
    const order = await Order.findOne({
      $or: [
        { _id: orderId },
        { orderId: orderId }
      ]
    });

    if (!order) {
        console.log(`Order not found with ID: ${orderId}`);
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

      console.log("Found order:", JSON.stringify(order));
      
      // Kiểm tra nhiều trường hơn để xác định trạng thái thanh toán
      const isPaid = 
        order.paymentStatus === 'completed' || 
        order.isPaid === true || 
        order.status === 'processing' ||
        order.status === 'shipped' ||
        order.status === 'delivered';
      
      console.log(`Order ID: ${order._id}, Payment Status: ${order.paymentStatus}, isPaid: ${isPaid}, Status: ${order.status}`);
      
      // Kiểm tra trạng thái thanh toán dựa trên dữ liệu thực tế
      if (isPaid) {
        // Đảm bảo cập nhật trạng thái nếu chưa đồng bộ
        if (order.paymentStatus !== 'completed' || order.isPaid !== true) {
          order.paymentStatus = 'completed';
          order.isPaid = true;
          await order.save();
          console.log(`Updated order payment status for ${order._id}`);
        }
        
        return res.status(200).json({
        success: true,
        status: "completed",
          message: "Thanh toán đã được xác nhận thành công",
        data: {
          orderId: order._id,
          totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            isPaid: true,
            timestamp: Date.now()
        }
      });
    }

      // Kiểm tra nếu có payment record đã hoàn thành
      const payment = await Payment.findOne({ 
        $or: [
          { orderId: order._id },
          { orderId: orderId }
        ],
        status: 'completed'
      });
      
      if (payment) {
        // Cập nhật trạng thái đơn hàng nếu chưa cập nhật
        order.paymentStatus = 'completed';
        order.status = 'processing';
        order.isPaid = true;
        await order.save();
        console.log(`Updated order ${order._id} payment status to completed`);
        
        return res.status(200).json({
          success: true,
        status: "completed",
          message: "Thanh toán đã được xác nhận thành công",
        data: {
          orderId: order._id,
            totalAmount: order.totalAmount,
            paymentMethod: payment.paymentMethod,
            isPaid: true,
            timestamp: Date.now()
        }
      });
    }

      // Trường hợp chưa thanh toán
          return res.json({
        success: false,
        status: "pending",
      message: "Đang chờ thanh toán",
      data: {
        orderId: order._id,
          totalAmount: order.totalAmount,
          isPaid: false,
          timestamp: Date.now()
        }
      });
      
    } catch (dbError) {
      console.error("Error in database query:", dbError);
      
      // Trả về lỗi cụ thể
      return res.status(500).json({
        success: false,
        message: "Lỗi truy vấn cơ sở dữ liệu",
        error: dbError.message,
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error("Error checking payment status:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking payment status",
      error: error.message,
      timestamp: Date.now() 
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

const isOrderPaid = (order) => {
  return (
    order.isPaid === true || 
    order.paymentStatus === 'completed' ||
    order.status === 'processing' ||
    order.status === 'shipped' ||
    order.status === 'delivered' ||
    order.status === 'completed'
  );
};
