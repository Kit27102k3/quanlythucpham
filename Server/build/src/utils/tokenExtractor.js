"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUserIdFromToken = exports.getTokenFrom = void 0;
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
/**
 * Extract authentication token from request
 * @param {Object} req - The request object
 * @returns {string|null} The extracted token or null if not found
 */

var getTokenFrom = exports.getTokenFrom = function getTokenFrom(req) {
  // Try to get token from authorization header
  if (req.headers && req.headers.authorization) {
    var auth = req.headers.authorization;
    if (auth.toLowerCase().startsWith('bearer ')) {
      return auth.substring(7);
    }
  }

  // Try to get from alternate authorization header format
  if (typeof req.get === 'function') {
    var _auth = req.get('authorization');
    if (_auth && _auth.toLowerCase().startsWith('bearer ')) {
      return _auth.substring(7);
    }
  }

  // Try to get from cookies
  if (req.cookies) {
    if (req.cookies.token) return req.cookies.token;
    if (req.cookies.accessToken) return req.cookies.accessToken;
  }
  return null;
};

/**
 * Get user ID from token without full verification
 * This function uses a simplified approach for extracting the payload
 * @param {string} token - JWT token
 * @returns {string|null} User ID or null if invalid/expired
 */
var getUserIdFromToken = exports.getUserIdFromToken = function getUserIdFromToken(token) {
  if (!token) return null;
  try {
    // Decode without verification
    var decoded = _jsonwebtoken["default"].decode(token);
    return (decoded === null || decoded === void 0 ? void 0 : decoded.id) || null;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
};