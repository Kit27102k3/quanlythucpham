"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _dotenv = _interopRequireDefault(require("dotenv")); /* eslint-disable no-undef */

_dotenv.default.config({ path: '.env' });

/**
 * Middleware xác thực cho API truy cập MongoDB
 * Yêu cầu JWT token hợp lệ trong header Authorization
 */
const apiAuth = (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Missing or invalid token format.'
      });
    }

    // Lấy token từ header
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    // Verify token
    const decoded = _jsonwebtoken.default.verify(token, process.env.JWT_SECRET_ACCESS);

    // Lưu thông tin user vào request để sử dụng ở các middleware và controller tiếp theo
    req.user = decoded;

    // Kiểm tra quyền truy cập nếu cần
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    console.error('API Authentication Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};var _default = exports.default =

apiAuth;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfanNvbndlYnRva2VuIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfZG90ZW52IiwiZG90ZW52IiwiY29uZmlnIiwicGF0aCIsImFwaUF1dGgiLCJyZXEiLCJyZXMiLCJuZXh0IiwiYXV0aEhlYWRlciIsImhlYWRlcnMiLCJhdXRob3JpemF0aW9uIiwic3RhcnRzV2l0aCIsInN0YXR1cyIsImpzb24iLCJzdWNjZXNzIiwibWVzc2FnZSIsInRva2VuIiwic3BsaXQiLCJkZWNvZGVkIiwiand0IiwidmVyaWZ5IiwicHJvY2VzcyIsImVudiIsIkpXVF9TRUNSRVRfQUNDRVNTIiwidXNlciIsInJvbGUiLCJlcnJvciIsIm5hbWUiLCJjb25zb2xlIiwiX2RlZmF1bHQiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9NaWRkbGV3YXJlL2FwaUF1dGguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cclxuaW1wb3J0IGp3dCBmcm9tICdqc29ud2VidG9rZW4nO1xyXG5pbXBvcnQgZG90ZW52IGZyb20gJ2RvdGVudic7XHJcblxyXG5kb3RlbnYuY29uZmlnKHtwYXRoOiAnLmVudid9KTtcclxuXHJcbi8qKlxyXG4gKiBNaWRkbGV3YXJlIHjDoWMgdGjhu7FjIGNobyBBUEkgdHJ1eSBj4bqtcCBNb25nb0RCXHJcbiAqIFnDqnUgY+G6p3UgSldUIHRva2VuIGjhu6NwIGzhu4cgdHJvbmcgaGVhZGVyIEF1dGhvcml6YXRpb25cclxuICovXHJcbmNvbnN0IGFwaUF1dGggPSAocmVxLCByZXMsIG5leHQpID0+IHtcclxuICB0cnkge1xyXG4gICAgLy8gTOG6pXkgdG9rZW4gdOG7qyBoZWFkZXJcclxuICAgIGNvbnN0IGF1dGhIZWFkZXIgPSByZXEuaGVhZGVycy5hdXRob3JpemF0aW9uO1xyXG4gICAgXHJcbiAgICBpZiAoIWF1dGhIZWFkZXIgfHwgIWF1dGhIZWFkZXIuc3RhcnRzV2l0aCgnQmVhcmVyICcpKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogJ0F1dGhlbnRpY2F0aW9uIHJlcXVpcmVkLiBNaXNzaW5nIG9yIGludmFsaWQgdG9rZW4gZm9ybWF0LidcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEzhuqV5IHRva2VuIHThu6sgaGVhZGVyXHJcbiAgICBjb25zdCB0b2tlbiA9IGF1dGhIZWFkZXIuc3BsaXQoJyAnKVsxXTtcclxuICAgIFxyXG4gICAgaWYgKCF0b2tlbikge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6ICdBdXRoZW50aWNhdGlvbiByZXF1aXJlZC4gTm8gdG9rZW4gcHJvdmlkZWQuJ1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gVmVyaWZ5IHRva2VuXHJcbiAgICBjb25zdCBkZWNvZGVkID0gand0LnZlcmlmeSh0b2tlbiwgcHJvY2Vzcy5lbnYuSldUX1NFQ1JFVF9BQ0NFU1MpO1xyXG4gICAgXHJcbiAgICAvLyBMxrB1IHRow7RuZyB0aW4gdXNlciB2w6BvIHJlcXVlc3QgxJHhu4Mgc+G7rSBk4bulbmcg4bufIGPDoWMgbWlkZGxld2FyZSB2w6AgY29udHJvbGxlciB0aeG6v3AgdGhlb1xyXG4gICAgcmVxLnVzZXIgPSBkZWNvZGVkO1xyXG4gICAgXHJcbiAgICAvLyBLaeG7g20gdHJhIHF1eeG7gW4gdHJ1eSBj4bqtcCBu4bq/dSBj4bqnblxyXG4gICAgaWYgKHJlcS51c2VyLnJvbGUgIT09ICdhZG1pbicgJiYgcmVxLnVzZXIucm9sZSAhPT0gJ21hbmFnZXInKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogJ0FjY2VzcyBkZW5pZWQuIEluc3VmZmljaWVudCBwZXJtaXNzaW9ucy4nXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBuZXh0KCk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGlmIChlcnJvci5uYW1lID09PSAnSnNvbldlYlRva2VuRXJyb3InKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogJ0ludmFsaWQgdG9rZW4uJ1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgaWYgKGVycm9yLm5hbWUgPT09ICdUb2tlbkV4cGlyZWRFcnJvcicpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiAnVG9rZW4gZXhwaXJlZC4nXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjb25zb2xlLmVycm9yKCdBUEkgQXV0aGVudGljYXRpb24gRXJyb3I6JywgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6ICdBdXRoZW50aWNhdGlvbiBlcnJvci4nXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhcGlBdXRoOyAiXSwibWFwcGluZ3MiOiI7QUFDQSxJQUFBQSxhQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxPQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUEsWUFBNEIsQ0FGNUI7O0FBSUFFLGVBQU0sQ0FBQ0MsTUFBTSxDQUFDLEVBQUNDLElBQUksRUFBRSxNQUFNLEVBQUMsQ0FBQzs7QUFFN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNQyxPQUFPLEdBQUdBLENBQUNDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxJQUFJLEtBQUs7RUFDbEMsSUFBSTtJQUNGO0lBQ0EsTUFBTUMsVUFBVSxHQUFHSCxHQUFHLENBQUNJLE9BQU8sQ0FBQ0MsYUFBYTs7SUFFNUMsSUFBSSxDQUFDRixVQUFVLElBQUksQ0FBQ0EsVUFBVSxDQUFDRyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUU7TUFDcEQsT0FBT0wsR0FBRyxDQUFDTSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQztRQUMxQkMsT0FBTyxFQUFFLEtBQUs7UUFDZEMsT0FBTyxFQUFFO01BQ1gsQ0FBQyxDQUFDO0lBQ0o7O0lBRUE7SUFDQSxNQUFNQyxLQUFLLEdBQUdSLFVBQVUsQ0FBQ1MsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7SUFFdEMsSUFBSSxDQUFDRCxLQUFLLEVBQUU7TUFDVixPQUFPVixHQUFHLENBQUNNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDO1FBQzFCQyxPQUFPLEVBQUUsS0FBSztRQUNkQyxPQUFPLEVBQUU7TUFDWCxDQUFDLENBQUM7SUFDSjs7SUFFQTtJQUNBLE1BQU1HLE9BQU8sR0FBR0MscUJBQUcsQ0FBQ0MsTUFBTSxDQUFDSixLQUFLLEVBQUVLLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDQyxpQkFBaUIsQ0FBQzs7SUFFaEU7SUFDQWxCLEdBQUcsQ0FBQ21CLElBQUksR0FBR04sT0FBTzs7SUFFbEI7SUFDQSxJQUFJYixHQUFHLENBQUNtQixJQUFJLENBQUNDLElBQUksS0FBSyxPQUFPLElBQUlwQixHQUFHLENBQUNtQixJQUFJLENBQUNDLElBQUksS0FBSyxTQUFTLEVBQUU7TUFDNUQsT0FBT25CLEdBQUcsQ0FBQ00sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUM7UUFDMUJDLE9BQU8sRUFBRSxLQUFLO1FBQ2RDLE9BQU8sRUFBRTtNQUNYLENBQUMsQ0FBQztJQUNKOztJQUVBUixJQUFJLENBQUMsQ0FBQztFQUNSLENBQUMsQ0FBQyxPQUFPbUIsS0FBSyxFQUFFO0lBQ2QsSUFBSUEsS0FBSyxDQUFDQyxJQUFJLEtBQUssbUJBQW1CLEVBQUU7TUFDdEMsT0FBT3JCLEdBQUcsQ0FBQ00sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUM7UUFDMUJDLE9BQU8sRUFBRSxLQUFLO1FBQ2RDLE9BQU8sRUFBRTtNQUNYLENBQUMsQ0FBQztJQUNKOztJQUVBLElBQUlXLEtBQUssQ0FBQ0MsSUFBSSxLQUFLLG1CQUFtQixFQUFFO01BQ3RDLE9BQU9yQixHQUFHLENBQUNNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDO1FBQzFCQyxPQUFPLEVBQUUsS0FBSztRQUNkQyxPQUFPLEVBQUU7TUFDWCxDQUFDLENBQUM7SUFDSjs7SUFFQWEsT0FBTyxDQUFDRixLQUFLLENBQUMsMkJBQTJCLEVBQUVBLEtBQUssQ0FBQztJQUNqRCxPQUFPcEIsR0FBRyxDQUFDTSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQztNQUMxQkMsT0FBTyxFQUFFLEtBQUs7TUFDZEMsT0FBTyxFQUFFO0lBQ1gsQ0FBQyxDQUFDO0VBQ0o7QUFDRixDQUFDLENBQUMsSUFBQWMsUUFBQSxHQUFBQyxPQUFBLENBQUFDLE9BQUE7O0FBRWEzQixPQUFPIiwiaWdub3JlTGlzdCI6W119