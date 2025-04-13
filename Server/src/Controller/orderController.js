import Order from "../Model/Order.js";
import axios from "axios";
import dotenv from "dotenv";

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
    
    // Nếu đang cập nhật trạng thái thành 'cancelled', kiểm tra xem có thể hủy không
    if (filteredData.status && filteredData.status === 'cancelled') {
      // Ngăn chặn việc hủy đơn hàng đã giao hoặc đang giao
      if (order.status === 'completed' || order.status === 'delivering') {
        return res.status(400).json({
          success: false,
          message: order.status === "delivering" 
            ? "Không thể hủy đơn hàng đang giao" 
            : "Không thể hủy đơn hàng đã giao"
        });
      }
    }
    
    // Cập nhật đơn hàng
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: filteredData },
      { new: true }
    ).populate("userId").populate("products.productId");
    
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
    
    // Tìm đơn hàng theo ID
    const order = await Order.findById(orderId);
    
    // Kiểm tra nếu đơn hàng không tồn tại
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy đơn hàng" 
      });
    }
    
    // Kiểm tra xem đơn hàng có thể hủy không (chỉ được hủy khi đang ở trạng thái "pending" hoặc "awaiting_payment")
    if (order.status !== "pending" && order.status !== "awaiting_payment") {
      return res.status(400).json({ 
        success: false, 
        message: order.status === "delivering" 
          ? "Không thể hủy đơn hàng đang giao" 
          : order.status === "completed" 
          ? "Không thể hủy đơn hàng đã giao" 
          : "Chỉ có thể hủy đơn hàng ở trạng thái chờ xử lý hoặc chờ thanh toán" 
      });
    }
    
    // Cập nhật trạng thái đơn hàng thành "cancelled"
    order.status = "cancelled";
    
    // Thêm ghi chú về việc đơn hàng bị hủy
    order.notes = order.notes ? 
      `${order.notes}, Đơn hàng đã bị hủy bởi người dùng` : 
      "Đơn hàng đã bị hủy bởi người dùng";
    
    // Lưu các thay đổi vào đơn hàng
    await order.save();
    
    return res.status(200).json({
      success: true,
      message: "Hủy đơn hàng thành công",
      data: order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi hủy đơn hàng",
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

// Hàm tạo dữ liệu tracking giả lập khi API lỗi (cho mục đích phát triển)
function generateMockTrackingData(orderCode) {
  const currentDate = new Date();
  const yesterday = new Date(currentDate);
  yesterday.setDate(currentDate.getDate() - 1);
  
  return {
    order_code: orderCode,
    status: "delivering",
    status_name: "Đang giao hàng",
    estimated_delivery_time: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    tracking_logs: [
      {
        status: "ready_to_pick",
        status_name: "Đã tiếp nhận đơn hàng",
        timestamp: yesterday.toISOString(),
        location: "Kho Giao Hàng Nhanh"
      },
      {
        status: "picking",
        status_name: "Nhân viên đang lấy hàng",
        timestamp: new Date(currentDate.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        location: "Cửa hàng DNC FOOD"
      },
      {
        status: "picked",
        status_name: "Đã lấy hàng",
        timestamp: new Date(currentDate.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        location: "Cửa hàng DNC FOOD"
      },
      {
        status: "delivering",
        status_name: "Đang giao hàng",
        timestamp: currentDate.toISOString(),
        location: "Trung tâm phân loại"
      }
    ]
  };
} 