/* eslint-disable no-undef */
import Order from "../Model/Order.js";
import Product from "../Model/Products.js";
import axios from "axios";
import dotenv from "dotenv";
import { sendOrderConfirmationEmail, sendOrderShippingEmail } from "../utils/emailService.js";
import BestSellingProduct from "../Model/BestSellingProduct.js";
import { sendOrderStatusNotification } from "../Services/notificationService.js";
import Branch from "../Model/Branch.js";
import { findNearestBranch } from "../Services/branchService.js";
import mongoose from "mongoose";

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
        { notes: { $regex: searchTerm, $options: 'i' } }
      ];
      
      // Tìm kiếm theo thông tin người dùng (cần populate trước)
      const usersWithSearchTerm = await mongoose.model('User').find({
        $or: [
          { firstName: { $regex: searchTerm, $options: 'i' } },
          { lastName: { $regex: searchTerm, $options: 'i' } },
          { phone: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      }).select('_id');
      
      if (usersWithSearchTerm.length > 0) {
        const userIds = usersWithSearchTerm.map(user => user._id);
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
    const totalCount = await Order.countDocuments(query);
    console.log("Tổng số đơn hàng tìm thấy:", totalCount);
    
    // Lấy danh sách đơn hàng theo điều kiện và phân trang
    const orders = await Order.find(query)
      .populate("userId")
      .populate('products.productId')
      .populate('branchId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log("Số đơn hàng trả về:", orders.length);
    
    // Lấy thống kê đơn hàng theo trạng thái
    const stats = {
      total: totalCount,
      pending: await Order.countDocuments({ ...query, status: 'pending' }),
      confirmed: await Order.countDocuments({ ...query, status: 'confirmed' }),
      preparing: await Order.countDocuments({ ...query, status: 'preparing' }),
      packaging: await Order.countDocuments({ ...query, status: 'packaging' }),
      shipping: await Order.countDocuments({ ...query, status: 'shipping' }),
      delivering: await Order.countDocuments({ ...query, status: 'delivering' }),
      completed: await Order.countDocuments({ ...query, status: 'completed' }),
      cancelled: await Order.countDocuments({ ...query, status: 'cancelled' }),
      delivery_failed: await Order.countDocuments({ ...query, status: 'delivery_failed' }),
      awaiting_payment: await Order.countDocuments({ ...query, status: 'awaiting_payment' }),
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

// Lấy thông tin tracking từ database, không gọi GHN nữa
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
    // Nếu đơn hàng đã có thông tin tracking, trả về
    if (order.tracking && order.tracking.tracking_logs && order.tracking.tracking_logs.length > 0) {
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
        }
      });
    }
    // Nếu không có tracking
    return res.status(200).json({
      success: false,
      message: "Chưa có thông tin vận chuyển cho đơn hàng này"
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin vận chuyển:", error);
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

// Tạo đơn hàng mới
export const createOrder = async (req, res) => {
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
      shippingInfo,
    } = req.body;

    // Đảm bảo đơn hàng luôn có branchId
    let finalBranchId = branchId;
    
    // Nếu không có branchId, tìm chi nhánh gần nhất dựa trên địa chỉ giao hàng
    if (!finalBranchId && shippingInfo && (shippingInfo.address || shippingAddress)) {
      try {
        const addressToUse = shippingInfo.address || shippingAddress;
        const coordinates = shippingInfo && shippingInfo.coordinates || null;
        
        // Tìm chi nhánh gần nhất
        const nearestBranch = await findNearestBranch(addressToUse, coordinates);
        
        if (nearestBranch) {
          finalBranchId = nearestBranch._id;
          console.log(`Đơn hàng được tự động gán cho chi nhánh: ${nearestBranch.name}`);
        } else {
          // Gán chi nhánh mặc định nếu không tìm thấy chi nhánh gần nhất
          const defaultBranch = await Branch.findOne({});
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
        message: "Thiếu thông tin cần thiết để tạo đơn hàng",
      });
    }

    // Tạo mã đơn hàng ngẫu nhiên
    const orderCode = generateOrderCode();

    // Tạo đơn hàng mới
    const newOrder = new Order({
      userId,
      products,
      totalAmount,
      shippingInfo: {
        address: shippingAddress,
        method: "standard",
      },
      paymentMethod,
      status: status || "pending",
      orderCode,
      notes: note,
      branchId: finalBranchId || null, // Thêm chi nhánh xử lý nếu có
    });

    // Lưu đơn hàng vào database
    const savedOrder = await newOrder.save();

    // Lấy thông tin chi tiết đơn hàng (populate userId và products.productId)
    // Biến được sử dụng để gửi thông báo hoặc email (nếu cần)
    await Order.findById(savedOrder._id)
      .populate("userId", "firstName lastName email phone")
      .populate("products.productId")
      .populate("branchId"); // Thêm populate branchId

    // Cập nhật số lượng sản phẩm và doanh số bán hàng
    try {
      for (const item of products) {
        const product = await Product.findById(item.productId);
        if (product) {
          // Cập nhật số lượng tồn kho
          const newStock = Math.max(0, product.productStock - item.quantity);
          
          // Cập nhật số lượng đã bán
          const newSoldCount = (product.soldCount || 0) + item.quantity;
          
          await Product.findByIdAndUpdate(
            item.productId,
            { 
              productStock: newStock,
              soldCount: newSoldCount
            }
          );

          // Cập nhật thống kê sản phẩm bán chạy
          try {
            await BestSellingProduct.updateSalesData(
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
      sendOrderStatusNotification(
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
      orderCode: savedOrder.orderCode,
    });
  } catch (error) {
    console.error("Lỗi khi tạo đơn hàng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tạo đơn hàng",
      error: error.message,
    });
  }
};

// Hàm lấy đơn hàng theo chi nhánh
export const getOrdersByBranch = async (req, res) => {
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
        { notes: { $regex: searchTerm, $options: 'i' } }
      ];
      
      // Tìm kiếm theo thông tin người dùng (cần populate trước)
      const usersWithSearchTerm = await mongoose.model('User').find({
        $or: [
          { firstName: { $regex: searchTerm, $options: 'i' } },
          { lastName: { $regex: searchTerm, $options: 'i' } },
          { phone: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      }).select('_id');
      
      if (usersWithSearchTerm.length > 0) {
        const userIds = usersWithSearchTerm.map(user => user._id);
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
      const branch = await Branch.findById(branchId);
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
          const ordersInRadius = await Order.find({
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
            const orderIds = ordersInRadius.map(order => order._id);
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
    const totalCount = await Order.countDocuments(query);
    
    // Lấy danh sách đơn hàng theo điều kiện và phân trang
    const orders = await Order.find(query)
      .populate('userId')
      .populate('products.productId')
      .populate('branchId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Lấy thống kê đơn hàng theo trạng thái
    const stats = {
      total: totalCount,
      pending: await Order.countDocuments({ ...query, status: 'pending' }),
      confirmed: await Order.countDocuments({ ...query, status: 'confirmed' }),
      preparing: await Order.countDocuments({ ...query, status: 'preparing' }),
      packaging: await Order.countDocuments({ ...query, status: 'packaging' }),
      shipping: await Order.countDocuments({ ...query, status: 'shipping' }),
      delivering: await Order.countDocuments({ ...query, status: 'delivering' }),
      completed: await Order.countDocuments({ ...query, status: 'completed' }),
      cancelled: await Order.countDocuments({ ...query, status: 'cancelled' }),
      delivery_failed: await Order.countDocuments({ ...query, status: 'delivery_failed' }),
      awaiting_payment: await Order.countDocuments({ ...query, status: 'awaiting_payment' }),
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
};