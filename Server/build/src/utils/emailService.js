"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.sendOrderShippingEmail = exports.sendOrderConfirmationEmail = exports.default = void 0;var _nodemailer = _interopRequireDefault(require("nodemailer"));
var _qrcode = _interopRequireDefault(require("qrcode"));
var _dotenv = _interopRequireDefault(require("dotenv"));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfbm9kZW1haWxlciIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwiX3FyY29kZSIsIl9kb3RlbnYiLCJkb3RlbnYiLCJjb25maWciLCJFTlYiLCJFTUFJTF9VU0VSTkFNRSIsInByb2Nlc3MiLCJlbnYiLCJFTUFJTF9QQVNTV09SRCIsIkNMSUVOVF9VUkwiLCJ0cmFuc3BvcnRlciIsIm5vZGVtYWlsZXIiLCJjcmVhdGVUcmFuc3BvcnQiLCJzZXJ2aWNlIiwiaG9zdCIsInBvcnQiLCJzZWN1cmUiLCJhdXRoIiwidXNlciIsInBhc3MiLCJ0bHMiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJnZW5lcmF0ZVFSQ29kZSIsImRhdGEiLCJRUkNvZGUiLCJ0b0RhdGFVUkwiLCJKU09OIiwic3RyaW5naWZ5IiwiZXJyb3IiLCJjcmVhdGVPcmRlckVtYWlsVGVtcGxhdGUiLCJvcmRlciIsInFyQ29kZUltYWdlIiwidG90YWxJdGVtcyIsInByb2R1Y3RzIiwicmVkdWNlIiwic3VtIiwiaXRlbSIsInF1YW50aXR5IiwiZm9ybWF0Q3VycmVuY3kiLCJhbW91bnQiLCJJbnRsIiwiTnVtYmVyRm9ybWF0Iiwic3R5bGUiLCJjdXJyZW5jeSIsImZvcm1hdCIsInByb2R1Y3RzTGlzdCIsIm1hcCIsInByb2R1Y3QiLCJwcm9kdWN0SWQiLCJwcm9kdWN0TmFtZSIsInByb2R1Y3RQcmljZSIsInN1YnRvdGFsIiwicHJvZHVjdEltYWdlcyIsImpvaW4iLCJkaXNjb3VudEluZm8iLCJjb3Vwb24iLCJkaXNjb3VudCIsImNvZGUiLCJzaGlwcGluZ0ZlZSIsImRlbGl2ZXJ5RmVlIiwib3JkZXJDb2RlIiwic2hpcHBpbmdJbmZvIiwiZnVsbE5hbWUiLCJEYXRlIiwiY3JlYXRlZEF0IiwidG9Mb2NhbGVTdHJpbmciLCJwYXltZW50TWV0aG9kIiwic3RhdHVzIiwiYWRkcmVzcyIsInBob25lIiwiZW1haWwiLCJ0b3RhbEFtb3VudCIsImdldEZ1bGxZZWFyIiwic2VuZE9yZGVyQ29uZmlybWF0aW9uRW1haWwiLCJ1c2VySWQiLCJxckRhdGEiLCJkYXRlIiwiaHRtbENvbnRlbnQiLCJtYWlsT3B0aW9ucyIsImZyb20iLCJ0byIsInN1YmplY3QiLCJodG1sIiwiaW5mbyIsInNlbmRNYWlsIiwiZXhwb3J0cyIsImNyZWF0ZU9yZGVyU2hpcHBpbmdUZW1wbGF0ZSIsImlzUGFpZCIsImFtb3VudFRvQmVQYWlkIiwib3JkZXJJZGVudGlmaWVyIiwiX2lkIiwidG9TdHJpbmciLCJzbGljZSIsInRvVXBwZXJDYXNlIiwiY3VzdG9tZXJOYW1lIiwiZmlyc3ROYW1lIiwibGFzdE5hbWUiLCJ1c2VyTmFtZSIsInNoaXBwaW5nQWRkcmVzcyIsInBob25lTnVtYmVyIiwic2VuZE9yZGVyU2hpcHBpbmdFbWFpbCIsInJlY2lwaWVudEVtYWlsIiwiX2RlZmF1bHQiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3V0aWxzL2VtYWlsU2VydmljZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbm9kZW1haWxlciBmcm9tICdub2RlbWFpbGVyJztcclxuaW1wb3J0IFFSQ29kZSBmcm9tICdxcmNvZGUnO1xyXG5pbXBvcnQgZG90ZW52IGZyb20gJ2RvdGVudic7XHJcblxyXG4vLyBD4bqldSBow6xuaCBkb3RlbnYgxJHhu4MgxJHhu41jIGJp4bq/biBtw7RpIHRyxrDhu51uZ1xyXG5kb3RlbnYuY29uZmlnKCk7XHJcblxyXG4vLyBUaGnhur90IGzhuq1wIGJp4bq/biBtw7RpIHRyxrDhu51uZyAtIFPhu61hIGzhu5dpIEVTTGludFxyXG4vKiBnbG9iYWwgcHJvY2VzcyAqL1xyXG5jb25zdCBFTlYgPSB7XHJcbiAgRU1BSUxfVVNFUk5BTUU6IHByb2Nlc3MuZW52LkVNQUlMX1VTRVJOQU1FIHx8ICd5b3VyLWVtYWlsQGdtYWlsLmNvbScsXHJcbiAgRU1BSUxfUEFTU1dPUkQ6IHByb2Nlc3MuZW52LkVNQUlMX1BBU1NXT1JEIHx8ICd5b3VyLWFwcC1wYXNzd29yZCcsXHJcbiAgQ0xJRU5UX1VSTDogcHJvY2Vzcy5lbnYuQ0xJRU5UX1VSTCB8fCAnaHR0cHM6Ly9xdWFubHl0aHVjcGhhbS1jbGllbnQudmVyY2VsLmFwcCdcclxufTtcclxuXHJcbi8vIEto4bufaSB04bqhbyB0cmFuc3BvcnRlciDEkeG7gyBn4butaSBlbWFpbFxyXG5jb25zdCB0cmFuc3BvcnRlciA9IG5vZGVtYWlsZXIuY3JlYXRlVHJhbnNwb3J0KHtcclxuICBzZXJ2aWNlOiAnZ21haWwnLFxyXG4gIGhvc3Q6ICdzbXRwLmdtYWlsLmNvbScsXHJcbiAgcG9ydDogNTg3LFxyXG4gIHNlY3VyZTogZmFsc2UsXHJcbiAgYXV0aDoge1xyXG4gICAgdXNlcjogRU5WLkVNQUlMX1VTRVJOQU1FLFxyXG4gICAgcGFzczogRU5WLkVNQUlMX1BBU1NXT1JEXHJcbiAgfSxcclxuICB0bHM6IHtcclxuICAgIHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2VcclxuICB9XHJcbn0pO1xyXG5cclxuLy8gVOG6oW8gbcOjIFFSIHThu6sgZOG7ryBsaeG7h3VcclxuY29uc3QgZ2VuZXJhdGVRUkNvZGUgPSBhc3luYyAoZGF0YSkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gYXdhaXQgUVJDb2RlLnRvRGF0YVVSTChKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIFThuqFvIG7hu5lpIGR1bmcgZW1haWwgxJHhurd0IGjDoG5nIHRow6BuaCBjw7RuZ1xyXG5jb25zdCBjcmVhdGVPcmRlckVtYWlsVGVtcGxhdGUgPSAob3JkZXIsIHFyQ29kZUltYWdlKSA9PiB7XHJcbiAgLy8gVMOtbmggdOG7lW5nIHPhu5EgbMaw4bujbmcgc+G6o24gcGjhuqltXHJcbiAgY29uc3QgdG90YWxJdGVtcyA9IG9yZGVyLnByb2R1Y3RzLnJlZHVjZSgoc3VtLCBpdGVtKSA9PiBzdW0gKyBpdGVtLnF1YW50aXR5LCAwKTtcclxuICBcclxuICAvLyBGb3JtYXQgdGnhu4FuIHThu4dcclxuICBjb25zdCBmb3JtYXRDdXJyZW5jeSA9IChhbW91bnQpID0+IHtcclxuICAgIHJldHVybiBuZXcgSW50bC5OdW1iZXJGb3JtYXQoJ3ZpLVZOJywge1xyXG4gICAgICBzdHlsZTogJ2N1cnJlbmN5JyxcclxuICAgICAgY3VycmVuY3k6ICdWTkQnXHJcbiAgICB9KS5mb3JtYXQoYW1vdW50KTtcclxuICB9O1xyXG4gIFxyXG4gIC8vIFThuqFvIGRhbmggc8OhY2ggc+G6o24gcGjhuqltIEhUTUxcclxuICBjb25zdCBwcm9kdWN0c0xpc3QgPSBvcmRlci5wcm9kdWN0cy5tYXAoaXRlbSA9PiB7XHJcbiAgICBjb25zdCBwcm9kdWN0ID0gaXRlbS5wcm9kdWN0SWQ7XHJcbiAgICBjb25zdCBwcm9kdWN0TmFtZSA9IHByb2R1Y3QucHJvZHVjdE5hbWUgfHwgJ1PhuqNuIHBo4bqpbSc7XHJcbiAgICBjb25zdCBwcm9kdWN0UHJpY2UgPSBwcm9kdWN0LnByb2R1Y3RQcmljZSB8fCAwO1xyXG4gICAgY29uc3Qgc3VidG90YWwgPSBpdGVtLnF1YW50aXR5ICogcHJvZHVjdFByaWNlO1xyXG4gICAgXHJcbiAgICByZXR1cm4gYFxyXG4gICAgICA8dHI+XHJcbiAgICAgICAgPHRkIHN0eWxlPVwicGFkZGluZzogMTBweDsgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNkZGQ7XCI+XHJcbiAgICAgICAgICA8ZGl2IHN0eWxlPVwiZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjtcIj5cclxuICAgICAgICAgICAgJHtwcm9kdWN0LnByb2R1Y3RJbWFnZXMgJiYgcHJvZHVjdC5wcm9kdWN0SW1hZ2VzWzBdID8gXHJcbiAgICAgICAgICAgICAgYDxpbWcgc3JjPVwiJHtwcm9kdWN0LnByb2R1Y3RJbWFnZXNbMF19XCIgYWx0PVwiJHtwcm9kdWN0TmFtZX1cIiBzdHlsZT1cIndpZHRoOiA1MHB4OyBoZWlnaHQ6IDUwcHg7IG9iamVjdC1maXQ6IGNvdmVyOyBtYXJnaW4tcmlnaHQ6IDEwcHg7IGJvcmRlci1yYWRpdXM6IDRweDtcIj5gIDogXHJcbiAgICAgICAgICAgICAgJyd9XHJcbiAgICAgICAgICAgIDxkaXY+JHtwcm9kdWN0TmFtZX08L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvdGQ+XHJcbiAgICAgICAgPHRkIHN0eWxlPVwicGFkZGluZzogMTBweDsgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNkZGQ7IHRleHQtYWxpZ246IGNlbnRlcjtcIj4ke2l0ZW0ucXVhbnRpdHl9PC90ZD5cclxuICAgICAgICA8dGQgc3R5bGU9XCJwYWRkaW5nOiAxMHB4OyBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2RkZDsgdGV4dC1hbGlnbjogcmlnaHQ7XCI+JHtmb3JtYXRDdXJyZW5jeShwcm9kdWN0UHJpY2UpfTwvdGQ+XHJcbiAgICAgICAgPHRkIHN0eWxlPVwicGFkZGluZzogMTBweDsgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNkZGQ7IHRleHQtYWxpZ246IHJpZ2h0O1wiPiR7Zm9ybWF0Q3VycmVuY3koc3VidG90YWwpfTwvdGQ+XHJcbiAgICAgIDwvdHI+XHJcbiAgICBgO1xyXG4gIH0pLmpvaW4oJycpO1xyXG4gIFxyXG4gIC8vIFjDoWMgxJHhu4tuaCB0aMO0bmcgdGluIHbhu4EgbcOjIGdp4bqjbSBnacOhIG7hur91IGPDs1xyXG4gIGxldCBkaXNjb3VudEluZm8gPSAnJztcclxuICBpZiAob3JkZXIuY291cG9uICYmIG9yZGVyLmNvdXBvbi5kaXNjb3VudCkge1xyXG4gICAgZGlzY291bnRJbmZvID0gYFxyXG4gICAgICA8cD48c3Ryb25nPk3DoyBnaeG6o20gZ2nDoTo8L3N0cm9uZz4gJHtvcmRlci5jb3Vwb24uY29kZSB8fCAnxJDDoyDDoXAgZOG7pW5nJ308L3A+XHJcbiAgICAgIDxwPjxzdHJvbmc+R2nhuqNtIGdpw6E6PC9zdHJvbmc+ICR7Zm9ybWF0Q3VycmVuY3kob3JkZXIuY291cG9uLmRpc2NvdW50KX08L3A+XHJcbiAgICBgO1xyXG4gIH1cclxuXHJcbiAgLy8gWMOhYyDEkeG7i25oIHBow60gduG6rW4gY2h1eeG7g25cclxuICBjb25zdCBzaGlwcGluZ0ZlZSA9IG9yZGVyLnNoaXBwaW5nRmVlIHx8IG9yZGVyLmRlbGl2ZXJ5RmVlIHx8IDA7XHJcbiAgXHJcbiAgLy8gVOG6oW8gSFRNTCBjaG8gZW1haWxcclxuICByZXR1cm4gYFxyXG4gICAgPCFET0NUWVBFIGh0bWw+XHJcbiAgICA8aHRtbD5cclxuICAgIDxoZWFkPlxyXG4gICAgICA8bWV0YSBjaGFyc2V0PVwiVVRGLThcIj5cclxuICAgICAgPHRpdGxlPljDoWMgbmjhuq1uIMSRxqFuIGjDoG5nICMke29yZGVyLm9yZGVyQ29kZX08L3RpdGxlPlxyXG4gICAgICA8c3R5bGU+XHJcbiAgICAgICAgYm9keSB7IGZvbnQtZmFtaWx5OiBBcmlhbCwgc2Fucy1zZXJpZjsgbGluZS1oZWlnaHQ6IDEuNjsgY29sb3I6ICMzMzM7IH1cclxuICAgICAgICAuY29udGFpbmVyIHsgbWF4LXdpZHRoOiA2MDBweDsgbWFyZ2luOiAwIGF1dG87IHBhZGRpbmc6IDIwcHg7IH1cclxuICAgICAgICAuaGVhZGVyIHsgYmFja2dyb3VuZC1jb2xvcjogIzUxYmIxYTsgY29sb3I6IHdoaXRlOyBwYWRkaW5nOiAxNXB4IDIwcHg7IHRleHQtYWxpZ246IGNlbnRlcjsgYm9yZGVyLXJhZGl1czogOHB4IDhweCAwIDA7IH1cclxuICAgICAgICAuY29udGVudCB7IHBhZGRpbmc6IDIwcHg7IGJhY2tncm91bmQtY29sb3I6ICNmOWY5Zjk7IGJvcmRlci1yYWRpdXM6IDAgMCA4cHggOHB4OyB9XHJcbiAgICAgICAgLmZvb3RlciB7IHRleHQtYWxpZ246IGNlbnRlcjsgbWFyZ2luLXRvcDogMjBweDsgZm9udC1zaXplOiAxMnB4OyBjb2xvcjogIzc3NzsgfVxyXG4gICAgICAgIHRhYmxlIHsgd2lkdGg6IDEwMCU7IGJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7IG1hcmdpbi1ib3R0b206IDIwcHg7IH1cclxuICAgICAgICB0aCB7IGJhY2tncm91bmQtY29sb3I6ICNmMmYyZjI7IHRleHQtYWxpZ246IGxlZnQ7IHBhZGRpbmc6IDEwcHg7IH1cclxuICAgICAgICAuc3VtbWFyeSB7IG1hcmdpbi10b3A6IDIwcHg7IGZvbnQtd2VpZ2h0OiBib2xkOyB9XHJcbiAgICAgICAgLnFyY29kZSB7IHRleHQtYWxpZ246IGNlbnRlcjsgbWFyZ2luOiAyMHB4IDA7IH1cclxuICAgICAgICAucXJjb2RlIGltZyB7IG1heC13aWR0aDogMjAwcHg7IH1cclxuICAgICAgICAub3JkZXItaW5mbyB7IG1hcmdpbi1ib3R0b206IDIwcHg7IGJhY2tncm91bmQtY29sb3I6ICNmZmY7IHBhZGRpbmc6IDE1cHg7IGJvcmRlci1yYWRpdXM6IDhweDsgYm94LXNoYWRvdzogMCAxcHggM3B4IHJnYmEoMCwwLDAsMC4xKTsgfVxyXG4gICAgICAgIC5zaGlwcGluZy1pbmZvIHsgbWFyZ2luLWJvdHRvbTogMjBweDsgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjsgcGFkZGluZzogMTVweDsgYm9yZGVyLXJhZGl1czogOHB4OyBib3gtc2hhZG93OiAwIDFweCAzcHggcmdiYSgwLDAsMCwwLjEpOyB9XHJcbiAgICAgICAgLnRoYW5rLXlvdSB7IG1hcmdpbi10b3A6IDMwcHg7IGZvbnQtd2VpZ2h0OiBib2xkOyBjb2xvcjogIzUxYmIxYTsgdGV4dC1hbGlnbjogY2VudGVyOyBmb250LXNpemU6IDE4cHg7IH1cclxuICAgICAgICAubG9nbyB7IGZvbnQtc2l6ZTogMjRweDsgZm9udC13ZWlnaHQ6IGJvbGQ7IG1hcmdpbi1ib3R0b206IDEwcHg7IH1cclxuICAgICAgICAuYnRuIHsgZGlzcGxheTogaW5saW5lLWJsb2NrOyBiYWNrZ3JvdW5kLWNvbG9yOiAjNTFiYjFhOyBjb2xvcjogd2hpdGU7IHBhZGRpbmc6IDEwcHggMjBweDsgdGV4dC1kZWNvcmF0aW9uOiBub25lOyBib3JkZXItcmFkaXVzOiA0cHg7IG1hcmdpbi10b3A6IDE1cHg7IH1cclxuICAgICAgPC9zdHlsZT5cclxuICAgIDwvaGVhZD5cclxuICAgIDxib2R5PlxyXG4gICAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XHJcbiAgICAgICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzcz1cImxvZ29cIj5ETkMgRk9PRDwvZGl2PlxyXG4gICAgICAgICAgPGgyPljDoWMgbmjhuq1uIMSRxqFuIGjDoG5nICMke29yZGVyLm9yZGVyQ29kZX08L2gyPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJjb250ZW50XCI+XHJcbiAgICAgICAgICA8cD5YaW4gY2jDoG8gJHtvcmRlci5zaGlwcGluZ0luZm8gJiYgb3JkZXIuc2hpcHBpbmdJbmZvLmZ1bGxOYW1lID8gb3JkZXIuc2hpcHBpbmdJbmZvLmZ1bGxOYW1lIDogJ1F1w70ga2jDoWNoJ30sPC9wPlxyXG4gICAgICAgICAgPHA+Q+G6o20gxqFuIGLhuqFuIMSRw6MgxJHhurd0IGjDoG5nIHThuqFpIEROQyBGT09ELiDEkMahbiBow6BuZyBj4bunYSBi4bqhbiDEkcOjIMSRxrDhu6NjIHjDoWMgbmjhuq1uITwvcD5cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm9yZGVyLWluZm9cIj5cclxuICAgICAgICAgICAgPGgzPlRow7RuZyB0aW4gxJHGoW4gaMOgbmc8L2gzPlxyXG4gICAgICAgICAgICA8cD48c3Ryb25nPk3DoyDEkcahbiBow6BuZzo8L3N0cm9uZz4gJHtvcmRlci5vcmRlckNvZGV9PC9wPlxyXG4gICAgICAgICAgICA8cD48c3Ryb25nPk5nw6B5IMSR4bq3dCBow6BuZzo8L3N0cm9uZz4gJHtuZXcgRGF0ZShvcmRlci5jcmVhdGVkQXQpLnRvTG9jYWxlU3RyaW5nKCd2aS1WTicpfTwvcD5cclxuICAgICAgICAgICAgPHA+PHN0cm9uZz5QaMawxqFuZyB0aOG7qWMgdGhhbmggdG/DoW46PC9zdHJvbmc+ICR7b3JkZXIucGF5bWVudE1ldGhvZCA9PT0gJ2NvZCcgPyAnVGhhbmggdG/DoW4ga2hpIG5o4bqtbiBow6BuZyAoQ09EKScgOiAnVGhhbmggdG/DoW4gdHLhu7FjIHR1eeG6v24nfTwvcD5cclxuICAgICAgICAgICAgPHA+PHN0cm9uZz5UcuG6oW5nIHRow6FpIMSRxqFuIGjDoG5nOjwvc3Ryb25nPiAke29yZGVyLnN0YXR1cyA9PT0gJ3BlbmRpbmcnID8gJ8SQYW5nIHjhu60gbMO9JyA6IG9yZGVyLnN0YXR1c308L3A+XHJcbiAgICAgICAgICAgICR7ZGlzY291bnRJbmZvfVxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwcGluZy1pbmZvXCI+XHJcbiAgICAgICAgICAgIDxoMz5UaMO0bmcgdGluIGdpYW8gaMOgbmc8L2gzPlxyXG4gICAgICAgICAgICA8cD48c3Ryb25nPkjhu40gdMOqbjo8L3N0cm9uZz4gJHtvcmRlci5zaGlwcGluZ0luZm8gJiYgb3JkZXIuc2hpcHBpbmdJbmZvLmZ1bGxOYW1lID8gb3JkZXIuc2hpcHBpbmdJbmZvLmZ1bGxOYW1lIDogJyd9PC9wPlxyXG4gICAgICAgICAgICA8cD48c3Ryb25nPsSQ4buLYSBjaOG7iTo8L3N0cm9uZz4gJHtvcmRlci5zaGlwcGluZ0luZm8gJiYgb3JkZXIuc2hpcHBpbmdJbmZvLmFkZHJlc3MgPyBvcmRlci5zaGlwcGluZ0luZm8uYWRkcmVzcyA6ICcnfTwvcD5cclxuICAgICAgICAgICAgPHA+PHN0cm9uZz5T4buRIMSRaeG7h24gdGhv4bqhaTo8L3N0cm9uZz4gJHtvcmRlci5zaGlwcGluZ0luZm8gJiYgb3JkZXIuc2hpcHBpbmdJbmZvLnBob25lID8gb3JkZXIuc2hpcHBpbmdJbmZvLnBob25lIDogJyd9PC9wPlxyXG4gICAgICAgICAgICA8cD48c3Ryb25nPkVtYWlsOjwvc3Ryb25nPiAke29yZGVyLnNoaXBwaW5nSW5mbyAmJiBvcmRlci5zaGlwcGluZ0luZm8uZW1haWwgPyBvcmRlci5zaGlwcGluZ0luZm8uZW1haWwgOiAnJ308L3A+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgPGgzPkNoaSB0aeG6v3QgxJHGoW4gaMOgbmc8L2gzPlxyXG4gICAgICAgICAgPHRhYmxlPlxyXG4gICAgICAgICAgICA8dGhlYWQ+XHJcbiAgICAgICAgICAgICAgPHRyPlxyXG4gICAgICAgICAgICAgICAgPHRoIHN0eWxlPVwicGFkZGluZzogMTBweDsgdGV4dC1hbGlnbjogbGVmdDtcIj5T4bqjbiBwaOG6qW08L3RoPlxyXG4gICAgICAgICAgICAgICAgPHRoIHN0eWxlPVwicGFkZGluZzogMTBweDsgdGV4dC1hbGlnbjogY2VudGVyO1wiPlPhu5EgbMaw4bujbmc8L3RoPlxyXG4gICAgICAgICAgICAgICAgPHRoIHN0eWxlPVwicGFkZGluZzogMTBweDsgdGV4dC1hbGlnbjogcmlnaHQ7XCI+xJDGoW4gZ2nDoTwvdGg+XHJcbiAgICAgICAgICAgICAgICA8dGggc3R5bGU9XCJwYWRkaW5nOiAxMHB4OyB0ZXh0LWFsaWduOiByaWdodDtcIj5UaMOgbmggdGnhu4FuPC90aD5cclxuICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICA8L3RoZWFkPlxyXG4gICAgICAgICAgICA8dGJvZHk+XHJcbiAgICAgICAgICAgICAgJHtwcm9kdWN0c0xpc3R9XHJcbiAgICAgICAgICAgIDwvdGJvZHk+XHJcbiAgICAgICAgICA8L3RhYmxlPlxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwic3VtbWFyeVwiIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogI2ZmZjsgcGFkZGluZzogMTVweDsgYm9yZGVyLXJhZGl1czogOHB4OyBib3gtc2hhZG93OiAwIDFweCAzcHggcmdiYSgwLDAsMCwwLjEpO1wiPlxyXG4gICAgICAgICAgICA8cD5U4buVbmcgc+G7kSBz4bqjbiBwaOG6qW06ICR7dG90YWxJdGVtc308L3A+XHJcbiAgICAgICAgICAgIDxwPlThu5VuZyB0aeG7gW4gaMOgbmc6ICR7Zm9ybWF0Q3VycmVuY3kob3JkZXIuc3VidG90YWwgfHwgb3JkZXIudG90YWxBbW91bnQpfTwvcD5cclxuICAgICAgICAgICAgPHA+UGjDrSB24bqtbiBjaHV54buDbjogJHtmb3JtYXRDdXJyZW5jeShzaGlwcGluZ0ZlZSl9PC9wPlxyXG4gICAgICAgICAgICAke29yZGVyLmNvdXBvbiAmJiBvcmRlci5jb3Vwb24uZGlzY291bnQgPyBgPHA+R2nhuqNtIGdpw6E6IC0ke2Zvcm1hdEN1cnJlbmN5KG9yZGVyLmNvdXBvbi5kaXNjb3VudCl9PC9wPmAgOiAnJ31cclxuICAgICAgICAgICAgPHAgc3R5bGU9XCJmb250LXNpemU6IDE4cHg7IGNvbG9yOiAjNTFiYjFhO1wiPlThu5VuZyB0aGFuaCB0b8OhbjogJHtmb3JtYXRDdXJyZW5jeShvcmRlci50b3RhbEFtb3VudCl9PC9wPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICBcclxuICAgICAgICAgICR7cXJDb2RlSW1hZ2UgPyBgXHJcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicXJjb2RlXCI+XHJcbiAgICAgICAgICAgIDxwPk3DoyBRUiDEkcahbiBow6BuZyBj4bunYSBi4bqhbjo8L3A+XHJcbiAgICAgICAgICAgIDxpbWcgc3JjPVwiJHtxckNvZGVJbWFnZX1cIiBhbHQ9XCJRUiBDb2RlXCI+XHJcbiAgICAgICAgICAgIDxwPlF1w6l0IG3DoyBuw6B5IMSR4buDIHhlbSB0aMO0bmcgdGluIMSRxqFuIGjDoG5nPC9wPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICBgIDogJyd9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIDxwIGNsYXNzPVwidGhhbmsteW91XCI+Q+G6o20gxqFuIGLhuqFuIMSRw6MgbOG7sWEgY2jhu41uIEROQyBGT09EITwvcD5cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgPGRpdiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjtcIj5cclxuICAgICAgICAgICAgPGEgaHJlZj1cIiR7RU5WLkNMSUVOVF9VUkx9L3RhaS1raG9hbi9kb24taGFuZ1wiIGNsYXNzPVwiYnRuXCI+WGVtIMSRxqFuIGjDoG5nIGPhu6dhIHTDtGk8L2E+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgPHA+TuG6v3UgYuG6oW4gY8OzIGLhuqV0IGvhu7MgY8OidSBo4buPaSBuw6BvLCB2dWkgbMOybmcgbGnDqm4gaOG7hyB24bubaSBjaMO6bmcgdMO0aSBxdWEgZW1haWwgJHtFTlYuRU1BSUxfVVNFUk5BTUUgfHwgJ3N1cHBvcnRAZG5jZm9vZC5jb20nfSBob+G6t2MgZ+G7jWkgxJHhur9uIGhvdGxpbmUgMDMyNiA3NDMzOTEuPC9wPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cclxuICAgICAgICAgIDxwPsKpICR7bmV3IERhdGUoKS5nZXRGdWxsWWVhcigpfSBETkMgRk9PRC4gxJDhu4thIGNo4buJOiAyNzMgQW4gRMawxqFuZyBWxrDGoW5nLCBQaMaw4budbmcgMywgUXXhuq1uIDUsIFRQLiBI4buTIENow60gTWluaC48L3A+XHJcbiAgICAgICAgICA8cD5FbWFpbCBuw6B5IMSRxrDhu6NjIGfhu61pIHThu7EgxJHhu5luZywgdnVpIGzDsm5nIGtow7RuZyB0cuG6oyBs4budaS48L3A+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC9ib2R5PlxyXG4gICAgPC9odG1sPlxyXG4gIGA7XHJcbn07XHJcblxyXG4vLyBIw6BtIGfhu61pIGVtYWlsIHjDoWMgbmjhuq1uIMSRxqFuIGjDoG5nXHJcbmV4cG9ydCBjb25zdCBzZW5kT3JkZXJDb25maXJtYXRpb25FbWFpbCA9IGFzeW5jIChvcmRlcikgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICAvLyBLaeG7g20gdHJhIHThuqV0IGPhuqMgY8OhYyB0aMO0bmcgdGluIGPhuqduIHRoaeG6v3QgxJHhu4MgZ+G7rWkgZW1haWxcclxuICAgIGlmICghb3JkZXIuc2hpcHBpbmdJbmZvKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gS2jhuq9jIHBo4bulYyBs4buXaSBlbWFpbCBi4buLIHRoaeG6v3UgdHJvbmcgc2hpcHBpbmdJbmZvXHJcbiAgICBpZiAoIW9yZGVyLnNoaXBwaW5nSW5mby5lbWFpbCkge1xyXG4gICAgICAvLyBO4bq/dSBraMO0bmcgY8OzIGVtYWlsIHRyb25nIHNoaXBwaW5nSW5mbyBuaMawbmcgY8OzIHRyb25nIHVzZXJJZFxyXG4gICAgICBpZiAob3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC5lbWFpbCkge1xyXG4gICAgICAgIG9yZGVyLnNoaXBwaW5nSW5mby5lbWFpbCA9IG9yZGVyLnVzZXJJZC5lbWFpbDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gVOG6oW8gZOG7ryBsaeG7h3UgY2hvIG3DoyBRUlxyXG4gICAgY29uc3QgcXJEYXRhID0ge1xyXG4gICAgICBvcmRlckNvZGU6IG9yZGVyLm9yZGVyQ29kZSxcclxuICAgICAgdG90YWxBbW91bnQ6IG9yZGVyLnRvdGFsQW1vdW50LFxyXG4gICAgICBzdGF0dXM6IG9yZGVyLnN0YXR1cyxcclxuICAgICAgZGF0ZTogb3JkZXIuY3JlYXRlZEF0XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvLyBU4bqhbyBtw6MgUVJcclxuICAgIGNvbnN0IHFyQ29kZUltYWdlID0gYXdhaXQgZ2VuZXJhdGVRUkNvZGUocXJEYXRhKTtcclxuICAgIFxyXG4gICAgLy8gVOG6oW8gbuG7mWkgZHVuZyBlbWFpbFxyXG4gICAgY29uc3QgaHRtbENvbnRlbnQgPSBjcmVhdGVPcmRlckVtYWlsVGVtcGxhdGUob3JkZXIsIHFyQ29kZUltYWdlKTtcclxuICAgIFxyXG4gICAgLy8gQ+G6pXUgaMOsbmggZW1haWxcclxuICAgIGNvbnN0IG1haWxPcHRpb25zID0ge1xyXG4gICAgICBmcm9tOiBgXCJETkMgRk9PRFwiIDwke0VOVi5FTUFJTF9VU0VSTkFNRX0+YCxcclxuICAgICAgdG86IG9yZGVyLnNoaXBwaW5nSW5mby5lbWFpbCxcclxuICAgICAgc3ViamVjdDogYFjDoWMgbmjhuq1uIMSRxqFuIGjDoG5nICMke29yZGVyLm9yZGVyQ29kZX1gLFxyXG4gICAgICBodG1sOiBodG1sQ29udGVudFxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLy8gR+G7rWkgZW1haWxcclxuICAgIGNvbnN0IGluZm8gPSBhd2FpdCB0cmFuc3BvcnRlci5zZW5kTWFpbChtYWlsT3B0aW9ucyk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIENyZWF0ZSBlbWFpbCB0ZW1wbGF0ZSBmb3Igb3JkZXIgc2hpcHBpbmcgbm90aWZpY2F0aW9uXHJcbmNvbnN0IGNyZWF0ZU9yZGVyU2hpcHBpbmdUZW1wbGF0ZSA9IChvcmRlcikgPT4ge1xyXG4gIC8vIEZvcm1hdCBjdXJyZW5jeVxyXG4gIGNvbnN0IGZvcm1hdEN1cnJlbmN5ID0gKGFtb3VudCkgPT4ge1xyXG4gICAgcmV0dXJuIG5ldyBJbnRsLk51bWJlckZvcm1hdCgndmktVk4nLCB7XHJcbiAgICAgIHN0eWxlOiAnY3VycmVuY3knLFxyXG4gICAgICBjdXJyZW5jeTogJ1ZORCdcclxuICAgIH0pLmZvcm1hdChhbW91bnQpO1xyXG4gIH07XHJcbiAgXHJcbiAgLy8gR2V0IHBheW1lbnQgc3RhdHVzIGFuZCBhbW91bnQgdG8gYmUgcGFpZFxyXG4gIGNvbnN0IGlzUGFpZCA9IG9yZGVyLmlzUGFpZCB8fCBmYWxzZTtcclxuICBjb25zdCBhbW91bnRUb0JlUGFpZCA9IGlzUGFpZCA/IDAgOiAob3JkZXIudG90YWxBbW91bnQgKyAob3JkZXIuc2hpcHBpbmdGZWUgfHwgMCkpO1xyXG4gIFxyXG4gIC8vIEhhbmRsZSBjYXNlIHdoZXJlIG9yZGVyQ29kZSBpcyBtaXNzaW5nXHJcbiAgY29uc3Qgb3JkZXJJZGVudGlmaWVyID0gb3JkZXIub3JkZXJDb2RlIHx8IChvcmRlci5faWQgPyBvcmRlci5faWQudG9TdHJpbmcoKS5zbGljZSgtNikudG9VcHBlckNhc2UoKSA6ICdOL0EnKTtcclxuICBcclxuICAvLyBHZXQgY3VzdG9tZXIgbmFtZSBmcm9tIGVpdGhlciBzaGlwcGluZ0luZm8gb3IgdXNlcklkXHJcbiAgbGV0IGN1c3RvbWVyTmFtZSA9ICdRdcO9IGtow6FjaCc7XHJcbiAgaWYgKG9yZGVyLnNoaXBwaW5nSW5mbyAmJiBvcmRlci5zaGlwcGluZ0luZm8uZnVsbE5hbWUpIHtcclxuICAgIGN1c3RvbWVyTmFtZSA9IG9yZGVyLnNoaXBwaW5nSW5mby5mdWxsTmFtZTtcclxuICB9IGVsc2UgaWYgKG9yZGVyLnVzZXJJZCkge1xyXG4gICAgaWYgKG9yZGVyLnVzZXJJZC5maXJzdE5hbWUgJiYgb3JkZXIudXNlcklkLmxhc3ROYW1lKSB7XHJcbiAgICAgIGN1c3RvbWVyTmFtZSA9IGAke29yZGVyLnVzZXJJZC5maXJzdE5hbWV9ICR7b3JkZXIudXNlcklkLmxhc3ROYW1lfWA7XHJcbiAgICB9IGVsc2UgaWYgKG9yZGVyLnVzZXJJZC51c2VyTmFtZSkge1xyXG4gICAgICBjdXN0b21lck5hbWUgPSBvcmRlci51c2VySWQudXNlck5hbWU7XHJcbiAgICB9XHJcbiAgfVxyXG4gIFxyXG4gIC8vIEdldCBzaGlwcGluZyBhZGRyZXNzIGFuZCBwaG9uZSBmcm9tIGVpdGhlciBzaGlwcGluZ0luZm8gb3IgdXNlcklkXHJcbiAgbGV0IHNoaXBwaW5nQWRkcmVzcyA9ICcnO1xyXG4gIGxldCBwaG9uZU51bWJlciA9ICcnO1xyXG4gIFxyXG4gIGlmIChvcmRlci5zaGlwcGluZ0luZm8pIHtcclxuICAgIHNoaXBwaW5nQWRkcmVzcyA9IG9yZGVyLnNoaXBwaW5nSW5mby5hZGRyZXNzIHx8ICcnO1xyXG4gICAgcGhvbmVOdW1iZXIgPSBvcmRlci5zaGlwcGluZ0luZm8ucGhvbmUgfHwgJyc7XHJcbiAgfSBlbHNlIGlmIChvcmRlci51c2VySWQpIHtcclxuICAgIHNoaXBwaW5nQWRkcmVzcyA9IG9yZGVyLnVzZXJJZC5hZGRyZXNzIHx8ICcnO1xyXG4gICAgcGhvbmVOdW1iZXIgPSBvcmRlci51c2VySWQucGhvbmUgfHwgJyc7XHJcbiAgfVxyXG4gIFxyXG4gIHJldHVybiBgXHJcbiAgICA8IURPQ1RZUEUgaHRtbD5cclxuICAgIDxodG1sPlxyXG4gICAgPGhlYWQ+XHJcbiAgICAgIDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiPlxyXG4gICAgICA8dGl0bGU+xJDGoW4gaMOgbmcgY+G7p2EgYuG6oW4gxJFhbmcgxJHGsOG7o2MgZ2lhbyDEkeG6v248L3RpdGxlPlxyXG4gICAgICA8c3R5bGU+XHJcbiAgICAgICAgYm9keSB7IGZvbnQtZmFtaWx5OiBBcmlhbCwgc2Fucy1zZXJpZjsgbGluZS1oZWlnaHQ6IDEuNjsgY29sb3I6ICMzMzM7IH1cclxuICAgICAgICAuY29udGFpbmVyIHsgbWF4LXdpZHRoOiA2MDBweDsgbWFyZ2luOiAwIGF1dG87IHBhZGRpbmc6IDIwcHg7IH1cclxuICAgICAgICAuaGVhZGVyIHsgYmFja2dyb3VuZC1jb2xvcjogIzQzNjFlZTsgY29sb3I6IHdoaXRlOyBwYWRkaW5nOiAxMHB4IDIwcHg7IHRleHQtYWxpZ246IGNlbnRlcjsgfVxyXG4gICAgICAgIC5jb250ZW50IHsgcGFkZGluZzogMjBweDsgYmFja2dyb3VuZC1jb2xvcjogI2Y5ZjlmOTsgfVxyXG4gICAgICAgIC5mb290ZXIgeyB0ZXh0LWFsaWduOiBjZW50ZXI7IG1hcmdpbi10b3A6IDIwcHg7IGZvbnQtc2l6ZTogMTJweDsgY29sb3I6ICM3Nzc7IH1cclxuICAgICAgICAuaGlnaGxpZ2h0IHsgY29sb3I6ICM0MzYxZWU7IGZvbnQtd2VpZ2h0OiBib2xkOyB9XHJcbiAgICAgICAgLnBheW1lbnQtaW5mbyB7IG1hcmdpbjogMjBweCAwOyBwYWRkaW5nOiAxNXB4OyBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmOGU2OyBib3JkZXItbGVmdDogNHB4IHNvbGlkICNmZmMxMDc7IH1cclxuICAgICAgICAudGhhbmsteW91IHsgbWFyZ2luLXRvcDogMzBweDsgZm9udC13ZWlnaHQ6IGJvbGQ7IGNvbG9yOiAjNDM2MWVlOyB9XHJcbiAgICAgIDwvc3R5bGU+XHJcbiAgICA8L2hlYWQ+XHJcbiAgICA8Ym9keT5cclxuICAgICAgPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPlxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cclxuICAgICAgICAgIDxoMj7EkMahbiBow6BuZyBj4bunYSBi4bqhbiDEkWFuZyB0csOqbiDEkcaw4budbmcgZ2lhbyDEkeG6v24hPC9oMj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGVudFwiPlxyXG4gICAgICAgICAgPHA+WGluIGNow6BvICR7Y3VzdG9tZXJOYW1lfSw8L3A+XHJcbiAgICAgICAgICA8cD5DaMO6bmcgdMO0aSB2dWkgbeG7q25nIHRow7RuZyBiw6FvIHLhurFuZyDEkcahbiBow6BuZyA8c3BhbiBjbGFzcz1cImhpZ2hsaWdodFwiPiMke29yZGVySWRlbnRpZmllcn08L3NwYW4+IGPhu6dhIGLhuqFuIGhp4buHbiDEkWFuZyDEkcaw4bujYyBnaWFvIMSR4bq/biDEkeG7i2EgY2jhu4kgY+G7p2EgYuG6oW4uPC9wPlxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICA8cD48c3Ryb25nPlRow7RuZyB0aW4gZ2lhbyBow6BuZzo8L3N0cm9uZz48L3A+XHJcbiAgICAgICAgICA8dWw+XHJcbiAgICAgICAgICAgIDxsaT48c3Ryb25nPsSQ4buLYSBjaOG7iTo8L3N0cm9uZz4gJHtzaGlwcGluZ0FkZHJlc3N9PC9saT5cclxuICAgICAgICAgICAgPGxpPjxzdHJvbmc+U+G7kSDEkWnhu4duIHRob+G6oWk6PC9zdHJvbmc+ICR7cGhvbmVOdW1iZXJ9PC9saT5cclxuICAgICAgICAgICAgPGxpPjxzdHJvbmc+VOG7lW5nIGdpw6EgdHLhu4sgxJHGoW4gaMOgbmc6PC9zdHJvbmc+ICR7Zm9ybWF0Q3VycmVuY3kob3JkZXIudG90YWxBbW91bnQgKyAob3JkZXIuc2hpcHBpbmdGZWUgfHwgMCkpfTwvbGk+XHJcbiAgICAgICAgICA8L3VsPlxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAkeyFpc1BhaWQgPyBgXHJcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGF5bWVudC1pbmZvXCI+XHJcbiAgICAgICAgICAgIDxwPjxzdHJvbmc+VGjDtG5nIHRpbiB0aGFuaCB0b8Ohbjo8L3N0cm9uZz48L3A+XHJcbiAgICAgICAgICAgIDxwPlBoxrDGoW5nIHRo4bupYyB0aGFuaCB0b8OhbjogJHtvcmRlci5wYXltZW50TWV0aG9kID09PSAnY29kJyA/ICdUaGFuaCB0b8OhbiBraGkgbmjhuq1uIGjDoG5nIChDT0QpJyA6IG9yZGVyLnBheW1lbnRNZXRob2R9PC9wPlxyXG4gICAgICAgICAgICA8cD5T4buRIHRp4buBbiBj4bqnbiB0aGFuaCB0b8OhbjogPHNwYW4gY2xhc3M9XCJoaWdobGlnaHRcIj4ke2Zvcm1hdEN1cnJlbmN5KGFtb3VudFRvQmVQYWlkKX08L3NwYW4+PC9wPlxyXG4gICAgICAgICAgICA8cD5WdWkgbMOybmcgY2h14bqpbiBi4buLIHPhu5EgdGnhu4FuIGNow61uaCB4w6FjIMSR4buDIHF1w6EgdHLDrG5oIGdpYW8gaMOgbmcgZGnhu4VuIHJhIHRodeG6rW4gbOG7o2kuPC9wPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICBgIDogYFxyXG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBheW1lbnQtaW5mb1wiIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogI2U3ZjdlNzsgYm9yZGVyLWxlZnQ6IDRweCBzb2xpZCAjNENBRjUwO1wiPlxyXG4gICAgICAgICAgICA8cD48c3Ryb25nPlRow7RuZyB0aW4gdGhhbmggdG/DoW46PC9zdHJvbmc+PC9wPlxyXG4gICAgICAgICAgICA8cD7EkMahbiBow6BuZyBj4bunYSBi4bqhbiDEkcOjIMSRxrDhu6NjIHRoYW5oIHRvw6FuIMSR4bqneSDEkeG7py48L3A+XHJcbiAgICAgICAgICAgIDxwPkLhuqFuIGNo4buJIGPhuqduIG5o4bqtbiBow6BuZyBtw6Aga2jDtG5nIGPhuqduIHRoYW5oIHRvw6FuIHRow6ptIGtob+G6o24gbsOgby48L3A+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIGB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIDxwPsSQxqFuIGjDoG5nIGPhu6dhIGLhuqFuIGThu7Ega2nhur9uIHPhur0gxJHGsOG7o2MgZ2lhbyB0cm9uZyBuZ8OgeS4gTmjDom4gdmnDqm4gZ2lhbyBow6BuZyBz4bq9IGxpw6puIGjhu4cgduG7m2kgYuG6oW4gdHLGsOG7m2Mga2hpIGdpYW8uPC9wPlxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICA8cD5O4bq/dSBi4bqhbiBraMO0bmcgY8OzIG5ow6AgdsOgbyB0aOG7nWkgxJFp4buDbSBnaWFvIGjDoG5nLCB2dWkgbMOybmcgbGnDqm4gaOG7hyB24bubaSBjaMO6bmcgdMO0aSDEkeG7gyBz4bqvcCB44bq/cCBs4bqhaSB0aOG7nWkgZ2lhbiBnaWFvIGjDoG5nIHBow7kgaOG7o3AuPC9wPlxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICA8cCBjbGFzcz1cInRoYW5rLXlvdVwiPkPhuqNtIMahbiBi4bqhbiDEkcOjIGzhu7FhIGNo4buNbiBTacOqdSBUaOG7iyBUaOG7sWMgUGjhuqltIFPhuqFjaCE8L3A+XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIDxwPk7hur91IGLhuqFuIGPDsyBi4bqldCBr4buzIGPDonUgaOG7j2kgbsOgbywgdnVpIGzDsm5nIGxpw6puIGjhu4cgduG7m2kgY2jDum5nIHTDtGkgcXVhIGVtYWlsIHN1cHBvcnRAY2h1b2lrb2ljaG8uY29tIGhv4bq3YyBn4buNaSDEkeG6v24gaG90bGluZSAxOTAwIDY3ODkuPC9wPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cclxuICAgICAgICAgIDxwPsKpIDIwMjMgU2nDqnUgVGjhu4sgVGjhu7FjIFBo4bqpbSBT4bqhY2guIMSQ4buLYSBjaOG7iTogMjczIEFuIETGsMahbmcgVsawxqFuZywgUGjGsOG7nW5nIDMsIFF14bqtbiA1LCBUUC4gSOG7kyBDaMOtIE1pbmguPC9wPlxyXG4gICAgICAgICAgPHA+RW1haWwgbsOgeSDEkcaw4bujYyBn4butaSB04buxIMSR4buZbmcsIHZ1aSBsw7JuZyBraMO0bmcgdHLhuqMgbOG7nWkuPC9wPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuICAgIDwvYm9keT5cclxuICAgIDwvaHRtbD5cclxuICBgO1xyXG59O1xyXG5cclxuLy8gRnVuY3Rpb24gdG8gc2VuZCBlbWFpbCBub3RpZmljYXRpb24gd2hlbiBvcmRlciBpcyBiZWluZyBkZWxpdmVyZWRcclxuZXhwb3J0IGNvbnN0IHNlbmRPcmRlclNoaXBwaW5nRW1haWwgPSBhc3luYyAob3JkZXIpID0+IHtcclxuICAvLyBDaGVjayBpZiBvcmRlciBoYXMgZW1haWwgaW5mb3JtYXRpb24gZWl0aGVyIGluIHNoaXBwaW5nSW5mbyBvciB1c2VySWRcclxuICBsZXQgcmVjaXBpZW50RW1haWwgPSBudWxsO1xyXG4gIFxyXG4gIC8vIEZpcnN0IHRyeSB0byBnZXQgZW1haWwgZnJvbSBzaGlwcGluZ0luZm9cclxuICBpZiAob3JkZXIuc2hpcHBpbmdJbmZvICYmIG9yZGVyLnNoaXBwaW5nSW5mby5lbWFpbCkge1xyXG4gICAgcmVjaXBpZW50RW1haWwgPSBvcmRlci5zaGlwcGluZ0luZm8uZW1haWw7XHJcbiAgfSBcclxuICAvLyBJZiBub3QgYXZhaWxhYmxlLCB0cnkgdG8gZ2V0IGZyb20gdXNlcklkIGlmIGl0J3MgcG9wdWxhdGVkXHJcbiAgZWxzZSBpZiAob3JkZXIudXNlcklkICYmIG9yZGVyLnVzZXJJZC5lbWFpbCkge1xyXG4gICAgcmVjaXBpZW50RW1haWwgPSBvcmRlci51c2VySWQuZW1haWw7XHJcbiAgfVxyXG4gIFxyXG4gIGlmICghcmVjaXBpZW50RW1haWwpIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbiAgXHJcbiAgLy8gSGFuZGxlIGNhc2Ugd2hlcmUgb3JkZXJDb2RlIGlzIG1pc3NpbmdcclxuICBjb25zdCBvcmRlcklkZW50aWZpZXIgPSBvcmRlci5vcmRlckNvZGUgfHwgKG9yZGVyLl9pZCA/IG9yZGVyLl9pZC50b1N0cmluZygpLnNsaWNlKC02KS50b1VwcGVyQ2FzZSgpIDogJ04vQScpO1xyXG4gIFxyXG4gIC8vIENyZWF0ZSBlbWFpbCBjb250ZW50XHJcbiAgY29uc3QgaHRtbENvbnRlbnQgPSBjcmVhdGVPcmRlclNoaXBwaW5nVGVtcGxhdGUob3JkZXIpO1xyXG4gIFxyXG4gIC8vIENvbmZpZ3VyZSBlbWFpbFxyXG4gIGNvbnN0IG1haWxPcHRpb25zID0ge1xyXG4gICAgZnJvbTogYFwiRE5DIEZPT0RcIiA8JHtFTlYuRU1BSUxfVVNFUk5BTUUgfHwgJ25vLXJlcGx5QGRuY2Zvb2QuY29tJ30+YCxcclxuICAgIHRvOiByZWNpcGllbnRFbWFpbCxcclxuICAgIHN1YmplY3Q6IGDEkMahbiBow6BuZyAjJHtvcmRlcklkZW50aWZpZXJ9IMSRYW5nIMSRxrDhu6NjIGdpYW8gxJHhur9uIGLhuqFuYCxcclxuICAgIGh0bWw6IGh0bWxDb250ZW50XHJcbiAgfTtcclxuICBcclxuICAvLyBTZW5kIGVtYWlsXHJcbiAgY29uc3QgaW5mbyA9IGF3YWl0IHRyYW5zcG9ydGVyLnNlbmRNYWlsKG1haWxPcHRpb25zKTtcclxuICByZXR1cm4gdHJ1ZTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHtcclxuICBzZW5kT3JkZXJDb25maXJtYXRpb25FbWFpbCxcclxuICBzZW5kT3JkZXJTaGlwcGluZ0VtYWlsXHJcbn07ICJdLCJtYXBwaW5ncyI6IitQQUFBLElBQUFBLFdBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLE9BQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLE9BQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQTtBQUNBRyxlQUFNLENBQUNDLE1BQU0sQ0FBQyxDQUFDOztBQUVmO0FBQ0E7QUFDQSxNQUFNQyxHQUFHLEdBQUc7RUFDVkMsY0FBYyxFQUFFQyxPQUFPLENBQUNDLEdBQUcsQ0FBQ0YsY0FBYyxJQUFJLHNCQUFzQjtFQUNwRUcsY0FBYyxFQUFFRixPQUFPLENBQUNDLEdBQUcsQ0FBQ0MsY0FBYyxJQUFJLG1CQUFtQjtFQUNqRUMsVUFBVSxFQUFFSCxPQUFPLENBQUNDLEdBQUcsQ0FBQ0UsVUFBVSxJQUFJO0FBQ3hDLENBQUM7O0FBRUQ7QUFDQSxNQUFNQyxXQUFXLEdBQUdDLG1CQUFVLENBQUNDLGVBQWUsQ0FBQztFQUM3Q0MsT0FBTyxFQUFFLE9BQU87RUFDaEJDLElBQUksRUFBRSxnQkFBZ0I7RUFDdEJDLElBQUksRUFBRSxHQUFHO0VBQ1RDLE1BQU0sRUFBRSxLQUFLO0VBQ2JDLElBQUksRUFBRTtJQUNKQyxJQUFJLEVBQUVkLEdBQUcsQ0FBQ0MsY0FBYztJQUN4QmMsSUFBSSxFQUFFZixHQUFHLENBQUNJO0VBQ1osQ0FBQztFQUNEWSxHQUFHLEVBQUU7SUFDSEMsa0JBQWtCLEVBQUU7RUFDdEI7QUFDRixDQUFDLENBQUM7O0FBRUY7QUFDQSxNQUFNQyxjQUFjLEdBQUcsTUFBQUEsQ0FBT0MsSUFBSSxLQUFLO0VBQ3JDLElBQUk7SUFDRixPQUFPLE1BQU1DLGVBQU0sQ0FBQ0MsU0FBUyxDQUFDQyxJQUFJLENBQUNDLFNBQVMsQ0FBQ0osSUFBSSxDQUFDLENBQUM7RUFDckQsQ0FBQyxDQUFDLE9BQU9LLEtBQUssRUFBRTtJQUNkLE9BQU8sSUFBSTtFQUNiO0FBQ0YsQ0FBQzs7QUFFRDtBQUNBLE1BQU1DLHdCQUF3QixHQUFHQSxDQUFDQyxLQUFLLEVBQUVDLFdBQVcsS0FBSztFQUN2RDtFQUNBLE1BQU1DLFVBQVUsR0FBR0YsS0FBSyxDQUFDRyxRQUFRLENBQUNDLE1BQU0sQ0FBQyxDQUFDQyxHQUFHLEVBQUVDLElBQUksS0FBS0QsR0FBRyxHQUFHQyxJQUFJLENBQUNDLFFBQVEsRUFBRSxDQUFDLENBQUM7O0VBRS9FO0VBQ0EsTUFBTUMsY0FBYyxHQUFHQSxDQUFDQyxNQUFNLEtBQUs7SUFDakMsT0FBTyxJQUFJQyxJQUFJLENBQUNDLFlBQVksQ0FBQyxPQUFPLEVBQUU7TUFDcENDLEtBQUssRUFBRSxVQUFVO01BQ2pCQyxRQUFRLEVBQUU7SUFDWixDQUFDLENBQUMsQ0FBQ0MsTUFBTSxDQUFDTCxNQUFNLENBQUM7RUFDbkIsQ0FBQzs7RUFFRDtFQUNBLE1BQU1NLFlBQVksR0FBR2YsS0FBSyxDQUFDRyxRQUFRLENBQUNhLEdBQUcsQ0FBQyxDQUFBVixJQUFJLEtBQUk7SUFDOUMsTUFBTVcsT0FBTyxHQUFHWCxJQUFJLENBQUNZLFNBQVM7SUFDOUIsTUFBTUMsV0FBVyxHQUFHRixPQUFPLENBQUNFLFdBQVcsSUFBSSxVQUFVO0lBQ3JELE1BQU1DLFlBQVksR0FBR0gsT0FBTyxDQUFDRyxZQUFZLElBQUksQ0FBQztJQUM5QyxNQUFNQyxRQUFRLEdBQUdmLElBQUksQ0FBQ0MsUUFBUSxHQUFHYSxZQUFZOztJQUU3QyxPQUFPO0FBQ1g7QUFDQTtBQUNBO0FBQ0EsY0FBY0gsT0FBTyxDQUFDSyxhQUFhLElBQUlMLE9BQU8sQ0FBQ0ssYUFBYSxDQUFDLENBQUMsQ0FBQztJQUNqRCxhQUFhTCxPQUFPLENBQUNLLGFBQWEsQ0FBQyxDQUFDLENBQUMsVUFBVUgsV0FBVyxrR0FBa0c7SUFDNUosRUFBRTtBQUNoQixtQkFBbUJBLFdBQVc7QUFDOUI7QUFDQTtBQUNBLHdGQUF3RmIsSUFBSSxDQUFDQyxRQUFRO0FBQ3JHLHVGQUF1RkMsY0FBYyxDQUFDWSxZQUFZLENBQUM7QUFDbkgsdUZBQXVGWixjQUFjLENBQUNhLFFBQVEsQ0FBQztBQUMvRztBQUNBLEtBQUs7RUFDSCxDQUFDLENBQUMsQ0FBQ0UsSUFBSSxDQUFDLEVBQUUsQ0FBQzs7RUFFWDtFQUNBLElBQUlDLFlBQVksR0FBRyxFQUFFO0VBQ3JCLElBQUl4QixLQUFLLENBQUN5QixNQUFNLElBQUl6QixLQUFLLENBQUN5QixNQUFNLENBQUNDLFFBQVEsRUFBRTtJQUN6Q0YsWUFBWSxHQUFHO0FBQ25CLHlDQUF5Q3hCLEtBQUssQ0FBQ3lCLE1BQU0sQ0FBQ0UsSUFBSSxJQUFJLFlBQVk7QUFDMUUsc0NBQXNDbkIsY0FBYyxDQUFDUixLQUFLLENBQUN5QixNQUFNLENBQUNDLFFBQVEsQ0FBQztBQUMzRSxLQUFLO0VBQ0g7O0VBRUE7RUFDQSxNQUFNRSxXQUFXLEdBQUc1QixLQUFLLENBQUM0QixXQUFXLElBQUk1QixLQUFLLENBQUM2QixXQUFXLElBQUksQ0FBQzs7RUFFL0Q7RUFDQSxPQUFPO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0M3QixLQUFLLENBQUM4QixTQUFTO0FBQ2pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUNBQW1DOUIsS0FBSyxDQUFDOEIsU0FBUztBQUNsRDtBQUNBO0FBQ0Esd0JBQXdCOUIsS0FBSyxDQUFDK0IsWUFBWSxJQUFJL0IsS0FBSyxDQUFDK0IsWUFBWSxDQUFDQyxRQUFRLEdBQUdoQyxLQUFLLENBQUMrQixZQUFZLENBQUNDLFFBQVEsR0FBRyxXQUFXO0FBQ3JIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0NBQStDaEMsS0FBSyxDQUFDOEIsU0FBUztBQUM5RCxpREFBaUQsSUFBSUcsSUFBSSxDQUFDakMsS0FBSyxDQUFDa0MsU0FBUyxDQUFDLENBQUNDLGNBQWMsQ0FBQyxPQUFPLENBQUM7QUFDbEcsMERBQTBEbkMsS0FBSyxDQUFDb0MsYUFBYSxLQUFLLEtBQUssR0FBRyxnQ0FBZ0MsR0FBRyx1QkFBdUI7QUFDcEosdURBQXVEcEMsS0FBSyxDQUFDcUMsTUFBTSxLQUFLLFNBQVMsR0FBRyxZQUFZLEdBQUdyQyxLQUFLLENBQUNxQyxNQUFNO0FBQy9HLGNBQWNiLFlBQVk7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQ0FBMEN4QixLQUFLLENBQUMrQixZQUFZLElBQUkvQixLQUFLLENBQUMrQixZQUFZLENBQUNDLFFBQVEsR0FBR2hDLEtBQUssQ0FBQytCLFlBQVksQ0FBQ0MsUUFBUSxHQUFHLEVBQUU7QUFDOUgsMkNBQTJDaEMsS0FBSyxDQUFDK0IsWUFBWSxJQUFJL0IsS0FBSyxDQUFDK0IsWUFBWSxDQUFDTyxPQUFPLEdBQUd0QyxLQUFLLENBQUMrQixZQUFZLENBQUNPLE9BQU8sR0FBRyxFQUFFO0FBQzdILGlEQUFpRHRDLEtBQUssQ0FBQytCLFlBQVksSUFBSS9CLEtBQUssQ0FBQytCLFlBQVksQ0FBQ1EsS0FBSyxHQUFHdkMsS0FBSyxDQUFDK0IsWUFBWSxDQUFDUSxLQUFLLEdBQUcsRUFBRTtBQUMvSCx5Q0FBeUN2QyxLQUFLLENBQUMrQixZQUFZLElBQUkvQixLQUFLLENBQUMrQixZQUFZLENBQUNTLEtBQUssR0FBR3hDLEtBQUssQ0FBQytCLFlBQVksQ0FBQ1MsS0FBSyxHQUFHLEVBQUU7QUFDdkg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0J6QixZQUFZO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUNBQW1DYixVQUFVO0FBQzdDLGlDQUFpQ00sY0FBYyxDQUFDUixLQUFLLENBQUNxQixRQUFRLElBQUlyQixLQUFLLENBQUN5QyxXQUFXLENBQUM7QUFDcEYsaUNBQWlDakMsY0FBYyxDQUFDb0IsV0FBVyxDQUFDO0FBQzVELGNBQWM1QixLQUFLLENBQUN5QixNQUFNLElBQUl6QixLQUFLLENBQUN5QixNQUFNLENBQUNDLFFBQVEsR0FBRyxpQkFBaUJsQixjQUFjLENBQUNSLEtBQUssQ0FBQ3lCLE1BQU0sQ0FBQ0MsUUFBUSxDQUFDLE1BQU0sR0FBRyxFQUFFO0FBQ3ZILDJFQUEyRWxCLGNBQWMsQ0FBQ1IsS0FBSyxDQUFDeUMsV0FBVyxDQUFDO0FBQzVHO0FBQ0E7QUFDQSxZQUFZeEMsV0FBVyxHQUFHO0FBQzFCO0FBQ0E7QUFDQSx3QkFBd0JBLFdBQVc7QUFDbkM7QUFDQTtBQUNBLFdBQVcsR0FBRyxFQUFFO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCM0IsR0FBRyxDQUFDSyxVQUFVO0FBQ3JDO0FBQ0E7QUFDQSx1RkFBdUZMLEdBQUcsQ0FBQ0MsY0FBYyxJQUFJLHFCQUFxQjtBQUNsSTtBQUNBO0FBQ0EsaUJBQWlCLElBQUkwRCxJQUFJLENBQUMsQ0FBQyxDQUFDUyxXQUFXLENBQUMsQ0FBQztBQUN6QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNILENBQUM7O0FBRUQ7QUFDTyxNQUFNQywwQkFBMEIsR0FBRyxNQUFBQSxDQUFPM0MsS0FBSyxLQUFLO0VBQ3pELElBQUk7SUFDRjtJQUNBLElBQUksQ0FBQ0EsS0FBSyxDQUFDK0IsWUFBWSxFQUFFO01BQ3ZCLE9BQU8sS0FBSztJQUNkOztJQUVBO0lBQ0EsSUFBSSxDQUFDL0IsS0FBSyxDQUFDK0IsWUFBWSxDQUFDUyxLQUFLLEVBQUU7TUFDN0I7TUFDQSxJQUFJeEMsS0FBSyxDQUFDNEMsTUFBTSxJQUFJNUMsS0FBSyxDQUFDNEMsTUFBTSxDQUFDSixLQUFLLEVBQUU7UUFDdEN4QyxLQUFLLENBQUMrQixZQUFZLENBQUNTLEtBQUssR0FBR3hDLEtBQUssQ0FBQzRDLE1BQU0sQ0FBQ0osS0FBSztNQUMvQyxDQUFDLE1BQU07UUFDTCxPQUFPLEtBQUs7TUFDZDtJQUNGOztJQUVBO0lBQ0EsTUFBTUssTUFBTSxHQUFHO01BQ2JmLFNBQVMsRUFBRTlCLEtBQUssQ0FBQzhCLFNBQVM7TUFDMUJXLFdBQVcsRUFBRXpDLEtBQUssQ0FBQ3lDLFdBQVc7TUFDOUJKLE1BQU0sRUFBRXJDLEtBQUssQ0FBQ3FDLE1BQU07TUFDcEJTLElBQUksRUFBRTlDLEtBQUssQ0FBQ2tDO0lBQ2QsQ0FBQzs7SUFFRDtJQUNBLE1BQU1qQyxXQUFXLEdBQUcsTUFBTVQsY0FBYyxDQUFDcUQsTUFBTSxDQUFDOztJQUVoRDtJQUNBLE1BQU1FLFdBQVcsR0FBR2hELHdCQUF3QixDQUFDQyxLQUFLLEVBQUVDLFdBQVcsQ0FBQzs7SUFFaEU7SUFDQSxNQUFNK0MsV0FBVyxHQUFHO01BQ2xCQyxJQUFJLEVBQUUsZUFBZTNFLEdBQUcsQ0FBQ0MsY0FBYyxHQUFHO01BQzFDMkUsRUFBRSxFQUFFbEQsS0FBSyxDQUFDK0IsWUFBWSxDQUFDUyxLQUFLO01BQzVCVyxPQUFPLEVBQUUsc0JBQXNCbkQsS0FBSyxDQUFDOEIsU0FBUyxFQUFFO01BQ2hEc0IsSUFBSSxFQUFFTDtJQUNSLENBQUM7O0lBRUQ7SUFDQSxNQUFNTSxJQUFJLEdBQUcsTUFBTXpFLFdBQVcsQ0FBQzBFLFFBQVEsQ0FBQ04sV0FBVyxDQUFDO0lBQ3BELE9BQU8sSUFBSTtFQUNiLENBQUMsQ0FBQyxPQUFPbEQsS0FBSyxFQUFFO0lBQ2QsT0FBTyxLQUFLO0VBQ2Q7QUFDRixDQUFDOztBQUVEO0FBQUF5RCxPQUFBLENBQUFaLDBCQUFBLEdBQUFBLDBCQUFBLENBQ0EsTUFBTWEsMkJBQTJCLEdBQUdBLENBQUN4RCxLQUFLLEtBQUs7RUFDN0M7RUFDQSxNQUFNUSxjQUFjLEdBQUdBLENBQUNDLE1BQU0sS0FBSztJQUNqQyxPQUFPLElBQUlDLElBQUksQ0FBQ0MsWUFBWSxDQUFDLE9BQU8sRUFBRTtNQUNwQ0MsS0FBSyxFQUFFLFVBQVU7TUFDakJDLFFBQVEsRUFBRTtJQUNaLENBQUMsQ0FBQyxDQUFDQyxNQUFNLENBQUNMLE1BQU0sQ0FBQztFQUNuQixDQUFDOztFQUVEO0VBQ0EsTUFBTWdELE1BQU0sR0FBR3pELEtBQUssQ0FBQ3lELE1BQU0sSUFBSSxLQUFLO0VBQ3BDLE1BQU1DLGNBQWMsR0FBR0QsTUFBTSxHQUFHLENBQUMsR0FBSXpELEtBQUssQ0FBQ3lDLFdBQVcsSUFBSXpDLEtBQUssQ0FBQzRCLFdBQVcsSUFBSSxDQUFDLENBQUU7O0VBRWxGO0VBQ0EsTUFBTStCLGVBQWUsR0FBRzNELEtBQUssQ0FBQzhCLFNBQVMsS0FBSzlCLEtBQUssQ0FBQzRELEdBQUcsR0FBRzVELEtBQUssQ0FBQzRELEdBQUcsQ0FBQ0MsUUFBUSxDQUFDLENBQUMsQ0FBQ0MsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUNDLFdBQVcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDOztFQUU3RztFQUNBLElBQUlDLFlBQVksR0FBRyxXQUFXO0VBQzlCLElBQUloRSxLQUFLLENBQUMrQixZQUFZLElBQUkvQixLQUFLLENBQUMrQixZQUFZLENBQUNDLFFBQVEsRUFBRTtJQUNyRGdDLFlBQVksR0FBR2hFLEtBQUssQ0FBQytCLFlBQVksQ0FBQ0MsUUFBUTtFQUM1QyxDQUFDLE1BQU0sSUFBSWhDLEtBQUssQ0FBQzRDLE1BQU0sRUFBRTtJQUN2QixJQUFJNUMsS0FBSyxDQUFDNEMsTUFBTSxDQUFDcUIsU0FBUyxJQUFJakUsS0FBSyxDQUFDNEMsTUFBTSxDQUFDc0IsUUFBUSxFQUFFO01BQ25ERixZQUFZLEdBQUcsR0FBR2hFLEtBQUssQ0FBQzRDLE1BQU0sQ0FBQ3FCLFNBQVMsSUFBSWpFLEtBQUssQ0FBQzRDLE1BQU0sQ0FBQ3NCLFFBQVEsRUFBRTtJQUNyRSxDQUFDLE1BQU0sSUFBSWxFLEtBQUssQ0FBQzRDLE1BQU0sQ0FBQ3VCLFFBQVEsRUFBRTtNQUNoQ0gsWUFBWSxHQUFHaEUsS0FBSyxDQUFDNEMsTUFBTSxDQUFDdUIsUUFBUTtJQUN0QztFQUNGOztFQUVBO0VBQ0EsSUFBSUMsZUFBZSxHQUFHLEVBQUU7RUFDeEIsSUFBSUMsV0FBVyxHQUFHLEVBQUU7O0VBRXBCLElBQUlyRSxLQUFLLENBQUMrQixZQUFZLEVBQUU7SUFDdEJxQyxlQUFlLEdBQUdwRSxLQUFLLENBQUMrQixZQUFZLENBQUNPLE9BQU8sSUFBSSxFQUFFO0lBQ2xEK0IsV0FBVyxHQUFHckUsS0FBSyxDQUFDK0IsWUFBWSxDQUFDUSxLQUFLLElBQUksRUFBRTtFQUM5QyxDQUFDLE1BQU0sSUFBSXZDLEtBQUssQ0FBQzRDLE1BQU0sRUFBRTtJQUN2QndCLGVBQWUsR0FBR3BFLEtBQUssQ0FBQzRDLE1BQU0sQ0FBQ04sT0FBTyxJQUFJLEVBQUU7SUFDNUMrQixXQUFXLEdBQUdyRSxLQUFLLENBQUM0QyxNQUFNLENBQUNMLEtBQUssSUFBSSxFQUFFO0VBQ3hDOztFQUVBLE9BQU87QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QnlCLFlBQVk7QUFDcEMsbUZBQW1GTCxlQUFlO0FBQ2xHO0FBQ0E7QUFDQTtBQUNBLDRDQUE0Q1MsZUFBZTtBQUMzRCxrREFBa0RDLFdBQVc7QUFDN0QsMERBQTBEN0QsY0FBYyxDQUFDUixLQUFLLENBQUN5QyxXQUFXLElBQUl6QyxLQUFLLENBQUM0QixXQUFXLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDdEg7QUFDQTtBQUNBLFlBQVksQ0FBQzZCLE1BQU0sR0FBRztBQUN0QjtBQUNBO0FBQ0EseUNBQXlDekQsS0FBSyxDQUFDb0MsYUFBYSxLQUFLLEtBQUssR0FBRyxnQ0FBZ0MsR0FBR3BDLEtBQUssQ0FBQ29DLGFBQWE7QUFDL0gsaUVBQWlFNUIsY0FBYyxDQUFDa0QsY0FBYyxDQUFDO0FBQy9GO0FBQ0E7QUFDQSxXQUFXLEdBQUc7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNILENBQUM7O0FBRUQ7QUFDTyxNQUFNWSxzQkFBc0IsR0FBRyxNQUFBQSxDQUFPdEUsS0FBSyxLQUFLO0VBQ3JEO0VBQ0EsSUFBSXVFLGNBQWMsR0FBRyxJQUFJOztFQUV6QjtFQUNBLElBQUl2RSxLQUFLLENBQUMrQixZQUFZLElBQUkvQixLQUFLLENBQUMrQixZQUFZLENBQUNTLEtBQUssRUFBRTtJQUNsRCtCLGNBQWMsR0FBR3ZFLEtBQUssQ0FBQytCLFlBQVksQ0FBQ1MsS0FBSztFQUMzQztFQUNBO0VBQUEsS0FDSyxJQUFJeEMsS0FBSyxDQUFDNEMsTUFBTSxJQUFJNUMsS0FBSyxDQUFDNEMsTUFBTSxDQUFDSixLQUFLLEVBQUU7SUFDM0MrQixjQUFjLEdBQUd2RSxLQUFLLENBQUM0QyxNQUFNLENBQUNKLEtBQUs7RUFDckM7O0VBRUEsSUFBSSxDQUFDK0IsY0FBYyxFQUFFO0lBQ25CLE9BQU8sS0FBSztFQUNkOztFQUVBO0VBQ0EsTUFBTVosZUFBZSxHQUFHM0QsS0FBSyxDQUFDOEIsU0FBUyxLQUFLOUIsS0FBSyxDQUFDNEQsR0FBRyxHQUFHNUQsS0FBSyxDQUFDNEQsR0FBRyxDQUFDQyxRQUFRLENBQUMsQ0FBQyxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ0MsV0FBVyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUM7O0VBRTdHO0VBQ0EsTUFBTWhCLFdBQVcsR0FBR1MsMkJBQTJCLENBQUN4RCxLQUFLLENBQUM7O0VBRXREO0VBQ0EsTUFBTWdELFdBQVcsR0FBRztJQUNsQkMsSUFBSSxFQUFFLGVBQWUzRSxHQUFHLENBQUNDLGNBQWMsSUFBSSxzQkFBc0IsR0FBRztJQUNwRTJFLEVBQUUsRUFBRXFCLGNBQWM7SUFDbEJwQixPQUFPLEVBQUUsYUFBYVEsZUFBZSx5QkFBeUI7SUFDOURQLElBQUksRUFBRUw7RUFDUixDQUFDOztFQUVEO0VBQ0EsTUFBTU0sSUFBSSxHQUFHLE1BQU16RSxXQUFXLENBQUMwRSxRQUFRLENBQUNOLFdBQVcsQ0FBQztFQUNwRCxPQUFPLElBQUk7QUFDYixDQUFDLENBQUNPLE9BQUEsQ0FBQWUsc0JBQUEsR0FBQUEsc0JBQUEsS0FBQUUsUUFBQSxHQUFBakIsT0FBQSxDQUFBa0IsT0FBQTs7QUFFYTtFQUNiOUIsMEJBQTBCO0VBQzFCMkI7QUFDRixDQUFDIiwiaWdub3JlTGlzdCI6W119