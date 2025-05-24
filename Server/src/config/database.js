/* eslint-disable no-undef */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
// Không cần fileURLToPath và dirname vì chúng ta không sử dụng __dirname

// Khởi tạo dotenv
dotenv.config({path: '.env'});

// Hỗ trợ IPv4 first - giúp kết nối từ nhiều loại thiết bị
dns.setDefaultResultOrder('ipv4first');

// Biến toàn cục theo dõi trạng thái kết nối
let isMongoConnected = false;
let connectionAttempts = 0;
let currentUri = null;

// Lấy Node environment
const getNodeEnv = () => {
  return typeof process !== 'undefined' && process.env ? process.env.NODE_ENV || 'development' : 'development';
};

// Kiểm tra xem thiết bị có phải là thiết bị di động không
const isMobileDevice = () => {
  // Kiểm tra UserAgent nếu đang chạy trong môi trường có window
  if (typeof window !== 'undefined' && window.navigator) {
    const ua = window.navigator.userAgent;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  }
  
  // Nếu không có window, kiểm tra biến môi trường
  if (typeof process !== 'undefined' && process.env) {
    return process.env.IS_MOBILE === 'true';
  }
  
  return false;
};

// Hàm khởi tạo cơ sở dữ liệu
const initializeDatabase = async () => {
  // Thiết lập các handlers xử lý sự kiện kết nối
  setupConnectionHandlers();
  
  // Reset Mongoose
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.close();
      console.log("Đã đóng kết nối cũ để khởi tạo mới");
    } catch (err) {
      console.error("Lỗi khi đóng kết nối cũ:", err);
    }
  }
  
  // Kết nối với MongoDB
  return await connectWithRetry();
};

// Lấy URI phù hợp nhất cho kết nối
const getBestMongoURI = () => {
  if (typeof process === 'undefined' || !process.env) return null;
  
  // Quyết định URI theo device type
  if (isMobileDevice()) {
    // Cho thiết bị di động, ưu tiên các URI trực tiếp bằng IP
    return process.env.MONGODB_IP_URI || 
           process.env.MONGODB_SINGLE_IP_URI || 
           process.env.MONGODB_DIRECT_URI || 
           process.env.MONGODB_MOBILE_URI || 
           process.env.MONGODB_SUPER_SIMPLE_URI || 
           process.env.MONGODB_SRV_URI || 
           process.env.MONGODB_FALLBACK_URI;
  } else {
    // Cho thiết bị thông thường
    return process.env.MONGODB_IP_URI || 
           process.env.MONGODB_SINGLE_IP_URI || 
           process.env.MONGODB_SUPER_SIMPLE_URI || 
           process.env.MONGODB_SRV_URI || 
           process.env.MONGODB_DIRECT_URI || 
           process.env.MONGODB_MOBILE_URI || 
           process.env.MONGODB_FALLBACK_URI;
  }
};

// Hàm kết nối MongoDB với khả năng thử lại
const connectWithRetry = async (retries = 5, delay = 5000) => {
  connectionAttempts++;
  console.log(`MongoDB Connection Attempt #${connectionAttempts}...`);
  
  // Đảm bảo đóng kết nối cũ nếu có
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.close();
      console.log("Đã đóng kết nối cũ trước khi kết nối lại");
    } catch (err) {
      console.error("Lỗi khi đóng kết nối cũ:", err);
    }
  }
  
  // Lấy URI tốt nhất
  const uriToConnect = getBestMongoURI();
  
  if (!uriToConnect) {
    console.error("Không tìm thấy URI MongoDB hợp lệ trong biến môi trường");
    isMongoConnected = false;
    return null;
  }
  
  // Lưu URI hiện tại
  currentUri = uriToConnect;
  
  // Log thông tin kết nối để debug
  const uriType = 
    uriToConnect === process.env.MONGODB_IP_URI ? 'IP URI' :
    uriToConnect === process.env.MONGODB_SINGLE_IP_URI ? 'Single IP URI' :
    uriToConnect === process.env.MONGODB_DIRECT_URI ? 'Direct URI' :
    uriToConnect === process.env.MONGODB_MOBILE_URI ? 'Mobile URI' :
    uriToConnect === process.env.MONGODB_SUPER_SIMPLE_URI ? 'Super Simple URI' :
    uriToConnect === process.env.MONGODB_SRV_URI ? 'SRV URI' :
    'Other URI';
  
  console.log(`Đang kết nối với MongoDB, loại URI: ${uriType}`);
  
  // In thông tin device để debug
  console.log("Device info:", {
    platform: typeof process !== 'undefined' ? process.platform : 'unknown',
    arch: typeof process !== 'undefined' ? process.arch : 'unknown',
    node: typeof process !== 'undefined' ? process.version : 'unknown',
    mongooseVersion: mongoose.version,
    isMobile: isMobileDevice()
  });
  
  // Options kết nối MongoDB tối ưu
  const mongooseOptions = {
    serverSelectionTimeoutMS: 60000,
    socketTimeoutMS: 90000,
    connectTimeoutMS: 60000,
    maxPoolSize: 50,
    family: 4, // IPv4
    autoIndex: true,
    // Tùy chỉnh SSL/TLS dựa trên loại URI
    ...(uriToConnect.includes('mongodb+srv://') ? {
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true
    } : {
      ssl: true
    })
  };
  
  for (let i = 0; i < retries; i++) {
    try {
      // Chờ một chút trước khi thử lại nếu không phải lần đầu
      if (i > 0) {
        await new Promise(r => setTimeout(r, delay));
      }
      
      // Hiển thị thông tin kết nối (che dấu thông tin nhạy cảm)
      console.log("Connecting to MongoDB with URI:", 
        uriToConnect ? uriToConnect.replace(/\/\/[^:]+:[^@]+@/, "//***:***@") : "URI is undefined");
      
      // Kết nối với MongoDB
      await mongoose.connect(uriToConnect, mongooseOptions);
      
      console.log("MongoDB Connected Successfully!");
      console.log("Connection Info:", {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        dbName: mongoose.connection.name,
        readyState: mongoose.connection.readyState
      });
      
      isMongoConnected = true;
      return mongoose.connection;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, err.name);
      console.error("Error details:", err.message);
      
      // Nếu đã thử tất cả các lần và vẫn thất bại
      if (i === retries - 1) {
        console.error(`Failed to connect to MongoDB after ${retries} attempts.`);
        console.log("The server will continue to run without database connection.");
        isMongoConnected = false;
      }
    }
  }
  
  return null;
};

// Lấy trạng thái kết nối
const getConnectionStatus = () => {
  return {
    isConnected: isMongoConnected,
    readyState: mongoose.connection ? mongoose.connection.readyState : 0,
    dbName: mongoose.connection ? mongoose.connection.name : null,
    host: mongoose.connection ? mongoose.connection.host : null,
    uriType: currentUri ? 
      (currentUri.includes('mongodb+srv://') ? 'SRV URI' : 
       currentUri.includes('27018') ? 'Single IP URI' :
       currentUri.includes('27017') ? 'IP URI' : 'Other URI') : 'None'
  };
};

// Các hàm xử lý sự kiện kết nối
const setupConnectionHandlers = () => {
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
    isMongoConnected = false;
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
  
  // Xử lý khi process kết thúc
  if (typeof process !== 'undefined') {
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed due to app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB connection closure:', err);
        process.exit(1);
      }
    });
  }
};

export { 
  initializeDatabase, 
  getConnectionStatus, 
  isMongoConnected,
  mongoose
}; 