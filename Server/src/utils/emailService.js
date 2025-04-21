import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import dotenv from 'dotenv';

dotenv.config();

// Khởi tạo transporter để gửi email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// Tạo mã QR từ dữ liệu
const generateQRCode = async (data) => {
  try {
    return await QRCode.toDataURL(JSON.stringify(data));
  } catch (error) {
    console.error('Lỗi khi tạo mã QR:', error);
    return null;
  }
};

// Tạo nội dung email đặt hàng thành công
const createOrderEmailTemplate = (order, qrCodeImage) => {
  // Tính tổng số lượng sản phẩm
  const totalItems = order.products.reduce((sum, item) => sum + item.quantity, 0);
  
  // Format tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };
  
  // Tạo danh sách sản phẩm HTML
  const productsList = order.products.map(item => {
    const product = item.productId;
    const productName = product.productName || 'Sản phẩm';
    const productPrice = product.productPrice || 0;
    const subtotal = item.quantity * productPrice;
    
    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${productName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(productPrice)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(subtotal)}</td>
      </tr>
    `;
  }).join('');
  
  // Tạo HTML cho email
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Xác nhận đơn hàng #${order.orderCode}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #f2f2f2; text-align: left; padding: 10px; }
        .summary { margin-top: 20px; font-weight: bold; }
        .qrcode { text-align: center; margin: 20px 0; }
        .qrcode img { max-width: 200px; }
        .order-info { margin-bottom: 20px; }
        .shipping-info { margin-bottom: 20px; }
        .thank-you { margin-top: 30px; font-weight: bold; color: #4CAF50; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Xác nhận đơn hàng #${order.orderCode}</h2>
        </div>
        <div class="content">
          <p>Xin chào ${order.shippingInfo?.fullName || 'Quý khách'},</p>
          <p>Cảm ơn bạn đã đặt hàng tại Siêu Thị Thực Phẩm Sạch. Đơn hàng của bạn đã được xác nhận!</p>
          
          <div class="order-info">
            <h3>Thông tin đơn hàng</h3>
            <p><strong>Mã đơn hàng:</strong> ${order.orderCode}</p>
            <p><strong>Ngày đặt hàng:</strong> ${new Date(order.createdAt).toLocaleString('vi-VN')}</p>
            <p><strong>Phương thức thanh toán:</strong> ${order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'SePay'}</p>
            <p><strong>Trạng thái đơn hàng:</strong> ${order.status === 'pending' ? 'Đang xử lý' : order.status}</p>
          </div>
          
          <div class="shipping-info">
            <h3>Thông tin giao hàng</h3>
            <p><strong>Họ tên:</strong> ${order.shippingInfo?.fullName || ''}</p>
            <p><strong>Địa chỉ:</strong> ${order.shippingInfo?.address || ''}</p>
            <p><strong>Số điện thoại:</strong> ${order.shippingInfo?.phone || ''}</p>
            <p><strong>Email:</strong> ${order.shippingInfo?.email || ''}</p>
          </div>
          
          <h3>Chi tiết đơn hàng</h3>
          <table>
            <thead>
              <tr>
                <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                <th style="padding: 10px; text-align: center;">Số lượng</th>
                <th style="padding: 10px; text-align: right;">Đơn giá</th>
                <th style="padding: 10px; text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${productsList}
            </tbody>
          </table>
          
          <div class="summary">
            <p>Tổng số sản phẩm: ${totalItems}</p>
            <p>Tổng tiền hàng: ${formatCurrency(order.totalAmount)}</p>
            <p>Phí vận chuyển: ${formatCurrency(order.shippingFee || 0)}</p>
            <p>Tổng thanh toán: ${formatCurrency(order.totalAmount + (order.shippingFee || 0))}</p>
          </div>
          
          <div class="qrcode">
            <p>Mã QR đơn hàng của bạn:</p>
            ${qrCodeImage ? `<img src="${qrCodeImage}" alt="QR Code">` : ''}
            <p>Quét mã này để xem thông tin đơn hàng</p>
          </div>
          
          <p class="thank-you">Cảm ơn bạn đã lựa chọn Siêu Thị Thực Phẩm Sạch!</p>
          
          <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email support@chuoikoicho.com hoặc gọi đến hotline 1900 6789.</p>
        </div>
        <div class="footer">
          <p>© 2023 Siêu Thị Thực Phẩm Sạch. Địa chỉ: 273 An Dương Vương, Phường 3, Quận 5, TP. Hồ Chí Minh.</p>
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Hàm gửi email xác nhận đơn hàng
export const sendOrderConfirmationEmail = async (order) => {
  try {
    // Kiểm tra xem đơn hàng có thông tin email không
    if (!order.shippingInfo || !order.shippingInfo.email) {
      console.log('Không có email để gửi xác nhận đơn hàng');
      return false;
    }
    
    // Tạo dữ liệu cho mã QR
    const qrData = {
      orderCode: order.orderCode,
      totalAmount: order.totalAmount,
      status: order.status,
      date: order.createdAt
    };
    
    // Tạo mã QR
    const qrCodeImage = await generateQRCode(qrData);
    
    // Tạo nội dung email
    const htmlContent = createOrderEmailTemplate(order, qrCodeImage);
    
    // Cấu hình email
    const mailOptions = {
      from: `"Siêu Thị Thực Phẩm Sạch" <${process.env.EMAIL_USER || 'no-reply@chuoikoicho.com'}>`,
      to: order.shippingInfo.email,
      subject: `Xác nhận đơn hàng #${order.orderCode}`,
      html: htmlContent
    };
    
    // Gửi email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email xác nhận đơn hàng đã được gửi:', info.messageId);
    return true;
  } catch (error) {
    console.error('Lỗi khi gửi email xác nhận đơn hàng:', error);
    return false;
  }
};

export default {
  sendOrderConfirmationEmail
}; 