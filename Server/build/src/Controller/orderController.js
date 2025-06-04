"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.updateOrderPaymentStatus = exports.updateOrder = exports.orderUpdate = exports.orderGetById = exports.orderGetAll = exports.orderGet = exports.orderDelete = exports.orderCreate = exports.notifyOrderSuccess = exports.markOrderAsPaid = exports.getTopOrders = exports.getOrdersByBranch = exports.getOrderTracking = exports.getOrderStats = exports.getDeliveryStats = exports.createOrder = exports.cancelOrder = void 0;
var _Order = _interopRequireDefault(require("../Model/Order.js"));
var _Products = _interopRequireDefault(require("../Model/Products.js"));
var _axios = _interopRequireDefault(require("axios"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _emailService = require("../utils/emailService.js");
var _BestSellingProduct = _interopRequireDefault(require("../Model/BestSellingProduct.js"));
var _notificationService = require("../Services/notificationService.js");
var _Branch = _interopRequireDefault(require("../Model/Branch.js"));
var _branchService = require("../Services/branchService.js");
var _mongoose = _interopRequireDefault(require("mongoose")); /* eslint-disable no-undef */

_dotenv.default.config();

// Hàm tạo mã vận đơn ngẫu nhiên
function generateOrderCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Hàm cập nhật số lượng tồn kho sản phẩm
async function updateProductStock(products, increase = false, updateSoldCount = false) {
  try {
    for (const item of products) {
      const product = await _Products.default.findById(item.productId);
      if (product) {
        // Tăng hoặc giảm số lượng tồn kho dựa vào tham số increase
        const newStock = increase ?
        product.productStock + item.quantity :
        product.productStock - item.quantity;

        // Cập nhật số lượng tồn kho và trạng thái sản phẩm
        product.productStock = Math.max(0, newStock);

        // Cập nhật trạng thái nếu hết hàng
        if (product.productStock === 0) {
          product.productStatus = "Hết hàng";
        } else if (product.productStatus === "Hết hàng") {
          product.productStatus = "Còn hàng";
        }

        // Cập nhật số lượng bán ra nếu cần
        if (updateSoldCount && !increase) {
          product.soldCount = (product.soldCount || 0) + item.quantity;
        } else if (updateSoldCount && increase) {
          // Trừ soldCount khi hủy đơn hàng đã thanh toán
          product.soldCount = Math.max(0, (product.soldCount || 0) - item.quantity);
        }

        await product.save();
      }
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin sản phẩm:", error);
    throw error;
  }
}

const orderCreate = async (req, res) => {
  try {
    // Validate required fields
    // eslint-disable-next-line no-unused-vars
    const { userId, products, totalAmount, paymentMethod, coupon } = req.body;
    if (!userId || !products || !Array.isArray(products) || products.length === 0 || !totalAmount) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, products (non-empty array), totalAmount"
      });
    }

    // Kiểm tra số lượng tồn kho trước khi tạo đơn hàng
    for (const item of products) {
      const product = await _Products.default.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: `Sản phẩm với ID ${item.productId} không tồn tại`
        });
      }

      if (product.productStock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Sản phẩm "${product.productName}" chỉ còn ${product.productStock} sản phẩm trong kho`
        });
      }
    }

    // Create the order with all fields from request body
    const order = new _Order.default(req.body);

    // Set default values if not provided
    if (!order.status) {
      order.status = paymentMethod === "cod" ? "pending" : "awaiting_payment";
    }
    if (!order.createdAt) {
      order.createdAt = new Date();
    }

    // Tạo mã vận đơn ngẫu nhiên
    if (!order.orderCode) {
      order.orderCode = generateOrderCode();
    }

    // Save the order
    await order.save();

    // Đối với các phương thức thanh toán trực tuyến (không phải COD), giảm số lượng sản phẩm ngay
    if (paymentMethod !== "cod") {
      // Giảm số lượng tồn kho, nhưng chưa cập nhật soldCount
      await updateProductStock(products, false, false);
    }

    // Lấy đơn hàng với thông tin đầy đủ bao gồm thông tin sản phẩm để gửi email
    const populatedOrder = await _Order.default.findById(order._id).
    populate('userId').
    populate('products.productId');

    // Gửi email xác nhận nếu đơn hàng đã được tạo thành công
    if (populatedOrder && populatedOrder.userId && populatedOrder.userId.email) {
      try {
        // Chuẩn bị thông tin giao hàng cho email
        const shippingInfo = {
          fullName: `${populatedOrder.userId.firstName || ''} ${populatedOrder.userId.lastName || ''}`.trim(),
          address: populatedOrder.address || populatedOrder.userId.address || '',
          phone: populatedOrder.userId.phone || '',
          email: populatedOrder.userId.email || ''
        };

        // Thêm thông tin giao hàng vào đơn hàng để gửi email
        populatedOrder.shippingInfo = shippingInfo;

        console.log("Sending confirmation email to:", populatedOrder.userId.email);
        const emailSent = await (0, _emailService.sendOrderConfirmationEmail)(populatedOrder);
        console.log("Email sent status:", emailSent ? "Success" : "Failed");
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
        // Không throw error nếu gửi email thất bại để không ảnh hưởng đến luồng đặt hàng
      }
    } else {
      console.log("Missing email information for order confirmation:", {
        hasOrder: !!populatedOrder,
        hasUserId: !!(populatedOrder && populatedOrder.userId),
        hasEmail: !!(populatedOrder && populatedOrder.userId && populatedOrder.userId.email),
        email: populatedOrder && populatedOrder.userId && populatedOrder.userId.email ? populatedOrder.userId.email : undefined
      });
    }

    return res.status(201).json(order);
  } catch (err) {
    console.error("Error creating order:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Lỗi khi tạo đơn hàng"
    });
  }
};exports.orderCreate = orderCreate;

const orderGet = async (req, res) => {
  try {
    const userId = req.query.userId || (req.user && req.user._id ? req.user._id : undefined);

    // Sử dụng userId nếu có, nếu không trả về tất cả đơn hàng
    const query = userId ? { userId } : {};

    const orders = await _Order.default.find(query).
    populate('userId').
    populate('products.productId').
    sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};exports.orderGet = orderGet;

const orderGetAll = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, searchTerm, status, paymentMethod, isPaid, date, branchId } = req.query;

    console.log("orderGetAll được gọi với các tham số:");
    console.log("Query params:", req.query);

    // Xây dựng query dựa trên các tham số
    const query = {};
    console.log("Query ban đầu:", JSON.stringify(query));

    // Thêm điều kiện lọc theo chi nhánh nếu có
    if (branchId) {
      query.branchId = branchId;
      console.log("Thêm điều kiện branchId:", branchId);
    }

    // Thêm điều kiện tìm kiếm nếu có
    if (searchTerm) {
      // Tìm kiếm theo mã đơn hàng, thông tin người dùng và thông tin giao hàng
      query.$or = [
      { orderCode: { $regex: searchTerm, $options: 'i' } },
      { notes: { $regex: searchTerm, $options: 'i' } }];


      // Tìm kiếm theo thông tin người dùng (cần populate trước)
      const usersWithSearchTerm = await _mongoose.default.model('User').find({
        $or: [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }]

      }).select('_id');

      if (usersWithSearchTerm.length > 0) {
        const userIds = usersWithSearchTerm.map((user) => user._id);
        query.$or.push({ userId: { $in: userIds } });
      }

      // Tìm kiếm trong thông tin giao hàng
      query.$or.push({ 'shippingInfo.address': { $regex: searchTerm, $options: 'i' } });
      query.$or.push({ 'shippingInfo.phone': { $regex: searchTerm, $options: 'i' } });
    }

    // Thêm điều kiện lọc theo trạng thái
    if (status) {
      query.status = status;
      console.log("Thêm điều kiện status:", status);
    }

    // Thêm điều kiện lọc theo phương thức thanh toán
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
      console.log("Thêm điều kiện paymentMethod:", paymentMethod);
    }

    // Thêm điều kiện lọc theo trạng thái thanh toán
    if (isPaid !== undefined) {
      query.isPaid = isPaid === 'true';
      console.log("Thêm điều kiện isPaid:", isPaid);
    }

    // Thêm điều kiện lọc theo ngày
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: startDate, $lte: endDate };
      console.log("Thêm điều kiện date:", date);
    }

    console.log("Query cuối cùng:", JSON.stringify(query));

    // Tính toán phân trang
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // Đếm tổng số đơn hàng thỏa mãn điều kiện
    const totalCount = await _Order.default.countDocuments(query);
    console.log("Tổng số đơn hàng tìm thấy:", totalCount);

    // Lấy danh sách đơn hàng theo điều kiện và phân trang
    const orders = await _Order.default.find(query).
    populate("userId").
    populate('products.productId').
    populate('branchId').
    sort({ createdAt: -1 }).
    skip(skip).
    limit(limit);

    console.log("Số đơn hàng trả về:", orders.length);

    // Lấy thống kê đơn hàng theo trạng thái
    const stats = {
      total: totalCount,
      pending: await _Order.default.countDocuments({ ...query, status: 'pending' }),
      confirmed: await _Order.default.countDocuments({ ...query, status: 'confirmed' }),
      preparing: await _Order.default.countDocuments({ ...query, status: 'preparing' }),
      packaging: await _Order.default.countDocuments({ ...query, status: 'packaging' }),
      shipping: await _Order.default.countDocuments({ ...query, status: 'shipping' }),
      delivering: await _Order.default.countDocuments({ ...query, status: 'delivering' }),
      completed: await _Order.default.countDocuments({ ...query, status: 'completed' }),
      cancelled: await _Order.default.countDocuments({ ...query, status: 'cancelled' }),
      delivery_failed: await _Order.default.countDocuments({ ...query, status: 'delivery_failed' }),
      awaiting_payment: await _Order.default.countDocuments({ ...query, status: 'awaiting_payment' })
    };

    res.status(200).json({
      orders,
      totalCount,
      stats
    });
  } catch (err) {
    console.error("Lỗi khi lấy tất cả đơn hàng:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};exports.orderGetAll = orderGetAll;

const orderGetById = async (req, res) => {
  try {
    const order = await _Order.default.findById(req.params.id).
    populate("userId").
    populate('products.productId');

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Hàm cập nhật thông tin đơn hàng
exports.orderGetById = orderGetById;const updateOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const updateData = req.body;

    console.log("updateOrder được gọi với dữ liệu:", JSON.stringify(updateData));

    // Tìm và cập nhật đơn hàng
    const order = await _Order.default.findById(orderId).
    populate("userId", "firstName lastName userName email phone address").
    populate("products.productId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng"
      });
    }

    // Lưu trạng thái cũ trước khi cập nhật
    const previousStatus = order.status;
    const newStatus = updateData.status;

    // Lọc các trường được phép cập nhật
    const allowedFields = ['status', 'orderCode', 'shippingInfo', 'notes'];
    const filteredData = {};

    for (const key of Object.keys(updateData)) {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    }

    // Nếu không có orderCode nhưng cần thêm, tạo một mã vận đơn mới
    if (!order.orderCode && !filteredData.orderCode) {
      filteredData.orderCode = generateOrderCode();
    }

    // THÊM MỚI: Xử lý cập nhật tracking_logs khi có thay đổi trạng thái
    if (newStatus && newStatus !== previousStatus) {
      // Khởi tạo tracking object nếu chưa có
      if (!order.tracking) {
        order.tracking = { status_name: "", tracking_logs: [] };
      }

      // Lấy tên hiển thị cho trạng thái
      let statusName = "";
      switch (newStatus) {
        case 'pending':statusName = "Chờ xử lý";break;
        case 'confirmed':statusName = "Đã xác nhận";break;
        case 'processing':statusName = "Đang xử lý";break;
        case 'preparing':statusName = "Đang chuẩn bị hàng";break;
        case 'packaging':statusName = "Hoàn tất đóng gói";break;
        case 'shipping':statusName = "Đang vận chuyển";break;
        case 'shipped':statusName = "Đã giao cho vận chuyển";break;
        case 'delivering':statusName = "Đang giao hàng";break;
        case 'delivered':statusName = "Đã giao hàng";break;
        case 'completed':statusName = "Hoàn thành";break;
        case 'cancelled':statusName = "Đã hủy";break;
        case 'awaiting_payment':statusName = "Chờ thanh toán";break;
        case 'refunded':statusName = "Đã hoàn tiền";break;
        case 'failed':statusName = "Thất bại";break;
        case 'delivery_failed':statusName = "Giao hàng thất bại";break;
        default:statusName = newStatus;
      }

      // Thêm bản ghi mới vào đầu mảng tracking_logs
      const newTrackingLog = {
        status: newStatus,
        status_name: statusName,
        timestamp: new Date().toISOString(),
        location: "Cửa hàng DNC FOOD"
      };

      // Khởi tạo mảng tracking_logs nếu chưa có
      if (!order.tracking.tracking_logs) {
        order.tracking.tracking_logs = [];
      }

      // Thêm log mới vào đầu mảng (để log mới nhất nằm đầu tiên)
      order.tracking.tracking_logs.unshift(newTrackingLog);

      // Cập nhật status_name chính
      order.tracking.status_name = statusName;

      // Lưu tracking vào filteredData để cập nhật
      filteredData.tracking = order.tracking;
    }

    // Nếu đang cập nhật trạng thái thành 'completed', tự động đánh dấu đã thanh toán
    if (newStatus === 'completed') {
      filteredData.isPaid = true;
      filteredData.completedAt = new Date();

      // Nếu đơn hàng là COD và chưa cập nhật kho thì giảm số lượng và tăng soldCount
      if (order.paymentMethod === "cod" && !order.isPaid) {
        await updateProductStock(order.products, false, true);

        // Cập nhật thông tin sản phẩm bán chạy
        try {
          // Tải thông tin chi tiết sản phẩm
          const populatedOrder = await _Order.default.findById(orderId).populate("products.productId");

          // Cập nhật từng sản phẩm trong đơn hàng
          for (const item of populatedOrder.products) {
            if (item.productId) {
              await _BestSellingProduct.default.updateSalesData(
                item.productId._id,
                item.productId,
                item.quantity,
                orderId
              );
            }
          }
        } catch (bestSellerError) {
          console.error("Lỗi khi cập nhật sản phẩm bán chạy:", bestSellerError);
          // Không trả về lỗi, vẫn tiếp tục xử lý
        }
      }
      // Nếu thanh toán online và status khác awaiting_payment thì cập nhật soldCount
      else if (order.paymentMethod !== "cod" && order.status !== "awaiting_payment") {
        // Chỉ cập nhật soldCount mà không trừ kho (đã trừ lúc tạo đơn)
        for (const item of order.products) {
          const product = await _Products.default.findById(item.productId);
          if (product) {
            product.soldCount = (product.soldCount || 0) + item.quantity;
            await product.save();
          }
        }

        // Cập nhật thông tin sản phẩm bán chạy
        try {
          // Tải thông tin chi tiết sản phẩm
          const populatedOrder = await _Order.default.findById(orderId).populate("products.productId");

          // Cập nhật từng sản phẩm trong đơn hàng
          for (const item of populatedOrder.products) {
            if (item.productId) {
              await _BestSellingProduct.default.updateSalesData(
                item.productId._id,
                item.productId,
                item.quantity,
                orderId
              );
            }
          }
        } catch (bestSellerError) {
          console.error("Lỗi khi cập nhật sản phẩm bán chạy:", bestSellerError);
          // Không trả về lỗi, vẫn tiếp tục xử lý
        }
      }
    }

    // Nếu đang cập nhật trạng thái thành 'cancelled', kiểm tra xem có thể hủy không
    if (newStatus === 'cancelled') {
      // Ngăn chặn việc hủy đơn hàng đã giao hoặc đang giao
      if (previousStatus === 'completed' || previousStatus === 'delivering') {
        return res.status(400).json({
          success: false,
          message: previousStatus === "delivering" ?
          "Không thể hủy đơn hàng đang giao" :
          "Không thể hủy đơn hàng đã giao"
        });
      }

      // Khi hủy đơn hàng thanh toán online, cần trả lại số lượng tồn kho
      if (order.paymentMethod !== "cod") {
        await updateProductStock(order.products, true, false);
      }
    }

    // Cập nhật đơn hàng
    const updatedOrder = await _Order.default.findByIdAndUpdate(
      orderId,
      { $set: filteredData },
      { new: true }
    ).populate("userId").populate("products.productId");

    // GỬI EMAIL THÔNG BÁO KHI CHUYỂN TRẠNG THÁI SANG "DELIVERING"
    if (newStatus === 'delivering' && previousStatus !== 'delivering') {
      try {
        console.log("Đang chuẩn bị gửi email thông báo giao hàng...");
        console.log("Thông tin đơn hàng để gửi email:", {
          orderCode: order.orderCode,
          email: order.userId && order.userId.email ? order.userId.email : undefined,
          address: order.userId && order.userId.address ? order.userId.address : undefined,
          phone: order.userId && order.userId.phone ? order.userId.phone : undefined,
          userName: order.userId && order.userId.userName ? order.userId.userName : undefined,
          firstName: order.userId && order.userId.firstName ? order.userId.firstName : undefined,
          lastName: order.userId && order.userId.lastName ? order.userId.lastName : undefined
        });

        // Đảm bảo order.userId đã được populate đầy đủ
        if (order.userId && typeof order.userId === 'object') {
          // Gửi email thông báo đơn hàng đang được giao
          const emailSent = await (0, _emailService.sendOrderShippingEmail)(order);

          if (emailSent) {
            console.log(`Đã gửi email thông báo giao hàng cho đơn hàng #${order.orderCode || order._id}`);
          } else {
            console.log(`Không thể gửi email thông báo giao hàng cho đơn hàng #${order.orderCode || order._id}`);
            console.log("Chi tiết đơn hàng:", JSON.stringify({
              id: order._id,
              orderCode: order.orderCode,
              userId: {
                email: order.userId && order.userId.email ? order.userId.email : undefined,
                firstName: order.userId && order.userId.firstName ? order.userId.firstName : undefined,
                lastName: order.userId && order.userId.lastName ? order.userId.lastName : undefined,
                address: order.userId && order.userId.address ? order.userId.address : undefined,
                phone: order.userId && order.userId.phone ? order.userId.phone : undefined
              }
            }, null, 2));
          }
        } else {
          console.log("Không thể gửi email: order.userId không được populate đầy đủ");
        }
      } catch (emailError) {
        console.error('Lỗi khi gửi email thông báo giao hàng:', emailError);
        console.error('Stack trace:', emailError.stack);
        // Không trả về lỗi cho client, chỉ log lỗi
      }
    }

    // Gửi email thông báo khi trạng thái đơn hàng thay đổi (nếu có email)
    else if (newStatus && newStatus !== previousStatus && updatedOrder.shippingInfo && updatedOrder.shippingInfo.email) {
      try {
        await (0, _emailService.sendOrderConfirmationEmail)(updatedOrder);
        console.log(`Đã gửi email cập nhật trạng thái đơn hàng ${updatedOrder.orderCode} đến ${updatedOrder.shippingInfo.email}`);
      } catch (emailError) {
        console.error('Lỗi khi gửi email cập nhật trạng thái đơn hàng:', emailError);
      }
    }

    // Gửi thông báo khi cập nhật trạng thái đơn hàng
    if (newStatus && newStatus !== previousStatus && updatedOrder.userId) {
      try {
        await (0, _notificationService.sendOrderStatusNotification)(updatedOrder.userId, updatedOrder, getStatusText(updatedOrder.status));
        // console.log(`Đã gửi thông báo cập nhật trạng thái đơn hàng ${updatedOrder.orderCode} đến user ${updatedOrder.userId}`);
      } catch (notificationError) {
        console.error('Lỗi khi gửi thông báo cập nhật trạng thái đơn hàng:', notificationError);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật đơn hàng thành công",
      data: updatedOrder
    });
  } catch (error) {
    console.error("Error in updateOrder:", error);
    console.error(error.stack);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật đơn hàng",
      error: error.message
    });
  }
};exports.updateOrder = updateOrder;

const orderUpdate = async (req, res) => {
  try {
    const { status } = req.body;

    console.log("orderUpdate called with status:", status);
    console.log("Request body:", JSON.stringify(req.body));

    // Trước tiên lấy thông tin đơn hàng hiện tại để theo dõi thay đổi trạng thái
    // Đảm bảo populate đầy đủ thông tin để gửi email
    const currentOrder = await _Order.default.findById(req.params.id).
    populate("userId", "firstName lastName userName email phone address").
    populate("products.productId");

    if (!currentOrder) {
      console.log("Không tìm thấy đơn hàng với ID:", req.params.id);
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }

    console.log("Thông tin đơn hàng trước khi cập nhật:", {
      id: currentOrder._id,
      status: currentOrder.status,
      email: currentOrder.userId && currentOrder.userId.email ? currentOrder.userId.email : undefined,
      orderCode: currentOrder.orderCode
    });

    // Lưu trạng thái cũ trước khi cập nhật
    const previousStatus = currentOrder.status;

    // Cập nhật trạng thái đơn hàng
    currentOrder.status = status;
    await currentOrder.save();

    // Gửi email thông báo khi đơn hàng chuyển sang trạng thái "đang giao đến khách"
    if (status === 'delivering' && previousStatus !== 'delivering') {
      try {
        console.log("Đang chuẩn bị gửi email thông báo giao hàng...");
        console.log("Đơn hàng có userId với email:", currentOrder.userId && currentOrder.userId.email ? currentOrder.userId.email : undefined);

        // Gửi email thông báo đơn hàng đang được giao
        const emailSent = await (0, _emailService.sendOrderShippingEmail)(currentOrder);

        if (emailSent) {
          console.log(`Đã gửi email thông báo giao hàng cho đơn hàng #${currentOrder.orderCode || currentOrder._id}`);
        } else {
          console.log(`Không thể gửi email thông báo giao hàng cho đơn hàng #${currentOrder.orderCode || currentOrder._id}`);
          console.log("Chi tiết đơn hàng:", JSON.stringify({
            id: currentOrder._id,
            orderCode: currentOrder.orderCode,
            userId: {
              email: currentOrder.userId && currentOrder.userId.email ? currentOrder.userId.email : undefined,
              firstName: currentOrder.userId && currentOrder.userId.firstName ? currentOrder.userId.firstName : undefined,
              lastName: currentOrder.userId && currentOrder.userId.lastName ? currentOrder.userId.lastName : undefined
            }
          }, null, 2));
        }
      } catch (emailError) {
        console.error('Lỗi khi gửi email thông báo giao hàng:', emailError);
        console.error('Stack trace:', emailError.stack);
        // Không trả về lỗi cho client, chỉ log lỗi
      }
    }

    // Trả về đơn hàng đã cập nhật với đầy đủ thông tin
    const updatedOrder = await _Order.default.findById(req.params.id).
    populate("userId").
    populate("products.productId");

    res.json(updatedOrder);
  } catch (err) {
    console.error("Lỗi khi cập nhật trạng thái đơn hàng:", err);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ error: err.message });
  }
};

// Thêm controller mới để đánh dấu đơn hàng đã thanh toán
exports.orderUpdate = orderUpdate;const markOrderAsPaid = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { isPaid, status } = req.body;

    // Cập nhật thông tin đơn hàng: trạng thái thanh toán và trạng thái đơn hàng (nếu có)
    const updateData = { isPaid };

    // Tìm đơn hàng để kiểm tra
    const order = await _Order.default.findById(orderId).populate("products.productId");

    if (!order) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }

    // Theo dõi trạng thái trước khi cập nhật
    const wasPaid = order.isPaid;
    const previousStatus = order.status;

    // Nếu có trạng thái mới được gửi lên, cập nhật trạng thái đơn hàng
    if (status) {
      updateData.status = status;
    }

    // THÊM MỚI: Xử lý cập nhật tracking_logs khi có thay đổi trạng thái hoặc thanh toán
    if (status && status !== previousStatus || isPaid && !wasPaid) {
      // Khởi tạo tracking object nếu chưa có
      if (!order.tracking) {
        order.tracking = { status_name: "", tracking_logs: [] };
      }

      // Lấy tên hiển thị cho trạng thái
      let statusName = "";
      if (status) {
        switch (status) {
          case 'pending':statusName = "Chờ xử lý";break;
          case 'confirmed':statusName = "Đã xác nhận";break;
          case 'processing':statusName = "Đang xử lý";break;
          case 'preparing':statusName = "Đang chuẩn bị hàng";break;
          case 'packaging':statusName = "Hoàn tất đóng gói";break;
          case 'shipping':statusName = "Đang vận chuyển";break;
          case 'shipped':statusName = "Đã giao cho vận chuyển";break;
          case 'delivering':statusName = "Đang giao hàng";break;
          case 'delivered':statusName = "Đã giao hàng";break;
          case 'completed':statusName = "Hoàn thành";break;
          case 'cancelled':statusName = "Đã hủy";break;
          case 'awaiting_payment':statusName = "Chờ thanh toán";break;
          case 'refunded':statusName = "Đã hoàn tiền";break;
          case 'failed':statusName = "Thất bại";break;
          case 'delivery_failed':statusName = "Giao hàng thất bại";break;
          default:statusName = status;
        }
      } else if (isPaid && !wasPaid) {
        statusName = "Đã thanh toán";
      }

      // Thêm bản ghi mới vào đầu mảng tracking_logs
      const newTrackingLog = {
        status: status || order.status,
        status_name: statusName || "Cập nhật thanh toán",
        timestamp: new Date().toISOString(),
        location: "Cửa hàng DNC FOOD"
      };

      // Khởi tạo mảng tracking_logs nếu chưa có
      if (!order.tracking.tracking_logs) {
        order.tracking.tracking_logs = [];
      }

      // Thêm log mới vào đầu mảng (để log mới nhất nằm đầu tiên)
      order.tracking.tracking_logs.unshift(newTrackingLog);

      // Cập nhật status_name chính
      if (statusName) {
        order.tracking.status_name = statusName;
      }

      // Lưu tracking vào updateData để cập nhật
      updateData.tracking = order.tracking;
    }

    // Nếu đánh dấu là đã thanh toán và hoàn thành, cập nhật thời gian hoàn thành
    if (isPaid && status === 'completed') {
      updateData.completedAt = new Date();
    }

    // Nếu đơn hàng COD hoặc chưa từng thanh toán, và giờ đã thanh toán
    if (order.paymentMethod === "cod" && !wasPaid && isPaid) {
      // Cập nhật số lượng tồn kho và tăng soldCount
      await updateProductStock(order.products, false, true);

      // Cập nhật thông tin sản phẩm bán chạy
      try {
        for (const item of order.products) {
          if (item.productId) {
            await _BestSellingProduct.default.updateSalesData(
              item.productId._id,
              item.productId,
              item.quantity,
              orderId
            );
          }
        }
      } catch (bestSellerError) {
        console.error("Lỗi khi cập nhật sản phẩm bán chạy:", bestSellerError);
        // Không trả về lỗi, vẫn tiếp tục xử lý
      }
    }

    // Cập nhật trạng thái thanh toán của đơn hàng
    const updatedOrder = await _Order.default.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    ).populate("userId").populate("products.productId");

    // Ghi log hoặc thông báo
    console.log(`Đơn hàng ${orderId} đã được đánh dấu là đã thanh toán${status ? ` và chuyển trạng thái thành ${status}` : ''}`);

    // Gửi email thông báo nếu có email và khi đơn hàng chuyển sang trạng thái completed
    if (status === 'completed' && order.shippingInfo && order.shippingInfo.email) {
      try {
        await (0, _emailService.sendOrderConfirmationEmail)(updatedOrder);
        console.log(`Đã gửi email hoàn thành đơn hàng ${order.orderCode} đến ${order.shippingInfo.email}`);
      } catch (emailError) {
        console.error('Lỗi khi gửi email hoàn thành đơn hàng:', emailError);
      }
    }

    res.json(updatedOrder);
  } catch (err) {
    console.error("Lỗi khi đánh dấu đơn hàng đã thanh toán:", err);
    res.status(500).json({ error: err.message });
  }
};exports.markOrderAsPaid = markOrderAsPaid;

const orderDelete = async (req, res) => {
  try {
    const order = await _Order.default.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    res.json({ message: "Đơn hàng đã được xóa thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Hàm hủy đơn hàng
exports.orderDelete = orderDelete;const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await _Order.default.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng"
      });
    }

    // Kiểm tra xem đơn hàng có thể hủy không
    if (order.status === 'completed' || order.status === 'delivering') {
      return res.status(400).json({
        success: false,
        message: order.status === "delivering" ?
        "Không thể hủy đơn hàng đang giao" :
        "Không thể hủy đơn hàng đã giao"
      });
    }

    // Cập nhật trạng thái đơn hàng thành 'cancelled'
    order.status = 'cancelled';
    await order.save();

    // Chỉ trả lại số lượng tồn kho nếu là thanh toán online, COD chưa trừ kho
    if (order.paymentMethod !== "cod") {
      await updateProductStock(order.products, true, false);
    }
    // Nếu COD nhưng đã thanh toán và đã cập nhật soldCount, cần giảm soldCount
    else if (order.paymentMethod === "cod" && order.isPaid) {
      await updateProductStock(order.products, false, true); // Tăng soldCount
    }

    return res.status(200).json({
      success: true,
      message: "Hủy đơn hàng thành công",
      data: order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi khi hủy đơn hàng",
      error: error.message
    });
  }
};

// Lấy thông tin tracking từ Giao Hàng Nhanh API
exports.cancelOrder = cancelOrder;const getOrderTracking = async (req, res) => {
  try {
    const { orderCode } = req.params;

    if (!orderCode) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã vận đơn"
      });
    }

    // Tìm đơn hàng trong database dựa trên orderCode
    const order = await _Order.default.findOne({ orderCode });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng với mã vận đơn này"
      });
    }

    // Nếu đơn hàng đã có thông tin tracking, ưu tiên sử dụng
    if (order.tracking && order.tracking.tracking_logs && order.tracking.tracking_logs.length > 0) {
      console.log("Sử dụng thông tin tracking từ database");

      // Tạo estimated_delivery_time nếu chưa có
      if (!order.tracking.estimated_delivery_time) {
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);
        order.tracking.estimated_delivery_time = estimatedDelivery.toISOString();
      }

      return res.status(200).json({
        success: true,
        data: {
          order_code: order.orderCode,
          status: order.status,
          status_name: order.tracking.status_name || getStatusText(order.status),
          estimated_delivery_time: order.tracking.estimated_delivery_time,
          tracking_logs: order.tracking.tracking_logs,
          current_location: "Cửa hàng DNC FOOD",
          delivery_note: order.notes || "Hàng dễ vỡ, xin nhẹ tay"
        },
        isMocked: false
      });
    }

    // Tiếp tục với code gọi API GHN nếu cần
    const SHOP_ID = process.env.SHOP_ID;
    const SHOP_TOKEN_API = process.env.SHOP_TOKEN_API;
    const USE_MOCK_ON_ERROR = process.env.USE_MOCK_ON_ERROR === 'true';

    if (!SHOP_ID || !SHOP_TOKEN_API) {
      console.log("Thiếu thông tin cấu hình GHN trong biến môi trường");
      if (USE_MOCK_ON_ERROR) {
        // Tạo dữ liệu giả lập dựa trên thông tin đơn hàng thực tế
        const mockData = generateMockTrackingDataFromOrder(order);
        return res.status(200).json({
          success: true,
          data: mockData,
          isMocked: true,
          message: "Đang sử dụng dữ liệu giả lập do thiếu cấu hình GHN API"
        });
      }

      return res.status(500).json({
        success: false,
        message: "Thiếu thông tin cấu hình GHN"
      });
    }

    try {
      console.log(`Đang gọi API GHN với mã vận đơn: ${orderCode}`);
      console.log(`Thông tin Shop: ID=${SHOP_ID}, TOKEN=${SHOP_TOKEN_API.substring(0, 10)}...`);

      // Gọi API GHN để lấy thông tin tracking
      const response = await _axios.default.post(
        "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/detail",
        { order_code: orderCode },
        {
          headers: {
            'Token': SHOP_TOKEN_API,
            'ShopId': SHOP_ID,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Kết quả từ API GHN:", JSON.stringify(response.data, null, 2));

      // Nếu API trả về lỗi, xử lý và trả về response phù hợp
      if (response.data.code !== 200) {
        console.log("Lỗi từ GHN API:", response.data);

        if (USE_MOCK_ON_ERROR) {
          // Tạo dữ liệu giả lập dựa trên thông tin đơn hàng thực tế
          const mockData = generateMockTrackingDataFromOrder(order);
          return res.status(200).json({
            success: true,
            data: mockData,
            isMocked: true,
            message: "Đang sử dụng dữ liệu giả lập do API GHN trả về lỗi"
          });
        }

        return res.status(response.data.code).json({
          success: false,
          message: response.data.message || "Lỗi từ API GHN",
          code: response.data.code
        });
      }

      // Nếu thành công, trả về dữ liệu
      return res.status(200).json({
        success: true,
        data: response.data.data,
        isMocked: false
      });
    } catch (apiError) {
      console.error("Lỗi gọi API GHN:", apiError.message);

      if (USE_MOCK_ON_ERROR) {
        // Tạo dữ liệu giả lập dựa trên thông tin đơn hàng thực tế
        const mockData = generateMockTrackingDataFromOrder(order);
        return res.status(200).json({
          success: true,
          data: mockData,
          isMocked: true,
          message: "Đang sử dụng dữ liệu giả lập do không thể kết nối API GHN"
        });
      }

      return res.status(500).json({
        success: false,
        message: "Không thể kết nối đến API GHN",
        error: apiError.message
      });
    }
  } catch (error) {
    console.error("Lỗi khi lấy thông tin vận chuyển:", error.response && error.response.data ? error.response.data : error.message);

    const USE_MOCK_ON_ERROR = process.env.USE_MOCK_ON_ERROR === 'true';

    if (USE_MOCK_ON_ERROR) {
      try {
        // Tìm đơn hàng trong database dựa trên orderCode
        const order = await _Order.default.findOne({ orderCode: req.params.orderCode });

        if (order) {
          // Tạo dữ liệu giả lập dựa trên thông tin đơn hàng thực tế
          const mockData = generateMockTrackingDataFromOrder(order);
          return res.status(200).json({
            success: true,
            data: mockData,
            isMocked: true,
            message: "Đang sử dụng dữ liệu giả lập do lỗi hệ thống"
          });
        }
      } catch (dbError) {
        console.error("Lỗi khi tìm đơn hàng:", dbError);
      }

      // Nếu không tìm thấy đơn hàng hoặc có lỗi, sử dụng dữ liệu giả lập mặc định
      const mockData = generateMockTrackingData(req.params.orderCode);
      return res.status(200).json({
        success: true,
        data: mockData,
        isMocked: true,
        message: "Đang sử dụng dữ liệu giả lập do lỗi hệ thống"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi lấy thông tin vận chuyển",
      error: error.message
    });
  }
};

// Hàm chuyển đổi trạng thái đơn hàng thành text hiển thị
exports.getOrderTracking = getOrderTracking;function getStatusText(status) {
  switch (status) {
    case 'pending':return "Chờ xử lý";
    case 'confirmed':return "Đã xác nhận";
    case 'processing':return "Đang xử lý";
    case 'preparing':return "Đang chuẩn bị hàng";
    case 'packaging':return "Hoàn tất đóng gói";
    case 'shipping':return "Đang vận chuyển";
    case 'shipped':return "Đã giao cho vận chuyển";
    case 'delivering':return "Đang giao hàng";
    case 'delivered':return "Đã giao hàng";
    case 'completed':return "Hoàn thành";
    case 'cancelled':return "Đã hủy";
    case 'awaiting_payment':return "Chờ thanh toán";
    case 'refunded':return "Đã hoàn tiền";
    case 'failed':return "Thất bại";
    case 'delivery_failed':return "Giao hàng thất bại";
    default:return status;
  }
}

// Hàm tạo dữ liệu giả lập từ đơn hàng thực tế
function generateMockTrackingDataFromOrder(order) {
  const now = new Date();
  let trackingLogs = [];

  // Sử dụng tracking_logs nếu đã có
  if (order.tracking && order.tracking.tracking_logs && order.tracking.tracking_logs.length > 0) {
    trackingLogs = order.tracking.tracking_logs;
  }
  // Nếu không có tracking_logs, tạo dữ liệu giả lập dựa vào trạng thái hiện tại
  else {
    // Tạo các mốc thời gian giả lập
    const timeDay2 = new Date(now);
    timeDay2.setHours(now.getHours() - 24); // 1 ngày trước

    const timeToday1 = new Date(now);
    timeToday1.setHours(now.getHours() - 10); // 10 giờ trước

    const timeToday2 = new Date(now);
    timeToday2.setHours(now.getHours() - 5); // 5 giờ trước

    const timeLatest = new Date(now);
    timeLatest.setMinutes(now.getMinutes() - 30); // 30 phút trước

    // Tạo logs dựa trên trạng thái đơn hàng
    switch (order.status) {
      case 'completed':
        trackingLogs = [
        {
          status: "completed",
          status_name: "Hoàn thành",
          timestamp: now.toISOString(),
          location: "Địa chỉ giao hàng"
        },
        {
          status: "delivered",
          status_name: "Đã giao hàng",
          timestamp: timeLatest.toISOString(),
          location: "Địa chỉ giao hàng"
        },
        {
          status: "delivering",
          status_name: "Đang giao hàng",
          timestamp: timeToday2.toISOString(),
          location: "Trung tâm phân loại"
        },
        {
          status: "shipping",
          status_name: "Đang vận chuyển",
          timestamp: timeToday1.toISOString(),
          location: "Cửa hàng DNC FOOD"
        },
        {
          status: "packaging",
          status_name: "Hoàn tất đóng gói",
          timestamp: timeDay2.toISOString(),
          location: "Cửa hàng DNC FOOD"
        }];

        break;

      case 'delivering':
        trackingLogs = [
        {
          status: "delivering",
          status_name: "Đang giao hàng",
          timestamp: timeLatest.toISOString(),
          location: "Trung tâm phân loại"
        },
        {
          status: "shipping",
          status_name: "Đang vận chuyển",
          timestamp: timeToday1.toISOString(),
          location: "Cửa hàng DNC FOOD"
        },
        {
          status: "packaging",
          status_name: "Hoàn tất đóng gói",
          timestamp: timeDay2.toISOString(),
          location: "Cửa hàng DNC FOOD"
        }];

        break;

      case 'shipping':
        trackingLogs = [
        {
          status: "shipping",
          status_name: "Đang vận chuyển",
          timestamp: timeLatest.toISOString(),
          location: "Cửa hàng DNC FOOD"
        },
        {
          status: "packaging",
          status_name: "Hoàn tất đóng gói",
          timestamp: timeToday1.toISOString(),
          location: "Cửa hàng DNC FOOD"
        }];

        break;

      case 'packaging':
        trackingLogs = [
        {
          status: "packaging",
          status_name: "Hoàn tất đóng gói",
          timestamp: timeLatest.toISOString(),
          location: "Cửa hàng DNC FOOD"
        }];

        break;

      default:
        // Với các trạng thái khác, tạo một bản ghi phù hợp
        trackingLogs = [
        {
          status: order.status,
          status_name: getStatusText(order.status),
          timestamp: now.toISOString(),
          location: "Cửa hàng DNC FOOD"
        }];

    }
  }

  // Tạo ngày dự kiến giao hàng (3 ngày từ hiện tại)
  const estimatedDelivery = new Date(now);
  estimatedDelivery.setDate(now.getDate() + 3);

  // Lấy trạng thái và tên trạng thái từ bản ghi mới nhất
  const status = trackingLogs.length > 0 ? trackingLogs[0].status : order.status;
  const status_name = trackingLogs.length > 0 ? trackingLogs[0].status_name : getStatusText(order.status);

  // Trả về cấu trúc dữ liệu tracking
  return {
    order_code: order.orderCode,
    status: status,
    status_name: status_name,
    estimated_delivery_time: estimatedDelivery.toISOString(),
    tracking_logs: trackingLogs,
    current_location: "Cửa hàng DNC FOOD",
    delivery_note: order.notes || "Hàng dễ vỡ, xin nhẹ tay"
  };
}

// Giữ lại hàm cũ để tương thích ngược
function generateMockTrackingData(orderCode) {
  const now = new Date();

  // Tạo các mốc thời gian giả lập
  const timeDay2 = new Date(now);
  timeDay2.setHours(now.getHours() - 24); // 1 ngày trước

  const timeToday1 = new Date(now);
  timeToday1.setHours(now.getHours() - 10); // 10 giờ trước

  const timeToday2 = new Date(now);
  timeToday2.setHours(now.getHours() - 5); // 5 giờ trước

  const timeLatest = new Date(now);
  timeLatest.setMinutes(now.getMinutes() - 30); // 30 phút trước

  // Tạo ngày dự kiến giao hàng (3 ngày từ hiện tại)
  const estimatedDelivery = new Date(now);
  estimatedDelivery.setDate(now.getDate() + 3); // Dự kiến giao sau 3 ngày

  // Tạo danh sách các log vận chuyển giả lập (từ mới đến cũ)
  const trackingLogs = [
  {
    status: "packaging",
    status_name: "Hoàn tất đóng gói",
    timestamp: timeDay2.toISOString(),
    location: "Cửa hàng DNC FOOD"
  },
  {
    status: "shipping",
    status_name: "Đã giao cho vận chuyển",
    timestamp: timeToday1.toISOString(),
    location: "Cửa hàng DNC FOOD"
  },
  {
    status: "collected",
    status_name: "Đã lấy hàng",
    timestamp: timeToday2.toISOString(),
    location: "Cửa hàng DNC FOOD"
  },
  {
    status: "delivering",
    status_name: "Đang giao hàng",
    timestamp: timeLatest.toISOString(),
    location: "Trung tâm phân loại"
  }];


  // Trả về cấu trúc dữ liệu tracking giả lập
  return {
    order_code: orderCode,
    status: "delivering",
    status_name: "Đang giao hàng",
    estimated_delivery_time: estimatedDelivery.toISOString(),
    tracking_logs: trackingLogs,
    current_location: "Trung tâm phân phối",
    delivery_note: "Hàng dễ vỡ, xin nhẹ tay"
  };
}

// Cập nhật trạng thái thanh toán của đơn hàng
const updateOrderPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, isPaid } = req.body;

    // Validate input
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    // Find order
    const order = await _Order.default.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Track old values for comparison
    const oldPaymentStatus = order.paymentStatus;
    const oldIsPaid = order.isPaid;

    // Update payment status
    const updateData = {};
    if (paymentStatus !== undefined) {
      updateData.paymentStatus = paymentStatus;
    }
    if (isPaid !== undefined) {
      updateData.isPaid = isPaid;
    }

    // THÊM MỚI: Cập nhật tracking_logs khi trạng thái thanh toán thay đổi
    if (paymentStatus && paymentStatus !== oldPaymentStatus ||
    isPaid !== undefined && isPaid !== oldIsPaid) {

      // Khởi tạo tracking object nếu chưa có
      if (!order.tracking) {
        order.tracking = { status_name: "", tracking_logs: [] };
      }

      // Tạo status_name theo trạng thái thanh toán mới
      let statusName = "";
      if (paymentStatus) {
        switch (paymentStatus) {
          case 'pending':statusName = "Chờ thanh toán";break;
          case 'completed':statusName = "Đã thanh toán";break;
          case 'failed':statusName = "Thanh toán thất bại";break;
          case 'refunded':statusName = "Đã hoàn tiền";break;
          default:statusName = `Trạng thái thanh toán: ${paymentStatus}`;
        }
      } else if (isPaid !== undefined) {
        statusName = isPaid ? "Đã thanh toán" : "Chưa thanh toán";
      }

      // Thêm bản ghi mới vào đầu mảng tracking_logs
      const newTrackingLog = {
        status: order.status,
        status_name: statusName || "Cập nhật thanh toán",
        timestamp: new Date().toISOString(),
        location: "Cửa hàng DNC FOOD"
      };

      // Khởi tạo mảng tracking_logs nếu chưa có
      if (!order.tracking.tracking_logs) {
        order.tracking.tracking_logs = [];
      }

      // Thêm log mới vào đầu mảng (để log mới nhất nằm đầu tiên)
      order.tracking.tracking_logs.unshift(newTrackingLog);

      // Lưu tracking vào updateData để cập nhật
      updateData.tracking = order.tracking;
    }

    // Update order in database
    const updatedOrder = await _Order.default.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate("userId").populate("products.productId");

    // Handle inventory and sales data if newly paid
    if (isPaid && !oldIsPaid) {
      // Update bestselling products
      try {
        for (const item of updatedOrder.products) {
          if (item.productId) {
            await _BestSellingProduct.default.updateSalesData(
              item.productId._id,
              item.productId,
              item.quantity,
              id
            );
          }
        }
      } catch (error) {
        console.error("Error updating bestselling products:", error);
      }
    }

    // Gửi thông báo khi cập nhật trạng thái thanh toán
    if (updatedOrder.userId && (
    paymentStatus && paymentStatus !== oldPaymentStatus ||
    isPaid !== undefined && isPaid !== oldIsPaid)) {
      try {
        await (0, _notificationService.sendOrderStatusNotification)(updatedOrder.userId, updatedOrder, getStatusText(updatedOrder.status));
        // console.log(`Đã gửi thông báo cập nhật trạng thái thanh toán đơn hàng ${updatedOrder.orderCode} đến user ${updatedOrder.userId}`);
      } catch (notificationError) {
        console.error('Lỗi khi gửi thông báo cập nhật trạng thái thanh toán:', notificationError);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order payment status updated successfully",
      data: updatedOrder
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating payment status",
      error: error.message
    });
  }
};

