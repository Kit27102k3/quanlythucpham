import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import dotenv from 'dotenv';

// Cấu hình dotenv để đọc biến môi trường
dotenv.config();

// Thiết lập biến môi trường - Sửa lỗi ESLint
/* global process */
const ENV = {
  EMAIL_USERNAME: process.env.EMAIL_USERNAME || 'your-email@gmail.com',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || 'your-app-password',
  CLIENT_URL: process.env.CLIENT_URL || 'https://quanlythucpham-client.vercel.app'
};

// Khởi tạo transporter để gửi email
const transporter = nodemailer.createTransport({
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
    return await QRCode.toDataURL(JSON.stringify(data));
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
  const productsList = order.products.map(item => {
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
          <p>Xin chào ${order.shippingInfo?.fullName || 'Quý khách'},</p>
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
export const sendOrderConfirmationEmail = async (order) => {
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
const createOrderShippingTemplate = (order) => {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };
  
  // Get payment status and amount to be paid
  const isPaid = order.isPaid || false;
  const amountToBePaid = isPaid ? 0 : (order.totalAmount + (order.shippingFee || 0));
  
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
export const sendOrderShippingEmail = async (order) => {
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
};

export default {
  sendOrderConfirmationEmail,
  sendOrderShippingEmail
}; 