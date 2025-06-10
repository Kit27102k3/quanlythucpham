/* eslint-disable react/prop-types */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

// Tạo context cho authentication
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Kiểm tra trạng thái đăng nhập khi component được mount
  useEffect(() => {
    const checkAuthStatus = () => {
      // Kiểm tra token trong localStorage
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      if (token) {
        // Giả định là đã đăng nhập nếu có token
        setIsAuthenticated(true);
        
        // Có thể thêm một API call để lấy thông tin user từ token ở đây
        // Ví dụ: fetchUserProfile(token).then(userData => setUser(userData));
        
        // Giả định user data
        setUser({
          id: localStorage.getItem('userId') || 'unknown',
          name: localStorage.getItem('userName') || 'Người dùng',
        });
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Hàm đăng nhập
  const login = (userData, token) => {
    localStorage.setItem('accessToken', token);
    if (userData.id) {
      localStorage.setItem('userId', userData.id);
    }
    if (userData.name) {
      localStorage.setItem('userName', userData.name);
    }
    setIsAuthenticated(true);
    setUser(userData);
  };

  // Hàm đăng xuất
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    setUser(null);
  };

  // Cung cấp context value
  const contextValue = {
    isAuthenticated,
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook để sử dụng Auth Context
export function useAuth() {
  return useContext(AuthContext);
}

export { AuthContext }; 