// Thêm controller function mới để gửi email xác nhận đơn hàng
exports.updateOrderPaymentStatus = updateOrderPaymentStatus;const notifyOrderSuccess = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { email, fullName, phone, address } = req.body;

    console.log(`=====================================================`);
    console.log(`NOTIFY ORDER SUCCESS - ATTEMPTING TO SEND EMAIL`);
    console.log(`Order ID: ${orderId}`);
    console.log(`Email data:`, { email, fullName, phone, address });

    // Lấy thông tin đơn hàng
    const order = await _Order.default.findById(orderId).
    populate("userId").
    populate("products.productId");

    if (!order) {
      console.log(`Order not found with ID: ${orderId}`);
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng"
      });
    }

    console.log(`Order found:`, {
      orderCode: order.orderCode,
      userId: order.userId && order.userId._id ? order.userId._id : undefined,
      userEmail: order.userId && order.userId.email ? order.userId.email : undefined,
      totalAmount: order.totalAmount
    });

    // Tạo thông tin giao hàng cho email
    const shippingInfo = {
      fullName: fullName || (order.userId && order.userId.firstName ? `${order.userId.firstName || ''} ${order.userId.lastName || ''}`.trim() : ''),
      address: address || order.address || (order.userId && order.userId.address ? order.userId.address : ''),
      phone: phone || (order.userId && order.userId.phone ? order.userId.phone : ''),
      email: email || (order.userId && order.userId.email ? order.userId.email : '')
    };

    console.log(`Shipping info prepared:`, shippingInfo);

    // Đảm bảo có email trong shippingInfo
    if (!shippingInfo.email) {
      console.log(`ERROR: No email provided in request or found in order`);
      return res.status(400).json({
        success: false,
        message: "Thiếu địa chỉ email để gửi xác nhận đơn hàng"
      });
    }

    // Gắn thông tin giao hàng vào đơn hàng
    order.shippingInfo = shippingInfo;

    // Lưu lại thông tin shippingInfo vào đơn hàng để sử dụng sau này
    try {
      await _Order.default.findByIdAndUpdate(orderId, { shippingInfo: shippingInfo });
      console.log(`Updated order with shippingInfo`);
    } catch (updateError) {
      console.log(`Warning: Could not update order with shippingInfo: ${updateError.message}`);
      // Tiếp tục thực hiện gửi email mặc dù không cập nhật được order
    }

    // Gửi email xác nhận đơn hàng
    console.log(`Attempting to send confirmation email to: ${shippingInfo.email}`);

    const emailSent = await (0, _emailService.sendOrderConfirmationEmail)(order);
    console.log(`Email sent result: ${emailSent ? "SUCCESS" : "FAILED"}`);

    if (emailSent) {
      console.log(`Email successfully sent to: ${shippingInfo.email}`);
      console.log(`=====================================================`);
      return res.status(200).json({
        success: true,
        message: "Email xác nhận đơn hàng đã được gửi thành công"
      });
    } else {
      console.log(`Failed to send email to: ${shippingInfo.email}`);
      console.log(`=====================================================`);
      return res.status(400).json({
        success: false,
        message: "Không thể gửi email xác nhận đơn hàng"
      });
    }
  } catch (error) {
    console.error("Error in notifyOrderSuccess:", error);
    console.log(`=====================================================`);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi gửi email xác nhận đơn hàng",
      error: error.message
    });
  }
};

// Hàm lấy top đơn hàng có giá trị cao nhất
exports.notifyOrderSuccess = notifyOrderSuccess;const getTopOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10; // Mặc định lấy top 10 đơn hàng

    // Tìm đơn hàng và sắp xếp theo totalAmount giảm dần
    const topOrders = await _Order.default.find().
    populate("userId", "firstName lastName email userName").
    sort({ totalAmount: -1 }).
    limit(limit);

    // Định dạng lại dữ liệu để phù hợp với cấu trúc hiển thị
    const formattedOrders = topOrders.map((order) => {
      // Định dạng tên khách hàng
      let customerName = 'Khách hàng';
      if (order.userId) {
        if (order.userId.firstName || order.userId.lastName) {
          customerName = `${order.userId.firstName || ''} ${order.userId.lastName || ''}`.trim();
        } else if (order.userId.userName) {
          customerName = order.userId.userName;
        } else if (order.userId.email) {
          customerName = order.userId.email;
        }
      }

      // Định dạng ngày đặt hàng
      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
      const formattedDate = `${orderDate.getDate()}/${orderDate.getMonth() + 1}/${orderDate.getFullYear()}`;

      // Chuyển đổi trạng thái sang tiếng Việt
      let statusText = 'Đang xử lý';
      switch (order.status) {
        case 'pending':statusText = 'Đang xử lý';break;
        case 'confirmed':statusText = 'Đã xác nhận';break;
        case 'processing':statusText = 'Đang xử lý';break;
        case 'shipping':statusText = 'Đang vận chuyển';break;
        case 'delivering':statusText = 'Đang giao hàng';break;
        case 'delivered':statusText = 'Đã giao hàng';break;
        case 'completed':statusText = 'Đã hoàn thành';break;
        case 'cancelled':statusText = 'Đã hủy';break;
        case 'awaiting_payment':statusText = 'Chờ thanh toán';break;
        default:statusText = order.status;
      }

      return {
        id: order.orderCode || order._id,
        customer: customerName,
        total: order.totalAmount,
        status: statusText,
        date: formattedDate
      };
    });

    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn hàng giá trị cao nhất:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đơn hàng giá trị cao nhất',
      error: error.message
    });
  }
};

