import Cart from "../Model/Cart.js";

export const getCart = async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) {
      return res
        .status(404)
        .json({  message: "Giỏ hàng không tồn tại" });
    }

    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Lỗi khi lấy giỏ hàng:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const addToCart = async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.createdAt = new Date();
    } else {
      cart.items.push({
        productId,
        quantity,
        createdAt: new Date(),
      });
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Sản phẩm đã được thêm vào giỏ hàng",
      cart,
    });
  } catch (error) {
    console.error("Lỗi khi thêm vào giỏ hàng:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const removeFromCart = async (req, res) => {
  const { userId, productId } = req.body;

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Giỏ hàng không tồn tại" });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Sản phẩm đã được xóa khỏi giỏ hàng",
      cart,
    });
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const updateCartItem = async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Giỏ hàng không tồn tại" });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (!existingItem) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Sản phẩm không tồn tại trong giỏ hàng",
        });
    }

    existingItem.quantity = quantity;
    existingItem.createdAt = new Date();

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Số lượng sản phẩm đã được cập nhật",
      cart,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật số lượng sản phẩm:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
