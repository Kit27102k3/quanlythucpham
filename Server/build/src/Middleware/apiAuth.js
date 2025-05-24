"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _dotenv = _interopRequireDefault(require("dotenv"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };} /* eslint-disable no-undef */

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfanNvbndlYnRva2VuIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfZG90ZW52IiwiZSIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwiZG90ZW52IiwiY29uZmlnIiwicGF0aCIsImFwaUF1dGgiLCJyZXEiLCJyZXMiLCJuZXh0IiwiYXV0aEhlYWRlciIsImhlYWRlcnMiLCJhdXRob3JpemF0aW9uIiwic3RhcnRzV2l0aCIsInN0YXR1cyIsImpzb24iLCJzdWNjZXNzIiwibWVzc2FnZSIsInRva2VuIiwic3BsaXQiLCJkZWNvZGVkIiwiand0IiwidmVyaWZ5IiwicHJvY2VzcyIsImVudiIsIkpXVF9TRUNSRVRfQUNDRVNTIiwidXNlciIsInJvbGUiLCJlcnJvciIsIm5hbWUiLCJjb25zb2xlIiwiX2RlZmF1bHQiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL01pZGRsZXdhcmUvYXBpQXV0aC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlZiAqL1xyXG5pbXBvcnQgand0IGZyb20gJ2pzb253ZWJ0b2tlbic7XHJcbmltcG9ydCBkb3RlbnYgZnJvbSAnZG90ZW52JztcclxuXHJcbmRvdGVudi5jb25maWcoe3BhdGg6ICcuZW52J30pO1xyXG5cclxuLyoqXHJcbiAqIE1pZGRsZXdhcmUgeMOhYyB0aOG7sWMgY2hvIEFQSSB0cnV5IGPhuq1wIE1vbmdvREJcclxuICogWcOqdSBj4bqndSBKV1QgdG9rZW4gaOG7o3AgbOG7hyB0cm9uZyBoZWFkZXIgQXV0aG9yaXphdGlvblxyXG4gKi9cclxuY29uc3QgYXBpQXV0aCA9IChyZXEsIHJlcywgbmV4dCkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICAvLyBM4bqleSB0b2tlbiB04burIGhlYWRlclxyXG4gICAgY29uc3QgYXV0aEhlYWRlciA9IHJlcS5oZWFkZXJzLmF1dGhvcml6YXRpb247XHJcbiAgICBcclxuICAgIGlmICghYXV0aEhlYWRlciB8fCAhYXV0aEhlYWRlci5zdGFydHNXaXRoKCdCZWFyZXIgJykpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiAnQXV0aGVudGljYXRpb24gcmVxdWlyZWQuIE1pc3Npbmcgb3IgaW52YWxpZCB0b2tlbiBmb3JtYXQuJ1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gTOG6pXkgdG9rZW4gdOG7qyBoZWFkZXJcclxuICAgIGNvbnN0IHRva2VuID0gYXV0aEhlYWRlci5zcGxpdCgnICcpWzFdO1xyXG4gICAgXHJcbiAgICBpZiAoIXRva2VuKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogJ0F1dGhlbnRpY2F0aW9uIHJlcXVpcmVkLiBObyB0b2tlbiBwcm92aWRlZC4nXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBWZXJpZnkgdG9rZW5cclxuICAgIGNvbnN0IGRlY29kZWQgPSBqd3QudmVyaWZ5KHRva2VuLCBwcm9jZXNzLmVudi5KV1RfU0VDUkVUX0FDQ0VTUyk7XHJcbiAgICBcclxuICAgIC8vIEzGsHUgdGjDtG5nIHRpbiB1c2VyIHbDoG8gcmVxdWVzdCDEkeG7gyBz4butIGThu6VuZyDhu58gY8OhYyBtaWRkbGV3YXJlIHbDoCBjb250cm9sbGVyIHRp4bq/cCB0aGVvXHJcbiAgICByZXEudXNlciA9IGRlY29kZWQ7XHJcbiAgICBcclxuICAgIC8vIEtp4buDbSB0cmEgcXV54buBbiB0cnV5IGPhuq1wIG7hur91IGPhuqduXHJcbiAgICBpZiAocmVxLnVzZXIucm9sZSAhPT0gJ2FkbWluJyAmJiByZXEudXNlci5yb2xlICE9PSAnbWFuYWdlcicpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiAnQWNjZXNzIGRlbmllZC4gSW5zdWZmaWNpZW50IHBlcm1pc3Npb25zLidcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIG5leHQoKTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgaWYgKGVycm9yLm5hbWUgPT09ICdKc29uV2ViVG9rZW5FcnJvcicpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiAnSW52YWxpZCB0b2tlbi4nXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZiAoZXJyb3IubmFtZSA9PT0gJ1Rva2VuRXhwaXJlZEVycm9yJykge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6ICdUb2tlbiBleHBpcmVkLidcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0FQSSBBdXRoZW50aWNhdGlvbiBFcnJvcjonLCBlcnJvcik7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgbWVzc2FnZTogJ0F1dGhlbnRpY2F0aW9uIGVycm9yLidcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFwaUF1dGg7ICJdLCJtYXBwaW5ncyI6IjtBQUNBLElBQUFBLGFBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLE9BQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQSxZQUE0QixTQUFBRCx1QkFBQUcsQ0FBQSxVQUFBQSxDQUFBLElBQUFBLENBQUEsQ0FBQUMsVUFBQSxHQUFBRCxDQUFB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