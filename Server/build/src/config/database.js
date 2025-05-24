"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.isMongoConnected = exports.initializeDatabase = exports.getConnectionStatus = void 0;Object.defineProperty(exports, "mongoose", { enumerable: true, get: function () {return _mongoose.default;} });
var _mongoose = _interopRequireDefault(require("mongoose"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _dns = _interopRequireDefault(require("dns"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };} /* eslint-disable no-undef */
// Không cần fileURLToPath và dirname vì chúng ta không sử dụng __dirname

// Khởi tạo dotenv
_dotenv.default.config({ path: '.env' });

// Hỗ trợ IPv4 first - giúp kết nối từ nhiều loại thiết bị
_dns.default.setDefaultResultOrder('ipv4first');

// Lấy URI từ biến môi trường và Node.js global process
// Thay đổi thứ tự ưu tiên: ưu tiên các URI trực tiếp bằng IP đầu tiên
const URI = typeof process !== 'undefined' ?
process.env.MONGODB_SINGLE_IP_URI || process.env.MONGODB_IP_URI || process.env.MONGODB_MOBILE_URI || process.env.MONGODB_DIRECT_URI || process.env.MONGODB_SUPER_SIMPLE_URI || process.env.MONGODB_SIMPLE_URI || process.env.MONGODB_SRV_URI || process.env.MONGOOSE_URI || process.env.MONGODB_URI || process.env.MONGODB_FALLBACK_URI :
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

      // Chuyển đổi ssl=true thành tls=true chỉ khi là URI SRV
      if (uri.includes('mongodb+srv://') && uri.includes('ssl=true')) {
        uri = uri.replace('ssl=true', 'tls=true');
      }

      // Thêm authSource=admin nếu chưa có và không phải SRV URI
      if (!uri.includes('mongodb+srv://') && !uri.includes('authSource=')) {
        uri += '&authSource=admin';
      }

      return uri;
    } else {
      // Chưa có tham số, thêm dấu ? và tham số mới
      let params = 'retryWrites=true&w=majority';

      // Thêm authSource=admin nếu không phải SRV URI
      if (!uri.includes('mongodb+srv://')) {
        params += '&authSource=admin';
      }

      return `${uri}?${params}`;
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

  // Các tùy chọn bổ sung để bỏ qua xác minh IP nghiêm ngặt
  // Quan trọng cho thiết bị di động và mạng không cố định
  autoIndex: true,

  // Tùy chỉnh SSL/TLS dựa trên loại URI - Sửa lỗi sslValidate
  ...(URI && URI.includes('mongodb+srv://') ? {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true
  } : {
    // Với direct URI, sử dụng ssl thay vì tls nhưng không dùng sslValidate
    ssl: true
  }),

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

// Hàm khởi tạo cơ sở dữ liệu
const initializeDatabase = async () => {
  // Thiết lập các handlers xử lý sự kiện kết nối
  setupConnectionHandlers();

  // Kết nối với MongoDB
  return await connectWithRetry();
};

// Custom resolver cho DNS - giúp giải quyết vấn đề không kết nối được từ mobile network
exports.initializeDatabase = initializeDatabase;const setupCustomDNSResolver = async () => {
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

// Hàm kết nối MongoDB với khả năng thử lại
const connectWithRetry = async (retries = 5, delay = 5000) => {
  connectionAttempts++;
  console.log(`MongoDB Connection Attempt #${connectionAttempts}...`);

  // Kiểm tra DNS trước khi kết nối
  await setupCustomDNSResolver();

  // Lấy tất cả các URI có thể sử dụng
  const singleIpURI = typeof process !== 'undefined' ? process.env.MONGODB_SINGLE_IP_URI : undefined;
  const ipURI = typeof process !== 'undefined' ? process.env.MONGODB_IP_URI : undefined;
  const mobileURI = typeof process !== 'undefined' ? process.env.MONGODB_MOBILE_URI : undefined;
  const directURI = typeof process !== 'undefined' ? process.env.MONGODB_DIRECT_URI : undefined;
  const superSimpleURI = typeof process !== 'undefined' ? process.env.MONGODB_SUPER_SIMPLE_URI : undefined;
  const simpleURI = typeof process !== 'undefined' ? process.env.MONGODB_SIMPLE_URI : undefined;
  const srvURI = typeof process !== 'undefined' ? process.env.MONGODB_SRV_URI : undefined;
  const resolvedDirectURI = typeof process !== 'undefined' ? process.env.MONGODB_RESOLVED_DIRECT_URI : undefined;

  // Quyết định URI để kết nối theo thứ tự ưu tiên
  // Ưu tiên các URI trực tiếp bằng IP cho thiết bị di động
  let uriToConnect;

  if (isMobileDevice()) {
    // Cho thiết bị di động, ưu tiên các URI trực tiếp bằng IP
    uriToConnect = singleIpURI || ipURI || directURI || resolvedDirectURI || mobileURI || superSimpleURI || simpleURI || srvURI || enhancedURI;
    console.log("Đang sử dụng URI cho thiết bị di động");
  } else {
    // Cho thiết bị thông thường, có thể sử dụng SRV URI
    uriToConnect = singleIpURI || ipURI || superSimpleURI || mobileURI || srvURI || simpleURI || directURI || resolvedDirectURI || enhancedURI;
  }

  // Log thông tin kết nối để debug
  console.log(`Đang kết nối với MongoDB, loại URI: ${
  singleIpURI && uriToConnect === singleIpURI ? 'Single IP URI' :
  ipURI && uriToConnect === ipURI ? 'IP trực tiếp' :
  mobileURI && uriToConnect === mobileURI ? 'Mobile URI' :
  directURI && uriToConnect === directURI ? 'Direct URI' :
  superSimpleURI && uriToConnect === superSimpleURI ? 'Super Simple URI' :
  simpleURI && uriToConnect === simpleURI ? 'Simple URI' :
  srvURI && uriToConnect === srvURI ? 'SRV URI' :
  resolvedDirectURI && uriToConnect === resolvedDirectURI ? 'Resolved DNS' :
  'Standard URI'}`
  );

  // In thông tin device để debug
  console.log("Device info:", {
    platform: typeof process !== 'undefined' ? process.platform : 'unknown',
    arch: typeof process !== 'undefined' ? process.arch : 'unknown',
    node: typeof process !== 'undefined' ? process.version : 'unknown',
    mongooseVersion: _mongoose.default.version,
    isMobile: isMobileDevice()
  });

  for (let i = 0; i < retries; i++) {
    try {
      // Chờ một chút trước khi thử lại nếu không phải lần đầu
      if (i > 0) {
        await new Promise((r) => setTimeout(r, delay));
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
        usingDirectURI: !!directURI || !!resolvedDirectURI || !!singleIpURI || !!ipURI,
        usingIpURI: !!ipURI || !!singleIpURI,
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

      // Nếu đã thử tất cả các lần và vẫn thất bại
      if (i === retries - 1) {
        console.error(`Failed to connect to MongoDB after ${retries} attempts.`);
        console.log("The server will continue to run without database connection.");
        exports.isMongoConnected = isMongoConnected = false;
      }
    }
  }

  return null;
};

// Lấy trạng thái kết nối
const getConnectionStatus = () => {
  return {
    isConnected: isMongoConnected,
    readyState: _mongoose.default.connection ? _mongoose.default.connection.readyState : 0,
    dbName: _mongoose.default.connection ? _mongoose.default.connection.name : null,
    host: _mongoose.default.connection ? _mongoose.default.connection.host : null
  };
};

// Các hàm xử lý sự kiện kết nối
exports.getConnectionStatus = getConnectionStatus;const setupConnectionHandlers = () => {
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
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB connection closure:', err);
        process.exit(1);
      }
    });
  }
};

