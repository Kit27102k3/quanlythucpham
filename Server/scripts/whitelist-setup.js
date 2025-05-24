import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Lấy đường dẫn hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Nếu có thêm file .env.local, load nó
const localEnvPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(localEnvPath)) {
  const localEnvConfig = dotenv.config({ path: localEnvPath });
  console.log('Loaded local environment variables');
}

// Thay thế các giá trị này bằng thông tin từ tài khoản MongoDB Atlas của bạn
const MONGODB_ATLAS_PROJECT_ID = process.env.MONGODB_ATLAS_PROJECT_ID || ''; // Lấy từ URL Atlas
const MONGODB_ATLAS_API_KEY = process.env.MONGODB_ATLAS_API_KEY || '';
const MONGODB_ATLAS_API_SECRET = process.env.MONGODB_ATLAS_API_SECRET || '';
const CLUSTER_NAME = process.env.MONGODB_CLUSTER_NAME || 'Cluster0';

// Kiểm tra thông tin cấu hình
if (!MONGODB_ATLAS_PROJECT_ID || !MONGODB_ATLAS_API_KEY || !MONGODB_ATLAS_API_SECRET) {
  console.error('Thiếu thông tin cấu hình MongoDB Atlas. Vui lòng cung cấp đầy đủ thông tin trong file .env');
  console.log('MONGODB_ATLAS_PROJECT_ID, MONGODB_ATLAS_API_KEY, và MONGODB_ATLAS_API_SECRET là bắt buộc');
  process.exit(1);
}

// Hàm lấy địa chỉ IP công cộng của máy hiện tại
async function getPublicIP() {
  try {
    // Sử dụng nhiều dịch vụ khác nhau để đảm bảo có thể lấy được IP
    const services = [
      'https://api.ipify.org?format=json',
      'https://api.myip.com',
      'https://api.ip.sb/jsonip',
      'https://api.ipify.org',
      'https://icanhazip.com'
    ];
    
    for (const service of services) {
      try {
        console.log(`Đang thử lấy IP từ dịch vụ: ${service}`);
        let response;
        
        if (service.includes('json')) {
          response = await axios.get(service);
          // Kiểm tra xem response có phải là JSON và có chứa IP hay không
          if (response.data && (response.data.ip || response.data.IP)) {
            return response.data.ip || response.data.IP;
          }
        } else {
          response = await axios.get(service, { transformResponse: [] });
          // Dịch vụ trả về chỉ IP dưới dạng text
          if (response.data) {
            const ip = response.data.trim();
            console.log(`IP được lấy: ${ip}`);
            return ip;
          }
        }
      } catch (err) {
        console.error(`Không thể lấy IP từ dịch vụ ${service}:`, err.message);
      }
    }
    
    throw new Error('Không thể lấy địa chỉ IP công cộng từ bất kỳ dịch vụ nào');
  } catch (error) {
    console.error('Lỗi khi lấy địa chỉ IP:', error.message);
    // Trả về IP mặc định trong trường hợp lỗi
    return '0.0.0.0';
  }
}

// Hàm thêm địa chỉ IP vào danh sách cho phép của MongoDB Atlas
async function addIPToWhitelist(ip) {
  try {
    // API endpoint để cấu hình IP whitelist
    const url = `https://cloud.mongodb.com/api/atlas/v1.0/groups/${MONGODB_ATLAS_PROJECT_ID}/whitelist`;
    
    // Thông tin xác thực Basic Auth
    const auth = {
      username: MONGODB_ATLAS_API_KEY,
      password: MONGODB_ATLAS_API_SECRET
    };
    
    // Dữ liệu cần gửi
    const data = {
      ipAddress: ip,
      comment: 'Auto-added by setup script'
    };
    
    console.log(`Đang thêm IP ${ip} vào whitelist...`);
    
    // Gửi yêu cầu POST đến API Atlas
    const response = await axios.post(url, data, { auth });
    
    if (response.status === 201) {
      console.log(`✅ Thành công: Đã thêm IP ${ip} vào whitelist!`);
      return true;
    } else {
      console.log(`❌ Không thành công. Trạng thái: ${response.status}`);
      console.log(response.data);
      return false;
    }
  } catch (error) {
    console.error('Lỗi khi thêm IP vào whitelist:', error.message);
    if (error.response) {
      console.error('Chi tiết lỗi:', error.response.data);
    }
    return false;
  }
}

// Hàm thêm cho phép truy cập từ mọi nơi (0.0.0.0/0)
async function addAllowAllIPs() {
  try {
    // API endpoint để cấu hình IP whitelist
    const url = `https://cloud.mongodb.com/api/atlas/v1.0/groups/${MONGODB_ATLAS_PROJECT_ID}/whitelist`;
    
    // Thông tin xác thực Basic Auth
    const auth = {
      username: MONGODB_ATLAS_API_KEY,
      password: MONGODB_ATLAS_API_SECRET
    };
    
    // Dữ liệu cần gửi
    const data = {
      cidrBlock: '0.0.0.0/0',
      comment: 'Allow access from anywhere - CAUTION: This is less secure'
    };
    
    console.log(`Đang thêm CIDR 0.0.0.0/0 vào whitelist để cho phép tất cả IP...`);
    
    // Gửi yêu cầu POST đến API Atlas
    const response = await axios.post(url, data, { auth });
    
    if (response.status === 201) {
      console.log(`✅ Thành công: Đã cho phép kết nối từ tất cả các IP!`);
      return true;
    } else {
      console.log(`❌ Không thành công. Trạng thái: ${response.status}`);
      console.log(response.data);
      return false;
    }
  } catch (error) {
    console.error('Lỗi khi cấu hình cho phép tất cả IP:', error.message);
    if (error.response) {
      console.error('Chi tiết lỗi:', error.response.data);
    }
    return false;
  }
}

// Hàm chính để chạy
async function main() {
  console.log('====== CÔNG CỤ CẤU HÌNH IP WHITELIST CHO MONGODB ATLAS ======');
  
  // Nếu chỉ muốn thêm IP hiện tại
  const publicIP = await getPublicIP();
  if (publicIP) {
    console.log(`Địa chỉ IP công cộng của bạn là: ${publicIP}`);
    await addIPToWhitelist(publicIP);
  }
  
  // Cho phép kết nối từ tất cả các IP (0.0.0.0/0)
  console.log('\nĐang cấu hình cho phép kết nối từ mọi IP...');
  await addAllowAllIPs();
  
  console.log('\n===== HOÀN THÀNH =====');
  console.log('Bạn có thể kiểm tra cấu hình IP whitelist trong MongoDB Atlas');
  console.log(`URL: https://cloud.mongodb.com/v2/${MONGODB_ATLAS_PROJECT_ID}#/security/network/accessList`);
}

// Chạy hàm chính
main().catch(err => {
  console.error('Lỗi trong quá trình thực thi:', err);
  process.exit(1);
}); 