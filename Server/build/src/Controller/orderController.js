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
    } else {var _populatedOrder$userI;
      console.log("Missing email information for order confirmation:", {
        hasOrder: !!populatedOrder,
        hasUserId: !!(populatedOrder && populatedOrder.userId),
        hasEmail: !!(populatedOrder && populatedOrder.userId && populatedOrder.userId.email),
        email: populatedOrder === null || populatedOrder === void 0 ? void 0 : (_populatedOrder$userI = populatedOrder.userId) === null || _populatedOrder$userI === void 0 ? void 0 : _populatedOrder$userI.email
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfT3JkZXIiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9Qcm9kdWN0cyIsIl9heGlvcyIsIl9kb3RlbnYiLCJfZW1haWxTZXJ2aWNlIiwiX0Jlc3RTZWxsaW5nUHJvZHVjdCIsIl9ub3RpZmljYXRpb25TZXJ2aWNlIiwiZSIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwiZG90ZW52IiwiY29uZmlnIiwiZ2VuZXJhdGVPcmRlckNvZGUiLCJjaGFyYWN0ZXJzIiwicmVzdWx0IiwiaSIsImNoYXJBdCIsIk1hdGgiLCJmbG9vciIsInJhbmRvbSIsImxlbmd0aCIsInVwZGF0ZVByb2R1Y3RTdG9jayIsInByb2R1Y3RzIiwiaW5jcmVhc2UiLCJ1cGRhdGVTb2xkQ291bnQiLCJpdGVtIiwicHJvZHVjdCIsIlByb2R1Y3QiLCJmaW5kQnlJZCIsInByb2R1Y3RJZCIsIm5ld1N0b2NrIiwicHJvZHVjdFN0b2NrIiwicXVhbnRpdHkiLCJtYXgiLCJwcm9kdWN0U3RhdHVzIiwic29sZENvdW50Iiwic2F2ZSIsImVycm9yIiwiY29uc29sZSIsIm9yZGVyQ3JlYXRlIiwicmVxIiwicmVzIiwidXNlcklkIiwidG90YWxBbW91bnQiLCJwYXltZW50TWV0aG9kIiwiY291cG9uIiwiYm9keSIsIkFycmF5IiwiaXNBcnJheSIsInN0YXR1cyIsImpzb24iLCJzdWNjZXNzIiwicHJvZHVjdE5hbWUiLCJvcmRlciIsIk9yZGVyIiwiY3JlYXRlZEF0IiwiRGF0ZSIsIm9yZGVyQ29kZSIsInBvcHVsYXRlZE9yZGVyIiwiX2lkIiwicG9wdWxhdGUiLCJlbWFpbCIsInNoaXBwaW5nSW5mbyIsImZ1bGxOYW1lIiwiZmlyc3ROYW1lIiwibGFzdE5hbWUiLCJ0cmltIiwiYWRkcmVzcyIsInBob25lIiwibG9nIiwiZW1haWxTZW50Iiwic2VuZE9yZGVyQ29uZmlybWF0aW9uRW1haWwiLCJlbWFpbEVycm9yIiwiX3BvcHVsYXRlZE9yZGVyJHVzZXJJIiwiaGFzT3JkZXIiLCJoYXNVc2VySWQiLCJoYXNFbWFpbCIsImVyciIsIm1lc3NhZ2UiLCJleHBvcnRzIiwib3JkZXJHZXQiLCJxdWVyeSIsInVzZXIiLCJ1bmRlZmluZWQiLCJvcmRlcnMiLCJmaW5kIiwic29ydCIsIm9yZGVyR2V0QWxsIiwib3JkZXJHZXRCeUlkIiwicGFyYW1zIiwiaWQiLCJ1cGRhdGVPcmRlciIsIm9yZGVySWQiLCJ1cGRhdGVEYXRhIiwiSlNPTiIsInN0cmluZ2lmeSIsInByZXZpb3VzU3RhdHVzIiwibmV3U3RhdHVzIiwiYWxsb3dlZEZpZWxkcyIsImZpbHRlcmVkRGF0YSIsImtleSIsIk9iamVjdCIsImtleXMiLCJpbmNsdWRlcyIsInRyYWNraW5nIiwic3RhdHVzX25hbWUiLCJ0cmFja2luZ19sb2dzIiwic3RhdHVzTmFtZSIsIm5ld1RyYWNraW5nTG9nIiwidGltZXN0YW1wIiwidG9JU09TdHJpbmciLCJsb2NhdGlvbiIsInVuc2hpZnQiLCJpc1BhaWQiLCJjb21wbGV0ZWRBdCIsIkJlc3RTZWxsaW5nUHJvZHVjdCIsInVwZGF0ZVNhbGVzRGF0YSIsImJlc3RTZWxsZXJFcnJvciIsInVwZGF0ZWRPcmRlciIsImZpbmRCeUlkQW5kVXBkYXRlIiwiJHNldCIsIm5ldyIsInVzZXJOYW1lIiwic2VuZE9yZGVyU2hpcHBpbmdFbWFpbCIsInN0YWNrIiwic2VuZE9yZGVyU3RhdHVzTm90aWZpY2F0aW9uIiwiZ2V0U3RhdHVzVGV4dCIsIm5vdGlmaWNhdGlvbkVycm9yIiwiZGF0YSIsIm9yZGVyVXBkYXRlIiwiY3VycmVudE9yZGVyIiwibWFya09yZGVyQXNQYWlkIiwid2FzUGFpZCIsIm9yZGVyRGVsZXRlIiwiZmluZEJ5SWRBbmREZWxldGUiLCJjYW5jZWxPcmRlciIsImdldE9yZGVyVHJhY2tpbmciLCJmaW5kT25lIiwiZXN0aW1hdGVkX2RlbGl2ZXJ5X3RpbWUiLCJlc3RpbWF0ZWREZWxpdmVyeSIsInNldERhdGUiLCJnZXREYXRlIiwib3JkZXJfY29kZSIsImN1cnJlbnRfbG9jYXRpb24iLCJkZWxpdmVyeV9ub3RlIiwibm90ZXMiLCJpc01vY2tlZCIsIlNIT1BfSUQiLCJwcm9jZXNzIiwiZW52IiwiU0hPUF9UT0tFTl9BUEkiLCJVU0VfTU9DS19PTl9FUlJPUiIsIm1vY2tEYXRhIiwiZ2VuZXJhdGVNb2NrVHJhY2tpbmdEYXRhRnJvbU9yZGVyIiwic3Vic3RyaW5nIiwicmVzcG9uc2UiLCJheGlvcyIsInBvc3QiLCJoZWFkZXJzIiwiY29kZSIsImFwaUVycm9yIiwiZGJFcnJvciIsImdlbmVyYXRlTW9ja1RyYWNraW5nRGF0YSIsIm5vdyIsInRyYWNraW5nTG9ncyIsInRpbWVEYXkyIiwic2V0SG91cnMiLCJnZXRIb3VycyIsInRpbWVUb2RheTEiLCJ0aW1lVG9kYXkyIiwidGltZUxhdGVzdCIsInNldE1pbnV0ZXMiLCJnZXRNaW51dGVzIiwidXBkYXRlT3JkZXJQYXltZW50U3RhdHVzIiwicGF5bWVudFN0YXR1cyIsIm9sZFBheW1lbnRTdGF0dXMiLCJvbGRJc1BhaWQiLCJub3RpZnlPcmRlclN1Y2Nlc3MiLCJ1c2VyRW1haWwiLCJ1cGRhdGVFcnJvciIsImdldFRvcE9yZGVycyIsImxpbWl0IiwicGFyc2VJbnQiLCJ0b3BPcmRlcnMiLCJmb3JtYXR0ZWRPcmRlcnMiLCJtYXAiLCJjdXN0b21lck5hbWUiLCJvcmRlckRhdGUiLCJmb3JtYXR0ZWREYXRlIiwiZ2V0TW9udGgiLCJnZXRGdWxsWWVhciIsInN0YXR1c1RleHQiLCJjdXN0b21lciIsInRvdGFsIiwiZGF0ZSIsImdldE9yZGVyU3RhdHMiLCJwZXJpb2QiLCJzdGFydERhdGUiLCJlbmREYXRlIiwicGVuZGluZ0NvdW50IiwiY291bnREb2N1bWVudHMiLCIkaW4iLCIkZ3RlIiwiJGx0ZSIsInNoaXBwaW5nQ291bnQiLCJjb21wbGV0ZWRDb3VudCIsImNhbmNlbGxlZENvdW50IiwidG90YWxPcmRlcnMiLCJvcmRlclN0YXR1cyIsIm5hbWUiLCJ2YWx1ZSIsInByb2Nlc3NpbmdUaW1lIiwiY29tcGxldGVkT3JkZXJzIiwiJGV4aXN0cyIsInRvdGFsUHJvY2Vzc2luZ1RpbWUiLCJ0b3RhbFNoaXBwaW5nVGltZSIsInRvdGFsVG90YWxUaW1lIiwiZm9yRWFjaCIsImxvZ3MiLCJhIiwiYiIsInBhY2thZ2luZ0xvZyIsInBhY2thZ2luZ1RpbWUiLCJzaGlwcGluZ0xvZyIsImRlbGl2ZXJlZExvZyIsImRlbGl2ZXJ5VGltZSIsInRvdGFsVGltZSIsImF2Z1Byb2Nlc3NpbmdUaW1lIiwicm91bmQiLCJhdmdTaGlwcGluZ1RpbWUiLCJhdmdUb3RhbFRpbWUiLCJ0aW1lIiwiZm9ybWF0dGVkVG9wT3JkZXJzIiwicGVuZGluZ09yZGVycyIsImNhbmNlbGxlZE9yZGVycyIsImdldERlbGl2ZXJ5U3RhdHMiLCJpblByb2dyZXNzQ291bnQiLCJkZWxheWVkQ291bnQiLCJ0b3RhbERlbGl2ZXJpZXMiLCJhdmdEZWxpdmVyeVRpbWUiLCIkbmUiLCJ0b3RhbERlbGl2ZXJ5SG91cnMiLCJ2YWxpZE9yZGVyQ291bnQiLCJmaXJzdExvZyIsImNvbXBsZXRpb25Mb2ciLCJzdGFydFRpbWUiLCJlbmRUaW1lIiwiZGVsaXZlcnlIb3VycyIsInRvRml4ZWQiLCJkZWxpdmVyeVBhcnRuZXJzIiwiZGVsaXZlcnlUaW1lQnlSZWdpb24iLCJyZWdpb24iLCJyZWNlbnRPcmRlcnMiLCIkbmluIiwiZGVsaXZlcmllcyIsInBhcnRuZXIiLCJzaGlwcGluZ1BhcnRuZXIiLCJ0b0xvY2FsZURhdGVTdHJpbmciLCJzdGF0aXN0aWNzIiwiY29tcGxldGVkIiwiaW5Qcm9ncmVzcyIsImRlbGF5ZWQiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvQ29udHJvbGxlci9vcmRlckNvbnRyb2xsZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cbmltcG9ydCBPcmRlciBmcm9tIFwiLi4vTW9kZWwvT3JkZXIuanNcIjtcbmltcG9ydCBQcm9kdWN0IGZyb20gXCIuLi9Nb2RlbC9Qcm9kdWN0cy5qc1wiO1xuaW1wb3J0IGF4aW9zIGZyb20gXCJheGlvc1wiO1xuaW1wb3J0IGRvdGVudiBmcm9tIFwiZG90ZW52XCI7XG5pbXBvcnQgeyBzZW5kT3JkZXJDb25maXJtYXRpb25FbWFpbCwgc2VuZE9yZGVyU2hpcHBpbmdFbWFpbCB9IGZyb20gXCIuLi91dGlscy9lbWFpbFNlcnZpY2UuanNcIjtcbmltcG9ydCBCZXN0U2VsbGluZ1Byb2R1Y3QgZnJvbSBcIi4uL01vZGVsL0Jlc3RTZWxsaW5nUHJvZHVjdC5qc1wiO1xuaW1wb3J0IHsgc2VuZE9yZGVyU3RhdHVzTm90aWZpY2F0aW9uIH0gZnJvbSBcIi4uL1NlcnZpY2VzL25vdGlmaWNhdGlvblNlcnZpY2UuanNcIjtcblxuZG90ZW52LmNvbmZpZygpO1xuXG4vLyBIw6BtIHThuqFvIG3DoyB24bqtbiDEkcahbiBuZ+G6q3Ugbmhpw6puXG5mdW5jdGlvbiBnZW5lcmF0ZU9yZGVyQ29kZSgpIHtcbiAgY29uc3QgY2hhcmFjdGVycyA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWjAxMjM0NTY3ODknO1xuICBsZXQgcmVzdWx0ID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgIHJlc3VsdCArPSBjaGFyYWN0ZXJzLmNoYXJBdChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGFyYWN0ZXJzLmxlbmd0aCkpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIEjDoG0gY+G6rXAgbmjhuq10IHPhu5EgbMaw4bujbmcgdOG7k24ga2hvIHPhuqNuIHBo4bqpbVxuYXN5bmMgZnVuY3Rpb24gdXBkYXRlUHJvZHVjdFN0b2NrKHByb2R1Y3RzLCBpbmNyZWFzZSA9IGZhbHNlLCB1cGRhdGVTb2xkQ291bnQgPSBmYWxzZSkge1xuICB0cnkge1xuICAgIGZvciAoY29uc3QgaXRlbSBvZiBwcm9kdWN0cykge1xuICAgICAgY29uc3QgcHJvZHVjdCA9IGF3YWl0IFByb2R1Y3QuZmluZEJ5SWQoaXRlbS5wcm9kdWN0SWQpO1xuICAgICAgaWYgKHByb2R1Y3QpIHtcbiAgICAgICAgLy8gVMSDbmcgaG/hurdjIGdp4bqjbSBz4buRIGzGsOG7o25nIHThu5NuIGtobyBk4buxYSB2w6BvIHRoYW0gc+G7kSBpbmNyZWFzZVxuICAgICAgICBjb25zdCBuZXdTdG9jayA9IGluY3JlYXNlIFxuICAgICAgICAgID8gcHJvZHVjdC5wcm9kdWN0U3RvY2sgKyBpdGVtLnF1YW50aXR5IFxuICAgICAgICAgIDogcHJvZHVjdC5wcm9kdWN0U3RvY2sgLSBpdGVtLnF1YW50aXR5O1xuICAgICAgICBcbiAgICAgICAgLy8gQ+G6rXAgbmjhuq10IHPhu5EgbMaw4bujbmcgdOG7k24ga2hvIHbDoCB0cuG6oW5nIHRow6FpIHPhuqNuIHBo4bqpbVxuICAgICAgICBwcm9kdWN0LnByb2R1Y3RTdG9jayA9IE1hdGgubWF4KDAsIG5ld1N0b2NrKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEPhuq1wIG5o4bqtdCB0cuG6oW5nIHRow6FpIG7hur91IGjhur90IGjDoG5nXG4gICAgICAgIGlmIChwcm9kdWN0LnByb2R1Y3RTdG9jayA9PT0gMCkge1xuICAgICAgICAgIHByb2R1Y3QucHJvZHVjdFN0YXR1cyA9IFwiSOG6v3QgaMOgbmdcIjtcbiAgICAgICAgfSBlbHNlIGlmIChwcm9kdWN0LnByb2R1Y3RTdGF0dXMgPT09IFwiSOG6v3QgaMOgbmdcIikge1xuICAgICAgICAgIHByb2R1Y3QucHJvZHVjdFN0YXR1cyA9IFwiQ8OybiBow6BuZ1wiO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ+G6rXAgbmjhuq10IHPhu5EgbMaw4bujbmcgYsOhbiByYSBu4bq/dSBj4bqnblxuICAgICAgICBpZiAodXBkYXRlU29sZENvdW50ICYmICFpbmNyZWFzZSkge1xuICAgICAgICAgIHByb2R1Y3Quc29sZENvdW50ID0gKHByb2R1Y3Quc29sZENvdW50IHx8IDApICsgaXRlbS5xdWFudGl0eTtcbiAgICAgICAgfSBlbHNlIGlmICh1cGRhdGVTb2xkQ291bnQgJiYgaW5jcmVhc2UpIHtcbiAgICAgICAgICAvLyBUcuG7qyBzb2xkQ291bnQga2hpIGjhu6d5IMSRxqFuIGjDoG5nIMSRw6MgdGhhbmggdG/DoW5cbiAgICAgICAgICBwcm9kdWN0LnNvbGRDb3VudCA9IE1hdGgubWF4KDAsIChwcm9kdWN0LnNvbGRDb3VudCB8fCAwKSAtIGl0ZW0ucXVhbnRpdHkpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBhd2FpdCBwcm9kdWN0LnNhdmUoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSBj4bqtcCBuaOG6rXQgdGjDtG5nIHRpbiBz4bqjbiBwaOG6qW06XCIsIGVycm9yKTtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufVxuXG5leHBvcnQgY29uc3Qgb3JkZXJDcmVhdGUgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICAvLyBWYWxpZGF0ZSByZXF1aXJlZCBmaWVsZHNcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICBjb25zdCB7IHVzZXJJZCwgcHJvZHVjdHMsIHRvdGFsQW1vdW50LCBwYXltZW50TWV0aG9kLCBjb3Vwb24gfSA9IHJlcS5ib2R5O1xuICAgIGlmICghdXNlcklkIHx8ICFwcm9kdWN0cyB8fCAhQXJyYXkuaXNBcnJheShwcm9kdWN0cykgfHwgcHJvZHVjdHMubGVuZ3RoID09PSAwIHx8ICF0b3RhbEFtb3VudCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogXCJNaXNzaW5nIHJlcXVpcmVkIGZpZWxkczogdXNlcklkLCBwcm9kdWN0cyAobm9uLWVtcHR5IGFycmF5KSwgdG90YWxBbW91bnRcIiBcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyBLaeG7g20gdHJhIHPhu5EgbMaw4bujbmcgdOG7k24ga2hvIHRyxrDhu5tjIGtoaSB04bqhbyDEkcahbiBow6BuZ1xuICAgIGZvciAoY29uc3QgaXRlbSBvZiBwcm9kdWN0cykge1xuICAgICAgY29uc3QgcHJvZHVjdCA9IGF3YWl0IFByb2R1Y3QuZmluZEJ5SWQoaXRlbS5wcm9kdWN0SWQpO1xuICAgICAgaWYgKCFwcm9kdWN0KSB7XG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IGBT4bqjbiBwaOG6qW0gduG7m2kgSUQgJHtpdGVtLnByb2R1Y3RJZH0ga2jDtG5nIHThu5NuIHThuqFpYFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgaWYgKHByb2R1Y3QucHJvZHVjdFN0b2NrIDwgaXRlbS5xdWFudGl0eSkge1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBgU+G6o24gcGjhuqltIFwiJHtwcm9kdWN0LnByb2R1Y3ROYW1lfVwiIGNo4buJIGPDsm4gJHtwcm9kdWN0LnByb2R1Y3RTdG9ja30gc+G6o24gcGjhuqltIHRyb25nIGtob2BcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIENyZWF0ZSB0aGUgb3JkZXIgd2l0aCBhbGwgZmllbGRzIGZyb20gcmVxdWVzdCBib2R5XG4gICAgY29uc3Qgb3JkZXIgPSBuZXcgT3JkZXIocmVxLmJvZHkpO1xuICAgIFxuICAgIC8vIFNldCBkZWZhdWx0IHZhbHVlcyBpZiBub3QgcHJvdmlkZWRcbiAgICBpZiAoIW9yZGVyLnN0YXR1cykge1xuICAgICAgb3JkZXIuc3RhdHVzID0gcGF5bWVudE1ldGhvZCA9PT0gXCJjb2RcIiA/IFwicGVuZGluZ1wiIDogXCJhd2FpdGluZ19wYXltZW50XCI7XG4gICAgfVxuICAgIGlmICghb3JkZXIuY3JlYXRlZEF0KSB7XG4gICAgICBvcmRlci5jcmVhdGVkQXQgPSBuZXcgRGF0ZSgpO1xuICAgIH1cbiAgICBcbiAgICAvLyBU4bqhbyBtw6MgduG6rW4gxJHGoW4gbmfhuqt1IG5oacOqblxuICAgIGlmICghb3JkZXIub3JkZXJDb2RlKSB7XG4gICAgICBvcmRlci5vcmRlckNvZGUgPSBnZW5lcmF0ZU9yZGVyQ29kZSgpO1xuICAgIH1cbiAgICBcbiAgICAvLyBTYXZlIHRoZSBvcmRlclxuICAgIGF3YWl0IG9yZGVyLnNhdmUoKTtcbiAgICBcbiAgICAvLyDEkOG7kWkgduG7m2kgY8OhYyBwaMawxqFuZyB0aOG7qWMgdGhhbmggdG/DoW4gdHLhu7FjIHR1eeG6v24gKGtow7RuZyBwaOG6o2kgQ09EKSwgZ2nhuqNtIHPhu5EgbMaw4bujbmcgc+G6o24gcGjhuqltIG5nYXlcbiAgICBpZiAocGF5bWVudE1ldGhvZCAhPT0gXCJjb2RcIikge1xuICAgICAgLy8gR2nhuqNtIHPhu5EgbMaw4bujbmcgdOG7k24ga2hvLCBuaMawbmcgY2jGsGEgY+G6rXAgbmjhuq10IHNvbGRDb3VudFxuICAgICAgYXdhaXQgdXBkYXRlUHJvZHVjdFN0b2NrKHByb2R1Y3RzLCBmYWxzZSwgZmFsc2UpO1xuICAgIH1cbiAgICBcbiAgICAvLyBM4bqleSDEkcahbiBow6BuZyB24bubaSB0aMO0bmcgdGluIMSR4bqneSDEkeG7pyBiYW8gZ+G7k20gdGjDtG5nIHRpbiBz4bqjbiBwaOG6qW0gxJHhu4MgZ+G7rWkgZW1haWxcbiAgICBjb25zdCBwb3B1bGF0ZWRPcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRCeUlkKG9yZGVyLl9pZClcbiAgICAgIC5wb3B1bGF0ZSgndXNlcklkJylcbiAgICAgIC5wb3B1bGF0ZSgncHJvZHVjdHMucHJvZHVjdElkJyk7XG4gICAgICBcbiAgICAvLyBH4butaSBlbWFpbCB4w6FjIG5o4bqtbiBu4bq/dSDEkcahbiBow6BuZyDEkcOjIMSRxrDhu6NjIHThuqFvIHRow6BuaCBjw7RuZ1xuICAgIGlmIChwb3B1bGF0ZWRPcmRlciAmJiBwb3B1bGF0ZWRPcmRlci51c2VySWQgJiYgcG9wdWxhdGVkT3JkZXIudXNlcklkLmVtYWlsKSB7XG4gICAgICB0cnkge1xuICAgICAgICAvLyBDaHXhuqluIGLhu4sgdGjDtG5nIHRpbiBnaWFvIGjDoG5nIGNobyBlbWFpbFxuICAgICAgICBjb25zdCBzaGlwcGluZ0luZm8gPSB7XG4gICAgICAgICAgZnVsbE5hbWU6IGAke3BvcHVsYXRlZE9yZGVyLnVzZXJJZC5maXJzdE5hbWUgfHwgJyd9ICR7cG9wdWxhdGVkT3JkZXIudXNlcklkLmxhc3ROYW1lIHx8ICcnfWAudHJpbSgpLFxuICAgICAgICAgIGFkZHJlc3M6IHBvcHVsYXRlZE9yZGVyLmFkZHJlc3MgfHwgcG9wdWxhdGVkT3JkZXIudXNlcklkLmFkZHJlc3MgfHwgJycsXG4gICAgICAgICAgcGhvbmU6IHBvcHVsYXRlZE9yZGVyLnVzZXJJZC5waG9uZSB8fCAnJyxcbiAgICAgICAgICBlbWFpbDogcG9wdWxhdGVkT3JkZXIudXNlcklkLmVtYWlsIHx8ICcnXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvLyBUaMOqbSB0aMO0bmcgdGluIGdpYW8gaMOgbmcgdsOgbyDEkcahbiBow6BuZyDEkeG7gyBn4butaSBlbWFpbFxuICAgICAgICBwb3B1bGF0ZWRPcmRlci5zaGlwcGluZ0luZm8gPSBzaGlwcGluZ0luZm87XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIlNlbmRpbmcgY29uZmlybWF0aW9uIGVtYWlsIHRvOlwiLCBwb3B1bGF0ZWRPcmRlci51c2VySWQuZW1haWwpO1xuICAgICAgICBjb25zdCBlbWFpbFNlbnQgPSBhd2FpdCBzZW5kT3JkZXJDb25maXJtYXRpb25FbWFpbChwb3B1bGF0ZWRPcmRlcik7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRW1haWwgc2VudCBzdGF0dXM6XCIsIGVtYWlsU2VudCA/IFwiU3VjY2Vzc1wiIDogXCJGYWlsZWRcIik7XG4gICAgICB9IGNhdGNoIChlbWFpbEVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBzZW5kaW5nIGNvbmZpcm1hdGlvbiBlbWFpbDpcIiwgZW1haWxFcnJvcik7XG4gICAgICAgIC8vIEtow7RuZyB0aHJvdyBlcnJvciBu4bq/dSBn4butaSBlbWFpbCB0aOG6pXQgYuG6oWkgxJHhu4Mga2jDtG5nIOG6o25oIGjGsOG7n25nIMSR4bq/biBsdeG7k25nIMSR4bq3dCBow6BuZ1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZyhcIk1pc3NpbmcgZW1haWwgaW5mb3JtYXRpb24gZm9yIG9yZGVyIGNvbmZpcm1hdGlvbjpcIiwge1xuICAgICAgICBoYXNPcmRlcjogISFwb3B1bGF0ZWRPcmRlcixcbiAgICAgICAgaGFzVXNlcklkOiAhIShwb3B1bGF0ZWRPcmRlciAmJiBwb3B1bGF0ZWRPcmRlci51c2VySWQpLFxuICAgICAgICBoYXNFbWFpbDogISEocG9wdWxhdGVkT3JkZXIgJiYgcG9wdWxhdGVkT3JkZXIudXNlcklkICYmIHBvcHVsYXRlZE9yZGVyLnVzZXJJZC5lbWFpbCksXG4gICAgICAgIGVtYWlsOiBwb3B1bGF0ZWRPcmRlcj8udXNlcklkPy5lbWFpbFxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMSkuanNvbihvcmRlcik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBjcmVhdGluZyBvcmRlcjpcIiwgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3I6IGVyci5tZXNzYWdlIHx8IFwiTOG7l2kga2hpIHThuqFvIMSRxqFuIGjDoG5nXCJcbiAgICB9KTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IG9yZGVyR2V0ID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgdXNlcklkID0gcmVxLnF1ZXJ5LnVzZXJJZCB8fCAocmVxLnVzZXIgJiYgcmVxLnVzZXIuX2lkID8gcmVxLnVzZXIuX2lkIDogdW5kZWZpbmVkKTtcbiAgICBcbiAgICAvLyBT4butIGThu6VuZyB1c2VySWQgbuG6v3UgY8OzLCBu4bq/dSBraMO0bmcgdHLhuqMgduG7gSB04bqldCBj4bqjIMSRxqFuIGjDoG5nXG4gICAgY29uc3QgcXVlcnkgPSB1c2VySWQgPyB7IHVzZXJJZCB9IDoge307XG4gICAgXG4gICAgY29uc3Qgb3JkZXJzID0gYXdhaXQgT3JkZXIuZmluZChxdWVyeSlcbiAgICAgIC5wb3B1bGF0ZSgndXNlcklkJylcbiAgICAgIC5wb3B1bGF0ZSgncHJvZHVjdHMucHJvZHVjdElkJylcbiAgICAgIC5zb3J0KHsgY3JlYXRlZEF0OiAtMSB9KTtcbiAgICBcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbihvcmRlcnMpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IFxuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBlcnJvcjogZXJyLm1lc3NhZ2UgXG4gICAgfSk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBvcmRlckdldEFsbCA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IG9yZGVycyA9IGF3YWl0IE9yZGVyLmZpbmQoKVxuICAgICAgLnBvcHVsYXRlKFwidXNlcklkXCIpXG4gICAgICAucG9wdWxhdGUoJ3Byb2R1Y3RzLnByb2R1Y3RJZCcpXG4gICAgICAuc29ydCh7IGNyZWF0ZWRBdDogLTEgfSk7XG4gICAgXG4gICAgcmVzLmpzb24ob3JkZXJzKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBvcmRlckdldEJ5SWQgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBvcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRCeUlkKHJlcS5wYXJhbXMuaWQpXG4gICAgICAucG9wdWxhdGUoXCJ1c2VySWRcIilcbiAgICAgIC5wb3B1bGF0ZSgncHJvZHVjdHMucHJvZHVjdElkJyk7XG4gICAgXG4gICAgaWYgKCFvcmRlcikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgxJHGoW4gaMOgbmdcIiB9KTtcbiAgICB9XG4gICAgXG4gICAgcmVzLmpzb24ob3JkZXIpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgfVxufTtcblxuLy8gSMOgbSBj4bqtcCBuaOG6rXQgdGjDtG5nIHRpbiDEkcahbiBow6BuZ1xuZXhwb3J0IGNvbnN0IHVwZGF0ZU9yZGVyID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3Qgb3JkZXJJZCA9IHJlcS5wYXJhbXMuaWQ7XG4gICAgY29uc3QgdXBkYXRlRGF0YSA9IHJlcS5ib2R5O1xuICAgIFxuICAgIGNvbnNvbGUubG9nKFwidXBkYXRlT3JkZXIgxJHGsOG7o2MgZ+G7jWkgduG7m2kgZOG7ryBsaeG7h3U6XCIsIEpTT04uc3RyaW5naWZ5KHVwZGF0ZURhdGEpKTtcbiAgICBcbiAgICAvLyBUw6xtIHbDoCBj4bqtcCBuaOG6rXQgxJHGoW4gaMOgbmdcbiAgICBjb25zdCBvcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRCeUlkKG9yZGVySWQpXG4gICAgICAucG9wdWxhdGUoXCJ1c2VySWRcIiwgXCJmaXJzdE5hbWUgbGFzdE5hbWUgdXNlck5hbWUgZW1haWwgcGhvbmUgYWRkcmVzc1wiKVxuICAgICAgLnBvcHVsYXRlKFwicHJvZHVjdHMucHJvZHVjdElkXCIpO1xuICAgIFxuICAgIGlmICghb3JkZXIpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IMSRxqFuIGjDoG5nXCIgXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgLy8gTMawdSB0cuG6oW5nIHRow6FpIGPFqSB0csaw4bubYyBraGkgY+G6rXAgbmjhuq10XG4gICAgY29uc3QgcHJldmlvdXNTdGF0dXMgPSBvcmRlci5zdGF0dXM7XG4gICAgY29uc3QgbmV3U3RhdHVzID0gdXBkYXRlRGF0YS5zdGF0dXM7XG5cbiAgICAvLyBM4buNYyBjw6FjIHRyxrDhu51uZyDEkcaw4bujYyBwaMOpcCBj4bqtcCBuaOG6rXRcbiAgICBjb25zdCBhbGxvd2VkRmllbGRzID0gWydzdGF0dXMnLCAnb3JkZXJDb2RlJywgJ3NoaXBwaW5nSW5mbycsICdub3RlcyddO1xuICAgIGNvbnN0IGZpbHRlcmVkRGF0YSA9IHt9O1xuICAgIFxuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKHVwZGF0ZURhdGEpKSB7XG4gICAgICBpZiAoYWxsb3dlZEZpZWxkcy5pbmNsdWRlcyhrZXkpKSB7XG4gICAgICAgIGZpbHRlcmVkRGF0YVtrZXldID0gdXBkYXRlRGF0YVtrZXldO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBO4bq/dSBraMO0bmcgY8OzIG9yZGVyQ29kZSBuaMawbmcgY+G6p24gdGjDqm0sIHThuqFvIG3hu5l0IG3DoyB24bqtbiDEkcahbiBt4bubaVxuICAgIGlmICghb3JkZXIub3JkZXJDb2RlICYmICFmaWx0ZXJlZERhdGEub3JkZXJDb2RlKSB7XG4gICAgICBmaWx0ZXJlZERhdGEub3JkZXJDb2RlID0gZ2VuZXJhdGVPcmRlckNvZGUoKTtcbiAgICB9XG4gICAgXG4gICAgLy8gVEjDik0gTeG7mkk6IFjhu60gbMO9IGPhuq1wIG5o4bqtdCB0cmFja2luZ19sb2dzIGtoaSBjw7MgdGhheSDEkeG7lWkgdHLhuqFuZyB0aMOhaVxuICAgIGlmIChuZXdTdGF0dXMgJiYgbmV3U3RhdHVzICE9PSBwcmV2aW91c1N0YXR1cykge1xuICAgICAgLy8gS2jhu59pIHThuqFvIHRyYWNraW5nIG9iamVjdCBu4bq/dSBjaMawYSBjw7NcbiAgICAgIGlmICghb3JkZXIudHJhY2tpbmcpIHtcbiAgICAgICAgb3JkZXIudHJhY2tpbmcgPSB7IHN0YXR1c19uYW1lOiBcIlwiLCB0cmFja2luZ19sb2dzOiBbXSB9O1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBM4bqleSB0w6puIGhp4buDbiB0aOG7iyBjaG8gdHLhuqFuZyB0aMOhaVxuICAgICAgbGV0IHN0YXR1c05hbWUgPSBcIlwiO1xuICAgICAgc3dpdGNoIChuZXdTdGF0dXMpIHtcbiAgICAgICAgY2FzZSAncGVuZGluZyc6IHN0YXR1c05hbWUgPSBcIkNo4budIHjhu60gbMO9XCI7IGJyZWFrO1xuICAgICAgICBjYXNlICdjb25maXJtZWQnOiBzdGF0dXNOYW1lID0gXCLEkMOjIHjDoWMgbmjhuq1uXCI7IGJyZWFrO1xuICAgICAgICBjYXNlICdwcm9jZXNzaW5nJzogc3RhdHVzTmFtZSA9IFwixJBhbmcgeOG7rSBsw71cIjsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3ByZXBhcmluZyc6IHN0YXR1c05hbWUgPSBcIsSQYW5nIGNodeG6qW4gYuG7iyBow6BuZ1wiOyBicmVhaztcbiAgICAgICAgY2FzZSAncGFja2FnaW5nJzogc3RhdHVzTmFtZSA9IFwiSG/DoG4gdOG6pXQgxJHDs25nIGfDs2lcIjsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3NoaXBwaW5nJzogc3RhdHVzTmFtZSA9IFwixJBhbmcgduG6rW4gY2h1eeG7g25cIjsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3NoaXBwZWQnOiBzdGF0dXNOYW1lID0gXCLEkMOjIGdpYW8gY2hvIHbhuq1uIGNodXnhu4NuXCI7IGJyZWFrO1xuICAgICAgICBjYXNlICdkZWxpdmVyaW5nJzogc3RhdHVzTmFtZSA9IFwixJBhbmcgZ2lhbyBow6BuZ1wiOyBicmVhaztcbiAgICAgICAgY2FzZSAnZGVsaXZlcmVkJzogc3RhdHVzTmFtZSA9IFwixJDDoyBnaWFvIGjDoG5nXCI7IGJyZWFrO1xuICAgICAgICBjYXNlICdjb21wbGV0ZWQnOiBzdGF0dXNOYW1lID0gXCJIb8OgbiB0aMOgbmhcIjsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2NhbmNlbGxlZCc6IHN0YXR1c05hbWUgPSBcIsSQw6MgaOG7p3lcIjsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2F3YWl0aW5nX3BheW1lbnQnOiBzdGF0dXNOYW1lID0gXCJDaOG7nSB0aGFuaCB0b8OhblwiOyBicmVhaztcbiAgICAgICAgY2FzZSAncmVmdW5kZWQnOiBzdGF0dXNOYW1lID0gXCLEkMOjIGhvw6BuIHRp4buBblwiOyBicmVhaztcbiAgICAgICAgY2FzZSAnZmFpbGVkJzogc3RhdHVzTmFtZSA9IFwiVGjhuqV0IGLhuqFpXCI7IGJyZWFrO1xuICAgICAgICBjYXNlICdkZWxpdmVyeV9mYWlsZWQnOiBzdGF0dXNOYW1lID0gXCJHaWFvIGjDoG5nIHRo4bqldCBi4bqhaVwiOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDogc3RhdHVzTmFtZSA9IG5ld1N0YXR1cztcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gVGjDqm0gYuG6o24gZ2hpIG3hu5tpIHbDoG8gxJHhuqd1IG3huqNuZyB0cmFja2luZ19sb2dzXG4gICAgICBjb25zdCBuZXdUcmFja2luZ0xvZyA9IHtcbiAgICAgICAgc3RhdHVzOiBuZXdTdGF0dXMsXG4gICAgICAgIHN0YXR1c19uYW1lOiBzdGF0dXNOYW1lLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgbG9jYXRpb246IFwiQ+G7rWEgaMOgbmcgRE5DIEZPT0RcIixcbiAgICAgIH07XG4gICAgICBcbiAgICAgIC8vIEto4bufaSB04bqhbyBt4bqjbmcgdHJhY2tpbmdfbG9ncyBu4bq/dSBjaMawYSBjw7NcbiAgICAgIGlmICghb3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncykge1xuICAgICAgICBvcmRlci50cmFja2luZy50cmFja2luZ19sb2dzID0gW107XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIFRow6ptIGxvZyBt4bubaSB2w6BvIMSR4bqndSBt4bqjbmcgKMSR4buDIGxvZyBt4bubaSBuaOG6pXQgbuG6sW0gxJHhuqd1IHRpw6puKVxuICAgICAgb3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncy51bnNoaWZ0KG5ld1RyYWNraW5nTG9nKTtcbiAgICAgIFxuICAgICAgLy8gQ+G6rXAgbmjhuq10IHN0YXR1c19uYW1lIGNow61uaFxuICAgICAgb3JkZXIudHJhY2tpbmcuc3RhdHVzX25hbWUgPSBzdGF0dXNOYW1lO1xuICAgICAgXG4gICAgICAvLyBMxrB1IHRyYWNraW5nIHbDoG8gZmlsdGVyZWREYXRhIMSR4buDIGPhuq1wIG5o4bqtdFxuICAgICAgZmlsdGVyZWREYXRhLnRyYWNraW5nID0gb3JkZXIudHJhY2tpbmc7XG4gICAgfVxuICAgIFxuICAgIC8vIE7hur91IMSRYW5nIGPhuq1wIG5o4bqtdCB0cuG6oW5nIHRow6FpIHRow6BuaCAnY29tcGxldGVkJywgdOG7sSDEkeG7mW5nIMSRw6FuaCBk4bqldSDEkcOjIHRoYW5oIHRvw6FuXG4gICAgaWYgKG5ld1N0YXR1cyA9PT0gJ2NvbXBsZXRlZCcpIHtcbiAgICAgIGZpbHRlcmVkRGF0YS5pc1BhaWQgPSB0cnVlO1xuICAgICAgZmlsdGVyZWREYXRhLmNvbXBsZXRlZEF0ID0gbmV3IERhdGUoKTtcbiAgICAgIFxuICAgICAgLy8gTuG6v3UgxJHGoW4gaMOgbmcgbMOgIENPRCB2w6AgY2jGsGEgY+G6rXAgbmjhuq10IGtobyB0aMOsIGdp4bqjbSBz4buRIGzGsOG7o25nIHbDoCB0xINuZyBzb2xkQ291bnRcbiAgICAgIGlmIChvcmRlci5wYXltZW50TWV0aG9kID09PSBcImNvZFwiICYmICFvcmRlci5pc1BhaWQpIHtcbiAgICAgICAgYXdhaXQgdXBkYXRlUHJvZHVjdFN0b2NrKG9yZGVyLnByb2R1Y3RzLCBmYWxzZSwgdHJ1ZSk7XG4gICAgICAgIFxuICAgICAgICAvLyBD4bqtcCBuaOG6rXQgdGjDtG5nIHRpbiBz4bqjbiBwaOG6qW0gYsOhbiBjaOG6oXlcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBU4bqjaSB0aMO0bmcgdGluIGNoaSB0aeG6v3Qgc+G6o24gcGjhuqltXG4gICAgICAgICAgY29uc3QgcG9wdWxhdGVkT3JkZXIgPSBhd2FpdCBPcmRlci5maW5kQnlJZChvcmRlcklkKS5wb3B1bGF0ZShcInByb2R1Y3RzLnByb2R1Y3RJZFwiKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBD4bqtcCBuaOG6rXQgdOG7q25nIHPhuqNuIHBo4bqpbSB0cm9uZyDEkcahbiBow6BuZ1xuICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBwb3B1bGF0ZWRPcmRlci5wcm9kdWN0cykge1xuICAgICAgICAgICAgaWYgKGl0ZW0ucHJvZHVjdElkKSB7XG4gICAgICAgICAgICAgIGF3YWl0IEJlc3RTZWxsaW5nUHJvZHVjdC51cGRhdGVTYWxlc0RhdGEoXG4gICAgICAgICAgICAgICAgaXRlbS5wcm9kdWN0SWQuX2lkLFxuICAgICAgICAgICAgICAgIGl0ZW0ucHJvZHVjdElkLFxuICAgICAgICAgICAgICAgIGl0ZW0ucXVhbnRpdHksXG4gICAgICAgICAgICAgICAgb3JkZXJJZFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoYmVzdFNlbGxlckVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSBj4bqtcCBuaOG6rXQgc+G6o24gcGjhuqltIGLDoW4gY2jhuqF5OlwiLCBiZXN0U2VsbGVyRXJyb3IpO1xuICAgICAgICAgIC8vIEtow7RuZyB0cuG6oyB24buBIGzhu5dpLCB24bqrbiB0aeG6v3AgdOG7pWMgeOG7rSBsw71cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gTuG6v3UgdGhhbmggdG/DoW4gb25saW5lIHbDoCBzdGF0dXMga2jDoWMgYXdhaXRpbmdfcGF5bWVudCB0aMOsIGPhuq1wIG5o4bqtdCBzb2xkQ291bnRcbiAgICAgIGVsc2UgaWYgKG9yZGVyLnBheW1lbnRNZXRob2QgIT09IFwiY29kXCIgJiYgb3JkZXIuc3RhdHVzICE9PSBcImF3YWl0aW5nX3BheW1lbnRcIikge1xuICAgICAgICAvLyBDaOG7iSBj4bqtcCBuaOG6rXQgc29sZENvdW50IG3DoCBraMO0bmcgdHLhu6sga2hvICjEkcOjIHRy4burIGzDumMgdOG6oW8gxJHGoW4pXG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBvcmRlci5wcm9kdWN0cykge1xuICAgICAgICAgIGNvbnN0IHByb2R1Y3QgPSBhd2FpdCBQcm9kdWN0LmZpbmRCeUlkKGl0ZW0ucHJvZHVjdElkKTtcbiAgICAgICAgICBpZiAocHJvZHVjdCkge1xuICAgICAgICAgICAgcHJvZHVjdC5zb2xkQ291bnQgPSAocHJvZHVjdC5zb2xkQ291bnQgfHwgMCkgKyBpdGVtLnF1YW50aXR5O1xuICAgICAgICAgICAgYXdhaXQgcHJvZHVjdC5zYXZlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBD4bqtcCBuaOG6rXQgdGjDtG5nIHRpbiBz4bqjbiBwaOG6qW0gYsOhbiBjaOG6oXlcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBU4bqjaSB0aMO0bmcgdGluIGNoaSB0aeG6v3Qgc+G6o24gcGjhuqltXG4gICAgICAgICAgY29uc3QgcG9wdWxhdGVkT3JkZXIgPSBhd2FpdCBPcmRlci5maW5kQnlJZChvcmRlcklkKS5wb3B1bGF0ZShcInByb2R1Y3RzLnByb2R1Y3RJZFwiKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBD4bqtcCBuaOG6rXQgdOG7q25nIHPhuqNuIHBo4bqpbSB0cm9uZyDEkcahbiBow6BuZ1xuICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBwb3B1bGF0ZWRPcmRlci5wcm9kdWN0cykge1xuICAgICAgICAgICAgaWYgKGl0ZW0ucHJvZHVjdElkKSB7XG4gICAgICAgICAgICAgIGF3YWl0IEJlc3RTZWxsaW5nUHJvZHVjdC51cGRhdGVTYWxlc0RhdGEoXG4gICAgICAgICAgICAgICAgaXRlbS5wcm9kdWN0SWQuX2lkLFxuICAgICAgICAgICAgICAgIGl0ZW0ucHJvZHVjdElkLFxuICAgICAgICAgICAgICAgIGl0ZW0ucXVhbnRpdHksXG4gICAgICAgICAgICAgICAgb3JkZXJJZFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoYmVzdFNlbGxlckVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSBj4bqtcCBuaOG6rXQgc+G6o24gcGjhuqltIGLDoW4gY2jhuqF5OlwiLCBiZXN0U2VsbGVyRXJyb3IpO1xuICAgICAgICAgIC8vIEtow7RuZyB0cuG6oyB24buBIGzhu5dpLCB24bqrbiB0aeG6v3AgdOG7pWMgeOG7rSBsw71cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBO4bq/dSDEkWFuZyBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSB0aMOgbmggJ2NhbmNlbGxlZCcsIGtp4buDbSB0cmEgeGVtIGPDsyB0aOG7gyBo4buneSBraMO0bmdcbiAgICBpZiAobmV3U3RhdHVzID09PSAnY2FuY2VsbGVkJykge1xuICAgICAgLy8gTmfEg24gY2jhurduIHZp4buHYyBo4buneSDEkcahbiBow6BuZyDEkcOjIGdpYW8gaG/hurdjIMSRYW5nIGdpYW9cbiAgICAgIGlmIChwcmV2aW91c1N0YXR1cyA9PT0gJ2NvbXBsZXRlZCcgfHwgcHJldmlvdXNTdGF0dXMgPT09ICdkZWxpdmVyaW5nJykge1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIG1lc3NhZ2U6IHByZXZpb3VzU3RhdHVzID09PSBcImRlbGl2ZXJpbmdcIiBcbiAgICAgICAgICAgID8gXCJLaMO0bmcgdGjhu4MgaOG7p3kgxJHGoW4gaMOgbmcgxJFhbmcgZ2lhb1wiIFxuICAgICAgICAgICAgOiBcIktow7RuZyB0aOG7gyBo4buneSDEkcahbiBow6BuZyDEkcOjIGdpYW9cIlxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gS2hpIGjhu6d5IMSRxqFuIGjDoG5nIHRoYW5oIHRvw6FuIG9ubGluZSwgY+G6p24gdHLhuqMgbOG6oWkgc+G7kSBsxrDhu6NuZyB04buTbiBraG9cbiAgICAgIGlmIChvcmRlci5wYXltZW50TWV0aG9kICE9PSBcImNvZFwiKSB7XG4gICAgICAgIGF3YWl0IHVwZGF0ZVByb2R1Y3RTdG9jayhvcmRlci5wcm9kdWN0cywgdHJ1ZSwgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBD4bqtcCBuaOG6rXQgxJHGoW4gaMOgbmdcbiAgICBjb25zdCB1cGRhdGVkT3JkZXIgPSBhd2FpdCBPcmRlci5maW5kQnlJZEFuZFVwZGF0ZShcbiAgICAgIG9yZGVySWQsXG4gICAgICB7ICRzZXQ6IGZpbHRlcmVkRGF0YSB9LFxuICAgICAgeyBuZXc6IHRydWUgfVxuICAgICkucG9wdWxhdGUoXCJ1c2VySWRcIikucG9wdWxhdGUoXCJwcm9kdWN0cy5wcm9kdWN0SWRcIik7XG4gICAgXG4gICAgLy8gR+G7rEkgRU1BSUwgVEjDlE5HIELDgU8gS0hJIENIVVnhu4JOIFRS4bqgTkcgVEjDgUkgU0FORyBcIkRFTElWRVJJTkdcIlxuICAgIGlmIChuZXdTdGF0dXMgPT09ICdkZWxpdmVyaW5nJyAmJiBwcmV2aW91c1N0YXR1cyAhPT0gJ2RlbGl2ZXJpbmcnKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIsSQYW5nIGNodeG6qW4gYuG7iyBn4butaSBlbWFpbCB0aMO0bmcgYsOhbyBnaWFvIGjDoG5nLi4uXCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIlRow7RuZyB0aW4gxJHGoW4gaMOgbmcgxJHhu4MgZ+G7rWkgZW1haWw6XCIsIHtcbiAgICAgICAgICBvcmRlckNvZGU6IG9yZGVyLm9yZGVyQ29kZSxcbiAgICAgICAgICBlbWFpbDogb3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC5lbWFpbCA/IG9yZGVyLnVzZXJJZC5lbWFpbCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBhZGRyZXNzOiBvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLmFkZHJlc3MgPyBvcmRlci51c2VySWQuYWRkcmVzcyA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBwaG9uZTogb3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC5waG9uZSA/IG9yZGVyLnVzZXJJZC5waG9uZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB1c2VyTmFtZTogb3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC51c2VyTmFtZSA/IG9yZGVyLnVzZXJJZC51c2VyTmFtZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBmaXJzdE5hbWU6IG9yZGVyLnVzZXJJZCAmJiBvcmRlci51c2VySWQuZmlyc3ROYW1lID8gb3JkZXIudXNlcklkLmZpcnN0TmFtZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBsYXN0TmFtZTogb3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC5sYXN0TmFtZSA/IG9yZGVyLnVzZXJJZC5sYXN0TmFtZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyDEkOG6o20gYuG6o28gb3JkZXIudXNlcklkIMSRw6MgxJHGsOG7o2MgcG9wdWxhdGUgxJHhuqd5IMSR4bunXG4gICAgICAgIGlmIChvcmRlci51c2VySWQgJiYgdHlwZW9mIG9yZGVyLnVzZXJJZCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAvLyBH4butaSBlbWFpbCB0aMO0bmcgYsOhbyDEkcahbiBow6BuZyDEkWFuZyDEkcaw4bujYyBnaWFvXG4gICAgICAgICAgY29uc3QgZW1haWxTZW50ID0gYXdhaXQgc2VuZE9yZGVyU2hpcHBpbmdFbWFpbChvcmRlcik7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKGVtYWlsU2VudCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYMSQw6MgZ+G7rWkgZW1haWwgdGjDtG5nIGLDoW8gZ2lhbyBow6BuZyBjaG8gxJHGoW4gaMOgbmcgIyR7b3JkZXIub3JkZXJDb2RlIHx8IG9yZGVyLl9pZH1gKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYEtow7RuZyB0aOG7gyBn4butaSBlbWFpbCB0aMO0bmcgYsOhbyBnaWFvIGjDoG5nIGNobyDEkcahbiBow6BuZyAjJHtvcmRlci5vcmRlckNvZGUgfHwgb3JkZXIuX2lkfWApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJDaGkgdGnhur90IMSRxqFuIGjDoG5nOlwiLCBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIGlkOiBvcmRlci5faWQsXG4gICAgICAgICAgICAgIG9yZGVyQ29kZTogb3JkZXIub3JkZXJDb2RlLFxuICAgICAgICAgICAgICB1c2VySWQ6IHtcbiAgICAgICAgICAgICAgICBlbWFpbDogb3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC5lbWFpbCA/IG9yZGVyLnVzZXJJZC5lbWFpbCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICBmaXJzdE5hbWU6IG9yZGVyLnVzZXJJZCAmJiBvcmRlci51c2VySWQuZmlyc3ROYW1lID8gb3JkZXIudXNlcklkLmZpcnN0TmFtZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICBsYXN0TmFtZTogb3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC5sYXN0TmFtZSA/IG9yZGVyLnVzZXJJZC5sYXN0TmFtZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICBhZGRyZXNzOiBvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLmFkZHJlc3MgPyBvcmRlci51c2VySWQuYWRkcmVzcyA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICBwaG9uZTogb3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC5waG9uZSA/IG9yZGVyLnVzZXJJZC5waG9uZSA6IHVuZGVmaW5lZFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBudWxsLCAyKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiS2jDtG5nIHRo4buDIGfhu61pIGVtYWlsOiBvcmRlci51c2VySWQga2jDtG5nIMSRxrDhu6NjIHBvcHVsYXRlIMSR4bqneSDEkeG7p1wiKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZW1haWxFcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdM4buXaSBraGkgZ+G7rWkgZW1haWwgdGjDtG5nIGLDoW8gZ2lhbyBow6BuZzonLCBlbWFpbEVycm9yKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignU3RhY2sgdHJhY2U6JywgZW1haWxFcnJvci5zdGFjayk7XG4gICAgICAgIC8vIEtow7RuZyB0cuG6oyB24buBIGzhu5dpIGNobyBjbGllbnQsIGNo4buJIGxvZyBs4buXaVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBH4butaSBlbWFpbCB0aMO0bmcgYsOhbyBraGkgdHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZyB0aGF5IMSR4buVaSAobuG6v3UgY8OzIGVtYWlsKVxuICAgIGVsc2UgaWYgKG5ld1N0YXR1cyAmJiBuZXdTdGF0dXMgIT09IHByZXZpb3VzU3RhdHVzICYmIHVwZGF0ZWRPcmRlci5zaGlwcGluZ0luZm8gJiYgdXBkYXRlZE9yZGVyLnNoaXBwaW5nSW5mby5lbWFpbCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgc2VuZE9yZGVyQ29uZmlybWF0aW9uRW1haWwodXBkYXRlZE9yZGVyKTtcbiAgICAgICAgY29uc29sZS5sb2coYMSQw6MgZ+G7rWkgZW1haWwgY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgxJHGoW4gaMOgbmcgJHt1cGRhdGVkT3JkZXIub3JkZXJDb2RlfSDEkeG6v24gJHt1cGRhdGVkT3JkZXIuc2hpcHBpbmdJbmZvLmVtYWlsfWApO1xuICAgICAgfSBjYXRjaCAoZW1haWxFcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdM4buXaSBraGkgZ+G7rWkgZW1haWwgY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgxJHGoW4gaMOgbmc6JywgZW1haWxFcnJvcik7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIEfhu61pIHRow7RuZyBiw6FvIGtoaSBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZ1xuICAgIGlmIChuZXdTdGF0dXMgJiYgbmV3U3RhdHVzICE9PSBwcmV2aW91c1N0YXR1cyAmJiB1cGRhdGVkT3JkZXIudXNlcklkKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBzZW5kT3JkZXJTdGF0dXNOb3RpZmljYXRpb24odXBkYXRlZE9yZGVyLnVzZXJJZCwgdXBkYXRlZE9yZGVyLCBnZXRTdGF0dXNUZXh0KHVwZGF0ZWRPcmRlci5zdGF0dXMpKTtcbiAgICAgICAgY29uc29sZS5sb2coYMSQw6MgZ+G7rWkgdGjDtG5nIGLDoW8gY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgxJHGoW4gaMOgbmcgJHt1cGRhdGVkT3JkZXIub3JkZXJDb2RlfSDEkeG6v24gdXNlciAke3VwZGF0ZWRPcmRlci51c2VySWR9YCk7XG4gICAgICB9IGNhdGNoIChub3RpZmljYXRpb25FcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdM4buXaSBraGkgZ+G7rWkgdGjDtG5nIGLDoW8gY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgxJHGoW4gaMOgbmc6Jywgbm90aWZpY2F0aW9uRXJyb3IpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IFwiQ+G6rXAgbmjhuq10IMSRxqFuIGjDoG5nIHRow6BuaCBjw7RuZ1wiLFxuICAgICAgZGF0YTogdXBkYXRlZE9yZGVyXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGluIHVwZGF0ZU9yZGVyOlwiLCBlcnJvcik7XG4gICAgY29uc29sZS5lcnJvcihlcnJvci5zdGFjayk7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCJM4buXaSBraGkgY+G6rXAgbmjhuq10IMSRxqFuIGjDoG5nXCIsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxuICAgIH0pO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3Qgb3JkZXJVcGRhdGUgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IHN0YXR1cyB9ID0gcmVxLmJvZHk7XG4gICAgXG4gICAgY29uc29sZS5sb2coXCJvcmRlclVwZGF0ZSBjYWxsZWQgd2l0aCBzdGF0dXM6XCIsIHN0YXR1cyk7XG4gICAgY29uc29sZS5sb2coXCJSZXF1ZXN0IGJvZHk6XCIsIEpTT04uc3RyaW5naWZ5KHJlcS5ib2R5KSk7XG4gICAgXG4gICAgLy8gVHLGsOG7m2MgdGnDqm4gbOG6pXkgdGjDtG5nIHRpbiDEkcahbiBow6BuZyBoaeG7h24gdOG6oWkgxJHhu4MgdGhlbyBkw7VpIHRoYXkgxJHhu5VpIHRy4bqhbmcgdGjDoWlcbiAgICAvLyDEkOG6o20gYuG6o28gcG9wdWxhdGUgxJHhuqd5IMSR4bunIHRow7RuZyB0aW4gxJHhu4MgZ+G7rWkgZW1haWxcbiAgICBjb25zdCBjdXJyZW50T3JkZXIgPSBhd2FpdCBPcmRlci5maW5kQnlJZChyZXEucGFyYW1zLmlkKVxuICAgICAgLnBvcHVsYXRlKFwidXNlcklkXCIsIFwiZmlyc3ROYW1lIGxhc3ROYW1lIHVzZXJOYW1lIGVtYWlsIHBob25lIGFkZHJlc3NcIilcbiAgICAgIC5wb3B1bGF0ZShcInByb2R1Y3RzLnByb2R1Y3RJZFwiKTtcbiAgICBcbiAgICBpZiAoIWN1cnJlbnRPcmRlcikge1xuICAgICAgY29uc29sZS5sb2coXCJLaMO0bmcgdMOsbSB0aOG6pXkgxJHGoW4gaMOgbmcgduG7m2kgSUQ6XCIsIHJlcS5wYXJhbXMuaWQpO1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IMSRxqFuIGjDoG5nXCIgfSk7XG4gICAgfVxuICAgIFxuICAgIGNvbnNvbGUubG9nKFwiVGjDtG5nIHRpbiDEkcahbiBow6BuZyB0csaw4bubYyBraGkgY+G6rXAgbmjhuq10OlwiLCB7XG4gICAgICBpZDogY3VycmVudE9yZGVyLl9pZCxcbiAgICAgIHN0YXR1czogY3VycmVudE9yZGVyLnN0YXR1cyxcbiAgICAgIGVtYWlsOiBjdXJyZW50T3JkZXIudXNlcklkICYmIGN1cnJlbnRPcmRlci51c2VySWQuZW1haWwgPyBjdXJyZW50T3JkZXIudXNlcklkLmVtYWlsIDogdW5kZWZpbmVkLFxuICAgICAgb3JkZXJDb2RlOiBjdXJyZW50T3JkZXIub3JkZXJDb2RlXG4gICAgfSk7XG4gICAgXG4gICAgLy8gTMawdSB0cuG6oW5nIHRow6FpIGPFqSB0csaw4bubYyBraGkgY+G6rXAgbmjhuq10XG4gICAgY29uc3QgcHJldmlvdXNTdGF0dXMgPSBjdXJyZW50T3JkZXIuc3RhdHVzO1xuICAgIFxuICAgIC8vIEPhuq1wIG5o4bqtdCB0cuG6oW5nIHRow6FpIMSRxqFuIGjDoG5nXG4gICAgY3VycmVudE9yZGVyLnN0YXR1cyA9IHN0YXR1cztcbiAgICBhd2FpdCBjdXJyZW50T3JkZXIuc2F2ZSgpO1xuICAgIFxuICAgIC8vIEfhu61pIGVtYWlsIHRow7RuZyBiw6FvIGtoaSDEkcahbiBow6BuZyBjaHV54buDbiBzYW5nIHRy4bqhbmcgdGjDoWkgXCLEkWFuZyBnaWFvIMSR4bq/biBraMOhY2hcIlxuICAgIGlmIChzdGF0dXMgPT09ICdkZWxpdmVyaW5nJyAmJiBwcmV2aW91c1N0YXR1cyAhPT0gJ2RlbGl2ZXJpbmcnKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIsSQYW5nIGNodeG6qW4gYuG7iyBn4butaSBlbWFpbCB0aMO0bmcgYsOhbyBnaWFvIGjDoG5nLi4uXCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIsSQxqFuIGjDoG5nIGPDsyB1c2VySWQgduG7m2kgZW1haWw6XCIsIGN1cnJlbnRPcmRlci51c2VySWQgJiYgY3VycmVudE9yZGVyLnVzZXJJZC5lbWFpbCA/IGN1cnJlbnRPcmRlci51c2VySWQuZW1haWwgOiB1bmRlZmluZWQpO1xuICAgICAgICBcbiAgICAgICAgLy8gR+G7rWkgZW1haWwgdGjDtG5nIGLDoW8gxJHGoW4gaMOgbmcgxJFhbmcgxJHGsOG7o2MgZ2lhb1xuICAgICAgICBjb25zdCBlbWFpbFNlbnQgPSBhd2FpdCBzZW5kT3JkZXJTaGlwcGluZ0VtYWlsKGN1cnJlbnRPcmRlcik7XG4gICAgICAgIFxuICAgICAgICBpZiAoZW1haWxTZW50KSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYMSQw6MgZ+G7rWkgZW1haWwgdGjDtG5nIGLDoW8gZ2lhbyBow6BuZyBjaG8gxJHGoW4gaMOgbmcgIyR7Y3VycmVudE9yZGVyLm9yZGVyQ29kZSB8fCBjdXJyZW50T3JkZXIuX2lkfWApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBLaMO0bmcgdGjhu4MgZ+G7rWkgZW1haWwgdGjDtG5nIGLDoW8gZ2lhbyBow6BuZyBjaG8gxJHGoW4gaMOgbmcgIyR7Y3VycmVudE9yZGVyLm9yZGVyQ29kZSB8fCBjdXJyZW50T3JkZXIuX2lkfWApO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ2hpIHRp4bq/dCDEkcahbiBow6BuZzpcIiwgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgaWQ6IGN1cnJlbnRPcmRlci5faWQsXG4gICAgICAgICAgICBvcmRlckNvZGU6IGN1cnJlbnRPcmRlci5vcmRlckNvZGUsXG4gICAgICAgICAgICB1c2VySWQ6IHtcbiAgICAgICAgICAgICAgZW1haWw6IGN1cnJlbnRPcmRlci51c2VySWQgJiYgY3VycmVudE9yZGVyLnVzZXJJZC5lbWFpbCA/IGN1cnJlbnRPcmRlci51c2VySWQuZW1haWwgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgIGZpcnN0TmFtZTogY3VycmVudE9yZGVyLnVzZXJJZCAmJiBjdXJyZW50T3JkZXIudXNlcklkLmZpcnN0TmFtZSA/IGN1cnJlbnRPcmRlci51c2VySWQuZmlyc3ROYW1lIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICBsYXN0TmFtZTogY3VycmVudE9yZGVyLnVzZXJJZCAmJiBjdXJyZW50T3JkZXIudXNlcklkLmxhc3ROYW1lID8gY3VycmVudE9yZGVyLnVzZXJJZC5sYXN0TmFtZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBudWxsLCAyKSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVtYWlsRXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignTOG7l2kga2hpIGfhu61pIGVtYWlsIHRow7RuZyBiw6FvIGdpYW8gaMOgbmc6JywgZW1haWxFcnJvcik7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1N0YWNrIHRyYWNlOicsIGVtYWlsRXJyb3Iuc3RhY2spO1xuICAgICAgICAvLyBLaMO0bmcgdHLhuqMgduG7gSBs4buXaSBjaG8gY2xpZW50LCBjaOG7iSBsb2cgbOG7l2lcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gVHLhuqMgduG7gSDEkcahbiBow6BuZyDEkcOjIGPhuq1wIG5o4bqtdCB24bubaSDEkeG6p3kgxJHhu6cgdGjDtG5nIHRpblxuICAgIGNvbnN0IHVwZGF0ZWRPcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRCeUlkKHJlcS5wYXJhbXMuaWQpXG4gICAgICAucG9wdWxhdGUoXCJ1c2VySWRcIilcbiAgICAgIC5wb3B1bGF0ZShcInByb2R1Y3RzLnByb2R1Y3RJZFwiKTtcbiAgICBcbiAgICByZXMuanNvbih1cGRhdGVkT3JkZXIpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIGPhuq1wIG5o4bqtdCB0cuG6oW5nIHRow6FpIMSRxqFuIGjDoG5nOlwiLCBlcnIpO1xuICAgIGNvbnNvbGUuZXJyb3IoXCJTdGFjayB0cmFjZTpcIiwgZXJyLnN0YWNrKTtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgfVxufTtcblxuLy8gVGjDqm0gY29udHJvbGxlciBt4bubaSDEkeG7gyDEkcOhbmggZOG6pXUgxJHGoW4gaMOgbmcgxJHDoyB0aGFuaCB0b8OhblxuZXhwb3J0IGNvbnN0IG1hcmtPcmRlckFzUGFpZCA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IG9yZGVySWQgPSByZXEucGFyYW1zLmlkO1xuICAgIGNvbnN0IHsgaXNQYWlkLCBzdGF0dXMgfSA9IHJlcS5ib2R5O1xuICAgIFxuICAgIC8vIEPhuq1wIG5o4bqtdCB0aMO0bmcgdGluIMSRxqFuIGjDoG5nOiB0cuG6oW5nIHRow6FpIHRoYW5oIHRvw6FuIHbDoCB0cuG6oW5nIHRow6FpIMSRxqFuIGjDoG5nIChu4bq/dSBjw7MpXG4gICAgY29uc3QgdXBkYXRlRGF0YSA9IHsgaXNQYWlkIH07XG4gICAgXG4gICAgLy8gVMOsbSDEkcahbiBow6BuZyDEkeG7gyBraeG7g20gdHJhXG4gICAgY29uc3Qgb3JkZXIgPSBhd2FpdCBPcmRlci5maW5kQnlJZChvcmRlcklkKS5wb3B1bGF0ZShcInByb2R1Y3RzLnByb2R1Y3RJZFwiKTtcbiAgICBcbiAgICBpZiAoIW9yZGVyKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBlcnJvcjogXCJLaMO0bmcgdMOsbSB0aOG6pXkgxJHGoW4gaMOgbmdcIiB9KTtcbiAgICB9XG4gICAgXG4gICAgLy8gVGhlbyBkw7VpIHRy4bqhbmcgdGjDoWkgdHLGsOG7m2Mga2hpIGPhuq1wIG5o4bqtdFxuICAgIGNvbnN0IHdhc1BhaWQgPSBvcmRlci5pc1BhaWQ7XG4gICAgY29uc3QgcHJldmlvdXNTdGF0dXMgPSBvcmRlci5zdGF0dXM7XG4gICAgXG4gICAgLy8gTuG6v3UgY8OzIHRy4bqhbmcgdGjDoWkgbeG7m2kgxJHGsOG7o2MgZ+G7rWkgbMOqbiwgY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgxJHGoW4gaMOgbmdcbiAgICBpZiAoc3RhdHVzKSB7XG4gICAgICB1cGRhdGVEYXRhLnN0YXR1cyA9IHN0YXR1cztcbiAgICB9XG4gICAgXG4gICAgLy8gVEjDik0gTeG7mkk6IFjhu60gbMO9IGPhuq1wIG5o4bqtdCB0cmFja2luZ19sb2dzIGtoaSBjw7MgdGhheSDEkeG7lWkgdHLhuqFuZyB0aMOhaSBob+G6t2MgdGhhbmggdG/DoW5cbiAgICBpZiAoKHN0YXR1cyAmJiBzdGF0dXMgIT09IHByZXZpb3VzU3RhdHVzKSB8fCAoaXNQYWlkICYmICF3YXNQYWlkKSkge1xuICAgICAgLy8gS2jhu59pIHThuqFvIHRyYWNraW5nIG9iamVjdCBu4bq/dSBjaMawYSBjw7NcbiAgICAgIGlmICghb3JkZXIudHJhY2tpbmcpIHtcbiAgICAgICAgb3JkZXIudHJhY2tpbmcgPSB7IHN0YXR1c19uYW1lOiBcIlwiLCB0cmFja2luZ19sb2dzOiBbXSB9O1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBM4bqleSB0w6puIGhp4buDbiB0aOG7iyBjaG8gdHLhuqFuZyB0aMOhaVxuICAgICAgbGV0IHN0YXR1c05hbWUgPSBcIlwiO1xuICAgICAgaWYgKHN0YXR1cykge1xuICAgICAgICBzd2l0Y2ggKHN0YXR1cykge1xuICAgICAgICAgIGNhc2UgJ3BlbmRpbmcnOiBzdGF0dXNOYW1lID0gXCJDaOG7nSB44butIGzDvVwiOyBicmVhaztcbiAgICAgICAgICBjYXNlICdjb25maXJtZWQnOiBzdGF0dXNOYW1lID0gXCLEkMOjIHjDoWMgbmjhuq1uXCI7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ3Byb2Nlc3NpbmcnOiBzdGF0dXNOYW1lID0gXCLEkGFuZyB44butIGzDvVwiOyBicmVhaztcbiAgICAgICAgICBjYXNlICdwcmVwYXJpbmcnOiBzdGF0dXNOYW1lID0gXCLEkGFuZyBjaHXhuqluIGLhu4sgaMOgbmdcIjsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAncGFja2FnaW5nJzogc3RhdHVzTmFtZSA9IFwiSG/DoG4gdOG6pXQgxJHDs25nIGfDs2lcIjsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnc2hpcHBpbmcnOiBzdGF0dXNOYW1lID0gXCLEkGFuZyB24bqtbiBjaHV54buDblwiOyBicmVhaztcbiAgICAgICAgICBjYXNlICdzaGlwcGVkJzogc3RhdHVzTmFtZSA9IFwixJDDoyBnaWFvIGNobyB24bqtbiBjaHV54buDblwiOyBicmVhaztcbiAgICAgICAgICBjYXNlICdkZWxpdmVyaW5nJzogc3RhdHVzTmFtZSA9IFwixJBhbmcgZ2lhbyBow6BuZ1wiOyBicmVhaztcbiAgICAgICAgICBjYXNlICdkZWxpdmVyZWQnOiBzdGF0dXNOYW1lID0gXCLEkMOjIGdpYW8gaMOgbmdcIjsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnY29tcGxldGVkJzogc3RhdHVzTmFtZSA9IFwiSG/DoG4gdGjDoG5oXCI7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2NhbmNlbGxlZCc6IHN0YXR1c05hbWUgPSBcIsSQw6MgaOG7p3lcIjsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnYXdhaXRpbmdfcGF5bWVudCc6IHN0YXR1c05hbWUgPSBcIkNo4budIHRoYW5oIHRvw6FuXCI7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ3JlZnVuZGVkJzogc3RhdHVzTmFtZSA9IFwixJDDoyBob8OgbiB0aeG7gW5cIjsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnZmFpbGVkJzogc3RhdHVzTmFtZSA9IFwiVGjhuqV0IGLhuqFpXCI7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2RlbGl2ZXJ5X2ZhaWxlZCc6IHN0YXR1c05hbWUgPSBcIkdpYW8gaMOgbmcgdGjhuqV0IGLhuqFpXCI7IGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6IHN0YXR1c05hbWUgPSBzdGF0dXM7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaXNQYWlkICYmICF3YXNQYWlkKSB7XG4gICAgICAgIHN0YXR1c05hbWUgPSBcIsSQw6MgdGhhbmggdG/DoW5cIjtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gVGjDqm0gYuG6o24gZ2hpIG3hu5tpIHbDoG8gxJHhuqd1IG3huqNuZyB0cmFja2luZ19sb2dzXG4gICAgICBjb25zdCBuZXdUcmFja2luZ0xvZyA9IHtcbiAgICAgICAgc3RhdHVzOiBzdGF0dXMgfHwgb3JkZXIuc3RhdHVzLFxuICAgICAgICBzdGF0dXNfbmFtZTogc3RhdHVzTmFtZSB8fCBcIkPhuq1wIG5o4bqtdCB0aGFuaCB0b8OhblwiLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgbG9jYXRpb246IFwiQ+G7rWEgaMOgbmcgRE5DIEZPT0RcIixcbiAgICAgIH07XG4gICAgICBcbiAgICAgIC8vIEto4bufaSB04bqhbyBt4bqjbmcgdHJhY2tpbmdfbG9ncyBu4bq/dSBjaMawYSBjw7NcbiAgICAgIGlmICghb3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncykge1xuICAgICAgICBvcmRlci50cmFja2luZy50cmFja2luZ19sb2dzID0gW107XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIFRow6ptIGxvZyBt4bubaSB2w6BvIMSR4bqndSBt4bqjbmcgKMSR4buDIGxvZyBt4bubaSBuaOG6pXQgbuG6sW0gxJHhuqd1IHRpw6puKVxuICAgICAgb3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncy51bnNoaWZ0KG5ld1RyYWNraW5nTG9nKTtcbiAgICAgIFxuICAgICAgLy8gQ+G6rXAgbmjhuq10IHN0YXR1c19uYW1lIGNow61uaFxuICAgICAgaWYgKHN0YXR1c05hbWUpIHtcbiAgICAgICAgb3JkZXIudHJhY2tpbmcuc3RhdHVzX25hbWUgPSBzdGF0dXNOYW1lO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBMxrB1IHRyYWNraW5nIHbDoG8gdXBkYXRlRGF0YSDEkeG7gyBj4bqtcCBuaOG6rXRcbiAgICAgIHVwZGF0ZURhdGEudHJhY2tpbmcgPSBvcmRlci50cmFja2luZztcbiAgICB9XG4gICAgXG4gICAgLy8gTuG6v3UgxJHDoW5oIGThuqV1IGzDoCDEkcOjIHRoYW5oIHRvw6FuIHbDoCBob8OgbiB0aMOgbmgsIGPhuq1wIG5o4bqtdCB0aOG7nWkgZ2lhbiBob8OgbiB0aMOgbmhcbiAgICBpZiAoaXNQYWlkICYmIHN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcpIHtcbiAgICAgIHVwZGF0ZURhdGEuY29tcGxldGVkQXQgPSBuZXcgRGF0ZSgpO1xuICAgIH1cbiAgICBcbiAgICAvLyBO4bq/dSDEkcahbiBow6BuZyBDT0QgaG/hurdjIGNoxrBhIHThu6tuZyB0aGFuaCB0b8OhbiwgdsOgIGdp4budIMSRw6MgdGhhbmggdG/DoW5cbiAgICBpZiAob3JkZXIucGF5bWVudE1ldGhvZCA9PT0gXCJjb2RcIiAmJiAhd2FzUGFpZCAmJiBpc1BhaWQpIHtcbiAgICAgIC8vIEPhuq1wIG5o4bqtdCBz4buRIGzGsOG7o25nIHThu5NuIGtobyB2w6AgdMSDbmcgc29sZENvdW50XG4gICAgICBhd2FpdCB1cGRhdGVQcm9kdWN0U3RvY2sob3JkZXIucHJvZHVjdHMsIGZhbHNlLCB0cnVlKTtcbiAgICAgIFxuICAgICAgLy8gQ+G6rXAgbmjhuq10IHRow7RuZyB0aW4gc+G6o24gcGjhuqltIGLDoW4gY2jhuqF5XG4gICAgICB0cnkge1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygb3JkZXIucHJvZHVjdHMpIHtcbiAgICAgICAgICBpZiAoaXRlbS5wcm9kdWN0SWQpIHtcbiAgICAgICAgICAgIGF3YWl0IEJlc3RTZWxsaW5nUHJvZHVjdC51cGRhdGVTYWxlc0RhdGEoXG4gICAgICAgICAgICAgIGl0ZW0ucHJvZHVjdElkLl9pZCxcbiAgICAgICAgICAgICAgaXRlbS5wcm9kdWN0SWQsXG4gICAgICAgICAgICAgIGl0ZW0ucXVhbnRpdHksXG4gICAgICAgICAgICAgIG9yZGVySWRcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChiZXN0U2VsbGVyRXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSBj4bqtcCBuaOG6rXQgc+G6o24gcGjhuqltIGLDoW4gY2jhuqF5OlwiLCBiZXN0U2VsbGVyRXJyb3IpO1xuICAgICAgICAvLyBLaMO0bmcgdHLhuqMgduG7gSBs4buXaSwgduG6q24gdGnhur9wIHThu6VjIHjhu60gbMO9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIEPhuq1wIG5o4bqtdCB0cuG6oW5nIHRow6FpIHRoYW5oIHRvw6FuIGPhu6dhIMSRxqFuIGjDoG5nXG4gICAgY29uc3QgdXBkYXRlZE9yZGVyID0gYXdhaXQgT3JkZXIuZmluZEJ5SWRBbmRVcGRhdGUoXG4gICAgICBvcmRlcklkLFxuICAgICAgdXBkYXRlRGF0YSxcbiAgICAgIHsgbmV3OiB0cnVlIH1cbiAgICApLnBvcHVsYXRlKFwidXNlcklkXCIpLnBvcHVsYXRlKFwicHJvZHVjdHMucHJvZHVjdElkXCIpO1xuICAgIFxuICAgIC8vIEdoaSBsb2cgaG/hurdjIHRow7RuZyBiw6FvXG4gICAgY29uc29sZS5sb2coYMSQxqFuIGjDoG5nICR7b3JkZXJJZH0gxJHDoyDEkcaw4bujYyDEkcOhbmggZOG6pXUgbMOgIMSRw6MgdGhhbmggdG/DoW4ke3N0YXR1cyA/IGAgdsOgIGNodXnhu4NuIHRy4bqhbmcgdGjDoWkgdGjDoG5oICR7c3RhdHVzfWAgOiAnJ31gKTtcbiAgICBcbiAgICAvLyBH4butaSBlbWFpbCB0aMO0bmcgYsOhbyBu4bq/dSBjw7MgZW1haWwgdsOgIGtoaSDEkcahbiBow6BuZyBjaHV54buDbiBzYW5nIHRy4bqhbmcgdGjDoWkgY29tcGxldGVkXG4gICAgaWYgKHN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcgJiYgb3JkZXIuc2hpcHBpbmdJbmZvICYmIG9yZGVyLnNoaXBwaW5nSW5mby5lbWFpbCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgc2VuZE9yZGVyQ29uZmlybWF0aW9uRW1haWwodXBkYXRlZE9yZGVyKTtcbiAgICAgICAgY29uc29sZS5sb2coYMSQw6MgZ+G7rWkgZW1haWwgaG/DoG4gdGjDoG5oIMSRxqFuIGjDoG5nICR7b3JkZXIub3JkZXJDb2RlfSDEkeG6v24gJHtvcmRlci5zaGlwcGluZ0luZm8uZW1haWx9YCk7XG4gICAgICB9IGNhdGNoIChlbWFpbEVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0zhu5dpIGtoaSBn4butaSBlbWFpbCBob8OgbiB0aMOgbmggxJHGoW4gaMOgbmc6JywgZW1haWxFcnJvcik7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJlcy5qc29uKHVwZGF0ZWRPcmRlcik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgxJHDoW5oIGThuqV1IMSRxqFuIGjDoG5nIMSRw6MgdGhhbmggdG/DoW46XCIsIGVycik7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBvcmRlckRlbGV0ZSA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgT3JkZXIuZmluZEJ5SWRBbmREZWxldGUocmVxLnBhcmFtcy5pZCk7XG4gICAgaWYgKCFvcmRlcikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgxJHGoW4gaMOgbmdcIiB9KTtcbiAgICB9XG4gICAgcmVzLmpzb24oeyBtZXNzYWdlOiBcIsSQxqFuIGjDoG5nIMSRw6MgxJHGsOG7o2MgeMOzYSB0aMOgbmggY8O0bmdcIiB9KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gIH1cbn07XG5cbi8vIEjDoG0gaOG7p3kgxJHGoW4gaMOgbmdcbmV4cG9ydCBjb25zdCBjYW5jZWxPcmRlciA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IG9yZGVySWQgPSByZXEucGFyYW1zLmlkO1xuICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgT3JkZXIuZmluZEJ5SWQob3JkZXJJZCk7XG4gICAgXG4gICAgaWYgKCFvcmRlcikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IMSRxqFuIGjDoG5nXCJcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyBLaeG7g20gdHJhIHhlbSDEkcahbiBow6BuZyBjw7MgdGjhu4MgaOG7p3kga2jDtG5nXG4gICAgaWYgKG9yZGVyLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcgfHwgb3JkZXIuc3RhdHVzID09PSAnZGVsaXZlcmluZycpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBvcmRlci5zdGF0dXMgPT09IFwiZGVsaXZlcmluZ1wiIFxuICAgICAgICAgID8gXCJLaMO0bmcgdGjhu4MgaOG7p3kgxJHGoW4gaMOgbmcgxJFhbmcgZ2lhb1wiIFxuICAgICAgICAgIDogXCJLaMO0bmcgdGjhu4MgaOG7p3kgxJHGoW4gaMOgbmcgxJHDoyBnaWFvXCJcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyBD4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZyB0aMOgbmggJ2NhbmNlbGxlZCdcbiAgICBvcmRlci5zdGF0dXMgPSAnY2FuY2VsbGVkJztcbiAgICBhd2FpdCBvcmRlci5zYXZlKCk7XG4gICAgXG4gICAgLy8gQ2jhu4kgdHLhuqMgbOG6oWkgc+G7kSBsxrDhu6NuZyB04buTbiBraG8gbuG6v3UgbMOgIHRoYW5oIHRvw6FuIG9ubGluZSwgQ09EIGNoxrBhIHRy4burIGtob1xuICAgIGlmIChvcmRlci5wYXltZW50TWV0aG9kICE9PSBcImNvZFwiKSB7XG4gICAgICBhd2FpdCB1cGRhdGVQcm9kdWN0U3RvY2sob3JkZXIucHJvZHVjdHMsIHRydWUsIGZhbHNlKTtcbiAgICB9XG4gICAgLy8gTuG6v3UgQ09EIG5oxrBuZyDEkcOjIHRoYW5oIHRvw6FuIHbDoCDEkcOjIGPhuq1wIG5o4bqtdCBzb2xkQ291bnQsIGPhuqduIGdp4bqjbSBzb2xkQ291bnRcbiAgICBlbHNlIGlmIChvcmRlci5wYXltZW50TWV0aG9kID09PSBcImNvZFwiICYmIG9yZGVyLmlzUGFpZCkge1xuICAgICAgYXdhaXQgdXBkYXRlUHJvZHVjdFN0b2NrKG9yZGVyLnByb2R1Y3RzLCBmYWxzZSwgdHJ1ZSk7IC8vIFTEg25nIHNvbGRDb3VudFxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IFwiSOG7p3kgxJHGoW4gaMOgbmcgdGjDoG5oIGPDtG5nXCIsXG4gICAgICBkYXRhOiBvcmRlclxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IFwiTOG7l2kga2hpIGjhu6d5IMSRxqFuIGjDoG5nXCIsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxuICAgIH0pO1xuICB9XG59OyBcblxuLy8gTOG6pXkgdGjDtG5nIHRpbiB0cmFja2luZyB04burIEdpYW8gSMOgbmcgTmhhbmggQVBJXG5leHBvcnQgY29uc3QgZ2V0T3JkZXJUcmFja2luZyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHsgb3JkZXJDb2RlIH0gPSByZXEucGFyYW1zO1xuICAgIFxuICAgIGlmICghb3JkZXJDb2RlKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJUaGnhur91IG3DoyB24bqtbiDEkcahblwiXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgLy8gVMOsbSDEkcahbiBow6BuZyB0cm9uZyBkYXRhYmFzZSBk4buxYSB0csOqbiBvcmRlckNvZGVcbiAgICBjb25zdCBvcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRPbmUoeyBvcmRlckNvZGUgfSk7XG4gICAgXG4gICAgaWYgKCFvcmRlcikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IMSRxqFuIGjDoG5nIHbhu5tpIG3DoyB24bqtbiDEkcahbiBuw6B5XCJcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyBO4bq/dSDEkcahbiBow6BuZyDEkcOjIGPDsyB0aMO0bmcgdGluIHRyYWNraW5nLCDGsHUgdGnDqm4gc+G7rSBk4bulbmdcbiAgICBpZiAob3JkZXIudHJhY2tpbmcgJiYgb3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncyAmJiBvcmRlci50cmFja2luZy50cmFja2luZ19sb2dzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiU+G7rSBk4bulbmcgdGjDtG5nIHRpbiB0cmFja2luZyB04burIGRhdGFiYXNlXCIpO1xuICAgICAgXG4gICAgICAvLyBU4bqhbyBlc3RpbWF0ZWRfZGVsaXZlcnlfdGltZSBu4bq/dSBjaMawYSBjw7NcbiAgICAgIGlmICghb3JkZXIudHJhY2tpbmcuZXN0aW1hdGVkX2RlbGl2ZXJ5X3RpbWUpIHtcbiAgICAgICAgY29uc3QgZXN0aW1hdGVkRGVsaXZlcnkgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBlc3RpbWF0ZWREZWxpdmVyeS5zZXREYXRlKGVzdGltYXRlZERlbGl2ZXJ5LmdldERhdGUoKSArIDMpO1xuICAgICAgICBvcmRlci50cmFja2luZy5lc3RpbWF0ZWRfZGVsaXZlcnlfdGltZSA9IGVzdGltYXRlZERlbGl2ZXJ5LnRvSVNPU3RyaW5nKCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBvcmRlcl9jb2RlOiBvcmRlci5vcmRlckNvZGUsXG4gICAgICAgICAgc3RhdHVzOiBvcmRlci5zdGF0dXMsXG4gICAgICAgICAgc3RhdHVzX25hbWU6IG9yZGVyLnRyYWNraW5nLnN0YXR1c19uYW1lIHx8IGdldFN0YXR1c1RleHQob3JkZXIuc3RhdHVzKSxcbiAgICAgICAgICBlc3RpbWF0ZWRfZGVsaXZlcnlfdGltZTogb3JkZXIudHJhY2tpbmcuZXN0aW1hdGVkX2RlbGl2ZXJ5X3RpbWUsXG4gICAgICAgICAgdHJhY2tpbmdfbG9nczogb3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncyxcbiAgICAgICAgICBjdXJyZW50X2xvY2F0aW9uOiBcIkPhu61hIGjDoG5nIEROQyBGT09EXCIsXG4gICAgICAgICAgZGVsaXZlcnlfbm90ZTogb3JkZXIubm90ZXMgfHwgXCJIw6BuZyBk4buFIHbhu6EsIHhpbiBuaOG6uSB0YXlcIlxuICAgICAgICB9LFxuICAgICAgICBpc01vY2tlZDogZmFsc2VcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyBUaeG6v3AgdOG7pWMgduG7m2kgY29kZSBn4buNaSBBUEkgR0hOIG7hur91IGPhuqduXG4gICAgY29uc3QgU0hPUF9JRCA9IHByb2Nlc3MuZW52LlNIT1BfSUQ7XG4gICAgY29uc3QgU0hPUF9UT0tFTl9BUEkgPSBwcm9jZXNzLmVudi5TSE9QX1RPS0VOX0FQSTtcbiAgICBjb25zdCBVU0VfTU9DS19PTl9FUlJPUiA9IHByb2Nlc3MuZW52LlVTRV9NT0NLX09OX0VSUk9SID09PSAndHJ1ZSc7XG4gICAgXG4gICAgaWYgKCFTSE9QX0lEIHx8ICFTSE9QX1RPS0VOX0FQSSkge1xuICAgICAgY29uc29sZS5sb2coXCJUaGnhur91IHRow7RuZyB0aW4gY+G6pXUgaMOsbmggR0hOIHRyb25nIGJp4bq/biBtw7RpIHRyxrDhu51uZ1wiKTtcbiAgICAgIGlmIChVU0VfTU9DS19PTl9FUlJPUikge1xuICAgICAgICAvLyBU4bqhbyBk4buvIGxp4buHdSBnaeG6oyBs4bqtcCBk4buxYSB0csOqbiB0aMO0bmcgdGluIMSRxqFuIGjDoG5nIHRo4buxYyB04bq/XG4gICAgICAgIGNvbnN0IG1vY2tEYXRhID0gZ2VuZXJhdGVNb2NrVHJhY2tpbmdEYXRhRnJvbU9yZGVyKG9yZGVyKTtcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgIGRhdGE6IG1vY2tEYXRhLFxuICAgICAgICAgIGlzTW9ja2VkOiB0cnVlLFxuICAgICAgICAgIG1lc3NhZ2U6IFwixJBhbmcgc+G7rSBk4bulbmcgZOG7ryBsaeG7h3UgZ2nhuqMgbOG6rXAgZG8gdGhp4bq/dSBj4bqldSBow6xuaCBHSE4gQVBJXCJcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIlRoaeG6v3UgdGjDtG5nIHRpbiBj4bqldSBow6xuaCBHSE5cIlxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHRyeSB7XG4gICAgICBjb25zb2xlLmxvZyhgxJBhbmcgZ+G7jWkgQVBJIEdITiB24bubaSBtw6MgduG6rW4gxJHGoW46ICR7b3JkZXJDb2RlfWApO1xuICAgICAgY29uc29sZS5sb2coYFRow7RuZyB0aW4gU2hvcDogSUQ9JHtTSE9QX0lEfSwgVE9LRU49JHtTSE9QX1RPS0VOX0FQSS5zdWJzdHJpbmcoMCwgMTApfS4uLmApO1xuICAgICAgXG4gICAgICAvLyBH4buNaSBBUEkgR0hOIMSR4buDIGzhuqV5IHRow7RuZyB0aW4gdHJhY2tpbmdcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdChcbiAgICAgICAgXCJodHRwczovL29ubGluZS1nYXRld2F5Lmdobi52bi9zaGlpcC9wdWJsaWMtYXBpL3YyL3NoaXBwaW5nLW9yZGVyL2RldGFpbFwiLCBcbiAgICAgICAgeyBvcmRlcl9jb2RlOiBvcmRlckNvZGUgfSxcbiAgICAgICAge1xuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdUb2tlbic6IFNIT1BfVE9LRU5fQVBJLFxuICAgICAgICAgICAgJ1Nob3BJZCc6IFNIT1BfSUQsXG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICAgICAgXG4gICAgICBjb25zb2xlLmxvZyhcIkvhur90IHF14bqjIHThu6sgQVBJIEdITjpcIiwgSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UuZGF0YSwgbnVsbCwgMikpO1xuICAgICAgXG4gICAgICAvLyBO4bq/dSBBUEkgdHLhuqMgduG7gSBs4buXaSwgeOG7rSBsw70gdsOgIHRy4bqjIHbhu4EgcmVzcG9uc2UgcGjDuSBo4bujcFxuICAgICAgaWYgKHJlc3BvbnNlLmRhdGEuY29kZSAhPT0gMjAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTOG7l2kgdOG7qyBHSE4gQVBJOlwiLCByZXNwb25zZS5kYXRhKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChVU0VfTU9DS19PTl9FUlJPUikge1xuICAgICAgICAgIC8vIFThuqFvIGThu68gbGnhu4d1IGdp4bqjIGzhuq1wIGThu7FhIHRyw6puIHRow7RuZyB0aW4gxJHGoW4gaMOgbmcgdGjhu7FjIHThur9cbiAgICAgICAgICBjb25zdCBtb2NrRGF0YSA9IGdlbmVyYXRlTW9ja1RyYWNraW5nRGF0YUZyb21PcmRlcihvcmRlcik7XG4gICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBkYXRhOiBtb2NrRGF0YSxcbiAgICAgICAgICAgIGlzTW9ja2VkOiB0cnVlLFxuICAgICAgICAgICAgbWVzc2FnZTogXCLEkGFuZyBz4butIGThu6VuZyBk4buvIGxp4buHdSBnaeG6oyBs4bqtcCBkbyBBUEkgR0hOIHRy4bqjIHbhu4EgbOG7l2lcIlxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhyZXNwb25zZS5kYXRhLmNvZGUpLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIG1lc3NhZ2U6IHJlc3BvbnNlLmRhdGEubWVzc2FnZSB8fCBcIkzhu5dpIHThu6sgQVBJIEdITlwiLFxuICAgICAgICAgIGNvZGU6IHJlc3BvbnNlLmRhdGEuY29kZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gTuG6v3UgdGjDoG5oIGPDtG5nLCB0cuG6oyB24buBIGThu68gbGnhu4d1XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBkYXRhOiByZXNwb25zZS5kYXRhLmRhdGEsXG4gICAgICAgIGlzTW9ja2VkOiBmYWxzZVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoYXBpRXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBn4buNaSBBUEkgR0hOOlwiLCBhcGlFcnJvci5tZXNzYWdlKTtcbiAgICAgIFxuICAgICAgaWYgKFVTRV9NT0NLX09OX0VSUk9SKSB7XG4gICAgICAgIC8vIFThuqFvIGThu68gbGnhu4d1IGdp4bqjIGzhuq1wIGThu7FhIHRyw6puIHRow7RuZyB0aW4gxJHGoW4gaMOgbmcgdGjhu7FjIHThur9cbiAgICAgICAgY29uc3QgbW9ja0RhdGEgPSBnZW5lcmF0ZU1vY2tUcmFja2luZ0RhdGFGcm9tT3JkZXIob3JkZXIpO1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgZGF0YTogbW9ja0RhdGEsXG4gICAgICAgICAgaXNNb2NrZWQ6IHRydWUsXG4gICAgICAgICAgbWVzc2FnZTogXCLEkGFuZyBz4butIGThu6VuZyBk4buvIGxp4buHdSBnaeG6oyBs4bqtcCBkbyBraMO0bmcgdGjhu4Mga+G6v3QgbuG7kWkgQVBJIEdITlwiXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdGjhu4Mga+G6v3QgbuG7kWkgxJHhur9uIEFQSSBHSE5cIixcbiAgICAgICAgZXJyb3I6IGFwaUVycm9yLm1lc3NhZ2VcbiAgICAgIH0pO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIGzhuqV5IHRow7RuZyB0aW4gduG6rW4gY2h1eeG7g246XCIsIGVycm9yLnJlc3BvbnNlICYmIGVycm9yLnJlc3BvbnNlLmRhdGEgPyBlcnJvci5yZXNwb25zZS5kYXRhIDogZXJyb3IubWVzc2FnZSk7XG4gICAgXG4gICAgY29uc3QgVVNFX01PQ0tfT05fRVJST1IgPSBwcm9jZXNzLmVudi5VU0VfTU9DS19PTl9FUlJPUiA9PT0gJ3RydWUnO1xuICAgIFxuICAgIGlmIChVU0VfTU9DS19PTl9FUlJPUikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gVMOsbSDEkcahbiBow6BuZyB0cm9uZyBkYXRhYmFzZSBk4buxYSB0csOqbiBvcmRlckNvZGVcbiAgICAgICAgY29uc3Qgb3JkZXIgPSBhd2FpdCBPcmRlci5maW5kT25lKHsgb3JkZXJDb2RlOiByZXEucGFyYW1zLm9yZGVyQ29kZSB9KTtcbiAgICAgICAgXG4gICAgICAgIGlmIChvcmRlcikge1xuICAgICAgICAgIC8vIFThuqFvIGThu68gbGnhu4d1IGdp4bqjIGzhuq1wIGThu7FhIHRyw6puIHRow7RuZyB0aW4gxJHGoW4gaMOgbmcgdGjhu7FjIHThur9cbiAgICAgICAgICBjb25zdCBtb2NrRGF0YSA9IGdlbmVyYXRlTW9ja1RyYWNraW5nRGF0YUZyb21PcmRlcihvcmRlcik7XG4gICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBkYXRhOiBtb2NrRGF0YSxcbiAgICAgICAgICAgIGlzTW9ja2VkOiB0cnVlLFxuICAgICAgICAgICAgbWVzc2FnZTogXCLEkGFuZyBz4butIGThu6VuZyBk4buvIGxp4buHdSBnaeG6oyBs4bqtcCBkbyBs4buXaSBo4buHIHRo4buRbmdcIlxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChkYkVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgdMOsbSDEkcahbiBow6BuZzpcIiwgZGJFcnJvcik7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIE7hur91IGtow7RuZyB0w6xtIHRo4bqleSDEkcahbiBow6BuZyBob+G6t2MgY8OzIGzhu5dpLCBz4butIGThu6VuZyBk4buvIGxp4buHdSBnaeG6oyBs4bqtcCBt4bq3YyDEkeG7i25oXG4gICAgICBjb25zdCBtb2NrRGF0YSA9IGdlbmVyYXRlTW9ja1RyYWNraW5nRGF0YShyZXEucGFyYW1zLm9yZGVyQ29kZSk7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBkYXRhOiBtb2NrRGF0YSxcbiAgICAgICAgaXNNb2NrZWQ6IHRydWUsXG4gICAgICAgIG1lc3NhZ2U6IFwixJBhbmcgc+G7rSBk4bulbmcgZOG7ryBsaeG7h3UgZ2nhuqMgbOG6rXAgZG8gbOG7l2kgaOG7hyB0aOG7kW5nXCJcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBcIkzhu5dpIGjhu4cgdGjhu5FuZyBraGkgbOG6pXkgdGjDtG5nIHRpbiB24bqtbiBjaHV54buDblwiLFxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcbiAgICB9KTtcbiAgfVxufTtcblxuLy8gSMOgbSBjaHV54buDbiDEkeG7lWkgdHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZyB0aMOgbmggdGV4dCBoaeG7g24gdGjhu4tcbmZ1bmN0aW9uIGdldFN0YXR1c1RleHQoc3RhdHVzKSB7XG4gIHN3aXRjaCAoc3RhdHVzKSB7XG4gICAgY2FzZSAncGVuZGluZyc6IHJldHVybiBcIkNo4budIHjhu60gbMO9XCI7XG4gICAgY2FzZSAnY29uZmlybWVkJzogcmV0dXJuIFwixJDDoyB4w6FjIG5o4bqtblwiO1xuICAgIGNhc2UgJ3Byb2Nlc3NpbmcnOiByZXR1cm4gXCLEkGFuZyB44butIGzDvVwiO1xuICAgIGNhc2UgJ3ByZXBhcmluZyc6IHJldHVybiBcIsSQYW5nIGNodeG6qW4gYuG7iyBow6BuZ1wiO1xuICAgIGNhc2UgJ3BhY2thZ2luZyc6IHJldHVybiBcIkhvw6BuIHThuqV0IMSRw7NuZyBnw7NpXCI7XG4gICAgY2FzZSAnc2hpcHBpbmcnOiByZXR1cm4gXCLEkGFuZyB24bqtbiBjaHV54buDblwiO1xuICAgIGNhc2UgJ3NoaXBwZWQnOiByZXR1cm4gXCLEkMOjIGdpYW8gY2hvIHbhuq1uIGNodXnhu4NuXCI7XG4gICAgY2FzZSAnZGVsaXZlcmluZyc6IHJldHVybiBcIsSQYW5nIGdpYW8gaMOgbmdcIjtcbiAgICBjYXNlICdkZWxpdmVyZWQnOiByZXR1cm4gXCLEkMOjIGdpYW8gaMOgbmdcIjtcbiAgICBjYXNlICdjb21wbGV0ZWQnOiByZXR1cm4gXCJIb8OgbiB0aMOgbmhcIjtcbiAgICBjYXNlICdjYW5jZWxsZWQnOiByZXR1cm4gXCLEkMOjIGjhu6d5XCI7XG4gICAgY2FzZSAnYXdhaXRpbmdfcGF5bWVudCc6IHJldHVybiBcIkNo4budIHRoYW5oIHRvw6FuXCI7XG4gICAgY2FzZSAncmVmdW5kZWQnOiByZXR1cm4gXCLEkMOjIGhvw6BuIHRp4buBblwiO1xuICAgIGNhc2UgJ2ZhaWxlZCc6IHJldHVybiBcIlRo4bqldCBi4bqhaVwiO1xuICAgIGNhc2UgJ2RlbGl2ZXJ5X2ZhaWxlZCc6IHJldHVybiBcIkdpYW8gaMOgbmcgdGjhuqV0IGLhuqFpXCI7XG4gICAgZGVmYXVsdDogcmV0dXJuIHN0YXR1cztcbiAgfVxufVxuXG4vLyBIw6BtIHThuqFvIGThu68gbGnhu4d1IGdp4bqjIGzhuq1wIHThu6sgxJHGoW4gaMOgbmcgdGjhu7FjIHThur9cbmZ1bmN0aW9uIGdlbmVyYXRlTW9ja1RyYWNraW5nRGF0YUZyb21PcmRlcihvcmRlcikge1xuICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICBsZXQgdHJhY2tpbmdMb2dzID0gW107XG4gIFxuICAvLyBT4butIGThu6VuZyB0cmFja2luZ19sb2dzIG7hur91IMSRw6MgY8OzXG4gIGlmIChvcmRlci50cmFja2luZyAmJiBvcmRlci50cmFja2luZy50cmFja2luZ19sb2dzICYmIG9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3MubGVuZ3RoID4gMCkge1xuICAgIHRyYWNraW5nTG9ncyA9IG9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3M7XG4gIH0gXG4gIC8vIE7hur91IGtow7RuZyBjw7MgdHJhY2tpbmdfbG9ncywgdOG6oW8gZOG7ryBsaeG7h3UgZ2nhuqMgbOG6rXAgZOG7sWEgdsOgbyB0cuG6oW5nIHRow6FpIGhp4buHbiB04bqhaVxuICBlbHNlIHtcbiAgICAvLyBU4bqhbyBjw6FjIG3hu5FjIHRo4budaSBnaWFuIGdp4bqjIGzhuq1wXG4gICAgY29uc3QgdGltZURheTIgPSBuZXcgRGF0ZShub3cpO1xuICAgIHRpbWVEYXkyLnNldEhvdXJzKG5vdy5nZXRIb3VycygpIC0gMjQpOyAvLyAxIG5nw6B5IHRyxrDhu5tjXG4gICAgXG4gICAgY29uc3QgdGltZVRvZGF5MSA9IG5ldyBEYXRlKG5vdyk7XG4gICAgdGltZVRvZGF5MS5zZXRIb3Vycyhub3cuZ2V0SG91cnMoKSAtIDEwKTsgLy8gMTAgZ2nhu50gdHLGsOG7m2NcbiAgICBcbiAgICBjb25zdCB0aW1lVG9kYXkyID0gbmV3IERhdGUobm93KTtcbiAgICB0aW1lVG9kYXkyLnNldEhvdXJzKG5vdy5nZXRIb3VycygpIC0gNSk7IC8vIDUgZ2nhu50gdHLGsOG7m2NcbiAgICBcbiAgICBjb25zdCB0aW1lTGF0ZXN0ID0gbmV3IERhdGUobm93KTtcbiAgICB0aW1lTGF0ZXN0LnNldE1pbnV0ZXMobm93LmdldE1pbnV0ZXMoKSAtIDMwKTsgLy8gMzAgcGjDunQgdHLGsOG7m2NcbiAgICBcbiAgICAvLyBU4bqhbyBsb2dzIGThu7FhIHRyw6puIHRy4bqhbmcgdGjDoWkgxJHGoW4gaMOgbmdcbiAgICBzd2l0Y2ggKG9yZGVyLnN0YXR1cykge1xuICAgICAgY2FzZSAnY29tcGxldGVkJzpcbiAgICAgICAgdHJhY2tpbmdMb2dzID0gW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0YXR1czogXCJjb21wbGV0ZWRcIixcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBcIkhvw6BuIHRow6BuaFwiLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBub3cudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGxvY2F0aW9uOiBcIsSQ4buLYSBjaOG7iSBnaWFvIGjDoG5nXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0YXR1czogXCJkZWxpdmVyZWRcIixcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBcIsSQw6MgZ2lhbyBow6BuZ1wiLFxuICAgICAgICAgICAgdGltZXN0YW1wOiB0aW1lTGF0ZXN0LnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBsb2NhdGlvbjogXCLEkOG7i2EgY2jhu4kgZ2lhbyBow6BuZ1wiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdGF0dXM6IFwiZGVsaXZlcmluZ1wiLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IFwixJBhbmcgZ2lhbyBow6BuZ1wiLFxuICAgICAgICAgICAgdGltZXN0YW1wOiB0aW1lVG9kYXkyLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBsb2NhdGlvbjogXCJUcnVuZyB0w6JtIHBow6JuIGxv4bqhaVwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdGF0dXM6IFwic2hpcHBpbmdcIixcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBcIsSQYW5nIHbhuq1uIGNodXnhu4NuXCIsXG4gICAgICAgICAgICB0aW1lc3RhbXA6IHRpbWVUb2RheTEudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGxvY2F0aW9uOiBcIkPhu61hIGjDoG5nIEROQyBGT09EXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0YXR1czogXCJwYWNrYWdpbmdcIixcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBcIkhvw6BuIHThuqV0IMSRw7NuZyBnw7NpXCIsXG4gICAgICAgICAgICB0aW1lc3RhbXA6IHRpbWVEYXkyLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBsb2NhdGlvbjogXCJD4butYSBow6BuZyBETkMgRk9PRFwiXG4gICAgICAgICAgfVxuICAgICAgICBdO1xuICAgICAgICBicmVhaztcbiAgICAgICAgXG4gICAgICBjYXNlICdkZWxpdmVyaW5nJzpcbiAgICAgICAgdHJhY2tpbmdMb2dzID0gW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0YXR1czogXCJkZWxpdmVyaW5nXCIsXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogXCLEkGFuZyBnaWFvIGjDoG5nXCIsXG4gICAgICAgICAgICB0aW1lc3RhbXA6IHRpbWVMYXRlc3QudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGxvY2F0aW9uOiBcIlRydW5nIHTDom0gcGjDom4gbG/huqFpXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0YXR1czogXCJzaGlwcGluZ1wiLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IFwixJBhbmcgduG6rW4gY2h1eeG7g25cIixcbiAgICAgICAgICAgIHRpbWVzdGFtcDogdGltZVRvZGF5MS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgbG9jYXRpb246IFwiQ+G7rWEgaMOgbmcgRE5DIEZPT0RcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3RhdHVzOiBcInBhY2thZ2luZ1wiLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IFwiSG/DoG4gdOG6pXQgxJHDs25nIGfDs2lcIixcbiAgICAgICAgICAgIHRpbWVzdGFtcDogdGltZURheTIudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGxvY2F0aW9uOiBcIkPhu61hIGjDoG5nIEROQyBGT09EXCJcbiAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBcbiAgICAgIGNhc2UgJ3NoaXBwaW5nJzpcbiAgICAgICAgdHJhY2tpbmdMb2dzID0gW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0YXR1czogXCJzaGlwcGluZ1wiLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IFwixJBhbmcgduG6rW4gY2h1eeG7g25cIixcbiAgICAgICAgICAgIHRpbWVzdGFtcDogdGltZUxhdGVzdC50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgbG9jYXRpb246IFwiQ+G7rWEgaMOgbmcgRE5DIEZPT0RcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3RhdHVzOiBcInBhY2thZ2luZ1wiLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IFwiSG/DoG4gdOG6pXQgxJHDs25nIGfDs2lcIixcbiAgICAgICAgICAgIHRpbWVzdGFtcDogdGltZVRvZGF5MS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgbG9jYXRpb246IFwiQ+G7rWEgaMOgbmcgRE5DIEZPT0RcIlxuICAgICAgICAgIH1cbiAgICAgICAgXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIFxuICAgICAgY2FzZSAncGFja2FnaW5nJzpcbiAgICAgICAgdHJhY2tpbmdMb2dzID0gW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0YXR1czogXCJwYWNrYWdpbmdcIixcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBcIkhvw6BuIHThuqV0IMSRw7NuZyBnw7NpXCIsXG4gICAgICAgICAgICB0aW1lc3RhbXA6IHRpbWVMYXRlc3QudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGxvY2F0aW9uOiBcIkPhu61hIGjDoG5nIEROQyBGT09EXCJcbiAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIFbhu5tpIGPDoWMgdHLhuqFuZyB0aMOhaSBraMOhYywgdOG6oW8gbeG7mXQgYuG6o24gZ2hpIHBow7kgaOG7o3BcbiAgICAgICAgdHJhY2tpbmdMb2dzID0gW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0YXR1czogb3JkZXIuc3RhdHVzLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGdldFN0YXR1c1RleHQob3JkZXIuc3RhdHVzKSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbm93LnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBsb2NhdGlvbjogXCJD4butYSBow6BuZyBETkMgRk9PRFwiXG4gICAgICAgICAgfVxuICAgICAgICBdO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gVOG6oW8gbmfDoHkgZOG7sSBraeG6v24gZ2lhbyBow6BuZyAoMyBuZ8OgeSB04burIGhp4buHbiB04bqhaSlcbiAgY29uc3QgZXN0aW1hdGVkRGVsaXZlcnkgPSBuZXcgRGF0ZShub3cpO1xuICBlc3RpbWF0ZWREZWxpdmVyeS5zZXREYXRlKG5vdy5nZXREYXRlKCkgKyAzKTtcbiAgXG4gIC8vIEzhuqV5IHRy4bqhbmcgdGjDoWkgdsOgIHTDqm4gdHLhuqFuZyB0aMOhaSB04burIGLhuqNuIGdoaSBt4bubaSBuaOG6pXRcbiAgY29uc3Qgc3RhdHVzID0gdHJhY2tpbmdMb2dzLmxlbmd0aCA+IDAgPyB0cmFja2luZ0xvZ3NbMF0uc3RhdHVzIDogb3JkZXIuc3RhdHVzO1xuICBjb25zdCBzdGF0dXNfbmFtZSA9IHRyYWNraW5nTG9ncy5sZW5ndGggPiAwID8gdHJhY2tpbmdMb2dzWzBdLnN0YXR1c19uYW1lIDogZ2V0U3RhdHVzVGV4dChvcmRlci5zdGF0dXMpO1xuICBcbiAgLy8gVHLhuqMgduG7gSBj4bqldSB0csO6YyBk4buvIGxp4buHdSB0cmFja2luZ1xuICByZXR1cm4ge1xuICAgIG9yZGVyX2NvZGU6IG9yZGVyLm9yZGVyQ29kZSxcbiAgICBzdGF0dXM6IHN0YXR1cyxcbiAgICBzdGF0dXNfbmFtZTogc3RhdHVzX25hbWUsXG4gICAgZXN0aW1hdGVkX2RlbGl2ZXJ5X3RpbWU6IGVzdGltYXRlZERlbGl2ZXJ5LnRvSVNPU3RyaW5nKCksXG4gICAgdHJhY2tpbmdfbG9nczogdHJhY2tpbmdMb2dzLFxuICAgIGN1cnJlbnRfbG9jYXRpb246IFwiQ+G7rWEgaMOgbmcgRE5DIEZPT0RcIixcbiAgICBkZWxpdmVyeV9ub3RlOiBvcmRlci5ub3RlcyB8fCBcIkjDoG5nIGThu4UgduG7oSwgeGluIG5o4bq5IHRheVwiXG4gIH07XG59XG5cbi8vIEdp4buvIGzhuqFpIGjDoG0gY8WpIMSR4buDIHTGsMahbmcgdGjDrWNoIG5nxrDhu6NjXG5mdW5jdGlvbiBnZW5lcmF0ZU1vY2tUcmFja2luZ0RhdGEob3JkZXJDb2RlKSB7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gIFxuICAvLyBU4bqhbyBjw6FjIG3hu5FjIHRo4budaSBnaWFuIGdp4bqjIGzhuq1wXG4gIGNvbnN0IHRpbWVEYXkyID0gbmV3IERhdGUobm93KTtcbiAgdGltZURheTIuc2V0SG91cnMobm93LmdldEhvdXJzKCkgLSAyNCk7IC8vIDEgbmfDoHkgdHLGsOG7m2NcbiAgXG4gIGNvbnN0IHRpbWVUb2RheTEgPSBuZXcgRGF0ZShub3cpO1xuICB0aW1lVG9kYXkxLnNldEhvdXJzKG5vdy5nZXRIb3VycygpIC0gMTApOyAvLyAxMCBnaeG7nSB0csaw4bubY1xuICBcbiAgY29uc3QgdGltZVRvZGF5MiA9IG5ldyBEYXRlKG5vdyk7XG4gIHRpbWVUb2RheTIuc2V0SG91cnMobm93LmdldEhvdXJzKCkgLSA1KTsgLy8gNSBnaeG7nSB0csaw4bubY1xuICBcbiAgY29uc3QgdGltZUxhdGVzdCA9IG5ldyBEYXRlKG5vdyk7XG4gIHRpbWVMYXRlc3Quc2V0TWludXRlcyhub3cuZ2V0TWludXRlcygpIC0gMzApOyAvLyAzMCBwaMO6dCB0csaw4bubY1xuICBcbiAgLy8gVOG6oW8gbmfDoHkgZOG7sSBraeG6v24gZ2lhbyBow6BuZyAoMyBuZ8OgeSB04burIGhp4buHbiB04bqhaSlcbiAgY29uc3QgZXN0aW1hdGVkRGVsaXZlcnkgPSBuZXcgRGF0ZShub3cpO1xuICBlc3RpbWF0ZWREZWxpdmVyeS5zZXREYXRlKG5vdy5nZXREYXRlKCkgKyAzKTsgLy8gROG7sSBraeG6v24gZ2lhbyBzYXUgMyBuZ8OgeVxuICBcbiAgLy8gVOG6oW8gZGFuaCBzw6FjaCBjw6FjIGxvZyB24bqtbiBjaHV54buDbiBnaeG6oyBs4bqtcCAodOG7qyBt4bubaSDEkeG6v24gY8WpKVxuICBjb25zdCB0cmFja2luZ0xvZ3MgPSBbXG4gICAge1xuICAgICAgc3RhdHVzOiBcInBhY2thZ2luZ1wiLFxuICAgICAgc3RhdHVzX25hbWU6IFwiSG/DoG4gdOG6pXQgxJHDs25nIGfDs2lcIixcbiAgICAgIHRpbWVzdGFtcDogdGltZURheTIudG9JU09TdHJpbmcoKSxcbiAgICAgIGxvY2F0aW9uOiBcIkPhu61hIGjDoG5nIEROQyBGT09EXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIHN0YXR1czogXCJzaGlwcGluZ1wiLFxuICAgICAgc3RhdHVzX25hbWU6IFwixJDDoyBnaWFvIGNobyB24bqtbiBjaHV54buDblwiLFxuICAgICAgdGltZXN0YW1wOiB0aW1lVG9kYXkxLnRvSVNPU3RyaW5nKCksXG4gICAgICBsb2NhdGlvbjogXCJD4butYSBow6BuZyBETkMgRk9PRFwiXG4gICAgfSxcbiAgICB7XG4gICAgICBzdGF0dXM6IFwiY29sbGVjdGVkXCIsXG4gICAgICBzdGF0dXNfbmFtZTogXCLEkMOjIGzhuqV5IGjDoG5nXCIsXG4gICAgICB0aW1lc3RhbXA6IHRpbWVUb2RheTIudG9JU09TdHJpbmcoKSxcbiAgICAgIGxvY2F0aW9uOiBcIkPhu61hIGjDoG5nIEROQyBGT09EXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIHN0YXR1czogXCJkZWxpdmVyaW5nXCIsXG4gICAgICBzdGF0dXNfbmFtZTogXCLEkGFuZyBnaWFvIGjDoG5nXCIsXG4gICAgICB0aW1lc3RhbXA6IHRpbWVMYXRlc3QudG9JU09TdHJpbmcoKSxcbiAgICAgIGxvY2F0aW9uOiBcIlRydW5nIHTDom0gcGjDom4gbG/huqFpXCJcbiAgICB9XG4gIF07XG5cbiAgLy8gVHLhuqMgduG7gSBj4bqldSB0csO6YyBk4buvIGxp4buHdSB0cmFja2luZyBnaeG6oyBs4bqtcFxuICByZXR1cm4ge1xuICAgIG9yZGVyX2NvZGU6IG9yZGVyQ29kZSxcbiAgICBzdGF0dXM6IFwiZGVsaXZlcmluZ1wiLFxuICAgIHN0YXR1c19uYW1lOiBcIsSQYW5nIGdpYW8gaMOgbmdcIixcbiAgICBlc3RpbWF0ZWRfZGVsaXZlcnlfdGltZTogZXN0aW1hdGVkRGVsaXZlcnkudG9JU09TdHJpbmcoKSxcbiAgICB0cmFja2luZ19sb2dzOiB0cmFja2luZ0xvZ3MsXG4gICAgY3VycmVudF9sb2NhdGlvbjogXCJUcnVuZyB0w6JtIHBow6JuIHBo4buRaVwiLFxuICAgIGRlbGl2ZXJ5X25vdGU6IFwiSMOgbmcgZOG7hSB24buhLCB4aW4gbmjhurkgdGF5XCJcbiAgfTtcbn1cblxuLy8gQ+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgdGhhbmggdG/DoW4gY+G7p2EgxJHGoW4gaMOgbmdcbmV4cG9ydCBjb25zdCB1cGRhdGVPcmRlclBheW1lbnRTdGF0dXMgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IGlkIH0gPSByZXEucGFyYW1zO1xuICAgIGNvbnN0IHsgcGF5bWVudFN0YXR1cywgaXNQYWlkIH0gPSByZXEuYm9keTtcblxuICAgIC8vIFZhbGlkYXRlIGlucHV0XG4gICAgaWYgKCFpZCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwiT3JkZXIgSUQgaXMgcmVxdWlyZWRcIlxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gRmluZCBvcmRlclxuICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgT3JkZXIuZmluZEJ5SWQoaWQpO1xuICAgIGlmICghb3JkZXIpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIk9yZGVyIG5vdCBmb3VuZFwiXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBUcmFjayBvbGQgdmFsdWVzIGZvciBjb21wYXJpc29uXG4gICAgY29uc3Qgb2xkUGF5bWVudFN0YXR1cyA9IG9yZGVyLnBheW1lbnRTdGF0dXM7XG4gICAgY29uc3Qgb2xkSXNQYWlkID0gb3JkZXIuaXNQYWlkO1xuXG4gICAgLy8gVXBkYXRlIHBheW1lbnQgc3RhdHVzXG4gICAgY29uc3QgdXBkYXRlRGF0YSA9IHt9O1xuICAgIGlmIChwYXltZW50U3RhdHVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHVwZGF0ZURhdGEucGF5bWVudFN0YXR1cyA9IHBheW1lbnRTdGF0dXM7XG4gICAgfVxuICAgIGlmIChpc1BhaWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdXBkYXRlRGF0YS5pc1BhaWQgPSBpc1BhaWQ7XG4gICAgfVxuXG4gICAgLy8gVEjDik0gTeG7mkk6IEPhuq1wIG5o4bqtdCB0cmFja2luZ19sb2dzIGtoaSB0cuG6oW5nIHRow6FpIHRoYW5oIHRvw6FuIHRoYXkgxJHhu5VpXG4gICAgaWYgKChwYXltZW50U3RhdHVzICYmIHBheW1lbnRTdGF0dXMgIT09IG9sZFBheW1lbnRTdGF0dXMpIHx8IFxuICAgICAgICAoaXNQYWlkICE9PSB1bmRlZmluZWQgJiYgaXNQYWlkICE9PSBvbGRJc1BhaWQpKSB7XG4gICAgICBcbiAgICAgIC8vIEto4bufaSB04bqhbyB0cmFja2luZyBvYmplY3QgbuG6v3UgY2jGsGEgY8OzXG4gICAgICBpZiAoIW9yZGVyLnRyYWNraW5nKSB7XG4gICAgICAgIG9yZGVyLnRyYWNraW5nID0geyBzdGF0dXNfbmFtZTogXCJcIiwgdHJhY2tpbmdfbG9nczogW10gfTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gVOG6oW8gc3RhdHVzX25hbWUgdGhlbyB0cuG6oW5nIHRow6FpIHRoYW5oIHRvw6FuIG3hu5tpXG4gICAgICBsZXQgc3RhdHVzTmFtZSA9IFwiXCI7XG4gICAgICBpZiAocGF5bWVudFN0YXR1cykge1xuICAgICAgICBzd2l0Y2ggKHBheW1lbnRTdGF0dXMpIHtcbiAgICAgICAgICBjYXNlICdwZW5kaW5nJzogc3RhdHVzTmFtZSA9IFwiQ2jhu50gdGhhbmggdG/DoW5cIjsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnY29tcGxldGVkJzogc3RhdHVzTmFtZSA9IFwixJDDoyB0aGFuaCB0b8OhblwiOyBicmVhaztcbiAgICAgICAgICBjYXNlICdmYWlsZWQnOiBzdGF0dXNOYW1lID0gXCJUaGFuaCB0b8OhbiB0aOG6pXQgYuG6oWlcIjsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAncmVmdW5kZWQnOiBzdGF0dXNOYW1lID0gXCLEkMOjIGhvw6BuIHRp4buBblwiOyBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OiBzdGF0dXNOYW1lID0gYFRy4bqhbmcgdGjDoWkgdGhhbmggdG/DoW46ICR7cGF5bWVudFN0YXR1c31gO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGlzUGFpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHN0YXR1c05hbWUgPSBpc1BhaWQgPyBcIsSQw6MgdGhhbmggdG/DoW5cIiA6IFwiQ2jGsGEgdGhhbmggdG/DoW5cIjtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gVGjDqm0gYuG6o24gZ2hpIG3hu5tpIHbDoG8gxJHhuqd1IG3huqNuZyB0cmFja2luZ19sb2dzXG4gICAgICBjb25zdCBuZXdUcmFja2luZ0xvZyA9IHtcbiAgICAgICAgc3RhdHVzOiBvcmRlci5zdGF0dXMsXG4gICAgICAgIHN0YXR1c19uYW1lOiBzdGF0dXNOYW1lIHx8IFwiQ+G6rXAgbmjhuq10IHRoYW5oIHRvw6FuXCIsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICBsb2NhdGlvbjogXCJD4butYSBow6BuZyBETkMgRk9PRFwiLFxuICAgICAgfTtcbiAgICAgIFxuICAgICAgLy8gS2jhu59pIHThuqFvIG3huqNuZyB0cmFja2luZ19sb2dzIG7hur91IGNoxrBhIGPDs1xuICAgICAgaWYgKCFvcmRlci50cmFja2luZy50cmFja2luZ19sb2dzKSB7XG4gICAgICAgIG9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3MgPSBbXTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gVGjDqm0gbG9nIG3hu5tpIHbDoG8gxJHhuqd1IG3huqNuZyAoxJHhu4MgbG9nIG3hu5tpIG5o4bqldCBu4bqxbSDEkeG6p3UgdGnDqm4pXG4gICAgICBvcmRlci50cmFja2luZy50cmFja2luZ19sb2dzLnVuc2hpZnQobmV3VHJhY2tpbmdMb2cpO1xuICAgICAgXG4gICAgICAvLyBMxrB1IHRyYWNraW5nIHbDoG8gdXBkYXRlRGF0YSDEkeG7gyBj4bqtcCBuaOG6rXRcbiAgICAgIHVwZGF0ZURhdGEudHJhY2tpbmcgPSBvcmRlci50cmFja2luZztcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgb3JkZXIgaW4gZGF0YWJhc2VcbiAgICBjb25zdCB1cGRhdGVkT3JkZXIgPSBhd2FpdCBPcmRlci5maW5kQnlJZEFuZFVwZGF0ZShcbiAgICAgIGlkLFxuICAgICAgeyAkc2V0OiB1cGRhdGVEYXRhIH0sXG4gICAgICB7IG5ldzogdHJ1ZSB9XG4gICAgKS5wb3B1bGF0ZShcInVzZXJJZFwiKS5wb3B1bGF0ZShcInByb2R1Y3RzLnByb2R1Y3RJZFwiKTtcblxuICAgIC8vIEhhbmRsZSBpbnZlbnRvcnkgYW5kIHNhbGVzIGRhdGEgaWYgbmV3bHkgcGFpZFxuICAgIGlmIChpc1BhaWQgJiYgIW9sZElzUGFpZCkge1xuICAgICAgLy8gVXBkYXRlIGJlc3RzZWxsaW5nIHByb2R1Y3RzXG4gICAgICB0cnkge1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdXBkYXRlZE9yZGVyLnByb2R1Y3RzKSB7XG4gICAgICAgICAgaWYgKGl0ZW0ucHJvZHVjdElkKSB7XG4gICAgICAgICAgICBhd2FpdCBCZXN0U2VsbGluZ1Byb2R1Y3QudXBkYXRlU2FsZXNEYXRhKFxuICAgICAgICAgICAgICBpdGVtLnByb2R1Y3RJZC5faWQsXG4gICAgICAgICAgICAgIGl0ZW0ucHJvZHVjdElkLFxuICAgICAgICAgICAgICBpdGVtLnF1YW50aXR5LFxuICAgICAgICAgICAgICBpZFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciB1cGRhdGluZyBiZXN0c2VsbGluZyBwcm9kdWN0czpcIiwgZXJyb3IpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEfhu61pIHRow7RuZyBiw6FvIGtoaSBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSB0aGFuaCB0b8OhblxuICAgIGlmICh1cGRhdGVkT3JkZXIudXNlcklkICYmIFxuICAgICAgICAoKHBheW1lbnRTdGF0dXMgJiYgcGF5bWVudFN0YXR1cyAhPT0gb2xkUGF5bWVudFN0YXR1cykgfHwgXG4gICAgICAgIChpc1BhaWQgIT09IHVuZGVmaW5lZCAmJiBpc1BhaWQgIT09IG9sZElzUGFpZCkpKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBzZW5kT3JkZXJTdGF0dXNOb3RpZmljYXRpb24odXBkYXRlZE9yZGVyLnVzZXJJZCwgdXBkYXRlZE9yZGVyLCBnZXRTdGF0dXNUZXh0KHVwZGF0ZWRPcmRlci5zdGF0dXMpKTtcbiAgICAgICAgY29uc29sZS5sb2coYMSQw6MgZ+G7rWkgdGjDtG5nIGLDoW8gY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgdGhhbmggdG/DoW4gxJHGoW4gaMOgbmcgJHt1cGRhdGVkT3JkZXIub3JkZXJDb2RlfSDEkeG6v24gdXNlciAke3VwZGF0ZWRPcmRlci51c2VySWR9YCk7XG4gICAgICB9IGNhdGNoIChub3RpZmljYXRpb25FcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdM4buXaSBraGkgZ+G7rWkgdGjDtG5nIGLDoW8gY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgdGhhbmggdG/DoW46Jywgbm90aWZpY2F0aW9uRXJyb3IpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IFwiT3JkZXIgcGF5bWVudCBzdGF0dXMgdXBkYXRlZCBzdWNjZXNzZnVsbHlcIixcbiAgICAgIGRhdGE6IHVwZGF0ZWRPcmRlclxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciB1cGRhdGluZyBwYXltZW50IHN0YXR1czpcIiwgZXJyb3IpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IFwiRXJyb3IgdXBkYXRpbmcgcGF5bWVudCBzdGF0dXNcIixcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlXG4gICAgfSk7XG4gIH1cbn07XG5cbi8vIFRow6ptIGNvbnRyb2xsZXIgZnVuY3Rpb24gbeG7m2kgxJHhu4MgZ+G7rWkgZW1haWwgeMOhYyBuaOG6rW4gxJHGoW4gaMOgbmdcbmV4cG9ydCBjb25zdCBub3RpZnlPcmRlclN1Y2Nlc3MgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBvcmRlcklkID0gcmVxLnBhcmFtcy5pZDtcbiAgICBjb25zdCB7IGVtYWlsLCBmdWxsTmFtZSwgcGhvbmUsIGFkZHJlc3MgfSA9IHJlcS5ib2R5O1xuICAgIFxuICAgIGNvbnNvbGUubG9nKGA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PWApO1xuICAgIGNvbnNvbGUubG9nKGBOT1RJRlkgT1JERVIgU1VDQ0VTUyAtIEFUVEVNUFRJTkcgVE8gU0VORCBFTUFJTGApO1xuICAgIGNvbnNvbGUubG9nKGBPcmRlciBJRDogJHtvcmRlcklkfWApO1xuICAgIGNvbnNvbGUubG9nKGBFbWFpbCBkYXRhOmAsIHsgZW1haWwsIGZ1bGxOYW1lLCBwaG9uZSwgYWRkcmVzcyB9KTtcbiAgICBcbiAgICAvLyBM4bqleSB0aMO0bmcgdGluIMSRxqFuIGjDoG5nXG4gICAgY29uc3Qgb3JkZXIgPSBhd2FpdCBPcmRlci5maW5kQnlJZChvcmRlcklkKVxuICAgICAgLnBvcHVsYXRlKFwidXNlcklkXCIpXG4gICAgICAucG9wdWxhdGUoXCJwcm9kdWN0cy5wcm9kdWN0SWRcIik7XG4gICAgXG4gICAgaWYgKCFvcmRlcikge1xuICAgICAgY29uc29sZS5sb2coYE9yZGVyIG5vdCBmb3VuZCB3aXRoIElEOiAke29yZGVySWR9YCk7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgxJHGoW4gaMOgbmdcIlxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIGNvbnNvbGUubG9nKGBPcmRlciBmb3VuZDpgLCB7XG4gICAgICBvcmRlckNvZGU6IG9yZGVyLm9yZGVyQ29kZSxcbiAgICAgIHVzZXJJZDogb3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC5faWQgPyBvcmRlci51c2VySWQuX2lkIDogdW5kZWZpbmVkLFxuICAgICAgdXNlckVtYWlsOiBvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLmVtYWlsID8gb3JkZXIudXNlcklkLmVtYWlsIDogdW5kZWZpbmVkLFxuICAgICAgdG90YWxBbW91bnQ6IG9yZGVyLnRvdGFsQW1vdW50XG4gICAgfSk7XG4gICAgXG4gICAgLy8gVOG6oW8gdGjDtG5nIHRpbiBnaWFvIGjDoG5nIGNobyBlbWFpbFxuICAgIGNvbnN0IHNoaXBwaW5nSW5mbyA9IHtcbiAgICAgIGZ1bGxOYW1lOiBmdWxsTmFtZSB8fCAoKG9yZGVyLnVzZXJJZCAmJiBvcmRlci51c2VySWQuZmlyc3ROYW1lID8gYCR7b3JkZXIudXNlcklkLmZpcnN0TmFtZSB8fCAnJ30gJHtvcmRlci51c2VySWQubGFzdE5hbWUgfHwgJyd9YC50cmltKCkgOiAnJykpLFxuICAgICAgYWRkcmVzczogYWRkcmVzcyB8fCBvcmRlci5hZGRyZXNzIHx8IChvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLmFkZHJlc3MgPyBvcmRlci51c2VySWQuYWRkcmVzcyA6ICcnKSxcbiAgICAgIHBob25lOiBwaG9uZSB8fCAob3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC5waG9uZSA/IG9yZGVyLnVzZXJJZC5waG9uZSA6ICcnKSxcbiAgICAgIGVtYWlsOiBlbWFpbCB8fCAob3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC5lbWFpbCA/IG9yZGVyLnVzZXJJZC5lbWFpbCA6ICcnKVxuICAgIH07XG4gICAgXG4gICAgY29uc29sZS5sb2coYFNoaXBwaW5nIGluZm8gcHJlcGFyZWQ6YCwgc2hpcHBpbmdJbmZvKTtcbiAgICBcbiAgICAvLyDEkOG6o20gYuG6o28gY8OzIGVtYWlsIHRyb25nIHNoaXBwaW5nSW5mb1xuICAgIGlmICghc2hpcHBpbmdJbmZvLmVtYWlsKSB7XG4gICAgICBjb25zb2xlLmxvZyhgRVJST1I6IE5vIGVtYWlsIHByb3ZpZGVkIGluIHJlcXVlc3Qgb3IgZm91bmQgaW4gb3JkZXJgKTtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIlRoaeG6v3UgxJHhu4thIGNo4buJIGVtYWlsIMSR4buDIGfhu61pIHjDoWMgbmjhuq1uIMSRxqFuIGjDoG5nXCJcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyBH4bqvbiB0aMO0bmcgdGluIGdpYW8gaMOgbmcgdsOgbyDEkcahbiBow6BuZ1xuICAgIG9yZGVyLnNoaXBwaW5nSW5mbyA9IHNoaXBwaW5nSW5mbztcbiAgICBcbiAgICAvLyBMxrB1IGzhuqFpIHRow7RuZyB0aW4gc2hpcHBpbmdJbmZvIHbDoG8gxJHGoW4gaMOgbmcgxJHhu4Mgc+G7rSBk4bulbmcgc2F1IG7DoHlcbiAgICB0cnkge1xuICAgICAgYXdhaXQgT3JkZXIuZmluZEJ5SWRBbmRVcGRhdGUob3JkZXJJZCwgeyBzaGlwcGluZ0luZm86IHNoaXBwaW5nSW5mbyB9KTtcbiAgICAgIGNvbnNvbGUubG9nKGBVcGRhdGVkIG9yZGVyIHdpdGggc2hpcHBpbmdJbmZvYCk7XG4gICAgfSBjYXRjaCAodXBkYXRlRXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBXYXJuaW5nOiBDb3VsZCBub3QgdXBkYXRlIG9yZGVyIHdpdGggc2hpcHBpbmdJbmZvOiAke3VwZGF0ZUVycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAvLyBUaeG6v3AgdOG7pWMgdGjhu7FjIGhp4buHbiBn4butaSBlbWFpbCBt4bq3YyBkw7kga2jDtG5nIGPhuq1wIG5o4bqtdCDEkcaw4bujYyBvcmRlclxuICAgIH1cbiAgICBcbiAgICAvLyBH4butaSBlbWFpbCB4w6FjIG5o4bqtbiDEkcahbiBow6BuZ1xuICAgIGNvbnNvbGUubG9nKGBBdHRlbXB0aW5nIHRvIHNlbmQgY29uZmlybWF0aW9uIGVtYWlsIHRvOiAke3NoaXBwaW5nSW5mby5lbWFpbH1gKTtcbiAgICBcbiAgICBjb25zdCBlbWFpbFNlbnQgPSBhd2FpdCBzZW5kT3JkZXJDb25maXJtYXRpb25FbWFpbChvcmRlcik7XG4gICAgY29uc29sZS5sb2coYEVtYWlsIHNlbnQgcmVzdWx0OiAke2VtYWlsU2VudCA/IFwiU1VDQ0VTU1wiIDogXCJGQUlMRURcIn1gKTtcbiAgICBcbiAgICBpZiAoZW1haWxTZW50KSB7XG4gICAgICBjb25zb2xlLmxvZyhgRW1haWwgc3VjY2Vzc2Z1bGx5IHNlbnQgdG86ICR7c2hpcHBpbmdJbmZvLmVtYWlsfWApO1xuICAgICAgY29uc29sZS5sb2coYD09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09YCk7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBtZXNzYWdlOiBcIkVtYWlsIHjDoWMgbmjhuq1uIMSRxqFuIGjDoG5nIMSRw6MgxJHGsOG7o2MgZ+G7rWkgdGjDoG5oIGPDtG5nXCJcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZyhgRmFpbGVkIHRvIHNlbmQgZW1haWwgdG86ICR7c2hpcHBpbmdJbmZvLmVtYWlsfWApO1xuICAgICAgY29uc29sZS5sb2coYD09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09YCk7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdGjhu4MgZ+G7rWkgZW1haWwgeMOhYyBuaOG6rW4gxJHGoW4gaMOgbmdcIlxuICAgICAgfSk7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBpbiBub3RpZnlPcmRlclN1Y2Nlc3M6XCIsIGVycm9yKTtcbiAgICBjb25zb2xlLmxvZyhgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1gKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBcIsSQw6MgeOG6o3kgcmEgbOG7l2kga2hpIGfhu61pIGVtYWlsIHjDoWMgbmjhuq1uIMSRxqFuIGjDoG5nXCIsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxuICAgIH0pO1xuICB9XG59O1xuXG4vLyBIw6BtIGzhuqV5IHRvcCDEkcahbiBow6BuZyBjw7MgZ2nDoSB0cuG7iyBjYW8gbmjhuqV0XG5leHBvcnQgY29uc3QgZ2V0VG9wT3JkZXJzID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgbGltaXQgPSBwYXJzZUludChyZXEucXVlcnkubGltaXQpIHx8IDEwOyAvLyBN4bq3YyDEkeG7i25oIGzhuqV5IHRvcCAxMCDEkcahbiBow6BuZ1xuXG4gICAgLy8gVMOsbSDEkcahbiBow6BuZyB2w6Agc+G6r3AgeOG6v3AgdGhlbyB0b3RhbEFtb3VudCBnaeG6o20gZOG6p25cbiAgICBjb25zdCB0b3BPcmRlcnMgPSBhd2FpdCBPcmRlci5maW5kKClcbiAgICAgIC5wb3B1bGF0ZShcInVzZXJJZFwiLCBcImZpcnN0TmFtZSBsYXN0TmFtZSBlbWFpbCB1c2VyTmFtZVwiKVxuICAgICAgLnNvcnQoeyB0b3RhbEFtb3VudDogLTEgfSlcbiAgICAgIC5saW1pdChsaW1pdCk7XG5cbiAgICAvLyDEkOG7i25oIGThuqFuZyBs4bqhaSBk4buvIGxp4buHdSDEkeG7gyBwaMO5IGjhu6NwIHbhu5tpIGPhuqV1IHRyw7pjIGhp4buDbiB0aOG7i1xuICAgIGNvbnN0IGZvcm1hdHRlZE9yZGVycyA9IHRvcE9yZGVycy5tYXAob3JkZXIgPT4ge1xuICAgICAgLy8gxJDhu4tuaCBk4bqhbmcgdMOqbiBraMOhY2ggaMOgbmdcbiAgICAgIGxldCBjdXN0b21lck5hbWUgPSAnS2jDoWNoIGjDoG5nJztcbiAgICAgIGlmIChvcmRlci51c2VySWQpIHtcbiAgICAgICAgaWYgKG9yZGVyLnVzZXJJZC5maXJzdE5hbWUgfHwgb3JkZXIudXNlcklkLmxhc3ROYW1lKSB7XG4gICAgICAgICAgY3VzdG9tZXJOYW1lID0gYCR7b3JkZXIudXNlcklkLmZpcnN0TmFtZSB8fCAnJ30gJHtvcmRlci51c2VySWQubGFzdE5hbWUgfHwgJyd9YC50cmltKCk7XG4gICAgICAgIH0gZWxzZSBpZiAob3JkZXIudXNlcklkLnVzZXJOYW1lKSB7XG4gICAgICAgICAgY3VzdG9tZXJOYW1lID0gb3JkZXIudXNlcklkLnVzZXJOYW1lO1xuICAgICAgICB9IGVsc2UgaWYgKG9yZGVyLnVzZXJJZC5lbWFpbCkge1xuICAgICAgICAgIGN1c3RvbWVyTmFtZSA9IG9yZGVyLnVzZXJJZC5lbWFpbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyDEkOG7i25oIGThuqFuZyBuZ8OgeSDEkeG6t3QgaMOgbmdcbiAgICAgIGNvbnN0IG9yZGVyRGF0ZSA9IG9yZGVyLmNyZWF0ZWRBdCA/IG5ldyBEYXRlKG9yZGVyLmNyZWF0ZWRBdCkgOiBuZXcgRGF0ZSgpO1xuICAgICAgY29uc3QgZm9ybWF0dGVkRGF0ZSA9IGAke29yZGVyRGF0ZS5nZXREYXRlKCl9LyR7b3JkZXJEYXRlLmdldE1vbnRoKCkgKyAxfS8ke29yZGVyRGF0ZS5nZXRGdWxsWWVhcigpfWA7XG5cbiAgICAgIC8vIENodXnhu4NuIMSR4buVaSB0cuG6oW5nIHRow6FpIHNhbmcgdGnhur9uZyBWaeG7h3RcbiAgICAgIGxldCBzdGF0dXNUZXh0ID0gJ8SQYW5nIHjhu60gbMO9JztcbiAgICAgIHN3aXRjaChvcmRlci5zdGF0dXMpIHtcbiAgICAgICAgY2FzZSAncGVuZGluZyc6IHN0YXR1c1RleHQgPSAnxJBhbmcgeOG7rSBsw70nOyBicmVhaztcbiAgICAgICAgY2FzZSAnY29uZmlybWVkJzogc3RhdHVzVGV4dCA9ICfEkMOjIHjDoWMgbmjhuq1uJzsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3Byb2Nlc3NpbmcnOiBzdGF0dXNUZXh0ID0gJ8SQYW5nIHjhu60gbMO9JzsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3NoaXBwaW5nJzogc3RhdHVzVGV4dCA9ICfEkGFuZyB24bqtbiBjaHV54buDbic7IGJyZWFrO1xuICAgICAgICBjYXNlICdkZWxpdmVyaW5nJzogc3RhdHVzVGV4dCA9ICfEkGFuZyBnaWFvIGjDoG5nJzsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2RlbGl2ZXJlZCc6IHN0YXR1c1RleHQgPSAnxJDDoyBnaWFvIGjDoG5nJzsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2NvbXBsZXRlZCc6IHN0YXR1c1RleHQgPSAnxJDDoyBob8OgbiB0aMOgbmgnOyBicmVhaztcbiAgICAgICAgY2FzZSAnY2FuY2VsbGVkJzogc3RhdHVzVGV4dCA9ICfEkMOjIGjhu6d5JzsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2F3YWl0aW5nX3BheW1lbnQnOiBzdGF0dXNUZXh0ID0gJ0No4budIHRoYW5oIHRvw6FuJzsgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6IHN0YXR1c1RleHQgPSBvcmRlci5zdGF0dXM7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlkOiBvcmRlci5vcmRlckNvZGUgfHwgb3JkZXIuX2lkLFxuICAgICAgICBjdXN0b21lcjogY3VzdG9tZXJOYW1lLFxuICAgICAgICB0b3RhbDogb3JkZXIudG90YWxBbW91bnQsXG4gICAgICAgIHN0YXR1czogc3RhdHVzVGV4dCxcbiAgICAgICAgZGF0ZTogZm9ybWF0dGVkRGF0ZVxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKGZvcm1hdHRlZE9yZGVycyk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignTOG7l2kga2hpIGzhuqV5IGRhbmggc8OhY2ggxJHGoW4gaMOgbmcgZ2nDoSB0cuG7iyBjYW8gbmjhuqV0OicsIGVycm9yKTtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IFxuICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgbWVzc2FnZTogJ0zhu5dpIGtoaSBs4bqleSBkYW5oIHPDoWNoIMSRxqFuIGjDoG5nIGdpw6EgdHLhu4sgY2FvIG5o4bqldCcsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSBcbiAgICB9KTtcbiAgfVxufTtcblxuLy8gSMOgbSBs4bqleSB0aOG7kW5nIGvDqiDEkcahbiBow6BuZ1xuZXhwb3J0IGNvbnN0IGdldE9yZGVyU3RhdHMgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwZXJpb2QgPSByZXEucXVlcnkucGVyaW9kIHx8ICd3ZWVrJzsgLy8gTeG6t2MgxJHhu4tuaCBsw6AgdHXhuqduXG4gICAgY29uc3Qgc3RhcnREYXRlID0gbmV3IERhdGUoKTtcbiAgICBsZXQgZW5kRGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgXG4gICAgLy8gVGhp4bq/dCBs4bqtcCBraG/huqNuZyB0aOG7nWkgZ2lhbiBk4buxYSB0csOqbiBwZXJpb2RcbiAgICBzd2l0Y2ggKHBlcmlvZCkge1xuICAgICAgY2FzZSAnd2Vlayc6XG4gICAgICAgIHN0YXJ0RGF0ZS5zZXREYXRlKHN0YXJ0RGF0ZS5nZXREYXRlKCkgLSA3KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtb250aCc6XG4gICAgICAgIHN0YXJ0RGF0ZS5zZXREYXRlKHN0YXJ0RGF0ZS5nZXREYXRlKCkgLSAzMCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAneWVhcic6XG4gICAgICAgIHN0YXJ0RGF0ZS5zZXREYXRlKHN0YXJ0RGF0ZS5nZXREYXRlKCkgLSAzNjUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHN0YXJ0RGF0ZS5zZXREYXRlKHN0YXJ0RGF0ZS5nZXREYXRlKCkgLSA3KTtcbiAgICB9XG4gICAgXG4gICAgLy8gTOG6pXkgdGjhu5FuZyBrw6ogc+G7kSBsxrDhu6NuZyDEkcahbiBow6BuZyB0aGVvIHRy4bqhbmcgdGjDoWlcbiAgICBjb25zdCBwZW5kaW5nQ291bnQgPSBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cyh7IFxuICAgICAgc3RhdHVzOiB7ICRpbjogWydwZW5kaW5nJywgJ3Byb2Nlc3NpbmcnLCAnYXdhaXRpbmdfcGF5bWVudCddIH0sXG4gICAgICBjcmVhdGVkQXQ6IHsgJGd0ZTogc3RhcnREYXRlLCAkbHRlOiBlbmREYXRlIH0gIFxuICAgIH0pO1xuICAgIFxuICAgIGNvbnN0IHNoaXBwaW5nQ291bnQgPSBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cyh7IFxuICAgICAgc3RhdHVzOiB7ICRpbjogWydzaGlwcGluZycsICdkZWxpdmVyaW5nJ10gfSxcbiAgICAgIGNyZWF0ZWRBdDogeyAkZ3RlOiBzdGFydERhdGUsICRsdGU6IGVuZERhdGUgfSAgXG4gICAgfSk7XG4gICAgXG4gICAgY29uc3QgY29tcGxldGVkQ291bnQgPSBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cyh7IFxuICAgICAgc3RhdHVzOiAnY29tcGxldGVkJyxcbiAgICAgIGNyZWF0ZWRBdDogeyAkZ3RlOiBzdGFydERhdGUsICRsdGU6IGVuZERhdGUgfSAgXG4gICAgfSk7XG4gICAgXG4gICAgY29uc3QgY2FuY2VsbGVkQ291bnQgPSBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cyh7IFxuICAgICAgc3RhdHVzOiAnY2FuY2VsbGVkJyxcbiAgICAgIGNyZWF0ZWRBdDogeyAkZ3RlOiBzdGFydERhdGUsICRsdGU6IGVuZERhdGUgfSAgXG4gICAgfSk7XG4gICAgXG4gICAgLy8gVMOtbmggdOG7lW5nIHPhu5EgxJHGoW4gaMOgbmdcbiAgICBjb25zdCB0b3RhbE9yZGVycyA9IHBlbmRpbmdDb3VudCArIHNoaXBwaW5nQ291bnQgKyBjb21wbGV0ZWRDb3VudCArIGNhbmNlbGxlZENvdW50O1xuICAgIFxuICAgIC8vIEThu68gbGnhu4d1IGNobyBiaeG7g3UgxJHhu5MgdHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZ1xuICAgIGNvbnN0IG9yZGVyU3RhdHVzID0gW1xuICAgICAgeyBuYW1lOiAnxJBhbmcgeOG7rSBsw70nLCB2YWx1ZTogcGVuZGluZ0NvdW50IH0sXG4gICAgICB7IG5hbWU6ICfEkGFuZyBnaWFvJywgdmFsdWU6IHNoaXBwaW5nQ291bnQgfSxcbiAgICAgIHsgbmFtZTogJ8SQw6MgZ2lhbycsIHZhbHVlOiBjb21wbGV0ZWRDb3VudCB9LFxuICAgICAgeyBuYW1lOiAnxJDDoyBo4buneScsIHZhbHVlOiBjYW5jZWxsZWRDb3VudCB9XG4gICAgXTtcbiAgICBcbiAgICAvLyBUw61uaCB0b8OhbiB0aOG7nWkgZ2lhbiB44butIGzDvSB0cnVuZyBiw6xuaCBk4buxYSB0csOqbiBk4buvIGxp4buHdSB0aOG7sWMgdOG6v1xuICAgIGxldCBwcm9jZXNzaW5nVGltZSA9IFtdO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICAvLyBM4bqleSDEkcahbiBow6BuZyDEkcOjIGhvw6BuIHRow6BuaCDEkeG7gyB0w61uaCB0aOG7nWkgZ2lhbiB44butIGzDvVxuICAgICAgY29uc3QgY29tcGxldGVkT3JkZXJzID0gYXdhaXQgT3JkZXIuZmluZCh7XG4gICAgICAgIHN0YXR1czogJ2NvbXBsZXRlZCcsXG4gICAgICAgIGNyZWF0ZWRBdDogeyAkZ3RlOiBzdGFydERhdGUsICRsdGU6IGVuZERhdGUgfSxcbiAgICAgICAgY29tcGxldGVkQXQ6IHsgJGV4aXN0czogdHJ1ZSB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgaWYgKGNvbXBsZXRlZE9yZGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIFTDrW5oIHThu5VuZyB0aOG7nWkgZ2lhbiB44butIGzDvVxuICAgICAgICBsZXQgdG90YWxQcm9jZXNzaW5nVGltZSA9IDA7XG4gICAgICAgIGxldCB0b3RhbFNoaXBwaW5nVGltZSA9IDA7XG4gICAgICAgIGxldCB0b3RhbFRvdGFsVGltZSA9IDA7XG4gICAgICAgIFxuICAgICAgICBjb21wbGV0ZWRPcmRlcnMuZm9yRWFjaChvcmRlciA9PiB7XG4gICAgICAgICAgLy8gTuG6v3UgY8OzIHRyYWNraW5nIGxvZ3MsIHPhu60gZOG7pW5nIGNow7puZyDEkeG7gyB0w61uaCB0aOG7nWkgZ2lhbiBjaMOtbmggeMOhYyBoxqFuXG4gICAgICAgICAgaWYgKG9yZGVyLnRyYWNraW5nICYmIEFycmF5LmlzQXJyYXkob3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncykgJiYgb3JkZXIudHJhY2tpbmcudHJhY2tpbmdfbG9ncy5sZW5ndGggPj0gMikge1xuICAgICAgICAgICAgY29uc3QgbG9ncyA9IG9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3M7XG4gICAgICAgICAgICAvLyBT4bqvcCB44bq/cCBsb2dzIHRoZW8gdGjhu51pIGdpYW5cbiAgICAgICAgICAgIGxvZ3Muc29ydCgoYSwgYikgPT4gbmV3IERhdGUoYS50aW1lc3RhbXApIC0gbmV3IERhdGUoYi50aW1lc3RhbXApKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gVMOtbmggdGjhu51pIGdpYW4gdOG7qyB04bqhbyDEkcahbiDEkeG6v24gxJHDs25nIGfDs2lcbiAgICAgICAgICAgIGNvbnN0IHBhY2thZ2luZ0xvZyA9IGxvZ3MuZmluZChsb2cgPT4gbG9nLnN0YXR1cyA9PT0gJ3BhY2thZ2luZycgfHwgbG9nLnN0YXR1c19uYW1lLmluY2x1ZGVzKCfEkcOzbmcgZ8OzaScpKTtcbiAgICAgICAgICAgIGlmIChwYWNrYWdpbmdMb2cpIHtcbiAgICAgICAgICAgICAgY29uc3QgcGFja2FnaW5nVGltZSA9IChuZXcgRGF0ZShwYWNrYWdpbmdMb2cudGltZXN0YW1wKSAtIG5ldyBEYXRlKG9yZGVyLmNyZWF0ZWRBdCkpIC8gKDEwMDAgKiA2MCk7IC8vIFBow7p0XG4gICAgICAgICAgICAgIHRvdGFsUHJvY2Vzc2luZ1RpbWUgKz0gcGFja2FnaW5nVGltZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gVMOtbmggdGjhu51pIGdpYW4gdOG7qyDEkcOzbmcgZ8OzaSDEkeG6v24gZ2lhbyBow6BuZ1xuICAgICAgICAgICAgY29uc3Qgc2hpcHBpbmdMb2cgPSBsb2dzLmZpbmQobG9nID0+IGxvZy5zdGF0dXMgPT09ICdzaGlwcGluZycgfHwgbG9nLnN0YXR1cyA9PT0gJ2RlbGl2ZXJpbmcnKTtcbiAgICAgICAgICAgIGNvbnN0IGRlbGl2ZXJlZExvZyA9IGxvZ3MuZmluZChsb2cgPT4gbG9nLnN0YXR1cyA9PT0gJ2RlbGl2ZXJlZCcgfHwgbG9nLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoc2hpcHBpbmdMb2cgJiYgZGVsaXZlcmVkTG9nKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGRlbGl2ZXJ5VGltZSA9IChuZXcgRGF0ZShkZWxpdmVyZWRMb2cudGltZXN0YW1wKSAtIG5ldyBEYXRlKHNoaXBwaW5nTG9nLnRpbWVzdGFtcCkpIC8gKDEwMDAgKiA2MCk7XG4gICAgICAgICAgICAgIHRvdGFsU2hpcHBpbmdUaW1lICs9IGRlbGl2ZXJ5VGltZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gVMOtbmggdOG7lW5nIHRo4budaSBnaWFuIHThu6sgdOG6oW8gxJHGoW4gxJHhur9uIGhvw6BuIHRow6BuaFxuICAgICAgICAgICAgdG90YWxUb3RhbFRpbWUgKz0gKG5ldyBEYXRlKG9yZGVyLmNvbXBsZXRlZEF0KSAtIG5ldyBEYXRlKG9yZGVyLmNyZWF0ZWRBdCkpIC8gKDEwMDAgKiA2MCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIE7hur91IGtow7RuZyBjw7MgdHJhY2tpbmcgbG9ncywgc+G7rSBk4bulbmcgY3JlYXRlZEF0IHbDoCBjb21wbGV0ZWRBdFxuICAgICAgICAgICAgY29uc3QgdG90YWxUaW1lID0gKG5ldyBEYXRlKG9yZGVyLmNvbXBsZXRlZEF0KSAtIG5ldyBEYXRlKG9yZGVyLmNyZWF0ZWRBdCkpIC8gKDEwMDAgKiA2MCk7XG4gICAgICAgICAgICB0b3RhbFRvdGFsVGltZSArPSB0b3RhbFRpbWU7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEdp4bqjIMSR4buLbmggdOG7tyBs4buHIHRo4budaSBnaWFuIGNobyB04burbmcgZ2lhaSDEkW/huqFuXG4gICAgICAgICAgICB0b3RhbFByb2Nlc3NpbmdUaW1lICs9IHRvdGFsVGltZSAqIDAuMzsgLy8gMzAlIHRo4budaSBnaWFuIGNobyB44butIGzDvVxuICAgICAgICAgICAgdG90YWxTaGlwcGluZ1RpbWUgKz0gdG90YWxUaW1lICogMC43OyAvLyA3MCUgdGjhu51pIGdpYW4gY2hvIHbhuq1uIGNodXnhu4NuXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIFTDrW5oIHRo4budaSBnaWFuIHRydW5nIGLDrG5oXG4gICAgICAgIGNvbnN0IGF2Z1Byb2Nlc3NpbmdUaW1lID0gTWF0aC5yb3VuZCh0b3RhbFByb2Nlc3NpbmdUaW1lIC8gY29tcGxldGVkT3JkZXJzLmxlbmd0aCk7XG4gICAgICAgIGNvbnN0IGF2Z1NoaXBwaW5nVGltZSA9IE1hdGgucm91bmQodG90YWxTaGlwcGluZ1RpbWUgLyBjb21wbGV0ZWRPcmRlcnMubGVuZ3RoKTtcbiAgICAgICAgY29uc3QgYXZnVG90YWxUaW1lID0gTWF0aC5yb3VuZCh0b3RhbFRvdGFsVGltZSAvIGNvbXBsZXRlZE9yZGVycy5sZW5ndGgpO1xuICAgICAgICBcbiAgICAgICAgcHJvY2Vzc2luZ1RpbWUgPSBbXG4gICAgICAgICAgeyBuYW1lOiAnWMOhYyBuaOG6rW4gJiDEkMOzbmcgZ8OzaScsIHRpbWU6IGF2Z1Byb2Nlc3NpbmdUaW1lIHx8IDE1IH0sXG4gICAgICAgICAgeyBuYW1lOiAnVuG6rW4gY2h1eeG7g24nLCB0aW1lOiBhdmdTaGlwcGluZ1RpbWUgfHwgNDUgfSxcbiAgICAgICAgICB7IG5hbWU6ICdU4buVbmcgdGjhu51pIGdpYW4nLCB0aW1lOiBhdmdUb3RhbFRpbWUgfHwgNjAgfVxuICAgICAgICBdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gTuG6v3Uga2jDtG5nIGPDsyDEkcahbiBow6BuZyBob8OgbiB0aMOgbmgsIHPhu60gZOG7pW5nIGThu68gbGnhu4d1IG3huqt1XG4gICAgICAgIHByb2Nlc3NpbmdUaW1lID0gW1xuICAgICAgICAgIHsgbmFtZTogJ1jDoWMgbmjhuq1uJywgdGltZTogMTUgfSxcbiAgICAgICAgICB7IG5hbWU6ICfEkMOzbmcgZ8OzaScsIHRpbWU6IDMwIH0sXG4gICAgICAgICAgeyBuYW1lOiAnVuG6rW4gY2h1eeG7g24nLCB0aW1lOiA0NSB9XG4gICAgICAgIF07XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0zhu5dpIGtoaSB0w61uaCB0b8OhbiB0aOG7nWkgZ2lhbiB44butIGzDvSB0cnVuZyBiw6xuaDonLCBlcnJvcik7XG4gICAgICAvLyBE4buvIGxp4buHdSBt4bqrdSBraGkgY8OzIGzhu5dpXG4gICAgICBwcm9jZXNzaW5nVGltZSA9IFtcbiAgICAgICAgeyBuYW1lOiAnWMOhYyBuaOG6rW4nLCB0aW1lOiAxNSB9LFxuICAgICAgICB7IG5hbWU6ICfEkMOzbmcgZ8OzaScsIHRpbWU6IDMwIH0sXG4gICAgICAgIHsgbmFtZTogJ1bhuq1uIGNodXnhu4NuJywgdGltZTogNDUgfVxuICAgICAgXTtcbiAgICB9XG4gICAgXG4gICAgLy8gTOG6pXkgZGFuaCBzw6FjaCB0b3AgMTAgxJHGoW4gaMOgbmcgZ2nDoSB0cuG7iyBjYW8gbmjhuqV0XG4gICAgY29uc3QgdG9wT3JkZXJzID0gYXdhaXQgT3JkZXIuZmluZCh7IGNyZWF0ZWRBdDogeyAkZ3RlOiBzdGFydERhdGUsICRsdGU6IGVuZERhdGUgfSB9KVxuICAgICAgLnBvcHVsYXRlKFwidXNlcklkXCIsIFwiZmlyc3ROYW1lIGxhc3ROYW1lIGVtYWlsIHVzZXJOYW1lXCIpXG4gICAgICAuc29ydCh7IHRvdGFsQW1vdW50OiAtMSB9KVxuICAgICAgLmxpbWl0KDEwKTtcbiAgICBcbiAgICAvLyDEkOG7i25oIGThuqFuZyBs4bqhaSBk4buvIGxp4buHdSB0b3Agb3JkZXJzXG4gICAgY29uc3QgZm9ybWF0dGVkVG9wT3JkZXJzID0gdG9wT3JkZXJzLm1hcChvcmRlciA9PiB7XG4gICAgICAvLyDEkOG7i25oIGThuqFuZyB0w6puIGtow6FjaCBow6BuZ1xuICAgICAgbGV0IGN1c3RvbWVyTmFtZSA9ICdLaMOhY2ggaMOgbmcnO1xuICAgICAgaWYgKG9yZGVyLnVzZXJJZCkge1xuICAgICAgICBpZiAob3JkZXIudXNlcklkLmZpcnN0TmFtZSB8fCBvcmRlci51c2VySWQubGFzdE5hbWUpIHtcbiAgICAgICAgICBjdXN0b21lck5hbWUgPSBgJHtvcmRlci51c2VySWQuZmlyc3ROYW1lIHx8ICcnfSAke29yZGVyLnVzZXJJZC5sYXN0TmFtZSB8fCAnJ31gLnRyaW0oKTtcbiAgICAgICAgfSBlbHNlIGlmIChvcmRlci51c2VySWQudXNlck5hbWUpIHtcbiAgICAgICAgICBjdXN0b21lck5hbWUgPSBvcmRlci51c2VySWQudXNlck5hbWU7XG4gICAgICAgIH0gZWxzZSBpZiAob3JkZXIudXNlcklkLmVtYWlsKSB7XG4gICAgICAgICAgY3VzdG9tZXJOYW1lID0gb3JkZXIudXNlcklkLmVtYWlsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIMSQ4buLbmggZOG6oW5nIG5nw6B5IMSR4bq3dCBow6BuZ1xuICAgICAgY29uc3Qgb3JkZXJEYXRlID0gb3JkZXIuY3JlYXRlZEF0ID8gbmV3IERhdGUob3JkZXIuY3JlYXRlZEF0KSA6IG5ldyBEYXRlKCk7XG4gICAgICBjb25zdCBmb3JtYXR0ZWREYXRlID0gYCR7b3JkZXJEYXRlLmdldERhdGUoKX0vJHtvcmRlckRhdGUuZ2V0TW9udGgoKSArIDF9LyR7b3JkZXJEYXRlLmdldEZ1bGxZZWFyKCl9YDtcblxuICAgICAgLy8gQ2h1eeG7g24gxJHhu5VpIHRy4bqhbmcgdGjDoWkgc2FuZyB0aeG6v25nIFZp4buHdFxuICAgICAgbGV0IHN0YXR1c1RleHQgPSAnxJBhbmcgeOG7rSBsw70nO1xuICAgICAgc3dpdGNoKG9yZGVyLnN0YXR1cykge1xuICAgICAgICBjYXNlICdwZW5kaW5nJzogc3RhdHVzVGV4dCA9ICfEkGFuZyB44butIGzDvSc7IGJyZWFrO1xuICAgICAgICBjYXNlICdjb25maXJtZWQnOiBzdGF0dXNUZXh0ID0gJ8SQw6MgeMOhYyBuaOG6rW4nOyBicmVhaztcbiAgICAgICAgY2FzZSAncHJvY2Vzc2luZyc6IHN0YXR1c1RleHQgPSAnxJBhbmcgeOG7rSBsw70nOyBicmVhaztcbiAgICAgICAgY2FzZSAnc2hpcHBpbmcnOiBzdGF0dXNUZXh0ID0gJ8SQYW5nIHbhuq1uIGNodXnhu4NuJzsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2RlbGl2ZXJpbmcnOiBzdGF0dXNUZXh0ID0gJ8SQYW5nIGdpYW8gaMOgbmcnOyBicmVhaztcbiAgICAgICAgY2FzZSAnZGVsaXZlcmVkJzogc3RhdHVzVGV4dCA9ICfEkMOjIGdpYW8gaMOgbmcnOyBicmVhaztcbiAgICAgICAgY2FzZSAnY29tcGxldGVkJzogc3RhdHVzVGV4dCA9ICfEkMOjIGhvw6BuIHRow6BuaCc7IGJyZWFrO1xuICAgICAgICBjYXNlICdjYW5jZWxsZWQnOiBzdGF0dXNUZXh0ID0gJ8SQw6MgaOG7p3knOyBicmVhaztcbiAgICAgICAgY2FzZSAnYXdhaXRpbmdfcGF5bWVudCc6IHN0YXR1c1RleHQgPSAnQ2jhu50gdGhhbmggdG/DoW4nOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDogc3RhdHVzVGV4dCA9IG9yZGVyLnN0YXR1cztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6IG9yZGVyLm9yZGVyQ29kZSB8fCBvcmRlci5faWQsXG4gICAgICAgIGN1c3RvbWVyOiBjdXN0b21lck5hbWUsXG4gICAgICAgIHRvdGFsOiBvcmRlci50b3RhbEFtb3VudCxcbiAgICAgICAgc3RhdHVzOiBzdGF0dXNUZXh0LFxuICAgICAgICBkYXRlOiBmb3JtYXR0ZWREYXRlXG4gICAgICB9O1xuICAgIH0pO1xuICAgIFxuICAgIC8vIFRy4bqjIHbhu4EgZOG7ryBsaeG7h3UgdGjhu5FuZyBrw6pcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICB0b3RhbE9yZGVycyxcbiAgICAgIHBlbmRpbmdPcmRlcnM6IHBlbmRpbmdDb3VudCxcbiAgICAgIGNvbXBsZXRlZE9yZGVyczogY29tcGxldGVkQ291bnQsXG4gICAgICBjYW5jZWxsZWRPcmRlcnM6IGNhbmNlbGxlZENvdW50LFxuICAgICAgb3JkZXJTdGF0dXMsXG4gICAgICBwcm9jZXNzaW5nVGltZSxcbiAgICAgIHRvcE9yZGVyczogZm9ybWF0dGVkVG9wT3JkZXJzXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignTOG7l2kga2hpIGzhuqV5IHRo4buRbmcga8OqIMSRxqFuIGjDoG5nOicsIGVycm9yKTtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IFxuICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgbWVzc2FnZTogJ0zhu5dpIGtoaSBs4bqleSB0aOG7kW5nIGvDqiDEkcahbiBow6BuZycsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSBcbiAgICB9KTtcbiAgfVxufTtcblxuLy8gSMOgbSBs4bqleSB0aOG7kW5nIGvDqiBnaWFvIGjDoG5nXG5leHBvcnQgY29uc3QgZ2V0RGVsaXZlcnlTdGF0cyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHBlcmlvZCA9IHJlcS5xdWVyeS5wZXJpb2QgfHwgJ3dlZWsnOyAvLyBN4bq3YyDEkeG7i25oIGzDoCB0deG6p25cbiAgICBjb25zdCBzdGFydERhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIGxldCBlbmREYXRlID0gbmV3IERhdGUoKTtcbiAgICBcbiAgICAvLyBUaGnhur90IGzhuq1wIGtob+G6o25nIHRo4budaSBnaWFuIGThu7FhIHRyw6puIHBlcmlvZFxuICAgIHN3aXRjaCAocGVyaW9kKSB7XG4gICAgICBjYXNlICd3ZWVrJzpcbiAgICAgICAgc3RhcnREYXRlLnNldERhdGUoc3RhcnREYXRlLmdldERhdGUoKSAtIDcpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21vbnRoJzpcbiAgICAgICAgc3RhcnREYXRlLnNldERhdGUoc3RhcnREYXRlLmdldERhdGUoKSAtIDMwKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd5ZWFyJzpcbiAgICAgICAgc3RhcnREYXRlLnNldERhdGUoc3RhcnREYXRlLmdldERhdGUoKSAtIDM2NSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgc3RhcnREYXRlLnNldERhdGUoc3RhcnREYXRlLmdldERhdGUoKSAtIDcpO1xuICAgIH1cbiAgICBcbiAgICAvLyBM4bqleSB0aOG7kW5nIGvDqiBz4buRIGzGsOG7o25nIMSRxqFuIGjDoG5nIHRoZW8gdHLhuqFuZyB0aMOhaSBnaWFvIGjDoG5nXG4gICAgY29uc3QgY29tcGxldGVkQ291bnQgPSBhd2FpdCBPcmRlci5jb3VudERvY3VtZW50cyh7IFxuICAgICAgc3RhdHVzOiB7ICRpbjogWydjb21wbGV0ZWQnLCAnZGVsaXZlcmVkJ10gfSxcbiAgICAgIGNyZWF0ZWRBdDogeyAkZ3RlOiBzdGFydERhdGUsICRsdGU6IGVuZERhdGUgfSAgXG4gICAgfSk7XG4gICAgXG4gICAgY29uc3QgaW5Qcm9ncmVzc0NvdW50ID0gYXdhaXQgT3JkZXIuY291bnREb2N1bWVudHMoeyBcbiAgICAgIHN0YXR1czogeyAkaW46IFsnc2hpcHBpbmcnLCAnZGVsaXZlcmluZyddIH0sXG4gICAgICBjcmVhdGVkQXQ6IHsgJGd0ZTogc3RhcnREYXRlLCAkbHRlOiBlbmREYXRlIH0gIFxuICAgIH0pO1xuICAgIFxuICAgIGNvbnN0IGRlbGF5ZWRDb3VudCA9IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHsgXG4gICAgICBzdGF0dXM6ICdkZWxpdmVyeV9mYWlsZWQnLFxuICAgICAgY3JlYXRlZEF0OiB7ICRndGU6IHN0YXJ0RGF0ZSwgJGx0ZTogZW5kRGF0ZSB9ICBcbiAgICB9KTtcbiAgICBcbiAgICAvLyBUw61uaCB04buVbmcgc+G7kSDEkcahbiBow6BuZyBsacOqbiBxdWFuIMSR4bq/biBnaWFvIGjDoG5nXG4gICAgY29uc3QgdG90YWxEZWxpdmVyaWVzID0gY29tcGxldGVkQ291bnQgKyBpblByb2dyZXNzQ291bnQgKyBkZWxheWVkQ291bnQ7XG4gICAgXG4gICAgLy8gVMOtbmggdGjhu51pIGdpYW4gZ2lhbyBow6BuZyB0cnVuZyBiw6xuaFxuICAgIGxldCBhdmdEZWxpdmVyeVRpbWUgPSBcIk4vQVwiO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICAvLyBM4bqleSBjw6FjIMSRxqFuIGjDoG5nIMSRw6MgaG/DoG4gdGjDoG5oIGPDsyB0aMO0bmcgdGluIHRyYWNraW5nXG4gICAgICBjb25zdCBjb21wbGV0ZWRPcmRlcnMgPSBhd2FpdCBPcmRlci5maW5kKHtcbiAgICAgICAgc3RhdHVzOiB7ICRpbjogWydjb21wbGV0ZWQnLCAnZGVsaXZlcmVkJ10gfSxcbiAgICAgICAgY3JlYXRlZEF0OiB7ICRndGU6IHN0YXJ0RGF0ZSwgJGx0ZTogZW5kRGF0ZSB9LFxuICAgICAgICAndHJhY2tpbmcudHJhY2tpbmdfbG9ncyc6IHsgJGV4aXN0czogdHJ1ZSwgJG5lOiBbXSB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgaWYgKGNvbXBsZXRlZE9yZGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxldCB0b3RhbERlbGl2ZXJ5SG91cnMgPSAwO1xuICAgICAgICBsZXQgdmFsaWRPcmRlckNvdW50ID0gMDtcbiAgICAgICAgXG4gICAgICAgIGNvbXBsZXRlZE9yZGVycy5mb3JFYWNoKG9yZGVyID0+IHtcbiAgICAgICAgICBpZiAob3JkZXIudHJhY2tpbmcgJiYgQXJyYXkuaXNBcnJheShvcmRlci50cmFja2luZy50cmFja2luZ19sb2dzKSAmJiBvcmRlci50cmFja2luZy50cmFja2luZ19sb2dzLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgICAgICBjb25zdCBsb2dzID0gWy4uLm9yZGVyLnRyYWNraW5nLnRyYWNraW5nX2xvZ3NdLnNvcnQoKGEsIGIpID0+IG5ldyBEYXRlKGEudGltZXN0YW1wKSAtIG5ldyBEYXRlKGIudGltZXN0YW1wKSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFTDrG0gbG9nIMSR4bqndSB0acOqbiB2w6AgbG9nIGhvw6BuIHRow6BuaFxuICAgICAgICAgICAgY29uc3QgZmlyc3RMb2cgPSBsb2dzWzBdO1xuICAgICAgICAgICAgY29uc3QgY29tcGxldGlvbkxvZyA9IGxvZ3MuZmluZChsb2cgPT4gXG4gICAgICAgICAgICAgIGxvZy5zdGF0dXMgPT09ICdjb21wbGV0ZWQnIHx8IFxuICAgICAgICAgICAgICBsb2cuc3RhdHVzID09PSAnZGVsaXZlcmVkJyB8fFxuICAgICAgICAgICAgICBsb2cuc3RhdHVzX25hbWUuaW5jbHVkZXMoJ2hvw6BuIHRow6BuaCcpIHx8XG4gICAgICAgICAgICAgIGxvZy5zdGF0dXNfbmFtZS5pbmNsdWRlcygnxJHDoyBnaWFvJylcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChmaXJzdExvZyAmJiBjb21wbGV0aW9uTG9nKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IG5ldyBEYXRlKGZpcnN0TG9nLnRpbWVzdGFtcCk7XG4gICAgICAgICAgICAgIGNvbnN0IGVuZFRpbWUgPSBuZXcgRGF0ZShjb21wbGV0aW9uTG9nLnRpbWVzdGFtcCk7XG4gICAgICAgICAgICAgIGNvbnN0IGRlbGl2ZXJ5SG91cnMgPSAoZW5kVGltZSAtIHN0YXJ0VGltZSkgLyAoMTAwMCAqIDYwICogNjApO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgaWYgKGRlbGl2ZXJ5SG91cnMgPiAwICYmIGRlbGl2ZXJ5SG91cnMgPCAyNDApIHsgLy8gTG/huqFpIGLhu48gZ2nDoSB0cuG7iyBi4bqldCB0aMaw4budbmcgKD4gMTAgbmfDoHkpXG4gICAgICAgICAgICAgICAgdG90YWxEZWxpdmVyeUhvdXJzICs9IGRlbGl2ZXJ5SG91cnM7XG4gICAgICAgICAgICAgICAgdmFsaWRPcmRlckNvdW50Kys7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgaWYgKHZhbGlkT3JkZXJDb3VudCA+IDApIHtcbiAgICAgICAgICBhdmdEZWxpdmVyeVRpbWUgPSBgJHsodG90YWxEZWxpdmVyeUhvdXJzIC8gdmFsaWRPcmRlckNvdW50KS50b0ZpeGVkKDEpfSBnaeG7nWA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignTOG7l2kga2hpIHTDrW5oIHRo4budaSBnaWFuIGdpYW8gaMOgbmcgdHJ1bmcgYsOsbmg6JywgZXJyb3IpO1xuICAgIH1cbiAgICBcbiAgICAvLyBUaOG7kW5nIGvDqiDEkcahbiBow6BuZyB0aGVvIMSR4buRaSB0w6FjIGdpYW8gaMOgbmcgKG3hurdjIMSR4buLbmggbMOgIEdpYW8gSMOgbmcgTmhhbmgpXG4gICAgY29uc3QgZGVsaXZlcnlQYXJ0bmVycyA9IFtcbiAgICAgIHsgbmFtZTogJ0dpYW8gSMOgbmcgTmhhbmgnLCB2YWx1ZTogTWF0aC5yb3VuZCh0b3RhbERlbGl2ZXJpZXMgKiAwLjc1KSB9LFxuICAgICAgeyBuYW1lOiAnVmlldHRlbCBQb3N0JywgdmFsdWU6IE1hdGgucm91bmQodG90YWxEZWxpdmVyaWVzICogMC4xNSkgfSxcbiAgICAgIHsgbmFtZTogJ0dyYWInLCB2YWx1ZTogTWF0aC5yb3VuZCh0b3RhbERlbGl2ZXJpZXMgKiAwLjA3KSB9LFxuICAgICAgeyBuYW1lOiAnS2jDoWMnLCB2YWx1ZTogTWF0aC5yb3VuZCh0b3RhbERlbGl2ZXJpZXMgKiAwLjAzKSB9XG4gICAgXTtcbiAgICBcbiAgICAvLyBE4buvIGxp4buHdSB0aOG7nWkgZ2lhbiBnaWFvIGjDoG5nIHRoZW8ga2h1IHbhu7FjXG4gICAgY29uc3QgZGVsaXZlcnlUaW1lQnlSZWdpb24gPSBbXG4gICAgICB7IHJlZ2lvbjogJ1RwLkhDTScsIHRpbWU6IDEyIH0sXG4gICAgICB7IHJlZ2lvbjogJ0jDoCBO4buZaScsIHRpbWU6IDI0IH0sXG4gICAgICB7IHJlZ2lvbjogJ8SQw6AgTuG6tW5nJywgdGltZTogMzYgfSxcbiAgICAgIHsgcmVnaW9uOiAnQ+G6p24gVGjGoScsIHRpbWU6IDQ4IH0sXG4gICAgICB7IHJlZ2lvbjogJ1Thu4luaCBraMOhYycsIHRpbWU6IDcyIH1cbiAgICBdO1xuICAgIFxuICAgIC8vIEzhuqV5IGRhbmggc8OhY2ggxJHGoW4gaMOgbmcgZ+G6p24gxJHDonkgxJHhu4MgaGnhu4NuIHRo4buLXG4gICAgY29uc3QgcmVjZW50T3JkZXJzID0gYXdhaXQgT3JkZXIuZmluZCh7XG4gICAgICBzdGF0dXM6IHsgJG5pbjogWydjYW5jZWxsZWQnLCAnZmFpbGVkJywgJ2F3YWl0aW5nX3BheW1lbnQnXSB9LFxuICAgICAgY3JlYXRlZEF0OiB7ICRndGU6IHN0YXJ0RGF0ZSwgJGx0ZTogZW5kRGF0ZSB9XG4gICAgfSlcbiAgICAucG9wdWxhdGUoXCJ1c2VySWRcIiwgXCJmaXJzdE5hbWUgbGFzdE5hbWUgZW1haWxcIilcbiAgICAuc29ydCh7IGNyZWF0ZWRBdDogLTEgfSlcbiAgICAubGltaXQoMTApO1xuICAgIFxuICAgIC8vIENodXnhu4NuIMSR4buVaSDEkcahbiBow6BuZyB0aMOgbmggxJHhu4tuaCBk4bqhbmcgaGnhu4NuIHRo4buLIGNobyBnaWFvIGjDoG5nXG4gICAgY29uc3QgZGVsaXZlcmllcyA9IHJlY2VudE9yZGVycy5tYXAob3JkZXIgPT4ge1xuICAgICAgLy8gWMOhYyDEkeG7i25oIHRy4bqhbmcgdGjDoWkgZ2lhbyBow6BuZ1xuICAgICAgbGV0IHN0YXR1cyA9ICfEkGFuZyB44butIGzDvSc7XG4gICAgICBpZiAob3JkZXIuc3RhdHVzID09PSAnY29tcGxldGVkJyB8fCBvcmRlci5zdGF0dXMgPT09ICdkZWxpdmVyZWQnKSB7XG4gICAgICAgIHN0YXR1cyA9ICdIb8OgbiB0aMOgbmgnO1xuICAgICAgfSBlbHNlIGlmIChvcmRlci5zdGF0dXMgPT09ICdzaGlwcGluZycgfHwgb3JkZXIuc3RhdHVzID09PSAnZGVsaXZlcmluZycpIHtcbiAgICAgICAgc3RhdHVzID0gJ8SQYW5nIGdpYW8nO1xuICAgICAgfSBlbHNlIGlmIChvcmRlci5zdGF0dXMgPT09ICdkZWxpdmVyeV9mYWlsZWQnKSB7XG4gICAgICAgIHN0YXR1cyA9ICdUaOG6pXQgYuG6oWknO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyDEkOG7i25oIGThuqFuZyB0w6puIGtow6FjaCBow6BuZ1xuICAgICAgbGV0IGN1c3RvbWVyTmFtZSA9ICdLaMOhY2ggaMOgbmcnO1xuICAgICAgaWYgKG9yZGVyLnVzZXJJZCkge1xuICAgICAgICBpZiAob3JkZXIudXNlcklkLmZpcnN0TmFtZSB8fCBvcmRlci51c2VySWQubGFzdE5hbWUpIHtcbiAgICAgICAgICBjdXN0b21lck5hbWUgPSBgJHtvcmRlci51c2VySWQuZmlyc3ROYW1lIHx8ICcnfSAke29yZGVyLnVzZXJJZC5sYXN0TmFtZSB8fCAnJ31gLnRyaW0oKTtcbiAgICAgICAgfSBlbHNlIGlmIChvcmRlci51c2VySWQuZW1haWwpIHtcbiAgICAgICAgICBjdXN0b21lck5hbWUgPSBvcmRlci51c2VySWQuZW1haWw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gWMOhYyDEkeG7i25oIMSR4buRaSB0w6FjIGdpYW8gaMOgbmcgKG3hurdjIMSR4buLbmggbMOgIEdITilcbiAgICAgIGNvbnN0IHBhcnRuZXIgPSBvcmRlci5zaGlwcGluZ1BhcnRuZXIgfHwgJ0dpYW8gSMOgbmcgTmhhbmgnO1xuICAgICAgXG4gICAgICAvLyDEkOG7i25oIGThuqFuZyDEkeG7i2EgY2jhu4lcbiAgICAgIGNvbnN0IGFkZHJlc3MgPSAob3JkZXIuc2hpcHBpbmdJbmZvICYmIG9yZGVyLnNoaXBwaW5nSW5mby5hZGRyZXNzKSB8fCBcbiAgICAgICAgICAgICAgICAgICAgICBvcmRlci5hZGRyZXNzIHx8IFxuICAgICAgICAgICAgICAgICAgICAgIChvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLmFkZHJlc3MpIHx8IFxuICAgICAgICAgICAgICAgICAgICAgICdLaMO0bmcgY8OzIHRow7RuZyB0aW4nO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICBvcmRlcklkOiBvcmRlci5vcmRlckNvZGUgfHwgb3JkZXIuX2lkLFxuICAgICAgICBjdXN0b21lck5hbWUsXG4gICAgICAgIGFkZHJlc3MsXG4gICAgICAgIHBhcnRuZXIsXG4gICAgICAgIGRlbGl2ZXJ5VGltZTogb3JkZXIuY3JlYXRlZEF0ID8gbmV3IERhdGUob3JkZXIuY3JlYXRlZEF0KS50b0xvY2FsZURhdGVTdHJpbmcoJ3ZpLVZOJykgOiAnTi9BJyxcbiAgICAgICAgc3RhdHVzXG4gICAgICB9O1xuICAgIH0pO1xuICAgIFxuICAgIC8vIFRy4bqjIHbhu4EgZOG7ryBsaeG7h3UgdGjhu5FuZyBrw6pcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBzdGF0aXN0aWNzOiB7XG4gICAgICAgIGNvbXBsZXRlZDogY29tcGxldGVkQ291bnQsXG4gICAgICAgIGluUHJvZ3Jlc3M6IGluUHJvZ3Jlc3NDb3VudCxcbiAgICAgICAgZGVsYXllZDogZGVsYXllZENvdW50LFxuICAgICAgICB0b3RhbDogdG90YWxEZWxpdmVyaWVzLFxuICAgICAgICBhdmdEZWxpdmVyeVRpbWVcbiAgICAgIH0sXG4gICAgICBkZWxpdmVyeVBhcnRuZXJzLFxuICAgICAgZGVsaXZlcnlUaW1lQnlSZWdpb24sXG4gICAgICBkZWxpdmVyaWVzXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignTOG7l2kga2hpIGzhuqV5IHRo4buRbmcga8OqIGdpYW8gaMOgbmc6JywgZXJyb3IpO1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgXG4gICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICBtZXNzYWdlOiAnTOG7l2kga2hpIGzhuqV5IHRo4buRbmcga8OqIGdpYW8gaMOgbmcnLFxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UgXG4gICAgfSk7XG4gIH1cbn07ICJdLCJtYXBwaW5ncyI6IjtBQUNBLElBQUFBLE1BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLE1BQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLE9BQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJ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