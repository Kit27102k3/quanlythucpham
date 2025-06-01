import Cart from "../Model/Cart.js";
import Product from "../Model/Products.js";

export const getCart = async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) {
      return res
        .status(404)
        .json({  message: "Giỏ hàng không tồn tại" });
    }

    cart.items.sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Lỗi khi lấy giỏ hàng:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const clearCart = async (req, res) => {
  const { userId } = req.body;

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Giỏ hàng không tồn tại" });
    }

    // Xóa tất cả các item trong giỏ hàng
    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Đã xóa tất cả sản phẩm khỏi giỏ hàng",
      cart,
    });
  } catch (error) {
    console.error("Lỗi khi xóa toàn bộ giỏ hàng:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const addToCart = async (req, res) => {
  const { userId, productId, quantity, unit, unitPrice, conversionRate } = req.body;

  // Kiểm tra userId
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "userId là bắt buộc"
    });
  }

  // Kiểm tra productId
  if (!productId) {
    return res.status(400).json({
      success: false,
      message: "productId là bắt buộc"
    });
  }

  try {
    let cart = await Cart.findOne({ userId });
    
    // Lấy thông tin sản phẩm để có giá chính xác
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại"
      });
    }
    
    // Xác định đơn vị và giá
    let selectedUnit = unit || product.productUnit;
    let selectedPrice = unitPrice;
    let selectedConversionRate = conversionRate || 1;
    
    // Nếu không có giá được chỉ định, sử dụng giá mặc định từ sản phẩm
    if (!selectedPrice) {
      // Kiểm tra đơn vị trong unitOptions
      if (product.unitOptions && product.unitOptions.length > 0) {
        const unitOption = product.unitOptions.find(opt => opt.unit === selectedUnit);
        if (unitOption) {
          selectedPrice = unitOption.price;
          selectedConversionRate = unitOption.conversionRate;
        }
      }
      
      // Nếu không tìm thấy, sử dụng giá sản phẩm mặc định
      if (!selectedPrice) {
        selectedPrice = product.productDiscount > 0
          ? product.productPromoPrice
          : product.productPrice;
      }
    }
    
    // Tính giá có tính đến giảm giá
    const finalPrice = product.productDiscount > 0
      ? selectedPrice - (selectedPrice * product.productDiscount / 100)
      : selectedPrice;

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Tìm item đã tồn tại với cùng sản phẩm VÀ cùng đơn vị đo
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId && item.unit === selectedUnit
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.price = finalPrice;
      existingItem.unitPrice = selectedPrice;
      existingItem.conversionRate = selectedConversionRate;
      existingItem.createdAt = new Date();
    } else {
      cart.items.push({
        productId,
        quantity,
        price: finalPrice,
        unit: selectedUnit,
        unitPrice: selectedPrice,
        conversionRate: selectedConversionRate,
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
  const { userId, productId, quantity, unit, unitPrice, conversionRate } = req.body;

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Giỏ hàng không tồn tại" });
    }

    // Tìm sản phẩm trong giỏ hàng theo ID và đơn vị (nếu được chỉ định)
    let existingItem;
    
    if (unit) {
      // Tìm theo productId và unit
      existingItem = cart.items.find(
        (item) => item.productId.toString() === productId && item.unit === unit
      );
    } else {
      // Tìm chỉ theo productId
      existingItem = cart.items.find(
        (item) => item.productId.toString() === productId
      );
    }

    if (!existingItem) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Sản phẩm không tồn tại trong giỏ hàng",
        });
    }

    // Cập nhật số lượng
    if (quantity) {
      existingItem.quantity = quantity;
    }

    // Cập nhật đơn vị đo nếu được chỉ định
    if (unit) {
      existingItem.unit = unit;
    }

    // Cập nhật giá đơn vị nếu được chỉ định
    if (unitPrice) {
      existingItem.unitPrice = unitPrice;
      // Cập nhật giá tổng
      const product = await Product.findById(productId);
      const finalPrice = product.productDiscount > 0
        ? unitPrice - (unitPrice * product.productDiscount / 100)
        : unitPrice;
      existingItem.price = finalPrice;
    }

    // Cập nhật tỷ lệ chuyển đổi nếu được chỉ định
    if (conversionRate) {
      existingItem.conversionRate = conversionRate;
    }

    existingItem.createdAt = new Date();
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Sản phẩm đã được cập nhật",
      cart,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật sản phẩm:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
