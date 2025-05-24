"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.updateOrderPaymentStatus = exports.updateOrder = exports.orderUpdate = exports.orderGetById = exports.orderGetAll = exports.orderGet = exports.orderDelete = exports.orderCreate = exports.notifyOrderSuccess = exports.markOrderAsPaid = exports.getTopOrders = exports.getOrderTracking = exports.getOrderStats = exports.getDeliveryStats = exports.cancelOrder = void 0;
var _Order = _interopRequireDefault(require("../Model/Order.js"));
var _Products = _interopRequireDefault(require("../Model/Products.js"));
var _axios = _interopRequireDefault(require("axios"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _emailService = require("../utils/emailService.js");
var _BestSellingProduct = _interopRequireDefault(require("../Model/BestSellingProduct.js"));
var _notificationService = require("../Services/notificationService.js");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };} /* eslint-disable no-undef */

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
    const orders = await _Order.default.find().
    populate("userId").
    populate('products.productId').
    sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
        console.log(`Đã gửi thông báo cập nhật trạng thái đơn hàng ${updatedOrder.orderCode} đến user ${updatedOrder.userId}`);
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
        console.log(`Đã gửi thông báo cập nhật trạng thái thanh toán đơn hàng ${updatedOrder.orderCode} đến user ${updatedOrder.userId}`);
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
};exports.getDeliveryStats = getDeliveryStats;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfT3JkZXIiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9Qcm9kdWN0cyIsIl9heGlvcyIsIl9kb3RlbnYiLCJfZW1haWxTZXJ2aWNlIiwiX0Jlc3RTZWxsaW5nUHJvZHVjdCIsIl9ub3RpZmljYXRpb25TZXJ2aWNlIiwiZSIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwiZG90ZW52IiwiY29uZmlnIiwiZ2VuZXJhdGVPcmRlckNvZGUiLCJjaGFyYWN0ZXJzIiwicmVzdWx0IiwiaSIsImNoYXJBdCIsIk1hdGgiLCJmbG9vciIsInJhbmRvbSIsImxlbmd0aCIsInVwZGF0ZVByb2R1Y3RTdG9jayIsInByb2R1Y3RzIiwiaW5jcmVhc2UiLCJ1cGRhdGVTb2xkQ291bnQiLCJpdGVtIiwicHJvZHVjdCIsIlByb2R1Y3QiLCJmaW5kQnlJZCIsInByb2R1Y3RJZCIsIm5ld1N0b2NrIiwicHJvZHVjdFN0b2NrIiwicXVhbnRpdHkiLCJtYXgiLCJwcm9kdWN0U3RhdHVzIiwic29sZENvdW50Iiwic2F2ZSIsImVycm9yIiwiY29uc29sZSIsIm9yZGVyQ3JlYXRlIiwicmVxIiwicmVzIiwidXNlcklkIiwidG90YWxBbW91bnQiLCJwYXltZW50TWV0aG9kIiwiY291cG9uIiwiYm9keSIsIkFycmF5IiwiaXNBcnJheSIsInN0YXR1cyIsImpzb24iLCJzdWNjZXNzIiwicHJvZHVjdE5hbWUiLCJvcmRlciIsIk9yZGVyIiwiY3JlYXRlZEF0IiwiRGF0ZSIsIm9yZGVyQ29kZSIsInBvcHVsYXRlZE9yZGVyIiwiX2lkIiwicG9wdWxhdGUiLCJlbWFpbCIsInNoaXBwaW5nSW5mbyIsImZ1bGxOYW1lIiwiZmlyc3ROYW1lIiwibGFzdE5hbWUiLCJ0cmltIiwiYWRkcmVzcyIsInBob25lIiwibG9nIiwiZW1haWxTZW50Iiwic2VuZE9yZGVyQ29uZmlybWF0aW9uRW1haWwiLCJlbWFpbEVycm9yIiwiaGFzT3JkZXIiLCJoYXNVc2VySWQiLCJoYXNFbWFpbCIsInVuZGVmaW5lZCIsImVyciIsIm1lc3NhZ2UiLCJleHBvcnRzIiwib3JkZXJHZXQiLCJxdWVyeSIsInVzZXIiLCJvcmRlcnMiLCJmaW5kIiwic29ydCIsIm9yZGVyR2V0QWxsIiwib3JkZXJHZXRCeUlkIiwicGFyYW1zIiwiaWQiLCJ1cGRhdGVPcmRlciIsIm9yZGVySWQiLCJ1cGRhdGVEYXRhIiwiSlNPTiIsInN0cmluZ2lmeSIsInByZXZpb3VzU3RhdHVzIiwibmV3U3RhdHVzIiwiYWxsb3dlZEZpZWxkcyIsImZpbHRlcmVkRGF0YSIsImtleSIsIk9iamVjdCIsImtleXMiLCJpbmNsdWRlcyIsInRyYWNraW5nIiwic3RhdHVzX25hbWUiLCJ0cmFja2luZ19sb2dzIiwic3RhdHVzTmFtZSIsIm5ld1RyYWNraW5nTG9nIiwidGltZXN0YW1wIiwidG9JU09TdHJpbmciLCJsb2NhdGlvbiIsInVuc2hpZnQiLCJpc1BhaWQiLCJjb21wbGV0ZWRBdCIsIkJlc3RTZWxsaW5nUHJvZHVjdCIsInVwZGF0ZVNhbGVzRGF0YSIsImJlc3RTZWxsZXJFcnJvciIsInVwZGF0ZWRPcmRlciIsImZpbmRCeUlkQW5kVXBkYXRlIiwiJHNldCIsIm5ldyIsInVzZXJOYW1lIiwic2VuZE9yZGVyU2hpcHBpbmdFbWFpbCIsInN0YWNrIiwic2VuZE9yZGVyU3RhdHVzTm90aWZpY2F0aW9uIiwiZ2V0U3RhdHVzVGV4dCIsIm5vdGlmaWNhdGlvbkVycm9yIiwiZGF0YSIsIm9yZGVyVXBkYXRlIiwiY3VycmVudE9yZGVyIiwibWFya09yZGVyQXNQYWlkIiwid2FzUGFpZCIsIm9yZGVyRGVsZXRlIiwiZmluZEJ5SWRBbmREZWxldGUiLCJjYW5jZWxPcmRlciIsImdldE9yZGVyVHJhY2tpbmciLCJmaW5kT25lIiwiZXN0aW1hdGVkX2RlbGl2ZXJ5X3RpbWUiLCJlc3RpbWF0ZWREZWxpdmVyeSIsInNldERhdGUiLCJnZXREYXRlIiwib3JkZXJfY29kZSIsImN1cnJlbnRfbG9jYXRpb24iLCJkZWxpdmVyeV9ub3RlIiwibm90ZXMiLCJpc01vY2tlZCIsIlNIT1BfSUQiLCJwcm9jZXNzIiwiZW52IiwiU0hPUF9UT0tFTl9BUEkiLCJVU0VfTU9DS19PTl9FUlJPUiIsIm1vY2tEYXRhIiwiZ2VuZXJhdGVNb2NrVHJhY2tpbmdEYXRhRnJvbU9yZGVyIiwic3Vic3RyaW5nIiwicmVzcG9uc2UiLCJheGlvcyIsInBvc3QiLCJoZWFkZXJzIiwiY29kZSIsImFwaUVycm9yIiwiZGJFcnJvciIsImdlbmVyYXRlTW9ja1RyYWNraW5nRGF0YSIsIm5vdyIsInRyYWNraW5nTG9ncyIsInRpbWVEYXkyIiwic2V0SG91cnMiLCJnZXRIb3VycyIsInRpbWVUb2RheTEiLCJ0aW1lVG9kYXkyIiwidGltZUxhdGVzdCIsInNldE1pbnV0ZXMiLCJnZXRNaW51dGVzIiwidXBkYXRlT3JkZXJQYXltZW50U3RhdHVzIiwicGF5bWVudFN0YXR1cyIsIm9sZFBheW1lbnRTdGF0dXMiLCJvbGRJc1BhaWQiLCJub3RpZnlPcmRlclN1Y2Nlc3MiLCJ1c2VyRW1haWwiLCJ1cGRhdGVFcnJvciIsImdldFRvcE9yZGVycyIsImxpbWl0IiwicGFyc2VJbnQiLCJ0b3BPcmRlcnMiLCJmb3JtYXR0ZWRPcmRlcnMiLCJtYXAiLCJjdXN0b21lck5hbWUiLCJvcmRlckRhdGUiLCJmb3JtYXR0ZWREYXRlIiwiZ2V0TW9udGgiLCJnZXRGdWxsWWVhciIsInN0YXR1c1RleHQiLCJjdXN0b21lciIsInRvdGFsIiwiZGF0ZSIsImdldE9yZGVyU3RhdHMiLCJwZXJpb2QiLCJzdGFydERhdGUiLCJlbmREYXRlIiwicGVuZGluZ0NvdW50IiwiY291bnREb2N1bWVudHMiLCIkaW4iLCIkZ3RlIiwiJGx0ZSIsInNoaXBwaW5nQ291bnQiLCJjb21wbGV0ZWRDb3VudCIsImNhbmNlbGxlZENvdW50IiwidG90YWxPcmRlcnMiLCJvcmRlclN0YXR1cyIsIm5hbWUiLCJ2YWx1ZSIsInByb2Nlc3NpbmdUaW1lIiwiY29tcGxldGVkT3JkZXJzIiwiJGV4aXN0cyIsInRvdGFsUHJvY2Vzc2luZ1RpbWUiLCJ0b3RhbFNoaXBwaW5nVGltZSIsInRvdGFsVG90YWxUaW1lIiwiZm9yRWFjaCIsImxvZ3MiLCJhIiwiYiIsInBhY2thZ2luZ0xvZyIsInBhY2thZ2luZ1RpbWUiLCJzaGlwcGluZ0xvZyIsImRlbGl2ZXJlZExvZyIsImRlbGl2ZXJ5VGltZSIsInRvdGFsVGltZSIsImF2Z1Byb2Nlc3NpbmdUaW1lIiwicm91bmQiLCJhdmdTaGlwcGluZ1RpbWUiLCJhdmdUb3RhbFRpbWUiLCJ0aW1lIiwiZm9ybWF0dGVkVG9wT3JkZXJzIiwicGVuZGluZ09yZGVycyIsImNhbmNlbGxlZE9yZGVycyIsImdldERlbGl2ZXJ5U3RhdHMiLCJpblByb2dyZXNzQ291bnQiLCJkZWxheWVkQ291bnQiLCJ0b3RhbERlbGl2ZXJpZXMiLCJhdmdEZWxpdmVyeVRpbWUiLCIkbmUiLCJ0b3RhbERlbGl2ZXJ5SG91cnMiLCJ2YWxpZE9yZGVyQ291bnQiLCJmaXJzdExvZyIsImNvbXBsZXRpb25Mb2ciLCJzdGFydFRpbWUiLCJlbmRUaW1lIiwiZGVsaXZlcnlIb3VycyIsInRvRml4ZWQiLCJkZWxpdmVyeVBhcnRuZXJzIiwiZGVsaXZlcnlUaW1lQnlSZWdpb24iLCJyZWdpb24iLCJyZWNlbnRPcmRlcnMiLCIkbmluIiwiZGVsaXZlcmllcyIsInBhcnRuZXIiLCJzaGlwcGluZ1BhcnRuZXIiLCJ0b0xvY2FsZURhdGVTdHJpbmciLCJzdGF0aXN0aWNzIiwiY29tcGxldGVkIiwiaW5Qcm9ncmVzcyIsImRlbGF5ZWQiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvQ29udHJvbGxlci9vcmRlckNvbnRyb2xsZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cbmltcG9ydCBPcmRlciBmcm9tIFwiLi4vTW9kZWwvT3JkZXIuanNcIjtcbmltcG9ydCBQcm9kdWN0IGZyb20gXCIuLi9Nb2RlbC9Qcm9kdWN0cy5qc1wiO1xuaW1wb3J0IGF4aW9zIGZyb20gXCJheGlvc1wiO1xuaW1wb3J0IGRvdGVudiBmcm9tIFwiZG90ZW52XCI7XG5pbXBvcnQgeyBzZW5kT3JkZXJDb25maXJtYXRpb25FbWFpbCwgc2VuZE9yZGVyU2hpcHBpbmdFbWFpbCB9IGZyb20gXCIuLi91dGlscy9lbWFpbFNlcnZpY2UuanNcIjtcbmltcG9ydCBCZXN0U2VsbGluZ1Byb2R1Y3QgZnJvbSBcIi4uL01vZGVsL0Jlc3RTZWxsaW5nUHJvZHVjdC5qc1wiO1xuaW1wb3J0IHsgc2VuZE9yZGVyU3RhdHVzTm90aWZpY2F0aW9uIH0gZnJvbSBcIi4uL1NlcnZpY2VzL25vdGlmaWNhdGlvblNlcnZpY2UuanNcIjtcblxuZG90ZW52LmNvbmZpZygpO1xuXG4vLyBIw6BtIHThuqFvIG3DoyB24bqtbiDEkcahbiBuZ+G6q3Ugbmhpw6puXG5mdW5jdGlvbiBnZW5lcmF0ZU9yZGVyQ29kZSgpIHtcbiAgY29uc3QgY2hhcmFjdGVycyA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWjAxMjM0NTY3ODknO1xuICBsZXQgcmVzdWx0ID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgIHJlc3VsdCArPSBjaGFyYWN0ZXJzLmNoYXJBdChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGFyYWN0ZXJzLmxlbmd0aCkpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIEjDoG0gY+G6rXAgbmjhuq10IHPhu5EgbMaw4bujbmcgdOG7k24ga2hvIHPhuqNuIHBo4bqpbVxuYXN5bmMgZnVuY3Rpb24gdXBkYXRlUHJvZHVjdFN0b2NrKHByb2R1Y3RzLCBpbmNyZWFzZSA9IGZhbHNlLCB1cGRhdGVTb2xkQ291bnQgPSBmYWxzZSkge1xuICB0cnkge1xuICAgIGZvciAoY29uc3QgaXRlbSBvZiBwcm9kdWN0cykge1xuICAgICAgY29uc3QgcHJvZHVjdCA9IGF3YWl0IFByb2R1Y3QuZmluZEJ5SWQoaXRlbS5wcm9kdWN0SWQpO1xuICAgICAgaWYgKHByb2R1Y3QpIHtcbiAgICAgICAgLy8gVMSDbmcgaG/hurdjIGdp4bqjbSBz4buRIGzGsOG7o25nIHThu5NuIGtobyBk4buxYSB2w6BvIHRoYW0gc+G7kSBpbmNyZWFzZVxuICAgICAgICBjb25zdCBuZXdTdG9jayA9IGluY3JlYXNlIFxuICAgICAgICAgID8gcHJvZHVjdC5wcm9kdWN0U3RvY2sgKyBpdGVtLnF1YW50aXR5IFxuICAgICAgICAgIDogcHJvZHVjdC5wcm9kdWN0U3RvY2sgLSBpdGVtLnF1YW50aXR5O1xuICAgICAgICBcbiAgICAgICAgLy8gQ+G6rXAgbmjhuq10IHPhu5EgbMaw4bujbmcgdOG7k24ga2hvIHbDoCB0cuG6oW5nIHRow6FpIHPhuqNuIHBo4bqpbVxuICAgICAgICBwcm9kdWN0LnByb2R1Y3RTdG9jayA9IE1hdGgubWF4KDAsIG5ld1N0b2NrKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEPhuq1wIG5o4bqtdCB0cuG6oW5nIHRow6FpIG7hur91IGjhur90IGjDoG5nXG4gICAgICAgIGlmIChwcm9kdWN0LnByb2R1Y3RTdG9jayA9PT0gMCkge1xuICAgICAgICAgIHByb2R1Y3QucHJvZHVjdFN0YXR1cyA9IFwiSOG6v3QgaMOgbmdcIjtcbiAgICAgICAgfSBlbHNlIGlmIChwcm9kdWN0LnByb2R1Y3RTdGF0dXMgPT09IFwiSOG6v3QgaMOgbmdcIikge1xuICAgICAgICAgIHByb2R1Y3QucHJvZHVjdFN0YXR1cyA9IFwiQ8OybiBow6BuZ1wiO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ+G6rXAgbmjhuq10IHPhu5EgbMaw4bujbmcgYsOhbiByYSBu4bq/dSBj4bqnblxuICAgICAgICBpZiAodXBkYXRlU29sZENvdW50ICYmICFpbmNyZWFzZSkge1xuICAgICAgICAgIHByb2R1Y3Quc29sZENvdW50ID0gKHByb2R1Y3Quc29sZENvdW50IHx8IDApICsgaXRlbS5xdWFudGl0eTtcbiAgICAgICAgfSBlbHNlIGlmICh1cGRhdGVTb2xkQ291bnQgJiYgaW5jcmVhc2UpIHtcbiAgICAgICAgICAvLyBUcuG7qyBzb2xkQ291bnQga2hpIGjhu6d5IMSRxqFuIGjDoG5nIMSRw6MgdGhhbmggdG/DoW5cbiAgICAgICAgICBwcm9kdWN0LnNvbGRDb3VudCA9IE1hdGgubWF4KDAsIChwcm9kdWN0LnNvbGRDb3VudCB8fCAwKSAtIGl0ZW0ucXVhbnRpdHkpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBhd2FpdCBwcm9kdWN0LnNhdmUoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSBj4bqtcCBuaOG6rXQgdGjDtG5nIHRpbiBz4bqjbiBwaOG6qW06XCIsIGVycm9yKTtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufVxuXG5leHBvcnQgY29uc3Qgb3JkZXJDcmVhdGUgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICAvLyBWYWxpZGF0ZSByZXF1aXJlZCBmaWVsZHNcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICBjb25zdCB7IHVzZXJJZCwgcHJvZHVjdHMsIHRvdGFsQW1vdW50LCBwYXltZW50TWV0aG9kLCBjb3Vwb24gfSA9IHJlcS5ib2R5O1xuICAgIGlmICghdXNlcklkIHx8ICFwcm9kdWN0cyB8fCAhQXJyYXkuaXNBcnJheShwcm9kdWN0cykgfHwgcHJvZHVjdHMubGVuZ3RoID09PSAwIHx8ICF0b3RhbEFtb3VudCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogXCJNaXNzaW5nIHJlcXVpcmVkIGZpZWxkczogdXNlcklkLCBwcm9kdWN0cyAobm9uLWVtcHR5IGFycmF5KSwgdG90YWxBbW91bnRcIiBcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyBLaeG7g20gdHJhIHPhu5EgbMaw4bujbmcgdOG7k24ga2hvIHRyxrDhu5tjIGtoaSB04bqhbyDEkcahbiBow6BuZ1xuICAgIGZvciAoY29uc3QgaXRlbSBvZiBwcm9kdWN0cykge1xuICAgICAgY29uc3QgcHJvZHVjdCA9IGF3YWl0IFByb2R1Y3QuZmluZEJ5SWQoaXRlbS5wcm9kdWN0SWQpO1xuICAgICAgaWYgKCFwcm9kdWN0KSB7XG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IGBT4bqjbiBwaOG6qW0gduG7m2kgSUQgJHtpdGVtLnByb2R1Y3RJZH0ga2jDtG5nIHThu5NuIHThuqFpYFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgaWYgKHByb2R1Y3QucHJvZHVjdFN0b2NrIDwgaXRlbS5xdWFudGl0eSkge1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBgU+G6o24gcGjhuqltIFwiJHtwcm9kdWN0LnByb2R1Y3ROYW1lfVwiIGNo4buJIGPDsm4gJHtwcm9kdWN0LnByb2R1Y3RTdG9ja30gc+G6o24gcGjhuqltIHRyb25nIGtob2BcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIENyZWF0ZSB0aGUgb3JkZXIgd2l0aCBhbGwgZmllbGRzIGZyb20gcmVxdWVzdCBib2R5XG4gICAgY29uc3Qgb3JkZXIgPSBuZXcgT3JkZXIocmVxLmJvZHkpO1xuICAgIFxuICAgIC8vIFNldCBkZWZhdWx0IHZhbHVlcyBpZiBub3QgcHJvdmlkZWRcbiAgICBpZiAoIW9yZGVyLnN0YXR1cykge1xuICAgICAgb3JkZXIuc3RhdHVzID0gcGF5bWVudE1ldGhvZCA9PT0gXCJjb2RcIiA/IFwicGVuZGluZ1wiIDogXCJhd2FpdGluZ19wYXltZW50XCI7XG4gICAgfVxuICAgIGlmICghb3JkZXIuY3JlYXRlZEF0KSB7XG4gICAgICBvcmRlci5jcmVhdGVkQXQgPSBuZXcgRGF0ZSgpO1xuICAgIH1cbiAgICBcbiAgICAvLyBU4bqhbyBtw6MgduG6rW4gxJHGoW4gbmfhuqt1IG5oacOqblxuICAgIGlmICghb3JkZXIub3JkZXJDb2RlKSB7XG4gICAgICBvcmRlci5vcmRlckNvZGUgPSBnZW5lcmF0ZU9yZGVyQ29kZSgpO1xuICAgIH1cbiAgICBcbiAgICAvLyBTYXZlIHRoZSBvcmRlclxuICAgIGF3YWl0IG9yZGVyLnNhdmUoKTtcbiAgICBcbiAgICAvLyDEkOG7kWkgduG7m2kgY8OhYyBwaMawxqFuZyB0aOG7qWMgdGhhbmggdG/DoW4gdHLhu7FjIHR1eeG6v24gKGtow7RuZyBwaOG6o2kgQ09EKSwgZ2nhuqNtIHPhu5EgbMaw4bujbmcgc+G6o24gcGjhuqltIG5nYXlcbiAgICBpZiAocGF5bWVudE1ldGhvZCAhPT0gXCJjb2RcIikge1xuICAgICAgLy8gR2nhuqNtIHPhu5EgbMaw4bujbmcgdOG7k24ga2hvLCBuaMawbmcgY2jGsGEgY+G6rXAgbmjhuq10IHNvbGRDb3VudFxuICAgICAgYXdhaXQgdXBkYXRlUHJvZHVjdFN0b2NrKHByb2R1Y3RzLCBmYWxzZSwgZmFsc2UpO1xuICAgIH1cbiAgICBcbiAgICAvLyBM4bqleSDEkcahbiBow6BuZyB24bubaSB0aMO0bmcgdGluIMSR4bqneSDEkeG7pyBiYW8gZ+G7k20gdGjDtG5nIHRpbiBz4bqjbiBwaOG6qW0gxJHhu4MgZ+G7rWkgZW1haWxcbiAgICBjb25zdCBwb3B1bGF0ZWRPcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRCeUlkKG9yZGVyLl9pZClcbiAgICAgIC5wb3B1bGF0ZSgndXNlcklkJylcbiAgICAgIC5wb3B1bGF0ZSgncHJvZHVjdHMucHJvZHVjdElkJyk7XG4gICAgICBcbiAgICAvLyBH4butaSBlbWFpbCB4w6FjIG5o4bqtbiBu4bq/dSDEkcahbiBow6BuZyDEkcOjIMSRxrDhu6NjIHThuqFvIHRow6BuaCBjw7RuZ1xuICAgIGlmIChwb3B1bGF0ZWRPcmRlciAmJiBwb3B1bGF0ZWRPcmRlci51c2VySWQgJiYgcG9wdWxhdGVkT3JkZXIudXNlcklkLmVtYWlsKSB7XG4gICAgICB0cnkge1xuICAgICAgICAvLyBDaHXhuqluIGLhu4sgdGjDtG5nIHRpbiBnaWFvIGjDoG5nIGNobyBlbWFpbFxuICAgICAgICBjb25zdCBzaGlwcGluZ0luZm8gPSB7XG4gICAgICAgICAgZnVsbE5hbWU6IGAke3BvcHVsYXRlZE9yZGVyLnVzZXJJZC5maXJzdE5hbWUgfHwgJyd9ICR7cG9wdWxhdGVkT3JkZXIudXNlcklkLmxhc3ROYW1lIHx8ICcnfWAudHJpbSgpLFxuICAgICAgICAgIGFkZHJlc3M6IHBvcHVsYXRlZE9yZGVyLmFkZHJlc3MgfHwgcG9wdWxhdGVkT3JkZXIudXNlcklkLmFkZHJlc3MgfHwgJycsXG4gICAgICAgICAgcGhvbmU6IHBvcHVsYXRlZE9yZGVyLnVzZXJJZC5waG9uZSB8fCAnJyxcbiAgICAgICAgICBlbWFpbDogcG9wdWxhdGVkT3JkZXIudXNlcklkLmVtYWlsIHx8ICcnXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvLyBUaMOqbSB0aMO0bmcgdGluIGdpYW8gaMOgbmcgdsOgbyDEkcahbiBow6BuZyDEkeG7gyBn4butaSBlbWFpbFxuICAgICAgICBwb3B1bGF0ZWRPcmRlci5zaGlwcGluZ0luZm8gPSBzaGlwcGluZ0luZm87XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIlNlbmRpbmcgY29uZmlybWF0aW9uIGVtYWlsIHRvOlwiLCBwb3B1bGF0ZWRPcmRlci51c2VySWQuZW1haWwpO1xuICAgICAgICBjb25zdCBlbWFpbFNlbnQgPSBhd2FpdCBzZW5kT3JkZXJDb25maXJtYXRpb25FbWFpbChwb3B1bGF0ZWRPcmRlcik7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRW1haWwgc2VudCBzdGF0dXM6XCIsIGVtYWlsU2VudCA/IFwiU3VjY2Vzc1wiIDogXCJGYWlsZWRcIik7XG4gICAgICB9IGNhdGNoIChlbWFpbEVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBzZW5kaW5nIGNvbmZpcm1hdGlvbiBlbWFpbDpcIiwgZW1haWxFcnJvcik7XG4gICAgICAgIC8vIEtow7RuZyB0aHJvdyBlcnJvciBu4bq/dSBn4butaSBlbWFpbCB0aOG6pXQgYuG6oWkgxJHhu4Mga2jDtG5nIOG6o25oIGjGsOG7n25nIMSR4bq/biBsdeG7k25nIMSR4bq3dCBow6BuZ1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZyhcIk1pc3NpbmcgZW1haWwgaW5mb3JtYXRpb24gZm9yIG9yZGVyIGNvbmZpcm1hdGlvbjpcIiwge1xuICAgICAgICBoYXNPcmRlcjogISFwb3B1bGF0ZWRPcmRlcixcbiAgICAgICAgaGFzVXNlcklkOiAhIShwb3B1bGF0ZWRPcmRlciAmJiBwb3B1bGF0ZWRPcmRlci51c2VySWQpLFxuICAgICAgICBoYXNFbWFpbDogISEocG9wdWxhdGVkT3JkZXIgJiYgcG9wdWxhdGVkT3JkZXIudXNlcklkICYmIHBvcHVsYXRlZE9yZGVyLnVzZXJJZC5lbWFpbCksXG4gICAgICAgIGVtYWlsOiBwb3B1bGF0ZWRPcmRlciAmJiBwb3B1bGF0ZWRPcmRlci51c2VySWQgJiYgcG9wdWxhdGVkT3JkZXIudXNlcklkLmVtYWlsID8gcG9wdWxhdGVkT3JkZXIudXNlcklkLmVtYWlsIDogdW5kZWZpbmVkXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAxKS5qc29uKG9yZGVyKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNyZWF0aW5nIG9yZGVyOlwiLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IFxuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBlcnJvcjogZXJyLm1lc3NhZ2UgfHwgXCJM4buXaSBraGkgdOG6oW8gxJHGoW4gaMOgbmdcIlxuICAgIH0pO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3Qgb3JkZXJHZXQgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB1c2VySWQgPSByZXEucXVlcnkudXNlcklkIHx8IChyZXEudXNlciAmJiByZXEudXNlci5faWQgPyByZXEudXNlci5faWQgOiB1bmRlZmluZWQpO1xuICAgIFxuICAgIC8vIFPhu60gZOG7pW5nIHVzZXJJZCBu4bq/dSBjw7MsIG7hur91IGtow7RuZyB0cuG6oyB24buBIHThuqV0IGPhuqMgxJHGoW4gaMOgbmdcbiAgICBjb25zdCBxdWVyeSA9IHVzZXJJZCA/IHsgdXNlcklkIH0gOiB7fTtcbiAgICBcbiAgICBjb25zdCBvcmRlcnMgPSBhd2FpdCBPcmRlci5maW5kKHF1ZXJ5KVxuICAgICAgLnBvcHVsYXRlKCd1c2VySWQnKVxuICAgICAgLnBvcHVsYXRlKCdwcm9kdWN0cy5wcm9kdWN0SWQnKVxuICAgICAgLnNvcnQoeyBjcmVhdGVkQXQ6IC0xIH0pO1xuICAgIFxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKG9yZGVycyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiBlcnIubWVzc2FnZSBcbiAgICB9KTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IG9yZGVyR2V0QWxsID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3Qgb3JkZXJzID0gYXdhaXQgT3JkZXIuZmluZCgpXG4gICAgICAucG9wdWxhdGUoXCJ1c2VySWRcIilcbiAgICAgIC5wb3B1bGF0ZSgncHJvZHVjdHMucHJvZHVjdElkJylcbiAgICAgIC5zb3J0KHsgY3JlYXRlZEF0OiAtMSB9KTtcbiAgICBcbiAgICByZXMuanNvbihvcmRlcnMpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IG9yZGVyR2V0QnlJZCA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgT3JkZXIuZmluZEJ5SWQocmVxLnBhcmFtcy5pZClcbiAgICAgIC5wb3B1bGF0ZShcInVzZXJJZFwiKVxuICAgICAgLnBvcHVsYXRlKCdwcm9kdWN0cy5wcm9kdWN0SWQnKTtcbiAgICBcbiAgICBpZiAoIW9yZGVyKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSDEkcahbiBow6BuZ1wiIH0pO1xuICAgIH1cbiAgICBcbiAgICByZXMuanNvbihvcmRlcik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICB9XG59O1xuXG4vLyBIw6BtIGPhuq1wIG5o4bqtdCB0aMO0bmcgdGluIMSRxqFuIGjDoG5nXG5leHBvcnQgY29uc3QgdXBkYXRlT3JkZXIgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBvcmRlcklkID0gcmVxLnBhcmFtcy5pZDtcbiAgICBjb25zdCB1cGRhdGVEYXRhID0gcmVxLmJvZHk7XG4gICAgXG4gICAgY29uc29sZS5sb2coXCJ1cGRhdGVPcmRlciDEkcaw4bujYyBn4buNaSB24bubaSBk4buvIGxp4buHdTpcIiwgSlNPTi5zdHJpbmdpZnkodXBkYXRlRGF0YSkpO1xuICAgIFxuICAgIC8vIFTDrG0gdsOgIGPhuq1wIG5o4bqtdCDEkcahbiBow6BuZ1xuICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgT3JkZXIuZmluZEJ5SWQob3JkZXJJZClcbiAgICAgIC5wb3B1bGF0ZShcInVzZXJJZFwiLCBcImZpcnN0TmFtZSBsYXN0TmFtZSB1c2VyTmFtZSBlbWFpbCBwaG9uZSBhZGRyZXNzXCIpXG4gICAgICAucG9wdWxhdGUoXCJwcm9kdWN0cy5wcm9kdWN0SWRcIik7XG4gICAgXG4gICAgaWYgKCFvcmRlcikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgxJHGoW4gaMOgbmdcIiBcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyBMxrB1IHRy4bqhbmcgdGjDoWkgY8WpIHRyxrDhu5tjIGtoaSBj4bqtcCBuaOG6rXRcbiAgICBjb25zdCBwcmV2aW91c1N0YXR1cyA9IG9yZGVyLnN0YXR1cztcbiAgICBjb25zdCBuZXdTdGF0dXMgPSB1cGRhdGVEYXRhLnN0YXR1cztcblxuICAgIC8vIEzhu41jIGPDoWMgdHLGsOG7nW5nIMSRxrDhu6NjIHBow6lwIGPhuq1wIG5o4bqtdFxuICAgIGNvbnN0IGFsbG93ZWRGaWVsZHMgPSBbJ3N0YXR1cycsICdvcmRlckNvZGUnLCAnc2hpcHBpbmdJbmZvJywgJ25vdGVzJ107XG4gICAgY29uc3QgZmlsdGVyZWREYXRhID0ge307XG4gICAgXG4gICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXModXBkYXRlRGF0YSkpIHtcbiAgICAgIGlmIChhbGxvd2VkRmllbGRzLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgICAgZmlsdGVyZWREYXRhW2tleV0gPSB1cGRhdGVEYXRhW2tleV07XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIE7hur91IGtow7RuZyBjw7Mgb3JkZXJDb2RlIG5oxrBuZyBj4bqnbiB0aMOqbSwgdOG6oW8gbeG7mXQgbcOjIHbhuq1uIMSRxqFuIG3hu5tpXG4gICAgaWYgKCFvcmRlci5vcmRlckNvZGUgJiYgIWZpbHRlcmVkRGF0YS5vcmRlckNvZGUpIHtcbiAgICAgIGZpbHRlcmVkRGF0YS5vcmRlckNvZGUgPSBnZW5lcmF0ZU9yZGVyQ29kZSgpO1xuICAgIH1cbiAgICBcbiAgICAvLyBUSMOKTSBN4buaSTogWOG7rSBsw70gY+G6rXAgbmjhuq10IHRyYWNraW5nX2xvZ3Mga2hpIGPDsyB0aGF5IMSR4buVaSB0cuG6oW5nIHRow6FpXG4gICAgaWYgKG5ld1N0YXR1cyAmJiBuZXdTdGF0dXMgIT09IHByZXZpb3VzU3RhdHVzKSB7XG4gICAgICAvLyBLaOG7n2kgdOG6oW8gdHJhY2tpbmcgb2JqZWN0IG7hur91IGNoxrBhIGPDs1xuICAgICAgaWYgKCFvcmRlci50cmFja2luZykge1xuICAgICAgICBvcmRlci50cmFja2luZyA9IHsgc3RhdHVzX25hbWU6IFwiXCIsIHRyYWNraW5nX2xvZ3M6IFtdIH07XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIEzhuqV5IHTDqm4gaGnhu4NuIHRo4buLIGNobyB0cuG6oW5nIHRow6FpXG4gICAgICBsZXQgc3RhdHVzTmFtZSA9IFwiXCI7XG4gICAgICBzd2l0Y2ggKG5ld1N0YXR1cykge1xuICAgICAgICBjYXNlICdwZW5kaW5nJzogc3RhdHVzTmFtZSA9IFwiQ2jhu50geOG7rSBsw71cIjsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2NvbmZpcm1lZCc6IHN0YXR1c05hbWUgPSBcIsSQw6MgeMOhYyBuaOG6rW5cIjsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3Byb2Nlc3NpbmcnOiBzdGF0dXNOYW1lID0gXCLEkGFuZyB44butIGzDvVwiOyBicmVhaztcbiAgICAgICAgY2FzZSAncHJlcGFyaW5nJzogc3RhdHVzTmFtZSA9IFwixJBhbmcgY2h14bqpbiBi4buLIGjDoG5nXCI7IGJyZWFrO1xuICAgICAgICBjYXNlICdwYWNrYWdpbmcnOiBzdGF0dXNOYW1lID0gXCJIb8OgbiB04bqldCDEkcOzbmcgZ8OzaVwiOyBicmVhaztcbiAgICAgICAgY2FzZSAnc2hpcHBpbmcnOiBzdGF0dXNOYW1lID0gXCLEkGFuZyB24bqtbiBjaHV54buDblwiOyBicmVhaztcbiAgICAgICAgY2FzZSAnc2hpcHBlZCc6IHN0YXR1c05hbWUgPSBcIsSQw6MgZ2lhbyBjaG8gduG6rW4gY2h1eeG7g25cIjsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2RlbGl2ZXJpbmcnOiBzdGF0dXNOYW1lID0gXCLEkGFuZyBnaWFvIGjDoG5nXCI7IGJyZWFrO1xuICAgICAgICBjYXNlICdkZWxpdmVyZWQnOiBzdGF0dXNOYW1lID0gXCLEkMOjIGdpYW8gaMOgbmdcIjsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2NvbXBsZXRlZCc6IHN0YXR1c05hbWUgPSBcIkhvw6BuIHRow6BuaFwiOyBicmVhaztcbiAgICAgICAgY2FzZSAnY2FuY2VsbGVkJzogc3RhdHVzTmFtZSA9IFwixJDDoyBo4buneVwiOyBicmVhaztcbiAgICAgICAgY2FzZSAnYXdhaXRpbmdfcGF5bWVudCc6IHN0YXR1c05hbWUgPSBcIkNo4budIHRoYW5oIHRvw6FuXCI7IGJyZWFrO1xuICAgICAgICBjYXNlICdyZWZ1bmRlZCc6IHN0YXR1c05hbWUgPSBcIsSQw6MgaG/DoG4gdGnhu4FuXCI7IGJyZWFrO1xuICAgICAgICBjYXNlICdmYWlsZWQnOiBzdGF0dXNOYW1lID0gXCJUaOG6pXQgYuG6oWlcIjsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2RlbGl2ZXJ5X2ZhaWxlZCc6IHN0YXR1c05hbWUgPSBcIkdpYW8gaMOgbmcgdGjhuqV0IGLhuqFpXCI7IGJyZWFrO1xuICAgICAgICBkZWZhdWx0OiBzdGF0dXNOYW1lID0gbmV3U3RhdHVzO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBUaMOqbSBi4bqjbiBnaGkgbeG7m2kgdsOgbyDEkeG6p3UgbeG6o25nIHRyYWNraW5nX2xvZ3NcbiAgICAgIGNvbnN0IG5ld1RyYWNraW5nTG9nID0ge1xuICAgICAgICBzdGF0dXM6IG5ld1N0YXR1cyxcbiAgICAgICAgc3RhdHVzX25hbWU6IHN0YXR1c05hbWUsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICBsb2NhdGlvbjogXCJD4butYSBow6BuZyBETkMgRk9PRFwiLFxuICAgICAgfTtcbiAgICAgIFxuICAgICAgLy8gS2jhu59pIHThuqFvIG3huqNuZyB0cmFja2luZ19sb2dzIG7hur91IGNoxrBhIGPDs1xuICAgICAgaWYgKCFvcmRlci50cmFja2luZy50cmFja2luZ19sb2dzKSB7XG4gICAgICAgIG9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3MgPSBbXTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gVGjDqm0gbG9nIG3hu5tpIHbDoG8gxJHhuqd1IG3huqNuZyAoxJHhu4MgbG9nIG3hu5tpIG5o4bqldCBu4bqxbSDEkeG6p3UgdGnDqm4pXG4gICAgICBvcmRlci50cmFja2luZy50cmFja2luZ19sb2dzLnVuc2hpZnQobmV3VHJhY2tpbmdMb2cpO1xuICAgICAgXG4gICAgICAvLyBD4bqtcCBuaOG6rXQgc3RhdHVzX25hbWUgY2jDrW5oXG4gICAgICBvcmRlci50cmFja2luZy5zdGF0dXNfbmFtZSA9IHN0YXR1c05hbWU7XG4gICAgICBcbiAgICAgIC8vIEzGsHUgdHJhY2tpbmcgdsOgbyBmaWx0ZXJlZERhdGEgxJHhu4MgY+G6rXAgbmjhuq10XG4gICAgICBmaWx0ZXJlZERhdGEudHJhY2tpbmcgPSBvcmRlci50cmFja2luZztcbiAgICB9XG4gICAgXG4gICAgLy8gTuG6v3UgxJFhbmcgY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgdGjDoG5oICdjb21wbGV0ZWQnLCB04buxIMSR4buZbmcgxJHDoW5oIGThuqV1IMSRw6MgdGhhbmggdG/DoW5cbiAgICBpZiAobmV3U3RhdHVzID09PSAnY29tcGxldGVkJykge1xuICAgICAgZmlsdGVyZWREYXRhLmlzUGFpZCA9IHRydWU7XG4gICAgICBmaWx0ZXJlZERhdGEuY29tcGxldGVkQXQgPSBuZXcgRGF0ZSgpO1xuICAgICAgXG4gICAgICAvLyBO4bq/dSDEkcahbiBow6BuZyBsw6AgQ09EIHbDoCBjaMawYSBj4bqtcCBuaOG6rXQga2hvIHRow6wgZ2nhuqNtIHPhu5EgbMaw4bujbmcgdsOgIHTEg25nIHNvbGRDb3VudFxuICAgICAgaWYgKG9yZGVyLnBheW1lbnRNZXRob2QgPT09IFwiY29kXCIgJiYgIW9yZGVyLmlzUGFpZCkge1xuICAgICAgICBhd2FpdCB1cGRhdGVQcm9kdWN0U3RvY2sob3JkZXIucHJvZHVjdHMsIGZhbHNlLCB0cnVlKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEPhuq1wIG5o4bqtdCB0aMO0bmcgdGluIHPhuqNuIHBo4bqpbSBiw6FuIGNo4bqheVxuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIFThuqNpIHRow7RuZyB0aW4gY2hpIHRp4bq/dCBz4bqjbiBwaOG6qW1cbiAgICAgICAgICBjb25zdCBwb3B1bGF0ZWRPcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRCeUlkKG9yZGVySWQpLnBvcHVsYXRlKFwicHJvZHVjdHMucHJvZHVjdElkXCIpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIEPhuq1wIG5o4bqtdCB04burbmcgc+G6o24gcGjhuqltIHRyb25nIMSRxqFuIGjDoG5nXG4gICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHBvcHVsYXRlZE9yZGVyLnByb2R1Y3RzKSB7XG4gICAgICAgICAgICBpZiAoaXRlbS5wcm9kdWN0SWQpIHtcbiAgICAgICAgICAgICAgYXdhaXQgQmVzdFNlbGxpbmdQcm9kdWN0LnVwZGF0ZVNhbGVzRGF0YShcbiAgICAgICAgICAgICAgICBpdGVtLnByb2R1Y3RJZC5faWQsXG4gICAgICAgICAgICAgICAgaXRlbS5wcm9kdWN0SWQsXG4gICAgICAgICAgICAgICAgaXRlbS5xdWFudGl0eSxcbiAgICAgICAgICAgICAgICBvcmRlcklkXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChiZXN0U2VsbGVyRXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIGPhuq1wIG5o4bqtdCBz4bqjbiBwaOG6qW0gYsOhbiBjaOG6oXk6XCIsIGJlc3RTZWxsZXJFcnJvcik7XG4gICAgICAgICAgLy8gS2jDtG5nIHRy4bqjIHbhu4EgbOG7l2ksIHbhuqtuIHRp4bq/cCB04bulYyB44butIGzDvVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBO4bq/dSB0aGFuaCB0b8OhbiBvbmxpbmUgdsOgIHN0YXR1cyBraMOhYyBhd2FpdGluZ19wYXltZW50IHRow6wgY+G6rXAgbmjhuq10IHNvbGRDb3VudFxuICAgICAgZWxzZSBpZiAob3JkZXIucGF5bWVudE1ldGhvZCAhPT0gXCJjb2RcIiAmJiBvcmRlci5zdGF0dXMgIT09IFwiYXdhaXRpbmdfcGF5bWVudFwiKSB7XG4gICAgICAgIC8vIENo4buJIGPhuq1wIG5o4bqtdCBzb2xkQ291bnQgbcOgIGtow7RuZyB0cuG7qyBraG8gKMSRw6MgdHLhu6sgbMO6YyB04bqhbyDEkcahbilcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIG9yZGVyLnByb2R1Y3RzKSB7XG4gICAgICAgICAgY29uc3QgcHJvZHVjdCA9IGF3YWl0IFByb2R1Y3QuZmluZEJ5SWQoaXRlbS5wcm9kdWN0SWQpO1xuICAgICAgICAgIGlmIChwcm9kdWN0KSB7XG4gICAgICAgICAgICBwcm9kdWN0LnNvbGRDb3VudCA9IChwcm9kdWN0LnNvbGRDb3VudCB8fCAwKSArIGl0ZW0ucXVhbnRpdHk7XG4gICAgICAgICAgICBhd2FpdCBwcm9kdWN0LnNhdmUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEPhuq1wIG5o4bqtdCB0aMO0bmcgdGluIHPhuqNuIHBo4bqpbSBiw6FuIGNo4bqheVxuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIFThuqNpIHRow7RuZyB0aW4gY2hpIHRp4bq/dCBz4bqjbiBwaOG6qW1cbiAgICAgICAgICBjb25zdCBwb3B1bGF0ZWRPcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRCeUlkKG9yZGVySWQpLnBvcHVsYXRlKFwicHJvZHVjdHMucHJvZHVjdElkXCIpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIEPhuq1wIG5o4bqtdCB04burbmcgc+G6o24gcGjhuqltIHRyb25nIMSRxqFuIGjDoG5nXG4gICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHBvcHVsYXRlZE9yZGVyLnByb2R1Y3RzKSB7XG4gICAgICAgICAgICBpZiAoaXRlbS5wcm9kdWN0SWQpIHtcbiAgICAgICAgICAgICAgYXdhaXQgQmVzdFNlbGxpbmdQcm9kdWN0LnVwZGF0ZVNhbGVzRGF0YShcbiAgICAgICAgICAgICAgICBpdGVtLnByb2R1Y3RJZC5faWQsXG4gICAgICAgICAgICAgICAgaXRlbS5wcm9kdWN0SWQsXG4gICAgICAgICAgICAgICAgaXRlbS5xdWFudGl0eSxcbiAgICAgICAgICAgICAgICBvcmRlcklkXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChiZXN0U2VsbGVyRXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIGPhuq1wIG5o4bqtdCBz4bqjbiBwaOG6qW0gYsOhbiBjaOG6oXk6XCIsIGJlc3RTZWxsZXJFcnJvcik7XG4gICAgICAgICAgLy8gS2jDtG5nIHRy4bqjIHbhu4EgbOG7l2ksIHbhuqtuIHRp4bq/cCB04bulYyB44butIGzDvVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIE7hur91IMSRYW5nIGPhuq1wIG5o4bqtdCB0cuG6oW5nIHRow6FpIHRow6BuaCAnY2FuY2VsbGVkJywga2nhu4NtIHRyYSB4ZW0gY8OzIHRo4buDIGjhu6d5IGtow7RuZ1xuICAgIGlmIChuZXdTdGF0dXMgPT09ICdjYW5jZWxsZWQnKSB7XG4gICAgICAvLyBOZ8SDbiBjaOG6t24gdmnhu4djIGjhu6d5IMSRxqFuIGjDoG5nIMSRw6MgZ2lhbyBob+G6t2MgxJFhbmcgZ2lhb1xuICAgICAgaWYgKHByZXZpb3VzU3RhdHVzID09PSAnY29tcGxldGVkJyB8fCBwcmV2aW91c1N0YXR1cyA9PT0gJ2RlbGl2ZXJpbmcnKSB7XG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgbWVzc2FnZTogcHJldmlvdXNTdGF0dXMgPT09IFwiZGVsaXZlcmluZ1wiIFxuICAgICAgICAgICAgPyBcIktow7RuZyB0aOG7gyBo4buneSDEkcahbiBow6BuZyDEkWFuZyBnaWFvXCIgXG4gICAgICAgICAgICA6IFwiS2jDtG5nIHRo4buDIGjhu6d5IMSRxqFuIGjDoG5nIMSRw6MgZ2lhb1wiXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBLaGkgaOG7p3kgxJHGoW4gaMOgbmcgdGhhbmggdG/DoW4gb25saW5lLCBj4bqnbiB0cuG6oyBs4bqhaSBz4buRIGzGsOG7o25nIHThu5NuIGtob1xuICAgICAgaWYgKG9yZGVyLnBheW1lbnRNZXRob2QgIT09IFwiY29kXCIpIHtcbiAgICAgICAgYXdhaXQgdXBkYXRlUHJvZHVjdFN0b2NrKG9yZGVyLnByb2R1Y3RzLCB0cnVlLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIEPhuq1wIG5o4bqtdCDEkcahbiBow6BuZ1xuICAgIGNvbnN0IHVwZGF0ZWRPcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRCeUlkQW5kVXBkYXRlKFxuICAgICAgb3JkZXJJZCxcbiAgICAgIHsgJHNldDogZmlsdGVyZWREYXRhIH0sXG4gICAgICB7IG5ldzogdHJ1ZSB9XG4gICAgKS5wb3B1bGF0ZShcInVzZXJJZFwiKS5wb3B1bGF0ZShcInByb2R1Y3RzLnByb2R1Y3RJZFwiKTtcbiAgICBcbiAgICAvLyBH4busSSBFTUFJTCBUSMOUTkcgQsOBTyBLSEkgQ0hVWeG7gk4gVFLhuqBORyBUSMOBSSBTQU5HIFwiREVMSVZFUklOR1wiXG4gICAgaWYgKG5ld1N0YXR1cyA9PT0gJ2RlbGl2ZXJpbmcnICYmIHByZXZpb3VzU3RhdHVzICE9PSAnZGVsaXZlcmluZycpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwixJBhbmcgY2h14bqpbiBi4buLIGfhu61pIGVtYWlsIHRow7RuZyBiw6FvIGdpYW8gaMOgbmcuLi5cIik7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiVGjDtG5nIHRpbiDEkcahbiBow6BuZyDEkeG7gyBn4butaSBlbWFpbDpcIiwge1xuICAgICAgICAgIG9yZGVyQ29kZTogb3JkZXIub3JkZXJDb2RlLFxuICAgICAgICAgIGVtYWlsOiBvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLmVtYWlsID8gb3JkZXIudXNlcklkLmVtYWlsIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGFkZHJlc3M6IG9yZGVyLnVzZXJJZCAmJiBvcmRlci51c2VySWQuYWRkcmVzcyA/IG9yZGVyLnVzZXJJZC5hZGRyZXNzIDogdW5kZWZpbmVkLFxuICAgICAgICAgIHBob25lOiBvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLnBob25lID8gb3JkZXIudXNlcklkLnBob25lIDogdW5kZWZpbmVkLFxuICAgICAgICAgIHVzZXJOYW1lOiBvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLnVzZXJOYW1lID8gb3JkZXIudXNlcklkLnVzZXJOYW1lIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGZpcnN0TmFtZTogb3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC5maXJzdE5hbWUgPyBvcmRlci51c2VySWQuZmlyc3ROYW1lIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGxhc3ROYW1lOiBvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLmxhc3ROYW1lID8gb3JkZXIudXNlcklkLmxhc3ROYW1lIDogdW5kZWZpbmVkLFxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIMSQ4bqjbSBi4bqjbyBvcmRlci51c2VySWQgxJHDoyDEkcaw4bujYyBwb3B1bGF0ZSDEkeG6p3kgxJHhu6dcbiAgICAgICAgaWYgKG9yZGVyLnVzZXJJZCAmJiB0eXBlb2Ygb3JkZXIudXNlcklkID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIC8vIEfhu61pIGVtYWlsIHRow7RuZyBiw6FvIMSRxqFuIGjDoG5nIMSRYW5nIMSRxrDhu6NjIGdpYW9cbiAgICAgICAgICBjb25zdCBlbWFpbFNlbnQgPSBhd2FpdCBzZW5kT3JkZXJTaGlwcGluZ0VtYWlsKG9yZGVyKTtcbiAgICAgICAgICBcbiAgICAgICAgICBpZiAoZW1haWxTZW50KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgxJDDoyBn4butaSBlbWFpbCB0aMO0bmcgYsOhbyBnaWFvIGjDoG5nIGNobyDEkcahbiBow6BuZyAjJHtvcmRlci5vcmRlckNvZGUgfHwgb3JkZXIuX2lkfWApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgS2jDtG5nIHRo4buDIGfhu61pIGVtYWlsIHRow7RuZyBiw6FvIGdpYW8gaMOgbmcgY2hvIMSRxqFuIGjDoG5nICMke29yZGVyLm9yZGVyQ29kZSB8fCBvcmRlci5faWR9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkNoaSB0aeG6v3QgxJHGoW4gaMOgbmc6XCIsIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgaWQ6IG9yZGVyLl9pZCxcbiAgICAgICAgICAgICAgb3JkZXJDb2RlOiBvcmRlci5vcmRlckNvZGUsXG4gICAgICAgICAgICAgIHVzZXJJZDoge1xuICAgICAgICAgICAgICAgIGVtYWlsOiBvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLmVtYWlsID8gb3JkZXIudXNlcklkLmVtYWlsIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIGZpcnN0TmFtZTogb3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC5maXJzdE5hbWUgPyBvcmRlci51c2VySWQuZmlyc3ROYW1lIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIGxhc3ROYW1lOiBvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLmxhc3ROYW1lID8gb3JkZXIudXNlcklkLmxhc3ROYW1lIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIGFkZHJlc3M6IG9yZGVyLnVzZXJJZCAmJiBvcmRlci51c2VySWQuYWRkcmVzcyA/IG9yZGVyLnVzZXJJZC5hZGRyZXNzIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIHBob25lOiBvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLnBob25lID8gb3JkZXIudXNlcklkLnBob25lIDogdW5kZWZpbmVkXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIG51bGwsIDIpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJLaMO0bmcgdGjhu4MgZ+G7rWkgZW1haWw6IG9yZGVyLnVzZXJJZCBraMO0bmcgxJHGsOG7o2MgcG9wdWxhdGUgxJHhuqd5IMSR4bunXCIpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlbWFpbEVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0zhu5dpIGtoaSBn4butaSBlbWFpbCB0aMO0bmcgYsOhbyBnaWFvIGjDoG5nOicsIGVtYWlsRXJyb3IpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCdTdGFjayB0cmFjZTonLCBlbWFpbEVycm9yLnN0YWNrKTtcbiAgICAgICAgLy8gS2jDtG5nIHRy4bqjIHbhu4EgbOG7l2kgY2hvIGNsaWVudCwgY2jhu4kgbG9nIGzhu5dpXG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIEfhu61pIGVtYWlsIHRow7RuZyBiw6FvIGtoaSB0cuG6oW5nIHRow6FpIMSRxqFuIGjDoG5nIHRoYXkgxJHhu5VpIChu4bq/dSBjw7MgZW1haWwpXG4gICAgZWxzZSBpZiAobmV3U3RhdHVzICYmIG5ld1N0YXR1cyAhPT0gcHJldmlvdXNTdGF0dXMgJiYgdXBkYXRlZE9yZGVyLnNoaXBwaW5nSW5mbyAmJiB1cGRhdGVkT3JkZXIuc2hpcHBpbmdJbmZvLmVtYWlsKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBzZW5kT3JkZXJDb25maXJtYXRpb25FbWFpbCh1cGRhdGVkT3JkZXIpO1xuICAgICAgICBjb25zb2xlLmxvZyhgxJDDoyBn4butaSBlbWFpbCBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZyAke3VwZGF0ZWRPcmRlci5vcmRlckNvZGV9IMSR4bq/biAke3VwZGF0ZWRPcmRlci5zaGlwcGluZ0luZm8uZW1haWx9YCk7XG4gICAgICB9IGNhdGNoIChlbWFpbEVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0zhu5dpIGtoaSBn4butaSBlbWFpbCBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZzonLCBlbWFpbEVycm9yKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gR+G7rWkgdGjDtG5nIGLDoW8ga2hpIGPhuq1wIG5o4bqtdCB0cuG6oW5nIHRow6FpIMSRxqFuIGjDoG5nXG4gICAgaWYgKG5ld1N0YXR1cyAmJiBuZXdTdGF0dXMgIT09IHByZXZpb3VzU3RhdHVzICYmIHVwZGF0ZWRPcmRlci51c2VySWQpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHNlbmRPcmRlclN0YXR1c05vdGlmaWNhdGlvbih1cGRhdGVkT3JkZXIudXNlcklkLCB1cGRhdGVkT3JkZXIsIGdldFN0YXR1c1RleHQodXBkYXRlZE9yZGVyLnN0YXR1cykpO1xuICAgICAgICBjb25zb2xlLmxvZyhgxJDDoyBn4butaSB0aMO0bmcgYsOhbyBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZyAke3VwZGF0ZWRPcmRlci5vcmRlckNvZGV9IMSR4bq/biB1c2VyICR7dXBkYXRlZE9yZGVyLnVzZXJJZH1gKTtcbiAgICAgIH0gY2F0Y2ggKG5vdGlmaWNhdGlvbkVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0zhu5dpIGtoaSBn4butaSB0aMO0bmcgYsOhbyBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZzonLCBub3RpZmljYXRpb25FcnJvcik7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogXCJD4bqtcCBuaOG6rXQgxJHGoW4gaMOgbmcgdGjDoG5oIGPDtG5nXCIsXG4gICAgICBkYXRhOiB1cGRhdGVkT3JkZXJcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgaW4gdXBkYXRlT3JkZXI6XCIsIGVycm9yKTtcbiAgICBjb25zb2xlLmVycm9yKGVycm9yLnN0YWNrKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBcIkzhu5dpIGtoaSBj4bqtcCBuaOG6rXQgxJHGoW4gaMOgbmdcIixcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlXG4gICAgfSk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBvcmRlclVwZGF0ZSA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHsgc3RhdHVzIH0gPSByZXEuYm9keTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhcIm9yZGVyVXBkYXRlIGNhbGxlZCB3aXRoIHN0YXR1czpcIiwgc3RhdHVzKTtcbiAgICBjb25zb2xlLmxvZyhcIlJlcXVlc3QgYm9keTpcIiwgSlNPTi5zdHJpbmdpZnkocmVxLmJvZHkpKTtcbiAgICBcbiAgICAvLyBUcsaw4bubYyB0acOqbiBs4bqleSB0aMO0bmcgdGluIMSRxqFuIGjDoG5nIGhp4buHbiB04bqhaSDEkeG7gyB0aGVvIGTDtWkgdGhheSDEkeG7lWkgdHLhuqFuZyB0aMOhaVxuICAgIC8vIMSQ4bqjbSBi4bqjbyBwb3B1bGF0ZSDEkeG6p3kgxJHhu6cgdGjDtG5nIHRpbiDEkeG7gyBn4butaSBlbWFpbFxuICAgIGNvbnN0IGN1cnJlbnRPcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRCeUlkKHJlcS5wYXJhbXMuaWQpXG4gICAgICAucG9wdWxhdGUoXCJ1c2VySWRcIiwgXCJmaXJzdE5hbWUgbGFzdE5hbWUgdXNlck5hbWUgZW1haWwgcGhvbmUgYWRkcmVzc1wiKVxuICAgICAgLnBvcHVsYXRlKFwicHJvZHVjdHMucHJvZHVjdElkXCIpO1xuICAgIFxuICAgIGlmICghY3VycmVudE9yZGVyKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIktow7RuZyB0w6xtIHRo4bqleSDEkcahbiBow6BuZyB24bubaSBJRDpcIiwgcmVxLnBhcmFtcy5pZCk7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBlcnJvcjogXCJLaMO0bmcgdMOsbSB0aOG6pXkgxJHGoW4gaMOgbmdcIiB9KTtcbiAgICB9XG4gICAgXG4gICAgY29uc29sZS5sb2coXCJUaMO0bmcgdGluIMSRxqFuIGjDoG5nIHRyxrDhu5tjIGtoaSBj4bqtcCBuaOG6rXQ6XCIsIHtcbiAgICAgIGlkOiBjdXJyZW50T3JkZXIuX2lkLFxuICAgICAgc3RhdHVzOiBjdXJyZW50T3JkZXIuc3RhdHVzLFxuICAgICAgZW1haWw6IGN1cnJlbnRPcmRlci51c2VySWQgJiYgY3VycmVudE9yZGVyLnVzZXJJZC5lbWFpbCA/IGN1cnJlbnRPcmRlci51c2VySWQuZW1haWwgOiB1bmRlZmluZWQsXG4gICAgICBvcmRlckNvZGU6IGN1cnJlbnRPcmRlci5vcmRlckNvZGVcbiAgICB9KTtcbiAgICBcbiAgICAvLyBMxrB1IHRy4bqhbmcgdGjDoWkgY8WpIHRyxrDhu5tjIGtoaSBj4bqtcCBuaOG6rXRcbiAgICBjb25zdCBwcmV2aW91c1N0YXR1cyA9IGN1cnJlbnRPcmRlci5zdGF0dXM7XG4gICAgXG4gICAgLy8gQ+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgxJHGoW4gaMOgbmdcbiAgICBjdXJyZW50T3JkZXIuc3RhdHVzID0gc3RhdHVzO1xuICAgIGF3YWl0IGN1cnJlbnRPcmRlci5zYXZlKCk7XG4gICAgXG4gICAgLy8gR+G7rWkgZW1haWwgdGjDtG5nIGLDoW8ga2hpIMSRxqFuIGjDoG5nIGNodXnhu4NuIHNhbmcgdHLhuqFuZyB0aMOhaSBcIsSRYW5nIGdpYW8gxJHhur9uIGtow6FjaFwiXG4gICAgaWYgKHN0YXR1cyA9PT0gJ2RlbGl2ZXJpbmcnICYmIHByZXZpb3VzU3RhdHVzICE9PSAnZGVsaXZlcmluZycpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwixJBhbmcgY2h14bqpbiBi4buLIGfhu61pIGVtYWlsIHRow7RuZyBiw6FvIGdpYW8gaMOgbmcuLi5cIik7XG4gICAgICAgIGNvbnNvbGUubG9nKFwixJDGoW4gaMOgbmcgY8OzIHVzZXJJZCB24bubaSBlbWFpbDpcIiwgY3VycmVudE9yZGVyLnVzZXJJZCAmJiBjdXJyZW50T3JkZXIudXNlcklkLmVtYWlsID8gY3VycmVudE9yZGVyLnVzZXJJZC5lbWFpbCA6IHVuZGVmaW5lZCk7XG4gICAgICAgIFxuICAgICAgICAvLyBH4butaSBlbWFpbCB0aMO0bmcgYsOhbyDEkcahbiBow6BuZyDEkWFuZyDEkcaw4bujYyBnaWFvXG4gICAgICAgIGNvbnN0IGVtYWlsU2VudCA9IGF3YWl0IHNlbmRPcmRlclNoaXBwaW5nRW1haWwoY3VycmVudE9yZGVyKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChlbWFpbFNlbnQpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgxJDDoyBn4butaSBlbWFpbCB0aMO0bmcgYsOhbyBnaWFvIGjDoG5nIGNobyDEkcahbiBow6BuZyAjJHtjdXJyZW50T3JkZXIub3JkZXJDb2RlIHx8IGN1cnJlbnRPcmRlci5faWR9YCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYEtow7RuZyB0aOG7gyBn4butaSBlbWFpbCB0aMO0bmcgYsOhbyBnaWFvIGjDoG5nIGNobyDEkcahbiBow6BuZyAjJHtjdXJyZW50T3JkZXIub3JkZXJDb2RlIHx8IGN1cnJlbnRPcmRlci5faWR9YCk7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDaGkgdGnhur90IMSRxqFuIGjDoG5nOlwiLCBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBpZDogY3VycmVudE9yZGVyLl9pZCxcbiAgICAgICAgICAgIG9yZGVyQ29kZTogY3VycmVudE9yZGVyLm9yZGVyQ29kZSxcbiAgICAgICAgICAgIHVzZXJJZDoge1xuICAgICAgICAgICAgICBlbWFpbDogY3VycmVudE9yZGVyLnVzZXJJZCAmJiBjdXJyZW50T3JkZXIudXNlcklkLmVtYWlsID8gY3VycmVudE9yZGVyLnVzZXJJZC5lbWFpbCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgZmlyc3ROYW1lOiBjdXJyZW50T3JkZXIudXNlcklkICYmIGN1cnJlbnRPcmRlci51c2VySWQuZmlyc3ROYW1lID8gY3VycmVudE9yZGVyLnVzZXJJZC5maXJzdE5hbWUgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgIGxhc3ROYW1lOiBjdXJyZW50T3JkZXIudXNlcklkICYmIGN1cnJlbnRPcmRlci51c2VySWQubGFzdE5hbWUgPyBjdXJyZW50T3JkZXIudXNlcklkLmxhc3ROYW1lIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIG51bGwsIDIpKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZW1haWxFcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdM4buXaSBraGkgZ+G7rWkgZW1haWwgdGjDtG5nIGLDoW8gZ2lhbyBow6BuZzonLCBlbWFpbEVycm9yKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignU3RhY2sgdHJhY2U6JywgZW1haWxFcnJvci5zdGFjayk7XG4gICAgICAgIC8vIEtow7RuZyB0cuG6oyB24buBIGzhu5dpIGNobyBjbGllbnQsIGNo4buJIGxvZyBs4buXaVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBUcuG6oyB24buBIMSRxqFuIGjDoG5nIMSRw6MgY+G6rXAgbmjhuq10IHbhu5tpIMSR4bqneSDEkeG7pyB0aMO0bmcgdGluXG4gICAgY29uc3QgdXBkYXRlZE9yZGVyID0gYXdhaXQgT3JkZXIuZmluZEJ5SWQocmVxLnBhcmFtcy5pZClcbiAgICAgIC5wb3B1bGF0ZShcInVzZXJJZFwiKVxuICAgICAgLnBvcHVsYXRlKFwicHJvZHVjdHMucHJvZHVjdElkXCIpO1xuICAgIFxuICAgIHJlcy5qc29uKHVwZGF0ZWRPcmRlcik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgxJHGoW4gaMOgbmc6XCIsIGVycik7XG4gICAgY29uc29sZS5lcnJvcihcIlN0YWNrIHRyYWNlOlwiLCBlcnIuc3RhY2spO1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICB9XG59O1xuXG4vLyBUaMOqbSBjb250cm9sbGVyIG3hu5tpIMSR4buDIMSRw6FuaCBk4bqldSDEkcahbiBow6BuZyDEkcOjIHRoYW5oIHRvw6FuXG5leHBvcnQgY29uc3QgbWFya09yZGVyQXNQYWlkID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3Qgb3JkZXJJZCA9IHJlcS5wYXJhbXMuaWQ7XG4gICAgY29uc3QgeyBpc1BhaWQsIHN0YXR1cyB9ID0gcmVxLmJvZHk7XG4gICAgXG4gICAgLy8gQ+G6rXAgbmjhuq10IHRow7RuZyB0aW4gxJHGoW4gaMOgbmc6IHRy4bqhbmcgdGjDoWkgdGhhbmggdG/DoW4gdsOgIHRy4bqhbmcgdGjDoWkgxJHGoW4gaMOgbmcgKG7hur91IGPDsylcbiAgICBjb25zdCB1cGRhdGVEYXRhID0geyBpc1BhaWQgfTtcbiAgICBcbiAgICAvLyBUw6xtIMSRxqFuIGjDoG5nIMSR4buDIGtp4buDbSB0cmFcbiAgICBjb25zdCBvcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRCeUlkKG9yZGVySWQpLnBvcHVsYXRlKFwicHJvZHVjdHMucHJvZHVjdElkXCIpO1xuICAgIFxuICAgIGlmICghb3JkZXIpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IGVycm9yOiBcIktow7RuZyB0w6xtIHRo4bqleSDEkcahbiBow6BuZ1wiIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyBUaGVvIGTDtWkgdHLhuqFuZyB0aMOhaSB0csaw4bubYyBraGkgY+G6rXAgbmjhuq10XG4gICAgY29uc3Qgd2FzUGFpZCA9IG9yZGVyLmlzUGFpZDtcbiAgICBjb25zdCBwcmV2aW91c1N0YXR1cyA9IG9yZGVyLnN0YXR1cztcbiAgICBcbiAgICAvLyBO4bq/dSBjw7MgdHLhuqFuZyB0aMOhaSBt4bubaSDEkcaw4bujYyBn4butaSBsw6puLCBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZ1xuICAgIGlmIChzdGF0dXMpIHtcbiAgICAgIHVwZGF0ZURhdGEuc3RhdHVzID0gc3RhdHVzO1xuICAgIH1cbiAgICBcbiAgICAvLyBUSMOKTSBN4buaSTogWOG7rSBsw70gY+G6rXAgbmjhuq10IHRyYWNraW5nX2xvZ3Mga2hpIGPDsyB0aGF5IMSR4buVaSB0cuG6oW5nIHRow6FpIGhv4bq3YyB0aGFuaCB0b8OhblxuICAgIGlmICgoc3RhdHVzICYmIHN0YXR1cyAhPT0gcHJldmlvdXNTdGF0dXMpIHx8IChpc1BhaWQgJiYgIXdhc1BhaWQpKSB7XG4gICAgICAvLyBLaOG7n2kgdOG6oW8gdHJhY2tpbmcgb2JqZWN0IG7hur91IGNoxrBhIGPDs1xuICAgICAgaWYgKCFvcmRlci50cmFja2luZykge1xuICAgICAgICBvcmRlci50cmFja2luZyA9IHsgc3RhdHVzX25hbWU6IFwiXCIsIHRyYWNraW5nX2xvZ3M6IFtdIH07XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIEzhuqV5IHTDqm4gaGnhu4NuIHRo4buLIGNobyB0cuG6oW5nIHRow6FpXG4gICAgICBsZXQgc3RhdHVzTmFtZSA9IFwiXCI7XG4gICAgICBpZiAoc3RhdHVzKSB7XG4gICAgICAgIHN3aXRjaCAoc3RhdHVzKSB7XG4gICAgICAgICAgY2FzZSAncGVuZGluZyc6IHN0YXR1c05hbWUgPSBcIkNo4budIHjhu60gbMO9XCI7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2NvbmZpcm1lZCc6IHN0YXR1c05hbWUgPSBcIsSQw6MgeMOhYyBuaOG6rW5cIjsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAncHJvY2Vzc2luZyc6IHN0YXR1c05hbWUgPSBcIsSQYW5nIHjhu60gbMO9XCI7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ3ByZXBhcmluZyc6IHN0YXR1c05hbWUgPSBcIsSQYW5nIGNodeG6qW4gYuG7iyBow6BuZ1wiOyBicmVhaztcbiAgICAgICAgICBjYXNlICdwYWNrYWdpbmcnOiBzdGF0dXNOYW1lID0gXCJIb8OgbiB04bqldCDEkcOzbmcgZ8OzaVwiOyBicmVhaztcbiAgICAgICAgICBjYXNlICdzaGlwcGluZyc6IHN0YXR1c05hbWUgPSBcIsSQYW5nIHbhuq1uIGNodXnhu4NuXCI7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ3NoaXBwZWQnOiBzdGF0dXNOYW1lID0gXCLEkMOjIGdpYW8gY2hvIHbhuq1uIGNodXnhu4NuXCI7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2RlbGl2ZXJpbmcnOiBzdGF0dXNOYW1lID0gXCLEkGFuZyBnaWFvIGjDoG5nXCI7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2RlbGl2ZXJlZCc6IHN0YXR1c05hbWUgPSBcIsSQw6MgZ2lhbyBow6BuZ1wiOyBicmVhaztcbiAgICAgICAgICBjYXNlICdjb21wbGV0ZWQnOiBzdGF0dXNOYW1lID0gXCJIb8OgbiB0aMOgbmhcIjsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnY2FuY2VsbGVkJzogc3RhdHVzTmFtZSA9IFwixJDDoyBo4buneVwiOyBicmVhaztcbiAgICAgICAgICBjYXNlICdhd2FpdGluZ19wYXltZW50Jzogc3RhdHVzTmFtZSA9IFwiQ2jhu50gdGhhbmggdG/DoW5cIjsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAncmVmdW5kZWQnOiBzdGF0dXNOYW1lID0gXCLEkMOjIGhvw6BuIHRp4buBblwiOyBicmVhaztcbiAgICAgICAgICBjYXNlICdmYWlsZWQnOiBzdGF0dXNOYW1lID0gXCJUaOG6pXQgYuG6oWlcIjsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnZGVsaXZlcnlfZmFpbGVkJzogc3RhdHVzTmFtZSA9IFwiR2lhbyBow6BuZyB0aOG6pXQgYuG6oWlcIjsgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDogc3RhdHVzTmFtZSA9IHN0YXR1cztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChpc1BhaWQgJiYgIXdhc1BhaWQpIHtcbiAgICAgICAgc3RhdHVzTmFtZSA9IFwixJDDoyB0aGFuaCB0b8OhblwiO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBUaMOqbSBi4bqjbiBnaGkgbeG7m2kgdsOgbyDEkeG6p3UgbeG6o25nIHRyYWNraW5nX2xvZ3NcbiAgICAgIGNvbnN0IG5ld1RyYWNraW5nTG9nID0ge1xuICAgICAgICBzdGF0dXM6IHN0YXR1cyB8fCBvcmRlci5zdGF0dXMsXG4gICAgICAgIHN0YXR1c19uYW1lOiBzdGF0dXNOYW1lIHx8IFwiQ+G6rXAgbmjhuq10IHRoYW5oIHRvw6FuXCIsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICBsb2NhdGlvbjogXCJD4butYSBow6BuZyBETkMgRk9PRFwiLFxuICAgICAgfTtcbiAgICAgIFxuICAgICAgLy8gS2jhu59pIHThuqFvIG3huqNuZyB0cmFja2luZ19sb2dzIG7hur91IGNoxrBhIGPDs1xuICAgICAgaWYgKCFvcmRlci50cmFja2luZy50cmFja2luZ19sb2dzKSB7XG4gICAgICAgIG9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3MgPSBbXTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gVGjDqm0gbG9nIG3hu5tpIHbDoG8gxJHhuqd1IG3huqNuZyAoxJHhu4MgbG9nIG3hu5tpIG5o4bqldCBu4bqxbSDEkeG6p3UgdGnDqm4pXG4gICAgICBvcmRlci50cmFja2luZy50cmFja2luZ19sb2dzLnVuc2hpZnQobmV3VHJhY2tpbmdMb2cpO1xuICAgICAgXG4gICAgICAvLyBD4bqtcCBuaOG6rXQgc3RhdHVzX25hbWUgY2jDrW5oXG4gICAgICBpZiAoc3RhdHVzTmFtZSkge1xuICAgICAgICBvcmRlci50cmFja2luZy5zdGF0dXNfbmFtZSA9IHN0YXR1c05hbWU7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIEzGsHUgdHJhY2tpbmcgdsOgbyB1cGRhdGVEYXRhIMSR4buDIGPhuq1wIG5o4bqtdFxuICAgICAgdXBkYXRlRGF0YS50cmFja2luZyA9IG9yZGVyLnRyYWNraW5nO1xuICAgIH1cbiAgICBcbiAgICAvLyBO4bq/dSDEkcOhbmggZOG6pXUgbMOgIMSRw6MgdGhhbmggdG/DoW4gdsOgIGhvw6BuIHRow6BuaCwgY+G6rXAgbmjhuq10IHRo4budaSBnaWFuIGhvw6BuIHRow6BuaFxuICAgIGlmIChpc1BhaWQgJiYgc3RhdHVzID09PSAnY29tcGxldGVkJykge1xuICAgICAgdXBkYXRlRGF0YS5jb21wbGV0ZWRBdCA9IG5ldyBEYXRlKCk7XG4gICAgfVxuICAgIFxuICAgIC8vIE7hur91IMSRxqFuIGjDoG5nIENPRCBob+G6t2MgY2jGsGEgdOG7q25nIHRoYW5oIHRvw6FuLCB2w6AgZ2nhu50gxJHDoyB0aGFuaCB0b8OhblxuICAgIGlmIChvcmRlci5wYXltZW50TWV0aG9kID09PSBcImNvZFwiICYmICF3YXNQYWlkICYmIGlzUGFpZCkge1xuICAgICAgLy8gQ+G6rXAgbmjhuq10IHPhu5EgbMaw4bujbmcgdOG7k24ga2hvIHbDoCB0xINuZyBzb2xkQ291bnRcbiAgICAgIGF3YWl0IHVwZGF0ZVByb2R1Y3RTdG9jayhvcmRlci5wcm9kdWN0cywgZmFsc2UsIHRydWUpO1xuICAgICAgXG4gICAgICAvLyBD4bqtcCBuaOG6rXQgdGjDtG5nIHRpbiBz4bqjbiBwaOG6qW0gYsOhbiBjaOG6oXlcbiAgICAgIHRyeSB7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBvcmRlci5wcm9kdWN0cykge1xuICAgICAgICAgIGlmIChpdGVtLnByb2R1Y3RJZCkge1xuICAgICAgICAgICAgYXdhaXQgQmVzdFNlbGxpbmdQcm9kdWN0LnVwZGF0ZVNhbGVzRGF0YShcbiAgICAgICAgICAgICAgaXRlbS5wcm9kdWN0SWQuX2lkLFxuICAgICAgICAgICAgICBpdGVtLnByb2R1Y3RJZCxcbiAgICAgICAgICAgICAgaXRlbS5xdWFudGl0eSxcbiAgICAgICAgICAgICAgb3JkZXJJZFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGJlc3RTZWxsZXJFcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIGPhuq1wIG5o4bqtdCBz4bqjbiBwaOG6qW0gYsOhbiBjaOG6oXk6XCIsIGJlc3RTZWxsZXJFcnJvcik7XG4gICAgICAgIC8vIEtow7RuZyB0cuG6oyB24buBIGzhu5dpLCB24bqrbiB0aeG6v3AgdOG7pWMgeOG7rSBsw71cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gQ+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgdGhhbmggdG/DoW4gY+G7p2EgxJHGoW4gaMOgbmdcbiAgICBjb25zdCB1cGRhdGVkT3JkZXIgPSBhd2FpdCBPcmRlci5maW5kQnlJZEFuZFVwZGF0ZShcbiAgICAgIG9yZGVySWQsXG4gICAgICB1cGRhdGVEYXRhLFxuICAgICAgeyBuZXc6IHRydWUgfVxuICAgICkucG9wdWxhdGUoXCJ1c2VySWRcIikucG9wdWxhdGUoXCJwcm9kdWN0cy5wcm9kdWN0SWRcIik7XG4gICAgXG4gICAgLy8gR2hpIGxvZyBob+G6t2MgdGjDtG5nIGLDoW9cbiAgICBjb25zb2xlLmxvZyhgxJDGoW4gaMOgbmcgJHtvcmRlcklkfSDEkcOjIMSRxrDhu6NjIMSRw6FuaCBk4bqldSBsw6AgxJHDoyB0aGFuaCB0b8OhbiR7c3RhdHVzID8gYCB2w6AgY2h1eeG7g24gdHLhuqFuZyB0aMOhaSB0aMOgbmggJHtzdGF0dXN9YCA6ICcnfWApO1xuICAgIFxuICAgIC8vIEfhu61pIGVtYWlsIHRow7RuZyBiw6FvIG7hur91IGPDsyBlbWFpbCB2w6Aga2hpIMSRxqFuIGjDoG5nIGNodXnhu4NuIHNhbmcgdHLhuqFuZyB0aMOhaSBjb21wbGV0ZWRcbiAgICBpZiAoc3RhdHVzID09PSAnY29tcGxldGVkJyAmJiBvcmRlci5zaGlwcGluZ0luZm8gJiYgb3JkZXIuc2hpcHBpbmdJbmZvLmVtYWlsKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBzZW5kT3JkZXJDb25maXJtYXRpb25FbWFpbCh1cGRhdGVkT3JkZXIpO1xuICAgICAgICBjb25zb2xlLmxvZyhgxJDDoyBn4butaSBlbWFpbCBob8OgbiB0aMOgbmggxJHGoW4gaMOgbmcgJHtvcmRlci5vcmRlckNvZGV9IMSR4bq/biAke29yZGVyLnNoaXBwaW5nSW5mby5lbWFpbH1gKTtcbiAgICAgIH0gY2F0Y2ggKGVtYWlsRXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignTOG7l2kga2hpIGfhu61pIGVtYWlsIGhvw6BuIHRow6BuaCDEkcahbiBow6BuZzonLCBlbWFpbEVycm9yKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmVzLmpzb24odXBkYXRlZE9yZGVyKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSDEkcOhbmggZOG6pXUgxJHGoW4gaMOgbmcgxJHDoyB0aGFuaCB0b8OhbjpcIiwgZXJyKTtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IG9yZGVyRGVsZXRlID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3Qgb3JkZXIgPSBhd2FpdCBPcmRlci5maW5kQnlJZEFuZERlbGV0ZShyZXEucGFyYW1zLmlkKTtcbiAgICBpZiAoIW9yZGVyKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSDEkcahbiBow6BuZ1wiIH0pO1xuICAgIH1cbiAgICByZXMuanNvbih7IG1lc3NhZ2U6IFwixJDGoW4gaMOgbmcgxJHDoyDEkcaw4bujYyB4w7NhIHRow6BuaCBjw7RuZ1wiIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgfVxufTtcblxuLy8gSMOgbSBo4buneSDEkcahbiBow6BuZ1xuZXhwb3J0IGNvbnN0IGNhbmNlbE9yZGVyID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3Qgb3JkZXJJZCA9IHJlcS5wYXJhbXMuaWQ7XG4gICAgY29uc3Qgb3JkZXIgPSBhd2FpdCBPcmRlci5maW5kQnlJZChvcmRlcklkKTtcbiAgICBcbiAgICBpZiAoIW9yZGVyKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgxJHGoW4gaMOgbmdcIlxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIEtp4buDbSB0cmEgeGVtIMSRxqFuIGjDoG5nIGPDsyB0aOG7gyBo4buneSBraMO0bmdcbiAgICBpZiAob3JkZXIuc3RhdHVzID09PSAnY29tcGxldGVkJyB8fCBvcmRlci5zdGF0dXMgPT09ICdkZWxpdmVyaW5nJykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IG9yZGVyLnN0YXR1cyA9PT0gXCJkZWxpdmVyaW5nXCIgXG4gICAgICAgICAgPyBcIktow7RuZyB0aOG7gyBo4buneSDEkcahbiBow6BuZyDEkWFuZyBnaWFvXCIgXG4gICAgICAgICAgOiBcIktow7RuZyB0aOG7gyBo4buneSDEkcahbiBow6BuZyDEkcOjIGdpYW9cIlxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIEPhuq1wIG5o4bqtdCB0cuG6oW5nIHRow6FpIMSRxqFuIGjDoG5nIHRow6BuaCAnY2FuY2VsbGVkJ1xuICAgIG9yZGVyLnN0YXR1cyA9ICdjYW5jZWxsZWQnO1xuICAgIGF3YWl0IG9yZGVyLnNhdmUoKTtcbiAgICBcbiAgICAvLyBDaOG7iSB0cuG6oyBs4bqhaSBz4buRIGzGsOG7o25nIHThu5NuIGtobyBu4bq/dSBsw6AgdGhhbmggdG/DoW4gb25saW5lLCBDT0QgY2jGsGEgdHLhu6sga2hvXG4gICAgaWYgKG9yZGVyLnBheW1lbnRNZXRob2QgIT09IFwiY29kXCIpIHtcbiAgICAgIGF3YWl0IHVwZGF0ZVByb2R1Y3RTdG9jayhvcmRlci5wcm9kdWN0cywgdHJ1ZSwgZmFsc2UpO1xuICAgIH1cbiAgICAvLyBO4bq/dSBDT0QgbmjGsG5nIMSRw6MgdGhhbmggdG/DoW4gdsOgIMSRw6MgY+G6rXAgbmjhuq10IHNvbGRDb3VudCwgY+G6p24gZ2nhuqNtIHNvbGRDb3VudFxuICAgIGVsc2UgaWYgKG9yZGVyLnBheW1lbnRNZXRob2QgPT09IFwiY29kXCIgJiYgb3JkZXIuaXNQYWlkKSB7XG4gICAgICBhd2FpdCB1cGRhdGVQcm9kdWN0U3RvY2sob3JkZXIucHJvZHVjdHMsIGZhbHNlLCB0cnVlKTsgLy8gVMSDbmcgc29sZENvdW50XG4gICAgfVxuICAgIFxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogXCJI4buneSDEkcahbiBow6BuZyB0aMOgbmggY8O0bmdcIixcbiAgICAgIGRhdGE6IG9yZGVyXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCJM4buXaSBraGkgaOG7p3kgxJHGoW4gaMOgbmdcIixcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlXG4gICAgfSk7XG4gIH1cbn07IFxuXG4vLyBM4bqleSB0aMO0bmcgdGluIHRyYWNraW5nIHThu6sgR2lhbyBIw6BuZyBOaGFuaCBBUElcbmV4cG9ydCBjb25zdCBnZXRPcmRlclRyYWNraW5nID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBvcmRlckNvZGUgfSA9IHJlcS5wYXJhbXM7XG4gICAgXG4gICAgaWYgKCFvcmRlckNvZGUpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIlRoaeG6v3UgbcOjIHbhuq1uIMSRxqFuXCJcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyBUw6xtIMSRxqFuIGjDoG5nIHRyb25nIGRhdGFiYXNlIGThu7FhIHRyw6puIG9yZGVyQ29kZVxuICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgT3JkZXIuZmluZE9uZSh7IG9yZGVyQ29kZSB9KTtcbiAgICBcbiAgICBpZiAoIW9yZGVyKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgxJHGoW4gaMOgbmcgduG7m2kgbcOjIHbhuq1uIMSRxqFuIG7DoHlcIlxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIE7hur91IMSRxqFuIGjDoG5nIMSRw6MgY8OzIHRow7RuZyB0aW4gdHJhY2tpbmcsIMawdSB0acOqbiBz4butIGThu6VuZ1xuICAgIGlmIChvcmRlci50cmFja2luZyAmJiBvcmRlci50cmFja2luZy50cmFja2luZ19sb2dzICYmIG9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3MubGVuZ3RoID4gMCkge1xuICAgICAgY29uc29sZS5sb2coXCJT4butIGThu6VuZyB0aMO0bmcgdGluIHRyYWNraW5nIHThu6sgZGF0YWJhc2VcIik7XG4gICAgICBcbiAgICAgIC8vIFThuqFvIGVzdGltYXRlZF9kZWxpdmVyeV90aW1lIG7hur91IGNoxrBhIGPDs1xuICAgICAgaWYgKCFvcmRlci50cmFja2luZy5lc3RpbWF0ZWRfZGVsaXZlcnlfdGltZSkge1xuICAgICAgICBjb25zdCBlc3RpbWF0ZWREZWxpdmVyeSA9IG5ldyBEYXRlKCk7XG4gICAgICAgIGVzdGltYXRlZERlbGl2ZXJ5LnNldERhdGUoZXN0aW1hdGVkRGVsaXZlcnkuZ2V0RGF0ZSgpICsgMyk7XG4gICAgICAgIG9yZGVyLnRyYWNraW5nLmVzdGltYXRlZF9kZWxpdmVyeV90aW1lID0gZXN0aW1hdGVkRGVsaXZlcnkudG9JU09TdHJpbmcoKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIG9yZGVyX2NvZGU6IG9yZGVyLm9yZGVyQ29kZSxcbiAgICAgICAgICBzdGF0dXM6IG9yZGVyLnN0YXR1cyxcbiAgICAgICAgICBzdGF0dXNfbmFtZTogb3JkZXIudHJhY2tpbmcuc3RhdHVzX25hbWUgfHwgZ2V0U3RhdHVzVGV4dChvcmRlci5zdGF0dXMpLFxuICAgICAgICAgIGVzdGltYXRlZF9kZWxpdmVyeV90aW1lOiBvcmRlci50cmFja2luZy5lc3RpbWF0ZWRfZGVsaXZlcnlfdGltZSxcbiAgICAgICAgICB0cmFja2luZ19sb2dzOiBvcmRlci50cmFja2luZy50cmFja2luZ19sb2dzLFxuICAgICAgICAgIGN1cnJlbnRfbG9jYXRpb246IFwiQ+G7rWEgaMOgbmcgRE5DIEZPT0RcIixcbiAgICAgICAgICBkZWxpdmVyeV9ub3RlOiBvcmRlci5ub3RlcyB8fCBcIkjDoG5nIGThu4UgduG7oSwgeGluIG5o4bq5IHRheVwiXG4gICAgICAgIH0sXG4gICAgICAgIGlzTW9ja2VkOiBmYWxzZVxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIFRp4bq/cCB04bulYyB24bubaSBjb2RlIGfhu41pIEFQSSBHSE4gbuG6v3UgY+G6p25cbiAgICBjb25zdCBTSE9QX0lEID0gcHJvY2Vzcy5lbnYuU0hPUF9JRDtcbiAgICBjb25zdCBTSE9QX1RPS0VOX0FQSSA9IHByb2Nlc3MuZW52LlNIT1BfVE9LRU5fQVBJO1xuICAgIGNvbnN0IFVTRV9NT0NLX09OX0VSUk9SID0gcHJvY2Vzcy5lbnYuVVNFX01PQ0tfT05fRVJST1IgPT09ICd0cnVlJztcbiAgICBcbiAgICBpZiAoIVNIT1BfSUQgfHwgIVNIT1BfVE9LRU5fQVBJKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlRoaeG6v3UgdGjDtG5nIHRpbiBj4bqldSBow6xuaCBHSE4gdHJvbmcgYmnhur9uIG3DtGkgdHLGsOG7nW5nXCIpO1xuICAgICAgaWYgKFVTRV9NT0NLX09OX0VSUk9SKSB7XG4gICAgICAgIC8vIFThuqFvIGThu68gbGnhu4d1IGdp4bqjIGzhuq1wIGThu7FhIHRyw6puIHRow7RuZyB0aW4gxJHGoW4gaMOgbmcgdGjhu7FjIHThur9cbiAgICAgICAgY29uc3QgbW9ja0RhdGEgPSBnZW5lcmF0ZU1vY2tUcmFja2luZ0RhdGFGcm9tT3JkZXIob3JkZXIpO1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgZGF0YTogbW9ja0RhdGEsXG4gICAgICAgICAgaXNNb2NrZWQ6IHRydWUsXG4gICAgICAgICAgbWVzc2FnZTogXCLEkGFuZyBz4butIGThu6VuZyBk4buvIGxp4buHdSBnaeG6oyBs4bqtcCBkbyB0aGnhur91IGPhuqV1IGjDrG5oIEdITiBBUElcIlxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwiVGhp4bq/dSB0aMO0bmcgdGluIGPhuqV1IGjDrG5oIEdITlwiXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIGNvbnNvbGUubG9nKGDEkGFuZyBn4buNaSBBUEkgR0hOIHbhu5tpIG3DoyB24bqtbiDEkcahbjogJHtvcmRlckNvZGV9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgVGjDtG5nIHRpbiBTaG9wOiBJRD0ke1NIT1BfSUR9LCBUT0tFTj0ke1NIT1BfVE9LRU5fQVBJLnN1YnN0cmluZygwLCAxMCl9Li4uYCk7XG4gICAgICBcbiAgICAgIC8vIEfhu41pIEFQSSBHSE4gxJHhu4MgbOG6pXkgdGjDtG5nIHRpbiB0cmFja2luZ1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KFxuICAgICAgICBcImh0dHBzOi8vb25saW5lLWdhdGV3YXkuZ2huLnZuL3NoaWlwL3B1YmxpYy1hcGkvdjIvc2hpcHBpbmctb3JkZXIvZGV0YWlsXCIsIFxuICAgICAgICB7IG9yZGVyX2NvZGU6IG9yZGVyQ29kZSB9LFxuICAgICAgICB7XG4gICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ1Rva2VuJzogU0hPUF9UT0tFTl9BUEksXG4gICAgICAgICAgICAnU2hvcElkJzogU0hPUF9JRCxcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICBcbiAgICAgIGNvbnNvbGUubG9nKFwiS+G6v3QgcXXhuqMgdOG7qyBBUEkgR0hOOlwiLCBKU09OLnN0cmluZ2lmeShyZXNwb25zZS5kYXRhLCBudWxsLCAyKSk7XG4gICAgICBcbiAgICAgIC8vIE7hur91IEFQSSB0cuG6oyB24buBIGzhu5dpLCB44butIGzDvSB2w6AgdHLhuqMgduG7gSByZXNwb25zZSBwaMO5IGjhu6NwXG4gICAgICBpZiAocmVzcG9uc2UuZGF0YS5jb2RlICE9PSAyMDApIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJM4buXaSB04burIEdITiBBUEk6XCIsIHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICBcbiAgICAgICAgaWYgKFVTRV9NT0NLX09OX0VSUk9SKSB7XG4gICAgICAgICAgLy8gVOG6oW8gZOG7ryBsaeG7h3UgZ2nhuqMgbOG6rXAgZOG7sWEgdHLDqm4gdGjDtG5nIHRpbiDEkcahbiBow6BuZyB0aOG7sWMgdOG6v1xuICAgICAgICAgIGNvbnN0IG1vY2tEYXRhID0gZ2VuZXJhdGVNb2NrVHJhY2tpbmdEYXRhRnJvbU9yZGVyKG9yZGVyKTtcbiAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIGRhdGE6IG1vY2tEYXRhLFxuICAgICAgICAgICAgaXNNb2NrZWQ6IHRydWUsXG4gICAgICAgICAgICBtZXNzYWdlOiBcIsSQYW5nIHPhu60gZOG7pW5nIGThu68gbGnhu4d1IGdp4bqjIGzhuq1wIGRvIEFQSSBHSE4gdHLhuqMgduG7gSBs4buXaVwiXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKHJlc3BvbnNlLmRhdGEuY29kZSkuanNvbih7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgbWVzc2FnZTogcmVzcG9uc2UuZGF0YS5tZXNzYWdlIHx8IFwiTOG7l2kgdOG7qyBBUEkgR0hOXCIsXG4gICAgICAgICAgY29kZTogcmVzcG9uc2UuZGF0YS5jb2RlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBO4bq/dSB0aMOgbmggY8O0bmcsIHRy4bqjIHbhu4EgZOG7ryBsaeG7h3VcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIGRhdGE6IHJlc3BvbnNlLmRhdGEuZGF0YSxcbiAgICAgICAgaXNNb2NrZWQ6IGZhbHNlXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChhcGlFcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGfhu41pIEFQSSBHSE46XCIsIGFwaUVycm9yLm1lc3NhZ2UpO1xuICAgICAgXG4gICAgICBpZiAoVVNFX01PQ0tfT05fRVJST1IpIHtcbiAgICAgICAgLy8gVOG6oW8gZOG7ryBsaeG7h3UgZ2nhuqMgbOG6rXAgZOG7sWEgdHLDqm4gdGjDtG5nIHRpbiDEkcahbiBow6BuZyB0aOG7sWMgdOG6v1xuICAgICAgICBjb25zdCBtb2NrRGF0YSA9IGdlbmVyYXRlTW9ja1RyYWNraW5nRGF0YUZyb21PcmRlcihvcmRlcik7XG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICBkYXRhOiBtb2NrRGF0YSxcbiAgICAgICAgICBpc01vY2tlZDogdHJ1ZSxcbiAgICAgICAgICBtZXNzYWdlOiBcIsSQYW5nIHPhu60gZOG7pW5nIGThu68gbGnhu4d1IGdp4bqjIGzhuq1wIGRvIGtow7RuZyB0aOG7gyBr4bq/dCBu4buRaSBBUEkgR0hOXCJcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0aOG7gyBr4bq/dCBu4buRaSDEkeG6v24gQVBJIEdITlwiLFxuICAgICAgICBlcnJvcjogYXBpRXJyb3IubWVzc2FnZVxuICAgICAgfSk7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgbOG6pXkgdGjDtG5nIHRpbiB24bqtbiBjaHV54buDbjpcIiwgZXJyb3IucmVzcG9uc2UgJiYgZXJyb3IucmVzcG9uc2UuZGF0YSA/IGVycm9yLnJlc3BvbnNlLmRhdGEgOiBlcnJvci5tZXNzYWdlKTtcbiAgICBcbiAgICBjb25zdCBVU0VfTU9DS19PTl9FUlJPUiA9IHByb2Nlc3MuZW52LlVTRV9NT0NLX09OX0VSUk9SID09PSAndHJ1ZSc7XG4gICAgXG4gICAgaWYgKFVTRV9NT0NLX09OX0VSUk9SKSB7XG4gICAgICB0cnkge1xuICAgICAgICAvLyBUw6xtIMSRxqFuIGjDoG5nIHRyb25nIGRhdGFiYXNlIGThu7FhIHRyw6puIG9yZGVyQ29kZVxuICAgICAgICBjb25zdCBvcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRPbmUoeyBvcmRlckNvZGU6IHJlcS5wYXJhbXMub3JkZXJDb2RlIH0pO1xuICAgICAgICBcbiAgICAgICAgaWYgKG9yZGVyKSB7XG4gICAgICAgICAgLy8gVOG6oW8gZOG7ryBsaeG7h3UgZ2nhuqMgbOG6rXAgZOG7sWEgdHLDqm4gdGjDtG5nIHRpbiDEkcahbiBow6BuZyB0aOG7sWMgdOG6v1xuICAgICAgICAgIGNvbnN0IG1vY2tEYXRhID0gZ2VuZXJhdGVNb2NrVHJhY2tpbmdEYXRhRnJvbU9yZGVyKG9yZGVyKTtcbiAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIGRhdGE6IG1vY2tEYXRhLFxuICAgICAgICAgICAgaXNNb2NrZWQ6IHRydWUsXG4gICAgICAgICAgICBtZXNzYWdlOiBcIsSQYW5nIHPhu60gZOG7pW5nIGThu68gbGnhu4d1IGdp4bqjIGzhuq1wIGRvIGzhu5dpIGjhu4cgdGjhu5FuZ1wiXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGRiRXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSB0w6xtIMSRxqFuIGjDoG5nOlwiLCBkYkVycm9yKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gTuG6v3Uga2jDtG5nIHTDrG0gdGjhuqV5IMSRxqFuIGjDoG5nIGhv4bq3YyBjw7MgbOG7l2ksIHPhu60gZOG7pW5nIGThu68gbGnhu4d1IGdp4bqjIGzhuq1wIG3hurdjIMSR4buLbmhcbiAgICAgIGNvbnN0IG1vY2tEYXRhID0gZ2VuZXJhdGVNb2NrVHJhY2tpbmdEYXRhKHJlcS5wYXJhbXMub3JkZXJDb2RlKTtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIGRhdGE6IG1vY2tEYXRhLFxuICAgICAgICBpc01vY2tlZDogdHJ1ZSxcbiAgICAgICAgbWVzc2FnZTogXCLEkGFuZyBz4butIGThu6VuZyBk4buvIGxp4buHdSBnaeG6oyBs4bqtcCBkbyBs4buXaSBo4buHIHRo4buRbmdcIlxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IFwiTOG7l2kgaOG7hyB0aOG7kW5nIGtoaSBs4bqleSB0aMO0bmcgdGluIHbhuq1uIGNodXnhu4NuXCIsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxuICAgIH0pO1xuICB9XG59O1xuXG4vLyBIw6BtIGNodXnhu4NuIMSR4buVaSB0cuG6oW5nIHRow6FpIMSRxqFuIGjDoG5nIHRow6BuaCB0ZXh0IGhp4buDbiB0aOG7i1xuZnVuY3Rpb24gZ2V0U3RhdHVzVGV4dChzdGF0dXMpIHtcbiAgc3dpdGNoIChzdGF0dXMpIHtcbiAgICBjYXNlICdwZW5kaW5nJzogcmV0dXJuIFwiQ2jhu50geOG7rSBsw71cIjtcbiAgICBjYXNlICdjb25maXJtZWQnOiByZXR1cm4gXCLEkMOjIHjDoWMgbmjhuq1uXCI7XG4gICAgY2FzZSAncHJvY2Vzc2luZyc6IHJldHVybiBcIsSQYW5nIHjhu60gbMO9XCI7XG4gICAgY2FzZSAncHJlcGFyaW5nJzogcmV0dXJuIFwixJBhbmcgY2h14bqpbiBi4buLIGjDoG5nXCI7XG4gICAgY2FzZSAncGFja2FnaW5nJzogcmV0dXJuIFwiSG/DoG4gdOG6pXQgxJHDs25nIGfDs2lcIjtcbiAgICBjYXNlICdzaGlwcGluZyc6IHJldHVybiBcIsSQYW5nIHbhuq1uIGNodXnhu4NuXCI7XG4gICAgY2FzZSAnc2hpcHBlZCc6IHJldHVybiBcIsSQw6MgZ2lhbyBjaG8gduG6rW4gY2h1eeG7g25cIjtcbiAgICBjYXNlICdkZWxpdmVyaW5nJzogcmV0dXJuIFwixJBhbmcgZ2lhbyBow6BuZ1wiO1xuICAgIGNhc2UgJ2RlbGl2ZXJlZCc6IHJldHVybiBcIsSQw6MgZ2lhbyBow6BuZ1wiO1xuICAgIGNhc2UgJ2NvbXBsZXRlZCc6IHJldHVybiBcIkhvw6BuIHRow6BuaFwiO1xuICAgIGNhc2UgJ2NhbmNlbGxlZCc6IHJldHVybiBcIsSQw6MgaOG7p3lcIjtcbiAgICBjYXNlICdhd2FpdGluZ19wYXltZW50JzogcmV0dXJuIFwiQ2jhu50gdGhhbmggdG/DoW5cIjtcbiAgICBjYXNlICdyZWZ1bmRlZCc6IHJldHVybiBcIsSQw6MgaG/DoG4gdGnhu4FuXCI7XG4gICAgY2FzZSAnZmFpbGVkJzogcmV0dXJuIFwiVGjhuqV0IGLhuqFpXCI7XG4gICAgY2FzZSAnZGVsaXZlcnlfZmFpbGVkJzogcmV0dXJuIFwiR2lhbyBow6BuZyB0aOG6pXQgYuG6oWlcIjtcbiAgICBkZWZhdWx0OiByZXR1cm4gc3RhdHVzO1xuICB9XG59XG5cbi8vIEjDoG0gdOG6oW8gZOG7ryBsaeG7h3UgZ2nhuqMgbOG6rXAgdOG7qyDEkcahbiBow6BuZyB0aOG7sWMgdOG6v1xuZnVuY3Rpb24gZ2VuZXJhdGVNb2NrVHJhY2tpbmdEYXRhRnJvbU9yZGVyKG9yZGVyKSB7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gIGxldCB0cmFja2luZ0xvZ3MgPSBbXTtcbiAgXG4gIC8vIFPhu60gZOG7pW5nIHRyYWNraW5nX2xvZ3MgbuG6v3UgxJHDoyBjw7NcbiAgaWYgKG9yZGVyLnRyYWNraW5nICYmIG9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3MgJiYgb3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncy5sZW5ndGggPiAwKSB7XG4gICAgdHJhY2tpbmdMb2dzID0gb3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncztcbiAgfSBcbiAgLy8gTuG6v3Uga2jDtG5nIGPDsyB0cmFja2luZ19sb2dzLCB04bqhbyBk4buvIGxp4buHdSBnaeG6oyBs4bqtcCBk4buxYSB2w6BvIHRy4bqhbmcgdGjDoWkgaGnhu4duIHThuqFpXG4gIGVsc2Uge1xuICAgIC8vIFThuqFvIGPDoWMgbeG7kWMgdGjhu51pIGdpYW4gZ2nhuqMgbOG6rXBcbiAgICBjb25zdCB0aW1lRGF5MiA9IG5ldyBEYXRlKG5vdyk7XG4gICAgdGltZURheTIuc2V0SG91cnMobm93LmdldEhvdXJzKCkgLSAyNCk7IC8vIDEgbmfDoHkgdHLGsOG7m2NcbiAgICBcbiAgICBjb25zdCB0aW1lVG9kYXkxID0gbmV3IERhdGUobm93KTtcbiAgICB0aW1lVG9kYXkxLnNldEhvdXJzKG5vdy5nZXRIb3VycygpIC0gMTApOyAvLyAxMCBnaeG7nSB0csaw4bubY1xuICAgIFxuICAgIGNvbnN0IHRpbWVUb2RheTIgPSBuZXcgRGF0ZShub3cpO1xuICAgIHRpbWVUb2RheTIuc2V0SG91cnMobm93LmdldEhvdXJzKCkgLSA1KTsgLy8gNSBnaeG7nSB0csaw4bubY1xuICAgIFxuICAgIGNvbnN0IHRpbWVMYXRlc3QgPSBuZXcgRGF0ZShub3cpO1xuICAgIHRpbWVMYXRlc3Quc2V0TWludXRlcyhub3cuZ2V0TWludXRlcygpIC0gMzApOyAvLyAzMCBwaMO6dCB0csaw4bubY1xuICAgIFxuICAgIC8vIFThuqFvIGxvZ3MgZOG7sWEgdHLDqm4gdHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZ1xuICAgIHN3aXRjaCAob3JkZXIuc3RhdHVzKSB7XG4gICAgICBjYXNlICdjb21wbGV0ZWQnOlxuICAgICAgICB0cmFja2luZ0xvZ3MgPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3RhdHVzOiBcImNvbXBsZXRlZFwiLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IFwiSG/DoG4gdGjDoG5oXCIsXG4gICAgICAgICAgICB0aW1lc3RhbXA6IG5vdy50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgbG9jYXRpb246IFwixJDhu4thIGNo4buJIGdpYW8gaMOgbmdcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3RhdHVzOiBcImRlbGl2ZXJlZFwiLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IFwixJDDoyBnaWFvIGjDoG5nXCIsXG4gICAgICAgICAgICB0aW1lc3RhbXA6IHRpbWVMYXRlc3QudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGxvY2F0aW9uOiBcIsSQ4buLYSBjaOG7iSBnaWFvIGjDoG5nXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0YXR1czogXCJkZWxpdmVyaW5nXCIsXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogXCLEkGFuZyBnaWFvIGjDoG5nXCIsXG4gICAgICAgICAgICB0aW1lc3RhbXA6IHRpbWVUb2RheTIudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGxvY2F0aW9uOiBcIlRydW5nIHTDom0gcGjDom4gbG/huqFpXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0YXR1czogXCJzaGlwcGluZ1wiLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IFwixJBhbmcgduG6rW4gY2h1eeG7g25cIixcbiAgICAgICAgICAgIHRpbWVzdGFtcDogdGltZVRvZGF5MS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgbG9jYXRpb246IFwiQ+G7rWEgaMOgbmcgRE5DIEZPT0RcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3RhdHVzOiBcInBhY2thZ2luZ1wiLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IFwiSG/DoG4gdOG6pXQgxJHDs25nIGfDs2lcIixcbiAgICAgICAgICAgIHRpbWVzdGFtcDogdGltZURheTIudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGxvY2F0aW9uOiBcIkPhu61hIGjDoG5nIEROQyBGT09EXCJcbiAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBcbiAgICAgIGNhc2UgJ2RlbGl2ZXJpbmcnOlxuICAgICAgICB0cmFja2luZ0xvZ3MgPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3RhdHVzOiBcImRlbGl2ZXJpbmdcIixcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBcIsSQYW5nIGdpYW8gaMOgbmdcIixcbiAgICAgICAgICAgIHRpbWVzdGFtcDogdGltZUxhdGVzdC50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgbG9jYXRpb246IFwiVHJ1bmcgdMOibSBwaMOibiBsb+G6oWlcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3RhdHVzOiBcInNoaXBwaW5nXCIsXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogXCLEkGFuZyB24bqtbiBjaHV54buDblwiLFxuICAgICAgICAgICAgdGltZXN0YW1wOiB0aW1lVG9kYXkxLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBsb2NhdGlvbjogXCJD4butYSBow6BuZyBETkMgRk9PRFwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdGF0dXM6IFwicGFja2FnaW5nXCIsXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogXCJIb8OgbiB04bqldCDEkcOzbmcgZ8OzaVwiLFxuICAgICAgICAgICAgdGltZXN0YW1wOiB0aW1lRGF5Mi50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgbG9jYXRpb246IFwiQ+G7rWEgaMOgbmcgRE5DIEZPT0RcIlxuICAgICAgICAgIH1cbiAgICAgICAgXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIFxuICAgICAgY2FzZSAnc2hpcHBpbmcnOlxuICAgICAgICB0cmFja2luZ0xvZ3MgPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3RhdHVzOiBcInNoaXBwaW5nXCIsXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogXCLEkGFuZyB24bqtbiBjaHV54buDblwiLFxuICAgICAgICAgICAgdGltZXN0YW1wOiB0aW1lTGF0ZXN0LnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBsb2NhdGlvbjogXCJD4butYSBow6BuZyBETkMgRk9PRFwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdGF0dXM6IFwicGFja2FnaW5nXCIsXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogXCJIb8OgbiB04bqldCDEkcOzbmcgZ8OzaVwiLFxuICAgICAgICAgICAgdGltZXN0YW1wOiB0aW1lVG9kYXkxLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBsb2NhdGlvbjogXCJD4butYSBow6BuZyBETkMgRk9PRFwiXG4gICAgICAgICAgfVxuICAgICAgICBdO1xuICAgICAgICBicmVhaztcbiAgICAgICAgXG4gICAgICBjYXNlICdwYWNrYWdpbmcnOlxuICAgICAgICB0cmFja2luZ0xvZ3MgPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3RhdHVzOiBcInBhY2thZ2luZ1wiLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IFwiSG/DoG4gdOG6pXQgxJHDs25nIGfDs2lcIixcbiAgICAgICAgICAgIHRpbWVzdGFtcDogdGltZUxhdGVzdC50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgbG9jYXRpb246IFwiQ+G7rWEgaMOgbmcgRE5DIEZPT0RcIlxuICAgICAgICAgIH1cbiAgICAgICAgXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgLy8gVuG7m2kgY8OhYyB0cuG6oW5nIHRow6FpIGtow6FjLCB04bqhbyBt4buZdCBi4bqjbiBnaGkgcGjDuSBo4bujcFxuICAgICAgICB0cmFja2luZ0xvZ3MgPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3RhdHVzOiBvcmRlci5zdGF0dXMsXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogZ2V0U3RhdHVzVGV4dChvcmRlci5zdGF0dXMpLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBub3cudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGxvY2F0aW9uOiBcIkPhu61hIGjDoG5nIEROQyBGT09EXCJcbiAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuICB9XG4gIFxuICAvLyBU4bqhbyBuZ8OgeSBk4buxIGtp4bq/biBnaWFvIGjDoG5nICgzIG5nw6B5IHThu6sgaGnhu4duIHThuqFpKVxuICBjb25zdCBlc3RpbWF0ZWREZWxpdmVyeSA9IG5ldyBEYXRlKG5vdyk7XG4gIGVzdGltYXRlZERlbGl2ZXJ5LnNldERhdGUobm93LmdldERhdGUoKSArIDMpO1xuICBcbiAgLy8gTOG6pXkgdHLhuqFuZyB0aMOhaSB2w6AgdMOqbiB0cuG6oW5nIHRow6FpIHThu6sgYuG6o24gZ2hpIG3hu5tpIG5o4bqldFxuICBjb25zdCBzdGF0dXMgPSB0cmFja2luZ0xvZ3MubGVuZ3RoID4gMCA/IHRyYWNraW5nTG9nc1swXS5zdGF0dXMgOiBvcmRlci5zdGF0dXM7XG4gIGNvbnN0IHN0YXR1c19uYW1lID0gdHJhY2tpbmdMb2dzLmxlbmd0aCA+IDAgPyB0cmFja2luZ0xvZ3NbMF0uc3RhdHVzX25hbWUgOiBnZXRTdGF0dXNUZXh0KG9yZGVyLnN0YXR1cyk7XG4gIFxuICAvLyBUcuG6oyB24buBIGPhuqV1IHRyw7pjIGThu68gbGnhu4d1IHRyYWNraW5nXG4gIHJldHVybiB7XG4gICAgb3JkZXJfY29kZTogb3JkZXIub3JkZXJDb2RlLFxuICAgIHN0YXR1czogc3RhdHVzLFxuICAgIHN0YXR1c19uYW1lOiBzdGF0dXNfbmFtZSxcbiAgICBlc3RpbWF0ZWRfZGVsaXZlcnlfdGltZTogZXN0aW1hdGVkRGVsaXZlcnkudG9JU09TdHJpbmcoKSxcbiAgICB0cmFja2luZ19sb2dzOiB0cmFja2luZ0xvZ3MsXG4gICAgY3VycmVudF9sb2NhdGlvbjogXCJD4butYSBow6BuZyBETkMgRk9PRFwiLFxuICAgIGRlbGl2ZXJ5X25vdGU6IG9yZGVyLm5vdGVzIHx8IFwiSMOgbmcgZOG7hSB24buhLCB4aW4gbmjhurkgdGF5XCJcbiAgfTtcbn1cblxuLy8gR2nhu68gbOG6oWkgaMOgbSBjxakgxJHhu4MgdMawxqFuZyB0aMOtY2ggbmfGsOG7o2NcbmZ1bmN0aW9uIGdlbmVyYXRlTW9ja1RyYWNraW5nRGF0YShvcmRlckNvZGUpIHtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgXG4gIC8vIFThuqFvIGPDoWMgbeG7kWMgdGjhu51pIGdpYW4gZ2nhuqMgbOG6rXBcbiAgY29uc3QgdGltZURheTIgPSBuZXcgRGF0ZShub3cpO1xuICB0aW1lRGF5Mi5zZXRIb3Vycyhub3cuZ2V0SG91cnMoKSAtIDI0KTsgLy8gMSBuZ8OgeSB0csaw4bubY1xuICBcbiAgY29uc3QgdGltZVRvZGF5MSA9IG5ldyBEYXRlKG5vdyk7XG4gIHRpbWVUb2RheTEuc2V0SG91cnMobm93LmdldEhvdXJzKCkgLSAxMCk7IC8vIDEwIGdp4budIHRyxrDhu5tjXG4gIFxuICBjb25zdCB0aW1lVG9kYXkyID0gbmV3IERhdGUobm93KTtcbiAgdGltZVRvZGF5Mi5zZXRIb3Vycyhub3cuZ2V0SG91cnMoKSAtIDUpOyAvLyA1IGdp4budIHRyxrDhu5tjXG4gIFxuICBjb25zdCB0aW1lTGF0ZXN0ID0gbmV3IERhdGUobm93KTtcbiAgdGltZUxhdGVzdC5zZXRNaW51dGVzKG5vdy5nZXRNaW51dGVzKCkgLSAzMCk7IC8vIDMwIHBow7p0IHRyxrDhu5tjXG4gIFxuICAvLyBU4bqhbyBuZ8OgeSBk4buxIGtp4bq/biBnaWFvIGjDoG5nICgzIG5nw6B5IHThu6sgaGnhu4duIHThuqFpKVxuICBjb25zdCBlc3RpbWF0ZWREZWxpdmVyeSA9IG5ldyBEYXRlKG5vdyk7XG4gIGVzdGltYXRlZERlbGl2ZXJ5LnNldERhdGUobm93LmdldERhdGUoKSArIDMpOyAvLyBE4buxIGtp4bq/biBnaWFvIHNhdSAzIG5nw6B5XG4gIFxuICAvLyBU4bqhbyBkYW5oIHPDoWNoIGPDoWMgbG9nIHbhuq1uIGNodXnhu4NuIGdp4bqjIGzhuq1wICh04burIG3hu5tpIMSR4bq/biBjxakpXG4gIGNvbnN0IHRyYWNraW5nTG9ncyA9IFtcbiAgICB7XG4gICAgICBzdGF0dXM6IFwicGFja2FnaW5nXCIsXG4gICAgICBzdGF0dXNfbmFtZTogXCJIb8OgbiB04bqldCDEkcOzbmcgZ8OzaVwiLFxuICAgICAgdGltZXN0YW1wOiB0aW1lRGF5Mi50b0lTT1N0cmluZygpLFxuICAgICAgbG9jYXRpb246IFwiQ+G7rWEgaMOgbmcgRE5DIEZPT0RcIlxuICAgIH0sXG4gICAge1xuICAgICAgc3RhdHVzOiBcInNoaXBwaW5nXCIsXG4gICAgICBzdGF0dXNfbmFtZTogXCLEkMOjIGdpYW8gY2hvIHbhuq1uIGNodXnhu4NuXCIsXG4gICAgICB0aW1lc3RhbXA6IHRpbWVUb2RheTEudG9JU09TdHJpbmcoKSxcbiAgICAgIGxvY2F0aW9uOiBcIkPhu61hIGjDoG5nIEROQyBGT09EXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIHN0YXR1czogXCJjb2xsZWN0ZWRcIixcbiAgICAgIHN0YXR1c19uYW1lOiBcIsSQw6MgbOG6pXkgaMOgbmdcIixcbiAgICAgIHRpbWVzdGFtcDogdGltZVRvZGF5Mi50b0lTT1N0cmluZygpLFxuICAgICAgbG9jYXRpb246IFwiQ+G7rWEgaMOgbmcgRE5DIEZPT0RcIlxuICAgIH0sXG4gICAge1xuICAgICAgc3RhdHVzOiBcImRlbGl2ZXJpbmdcIixcbiAgICAgIHN0YXR1c19uYW1lOiBcIsSQYW5nIGdpYW8gaMOgbmdcIixcbiAgICAgIHRpbWVzdGFtcDogdGltZUxhdGVzdC50b0lTT1N0cmluZygpLFxuICAgICAgbG9jYXRpb246IFwiVHJ1bmcgdMOibSBwaMOibiBsb+G6oWlcIlxuICAgIH1cbiAgXTtcblxuICAvLyBUcuG6oyB24buBIGPhuqV1IHRyw7pjIGThu68gbGnhu4d1IHRyYWNraW5nIGdp4bqjIGzhuq1wXG4gIHJldHVybiB7XG4gICAgb3JkZXJfY29kZTogb3JkZXJDb2RlLFxuICAgIHN0YXR1czogXCJkZWxpdmVyaW5nXCIsXG4gICAgc3RhdHVzX25hbWU6IFwixJBhbmcgZ2lhbyBow6BuZ1wiLFxuICAgIGVzdGltYXRlZF9kZWxpdmVyeV90aW1lOiBlc3RpbWF0ZWREZWxpdmVyeS50b0lTT1N0cmluZygpLFxuICAgIHRyYWNraW5nX2xvZ3M6IHRyYWNraW5nTG9ncyxcbiAgICBjdXJyZW50X2xvY2F0aW9uOiBcIlRydW5nIHTDom0gcGjDom4gcGjhu5FpXCIsXG4gICAgZGVsaXZlcnlfbm90ZTogXCJIw6BuZyBk4buFIHbhu6EsIHhpbiBuaOG6uSB0YXlcIlxuICB9O1xufVxuXG4vLyBD4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSB0aGFuaCB0b8OhbiBj4bunYSDEkcahbiBow6BuZ1xuZXhwb3J0IGNvbnN0IHVwZGF0ZU9yZGVyUGF5bWVudFN0YXR1cyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHsgaWQgfSA9IHJlcS5wYXJhbXM7XG4gICAgY29uc3QgeyBwYXltZW50U3RhdHVzLCBpc1BhaWQgfSA9IHJlcS5ib2R5O1xuXG4gICAgLy8gVmFsaWRhdGUgaW5wdXRcbiAgICBpZiAoIWlkKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJPcmRlciBJRCBpcyByZXF1aXJlZFwiXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBGaW5kIG9yZGVyXG4gICAgY29uc3Qgb3JkZXIgPSBhd2FpdCBPcmRlci5maW5kQnlJZChpZCk7XG4gICAgaWYgKCFvcmRlcikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwiT3JkZXIgbm90IGZvdW5kXCJcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFRyYWNrIG9sZCB2YWx1ZXMgZm9yIGNvbXBhcmlzb25cbiAgICBjb25zdCBvbGRQYXltZW50U3RhdHVzID0gb3JkZXIucGF5bWVudFN0YXR1cztcbiAgICBjb25zdCBvbGRJc1BhaWQgPSBvcmRlci5pc1BhaWQ7XG5cbiAgICAvLyBVcGRhdGUgcGF5bWVudCBzdGF0dXNcbiAgICBjb25zdCB1cGRhdGVEYXRhID0ge307XG4gICAgaWYgKHBheW1lbnRTdGF0dXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdXBkYXRlRGF0YS5wYXltZW50U3RhdHVzID0gcGF5bWVudFN0YXR1cztcbiAgICB9XG4gICAgaWYgKGlzUGFpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB1cGRhdGVEYXRhLmlzUGFpZCA9IGlzUGFpZDtcbiAgICB9XG5cbiAgICAvLyBUSMOKTSBN4buaSTogQ+G6rXAgbmjhuq10IHRyYWNraW5nX2xvZ3Mga2hpIHRy4bqhbmcgdGjDoWkgdGhhbmggdG/DoW4gdGhheSDEkeG7lWlcbiAgICBpZiAoKHBheW1lbnRTdGF0dXMgJiYgcGF5bWVudFN0YXR1cyAhPT0gb2xkUGF5bWVudFN0YXR1cykgfHwgXG4gICAgICAgIChpc1BhaWQgIT09IHVuZGVmaW5lZCAmJiBpc1BhaWQgIT09IG9sZElzUGFpZCkpIHtcbiAgICAgIFxuICAgICAgLy8gS2jhu59pIHThuqFvIHRyYWNraW5nIG9iamVjdCBu4bq/dSBjaMawYSBjw7NcbiAgICAgIGlmICghb3JkZXIudHJhY2tpbmcpIHtcbiAgICAgICAgb3JkZXIudHJhY2tpbmcgPSB7IHN0YXR1c19uYW1lOiBcIlwiLCB0cmFja2luZ19sb2dzOiBbXSB9O1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBU4bqhbyBzdGF0dXNfbmFtZSB0aGVvIHRy4bqhbmcgdGjDoWkgdGhhbmggdG/DoW4gbeG7m2lcbiAgICAgIGxldCBzdGF0dXNOYW1lID0gXCJcIjtcbiAgICAgIGlmIChwYXltZW50U3RhdHVzKSB7XG4gICAgICAgIHN3aXRjaCAocGF5bWVudFN0YXR1cykge1xuICAgICAgICAgIGNhc2UgJ3BlbmRpbmcnOiBzdGF0dXNOYW1lID0gXCJDaOG7nSB0aGFuaCB0b8OhblwiOyBicmVhaztcbiAgICAgICAgICBjYXNlICdjb21wbGV0ZWQnOiBzdGF0dXNOYW1lID0gXCLEkMOjIHRoYW5oIHRvw6FuXCI7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2ZhaWxlZCc6IHN0YXR1c05hbWUgPSBcIlRoYW5oIHRvw6FuIHRo4bqldCBi4bqhaVwiOyBicmVhaztcbiAgICAgICAgICBjYXNlICdyZWZ1bmRlZCc6IHN0YXR1c05hbWUgPSBcIsSQw6MgaG/DoG4gdGnhu4FuXCI7IGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6IHN0YXR1c05hbWUgPSBgVHLhuqFuZyB0aMOhaSB0aGFuaCB0b8OhbjogJHtwYXltZW50U3RhdHVzfWA7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaXNQYWlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgc3RhdHVzTmFtZSA9IGlzUGFpZCA/IFwixJDDoyB0aGFuaCB0b8OhblwiIDogXCJDaMawYSB0aGFuaCB0b8OhblwiO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBUaMOqbSBi4bqjbiBnaGkgbeG7m2kgdsOgbyDEkeG6p3UgbeG6o25nIHRyYWNraW5nX2xvZ3NcbiAgICAgIGNvbnN0IG5ld1RyYWNraW5nTG9nID0ge1xuICAgICAgICBzdGF0dXM6IG9yZGVyLnN0YXR1cyxcbiAgICAgICAgc3RhdHVzX25hbWU6IHN0YXR1c05hbWUgfHwgXCJD4bqtcCBuaOG6rXQgdGhhbmggdG/DoW5cIixcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIGxvY2F0aW9uOiBcIkPhu61hIGjDoG5nIEROQyBGT09EXCIsXG4gICAgICB9O1xuICAgICAgXG4gICAgICAvLyBLaOG7n2kgdOG6oW8gbeG6o25nIHRyYWNraW5nX2xvZ3MgbuG6v3UgY2jGsGEgY8OzXG4gICAgICBpZiAoIW9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3MpIHtcbiAgICAgICAgb3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncyA9IFtdO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBUaMOqbSBsb2cgbeG7m2kgdsOgbyDEkeG6p3UgbeG6o25nICjEkeG7gyBsb2cgbeG7m2kgbmjhuqV0IG7hurFtIMSR4bqndSB0acOqbilcbiAgICAgIG9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3MudW5zaGlmdChuZXdUcmFja2luZ0xvZyk7XG4gICAgICBcbiAgICAgIC8vIEzGsHUgdHJhY2tpbmcgdsOgbyB1cGRhdGVEYXRhIMSR4buDIGPhuq1wIG5o4bqtdFxuICAgICAgdXBkYXRlRGF0YS50cmFja2luZyA9IG9yZGVyLnRyYWNraW5nO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSBvcmRlciBpbiBkYXRhYmFzZVxuICAgIGNvbnN0IHVwZGF0ZWRPcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRCeUlkQW5kVXBkYXRlKFxuICAgICAgaWQsXG4gICAgICB7ICRzZXQ6IHVwZGF0ZURhdGEgfSxcbiAgICAgIHsgbmV3OiB0cnVlIH1cbiAgICApLnBvcHVsYXRlKFwidXNlcklkXCIpLnBvcHVsYXRlKFwicHJvZHVjdHMucHJvZHVjdElkXCIpO1xuXG4gICAgLy8gSGFuZGxlIGludmVudG9yeSBhbmQgc2FsZXMgZGF0YSBpZiBuZXdseSBwYWlkXG4gICAgaWYgKGlzUGFpZCAmJiAhb2xkSXNQYWlkKSB7XG4gICAgICAvLyBVcGRhdGUgYmVzdHNlbGxpbmcgcHJvZHVjdHNcbiAgICAgIHRyeSB7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB1cGRhdGVkT3JkZXIucHJvZHVjdHMpIHtcbiAgICAgICAgICBpZiAoaXRlbS5wcm9kdWN0SWQpIHtcbiAgICAgICAgICAgIGF3YWl0IEJlc3RTZWxsaW5nUHJvZHVjdC51cGRhdGVTYWxlc0RhdGEoXG4gICAgICAgICAgICAgIGl0ZW0ucHJvZHVjdElkLl9pZCxcbiAgICAgICAgICAgICAgaXRlbS5wcm9kdWN0SWQsXG4gICAgICAgICAgICAgIGl0ZW0ucXVhbnRpdHksXG4gICAgICAgICAgICAgIGlkXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHVwZGF0aW5nIGJlc3RzZWxsaW5nIHByb2R1Y3RzOlwiLCBlcnJvcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gR+G7rWkgdGjDtG5nIGLDoW8ga2hpIGPhuq1wIG5o4bqtdCB0cuG6oW5nIHRow6FpIHRoYW5oIHRvw6FuXG4gICAgaWYgKHVwZGF0ZWRPcmRlci51c2VySWQgJiYgXG4gICAgICAgICgocGF5bWVudFN0YXR1cyAmJiBwYXltZW50U3RhdHVzICE9PSBvbGRQYXltZW50U3RhdHVzKSB8fCBcbiAgICAgICAgKGlzUGFpZCAhPT0gdW5kZWZpbmVkICYmIGlzUGFpZCAhPT0gb2xkSXNQYWlkKSkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHNlbmRPcmRlclN0YXR1c05vdGlmaWNhdGlvbih1cGRhdGVkT3JkZXIudXNlcklkLCB1cGRhdGVkT3JkZXIsIGdldFN0YXR1c1RleHQodXBkYXRlZE9yZGVyLnN0YXR1cykpO1xuICAgICAgICBjb25zb2xlLmxvZyhgxJDDoyBn4butaSB0aMO0bmcgYsOhbyBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSB0aGFuaCB0b8OhbiDEkcahbiBow6BuZyAke3VwZGF0ZWRPcmRlci5vcmRlckNvZGV9IMSR4bq/biB1c2VyICR7dXBkYXRlZE9yZGVyLnVzZXJJZH1gKTtcbiAgICAgIH0gY2F0Y2ggKG5vdGlmaWNhdGlvbkVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0zhu5dpIGtoaSBn4butaSB0aMO0bmcgYsOhbyBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSB0aGFuaCB0b8OhbjonLCBub3RpZmljYXRpb25FcnJvcik7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogXCJPcmRlciBwYXltZW50IHN0YXR1cyB1cGRhdGVkIHN1Y2Nlc3NmdWxseVwiLFxuICAgICAgZGF0YTogdXBkYXRlZE9yZGVyXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIHVwZGF0aW5nIHBheW1lbnQgc3RhdHVzOlwiLCBlcnJvcik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCJFcnJvciB1cGRhdGluZyBwYXltZW50IHN0YXR1c1wiLFxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcbiAgICB9KTtcbiAgfVxufTtcblxuLy8gVGjDqm0gY29udHJvbGxlciBmdW5jdGlvbiBt4bubaSDEkeG7gyBn4butaSBlbWFpbCB4w6FjIG5o4bqtbiDEkcahbiBow6BuZ1xuZXhwb3J0IGNvbnN0IG5vdGlmeU9yZGVyU3VjY2VzcyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IG9yZGVySWQgPSByZXEucGFyYW1zLmlkO1xuICAgIGNvbnN0IHsgZW1haWwsIGZ1bGxOYW1lLCBwaG9uZSwgYWRkcmVzcyB9ID0gcmVxLmJvZHk7XG4gICAgXG4gICAgY29uc29sZS5sb2coYD09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09YCk7XG4gICAgY29uc29sZS5sb2coYE5PVElGWSBPUkRFUiBTVUNDRVNTIC0gQVRURU1QVElORyBUTyBTRU5EIEVNQUlMYCk7XG4gICAgY29uc29sZS5sb2coYE9yZGVyIElEOiAke29yZGVySWR9YCk7XG4gICAgY29uc29sZS5sb2coYEVtYWlsIGRhdGE6YCwgeyBlbWFpbCwgZnVsbE5hbWUsIHBob25lLCBhZGRyZXNzIH0pO1xuICAgIFxuICAgIC8vIEzhuqV5IHRow7RuZyB0aW4gxJHGoW4gaMOgbmdcbiAgICBjb25zdCBvcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRCeUlkKG9yZGVySWQpXG4gICAgICAucG9wdWxhdGUoXCJ1c2VySWRcIilcbiAgICAgIC5wb3B1bGF0ZShcInByb2R1Y3RzLnByb2R1Y3RJZFwiKTtcbiAgICBcbiAgICBpZiAoIW9yZGVyKSB7XG4gICAgICBjb25zb2xlLmxvZyhgT3JkZXIgbm90IGZvdW5kIHdpdGggSUQ6ICR7b3JkZXJJZH1gKTtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSDEkcahbiBow6BuZ1wiXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgY29uc29sZS5sb2coYE9yZGVyIGZvdW5kOmAsIHtcbiAgICAgIG9yZGVyQ29kZTogb3JkZXIub3JkZXJDb2RlLFxuICAgICAgdXNlcklkOiBvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLl9pZCA/IG9yZGVyLnVzZXJJZC5faWQgOiB1bmRlZmluZWQsXG4gICAgICB1c2VyRW1haWw6IG9yZGVyLnVzZXJJZCAmJiBvcmRlci51c2VySWQuZW1haWwgPyBvcmRlci51c2VySWQuZW1haWwgOiB1bmRlZmluZWQsXG4gICAgICB0b3RhbEFtb3VudDogb3JkZXIudG90YWxBbW91bnRcbiAgICB9KTtcbiAgICBcbiAgICAvLyBU4bqhbyB0aMO0bmcgdGluIGdpYW8gaMOgbmcgY2hvIGVtYWlsXG4gICAgY29uc3Qgc2hpcHBpbmdJbmZvID0ge1xuICAgICAgZnVsbE5hbWU6IGZ1bGxOYW1lIHx8ICgob3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC5maXJzdE5hbWUgPyBgJHtvcmRlci51c2VySWQuZmlyc3ROYW1lIHx8ICcnfSAke29yZGVyLnVzZXJJZC5sYXN0TmFtZSB8fCAnJ31gLnRyaW0oKSA6ICcnKSksXG4gICAgICBhZGRyZXNzOiBhZGRyZXNzIHx8IG9yZGVyLmFkZHJlc3MgfHwgKG9yZGVyLnVzZXJJZCAmJiBvcmRlci51c2VySWQuYWRkcmVzcyA/IG9yZGVyLnVzZXJJZC5hZGRyZXNzIDogJycpLFxuICAgICAgcGhvbmU6IHBob25lIHx8IChvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLnBob25lID8gb3JkZXIudXNlcklkLnBob25lIDogJycpLFxuICAgICAgZW1haWw6IGVtYWlsIHx8IChvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLmVtYWlsID8gb3JkZXIudXNlcklkLmVtYWlsIDogJycpXG4gICAgfTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhgU2hpcHBpbmcgaW5mbyBwcmVwYXJlZDpgLCBzaGlwcGluZ0luZm8pO1xuICAgIFxuICAgIC8vIMSQ4bqjbSBi4bqjbyBjw7MgZW1haWwgdHJvbmcgc2hpcHBpbmdJbmZvXG4gICAgaWYgKCFzaGlwcGluZ0luZm8uZW1haWwpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBFUlJPUjogTm8gZW1haWwgcHJvdmlkZWQgaW4gcmVxdWVzdCBvciBmb3VuZCBpbiBvcmRlcmApO1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwiVGhp4bq/dSDEkeG7i2EgY2jhu4kgZW1haWwgxJHhu4MgZ+G7rWkgeMOhYyBuaOG6rW4gxJHGoW4gaMOgbmdcIlxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIEfhuq9uIHRow7RuZyB0aW4gZ2lhbyBow6BuZyB2w6BvIMSRxqFuIGjDoG5nXG4gICAgb3JkZXIuc2hpcHBpbmdJbmZvID0gc2hpcHBpbmdJbmZvO1xuICAgIFxuICAgIC8vIEzGsHUgbOG6oWkgdGjDtG5nIHRpbiBzaGlwcGluZ0luZm8gdsOgbyDEkcahbiBow6BuZyDEkeG7gyBz4butIGThu6VuZyBzYXUgbsOgeVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBPcmRlci5maW5kQnlJZEFuZFVwZGF0ZShvcmRlcklkLCB7IHNoaXBwaW5nSW5mbzogc2hpcHBpbmdJbmZvIH0pO1xuICAgICAgY29uc29sZS5sb2coYFVwZGF0ZWQgb3JkZXIgd2l0aCBzaGlwcGluZ0luZm9gKTtcbiAgICB9IGNhdGNoICh1cGRhdGVFcnJvcikge1xuICAgICAgY29uc29sZS5sb2coYFdhcm5pbmc6IENvdWxkIG5vdCB1cGRhdGUgb3JkZXIgd2l0aCBzaGlwcGluZ0luZm86ICR7dXBkYXRlRXJyb3IubWVzc2FnZX1gKTtcbiAgICAgIC8vIFRp4bq/cCB04bulYyB0aOG7sWMgaGnhu4duIGfhu61pIGVtYWlsIG3hurdjIGTDuSBraMO0bmcgY+G6rXAgbmjhuq10IMSRxrDhu6NjIG9yZGVyXG4gICAgfVxuICAgIFxuICAgIC8vIEfhu61pIGVtYWlsIHjDoWMgbmjhuq1uIMSRxqFuIGjDoG5nXG4gICAgY29uc29sZS5sb2coYEF0dGVtcHRpbmcgdG8gc2VuZCBjb25maXJtYXRpb24gZW1haWwgdG86ICR7c2hpcHBpbmdJbmZvLmVtYWlsfWApO1xuICAgIFxuICAgIGNvbnN0IGVtYWlsU2VudCA9IGF3YWl0IHNlbmRPcmRlckNvbmZpcm1hdGlvbkVtYWlsKG9yZGVyKTtcbiAgICBjb25zb2xlLmxvZyhgRW1haWwgc2VudCByZXN1bHQ6ICR7ZW1haWxTZW50ID8gXCJTVUNDRVNTXCIgOiBcIkZBSUxFRFwifWApO1xuICAgIFxuICAgIGlmIChlbWFpbFNlbnQpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBFbWFpbCBzdWNjZXNzZnVsbHkgc2VudCB0bzogJHtzaGlwcGluZ0luZm8uZW1haWx9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1gKTtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIG1lc3NhZ2U6IFwiRW1haWwgeMOhYyBuaOG6rW4gxJHGoW4gaMOgbmcgxJHDoyDEkcaw4bujYyBn4butaSB0aMOgbmggY8O0bmdcIlxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKGBGYWlsZWQgdG8gc2VuZCBlbWFpbCB0bzogJHtzaGlwcGluZ0luZm8uZW1haWx9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1gKTtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0aOG7gyBn4butaSBlbWFpbCB4w6FjIG5o4bqtbiDEkcahbiBow6BuZ1wiXG4gICAgICB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGluIG5vdGlmeU9yZGVyU3VjY2VzczpcIiwgZXJyb3IpO1xuICAgIGNvbnNvbGUubG9nKGA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PWApO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IFwixJDDoyB44bqjeSByYSBs4buXaSBraGkgZ+G7rWkgZW1haWwgeMOhYyBuaOG6rW4gxJHGoW4gaMOgbmdcIixcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlXG4gICAgfSk7XG4gIH1cbn07XG5cbi8vIEjDoG0gbOG6pXkgdG9wIMSRxqFuIGjDoG5nIGPDsyBnacOhIHRy4buLIGNhbyBuaOG6pXRcbmV4cG9ydCBjb25zdCBnZXRUb3BPcmRlcnMgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBsaW1pdCA9IHBhcnNlSW50KHJlcS5xdWVyeS5saW1pdCkgfHwgMTA7IC8vIE3hurdjIMSR4buLbmggbOG6pXkgdG9wIDEwIMSRxqFuIGjDoG5nXG5cbiAgICAvLyBUw6xtIMSRxqFuIGjDoG5nIHbDoCBz4bqvcCB44bq/cCB0aGVvIHRvdGFsQW1vdW50IGdp4bqjbSBk4bqnblxuICAgIGNvbnN0IHRvcE9yZGVycyA9IGF3YWl0IE9yZGVyLmZpbmQoKVxuICAgICAgLnBvcHVsYXRlKFwidXNlcklkXCIsIFwiZmlyc3ROYW1lIGxhc3ROYW1lIGVtYWlsIHVzZXJOYW1lXCIpXG4gICAgICAuc29ydCh7IHRvdGFsQW1vdW50OiAtMSB9KVxuICAgICAgLmxpbWl0KGxpbWl0KTtcblxuICAgIC8vIMSQ4buLbmggZOG6oW5nIGzhuqFpIGThu68gbGnhu4d1IMSR4buDIHBow7kgaOG7o3AgduG7m2kgY+G6pXUgdHLDumMgaGnhu4NuIHRo4buLXG4gICAgY29uc3QgZm9ybWF0dGVkT3JkZXJzID0gdG9wT3JkZXJzLm1hcChvcmRlciA9PiB7XG4gICAgICAvLyDEkOG7i25oIGThuqFuZyB0w6puIGtow6FjaCBow6BuZ1xuICAgICAgbGV0IGN1c3RvbWVyTmFtZSA9ICdLaMOhY2ggaMOgbmcnO1xuICAgICAgaWYgKG9yZGVyLnVzZXJJZCkge1xuICAgICAgICBpZiAob3JkZXIudXNlcklkLmZpcnN0TmFtZSB8fCBvcmRlci51c2VySWQubGFzdE5hbWUpIHtcbiAgICAgICAgICBjdXN0b21lck5hbWUgPSBgJHtvcmRlci51c2VySWQuZmlyc3ROYW1lIHx8ICcnfSAke29yZGVyLnVzZXJJZC5sYXN0TmFtZSB8fCAnJ31gLnRyaW0oKTtcbiAgICAgICAgfSBlbHNlIGlmIChvcmRlci51c2VySWQudXNlck5hbWUpIHtcbiAgICAgICAgICBjdXN0b21lck5hbWUgPSBvcmRlci51c2VySWQudXNlck5hbWU7XG4gICAgICAgIH0gZWxzZSBpZiAob3JkZXIudXNlcklkLmVtYWlsKSB7XG4gICAgICAgICAgY3VzdG9tZXJOYW1lID0gb3JkZXIudXNlcklkLmVtYWlsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIMSQ4buLbmggZOG6oW5nIG5nw6B5IMSR4bq3dCBow6BuZ1xuICAgICAgY29uc3Qgb3JkZXJEYXRlID0gb3JkZXIuY3JlYXRlZEF0ID8gbmV3IERhdGUob3JkZXIuY3JlYXRlZEF0KSA6IG5ldyBEYXRlKCk7XG4gICAgICBjb25zdCBmb3JtYXR0ZWREYXRlID0gYCR7b3JkZXJEYXRlLmdldERhdGUoKX0vJHtvcmRlckRhdGUuZ2V0TW9udGgoKSArIDF9LyR7b3JkZXJEYXRlLmdldEZ1bGxZZWFyKCl9YDtcblxuICAgICAgLy8gQ2h1eeG7g24gxJHhu5VpIHRy4bqhbmcgdGjDoWkgc2FuZyB0aeG6v25nIFZp4buHdFxuICAgICAgbGV0IHN0YXR1c1RleHQgPSAnxJBhbmcgeOG7rSBsw70nO1xuICAgICAgc3dpdGNoKG9yZGVyLnN0YXR1cykge1xuICAgICAgICBjYXNlICdwZW5kaW5nJzogc3RhdHVzVGV4dCA9ICfEkGFuZyB44butIGzDvSc7IGJyZWFrO1xuICAgICAgICBjYXNlICdjb25maXJtZWQnOiBzdGF0dXNUZXh0ID0gJ8SQw6MgeMOhYyBuaOG6rW4nOyBicmVhaztcbiAgICAgICAgY2FzZSAncHJvY2Vzc2luZyc6IHN0YXR1c1RleHQgPSAnxJBhbmcgeOG7rSBsw70nOyBicmVhaztcbiAgICAgICAgY2FzZSAnc2hpcHBpbmcnOiBzdGF0dXNUZXh0ID0gJ8SQYW5nIHbhuq1uIGNodXnhu4NuJzsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2RlbGl2ZXJpbmcnOiBzdGF0dXNUZXh0ID0gJ8SQYW5nIGdpYW8gaMOgbmcnOyBicmVhaztcbiAgICAgICAgY2FzZSAnZGVsaXZlcmVkJzogc3RhdHVzVGV4dCA9ICfEkMOjIGdpYW8gaMOgbmcnOyBicmVhaztcbiAgICAgICAgY2FzZSAnY29tcGxldGVkJzogc3RhdHVzVGV4dCA9ICfEkMOjIGhvw6BuIHRow6BuaCc7IGJyZWFrO1xuICAgICAgICBjYXNlICdjYW5jZWxsZWQnOiBzdGF0dXNUZXh0ID0gJ8SQw6MgaOG7p3knOyBicmVhaztcbiAgICAgICAgY2FzZSAnYXdhaXRpbmdfcGF5bWVudCc6IHN0YXR1c1RleHQgPSAnQ2jhu50gdGhhbmggdG/DoW4nOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDogc3RhdHVzVGV4dCA9IG9yZGVyLnN0YXR1cztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6IG9yZGVyLm9yZGVyQ29kZSB8fCBvcmRlci5faWQsXG4gICAgICAgIGN1c3RvbWVyOiBjdXN0b21lck5hbWUsXG4gICAgICAgIHRvdGFsOiBvcmRlci50b3RhbEFtb3VudCxcbiAgICAgICAgc3RhdHVzOiBzdGF0dXNUZXh0LFxuICAgICAgICBkYXRlOiBmb3JtYXR0ZWREYXRlXG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oZm9ybWF0dGVkT3JkZXJzKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdM4buXaSBraGkgbOG6pXkgZGFuaCBzw6FjaCDEkcahbiBow6BuZyBnacOhIHRy4buLIGNhbyBuaOG6pXQ6JywgZXJyb3IpO1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgXG4gICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICBtZXNzYWdlOiAnTOG7l2kga2hpIGzhuqV5IGRhbmggc8OhY2ggxJHGoW4gaMOgbmcgZ2nDoSB0cuG7iyBjYW8gbmjhuqV0JyxcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlIFxuICAgIH0pO1xuICB9XG59O1xuXG4vLyBIw6BtIGzhuqV5IHRo4buRbmcga8OqIMSRxqFuIGjDoG5nXG5leHBvcnQgY29uc3QgZ2V0T3JkZXJTdGF0cyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHBlcmlvZCA9IHJlcS5xdWVyeS5wZXJpb2QgfHwgJ3dlZWsnOyAvLyBN4bq3YyDEkeG7i25oIGzDoCB0deG6p25cbiAgICBjb25zdCBzdGFydERhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIGxldCBlbmREYXRlID0gbmV3IERhdGUoKTtcbiAgICBcbiAgICAvLyBUaGnhur90IGzhuq1wIGtob+G6o25nIHRo4budaSBnaWFuIGThu7FhIHRyw6puIHBlcmlvZFxuICAgIHN3aXRjaCAocGVyaW9kKSB7XG4gICAgICBjYXNlICd3ZWVrJzpcbiAgICAgICAgc3RhcnREYXRlLnNldERhdGUoc3RhcnREYXRlLmdldERhdGUoKSAtIDcpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21vbnRoJzpcbiAgICAgICAgc3RhcnREYXRlLnNldERhdGUoc3RhcnREYXRlLmdldERhdGUoKSAtIDMwKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd5ZWFyJzpcbiAgICAgICAgc3RhcnREYXRlLnNldERhdGUoc3RhcnREYXRlLmdldERhdGUoKSAtIDM2NSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgc3RhcnREYXRlLnNldERhdGUoc3RhcnREYXRlLmdldERhdGUoKSAtIDcpO1xuICAgIH1cbiAgICBcbiAgICAvLyBM4bqleSB0aOG7kW5nIGvDqiBz4buRIGzGsOG7o25nIMSRxqFuIGjDoG5nIHRoZW8gdHLhuqFuZyB0aMOhaVxuICAgIGNvbnN0IHBlbmRpbmdDb3VudCA9IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHsgXG4gICAgICBzdGF0dXM6IHsgJGluOiBbJ3BlbmRpbmcnLCAncHJvY2Vzc2luZycsICdhd2FpdGluZ19wYXltZW50J10gfSxcbiAgICAgIGNyZWF0ZWRBdDogeyAkZ3RlOiBzdGFydERhdGUsICRsdGU6IGVuZERhdGUgfSAgXG4gICAgfSk7XG4gICAgXG4gICAgY29uc3Qgc2hpcHBpbmdDb3VudCA9IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHsgXG4gICAgICBzdGF0dXM6IHsgJGluOiBbJ3NoaXBwaW5nJywgJ2RlbGl2ZXJpbmcnXSB9LFxuICAgICAgY3JlYXRlZEF0OiB7ICRndGU6IHN0YXJ0RGF0ZSwgJGx0ZTogZW5kRGF0ZSB9ICBcbiAgICB9KTtcbiAgICBcbiAgICBjb25zdCBjb21wbGV0ZWRDb3VudCA9IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHsgXG4gICAgICBzdGF0dXM6ICdjb21wbGV0ZWQnLFxuICAgICAgY3JlYXRlZEF0OiB7ICRndGU6IHN0YXJ0RGF0ZSwgJGx0ZTogZW5kRGF0ZSB9ICBcbiAgICB9KTtcbiAgICBcbiAgICBjb25zdCBjYW5jZWxsZWRDb3VudCA9IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHsgXG4gICAgICBzdGF0dXM6ICdjYW5jZWxsZWQnLFxuICAgICAgY3JlYXRlZEF0OiB7ICRndGU6IHN0YXJ0RGF0ZSwgJGx0ZTogZW5kRGF0ZSB9ICBcbiAgICB9KTtcbiAgICBcbiAgICAvLyBUw61uaCB04buVbmcgc+G7kSDEkcahbiBow6BuZ1xuICAgIGNvbnN0IHRvdGFsT3JkZXJzID0gcGVuZGluZ0NvdW50ICsgc2hpcHBpbmdDb3VudCArIGNvbXBsZXRlZENvdW50ICsgY2FuY2VsbGVkQ291bnQ7XG4gICAgXG4gICAgLy8gROG7ryBsaeG7h3UgY2hvIGJp4buDdSDEkeG7kyB0cuG6oW5nIHRow6FpIMSRxqFuIGjDoG5nXG4gICAgY29uc3Qgb3JkZXJTdGF0dXMgPSBbXG4gICAgICB7IG5hbWU6ICfEkGFuZyB44butIGzDvScsIHZhbHVlOiBwZW5kaW5nQ291bnQgfSxcbiAgICAgIHsgbmFtZTogJ8SQYW5nIGdpYW8nLCB2YWx1ZTogc2hpcHBpbmdDb3VudCB9LFxuICAgICAgeyBuYW1lOiAnxJDDoyBnaWFvJywgdmFsdWU6IGNvbXBsZXRlZENvdW50IH0sXG4gICAgICB7IG5hbWU6ICfEkMOjIGjhu6d5JywgdmFsdWU6IGNhbmNlbGxlZENvdW50IH1cbiAgICBdO1xuICAgIFxuICAgIC8vIFTDrW5oIHRvw6FuIHRo4budaSBnaWFuIHjhu60gbMO9IHRydW5nIGLDrG5oIGThu7FhIHRyw6puIGThu68gbGnhu4d1IHRo4buxYyB04bq/XG4gICAgbGV0IHByb2Nlc3NpbmdUaW1lID0gW107XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIC8vIEzhuqV5IMSRxqFuIGjDoG5nIMSRw6MgaG/DoG4gdGjDoG5oIMSR4buDIHTDrW5oIHRo4budaSBnaWFuIHjhu60gbMO9XG4gICAgICBjb25zdCBjb21wbGV0ZWRPcmRlcnMgPSBhd2FpdCBPcmRlci5maW5kKHtcbiAgICAgICAgc3RhdHVzOiAnY29tcGxldGVkJyxcbiAgICAgICAgY3JlYXRlZEF0OiB7ICRndGU6IHN0YXJ0RGF0ZSwgJGx0ZTogZW5kRGF0ZSB9LFxuICAgICAgICBjb21wbGV0ZWRBdDogeyAkZXhpc3RzOiB0cnVlIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBpZiAoY29tcGxldGVkT3JkZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gVMOtbmggdOG7lW5nIHRo4budaSBnaWFuIHjhu60gbMO9XG4gICAgICAgIGxldCB0b3RhbFByb2Nlc3NpbmdUaW1lID0gMDtcbiAgICAgICAgbGV0IHRvdGFsU2hpcHBpbmdUaW1lID0gMDtcbiAgICAgICAgbGV0IHRvdGFsVG90YWxUaW1lID0gMDtcbiAgICAgICAgXG4gICAgICAgIGNvbXBsZXRlZE9yZGVycy5mb3JFYWNoKG9yZGVyID0+IHtcbiAgICAgICAgICAvLyBO4bq/dSBjw7MgdHJhY2tpbmcgbG9ncywgc+G7rSBk4bulbmcgY2jDum5nIMSR4buDIHTDrW5oIHRo4budaSBnaWFuIGNow61uaCB4w6FjIGjGoW5cbiAgICAgICAgICBpZiAob3JkZXIudHJhY2tpbmcgJiYgQXJyYXkuaXNBcnJheShvcmRlci50cmFja2luZy50cmFja2luZ19sb2dzKSAmJiBvcmRlci50cmFja2luZy50cmFja2luZ19sb2dzLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgICAgICBjb25zdCBsb2dzID0gb3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncztcbiAgICAgICAgICAgIC8vIFPhuq9wIHjhur9wIGxvZ3MgdGhlbyB0aOG7nWkgZ2lhblxuICAgICAgICAgICAgbG9ncy5zb3J0KChhLCBiKSA9PiBuZXcgRGF0ZShhLnRpbWVzdGFtcCkgLSBuZXcgRGF0ZShiLnRpbWVzdGFtcCkpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBUw61uaCB0aOG7nWkgZ2lhbiB04burIHThuqFvIMSRxqFuIMSR4bq/biDEkcOzbmcgZ8OzaVxuICAgICAgICAgICAgY29uc3QgcGFja2FnaW5nTG9nID0gbG9ncy5maW5kKGxvZyA9PiBsb2cuc3RhdHVzID09PSAncGFja2FnaW5nJyB8fCBsb2cuc3RhdHVzX25hbWUuaW5jbHVkZXMoJ8SRw7NuZyBnw7NpJykpO1xuICAgICAgICAgICAgaWYgKHBhY2thZ2luZ0xvZykge1xuICAgICAgICAgICAgICBjb25zdCBwYWNrYWdpbmdUaW1lID0gKG5ldyBEYXRlKHBhY2thZ2luZ0xvZy50aW1lc3RhbXApIC0gbmV3IERhdGUob3JkZXIuY3JlYXRlZEF0KSkgLyAoMTAwMCAqIDYwKTsgLy8gUGjDunRcbiAgICAgICAgICAgICAgdG90YWxQcm9jZXNzaW5nVGltZSArPSBwYWNrYWdpbmdUaW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBUw61uaCB0aOG7nWkgZ2lhbiB04burIMSRw7NuZyBnw7NpIMSR4bq/biBnaWFvIGjDoG5nXG4gICAgICAgICAgICBjb25zdCBzaGlwcGluZ0xvZyA9IGxvZ3MuZmluZChsb2cgPT4gbG9nLnN0YXR1cyA9PT0gJ3NoaXBwaW5nJyB8fCBsb2cuc3RhdHVzID09PSAnZGVsaXZlcmluZycpO1xuICAgICAgICAgICAgY29uc3QgZGVsaXZlcmVkTG9nID0gbG9ncy5maW5kKGxvZyA9PiBsb2cuc3RhdHVzID09PSAnZGVsaXZlcmVkJyB8fCBsb2cuc3RhdHVzID09PSAnY29tcGxldGVkJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChzaGlwcGluZ0xvZyAmJiBkZWxpdmVyZWRMb2cpIHtcbiAgICAgICAgICAgICAgY29uc3QgZGVsaXZlcnlUaW1lID0gKG5ldyBEYXRlKGRlbGl2ZXJlZExvZy50aW1lc3RhbXApIC0gbmV3IERhdGUoc2hpcHBpbmdMb2cudGltZXN0YW1wKSkgLyAoMTAwMCAqIDYwKTtcbiAgICAgICAgICAgICAgdG90YWxTaGlwcGluZ1RpbWUgKz0gZGVsaXZlcnlUaW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBUw61uaCB04buVbmcgdGjhu51pIGdpYW4gdOG7qyB04bqhbyDEkcahbiDEkeG6v24gaG/DoG4gdGjDoG5oXG4gICAgICAgICAgICB0b3RhbFRvdGFsVGltZSArPSAobmV3IERhdGUob3JkZXIuY29tcGxldGVkQXQpIC0gbmV3IERhdGUob3JkZXIuY3JlYXRlZEF0KSkgLyAoMTAwMCAqIDYwKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gTuG6v3Uga2jDtG5nIGPDsyB0cmFja2luZyBsb2dzLCBz4butIGThu6VuZyBjcmVhdGVkQXQgdsOgIGNvbXBsZXRlZEF0XG4gICAgICAgICAgICBjb25zdCB0b3RhbFRpbWUgPSAobmV3IERhdGUob3JkZXIuY29tcGxldGVkQXQpIC0gbmV3IERhdGUob3JkZXIuY3JlYXRlZEF0KSkgLyAoMTAwMCAqIDYwKTtcbiAgICAgICAgICAgIHRvdGFsVG90YWxUaW1lICs9IHRvdGFsVGltZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gR2nhuqMgxJHhu4tuaCB04bu3IGzhu4cgdGjhu51pIGdpYW4gY2hvIHThu6tuZyBnaWFpIMSRb+G6oW5cbiAgICAgICAgICAgIHRvdGFsUHJvY2Vzc2luZ1RpbWUgKz0gdG90YWxUaW1lICogMC4zOyAvLyAzMCUgdGjhu51pIGdpYW4gY2hvIHjhu60gbMO9XG4gICAgICAgICAgICB0b3RhbFNoaXBwaW5nVGltZSArPSB0b3RhbFRpbWUgKiAwLjc7IC8vIDcwJSB0aOG7nWkgZ2lhbiBjaG8gduG6rW4gY2h1eeG7g25cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gVMOtbmggdGjhu51pIGdpYW4gdHJ1bmcgYsOsbmhcbiAgICAgICAgY29uc3QgYXZnUHJvY2Vzc2luZ1RpbWUgPSBNYXRoLnJvdW5kKHRvdGFsUHJvY2Vzc2luZ1RpbWUgLyBjb21wbGV0ZWRPcmRlcnMubGVuZ3RoKTtcbiAgICAgICAgY29uc3QgYXZnU2hpcHBpbmdUaW1lID0gTWF0aC5yb3VuZCh0b3RhbFNoaXBwaW5nVGltZSAvIGNvbXBsZXRlZE9yZGVycy5sZW5ndGgpO1xuICAgICAgICBjb25zdCBhdmdUb3RhbFRpbWUgPSBNYXRoLnJvdW5kKHRvdGFsVG90YWxUaW1lIC8gY29tcGxldGVkT3JkZXJzLmxlbmd0aCk7XG4gICAgICAgIFxuICAgICAgICBwcm9jZXNzaW5nVGltZSA9IFtcbiAgICAgICAgICB7IG5hbWU6ICdYw6FjIG5o4bqtbiAmIMSQw7NuZyBnw7NpJywgdGltZTogYXZnUHJvY2Vzc2luZ1RpbWUgfHwgMTUgfSxcbiAgICAgICAgICB7IG5hbWU6ICdW4bqtbiBjaHV54buDbicsIHRpbWU6IGF2Z1NoaXBwaW5nVGltZSB8fCA0NSB9LFxuICAgICAgICAgIHsgbmFtZTogJ1Thu5VuZyB0aOG7nWkgZ2lhbicsIHRpbWU6IGF2Z1RvdGFsVGltZSB8fCA2MCB9XG4gICAgICAgIF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBO4bq/dSBraMO0bmcgY8OzIMSRxqFuIGjDoG5nIGhvw6BuIHRow6BuaCwgc+G7rSBk4bulbmcgZOG7ryBsaeG7h3UgbeG6q3VcbiAgICAgICAgcHJvY2Vzc2luZ1RpbWUgPSBbXG4gICAgICAgICAgeyBuYW1lOiAnWMOhYyBuaOG6rW4nLCB0aW1lOiAxNSB9LFxuICAgICAgICAgIHsgbmFtZTogJ8SQw7NuZyBnw7NpJywgdGltZTogMzAgfSxcbiAgICAgICAgICB7IG5hbWU6ICdW4bqtbiBjaHV54buDbicsIHRpbWU6IDQ1IH1cbiAgICAgICAgXTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignTOG7l2kga2hpIHTDrW5oIHRvw6FuIHRo4budaSBnaWFuIHjhu60gbMO9IHRydW5nIGLDrG5oOicsIGVycm9yKTtcbiAgICAgIC8vIEThu68gbGnhu4d1IG3huqt1IGtoaSBjw7MgbOG7l2lcbiAgICAgIHByb2Nlc3NpbmdUaW1lID0gW1xuICAgICAgICB7IG5hbWU6ICdYw6FjIG5o4bqtbicsIHRpbWU6IDE1IH0sXG4gICAgICAgIHsgbmFtZTogJ8SQw7NuZyBnw7NpJywgdGltZTogMzAgfSxcbiAgICAgICAgeyBuYW1lOiAnVuG6rW4gY2h1eeG7g24nLCB0aW1lOiA0NSB9XG4gICAgICBdO1xuICAgIH1cbiAgICBcbiAgICAvLyBM4bqleSBkYW5oIHPDoWNoIHRvcCAxMCDEkcahbiBow6BuZyBnacOhIHRy4buLIGNhbyBuaOG6pXRcbiAgICBjb25zdCB0b3BPcmRlcnMgPSBhd2FpdCBPcmRlci5maW5kKHsgY3JlYXRlZEF0OiB7ICRndGU6IHN0YXJ0RGF0ZSwgJGx0ZTogZW5kRGF0ZSB9IH0pXG4gICAgICAucG9wdWxhdGUoXCJ1c2VySWRcIiwgXCJmaXJzdE5hbWUgbGFzdE5hbWUgZW1haWwgdXNlck5hbWVcIilcbiAgICAgIC5zb3J0KHsgdG90YWxBbW91bnQ6IC0xIH0pXG4gICAgICAubGltaXQoMTApO1xuICAgIFxuICAgIC8vIMSQ4buLbmggZOG6oW5nIGzhuqFpIGThu68gbGnhu4d1IHRvcCBvcmRlcnNcbiAgICBjb25zdCBmb3JtYXR0ZWRUb3BPcmRlcnMgPSB0b3BPcmRlcnMubWFwKG9yZGVyID0+IHtcbiAgICAgIC8vIMSQ4buLbmggZOG6oW5nIHTDqm4ga2jDoWNoIGjDoG5nXG4gICAgICBsZXQgY3VzdG9tZXJOYW1lID0gJ0tow6FjaCBow6BuZyc7XG4gICAgICBpZiAob3JkZXIudXNlcklkKSB7XG4gICAgICAgIGlmIChvcmRlci51c2VySWQuZmlyc3ROYW1lIHx8IG9yZGVyLnVzZXJJZC5sYXN0TmFtZSkge1xuICAgICAgICAgIGN1c3RvbWVyTmFtZSA9IGAke29yZGVyLnVzZXJJZC5maXJzdE5hbWUgfHwgJyd9ICR7b3JkZXIudXNlcklkLmxhc3ROYW1lIHx8ICcnfWAudHJpbSgpO1xuICAgICAgICB9IGVsc2UgaWYgKG9yZGVyLnVzZXJJZC51c2VyTmFtZSkge1xuICAgICAgICAgIGN1c3RvbWVyTmFtZSA9IG9yZGVyLnVzZXJJZC51c2VyTmFtZTtcbiAgICAgICAgfSBlbHNlIGlmIChvcmRlci51c2VySWQuZW1haWwpIHtcbiAgICAgICAgICBjdXN0b21lck5hbWUgPSBvcmRlci51c2VySWQuZW1haWw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gxJDhu4tuaCBk4bqhbmcgbmfDoHkgxJHhurd0IGjDoG5nXG4gICAgICBjb25zdCBvcmRlckRhdGUgPSBvcmRlci5jcmVhdGVkQXQgPyBuZXcgRGF0ZShvcmRlci5jcmVhdGVkQXQpIDogbmV3IERhdGUoKTtcbiAgICAgIGNvbnN0IGZvcm1hdHRlZERhdGUgPSBgJHtvcmRlckRhdGUuZ2V0RGF0ZSgpfS8ke29yZGVyRGF0ZS5nZXRNb250aCgpICsgMX0vJHtvcmRlckRhdGUuZ2V0RnVsbFllYXIoKX1gO1xuXG4gICAgICAvLyBDaHV54buDbiDEkeG7lWkgdHLhuqFuZyB0aMOhaSBzYW5nIHRp4bq/bmcgVmnhu4d0XG4gICAgICBsZXQgc3RhdHVzVGV4dCA9ICfEkGFuZyB44butIGzDvSc7XG4gICAgICBzd2l0Y2gob3JkZXIuc3RhdHVzKSB7XG4gICAgICAgIGNhc2UgJ3BlbmRpbmcnOiBzdGF0dXNUZXh0ID0gJ8SQYW5nIHjhu60gbMO9JzsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2NvbmZpcm1lZCc6IHN0YXR1c1RleHQgPSAnxJDDoyB4w6FjIG5o4bqtbic7IGJyZWFrO1xuICAgICAgICBjYXNlICdwcm9jZXNzaW5nJzogc3RhdHVzVGV4dCA9ICfEkGFuZyB44butIGzDvSc7IGJyZWFrO1xuICAgICAgICBjYXNlICdzaGlwcGluZyc6IHN0YXR1c1RleHQgPSAnxJBhbmcgduG6rW4gY2h1eeG7g24nOyBicmVhaztcbiAgICAgICAgY2FzZSAnZGVsaXZlcmluZyc6IHN0YXR1c1RleHQgPSAnxJBhbmcgZ2lhbyBow6BuZyc7IGJyZWFrO1xuICAgICAgICBjYXNlICdkZWxpdmVyZWQnOiBzdGF0dXNUZXh0ID0gJ8SQw6MgZ2lhbyBow6BuZyc7IGJyZWFrO1xuICAgICAgICBjYXNlICdjb21wbGV0ZWQnOiBzdGF0dXNUZXh0ID0gJ8SQw6MgaG/DoG4gdGjDoG5oJzsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2NhbmNlbGxlZCc6IHN0YXR1c1RleHQgPSAnxJDDoyBo4buneSc7IGJyZWFrO1xuICAgICAgICBjYXNlICdhd2FpdGluZ19wYXltZW50Jzogc3RhdHVzVGV4dCA9ICdDaOG7nSB0aGFuaCB0b8Ohbic7IGJyZWFrO1xuICAgICAgICBkZWZhdWx0OiBzdGF0dXNUZXh0ID0gb3JkZXIuc3RhdHVzO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBpZDogb3JkZXIub3JkZXJDb2RlIHx8IG9yZGVyLl9pZCxcbiAgICAgICAgY3VzdG9tZXI6IGN1c3RvbWVyTmFtZSxcbiAgICAgICAgdG90YWw6IG9yZGVyLnRvdGFsQW1vdW50LFxuICAgICAgICBzdGF0dXM6IHN0YXR1c1RleHQsXG4gICAgICAgIGRhdGU6IGZvcm1hdHRlZERhdGVcbiAgICAgIH07XG4gICAgfSk7XG4gICAgXG4gICAgLy8gVHLhuqMgduG7gSBk4buvIGxp4buHdSB0aOG7kW5nIGvDqlxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgIHRvdGFsT3JkZXJzLFxuICAgICAgcGVuZGluZ09yZGVyczogcGVuZGluZ0NvdW50LFxuICAgICAgY29tcGxldGVkT3JkZXJzOiBjb21wbGV0ZWRDb3VudCxcbiAgICAgIGNhbmNlbGxlZE9yZGVyczogY2FuY2VsbGVkQ291bnQsXG4gICAgICBvcmRlclN0YXR1cyxcbiAgICAgIHByb2Nlc3NpbmdUaW1lLFxuICAgICAgdG9wT3JkZXJzOiBmb3JtYXR0ZWRUb3BPcmRlcnNcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdM4buXaSBraGkgbOG6pXkgdGjhu5FuZyBrw6ogxJHGoW4gaMOgbmc6JywgZXJyb3IpO1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgXG4gICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICBtZXNzYWdlOiAnTOG7l2kga2hpIGzhuqV5IHRo4buRbmcga8OqIMSRxqFuIGjDoG5nJyxcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlIFxuICAgIH0pO1xuICB9XG59O1xuXG4vLyBIw6BtIGzhuqV5IHRo4buRbmcga8OqIGdpYW8gaMOgbmdcbmV4cG9ydCBjb25zdCBnZXREZWxpdmVyeVN0YXRzID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcGVyaW9kID0gcmVxLnF1ZXJ5LnBlcmlvZCB8fCAnd2Vlayc7IC8vIE3hurdjIMSR4buLbmggbMOgIHR14bqnblxuICAgIGNvbnN0IHN0YXJ0RGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgbGV0IGVuZERhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIFxuICAgIC8vIFRoaeG6v3QgbOG6rXAga2hv4bqjbmcgdGjhu51pIGdpYW4gZOG7sWEgdHLDqm4gcGVyaW9kXG4gICAgc3dpdGNoIChwZXJpb2QpIHtcbiAgICAgIGNhc2UgJ3dlZWsnOlxuICAgICAgICBzdGFydERhdGUuc2V0RGF0ZShzdGFydERhdGUuZ2V0RGF0ZSgpIC0gNyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbW9udGgnOlxuICAgICAgICBzdGFydERhdGUuc2V0RGF0ZShzdGFydERhdGUuZ2V0RGF0ZSgpIC0gMzApO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3llYXInOlxuICAgICAgICBzdGFydERhdGUuc2V0RGF0ZShzdGFydERhdGUuZ2V0RGF0ZSgpIC0gMzY1KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBzdGFydERhdGUuc2V0RGF0ZShzdGFydERhdGUuZ2V0RGF0ZSgpIC0gNyk7XG4gICAgfVxuICAgIFxuICAgIC8vIEzhuqV5IHRo4buRbmcga8OqIHPhu5EgbMaw4bujbmcgxJHGoW4gaMOgbmcgdGhlbyB0cuG6oW5nIHRow6FpIGdpYW8gaMOgbmdcbiAgICBjb25zdCBjb21wbGV0ZWRDb3VudCA9IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHsgXG4gICAgICBzdGF0dXM6IHsgJGluOiBbJ2NvbXBsZXRlZCcsICdkZWxpdmVyZWQnXSB9LFxuICAgICAgY3JlYXRlZEF0OiB7ICRndGU6IHN0YXJ0RGF0ZSwgJGx0ZTogZW5kRGF0ZSB9ICBcbiAgICB9KTtcbiAgICBcbiAgICBjb25zdCBpblByb2dyZXNzQ291bnQgPSBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cyh7IFxuICAgICAgc3RhdHVzOiB7ICRpbjogWydzaGlwcGluZycsICdkZWxpdmVyaW5nJ10gfSxcbiAgICAgIGNyZWF0ZWRBdDogeyAkZ3RlOiBzdGFydERhdGUsICRsdGU6IGVuZERhdGUgfSAgXG4gICAgfSk7XG4gICAgXG4gICAgY29uc3QgZGVsYXllZENvdW50ID0gYXdhaXQgT3JkZXIuY291bnREb2N1bWVudHMoeyBcbiAgICAgIHN0YXR1czogJ2RlbGl2ZXJ5X2ZhaWxlZCcsXG4gICAgICBjcmVhdGVkQXQ6IHsgJGd0ZTogc3RhcnREYXRlLCAkbHRlOiBlbmREYXRlIH0gIFxuICAgIH0pO1xuICAgIFxuICAgIC8vIFTDrW5oIHThu5VuZyBz4buRIMSRxqFuIGjDoG5nIGxpw6puIHF1YW4gxJHhur9uIGdpYW8gaMOgbmdcbiAgICBjb25zdCB0b3RhbERlbGl2ZXJpZXMgPSBjb21wbGV0ZWRDb3VudCArIGluUHJvZ3Jlc3NDb3VudCArIGRlbGF5ZWRDb3VudDtcbiAgICBcbiAgICAvLyBUw61uaCB0aOG7nWkgZ2lhbiBnaWFvIGjDoG5nIHRydW5nIGLDrG5oXG4gICAgbGV0IGF2Z0RlbGl2ZXJ5VGltZSA9IFwiTi9BXCI7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIC8vIEzhuqV5IGPDoWMgxJHGoW4gaMOgbmcgxJHDoyBob8OgbiB0aMOgbmggY8OzIHRow7RuZyB0aW4gdHJhY2tpbmdcbiAgICAgIGNvbnN0IGNvbXBsZXRlZE9yZGVycyA9IGF3YWl0IE9yZGVyLmZpbmQoe1xuICAgICAgICBzdGF0dXM6IHsgJGluOiBbJ2NvbXBsZXRlZCcsICdkZWxpdmVyZWQnXSB9LFxuICAgICAgICBjcmVhdGVkQXQ6IHsgJGd0ZTogc3RhcnREYXRlLCAkbHRlOiBlbmREYXRlIH0sXG4gICAgICAgICd0cmFja2luZy50cmFja2luZ19sb2dzJzogeyAkZXhpc3RzOiB0cnVlLCAkbmU6IFtdIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBpZiAoY29tcGxldGVkT3JkZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGV0IHRvdGFsRGVsaXZlcnlIb3VycyA9IDA7XG4gICAgICAgIGxldCB2YWxpZE9yZGVyQ291bnQgPSAwO1xuICAgICAgICBcbiAgICAgICAgY29tcGxldGVkT3JkZXJzLmZvckVhY2gob3JkZXIgPT4ge1xuICAgICAgICAgIGlmIChvcmRlci50cmFja2luZyAmJiBBcnJheS5pc0FycmF5KG9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3MpICYmIG9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3MubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICAgIGNvbnN0IGxvZ3MgPSBbLi4ub3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9nc10uc29ydCgoYSwgYikgPT4gbmV3IERhdGUoYS50aW1lc3RhbXApIC0gbmV3IERhdGUoYi50aW1lc3RhbXApKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gVMOsbSBsb2cgxJHhuqd1IHRpw6puIHbDoCBsb2cgaG/DoG4gdGjDoG5oXG4gICAgICAgICAgICBjb25zdCBmaXJzdExvZyA9IGxvZ3NbMF07XG4gICAgICAgICAgICBjb25zdCBjb21wbGV0aW9uTG9nID0gbG9ncy5maW5kKGxvZyA9PiBcbiAgICAgICAgICAgICAgbG9nLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcgfHwgXG4gICAgICAgICAgICAgIGxvZy5zdGF0dXMgPT09ICdkZWxpdmVyZWQnIHx8XG4gICAgICAgICAgICAgIGxvZy5zdGF0dXNfbmFtZS5pbmNsdWRlcygnaG/DoG4gdGjDoG5oJykgfHxcbiAgICAgICAgICAgICAgbG9nLnN0YXR1c19uYW1lLmluY2x1ZGVzKCfEkcOjIGdpYW8nKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGZpcnN0TG9nICYmIGNvbXBsZXRpb25Mb2cpIHtcbiAgICAgICAgICAgICAgY29uc3Qgc3RhcnRUaW1lID0gbmV3IERhdGUoZmlyc3RMb2cudGltZXN0YW1wKTtcbiAgICAgICAgICAgICAgY29uc3QgZW5kVGltZSA9IG5ldyBEYXRlKGNvbXBsZXRpb25Mb2cudGltZXN0YW1wKTtcbiAgICAgICAgICAgICAgY29uc3QgZGVsaXZlcnlIb3VycyA9IChlbmRUaW1lIC0gc3RhcnRUaW1lKSAvICgxMDAwICogNjAgKiA2MCk7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICBpZiAoZGVsaXZlcnlIb3VycyA+IDAgJiYgZGVsaXZlcnlIb3VycyA8IDI0MCkgeyAvLyBMb+G6oWkgYuG7jyBnacOhIHRy4buLIGLhuqV0IHRoxrDhu51uZyAoPiAxMCBuZ8OgeSlcbiAgICAgICAgICAgICAgICB0b3RhbERlbGl2ZXJ5SG91cnMgKz0gZGVsaXZlcnlIb3VycztcbiAgICAgICAgICAgICAgICB2YWxpZE9yZGVyQ291bnQrKztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBpZiAodmFsaWRPcmRlckNvdW50ID4gMCkge1xuICAgICAgICAgIGF2Z0RlbGl2ZXJ5VGltZSA9IGAkeyh0b3RhbERlbGl2ZXJ5SG91cnMgLyB2YWxpZE9yZGVyQ291bnQpLnRvRml4ZWQoMSl9IGdp4budYDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdM4buXaSBraGkgdMOtbmggdGjhu51pIGdpYW4gZ2lhbyBow6BuZyB0cnVuZyBiw6xuaDonLCBlcnJvcik7XG4gICAgfVxuICAgIFxuICAgIC8vIFRo4buRbmcga8OqIMSRxqFuIGjDoG5nIHRoZW8gxJHhu5FpIHTDoWMgZ2lhbyBow6BuZyAobeG6t2MgxJHhu4tuaCBsw6AgR2lhbyBIw6BuZyBOaGFuaClcbiAgICBjb25zdCBkZWxpdmVyeVBhcnRuZXJzID0gW1xuICAgICAgeyBuYW1lOiAnR2lhbyBIw6BuZyBOaGFuaCcsIHZhbHVlOiBNYXRoLnJvdW5kKHRvdGFsRGVsaXZlcmllcyAqIDAuNzUpIH0sXG4gICAgICB7IG5hbWU6ICdWaWV0dGVsIFBvc3QnLCB2YWx1ZTogTWF0aC5yb3VuZCh0b3RhbERlbGl2ZXJpZXMgKiAwLjE1KSB9LFxuICAgICAgeyBuYW1lOiAnR3JhYicsIHZhbHVlOiBNYXRoLnJvdW5kKHRvdGFsRGVsaXZlcmllcyAqIDAuMDcpIH0sXG4gICAgICB7IG5hbWU6ICdLaMOhYycsIHZhbHVlOiBNYXRoLnJvdW5kKHRvdGFsRGVsaXZlcmllcyAqIDAuMDMpIH1cbiAgICBdO1xuICAgIFxuICAgIC8vIEThu68gbGnhu4d1IHRo4budaSBnaWFuIGdpYW8gaMOgbmcgdGhlbyBraHUgduG7sWNcbiAgICBjb25zdCBkZWxpdmVyeVRpbWVCeVJlZ2lvbiA9IFtcbiAgICAgIHsgcmVnaW9uOiAnVHAuSENNJywgdGltZTogMTIgfSxcbiAgICAgIHsgcmVnaW9uOiAnSMOgIE7hu5lpJywgdGltZTogMjQgfSxcbiAgICAgIHsgcmVnaW9uOiAnxJDDoCBO4bq1bmcnLCB0aW1lOiAzNiB9LFxuICAgICAgeyByZWdpb246ICdD4bqnbiBUaMahJywgdGltZTogNDggfSxcbiAgICAgIHsgcmVnaW9uOiAnVOG7iW5oIGtow6FjJywgdGltZTogNzIgfVxuICAgIF07XG4gICAgXG4gICAgLy8gTOG6pXkgZGFuaCBzw6FjaCDEkcahbiBow6BuZyBn4bqnbiDEkcOieSDEkeG7gyBoaeG7g24gdGjhu4tcbiAgICBjb25zdCByZWNlbnRPcmRlcnMgPSBhd2FpdCBPcmRlci5maW5kKHtcbiAgICAgIHN0YXR1czogeyAkbmluOiBbJ2NhbmNlbGxlZCcsICdmYWlsZWQnLCAnYXdhaXRpbmdfcGF5bWVudCddIH0sXG4gICAgICBjcmVhdGVkQXQ6IHsgJGd0ZTogc3RhcnREYXRlLCAkbHRlOiBlbmREYXRlIH1cbiAgICB9KVxuICAgIC5wb3B1bGF0ZShcInVzZXJJZFwiLCBcImZpcnN0TmFtZSBsYXN0TmFtZSBlbWFpbFwiKVxuICAgIC5zb3J0KHsgY3JlYXRlZEF0OiAtMSB9KVxuICAgIC5saW1pdCgxMCk7XG4gICAgXG4gICAgLy8gQ2h1eeG7g24gxJHhu5VpIMSRxqFuIGjDoG5nIHRow6BuaCDEkeG7i25oIGThuqFuZyBoaeG7g24gdGjhu4sgY2hvIGdpYW8gaMOgbmdcbiAgICBjb25zdCBkZWxpdmVyaWVzID0gcmVjZW50T3JkZXJzLm1hcChvcmRlciA9PiB7XG4gICAgICAvLyBYw6FjIMSR4buLbmggdHLhuqFuZyB0aMOhaSBnaWFvIGjDoG5nXG4gICAgICBsZXQgc3RhdHVzID0gJ8SQYW5nIHjhu60gbMO9JztcbiAgICAgIGlmIChvcmRlci5zdGF0dXMgPT09ICdjb21wbGV0ZWQnIHx8IG9yZGVyLnN0YXR1cyA9PT0gJ2RlbGl2ZXJlZCcpIHtcbiAgICAgICAgc3RhdHVzID0gJ0hvw6BuIHRow6BuaCc7XG4gICAgICB9IGVsc2UgaWYgKG9yZGVyLnN0YXR1cyA9PT0gJ3NoaXBwaW5nJyB8fCBvcmRlci5zdGF0dXMgPT09ICdkZWxpdmVyaW5nJykge1xuICAgICAgICBzdGF0dXMgPSAnxJBhbmcgZ2lhbyc7XG4gICAgICB9IGVsc2UgaWYgKG9yZGVyLnN0YXR1cyA9PT0gJ2RlbGl2ZXJ5X2ZhaWxlZCcpIHtcbiAgICAgICAgc3RhdHVzID0gJ1Ro4bqldCBi4bqhaSc7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIMSQ4buLbmggZOG6oW5nIHTDqm4ga2jDoWNoIGjDoG5nXG4gICAgICBsZXQgY3VzdG9tZXJOYW1lID0gJ0tow6FjaCBow6BuZyc7XG4gICAgICBpZiAob3JkZXIudXNlcklkKSB7XG4gICAgICAgIGlmIChvcmRlci51c2VySWQuZmlyc3ROYW1lIHx8IG9yZGVyLnVzZXJJZC5sYXN0TmFtZSkge1xuICAgICAgICAgIGN1c3RvbWVyTmFtZSA9IGAke29yZGVyLnVzZXJJZC5maXJzdE5hbWUgfHwgJyd9ICR7b3JkZXIudXNlcklkLmxhc3ROYW1lIHx8ICcnfWAudHJpbSgpO1xuICAgICAgICB9IGVsc2UgaWYgKG9yZGVyLnVzZXJJZC5lbWFpbCkge1xuICAgICAgICAgIGN1c3RvbWVyTmFtZSA9IG9yZGVyLnVzZXJJZC5lbWFpbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBYw6FjIMSR4buLbmggxJHhu5FpIHTDoWMgZ2lhbyBow6BuZyAobeG6t2MgxJHhu4tuaCBsw6AgR0hOKVxuICAgICAgY29uc3QgcGFydG5lciA9IG9yZGVyLnNoaXBwaW5nUGFydG5lciB8fCAnR2lhbyBIw6BuZyBOaGFuaCc7XG4gICAgICBcbiAgICAgIC8vIMSQ4buLbmggZOG6oW5nIMSR4buLYSBjaOG7iVxuICAgICAgY29uc3QgYWRkcmVzcyA9IChvcmRlci5zaGlwcGluZ0luZm8gJiYgb3JkZXIuc2hpcHBpbmdJbmZvLmFkZHJlc3MpIHx8IFxuICAgICAgICAgICAgICAgICAgICAgIG9yZGVyLmFkZHJlc3MgfHwgXG4gICAgICAgICAgICAgICAgICAgICAgKG9yZGVyLnVzZXJJZCAmJiBvcmRlci51c2VySWQuYWRkcmVzcykgfHwgXG4gICAgICAgICAgICAgICAgICAgICAgJ0tow7RuZyBjw7MgdGjDtG5nIHRpbic7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG9yZGVySWQ6IG9yZGVyLm9yZGVyQ29kZSB8fCBvcmRlci5faWQsXG4gICAgICAgIGN1c3RvbWVyTmFtZSxcbiAgICAgICAgYWRkcmVzcyxcbiAgICAgICAgcGFydG5lcixcbiAgICAgICAgZGVsaXZlcnlUaW1lOiBvcmRlci5jcmVhdGVkQXQgPyBuZXcgRGF0ZShvcmRlci5jcmVhdGVkQXQpLnRvTG9jYWxlRGF0ZVN0cmluZygndmktVk4nKSA6ICdOL0EnLFxuICAgICAgICBzdGF0dXNcbiAgICAgIH07XG4gICAgfSk7XG4gICAgXG4gICAgLy8gVHLhuqMgduG7gSBk4buvIGxp4buHdSB0aOG7kW5nIGvDqlxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgIHN0YXRpc3RpY3M6IHtcbiAgICAgICAgY29tcGxldGVkOiBjb21wbGV0ZWRDb3VudCxcbiAgICAgICAgaW5Qcm9ncmVzczogaW5Qcm9ncmVzc0NvdW50LFxuICAgICAgICBkZWxheWVkOiBkZWxheWVkQ291bnQsXG4gICAgICAgIHRvdGFsOiB0b3RhbERlbGl2ZXJpZXMsXG4gICAgICAgIGF2Z0RlbGl2ZXJ5VGltZVxuICAgICAgfSxcbiAgICAgIGRlbGl2ZXJ5UGFydG5lcnMsXG4gICAgICBkZWxpdmVyeVRpbWVCeVJlZ2lvbixcbiAgICAgIGRlbGl2ZXJpZXNcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdM4buXaSBraGkgbOG6pXkgdGjhu5FuZyBrw6ogZ2lhbyBow6BuZzonLCBlcnJvcik7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgIG1lc3NhZ2U6ICdM4buXaSBraGkgbOG6pXkgdGjhu5FuZyBrw6ogZ2lhbyBow6BuZycsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSBcbiAgICB9KTtcbiAgfVxufTsgIl0sIm1hcHBpbmdzIjoiO0FBQ0EsSUFBQUEsTUFBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsU0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsTUFBQSxHQUFBSCxzQkFBQSxD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