import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URLS } from '../../../config/apiConfig';

const LoginSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to extract data from URL hash fragment (#access_token=...)
  const getHashParams = () => {
    const hash = location.hash.substring(1);
    const params = {};
    
    if (!hash) return params;
    
    hash.split('&').forEach(param => {
      const [key, value] = param.split('=');
      params[key] = decodeURIComponent(value);
    });
    
    return params;
  };

  useEffect(() => {
    const processLogin = async () => {
      try {
        // First check if we have token in URL hash (Facebook login)
        const hashParams = getHashParams();
        
        if (hashParams.access_token) {
          // We have a Facebook access token
          await handleFacebookToken(hashParams.access_token);
          return;
        }
        
        // Check for error in the hash or URL
        if (hashParams.error) {
          setError(`Lỗi Facebook: ${hashParams.error_description || hashParams.error}`);
          toast.error(`Đăng nhập Facebook thất bại: ${hashParams.error_description || hashParams.error}`);
          setTimeout(() => navigate('/dang-nhap'), 2000);
          return;
        }
        
        // If not Facebook, check for parameters in URL (Google or server callback)
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const userId = searchParams.get('userId');
        const name = searchParams.get('name');
        const role = searchParams.get('role');

        if (token && userId) {
          // Handle standard token response
          localStorage.setItem('accessToken', token);
          
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
          
          localStorage.setItem('userId', userId);
          
          if (name) {
            localStorage.setItem('userName', name);
          }
          
          if (role) {
            localStorage.setItem('userRole', role);
          }

          toast.success('Đăng nhập thành công!');
          
          // Redirect based on role
          setTimeout(() => {
            if (role === 'admin') {
              navigate('/admin/products');
            } else {
              navigate('/');
            }
          }, 1000);
        } else {
          // If we don't have tokens in URL or hash, show error
          if (!hashParams.access_token) {
            setError('Thông tin đăng nhập không hợp lệ');
            navigate('/dang-nhap');
          }
        }
      } catch (error) {
        console.error('Lỗi xử lý đăng nhập:', error);
        setError('Đã xảy ra lỗi khi xử lý đăng nhập');
        toast.error('Đã xảy ra lỗi khi xử lý đăng nhập');
        setTimeout(() => navigate('/dang-nhap'), 1500);
      } finally {
        setLoading(false);
      }
    };

    processLogin();
  }, [searchParams, navigate, location]);

  // Handle Facebook token by calling your backend
  const handleFacebookToken = async (accessToken) => {
    try {
      console.log("Processing Facebook token:", accessToken.substring(0, 10) + "...");
      
      // Exchange Facebook token for your app's tokens
      const response = await axios.post(`${API_URLS.AUTH}/facebook-token`, {
        accessToken
      });

      if (response.data && (response.data.token || response.data.accessToken)) {
        const { token, refreshToken, user } = response.data;
        
        // Store tokens in localStorage
        localStorage.setItem('accessToken', token || response.data.accessToken);
        
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        
        if (user) {
          localStorage.setItem('userId', user.id);
          localStorage.setItem('userName', user.name);
          if (user.role) {
            localStorage.setItem('userRole', user.role);
          }
        }
        
        toast.success('Đăng nhập Facebook thành công!');
        
        // Redirect based on role
        const userRole = localStorage.getItem('userRole');
        setTimeout(() => {
          if (userRole === 'admin') {
            navigate('/admin/products');
          } else {
            navigate('/');
          }
        }, 1000);
      } else {
        throw new Error('Không nhận được token từ server');
      }
    } catch (error) {
      console.error('Lỗi xử lý token Facebook:', error);
      if (error.response) {
        console.error('Server response error:', error.response.data);
        setError(`Lỗi từ server: ${error.response.data.message || 'Lỗi không xác định'}`);
      } else if (error.request) {
        console.error('No response from server:', error.request);
        setError('Không thể kết nối đến server. Vui lòng thử lại sau.');
      } else {
        setError(error.message || 'Lỗi xử lý đăng nhập Facebook');
      }
      toast.error('Đăng nhập Facebook thất bại. Vui lòng thử lại');
      setTimeout(() => navigate('/dang-nhap'), 1500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Đang xử lý đăng nhập...</h2>
          <div className="w-12 h-12 border-4 border-t-[#51bb1a] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-red-600">{error}</h2>
          <p>Quay lại trang đăng nhập sau 2 giây...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4 text-green-600">Đăng nhập thành công!</h2>
        <p>Đang chuyển hướng...</p>
      </div>
    </div>
  );
};

export default LoginSuccess; 