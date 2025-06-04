"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.updatePaymentStatus = exports.updatePayment = exports.handleSepayCallback = exports.handleBankWebhook = exports.getPaymentStatus = exports.getPaymentById = exports.getAllPayments = exports.deletePayment = exports.createVnpayPaymentUrl = exports.createSepayPaymentUrl = exports.createPayment = exports.createBankQRCode = exports.checkPaymentStatus = void 0;

var _Payment = _interopRequireDefault(require("../Model/Payment.js"));
var _Cart = _interopRequireDefault(require("../Model/Cart.js"));
var _Order = _interopRequireDefault(require("../Model/Order.js"));
var _paymentService = _interopRequireDefault(require("../Services/paymentService.js"));
var _crypto = _interopRequireDefault(require("crypto"));
var _qs = _interopRequireDefault(require("qs"));
var _axios = _interopRequireDefault(require("axios"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _uuid = require("uuid");
var _moment = _interopRequireDefault(require("moment"));
var _paymentConfig = require("../config/paymentConfig.js");
var _SavedVoucher = _interopRequireDefault(require("../Model/SavedVoucher.js")); /* eslint-disable no-undef */ /* eslint-disable no-unused-vars */

_dotenv.default.config();
const SEPAY_API_URL = process.env.SEPAY_API_URL;
const SEPAY_API_TOKEN = process.env.SEPAY_API_TOKEN;

// Tạo URL thanh toán SePay
const createSepayPaymentUrl = async (req, res) => {
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
    const bankQRUrl = await _paymentService.default.generateBankQRCode("0326743391", "MB", numericAmount, transferContent);

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
      const paymentResult = await _paymentService.default.createSePayPayment(
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
        const bankQRUrl = await _paymentService.default.generateBankQRCode("0326743391", "MB", numericAmount, transferContent);

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
      const bankQRUrl = await _paymentService.default.generateBankQRCode("0326743391", "MB", numericAmount, transferContent);

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
exports.createSepayPaymentUrl = createSepayPaymentUrl;const handleSepayCallback = async (req, res) => {
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
      const order = await _Order.default.findOne({
        $or: [
        { _id: orderIdToUse },
        { orderId: orderIdToUse }]

      });

      if (!order) {
        console.error('Order not found:', orderIdToUse);
        return;
      }

      // Tìm hoặc tạo payment record
      let payment = await _Payment.default.findOne({ orderId: order._id });
      if (!payment) {
        payment = new _Payment.default({
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
            await _SavedVoucher.default.findByIdAndDelete(payment.savedVoucherId);
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
exports.handleSepayCallback = handleSepayCallback;const createPayment = async (req, res) => {
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
    const payment = new _Payment.default({
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
exports.createPayment = createPayment;const getAllPayments = async (req, res) => {
  try {
    const payments = await _Payment.default.find().populate("products.productId");
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
exports.getAllPayments = getAllPayments;const getPaymentById = async (req, res) => {
  try {
    const payment = await _Payment.default.findById(req.params.id).populate(
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
exports.getPaymentById = getPaymentById;const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const payment = await _Payment.default.findByIdAndUpdate(
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
exports.updatePaymentStatus = updatePaymentStatus;const updatePayment = async (req, res) => {
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

    const payment = await _Payment.default.findByIdAndUpdate(
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
exports.updatePayment = updatePayment;const deletePayment = async (req, res) => {
  try {
    const payment = await _Payment.default.findByIdAndDelete(req.params.id);

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
};exports.deletePayment = deletePayment;

const createVnpayPaymentUrl = async (req, res) => {
  try {
    const { amount, products, userId } = req.body;

    // Validate input
    if (
    !amount ||
    !products ||
    !Array.isArray(products) ||
    products.length === 0 ||
    !userId)
    {
      return res.status(400).json({
        success: false,
        message:
        "Invalid input: required fields are amount, products (non-empty array), and userId"
      });
    }

    // Create payment record first
    const payment = new _Payment.default({
      userId,
      totalAmount: amount,
      products: products.map((product) => ({
        productId: product.productId,
        quantity: product.quantity,
        price: product.price
      })),
      paymentMethod: "sepay", // Using sepay since vnpay is not in enum
      status: "pending"
    });
    await payment.save();

    // Create VNPay payment URL
    const date = new Date();
    const createDate = (0, _moment.default)(date).format("YYYYMMDDHHmmss");
    const orderId = (0, _moment.default)(date).format("DDHHmmss");
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
      vnp_ExpireDate: (0, _moment.default)(date).add(15, "minutes").format("YYYYMMDDHHmmss")
    };

    const signData = _qs.default.stringify(vnp_Params, { encode: false });
    const hmac = _crypto.default.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;
    vnpUrl += "?" + _qs.default.stringify(vnp_Params, { encode: false });

    // Return both payment record and VNPay URL
    return res.status(200).json({
      success: true,
      data: {
        payment,
        vnpayUrl: vnpUrl
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating VNPay payment URL",
      error: error.message
    });
  }
};

// Tạo QR Code thanh toán ngân hàng
exports.createVnpayPaymentUrl = createVnpayPaymentUrl;const createBankQRCode = async (req, res) => {
  try {
    const { accountNumber, bankCode, amount, description, orderId } = req.body;

    // Validate input
    if (!accountNumber || !bankCode) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin tài khoản hoặc mã ngân hàng"
      });
    }

    // Tạo nội dung mặc định cho đơn hàng nếu không có description
    const transferDescription =
    description || (
    orderId ? `Thanh toan don hang ${orderId}` : "Thanh toan DNC Food");

    // Tạo QR Code URL
    const qrCodeUrl = _paymentService.default.generateBankQRCode(
      accountNumber,
      bankCode,
      amount,
      transferDescription
    );

    if (!qrCodeUrl) {
      return res.status(500).json({
        success: false,
        message: "Không thể tạo QR Code thanh toán ngân hàng"
      });
    }

    // Tạo QR code dạng DataURL nếu client yêu cầu
    let qrCodeDataUrl = null;
    if (req.body.generateDataUrl) {
      qrCodeDataUrl = await _paymentService.default.generateQRCode(qrCodeUrl);
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
          description: transferDescription
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tạo QR Code thanh toán ngân hàng",
      error: error.message
    });
  }
};

// Get payment status
exports.createBankQRCode = createBankQRCode;const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find payment by orderId
    const payment = await _Payment.default.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin thanh toán"
      });
    }

    // Check if payment is completed
    const order = await _Order.default.findOne({ orderId });
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
exports.getPaymentStatus = getPaymentStatus;const handleBankWebhook = async (req, res) => {
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
    processWebhook(req.body, req.headers).catch((err) => {
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
exports.handleBankWebhook = handleBankWebhook;async function processWebhook(webhookData, headers) {
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
    _paymentService.default.logWebhook(webhookData);

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
        /DH\s+([a-zA-Z0-9]+)/i];


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
    const order = await _Order.default.findOne({
      $or: [
      { _id: orderId },
      { orderId: orderId }]

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
    gateway === 'MBBank' && transferAmount > 0;

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
            await _Order.default.updateOne(
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
        let payment = await _Payment.default.findOne({
          $or: [
          { orderId: order._id },
          { orderId: orderId }]

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
                await _SavedVoucher.default.findByIdAndDelete(payment.savedVoucherId);
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
              const newPayment = new _Payment.default({
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
const checkPaymentStatus = async (req, res) => {
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
      const order = await _Order.default.findOne({
        $or: [
        { _id: orderId },
        { orderId: orderId }]

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
      const payment = await _Payment.default.findOne({
        $or: [
        { orderId: order._id },
        { orderId: orderId }],

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
exports.checkPaymentStatus = checkPaymentStatus;async function checkDirectBankTransfers(orderId) {
  try {
    // Đây là hàm mô phỏng, trong thực tế bạn sẽ kết nối với API ngân hàng
    // hoặc kiểm tra database ghi nhận webhook từ ngân hàng

    // Giả lập tìm kiếm giao dịch theo mã đơn hàng trong nội dung chuyển khoản
    // Trong ứng dụng thực, bạn sẽ truy vấn database hoặc gọi API ngân hàng

    console.log("Checking bank transfer for orderId:", orderId);

    // Cho mục đích demo, kiểm tra các ID giao dịch đã biết
    // Kiểm tra mã đơn hàng chứa "67feb82" hoặc các mã giao dịch SePay hiện có
    if (
    orderId && orderId.includes("67feb82") ||
    orderId === "1179156" ||
    orderId === "1179097")
    {
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
    order.status === 'completed');

};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfUGF5bWVudCIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwiX0NhcnQiLCJfT3JkZXIiLCJfcGF5bWVudFNlcnZpY2UiLCJfY3J5cHRvIiwiX3FzIiwiX2F4aW9zIiwiX2RvdGVudiIsIl91dWlkIiwiX21vbWVudCIsIl9wYXltZW50Q29uZmlnIiwiX1NhdmVkVm91Y2hlciIsImRvdGVudiIsImNvbmZpZyIsIlNFUEFZX0FQSV9VUkwiLCJwcm9jZXNzIiwiZW52IiwiU0VQQVlfQVBJX1RPS0VOIiwiY3JlYXRlU2VwYXlQYXltZW50VXJsIiwicmVxIiwicmVzIiwib3JkZXJJZCIsImFtb3VudCIsIm9yZGVySW5mbyIsInJlZGlyZWN0VXJsIiwiYm9keSIsInN0YXR1cyIsImpzb24iLCJzdWNjZXNzIiwibWVzc2FnZSIsIm51bWVyaWNBbW91bnQiLCJwYXJzZUludCIsImlzTmFOIiwiY29uc29sZSIsImxvZyIsInRyYW5zZmVyQ29udGVudCIsImJhbmtRUlVybCIsIlBheW1lbnRTZXJ2aWNlIiwiZ2VuZXJhdGVCYW5rUVJDb2RlIiwicXJDb2RlIiwiYmFua0luZm8iLCJuYW1lIiwiYWNjb3VudE5hbWUiLCJhY2NvdW50TnVtYmVyIiwiYmFua0NvZGUiLCJwYXltZW50VXJsIiwiQ0xJRU5UX1VSTCIsImZhbGxiYWNrTW9kZSIsInBheW1lbnRSZXN1bHQiLCJjcmVhdGVTZVBheVBheW1lbnQiLCJkYXRhIiwicXJfY29kZSIsInNlcnZpY2VFcnJvciIsImVycm9yIiwiZXhwb3J0cyIsImhhbmRsZVNlcGF5Q2FsbGJhY2siLCJKU09OIiwic3RyaW5naWZ5IiwiaGVhZGVycyIsInJlc3BvbnNlIiwiY29kZSIsInJlc3VsdENvZGUiLCJvcmRlcklkVG9Vc2UiLCJvcmRlcl9pZCIsIm9yZGVyIiwiT3JkZXIiLCJmaW5kT25lIiwiJG9yIiwiX2lkIiwicGF5bWVudCIsIlBheW1lbnQiLCJ0b3RhbEFtb3VudCIsInBheW1lbnRNZXRob2QiLCJwYXltZW50U3RhdHVzIiwic2F2ZWRWb3VjaGVySWQiLCJTYXZlZFZvdWNoZXIiLCJmaW5kQnlJZEFuZERlbGV0ZSIsInZvdWNoZXJFcnJvciIsInJlc3BvbnNlQ29kZSIsInJlc3BvbnNlTWVzc2FnZSIsInBhaWRBdCIsIkRhdGUiLCJzYXZlIiwiaGVhZGVyc1NlbnQiLCJjcmVhdGVQYXltZW50IiwidXNlcklkIiwicHJvZHVjdHMiLCJjb3Vwb25EaXNjb3VudCIsImNvdXBvbkNvZGUiLCJzYXZlZFBheW1lbnQiLCJnZXRBbGxQYXltZW50cyIsInBheW1lbnRzIiwiZmluZCIsInBvcHVsYXRlIiwiZ2V0UGF5bWVudEJ5SWQiLCJmaW5kQnlJZCIsInBhcmFtcyIsImlkIiwidXBkYXRlUGF5bWVudFN0YXR1cyIsImZpbmRCeUlkQW5kVXBkYXRlIiwibmV3IiwidXBkYXRlUGF5bWVudCIsInBheW1lbnRJZCIsInVwZGF0ZURhdGEiLCJhbGxvd2VkRmllbGRzIiwiZmlsdGVyZWREYXRhIiwia2V5IiwiT2JqZWN0Iiwia2V5cyIsImluY2x1ZGVzIiwiJHNldCIsImRlbGV0ZVBheW1lbnQiLCJjcmVhdGVWbnBheVBheW1lbnRVcmwiLCJBcnJheSIsImlzQXJyYXkiLCJsZW5ndGgiLCJtYXAiLCJwcm9kdWN0IiwicHJvZHVjdElkIiwicXVhbnRpdHkiLCJwcmljZSIsImRhdGUiLCJjcmVhdGVEYXRlIiwibW9tZW50IiwiZm9ybWF0IiwiaXBBZGRyIiwiY29ubmVjdGlvbiIsInJlbW90ZUFkZHJlc3MiLCJzb2NrZXQiLCJ0bW5Db2RlIiwiVk5QX1RNTl9DT0RFIiwic2VjcmV0S2V5IiwiVk5QX0hBU0hfU0VDUkVUIiwidm5wVXJsIiwiVk5QX1VSTCIsInZucF9QYXJhbXMiLCJ2bnBfVmVyc2lvbiIsInZucF9Db21tYW5kIiwidm5wX1RtbkNvZGUiLCJ2bnBfTG9jYWxlIiwidm5wX0N1cnJDb2RlIiwidm5wX1R4blJlZiIsInZucF9PcmRlckluZm8iLCJ2bnBfT3JkZXJUeXBlIiwidm5wX0Ftb3VudCIsInZucF9SZXR1cm5VcmwiLCJWTlBfUkVUVVJOX1VSTCIsInZucF9JcEFkZHIiLCJ2bnBfQ3JlYXRlRGF0ZSIsInZucF9FeHBpcmVEYXRlIiwiYWRkIiwic2lnbkRhdGEiLCJxdWVyeXN0cmluZyIsImVuY29kZSIsImhtYWMiLCJjcnlwdG8iLCJjcmVhdGVIbWFjIiwic2lnbmVkIiwidXBkYXRlIiwiQnVmZmVyIiwiZnJvbSIsImRpZ2VzdCIsInZucGF5VXJsIiwiY3JlYXRlQmFua1FSQ29kZSIsImRlc2NyaXB0aW9uIiwidHJhbnNmZXJEZXNjcmlwdGlvbiIsInFyQ29kZVVybCIsInFyQ29kZURhdGFVcmwiLCJnZW5lcmF0ZURhdGFVcmwiLCJnZW5lcmF0ZVFSQ29kZSIsImFjY291bnRJbmZvIiwiZ2V0UGF5bWVudFN0YXR1cyIsImhhbmRsZUJhbmtXZWJob29rIiwidGltZXN0YW1wIiwidG9JU09TdHJpbmciLCJwcm9jZXNzV2ViaG9vayIsImNhdGNoIiwiZXJyIiwid2ViaG9va0RhdGEiLCJ0cmFuc2FjdGlvbl9pZCIsImdhdGV3YXkiLCJ0cmFuc2FjdGlvbkRhdGUiLCJjb250ZW50IiwidHJhbnNmZXJBbW91bnQiLCJyZWZlcmVuY2VDb2RlIiwibG9nV2ViaG9vayIsInRyYW5zYWN0aW9uSWQiLCJwYXltZW50QW1vdW50IiwiaGV4SWRQYXR0ZXJuIiwiaGV4TWF0Y2giLCJtYXRjaCIsIm9yZGVySWRNYXRjaCIsInBhdHRlcm5zIiwicGF0dGVybiIsImV4dHJhY3RlZElkIiwiY2xlYW5IZXhNYXRjaCIsImlzU3VjY2Vzc2Z1bCIsImlzUGFpZCIsIm9yZGVyU2F2ZUVycm9yIiwidXBkYXRlT25lIiwidXBkYXRlRXJyb3IiLCJub3ciLCJ1c2VyIiwid2FybiIsIm5ld1BheW1lbnQiLCJwYXltZW50Q3JlYXRlRXJyb3IiLCJwYXltZW50RXJyb3IiLCJjaGVja1BheW1lbnRTdGF0dXMiLCJjYWNoZUtleSIsInF1ZXJ5IiwiXyIsImRiRXJyb3IiLCJjaGVja0RpcmVjdEJhbmtUcmFuc2ZlcnMiLCJ0cmFuc2FjdGlvbiIsInRpbWUiLCJpc09yZGVyUGFpZCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9Db250cm9sbGVyL3BheW1lbnRDb250cm9sbGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIG5vLXVuZGVmICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycyAqL1xuaW1wb3J0IFBheW1lbnQgZnJvbSBcIi4uL01vZGVsL1BheW1lbnQuanNcIjtcbmltcG9ydCBDYXJ0IGZyb20gXCIuLi9Nb2RlbC9DYXJ0LmpzXCI7XG5pbXBvcnQgT3JkZXIgZnJvbSBcIi4uL01vZGVsL09yZGVyLmpzXCI7XG5pbXBvcnQgUGF5bWVudFNlcnZpY2UgZnJvbSBcIi4uL1NlcnZpY2VzL3BheW1lbnRTZXJ2aWNlLmpzXCI7XG5pbXBvcnQgY3J5cHRvIGZyb20gXCJjcnlwdG9cIjtcbmltcG9ydCBxdWVyeXN0cmluZyBmcm9tIFwicXNcIjtcbmltcG9ydCBheGlvcyBmcm9tIFwiYXhpb3NcIjtcbmltcG9ydCBkb3RlbnYgZnJvbSBcImRvdGVudlwiO1xuaW1wb3J0IHsgdjQgYXMgdXVpZHY0IH0gZnJvbSBcInV1aWRcIjtcbmltcG9ydCBtb21lbnQgZnJvbSBcIm1vbWVudFwiO1xuaW1wb3J0IHsgU0VQQVkgfSBmcm9tIFwiLi4vY29uZmlnL3BheW1lbnRDb25maWcuanNcIjtcbmltcG9ydCBTYXZlZFZvdWNoZXIgZnJvbSBcIi4uL01vZGVsL1NhdmVkVm91Y2hlci5qc1wiO1xuXG5kb3RlbnYuY29uZmlnKCk7XG5jb25zdCBTRVBBWV9BUElfVVJMID0gcHJvY2Vzcy5lbnYuU0VQQVlfQVBJX1VSTDtcbmNvbnN0IFNFUEFZX0FQSV9UT0tFTiA9IHByb2Nlc3MuZW52LlNFUEFZX0FQSV9UT0tFTjtcblxuLy8gVOG6oW8gVVJMIHRoYW5oIHRvw6FuIFNlUGF5XG5leHBvcnQgY29uc3QgY3JlYXRlU2VwYXlQYXltZW50VXJsID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBvcmRlcklkLCBhbW91bnQsIG9yZGVySW5mbywgcmVkaXJlY3RVcmwgfSA9IHJlcS5ib2R5O1xuICAgIFxuICAgIC8vIFZhbGlkYXRlIMSR4bqndSB2w6BvXG4gICAgaWYgKCFvcmRlcklkIHx8ICFhbW91bnQgfHwgIW9yZGVySW5mbykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwiVGhp4bq/dSB0aMO0bmcgdGluIGPhuqduIHRoaeG6v3Q6IG9yZGVySWQsIGFtb3VudCwgb3JkZXJJbmZvXCJcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyBDaHV54buDbiDEkeG7lWkgYW1vdW50IHNhbmcga2nhu4N1IHPhu5EgbuG6v3UgY+G6p25cbiAgICBjb25zdCBudW1lcmljQW1vdW50ID0gcGFyc2VJbnQoYW1vdW50KTtcbiAgICBcbiAgICBpZiAoaXNOYU4obnVtZXJpY0Ftb3VudCkgfHwgbnVtZXJpY0Ftb3VudCA8PSAwKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJT4buRIHRp4buBbiBraMO0bmcgaOG7o3AgbOG7h1wiXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgY29uc29sZS5sb2coXCJZw6p1IGPhuqd1IHThuqFvIFVSTCB0aGFuaCB0b8OhbiBTZVBheTpcIiwgeyBvcmRlcklkLCBhbW91bnQ6IG51bWVyaWNBbW91bnQsIHJlZGlyZWN0VXJsIH0pO1xuICAgIFxuICAgIC8vIFThuqFvIG7hu5lpIGR1bmcgY2h1eeG7g24ga2hv4bqjbiBjaHXhuqluIGjDs2EgKFRUID0gVGhhbmggdG/DoW4sIERIID0gxJHGoW4gaMOgbmcpXG4gICAgY29uc3QgdHJhbnNmZXJDb250ZW50ID0gYFRUIERIICR7b3JkZXJJZH1gO1xuICAgIFxuICAgIC8vIFThuqFvIFFSIGNvZGUgY2h1eeG7g24ga2hv4bqjbiBuZ8OibiBow6BuZ1xuICAgIGNvbnN0IGJhbmtRUlVybCA9IGF3YWl0IFBheW1lbnRTZXJ2aWNlLmdlbmVyYXRlQmFua1FSQ29kZShcIjAzMjY3NDMzOTFcIiwgXCJNQlwiLCBudW1lcmljQW1vdW50LCB0cmFuc2ZlckNvbnRlbnQpO1xuICAgIFxuICAgIC8vIMavdSB0acOqbiB0cuG6oyB24buBIFFSIGNvZGUgdHLhu7FjIHRp4bq/cCDEkeG7gyB0csOhbmggcmVkaXJlY3RcbiAgICByZXR1cm4gcmVzLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIHFyQ29kZTogYmFua1FSVXJsLFxuICAgICAgYmFua0luZm86IHtcbiAgICAgICAgbmFtZTogXCJNQkJhbmsgLSBOZ8OibiBow6BuZyBUaMawxqFuZyBt4bqhaSBD4buVIHBo4bqnbiBRdcOibiDEkeG7mWlcIixcbiAgICAgICAgYWNjb3VudE5hbWU6IFwiTkdVWUVOIFRST05HIEtISUVNXCIsXG4gICAgICAgIGFjY291bnROdW1iZXI6IFwiMDMyNjc0MzM5MVwiLFxuICAgICAgICBiYW5rQ29kZTogXCJNQlwiXG4gICAgICB9LFxuICAgICAgcGF5bWVudFVybDogcmVkaXJlY3RVcmwgfHwgYCR7cHJvY2Vzcy5lbnYuQ0xJRU5UX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDozMDAwJ30vcGF5bWVudC1yZXN1bHQ/b3JkZXJJZD0ke29yZGVySWR9YCxcbiAgICAgIGZhbGxiYWNrTW9kZTogdHJ1ZVxuICAgIH0pO1xuICAgIFxuICAgIC8vIMSQb+G6oW4gY29kZSBkxrDhu5tpIMSRw6J5IMSRxrDhu6NjIGdp4buvIGzhuqFpIG5oxrBuZyBraMO0bmcgdGjhu7FjIHRoaVxuICAgIHRyeSB7XG4gICAgLy8gR+G7jWkgc2VydmljZSDEkeG7gyB04bqhbyB0aGFuaCB0b8OhbiBTZVBheVxuICAgIGNvbnN0IHBheW1lbnRSZXN1bHQgPSBhd2FpdCBQYXltZW50U2VydmljZS5jcmVhdGVTZVBheVBheW1lbnQoXG4gICAgICBvcmRlcklkLFxuICAgICAgbnVtZXJpY0Ftb3VudCxcbiAgICAgIG9yZGVySW5mbyxcbiAgICAgIHJlZGlyZWN0VXJsIC8vIFRydXnhu4FuIHJlZGlyZWN0VXJsIHbDoG8gaMOgbVxuICAgICk7XG4gICAgXG4gICAgICBjb25zb2xlLmxvZyhcIkvhur90IHF14bqjIHThuqFvIFVSTCB0aGFuaCB0b8OhbjpcIiwgcGF5bWVudFJlc3VsdCk7XG4gICAgICBcbiAgICAgIC8vIMSQ4bqjbSBi4bqjbyB0cuG6oyB24buBIFVSTCB0aGFuaCB0b8OhbiB2w6AgUVIgY29kZVxuICAgICAgaWYgKHBheW1lbnRSZXN1bHQgJiYgcGF5bWVudFJlc3VsdC5kYXRhKSB7XG4gICAgcmV0dXJuIHJlcy5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBwYXltZW50VXJsOiBwYXltZW50UmVzdWx0LmRhdGEsXG4gICAgICBxckNvZGU6IHBheW1lbnRSZXN1bHQucXJfY29kZVxuICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVOG6oW8gUVIgY29kZSB0cuG7sWMgdGnhur9wIG7hur91IGtow7RuZyBjw7MgVVJMIHThu6sgU2VQYXlcbiAgICAgICAgY29uc29sZS5sb2coXCJLaMO0bmcgbmjhuq1uIMSRxrDhu6NjIFVSTCB0aGFuaCB0b8OhbiB04burIFNlUGF5LCB04bqhbyBRUiBjb2RlIHRy4buxYyB0aeG6v3BcIik7XG4gICAgICAgIFxuICAgICAgICAvLyBU4bqhbyBu4buZaSBkdW5nIGNodXnhu4NuIGtob+G6o24gY2h14bqpbiBow7NhIChUVCA9IFRoYW5oIHRvw6FuLCBESCA9IMSRxqFuIGjDoG5nKVxuICAgICAgICBjb25zdCB0cmFuc2ZlckNvbnRlbnQgPSBgVFQgREggJHtvcmRlcklkfWA7XG4gICAgICAgIFxuICAgICAgICAvLyBU4bqhbyBRUiBjb2RlIGNodXnhu4NuIGtob+G6o24gbmfDom4gaMOgbmdcbiAgICAgICAgY29uc3QgYmFua1FSVXJsID0gYXdhaXQgUGF5bWVudFNlcnZpY2UuZ2VuZXJhdGVCYW5rUVJDb2RlKFwiMDMyNjc0MzM5MVwiLCBcIk1CXCIsIG51bWVyaWNBbW91bnQsIHRyYW5zZmVyQ29udGVudCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gcmVzLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgcGF5bWVudFVybDogcmVkaXJlY3RVcmwgfHwgYCR7cHJvY2Vzcy5lbnYuQ0xJRU5UX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDozMDAwJ30vcGF5bWVudC1yZXN1bHQ/b3JkZXJJZD0ke29yZGVySWR9YCxcbiAgICAgICAgICBxckNvZGU6IGJhbmtRUlVybCxcbiAgICAgICAgICBmYWxsYmFja01vZGU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoc2VydmljZUVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kgdOG7qyBQYXltZW50U2VydmljZTpcIiwgc2VydmljZUVycm9yKTtcbiAgICAgIFxuICAgICAgLy8gVOG6oW8gbuG7mWkgZHVuZyBjaHV54buDbiBraG/huqNuIGNodeG6qW4gaMOzYVxuICAgICAgY29uc3QgdHJhbnNmZXJDb250ZW50ID0gYFRUIERIICR7b3JkZXJJZH1gO1xuICAgICAgXG4gICAgICAvLyBU4bqhbyBRUiBjb2RlIHRy4buxYyB0aeG6v3AgdHJvbmcgdHLGsOG7nW5nIGjhu6NwIGzhu5dpXG4gICAgICBjb25zdCBiYW5rUVJVcmwgPSBhd2FpdCBQYXltZW50U2VydmljZS5nZW5lcmF0ZUJhbmtRUkNvZGUoXCIwMzI2NzQzMzkxXCIsIFwiTUJcIiwgbnVtZXJpY0Ftb3VudCwgdHJhbnNmZXJDb250ZW50KTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHJlcy5qc29uKHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgbWVzc2FnZTogXCJT4butIGThu6VuZyBwaMawxqFuZyB0aOG7qWMgZOG7sSBwaMOybmdcIixcbiAgICAgICAgcGF5bWVudFVybDogcmVkaXJlY3RVcmwgfHwgYCR7cHJvY2Vzcy5lbnYuQ0xJRU5UX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDozMDAwJ30vcGF5bWVudC1yZXN1bHQ/b3JkZXJJZD0ke29yZGVySWR9YCxcbiAgICAgICAgcXJDb2RlOiBiYW5rUVJVcmwsXG4gICAgICAgIGZhbGxiYWNrTW9kZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgdOG6oW8gVVJMIHRoYW5oIHRvw6FuIFNlUGF5OlwiLCBlcnJvcik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdGjhu4Mga2jhu59pIHThuqFvIHRoYW5oIHRvw6FuIFNlUGF5XCIsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxuICAgIH0pO1xuICB9XG59O1xuXG4vLyBY4butIGzDvSBjYWxsYmFjayB04burIFNlUGF5XG5leHBvcnQgY29uc3QgaGFuZGxlU2VwYXlDYWxsYmFjayA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKCdSZWNlaXZlZCBTZVBheSB3ZWJob29rOicsIEpTT04uc3RyaW5naWZ5KHJlcS5ib2R5KSk7XG4gICAgY29uc29sZS5sb2coJ1dlYmhvb2sgaGVhZGVyczonLCBKU09OLnN0cmluZ2lmeShyZXEuaGVhZGVycykpO1xuXG4gICAgLy8gTHXDtG4gdHLhuqMgduG7gSAyMDAgT0sgxJHhu4MgdHLDoW5oIFNlUGF5IGfhu61pIGzhuqFpIHdlYmhvb2tcbiAgICAvLyBTYXUga2hpIHRy4bqjIHbhu4EgMjAwLCB0aeG6v3AgdOG7pWMgeOG7rSBsw70gYuG6pXQgxJHhu5NuZyBi4buZXG4gICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgY29kZTogXCIwMFwiLFxuICAgICAgbWVzc2FnZTogXCJTZVBheSB3ZWJob29rIHJlY2VpdmVkIHN1Y2Nlc3NmdWxseVwiLFxuICAgICAgZGF0YTogbnVsbFxuICAgIH07XG4gICAgXG4gICAgLy8gVHLhuqMgduG7gSBuZ2F5IGzhuq1wIHThu6ljIMSR4buDIHRyw6FuaCB0aW1lb3V0XG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24ocmVzcG9uc2UpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIFRp4bq/cCB04bulYyB44butIGzDvSBzYXUga2hpIMSRw6MgdHLhuqMgduG7gSByZXNwb25zZVxuICAgICAgY29uc3QgeyBvcmRlcklkLCBhbW91bnQsIHJlc3VsdENvZGUsIG1lc3NhZ2UgfSA9IHJlcS5ib2R5O1xuICAgICAgXG4gICAgICAvLyBFbnN1cmUgb3JkZXJJZCBleGlzdHNcbiAgICAgIGNvbnN0IG9yZGVySWRUb1VzZSA9IG9yZGVySWQgfHwgcmVxLmJvZHkub3JkZXJfaWQ7XG4gICAgICBpZiAoIW9yZGVySWRUb1VzZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdNaXNzaW5nIG9yZGVySWQgaW4gY2FsbGJhY2sgZGF0YScpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIFTDrG0gxJHGoW4gaMOgbmdcbiAgICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgT3JkZXIuZmluZE9uZSh7IFxuICAgICAgICAkb3I6IFtcbiAgICAgICAgICB7IF9pZDogb3JkZXJJZFRvVXNlIH0sXG4gICAgICAgICAgeyBvcmRlcklkOiBvcmRlcklkVG9Vc2UgfVxuICAgICAgICBdXG4gICAgICB9KTtcblxuICAgICAgaWYgKCFvcmRlcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdPcmRlciBub3QgZm91bmQ6Jywgb3JkZXJJZFRvVXNlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBUw6xtIGhv4bq3YyB04bqhbyBwYXltZW50IHJlY29yZFxuICAgICAgbGV0IHBheW1lbnQgPSBhd2FpdCBQYXltZW50LmZpbmRPbmUoeyBvcmRlcklkOiBvcmRlci5faWQgfSk7XG4gICAgICBpZiAoIXBheW1lbnQpIHtcbiAgICAgICAgcGF5bWVudCA9IG5ldyBQYXltZW50KHtcbiAgICAgICAgICBvcmRlcklkOiBvcmRlci5faWQsXG4gICAgICAgICAgYW1vdW50OiBhbW91bnQgfHwgb3JkZXIudG90YWxBbW91bnQsXG4gICAgICAgICAgcGF5bWVudE1ldGhvZDogJ3NlcGF5JyxcbiAgICAgICAgICBzdGF0dXM6ICdwZW5kaW5nJ1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gQ+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgdGhhbmggdG/DoW4ga2hpIHJlc3VsdENvZGUgbMOgIFwiMFwiXG4gICAgICBpZiAocmVzdWx0Q29kZSA9PT0gXCIwXCIgfHwgcmVzdWx0Q29kZSA9PT0gMCkge1xuICAgICAgICBwYXltZW50LnN0YXR1cyA9ICdjb21wbGV0ZWQnO1xuICAgICAgICBvcmRlci5wYXltZW50U3RhdHVzID0gJ2NvbXBsZXRlZCc7XG4gICAgICAgIG9yZGVyLnN0YXR1cyA9ICdwcm9jZXNzaW5nJztcbiAgICAgICAgXG4gICAgICAgIC8vIFjDs2Egdm91Y2hlciDEkcOjIGzGsHUgc2F1IGtoaSB0aGFuaCB0b8OhbiB0aMOgbmggY8O0bmcgKG7hur91IGPDsylcbiAgICAgICAgaWYgKHBheW1lbnQuc2F2ZWRWb3VjaGVySWQpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgU2F2ZWRWb3VjaGVyLmZpbmRCeUlkQW5kRGVsZXRlKHBheW1lbnQuc2F2ZWRWb3VjaGVySWQpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYMSQw6MgeMOzYSB2b3VjaGVyIMSRw6MgbMawdSAke3BheW1lbnQuc2F2ZWRWb3VjaGVySWR9IHNhdSBraGkgdGhhbmggdG/DoW4gdGjDoG5oIGPDtG5nYCk7XG4gICAgICAgICAgfSBjYXRjaCAodm91Y2hlckVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBkZWxldGluZyBzYXZlZCB2b3VjaGVyOicsIHZvdWNoZXJFcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXltZW50LnN0YXR1cyA9ICdmYWlsZWQnO1xuICAgICAgICBvcmRlci5wYXltZW50U3RhdHVzID0gJ3BlbmRpbmcnO1xuICAgICAgfVxuXG4gICAgICBwYXltZW50LnJlc3BvbnNlQ29kZSA9IHJlc3VsdENvZGU7XG4gICAgICBwYXltZW50LnJlc3BvbnNlTWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICBwYXltZW50LnBhaWRBdCA9IG5ldyBEYXRlKCk7XG4gICAgICBcbiAgICAgIGF3YWl0IHBheW1lbnQuc2F2ZSgpO1xuICAgICAgYXdhaXQgb3JkZXIuc2F2ZSgpO1xuXG4gICAgICBjb25zb2xlLmxvZyhgUGF5bWVudCBwcm9jZXNzIGNvbXBsZXRlZCBmb3Igb3JkZXIgJHtvcmRlci5faWR9LCBzdGF0dXM6ICR7cGF5bWVudC5zdGF0dXN9YCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgU2VQYXkgY2FsbGJhY2sgYWZ0ZXIgcmVzcG9uc2Ugc2VudDonLCBlcnJvcik7XG4gICAgfVxuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gaGFuZGxlU2VwYXlDYWxsYmFjazonLCBlcnJvcik7XG4gICAgLy8gVuG6q24gdHLhuqMgduG7gSAyMDAgbuG6v3UgY2jGsGEgdHLhuqMgduG7gVxuICAgIGlmICghcmVzLmhlYWRlcnNTZW50KSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBjb2RlOiBcIjAwXCIsXG4gICAgICAgIG1lc3NhZ2U6IFwiU2VQYXkgd2ViaG9vayByZWNlaXZlZCB3aXRoIGVycm9yXCIsXG4gICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn07XG5cbi8vIFThuqFvIHRoYW5oIHRvw6FuIG3hu5tpXG5leHBvcnQgY29uc3QgY3JlYXRlUGF5bWVudCA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHsgdXNlcklkLCBhbW91bnQsIHRvdGFsQW1vdW50LCBwcm9kdWN0cywgcGF5bWVudE1ldGhvZCwgc2F2ZWRWb3VjaGVySWQsIGNvdXBvbkRpc2NvdW50LCBjb3Vwb25Db2RlIH0gPSByZXEuYm9keTtcblxuICAgIC8vIFZhbGlkYXRlIMSR4bqndSB2w6BvXG4gICAgaWYgKCFhbW91bnQgfHwgIXByb2R1Y3RzIHx8ICFwYXltZW50TWV0aG9kIHx8ICF1c2VySWQpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIlRoaeG6v3UgdGjDtG5nIHRpbiBj4bqnbiB0aGnhur90OiBhbW91bnQsIHByb2R1Y3RzLCBwYXltZW50TWV0aG9kLCB1c2VySWRcIlxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gVOG6oW8gcGF5bWVudFxuICAgIGNvbnN0IHBheW1lbnQgPSBuZXcgUGF5bWVudCh7XG4gICAgICB1c2VySWQsXG4gICAgICBhbW91bnQsXG4gICAgICB0b3RhbEFtb3VudDogdG90YWxBbW91bnQgfHwgYW1vdW50LFxuICAgICAgcHJvZHVjdHMsXG4gICAgICBwYXltZW50TWV0aG9kLFxuICAgICAgc2F2ZWRWb3VjaGVySWQsIC8vIEzGsHUgc2F2ZWRWb3VjaGVySWQgxJHhu4MgeMOzYSB2b3VjaGVyIHNhdSBraGkgdGhhbmggdG/DoW5cbiAgICAgIHN0YXR1czogXCJwZW5kaW5nXCJcbiAgICB9KTtcblxuICAgIC8vIE7hur91IGPDsyB0aMO0bmcgdGluIGNvdXBvbiwgbMawdSB2w6BvIHJlc3BvbnNlIG1lc3NhZ2VcbiAgICBpZiAoY291cG9uQ29kZSB8fCBjb3Vwb25EaXNjb3VudCkge1xuICAgICAgcGF5bWVudC5yZXNwb25zZU1lc3NhZ2UgPSBgw4FwIGThu6VuZyBtw6MgZ2nhuqNtIGdpw6E6ICR7Y291cG9uQ29kZX0sIGdp4bqjbTogJHtjb3Vwb25EaXNjb3VudH1gO1xuICAgIH1cblxuICAgIC8vIEzGsHUgcGF5bWVudFxuICAgIGNvbnN0IHNhdmVkUGF5bWVudCA9IGF3YWl0IHBheW1lbnQuc2F2ZSgpO1xuXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAxKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBkYXRhOiBzYXZlZFBheW1lbnQsXG4gICAgICBtZXNzYWdlOiBcIsSQw6MgdOG6oW8gdGjDtG5nIHRpbiB0aGFuaCB0b8OhblwiXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdGjhu4MgdOG6oW8gdGjDtG5nIHRpbiB0aGFuaCB0b8OhblwiLFxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcbiAgICB9KTtcbiAgfVxufTtcblxuLy8gTOG6pXkgdOG6pXQgY+G6oyB0aGFuaCB0b8OhblxuZXhwb3J0IGNvbnN0IGdldEFsbFBheW1lbnRzID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcGF5bWVudHMgPSBhd2FpdCBQYXltZW50LmZpbmQoKS5wb3B1bGF0ZShcInByb2R1Y3RzLnByb2R1Y3RJZFwiKTtcbiAgICByZXR1cm4gcmVzLmpzb24ocGF5bWVudHMpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IFxuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBcIkzhu5dpIGtoaSBs4bqleSBkYW5oIHPDoWNoIHRoYW5oIHRvw6FuXCIsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSBcbiAgICB9KTtcbiAgfVxufTtcblxuLy8gTOG6pXkgdGhhbmggdG/DoW4gdGhlbyBJRFxuZXhwb3J0IGNvbnN0IGdldFBheW1lbnRCeUlkID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcGF5bWVudCA9IGF3YWl0IFBheW1lbnQuZmluZEJ5SWQocmVxLnBhcmFtcy5pZCkucG9wdWxhdGUoXG4gICAgICBcInByb2R1Y3RzLnByb2R1Y3RJZFwiXG4gICAgKTtcbiAgICBcbiAgICBpZiAoIXBheW1lbnQpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgdGjDtG5nIHRpbiB0aGFuaCB0b8OhblwiIFxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiByZXMuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZGF0YTogcGF5bWVudFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IFxuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBcIkzhu5dpIGtoaSBs4bqleSB0aMO0bmcgdGluIHRoYW5oIHRvw6FuXCIsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxuICAgIH0pO1xuICB9XG59O1xuXG4vLyBD4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSB0aGFuaCB0b8OhblxuZXhwb3J0IGNvbnN0IHVwZGF0ZVBheW1lbnRTdGF0dXMgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IHN0YXR1cyB9ID0gcmVxLmJvZHk7XG4gICAgY29uc3QgcGF5bWVudCA9IGF3YWl0IFBheW1lbnQuZmluZEJ5SWRBbmRVcGRhdGUoXG4gICAgICByZXEucGFyYW1zLmlkLFxuICAgICAgeyBzdGF0dXMgfSxcbiAgICAgIHsgbmV3OiB0cnVlIH1cbiAgICApO1xuICAgIFxuICAgIGlmICghcGF5bWVudCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSB0aMO0bmcgdGluIHRoYW5oIHRvw6FuXCIgXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHJlcy5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBkYXRhOiBwYXltZW50XG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IFwiTOG7l2kga2hpIGPhuq1wIG5o4bqtdCB0cuG6oW5nIHRow6FpIHRoYW5oIHRvw6FuXCIsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSBcbiAgICB9KTtcbiAgfVxufTtcblxuLy8gQ+G6rXAgbmjhuq10IHRow7RuZyB0aW4gdGhhbmggdG/DoW5cbmV4cG9ydCBjb25zdCB1cGRhdGVQYXltZW50ID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcGF5bWVudElkID0gcmVxLnBhcmFtcy5pZDtcbiAgICBjb25zdCB1cGRhdGVEYXRhID0gcmVxLmJvZHk7XG4gICAgXG4gICAgLy8gQ2jhu4kgY2hvIHBow6lwIGPhuq1wIG5o4bqtdCBjw6FjIHRyxrDhu51uZyBhbiB0b8OgblxuICAgIGNvbnN0IGFsbG93ZWRGaWVsZHMgPSBbJ29yZGVySWQnLCAnc3RhdHVzJywgJ3RyYW5zYWN0aW9uSWQnXTtcbiAgICBjb25zdCBmaWx0ZXJlZERhdGEgPSB7fTtcbiAgICBcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyh1cGRhdGVEYXRhKSkge1xuICAgICAgaWYgKGFsbG93ZWRGaWVsZHMuaW5jbHVkZXMoa2V5KSkge1xuICAgICAgICBmaWx0ZXJlZERhdGFba2V5XSA9IHVwZGF0ZURhdGFba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgY29uc3QgcGF5bWVudCA9IGF3YWl0IFBheW1lbnQuZmluZEJ5SWRBbmRVcGRhdGUoXG4gICAgICBwYXltZW50SWQsXG4gICAgICB7ICRzZXQ6IGZpbHRlcmVkRGF0YSB9LFxuICAgICAgeyBuZXc6IHRydWUgfVxuICAgICk7XG4gICAgXG4gICAgaWYgKCFwYXltZW50KSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IHRow7RuZyB0aW4gdGhhbmggdG/DoW5cIiBcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gcmVzLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGRhdGE6IHBheW1lbnRcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCJM4buXaSBraGkgY+G6rXAgbmjhuq10IHRow7RuZyB0aW4gdGhhbmggdG/DoW5cIixcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlIFxuICAgIH0pO1xuICB9XG59O1xuXG4vLyBYw7NhIHRoYW5oIHRvw6FuXG5leHBvcnQgY29uc3QgZGVsZXRlUGF5bWVudCA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHBheW1lbnQgPSBhd2FpdCBQYXltZW50LmZpbmRCeUlkQW5kRGVsZXRlKHJlcS5wYXJhbXMuaWQpO1xuICAgIFxuICAgIGlmICghcGF5bWVudCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSB0aMO0bmcgdGluIHRoYW5oIHRvw6FuXCIgXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHJlcy5qc29uKHsgXG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogXCJYw7NhIHRoYW5oIHRvw6FuIHRow6BuaCBjw7RuZ1wiIFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IFxuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBcIkzhu5dpIGtoaSB4w7NhIHRoYW5oIHRvw6FuXCIsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxuICAgIH0pO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3QgY3JlYXRlVm5wYXlQYXltZW50VXJsID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBhbW91bnQsIHByb2R1Y3RzLCB1c2VySWQgfSA9IHJlcS5ib2R5O1xuXG4gICAgLy8gVmFsaWRhdGUgaW5wdXRcbiAgICBpZiAoXG4gICAgICAhYW1vdW50IHx8XG4gICAgICAhcHJvZHVjdHMgfHxcbiAgICAgICFBcnJheS5pc0FycmF5KHByb2R1Y3RzKSB8fFxuICAgICAgcHJvZHVjdHMubGVuZ3RoID09PSAwIHx8XG4gICAgICAhdXNlcklkXG4gICAgKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTpcbiAgICAgICAgICBcIkludmFsaWQgaW5wdXQ6IHJlcXVpcmVkIGZpZWxkcyBhcmUgYW1vdW50LCBwcm9kdWN0cyAobm9uLWVtcHR5IGFycmF5KSwgYW5kIHVzZXJJZFwiLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIHBheW1lbnQgcmVjb3JkIGZpcnN0XG4gICAgY29uc3QgcGF5bWVudCA9IG5ldyBQYXltZW50KHtcbiAgICAgIHVzZXJJZCxcbiAgICAgIHRvdGFsQW1vdW50OiBhbW91bnQsXG4gICAgICBwcm9kdWN0czogcHJvZHVjdHMubWFwKChwcm9kdWN0KSA9PiAoe1xuICAgICAgICBwcm9kdWN0SWQ6IHByb2R1Y3QucHJvZHVjdElkLFxuICAgICAgICBxdWFudGl0eTogcHJvZHVjdC5xdWFudGl0eSxcbiAgICAgICAgcHJpY2U6IHByb2R1Y3QucHJpY2UsXG4gICAgICB9KSksXG4gICAgICBwYXltZW50TWV0aG9kOiBcInNlcGF5XCIsIC8vIFVzaW5nIHNlcGF5IHNpbmNlIHZucGF5IGlzIG5vdCBpbiBlbnVtXG4gICAgICBzdGF0dXM6IFwicGVuZGluZ1wiLFxuICAgIH0pO1xuICAgIGF3YWl0IHBheW1lbnQuc2F2ZSgpO1xuXG4gICAgLy8gQ3JlYXRlIFZOUGF5IHBheW1lbnQgVVJMXG4gICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgY3JlYXRlRGF0ZSA9IG1vbWVudChkYXRlKS5mb3JtYXQoXCJZWVlZTU1EREhIbW1zc1wiKTtcbiAgICBjb25zdCBvcmRlcklkID0gbW9tZW50KGRhdGUpLmZvcm1hdChcIkRESEhtbXNzXCIpO1xuICAgIGNvbnN0IGlwQWRkciA9XG4gICAgICByZXEuaGVhZGVyc1tcIngtZm9yd2FyZGVkLWZvclwiXSB8fFxuICAgICAgcmVxLmNvbm5lY3Rpb24ucmVtb3RlQWRkcmVzcyB8fFxuICAgICAgcmVxLnNvY2tldC5yZW1vdGVBZGRyZXNzO1xuXG4gICAgY29uc3QgdG1uQ29kZSA9IHByb2Nlc3MuZW52LlZOUF9UTU5fQ09ERTtcbiAgICBjb25zdCBzZWNyZXRLZXkgPSBwcm9jZXNzLmVudi5WTlBfSEFTSF9TRUNSRVQ7XG4gICAgbGV0IHZucFVybCA9IHByb2Nlc3MuZW52LlZOUF9VUkw7XG5cbiAgICBjb25zdCB2bnBfUGFyYW1zID0ge1xuICAgICAgdm5wX1ZlcnNpb246IFwiMi4xLjBcIixcbiAgICAgIHZucF9Db21tYW5kOiBcInBheVwiLFxuICAgICAgdm5wX1RtbkNvZGU6IHRtbkNvZGUsXG4gICAgICB2bnBfTG9jYWxlOiBcInZuXCIsXG4gICAgICB2bnBfQ3VyckNvZGU6IFwiVk5EXCIsXG4gICAgICB2bnBfVHhuUmVmOiBvcmRlcklkLFxuICAgICAgdm5wX09yZGVySW5mbzogYFRoYW5oIHRvYW4gZG9uIGhhbmcgJHtvcmRlcklkfWAsXG4gICAgICB2bnBfT3JkZXJUeXBlOiBcIm90aGVyXCIsXG4gICAgICB2bnBfQW1vdW50OiBhbW91bnQgKiAxMDAsXG4gICAgICB2bnBfUmV0dXJuVXJsOiBwcm9jZXNzLmVudi5WTlBfUkVUVVJOX1VSTCxcbiAgICAgIHZucF9JcEFkZHI6IGlwQWRkcixcbiAgICAgIHZucF9DcmVhdGVEYXRlOiBjcmVhdGVEYXRlLFxuICAgICAgdm5wX0V4cGlyZURhdGU6IG1vbWVudChkYXRlKS5hZGQoMTUsIFwibWludXRlc1wiKS5mb3JtYXQoXCJZWVlZTU1EREhIbW1zc1wiKSxcbiAgICB9O1xuXG4gICAgY29uc3Qgc2lnbkRhdGEgPSBxdWVyeXN0cmluZy5zdHJpbmdpZnkodm5wX1BhcmFtcywgeyBlbmNvZGU6IGZhbHNlIH0pO1xuICAgIGNvbnN0IGhtYWMgPSBjcnlwdG8uY3JlYXRlSG1hYyhcInNoYTUxMlwiLCBzZWNyZXRLZXkpO1xuICAgIGNvbnN0IHNpZ25lZCA9IGhtYWMudXBkYXRlKEJ1ZmZlci5mcm9tKHNpZ25EYXRhLCBcInV0Zi04XCIpKS5kaWdlc3QoXCJoZXhcIik7XG4gICAgdm5wX1BhcmFtc1tcInZucF9TZWN1cmVIYXNoXCJdID0gc2lnbmVkO1xuICAgIHZucFVybCArPSBcIj9cIiArIHF1ZXJ5c3RyaW5nLnN0cmluZ2lmeSh2bnBfUGFyYW1zLCB7IGVuY29kZTogZmFsc2UgfSk7XG5cbiAgICAvLyBSZXR1cm4gYm90aCBwYXltZW50IHJlY29yZCBhbmQgVk5QYXkgVVJMXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIHBheW1lbnQsXG4gICAgICAgIHZucGF5VXJsOiB2bnBVcmwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IFwiRXJyb3IgY3JlYXRpbmcgVk5QYXkgcGF5bWVudCBVUkxcIixcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxuICAgIH0pO1xuICB9XG59O1xuXG4vLyBU4bqhbyBRUiBDb2RlIHRoYW5oIHRvw6FuIG5nw6JuIGjDoG5nXG5leHBvcnQgY29uc3QgY3JlYXRlQmFua1FSQ29kZSA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHsgYWNjb3VudE51bWJlciwgYmFua0NvZGUsIGFtb3VudCwgZGVzY3JpcHRpb24sIG9yZGVySWQgfSA9IHJlcS5ib2R5O1xuXG4gICAgLy8gVmFsaWRhdGUgaW5wdXRcbiAgICBpZiAoIWFjY291bnROdW1iZXIgfHwgIWJhbmtDb2RlKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJUaGnhur91IHRow7RuZyB0aW4gdMOgaSBraG/huqNuIGhv4bq3YyBtw6MgbmfDom4gaMOgbmdcIixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFThuqFvIG7hu5lpIGR1bmcgbeG6t2MgxJHhu4tuaCBjaG8gxJHGoW4gaMOgbmcgbuG6v3Uga2jDtG5nIGPDsyBkZXNjcmlwdGlvblxuICAgIGNvbnN0IHRyYW5zZmVyRGVzY3JpcHRpb24gPVxuICAgICAgZGVzY3JpcHRpb24gfHxcbiAgICAgIChvcmRlcklkID8gYFRoYW5oIHRvYW4gZG9uIGhhbmcgJHtvcmRlcklkfWAgOiBcIlRoYW5oIHRvYW4gRE5DIEZvb2RcIik7XG5cbiAgICAvLyBU4bqhbyBRUiBDb2RlIFVSTFxuICAgIGNvbnN0IHFyQ29kZVVybCA9IFBheW1lbnRTZXJ2aWNlLmdlbmVyYXRlQmFua1FSQ29kZShcbiAgICAgIGFjY291bnROdW1iZXIsXG4gICAgICBiYW5rQ29kZSxcbiAgICAgIGFtb3VudCxcbiAgICAgIHRyYW5zZmVyRGVzY3JpcHRpb25cbiAgICApO1xuXG4gICAgaWYgKCFxckNvZGVVcmwpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0aOG7gyB04bqhbyBRUiBDb2RlIHRoYW5oIHRvw6FuIG5nw6JuIGjDoG5nXCIsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBU4bqhbyBRUiBjb2RlIGThuqFuZyBEYXRhVVJMIG7hur91IGNsaWVudCB5w6p1IGPhuqd1XG4gICAgbGV0IHFyQ29kZURhdGFVcmwgPSBudWxsO1xuICAgIGlmIChyZXEuYm9keS5nZW5lcmF0ZURhdGFVcmwpIHtcbiAgICAgIHFyQ29kZURhdGFVcmwgPSBhd2FpdCBQYXltZW50U2VydmljZS5nZW5lcmF0ZVFSQ29kZShxckNvZGVVcmwpO1xuICAgIH1cblxuICAgIC8vIFRy4bqjIHbhu4EgdGjDtG5nIHRpbiBRUiBDb2RlXG4gICAgcmV0dXJuIHJlcy5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIHFyQ29kZVVybCxcbiAgICAgICAgcXJDb2RlRGF0YVVybCxcbiAgICAgICAgYWNjb3VudEluZm86IHtcbiAgICAgICAgICBhY2NvdW50TnVtYmVyLFxuICAgICAgICAgIGJhbmtDb2RlLFxuICAgICAgICAgIGFtb3VudDogYW1vdW50IHx8IDAsXG4gICAgICAgICAgZGVzY3JpcHRpb246IHRyYW5zZmVyRGVzY3JpcHRpb24sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IFwiTOG7l2kga2hpIHThuqFvIFFSIENvZGUgdGhhbmggdG/DoW4gbmfDom4gaMOgbmdcIixcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxuICAgIH0pO1xuICB9XG59O1xuXG4vLyBHZXQgcGF5bWVudCBzdGF0dXNcbmV4cG9ydCBjb25zdCBnZXRQYXltZW50U3RhdHVzID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBvcmRlcklkIH0gPSByZXEucGFyYW1zO1xuXG4gICAgLy8gRmluZCBwYXltZW50IGJ5IG9yZGVySWRcbiAgICBjb25zdCBwYXltZW50ID0gYXdhaXQgUGF5bWVudC5maW5kT25lKHsgb3JkZXJJZCB9KTtcbiAgICBpZiAoIXBheW1lbnQpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSB0aMO0bmcgdGluIHRoYW5oIHRvw6FuXCJcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIHBheW1lbnQgaXMgY29tcGxldGVkXG4gICAgY29uc3Qgb3JkZXIgPSBhd2FpdCBPcmRlci5maW5kT25lKHsgb3JkZXJJZCB9KTtcbiAgICBpZiAob3JkZXIgJiYgb3JkZXIucGF5bWVudFN0YXR1cyA9PT0gXCJjb21wbGV0ZWRcIikge1xuICAgICAgcmV0dXJuIHJlcy5qc29uKHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgc3RhdHVzOiBcImNvbXBsZXRlZFwiLFxuICAgICAgICBtZXNzYWdlOiBcIlRoYW5oIHRvw6FuIMSRw6MgaG/DoG4gdOG6pXRcIlxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcy5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBzdGF0dXM6IFwicGVuZGluZ1wiLFxuICAgICAgbWVzc2FnZTogXCLEkGFuZyBjaOG7nSB0aGFuaCB0b8OhblwiXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCJM4buXaSBraGkga2nhu4NtIHRyYSB0cuG6oW5nIHRow6FpIHRoYW5oIHRvw6FuXCIsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxuICAgIH0pO1xuICB9XG59O1xuXG4vLyBY4butIGzDvSB3ZWJob29rIHThu6sgU2VQYXkgdsOgIG5nw6JuIGjDoG5nXG5leHBvcnQgY29uc3QgaGFuZGxlQmFua1dlYmhvb2sgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgY29uc29sZS5sb2coYFske3RpbWVzdGFtcH1dIFJlY2VpdmVkIHdlYmhvb2sgZGF0YTpgLCBKU09OLnN0cmluZ2lmeShyZXEuYm9keSkpO1xuICAgIFxuICAgIC8vIEx1w7RuIHRy4bqjIHbhu4EgMjAwIE9LIHRyxrDhu5tjLCBzYXUgxJHDsyB44butIGzDvSB3ZWJob29rIGLhuqV0IMSR4buTbmcgYuG7mVxuICAgIC8vIMSQaeG7gXUgbsOgeSBuZ8SDbiBuZ+G7q2Egd2ViaG9vayB0aW1lb3V0IHbDoCBo4buHIHRo4buRbmcgbmfDom4gaMOgbmcgZ+G7rWkgbOG6oWkgd2ViaG9vayBuaGnhu4F1IGzhuqduXG4gICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgY29kZTogXCIwMFwiLFxuICAgICAgbWVzc2FnZTogXCJXZWJob29rIHJlY2VpdmVkIHN1Y2Nlc3NmdWxseVwiLFxuICAgICAgdGltZXN0YW1wXG4gICAgfTtcbiAgICBcbiAgICAvLyBUcuG6oyB24buBIG5nYXkgxJHhu4MgdHLDoW5oIHRpbWVvdXRcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbihyZXNwb25zZSk7XG4gICAgXG4gICAgLy8gVGnhur9wIHThu6VjIHjhu60gbMO9IHdlYmhvb2sgYuG6pXQgxJHhu5NuZyBi4buZXG4gICAgcHJvY2Vzc1dlYmhvb2socmVxLmJvZHksIHJlcS5oZWFkZXJzKS5jYXRjaChlcnIgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHByb2Nlc3Npbmcgd2ViaG9vazpcIiwgZXJyKTtcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiRmF0YWwgZXJyb3IgaGFuZGxpbmcgd2ViaG9vazpcIiwgZXJyb3IpO1xuICAgIC8vIE7hur91IGNoxrBhIHRy4bqjIHbhu4EsIHRy4bqjIHbhu4EgMjAwIE9LXG4gICAgaWYgKCFyZXMuaGVhZGVyc1NlbnQpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIGNvZGU6IFwiMDBcIixcbiAgICAgICAgbWVzc2FnZTogXCJXZWJob29rIHJlY2VpdmVkIHdpdGggZXJyb3JcIixcbiAgICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufTtcblxuLy8gSMOgbSB44butIGzDvSB3ZWJob29rIGLhuqV0IMSR4buTbmcgYuG7mVxuYXN5bmMgZnVuY3Rpb24gcHJvY2Vzc1dlYmhvb2sod2ViaG9va0RhdGEsIGhlYWRlcnMpIHtcbiAgdHJ5IHtcbiAgICAvLyBQaMOibiB0w61jaCBk4buvIGxp4buHdSB3ZWJob29rXG4gICAgICBjb25zdCB7IFxuICAgICAgICAvLyBGaWVsZHMgdOG7qyBTZVBheVxuICAgICAgICB0cmFuc2FjdGlvbl9pZCxcbiAgICAgICAgb3JkZXJfaWQsXG4gICAgICAgIGFtb3VudCxcbiAgICAgICAgc3RhdHVzLFxuICAgICAgICBpZCxcbiAgICAgICAgXG4gICAgICAgIC8vIEZpZWxkcyB04burIE1CQmFua1xuICAgICAgICBnYXRld2F5LFxuICAgICAgICB0cmFuc2FjdGlvbkRhdGUsXG4gICAgICAgIGFjY291bnROdW1iZXIsXG4gICAgICAgIGNvbnRlbnQsXG4gICAgICAgIHRyYW5zZmVyQW1vdW50LFxuICAgICAgICByZWZlcmVuY2VDb2RlXG4gICAgfSA9IHdlYmhvb2tEYXRhO1xuXG4gICAgICAvLyBHaGkgbG9nIGThu68gbGnhu4d1IHdlYmhvb2tcbiAgICBQYXltZW50U2VydmljZS5sb2dXZWJob29rKHdlYmhvb2tEYXRhKTtcblxuICAgICAgLy8gWOG7rSBsw70gdGhlbyBsb+G6oWkgd2ViaG9va1xuICAgIGxldCBvcmRlcklkID0gb3JkZXJfaWQgfHwgd2ViaG9va0RhdGEub3JkZXJJZCB8fCBudWxsO1xuICAgICAgbGV0IHRyYW5zYWN0aW9uSWQgPSB0cmFuc2FjdGlvbl9pZCB8fCBpZCB8fCByZWZlcmVuY2VDb2RlIHx8IG51bGw7XG4gICAgICBsZXQgcGF5bWVudEFtb3VudCA9IGFtb3VudCB8fCB0cmFuc2ZlckFtb3VudCB8fCBudWxsO1xuICAgICAgXG4gICAgICAvLyBUw6xtIG3DoyDEkcahbiBow6BuZyB04burIG7hu5lpIGR1bmcgY2h1eeG7g24ga2hv4bqjbiBu4bq/dSBsw6AgTUJCYW5rXG4gICAgICBpZiAoZ2F0ZXdheSA9PT0gJ01CQmFuaycgJiYgY29udGVudCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIlBhcnNpbmcgTUJCYW5rIGNvbnRlbnQgZm9yIG9yZGVyIElEOlwiLCBjb250ZW50KTtcbiAgICAgIFxuICAgICAgLy8gVMOsbSBjaHXhu5dpIDI0IGvDvSB04buxIGhleCAtIG3DoyDEkcahbiBow6BuZyBNb25nb0RCXG4gICAgICBjb25zdCBoZXhJZFBhdHRlcm4gPSAvW2EtZjAtOV17MjR9L2k7XG4gICAgICBjb25zdCBoZXhNYXRjaCA9IGNvbnRlbnQubWF0Y2goaGV4SWRQYXR0ZXJuKTtcbiAgICAgIFxuICAgICAgaWYgKGhleE1hdGNoKSB7XG4gICAgICAgIG9yZGVySWQgPSBoZXhNYXRjaFswXTtcbiAgICAgICAgY29uc29sZS5sb2coXCJFeHRyYWN0ZWQgTW9uZ29EQiBJRCBmcm9tIGNvbnRlbnQ6XCIsIG9yZGVySWQpO1xuICAgICAgfSBcbiAgICAgIC8vIE7hur91IGtow7RuZyB0w6xtIMSRxrDhu6NjIG3DoyBoZXgsIHRo4butIHTDrG0gdGhlbyBjw6FjIGZvcm1hdCBraMOhY1xuICAgICAgZWxzZSB7XG4gICAgICAgIGxldCBvcmRlcklkTWF0Y2ggPSBudWxsO1xuICAgICAgICBjb25zdCBwYXR0ZXJucyA9IFtcbiAgICAgICAgICAvVFQgREhcXHMrKFthLXpBLVowLTldKykvaSxcbiAgICAgICAgICAvZG9uIGhhbmdcXHMrKFthLXpBLVowLTldKykvaSxcbiAgICAgICAgICAvREhcXHMrKFthLXpBLVowLTldKykvaVxuICAgICAgICBdO1xuICAgICAgICBcbiAgICAgICAgLy8gVGjhu60gdOG7q25nIHBhdHRlcm5cbiAgICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHBhdHRlcm5zKSB7XG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSBjb250ZW50Lm1hdGNoKHBhdHRlcm4pO1xuICAgICAgICAgIGlmIChtYXRjaCAmJiBtYXRjaFsxXSkge1xuICAgICAgICAgICAgb3JkZXJJZE1hdGNoID0gbWF0Y2g7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChvcmRlcklkTWF0Y2ggJiYgb3JkZXJJZE1hdGNoWzFdKSB7XG4gICAgICAgICAgLy8gWOG7rSBsw70gbcOjIMSRxqFuIGjDoG5nIHTDrG0gxJHGsOG7o2NcbiAgICAgICAgICBsZXQgZXh0cmFjdGVkSWQgPSBvcmRlcklkTWF0Y2hbMV07XG4gICAgICAgICAgY29uc3QgY2xlYW5IZXhNYXRjaCA9IGV4dHJhY3RlZElkLm1hdGNoKC9eKFthLWYwLTldezI0fSkvaSk7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKGNsZWFuSGV4TWF0Y2gpIHtcbiAgICAgICAgICAgIG9yZGVySWQgPSBjbGVhbkhleE1hdGNoWzFdO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvcmRlcklkID0gZXh0cmFjdGVkSWQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiRXh0cmFjdGVkIG9yZGVyIElEIGZyb20gTUJCYW5rIGNvbnRlbnQ6XCIsIG9yZGVySWQpO1xuICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgIC8vIE7hur91IGtow7RuZyB0w6xtIMSRxrDhu6NjIG9yZGVySWQsIGThu6tuZyB44butIGzDvVxuICAgICAgaWYgKCFvcmRlcklkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiQ291bGQgbm90IGZpbmQgb3JkZXIgSUQgaW4gd2ViaG9vayBkYXRhXCIpO1xuICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZyhgUHJvY2Vzc2luZyB3ZWJob29rIGZvciBvcmRlciBJRDogJHtvcmRlcklkfSwgdHJhbnNhY3Rpb246ICR7dHJhbnNhY3Rpb25JZH1gKTtcblxuICAgIC8vIFTDrG0gxJHGoW4gaMOgbmdcbiAgICAgICAgY29uc3Qgb3JkZXIgPSBhd2FpdCBPcmRlci5maW5kT25lKHtcbiAgICAgICAgICAkb3I6IFtcbiAgICAgICAgICAgIHsgX2lkOiBvcmRlcklkIH0sXG4gICAgICAgICAgICB7IG9yZGVySWQ6IG9yZGVySWQgfVxuICAgICAgICAgIF1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBpZiAoIW9yZGVyKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYE9yZGVyIG5vdCBmb3VuZCB3aXRoIElEOiAke29yZGVySWR9YCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gWMOhYyDEkeG7i25oIHRy4bqhbmcgdGjDoWkgdGhhbmggdG/DoW4gdGjDoG5oIGPDtG5nXG4gICAgICAgIGNvbnN0IGlzU3VjY2Vzc2Z1bCA9IFxuICAgICAgICAgIHN0YXR1cyA9PT0gJ3N1Y2Nlc3MnIHx8IFxuICAgICAgICAgIHN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcgfHwgXG4gICAgICAgICAgc3RhdHVzID09PSAnMCcgfHwgXG4gICAgICAgICAgc3RhdHVzID09PSAwIHx8IFxuICAgICAgICAgIChnYXRld2F5ID09PSAnTUJCYW5rJyAmJiB0cmFuc2ZlckFtb3VudCA+IDApO1xuICAgICAgICAgIFxuICAgICAgICBpZiAoaXNTdWNjZXNzZnVsKSB7XG4gICAgICAvLyBD4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZ1xuICAgICAgICAgIGlmIChvcmRlci5zdGF0dXMgIT09ICdjb21wbGV0ZWQnKSB7XG4gICAgICAgICAgICBvcmRlci5wYXltZW50U3RhdHVzID0gJ2NvbXBsZXRlZCc7XG4gICAgICAgICAgICBvcmRlci5zdGF0dXMgPSAncHJvY2Vzc2luZyc7XG4gICAgICAgICAgICBvcmRlci5pc1BhaWQgPSB0cnVlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBMb2cgY2hpIHRp4bq/dCDEkeG7gyB0cm91Ymxlc2hvb3RcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBD4bqtcCBuaOG6rXQgxJHGoW4gaMOgbmcgJHtvcmRlci5faWR9IHRow6BuaCBpc1BhaWQ9dHJ1ZSwgcGF5bWVudFN0YXR1cz1jb21wbGV0ZWQsIHN0YXR1cz1wcm9jZXNzaW5nYCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEzGsHUgZ2lhbyBk4buLY2ggdsOgbyDEkcahbiBow6BuZ1xuICAgICAgICAgICAgaWYgKCFvcmRlci50cmFuc2FjdGlvbklkICYmIHRyYW5zYWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgb3JkZXIudHJhbnNhY3Rpb25JZCA9IHRyYW5zYWN0aW9uSWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGF3YWl0IG9yZGVyLnNhdmUoKTtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYFVwZGF0ZWQgb3JkZXIgJHtvcmRlci5faWR9IHN0YXR1cyB0byAnY29tcGxldGVkJywgaXNQYWlkPXRydWVgKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKG9yZGVyU2F2ZUVycm9yKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBzYXZpbmcgb3JkZXI6XCIsIG9yZGVyU2F2ZUVycm9yKTtcbiAgICAgICAgICAgICAgLy8gVGjhu60gY+G6rXAgbmjhuq10IGzhuqFpIGNo4buJIGPDoWMgdHLGsOG7nW5nIGPhuqduIHRoaeG6v3RcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBPcmRlci51cGRhdGVPbmUoXG4gICAgICAgICAgICAgICAgICB7IF9pZDogb3JkZXIuX2lkIH0sXG4gICAgICAgICAgICAgICAgICB7IFxuICAgICAgICAgICAgICAgICAgICAkc2V0OiB7IFxuICAgICAgICAgICAgICAgICAgICAgIHBheW1lbnRTdGF0dXM6ICdjb21wbGV0ZWQnLFxuICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogJ3Byb2Nlc3NpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgIGlzUGFpZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbklkOiB0cmFuc2FjdGlvbklkIHx8IG9yZGVyLnRyYW5zYWN0aW9uSWRcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFVwZGF0ZWQgb3JkZXIgJHtvcmRlci5faWR9IHdpdGggdXBkYXRlT25lYCk7XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKHVwZGF0ZUVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHVwZGF0aW5nIG9yZGVyOlwiLCB1cGRhdGVFcnJvcik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYE9yZGVyICR7b3JkZXIuX2lkfSBhbHJlYWR5IG1hcmtlZCBhcyBjb21wbGV0ZWRgKTtcbiAgICAgICAgICB9XG5cbiAgICAgIC8vIFTDrG0gaG/hurdjIHThuqFvIHBheW1lbnQgcmVjb3JkXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBwYXltZW50ID0gYXdhaXQgUGF5bWVudC5maW5kT25lKHsgXG4gICAgICAgICAgICAgICRvcjogW1xuICAgICAgICAgICAgICAgIHsgb3JkZXJJZDogb3JkZXIuX2lkIH0sXG4gICAgICAgICAgICAgICAgeyBvcmRlcklkOiBvcmRlcklkIH1cbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChwYXltZW50KSB7XG4gICAgICAgICAgLy8gQ+G6rXAgbmjhuq10IHBheW1lbnQgcmVjb3JkIG7hur91IHThu5NuIHThuqFpXG4gICAgICAgICAgICAgIGlmIChwYXltZW50LnN0YXR1cyAhPT0gJ2NvbXBsZXRlZCcpIHtcbiAgICAgICAgICAgICAgICBwYXltZW50LnN0YXR1cyA9ICdjb21wbGV0ZWQnO1xuICAgICAgICAgICAgICAgIHBheW1lbnQudHJhbnNhY3Rpb25JZCA9IHRyYW5zYWN0aW9uSWQgfHwgYHdlYmhvb2tfJHtEYXRlLm5vdygpfWA7XG4gICAgICAgICAgICAgICAgcGF5bWVudC5hbW91bnQgPSBwYXltZW50QW1vdW50IHx8IHBheW1lbnQuYW1vdW50O1xuICAgICAgICAgICAgICAgIHBheW1lbnQucGFpZEF0ID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBYw7NhIHZvdWNoZXIgxJHDoyBsxrB1IHNhdSBraGkgdGhhbmggdG/DoW4gdGjDoG5oIGPDtG5nIChu4bq/dSBjw7MpXG4gICAgICAgICAgICAgICAgaWYgKHBheW1lbnQuc2F2ZWRWb3VjaGVySWQpIHtcbiAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IFNhdmVkVm91Y2hlci5maW5kQnlJZEFuZERlbGV0ZShwYXltZW50LnNhdmVkVm91Y2hlcklkKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYMSQw6MgeMOzYSB2b3VjaGVyIMSRw6MgbMawdSAke3BheW1lbnQuc2F2ZWRWb3VjaGVySWR9IHNhdSBraGkgdGhhbmggdG/DoW4gdGjDoG5oIGPDtG5nICh3ZWJob29rKWApO1xuICAgICAgICAgICAgICAgICAgfSBjYXRjaCAodm91Y2hlckVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGRlbGV0aW5nIHNhdmVkIHZvdWNoZXIgZnJvbSB3ZWJob29rOicsIHZvdWNoZXJFcnJvcik7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGF3YWl0IHBheW1lbnQuc2F2ZSgpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBVcGRhdGVkIHBheW1lbnQgJHtwYXltZW50Ll9pZH0gc3RhdHVzIHRvICdjb21wbGV0ZWQnYCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFBheW1lbnQgJHtwYXltZW50Ll9pZH0gYWxyZWFkeSBtYXJrZWQgYXMgY29tcGxldGVkYCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gVOG6oW8gcGF5bWVudCByZWNvcmQgbeG7m2lcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gxJDhuqNtIGLhuqNvIGPDsyDEkeG7pyB0aMO0bmcgdGluXG4gICAgICAgICAgICBjb25zdCB1c2VySWQgPSBvcmRlci51c2VySWQgfHwgb3JkZXIudXNlcjtcbiAgICAgICAgICAgIGNvbnN0IGFtb3VudCA9IHBheW1lbnRBbW91bnQgfHwgb3JkZXIudG90YWxBbW91bnQ7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICghdXNlcklkKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkNhbm5vdCBjcmVhdGUgcGF5bWVudCByZWNvcmQ6IG1pc3NpbmcgdXNlcklkXCIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghYW1vdW50KSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkNhbm5vdCBjcmVhdGUgcGF5bWVudCByZWNvcmQ6IG1pc3NpbmcgYW1vdW50XCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdQYXltZW50ID0gbmV3IFBheW1lbnQoe1xuICAgICAgICAgICAgICAgICAgb3JkZXJJZDogb3JkZXIuX2lkLFxuICAgICAgICAgICAgICAgIHVzZXJJZDogdXNlcklkLFxuICAgICAgICAgICAgICAgIHRvdGFsQW1vdW50OiBhbW91bnQsXG4gICAgICAgICAgICAgICAgYW1vdW50OiBhbW91bnQsXG4gICAgICAgICAgICAgICAgICBwYXltZW50TWV0aG9kOiBnYXRld2F5ID09PSAnTUJCYW5rJyA/ICdiYW5rX3RyYW5zZmVyJyA6ICdzZXBheScsXG4gICAgICAgICAgICAgICAgICBzdGF0dXM6ICdjb21wbGV0ZWQnLFxuICAgICAgICAgICAgICAgICAgdHJhbnNhY3Rpb25JZDogdHJhbnNhY3Rpb25JZCB8fCBgd2ViaG9va18ke0RhdGUubm93KCl9YCxcbiAgICAgICAgICAgICAgICAgIHBhaWRBdDogbmV3IERhdGUoKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGF3YWl0IG5ld1BheW1lbnQuc2F2ZSgpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBDcmVhdGVkIG5ldyBwYXltZW50IHJlY29yZCBmb3Igb3JkZXIgJHtvcmRlci5faWR9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKHBheW1lbnRDcmVhdGVFcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNyZWF0aW5nIHBheW1lbnQgcmVjb3JkOlwiLCBwYXltZW50Q3JlYXRlRXJyb3IpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAocGF5bWVudEVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgdXBkYXRpbmcgcGF5bWVudDpcIiwgcGF5bWVudEVycm9yKTtcbiAgICAgICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKGBXZWJob29rIHByb2Nlc3NpbmcgZm9yIG9yZGVyICR7b3JkZXJJZH0gY29tcGxldGVkIHN1Y2Nlc3NmdWxseWApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBXZWJob29rIHJlY2VpdmVkIHdpdGggbm9uLXN1Y2Nlc3Mgc3RhdHVzOiAke3N0YXR1c31gKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIHByb2Nlc3Npbmcgd2ViaG9vazpcIiwgZXJyb3IpO1xuICB9XG59XG5cbi8vIEtp4buDbSB0cmEgdHLhuqFuZyB0aMOhaSB0aGFuaCB0b8OhbiBxdWEgU2VQYXlcbmV4cG9ydCBjb25zdCBjaGVja1BheW1lbnRTdGF0dXMgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IG9yZGVySWQgfSA9IHJlcS5wYXJhbXM7XG5cbiAgICAvLyBDYWNoZS1idXN0aW5nOiDEkOG6o20gYuG6o28gbHXDtG4gbOG6pXkgZOG7ryBsaeG7h3UgbeG7m2kgbmjhuqV0IHThu6sgREJcbiAgICBjb25zdCBjYWNoZUtleSA9IHJlcS5xdWVyeS5fIHx8IERhdGUubm93KCk7XG4gICAgY29uc29sZS5sb2coYENoZWNraW5nIHBheW1lbnQgc3RhdHVzIGZvciBvcmRlcklkOiAke29yZGVySWR9LCBjYWNoZSBrZXk6ICR7Y2FjaGVLZXl9YCk7XG5cbiAgICBpZiAoIW9yZGVySWQpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIk1pc3Npbmcgb3JkZXJJZCBwYXJhbWV0ZXJcIlxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gS2nhu4NtIHRyYSDEkcahbiBow6BuZyB0cm9uZyBkYXRhYmFzZVxuICAgIGNvbnNvbGUubG9nKFwiUXVlcnlpbmcgb3JkZXIgc3RhdHVzIGZyb20gZGF0YWJhc2VcIik7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAvLyBUw6xtIMSRxqFuIGjDoG5nXG4gICAgY29uc3Qgb3JkZXIgPSBhd2FpdCBPcmRlci5maW5kT25lKHtcbiAgICAgICRvcjogW1xuICAgICAgICB7IF9pZDogb3JkZXJJZCB9LFxuICAgICAgICB7IG9yZGVySWQ6IG9yZGVySWQgfVxuICAgICAgXVxuICAgIH0pO1xuXG4gICAgaWYgKCFvcmRlcikge1xuICAgICAgICBjb25zb2xlLmxvZyhgT3JkZXIgbm90IGZvdW5kIHdpdGggSUQ6ICR7b3JkZXJJZH1gKTtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIk9yZGVyIG5vdCBmb3VuZFwiXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKFwiRm91bmQgb3JkZXI6XCIsIEpTT04uc3RyaW5naWZ5KG9yZGVyKSk7XG4gICAgICBcbiAgICAgIC8vIEtp4buDbSB0cmEgbmhp4buBdSB0csaw4budbmcgaMahbiDEkeG7gyB4w6FjIMSR4buLbmggdHLhuqFuZyB0aMOhaSB0aGFuaCB0b8OhblxuICAgICAgY29uc3QgaXNQYWlkID0gXG4gICAgICAgIG9yZGVyLnBheW1lbnRTdGF0dXMgPT09ICdjb21wbGV0ZWQnIHx8IFxuICAgICAgICBvcmRlci5pc1BhaWQgPT09IHRydWUgfHwgXG4gICAgICAgIG9yZGVyLnN0YXR1cyA9PT0gJ3Byb2Nlc3NpbmcnIHx8XG4gICAgICAgIG9yZGVyLnN0YXR1cyA9PT0gJ3NoaXBwZWQnIHx8XG4gICAgICAgIG9yZGVyLnN0YXR1cyA9PT0gJ2RlbGl2ZXJlZCc7XG4gICAgICBcbiAgICAgIGNvbnNvbGUubG9nKGBPcmRlciBJRDogJHtvcmRlci5faWR9LCBQYXltZW50IFN0YXR1czogJHtvcmRlci5wYXltZW50U3RhdHVzfSwgaXNQYWlkOiAke2lzUGFpZH0sIFN0YXR1czogJHtvcmRlci5zdGF0dXN9YCk7XG4gICAgICBcbiAgICAgIC8vIEtp4buDbSB0cmEgdHLhuqFuZyB0aMOhaSB0aGFuaCB0b8OhbiBk4buxYSB0csOqbiBk4buvIGxp4buHdSB0aOG7sWMgdOG6v1xuICAgICAgaWYgKGlzUGFpZCkge1xuICAgICAgICAvLyDEkOG6o20gYuG6o28gY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgbuG6v3UgY2jGsGEgxJHhu5NuZyBi4buZXG4gICAgICAgIGlmIChvcmRlci5wYXltZW50U3RhdHVzICE9PSAnY29tcGxldGVkJyB8fCBvcmRlci5pc1BhaWQgIT09IHRydWUpIHtcbiAgICAgICAgICBvcmRlci5wYXltZW50U3RhdHVzID0gJ2NvbXBsZXRlZCc7XG4gICAgICAgICAgb3JkZXIuaXNQYWlkID0gdHJ1ZTtcbiAgICAgICAgICBhd2FpdCBvcmRlci5zYXZlKCk7XG4gICAgICAgICAgY29uc29sZS5sb2coYFVwZGF0ZWQgb3JkZXIgcGF5bWVudCBzdGF0dXMgZm9yICR7b3JkZXIuX2lkfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBzdGF0dXM6IFwiY29tcGxldGVkXCIsXG4gICAgICAgICAgbWVzc2FnZTogXCJUaGFuaCB0b8OhbiDEkcOjIMSRxrDhu6NjIHjDoWMgbmjhuq1uIHRow6BuaCBjw7RuZ1wiLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgb3JkZXJJZDogb3JkZXIuX2lkLFxuICAgICAgICAgIHRvdGFsQW1vdW50OiBvcmRlci50b3RhbEFtb3VudCxcbiAgICAgICAgICAgIHBheW1lbnRNZXRob2Q6IG9yZGVyLnBheW1lbnRNZXRob2QsXG4gICAgICAgICAgICBpc1BhaWQ6IHRydWUsXG4gICAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KClcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgICAvLyBLaeG7g20gdHJhIG7hur91IGPDsyBwYXltZW50IHJlY29yZCDEkcOjIGhvw6BuIHRow6BuaFxuICAgICAgY29uc3QgcGF5bWVudCA9IGF3YWl0IFBheW1lbnQuZmluZE9uZSh7IFxuICAgICAgICAkb3I6IFtcbiAgICAgICAgICB7IG9yZGVySWQ6IG9yZGVyLl9pZCB9LFxuICAgICAgICAgIHsgb3JkZXJJZDogb3JkZXJJZCB9XG4gICAgICAgIF0sXG4gICAgICAgIHN0YXR1czogJ2NvbXBsZXRlZCdcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBpZiAocGF5bWVudCkge1xuICAgICAgICAvLyBD4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZyBu4bq/dSBjaMawYSBj4bqtcCBuaOG6rXRcbiAgICAgICAgb3JkZXIucGF5bWVudFN0YXR1cyA9ICdjb21wbGV0ZWQnO1xuICAgICAgICBvcmRlci5zdGF0dXMgPSAncHJvY2Vzc2luZyc7XG4gICAgICAgIG9yZGVyLmlzUGFpZCA9IHRydWU7XG4gICAgICAgIGF3YWl0IG9yZGVyLnNhdmUoKTtcbiAgICAgICAgY29uc29sZS5sb2coYFVwZGF0ZWQgb3JkZXIgJHtvcmRlci5faWR9IHBheW1lbnQgc3RhdHVzIHRvIGNvbXBsZXRlZGApO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBzdGF0dXM6IFwiY29tcGxldGVkXCIsXG4gICAgICAgICAgbWVzc2FnZTogXCJUaGFuaCB0b8OhbiDEkcOjIMSRxrDhu6NjIHjDoWMgbmjhuq1uIHRow6BuaCBjw7RuZ1wiLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgb3JkZXJJZDogb3JkZXIuX2lkLFxuICAgICAgICAgICAgdG90YWxBbW91bnQ6IG9yZGVyLnRvdGFsQW1vdW50LFxuICAgICAgICAgICAgcGF5bWVudE1ldGhvZDogcGF5bWVudC5wYXltZW50TWV0aG9kLFxuICAgICAgICAgICAgaXNQYWlkOiB0cnVlLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgICAgLy8gVHLGsOG7nW5nIGjhu6NwIGNoxrBhIHRoYW5oIHRvw6FuXG4gICAgICAgICAgcmV0dXJuIHJlcy5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIHN0YXR1czogXCJwZW5kaW5nXCIsXG4gICAgICBtZXNzYWdlOiBcIsSQYW5nIGNo4budIHRoYW5oIHRvw6FuXCIsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIG9yZGVySWQ6IG9yZGVyLl9pZCxcbiAgICAgICAgICB0b3RhbEFtb3VudDogb3JkZXIudG90YWxBbW91bnQsXG4gICAgICAgICAgaXNQYWlkOiBmYWxzZSxcbiAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KClcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBcbiAgICB9IGNhdGNoIChkYkVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgaW4gZGF0YWJhc2UgcXVlcnk6XCIsIGRiRXJyb3IpO1xuICAgICAgXG4gICAgICAvLyBUcuG6oyB24buBIGzhu5dpIGPhu6UgdGjhu4NcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIkzhu5dpIHRydXkgduG6pW4gY8ahIHPhu58gZOG7ryBsaeG7h3VcIixcbiAgICAgICAgZXJyb3I6IGRiRXJyb3IubWVzc2FnZSxcbiAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpXG4gICAgICB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNoZWNraW5nIHBheW1lbnQgc3RhdHVzOlwiLCBlcnJvcik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCJFcnJvciBjaGVja2luZyBwYXltZW50IHN0YXR1c1wiLFxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXG4gICAgICB0aW1lc3RhbXA6IERhdGUubm93KCkgXG4gICAgfSk7XG4gIH1cbn07XG5cbi8vIEjDoG0ga2nhu4NtIHRyYSBjaHV54buDbiBraG/huqNuIG5nw6JuIGjDoG5nIHRy4buxYyB0aeG6v3Bcbi8vIFRyb25nIHRo4buxYyB04bq/LCBi4bqhbiBz4bq9IHTDrWNoIGjhu6NwIHbhu5tpIEFQSSBuZ8OibiBow6BuZyBob+G6t2MgZOG7i2NoIHbhu6Ugd2ViaG9va1xuYXN5bmMgZnVuY3Rpb24gY2hlY2tEaXJlY3RCYW5rVHJhbnNmZXJzKG9yZGVySWQpIHtcbiAgdHJ5IHtcbiAgICAvLyDEkMOieSBsw6AgaMOgbSBtw7QgcGjhu49uZywgdHJvbmcgdGjhu7FjIHThur8gYuG6oW4gc+G6vSBr4bq/dCBu4buRaSB24bubaSBBUEkgbmfDom4gaMOgbmdcbiAgICAvLyBob+G6t2Mga2nhu4NtIHRyYSBkYXRhYmFzZSBnaGkgbmjhuq1uIHdlYmhvb2sgdOG7qyBuZ8OibiBow6BuZ1xuICAgIFxuICAgIC8vIEdp4bqjIGzhuq1wIHTDrG0ga2nhur9tIGdpYW8gZOG7i2NoIHRoZW8gbcOjIMSRxqFuIGjDoG5nIHRyb25nIG7hu5lpIGR1bmcgY2h1eeG7g24ga2hv4bqjblxuICAgIC8vIFRyb25nIOG7qW5nIGThu6VuZyB0aOG7sWMsIGLhuqFuIHPhur0gdHJ1eSB24bqlbiBkYXRhYmFzZSBob+G6t2MgZ+G7jWkgQVBJIG5nw6JuIGjDoG5nXG4gICAgXG4gICAgY29uc29sZS5sb2coXCJDaGVja2luZyBiYW5rIHRyYW5zZmVyIGZvciBvcmRlcklkOlwiLCBvcmRlcklkKTtcbiAgICBcbiAgICAvLyBDaG8gbeG7pWMgxJHDrWNoIGRlbW8sIGtp4buDbSB0cmEgY8OhYyBJRCBnaWFvIGThu4tjaCDEkcOjIGJp4bq/dFxuICAgIC8vIEtp4buDbSB0cmEgbcOjIMSRxqFuIGjDoG5nIGNo4bupYSBcIjY3ZmViODJcIiBob+G6t2MgY8OhYyBtw6MgZ2lhbyBk4buLY2ggU2VQYXkgaGnhu4duIGPDs1xuICAgIGlmIChcbiAgICAgIChvcmRlcklkICYmIG9yZGVySWQuaW5jbHVkZXMoXCI2N2ZlYjgyXCIpKSB8fCBcbiAgICAgIG9yZGVySWQgPT09IFwiMTE3OTE1NlwiIHx8IFxuICAgICAgb3JkZXJJZCA9PT0gXCIxMTc5MDk3XCJcbiAgICApIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiRm91bmQgbWF0Y2hpbmcgYmFuayB0cmFuc2ZlciBmb3Igb3JkZXJJZDpcIiwgb3JkZXJJZCk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICB0cmFuc2FjdGlvbjoge1xuICAgICAgICAgIGlkOiBgYmFua18ke0RhdGUubm93KCl9YCxcbiAgICAgICAgICB0aW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGFtb3VudDogNTMwMCxcbiAgICAgICAgICBzdGF0dXM6IFwic3VjY2Vzc1wiXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIGNvbnNvbGUubG9nKFwiTm8gYmFuayB0cmFuc2ZlciBmb3VuZCBmb3Igb3JkZXJJZDpcIiwgb3JkZXJJZCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCJObyBiYW5rIHRyYW5zZmVyIGZvdW5kXCJcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBjaGVja2luZyBiYW5rIHRyYW5zZmVyczpcIiwgZXJyb3IpO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlXG4gICAgfTtcbiAgfVxufVxuXG5jb25zdCBpc09yZGVyUGFpZCA9IChvcmRlcikgPT4ge1xuICByZXR1cm4gKFxuICAgIG9yZGVyLmlzUGFpZCA9PT0gdHJ1ZSB8fCBcbiAgICBvcmRlci5wYXltZW50U3RhdHVzID09PSAnY29tcGxldGVkJyB8fFxuICAgIG9yZGVyLnN0YXR1cyA9PT0gJ3Byb2Nlc3NpbmcnIHx8XG4gICAgb3JkZXIuc3RhdHVzID09PSAnc2hpcHBlZCcgfHxcbiAgICBvcmRlci5zdGF0dXMgPT09ICdkZWxpdmVyZWQnIHx8XG4gICAgb3JkZXIuc3RhdHVzID09PSAnY29tcGxldGVkJ1xuICApO1xufTtcbiJdLCJtYXBwaW5ncyI6Ijs7QUFFQSxJQUFBQSxRQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxLQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxNQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxlQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxPQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSyxHQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTSxNQUFBLEdBQUFQLHNCQUFBLENB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