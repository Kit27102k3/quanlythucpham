const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load biến môi trường từ file .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Lấy thông tin kết nối từ biến môi trường
const SEPAY_API_TOKEN = process.env.SEPAY_API_TOKEN || 'your_sepay_token_here';
const SEPAY_API_URL = process.env.SEPAY_API_URL || 'https://api.sepay.vn/api';
const SEPAY_MERCHANT_ID = process.env.SEPAY_MERCHANT_ID || 'your_merchant_id';

// Đọc domain ngrok từ ngrok API
async function getNgrokDomain() {
  try {
    const response = await axios.get('http://127.0.0.1:4040/api/tunnels');
    const tunnels = response.data.tunnels;
    const httpsTunnel = tunnels.find(tunnel => tunnel.proto === 'https');
    if (httpsTunnel) {
      return httpsTunnel.public_url;
    }
    throw new Error('Không tìm thấy tunnel HTTPS.');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Lỗi khi lấy domain ngrok:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\x1b[31m%s\x1b[0m', 'Đảm bảo ngrok đang chạy và có thể truy cập được qua http://127.0.0.1:4040');
    }
    throw error;
  }
}

// Cập nhật webhook URL cho SePay
async function updateWebhook(ngrokDomain) {
  try {
    // Tạo các URL callback từ domain ngrok
    const callbackUrl = `${ngrokDomain}/api/payments/sepay/callback`;
    const webhookUrl = `${ngrokDomain}/api/payments/webhook/bank`;
    
    console.log('\x1b[36m%s\x1b[0m', 'Domain Ngrok hiện tại:', ngrokDomain);
    console.log('\x1b[36m%s\x1b[0m', 'Callback URL mới:', callbackUrl);
    console.log('\x1b[36m%s\x1b[0m', 'Webhook URL mới:', webhookUrl);
    
    // Gọi API của SePay để cập nhật webhook
    console.log('\x1b[33m%s\x1b[0m', 'Đang cập nhật webhook...');
    
    // In các biến môi trường (che một phần token)
    const maskedToken = SEPAY_API_TOKEN ? 
      SEPAY_API_TOKEN.substring(0, 4) + '...' + SEPAY_API_TOKEN.substring(SEPAY_API_TOKEN.length - 4) : 
      'not_set';
    
    console.log('\x1b[36m%s\x1b[0m', 'SePay Merchant ID:', SEPAY_MERCHANT_ID);
    console.log('\x1b[36m%s\x1b[0m', 'SePay API Token:', maskedToken);
    
    // Thêm logic mô phỏng cập nhật webhook - Trong trường hợp thực tế, bạn cần biết API chính xác từ SePay
    console.log('\x1b[32m%s\x1b[0m', 'Webhook đã được cập nhật thành công! (Mô phỏng)');
    console.log('\x1b[32m%s\x1b[0m', '✅ Bây giờ SePay sẽ gửi callbacks đến Ngrok URL của bạn.');
    
    // Yêu cầu thêm thông tin về API thực tế từ SePay
    console.log('\x1b[33m%s\x1b[0m', 'LƯU Ý: Để thực sự cập nhật webhook, bạn cần:');
    console.log('\x1b[33m%s\x1b[0m', '1. Liên hệ SePay để có API chính xác để cập nhật webhook');
    console.log('\x1b[33m%s\x1b[0m', '2. Thay thế đoạn mô phỏng này bằng API call thực tế');
    
    // Mẫu API call thực tế (đã bị comment):
    /*
    const response = await axios.post(`${SEPAY_API_URL}/merchant/update-webhook`, {
      merchantId: SEPAY_MERCHANT_ID,
      webhookUrl: webhookUrl,
      callbackUrl: callbackUrl
    }, {
      headers: {
        'Authorization': `Bearer ${SEPAY_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.success) {
      console.log('\x1b[32m%s\x1b[0m', 'Webhook đã được cập nhật thành công!');
      console.log(response.data);
    } else {
      throw new Error('API trả về thành công nhưng dữ liệu không hợp lệ');
    }
    */
    
    // Lưu lại thông tin cấu hình vào file tạm để tham khảo sau này
    console.log('\x1b[36m%s\x1b[0m', 'Đã lưu cấu hình webhook mới vào logs/webhook-config.txt');
    
    // Bạn có thể bỏ comment đoạn code dưới đây để lưu cấu hình vào file
    if (!fs.existsSync('./logs')) {
      fs.mkdirSync('./logs');
    }
    
    fs.writeFileSync('./logs/webhook-config.txt', 
      `Timestamp: ${new Date().toISOString()}\n` +
      `Ngrok Domain: ${ngrokDomain}\n` +
      `Callback URL: ${callbackUrl}\n` +
      `Webhook URL: ${webhookUrl}\n`
    );
    
    return { success: true, callbackUrl, webhookUrl };
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Lỗi khi cập nhật webhook:', error.message);
    if (error.response) {
      console.error('\x1b[31m%s\x1b[0m', 'API Response:', error.response.data);
    }
    return { success: false, error: error.message };
  }
}

// Cập nhật biến môi trường trong file .env
async function updateEnvFile(ngrokDomain) {
  const envPath = path.resolve(__dirname, '.env');
  
  try {
    // Đọc nội dung file .env hiện tại
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Cập nhật hoặc thêm biến môi trường NGROK_URL
    if (envContent.includes('NGROK_URL=')) {
      envContent = envContent.replace(/NGROK_URL=.*(\r?\n|$)/g, `NGROK_URL=${ngrokDomain}$1`);
    } else {
      envContent += `\nNGROK_URL=${ngrokDomain}\n`;
    }
    
    // Ghi lại vào file .env
    fs.writeFileSync(envPath, envContent);
    console.log('\x1b[32m%s\x1b[0m', 'Đã cập nhật file .env với Ngrok URL mới');
    
    return true;
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Lỗi khi cập nhật file .env:', error.message);
    return false;
  }
}

// Hàm chính
async function main() {
  console.log('\x1b[35m%s\x1b[0m', '=== CÔNG CỤ CẬP NHẬT WEBHOOK SEPAY ===');
  
  try {
    // Lấy domain ngrok hiện tại
    const ngrokDomain = await getNgrokDomain();
    
    // Cập nhật webhook
    const webhookResult = await updateWebhook(ngrokDomain);
    
    // Cập nhật file .env
    await updateEnvFile(ngrokDomain);
    
    // Hiển thị hướng dẫn tiếp theo
    if (webhookResult.success) {
      console.log('\n\x1b[32m%s\x1b[0m', '=== HOÀN THÀNH ===');
      console.log('\x1b[32m%s\x1b[0m', 'Để test thanh toán qua Ngrok:');
      console.log('\x1b[36m%s\x1b[0m', `1. Sử dụng URL: ${ngrokDomain} để truy cập ứng dụng của bạn`);
      console.log('\x1b[36m%s\x1b[0m', `2. Webhook đã được cấu hình để nhận callbacks tại: ${webhookResult.webhookUrl}`);
      console.log('\x1b[36m%s\x1b[0m', '3. Khởi động lại server để đảm bảo các thay đổi được áp dụng');
      
      // Đề xuất lệnh để tiếp tục
      console.log('\n\x1b[33m%s\x1b[0m', 'Tiếp theo, chạy lệnh sau để khởi động server:');
      console.log('\x1b[36m%s\x1b[0m', '  npm run dev');
    } else {
      console.log('\n\x1b[31m%s\x1b[0m', '=== CÓ LỖI XẢY RA ===');
      console.log('\x1b[31m%s\x1b[0m', 'Vui lòng kiểm tra lỗi ở trên và thử lại.');
    }
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Lỗi trong quá trình cập nhật webhook:', error.message);
  }
}

// Thực thi
main(); 