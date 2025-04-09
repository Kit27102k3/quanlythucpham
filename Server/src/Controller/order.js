import Order from "../Model/Order.js";

export const orderCreate = async (req, res) => {
  try {
    console.log("Creating order with data:", req.body);
    
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
    console.log("Order created successfully:", order._id);

    // Return success response with order data
    res.status(201).json(order);
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

export const orderGet = async (req, res) => {
  try {
    console.log("Query params:", req.query);
    console.log("User from token:", req.user);
    
    const userId = req.query.userId || req.user?._id;
    console.log("Using userId:", userId);
    
    // Sử dụng userId nếu có, nếu không trả về tất cả đơn hàng
    const query = userId ? { userId } : {};
    console.log("Query filter:", query);
    
    const orders = await Order.find(query)
      .populate('userId')
      .populate('products.productId')
      .sort({ createdAt: -1 });
      
    console.log(`Trả về ${orders.length} đơn hàng${userId ? ` cho userId: ${userId}` : ''}`);
    
    res.status(200).json(orders);
  } catch (err) {
    console.error("Lỗi khi lấy đơn hàng:", err);
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
