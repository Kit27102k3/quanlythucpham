import Order from "../Model/Order.js";

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
        message: "Chỉ có thể hủy đơn hàng ở trạng thái chờ xử lý hoặc chờ thanh toán" 
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