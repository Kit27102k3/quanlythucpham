/**
 * Extract authentication token from request
 * @param {Object} req - The request object
 * @returns {string|null} The extracted token or null if not found
 */
import jwt from 'jsonwebtoken';

export const getTokenFrom = (req) => {
  // Try to get token from authorization header
  if (req.headers && req.headers.authorization) {
    const auth = req.headers.authorization;
    if (auth.toLowerCase().startsWith('bearer ')) {
      return auth.substring(7);
    }
  }
  
  // Try to get from alternate authorization header format
  if (typeof req.get === 'function') {
    const auth = req.get('authorization');
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      return auth.substring(7);
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
export const getUserIdFromToken = (token) => {
  if (!token) return null;
  
  try {
    // Decode without verification
    const decoded = jwt.decode(token);
    return decoded && decoded.id ? decoded.id : null;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
}; 