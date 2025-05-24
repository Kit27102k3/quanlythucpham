import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Lấy URI từ biến môi trường
const URI = process.env.MONGODB_URI || process.env.MONGOOSE_URI;

// Thêm tham số để cho phép kết nối từ mọi IP (0.0.0.0/0)
// Chuyển đổi URI để thêm tham số vào
const enhanceMongoURI = (uri) => {
  try {
    if (!uri) return uri;
    
    // Nếu URI đã có tham số, thêm retryWrites và tham số IP
    if (uri.includes('?')) {
      // Đã có tham số, thêm tham số mới
      return `${uri}&retryWrites=true&w=majority`;
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
  family: 4,
  
  // Các tùy chọn bổ sung để bỏ qua xác minh IP nghiêm ngặt
  // Quan trọng cho thiết bị di động và mạng không cố định
  autoIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
};

// Biến toàn cục theo dõi trạng thái kết nối
let isMongoConnected = false;
let connectionAttempts = 0;

// Hàm kết nối MongoDB với khả năng thử lại
const connectWithRetry = async (retries = 5, delay = 5000) => {
  connectionAttempts++;
  console.log(`MongoDB Connection Attempt #${connectionAttempts}...`);
  
  for (let i = 0; i < retries; i++) {
    try {
      // Chờ một chút trước khi thử lại nếu không phải lần đầu
      if (i > 0) {
        await new Promise(r => setTimeout(r, 2000));
      }
      
      // Kết nối với URI đã được nâng cao
      await mongoose.connect(enhancedURI, mongooseOptions);
      
      console.log("MongoDB Connected Successfully!");
      console.log("Connection Info:", {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        dbName: mongoose.connection.name,
        readyState: mongoose.connection.readyState,
        env: process.env.NODE_ENV
      });
      
      isMongoConnected = true;
      return mongoose.connection;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, err.name);
      
      if (err.name === "MongooseServerSelectionError") {
        console.error("Connection Details (obfuscated):", {
          uri: enhancedURI ? enhancedURI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@") : "URI is undefined",
          message: err.message,
          reason: err.reason && err.reason.message ? err.reason.message : undefined,
          code: err.code
        });
        
        console.warn("⚠️ This error might be related to IP whitelist restrictions. Please update your MongoDB Atlas whitelist to include 0.0.0.0/0 or your current IP.");
        console.warn("⚠️ Hãy kiểm tra whitelist IP trong MongoDB Atlas và đảm bảo thêm địa chỉ IP của bạn hoặc 0.0.0.0/0 để cho phép tất cả kết nối.");
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
  
  // Xử lý khi process kết thúc
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