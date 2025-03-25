import Payment from "../Model/Payment/Payment.js";
import Cart from "../Model/Cart/Cart.js";

export const createPayment = async (req, res) => {
  const { userId, selectedItems } = req.body;
  if (
    !selectedItems ||
    !Array.isArray(selectedItems) ||
    selectedItems.length === 0
  ) {
    return res
      .status(400)
      .json({ message: "Dữ liệu selectedItems không hợp lệ" });
  }

  try {
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
    }
    const selectedProducts = cart.items.filter((item) =>
      selectedItems.includes(item.productId?._id?.toString())
    );

    if (selectedProducts.length === 0) {
      return res
        .status(400)
        .json({ message: "Không có sản phẩm nào được chọn" });
    }

    const productsToSave = selectedProducts.map((item) => ({
      productId: item.productId._id.toString(),
      quantity: item.quantity,
      price: item.productId.productPrice, 
    }));

    const totalAmount = productsToSave.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    const newPayment = new Payment({
      userId,
      products: productsToSave,
      totalAmount,
    });

    await newPayment.save();

    res.status(201).json({ payment: newPayment });
  } catch (error) {
    console.error("Lỗi khi tạo đơn thanh toán:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau." });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId).populate(
      "products.productId"
    );

    if (!payment) {
      return res.status(404).json({ message: "Không tìm thấy đơn thanh toán" });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin thanh toán:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.paymentId);

    if (!payment) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy đơn thanh toán để xóa" });
    }

    res.status(200).json({ message: "Xóa thanh toán thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa thanh toán:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
