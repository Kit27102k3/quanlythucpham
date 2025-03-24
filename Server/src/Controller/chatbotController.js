import Chat from "../Model/ChatBot/ChatBot.js";
import Product from "../Model/Products/Products.js";

export const handleMessage = async (userId, message, productId) => {
  let responseMessage = "";

  const chat = await Chat.findOne({ userId });

  if (!chat) {
    responseMessage = "Xin chào, tôi có thể giúp gì cho bạn?";

    const newChat = new Chat({
      userId,
      messages: [{ sender: "bot", message: responseMessage, productId }],
    });
    await newChat.save();

    return responseMessage;
  }

  if (!message || typeof message !== "string") {
    return "Xin lỗi, tôi không hiểu câu hỏi của bạn. Vui lòng hỏi lại.";
  }

  const lowerCaseMessage = message.trim().toLowerCase();

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return "Xin lỗi, không tìm thấy thông tin sản phẩm.";
    }

    if (lowerCaseMessage.includes("giá")) {
      responseMessage = `Giá sản phẩm là ${product.productPrice}đ.`;
    } else if (lowerCaseMessage.includes("công dụng")) {
      responseMessage = `Công dụng sản phẩm: ${product.productInfo} ${product.productDetails}`;
    } else if (lowerCaseMessage.includes("thông tin")) {
      responseMessage = `Thông tin sản phẩm: ${product.productInfo} ${product.productIntroduction}`;
    } else if (lowerCaseMessage.includes("cảm ơn")) {
      responseMessage = `Phục vụ quý khách là trách nhiệm của chúng tôi. Cảm ơn quý khách đã ghé thăm. Chúc quý khách một ngày mới tốt lành.`;
    } else if (lowerCaseMessage.includes("tư vấn")) {
      responseMessage =
        "Chúng tôi có thể tư vấn thêm về sản phẩm này. Bạn cần thông tin gì cụ thể?";
    } else {
      responseMessage =
        "Xin lỗi, tôi không hiểu câu hỏi của bạn. Vui lòng hỏi lại.";
    }

    // Lưu tin nhắn vào database
    chat.messages.push(
      { sender: "user", message, productId },
      { sender: "bot", message: responseMessage, productId }
    );
    await chat.save();
  } catch (error) {
    console.error("Lỗi khi lưu tin nhắn vào database:", error);
    responseMessage = "Xin lỗi, có lỗi xảy ra khi xử lý tin nhắn.";
  }

  return responseMessage;
};

export const getProductInfoForChatbot = async (req, res) => {
  const { userId, message, productId } = req.body;

  if (!userId || !message || !productId) {
    return res
      .status(400)
      .json({ error: "Thiếu thông tin userId, message hoặc productId" });
  }

  try {
    const responseMessage = await handleMessage(userId, message, productId);
    return res.status(200).json({ message: responseMessage });
  } catch (error) {
    console.error("Lỗi khi xử lý tin nhắn:", error);
    return res.status(500).json({ error: "Lỗi khi xử lý tin nhắn" });
  }
};