// Hàm lấy thống kê đơn hàng
exports.getTopOrders = getTopOrders;const getOrderStats = async (req, res) => {
  try {
    const period = req.query.period || 'week'; // Mặc định là tuần
    const startDate = new Date();
    let endDate = new Date();

    // Thiết lập khoảng thời gian dựa trên period
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'year':
        startDate.setDate(startDate.getDate() - 365);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Lấy thống kê số lượng đơn hàng theo trạng thái
    const pendingCount = await _Order.default.countDocuments({
      status: { $in: ['pending', 'processing', 'awaiting_payment'] },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const shippingCount = await _Order.default.countDocuments({
      status: { $in: ['shipping', 'delivering'] },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const completedCount = await _Order.default.countDocuments({
      status: 'completed',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const cancelledCount = await _Order.default.countDocuments({
      status: 'cancelled',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Tính tổng số đơn hàng
    const totalOrders = pendingCount + shippingCount + completedCount + cancelledCount;

    // Dữ liệu cho biểu đồ trạng thái đơn hàng
    const orderStatus = [
    { name: 'Đang xử lý', value: pendingCount },
    { name: 'Đang giao', value: shippingCount },
    { name: 'Đã giao', value: completedCount },
    { name: 'Đã hủy', value: cancelledCount }];


    // Tính toán thời gian xử lý trung bình dựa trên dữ liệu thực tế
    let processingTime = [];

    try {
      // Lấy đơn hàng đã hoàn thành để tính thời gian xử lý
      const completedOrders = await _Order.default.find({
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate },
        completedAt: { $exists: true }
      });

      if (completedOrders.length > 0) {
        // Tính tổng thời gian xử lý
        let totalProcessingTime = 0;
        let totalShippingTime = 0;
        let totalTotalTime = 0;

        completedOrders.forEach((order) => {
          // Nếu có tracking logs, sử dụng chúng để tính thời gian chính xác hơn
          if (order.tracking && Array.isArray(order.tracking.tracking_logs) && order.tracking.tracking_logs.length >= 2) {
            const logs = order.tracking.tracking_logs;
            // Sắp xếp logs theo thời gian
            logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            // Tính thời gian từ tạo đơn đến đóng gói
            const packagingLog = logs.find((log) => log.status === 'packaging' || log.status_name.includes('đóng gói'));
            if (packagingLog) {
              const packagingTime = (new Date(packagingLog.timestamp) - new Date(order.createdAt)) / (1000 * 60); // Phút
              totalProcessingTime += packagingTime;
            }

            // Tính thời gian từ đóng gói đến giao hàng
            const shippingLog = logs.find((log) => log.status === 'shipping' || log.status === 'delivering');
            const deliveredLog = logs.find((log) => log.status === 'delivered' || log.status === 'completed');

            if (shippingLog && deliveredLog) {
              const deliveryTime = (new Date(deliveredLog.timestamp) - new Date(shippingLog.timestamp)) / (1000 * 60);
              totalShippingTime += deliveryTime;
            }

            // Tính tổng thời gian từ tạo đơn đến hoàn thành
            totalTotalTime += (new Date(order.completedAt) - new Date(order.createdAt)) / (1000 * 60);
          } else {
            // Nếu không có tracking logs, sử dụng createdAt và completedAt
            const totalTime = (new Date(order.completedAt) - new Date(order.createdAt)) / (1000 * 60);
            totalTotalTime += totalTime;

            // Giả định tỷ lệ thời gian cho từng giai đoạn
            totalProcessingTime += totalTime * 0.3; // 30% thời gian cho xử lý
            totalShippingTime += totalTime * 0.7; // 70% thời gian cho vận chuyển
          }
        });

        // Tính thời gian trung bình
        const avgProcessingTime = Math.round(totalProcessingTime / completedOrders.length);
        const avgShippingTime = Math.round(totalShippingTime / completedOrders.length);
        const avgTotalTime = Math.round(totalTotalTime / completedOrders.length);

        processingTime = [
        { name: 'Xác nhận & Đóng gói', time: avgProcessingTime || 15 },
        { name: 'Vận chuyển', time: avgShippingTime || 45 },
        { name: 'Tổng thời gian', time: avgTotalTime || 60 }];

      } else {
        // Nếu không có đơn hàng hoàn thành, sử dụng dữ liệu mẫu
        processingTime = [
        { name: 'Xác nhận', time: 15 },
        { name: 'Đóng gói', time: 30 },
        { name: 'Vận chuyển', time: 45 }];

      }
    } catch (error) {
      console.error('Lỗi khi tính toán thời gian xử lý trung bình:', error);
      // Dữ liệu mẫu khi có lỗi
      processingTime = [
      { name: 'Xác nhận', time: 15 },
      { name: 'Đóng gói', time: 30 },
      { name: 'Vận chuyển', time: 45 }];

    }

    // Lấy danh sách top 10 đơn hàng giá trị cao nhất
    const topOrders = await _Order.default.find({ createdAt: { $gte: startDate, $lte: endDate } }).
    populate("userId", "firstName lastName email userName").
    sort({ totalAmount: -1 }).
    limit(10);

    // Định dạng lại dữ liệu top orders
    const formattedTopOrders = topOrders.map((order) => {
      // Định dạng tên khách hàng
      let customerName = 'Khách hàng';
      if (order.userId) {
        if (order.userId.firstName || order.userId.lastName) {
          customerName = `${order.userId.firstName || ''} ${order.userId.lastName || ''}`.trim();
        } else if (order.userId.userName) {
          customerName = order.userId.userName;
        } else if (order.userId.email) {
          customerName = order.userId.email;
        }
      }

      // Định dạng ngày đặt hàng
      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
      const formattedDate = `${orderDate.getDate()}/${orderDate.getMonth() + 1}/${orderDate.getFullYear()}`;

      // Chuyển đổi trạng thái sang tiếng Việt
      let statusText = 'Đang xử lý';
      switch (order.status) {
        case 'pending':statusText = 'Đang xử lý';break;
        case 'confirmed':statusText = 'Đã xác nhận';break;
        case 'processing':statusText = 'Đang xử lý';break;
        case 'shipping':statusText = 'Đang vận chuyển';break;
        case 'delivering':statusText = 'Đang giao hàng';break;
        case 'delivered':statusText = 'Đã giao hàng';break;
        case 'completed':statusText = 'Đã hoàn thành';break;
        case 'cancelled':statusText = 'Đã hủy';break;
        case 'awaiting_payment':statusText = 'Chờ thanh toán';break;
        default:statusText = order.status;
      }

      return {
        id: order.orderCode || order._id,
        customer: customerName,
        total: order.totalAmount,
        status: statusText,
        date: formattedDate
      };
    });

    // Trả về dữ liệu thống kê
    res.status(200).json({
      totalOrders,
      pendingOrders: pendingCount,
      completedOrders: completedCount,
      cancelledOrders: cancelledCount,
      orderStatus,
      processingTime,
      topOrders: formattedTopOrders
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê đơn hàng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê đơn hàng',
      error: error.message
    });
  }
};

// Hàm lấy thống kê giao hàng
exports.getOrderStats = getOrderStats;const getDeliveryStats = async (req, res) => {
  try {
    const period = req.query.period || 'week'; // Mặc định là tuần
    const startDate = new Date();
    let endDate = new Date();

    // Thiết lập khoảng thời gian dựa trên period
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'year':
        startDate.setDate(startDate.getDate() - 365);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Lấy thống kê số lượng đơn hàng theo trạng thái giao hàng
    const completedCount = await _Order.default.countDocuments({
      status: { $in: ['completed', 'delivered'] },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const inProgressCount = await _Order.default.countDocuments({
      status: { $in: ['shipping', 'delivering'] },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const delayedCount = await _Order.default.countDocuments({
      status: 'delivery_failed',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Tính tổng số đơn hàng liên quan đến giao hàng
    const totalDeliveries = completedCount + inProgressCount + delayedCount;

    // Tính thời gian giao hàng trung bình
    let avgDeliveryTime = "N/A";

    try {
      // Lấy các đơn hàng đã hoàn thành có thông tin tracking
      const completedOrders = await _Order.default.find({
        status: { $in: ['completed', 'delivered'] },
        createdAt: { $gte: startDate, $lte: endDate },
        'tracking.tracking_logs': { $exists: true, $ne: [] }
      });

      if (completedOrders.length > 0) {
        let totalDeliveryHours = 0;
        let validOrderCount = 0;

        completedOrders.forEach((order) => {
          if (order.tracking && Array.isArray(order.tracking.tracking_logs) && order.tracking.tracking_logs.length >= 2) {
            const logs = [...order.tracking.tracking_logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            // Tìm log đầu tiên và log hoàn thành
            const firstLog = logs[0];
            const completionLog = logs.find((log) =>
            log.status === 'completed' ||
            log.status === 'delivered' ||
            log.status_name.includes('hoàn thành') ||
            log.status_name.includes('đã giao')
            );

            if (firstLog && completionLog) {
              const startTime = new Date(firstLog.timestamp);
              const endTime = new Date(completionLog.timestamp);
              const deliveryHours = (endTime - startTime) / (1000 * 60 * 60);

              if (deliveryHours > 0 && deliveryHours < 240) {// Loại bỏ giá trị bất thường (> 10 ngày)
                totalDeliveryHours += deliveryHours;
                validOrderCount++;
              }
            }
          }
        });

        if (validOrderCount > 0) {
          avgDeliveryTime = `${(totalDeliveryHours / validOrderCount).toFixed(1)} giờ`;
        }
      }
    } catch (error) {
      console.error('Lỗi khi tính thời gian giao hàng trung bình:', error);
    }

    // Thống kê đơn hàng theo đối tác giao hàng (mặc định là Giao Hàng Nhanh)
    const deliveryPartners = [
    { name: 'Giao Hàng Nhanh', value: Math.round(totalDeliveries * 0.75) },
    { name: 'Viettel Post', value: Math.round(totalDeliveries * 0.15) },
    { name: 'Grab', value: Math.round(totalDeliveries * 0.07) },
    { name: 'Khác', value: Math.round(totalDeliveries * 0.03) }];


    // Dữ liệu thời gian giao hàng theo khu vực
    const deliveryTimeByRegion = [
    { region: 'Tp.HCM', time: 12 },
    { region: 'Hà Nội', time: 24 },
    { region: 'Đà Nẵng', time: 36 },
    { region: 'Cần Thơ', time: 48 },
    { region: 'Tỉnh khác', time: 72 }];


    // Lấy danh sách đơn hàng gần đây để hiển thị
    const recentOrders = await _Order.default.find({
      status: { $nin: ['cancelled', 'failed', 'awaiting_payment'] },
      createdAt: { $gte: startDate, $lte: endDate }
    }).
    populate("userId", "firstName lastName email").
    sort({ createdAt: -1 }).
    limit(10);

    // Chuyển đổi đơn hàng thành định dạng hiển thị cho giao hàng
    const deliveries = recentOrders.map((order) => {
      // Xác định trạng thái giao hàng
      let status = 'Đang xử lý';
      if (order.status === 'completed' || order.status === 'delivered') {
        status = 'Hoàn thành';
      } else if (order.status === 'shipping' || order.status === 'delivering') {
        status = 'Đang giao';
      } else if (order.status === 'delivery_failed') {
        status = 'Thất bại';
      }

      // Định dạng tên khách hàng
      let customerName = 'Khách hàng';
      if (order.userId) {
        if (order.userId.firstName || order.userId.lastName) {
          customerName = `${order.userId.firstName || ''} ${order.userId.lastName || ''}`.trim();
        } else if (order.userId.email) {
          customerName = order.userId.email;
        }
      }

      // Xác định đối tác giao hàng (mặc định là GHN)
      const partner = order.shippingPartner || 'Giao Hàng Nhanh';

      // Định dạng địa chỉ
      const address = order.shippingInfo && order.shippingInfo.address ||
      order.address ||
      order.userId && order.userId.address ||
      'Không có thông tin';

      return {
        orderId: order.orderCode || order._id,
        customerName,
        address,
        partner,
        deliveryTime: order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A',
        status
      };
    });

    // Trả về dữ liệu thống kê
    res.status(200).json({
      statistics: {
        completed: completedCount,
        inProgress: inProgressCount,
        delayed: delayedCount,
        total: totalDeliveries,
        avgDeliveryTime
      },
      deliveryPartners,
      deliveryTimeByRegion,
      deliveries
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê giao hàng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê giao hàng',
      error: error.message
    });
  }
};

// Tạo đơn hàng mới
exports.getDeliveryStats = getDeliveryStats;const createOrder = async (req, res) => {
  try {
    const {
      userId,
      products,
      shippingAddress,
      totalAmount,
      paymentMethod,
      note,
      status,
      branchId,
      shippingInfo
    } = req.body;

    // Đảm bảo đơn hàng luôn có branchId
    let finalBranchId = branchId;

    // Nếu không có branchId, tìm chi nhánh gần nhất dựa trên địa chỉ giao hàng
    if (!finalBranchId && shippingInfo && (shippingInfo.address || shippingAddress)) {
      try {
        const addressToUse = shippingInfo.address || shippingAddress;
        const coordinates = shippingInfo?.coordinates || null;

        // Tìm chi nhánh gần nhất
        const nearestBranch = await (0, _branchService.findNearestBranch)(addressToUse, coordinates);

        if (nearestBranch) {
          finalBranchId = nearestBranch._id;
          console.log(`Đơn hàng được tự động gán cho chi nhánh: ${nearestBranch.name}`);
        } else {
          // Gán chi nhánh mặc định nếu không tìm thấy chi nhánh gần nhất
          const defaultBranch = await _Branch.default.findOne({});
          if (defaultBranch) {
            finalBranchId = defaultBranch._id;
            console.log(`Không tìm thấy chi nhánh phù hợp, gán chi nhánh mặc định: ${defaultBranch.name}`);
          }
        }
      } catch (error) {
        console.error("Lỗi khi tìm chi nhánh gần nhất:", error);
      }
    }

    // Kiểm tra các trường bắt buộc
    if (!userId || !products || !totalAmount || !shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cần thiết để tạo đơn hàng"
      });
    }

    // Tạo mã đơn hàng ngẫu nhiên
    const orderCode = generateOrderCode();

    // Tạo đơn hàng mới
    const newOrder = new _Order.default({
      userId,
      products,
      totalAmount,
      shippingInfo: {
        address: shippingAddress,
        method: "standard"
      },
      paymentMethod,
      status: status || "pending",
      orderCode,
      notes: note,
      branchId: finalBranchId || null // Thêm chi nhánh xử lý nếu có
    });

    // Lưu đơn hàng vào database
    const savedOrder = await newOrder.save();

    // Lấy thông tin chi tiết đơn hàng (populate userId và products.productId)
    // Biến được sử dụng để gửi thông báo hoặc email (nếu cần)
    await _Order.default.findById(savedOrder._id).
    populate("userId", "firstName lastName email phone").
    populate("products.productId").
    populate("branchId"); // Thêm populate branchId

    // Cập nhật số lượng sản phẩm và doanh số bán hàng
    try {
      for (const item of products) {
        const product = await _Products.default.findById(item.productId);
        if (product) {
          // Cập nhật số lượng tồn kho
          const newStock = Math.max(0, product.productStock - item.quantity);

          // Cập nhật số lượng đã bán
          const newSoldCount = (product.soldCount || 0) + item.quantity;

          await _Products.default.findByIdAndUpdate(
            item.productId,
            {
              productStock: newStock,
              soldCount: newSoldCount
            }
          );

          // Cập nhật thống kê sản phẩm bán chạy
          try {
            await _BestSellingProduct.default.updateSalesData(
              item.productId,
              product,
              item.quantity,
              savedOrder._id
            );
          } catch (statsError) {
            console.error("Lỗi khi cập nhật thống kê sản phẩm bán chạy:", statsError);
          }
        }
      }
    } catch (inventoryError) {
      console.error("Lỗi khi cập nhật số lượng sản phẩm:", inventoryError);
      // Không ảnh hưởng đến việc tạo đơn hàng
    }

    // Gửi thông báo đơn hàng mới qua Socket.IO (nếu có)
    try {
      (0, _notificationService.sendOrderStatusNotification)(
        savedOrder._id,
        userId,
        "Đơn hàng mới",
        `Đơn hàng #${orderCode} đã được tạo thành công. Đơn hàng sẽ được xử lý sớm.`
      );
    } catch (notificationError) {
      console.error("Lỗi khi gửi thông báo đơn hàng:", notificationError);
    }

    return res.status(201).json({
      success: true,
      message: "Tạo đơn hàng thành công",
      _id: savedOrder._id,
      orderCode: savedOrder.orderCode
    });
  } catch (error) {
    console.error("Lỗi khi tạo đơn hàng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tạo đơn hàng",
      error: error.message
    });
  }
};

// Hàm lấy đơn hàng theo chi nhánh
exports.createOrder = createOrder;const getOrdersByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { page = 1, pageSize = 10, searchTerm, status, paymentMethod, isPaid, date, nearby, radius = 10 } = req.query;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ID chi nhánh"
      });
    }
    // Truy vấn branchId là string, KHÔNG convert sang ObjectId
    const query = { branchId };

    // Thêm điều kiện tìm kiếm nếu có
    if (searchTerm) {
      // Tìm kiếm theo mã đơn hàng, thông tin người dùng và thông tin giao hàng
      query.$or = [
      { orderCode: { $regex: searchTerm, $options: 'i' } },
      { notes: { $regex: searchTerm, $options: 'i' } }];


      // Tìm kiếm theo thông tin người dùng (cần populate trước)
      const usersWithSearchTerm = await _mongoose.default.model('User').find({
        $or: [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }]

      }).select('_id');

      if (usersWithSearchTerm.length > 0) {
        const userIds = usersWithSearchTerm.map((user) => user._id);
        query.$or.push({ userId: { $in: userIds } });
      }

      // Tìm kiếm trong thông tin giao hàng
      query.$or.push({ 'shippingInfo.address': { $regex: searchTerm, $options: 'i' } });
      query.$or.push({ 'shippingInfo.phone': { $regex: searchTerm, $options: 'i' } });
    }

    // Thêm điều kiện lọc theo trạng thái
    if (status) {
      query.status = status;
    }

    // Thêm điều kiện lọc theo phương thức thanh toán
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // Thêm điều kiện lọc theo trạng thái thanh toán
    if (isPaid !== undefined) {
      query.isPaid = isPaid === 'true';
    }

    // Thêm điều kiện lọc theo ngày
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    // Xử lý lọc đơn hàng gần chi nhánh
    if (nearby === 'true') {
      const branch = await _Branch.default.findById(branchId);
      if (!branch || !branch.location || !branch.location.coordinates) {
        return res.status(400).json({
          success: false,
          message: "Chi nhánh không có thông tin vị trí"
        });
      }

      // Tìm các đơn hàng trong bán kính (radius) km từ chi nhánh
      const radiusInKm = parseInt(radius) || 10;

      try {
        // Nếu đơn hàng có lưu tọa độ giao hàng
        if (branch.location && branch.location.type === 'Point') {
          // Sử dụng MongoDB Geospatial query nếu có lưu tọa độ
          const ordersInRadius = await _Order.default.find({
            'deliveryLocation': {
              $near: {
                $geometry: {
                  type: 'Point',
                  coordinates: branch.location.coordinates
                },
                $maxDistance: radiusInKm * 1000 // Convert km to meters
              }
            }
          }).select('_id');

          if (ordersInRadius && ordersInRadius.length > 0) {
            const orderIds = ordersInRadius.map((order) => order._id);
            // Thêm điều kiện vào query
            query._id = { $in: orderIds };
          } else {
            // Nếu không tìm thấy đơn hàng trong bán kính, trả về danh sách trống
            return res.status(200).json({
              orders: [],
              totalCount: 0,
              stats: {
                total: 0,
                pending: 0,
                confirmed: 0,
                preparing: 0,
                packaging: 0,
                shipping: 0,
                delivering: 0,
                completed: 0,
                cancelled: 0,
                delivery_failed: 0,
                awaiting_payment: 0
              }
            });
          }
        } else {
          // Nếu không có tọa độ, có thể sử dụng phương pháp khác để lọc
          // Ví dụ: lọc theo mã bưu điện, quận/huyện, v.v.
          console.log("Chi nhánh không có tọa độ, không thể lọc theo bán kính");
        }
      } catch (error) {
        console.error("Lỗi khi lọc đơn hàng theo bán kính:", error);
        // Không throw error, tiếp tục xử lý với query hiện tại
      }
    }

    // Tính toán phân trang
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // Đếm tổng số đơn hàng thỏa mãn điều kiện
    const totalCount = await _Order.default.countDocuments(query);

    // Lấy danh sách đơn hàng theo điều kiện và phân trang
    const orders = await _Order.default.find(query).
    populate('userId').
    populate('products.productId').
    populate('branchId').
    sort({ createdAt: -1 }).
    skip(skip).
    limit(limit);

    // Lấy thống kê đơn hàng theo trạng thái
    const stats = {
      total: totalCount,
      pending: await _Order.default.countDocuments({ ...query, status: 'pending' }),
      confirmed: await _Order.default.countDocuments({ ...query, status: 'confirmed' }),
      preparing: await _Order.default.countDocuments({ ...query, status: 'preparing' }),
      packaging: await _Order.default.countDocuments({ ...query, status: 'packaging' }),
      shipping: await _Order.default.countDocuments({ ...query, status: 'shipping' }),
      delivering: await _Order.default.countDocuments({ ...query, status: 'delivering' }),
      completed: await _Order.default.countDocuments({ ...query, status: 'completed' }),
      cancelled: await _Order.default.countDocuments({ ...query, status: 'cancelled' }),
      delivery_failed: await _Order.default.countDocuments({ ...query, status: 'delivery_failed' }),
      awaiting_payment: await _Order.default.countDocuments({ ...query, status: 'awaiting_payment' })
    };

    res.status(200).json({
      orders,
      totalCount,
      stats
    });
  } catch (err) {
    console.error("Lỗi khi lấy đơn hàng theo chi nhánh:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};exports.getOrdersByBranch = getOrdersByBranch;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfT3JkZXIiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9Qcm9kdWN0cyIsIl9heGlvcyIsIl9kb3RlbnYiLCJfZW1haWxTZXJ2aWNlIiwiX0Jlc3RTZWxsaW5nUHJvZHVjdCIsIl9ub3RpZmljYXRpb25TZXJ2aWNlIiwiX0JyYW5jaCIsIl9icmFuY2hTZXJ2aWNlIiwiX21vbmdvb3NlIiwiZG90ZW52IiwiY29uZmlnIiwiZ2VuZXJhdGVPcmRlckNvZGUiLCJjaGFyYWN0ZXJzIiwicmVzdWx0IiwiaSIsImNoYXJBdCIsIk1hdGgiLCJmbG9vciIsInJhbmRvbSIsImxlbmd0aCIsInVwZGF0ZVByb2R1Y3RTdG9jayIsInByb2R1Y3RzIiwiaW5jcmVhc2UiLCJ1cGRhdGVTb2xkQ291bnQiLCJpdGVtIiwicHJvZHVjdCIsIlByb2R1Y3QiLCJmaW5kQnlJZCIsInByb2R1Y3RJZCIsIm5ld1N0b2NrIiwicHJvZHVjdFN0b2NrIiwicXVhbnRpdHkiLCJtYXgiLCJwcm9kdWN0U3RhdHVzIiwic29sZENvdW50Iiwic2F2ZSIsImVycm9yIiwiY29uc29sZSIsIm9yZGVyQ3JlYXRlIiwicmVxIiwicmVzIiwidXNlcklkIiwidG90YWxBbW91bnQiLCJwYXltZW50TWV0aG9kIiwiY291cG9uIiwiYm9keSIsIkFycmF5IiwiaXNBcnJheSIsInN0YXR1cyIsImpzb24iLCJzdWNjZXNzIiwicHJvZHVjdE5hbWUiLCJvcmRlciIsIk9yZGVyIiwiY3JlYXRlZEF0IiwiRGF0ZSIsIm9yZGVyQ29kZSIsInBvcHVsYXRlZE9yZGVyIiwiX2lkIiwicG9wdWxhdGUiLCJlbWFpbCIsInNoaXBwaW5nSW5mbyIsImZ1bGxOYW1lIiwiZmlyc3ROYW1lIiwibGFzdE5hbWUiLCJ0cmltIiwiYWRkcmVzcyIsInBob25lIiwibG9nIiwiZW1haWxTZW50Iiwic2VuZE9yZGVyQ29uZmlybWF0aW9uRW1haWwiLCJlbWFpbEVycm9yIiwiaGFzT3JkZXIiLCJoYXNVc2VySWQiLCJoYXNFbWFpbCIsInVuZGVmaW5lZCIsImVyciIsIm1lc3NhZ2UiLCJleHBvcnRzIiwib3JkZXJHZXQiLCJxdWVyeSIsInVzZXIiLCJvcmRlcnMiLCJmaW5kIiwic29ydCIsIm9yZGVyR2V0QWxsIiwicGFnZSIsInBhZ2VTaXplIiwic2VhcmNoVGVybSIsImlzUGFpZCIsImRhdGUiLCJicmFuY2hJZCIsIkpTT04iLCJzdHJpbmdpZnkiLCIkb3IiLCIkcmVnZXgiLCIkb3B0aW9ucyIsIm5vdGVzIiwidXNlcnNXaXRoU2VhcmNoVGVybSIsIm1vbmdvb3NlIiwibW9kZWwiLCJzZWxlY3QiLCJ1c2VySWRzIiwibWFwIiwicHVzaCIsIiRpbiIsInN0YXJ0RGF0ZSIsInNldEhvdXJzIiwiZW5kRGF0ZSIsIiRndGUiLCIkbHRlIiwic2tpcCIsInBhcnNlSW50IiwibGltaXQiLCJ0b3RhbENvdW50IiwiY291bnREb2N1bWVudHMiLCJzdGF0cyIsInRvdGFsIiwicGVuZGluZyIsImNvbmZpcm1lZCIsInByZXBhcmluZyIsInBhY2thZ2luZyIsInNoaXBwaW5nIiwiZGVsaXZlcmluZyIsImNvbXBsZXRlZCIsImNhbmNlbGxlZCIsImRlbGl2ZXJ5X2ZhaWxlZCIsImF3YWl0aW5nX3BheW1lbnQiLCJvcmRlckdldEJ5SWQiLCJwYXJhbXMiLCJpZCIsInVwZGF0ZU9yZGVyIiwib3JkZXJJZCIsInVwZGF0ZURhdGEiLCJwcmV2aW91c1N0YXR1cyIsIm5ld1N0YXR1cyIsImFsbG93ZWRGaWVsZHMiLCJmaWx0ZXJlZERhdGEiLCJrZXkiLCJPYmplY3QiLCJrZXlzIiwiaW5jbHVkZXMiLCJ0cmFja2luZyIsInN0YXR1c19uYW1lIiwidHJhY2tpbmdfbG9ncyIsInN0YXR1c05hbWUiLCJuZXdUcmFja2luZ0xvZyIsInRpbWVzdGFtcCIsInRvSVNPU3RyaW5nIiwibG9jYXRpb24iLCJ1bnNoaWZ0IiwiY29tcGxldGVkQXQiLCJCZXN0U2VsbGluZ1Byb2R1Y3QiLCJ1cGRhdGVTYWxlc0RhdGEiLCJiZXN0U2VsbGVyRXJyb3IiLCJ1cGRhdGVkT3JkZXIiLCJmaW5kQnlJZEFuZFVwZGF0ZSIsIiRzZXQiLCJuZXciLCJ1c2VyTmFtZSIsInNlbmRPcmRlclNoaXBwaW5nRW1haWwiLCJzdGFjayIsInNlbmRPcmRlclN0YXR1c05vdGlmaWNhdGlvbiIsImdldFN0YXR1c1RleHQiLCJub3RpZmljYXRpb25FcnJvciIsImRhdGEiLCJvcmRlclVwZGF0ZSIsImN1cnJlbnRPcmRlciIsIm1hcmtPcmRlckFzUGFpZCIsIndhc1BhaWQiLCJvcmRlckRlbGV0ZSIsImZpbmRCeUlkQW5kRGVsZXRlIiwiY2FuY2VsT3JkZXIiLCJnZXRPcmRlclRyYWNraW5nIiwiZmluZE9uZSIsImVzdGltYXRlZF9kZWxpdmVyeV90aW1lIiwiZXN0aW1hdGVkRGVsaXZlcnkiLCJzZXREYXRlIiwiZ2V0RGF0ZSIsIm9yZGVyX2NvZGUiLCJjdXJyZW50X2xvY2F0aW9uIiwiZGVsaXZlcnlfbm90ZSIsImlzTW9ja2VkIiwiU0hPUF9JRCIsInByb2Nlc3MiLCJlbnYiLCJTSE9QX1RPS0VOX0FQSSIsIlVTRV9NT0NLX09OX0VSUk9SIiwibW9ja0RhdGEiLCJnZW5lcmF0ZU1vY2tUcmFja2luZ0RhdGFGcm9tT3JkZXIiLCJzdWJzdHJpbmciLCJyZXNwb25zZSIsImF4aW9zIiwicG9zdCIsImhlYWRlcnMiLCJjb2RlIiwiYXBpRXJyb3IiLCJkYkVycm9yIiwiZ2VuZXJhdGVNb2NrVHJhY2tpbmdEYXRhIiwibm93IiwidHJhY2tpbmdMb2dzIiwidGltZURheTIiLCJnZXRIb3VycyIsInRpbWVUb2RheTEiLCJ0aW1lVG9kYXkyIiwidGltZUxhdGVzdCIsInNldE1pbnV0ZXMiLCJnZXRNaW51dGVzIiwidXBkYXRlT3JkZXJQYXltZW50U3RhdHVzIiwicGF5bWVudFN0YXR1cyIsIm9sZFBheW1lbnRTdGF0dXMiLCJvbGRJc1BhaWQiLCJub3RpZnlPcmRlclN1Y2Nlc3MiLCJ1c2VyRW1haWwiLCJ1cGRhdGVFcnJvciIsImdldFRvcE9yZGVycyIsInRvcE9yZGVycyIsImZvcm1hdHRlZE9yZGVycyIsImN1c3RvbWVyTmFtZSIsIm9yZGVyRGF0ZSIsImZvcm1hdHRlZERhdGUiLCJnZXRNb250aCIsImdldEZ1bGxZZWFyIiwic3RhdHVzVGV4dCIsImN1c3RvbWVyIiwiZ2V0T3JkZXJTdGF0cyIsInBlcmlvZCIsInBlbmRpbmdDb3VudCIsInNoaXBwaW5nQ291bnQiLCJjb21wbGV0ZWRDb3VudCIsImNhbmNlbGxlZENvdW50IiwidG90YWxPcmRlcnMiLCJvcmRlclN0YXR1cyIsIm5hbWUiLCJ2YWx1ZSIsInByb2Nlc3NpbmdUaW1lIiwiY29tcGxldGVkT3JkZXJzIiwiJGV4aXN0cyIsInRvdGFsUHJvY2Vzc2luZ1RpbWUiLCJ0b3RhbFNoaXBwaW5nVGltZSIsInRvdGFsVG90YWxUaW1lIiwiZm9yRWFjaCIsImxvZ3MiLCJhIiwiYiIsInBhY2thZ2luZ0xvZyIsInBhY2thZ2luZ1RpbWUiLCJzaGlwcGluZ0xvZyIsImRlbGl2ZXJlZExvZyIsImRlbGl2ZXJ5VGltZSIsInRvdGFsVGltZSIsImF2Z1Byb2Nlc3NpbmdUaW1lIiwicm91bmQiLCJhdmdTaGlwcGluZ1RpbWUiLCJhdmdUb3RhbFRpbWUiLCJ0aW1lIiwiZm9ybWF0dGVkVG9wT3JkZXJzIiwicGVuZGluZ09yZGVycyIsImNhbmNlbGxlZE9yZGVycyIsImdldERlbGl2ZXJ5U3RhdHMiLCJpblByb2dyZXNzQ291bnQiLCJkZWxheWVkQ291bnQiLCJ0b3RhbERlbGl2ZXJpZXMiLCJhdmdEZWxpdmVyeVRpbWUiLCIkbmUiLCJ0b3RhbERlbGl2ZXJ5SG91cnMiLCJ2YWxpZE9yZGVyQ291bnQiLCJmaXJzdExvZyIsImNvbXBsZXRpb25Mb2ciLCJzdGFydFRpbWUiLCJlbmRUaW1lIiwiZGVsaXZlcnlIb3VycyIsInRvRml4ZWQiLCJkZWxpdmVyeVBhcnRuZXJzIiwiZGVsaXZlcnlUaW1lQnlSZWdpb24iLCJyZWdpb24iLCJyZWNlbnRPcmRlcnMiLCIkbmluIiwiZGVsaXZlcmllcyIsInBhcnRuZXIiLCJzaGlwcGluZ1BhcnRuZXIiLCJ0b0xvY2FsZURhdGVTdHJpbmciLCJzdGF0aXN0aWNzIiwiaW5Qcm9ncmVzcyIsImRlbGF5ZWQiLCJjcmVhdGVPcmRlciIsInNoaXBwaW5nQWRkcmVzcyIsIm5vdGUiLCJmaW5hbEJyYW5jaElkIiwiYWRkcmVzc1RvVXNlIiwiY29vcmRpbmF0ZXMiLCJuZWFyZXN0QnJhbmNoIiwiZmluZE5lYXJlc3RCcmFuY2giLCJkZWZhdWx0QnJhbmNoIiwiQnJhbmNoIiwibmV3T3JkZXIiLCJtZXRob2QiLCJzYXZlZE9yZGVyIiwibmV3U29sZENvdW50Iiwic3RhdHNFcnJvciIsImludmVudG9yeUVycm9yIiwiZ2V0T3JkZXJzQnlCcmFuY2giLCJuZWFyYnkiLCJyYWRpdXMiLCJicmFuY2giLCJyYWRpdXNJbkttIiwidHlwZSIsIm9yZGVyc0luUmFkaXVzIiwiJG5lYXIiLCIkZ2VvbWV0cnkiLCIkbWF4RGlzdGFuY2UiLCJvcmRlcklkcyJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9Db250cm9sbGVyL29yZGVyQ29udHJvbGxlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlZiAqL1xyXG5pbXBvcnQgT3JkZXIgZnJvbSBcIi4uL01vZGVsL09yZGVyLmpzXCI7XHJcbmltcG9ydCBQcm9kdWN0IGZyb20gXCIuLi9Nb2RlbC9Qcm9kdWN0cy5qc1wiO1xyXG5pbXBvcnQgYXhpb3MgZnJvbSBcImF4aW9zXCI7XHJcbmltcG9ydCBkb3RlbnYgZnJvbSBcImRvdGVudlwiO1xyXG5pbXBvcnQgeyBzZW5kT3JkZXJDb25maXJtYXRpb25FbWFpbCwgc2VuZE9yZGVyU2hpcHBpbmdFbWFpbCB9IGZyb20gXCIuLi91dGlscy9lbWFpbFNlcnZpY2UuanNcIjtcclxuaW1wb3J0IEJlc3RTZWxsaW5nUHJvZHVjdCBmcm9tIFwiLi4vTW9kZWwvQmVzdFNlbGxpbmdQcm9kdWN0LmpzXCI7XHJcbmltcG9ydCB7IHNlbmRPcmRlclN0YXR1c05vdGlmaWNhdGlvbiB9IGZyb20gXCIuLi9TZXJ2aWNlcy9ub3RpZmljYXRpb25TZXJ2aWNlLmpzXCI7XHJcbmltcG9ydCBCcmFuY2ggZnJvbSBcIi4uL01vZGVsL0JyYW5jaC5qc1wiO1xyXG5pbXBvcnQgeyBmaW5kTmVhcmVzdEJyYW5jaCB9IGZyb20gXCIuLi9TZXJ2aWNlcy9icmFuY2hTZXJ2aWNlLmpzXCI7XHJcbmltcG9ydCBtb25nb29zZSBmcm9tIFwibW9uZ29vc2VcIjtcclxuXHJcbmRvdGVudi5jb25maWcoKTtcclxuXHJcbi8vIEjDoG0gdOG6oW8gbcOjIHbhuq1uIMSRxqFuIG5n4bqrdSBuaGnDqm5cclxuZnVuY3Rpb24gZ2VuZXJhdGVPcmRlckNvZGUoKSB7XHJcbiAgY29uc3QgY2hhcmFjdGVycyA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWjAxMjM0NTY3ODknO1xyXG4gIGxldCByZXN1bHQgPSAnJztcclxuICBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcclxuICAgIHJlc3VsdCArPSBjaGFyYWN0ZXJzLmNoYXJBdChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGFyYWN0ZXJzLmxlbmd0aCkpO1xyXG4gIH1cclxuICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG4vLyBIw6BtIGPhuq1wIG5o4bqtdCBz4buRIGzGsOG7o25nIHThu5NuIGtobyBz4bqjbiBwaOG6qW1cclxuYXN5bmMgZnVuY3Rpb24gdXBkYXRlUHJvZHVjdFN0b2NrKHByb2R1Y3RzLCBpbmNyZWFzZSA9IGZhbHNlLCB1cGRhdGVTb2xkQ291bnQgPSBmYWxzZSkge1xyXG4gIHRyeSB7XHJcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgcHJvZHVjdHMpIHtcclxuICAgICAgY29uc3QgcHJvZHVjdCA9IGF3YWl0IFByb2R1Y3QuZmluZEJ5SWQoaXRlbS5wcm9kdWN0SWQpO1xyXG4gICAgICBpZiAocHJvZHVjdCkge1xyXG4gICAgICAgIC8vIFTEg25nIGhv4bq3YyBnaeG6o20gc+G7kSBsxrDhu6NuZyB04buTbiBraG8gZOG7sWEgdsOgbyB0aGFtIHPhu5EgaW5jcmVhc2VcclxuICAgICAgICBjb25zdCBuZXdTdG9jayA9IGluY3JlYXNlIFxyXG4gICAgICAgICAgPyBwcm9kdWN0LnByb2R1Y3RTdG9jayArIGl0ZW0ucXVhbnRpdHkgXHJcbiAgICAgICAgICA6IHByb2R1Y3QucHJvZHVjdFN0b2NrIC0gaXRlbS5xdWFudGl0eTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBD4bqtcCBuaOG6rXQgc+G7kSBsxrDhu6NuZyB04buTbiBraG8gdsOgIHRy4bqhbmcgdGjDoWkgc+G6o24gcGjhuqltXHJcbiAgICAgICAgcHJvZHVjdC5wcm9kdWN0U3RvY2sgPSBNYXRoLm1heCgwLCBuZXdTdG9jayk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQ+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgbuG6v3UgaOG6v3QgaMOgbmdcclxuICAgICAgICBpZiAocHJvZHVjdC5wcm9kdWN0U3RvY2sgPT09IDApIHtcclxuICAgICAgICAgIHByb2R1Y3QucHJvZHVjdFN0YXR1cyA9IFwiSOG6v3QgaMOgbmdcIjtcclxuICAgICAgICB9IGVsc2UgaWYgKHByb2R1Y3QucHJvZHVjdFN0YXR1cyA9PT0gXCJI4bq/dCBow6BuZ1wiKSB7XHJcbiAgICAgICAgICBwcm9kdWN0LnByb2R1Y3RTdGF0dXMgPSBcIkPDsm4gaMOgbmdcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEPhuq1wIG5o4bqtdCBz4buRIGzGsOG7o25nIGLDoW4gcmEgbuG6v3UgY+G6p25cclxuICAgICAgICBpZiAodXBkYXRlU29sZENvdW50ICYmICFpbmNyZWFzZSkge1xyXG4gICAgICAgICAgcHJvZHVjdC5zb2xkQ291bnQgPSAocHJvZHVjdC5zb2xkQ291bnQgfHwgMCkgKyBpdGVtLnF1YW50aXR5O1xyXG4gICAgICAgIH0gZWxzZSBpZiAodXBkYXRlU29sZENvdW50ICYmIGluY3JlYXNlKSB7XHJcbiAgICAgICAgICAvLyBUcuG7qyBzb2xkQ291bnQga2hpIGjhu6d5IMSRxqFuIGjDoG5nIMSRw6MgdGhhbmggdG/DoW5cclxuICAgICAgICAgIHByb2R1Y3Quc29sZENvdW50ID0gTWF0aC5tYXgoMCwgKHByb2R1Y3Quc29sZENvdW50IHx8IDApIC0gaXRlbS5xdWFudGl0eSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGF3YWl0IHByb2R1Y3Quc2F2ZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgY+G6rXAgbmjhuq10IHRow7RuZyB0aW4gc+G6o24gcGjhuqltOlwiLCBlcnJvcik7XHJcbiAgICB0aHJvdyBlcnJvcjtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBvcmRlckNyZWF0ZSA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICAvLyBWYWxpZGF0ZSByZXF1aXJlZCBmaWVsZHNcclxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xyXG4gICAgY29uc3QgeyB1c2VySWQsIHByb2R1Y3RzLCB0b3RhbEFtb3VudCwgcGF5bWVudE1ldGhvZCwgY291cG9uIH0gPSByZXEuYm9keTtcclxuICAgIGlmICghdXNlcklkIHx8ICFwcm9kdWN0cyB8fCAhQXJyYXkuaXNBcnJheShwcm9kdWN0cykgfHwgcHJvZHVjdHMubGVuZ3RoID09PSAwIHx8ICF0b3RhbEFtb3VudCkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogXCJNaXNzaW5nIHJlcXVpcmVkIGZpZWxkczogdXNlcklkLCBwcm9kdWN0cyAobm9uLWVtcHR5IGFycmF5KSwgdG90YWxBbW91bnRcIiBcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEtp4buDbSB0cmEgc+G7kSBsxrDhu6NuZyB04buTbiBraG8gdHLGsOG7m2Mga2hpIHThuqFvIMSRxqFuIGjDoG5nXHJcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgcHJvZHVjdHMpIHtcclxuICAgICAgY29uc3QgcHJvZHVjdCA9IGF3YWl0IFByb2R1Y3QuZmluZEJ5SWQoaXRlbS5wcm9kdWN0SWQpO1xyXG4gICAgICBpZiAoIXByb2R1Y3QpIHtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xyXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICBlcnJvcjogYFPhuqNuIHBo4bqpbSB24bubaSBJRCAke2l0ZW0ucHJvZHVjdElkfSBraMO0bmcgdOG7k24gdOG6oWlgXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGlmIChwcm9kdWN0LnByb2R1Y3RTdG9jayA8IGl0ZW0ucXVhbnRpdHkpIHtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICBlcnJvcjogYFPhuqNuIHBo4bqpbSBcIiR7cHJvZHVjdC5wcm9kdWN0TmFtZX1cIiBjaOG7iSBjw7JuICR7cHJvZHVjdC5wcm9kdWN0U3RvY2t9IHPhuqNuIHBo4bqpbSB0cm9uZyBraG9gXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gQ3JlYXRlIHRoZSBvcmRlciB3aXRoIGFsbCBmaWVsZHMgZnJvbSByZXF1ZXN0IGJvZHlcclxuICAgIGNvbnN0IG9yZGVyID0gbmV3IE9yZGVyKHJlcS5ib2R5KTtcclxuICAgIFxyXG4gICAgLy8gU2V0IGRlZmF1bHQgdmFsdWVzIGlmIG5vdCBwcm92aWRlZFxyXG4gICAgaWYgKCFvcmRlci5zdGF0dXMpIHtcclxuICAgICAgb3JkZXIuc3RhdHVzID0gcGF5bWVudE1ldGhvZCA9PT0gXCJjb2RcIiA/IFwicGVuZGluZ1wiIDogXCJhd2FpdGluZ19wYXltZW50XCI7XHJcbiAgICB9XHJcbiAgICBpZiAoIW9yZGVyLmNyZWF0ZWRBdCkge1xyXG4gICAgICBvcmRlci5jcmVhdGVkQXQgPSBuZXcgRGF0ZSgpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBU4bqhbyBtw6MgduG6rW4gxJHGoW4gbmfhuqt1IG5oacOqblxyXG4gICAgaWYgKCFvcmRlci5vcmRlckNvZGUpIHtcclxuICAgICAgb3JkZXIub3JkZXJDb2RlID0gZ2VuZXJhdGVPcmRlckNvZGUoKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gU2F2ZSB0aGUgb3JkZXJcclxuICAgIGF3YWl0IG9yZGVyLnNhdmUoKTtcclxuICAgIFxyXG4gICAgLy8gxJDhu5FpIHbhu5tpIGPDoWMgcGjGsMahbmcgdGjhu6ljIHRoYW5oIHRvw6FuIHRy4buxYyB0dXnhur9uIChraMO0bmcgcGjhuqNpIENPRCksIGdp4bqjbSBz4buRIGzGsOG7o25nIHPhuqNuIHBo4bqpbSBuZ2F5XHJcbiAgICBpZiAocGF5bWVudE1ldGhvZCAhPT0gXCJjb2RcIikge1xyXG4gICAgICAvLyBHaeG6o20gc+G7kSBsxrDhu6NuZyB04buTbiBraG8sIG5oxrBuZyBjaMawYSBj4bqtcCBuaOG6rXQgc29sZENvdW50XHJcbiAgICAgIGF3YWl0IHVwZGF0ZVByb2R1Y3RTdG9jayhwcm9kdWN0cywgZmFsc2UsIGZhbHNlKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gTOG6pXkgxJHGoW4gaMOgbmcgduG7m2kgdGjDtG5nIHRpbiDEkeG6p3kgxJHhu6cgYmFvIGfhu5NtIHRow7RuZyB0aW4gc+G6o24gcGjhuqltIMSR4buDIGfhu61pIGVtYWlsXHJcbiAgICBjb25zdCBwb3B1bGF0ZWRPcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRCeUlkKG9yZGVyLl9pZClcclxuICAgICAgLnBvcHVsYXRlKCd1c2VySWQnKVxyXG4gICAgICAucG9wdWxhdGUoJ3Byb2R1Y3RzLnByb2R1Y3RJZCcpO1xyXG4gICAgICBcclxuICAgIC8vIEfhu61pIGVtYWlsIHjDoWMgbmjhuq1uIG7hur91IMSRxqFuIGjDoG5nIMSRw6MgxJHGsOG7o2MgdOG6oW8gdGjDoG5oIGPDtG5nXHJcbiAgICBpZiAocG9wdWxhdGVkT3JkZXIgJiYgcG9wdWxhdGVkT3JkZXIudXNlcklkICYmIHBvcHVsYXRlZE9yZGVyLnVzZXJJZC5lbWFpbCkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIC8vIENodeG6qW4gYuG7iyB0aMO0bmcgdGluIGdpYW8gaMOgbmcgY2hvIGVtYWlsXHJcbiAgICAgICAgY29uc3Qgc2hpcHBpbmdJbmZvID0ge1xyXG4gICAgICAgICAgZnVsbE5hbWU6IGAke3BvcHVsYXRlZE9yZGVyLnVzZXJJZC5maXJzdE5hbWUgfHwgJyd9ICR7cG9wdWxhdGVkT3JkZXIudXNlcklkLmxhc3ROYW1lIHx8ICcnfWAudHJpbSgpLFxyXG4gICAgICAgICAgYWRkcmVzczogcG9wdWxhdGVkT3JkZXIuYWRkcmVzcyB8fCBwb3B1bGF0ZWRPcmRlci51c2VySWQuYWRkcmVzcyB8fCAnJyxcclxuICAgICAgICAgIHBob25lOiBwb3B1bGF0ZWRPcmRlci51c2VySWQucGhvbmUgfHwgJycsXHJcbiAgICAgICAgICBlbWFpbDogcG9wdWxhdGVkT3JkZXIudXNlcklkLmVtYWlsIHx8ICcnXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBUaMOqbSB0aMO0bmcgdGluIGdpYW8gaMOgbmcgdsOgbyDEkcahbiBow6BuZyDEkeG7gyBn4butaSBlbWFpbFxyXG4gICAgICAgIHBvcHVsYXRlZE9yZGVyLnNoaXBwaW5nSW5mbyA9IHNoaXBwaW5nSW5mbztcclxuICAgICAgICBcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlNlbmRpbmcgY29uZmlybWF0aW9uIGVtYWlsIHRvOlwiLCBwb3B1bGF0ZWRPcmRlci51c2VySWQuZW1haWwpO1xyXG4gICAgICAgIGNvbnN0IGVtYWlsU2VudCA9IGF3YWl0IHNlbmRPcmRlckNvbmZpcm1hdGlvbkVtYWlsKHBvcHVsYXRlZE9yZGVyKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkVtYWlsIHNlbnQgc3RhdHVzOlwiLCBlbWFpbFNlbnQgPyBcIlN1Y2Nlc3NcIiA6IFwiRmFpbGVkXCIpO1xyXG4gICAgICB9IGNhdGNoIChlbWFpbEVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHNlbmRpbmcgY29uZmlybWF0aW9uIGVtYWlsOlwiLCBlbWFpbEVycm9yKTtcclxuICAgICAgICAvLyBLaMO0bmcgdGhyb3cgZXJyb3IgbuG6v3UgZ+G7rWkgZW1haWwgdGjhuqV0IGLhuqFpIMSR4buDIGtow7RuZyDhuqNuaCBoxrDhu59uZyDEkeG6v24gbHXhu5NuZyDEkeG6t3QgaMOgbmdcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc29sZS5sb2coXCJNaXNzaW5nIGVtYWlsIGluZm9ybWF0aW9uIGZvciBvcmRlciBjb25maXJtYXRpb246XCIsIHtcclxuICAgICAgICBoYXNPcmRlcjogISFwb3B1bGF0ZWRPcmRlcixcclxuICAgICAgICBoYXNVc2VySWQ6ICEhKHBvcHVsYXRlZE9yZGVyICYmIHBvcHVsYXRlZE9yZGVyLnVzZXJJZCksXHJcbiAgICAgICAgaGFzRW1haWw6ICEhKHBvcHVsYXRlZE9yZGVyICYmIHBvcHVsYXRlZE9yZGVyLnVzZXJJZCAmJiBwb3B1bGF0ZWRPcmRlci51c2VySWQuZW1haWwpLFxyXG4gICAgICAgIGVtYWlsOiBwb3B1bGF0ZWRPcmRlciAmJiBwb3B1bGF0ZWRPcmRlci51c2VySWQgJiYgcG9wdWxhdGVkT3JkZXIudXNlcklkLmVtYWlsID8gcG9wdWxhdGVkT3JkZXIudXNlcklkLmVtYWlsIDogdW5kZWZpbmVkXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDEpLmpzb24ob3JkZXIpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNyZWF0aW5nIG9yZGVyOlwiLCBlcnIpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgXHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBlcnJvcjogZXJyLm1lc3NhZ2UgfHwgXCJM4buXaSBraGkgdOG6oW8gxJHGoW4gaMOgbmdcIlxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IG9yZGVyR2V0ID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHVzZXJJZCA9IHJlcS5xdWVyeS51c2VySWQgfHwgKHJlcS51c2VyICYmIHJlcS51c2VyLl9pZCA/IHJlcS51c2VyLl9pZCA6IHVuZGVmaW5lZCk7XHJcbiAgICBcclxuICAgIC8vIFPhu60gZOG7pW5nIHVzZXJJZCBu4bq/dSBjw7MsIG7hur91IGtow7RuZyB0cuG6oyB24buBIHThuqV0IGPhuqMgxJHGoW4gaMOgbmdcclxuICAgIGNvbnN0IHF1ZXJ5ID0gdXNlcklkID8geyB1c2VySWQgfSA6IHt9O1xyXG4gICAgXHJcbiAgICBjb25zdCBvcmRlcnMgPSBhd2FpdCBPcmRlci5maW5kKHF1ZXJ5KVxyXG4gICAgICAucG9wdWxhdGUoJ3VzZXJJZCcpXHJcbiAgICAgIC5wb3B1bGF0ZSgncHJvZHVjdHMucHJvZHVjdElkJylcclxuICAgICAgLnNvcnQoeyBjcmVhdGVkQXQ6IC0xIH0pO1xyXG4gICAgXHJcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbihvcmRlcnMpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIGVycm9yOiBlcnIubWVzc2FnZSBcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBvcmRlckdldEFsbCA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IHBhZ2UgPSAxLCBwYWdlU2l6ZSA9IDEwLCBzZWFyY2hUZXJtLCBzdGF0dXMsIHBheW1lbnRNZXRob2QsIGlzUGFpZCwgZGF0ZSwgYnJhbmNoSWQgfSA9IHJlcS5xdWVyeTtcclxuICAgIFxyXG4gICAgY29uc29sZS5sb2coXCJvcmRlckdldEFsbCDEkcaw4bujYyBn4buNaSB24bubaSBjw6FjIHRoYW0gc+G7kTpcIik7XHJcbiAgICBjb25zb2xlLmxvZyhcIlF1ZXJ5IHBhcmFtczpcIiwgcmVxLnF1ZXJ5KTtcclxuICAgIFxyXG4gICAgLy8gWMOieSBk4buxbmcgcXVlcnkgZOG7sWEgdHLDqm4gY8OhYyB0aGFtIHPhu5FcclxuICAgIGNvbnN0IHF1ZXJ5ID0ge307XHJcbiAgICBjb25zb2xlLmxvZyhcIlF1ZXJ5IGJhbiDEkeG6p3U6XCIsIEpTT04uc3RyaW5naWZ5KHF1ZXJ5KSk7XHJcbiAgICBcclxuICAgIC8vIFRow6ptIMSRaeG7gXUga2nhu4duIGzhu41jIHRoZW8gY2hpIG5ow6FuaCBu4bq/dSBjw7NcclxuICAgIGlmIChicmFuY2hJZCkge1xyXG4gICAgICBxdWVyeS5icmFuY2hJZCA9IGJyYW5jaElkO1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlRow6ptIMSRaeG7gXUga2nhu4duIGJyYW5jaElkOlwiLCBicmFuY2hJZCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFRow6ptIMSRaeG7gXUga2nhu4duIHTDrG0ga2nhur9tIG7hur91IGPDs1xyXG4gICAgaWYgKHNlYXJjaFRlcm0pIHtcclxuICAgICAgLy8gVMOsbSBraeG6v20gdGhlbyBtw6MgxJHGoW4gaMOgbmcsIHRow7RuZyB0aW4gbmfGsOG7nWkgZMO5bmcgdsOgIHRow7RuZyB0aW4gZ2lhbyBow6BuZ1xyXG4gICAgICBxdWVyeS4kb3IgPSBbXHJcbiAgICAgICAgeyBvcmRlckNvZGU6IHsgJHJlZ2V4OiBzZWFyY2hUZXJtLCAkb3B0aW9uczogJ2knIH0gfSxcclxuICAgICAgICB7IG5vdGVzOiB7ICRyZWdleDogc2VhcmNoVGVybSwgJG9wdGlvbnM6ICdpJyB9IH1cclxuICAgICAgXTtcclxuICAgICAgXHJcbiAgICAgIC8vIFTDrG0ga2nhur9tIHRoZW8gdGjDtG5nIHRpbiBuZ8aw4budaSBkw7luZyAoY+G6p24gcG9wdWxhdGUgdHLGsOG7m2MpXHJcbiAgICAgIGNvbnN0IHVzZXJzV2l0aFNlYXJjaFRlcm0gPSBhd2FpdCBtb25nb29zZS5tb2RlbCgnVXNlcicpLmZpbmQoe1xyXG4gICAgICAgICRvcjogW1xyXG4gICAgICAgICAgeyBmaXJzdE5hbWU6IHsgJHJlZ2V4OiBzZWFyY2hUZXJtLCAkb3B0aW9uczogJ2knIH0gfSxcclxuICAgICAgICAgIHsgbGFzdE5hbWU6IHsgJHJlZ2V4OiBzZWFyY2hUZXJtLCAkb3B0aW9uczogJ2knIH0gfSxcclxuICAgICAgICAgIHsgcGhvbmU6IHsgJHJlZ2V4OiBzZWFyY2hUZXJtLCAkb3B0aW9uczogJ2knIH0gfSxcclxuICAgICAgICAgIHsgZW1haWw6IHsgJHJlZ2V4OiBzZWFyY2hUZXJtLCAkb3B0aW9uczogJ2knIH0gfVxyXG4gICAgICAgIF1cclxuICAgICAgfSkuc2VsZWN0KCdfaWQnKTtcclxuICAgICAgXHJcbiAgICAgIGlmICh1c2Vyc1dpdGhTZWFyY2hUZXJtLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBjb25zdCB1c2VySWRzID0gdXNlcnNXaXRoU2VhcmNoVGVybS5tYXAodXNlciA9PiB1c2VyLl9pZCk7XHJcbiAgICAgICAgcXVlcnkuJG9yLnB1c2goeyB1c2VySWQ6IHsgJGluOiB1c2VySWRzIH0gfSk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vIFTDrG0ga2nhur9tIHRyb25nIHRow7RuZyB0aW4gZ2lhbyBow6BuZ1xyXG4gICAgICBxdWVyeS4kb3IucHVzaCh7ICdzaGlwcGluZ0luZm8uYWRkcmVzcyc6IHsgJHJlZ2V4OiBzZWFyY2hUZXJtLCAkb3B0aW9uczogJ2knIH0gfSk7XHJcbiAgICAgIHF1ZXJ5LiRvci5wdXNoKHsgJ3NoaXBwaW5nSW5mby5waG9uZSc6IHsgJHJlZ2V4OiBzZWFyY2hUZXJtLCAkb3B0aW9uczogJ2knIH0gfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFRow6ptIMSRaeG7gXUga2nhu4duIGzhu41jIHRoZW8gdHLhuqFuZyB0aMOhaVxyXG4gICAgaWYgKHN0YXR1cykge1xyXG4gICAgICBxdWVyeS5zdGF0dXMgPSBzdGF0dXM7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiVGjDqm0gxJFp4buBdSBraeG7h24gc3RhdHVzOlwiLCBzdGF0dXMpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBUaMOqbSDEkWnhu4F1IGtp4buHbiBs4buNYyB0aGVvIHBoxrDGoW5nIHRo4bupYyB0aGFuaCB0b8OhblxyXG4gICAgaWYgKHBheW1lbnRNZXRob2QpIHtcclxuICAgICAgcXVlcnkucGF5bWVudE1ldGhvZCA9IHBheW1lbnRNZXRob2Q7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiVGjDqm0gxJFp4buBdSBraeG7h24gcGF5bWVudE1ldGhvZDpcIiwgcGF5bWVudE1ldGhvZCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFRow6ptIMSRaeG7gXUga2nhu4duIGzhu41jIHRoZW8gdHLhuqFuZyB0aMOhaSB0aGFuaCB0b8OhblxyXG4gICAgaWYgKGlzUGFpZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHF1ZXJ5LmlzUGFpZCA9IGlzUGFpZCA9PT0gJ3RydWUnO1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlRow6ptIMSRaeG7gXUga2nhu4duIGlzUGFpZDpcIiwgaXNQYWlkKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gVGjDqm0gxJFp4buBdSBraeG7h24gbOG7jWMgdGhlbyBuZ8OgeVxyXG4gICAgaWYgKGRhdGUpIHtcclxuICAgICAgY29uc3Qgc3RhcnREYXRlID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgICAgIHN0YXJ0RGF0ZS5zZXRIb3VycygwLCAwLCAwLCAwKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IGVuZERhdGUgPSBuZXcgRGF0ZShkYXRlKTtcclxuICAgICAgZW5kRGF0ZS5zZXRIb3VycygyMywgNTksIDU5LCA5OTkpO1xyXG4gICAgICBcclxuICAgICAgcXVlcnkuY3JlYXRlZEF0ID0geyAkZ3RlOiBzdGFydERhdGUsICRsdGU6IGVuZERhdGUgfTtcclxuICAgICAgY29uc29sZS5sb2coXCJUaMOqbSDEkWnhu4F1IGtp4buHbiBkYXRlOlwiLCBkYXRlKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgY29uc29sZS5sb2coXCJRdWVyeSBjdeG7kWkgY8O5bmc6XCIsIEpTT04uc3RyaW5naWZ5KHF1ZXJ5KSk7XHJcbiAgICBcclxuICAgIC8vIFTDrW5oIHRvw6FuIHBow6JuIHRyYW5nXHJcbiAgICBjb25zdCBza2lwID0gKHBhcnNlSW50KHBhZ2UpIC0gMSkgKiBwYXJzZUludChwYWdlU2l6ZSk7XHJcbiAgICBjb25zdCBsaW1pdCA9IHBhcnNlSW50KHBhZ2VTaXplKTtcclxuICAgIFxyXG4gICAgLy8gxJDhur9tIHThu5VuZyBz4buRIMSRxqFuIGjDoG5nIHRo4buPYSBtw6NuIMSRaeG7gXUga2nhu4duXHJcbiAgICBjb25zdCB0b3RhbENvdW50ID0gYXdhaXQgT3JkZXIuY291bnREb2N1bWVudHMocXVlcnkpO1xyXG4gICAgY29uc29sZS5sb2coXCJU4buVbmcgc+G7kSDEkcahbiBow6BuZyB0w6xtIHRo4bqleTpcIiwgdG90YWxDb3VudCk7XHJcbiAgICBcclxuICAgIC8vIEzhuqV5IGRhbmggc8OhY2ggxJHGoW4gaMOgbmcgdGhlbyDEkWnhu4F1IGtp4buHbiB2w6AgcGjDom4gdHJhbmdcclxuICAgIGNvbnN0IG9yZGVycyA9IGF3YWl0IE9yZGVyLmZpbmQocXVlcnkpXHJcbiAgICAgIC5wb3B1bGF0ZShcInVzZXJJZFwiKVxyXG4gICAgICAucG9wdWxhdGUoJ3Byb2R1Y3RzLnByb2R1Y3RJZCcpXHJcbiAgICAgIC5wb3B1bGF0ZSgnYnJhbmNoSWQnKVxyXG4gICAgICAuc29ydCh7IGNyZWF0ZWRBdDogLTEgfSlcclxuICAgICAgLnNraXAoc2tpcClcclxuICAgICAgLmxpbWl0KGxpbWl0KTtcclxuICAgIFxyXG4gICAgY29uc29sZS5sb2coXCJT4buRIMSRxqFuIGjDoG5nIHRy4bqjIHbhu4E6XCIsIG9yZGVycy5sZW5ndGgpO1xyXG4gICAgXHJcbiAgICAvLyBM4bqleSB0aOG7kW5nIGvDqiDEkcahbiBow6BuZyB0aGVvIHRy4bqhbmcgdGjDoWlcclxuICAgIGNvbnN0IHN0YXRzID0ge1xyXG4gICAgICB0b3RhbDogdG90YWxDb3VudCxcclxuICAgICAgcGVuZGluZzogYXdhaXQgT3JkZXIuY291bnREb2N1bWVudHMoeyAuLi5xdWVyeSwgc3RhdHVzOiAncGVuZGluZycgfSksXHJcbiAgICAgIGNvbmZpcm1lZDogYXdhaXQgT3JkZXIuY291bnREb2N1bWVudHMoeyAuLi5xdWVyeSwgc3RhdHVzOiAnY29uZmlybWVkJyB9KSxcclxuICAgICAgcHJlcGFyaW5nOiBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cyh7IC4uLnF1ZXJ5LCBzdGF0dXM6ICdwcmVwYXJpbmcnIH0pLFxyXG4gICAgICBwYWNrYWdpbmc6IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHsgLi4ucXVlcnksIHN0YXR1czogJ3BhY2thZ2luZycgfSksXHJcbiAgICAgIHNoaXBwaW5nOiBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cyh7IC4uLnF1ZXJ5LCBzdGF0dXM6ICdzaGlwcGluZycgfSksXHJcbiAgICAgIGRlbGl2ZXJpbmc6IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHsgLi4ucXVlcnksIHN0YXR1czogJ2RlbGl2ZXJpbmcnIH0pLFxyXG4gICAgICBjb21wbGV0ZWQ6IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHsgLi4ucXVlcnksIHN0YXR1czogJ2NvbXBsZXRlZCcgfSksXHJcbiAgICAgIGNhbmNlbGxlZDogYXdhaXQgT3JkZXIuY291bnREb2N1bWVudHMoeyAuLi5xdWVyeSwgc3RhdHVzOiAnY2FuY2VsbGVkJyB9KSxcclxuICAgICAgZGVsaXZlcnlfZmFpbGVkOiBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cyh7IC4uLnF1ZXJ5LCBzdGF0dXM6ICdkZWxpdmVyeV9mYWlsZWQnIH0pLFxyXG4gICAgICBhd2FpdGluZ19wYXltZW50OiBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cyh7IC4uLnF1ZXJ5LCBzdGF0dXM6ICdhd2FpdGluZ19wYXltZW50JyB9KSxcclxuICAgIH07XHJcbiAgICBcclxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgb3JkZXJzLFxyXG4gICAgICB0b3RhbENvdW50LFxyXG4gICAgICBzdGF0c1xyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIGzhuqV5IHThuqV0IGPhuqMgxJHGoW4gaMOgbmc6XCIsIGVycik7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IFxyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgZXJyb3I6IGVyci5tZXNzYWdlIFxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IG9yZGVyR2V0QnlJZCA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBvcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRCeUlkKHJlcS5wYXJhbXMuaWQpXHJcbiAgICAgIC5wb3B1bGF0ZShcInVzZXJJZFwiKVxyXG4gICAgICAucG9wdWxhdGUoJ3Byb2R1Y3RzLnByb2R1Y3RJZCcpO1xyXG4gICAgXHJcbiAgICBpZiAoIW9yZGVyKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IMSRxqFuIGjDoG5nXCIgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlcy5qc29uKG9yZGVyKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIEjDoG0gY+G6rXAgbmjhuq10IHRow7RuZyB0aW4gxJHGoW4gaMOgbmdcclxuZXhwb3J0IGNvbnN0IHVwZGF0ZU9yZGVyID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IG9yZGVySWQgPSByZXEucGFyYW1zLmlkO1xyXG4gICAgY29uc3QgdXBkYXRlRGF0YSA9IHJlcS5ib2R5O1xyXG4gICAgXHJcbiAgICBjb25zb2xlLmxvZyhcInVwZGF0ZU9yZGVyIMSRxrDhu6NjIGfhu41pIHbhu5tpIGThu68gbGnhu4d1OlwiLCBKU09OLnN0cmluZ2lmeSh1cGRhdGVEYXRhKSk7XHJcbiAgICBcclxuICAgIC8vIFTDrG0gdsOgIGPhuq1wIG5o4bqtdCDEkcahbiBow6BuZ1xyXG4gICAgY29uc3Qgb3JkZXIgPSBhd2FpdCBPcmRlci5maW5kQnlJZChvcmRlcklkKVxyXG4gICAgICAucG9wdWxhdGUoXCJ1c2VySWRcIiwgXCJmaXJzdE5hbWUgbGFzdE5hbWUgdXNlck5hbWUgZW1haWwgcGhvbmUgYWRkcmVzc1wiKVxyXG4gICAgICAucG9wdWxhdGUoXCJwcm9kdWN0cy5wcm9kdWN0SWRcIik7XHJcbiAgICBcclxuICAgIGlmICghb3JkZXIpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgXHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsIFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IMSRxqFuIGjDoG5nXCIgXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBMxrB1IHRy4bqhbmcgdGjDoWkgY8WpIHRyxrDhu5tjIGtoaSBj4bqtcCBuaOG6rXRcclxuICAgIGNvbnN0IHByZXZpb3VzU3RhdHVzID0gb3JkZXIuc3RhdHVzO1xyXG4gICAgY29uc3QgbmV3U3RhdHVzID0gdXBkYXRlRGF0YS5zdGF0dXM7XHJcblxyXG4gICAgLy8gTOG7jWMgY8OhYyB0csaw4budbmcgxJHGsOG7o2MgcGjDqXAgY+G6rXAgbmjhuq10XHJcbiAgICBjb25zdCBhbGxvd2VkRmllbGRzID0gWydzdGF0dXMnLCAnb3JkZXJDb2RlJywgJ3NoaXBwaW5nSW5mbycsICdub3RlcyddO1xyXG4gICAgY29uc3QgZmlsdGVyZWREYXRhID0ge307XHJcbiAgICBcclxuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKHVwZGF0ZURhdGEpKSB7XHJcbiAgICAgIGlmIChhbGxvd2VkRmllbGRzLmluY2x1ZGVzKGtleSkpIHtcclxuICAgICAgICBmaWx0ZXJlZERhdGFba2V5XSA9IHVwZGF0ZURhdGFba2V5XTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBO4bq/dSBraMO0bmcgY8OzIG9yZGVyQ29kZSBuaMawbmcgY+G6p24gdGjDqm0sIHThuqFvIG3hu5l0IG3DoyB24bqtbiDEkcahbiBt4bubaVxyXG4gICAgaWYgKCFvcmRlci5vcmRlckNvZGUgJiYgIWZpbHRlcmVkRGF0YS5vcmRlckNvZGUpIHtcclxuICAgICAgZmlsdGVyZWREYXRhLm9yZGVyQ29kZSA9IGdlbmVyYXRlT3JkZXJDb2RlKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFRIw4pNIE3hu5pJOiBY4butIGzDvSBj4bqtcCBuaOG6rXQgdHJhY2tpbmdfbG9ncyBraGkgY8OzIHRoYXkgxJHhu5VpIHRy4bqhbmcgdGjDoWlcclxuICAgIGlmIChuZXdTdGF0dXMgJiYgbmV3U3RhdHVzICE9PSBwcmV2aW91c1N0YXR1cykge1xyXG4gICAgICAvLyBLaOG7n2kgdOG6oW8gdHJhY2tpbmcgb2JqZWN0IG7hur91IGNoxrBhIGPDs1xyXG4gICAgICBpZiAoIW9yZGVyLnRyYWNraW5nKSB7XHJcbiAgICAgICAgb3JkZXIudHJhY2tpbmcgPSB7IHN0YXR1c19uYW1lOiBcIlwiLCB0cmFja2luZ19sb2dzOiBbXSB9O1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBM4bqleSB0w6puIGhp4buDbiB0aOG7iyBjaG8gdHLhuqFuZyB0aMOhaVxyXG4gICAgICBsZXQgc3RhdHVzTmFtZSA9IFwiXCI7XHJcbiAgICAgIHN3aXRjaCAobmV3U3RhdHVzKSB7XHJcbiAgICAgICAgY2FzZSAncGVuZGluZyc6IHN0YXR1c05hbWUgPSBcIkNo4budIHjhu60gbMO9XCI7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2NvbmZpcm1lZCc6IHN0YXR1c05hbWUgPSBcIsSQw6MgeMOhYyBuaOG6rW5cIjsgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAncHJvY2Vzc2luZyc6IHN0YXR1c05hbWUgPSBcIsSQYW5nIHjhu60gbMO9XCI7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ3ByZXBhcmluZyc6IHN0YXR1c05hbWUgPSBcIsSQYW5nIGNodeG6qW4gYuG7iyBow6BuZ1wiOyBicmVhaztcclxuICAgICAgICBjYXNlICdwYWNrYWdpbmcnOiBzdGF0dXNOYW1lID0gXCJIb8OgbiB04bqldCDEkcOzbmcgZ8OzaVwiOyBicmVhaztcclxuICAgICAgICBjYXNlICdzaGlwcGluZyc6IHN0YXR1c05hbWUgPSBcIsSQYW5nIHbhuq1uIGNodXnhu4NuXCI7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ3NoaXBwZWQnOiBzdGF0dXNOYW1lID0gXCLEkMOjIGdpYW8gY2hvIHbhuq1uIGNodXnhu4NuXCI7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2RlbGl2ZXJpbmcnOiBzdGF0dXNOYW1lID0gXCLEkGFuZyBnaWFvIGjDoG5nXCI7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2RlbGl2ZXJlZCc6IHN0YXR1c05hbWUgPSBcIsSQw6MgZ2lhbyBow6BuZ1wiOyBicmVhaztcclxuICAgICAgICBjYXNlICdjb21wbGV0ZWQnOiBzdGF0dXNOYW1lID0gXCJIb8OgbiB0aMOgbmhcIjsgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnY2FuY2VsbGVkJzogc3RhdHVzTmFtZSA9IFwixJDDoyBo4buneVwiOyBicmVhaztcclxuICAgICAgICBjYXNlICdhd2FpdGluZ19wYXltZW50Jzogc3RhdHVzTmFtZSA9IFwiQ2jhu50gdGhhbmggdG/DoW5cIjsgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAncmVmdW5kZWQnOiBzdGF0dXNOYW1lID0gXCLEkMOjIGhvw6BuIHRp4buBblwiOyBicmVhaztcclxuICAgICAgICBjYXNlICdmYWlsZWQnOiBzdGF0dXNOYW1lID0gXCJUaOG6pXQgYuG6oWlcIjsgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnZGVsaXZlcnlfZmFpbGVkJzogc3RhdHVzTmFtZSA9IFwiR2lhbyBow6BuZyB0aOG6pXQgYuG6oWlcIjsgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDogc3RhdHVzTmFtZSA9IG5ld1N0YXR1cztcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy8gVGjDqm0gYuG6o24gZ2hpIG3hu5tpIHbDoG8gxJHhuqd1IG3huqNuZyB0cmFja2luZ19sb2dzXHJcbiAgICAgIGNvbnN0IG5ld1RyYWNraW5nTG9nID0ge1xyXG4gICAgICAgIHN0YXR1czogbmV3U3RhdHVzLFxyXG4gICAgICAgIHN0YXR1c19uYW1lOiBzdGF0dXNOYW1lLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgIGxvY2F0aW9uOiBcIkPhu61hIGjDoG5nIEROQyBGT09EXCIsXHJcbiAgICAgIH07XHJcbiAgICAgIFxyXG4gICAgICAvLyBLaOG7n2kgdOG6oW8gbeG6o25nIHRyYWNraW5nX2xvZ3MgbuG6v3UgY2jGsGEgY8OzXHJcbiAgICAgIGlmICghb3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncykge1xyXG4gICAgICAgIG9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3MgPSBbXTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy8gVGjDqm0gbG9nIG3hu5tpIHbDoG8gxJHhuqd1IG3huqNuZyAoxJHhu4MgbG9nIG3hu5tpIG5o4bqldCBu4bqxbSDEkeG6p3UgdGnDqm4pXHJcbiAgICAgIG9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3MudW5zaGlmdChuZXdUcmFja2luZ0xvZyk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBD4bqtcCBuaOG6rXQgc3RhdHVzX25hbWUgY2jDrW5oXHJcbiAgICAgIG9yZGVyLnRyYWNraW5nLnN0YXR1c19uYW1lID0gc3RhdHVzTmFtZTtcclxuICAgICAgXHJcbiAgICAgIC8vIEzGsHUgdHJhY2tpbmcgdsOgbyBmaWx0ZXJlZERhdGEgxJHhu4MgY+G6rXAgbmjhuq10XHJcbiAgICAgIGZpbHRlcmVkRGF0YS50cmFja2luZyA9IG9yZGVyLnRyYWNraW5nO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBO4bq/dSDEkWFuZyBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSB0aMOgbmggJ2NvbXBsZXRlZCcsIHThu7EgxJHhu5luZyDEkcOhbmggZOG6pXUgxJHDoyB0aGFuaCB0b8OhblxyXG4gICAgaWYgKG5ld1N0YXR1cyA9PT0gJ2NvbXBsZXRlZCcpIHtcclxuICAgICAgZmlsdGVyZWREYXRhLmlzUGFpZCA9IHRydWU7XHJcbiAgICAgIGZpbHRlcmVkRGF0YS5jb21wbGV0ZWRBdCA9IG5ldyBEYXRlKCk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBO4bq/dSDEkcahbiBow6BuZyBsw6AgQ09EIHbDoCBjaMawYSBj4bqtcCBuaOG6rXQga2hvIHRow6wgZ2nhuqNtIHPhu5EgbMaw4bujbmcgdsOgIHTEg25nIHNvbGRDb3VudFxyXG4gICAgICBpZiAob3JkZXIucGF5bWVudE1ldGhvZCA9PT0gXCJjb2RcIiAmJiAhb3JkZXIuaXNQYWlkKSB7XHJcbiAgICAgICAgYXdhaXQgdXBkYXRlUHJvZHVjdFN0b2NrKG9yZGVyLnByb2R1Y3RzLCBmYWxzZSwgdHJ1ZSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQ+G6rXAgbmjhuq10IHRow7RuZyB0aW4gc+G6o24gcGjhuqltIGLDoW4gY2jhuqF5XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIC8vIFThuqNpIHRow7RuZyB0aW4gY2hpIHRp4bq/dCBz4bqjbiBwaOG6qW1cclxuICAgICAgICAgIGNvbnN0IHBvcHVsYXRlZE9yZGVyID0gYXdhaXQgT3JkZXIuZmluZEJ5SWQob3JkZXJJZCkucG9wdWxhdGUoXCJwcm9kdWN0cy5wcm9kdWN0SWRcIik7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIEPhuq1wIG5o4bqtdCB04burbmcgc+G6o24gcGjhuqltIHRyb25nIMSRxqFuIGjDoG5nXHJcbiAgICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgcG9wdWxhdGVkT3JkZXIucHJvZHVjdHMpIHtcclxuICAgICAgICAgICAgaWYgKGl0ZW0ucHJvZHVjdElkKSB7XHJcbiAgICAgICAgICAgICAgYXdhaXQgQmVzdFNlbGxpbmdQcm9kdWN0LnVwZGF0ZVNhbGVzRGF0YShcclxuICAgICAgICAgICAgICAgIGl0ZW0ucHJvZHVjdElkLl9pZCxcclxuICAgICAgICAgICAgICAgIGl0ZW0ucHJvZHVjdElkLFxyXG4gICAgICAgICAgICAgICAgaXRlbS5xdWFudGl0eSxcclxuICAgICAgICAgICAgICAgIG9yZGVySWRcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoYmVzdFNlbGxlckVycm9yKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIGPhuq1wIG5o4bqtdCBz4bqjbiBwaOG6qW0gYsOhbiBjaOG6oXk6XCIsIGJlc3RTZWxsZXJFcnJvcik7XHJcbiAgICAgICAgICAvLyBLaMO0bmcgdHLhuqMgduG7gSBs4buXaSwgduG6q24gdGnhur9wIHThu6VjIHjhu60gbMO9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIC8vIE7hur91IHRoYW5oIHRvw6FuIG9ubGluZSB2w6Agc3RhdHVzIGtow6FjIGF3YWl0aW5nX3BheW1lbnQgdGjDrCBj4bqtcCBuaOG6rXQgc29sZENvdW50XHJcbiAgICAgIGVsc2UgaWYgKG9yZGVyLnBheW1lbnRNZXRob2QgIT09IFwiY29kXCIgJiYgb3JkZXIuc3RhdHVzICE9PSBcImF3YWl0aW5nX3BheW1lbnRcIikge1xyXG4gICAgICAgIC8vIENo4buJIGPhuq1wIG5o4bqtdCBzb2xkQ291bnQgbcOgIGtow7RuZyB0cuG7qyBraG8gKMSRw6MgdHLhu6sgbMO6YyB04bqhbyDEkcahbilcclxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygb3JkZXIucHJvZHVjdHMpIHtcclxuICAgICAgICAgIGNvbnN0IHByb2R1Y3QgPSBhd2FpdCBQcm9kdWN0LmZpbmRCeUlkKGl0ZW0ucHJvZHVjdElkKTtcclxuICAgICAgICAgIGlmIChwcm9kdWN0KSB7XHJcbiAgICAgICAgICAgIHByb2R1Y3Quc29sZENvdW50ID0gKHByb2R1Y3Quc29sZENvdW50IHx8IDApICsgaXRlbS5xdWFudGl0eTtcclxuICAgICAgICAgICAgYXdhaXQgcHJvZHVjdC5zYXZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEPhuq1wIG5o4bqtdCB0aMO0bmcgdGluIHPhuqNuIHBo4bqpbSBiw6FuIGNo4bqheVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAvLyBU4bqjaSB0aMO0bmcgdGluIGNoaSB0aeG6v3Qgc+G6o24gcGjhuqltXHJcbiAgICAgICAgICBjb25zdCBwb3B1bGF0ZWRPcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRCeUlkKG9yZGVySWQpLnBvcHVsYXRlKFwicHJvZHVjdHMucHJvZHVjdElkXCIpO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBD4bqtcCBuaOG6rXQgdOG7q25nIHPhuqNuIHBo4bqpbSB0cm9uZyDEkcahbiBow6BuZ1xyXG4gICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHBvcHVsYXRlZE9yZGVyLnByb2R1Y3RzKSB7XHJcbiAgICAgICAgICAgIGlmIChpdGVtLnByb2R1Y3RJZCkge1xyXG4gICAgICAgICAgICAgIGF3YWl0IEJlc3RTZWxsaW5nUHJvZHVjdC51cGRhdGVTYWxlc0RhdGEoXHJcbiAgICAgICAgICAgICAgICBpdGVtLnByb2R1Y3RJZC5faWQsXHJcbiAgICAgICAgICAgICAgICBpdGVtLnByb2R1Y3RJZCxcclxuICAgICAgICAgICAgICAgIGl0ZW0ucXVhbnRpdHksXHJcbiAgICAgICAgICAgICAgICBvcmRlcklkXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGJlc3RTZWxsZXJFcnJvcikge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSBj4bqtcCBuaOG6rXQgc+G6o24gcGjhuqltIGLDoW4gY2jhuqF5OlwiLCBiZXN0U2VsbGVyRXJyb3IpO1xyXG4gICAgICAgICAgLy8gS2jDtG5nIHRy4bqjIHbhu4EgbOG7l2ksIHbhuqtuIHRp4bq/cCB04bulYyB44butIGzDvVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBO4bq/dSDEkWFuZyBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSB0aMOgbmggJ2NhbmNlbGxlZCcsIGtp4buDbSB0cmEgeGVtIGPDsyB0aOG7gyBo4buneSBraMO0bmdcclxuICAgIGlmIChuZXdTdGF0dXMgPT09ICdjYW5jZWxsZWQnKSB7XHJcbiAgICAgIC8vIE5nxINuIGNo4bq3biB2aeG7h2MgaOG7p3kgxJHGoW4gaMOgbmcgxJHDoyBnaWFvIGhv4bq3YyDEkWFuZyBnaWFvXHJcbiAgICAgIGlmIChwcmV2aW91c1N0YXR1cyA9PT0gJ2NvbXBsZXRlZCcgfHwgcHJldmlvdXNTdGF0dXMgPT09ICdkZWxpdmVyaW5nJykge1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgIG1lc3NhZ2U6IHByZXZpb3VzU3RhdHVzID09PSBcImRlbGl2ZXJpbmdcIiBcclxuICAgICAgICAgICAgPyBcIktow7RuZyB0aOG7gyBo4buneSDEkcahbiBow6BuZyDEkWFuZyBnaWFvXCIgXHJcbiAgICAgICAgICAgIDogXCJLaMO0bmcgdGjhu4MgaOG7p3kgxJHGoW4gaMOgbmcgxJHDoyBnaWFvXCJcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy8gS2hpIGjhu6d5IMSRxqFuIGjDoG5nIHRoYW5oIHRvw6FuIG9ubGluZSwgY+G6p24gdHLhuqMgbOG6oWkgc+G7kSBsxrDhu6NuZyB04buTbiBraG9cclxuICAgICAgaWYgKG9yZGVyLnBheW1lbnRNZXRob2QgIT09IFwiY29kXCIpIHtcclxuICAgICAgICBhd2FpdCB1cGRhdGVQcm9kdWN0U3RvY2sob3JkZXIucHJvZHVjdHMsIHRydWUsIGZhbHNlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBD4bqtcCBuaOG6rXQgxJHGoW4gaMOgbmdcclxuICAgIGNvbnN0IHVwZGF0ZWRPcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRCeUlkQW5kVXBkYXRlKFxyXG4gICAgICBvcmRlcklkLFxyXG4gICAgICB7ICRzZXQ6IGZpbHRlcmVkRGF0YSB9LFxyXG4gICAgICB7IG5ldzogdHJ1ZSB9XHJcbiAgICApLnBvcHVsYXRlKFwidXNlcklkXCIpLnBvcHVsYXRlKFwicHJvZHVjdHMucHJvZHVjdElkXCIpO1xyXG4gICAgXHJcbiAgICAvLyBH4busSSBFTUFJTCBUSMOUTkcgQsOBTyBLSEkgQ0hVWeG7gk4gVFLhuqBORyBUSMOBSSBTQU5HIFwiREVMSVZFUklOR1wiXHJcbiAgICBpZiAobmV3U3RhdHVzID09PSAnZGVsaXZlcmluZycgJiYgcHJldmlvdXNTdGF0dXMgIT09ICdkZWxpdmVyaW5nJykge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwixJBhbmcgY2h14bqpbiBi4buLIGfhu61pIGVtYWlsIHRow7RuZyBiw6FvIGdpYW8gaMOgbmcuLi5cIik7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJUaMO0bmcgdGluIMSRxqFuIGjDoG5nIMSR4buDIGfhu61pIGVtYWlsOlwiLCB7XHJcbiAgICAgICAgICBvcmRlckNvZGU6IG9yZGVyLm9yZGVyQ29kZSxcclxuICAgICAgICAgIGVtYWlsOiBvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLmVtYWlsID8gb3JkZXIudXNlcklkLmVtYWlsIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgYWRkcmVzczogb3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC5hZGRyZXNzID8gb3JkZXIudXNlcklkLmFkZHJlc3MgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICBwaG9uZTogb3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC5waG9uZSA/IG9yZGVyLnVzZXJJZC5waG9uZSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgIHVzZXJOYW1lOiBvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLnVzZXJOYW1lID8gb3JkZXIudXNlcklkLnVzZXJOYW1lIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgZmlyc3ROYW1lOiBvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLmZpcnN0TmFtZSA/IG9yZGVyLnVzZXJJZC5maXJzdE5hbWUgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICBsYXN0TmFtZTogb3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC5sYXN0TmFtZSA/IG9yZGVyLnVzZXJJZC5sYXN0TmFtZSA6IHVuZGVmaW5lZCxcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDEkOG6o20gYuG6o28gb3JkZXIudXNlcklkIMSRw6MgxJHGsOG7o2MgcG9wdWxhdGUgxJHhuqd5IMSR4bunXHJcbiAgICAgICAgaWYgKG9yZGVyLnVzZXJJZCAmJiB0eXBlb2Ygb3JkZXIudXNlcklkID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgLy8gR+G7rWkgZW1haWwgdGjDtG5nIGLDoW8gxJHGoW4gaMOgbmcgxJFhbmcgxJHGsOG7o2MgZ2lhb1xyXG4gICAgICAgICAgY29uc3QgZW1haWxTZW50ID0gYXdhaXQgc2VuZE9yZGVyU2hpcHBpbmdFbWFpbChvcmRlcik7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGlmIChlbWFpbFNlbnQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYMSQw6MgZ+G7rWkgZW1haWwgdGjDtG5nIGLDoW8gZ2lhbyBow6BuZyBjaG8gxJHGoW4gaMOgbmcgIyR7b3JkZXIub3JkZXJDb2RlIHx8IG9yZGVyLl9pZH1gKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBLaMO0bmcgdGjhu4MgZ+G7rWkgZW1haWwgdGjDtG5nIGLDoW8gZ2lhbyBow6BuZyBjaG8gxJHGoW4gaMOgbmcgIyR7b3JkZXIub3JkZXJDb2RlIHx8IG9yZGVyLl9pZH1gKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJDaGkgdGnhur90IMSRxqFuIGjDoG5nOlwiLCBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgaWQ6IG9yZGVyLl9pZCxcclxuICAgICAgICAgICAgICBvcmRlckNvZGU6IG9yZGVyLm9yZGVyQ29kZSxcclxuICAgICAgICAgICAgICB1c2VySWQ6IHtcclxuICAgICAgICAgICAgICAgIGVtYWlsOiBvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLmVtYWlsID8gb3JkZXIudXNlcklkLmVtYWlsIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgZmlyc3ROYW1lOiBvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLmZpcnN0TmFtZSA/IG9yZGVyLnVzZXJJZC5maXJzdE5hbWUgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICBsYXN0TmFtZTogb3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC5sYXN0TmFtZSA/IG9yZGVyLnVzZXJJZC5sYXN0TmFtZSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgIGFkZHJlc3M6IG9yZGVyLnVzZXJJZCAmJiBvcmRlci51c2VySWQuYWRkcmVzcyA/IG9yZGVyLnVzZXJJZC5hZGRyZXNzIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgcGhvbmU6IG9yZGVyLnVzZXJJZCAmJiBvcmRlci51c2VySWQucGhvbmUgPyBvcmRlci51c2VySWQucGhvbmUgOiB1bmRlZmluZWRcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIG51bGwsIDIpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJLaMO0bmcgdGjhu4MgZ+G7rWkgZW1haWw6IG9yZGVyLnVzZXJJZCBraMO0bmcgxJHGsOG7o2MgcG9wdWxhdGUgxJHhuqd5IMSR4bunXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaCAoZW1haWxFcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0zhu5dpIGtoaSBn4butaSBlbWFpbCB0aMO0bmcgYsOhbyBnaWFvIGjDoG5nOicsIGVtYWlsRXJyb3IpO1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1N0YWNrIHRyYWNlOicsIGVtYWlsRXJyb3Iuc3RhY2spO1xyXG4gICAgICAgIC8vIEtow7RuZyB0cuG6oyB24buBIGzhu5dpIGNobyBjbGllbnQsIGNo4buJIGxvZyBs4buXaVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEfhu61pIGVtYWlsIHRow7RuZyBiw6FvIGtoaSB0cuG6oW5nIHRow6FpIMSRxqFuIGjDoG5nIHRoYXkgxJHhu5VpIChu4bq/dSBjw7MgZW1haWwpXHJcbiAgICBlbHNlIGlmIChuZXdTdGF0dXMgJiYgbmV3U3RhdHVzICE9PSBwcmV2aW91c1N0YXR1cyAmJiB1cGRhdGVkT3JkZXIuc2hpcHBpbmdJbmZvICYmIHVwZGF0ZWRPcmRlci5zaGlwcGluZ0luZm8uZW1haWwpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBzZW5kT3JkZXJDb25maXJtYXRpb25FbWFpbCh1cGRhdGVkT3JkZXIpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGDEkMOjIGfhu61pIGVtYWlsIGPhuq1wIG5o4bqtdCB0cuG6oW5nIHRow6FpIMSRxqFuIGjDoG5nICR7dXBkYXRlZE9yZGVyLm9yZGVyQ29kZX0gxJHhur9uICR7dXBkYXRlZE9yZGVyLnNoaXBwaW5nSW5mby5lbWFpbH1gKTtcclxuICAgICAgfSBjYXRjaCAoZW1haWxFcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0zhu5dpIGtoaSBn4butaSBlbWFpbCBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZzonLCBlbWFpbEVycm9yKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBH4butaSB0aMO0bmcgYsOhbyBraGkgY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgxJHGoW4gaMOgbmdcclxuICAgIGlmIChuZXdTdGF0dXMgJiYgbmV3U3RhdHVzICE9PSBwcmV2aW91c1N0YXR1cyAmJiB1cGRhdGVkT3JkZXIudXNlcklkKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgc2VuZE9yZGVyU3RhdHVzTm90aWZpY2F0aW9uKHVwZGF0ZWRPcmRlci51c2VySWQsIHVwZGF0ZWRPcmRlciwgZ2V0U3RhdHVzVGV4dCh1cGRhdGVkT3JkZXIuc3RhdHVzKSk7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coYMSQw6MgZ+G7rWkgdGjDtG5nIGLDoW8gY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgxJHGoW4gaMOgbmcgJHt1cGRhdGVkT3JkZXIub3JkZXJDb2RlfSDEkeG6v24gdXNlciAke3VwZGF0ZWRPcmRlci51c2VySWR9YCk7XHJcbiAgICAgIH0gY2F0Y2ggKG5vdGlmaWNhdGlvbkVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignTOG7l2kga2hpIGfhu61pIHRow7RuZyBiw6FvIGPhuq1wIG5o4bqtdCB0cuG6oW5nIHRow6FpIMSRxqFuIGjDoG5nOicsIG5vdGlmaWNhdGlvbkVycm9yKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlOiBcIkPhuq1wIG5o4bqtdCDEkcahbiBow6BuZyB0aMOgbmggY8O0bmdcIixcclxuICAgICAgZGF0YTogdXBkYXRlZE9yZGVyXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGluIHVwZGF0ZU9yZGVyOlwiLCBlcnJvcik7XHJcbiAgICBjb25zb2xlLmVycm9yKGVycm9yLnN0YWNrKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiBcIkzhu5dpIGtoaSBj4bqtcCBuaOG6rXQgxJHGoW4gaMOgbmdcIixcclxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBvcmRlclVwZGF0ZSA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IHN0YXR1cyB9ID0gcmVxLmJvZHk7XHJcbiAgICBcclxuICAgIGNvbnNvbGUubG9nKFwib3JkZXJVcGRhdGUgY2FsbGVkIHdpdGggc3RhdHVzOlwiLCBzdGF0dXMpO1xyXG4gICAgY29uc29sZS5sb2coXCJSZXF1ZXN0IGJvZHk6XCIsIEpTT04uc3RyaW5naWZ5KHJlcS5ib2R5KSk7XHJcbiAgICBcclxuICAgIC8vIFRyxrDhu5tjIHRpw6puIGzhuqV5IHRow7RuZyB0aW4gxJHGoW4gaMOgbmcgaGnhu4duIHThuqFpIMSR4buDIHRoZW8gZMO1aSB0aGF5IMSR4buVaSB0cuG6oW5nIHRow6FpXHJcbiAgICAvLyDEkOG6o20gYuG6o28gcG9wdWxhdGUgxJHhuqd5IMSR4bunIHRow7RuZyB0aW4gxJHhu4MgZ+G7rWkgZW1haWxcclxuICAgIGNvbnN0IGN1cnJlbnRPcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRCeUlkKHJlcS5wYXJhbXMuaWQpXHJcbiAgICAgIC5wb3B1bGF0ZShcInVzZXJJZFwiLCBcImZpcnN0TmFtZSBsYXN0TmFtZSB1c2VyTmFtZSBlbWFpbCBwaG9uZSBhZGRyZXNzXCIpXHJcbiAgICAgIC5wb3B1bGF0ZShcInByb2R1Y3RzLnByb2R1Y3RJZFwiKTtcclxuICAgIFxyXG4gICAgaWYgKCFjdXJyZW50T3JkZXIpIHtcclxuICAgICAgY29uc29sZS5sb2coXCJLaMO0bmcgdMOsbSB0aOG6pXkgxJHGoW4gaMOgbmcgduG7m2kgSUQ6XCIsIHJlcS5wYXJhbXMuaWQpO1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBlcnJvcjogXCJLaMO0bmcgdMOsbSB0aOG6pXkgxJHGoW4gaMOgbmdcIiB9KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgY29uc29sZS5sb2coXCJUaMO0bmcgdGluIMSRxqFuIGjDoG5nIHRyxrDhu5tjIGtoaSBj4bqtcCBuaOG6rXQ6XCIsIHtcclxuICAgICAgaWQ6IGN1cnJlbnRPcmRlci5faWQsXHJcbiAgICAgIHN0YXR1czogY3VycmVudE9yZGVyLnN0YXR1cyxcclxuICAgICAgZW1haWw6IGN1cnJlbnRPcmRlci51c2VySWQgJiYgY3VycmVudE9yZGVyLnVzZXJJZC5lbWFpbCA/IGN1cnJlbnRPcmRlci51c2VySWQuZW1haWwgOiB1bmRlZmluZWQsXHJcbiAgICAgIG9yZGVyQ29kZTogY3VycmVudE9yZGVyLm9yZGVyQ29kZVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEzGsHUgdHLhuqFuZyB0aMOhaSBjxakgdHLGsOG7m2Mga2hpIGPhuq1wIG5o4bqtdFxyXG4gICAgY29uc3QgcHJldmlvdXNTdGF0dXMgPSBjdXJyZW50T3JkZXIuc3RhdHVzO1xyXG4gICAgXHJcbiAgICAvLyBD4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZ1xyXG4gICAgY3VycmVudE9yZGVyLnN0YXR1cyA9IHN0YXR1cztcclxuICAgIGF3YWl0IGN1cnJlbnRPcmRlci5zYXZlKCk7XHJcbiAgICBcclxuICAgIC8vIEfhu61pIGVtYWlsIHRow7RuZyBiw6FvIGtoaSDEkcahbiBow6BuZyBjaHV54buDbiBzYW5nIHRy4bqhbmcgdGjDoWkgXCLEkWFuZyBnaWFvIMSR4bq/biBraMOhY2hcIlxyXG4gICAgaWYgKHN0YXR1cyA9PT0gJ2RlbGl2ZXJpbmcnICYmIHByZXZpb3VzU3RhdHVzICE9PSAnZGVsaXZlcmluZycpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIsSQYW5nIGNodeG6qW4gYuG7iyBn4butaSBlbWFpbCB0aMO0bmcgYsOhbyBnaWFvIGjDoG5nLi4uXCIpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwixJDGoW4gaMOgbmcgY8OzIHVzZXJJZCB24bubaSBlbWFpbDpcIiwgY3VycmVudE9yZGVyLnVzZXJJZCAmJiBjdXJyZW50T3JkZXIudXNlcklkLmVtYWlsID8gY3VycmVudE9yZGVyLnVzZXJJZC5lbWFpbCA6IHVuZGVmaW5lZCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gR+G7rWkgZW1haWwgdGjDtG5nIGLDoW8gxJHGoW4gaMOgbmcgxJFhbmcgxJHGsOG7o2MgZ2lhb1xyXG4gICAgICAgIGNvbnN0IGVtYWlsU2VudCA9IGF3YWl0IHNlbmRPcmRlclNoaXBwaW5nRW1haWwoY3VycmVudE9yZGVyKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoZW1haWxTZW50KSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhgxJDDoyBn4butaSBlbWFpbCB0aMO0bmcgYsOhbyBnaWFvIGjDoG5nIGNobyDEkcahbiBow6BuZyAjJHtjdXJyZW50T3JkZXIub3JkZXJDb2RlIHx8IGN1cnJlbnRPcmRlci5faWR9YCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGBLaMO0bmcgdGjhu4MgZ+G7rWkgZW1haWwgdGjDtG5nIGLDoW8gZ2lhbyBow6BuZyBjaG8gxJHGoW4gaMOgbmcgIyR7Y3VycmVudE9yZGVyLm9yZGVyQ29kZSB8fCBjdXJyZW50T3JkZXIuX2lkfWApO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJDaGkgdGnhur90IMSRxqFuIGjDoG5nOlwiLCBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgIGlkOiBjdXJyZW50T3JkZXIuX2lkLFxyXG4gICAgICAgICAgICBvcmRlckNvZGU6IGN1cnJlbnRPcmRlci5vcmRlckNvZGUsXHJcbiAgICAgICAgICAgIHVzZXJJZDoge1xyXG4gICAgICAgICAgICAgIGVtYWlsOiBjdXJyZW50T3JkZXIudXNlcklkICYmIGN1cnJlbnRPcmRlci51c2VySWQuZW1haWwgPyBjdXJyZW50T3JkZXIudXNlcklkLmVtYWlsIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgIGZpcnN0TmFtZTogY3VycmVudE9yZGVyLnVzZXJJZCAmJiBjdXJyZW50T3JkZXIudXNlcklkLmZpcnN0TmFtZSA/IGN1cnJlbnRPcmRlci51c2VySWQuZmlyc3ROYW1lIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgIGxhc3ROYW1lOiBjdXJyZW50T3JkZXIudXNlcklkICYmIGN1cnJlbnRPcmRlci51c2VySWQubGFzdE5hbWUgPyBjdXJyZW50T3JkZXIudXNlcklkLmxhc3ROYW1lIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LCBudWxsLCAyKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChlbWFpbEVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignTOG7l2kga2hpIGfhu61pIGVtYWlsIHRow7RuZyBiw6FvIGdpYW8gaMOgbmc6JywgZW1haWxFcnJvcik7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignU3RhY2sgdHJhY2U6JywgZW1haWxFcnJvci5zdGFjayk7XHJcbiAgICAgICAgLy8gS2jDtG5nIHRy4bqjIHbhu4EgbOG7l2kgY2hvIGNsaWVudCwgY2jhu4kgbG9nIGzhu5dpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gVHLhuqMgduG7gSDEkcahbiBow6BuZyDEkcOjIGPhuq1wIG5o4bqtdCB24bubaSDEkeG6p3kgxJHhu6cgdGjDtG5nIHRpblxyXG4gICAgY29uc3QgdXBkYXRlZE9yZGVyID0gYXdhaXQgT3JkZXIuZmluZEJ5SWQocmVxLnBhcmFtcy5pZClcclxuICAgICAgLnBvcHVsYXRlKFwidXNlcklkXCIpXHJcbiAgICAgIC5wb3B1bGF0ZShcInByb2R1Y3RzLnByb2R1Y3RJZFwiKTtcclxuICAgIFxyXG4gICAgcmVzLmpzb24odXBkYXRlZE9yZGVyKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgxJHGoW4gaMOgbmc6XCIsIGVycik7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiU3RhY2sgdHJhY2U6XCIsIGVyci5zdGFjayk7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiBlcnIubWVzc2FnZSB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBUaMOqbSBjb250cm9sbGVyIG3hu5tpIMSR4buDIMSRw6FuaCBk4bqldSDEkcahbiBow6BuZyDEkcOjIHRoYW5oIHRvw6FuXHJcbmV4cG9ydCBjb25zdCBtYXJrT3JkZXJBc1BhaWQgPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3Qgb3JkZXJJZCA9IHJlcS5wYXJhbXMuaWQ7XHJcbiAgICBjb25zdCB7IGlzUGFpZCwgc3RhdHVzIH0gPSByZXEuYm9keTtcclxuICAgIFxyXG4gICAgLy8gQ+G6rXAgbmjhuq10IHRow7RuZyB0aW4gxJHGoW4gaMOgbmc6IHRy4bqhbmcgdGjDoWkgdGhhbmggdG/DoW4gdsOgIHRy4bqhbmcgdGjDoWkgxJHGoW4gaMOgbmcgKG7hur91IGPDsylcclxuICAgIGNvbnN0IHVwZGF0ZURhdGEgPSB7IGlzUGFpZCB9O1xyXG4gICAgXHJcbiAgICAvLyBUw6xtIMSRxqFuIGjDoG5nIMSR4buDIGtp4buDbSB0cmFcclxuICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgT3JkZXIuZmluZEJ5SWQob3JkZXJJZCkucG9wdWxhdGUoXCJwcm9kdWN0cy5wcm9kdWN0SWRcIik7XHJcbiAgICBcclxuICAgIGlmICghb3JkZXIpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IMSRxqFuIGjDoG5nXCIgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFRoZW8gZMO1aSB0cuG6oW5nIHRow6FpIHRyxrDhu5tjIGtoaSBj4bqtcCBuaOG6rXRcclxuICAgIGNvbnN0IHdhc1BhaWQgPSBvcmRlci5pc1BhaWQ7XHJcbiAgICBjb25zdCBwcmV2aW91c1N0YXR1cyA9IG9yZGVyLnN0YXR1cztcclxuICAgIFxyXG4gICAgLy8gTuG6v3UgY8OzIHRy4bqhbmcgdGjDoWkgbeG7m2kgxJHGsOG7o2MgZ+G7rWkgbMOqbiwgY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgxJHGoW4gaMOgbmdcclxuICAgIGlmIChzdGF0dXMpIHtcclxuICAgICAgdXBkYXRlRGF0YS5zdGF0dXMgPSBzdGF0dXM7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFRIw4pNIE3hu5pJOiBY4butIGzDvSBj4bqtcCBuaOG6rXQgdHJhY2tpbmdfbG9ncyBraGkgY8OzIHRoYXkgxJHhu5VpIHRy4bqhbmcgdGjDoWkgaG/hurdjIHRoYW5oIHRvw6FuXHJcbiAgICBpZiAoKHN0YXR1cyAmJiBzdGF0dXMgIT09IHByZXZpb3VzU3RhdHVzKSB8fCAoaXNQYWlkICYmICF3YXNQYWlkKSkge1xyXG4gICAgICAvLyBLaOG7n2kgdOG6oW8gdHJhY2tpbmcgb2JqZWN0IG7hur91IGNoxrBhIGPDs1xyXG4gICAgICBpZiAoIW9yZGVyLnRyYWNraW5nKSB7XHJcbiAgICAgICAgb3JkZXIudHJhY2tpbmcgPSB7IHN0YXR1c19uYW1lOiBcIlwiLCB0cmFja2luZ19sb2dzOiBbXSB9O1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBM4bqleSB0w6puIGhp4buDbiB0aOG7iyBjaG8gdHLhuqFuZyB0aMOhaVxyXG4gICAgICBsZXQgc3RhdHVzTmFtZSA9IFwiXCI7XHJcbiAgICAgIGlmIChzdGF0dXMpIHtcclxuICAgICAgICBzd2l0Y2ggKHN0YXR1cykge1xyXG4gICAgICAgICAgY2FzZSAncGVuZGluZyc6IHN0YXR1c05hbWUgPSBcIkNo4budIHjhu60gbMO9XCI7IGJyZWFrO1xyXG4gICAgICAgICAgY2FzZSAnY29uZmlybWVkJzogc3RhdHVzTmFtZSA9IFwixJDDoyB4w6FjIG5o4bqtblwiOyBicmVhaztcclxuICAgICAgICAgIGNhc2UgJ3Byb2Nlc3NpbmcnOiBzdGF0dXNOYW1lID0gXCLEkGFuZyB44butIGzDvVwiOyBicmVhaztcclxuICAgICAgICAgIGNhc2UgJ3ByZXBhcmluZyc6IHN0YXR1c05hbWUgPSBcIsSQYW5nIGNodeG6qW4gYuG7iyBow6BuZ1wiOyBicmVhaztcclxuICAgICAgICAgIGNhc2UgJ3BhY2thZ2luZyc6IHN0YXR1c05hbWUgPSBcIkhvw6BuIHThuqV0IMSRw7NuZyBnw7NpXCI7IGJyZWFrO1xyXG4gICAgICAgICAgY2FzZSAnc2hpcHBpbmcnOiBzdGF0dXNOYW1lID0gXCLEkGFuZyB24bqtbiBjaHV54buDblwiOyBicmVhaztcclxuICAgICAgICAgIGNhc2UgJ3NoaXBwZWQnOiBzdGF0dXNOYW1lID0gXCLEkMOjIGdpYW8gY2hvIHbhuq1uIGNodXnhu4NuXCI7IGJyZWFrO1xyXG4gICAgICAgICAgY2FzZSAnZGVsaXZlcmluZyc6IHN0YXR1c05hbWUgPSBcIsSQYW5nIGdpYW8gaMOgbmdcIjsgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlICdkZWxpdmVyZWQnOiBzdGF0dXNOYW1lID0gXCLEkMOjIGdpYW8gaMOgbmdcIjsgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlICdjb21wbGV0ZWQnOiBzdGF0dXNOYW1lID0gXCJIb8OgbiB0aMOgbmhcIjsgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlICdjYW5jZWxsZWQnOiBzdGF0dXNOYW1lID0gXCLEkMOjIGjhu6d5XCI7IGJyZWFrO1xyXG4gICAgICAgICAgY2FzZSAnYXdhaXRpbmdfcGF5bWVudCc6IHN0YXR1c05hbWUgPSBcIkNo4budIHRoYW5oIHRvw6FuXCI7IGJyZWFrO1xyXG4gICAgICAgICAgY2FzZSAncmVmdW5kZWQnOiBzdGF0dXNOYW1lID0gXCLEkMOjIGhvw6BuIHRp4buBblwiOyBicmVhaztcclxuICAgICAgICAgIGNhc2UgJ2ZhaWxlZCc6IHN0YXR1c05hbWUgPSBcIlRo4bqldCBi4bqhaVwiOyBicmVhaztcclxuICAgICAgICAgIGNhc2UgJ2RlbGl2ZXJ5X2ZhaWxlZCc6IHN0YXR1c05hbWUgPSBcIkdpYW8gaMOgbmcgdGjhuqV0IGLhuqFpXCI7IGJyZWFrO1xyXG4gICAgICAgICAgZGVmYXVsdDogc3RhdHVzTmFtZSA9IHN0YXR1cztcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZiAoaXNQYWlkICYmICF3YXNQYWlkKSB7XHJcbiAgICAgICAgc3RhdHVzTmFtZSA9IFwixJDDoyB0aGFuaCB0b8OhblwiO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBUaMOqbSBi4bqjbiBnaGkgbeG7m2kgdsOgbyDEkeG6p3UgbeG6o25nIHRyYWNraW5nX2xvZ3NcclxuICAgICAgY29uc3QgbmV3VHJhY2tpbmdMb2cgPSB7XHJcbiAgICAgICAgc3RhdHVzOiBzdGF0dXMgfHwgb3JkZXIuc3RhdHVzLFxyXG4gICAgICAgIHN0YXR1c19uYW1lOiBzdGF0dXNOYW1lIHx8IFwiQ+G6rXAgbmjhuq10IHRoYW5oIHRvw6FuXCIsXHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgbG9jYXRpb246IFwiQ+G7rWEgaMOgbmcgRE5DIEZPT0RcIixcclxuICAgICAgfTtcclxuICAgICAgXHJcbiAgICAgIC8vIEto4bufaSB04bqhbyBt4bqjbmcgdHJhY2tpbmdfbG9ncyBu4bq/dSBjaMawYSBjw7NcclxuICAgICAgaWYgKCFvcmRlci50cmFja2luZy50cmFja2luZ19sb2dzKSB7XHJcbiAgICAgICAgb3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncyA9IFtdO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBUaMOqbSBsb2cgbeG7m2kgdsOgbyDEkeG6p3UgbeG6o25nICjEkeG7gyBsb2cgbeG7m2kgbmjhuqV0IG7hurFtIMSR4bqndSB0acOqbilcclxuICAgICAgb3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncy51bnNoaWZ0KG5ld1RyYWNraW5nTG9nKTtcclxuICAgICAgXHJcbiAgICAgIC8vIEPhuq1wIG5o4bqtdCBzdGF0dXNfbmFtZSBjaMOtbmhcclxuICAgICAgaWYgKHN0YXR1c05hbWUpIHtcclxuICAgICAgICBvcmRlci50cmFja2luZy5zdGF0dXNfbmFtZSA9IHN0YXR1c05hbWU7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vIEzGsHUgdHJhY2tpbmcgdsOgbyB1cGRhdGVEYXRhIMSR4buDIGPhuq1wIG5o4bqtdFxyXG4gICAgICB1cGRhdGVEYXRhLnRyYWNraW5nID0gb3JkZXIudHJhY2tpbmc7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIE7hur91IMSRw6FuaCBk4bqldSBsw6AgxJHDoyB0aGFuaCB0b8OhbiB2w6AgaG/DoG4gdGjDoG5oLCBj4bqtcCBuaOG6rXQgdGjhu51pIGdpYW4gaG/DoG4gdGjDoG5oXHJcbiAgICBpZiAoaXNQYWlkICYmIHN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcpIHtcclxuICAgICAgdXBkYXRlRGF0YS5jb21wbGV0ZWRBdCA9IG5ldyBEYXRlKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIE7hur91IMSRxqFuIGjDoG5nIENPRCBob+G6t2MgY2jGsGEgdOG7q25nIHRoYW5oIHRvw6FuLCB2w6AgZ2nhu50gxJHDoyB0aGFuaCB0b8OhblxyXG4gICAgaWYgKG9yZGVyLnBheW1lbnRNZXRob2QgPT09IFwiY29kXCIgJiYgIXdhc1BhaWQgJiYgaXNQYWlkKSB7XHJcbiAgICAgIC8vIEPhuq1wIG5o4bqtdCBz4buRIGzGsOG7o25nIHThu5NuIGtobyB2w6AgdMSDbmcgc29sZENvdW50XHJcbiAgICAgIGF3YWl0IHVwZGF0ZVByb2R1Y3RTdG9jayhvcmRlci5wcm9kdWN0cywgZmFsc2UsIHRydWUpO1xyXG4gICAgICBcclxuICAgICAgLy8gQ+G6rXAgbmjhuq10IHRow7RuZyB0aW4gc+G6o24gcGjhuqltIGLDoW4gY2jhuqF5XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIG9yZGVyLnByb2R1Y3RzKSB7XHJcbiAgICAgICAgICBpZiAoaXRlbS5wcm9kdWN0SWQpIHtcclxuICAgICAgICAgICAgYXdhaXQgQmVzdFNlbGxpbmdQcm9kdWN0LnVwZGF0ZVNhbGVzRGF0YShcclxuICAgICAgICAgICAgICBpdGVtLnByb2R1Y3RJZC5faWQsXHJcbiAgICAgICAgICAgICAgaXRlbS5wcm9kdWN0SWQsXHJcbiAgICAgICAgICAgICAgaXRlbS5xdWFudGl0eSxcclxuICAgICAgICAgICAgICBvcmRlcklkXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChiZXN0U2VsbGVyRXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIGPhuq1wIG5o4bqtdCBz4bqjbiBwaOG6qW0gYsOhbiBjaOG6oXk6XCIsIGJlc3RTZWxsZXJFcnJvcik7XHJcbiAgICAgICAgLy8gS2jDtG5nIHRy4bqjIHbhu4EgbOG7l2ksIHbhuqtuIHRp4bq/cCB04bulYyB44butIGzDvVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEPhuq1wIG5o4bqtdCB0cuG6oW5nIHRow6FpIHRoYW5oIHRvw6FuIGPhu6dhIMSRxqFuIGjDoG5nXHJcbiAgICBjb25zdCB1cGRhdGVkT3JkZXIgPSBhd2FpdCBPcmRlci5maW5kQnlJZEFuZFVwZGF0ZShcclxuICAgICAgb3JkZXJJZCxcclxuICAgICAgdXBkYXRlRGF0YSxcclxuICAgICAgeyBuZXc6IHRydWUgfVxyXG4gICAgKS5wb3B1bGF0ZShcInVzZXJJZFwiKS5wb3B1bGF0ZShcInByb2R1Y3RzLnByb2R1Y3RJZFwiKTtcclxuICAgIFxyXG4gICAgLy8gR2hpIGxvZyBob+G6t2MgdGjDtG5nIGLDoW9cclxuICAgIGNvbnNvbGUubG9nKGDEkMahbiBow6BuZyAke29yZGVySWR9IMSRw6MgxJHGsOG7o2MgxJHDoW5oIGThuqV1IGzDoCDEkcOjIHRoYW5oIHRvw6FuJHtzdGF0dXMgPyBgIHbDoCBjaHV54buDbiB0cuG6oW5nIHRow6FpIHRow6BuaCAke3N0YXR1c31gIDogJyd9YCk7XHJcbiAgICBcclxuICAgIC8vIEfhu61pIGVtYWlsIHRow7RuZyBiw6FvIG7hur91IGPDsyBlbWFpbCB2w6Aga2hpIMSRxqFuIGjDoG5nIGNodXnhu4NuIHNhbmcgdHLhuqFuZyB0aMOhaSBjb21wbGV0ZWRcclxuICAgIGlmIChzdGF0dXMgPT09ICdjb21wbGV0ZWQnICYmIG9yZGVyLnNoaXBwaW5nSW5mbyAmJiBvcmRlci5zaGlwcGluZ0luZm8uZW1haWwpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBzZW5kT3JkZXJDb25maXJtYXRpb25FbWFpbCh1cGRhdGVkT3JkZXIpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGDEkMOjIGfhu61pIGVtYWlsIGhvw6BuIHRow6BuaCDEkcahbiBow6BuZyAke29yZGVyLm9yZGVyQ29kZX0gxJHhur9uICR7b3JkZXIuc2hpcHBpbmdJbmZvLmVtYWlsfWApO1xyXG4gICAgICB9IGNhdGNoIChlbWFpbEVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignTOG7l2kga2hpIGfhu61pIGVtYWlsIGhvw6BuIHRow6BuaCDEkcahbiBow6BuZzonLCBlbWFpbEVycm9yKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXMuanNvbih1cGRhdGVkT3JkZXIpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSDEkcOhbmggZOG6pXUgxJHGoW4gaMOgbmcgxJHDoyB0aGFuaCB0b8OhbjpcIiwgZXJyKTtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBvcmRlckRlbGV0ZSA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBvcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRCeUlkQW5kRGVsZXRlKHJlcS5wYXJhbXMuaWQpO1xyXG4gICAgaWYgKCFvcmRlcikge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSDEkcahbiBow6BuZ1wiIH0pO1xyXG4gICAgfVxyXG4gICAgcmVzLmpzb24oeyBtZXNzYWdlOiBcIsSQxqFuIGjDoG5nIMSRw6MgxJHGsOG7o2MgeMOzYSB0aMOgbmggY8O0bmdcIiB9KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIEjDoG0gaOG7p3kgxJHGoW4gaMOgbmdcclxuZXhwb3J0IGNvbnN0IGNhbmNlbE9yZGVyID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IG9yZGVySWQgPSByZXEucGFyYW1zLmlkO1xyXG4gICAgY29uc3Qgb3JkZXIgPSBhd2FpdCBPcmRlci5maW5kQnlJZChvcmRlcklkKTtcclxuICAgIFxyXG4gICAgaWYgKCFvcmRlcikge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IMSRxqFuIGjDoG5nXCJcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEtp4buDbSB0cmEgeGVtIMSRxqFuIGjDoG5nIGPDsyB0aOG7gyBo4buneSBraMO0bmdcclxuICAgIGlmIChvcmRlci5zdGF0dXMgPT09ICdjb21wbGV0ZWQnIHx8IG9yZGVyLnN0YXR1cyA9PT0gJ2RlbGl2ZXJpbmcnKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogb3JkZXIuc3RhdHVzID09PSBcImRlbGl2ZXJpbmdcIiBcclxuICAgICAgICAgID8gXCJLaMO0bmcgdGjhu4MgaOG7p3kgxJHGoW4gaMOgbmcgxJFhbmcgZ2lhb1wiIFxyXG4gICAgICAgICAgOiBcIktow7RuZyB0aOG7gyBo4buneSDEkcahbiBow6BuZyDEkcOjIGdpYW9cIlxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gQ+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgxJHGoW4gaMOgbmcgdGjDoG5oICdjYW5jZWxsZWQnXHJcbiAgICBvcmRlci5zdGF0dXMgPSAnY2FuY2VsbGVkJztcclxuICAgIGF3YWl0IG9yZGVyLnNhdmUoKTtcclxuICAgIFxyXG4gICAgLy8gQ2jhu4kgdHLhuqMgbOG6oWkgc+G7kSBsxrDhu6NuZyB04buTbiBraG8gbuG6v3UgbMOgIHRoYW5oIHRvw6FuIG9ubGluZSwgQ09EIGNoxrBhIHRy4burIGtob1xyXG4gICAgaWYgKG9yZGVyLnBheW1lbnRNZXRob2QgIT09IFwiY29kXCIpIHtcclxuICAgICAgYXdhaXQgdXBkYXRlUHJvZHVjdFN0b2NrKG9yZGVyLnByb2R1Y3RzLCB0cnVlLCBmYWxzZSk7XHJcbiAgICB9XHJcbiAgICAvLyBO4bq/dSBDT0QgbmjGsG5nIMSRw6MgdGhhbmggdG/DoW4gdsOgIMSRw6MgY+G6rXAgbmjhuq10IHNvbGRDb3VudCwgY+G6p24gZ2nhuqNtIHNvbGRDb3VudFxyXG4gICAgZWxzZSBpZiAob3JkZXIucGF5bWVudE1ldGhvZCA9PT0gXCJjb2RcIiAmJiBvcmRlci5pc1BhaWQpIHtcclxuICAgICAgYXdhaXQgdXBkYXRlUHJvZHVjdFN0b2NrKG9yZGVyLnByb2R1Y3RzLCBmYWxzZSwgdHJ1ZSk7IC8vIFTEg25nIHNvbGRDb3VudFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlOiBcIkjhu6d5IMSRxqFuIGjDoG5nIHRow6BuaCBjw7RuZ1wiLFxyXG4gICAgICBkYXRhOiBvcmRlclxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiBcIkzhu5dpIGtoaSBo4buneSDEkcahbiBow6BuZ1wiLFxyXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxyXG4gICAgfSk7XHJcbiAgfVxyXG59OyBcclxuXHJcbi8vIEzhuqV5IHRow7RuZyB0aW4gdHJhY2tpbmcgdOG7qyBHaWFvIEjDoG5nIE5oYW5oIEFQSVxyXG5leHBvcnQgY29uc3QgZ2V0T3JkZXJUcmFja2luZyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IG9yZGVyQ29kZSB9ID0gcmVxLnBhcmFtcztcclxuICAgIFxyXG4gICAgaWYgKCFvcmRlckNvZGUpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIlRoaeG6v3UgbcOjIHbhuq1uIMSRxqFuXCJcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFTDrG0gxJHGoW4gaMOgbmcgdHJvbmcgZGF0YWJhc2UgZOG7sWEgdHLDqm4gb3JkZXJDb2RlXHJcbiAgICBjb25zdCBvcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRPbmUoeyBvcmRlckNvZGUgfSk7XHJcbiAgICBcclxuICAgIGlmICghb3JkZXIpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSDEkcahbiBow6BuZyB24bubaSBtw6MgduG6rW4gxJHGoW4gbsOgeVwiXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBO4bq/dSDEkcahbiBow6BuZyDEkcOjIGPDsyB0aMO0bmcgdGluIHRyYWNraW5nLCDGsHUgdGnDqm4gc+G7rSBk4bulbmdcclxuICAgIGlmIChvcmRlci50cmFja2luZyAmJiBvcmRlci50cmFja2luZy50cmFja2luZ19sb2dzICYmIG9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3MubGVuZ3RoID4gMCkge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlPhu60gZOG7pW5nIHRow7RuZyB0aW4gdHJhY2tpbmcgdOG7qyBkYXRhYmFzZVwiKTtcclxuICAgICAgXHJcbiAgICAgIC8vIFThuqFvIGVzdGltYXRlZF9kZWxpdmVyeV90aW1lIG7hur91IGNoxrBhIGPDs1xyXG4gICAgICBpZiAoIW9yZGVyLnRyYWNraW5nLmVzdGltYXRlZF9kZWxpdmVyeV90aW1lKSB7XHJcbiAgICAgICAgY29uc3QgZXN0aW1hdGVkRGVsaXZlcnkgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgIGVzdGltYXRlZERlbGl2ZXJ5LnNldERhdGUoZXN0aW1hdGVkRGVsaXZlcnkuZ2V0RGF0ZSgpICsgMyk7XHJcbiAgICAgICAgb3JkZXIudHJhY2tpbmcuZXN0aW1hdGVkX2RlbGl2ZXJ5X3RpbWUgPSBlc3RpbWF0ZWREZWxpdmVyeS50b0lTT1N0cmluZygpO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgb3JkZXJfY29kZTogb3JkZXIub3JkZXJDb2RlLFxyXG4gICAgICAgICAgc3RhdHVzOiBvcmRlci5zdGF0dXMsXHJcbiAgICAgICAgICBzdGF0dXNfbmFtZTogb3JkZXIudHJhY2tpbmcuc3RhdHVzX25hbWUgfHwgZ2V0U3RhdHVzVGV4dChvcmRlci5zdGF0dXMpLFxyXG4gICAgICAgICAgZXN0aW1hdGVkX2RlbGl2ZXJ5X3RpbWU6IG9yZGVyLnRyYWNraW5nLmVzdGltYXRlZF9kZWxpdmVyeV90aW1lLFxyXG4gICAgICAgICAgdHJhY2tpbmdfbG9nczogb3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncyxcclxuICAgICAgICAgIGN1cnJlbnRfbG9jYXRpb246IFwiQ+G7rWEgaMOgbmcgRE5DIEZPT0RcIixcclxuICAgICAgICAgIGRlbGl2ZXJ5X25vdGU6IG9yZGVyLm5vdGVzIHx8IFwiSMOgbmcgZOG7hSB24buhLCB4aW4gbmjhurkgdGF5XCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIGlzTW9ja2VkOiBmYWxzZVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gVGnhur9wIHThu6VjIHbhu5tpIGNvZGUgZ+G7jWkgQVBJIEdITiBu4bq/dSBj4bqnblxyXG4gICAgY29uc3QgU0hPUF9JRCA9IHByb2Nlc3MuZW52LlNIT1BfSUQ7XHJcbiAgICBjb25zdCBTSE9QX1RPS0VOX0FQSSA9IHByb2Nlc3MuZW52LlNIT1BfVE9LRU5fQVBJO1xyXG4gICAgY29uc3QgVVNFX01PQ0tfT05fRVJST1IgPSBwcm9jZXNzLmVudi5VU0VfTU9DS19PTl9FUlJPUiA9PT0gJ3RydWUnO1xyXG4gICAgXHJcbiAgICBpZiAoIVNIT1BfSUQgfHwgIVNIT1BfVE9LRU5fQVBJKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiVGhp4bq/dSB0aMO0bmcgdGluIGPhuqV1IGjDrG5oIEdITiB0cm9uZyBiaeG6v24gbcO0aSB0csaw4budbmdcIik7XHJcbiAgICAgIGlmIChVU0VfTU9DS19PTl9FUlJPUikge1xyXG4gICAgICAgIC8vIFThuqFvIGThu68gbGnhu4d1IGdp4bqjIGzhuq1wIGThu7FhIHRyw6puIHRow7RuZyB0aW4gxJHGoW4gaMOgbmcgdGjhu7FjIHThur9cclxuICAgICAgICBjb25zdCBtb2NrRGF0YSA9IGdlbmVyYXRlTW9ja1RyYWNraW5nRGF0YUZyb21PcmRlcihvcmRlcik7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICBkYXRhOiBtb2NrRGF0YSxcclxuICAgICAgICAgIGlzTW9ja2VkOiB0cnVlLFxyXG4gICAgICAgICAgbWVzc2FnZTogXCLEkGFuZyBz4butIGThu6VuZyBk4buvIGxp4buHdSBnaeG6oyBs4bqtcCBkbyB0aGnhur91IGPhuqV1IGjDrG5oIEdITiBBUElcIlxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiVGhp4bq/dSB0aMO0bmcgdGluIGPhuqV1IGjDrG5oIEdITlwiXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zb2xlLmxvZyhgxJBhbmcgZ+G7jWkgQVBJIEdITiB24bubaSBtw6MgduG6rW4gxJHGoW46ICR7b3JkZXJDb2RlfWApO1xyXG4gICAgICBjb25zb2xlLmxvZyhgVGjDtG5nIHRpbiBTaG9wOiBJRD0ke1NIT1BfSUR9LCBUT0tFTj0ke1NIT1BfVE9LRU5fQVBJLnN1YnN0cmluZygwLCAxMCl9Li4uYCk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBH4buNaSBBUEkgR0hOIMSR4buDIGzhuqV5IHRow7RuZyB0aW4gdHJhY2tpbmdcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KFxyXG4gICAgICAgIFwiaHR0cHM6Ly9vbmxpbmUtZ2F0ZXdheS5naG4udm4vc2hpaXAvcHVibGljLWFwaS92Mi9zaGlwcGluZy1vcmRlci9kZXRhaWxcIiwgXHJcbiAgICAgICAgeyBvcmRlcl9jb2RlOiBvcmRlckNvZGUgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICdUb2tlbic6IFNIT1BfVE9LRU5fQVBJLFxyXG4gICAgICAgICAgICAnU2hvcElkJzogU0hPUF9JRCxcclxuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKFwiS+G6v3QgcXXhuqMgdOG7qyBBUEkgR0hOOlwiLCBKU09OLnN0cmluZ2lmeShyZXNwb25zZS5kYXRhLCBudWxsLCAyKSk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBO4bq/dSBBUEkgdHLhuqMgduG7gSBs4buXaSwgeOG7rSBsw70gdsOgIHRy4bqjIHbhu4EgcmVzcG9uc2UgcGjDuSBo4bujcFxyXG4gICAgICBpZiAocmVzcG9uc2UuZGF0YS5jb2RlICE9PSAyMDApIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkzhu5dpIHThu6sgR0hOIEFQSTpcIiwgcmVzcG9uc2UuZGF0YSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKFVTRV9NT0NLX09OX0VSUk9SKSB7XHJcbiAgICAgICAgICAvLyBU4bqhbyBk4buvIGxp4buHdSBnaeG6oyBs4bqtcCBk4buxYSB0csOqbiB0aMO0bmcgdGluIMSRxqFuIGjDoG5nIHRo4buxYyB04bq/XHJcbiAgICAgICAgICBjb25zdCBtb2NrRGF0YSA9IGdlbmVyYXRlTW9ja1RyYWNraW5nRGF0YUZyb21PcmRlcihvcmRlcik7XHJcbiAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICBkYXRhOiBtb2NrRGF0YSxcclxuICAgICAgICAgICAgaXNNb2NrZWQ6IHRydWUsXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwixJBhbmcgc+G7rSBk4bulbmcgZOG7ryBsaeG7h3UgZ2nhuqMgbOG6rXAgZG8gQVBJIEdITiB0cuG6oyB24buBIGzhu5dpXCJcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhyZXNwb25zZS5kYXRhLmNvZGUpLmpzb24oe1xyXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICBtZXNzYWdlOiByZXNwb25zZS5kYXRhLm1lc3NhZ2UgfHwgXCJM4buXaSB04burIEFQSSBHSE5cIixcclxuICAgICAgICAgIGNvZGU6IHJlc3BvbnNlLmRhdGEuY29kZVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBO4bq/dSB0aMOgbmggY8O0bmcsIHRy4bqjIHbhu4EgZOG7ryBsaeG7h3VcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgIGRhdGE6IHJlc3BvbnNlLmRhdGEuZGF0YSxcclxuICAgICAgICBpc01vY2tlZDogZmFsc2VcclxuICAgICAgfSk7XHJcbiAgICB9IGNhdGNoIChhcGlFcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kgZ+G7jWkgQVBJIEdITjpcIiwgYXBpRXJyb3IubWVzc2FnZSk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoVVNFX01PQ0tfT05fRVJST1IpIHtcclxuICAgICAgICAvLyBU4bqhbyBk4buvIGxp4buHdSBnaeG6oyBs4bqtcCBk4buxYSB0csOqbiB0aMO0bmcgdGluIMSRxqFuIGjDoG5nIHRo4buxYyB04bq/XHJcbiAgICAgICAgY29uc3QgbW9ja0RhdGEgPSBnZW5lcmF0ZU1vY2tUcmFja2luZ0RhdGFGcm9tT3JkZXIob3JkZXIpO1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgZGF0YTogbW9ja0RhdGEsXHJcbiAgICAgICAgICBpc01vY2tlZDogdHJ1ZSxcclxuICAgICAgICAgIG1lc3NhZ2U6IFwixJBhbmcgc+G7rSBk4bulbmcgZOG7ryBsaeG7h3UgZ2nhuqMgbOG6rXAgZG8ga2jDtG5nIHRo4buDIGvhur90IG7hu5FpIEFQSSBHSE5cIlxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHRo4buDIGvhur90IG7hu5FpIMSR4bq/biBBUEkgR0hOXCIsXHJcbiAgICAgICAgZXJyb3I6IGFwaUVycm9yLm1lc3NhZ2VcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgbOG6pXkgdGjDtG5nIHRpbiB24bqtbiBjaHV54buDbjpcIiwgZXJyb3IucmVzcG9uc2UgJiYgZXJyb3IucmVzcG9uc2UuZGF0YSA/IGVycm9yLnJlc3BvbnNlLmRhdGEgOiBlcnJvci5tZXNzYWdlKTtcclxuICAgIFxyXG4gICAgY29uc3QgVVNFX01PQ0tfT05fRVJST1IgPSBwcm9jZXNzLmVudi5VU0VfTU9DS19PTl9FUlJPUiA9PT0gJ3RydWUnO1xyXG4gICAgXHJcbiAgICBpZiAoVVNFX01PQ0tfT05fRVJST1IpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICAvLyBUw6xtIMSRxqFuIGjDoG5nIHRyb25nIGRhdGFiYXNlIGThu7FhIHRyw6puIG9yZGVyQ29kZVxyXG4gICAgICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgT3JkZXIuZmluZE9uZSh7IG9yZGVyQ29kZTogcmVxLnBhcmFtcy5vcmRlckNvZGUgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKG9yZGVyKSB7XHJcbiAgICAgICAgICAvLyBU4bqhbyBk4buvIGxp4buHdSBnaeG6oyBs4bqtcCBk4buxYSB0csOqbiB0aMO0bmcgdGluIMSRxqFuIGjDoG5nIHRo4buxYyB04bq/XHJcbiAgICAgICAgICBjb25zdCBtb2NrRGF0YSA9IGdlbmVyYXRlTW9ja1RyYWNraW5nRGF0YUZyb21PcmRlcihvcmRlcik7XHJcbiAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICBkYXRhOiBtb2NrRGF0YSxcclxuICAgICAgICAgICAgaXNNb2NrZWQ6IHRydWUsXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwixJBhbmcgc+G7rSBk4bulbmcgZOG7ryBsaeG7h3UgZ2nhuqMgbOG6rXAgZG8gbOG7l2kgaOG7hyB0aOG7kW5nXCJcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaCAoZGJFcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgdMOsbSDEkcahbiBow6BuZzpcIiwgZGJFcnJvcik7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vIE7hur91IGtow7RuZyB0w6xtIHRo4bqleSDEkcahbiBow6BuZyBob+G6t2MgY8OzIGzhu5dpLCBz4butIGThu6VuZyBk4buvIGxp4buHdSBnaeG6oyBs4bqtcCBt4bq3YyDEkeG7i25oXHJcbiAgICAgIGNvbnN0IG1vY2tEYXRhID0gZ2VuZXJhdGVNb2NrVHJhY2tpbmdEYXRhKHJlcS5wYXJhbXMub3JkZXJDb2RlKTtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgIGRhdGE6IG1vY2tEYXRhLFxyXG4gICAgICAgIGlzTW9ja2VkOiB0cnVlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwixJBhbmcgc+G7rSBk4bulbmcgZOG7ryBsaeG7h3UgZ2nhuqMgbOG6rXAgZG8gbOG7l2kgaOG7hyB0aOG7kW5nXCJcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiBcIkzhu5dpIGjhu4cgdGjhu5FuZyBraGkgbOG6pXkgdGjDtG5nIHRpbiB24bqtbiBjaHV54buDblwiLFxyXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gSMOgbSBjaHV54buDbiDEkeG7lWkgdHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZyB0aMOgbmggdGV4dCBoaeG7g24gdGjhu4tcclxuZnVuY3Rpb24gZ2V0U3RhdHVzVGV4dChzdGF0dXMpIHtcclxuICBzd2l0Y2ggKHN0YXR1cykge1xyXG4gICAgY2FzZSAncGVuZGluZyc6IHJldHVybiBcIkNo4budIHjhu60gbMO9XCI7XHJcbiAgICBjYXNlICdjb25maXJtZWQnOiByZXR1cm4gXCLEkMOjIHjDoWMgbmjhuq1uXCI7XHJcbiAgICBjYXNlICdwcm9jZXNzaW5nJzogcmV0dXJuIFwixJBhbmcgeOG7rSBsw71cIjtcclxuICAgIGNhc2UgJ3ByZXBhcmluZyc6IHJldHVybiBcIsSQYW5nIGNodeG6qW4gYuG7iyBow6BuZ1wiO1xyXG4gICAgY2FzZSAncGFja2FnaW5nJzogcmV0dXJuIFwiSG/DoG4gdOG6pXQgxJHDs25nIGfDs2lcIjtcclxuICAgIGNhc2UgJ3NoaXBwaW5nJzogcmV0dXJuIFwixJBhbmcgduG6rW4gY2h1eeG7g25cIjtcclxuICAgIGNhc2UgJ3NoaXBwZWQnOiByZXR1cm4gXCLEkMOjIGdpYW8gY2hvIHbhuq1uIGNodXnhu4NuXCI7XHJcbiAgICBjYXNlICdkZWxpdmVyaW5nJzogcmV0dXJuIFwixJBhbmcgZ2lhbyBow6BuZ1wiO1xyXG4gICAgY2FzZSAnZGVsaXZlcmVkJzogcmV0dXJuIFwixJDDoyBnaWFvIGjDoG5nXCI7XHJcbiAgICBjYXNlICdjb21wbGV0ZWQnOiByZXR1cm4gXCJIb8OgbiB0aMOgbmhcIjtcclxuICAgIGNhc2UgJ2NhbmNlbGxlZCc6IHJldHVybiBcIsSQw6MgaOG7p3lcIjtcclxuICAgIGNhc2UgJ2F3YWl0aW5nX3BheW1lbnQnOiByZXR1cm4gXCJDaOG7nSB0aGFuaCB0b8OhblwiO1xyXG4gICAgY2FzZSAncmVmdW5kZWQnOiByZXR1cm4gXCLEkMOjIGhvw6BuIHRp4buBblwiO1xyXG4gICAgY2FzZSAnZmFpbGVkJzogcmV0dXJuIFwiVGjhuqV0IGLhuqFpXCI7XHJcbiAgICBjYXNlICdkZWxpdmVyeV9mYWlsZWQnOiByZXR1cm4gXCJHaWFvIGjDoG5nIHRo4bqldCBi4bqhaVwiO1xyXG4gICAgZGVmYXVsdDogcmV0dXJuIHN0YXR1cztcclxuICB9XHJcbn1cclxuXHJcbi8vIEjDoG0gdOG6oW8gZOG7ryBsaeG7h3UgZ2nhuqMgbOG6rXAgdOG7qyDEkcahbiBow6BuZyB0aOG7sWMgdOG6v1xyXG5mdW5jdGlvbiBnZW5lcmF0ZU1vY2tUcmFja2luZ0RhdGFGcm9tT3JkZXIob3JkZXIpIHtcclxuICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xyXG4gIGxldCB0cmFja2luZ0xvZ3MgPSBbXTtcclxuICBcclxuICAvLyBT4butIGThu6VuZyB0cmFja2luZ19sb2dzIG7hur91IMSRw6MgY8OzXHJcbiAgaWYgKG9yZGVyLnRyYWNraW5nICYmIG9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3MgJiYgb3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncy5sZW5ndGggPiAwKSB7XHJcbiAgICB0cmFja2luZ0xvZ3MgPSBvcmRlci50cmFja2luZy50cmFja2luZ19sb2dzO1xyXG4gIH0gXHJcbiAgLy8gTuG6v3Uga2jDtG5nIGPDsyB0cmFja2luZ19sb2dzLCB04bqhbyBk4buvIGxp4buHdSBnaeG6oyBs4bqtcCBk4buxYSB2w6BvIHRy4bqhbmcgdGjDoWkgaGnhu4duIHThuqFpXHJcbiAgZWxzZSB7XHJcbiAgICAvLyBU4bqhbyBjw6FjIG3hu5FjIHRo4budaSBnaWFuIGdp4bqjIGzhuq1wXHJcbiAgICBjb25zdCB0aW1lRGF5MiA9IG5ldyBEYXRlKG5vdyk7XHJcbiAgICB0aW1lRGF5Mi5zZXRIb3Vycyhub3cuZ2V0SG91cnMoKSAtIDI0KTsgLy8gMSBuZ8OgeSB0csaw4bubY1xyXG4gICAgXHJcbiAgICBjb25zdCB0aW1lVG9kYXkxID0gbmV3IERhdGUobm93KTtcclxuICAgIHRpbWVUb2RheTEuc2V0SG91cnMobm93LmdldEhvdXJzKCkgLSAxMCk7IC8vIDEwIGdp4budIHRyxrDhu5tjXHJcbiAgICBcclxuICAgIGNvbnN0IHRpbWVUb2RheTIgPSBuZXcgRGF0ZShub3cpO1xyXG4gICAgdGltZVRvZGF5Mi5zZXRIb3Vycyhub3cuZ2V0SG91cnMoKSAtIDUpOyAvLyA1IGdp4budIHRyxrDhu5tjXHJcbiAgICBcclxuICAgIGNvbnN0IHRpbWVMYXRlc3QgPSBuZXcgRGF0ZShub3cpO1xyXG4gICAgdGltZUxhdGVzdC5zZXRNaW51dGVzKG5vdy5nZXRNaW51dGVzKCkgLSAzMCk7IC8vIDMwIHBow7p0IHRyxrDhu5tjXHJcbiAgICBcclxuICAgIC8vIFThuqFvIGxvZ3MgZOG7sWEgdHLDqm4gdHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZ1xyXG4gICAgc3dpdGNoIChvcmRlci5zdGF0dXMpIHtcclxuICAgICAgY2FzZSAnY29tcGxldGVkJzpcclxuICAgICAgICB0cmFja2luZ0xvZ3MgPSBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHN0YXR1czogXCJjb21wbGV0ZWRcIixcclxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IFwiSG/DoG4gdGjDoG5oXCIsXHJcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbm93LnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgICAgIGxvY2F0aW9uOiBcIsSQ4buLYSBjaOG7iSBnaWFvIGjDoG5nXCJcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHN0YXR1czogXCJkZWxpdmVyZWRcIixcclxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IFwixJDDoyBnaWFvIGjDoG5nXCIsXHJcbiAgICAgICAgICAgIHRpbWVzdGFtcDogdGltZUxhdGVzdC50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICBsb2NhdGlvbjogXCLEkOG7i2EgY2jhu4kgZ2lhbyBow6BuZ1wiXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzdGF0dXM6IFwiZGVsaXZlcmluZ1wiLFxyXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogXCLEkGFuZyBnaWFvIGjDoG5nXCIsXHJcbiAgICAgICAgICAgIHRpbWVzdGFtcDogdGltZVRvZGF5Mi50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICBsb2NhdGlvbjogXCJUcnVuZyB0w6JtIHBow6JuIGxv4bqhaVwiXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzdGF0dXM6IFwic2hpcHBpbmdcIixcclxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IFwixJBhbmcgduG6rW4gY2h1eeG7g25cIixcclxuICAgICAgICAgICAgdGltZXN0YW1wOiB0aW1lVG9kYXkxLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgICAgIGxvY2F0aW9uOiBcIkPhu61hIGjDoG5nIEROQyBGT09EXCJcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHN0YXR1czogXCJwYWNrYWdpbmdcIixcclxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IFwiSG/DoG4gdOG6pXQgxJHDs25nIGfDs2lcIixcclxuICAgICAgICAgICAgdGltZXN0YW1wOiB0aW1lRGF5Mi50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICBsb2NhdGlvbjogXCJD4butYSBow6BuZyBETkMgRk9PRFwiXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgICBcclxuICAgICAgY2FzZSAnZGVsaXZlcmluZyc6XHJcbiAgICAgICAgdHJhY2tpbmdMb2dzID0gW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzdGF0dXM6IFwiZGVsaXZlcmluZ1wiLFxyXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogXCLEkGFuZyBnaWFvIGjDoG5nXCIsXHJcbiAgICAgICAgICAgIHRpbWVzdGFtcDogdGltZUxhdGVzdC50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICBsb2NhdGlvbjogXCJUcnVuZyB0w6JtIHBow6JuIGxv4bqhaVwiXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzdGF0dXM6IFwic2hpcHBpbmdcIixcclxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IFwixJBhbmcgduG6rW4gY2h1eeG7g25cIixcclxuICAgICAgICAgICAgdGltZXN0YW1wOiB0aW1lVG9kYXkxLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgICAgIGxvY2F0aW9uOiBcIkPhu61hIGjDoG5nIEROQyBGT09EXCJcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHN0YXR1czogXCJwYWNrYWdpbmdcIixcclxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IFwiSG/DoG4gdOG6pXQgxJHDs25nIGfDs2lcIixcclxuICAgICAgICAgICAgdGltZXN0YW1wOiB0aW1lRGF5Mi50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICBsb2NhdGlvbjogXCJD4butYSBow6BuZyBETkMgRk9PRFwiXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgICBcclxuICAgICAgY2FzZSAnc2hpcHBpbmcnOlxyXG4gICAgICAgIHRyYWNraW5nTG9ncyA9IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3RhdHVzOiBcInNoaXBwaW5nXCIsXHJcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBcIsSQYW5nIHbhuq1uIGNodXnhu4NuXCIsXHJcbiAgICAgICAgICAgIHRpbWVzdGFtcDogdGltZUxhdGVzdC50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICBsb2NhdGlvbjogXCJD4butYSBow6BuZyBETkMgRk9PRFwiXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzdGF0dXM6IFwicGFja2FnaW5nXCIsXHJcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBcIkhvw6BuIHThuqV0IMSRw7NuZyBnw7NpXCIsXHJcbiAgICAgICAgICAgIHRpbWVzdGFtcDogdGltZVRvZGF5MS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICBsb2NhdGlvbjogXCJD4butYSBow6BuZyBETkMgRk9PRFwiXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgICBcclxuICAgICAgY2FzZSAncGFja2FnaW5nJzpcclxuICAgICAgICB0cmFja2luZ0xvZ3MgPSBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHN0YXR1czogXCJwYWNrYWdpbmdcIixcclxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IFwiSG/DoG4gdOG6pXQgxJHDs25nIGfDs2lcIixcclxuICAgICAgICAgICAgdGltZXN0YW1wOiB0aW1lTGF0ZXN0LnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgICAgIGxvY2F0aW9uOiBcIkPhu61hIGjDoG5nIEROQyBGT09EXCJcclxuICAgICAgICAgIH1cclxuICAgICAgICBdO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICAgIFxyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIC8vIFbhu5tpIGPDoWMgdHLhuqFuZyB0aMOhaSBraMOhYywgdOG6oW8gbeG7mXQgYuG6o24gZ2hpIHBow7kgaOG7o3BcclxuICAgICAgICB0cmFja2luZ0xvZ3MgPSBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHN0YXR1czogb3JkZXIuc3RhdHVzLFxyXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogZ2V0U3RhdHVzVGV4dChvcmRlci5zdGF0dXMpLFxyXG4gICAgICAgICAgICB0aW1lc3RhbXA6IG5vdy50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICBsb2NhdGlvbjogXCJD4butYSBow6BuZyBETkMgRk9PRFwiXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXTtcclxuICAgIH1cclxuICB9XHJcbiAgXHJcbiAgLy8gVOG6oW8gbmfDoHkgZOG7sSBraeG6v24gZ2lhbyBow6BuZyAoMyBuZ8OgeSB04burIGhp4buHbiB04bqhaSlcclxuICBjb25zdCBlc3RpbWF0ZWREZWxpdmVyeSA9IG5ldyBEYXRlKG5vdyk7XHJcbiAgZXN0aW1hdGVkRGVsaXZlcnkuc2V0RGF0ZShub3cuZ2V0RGF0ZSgpICsgMyk7XHJcbiAgXHJcbiAgLy8gTOG6pXkgdHLhuqFuZyB0aMOhaSB2w6AgdMOqbiB0cuG6oW5nIHRow6FpIHThu6sgYuG6o24gZ2hpIG3hu5tpIG5o4bqldFxyXG4gIGNvbnN0IHN0YXR1cyA9IHRyYWNraW5nTG9ncy5sZW5ndGggPiAwID8gdHJhY2tpbmdMb2dzWzBdLnN0YXR1cyA6IG9yZGVyLnN0YXR1cztcclxuICBjb25zdCBzdGF0dXNfbmFtZSA9IHRyYWNraW5nTG9ncy5sZW5ndGggPiAwID8gdHJhY2tpbmdMb2dzWzBdLnN0YXR1c19uYW1lIDogZ2V0U3RhdHVzVGV4dChvcmRlci5zdGF0dXMpO1xyXG4gIFxyXG4gIC8vIFRy4bqjIHbhu4EgY+G6pXUgdHLDumMgZOG7ryBsaeG7h3UgdHJhY2tpbmdcclxuICByZXR1cm4ge1xyXG4gICAgb3JkZXJfY29kZTogb3JkZXIub3JkZXJDb2RlLFxyXG4gICAgc3RhdHVzOiBzdGF0dXMsXHJcbiAgICBzdGF0dXNfbmFtZTogc3RhdHVzX25hbWUsXHJcbiAgICBlc3RpbWF0ZWRfZGVsaXZlcnlfdGltZTogZXN0aW1hdGVkRGVsaXZlcnkudG9JU09TdHJpbmcoKSxcclxuICAgIHRyYWNraW5nX2xvZ3M6IHRyYWNraW5nTG9ncyxcclxuICAgIGN1cnJlbnRfbG9jYXRpb246IFwiQ+G7rWEgaMOgbmcgRE5DIEZPT0RcIixcclxuICAgIGRlbGl2ZXJ5X25vdGU6IG9yZGVyLm5vdGVzIHx8IFwiSMOgbmcgZOG7hSB24buhLCB4aW4gbmjhurkgdGF5XCJcclxuICB9O1xyXG59XHJcblxyXG4vLyBHaeG7ryBs4bqhaSBow6BtIGPFqSDEkeG7gyB0xrDGoW5nIHRow61jaCBuZ8aw4bujY1xyXG5mdW5jdGlvbiBnZW5lcmF0ZU1vY2tUcmFja2luZ0RhdGEob3JkZXJDb2RlKSB7XHJcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcclxuICBcclxuICAvLyBU4bqhbyBjw6FjIG3hu5FjIHRo4budaSBnaWFuIGdp4bqjIGzhuq1wXHJcbiAgY29uc3QgdGltZURheTIgPSBuZXcgRGF0ZShub3cpO1xyXG4gIHRpbWVEYXkyLnNldEhvdXJzKG5vdy5nZXRIb3VycygpIC0gMjQpOyAvLyAxIG5nw6B5IHRyxrDhu5tjXHJcbiAgXHJcbiAgY29uc3QgdGltZVRvZGF5MSA9IG5ldyBEYXRlKG5vdyk7XHJcbiAgdGltZVRvZGF5MS5zZXRIb3Vycyhub3cuZ2V0SG91cnMoKSAtIDEwKTsgLy8gMTAgZ2nhu50gdHLGsOG7m2NcclxuICBcclxuICBjb25zdCB0aW1lVG9kYXkyID0gbmV3IERhdGUobm93KTtcclxuICB0aW1lVG9kYXkyLnNldEhvdXJzKG5vdy5nZXRIb3VycygpIC0gNSk7IC8vIDUgZ2nhu50gdHLGsOG7m2NcclxuICBcclxuICBjb25zdCB0aW1lTGF0ZXN0ID0gbmV3IERhdGUobm93KTtcclxuICB0aW1lTGF0ZXN0LnNldE1pbnV0ZXMobm93LmdldE1pbnV0ZXMoKSAtIDMwKTsgLy8gMzAgcGjDunQgdHLGsOG7m2NcclxuICBcclxuICAvLyBU4bqhbyBuZ8OgeSBk4buxIGtp4bq/biBnaWFvIGjDoG5nICgzIG5nw6B5IHThu6sgaGnhu4duIHThuqFpKVxyXG4gIGNvbnN0IGVzdGltYXRlZERlbGl2ZXJ5ID0gbmV3IERhdGUobm93KTtcclxuICBlc3RpbWF0ZWREZWxpdmVyeS5zZXREYXRlKG5vdy5nZXREYXRlKCkgKyAzKTsgLy8gROG7sSBraeG6v24gZ2lhbyBzYXUgMyBuZ8OgeVxyXG4gIFxyXG4gIC8vIFThuqFvIGRhbmggc8OhY2ggY8OhYyBsb2cgduG6rW4gY2h1eeG7g24gZ2nhuqMgbOG6rXAgKHThu6sgbeG7m2kgxJHhur9uIGPFqSlcclxuICBjb25zdCB0cmFja2luZ0xvZ3MgPSBbXHJcbiAgICB7XHJcbiAgICAgIHN0YXR1czogXCJwYWNrYWdpbmdcIixcclxuICAgICAgc3RhdHVzX25hbWU6IFwiSG/DoG4gdOG6pXQgxJHDs25nIGfDs2lcIixcclxuICAgICAgdGltZXN0YW1wOiB0aW1lRGF5Mi50b0lTT1N0cmluZygpLFxyXG4gICAgICBsb2NhdGlvbjogXCJD4butYSBow6BuZyBETkMgRk9PRFwiXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBzdGF0dXM6IFwic2hpcHBpbmdcIixcclxuICAgICAgc3RhdHVzX25hbWU6IFwixJDDoyBnaWFvIGNobyB24bqtbiBjaHV54buDblwiLFxyXG4gICAgICB0aW1lc3RhbXA6IHRpbWVUb2RheTEudG9JU09TdHJpbmcoKSxcclxuICAgICAgbG9jYXRpb246IFwiQ+G7rWEgaMOgbmcgRE5DIEZPT0RcIlxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgc3RhdHVzOiBcImNvbGxlY3RlZFwiLFxyXG4gICAgICBzdGF0dXNfbmFtZTogXCLEkMOjIGzhuqV5IGjDoG5nXCIsXHJcbiAgICAgIHRpbWVzdGFtcDogdGltZVRvZGF5Mi50b0lTT1N0cmluZygpLFxyXG4gICAgICBsb2NhdGlvbjogXCJD4butYSBow6BuZyBETkMgRk9PRFwiXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBzdGF0dXM6IFwiZGVsaXZlcmluZ1wiLFxyXG4gICAgICBzdGF0dXNfbmFtZTogXCLEkGFuZyBnaWFvIGjDoG5nXCIsXHJcbiAgICAgIHRpbWVzdGFtcDogdGltZUxhdGVzdC50b0lTT1N0cmluZygpLFxyXG4gICAgICBsb2NhdGlvbjogXCJUcnVuZyB0w6JtIHBow6JuIGxv4bqhaVwiXHJcbiAgICB9XHJcbiAgXTtcclxuXHJcbiAgLy8gVHLhuqMgduG7gSBj4bqldSB0csO6YyBk4buvIGxp4buHdSB0cmFja2luZyBnaeG6oyBs4bqtcFxyXG4gIHJldHVybiB7XHJcbiAgICBvcmRlcl9jb2RlOiBvcmRlckNvZGUsXHJcbiAgICBzdGF0dXM6IFwiZGVsaXZlcmluZ1wiLFxyXG4gICAgc3RhdHVzX25hbWU6IFwixJBhbmcgZ2lhbyBow6BuZ1wiLFxyXG4gICAgZXN0aW1hdGVkX2RlbGl2ZXJ5X3RpbWU6IGVzdGltYXRlZERlbGl2ZXJ5LnRvSVNPU3RyaW5nKCksXHJcbiAgICB0cmFja2luZ19sb2dzOiB0cmFja2luZ0xvZ3MsXHJcbiAgICBjdXJyZW50X2xvY2F0aW9uOiBcIlRydW5nIHTDom0gcGjDom4gcGjhu5FpXCIsXHJcbiAgICBkZWxpdmVyeV9ub3RlOiBcIkjDoG5nIGThu4UgduG7oSwgeGluIG5o4bq5IHRheVwiXHJcbiAgfTtcclxufVxyXG5cclxuLy8gQ+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgdGhhbmggdG/DoW4gY+G7p2EgxJHGoW4gaMOgbmdcclxuZXhwb3J0IGNvbnN0IHVwZGF0ZU9yZGVyUGF5bWVudFN0YXR1cyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IGlkIH0gPSByZXEucGFyYW1zO1xyXG4gICAgY29uc3QgeyBwYXltZW50U3RhdHVzLCBpc1BhaWQgfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgIC8vIFZhbGlkYXRlIGlucHV0XHJcbiAgICBpZiAoIWlkKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJPcmRlciBJRCBpcyByZXF1aXJlZFwiXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZpbmQgb3JkZXJcclxuICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgT3JkZXIuZmluZEJ5SWQoaWQpO1xyXG4gICAgaWYgKCFvcmRlcikge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiT3JkZXIgbm90IGZvdW5kXCJcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVHJhY2sgb2xkIHZhbHVlcyBmb3IgY29tcGFyaXNvblxyXG4gICAgY29uc3Qgb2xkUGF5bWVudFN0YXR1cyA9IG9yZGVyLnBheW1lbnRTdGF0dXM7XHJcbiAgICBjb25zdCBvbGRJc1BhaWQgPSBvcmRlci5pc1BhaWQ7XHJcblxyXG4gICAgLy8gVXBkYXRlIHBheW1lbnQgc3RhdHVzXHJcbiAgICBjb25zdCB1cGRhdGVEYXRhID0ge307XHJcbiAgICBpZiAocGF5bWVudFN0YXR1cyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHVwZGF0ZURhdGEucGF5bWVudFN0YXR1cyA9IHBheW1lbnRTdGF0dXM7XHJcbiAgICB9XHJcbiAgICBpZiAoaXNQYWlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgdXBkYXRlRGF0YS5pc1BhaWQgPSBpc1BhaWQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVEjDik0gTeG7mkk6IEPhuq1wIG5o4bqtdCB0cmFja2luZ19sb2dzIGtoaSB0cuG6oW5nIHRow6FpIHRoYW5oIHRvw6FuIHRoYXkgxJHhu5VpXHJcbiAgICBpZiAoKHBheW1lbnRTdGF0dXMgJiYgcGF5bWVudFN0YXR1cyAhPT0gb2xkUGF5bWVudFN0YXR1cykgfHwgXHJcbiAgICAgICAgKGlzUGFpZCAhPT0gdW5kZWZpbmVkICYmIGlzUGFpZCAhPT0gb2xkSXNQYWlkKSkge1xyXG4gICAgICBcclxuICAgICAgLy8gS2jhu59pIHThuqFvIHRyYWNraW5nIG9iamVjdCBu4bq/dSBjaMawYSBjw7NcclxuICAgICAgaWYgKCFvcmRlci50cmFja2luZykge1xyXG4gICAgICAgIG9yZGVyLnRyYWNraW5nID0geyBzdGF0dXNfbmFtZTogXCJcIiwgdHJhY2tpbmdfbG9nczogW10gfTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy8gVOG6oW8gc3RhdHVzX25hbWUgdGhlbyB0cuG6oW5nIHRow6FpIHRoYW5oIHRvw6FuIG3hu5tpXHJcbiAgICAgIGxldCBzdGF0dXNOYW1lID0gXCJcIjtcclxuICAgICAgaWYgKHBheW1lbnRTdGF0dXMpIHtcclxuICAgICAgICBzd2l0Y2ggKHBheW1lbnRTdGF0dXMpIHtcclxuICAgICAgICAgIGNhc2UgJ3BlbmRpbmcnOiBzdGF0dXNOYW1lID0gXCJDaOG7nSB0aGFuaCB0b8OhblwiOyBicmVhaztcclxuICAgICAgICAgIGNhc2UgJ2NvbXBsZXRlZCc6IHN0YXR1c05hbWUgPSBcIsSQw6MgdGhhbmggdG/DoW5cIjsgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlICdmYWlsZWQnOiBzdGF0dXNOYW1lID0gXCJUaGFuaCB0b8OhbiB0aOG6pXQgYuG6oWlcIjsgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlICdyZWZ1bmRlZCc6IHN0YXR1c05hbWUgPSBcIsSQw6MgaG/DoG4gdGnhu4FuXCI7IGJyZWFrO1xyXG4gICAgICAgICAgZGVmYXVsdDogc3RhdHVzTmFtZSA9IGBUcuG6oW5nIHRow6FpIHRoYW5oIHRvw6FuOiAke3BheW1lbnRTdGF0dXN9YDtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZiAoaXNQYWlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBzdGF0dXNOYW1lID0gaXNQYWlkID8gXCLEkMOjIHRoYW5oIHRvw6FuXCIgOiBcIkNoxrBhIHRoYW5oIHRvw6FuXCI7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vIFRow6ptIGLhuqNuIGdoaSBt4bubaSB2w6BvIMSR4bqndSBt4bqjbmcgdHJhY2tpbmdfbG9nc1xyXG4gICAgICBjb25zdCBuZXdUcmFja2luZ0xvZyA9IHtcclxuICAgICAgICBzdGF0dXM6IG9yZGVyLnN0YXR1cyxcclxuICAgICAgICBzdGF0dXNfbmFtZTogc3RhdHVzTmFtZSB8fCBcIkPhuq1wIG5o4bqtdCB0aGFuaCB0b8OhblwiLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgIGxvY2F0aW9uOiBcIkPhu61hIGjDoG5nIEROQyBGT09EXCIsXHJcbiAgICAgIH07XHJcbiAgICAgIFxyXG4gICAgICAvLyBLaOG7n2kgdOG6oW8gbeG6o25nIHRyYWNraW5nX2xvZ3MgbuG6v3UgY2jGsGEgY8OzXHJcbiAgICAgIGlmICghb3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncykge1xyXG4gICAgICAgIG9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3MgPSBbXTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy8gVGjDqm0gbG9nIG3hu5tpIHbDoG8gxJHhuqd1IG3huqNuZyAoxJHhu4MgbG9nIG3hu5tpIG5o4bqldCBu4bqxbSDEkeG6p3UgdGnDqm4pXHJcbiAgICAgIG9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3MudW5zaGlmdChuZXdUcmFja2luZ0xvZyk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBMxrB1IHRyYWNraW5nIHbDoG8gdXBkYXRlRGF0YSDEkeG7gyBj4bqtcCBuaOG6rXRcclxuICAgICAgdXBkYXRlRGF0YS50cmFja2luZyA9IG9yZGVyLnRyYWNraW5nO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFVwZGF0ZSBvcmRlciBpbiBkYXRhYmFzZVxyXG4gICAgY29uc3QgdXBkYXRlZE9yZGVyID0gYXdhaXQgT3JkZXIuZmluZEJ5SWRBbmRVcGRhdGUoXHJcbiAgICAgIGlkLFxyXG4gICAgICB7ICRzZXQ6IHVwZGF0ZURhdGEgfSxcclxuICAgICAgeyBuZXc6IHRydWUgfVxyXG4gICAgKS5wb3B1bGF0ZShcInVzZXJJZFwiKS5wb3B1bGF0ZShcInByb2R1Y3RzLnByb2R1Y3RJZFwiKTtcclxuXHJcbiAgICAvLyBIYW5kbGUgaW52ZW50b3J5IGFuZCBzYWxlcyBkYXRhIGlmIG5ld2x5IHBhaWRcclxuICAgIGlmIChpc1BhaWQgJiYgIW9sZElzUGFpZCkge1xyXG4gICAgICAvLyBVcGRhdGUgYmVzdHNlbGxpbmcgcHJvZHVjdHNcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdXBkYXRlZE9yZGVyLnByb2R1Y3RzKSB7XHJcbiAgICAgICAgICBpZiAoaXRlbS5wcm9kdWN0SWQpIHtcclxuICAgICAgICAgICAgYXdhaXQgQmVzdFNlbGxpbmdQcm9kdWN0LnVwZGF0ZVNhbGVzRGF0YShcclxuICAgICAgICAgICAgICBpdGVtLnByb2R1Y3RJZC5faWQsXHJcbiAgICAgICAgICAgICAgaXRlbS5wcm9kdWN0SWQsXHJcbiAgICAgICAgICAgICAgaXRlbS5xdWFudGl0eSxcclxuICAgICAgICAgICAgICBpZFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgdXBkYXRpbmcgYmVzdHNlbGxpbmcgcHJvZHVjdHM6XCIsIGVycm9yKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEfhu61pIHRow7RuZyBiw6FvIGtoaSBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSB0aGFuaCB0b8OhblxyXG4gICAgaWYgKHVwZGF0ZWRPcmRlci51c2VySWQgJiYgXHJcbiAgICAgICAgKChwYXltZW50U3RhdHVzICYmIHBheW1lbnRTdGF0dXMgIT09IG9sZFBheW1lbnRTdGF0dXMpIHx8IFxyXG4gICAgICAgIChpc1BhaWQgIT09IHVuZGVmaW5lZCAmJiBpc1BhaWQgIT09IG9sZElzUGFpZCkpKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgc2VuZE9yZGVyU3RhdHVzTm90aWZpY2F0aW9uKHVwZGF0ZWRPcmRlci51c2VySWQsIHVwZGF0ZWRPcmRlciwgZ2V0U3RhdHVzVGV4dCh1cGRhdGVkT3JkZXIuc3RhdHVzKSk7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coYMSQw6MgZ+G7rWkgdGjDtG5nIGLDoW8gY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgdGhhbmggdG/DoW4gxJHGoW4gaMOgbmcgJHt1cGRhdGVkT3JkZXIub3JkZXJDb2RlfSDEkeG6v24gdXNlciAke3VwZGF0ZWRPcmRlci51c2VySWR9YCk7XHJcbiAgICAgIH0gY2F0Y2ggKG5vdGlmaWNhdGlvbkVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignTOG7l2kga2hpIGfhu61pIHRow7RuZyBiw6FvIGPhuq1wIG5o4bqtdCB0cuG6oW5nIHRow6FpIHRoYW5oIHRvw6FuOicsIG5vdGlmaWNhdGlvbkVycm9yKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlOiBcIk9yZGVyIHBheW1lbnQgc3RhdHVzIHVwZGF0ZWQgc3VjY2Vzc2Z1bGx5XCIsXHJcbiAgICAgIGRhdGE6IHVwZGF0ZWRPcmRlclxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciB1cGRhdGluZyBwYXltZW50IHN0YXR1czpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IFwiRXJyb3IgdXBkYXRpbmcgcGF5bWVudCBzdGF0dXNcIixcclxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIFRow6ptIGNvbnRyb2xsZXIgZnVuY3Rpb24gbeG7m2kgxJHhu4MgZ+G7rWkgZW1haWwgeMOhYyBuaOG6rW4gxJHGoW4gaMOgbmdcclxuZXhwb3J0IGNvbnN0IG5vdGlmeU9yZGVyU3VjY2VzcyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBvcmRlcklkID0gcmVxLnBhcmFtcy5pZDtcclxuICAgIGNvbnN0IHsgZW1haWwsIGZ1bGxOYW1lLCBwaG9uZSwgYWRkcmVzcyB9ID0gcmVxLmJvZHk7XHJcbiAgICBcclxuICAgIGNvbnNvbGUubG9nKGA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PWApO1xyXG4gICAgY29uc29sZS5sb2coYE5PVElGWSBPUkRFUiBTVUNDRVNTIC0gQVRURU1QVElORyBUTyBTRU5EIEVNQUlMYCk7XHJcbiAgICBjb25zb2xlLmxvZyhgT3JkZXIgSUQ6ICR7b3JkZXJJZH1gKTtcclxuICAgIGNvbnNvbGUubG9nKGBFbWFpbCBkYXRhOmAsIHsgZW1haWwsIGZ1bGxOYW1lLCBwaG9uZSwgYWRkcmVzcyB9KTtcclxuICAgIFxyXG4gICAgLy8gTOG6pXkgdGjDtG5nIHRpbiDEkcahbiBow6BuZ1xyXG4gICAgY29uc3Qgb3JkZXIgPSBhd2FpdCBPcmRlci5maW5kQnlJZChvcmRlcklkKVxyXG4gICAgICAucG9wdWxhdGUoXCJ1c2VySWRcIilcclxuICAgICAgLnBvcHVsYXRlKFwicHJvZHVjdHMucHJvZHVjdElkXCIpO1xyXG4gICAgXHJcbiAgICBpZiAoIW9yZGVyKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGBPcmRlciBub3QgZm91bmQgd2l0aCBJRDogJHtvcmRlcklkfWApO1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IMSRxqFuIGjDoG5nXCJcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGNvbnNvbGUubG9nKGBPcmRlciBmb3VuZDpgLCB7XHJcbiAgICAgIG9yZGVyQ29kZTogb3JkZXIub3JkZXJDb2RlLFxyXG4gICAgICB1c2VySWQ6IG9yZGVyLnVzZXJJZCAmJiBvcmRlci51c2VySWQuX2lkID8gb3JkZXIudXNlcklkLl9pZCA6IHVuZGVmaW5lZCxcclxuICAgICAgdXNlckVtYWlsOiBvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLmVtYWlsID8gb3JkZXIudXNlcklkLmVtYWlsIDogdW5kZWZpbmVkLFxyXG4gICAgICB0b3RhbEFtb3VudDogb3JkZXIudG90YWxBbW91bnRcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBU4bqhbyB0aMO0bmcgdGluIGdpYW8gaMOgbmcgY2hvIGVtYWlsXHJcbiAgICBjb25zdCBzaGlwcGluZ0luZm8gPSB7XHJcbiAgICAgIGZ1bGxOYW1lOiBmdWxsTmFtZSB8fCAoKG9yZGVyLnVzZXJJZCAmJiBvcmRlci51c2VySWQuZmlyc3ROYW1lID8gYCR7b3JkZXIudXNlcklkLmZpcnN0TmFtZSB8fCAnJ30gJHtvcmRlci51c2VySWQubGFzdE5hbWUgfHwgJyd9YC50cmltKCkgOiAnJykpLFxyXG4gICAgICBhZGRyZXNzOiBhZGRyZXNzIHx8IG9yZGVyLmFkZHJlc3MgfHwgKG9yZGVyLnVzZXJJZCAmJiBvcmRlci51c2VySWQuYWRkcmVzcyA/IG9yZGVyLnVzZXJJZC5hZGRyZXNzIDogJycpLFxyXG4gICAgICBwaG9uZTogcGhvbmUgfHwgKG9yZGVyLnVzZXJJZCAmJiBvcmRlci51c2VySWQucGhvbmUgPyBvcmRlci51c2VySWQucGhvbmUgOiAnJyksXHJcbiAgICAgIGVtYWlsOiBlbWFpbCB8fCAob3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC5lbWFpbCA/IG9yZGVyLnVzZXJJZC5lbWFpbCA6ICcnKVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgY29uc29sZS5sb2coYFNoaXBwaW5nIGluZm8gcHJlcGFyZWQ6YCwgc2hpcHBpbmdJbmZvKTtcclxuICAgIFxyXG4gICAgLy8gxJDhuqNtIGLhuqNvIGPDsyBlbWFpbCB0cm9uZyBzaGlwcGluZ0luZm9cclxuICAgIGlmICghc2hpcHBpbmdJbmZvLmVtYWlsKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGBFUlJPUjogTm8gZW1haWwgcHJvdmlkZWQgaW4gcmVxdWVzdCBvciBmb3VuZCBpbiBvcmRlcmApO1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiVGhp4bq/dSDEkeG7i2EgY2jhu4kgZW1haWwgxJHhu4MgZ+G7rWkgeMOhYyBuaOG6rW4gxJHGoW4gaMOgbmdcIlxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gR+G6r24gdGjDtG5nIHRpbiBnaWFvIGjDoG5nIHbDoG8gxJHGoW4gaMOgbmdcclxuICAgIG9yZGVyLnNoaXBwaW5nSW5mbyA9IHNoaXBwaW5nSW5mbztcclxuICAgIFxyXG4gICAgLy8gTMawdSBs4bqhaSB0aMO0bmcgdGluIHNoaXBwaW5nSW5mbyB2w6BvIMSRxqFuIGjDoG5nIMSR4buDIHPhu60gZOG7pW5nIHNhdSBuw6B5XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBPcmRlci5maW5kQnlJZEFuZFVwZGF0ZShvcmRlcklkLCB7IHNoaXBwaW5nSW5mbzogc2hpcHBpbmdJbmZvIH0pO1xyXG4gICAgICBjb25zb2xlLmxvZyhgVXBkYXRlZCBvcmRlciB3aXRoIHNoaXBwaW5nSW5mb2ApO1xyXG4gICAgfSBjYXRjaCAodXBkYXRlRXJyb3IpIHtcclxuICAgICAgY29uc29sZS5sb2coYFdhcm5pbmc6IENvdWxkIG5vdCB1cGRhdGUgb3JkZXIgd2l0aCBzaGlwcGluZ0luZm86ICR7dXBkYXRlRXJyb3IubWVzc2FnZX1gKTtcclxuICAgICAgLy8gVGnhur9wIHThu6VjIHRo4buxYyBoaeG7h24gZ+G7rWkgZW1haWwgbeG6t2MgZMO5IGtow7RuZyBj4bqtcCBuaOG6rXQgxJHGsOG7o2Mgb3JkZXJcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gR+G7rWkgZW1haWwgeMOhYyBuaOG6rW4gxJHGoW4gaMOgbmdcclxuICAgIGNvbnNvbGUubG9nKGBBdHRlbXB0aW5nIHRvIHNlbmQgY29uZmlybWF0aW9uIGVtYWlsIHRvOiAke3NoaXBwaW5nSW5mby5lbWFpbH1gKTtcclxuICAgIFxyXG4gICAgY29uc3QgZW1haWxTZW50ID0gYXdhaXQgc2VuZE9yZGVyQ29uZmlybWF0aW9uRW1haWwob3JkZXIpO1xyXG4gICAgY29uc29sZS5sb2coYEVtYWlsIHNlbnQgcmVzdWx0OiAke2VtYWlsU2VudCA/IFwiU1VDQ0VTU1wiIDogXCJGQUlMRURcIn1gKTtcclxuICAgIFxyXG4gICAgaWYgKGVtYWlsU2VudCkge1xyXG4gICAgICBjb25zb2xlLmxvZyhgRW1haWwgc3VjY2Vzc2Z1bGx5IHNlbnQgdG86ICR7c2hpcHBpbmdJbmZvLmVtYWlsfWApO1xyXG4gICAgICBjb25zb2xlLmxvZyhgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1gKTtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiRW1haWwgeMOhYyBuaOG6rW4gxJHGoW4gaMOgbmcgxJHDoyDEkcaw4bujYyBn4butaSB0aMOgbmggY8O0bmdcIlxyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGBGYWlsZWQgdG8gc2VuZCBlbWFpbCB0bzogJHtzaGlwcGluZ0luZm8uZW1haWx9YCk7XHJcbiAgICAgIGNvbnNvbGUubG9nKGA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PWApO1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHRo4buDIGfhu61pIGVtYWlsIHjDoWMgbmjhuq1uIMSRxqFuIGjDoG5nXCJcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBpbiBub3RpZnlPcmRlclN1Y2Nlc3M6XCIsIGVycm9yKTtcclxuICAgIGNvbnNvbGUubG9nKGA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PWApO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IFwixJDDoyB44bqjeSByYSBs4buXaSBraGkgZ+G7rWkgZW1haWwgeMOhYyBuaOG6rW4gxJHGoW4gaMOgbmdcIixcclxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIEjDoG0gbOG6pXkgdG9wIMSRxqFuIGjDoG5nIGPDsyBnacOhIHRy4buLIGNhbyBuaOG6pXRcclxuZXhwb3J0IGNvbnN0IGdldFRvcE9yZGVycyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBsaW1pdCA9IHBhcnNlSW50KHJlcS5xdWVyeS5saW1pdCkgfHwgMTA7IC8vIE3hurdjIMSR4buLbmggbOG6pXkgdG9wIDEwIMSRxqFuIGjDoG5nXHJcblxyXG4gICAgLy8gVMOsbSDEkcahbiBow6BuZyB2w6Agc+G6r3AgeOG6v3AgdGhlbyB0b3RhbEFtb3VudCBnaeG6o20gZOG6p25cclxuICAgIGNvbnN0IHRvcE9yZGVycyA9IGF3YWl0IE9yZGVyLmZpbmQoKVxyXG4gICAgICAucG9wdWxhdGUoXCJ1c2VySWRcIiwgXCJmaXJzdE5hbWUgbGFzdE5hbWUgZW1haWwgdXNlck5hbWVcIilcclxuICAgICAgLnNvcnQoeyB0b3RhbEFtb3VudDogLTEgfSlcclxuICAgICAgLmxpbWl0KGxpbWl0KTtcclxuXHJcbiAgICAvLyDEkOG7i25oIGThuqFuZyBs4bqhaSBk4buvIGxp4buHdSDEkeG7gyBwaMO5IGjhu6NwIHbhu5tpIGPhuqV1IHRyw7pjIGhp4buDbiB0aOG7i1xyXG4gICAgY29uc3QgZm9ybWF0dGVkT3JkZXJzID0gdG9wT3JkZXJzLm1hcChvcmRlciA9PiB7XHJcbiAgICAgIC8vIMSQ4buLbmggZOG6oW5nIHTDqm4ga2jDoWNoIGjDoG5nXHJcbiAgICAgIGxldCBjdXN0b21lck5hbWUgPSAnS2jDoWNoIGjDoG5nJztcclxuICAgICAgaWYgKG9yZGVyLnVzZXJJZCkge1xyXG4gICAgICAgIGlmIChvcmRlci51c2VySWQuZmlyc3ROYW1lIHx8IG9yZGVyLnVzZXJJZC5sYXN0TmFtZSkge1xyXG4gICAgICAgICAgY3VzdG9tZXJOYW1lID0gYCR7b3JkZXIudXNlcklkLmZpcnN0TmFtZSB8fCAnJ30gJHtvcmRlci51c2VySWQubGFzdE5hbWUgfHwgJyd9YC50cmltKCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChvcmRlci51c2VySWQudXNlck5hbWUpIHtcclxuICAgICAgICAgIGN1c3RvbWVyTmFtZSA9IG9yZGVyLnVzZXJJZC51c2VyTmFtZTtcclxuICAgICAgICB9IGVsc2UgaWYgKG9yZGVyLnVzZXJJZC5lbWFpbCkge1xyXG4gICAgICAgICAgY3VzdG9tZXJOYW1lID0gb3JkZXIudXNlcklkLmVtYWlsO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gxJDhu4tuaCBk4bqhbmcgbmfDoHkgxJHhurd0IGjDoG5nXHJcbiAgICAgIGNvbnN0IG9yZGVyRGF0ZSA9IG9yZGVyLmNyZWF0ZWRBdCA/IG5ldyBEYXRlKG9yZGVyLmNyZWF0ZWRBdCkgOiBuZXcgRGF0ZSgpO1xyXG4gICAgICBjb25zdCBmb3JtYXR0ZWREYXRlID0gYCR7b3JkZXJEYXRlLmdldERhdGUoKX0vJHtvcmRlckRhdGUuZ2V0TW9udGgoKSArIDF9LyR7b3JkZXJEYXRlLmdldEZ1bGxZZWFyKCl9YDtcclxuXHJcbiAgICAgIC8vIENodXnhu4NuIMSR4buVaSB0cuG6oW5nIHRow6FpIHNhbmcgdGnhur9uZyBWaeG7h3RcclxuICAgICAgbGV0IHN0YXR1c1RleHQgPSAnxJBhbmcgeOG7rSBsw70nO1xyXG4gICAgICBzd2l0Y2gob3JkZXIuc3RhdHVzKSB7XHJcbiAgICAgICAgY2FzZSAncGVuZGluZyc6IHN0YXR1c1RleHQgPSAnxJBhbmcgeOG7rSBsw70nOyBicmVhaztcclxuICAgICAgICBjYXNlICdjb25maXJtZWQnOiBzdGF0dXNUZXh0ID0gJ8SQw6MgeMOhYyBuaOG6rW4nOyBicmVhaztcclxuICAgICAgICBjYXNlICdwcm9jZXNzaW5nJzogc3RhdHVzVGV4dCA9ICfEkGFuZyB44butIGzDvSc7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ3NoaXBwaW5nJzogc3RhdHVzVGV4dCA9ICfEkGFuZyB24bqtbiBjaHV54buDbic7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2RlbGl2ZXJpbmcnOiBzdGF0dXNUZXh0ID0gJ8SQYW5nIGdpYW8gaMOgbmcnOyBicmVhaztcclxuICAgICAgICBjYXNlICdkZWxpdmVyZWQnOiBzdGF0dXNUZXh0ID0gJ8SQw6MgZ2lhbyBow6BuZyc7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2NvbXBsZXRlZCc6IHN0YXR1c1RleHQgPSAnxJDDoyBob8OgbiB0aMOgbmgnOyBicmVhaztcclxuICAgICAgICBjYXNlICdjYW5jZWxsZWQnOiBzdGF0dXNUZXh0ID0gJ8SQw6MgaOG7p3knOyBicmVhaztcclxuICAgICAgICBjYXNlICdhd2FpdGluZ19wYXltZW50Jzogc3RhdHVzVGV4dCA9ICdDaOG7nSB0aGFuaCB0b8Ohbic7IGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6IHN0YXR1c1RleHQgPSBvcmRlci5zdGF0dXM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgaWQ6IG9yZGVyLm9yZGVyQ29kZSB8fCBvcmRlci5faWQsXHJcbiAgICAgICAgY3VzdG9tZXI6IGN1c3RvbWVyTmFtZSxcclxuICAgICAgICB0b3RhbDogb3JkZXIudG90YWxBbW91bnQsXHJcbiAgICAgICAgc3RhdHVzOiBzdGF0dXNUZXh0LFxyXG4gICAgICAgIGRhdGU6IGZvcm1hdHRlZERhdGVcclxuICAgICAgfTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKGZvcm1hdHRlZE9yZGVycyk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0zhu5dpIGtoaSBs4bqleSBkYW5oIHPDoWNoIMSRxqFuIGjDoG5nIGdpw6EgdHLhu4sgY2FvIG5o4bqldDonLCBlcnJvcik7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IFxyXG4gICAgICBzdWNjZXNzOiBmYWxzZSwgXHJcbiAgICAgIG1lc3NhZ2U6ICdM4buXaSBraGkgbOG6pXkgZGFuaCBzw6FjaCDEkcahbiBow6BuZyBnacOhIHRy4buLIGNhbyBuaOG6pXQnLFxyXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSBcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIEjDoG0gbOG6pXkgdGjhu5FuZyBrw6ogxJHGoW4gaMOgbmdcclxuZXhwb3J0IGNvbnN0IGdldE9yZGVyU3RhdHMgPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgcGVyaW9kID0gcmVxLnF1ZXJ5LnBlcmlvZCB8fCAnd2Vlayc7IC8vIE3hurdjIMSR4buLbmggbMOgIHR14bqnblxyXG4gICAgY29uc3Qgc3RhcnREYXRlID0gbmV3IERhdGUoKTtcclxuICAgIGxldCBlbmREYXRlID0gbmV3IERhdGUoKTtcclxuICAgIFxyXG4gICAgLy8gVGhp4bq/dCBs4bqtcCBraG/huqNuZyB0aOG7nWkgZ2lhbiBk4buxYSB0csOqbiBwZXJpb2RcclxuICAgIHN3aXRjaCAocGVyaW9kKSB7XHJcbiAgICAgIGNhc2UgJ3dlZWsnOlxyXG4gICAgICAgIHN0YXJ0RGF0ZS5zZXREYXRlKHN0YXJ0RGF0ZS5nZXREYXRlKCkgLSA3KTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnbW9udGgnOlxyXG4gICAgICAgIHN0YXJ0RGF0ZS5zZXREYXRlKHN0YXJ0RGF0ZS5nZXREYXRlKCkgLSAzMCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ3llYXInOlxyXG4gICAgICAgIHN0YXJ0RGF0ZS5zZXREYXRlKHN0YXJ0RGF0ZS5nZXREYXRlKCkgLSAzNjUpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHN0YXJ0RGF0ZS5zZXREYXRlKHN0YXJ0RGF0ZS5nZXREYXRlKCkgLSA3KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gTOG6pXkgdGjhu5FuZyBrw6ogc+G7kSBsxrDhu6NuZyDEkcahbiBow6BuZyB0aGVvIHRy4bqhbmcgdGjDoWlcclxuICAgIGNvbnN0IHBlbmRpbmdDb3VudCA9IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHsgXHJcbiAgICAgIHN0YXR1czogeyAkaW46IFsncGVuZGluZycsICdwcm9jZXNzaW5nJywgJ2F3YWl0aW5nX3BheW1lbnQnXSB9LFxyXG4gICAgICBjcmVhdGVkQXQ6IHsgJGd0ZTogc3RhcnREYXRlLCAkbHRlOiBlbmREYXRlIH0gIFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIGNvbnN0IHNoaXBwaW5nQ291bnQgPSBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cyh7IFxyXG4gICAgICBzdGF0dXM6IHsgJGluOiBbJ3NoaXBwaW5nJywgJ2RlbGl2ZXJpbmcnXSB9LFxyXG4gICAgICBjcmVhdGVkQXQ6IHsgJGd0ZTogc3RhcnREYXRlLCAkbHRlOiBlbmREYXRlIH0gIFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIGNvbnN0IGNvbXBsZXRlZENvdW50ID0gYXdhaXQgT3JkZXIuY291bnREb2N1bWVudHMoeyBcclxuICAgICAgc3RhdHVzOiAnY29tcGxldGVkJyxcclxuICAgICAgY3JlYXRlZEF0OiB7ICRndGU6IHN0YXJ0RGF0ZSwgJGx0ZTogZW5kRGF0ZSB9ICBcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICBjb25zdCBjYW5jZWxsZWRDb3VudCA9IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHsgXHJcbiAgICAgIHN0YXR1czogJ2NhbmNlbGxlZCcsXHJcbiAgICAgIGNyZWF0ZWRBdDogeyAkZ3RlOiBzdGFydERhdGUsICRsdGU6IGVuZERhdGUgfSAgXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gVMOtbmggdOG7lW5nIHPhu5EgxJHGoW4gaMOgbmdcclxuICAgIGNvbnN0IHRvdGFsT3JkZXJzID0gcGVuZGluZ0NvdW50ICsgc2hpcHBpbmdDb3VudCArIGNvbXBsZXRlZENvdW50ICsgY2FuY2VsbGVkQ291bnQ7XHJcbiAgICBcclxuICAgIC8vIEThu68gbGnhu4d1IGNobyBiaeG7g3UgxJHhu5MgdHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZ1xyXG4gICAgY29uc3Qgb3JkZXJTdGF0dXMgPSBbXHJcbiAgICAgIHsgbmFtZTogJ8SQYW5nIHjhu60gbMO9JywgdmFsdWU6IHBlbmRpbmdDb3VudCB9LFxyXG4gICAgICB7IG5hbWU6ICfEkGFuZyBnaWFvJywgdmFsdWU6IHNoaXBwaW5nQ291bnQgfSxcclxuICAgICAgeyBuYW1lOiAnxJDDoyBnaWFvJywgdmFsdWU6IGNvbXBsZXRlZENvdW50IH0sXHJcbiAgICAgIHsgbmFtZTogJ8SQw6MgaOG7p3knLCB2YWx1ZTogY2FuY2VsbGVkQ291bnQgfVxyXG4gICAgXTtcclxuICAgIFxyXG4gICAgLy8gVMOtbmggdG/DoW4gdGjhu51pIGdpYW4geOG7rSBsw70gdHJ1bmcgYsOsbmggZOG7sWEgdHLDqm4gZOG7ryBsaeG7h3UgdGjhu7FjIHThur9cclxuICAgIGxldCBwcm9jZXNzaW5nVGltZSA9IFtdO1xyXG4gICAgXHJcbiAgICB0cnkge1xyXG4gICAgICAvLyBM4bqleSDEkcahbiBow6BuZyDEkcOjIGhvw6BuIHRow6BuaCDEkeG7gyB0w61uaCB0aOG7nWkgZ2lhbiB44butIGzDvVxyXG4gICAgICBjb25zdCBjb21wbGV0ZWRPcmRlcnMgPSBhd2FpdCBPcmRlci5maW5kKHtcclxuICAgICAgICBzdGF0dXM6ICdjb21wbGV0ZWQnLFxyXG4gICAgICAgIGNyZWF0ZWRBdDogeyAkZ3RlOiBzdGFydERhdGUsICRsdGU6IGVuZERhdGUgfSxcclxuICAgICAgICBjb21wbGV0ZWRBdDogeyAkZXhpc3RzOiB0cnVlIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoY29tcGxldGVkT3JkZXJzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAvLyBUw61uaCB04buVbmcgdGjhu51pIGdpYW4geOG7rSBsw71cclxuICAgICAgICBsZXQgdG90YWxQcm9jZXNzaW5nVGltZSA9IDA7XHJcbiAgICAgICAgbGV0IHRvdGFsU2hpcHBpbmdUaW1lID0gMDtcclxuICAgICAgICBsZXQgdG90YWxUb3RhbFRpbWUgPSAwO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbXBsZXRlZE9yZGVycy5mb3JFYWNoKG9yZGVyID0+IHtcclxuICAgICAgICAgIC8vIE7hur91IGPDsyB0cmFja2luZyBsb2dzLCBz4butIGThu6VuZyBjaMO6bmcgxJHhu4MgdMOtbmggdGjhu51pIGdpYW4gY2jDrW5oIHjDoWMgaMahblxyXG4gICAgICAgICAgaWYgKG9yZGVyLnRyYWNraW5nICYmIEFycmF5LmlzQXJyYXkob3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncykgJiYgb3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncy5sZW5ndGggPj0gMikge1xyXG4gICAgICAgICAgICBjb25zdCBsb2dzID0gb3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncztcclxuICAgICAgICAgICAgLy8gU+G6r3AgeOG6v3AgbG9ncyB0aGVvIHRo4budaSBnaWFuXHJcbiAgICAgICAgICAgIGxvZ3Muc29ydCgoYSwgYikgPT4gbmV3IERhdGUoYS50aW1lc3RhbXApIC0gbmV3IERhdGUoYi50aW1lc3RhbXApKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFTDrW5oIHRo4budaSBnaWFuIHThu6sgdOG6oW8gxJHGoW4gxJHhur9uIMSRw7NuZyBnw7NpXHJcbiAgICAgICAgICAgIGNvbnN0IHBhY2thZ2luZ0xvZyA9IGxvZ3MuZmluZChsb2cgPT4gbG9nLnN0YXR1cyA9PT0gJ3BhY2thZ2luZycgfHwgbG9nLnN0YXR1c19uYW1lLmluY2x1ZGVzKCfEkcOzbmcgZ8OzaScpKTtcclxuICAgICAgICAgICAgaWYgKHBhY2thZ2luZ0xvZykge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHBhY2thZ2luZ1RpbWUgPSAobmV3IERhdGUocGFja2FnaW5nTG9nLnRpbWVzdGFtcCkgLSBuZXcgRGF0ZShvcmRlci5jcmVhdGVkQXQpKSAvICgxMDAwICogNjApOyAvLyBQaMO6dFxyXG4gICAgICAgICAgICAgIHRvdGFsUHJvY2Vzc2luZ1RpbWUgKz0gcGFja2FnaW5nVGltZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVMOtbmggdGjhu51pIGdpYW4gdOG7qyDEkcOzbmcgZ8OzaSDEkeG6v24gZ2lhbyBow6BuZ1xyXG4gICAgICAgICAgICBjb25zdCBzaGlwcGluZ0xvZyA9IGxvZ3MuZmluZChsb2cgPT4gbG9nLnN0YXR1cyA9PT0gJ3NoaXBwaW5nJyB8fCBsb2cuc3RhdHVzID09PSAnZGVsaXZlcmluZycpO1xyXG4gICAgICAgICAgICBjb25zdCBkZWxpdmVyZWRMb2cgPSBsb2dzLmZpbmQobG9nID0+IGxvZy5zdGF0dXMgPT09ICdkZWxpdmVyZWQnIHx8IGxvZy5zdGF0dXMgPT09ICdjb21wbGV0ZWQnKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChzaGlwcGluZ0xvZyAmJiBkZWxpdmVyZWRMb2cpIHtcclxuICAgICAgICAgICAgICBjb25zdCBkZWxpdmVyeVRpbWUgPSAobmV3IERhdGUoZGVsaXZlcmVkTG9nLnRpbWVzdGFtcCkgLSBuZXcgRGF0ZShzaGlwcGluZ0xvZy50aW1lc3RhbXApKSAvICgxMDAwICogNjApO1xyXG4gICAgICAgICAgICAgIHRvdGFsU2hpcHBpbmdUaW1lICs9IGRlbGl2ZXJ5VGltZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVMOtbmggdOG7lW5nIHRo4budaSBnaWFuIHThu6sgdOG6oW8gxJHGoW4gxJHhur9uIGhvw6BuIHRow6BuaFxyXG4gICAgICAgICAgICB0b3RhbFRvdGFsVGltZSArPSAobmV3IERhdGUob3JkZXIuY29tcGxldGVkQXQpIC0gbmV3IERhdGUob3JkZXIuY3JlYXRlZEF0KSkgLyAoMTAwMCAqIDYwKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIE7hur91IGtow7RuZyBjw7MgdHJhY2tpbmcgbG9ncywgc+G7rSBk4bulbmcgY3JlYXRlZEF0IHbDoCBjb21wbGV0ZWRBdFxyXG4gICAgICAgICAgICBjb25zdCB0b3RhbFRpbWUgPSAobmV3IERhdGUob3JkZXIuY29tcGxldGVkQXQpIC0gbmV3IERhdGUob3JkZXIuY3JlYXRlZEF0KSkgLyAoMTAwMCAqIDYwKTtcclxuICAgICAgICAgICAgdG90YWxUb3RhbFRpbWUgKz0gdG90YWxUaW1lO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gR2nhuqMgxJHhu4tuaCB04bu3IGzhu4cgdGjhu51pIGdpYW4gY2hvIHThu6tuZyBnaWFpIMSRb+G6oW5cclxuICAgICAgICAgICAgdG90YWxQcm9jZXNzaW5nVGltZSArPSB0b3RhbFRpbWUgKiAwLjM7IC8vIDMwJSB0aOG7nWkgZ2lhbiBjaG8geOG7rSBsw71cclxuICAgICAgICAgICAgdG90YWxTaGlwcGluZ1RpbWUgKz0gdG90YWxUaW1lICogMC43OyAvLyA3MCUgdGjhu51pIGdpYW4gY2hvIHbhuq1uIGNodXnhu4NuXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVMOtbmggdGjhu51pIGdpYW4gdHJ1bmcgYsOsbmhcclxuICAgICAgICBjb25zdCBhdmdQcm9jZXNzaW5nVGltZSA9IE1hdGgucm91bmQodG90YWxQcm9jZXNzaW5nVGltZSAvIGNvbXBsZXRlZE9yZGVycy5sZW5ndGgpO1xyXG4gICAgICAgIGNvbnN0IGF2Z1NoaXBwaW5nVGltZSA9IE1hdGgucm91bmQodG90YWxTaGlwcGluZ1RpbWUgLyBjb21wbGV0ZWRPcmRlcnMubGVuZ3RoKTtcclxuICAgICAgICBjb25zdCBhdmdUb3RhbFRpbWUgPSBNYXRoLnJvdW5kKHRvdGFsVG90YWxUaW1lIC8gY29tcGxldGVkT3JkZXJzLmxlbmd0aCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcHJvY2Vzc2luZ1RpbWUgPSBbXHJcbiAgICAgICAgICB7IG5hbWU6ICdYw6FjIG5o4bqtbiAmIMSQw7NuZyBnw7NpJywgdGltZTogYXZnUHJvY2Vzc2luZ1RpbWUgfHwgMTUgfSxcclxuICAgICAgICAgIHsgbmFtZTogJ1bhuq1uIGNodXnhu4NuJywgdGltZTogYXZnU2hpcHBpbmdUaW1lIHx8IDQ1IH0sXHJcbiAgICAgICAgICB7IG5hbWU6ICdU4buVbmcgdGjhu51pIGdpYW4nLCB0aW1lOiBhdmdUb3RhbFRpbWUgfHwgNjAgfVxyXG4gICAgICAgIF07XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gTuG6v3Uga2jDtG5nIGPDsyDEkcahbiBow6BuZyBob8OgbiB0aMOgbmgsIHPhu60gZOG7pW5nIGThu68gbGnhu4d1IG3huqt1XHJcbiAgICAgICAgcHJvY2Vzc2luZ1RpbWUgPSBbXHJcbiAgICAgICAgICB7IG5hbWU6ICdYw6FjIG5o4bqtbicsIHRpbWU6IDE1IH0sXHJcbiAgICAgICAgICB7IG5hbWU6ICfEkMOzbmcgZ8OzaScsIHRpbWU6IDMwIH0sXHJcbiAgICAgICAgICB7IG5hbWU6ICdW4bqtbiBjaHV54buDbicsIHRpbWU6IDQ1IH1cclxuICAgICAgICBdO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdM4buXaSBraGkgdMOtbmggdG/DoW4gdGjhu51pIGdpYW4geOG7rSBsw70gdHJ1bmcgYsOsbmg6JywgZXJyb3IpO1xyXG4gICAgICAvLyBE4buvIGxp4buHdSBt4bqrdSBraGkgY8OzIGzhu5dpXHJcbiAgICAgIHByb2Nlc3NpbmdUaW1lID0gW1xyXG4gICAgICAgIHsgbmFtZTogJ1jDoWMgbmjhuq1uJywgdGltZTogMTUgfSxcclxuICAgICAgICB7IG5hbWU6ICfEkMOzbmcgZ8OzaScsIHRpbWU6IDMwIH0sXHJcbiAgICAgICAgeyBuYW1lOiAnVuG6rW4gY2h1eeG7g24nLCB0aW1lOiA0NSB9XHJcbiAgICAgIF07XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEzhuqV5IGRhbmggc8OhY2ggdG9wIDEwIMSRxqFuIGjDoG5nIGdpw6EgdHLhu4sgY2FvIG5o4bqldFxyXG4gICAgY29uc3QgdG9wT3JkZXJzID0gYXdhaXQgT3JkZXIuZmluZCh7IGNyZWF0ZWRBdDogeyAkZ3RlOiBzdGFydERhdGUsICRsdGU6IGVuZERhdGUgfSB9KVxyXG4gICAgICAucG9wdWxhdGUoXCJ1c2VySWRcIiwgXCJmaXJzdE5hbWUgbGFzdE5hbWUgZW1haWwgdXNlck5hbWVcIilcclxuICAgICAgLnNvcnQoeyB0b3RhbEFtb3VudDogLTEgfSlcclxuICAgICAgLmxpbWl0KDEwKTtcclxuICAgIFxyXG4gICAgLy8gxJDhu4tuaCBk4bqhbmcgbOG6oWkgZOG7ryBsaeG7h3UgdG9wIG9yZGVyc1xyXG4gICAgY29uc3QgZm9ybWF0dGVkVG9wT3JkZXJzID0gdG9wT3JkZXJzLm1hcChvcmRlciA9PiB7XHJcbiAgICAgIC8vIMSQ4buLbmggZOG6oW5nIHTDqm4ga2jDoWNoIGjDoG5nXHJcbiAgICAgIGxldCBjdXN0b21lck5hbWUgPSAnS2jDoWNoIGjDoG5nJztcclxuICAgICAgaWYgKG9yZGVyLnVzZXJJZCkge1xyXG4gICAgICAgIGlmIChvcmRlci51c2VySWQuZmlyc3ROYW1lIHx8IG9yZGVyLnVzZXJJZC5sYXN0TmFtZSkge1xyXG4gICAgICAgICAgY3VzdG9tZXJOYW1lID0gYCR7b3JkZXIudXNlcklkLmZpcnN0TmFtZSB8fCAnJ30gJHtvcmRlci51c2VySWQubGFzdE5hbWUgfHwgJyd9YC50cmltKCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChvcmRlci51c2VySWQudXNlck5hbWUpIHtcclxuICAgICAgICAgIGN1c3RvbWVyTmFtZSA9IG9yZGVyLnVzZXJJZC51c2VyTmFtZTtcclxuICAgICAgICB9IGVsc2UgaWYgKG9yZGVyLnVzZXJJZC5lbWFpbCkge1xyXG4gICAgICAgICAgY3VzdG9tZXJOYW1lID0gb3JkZXIudXNlcklkLmVtYWlsO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gxJDhu4tuaCBk4bqhbmcgbmfDoHkgxJHhurd0IGjDoG5nXHJcbiAgICAgIGNvbnN0IG9yZGVyRGF0ZSA9IG9yZGVyLmNyZWF0ZWRBdCA/IG5ldyBEYXRlKG9yZGVyLmNyZWF0ZWRBdCkgOiBuZXcgRGF0ZSgpO1xyXG4gICAgICBjb25zdCBmb3JtYXR0ZWREYXRlID0gYCR7b3JkZXJEYXRlLmdldERhdGUoKX0vJHtvcmRlckRhdGUuZ2V0TW9udGgoKSArIDF9LyR7b3JkZXJEYXRlLmdldEZ1bGxZZWFyKCl9YDtcclxuXHJcbiAgICAgIC8vIENodXnhu4NuIMSR4buVaSB0cuG6oW5nIHRow6FpIHNhbmcgdGnhur9uZyBWaeG7h3RcclxuICAgICAgbGV0IHN0YXR1c1RleHQgPSAnxJBhbmcgeOG7rSBsw70nO1xyXG4gICAgICBzd2l0Y2gob3JkZXIuc3RhdHVzKSB7XHJcbiAgICAgICAgY2FzZSAncGVuZGluZyc6IHN0YXR1c1RleHQgPSAnxJBhbmcgeOG7rSBsw70nOyBicmVhaztcclxuICAgICAgICBjYXNlICdjb25maXJtZWQnOiBzdGF0dXNUZXh0ID0gJ8SQw6MgeMOhYyBuaOG6rW4nOyBicmVhaztcclxuICAgICAgICBjYXNlICdwcm9jZXNzaW5nJzogc3RhdHVzVGV4dCA9ICfEkGFuZyB44butIGzDvSc7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ3NoaXBwaW5nJzogc3RhdHVzVGV4dCA9ICfEkGFuZyB24bqtbiBjaHV54buDbic7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2RlbGl2ZXJpbmcnOiBzdGF0dXNUZXh0ID0gJ8SQYW5nIGdpYW8gaMOgbmcnOyBicmVhaztcclxuICAgICAgICBjYXNlICdkZWxpdmVyZWQnOiBzdGF0dXNUZXh0ID0gJ8SQw6MgZ2lhbyBow6BuZyc7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2NvbXBsZXRlZCc6IHN0YXR1c1RleHQgPSAnxJDDoyBob8OgbiB0aMOgbmgnOyBicmVhaztcclxuICAgICAgICBjYXNlICdjYW5jZWxsZWQnOiBzdGF0dXNUZXh0ID0gJ8SQw6MgaOG7p3knOyBicmVhaztcclxuICAgICAgICBjYXNlICdhd2FpdGluZ19wYXltZW50Jzogc3RhdHVzVGV4dCA9ICdDaOG7nSB0aGFuaCB0b8Ohbic7IGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6IHN0YXR1c1RleHQgPSBvcmRlci5zdGF0dXM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgaWQ6IG9yZGVyLm9yZGVyQ29kZSB8fCBvcmRlci5faWQsXHJcbiAgICAgICAgY3VzdG9tZXI6IGN1c3RvbWVyTmFtZSxcclxuICAgICAgICB0b3RhbDogb3JkZXIudG90YWxBbW91bnQsXHJcbiAgICAgICAgc3RhdHVzOiBzdGF0dXNUZXh0LFxyXG4gICAgICAgIGRhdGU6IGZvcm1hdHRlZERhdGVcclxuICAgICAgfTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBUcuG6oyB24buBIGThu68gbGnhu4d1IHRo4buRbmcga8OqXHJcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHRvdGFsT3JkZXJzLFxyXG4gICAgICBwZW5kaW5nT3JkZXJzOiBwZW5kaW5nQ291bnQsXHJcbiAgICAgIGNvbXBsZXRlZE9yZGVyczogY29tcGxldGVkQ291bnQsXHJcbiAgICAgIGNhbmNlbGxlZE9yZGVyczogY2FuY2VsbGVkQ291bnQsXHJcbiAgICAgIG9yZGVyU3RhdHVzLFxyXG4gICAgICBwcm9jZXNzaW5nVGltZSxcclxuICAgICAgdG9wT3JkZXJzOiBmb3JtYXR0ZWRUb3BPcmRlcnNcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdM4buXaSBraGkgbOG6pXkgdGjhu5FuZyBrw6ogxJHGoW4gaMOgbmc6JywgZXJyb3IpO1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBcclxuICAgICAgc3VjY2VzczogZmFsc2UsIFxyXG4gICAgICBtZXNzYWdlOiAnTOG7l2kga2hpIGzhuqV5IHRo4buRbmcga8OqIMSRxqFuIGjDoG5nJyxcclxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UgXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBIw6BtIGzhuqV5IHRo4buRbmcga8OqIGdpYW8gaMOgbmdcclxuZXhwb3J0IGNvbnN0IGdldERlbGl2ZXJ5U3RhdHMgPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgcGVyaW9kID0gcmVxLnF1ZXJ5LnBlcmlvZCB8fCAnd2Vlayc7IC8vIE3hurdjIMSR4buLbmggbMOgIHR14bqnblxyXG4gICAgY29uc3Qgc3RhcnREYXRlID0gbmV3IERhdGUoKTtcclxuICAgIGxldCBlbmREYXRlID0gbmV3IERhdGUoKTtcclxuICAgIFxyXG4gICAgLy8gVGhp4bq/dCBs4bqtcCBraG/huqNuZyB0aOG7nWkgZ2lhbiBk4buxYSB0csOqbiBwZXJpb2RcclxuICAgIHN3aXRjaCAocGVyaW9kKSB7XHJcbiAgICAgIGNhc2UgJ3dlZWsnOlxyXG4gICAgICAgIHN0YXJ0RGF0ZS5zZXREYXRlKHN0YXJ0RGF0ZS5nZXREYXRlKCkgLSA3KTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnbW9udGgnOlxyXG4gICAgICAgIHN0YXJ0RGF0ZS5zZXREYXRlKHN0YXJ0RGF0ZS5nZXREYXRlKCkgLSAzMCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ3llYXInOlxyXG4gICAgICAgIHN0YXJ0RGF0ZS5zZXREYXRlKHN0YXJ0RGF0ZS5nZXREYXRlKCkgLSAzNjUpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHN0YXJ0RGF0ZS5zZXREYXRlKHN0YXJ0RGF0ZS5nZXREYXRlKCkgLSA3KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gTOG6pXkgdGjhu5FuZyBrw6ogc+G7kSBsxrDhu6NuZyDEkcahbiBow6BuZyB0aGVvIHRy4bqhbmcgdGjDoWkgZ2lhbyBow6BuZ1xyXG4gICAgY29uc3QgY29tcGxldGVkQ291bnQgPSBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cyh7IFxyXG4gICAgICBzdGF0dXM6IHsgJGluOiBbJ2NvbXBsZXRlZCcsICdkZWxpdmVyZWQnXSB9LFxyXG4gICAgICBjcmVhdGVkQXQ6IHsgJGd0ZTogc3RhcnREYXRlLCAkbHRlOiBlbmREYXRlIH0gIFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIGNvbnN0IGluUHJvZ3Jlc3NDb3VudCA9IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHsgXHJcbiAgICAgIHN0YXR1czogeyAkaW46IFsnc2hpcHBpbmcnLCAnZGVsaXZlcmluZyddIH0sXHJcbiAgICAgIGNyZWF0ZWRBdDogeyAkZ3RlOiBzdGFydERhdGUsICRsdGU6IGVuZERhdGUgfSAgXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgY29uc3QgZGVsYXllZENvdW50ID0gYXdhaXQgT3JkZXIuY291bnREb2N1bWVudHMoeyBcclxuICAgICAgc3RhdHVzOiAnZGVsaXZlcnlfZmFpbGVkJyxcclxuICAgICAgY3JlYXRlZEF0OiB7ICRndGU6IHN0YXJ0RGF0ZSwgJGx0ZTogZW5kRGF0ZSB9ICBcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBUw61uaCB04buVbmcgc+G7kSDEkcahbiBow6BuZyBsacOqbiBxdWFuIMSR4bq/biBnaWFvIGjDoG5nXHJcbiAgICBjb25zdCB0b3RhbERlbGl2ZXJpZXMgPSBjb21wbGV0ZWRDb3VudCArIGluUHJvZ3Jlc3NDb3VudCArIGRlbGF5ZWRDb3VudDtcclxuICAgIFxyXG4gICAgLy8gVMOtbmggdGjhu51pIGdpYW4gZ2lhbyBow6BuZyB0cnVuZyBiw6xuaFxyXG4gICAgbGV0IGF2Z0RlbGl2ZXJ5VGltZSA9IFwiTi9BXCI7XHJcbiAgICBcclxuICAgIHRyeSB7XHJcbiAgICAgIC8vIEzhuqV5IGPDoWMgxJHGoW4gaMOgbmcgxJHDoyBob8OgbiB0aMOgbmggY8OzIHRow7RuZyB0aW4gdHJhY2tpbmdcclxuICAgICAgY29uc3QgY29tcGxldGVkT3JkZXJzID0gYXdhaXQgT3JkZXIuZmluZCh7XHJcbiAgICAgICAgc3RhdHVzOiB7ICRpbjogWydjb21wbGV0ZWQnLCAnZGVsaXZlcmVkJ10gfSxcclxuICAgICAgICBjcmVhdGVkQXQ6IHsgJGd0ZTogc3RhcnREYXRlLCAkbHRlOiBlbmREYXRlIH0sXHJcbiAgICAgICAgJ3RyYWNraW5nLnRyYWNraW5nX2xvZ3MnOiB7ICRleGlzdHM6IHRydWUsICRuZTogW10gfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGlmIChjb21wbGV0ZWRPcmRlcnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGxldCB0b3RhbERlbGl2ZXJ5SG91cnMgPSAwO1xyXG4gICAgICAgIGxldCB2YWxpZE9yZGVyQ291bnQgPSAwO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbXBsZXRlZE9yZGVycy5mb3JFYWNoKG9yZGVyID0+IHtcclxuICAgICAgICAgIGlmIChvcmRlci50cmFja2luZyAmJiBBcnJheS5pc0FycmF5KG9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3MpICYmIG9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3MubGVuZ3RoID49IDIpIHtcclxuICAgICAgICAgICAgY29uc3QgbG9ncyA9IFsuLi5vcmRlci50cmFja2luZy50cmFja2luZ19sb2dzXS5zb3J0KChhLCBiKSA9PiBuZXcgRGF0ZShhLnRpbWVzdGFtcCkgLSBuZXcgRGF0ZShiLnRpbWVzdGFtcCkpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVMOsbSBsb2cgxJHhuqd1IHRpw6puIHbDoCBsb2cgaG/DoG4gdGjDoG5oXHJcbiAgICAgICAgICAgIGNvbnN0IGZpcnN0TG9nID0gbG9nc1swXTtcclxuICAgICAgICAgICAgY29uc3QgY29tcGxldGlvbkxvZyA9IGxvZ3MuZmluZChsb2cgPT4gXHJcbiAgICAgICAgICAgICAgbG9nLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcgfHwgXHJcbiAgICAgICAgICAgICAgbG9nLnN0YXR1cyA9PT0gJ2RlbGl2ZXJlZCcgfHxcclxuICAgICAgICAgICAgICBsb2cuc3RhdHVzX25hbWUuaW5jbHVkZXMoJ2hvw6BuIHRow6BuaCcpIHx8XHJcbiAgICAgICAgICAgICAgbG9nLnN0YXR1c19uYW1lLmluY2x1ZGVzKCfEkcOjIGdpYW8nKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGZpcnN0TG9nICYmIGNvbXBsZXRpb25Mb2cpIHtcclxuICAgICAgICAgICAgICBjb25zdCBzdGFydFRpbWUgPSBuZXcgRGF0ZShmaXJzdExvZy50aW1lc3RhbXApO1xyXG4gICAgICAgICAgICAgIGNvbnN0IGVuZFRpbWUgPSBuZXcgRGF0ZShjb21wbGV0aW9uTG9nLnRpbWVzdGFtcCk7XHJcbiAgICAgICAgICAgICAgY29uc3QgZGVsaXZlcnlIb3VycyA9IChlbmRUaW1lIC0gc3RhcnRUaW1lKSAvICgxMDAwICogNjAgKiA2MCk7XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgaWYgKGRlbGl2ZXJ5SG91cnMgPiAwICYmIGRlbGl2ZXJ5SG91cnMgPCAyNDApIHsgLy8gTG/huqFpIGLhu48gZ2nDoSB0cuG7iyBi4bqldCB0aMaw4budbmcgKD4gMTAgbmfDoHkpXHJcbiAgICAgICAgICAgICAgICB0b3RhbERlbGl2ZXJ5SG91cnMgKz0gZGVsaXZlcnlIb3VycztcclxuICAgICAgICAgICAgICAgIHZhbGlkT3JkZXJDb3VudCsrO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICh2YWxpZE9yZGVyQ291bnQgPiAwKSB7XHJcbiAgICAgICAgICBhdmdEZWxpdmVyeVRpbWUgPSBgJHsodG90YWxEZWxpdmVyeUhvdXJzIC8gdmFsaWRPcmRlckNvdW50KS50b0ZpeGVkKDEpfSBnaeG7nWA7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdM4buXaSBraGkgdMOtbmggdGjhu51pIGdpYW4gZ2lhbyBow6BuZyB0cnVuZyBiw6xuaDonLCBlcnJvcik7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFRo4buRbmcga8OqIMSRxqFuIGjDoG5nIHRoZW8gxJHhu5FpIHTDoWMgZ2lhbyBow6BuZyAobeG6t2MgxJHhu4tuaCBsw6AgR2lhbyBIw6BuZyBOaGFuaClcclxuICAgIGNvbnN0IGRlbGl2ZXJ5UGFydG5lcnMgPSBbXHJcbiAgICAgIHsgbmFtZTogJ0dpYW8gSMOgbmcgTmhhbmgnLCB2YWx1ZTogTWF0aC5yb3VuZCh0b3RhbERlbGl2ZXJpZXMgKiAwLjc1KSB9LFxyXG4gICAgICB7IG5hbWU6ICdWaWV0dGVsIFBvc3QnLCB2YWx1ZTogTWF0aC5yb3VuZCh0b3RhbERlbGl2ZXJpZXMgKiAwLjE1KSB9LFxyXG4gICAgICB7IG5hbWU6ICdHcmFiJywgdmFsdWU6IE1hdGgucm91bmQodG90YWxEZWxpdmVyaWVzICogMC4wNykgfSxcclxuICAgICAgeyBuYW1lOiAnS2jDoWMnLCB2YWx1ZTogTWF0aC5yb3VuZCh0b3RhbERlbGl2ZXJpZXMgKiAwLjAzKSB9XHJcbiAgICBdO1xyXG4gICAgXHJcbiAgICAvLyBE4buvIGxp4buHdSB0aOG7nWkgZ2lhbiBnaWFvIGjDoG5nIHRoZW8ga2h1IHbhu7FjXHJcbiAgICBjb25zdCBkZWxpdmVyeVRpbWVCeVJlZ2lvbiA9IFtcclxuICAgICAgeyByZWdpb246ICdUcC5IQ00nLCB0aW1lOiAxMiB9LFxyXG4gICAgICB7IHJlZ2lvbjogJ0jDoCBO4buZaScsIHRpbWU6IDI0IH0sXHJcbiAgICAgIHsgcmVnaW9uOiAnxJDDoCBO4bq1bmcnLCB0aW1lOiAzNiB9LFxyXG4gICAgICB7IHJlZ2lvbjogJ0PhuqduIFRoxqEnLCB0aW1lOiA0OCB9LFxyXG4gICAgICB7IHJlZ2lvbjogJ1Thu4luaCBraMOhYycsIHRpbWU6IDcyIH1cclxuICAgIF07XHJcbiAgICBcclxuICAgIC8vIEzhuqV5IGRhbmggc8OhY2ggxJHGoW4gaMOgbmcgZ+G6p24gxJHDonkgxJHhu4MgaGnhu4NuIHRo4buLXHJcbiAgICBjb25zdCByZWNlbnRPcmRlcnMgPSBhd2FpdCBPcmRlci5maW5kKHtcclxuICAgICAgc3RhdHVzOiB7ICRuaW46IFsnY2FuY2VsbGVkJywgJ2ZhaWxlZCcsICdhd2FpdGluZ19wYXltZW50J10gfSxcclxuICAgICAgY3JlYXRlZEF0OiB7ICRndGU6IHN0YXJ0RGF0ZSwgJGx0ZTogZW5kRGF0ZSB9XHJcbiAgICB9KVxyXG4gICAgLnBvcHVsYXRlKFwidXNlcklkXCIsIFwiZmlyc3ROYW1lIGxhc3ROYW1lIGVtYWlsXCIpXHJcbiAgICAuc29ydCh7IGNyZWF0ZWRBdDogLTEgfSlcclxuICAgIC5saW1pdCgxMCk7XHJcbiAgICBcclxuICAgIC8vIENodXnhu4NuIMSR4buVaSDEkcahbiBow6BuZyB0aMOgbmggxJHhu4tuaCBk4bqhbmcgaGnhu4NuIHRo4buLIGNobyBnaWFvIGjDoG5nXHJcbiAgICBjb25zdCBkZWxpdmVyaWVzID0gcmVjZW50T3JkZXJzLm1hcChvcmRlciA9PiB7XHJcbiAgICAgIC8vIFjDoWMgxJHhu4tuaCB0cuG6oW5nIHRow6FpIGdpYW8gaMOgbmdcclxuICAgICAgbGV0IHN0YXR1cyA9ICfEkGFuZyB44butIGzDvSc7XHJcbiAgICAgIGlmIChvcmRlci5zdGF0dXMgPT09ICdjb21wbGV0ZWQnIHx8IG9yZGVyLnN0YXR1cyA9PT0gJ2RlbGl2ZXJlZCcpIHtcclxuICAgICAgICBzdGF0dXMgPSAnSG/DoG4gdGjDoG5oJztcclxuICAgICAgfSBlbHNlIGlmIChvcmRlci5zdGF0dXMgPT09ICdzaGlwcGluZycgfHwgb3JkZXIuc3RhdHVzID09PSAnZGVsaXZlcmluZycpIHtcclxuICAgICAgICBzdGF0dXMgPSAnxJBhbmcgZ2lhbyc7XHJcbiAgICAgIH0gZWxzZSBpZiAob3JkZXIuc3RhdHVzID09PSAnZGVsaXZlcnlfZmFpbGVkJykge1xyXG4gICAgICAgIHN0YXR1cyA9ICdUaOG6pXQgYuG6oWknO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyDEkOG7i25oIGThuqFuZyB0w6puIGtow6FjaCBow6BuZ1xyXG4gICAgICBsZXQgY3VzdG9tZXJOYW1lID0gJ0tow6FjaCBow6BuZyc7XHJcbiAgICAgIGlmIChvcmRlci51c2VySWQpIHtcclxuICAgICAgICBpZiAob3JkZXIudXNlcklkLmZpcnN0TmFtZSB8fCBvcmRlci51c2VySWQubGFzdE5hbWUpIHtcclxuICAgICAgICAgIGN1c3RvbWVyTmFtZSA9IGAke29yZGVyLnVzZXJJZC5maXJzdE5hbWUgfHwgJyd9ICR7b3JkZXIudXNlcklkLmxhc3ROYW1lIHx8ICcnfWAudHJpbSgpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAob3JkZXIudXNlcklkLmVtYWlsKSB7XHJcbiAgICAgICAgICBjdXN0b21lck5hbWUgPSBvcmRlci51c2VySWQuZW1haWw7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBYw6FjIMSR4buLbmggxJHhu5FpIHTDoWMgZ2lhbyBow6BuZyAobeG6t2MgxJHhu4tuaCBsw6AgR0hOKVxyXG4gICAgICBjb25zdCBwYXJ0bmVyID0gb3JkZXIuc2hpcHBpbmdQYXJ0bmVyIHx8ICdHaWFvIEjDoG5nIE5oYW5oJztcclxuICAgICAgXHJcbiAgICAgIC8vIMSQ4buLbmggZOG6oW5nIMSR4buLYSBjaOG7iVxyXG4gICAgICBjb25zdCBhZGRyZXNzID0gKG9yZGVyLnNoaXBwaW5nSW5mbyAmJiBvcmRlci5zaGlwcGluZ0luZm8uYWRkcmVzcykgfHwgXHJcbiAgICAgICAgICAgICAgICAgICAgICBvcmRlci5hZGRyZXNzIHx8IFxyXG4gICAgICAgICAgICAgICAgICAgICAgKG9yZGVyLnVzZXJJZCAmJiBvcmRlci51c2VySWQuYWRkcmVzcykgfHwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAnS2jDtG5nIGPDsyB0aMO0bmcgdGluJztcclxuICAgICAgXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgb3JkZXJJZDogb3JkZXIub3JkZXJDb2RlIHx8IG9yZGVyLl9pZCxcclxuICAgICAgICBjdXN0b21lck5hbWUsXHJcbiAgICAgICAgYWRkcmVzcyxcclxuICAgICAgICBwYXJ0bmVyLFxyXG4gICAgICAgIGRlbGl2ZXJ5VGltZTogb3JkZXIuY3JlYXRlZEF0ID8gbmV3IERhdGUob3JkZXIuY3JlYXRlZEF0KS50b0xvY2FsZURhdGVTdHJpbmcoJ3ZpLVZOJykgOiAnTi9BJyxcclxuICAgICAgICBzdGF0dXNcclxuICAgICAgfTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBUcuG6oyB24buBIGThu68gbGnhu4d1IHRo4buRbmcga8OqXHJcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN0YXRpc3RpY3M6IHtcclxuICAgICAgICBjb21wbGV0ZWQ6IGNvbXBsZXRlZENvdW50LFxyXG4gICAgICAgIGluUHJvZ3Jlc3M6IGluUHJvZ3Jlc3NDb3VudCxcclxuICAgICAgICBkZWxheWVkOiBkZWxheWVkQ291bnQsXHJcbiAgICAgICAgdG90YWw6IHRvdGFsRGVsaXZlcmllcyxcclxuICAgICAgICBhdmdEZWxpdmVyeVRpbWVcclxuICAgICAgfSxcclxuICAgICAgZGVsaXZlcnlQYXJ0bmVycyxcclxuICAgICAgZGVsaXZlcnlUaW1lQnlSZWdpb24sXHJcbiAgICAgIGRlbGl2ZXJpZXNcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdM4buXaSBraGkgbOG6pXkgdGjhu5FuZyBrw6ogZ2lhbyBow6BuZzonLCBlcnJvcik7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IFxyXG4gICAgICBzdWNjZXNzOiBmYWxzZSwgXHJcbiAgICAgIG1lc3NhZ2U6ICdM4buXaSBraGkgbOG6pXkgdGjhu5FuZyBrw6ogZ2lhbyBow6BuZycsXHJcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlIFxyXG4gICAgfSk7XHJcbiAgfVxyXG59OyBcclxuXHJcbi8vIFThuqFvIMSRxqFuIGjDoG5nIG3hu5tpXHJcbmV4cG9ydCBjb25zdCBjcmVhdGVPcmRlciA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7XHJcbiAgICAgIHVzZXJJZCxcclxuICAgICAgcHJvZHVjdHMsXHJcbiAgICAgIHNoaXBwaW5nQWRkcmVzcyxcclxuICAgICAgdG90YWxBbW91bnQsXHJcbiAgICAgIHBheW1lbnRNZXRob2QsXHJcbiAgICAgIG5vdGUsXHJcbiAgICAgIHN0YXR1cyxcclxuICAgICAgYnJhbmNoSWQsXHJcbiAgICAgIHNoaXBwaW5nSW5mbyxcclxuICAgIH0gPSByZXEuYm9keTtcclxuXHJcbiAgICAvLyDEkOG6o20gYuG6o28gxJHGoW4gaMOgbmcgbHXDtG4gY8OzIGJyYW5jaElkXHJcbiAgICBsZXQgZmluYWxCcmFuY2hJZCA9IGJyYW5jaElkO1xyXG4gICAgXHJcbiAgICAvLyBO4bq/dSBraMO0bmcgY8OzIGJyYW5jaElkLCB0w6xtIGNoaSBuaMOhbmggZ+G6p24gbmjhuqV0IGThu7FhIHRyw6puIMSR4buLYSBjaOG7iSBnaWFvIGjDoG5nXHJcbiAgICBpZiAoIWZpbmFsQnJhbmNoSWQgJiYgc2hpcHBpbmdJbmZvICYmIChzaGlwcGluZ0luZm8uYWRkcmVzcyB8fCBzaGlwcGluZ0FkZHJlc3MpKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgYWRkcmVzc1RvVXNlID0gc2hpcHBpbmdJbmZvLmFkZHJlc3MgfHwgc2hpcHBpbmdBZGRyZXNzO1xyXG4gICAgICAgIGNvbnN0IGNvb3JkaW5hdGVzID0gc2hpcHBpbmdJbmZvPy5jb29yZGluYXRlcyB8fCBudWxsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFTDrG0gY2hpIG5ow6FuaCBn4bqnbiBuaOG6pXRcclxuICAgICAgICBjb25zdCBuZWFyZXN0QnJhbmNoID0gYXdhaXQgZmluZE5lYXJlc3RCcmFuY2goYWRkcmVzc1RvVXNlLCBjb29yZGluYXRlcyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKG5lYXJlc3RCcmFuY2gpIHtcclxuICAgICAgICAgIGZpbmFsQnJhbmNoSWQgPSBuZWFyZXN0QnJhbmNoLl9pZDtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGDEkMahbiBow6BuZyDEkcaw4bujYyB04buxIMSR4buZbmcgZ8OhbiBjaG8gY2hpIG5ow6FuaDogJHtuZWFyZXN0QnJhbmNoLm5hbWV9YCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vIEfDoW4gY2hpIG5ow6FuaCBt4bq3YyDEkeG7i25oIG7hur91IGtow7RuZyB0w6xtIHRo4bqleSBjaGkgbmjDoW5oIGfhuqduIG5o4bqldFxyXG4gICAgICAgICAgY29uc3QgZGVmYXVsdEJyYW5jaCA9IGF3YWl0IEJyYW5jaC5maW5kT25lKHt9KTtcclxuICAgICAgICAgIGlmIChkZWZhdWx0QnJhbmNoKSB7XHJcbiAgICAgICAgICAgIGZpbmFsQnJhbmNoSWQgPSBkZWZhdWx0QnJhbmNoLl9pZDtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYEtow7RuZyB0w6xtIHRo4bqleSBjaGkgbmjDoW5oIHBow7kgaOG7o3AsIGfDoW4gY2hpIG5ow6FuaCBt4bq3YyDEkeG7i25oOiAke2RlZmF1bHRCcmFuY2gubmFtZX1gKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSB0w6xtIGNoaSBuaMOhbmggZ+G6p24gbmjhuqV0OlwiLCBlcnJvcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBLaeG7g20gdHJhIGPDoWMgdHLGsOG7nW5nIGLhuq90IGJ14buZY1xyXG4gICAgaWYgKCF1c2VySWQgfHwgIXByb2R1Y3RzIHx8ICF0b3RhbEFtb3VudCB8fCAhc2hpcHBpbmdBZGRyZXNzIHx8ICFwYXltZW50TWV0aG9kKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJUaGnhur91IHRow7RuZyB0aW4gY+G6p24gdGhp4bq/dCDEkeG7gyB04bqhbyDEkcahbiBow6BuZ1wiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBU4bqhbyBtw6MgxJHGoW4gaMOgbmcgbmfhuqt1IG5oacOqblxyXG4gICAgY29uc3Qgb3JkZXJDb2RlID0gZ2VuZXJhdGVPcmRlckNvZGUoKTtcclxuXHJcbiAgICAvLyBU4bqhbyDEkcahbiBow6BuZyBt4bubaVxyXG4gICAgY29uc3QgbmV3T3JkZXIgPSBuZXcgT3JkZXIoe1xyXG4gICAgICB1c2VySWQsXHJcbiAgICAgIHByb2R1Y3RzLFxyXG4gICAgICB0b3RhbEFtb3VudCxcclxuICAgICAgc2hpcHBpbmdJbmZvOiB7XHJcbiAgICAgICAgYWRkcmVzczogc2hpcHBpbmdBZGRyZXNzLFxyXG4gICAgICAgIG1ldGhvZDogXCJzdGFuZGFyZFwiLFxyXG4gICAgICB9LFxyXG4gICAgICBwYXltZW50TWV0aG9kLFxyXG4gICAgICBzdGF0dXM6IHN0YXR1cyB8fCBcInBlbmRpbmdcIixcclxuICAgICAgb3JkZXJDb2RlLFxyXG4gICAgICBub3Rlczogbm90ZSxcclxuICAgICAgYnJhbmNoSWQ6IGZpbmFsQnJhbmNoSWQgfHwgbnVsbCwgLy8gVGjDqm0gY2hpIG5ow6FuaCB44butIGzDvSBu4bq/dSBjw7NcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEzGsHUgxJHGoW4gaMOgbmcgdsOgbyBkYXRhYmFzZVxyXG4gICAgY29uc3Qgc2F2ZWRPcmRlciA9IGF3YWl0IG5ld09yZGVyLnNhdmUoKTtcclxuXHJcbiAgICAvLyBM4bqleSB0aMO0bmcgdGluIGNoaSB0aeG6v3QgxJHGoW4gaMOgbmcgKHBvcHVsYXRlIHVzZXJJZCB2w6AgcHJvZHVjdHMucHJvZHVjdElkKVxyXG4gICAgLy8gQmnhur9uIMSRxrDhu6NjIHPhu60gZOG7pW5nIMSR4buDIGfhu61pIHRow7RuZyBiw6FvIGhv4bq3YyBlbWFpbCAobuG6v3UgY+G6p24pXHJcbiAgICBhd2FpdCBPcmRlci5maW5kQnlJZChzYXZlZE9yZGVyLl9pZClcclxuICAgICAgLnBvcHVsYXRlKFwidXNlcklkXCIsIFwiZmlyc3ROYW1lIGxhc3ROYW1lIGVtYWlsIHBob25lXCIpXHJcbiAgICAgIC5wb3B1bGF0ZShcInByb2R1Y3RzLnByb2R1Y3RJZFwiKVxyXG4gICAgICAucG9wdWxhdGUoXCJicmFuY2hJZFwiKTsgLy8gVGjDqm0gcG9wdWxhdGUgYnJhbmNoSWRcclxuXHJcbiAgICAvLyBD4bqtcCBuaOG6rXQgc+G7kSBsxrDhu6NuZyBz4bqjbiBwaOG6qW0gdsOgIGRvYW5oIHPhu5EgYsOhbiBow6BuZ1xyXG4gICAgdHJ5IHtcclxuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHByb2R1Y3RzKSB7XHJcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IGF3YWl0IFByb2R1Y3QuZmluZEJ5SWQoaXRlbS5wcm9kdWN0SWQpO1xyXG4gICAgICAgIGlmIChwcm9kdWN0KSB7XHJcbiAgICAgICAgICAvLyBD4bqtcCBuaOG6rXQgc+G7kSBsxrDhu6NuZyB04buTbiBraG9cclxuICAgICAgICAgIGNvbnN0IG5ld1N0b2NrID0gTWF0aC5tYXgoMCwgcHJvZHVjdC5wcm9kdWN0U3RvY2sgLSBpdGVtLnF1YW50aXR5KTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gQ+G6rXAgbmjhuq10IHPhu5EgbMaw4bujbmcgxJHDoyBiw6FuXHJcbiAgICAgICAgICBjb25zdCBuZXdTb2xkQ291bnQgPSAocHJvZHVjdC5zb2xkQ291bnQgfHwgMCkgKyBpdGVtLnF1YW50aXR5O1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBhd2FpdCBQcm9kdWN0LmZpbmRCeUlkQW5kVXBkYXRlKFxyXG4gICAgICAgICAgICBpdGVtLnByb2R1Y3RJZCxcclxuICAgICAgICAgICAgeyBcclxuICAgICAgICAgICAgICBwcm9kdWN0U3RvY2s6IG5ld1N0b2NrLFxyXG4gICAgICAgICAgICAgIHNvbGRDb3VudDogbmV3U29sZENvdW50XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgLy8gQ+G6rXAgbmjhuq10IHRo4buRbmcga8OqIHPhuqNuIHBo4bqpbSBiw6FuIGNo4bqheVxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgQmVzdFNlbGxpbmdQcm9kdWN0LnVwZGF0ZVNhbGVzRGF0YShcclxuICAgICAgICAgICAgICBpdGVtLnByb2R1Y3RJZCwgXHJcbiAgICAgICAgICAgICAgcHJvZHVjdCwgXHJcbiAgICAgICAgICAgICAgaXRlbS5xdWFudGl0eSwgXHJcbiAgICAgICAgICAgICAgc2F2ZWRPcmRlci5faWRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKHN0YXRzRXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSBj4bqtcCBuaOG6rXQgdGjhu5FuZyBrw6ogc+G6o24gcGjhuqltIGLDoW4gY2jhuqF5OlwiLCBzdGF0c0Vycm9yKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGludmVudG9yeUVycm9yKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgY+G6rXAgbmjhuq10IHPhu5EgbMaw4bujbmcgc+G6o24gcGjhuqltOlwiLCBpbnZlbnRvcnlFcnJvcik7XHJcbiAgICAgIC8vIEtow7RuZyDhuqNuaCBoxrDhu59uZyDEkeG6v24gdmnhu4djIHThuqFvIMSRxqFuIGjDoG5nXHJcbiAgICB9XHJcblxyXG4gICAgLy8gR+G7rWkgdGjDtG5nIGLDoW8gxJHGoW4gaMOgbmcgbeG7m2kgcXVhIFNvY2tldC5JTyAobuG6v3UgY8OzKVxyXG4gICAgdHJ5IHtcclxuICAgICAgc2VuZE9yZGVyU3RhdHVzTm90aWZpY2F0aW9uKFxyXG4gICAgICAgIHNhdmVkT3JkZXIuX2lkLCBcclxuICAgICAgICB1c2VySWQsIFxyXG4gICAgICAgIFwixJDGoW4gaMOgbmcgbeG7m2lcIiwgXHJcbiAgICAgICAgYMSQxqFuIGjDoG5nICMke29yZGVyQ29kZX0gxJHDoyDEkcaw4bujYyB04bqhbyB0aMOgbmggY8O0bmcuIMSQxqFuIGjDoG5nIHPhur0gxJHGsOG7o2MgeOG7rSBsw70gc+G7m20uYFxyXG4gICAgICApO1xyXG4gICAgfSBjYXRjaCAobm90aWZpY2F0aW9uRXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSBn4butaSB0aMO0bmcgYsOhbyDEkcahbiBow6BuZzpcIiwgbm90aWZpY2F0aW9uRXJyb3IpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMSkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2U6IFwiVOG6oW8gxJHGoW4gaMOgbmcgdGjDoG5oIGPDtG5nXCIsXHJcbiAgICAgIF9pZDogc2F2ZWRPcmRlci5faWQsXHJcbiAgICAgIG9yZGVyQ29kZTogc2F2ZWRPcmRlci5vcmRlckNvZGUsXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSB04bqhbyDEkcahbiBow6BuZzpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IFwiTOG7l2kga2hpIHThuqFvIMSRxqFuIGjDoG5nXCIsXHJcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gSMOgbSBs4bqleSDEkcahbiBow6BuZyB0aGVvIGNoaSBuaMOhbmhcclxuZXhwb3J0IGNvbnN0IGdldE9yZGVyc0J5QnJhbmNoID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgYnJhbmNoSWQgfSA9IHJlcS5wYXJhbXM7XHJcbiAgICBjb25zdCB7IHBhZ2UgPSAxLCBwYWdlU2l6ZSA9IDEwLCBzZWFyY2hUZXJtLCBzdGF0dXMsIHBheW1lbnRNZXRob2QsIGlzUGFpZCwgZGF0ZSwgbmVhcmJ5LCByYWRpdXMgPSAxMCB9ID0gcmVxLnF1ZXJ5O1xyXG4gICAgXHJcbiAgICBpZiAoIWJyYW5jaElkKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IFxyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiVGhp4bq/dSBJRCBjaGkgbmjDoW5oXCIgXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgLy8gVHJ1eSB24bqlbiBicmFuY2hJZCBsw6Agc3RyaW5nLCBLSMOUTkcgY29udmVydCBzYW5nIE9iamVjdElkXHJcbiAgICBjb25zdCBxdWVyeSA9IHsgYnJhbmNoSWQgfTtcclxuICAgIFxyXG4gICAgLy8gVGjDqm0gxJFp4buBdSBraeG7h24gdMOsbSBraeG6v20gbuG6v3UgY8OzXHJcbiAgICBpZiAoc2VhcmNoVGVybSkge1xyXG4gICAgICAvLyBUw6xtIGtp4bq/bSB0aGVvIG3DoyDEkcahbiBow6BuZywgdGjDtG5nIHRpbiBuZ8aw4budaSBkw7luZyB2w6AgdGjDtG5nIHRpbiBnaWFvIGjDoG5nXHJcbiAgICAgIHF1ZXJ5LiRvciA9IFtcclxuICAgICAgICB7IG9yZGVyQ29kZTogeyAkcmVnZXg6IHNlYXJjaFRlcm0sICRvcHRpb25zOiAnaScgfSB9LFxyXG4gICAgICAgIHsgbm90ZXM6IHsgJHJlZ2V4OiBzZWFyY2hUZXJtLCAkb3B0aW9uczogJ2knIH0gfVxyXG4gICAgICBdO1xyXG4gICAgICBcclxuICAgICAgLy8gVMOsbSBraeG6v20gdGhlbyB0aMO0bmcgdGluIG5nxrDhu51pIGTDuW5nIChj4bqnbiBwb3B1bGF0ZSB0csaw4bubYylcclxuICAgICAgY29uc3QgdXNlcnNXaXRoU2VhcmNoVGVybSA9IGF3YWl0IG1vbmdvb3NlLm1vZGVsKCdVc2VyJykuZmluZCh7XHJcbiAgICAgICAgJG9yOiBbXHJcbiAgICAgICAgICB7IGZpcnN0TmFtZTogeyAkcmVnZXg6IHNlYXJjaFRlcm0sICRvcHRpb25zOiAnaScgfSB9LFxyXG4gICAgICAgICAgeyBsYXN0TmFtZTogeyAkcmVnZXg6IHNlYXJjaFRlcm0sICRvcHRpb25zOiAnaScgfSB9LFxyXG4gICAgICAgICAgeyBwaG9uZTogeyAkcmVnZXg6IHNlYXJjaFRlcm0sICRvcHRpb25zOiAnaScgfSB9LFxyXG4gICAgICAgICAgeyBlbWFpbDogeyAkcmVnZXg6IHNlYXJjaFRlcm0sICRvcHRpb25zOiAnaScgfSB9XHJcbiAgICAgICAgXVxyXG4gICAgICB9KS5zZWxlY3QoJ19pZCcpO1xyXG4gICAgICBcclxuICAgICAgaWYgKHVzZXJzV2l0aFNlYXJjaFRlcm0ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGNvbnN0IHVzZXJJZHMgPSB1c2Vyc1dpdGhTZWFyY2hUZXJtLm1hcCh1c2VyID0+IHVzZXIuX2lkKTtcclxuICAgICAgICBxdWVyeS4kb3IucHVzaCh7IHVzZXJJZDogeyAkaW46IHVzZXJJZHMgfSB9KTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy8gVMOsbSBraeG6v20gdHJvbmcgdGjDtG5nIHRpbiBnaWFvIGjDoG5nXHJcbiAgICAgIHF1ZXJ5LiRvci5wdXNoKHsgJ3NoaXBwaW5nSW5mby5hZGRyZXNzJzogeyAkcmVnZXg6IHNlYXJjaFRlcm0sICRvcHRpb25zOiAnaScgfSB9KTtcclxuICAgICAgcXVlcnkuJG9yLnB1c2goeyAnc2hpcHBpbmdJbmZvLnBob25lJzogeyAkcmVnZXg6IHNlYXJjaFRlcm0sICRvcHRpb25zOiAnaScgfSB9KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gVGjDqm0gxJFp4buBdSBraeG7h24gbOG7jWMgdGhlbyB0cuG6oW5nIHRow6FpXHJcbiAgICBpZiAoc3RhdHVzKSB7XHJcbiAgICAgIHF1ZXJ5LnN0YXR1cyA9IHN0YXR1cztcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gVGjDqm0gxJFp4buBdSBraeG7h24gbOG7jWMgdGhlbyBwaMawxqFuZyB0aOG7qWMgdGhhbmggdG/DoW5cclxuICAgIGlmIChwYXltZW50TWV0aG9kKSB7XHJcbiAgICAgIHF1ZXJ5LnBheW1lbnRNZXRob2QgPSBwYXltZW50TWV0aG9kO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBUaMOqbSDEkWnhu4F1IGtp4buHbiBs4buNYyB0aGVvIHRy4bqhbmcgdGjDoWkgdGhhbmggdG/DoW5cclxuICAgIGlmIChpc1BhaWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBxdWVyeS5pc1BhaWQgPSBpc1BhaWQgPT09ICd0cnVlJztcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gVGjDqm0gxJFp4buBdSBraeG7h24gbOG7jWMgdGhlbyBuZ8OgeVxyXG4gICAgaWYgKGRhdGUpIHtcclxuICAgICAgY29uc3Qgc3RhcnREYXRlID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgICAgIHN0YXJ0RGF0ZS5zZXRIb3VycygwLCAwLCAwLCAwKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IGVuZERhdGUgPSBuZXcgRGF0ZShkYXRlKTtcclxuICAgICAgZW5kRGF0ZS5zZXRIb3VycygyMywgNTksIDU5LCA5OTkpO1xyXG4gICAgICBcclxuICAgICAgcXVlcnkuY3JlYXRlZEF0ID0geyAkZ3RlOiBzdGFydERhdGUsICRsdGU6IGVuZERhdGUgfTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gWOG7rSBsw70gbOG7jWMgxJHGoW4gaMOgbmcgZ+G6p24gY2hpIG5ow6FuaFxyXG4gICAgaWYgKG5lYXJieSA9PT0gJ3RydWUnKSB7XHJcbiAgICAgIGNvbnN0IGJyYW5jaCA9IGF3YWl0IEJyYW5jaC5maW5kQnlJZChicmFuY2hJZCk7XHJcbiAgICAgIGlmICghYnJhbmNoIHx8ICFicmFuY2gubG9jYXRpb24gfHwgIWJyYW5jaC5sb2NhdGlvbi5jb29yZGluYXRlcykge1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgIG1lc3NhZ2U6IFwiQ2hpIG5ow6FuaCBraMO0bmcgY8OzIHRow7RuZyB0aW4gduG7iyB0csOtXCJcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy8gVMOsbSBjw6FjIMSRxqFuIGjDoG5nIHRyb25nIGLDoW4ga8OtbmggKHJhZGl1cykga20gdOG7qyBjaGkgbmjDoW5oXHJcbiAgICAgIGNvbnN0IHJhZGl1c0luS20gPSBwYXJzZUludChyYWRpdXMpIHx8IDEwO1xyXG4gICAgICBcclxuICAgICAgdHJ5IHtcclxuICAgICAgICAvLyBO4bq/dSDEkcahbiBow6BuZyBjw7MgbMawdSB04buNYSDEkeG7mSBnaWFvIGjDoG5nXHJcbiAgICAgICAgaWYgKGJyYW5jaC5sb2NhdGlvbiAmJiBicmFuY2gubG9jYXRpb24udHlwZSA9PT0gJ1BvaW50Jykge1xyXG4gICAgICAgICAgLy8gU+G7rSBk4bulbmcgTW9uZ29EQiBHZW9zcGF0aWFsIHF1ZXJ5IG7hur91IGPDsyBsxrB1IHThu41hIMSR4buZXHJcbiAgICAgICAgICBjb25zdCBvcmRlcnNJblJhZGl1cyA9IGF3YWl0IE9yZGVyLmZpbmQoe1xyXG4gICAgICAgICAgICAnZGVsaXZlcnlMb2NhdGlvbic6IHtcclxuICAgICAgICAgICAgICAkbmVhcjoge1xyXG4gICAgICAgICAgICAgICAgJGdlb21ldHJ5OiB7XHJcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdQb2ludCcsXHJcbiAgICAgICAgICAgICAgICAgIGNvb3JkaW5hdGVzOiBicmFuY2gubG9jYXRpb24uY29vcmRpbmF0ZXNcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAkbWF4RGlzdGFuY2U6IHJhZGl1c0luS20gKiAxMDAwIC8vIENvbnZlcnQga20gdG8gbWV0ZXJzXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KS5zZWxlY3QoJ19pZCcpO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBpZiAob3JkZXJzSW5SYWRpdXMgJiYgb3JkZXJzSW5SYWRpdXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBjb25zdCBvcmRlcklkcyA9IG9yZGVyc0luUmFkaXVzLm1hcChvcmRlciA9PiBvcmRlci5faWQpO1xyXG4gICAgICAgICAgICAvLyBUaMOqbSDEkWnhu4F1IGtp4buHbiB2w6BvIHF1ZXJ5XHJcbiAgICAgICAgICAgIHF1ZXJ5Ll9pZCA9IHsgJGluOiBvcmRlcklkcyB9O1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gTuG6v3Uga2jDtG5nIHTDrG0gdGjhuqV5IMSRxqFuIGjDoG5nIHRyb25nIGLDoW4ga8OtbmgsIHRy4bqjIHbhu4EgZGFuaCBzw6FjaCB0cuG7kW5nXHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgICAgICAgICAgb3JkZXJzOiBbXSxcclxuICAgICAgICAgICAgICB0b3RhbENvdW50OiAwLFxyXG4gICAgICAgICAgICAgIHN0YXRzOiB7XHJcbiAgICAgICAgICAgICAgICB0b3RhbDogMCxcclxuICAgICAgICAgICAgICAgIHBlbmRpbmc6IDAsXHJcbiAgICAgICAgICAgICAgICBjb25maXJtZWQ6IDAsXHJcbiAgICAgICAgICAgICAgICBwcmVwYXJpbmc6IDAsXHJcbiAgICAgICAgICAgICAgICBwYWNrYWdpbmc6IDAsXHJcbiAgICAgICAgICAgICAgICBzaGlwcGluZzogMCxcclxuICAgICAgICAgICAgICAgIGRlbGl2ZXJpbmc6IDAsXHJcbiAgICAgICAgICAgICAgICBjb21wbGV0ZWQ6IDAsXHJcbiAgICAgICAgICAgICAgICBjYW5jZWxsZWQ6IDAsXHJcbiAgICAgICAgICAgICAgICBkZWxpdmVyeV9mYWlsZWQ6IDAsXHJcbiAgICAgICAgICAgICAgICBhd2FpdGluZ19wYXltZW50OiAwXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gTuG6v3Uga2jDtG5nIGPDsyB04buNYSDEkeG7mSwgY8OzIHRo4buDIHPhu60gZOG7pW5nIHBoxrDGoW5nIHBow6FwIGtow6FjIMSR4buDIGzhu41jXHJcbiAgICAgICAgICAvLyBWw60gZOG7pTogbOG7jWMgdGhlbyBtw6MgYsawdSDEkWnhu4duLCBxdeG6rW4vaHV54buHbiwgdi52LlxyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJDaGkgbmjDoW5oIGtow7RuZyBjw7MgdOG7jWEgxJHhu5ksIGtow7RuZyB0aOG7gyBs4buNYyB0aGVvIGLDoW4ga8OtbmhcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgbOG7jWMgxJHGoW4gaMOgbmcgdGhlbyBiw6FuIGvDrW5oOlwiLCBlcnJvcik7XHJcbiAgICAgICAgLy8gS2jDtG5nIHRocm93IGVycm9yLCB0aeG6v3AgdOG7pWMgeOG7rSBsw70gduG7m2kgcXVlcnkgaGnhu4duIHThuqFpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gVMOtbmggdG/DoW4gcGjDom4gdHJhbmdcclxuICAgIGNvbnN0IHNraXAgPSAocGFyc2VJbnQocGFnZSkgLSAxKSAqIHBhcnNlSW50KHBhZ2VTaXplKTtcclxuICAgIGNvbnN0IGxpbWl0ID0gcGFyc2VJbnQocGFnZVNpemUpO1xyXG4gICAgXHJcbiAgICAvLyDEkOG6v20gdOG7lW5nIHPhu5EgxJHGoW4gaMOgbmcgdGjhu49hIG3Do24gxJFp4buBdSBraeG7h25cclxuICAgIGNvbnN0IHRvdGFsQ291bnQgPSBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cyhxdWVyeSk7XHJcbiAgICBcclxuICAgIC8vIEzhuqV5IGRhbmggc8OhY2ggxJHGoW4gaMOgbmcgdGhlbyDEkWnhu4F1IGtp4buHbiB2w6AgcGjDom4gdHJhbmdcclxuICAgIGNvbnN0IG9yZGVycyA9IGF3YWl0IE9yZGVyLmZpbmQocXVlcnkpXHJcbiAgICAgIC5wb3B1bGF0ZSgndXNlcklkJylcclxuICAgICAgLnBvcHVsYXRlKCdwcm9kdWN0cy5wcm9kdWN0SWQnKVxyXG4gICAgICAucG9wdWxhdGUoJ2JyYW5jaElkJylcclxuICAgICAgLnNvcnQoeyBjcmVhdGVkQXQ6IC0xIH0pXHJcbiAgICAgIC5za2lwKHNraXApXHJcbiAgICAgIC5saW1pdChsaW1pdCk7XHJcbiAgICBcclxuICAgIC8vIEzhuqV5IHRo4buRbmcga8OqIMSRxqFuIGjDoG5nIHRoZW8gdHLhuqFuZyB0aMOhaVxyXG4gICAgY29uc3Qgc3RhdHMgPSB7XHJcbiAgICAgIHRvdGFsOiB0b3RhbENvdW50LFxyXG4gICAgICBwZW5kaW5nOiBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cyh7IC4uLnF1ZXJ5LCBzdGF0dXM6ICdwZW5kaW5nJyB9KSxcclxuICAgICAgY29uZmlybWVkOiBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cyh7IC4uLnF1ZXJ5LCBzdGF0dXM6ICdjb25maXJtZWQnIH0pLFxyXG4gICAgICBwcmVwYXJpbmc6IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHsgLi4ucXVlcnksIHN0YXR1czogJ3ByZXBhcmluZycgfSksXHJcbiAgICAgIHBhY2thZ2luZzogYXdhaXQgT3JkZXIuY291bnREb2N1bWVudHMoeyAuLi5xdWVyeSwgc3RhdHVzOiAncGFja2FnaW5nJyB9KSxcclxuICAgICAgc2hpcHBpbmc6IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHsgLi4ucXVlcnksIHN0YXR1czogJ3NoaXBwaW5nJyB9KSxcclxuICAgICAgZGVsaXZlcmluZzogYXdhaXQgT3JkZXIuY291bnREb2N1bWVudHMoeyAuLi5xdWVyeSwgc3RhdHVzOiAnZGVsaXZlcmluZycgfSksXHJcbiAgICAgIGNvbXBsZXRlZDogYXdhaXQgT3JkZXIuY291bnREb2N1bWVudHMoeyAuLi5xdWVyeSwgc3RhdHVzOiAnY29tcGxldGVkJyB9KSxcclxuICAgICAgY2FuY2VsbGVkOiBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cyh7IC4uLnF1ZXJ5LCBzdGF0dXM6ICdjYW5jZWxsZWQnIH0pLFxyXG4gICAgICBkZWxpdmVyeV9mYWlsZWQ6IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHsgLi4ucXVlcnksIHN0YXR1czogJ2RlbGl2ZXJ5X2ZhaWxlZCcgfSksXHJcbiAgICAgIGF3YWl0aW5nX3BheW1lbnQ6IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHsgLi4ucXVlcnksIHN0YXR1czogJ2F3YWl0aW5nX3BheW1lbnQnIH0pLFxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBvcmRlcnMsXHJcbiAgICAgIHRvdGFsQ291bnQsXHJcbiAgICAgIHN0YXRzXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgbOG6pXkgxJHGoW4gaMOgbmcgdGhlbyBjaGkgbmjDoW5oOlwiLCBlcnIpO1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIGVycm9yOiBlcnIubWVzc2FnZSBcclxuICAgIH0pO1xyXG4gIH1cclxufTsiXSwibWFwcGluZ3MiOiI7QUFDQSxJQUFBQSxNQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFB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