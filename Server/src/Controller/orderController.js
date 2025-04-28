import Order from "../Model/Order.js";
import Product from "../Model/Products.js";
import axios from "axios";
import dotenv from "dotenv";
import { sendOrderConfirmationEmail } from "../utils/emailService.js";
import BestSellingProduct from "../Model/BestSellingProduct.js";

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
    const { userId, products, totalAmount, paymentMethod } = req.body;
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
    
    // Gửi email xác nhận đơn hàng
    if (populatedOrder.shippingInfo && populatedOrder.shippingInfo.email) {
      try {
        await sendOrderConfirmationEmail(populatedOrder);
        console.log(`Đã gửi email xác nhận đơn hàng ${populatedOrder.orderCode} đến ${populatedOrder.shippingInfo.email}`);
      } catch (emailError) {
        console.error('Lỗi khi gửi email xác nhận đơn hàng:', emailError);
        // Không trả về lỗi cho người dùng nếu chỉ gửi email thất bại
      }
    }

    // Return success response with order data
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

export const orderGet = async (req, res) => {
  try {
    const userId = req.query.userId || req.user?._id;
    
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
    
    // Tìm và cập nhật đơn hàng
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy đơn hàng" 
      });
    }

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
    
    const previousStatus = order.status;
    const newStatus = filteredData.status;
    
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
    
    // Gửi email thông báo khi trạng thái đơn hàng thay đổi (nếu có email)
    if (newStatus && newStatus !== previousStatus && updatedOrder.shippingInfo && updatedOrder.shippingInfo.email) {
      try {
        await sendOrderConfirmationEmail(updatedOrder);
        console.log(`Đã gửi email cập nhật trạng thái đơn hàng ${updatedOrder.orderCode} đến ${updatedOrder.shippingInfo.email}`);
      } catch (emailError) {
        console.error('Lỗi khi gửi email cập nhật trạng thái đơn hàng:', emailError);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: "Cập nhật đơn hàng thành công",
      data: updatedOrder
    });
  } catch (error) {
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
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(order);
  } catch (err) {
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
    
    // Nếu có trạng thái mới được gửi lên, cập nhật trạng thái đơn hàng
    if (status) {
      updateData.status = status;
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
    
    const SHOP_ID = process.env.SHOP_ID;
    const SHOP_TOKEN_API = process.env.SHOP_TOKEN_API;
    const USE_MOCK_ON_ERROR = process.env.USE_MOCK_ON_ERROR === 'true';
    
    if (!SHOP_ID || !SHOP_TOKEN_API) {
      console.log("Thiếu thông tin cấu hình GHN trong biến môi trường");
      if (USE_MOCK_ON_ERROR) {
        // Sử dụng dữ liệu giả lập khi thiếu cấu hình
        const mockData = generateMockTrackingData(orderCode);
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
          // Sử dụng dữ liệu giả lập thay vì trả về lỗi nếu cấu hình cho phép
          const mockData = generateMockTrackingData(orderCode);
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
        // Sử dụng dữ liệu giả lập nếu API GHN bị lỗi và cấu hình cho phép
        const mockData = generateMockTrackingData(orderCode);
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
    console.error("Lỗi khi lấy thông tin vận chuyển:", error.response?.data || error.message);
    
    const USE_MOCK_ON_ERROR = process.env.USE_MOCK_ON_ERROR === 'true';
    
    if (USE_MOCK_ON_ERROR) {
      // Luôn trả về dữ liệu giả lập khi có lỗi nếu cấu hình cho phép
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

// Hàm tạo dữ liệu giả lập cho tracking đơn hàng
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

    // Find and update the order
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Update payment status and isPaid fields
    order.paymentStatus = paymentStatus || 'completed';
    order.isPaid = isPaid !== undefined ? isPaid : true;
    
    // If order is paid, update status to processing if it's currently pending
    if (order.isPaid && order.status === 'pending') {
      order.status = 'processing';
    }

    // Save the updated order
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order payment status updated successfully",
      data: order
    });
  } catch (error) {
    console.error("Error updating order payment status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating order payment status",
      error: error.message
    });
  }
}; 