// Khởi tạo kết nối khi import module
// initializeDatabase().catch(err => {
//   console.error('Failed to initialize database:', err);
// });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfbW9uZ29vc2UiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9kb3RlbnYiLCJfZG5zIiwiZSIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwiZG90ZW52IiwiY29uZmlnIiwicGF0aCIsImRucyIsInNldERlZmF1bHRSZXN1bHRPcmRlciIsIlVSSSIsInByb2Nlc3MiLCJlbnYiLCJNT05HT0RCX1NJTkdMRV9JUF9VUkkiLCJNT05HT0RCX0lQX1VSSSIsIk1PTkdPREJfTU9CSUxFX1VSSSIsIk1PTkdPREJfRElSRUNUX1VSSSIsIk1PTkdPREJfU1VQRVJfU0lNUExFX1VSSSIsIk1PTkdPREJfU0lNUExFX1VSSSIsIk1PTkdPREJfU1JWX1VSSSIsIk1PTkdPT1NFX1VSSSIsIk1PTkdPREJfVVJJIiwiTU9OR09EQl9GQUxMQkFDS19VUkkiLCJ1bmRlZmluZWQiLCJlbmhhbmNlTW9uZ29VUkkiLCJ1cmkiLCJpbmNsdWRlcyIsInJlcGxhY2UiLCJwYXJhbXMiLCJlcnIiLCJjb25zb2xlIiwiZXJyb3IiLCJlbmhhbmNlZFVSSSIsIm1vbmdvb3NlT3B0aW9ucyIsInNlcnZlclNlbGVjdGlvblRpbWVvdXRNUyIsInNvY2tldFRpbWVvdXRNUyIsImNvbm5lY3RUaW1lb3V0TVMiLCJyZXRyeVdyaXRlcyIsInJldHJ5UmVhZHMiLCJtYXhQb29sU2l6ZSIsIm1pblBvb2xTaXplIiwibWF4SWRsZVRpbWVNUyIsIndhaXRRdWV1ZVRpbWVvdXRNUyIsImhlYXJ0YmVhdEZyZXF1ZW5jeU1TIiwiZmFtaWx5IiwiYXV0b0luZGV4IiwidGxzIiwidGxzQWxsb3dJbnZhbGlkQ2VydGlmaWNhdGVzIiwidGxzQWxsb3dJbnZhbGlkSG9zdG5hbWVzIiwic3NsIiwidXNlTmV3VXJsUGFyc2VyIiwidXNlVW5pZmllZFRvcG9sb2d5IiwiaXNNb25nb0Nvbm5lY3RlZCIsImV4cG9ydHMiLCJjb25uZWN0aW9uQXR0ZW1wdHMiLCJnZXROb2RlRW52IiwiTk9ERV9FTlYiLCJpbml0aWFsaXplRGF0YWJhc2UiLCJzZXR1cENvbm5lY3Rpb25IYW5kbGVycyIsImNvbm5lY3RXaXRoUmV0cnkiLCJzZXR1cEN1c3RvbUROU1Jlc29sdmVyIiwiaG9zdCIsInNwbGl0Iiwic2V0U2VydmVycyIsImxvb2t1cFByb21pc2UiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImxvb2t1cCIsImFkZHJlc3MiLCJsb2ciLCJ0aW1lb3V0UHJvbWlzZSIsIl8iLCJzZXRUaW1lb3V0IiwiRXJyb3IiLCJyYWNlIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsImRhdGFiYXNlIiwiYXV0aFBhcnQiLCJwYXJ0cyIsImxlbmd0aCIsImRpcmVjdFVSSSIsIk1PTkdPREJfUkVTT0xWRURfRElSRUNUX1VSSSIsImRuc0VyciIsImlzTW9iaWxlRGV2aWNlIiwid2luZG93IiwibmF2aWdhdG9yIiwidWEiLCJ1c2VyQWdlbnQiLCJ0ZXN0IiwiSVNfTU9CSUxFIiwicmV0cmllcyIsImRlbGF5Iiwic2luZ2xlSXBVUkkiLCJpcFVSSSIsIm1vYmlsZVVSSSIsInN1cGVyU2ltcGxlVVJJIiwic2ltcGxlVVJJIiwic3J2VVJJIiwicmVzb2x2ZWREaXJlY3RVUkkiLCJ1cmlUb0Nvbm5lY3QiLCJwbGF0Zm9ybSIsImFyY2giLCJub2RlIiwidmVyc2lvbiIsIm1vbmdvb3NlVmVyc2lvbiIsIm1vbmdvb3NlIiwiaXNNb2JpbGUiLCJpIiwiciIsImNvbm5lY3QiLCJjb25uZWN0aW9uIiwicG9ydCIsImRiTmFtZSIsIm5hbWUiLCJyZWFkeVN0YXRlIiwidXNpbmdEaXJlY3RVUkkiLCJ1c2luZ0lwVVJJIiwibWVzc2FnZSIsInJlYXNvbiIsImNvZGUiLCJ3YXJuIiwiZmFsbGJhY2tVUkkiLCJlbmhhbmNlZEZhbGxiYWNrVVJJIiwiZmFsbGJhY2tFcnIiLCJnZXRDb25uZWN0aW9uU3RhdHVzIiwiaXNDb25uZWN0ZWQiLCJvbiIsImNsb3NlIiwiZXhpdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb25maWcvZGF0YWJhc2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cclxuaW1wb3J0IG1vbmdvb3NlIGZyb20gJ21vbmdvb3NlJztcclxuaW1wb3J0IGRvdGVudiBmcm9tICdkb3RlbnYnO1xyXG5pbXBvcnQgZG5zIGZyb20gJ2Rucyc7XHJcbi8vIEtow7RuZyBj4bqnbiBmaWxlVVJMVG9QYXRoIHbDoCBkaXJuYW1lIHbDrCBjaMO6bmcgdGEga2jDtG5nIHPhu60gZOG7pW5nIF9fZGlybmFtZVxyXG5cclxuLy8gS2jhu59pIHThuqFvIGRvdGVudlxyXG5kb3RlbnYuY29uZmlnKHtwYXRoOiAnLmVudid9KTtcclxuXHJcbi8vIEjhu5cgdHLhu6MgSVB2NCBmaXJzdCAtIGdpw7pwIGvhur90IG7hu5FpIHThu6sgbmhp4buBdSBsb+G6oWkgdGhp4bq/dCBi4buLXHJcbmRucy5zZXREZWZhdWx0UmVzdWx0T3JkZXIoJ2lwdjRmaXJzdCcpO1xyXG5cclxuLy8gTOG6pXkgVVJJIHThu6sgYmnhur9uIG3DtGkgdHLGsOG7nW5nIHbDoCBOb2RlLmpzIGdsb2JhbCBwcm9jZXNzXHJcbi8vIFRoYXkgxJHhu5VpIHRo4bupIHThu7EgxrB1IHRpw6puOiDGsHUgdGnDqm4gY8OhYyBVUkkgdHLhu7FjIHRp4bq/cCBi4bqxbmcgSVAgxJHhuqd1IHRpw6puXHJcbmNvbnN0IFVSSSA9ICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgPyBcclxuICBwcm9jZXNzLmVudi5NT05HT0RCX1NJTkdMRV9JUF9VUkkgfHwgcHJvY2Vzcy5lbnYuTU9OR09EQl9JUF9VUkkgfHwgcHJvY2Vzcy5lbnYuTU9OR09EQl9NT0JJTEVfVVJJIHx8IHByb2Nlc3MuZW52Lk1PTkdPREJfRElSRUNUX1VSSSB8fCBwcm9jZXNzLmVudi5NT05HT0RCX1NVUEVSX1NJTVBMRV9VUkkgfHwgcHJvY2Vzcy5lbnYuTU9OR09EQl9TSU1QTEVfVVJJIHx8IHByb2Nlc3MuZW52Lk1PTkdPREJfU1JWX1VSSSB8fCBwcm9jZXNzLmVudi5NT05HT09TRV9VUkkgfHwgcHJvY2Vzcy5lbnYuTU9OR09EQl9VUkkgfHwgcHJvY2Vzcy5lbnYuTU9OR09EQl9GQUxMQkFDS19VUkkgOiBcclxuICB1bmRlZmluZWQpO1xyXG5cclxuLy8gVGjDqm0gdGhhbSBz4buRIMSR4buDIGNobyBwaMOpcCBr4bq/dCBu4buRaSB04burIG3hu41pIElQICgwLjAuMC4wLzApXHJcbi8vIENodXnhu4NuIMSR4buVaSBVUkkgxJHhu4MgdGjDqm0gdGhhbSBz4buRIHbDoG9cclxuY29uc3QgZW5oYW5jZU1vbmdvVVJJID0gKHVyaSkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBpZiAoIXVyaSkgcmV0dXJuIHVyaTtcclxuICAgIFxyXG4gICAgLy8gTuG6v3UgVVJJIMSRw6MgY8OzIHRoYW0gc+G7kSwgdGjDqm0gcmV0cnlXcml0ZXMgdsOgIHRoYW0gc+G7kSBJUFxyXG4gICAgaWYgKHVyaS5pbmNsdWRlcygnPycpKSB7XHJcbiAgICAgIC8vIMSQw6MgY8OzIHRoYW0gc+G7kSwgdGjDqm0gdGhhbSBz4buRIG3hu5tpIG7hur91IGNoxrBhIGPDs1xyXG4gICAgICBpZiAoIXVyaS5pbmNsdWRlcygncmV0cnlXcml0ZXM9dHJ1ZScpKSB7XHJcbiAgICAgICAgdXJpICs9ICcmcmV0cnlXcml0ZXM9dHJ1ZSc7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCF1cmkuaW5jbHVkZXMoJ3c9bWFqb3JpdHknKSkge1xyXG4gICAgICAgIHVyaSArPSAnJnc9bWFqb3JpdHknO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBDaHV54buDbiDEkeG7lWkgc3NsPXRydWUgdGjDoG5oIHRscz10cnVlIGNo4buJIGtoaSBsw6AgVVJJIFNSVlxyXG4gICAgICBpZiAodXJpLmluY2x1ZGVzKCdtb25nb2RiK3NydjovLycpICYmIHVyaS5pbmNsdWRlcygnc3NsPXRydWUnKSkge1xyXG4gICAgICAgIHVyaSA9IHVyaS5yZXBsYWNlKCdzc2w9dHJ1ZScsICd0bHM9dHJ1ZScpO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBUaMOqbSBhdXRoU291cmNlPWFkbWluIG7hur91IGNoxrBhIGPDsyB2w6Aga2jDtG5nIHBo4bqjaSBTUlYgVVJJXHJcbiAgICAgIGlmICghdXJpLmluY2x1ZGVzKCdtb25nb2RiK3NydjovLycpICYmICF1cmkuaW5jbHVkZXMoJ2F1dGhTb3VyY2U9JykpIHtcclxuICAgICAgICB1cmkgKz0gJyZhdXRoU291cmNlPWFkbWluJztcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgcmV0dXJuIHVyaTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIENoxrBhIGPDsyB0aGFtIHPhu5EsIHRow6ptIGThuqV1ID8gdsOgIHRoYW0gc+G7kSBt4bubaVxyXG4gICAgICBsZXQgcGFyYW1zID0gJ3JldHJ5V3JpdGVzPXRydWUmdz1tYWpvcml0eSc7XHJcbiAgICAgIFxyXG4gICAgICAvLyBUaMOqbSBhdXRoU291cmNlPWFkbWluIG7hur91IGtow7RuZyBwaOG6o2kgU1JWIFVSSVxyXG4gICAgICBpZiAoIXVyaS5pbmNsdWRlcygnbW9uZ29kYitzcnY6Ly8nKSkge1xyXG4gICAgICAgIHBhcmFtcyArPSAnJmF1dGhTb3VyY2U9YWRtaW4nO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICByZXR1cm4gYCR7dXJpfT8ke3BhcmFtc31gO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGVuaGFuY2luZyBNb25nb0RCIFVSSTpcIiwgZXJyKTtcclxuICAgIHJldHVybiB1cmk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gTsOibmcgY2FvIFVSSSB24bubaSBjw6FjIHRoYW0gc+G7kSBxdWFuIHRy4buNbmdcclxuY29uc3QgZW5oYW5jZWRVUkkgPSBlbmhhbmNlTW9uZ29VUkkoVVJJKTtcclxuXHJcbi8vIE9wdGlvbnMga+G6v3QgbuG7kWkgTW9uZ29EQiB04buRaSDGsHUgY2hvIG3hu41pIGxv4bqhaSB0aGnhur90IGLhu4tcclxuY29uc3QgbW9uZ29vc2VPcHRpb25zID0ge1xyXG4gIHNlcnZlclNlbGVjdGlvblRpbWVvdXRNUzogNjAwMDAsXHJcbiAgc29ja2V0VGltZW91dE1TOiA5MDAwMCxcclxuICBjb25uZWN0VGltZW91dE1TOiA2MDAwMCxcclxuICByZXRyeVdyaXRlczogdHJ1ZSxcclxuICByZXRyeVJlYWRzOiB0cnVlLFxyXG4gIG1heFBvb2xTaXplOiA1MCxcclxuICBtaW5Qb29sU2l6ZTogMTAsXHJcbiAgbWF4SWRsZVRpbWVNUzogNjAwMDAsXHJcbiAgd2FpdFF1ZXVlVGltZW91dE1TOiA2MDAwMCxcclxuICBoZWFydGJlYXRGcmVxdWVuY3lNUzogMTAwMDAsXHJcbiAgZmFtaWx5OiA0LCAvLyBJUHY0IFxyXG4gIFxyXG4gIC8vIEPDoWMgdMO5eSBjaOG7jW4gYuG7lSBzdW5nIMSR4buDIGLhu48gcXVhIHjDoWMgbWluaCBJUCBuZ2hpw6ptIG5n4bq3dFxyXG4gIC8vIFF1YW4gdHLhu41uZyBjaG8gdGhp4bq/dCBi4buLIGRpIMSR4buZbmcgdsOgIG3huqFuZyBraMO0bmcgY+G7kSDEkeG7i25oXHJcbiAgYXV0b0luZGV4OiB0cnVlLFxyXG4gIFxyXG4gIC8vIFTDuXkgY2jhu4luaCBTU0wvVExTIGThu7FhIHRyw6puIGxv4bqhaSBVUkkgLSBT4butYSBs4buXaSBzc2xWYWxpZGF0ZVxyXG4gIC4uLihVUkkgJiYgVVJJLmluY2x1ZGVzKCdtb25nb2RiK3NydjovLycpID8ge1xyXG4gICAgdGxzOiB0cnVlLFxyXG4gICAgdGxzQWxsb3dJbnZhbGlkQ2VydGlmaWNhdGVzOiB0cnVlLFxyXG4gICAgdGxzQWxsb3dJbnZhbGlkSG9zdG5hbWVzOiB0cnVlXHJcbiAgfSA6IHtcclxuICAgIC8vIFbhu5tpIGRpcmVjdCBVUkksIHPhu60gZOG7pW5nIHNzbCB0aGF5IHbDrCB0bHMgbmjGsG5nIGtow7RuZyBkw7luZyBzc2xWYWxpZGF0ZVxyXG4gICAgc3NsOiB0cnVlXHJcbiAgfSksXHJcbiAgXHJcbiAgLy8gQ8OhYyBvcHRpb25zIG7DoHkgY2jhu4kgY8OybiDEkcaw4bujYyBkw7luZyBuaMawIGFsaWFzZXMgdHJvbmcgbW9uZ29vc2UgbeG7m2lcclxuICAvLyBuaMawbmcgZ2nhu68gbOG6oWkgxJHhu4MgxJHhuqNtIGLhuqNvIHTGsMahbmcgdGjDrWNoXHJcbiAgdXNlTmV3VXJsUGFyc2VyOiB0cnVlLFxyXG4gIHVzZVVuaWZpZWRUb3BvbG9neTogdHJ1ZSxcclxufTtcclxuXHJcbi8vIEJp4bq/biB0b8OgbiBj4bulYyB0aGVvIGTDtWkgdHLhuqFuZyB0aMOhaSBr4bq/dCBu4buRaVxyXG5sZXQgaXNNb25nb0Nvbm5lY3RlZCA9IGZhbHNlO1xyXG5sZXQgY29ubmVjdGlvbkF0dGVtcHRzID0gMDtcclxuXHJcbi8vIEzhuqV5IE5vZGUgZW52aXJvbm1lbnRcclxuY29uc3QgZ2V0Tm9kZUVudiA9ICgpID0+IHtcclxuICByZXR1cm4gdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHByb2Nlc3MuZW52ID8gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgfHwgJ2RldmVsb3BtZW50JyA6ICdkZXZlbG9wbWVudCc7XHJcbn07XHJcblxyXG4vLyBIw6BtIGto4bufaSB04bqhbyBjxqEgc+G7nyBk4buvIGxp4buHdVxyXG5jb25zdCBpbml0aWFsaXplRGF0YWJhc2UgPSBhc3luYyAoKSA9PiB7XHJcbiAgLy8gVGhp4bq/dCBs4bqtcCBjw6FjIGhhbmRsZXJzIHjhu60gbMO9IHPhu7Ega2nhu4duIGvhur90IG7hu5FpXHJcbiAgc2V0dXBDb25uZWN0aW9uSGFuZGxlcnMoKTtcclxuICBcclxuICAvLyBL4bq/dCBu4buRaSB24bubaSBNb25nb0RCXHJcbiAgcmV0dXJuIGF3YWl0IGNvbm5lY3RXaXRoUmV0cnkoKTtcclxufTtcclxuXHJcbi8vIEN1c3RvbSByZXNvbHZlciBjaG8gRE5TIC0gZ2nDunAgZ2nhuqNpIHF1eeG6v3QgduG6pW4gxJHhu4Ega2jDtG5nIGvhur90IG7hu5FpIMSRxrDhu6NjIHThu6sgbW9iaWxlIG5ldHdvcmtcclxuY29uc3Qgc2V0dXBDdXN0b21ETlNSZXNvbHZlciA9IGFzeW5jICgpID0+IHtcclxuICB0cnkge1xyXG4gICAgLy8gVGjhu60gbMOgbSByw7UgdMOqbiBtaeG7gW4gTW9uZ29EQlxyXG4gICAgaWYgKFVSSSAmJiBVUkkuaW5jbHVkZXMoJ21vbmdvZGIrc3J2Oi8vJykgJiYgdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgIGNvbnN0IGhvc3QgPSBVUkkuc3BsaXQoJ0AnKVsxXS5zcGxpdCgnLycpWzBdO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIC8vIFRoaeG6v3QgbOG6rXAgRE5TIHNlcnZlcnMgdGhheSB0aOG6vyAoR29vZ2xlIEROUyB2w6AgQ2xvdWRmbGFyZSBETlMpXHJcbiAgICAgICAgZG5zLnNldFNlcnZlcnMoWyc4LjguOC44JywgJzguOC40LjQnLCAnMS4xLjEuMScsICcxLjAuMC4xJ10pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFRo4butIGdp4bqjaSBxdXnhur90IFNSViByZWNvcmRcclxuICAgICAgICBjb25zdCBsb29rdXBQcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgZG5zLmxvb2t1cChob3N0LCAoZXJyLCBhZGRyZXNzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghZXJyKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYE1vbmdvREIgSG9zdCAke2hvc3R9IHJlc29sdmVzIHRvIElQOiAke2FkZHJlc3N9YCk7XHJcbiAgICAgICAgICAgICAgcmVzb2x2ZShhZGRyZXNzKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBETlMgbG9va3VwIGZhaWxlZCBmb3IgJHtob3N0fTpgLCBlcnIpO1xyXG4gICAgICAgICAgICAgIHJlamVjdChlcnIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBDaOG7nSB04buRaSDEkWEgNSBnacOieSBjaG8gRE5TIGxvb2t1cFxyXG4gICAgICAgIGNvbnN0IHRpbWVvdXRQcm9taXNlID0gbmV3IFByb21pc2UoKF8sIHJlamVjdCkgPT4gXHJcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHJlamVjdChuZXcgRXJyb3IoJ0ROUyBsb29rdXAgdGltZW91dCcpKSwgNTAwMClcclxuICAgICAgICApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIENo4bqheSB24bubaSB0aW1lb3V0XHJcbiAgICAgICAgY29uc3QgYWRkcmVzcyA9IGF3YWl0IFByb21pc2UucmFjZShbbG9va3VwUHJvbWlzZSwgdGltZW91dFByb21pc2VdKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBO4bq/dSB0aMOgbmggY8O0bmcgdsOgIGtow7RuZyBjw7MgVVJJIHRy4buxYyB0aeG6v3AsIHThuqFvIG3hu5l0IFVSSSB0cuG7sWMgdGnhur9wXHJcbiAgICAgICAgaWYgKGFkZHJlc3MgJiYgIXByb2Nlc3MuZW52Lk1PTkdPREJfRElSRUNUX1VSSSkge1xyXG4gICAgICAgICAgbGV0IHVzZXJuYW1lID0gJycsIHBhc3N3b3JkID0gJycsIGRhdGFiYXNlID0gJyc7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIFBhcnNlIFVSSSDEkeG7gyBs4bqleSB0aMO0bmcgdGluIHjDoWMgdGjhu7FjIHbDoCBkYXRhYmFzZVxyXG4gICAgICAgICAgaWYgKFVSSS5pbmNsdWRlcygnQCcpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGF1dGhQYXJ0ID0gVVJJLnNwbGl0KCdAJylbMF0ucmVwbGFjZSgnbW9uZ29kYitzcnY6Ly8nLCAnJyk7XHJcbiAgICAgICAgICAgIGlmIChhdXRoUGFydC5pbmNsdWRlcygnOicpKSB7XHJcbiAgICAgICAgICAgICAgW3VzZXJuYW1lLCBwYXNzd29yZF0gPSBhdXRoUGFydC5zcGxpdCgnOicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGlmIChVUkkuaW5jbHVkZXMoJy8nKSkge1xyXG4gICAgICAgICAgICBjb25zdCBwYXJ0cyA9IFVSSS5zcGxpdCgnLycpO1xyXG4gICAgICAgICAgICBkYXRhYmFzZSA9IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdLnNwbGl0KCc/JylbMF07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIFThuqFvIFVSSSB0cuG7sWMgdGnhur9wIHbhu5tpIMSR4buLYSBjaOG7iSBJUCDEkcOjIHJlc29sdmVcclxuICAgICAgICAgIGNvbnN0IGRpcmVjdFVSSSA9IGBtb25nb2RiOi8vJHt1c2VybmFtZX06JHtwYXNzd29yZH1AJHthZGRyZXNzfToyNzAxNy8ke2RhdGFiYXNlfT9zc2w9dHJ1ZSZhdXRoU291cmNlPWFkbWluYDtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGBDcmVhdGVkIGRpcmVjdCBVUkkgdXNpbmcgcmVzb2x2ZWQgSVA6ICR7ZGlyZWN0VVJJLnJlcGxhY2UoL1xcL1xcL1teOl0rOlteQF0rQC8sIFwiLy8qKio6KioqQFwiKX1gKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gTMawdSBs4bqhaSDEkeG7gyBz4butIGThu6VuZyBzYXUgbsOgeVxyXG4gICAgICAgICAgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudi5NT05HT0RCX1JFU09MVkVEX0RJUkVDVF9VUkkgPSBkaXJlY3RVUkk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChkbnNFcnIpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdETlMgcmVzb2x1dGlvbiBlcnJvcjonLCBkbnNFcnIpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNldHRpbmcgdXAgY3VzdG9tIEROUyByZXNvbHZlcjonLCBlcnJvcik7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gS2nhu4NtIHRyYSB4ZW0gdGhp4bq/dCBi4buLIGPDsyBwaOG6o2kgbMOgIHRoaeG6v3QgYuG7iyBkaSDEkeG7mW5nIGtow7RuZ1xyXG5jb25zdCBpc01vYmlsZURldmljZSA9ICgpID0+IHtcclxuICAvLyBLaeG7g20gdHJhIFVzZXJBZ2VudCBu4bq/dSDEkWFuZyBjaOG6oXkgdHJvbmcgbcO0aSB0csaw4budbmcgY8OzIHdpbmRvd1xyXG4gIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cubmF2aWdhdG9yKSB7XHJcbiAgICBjb25zdCB1YSA9IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50O1xyXG4gICAgcmV0dXJuIC9BbmRyb2lkfHdlYk9TfGlQaG9uZXxpUGFkfGlQb2R8QmxhY2tCZXJyeXxJRU1vYmlsZXxPcGVyYSBNaW5pL2kudGVzdCh1YSk7XHJcbiAgfVxyXG4gIFxyXG4gIC8vIE7hur91IGtow7RuZyBjw7Mgd2luZG93LCBraeG7g20gdHJhIGJp4bq/biBtw7RpIHRyxrDhu51uZ1xyXG4gIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgcHJvY2Vzcy5lbnYpIHtcclxuICAgIHJldHVybiBwcm9jZXNzLmVudi5JU19NT0JJTEUgPT09ICd0cnVlJztcclxuICB9XHJcbiAgXHJcbiAgcmV0dXJuIGZhbHNlO1xyXG59O1xyXG5cclxuLy8gSMOgbSBr4bq/dCBu4buRaSBNb25nb0RCIHbhu5tpIGto4bqjIG7Eg25nIHRo4butIGzhuqFpXHJcbmNvbnN0IGNvbm5lY3RXaXRoUmV0cnkgPSBhc3luYyAocmV0cmllcyA9IDUsIGRlbGF5ID0gNTAwMCkgPT4ge1xyXG4gIGNvbm5lY3Rpb25BdHRlbXB0cysrO1xyXG4gIGNvbnNvbGUubG9nKGBNb25nb0RCIENvbm5lY3Rpb24gQXR0ZW1wdCAjJHtjb25uZWN0aW9uQXR0ZW1wdHN9Li4uYCk7XHJcbiAgXHJcbiAgLy8gS2nhu4NtIHRyYSBETlMgdHLGsOG7m2Mga2hpIGvhur90IG7hu5FpXHJcbiAgYXdhaXQgc2V0dXBDdXN0b21ETlNSZXNvbHZlcigpO1xyXG4gIFxyXG4gIC8vIEzhuqV5IHThuqV0IGPhuqMgY8OhYyBVUkkgY8OzIHRo4buDIHPhu60gZOG7pW5nXHJcbiAgY29uc3Qgc2luZ2xlSXBVUkkgPSB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgPyBwcm9jZXNzLmVudi5NT05HT0RCX1NJTkdMRV9JUF9VUkkgOiB1bmRlZmluZWQ7XHJcbiAgY29uc3QgaXBVUkkgPSB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgPyBwcm9jZXNzLmVudi5NT05HT0RCX0lQX1VSSSA6IHVuZGVmaW5lZDtcclxuICBjb25zdCBtb2JpbGVVUkkgPSB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgPyBwcm9jZXNzLmVudi5NT05HT0RCX01PQklMRV9VUkkgOiB1bmRlZmluZWQ7XHJcbiAgY29uc3QgZGlyZWN0VVJJID0gdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnID8gcHJvY2Vzcy5lbnYuTU9OR09EQl9ESVJFQ1RfVVJJIDogdW5kZWZpbmVkO1xyXG4gIGNvbnN0IHN1cGVyU2ltcGxlVVJJID0gdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnID8gcHJvY2Vzcy5lbnYuTU9OR09EQl9TVVBFUl9TSU1QTEVfVVJJIDogdW5kZWZpbmVkO1xyXG4gIGNvbnN0IHNpbXBsZVVSSSA9IHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyA/IHByb2Nlc3MuZW52Lk1PTkdPREJfU0lNUExFX1VSSSA6IHVuZGVmaW5lZDtcclxuICBjb25zdCBzcnZVUkkgPSB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgPyBwcm9jZXNzLmVudi5NT05HT0RCX1NSVl9VUkkgOiB1bmRlZmluZWQ7XHJcbiAgY29uc3QgcmVzb2x2ZWREaXJlY3RVUkkgPSB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgPyBwcm9jZXNzLmVudi5NT05HT0RCX1JFU09MVkVEX0RJUkVDVF9VUkkgOiB1bmRlZmluZWQ7XHJcbiAgXHJcbiAgLy8gUXV54bq/dCDEkeG7i25oIFVSSSDEkeG7gyBr4bq/dCBu4buRaSB0aGVvIHRo4bupIHThu7EgxrB1IHRpw6puXHJcbiAgLy8gxq91IHRpw6puIGPDoWMgVVJJIHRy4buxYyB0aeG6v3AgYuG6sW5nIElQIGNobyB0aGnhur90IGLhu4sgZGkgxJHhu5luZ1xyXG4gIGxldCB1cmlUb0Nvbm5lY3Q7XHJcbiAgXHJcbiAgaWYgKGlzTW9iaWxlRGV2aWNlKCkpIHtcclxuICAgIC8vIENobyB0aGnhur90IGLhu4sgZGkgxJHhu5luZywgxrB1IHRpw6puIGPDoWMgVVJJIHRy4buxYyB0aeG6v3AgYuG6sW5nIElQXHJcbiAgICB1cmlUb0Nvbm5lY3QgPSBzaW5nbGVJcFVSSSB8fCBpcFVSSSB8fCBkaXJlY3RVUkkgfHwgcmVzb2x2ZWREaXJlY3RVUkkgfHwgbW9iaWxlVVJJIHx8IHN1cGVyU2ltcGxlVVJJIHx8IHNpbXBsZVVSSSB8fCBzcnZVUkkgfHwgZW5oYW5jZWRVUkk7XHJcbiAgICBjb25zb2xlLmxvZyhcIsSQYW5nIHPhu60gZOG7pW5nIFVSSSBjaG8gdGhp4bq/dCBi4buLIGRpIMSR4buZbmdcIik7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIENobyB0aGnhur90IGLhu4sgdGjDtG5nIHRoxrDhu51uZywgY8OzIHRo4buDIHPhu60gZOG7pW5nIFNSViBVUklcclxuICAgIHVyaVRvQ29ubmVjdCA9IHNpbmdsZUlwVVJJIHx8IGlwVVJJIHx8IHN1cGVyU2ltcGxlVVJJIHx8IG1vYmlsZVVSSSB8fCBzcnZVUkkgfHwgc2ltcGxlVVJJIHx8IGRpcmVjdFVSSSB8fCByZXNvbHZlZERpcmVjdFVSSSB8fCBlbmhhbmNlZFVSSTtcclxuICB9XHJcbiAgXHJcbiAgLy8gTG9nIHRow7RuZyB0aW4ga+G6v3QgbuG7kWkgxJHhu4MgZGVidWdcclxuICBjb25zb2xlLmxvZyhgxJBhbmcga+G6v3QgbuG7kWkgduG7m2kgTW9uZ29EQiwgbG/huqFpIFVSSTogJHtcclxuICAgIHNpbmdsZUlwVVJJICYmIHVyaVRvQ29ubmVjdCA9PT0gc2luZ2xlSXBVUkkgPyAnU2luZ2xlIElQIFVSSScgOlxyXG4gICAgaXBVUkkgJiYgdXJpVG9Db25uZWN0ID09PSBpcFVSSSA/ICdJUCB0cuG7sWMgdGnhur9wJyA6XHJcbiAgICBtb2JpbGVVUkkgJiYgdXJpVG9Db25uZWN0ID09PSBtb2JpbGVVUkkgPyAnTW9iaWxlIFVSSScgOlxyXG4gICAgZGlyZWN0VVJJICYmIHVyaVRvQ29ubmVjdCA9PT0gZGlyZWN0VVJJID8gJ0RpcmVjdCBVUkknIDpcclxuICAgIHN1cGVyU2ltcGxlVVJJICYmIHVyaVRvQ29ubmVjdCA9PT0gc3VwZXJTaW1wbGVVUkkgPyAnU3VwZXIgU2ltcGxlIFVSSScgOlxyXG4gICAgc2ltcGxlVVJJICYmIHVyaVRvQ29ubmVjdCA9PT0gc2ltcGxlVVJJID8gJ1NpbXBsZSBVUkknIDpcclxuICAgIHNydlVSSSAmJiB1cmlUb0Nvbm5lY3QgPT09IHNydlVSSSA/ICdTUlYgVVJJJyA6XHJcbiAgICByZXNvbHZlZERpcmVjdFVSSSAmJiB1cmlUb0Nvbm5lY3QgPT09IHJlc29sdmVkRGlyZWN0VVJJID8gJ1Jlc29sdmVkIEROUycgOiBcclxuICAgICdTdGFuZGFyZCBVUkknXHJcbiAgfWApO1xyXG4gIFxyXG4gIC8vIEluIHRow7RuZyB0aW4gZGV2aWNlIMSR4buDIGRlYnVnXHJcbiAgY29uc29sZS5sb2coXCJEZXZpY2UgaW5mbzpcIiwge1xyXG4gICAgcGxhdGZvcm06IHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyA/IHByb2Nlc3MucGxhdGZvcm0gOiAndW5rbm93bicsXHJcbiAgICBhcmNoOiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgPyBwcm9jZXNzLmFyY2ggOiAndW5rbm93bicsXHJcbiAgICBub2RlOiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgPyBwcm9jZXNzLnZlcnNpb24gOiAndW5rbm93bicsXHJcbiAgICBtb25nb29zZVZlcnNpb246IG1vbmdvb3NlLnZlcnNpb24sXHJcbiAgICBpc01vYmlsZTogaXNNb2JpbGVEZXZpY2UoKVxyXG4gIH0pO1xyXG4gIFxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcmV0cmllczsgaSsrKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAvLyBDaOG7nSBt4buZdCBjaMO6dCB0csaw4bubYyBraGkgdGjhu60gbOG6oWkgbuG6v3Uga2jDtG5nIHBo4bqjaSBs4bqnbiDEkeG6p3VcclxuICAgICAgaWYgKGkgPiAwKSB7XHJcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIGRlbGF5KSk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vIEhp4buDbiB0aOG7iyB0aMO0bmcgdGluIGvhur90IG7hu5FpIChjaGUgZOG6pXUgdGjDtG5nIHRpbiBuaOG6oXkgY+G6o20pXHJcbiAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGluZyB0byBNb25nb0RCIHdpdGggVVJJOlwiLCBcclxuICAgICAgICB1cmlUb0Nvbm5lY3QgPyB1cmlUb0Nvbm5lY3QucmVwbGFjZSgvXFwvXFwvW146XSs6W15AXStALywgXCIvLyoqKjoqKipAXCIpIDogXCJVUkkgaXMgdW5kZWZpbmVkXCIpO1xyXG4gICAgICBcclxuICAgICAgLy8gS+G6v3QgbuG7kWkgduG7m2kgVVJJIMSRw6MgxJHGsOG7o2MgbsOibmcgY2FvXHJcbiAgICAgIGF3YWl0IG1vbmdvb3NlLmNvbm5lY3QodXJpVG9Db25uZWN0LCBtb25nb29zZU9wdGlvbnMpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coXCJNb25nb0RCIENvbm5lY3RlZCBTdWNjZXNzZnVsbHkhXCIpO1xyXG4gICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb24gSW5mbzpcIiwge1xyXG4gICAgICAgIGhvc3Q6IG1vbmdvb3NlLmNvbm5lY3Rpb24uaG9zdCxcclxuICAgICAgICBwb3J0OiBtb25nb29zZS5jb25uZWN0aW9uLnBvcnQsXHJcbiAgICAgICAgZGJOYW1lOiBtb25nb29zZS5jb25uZWN0aW9uLm5hbWUsXHJcbiAgICAgICAgcmVhZHlTdGF0ZTogbW9uZ29vc2UuY29ubmVjdGlvbi5yZWFkeVN0YXRlLFxyXG4gICAgICAgIHVzaW5nRGlyZWN0VVJJOiAhIWRpcmVjdFVSSSB8fCAhIXJlc29sdmVkRGlyZWN0VVJJIHx8ICEhc2luZ2xlSXBVUkkgfHwgISFpcFVSSSxcclxuICAgICAgICB1c2luZ0lwVVJJOiAhIWlwVVJJIHx8ICEhc2luZ2xlSXBVUkksXHJcbiAgICAgICAgZW52OiBnZXROb2RlRW52KClcclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBpc01vbmdvQ29ubmVjdGVkID0gdHJ1ZTtcclxuICAgICAgcmV0dXJuIG1vbmdvb3NlLmNvbm5lY3Rpb247XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihgTW9uZ29EQiBjb25uZWN0aW9uIGF0dGVtcHQgJHtpICsgMX0gZmFpbGVkOmAsIGVyci5uYW1lKTtcclxuICAgICAgXHJcbiAgICAgIGlmIChlcnIubmFtZSA9PT0gXCJNb25nb29zZVNlcnZlclNlbGVjdGlvbkVycm9yXCIpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiQ29ubmVjdGlvbiBEZXRhaWxzIChvYmZ1c2NhdGVkKTpcIiwge1xyXG4gICAgICAgICAgdXJpOiB1cmlUb0Nvbm5lY3QgPyB1cmlUb0Nvbm5lY3QucmVwbGFjZSgvXFwvXFwvW146XSs6W15AXStALywgXCIvLyoqKjoqKipAXCIpIDogXCJVUkkgaXMgdW5kZWZpbmVkXCIsXHJcbiAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcclxuICAgICAgICAgIHJlYXNvbjogZXJyLnJlYXNvbiAmJiBlcnIucmVhc29uLm1lc3NhZ2UgPyBlcnIucmVhc29uLm1lc3NhZ2UgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICBjb2RlOiBlcnIuY29kZVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnNvbGUud2FybihcIuKaoO+4jyBUaGlzIGVycm9yIG1pZ2h0IGJlIHJlbGF0ZWQgdG8gSVAgd2hpdGVsaXN0IHJlc3RyaWN0aW9ucy4gUGxlYXNlIHVwZGF0ZSB5b3VyIE1vbmdvREIgQXRsYXMgd2hpdGVsaXN0IHRvIGluY2x1ZGUgMC4wLjAuMC8wIG9yIHlvdXIgY3VycmVudCBJUC5cIik7XHJcbiAgICAgICAgY29uc29sZS53YXJuKFwi4pqg77iPIEjDo3kga2nhu4NtIHRyYSB3aGl0ZWxpc3QgSVAgdHJvbmcgTW9uZ29EQiBBdGxhcyB2w6AgxJHhuqNtIGLhuqNvIHRow6ptIMSR4buLYSBjaOG7iSBJUCBj4bunYSBi4bqhbiBob+G6t2MgMC4wLjAuMC8wIMSR4buDIGNobyBwaMOpcCB04bqldCBj4bqjIGvhur90IG7hu5FpLlwiKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBUaOG7rSBz4butIGThu6VuZyBVUkkgZOG7sSBwaMOybmcgbuG6v3UgY8OzXHJcbiAgICAgICAgY29uc3QgZmFsbGJhY2tVUkkgPSB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgPyBcclxuICAgICAgICAgIHByb2Nlc3MuZW52Lk1PTkdPREJfRkFMTEJBQ0tfVVJJIDogdW5kZWZpbmVkO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChmYWxsYmFja1VSSSAmJiBmYWxsYmFja1VSSSAhPT0gVVJJKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIlRyeWluZyBmYWxsYmFjayBVUkkuLi5cIik7XHJcbiAgICAgICAgICBjb25zdCBlbmhhbmNlZEZhbGxiYWNrVVJJID0gZW5oYW5jZU1vbmdvVVJJKGZhbGxiYWNrVVJJKTtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IG1vbmdvb3NlLmNvbm5lY3QoZW5oYW5jZWRGYWxsYmFja1VSSSwgbW9uZ29vc2VPcHRpb25zKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0ZWQgc3VjY2Vzc2Z1bGx5IHVzaW5nIGZhbGxiYWNrIFVSSSFcIik7XHJcbiAgICAgICAgICAgIGlzTW9uZ29Db25uZWN0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICByZXR1cm4gbW9uZ29vc2UuY29ubmVjdGlvbjtcclxuICAgICAgICAgIH0gY2F0Y2ggKGZhbGxiYWNrRXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWxsYmFjayBjb25uZWN0aW9uIGZhaWxlZDpcIiwgZmFsbGJhY2tFcnIubmFtZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBO4bq/dSDEkcOjIHRo4butIHThuqV0IGPhuqMgY8OhYyBs4bqnbiB2w6AgduG6q24gdGjhuqV0IGLhuqFpXHJcbiAgICAgIGlmIChpID09PSByZXRyaWVzIC0gMSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byBjb25uZWN0IHRvIE1vbmdvREIgYWZ0ZXIgJHtyZXRyaWVzfSBhdHRlbXB0cy5gKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlRoZSBzZXJ2ZXIgd2lsbCBjb250aW51ZSB0byBydW4gd2l0aG91dCBkYXRhYmFzZSBjb25uZWN0aW9uLlwiKTtcclxuICAgICAgICBpc01vbmdvQ29ubmVjdGVkID0gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgXHJcbiAgcmV0dXJuIG51bGw7XHJcbn07XHJcblxyXG4vLyBM4bqleSB0cuG6oW5nIHRow6FpIGvhur90IG7hu5FpXHJcbmNvbnN0IGdldENvbm5lY3Rpb25TdGF0dXMgPSAoKSA9PiB7XHJcbiAgcmV0dXJuIHtcclxuICAgIGlzQ29ubmVjdGVkOiBpc01vbmdvQ29ubmVjdGVkLFxyXG4gICAgcmVhZHlTdGF0ZTogbW9uZ29vc2UuY29ubmVjdGlvbiA/IG1vbmdvb3NlLmNvbm5lY3Rpb24ucmVhZHlTdGF0ZSA6IDAsXHJcbiAgICBkYk5hbWU6IG1vbmdvb3NlLmNvbm5lY3Rpb24gPyBtb25nb29zZS5jb25uZWN0aW9uLm5hbWUgOiBudWxsLFxyXG4gICAgaG9zdDogbW9uZ29vc2UuY29ubmVjdGlvbiA/IG1vbmdvb3NlLmNvbm5lY3Rpb24uaG9zdCA6IG51bGxcclxuICB9O1xyXG59O1xyXG5cclxuLy8gQ8OhYyBow6BtIHjhu60gbMO9IHPhu7Ega2nhu4duIGvhur90IG7hu5FpXHJcbmNvbnN0IHNldHVwQ29ubmVjdGlvbkhhbmRsZXJzID0gKCkgPT4ge1xyXG4gIG1vbmdvb3NlLmNvbm5lY3Rpb24ub24oXCJlcnJvclwiLCAoZXJyKSA9PiB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiTW9uZ29EQiBjb25uZWN0aW9uIGVycm9yOlwiLCBlcnIpO1xyXG4gICAgaXNNb25nb0Nvbm5lY3RlZCA9IGZhbHNlO1xyXG4gICAgXHJcbiAgICBpZiAoZXJyLm5hbWUgPT09IFwiTW9uZ29vc2VTZXJ2ZXJTZWxlY3Rpb25FcnJvclwiKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJJUCB3aGl0ZWxpc3QgaXNzdWUgZGV0ZWN0ZWQuIFBsZWFzZSBjaGVjayBNb25nb0RCIEF0bGFzIElQIHdoaXRlbGlzdCBzZXR0aW5ncy5cIik7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIG1vbmdvb3NlLmNvbm5lY3Rpb24ub24oXCJkaXNjb25uZWN0ZWRcIiwgKCkgPT4ge1xyXG4gICAgY29uc29sZS5sb2coXCJNb25nb0RCIGRpc2Nvbm5lY3RlZC4gQXR0ZW1wdGluZyB0byByZWNvbm5lY3QuLi5cIik7XHJcbiAgICBpc01vbmdvQ29ubmVjdGVkID0gZmFsc2U7XHJcbiAgICBcclxuICAgIC8vIFRo4butIGvhur90IG7hu5FpIGzhuqFpIHNhdSAxMCBnacOieSBraGkgYuG7iyBuZ+G6r3Qga+G6v3QgbuG7kWlcclxuICAgIHNldFRpbWVvdXQoKCkgPT4gY29ubmVjdFdpdGhSZXRyeSgpLCAxMDAwMCk7XHJcbiAgfSk7XHJcblxyXG4gIG1vbmdvb3NlLmNvbm5lY3Rpb24ub24oXCJyZWNvbm5lY3RlZFwiLCAoKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZyhcIk1vbmdvREIgcmVjb25uZWN0ZWQgc3VjY2Vzc2Z1bGx5XCIpO1xyXG4gICAgaXNNb25nb0Nvbm5lY3RlZCA9IHRydWU7XHJcbiAgfSk7XHJcbiAgXHJcbiAgLy8gWOG7rSBsw70ga2hpIHByb2Nlc3Mga+G6v3QgdGjDumMgLSBjaOG7iSB0aOG7sWMgaGnhu4duIG7hur91IHByb2Nlc3MgbMOgIMSR4buLbmggbmdoxKlhXHJcbiAgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgcHJvY2Vzcy5vbignU0lHSU5UJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IG1vbmdvb3NlLmNvbm5lY3Rpb24uY2xvc2UoKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnTW9uZ29EQiBjb25uZWN0aW9uIGNsb3NlZCBkdWUgdG8gYXBwIHRlcm1pbmF0aW9uJyk7XHJcbiAgICAgICAgcHJvY2Vzcy5leGl0KDApO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBkdXJpbmcgTW9uZ29EQiBjb25uZWN0aW9uIGNsb3N1cmU6JywgZXJyKTtcclxuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIEto4bufaSB04bqhbyBr4bq/dCBu4buRaSBraGkgaW1wb3J0IG1vZHVsZVxyXG4vLyBpbml0aWFsaXplRGF0YWJhc2UoKS5jYXRjaChlcnIgPT4ge1xyXG4vLyAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBpbml0aWFsaXplIGRhdGFiYXNlOicsIGVycik7XHJcbi8vIH0pO1xyXG5cclxuZXhwb3J0IHsgXHJcbiAgaW5pdGlhbGl6ZURhdGFiYXNlLCBcclxuICBnZXRDb25uZWN0aW9uU3RhdHVzLCBcclxuICBpc01vbmdvQ29ubmVjdGVkLFxyXG4gIG1vbmdvb3NlXHJcbn07ICJdLCJtYXBwaW5ncyI6IjtBQUNBLElBQUFBLFNBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLE9BQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLElBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQSxTQUFzQixTQUFBRCx1QkFBQUksQ0FBQSxVQUFBQSxDQUFBLElBQUFBLENBQUEsQ0FBQUMsVUFBQSxHQUFBRCxDQUFBLEtBQUFFLE9BQUEsRUFBQUYsQ0FBQSxLQUh0QjtBQUlBOztBQUVBO0FBQ0FHLGVBQU0sQ0FBQ0MsTUFBTSxDQUFDLEVBQUNDLElBQUksRUFBRSxNQUFNLEVBQUMsQ0FBQzs7QUFFN0I7QUFDQUMsWUFBRyxDQUFDQyxxQkFBcUIsQ0FBQyxXQUFXLENBQUM7O0FBRXRDO0FBQ0E7QUFDQSxNQUFNQyxHQUFHLEdBQUksT0FBT0MsT0FBTyxLQUFLLFdBQVc7QUFDekNBLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDQyxxQkFBcUIsSUFBSUYsT0FBTyxDQUFDQyxHQUFHLENBQUNFLGNBQWMsSUFBSUgsT0FBTyxDQUFDQyxHQUFHLENBQUNHLGtCQUFrQixJQUFJSixPQUFPLENBQUNDLEdBQUcsQ0FBQ0ksa0JBQWtCLElBQUlMLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDSyx3QkFBd0IsSUFBSU4sT0FBTyxDQUFDQyxHQUFHLENBQUNNLGtCQUFrQixJQUFJUCxPQUFPLENBQUNDLEdBQUcsQ0FBQ08sZUFBZSxJQUFJUixPQUFPLENBQUNDLEdBQUcsQ0FBQ1EsWUFBWSxJQUFJVCxPQUFPLENBQUNDLEdBQUcsQ0FBQ1MsV0FBVyxJQUFJVixPQUFPLENBQUNDLEdBQUcsQ0FBQ1Usb0JBQW9CO0FBQ3ZVQyxTQUFVOztBQUVaO0FBQ0E7QUFDQSxNQUFNQyxlQUFlLEdBQUdBLENBQUND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