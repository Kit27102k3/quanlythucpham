import {
  createVNPayPayment,
  createMomoPayment,
} from "../Services/paymentService.js";

export async function createPaymentUrl(req, res) {
  try {
    const { orderId, amount, paymentMethod, bankCode } = req.body;

    let paymentUrl;
    if (paymentMethod === "VNPAY") {
      paymentUrl = await createVNPayPayment(orderId, amount, bankCode);
    } else if (paymentMethod === "MOMO") {
      paymentUrl = await createMomoPayment(
        orderId,
        amount,
        `Thanh toán đơn hàng ${orderId}`
      );
    } else {
      return res
        .status(400)
        .json({ error: "Phương thức thanh toán không hợp lệ" });
    }

    res.json({ paymentUrl });
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({ error: "Lỗi khi tạo URL thanh toán" });
  }
}

export function vnpayReturn(req, res) {
  // Xử lý kết quả trả về từ VNPAY
  const responseCode = req.query.vnp_ResponseCode;

  if (responseCode === "00") {
    // Thanh toán thành công
    res.send("Thanh toán thành công qua VNPAY");
  } else {
    // Thanh toán thất bại
    res.send("Thanh toán thất bại qua VNPAY");
  }
}

export function momoReturn(req, res) {
  // Xử lý kết quả trả về từ Momo
  const resultCode = req.query.resultCode;

  if (resultCode === "0") {
    // Thanh toán thành công
    res.send("Thanh toán thành công qua Momo");
  } else {
    // Thanh toán thất bại
    res.send("Thanh toán thất bại qua Momo");
  }
}
