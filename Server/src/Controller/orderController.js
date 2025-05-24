/* eslint-disable no-undef */
import Order from "../Model/Order.js";
import Product from "../Model/Products.js";
import axios from "axios";
import dotenv from "dotenv";
import { sendOrderConfirmationEmail, sendOrderShippingEmail } from "../utils/emailService.js";
import BestSellingProduct from "../Model/BestSellingProduct.js";
import { sendOrderStatusNotification } from "../Services/notificationService.js";

dotenv.config();

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
      const product = await Product.findById(item.productId);
      if (product) {
        // Tăng hoặc giảm số lượng tồn kho dựa vào tham số increase
        const newStock = increase 
          ? product.productStock + item.quantity 
          : product.productStock - item.quantity;
        
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

export const orderCreate = async (req, res) => {
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
      const product = await Product.findById(item.productId);
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
    const order = new Order(req.body);
    
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
    const populatedOrder = await Order.findById(order._id)
      .populate('userId')
      .populate('products.productId');
      
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
        const emailSent = await sendOrderConfirmationEmail(populatedOrder);
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
        email: populatedOrder?.userId?.email
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
};

export const orderGet = async (req, res) => {
  try {
    const userId = req.query.userId || (req.user && req.user._id ? req.user._id : undefined);
    
    // Sử dụng userId nếu có, nếu không trả về tất cả đơn hàng
    const query = userId ? { userId } : {};
    
    const orders = await Order.find(query)
      .populate('userId')
      .populate('products.productId')
      .sort({ createdAt: -1 });
    
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

export const orderGetAll = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId")
      .populate('products.productId')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const orderGetById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId")
      .populate('products.productId');
    
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Hàm cập nhật thông tin đơn hàng
export const updateOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const updateData = req.body;
    
    console.log("updateOrder được gọi với dữ liệu:", JSON.stringify(updateData));
    
    // Tìm và cập nhật đơn hàng
    const order = await Order.findById(orderId)
      .populate("userId", "firstName lastName userName email phone address")
      .populate("products.productId");
    
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
        case 'pending': statusName = "Chờ xử lý"; break;
        case 'confirmed': statusName = "Đã xác nhận"; break;
        case 'processing': statusName = "Đang xử lý"; break;
        case 'preparing': statusName = "Đang chuẩn bị hàng"; break;
        case 'packaging': statusName = "Hoàn tất đóng gói"; break;
        case 'shipping': statusName = "Đang vận chuyển"; break;
        case 'shipped': statusName = "Đã giao cho vận chuyển"; break;
        case 'delivering': statusName = "Đang giao hàng"; break;
        case 'delivered': statusName = "Đã giao hàng"; break;
        case 'completed': statusName = "Hoàn thành"; break;
        case 'cancelled': statusName = "Đã hủy"; break;
        case 'awaiting_payment': statusName = "Chờ thanh toán"; break;
        case 'refunded': statusName = "Đã hoàn tiền"; break;
        case 'failed': statusName = "Thất bại"; break;
        case 'delivery_failed': statusName = "Giao hàng thất bại"; break;
        default: statusName = newStatus;
      }
      
      // Thêm bản ghi mới vào đầu mảng tracking_logs
      const newTrackingLog = {
        status: newStatus,
        status_name: statusName,
        timestamp: new Date().toISOString(),
        location: "Cửa hàng DNC FOOD",
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
          const populatedOrder = await Order.findById(orderId).populate("products.productId");
          
          // Cập nhật từng sản phẩm trong đơn hàng
          for (const item of populatedOrder.products) {
            if (item.productId) {
              await BestSellingProduct.updateSalesData(
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
          const product = await Product.findById(item.productId);
          if (product) {
            product.soldCount = (product.soldCount || 0) + item.quantity;
            await product.save();
          }
        }
        
        // Cập nhật thông tin sản phẩm bán chạy
        try {
          // Tải thông tin chi tiết sản phẩm
          const populatedOrder = await Order.findById(orderId).populate("products.productId");
          
          // Cập nhật từng sản phẩm trong đơn hàng
          for (const item of populatedOrder.products) {
            if (item.productId) {
              await BestSellingProduct.updateSalesData(
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
          message: previousStatus === "delivering" 
            ? "Không thể hủy đơn hàng đang giao" 
            : "Không thể hủy đơn hàng đã giao"
        });
      }
      
      // Khi hủy đơn hàng thanh toán online, cần trả lại số lượng tồn kho
      if (order.paymentMethod !== "cod") {
        await updateProductStock(order.products, true, false);
      }
    }
    
    // Cập nhật đơn hàng
    const updatedOrder = await Order.findByIdAndUpdate(
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
          lastName: order.userId && order.userId.lastName ? order.userId.lastName : undefined,
        });
        
        // Đảm bảo order.userId đã được populate đầy đủ
        if (order.userId && typeof order.userId === 'object') {
          // Gửi email thông báo đơn hàng đang được giao
          const emailSent = await sendOrderShippingEmail(order);
          
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
        await sendOrderConfirmationEmail(updatedOrder);
        console.log(`Đã gửi email cập nhật trạng thái đơn hàng ${updatedOrder.orderCode} đến ${updatedOrder.shippingInfo.email}`);
      } catch (emailError) {
        console.error('Lỗi khi gửi email cập nhật trạng thái đơn hàng:', emailError);
      }
    }
    
    // Gửi thông báo khi cập nhật trạng thái đơn hàng
    if (newStatus && newStatus !== previousStatus && updatedOrder.userId) {
      try {
        await sendOrderStatusNotification(updatedOrder.userId, updatedOrder, getStatusText(updatedOrder.status));
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
};

export const orderUpdate = async (req, res) => {
  try {
    const { status } = req.body;
    
    console.log("orderUpdate called with status:", status);
    console.log("Request body:", JSON.stringify(req.body));
    
    // Trước tiên lấy thông tin đơn hàng hiện tại để theo dõi thay đổi trạng thái
    // Đảm bảo populate đầy đủ thông tin để gửi email
    const currentOrder = await Order.findById(req.params.id)
      .populate("userId", "firstName lastName userName email phone address")
      .populate("products.productId");
    
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
        const emailSent = await sendOrderShippingEmail(currentOrder);
        
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
              lastName: currentOrder.userId && currentOrder.userId.lastName ? currentOrder.userId.lastName : undefined,
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
    const updatedOrder = await Order.findById(req.params.id)
      .populate("userId")
      .populate("products.productId");
    
    res.json(updatedOrder);
  } catch (err) {
    console.error("Lỗi khi cập nhật trạng thái đơn hàng:", err);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ error: err.message });
  }
};

// Thêm controller mới để đánh dấu đơn hàng đã thanh toán
export const markOrderAsPaid = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { isPaid, status } = req.body;
    
    // Cập nhật thông tin đơn hàng: trạng thái thanh toán và trạng thái đơn hàng (nếu có)
    const updateData = { isPaid };
    
    // Tìm đơn hàng để kiểm tra
    const order = await Order.findById(orderId).populate("products.productId");
    
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
    if ((status && status !== previousStatus) || (isPaid && !wasPaid)) {
      // Khởi tạo tracking object nếu chưa có
      if (!order.tracking) {
        order.tracking = { status_name: "", tracking_logs: [] };
      }
      
      // Lấy tên hiển thị cho trạng thái
      let statusName = "";
      if (status) {
        switch (status) {
          case 'pending': statusName = "Chờ xử lý"; break;
          case 'confirmed': statusName = "Đã xác nhận"; break;
          case 'processing': statusName = "Đang xử lý"; break;
          case 'preparing': statusName = "Đang chuẩn bị hàng"; break;
          case 'packaging': statusName = "Hoàn tất đóng gói"; break;
          case 'shipping': statusName = "Đang vận chuyển"; break;
          case 'shipped': statusName = "Đã giao cho vận chuyển"; break;
          case 'delivering': statusName = "Đang giao hàng"; break;
          case 'delivered': statusName = "Đã giao hàng"; break;
          case 'completed': statusName = "Hoàn thành"; break;
          case 'cancelled': statusName = "Đã hủy"; break;
          case 'awaiting_payment': statusName = "Chờ thanh toán"; break;
          case 'refunded': statusName = "Đã hoàn tiền"; break;
          case 'failed': statusName = "Thất bại"; break;
          case 'delivery_failed': statusName = "Giao hàng thất bại"; break;
          default: statusName = status;
        }
      } else if (isPaid && !wasPaid) {
        statusName = "Đã thanh toán";
      }
      
      // Thêm bản ghi mới vào đầu mảng tracking_logs
      const newTrackingLog = {
        status: status || order.status,
        status_name: statusName || "Cập nhật thanh toán",
        timestamp: new Date().toISOString(),
        location: "Cửa hàng DNC FOOD",
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
            await BestSellingProduct.updateSalesData(
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
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    ).populate("userId").populate("products.productId");
    
    // Ghi log hoặc thông báo
    console.log(`Đơn hàng ${orderId} đã được đánh dấu là đã thanh toán${status ? ` và chuyển trạng thái thành ${status}` : ''}`);
    
    // Gửi email thông báo nếu có email và khi đơn hàng chuyển sang trạng thái completed
    if (status === 'completed' && order.shippingInfo && order.shippingInfo.email) {
      try {
        await sendOrderConfirmationEmail(updatedOrder);
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
};

export const orderDelete = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    res.json({ message: "Đơn hàng đã được xóa thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Hàm hủy đơn hàng
export const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    
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
        message: order.status === "delivering" 
          ? "Không thể hủy đơn hàng đang giao" 
          : "Không thể hủy đơn hàng đã giao"
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
export const getOrderTracking = async (req, res) => {
  try {
    const { orderCode } = req.params;
    
    if (!orderCode) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã vận đơn"
      });
    }
    
    // Tìm đơn hàng trong database dựa trên orderCode
    const order = await Order.findOne({ orderCode });
    
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
      const response = await axios.post(
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
        const order = await Order.findOne({ orderCode: req.params.orderCode });
        
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
function getStatusText(status) {
  switch (status) {
    case 'pending': return "Chờ xử lý";
    case 'confirmed': return "Đã xác nhận";
    case 'processing': return "Đang xử lý";
    case 'preparing': return "Đang chuẩn bị hàng";
    case 'packaging': return "Hoàn tất đóng gói";
    case 'shipping': return "Đang vận chuyển";
    case 'shipped': return "Đã giao cho vận chuyển";
    case 'delivering': return "Đang giao hàng";
    case 'delivered': return "Đã giao hàng";
    case 'completed': return "Hoàn thành";
    case 'cancelled': return "Đã hủy";
    case 'awaiting_payment': return "Chờ thanh toán";
    case 'refunded': return "Đã hoàn tiền";
    case 'failed': return "Thất bại";
    case 'delivery_failed': return "Giao hàng thất bại";
    default: return status;
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
          }
        ];
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
          }
        ];
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
          }
        ];
        break;
        
      case 'packaging':
        trackingLogs = [
          {
            status: "packaging",
            status_name: "Hoàn tất đóng gói",
            timestamp: timeLatest.toISOString(),
            location: "Cửa hàng DNC FOOD"
          }
        ];
        break;
        
      default:
        // Với các trạng thái khác, tạo một bản ghi phù hợp
        trackingLogs = [
          {
            status: order.status,
            status_name: getStatusText(order.status),
            timestamp: now.toISOString(),
            location: "Cửa hàng DNC FOOD"
          }
        ];
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
    }
  ];

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
export const updateOrderPaymentStatus = async (req, res) => {
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
    const order = await Order.findById(id);
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
    if ((paymentStatus && paymentStatus !== oldPaymentStatus) || 
        (isPaid !== undefined && isPaid !== oldIsPaid)) {
      
      // Khởi tạo tracking object nếu chưa có
      if (!order.tracking) {
        order.tracking = { status_name: "", tracking_logs: [] };
      }
      
      // Tạo status_name theo trạng thái thanh toán mới
      let statusName = "";
      if (paymentStatus) {
        switch (paymentStatus) {
          case 'pending': statusName = "Chờ thanh toán"; break;
          case 'completed': statusName = "Đã thanh toán"; break;
          case 'failed': statusName = "Thanh toán thất bại"; break;
          case 'refunded': statusName = "Đã hoàn tiền"; break;
          default: statusName = `Trạng thái thanh toán: ${paymentStatus}`;
        }
      } else if (isPaid !== undefined) {
        statusName = isPaid ? "Đã thanh toán" : "Chưa thanh toán";
      }
      
      // Thêm bản ghi mới vào đầu mảng tracking_logs
      const newTrackingLog = {
        status: order.status,
        status_name: statusName || "Cập nhật thanh toán",
        timestamp: new Date().toISOString(),
        location: "Cửa hàng DNC FOOD",
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
    const updatedOrder = await Order.findByIdAndUpdate(
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
            await BestSellingProduct.updateSalesData(
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
    if (updatedOrder.userId && 
        ((paymentStatus && paymentStatus !== oldPaymentStatus) || 
        (isPaid !== undefined && isPaid !== oldIsPaid))) {
      try {
        await sendOrderStatusNotification(updatedOrder.userId, updatedOrder, getStatusText(updatedOrder.status));
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
export const notifyOrderSuccess = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { email, fullName, phone, address } = req.body;
    
    console.log(`=====================================================`);
    console.log(`NOTIFY ORDER SUCCESS - ATTEMPTING TO SEND EMAIL`);
    console.log(`Order ID: ${orderId}`);
    console.log(`Email data:`, { email, fullName, phone, address });
    
    // Lấy thông tin đơn hàng
    const order = await Order.findById(orderId)
      .populate("userId")
      .populate("products.productId");
    
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
      fullName: fullName || ((order.userId && order.userId.firstName ? `${order.userId.firstName || ''} ${order.userId.lastName || ''}`.trim() : '')),
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
      await Order.findByIdAndUpdate(orderId, { shippingInfo: shippingInfo });
      console.log(`Updated order with shippingInfo`);
    } catch (updateError) {
      console.log(`Warning: Could not update order with shippingInfo: ${updateError.message}`);
      // Tiếp tục thực hiện gửi email mặc dù không cập nhật được order
    }
    
    // Gửi email xác nhận đơn hàng
    console.log(`Attempting to send confirmation email to: ${shippingInfo.email}`);
    
    const emailSent = await sendOrderConfirmationEmail(order);
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
export const getTopOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10; // Mặc định lấy top 10 đơn hàng

    // Tìm đơn hàng và sắp xếp theo totalAmount giảm dần
    const topOrders = await Order.find()
      .populate("userId", "firstName lastName email userName")
      .sort({ totalAmount: -1 })
      .limit(limit);

    // Định dạng lại dữ liệu để phù hợp với cấu trúc hiển thị
    const formattedOrders = topOrders.map(order => {
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
      switch(order.status) {
        case 'pending': statusText = 'Đang xử lý'; break;
        case 'confirmed': statusText = 'Đã xác nhận'; break;
        case 'processing': statusText = 'Đang xử lý'; break;
        case 'shipping': statusText = 'Đang vận chuyển'; break;
        case 'delivering': statusText = 'Đang giao hàng'; break;
        case 'delivered': statusText = 'Đã giao hàng'; break;
        case 'completed': statusText = 'Đã hoàn thành'; break;
        case 'cancelled': statusText = 'Đã hủy'; break;
        case 'awaiting_payment': statusText = 'Chờ thanh toán'; break;
        default: statusText = order.status;
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
export const getOrderStats = async (req, res) => {
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
    const pendingCount = await Order.countDocuments({ 
      status: { $in: ['pending', 'processing', 'awaiting_payment'] },
      createdAt: { $gte: startDate, $lte: endDate }  
    });
    
    const shippingCount = await Order.countDocuments({ 
      status: { $in: ['shipping', 'delivering'] },
      createdAt: { $gte: startDate, $lte: endDate }  
    });
    
    const completedCount = await Order.countDocuments({ 
      status: 'completed',
      createdAt: { $gte: startDate, $lte: endDate }  
    });
    
    const cancelledCount = await Order.countDocuments({ 
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
      { name: 'Đã hủy', value: cancelledCount }
    ];
    
    // Tính toán thời gian xử lý trung bình dựa trên dữ liệu thực tế
    let processingTime = [];
    
    try {
      // Lấy đơn hàng đã hoàn thành để tính thời gian xử lý
      const completedOrders = await Order.find({
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate },
        completedAt: { $exists: true }
      });
      
      if (completedOrders.length > 0) {
        // Tính tổng thời gian xử lý
        let totalProcessingTime = 0;
        let totalShippingTime = 0;
        let totalTotalTime = 0;
        
        completedOrders.forEach(order => {
          // Nếu có tracking logs, sử dụng chúng để tính thời gian chính xác hơn
          if (order.tracking && Array.isArray(order.tracking.tracking_logs) && order.tracking.tracking_logs.length >= 2) {
            const logs = order.tracking.tracking_logs;
            // Sắp xếp logs theo thời gian
            logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            // Tính thời gian từ tạo đơn đến đóng gói
            const packagingLog = logs.find(log => log.status === 'packaging' || log.status_name.includes('đóng gói'));
            if (packagingLog) {
              const packagingTime = (new Date(packagingLog.timestamp) - new Date(order.createdAt)) / (1000 * 60); // Phút
              totalProcessingTime += packagingTime;
            }
            
            // Tính thời gian từ đóng gói đến giao hàng
            const shippingLog = logs.find(log => log.status === 'shipping' || log.status === 'delivering');
            const deliveredLog = logs.find(log => log.status === 'delivered' || log.status === 'completed');
            
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
          { name: 'Tổng thời gian', time: avgTotalTime || 60 }
        ];
      } else {
        // Nếu không có đơn hàng hoàn thành, sử dụng dữ liệu mẫu
        processingTime = [
          { name: 'Xác nhận', time: 15 },
          { name: 'Đóng gói', time: 30 },
          { name: 'Vận chuyển', time: 45 }
        ];
      }
    } catch (error) {
      console.error('Lỗi khi tính toán thời gian xử lý trung bình:', error);
      // Dữ liệu mẫu khi có lỗi
      processingTime = [
        { name: 'Xác nhận', time: 15 },
        { name: 'Đóng gói', time: 30 },
        { name: 'Vận chuyển', time: 45 }
      ];
    }
    
    // Lấy danh sách top 10 đơn hàng giá trị cao nhất
    const topOrders = await Order.find({ createdAt: { $gte: startDate, $lte: endDate } })
      .populate("userId", "firstName lastName email userName")
      .sort({ totalAmount: -1 })
      .limit(10);
    
    // Định dạng lại dữ liệu top orders
    const formattedTopOrders = topOrders.map(order => {
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
      switch(order.status) {
        case 'pending': statusText = 'Đang xử lý'; break;
        case 'confirmed': statusText = 'Đã xác nhận'; break;
        case 'processing': statusText = 'Đang xử lý'; break;
        case 'shipping': statusText = 'Đang vận chuyển'; break;
        case 'delivering': statusText = 'Đang giao hàng'; break;
        case 'delivered': statusText = 'Đã giao hàng'; break;
        case 'completed': statusText = 'Đã hoàn thành'; break;
        case 'cancelled': statusText = 'Đã hủy'; break;
        case 'awaiting_payment': statusText = 'Chờ thanh toán'; break;
        default: statusText = order.status;
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
export const getDeliveryStats = async (req, res) => {
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
    const completedCount = await Order.countDocuments({ 
      status: { $in: ['completed', 'delivered'] },
      createdAt: { $gte: startDate, $lte: endDate }  
    });
    
    const inProgressCount = await Order.countDocuments({ 
      status: { $in: ['shipping', 'delivering'] },
      createdAt: { $gte: startDate, $lte: endDate }  
    });
    
    const delayedCount = await Order.countDocuments({ 
      status: 'delivery_failed',
      createdAt: { $gte: startDate, $lte: endDate }  
    });
    
    // Tính tổng số đơn hàng liên quan đến giao hàng
    const totalDeliveries = completedCount + inProgressCount + delayedCount;
    
    // Tính thời gian giao hàng trung bình
    let avgDeliveryTime = "N/A";
    
    try {
      // Lấy các đơn hàng đã hoàn thành có thông tin tracking
      const completedOrders = await Order.find({
        status: { $in: ['completed', 'delivered'] },
        createdAt: { $gte: startDate, $lte: endDate },
        'tracking.tracking_logs': { $exists: true, $ne: [] }
      });
      
      if (completedOrders.length > 0) {
        let totalDeliveryHours = 0;
        let validOrderCount = 0;
        
        completedOrders.forEach(order => {
          if (order.tracking && Array.isArray(order.tracking.tracking_logs) && order.tracking.tracking_logs.length >= 2) {
            const logs = [...order.tracking.tracking_logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            // Tìm log đầu tiên và log hoàn thành
            const firstLog = logs[0];
            const completionLog = logs.find(log => 
              log.status === 'completed' || 
              log.status === 'delivered' ||
              log.status_name.includes('hoàn thành') ||
              log.status_name.includes('đã giao')
            );
            
            if (firstLog && completionLog) {
              const startTime = new Date(firstLog.timestamp);
              const endTime = new Date(completionLog.timestamp);
              const deliveryHours = (endTime - startTime) / (1000 * 60 * 60);
              
              if (deliveryHours > 0 && deliveryHours < 240) { // Loại bỏ giá trị bất thường (> 10 ngày)
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
      { name: 'Khác', value: Math.round(totalDeliveries * 0.03) }
    ];
    
    // Dữ liệu thời gian giao hàng theo khu vực
    const deliveryTimeByRegion = [
      { region: 'Tp.HCM', time: 12 },
      { region: 'Hà Nội', time: 24 },
      { region: 'Đà Nẵng', time: 36 },
      { region: 'Cần Thơ', time: 48 },
      { region: 'Tỉnh khác', time: 72 }
    ];
    
    // Lấy danh sách đơn hàng gần đây để hiển thị
    const recentOrders = await Order.find({
      status: { $nin: ['cancelled', 'failed', 'awaiting_payment'] },
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .populate("userId", "firstName lastName email")
    .sort({ createdAt: -1 })
    .limit(10);
    
    // Chuyển đổi đơn hàng thành định dạng hiển thị cho giao hàng
    const deliveries = recentOrders.map(order => {
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
      const address = (order.shippingInfo && order.shippingInfo.address) || 
                      order.address || 
                      (order.userId && order.userId.address) || 
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