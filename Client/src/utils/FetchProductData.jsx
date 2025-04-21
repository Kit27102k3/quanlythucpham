import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config/apiConfig';

/**
 * Custom hook để tải thông tin sản phẩm từ API
 * @returns {Object} Trạng thái loading, sản phẩm và hàm tải lại dữ liệu
 */
const useFetchProductData = () => {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);

  const fetchProductData = async () => {
    if (!slug) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/product/detail/${slug}`);
      
      if (response.data.success) {
        setProduct(response.data.product);
      } else {
        setError(response.data.message || 'Không thể tải thông tin sản phẩm');
      }
    } catch (err) {
      console.error('Lỗi khi tải thông tin sản phẩm:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Tải thông tin sản phẩm khi component được mount hoặc slug thay đổi
  useEffect(() => {
    fetchProductData();
  }, [slug]);

  return { loading, product, error, refetch: fetchProductData };
};

export default useFetchProductData; 