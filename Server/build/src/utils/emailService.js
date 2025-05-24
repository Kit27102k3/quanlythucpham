"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.sendOrderShippingEmail = exports.sendOrderConfirmationEmail = exports.default = void 0;var _nodemailer = _interopRequireDefault(require("nodemailer"));
var _qrcode = _interopRequireDefault(require("qrcode"));
var _dotenv = _interopRequireDefault(require("dotenv"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}

// Cấu hình dotenv để đọc biến môi trường
_dotenv.default.config();

// Thiết lập biến môi trường - Sửa lỗi ESLint
/* global process */
const ENV = {
  EMAIL_USERNAME: process.env.EMAIL_USERNAME || 'your-email@gmail.com',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || 'your-app-password',
  CLIENT_URL: process.env.CLIENT_URL || 'https://quanlythucpham-client.vercel.app'
};

// Khởi tạo transporter để gửi email
const transporter = _nodemailer.default.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: ENV.EMAIL_USERNAME,
    pass: ENV.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Tạo mã QR từ dữ liệu
const generateQRCode = async (data) => {
  try {
    return await _qrcode.default.toDataURL(JSON.stringify(data));
  } catch (error) {
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
  const productsList = order.products.map((item) => {
    const product = item.productId;
    const productName = product.productName || 'Sản phẩm';
    const productPrice = product.productPrice || 0;
    const subtotal = item.quantity * productPrice;

    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">
          <div style="display: flex; align-items: center;">
            ${product.productImages && product.productImages[0] ?
    `<img src="${product.productImages[0]}" alt="${productName}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; border-radius: 4px;">` :
    ''}
            <div>${productName}</div>
          </div>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(productPrice)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(subtotal)}</td>
      </tr>
    `;
  }).join('');

  // Xác định thông tin về mã giảm giá nếu có
  let discountInfo = '';
  if (order.coupon && order.coupon.discount) {
    discountInfo = `
      <p><strong>Mã giảm giá:</strong> ${order.coupon.code || 'Đã áp dụng'}</p>
      <p><strong>Giảm giá:</strong> ${formatCurrency(order.coupon.discount)}</p>
    `;
  }

  // Xác định phí vận chuyển
  const shippingFee = order.shippingFee || order.deliveryFee || 0;

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
        .header { background-color: #51bb1a; color: white; padding: 15px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #f2f2f2; text-align: left; padding: 10px; }
        .summary { margin-top: 20px; font-weight: bold; }
        .qrcode { text-align: center; margin: 20px 0; }
        .qrcode img { max-width: 200px; }
        .order-info { margin-bottom: 20px; background-color: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .shipping-info { margin-bottom: 20px; background-color: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .thank-you { margin-top: 30px; font-weight: bold; color: #51bb1a; text-align: center; font-size: 18px; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .btn { display: inline-block; background-color: #51bb1a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">DNC FOOD</div>
          <h2>Xác nhận đơn hàng #${order.orderCode}</h2>
        </div>
        <div class="content">
          <p>Xin chào ${order.shippingInfo && order.shippingInfo.fullName ? order.shippingInfo.fullName : 'Quý khách'},</p>
          <p>Cảm ơn bạn đã đặt hàng tại DNC FOOD. Đơn hàng của bạn đã được xác nhận!</p>
          
          <div class="order-info">
            <h3>Thông tin đơn hàng</h3>
            <p><strong>Mã đơn hàng:</strong> ${order.orderCode}</p>
            <p><strong>Ngày đặt hàng:</strong> ${new Date(order.createdAt).toLocaleString('vi-VN')}</p>
            <p><strong>Phương thức thanh toán:</strong> ${order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán trực tuyến'}</p>
            <p><strong>Trạng thái đơn hàng:</strong> ${order.status === 'pending' ? 'Đang xử lý' : order.status}</p>
            ${discountInfo}
          </div>
          
          <div class="shipping-info">
            <h3>Thông tin giao hàng</h3>
            <p><strong>Họ tên:</strong> ${order.shippingInfo && order.shippingInfo.fullName ? order.shippingInfo.fullName : ''}</p>
            <p><strong>Địa chỉ:</strong> ${order.shippingInfo && order.shippingInfo.address ? order.shippingInfo.address : ''}</p>
            <p><strong>Số điện thoại:</strong> ${order.shippingInfo && order.shippingInfo.phone ? order.shippingInfo.phone : ''}</p>
            <p><strong>Email:</strong> ${order.shippingInfo && order.shippingInfo.email ? order.shippingInfo.email : ''}</p>
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
          
          <div class="summary" style="background-color: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <p>Tổng số sản phẩm: ${totalItems}</p>
            <p>Tổng tiền hàng: ${formatCurrency(order.subtotal || order.totalAmount)}</p>
            <p>Phí vận chuyển: ${formatCurrency(shippingFee)}</p>
            ${order.coupon && order.coupon.discount ? `<p>Giảm giá: -${formatCurrency(order.coupon.discount)}</p>` : ''}
            <p style="font-size: 18px; color: #51bb1a;">Tổng thanh toán: ${formatCurrency(order.totalAmount)}</p>
          </div>
          
          ${qrCodeImage ? `
          <div class="qrcode">
            <p>Mã QR đơn hàng của bạn:</p>
            <img src="${qrCodeImage}" alt="QR Code">
            <p>Quét mã này để xem thông tin đơn hàng</p>
          </div>
          ` : ''}
          
          <p class="thank-you">Cảm ơn bạn đã lựa chọn DNC FOOD!</p>
          
          <div style="text-align: center;">
            <a href="${ENV.CLIENT_URL}/tai-khoan/don-hang" class="btn">Xem đơn hàng của tôi</a>
          </div>
          
          <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email ${ENV.EMAIL_USERNAME || 'support@dncfood.com'} hoặc gọi đến hotline 0326 743391.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} DNC FOOD. Địa chỉ: 273 An Dương Vương, Phường 3, Quận 5, TP. Hồ Chí Minh.</p>
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Hàm gửi email xác nhận đơn hàng
const sendOrderConfirmationEmail = async (order) => {
  try {
    // Kiểm tra tất cả các thông tin cần thiết để gửi email
    if (!order.shippingInfo) {
      return false;
    }

    // Khắc phục lỗi email bị thiếu trong shippingInfo
    if (!order.shippingInfo.email) {
      // Nếu không có email trong shippingInfo nhưng có trong userId
      if (order.userId && order.userId.email) {
        order.shippingInfo.email = order.userId.email;
      } else {
        return false;
      }
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
      from: `"DNC FOOD" <${ENV.EMAIL_USERNAME}>`,
      to: order.shippingInfo.email,
      subject: `Xác nhận đơn hàng #${order.orderCode}`,
      html: htmlContent
    };

    // Gửi email
    const info = await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    return false;
  }
};

// Create email template for order shipping notification
exports.sendOrderConfirmationEmail = sendOrderConfirmationEmail;const createOrderShippingTemplate = (order) => {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Get payment status and amount to be paid
  const isPaid = order.isPaid || false;
  const amountToBePaid = isPaid ? 0 : order.totalAmount + (order.shippingFee || 0);

  // Handle case where orderCode is missing
  const orderIdentifier = order.orderCode || (order._id ? order._id.toString().slice(-6).toUpperCase() : 'N/A');

  // Get customer name from either shippingInfo or userId
  let customerName = 'Quý khách';
  if (order.shippingInfo && order.shippingInfo.fullName) {
    customerName = order.shippingInfo.fullName;
  } else if (order.userId) {
    if (order.userId.firstName && order.userId.lastName) {
      customerName = `${order.userId.firstName} ${order.userId.lastName}`;
    } else if (order.userId.userName) {
      customerName = order.userId.userName;
    }
  }

  // Get shipping address and phone from either shippingInfo or userId
  let shippingAddress = '';
  let phoneNumber = '';

  if (order.shippingInfo) {
    shippingAddress = order.shippingInfo.address || '';
    phoneNumber = order.shippingInfo.phone || '';
  } else if (order.userId) {
    shippingAddress = order.userId.address || '';
    phoneNumber = order.userId.phone || '';
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Đơn hàng của bạn đang được giao đến</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4361ee; color: white; padding: 10px 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
        .highlight { color: #4361ee; font-weight: bold; }
        .payment-info { margin: 20px 0; padding: 15px; background-color: #fff8e6; border-left: 4px solid #ffc107; }
        .thank-you { margin-top: 30px; font-weight: bold; color: #4361ee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Đơn hàng của bạn đang trên đường giao đến!</h2>
        </div>
        <div class="content">
          <p>Xin chào ${customerName},</p>
          <p>Chúng tôi vui mừng thông báo rằng đơn hàng <span class="highlight">#${orderIdentifier}</span> của bạn hiện đang được giao đến địa chỉ của bạn.</p>
          
          <p><strong>Thông tin giao hàng:</strong></p>
          <ul>
            <li><strong>Địa chỉ:</strong> ${shippingAddress}</li>
            <li><strong>Số điện thoại:</strong> ${phoneNumber}</li>
            <li><strong>Tổng giá trị đơn hàng:</strong> ${formatCurrency(order.totalAmount + (order.shippingFee || 0))}</li>
          </ul>
          
          ${!isPaid ? `
          <div class="payment-info">
            <p><strong>Thông tin thanh toán:</strong></p>
            <p>Phương thức thanh toán: ${order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : order.paymentMethod}</p>
            <p>Số tiền cần thanh toán: <span class="highlight">${formatCurrency(amountToBePaid)}</span></p>
            <p>Vui lòng chuẩn bị số tiền chính xác để quá trình giao hàng diễn ra thuận lợi.</p>
          </div>
          ` : `
          <div class="payment-info" style="background-color: #e7f7e7; border-left: 4px solid #4CAF50;">
            <p><strong>Thông tin thanh toán:</strong></p>
            <p>Đơn hàng của bạn đã được thanh toán đầy đủ.</p>
            <p>Bạn chỉ cần nhận hàng mà không cần thanh toán thêm khoản nào.</p>
          </div>
          `}
          
          <p>Đơn hàng của bạn dự kiến sẽ được giao trong ngày. Nhân viên giao hàng sẽ liên hệ với bạn trước khi giao.</p>
          
          <p>Nếu bạn không có nhà vào thời điểm giao hàng, vui lòng liên hệ với chúng tôi để sắp xếp lại thời gian giao hàng phù hợp.</p>
          
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

// Function to send email notification when order is being delivered
const sendOrderShippingEmail = async (order) => {
  // Check if order has email information either in shippingInfo or userId
  let recipientEmail = null;

  // First try to get email from shippingInfo
  if (order.shippingInfo && order.shippingInfo.email) {
    recipientEmail = order.shippingInfo.email;
  }
  // If not available, try to get from userId if it's populated
  else if (order.userId && order.userId.email) {
    recipientEmail = order.userId.email;
  }

  if (!recipientEmail) {
    return false;
  }

  // Handle case where orderCode is missing
  const orderIdentifier = order.orderCode || (order._id ? order._id.toString().slice(-6).toUpperCase() : 'N/A');

  // Create email content
  const htmlContent = createOrderShippingTemplate(order);

  // Configure email
  const mailOptions = {
    from: `"DNC FOOD" <${ENV.EMAIL_USERNAME || 'no-reply@dncfood.com'}>`,
    to: recipientEmail,
    subject: `Đơn hàng #${orderIdentifier} đang được giao đến bạn`,
    html: htmlContent
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);
  return true;
};exports.sendOrderShippingEmail = sendOrderShippingEmail;var _default = exports.default =

{
  sendOrderConfirmationEmail,
  sendOrderShippingEmail
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfbm9kZW1haWxlciIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwiX3FyY29kZSIsIl9kb3RlbnYiLCJlIiwiX19lc01vZHVsZSIsImRlZmF1bHQiLCJkb3RlbnYiLCJjb25maWciLCJFTlYiLCJFTUFJTF9VU0VSTkFNRSIsInByb2Nlc3MiLCJlbnYiLCJFTUFJTF9QQVNTV09SRCIsIkNMSUVOVF9VUkwiLCJ0cmFuc3BvcnRlciIsIm5vZGVtYWlsZXIiLCJjcmVhdGVUcmFuc3BvcnQiLCJzZXJ2aWNlIiwiaG9zdCIsInBvcnQiLCJzZWN1cmUiLCJhdXRoIiwidXNlciIsInBhc3MiLCJ0bHMiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJnZW5lcmF0ZVFSQ29kZSIsImRhdGEiLCJRUkNvZGUiLCJ0b0RhdGFVUkwiLCJKU09OIiwic3RyaW5naWZ5IiwiZXJyb3IiLCJjcmVhdGVPcmRlckVtYWlsVGVtcGxhdGUiLCJvcmRlciIsInFyQ29kZUltYWdlIiwidG90YWxJdGVtcyIsInByb2R1Y3RzIiwicmVkdWNlIiwic3VtIiwiaXRlbSIsInF1YW50aXR5IiwiZm9ybWF0Q3VycmVuY3kiLCJhbW91bnQiLCJJbnRsIiwiTnVtYmVyRm9ybWF0Iiwic3R5bGUiLCJjdXJyZW5jeSIsImZvcm1hdCIsInByb2R1Y3RzTGlzdCIsIm1hcCIsInByb2R1Y3QiLCJwcm9kdWN0SWQiLCJwcm9kdWN0TmFtZSIsInByb2R1Y3RQcmljZSIsInN1YnRvdGFsIiwicHJvZHVjdEltYWdlcyIsImpvaW4iLCJkaXNjb3VudEluZm8iLCJjb3Vwb24iLCJkaXNjb3VudCIsImNvZGUiLCJzaGlwcGluZ0ZlZSIsImRlbGl2ZXJ5RmVlIiwib3JkZXJDb2RlIiwic2hpcHBpbmdJbmZvIiwiZnVsbE5hbWUiLCJEYXRlIiwiY3JlYXRlZEF0IiwidG9Mb2NhbGVTdHJpbmciLCJwYXltZW50TWV0aG9kIiwic3RhdHVzIiwiYWRkcmVzcyIsInBob25lIiwiZW1haWwiLCJ0b3RhbEFtb3VudCIsImdldEZ1bGxZZWFyIiwic2VuZE9yZGVyQ29uZmlybWF0aW9uRW1haWwiLCJ1c2VySWQiLCJxckRhdGEiLCJkYXRlIiwiaHRtbENvbnRlbnQiLCJtYWlsT3B0aW9ucyIsImZyb20iLCJ0byIsInN1YmplY3QiLCJodG1sIiwiaW5mbyIsInNlbmRNYWlsIiwiZXhwb3J0cyIsImNyZWF0ZU9yZGVyU2hpcHBpbmdUZW1wbGF0ZSIsImlzUGFpZCIsImFtb3VudFRvQmVQYWlkIiwib3JkZXJJZGVudGlmaWVyIiwiX2lkIiwidG9TdHJpbmciLCJzbGljZSIsInRvVXBwZXJDYXNlIiwiY3VzdG9tZXJOYW1lIiwiZmlyc3ROYW1lIiwibGFzdE5hbWUiLCJ1c2VyTmFtZSIsInNoaXBwaW5nQWRkcmVzcyIsInBob25lTnVtYmVyIiwic2VuZE9yZGVyU2hpcHBpbmdFbWFpbCIsInJlY2lwaWVudEVtYWlsIiwiX2RlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdXRpbHMvZW1haWxTZXJ2aWNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBub2RlbWFpbGVyIGZyb20gJ25vZGVtYWlsZXInO1xuaW1wb3J0IFFSQ29kZSBmcm9tICdxcmNvZGUnO1xuaW1wb3J0IGRvdGVudiBmcm9tICdkb3RlbnYnO1xuXG4vLyBD4bqldSBow6xuaCBkb3RlbnYgxJHhu4MgxJHhu41jIGJp4bq/biBtw7RpIHRyxrDhu51uZ1xuZG90ZW52LmNvbmZpZygpO1xuXG4vLyBUaGnhur90IGzhuq1wIGJp4bq/biBtw7RpIHRyxrDhu51uZyAtIFPhu61hIGzhu5dpIEVTTGludFxuLyogZ2xvYmFsIHByb2Nlc3MgKi9cbmNvbnN0IEVOViA9IHtcbiAgRU1BSUxfVVNFUk5BTUU6IHByb2Nlc3MuZW52LkVNQUlMX1VTRVJOQU1FIHx8ICd5b3VyLWVtYWlsQGdtYWlsLmNvbScsXG4gIEVNQUlMX1BBU1NXT1JEOiBwcm9jZXNzLmVudi5FTUFJTF9QQVNTV09SRCB8fCAneW91ci1hcHAtcGFzc3dvcmQnLFxuICBDTElFTlRfVVJMOiBwcm9jZXNzLmVudi5DTElFTlRfVVJMIHx8ICdodHRwczovL3F1YW5seXRodWNwaGFtLWNsaWVudC52ZXJjZWwuYXBwJ1xufTtcblxuLy8gS2jhu59pIHThuqFvIHRyYW5zcG9ydGVyIMSR4buDIGfhu61pIGVtYWlsXG5jb25zdCB0cmFuc3BvcnRlciA9IG5vZGVtYWlsZXIuY3JlYXRlVHJhbnNwb3J0KHtcbiAgc2VydmljZTogJ2dtYWlsJyxcbiAgaG9zdDogJ3NtdHAuZ21haWwuY29tJyxcbiAgcG9ydDogNTg3LFxuICBzZWN1cmU6IGZhbHNlLFxuICBhdXRoOiB7XG4gICAgdXNlcjogRU5WLkVNQUlMX1VTRVJOQU1FLFxuICAgIHBhc3M6IEVOVi5FTUFJTF9QQVNTV09SRFxuICB9LFxuICB0bHM6IHtcbiAgICByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlXG4gIH1cbn0pO1xuXG4vLyBU4bqhbyBtw6MgUVIgdOG7qyBk4buvIGxp4buHdVxuY29uc3QgZ2VuZXJhdGVRUkNvZGUgPSBhc3luYyAoZGF0YSkgPT4ge1xuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCBRUkNvZGUudG9EYXRhVVJMKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcblxuLy8gVOG6oW8gbuG7mWkgZHVuZyBlbWFpbCDEkeG6t3QgaMOgbmcgdGjDoG5oIGPDtG5nXG5jb25zdCBjcmVhdGVPcmRlckVtYWlsVGVtcGxhdGUgPSAob3JkZXIsIHFyQ29kZUltYWdlKSA9PiB7XG4gIC8vIFTDrW5oIHThu5VuZyBz4buRIGzGsOG7o25nIHPhuqNuIHBo4bqpbVxuICBjb25zdCB0b3RhbEl0ZW1zID0gb3JkZXIucHJvZHVjdHMucmVkdWNlKChzdW0sIGl0ZW0pID0+IHN1bSArIGl0ZW0ucXVhbnRpdHksIDApO1xuICBcbiAgLy8gRm9ybWF0IHRp4buBbiB04buHXG4gIGNvbnN0IGZvcm1hdEN1cnJlbmN5ID0gKGFtb3VudCkgPT4ge1xuICAgIHJldHVybiBuZXcgSW50bC5OdW1iZXJGb3JtYXQoJ3ZpLVZOJywge1xuICAgICAgc3R5bGU6ICdjdXJyZW5jeScsXG4gICAgICBjdXJyZW5jeTogJ1ZORCdcbiAgICB9KS5mb3JtYXQoYW1vdW50KTtcbiAgfTtcbiAgXG4gIC8vIFThuqFvIGRhbmggc8OhY2ggc+G6o24gcGjhuqltIEhUTUxcbiAgY29uc3QgcHJvZHVjdHNMaXN0ID0gb3JkZXIucHJvZHVjdHMubWFwKGl0ZW0gPT4ge1xuICAgIGNvbnN0IHByb2R1Y3QgPSBpdGVtLnByb2R1Y3RJZDtcbiAgICBjb25zdCBwcm9kdWN0TmFtZSA9IHByb2R1Y3QucHJvZHVjdE5hbWUgfHwgJ1PhuqNuIHBo4bqpbSc7XG4gICAgY29uc3QgcHJvZHVjdFByaWNlID0gcHJvZHVjdC5wcm9kdWN0UHJpY2UgfHwgMDtcbiAgICBjb25zdCBzdWJ0b3RhbCA9IGl0ZW0ucXVhbnRpdHkgKiBwcm9kdWN0UHJpY2U7XG4gICAgXG4gICAgcmV0dXJuIGBcbiAgICAgIDx0cj5cbiAgICAgICAgPHRkIHN0eWxlPVwicGFkZGluZzogMTBweDsgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNkZGQ7XCI+XG4gICAgICAgICAgPGRpdiBzdHlsZT1cImRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7XCI+XG4gICAgICAgICAgICAke3Byb2R1Y3QucHJvZHVjdEltYWdlcyAmJiBwcm9kdWN0LnByb2R1Y3RJbWFnZXNbMF0gPyBcbiAgICAgICAgICAgICAgYDxpbWcgc3JjPVwiJHtwcm9kdWN0LnByb2R1Y3RJbWFnZXNbMF19XCIgYWx0PVwiJHtwcm9kdWN0TmFtZX1cIiBzdHlsZT1cIndpZHRoOiA1MHB4OyBoZWlnaHQ6IDUwcHg7IG9iamVjdC1maXQ6IGNvdmVyOyBtYXJnaW4tcmlnaHQ6IDEwcHg7IGJvcmRlci1yYWRpdXM6IDRweDtcIj5gIDogXG4gICAgICAgICAgICAgICcnfVxuICAgICAgICAgICAgPGRpdj4ke3Byb2R1Y3ROYW1lfTwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L3RkPlxuICAgICAgICA8dGQgc3R5bGU9XCJwYWRkaW5nOiAxMHB4OyBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2RkZDsgdGV4dC1hbGlnbjogY2VudGVyO1wiPiR7aXRlbS5xdWFudGl0eX08L3RkPlxuICAgICAgICA8dGQgc3R5bGU9XCJwYWRkaW5nOiAxMHB4OyBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2RkZDsgdGV4dC1hbGlnbjogcmlnaHQ7XCI+JHtmb3JtYXRDdXJyZW5jeShwcm9kdWN0UHJpY2UpfTwvdGQ+XG4gICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDEwcHg7IGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZGRkOyB0ZXh0LWFsaWduOiByaWdodDtcIj4ke2Zvcm1hdEN1cnJlbmN5KHN1YnRvdGFsKX08L3RkPlxuICAgICAgPC90cj5cbiAgICBgO1xuICB9KS5qb2luKCcnKTtcbiAgXG4gIC8vIFjDoWMgxJHhu4tuaCB0aMO0bmcgdGluIHbhu4EgbcOjIGdp4bqjbSBnacOhIG7hur91IGPDs1xuICBsZXQgZGlzY291bnRJbmZvID0gJyc7XG4gIGlmIChvcmRlci5jb3Vwb24gJiYgb3JkZXIuY291cG9uLmRpc2NvdW50KSB7XG4gICAgZGlzY291bnRJbmZvID0gYFxuICAgICAgPHA+PHN0cm9uZz5Nw6MgZ2nhuqNtIGdpw6E6PC9zdHJvbmc+ICR7b3JkZXIuY291cG9uLmNvZGUgfHwgJ8SQw6Mgw6FwIGThu6VuZyd9PC9wPlxuICAgICAgPHA+PHN0cm9uZz5HaeG6o20gZ2nDoTo8L3N0cm9uZz4gJHtmb3JtYXRDdXJyZW5jeShvcmRlci5jb3Vwb24uZGlzY291bnQpfTwvcD5cbiAgICBgO1xuICB9XG5cbiAgLy8gWMOhYyDEkeG7i25oIHBow60gduG6rW4gY2h1eeG7g25cbiAgY29uc3Qgc2hpcHBpbmdGZWUgPSBvcmRlci5zaGlwcGluZ0ZlZSB8fCBvcmRlci5kZWxpdmVyeUZlZSB8fCAwO1xuICBcbiAgLy8gVOG6oW8gSFRNTCBjaG8gZW1haWxcbiAgcmV0dXJuIGBcbiAgICA8IURPQ1RZUEUgaHRtbD5cbiAgICA8aHRtbD5cbiAgICA8aGVhZD5cbiAgICAgIDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiPlxuICAgICAgPHRpdGxlPljDoWMgbmjhuq1uIMSRxqFuIGjDoG5nICMke29yZGVyLm9yZGVyQ29kZX08L3RpdGxlPlxuICAgICAgPHN0eWxlPlxuICAgICAgICBib2R5IHsgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmOyBsaW5lLWhlaWdodDogMS42OyBjb2xvcjogIzMzMzsgfVxuICAgICAgICAuY29udGFpbmVyIHsgbWF4LXdpZHRoOiA2MDBweDsgbWFyZ2luOiAwIGF1dG87IHBhZGRpbmc6IDIwcHg7IH1cbiAgICAgICAgLmhlYWRlciB7IGJhY2tncm91bmQtY29sb3I6ICM1MWJiMWE7IGNvbG9yOiB3aGl0ZTsgcGFkZGluZzogMTVweCAyMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGJvcmRlci1yYWRpdXM6IDhweCA4cHggMCAwOyB9XG4gICAgICAgIC5jb250ZW50IHsgcGFkZGluZzogMjBweDsgYmFja2dyb3VuZC1jb2xvcjogI2Y5ZjlmOTsgYm9yZGVyLXJhZGl1czogMCAwIDhweCA4cHg7IH1cbiAgICAgICAgLmZvb3RlciB7IHRleHQtYWxpZ246IGNlbnRlcjsgbWFyZ2luLXRvcDogMjBweDsgZm9udC1zaXplOiAxMnB4OyBjb2xvcjogIzc3NzsgfVxuICAgICAgICB0YWJsZSB7IHdpZHRoOiAxMDAlOyBib3JkZXItY29sbGFwc2U6IGNvbGxhcHNlOyBtYXJnaW4tYm90dG9tOiAyMHB4OyB9XG4gICAgICAgIHRoIHsgYmFja2dyb3VuZC1jb2xvcjogI2YyZjJmMjsgdGV4dC1hbGlnbjogbGVmdDsgcGFkZGluZzogMTBweDsgfVxuICAgICAgICAuc3VtbWFyeSB7IG1hcmdpbi10b3A6IDIwcHg7IGZvbnQtd2VpZ2h0OiBib2xkOyB9XG4gICAgICAgIC5xcmNvZGUgeyB0ZXh0LWFsaWduOiBjZW50ZXI7IG1hcmdpbjogMjBweCAwOyB9XG4gICAgICAgIC5xcmNvZGUgaW1nIHsgbWF4LXdpZHRoOiAyMDBweDsgfVxuICAgICAgICAub3JkZXItaW5mbyB7IG1hcmdpbi1ib3R0b206IDIwcHg7IGJhY2tncm91bmQtY29sb3I6ICNmZmY7IHBhZGRpbmc6IDE1cHg7IGJvcmRlci1yYWRpdXM6IDhweDsgYm94LXNoYWRvdzogMCAxcHggM3B4IHJnYmEoMCwwLDAsMC4xKTsgfVxuICAgICAgICAuc2hpcHBpbmctaW5mbyB7IG1hcmdpbi1ib3R0b206IDIwcHg7IGJhY2tncm91bmQtY29sb3I6ICNmZmY7IHBhZGRpbmc6IDE1cHg7IGJvcmRlci1yYWRpdXM6IDhweDsgYm94LXNoYWRvdzogMCAxcHggM3B4IHJnYmEoMCwwLDAsMC4xKTsgfVxuICAgICAgICAudGhhbmsteW91IHsgbWFyZ2luLXRvcDogMzBweDsgZm9udC13ZWlnaHQ6IGJvbGQ7IGNvbG9yOiAjNTFiYjFhOyB0ZXh0LWFsaWduOiBjZW50ZXI7IGZvbnQtc2l6ZTogMThweDsgfVxuICAgICAgICAubG9nbyB7IGZvbnQtc2l6ZTogMjRweDsgZm9udC13ZWlnaHQ6IGJvbGQ7IG1hcmdpbi1ib3R0b206IDEwcHg7IH1cbiAgICAgICAgLmJ0biB7IGRpc3BsYXk6IGlubGluZS1ibG9jazsgYmFja2dyb3VuZC1jb2xvcjogIzUxYmIxYTsgY29sb3I6IHdoaXRlOyBwYWRkaW5nOiAxMHB4IDIwcHg7IHRleHQtZGVjb3JhdGlvbjogbm9uZTsgYm9yZGVyLXJhZGl1czogNHB4OyBtYXJnaW4tdG9wOiAxNXB4OyB9XG4gICAgICA8L3N0eWxlPlxuICAgIDwvaGVhZD5cbiAgICA8Ym9keT5cbiAgICAgIDxkaXYgY2xhc3M9XCJjb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJsb2dvXCI+RE5DIEZPT0Q8L2Rpdj5cbiAgICAgICAgICA8aDI+WMOhYyBuaOG6rW4gxJHGoW4gaMOgbmcgIyR7b3JkZXIub3JkZXJDb2RlfTwvaDI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGVudFwiPlxuICAgICAgICAgIDxwPlhpbiBjaMOgbyAke29yZGVyLnNoaXBwaW5nSW5mbyAmJiBvcmRlci5zaGlwcGluZ0luZm8uZnVsbE5hbWUgPyBvcmRlci5zaGlwcGluZ0luZm8uZnVsbE5hbWUgOiAnUXXDvSBraMOhY2gnfSw8L3A+XG4gICAgICAgICAgPHA+Q+G6o20gxqFuIGLhuqFuIMSRw6MgxJHhurd0IGjDoG5nIHThuqFpIEROQyBGT09ELiDEkMahbiBow6BuZyBj4bunYSBi4bqhbiDEkcOjIMSRxrDhu6NjIHjDoWMgbmjhuq1uITwvcD5cbiAgICAgICAgICBcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwib3JkZXItaW5mb1wiPlxuICAgICAgICAgICAgPGgzPlRow7RuZyB0aW4gxJHGoW4gaMOgbmc8L2gzPlxuICAgICAgICAgICAgPHA+PHN0cm9uZz5Nw6MgxJHGoW4gaMOgbmc6PC9zdHJvbmc+ICR7b3JkZXIub3JkZXJDb2RlfTwvcD5cbiAgICAgICAgICAgIDxwPjxzdHJvbmc+TmfDoHkgxJHhurd0IGjDoG5nOjwvc3Ryb25nPiAke25ldyBEYXRlKG9yZGVyLmNyZWF0ZWRBdCkudG9Mb2NhbGVTdHJpbmcoJ3ZpLVZOJyl9PC9wPlxuICAgICAgICAgICAgPHA+PHN0cm9uZz5QaMawxqFuZyB0aOG7qWMgdGhhbmggdG/DoW46PC9zdHJvbmc+ICR7b3JkZXIucGF5bWVudE1ldGhvZCA9PT0gJ2NvZCcgPyAnVGhhbmggdG/DoW4ga2hpIG5o4bqtbiBow6BuZyAoQ09EKScgOiAnVGhhbmggdG/DoW4gdHLhu7FjIHR1eeG6v24nfTwvcD5cbiAgICAgICAgICAgIDxwPjxzdHJvbmc+VHLhuqFuZyB0aMOhaSDEkcahbiBow6BuZzo8L3N0cm9uZz4gJHtvcmRlci5zdGF0dXMgPT09ICdwZW5kaW5nJyA/ICfEkGFuZyB44butIGzDvScgOiBvcmRlci5zdGF0dXN9PC9wPlxuICAgICAgICAgICAgJHtkaXNjb3VudEluZm99XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgXG4gICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBwaW5nLWluZm9cIj5cbiAgICAgICAgICAgIDxoMz5UaMO0bmcgdGluIGdpYW8gaMOgbmc8L2gzPlxuICAgICAgICAgICAgPHA+PHN0cm9uZz5I4buNIHTDqm46PC9zdHJvbmc+ICR7b3JkZXIuc2hpcHBpbmdJbmZvICYmIG9yZGVyLnNoaXBwaW5nSW5mby5mdWxsTmFtZSA/IG9yZGVyLnNoaXBwaW5nSW5mby5mdWxsTmFtZSA6ICcnfTwvcD5cbiAgICAgICAgICAgIDxwPjxzdHJvbmc+xJDhu4thIGNo4buJOjwvc3Ryb25nPiAke29yZGVyLnNoaXBwaW5nSW5mbyAmJiBvcmRlci5zaGlwcGluZ0luZm8uYWRkcmVzcyA/IG9yZGVyLnNoaXBwaW5nSW5mby5hZGRyZXNzIDogJyd9PC9wPlxuICAgICAgICAgICAgPHA+PHN0cm9uZz5T4buRIMSRaeG7h24gdGhv4bqhaTo8L3N0cm9uZz4gJHtvcmRlci5zaGlwcGluZ0luZm8gJiYgb3JkZXIuc2hpcHBpbmdJbmZvLnBob25lID8gb3JkZXIuc2hpcHBpbmdJbmZvLnBob25lIDogJyd9PC9wPlxuICAgICAgICAgICAgPHA+PHN0cm9uZz5FbWFpbDo8L3N0cm9uZz4gJHtvcmRlci5zaGlwcGluZ0luZm8gJiYgb3JkZXIuc2hpcHBpbmdJbmZvLmVtYWlsID8gb3JkZXIuc2hpcHBpbmdJbmZvLmVtYWlsIDogJyd9PC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIFxuICAgICAgICAgIDxoMz5DaGkgdGnhur90IMSRxqFuIGjDoG5nPC9oMz5cbiAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICA8dGggc3R5bGU9XCJwYWRkaW5nOiAxMHB4OyB0ZXh0LWFsaWduOiBsZWZ0O1wiPlPhuqNuIHBo4bqpbTwvdGg+XG4gICAgICAgICAgICAgICAgPHRoIHN0eWxlPVwicGFkZGluZzogMTBweDsgdGV4dC1hbGlnbjogY2VudGVyO1wiPlPhu5EgbMaw4bujbmc8L3RoPlxuICAgICAgICAgICAgICAgIDx0aCBzdHlsZT1cInBhZGRpbmc6IDEwcHg7IHRleHQtYWxpZ246IHJpZ2h0O1wiPsSQxqFuIGdpw6E8L3RoPlxuICAgICAgICAgICAgICAgIDx0aCBzdHlsZT1cInBhZGRpbmc6IDEwcHg7IHRleHQtYWxpZ246IHJpZ2h0O1wiPlRow6BuaCB0aeG7gW48L3RoPlxuICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgJHtwcm9kdWN0c0xpc3R9XG4gICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgXG4gICAgICAgICAgPGRpdiBjbGFzcz1cInN1bW1hcnlcIiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6ICNmZmY7IHBhZGRpbmc6IDE1cHg7IGJvcmRlci1yYWRpdXM6IDhweDsgYm94LXNoYWRvdzogMCAxcHggM3B4IHJnYmEoMCwwLDAsMC4xKTtcIj5cbiAgICAgICAgICAgIDxwPlThu5VuZyBz4buRIHPhuqNuIHBo4bqpbTogJHt0b3RhbEl0ZW1zfTwvcD5cbiAgICAgICAgICAgIDxwPlThu5VuZyB0aeG7gW4gaMOgbmc6ICR7Zm9ybWF0Q3VycmVuY3kob3JkZXIuc3VidG90YWwgfHwgb3JkZXIudG90YWxBbW91bnQpfTwvcD5cbiAgICAgICAgICAgIDxwPlBow60gduG6rW4gY2h1eeG7g246ICR7Zm9ybWF0Q3VycmVuY3koc2hpcHBpbmdGZWUpfTwvcD5cbiAgICAgICAgICAgICR7b3JkZXIuY291cG9uICYmIG9yZGVyLmNvdXBvbi5kaXNjb3VudCA/IGA8cD5HaeG6o20gZ2nDoTogLSR7Zm9ybWF0Q3VycmVuY3kob3JkZXIuY291cG9uLmRpc2NvdW50KX08L3A+YCA6ICcnfVxuICAgICAgICAgICAgPHAgc3R5bGU9XCJmb250LXNpemU6IDE4cHg7IGNvbG9yOiAjNTFiYjFhO1wiPlThu5VuZyB0aGFuaCB0b8OhbjogJHtmb3JtYXRDdXJyZW5jeShvcmRlci50b3RhbEFtb3VudCl9PC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIFxuICAgICAgICAgICR7cXJDb2RlSW1hZ2UgPyBgXG4gICAgICAgICAgPGRpdiBjbGFzcz1cInFyY29kZVwiPlxuICAgICAgICAgICAgPHA+TcOjIFFSIMSRxqFuIGjDoG5nIGPhu6dhIGLhuqFuOjwvcD5cbiAgICAgICAgICAgIDxpbWcgc3JjPVwiJHtxckNvZGVJbWFnZX1cIiBhbHQ9XCJRUiBDb2RlXCI+XG4gICAgICAgICAgICA8cD5RdcOpdCBtw6MgbsOgeSDEkeG7gyB4ZW0gdGjDtG5nIHRpbiDEkcahbiBow6BuZzwvcD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICBgIDogJyd9XG4gICAgICAgICAgXG4gICAgICAgICAgPHAgY2xhc3M9XCJ0aGFuay15b3VcIj5D4bqjbSDGoW4gYuG6oW4gxJHDoyBs4buxYSBjaOG7jW4gRE5DIEZPT0QhPC9wPlxuICAgICAgICAgIFxuICAgICAgICAgIDxkaXYgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7XCI+XG4gICAgICAgICAgICA8YSBocmVmPVwiJHtFTlYuQ0xJRU5UX1VSTH0vdGFpLWtob2FuL2Rvbi1oYW5nXCIgY2xhc3M9XCJidG5cIj5YZW0gxJHGoW4gaMOgbmcgY+G7p2EgdMO0aTwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICBcbiAgICAgICAgICA8cD5O4bq/dSBi4bqhbiBjw7MgYuG6pXQga+G7syBjw6J1IGjhu49pIG7DoG8sIHZ1aSBsw7JuZyBsacOqbiBo4buHIHbhu5tpIGNow7puZyB0w7RpIHF1YSBlbWFpbCAke0VOVi5FTUFJTF9VU0VSTkFNRSB8fCAnc3VwcG9ydEBkbmNmb29kLmNvbSd9IGhv4bq3YyBn4buNaSDEkeG6v24gaG90bGluZSAwMzI2IDc0MzM5MS48L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyXCI+XG4gICAgICAgICAgPHA+wqkgJHtuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCl9IEROQyBGT09ELiDEkOG7i2EgY2jhu4k6IDI3MyBBbiBExrDGoW5nIFbGsMahbmcsIFBoxrDhu51uZyAzLCBRdeG6rW4gNSwgVFAuIEjhu5MgQ2jDrSBNaW5oLjwvcD5cbiAgICAgICAgICA8cD5FbWFpbCBuw6B5IMSRxrDhu6NjIGfhu61pIHThu7EgxJHhu5luZywgdnVpIGzDsm5nIGtow7RuZyB0cuG6oyBs4budaS48L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9ib2R5PlxuICAgIDwvaHRtbD5cbiAgYDtcbn07XG5cbi8vIEjDoG0gZ+G7rWkgZW1haWwgeMOhYyBuaOG6rW4gxJHGoW4gaMOgbmdcbmV4cG9ydCBjb25zdCBzZW5kT3JkZXJDb25maXJtYXRpb25FbWFpbCA9IGFzeW5jIChvcmRlcikgPT4ge1xuICB0cnkge1xuICAgIC8vIEtp4buDbSB0cmEgdOG6pXQgY+G6oyBjw6FjIHRow7RuZyB0aW4gY+G6p24gdGhp4bq/dCDEkeG7gyBn4butaSBlbWFpbFxuICAgIGlmICghb3JkZXIuc2hpcHBpbmdJbmZvKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIC8vIEto4bqvYyBwaOG7pWMgbOG7l2kgZW1haWwgYuG7iyB0aGnhur91IHRyb25nIHNoaXBwaW5nSW5mb1xuICAgIGlmICghb3JkZXIuc2hpcHBpbmdJbmZvLmVtYWlsKSB7XG4gICAgICAvLyBO4bq/dSBraMO0bmcgY8OzIGVtYWlsIHRyb25nIHNoaXBwaW5nSW5mbyBuaMawbmcgY8OzIHRyb25nIHVzZXJJZFxuICAgICAgaWYgKG9yZGVyLnVzZXJJZCAmJiBvcmRlci51c2VySWQuZW1haWwpIHtcbiAgICAgICAgb3JkZXIuc2hpcHBpbmdJbmZvLmVtYWlsID0gb3JkZXIudXNlcklkLmVtYWlsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBU4bqhbyBk4buvIGxp4buHdSBjaG8gbcOjIFFSXG4gICAgY29uc3QgcXJEYXRhID0ge1xuICAgICAgb3JkZXJDb2RlOiBvcmRlci5vcmRlckNvZGUsXG4gICAgICB0b3RhbEFtb3VudDogb3JkZXIudG90YWxBbW91bnQsXG4gICAgICBzdGF0dXM6IG9yZGVyLnN0YXR1cyxcbiAgICAgIGRhdGU6IG9yZGVyLmNyZWF0ZWRBdFxuICAgIH07XG4gICAgXG4gICAgLy8gVOG6oW8gbcOjIFFSXG4gICAgY29uc3QgcXJDb2RlSW1hZ2UgPSBhd2FpdCBnZW5lcmF0ZVFSQ29kZShxckRhdGEpO1xuICAgIFxuICAgIC8vIFThuqFvIG7hu5lpIGR1bmcgZW1haWxcbiAgICBjb25zdCBodG1sQ29udGVudCA9IGNyZWF0ZU9yZGVyRW1haWxUZW1wbGF0ZShvcmRlciwgcXJDb2RlSW1hZ2UpO1xuICAgIFxuICAgIC8vIEPhuqV1IGjDrG5oIGVtYWlsXG4gICAgY29uc3QgbWFpbE9wdGlvbnMgPSB7XG4gICAgICBmcm9tOiBgXCJETkMgRk9PRFwiIDwke0VOVi5FTUFJTF9VU0VSTkFNRX0+YCxcbiAgICAgIHRvOiBvcmRlci5zaGlwcGluZ0luZm8uZW1haWwsXG4gICAgICBzdWJqZWN0OiBgWMOhYyBuaOG6rW4gxJHGoW4gaMOgbmcgIyR7b3JkZXIub3JkZXJDb2RlfWAsXG4gICAgICBodG1sOiBodG1sQ29udGVudFxuICAgIH07XG4gICAgXG4gICAgLy8gR+G7rWkgZW1haWxcbiAgICBjb25zdCBpbmZvID0gYXdhaXQgdHJhbnNwb3J0ZXIuc2VuZE1haWwobWFpbE9wdGlvbnMpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxuLy8gQ3JlYXRlIGVtYWlsIHRlbXBsYXRlIGZvciBvcmRlciBzaGlwcGluZyBub3RpZmljYXRpb25cbmNvbnN0IGNyZWF0ZU9yZGVyU2hpcHBpbmdUZW1wbGF0ZSA9IChvcmRlcikgPT4ge1xuICAvLyBGb3JtYXQgY3VycmVuY3lcbiAgY29uc3QgZm9ybWF0Q3VycmVuY3kgPSAoYW1vdW50KSA9PiB7XG4gICAgcmV0dXJuIG5ldyBJbnRsLk51bWJlckZvcm1hdCgndmktVk4nLCB7XG4gICAgICBzdHlsZTogJ2N1cnJlbmN5JyxcbiAgICAgIGN1cnJlbmN5OiAnVk5EJ1xuICAgIH0pLmZvcm1hdChhbW91bnQpO1xuICB9O1xuICBcbiAgLy8gR2V0IHBheW1lbnQgc3RhdHVzIGFuZCBhbW91bnQgdG8gYmUgcGFpZFxuICBjb25zdCBpc1BhaWQgPSBvcmRlci5pc1BhaWQgfHwgZmFsc2U7XG4gIGNvbnN0IGFtb3VudFRvQmVQYWlkID0gaXNQYWlkID8gMCA6IChvcmRlci50b3RhbEFtb3VudCArIChvcmRlci5zaGlwcGluZ0ZlZSB8fCAwKSk7XG4gIFxuICAvLyBIYW5kbGUgY2FzZSB3aGVyZSBvcmRlckNvZGUgaXMgbWlzc2luZ1xuICBjb25zdCBvcmRlcklkZW50aWZpZXIgPSBvcmRlci5vcmRlckNvZGUgfHwgKG9yZGVyLl9pZCA/IG9yZGVyLl9pZC50b1N0cmluZygpLnNsaWNlKC02KS50b1VwcGVyQ2FzZSgpIDogJ04vQScpO1xuICBcbiAgLy8gR2V0IGN1c3RvbWVyIG5hbWUgZnJvbSBlaXRoZXIgc2hpcHBpbmdJbmZvIG9yIHVzZXJJZFxuICBsZXQgY3VzdG9tZXJOYW1lID0gJ1F1w70ga2jDoWNoJztcbiAgaWYgKG9yZGVyLnNoaXBwaW5nSW5mbyAmJiBvcmRlci5zaGlwcGluZ0luZm8uZnVsbE5hbWUpIHtcbiAgICBjdXN0b21lck5hbWUgPSBvcmRlci5zaGlwcGluZ0luZm8uZnVsbE5hbWU7XG4gIH0gZWxzZSBpZiAob3JkZXIudXNlcklkKSB7XG4gICAgaWYgKG9yZGVyLnVzZXJJZC5maXJzdE5hbWUgJiYgb3JkZXIudXNlcklkLmxhc3ROYW1lKSB7XG4gICAgICBjdXN0b21lck5hbWUgPSBgJHtvcmRlci51c2VySWQuZmlyc3ROYW1lfSAke29yZGVyLnVzZXJJZC5sYXN0TmFtZX1gO1xuICAgIH0gZWxzZSBpZiAob3JkZXIudXNlcklkLnVzZXJOYW1lKSB7XG4gICAgICBjdXN0b21lck5hbWUgPSBvcmRlci51c2VySWQudXNlck5hbWU7XG4gICAgfVxuICB9XG4gIFxuICAvLyBHZXQgc2hpcHBpbmcgYWRkcmVzcyBhbmQgcGhvbmUgZnJvbSBlaXRoZXIgc2hpcHBpbmdJbmZvIG9yIHVzZXJJZFxuICBsZXQgc2hpcHBpbmdBZGRyZXNzID0gJyc7XG4gIGxldCBwaG9uZU51bWJlciA9ICcnO1xuICBcbiAgaWYgKG9yZGVyLnNoaXBwaW5nSW5mbykge1xuICAgIHNoaXBwaW5nQWRkcmVzcyA9IG9yZGVyLnNoaXBwaW5nSW5mby5hZGRyZXNzIHx8ICcnO1xuICAgIHBob25lTnVtYmVyID0gb3JkZXIuc2hpcHBpbmdJbmZvLnBob25lIHx8ICcnO1xuICB9IGVsc2UgaWYgKG9yZGVyLnVzZXJJZCkge1xuICAgIHNoaXBwaW5nQWRkcmVzcyA9IG9yZGVyLnVzZXJJZC5hZGRyZXNzIHx8ICcnO1xuICAgIHBob25lTnVtYmVyID0gb3JkZXIudXNlcklkLnBob25lIHx8ICcnO1xuICB9XG4gIFxuICByZXR1cm4gYFxuICAgIDwhRE9DVFlQRSBodG1sPlxuICAgIDxodG1sPlxuICAgIDxoZWFkPlxuICAgICAgPG1ldGEgY2hhcnNldD1cIlVURi04XCI+XG4gICAgICA8dGl0bGU+xJDGoW4gaMOgbmcgY+G7p2EgYuG6oW4gxJFhbmcgxJHGsOG7o2MgZ2lhbyDEkeG6v248L3RpdGxlPlxuICAgICAgPHN0eWxlPlxuICAgICAgICBib2R5IHsgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmOyBsaW5lLWhlaWdodDogMS42OyBjb2xvcjogIzMzMzsgfVxuICAgICAgICAuY29udGFpbmVyIHsgbWF4LXdpZHRoOiA2MDBweDsgbWFyZ2luOiAwIGF1dG87IHBhZGRpbmc6IDIwcHg7IH1cbiAgICAgICAgLmhlYWRlciB7IGJhY2tncm91bmQtY29sb3I6ICM0MzYxZWU7IGNvbG9yOiB3aGl0ZTsgcGFkZGluZzogMTBweCAyMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IH1cbiAgICAgICAgLmNvbnRlbnQgeyBwYWRkaW5nOiAyMHB4OyBiYWNrZ3JvdW5kLWNvbG9yOiAjZjlmOWY5OyB9XG4gICAgICAgIC5mb290ZXIgeyB0ZXh0LWFsaWduOiBjZW50ZXI7IG1hcmdpbi10b3A6IDIwcHg7IGZvbnQtc2l6ZTogMTJweDsgY29sb3I6ICM3Nzc7IH1cbiAgICAgICAgLmhpZ2hsaWdodCB7IGNvbG9yOiAjNDM2MWVlOyBmb250LXdlaWdodDogYm9sZDsgfVxuICAgICAgICAucGF5bWVudC1pbmZvIHsgbWFyZ2luOiAyMHB4IDA7IHBhZGRpbmc6IDE1cHg7IGJhY2tncm91bmQtY29sb3I6ICNmZmY4ZTY7IGJvcmRlci1sZWZ0OiA0cHggc29saWQgI2ZmYzEwNzsgfVxuICAgICAgICAudGhhbmsteW91IHsgbWFyZ2luLXRvcDogMzBweDsgZm9udC13ZWlnaHQ6IGJvbGQ7IGNvbG9yOiAjNDM2MWVlOyB9XG4gICAgICA8L3N0eWxlPlxuICAgIDwvaGVhZD5cbiAgICA8Ym9keT5cbiAgICAgIDxkaXYgY2xhc3M9XCJjb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgICAgICAgIDxoMj7EkMahbiBow6BuZyBj4bunYSBi4bqhbiDEkWFuZyB0csOqbiDEkcaw4budbmcgZ2lhbyDEkeG6v24hPC9oMj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjb250ZW50XCI+XG4gICAgICAgICAgPHA+WGluIGNow6BvICR7Y3VzdG9tZXJOYW1lfSw8L3A+XG4gICAgICAgICAgPHA+Q2jDum5nIHTDtGkgdnVpIG3hu6tuZyB0aMO0bmcgYsOhbyBy4bqxbmcgxJHGoW4gaMOgbmcgPHNwYW4gY2xhc3M9XCJoaWdobGlnaHRcIj4jJHtvcmRlcklkZW50aWZpZXJ9PC9zcGFuPiBj4bunYSBi4bqhbiBoaeG7h24gxJFhbmcgxJHGsOG7o2MgZ2lhbyDEkeG6v24gxJHhu4thIGNo4buJIGPhu6dhIGLhuqFuLjwvcD5cbiAgICAgICAgICBcbiAgICAgICAgICA8cD48c3Ryb25nPlRow7RuZyB0aW4gZ2lhbyBow6BuZzo8L3N0cm9uZz48L3A+XG4gICAgICAgICAgPHVsPlxuICAgICAgICAgICAgPGxpPjxzdHJvbmc+xJDhu4thIGNo4buJOjwvc3Ryb25nPiAke3NoaXBwaW5nQWRkcmVzc308L2xpPlxuICAgICAgICAgICAgPGxpPjxzdHJvbmc+U+G7kSDEkWnhu4duIHRob+G6oWk6PC9zdHJvbmc+ICR7cGhvbmVOdW1iZXJ9PC9saT5cbiAgICAgICAgICAgIDxsaT48c3Ryb25nPlThu5VuZyBnacOhIHRy4buLIMSRxqFuIGjDoG5nOjwvc3Ryb25nPiAke2Zvcm1hdEN1cnJlbmN5KG9yZGVyLnRvdGFsQW1vdW50ICsgKG9yZGVyLnNoaXBwaW5nRmVlIHx8IDApKX08L2xpPlxuICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgXG4gICAgICAgICAgJHshaXNQYWlkID8gYFxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYXltZW50LWluZm9cIj5cbiAgICAgICAgICAgIDxwPjxzdHJvbmc+VGjDtG5nIHRpbiB0aGFuaCB0b8Ohbjo8L3N0cm9uZz48L3A+XG4gICAgICAgICAgICA8cD5QaMawxqFuZyB0aOG7qWMgdGhhbmggdG/DoW46ICR7b3JkZXIucGF5bWVudE1ldGhvZCA9PT0gJ2NvZCcgPyAnVGhhbmggdG/DoW4ga2hpIG5o4bqtbiBow6BuZyAoQ09EKScgOiBvcmRlci5wYXltZW50TWV0aG9kfTwvcD5cbiAgICAgICAgICAgIDxwPlPhu5EgdGnhu4FuIGPhuqduIHRoYW5oIHRvw6FuOiA8c3BhbiBjbGFzcz1cImhpZ2hsaWdodFwiPiR7Zm9ybWF0Q3VycmVuY3koYW1vdW50VG9CZVBhaWQpfTwvc3Bhbj48L3A+XG4gICAgICAgICAgICA8cD5WdWkgbMOybmcgY2h14bqpbiBi4buLIHPhu5EgdGnhu4FuIGNow61uaCB4w6FjIMSR4buDIHF1w6EgdHLDrG5oIGdpYW8gaMOgbmcgZGnhu4VuIHJhIHRodeG6rW4gbOG7o2kuPC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIGAgOiBgXG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBheW1lbnQtaW5mb1wiIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogI2U3ZjdlNzsgYm9yZGVyLWxlZnQ6IDRweCBzb2xpZCAjNENBRjUwO1wiPlxuICAgICAgICAgICAgPHA+PHN0cm9uZz5UaMO0bmcgdGluIHRoYW5oIHRvw6FuOjwvc3Ryb25nPjwvcD5cbiAgICAgICAgICAgIDxwPsSQxqFuIGjDoG5nIGPhu6dhIGLhuqFuIMSRw6MgxJHGsOG7o2MgdGhhbmggdG/DoW4gxJHhuqd5IMSR4bunLjwvcD5cbiAgICAgICAgICAgIDxwPkLhuqFuIGNo4buJIGPhuqduIG5o4bqtbiBow6BuZyBtw6Aga2jDtG5nIGPhuqduIHRoYW5oIHRvw6FuIHRow6ptIGtob+G6o24gbsOgby48L3A+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgYH1cbiAgICAgICAgICBcbiAgICAgICAgICA8cD7EkMahbiBow6BuZyBj4bunYSBi4bqhbiBk4buxIGtp4bq/biBz4bq9IMSRxrDhu6NjIGdpYW8gdHJvbmcgbmfDoHkuIE5ow6JuIHZpw6puIGdpYW8gaMOgbmcgc+G6vSBsacOqbiBo4buHIHbhu5tpIGLhuqFuIHRyxrDhu5tjIGtoaSBnaWFvLjwvcD5cbiAgICAgICAgICBcbiAgICAgICAgICA8cD5O4bq/dSBi4bqhbiBraMO0bmcgY8OzIG5ow6AgdsOgbyB0aOG7nWkgxJFp4buDbSBnaWFvIGjDoG5nLCB2dWkgbMOybmcgbGnDqm4gaOG7hyB24bubaSBjaMO6bmcgdMO0aSDEkeG7gyBz4bqvcCB44bq/cCBs4bqhaSB0aOG7nWkgZ2lhbiBnaWFvIGjDoG5nIHBow7kgaOG7o3AuPC9wPlxuICAgICAgICAgIFxuICAgICAgICAgIDxwIGNsYXNzPVwidGhhbmsteW91XCI+Q+G6o20gxqFuIGLhuqFuIMSRw6MgbOG7sWEgY2jhu41uIFNpw6p1IFRo4buLIFRo4buxYyBQaOG6qW0gU+G6oWNoITwvcD5cbiAgICAgICAgICBcbiAgICAgICAgICA8cD5O4bq/dSBi4bqhbiBjw7MgYuG6pXQga+G7syBjw6J1IGjhu49pIG7DoG8sIHZ1aSBsw7JuZyBsacOqbiBo4buHIHbhu5tpIGNow7puZyB0w7RpIHF1YSBlbWFpbCBzdXBwb3J0QGNodW9pa29pY2hvLmNvbSBob+G6t2MgZ+G7jWkgxJHhur9uIGhvdGxpbmUgMTkwMCA2Nzg5LjwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cbiAgICAgICAgICA8cD7CqSAyMDIzIFNpw6p1IFRo4buLIFRo4buxYyBQaOG6qW0gU+G6oWNoLiDEkOG7i2EgY2jhu4k6IDI3MyBBbiBExrDGoW5nIFbGsMahbmcsIFBoxrDhu51uZyAzLCBRdeG6rW4gNSwgVFAuIEjhu5MgQ2jDrSBNaW5oLjwvcD5cbiAgICAgICAgICA8cD5FbWFpbCBuw6B5IMSRxrDhu6NjIGfhu61pIHThu7EgxJHhu5luZywgdnVpIGzDsm5nIGtow7RuZyB0cuG6oyBs4budaS48L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9ib2R5PlxuICAgIDwvaHRtbD5cbiAgYDtcbn07XG5cbi8vIEZ1bmN0aW9uIHRvIHNlbmQgZW1haWwgbm90aWZpY2F0aW9uIHdoZW4gb3JkZXIgaXMgYmVpbmcgZGVsaXZlcmVkXG5leHBvcnQgY29uc3Qgc2VuZE9yZGVyU2hpcHBpbmdFbWFpbCA9IGFzeW5jIChvcmRlcikgPT4ge1xuICAvLyBDaGVjayBpZiBvcmRlciBoYXMgZW1haWwgaW5mb3JtYXRpb24gZWl0aGVyIGluIHNoaXBwaW5nSW5mbyBvciB1c2VySWRcbiAgbGV0IHJlY2lwaWVudEVtYWlsID0gbnVsbDtcbiAgXG4gIC8vIEZpcnN0IHRyeSB0byBnZXQgZW1haWwgZnJvbSBzaGlwcGluZ0luZm9cbiAgaWYgKG9yZGVyLnNoaXBwaW5nSW5mbyAmJiBvcmRlci5zaGlwcGluZ0luZm8uZW1haWwpIHtcbiAgICByZWNpcGllbnRFbWFpbCA9IG9yZGVyLnNoaXBwaW5nSW5mby5lbWFpbDtcbiAgfSBcbiAgLy8gSWYgbm90IGF2YWlsYWJsZSwgdHJ5IHRvIGdldCBmcm9tIHVzZXJJZCBpZiBpdCdzIHBvcHVsYXRlZFxuICBlbHNlIGlmIChvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLmVtYWlsKSB7XG4gICAgcmVjaXBpZW50RW1haWwgPSBvcmRlci51c2VySWQuZW1haWw7XG4gIH1cbiAgXG4gIGlmICghcmVjaXBpZW50RW1haWwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgXG4gIC8vIEhhbmRsZSBjYXNlIHdoZXJlIG9yZGVyQ29kZSBpcyBtaXNzaW5nXG4gIGNvbnN0IG9yZGVySWRlbnRpZmllciA9IG9yZGVyLm9yZGVyQ29kZSB8fCAob3JkZXIuX2lkID8gb3JkZXIuX2lkLnRvU3RyaW5nKCkuc2xpY2UoLTYpLnRvVXBwZXJDYXNlKCkgOiAnTi9BJyk7XG4gIFxuICAvLyBDcmVhdGUgZW1haWwgY29udGVudFxuICBjb25zdCBodG1sQ29udGVudCA9IGNyZWF0ZU9yZGVyU2hpcHBpbmdUZW1wbGF0ZShvcmRlcik7XG4gIFxuICAvLyBDb25maWd1cmUgZW1haWxcbiAgY29uc3QgbWFpbE9wdGlvbnMgPSB7XG4gICAgZnJvbTogYFwiRE5DIEZPT0RcIiA8JHtFTlYuRU1BSUxfVVNFUk5BTUUgfHwgJ25vLXJlcGx5QGRuY2Zvb2QuY29tJ30+YCxcbiAgICB0bzogcmVjaXBpZW50RW1haWwsXG4gICAgc3ViamVjdDogYMSQxqFuIGjDoG5nICMke29yZGVySWRlbnRpZmllcn0gxJFhbmcgxJHGsOG7o2MgZ2lhbyDEkeG6v24gYuG6oW5gLFxuICAgIGh0bWw6IGh0bWxDb250ZW50XG4gIH07XG4gIFxuICAvLyBTZW5kIGVtYWlsXG4gIGNvbnN0IGluZm8gPSBhd2FpdCB0cmFuc3BvcnRlci5zZW5kTWFpbChtYWlsT3B0aW9ucyk7XG4gIHJldHVybiB0cnVlO1xufTtcblxuZXhwb3J0IGRlZmF1bHQge1xuICBzZW5kT3JkZXJDb25maXJtYXRpb25FbWFpbCxcbiAgc2VuZE9yZGVyU2hpcHBpbmdFbWFpbFxufTsgIl0sIm1hcHBpbmdzIjoiMEtBQUEsSUFBQUEsV0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsT0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsT0FBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBLFlBQTRCLFNBQUFELHVCQUFBSSxDQUFBLFVBQUFBLENBQUEsSUFBQUEsQ0FBQSxDQUFBQyxVQUFBLEdBQUFELENBQUEsS0FBQUUsT0FBQSxFQUFBRixDQUFBOztBQUU1QjtBQUNBRyxlQUFNLENBQUNDLE1BQU0sQ0FBQyxDQUFDOztBQUVmO0FBQ0E7QUFDQSxNQUFNQyxHQUFHLEdBQUc7RUFDVkMsY0FBYyxFQUFFQyxPQUFPLENBQUNDLEdBQUcsQ0FBQ0YsY0FBYyxJQUFJLHNCQUFzQjtFQUNwRUcsY0FBYyxFQUFFRixPQUFPLENBQUNDLEdBQUcsQ0FBQ0MsY0FBYyxJQUFJLG1CQUFtQjtFQUNqRUMsVUFBVSxFQUFFSCxPQUFPLENBQUNDLEdBQUcsQ0FBQ0UsVUFBVSxJQUFJO0FBQ3hDLENBQUM7O0FBRUQ7QUFDQSxNQUFNQyxXQUFXLEdBQUdDLG1CQUFVLENBQUNDLGVBQWUsQ0FBQztFQUM3Q0MsT0FBTyxFQUFFLE9BQU87RUFDaEJDLElBQUksRUFBRSxnQkFBZ0I7RUFDdEJDLElBQUksRUFBRSxHQUFHO0VBQ1RDLE1BQU0sRUFBRSxLQUFLO0VBQ2JDLElBQUksRUFBRTtJQUNKQyxJQUFJLEVBQUVkLEdBQUcsQ0FBQ0MsY0FBYztJQUN4QmMsSUFBSSxFQUFFZixHQUFHLENBQUNJO0VBQ1osQ0FBQztFQUNEWSxHQUFHLEVBQUU7SUFDSEMsa0JBQWtCLEVBQUU7RUFDdEI7QUFDRixDQUFDLENBQUM7O0FBRUY7QUFDQSxNQUFNQyxjQUFjLEdBQUcsTUFBQUEsQ0FBT0MsSUFBSSxL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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNILENBQUM7O0FBRUQ7QUFDTyxNQUFNWSxzQkFBc0IsR0FBRyxNQUFBQSxDQUFPdEUsS0FBSyxLQUFLO0VBQ3JEO0VBQ0EsSUFBSXVFLGNBQWMsR0FBRyxJQUFJOztFQUV6QjtFQUNBLElBQUl2RSxLQUFLLENBQUMrQixZQUFZLElBQUkvQixLQUFLLENBQUMrQixZQUFZLENBQUNTLEtBQUssRUFBRTtJQUNsRCtCLGNBQWMsR0FBR3ZFLEtBQUssQ0FBQytCLFlBQVksQ0FBQ1MsS0FBSztFQUMzQztFQUNBO0VBQUEsS0FDSyxJQUFJeEMsS0FBSyxDQUFDNEMsTUFBTSxJQUFJNUMsS0FBSyxDQUFDNEMsTUFBTSxDQUFDSixLQUFLLEVBQUU7SUFDM0MrQixjQUFjLEdBQUd2RSxLQUFLLENBQUM0QyxNQUFNLENBQUNKLEtBQUs7RUFDckM7O0VBRUEsSUFBSSxDQUFDK0IsY0FBYyxFQUFFO0lBQ25CLE9BQU8sS0FBSztFQUNkOztFQUVBO0VBQ0EsTUFBTVosZUFBZSxHQUFHM0QsS0FBSyxDQUFDOEIsU0FBUyxLQUFLOUIsS0FBSyxDQUFDNEQsR0FBRyxHQUFHNUQsS0FBSyxDQUFDNEQsR0FBRyxDQUFDQyxRQUFRLENBQUMsQ0FBQyxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ0MsV0FBVyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUM7O0VBRTdHO0VBQ0EsTUFBTWhCLFdBQVcsR0FBR1MsMkJBQTJCLENBQUN4RCxLQUFLLENBQUM7O0VBRXREO0VBQ0EsTUFBTWdELFdBQVcsR0FBRztJQUNsQkMsSUFBSSxFQUFFLGVBQWUzRSxHQUFHLENBQUNDLGNBQWMsSUFBSSxzQkFBc0IsR0FBRztJQUNwRTJFLEVBQUUsRUFBRXFCLGNBQWM7SUFDbEJwQixPQUFPLEVBQUUsYUFBYVEsZUFBZSx5QkFBeUI7SUFDOURQLElBQUksRUFBRUw7RUFDUixDQUFDOztFQUVEO0VBQ0EsTUFBTU0sSUFBSSxHQUFHLE1BQU16RSxXQUFXLENBQUMwRSxRQUFRLENBQUNOLFdBQVcsQ0FBQztFQUNwRCxPQUFPLElBQUk7QUFDYixDQUFDLENBQUNPLE9BQUEsQ0FBQWUsc0JBQUEsR0FBQUEsc0JBQUEsS0FBQUUsUUFBQSxHQUFBakIsT0FBQSxDQUFBcEYsT0FBQTs7QUFFYTtFQUNid0UsMEJBQTBCO0VBQzFCMkI7QUFDRixDQUFDIiwiaWdub3JlTGlzdCI6W119