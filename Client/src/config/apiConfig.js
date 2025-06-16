const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_SERVER_URL || "http://localhost:8080";
  }
  return (
    import.meta.env.VITE_SERVER_URL || "https://quanlythucpham.onrender.com"
  );
};

export const API_BASE_URL = getApiBaseUrl();

// Tạo các endpoint tương ứng
export const API_URLS = {
  AUTH: `${API_BASE_URL}/auth`,
  PAYMENTS: `${API_BASE_URL}/api/payments`,
  CART: `${API_BASE_URL}/api/cart`,
  PRODUCTS: `${API_BASE_URL}/api/products`,
  CATEGORIES: `${API_BASE_URL}/api/categories`,
  ORDERS: `${API_BASE_URL}/api/orders`,
  ADMIN: `${API_BASE_URL}/api`,
  BRANCHES: `${API_BASE_URL}/api/branches`,
  DASHBOARD: `${API_BASE_URL}/api/dashboard`,
  CHATBOT: `${API_BASE_URL}/api/chatbot`,
  SCRAPER: `${API_BASE_URL}/api/scrape`,
  MESSAGES: `${API_BASE_URL}/api/messages`,
  REVIEWS: `${API_BASE_URL}/api/reviews`,
  TIPS: `${API_BASE_URL}/api`,
  CONTACT: `${API_BASE_URL}/api/contact`,
  COUPONS: `${API_BASE_URL}/api/coupons`,
  SAVED_VOUCHERS: `${API_BASE_URL}/api/saved-vouchers`,
};
