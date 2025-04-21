import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

/**
 * Custom hook để tải thông tin người dùng từ API
 * @returns {Object} Trạng thái loading, thông tin user và hàm tải lại dữ liệu
 */
const useFetchUserProfile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      // Lấy token từ localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Bạn chưa đăng nhập');
        setLoading(false);
        return;
      }

      // Gọi API để lấy thông tin người dùng
      const response = await axios.get(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUserProfile(response.data.userProfile);
      } else {
        setError(response.data.message || 'Không thể tải thông tin người dùng');
      }
    } catch (err) {
      console.error('Lỗi khi tải thông tin người dùng:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  // Tải thông tin người dùng khi component được mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  return { loading, error, userProfile, refetch: fetchUserProfile };
};

export default useFetchUserProfile; 