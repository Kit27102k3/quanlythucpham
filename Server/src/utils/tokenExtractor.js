/**
 * Hàm trích xuất token từ request
 * Hỗ trợ lấy token từ Authorization header hoặc cookie
 */
export const getTokenFrom = (req) => {
  const authorization = req.headers.authorization;
  
  if (authorization && authorization.startsWith('Bearer ')) {
    // Lấy token từ Authorization header
    return authorization.replace('Bearer ', '');
  } else if (req.cookies && (req.cookies.token || req.cookies.accessToken)) {
    // Lấy token từ cookies
    return req.cookies.token || req.cookies.accessToken;
  }
  
  return null;
};

/**
 * Hàm trích xuất user ID từ token
 * Sử dụng khi cần lấy thông tin user ID mà không cần xác thực đầy đủ token
 */
export const getUserIdFromToken = (token) => {
  if (!token) return null;
  
  try {
    // Giải mã token để lấy payload
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    return payload.id || null;
  } catch (error) {
    console.error('Lỗi khi trích xuất ID từ token:', error);
    return null;
  }
}; 