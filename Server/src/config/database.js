/* eslint-disable no-undef */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
// Không cần fileURLToPath và dirname vì chúng ta không sử dụng __dirname

// Khởi tạo dotenv
dotenv.config();

// Hỗ trợ IPv4 first - giúp kết nối từ nhiều loại thiết bị
dns.setDefaultResultOrder('ipv4first');

// Lấy URI từ biến môi trường và Node.js global process
const URI = (typeof process !== 'undefined' ? 
  process.env.MONGODB_SUPER_SIMPLE_URI || process.env.MONGODB_MOBILE_URI || process.env.MONGODB_SINGLE_IP_URI || process.env.MONGODB_SIMPLE_URI || process.env.MONGODB_IP_URI || process.env.MONGODB_SRV_URI || process.env.MONGODB_DIRECT_URI || process.env.MONGOOSE_URI || process.env.MONGODB_URI || process.env.MONGODB_FALLBACK_URI : 
  undefined);

// Thêm tham số để cho phép kết nối từ mọi IP (0.0.0.0/0)
// Chuyển đổi URI để thêm tham số vào
const enhanceMongoURI = (uri) => {
  try {
    if (!uri) return uri;
    
    // Nếu URI đã có tham số, thêm retryWrites và tham số IP
    if (uri.includes('?')) {
      // Đã có tham số, thêm tham số mới nếu chưa có
      if (!uri.includes('retryWrites=true')) {
        uri += '&retryWrites=true';
      }
      if (!uri.includes('w=majority')) {
        uri += '&w=majority';
      }
      // Không thêm tls=true nữa vì có thể gây lỗi trên mobile
      
      // Chuyển đổi ssl=true thành tls=true chỉ khi là URI SRV
      if (uri.includes('mongodb+srv://') && uri.includes('ssl=true')) {
        uri = uri.replace('ssl=true', 'tls=true');
      }
      return uri;
    } else {
      // Chưa có tham số, thêm dấu ? và tham số mới
      return `${uri}?retryWrites=true&w=majority`;
    }
  } catch (err) {
    console.error("Error enhancing MongoDB URI:", err);
    return uri;
  }
};

// Nâng cao URI với các tham số quan trọng
const enhancedURI = enhanceMongoURI(URI);

// Options kết nối MongoDB tối ưu cho mọi loại thiết bị
const mongooseOptions = {
  serverSelectionTimeoutMS: 60000,
  socketTimeoutMS: 90000,
  connectTimeoutMS: 60000,
  retryWrites: true,
  retryReads: true,
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 60000,
  waitQueueTimeoutMS: 60000,
  heartbeatFrequencyMS: 10000,
  family: 4, // IPv4 
  // directConnection chỉ áp dụng cho URI kiểu SRV, không áp dụng cho IP URI trực tiếp
  directConnection: URI && URI.includes('mongodb+srv://'), 
  
  // Các tùy chọn bổ sung để bỏ qua xác minh IP nghiêm ngặt
  // Quan trọng cho thiết bị di động và mạng không cố định
  autoIndex: true,
  
  // Tùy chỉnh SSL/TLS dựa trên loại URI
  ...(URI && URI.includes('mongodb+srv://') ? {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true
  } : {}),
  
  // Các options này chỉ còn được dùng như aliases trong mongoose mới
  // nhưng giữ lại để đảm bảo tương thích
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Biến toàn cục theo dõi trạng thái kết nối
let isMongoConnected = false;
let connectionAttempts = 0;

// Lấy Node environment
const getNodeEnv = () => {
  return typeof process !== 'undefined' && process.env ? process.env.NODE_ENV || 'development' : 'development';
};

// Xử lý exit process an toàn
const safeExit = (code) => {
  if (typeof process !== 'undefined' && process.exit) {
    process.exit(code);
  }
};

// Custom resolver cho DNS - giúp giải quyết vấn đề không kết nối được từ mobile network
const setupCustomDNSResolver = async () => {
  try {
    // Thử làm rõ tên miền MongoDB
    if (URI && URI.includes('mongodb+srv://') && typeof process !== 'undefined') {
      const host = URI.split('@')[1].split('/')[0];
      try {
        // Thiết lập DNS servers thay thế (Google DNS và Cloudflare DNS)
        dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);
        
        // Thử giải quyết SRV record
        const lookupPromise = new Promise((resolve, reject) => {
          dns.lookup(host, (err, address) => {
            if (!err) {
              console.log(`MongoDB Host ${host} resolves to IP: ${address}`);
              resolve(address);
            } else {
              console.error(`DNS lookup failed for ${host}:`, err);
              reject(err);
            }
          });
        });
        
        // Chờ tối đa 5 giây cho DNS lookup
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('DNS lookup timeout')), 5000)
        );
        
        // Chạy với timeout
        const address = await Promise.race([lookupPromise, timeoutPromise]);
        
        // Nếu thành công và không có URI trực tiếp, tạo một URI trực tiếp
        if (address && !process.env.MONGODB_DIRECT_URI) {
          let username = '', password = '', database = '';
          
          // Parse URI để lấy thông tin xác thực và database
          if (URI.includes('@')) {
            const authPart = URI.split('@')[0].replace('mongodb+srv://', '');
            if (authPart.includes(':')) {
              [username, password] = authPart.split(':');
            }
          }
          
          if (URI.includes('/')) {
            const parts = URI.split('/');
            database = parts[parts.length - 1].split('?')[0];
          }
          
          // Tạo URI trực tiếp với địa chỉ IP đã resolve
          const directURI = `mongodb://${username}:${password}@${address}:27017/${database}?ssl=true&authSource=admin`;
          console.log(`Created direct URI using resolved IP: ${directURI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")}`);
          
          // Lưu lại để sử dụng sau này
          if (typeof process !== 'undefined') {
            process.env.MONGODB_RESOLVED_DIRECT_URI = directURI;
          }
        }
      } catch (dnsErr) {
        console.error('DNS resolution error:', dnsErr);
      }
    }
  } catch (error) {
    console.error('Error setting up custom DNS resolver:', error);
  }
};

