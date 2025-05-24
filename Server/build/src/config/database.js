"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.isMongoConnected = exports.initializeDatabase = exports.getConnectionStatus = void 0;Object.defineProperty(exports, "mongoose", { enumerable: true, get: function () {return _mongoose.default;} });
var _mongoose = _interopRequireDefault(require("mongoose"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _dns = _interopRequireDefault(require("dns"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };} /* eslint-disable no-undef */
// Không cần fileURLToPath và dirname vì chúng ta không sử dụng __dirname

// Khởi tạo dotenv
_dotenv.default.config();

// Hỗ trợ IPv4 first - giúp kết nối từ nhiều loại thiết bị
_dns.default.setDefaultResultOrder('ipv4first');

// Lấy URI từ biến môi trường và Node.js global process
const URI = typeof process !== 'undefined' ?
process.env.MONGODB_SUPER_SIMPLE_URI || process.env.MONGODB_MOBILE_URI || process.env.MONGODB_SINGLE_IP_URI || process.env.MONGODB_SIMPLE_URI || process.env.MONGODB_IP_URI || process.env.MONGODB_SRV_URI || process.env.MONGODB_DIRECT_URI || process.env.MONGOOSE_URI || process.env.MONGODB_URI || process.env.MONGODB_FALLBACK_URI :
undefined;

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
  useUnifiedTopology: true
};

// Biến toàn cục theo dõi trạng thái kết nối
let isMongoConnected = exports.isMongoConnected = false;
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
        _dns.default.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);

        // Thử giải quyết SRV record
        const lookupPromise = new Promise((resolve, reject) => {
          _dns.default.lookup(host, (err, address) => {
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
          let username = '',password = '',database = '';

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
  'SRV Standard'}`
  );

  // In thông tin device để debug
  console.log("Device info:", {
    platform: typeof process !== 'undefined' ? process.platform : 'unknown',
    arch: typeof process !== 'undefined' ? process.arch : 'unknown',
    node: typeof process !== 'undefined' ? process.version : 'unknown',
    mongooseVersion: _mongoose.default.version
  });

  for (let i = 0; i < retries; i++) {
    try {
      // Chờ một chút trước khi thử lại nếu không phải lần đầu
      if (i > 0) {
        await new Promise((r) => setTimeout(r, 2000));
      }

      // Hiển thị thông tin kết nối (che dấu thông tin nhạy cảm)
      console.log("Connecting to MongoDB with URI:",
      uriToConnect ? uriToConnect.replace(/\/\/[^:]+:[^@]+@/, "//***:***@") : "URI is undefined");

      // Kết nối với URI đã được nâng cao
      await _mongoose.default.connect(uriToConnect, mongooseOptions);

      console.log("MongoDB Connected Successfully!");
      console.log("Connection Info:", {
        host: _mongoose.default.connection.host,
        port: _mongoose.default.connection.port,
        dbName: _mongoose.default.connection.name,
        readyState: _mongoose.default.connection.readyState,
        usingDirectURI: !!resolvedDirectURI,
        usingIpURI: !!ipURI,
        env: getNodeEnv()
      });

      exports.isMongoConnected = isMongoConnected = true;
      return _mongoose.default.connection;
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
            await _mongoose.default.connect(enhancedFallbackURI, mongooseOptions);
            console.log("Connected successfully using fallback URI!");
            exports.isMongoConnected = isMongoConnected = true;
            return _mongoose.default.connection;
          } catch (fallbackErr) {
            console.error("Fallback connection failed:", fallbackErr.name);
          }
        }
      }

      if (i === retries - 1) {
        console.error("Max retries reached. Could not connect to MongoDB.");
        exports.isMongoConnected = isMongoConnected = false;

        // Thử kết nối lại sau 5 phút
        setTimeout(() => {
          console.log("Attempting to reconnect to MongoDB after extended delay...");
          connectWithRetry(retries, delay);
        }, 300000);

        return null;
      }

      console.log(`Retrying in ${delay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return null;
};

// Các hàm xử lý sự kiện kết nối
const setupConnectionHandlers = () => {
  _mongoose.default.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
    exports.isMongoConnected = isMongoConnected = false;

    if (err.name === "MongooseServerSelectionError") {
      console.error("IP whitelist issue detected. Please check MongoDB Atlas IP whitelist settings.");
    }
  });

  _mongoose.default.connection.on("disconnected", () => {
    console.log("MongoDB disconnected. Attempting to reconnect...");
    exports.isMongoConnected = isMongoConnected = false;

    // Thử kết nối lại sau 10 giây khi bị ngắt kết nối
    setTimeout(() => connectWithRetry(), 10000);
  });

  _mongoose.default.connection.on("reconnected", () => {
    console.log("MongoDB reconnected successfully");
    exports.isMongoConnected = isMongoConnected = true;
  });

  // Xử lý khi process kết thúc - chỉ thực hiện nếu process là định nghĩa
  if (typeof process !== 'undefined') {
    process.on('SIGINT', async () => {
      try {
        await _mongoose.default.connection.close();
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
    readyState: _mongoose.default.connection.readyState,
    connectionAttempts,
    host: _mongoose.default.connection.host,
    dbName: _mongoose.default.connection.name
  };
};

// Khởi tạo kết nối và thiết lập handlers
exports.getConnectionStatus = getConnectionStatus;const initializeDatabase = async () => {
  setupConnectionHandlers();
  return connectWithRetry();
};exports.initializeDatabase = initializeDatabase;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfbW9uZ29vc2UiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9kb3RlbnYiLCJfZG5zIiwiZSIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwiZG90ZW52IiwiY29uZmlnIiwiZG5zIiwic2V0RGVmYXVsdFJlc3VsdE9yZGVyIiwiVVJJIiwicHJvY2VzcyIsImVudiIsIk1PTkdPREJfU1VQRVJfU0lNUExFX1VSSSIsIk1PTkdPREJfTU9CSUxFX1VSSSIsIk1PTkdPREJfU0lOR0xFX0lQX1VSSSIsIk1PTkdPREJfU0lNUExFX1VSSSIsIk1PTkdPREJfSVBfVVJJIiwiTU9OR09EQl9TUlZfVVJJIiwiTU9OR09EQl9ESVJFQ1RfVVJJIiwiTU9OR09PU0VfVVJJIiwiTU9OR09EQl9VUkkiLCJNT05HT0RCX0ZBTExCQUNLX1VSSSIsInVuZGVmaW5lZCIsImVuaGFuY2VNb25nb1VSSSIsInVyaSIsImluY2x1ZGVzIiwicmVwbGFjZSIsImVyciIsImNvbnNvbGUiLCJlcnJvciIsImVuaGFuY2VkVVJJIiwibW9uZ29vc2VPcHRpb25zIiwic2VydmVyU2VsZWN0aW9uVGltZW91dE1TIiwic29ja2V0VGltZW91dE1TIiwiY29ubmVjdFRpbWVvdXRNUyIsInJldHJ5V3JpdGVzIiwicmV0cnlSZWFkcyIsIm1heFBvb2xTaXplIiwibWluUG9vbFNpemUiLCJtYXhJZGxlVGltZU1TIiwid2FpdFF1ZXVlVGltZW91dE1TIiwiaGVhcnRiZWF0RnJlcXVlbmN5TVMiLCJmYW1pbHkiLCJkaXJlY3RDb25uZWN0aW9uIiwiYXV0b0luZGV4IiwidGxzIiwidGxzQWxsb3dJbnZhbGlkQ2VydGlmaWNhdGVzIiwidGxzQWxsb3dJbnZhbGlkSG9zdG5hbWVzIiwidXNlTmV3VXJsUGFyc2VyIiwidXNlVW5pZmllZFRvcG9sb2d5IiwiaXNNb25nb0Nvbm5lY3RlZCIsImV4cG9ydHMiLCJjb25uZWN0aW9uQXR0ZW1wdHMiLCJnZXROb2RlRW52IiwiTk9ERV9FTlYiLCJzYWZlRXhpdCIsImNvZGUiLCJleGl0Iiwic2V0dXBDdXN0b21ETlNSZXNvbHZlciIsImhvc3QiLCJzcGxpdCIsInNldFNlcnZlcnMiLCJsb29rdXBQcm9taXNlIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJsb29rdXAiLCJhZGRyZXNzIiwibG9nIiwidGltZW91dFByb21pc2UiLCJfIiwic2V0VGltZW91dCIsIkVycm9yIiwicmFjZSIsInVzZXJuYW1lIiwicGFzc3dvcmQiLCJkYXRhYmFzZSIsImF1dGhQYXJ0IiwicGFydHMiLCJsZW5ndGgiLCJkaXJlY3RVUkkiLCJNT05HT0RCX1JFU09MVkVEX0RJUkVDVF9VUkkiLCJkbnNFcnIiLCJjb25uZWN0V2l0aFJldHJ5IiwicmV0cmllcyIsImRlbGF5Iiwic3VwZXJTaW1wbGVVUkkiLCJtb2JpbGVVUkkiLCJzaW5nbGVJcFVSSSIsInNpbXBsZVVSSSIsImlwVVJJIiwic3J2VVJJIiwicmVzb2x2ZWREaXJlY3RVUkkiLCJ1cmlUb0Nvbm5lY3QiLCJwbGF0Zm9ybSIsImFyY2giLCJub2RlIiwidmVyc2lvbiIsIm1vbmdvb3NlVmVyc2lvbiIsIm1vbmdvb3NlIiwiaSIsInIiLCJjb25uZWN0IiwiY29ubmVjdGlvbiIsInBvcnQiLCJkYk5hbWUiLCJuYW1lIiwicmVhZHlTdGF0ZSIsInVzaW5nRGlyZWN0VVJJIiwidXNpbmdJcFVSSSIsIm1lc3NhZ2UiLCJyZWFzb24iLCJ3YXJuIiwiZmFsbGJhY2tVUkkiLCJlbmhhbmNlZEZhbGxiYWNrVVJJIiwiZmFsbGJhY2tFcnIiLCJzZXR1cENvbm5lY3Rpb25IYW5kbGVycyIsIm9uIiwiY2xvc2UiLCJnZXRDb25uZWN0aW9uU3RhdHVzIiwiaXNDb25uZWN0ZWQiLCJpbml0aWFsaXplRGF0YWJhc2UiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29uZmlnL2RhdGFiYXNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIG5vLXVuZGVmICovXHJcbmltcG9ydCBtb25nb29zZSBmcm9tICdtb25nb29zZSc7XHJcbmltcG9ydCBkb3RlbnYgZnJvbSAnZG90ZW52JztcclxuaW1wb3J0IGRucyBmcm9tICdkbnMnO1xyXG4vLyBLaMO0bmcgY+G6p24gZmlsZVVSTFRvUGF0aCB2w6AgZGlybmFtZSB2w6wgY2jDum5nIHRhIGtow7RuZyBz4butIGThu6VuZyBfX2Rpcm5hbWVcclxuXHJcbi8vIEto4bufaSB04bqhbyBkb3RlbnZcclxuZG90ZW52LmNvbmZpZygpO1xyXG5cclxuLy8gSOG7lyB0cuG7oyBJUHY0IGZpcnN0IC0gZ2nDunAga+G6v3QgbuG7kWkgdOG7qyBuaGnhu4F1IGxv4bqhaSB0aGnhur90IGLhu4tcclxuZG5zLnNldERlZmF1bHRSZXN1bHRPcmRlcignaXB2NGZpcnN0Jyk7XHJcblxyXG4vLyBM4bqleSBVUkkgdOG7qyBiaeG6v24gbcO0aSB0csaw4budbmcgdsOgIE5vZGUuanMgZ2xvYmFsIHByb2Nlc3NcclxuY29uc3QgVVJJID0gKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyA/IFxyXG4gIHByb2Nlc3MuZW52Lk1PTkdPREJfU1VQRVJfU0lNUExFX1VSSSB8fCBwcm9jZXNzLmVudi5NT05HT0RCX01PQklMRV9VUkkgfHwgcHJvY2Vzcy5lbnYuTU9OR09EQl9TSU5HTEVfSVBfVVJJIHx8IHByb2Nlc3MuZW52Lk1PTkdPREJfU0lNUExFX1VSSSB8fCBwcm9jZXNzLmVudi5NT05HT0RCX0lQX1VSSSB8fCBwcm9jZXNzLmVudi5NT05HT0RCX1NSVl9VUkkgfHwgcHJvY2Vzcy5lbnYuTU9OR09EQl9ESVJFQ1RfVVJJIHx8IHByb2Nlc3MuZW52Lk1PTkdPT1NFX1VSSSB8fCBwcm9jZXNzLmVudi5NT05HT0RCX1VSSSB8fCBwcm9jZXNzLmVudi5NT05HT0RCX0ZBTExCQUNLX1VSSSA6IFxyXG4gIHVuZGVmaW5lZCk7XHJcblxyXG4vLyBUaMOqbSB0aGFtIHPhu5EgxJHhu4MgY2hvIHBow6lwIGvhur90IG7hu5FpIHThu6sgbeG7jWkgSVAgKDAuMC4wLjAvMClcclxuLy8gQ2h1eeG7g24gxJHhu5VpIFVSSSDEkeG7gyB0aMOqbSB0aGFtIHPhu5EgdsOgb1xyXG5jb25zdCBlbmhhbmNlTW9uZ29VUkkgPSAodXJpKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGlmICghdXJpKSByZXR1cm4gdXJpO1xyXG4gICAgXHJcbiAgICAvLyBO4bq/dSBVUkkgxJHDoyBjw7MgdGhhbSBz4buRLCB0aMOqbSByZXRyeVdyaXRlcyB2w6AgdGhhbSBz4buRIElQXHJcbiAgICBpZiAodXJpLmluY2x1ZGVzKCc/JykpIHtcclxuICAgICAgLy8gxJDDoyBjw7MgdGhhbSBz4buRLCB0aMOqbSB0aGFtIHPhu5EgbeG7m2kgbuG6v3UgY2jGsGEgY8OzXHJcbiAgICAgIGlmICghdXJpLmluY2x1ZGVzKCdyZXRyeVdyaXRlcz10cnVlJykpIHtcclxuICAgICAgICB1cmkgKz0gJyZyZXRyeVdyaXRlcz10cnVlJztcclxuICAgICAgfVxyXG4gICAgICBpZiAoIXVyaS5pbmNsdWRlcygndz1tYWpvcml0eScpKSB7XHJcbiAgICAgICAgdXJpICs9ICcmdz1tYWpvcml0eSc7XHJcbiAgICAgIH1cclxuICAgICAgLy8gS2jDtG5nIHRow6ptIHRscz10cnVlIG7hu69hIHbDrCBjw7MgdGjhu4MgZ8OieSBs4buXaSB0csOqbiBtb2JpbGVcclxuICAgICAgXHJcbiAgICAgIC8vIENodXnhu4NuIMSR4buVaSBzc2w9dHJ1ZSB0aMOgbmggdGxzPXRydWUgY2jhu4kga2hpIGzDoCBVUkkgU1JWXHJcbiAgICAgIGlmICh1cmkuaW5jbHVkZXMoJ21vbmdvZGIrc3J2Oi8vJykgJiYgdXJpLmluY2x1ZGVzKCdzc2w9dHJ1ZScpKSB7XHJcbiAgICAgICAgdXJpID0gdXJpLnJlcGxhY2UoJ3NzbD10cnVlJywgJ3Rscz10cnVlJyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHVyaTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIENoxrBhIGPDsyB0aGFtIHPhu5EsIHRow6ptIGThuqV1ID8gdsOgIHRoYW0gc+G7kSBt4bubaVxyXG4gICAgICByZXR1cm4gYCR7dXJpfT9yZXRyeVdyaXRlcz10cnVlJnc9bWFqb3JpdHlgO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGVuaGFuY2luZyBNb25nb0RCIFVSSTpcIiwgZXJyKTtcclxuICAgIHJldHVybiB1cmk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gTsOibmcgY2FvIFVSSSB24bubaSBjw6FjIHRoYW0gc+G7kSBxdWFuIHRy4buNbmdcclxuY29uc3QgZW5oYW5jZWRVUkkgPSBlbmhhbmNlTW9uZ29VUkkoVVJJKTtcclxuXHJcbi8vIE9wdGlvbnMga+G6v3QgbuG7kWkgTW9uZ29EQiB04buRaSDGsHUgY2hvIG3hu41pIGxv4bqhaSB0aGnhur90IGLhu4tcclxuY29uc3QgbW9uZ29vc2VPcHRpb25zID0ge1xyXG4gIHNlcnZlclNlbGVjdGlvblRpbWVvdXRNUzogNjAwMDAsXHJcbiAgc29ja2V0VGltZW91dE1TOiA5MDAwMCxcclxuICBjb25uZWN0VGltZW91dE1TOiA2MDAwMCxcclxuICByZXRyeVdyaXRlczogdHJ1ZSxcclxuICByZXRyeVJlYWRzOiB0cnVlLFxyXG4gIG1heFBvb2xTaXplOiA1MCxcclxuICBtaW5Qb29sU2l6ZTogMTAsXHJcbiAgbWF4SWRsZVRpbWVNUzogNjAwMDAsXHJcbiAgd2FpdFF1ZXVlVGltZW91dE1TOiA2MDAwMCxcclxuICBoZWFydGJlYXRGcmVxdWVuY3lNUzogMTAwMDAsXHJcbiAgZmFtaWx5OiA0LCAvLyBJUHY0IFxyXG4gIC8vIGRpcmVjdENvbm5lY3Rpb24gY2jhu4kgw6FwIGThu6VuZyBjaG8gVVJJIGtp4buDdSBTUlYsIGtow7RuZyDDoXAgZOG7pW5nIGNobyBJUCBVUkkgdHLhu7FjIHRp4bq/cFxyXG4gIGRpcmVjdENvbm5lY3Rpb246IFVSSSAmJiBVUkkuaW5jbHVkZXMoJ21vbmdvZGIrc3J2Oi8vJyksIFxyXG4gIFxyXG4gIC8vIEPDoWMgdMO5eSBjaOG7jW4gYuG7lSBzdW5nIMSR4buDIGLhu48gcXVhIHjDoWMgbWluaCBJUCBuZ2hpw6ptIG5n4bq3dFxyXG4gIC8vIFF1YW4gdHLhu41uZyBjaG8gdGhp4bq/dCBi4buLIGRpIMSR4buZbmcgdsOgIG3huqFuZyBraMO0bmcgY+G7kSDEkeG7i25oXHJcbiAgYXV0b0luZGV4OiB0cnVlLFxyXG4gIFxyXG4gIC8vIFTDuXkgY2jhu4luaCBTU0wvVExTIGThu7FhIHRyw6puIGxv4bqhaSBVUklcclxuICAuLi4oVVJJICYmIFVSSS5pbmNsdWRlcygnbW9uZ29kYitzcnY6Ly8nKSA/IHtcclxuICAgIHRsczogdHJ1ZSxcclxuICAgIHRsc0FsbG93SW52YWxpZENlcnRpZmljYXRlczogdHJ1ZSxcclxuICAgIHRsc0FsbG93SW52YWxpZEhvc3RuYW1lczogdHJ1ZVxyXG4gIH0gOiB7fSksXHJcbiAgXHJcbiAgLy8gQ8OhYyBvcHRpb25zIG7DoHkgY2jhu4kgY8OybiDEkcaw4bujYyBkw7luZyBuaMawIGFsaWFzZXMgdHJvbmcgbW9uZ29vc2UgbeG7m2lcclxuICAvLyBuaMawbmcgZ2nhu68gbOG6oWkgxJHhu4MgxJHhuqNtIGLhuqNvIHTGsMahbmcgdGjDrWNoXHJcbiAgdXNlTmV3VXJsUGFyc2VyOiB0cnVlLFxyXG4gIHVzZVVuaWZpZWRUb3BvbG9neTogdHJ1ZSxcclxufTtcclxuXHJcbi8vIEJp4bq/biB0b8OgbiBj4bulYyB0aGVvIGTDtWkgdHLhuqFuZyB0aMOhaSBr4bq/dCBu4buRaVxyXG5sZXQgaXNNb25nb0Nvbm5lY3RlZCA9IGZhbHNlO1xyXG5sZXQgY29ubmVjdGlvbkF0dGVtcHRzID0gMDtcclxuXHJcbi8vIEzhuqV5IE5vZGUgZW52aXJvbm1lbnRcclxuY29uc3QgZ2V0Tm9kZUVudiA9ICgpID0+IHtcclxuICByZXR1cm4gdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHByb2Nlc3MuZW52ID8gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgfHwgJ2RldmVsb3BtZW50JyA6ICdkZXZlbG9wbWVudCc7XHJcbn07XHJcblxyXG4vLyBY4butIGzDvSBleGl0IHByb2Nlc3MgYW4gdG/DoG5cclxuY29uc3Qgc2FmZUV4aXQgPSAoY29kZSkgPT4ge1xyXG4gIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgcHJvY2Vzcy5leGl0KSB7XHJcbiAgICBwcm9jZXNzLmV4aXQoY29kZSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gQ3VzdG9tIHJlc29sdmVyIGNobyBETlMgLSBnacO6cCBnaeG6o2kgcXV54bq/dCB24bqlbiDEkeG7gSBraMO0bmcga+G6v3QgbuG7kWkgxJHGsOG7o2MgdOG7qyBtb2JpbGUgbmV0d29ya1xyXG5jb25zdCBzZXR1cEN1c3RvbUROU1Jlc29sdmVyID0gYXN5bmMgKCkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICAvLyBUaOG7rSBsw6BtIHLDtSB0w6puIG1p4buBbiBNb25nb0RCXHJcbiAgICBpZiAoVVJJICYmIFVSSS5pbmNsdWRlcygnbW9uZ29kYitzcnY6Ly8nKSAmJiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgY29uc3QgaG9zdCA9IFVSSS5zcGxpdCgnQCcpWzFdLnNwbGl0KCcvJylbMF07XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgLy8gVGhp4bq/dCBs4bqtcCBETlMgc2VydmVycyB0aGF5IHRo4bq/IChHb29nbGUgRE5TIHbDoCBDbG91ZGZsYXJlIEROUylcclxuICAgICAgICBkbnMuc2V0U2VydmVycyhbJzguOC44LjgnLCAnOC44LjQuNCcsICcxLjEuMS4xJywgJzEuMC4wLjEnXSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVGjhu60gZ2nhuqNpIHF1eeG6v3QgU1JWIHJlY29yZFxyXG4gICAgICAgIGNvbnN0IGxvb2t1cFByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICBkbnMubG9va3VwKGhvc3QsIChlcnIsIGFkZHJlc3MpID0+IHtcclxuICAgICAgICAgICAgaWYgKCFlcnIpIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgTW9uZ29EQiBIb3N0ICR7aG9zdH0gcmVzb2x2ZXMgdG8gSVA6ICR7YWRkcmVzc31gKTtcclxuICAgICAgICAgICAgICByZXNvbHZlKGFkZHJlc3MpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEROUyBsb29rdXAgZmFpbGVkIGZvciAke2hvc3R9OmAsIGVycik7XHJcbiAgICAgICAgICAgICAgcmVqZWN0KGVycik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIENo4budIHThu5FpIMSRYSA1IGdpw6J5IGNobyBETlMgbG9va3VwXHJcbiAgICAgICAgY29uc3QgdGltZW91dFByb21pc2UgPSBuZXcgUHJvbWlzZSgoXywgcmVqZWN0KSA9PiBcclxuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gcmVqZWN0KG5ldyBFcnJvcignRE5TIGxvb2t1cCB0aW1lb3V0JykpLCA1MDAwKVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQ2jhuqF5IHbhu5tpIHRpbWVvdXRcclxuICAgICAgICBjb25zdCBhZGRyZXNzID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtsb29rdXBQcm9taXNlLCB0aW1lb3V0UHJvbWlzZV0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIE7hur91IHRow6BuaCBjw7RuZyB2w6Aga2jDtG5nIGPDsyBVUkkgdHLhu7FjIHRp4bq/cCwgdOG6oW8gbeG7mXQgVVJJIHRy4buxYyB0aeG6v3BcclxuICAgICAgICBpZiAoYWRkcmVzcyAmJiAhcHJvY2Vzcy5lbnYuTU9OR09EQl9ESVJFQ1RfVVJJKSB7XHJcbiAgICAgICAgICBsZXQgdXNlcm5hbWUgPSAnJywgcGFzc3dvcmQgPSAnJywgZGF0YWJhc2UgPSAnJztcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gUGFyc2UgVVJJIMSR4buDIGzhuqV5IHRow7RuZyB0aW4geMOhYyB0aOG7sWMgdsOgIGRhdGFiYXNlXHJcbiAgICAgICAgICBpZiAoVVJJLmluY2x1ZGVzKCdAJykpIHtcclxuICAgICAgICAgICAgY29uc3QgYXV0aFBhcnQgPSBVUkkuc3BsaXQoJ0AnKVswXS5yZXBsYWNlKCdtb25nb2RiK3NydjovLycsICcnKTtcclxuICAgICAgICAgICAgaWYgKGF1dGhQYXJ0LmluY2x1ZGVzKCc6JykpIHtcclxuICAgICAgICAgICAgICBbdXNlcm5hbWUsIHBhc3N3b3JkXSA9IGF1dGhQYXJ0LnNwbGl0KCc6Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgaWYgKFVSSS5pbmNsdWRlcygnLycpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gVVJJLnNwbGl0KCcvJyk7XHJcbiAgICAgICAgICAgIGRhdGFiYXNlID0gcGFydHNbcGFydHMubGVuZ3RoIC0gMV0uc3BsaXQoJz8nKVswXTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gVOG6oW8gVVJJIHRy4buxYyB0aeG6v3AgduG7m2kgxJHhu4thIGNo4buJIElQIMSRw6MgcmVzb2x2ZVxyXG4gICAgICAgICAgY29uc3QgZGlyZWN0VVJJID0gYG1vbmdvZGI6Ly8ke3VzZXJuYW1lfToke3Bhc3N3b3JkfUAke2FkZHJlc3N9OjI3MDE3LyR7ZGF0YWJhc2V9P3NzbD10cnVlJmF1dGhTb3VyY2U9YWRtaW5gO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coYENyZWF0ZWQgZGlyZWN0IFVSSSB1c2luZyByZXNvbHZlZCBJUDogJHtkaXJlY3RVUkkucmVwbGFjZSgvXFwvXFwvW146XSs6W15AXStALywgXCIvLyoqKjoqKipAXCIpfWApO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBMxrB1IGzhuqFpIMSR4buDIHPhu60gZOG7pW5nIHNhdSBuw6B5XHJcbiAgICAgICAgICBpZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW52Lk1PTkdPREJfUkVTT0xWRURfRElSRUNUX1VSSSA9IGRpcmVjdFVSSTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2ggKGRuc0Vycikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ROUyByZXNvbHV0aW9uIGVycm9yOicsIGRuc0Vycik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcignRXJyb3Igc2V0dGluZyB1cCBjdXN0b20gRE5TIHJlc29sdmVyOicsIGVycm9yKTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBH4buNaSBzZXR1cEN1c3RvbUROU1Jlc29sdmVyIMSR4buDIGPhuqNpIHRoaeG7h24ga+G6v3QgbuG7kWkgLSBiw6J5IGdp4budIGzDoCBhc3luY1xyXG4oYXN5bmMgKCkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBzZXR1cEN1c3RvbUROU1Jlc29sdmVyKCk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGluIGluaXRpYWwgRE5TIHNldHVwOlwiLCBlKTtcclxuICB9XHJcbn0pKCk7XHJcblxyXG4vLyBIw6BtIGvhur90IG7hu5FpIE1vbmdvREIgduG7m2kga2jhuqMgbsSDbmcgdGjhu60gbOG6oWlcclxuY29uc3QgY29ubmVjdFdpdGhSZXRyeSA9IGFzeW5jIChyZXRyaWVzID0gNSwgZGVsYXkgPSA1MDAwKSA9PiB7XHJcbiAgY29ubmVjdGlvbkF0dGVtcHRzKys7XHJcbiAgY29uc29sZS5sb2coYE1vbmdvREIgQ29ubmVjdGlvbiBBdHRlbXB0ICMke2Nvbm5lY3Rpb25BdHRlbXB0c30uLi5gKTtcclxuICBcclxuICAvLyBLaeG7g20gdHJhIEROUyB0csaw4bubYyBraGkga+G6v3QgbuG7kWlcclxuICBhd2FpdCBzZXR1cEN1c3RvbUROU1Jlc29sdmVyKCk7XHJcbiAgXHJcbiAgLy8gTOG6pXkgdOG6pXQgY+G6oyBjw6FjIFVSSSBjw7MgdGjhu4Mgc+G7rSBk4bulbmdcclxuICBjb25zdCBzdXBlclNpbXBsZVVSSSA9IHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyA/IHByb2Nlc3MuZW52Lk1PTkdPREJfU1VQRVJfU0lNUExFX1VSSSA6IHVuZGVmaW5lZDtcclxuICBjb25zdCBtb2JpbGVVUkkgPSB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgPyBwcm9jZXNzLmVudi5NT05HT0RCX01PQklMRV9VUkkgOiB1bmRlZmluZWQ7XHJcbiAgY29uc3Qgc2luZ2xlSXBVUkkgPSB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgPyBwcm9jZXNzLmVudi5NT05HT0RCX1NJTkdMRV9JUF9VUkkgOiB1bmRlZmluZWQ7XHJcbiAgY29uc3Qgc2ltcGxlVVJJID0gdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnID8gcHJvY2Vzcy5lbnYuTU9OR09EQl9TSU1QTEVfVVJJIDogdW5kZWZpbmVkO1xyXG4gIGNvbnN0IGlwVVJJID0gdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnID8gcHJvY2Vzcy5lbnYuTU9OR09EQl9JUF9VUkkgOiB1bmRlZmluZWQ7XHJcbiAgY29uc3Qgc3J2VVJJID0gdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnID8gcHJvY2Vzcy5lbnYuTU9OR09EQl9TUlZfVVJJIDogdW5kZWZpbmVkO1xyXG4gIGNvbnN0IHJlc29sdmVkRGlyZWN0VVJJID0gdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnID8gcHJvY2Vzcy5lbnYuTU9OR09EQl9SRVNPTFZFRF9ESVJFQ1RfVVJJIDogdW5kZWZpbmVkO1xyXG4gIFxyXG4gIC8vIFF1eeG6v3QgxJHhu4tuaCBVUkkgxJHhu4Mga+G6v3QgbuG7kWkgdGhlbyB0aOG7qSB04buxIMawdSB0acOqblxyXG4gIGxldCB1cmlUb0Nvbm5lY3QgPSBzdXBlclNpbXBsZVVSSSB8fCBtb2JpbGVVUkkgfHwgc2luZ2xlSXBVUkkgfHwgc2ltcGxlVVJJIHx8IGlwVVJJIHx8IHNydlVSSSB8fCByZXNvbHZlZERpcmVjdFVSSSB8fCBlbmhhbmNlZFVSSTtcclxuICBcclxuICAvLyBMb2cgdGjDtG5nIHRpbiBr4bq/dCBu4buRaSDEkeG7gyBkZWJ1Z1xyXG4gIGNvbnNvbGUubG9nKGDEkGFuZyBr4bq/dCBu4buRaSB24bubaSBNb25nb0RCLCBsb+G6oWkgVVJJOiAke1xyXG4gICAgc3VwZXJTaW1wbGVVUkkgPyAnU3VwZXIgU2ltcGxlIFVSSScgOlxyXG4gICAgbW9iaWxlVVJJID8gJ01vYmlsZSBVUkknIDpcclxuICAgIHNpbmdsZUlwVVJJID8gJ1NpbmdsZSBJUCBVUkknIDpcclxuICAgIHNpbXBsZVVSSSA/ICdTaW1wbGUgVVJJJyA6XHJcbiAgICBpcFVSSSA/ICdJUCB0cuG7sWMgdGnhur9wJyA6IFxyXG4gICAgc3J2VVJJID8gJ1NSViBVUkknIDpcclxuICAgIHJlc29sdmVkRGlyZWN0VVJJID8gJ1Jlc29sdmVkIEROUycgOiBcclxuICAgICdTUlYgU3RhbmRhcmQnXHJcbiAgfWApO1xyXG4gIFxyXG4gIC8vIEluIHRow7RuZyB0aW4gZGV2aWNlIMSR4buDIGRlYnVnXHJcbiAgY29uc29sZS5sb2coXCJEZXZpY2UgaW5mbzpcIiwge1xyXG4gICAgcGxhdGZvcm06IHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyA/IHByb2Nlc3MucGxhdGZvcm0gOiAndW5rbm93bicsXHJcbiAgICBhcmNoOiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgPyBwcm9jZXNzLmFyY2ggOiAndW5rbm93bicsXHJcbiAgICBub2RlOiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgPyBwcm9jZXNzLnZlcnNpb24gOiAndW5rbm93bicsXHJcbiAgICBtb25nb29zZVZlcnNpb246IG1vbmdvb3NlLnZlcnNpb25cclxuICB9KTtcclxuICBcclxuICBmb3IgKGxldCBpID0gMDsgaSA8IHJldHJpZXM7IGkrKykge1xyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gQ2jhu50gbeG7mXQgY2jDunQgdHLGsOG7m2Mga2hpIHRo4butIGzhuqFpIG7hur91IGtow7RuZyBwaOG6o2kgbOG6p24gxJHhuqd1XHJcbiAgICAgIGlmIChpID4gMCkge1xyXG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAyMDAwKSk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vIEhp4buDbiB0aOG7iyB0aMO0bmcgdGluIGvhur90IG7hu5FpIChjaGUgZOG6pXUgdGjDtG5nIHRpbiBuaOG6oXkgY+G6o20pXHJcbiAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGluZyB0byBNb25nb0RCIHdpdGggVVJJOlwiLCBcclxuICAgICAgICB1cmlUb0Nvbm5lY3QgPyB1cmlUb0Nvbm5lY3QucmVwbGFjZSgvXFwvXFwvW146XSs6W15AXStALywgXCIvLyoqKjoqKipAXCIpIDogXCJVUkkgaXMgdW5kZWZpbmVkXCIpO1xyXG4gICAgICBcclxuICAgICAgLy8gS+G6v3QgbuG7kWkgduG7m2kgVVJJIMSRw6MgxJHGsOG7o2MgbsOibmcgY2FvXHJcbiAgICAgIGF3YWl0IG1vbmdvb3NlLmNvbm5lY3QodXJpVG9Db25uZWN0LCBtb25nb29zZU9wdGlvbnMpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coXCJNb25nb0RCIENvbm5lY3RlZCBTdWNjZXNzZnVsbHkhXCIpO1xyXG4gICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb24gSW5mbzpcIiwge1xyXG4gICAgICAgIGhvc3Q6IG1vbmdvb3NlLmNvbm5lY3Rpb24uaG9zdCxcclxuICAgICAgICBwb3J0OiBtb25nb29zZS5jb25uZWN0aW9uLnBvcnQsXHJcbiAgICAgICAgZGJOYW1lOiBtb25nb29zZS5jb25uZWN0aW9uLm5hbWUsXHJcbiAgICAgICAgcmVhZHlTdGF0ZTogbW9uZ29vc2UuY29ubmVjdGlvbi5yZWFkeVN0YXRlLFxyXG4gICAgICAgIHVzaW5nRGlyZWN0VVJJOiAhIXJlc29sdmVkRGlyZWN0VVJJLFxyXG4gICAgICAgIHVzaW5nSXBVUkk6ICEhaXBVUkksXHJcbiAgICAgICAgZW52OiBnZXROb2RlRW52KClcclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBpc01vbmdvQ29ubmVjdGVkID0gdHJ1ZTtcclxuICAgICAgcmV0dXJuIG1vbmdvb3NlLmNvbm5lY3Rpb247XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihgTW9uZ29EQiBjb25uZWN0aW9uIGF0dGVtcHQgJHtpICsgMX0gZmFpbGVkOmAsIGVyci5uYW1lKTtcclxuICAgICAgXHJcbiAgICAgIGlmIChlcnIubmFtZSA9PT0gXCJNb25nb29zZVNlcnZlclNlbGVjdGlvbkVycm9yXCIpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiQ29ubmVjdGlvbiBEZXRhaWxzIChvYmZ1c2NhdGVkKTpcIiwge1xyXG4gICAgICAgICAgdXJpOiB1cmlUb0Nvbm5lY3QgPyB1cmlUb0Nvbm5lY3QucmVwbGFjZSgvXFwvXFwvW146XSs6W15AXStALywgXCIvLyoqKjoqKipAXCIpIDogXCJVUkkgaXMgdW5kZWZpbmVkXCIsXHJcbiAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcclxuICAgICAgICAgIHJlYXNvbjogZXJyLnJlYXNvbiAmJiBlcnIucmVhc29uLm1lc3NhZ2UgPyBlcnIucmVhc29uLm1lc3NhZ2UgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICBjb2RlOiBlcnIuY29kZVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnNvbGUud2FybihcIuKaoO+4jyBUaGlzIGVycm9yIG1pZ2h0IGJlIHJlbGF0ZWQgdG8gSVAgd2hpdGVsaXN0IHJlc3RyaWN0aW9ucy4gUGxlYXNlIHVwZGF0ZSB5b3VyIE1vbmdvREIgQXRsYXMgd2hpdGVsaXN0IHRvIGluY2x1ZGUgMC4wLjAuMC8wIG9yIHlvdXIgY3VycmVudCBJUC5cIik7XHJcbiAgICAgICAgY29uc29sZS53YXJuKFwi4pqg77iPIEjDo3kga2nhu4NtIHRyYSB3aGl0ZWxpc3QgSVAgdHJvbmcgTW9uZ29EQiBBdGxhcyB2w6AgxJHhuqNtIGLhuqNvIHRow6ptIMSR4buLYSBjaOG7iSBJUCBj4bunYSBi4bqhbiBob+G6t2MgMC4wLjAuMC8wIMSR4buDIGNobyBwaMOpcCB04bqldCBj4bqjIGvhur90IG7hu5FpLlwiKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBUaOG7rSBz4butIGThu6VuZyBVUkkgZOG7sSBwaMOybmcgbuG6v3UgY8OzXHJcbiAgICAgICAgY29uc3QgZmFsbGJhY2tVUkkgPSB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgPyBcclxuICAgICAgICAgIHByb2Nlc3MuZW52Lk1PTkdPREJfRkFMTEJBQ0tfVVJJIDogdW5kZWZpbmVkO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChmYWxsYmFja1VSSSAmJiBmYWxsYmFja1VSSSAhPT0gVVJJKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIlRyeWluZyBmYWxsYmFjayBVUkkuLi5cIik7XHJcbiAgICAgICAgICBjb25zdCBlbmhhbmNlZEZhbGxiYWNrVVJJID0gZW5oYW5jZU1vbmdvVVJJKGZhbGxiYWNrVVJJKTtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IG1vbmdvb3NlLmNvbm5lY3QoZW5oYW5jZWRGYWxsYmFja1VSSSwgbW9uZ29vc2VPcHRpb25zKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0ZWQgc3VjY2Vzc2Z1bGx5IHVzaW5nIGZhbGxiYWNrIFVSSSFcIik7XHJcbiAgICAgICAgICAgIGlzTW9uZ29Db25uZWN0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICByZXR1cm4gbW9uZ29vc2UuY29ubmVjdGlvbjtcclxuICAgICAgICAgIH0gY2F0Y2ggKGZhbGxiYWNrRXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWxsYmFjayBjb25uZWN0aW9uIGZhaWxlZDpcIiwgZmFsbGJhY2tFcnIubmFtZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoaSA9PT0gcmV0cmllcyAtIDEpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiTWF4IHJldHJpZXMgcmVhY2hlZC4gQ291bGQgbm90IGNvbm5lY3QgdG8gTW9uZ29EQi5cIik7XHJcbiAgICAgICAgaXNNb25nb0Nvbm5lY3RlZCA9IGZhbHNlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFRo4butIGvhur90IG7hu5FpIGzhuqFpIHNhdSA1IHBow7p0XHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRpbmcgdG8gcmVjb25uZWN0IHRvIE1vbmdvREIgYWZ0ZXIgZXh0ZW5kZWQgZGVsYXkuLi5cIik7XHJcbiAgICAgICAgICBjb25uZWN0V2l0aFJldHJ5KHJldHJpZXMsIGRlbGF5KTtcclxuICAgICAgICB9LCAzMDAwMDApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZyhgUmV0cnlpbmcgaW4gJHtkZWxheS8xMDAwfSBzZWNvbmRzLi4uYCk7XHJcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBkZWxheSkpO1xyXG4gICAgfVxyXG4gIH1cclxuICBcclxuICByZXR1cm4gbnVsbDtcclxufTtcclxuXHJcbi8vIEPDoWMgaMOgbSB44butIGzDvSBz4buxIGtp4buHbiBr4bq/dCBu4buRaVxyXG5jb25zdCBzZXR1cENvbm5lY3Rpb25IYW5kbGVycyA9ICgpID0+IHtcclxuICBtb25nb29zZS5jb25uZWN0aW9uLm9uKFwiZXJyb3JcIiwgKGVycikgPT4ge1xyXG4gICAgY29uc29sZS5lcnJvcihcIk1vbmdvREIgY29ubmVjdGlvbiBlcnJvcjpcIiwgZXJyKTtcclxuICAgIGlzTW9uZ29Db25uZWN0ZWQgPSBmYWxzZTtcclxuICAgIFxyXG4gICAgaWYgKGVyci5uYW1lID09PSBcIk1vbmdvb3NlU2VydmVyU2VsZWN0aW9uRXJyb3JcIikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiSVAgd2hpdGVsaXN0IGlzc3VlIGRldGVjdGVkLiBQbGVhc2UgY2hlY2sgTW9uZ29EQiBBdGxhcyBJUCB3aGl0ZWxpc3Qgc2V0dGluZ3MuXCIpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICBtb25nb29zZS5jb25uZWN0aW9uLm9uKFwiZGlzY29ubmVjdGVkXCIsICgpID0+IHtcclxuICAgIGNvbnNvbGUubG9nKFwiTW9uZ29EQiBkaXNjb25uZWN0ZWQuIEF0dGVtcHRpbmcgdG8gcmVjb25uZWN0Li4uXCIpO1xyXG4gICAgaXNNb25nb0Nvbm5lY3RlZCA9IGZhbHNlO1xyXG4gICAgXHJcbiAgICAvLyBUaOG7rSBr4bq/dCBu4buRaSBs4bqhaSBzYXUgMTAgZ2nDonkga2hpIGLhu4sgbmfhuq90IGvhur90IG7hu5FpXHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IGNvbm5lY3RXaXRoUmV0cnkoKSwgMTAwMDApO1xyXG4gIH0pO1xyXG5cclxuICBtb25nb29zZS5jb25uZWN0aW9uLm9uKFwicmVjb25uZWN0ZWRcIiwgKCkgPT4ge1xyXG4gICAgY29uc29sZS5sb2coXCJNb25nb0RCIHJlY29ubmVjdGVkIHN1Y2Nlc3NmdWxseVwiKTtcclxuICAgIGlzTW9uZ29Db25uZWN0ZWQgPSB0cnVlO1xyXG4gIH0pO1xyXG4gIFxyXG4gIC8vIFjhu60gbMO9IGtoaSBwcm9jZXNzIGvhur90IHRow7pjIC0gY2jhu4kgdGjhu7FjIGhp4buHbiBu4bq/dSBwcm9jZXNzIGzDoCDEkeG7i25oIG5naMSpYVxyXG4gIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIHByb2Nlc3Mub24oJ1NJR0lOVCcsIGFzeW5jICgpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBtb25nb29zZS5jb25uZWN0aW9uLmNsb3NlKCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ01vbmdvREIgY29ubmVjdGlvbiBjbG9zZWQgZHVlIHRvIGFwcCB0ZXJtaW5hdGlvbicpO1xyXG4gICAgICAgIHNhZmVFeGl0KDApO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBkdXJpbmcgTW9uZ29EQiBjb25uZWN0aW9uIGNsb3N1cmU6JywgZXJyKTtcclxuICAgICAgICBzYWZlRXhpdCgxKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gSMOgbSBraeG7g20gdHJhIHRy4bqhbmcgdGjDoWkga+G6v3QgbuG7kWlcclxuY29uc3QgZ2V0Q29ubmVjdGlvblN0YXR1cyA9ICgpID0+IHtcclxuICByZXR1cm4ge1xyXG4gICAgaXNDb25uZWN0ZWQ6IGlzTW9uZ29Db25uZWN0ZWQsXHJcbiAgICByZWFkeVN0YXRlOiBtb25nb29zZS5jb25uZWN0aW9uLnJlYWR5U3RhdGUsXHJcbiAgICBjb25uZWN0aW9uQXR0ZW1wdHMsXHJcbiAgICBob3N0OiBtb25nb29zZS5jb25uZWN0aW9uLmhvc3QsXHJcbiAgICBkYk5hbWU6IG1vbmdvb3NlLmNvbm5lY3Rpb24ubmFtZVxyXG4gIH07XHJcbn07XHJcblxyXG4vLyBLaOG7n2kgdOG6oW8ga+G6v3QgbuG7kWkgdsOgIHRoaeG6v3QgbOG6rXAgaGFuZGxlcnNcclxuY29uc3QgaW5pdGlhbGl6ZURhdGFiYXNlID0gYXN5bmMgKCkgPT4ge1xyXG4gIHNldHVwQ29ubmVjdGlvbkhhbmRsZXJzKCk7XHJcbiAgcmV0dXJuIGNvbm5lY3RXaXRoUmV0cnkoKTtcclxufTtcclxuXHJcbmV4cG9ydCB7IFxyXG4gIGluaXRpYWxpemVEYXRhYmFzZSwgXHJcbiAgZ2V0Q29ubmVjdGlvblN0YXR1cywgXHJcbiAgaXNNb25nb0Nvbm5lY3RlZCxcclxuICBtb25nb29zZVxyXG59OyAiXSwibWFwcGluZ3MiOiI7QUFDQSxJQUFBQSxTQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxPQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxJQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUEsU0FBc0IsU0FBQUQsdUJBQUFJLENBQUEsVUFBQUEsQ0FBQSxJQUFBQSxDQUFBLENBQUFDLFVBQUEsR0FBQUQsQ0FBQSxLQUFBRSxPQUFBLEVBQUFGLENBQUEsS0FIdEI7QUFJQTs7QUFFQTtBQUNBRyxlQUFNLENBQUNDLE1BQU0sQ0FBQyxDQUFDOztBQUVmO0FBQ0FDLFlBQUcsQ0FBQ0MscUJBQXFCLENBQUMsV0FBVyxDQUFDOztBQUV0QztBQUNBLE1BQU1DLEdBQUcsR0FBSSxPQUFPQyxPQUFPLEtBQUssV0FBVztBQUN6Q0EsT0FBTyxDQUFDQyxHQUFHLENBQUNDLHdCQUF3QixJQUFJRixPQUFPLENBQUNDLEdBQUcsQ0FBQ0Usa0JBQWtCLElBQUlILE9BQU8sQ0FBQ0MsR0FBRyxDQUFDRyxxQkFBcUIsSUFBSUosT0FBTyxDQUFDQyxHQUFHLENBQUNJLGtCQUFrQixJQUFJTCxPQUFPLENBQUNDLEdBQUcsQ0FBQ0ssY0FBYyxJQUFJTixPQUFPLENBQUNDLEdBQUcsQ0FBQ00sZUFBZSxJQUFJUCxPQUFPLENBQUNDLEdBQUcsQ0FBQ08sa0JBQWtCLElBQUlSLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDUSxZQUFZLElBQUlULE9BQU8sQ0FBQ0MsR0FBRyxDQUFDUyxXQUFXLElBQUlWLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDVSxvQkFBb0I7QUFDdlVDLFNBQVU7O0FBRVo7QUFDQTtBQUNBLE1BQU1DLGVBQWUsR0FBR0EsQ0FBQ0MsR0FBRyxLQUFLO0VBQy9CLElBQUk7SUFDRixJQUFJLENBQUNBLEdBQUcs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