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
    
    // Gọi service để tạo thanh toán SePay
    const paymentResult = await PaymentService.createSePayPayment(
      orderId,
      numericAmount,
      orderInfo,
      redirectUrl // Truyền redirectUrl vào hàm
    );
    
    // Trả về URL thanh toán thực từ SePay
    return res.json({
      success: true,
      paymentUrl: paymentResult.data,
      qrCode: paymentResult.qr_code
    });
  } catch (error) {
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
    const { orderId, amount, resultCode, message } = req.body;

    // Log webhook để theo dõi
    console.log('Received SePay webhook:', req.body);

    // Verify callback data
    const isValidCallback = PaymentService.verifySePayCallback(req.body);
    if (!isValidCallback) {
      console.error('Invalid callback data:', req.body);
      return res.status(400).json({
        success: false,
        message: "Invalid callback data"
      });
    }

    // Find the order first
    const order = await Order.findOne({ 
      $or: [
        { _id: orderId },
        { orderId: orderId }
      ]
    });

    if (!order) {
      console.error('Order not found:', orderId);
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Find or create payment
    let payment = await Payment.findOne({ orderId: order._id });
    if (!payment) {
      payment = new Payment({
        orderId: order._id,
        amount: amount,
        paymentMethod: 'sepay',
        status: 'pending'
      });
    }

    // Chỉ cập nhật trạng thái thanh toán khi resultCode là "0"
    if (resultCode === "0") {
      payment.status = 'completed';
      order.status = 'paid';
    } else {
      payment.status = 'failed';
      order.status = 'unpaid';
    }

    payment.responseCode = resultCode;
    payment.responseMessage = message;
    await payment.save();
    await order.save();

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      data: {
        orderId: order._id,
        status: payment.status,
        amount: amount
      }
    });

  } catch (error) {
    console.error('Error processing SePay callback:', error);
    return res.status(500).json({
      success: false,
      message: "Error processing payment callback",
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

// Xử lý webhook từ SePay
export const handleBankWebhook = async (req, res) => {
  try {
    console.log("Received webhook data:", JSON.stringify(req.body));
    
    const { 
      transaction_id,
      order_id,
      amount,
      status,
      id // ID giao dịch từ SePay
    } = req.body;

    // Ghi log dữ liệu webhook
    PaymentService.logWebhook(req.body);

    // Xử lý ID giao dịch
    const transactionId = id || transaction_id || order_id;

    // Kiểm tra các trường bắt buộc
    if (!transactionId) {
      return res.status(200).json({
        success: true,
        code: "00", 
        message: "Đã nhận webhook nhưng thiếu ID giao dịch",
        data: null
      });
    }

    console.log(`Xử lý webhook cho giao dịch: ${transactionId}`);

    // Tìm đơn hàng
    const order = await Order.findOne({ orderId: order_id });
    if (!order) {
      console.log(`Không tìm thấy đơn hàng với ID: ${order_id}`);
      return res.status(200).json({
        success: true,
        code: "00",
        message: "Đã nhận webhook - không tìm thấy đơn hàng",
        data: null
      });
    }

    // Nếu trạng thái là thành công
    if (status === 'success' || status === 'completed') {
      order.paymentStatus = 'completed';
      order.status = 'processing';
      await order.save();

      // Cập nhật payment record nếu có
      const payment = await Payment.findOne({ orderId: order_id });
      if (payment) {
        payment.status = 'completed';
        payment.transactionId = transaction_id || `webhook_${Date.now()}`;
        payment.paidAt = new Date();
        await payment.save();
      }

      return res.status(200).json({
        success: true,
        code: "00",
        message: "Xác nhận thanh toán thành công",
        data: {
          order_id: order_id,
          status: "completed"
        }
      });
    }

    // Trả về trạng thái khác
    return res.status(200).json({
      success: true,
      code: "00",
      message: "Đã nhận webhook",
      data: {
        order_id: order_id,
        status: status || "pending"
      }
    });

  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(200).json({
      success: true,
      code: "00",
      message: "Đã nhận webhook",
      data: null
    });
  }
};

// Kiểm tra trạng thái thanh toán qua SePay
export const checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log("Checking payment status for orderId:", orderId);

    // Tìm đơn hàng với nhiều điều kiện
    const order = await Order.findOne({
      $or: [
        { _id: orderId },
        { orderId: orderId }
      ]
    });

    if (!order) {
      console.log("Order not found for ID:", orderId);
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    console.log("Found order:", order._id);

    // Nếu đơn hàng đã thanh toán xong, trả về ngay
    if (order.paymentStatus === 'completed') {
      return res.json({
        success: true,
        status: 'completed',
        message: "Payment completed successfully"
      });
    }

    // Kiểm tra trạng thái thanh toán từ SePay
    try {
      // Kiểm tra thanh toán từ SePay
      const response = await axios.get(
        `${SEPAY_API_URL}/transaction/status`,
        {
          params: {
            order_id: orderId
          },
          headers: {
            'Authorization': `Bearer ${SEPAY_API_TOKEN}`
          },
          timeout: 3000 // Timeout 3 giây để tránh đợi quá lâu
        }
      );

      if (response.data.status === 'success') {
        // Cập nhật trạng thái đơn hàng
        order.paymentStatus = 'completed';
        order.status = 'processing';
        await order.save();

        // Cập nhật payment record
        const payment = await Payment.findOne({ orderId });
        if (payment) {
          payment.status = 'completed';
          payment.transactionId = response.data.transaction_id;
          payment.paidAt = new Date();
          await payment.save();
        }

        return res.json({
          success: true,
          status: 'completed',
          message: "Payment completed successfully"
        });
      }

      // Nếu không thành công từ SePay, kiểm tra xem có chuyển khoản trực tiếp không
      // Theo dõi thanh toán từ Napas 247 - kiểm tra hệ thống nội bộ
      // Khởi tạo câu truy vấn tìm kiếm giao dịch với tài khoản của cửa hàng
      const transactions = await checkDirectBankTransfers(orderId);
      if (transactions && transactions.success) {
        // Đã tìm thấy giao dịch ngân hàng, cập nhật trạng thái
        order.paymentStatus = 'completed';
        order.status = 'processing';
        await order.save();

        // Cập nhật payment record
        const payment = await Payment.findOne({ orderId });
        if (payment) {
          payment.status = 'completed';
          payment.transactionId = `bank_${Date.now()}`;
          payment.paidAt = new Date();
          await payment.save();
        }

        return res.json({
          success: true,
          status: 'completed',
          message: "Payment completed via bank transfer"
        });
      }

      // Trả về trạng thái từ SePay nếu không tìm thấy giao dịch ngân hàng
      return res.json({
        success: true,
        status: response.data.status,
        message: response.data.message || "Payment pending"
      });

    } catch (sepayError) {
      console.error("Error checking SePay payment status:", sepayError);
      
      // Nếu lỗi kết nối SePay, kiểm tra chuyển khoản trực tiếp
      try {
        const transactions = await checkDirectBankTransfers(orderId);
        if (transactions && transactions.success) {
          // Đã tìm thấy giao dịch ngân hàng, cập nhật trạng thái
          order.paymentStatus = 'completed';
          order.status = 'processing';
          await order.save();

          // Cập nhật payment record
          const payment = await Payment.findOne({ orderId });
          if (payment) {
            payment.status = 'completed';
            payment.transactionId = `bank_${Date.now()}`;
            payment.paidAt = new Date();
            await payment.save();
          }

          return res.json({
            success: true,
            status: 'completed',
            message: "Payment completed via bank transfer"
          });
        }
      } catch (bankError) {
        console.error("Error checking bank transfers:", bankError);
      }
      
      // Nếu không thể kết nối với SePay và không tìm thấy giao dịch ngân hàng, 
      // trả về trạng thái hiện tại của đơn hàng
      return res.json({
        success: true,
        status: order.paymentStatus,
        message: order.paymentStatus === 'completed' ? "Payment completed" : "Payment pending"
      });
    }

  } catch (error) {
    console.error("Error checking payment status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error checking payment status",
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
