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
const createOrderEmailTemplate = (order, qrCodeImage) => {var _order$shippingInfo, _order$shippingInfo2, _order$shippingInfo3, _order$shippingInfo4, _order$shippingInfo5;
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
          <p>Xin chào ${((_order$shippingInfo = order.shippingInfo) === null || _order$shippingInfo === void 0 ? void 0 : _order$shippingInfo.fullName) || 'Quý khách'},</p>
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
            <p><strong>Họ tên:</strong> ${((_order$shippingInfo2 = order.shippingInfo) === null || _order$shippingInfo2 === void 0 ? void 0 : _order$shippingInfo2.fullName) || ''}</p>
            <p><strong>Địa chỉ:</strong> ${((_order$shippingInfo3 = order.shippingInfo) === null || _order$shippingInfo3 === void 0 ? void 0 : _order$shippingInfo3.address) || ''}</p>
            <p><strong>Số điện thoại:</strong> ${((_order$shippingInfo4 = order.shippingInfo) === null || _order$shippingInfo4 === void 0 ? void 0 : _order$shippingInfo4.phone) || ''}</p>
            <p><strong>Email:</strong> ${((_order$shippingInfo5 = order.shippingInfo) === null || _order$shippingInfo5 === void 0 ? void 0 : _order$shippingInfo5.email) || ''}</p>
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfbm9kZW1haWxlciIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwiX3FyY29kZSIsIl9kb3RlbnYiLCJlIiwiX19lc01vZHVsZSIsImRlZmF1bHQiLCJkb3RlbnYiLCJjb25maWciLCJFTlYiLCJFTUFJTF9VU0VSTkFNRSIsInByb2Nlc3MiLCJlbnYiLCJFTUFJTF9QQVNTV09SRCIsIkNMSUVOVF9VUkwiLCJ0cmFuc3BvcnRlciIsIm5vZGVtYWlsZXIiLCJjcmVhdGVUcmFuc3BvcnQiLCJzZXJ2aWNlIiwiaG9zdCIsInBvcnQiLCJzZWN1cmUiLCJhdXRoIiwidXNlciIsInBhc3MiLCJ0bHMiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJnZW5lcmF0ZVFSQ29kZSIsImRhdGEiLCJRUkNvZGUiLCJ0b0RhdGFVUkwiLCJKU09OIiwic3RyaW5naWZ5IiwiZXJyb3IiLCJjcmVhdGVPcmRlckVtYWlsVGVtcGxhdGUiLCJvcmRlciIsInFyQ29kZUltYWdlIiwiX29yZGVyJHNoaXBwaW5nSW5mbyIsIl9vcmRlciRzaGlwcGluZ0luZm8yIiwiX29yZGVyJHNoaXBwaW5nSW5mbzMiLCJfb3JkZXIkc2hpcHBpbmdJbmZvNCIsIl9vcmRlciRzaGlwcGluZ0luZm81IiwidG90YWxJdGVtcyIsInByb2R1Y3RzIiwicmVkdWNlIiwic3VtIiwiaXRlbSIsInF1YW50aXR5IiwiZm9ybWF0Q3VycmVuY3kiLCJhbW91bnQiLCJJbnRsIiwiTnVtYmVyRm9ybWF0Iiwic3R5bGUiLCJjdXJyZW5jeSIsImZvcm1hdCIsInByb2R1Y3RzTGlzdCIsIm1hcCIsInByb2R1Y3QiLCJwcm9kdWN0SWQiLCJwcm9kdWN0TmFtZSIsInByb2R1Y3RQcmljZSIsInN1YnRvdGFsIiwicHJvZHVjdEltYWdlcyIsImpvaW4iLCJkaXNjb3VudEluZm8iLCJjb3Vwb24iLCJkaXNjb3VudCIsImNvZGUiLCJzaGlwcGluZ0ZlZSIsImRlbGl2ZXJ5RmVlIiwib3JkZXJDb2RlIiwic2hpcHBpbmdJbmZvIiwiZnVsbE5hbWUiLCJEYXRlIiwiY3JlYXRlZEF0IiwidG9Mb2NhbGVTdHJpbmciLCJwYXltZW50TWV0aG9kIiwic3RhdHVzIiwiYWRkcmVzcyIsInBob25lIiwiZW1haWwiLCJ0b3RhbEFtb3VudCIsImdldEZ1bGxZZWFyIiwic2VuZE9yZGVyQ29uZmlybWF0aW9uRW1haWwiLCJ1c2VySWQiLCJxckRhdGEiLCJkYXRlIiwiaHRtbENvbnRlbnQiLCJtYWlsT3B0aW9ucyIsImZyb20iLCJ0byIsInN1YmplY3QiLCJodG1sIiwiaW5mbyIsInNlbmRNYWlsIiwiZXhwb3J0cyIsImNyZWF0ZU9yZGVyU2hpcHBpbmdUZW1wbGF0ZSIsImlzUGFpZCIsImFtb3VudFRvQmVQYWlkIiwib3JkZXJJZGVudGlmaWVyIiwiX2lkIiwidG9TdHJpbmciLCJzbGljZSIsInRvVXBwZXJDYXNlIiwiY3VzdG9tZXJOYW1lIiwiZmlyc3ROYW1lIiwibGFzdE5hbWUiLCJ1c2VyTmFtZSIsInNoaXBwaW5nQWRkcmVzcyIsInBob25lTnVtYmVyIiwic2VuZE9yZGVyU2hpcHBpbmdFbWFpbCIsInJlY2lwaWVudEVtYWlsIiwiX2RlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdXRpbHMvZW1haWxTZXJ2aWNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBub2RlbWFpbGVyIGZyb20gJ25vZGVtYWlsZXInO1xuaW1wb3J0IFFSQ29kZSBmcm9tICdxcmNvZGUnO1xuaW1wb3J0IGRvdGVudiBmcm9tICdkb3RlbnYnO1xuXG4vLyBD4bqldSBow6xuaCBkb3RlbnYgxJHhu4MgxJHhu41jIGJp4bq/biBtw7RpIHRyxrDhu51uZ1xuZG90ZW52LmNvbmZpZygpO1xuXG4vLyBUaGnhur90IGzhuq1wIGJp4bq/biBtw7RpIHRyxrDhu51uZyAtIFPhu61hIGzhu5dpIEVTTGludFxuLyogZ2xvYmFsIHByb2Nlc3MgKi9cbmNvbnN0IEVOViA9IHtcbiAgRU1BSUxfVVNFUk5BTUU6IHByb2Nlc3MuZW52LkVNQUlMX1VTRVJOQU1FIHx8ICd5b3VyLWVtYWlsQGdtYWlsLmNvbScsXG4gIEVNQUlMX1BBU1NXT1JEOiBwcm9jZXNzLmVudi5FTUFJTF9QQVNTV09SRCB8fCAneW91ci1hcHAtcGFzc3dvcmQnLFxuICBDTElFTlRfVVJMOiBwcm9jZXNzLmVudi5DTElFTlRfVVJMIHx8ICdodHRwczovL3F1YW5seXRodWNwaGFtLWNsaWVudC52ZXJjZWwuYXBwJ1xufTtcblxuLy8gS2jhu59pIHThuqFvIHRyYW5zcG9ydGVyIMSR4buDIGfhu61pIGVtYWlsXG5jb25zdCB0cmFuc3BvcnRlciA9IG5vZGVtYWlsZXIuY3JlYXRlVHJhbnNwb3J0KHtcbiAgc2VydmljZTogJ2dtYWlsJyxcbiAgaG9zdDogJ3NtdHAuZ21haWwuY29tJyxcbiAgcG9ydDogNTg3LFxuICBzZWN1cmU6IGZhbHNlLFxuICBhdXRoOiB7XG4gICAgdXNlcjogRU5WLkVNQUlMX1VTRVJOQU1FLFxuICAgIHBhc3M6IEVOVi5FTUFJTF9QQVNTV09SRFxuICB9LFxuICB0bHM6IHtcbiAgICByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlXG4gIH1cbn0pO1xuXG4vLyBU4bqhbyBtw6MgUVIgdOG7qyBk4buvIGxp4buHdVxuY29uc3QgZ2VuZXJhdGVRUkNvZGUgPSBhc3luYyAoZGF0YSkgPT4ge1xuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCBRUkNvZGUudG9EYXRhVVJMKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcblxuLy8gVOG6oW8gbuG7mWkgZHVuZyBlbWFpbCDEkeG6t3QgaMOgbmcgdGjDoG5oIGPDtG5nXG5jb25zdCBjcmVhdGVPcmRlckVtYWlsVGVtcGxhdGUgPSAob3JkZXIsIHFyQ29kZUltYWdlKSA9PiB7XG4gIC8vIFTDrW5oIHThu5VuZyBz4buRIGzGsOG7o25nIHPhuqNuIHBo4bqpbVxuICBjb25zdCB0b3RhbEl0ZW1zID0gb3JkZXIucHJvZHVjdHMucmVkdWNlKChzdW0sIGl0ZW0pID0+IHN1bSArIGl0ZW0ucXVhbnRpdHksIDApO1xuICBcbiAgLy8gRm9ybWF0IHRp4buBbiB04buHXG4gIGNvbnN0IGZvcm1hdEN1cnJlbmN5ID0gKGFtb3VudCkgPT4ge1xuICAgIHJldHVybiBuZXcgSW50bC5OdW1iZXJGb3JtYXQoJ3ZpLVZOJywge1xuICAgICAgc3R5bGU6ICdjdXJyZW5jeScsXG4gICAgICBjdXJyZW5jeTogJ1ZORCdcbiAgICB9KS5mb3JtYXQoYW1vdW50KTtcbiAgfTtcbiAgXG4gIC8vIFThuqFvIGRhbmggc8OhY2ggc+G6o24gcGjhuqltIEhUTUxcbiAgY29uc3QgcHJvZHVjdHNMaXN0ID0gb3JkZXIucHJvZHVjdHMubWFwKGl0ZW0gPT4ge1xuICAgIGNvbnN0IHByb2R1Y3QgPSBpdGVtLnByb2R1Y3RJZDtcbiAgICBjb25zdCBwcm9kdWN0TmFtZSA9IHByb2R1Y3QucHJvZHVjdE5hbWUgfHwgJ1PhuqNuIHBo4bqpbSc7XG4gICAgY29uc3QgcHJvZHVjdFByaWNlID0gcHJvZHVjdC5wcm9kdWN0UHJpY2UgfHwgMDtcbiAgICBjb25zdCBzdWJ0b3RhbCA9IGl0ZW0ucXVhbnRpdHkgKiBwcm9kdWN0UHJpY2U7XG4gICAgXG4gICAgcmV0dXJuIGBcbiAgICAgIDx0cj5cbiAgICAgICAgPHRkIHN0eWxlPVwicGFkZGluZzogMTBweDsgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNkZGQ7XCI+XG4gICAgICAgICAgPGRpdiBzdHlsZT1cImRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7XCI+XG4gICAgICAgICAgICAke3Byb2R1Y3QucHJvZHVjdEltYWdlcyAmJiBwcm9kdWN0LnByb2R1Y3RJbWFnZXNbMF0gPyBcbiAgICAgICAgICAgICAgYDxpbWcgc3JjPVwiJHtwcm9kdWN0LnByb2R1Y3RJbWFnZXNbMF19XCIgYWx0PVwiJHtwcm9kdWN0TmFtZX1cIiBzdHlsZT1cIndpZHRoOiA1MHB4OyBoZWlnaHQ6IDUwcHg7IG9iamVjdC1maXQ6IGNvdmVyOyBtYXJnaW4tcmlnaHQ6IDEwcHg7IGJvcmRlci1yYWRpdXM6IDRweDtcIj5gIDogXG4gICAgICAgICAgICAgICcnfVxuICAgICAgICAgICAgPGRpdj4ke3Byb2R1Y3ROYW1lfTwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L3RkPlxuICAgICAgICA8dGQgc3R5bGU9XCJwYWRkaW5nOiAxMHB4OyBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2RkZDsgdGV4dC1hbGlnbjogY2VudGVyO1wiPiR7aXRlbS5xdWFudGl0eX08L3RkPlxuICAgICAgICA8dGQgc3R5bGU9XCJwYWRkaW5nOiAxMHB4OyBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2RkZDsgdGV4dC1hbGlnbjogcmlnaHQ7XCI+JHtmb3JtYXRDdXJyZW5jeShwcm9kdWN0UHJpY2UpfTwvdGQ+XG4gICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDEwcHg7IGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZGRkOyB0ZXh0LWFsaWduOiByaWdodDtcIj4ke2Zvcm1hdEN1cnJlbmN5KHN1YnRvdGFsKX08L3RkPlxuICAgICAgPC90cj5cbiAgICBgO1xuICB9KS5qb2luKCcnKTtcbiAgXG4gIC8vIFjDoWMgxJHhu4tuaCB0aMO0bmcgdGluIHbhu4EgbcOjIGdp4bqjbSBnacOhIG7hur91IGPDs1xuICBsZXQgZGlzY291bnRJbmZvID0gJyc7XG4gIGlmIChvcmRlci5jb3Vwb24gJiYgb3JkZXIuY291cG9uLmRpc2NvdW50KSB7XG4gICAgZGlzY291bnRJbmZvID0gYFxuICAgICAgPHA+PHN0cm9uZz5Nw6MgZ2nhuqNtIGdpw6E6PC9zdHJvbmc+ICR7b3JkZXIuY291cG9uLmNvZGUgfHwgJ8SQw6Mgw6FwIGThu6VuZyd9PC9wPlxuICAgICAgPHA+PHN0cm9uZz5HaeG6o20gZ2nDoTo8L3N0cm9uZz4gJHtmb3JtYXRDdXJyZW5jeShvcmRlci5jb3Vwb24uZGlzY291bnQpfTwvcD5cbiAgICBgO1xuICB9XG5cbiAgLy8gWMOhYyDEkeG7i25oIHBow60gduG6rW4gY2h1eeG7g25cbiAgY29uc3Qgc2hpcHBpbmdGZWUgPSBvcmRlci5zaGlwcGluZ0ZlZSB8fCBvcmRlci5kZWxpdmVyeUZlZSB8fCAwO1xuICBcbiAgLy8gVOG6oW8gSFRNTCBjaG8gZW1haWxcbiAgcmV0dXJuIGBcbiAgICA8IURPQ1RZUEUgaHRtbD5cbiAgICA8aHRtbD5cbiAgICA8aGVhZD5cbiAgICAgIDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiPlxuICAgICAgPHRpdGxlPljDoWMgbmjhuq1uIMSRxqFuIGjDoG5nICMke29yZGVyLm9yZGVyQ29kZX08L3RpdGxlPlxuICAgICAgPHN0eWxlPlxuICAgICAgICBib2R5IHsgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmOyBsaW5lLWhlaWdodDogMS42OyBjb2xvcjogIzMzMzsgfVxuICAgICAgICAuY29udGFpbmVyIHsgbWF4LXdpZHRoOiA2MDBweDsgbWFyZ2luOiAwIGF1dG87IHBhZGRpbmc6IDIwcHg7IH1cbiAgICAgICAgLmhlYWRlciB7IGJhY2tncm91bmQtY29sb3I6ICM1MWJiMWE7IGNvbG9yOiB3aGl0ZTsgcGFkZGluZzogMTVweCAyMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGJvcmRlci1yYWRpdXM6IDhweCA4cHggMCAwOyB9XG4gICAgICAgIC5jb250ZW50IHsgcGFkZGluZzogMjBweDsgYmFja2dyb3VuZC1jb2xvcjogI2Y5ZjlmOTsgYm9yZGVyLXJhZGl1czogMCAwIDhweCA4cHg7IH1cbiAgICAgICAgLmZvb3RlciB7IHRleHQtYWxpZ246IGNlbnRlcjsgbWFyZ2luLXRvcDogMjBweDsgZm9udC1zaXplOiAxMnB4OyBjb2xvcjogIzc3NzsgfVxuICAgICAgICB0YWJsZSB7IHdpZHRoOiAxMDAlOyBib3JkZXItY29sbGFwc2U6IGNvbGxhcHNlOyBtYXJnaW4tYm90dG9tOiAyMHB4OyB9XG4gICAgICAgIHRoIHsgYmFja2dyb3VuZC1jb2xvcjogI2YyZjJmMjsgdGV4dC1hbGlnbjogbGVmdDsgcGFkZGluZzogMTBweDsgfVxuICAgICAgICAuc3VtbWFyeSB7IG1hcmdpbi10b3A6IDIwcHg7IGZvbnQtd2VpZ2h0OiBib2xkOyB9XG4gICAgICAgIC5xcmNvZGUgeyB0ZXh0LWFsaWduOiBjZW50ZXI7IG1hcmdpbjogMjBweCAwOyB9XG4gICAgICAgIC5xcmNvZGUgaW1nIHsgbWF4LXdpZHRoOiAyMDBweDsgfVxuICAgICAgICAub3JkZXItaW5mbyB7IG1hcmdpbi1ib3R0b206IDIwcHg7IGJhY2tncm91bmQtY29sb3I6ICNmZmY7IHBhZGRpbmc6IDE1cHg7IGJvcmRlci1yYWRpdXM6IDhweDsgYm94LXNoYWRvdzogMCAxcHggM3B4IHJnYmEoMCwwLDAsMC4xKTsgfVxuICAgICAgICAuc2hpcHBpbmctaW5mbyB7IG1hcmdpbi1ib3R0b206IDIwcHg7IGJhY2tncm91bmQtY29sb3I6ICNmZmY7IHBhZGRpbmc6IDE1cHg7IGJvcmRlci1yYWRpdXM6IDhweDsgYm94LXNoYWRvdzogMCAxcHggM3B4IHJnYmEoMCwwLDAsMC4xKTsgfVxuICAgICAgICAudGhhbmsteW91IHsgbWFyZ2luLXRvcDogMzBweDsgZm9udC13ZWlnaHQ6IGJvbGQ7IGNvbG9yOiAjNTFiYjFhOyB0ZXh0LWFsaWduOiBjZW50ZXI7IGZvbnQtc2l6ZTogMThweDsgfVxuICAgICAgICAubG9nbyB7IGZvbnQtc2l6ZTogMjRweDsgZm9udC13ZWlnaHQ6IGJvbGQ7IG1hcmdpbi1ib3R0b206IDEwcHg7IH1cbiAgICAgICAgLmJ0biB7IGRpc3BsYXk6IGlubGluZS1ibG9jazsgYmFja2dyb3VuZC1jb2xvcjogIzUxYmIxYTsgY29sb3I6IHdoaXRlOyBwYWRkaW5nOiAxMHB4IDIwcHg7IHRleHQtZGVjb3JhdGlvbjogbm9uZTsgYm9yZGVyLXJhZGl1czogNHB4OyBtYXJnaW4tdG9wOiAxNXB4OyB9XG4gICAgICA8L3N0eWxlPlxuICAgIDwvaGVhZD5cbiAgICA8Ym9keT5cbiAgICAgIDxkaXYgY2xhc3M9XCJjb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJsb2dvXCI+RE5DIEZPT0Q8L2Rpdj5cbiAgICAgICAgICA8aDI+WMOhYyBuaOG6rW4gxJHGoW4gaMOgbmcgIyR7b3JkZXIub3JkZXJDb2RlfTwvaDI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGVudFwiPlxuICAgICAgICAgIDxwPlhpbiBjaMOgbyAke29yZGVyLnNoaXBwaW5nSW5mbz8uZnVsbE5hbWUgfHwgJ1F1w70ga2jDoWNoJ30sPC9wPlxuICAgICAgICAgIDxwPkPhuqNtIMahbiBi4bqhbiDEkcOjIMSR4bq3dCBow6BuZyB04bqhaSBETkMgRk9PRC4gxJDGoW4gaMOgbmcgY+G7p2EgYuG6oW4gxJHDoyDEkcaw4bujYyB4w6FjIG5o4bqtbiE8L3A+XG4gICAgICAgICAgXG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm9yZGVyLWluZm9cIj5cbiAgICAgICAgICAgIDxoMz5UaMO0bmcgdGluIMSRxqFuIGjDoG5nPC9oMz5cbiAgICAgICAgICAgIDxwPjxzdHJvbmc+TcOjIMSRxqFuIGjDoG5nOjwvc3Ryb25nPiAke29yZGVyLm9yZGVyQ29kZX08L3A+XG4gICAgICAgICAgICA8cD48c3Ryb25nPk5nw6B5IMSR4bq3dCBow6BuZzo8L3N0cm9uZz4gJHtuZXcgRGF0ZShvcmRlci5jcmVhdGVkQXQpLnRvTG9jYWxlU3RyaW5nKCd2aS1WTicpfTwvcD5cbiAgICAgICAgICAgIDxwPjxzdHJvbmc+UGjGsMahbmcgdGjhu6ljIHRoYW5oIHRvw6FuOjwvc3Ryb25nPiAke29yZGVyLnBheW1lbnRNZXRob2QgPT09ICdjb2QnID8gJ1RoYW5oIHRvw6FuIGtoaSBuaOG6rW4gaMOgbmcgKENPRCknIDogJ1RoYW5oIHRvw6FuIHRy4buxYyB0dXnhur9uJ308L3A+XG4gICAgICAgICAgICA8cD48c3Ryb25nPlRy4bqhbmcgdGjDoWkgxJHGoW4gaMOgbmc6PC9zdHJvbmc+ICR7b3JkZXIuc3RhdHVzID09PSAncGVuZGluZycgPyAnxJBhbmcgeOG7rSBsw70nIDogb3JkZXIuc3RhdHVzfTwvcD5cbiAgICAgICAgICAgICR7ZGlzY291bnRJbmZvfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIFxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwcGluZy1pbmZvXCI+XG4gICAgICAgICAgICA8aDM+VGjDtG5nIHRpbiBnaWFvIGjDoG5nPC9oMz5cbiAgICAgICAgICAgIDxwPjxzdHJvbmc+SOG7jSB0w6puOjwvc3Ryb25nPiAke29yZGVyLnNoaXBwaW5nSW5mbz8uZnVsbE5hbWUgfHwgJyd9PC9wPlxuICAgICAgICAgICAgPHA+PHN0cm9uZz7EkOG7i2EgY2jhu4k6PC9zdHJvbmc+ICR7b3JkZXIuc2hpcHBpbmdJbmZvPy5hZGRyZXNzIHx8ICcnfTwvcD5cbiAgICAgICAgICAgIDxwPjxzdHJvbmc+U+G7kSDEkWnhu4duIHRob+G6oWk6PC9zdHJvbmc+ICR7b3JkZXIuc2hpcHBpbmdJbmZvPy5waG9uZSB8fCAnJ308L3A+XG4gICAgICAgICAgICA8cD48c3Ryb25nPkVtYWlsOjwvc3Ryb25nPiAke29yZGVyLnNoaXBwaW5nSW5mbz8uZW1haWwgfHwgJyd9PC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIFxuICAgICAgICAgIDxoMz5DaGkgdGnhur90IMSRxqFuIGjDoG5nPC9oMz5cbiAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICA8dGggc3R5bGU9XCJwYWRkaW5nOiAxMHB4OyB0ZXh0LWFsaWduOiBsZWZ0O1wiPlPhuqNuIHBo4bqpbTwvdGg+XG4gICAgICAgICAgICAgICAgPHRoIHN0eWxlPVwicGFkZGluZzogMTBweDsgdGV4dC1hbGlnbjogY2VudGVyO1wiPlPhu5EgbMaw4bujbmc8L3RoPlxuICAgICAgICAgICAgICAgIDx0aCBzdHlsZT1cInBhZGRpbmc6IDEwcHg7IHRleHQtYWxpZ246IHJpZ2h0O1wiPsSQxqFuIGdpw6E8L3RoPlxuICAgICAgICAgICAgICAgIDx0aCBzdHlsZT1cInBhZGRpbmc6IDEwcHg7IHRleHQtYWxpZ246IHJpZ2h0O1wiPlRow6BuaCB0aeG7gW48L3RoPlxuICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgJHtwcm9kdWN0c0xpc3R9XG4gICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgXG4gICAgICAgICAgPGRpdiBjbGFzcz1cInN1bW1hcnlcIiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6ICNmZmY7IHBhZGRpbmc6IDE1cHg7IGJvcmRlci1yYWRpdXM6IDhweDsgYm94LXNoYWRvdzogMCAxcHggM3B4IHJnYmEoMCwwLDAsMC4xKTtcIj5cbiAgICAgICAgICAgIDxwPlThu5VuZyBz4buRIHPhuqNuIHBo4bqpbTogJHt0b3RhbEl0ZW1zfTwvcD5cbiAgICAgICAgICAgIDxwPlThu5VuZyB0aeG7gW4gaMOgbmc6ICR7Zm9ybWF0Q3VycmVuY3kob3JkZXIuc3VidG90YWwgfHwgb3JkZXIudG90YWxBbW91bnQpfTwvcD5cbiAgICAgICAgICAgIDxwPlBow60gduG6rW4gY2h1eeG7g246ICR7Zm9ybWF0Q3VycmVuY3koc2hpcHBpbmdGZWUpfTwvcD5cbiAgICAgICAgICAgICR7b3JkZXIuY291cG9uICYmIG9yZGVyLmNvdXBvbi5kaXNjb3VudCA/IGA8cD5HaeG6o20gZ2nDoTogLSR7Zm9ybWF0Q3VycmVuY3kob3JkZXIuY291cG9uLmRpc2NvdW50KX08L3A+YCA6ICcnfVxuICAgICAgICAgICAgPHAgc3R5bGU9XCJmb250LXNpemU6IDE4cHg7IGNvbG9yOiAjNTFiYjFhO1wiPlThu5VuZyB0aGFuaCB0b8OhbjogJHtmb3JtYXRDdXJyZW5jeShvcmRlci50b3RhbEFtb3VudCl9PC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIFxuICAgICAgICAgICR7cXJDb2RlSW1hZ2UgPyBgXG4gICAgICAgICAgPGRpdiBjbGFzcz1cInFyY29kZVwiPlxuICAgICAgICAgICAgPHA+TcOjIFFSIMSRxqFuIGjDoG5nIGPhu6dhIGLhuqFuOjwvcD5cbiAgICAgICAgICAgIDxpbWcgc3JjPVwiJHtxckNvZGVJbWFnZX1cIiBhbHQ9XCJRUiBDb2RlXCI+XG4gICAgICAgICAgICA8cD5RdcOpdCBtw6MgbsOgeSDEkeG7gyB4ZW0gdGjDtG5nIHRpbiDEkcahbiBow6BuZzwvcD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICBgIDogJyd9XG4gICAgICAgICAgXG4gICAgICAgICAgPHAgY2xhc3M9XCJ0aGFuay15b3VcIj5D4bqjbSDGoW4gYuG6oW4gxJHDoyBs4buxYSBjaOG7jW4gRE5DIEZPT0QhPC9wPlxuICAgICAgICAgIFxuICAgICAgICAgIDxkaXYgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7XCI+XG4gICAgICAgICAgICA8YSBocmVmPVwiJHtFTlYuQ0xJRU5UX1VSTH0vdGFpLWtob2FuL2Rvbi1oYW5nXCIgY2xhc3M9XCJidG5cIj5YZW0gxJHGoW4gaMOgbmcgY+G7p2EgdMO0aTwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICBcbiAgICAgICAgICA8cD5O4bq/dSBi4bqhbiBjw7MgYuG6pXQga+G7syBjw6J1IGjhu49pIG7DoG8sIHZ1aSBsw7JuZyBsacOqbiBo4buHIHbhu5tpIGNow7puZyB0w7RpIHF1YSBlbWFpbCAke0VOVi5FTUFJTF9VU0VSTkFNRSB8fCAnc3VwcG9ydEBkbmNmb29kLmNvbSd9IGhv4bq3YyBn4buNaSDEkeG6v24gaG90bGluZSAwMzI2IDc0MzM5MS48L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyXCI+XG4gICAgICAgICAgPHA+wqkgJHtuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCl9IEROQyBGT09ELiDEkOG7i2EgY2jhu4k6IDI3MyBBbiBExrDGoW5nIFbGsMahbmcsIFBoxrDhu51uZyAzLCBRdeG6rW4gNSwgVFAuIEjhu5MgQ2jDrSBNaW5oLjwvcD5cbiAgICAgICAgICA8cD5FbWFpbCBuw6B5IMSRxrDhu6NjIGfhu61pIHThu7EgxJHhu5luZywgdnVpIGzDsm5nIGtow7RuZyB0cuG6oyBs4budaS48L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9ib2R5PlxuICAgIDwvaHRtbD5cbiAgYDtcbn07XG5cbi8vIEjDoG0gZ+G7rWkgZW1haWwgeMOhYyBuaOG6rW4gxJHGoW4gaMOgbmdcbmV4cG9ydCBjb25zdCBzZW5kT3JkZXJDb25maXJtYXRpb25FbWFpbCA9IGFzeW5jIChvcmRlcikgPT4ge1xuICB0cnkge1xuICAgIC8vIEtp4buDbSB0cmEgdOG6pXQgY+G6oyBjw6FjIHRow7RuZyB0aW4gY+G6p24gdGhp4bq/dCDEkeG7gyBn4butaSBlbWFpbFxuICAgIGlmICghb3JkZXIuc2hpcHBpbmdJbmZvKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIC8vIEto4bqvYyBwaOG7pWMgbOG7l2kgZW1haWwgYuG7iyB0aGnhur91IHRyb25nIHNoaXBwaW5nSW5mb1xuICAgIGlmICghb3JkZXIuc2hpcHBpbmdJbmZvLmVtYWlsKSB7XG4gICAgICAvLyBO4bq/dSBraMO0bmcgY8OzIGVtYWlsIHRyb25nIHNoaXBwaW5nSW5mbyBuaMawbmcgY8OzIHRyb25nIHVzZXJJZFxuICAgICAgaWYgKG9yZGVyLnVzZXJJZCAmJiBvcmRlci51c2VySWQuZW1haWwpIHtcbiAgICAgICAgb3JkZXIuc2hpcHBpbmdJbmZvLmVtYWlsID0gb3JkZXIudXNlcklkLmVtYWlsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBU4bqhbyBk4buvIGxp4buHdSBjaG8gbcOjIFFSXG4gICAgY29uc3QgcXJEYXRhID0ge1xuICAgICAgb3JkZXJDb2RlOiBvcmRlci5vcmRlckNvZGUsXG4gICAgICB0b3RhbEFtb3VudDogb3JkZXIudG90YWxBbW91bnQsXG4gICAgICBzdGF0dXM6IG9yZGVyLnN0YXR1cyxcbiAgICAgIGRhdGU6IG9yZGVyLmNyZWF0ZWRBdFxuICAgIH07XG4gICAgXG4gICAgLy8gVOG6oW8gbcOjIFFSXG4gICAgY29uc3QgcXJDb2RlSW1hZ2UgPSBhd2FpdCBnZW5lcmF0ZVFSQ29kZShxckRhdGEpO1xuICAgIFxuICAgIC8vIFThuqFvIG7hu5lpIGR1bmcgZW1haWxcbiAgICBjb25zdCBodG1sQ29udGVudCA9IGNyZWF0ZU9yZGVyRW1haWxUZW1wbGF0ZShvcmRlciwgcXJDb2RlSW1hZ2UpO1xuICAgIFxuICAgIC8vIEPhuqV1IGjDrG5oIGVtYWlsXG4gICAgY29uc3QgbWFpbE9wdGlvbnMgPSB7XG4gICAgICBmcm9tOiBgXCJETkMgRk9PRFwiIDwke0VOVi5FTUFJTF9VU0VSTkFNRX0+YCxcbiAgICAgIHRvOiBvcmRlci5zaGlwcGluZ0luZm8uZW1haWwsXG4gICAgICBzdWJqZWN0OiBgWMOhYyBuaOG6rW4gxJHGoW4gaMOgbmcgIyR7b3JkZXIub3JkZXJDb2RlfWAsXG4gICAgICBodG1sOiBodG1sQ29udGVudFxuICAgIH07XG4gICAgXG4gICAgLy8gR+G7rWkgZW1haWxcbiAgICBjb25zdCBpbmZvID0gYXdhaXQgdHJhbnNwb3J0ZXIuc2VuZE1haWwobWFpbE9wdGlvbnMpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxuLy8gQ3JlYXRlIGVtYWlsIHRlbXBsYXRlIGZvciBvcmRlciBzaGlwcGluZyBub3RpZmljYXRpb25cbmNvbnN0IGNyZWF0ZU9yZGVyU2hpcHBpbmdUZW1wbGF0ZSA9IChvcmRlcikgPT4ge1xuICAvLyBGb3JtYXQgY3VycmVuY3lcbiAgY29uc3QgZm9ybWF0Q3VycmVuY3kgPSAoYW1vdW50KSA9PiB7XG4gICAgcmV0dXJuIG5ldyBJbnRsLk51bWJlckZvcm1hdCgndmktVk4nLCB7XG4gICAgICBzdHlsZTogJ2N1cnJlbmN5JyxcbiAgICAgIGN1cnJlbmN5OiAnVk5EJ1xuICAgIH0pLmZvcm1hdChhbW91bnQpO1xuICB9O1xuICBcbiAgLy8gR2V0IHBheW1lbnQgc3RhdHVzIGFuZCBhbW91bnQgdG8gYmUgcGFpZFxuICBjb25zdCBpc1BhaWQgPSBvcmRlci5pc1BhaWQgfHwgZmFsc2U7XG4gIGNvbnN0IGFtb3VudFRvQmVQYWlkID0gaXNQYWlkID8gMCA6IChvcmRlci50b3RhbEFtb3VudCArIChvcmRlci5zaGlwcGluZ0ZlZSB8fCAwKSk7XG4gIFxuICAvLyBIYW5kbGUgY2FzZSB3aGVyZSBvcmRlckNvZGUgaXMgbWlzc2luZ1xuICBjb25zdCBvcmRlcklkZW50aWZpZXIgPSBvcmRlci5vcmRlckNvZGUgfHwgKG9yZGVyLl9pZCA/IG9yZGVyLl9pZC50b1N0cmluZygpLnNsaWNlKC02KS50b1VwcGVyQ2FzZSgpIDogJ04vQScpO1xuICBcbiAgLy8gR2V0IGN1c3RvbWVyIG5hbWUgZnJvbSBlaXRoZXIgc2hpcHBpbmdJbmZvIG9yIHVzZXJJZFxuICBsZXQgY3VzdG9tZXJOYW1lID0gJ1F1w70ga2jDoWNoJztcbiAgaWYgKG9yZGVyLnNoaXBwaW5nSW5mbyAmJiBvcmRlci5zaGlwcGluZ0luZm8uZnVsbE5hbWUpIHtcbiAgICBjdXN0b21lck5hbWUgPSBvcmRlci5zaGlwcGluZ0luZm8uZnVsbE5hbWU7XG4gIH0gZWxzZSBpZiAob3JkZXIudXNlcklkKSB7XG4gICAgaWYgKG9yZGVyLnVzZXJJZC5maXJzdE5hbWUgJiYgb3JkZXIudXNlcklkLmxhc3ROYW1lKSB7XG4gICAgICBjdXN0b21lck5hbWUgPSBgJHtvcmRlci51c2VySWQuZmlyc3ROYW1lfSAke29yZGVyLnVzZXJJZC5sYXN0TmFtZX1gO1xuICAgIH0gZWxzZSBpZiAob3JkZXIudXNlcklkLnVzZXJOYW1lKSB7XG4gICAgICBjdXN0b21lck5hbWUgPSBvcmRlci51c2VySWQudXNlck5hbWU7XG4gICAgfVxuICB9XG4gIFxuICAvLyBHZXQgc2hpcHBpbmcgYWRkcmVzcyBhbmQgcGhvbmUgZnJvbSBlaXRoZXIgc2hpcHBpbmdJbmZvIG9yIHVzZXJJZFxuICBsZXQgc2hpcHBpbmdBZGRyZXNzID0gJyc7XG4gIGxldCBwaG9uZU51bWJlciA9ICcnO1xuICBcbiAgaWYgKG9yZGVyLnNoaXBwaW5nSW5mbykge1xuICAgIHNoaXBwaW5nQWRkcmVzcyA9IG9yZGVyLnNoaXBwaW5nSW5mby5hZGRyZXNzIHx8ICcnO1xuICAgIHBob25lTnVtYmVyID0gb3JkZXIuc2hpcHBpbmdJbmZvLnBob25lIHx8ICcnO1xuICB9IGVsc2UgaWYgKG9yZGVyLnVzZXJJZCkge1xuICAgIHNoaXBwaW5nQWRkcmVzcyA9IG9yZGVyLnVzZXJJZC5hZGRyZXNzIHx8ICcnO1xuICAgIHBob25lTnVtYmVyID0gb3JkZXIudXNlcklkLnBob25lIHx8ICcnO1xuICB9XG4gIFxuICByZXR1cm4gYFxuICAgIDwhRE9DVFlQRSBodG1sPlxuICAgIDxodG1sPlxuICAgIDxoZWFkPlxuICAgICAgPG1ldGEgY2hhcnNldD1cIlVURi04XCI+XG4gICAgICA8dGl0bGU+xJDGoW4gaMOgbmcgY+G7p2EgYuG6oW4gxJFhbmcgxJHGsOG7o2MgZ2lhbyDEkeG6v248L3RpdGxlPlxuICAgICAgPHN0eWxlPlxuICAgICAgICBib2R5IHsgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmOyBsaW5lLWhlaWdodDogMS42OyBjb2xvcjogIzMzMzsgfVxuICAgICAgICAuY29udGFpbmVyIHsgbWF4LXdpZHRoOiA2MDBweDsgbWFyZ2luOiAwIGF1dG87IHBhZGRpbmc6IDIwcHg7IH1cbiAgICAgICAgLmhlYWRlciB7IGJhY2tncm91bmQtY29sb3I6ICM0MzYxZWU7IGNvbG9yOiB3aGl0ZTsgcGFkZGluZzogMTBweCAyMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IH1cbiAgICAgICAgLmNvbnRlbnQgeyBwYWRkaW5nOiAyMHB4OyBiYWNrZ3JvdW5kLWNvbG9yOiAjZjlmOWY5OyB9XG4gICAgICAgIC5mb290ZXIgeyB0ZXh0LWFsaWduOiBjZW50ZXI7IG1hcmdpbi10b3A6IDIwcHg7IGZvbnQtc2l6ZTogMTJweDsgY29sb3I6ICM3Nzc7IH1cbiAgICAgICAgLmhpZ2hsaWdodCB7IGNvbG9yOiAjNDM2MWVlOyBmb250LXdlaWdodDogYm9sZDsgfVxuICAgICAgICAucGF5bWVudC1pbmZvIHsgbWFyZ2luOiAyMHB4IDA7IHBhZGRpbmc6IDE1cHg7IGJhY2tncm91bmQtY29sb3I6ICNmZmY4ZTY7IGJvcmRlci1sZWZ0OiA0cHggc29saWQgI2ZmYzEwNzsgfVxuICAgICAgICAudGhhbmsteW91IHsgbWFyZ2luLXRvcDogMzBweDsgZm9udC13ZWlnaHQ6IGJvbGQ7IGNvbG9yOiAjNDM2MWVlOyB9XG4gICAgICA8L3N0eWxlPlxuICAgIDwvaGVhZD5cbiAgICA8Ym9keT5cbiAgICAgIDxkaXYgY2xhc3M9XCJjb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgICAgICAgIDxoMj7EkMahbiBow6BuZyBj4bunYSBi4bqhbiDEkWFuZyB0csOqbiDEkcaw4budbmcgZ2lhbyDEkeG6v24hPC9oMj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjb250ZW50XCI+XG4gICAgICAgICAgPHA+WGluIGNow6BvICR7Y3VzdG9tZXJOYW1lfSw8L3A+XG4gICAgICAgICAgPHA+Q2jDum5nIHTDtGkgdnVpIG3hu6tuZyB0aMO0bmcgYsOhbyBy4bqxbmcgxJHGoW4gaMOgbmcgPHNwYW4gY2xhc3M9XCJoaWdobGlnaHRcIj4jJHtvcmRlcklkZW50aWZpZXJ9PC9zcGFuPiBj4bunYSBi4bqhbiBoaeG7h24gxJFhbmcgxJHGsOG7o2MgZ2lhbyDEkeG6v24gxJHhu4thIGNo4buJIGPhu6dhIGLhuqFuLjwvcD5cbiAgICAgICAgICBcbiAgICAgICAgICA8cD48c3Ryb25nPlRow7RuZyB0aW4gZ2lhbyBow6BuZzo8L3N0cm9uZz48L3A+XG4gICAgICAgICAgPHVsPlxuICAgICAgICAgICAgPGxpPjxzdHJvbmc+xJDhu4thIGNo4buJOjwvc3Ryb25nPiAke3NoaXBwaW5nQWRkcmVzc308L2xpPlxuICAgICAgICAgICAgPGxpPjxzdHJvbmc+U+G7kSDEkWnhu4duIHRob+G6oWk6PC9zdHJvbmc+ICR7cGhvbmVOdW1iZXJ9PC9saT5cbiAgICAgICAgICAgIDxsaT48c3Ryb25nPlThu5VuZyBnacOhIHRy4buLIMSRxqFuIGjDoG5nOjwvc3Ryb25nPiAke2Zvcm1hdEN1cnJlbmN5KG9yZGVyLnRvdGFsQW1vdW50ICsgKG9yZGVyLnNoaXBwaW5nRmVlIHx8IDApKX08L2xpPlxuICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgXG4gICAgICAgICAgJHshaXNQYWlkID8gYFxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYXltZW50LWluZm9cIj5cbiAgICAgICAgICAgIDxwPjxzdHJvbmc+VGjDtG5nIHRpbiB0aGFuaCB0b8Ohbjo8L3N0cm9uZz48L3A+XG4gICAgICAgICAgICA8cD5QaMawxqFuZyB0aOG7qWMgdGhhbmggdG/DoW46ICR7b3JkZXIucGF5bWVudE1ldGhvZCA9PT0gJ2NvZCcgPyAnVGhhbmggdG/DoW4ga2hpIG5o4bqtbiBow6BuZyAoQ09EKScgOiBvcmRlci5wYXltZW50TWV0aG9kfTwvcD5cbiAgICAgICAgICAgIDxwPlPhu5EgdGnhu4FuIGPhuqduIHRoYW5oIHRvw6FuOiA8c3BhbiBjbGFzcz1cImhpZ2hsaWdodFwiPiR7Zm9ybWF0Q3VycmVuY3koYW1vdW50VG9CZVBhaWQpfTwvc3Bhbj48L3A+XG4gICAgICAgICAgICA8cD5WdWkgbMOybmcgY2h14bqpbiBi4buLIHPhu5EgdGnhu4FuIGNow61uaCB4w6FjIMSR4buDIHF1w6EgdHLDrG5oIGdpYW8gaMOgbmcgZGnhu4VuIHJhIHRodeG6rW4gbOG7o2kuPC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIGAgOiBgXG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBheW1lbnQtaW5mb1wiIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogI2U3ZjdlNzsgYm9yZGVyLWxlZnQ6IDRweCBzb2xpZCAjNENBRjUwO1wiPlxuICAgICAgICAgICAgPHA+PHN0cm9uZz5UaMO0bmcgdGluIHRoYW5oIHRvw6FuOjwvc3Ryb25nPjwvcD5cbiAgICAgICAgICAgIDxwPsSQxqFuIGjDoG5nIGPhu6dhIGLhuqFuIMSRw6MgxJHGsOG7o2MgdGhhbmggdG/DoW4gxJHhuqd5IMSR4bunLjwvcD5cbiAgICAgICAgICAgIDxwPkLhuqFuIGNo4buJIGPhuqduIG5o4bqtbiBow6BuZyBtw6Aga2jDtG5nIGPhuqduIHRoYW5oIHRvw6FuIHRow6ptIGtob+G6o24gbsOgby48L3A+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgYH1cbiAgICAgICAgICBcbiAgICAgICAgICA8cD7EkMahbiBow6BuZyBj4bunYSBi4bqhbiBk4buxIGtp4bq/biBz4bq9IMSRxrDhu6NjIGdpYW8gdHJvbmcgbmfDoHkuIE5ow6JuIHZpw6puIGdpYW8gaMOgbmcgc+G6vSBsacOqbiBo4buHIHbhu5tpIGLhuqFuIHRyxrDhu5tjIGtoaSBnaWFvLjwvcD5cbiAgICAgICAgICBcbiAgICAgICAgICA8cD5O4bq/dSBi4bqhbiBraMO0bmcgY8OzIG5ow6AgdsOgbyB0aOG7nWkgxJFp4buDbSBnaWFvIGjDoG5nLCB2dWkgbMOybmcgbGnDqm4gaOG7hyB24bubaSBjaMO6bmcgdMO0aSDEkeG7gyBz4bqvcCB44bq/cCBs4bqhaSB0aOG7nWkgZ2lhbiBnaWFvIGjDoG5nIHBow7kgaOG7o3AuPC9wPlxuICAgICAgICAgIFxuICAgICAgICAgIDxwIGNsYXNzPVwidGhhbmsteW91XCI+Q+G6o20gxqFuIGLhuqFuIMSRw6MgbOG7sWEgY2jhu41uIFNpw6p1IFRo4buLIFRo4buxYyBQaOG6qW0gU+G6oWNoITwvcD5cbiAgICAgICAgICBcbiAgICAgICAgICA8cD5O4bq/dSBi4bqhbiBjw7MgYuG6pXQga+G7syBjw6J1IGjhu49pIG7DoG8sIHZ1aSBsw7JuZyBsacOqbiBo4buHIHbhu5tpIGNow7puZyB0w7RpIHF1YSBlbWFpbCBzdXBwb3J0QGNodW9pa29pY2hvLmNvbSBob+G6t2MgZ+G7jWkgxJHhur9uIGhvdGxpbmUgMTkwMCA2Nzg5LjwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cbiAgICAgICAgICA8cD7CqSAyMDIzIFNpw6p1IFRo4buLIFRo4buxYyBQaOG6qW0gU+G6oWNoLiDEkOG7i2EgY2jhu4k6IDI3MyBBbiBExrDGoW5nIFbGsMahbmcsIFBoxrDhu51uZyAzLCBRdeG6rW4gNSwgVFAuIEjhu5MgQ2jDrSBNaW5oLjwvcD5cbiAgICAgICAgICA8cD5FbWFpbCBuw6B5IMSRxrDhu6NjIGfhu61pIHThu7EgxJHhu5luZywgdnVpIGzDsm5nIGtow7RuZyB0cuG6oyBs4budaS48L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9ib2R5PlxuICAgIDwvaHRtbD5cbiAgYDtcbn07XG5cbi8vIEZ1bmN0aW9uIHRvIHNlbmQgZW1haWwgbm90aWZpY2F0aW9uIHdoZW4gb3JkZXIgaXMgYmVpbmcgZGVsaXZlcmVkXG5leHBvcnQgY29uc3Qgc2VuZE9yZGVyU2hpcHBpbmdFbWFpbCA9IGFzeW5jIChvcmRlcikgPT4ge1xuICAvLyBDaGVjayBpZiBvcmRlciBoYXMgZW1haWwgaW5mb3JtYXRpb24gZWl0aGVyIGluIHNoaXBwaW5nSW5mbyBvciB1c2VySWRcbiAgbGV0IHJlY2lwaWVudEVtYWlsID0gbnVsbDtcbiAgXG4gIC8vIEZpcnN0IHRyeSB0byBnZXQgZW1haWwgZnJvbSBzaGlwcGluZ0luZm9cbiAgaWYgKG9yZGVyLnNoaXBwaW5nSW5mbyAmJiBvcmRlci5zaGlwcGluZ0luZm8uZW1haWwpIHtcbiAgICByZWNpcGllbnRFbWFpbCA9IG9yZGVyLnNoaXBwaW5nSW5mby5lbWFpbDtcbiAgfSBcbiAgLy8gSWYgbm90IGF2YWlsYWJsZSwgdHJ5IHRvIGdldCBmcm9tIHVzZXJJZCBpZiBpdCdzIHBvcHVsYXRlZFxuICBlbHNlIGlmIChvcmRlci51c2VySWQgJiYgb3JkZXIudXNlcklkLmVtYWlsKSB7XG4gICAgcmVjaXBpZW50RW1haWwgPSBvcmRlci51c2VySWQuZW1haWw7XG4gIH1cbiAgXG4gIGlmICghcmVjaXBpZW50RW1haWwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgXG4gIC8vIEhhbmRsZSBjYXNlIHdoZXJlIG9yZGVyQ29kZSBpcyBtaXNzaW5nXG4gIGNvbnN0IG9yZGVySWRlbnRpZmllciA9IG9yZGVyLm9yZGVyQ29kZSB8fCAob3JkZXIuX2lkID8gb3JkZXIuX2lkLnRvU3RyaW5nKCkuc2xpY2UoLTYpLnRvVXBwZXJDYXNlKCkgOiAnTi9BJyk7XG4gIFxuICAvLyBDcmVhdGUgZW1haWwgY29udGVudFxuICBjb25zdCBodG1sQ29udGVudCA9IGNyZWF0ZU9yZGVyU2hpcHBpbmdUZW1wbGF0ZShvcmRlcik7XG4gIFxuICAvLyBDb25maWd1cmUgZW1haWxcbiAgY29uc3QgbWFpbE9wdGlvbnMgPSB7XG4gICAgZnJvbTogYFwiRE5DIEZPT0RcIiA8JHtFTlYuRU1BSUxfVVNFUk5BTUUgfHwgJ25vLXJlcGx5QGRuY2Zvb2QuY29tJ30+YCxcbiAgICB0bzogcmVjaXBpZW50RW1haWwsXG4gICAgc3ViamVjdDogYMSQxqFuIGjDoG5nICMke29yZGVySWRlbnRpZmllcn0gxJFhbmcgxJHGsOG7o2MgZ2lhbyDEkeG6v24gYuG6oW5gLFxuICAgIGh0bWw6IGh0bWxDb250ZW50XG4gIH07XG4gIFxuICAvLyBTZW5kIGVtYWlsXG4gIGNvbnN0IGluZm8gPSBhd2FpdCB0cmFuc3BvcnRlci5zZW5kTWFpbChtYWlsT3B0aW9ucyk7XG4gIHJldHVybiB0cnVlO1xufTtcblxuZXhwb3J0IGRlZmF1bHQge1xuICBzZW5kT3JkZXJDb25maXJtYXRpb25FbWFpbCxcbiAgc2VuZE9yZGVyU2hpcHBpbmdFbWFpbFxufTsgIl0sIm1hcHBpbmdzIjoiMEtBQUEsSUFBQUEsV0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsT0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsT0FBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBLFlBQTRCLFNBQUFELHVCQUFBSSxDQUFBLFVBQUFBLENBQUEsSUFBQUEsQ0FBQSxDQUFBQyxVQUFBLEdBQUFELENBQUEsS0FBQUUsT0FBQSxFQUFBRixDQUFBOztBQUU1QjtBQUNBRyxlQUFNLENBQUNDLE1BQU0sQ0FBQyxDQUFDOztBQUVmO0FBQ0E7QUFDQSxNQUFNQyxHQUFHLEdBQUc7RUFDVkMsY0FBYyxFQUFFQyxPQUFPLENBQUNDLEdBQUcsQ0FBQ0YsY0FBYyxJQUFJLHNCQUFzQjtFQUNwRUcsY0FBYyxFQUFFRixPQUFPLENBQUNDLEdBQUcsQ0FBQ0MsY0FBYyxJQUFJLG1CQUFtQjtFQUNqRUMsVUFBVSxFQUFFSCxPQUFPLENBQUNDLEdBQUcsQ0FBQ0UsVUFBVSxJQUFJO0FBQ3hDLENBQUM7O0FBRUQ7QUFDQSxNQUFNQyxXQUFXLEdBQUdDLG1CQUFVLENBQUNDLGVBQWUsQ0FBQztFQUM3Q0MsT0FBTyxFQUFFLE9BQU87RUFDaEJDLElBQUksRUFBRSxnQkFBZ0I7RUFDdEJDLElBQUksRUFBRSxHQUFHO0VBQ1RDLE1BQU0sRUFBRSxLQUFLO0VBQ2JDLElBQUksRUFBRTtJQUNKQyxJQUFJLEVBQUVkLEdBQUcsQ0FBQ0MsY0FBYztJQUN4QmMsSUFBSSxFQUFFZixHQUFHLENBQUNJO0VBQ1osQ0FBQztFQUNEWSxHQUFHLEVBQUU7SUFDSEMsa0JBQWtCLEVBQUU7RUFDdEI7QUFDRixDQUFDLENBQUM7O0FBRUY7QUFDQSxNQUFNQyxjQUFjLEdBQUcsTUFBQUEsQ0FBT0MsSUFBSSxLQUFLO0VBQ3JDLElBQUk7SUFDRixPQUFPLE1BQU1DLGVBQU0sQ0FBQ0MsU0FBUyxDQUFDQyxJQUFJLENBQUNDLFNBQVMsQ0FBQ0osSUFBSSxDQUFDLENBQUM7RUFDckQsQ0FBQyxDQUFDLE9BQU9LLEtBQUssRUFBRTtJQUNkLE9BQU8sSUFBSTtFQUNiO0FBQ0YsQ0FBQzs7QUFFRDtBQUNBLE1BQU1DLHdCQUF3QixHQUFHQSxDQUFDQyxLQUFLLEVBQUVDLFdBQVcsS0FBSyxLQUFBQyxtQkFBQSxFQUFBQyxvQkFBQSxFQUFBQyxvQkFBQSxFQUFBQyxvQkFBQSxFQUFBQyxvQkFBQTtFQUN2RDtFQUNBLE1BQU1DLFVBQVUsR0FBR1AsS0FBSyxDQUFDUSxRQUFRLENBQUNDLE1BQU0sQ0FBQyxDQUFDQyxHQUFHLEVBQUVDLElBQUksS0FBS0QsR0FBRyxHQUFHQyxJQUFJLENBQUNDLFFBQVEsRUFBRSxDQUFDLENBQUM7O0VBRS9FO0VBQ0EsTUFBTUMsY0FBYyxHQUFHQSxDQUFDQyxNQUFNLEtBQUs7SUFDakMsT0FBTyxJQUFJQyxJQUFJLENBQUNDLFlBQVksQ0FBQyxPQUFPLEVBQUU7TUFDcENDLEtBQUssRUFBRSxVQUFVO01BQ2pCQyxRQUFRLEVBQUU7SUFDWixDQUFDLENBQUMsQ0FBQ0MsTUFBTSxDQUFDTCxNQUFNLENBQUM7RUFDbkIsQ0FBQzs7RUFFRDtFQUNBLE1BQU1NLFlBQVksR0FBR3BCLEtBQUssQ0FBQ1EsUUFBUSxDQUFDYSxHQUFHLENBQUMsQ0FBQVYsSUFBSSxLQUFJO0lBQzlDLE1BQU1XLE9BQU8sR0FBR1gsSUFBSSxDQUFDWSxTQUFTO0lBQzlCLE1BQU1DLFdBQVcsR0FBR0YsT0FBTyxDQUFDRSxXQUFXLElBQUksVUFBVTtJQUNyRCxNQUFNQyxZQUFZLEdBQUdILE9BQU8sQ0FBQ0csWUFBWSxJQUFJLENBQUM7SUFDOUMsTUFBTUMsUUFBUSxHQUFHZixJQUFJLENBQUNDLFFBQVEsR0FBR2EsWUFBWTs7SUFFN0MsT0FBTztBQUNYO0FBQ0E7QUFDQTtBQUNBLGNBQWNILE9BQU8sQ0FBQ0ssYUFBYSxJQUFJTCxPQUFPLENBQUNLLGFBQWEsQ0FBQyxDQUFDLENBQUM7SUFDakQsYUFBYUwsT0FBTyxDQUFDSyxhQUFhLENBQUMsQ0FBQyxDQUFDLFVBQVVILFdBQVcsa0dBQWtHO0lBQzVKLEVBQUU7QUFDaEIsbUJBQW1CQSxXQUFXO0FBQzlCO0FBQ0E7QUFDQSx3RkFBd0ZiLElBQUksQ0FBQ0MsUUFBUTtBQUNyRyx1RkFBdUZDLGNBQWMsQ0FBQ1ksWUFBWSxDQUFDO0FBQ25ILHVGQUF1RlosY0FBYyxDQUFDYSxRQUFRLENBQUM7QUFDL0c7QUFDQSxLQUFLO0VBQ0gsQ0FBQyxDQUFDLENBQUNFLElBQUksQ0FBQyxFQUFFLENBQUM7O0VBRVg7RUFDQSxJQUFJQyxZQUFZLEdBQUcsRUFBRTtFQUNyQixJQUFJN0IsS0FBSyxDQUFDOEIsTUFBTSxJQUFJOUIsS0FBSyxDQUFDOEIsTUFBTSxDQUFDQyxRQUFRLEVBQUU7SUFDekNGLFlBQVksR0FBRztBQUNuQix5Q0FBeUM3QixLQUFLLENBQUM4QixNQUFNLENBQUNFLElBQUksSUFBSSxZQUFZO0FBQzFFLHNDQUFzQ25CLGNBQWMsQ0FBQ2IsS0FBSyxDQUFDOEIsTUFBTSxDQUFDQyxRQUFRLENBQUM7QUFDM0UsS0FBSztFQUNIOztFQUVBO0VBQ0EsTUFBTUUsV0FBVyxHQUFHakMsS0FBSyxDQUFDaUMsV0FBVyxJQUFJakMsS0FBSyxDQUFDa0MsV0FBVyxJQUFJLENBQUM7O0VBRS9EO0VBQ0EsT0FBTztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0NBQWtDbEMsS0FBSyxDQUFDbUMsU0FBUztBQUNqRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQ25DLEtBQUssQ0FBQ21DLFNBQVM7QUFDbEQ7QUFDQTtBQUNBLHdCQUF3QixFQUFBakMsbUJBQUEsR0FBQUYsS0FBSyxDQUFDb0MsWUFBWSxjQUFBbEMsbUJBQUEsdUJBQWxCQSxtQkFBQSxDQUFvQm1DLFFBQVEsS0FBSSxXQUFXO0FBQ25FO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0NBQStDckMsS0FBSyxDQUFDbUMsU0FBUztBQUM5RCxpREFBaUQsSUFBSUcsSUFBSSxDQUFDdEMsS0FBSyxDQUFDdUMsU0FBUyxDQUFDLENBQUNDLGNBQWMsQ0FBQyxPQUFPLENBQUM7QUFDbEcsMERBQTBEeEMsS0FBSyxDQUFDeUMsYUFBYSxLQUFLLEtBQUssR0FBRyxnQ0FBZ0MsR0FBRyx1QkFBdUI7QUFDcEosdURBQXVEekMsS0FBSyxDQUFDMEMsTUFBTSxLQUFLLFNBQVMsR0FBRyxZQUFZLEdBQUcxQyxLQUFLLENBQUMwQyxNQUFNO0FBQy9HLGNBQWNiLFlBQVk7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQ0FBMEMsRUFBQTFCLG9CQUFBLEdBQUFILEtBQUssQ0FBQ29DLFlBQVksY0FBQWpDLG9CQUFBLHVCQUFsQkEsb0JBQUEsQ0FBb0JrQyxRQUFRLEtBQUksRUFBRTtBQUM1RSwyQ0FBMkMsRUFBQWpDLG9CQUFBLEdBQUFKLEtBQUssQ0FBQ29DLFlBQVksY0FBQWhDLG9CQUFBLHVCQUFsQkEsb0JBQUEsQ0FBb0J1QyxPQUFPLEtBQUksRUFBRTtBQUM1RSxpREFBaUQsRUFBQXRDLG9CQUFBLEdBQUFMLEtBQUssQ0FBQ29DLFlBQVksY0FBQS9CLG9CQUFBLHVCQUFsQkEsb0JBQUEsQ0FBb0J1QyxLQUFLLEtBQUksRUFBRTtBQUNoRix5Q0FBeUMsRUFBQXRDLG9CQUFBLEdBQUFOLEtBQUssQ0FBQ29DLFlBQVksY0FBQTlCLG9CQUFBLHVCQUFsQkEsb0JBQUEsQ0FBb0J1QyxLQUFLLEtBQUksRUFBRTtBQUN4RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQnpCLFlBQVk7QUFDNUI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUNiLFVBQVU7QUFDN0MsaUNBQWlDTSxjQUFjLENBQUNiLEtBQUssQ0FBQzBCLFFBQVEsSUFBSTFCLEtBQUssQ0FBQzhDLFdBQVcsQ0FBQztBQUNwRixpQ0FBaUNqQyxjQUFjLENBQUNvQixXQUFXLENBQUM7QUFDNUQsY0FBY2pDLEtBQUssQ0FBQzhCLE1BQU0sSUFBSTlCLEtBQUssQ0FBQzhCLE1BQU0sQ0FBQ0MsUUFBUSxHQUFHLGlCQUFpQmxCLGNBQWMsQ0FBQ2IsS0FBSyxDQUFDOEIsTUFBTSxDQUFDQyxRQUFRLENBQUMsTUFBTSxHQUFHLEVBQUU7QUFDdkgsMkVBQTJFbEIsY0FBYyxDQUFDYixLQUFLLENBQUM4QyxXQUFXLENBQUM7QUFDNUc7QUFDQTtBQUNBLFlBQVk3QyxXQUFXLEdBQUc7QUFDMUI7QUFDQTtBQUNBLHdCQUF3QkEsV0FBVztBQUNuQztBQUNBO0FBQ0EsV0FBVyxHQUFHLEVBQUU7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIzQixHQUFHLENBQUNLLFVBQVU7QUFDckM7QUFDQTtBQUNBLHVGQUF1RkwsR0FBRyxDQUFDQyxjQUFjLElBQUkscUJBQXFCO0FBQ2xJO0FBQ0E7QUFDQSxpQkFBaUIsSUFBSStELElBQUksQ0FBQyxDQUFDLENBQUNTLFdBQVcsQ0FBQyxDQUFDO0FBQ3pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0gsQ0FBQzs7QUFFRDtBQUNPLE1BQU1DLDBCQUEwQixHQUFHLE1BQUFBLENBQU9oRCxLQUFLLEtBQUs7RUFDekQsSUFBSTtJQUNGO0lBQ0EsSUFBSSxDQUFDQSxLQUFLLENBQUNvQyxZQUFZLEVBQUU7TUFDdkIsT0FBTyxLQUFLO0lBQ2Q7O0lBRUE7SUFDQSxJQUFJLENBQUNwQyxLQUFLLENBQUNvQyxZQUFZLENBQUNTLEtBQUssRUFBRTtNQUM3QjtNQUNBLElBQUk3QyxLQUFLLENBQUNpRCxNQUFNLElBQUlqRCxLQUFLLENBQUNpRCxNQUFNLENBQUNKLEtBQUssRUFBRTtRQUN0QzdDLEtBQUssQ0FBQ29DLFlBQVksQ0FBQ1MsS0FBSyxHQUFHN0MsS0FBSyxDQUFDaUQsTUFBTSxDQUFDSixLQUFLO01BQy9DLENBQUMsTUFBTTtRQUNMLE9BQU8sS0FBSztNQUNkO0lBQ0Y7O0lBRUE7SUFDQSxNQUFNSyxNQUFNLEdBQUc7TUFDYmYsU0FBUyxFQUFFbkMsS0FBSyxDQUFDbUMsU0FBUztNQUMxQlcsV0FBVyxFQUFFOUMsS0FBSyxDQUFDOEMsV0FBVztNQUM5QkosTUFBTSxFQUFFMUMsS0FBSyxDQUFDMEMsTUFBTTtNQUNwQlMsSUFBSSxFQUFFbkQsS0FBSyxDQUFDdUM7SUFDZCxDQUFDOztJQUVEO0lBQ0EsTUFBTXRDLFdBQVcsR0FBRyxNQUFNVCxjQUFjLENBQUMwRCxNQUFNLENBQUM7O0lBRWhEO0lBQ0EsTUFBTUUsV0FBVyxHQUFHckQsd0JBQXdCLENBQUNDLEtBQUssRUFBRUMsV0FBVyxDQUFDOztJQUVoRTtJQUNBLE1BQU1vRCxXQUFXLEdBQUc7TUFDbEJDLElBQUksRUFBRSxlQUFlaEYsR0FBRyxDQUFDQyxjQUFjLEdBQUc7TUFDMUNnRixFQUFFLEVBQUV2RCxLQUFLLENBQUNvQyxZQUFZLENBQUNTLEtBQUs7TUFDNUJXLE9BQU8sRUFBRSxzQkFBc0J4RCxLQUFLLENBQUNtQyxTQUFTLEVBQUU7TUFDaERzQixJQUFJLEVBQUVMO0lBQ1IsQ0FBQzs7SUFFRDtJQUNBLE1BQU1NLElBQUksR0FBRyxNQUFNOUUsV0FBVyxDQUFDK0UsUUFBUSxDQUFDTixXQUFXLENBQUM7SUFDcEQsT0FBTyxJQUFJO0VBQ2IsQ0FBQyxDQUFDLE9BQU92RCxLQUFLLEVBQUU7SUFDZCxPQUFPLEtBQUs7RUFDZDtBQUNGLENBQUM7O0FBRUQ7QUFBQThELE9BQUEsQ0FBQVosMEJBQUEsR0FBQUEsMEJBQUEsQ0FDQSxNQUFNYSwyQkFBMkIsR0FBR0EsQ0FBQzdELEtBQUssS0FBSztFQUM3QztFQUNBLE1BQU1hLGNBQWMsR0FBR0EsQ0FBQ0MsTUFBTSxLQUFLO0lBQ2pDLE9BQU8sSUFBSUMsSUFBSSxDQUFDQyxZQUFZLENBQUMsT0FBTyxFQUFFO01BQ3BDQyxLQUFLLEVBQUUsVUFBVTtNQUNqQkMsUUFBUSxFQUFFO0lBQ1osQ0FBQyxDQUFDLENBQUNDLE1BQU0sQ0FBQ0wsTUFBTSxDQUFDO0VBQ25CLENBQUM7O0VBRUQ7RUFDQSxNQUFNZ0QsTUFBTSxHQUFHOUQsS0FBSyxDQUFDOEQsTUFBTSxJQUFJLEtBQUs7RUFDcEMsTUFBTUMsY0FBYyxHQUFHRCxNQUFNLEdBQUcsQ0FBQyxHQUFJOUQsS0FBSyxDQUFDOEMsV0FBVyxJQUFJOUMsS0FBSyxDQUFDaUMsV0FBVyxJQUFJLENBQUMsQ0FBRTs7RUFFbEY7RUFDQSxNQUFNK0IsZUFBZSxHQUFHaEUsS0FBSyxDQUFDbUMsU0FBUyxLQUFLbkMsS0FBSyxDQUFDaUUsR0FBRyxHQUFHakUsS0FBSyxDQUFDaUUsR0FBRyxDQUFDQyxRQUFRLENBQUMsQ0FBQyxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ0MsV0FBVyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUM7O0VBRTdHO0VBQ0EsSUFBSUMsWUFBWSxHQUFHLFdBQVc7RUFDOUIsSUFBSXJFLEtBQUssQ0FBQ29DLFlBQVksSUFBSXBDLEtBQUssQ0FBQ29DLFlBQVksQ0FBQ0MsUUFBUSxFQUFFO0lBQ3JEZ0MsWUFBWSxHQUFHckUsS0FBSyxDQUFDb0MsWUFBWSxDQUFDQyxRQUFRO0VBQzVDLENBQUMsTUFBTSxJQUFJckMsS0FBSyxDQUFDaUQsTUFBTSxFQUFFO0lBQ3ZCLElBQUlqRCxLQUFLLENBQUNpRCxNQUFNLENBQUNxQixTQUFTLElBQUl0RSxLQUFLLENBQUNpRCxNQUFNLENBQUNzQixRQUFRLEVBQUU7TUFDbkRGLFlBQVksR0FBRyxHQUFHckUsS0FBSyxDQUFDaUQsTUFBTSxDQUFDcUIsU0FBUyxJQUFJdEUsS0FBSyxDQUFDaUQsTUFBTSxDQUFDc0IsUUFBUSxFQUFFO0lBQ3JFLENBQUMsTUFBTSxJQUFJdkUsS0FBSyxDQUFDaUQsTUFBTSxDQUFDdUIsUUFBUSxFQUFFO01BQ2hDSCxZQUFZLEdBQUdyRSxLQUFLLENBQUNpRCxNQUFNLENBQUN1QixRQUFRO0lBQ3RDO0VBQ0Y7O0VBRUE7RUFDQSxJQUFJQyxlQUFlLEdBQUcsRUFBRTtFQUN4QixJQUFJQyxXQUFXLEdBQUcsRUFBRTs7RUFFcEIsSUFBSTFFLEtBQUssQ0FBQ29DLFlBQVksRUFBRTtJQUN0QnFDLGVBQWUsR0FBR3pFLEtBQUssQ0FBQ29DLFlBQVksQ0FBQ08sT0FBTyxJQUFJLEVBQUU7SUFDbEQrQixXQUFXLEdBQUcxRSxLQUFLLENBQUNvQyxZQUFZLENBQUNRLEtBQUssSUFBSSxFQUFFO0VBQzlDLENBQUMsTUFBTSxJQUFJNUMsS0FBSyxDQUFDaUQsTUFBTSxFQUFFO0lBQ3ZCd0IsZUFBZSxHQUFHekUsS0FBSyxDQUFDaUQsTUFBTSxDQUFDTixPQUFPLElBQUksRUFBRTtJQUM1QytCLFdBQVcsR0FBRzFFLEtBQUssQ0FBQ2lELE1BQU0sQ0FBQ0wsS0FBSyxJQUFJLEVBQUU7RUFDeEM7O0VBRUEsT0FBTztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCeUIsWUFBWTtBQUNwQyxtRkFBbUZMLGVBQWU7QUFDbEc7QUFDQTtBQUNBO0FBQ0EsNENBQTRDUyxlQUFlO0FBQzNELGtEQUFrREMsV0FBVztBQUM3RCwwREFBMEQ3RCxjQUFjLENBQUNiLEtBQUssQ0FBQzhDLFdBQVcsSUFBSTlDLEtBQUssQ0FBQ2lDLFdBQVcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUN0SDtBQUNBO0FBQ0EsWUFBWSxDQUFDNkIsTUFBTSxHQUFHO0FBQ3RCO0FBQ0E7QUFDQSx5Q0FBeUM5RCxLQUFLLENBQUN5QyxhQUFhLEtBQUssS0FBSyxHQUFHLGdDQUFnQyxHQUFHekMsS0FBSyxDQUFDeUMsYUFBYTtBQUMvSCxpRUFBaUU1QixjQUFjLENBQUNrRCxjQUFjLENBQUM7QUFDL0Y7QUFDQTtBQUNBLFdBQVcsR0FBRztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXO0FBQ1g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0gsQ0FBQzs7QUFFRDtBQUNPLE1BQU1ZLHNCQUFzQixHQUFHLE1BQUFBLENBQU8zRSxLQUFLLEtBQUs7RUFDckQ7RUFDQSxJQUFJNEUsY0FBYyxHQUFHLElBQUk7O0VBRXpCO0VBQ0EsSUFBSTVFLEtBQUssQ0FBQ29DLFlBQVksSUFBSXBDLEtBQUssQ0FBQ29DLFlBQVksQ0FBQ1MsS0FBSyxFQUFFO0lBQ2xEK0IsY0FBYyxHQUFHNUUsS0FBSyxDQUFDb0MsWUFBWSxDQUFDUyxLQUFLO0VBQzNDO0VBQ0E7RUFBQSxLQUNLLElBQUk3QyxLQUFLLENBQUNpRCxNQUFNLElBQUlqRCxLQUFLLENBQUNpRCxNQUFNLENBQUNKLEtBQUssRUFBRTtJQUMzQytCLGNBQWMsR0FBRzVFLEtBQUssQ0FBQ2lELE1BQU0sQ0FBQ0osS0FBSztFQUNyQzs7RUFFQSxJQUFJLENBQUMrQixjQUFjLEVBQUU7SUFDbkIsT0FBTyxLQUFLO0VBQ2Q7O0VBRUE7RUFDQSxNQUFNWixlQUFlLEdBQUdoRSxLQUFLLENBQUNtQyxTQUFTLEtBQUtuQyxLQUFLLENBQUNpRSxHQUFHLEdBQUdqRSxLQUFLLENBQUNpRSxHQUFHLENBQUNDLFFBQVEsQ0FBQyxDQUFDLENBQUNDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDQyxXQUFXLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQzs7RUFFN0c7RUFDQSxNQUFNaEIsV0FBVyxHQUFHUywyQkFBMkIsQ0FBQzdELEtBQUssQ0FBQzs7RUFFdEQ7RUFDQSxNQUFNcUQsV0FBVyxHQUFHO0lBQ2xCQyxJQUFJLEVBQUUsZUFBZWhGLEdBQUcsQ0FBQ0MsY0FBYyxJQUFJLHNCQUFzQixHQUFHO0lBQ3BFZ0YsRUFBRSxFQUFFcUIsY0FBYztJQUNsQnBCLE9BQU8sRUFBRSxhQUFhUSxlQUFlLHlCQUF5QjtJQUM5RFAsSUFBSSxFQUFFTDtFQUNSLENBQUM7O0VBRUQ7RUFDQSxNQUFNTSxJQUFJLEdBQUcsTUFBTTlFLFdBQVcsQ0FBQytFLFFBQVEsQ0FBQ04sV0FBVyxDQUFDO0VBQ3BELE9BQU8sSUFBSTtBQUNiLENBQUMsQ0FBQ08sT0FBQSxDQUFBZSxzQkFBQSxHQUFBQSxzQkFBQSxLQUFBRSxRQUFBLEdBQUFqQixPQUFBLENBQUF6RixPQUFBOztBQUVhO0VBQ2I2RSwwQkFBMEI7RUFDMUIyQjtBQUNGLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=