// Gọi setupCustomDNSResolver để cải thiện kết nối - bây giờ là async
(async () => {
  try {
    await setupCustomDNSResolver();
  } catch (e) {
    console.error("Error in initial DNS setup:", e);
  }
})();

// Hàm kết nối MongoDB với khả năng thử lại
const connectWithRetry = async (retries = 5, delay = 5000) => {
  connectionAttempts++;
  console.log(`MongoDB Connection Attempt #${connectionAttempts}...`);
  
  // Kiểm tra DNS trước khi kết nối
  await setupCustomDNSResolver();
  
  // Lấy tất cả các URI có thể sử dụng
  const superSimpleURI = typeof process !== 'undefined' ? process.env.MONGODB_SUPER_SIMPLE_URI : undefined;
  const mobileURI = typeof process !== 'undefined' ? process.env.MONGODB_MOBILE_URI : undefined;
  const singleIpURI = typeof process !== 'undefined' ? process.env.MONGODB_SINGLE_IP_URI : undefined;
  const simpleURI = typeof process !== 'undefined' ? process.env.MONGODB_SIMPLE_URI : undefined;
  const ipURI = typeof process !== 'undefined' ? process.env.MONGODB_IP_URI : undefined;
  const srvURI = typeof process !== 'undefined' ? process.env.MONGODB_SRV_URI : undefined;
  const resolvedDirectURI = typeof process !== 'undefined' ? process.env.MONGODB_RESOLVED_DIRECT_URI : undefined;
  
  // Quyết định URI để kết nối theo thứ tự ưu tiên
  let uriToConnect = superSimpleURI || mobileURI || singleIpURI || simpleURI || ipURI || srvURI || resolvedDirectURI || enhancedURI;
  
  // Log thông tin kết nối để debug
  console.log(`Đang kết nối với MongoDB, loại URI: ${
    superSimpleURI ? 'Super Simple URI' :
    mobileURI ? 'Mobile URI' :
    singleIpURI ? 'Single IP URI' :
    simpleURI ? 'Simple URI' :
    ipURI ? 'IP trực tiếp' : 
    srvURI ? 'SRV URI' :
    resolvedDirectURI ? 'Resolved DNS' : 
    'SRV Standard'
  }`);
  
  // In thông tin device để debug
  console.log("Device info:", {
    platform: typeof process !== 'undefined' ? process.platform : 'unknown',
    arch: typeof process !== 'undefined' ? process.arch : 'unknown',
    node: typeof process !== 'undefined' ? process.version : 'unknown',
    mongooseVersion: mongoose.version
  });
  
  for (let i = 0; i < retries; i++) {
    try {
      // Chờ một chút trước khi thử lại nếu không phải lần đầu
      if (i > 0) {
        await new Promise(r => setTimeout(r, 2000));
      }
      
      // Hiển thị thông tin kết nối (che dấu thông tin nhạy cảm)
      console.log("Connecting to MongoDB with URI:", 
        uriToConnect ? uriToConnect.replace(/\/\/[^:]+:[^@]+@/, "//***:***@") : "URI is undefined");
      
      // Kết nối với URI đã được nâng cao
      await mongoose.connect(uriToConnect, mongooseOptions);
      
      console.log("MongoDB Connected Successfully!");
      console.log("Connection Info:", {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        dbName: mongoose.connection.name,
        readyState: mongoose.connection.readyState,
        usingDirectURI: !!resolvedDirectURI,
        usingIpURI: !!ipURI,
        env: getNodeEnv()
      });
      
      isMongoConnected = true;
      return mongoose.connection;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, err.name);
      
      if (err.name === "MongooseServerSelectionError") {
        console.error("Connection Details (obfuscated):", {
          uri: uriToConnect ? uriToConnect.replace(/\/\/[^:]+:[^@]+@/, "//***:***@") : "URI is undefined",
          message: err.message,
          reason: err.reason && err.reason.message ? err.reason.message : undefined,
          code: err.code
        });
        
        console.warn("⚠️ This error might be related to IP whitelist restrictions. Please update your MongoDB Atlas whitelist to include 0.0.0.0/0 or your current IP.");
        console.warn("⚠️ Hãy kiểm tra whitelist IP trong MongoDB Atlas và đảm bảo thêm địa chỉ IP của bạn hoặc 0.0.0.0/0 để cho phép tất cả kết nối.");
        
        // Thử sử dụng URI dự phòng nếu có
        const fallbackURI = typeof process !== 'undefined' ? 
          process.env.MONGODB_FALLBACK_URI : undefined;
        
        if (fallbackURI && fallbackURI !== URI) {
          console.log("Trying fallback URI...");
          const enhancedFallbackURI = enhanceMongoURI(fallbackURI);
          try {
            await mongoose.connect(enhancedFallbackURI, mongooseOptions);
            console.log("Connected successfully using fallback URI!");
            isMongoConnected = true;
            return mongoose.connection;
          } catch (fallbackErr) {
            console.error("Fallback connection failed:", fallbackErr.name);
          }
        }
      }

      if (i === retries - 1) {
        console.error("Max retries reached. Could not connect to MongoDB.");
        isMongoConnected = false;
        
        // Thử kết nối lại sau 5 phút
        setTimeout(() => {
          console.log("Attempting to reconnect to MongoDB after extended delay...");
          connectWithRetry(retries, delay);
        }, 300000);
        
        return null;
      }
      
      console.log(`Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return null;
};

// Các hàm xử lý sự kiện kết nối
const setupConnectionHandlers = () => {
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
    isMongoConnected = false;
    
    if (err.name === "MongooseServerSelectionError") {
      console.error("IP whitelist issue detected. Please check MongoDB Atlas IP whitelist settings.");
    }
  });

  mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected. Attempting to reconnect...");
    isMongoConnected = false;
    
    // Thử kết nối lại sau 10 giây khi bị ngắt kết nối
    setTimeout(() => connectWithRetry(), 10000);
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected successfully");
    isMongoConnected = true;
  });
  
  // Xử lý khi process kết thúc - chỉ thực hiện nếu process là định nghĩa
  if (typeof process !== 'undefined') {
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed due to app termination');
        safeExit(0);
      } catch (err) {
        console.error('Error during MongoDB connection closure:', err);
        safeExit(1);
      }
    });
  }
};

// Hàm kiểm tra trạng thái kết nối
const getConnectionStatus = () => {
  return {
    isConnected: isMongoConnected,
    readyState: mongoose.connection.readyState,
    connectionAttempts,
    host: mongoose.connection.host,
    dbName: mongoose.connection.name
  };
};

// Khởi tạo kết nối và thiết lập handlers
const initializeDatabase = async () => {
  setupConnectionHandlers();
  return connectWithRetry();
};

export { 
  initializeDatabase, 
  getConnectionStatus, 
  isMongoConnected,
  mongoose
}; 